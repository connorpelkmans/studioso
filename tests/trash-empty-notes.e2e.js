// Empty notes don't go to Recently Deleted (01-data.js trashCapture), and ones already there are cleared
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const file = path.resolve(__dirname, "..", "index.html");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    const page = await browser.newPage(), errs = []; page.on("pageerror", e => errs.push(e.message));
    const old = Date.now() - 3 * 864e5;
    await page.addInitScript(o => { window.__SB_TEST = true;
      localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:tour", "done");
      localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [], tasks: [], notes: [{id: "e1", text: "  ", color: "yellow", x: 10, y: 10, z: 1, rot: 0}, {id: "w1", text: "Krebs cycle", color: "blue", x: 40, y: 40, z: 2, rot: 0}, {id: "p1", text: "", color: "pink", x: 60, y: 60, z: 3, rot: 0, stickers: [{k: "star", x: 0.5, y: 0.5}]}], settings: {}}));
      // an empty note deleted before this change, and a real one
      localStorage.setItem("studioso:trash", JSON.stringify([{id: "tOld", kind: "note", deletedAt: o, items: [{kind: "note", id: "e0", data: {id: "e0", text: "", color: "yellow"}}]}, {id: "tKeep", kind: "note", deletedAt: o, items: [{kind: "note", id: "k0", data: {id: "k0", text: "Keep me", color: "yellow"}}]}]));
    }, old);
    await page.goto("file://" + file); await page.waitForFunction(() => window.__sbSync, null, {timeout: 40000}); await page.waitForTimeout(800);
    const ids = () => page.evaluate(() => Object.values(__sbSync.state.trash || {}).flatMap(e => (e.items || []).map(i => i.id)).sort());
    ok(JSON.stringify(await ids()) === '["k0"]', "an empty note already in Recently Deleted is cleared; a note with text stays: " + JSON.stringify(await ids()));
    await page.evaluate(() => __sbSync.applyChanges([{kind: "note", id: "e1", after: null}, {kind: "note", id: "w1", after: null}, {kind: "note", id: "p1", after: null}], "Deleted"));
    const now = await ids();
    ok(!now.includes("e1") && now.includes("w1") && now.includes("p1"), "deleting an empty note doesn't put it in Recently Deleted; notes with text or a sticker do: " + JSON.stringify(now));
    ok(!errs.length, "no page errors: " + errs.join(" | "));
  } finally { await browser.close(); }
  console.log(`trash-empty-notes.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
