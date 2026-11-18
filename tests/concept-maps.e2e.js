// node tests/concept-maps.e2e.js
// Concept Maps in Review: the list (by course, sorted, filtered), several maps per course (from course material or a blank page),
// rename and delete with Undo, the old single map carried over, box shapes and colours, connection lines, arrows and words, phone width.
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
const day = off => { const d = new Date(); d.setDate(d.getDate() + off); return d.toISOString().slice(0, 10); };
const DAY = 864e5;
function SEED(){
  return {v: 2, updated: 1, settings: {}, courses: [
    // the old single map (c.cmap), from before a course could hold several
    {id: "c1", name: "Environmental Science", code: "ENV 210", color: "#2E9E5B", cmap: {add: [{id: "i1", label: "Albedo"}], links: [{a: "root", b: "idea:i1", label: "explains"}], at: Date.now() - 5 * DAY}},
    {id: "c2", name: "Biology", code: "BIO 101", color: "#7C5CFF", maps: [{id: "m1", name: "Cell respiration", auto: false, created: 1, at: Date.now() - 2 * DAY,
      add: [{id: "a", label: "Glycolysis"}, {id: "b", label: "Krebs cycle"}, {id: "d", label: "ATP"}], links: [{a: "root", b: "idea:a", label: "starts with"}, {a: "idea:a", b: "idea:b", label: ""}, {a: "idea:b", b: "idea:d", label: ""}]}]},
    {id: "c3", name: "History", code: "HIS 110", color: "#E8590C"}],
    tasks: [{id: "x1", title: "Midterm Exam", courseId: "c1", type: "Exam", due: day(6), status: "todo", priority: "high", created: 6, prep: {topics: [{id: "tp1", name: "Carbon cycle", conf: "weak", links: [{k: "note", id: "n1"}]}]}}],
    notes: [{id: "n1", text: "Carbon cycle\nSee [[Greenhouse effect]]", courseId: "c1", x: 40, y: 40, z: 1, created: 1}, {id: "n2", text: "Greenhouse effect\nCO2", courseId: "c1", x: 300, y: 40, z: 2, created: 2},
      {id: "n3", text: "Mitochondria\nPowerhouse", courseId: "c2", x: 40, y: 300, z: 3, created: 3}],
    decks: [], files: [], events: []};
}
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  // a map control may sit in a toolbar menu (Add, Study, More), the idea panel's Attach menu, or its Style section: open whichever holds it, then click
  const cmClick = async (page, sel) => {
    const shown = () => page.locator(sel).first().isVisible().catch(() => false);
    for (const op of ['.cm-panel [data-cm="style"]', '.cm-tools [data-cm="menu"][data-v="add"]', '.cm-tools [data-cm="menu"][data-v="study"]', '.cm-tools [data-cm="menu"][data-v="more"]', '.cm-panel [data-cm="menu"][data-v="attach"]']) {
      if (await shown()) break;
      if (op.includes('"style"') && await page.locator(".cm-panel .cm-style").count()) continue;
      if (await page.locator(op).count()) { await page.click(op); await page.waitForTimeout(60); }
    }
    await page.click(sel);
  };
  const mkCtx = async (viewport, o) => {
    const ctx = await browser.newContext({viewport: viewport || {width: 1280, height: 860}, serviceWorkers: "block"});
    await ctx.addInitScript(([seed, o]) => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } if (o && o.free) localStorage.setItem("studyboard:paywall-test", "1"); localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } catch (e) {} }, [SEED(), o || {}]);
    ctx.aiCalls = [];
    await ctx.route(/generativelanguage\.googleapis\.com/, route => { ctx.aiCalls.push(route.request().postData() || "");
      route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(ctx.aiReply || {})}]}, finishReason: "STOP"}]})}); });
    return ctx;
  };
  const open = async ctx => {
    const page = await ctx.newPage(); page.errs = [];
    page.on("pageerror", e => page.errs.push(e.message));
    page.on("console", m => { if (m.type() === "error" && !/Failed to load resource|ERR_FAILED/.test(m.text())) page.errs.push(m.text()); });
    await page.goto(base); await page.waitForFunction(() => window.__sbProStudy && window.SBCMAP); await page.waitForTimeout(600); return page;
  };
  const act = (page, a, id, extra) => page.evaluate(([a, id, extra]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; Object.assign(b.dataset, extra || {}); b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id || "", extra || {}]);
  const course = (page, id) => page.evaluate(id => window.__sbProStudy.state().courses[id], id);
  const titles = page => page.$$eval(".cm-mapcard .cm-ctitle", x => x.map(e => e.textContent.trim()));
  const tap = async (page, id) => { await page.focus(`.cm-node[data-n="${id}"]`); await page.keyboard.press("Enter"); await page.waitForTimeout(300); };
  const fits = page => page.evaluate(() => { const d = document.querySelector("dialog[open]"), w = document.documentElement; return w.scrollWidth <= w.clientWidth + 1 && (!d || [...d.querySelectorAll(".sheet-body, .sheet-foot, .cm-panel, .cm-row")].every(x => x.scrollWidth <= x.clientWidth + 1)); });

  const ctx = await mkCtx(), page = await open(ctx);
  /* Review: a third tab */
  await act(page, "nav-tab", "flashcards").catch(() => {});
  await page.evaluate(() => { const b = document.querySelector('nav [data-tab="flashcards"]'); if (b) b.click(); }); await page.waitForTimeout(300);
  ok(await page.locator('.rv-tabs [data-id="maps"]').count() === 1 && /Concept Maps/.test(await page.textContent(".rv-tabs")), "Review has a Concept Maps tab beside Flashcards and Quizzes");
  await page.click('.rv-tabs [data-id="maps"]'); await page.waitForSelector(".cm-mapcard");
  let T = await titles(page);
  ok(T.join("|") === "Cell respiration|ENV 210 Map|Midterm Exam", "every map, most recently edited first: " + T.join(", "));
  ok(/3 ideas/.test(await page.textContent('.cm-mapcard:has(.cm-ctitle:text-is("Cell respiration"))')) && /from the Prep Plan/.test(await page.textContent('.cm-mapcard:has(.cm-ctitle:text-is("Midterm Exam"))')), "a card says how the map started");
  ok(await page.locator('.cm-mapcard:has(.cm-ctitle:text-is("Midterm Exam")) [data-act="cm-del"]').count() === 0, "an exam's map can be opened, not deleted (it's the exam's Prep Plan)");
  await page.selectOption("[data-cm-sort]", "name"); await page.waitForTimeout(200);
  ok((await titles(page)).join("|") === "Cell respiration|ENV 210 Map|Midterm Exam", "sorted by name");
  await page.selectOption("[data-cm-sort]", "course"); await page.waitForTimeout(200);
  ok((await page.$$eval(".cm-grp", x => x.map(e => e.textContent.trim()))).join("|") === "BIO 101|ENV 210", "sorted by course, with a heading per course");
  ok(await page.evaluate(() => localStorage.getItem("studyboard:cmSort")) === "course", "the sort is remembered");
  // the course filter (the same chips as Flashcards and Quizzes)
  await page.evaluate(() => { const ui = window.__sbProStudy.ui || null; });
  await act(page, "cm-review", "c1"); await page.waitForTimeout(250);
  ok((await titles(page)).join("|") === "ENV 210 Map|Midterm Exam", "filtered to one course (from the course page's card)");
  await act(page, "filter", "all").catch(() => {}); await page.evaluate(() => { const c = document.querySelector('[data-act="filter"][data-id="all"], [data-act="chip"][data-id="all"]'); if (c) c.click(); }); await page.waitForTimeout(200);

  /* The old single map carries over */
  await act(page, "cm-open", "c1", {kind: "course", map: "main"}); await page.waitForSelector('.cm-node[data-n="idea:i1"]');
  ok(/ENV 210 Map/.test(await page.textContent("#dlg[open] .cm-top")), "the course's old map opens as its first map");
  await tap(page, "idea:i1"); await cmClick(page, '[data-cm="shape"][data-v="cloud"]'); await page.waitForTimeout(250);
  let c1 = await course(page, "c1");
  ok(!c1.cmap && Array.isArray(c1.maps) && c1.maps.length === 1 && c1.maps[0].id === "main" && c1.maps[0].add[0].label === "Albedo" && c1.maps[0].styles["idea:i1"].shape === "cloud", "saving moves it into the course's maps, keeping everything");
  ok(await page.locator('.cm-node[data-n="idea:i1"].sh-cloud path.cm-shape').count() === 1, "and the idea is now a cloud");
  // fill, outline and text colour: a chip opens its swatches
  const swatch = async k => { await cmClick(page, `[data-cm="pick"][data-v="${k}"]`); await page.waitForSelector(`[data-cm="st"][data-k="${k}"]`); const v = await page.getAttribute(`[data-cm="st"][data-k="${k}"]:nth-child(3)`, "data-v"); await cmClick(page, `[data-cm="st"][data-k="${k}"][data-v="${v}"]`); await page.waitForTimeout(200); return v; };
  const fillV = await swatch("fill"), strokeV = await swatch("stroke"), textV = await swatch("text");
  let st = (await course(page, "c1")).maps[0].styles["idea:i1"];
  ok(!(await page.locator("#toast.show").count()), "changing a box's style shows no notice");
  ok(st.fill === fillV && st.stroke === strokeV && st.text === textV && st.shape === "cloud", `fill, outline and text colours save (${fillV}, ${strokeV}, ${textV}) and keep the shape`);
  ok(new RegExp(fillV, "i").test(await page.getAttribute('.cm-node[data-n="idea:i1"] .cm-shape', "fill") + (await page.getAttribute('.cm-node[data-n="idea:i1"] .cm-shape', "style") || "")), "the box shows its fill");
  // any colour (Pro), from the rainbow swatch at the end of the row
  if (!(await page.locator('[data-cm-any="fill"]').count())) await cmClick(page, '[data-cm="pick"][data-v="fill"]');
  await page.locator('[data-cm-any="fill"]').fill("#12a4b6"); await page.waitForTimeout(250);
  ok((await course(page, "c1")).maps[0].styles["idea:i1"].fill === "#12A4B6", "any fill colour, from the colour picker");
  await page.locator('[data-cm="font"]').count() || await cmClick(page, '[data-cm="style"]'); await page.selectOption('[data-cm="font"]', "hand"); await page.waitForTimeout(200);
  ok(/Caveat/.test(await page.evaluate(() => getComputedStyle(document.querySelector('.cm-node[data-n="idea:i1"] .cm-lab')).fontFamily)), "the box's words show in the chosen font (Handwritten: Caveat)");
  for (let i = 0; i < 3; i++) { await cmClick(page, '[data-cm="tsize"][data-v="1"]'); await page.waitForTimeout(80); }
  const w0 = await page.evaluate(() => document.querySelector('.cm-node[data-n="idea:i1"]').getBBox().width);
  await cmClick(page, '[data-cm="bsize"][data-v="1"]'); await page.waitForTimeout(200);
  st = (await course(page, "c1")).maps[0].styles["idea:i1"];
  await page.click('[data-cm="bold"]'); await page.waitForTimeout(150); await page.click('[data-cm="ital"]'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => { const l = getComputedStyle(document.querySelector('.cm-node[data-n="idea:i1"] .cm-lab')); return Number(l.fontWeight) >= 800 && l.fontStyle === "italic"; }) && (await course(page, "c1")).maps[0].styles["idea:i1"].b === 1 && (await course(page, "c1")).maps[0].styles["idea:i1"].i === 1, "Bold and Italic");
  ok(await page.getAttribute('[data-cm="bold"]', "aria-pressed") === "true" && await page.getAttribute('[data-cm="ital"]', "aria-pressed") === "true", "the B and I buttons show they're on");
  ok(st.font === "hand" && st.size === 16 && st.scale > 1, `font, text size and box size save (${st.font}, ${st.size}, ${st.scale})`);
  ok(await page.evaluate(() => document.querySelector('.cm-node[data-n="idea:i1"]').getBBox().width) > w0, "a bigger box draws bigger");
  await cmClick(page, '[data-cm="streset"]'); await page.waitForTimeout(200);
  ok(!(await course(page, "c1")).maps[0].styles["idea:i1"], "Reset Style goes back to the plain look");
  await cmClick(page, '[data-cm="shape"][data-v="cloud"]'); await page.waitForTimeout(150);
  for (const sh of ["box", "circle", "diamond", "hexagon", "text", "pill"]) { await cmClick(page, `[data-cm="shape"][data-v="${sh}"]`); await page.waitForTimeout(150); ok(await page.locator(`.cm-node[data-n="idea:i1"].sh-${sh}`).count() === 1, `shape: ${sh}`); }
  // a connection: words, line, arrows, flip
  const ekey = await page.evaluate(() => SBCMAP.state().g.edges.find(e => e.b === "idea:i1" || e.a === "idea:i1").key);
  await page.evaluate(k => { const S = SBCMAP.state(); S.selE = k; S.sel = ""; }, ekey); await tap(page, "idea:i1"); await page.evaluate(k => { const S = SBCMAP.state(); S.sel = ""; S.selE = k; }, ekey);
  await page.evaluate(() => { const b = document.createElement("button"); b.dataset.cm = "fit"; document.querySelector(".cm-tools").appendChild(b); b.click(); b.remove(); }); await page.waitForSelector("[data-cm-elab]");
  await page.fill("[data-cm-elab]", "is part of"); await page.press("[data-cm-elab]", "Enter"); await page.waitForTimeout(250);
  ok(await page.locator(".cm-elab", {hasText: "is part of"}).count() === 1, "words on a connection show on the line");
  for (const ln of ["dashed", "dotted", "solid"]) { await cmClick(page, `[data-cm="eline"][data-v="${ln}"]`); await page.waitForTimeout(150); ok(await page.locator(`.cm-edge.ln-${ln}[data-e="${ekey}"]`).count() === 1, `line: ${ln}`); }
  // thickness and colour, for any line
  await cmClick(page, '[data-cm="ewidth"][data-v="4"]'); await page.waitForTimeout(150);
  await cmClick(page, '[data-cm="ecol"][data-v="#D6336C"]'); await page.waitForTimeout(150);
  await page.locator('[data-cm-any="line"]').fill("#aa22cc"); await page.waitForTimeout(200);
  ok((await course(page, "c1")).maps[0].links.find(l => [l.a, l.b].sort().join("|") === ekey).col === "#AA22CC", "any line colour, from the colour picker");
  await cmClick(page, '[data-cm="ecol"][data-v="#D6336C"]'); await page.waitForTimeout(150);
  let LW = (await course(page, "c1")).maps[0].links.find(l => [l.a, l.b].sort().join("|") === ekey);
  ok(LW.w === 4 && LW.col === "#D6336C", "a line takes a thickness (Heavy) and a colour");
  ok(await page.evaluate(k => { const l = document.querySelector(`.cm-edge[data-e="${k}"] .cm-line`), cs = getComputedStyle(l); return parseFloat(cs.strokeWidth) === 5 && /214, 51, 108|d6336c/i.test(cs.stroke); }, ekey), "it draws heavy and in that colour (even while picked)");
  await cmClick(page, '[data-cm="earrow"][data-v="end"]'); await page.waitForTimeout(200);
  ok(/#cmA/.test(await page.getAttribute(`.cm-edge[data-e="${ekey}"] .cm-line`, "marker-end") || ""), "an arrow one way");
  ok(await page.evaluate(k => { const m = (document.querySelector(`.cm-edge[data-e="${k}"] .cm-line`).getAttribute("marker-end") || "").replace(/^url\(#|\)$/g, ""), p = document.getElementById(m); return !!p && /D6336C/i.test(p.innerHTML) && Number(p.getAttribute("markerWidth")) > 11; }, ekey), "its arrowhead takes the line's colour and is sized for it");
  let L = (await course(page, "c1")).maps[0].links.find(l => [l.a, l.b].sort().join("|") === ekey);
  const from = L.a; await cmClick(page, '[data-cm="eflip"]'); await page.waitForTimeout(200);
  L = (await course(page, "c1")).maps[0].links.find(l => [l.a, l.b].sort().join("|") === ekey);
  ok(L.a !== from && L.label === "is part of" && L.line === "solid" && L.arrow === "end", "Flip turns the arrow around and keeps the words and line");
  await cmClick(page, '[data-cm="earrow"][data-v="both"]'); await page.waitForTimeout(200);
  ok(/#cmA\w*S\)/.test(await page.getAttribute(`.cm-edge[data-e="${ekey}"] .cm-line`, "marker-start") || ""), "arrows both ways");
  ok(await fits(page), "the map and its panels fit at 1280px");
  await page.keyboard.press("Escape"); await page.waitForTimeout(250);

  /* A second map for a course, from a blank page */
  await act(page, "cm-new", "", {course: "c2"}); await page.waitForSelector("#cmName");
  ok(await page.inputValue("#cmCourse") === "c2" && await page.isChecked('[name="cmStart"][value="auto"]'), "New Map: the course is filled in, starting from course material");
  await page.fill("#cmName", "Photosynthesis"); await page.check('[name="cmStart"][value="blank"]'); await page.click("#dlg[open] [data-submit]");
  await page.waitForSelector('.cm-node[data-n="root"]');
  let c2 = await course(page, "c2");
  ok(c2.maps.length === 2 && c2.maps[1].name === "Photosynthesis" && c2.maps[1].auto === false, "a second map for the course, from a blank page");
  ok(/Photosynthesis/.test(await page.textContent("#dlg[open] .cm-top")) && await page.locator(".cm-node").count() >= 1, "it opens, named");
  await cmClick(page, '[data-cm="idea"]'); await page.waitForSelector("#cmAsk"); await page.fill("#cmAsk", "Chlorophyll"); await page.press("#cmAsk", "Enter"); await page.waitForTimeout(250);
  c2 = await course(page, "c2");
  ok(c2.maps[1].add.some(x => x.label === "Chlorophyll") && !c2.maps[0].add.some(x => x.label === "Chlorophyll"), "its ideas are its own: the other map doesn't change");
  ok(page.errs.length === 0, "no console errors: " + page.errs.join(" | "));
  await page.keyboard.press("Escape"); await page.waitForTimeout(250);

  /* My Course Material: choose which material the map starts with, then add more from the map's Add menu */
  await act(page, "cm-new", "", {course: "c1"}); await page.waitForSelector("#cmName");
  await page.check('[name="cmStart"][value="auto"]');
  ok(await page.locator(".cm-matbox .cm-mat input").count() >= 3 && await page.locator(".cm-matbox .cm-mat input:checked").count() === await page.locator(".cm-matbox .cm-mat input").count() && /Exams/.test(await page.textContent(".cm-matbox")) && /Notes/.test(await page.textContent(".cm-matbox")), "My Course Material lists the course's exams and notes, all ticked");
  await page.click('.cm-matbox [data-mat-all="0"]'); ok(/0 of \d+ chosen/.test(await page.textContent(".cm-matbox")), "Select None");
  await page.click("#dlg[open] [data-submit]"); await page.waitForTimeout(150); ok(/Tick at least one item/.test(await page.textContent("[data-cm-err]")), "with nothing ticked it asks for something");
  await page.check('.cm-matbox input[value="note:n1"]'); await page.fill("#cmName", "Carbon only"); await page.click("#dlg[open] [data-submit]"); await page.waitForSelector('.cm-node[data-n="root"]');
  let cm = (await course(page, "c1")).maps.find(m => m.name === "Carbon only");
  ok(cm && JSON.stringify(cm.mat) === '["note:n1"]' && await page.locator('.cm-node[data-n="note:n1"]').count() === 1 && await page.locator('.cm-node[data-n="note:n2"]').count() === 0 && await page.locator('.cm-node[data-n="exam:x1"]').count() === 0, "the map shows only the ticked note");
  await cmClick(page, '[data-cm="mat"]'); await page.waitForSelector(".cm-matf");
  ok(await page.isChecked('.cm-matf input[value="note:n1"]') && !(await page.isChecked('.cm-matf input[value="note:n2"]')), "Add, Course Material shows what's on the map");
  await page.check('.cm-matf input[value="note:n2"]'); await page.click(".cm-matf [type=submit]"); await page.waitForTimeout(250);
  cm = (await course(page, "c1")).maps.find(m => m.name === "Carbon only");
  ok(cm.mat.includes("note:n2") && await page.locator('.cm-node[data-n="note:n2"]').count() === 1, "ticking another note adds it to the map, ready to connect");
  await cmClick(page, '[data-cm="mat"]'); await page.waitForSelector(".cm-matf"); await page.click('.cm-matf [data-mat-all="1"]'); await page.click(".cm-matf [type=submit]"); await page.waitForTimeout(250);
  cm = (await course(page, "c1")).maps.find(m => m.name === "Carbon only");
  ok(cm.mat == null && await page.locator('.cm-node[data-n="exam:x1"]').count() === 1, "Select All goes back to all the course's material (new material joins by itself)");
  await page.keyboard.press("Escape"); await page.waitForTimeout(250);

  /* Describe it, offline: typed arrows need no AI */
  await act(page, "cm-new", "", {course: "c3"}); await page.waitForSelector("#cmName");
  await page.fill("#cmName", "Revolution"); await page.check('[name="cmStart"][value="describe"]');
  ok(await page.textContent("#dlg[open] [data-submit]") === "Draw My Map", "Describe it: the button says Draw My Map");
  await page.fill("#cmDesc", "Enlightenment -> French Revolution : inspires\nDebt -> French Revolution : triggers\nFrench Revolution -> Napoleon : leads to");
  const before = ctx.aiCalls.length; await page.click("#dlg[open] [data-submit]"); await page.waitForSelector('.cm-node[data-n="root"]');
  let c3 = await course(page, "c3"), dm = c3.maps[0];
  ok(dm.name === "Revolution" && dm.add.map(x => x.label).sort().join("|") === "Debt|Enlightenment|French Revolution|Napoleon" && dm.links.some(l => l.label === "leads to" && l.arrow === "end") && ctx.aiCalls.length === before, "arrows draw the map without AI, words and arrowheads included");
  await page.keyboard.press("Escape"); await page.waitForTimeout(250);
  /* A template */
  await act(page, "cm-new", "", {course: "c3"}); await page.waitForSelector("#cmName");
  await page.check('[name="cmStart"][value="tpl"]'); ok(await page.locator(".cm-tpl").count() >= 8 && await page.locator(".cm-tpl svg.cm-tthumb").count() >= 8, "templates show as small pictures");
  await page.click('.cm-tpl:has([value="timeline"])'); await page.fill("#cmName", ""); await page.click("#dlg[open] [data-submit]"); await page.waitForSelector('.cm-node[data-n="root"]');
  c3 = await course(page, "c3"); const tm = c3.maps[1];
  ok(tm && tm.add.length >= 3 && tm.pos && Object.keys(tm.styles || {}).length >= 1 && /Timeline/i.test(tm.name), "a template makes a ready-made map, named after it: " + (tm && tm.name));
  await page.keyboard.press("Escape"); await page.waitForTimeout(250);
  /* Scanning a hand-drawn map (Pro, AI reads the photo) */
  await act(page, "cm-new", "", {course: "c3"}); await page.waitForSelector("#cmName");
  await page.check('[name="cmStart"][value="scan"]');
  ok(await page.isVisible("[data-cm-drop]") && await page.textContent("#dlg[open] [data-submit]") === "Scan My Drawing", "Scan a drawing: a place for the photo and a Scan My Drawing button");
  await page.click("#dlg[open] [data-submit]"); await page.waitForTimeout(150);
  ok(/Take or upload a photo/.test(await page.textContent("[data-cm-err]")), "without a photo it asks for one");
  const PNG = Buffer.from((await page.evaluate(() => { const c = document.createElement("canvas"); c.width = 320; c.height = 220; const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, 320, 220); x.strokeRect(40, 40, 90, 40); x.strokeRect(190, 140, 90, 40); x.beginPath(); x.moveTo(130, 60); x.lineTo(190, 160); x.stroke(); x.fillStyle = "#000"; x.fillText("Evaporation", 50, 64); return c.toDataURL("image/png"); })).split(",")[1], "base64");
  await page.setInputFiles("#cmScan", {name: "map.png", mimeType: "image/png", buffer: PNG}); await page.waitForTimeout(200);
  ok(await page.isVisible("[data-cm-shot]") && await page.isVisible(".cm-drop-chg"), "the chosen photo shows, with Change Picture");
  ctx.aiReply = {center: "Water cycle", cx: 50, cy: 50, concepts: [{name: "Evaporation", x: 20, y: 20, shape: "cloud"}, {name: "Condensation", x: 80, y: 20, shape: "circle"}, {name: "Rain", x: 80, y: 80, shape: "box"}, {name: "Ocean", x: 20, y: 85, shape: "text"}],
    links: [{from: "Evaporation", to: "Condensation", label: "rises then", arrow: "end", line: "solid"}, {from: "Condensation", to: "Rain", label: "falls as", arrow: "end", line: "dashed"}, {from: "Rain", to: "Ocean", label: "", arrow: "end", line: "dotted"}, {from: "Water cycle", to: "Evaporation", label: "starts with", arrow: "none", line: "thick"}]};
  const nAi = ctx.aiCalls.length; await page.fill("#cmName", ""); await page.click("#dlg[open] [data-submit]"); await page.waitForSelector('.cm-node[data-n="root"]');
  c3 = await course(page, "c3"); const sm = c3.maps[2], idOf = l => "idea:" + (sm.add.find(x => x.label === l) || {}).id;
  ok(ctx.aiCalls.length === nAi + 1 && /image\/jpeg/.test(ctx.aiCalls[nAi]) && /inline_data|inlineData/.test(ctx.aiCalls[nAi]), "the photo goes to the AI as a picture");
  ok(sm.name === "Water cycle" && sm.add.length === 4 && sm.links.length === 4, "the drawing becomes a map: its name, 4 ideas and 4 lines");
  ok(sm.styles[idOf("Evaporation")].shape === "cloud" && sm.styles[idOf("Condensation")].shape === "circle" && sm.styles[idOf("Ocean")].shape === "text", "each idea keeps the shape it was drawn in");
  ok(sm.links.find(l => l.label === "falls as").line === "dashed" && sm.links.find(l => l.label === "starts with").line === "thick" && sm.links.find(l => l.label === "rises then").arrow === "end", "lines keep their words, style and arrows");
  ok(sm.pos[idOf("Evaporation")][0] < 0 && sm.pos[idOf("Evaporation")][1] < 0 && sm.pos[idOf("Rain")][0] > 0 && sm.pos[idOf("Rain")][1] > 0, "and ideas sit where they were drawn");
  await page.keyboard.press("Escape"); await page.waitForTimeout(250);
  ctx.aiReply = {center: "", concepts: [], links: []};
  await act(page, "cm-new", "", {course: "c3"}); await page.waitForSelector("#cmName"); await page.check('[name="cmStart"][value="scan"]');
  await page.setInputFiles("#cmScan", {name: "cat.png", mimeType: "image/png", buffer: PNG}); await page.click("#dlg[open] [data-submit]");
  await page.waitForFunction(() => { const e = document.querySelector("[data-cm-err]"); return e && !e.hidden; });
  ok(/No concept map was found/.test(await page.textContent("[data-cm-err]")) && (await course(page, "c3")).maps.length === 3, "a photo with no map in it says so and makes nothing");
  await page.keyboard.press("Escape"); await page.waitForTimeout(250);
  /* Videos and embeds (Pro) */
  await ctx.route(/youtube-nocookie\.com|i\.ytimg\.com|docs\.google\.com/, r => r.fulfill({status: 200, contentType: /ytimg/.test(r.request().url()) ? "image/png" : "text/html", body: /ytimg/.test(r.request().url()) ? PNG : "<!doctype html><title>player</title><p>player</p>"}));
  const blocked = []; page.on("console", m => { if (/Refused to frame|frame-src/.test(m.text())) blocked.push(m.text()); });
  await act(page, "cm-open", "c3", {kind: "course", map: sm.id}); await page.waitForSelector('.cm-node[data-n="root"]');
  await cmClick(page, '[data-cm="emb"]'); await page.waitForSelector("#cmEmbIn");
  await page.fill("#cmEmbIn", "https://example.com/video"); ok(/can't play on a map/.test(await page.textContent("[data-cm-embst]")) && await page.isDisabled(".cm-embf [type=submit]"), "a link from another site can't be embedded, and says which sites can");
  await page.fill("#cmEmbIn", "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42"); ok(/YouTube/.test(await page.textContent("[data-cm-embst]")) && !(await page.isDisabled(".cm-embf [type=submit]")), "a YouTube link is recognised as you paste it");
  await page.click(".cm-embf [type=submit]"); await page.waitForSelector(".cm-node .cm-emb");
  let em = (await course(page, "c3")).maps[2].add.find(x => x.emb);
  ok(em && em.emb.p === "youtube" && em.emb.e === "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&start=42" && /ytimg/.test(await page.getAttribute(".cm-node .cm-emb image", "href")), "it becomes a video on the map, with its thumbnail (privacy-enhanced player, start time kept)");
  await page.evaluate(() => { const S = SBCMAP.state(); S.sel = ""; S.selE = ""; });
  { const nb = await page.locator(".cm-node:has(.cm-emb)").boundingBox(); await page.mouse.click(nb.x + nb.width / 2, nb.y + nb.height - 8); await page.waitForTimeout(250); }
  ok(!(await page.locator(".cm-player").count()) && /Play/.test(await page.textContent(".cm-panel")), "a tap on the box outside the video picks it, to edit (the video doesn't open)");
  await page.click(".cm-node .cm-emb"); await page.waitForSelector(".cm-player iframe");
  ok(await page.evaluate(() => { const p = document.querySelector(".cm-player"), c = document.querySelector(".cm-canvas").getBoundingClientRect(), r = p.getBoundingClientRect();
    return !p.getAnimations().length && Math.abs((r.left + r.width / 2) - (c.left + c.width / 2)) < 2 && Math.abs((r.top + r.height / 2) - (c.top + c.height / 2)) < 2; }), "the player appears at once, in the middle (no fade or slide)");
  ok(await page.evaluate(() => !document.querySelector(".cm-node:has(.cm-emb) .cm-kdot")), "a video's box has no colour dot over its thumbnail");
  const fsrc = await page.getAttribute(".cm-player iframe", "src");
  ok(/^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/.test(fsrc) && /autoplay=1/.test(fsrc) && /allow-scripts/.test(await page.getAttribute(".cm-player iframe", "sandbox")), "a tap on the video itself plays it on the map, in a sandboxed frame");
  await page.waitForTimeout(600);
  ok(await page.frames().some(f => /youtube-nocookie/.test(f.url())) && !blocked.length, "the app's security policy lets the player load: " + blocked.join(" | "));
  await page.keyboard.press("Escape"); await page.waitForTimeout(200);
  ok(!(await page.locator(".cm-player").count()) && await page.isVisible(".cm-sheet"), "Escape closes the video, not the map");
  // paste a Google Slides link straight onto the map
  await page.evaluate(() => { const dt = new DataTransfer(); dt.setData("text/plain", "https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012/edit#slide=id.p"); SBCMAP.state().sel = ""; document.querySelector(".cm-canvas").dispatchEvent(new ClipboardEvent("paste", {clipboardData: dt, bubbles: true})); }); await page.waitForTimeout(300);
  em = (await course(page, "c3")).maps[2].add.filter(x => x.emb);
  ok(em.length === 2 && em[1].emb.p === "gslides" && /\/embed\?start=false/.test(em[1].emb.e), "pasting a Google Slides link onto the map adds the slides");
  ok(await page.evaluate(() => SBCMAP.state().sel) === "idea:" + em[1].id && /View/.test(await page.textContent(".cm-panel")), "the pasted embed is selected, ready to View"); await page.click('.cm-panel [data-cm="menu"][data-v="attach"]'); ok(/View/.test(await page.textContent(".cm-panel")) && await page.locator('.cm-panel [data-cm="emboff"]').count() === 1, "an embed's panel: View and Remove Embed");
  await cmClick(page, '[data-cm="play"]'); await page.waitForSelector(".cm-player iframe"); ok(/docs\.google\.com\/presentation/.test(await page.getAttribute(".cm-player iframe", "src")), "View opens the slides on the map");
  await cmClick(page, '[data-cm="unplay"]'); await cmClick(page, '[data-cm="emboff"]'); await page.waitForTimeout(200);
  ok((await course(page, "c3")).maps[2].add.filter(x => x.emb).length === 1, "Remove Embed takes it off");
  ok(page.errs.length === 0, "no console errors (embeds): " + page.errs.join(" | "));
  await page.keyboard.press("Escape"); await page.waitForTimeout(250);

  /* The list shows each map as a small picture of itself */
  await act(page, "cm-review", "c3"); await page.waitForSelector(".cm-mapcard");
  ok(await page.locator('.cm-mapcard:has(.cm-ctitle:text-is("Water cycle")) svg.cm-peek text', {hasText: "Evaporation"}).count() === 1 && await page.locator('.cm-mapcard:has(.cm-ctitle:text-is("Water cycle")) .cm-peek ellipse').count() >= 2, "a map's card shows a preview of the map, its words and shapes");
  ok(await page.evaluate(() => [...document.querySelectorAll(".cm-peek")].every(svg => { const boxes = [...svg.querySelectorAll(".pk-n, .pk-root")].map(b => b.getBBox());
    return [...svg.querySelectorAll(".pk-e line")].every(l => [[+l.getAttribute("x1"), +l.getAttribute("y1")], [+l.getAttribute("x2"), +l.getAttribute("y2")]].every(([x, y]) => boxes.every(r => !(x > r.x + 3 && x < r.x + r.width - 3 && y > r.y + 3 && y < r.y + r.height - 3)))); })), "preview lines stop at the boxes' edges (none runs under a box)");
  ok(page.errs.length === 0, "no console errors (describe, templates, scan): " + page.errs.join(" | "));
  await act(page, "filter", "all").catch(() => {}); await page.evaluate(() => { const c = document.querySelector('[data-act="filter"][data-id="all"], [data-act="chip"][data-id="all"]'); if (c) c.click(); }); await page.waitForTimeout(200);

  /* Rename and delete */
  await act(page, "cm-review", "c2"); await page.waitForTimeout(250);
  await act(page, "cm-ren", "m1", {course: "c2"}); await page.waitForSelector("#cmName");
  await page.fill("#cmName", "Respiration"); await page.click("#dlg[open] [data-submit]"); await page.waitForTimeout(250);
  ok((await course(page, "c2")).maps[0].name === "Respiration" && /Respiration/.test(await page.textContent(".cm-grid")), "Rename");
  await page.click('.cm-mapcard:has(.cm-ctitle:text-is("Respiration")) [data-act="cm-del"]'); await page.waitForSelector("#dlg[open] [data-submit]");
  ok(/Delete Respiration\?/.test(await page.textContent("#dlg[open]")) && (await course(page, "c2")).maps.length === 2, "Delete asks first");
  await page.click("#dlg[open] [data-submit]"); await page.waitForTimeout(250);
  ok((await course(page, "c2")).maps.length === 1 && !(await titles(page)).includes("Respiration") && !(await page.locator("#toast.show").count()), "Delete, with no notice");
  await page.evaluate(() => document.activeElement && document.activeElement.blur()); await page.keyboard.press("Control+z"); await page.waitForTimeout(300);
  ok((await course(page, "c2")).maps.length === 2 && (await titles(page)).includes("Respiration"), "Ctrl+Z brings it back");
  // the course page's card
  ok(/2 maps for this course/.test(await page.evaluate(() => SBCMAP.courseCard(window.__sbProStudy.state().courses.c2))) && /Create Map/.test(await page.evaluate(() => SBCMAP.courseCard({id: "zz", name: "Art", color: "#888888"}))), "the course page's card counts a course's maps, or offers to create one");
  ok(page.errs.length === 0, "no console errors (list): " + page.errs.join(" | "));
  await ctx.close();

  /* Undo and Redo on the map */
  {
    const ctxU = await mkCtx(), pu = await open(ctxU);
    await act(pu, "cm-open", "c2", {kind: "course", map: "m1"}); await pu.waitForSelector('.cm-node[data-n="idea:a"]');
    const und = () => pu.isDisabled('.cm-tools [data-cm="undo"]'), red = () => pu.isDisabled('.cm-tools [data-cm="redo"]');
    const m1 = async () => (await course(pu, "c2")).maps.find(m => m.id === "m1");
    ok(await und() && await red(), "a freshly opened map: Undo and Redo are greyed out");
    // the dotted background moves and zooms with the map
    const bg = () => pu.evaluate(() => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => { const c = document.querySelector(".cm-dots"), x = c.getContext("2d"), d = x.getImageData(0, 0, c.width, c.height).data; let ink = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) ink++; res({x: c.dataset.x, g: parseFloat(c.dataset.g), ink, w: c.width}); }))));
    const b0 = await bg(), cvb = await pu.locator(".cm-canvas").boundingBox();
    await pu.mouse.move(cvb.x + cvb.width - 60, cvb.y + cvb.height - 60); await pu.mouse.down(); for (let i = 1; i <= 5; i++) await pu.mouse.move(cvb.x + cvb.width - 60 - i * 7, cvb.y + cvb.height - 60 - i * 3); await pu.mouse.up(); await pu.waitForTimeout(150);
    const b1 = await bg(); ok(b0.ink > 50 && b0.w > 100, `the dots are drawn on the map (${b0.ink} pixels)`); ok(b1.x !== b0.x, `dragging the map moves the dots with it (${b0.x} to ${b1.x})`);
    await pu.click('[data-cm="in"]'); await pu.waitForTimeout(150); const b2 = await bg();
    ok(b2.g > b1.g, `zooming in spreads the dots out (${b1.g} to ${b2.g}px)`);
    await pu.click('[data-cm="out"]'); await pu.waitForTimeout(150);
    await tap(pu, "idea:a"); await cmClick(pu, '[data-cm="shape"][data-v="cloud"]'); await pu.waitForTimeout(200);
    ok(((await m1()).styles || {})["idea:a"].shape === "cloud" && !(await und()) && await red(), "a change: Undo is ready");
    await pu.click('.cm-tools [data-cm="undo"]'); await pu.waitForTimeout(250);
    ok(!((await m1()).styles || {})["idea:a"] && await pu.locator('.cm-node[data-n="idea:a"].sh-cloud').count() === 0 && !(await red()), "Undo takes the cloud off, on the map and in what's saved; Redo is ready");
    await pu.click('.cm-tools [data-cm="redo"]'); await pu.waitForTimeout(250);
    ok(((await m1()).styles || {})["idea:a"].shape === "cloud" && await pu.locator('.cm-node[data-n="idea:a"].sh-cloud').count() === 1 && await red(), "Redo puts it back");
    // an idea added, undone, redone
    await pu.evaluate(() => { const S = SBCMAP.state(); S.sel = ""; S.selE = ""; }); await cmClick(pu, '[data-cm="idea"]'); await pu.waitForSelector("#cmAsk"); await pu.fill("#cmAsk", "NADH"); await pu.press("#cmAsk", "Enter"); await pu.waitForTimeout(250);
    const hasN = async () => (await m1()).add.some(x => x.label === "NADH");
    ok(await hasN() && await pu.locator(".cm-node .cm-lab", {hasText: "NADH"}).count() === 1, "a new idea");
    await pu.click('.cm-tools [data-cm="undo"]'); await pu.waitForTimeout(250);
    ok(!(await hasN()) && await pu.locator(".cm-node .cm-lab", {hasText: "NADH"}).count() === 0, "Undo removes the idea");
    await pu.click('.cm-tools [data-cm="redo"]'); await pu.waitForTimeout(250);
    ok(await hasN() && await pu.locator(".cm-node .cm-lab", {hasText: "NADH"}).count() === 1, "Redo brings it back");
    // a box moved, undone
    const nb = await pu.locator('.cm-node[data-n="idea:b"]').boundingBox(), p0 = await pu.evaluate(() => SBCMAP.state().pos["idea:b"].slice());
    await pu.mouse.move(nb.x + nb.width / 2, nb.y + nb.height / 2); await pu.mouse.down(); for (let i = 1; i <= 6; i++) await pu.mouse.move(nb.x + nb.width / 2 + i * 15, nb.y + nb.height / 2 + i * 8); await pu.mouse.up(); await pu.waitForTimeout(250);
    const p1 = await pu.evaluate(() => SBCMAP.state().pos["idea:b"].slice());
    ok(p1[0] !== p0[0], "a box dragged to a new place");
    await pu.click('.cm-tools [data-cm="undo"]'); await pu.waitForTimeout(250);
    const p2 = await pu.evaluate(() => SBCMAP.state().pos["idea:b"].slice());
    ok(Math.abs(p2[0] - p0[0]) < 2 && Math.abs(p2[1] - p0[1]) < 2, "Undo moves it back");
    // keyboard: Ctrl+Z and Ctrl+Shift+Z, and a new change clears Redo
    await pu.evaluate(() => document.querySelector(".cm-canvas").focus());
    await pu.keyboard.press("Control+Shift+Z"); await pu.waitForTimeout(250);
    const p3 = await pu.evaluate(() => SBCMAP.state().pos["idea:b"].slice());
    ok(Math.abs(p3[0] - p1[0]) < 2, "Ctrl+Shift+Z redoes the move");
    await pu.keyboard.press("Control+Z"); await pu.waitForTimeout(250);
    ok(Math.abs((await pu.evaluate(() => SBCMAP.state().pos["idea:b"][0])) - p0[0]) < 2 && !(await red()), "Ctrl+Z undoes it again");
    await tap(pu, "idea:a"); await cmClick(pu, '[data-cm="shape"][data-v="diamond"]'); await pu.waitForTimeout(200);
    ok(await red(), "a new change after an Undo clears Redo");
    // no key and no coloured dots unless Colour by Knowledge is on
    ok(await pu.isHidden(".cm-legend") && await pu.locator(".cm-kdot").count() === 0, "no key or coloured dots on a plain map");
    // curved lines: Curved, then drag the handle (the curve's control point) to shape it
    const ck = await pu.evaluate(() => SBCMAP.state().g.edges.find(e => [e.a, e.b].sort().join() === ["idea:a", "idea:b"].sort().join()).key);
    await pu.evaluate(k => { const S = SBCMAP.state(); S.sel = ""; S.selE = k; }, ck); await pu.evaluate(() => { const b = document.createElement("button"); b.dataset.cm = "fit"; document.querySelector(".cm-tools").appendChild(b); b.click(); b.remove(); });
    await pu.waitForSelector('[data-cm="ecurve"]'); await pu.click('[data-cm="ecurve"][data-v="1"]'); await pu.waitForTimeout(250);
    const lk = async () => (await m1()).links.find(l => [l.a, l.b].sort().join("|") === ck);
    ok(Array.isArray((await lk()).cv) && /Q/.test(await pu.getAttribute(`.cm-edge[data-e="${ck}"] .cm-line`, "d")) && await pu.locator(".cm-chdl").count() === 1, "Curved draws a curve, with a handle to shape it");
    const cv0 = (await lk()).cv.slice(), hb = await pu.locator(".cm-chdl").boundingBox();
    await pu.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2); await pu.mouse.down(); for (let i = 1; i <= 6; i++) await pu.mouse.move(hb.x + hb.width / 2 + i * 8, hb.y + hb.height / 2 + i * 12); await pu.mouse.up(); await pu.waitForTimeout(250);
    const cv1 = (await lk()).cv;
    ok(cv1 && (cv1[0] !== cv0[0] || cv1[1] !== cv0[1]), `dragging the handle reshapes the curve (${cv0} to ${cv1})`);
    ok(await pu.evaluate(k => { const p = document.querySelector(`.cm-edge[data-e="${k}"] .cm-line`), h = document.querySelector(".cm-chdl"), m = /Q([-\d.]+) ([-\d.]+)/.exec(p.getAttribute("d")); return m && Math.abs(+m[1] - +h.getAttribute("cx")) < 1 && Math.abs(+m[2] - +h.getAttribute("cy")) < 1; }, ck), "the handle is the curve's control point");
    await pu.click('[data-cm="ecurve"][data-v="0"]'); await pu.waitForTimeout(250);
    ok(!(await lk()).cv && await pu.locator(`.cm-edge[data-e="${ck}"] line.cm-line`).count() === 1 && await pu.locator(".cm-chdl").count() === 0, "Straight makes it a straight line again");
    await pu.click('.cm-tools [data-cm="undo"]'); await pu.waitForTimeout(250);
    ok(JSON.stringify((await lk()).cv) === JSON.stringify(cv1), "Undo brings the curve back as it was shaped");
    await pu.evaluate(() => { const S = SBCMAP.state(); S.selE = ""; }); await pu.evaluate(() => { const b = document.createElement("button"); b.dataset.cm = "desel"; document.querySelector(".cm-tools").appendChild(b); b.click(); b.remove(); });

    // resizing: drag a picked box's side, then its corner
    await tap(pu, "idea:b");
    ok(await pu.locator(".cm-hdls .cm-hdl").count() === 5, "a picked box shows handles on its sides and a corner");
    const w0 = await pu.evaluate(() => SBCMAP.state().size["idea:b"][0]), hE = await pu.locator(".cm-hdl.h-e").boundingBox();
    await pu.mouse.move(hE.x + hE.width / 2, hE.y + hE.height / 2); await pu.mouse.down();
    for (let i = 1; i <= 6; i++) await pu.mouse.move(hE.x + hE.width / 2 + i * 10, hE.y + hE.height / 2);
    ok(await pu.isVisible(".cm-hdls .cm-rsz"), "dragging shows the new size");
    await pu.mouse.up(); await pu.waitForTimeout(300);
    const sb = ((await m1()).styles || {})["idea:b"] || {}, w1 = await pu.evaluate(() => SBCMAP.state().size["idea:b"][0]), k = await pu.evaluate(() => SBCMAP.state().view.k);
    ok(sb.bw && Math.abs(w1 - (w0 + 120 / k)) < 6 && !sb.bh, `dragging the right side widens the box, and only its width (${Math.round(w0)} to ${Math.round(w1)})`);
    const hS = await pu.locator(".cm-hdl.h-se").boundingBox(), h0 = await pu.evaluate(() => SBCMAP.state().size["idea:b"][1]);
    await pu.mouse.move(hS.x + hS.width / 2, hS.y + hS.height / 2); await pu.mouse.down(); for (let i = 1; i <= 5; i++) await pu.mouse.move(hS.x + hS.width / 2 + i * 4, hS.y + hS.height / 2 + i * 8); await pu.mouse.up(); await pu.waitForTimeout(300);
    ok(((await m1()).styles["idea:b"] || {}).bh > h0 && await pu.evaluate(() => SBCMAP.state().size["idea:b"][1]) > h0, "the corner changes the height too");
    const hW = await pu.locator(".cm-hdl.h-w").boundingBox();
    await pu.mouse.move(hW.x + hW.width / 2, hW.y + hW.height / 2); await pu.mouse.down(); for (let i = 1; i <= 8; i++) await pu.mouse.move(hW.x + hW.width / 2 + i * 60, hW.y + hW.height / 2); await pu.mouse.up(); await pu.waitForTimeout(300);
    ok(await pu.evaluate(() => { const S = SBCMAP.state(), el = document.querySelector('.cm-node[data-n="idea:b"] .cm-lab'); return S.size["idea:b"][0] >= el.getBBox().width + 20; }), "a box can't be made narrower than its words");
    await pu.click('.cm-tools [data-cm="undo"]'); await pu.waitForTimeout(250); await pu.click('.cm-tools [data-cm="undo"]'); await pu.waitForTimeout(250); await pu.click('.cm-tools [data-cm="undo"]'); await pu.waitForTimeout(250);
    ok(!((await m1()).styles || {})["idea:b"] || !(await m1()).styles["idea:b"].bw, "Undo takes the sizes back");
    ok(!(await pu.locator("#toast.show").count()) && pu.errs.length === 0, "no notices, no errors: " + pu.errs.join(" | "));
    await ctxU.close();
  }

  /* Map Style: a whole look for the map, kept on the map */
  {
    const ctxL = await mkCtx(), pl = await open(ctxL), mp = async () => (await course(pl, "c2")).maps.find(m => m.id === "m1");
    await act(pl, "cm-open", "c2", {kind: "course", map: "m1"}); await pl.waitForSelector(".cm-node");
    ok(!(await mp()).pack && await pl.getAttribute(".cm-canvas", "data-pk") === "t_classic" && await pl.locator(".cm-node").count() > 0, "a map with no style chosen matches the theme in use (Classic)");
    await pl.evaluate(() => { const s = window.__sbProStudy.state(); s.settings.style = Object.assign({}, s.settings.style, {skin: "sakura"}); });
    await pl.click(".cm-x"); await pl.waitForTimeout(250); await act(pl, "cm-open", "c2", {kind: "course", map: "m1"}); await pl.waitForSelector(".cm-node");
    ok(await pl.getAttribute(".cm-canvas", "data-pk") === "sakura" && await pl.locator(".cm-node.is-pk").count() > 0, "on Sakura, the same map opens in Sakura's style");
    await pl.evaluate(() => { const s = window.__sbProStudy.state(); s.settings.style = Object.assign({}, s.settings.style, {skin: "classic"}); });
    await pl.click(".cm-x"); await pl.waitForTimeout(250); await act(pl, "cm-open", "c2", {kind: "course", map: "m1"}); await pl.waitForSelector(".cm-node");
    await pl.click('.cm-tools [data-cm="looks"]'); await pl.waitForSelector(".cm-looks");
    ok(await pl.locator(".cm-look").count() >= 104 && await pl.locator('.cm-look[data-v^="t-"]').count() === 0 && await pl.locator('.cm-look.on[data-v="theme"]').count() === 1, "Map Style: Plain, Match My Theme, 20 subjects and every app theme, each with its own style; a new map matches the theme");
    // a trackpad or mouse wheel over the list scrolls the list (not the map's zoom)
    const k0 = await pl.evaluate(() => SBCMAP.state().view.k), lb = await pl.locator(".cm-panel").boundingBox();
    await pl.mouse.move(lb.x + lb.width / 2, lb.y + lb.height / 2); await pl.mouse.wheel(0, 400); await pl.waitForTimeout(250);
    ok(await pl.evaluate(() => document.querySelector(".cm-panel").scrollTop) > 100 && await pl.evaluate(() => SBCMAP.state().view.k) === k0, "scrolling over the style list scrolls it, and doesn't zoom the map");
    await pl.click('.cm-look[data-v="t_lavender"]'); await pl.waitForTimeout(300);
    ok((await mp()).pack === "t_lavender" && await pl.getAttribute(".cm-canvas", "data-pk") === "t_lavender" && await pl.locator(".cm-canvas.cm-pkn").count() === 1 && await pl.evaluate(() => document.querySelector('.cm-node[data-n="idea:a"]').dataset.col.toLowerCase() === "#8a73c9"), "any theme's style can be chosen, not just the current theme's (Lavender's colour, while on Classic)");
    await pl.click('.cm-look[data-v="halloween"]'); await pl.waitForTimeout(300);
    ok(await pl.getAttribute(".cm-canvas", "data-pk") === "halloween", "a theme with its own style: Halloween, while on Classic");
    await pl.click('.cm-look[data-v="med"]'); await pl.waitForTimeout(300);
    ok((await mp()).pack === "med" && await pl.getAttribute(".cm-canvas", "data-pk") === "med" && await pl.locator(".cm-canvas.cm-pk").count() === 1, "choosing Medicine & Nursing keeps it on the map");
    ok(await pl.evaluate(() => /data:image\/svg/.test(getComputedStyle(document.querySelector(".cm-canvas")).backgroundImage)), "the style's background is on the map");
    ok(await pl.locator(".cm-node.is-pk .pk-o.cm-shape").count() === await pl.locator(".cm-node").count() && await pl.locator(".cm-edge.pk-e").count() >= 3, "every box and line is drawn in the style");
    ok(await pl.evaluate(() => { const ln = document.querySelector(".cm-edge .cm-line"); return /#E03150|rgb\(224, 49, 80\)/i.test(getComputedStyle(ln).stroke); }), "the lines are the style's heartbeat red");
    ok(await pl.locator(".cm-looks .cm-look.on[data-v=\"med\"]").count() === 1, "the picker stays open, showing the choice");
    const x0 = await pl.evaluate(() => getComputedStyle(document.querySelector(".cm-canvas")).getPropertyValue("--pkx"));
    await pl.click('.cm-zoom [data-cm="out"]'); await pl.waitForTimeout(200);
    ok(await pl.evaluate(() => getComputedStyle(document.querySelector(".cm-canvas")).getPropertyValue("--pkw")) !== "" && await pl.evaluate(() => getComputedStyle(document.querySelector(".cm-canvas")).getPropertyValue("--pkx")) !== x0 + "x", "the background moves and zooms with the map");
    // a box dragged: its lines follow, still in the style
    const nb = await pl.locator('.cm-node[data-n="idea:b"]').boundingBox();
    await pl.mouse.move(nb.x + nb.width / 2, nb.y + nb.height / 2); await pl.mouse.down(); for (let i = 1; i <= 5; i++) await pl.mouse.move(nb.x + nb.width / 2 + i * 12, nb.y + nb.height / 2 + i * 6); await pl.mouse.up(); await pl.waitForTimeout(300);
    ok(await pl.locator(".cm-edge.pk-e").count() >= 3 && await pl.locator(".cm-edge:not(.pk-e)").count() === 0, "dragging a box keeps its lines in the style");
    await pl.click('.cm-tools [data-cm="looks"]'); await pl.waitForTimeout(150); if (!(await pl.locator(".cm-looks").count())) { await pl.click('.cm-tools [data-cm="looks"]'); await pl.waitForSelector(".cm-looks"); }
    await pl.click('.cm-look[data-v="theme"]'); await pl.waitForTimeout(300);
    ok((await mp()).pack === "theme" && await pl.getAttribute(".cm-canvas", "data-pk") === "t_classic", "Match My Theme on Classic: Classic's own style (index cards and paper clips)");
    await pl.evaluate(() => { const s = window.__sbProStudy.state(); s.settings.style = Object.assign({}, s.settings.style, {skin: "sakura"}); }); await pl.click('.cm-look[data-v="theme"]').catch(() => {});
    await pl.click('.cm-tools [data-cm="undo"]'); await pl.waitForTimeout(300);
    ok((await mp()).pack === "med" && await pl.getAttribute(".cm-canvas", "data-pk") === "med", "Undo puts the last style back");
    await pl.click('.cm-tools [data-cm="redo"]'); await pl.waitForTimeout(300);
    ok(await pl.getAttribute(".cm-canvas", "data-pk") === "sakura", "Match My Theme follows the theme (Sakura has its own style)");
    await pl.locator('.cm-node[data-n="idea:a"]').click(); await pl.waitForTimeout(200);
    if (!(await pl.locator(".cm-pknote").count())) await cmClick(pl, '.cm-panel [data-cm="style"]');
    ok(await pl.locator(".cm-pknote").count() === 1, "a box's Style says the map's style draws the boxes");
    await pl.click('.cm-tools [data-cm="know"]'); await pl.waitForTimeout(300);
    ok(await pl.locator(".cm-node.is-pk").count() === 0 && await pl.locator(".cm-canvas.cm-pk").count() === 1, "Colour by Knowledge shows plain boxes on the style's background");
    await pl.click('.cm-tools [data-cm="know"]'); await pl.waitForTimeout(200);
    await pl.click('.cm-tools [data-cm="looks"]'); await pl.waitForSelector(".cm-looks"); await pl.click('.cm-look[data-v=""]'); await pl.waitForTimeout(300);
    ok((await mp()).pack === "plain" && await pl.locator(".cm-canvas.cm-pk, .cm-canvas.cm-pkn").count() === 0 && await pl.locator(".cm-node.is-pk").count() === 0, "Plain takes the style off, and is kept (it doesn't fall back to the theme)");
    // Map Style closes when you click away from it (on the map), or press Escape, like a menu
    if (!(await pl.locator(".cm-looks").count())) await pl.click('.cm-tools [data-cm="looks"]'); await pl.waitForSelector(".cm-looks");
    const cvb = await pl.locator(".cm-canvas").boundingBox(); await pl.mouse.click(cvb.x + 40, cvb.y + 40); await pl.waitForTimeout(200);
    ok(await pl.locator(".cm-looks").count() === 0 && await pl.locator('.cm-tools [data-cm="looks"].on').count() === 0, "clicking away from Map Style closes it");
    await pl.click('.cm-tools [data-cm="looks"]'); await pl.waitForSelector(".cm-looks"); await pl.keyboard.press("Escape"); await pl.waitForTimeout(200);
    ok(await pl.locator(".cm-looks").count() === 0 && await pl.locator(".cm-node").count() > 0, "Escape closes Map Style, not the map");
    // closed with the picker and a menu open, the map opens again with neither
    await pl.click('.cm-tools [data-cm="looks"]'); await pl.waitForSelector(".cm-looks"); await pl.click('.cm-tools [data-cm="menu"][data-v="add"]'); await pl.waitForSelector(".cm-menu");
    await pl.click(".cm-x"); await pl.waitForTimeout(300);
    await act(pl, "cm-open", "c2", {kind: "course", map: "m1"}); await pl.waitForSelector(".cm-node"); await pl.waitForTimeout(200);
    ok(await pl.locator(".cm-looks").count() === 0 && await pl.locator(".cm-menu").count() === 0 && await pl.locator('.cm-tools [data-cm="looks"].on').count() === 0, "a map reopens with Map Style and its menus closed");
    await tap(pl, "idea:a"); if (!(await pl.locator(".cm-panel .cm-style").count())) await pl.click('.cm-panel [data-cm="style"]'); await pl.waitForTimeout(150);
    await pl.click(".cm-x"); await pl.waitForTimeout(300); await act(pl, "cm-open", "c2", {kind: "course", map: "m1"}); await pl.waitForSelector(".cm-node"); await tap(pl, "idea:a"); await pl.waitForTimeout(200);
    ok(await pl.locator(".cm-panel .cm-style:not([hidden])").count() === 0 && await pl.locator('.cm-panel [data-cm="style"][aria-expanded="true"]').count() === 0, "and a box's Style section starts closed too");
    // without Pro (e.g. Pro ended while the map was open): no style is drawn, the picker marks every style Pro, and picking one opens the Pro sheet
    await pl.click('.cm-tools [data-cm="looks"]').catch(() => {}); if (!(await pl.locator(".cm-looks").count())) await pl.click('.cm-tools [data-cm="looks"]'); await pl.waitForSelector(".cm-looks");
    await pl.click('.cm-look[data-v="sakura"]'); await pl.waitForTimeout(300);
    ok(await pl.locator(".cm-canvas.cm-pk").count() === 1, "with Pro, the style shows");
    await pl.evaluate(() => { window.__realLocked = SBPRO.locked; SBPRO.locked = () => true; });
    await pl.click('.cm-look[data-v=""]'); await pl.waitForTimeout(150); await pl.click('.cm-tools [data-cm="looks"]').catch(() => {}); if (!(await pl.locator(".cm-looks").count())) await pl.click('.cm-tools [data-cm="looks"]'); await pl.waitForSelector(".cm-looks");
    ok(await pl.locator(".cm-canvas.cm-pk").count() === 0 && await pl.locator(".cm-node.is-pk").count() === 0, "without Pro, the map is drawn plain");
    ok(await pl.locator('.cm-look[data-v="sakura"] .pro-badge').count() === 1 && await pl.locator('.cm-look[data-v="med"] .pro-badge').count() === 1 && await pl.locator('.cm-look[data-v=""] .pro-badge').count() === 0, "theme and subject styles are marked Pro; Plain isn't");
    ok(await pl.locator(".cm-look .pro-badge").count() === await pl.locator(".cm-look").count() - 15 - (await pl.locator('.cm-look[data-v="theme"] .pro-badge').count() ? 0 : 1), "the 14 plain-colour styles (and Plain) are free, everything else is Pro");
    const before = (await mp()).pack;
    await pl.click('.cm-look[data-v="sakura"]'); await pl.waitForTimeout(300);
    ok(await pl.locator("#dlg[open] .plan-sheet").count() === 1 && /This map style is part of Studyboard Pro/.test(await pl.textContent("#dlg[open]")) && (await mp()).pack === before, "picking a Pro theme's style without Pro opens the Pro sheet and changes nothing");
    await pl.keyboard.press("Escape"); await pl.waitForTimeout(200);
    await pl.evaluate(() => { SBPRO.locked = window.__realLocked; });
    ok(!(await pl.locator("#toast.show").count()) && pl.errs.length === 0, "Map Style: no notices, no errors: " + pl.errs.join(" | "));
    await ctxL.close();
  }

  /* Double-click an empty spot: a new idea there, named first */
  {
    const ctxD = await mkCtx(), pd = await open(ctxD);
    await act(pd, "cm-open", "c2", {kind: "course", map: "m1"}); await pd.waitForSelector(".cm-node");
    const n0 = await pd.locator(".cm-node").count(), cvb = await pd.locator(".cm-canvas").boundingBox(), px = cvb.x + cvb.width * 0.82, py = cvb.y + cvb.height * 0.22;
    ok(await pd.evaluate(([x, y]) => { const el = document.elementFromPoint(x, y); return !!el && !el.closest(".cm-node, .cm-edge, .cm-panel, .cm-zoom"); }, [px, py]), "the spot is empty map");
    await pd.mouse.dblclick(px, py); await pd.waitForSelector("#cmAsk");
    ok(/Name the new idea/.test(await pd.textContent(".cm-ask")), "double-clicking the map asks for the new idea's name");
    await pd.fill("#cmAsk", "Electron Transport"); await pd.keyboard.press("Enter"); await pd.waitForTimeout(400);
    const nb = await pd.locator(".cm-node", {hasText: "Electron Transport"}).boundingBox();
    ok(await pd.locator(".cm-node").count() === n0 + 1 && nb && Math.hypot(nb.x + nb.width / 2 - px, nb.y + nb.height / 2 - py) < 24, "the idea appears where you double-clicked");
    const mp = (await course(pd, "c2")).maps.find(m => m.id === "m1"), added = mp.add.find(i => i.label === "Electron Transport");
    ok(added && mp.pos["idea:" + added.id] && !mp.links.some(l => l.b === "idea:" + added.id || l.a === "idea:" + added.id), "it's saved with its place, not connected yet");
    ok(await pd.locator(".cm-node.is-sel", {hasText: "Electron Transport"}).count() === 1, "and it's picked, ready to connect or style");
    await pd.mouse.dblclick(px - 160, py + 120); await pd.waitForSelector("#cmAsk"); await pd.keyboard.press("Escape"); await pd.waitForTimeout(250);
    ok(await pd.locator(".cm-node").count() === n0 + 1 && await pd.locator(".cm-node").count() > 0, "Escape (or no name) adds nothing");
    await pd.locator(".cm-node", {hasText: "Electron Transport"}).dblclick(); await pd.waitForTimeout(300);
    ok(await pd.locator("#cmAsk").count() === 0 || !/Name the new idea/.test(await pd.textContent(".cm-panel")), "double-clicking a box doesn't add an idea");
    ok(pd.errs.length === 0, "double-click: no errors: " + pd.errs.join(" | "));
    await ctxD.close();
  }

  /* Free plan: maps for everyone; styles beyond the plain colours, embeds, pictures, any colour, PDF and lecture links, Colour by Knowledge are Pro */
  {
    const fctx = await mkCtx(null, {free: true}), fp = await open(fctx), sheet = async () => (await fp.locator("#dlg[open] .plan-sheet").count()) ? await fp.textContent("#dlg[open]") : "";
    const reopen = async () => { await fp.keyboard.press("Escape"); await fp.waitForTimeout(200); if (!(await fp.locator(".cm-node").count())) { await act(fp, "cm-open", "c2", {kind: "course", map: "m1"}); await fp.waitForSelector(".cm-node"); } };
    await act(fp, "cm-new", "", {course: "c2"}); await fp.waitForSelector("#cmName");
    ok(!(await sheet()), "free: New Map opens New Map, not the Pro sheet");
    await fp.keyboard.press("Escape"); await fp.waitForTimeout(200);
    await act(fp, "cm-open", "c2", {kind: "course", map: "m1"}); await fp.waitForSelector(".cm-node");
    ok(await fp.locator(".cm-node").count() >= 4 && !(await sheet()), "free: a map opens, with its ideas");
    await act(fp, "cm-review", ""); await fp.waitForTimeout(300); await act(fp, "cm-open", "c2", {kind: "course", map: "m1"}); await fp.waitForSelector(".cm-node");
    // Map Style: the plain colours are free, the rest Pro
    await fp.click('.cm-tools [data-cm="looks"]'); await fp.waitForSelector(".cm-looks");
    ok(await fp.locator('.cm-look[data-v="t_lavender"] .pro-badge').count() === 0 && await fp.locator('.cm-look[data-v="t_indigo"] .pro-badge').count() === 0 && await fp.locator('.cm-look[data-v="sakura"] .pro-badge').count() === 1 && await fp.locator('.cm-look[data-v="med"] .pro-badge').count() === 1, "free: plain-colour styles have no PRO badge; scene and subject styles do");
    await fp.click('.cm-look[data-v="t_lavender"]'); await fp.waitForTimeout(300);
    ok(await fp.getAttribute(".cm-canvas", "data-pk") === "t_lavender" && !(await sheet()), "free: a plain-colour style (Lavender) can be used");
    await fp.click('.cm-look[data-v="med"]'); await fp.waitForTimeout(300);
    ok(/This map style is part of Studyboard Pro/.test(await sheet()), "free: a subject style opens the Pro sheet");
    await reopen();
    ok(await fp.getAttribute(".cm-canvas", "data-pk") === "t_lavender", "and the map keeps its free style");
    // Colour by Knowledge
    await fp.click('.cm-tools [data-cm="know"]'); await fp.waitForTimeout(300);
    ok(/Colour by Knowledge is part of Studyboard Pro/.test(await sheet()), "free: Colour by Knowledge opens the Pro sheet");
    await reopen();
    // an idea's Attach menu: everything there is Pro
    await tap(fp, "idea:a"); await fp.click('.cm-panel [data-cm="menu"][data-v="attach"]'); await fp.waitForSelector(".cm-menu");
    ok(await fp.locator(".cm-menu .pro-badge").count() === 5, "free: Attach's Flashcards and Questions, PDF Page, Lecture Moment, Picture and Video are marked Pro");
    await fp.click('.cm-menu [data-cm="atlec"]'); await fp.waitForTimeout(300);
    ok(/part of Studyboard Pro/.test(await sheet()), "free: Lecture Moment opens the Pro sheet");
    await reopen();
    // a free part still works: Make Flashcards
    await cmClick(fp, '[data-cm="cards"]'); await fp.waitForTimeout(300);
    ok(!(await sheet()), "free: Make Flashcards is free");
    ok(fp.errs.length === 0, "free: no errors: " + fp.errs.join(" | "));
    await fctx.close();
  }

  /* Phone */
  const pctx = await mkCtx({width: 390, height: 844}), pp = await open(pctx);
  await act(pp, "cm-review", ""); await pp.waitForSelector(".cm-mapcard");
  ok(await pp.evaluate(() => { const t = document.querySelector(".rv-tabs"); return t.scrollWidth <= t.clientWidth + 1; }) && /Maps/.test(await pp.textContent('.rv-tabs [data-id="maps"]')), "the Review tabs fit on a phone (Maps)");
  ok(await fits(pp), "the list fits at 390px");
  await act(pp, "cm-open", "c2", {kind: "course", map: "m1"}); await pp.waitForSelector(".cm-node"); await tap(pp, "idea:a");
  ok(await fits(pp), "a map with a box's style controls fits at 390px");
  ok(await pp.evaluate(() => { const t = document.querySelector(".cm-tools"), mid = x => { const r = x.getBoundingClientRect(); return r.top + r.height / 2; }, b = [...t.children].filter(x => x.offsetParent && !x.classList.contains("spacer")); return b.every(x => Math.abs(mid(x) - mid(b[0])) < 6); }), "the map toolbar stays on one row at 390px");
  await pp.click('.cm-tools [data-cm="menu"][data-v="more"]'); await pp.click('.cm-menu [data-cm="looks"]'); await pp.waitForSelector(".cm-looks"); ok(await fits(pp), "the Map Style picker fits at 390px");
  await pp.keyboard.press("Escape"); await pp.waitForTimeout(200);
  await act(pp, "cm-new", "", {course: "c2"}); await pp.waitForSelector("#cmName");
  ok(await fits(pp), "New Map fits at 390px");
  ok(pp.errs.length === 0, "no console errors (phone): " + pp.errs.join(" | "));
  await pctx.close();

  await browser.close(); server.close();
  console.log(`concept-maps.e2e: ${n} passed`);
})().catch(e => { console.error(e); process.exit(1); });
