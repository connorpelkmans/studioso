// node tests/refresh-place.e2e.js (Playwright + Chromium) Refreshing keeps your place
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp.js"), root = path.join(__dirname, "..");
const server = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {"content-type": f.endsWith(".html") ? "text/html" : f.endsWith(".js") ? "text/javascript" : f.endsWith(".css") ? "text/css" : "application/octet-stream"});
  if (p === "/index.html") r.end(csp.apply(fs.readFileSync(f, "utf8"))); else fs.createReadStream(f).pipe(r); });
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath}), ctx = await browser.newContext({serviceWorkers: "block"}), errs = [];
  await ctx.addInitScript(() => { try { if (!localStorage.getItem("sb:onboarded")) { localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}], tasks: [], settings: {}}));
    localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {} });
  const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
  const ready = async p => { await p.waitForFunction(() => window.__sbProStudy, null, {timeout: 40000}); await p.waitForTimeout(800); };
  const here = p => p.evaluate(() => { const u = window.__sbProStudy.ui; return u.tab + (u.courseId ? ":" + u.courseId : ""); });
  await page.goto(base); await ready(page);
  ok(await here(page) === "board", "the app opens on Today's Plan");
  for (const [tab, course] of [["notes"], ["groups"], ["courses", "c1"], ["timeline"]]) {
    await page.evaluate(([t, c]) => { const H = window.__sbProStudy; H.ui.tab = t; H.ui.courseId = c || null; H.render(); }, [tab, course]); await page.waitForTimeout(200);
    await page.reload(); await ready(page);
    ok(await here(page) === tab + (course ? ":" + course : ""), `a refresh on ${tab}${course ? " (a course)" : ""} stays there: ${await here(page)}`);
  }
  const fresh = await ctx.newPage(); await fresh.goto(base); await ready(fresh);
  ok(await here(fresh) === "board", "opening the app in a new tab still starts on Today's Plan");
  ok(!errs.length, "no page errors: " + errs.join(" | "));
  await browser.close(); server.close();
  console.log(`\nrefresh-place.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
