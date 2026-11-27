// node tests/present.e2e.js: presentation practice. A PowerPoint and a PDF open as slides; the clock starts on play; each slide's time
// follows the slide changes (going back adds to a slide, a pause doesn't count); a recording and a transcript (speech recognition
// stood in for here) are kept per slide; the run shows afterwards with playback; Escape before starting saves nothing.
// node tests/deck-reorder.e2e.js: drag (and Alt + Arrow) decks and quizzes into your own order on the Review tab
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let f; try { f = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const FX = path.join(__dirname, "fixtures"), OUT = require("os").tmpdir() + "/sbpresent";
const SEED = {v: 2, updated: 1, tasks: [], files: [], notes: [], events: [], decks: [], settings: {}, courses: [{id: "c1", name: "Composition", code: "ENGL 102", color: "#7A4FD6"}]};
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) process.exitCode = 1; };
(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const b = await chromium.launch({executablePath, args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"]});
  const ctx = await b.newContext({viewport: {width: 1280, height: 800}, serviceWorkers: "block", permissions: ["microphone"], deviceScaleFactor: 1});
  await ctx.addInitScript(s => { window.__SB_TEST = true;
    window.SpeechRecognition = class { constructor(){ this.n = 0; } start(){ const me = this; me.iv = setInterval(() => { const k = ++window.__srN || (window.__srN = 1); const res = [{0: {transcript: "said " + (window.__srN)}, isFinal: true, length: 1}]; me.onresult && me.onresult({resultIndex: 0, results: res}); }, 500); } stop(){ clearInterval(this.iv); this.onend && this.onend(); } };
     localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(s)); }, SEED);
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto("http://127.0.0.1:" + server.address().port + "/index.html");
  await p.waitForFunction(() => window.__sbSync && window.SBPRESENT && document.readyState === "complete", null, {timeout: 20000}); await p.waitForTimeout(800);
  await p.evaluate(() => { const P = window.__sbPlanObj(); P.isPro = () => true; });
  await p.evaluate(() => { const S = window.__sbSync; document.querySelectorAll("dialog[open]").forEach(d => d.close()); S.ui.tab = "flashcards"; S.render(); });
  await p.waitForTimeout(500);
  await p.click('.rv-tabs [data-id="present"]'); await p.waitForTimeout(500);
  ok(await p.locator("[data-pr-list]").count() === 1, "Presentations view shows");
  await p.screenshot({path: OUT + "-1-empty.png"});
  await p.click('#view [data-act="pr-new"]'); await p.waitForSelector("#prFile", {state: "attached"});
  await p.setInputFiles("#prFile", FX + "/present-deck.pptx");
  await p.waitForSelector(".pr-picked", {timeout: 15000});
  ok(/6 slides/.test(await p.textContent(".pr-picked")) && /speaker notes/.test(await p.textContent(".pr-picked")), "the PowerPoint opens: 6 slides, notes found");
  await p.selectOption("#prCourse", "c1");
  await p.screenshot({path: OUT + "-2-setup.png"});
  await p.click('[data-act="pr-create"]'); await p.waitForSelector("#prStage .pr-play", {timeout: 15000}); await p.waitForTimeout(600);
  ok(await p.evaluate(() => document.querySelector("#prRecOn").checked), "Record me is on for Pro");
  await p.screenshot({path: OUT + "-3-ready.png"});
  await p.click('#prStage [data-act="pr-play"]'); await p.waitForTimeout(1600);
  ok(await p.evaluate(() => !!document.querySelector("#prRec") && !document.querySelector("#prRec").hidden), "the recording chip shows");
  await p.keyboard.press("ArrowRight"); await p.waitForTimeout(1200);
  await p.keyboard.press("ArrowRight"); await p.waitForTimeout(2200);
  await p.screenshot({path: OUT + "-4-stage.png"});
  { const cr = await p.evaluate(() => { const c = document.querySelector("#prCredits .scr-live"); return c ? c.textContent : ""; });
    ok(/^\+\d+\s*credits?$/.test(cr.trim()), "the stage shows the Studyboard Credits this run has earned so far, and nothing else: " + cr); }
  await p.keyboard.press("ArrowLeft"); await p.waitForTimeout(700);
  await p.keyboard.press("ArrowRight"); await p.waitForTimeout(400);
  await p.keyboard.press("p"); await p.waitForTimeout(1500); await p.keyboard.press("p");
  await p.keyboard.press("ArrowRight"); await p.waitForTimeout(800);
  // reaching the last slide (straight from slide 4, so slide 5 stays at 0) is what makes the run count
  await p.click('#prStage .pr-th[data-i="5"]'); await p.waitForTimeout(300);
  await p.click('#prStage [data-act="pr-end"]');
  await p.waitForSelector(".pr-rrow", {timeout: 15000}); await p.waitForTimeout(700);
  const st = await p.evaluate(() => { const L = window.SBPRESENT.list(); const r = L[0].runs[0]; return {n: L[0].runs.length, total: r.total, sum: r.times.reduce((a, b) => a + b, 0), times: r.times, audio: r.audio}; });
  ok(st.n === 1 && Math.abs(st.total - st.sum) < 50, "slide times add up to the total: " + JSON.stringify(st));
  ok(st.times[0] > 1300 && st.times[1] > 1000 && st.times[2] > 2500 && st.times[4] === 0, "time per slide follows the slide changes, going back adds to a slide, pause doesn't count: " + st.times.join(","));
  ok(st.audio, "the recording is saved");
  await p.screenshot({path: OUT + "-5-review.png"});
  await p.click('.pr-rrow[data-i="2"]'); await p.waitForTimeout(400);
  const pb = await p.$('[data-act="pr-aplay"]');
  if (pb) { await pb.click(); await p.waitForTimeout(1200); }
  ok(await p.evaluate(() => /\d:\d\d \/ \d:\d\d/.test((document.querySelector("#prPTime") || {}).textContent || "")), "the slide's player shows its time");
  await p.screenshot({path: OUT + "-6-review-slide.png"});
  ok(/said \d+/.test(await p.textContent(".pr-trans")), "the slide shows what was said on it: " + (await p.textContent(".pr-trans")).slice(0, 80));
  await p.click('#prStage [data-act="pr-close"]'); await p.waitForTimeout(600);
  ok(await p.locator(".rv-pres").count() === 1, "the presentation shows as a card");
  await p.screenshot({path: OUT + "-7-list.png"});
  // a PDF too
  await p.click('#view [data-act="pr-new"], .fab, #fab').catch(() => {});
  await p.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "pr-new"; document.body.appendChild(b); b.click(); b.remove(); });
  await p.waitForSelector("#prFile", {state: "attached"}); await p.setInputFiles("#prFile", FX + "/present-deck.pdf");
  await p.waitForSelector(".pr-picked", {timeout: 15000});
  ok(/PDF/.test(await p.textContent(".pr-picked")) && /6 slides/.test(await p.textContent(".pr-picked")), "a PDF opens too");
  await p.click('[data-act="pr-create"]'); await p.waitForSelector("#prStage .pr-play", {timeout: 15000}); await p.waitForTimeout(800);
  await p.screenshot({path: OUT + "-8-pdf-ready.png"});
  await p.keyboard.press("Escape"); await p.waitForTimeout(500);
  ok(await p.locator("#prStage").count() === 0 && await p.locator(".rv-pres").count() === 2, "Escape before starting closes without a run; two presentations listed");
  // ending early: the summary shows, but the run isn't kept, counted or a best time
  await p.evaluate(() => { const x = window.SBPRESENT.list().find(q => q.kind === "pdf"); window.SBPRESENT.open(x.id); }); await p.waitForSelector("#prStage .pr-play", {timeout: 15000});
  await p.click('#prStage [data-act="pr-play"]'); await p.waitForTimeout(2600); await p.keyboard.press("ArrowRight"); await p.waitForTimeout(600);
  await p.click('#prStage [data-act="pr-end"]'); await p.waitForSelector(".pr-rrow", {timeout: 15000}); await p.waitForTimeout(500);
  const early = await p.evaluate(() => ({runs: window.SBPRESENT.list().find(q => q.kind === "pdf").runs.length, chip: (document.querySelector(".pr-chip.c-early") || {}).textContent || "", eyebrow: document.querySelector(".pr-eyebrow").textContent}));
  ok(early.runs === 0 && early.chip === "Ended early" && /Ended early, not counted/.test(early.eyebrow), "ending before the last slide shows the summary but keeps nothing: " + JSON.stringify(early));
  await p.keyboard.press("Escape"); await p.waitForTimeout(400);
  const tr = await p.evaluate(() => { const r = window.SBPRESENT.list().find(x => x.runs.length).runs[0]; return {n: r.tr.length, first: r.tr[0], seg: r.seg}; }); ok(tr.n > 3 && tr.first && tr.first.t >= 0, "the transcript is kept with the time of each phrase");
  ok(!errs.length, "no page errors: " + errs.join(" | "));
  console.log("present.e2e: done" + (process.exitCode ? " with failures" : ", all passed"));
  await b.close(); server.close();
})();
