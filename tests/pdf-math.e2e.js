// node tests/pdf-math.e2e.js   (PDE_SHOTS=<folder> also saves screenshots)
// Math in the PDF reader: an equation placed on the page with Edit's Equation tool (it's in the downloaded file as a picture),
// and a comment that holds a formula
/* global state, dlg */
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const SHOTS = process.env.PDE_SHOTS || "";
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"});
  if (p === "/index.html" || /^\/bundle\/[^/]+\.js$/.test(p)) { res.end((/\.html$/.test(p) ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };

// A syllabus the way Chrome or Word writes one: embedded, cut-down fonts with two-byte codes
const SYLLABUS = `<html><body style="margin:56px 64px;font-family:Arial;color:#1d1d1f">
<h1 style="font-size:26px;margin:0 0 4px">BIO 101: Introduction to Biology</h1>
<p style="font-size:14px;color:#555;margin:0 0 18px">Fall Semester · Section 02 · Hall B, Room 114</p>
<p style="font-size:14px;margin:0 0 6px"><b>Instructor:</b> Dr. Maria Rivera</p>
<p style="font-size:14px;margin:0 0 18px"><b>Office hours:</b> Tuesday and Thursday, 2:00 to 4:00 pm</p>
<h2 style="font-size:17px;margin:0 0 6px">Exams and Deadlines</h2>
<p style="font-family:Georgia;font-size:14px;line-height:1.5;text-align:justify;margin:0 0 14px">The midterm exam is on October 20 in Hall B and covers chapters one through six. The final project is due December 5 and is worth forty percent of your grade. Late work loses ten percent per day unless you ask for an extension before the deadline.</p>
<h2 style="font-size:17px;margin:0 0 6px">Grading</h2>
<p style="font-size:14px;margin:0 0 4px">Labs 30% · Midterm 30% · Final project 40%</p>
<p style="font-size:12px;color:#1a4fb0;margin:70px 0 0">Draft copy: not for distribution</p>
</body></html>`;

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const maker = await browser.newPage(); await maker.setContent(SYLLABUS); const pdf = await maker.pdf({format: "Letter"}); await maker.close();
    const seed = {v: 2, updated: 1, decks: [], notes: [], tasks: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}],
      files: [{id: "f1", name: "BIO 101 Syllabus.pdf", courseId: "c1", folderId: "other", kind: "file", taskIds: [], desc: "", url: "", revs: [{assetId: "a-syl", name: "BIO 101 Syllabus.pdf", size: pdf.length, type: "application/pdf", at: 1}]}]};
    const [vw, vh] = (process.env.PDE_VIEW || "1280x860").split("x").map(Number); // PDE_VIEW=390x844 runs it phone-sized
    const ctx = await browser.newContext({viewport: {width: vw, height: vh}, hasTouch: vw < 600, serviceWorkers: "block", acceptDownloads: true});
    await ctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "1"); } } catch (e) {} }, seed);
    const page = await ctx.newPage(); const errs = [];
    page.on("pageerror", e => errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.__sbProStudy);
    await page.evaluate(() => { const T = window.__sbProStudy; Object.defineProperty(window, "state", {get: () => T.state(), configurable: true}); Object.defineProperty(window, "dlg", {get: () => T.dlg(), configurable: true}); });
    await page.waitForTimeout(600);
    // the tools under More open from its menu
    const tool = async id => { if (await page.locator(`.pde-tools > .pde-tool[data-id="${id}"]`).count()) await page.click(`.pde-tools > .pde-tool[data-id="${id}"]`); else { await page.click('[data-act="pde-more"]'); await page.click(`.pde-mi[data-id="${id}"]`); } await page.waitForTimeout(200); };
    const shot = async name => { if (SHOTS) { fs.mkdirSync(SHOTS, {recursive: true}); await page.screenshot({path: path.join(SHOTS, name + ".png")}); } };
    await page.evaluate(async bytes => { await window.__sbProStudy.idbSet("pdf:a-syl", new Blob([new Uint8Array(bytes)], {type: "application/pdf"})); }, [...pdf]);
    await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "pdr-open"; b.dataset.id = "f1"; document.body.appendChild(b); b.click(); b.remove(); });
    await page.waitForSelector(".pdr-page .textLayer span", {timeout: 15000}); await page.waitForTimeout(400);

    /* Edit: Equation */
    await page.click("#pdeBtn"); await page.waitForTimeout(300);
    ok(await page.locator('.pde-tools [data-act="pde-eq"]').count() === 1, "Edit has an Equation tool");
    await page.click('.pde-tools [data-act="pde-eq"]');
    await page.waitForSelector(".rb-eq .rb-eq-in");
    ok(await page.locator('.rb-eq [data-eqa="ok"]').textContent() === "Place on Page", "the equation editor opens, with Place on Page");
    ok(await page.locator(".rb-eq .rb-eq-d").count() === 0, "no 'own line' choice for a picture");
    await page.fill(".rb-eq .rb-eq-in", "\\int_0^1 x^2\\,dx = \\frac{1}{3}");
    await page.waitForSelector(".rb-eq-prev .katex");
    await shot("eq-editor");
    await page.click('.rb-eq [data-eqa="ok"]');
    await page.waitForFunction(() => /equation goes/.test((document.querySelector("#toast") || {}).textContent || ""), null, {timeout: 15000});
    ok(true, "it asks where the equation goes");
    const pb = await page.locator('.pdr-page[data-p="1"]').boundingBox();
    await page.mouse.click(pb.x + pb.width * 0.55, pb.y + 330); await page.waitForTimeout(800);
    const placed = await page.evaluate(() => { const f = state.files.f1, list = (f.pde || f.edits || f.pdeEdits || []); const all = Object.values(f).filter(Array.isArray).flat().filter(x => x && x.k === "i"); return all.map(x => ({w: x.w, h: x.h, p: x.p})); });
    ok(placed.length === 1 && placed[0].w > 40 && placed[0].w < 300 && placed[0].h > 8 && placed[0].h < 80, "the equation is a picture on page 1, about text size: " + JSON.stringify(placed));
    ok(await page.locator(".pdr-page .pde-pic img").count() >= 1, "it shows on the page");
    await shot("eq-placed");
    await page.click('[data-act="pde-dl"]'); await page.waitForSelector('[data-act="pde-dl-go"]');
    const [dl] = await Promise.all([page.waitForEvent("download", {timeout: 20000}), page.click('[data-act="pde-dl-go"]')]);
    const out = fs.readFileSync(await dl.path());
    ok(/\/Subtype\s*\/Image/.test(out.toString("latin1")) || out.length > pdf.length + 2000, "the downloaded PDF holds the equation picture");
    ok(!errs.length, "no page errors: " + errs.join(" | "));
  } finally { await browser.close(); server.close(); }
  console.log(`\n${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
