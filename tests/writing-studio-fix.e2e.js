// node tests/writing-studio-fix.e2e.js
// Writing Studio auto-fix in the app: Fix on one issue, Fix All (one Undo for all of it), Copy Fixed Draft, a draft from a note fixed in the note,
// and Add to My Draft from the Sources tab, all with citeproc's real APA entries.
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
      {id: "t1", title: "Research paper: urban heat", courseId: "c2", type: "Assignment", due: day(9), start: day(0), status: "todo", priority: "high", notes: "Use APA format.", created: 5,
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
  // a course, with its first concept map as .cmap (a course can hold several maps now: c.maps)
  const course = (page, id) => page.evaluate(id => { const c = Object.assign({}, window.__sbProStudy.state().courses[id]); c.cmap = (Array.isArray(c.maps) && c.maps[0]) || c.cmap; return c; }, id);
  const fits = page => page.evaluate(() => { const d = document.querySelector("dialog[open]"), w = document.documentElement; return w.scrollWidth <= w.clientWidth + 1 && (!d || [...d.querySelectorAll(".sheet-body, .sheet-foot, .ws-ref, .ws-q, .ws-acts, .ws-row, .cm-panel")].every(x => x.scrollWidth <= x.clientWidth + 1)); });
  // a node is tapped with the keyboard (Enter), which also brings it into view
  const tap = async (page, id) => { await page.focus(`.cm-node[data-n="${id}"]`); await page.keyboard.press("Enter"); await page.waitForTimeout(380); };
  const refs = page => page.$$eval("#dlg[open] .ws-ref .ws-cite", x => x.map(e => e.textContent.trim()));

  const ctx = await mkCtx({key: true}), page = await open(ctx);
  const draftOf = async () => ((await task(page, "t1")).ws.draft || {}).t || "";
  const openWS = async () => { await act(page, "edit-task", "t1"); await page.waitForSelector('#dlg[open] [data-act="ws-open"]'); await page.click('#dlg[open] [data-act="ws-open"]'); await page.waitForSelector("#dlg[open] .ws-tabs"); };
  await openWS(); await page.click('#dlg[open] [data-ws-tab="check"]');
  const D0 = "Cities are warming fast (Smith & Lee 2021). Ng (2019) says cities must plan for heat. Parks are cooler than the blocks around them (Smith & Lee, 2018).\n\nBibliography\nNg, M. (2019). Cities and climate change. Routledge.";
  await page.fill("[data-ws-draft]", D0); await page.click("[data-ws-check]"); await page.waitForSelector("#dlg[open] .ws-issues");
  await page.waitForFunction(() => document.querySelectorAll("#dlg[open] [data-ws-fix]").length >= 3, null, {timeout: 15000});
  const fixes = await page.$$eval("#dlg[open] .ws-is", li => li.filter(x => x.querySelector("[data-ws-fix]")).map(x => x.querySelector("b").textContent));
  ok(fixes.some(t => /write \(Smith & Lee, 2021\)/.test(t)) && fixes.some(t => /year doesn't match/.test(t)) && fixes.some(t => /called References/.test(t)) && fixes.some(t => /Cited but not in your References list/.test(t)), "Fix is offered on the issues with one right answer: " + fixes.join(" | "));
  ok(await page.$$eval("#dlg[open] .ws-is", li => li.filter(x => /Never cited|Not in your sources/.test(x.textContent)).every(x => !x.querySelector("[data-ws-fix]"))), "and not on ones that need the student");
  ok(await page.locator("#dlg[open] [data-ws-fixall]").count() === 1, "Fix All is offered");
  // one fix
  await page.click('#dlg[open] .ws-is:has-text("write (Smith & Lee, 2021)") [data-ws-fix]'); await page.waitForTimeout(600);
  const d1 = await draftOf();
  ok(d1 === D0.replace("(Smith & Lee 2021)", "(Smith & Lee, 2021)"), "Fix changes only that citation: " + JSON.stringify(d1.slice(0, 60)));
  ok(/Fixed 1 thing in Writing Studio's copy/.test(await page.textContent("#dlg[open] .ws-ok")) && await page.locator("#dlg[open] [data-ws-dcopy]").count() === 1, "it says where the fix went, and offers Copy Fixed Draft");
  ok(!(await page.locator('#dlg[open] .ws-is:has-text("write (Smith & Lee, 2021)")').count()), "and the check runs again: that issue is gone");
  // Fix All, then one Undo
  await page.click("#dlg[open] [data-ws-fixall]"); await page.waitForTimeout(900);
  const d2 = await draftOf();
  ok(/\(Smith & Lee, 2021\)\. Ng \(2019\)/.test(d2) && /cooler than the blocks around them \(Smith & Lee, 2021\)\./.test(d2) && /\n\nReferences\n/.test(d2) && !/Bibliography/.test(d2), "Fix All: the year, and the heading: " + JSON.stringify(d2));
  const list = d2.split("References\n")[1].split("\n");
  ok(list.length === 2 && /^Ng, M\. \(2019\)/.test(list[0]) && /^Smith, J\. A\., & Lee, K\. \(2021\)/.test(list[1]), "and Smith & Lee's entry, in order after Ng: " + JSON.stringify(list));
  const errs = await page.$$eval("#dlg[open] .ws-is.k-err b", x => x.map(e => e.textContent));
  ok(!errs.length, "nothing left to fix: " + errs.join(" | "));
  ok(!(await page.locator("#dlg[open] [data-ws-fixall]").count()), "and Fix All is gone");
  await page.click("#toastUndo"); await page.waitForTimeout(500);
  ok(await draftOf() === d1, "one Undo takes all of Fix All back");
  // Add to My Draft (Sources tab): a third source, into the list in order
  await page.evaluate(() => { const s = window.__sbProStudy.state(), t = JSON.parse(JSON.stringify(s.tasks.t1)); t.ws.src.push({id: "s3", type: "report", title: "Heat action plans", author: [{literal: "City of Phoenix"}], publisher: "City of Phoenix", issued: {"date-parts": [[2022]]}}); window.__sbProStudy.applyChanges ? window.__sbProStudy.applyChanges([{kind: "task", id: "t1", after: t}], null) : null; });
  if (!(await task(page, "t1")).ws.src.some(x => x.id === "s3")) { await page.evaluate(() => { const s = window.__sbProStudy.state(); s.tasks.t1.ws.src.push({id: "s3", type: "report", title: "Heat action plans", author: [{literal: "City of Phoenix"}], publisher: "City of Phoenix", issued: {"date-parts": [[2022]]}}); }); }
  await page.keyboard.press("Escape"); await page.waitForTimeout(200); await openWS(); await page.click('#dlg[open] [data-ws-tab="sources"]'); await page.waitForSelector("#dlg[open] [data-ws-refadd]");
  ok(await page.textContent("#dlg[open] [data-ws-refadd]") === "Add All to My Draft", "the footer says Add All to My Draft");
  // one source at a time: each source not in the draft's list has its own Add to My Draft
  await page.waitForSelector("#dlg[open] [data-ws-refadd1]", {timeout: 10000});
  ok(await page.locator("#dlg[open] [data-ws-refadd1]").count() === 2 && /In your list ✓/.test(await page.textContent("#dlg[open] .ws-refs")), "each source not in the list has its own Add to My Draft (Ng, already there, doesn't)");
  await page.click('#dlg[open] [data-ws-refadd1="s3"]'); await page.waitForTimeout(900);
  const l2 = (await draftOf()).split(/\n(?:References|Bibliography)\n/)[1].split("\n");
  ok(l2.length === 2 && /^City of Phoenix\. \(2022\)/.test(l2[0]) && /^Ng, M\./.test(l2[1]), "one source added on its own, in order: " + JSON.stringify(l2));
  ok(await page.locator("#dlg[open] [data-ws-refadd1]").count() === 1, "and its button is gone");
  await page.click("#dlg[open] [data-ws-refadd]"); await page.waitForTimeout(900);
  const d3 = await draftOf(), l3 = d3.split(/\n(?:References|Bibliography)\n/)[1].split("\n");
  ok(l3.length === 3 && /^City of Phoenix\. \(2022\)/.test(l3[0]) && /^Ng, M\./.test(l3[1]) && /^Smith, J\. A\./.test(l3[2]), "Add to My Draft: Phoenix and Smith & Lee in alphabetical order, Ng not doubled: " + JSON.stringify(l3));
  ok(/Added 1 source to your draft's list, in order \(2 were already there\)/.test(await page.textContent("#dlg[open]")), "Add All adds the rest, and says what it did");
  await page.click("#dlg[open] [data-ws-refadd]"); await page.waitForTimeout(700);
  ok(await draftOf() === d3 && /already in your draft's list/.test(await page.textContent("#dlg[open]")), "adding again changes nothing");
  // a source just added to a paper with a draft: one tap puts it in the draft's list too (never on its own)
  await page.fill("#dlg[open] [data-ws-in]", "10.1037/0003-066x.59.1.29"); await page.click("#dlg[open] [data-ws-add]");
  await page.waitForSelector("#dlg[open] [data-ws-doffer]", {timeout: 15000});
  ok(/Also add it to your draft's References list\?/.test(await page.textContent("#dlg[open] .ws-offer")) && !/Ray/.test(await draftOf()), "adding a source offers to put it in the draft's list (and doesn't, until asked)");
  await page.click("#dlg[open] [data-ws-doffer]"); await page.waitForTimeout(900);
  const l4 = ((await draftOf()).split(/\n(?:References|Bibliography)\n/)[1] || "").split("\n");
  ok(l4.length === 4 && /^Ray, O\./.test(l4[2]) && !(await page.locator("#dlg[open] [data-ws-doffer]").count()), "Add It: into the list, in order, and the offer goes: " + JSON.stringify(l4.map(x => x.slice(0, 20))));
  await page.click("#toastUndo"); await page.waitForTimeout(500);
  ok(!/Ray, O\./.test(await draftOf()), "Undo takes it back out of the draft");
  // a draft from a note: the note itself is fixed (so checking again, which reads the note, keeps the fix)
  const N = "Heat essay\nCities are warming fast (Smith & Lee 2021) and parks help.\n\nReferences\nSmith, J. A., & Lee, K. (2021). The urban heat island effect and green infrastructure. Urban Climate, 38(2), 100–118.";
  await page.evaluate(n => { const s = window.__sbProStudy.state(); s.notes.n9 = {id: "n9", text: n, courseId: "c2", x: 0, y: 0, z: 9, created: 9}; const t = s.tasks.t1; t.ws.draft = {t: n, from: "Heat essay", nid: "n9", at: Date.now(), h: "x"}; t.ws.chk = null; }, N);
  await page.keyboard.press("Escape"); await page.waitForTimeout(200); await openWS(); await page.click('#dlg[open] [data-ws-tab="check"]'); await page.click("[data-ws-check]");
  await page.waitForSelector('#dlg[open] .ws-is:has-text("write (Smith & Lee, 2021)") [data-ws-fix]', {timeout: 15000});
  await page.click('#dlg[open] .ws-is:has-text("write (Smith & Lee, 2021)") [data-ws-fix]'); await page.waitForTimeout(700);
  const note = await page.evaluate(() => window.__sbProStudy.state().notes.n9.text);
  ok(note === N.replace("(Smith & Lee 2021)", "(Smith & Lee, 2021)") && /Fixed 1 thing in your note, Heat essay/.test(await page.textContent("#dlg[open]")), "a note's draft: the note itself is fixed: " + JSON.stringify(note.split("\n")[1]));
  await page.click("[data-ws-check]"); await page.waitForTimeout(700);
  ok(!(await page.locator('#dlg[open] .ws-is:has-text("write (Smith & Lee, 2021)")').count()) && (await draftOf()).includes("(Smith & Lee, 2021)"), "and Check Again (which reads the note) keeps the fix");
  // a citation whose entry is in the draft's list but isn't a source yet: the list's entries become sources by themselves (one Undo)
  const nSrc = (await task(page, "t1")).ws.src.length;
  await page.click('#dlg[open] [data-ws-redo]'); await page.fill("[data-ws-draft]", "Toxoplasma changes behaviour differently in men and women, and this matters for how we read the evidence (Lindová et al., 2006). As described by Flegr (2013), it can't be tested in a lab. Cities are warming fast (Smith & Lee, 2021).\n\nReferences\nFlegr, J. (2013, January 1). Influence of latent Toxoplasma infection on human personality. Journal of Experimental Biology.\nLindová, J., Novotná, M., Havlíček, J., Jozífková, E., ... Flegr, J. (2006, August 31). Gender differences in behavioural changes induced by latent toxoplasmosis. International Journal for Parasitology.\nSmith, J. A., & Lee, K. (2021). The urban heat island effect and green infrastructure. Urban Climate, 38(2), 100–118.");
  await page.click("[data-ws-check]");
  await page.waitForFunction(n => window.__sbProStudy.state().tasks.t1.ws.src.length >= n + 2, nSrc, {timeout: 15000});
  const added = (await task(page, "t1")).ws.src;
  ok(added.some(x => /Gender differences/.test(x.title || "") && (x.author || [])[0].family === "Lindová") && added.some(x => /Influence of latent Toxoplasma/.test(x.title || "")), "the draft's list adds its new entries to Sources by itself");
  await page.waitForTimeout(800);
  ok(/Added 2 sources from your draft's list to Sources/.test(await page.textContent("#dlg[open]")), "and says so");
  ok(!(await page.locator('#dlg[open] .ws-is:has-text("Lindová")').count()) && !(await page.locator('#dlg[open] .ws-is:has-text("(2013)")').count()), "and the check no longer flags them (Flegr (2013) found by its name too)");
  await page.click("#toastUndo"); await page.waitForTimeout(500);
  ok((await task(page, "t1")).ws.src.length === nSrc, "one Undo takes them all off Sources");
  /* My Doc: click where a citation goes (the form for the place), select a passage to keep it as a quote */
  await page.click('#dlg[open] [data-ws-tab="doc"]'); await page.click("#dlg[open] [data-ws-redo]");
  await page.fill("[data-ws-draft]", "Parks cool cities in summer and the effect is large. The study by measured it across many blocks of the city in July.\n\nReferences\nNg, M. (2019). Cities and climate change. Routledge.\nSmith, J. A., & Lee, K. (2021). The urban heat island effect and green infrastructure. Urban Climate, 38(2), 100–118.");
  await page.click("[data-ws-check]"); await page.waitForSelector("#dlg[open] .ws-res"); await page.click('#dlg[open] [data-ws-tab="doc"]'); await page.waitForSelector("#dlg[open] [data-ws-rd]");
  // a place in the paper: a real click (just before "." after "large"), or a selection set exactly, then the mouse let go
  const xyOf = (frag, k) => page.evaluate(([f, k]) => { const p = [...document.querySelectorAll("#dlg[open] [data-ws-rd] p")].find(x => x.textContent.includes(f)), n = p.firstChild, i = p.textContent.indexOf(f) + k, r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1); const b = r.getBoundingClientRect(); return [b.left + 0.5, b.top + b.height / 2]; }, [frag, k]);
  const selectIn = (frag, from, to) => page.evaluate(([f, a, b]) => { const p = [...document.querySelectorAll("#dlg[open] [data-ws-rd] p")].find(x => x.textContent.includes(f)), n = p.firstChild, i = p.textContent.indexOf(f), r = document.createRange(); r.setStart(n, i + a); r.setEnd(n, i + b); const s = getSelection(); s.removeAllRanges(); s.addRange(r); p.dispatchEvent(new MouseEvent("mouseup", {bubbles: true})); }, [frag, from, to]);
  const [cx, cy] = await xyOf("large.", 5); await page.mouse.click(cx, cy);
  await page.waitForSelector("#dlg[open] .ws-pop [data-ws-popm=cite]"); ok(!(await page.locator("#dlg[open] .ws-pop [data-ws-popm=quote]").count()), "a click opens Cite Here (no selection: no Add Quote)");
  ok(await page.locator("#dlg[open] .ws-marks .ws-caret").count() === 1 && Math.abs((await page.locator("#dlg[open] .ws-caret").boundingBox()).x - cx) < 4, "a caret marks the place clicked");
  await page.click("#dlg[open] .ws-pop [data-ws-popm=cite]"); await page.waitForSelector("#dlg[open] .ws-pop-s");
  if (process.env.SHOT) await page.screenshot({path: process.env.SHOT + "mydoc-cite.png"});
  const opts = await page.$$eval("#dlg[open] .ws-pop-s b", x => x.map(e => e.textContent));
  ok(opts.includes("(Smith & Lee, 2021)") && opts.includes("(Ng, 2019)") && /end of a sentence/.test(await page.textContent("#dlg[open] .ws-pop-how")), "at the end of a sentence: each source's citation in brackets: " + opts.join(" | "));
  ok(/the effect is large\(Smith & Lee, 2021\)\. The study/.test((await page.textContent("#dlg[open] .ws-pop-ctx")).replace("large (", "large(")) && (await page.textContent("#dlg[open] .ws-pop-ctx ins")).trim() === "(Smith & Lee, 2021)", "the menu shows the line with the citation in its place: " + await page.textContent("#dlg[open] .ws-pop-ctx"));
  await page.hover('#dlg[open] .ws-pop-s:has-text("Ng, 2019")'); ok((await page.textContent("#dlg[open] .ws-pop-ctx ins")).trim() === "(Ng, 2019)", "pointing at another source shows it there instead");
  await page.click('#dlg[open] .ws-pop-s:has-text("Smith & Lee")'); await page.waitForTimeout(800);
  ok((await draftOf()).startsWith("Parks cool cities in summer and the effect is large (Smith & Lee, 2021). The study"), "it goes in before the full stop: " + JSON.stringify((await draftOf()).slice(0, 90)));
  ok(/Added \(Smith & Lee, 2021\) at the end of the sentence/.test(await page.textContent("#dlg[open] .ws-ok")), "and it says where");
  await selectIn("The study by measured", 13, 13);
  await page.click("#dlg[open] .ws-pop [data-ws-popm=cite]"); await page.waitForSelector("#dlg[open] .ws-pop-s");
  ok((await page.$$eval("#dlg[open] .ws-pop-s b", x => x.map(e => e.textContent))).includes("Ng (2019)") && /middle of a sentence/.test(await page.textContent("#dlg[open] .ws-pop-how")), "in the middle of a sentence: the authors in it");
  await page.click('#dlg[open] .ws-pop-s:has-text("Ng (2019)")'); await page.waitForTimeout(800);
  ok((await draftOf()).includes("The study by Ng (2019) measured it across"), "it goes in before the word: " + JSON.stringify((await draftOf()).slice(60, 130)));
  // a selection: Add Quote (then Cite After It is one tap)
  await selectIn("measured it across many blocks of the city in July", 0, 50);
  await page.waitForSelector("#dlg[open] .ws-pop [data-ws-popm=quote]"); ok(await page.locator("#dlg[open] .ws-marks .ws-selm").count() >= 1, "a selection stays marked"); ok(/Cite After It/.test(await page.textContent("#dlg[open] .ws-pop")), "a selection: Cite After It and Add Quote");
  await page.click("#dlg[open] .ws-pop [data-ws-popm=quote]"); await page.click('#dlg[open] .ws-pop-s:has-text("Ng")'); await page.waitForTimeout(500);
  const qq = (await task(page, "t1")).ws.q, nq = qq[qq.length - 1];
  ok(nq.t === "measured it across many blocks of the city in July" && nq.sid === "s2", "Add Quote keeps the passage as a quote from that source");
  ok(/Cite it here too/.test(await page.textContent("#dlg[open] .ws-pop")) && /\(Ng, 2019\)/.test(await page.textContent("#dlg[open] .ws-pop")), "and offers its citation right there");
  await page.click("#dlg[open] .ws-pop [data-ws-popc]"); await page.waitForTimeout(800);
  ok((await draftOf()).includes("many blocks of the city in July (Ng, 2019).\n"), "one tap: cited after it, before the full stop");
  await page.click("#toastUndo"); await page.waitForTimeout(500);
  ok((await draftOf()).includes("in July.\n") && !(await draftOf()).includes("in July (Ng"), "Undo takes the citation back out");
  ok(!page.errs.length, "no page errors: " + page.errs.join(" | "));
  await browser.close(); server.close();
  console.log(`writing-studio-fix.e2e: ${n} passed`);
})().catch(e => { console.error(e); process.exit(1); });
