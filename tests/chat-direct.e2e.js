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
    window.LanguageModel = {availability: async () => "available", create: async () => ({contextWindow: 6000, contextUsage: 100, destroy(){}, clone: async function(){ return this; },
      async prompt(t){ window.__prompts.push(String(t).slice(-400)); return JSON.stringify({intent: "add_note", text: "WRONG NOTE", board: "", answer: "MODEL ANSWER", found: true, followUps: [], actions: []}); }})};
    localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1");
    localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, files: [], notes: [], events: [], settings: {}, courses: [{id: "c1", name: "Reviewer Course", code: "REVC 101", color: "#3B6FE0"}, {id: "c2", name: "OCHEM", code: "CHEM 211", color: "#aa33aa"}],
      decks: [{id: "d1", name: "Connor Pelkmans", cards: [], created: 1}, {id: "d2", name: "Heart", created: 2, cards: [{id: "h1", front: "SA node", back: "natural pacemaker", box: 0, due: "", seen: 0, right: 0, wrong: 0}], aiQuizzes: [{id: "z1", title: "Cardiac Quiz", created: 5, results: [], questions: [{id: "q1", type: "single", stem: "What starts each heartbeat?", options: ["AV node", "SA node"], correct: [1]}, {id: "q2", type: "short", stem: "Name the chamber that pumps to the body", answer: "Left ventricle"}]}]}], tasks: [{id: "t1", title: "Lab 4", courseId: "c2", due: "2020-01-01", status: "todo"}]})); });
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}/index.html`); await p.waitForFunction(() => window.SBCOMPTAB && window.__sbDevAI, null, {timeout: 30000}); await p.waitForTimeout(600);
  await p.evaluate(() => SBCOMPTAB.open()); await p.waitForSelector("#cptIn");
  const chat = async q => { const n0 = await p.evaluate(() => document.querySelectorAll(".cpt-a, .cpt-err").length); await p.fill("#cptIn", q); await p.click("#cptGo");
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
  ok(!errs.length, "no page errors: " + errs.join(" | "));
  await b.close(); server.close();
  console.log(`\n${n - fails}/${n} passed`); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
