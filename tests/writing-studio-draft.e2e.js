// node tests/writing-studio-draft.e2e.js
// Writing Studio's Check first: an attached draft offered on opening, the draft kept on the paper, its reference list read (DOI and ISBN entries
// looked up, the rest read from the list and marked to check), quoted passages offered as quotes, "what changed since the last check", an issue shown
// in the draft, the tab order and keys, the strip at the top, sources' use, the assignment's minimum, Also Add to Another Paper, a Break It Down step
// ticked, the draft picker (a note), highlighting from inside Writing Studio (and the reader's bar from anywhere), the Board chip, Today's Plan row,
// Review's Writing view with My Library, and phone width.
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
const DRAFT = `Cities are warming fast, and the evidence is clear. Parks in Phoenix were "on average four degrees cooler than the surrounding blocks" (Smith & Lee, 2021, p. 104). Ray (2004) shows that "how the mind hurts and heals the body depends on stress" (Ray, 2004, p. 31). Kahneman (2011) describes fast thinking. Ng (2019) argues that cities must plan for heat. Others disagree (Johnson, 2018).

References
Kahneman, D. (2011). Thinking, fast and slow. Farrar, Straus and Giroux. ISBN 978-0-374-27563-1
Ng, M. (2019). Cities and climate change. Routledge.
Ray, O. (2004). How the mind hurts and heals the body. American Psychologist, 59(1), 29–40. https://doi.org/10.1037/0003-066X.59.1.29
Smith, J. A., & Lee, K. (2021). The urban heat island effect and green infrastructure. Urban Climate, 38(2), 100–118.`;
const NOTE = "Second draft notes\n" + "Trees in the city cool the streets and shade the people who wait for buses in the summer. ".repeat(6) + "\n\nReferences\nNg, M. (2019). Cities and climate change. Routledge.";
function textPdf(){
  const lines = ["Urban Heat and Green Space", "Parks in Phoenix were four degrees cooler than nearby blocks.", "Tree canopy explained most of the variation in temperature."];
  const c1 = lines.map((l, i) => `BT /F1 14 Tf 72 ${700 - i * 24} Td (${l}) Tj ET`).join("\n");
  const objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", `<< /Length ${c1.length} >>\nstream\n${c1}\nendstream`];
  let out = "%PDF-1.4\n"; const offs = [];
  objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length; out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, "0") + " 00000 n \n").join("") + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
  return [...Buffer.from(out, "latin1")];
}
// The user's example: an MLA draft with (Walker, 112), (Carskadon 2011), (Lo et al.) and (Ray 30), and a list headed References
const MLA_SRC = [{id: "mw", type: "book", title: "Why We Sleep: Unlocking the Power of Sleep and Dreams", author: [{family: "Walker", given: "Matthew"}], issued: {"date-parts": [[2017]]}, publisher: "Scribner"},
  {id: "mc", type: "article-journal", title: "Sleep Deprivation in Adolescents", author: [{family: "Carskadon", given: "Mary A."}], issued: {"date-parts": [[2011]]}, "container-title": "Pediatric Clinics of North America", volume: "58", issue: "3", page: "637–647", DOI: "10.1016/j.pcl.2011.03.003"},
  {id: "ml", type: "webpage", title: "How Much Sleep Do Teens Need", author: [{family: "Lo", given: "June C."}, {family: "Ong", given: "Ju Lynn"}, {family: "Chee", given: "Michael W. L."}], issued: {"date-parts": [[2016, 5, 2]]}, "container-title": "Sleep Foundation", URL: "https://www.sleepfoundation.org/teens"},
  {id: "mr", type: "article-journal", title: "Stress and the Teenage Brain", author: [{family: "Ray", given: "Oakley"}], issued: {"date-parts": [[2004]]}, "container-title": "American Psychologist", volume: "59", issue: "1", page: "29–40"}];
