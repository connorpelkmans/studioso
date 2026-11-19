// node tests/present-canva.e2e.js: presentation practice from Canva. Signed out, the sheet says how to download a design from
// Canva; connected (through the cloud-files function, stood in for here), your designs are listed and searchable, and one comes
// in as a PDF (how it looks) plus its PowerPoint copy's speaker notes and clicks; a pasted Canva link works too; and the
// presentation can get the latest from Canva later.
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let f; try { f = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const OUT = require("os").tmpdir() + "/sbcanva";
const SEED = {v: 2, updated: 1, tasks: [], files: [], notes: [], events: [], decks: [], settings: {}, courses: [{id: "c1", name: "Composition", code: "ENGL 102", color: "#7A4FD6"}]};
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) process.exitCode = 1; };
(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  const b = await chromium.launch({executablePath});
  const ctx = await b.newContext({viewport: {width: 1280, height: 860}, serviceWorkers: "block"});
  await ctx.addInitScript(s => { window.__SB_TEST = true; localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(s));
    new MutationObserver(() => document.querySelectorAll(".cpu").forEach(x => { try { x.hidePopover(); } catch (e) {} x.remove(); })).observe(document, {childList: true, subtree: true}); }, SEED);
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error" && !/Failed to load resource|WebSocket|realtime|supabase/i.test(m.text())) errs.push(m.text()); });
  await p.goto("http://127.0.0.1:" + port + "/index.html");
  await p.waitForFunction(() => window.__sbSync && window.SBPRESENT && document.readyState === "complete", null, {timeout: 20000}); await p.waitForTimeout(500);
  await p.evaluate(() => { const S = window.__sbSync; S.ui.tab = "flashcards"; S.ui.rvView = "present"; S.render(); });

  // signed out: how to download it from Canva
  await p.evaluate(() => window.SBPRESENT.add("")); await p.waitForSelector("#prFile", {state: "attached"});
  await p.click('[data-act="pr-canva"]'); await p.waitForSelector(".pr-canva"); await p.waitForTimeout(200);
  const so = await p.textContent(".pr-canva");
  ok(/Share, then Download/.test(so) && /PDF Standard/.test(so) && /Sign in to Studyboard to connect Canva/.test(so), "signed out, it says how to download from Canva: " + so.replace(/\s+/g, " ").slice(0, 120));
  await p.evaluate(() => document.querySelector("dialog[open]").close());

  // the cloud-files function, stood in for
  await p.evaluate(async () => {
    const bytes = async u => new Uint8Array(await (await fetch(u)).arrayBuffer());
    const pdf = await bytes("/tests/fixtures/present-deck.pdf"), pptx = await bytes("/tests/fixtures/present-anim.pptx");
    const W = window.__cv = {on: false, calls: [], slow: 1};
    window.__cfTransport = async body => {
      W.calls.push(body);
      if (body.action === "status") return {ok: true, status: 200, data: {providers: {google: true, canva: true}, accounts: W.on ? [{provider: "canva", account: "Maya Chen", status: "ok"}] : []}};
      if (body.action === "start") return {ok: true, status: 200, data: {url: "https://canva.invalid/connect"}};
      if (body.op === "designs") { const all = [{id: "DAFsleep001", title: "Teen Sleep Talk", pages: 6, updated: 1790000000, thumb: ""}, {id: "DAFbio00002", title: "Biology Poster", pages: 1, updated: 1789000000, thumb: ""}]; return {ok: true, status: 200, data: {items: all.filter(x => !body.query || x.title.toLowerCase().includes(body.query.toLowerCase())), continuation: ""}}; }
      if (body.op === "export") {
        if (body.design === "DAFnoaccess") return {ok: false, status: 404, data: {error: "no_access"}};
        if (body.format === "pdf" && !body.job && W.slow-- > 0) return {ok: true, status: 202, data: {job: "job-1"}};
        return {ok: true, status: 200, data: new Blob([body.format === "pptx" ? pptx : pdf])};
      }
      return {ok: false, status: 400, data: {}};
    };
  });
  await p.evaluate(() => window.SBPRESENT.add("")); await p.waitForSelector("#prFile", {state: "attached"});
  await p.click('[data-act="pr-canva"]'); await p.waitForSelector('.pr-canva [data-pr-cv-go]', {timeout: 5000});
  ok(/can only read your designs/.test(await p.textContent(".pr-canva")), "not connected yet: Connect Canva, read only");
  await p.screenshot({path: OUT + "-connect.png"});
  const [pop] = await Promise.all([ctx.waitForEvent("page").catch(() => null), p.click("[data-pr-cv-go]")]); if (pop) await pop.close();
  await p.evaluate(() => { window.__cv.on = true; window.dispatchEvent(new Event("focus")); });
  await p.waitForSelector(".pr-cv-i", {timeout: 8000}); await p.waitForTimeout(200);
  ok(await p.locator(".pr-cv-i").count() === 2 && /Maya Chen/.test(await p.textContent(".pr-cv-h")), "connected: your designs, and the account");
  await p.fill("#prCvQ", "sleep"); await p.waitForTimeout(1100);
  ok(await p.locator(".pr-cv-i").count() === 1 && await p.evaluate(() => window.__cv.calls.some(c => c.op === "designs" && c.query === "sleep")), "searching your designs");
  await p.screenshot({path: OUT + "-designs.png"});
  // a link to a design that isn't yours says why
  await p.fill("#prCvLink", "https://example.com/not-canva"); await p.press("#prCvLink", "Tab"); await p.waitForTimeout(200);
  ok(/isn't a Canva design link/.test(await p.textContent(".pr-canva")), "a link that isn't Canva's says so");
  await p.fill("#prCvLink", "https://www.canva.com/design/DAFnoaccess/abc/edit"); await p.press("#prCvLink", "Tab"); await p.waitForTimeout(800);
  ok(/didn't let Studyboard open that design/.test(await p.textContent(".pr-err")), "a design you can't open says why: " + await p.textContent(".pr-err"));
  // picking one: the PDF, plus the PowerPoint copy's notes and clicks
  await p.click('[data-act="pr-canva"]'); await p.waitForTimeout(100); await p.click('[data-act="pr-canva"]'); await p.waitForSelector(".pr-cv-i", {timeout: 8000});
  await p.click('.pr-cv-i[data-id="DAFsleep001"]'); await p.waitForSelector(".pr-picked", {timeout: 20000}); await p.waitForTimeout(300);
  const pk = await p.textContent(".pr-picked");
  ok(/6 slides/.test(pk) && /speaker notes found/.test(pk) && /a PDF can't show them, so they show finished and your clicks are counted/.test(pk), "the design comes in with its notes and clicks: " + pk.replace(/\s+/g, " "));
  ok(await p.inputValue("#prName") === "Teen Sleep Talk", "named after the design");
  ok(await p.evaluate(() => window.__cv.calls.filter(c => c.op === "export" && c.job === "job-1").length === 1), "a slow export is asked for again");
  await p.screenshot({path: OUT + "-picked.png"});
  await p.click('[data-act="pr-create"]'); await p.waitForSelector("#prStage .pr-play", {timeout: 15000}); await p.waitForTimeout(400);
  const pr = await p.evaluate(() => { const x = window.SBPRESENT.list()[0]; return {source: x.source, cid: x.cid, steps: x.steps, notes: (x.notesArr || []).filter(Boolean).length}; });
  ok(pr.source === "canva" && pr.cid === "DAFsleep001" && Array.isArray(pr.steps) && pr.steps[1] === 2 && pr.notes >= 5, "the presentation remembers its design, clicks and notes: " + JSON.stringify(pr));
  await p.click('#prStage [data-act="pr-cfresh"]'); await p.waitForTimeout(2500);
  ok(/Up to date with Canva/.test(await p.textContent("#prStage .pr-ready")), "Get Latest From Canva");
  ok(!errs.length, "no page errors: " + errs.join(" | "));
  await b.close(); server.close();
  console.log("present-canva.e2e: done" + (process.exitCode ? "" : ", all passed"));
})().catch(e => { console.error(e); process.exit(1); });
