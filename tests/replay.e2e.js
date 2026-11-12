// node tests/replay.e2e.js
/* Lecture Replay: the player, times on the transcript, a note's lines and marks, the playing line lighting up, Fix Times,
   the pill after the sheet closes, Hear It on a card made from the lecture, and notes typed while recording */
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
const src = require("../scripts/app-files").source(), a = src.indexOf("/*REPLAY-START*/"), b = src.indexOf("/*REPLAY-END*/");
const R = new Function(src.slice(a, b) + "; return RPLAY;")();

// A 60-second lecture, a sentence every 6 seconds, saved with its timings
const SAID = ["Welcome everyone, today is about membranes.", "Osmosis moves water across a semipermeable membrane toward more solute.", "Tonicity compares the solute on both sides of the membrane.",
  "Diffusion moves particles from high concentration to low concentration.", "Facilitated diffusion uses channel proteins and carrier proteins.", "Active transport spends ATP to pump ions against the gradient.",
  "The sodium potassium pump sends three sodium out and two potassium in.", "Endocytosis wraps the plasma membrane around large particles.", "Phagocytosis is cell eating by white blood cells.", "Next week we start cell signaling and receptors."];
const pieces = SAID.map((s, i) => ({t: i * 6000, s})), TEXT = SAID.join(" "), TAT = R.anchorsFor(TEXT, pieces);
const NOTE = "Membranes lecture\n- osmosis: water goes to more solute\n- Na/K pump = 3 sodium out, 2 potassium in\n- phagocytosis: cell eating (white blood cells)\nask TA about lab 4";
function SEED(){
  const L1 = {id: "L1", name: "BIO101 Lecture, Membranes", courseId: "c1", folderId: "lectures", kind: "file", taskIds: [], desc: "", url: "", dur: 60, created: Date.now() - 864e5, updated: Date.now() - 864e5,
    revs: [{assetId: "u/test/lec1.wav", size: 960044, type: "audio/wav", at: 1, name: "lec1.wav"}],
    tr: {text: TEXT, by: "live", at: 1, tAt: TAT}, lec: {org: "## Membranes\n\n" + SAID.slice(0, 5).join(" ") + "\n\n## Transport\n\n" + SAID.slice(5).join(" "), sum: "", at: 1, marks: [36500], att: [{k: "note", id: "n1"}]}};
  const notes = [{id: "n1", text: NOTE, color: "yellow", x: 40, y: 40, z: 1, courseId: "c1", created: Date.now() - 864e5}];
  const decks = [{id: "d1", name: "BIO101 Lectures", courseId: "c1", created: 1, quizzes: [], cards: [
    {id: "k1", front: "What does the sodium potassium pump do?", back: "Sends three sodium out and two potassium in", box: 0, due: "", seen: 0, right: 0, wrong: 0, last: "", from: {k: "lecture", id: "L1", at: "2026-01-01"}}]}];
  return {v: 2, updated: 1, decks, notes, tasks: [], files: [L1], settings: {capacity: 15}, courses: [{id: "c1", name: "Biology", code: "BIO101", color: "#3B6FE0"}]};
}
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath, args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"]});
  try {
    const ctx = await browser.newContext({viewport: {width: 1200, height: 900}, permissions: ["microphone"], serviceWorkers: "block"});
    await ctx.addInitScript(seed => {
      window.__SB_TEST = true;
      try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); } } catch (e) {}
      // the recording, already on this device: a quiet 60-second tone
      const wav = () => { const rate = 8000, len = rate * 60, buf = new ArrayBuffer(44 + len * 2), v = new DataView(buf), w = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
        w(0, "RIFF"); v.setUint32(4, 36 + len * 2, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, len * 2, true);
        const pcm = new Int16Array(buf, 44); for (let i = 0; i < len; i++) pcm[i] = Math.round(Math.sin(i / 8) * 600); return new Blob([buf], {type: "audio/wav"}); };
      const r = indexedDB.open("studyboard-files", 1); r.onupgradeneeded = () => r.result.createObjectStore("f");
      r.onsuccess = () => { const b = wav(); r.result.transaction("f", "readwrite").objectStore("f").put({blob: b, size: b.size, type: b.type, at: Date.now()}, "u/test/lec1.wav"); };
    }, SEED());
    const page = await ctx.newPage(); const errs = [];
    page.on("pageerror", e => errs.push(e.message)); page.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    await page.goto(base); await page.waitForTimeout(900);
    await page.evaluate(() => { const T = window.__sbProStudy; Object.defineProperty(window, "state", {get: () => T.state(), configurable: true}); Object.defineProperty(window, "dlg", {get: () => T.dlg(), configurable: true}); ["ui", "render"].forEach(k => { window[k] = T[k]; }); });
    const act = (x, id, data) => page.evaluate(([x, id, data]) => { const b = document.createElement("button"); b.dataset.act = x; if (id) b.dataset.id = id; Object.assign(b.dataset, data || {}); b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [x, id, data]);
    const st = () => page.evaluate(() => window.SBREPLAY.state());

    /* The lecture's sheet */
    await act("lec-view", "L1"); await page.waitForSelector(".lec-sheet .rp-dock", {timeout: 5000});
    ok(await page.locator(".lec-audio").count() === 0 && await page.locator(".rp-slot .rp-dock").count() === 1, "the lecture has one player under its views, in place of the plain audio control");
    ok(await page.locator('.rp-marks [data-act="rp-at"]').count() === 1 && /★ 0:36/.test(await page.textContent(".rp-marks")), "the ★ mark plays from its moment");
    ok(/Replay/.test(await page.textContent(".lec-att-list")), "each of Slides and Notes has Replay");
    await page.waitForFunction(() => window.SBREPLAY.state().fid === "L1", null, {timeout: 8000});
    ok(true, "the recording loads in the background");

    /* The transcript with times */
    await act("lec-doc", "L1", {doc: "org"}); await page.waitForSelector(".rp-doc", {timeout: 4000});
    const chips = await page.$$eval('.rp-doc [data-act="rp-at"]', bs => bs.map(b => Number(b.dataset.t)));
    ok(chips.length === 2 && chips[0] === 0 && Math.abs(chips[1] - 30000) <= 1000, "each paragraph of the tidied transcript has its time: " + chips.join());
    await page.locator('.rp-doc [data-act="rp-at"]').nth(1).click();
    await page.waitForFunction(() => window.SBREPLAY.state().playing, null, {timeout: 5000});
    let s = await st(); ok(s.now >= 27500 && s.now < 31500, "a time plays from just before it: " + Math.round(s.now));
    await page.waitForFunction(() => window.SBREPLAY.state().now > 30500, null, {timeout: 5000}); await page.waitForTimeout(300);
    ok(await page.evaluate(() => { const on = document.querySelector(".rp-doc .rp-on"); return !!on && /Active transport/.test(on.textContent); }), "the paragraph being said lights up");
    ok(await page.evaluate(() => /0:3\d/.test(document.querySelector(".rp-dock .rp-now").textContent)), "the player shows where it is");
    await page.click('.rp-dock [data-act="rp-skip"][data-d="-10"]'); s = await st();
    ok(s.now >= 18000 && s.now < 22500, "back 10 seconds: " + Math.round(s.now));
    await page.click('.rp-dock [data-act="rp-rate"]');
    ok(await page.evaluate(() => /1\.25×/.test(document.querySelector(".rp-rate").textContent) && localStorage.getItem("studyboard:replayRate") === "1.25"), "the speed changes and is remembered");
    await page.click('.rp-dock [data-act="rp-rate"]'); await page.click('.rp-dock [data-act="rp-rate"]'); await page.click('.rp-dock [data-act="rp-rate"]'); await page.click('.rp-dock [data-act="rp-rate"]'); await page.click('.rp-dock [data-act="rp-rate"]');
    ok(await page.evaluate(() => localStorage.getItem("studyboard:replayRate") === "1"), "and goes round to 1×");

    /* A note's lines */
    await act("lec-doc", "L1", {doc: ""}); await page.waitForSelector(".rp-row", {timeout: 4000});
    await page.click(".rp-row"); await page.waitForSelector(".rp-lines", {timeout: 4000});
    const lines = await page.$$eval(".rp-line", ls => ls.map(l => ({t: l.dataset.rpT == null ? null : Number(l.dataset.rpT), s: l.querySelector(".rp-txt").textContent})));
    const at = w => (lines.find(l => l.s.includes(w)) || {}).t;
    ok(Math.abs(at("osmosis") - 6000) <= 6000 && Math.abs(at("Na/K") - 36000) <= 6000 && Math.abs(at("phagocytosis") - 48000) <= 6000, "each line of a note written afterwards lands where it was said: " + JSON.stringify(lines));
    ok(at("ask TA") == null && await page.locator(".rp-line.untimed").count() >= 1, "a line about something else stays untimed");
    ok(at("Membranes lecture") === at("osmosis"), "the note's title takes the time of the first line under it");
    ok(/matched to the lecture/.test(await page.textContent(".rp-ihead")), "it says how many lines matched");
    await page.locator(".rp-line", {hasText: "Na/K"}).locator('[data-act="rp-at"]').click();
    await page.waitForFunction(t => window.SBREPLAY.state().now > t + 300, at("Na/K"), {timeout: 9000}); await page.waitForTimeout(300);
    ok(await page.evaluate(() => { const on = document.querySelector(".rp-lines .rp-on"); return !!on && /Na\/K/.test(on.textContent); }), "playing from a line lights it up");

    /* Fix Times */
    await page.click('[data-act="rp-fix"]'); await page.waitForSelector(".rp-set", {timeout: 3000});
    await page.evaluate(() => window.SBREPLAY.seek("L1", 12000, {lead: 0})); await page.waitForTimeout(300);
    await page.locator(".rp-set").last().click(); await page.waitForTimeout(300);
    const pins = await page.evaluate(() => state.files.L1.lec.pins && state.files.L1.lec.pins.n1);
    ok(pins && Object.keys(pins).length === 1 && Math.abs(Object.values(pins)[0] - 13000) < 2500, "Fix Times sets a line to the moment playing: " + JSON.stringify(pins));
    ok(await page.locator(".rp-line.fix").last().locator('[data-act="rp-unpin"]').count() === 1, "and it can be cleared");
    await page.click('[data-act="rp-fix"]'); await page.waitForTimeout(200);
    ok(await page.locator(".rp-chip.pinned").count() === 1, "a time set by hand shows as set");

    /* The pill */
    await page.evaluate(() => window.SBREPLAY.seek("L1", 20000, {lead: 0})); await page.waitForTimeout(200);
    await page.evaluate(() => dlg.close()); await page.waitForTimeout(400);
    ok(await page.locator("#rpPill").count() === 1 && /BIO101 Lecture, Membranes/.test(await page.textContent("#rpPill")), "closing the sheet while it plays leaves a small pill");
    await page.click('#rpPill [data-act="rp-toggle"]'); await page.waitForTimeout(200);
    ok(!(await st()).playing, "the pill pauses");
    await page.click('#rpPill [data-act="rp-stop"]'); await page.waitForTimeout(200);
    ok(await page.locator("#rpPill").count() === 0 && !(await st()).fid, "and stops");

    /* Hear It */
    await page.evaluate(() => { ui.tab = "flashcards"; render(); }); await page.waitForTimeout(200);
    await act("fc-study", "d1"); await page.waitForTimeout(300);
    await page.click('.rate [data-act="fc-flip"]'); await page.waitForSelector(".rp-hear", {timeout: 3000});
    ok(/BIO101 Lecture, Membranes/.test(await page.textContent(".rp-hear-row")), "a card from a lecture offers Hear It after its answer");
    await page.click(".rp-hear"); await page.waitForFunction(() => window.SBREPLAY.state().playing, null, {timeout: 8000});
    s = await st(); ok(s.fid === "L1" && s.now >= 30000 && s.now < 38000 && s.clipEnd > 0, "Hear It plays 30 seconds from where the card's words were said: " + Math.round(s.now));
    await page.evaluate(() => window.SBREPLAY.stop());

    /* Notes typed while recording */
    await page.evaluate(() => { ui.tab = "courses"; render(); }); await act("lec-open", "", {course: "c1"}); await page.waitForTimeout(400);
    await page.click('[data-act="lec-start"]'); await page.waitForSelector("#rpRecNotes", {timeout: 8000});
    await page.click("#rpRecNotes"); await page.keyboard.type("Osmosis: water to more solute"); await page.waitForTimeout(1200);
    await page.keyboard.press("Enter"); await page.keyboard.type("Pump: 3 Na out 2 K in");
    await page.click('[data-act="lec-pause"]'); await page.waitForTimeout(150);
    ok(await page.inputValue("#rpRecNotes") === "Osmosis: water to more solute\nPump: 3 Na out 2 K in", "the notes box keeps its text when the recorder redraws");
    await page.click('[data-act="lec-pause"]'); await page.waitForTimeout(400);
    await page.click('[data-act="lec-stop"]'); await page.waitForSelector("#lecName", {timeout: 8000});
    ok(/Pump: 3 Na out/.test(await page.inputValue("#rpRecNotes")), "the typed notes show when the recording stops");
    await page.fill("#lecName", "Typed Notes Day"); await page.click('[data-act="lec-save"]'); await page.waitForSelector(".lec-done", {timeout: 10000});
    const saved = await page.evaluate(() => { const f = Object.values(state.files).find(x => x.name === "Typed Notes Day"); const nn = Object.values(state.notes).find(x => x.rp && x.rp.f === (f && f.id)); return {f, nn}; });
    const ks = saved.nn ? Object.values(saved.nn.rp.k) : [];
    ok(!!saved.f && !!saved.nn && /Typed Notes Day: My Notes\nOsmosis: water to more solute\nPump/.test(saved.nn.text) && saved.nn.courseId === "c1", "the typed notes are saved as a note with the lecture");
    ok(ks.length === 2 && ks[1] > ks[0] + 800 && ks[0] >= 0, "each line keeps when it was written: " + JSON.stringify(saved.nn && saved.nn.rp.k));
    ok(saved.f.lec.att.some(x => x.k === "note" && x.id === saved.nn.id), "and the note is on the lecture's Slides and Notes");
    ok(!errs.length, "no errors: " + errs.join(" | "));
    console.log(`\n${n} passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
