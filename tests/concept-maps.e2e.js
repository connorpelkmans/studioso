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
  await page.locator('[data-cm="font"]').count() || await cmClick(page, '[data-cm="style"]'); await page.selectOption('[data-cm="font"]', "hand"); await page.waitForTimeout(200);
  for (let i = 0; i < 3; i++) { await cmClick(page, '[data-cm="tsize"][data-v="1"]'); await page.waitForTimeout(80); }
  const w0 = await page.evaluate(() => document.querySelector('.cm-node[data-n="idea:i1"]').getBBox().width);
  await cmClick(page, '[data-cm="bsize"][data-v="1"]'); await page.waitForTimeout(200);
  st = (await course(page, "c1")).maps[0].styles["idea:i1"];
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
  for (const ln of ["dashed", "dotted", "thick", "solid"]) { await cmClick(page, `[data-cm="eline"][data-v="${ln}"]`); await page.waitForTimeout(150); ok(await page.locator(`.cm-edge.ln-${ln}[data-e="${ekey}"]`).count() === 1, `line: ${ln}`); }
  await cmClick(page, '[data-cm="earrow"][data-v="end"]'); await page.waitForTimeout(200);
  ok(/cmArr/.test(await page.getAttribute(`.cm-edge[data-e="${ekey}"] .cm-line`, "marker-end") || ""), "an arrow one way");
  let L = (await course(page, "c1")).maps[0].links.find(l => [l.a, l.b].sort().join("|") === ekey);
  const from = L.a; await cmClick(page, '[data-cm="eflip"]'); await page.waitForTimeout(200);
  L = (await course(page, "c1")).maps[0].links.find(l => [l.a, l.b].sort().join("|") === ekey);
  ok(L.a !== from && L.label === "is part of" && L.line === "solid" && L.arrow === "end", "Flip turns the arrow around and keeps the words and line");
  await cmClick(page, '[data-cm="earrow"][data-v="both"]'); await page.waitForTimeout(200);
  ok(/cmArrS/.test(await page.getAttribute(`.cm-edge[data-e="${ekey}"] .cm-line`, "marker-start") || ""), "arrows both ways");
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
  await page.check('[name="cmTpl"][value="timeline"]'); await page.fill("#cmName", ""); await page.click("#dlg[open] [data-submit]"); await page.waitForSelector('.cm-node[data-n="root"]');
  c3 = await course(page, "c3"); const tm = c3.maps[1];
  ok(tm && tm.add.length >= 3 && tm.pos && Object.keys(tm.styles || {}).length >= 1 && /Timeline/i.test(tm.name), "a template makes a ready-made map, named after it: " + (tm && tm.name));
  await page.keyboard.press("Escape"); await page.waitForTimeout(250);
  /* Scanning a hand-drawn map (Pro, AI reads the photo) */
  await act(page, "cm-new", "", {course: "c3"}); await page.waitForSelector("#cmName");
  await page.check('[name="cmStart"][value="scan"]');
  ok(await page.isVisible("[data-cm-drop]") && await page.textContent("#dlg[open] [data-submit]") === "Scan My Drawing", "Scan a drawing: a place for the photo and a Scan My Drawing button");
  await page.click("#dlg[open] [data-submit]"); await page.waitForTimeout(150);
  ok(/Choose a photo/.test(await page.textContent("[data-cm-err]")), "without a photo it asks for one");
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
  await page.click(".cm-node:has(.cm-emb)"); await page.waitForSelector(".cm-player iframe");
  ok(await page.evaluate(() => !document.querySelector(".cm-node:has(.cm-emb) .cm-kdot")), "a video's box has no colour dot over its thumbnail");
  const fsrc = await page.getAttribute(".cm-player iframe", "src");
  ok(/^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/.test(fsrc) && /autoplay=1/.test(fsrc) && /allow-scripts/.test(await page.getAttribute(".cm-player iframe", "sandbox")), "one tap plays it on the map, in a sandboxed frame");
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

  /* Free plan */
  const fctx = await mkCtx(null, {free: true}), fp = await open(fctx);
  await act(fp, "cm-new", "", {course: "c2"}); await fp.waitForSelector("#dlg[open] .plan-sheet");
  ok(/Concept Maps are part of Studyboard Pro/.test(await fp.textContent("#dlg[open]")), "free: New Map opens the Pro sheet");
  await fctx.close();

  /* Phone */
  const pctx = await mkCtx({width: 390, height: 844}), pp = await open(pctx);
  await act(pp, "cm-review", ""); await pp.waitForSelector(".cm-mapcard");
  ok(await pp.evaluate(() => { const t = document.querySelector(".rv-tabs"); return t.scrollWidth <= t.clientWidth + 1; }) && /Maps/.test(await pp.textContent('.rv-tabs [data-id="maps"]')), "the Review tabs fit on a phone (Maps)");
  ok(await fits(pp), "the list fits at 390px");
  await act(pp, "cm-open", "c2", {kind: "course", map: "m1"}); await pp.waitForSelector(".cm-node"); await tap(pp, "idea:a");
  ok(await fits(pp), "a map with a box's style controls fits at 390px");
  await pp.keyboard.press("Escape"); await pp.waitForTimeout(200);
  await act(pp, "cm-new", "", {course: "c2"}); await pp.waitForSelector("#cmName");
  ok(await fits(pp), "New Map fits at 390px");
  ok(pp.errs.length === 0, "no console errors (phone): " + pp.errs.join(" | "));
  await pctx.close();

  await browser.close(); server.close();
  console.log(`concept-maps.e2e: ${n} passed`);
})().catch(e => { console.error(e); process.exit(1); });
