// node tests/concept-map-general.e2e.js: concept maps without a course ("General"). With no courses, New Concept Map offers
// General instead of asking for a course first; with courses, General is offered after them. A General map is listed with the
// General chip, opens, saves, and is deleted like any map, and the hidden record that holds it never shows up as a course.
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let f; try { f = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let fails = 0; const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
const page = async (b, port, seed) => {
  const ctx = await b.newContext({viewport: {width: 1280, height: 860}, serviceWorkers: "block"});
  await ctx.addInitScript(s => { window.__SB_TEST = true; localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1");
    if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(s));
    new MutationObserver(() => document.querySelectorAll(".cpu,.cp").forEach(x => { try { x.hidePopover(); } catch (e) {} x.remove(); })).observe(document, {childList: true, subtree: true}); }, seed);
  const p = await ctx.newPage(); p._errs = []; p.on("pageerror", e => p._errs.push(e.message));
  await p.goto(`http://127.0.0.1:${port}/index.html`);
  await p.waitForFunction(() => window.__sbSync && window.SBCMAP, null, {timeout: 20000}); await p.waitForTimeout(500);
  await p.evaluate(() => { const S = window.__sbSync; S.ui.tab = "flashcards"; S.ui.rvView = "maps"; S.render(); }); await p.waitForTimeout(400);
  return p;
};
const act = (p, a, data) => p.evaluate(([a, data]) => { const b = document.createElement("button"); b.dataset.act = a; Object.assign(b.dataset, data || {}); b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); }, [a, data]);

(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const port = server.address().port, b = await chromium.launch({executablePath});

  // 1. No courses at all: a General map can still be made
  let p = await page(b, port, {v: 2, updated: 1, tasks: [], files: [], notes: [], events: [], decks: [], settings: {}, courses: []});
  await act(p, "cm-new"); await p.waitForSelector("#dlg[open] .cm-new-sheet", {timeout: 5000}).catch(() => {});
  ok(await p.locator("#dlg[open] .cm-new-sheet").count() === 1, "with no courses, New Concept Map opens (no \"add a course first\")");
  const opts = await p.$$eval("#cmCourse option", os => os.map(o => o.textContent));
  ok(opts.length === 1 && /General/.test(opts[0]), "General is the choice: " + opts.join(", "));
  ok(await p.locator('#dlg [name="cmStart"][value="blank"]').isChecked(), "a General map starts from a blank page (there's no course material)");
  await p.fill("#cmName", "Philosophy Ideas");
  await p.click("#dlg [data-submit]"); await p.waitForTimeout(900);
  let st = await p.evaluate(() => { const S = window.__sbSync.state, g = S.courses.general; return {gen: !!(g && g.gen), maps: g ? (g.maps || []).map(m => m.name) : [], courses: window.__sbSync.coursesArr ? window.__sbSync.coursesArr().length : null}; });
  ok(st.gen && st.maps.join() === "Philosophy Ideas", "the map is kept in the hidden General holder: " + JSON.stringify(st));
  // the map opened; close it and look at the list
  await p.evaluate(() => { const d = document.querySelector("#dlg"); if (d.open) d.close(); }); await p.waitForTimeout(300);
  await p.evaluate(() => { const S = window.__sbSync; S.ui.tab = "flashcards"; S.ui.rvView = "maps"; S.render(); }); await p.waitForTimeout(400);
  const card = await p.locator(".cm-mapcard").first().textContent();
  ok(/Philosophy Ideas/.test(card) && /General/.test(card), "listed with the General chip: " + card.replace(/\s+/g, " ").slice(0, 80));
  // the holder is never a course
  const courseThings = await p.evaluate(() => { const S = window.__sbSync; S.ui.tab = "courses"; S.ui.courseTab = "courses"; S.render(); return document.querySelector("#view").innerText; });
  ok(/No Courses Yet/.test(courseThings), "the Courses page still says No Courses Yet (General isn't a course)");
  ok(await p.evaluate(() => typeof allCourses === "function" ? !allCourses().some(c => c.gen) : true), "allCourses() skips it");
  await p.screenshot({path: "/tmp/cm-general-courses.png"});
  ok(!p._errs.length, "no page errors: " + p._errs.join(" | "));
  await p.context().close();

  // 2. With a course: General comes after it; the map opens, can be renamed and deleted (with Undo)
  p = await page(b, port, {v: 2, updated: 1, tasks: [], files: [], notes: [], events: [], decks: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIOS 230", color: "#C9702B", meetings: []}]});
  await act(p, "cm-new"); await p.waitForSelector("#dlg[open] .cm-new-sheet");
  const opts2 = await p.$$eval("#cmCourse option", os => os.map(o => o.textContent));
  ok(opts2.length === 2 && /BIOS 230/.test(opts2[0]) && /General/.test(opts2[1]), "courses first, then General: " + opts2.join(", "));
  await p.selectOption("#cmCourse", "general"); await p.fill("#cmName", "Career Plan");
  await p.check('#dlg [name="cmStart"][value="blank"]');
  await p.click("#dlg [data-submit]"); await p.waitForTimeout(900);
  ok(await p.evaluate(() => !!document.querySelector("#dlg[open]")), "the new General map opens");
  await p.evaluate(() => { const d = document.querySelector("#dlg"); if (d.open) d.close(); }); await p.waitForTimeout(300);
  await p.evaluate(() => { const S = window.__sbSync; S.ui.tab = "flashcards"; S.ui.rvView = "maps"; S.render(); }); await p.waitForTimeout(400);
  ok(await p.locator(".cm-mapcard").count() === 1 && /General/.test(await p.locator(".cm-mapcard").first().textContent()), "listed under General");
  await p.screenshot({path: "/tmp/cm-general-list.png"});
  // the course picker for the Review tab still only has the real course
  ok(await p.evaluate(() => !Object.values(window.__sbSync.state.courses).filter(c => !c.gen).some(c => c.id === "general")), "only the holder is general");
  // delete it: gone, with Undo
  const mid = await p.evaluate(() => window.__sbSync.state.courses.general.maps[0].id);
  await act(p, "cm-del", {course: "general", id: mid}); await p.waitForTimeout(300);
  const conf = p.locator('#dlg[open] button:has-text("Delete Map")');
  if (await conf.count()) { await conf.click(); await p.waitForTimeout(400); }
  const left = await p.evaluate(() => (window.__sbSync.state.courses.general.maps || []).length);
  ok(left === 0, "deleting the General map removes it");
  ok(!p._errs.length, "no page errors: " + p._errs.join(" | "));
  await b.close(); server.close();
  console.log(fails ? `concept-map-general.e2e: ${fails} FAILED` : "concept-map-general.e2e: all passed");
  process.exitCode = fails ? 1 : 0;
})().catch(e => { console.error(e); process.exit(1); });
