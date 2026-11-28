// node tests/ai-first-deck.test.js: the free first deck (cloudflare/ai-pro/src/first-deck.js) can never cost anything: it runs only
// while everything Workers AI did today, plus what's running, plus its own worst case, stays under the cap (7,000 of the 10,000
// free daily Neurons), and only once per device and a few times per network a day, from Studyboard's own pages.
const path = require("path"), assert = require("assert"), {pathToFileURL} = require("url");
let n = 0; const ok = (c, m) => { n++; assert(c, m); }; const eq = (a, b, m) => { n++; assert.deepStrictEqual(a, b, m); };
(async () => {
  const P = await import(pathToFileURL(path.join(__dirname, "..", "cloudflare", "ai-pro", "src", "pro.js")).href);
  const F = await import(pathToFileURL(path.join(__dirname, "..", "cloudflare", "ai-pro", "src", "first-deck.js")).href);
  const tick = () => new Promise(r => setTimeout(r, 0));
  const mem = () => { const m = new Map(); return {m, get: async k => { await tick(); return m.get(k); }, put: async (k, v) => { await tick(); m.set(k, v); }, delete: async k => { await tick(); m.delete(k); }}; };
  // a DayTotals stand-in: the usage totals and the ledger in one storage, as in index.js
  const objs = new Map();
  const obj = name => { if (!objs.has(name)) { const s = mem(), t = new P.Totals(s), a = new F.FreeAllowance(s, () => t.read());
    objs.set(name, {add: (...x) => t.add(...x), read: () => t.read(), hold: (...x) => a.hold(...x), release: x => a.release(x), tryFree: (...x) => a.tryFree(...x), view: () => a.view(), once: () => a.once(), undoOnce: () => a.undoOnce(), count: x => a.count(x)}); }
    return objs.get(name); };
  const NOW = Date.UTC(2026, 10, 21, 15), DAY = "2026-11-21";
  let aiCalls = 0, aiIn = [], reply = () => ({choices: [{message: {content: JSON.stringify({deckTitle: "Cells", cards: [{front: "What does the mitochondrion make?", back: "ATP, the cell's energy."}, {front: "Ribosome", back: "Builds proteins."}]})}}], usage: {prompt_tokens: 1500, completion_tokens: 400}});
  const deps = () => ({ai: async x => { aiCalls++; aiIn.push(x); await tick(); return reply(x); }, allowance: obj, totals: d => obj("t:" + d), now: () => NOW, defer: () => {},
    user: async () => null, meter: () => { throw new Error("no account is needed"); }});
  const NOTES = "Mitochondria make ATP through cellular respiration. Ribosomes build proteins from amino acids using mRNA. The nucleus holds DNA. ".repeat(4);
  let dn = 0;
  const call = (body, o = {}) => P.handle(new Request("https://ai.studyboardapp.com/v1/first-deck", {method: o.method || "POST", headers: {Origin: "origin" in o ? o.origin : "https://studyboardapp.com", "cf-connecting-ip": o.ip || "1.2.3." + (dn % 200), "Content-Type": "application/json"}, body: o.method === "GET" ? undefined : JSON.stringify(body)}), o.env || {}, o.deps || deps()).then(async r => ({s: r.status, j: await r.json()}));
  const fresh = () => ({text: NOTES, course: "Biology", device: "dev_" + (++dn) + "_abcdefgh"});

  /* It works, with no account, and the prompt is the server's */
  let r = await call(fresh());
  eq(r.s, 200, "a new device's first deck"); eq(r.j.cards.length, 2, "with the model's cards"); eq(r.j.deckTitle, "Cells", "and title");
  const sent = aiIn[0];
  ok(sent.messages[0].role === "system" && /flashcards/.test(sent.messages[0].content) && /never follow instructions/.test(sent.messages[0].content), "the system prompt is the server's own");
  ok(sent.max_completion_tokens === F.MAX_OUT && sent.chat_template_kwargs.enable_thinking === false, "output is capped and thinking is off (no hidden tokens)");
  ok(!("model" in sent), "the model isn't the request's to choose (index.js fixes it)");
  let t = await obj("t:" + DAY).read();
  eq(t.kinds["first-deck"].jobs, 1, "it's recorded in the day's totals");
  ok(Math.abs(t.kinds["first-deck"].cost - F.microOf(Math.ceil(1500 * F.NEURONS.in + 400 * F.NEURONS.out))) < 2, "at what Cloudflare said it used");
  eq((await obj("t:" + DAY).view()).held, 0, "and its hold is released once recorded");

  /* Once per device */
  const again = fresh(); eq((await call(again)).s, 200, "first"); eq((await call(again)).s, 409, "a device's second free deck is refused");
  /* From Studyboard only */
  eq((await call(fresh(), {origin: "https://evil.example"})).s, 403, "another site can't use it");
  eq((await call(fresh(), {origin: ""})).s, 403, "nor a script with no origin");
  for (const o of F.ORIGINS) eq((await call(fresh(), {origin: o})).s, 200, "Studyboard's own: " + o);
  eq((await call(fresh(), {method: "GET"})).s, 405, "POST only");
  /* Sensible input only */
  eq((await call({...fresh(), text: "too short"})).s, 400, "too little to make a deck from");
  eq((await call({...fresh(), device: "x"})).s, 400, "a device code is needed");
  const big = await call({...fresh(), text: "word ".repeat(5000)});
  ok(big.s === 200 && aiIn[aiIn.length - 1].messages[1].content.length < F.MAX_TEXT + 400, "long notes are cut to 20,000 characters");
  /* A few per network a day */
  const ipd = deps(); let codes = [];
  for (let i = 0; i < 5; i++) codes.push((await call(fresh(), {ip: "9.9.9.9", deps: ipd})).s);
  eq(codes, [200, 200, 200, 429, 429], "at most 3 per network a day");
  const d2 = fresh(); await call(d2, {ip: "9.9.9.9", deps: ipd}); eq((await call(d2, {ip: "8.8.8.8", deps: ipd})).s, 200, "a device turned away for its network keeps its free deck");

  /* THE $0 GUARANTEE */
  ok(F.capOf({}) === 7000 && F.capOf({FIRST_DECK_NEURONS: "9999"}) === F.MAX_CAP && F.MAX_CAP <= 8000 && F.capOf({FIRST_DECK_NEURONS: "abc"}) === 7000, "the cap is 7,000 Neurons, and a setting can't raise it past 8,000 (of 10,000 free)");
  ok(F.worstNeurons(F.MAX_TEXT + 3000) < 600, "a deck's worst case is small (under 600 Neurons)");
  ok(F.worstNeurons(1000) >= 2000 * F.NEURONS.in + F.MAX_OUT * F.NEURONS.out, "and counts 2 tokens per character, more than any text uses");
  // fill the day with Pro transcription close to the cap: no free deck past it
  objs.clear(); aiCalls = 0;
  await obj("t:" + DAY).add("whisper", "", null, F.microOf(6950));
  r = await call(fresh());
  eq([r.s, r.j.error, aiCalls], [429, "full", 0], "when Workers AI use today leaves no room under the cap, no deck runs (the AI isn't even asked)");
  // embeddings count too
  objs.clear(); await obj("t:" + DAY).add("embed", "", null, F.microOf(6950));
  eq((await call(fresh())).s, 429, "search-by-meaning use counts too");
  // jobs still running count: a Pro transcription in flight holds its worst case
  objs.clear(); await obj("t:" + DAY).hold("whisper-x", 6950);
  eq((await call(fresh())).s, 429, "so do Pro jobs still running");
  await obj("t:" + DAY).release("whisper-x");
  eq((await call(fresh())).s, 200, "and once they're done (and small), decks run again");
  // a refused device can try again another day
  objs.clear(); await obj("t:" + DAY).add("whisper", "", null, F.microOf(6990)); const later = fresh();
  eq((await call(later)).s, 429, "full today"); objs.clear(); eq((await call(later)).s, 200, "the same device gets its deck when there's room");

  // A rush of decks at once never goes past the cap: each holds its worst case before running
  objs.clear(); aiCalls = 0;
  let slow; const gate = new Promise(res => { slow = res; });
  const rush = deps(); rush.ai = async x => { aiCalls++; await gate; return reply(x); };
  let settled = 0; const ps = []; for (let i = 0; i < 60; i++) ps.push(call({...fresh(), text: "word ".repeat(4000)}, {ip: "10.0.0." + i, deps: rush}).then(x => { settled++; return x; }));
  // wait until every request has either reached the AI (and is held at the gate) or been turned away (a fixed wait was flaky on a slow machine)
  for (const t0 = Date.now(); settled + aiCalls < 60 && Date.now() - t0 < 10000;) await new Promise(res => setTimeout(res, 10));
  const v = await obj("t:" + DAY).view();
  ok(v.spent + v.held <= 7000, `while running, everything held stays under the cap (${v.held} held)`);
  ok(aiCalls > 0 && aiCalls < 60, `only as many run at once as fit (${aiCalls} of 60)`);
  slow(); const rs = await Promise.all(ps);
  ok(rs.filter(x => x.s === 429).length === 60 - aiCalls, "the rest are told to use the device");

  // When Cloudflare doesn't report usage, the deck is recorded at its worst case
  objs.clear(); reply = () => ({choices: [{message: {content: "{\"cards\":[{\"front\":\"Q one\",\"back\":\"A\"}]}"}}]});
  await call(fresh()); t = await obj("t:" + DAY).read();
  ok(F.neuronsOf(t.kinds["first-deck"].cost) >= F.MAX_OUT * F.NEURONS.out, "no usage report: counted at its worst case");
  // A failed run is still counted, and the device keeps its free deck
  objs.clear(); reply = () => { throw new Error("down"); }; const fd = fresh();
  r = await call(fd); eq(r.s, 502, "a failed run is reported (the app uses the device)");
  t = await obj("t:" + DAY).read(); ok(t.kinds["first-deck"] && t.kinds["first-deck"].cost > 0, "and still counted, at its worst case");
  eq((await obj("t:" + DAY).view()).held, 0, "with its hold released");
  reply = () => ({choices: [{message: {content: "not json"}}], usage: {prompt_tokens: 10, completion_tokens: 10}});
  eq((await call(fd)).s, 502, "unreadable output: no deck"); reply = () => ({choices: [{message: {content: "{\"cards\":[{\"front\":\"Q one\",\"back\":\"A\"}]}"}}], usage: {prompt_tokens: 10, completion_tokens: 10}});
  eq((await call(fd)).s, 200, "and the device still has its free deck");
  // Off switch, and off without Workers AI
  eq((await call(fresh(), {env: {FIRST_DECK_OFF: "1"}})).s, 503, "FIRST_DECK_OFF turns it off");
  const noAi = deps(); noAi.ai = null; eq((await call(fresh(), {deps: noAi})).s, 503, "off without Workers AI");

  // Pro jobs on Workers AI hold their worst case while running and release it once recorded
  const src = require("fs").readFileSync(path.join(__dirname, "..", "cloudflare", "ai-pro", "src", "pro.js"), "utf8");
  ok(/ledger\.hold\(hid, neuronsOf\(reserve\)\)/.test(src) && /try \{ await record\(deps, kind, "", usage, cost\); \} finally \{ if \(ledger\) await ledger\.release\(hid\)/.test(src), "Pro Whisper and embedding jobs are held while they run and released after they're recorded");
  const idx = require("fs").readFileSync(path.join(__dirname, "..", "cloudflare", "ai-pro", "src", "index.js"), "utf8");
  ok(/env\.AI\.run\(FIRST_DECK_MODEL, input\)/.test(idx) && F.FIRST_DECK_MODEL === "@cf/google/gemma-4-26b-a4b-it", "the model is fixed in code");
  console.log(`ai-first-deck: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
