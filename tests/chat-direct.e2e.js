// node tests/chat-direct.e2e.js: requests the chat reads straight from the words, with no AI guessing (a flashcard into a named deck,
// a study group, something to wear by kind), and a follow-up ("be more detailed", "I meant ...") taken as the last question again
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".wasm": "application/wasm"};
const server = http.createServer((req, res) => { let f; try { f = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res); });
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const b = await chromium.launch({executablePath}), ctx = await b.newContext({viewport: {width: 1100, height: 850}, serviceWorkers: "block"});
  await ctx.addInitScript(() => { window.__SB_TEST = true; window.__SB_DEVICE_AI_TEST = true; window.__prompts = [];
    // the model says "add a note" to anything (the mistake a small model makes): the app mustn't follow it where the words don't ask for a note
    window.LanguageModel = {availability: async () => "available", create: async (o) => { try { (window.__creates = window.__creates || []).push(JSON.stringify(o || {})); } catch (e) {} return {contextWindow: 6000, contextUsage: 100, destroy(){}, clone: async function(){ return this; },
      async prompt(t){ window.__prompts.push(String(t).slice(-400)); if (window.__stubIntent) return JSON.stringify(window.__stubIntent); return JSON.stringify({intent: "add_note", text: "WRONG NOTE", board: "", answer: "MODEL ANSWER", found: true, followUps: [], actions: []}); }}; }};
    localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1");
    localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, files: [], notes: [], events: [], settings: {}, courses: [{id: "c1", name: "Reviewer Course", code: "REVC 101", color: "#3B6FE0"}, {id: "c2", name: "OCHEM", code: "CHEM 211", color: "#aa33aa"}],
      decks: [{id: "d1", name: "Connor Pelkmans", cards: [], created: 1}, {id: "d2", name: "Heart", created: 2, cards: [{id: "h1", front: "SA node", back: "natural pacemaker", box: 0, due: "", seen: 0, right: 0, wrong: 0}], aiQuizzes: [{id: "z1", title: "Cardiac Quiz", created: 5, results: [], questions: [{id: "q1", type: "single", stem: "What starts each heartbeat?", options: ["AV node", "SA node"], correct: [1]}, {id: "q2", type: "short", stem: "Name the chamber that pumps to the body", answer: "Left ventricle"}]}]}], tasks: [{id: "t1", title: "Lab 4", courseId: "c2", due: "2020-01-01", status: "todo"}]})); });
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}/index.html`); await p.waitForFunction(() => window.SBCOMPTAB && window.__sbDevAI, null, {timeout: 30000}); await p.waitForTimeout(600);
  await p.evaluate(() => SBCOMPTAB.open()); await p.waitForSelector("#cptIn");
  const chat = async q => { const n0 = await p.evaluate(() => document.querySelectorAll(".cpt-a, .cpt-err").length); await p.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => { if (!d.contains(document.querySelector("#cptIn"))) d.close(); })); await p.fill("#cptIn", q); await p.click("#cptGo");
    await p.waitForFunction(n => document.querySelectorAll(".cpt-a, .cpt-err").length > n && !document.querySelector("#cptGo").disabled && !/Thinking…|Looking|Working/.test([...document.querySelectorAll(".cpt-a, .cpt-err")].pop().innerText), n0, {timeout: 30000}).catch(() => {});
    return p.evaluate(() => { const l = [...document.querySelectorAll(".cpt-a, .cpt-err")].pop(); return l ? l.innerText.split("\n").slice(0, 8).join(" ") : ""; }); };
  const notes = () => p.evaluate(() => JSON.stringify(window.__sbSync.state.notes || {}));

  let a = await chat("Add flashcard with front hi and back hello to deck Connor Pelkmans");
  const cards = await p.evaluate(() => window.__sbSync.state.decks.d1.cards.map(c => c.front + "/" + c.back));
  ok(/Added to Connor Pelkmans/.test(a) && cards.join() === "hi/hello", "a flashcard goes into the deck named: " + a + " " + cards.join());
  a = await chat("Add a card to deck connor pelkmans with front that says hi there and back that says hello there");
  const c2 = await p.evaluate(() => window.__sbSync.state.decks.d1.cards.map(c => c.front + "/" + c.back));
  ok(c2[1] === "hi there/hello there", "the deck named first, front and back after, works too: " + a + " " + c2.join(" | "));
  a = await chat("add a card with front mitosis and back cell division to Biology");
  ok(/don't have a deck called "Biology"/.test(a), "a deck that doesn't exist is said, not made up: " + a);
  a = await chat("Create me a new study group called P3");
  ok(/New Group|Groups need you signed in/.test(a) && !/note/i.test(a) && !/WRONG NOTE/.test(await notes()), "a study group isn't turned into a note: " + a);
  await p.evaluate(() => { const d = document.querySelector("dialog[open]"); if (d) d.close(); }); await p.waitForTimeout(300);
  a = await chat("put a hat on");
  ok(/Tiny Hat|haven't earned a hat|hat/i.test(a) && !/called "nothing"/.test(a), "\"put a hat on\" is about a hat: " + a);
  a = await chat("book me a flight to Paris");
  ok(!/WRONG NOTE/.test(await notes()) && !/I put the note/.test(a), "the AI's \"add a note\" isn't followed when nothing asks for a note: " + a);
  a = await chat("How am I doing in my courses?");
  ok(/CHEM 211/.test(a) && !/^REVC 101 doesn't have/.test(a), "\"how am I doing in my courses\" covers them all: " + a);
  await p.evaluate(() => { window.__kq = []; const k = SBTRUTH.knowledge; SBTRUTH.knowledge = (q, o) => { window.__kq.push(q); return k(q, o); }; });
  a = await chat("what is osmosis?"); a = await chat("be more detailed");
  let kq = await p.evaluate(() => window.__kq);
  ok(/detail/i.test(kq[1] || "") && /osmosis/i.test(kq[1] || ""), "\"be more detailed\" asks about the last question again, in detail: " + JSON.stringify(kq));
  a = await chat("give me an example"); kq = await p.evaluate(() => window.__kq);
  ok(/example/i.test(kq[2] || "") && /osmosis/i.test(kq[2] || ""), "\"give me an example\" too: " + kq[2]);
  a = await chat("mark lab 4 done, start a 10 min timer");
  const two = await p.evaluate(() => ({done: window.__sbSync.state.tasks.t1.status, pomo: JSON.parse(localStorage.getItem("studioso:pomo") || "{}")}));
  ok(two.done === "done" && two.pomo.running, "two things in one message are both done: " + a);
  a = await chat("create an empty flashcard deck for WWI");
  ok(await p.evaluate(() => Object.values(window.__sbSync.state.decks).some(d => /wwi/i.test(d.name))) || /deck/i.test(a) && !/gathered material/i.test(a), "an empty deck isn't \"make flashcards from my notes\": " + a);
  // going somewhere: the chat hands over to that page (here, studying the deck)
  await p.evaluate(() => { const S = window.__sbSync, d = S.clone(S.state.decks.d1); d.cards.push({id: "k9", front: "A", back: "B", box: 0, due: "", seen: 0, right: 0, wrong: 0}); S.applyChanges([{kind: "deck", id: "d1", after: d}], "x"); });
  await p.fill("#cptIn", "review connor pelkmans"); await p.click("#cptGo"); await p.waitForTimeout(3500);
  ok(await p.evaluate(() => !document.querySelector("#cptIn") && /study|card|flip|show answer/i.test(document.body.innerText)), "\"review <deck>\" opens that deck to study");
  await p.evaluate(() => SBCOMPTAB.open()); await p.waitForSelector("#cptIn");
  a = await chat("turn my cardiac quiz into flashcards");
  const hc = await p.evaluate(() => window.__sbSync.state.decks.d2.cards.map(c => c.front + "=" + c.back));
  ok(/Added 2 cards to Heart/.test(a) && hc.includes("What starts each heartbeat?=SA node") && hc.includes("Name the chamber that pumps to the body=Left ventricle"), "cards from a quiz: each question with its answer: " + a);
  await p.evaluate(() => SBCOMPTAB.open()); await p.waitForSelector("#cptIn");
  a = await chat("make a quiz from my heart deck");
  ok(/Make a Quiz with Heart/.test(a) || await p.evaluate(() => /Make a Quiz/.test((document.querySelector("dialog[open]") || {}).innerText || "")), "a quiz from a deck opens Make a Quiz with it: " + a);
  await p.evaluate(() => { const d = document.querySelector("dialog[open]"); if (d) d.close(); SBCOMPTAB.open(); }); await p.waitForSelector("#cptIn");
  await p.waitForTimeout(600); await p.evaluate(() => { const d = document.querySelector("dialog[open]"); if (d) d.close(); SBCOMPTAB.open(); }); await p.waitForSelector("#cptIn");
  a = await chat("quiz me using the SA node card");
  ok(/Make a Quiz with Heart/.test(a) || await p.evaluate(() => /Make a Quiz/.test((document.querySelector("dialog[open]") || {}).innerText || "")), "a quiz from a card (its deck): " + a);
  await p.evaluate(() => { const d = document.querySelector("dialog[open]"); if (d) d.close(); SBCOMPTAB.open(); }); await p.waitForSelector("#cptIn");
  await p.waitForTimeout(600); await p.evaluate(() => { const d = document.querySelector("dialog[open]"); if (d) d.close(); SBCOMPTAB.open(); }); await p.waitForSelector("#cptIn");
  a = await chat("what's 4x3x2 / 5");
  ok(/4\.8/.test(a), "arithmetic with a curly apostrophe: " + a);
  await p.evaluate(() => { window.SBANN = {items: () => [{key: "k1", title: "Practice Final Exam", text: "Hello {firstname}, A 21-question practice final exam is now available.", date: new Date(Date.now() - 3 * 864e5).toISOString(), course: "BSNC 1000", cid: ""}, {key: "k2", title: "Older post", text: "x", date: new Date(Date.now() - 9 * 864e5).toISOString(), course: "BSNC 1020", cid: ""}]}; });
  a = await chat("what does my most recent announcement say");
  ok(/Practice Final Exam/.test(a) && /21-question/.test(a), "the latest class announcement, word for word: " + a);
  a = await chat("change theme to evergreen");
  ok(/Evergreen/.test(a) && !/Good morning/.test(a), "a theme by name: " + a);
  a = await chat("change the wallpaper to a picture of my dog");
  ok(/not able to do that|can't do that|couldn't/i.test(a), "a request it can't do is said plainly, not answered with something else: " + a);
  // follow-ups: the answer to its own question, and "it" about the last subject
  await p.evaluate(() => { window.__stubIntent = {intent: "make_deck"}; });
  a = await chat("make me a deck");
  ok(/What should the deck be called/.test(a), "it asks for the deck's name: " + a);
  await p.evaluate(() => { window.__stubIntent = null; });
  a = await chat("Conclusions");
  ok(await p.evaluate(() => Object.values(window.__sbSync.state.decks).some(d => d.name === "Conclusions")) && /Conclusions/.test(a), "and the next message is that name: " + a);
  await p.evaluate(() => { window.__kq = []; });
  a = await chat("what is osmosis?"); a = await chat("why does it happen?");
  kq = await p.evaluate(() => window.__kq);
  ok(/osmosis/i.test(kq[kq.length - 1] || "") && /why/i.test(kq[kq.length - 1] || ""), "\"it\" is the last subject: " + JSON.stringify(kq));
  a = await chat("what about diffusion?"); kq = await p.evaluate(() => window.__kq);
  ok(/diffusion/i.test(kq[kq.length - 1] || ""), "\"what about X\" asks the same about X: " + kq[kq.length - 1]);
  a = await chat("what's 12 * 3"); kq = await p.evaluate(() => window.__kq.length);
  ok(/36/.test(a), "a new question afterwards stands on its own: " + a);
  a = await chat("what's 4x3x2 / 5"); a = await chat("now divide that by 3");
  ok(/4\.8 ÷ 3 = 1\.6/.test(a), "a sum carried on from the last answer: " + a);
  a = await chat("show your work");
  ok(/1\.6/.test(a) || /4 × 3 = 12/.test(a), "and its steps: " + a);
  // maths of every kind, worked out by the app, with follow-ups (never a web lookup or a guess)
  const conv = async (turns) => { const r = []; for (const [q, re] of turns) { const x = await chat(q); r.push(x); ok(re.test(x), `${q} -> ${x}`); } return r; };
  await conv([["mode of 3,7,7,2,9,7,3", /mode .* is 7/], ["what's the median?", /median .* is 7/]]);
  ok(!(await p.evaluate(() => document.documentElement.classList.contains("dark") || /dark/.test(document.documentElement.dataset.theme || ""))), "\"mode of ...\" never switches dark mode");
  await conv([["2^10", /1,024/], ["what about 2^11?", /2,048/]]);
  await conv([["convert 5 km to miles", /3\.1069 miles/], ["what about 10k?", /6\.2137 miles/]]);
  await conv([["how many seconds in a day", /86,400/], ["in a week?", /604,800/]]);
  await conv([["98.6 F in celsius", /37°C/], ["show the formula", /\(°F − 32\) × 5\/9/]]);
  await conv([["if a shirt is $40 and 25% off whats the price", /\$30/], ["then 8% tax on that?", /32\.4/]]);
  await conv([["solve 2x+3=11", /x = 4/], ["show the steps", /Subtract 3/], ["now what if it's 3x instead?", /8\/3/]]);
  await conv([["solve x^2 - 5x + 6 = 0", /x = 2 or x = 3/], ["how do i check that?", /works/]]);
  await conv([["1/3 + 1/4", /7\/12/], ["now multiply that by 6", /= 3\.5/]]);
  await conv([["percent change from 50 to 65", /increase of 30%/], ["and from 65 back to 50?", /decrease of 23\.08%/], ["why aren't those the same?", /different starting value/]]);
  await conv([["slope between (1,2) and (3,8)", /= 3\./], ["whats the equation of that line?", /y = 3x − 1/]]);
  await conv([["area of a circle radius 5", /78\.54/], ["circumference?", /31\.42/]]);
  await conv([["hypotenuse if the legs are 3 and 4", /= 5\./], ["what if legs are 5 and 12", /= 13\./]]);
  await conv([["i got 42/50 on a quiz what percent is that", /84%/], ["how many more points would i need for 90%?", /3 more points/]]);
  await conv([["250 mg ordered, tablets are 125 mg, how many tabs", /2 tablets/], ["what if the order was 375 mg?", /3 tablets/]]);
  await conv([["1000 mL over 8 hours, what's the mL/hr", /125 mL\/hr/], ["with a drop factor of 15 gtt/mL whats gtt/min", /31 gtt\/min/]]);
  await conv([["kid weighs 44 lb, dose is 10 mg/kg, how much", /200 mg/]]);
  await conv([["what is 6 + 4 / 2", /= 8/], ["why not 5?", /left to right/]]);
  await conv([["atomic number of carbon", /\b6\b/], ["what about oxygen?", /\b8\b/]]);
  await conv([["molar mass of water", /18\.02/], ["so how many moles in 36 g?", /1\.99/]]);
  await conv([["balance H2 + O2 -> H2O", /2H2 \+ O2 → 2H2O/]]);
  await conv([["wats 7 x 8 again lol", /= 56/]]);
  // "quiz me on <a deck's name>": that deck, without the word "deck" (not a search of their notes for the name)
  a = await chat("Quiz me on Connor Pelkmans");
  ok(/Opening Make a Quiz with Connor Pelkmans/.test(a), "quiz me on a deck by its name: " + a);
  // with the AI on this device, the quiz comes straight from the cards (a small model quizzed on "the deck" and "which flashcard")
  await p.waitForSelector("#mqGo", {timeout: 5000}).catch(() => {});
  const qs0 = await p.evaluate(() => ({dev: window.__sbAi.cfg().provider === "device", foot: (document.querySelector("#mqStatus") || {}).parentElement ? document.querySelector("#mqStatus").parentElement.innerText : ""}));
  if (qs0.dev) {
    ok(/straight from your cards/.test(qs0.foot), "on this device a deck's quiz is made from its cards: " + qs0.foot.slice(-160));
    await p.click("#mqGo"); await p.waitForTimeout(800);
    const qz = await p.evaluate(() => { const d = window.__sbSync.state.decks.d1, z = (d.aiQuizzes || []).slice(-1)[0]; return {fronts: d.cards.map(c => c.front), stems: z ? z.questions.map(q => q.stem) : []}; });
    ok(qz.stems.length >= 2 && qz.stems.every(t => qz.fronts.some(f => t.includes(f))) && !qz.stems.some(t => /deck|flash ?card/i.test(t)), "its questions are the cards' own: " + JSON.stringify(qz.stems));
  } else ok(false, "the test page should be on the AI on this device");
  await p.evaluate(() => SBCOMPTAB.open()); await p.waitForSelector("#cptIn");
  // "create a quiz based on this" with a file attached: from the file, straight from the words (no AI step, no search of their notes)
  await p.setInputFiles("#cptFile", {name: "Key_Conclusions_Batch1.txt", mimeType: "text/plain", buffer: Buffer.from("Key conclusions\nThe SA node is the heart's natural pacemaker.\nThe AV node delays the signal so the atria empty first.")});
  await p.waitForSelector(".cpt-chip"); const np0 = await p.evaluate(() => window.__prompts.length);
  a = await chat("Create a quiz based on this");
  ok(/Make Quiz/.test(a) && /Key_Conclusions_Batch1/.test(a) && await p.evaluate(n => window.__prompts.length === n, np0), "a quiz from the attached file, with no AI step first: " + a);
  // a quiz on this device goes in a few bigger parts: 10 questions over 8 short slide sections is 3 parts (9 requests), not 8 (24)
  { const j = await p.evaluate(() => window.__sbQuizJoin([2, 1, 1, 1, 2, 1, 1, 1].map((c, i) => ({count: c, section: {title: "Slide " + (i + 1), text: "word ".repeat(200), words: 200}}))).map(x => x.count));
    ok(j.length === 3 && j.reduce((a, b) => a + b, 0) === 10 && Math.max(...j) <= 4, "a device quiz's parts are joined: " + JSON.stringify(j)); }
  // a new question after a sum is never read as a follow-up on it ("why did ..." is not "show your work")
  const NOTMATH = /^(?![\s\S]*(?:Step by step|212\.13|brackets, then powers))[\s\S]+/;
  await conv([["what's 10 x 15 times sqrt 2", /212\.13/], ["why did hitler invade poland", NOTMATH], ["why is the sky blue", NOTMATH]]);
  await conv([["what's 3 + 4 * 2", /= 11/], ["who was the first president of the united states", /^(?![\s\S]*(?:= 11|Step by step))[\s\S]+/], ["why not 14", /^(?![\s\S]*left to right)[\s\S]+/]]);
  await conv([["what is 15% of 80", /= 12/], ["what about 200?", /15% of 200 = 30/], ["what about 20%?", /20% of 200 = 40/]]);
  // maths the app can't work out itself goes to the AI with a step-by-step instruction, never to a web lookup
  await p.evaluate(() => { window.__kq = []; window.__prompts = []; });
  a = await chat("whats the limit of (x^2-1)/(x-1) as x->1");
  ok(!(await p.evaluate(() => window.__kq.length)) && (await p.evaluate(() => (window.__creates || []).concat(window.__prompts).some(t => /maths question/.test(t)))), "unsolved maths goes to the AI with a maths instruction, not the web: " + a);
  // planner messages with numbers stay planner messages
  a = await chat("got 17/20 on a&p quiz 4 and 40/50 on the lab report, mark both done");
  ok(!/out of 20 is 85%/.test(a), "recording marks isn't treated as a maths question: " + a);
  // ---- from the 1,100-conversation test (ml/eval-chat): what failed on the small on-device model, now done in code ----
  await p.evaluate(() => { const d = n => { const x = new Date(); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
    window.__sbSync.applyChanges([{kind: "task", id: "t8", after: {id: "t8", title: "Care Plan 2", courseId: "c1", due: d(1), status: "todo", type: "Assignment"}},
      {kind: "task", id: "t9", after: {id: "t9", title: "Read Chapter 7", courseId: "c1", due: d(4), status: "todo", type: "Reading"}},
      {kind: "event", id: "e8", after: {id: "e8", title: "Clinical orientation", date: d(2), start: "08:00", end: "12:00", allDay: false}}], "test setup"); });
  const fresh = async () => { await p.evaluate(() => { const d = document.querySelector("dialog[open]"); if (d) d.close(); }); await p.evaluate(() => SBCOMPTAB.open()); await p.waitForSelector("#cptIn"); await p.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /^New Chat$/i.test((x.textContent || "").trim())); if (b) b.click(); }); await p.waitForTimeout(200); };
  await fresh();
  const tasksJ = () => p.evaluate(() => JSON.stringify(window.__sbSync.state.tasks));
  let t0 = await tasksJ();
  a = await chat("email dr chen that the care plan will be late");
  ok(/can't send emails/.test(a) && t0 === await tasksJ(), "something outside Studyboard is said plainly, nothing changed: " + a);
  a = await chat("print my flashcards");
  ok(/can't print/.test(a), "printing too: " + a);
  a = await chat("i don't want to be here anymore");
  ok(/988/.test(a) && /safe/i.test(a), "words about not wanting to live get care and the crisis line, written in code: " + a);
  await fresh();
  a = await chat("my friend said she wants to hurt herself");
  ok(/988/.test(a) && /trusted adult|counsel/i.test(a), "someone else in danger: " + a);
  await fresh();
  a = await chat("Heart: add 'Where is the SA node? / Right atrium'");
  let hc2 = await p.evaluate(() => window.__sbSync.state.decks.d2.cards.map(c => c.front + "=" + c.back));
  ok(hc2.includes("Where is the SA node?=Right atrium"), "a card in another wording goes into the deck named: " + a);
  const nBefore = hc2.length;
  a = await chat("change the answer to Right atrium, near the SVC");
  hc2 = await p.evaluate(() => window.__sbSync.state.decks.d2.cards.map(c => c.front + "=" + c.back));
  ok(hc2.includes("Where is the SA node?=Right atrium, near the SVC") && hc2.length === nBefore, "\"change the answer\" changes that card, no new one: " + a);
  await fresh();
  a = await chat("make me a deck");
  ok(/What should the deck be called/.test(a), "a deck with no name asks for one: " + a);
  a = await chat("call it Pharm");
  ok(await p.evaluate(() => Object.values(window.__sbSync.state.decks).some(d => d.name === "Pharm")), "\"call it Pharm\" names it: " + a);
  await p.evaluate(() => { window.__stubIntent = {intent: "rename_item", kind: "deck", item: "it", title: "Pharmacology"}; });
  a = await chat("rename it to Pharmacology");
  await p.evaluate(() => { window.__stubIntent = null; });
  ok(await p.evaluate(() => Object.values(window.__sbSync.state.decks).some(d => d.name === "Pharmacology") && !Object.values(window.__sbSync.state.decks).some(d => d.name === "Pharm")), "\"rename it\" is the deck just made: " + a);
  await fresh();
  a = await chat("what do i have tomorrow");
  ok(/Care Plan 2/.test(a), "what do I have tomorrow: " + a);
  a = await chat("and the day after?");
  ok(/day after tomorrow/.test(a) && /Clinical orientation/.test(a) && !/Wikipedia/.test(a), "\"and the day after?\" asks the planner again, with the calendar: " + a);
  await fresh();
  await p.evaluate(() => { window.__stubIntent = {intent: "mark_done", task: "Lab 4"}; });
  a = await chat("the thing due tomorrow is done");
  await p.evaluate(() => { window.__stubIntent = null; });
  ok(await p.evaluate(() => window.__sbSync.state.tasks.t8.status === "done") && /Care Plan 2/.test(a) && !/Lab 4/.test(a), "the task the words describe, not the one the model guessed: " + a);
  await fresh();
  await p.evaluate(() => { window.__stubIntent = {intent: "question", answer: "Canberra is the capital of Australia.", sure: true, found: false}; });
  a = await chat("what is the capital of australia");
  await p.evaluate(() => { window.__stubIntent = null; });
  ok(/Canberra/.test(a) && !/couldn't find/i.test(a), "a basic fact the notes and web don't have: answered from what the AI knows: " + a);
  await fresh();
  a = await chat("you're the best packy");
  ok(!/couldn't find|notes|Wikipedia|can't do that/i.test(a), "small talk is answered as chat, never a notes search or a refusal: " + a);
  // going places (E4B test p5-102..110): opened, never read as a card; "leave a group" never deletes a deck
  await fresh();
  a = await chat("take me to flashcards");
  ok(/Taking you to Flashcards/.test(a), "\"take me to flashcards\" opens Flashcards: " + a);
  await p.evaluate(() => SBCOMPTAB.open()); await p.waitForSelector("#cptIn");
  a = await chat("now the calendar");
  ok(/Taking you to Calendar/.test(a), "\"now the calendar\" carries on: " + a);
  await p.waitForTimeout(600); await fresh();
  const dk0 = await p.evaluate(() => Object.keys(window.__sbSync.state.decks).length);
  a = await chat("leave the heart squad group");
  ok(/Leave Group/.test(a) && dk0 === await p.evaluate(() => Object.keys(window.__sbSync.state.decks).length), "leaving a group goes to Groups, and no deck is deleted: " + a);
  await fresh();
  // the companion's look (E4B test p5-128..139): what it has, its own colour said plainly, never a course recoloured
  await fresh();
  a = await chat("what accessories do I have");
  ok(/I can wear: 1\.|haven't earned any accessories/.test(a), "what it can wear, from its settings: " + a);
  const cc0 = await p.evaluate(() => JSON.stringify(window.__sbSync.state.courses));
  a = await chat("make packy purple");
  ok(/can't change my own colou?r/.test(a) && cc0 === await p.evaluate(() => JSON.stringify(window.__sbSync.state.courses)), "its own colour is said plainly, and no course changes: " + a);
  // notes said every way (E4B test p5-080..088): saved with their words, and "and ..." adds to the note just saved
  await fresh();
  a = await chat("remember my locker code is 4412");
  ok(/4412/.test(await notes()) && !/WRONG NOTE/.test(await notes()), "\"remember my X is Y\" saves a note with their words: " + a);
  a = await chat("and my ID badge");
  ok(/4412[\s\S]*ID badge/.test(await notes()), "\"and my ID badge\" adds to that note: " + a);
  await fresh();
  a = await chat("sticky note: email Prof Ruiz about lab report");
  ok(/Prof Ruiz about lab report/.test(await notes()), "\"sticky note: X\" saves it: " + a);
  ok(!errs.length, "no page errors: " + errs.join(" | "));
  await b.close(); server.close();
  console.log(`\n${n - fails}/${n} passed`); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
