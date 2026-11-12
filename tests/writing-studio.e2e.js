// node tests/writing-studio.e2e.js
// Writing Studio (Pro): sources by DOI / ISBN / BibTeX / Zotero (mocked), citations by citeproc-js in APA and MLA, quotes from highlights,
// the outline (menu and drag), the citation check, Word export, Undo, the locked path and phone width.
// Concept Maps (Pro): the auto map, select / connect / label / hide / ideas (with Undo), drag, Fill In the Map, AI suggestions (mocked), phone width.
// SB_NO_CITEPROC=1 blocks citeproc.js and skips the formatting checks (the stand-in formatter is used instead).
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const NO_CP = !!process.env.SB_NO_CITEPROC;
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
const rev = nm => [{id: "r1", name: nm, size: 1000, at: 1}];
function SEED(){
  return {v: 2, updated: 1, settings: {}, courses: [{id: "c1", name: "Environmental Science", code: "ENV 210", color: "#2E9E5B"}, {id: "c2", name: "Writing and Rhetoric", code: "ENG 102", color: "#E0563B"}],
    tasks: [
      {id: "t1", title: "Research paper: urban heat", courseId: "c2", type: "Assignment", due: day(9), start: day(0), status: "todo", priority: "high", notes: "Use MLA format. Cite at least 3 sources.", created: 5,
        ws: {style: "apa", src: [
          {id: "s1", type: "article-journal", title: "The urban heat island effect and green infrastructure", author: [{family: "Smith", given: "Jordan A."}, {family: "Lee", given: "Kim"}], "container-title": "Urban Climate", volume: "38", issue: "2", page: "100–118", issued: {"date-parts": [[2021, 5]]}, DOI: "10.1016/j.uclim.2021.100118", fid: "f1"},
          {id: "s2", type: "book", title: "Cities and climate change", author: [{family: "Ng", given: "Mo"}], publisher: "Routledge", "publisher-place": "London", issued: {"date-parts": [[2019]]}}],
          q: [{id: "q1", sid: "s1", t: "Parks in Phoenix were on average four degrees cooler than the surrounding blocks.", p: "104", fid: "f1", hl: "h1", sec: "", at: 1}], out: []}},
      {id: "t2", title: "Problem set 4", courseId: "c1", type: "Exam", due: day(3), status: "todo", priority: "med", created: 6},
      {id: "x1", title: "Midterm Exam", courseId: "c1", type: "Exam", due: day(6), status: "todo", priority: "high", created: 7,
        prep: {topics: [{id: "tp1", name: "Carbon cycle", conf: "weak", links: [{k: "deck", id: "d1"}, {k: "note", id: "n1"}]}, {id: "tp2", name: "Urban heat islands", conf: "ok", links: [{k: "note", id: "n3"}]}, {id: "tp3", name: "Ecosystem services", conf: "strong", links: [{k: "deck", id: "d2"}]}]}}],
    notes: [
      {id: "n1", text: "Carbon cycle\nCarbon moves between air, ocean and soil. See [[Greenhouse effect]].", courseId: "c1", x: 40, y: 40, z: 1, created: 1},
      {id: "n2", text: "Greenhouse effect\nCO2 traps heat.", courseId: "c1", x: 300, y: 40, z: 2, created: 2},
      {id: "n3", text: "Urban heat islands\nAsphalt stores heat. [[Lecture 4 slides.pdf#p3]]", courseId: "c1", x: 560, y: 40, z: 3, created: 3},
      {id: "n4", text: "Field trip notes\nWetland visit.", courseId: "c1", x: 40, y: 300, z: 4, created: 4}],
    decks: [{id: "d1", name: "Carbon cycle cards", courseId: "c1", cards: [{id: "k1", front: "Largest carbon sink?", back: "Oceans", srcNote: "n1"}]}, {id: "d2", name: "Ecosystem services deck", courseId: "c1", cards: [{id: "k3", front: "A regulating service", back: "Cooling"}]}],
    files: [
      {id: "f1", name: "Smith 2021 urban heat.pdf", courseId: "c2", kind: "file", revs: rev("Smith 2021 urban heat.pdf"), taskIds: ["t1"], hl: [{id: "h1", p: 104, t: "Parks in Phoenix were on average four degrees cooler than the surrounding blocks.", c: "yellow", r: [[0.1, 0.2, 0.5, 0.02]], a: "r1"}, {id: "h2", p: 109, t: "Tree canopy cover explained more of the variation in surface temperature than any other factor.", c: "green", r: [[0.1, 0.3, 0.5, 0.02]], a: "r1"}]},
      {id: "f2", name: "Lecture 4 slides.pdf", courseId: "c1", kind: "file", revs: rev("Lecture 4 slides.pdf"), taskIds: []}],
    events: []};
}
const DOI_CSL = {DOI: "10.1037/0003-066x.59.1.29", type: "journal-article", title: "How the mind hurts and heals the body", "container-title": "American Psychologist", volume: "59", issue: "1", page: "29-40", author: [{given: "Oakley", family: "Ray"}], issued: {"date-parts": [[2004]]}};
const OL = {"ISBN:9780374275631": {title: "Thinking, Fast and Slow", authors: [{name: "Daniel Kahneman"}], publishers: [{name: "Farrar, Straus and Giroux"}], publish_places: [{name: "New York"}], publish_date: "2011"}};
const Z_ITEMS = [{key: "ZK1", csljson: {id: "x", type: "report", title: "Heat Action Plans", author: [{literal: "City of Phoenix"}], issued: {"date-parts": [[2022]]}, publisher: "City of Phoenix"}}, {key: "ZK2", csljson: {id: "y", type: "book", title: "Cities and climate change", author: [{family: "Ng", given: "Mo"}], issued: {"date-parts": [[2019]]}}}];
const textOf = body => { try { const out = []; const walk = v => { if (typeof v === "string") out.push(v); else if (v && typeof v === "object") Object.values(v).forEach(walk); }; walk(JSON.parse(body)); return out.join("\n"); } catch (e) { return String(body || ""); } };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const mkCtx = async (o, viewport) => {
    const ctx = await browser.newContext({viewport: viewport || {width: 1280, height: 900}, serviceWorkers: "block", acceptDownloads: true});
    Object.assign(ctx, {bodies: [], zot: []});
    if (NO_CP) await ctx.route(/citeproc\.js/, r => r.abort());
    await ctx.route(/doi\.org\/10\.1037/, r => r.fulfill({status: 200, contentType: "application/vnd.citationstyles.csl+json", headers: {"access-control-allow-origin": "*"}, body: JSON.stringify(DOI_CSL)}));
    await ctx.route(/openlibrary\.org\/api\/books/, r => r.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*"}, body: JSON.stringify(OL)}));
    await ctx.route(/api\.zotero\.org/, r => {
      const u = new URL(r.request().url()); ctx.zot.push(u.pathname + u.search + " key=" + (r.request().headers()["zotero-api-key"] || ""));
      const j = b => r.fulfill({status: 200, contentType: "application/json", headers: {"access-control-allow-origin": "*", "total-results": String(Array.isArray(b) ? b.length : 1)}, body: JSON.stringify(b)});
      if (/^\/keys\//.test(u.pathname)) return /GOODKEY/.test(u.pathname) ? j({userID: 4242, username: "jordan", access: {user: {library: true}}}) : r.fulfill({status: 403, body: "Forbidden"});
      if (/\/groups$/.test(u.pathname)) return j([]);
      if (/\/collections$/.test(u.pathname)) return j([{key: "COL1", data: {name: "Urban heat", parentCollection: false}}]);
      if (/\/items/.test(u.pathname)) return j(Z_ITEMS);
      return r.fulfill({status: 404, body: "{}"});
    });
    await ctx.route(/generativelanguage\.googleapis\.com/, route => {
      const t = textOf(route.request().postData() || ""); ctx.bodies.push(t);
      const reply = /see how their course material connects/.test(t) ? {links: [{a: "note:n2", b: "note:n3", label: "warms", why: "Trapped heat adds to city heat."}], concepts: [{name: "Albedo", near: ["note:n3"], label: "explains", why: "Dark surfaces absorb more sun."}]} : {};
      route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(reply)}]}, finishReason: "STOP"}]})});
    });
    await ctx.route(/\/v1\/ai$/, route => route.fulfill({status: 500, body: "{}"}));
    await ctx.addInitScript(([seed, o]) => {
      try {
        if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); }
        if (o.key) { localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); }
        if (o.free) localStorage.setItem("studyboard:paywall-test", "1");
      } catch (e) {}
    }, [SEED(), o]);
    return ctx;
  };
  const open = async ctx => {
    const page = await ctx.newPage(); page.errs = [];
    page.on("pageerror", e => page.errs.push(e.message));
    page.on("console", m => { if (m.type() === "error" && !/Failed to load resource|ERR_FAILED/.test(m.text())) page.errs.push(m.text()); });
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.__sbProStudy && window.SBWRITE && window.SBCMAP);
    await page.waitForTimeout(700); return page;
  };
  const act = (page, a, id, extra) => page.evaluate(([a, id, extra]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; Object.assign(b.dataset, extra || {}); b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id || "", extra || {}]);
  const task = (page, id) => page.evaluate(id => window.__sbProStudy.state().tasks[id], id);
  const course = (page, id) => page.evaluate(id => window.__sbProStudy.state().courses[id], id);
  const fits = page => page.evaluate(() => { const d = document.querySelector("dialog[open]"), w = document.documentElement; return w.scrollWidth <= w.clientWidth + 1 && (!d || [...d.querySelectorAll(".sheet-body, .sheet-foot, .ws-ref, .ws-q, .ws-acts, .ws-row, .cm-panel")].every(x => x.scrollWidth <= x.clientWidth + 1)); });
  // a node is tapped with the keyboard (Enter), which also brings it into view
  const tap = async (page, id) => { await page.focus(`.cm-node[data-n="${id}"]`); await page.keyboard.press("Enter"); await page.waitForTimeout(380); };
  const refs = page => page.$$eval("#dlg[open] .ws-ref .ws-cite", x => x.map(e => e.textContent.trim()));

  /* ---------- Writing Studio, Pro ---------- */
  const ctx = await mkCtx({key: true}), page = await open(ctx);
  await act(page, "edit-task", "t2"); await page.waitForSelector("#dlg[open] .sheet-foot");
  ok(await page.locator('#dlg[open] [data-act="ws-open"]').count() === 0, "no Writing Studio on an exam");
  await act(page, "edit-task", "t1"); await page.waitForSelector('#dlg[open] [data-act="ws-open"]');
  ok(/Writing Studio/.test(await page.textContent('#dlg[open] [data-act="ws-open"]')), "a paper has Writing Studio in its actions");
  await page.click('#dlg[open] [data-act="ws-open"]'); await page.waitForSelector("#dlg[open] .ws-refs");
  if (!NO_CP) {
    await page.waitForFunction(() => !/formatting/.test(document.querySelector(".ws-bibh").textContent), null, {timeout: 20000});
    const R = await refs(page);
    ok(R.length === 2 && /^Ng, M\. \(2019\)\. Cities and climate change\. Routledge\.?$/.test(R[0]), "APA by citeproc, alphabetical: " + R[0]);
    ok(/^Smith, J\. A\., & Lee, K\. \(2021\)\. The urban heat island effect and green infrastructure\. Urban Climate, 38\(2\), 100–118\. https:\/\/doi\.org\/10\.1016\/j\.uclim\.2021\.100118$/.test(R[1]), "a journal article in APA: " + R[1]);
    ok(await page.locator("#dlg[open] .ws-ref .ws-cite i", {hasText: "Urban Climate"}).count() === 1, "the journal is in italics");
    ok(/In text: \(Smith & Lee, 2021\)/.test(await page.textContent("#dlg[open] .ws-refs")), "the in-text citation");
  } else ok(true, "citeproc blocked: formatting checks skipped");
  ok(await fits(page), "Sources fit at 1280px");
  // add by DOI, then the same DOI again
  await page.fill("[data-ws-in]", "https://doi.org/10.1037/0003-066X.59.1.29"); await page.click("[data-ws-add]");
  await page.waitForFunction(() => document.querySelectorAll("#dlg[open] .ws-ref").length === 3);
  let t1 = await task(page, "t1");
  ok(t1.ws.src.length === 3 && t1.ws.src[2].title === "How the mind hurts and heals the body" && t1.ws.src[2].page === "29–40", "a DOI is looked up and added");
  await page.fill("[data-ws-in]", "10.1037/0003-066X.59.1.29"); await page.click("[data-ws-add]"); await page.waitForSelector(".ws-err");
  ok(/already in your list/.test(await page.textContent(".ws-err")), "the same DOI twice says so");
  await page.fill("[data-ws-in]", "978-0-374-27563-1"); await page.click("[data-ws-add]");
  await page.waitForFunction(() => document.querySelectorAll("#dlg[open] .ws-ref").length === 4);
  t1 = await task(page, "t1");
  ok(t1.ws.src[3].type === "book" && t1.ws.src[3].author[0].family === "Kahneman", "an ISBN is looked up with Open Library");
  // import BibTeX
  await page.click("[data-ws-imp]"); await page.fill("[data-wi-text]", "@article{a, author={Brown, Ana}, title={Shade and Health}, journal={Health Place}, year=2020}\n@book{b, author={Ng, Mo}, title={Cities and climate change}, year=2019}");
  await page.click("[data-wi-read]"); await page.waitForSelector("[data-wi-pick]");
  ok(/Read as BibTeX: 2 sources found/.test(await page.textContent("#dlg[open] .ws-body")) && await page.isDisabled('[data-wi-pick="1"]'), "BibTeX is read, and a duplicate can't be ticked");
  await page.click("[data-wi-add]"); await page.waitForSelector(".ws-ok");
  ok(/Imported 1 source; 1 was already here/.test(await page.textContent(".ws-ok")), "one imported, one skipped");
  // Zotero
  await page.click("[data-ws-zot]"); await page.fill("[data-wz-key]", "BADKEYBADKEYBADKEYBADKEY"); await page.click("[data-wz-connect]"); await page.waitForSelector(".ws-err");
  ok(/turned the key down/.test(await page.textContent(".ws-err")), "a key Zotero refuses says so");
  await page.fill("[data-wz-key]", "GOODKEYGOODKEYGOODKEY123"); await page.click("[data-wz-connect]"); await page.waitForSelector("[data-wz-pick]");
  ok(/Connected as jordan/.test(await page.textContent("#dlg[open] .ws-body")) && ctx.zot.some(x => /\/users\/4242\/items\/top\?include=csljson/.test(x) && / key=GOODKEY/.test(x)), "connected: My Library's items, with the key in the header only");
  ok(await page.isDisabled('[data-wz-pick="ZK2"]') && /already added/.test(await page.textContent("#dlg[open] .ws-picks")), "a Zotero item already here can't be ticked");
  ok(await page.evaluate(() => /GOODKEY/.test(localStorage.getItem("studyboard:zotero")) && !/GOODKEY/.test(localStorage.getItem("coursework:v2"))), "the key stays on this device, not in synced data");
  await page.selectOption("[data-wz-col]", "COL1"); await page.waitForFunction(() => !document.querySelector("#dlg[open] .ws-body").textContent.includes("Loading"));
  ok(ctx.zot.some(x => /\/collections\/COL1\/items\/top/.test(x)), "a collection narrows the list");
  await page.check('[data-wz-pick="ZK1"]'); await page.click("[data-wz-add]"); await page.waitForSelector(".ws-ok");
  t1 = await task(page, "t1");
  const zs = t1.ws.src.find(x => x.zkey === "ZK1");
  ok(zs && zs.type === "report" && zs.author[0].literal === "City of Phoenix" && zs.zlib === "user", "a Zotero item comes in as CSL-JSON with its key");
  ok(/Zotero/.test(await page.textContent("#dlg[open] .ws-refs")) && await page.locator("[data-ws-zsync]").count() === 1, "it's marked Zotero, and can be updated from Zotero");
  // switch style
  await page.selectOption("[data-ws-style]", "modern-language-association");
  if (!NO_CP) {
    await page.waitForFunction(() => /Works Cited/.test(document.querySelector(".ws-bibh").textContent) && !/formatting/.test(document.querySelector(".ws-bibh").textContent), null, {timeout: 20000});
    const R = await refs(page);
    ok(R.some(x => /^Smith, Jordan A\., and Kim Lee\. “The Urban Heat Island Effect and Green Infrastructure\.” Urban Climate, vol\. 38, no\. 2, (May )?2021, pp\. 100–1?18/.test(x)), "MLA by citeproc: " + R.find(x => /^Smith/.test(x)));
  } else await page.waitForFunction(() => /Works Cited/.test(document.querySelector(".ws-bibh").textContent));
  ok((await task(page, "t1")).ws.style === "modern-language-association", "the style is kept on the paper");
  // remove with Undo
  const before = (await task(page, "t1")).ws.src.length;
  await page.click('[data-ws-rm="s2"]'); await page.waitForTimeout(250);
  ok((await task(page, "t1")).ws.src.length === before - 1, "Remove takes a source out");
  await page.click("#toastUndo"); await page.waitForTimeout(300);
  ok((await task(page, "t1")).ws.src.length === before, "Undo puts it back");
  // edit by hand
  await page.click('[data-ws-edit="s2"]'); await page.waitForSelector('[data-wf="title"]');
  ok(await page.locator('[data-wf="publisher"]').count() === 1 && await page.locator('[data-wf="volume"]').count() === 0, "the form shows a book's fields");
  await page.selectOption('[data-wf="type"]', "chapter"); await page.waitForSelector('[data-wf="container-title"]');
  ok(await page.inputValue('[data-wf="title"]') === "Cities and climate change", "changing the type keeps what was typed");
  await page.fill('[data-wf="container-title"]', "Handbook of Urban Climate"); await page.fill('[data-wf="page"]', "45-67");
  await page.click("[data-ws-esave]"); await page.waitForSelector(".ws-refs");
  const s2 = (await task(page, "t1")).ws.src.find(x => x.id === "s2");
  ok(s2.type === "chapter" && s2["container-title"] === "Handbook of Urban Climate" && s2.page === "45–67", "edits are saved as CSL fields");
  // Quotes from highlights
  await page.click('[data-ws-tab="quotes"]'); await page.click("[data-ws-hlpick]"); await page.waitForSelector("[data-ws-hl]");
  ok(await page.locator("[data-ws-hl]").count() === 1, "only the highlight not yet used is offered");
  await page.click("[data-ws-hladd]"); await page.waitForFunction(() => document.querySelectorAll("#dlg[open] .ws-q").length === 2);
  t1 = await task(page, "t1");
  ok(t1.ws.q[1].sid === "s1" && t1.ws.q[1].p === "109" && t1.ws.q[1].hl === "h2", "the quote keeps its source (from the PDF) and page");
  if (!NO_CP) ok(/\(Smith and Lee 109\)/.test(await page.textContent("#dlg[open] .ws-qs")), "and its MLA in-text citation");
  // Outline: seed, menu, drag
  await page.click('[data-ws-tab="outline"]'); await page.click('[data-ws-seed="basic"]'); await page.waitForSelector(".ws-sec");
  t1 = await task(page, "t1");
  ok(t1.ws.out.map(x => x.t).join() === "Introduction,Body,Conclusion", "an outline from Introduction, Body, Conclusion");
  await page.selectOption(`[data-ws-mv="q1"]`, t1.ws.out[0].id); await page.waitForTimeout(200);
  ok((await task(page, "t1")).ws.q.find(x => x.id === "q1").sec === t1.ws.out[0].id, "a quote moved with its menu");
  const qid = t1.ws.q[1].id;
  await page.dragAndDrop(`[data-ws-dq="${qid}"]`, `.ws-sec[data-ws-drop="${t1.ws.out[2].id}"]`); await page.waitForTimeout(300);
  ok((await task(page, "t1")).ws.q.find(x => x.id === qid).sec === t1.ws.out[2].id, "and one dragged into Conclusion");
  await page.fill(`[data-ws-sect="${t1.ws.out[1].id}"]`, "Evidence"); await page.press(`[data-ws-sect="${t1.ws.out[1].id}"]`, "Tab"); await page.waitForTimeout(200);
  ok((await task(page, "t1")).ws.out[1].t === "Evidence", "a section is renamed in place");
  // Word export
  await page.click("[data-ws-export]"); await page.waitForSelector('[data-ws-x="docx"]');
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click('[data-ws-x="docx"]')]);
  const buf = fs.readFileSync(await dl.path()).toString("latin1");
  ok(/Outline\.docx$/.test(dl.suggestedFilename()) && /word\/document\.xml/.test(buf) && /Works Cited/.test(buf) && /Evidence/.test(buf) && /Parks in Phoenix/.test(buf), "the outline downloads as Word with its sections, quotes and Works Cited");
  // Check
  await page.click('#dlg[open] [data-ws-xback]').catch(() => {});
  await page.click('[data-ws-tab="check"]');
  ok(/MLA 9th edition, at least 3 sources/.test(await page.textContent("#dlg[open] .ws-note")), "the assignment's rules are read from the task");
  await page.fill("[data-ws-draft]", `Cities are warming fast. Parks are cooler than the blocks around them (Smith and Lee 104). Ng writes that cities must plan for heat (Ng 50). As one report says, "heat action plans save lives when they reach the people most at risk" and that matters. Others disagree (Johnson 12).\n\nWorks Cited\nSmith, Jordan A., and Kim Lee. Urban heat.\nNg, Mo. Cities.`);
  await page.click("[data-ws-check]"); await page.waitForSelector(".ws-res");
  const iss = await page.$$eval(".ws-is", x => x.map(e => e.className.replace(/.*k-/, "") + ": " + e.querySelector("b").textContent));
  ok(iss.some(x => /^err: Not in your sources: \(Johnson 12\)/.test(x)), "a citation that matches no source");
  ok(iss.some(x => /^err: Quote without a citation/.test(x)), "a quote without a citation");
  ok(iss.some(x => /^warn: Never cited: How the mind hurts/.test(x)), "a source never cited");
  ok(iss.some(x => /^ok: Every cited source is in your Works Cited list/.test(x)), "the list has every cited source");
  ok(await fits(page), "the check fits at 1280px");
  ok(page.errs.length === 0, "no console errors (Pro): " + page.errs.join(" | "));
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);

  /* ---------- Concept Maps, Pro ---------- */
  ok(/data-act="cm-open"/.test(await page.evaluate(() => SBCMAP.courseBtn(window.__sbProStudy.state().courses.c1))) && /data-act="cm-open"/.test(await page.evaluate(() => SBCMAP.examBtn(window.__sbProStudy.state().tasks.x1))), "Concept Map buttons for a course and an exam");
  ok(await page.evaluate(() => SBCMAP.examBtn(window.__sbProStudy.state().tasks.t2)) === "", "no button on an exam without topics");
  await act(page, "cm-open", "c1", {kind: "course"}); await page.waitForSelector(".cm-node");
  const ids = await page.$$eval(".cm-node", x => x.map(e => e.dataset.n));
  ok(ids.includes("root") && ids.includes("exam:x1") && ids.includes("topic:x1:tp1") && ids.includes("note:n1") && ids.includes("deck:d1") && ids.includes("file:f2"), "the course map: exam, topics, notes, decks, files");
  ok(!ids.includes("note:n4") && /1 not linked to anything/.test(await page.textContent(".cm-panel")), "an unlinked note is counted, not drawn");
  await page.check('[data-cm="loose"]'); await page.waitForSelector('.cm-node[data-n="note:n4"]');
  ok(true, "Show unlinked draws it");
  await page.uncheck('[data-cm="loose"]');
  ok(await fits(page), "the map fits at 1280px");
  // select, connect, label
  await tap(page, "note:n2"); await page.waitForSelector('[data-cm="open"]');
  ok(/Greenhouse effect/.test(await page.textContent(".cm-panel")) && /Note/.test(await page.textContent(".cm-panel")), "tapping a node shows what it is");
  await page.click('[data-cm="connect"]'); await tap(page, "deck:d2"); await page.waitForSelector("[data-cm-elab]");
  await page.fill("[data-cm-elab]", "affects"); await page.click('[data-cm="elab"]'); await page.waitForTimeout(200);
  let c1 = await course(page, "c1");
  ok(c1.cmap.links.some(l => [l.a, l.b].sort().join() === "deck:d2,note:n2" && l.label === "affects"), "a labelled connection is kept on the course");
  ok(await page.locator(".cm-elab", {hasText: "affects"}).count() === 1, "and drawn");
  // drag
  await tap(page, "note:n1"); await tap(page, "note:n1");
  const box = await page.locator('.cm-node[data-n="note:n1"]').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 90, box.y + box.height / 2 + 40, {steps: 6}); await page.mouse.up(); await page.waitForTimeout(200);
  c1 = await course(page, "c1");
  ok(Array.isArray(c1.cmap.pos["note:n1"]), "a dragged node keeps its place");
  // hide with Undo
  await tap(page, "file:f2"); await page.click('[data-cm="hide"]'); await page.waitForTimeout(200);
  ok(await page.locator('.cm-node[data-n="file:f2"]').count() === 0, "Hide takes a node off the map");
  await page.click("#toastUndo"); await page.waitForTimeout(300);
  ok((await course(page, "c1")).cmap.hide.length === 0, "Undo brings it back");
  // an idea, named in the panel's form
  await tap(page, "topic:x1:tp2"); await page.click('[data-cm="idea"]'); await page.waitForSelector("#cmAsk");
  await page.fill("#cmAsk", "Albedo"); await page.press("#cmAsk", "Enter"); await page.waitForTimeout(250);
  c1 = await course(page, "c1");
  const idea = c1.cmap.add.find(x => x.label === "Albedo");
  ok(idea && c1.cmap.links.some(l => l.b === "idea:" + idea.id && l.a === "topic:x1:tp2"), "+ Idea adds a node tied to the selected one");
  // AI suggestions
  await page.click('[data-cm="suggest"]'); await page.waitForSelector("[data-cm-sl]");
  ok(/see how their course material connects/.test(ctx.bodies[ctx.bodies.length - 1]) && /note:n2 \| Note \| Greenhouse effect \| CO2 traps heat/.test(ctx.bodies[ctx.bodies.length - 1]), "Suggest sends the node names and the first lines of notes");
  await page.click('[data-cm="sug-add"]'); await page.waitForTimeout(250);
  c1 = await course(page, "c1");
  ok(c1.cmap.links.some(l => l.label === "warms") && c1.cmap.add.filter(x => x.label === "Albedo").length === 2, "accepted suggestions join the map");
  // Fill In the Map
  await page.click('[data-cm="quiz"]'); await page.waitForSelector(".cm-chip");
  const blanks = await page.locator(".cm-node.is-blank").count();
  ok(blanks >= 5, "Fill In the Map hides labels: " + blanks);
  const pick = await page.evaluate(() => SBCMAP.state().quiz.pick), want = await page.evaluate(id => SBCMAP.state().g.nodes.find(x => x.id === id).label, pick);
  const wrong = await page.$$eval(".cm-chip", (x, w) => x.map(e => e.textContent).find(t => t !== w), want);
  await page.click(`.cm-chip >> text="${wrong}"`); await page.waitForTimeout(100);
  ok(await page.evaluate(() => SBCMAP.state().quiz.miss) === 1, "a wrong label is counted");
  await page.click(`.cm-chip >> text="${want}"`); await page.waitForTimeout(150);
  ok(await page.evaluate(() => SBCMAP.state().quiz.done.size) === 1 && /1 of \d+ placed/.test(await page.textContent(".cm-tools")), "the right one fills the blank, and the next blank is picked");
  await page.click('[data-cm="quiz-end"]');
  ok(page.errs.length === 0, "no console errors (map): " + page.errs.join(" | "));
  await page.keyboard.press("Escape");
  // an exam map, coloured by knowledge
  await act(page, "cm-open", "x1", {kind: "exam"}); await page.waitForSelector(".cm-node");
  ok(await page.isChecked('[data-cm="know"]') && /Shaky/.test(await page.textContent(".cm-legend")), "an exam map starts coloured by knowledge");
  ok(await page.locator('.cm-node[data-n="file:f2"]').count() === 1 && await page.locator('.cm-node[data-n="note:n4"]').count() === 0, "it shows what the topics reach, not the whole course");
  await ctx.close();

  /* ---------- Locked ---------- */
  const lctx = await mkCtx({free: true}), lp = await open(lctx);
  await act(lp, "edit-task", "t1"); await lp.waitForSelector('#dlg[open] [data-act="ws-open"]');
  ok(/PRO/.test(await lp.textContent('#dlg[open] [data-act="ws-open"]')), "free accounts see a PRO badge");
  await lp.click('#dlg[open] [data-act="ws-open"]'); await lp.waitForSelector("#dlg[open] .plan-sheet");
  ok(/Writing Studio is part of Studyboard Pro/.test(await lp.textContent("#dlg[open]")), "which opens the Pro sheet");
  await act(lp, "cm-open", "c1", {kind: "course"}); await lp.waitForSelector("#dlg[open] .plan-sheet");
  ok(/Concept Maps are part of Studyboard Pro/.test(await lp.textContent("#dlg[open]")), "and so does Concept Map");
  await lctx.close();

  /* ---------- Phone ---------- */
  const pctx = await mkCtx({key: true}, {width: 390, height: 844}), pp = await open(pctx);
  await act(pp, "ws-open", "t1"); await pp.waitForSelector("#dlg[open] .ws-refs");
  ok(await fits(pp), "Sources fit at 390px");
  for (const tab of ["quotes", "outline", "check"]) { await pp.click(`[data-ws-tab="${tab}"]`); await pp.waitForTimeout(150); ok(await fits(pp), `${tab} fits at 390px`); }
  await pp.click('[data-ws-tab="sources"]'); await pp.click('[data-ws-edit="s1"]'); await pp.waitForSelector('[data-wf="y"]');
  const ys = await Promise.all(['[data-wf="y"]', '[data-wf="m"]', '[data-wf="d"]'].map(s => pp.locator(s).boundingBox()));
  ok(Math.abs(ys[0].y - ys[2].y) < 2, "year, month and day share a row on a phone");
  ok(await fits(pp), "the source form fits at 390px");
  await pp.keyboard.press("Escape"); await pp.waitForTimeout(300);
  await act(pp, "cm-open", "c1", {kind: "course"}); await pp.waitForSelector(".cm-node");
  ok(await pp.evaluate(() => SBCMAP.state().view.k) >= 0.6, "a phone map stays readable (zoom " + await pp.evaluate(() => SBCMAP.state().view.k.toFixed(2)) + ")");
  ok(await pp.evaluate(() => { const t = document.querySelector(".cm-tools"); return t.getBoundingClientRect().height < 60; }), "the tools are one row on a phone");
  ok(await fits(pp), "the map fits at 390px");
  ok(pp.errs.length === 0, "no console errors (phone): " + pp.errs.join(" | "));
  await pctx.close();

  await browser.close(); server.close();
  console.log(`writing-studio.e2e: ${n} passed${NO_CP ? " (citeproc blocked)" : ""}`);
})().catch(e => { console.error(e); process.exit(1); });
