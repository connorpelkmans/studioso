// node tests/lms-resync.e2e.js  A synced task moved away from what its school site says offers Resync in its window
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert"); const {chromium, executablePath} = require("./pw");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".json": "application/json", ".woff2": "font/woff2"};
const srv = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(r); });
(async () => {
  await new Promise(r => srv.listen(0, r)); const b = await chromium.launch({executablePath});
  const c = await b.newContext({viewport: {width: 1300, height: 860}});
  await c.addInitScript(() => { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1");
    const bs = ss => ({key: "7|lab", ou: "7", ss, sm: true, last: {}, seen: {feed: Date.now()}});
    localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [{id: "c1", name: "Biology", code: "BIOL 1200", color: "#D9622B"}], tasks: [
      {id: "t1", title: "Lab Report", courseId: "c1", type: "Assignment", due: "2026-11-20", status: "doing", bs: bs("todo")},
      {id: "t2", title: "Essay", courseId: "c1", type: "Assignment", due: "2026-11-21", status: "todo", bs: bs("todo")},
      {id: "t3", title: "Own Task", courseId: "c1", type: "Assignment", due: "2026-11-22", status: "doing"}], decks: [], notes: [], files: [], events: [], settings: {}, updated: 1})); });
  const pg = await c.newPage(); const errs = []; pg.on("pageerror", e => errs.push(e.message)); await pg.goto(`http://localhost:${srv.address().port}/`); await pg.waitForTimeout(1500);
  const open = async id => { await pg.evaluate(id => SBASSIST.jump({kind: "task", id}, {open: true}), id); await pg.waitForTimeout(600); return pg.evaluate(() => !!document.querySelector('#dlg [data-act="lms-resync"]')); };
  ok(await open("t1"), "a synced task moved away from what the school site says shows Resync beside Close");
  ok(await pg.evaluate(() => { const r = document.querySelector('#dlg [data-act="lms-resync"]'), x = document.querySelector('#dlg .occv-band [data-act="close"]'); return r.nextElementSibling === x; }), "Resync sits just left of Close");
  await pg.click('#dlg [data-act="lms-resync"]'); await pg.waitForTimeout(800);
  const after = await pg.evaluate(() => { const t = JSON.parse(localStorage.getItem("coursework:v2")).tasks; const x = (Array.isArray(t) ? t : Object.values(t)).find(y => y.id === "t1"); return {status: x.status, sm: x.bs.sm}; });
  ok(after.status === "todo" && !after.sm, "Resync puts it back to the school site's status and lets the sync update it again: " + JSON.stringify(after));
  ok(!(await pg.evaluate(() => !!document.querySelector('#dlg [data-act="lms-resync"]'))), "then Resync goes away");
  await pg.evaluate(() => document.getElementById("dlg").close());
  ok(!(await open("t2")), "a synced task in step with the school site has no Resync");
  await pg.evaluate(() => document.getElementById("dlg").close());
  ok(!(await open("t3")), "a task of the student's own has no Resync");
  ok(!errs.length, "no page errors: " + errs.join(" | "));
  await b.close(); srv.close(); console.log(`lms-resync.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
