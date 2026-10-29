// node tests/version-history.e2e.js
/* global applyChanges, clone, saveNoteText -- copied onto window from __sbProStudy in open() below */
// Version History (Pro): note and deck versions over simulated time, preview, restore, Undo, online backups, reload; free path unchanged
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
const pad = x => String(x).padStart(2, "0");
const day = off => { const d = new Date(); d.setDate(d.getDate() + off); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const OUTLINE = "ENG 102 essay outline\nThesis: Urban green space is the cheapest way to cool a city.\nPoint 1: Phoenix parks are 4°C cooler (Smith 2021).\nPoint 2: Street trees shade sidewalks and cut cooling bills.\nCounterargument: parks use water. Answer: drought-tolerant plants.";
function SEED(){
  const card = (id, f, b, box, due) => ({id, front: f, back: b, box, due, seen: box ? 4 : 0, right: box ? 3 : 0, wrong: box ? 1 : 0, last: box ? day(-3) : ""});
  return {v: 2, updated: 1, settings: {},
    courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}, {id: "c2", name: "Writing", code: "ENG102", color: "#E0563B"}],
    notes: [{id: "n1", text: OUTLINE, color: "yellow", x: 40, y: 40, z: 1, courseId: "c2", created: 1}],
    decks: [{id: "d1", name: "Cell Biology", courseId: "c1", created: 1, quizzes: [], cards: [
      card("k1", "Mitochondria", "Make most of the cell's ATP through cellular respiration", 3, day(4)),
      card("k2", "Ribosome", "Builds proteins from amino acids", 2, day(1)),
      card("k3", "Osmosis", "Water moving across a membrane toward more solute", 2, day(2)),
      card("k4", "Nucleus", "Holds the cell's DNA", 1, day(0)),
      card("k5", "Golgi apparatus", "Packages and ships proteins", 0, ""),
      card("k6", "Lysosome", "Breaks down waste with enzymes", 0, "")]}],
    tasks: [], files: [], events: []};
}
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const mkCtx = async (free, viewport) => {
    const ctx = await browser.newContext({viewport: viewport || {width: 1280, height: 900}, serviceWorkers: "block"});
    await ctx.addInitScript(([seed, free]) => {
      try {
        if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); }
        if (free) localStorage.setItem("studyboard:paywall-test", "1");
        // a clock the test moves forward: Version History reads it for every snapshot
        const t0 = Number(localStorage.getItem("vh:t") || 0) || Date.now() - 3 * 864e5;
        localStorage.setItem("vh:t", String(t0)); window.__vhT = t0; window.__SB_VH_NOW = () => window.__vhT;
      } catch (e) {}
    }, [SEED(), !!free]);
    return ctx;
  };
  const open = async ctx => {
    const page = await ctx.newPage(); page.errs = [];
    page.on("pageerror", e => page.errs.push(e.message));
    page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) page.errs.push(m.text()); });
    await page.goto(base); await page.waitForSelector("#view", {state: "attached"}); await page.waitForFunction(() => window.__sbProStudy && window.SBVH);
    await page.evaluate(() => { const T = window.__sbProStudy; Object.defineProperty(window, "state", {get: () => T.state(), configurable: true}); Object.defineProperty(window, "dlg", {get: () => T.dlg(), configurable: true}); ["ui", "render", "applyChanges", "clone", "saveNoteText"].forEach(k => { window[k] = T[k]; }); });
    await page.waitForTimeout(700); return page;
  };
  const act = (page, a, id) => page.evaluate(([a, id]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id || ""]);
  const tab = async (page, t, extra) => { await page.evaluate(([t, extra]) => { Object.assign(ui, {tab: t}, extra || {}); render(); }, [t, extra || null]); await page.waitForTimeout(250); };
  const tick = (page, mins) => page.evaluate(m => { window.__vhT += m * 60000; }, mins);
  const settle = page => page.evaluate(() => window.SBVH.settle());
  const list = (page, kind, id) => page.evaluate(([k, i]) => window.SBVH.list(k, i), [kind, id]);
  const noteText = page => page.evaluate(() => state.notes.n1.text);
  const setNote = (page, text) => page.evaluate(t => applyChanges([{kind: "note", id: "n1", after: Object.assign(clone(state.notes.n1), {text: t, updated: Date.now()})}], ""), text);
  const fits = page => page.evaluate(() => { const d = document.querySelector("dialog[open]"), w = document.documentElement; return w.scrollWidth <= w.clientWidth + 1 && (!d || [...d.querySelectorAll(".sheet-body, .sheet-foot, .vh-list li, .vh-cards li")].every(x => x.scrollWidth <= x.clientWidth + 1)); });

  /* Pro: a note edited over simulated time */
  const ctx = await mkCtx(false), page = await open(ctx);
  await tab(page, "notes");
  await page.click('.note[data-note="n1"] .note-body'); await page.waitForSelector(".note.editing #noteText");
  await page.fill("#noteText", OUTLINE + "\nConclusion: cities should plant first, then build.");
  await page.evaluate(() => saveNoteText()); await settle(page);
  let vs = await list(page, "note", "n1");
  ok(vs.length === 1 && vs[0].text === OUTLINE && vs[0].label === "Before editing", "the first edit keeps the version from before it");
  await tick(page, 3); await setNote(page, OUTLINE + "\nConclusion: plant first."); await settle(page);
  ok((await list(page, "note", "n1")).length === 1, "an edit 3 minutes later doesn't add a version (one per 10 minutes)");
  await tick(page, 12); const beforeCut = await noteText(page);
  await setNote(page, beforeCut + "\nSources: Smith 2021; Lee 2023."); await settle(page);
  ok((await list(page, "note", "n1")).length === 2, "12 minutes later the next edit adds a version");
  await tick(page, 1); const full = await noteText(page);
  await setNote(page, "ENG 102 essay outline"); await settle(page);
  vs = await list(page, "note", "n1");
  ok(vs.length === 3 && vs[2].text === full && vs[2].label === "Before a big change", "cutting most of the note a minute later still keeps a version (risky change)");

  /* Earlier Versions: device, Pro and online-backup versions together */
  await page.evaluate(([t]) => { window.__SB_VH_BACKUPS = async () => [{at: window.__vhT - 2 * 864e5, where: "cloud", notes: [{id: "n1", text: t + "\n(Backup copy from another laptop)"}], decks: []}]; }, [OUTLINE]);
  await act(page, "note-versions", "n1");
  await page.waitForSelector("dialog[open] .vh-sheet .vh-list li");
  await page.waitForFunction(() => /From Online Backup/.test(document.querySelector("dialog[open] .vh-sheet").textContent));
  const rows = await page.$$eval("dialog[open] .vh-list li .nv-top span:first-child", x => x.map(e => e.textContent));
  ok(rows.length >= 4 && rows.some(r => /Before a big change/.test(r)) && rows.some(r => /^From Online Backup, /.test(r)), "the sheet lists this device's versions and the online backup's: " + rows.join(" | "));
  ok(new Set(await page.$$eval("dialog[open] .vh-list .nv-pre", x => x.map(e => e.textContent))).size === rows.length, "no version is listed twice");
  const iCut = rows.findIndex(r => /Before a big change/.test(r));
  await page.click(`dialog[open] [data-vh-prev="${iCut}"]`);
  await page.waitForSelector("dialog[open] .vh-diff");
  ok(await page.locator("dialog[open] .vh-diff .vh-add").count() >= 4 && /Thesis: Urban green space/.test(await page.textContent("dialog[open] .vh-diff .vh-add")), "Preview shows the lines that come back");
  await page.click('dialog[open] .sheet-foot [data-vh-res]');
  await page.waitForTimeout(300);
  ok(await noteText(page) === full, "Restore This Version brings the note back");
  ok(await page.isVisible("#toastUndo"), "with Undo in the toast");
  await page.click("#toastUndo"); await page.waitForTimeout(300);
  ok(await noteText(page) === "ENG 102 essay outline", "Undo puts back what was there");
  await settle(page);
  ok((await list(page, "note", "n1")).some(v => v.label === "Before restoring" && v.text === "ENG 102 essay outline"), "what you had before restoring is kept as a version");
  await act(page, "note-versions", "n1"); await page.waitForSelector("dialog[open] .vh-sheet .vh-list li");
  await page.waitForFunction(() => /From Online Backup/.test(document.querySelector("dialog[open] .vh-sheet").textContent));
  const iBk = (await page.$$eval("dialog[open] .vh-list li .nv-top span:first-child", x => x.map(e => e.textContent))).findIndex(r => /^From Online Backup/.test(r));
  await page.click(`dialog[open] [data-vh-res="${iBk}"]`); await page.waitForTimeout(300);
  ok(/Backup copy from another laptop/.test(await noteText(page)), "a version from an online backup restores too");

  /* Pro: a deck, its cards edited, deleted and reviewed */
  await page.evaluate(() => { delete window.__SB_VH_BACKUPS; });
  await tab(page, "flashcards", {deckId: "d1"});
  await act(page, "fc-edit", "d1"); await page.waitForSelector("dialog[open] #dkDel");
  ok(await page.locator('dialog[open] [data-act="vh-deck"]').count() === 0, "no Earlier Versions in Edit Deck before the deck has any");
  await page.evaluate(() => dlg.close());
  await tick(page, 20);
  await act(page, "fc-card", "k1"); await page.waitForSelector('dialog[open] textarea[name="front"]');
  await page.fill('dialog[open] textarea[name="front"]', "Cellular respiration"); await page.fill('dialog[open] textarea[name="back"]', "Glucose and oxygen become CO2, water and ATP");
  await page.click("dialog[open] [data-submit]"); await settle(page);
  ok((await list(page, "deck", "d1")).length === 1, "editing a card keeps the deck's version from before");
  await tick(page, 2);
  // a review: only the schedule changes
  await page.evaluate(() => { const d = clone(state.decks.d1); const c = d.cards.find(x => x.id === "k1"); Object.assign(c, {box: 1, seen: c.seen + 1, wrong: c.wrong + 1, last: new Date().toISOString().slice(0, 10)}); applyChanges([{kind: "deck", id: "d1", after: d}], null); });
  await tick(page, 1);
  await page.evaluate(() => { const d = clone(state.decks.d1); d.cards = d.cards.filter(c => !["k3", "k4", "k5"].includes(c.id)); applyChanges([{kind: "deck", id: "d1", after: d}], "3 cards deleted"); });
  await settle(page);
  vs = await list(page, "deck", "d1");
  ok(vs.length === 2 && vs[1].label === "Before 3 cards were deleted" && vs[1].cards.length === 6, "deleting 3 cards a minute later keeps a version anyway; the review made none: " + vs.map(v => v.label).join(" | "));
  await act(page, "fc-edit", "d1"); await page.waitForSelector('dialog[open] [data-act="vh-deck"]');
  ok(true, "Edit Deck now has Earlier Versions");
  await page.click('dialog[open] [data-act="vh-deck"]');
  await page.waitForSelector("dialog[open] .vh-sheet .vh-list li");
  ok(await page.locator("dialog[open] .vh-list li").count() === 2 && /6 cards: /.test(await page.textContent("dialog[open] .vh-list li .nv-pre")), "two deck versions, newest first, with their cards");
  await page.click('dialog[open] [data-vh-prev="0"]'); await page.waitForSelector("dialog[open] .vh-cards");
  ok(await page.locator("dialog[open] .vh-cards li.vh-back").count() === 3, "Preview shows the 3 deleted cards coming back");
  ok(await page.locator("dialog[open] .vh-cards li.vh-chg").count() === 0, "and the reviewed card isn't counted as changed");
  await page.click('dialog[open] .sheet-foot [data-vh-res]'); await page.waitForTimeout(300);
  let d1 = await page.evaluate(() => state.decks.d1);
  ok(d1.cards.map(c => c.id).join() === "k1,k2,k3,k4,k5,k6", "restoring brings the deleted cards back in their places");
  ok(d1.cards[0].front === "Cellular respiration" && d1.cards[0].box === 1, "a card that is the same in both keeps today's wording and schedule");
  await page.click("#toastUndo"); await page.waitForTimeout(300);
  ok((await page.evaluate(() => state.decks.d1.cards.length)) === 3, "Undo removes them again");
  // the oldest version: k1 was worded differently then (a meaningful change), so it also gets that version's schedule
  await act(page, "fc-edit", "d1"); await page.waitForSelector('dialog[open] [data-act="vh-deck"]'); await page.click('dialog[open] [data-act="vh-deck"]');
  await page.waitForSelector("dialog[open] .vh-sheet .vh-list li");
  const nOld = await page.locator("dialog[open] .vh-list li").count();
  await page.click(`dialog[open] [data-vh-prev="${nOld - 1}"]`); await page.waitForSelector("dialog[open] .vh-cards");
  ok(/Changes Back, Earlier Schedule/.test(await page.textContent("dialog[open] .vh-cards li.vh-chg")), "Preview says the reworded card gets its earlier schedule back");
  ok(await fits(page), "the deck preview fits at 1280px");
  await page.click('dialog[open] .sheet-foot [data-vh-res]'); await page.waitForTimeout(300);
  d1 = await page.evaluate(() => state.decks.d1);
  ok(d1.cards.length === 6 && d1.cards[0].front === "Mitochondria" && d1.cards[0].box === 3 && d1.cards[0].seen === 4, "the oldest version restores k1's wording and the schedule it had then");

  /* Reload: versions stay */
  await page.reload(); await page.waitForFunction(() => window.__sbProStudy && window.SBVH);
  await page.evaluate(() => { const T = window.__sbProStudy; Object.defineProperty(window, "state", {get: () => T.state(), configurable: true}); Object.defineProperty(window, "dlg", {get: () => T.dlg(), configurable: true}); ["ui", "render", "applyChanges", "clone", "saveNoteText"].forEach(k => { window[k] = T[k]; }); });
  await page.waitForTimeout(1800);
  ok((await list(page, "deck", "d1")).length >= 3 && (await list(page, "note", "n1")).length >= 4, "versions are still there after a reload");
  await tab(page, "flashcards", {deckId: "d1"});
  await act(page, "fc-edit", "d1"); await page.waitForSelector('dialog[open] [data-act="vh-deck"]');
  ok(true, "Edit Deck shows Earlier Versions after a reload");
  await page.evaluate(() => dlg.close());
  // pruning: 31 days later everything older than 30 days goes
  await page.evaluate(() => { window.__vhT += 31 * 864e5; }); await page.evaluate(() => window.SBVH.trim());
  ok((await list(page, "deck", "d1")).length === 0 && (await page.evaluate(() => window.SBVH.keys())).length === 0, "versions older than 30 days are pruned");
  await page.evaluate(() => { window.__vhT -= 31 * 864e5; });
  ok(page.errs.length === 0, "no console errors (Pro): " + page.errs.join(" | "));
  await ctx.close();

  /* Phone width */
  const pctx = await mkCtx(false, {width: 390, height: 844}), pp = await open(pctx);
  await pp.evaluate(() => { const d = clone(state.decks.d1); d.cards = d.cards.slice(2); applyChanges([{kind: "deck", id: "d1", after: d}], "Deleted"); });
  await pp.evaluate(() => window.SBVH.settle());
  await pp.evaluate(() => { ui.tab = "flashcards"; ui.deckId = "d1"; render(); }); await pp.waitForTimeout(250);
  await act(pp, "vh-deck", "d1"); await pp.waitForSelector("dialog[open] .vh-sheet .vh-list li");
  ok(await fits(pp), "the deck versions list fits at 390px");
  await pp.click('dialog[open] [data-vh-prev="0"]'); await pp.waitForSelector("dialog[open] .vh-cards");
  ok(await fits(pp), "the deck preview fits at 390px");
  await pp.evaluate(() => dlg.close());
  await pp.evaluate(t => applyChanges([{kind: "note", id: "n1", after: Object.assign(clone(state.notes.n1), {text: t})}], ""), "Short");
  await pp.evaluate(() => window.SBVH.settle());
  await act(pp, "note-versions", "n1"); await pp.waitForSelector("dialog[open] .vh-sheet .vh-list li");
  ok(await fits(pp), "the note versions list fits at 390px");
  await pp.click('dialog[open] [data-vh-prev="0"]'); await pp.waitForSelector("dialog[open] .vh-diff");
  ok(await fits(pp), "the note preview fits at 390px");
  ok(pp.errs.length === 0, "no console errors (phone): " + pp.errs.join(" | "));
  await pctx.close();

  /* Free (locked): the free Earlier Versions, unchanged, with one line about Pro */
  const fctx = await mkCtx(true), fp = await open(fctx);
  await fp.evaluate(() => { ui.tab = "notes"; render(); }); await fp.waitForTimeout(250);
  await fp.click('.note[data-note="n1"] .note-body'); await fp.waitForSelector(".note.editing #noteText");
  await fp.fill("#noteText", "Draft two of the outline");
  await fp.evaluate(() => saveNoteText()); await fp.waitForTimeout(300);
  await act(fp, "note-versions", "n1"); await fp.waitForSelector("dialog[open] .nv-list li");
  ok(await fp.locator("dialog[open] .vh-sheet").count() === 0 && /Studyboard keeps the last few versions of each note on this device/.test(await fp.textContent("dialog[open]")), "free users get the free Earlier Versions sheet");
  ok(await fp.locator("dialog[open] .vh-hint").count() === 1 && /30 days of versions/.test(await fp.textContent("dialog[open] .vh-hint")), "with one small line about Pro");
  await fp.click('dialog[open] [data-nv="0"]'); await fp.waitForTimeout(300);
  ok((await fp.evaluate(() => state.notes.n1.text)) === OUTLINE, "free Restore works as before");
  await act(fp, "note-versions", "n1"); await fp.waitForSelector("dialog[open] .vh-hint");
  await fp.click('dialog[open] [data-act="vh-pro"]'); await fp.waitForTimeout(400);
  ok(/Version History is part of Studyboard Pro/.test(await fp.textContent("dialog[open]")), "See Pro opens the Pro sheet");
  await fp.evaluate(() => dlg.close());
  await fp.evaluate(() => { const d = clone(state.decks.d1); d.cards = d.cards.slice(3); applyChanges([{kind: "deck", id: "d1", after: d}], "Deleted"); });
  await fp.waitForTimeout(300);
  ok((await fp.evaluate(() => window.SBVH.keys())).length === 0 && (await fp.evaluate(() => window.SBVH.list("deck", "d1"))).length === 0, "free edits don't make Pro versions");
  await fp.evaluate(() => { ui.tab = "flashcards"; ui.deckId = "d1"; render(); }); await fp.waitForTimeout(250);
  await act(fp, "fc-edit", "d1"); await fp.waitForSelector("dialog[open] #dkDel");
  ok(await fp.locator('dialog[open] [data-act="vh-deck"]').count() === 0, "free users have no Earlier Versions in Edit Deck");
  ok(fp.errs.length === 0, "no console errors (free): " + fp.errs.join(" | "));
  await fctx.close();

  await browser.close(); server.close();
  console.log(`\nversion-history e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
