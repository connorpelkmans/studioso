// node tests/present-plus.e2e.js: presentation practice, the rest: per-slide targets, group presentations, pace nudges, Q&A practice,
// stats and coach (Pro), the notes check, history, practicing one section, and the phone remote's panel and page.
// (was: presentation practice.) A PowerPoint and a PDF open as slides; the clock starts on play; each slide's time
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
  const port = server.address().port;
  const b = await chromium.launch({executablePath, args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"]});
  const ctx = await b.newContext({viewport: {width: 1280, height: 800}, serviceWorkers: "block", permissions: ["microphone"]});
  await ctx.addInitScript(s => { window.__SB_TEST = true;
    window.SpeechRecognition = class { start(){ const me = this; me.iv = setInterval(() => { window.__srN = (window.__srN || 0) + 1; const txt = window.__srN % 3 ? "um so the key study shows teens sleep less" : "start with the numbers seven hours versus nine"; me.onresult && me.onresult({resultIndex: 0, results: [{0: {transcript: txt}, isFinal: true, length: 1}]}); }, 400); } stop(){ clearInterval(this.iv); this.onend && this.onend(); } };
    localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(s)); }, SEED);
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error" && !/Failed to load resource|WebSocket|realtime|supabase/i.test(m.text())) errs.push(m.text()); });
  await p.goto("http://127.0.0.1:" + port + "/index.html");
  await p.waitForFunction(() => window.__sbSync && window.SBPRESENT && document.readyState === "complete", null, {timeout: 20000}); await p.waitForTimeout(800);
  await p.evaluate(() => { window.__sbPlanObj().isPro = () => true; const S = window.__sbSync; S.ui.tab = "flashcards"; S.render(); });
  await p.waitForTimeout(400); await p.click('.rv-tabs [data-id="present"]'); await p.waitForTimeout(300);
  await p.click('#view [data-act="pr-new"]'); await p.waitForSelector("#prFile", {state: "attached"});
  await p.setInputFiles("#prFile", FX + "/present-deck.pptx"); await p.waitForSelector(".pr-picked", {timeout: 15000});
  await p.fill("#prName", "Teen Sleep Talk"); await p.selectOption("#prCourse", "c1");
  await p.click('[data-act="pr-create"]'); await p.waitForSelector("#prStage .pr-play", {timeout: 15000}); await p.waitForTimeout(500);
  // the plan: every slide starts with the goal divided by the slides
  await p.click('[data-act="pr-plan"]'); await p.waitForSelector(".pr-plan-list .pr-pl"); await p.waitForTimeout(400);
  const t0 = await p.$$eval(".pr-pl-tm b", e => e.map(x => x.textContent));
  ok(t0.length === 6 && t0.every(x => x === "1:00"), "each slide starts with the goal divided by the slides: " + t0.join(","));
  await p.click('[data-act="pr-slide-t"][data-i="1"][data-d="15"]'); await p.waitForTimeout(200);
  ok(await p.textContent('.pr-pl:nth-child(2) .pr-pl-tm b') === "1:15" && /6:15/.test(await p.textContent("#prTgtS")), "giving slide 2 more time raises the goal to 6:15");
  for (let k = 0; k < 4; k++) { await p.click('[data-act="pr-slide-t"][data-i="0"][data-d="-15"]'); await p.waitForTimeout(80); }
  ok(await p.textContent('.pr-pl:nth-child(1) .pr-pl-tm b') === "0:05", "slide 1 can be cut to 0:05");
  // a group presentation
  await p.check("#prGrpOn"); await p.waitForTimeout(250);
  ok(await p.locator(".pr-spk-ed").count() === 2 && await p.locator(".pr-pl-sp").count() === 6, "a group gets two speakers and each slide a speaker");
  await p.fill('.pr-spk-ed input >> nth=0', "Maya"); await p.press('.pr-spk-ed input >> nth=0', "Tab"); await p.waitForTimeout(250);
  const tot = await p.textContent(".pr-sptot");
  ok(/Maya/.test(tot) && /3 slides/.test(tot), "each speaker shows their own target and slides: " + tot.replace(/\s+/g, " "));
  await p.check("#prQaOn"); await p.waitForTimeout(150);
  await p.screenshot({path: OUT + "-plan.png"});
  // practicing: a long slide glows, the speaker shows
  await p.click('#prStage [data-act="pr-play"]'); await p.waitForTimeout(6300);
  ok(await p.evaluate(() => document.getElementById("prStage").classList.contains("pr-long")), "a slide past its aim glows (pace nudge)");
  ok(/Maya/.test(await p.textContent("#prSpk")), "the current speaker shows: " + (await p.textContent("#prSpk")));
  await p.screenshot({path: OUT + "-nudge.png"});
  for (let k = 0; k < 5; k++) { await p.keyboard.press("ArrowRight"); await p.waitForTimeout(500); }
  await p.keyboard.press("ArrowRight"); await p.waitForSelector(".pr-qa:not([hidden]) .pr-qa-q", {timeout: 5000}); await p.waitForTimeout(400);
  ok(/\?/.test(await p.textContent(".pr-qa-q")), "after the last slide, Q&A asks a question: " + (await p.textContent(".pr-qa-q")));
  await p.screenshot({path: OUT + "-qa.png"});
  for (let k = 0; k < 3; k++) { await p.waitForTimeout(900); await p.click(".pr-qa-next"); }
  await p.waitForSelector(".pr-rrow", {timeout: 15000}); await p.waitForTimeout(600);
  ok(await p.locator(".pr-spbar").count() === 2, "afterwards, each speaker's time against their target");
  ok(await p.locator(".pr-stat").count() >= 3 && /wpm/.test(await p.textContent(".pr-stats")) && /um/.test(await p.textContent(".pr-stats")), "pace and filler words (Pro): " + (await p.textContent(".pr-stats")).replace(/\s+/g, " ").slice(0, 160));
  await p.click('.pr-rrow[data-i="1"]'); await p.waitForTimeout(400);
  ok(await p.locator(".pr-check li").count() >= 1, "the notes check lists the slide's points: " + (await p.textContent(".pr-check")).replace(/\s+/g, " "));
  await p.screenshot({path: OUT + "-review.png"});
  await p.click(".pr-rqa"); await p.waitForTimeout(300);
  ok(await p.locator(".pr-qa-tabs button").count() === 3, "the Q&A answers can be played back, question by question");
  await p.screenshot({path: OUT + "-review-qa.png"});
  // the coach needs AI: with none set up it says so
  await p.click('[data-act="pr-coach"]'); await p.waitForTimeout(400);
  ok(/Set up AI/.test(await p.evaluate(() => (document.getElementById("toast") || {}).textContent || "")), "the coach asks for AI to be set up first");
  // a coach result, as the AI would return it, draws in place
  await p.evaluate(() => { const L = window.SBPRESENT.list(); L[0].runs[0].coach = {summary: "A clear run with a strong opening.", clarity: "The two studies came through clearly.", rushed: [{slide: 1, why: "You moved on before the title landed."}], cuts: [{slide: 5, cut: "Cut the second example of blue light."}], tip: "Pause after each study."}; });
  await p.click('[data-act="pr-hist"]'); await p.waitForSelector(".pr-hlist li"); await p.waitForTimeout(300);
  ok(await p.locator(".pr-hlist li").count() === 1, "History lists the run");
  await p.click('.pr-hlist [data-act="pr-hrun"]'); await p.waitForSelector(".pr-rrow"); await p.waitForTimeout(400);
  ok(await p.locator(".pr-coach:not([hidden])").count() === 1 && /Pause after each study/.test(await p.textContent(".pr-coach")), "a saved coach summary shows with the run");
  await p.screenshot({path: OUT + "-coach.png"});
  // practice one section, with its own mini target
  await p.click('[data-act="pr-again"]'); await p.waitForSelector("#prStage .pr-play"); await p.waitForTimeout(400);
  await p.click('[data-act="pr-plan"]'); await p.waitForSelector("#prSecA");
  await p.selectOption("#prSecA", {value: "1"}); await p.selectOption("#prSecB", {value: "2"}); await p.click('[data-act="pr-sec-on"]'); await p.waitForSelector("#prStage .pr-play"); await p.waitForTimeout(400);
  ok(await p.locator(".pr-th").count() === 2, "a section shows only its slides");
  for (let k = 0; k < 12; k++) { await p.click('[data-act="pr-sectgt"][data-d="-30"]'); }
  await p.waitForTimeout(200);
  ok(/0:15/.test(await p.textContent("#prSecT")), "the section has its own target: " + (await p.textContent("#prSecT")));
  await p.click('#prStage [data-act="pr-play"]'); await p.waitForTimeout(1200);
  ok(await p.locator("#prWrap:not([hidden])").count() === 1, "the wrap-up warning shows near the end: " + (await p.textContent("#prWrap")));
  await p.screenshot({path: OUT + "-section.png"});
  await p.keyboard.press("ArrowRight"); await p.waitForTimeout(1500); await p.keyboard.press("ArrowRight");
  await p.waitForSelector(".pr-rrow", {timeout: 15000}); await p.waitForTimeout(300);
  ok(/slides 2 to 3/.test(await p.textContent(".pr-eyebrow")) && await p.locator(".pr-rrow").count() === 2, "the section run ends after its last slide and shows on its own");
  await p.click('[data-act="pr-hist"]'); await p.waitForSelector(".pr-hlist li"); await p.waitForTimeout(300);
  ok(await p.locator(".pr-hlist li").count() === 2 && /Slides 2–3/.test(await p.textContent(".pr-hlist")), "History tells whole talks and sections apart");
  await p.screenshot({path: OUT + "-history.png"});
  // the phone remote: a QR code, and the phone page
  await p.click('#prStage [data-act="pr-practice"]'); await p.waitForSelector("#prStage .pr-play"); await p.waitForTimeout(300);
  await p.click('.pr-card [data-act="pr-remote"]'); await p.waitForSelector(".pr-rm-qr svg", {timeout: 15000});
  ok(true, "the remote panel shows a QR code");
  await p.screenshot({path: OUT + "-remote.png"});
  const ph = await ctx.newPage(); await ph.setViewportSize({width: 390, height: 844});
  await ph.goto("http://127.0.0.1:" + port + "/present-remote.html#bad");
  ok(/scanning the QR code/.test(await ph.textContent("#msg")), "the phone page explains itself without a code");
  ok(!errs.length, "no page errors: " + errs.join(" | "));
  console.log("present-plus.e2e: done" + (process.exitCode ? " with failures" : ", all passed"));
  await b.close(); server.close();
})();
