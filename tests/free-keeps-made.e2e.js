// node tests/free-keeps-made.e2e.js (Playwright + Chromium; see tests/pw.js)
// One rule for every Pro gate: Pro locks making new things, never opening what someone already made. On the free plan (after Pro or
// the two free weeks end): a PDF with highlights opens view-only, a lecture recording's transcript opens, and every saved Focus routine
// keeps working. A PDF without highlights still asks for Pro, and so does highlighting more.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"});
  if (p === "/index.html" || /^\/bundle\/[^/]+\.js$/.test(p)) { res.end((/\.html$/.test(p) ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
function textPdf(){
  const page = lines => lines.map((l, i) => `BT /F1 14 Tf 72 ${700 - i * 24} Td (${l}) Tj ET`).join("\n");
  const c1 = page(["Chapter 4: The Cell", "Mitochondria produce most of the cell's ATP."]);
  const objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${c1.length} >>\nstream\n${c1}\nendstream`];
  let out = "%PDF-1.4\n"; const offs = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length; out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, "0") + " 00000 n \n").join("") + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
  return [...Buffer.from(out, "latin1")];
}
const pdfFile = (id, asset, hl) => Object.assign({id, name: id === "f1" ? "Reading 4.pdf" : "Reading 5.pdf", courseId: "c1", folderId: "other", kind: "file", taskIds: [], desc: "", url: "",
  revs: [{assetId: asset, name: "Reading.pdf", size: 1200, type: "application/pdf", at: 1}]}, hl ? {hl} : {});
const SEED = () => ({v: 2, updated: 1, decks: [], tasks: [], notes: [],
  settings: {routines: [{id: "r1", name: "Mine One", focus: 30, short: 5, long: 15, every: 4}, {id: "r2", name: "Mine Two", focus: 45, short: 10, long: 20, every: 3}]},
  files: [pdfFile("f1", "a-read4", [{id: "h1", p: 1, r: [[0.1, 0.1, 0.4, 0.03]], t: "Mitochondria produce most of the cell's ATP.", c: "yellow", at: 1, a: "a-read4"}]), pdfFile("f2", "a-read5"),
    {id: "f3", name: "Lecture 3", courseId: "c1", folderId: "lectures", kind: "file", taskIds: [], desc: "", url: "", dur: 120, tr: {text: "Today we cover the cell membrane."},
      revs: [{assetId: "a-rec3", name: "Lecture 3.webm", size: 900, type: "audio/webm", at: 1}]}],
  courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}]});

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 1100, height: 900}, serviceWorkers: "block"});
    await ctx.addInitScript(seed => {
      try {
        if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); }
        localStorage.setItem("studyboard:paywall-test", "1");
      } catch (e) {}
    }, SEED());
    const page = await ctx.newPage(); const errs = [];
    page.on("pageerror", e => errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.__sbProStudy && window.SBPRO);
    await page.waitForTimeout(700);
    const act = (a, id) => page.evaluate(([a, id]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id || ""]);
    const dlgText = () => page.evaluate(() => (document.querySelector("dialog[open]") || {}).textContent || "");
    const closeAll = () => page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    ok(await page.evaluate(() => SBPRO.locked()), "a free account with Pro switched on");

    // a PDF with highlights: View Highlights, opens view-only
    await page.evaluate(async bytes => { await window.__sbProStudy.idbSet("pdf:a-read4", new Blob([new Uint8Array(bytes)], {type: "application/pdf"})); await window.__sbProStudy.idbSet("pdf:a-read5", new Blob([new Uint8Array(bytes)], {type: "application/pdf"})); }, textPdf());
    ok(await page.evaluate(() => SBPRO.canRead(window.__sbProStudy.state().files.f1) && !SBPRO.canRead(window.__sbProStudy.state().files.f2)), "free: a PDF with highlights can be opened in the reader; one without can't");
    ok(/View Highlights/.test(await page.evaluate(() => SBPRO.fileBtns(window.__sbProStudy.state().files.f1))), "free: its button says View Highlights");
    await act("pdr-open", "f1"); await page.waitForSelector('.pdr-page[data-p="1"] .pdr-cv', {timeout: 15000}); await page.waitForTimeout(400);
    ok(await page.evaluate(() => !!document.querySelector('.pdr-sheet[data-view]') && !document.querySelector('.pdr-sheet [data-act="pde-ask"]') && !document.querySelector('.pdr-sheet [data-act="pde-mode"]')), "free: the reader opens view-only, without Ask, Study or Edit");
    ok(await page.locator(".pdr-sheet .pdr-modes").count() === 0, "free: no Read, Mark Up and Edit modes");
    ok(await page.locator('.pdr-page[data-p="1"] [data-h="h1"]').count() > 0, "free: the highlight already made is shown on the page");
    ok(/Highlighting more is part of Pro/.test(await dlgText()), "free: it says highlighting more is Pro");
    await page.click('[data-act="pdr-side"]'); await page.waitForTimeout(250);
    ok(/Mitochondria/.test(await page.textContent("#pdrSide")), "free: the Highlights list shows what was highlighted");
    await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "pdr-mode"; b.dataset.id = "mark"; document.querySelector(".pdr-sheet").appendChild(b); b.click(); b.remove(); }); await page.waitForTimeout(400);
    ok(await page.locator("dialog[open] .plan-sheet").count() === 1 && /reader with highlights is part of Studyboard Pro/.test(await dlgText()), "free: trying to mark up more opens the Pro sheet");
    await closeAll(); await page.waitForTimeout(200);
    await act("pdr-open", "f2"); await page.waitForTimeout(500);
    ok(await page.locator("dialog[open] .plan-sheet").count() === 1 && await page.locator(".pdr-sheet").count() === 0, "free: a PDF with nothing made in it still asks for Pro");
    await closeAll(); await page.waitForTimeout(200);

    // a lecture recording: its transcript opens
    ok(/Transcript/.test(await page.evaluate(() => SBPRO.fileBtns(window.__sbProStudy.state().files.f3))), "free: a recording keeps its Transcript button");
    await act("lec-file", "f3"); await page.waitForTimeout(800);
    ok(await page.locator("dialog[open] .plan-sheet").count() === 0 && /cell membrane/.test(await dlgText()), "free: the transcript opens, not the Pro sheet");
    await closeAll(); await page.waitForTimeout(200);

    // Focus routines saved during Pro keep working
    await act("pomo-open"); await page.waitForTimeout(400);
    await page.click('#pomoDlg .pr-chip[data-id="r2"]'); await page.waitForTimeout(400);
    ok(await page.locator("dialog[open] .plan-sheet").count() === 0 && await page.evaluate(() => window.__sbProStudy.state().settings.routine === "r2"), "free: the second routine of your own still works");

    ok(errs.length === 0, "no console errors: " + errs.join(" | "));
    console.log(`\nfree-keeps-made.e2e: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
