// node tests/lms-ext-account.e2e.js
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
const ORIGIN = "https://school.instructure.com";
const iso = d => new Date(Date.now() + d * 864e5).toISOString();
const read = (id, name, title, at) => ({v: 1, id: "canvas", origin: ORIGIN, at, h: {ok: true, origin: ORIGIN, me: {id, name}, errors: [], courses: [
  {ou: "101", code: "BIOL 1200", name: "BIOL 1200 - Anatomy", staff: [], items: [{kind: "assignment", id: title, name: title, due: iso(4), start: null, end: null, text: "", url: "/courses/101/assignments/" + title, gid: "", outOf: 10, done: false, files: []}], events: [], grades: [], final: null, news: []}]}});

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const ctx = await browser.newContext({serviceWorkers: "block"}); await ctx.addInitScript(require("./consent-ok")); await ctx.route(/supabase\.co/, r => r.abort());
  await ctx.addInitScript(() => { try { localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [{id: "c1", name: "Anatomy", code: "BIOL 1200", color: "#1E9E74"}], tasks: [], settings: {}}));
    localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done"); } catch (e) {}
    window.__extList = []; window.__extGot = [];
    window.addEventListener("message", ev => { const d = ev.data; if (!d || d.source !== "studyboard-app") return; window.__extGot.push(d.type);
      if (d.type === "hello") window.postMessage({source: "studyboard-ext", type: "ready", version: "1.0.3"}, location.origin);
      if (d.type === "get") window.postMessage({source: "studyboard-ext", type: "data", version: "1.0.3", schools: [{id: "canvas", origin: "https://school.instructure.com", state: "ok", at: Date.now()}], list: window.__extList}, location.origin); }); });
  const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
  const titles = () => page.evaluate(() => Object.values(SBLMS.st().tasks).map(t => t.title).sort());
  const send = r => page.evaluate(r => { window.__extList = [r]; window.postMessage({source: "studyboard-app", type: "get"}, location.origin); }, r);
  await page.goto(base); await page.waitForFunction(() => window.SBLMS && SBLMS.canvas, null, {timeout: 40000});

  await send(read("1001", "Anna Student", "Anna Lab", Date.now() - 5000));
  await page.waitForSelector("#dlg[open] [data-ext-no]", {timeout: 20000});
  ok(/Anna Student/.test(await page.textContent("#dlg[open]")), "a new account is asked first, naming the school account the extension reads");
  ok((await titles()).length === 0, "nothing comes in before the answer");
  await page.click("#dlg[open] [data-submit]");
  await page.waitForFunction(() => Object.values(SBLMS.st().tasks).some(t => t.title === "Anna Lab"), null, {timeout: 20000});
  ok((await page.evaluate(() => SBLMS.canvas.cfg().extMe.key)) === "id:1001", "\"It's Me\" pairs this Studyboard account with that school account");

  await page.waitForTimeout(600);
  await send(read("1001", "Anna Student", "Anna Essay", Date.now() - 3000));
  await page.waitForFunction(() => Object.values(SBLMS.st().tasks).some(t => t.title === "Anna Essay"), null, {timeout: 20000});
  ok(!(await page.$("#dlg[open] [data-ext-no]")), "the paired school account's next read is imported without asking");

  await page.waitForTimeout(600);
  await send(read("2002", "Ben Other", "Ben Lab", Date.now() - 2000));
  await page.waitForSelector("#dlg[open] [data-ext-no]", {timeout: 20000});
  const txt = await page.textContent("#dlg[open]");
  ok(/A Different Canvas Account/.test(txt) && /Ben Other/.test(txt) && /Anna Student/.test(txt), "a read from a different school account asks, naming both");
  await page.click("#dlg[open] [data-ext-no]");
  await page.waitForTimeout(800);
  ok(!(await titles()).includes("Ben Lab"), "\"Not Me\" keeps the other person's work out");
  ok((await page.evaluate(() => SBLMS.canvas.cfg().extMe.key)) === "id:1001", "the pairing stays with the first school account");
  await send(read("2002", "Ben Other", "Ben Quiz", Date.now() - 1000));
  await page.waitForTimeout(1500);
  ok(!(await page.$("#dlg[open] [data-ext-no]")) && !(await titles()).includes("Ben Quiz"), "a school account turned down isn't asked about again, and its reads stay out");

  await page.evaluate(() => window.dispatchEvent(new Event("sb:signing-out")));
  await page.waitForTimeout(300);
  ok((await page.evaluate(() => window.__extGot)).includes("signout"), "signing out asks the extension to forget its reads");
  ok(!errs.length, "no page errors: " + errs.join(" | "));
  await browser.close(); server.close();
  console.log(`\nlms-ext-account.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
