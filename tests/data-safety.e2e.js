// Browser test for the data-safety guards
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const FILE = "file://" + path.join(__dirname, "..", "index.html");
let n = 0; const ok = (c, m) => { n++; assert(c, m); };

async function open(browser, init) {
  const ctx = await browser.newContext({viewport: {width: 1200, height: 800}});
  await ctx.addInitScript(([i]) => { try { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); window.__SB_TEST = 1; if (i && !sessionStorage.getItem("init")) { sessionStorage.setItem("init", "1"); eval(i); } } catch (e) {} }, [init || ""]);
  const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", e => errs.push(e.message));
  await page.goto(FILE); await page.waitForTimeout(1500);
  return {ctx, page, errs};
}

(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    { const {ctx, page, errs} = await open(browser, "localStorage.setItem('coursework:v2','{not json');");
      const kept = await page.evaluate(() => Object.keys(localStorage).filter(k => k.indexOf("studyboard:unreadable:") === 0).map(k => localStorage.getItem(k)));
      ok(kept.length === 1 && kept[0] === "{not json", "the unreadable copy is kept aside, byte for byte");
      ok(errs.length === 0, "the app still starts: " + errs.join("; "));
      await ctx.close(); }

    const text = 'Use <div class="x"> and &lt;p&gt; like this:\n    indented()';
    { const seed = {v: 2, courses: [], tasks: [], files: [], notes: [{id: "n1", text, x: 30, y: 30, rot: 0, color: "yellow", z: 1}], decks: [], events: [], settings: {capacity: 15}, updated: 1};
      const {ctx, page} = await open(browser, "localStorage.setItem('coursework:v2'," + JSON.stringify(JSON.stringify(seed)) + ");");
      await page.reload(); await page.waitForTimeout(1200);
      const saved = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("coursework:v2") || "{}"); return ((s.notes || [])[0] || {}).text; });
      ok(saved === text, "note text is unchanged after load and save: " + JSON.stringify(saved));
      await ctx.close(); }

    { const seed = {v: 2, courses: [], tasks: [], files: [], notes: [{id: "n1", text: "only a note", x: 30, y: 30, rot: 0, color: "yellow", z: 1}], decks: [], events: [], settings: {capacity: 15, noteBoards: [{id: "b1", name: "Chem", color: "blue"}], photoThemes: []}, updated: 1};
      const {ctx, page} = await open(browser, "localStorage.setItem('coursework:v2'," + JSON.stringify(JSON.stringify(seed)) + ");");
      await page.waitForTimeout(7500);
      const bk = await page.evaluate(() => new Promise(res => { const r = indexedDB.open("studyboard-sync", 1); r.onsuccess = () => { try { const q = r.result.transaction("backups").objectStore("backups").getAll(); q.onsuccess = () => res(q.result); q.onerror = () => res(null); } catch (e) { res(null); } }; r.onerror = () => res(null); }));
      ok(bk && bk.length === 1 && bk[0].notes.length === 1, "a note-only account still gets a daily device backup");
      ok(bk[0].keep && Array.isArray(bk[0].keep.noteBoards) && bk[0].keep.noteBoards[0].id === "b1", "the backup carries the note boards");
      await ctx.close(); }

    { const seed = {v: 2, courses: [], tasks: [], files: [], notes: [{id: "n1", text: "old text", x: 30, y: 30, rot: 0, color: "yellow", z: 1}, {id: "n2", text: "changed elsewhere", x: 60, y: 60, rot: 0, color: "blue", z: 2}], decks: [], events: [], settings: {capacity: 15}, updated: 1};
      const draft = {id: "n1", text: "old text and a paragraph typed before the window closed", base: "old text", at: 1};
      const {ctx, page} = await open(browser, "localStorage.setItem('coursework:v2'," + JSON.stringify(JSON.stringify(seed)) + ");localStorage.setItem('studyboard:noteDraft'," + JSON.stringify(JSON.stringify(draft)) + ");");
      const got = await page.evaluate(() => ({text: JSON.parse(localStorage.getItem("coursework:v2")).notes.find(x => x.id === "n1").text, left: localStorage.getItem("studyboard:noteDraft")}));
      ok(got.text === draft.text, "the typed text is back in the note: " + JSON.stringify(got.text));
      ok(got.left === null, "the draft is cleared once used");
      await page.evaluate(() => localStorage.setItem("studyboard:noteDraft", JSON.stringify({id: "n2", text: "stale draft", base: "what it said before", at: 1})));
      await page.reload(); await page.waitForTimeout(1200);
      const n2 = await page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")).notes.find(x => x.id === "n2").text);
      ok(n2 === "changed elsewhere", "a draft older than the saved text doesn't replace it");
      await ctx.close(); }

    { const seed = {v: 2, courses: [], tasks: [{id: "t1", title: "Essay", courseId: "", due: "2026-11-01", status: "todo"}], files: [], notes: [], decks: [], events: [], settings: {capacity: 15}, updated: 1};
      const {ctx, page} = await open(browser, "localStorage.setItem('coursework:v2'," + JSON.stringify(JSON.stringify(seed)) + ");");
      await page.evaluate(async () => { const S = window.__sbSync; S.backupBefore("Before restoring a backup"); await new Promise(r => setTimeout(r, 400)); await S.saveDeviceBackup(S.backupSnap()); await S.saveDeviceBackup(S.backupSnap()); });
      const keys = await page.evaluate(() => new Promise(res => { const r = indexedDB.open("studyboard-sync", 1); r.onsuccess = () => { const q = r.result.transaction("backups").objectStore("backups").getAllKeys(); q.onsuccess = () => res(q.result); }; r.onerror = () => res([]); }));
      ok(keys.filter(k => k.startsWith("k-")).length === 1 && keys.filter(k => k.startsWith("d-")).length === 1, "one kept backup and one daily backup: " + keys.join());
      await ctx.close(); }

    console.log("data-safety e2e ok (" + n + " checks)");
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
