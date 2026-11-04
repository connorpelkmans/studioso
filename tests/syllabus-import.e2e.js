// node tests/syllabus-import.e2e.js: Import a Syllabus marks what's already in the planner ("HW 3" is "Homework 3") for the course
// it's going to, and marks again when Add To changes; an AI answer that ran out of room says from when items may be missing and
// adds the later ones read on this device. Gemini is mocked.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const pad = x => String(x).padStart(2, "0");
const day = off => { const d = new Date(); d.setDate(d.getDate() + off); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const words = iso => { const [y, m, d] = iso.split("-").map(Number); return `${MON[m - 1]} ${d}, ${y}`; };
const SYL = `BIO 210 Cell Biology\nInstructor: Dr. Rosa Alvarez\n\nSchedule\n${words(day(9))} Homework 3 due\n${words(day(20))} Midterm exam\n${words(day(30))} Homework 4 due\n${words(day(60))} Final exam`;
// the AI got as far as the midterm, then ran out of room
const CUT = {course: {name: "Cell Biology", code: "BIO 210", links: []}, items: [{title: "HW 3", type: "Assignment", due: day(9), sure: true}, {title: "Midterm Exam", type: "Exam", due: day(20), sure: true}]};
const SEED = {v: 2, updated: 1, settings: {}, files: [], events: [], decks: [], notes: [],
  courses: [{id: "c1", name: "Cell Biology", code: "BIO 210", color: "#3B6FE0"}, {id: "c2", name: "Writing", code: "ENG 102", color: "#E0563B"}],
  tasks: [{id: "t1", title: "HW 3", courseId: "c1", type: "Assignment", due: day(9), start: day(0), status: "todo", priority: "med", notes: "", checklist: [], created: 5}]};
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const errs = [];
  try {
    const ctx = await browser.newContext({viewport: {width: 1100, height: 900}, serviceWorkers: "block"});
    await ctx.route(/generativelanguage\.googleapis\.com/, route => route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(CUT)}]}, finishReason: "MAX_TOKENS"}]})}));
    await ctx.route(/\/v1\/ai$/, route => route.fulfill({status: 500, body: "{}"}));
    await ctx.routeWebSocket(/supabase\.co/, ws => ws.close());
    await ctx.route(/supabase\.co/, r => r.abort());
    await ctx.addInitScript(seed => {
      window.__SB_TEST = true;
      try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
        localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } catch (e) {}
    }, SEED);
    const page = await ctx.newPage();
    page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.__sbSync); await page.waitForTimeout(500);
    const act = a => page.evaluate(a => { const b = document.createElement("button"); b.dataset.act = a; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); }, a);
    const rows = () => page.$$eval("#dlg[open] .imp-row", ls => ls.map(li => ({t: li.querySelector("[data-f=title]").value, on: li.querySelector("input[type=checkbox][data-n]").checked, flag: (li.querySelector(".imp-flag") || {}).textContent || ""})));
    const read = async useAI => {
      await act("import-syllabus"); await page.waitForSelector("#impRead", {state: "attached"});
      await page.evaluate(on => { const b = document.querySelector("#impAI"); if (b) b.checked = on; }, useAI);
      await page.click("#impPaste summary"); await page.fill("#impText", SYL); await page.click("#impRead");
      await page.waitForSelector("#dlg[open] .imp-row", {timeout: 15000});
    };

    // On this device: the course is matched by its code, and HW 3 is already there
    await read(false);
    let r = await rows();
    ok(await page.$eval("#impTarget", s => s.value) === "c1", "the syllabus goes to the course with its code");
    const hw = x => x.find(y => y.t === "Homework 3") || {};
    ok(!hw(r).on && /Already in your planner/.test(hw(r).flag), "Homework 3 is the HW 3 already in the planner: " + JSON.stringify(hw(r)));
    ok(r.filter(x => x.t !== "Homework 3").every(x => x.on), "the rest are ticked");
    await page.uncheck("#dlg[open] .imp-row:has(input[value='Final Exam']) input[type=checkbox][data-n]");
    await page.selectOption("#impTarget", "c2"); await page.waitForTimeout(150);
    r = await rows();
    ok(hw(r).on && !/Already/.test(hw(r).flag), "added to another course, it isn't a repeat any more");
    ok(!(r.find(x => x.t === "Final Exam") || {}).on, "and ticks you changed stay as you left them");
    ok(/Add 3 Tasks/.test(await page.textContent("#impAdd")), "the Add button counts again: " + await page.textContent("#impAdd"));
    await page.selectOption("#impTarget", "c1"); await page.waitForTimeout(150);
    r = await rows();
    ok(!hw(r).on && /Already in your planner/.test(hw(r).flag), "back to the first course: marked again");
    await page.click('#dlg .sheet-foot [data-act="close"]'); await page.waitForTimeout(250);

    // With AI that ran out of room
    await read(true);
    const status = await page.textContent("#impStatus");
    r = await rows();
    ok(/The AI ran out of room, so items after .+ may be missing\. 2 later items were found on this device and added/.test(status), "says the AI answer was cut short, and from when: " + status);
    ok(["Homework 4", "Final Exam"].every(t => r.some(x => x.t === t && /after the AI ran out of room/.test(x.flag))), "the later items read on this device are added, marked to check: " + JSON.stringify(r));
    ok(r.filter(x => /^(HW 3|Homework 3)$/.test(x.t)).length === 1 && r.filter(x => /Midterm/.test(x.t)).length === 1, "what the AI found isn't doubled");
    await page.click('#dlg .sheet-foot [data-act="close"]'); await page.waitForTimeout(250);
    ok(!errs.length, "no page errors: " + errs.join("; "));
    console.log(`syllabus-import: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
