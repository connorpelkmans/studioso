// node tests/ai-device.e2e.js: AI on the student's own device, with nothing to set up (01-ai-device.js). Chrome's built-in model
// (window.LanguageModel) is stood in for here, so these check Studyboard's side: when it's used, what it's sent, the one-time
// download, fitting a small context, and the extra quality steps for small models (examples, the sentence each card comes from,
// a checking pass, the model taking its own quiz). They can't judge the real model's writing: that needs real Chrome.
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

// The stand-in for Chrome's model. It records every session and prompt, answers one at a time (and notes any overlap), and writes:
// cards with one made-up "basis" sentence; a checking pass that fixes card 2; a quiz whose second answer key it then disagrees with
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
            await new Promise(r => setTimeout(r, 30));
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
  const open = async ({status = "available", ctx: cw, key, optIn = true, had} = {}) => {
    const ctx = await b.newContext({viewport: {width: 1100, height: 900}, serviceWorkers: "block"}), net = [];
    await ctx.route(/generativelanguage\.googleapis\.com|anthropic|openai/, r => { net.push(r.request().url()); r.abort(); });
    await ctx.addInitScript(([o, fake]) => { window.__SB_TEST = true; if (o.optIn) window.__SB_DEVICE_AI_TEST = true; (0, eval)(`(${fake})`)(o);
      localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:whatsNew", JSON.stringify({v: "1.15.8"}));
      localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, tasks: [], files: [], notes: [], events: [], decks: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO 110", color: "#3B6FE0"}]}));
      if (o.had) localStorage.setItem("studyboard:devAIHad", "2026-11-01");
      if (o.key) { localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } },
      [{status, ctx: cw, key, optIn, had}, fakeChrome.toString()]);
    const p = await ctx.newPage(); p.errs = []; p.on("pageerror", e => p.errs.push(e.message));
    await p.goto(`http://127.0.0.1:${port}/index.html`); await p.waitForFunction(() => window.__sbSync && window.__sbDevAI, null, {timeout: 20000}); await p.waitForTimeout(400);
    return {ctx, p, net};
  };
  const makeSet = async (p, {paste, quiz}) => {
    await p.evaluate(() => { const S = window.__sbSync; S.ui.filter = "c1"; S.ui.tab = "flashcards"; S.render(); const x = document.createElement("button"); x.dataset.act = "fc-ai"; document.body.appendChild(x); x.click(); x.remove(); });
    await p.waitForSelector("#dlg[open] #aiGo");
    await p.evaluate(t => { const d = document.querySelector("#dlg details"); if (d) d.open = true; const a = document.querySelector("#aiPaste"); a.value = t; a.dispatchEvent(new Event("input", {bubbles: true})); }, paste);
    await p.evaluate(want => { const q = document.querySelector("#aiQuiz"); if (q && q.checked !== want) q.click(); }, quiz);
    await p.click("#aiGo");
    // the one-time question before Chrome's download (only when it still has to download and wasn't agreed to before)
    const askEl = await p.waitForSelector("dialog.dev-ai-ask[open]", {timeout: 1500}).catch(() => null);
    if (askEl) { p.lastAsk = await askEl.innerText(); await p.click("dialog.dev-ai-ask[open] [data-yes]"); }
    // the set opens in its deck and fills in there; the bar says when it's done (or a toast says why it failed)
    await p.waitForSelector(".ai-live-bar.done, #toast.show.toast-err", {timeout: 30000}).catch(() => {});
    return p.evaluate(() => { const d = Object.values(window.__sbSync.state.decks).sort((a, b) => (b.updated || 0) - (a.updated || 0))[0] || {cards: [], aiQuizzes: []};
      return {cards: d.cards.map(c => ({front: c.front, back: c.back, text: c.front + "\n" + c.back + (c.src ? "\n" + c.src : "") + (c.check ? "\nCheck: " + c.check : "")})),
        qs: (d.aiQuizzes || []).reduce((n, q) => n + (q.questions || []).length, 0), all: ((document.querySelector(".ai-live-bar") || {}).innerText || "") + "\n" + ((document.querySelector("#toast.show") || {}).innerText || ""), log: window.__devLog}; });
  };

  // 1. No key, Chrome has its model: it's used, with no setup and no consent question
  { const R = await open();
    const c = await R.p.evaluate(() => { const c = window.__sbDevAI.cfg(); return {provider: c.provider, model: c.model, key: c.key}; });
    ok(c.provider === "device" && c.model === "chrome" && c.key === "device", "no key: the AI built into Chrome is the engine: " + JSON.stringify(c));
    await R.p.evaluate(() => { const x = document.createElement("button"); x.dataset.act = "ai-setup"; document.body.appendChild(x); x.click(); x.remove(); });
    await R.p.waitForTimeout(300);
    const sheet = await R.p.evaluate(() => (document.querySelector("dialog[open]") || {}).innerText || "");
    ok(/AI is ready on this computer, no setup needed/.test(sheet) && /Chrome's built-in AI \(Google's Gemini Nano\) runs right here/.test(sheet), "AI Features says it's ready, with nothing to set up");
    ok(!/Set up AI first/.test(sheet), "and doesn't ask for setup");
    await R.p.screenshot({path: path.join(SHOTS, "device-ai-setup.png")});
    await R.p.evaluate(() => document.querySelector("dialog[open]").close());
    const r = await R.p.evaluate(async () => { const x = await window.__sbDevAI.call({system: "Say ok.", parts: [{text: "Hello"}], schema: {type: "OBJECT", properties: {answer: {type: "STRING"}}}}); return {data: x.data, provider: x.provider}; });
    ok(r.provider === "device" && r.data.answer === "ok", "an AI request is answered on the device");
    ok(!(await R.p.$("dialog.ai-consent[open]")), "no 'send your content' question: nothing leaves the device");
    const sch = await R.p.evaluate(() => window.__devLog.prompts[0].schema);
    ok(/"type":"object"/.test(sch) && /"answer"/.test(sch), "the answer's shape is enforced with Chrome's responseConstraint (as JSON Schema)");
    ok(await R.p.evaluate(() => /suitable for a school student/.test(window.__devLog.creates[0].system)), "the instructions keep it suitable for a school student");
    const web = await R.p.evaluate(async () => { try { await window.__sbDevAI.call({system: "x", parts: [{text: "y"}], search: true}); return ""; } catch (e) { return e.code + ": " + e.message; } });
    ok(/^device-web/.test(web) && /couldn't find anything on the web/.test(web), "a web lookup that finds nothing says so plainly (no made-up answer): " + web);
    const pdf = await R.p.evaluate(async () => { try { await window.__sbDevAI.call({system: "x", parts: [{inline_data: {mime_type: "application/pdf", data: "JVBERg=="}}]}); return ""; } catch (e) { return e.code; } });
    ok(pdf === "device-files", "a file it can't read is turned down with a clear reason");
    ok(!R.net.length, "nothing went to any AI company: " + R.net.join(", "));
    ok(!R.p.errs.length, "no page errors: " + R.p.errs.join(" | "));
    await R.ctx.close(); }

  // 2. A study set from long notes: short sections, examples, the source sentence, a checking pass, the model taking its own quiz
  { const R = await open(), out = await makeSet(R.p, {paste: NOTES, quiz: true});
    const cardP = out.log.prompts.filter(x => /"basis"/.test(x.schema)), checks = out.log.prompts.filter(x => /strict, fair teacher/.test(x.system)), solve = out.log.prompts.filter(x => /careful student/.test(x.system));
    ok(cardP.length >= 3, "cards are written part by part: " + cardP.length + " parts");
    ok(cardP.every(x => /Example\. Notes:/.test(x.system) && /Bad cards/.test(x.system)), "every card request carries worked examples, good and bad");
    ok(cardP.every(x => /^You make flashcards from a student's notes/.test(x.system) && !/Exam Style|professor's format/.test(x.system + x.text)), "small models get their own short instructions, not the cloud models' long ones");
    ok(cardP.every(x => (x.text.match(/point \d+ explains/g) || []).length <= 20), "each request holds one short part of the notes");
    ok(checks.length === 0, "no separate checking pass (on the stand-in model it called good cards bad, and cost a third of the time)");
    ok(solve.length >= 3, "the model takes its own quiz for every part: " + solve.length);
    ok(out.log.overlap === 0, "one request at a time (the model answers one thing at a time anyway)");
    ok(!out.cards.some(c => /purple/i.test(c.text)), "a card based on a sentence that isn't in the notes never reaches the student");
    ok(/didn't hold up when checked against your material/.test(out.all), "the review says what was left out");
    ok(/question.? whose answer didn't hold up/.test(out.all), "and which quiz questions were left out because the model's own answer disagreed");
    ok(out.qs >= 3, "the quiz keeps the questions that held up: " + out.qs);
    ok(!/basis/.test(JSON.stringify(out.cards)), "the source sentence is used for checking only, never shown on a card");
    await R.p.screenshot({path: path.join(SHOTS, "device-ai-review.png")});
    ok(!R.net.length && !R.p.errs.length, "nothing sent anywhere, no page errors: " + R.p.errs.join(" | "));
    await R.ctx.close(); }

  // 3. First use: Chrome must download its model, which it allows only from a click. The click on an AI button starts it, and the
  //    request waits for it, showing progress
  { const R = await open({status: "downloadable"});
    ok(await R.p.evaluate(() => window.__sbDevAI.cfg().provider === "device"), "a model that still has to download counts as ready (it downloads on first use)");
    const out = await makeSet(R.p, {paste: "Glycolysis splits glucose into two pyruvate in the cytoplasm and makes a little ATP and NADH. It happens in every cell and needs no oxygen at all.", quiz: false});
    const first = out.log.creates[0] || {};
    ok(/Turn On Free AI\?/.test(R.p.lastAsk || "") && /Google's AI built into Chrome/.test(R.p.lastAsk) && /downloads it once, in the background/.test(R.p.lastAsk) && R.p.lastAsk.length < 320, "first, a short question that names Google's AI in Chrome: " + (R.p.lastAsk || "").replace(/\n/g, " "));
    ok(first.monitor && first.activation, "Turn On starts the download (from that tap), with a progress monitor");
    ok(await R.p.evaluate(() => window.__sbDevAI.state.status === "available"), "and then the model is ready");
    ok(out.cards.length >= 1, "the cards come back once it's ready: " + out.cards.length + " " + out.all.slice(0, 300));
    ok(!R.p.errs.length, "no page errors: " + R.p.errs.join(" | "));
    await R.ctx.close(); }

  // 3b. Not Now: nothing downloads, and the student is told how to turn it on later; asked again next time
  { const R = await open({status: "downloadable"});
    await R.p.evaluate(() => { const S = window.__sbSync; S.ui.filter = "c1"; S.ui.tab = "flashcards"; S.render(); const x = document.createElement("button"); x.dataset.act = "fc-ai"; document.body.appendChild(x); x.click(); x.remove(); });
    await R.p.waitForSelector("#dlg[open] #aiGo");
    await R.p.evaluate(t => { const d = document.querySelector("#dlg details"); if (d) d.open = true; const a = document.querySelector("#aiPaste"); a.value = t; a.dispatchEvent(new Event("input", {bubbles: true})); }, "Glycolysis splits glucose into two pyruvate in the cytoplasm and makes a little ATP and NADH.");
    await R.p.click("#aiGo"); await R.p.waitForSelector("dialog.dev-ai-ask[open]", {timeout: 3000}); await R.p.click("dialog.dev-ai-ask[open] [data-no]"); await R.p.waitForTimeout(500);
    const st = await R.p.evaluate(() => ({creates: window.__devLog.creates.length, status: (document.querySelector("#aiStatus") || {}).textContent || ""}));
    ok(st.creates === 0 && /wasn't turned on/.test(st.status), "Not Now: nothing downloads, and it says how to turn it on later: " + st.status);
    await R.ctx.close(); }

  // 4. A small context: long material is cut to fit, never sent over the limit
  { const R = await open({ctx: 1400});
    const r = await R.p.evaluate(async t => { const x = await window.__sbDevAI.call({system: "Summarize.", parts: [{text: t}], schema: {type: "OBJECT", properties: {answer: {type: "STRING"}}}}); return {truncated: x.truncated, len: window.__devLog.prompts[0].text.length}; }, NOTES.repeat(3));
    ok(r.truncated && r.len < NOTES.length, `long material is shortened to fit the model's context (${r.len} of ${NOTES.length * 3} characters) and marked as cut`);
    ok(await R.p.evaluate(() => /the rest was left out to fit/.test(window.__devLog.prompts[0].text)), "the model is told the rest was left out");
    await R.ctx.close(); }

  // 5. A student with their own key keeps using it; and in tests the device AI is off unless asked for (other tests stay as they were)
  { const R = await open({key: true});
    ok(await R.p.evaluate(() => window.__sbDevAI.cfg().provider === "gemini"), "with a key of their own, their key is used, not the device");
    await R.ctx.close();
    const R2 = await open({optIn: false});
    ok(await R2.p.evaluate(() => window.__sbDevAI.cfg().provider !== "device"), "test runs without the opt-in never use it");
    await R2.ctx.close(); }

  // 6. The iPhone app: Apple's on-device model through the StudyboardOnDeviceAI plugin (stood in for here). The page sends a
  //    complete request with the schema's field order spelled out, and retries shorter when the model's context is full
  { const ctx = await b.newContext({viewport: {width: 390, height: 844}, serviceWorkers: "block"});
    await ctx.addInitScript(() => { window.__SB_TEST = true; window.__SB_DEVICE_AI_TEST = true;
      const log = window.__appleLog = {calls: []}; let full = true;
      const plugin = {availability: async () => ({status: "available", contextSize: 4096, images: false}),
        generate: async o => { log.calls.push(o); if (full && o.prompt.length > 3000) { full = false; throw Object.assign(new Error("context"), {code: "context"}); } return {json: JSON.stringify({answer: "from Apple", n: o.prompt.length})}; }};
      window.Capacitor = {isNativePlatform: () => true, getPlatform: () => "ios", isPluginAvailable: n => n === "StudyboardOnDeviceAI", Plugins: {StudyboardOnDeviceAI: plugin}, registerPlugin: () => ({})};
      localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:whatsNew", JSON.stringify({v: "1.15.8"})); });
    const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
    await p.goto(`http://127.0.0.1:${port}/index.html`); await p.waitForFunction(() => window.__sbDevAI, null, {timeout: 20000}); await p.waitForTimeout(500);
    const c = await p.evaluate(() => { const c = window.__sbDevAI.cfg(); return c.provider + "/" + c.model; });
    ok(c === "device/apple", "in the iPhone app with no key, Apple's on-device model is the engine: " + c);
    const r = await p.evaluate(async t => { const x = await window.__sbDevAI.call({system: "Make cards.", parts: [{text: t}], schema: {type: "OBJECT", properties: {cards: {type: "ARRAY", items: {type: "OBJECT", properties: {basis: {type: "STRING"}, front: {type: "STRING"}, back: {type: "STRING"}}}}}}}); return {data: x.data, truncated: x.truncated, calls: window.__appleLog.calls}; }, NOTES);
    ok(r.data.answer === "from Apple", "the answer comes back from the plugin");
    const first = r.calls[0] || {};
    ok(JSON.stringify(first.schema.properties.cards.items.propertyOrder) === '["basis","front","back"]', "the field order is spelled out for Swift: " + JSON.stringify((first.schema.properties.cards.items || {}).propertyOrder));
    ok(first.schema.type === "object" && /suitable for a school student/.test(first.system), "JSON Schema in lowercase, and the same instructions as on Chrome");
    ok(r.calls.length === 2 && r.calls[1].prompt.length < r.calls[0].prompt.length && r.truncated, `a full context is retried shorter (${r.calls[0].prompt.length} then ${r.calls[1].prompt.length} characters)`);
    ok(first.prompt.length < 4096 * 3.3, "the request is cut to fit Apple's context to begin with: " + first.prompt.length);
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    await ctx.close(); }

  // 7. Telling the student why Chrome's built-in AI isn't there: removed to free disk space (it downloads again on next use, or can't
  //    until there's room), or this computer can't run it
  const sheetText = async p => { await p.evaluate(() => { const x = document.createElement("button"); x.dataset.act = "ai-setup"; document.body.appendChild(x); x.click(); x.remove(); }); await p.waitForTimeout(300); const t = await p.evaluate(() => (document.querySelector("dialog[open]") || {}).innerText || ""); await p.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close())); return t; };
  const toastText = p => p.evaluate(() => [...document.querySelectorAll(".toast, [role=status], .tst")].map(x => x.innerText).join(" | "));
  { const R = await open({status: "available"});
    ok(await R.p.evaluate(() => !!localStorage.getItem("studyboard:devAIHad")), "when it's ready, Studyboard remembers it was");
    await R.ctx.close(); }
  { const R = await open({status: "downloadable", had: true}); await R.p.waitForTimeout(600);
    ok(/removed its built-in AI from this computer to free up disk space\. It downloads again/.test(await toastText(R.p)), "it was ready and Chrome removed it: the student is told once, and that it downloads again");
    ok(await R.p.evaluate(() => window.__sbDevAI.cfg().provider === "device"), "and it still counts as there (it downloads on the next AI use)");
    ok(/removed its built-in AI .* to free up disk space/.test(await sheetText(R.p)), "AI Features says so too");
    const out = await makeSet(R.p, {paste: "Glycolysis splits glucose into two pyruvate in the cytoplasm and makes a little ATP and NADH. It happens in every cell and needs no oxygen at all.", quiz: false});
    ok(out.cards.length >= 1, "the next AI use downloads it again and works: " + out.cards.length);
    await R.ctx.close(); }
  { const R = await open({status: "downloadable", had: true}); await R.p.waitForTimeout(600);
    await R.p.reload(); await R.p.waitForFunction(() => window.__sbDevAI, null, {timeout: 20000}); await R.p.waitForTimeout(800);
    ok(!/removed its built-in AI/.test(await toastText(R.p)), "the note isn't repeated on the next visit");
    await R.ctx.close(); }
  { const R = await open({status: "unavailable", had: true}); await R.p.waitForTimeout(600);
    ok(/can't download it again until at least 22 GB is free/.test(await toastText(R.p)), "removed and no room to download it again: said, with the space it needs");
    ok(await R.p.evaluate(() => window.__sbDevAI.cfg().provider !== "device"), "and it's not offered");
    await R.ctx.close(); }
  { const R = await open({status: "unavailable"}); await R.p.waitForTimeout(600);
    ok(!/Chrome/.test(await toastText(R.p)), "a computer that never could run it gets no pop-up");
    ok(/This computer can't run Chrome's built-in AI: it needs 22 GB of free disk space and a graphics card with more than 4 GB of memory, or 16 GB of RAM/.test(await sheetText(R.p)), "but AI Features says why, and that a free key still works");
    await R.ctx.close(); }

  await b.close(); server.close();
  console.log(fails ? `ai-device.e2e: ${fails} of ${n} FAILED` : `ai-device.e2e: ${n} checks passed`);
  process.exitCode = fails ? 1 : 0;
})().catch(e => { console.error(e); process.exit(1); });
