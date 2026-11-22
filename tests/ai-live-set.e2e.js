// node tests/ai-live-set.e2e.js: Create with AI opens the deck (or quiz) at once and fills it in as each part is written; Stop keeps
// what's made. Chrome's model is stood in for (the same stand-in as ai-device.e2e.js, a little slower so the parts can be seen arrive).
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, ".."), SHOTS = path.join(ROOT, "tests-out");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".webp": "image/webp", ".wasm": "application/wasm"};
const server = http.createServer((req, res) => {
  let f; try { f = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
const TOPICS = [["Glycolysis", "glucose pyruvate cytoplasm"], ["Krebs Cycle", "citrate oxaloacetate matrix"], ["Electron Transport Chain", "cristae oxygen gradient"]];
const body = (topic, keys) => Array.from({length: 20}, (_, i) => `${topic} point ${i + 1} explains how ${keys.split(" ")[i % 3]} matters in cellular respiration and why students should understand this step for the exam.`).join(" ");
const NOTES = TOPICS.map(([t, k]) => `## ${t}\n${body(t, k)}`).join("\n\n");

function fakeChrome(opts){
  const log = window.__devLog = {creates: [], prompts: [], overlap: 0, busy: 0};
  let status = opts.status;
  window.LanguageModel = {
    availability: async () => status,
    create: async o => {
      log.creates.push({system: ((o.initialPrompts || [])[0] || {}).content || "", activation: !!(navigator.userActivation && navigator.userActivation.isActive), monitor: !!o.monitor});
      if (status !== "available") { const m = new EventTarget(); if (o.monitor) o.monitor(m); for (const x of [0.25, 0.5, 1]) { await new Promise(r => setTimeout(r, 120)); const e = new Event("downloadprogress"); e.loaded = x; m.dispatchEvent(e); } status = "available"; }
      const system = ((o.initialPrompts || [])[0] || {}).content || "";
      return {contextWindow: opts.ctx || 6000, contextUsage: Math.ceil(system.length / 4), destroy(){},
        async prompt(input, po){
          if (log.busy) log.overlap++; log.busy++;
          try {
            await new Promise(r => setTimeout(r, opts.delay || 30));
            const text = input.map(m => m.content.map(c => c.value).join("\n")).join("\n"), sch = JSON.stringify(po.responseConstraint || {});
            log.prompts.push({system, text, schema: sch});
            const topic = (/Notes \(([^)\n]*)\):/.exec(text) || /Part \d+ of \d+ of the material: ([^\n]*)/.exec(text) || [])[1] || "notes";
            const first = ((/((?:Glycolysis|Krebs Cycle|Electron Transport Chain) point \d+ explains[^.]*\.)/.exec(text) || /(Glycolysis splits[^.]*\.)/.exec(text) || [])[1] || "").trim();
            if (/strict, fair teacher/.test(system)) return JSON.stringify({checks: [{n: 1, verdict: "keep"}, {n: 2, verdict: "fix", back: `It is where ${topic.split(" › ").pop()} turns its inputs into energy carriers.`}]});
            if (/careful student taking a quiz/.test(system)) return JSON.stringify({answers: [{n: 1, letters: ["A"]}, {n: 2, letters: ["C"]}]});
            if (/practice question/.test(text)) { const t = topic.split(" › ").pop(); return JSON.stringify({title: "Quiz", questions: [0, 1].map(k => ({type: "single", stem: `In ${t}, which statement ${k ? "best describes the main step" : "is true about where it happens"}?`, options: ["Choice one about " + t, "Choice two", "Choice three", "Choice four"], correct: [0], rationale: `The ${t} part says so.`}))}); }
            if (/"basis"/.test(sch)) { const t = topic.split(" › ").pop(); return JSON.stringify({deckTitle: "Respiration", cards: [
              {basis: first, front: `Why does ${t} matter for the exam?`, back: `It is a step of cellular respiration that students need to understand.`},
              {basis: first, front: `What does ${t} do?`, back: `Something vague.`},
              {basis: "Mitochondria are tiny purple bananas that sing.", front: `What colour are the parts of ${t}?`, back: "Purple."}]}); }
            return JSON.stringify({answer: "ok", len: text.length});
          } finally { log.busy--; }
        }};
    }};
}


(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const port = server.address().port, b = await chromium.launch({executablePath});
  const open = async (delay) => {
    const ctx = await b.newContext({viewport: {width: 1100, height: 900}, serviceWorkers: "block"});
    await ctx.route(/generativelanguage\.googleapis\.com|anthropic|openai|studyboardapp/, r => r.abort());
    await ctx.addInitScript(([o, fake]) => { window.__SB_TEST = true; window.__SB_DEVICE_AI_TEST = true; (0, eval)(`(${fake})`)(o);
      localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:whatsNew", JSON.stringify({v: "9.9.9"}));
      localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, tasks: [], files: [], notes: [], events: [], decks: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO 110", color: "#3B6FE0"}]})); },
      [{status: "available", delay}, fakeChrome.toString()]);
    const p = await ctx.newPage(); p.errs = []; p.on("pageerror", e => p.errs.push(e.message));
    await p.goto(`http://127.0.0.1:${port}/index.html`); await p.waitForFunction(() => window.__sbSync && window.__sbDevAI, null, {timeout: 20000}); await p.waitForTimeout(400);
    return {ctx, p};
  };
  const start = async (p, {cards = true, quiz}) => {
    await p.evaluate(() => { const S = window.__sbSync; S.ui.filter = "c1"; S.ui.tab = "flashcards"; S.render(); const x = document.createElement("button"); x.dataset.act = "fc-ai"; document.body.appendChild(x); x.click(); x.remove(); });
    await p.waitForSelector("#dlg[open] #aiGo");
    await p.evaluate(t => { const d = document.querySelector("#dlg details"); if (d) d.open = true; const a = document.querySelector("#aiPaste"); a.value = t; a.dispatchEvent(new Event("input", {bubbles: true})); }, NOTES);
    await p.evaluate(([c, q]) => { const a = document.querySelector("#aiCards"), b = document.querySelector("#aiQuiz"); if (a && a.checked !== c) a.click(); if (b && b.checked !== q) b.click(); }, [cards, quiz]);
    await p.click("#aiGo");
  };
  const watch = p => p.evaluate(() => { window.__counts = []; const t = setInterval(() => { const n = document.querySelectorAll(".fc-row").length, q = document.querySelectorAll(".qzd-q").length, last = window.__counts[window.__counts.length - 1]; if (!last || last[0] !== n || last[1] !== q) window.__counts.push([n, q]); if (document.querySelector(".ai-live-bar.done")) clearInterval(t); }, 50); });

  // 1. Cards and a quiz: the deck opens straight away and fills in part by part
  { const R = await open(400), p = R.p;
    await start(p, {quiz: true});
    await p.waitForTimeout(300);
    const at = await p.evaluate(() => ({dlg: !!document.querySelector("#dlg[open]"), h2: (document.querySelector(".deck-head h2") || {}).textContent || "", bar: (document.querySelector(".ai-live-bar") || {}).innerText || "", rows: document.querySelectorAll(".fc-row").length}));
    ok(!at.dlg && at.h2 && /is writing flashcards and quiz questions/.test(at.bar), "Create closes the sheet and opens the new deck with a working bar: " + JSON.stringify(at));
    await watch(p);
    await p.screenshot({path: path.join(SHOTS, "ai-live-start.png")});
    await p.waitForSelector(".fc-row", {timeout: 30000});
    await p.screenshot({path: path.join(SHOTS, "ai-live-filling.png")});
    await p.waitForSelector(".ai-live-bar.done", {timeout: 90000});
    const counts = await p.evaluate(() => window.__counts), fin = await p.evaluate(() => { const d = Object.values(window.__sbSync.state.decks)[0]; return {cards: d.cards.length, quiz: (d.aiQuizzes[0] || {questions: []}).questions.length, qTitle: (d.aiQuizzes[0] || {}).title, bar: document.querySelector(".ai-live-bar").innerText, check: d.cards.filter(c => c.check).length, purple: d.cards.some(c => /purple/i.test(c.front + c.back))}; });
    const steps = counts.filter(c => c[0] > 0).map(c => c[0]);
    ok(new Set(steps).size >= 2, "cards appeared in more than one step, as parts finished: " + JSON.stringify(counts));
    ok(fin.cards >= 3 && fin.quiz >= 2, "the deck ends with its cards and its quiz saved: " + JSON.stringify(fin));
    ok(/^Done: \d+ flashcards? and \d+ quiz questions?\./.test(fin.bar), "the bar says it's done, with what was made: " + fin.bar.replace(/\n/g, " "));
    ok(!fin.purple, "a card the checks throw out never appears");
    ok(await p.evaluate(() => !document.querySelector('.deck-head [data-act="fc-study"][disabled]')), "Study is available on the finished deck");
    await p.screenshot({path: path.join(SHOTS, "ai-live-done.png")});
    await p.click("[data-live-ok]"); await p.waitForTimeout(200);
    ok(!(await p.$(".ai-live-bar")), "the done note can be dismissed");
    ok(!p.errs.length, "no page errors: " + p.errs.join(" | "));
    await R.ctx.close(); }

  // 2. Stop: what's made so far is kept
  { const R = await open(900), p = R.p;
    await start(p, {quiz: false});
    await p.waitForSelector(".fc-row", {timeout: 30000});
    await p.click("[data-live-stop]");
    await p.waitForSelector(".ai-live-bar.done", {timeout: 30000});
    const fin = await p.evaluate(() => { const d = Object.values(window.__sbSync.state.decks)[0]; return {cards: d ? d.cards.length : 0, bar: document.querySelector(".ai-live-bar").innerText}; });
    ok(fin.cards >= 1 && /^Stopped\. Kept \d+ flashcards?\./.test(fin.bar), "Stop keeps the cards made so far: " + JSON.stringify(fin));
    ok(!p.errs.length, "no page errors: " + p.errs.join(" | "));
    await R.ctx.close(); }

  // 3. A quiz on its own: its page opens and the questions appear there
  { const R = await open(400), p = R.p;
    await start(p, {cards: false, quiz: true});
    await p.waitForTimeout(300);
    const at = await p.evaluate(() => ({kick: (document.querySelector(".deck-head .g2-kick") || {}).textContent || "", bar: !!document.querySelector(".ai-live-bar")}));
    ok(/Quiz/.test(at.kick) && at.bar, "the quiz's page opens with the working bar: " + JSON.stringify(at));
    await watch(p);
    await p.waitForSelector(".ai-live-bar.done", {timeout: 90000});
    const counts = await p.evaluate(() => window.__counts), nq = await p.evaluate(() => document.querySelectorAll(".qzd-q").length);
    ok(nq >= 2 && new Set(counts.map(c => c[1]).filter(Boolean)).size >= 2, "questions appeared as parts finished: " + JSON.stringify(counts));
    await p.screenshot({path: path.join(SHOTS, "ai-live-quiz.png")});
    ok(!p.errs.length, "no page errors: " + p.errs.join(" | "));
    await R.ctx.close(); }

  // 4. Deleting the deck while it's being made stops the job quietly
  { const R = await open(600), p = R.p;
    await start(p, {quiz: false});
    await p.waitForSelector(".fc-row", {timeout: 30000});
    await p.evaluate(() => { const S = window.__sbSync, id = Object.keys(S.state.decks)[0]; S.applyChanges ? S.applyChanges([{kind: "deck", id, after: null}], "Deleted") : null; });
    await p.waitForTimeout(4000);
    const left = await p.evaluate(() => Object.keys(window.__sbSync.state.decks).length);
    ok(left === 0, "a deck deleted mid-way stays deleted (no batch brings it back): " + left);
    ok(!p.errs.length, "no page errors: " + p.errs.join(" | "));
    await R.ctx.close(); }

  await b.close(); server.close();
  console.log(`\n${n - fails}/${n} passed`); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