const MLA_DRAFT = `Teenagers are chronically short on sleep, and it shows in class. Short sleep blunts memory (Walker, 112). The body clock shifts later in adolescence (Carskadon 2011), so early starts hurt. Most teens need eight to ten hours (Lo et al.). Stress makes it worse (Ray 30), and naps only help a little (Walker, 140).

References

Carskadon, Mary A. "Sleep Deprivation in Adolescents." Pediatric Clinics of North America, vol. 58, no. 3, 2011, pp. 637-47, https://doi.org/10.1016/j.pcl.2011.03.003.

Lo, June C., et al. "How Much Sleep Do Teens Need." Sleep Foundation, 2 May 2016, https://www.sleepfoundation.org/teens.

Ray, Oakley. "Stress and the Teenage Brain." American Psychologist, vol. 59, no. 1, 2004, pp. 29-40.

Walker, Matthew. Why We Sleep: Unlocking the Power of Sleep and Dreams. 2017.`;
const SHOTS = "/tmp/claude-0/-home-user-studioso/ae81c5c9-6cd9-539f-8cd9-400a34421d33/scratchpad/wsfmt/";
function SEED(){
  return {v: 2, updated: 1, settings: {}, courses: [{id: "c2", name: "Writing and Rhetoric", code: "ENG 102", color: "#E0563B"}, {id: "c3", name: "Health Science", code: "HSC 110", color: "#2E8A52"}],
    tasks: [
      {id: "t1", title: "Research paper: urban heat", courseId: "c2", type: "Assignment", due: day(9), start: day(0), status: "todo", priority: "high", notes: "Use APA. Cite at least 3 sources.", created: 5},
      {id: "t3", title: "Reflection essay", courseId: "c2", type: "Assignment", due: day(12), start: day(0), status: "todo", priority: "med", created: 6},
      {id: "t4", title: "Policy brief", courseId: "c2", type: "Assignment", due: day(1), start: day(0), status: "todo", priority: "med", created: 7,
        ws: {style: "apa", src: [{id: "p1", type: "book", title: "Cities and climate change", author: [{family: "Ng", given: "Mo"}], issued: {"date-parts": [[2019]]}}], q: [], out: [], draft: {t: "A brief on heat. Ng (2019) says plan ahead.\n\nReferences\nNg, M. (2019). Cities and climate change. Routledge.", from: "Pasted", at: 1}}},
      {id: "t5", title: "Sleep and teens essay", courseId: "c3", type: "Assignment", due: day(20), start: day(0), status: "todo", priority: "med", created: 8,
        ws: {style: "modern-language-association", src: MLA_SRC, q: [], out: [], draft: {t: MLA_DRAFT, from: "Pasted", at: 1}}},
      {id: "m1", title: "Find 4 sources", courseId: "c2", type: "Project", due: day(2), start: day(0), status: "todo", priority: "med", breakdownOf: "t1", step: "1/2", created: 10},
      {id: "m4", title: "Format the citations", courseId: "c2", type: "Project", due: day(1), start: day(0), status: "todo", priority: "med", breakdownOf: "t4", step: "1/2", created: 11},
      {id: "m5", title: "Proofread the citations and submit", courseId: "c2", type: "Project", due: day(1), start: day(0), status: "todo", priority: "med", breakdownOf: "t4", step: "2/2", created: 12}],
    notes: [{id: "n7", text: NOTE, courseId: "c2", x: 40, y: 40, z: 1, created: 3}], decks: [],
    files: [
      {id: "fd", name: "Essay draft.txt", courseId: "c2", folderId: "other", kind: "file", taskIds: ["t1"], desc: "", url: "", revs: [{assetId: "a-draft", name: "Essay draft.txt", size: DRAFT.length, type: "text/plain", at: 2}]},
      {id: "f9", name: "Urban_heat_reading.pdf", courseId: "c2", folderId: "other", kind: "file", taskIds: [], desc: "", url: "", revs: [{assetId: "a-uh", name: "Urban_heat_reading.pdf", size: 1200, type: "application/pdf", at: 1}]}],
    events: []};
}
const DOI_CSL = {DOI: "10.1037/0003-066x.59.1.29", type: "journal-article", title: "How the mind hurts and heals the body", "container-title": "American Psychologist", volume: "59", issue: "1", page: "29-40", author: [{given: "Oakley", family: "Ray"}], issued: {"date-parts": [[2004]]}};
const OL = {"ISBN:9780374275631": {title: "Thinking, Fast and Slow", authors: [{name: "Daniel Kahneman"}], publishers: [{name: "Farrar, Straus and Giroux"}], publish_places: [{name: "New York"}], publish_date: "2011"}};
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const mkCtx = async viewport => {
    const ctx = await browser.newContext({viewport: viewport || {width: 1280, height: 900}, serviceWorkers: "block"});
    ctx.calls = [];
    if (process.env.SB_NO_CITEPROC) await ctx.route(/citeproc\.js/, r => r.abort());
    await ctx.route(/doi\.org\/10\.1037/, r => { ctx.calls.push(r.request().url()); r.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: JSON.stringify(DOI_CSL)}); });
    await ctx.route(/openlibrary\.org\/api\/books/, r => { ctx.calls.push(r.request().url()); r.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: JSON.stringify(OL)}); });
    await ctx.addInitScript(([seed, draft]) => {
      try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {}
      // the draft file's bytes, as the file reader would fetch them
      window.__sxBytes = id => id === "a-draft" ? new TextEncoder().encode(draft) : null;
    }, [SEED(), DRAFT]);
    return ctx;
  };
  const open = async ctx => {
    const page = await ctx.newPage(); page.errs = [];
    page.on("pageerror", e => page.errs.push(e.message));
    page.on("console", m => { if (m.type() === "error" && !/Failed to load resource|ERR_FAILED/.test(m.text())) page.errs.push(m.text()); });
    await page.goto(base); await page.waitForFunction(() => window.__sbProStudy && window.SBWRITE); await page.waitForTimeout(600); return page;
  };
  const act = (page, a, id, extra) => page.evaluate(([a, id, extra]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; Object.assign(b.dataset, extra || {}); b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id || "", extra || {}]);
  const task = (page, id) => page.evaluate(id => window.__sbProStudy.state().tasks[id], id);
  const fits = page => page.evaluate(() => { const d = document.querySelector("dialog[open]"), w = document.documentElement; return w.scrollWidth <= w.clientWidth + 1 && (!d || [...d.querySelectorAll(".sheet-body, .sheet-foot, .ws-strip, .ws-ref, .ws-q, .ws-acts, .ws-row, .ws-found, .ws-dv, .ws-draft, .pdr-ws")].every(x => x.scrollWidth <= x.clientWidth + 1)); });
  const selTab = page => page.textContent('#dlg[open] .ws-tab[aria-selected="true"]');
  const selectText = (page, words) => page.evaluate(words => {
    const span = [...document.querySelectorAll(".pdr-page .textLayer span")].find(s => s.textContent.includes(words));
    const tn = span.firstChild, r = document.createRange(), i = tn.textContent.indexOf(words);
    r.setStart(tn, i); r.setEnd(tn, i + words.length);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    span.dispatchEvent(new MouseEvent("mousedown", {bubbles: true})); span.dispatchEvent(new MouseEvent("mouseup", {bubbles: true}));
  }, words);

  const ctx = await mkCtx(), page = await open(ctx);
  /* Check first: the attached draft is offered */
  await act(page, "ws-open", "t1"); await page.waitForSelector("#dlg[open] .ws-tab");
  ok(/^Check/.test(await selTab(page)), "a paper with no sources opens on Check");
  ok((await page.$$eval("#dlg[open] .ws-tab", x => x.map(e => e.textContent.replace(/\s*\d+$/, "").trim()))).join() === "Check My Doc,Sources,Quotes,Outline", "the tabs: Check My Doc, Sources, Quotes, Outline");
  ok(/Use Essay draft\.txt\?/.test(await page.textContent("#dlg[open] .ws-offer")), "the draft attached to the assignment is offered");
  ok(/0 sources · 0 quotes · 0 placed · no draft yet/.test((await page.textContent("#dlg[open] .ws-strip")).replace(/\s+/g, " ")), "the strip: " + (await page.textContent("#dlg[open] .ws-strip")).replace(/\s+/g, " ").trim());
  await page.click("#dlg[open] .ws-offer [data-ws-dsel]"); await page.waitForSelector("#dlg[open] .ws-found");
  let t1 = await task(page, "t1");
  ok(t1.ws.draft && t1.ws.draft.from === "Essay draft.txt" && t1.ws.draft.fid === "fd" && /Others disagree/.test(t1.ws.draft.t) && t1.ws.chk && t1.ws.chk.h === t1.ws.draft.h, "Use It keeps the draft on the paper and checks it");
  // the draft's list: its four entries go onto Sources by themselves (a DOI and an ISBN looked up, the rest read from the list)
  await page.waitForFunction(() => window.__sbProStudy.state().tasks.t1.ws.src.length === 4, null, {timeout: 15000}); await page.waitForTimeout(400);
  ok(/Added 4 sources from your draft's list to Sources\. The ones read from your list \(no DOI or ISBN\) are marked there/.test(await page.textContent("#dlg[open]")), "the four entries in its list are added to Sources by themselves, and it says so");
  ok(ctx.calls.length === 2 && ctx.calls.every(u => /doi\.org\/10\.1037\/0003-066X\.59\.1\.29$|openlibrary\.org\/api\/books\?bibkeys=ISBN:9780374275631&/.test(u)), "only the identifiers are sent: " + ctx.calls.join(" | "));
  t1 = await task(page, "t1");
  const bySrc = s => t1.ws.src.find(x => x.title && x.title.toLowerCase().startsWith(s.toLowerCase()));
  ok(bySrc("How the mind").DOI === "10.1037/0003-066x.59.1.29" && !bySrc("How the mind").rv && bySrc("Cities and climate").rv === "1" && bySrc("The urban heat").rv === "1", "looked-up sources come in whole, the others marked to check");
  ok((await task(page, "m1")).status === "done", "the Break It Down step “Find 4 sources” is ticked done");
  await page.waitForSelector("#dlg[open] .ws-diff");
  ok(/Since your last check: \d+ fixed/.test(await page.textContent("#dlg[open] .ws-diff")), "what changed since the last check: " + await page.textContent("#dlg[open] .ws-diff"));
  // quotes in the draft, tied to their source and page
  const qrows = await page.$$eval("#dlg[open] .ws-fq li", x => x.map(e => e.textContent.replace(/\s+/g, " ")));
  ok(qrows.length === 2 && /four degrees cooler/.test(qrows[0]) && /p\. 104/.test(qrows[0]), "two quoted passages offered as quotes");
  ok(await page.inputValue("[data-wf-qs] >> nth=0") === bySrc("The urban heat").id && await page.inputValue("[data-wf-qs] >> nth=1") === bySrc("How the mind").id, "each tied to its source");
  await page.click("[data-wf-addq]"); await page.waitForFunction(() => (window.__sbProStudy.state().tasks.t1.ws.q || []).length === 2);
  t1 = await task(page, "t1");
  ok(t1.ws.q[0].p === "104" && t1.ws.q[0].sid === bySrc("The urban heat").id && t1.ws.q[1].p === "31", "quotes added with their pages");
  ok(await page.locator("#dlg[open] .ws-fq").count() === 0, "and they're not offered again");
  // an issue shown in the draft
  const jb = page.locator("#dlg[open] .ws-is-b", {hasText: "Johnson"}); await jb.click(); await page.waitForSelector("#dlg[open] .ws-dv .ws-mark");
  ok((await page.textContent("#dlg[open] .ws-dv .ws-mark")).trim() === "Others disagree (Johnson, 2018)." && /\(Johnson, 2018\)/.test(await page.textContent("#dlg[open] .ws-mark b")), "clicking an issue shows its sentence, marked, in the draft");
  ok(await page.evaluate(() => { const dv = document.querySelector(".ws-dv"), m = dv.querySelector(".ws-mark").getBoundingClientRect(), b = dv.getBoundingClientRect(); return m.top >= b.top - 1 && m.bottom <= b.bottom + 1; }), "and scrolls it into view");
  ok(await fits(page), "Check fits at 1280px");
  // the strip and the tab keys
  ok(/4 sources · 2 quotes · 0 placed · check: \d+ to fix/.test((await page.textContent("#dlg[open] .ws-strip")).replace(/\s+/g, " ")), "the strip follows: " + (await page.textContent("#dlg[open] .ws-strip")).replace(/\s+/g, " ").trim());
  await page.focus('#dlg[open] [data-ws-tab="check"]'); await page.keyboard.press("ArrowRight");
  ok(/^Sources/.test(await selTab(page)) && await page.evaluate(() => document.activeElement.dataset.wsTab) === "sources", "Arrow Right goes from Check to Sources");
  await page.keyboard.press("ArrowLeft"); await page.keyboard.press("ArrowLeft");
  ok(/^Outline/.test(await selTab(page)), "and Arrow Left wraps from Check to Outline");
  await page.click('#dlg[open] .ws-strip [data-ws-go="sources"]'); await page.waitForSelector("#dlg[open] .ws-refs");
  const srcTxt = (await page.textContent("#dlg[open] .ws-refs")).replace(/\s+/g, " ");
  ok(/Quoted once · Cited in draft ✓/.test(srcTxt) && /No quotes yet · Cited in draft ✓/.test(srcTxt), "sources show their use");
  ok(/4 of 3 sources the assignment asks for ✓/.test(await page.textContent("#dlg[open] .ws-goal")), "the assignment's minimum, as a bar");
  ok(await page.locator("#dlg[open] .ws-rv").count() === 2 && await page.locator("#dlg[open] [data-ws-ccopy]").count() === 4 && await page.locator("#dlg[open] [data-ws-attach]").count() === 4, "marked sources say to check them; each has Copy In-Text and Attach PDF");
  // Also Add to Another Paper
  await page.fill("[data-ws-in]", "978-0-374-27563-1"); await page.click("[data-ws-add]"); await page.waitForSelector(".ws-err");
  ok(/already in your list/.test(await page.textContent(".ws-err")), "a duplicate by ISBN is caught");
  await page.click('[data-ws-edit]:not(.link-btn) >> nth=0'); await page.waitForSelector('[data-wf="title"]'); await page.click("[data-ws-cancel]");
  await page.click("[data-ws-manual]"); await page.fill('[data-wf="title"]', "Heat action plans"); await page.fill('[data-wf="author"]', "City of Phoenix"); await page.fill('[data-wf="y"]', "2022"); await page.click("[data-ws-esave]");
  await page.waitForSelector("#dlg[open] .ws-also");
  ok(/Also add it to another paper\?/.test(await page.textContent("#dlg[open] .ws-also")) && await page.locator('[data-ws-also="t3"]').count() === 1 && await page.locator('[data-ws-also="t4"]').count() === 1, "after adding a source: Also add it to another paper? (same course)");
  await page.click('[data-ws-also="t3"]'); await page.waitForTimeout(200);
  ok(((await task(page, "t3")).ws.src || []).some(s => s.title === "Heat action plans"), "it's added to the other paper too");
  // reopening lands on Check, with the last check
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  await act(page, "ws-open", "t1"); await page.waitForSelector("#dlg[open] .ws-tab");
  ok(/^Check/.test(await selTab(page)) && /Checked today/.test(await page.textContent("#dlg[open] .ws-draft")), "opening again: Check, with the saved draft and its last check");
  // Replace: the picker, a note as the draft
  await page.click("[data-ws-redo]"); await page.click("[data-ws-dpick]"); await page.waitForSelector("#dlg[open] .ws-flist");
  const heads = await page.$$eval("#dlg[open] .ws-body h3.fsec", x => x.map(e => e.textContent));
  ok(heads.join() === "This Assignment,This Course,Your Notes", "the picker: this assignment's files first, then the course's, then notes: " + heads.join());
  await page.fill("[data-wp-q]", "second draft"); await page.waitForTimeout(400);
  ok(await page.locator("#dlg[open] [data-ws-dsel]").count() === 1, "search narrows the list");
  await page.click("#dlg[open] [data-ws-dsel]"); await page.waitForSelector("#dlg[open] .ws-draft");
  t1 = await task(page, "t1");
  ok(t1.ws.draft.nid === "n7" && t1.ws.draft.from === "Second draft notes", "a note can be the draft");
  ok(page.errs.length === 0, "no console errors: " + page.errs.join(" | "));

  /* Highlighting from inside Writing Studio */
  await page.evaluate(async bytes => { await window.__sbProStudy.idbSet("pdf:a-uh", new Blob([new Uint8Array(bytes)], {type: "application/pdf"})); }, [...textPdf()]);
  await page.click('#dlg[open] [data-ws-tab="quotes"]'); await page.click("#dlg[open] [data-ws-hlpdf]"); await page.waitForSelector("#dlg[open] [data-wp-open]");
  ok(/This Course/.test(await page.textContent("#dlg[open] .ws-body")) && await page.locator('[data-wp-open="f:f9"]').count() === 1, "Open a PDF to Highlight lists the course's PDFs");
  await page.click('[data-wp-open="f:f9"]'); await page.waitForSelector(".pdr-page .textLayer span", {timeout: 15000});
  ok(/Writing Studio: Research paper: urban heat/.test(await page.textContent(".pdr-ws")), "the reader shows which paper it's for");
  await selectText(page, "Tree canopy explained most"); await page.waitForTimeout(200);
  await page.click('.pdr-pop [data-act="pdr-hl-add"] >> nth=0'); await page.waitForSelector('.pdr-pop [data-act="pdr-paper-to"]');
  ok(/Add as Quote/.test(await page.textContent(".pdr-pop")), "a new highlight offers Add as Quote right there");
  await page.click('.pdr-pop [data-act="pdr-paper-to"]'); await page.waitForTimeout(300);
  t1 = await task(page, "t1");
  ok(t1.ws.q.length === 3 && t1.ws.q[2].fid === "f9" && t1.ws.src.some(s => s.fid === "f9"), "it's a quote in this paper, and the PDF a source");
  ok(/1 quote added/.test(await page.textContent("#pdrWsN")), "the bar counts it");
  await page.click('.pdr-ws [data-act="pdr-ws-back"]'); await page.waitForSelector("#dlg[open] .ws-qs");
  ok(/^Quotes/.test(await selTab(page)) && /1 quote added from Urban_heat_reading\.pdf/.test(await page.textContent("#dlg[open] .ws-ok")), "back in Writing Studio on Quotes, with what was added");
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  // from anywhere: a PDF that's a source of one paper
  await act(page, "f-open", "f9"); await page.waitForTimeout(250);
  await page.click('.fs-acts [data-act="pdr-open"]'); await page.waitForSelector(".pdr-ws");
  ok(/Writing Studio: Research paper/.test(await page.textContent(".pdr-ws")) && /Open/.test(await page.textContent('.pdr-ws [data-act="pdr-ws-back"]')), "opened from its file, the reader still shows the paper's bar");
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  ok(!(await page.evaluate(() => !!document.querySelector("#dlg[open] .ws-sheet"))), "closing a reader opened elsewhere doesn't open Writing Studio");

  /* Board chip, Today's Plan, Review */
  ok(/data-act="ws-open"/.test(await page.evaluate(() => SBWRITE.chip(window.__sbProStudy.state().tasks.t4))) && await page.evaluate(() => SBWRITE.chip(window.__sbProStudy.state().tasks.t3 && Object.assign({}, window.__sbProStudy.state().tasks.t3, {ws: null}))) === "", "a chip only for papers with Writing Studio data");
  await act(page, "bview", "board"); await page.waitForTimeout(300);
  ok(await page.locator('.card .ws-chip[data-id="t4"]').count() === 1 && await page.locator('.card .ws-chip[data-id="m1"]').count() === 0, "the Board card has the chip");
  await act(page, "bview", "plan"); await page.waitForTimeout(300);
  const row = page.locator('.plan-notes [data-act="ws-open"][data-id="t4"][data-ws-to="check"]');
  ok(await row.count() === 1 && /Policy brief.*due tomorrow.*hasn't had a citation check/.test(await page.textContent(".plan-notes")), "Today's Plan: a paper due tomorrow with an unchecked draft gets Check Citations");
  await row.click(); await page.waitForSelector("#dlg[open] .ws-tab");
  ok(/^Check/.test(await selTab(page)), "which opens its Check");
  await page.click("[data-ws-check]"); await page.waitForTimeout(300); await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  ok(await page.evaluate(() => SBWRITE.planNote()) === null, "once checked, the row goes");
  ok((await task(page, "m4")).status === "done" && (await task(page, "m5")).status !== "done", "a step only about the citations is ticked once the check finds nothing to fix; one that also says submit isn't");
  await page.click('nav.tabs [data-tab="flashcards"]'); await page.waitForTimeout(300);
  await act(page, "rv-view", "writing"); await page.waitForSelector(".wsr-card");
  if (process.env.SHOT) {
    await page.evaluate(() => { const s = window.__sbProStudy.state(), t = Object.values(s.tasks).find(x => x.ws && x.ws.draft); t.ws.draft.t = "Connor Pelkmans (53918363)\nSCIE 113 214\nPhilip Stamp\n3/12/2021\nHow does Toxoplasma gondii affect human behavior?\nEver since the first connection was made between infection with the protozoan parasite Toxoplasma gondii and behaviour in rodents (Webster, 2007), researchers have asked whether the same is true of people. Flegr (2013) argued it is."; window.__sbProStudy.render(); });
    await page.waitForTimeout(500); await page.screenshot({path: process.env.SHOT + "wsr-cards.png"});
  }
  // the paper on a card stays crisp when it lifts under the pointer: the same pixels at rest, part way and lifted (it moves in whole pixels, not tilting)
  {
    const pg = page.locator(".wsr-card .wsr-ph").first(); await page.mouse.move(5, 5); await page.waitForTimeout(300);
    const rest = await pg.screenshot(); await pg.hover({position: {x: 20, y: 10}});
    const shots = []; for (const ms of [40, 60, 60, 300]) { await page.waitForTimeout(ms); shots.push(await pg.screenshot()); }
    ok(shots.every(b => Buffer.compare(b, rest) === 0), "a card's paper looks exactly the same while it lifts and once lifted: " + shots.map(b => Buffer.compare(b, rest)).join(","));
    ok((await page.evaluate(() => getComputedStyle(document.querySelector(".wsr-card .wsr-page")).translate)) === "0px -4px", "and it is lifted");
    await page.mouse.move(5, 5);
  }
  const cards = await page.$$eval(".wsr-card .wsr-t", x => x.map(e => e.textContent));
  ok(cards.includes("Research paper: urban heat") && cards.includes("Policy brief") && cards.includes("Reflection essay"), "Review's Writing view lists the papers: " + cards.join(", "));
  ok(/\d+ sources · \d+ quotes · last check/.test(await page.textContent(".wsr-list")), "with their counts and last check");
  await page.click(`#view [data-act="ws-lib"]`); await page.waitForSelector("#dlg[open] .ws-hub .ws-ref");
  ok(await page.locator("#dlg[open] .ws-hub .ws-ref").count() >= 5 && /In Research paper: urban heat/.test(await page.textContent("#dlg[open] .ws-hub")), "My Library, without picking a paper");
  await page.selectOption("[data-wh-to]", "t4"); await page.click("[data-wh-add] >> nth=0"); await page.waitForTimeout(300);
  ok((await task(page, "t4")).ws.src.length === 2, "a library source added to a paper from there");
  await page.click("[data-wh-switch]"); await page.waitForSelector("#dlg[open] [data-wz-key]");
  ok(/Connect your Zotero library/.test(await page.textContent("#dlg[open] .ws-hub")), "and Zotero");
  ok(page.errs.length === 0, "no console errors: " + page.errs.join(" | "));
  await ctx.close();

  /* Citation format, MLA (the user's example): a comma before the page, a year, the heading, an entry, each shown in the draft */
  { const mctx = await mkCtx(), mp = await open(mctx);
    await act(mp, "ws-open", "t5"); await mp.waitForSelector("#dlg[open] .ws-res");
    // citeproc loads, then the entries are checked against MLA's own version of them
    await mp.waitForFunction(() => /Works Cited: fix the entry/.test(document.querySelector("#dlg[open] .ws-res").textContent), null, {timeout: 15000});
    const res = (await mp.textContent("#dlg[open] .ws-res")).replace(/\s+/g, " ");
    ok(/2 citations put a comma between the author and the page/.test(res) && /In MLA, write \(Walker 112\), not \(Walker, 112\): no comma between the author and the page/.test(res), "MLA: (Walker, 112) is caught, with the right form, and grouped with the other one");
    ok(/In MLA, write \(Carskadon\)/.test(res) && /MLA citations have no year/.test(res), "MLA: (Carskadon 2011) is caught: no year in MLA");
    ok(new RegExp("check: " + (await mp.locator("#dlg[open] .ws-is.k-err").count()) + " to fix").test(await mp.textContent("#dlg[open] .ws-strip")), "the strip counts the same results the list shows: " + (await mp.textContent("#dlg[open] .ws-strip")).replace(/\s+/g, " ").trim());
    ok(/In MLA, the list is called Works Cited/.test(res) && /Yours is called “References”/.test(res), "MLA: the References heading is caught");
    ok(!/\(Lo et al\.\)|\(Ray 30\)/.test(res.replace(/Show the others:.*?(?=Should|$)/, "")), "(Lo et al.) and (Ray 30) are right in MLA, so they aren't flagged");
    ok(/Works Cited: fix the entry for Walker \(2017\)/.test(res) && /Add the publisher: Scribner/.test(res) && /Should be: ?Walker, Matthew\. Why We Sleep: Unlocking the Power of Sleep and Dreams\. Scribner, 2017\./.test(res), "a Works Cited entry: what's missing and the right version");
    ok(await mp.locator("#dlg[open] .ws-should [data-ws-copy]").count() >= 1, "with Copy");
    await mp.locator("#dlg[open] .ws-res").scrollIntoViewIfNeeded(); await mp.screenshot({path: SHOTS + "check-mla-desktop-list.png", fullPage: false});
    // clicking the group shows its first citation marked in the draft; Show the Others goes to the next
    await mp.locator("#dlg[open] .ws-is-b", {hasText: "comma between the author and the page"}).click(); await mp.waitForSelector("#dlg[open] .ws-dv .ws-mark");
    ok((await mp.textContent("#dlg[open] .ws-mark b")) === "(Walker, 112)" && /Short sleep blunts memory/.test(await mp.textContent("#dlg[open] .ws-mark")), "clicking the issue marks (Walker, 112) in the draft");
    await mp.screenshot({path: SHOTS + "check-mla-desktop.png", fullPage: false});
    await mp.click('#dlg[open] .ws-chipb[data-ws-show$=":0"]'); await mp.waitForSelector("#dlg[open] .ws-dv .ws-mark");
    ok((await mp.textContent("#dlg[open] .ws-mark b")) === "(Walker, 140)", "Show the others marks the next one");
    ok(await fits(mp), "Check with format issues fits at 1280px");
    ok(mp.errs.length === 0, "no console errors (format): " + mp.errs.join(" | "));
    await mctx.close();
    const qctx = await mkCtx({width: 390, height: 844}), qp = await open(qctx);
    await act(qp, "ws-open", "t5"); await qp.waitForSelector("#dlg[open] .ws-res");
    await qp.waitForFunction(() => /Works Cited: fix the entry/.test(document.querySelector("#dlg[open] .ws-res").textContent), null, {timeout: 15000});
    await qp.locator("#dlg[open] .ws-is-b", {hasText: "comma between the author and the page"}).click(); await qp.waitForSelector("#dlg[open] .ws-dv .ws-mark");
    ok(await fits(qp), "Check with format issues fits at 390px");
    await qp.locator("#dlg[open] .ws-is", {hasText: "comma between the author and the page"}).scrollIntoViewIfNeeded();
    await qp.screenshot({path: SHOTS + "check-mla-phone.png", fullPage: false});
    await qp.locator("#dlg[open] .ws-is", {hasText: "Works Cited: fix the entry"}).scrollIntoViewIfNeeded();
    await qp.screenshot({path: SHOTS + "check-mla-phone-entry.png", fullPage: false});
    ok(qp.errs.length === 0, "no console errors (format, phone): " + qp.errs.join(" | "));
    await qctx.close(); }

  /* Phone */
  const pctx = await mkCtx({width: 390, height: 844}), pp = await open(pctx);
  await act(pp, "ws-open", "t1"); await pp.waitForSelector("#dlg[open] .ws-offer");
  ok(await fits(pp), "Check with the offer fits at 390px");
  await pp.click("#dlg[open] .ws-offer [data-ws-dsel]"); await pp.waitForSelector("#dlg[open] .ws-found");
  await pp.waitForFunction(() => !/Looking up/.test(document.querySelector("#dlg[open] .ws-found").textContent), null, {timeout: 15000});
  ok(await fits(pp), "Found in Your Draft fits at 390px");
  await pp.locator("#dlg[open] .ws-is-b", {hasText: "Johnson"}).click(); await pp.waitForSelector("#dlg[open] .ws-dv .ws-mark");
  ok(await fits(pp), "the draft view fits at 390px");
  await pp.click('#dlg[open] [data-ws-go="sources"]'); await pp.waitForTimeout(200);
  ok(await fits(pp), "Sources with the strip fits at 390px");
  await pp.click('#dlg[open] [data-ws-tab="quotes"]'); await pp.click("#dlg[open] [data-ws-hlpdf]"); await pp.waitForSelector("#dlg[open] .ws-flist");
  ok(await fits(pp), "the PDF picker fits at 390px");
  ok(pp.errs.length === 0, "no console errors (phone): " + pp.errs.join(" | "));
  await pctx.close();

  /* Free plan: Writing Studio stays Pro */
  const fctx = await mkCtx(); await fctx.addInitScript(() => { try { localStorage.setItem("studyboard:paywall-test", "1"); } catch (e) {} });
  const fp = await open(fctx);
  await fp.click('nav.tabs [data-tab="flashcards"]'); await fp.waitForTimeout(300); await act(fp, "rv-view", "writing"); await fp.waitForSelector(".wsr-card");
  ok(/PRO/.test(await fp.textContent(".wsr-card .btn")), "free accounts see PRO in Review's Writing view");
  await fp.click(".wsr-card .btn >> nth=0"); await fp.waitForSelector("#dlg[open] .plan-sheet");
  ok(/Writing Studio is part of Studyboard Pro/.test(await fp.textContent("#dlg[open]")), "which opens the Pro sheet");
  await fctx.close();

  await browser.close(); server.close();
  console.log(`writing-studio-draft.e2e: ${n} passed`);
})().catch(e => { console.error(e); process.exit(1); });
