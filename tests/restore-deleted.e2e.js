// node tests/restore-deleted.e2e.js  (Playwright + Chromium)
// A device whose data never synced (a fresh desktop install restored from the Studyboard folder, an old browser copy) must never bring back
// what the account deleted: on the first sign-in, anything in the account's deletion log is left out (kept in a device backup) and only the
// rest is uploaded. Another account's folder copy, or a restored copy that can't be checked, is set aside instead of merged in.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const DATA = {v: 2, updated: 1, settings: {}, courses: [{id: "c1", name: "Old Course", code: "OLD 100", color: "#1E9E74"}, {id: "c2", name: "Biology", code: "BIOL 1200", color: "#3B6FE0"}],
  tasks: [{id: "t1", title: "Old course essay", courseId: "c1", type: "Assignment", due: "2026-11-01", status: "todo"},
    {id: "t2", title: "Lab Report", courseId: "c2", type: "Lab", due: "2026-11-02", status: "todo"},
    {id: "t3", title: "Deleted quiz", courseId: "c2", type: "Quiz", due: "2026-11-03", status: "todo"}]};

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  // from: what the folder restore recorded (null: not restored); deleted: ids in the account's deletion log; fail: the log can't be read
  const run = async (from, deleted, fail) => {
    const ctx = await browser.newContext({serviceWorkers: "block"}); await ctx.route(/supabase\.co/, r => r.abort());
    await ctx.addInitScript(([d, from]) => { window.__SB_TEST = true; try { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1");
      localStorage.setItem("coursework:v2", JSON.stringify(d)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:tour", "done");
      if (from) localStorage.setItem("studyboard:folderFrom", from); } } catch (e) {} }, [DATA, from]);
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.__sbSync, null, {timeout: 40000});
    const r = await page.evaluate(async ([deleted, fail]) => {
      const S = window.__sbSync;
      S.useClient({from: () => ({select: () => ({in: async (col, ids) => fail ? {data: null, error: {message: "network"}} : {data: ids.filter(id => deleted.includes(id)).map(id => ({kind: id[0] === "c" ? "course" : "task", id})), error: null}})})});
      await S.claimDevice("user-1");
      const out = JSON.parse(localStorage.getItem(S.devKeys.OUTBOX) || "[]");
      return {courses: Object.keys(S.state.courses).sort(), tasks: Object.keys(S.state.tasks).sort(), queued: (Array.isArray(out) ? out : Object.values(out)).map(x => x.id || (x[1])).filter(Boolean).sort(),
        owner: localStorage.getItem(S.devKeys.OWNER), from: localStorage.getItem("studyboard:folderFrom")};
    }, [deleted, !!fail]);
    await page.waitForTimeout(1800);
    r.toast = await page.evaluate(() => document.querySelector("#toastMsg") ? document.querySelector("#toastMsg").textContent : "");
    r.errs = errs; await ctx.close(); return r;
  };

  let r = await run("?", ["c1", "t3"]);
  ok(JSON.stringify(r.courses) === '["c2"]' && JSON.stringify(r.tasks) === '["t2"]', "an old folder copy: the deleted course (and its task) and the deleted quiz are left out: " + JSON.stringify(r));
  ok(!r.queued.includes("c1") && !r.queued.includes("t1") && !r.queued.includes("t3") && r.queued.includes("t2") && r.queued.includes("c2"), "only what the account still has is uploaded: " + r.queued.join(","));
  ok(/left out, so they stay deleted/.test(r.toast), "and it says so: " + r.toast);
  ok(r.owner === "user-1" && r.from === null, "the device now belongs to the account, and the restore marker is cleared");

  r = await run("user-9", []);
  ok(!r.courses.length && !r.tasks.length && !r.queued.length, "another account's folder copy is set aside, never merged in: " + JSON.stringify(r));
  ok(/kept in a device backup/.test(r.toast), "and it says where it went: " + r.toast);

  r = await run("?", [], true);
  ok(!r.courses.length && !r.tasks.length && !r.queued.length, "a restored copy that can't be checked against the account is set aside too (the account's own data wins)");

  r = await run(null, [], true);
  ok(r.tasks.length === 3 && r.queued.includes("t1"), "work made on this device before the first sign-in (not a restore) still joins the account when the log can't be read");
  r = await run(null, ["t3"]);
  ok(JSON.stringify(r.tasks) === '["t1","t2"]' && !r.queued.includes("t3"), "and anything the account deleted is left out there too");
  ok(!r.errs.length, "no page errors: " + r.errs.join(" | "));
  await browser.close(); server.close();
  console.log(`\nrestore-deleted.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
