// node tests/chat-controls.e2e.js: things the companion does at once, with no AI, however they're worded (stop, pause or resume the
// focus timer, time left, undo the last change), questions about the companion itself, and a reply that never comes not locking the chat
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
  await ctx.addInitScript(() => { window.__SB_TEST = true; window.__SB_DEVICE_AI_TEST = true; window.__asked = 0;
    // a model that never answers when asked to hang, else a fixed reply
    window.LanguageModel = {availability: async () => "available", create: async () => ({contextWindow: 6000, contextUsage: 100, destroy(){}, clone: async function(){ return this; },
      async prompt(){ window.__asked++; if (window.__hang) await new Promise(() => {}); return JSON.stringify({answer: "MODEL", found: true, followUps: [], actions: []}); }})};
    localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:whatsNew", JSON.stringify({v: "9.9.9"}));
    const d = x => { const t = new Date(); t.setDate(t.getDate() + x); return t.toISOString().slice(0, 10); };
    localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, files: [], notes: [], events: [], decks: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO 110", color: "#3B6FE0"}],
      tasks: [{id: "t1", title: "Homework 4", courseId: "c1", due: d(2), status: "todo", type: "Assignment"}, {id: "t2", title: "Practice Final Exam", courseId: "c1", due: d(5), status: "todo", type: "Exam"}]})); });
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}/index.html`); await p.waitForFunction(() => window.SBCOMPTAB && window.__sbDevAI, null, {timeout: 30000}); await p.waitForTimeout(600);
  await p.evaluate(() => SBCOMPTAB.open()); await p.waitForSelector("#cptIn");
  const chat = async q => { const n0 = await p.evaluate(() => document.querySelectorAll(".cpt-a, .cpt-err").length); await p.fill("#cptIn", q); await p.click("#cptGo");
    await p.waitForFunction(n => document.querySelectorAll(".cpt-a, .cpt-err").length > n && !document.querySelector("#cptGo").disabled && !/Thinking…|Looking/.test([...document.querySelectorAll(".cpt-a, .cpt-err")].pop().innerText), n0, {timeout: 20000}).catch(() => {});
    return p.evaluate(() => { const l = [...document.querySelectorAll(".cpt-a, .cpt-err")].pop(); return l ? l.innerText.split("\n")[0] : ""; }); };
  const pomo = () => p.evaluate(() => JSON.parse(localStorage.getItem("studioso:pomo") || "{}"));

  let a = await chat("start a 5 min timer im doing homework 4"); let t = await pomo();
  ok(t.running && t.taskId === "t1", "a timer starts for the task named: " + a);
  const a0 = await p.evaluate(() => window.__asked);
  for (const [q, re, check] of [["how much time is left on my timer", /\d+ minutes? left on your focus timer for Homework 4|less than a minute left/, x => x.running],
    ["pause the timer", /Paused your focus timer for Homework 4/, x => !x.running && x.left > 0], ["pause it again", /already paused/, x => !x.running],
    ["ok resume my focus session", /Resumed your focus timer/, x => x.running], ["stop my focus timer", /Stopped your focus timer for Homework 4/, x => !x.running && !(x.left > 0)],
    ["can u cancel the timer", /no focus timer running/, x => !x.running]]) {
    a = await chat(q); t = await pomo(); ok(re.test(a) && check(t), `"${q}": ${a}`); }
  ok(await p.evaluate(a0 => window.__asked === a0, a0), "none of that asked the AI");
  // undo the last change, however it's worded
  await p.evaluate(() => { const S = window.__sbSync, x = S.clone(S.state.tasks.t2); x.status = "done"; S.applyChanges([{kind: "task", id: "t2", after: x}], "Practice Final Exam marked done"); });
  a = await chat("reverse the change");
  ok(/Undone: Practice Final Exam marked done/.test(a) && await p.evaluate(() => window.__sbSync.state.tasks.t2.status === "todo"), "reverse the change undoes it: " + a);
  a = await chat("undo that");
  ok(/Undone: Homework 4 moved to In Progress/.test(a), "the next undo takes back the step before (starting the timer moved the task): " + a);
  a = await chat("undo");
  ok(/nothing recent to undo/.test(a), "with nothing left to undo, it says so: " + a);
  // the companion itself
  a = await chat("what are you wearing?"); ok(/wearing|Wardrobe/.test(a) && !/MODEL/.test(a), "what it's wearing comes from its settings: " + a);
  a = await chat("who are you"); ok(/^I'm Mochi/.test(a), "who it is: " + a);
  // a reply that never comes: given up on, and the chat works again
  await p.evaluate(() => { window.__CHAT_MAX = 2500; window.__hang = true; });
  a = await chat("write me a short poem about my week");
  ok(/took too long/.test(a), "a reply that never comes is given up on: " + a);
  ok(await p.evaluate(() => !document.querySelector("#cptGo").disabled), "and the chat can be used again");
  await p.evaluate(() => { window.__hang = false; });
  a = await chat("stop the timer"); ok(/no focus timer running/.test(a), "the next message is answered: " + a);
  ok(!errs.length, "no page errors: " + errs.join(" | "));
  await b.close(); server.close();
  console.log(`\n${n - fails}/${n} passed`); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
