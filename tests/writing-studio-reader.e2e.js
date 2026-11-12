// node tests/writing-studio-reader.e2e.js
// Writing Studio from elsewhere in the app: Add to Paper in the PDF reader (selection and highlight; one paper goes straight in, several
// ask which; the PDF becomes a source; Undo; already-quoted highlights), and a broken-down paper's milestones opening the right tab with progress.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".xml": "application/xml", ".csl": "application/xml", ".webmanifest": "application/manifest+json"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"});
  if (p === "/index.html" || /^\/bundle\/[^/]+\.js$/.test(p)) { res.end((/\.html$/.test(p) ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const pad = x => String(x).padStart(2, "0"), day = off => { const d = new Date(); d.setDate(d.getDate() + off); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
// A one-page PDF of plain text lines, with a DOI in it
function textPdf(){
  const lines = ["Urban Heat and Green Space", "Parks in Phoenix were four degrees cooler than nearby blocks.", "Tree canopy explained most of the variation in temperature.", "doi:10.1037/0003-066X.59.1.29"];
  const c1 = lines.map((l, i) => `BT /F1 14 Tf 72 ${700 - i * 24} Td (${l}) Tj ET`).join("\n");
  const objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", `<< /Length ${c1.length} >>\nstream\n${c1}\nendstream`];
  let out = "%PDF-1.4\n"; const offs = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length; out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, "0") + " 00000 n \n").join("") + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
  return [...Buffer.from(out, "latin1")];
}
const ms = (id, title, i) => ({id, title, courseId: "c2", type: "Project", due: day(i + 1), start: day(i + 1), status: "todo", priority: "high", breakdownOf: "t1", step: `${i + 1}/4`, created: 10 + i});
function SEED(){
  return {v: 2, updated: 1, settings: {}, courses: [{id: "c2", name: "Writing and Rhetoric", code: "ENG 102", color: "#E0563B"}, {id: "c3", name: "Biology", code: "BIO 101", color: "#2E9E5B"}],
    tasks: [
      {id: "t1", title: "Research paper: urban heat", courseId: "c2", type: "Assignment", due: day(9), start: day(0), status: "todo", priority: "high", notes: "Use APA. Cite at least 4 sources.", created: 5, breakdownParent: true, bdDue: day(9), bdKind: "paper", bdHours: 12,
        ws: {style: "apa", src: [{id: "s1", type: "book", title: "Cities and climate change", author: [{family: "Ng", given: "Mo"}], issued: {"date-parts": [[2019]]}}], q: [], out: []}},
      {id: "t9", title: "Reflection essay", courseId: "c2", type: "Assignment", due: day(12), start: day(0), status: "todo", priority: "med", created: 6},
      {id: "x1", title: "Midterm", courseId: "c3", type: "Exam", due: day(6), status: "todo", priority: "high", created: 7},
      ms("m1", "Choose a topic and find 5 sources", 0), ms("m2", "Read and take notes on your sources", 1), ms("m3", "Write the outline (thesis + 3 sections)", 2), ms("m4", "Proofread, format the citations and submit", 3),
      {id: "m9", title: "Review chapters 1-3", courseId: "c3", type: "Reading", due: day(2), status: "todo", priority: "med", breakdownOf: "x1", step: "1/2", created: 20}],
    notes: [], decks: [],
    files: [{id: "f9", name: "Urban_heat_reading.pdf", courseId: "c2", folderId: "other", kind: "file", taskIds: ["t1"], desc: "", url: "", revs: [{assetId: "a-uh", name: "Urban_heat_reading.pdf", size: 1200, type: "application/pdf", at: 1}]}],
    events: []};
}
const DOI_CSL = {DOI: "10.1037/0003-066x.59.1.29", type: "journal-article", title: "How the mind hurts and heals the body", "container-title": "American Psychologist", volume: "59", issue: "1", page: "29-40", author: [{given: "Oakley", family: "Ray"}], issued: {"date-parts": [[2004]]}};
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const mkCtx = async (viewport, o) => {
    const ctx = await browser.newContext({viewport: viewport || {width: 1280, height: 900}, serviceWorkers: "block"});
    if (process.env.SB_NO_CITEPROC) await ctx.route(/citeproc\.js/, r => r.abort());
    await ctx.route(/doi\.org\/10\.1037/, r => r.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: JSON.stringify(DOI_CSL)}));
    await ctx.addInitScript(([seed, o]) => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } if (o && o.free) localStorage.setItem("studyboard:paywall-test", "1"); } catch (e) {} }, [SEED(), o || {}]);
    return ctx;
  };
  const open = async ctx => {
    const page = await ctx.newPage(); page.errs = [];
    page.on("pageerror", e => page.errs.push(e.message));
    page.on("console", m => { if (m.type() === "error" && !/Failed to load resource|ERR_FAILED/.test(m.text())) page.errs.push(m.text()); });
    await page.goto(base); await page.waitForFunction(() => window.__sbProStudy && window.SBWRITE); await page.waitForTimeout(600); return page;
  };
  const act = (page, a, id) => page.evaluate(([a, id]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id || ""]);
  const task = (page, id) => page.evaluate(id => window.__sbProStudy.state().tasks[id], id);
  const fits = page => page.evaluate(() => { const d = document.querySelector("dialog[open]"), w = document.documentElement; return w.scrollWidth <= w.clientWidth + 1 && (!d || [...d.querySelectorAll(".sheet-body, .sheet-foot, .tv-tools")].every(x => x.scrollWidth <= x.clientWidth + 1)); });
  const selectText = (page, words) => page.evaluate(words => {
    const span = [...document.querySelectorAll(".pdr-page .textLayer span")].find(s => s.textContent.includes(words));
    const tn = span.firstChild, r = document.createRange(), i = tn.textContent.indexOf(words);
    r.setStart(tn, i); r.setEnd(tn, i + words.length);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    span.dispatchEvent(new MouseEvent("mousedown", {bubbles: true})); span.dispatchEvent(new MouseEvent("mouseup", {bubbles: true}));
  }, words);

  const ctx = await mkCtx(), page = await open(ctx);
  /* Milestones open the paper's Studio on their step */
  const stepBtn = '#dlg[open] [data-act="ws-open"]';
  const STEPS = [["m1", "sources", /1 of 5 sources/], ["m2", "quotes", /0 quotes/], ["m3", "outline", /Start the outline/], ["m4", "check", /Check citations/]];
  for (const [id, tab, label] of STEPS) {
    await act(page, "edit-task", id); await page.waitForSelector(stepBtn);
    const b = page.locator(stepBtn);
    ok(await b.getAttribute("data-id") === "t1" && await b.getAttribute("data-ws-to") === tab && label.test(await b.textContent()), `milestone ${id} opens the paper's ${tab} tab: ${(await b.textContent()).trim()}`);
  }
  ok(await fits(page), "a milestone's task sheet still fits at 1280px");
  await page.click(stepBtn); await page.waitForSelector('#dlg[open] .ws-tab[aria-selected="true"]');
  ok(await page.textContent('#dlg[open] .ws-tab[aria-selected="true"]') === "Check" && /Research paper: urban heat/.test(await page.textContent("#dlg[open] .sheet-head")), "and the button opens it there");
  await page.keyboard.press("Escape"); await page.waitForTimeout(200);
  await act(page, "edit-task", "m9"); await page.waitForSelector("#dlg[open] .sheet-foot");
  ok(await page.locator(stepBtn).count() === 0, "an exam's study step has no Writing Studio");
  await page.keyboard.press("Escape"); await page.waitForTimeout(200);

  /* Add to Paper in the reader */
  await page.evaluate(async bytes => { await window.__sbProStudy.idbSet("pdf:a-uh", new Blob([new Uint8Array(bytes)], {type: "application/pdf"})); }, textPdf());
  await act(page, "f-open", "f9"); await page.waitForTimeout(250);
  await page.click('.fs-acts [data-act="pdr-open"]'); await page.waitForSelector(".pdr-page .textLayer span", {timeout: 15000});
  await selectText(page, "Parks in Phoenix were four degrees cooler"); await page.waitForTimeout(200);
  ok(await page.locator('.pdr-pop [data-act="pdr-sel-paper"]').count() === 1, "selecting text offers Add to Paper beside Note and Card");
  await page.click('.pdr-pop [data-act="pdr-sel-paper"]'); await page.waitForSelector('.pdr-pop [data-act="pdr-paper-to"]');
  const choices = await page.$$eval('.pdr-pop [data-act="pdr-paper-to"]', x => x.map(e => e.textContent.trim()));
  ok(choices.length === 2 && /Research paper/.test(choices[0]) && /Reflection essay/.test(choices[1]), "two papers in the course: it asks, the one the PDF is attached to first: " + choices.join(" | "));
  await page.click('.pdr-pop [data-act="pdr-paper-to"][data-t="t1"]'); await page.waitForTimeout(300);
  let t1 = await task(page, "t1"); const hl = await page.evaluate(() => window.__sbProStudy.state().files.f9.hl);
  const q = t1.ws.q[0], src = t1.ws.src.find(s => s.fid === "f9");
  ok(hl.length === 1 && q && q.hl === hl[0].id && q.t === "Parks in Phoenix were four degrees cooler" && q.p === "1" && q.fid === "f9", "the text is highlighted and becomes a quote with its page");
  ok(src && q.sid === src.id, "the PDF becomes one of the paper's sources");
  ok(/Quote added to Research paper: urban heat\. This PDF is now one of its sources/.test(await page.textContent("#toast")) && await page.locator("#toastUndo").isVisible() && /Open/.test(await page.textContent("#toastExtra")), "one message, with Undo and Open");
  await page.waitForFunction(() => { const s = window.__sbProStudy.state().tasks.t1.ws.src.find(x => x.fid === "f9"); return s && s.type === "article-journal"; }, null, {timeout: 15000});
  t1 = await task(page, "t1");
  ok(t1.ws.src.find(s => s.fid === "f9").title === "How the mind hurts and heals the body" && t1.ws.src.find(s => s.fid === "f9").id === src.id, "its details are filled in from the DOI in the PDF, keeping the same source");
  // the highlight now says it's in the paper
  const box = await page.evaluate(() => { const h = window.__sbProStudy.state().files.f9.hl[0], pg = document.querySelector('.pdr-page[data-p="1"]').getBoundingClientRect(), r = h.r[0]; return {x: pg.left + (r[0] + r[2] / 2) * pg.width, y: pg.top + (r[1] + r[3] / 2) * pg.height}; });
  await page.mouse.click(box.x, box.y); await page.waitForSelector(".pdr-pop");
  ok(/In Paper ✓/.test(await page.textContent(".pdr-pop")), "tapping a quoted highlight shows In Paper");
  await page.click('.pdr-pop [data-act="pdr-paper"]'); await page.waitForTimeout(200);
  ok(/Already a quote in Research paper/.test(await page.textContent("#toast")), "and doesn't add it twice");
  // one paper left in the course: straight in
  await page.evaluate(() => { window.__sbProStudy.state().tasks.t9.status = "done"; });
  await selectText(page, "Tree canopy explained most"); await page.waitForTimeout(200);
  await page.click('.pdr-pop [data-act="pdr-sel-paper"]'); await page.waitForTimeout(300);
  ok(await page.locator('.pdr-pop [data-act="pdr-paper-to"]').count() === 0 && (await task(page, "t1")).ws.q.length === 2, "with one open paper, it goes straight in");
  ok((await task(page, "t1")).ws.src.filter(s => s.fid === "f9").length === 1, "the PDF is still one source");
  await page.click("#toastUndo"); await page.waitForTimeout(300);
  ok((await task(page, "t1")).ws.q.length === 1 && (await page.evaluate(() => window.__sbProStudy.state().files.f9.hl.length)) === 2, "Undo takes the quote back out and keeps the highlight");
  ok(page.errs.length === 0, "no console errors: " + page.errs.join(" | "));
  // Open from the message lands on Quotes
  await selectText(page, "Tree canopy explained most"); await page.waitForTimeout(200);
  await page.click('.pdr-pop [data-act="pdr-sel-paper"]'); await page.waitForTimeout(300);
  await page.click("#toastExtra"); await page.waitForSelector('#dlg[open] .ws-tab[aria-selected="true"]');
  ok(await page.textContent('#dlg[open] .ws-tab[aria-selected="true"]') === "Quotes 2" || /Quotes/.test(await page.textContent('#dlg[open] .ws-tab[aria-selected="true"]')), "Open goes to the paper's Quotes");
  ok(await page.locator("#dlg[open] .ws-q").count() === 2, "with both quotes");
  await ctx.close();

  /* Phone */
  const pctx = await mkCtx({width: 390, height: 844}), pp = await open(pctx);
  await act(pp, "edit-task", "m1"); await pp.waitForSelector(stepBtn);
  ok(await fits(pp), "a milestone's task sheet fits at 390px");
  ok(pp.errs.length === 0, "no console errors (phone): " + pp.errs.join(" | "));
  await pctx.close();

  /* Free plan */
  const fctx = await mkCtx(null, {free: true}), fp = await open(fctx);
  await act(fp, "edit-task", "m1"); await fp.waitForSelector(stepBtn);
  ok(/PRO/.test(await fp.textContent(stepBtn)), "free accounts see PRO on a milestone's button");
  await fctx.close();

  await browser.close(); server.close();
  console.log(`writing-studio-reader.e2e: ${n} passed`);
})().catch(e => { console.error(e); process.exit(1); });
