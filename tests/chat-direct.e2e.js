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
  // (CLAUDE_ONLY=1: only the checks of the Claude step at the end)
  if (!process.env.CLAUDE_ONLY) {

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
  // "quiz me ...": asked right here in the chat, one question at a time, each answer marked
  a = await chat("quiz me using the SA node card");
  ok(/Question 1 of \d+:/.test(a) && /SA node|heartbeat/i.test(a), "a quiz on a card is asked in the chat: " + a);
  a = await chat("stop");
  ok(/Quiz over/.test(a), "\"stop\" ends it with the score: " + a);
  a = await chat("quiz me on the heart deck");
  { const qn = (/Question 1 of \d+: (.+?)(?:\s{2,}|$)/m.exec(a) || [])[1] || "", back = await p.evaluate(f => { const c = window.__sbSync.state.decks.d2.cards.find(x => x.front === f); return c ? c.back : ""; }, qn.trim());
    ok(!!back, "the question is one of the Heart cards: " + a);
    a = await chat(back.toLowerCase());
    ok(/^Right!/.test(a) && /Question 2 of/.test(a), "the right answer in their own words is marked right, then the next question: " + a); }
  a = await chat("idk");
  ok(/The answer:/.test(a), "\"idk\" shows the answer: " + a);
  a = await chat("what's due tomorrow and can you add a reading for chapter 8");
  ok(!/Question \d+ of|Not quite/.test(a), "a new request ends the quiz instead of being marked: " + a);
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
  await conv([["if a price goes from $2 to $2.50 what's the % increase", /25%/]]);
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
  ok(/from Connor Pelkmans/.test(a) && /Question 1 of/.test(a), "quiz me on a deck by its name: " + a);
  a = await chat("stop");
  // "make a quiz from ..." still opens Make a Quiz with that deck
  a = await chat("make a quiz from my Connor Pelkmans deck");
  ok(/Make a Quiz with Connor Pelkmans/.test(a), "make a quiz from a deck opens Make a Quiz: " + a);
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
  // From the Haiku 5.5 cloud run (ml/eval-chat/HAIKU-CLOUD-RESULTS.md): the app's own steps around the model
  // a study set never made from the web about words that point at something
  a = await chat("make flashcards from this file");
  ok(/Attach the file/.test(a) && !/Wikipedia/.test(a), "flashcards from \"this file\" with nothing attached asks for the file: " + a);
  a = await chat("now make flashcards from the questions I got wrong");
  ok(/can't see which questions you got wrong/.test(a) && !/Wikipedia/.test(a), "cards from the ones they got wrong: said, never a web topic: " + a);
  a = await chat("make a quiz for the group");
  ok(!/Wikipedia/.test(a) && !/on the group/.test(a), "\"a quiz for the group\" isn't a quiz about groups: " + a);
  // not something it can't do: something to answer
  a = await chat("make me laugh im sad");
  ok(!/not able to do that from the chat/.test(a), "\"make me laugh\" is never \"I'm not able to do that\": " + a);
  // marks: the task their words name; one already saved is said, never saved again; a different one is asked about, not overwritten
  await p.evaluate(() => { const S = window.__sbSync.state, T = (id, title, extra) => { S.tasks[id] = Object.assign({id, title, courseId: "c1", due: "2026-11-20", status: "done", type: "assignment", created: 1, updated: 1}, extra || {}); };
    T("tpp", "Psych Paper 1", {mark: {got: 88, outOf: 100}}); T("tpm", "Psych Midterm", {status: "todo", due: "2026-12-04"}); T("tlab", "A&P Lab 1", {mark: {got: 30, outOf: 50}}); });
  await p.evaluate(() => { window.__stubIntent = {intent: "add_mark", task: "Psych Midterm", value: "88"}; });
  a = await chat("i got 88 on my psych paper!!");
  ok(/already saved: 88\/100 for Psych Paper 1/.test(a) && await p.evaluate(() => !window.__sbSync.state.tasks.tpm.mark), "a mark already saved, on the task the words name, isn't put on the midterm: " + a);
  await p.evaluate(() => { window.__stubIntent = {intent: "add_mark", task: "Psych Paper 1", value: "17"}; });
  a = await chat("got 17 on the psych paper");
  ok(/already has 88\/100\. Replace it/.test(a) && await p.evaluate(() => window.__sbSync.state.tasks.tpp.mark.got === 88), "a different mark is asked about, not overwritten: " + a);
  await p.evaluate(() => { window.__stubIntent = null; });
  a = await chat("no");
  ok(/left the mark as it was/.test(a) && await p.evaluate(() => window.__sbSync.state.tasks.tpp.mark.got === 88), "\"no\" leaves it: " + a);
  // taking a mark off never deletes the task
  await p.evaluate(() => { window.__stubIntent = {intent: "delete_task", task: "A&P Lab 1"}; });
  a = await chat("remove the grade from a&p lab 1, it was entered wrong");
  ok(/can't take a mark off/.test(a) && await p.evaluate(() => !!window.__sbSync.state.tasks.tlab), "removing a grade never deletes the task: " + a);
  // what they're doing themselves, and time they have, aren't things to add
  await p.evaluate(() => { window.__stubIntent = {intent: "add_note", text: "Freud"}; });
  const notes0 = await notes(); a = await chat("i'm putting that on a sticky note");
  ok(await notes() === notes0, "\"i'm putting that on a sticky note\" makes no note: " + a);
  await p.evaluate(() => { window.__stubIntent = {intent: "add_event", title: "Work", date: "2026-11-26"}; });
  const ev0 = await p.evaluate(() => Object.keys(window.__sbSync.state.events || {}).length); a = await chat("i have 4 hours tomorrow");
  ok(await p.evaluate(n => Object.keys(window.__sbSync.state.events || {}).length === n, ev0), "\"i have 4 hours tomorrow\" adds no event: " + a);
  // a rename with "it" and nothing it could mean is asked about, never guessed
  await p.evaluate(() => { window.__stubIntent = {intent: "rename_task", task: "Psych Midterm", title: "Psych Pals"}; });
  a = await chat("for psych, call it Psych Pals");
  ok(await p.evaluate(() => window.__sbSync.state.tasks.tpm.title === "Psych Midterm"), "\"call it Psych Pals\" with nothing to point at renames nothing: " + a);
  await p.evaluate(() => { window.__stubIntent = null; });
  // "remember that ... chapters 1-6" isn't maths
  a = await chat("remember that Dr. Chen said the midterm covers chapters 1-6");
  ok(!/= -5|maths question|1 - 6/.test(a), "\"chapters 1-6\" to remember isn't a sum: " + a);
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
  await p.waitForTimeout(500); // (the page change renders 200 ms after the reply; the chat is reopened after it, not under it)
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
  // plans, feelings and remarks never change the planner (E4B test p6-038..082, p6-039 "give up on A&P" deleted the final)
  const tasks0 = () => p.evaluate(() => JSON.stringify(Object.values(window.__sbSync.state.tasks).map(t => [t.id, t.status, t.due]).sort()));
  const evs0 = () => p.evaluate(() => JSON.stringify(window.__sbSync.state.events || []));
  for (const [said, st] of [["ok i'll try to finish it tonight", {intent: "mark_in_progress", task: "Care Plan 2"}], ["i want to give up on A&P", {intent: "delete_task", task: "A&P Final Exam"}],
    ["but care plan 2 is due tomorrow", {intent: "move_task", task: "Care Plan 2", date: "tomorrow"}], ["i want to do a 5k next month", {intent: "add_event", title: "5k", date: "next month"}],
    ["im done for today", {intent: "mark_done", task: "it"}], ["make me a study plan for the psych midterm", {intent: "add_task", title: "Study for Psych Midterm"}]]) {
    await fresh(); const t0 = await tasks0(), e0 = await evs0();
    await p.evaluate(s => { window.__stubIntent = s; }, st);
    a = await chat(said);
    await p.evaluate(() => { window.__stubIntent = null; });
    ok(t0 === await tasks0() && e0 === await evs0() && !/Which task do you mean/.test(a), `"${said}" changes nothing: ` + a);
  }
  // a mark they got is a mark, not a sum
  await fresh();
  a = await chat("got 17/20 on a&p quiz 4");
  ok(!/mathematical|provide a question|17 ÷ 20|= 0\.85/i.test(a), "\"got 17/20 on X\" isn't worked out as maths: " + a);
  // studying cards isn't adding one; "what should I study first for quiz 4" isn't the canned next-up line
  await fresh();
  a = await chat("lets do psych cards");
  ok(!/what should the card say/i.test(a), "\"lets do psych cards\" never asks for a new card: " + a);
  await fresh();
  a = await chat("what should i study first for quiz 4");
  ok(!/Today's Plan says/.test(a), "a question about one quiz gets a real answer, not the next-up line: " + a);
  // the messages after a crisis reply keep the crisis line and the point that safety beats a secret
  await fresh();
  await chat("i don't want to be here anymore");
  a = await chat("i don't know");
  ok(/988/.test(a), "\"i don't know\" after \"are you safe?\" still gives 988: " + a);
  await fresh();
  await chat("my friend said she wants to hurt herself");
  a = await chat("she told me not to tell anyone");
  ok(/safety/i.test(a) && /trusted adult|RA|counselor/i.test(a), "a friend's secret: safety comes first: " + a);
  // several tasks at once: every open task the words pick changes, even when the model calls it a question
  await fresh();
  await p.evaluate(() => { const S = window.__sbSync, t = S.clone(S.state.tasks.t8); t.status = "todo"; t.doneAt = null; t.priority = "med"; S.applyChanges([{kind: "task", id: "t8", after: t}], "x"); window.__stubIntent = {intent: "question"}; });
  a = await chat("everything due in the next 30 days high priority pls");
  { const r = await p.evaluate(() => { const s = window.__sbSync.state, to = new Date(Date.now() + 29 * 864e5), iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const L = Object.values(s.tasks).filter(t => t.status !== "done" && t.due && t.due >= iso(new Date()) && t.due <= iso(to)); return {n: L.length, high: L.filter(t => t.priority === "high").length}; });
    ok(r.n > 1 && r.high === r.n && /high priority/.test(a), `"everything due in the next 30 days high priority" sets all ${r.n} (${r.high} high): ` + a); }
  await p.evaluate(() => { window.__stubIntent = null; });
  // an edit the model took for a new task ("read chapter 7 in progress too"): that task changes, no task titled with the instruction
  await fresh();
  { const n0 = await p.evaluate(() => Object.keys(window.__sbSync.state.tasks).length);
    await p.evaluate(() => { window.__stubIntent = {intent: "add_task", title: "Read chapter 7 in progress too"}; });
    a = await chat("read chapter 7 in progress too");
    const r = await p.evaluate(() => ({n: Object.keys(window.__sbSync.state.tasks).length, st: window.__sbSync.state.tasks.t9.status}));
    ok(r.n === n0 && r.st === "doing", `an edit isn't a new task (${n0} -> ${r.n} tasks, status ${r.st}): ` + a);
    await p.evaluate(() => { window.__stubIntent = null; }); }
  // flashcards from a note of "Term: meaning" lines: a card per term; then "keep only 2" and "add one more about X" change that deck
  await fresh();
  await p.evaluate(() => { window.__sbSync.applyChanges([{kind: "note", id: "n9", after: {id: "n9", x: 0, y: 0, created: 1, text: "Defense mechanisms\nRepression: pushing painful thoughts out of awareness.\nProjection: attributing your own feelings to someone else.\nDisplacement: redirecting emotion to a safer target.\nSublimation: channeling urges into acceptable activities."}}], "x"); window.__stubIntent = {intent: "make_flashcards", topic: "defense mechanisms note"}; });
  a = await chat("make flashcards from my defense mechanisms note");
  { const dk = await p.evaluate(() => Object.values(window.__sbSync.state.decks).filter(d => /defense/i.test(d.name)).map(d => d.cards.map(c => c.front + "=" + c.back))[0] || []);
    ok(dk.length === 4 && dk.some(x => /^What is Projection\?=attributing/.test(x)), "a card for each term in the note: " + JSON.stringify(dk) + " " + a); }
  await p.evaluate(() => { window.__stubIntent = null; });
  a = await chat("too many, keep only 2");
  ok(await p.evaluate(() => (Object.values(window.__sbSync.state.decks).find(d => /defense/i.test(d.name)) || {cards: []}).cards.length === 2) && /now has the first 2/.test(a), "\"keep only 2\" trims the deck it just made: " + a);
  a = await chat("add one more about sublimation");
  ok(await p.evaluate(() => (Object.values(window.__sbSync.state.decks).find(d => /defense/i.test(d.name)) || {cards: []}).cards.some(c => /Sublimation/.test(c.front))) && /Added a card/.test(a), "\"add one more about X\" adds the card from their note: " + a);
  // a knock-knock joke is played along, never looked up ("backpack" isn't a Wikipedia article here)
  await fresh();
  await p.evaluate(() => { window.__stubIntent = {intent: "chat", answer: "Ha, good one!", found: true, followUps: [], actions: []}; });
  a = await chat("knock knock");
  ok(/who'?s there/i.test(a), "\"knock knock\" gets \"Who's there?\": " + a);
  a = await chat("backpack");
  ok(/^Backpack who\?/.test(a), "the next word gets \"<word> who?\": " + a);
  await p.evaluate(() => { window.__stubIntent = null; });
  // after a crisis reply: brushing it off gets one more gentle check-in, and reaching out to someone is affirmed; 988 stays in view
  await fresh();
  await p.evaluate(() => { window.__stubIntent = {intent: "chat", answer: "Okay!", found: true, followUps: [], actions: []}; });
  a = await chat("sometimes i feel like everyone would be better off without me");
  ok(/988/.test(a) && /safe/i.test(a), "a crisis message gets 988 and \"are you safe\": " + a);
  a = await chat("im fine forget it");
  ok(/safe/i.test(a) && /988/.test(a), "\"im fine forget it\" checks in once more, with 988: " + a);
  a = await chat("maybe i'll text my sister about it");
  ok(/good idea|good step/i.test(a) && /988/.test(a), "\"text my sister\" is affirmed and 988 stays open: " + a);
  // what the companion is, and where chats go: said honestly, not by a model guessing
  await fresh();
  a = await chat("are you chatgpt");
  ok(/not ChatGPT/.test(a), "\"are you chatgpt\" is answered honestly: " + a);
  a = await chat("so do my notes get sent anywhere");
  ok(/AI service|on your device|this device/i.test(a) && !/Make flashcards/.test(a), "\"do my notes get sent anywhere\" says where chats go: " + a);
  // a mark for something not in the planner ("my quiz 1"): never saved on another task
  await fresh();
  { const m0 = await p.evaluate(() => JSON.stringify(Object.values(window.__sbSync.state.tasks).map(t => t.mark || null)));
    await p.evaluate(() => { window.__stubIntent = {intent: "add_mark", task: "quiz 1", value: "11/20"}; });
    a = await chat("my quiz 1 was 11/20 too");
    const m1 = await p.evaluate(() => JSON.stringify(Object.values(window.__sbSync.state.tasks).map(t => t.mark || null)));
    ok(m0 === m1 && /didn't save/.test(a), "a mark for an item that isn't in the planner isn't saved on another task: " + a); }
  await p.evaluate(() => { window.__stubIntent = null; });
  // a quick task: "in 3 days" is the due date, not part of the title
  await fresh();
  a = await chat("add hist reading ch 12 in 3 days");
  { const r = await p.evaluate(() => { const t = Object.values(window.__sbSync.state.tasks).find(x => /hist reading/i.test(x.title)), d = new Date(Date.now() + 3 * 864e5); return t ? {title: t.title, due: t.due, want: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`} : null; });
    ok(r && !/in 3 days/i.test(r.title) && r.due === r.want, "\"in 3 days\" sets the due date: " + JSON.stringify(r) + " " + a); }
  // a note the chat added can be undone
  await fresh();
  await p.evaluate(() => { window.__stubIntent = {intent: "add_note", text: "Email Dr Okafor about clinical hours"}; });
  a = await chat("sticky note: email Dr Okafor about clinical hours");
  await p.evaluate(() => { window.__stubIntent = null; });
  { const had = await p.evaluate(() => Object.values(window.__sbSync.state.notes).some(n => n && /Dr Okafor/.test(n.text || "")));
    a = await chat("undo that");
    const has = await p.evaluate(() => Object.values(window.__sbSync.state.notes).some(n => n && /Dr Okafor/.test(n.text || "")));
    ok(had && !has && /Undone/.test(a), "\"undo that\" removes the note the chat just added: " + a); }
  // several tasks named one by one ("X and Y, both"): each changed, not just the first (the model named only one)
  const resetT = () => p.evaluate(() => { const S = window.__sbSync; ["t8", "t9"].forEach(id => { const t = S.clone(S.state.tasks[id]); t.status = "todo"; t.doneAt = null; delete t.mark; S.applyChanges([{kind: "task", id, after: t}], "x"); }); });
  await fresh(); await resetT();
  await p.evaluate(() => { window.__stubIntent = {intent: "mark_done", task: "Care Plan 2"}; });
  a = await chat("tick off care plan 2 and read chapter 7, both handed in");
  ok(await p.evaluate(() => window.__sbSync.state.tasks.t8.status === "done" && window.__sbSync.state.tasks.t9.status === "done"), "\"X and Y, both\" marks both done: " + a);
  // "same for X" after a change made straight from the words: the same change to X (it said "done" and changed nothing)
  await fresh(); await resetT();
  await p.evaluate(() => { window.__stubIntent = {intent: "question"}; });
  a = await chat("mark care plan 2 done");
  a = await chat("same for chapter 7");
  ok(await p.evaluate(() => window.__sbSync.state.tasks.t9.status === "done"), "\"same for chapter 7\" marks it done too: " + a);
  // a mark said as a statement ("record 16/20 for ..."): saved, not answered as a question
  await fresh(); await resetT();
  await p.evaluate(() => { window.__stubIntent = {intent: "question"}; });
  a = await chat("record 16/20 for read chapter 7");
  ok(await p.evaluate(() => { const m = window.__sbSync.state.tasks.t9.mark; return !!m && m.got === 16 && m.outOf === 20; }), "\"record 16/20 for X\" saves the mark: " + a);
  // a reply that says it marked something when nothing changed isn't left standing
  await fresh(); await resetT();
  await p.evaluate(() => { window.__stubIntent = {intent: "chat", answer: "I have marked Read Chapter 7 as done for you.", found: true, followUps: [], actions: []}; });
  a = await chat("chapter 7 is finished i think");
  ok(await p.evaluate(() => window.__sbSync.state.tasks.t9.status === "done") || !/I have marked/.test(a), "\"I have marked X\" with no change is done for real or not said: " + a);
  await p.evaluate(() => { window.__stubIntent = null; });
  // several requests in one message: each done (the model only ever answers for one)
  await fresh(); await resetT();
  await p.evaluate(() => { window.__stubIntent = {intent: "question"}; });
  a = await chat("care plan 2 done, read chapter 7 done");
  ok(await p.evaluate(() => window.__sbSync.state.tasks.t8.status === "done" && window.__sbSync.state.tasks.t9.status === "done"), "\"X done, Y done\" does both: " + a);
  // "make it high priority" right after adding a task: that task, never a second one
  await fresh();
  { const n0 = await p.evaluate(() => Object.keys(window.__sbSync.state.tasks).length);
    a = await chat("add a bio worksheet due friday");
    await p.evaluate(() => { window.__stubIntent = {intent: "add_task", title: "Bio worksheet"}; });
    a = await chat("make it high priority");
    const r = await p.evaluate(() => { const L = Object.values(window.__sbSync.state.tasks).filter(t => /bio worksheet/i.test(t.title)); return {n: Object.keys(window.__sbSync.state.tasks).length, k: L.length, pr: L.map(t => t.priority)}; });
    ok(r.k === 1 && r.n === n0 + 1 && r.pr[0] === "high", "\"make it high priority\" changes the task just added: " + JSON.stringify(r) + " " + a);
    // a priority with more said after it ("actually urgent, i forgot its due monday"): still that task's priority
    a = await chat("actually urgent, i forgot its for my lab");
    ok(await p.evaluate(() => Object.values(window.__sbSync.state.tasks).some(t => /bio worksheet/i.test(t.title) && t.priority === "urgent")), "\"actually urgent, ...\" sets the priority: " + a); }
  // a day on its own right after adding something with no day: its due day
  await fresh();
  await p.evaluate(() => { window.__stubIntent = {intent: "add_task", title: "History quiz"}; });
  a = await chat("add a history quiz");
  await p.evaluate(() => { window.__stubIntent = {intent: "chat"}; });
  a = await chat("thursday");
  ok(await p.evaluate(() => Object.values(window.__sbSync.state.tasks).some(t => /history quiz/i.test(t.title) && !!t.due && new Date(t.due + "T12:00").getDay() === 4)), "a bare \"thursday\" after adding it sets its day: " + a);
  // chat the small model calls "cant" or a new task: talk, never "I can't do that" or a task named after the words
  await fresh(); await resetT();
  { const n0 = await p.evaluate(() => Object.keys(window.__sbSync.state.tasks).length);
    await p.evaluate(() => { window.__stubIntent = {intent: "cant"}; });
    a = await chat("ok i gotta go");
    ok(!/can't do that from the chat|not able to do that from the chat/i.test(a), "\"ok i gotta go\" called cant is talk: " + a);
    await p.evaluate(() => { window.__stubIntent = {intent: "add_task", title: "I havent started"}; });
    a = await chat("i havent started");
    ok(await p.evaluate(n0 => Object.keys(window.__sbSync.state.tasks).length === n0, n0), "\"i havent started\" called add_task adds nothing: " + a);
    await p.evaluate(() => { window.__stubIntent = {intent: "add_task", title: "Read Chapter 7"}; });
    a = await chat("add read chapter 7 to my list");
    ok(await p.evaluate(n0 => Object.keys(window.__sbSync.state.tasks).length === n0, n0) && /already on your list/i.test(a), "an open task isn't added twice: " + a);
    await p.evaluate(() => { window.__stubIntent = {intent: "change_setting", field: "text size", value: "louder"}; });
    a = await chat("louder");
    ok(!/text size|Settings/i.test(a), "\"louder\" doesn't open a setting: " + a);
    await p.evaluate(() => { window.__stubIntent = null; }); }
  // a course's own facts from what's saved, and the instructor it asks for saved from the reply
  await fresh();
  await p.evaluate(() => { window.__stubIntent = {intent: "question"}; });
  a = await chat("what's the course code for ochem?");
  ok(/CHEM 211/.test(a), "the course code is the saved one: " + a);
  a = await chat("who teaches ochem?");
  ok(/no instructor saved|doesn't have an instructor|doesn't list an instructor/i.test(a), "no instructor is said plainly, none made up: " + a);
  await p.evaluate(() => { window.__stubIntent = {intent: "chat"}; });
  a = await chat("it's Dr. Patel");
  ok(await p.evaluate(() => /patel/i.test(String(window.__sbSync.state.courses.c2.instructor || ""))), "\"it's Dr. Patel\" saves the instructor: " + a);
  // the planner's own sums: which comes first and how far apart, how late, time blocked for something
  await fresh(); await resetT();
  await p.evaluate(() => { window.__stubIntent = {intent: "question"}; });
  a = await chat("is care plan 2 before or after read chapter 7?");
  ok(/Care Plan 2 \([^)]*\) is 3 days before Read Chapter 7/.test(a), "two dates compared exactly: " + a);
  a = await chat("how many days late is clinical orientation");
  ok(/isn.t late|Nothing is overdue/.test(a), "something not due yet isn't late: " + a);
  { const e0 = await p.evaluate(() => Object.keys(window.__sbSync.state.events || {}).length);
    await p.evaluate(() => { window.__stubIntent = {intent: "chat"}; });
    a = await chat("block 2-4 tomorrow for care plan 2");
    const ev = await p.evaluate(() => Object.values(window.__sbSync.state.events || {}).find(e => /care plan 2/i.test(e.title || "")) || null);
    ok(ev && ev.start === "14:00" && ev.end === "16:00" && await p.evaluate(n => Object.keys(window.__sbSync.state.events || {}).length === n + 1, e0), "\"block 2-4 tomorrow for care plan 2\" is a 2-4pm event: " + JSON.stringify(ev) + " " + a); }
  await p.evaluate(() => { window.__stubIntent = null; });
  // a deck named without the words around it, then "rename it" renames that deck
  await fresh();
  await p.evaluate(() => { window.__stubIntent = {intent: "make_deck", title: "WWI for it"}; });
  a = await chat("make a new deck called WWI for it");
  ok(await p.evaluate(() => Object.values(window.__sbSync.state.decks || {}).some(d => d.name === "WWI")), "\"a new deck called WWI for it\" is named WWI: " + a);
  await p.evaluate(() => { window.__stubIntent = {intent: "chat"}; });
  a = await chat("rename it to History Essay Prep");
  ok(await p.evaluate(() => Object.values(window.__sbSync.state.decks || {}).some(d => d.name === "History Essay Prep") && !Object.values(window.__sbSync.state.decks || {}).some(d => d.name === "WWI")), "\"rename it to ...\" renames the deck it just made: " + a);
  // "what notes do i have": every note, not five of them
  await p.evaluate(() => { window.__stubIntent = {intent: "question"}; });
  a = await chat("what notes do i have");
  { const nN = await p.evaluate(() => Object.values(window.__sbSync.state.notes || {}).filter(n => n && !n.archived && String(n.text || "").trim()).length);
    ok(!nN || new RegExp("You have " + nN + " note").test(a), "\"what notes do i have\" lists all " + nN + ": " + a); }
  // "too dark, go back" right after dark mode: light mode again
  await p.evaluate(() => { window.__stubIntent = {intent: "set_theme", value: "dark"}; });
  a = await chat("turn on dark mode");
  await p.evaluate(() => { window.__stubIntent = {intent: "chat"}; });
  a = await chat("too dark, go back");
  ok(/light mode/i.test(a) && !/nothing recent to undo/i.test(a), "\"too dark, go back\" after dark mode switches back: " + a);
  // what the companion wears can be undone ("take everything off" then "undo that")
  await p.evaluate(() => { window.__stubIntent = {intent: "chat"}; });
  a = await chat("take everything off");
  a = await chat("undo that");
  ok(!/nothing recent to undo/i.test(a) && /Undone/i.test(a), "\"undo that\" after taking accessories off puts them back: " + a);
  // "quick deck on X" makes cards (it went to the notes lookup)
  await p.evaluate(() => { window.__stubIntent = null; });
  { const n0 = await p.evaluate(() => Object.keys(window.__sbSync.state.decks || {}).length);
    a = await chat("quick deck on defense mechanisms");
    const more = await p.evaluate(n => Object.keys(window.__sbSync.state.decks || {}).length > n, n0);
    ok(!/^From your notes/i.test(a) && (more || /\bcards?\b/i.test(a)), "\"quick deck on ...\" makes cards: " + a); }
  await p.evaluate(() => { window.__stubIntent = null; });
  // an event's time range ("wednesday 1-2"): from 1 to 2 in the afternoon
  await fresh();
  await p.evaluate(() => { window.__stubIntent = {intent: "add_event", title: "Office hours with Prof Ruiz"}; });
  a = await chat("add office hours with prof ruiz wednesday 1-2");
  { const ev = await p.evaluate(() => Object.values(window.__sbSync.state.events || {}).find(e => /office hours/i.test(e.title || "")) || null);
    ok(ev && ev.start === "13:00" && ev.end === "14:00", "\"wednesday 1-2\" is 1 to 2 pm: " + JSON.stringify(ev && {start: ev.start, end: ev.end}) + " " + a); }
  // something to get done with no time is a task, not a calendar event
  await fresh();
  { const e0 = await p.evaluate(() => Object.keys(window.__sbSync.state.events || {}).length);
    await p.evaluate(() => { window.__stubIntent = {intent: "add_event", title: "NCLEX practice questions"}; });
    a = await chat("add nclex practice questions tmrw");
    const r = await p.evaluate(() => ({ev: Object.keys(window.__sbSync.state.events || {}).length, t: Object.values(window.__sbSync.state.tasks).some(t => /nclex/i.test(t.title))}));
    ok(r.t && r.ev === e0, "\"nclex practice questions tmrw\" is a task: " + JSON.stringify(r) + " " + a); }
  // an event's length and a shift by hours ("make it an hour longer", "2 hours earlier"): from its own start and end
  await fresh();
  await p.evaluate(() => { const S = window.__sbSync, d = new Date(Date.now() + 2 * 864e5), iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    S.applyChanges([{kind: "event", id: "evx", after: {id: "evx", title: "Study group", date: iso, start: "18:00", end: "19:30", allDay: false}}], "x"); window.__stubIntent = {intent: "edit_item", kind: "event", item: "Study group", field: "duration", value: "longer"}; });
  a = await chat("make the study group an hour longer");
  ok(await p.evaluate(() => window.__sbSync.state.events.evx.end === "20:30"), "\"an hour longer\" moves the end from 7:30 to 8:30: " + a);
  await p.evaluate(() => { window.__stubIntent = {intent: "move_task", task: "Study group"}; });
  a = await chat("move the study group 2 hours earlier");
  ok(await p.evaluate(() => window.__sbSync.state.events.evx.start === "16:00"), "\"2 hours earlier\" moves 6 pm to 4 pm, not 2 o'clock: " + a);
  // a follow-up right after a move: "actually one more day" is a day after the new date (E2B: chat, nothing moved)
  { const x5 = new Date(Date.now() + 5 * 864e5), txt = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"][x5.getMonth()] + " " + x5.getDate();
    a = await chat("move the study group to " + txt);
    const d1 = await p.evaluate(() => window.__sbSync.state.events.evx.date);
    a = await chat("actually one more day");
    const d2 = await p.evaluate(() => window.__sbSync.state.events.evx.date), want = new Date(x5.getTime() + 864e5);
    ok(new Date(d1 + "T12:00:00").getDate() === x5.getDate() && new Date(d2 + "T12:00:00").toDateString() === new Date(want.toDateString()).toDateString(), "\"actually one more day\" after a move pushes it one more day: " + d1 + " " + d2 + " " + a); }
  // a task named by when it's due, and the day it moves to (not the day that names it)
  await fresh(); await resetT();
  // (only Care Plan 2 due tomorrow, whatever day the test runs: tasks added earlier, "a bio worksheet due friday", move out of the way)
  await p.evaluate(() => { const S = window.__sbSync, t8 = S.state.tasks.t8; Object.values(S.state.tasks).filter(t => t.id !== "t8" && t.due === t8.due).forEach(t => { const n = S.clone(t); n.due = "2031-01-01"; S.applyChanges([{kind: "task", id: t.id, after: n}], "x"); }); });
  await p.evaluate(() => { window.__stubIntent = {intent: "mark_done", task: "the thing due tomorrow"}; });
  a = await chat("the thing due tomorrow is done");
  ok(await p.evaluate(() => window.__sbSync.state.tasks.t8.status === "done"), "\"the thing due tomorrow is done\" marks the one task due tomorrow: " + a);
  await resetT();
  { const want = await p.evaluate(() => { const t = window.__sbSync.state.tasks.t9, x = new Date(t.due + "T12:00:00"); return t.due; });
    await p.evaluate(() => { window.__stubIntent = {intent: "move_task", task: "Read Chapter 7"}; });
    a = await chat("read chapter 7 on " + ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][new Date(want + "T12:00:00").getDay()] + " is now friday");
    ok(await p.evaluate(() => new Date(window.__sbSync.state.tasks.t9.due + "T12:00:00").getDay() === 5), "\"X on <day> is now friday\" moves it to friday: " + a); }
  // "add an a&p worksheet": the title keeps its first word
  await fresh();
  a = await chat("add an a&p worksheet due wednesday");
  ok(await p.evaluate(() => Object.values(window.__sbSync.state.tasks).some(t => /^a&p worksheet$/i.test(t.title))), "\"add an a&p worksheet\" is titled A&P worksheet: " + a);
  await p.evaluate(() => { window.__stubIntent = null; });
  // flashcards counted and found from the decks, how-to never makes a deck, a file that isn't here is said
  await fresh();
  await p.evaluate(() => { window.__stubIntent = {intent: "question"}; });
  { const d0 = await p.evaluate(() => Object.keys(window.__sbSync.state.decks).length);
    a = await chat("how many cards in heart");
    ok(/^Heart has \d+ cards?/.test(a), "\"how many cards in heart\" counts that deck: " + a);
    a = await chat("how many flashcards do i have");
    ok(/You have \d+ flashcards? in \d+ decks?/.test(a), "\"how many flashcards do i have\" counts them all: " + a);
    a = await chat("how do i make a flashcard deck");
    ok(/New Deck/.test(a) && await p.evaluate(n => Object.keys(window.__sbSync.state.decks).length === n, d0), "\"how do i make a deck\" says how, makes nothing: " + a);
    a = await chat("make flashcards from the slides i uploaded yesterday");
    ok(/attach/i.test(a) && await p.evaluate(n => Object.keys(window.__sbSync.state.decks).length === n, d0), "slides that aren't here are said, no empty deck: " + a); }
  await p.evaluate(() => { window.__stubIntent = null; });
  }
  // ---- With Claude (a Claude key in Studyboard AI Pro Mode): one step reads the whole planner and lists the changes; the app makes them
  {
    const SEEDC = {v: 2, updated: 1, files: [], notes: [{id: "n1", x: 0, y: 0, created: 1, text: "Freud\nId: wants it now\nEgo: reality\nSuperego: conscience"}], events: [], settings: {ai: {provider: "anthropic", model: "studyboard"}},
      courses: [{id: "c1", name: "Anatomy and Physiology", code: "BIOS 230", color: "#3B6FE0"}, {id: "c2", name: "World History", code: "HIST 1010", color: "#DC2626"}],
      decks: [{id: "d1", name: "Heart", created: 1, cards: [{id: "h1", front: "SA node", back: "pacemaker", box: 0, due: "", seen: 0, right: 0, wrong: 0}]}],
      tasks: [{id: "t1", title: "Care Plan 2", courseId: "c1", type: "Assignment", due: "2030-01-10", status: "todo", priority: "med"}, {id: "t2", title: "Lab Report", courseId: "c1", type: "Lab", due: "2030-01-12", status: "todo", priority: "med"}, {id: "t3", title: "Psych Quiz 1", courseId: "c1", type: "Quiz", due: "2020-01-05", status: "done", priority: "med", mark: {got: 17, outOf: 20}}]};
    const sent = []; let replyFor = () => ({answer: "Hi!"});
    const cx = await b.newContext({viewport: {width: 1100, height: 850}, serviceWorkers: "block"});
    await cx.route(/api\.anthropic\.com/, route => {
      if (/count_tokens/.test(route.request().url())) { route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({input_tokens: 2000})}); return; }
      const body = JSON.parse(route.request().postData() || "{}"), sys = typeof body.system === "string" ? body.system : (body.system || []).map(x => x.text).join("\n"), text = JSON.stringify(body.messages || []);
      const ptxt = (((body.messages || [])[0] || {}).content || []).filter(x => x.type === "text").map(x => x.text).join("\n");
      sent.push({sys, text: ptxt}); const msg = (/THE STUDENT'S NEW MESSAGE: (.*)$/.exec(ptxt) || [])[1] || "";
      const refOf = title => (new RegExp("\\b([A-Z]\\d+) \\| " + title).exec(ptxt) || [])[1] || "";
      let out; try { out = replyFor(msg, refOf, sent.length, sys); } catch (e) { console.log("stub error:", e.message); out = {answer: "stub error"}; }
      route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({content: [{type: "text", text: typeof out === "string" ? out : JSON.stringify(out)}], stop_reason: "end_turn", usage: {input_tokens: 100, output_tokens: 50}})});
    });
    await cx.addInitScript(seed => { window.__SB_TEST = true; window.__SB_OWN_KEYS = true;
      localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
      localStorage.setItem("studyboard:aiKeys", JSON.stringify({anthropic: "sk-ant-TESTTESTTESTTESTTEST"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({anthropic: {v: 1, at: 1}})); }, SEEDC);
    const pc = await cx.newPage(); pc.on("pageerror", e => errs.push(e.message)); pc.on("console", m => { if (/claude step/.test(m.text())) errs.push(m.text().slice(0, 300)); });
    await pc.goto(`http://127.0.0.1:${server.address().port}/index.html`); await pc.waitForFunction(() => window.SBCOMPTAB && window.__sbSync, null, {timeout: 30000}); await pc.waitForTimeout(500);
    await pc.evaluate(() => SBCOMPTAB.open()); await pc.waitForSelector("#cptIn");
    const say = async q => { await pc.evaluate(() => { if (!document.querySelector("#cptIn")) SBCOMPTAB.open(); }); await pc.waitForSelector("#cptIn");
      const n0 = await pc.evaluate(() => document.querySelectorAll(".cpt-a, .cpt-err").length);
      await pc.fill("#cptIn", q); await pc.click("#cptGo");
      await pc.waitForFunction(n => document.querySelectorAll(".cpt-a, .cpt-err").length > n && !document.querySelector("#cptGo").disabled, n0, {timeout: 120000}); // (Claude allows 20 requests a minute; these turns come faster than a student types, so some wait their turn)
      return pc.evaluate(() => { const l = [...document.querySelectorAll(".cpt-a, .cpt-err")].pop(); return l ? l.innerText.replace(/\s+/g, " ") : ""; }); };
    const task = id => pc.evaluate(i => window.__sbSync.state.tasks[i], id);
    // the data Claude needs goes with the message: due dates, status, marks and the calendar
    replyFor = (m, R) => ({answer: "Moved Care Plan 2 to Fri, Jan 11 2030.", changes: [{ref: R("Care Plan 2"), field: "due", value: "2030-01-11"}]});
    let a = await say("care plan 2 got extended by a day");
    const s0 = sent[sent.length - 1];
    ok(/due 2030-01-10/.test(s0.text) && /CALENDAR: /.test(s0.text) && /17\/20|Psych Quiz 1/.test(s0.text), "Claude is sent the whole planner (due dates, marks, a calendar)");
    ok((await task("t1")).due === "2030-01-11" && !(await pc.evaluate(() => !!document.querySelector("#asDlg[open]"))), "a change Claude lists is made at once, with no confirm box: " + a);
    // several changes in one message: all of them, one undo step
    replyFor = (m, R) => ({answer: "Marked both done.", changes: [{ref: R("Care Plan 2"), field: "status", value: "done"}, {ref: R("Lab Report"), field: "status", value: "done"}]});
    a = await say("tick off the care plan and the lab report");
    ok((await task("t1")).status === "done" && (await task("t2")).status === "done", "two changes in one message are both made: " + a);
    // the next request carries what really changed (old -> new), so "undo just the lab report part" can be done
    replyFor = (m, R, k) => ({answer: "Put Lab Report back.", changes: [{ref: R("Lab Report"), field: "status", value: "todo"}]});
    a = await say("undo just the lab report part");
    ok(/\[Studyboard changed: [^\]]*Lab Report[^\]]*Done/.test(sent[sent.length - 1].text) && (await task("t2")).status === "todo" && (await task("t1")).status === "done", "what each reply changed is in the conversation sent next, and part of it can be put back: " + a);
    replyFor = () => ({answer: "Undone.", undo: true});
    a = await say("never mind, undo that");
    ok((await task("t2")).status === "done", "\"undo\" reverses the last change: " + a);
    // a mark, a new event, a deck of cards Claude wrote
    replyFor = (m, R) => ({answer: "Saved 9/10.", changes: [{ref: R("Lab Report"), field: "mark", value: "9/10"}]});
    a = await say("lab report: 9/10 :)");
    ok(JSON.stringify((await task("t2")).mark || {}).includes('"got":9') && (await task("t2")).mark.outOf === 10, "a mark is saved on the task: " + a);
    replyFor = () => ({answer: "Added gym.", newEvents: [{title: "Gym", date: "2030-01-09", from: "07:00", to: "08:00"}]});
    a = await say("gym jan 9 7am");
    ok(await pc.evaluate(() => Object.values(window.__sbSync.state.events).some(e => e.title === "Gym" && e.date === "2030-01-09" && e.start === "07:00")), "an event is added with its time: " + a);
    // an event right after another the same day: "make it 30 min" changes the one named, not the one before it
    const D3 = (d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`)(new Date(Date.now() + 3 * 864e5));
    replyFor = () => ({answer: "Added.", newEvents: [{title: "Clinical orientation", date: D3, from: "08:00", to: "12:00"}, {title: "Meeting with Dr. Chen", date: D3, from: "12:00", to: "13:00"}]});
    await say("add clinical orientation 8-12 and a meeting with dr chen at noon on jan 11");
    replyFor = () => { const k = (new RegExp(`\\b(K\\d+) \\| \\w+ \\| ${D3} \\| 12:00-13:00 \\| Meeting with Dr\\. Chen`).exec(sent[sent.length - 1].text) || [])[1]; return {answer: "Made it 30 minutes.", changes: [{ref: k, item: "Meeting with Dr. Chen", field: "to", value: "12:30"}]}; };
    a = await say("make it 30 min");
    { const ev = await pc.evaluate(() => Object.values(window.__sbSync.state.events).map(e => `${e.title} ${e.start}-${e.end}`).join("; "));
      ok(/Meeting with Dr\. Chen 12:00-12:30/.test(ev) && /Clinical orientation 08:00-12:00/.test(ev), "an event's ref changes that event, not the one before it: " + ev + " " + a); }
    replyFor = () => ({answer: "Made Freud with 3 cards.", newDecks: [{name: "Freud", cards: [{front: "What does the id want?", back: "Everything now"}, {front: "What is the ego?", back: "Reality"}, {front: "What is the superego?", back: "Conscience"}]}]});
    a = await say("flashcards from my freud note");
    ok(await pc.evaluate(() => Object.values(window.__sbSync.state.decks).some(d => d.name === "Freud" && d.cards.length === 3)), "a deck of the cards Claude wrote is made: " + a);
    ok(/CARDS IN "Freud"/.test((replyFor = (m, R) => ({answer: "Kept 2.", changes: [{ref: R("What is the superego\\?"), field: "delete", value: "yes"}]}), await say("keep only 2"), sent[sent.length - 1].text)) && await pc.evaluate(() => Object.values(window.__sbSync.state.decks).find(d => d.name === "Freud").cards.length === 2), "the deck it just made is sent with its cards, so \"keep only 2\" works");
    // a change to something that isn't there is said plainly, never claimed
    replyFor = () => ({answer: "Moved it.", changes: [{ref: "T99", field: "due", value: "2030-02-01"}]});
    a = await say("move the thing to feb 1");
    ok(/couldn't/i.test(a), "a change that can't be made is said: " + a);
    // "done" with nothing listed: asked once more, and the answer that comes back is used
    replyFor = (m, R, k, sys) => /IMPORTANT: your last reply/.test(sys) ? {answer: "Set Care Plan 2 to high priority.", changes: [{ref: R("Care Plan 2"), field: "priority", value: "high"}]} : {answer: "I've set it to high priority."};
    a = await say("make the care plan high priority");
    ok((await task("t1")).priority === "high", "a reply claiming a change with none listed is asked again: " + a);
    // a question changes nothing (Claude lists nothing for it)
    replyFor = () => ({answer: "Yes, Psych Quiz 1 has 17/20."});
    const before = await pc.evaluate(() => JSON.stringify(window.__sbSync.state.tasks));
    a = await say("psych quiz 1 was 17/20 right?");
    ok(before === await pc.evaluate(() => JSON.stringify(window.__sbSync.state.tasks)), "a question changes nothing: " + a);
    // "undo that, I meant the lab report": the undo first, then the new change (the other way round the undo took back the new one)
    replyFor = (m, R) => ({answer: "Marked Care Plan 2 not done.", changes: [{ref: R("Care Plan 2"), field: "status", value: "todo"}]});
    await say("care plan 2 isn't done");
    replyFor = (m, R) => ({answer: "Put Care Plan 2 back and set Lab Report to in progress.", undo: true, changes: [{ref: R("Lab Report"), field: "status", value: "doing"}]});
    a = await say("oops I meant the lab report, undo that");
    ok((await task("t1")).status === "done" && (await task("t2")).status === "doing", "undo and a new change in one reply: the undo first: " + a);
    // a note Claude adds goes in the same undo step
    replyFor = () => ({answer: "Saved the note.", newNotes: [{text: "buy scrubs", board: ""}]});
    await say("sticky note: buy scrubs");
    replyFor = () => ({answer: "Took it off.", undo: true});
    a = await say("undo that");
    ok(!(await pc.evaluate(() => Object.values(window.__sbSync.state.notes).some(n => n.text === "buy scrubs"))) && !/nothing recent to undo/i.test(a), "\"undo\" takes back a note it added: " + a);
    // the same mark listed twice (on the task and on its grade row): made once, no "couldn't" for the other
    replyFor = (m, R) => ({answer: "Changed it to 18/20.", changes: [{ref: R("Psych Quiz 1"), field: "mark", value: "18/20"}, {ref: "G99", field: "mark", value: "18/20"}]});
    a = await say("psych quiz 1 is 18 now, they gave me a point back");
    ok((await task("t3")).mark.got === 18 && /couldn't/i.test(a), "a mark on a done task is changed (an unknown ref is still said): " + a);
    // a course's class times
    replyFor = (m, R) => ({answer: "Added the times.", newClasses: [{course: R("World History"), kind: "Lecture", days: "Mon, Wed", from: "10:00", to: "12:00"}]});
    a = await say("add history mondays and wednesdays 10-12");
    ok(await pc.evaluate(() => (window.__sbSync.state.courses.c2.meetings || []).some(m => m.start === "10:00" && m.end === "12:00" && m.days.join() === "1,3")), "a course's weekly class times are added: " + a);
    // an accessory it doesn't have isn't swapped for one it does
    replyFor = () => ({answer: "Putting it on!", wear: [{item: "festive beanie", on: true}]});
    a = await say("put the festive beanie on");
    ok(/haven't (unlocked|earned)/i.test(a) && !/Tiny Hat is on/i.test(a), "an accessory it doesn't have is said, not swapped: " + a);
    // no accessory named: nothing worn or recoloured in its place ("make packy purple", "darker" dyed the Tiny Hat)
    replyFor = () => ({answer: "I can't change my own colour."});
    await say("make packy purple");
    replyFor = () => ({answer: "Done, I've made my Tiny Hat dark plum.", wear: [{item: "Tiny Hat", color: "dark plum"}]});
    a = await say("darker");
    ok(/own colour can't change/i.test(a) && !/Tiny Hat dark plum/.test(a), "an accessory nobody named isn't recoloured instead: " + a);
    // a study session on a deck
    replyFor = (m, R) => ({answer: "Opening Heart to study.", study: R("Heart")});
    a = await say("study my heart deck");
    ok(/Opening Heart/.test(a) && await pc.waitForFunction(() => !!document.querySelector(`[data-act="fc-flip"], [data-act="fc-exit"]`), null, {timeout: 5000}).then(() => true, () => false), "\"study my heart deck\" starts a session: " + a);
    // the refs are Claude's, never shown to the student
    replyFor = () => ({answer: "Your Freud note (N1) and the Heart deck (D1) cover it."});
    a = await say("what covers the id?");
    ok(!/\(N1\)|\(D1\)|\bN1\b/.test(a) && /Freud note and the Heart deck/.test(a), "ref codes are taken out of the reply: " + a);
    // small talk isn't sent today's plan (it was brought into "hi" and "bye"); a question about the day is
    replyFor = () => ({answer: "Hi!"});
    await say("hey there"); await say("lol you're funny");
    const smallT = sent[sent.length - 1].text;
    await say("what should i do today");
    ok(!/TODAY'S PLAN|DO THIS NEXT/.test(smallT) && /HOW STUDYBOARD WORKS/.test(smallT), "small talk gets no plan to push (and the app guide always goes)");
    // an empty or placeholder reply is asked again, and never answered by the small models' steps
    replyFor = (m, R, k, sys) => /IMPORTANT: reply with one JSON object/.test(sys) ? {answer: "Here's your Wednesday."} : {answer: "placeholder"};
    a = await say("what does my wednesday look like");
    ok(/Here's your Wednesday/.test(a), "a placeholder reply is asked again: " + a);
    // a deleted task can be brought back and changed in one reply ("don't delete it, mark it done instead")
    replyFor = (m, R) => ({answer: "Deleted Lab Report.", changes: [{ref: R("Lab Report"), field: "delete", value: "yes"}]});
    await say("delete the lab report");
    replyFor = () => { const k = (/\b(X\d+) \| Lab Report/.exec(sent[sent.length - 1].text) || [])[1]; return {answer: "Brought it back and marked it done.", undo: true, changes: [{ref: k, item: "Lab Report", field: "status", value: "done"}]}; };
    a = await say("wait don't delete it, mark it done instead");
    ok((await task("t2") || {}).status === "done", "a task just deleted is sent with a ref, so undo plus \"mark it done\" works: " + a);
    // a discount worked out exactly: the price is its own number ("15% off a $48 jacket" was "$1 with 5% off")
    a = await say("whats 15% off a $48 jacket");
    ok(/\$48 with 15% off is \$40\.8/.test(a), "\"15% off a $48 jacket\" is $40.80: " + a);
    // a task deleted together with something added: a change on its X ref brings back just that task (undo took the added one too)
    replyFor = (m, R) => ({answer: "Deleted Care Plan 2 and added Care Plan 3.", changes: [{ref: R("Care Plan 2"), field: "delete", value: "yes"}], newTasks: [{title: "Care Plan 3", type: "Assignment", due: "2030-02-01"}]});
    await say("delete care plan 2 and add care plan 3 due feb 1 2030");
    replyFor = () => { const k = (/\b(X\d+) \| Care Plan 2/.exec(sent[sent.length - 1].text) || [])[1]; return {answer: "Brought Care Plan 2 back as done.", changes: [{ref: k, item: "Care Plan 2", field: "status", value: "done"}]}; };
    a = await say("wait don't delete care plan 2, mark it done instead");
    ok((await task("t1") || {}).status === "done" && await pc.evaluate(() => Object.values(window.__sbSync.state.tasks).some(t => t.title === "Care Plan 3")), "a deleted task is brought back on its own, and what was added with it stays: " + a);
    // a weekday that doesn't match its date is put right
    replyFor = () => ({answer: "Your exam is on Mon, Dec 5 2030."});
    a = await say("when's my exam");
    ok(/Thu, Dec 5/.test(a) || /Fri, Dec 5|Sat, Dec 5|Sun, Dec 5|Wed, Dec 5|Tue, Dec 5/.test(a) && !/Mon, Dec 5/.test(a), "a wrong weekday is corrected from the date: " + a);
    // a reply written as plain words instead of the JSON is the answer (it was thrown away and asked for again)
    replyFor = () => "Friday has clinical orientation from 8 to 12.";
    a = await say("and the day after?");
    ok(/Friday has clinical orientation/.test(a), "a plain-words reply is used as the answer: " + a);
    replyFor = () => ({answer: ""});
    a = await say("and thursday?");
    ok(/couldn't get a proper answer/.test(a) && !/add a card to Heart/.test(a), "no reply at all is said honestly, not answered by another step: " + a);
    ok(sent.every(x => /DOING THINGS/.test(x.sys) || /IMPORTANT/.test(x.sys)), "every chat request with Claude is the one step (no small-model intent step)");
    await cx.close();
  }
  // the on-device path never gets Claude's step
  ok(!(await p.evaluate(() => (window.__prompts || []).concat(window.__creates || []).some(x => /DOING THINGS/.test(x)))), "the on-device models never get Claude's step");
  ok(!errs.length, "no page errors: " + errs.join(" | "));
  await b.close(); server.close();
  console.log(`\n${n - fails}/${n} passed`); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
