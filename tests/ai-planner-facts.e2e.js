// node tests/ai-planner-facts.e2e.js
// The companion's AI gets the planner's own facts: every mark (so "my best assignment mark" is answerable) and Today's Plan
// in the app's own order (so "what's after today's plan" follows it, not the due dates).
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": p.endsWith(".js") ? "text/javascript" : p.endsWith(".html") ? "text/html" : p.endsWith(".css") ? "text/css" : "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const pad = x => String(x).padStart(2, "0");
const day = k => { const d = new Date(); d.setDate(d.getDate() + k); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
let seq = 0;
const T = (id, title, course, due, w, mark, extra) => Object.assign({id, title, courseId: course, type: "Assignment", due, status: mark != null ? "done" : "todo", priority: "med", weight: w, hours: 3, created: 1000 + seq++}, mark != null ? {mark: Object.assign({got: mark, outOf: 100}, typeof mark === "object" ? mark : {})} : {}, extra || {});
const SEED = {v: 2, updated: 1, settings: {capacity: 15}, courses: [
  {id: "c1", name: "Nursing as a Profession", code: "BSNC 0010", color: "#3B6FE0"}, {id: "c2", name: "Practice of Nursing", code: "BSNC 1030", color: "#C0563A"}, {id: "c3", name: "Communication", code: "BSNC 1055", color: "#1E9E74"}],
  tasks: [
    T("m1", "Reflection 1", "c1", day(-30), 20, 88), T("m2", "Care Plan", "c2", day(-20), 25, 94), T("m3", "Interview Quiz", "c3", day(-12), 10, 71),
    Object.assign(T("m4", "Case Study 1", "c2", day(-9), 15, 0), {mark: {got: 37, outOf: 40}}),
    T("o1", "Sim (CH1) Reflection", "c2", day(4), 15, null), T("o2", "Professional Portfolio", "c1", day(16), 40, null, {hours: 12}),
    T("o3", "Module 8 Discussion post", "c3", day(12), 5, null, {hours: 1}), T("o4", "Assignment 2: Reflection on Relational Inquiry", "c3", day(5), 30, null)]};
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 800}});
    await ctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
      localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } } catch (e) {} }, SEED);
    await ctx.route(/generativelanguage\.googleapis\.com/, route => { ctx.last = route.request().postData(); route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify({answer: "ok", sources: [], followUps: [], actions: []})}]}, finishReason: "STOP"}]})}); });
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.SBCOMP && SBCOMP.tab && window.__sbPlan);
    await page.evaluate(() => SBCOMPTAB.open()); await page.waitForSelector("#cptIn");
    const askQ = async q => { ctx.last = null; await page.fill("#cptIn", q); await page.click("#cptGo"); await page.waitForFunction(() => true); for (let i = 0; i < 60 && !ctx.last; i++) await page.waitForTimeout(100); await page.waitForTimeout(400);
      const body = JSON.parse(ctx.last); return {text: body.contents[0].parts.map(p => p.text || "").join("\n"), sys: body.systemInstruction.parts[0].text}; };
    let {text, sys} = await askQ("what is my best individual assignment grade");
    ok(/MARKED WORK/.test(text) && !/TODAY'S PLAN/.test(text) && !/OPEN TASKS/.test(text), "a marks question sends the marks, not the plan or the task list");
    const mw = text.slice(text.indexOf("MARKED WORK"), text.indexOf("\n\n", text.indexOf("MARKED WORK")));
    ok(/MARKED WORK \(every item with a mark, 4 in all, highest first\)/.test(mw), "every marked item goes to the AI: " + mw.split("\n")[0]);
    ok(/^- Care Plan \(BSNC 1030, Assignment, worth 25% of the course/m.test(mw.split("\n")[1]) && /94%/.test(mw.split("\n")[1]), "highest first, with course, weight and mark: " + mw.split("\n")[1]);
    ok(/Case Study 1 .*37\/40 = 92\.5%/.test(mw), "a mark out of 40 is given as a percentage too");
    ok(mw.split("\n").pop().includes("Interview Quiz") && /71%/.test(mw.split("\n").pop()), "lowest last");
    ok(/MARKED WORK lists every mark entered/.test(sys) && /compare the percentages in MARKED WORK/.test(sys), "the AI is told the marks are complete and to compare them");
    ({text, sys} = await askQ("and the lowest?"));
    ok(/MARKED WORK/.test(text), "a follow-up keeps the topic of the question before it");
    ({text, sys} = await askQ("what task should I work on after I finish everything listed in todays plan"));
    ok(/TODAY'S PLAN/.test(text) && /OPEN TASKS/.test(text) && !/MARKED WORK/.test(text), "a plan question sends the plan and open tasks, not the marks");
    const plan = await page.evaluate(() => window.__sbPlan().ranked.filter(x => !x.fixed && !x.dead).map(x => x.title));
    const tp = text.slice(text.indexOf("TODAY'S PLAN"), text.indexOf("Study time left today"));
    const sent = [...tp.matchAll(/^\d+\. (.+?) \(BSNC/gm)].map(m => m[1]);
    ok(sent.length >= 4 && JSON.stringify(sent) === JSON.stringify(plan.slice(0, sent.length)), "Today's Plan goes over in the app's own order: " + sent.join(" > "));
    ok(/\[ON TODAY'S PLAN: /.test(tp) && /\[after today's plan\]/.test(tp), "each item says whether it's on today's plan or after it");
    ok(/follow TODAY'S PLAN's order exactly/.test(sys) && /never your own ranking/.test(sys), "and the AI is told to follow that order");
    await page.click('[data-act="cpt-new"]').catch(() => {});
    await page.evaluate(() => { const b = document.querySelector('[data-act="cpt-new"]'); if (b) b.click(); });
    ({text, sys} = await askQ("hi!"));
    const pl = text.slice(text.indexOf("THE STUDENT'S PLANNER"), text.indexOf("STUDENT'S QUESTION"));
    ok(!/COURSES|OPEN TASKS|MARKED WORK|TODAY'S PLAN|FILES/.test(pl), "small talk sends nothing from the planner but the date: " + pl.replace(/\s+/g, " ").slice(0, 120));
    ({text, sys} = await askQ("what's left in BSNC 1055?"));
    const ot = text.slice(text.indexOf("OPEN TASKS"), text.indexOf("\n\n", text.indexOf("OPEN TASKS")));
    ok(/OPEN TASKS FOR BSNC 1055/.test(ot) && /Module 8/.test(ot) && !/Professional Portfolio|Sim \(CH1\)/.test(ot), "naming a course sends only that course's tasks");
    ({text, sys} = await askQ("explain osmosis simply"));
    const pl2 = text.slice(text.indexOf("THE STUDENT'S PLANNER"), text.indexOf("STUDENT'S QUESTION"));
    ok(!/COURSES|OPEN TASKS|MARKED WORK|TODAY'S PLAN/.test(pl2), "a general question sends no planner parts");
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log("\nai-planner-facts.e2e: " + n + " checks passed");
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
