// Browser test for Studyboard's free AI trial: a signed-in student with no AI key.
// Run: node tests/ai-trial.e2e.js   (Playwright + Chromium; the app is served at https://app.test with AI_TRIAL set, supabase-js is replaced by
// a small stand-in that is signed in, and the trial Worker (cloudflare/ai-trial/src/trial.js) runs in this process with a fake model)
// Covers: the one-time "Turn On AI" message after sign-in with both ways to start; the trial banner in AI Features; a window that would start
// AI by itself (Break It Down) waits for a tap; the trial's own consent wording; a tap uses one try, answered by the trial; today's tries
// running out shows the Gemini prompt, which opens AI Features; used up for good; nothing reaches Google; with a key, no trial at all.
const path = require("path"), fs = require("fs"), assert = require("assert"), {pathToFileURL} = require("url");
const {chromium, executablePath} = require("./pw");
const ROOT = path.join(__dirname, ".."), APP = "https://app.test", TRIAL = "https://trial.test";
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SHOTS = process.env.SHOTS || "";   // a folder: also save screenshots of the message and the prompt
const TYPES = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json"};
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addD = k => { const d = new Date(); d.setDate(d.getDate() + k); return iso(d); };
const SEED = {v: 2, courses: [{id: "c1", name: "Marine Biology", code: "BIO210", color: "#3B6FE0"}], settings: {capacity: 15, dailyHours: 3}, updated: 1, tasks: [
  {id: "t1", title: "Research paper on coral reefs", courseId: "c1", type: "Assignment", due: addD(14), start: addD(0), hours: 12, status: "todo", priority: "med", notes: "Write a 6 page paper on coral bleaching. Use 5 scholarly sources and include 4 sections. Submit on the course site.", created: Date.now() - 864e5}]};
const STAGES = {kind: "paper", stages: [
  {title: "Pick a coral bleaching question and find sources", steps: ["Narrow to one question"], weight: 2, kind: "project"},
  {title: "Read the sources and take notes", steps: ["Quote the key findings"], weight: 3, kind: "reading"},
  {title: "Outline the four sections", steps: ["One sentence per section"], weight: 1.5},
  {title: "Write the six page draft", steps: ["Draft the body first"], weight: 4},
  {title: "Revise, cite and submit on the course site", steps: ["Check the citation style"], weight: 1.5}]};

// A signed-in supabase-js: the session is all the app needs here; every table read comes back empty.
const STUB = () => {
  const empty = () => { const b = new Proxy(function () {}, {get(_, m) { if (m === "then") return (ok) => Promise.resolve({data: [], error: null, count: 0}).then(ok); return () => b; }, apply() { return b; }}); return b; };
  const user = {id: "u1", email: "student@example.com", email_confirmed_at: "2026-10-01T00:00:00Z"};
  window.supabase = {createClient: () => ({
    auth: {getSession: async () => ({data: {session: {user, access_token: "t"}}}), onAuthStateChange: () => ({data: {subscription: {unsubscribe() {}}}}),
      signOut: async () => ({}), getUser: async () => ({data: {user}}), refreshSession: async () => ({data: {session: {user, access_token: "t"}}})},
    from: () => empty(), rpc: async () => ({data: null, error: null}),
    channel: () => { const ch = {on() { return ch; }, subscribe() { return ch; }}; return ch; }, removeChannel() {},
    storage: {from: () => ({upload: async () => ({error: {message: "no storage"}}), remove: async () => ({}), download: async () => ({error: {message: "no storage"}})})},
    functions: {invoke: async () => ({data: null, error: {message: "none"}})}
  })};
};

(async () => {
  const T = await import(pathToFileURL(path.join(ROOT, "cloudflare", "ai-trial", "src", "trial.js")).href);
  const mem = () => { const m = new Map(); return {get: async k => m.get(k), put: async (k, v) => { if (typeof k === "object") Object.entries(k).forEach(([x, y]) => m.set(x, y)); else m.set(k, v); },
    delete: async k => m.delete(k), deleteAll: async () => m.clear(), getAlarm: async () => null, setAlarm: async () => {}, deleteAlarm: async () => {}}; };
  const env = {SUPABASE_URL: "https://sb.test", SUPABASE_KEY: "k", TRIAL_USES: "3", DAILY_USES: "2"};
  const students = new Map(), pools = new Map(), runs = [];
  const deps = {
    user: async tok => tok === "t" ? {id: "u1", confirmed: true, anonymous: false} : null,
    student: id => { if (!students.has(id)) students.set(id, new T.Student(mem())); return students.get(id); },
    pool: day => { if (!pools.has(day)) pools.set(day, new T.Pool(mem())); return pools.get(day); },
    ai: {run: async (model, input) => { runs.push(input); return {choices: [{message: {content: JSON.stringify(STAGES)}}], usage: {prompt_tokens: 900, completion_tokens: 300}}; }}
  };
  const html = require("../scripts/csp").apply(fs.readFileSync(path.join(ROOT, "index.html"), "utf8").replace('const AI_TRIAL = "";', `const AI_TRIAL = "${TRIAL}";`));
  ok(html.includes(`const AI_TRIAL = "${TRIAL}";`), "test copy of the app points at the test trial server");

  const browser = await chromium.launch({executablePath});
  const device = async (keys) => {
    const ctx = await browser.newContext({viewport: {width: 1100, height: 900}, serviceWorkers: "block"});
    await ctx.addInitScript({content: `
      try { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1");
        localStorage.setItem("coursework:v2", ${JSON.stringify(JSON.stringify(SEED))}); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:tour", "done");
        ${keys ? `localStorage.setItem("studyboard:aiKeys", ${JSON.stringify(JSON.stringify(keys))}); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}}));` : ""} } } catch (e) {}
      (${STUB.toString()})();`});
    await ctx.route(`${APP}/**`, route => {
      const p = decodeURIComponent(new URL(route.request().url()).pathname);
      if (p === "/" || p === "/index.html") return route.fulfill({status: 200, contentType: "text/html", body: html});
      const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({status: 404, body: ""});
      route.fulfill({status: 200, contentType: TYPES[path.extname(f)] || "application/octet-stream", body: fs.readFileSync(f)});
    });
    ctx.trialCalls = [];
    await ctx.route(`${TRIAL}/**`, async route => {
      const r = route.request(); ctx.trialCalls.push(r.method() + " " + new URL(r.url()).pathname);
      const res = await T.handle(new Request(r.url(), {method: r.method(), headers: r.headers(), body: ["GET", "OPTIONS"].includes(r.method()) ? undefined : r.postData()}), env, deps);
      route.fulfill({status: res.status, headers: Object.fromEntries(res.headers), body: res.status === 204 ? "" : Buffer.from(await res.arrayBuffer())});
    });
    ctx.google = 0;
    await ctx.route(/generativelanguage\.googleapis\.com/, route => { ctx.google++; route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(STAGES)}]}, finishReason: "STOP"}]})}); });
    await ctx.route(/aistudio\.google\.com/, route => route.fulfill({status: 200, contentType: "text/html", body: "AI Studio"}));
    const page = await ctx.newPage();
    page.on("pageerror", e => console.error("page error:", e.message));
    await page.goto(APP + "/");
    await page.waitForSelector("#view", {state: "attached"});
    return {ctx, page};
  };
  const aiCalls = ctx => ctx.trialCalls.filter(c => c === "POST /v1/ai").length;
  const openTask = async (page, id) => {
    const row = page.locator(`#view [data-act="edit-task"][data-id="${id}"]:visible`);
    if (!(await row.count())) await page.evaluate(() => { const b = document.querySelector('[data-act="bview"][data-id="board"]'); if (b) b.click(); });
    await row.first().click(); await page.waitForSelector("#dlg[open]");
  };
  const openBreakdown = async page => { await page.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); }); await openTask(page, "t1"); await page.click('#dlg [data-act="bd-open"]'); await page.waitForSelector("#bdList li"); };
  const openAi = async page => { await page.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); const b = document.createElement("button"); b.dataset.act = "ai-setup"; document.body.appendChild(b); b.click(); b.remove(); }); await page.waitForSelector("#aiPaste"); };

  try {
    // ---- 1. After sign-in with no key: one message, two ways to start.
    const A = await device(null);
    await A.page.waitForFunction(() => /Turn On AI/.test((document.querySelector("#dlg[open] h2") || {}).textContent || ""), null, {timeout: 20000});
    const welcome = await A.page.textContent("#dlg");
    ok(/free Gemini key/.test(welcome) && /try AI first/i.test(welcome), "the sign-in message offers a Gemini key or a free try");
    ok(/3 free tries \(up to 2 a day\)/.test(welcome), "with the student's real numbers from the trial server");
    ok(A.ctx.trialCalls.includes("GET /v1/trial"), "it asked the trial server how many tries are left");
    if (SHOTS) await A.page.locator("#dlg").screenshot({path: path.join(SHOTS, "trial-welcome.png")});
    await A.page.click("#aiwTry");
    await A.page.waitForFunction(() => /AI is on to try/.test((document.querySelector("#toastMsg") || {}).textContent || ""));
    ok(true, "Try AI First closes it with a pointer to the AI buttons");
    await A.page.reload(); await A.page.waitForSelector("#view", {state: "attached"}); await A.page.waitForTimeout(3500);
    ok(!/Turn On AI/.test(await A.page.evaluate(() => document.querySelector("#dlg[open]") ? document.querySelector("#dlg").textContent : "")), "the message shows once per student");

    // ---- 2. AI Features says it's a trial.
    await openAi(A.page);
    await A.page.waitForFunction(() => /trying AI for free: 3 tries left/.test(document.querySelector("#dlg").textContent), null, {timeout: 8000});
    ok(true, "AI Features shows the trial and tries left");

    // ---- 3. A window that would start AI by itself waits for a tap; the tap asks consent with the trial's own wording.
    await openBreakdown(A.page);
    await A.page.waitForTimeout(1500);
    ok(aiCalls(A.ctx) === 0, "opening Break It Down used no try (it waits for a tap on the trial)");
    await A.page.click("#bdAi");
    await A.page.waitForSelector("dialog.ai-consent[open]");
    const consent = await A.page.textContent("dialog.ai-consent[open]");
    ok(/Cloudflare/.test(consent) && /Gemma/.test(consent) && /only a count of your tries/.test(consent) && !/with the API key you added/.test(consent), "consent names Cloudflare and says nothing is stored");
    await A.page.click("dialog.ai-consent[open] [data-yes]");
    await A.page.waitForFunction(() => /Used the AI/.test(document.querySelector("#bdAiMsg").textContent), null, {timeout: 10000});
    ok(aiCalls(A.ctx) === 1, "one tap, one try");
    ok((await A.page.$$eval("#bdList [data-f=title]", e => e.map(x => x.value)))[0] === STAGES.stages[0].title, "the trial's answer is used");
    ok(runs[0] && runs[0].messages[1].content.includes("coral bleaching") && runs[0].max_completion_tokens <= 1500, "the model got the assignment text, with output capped");

    // ---- 4. Today's tries run out: the next tap shows the Gemini prompt without asking the server, and it leads to AI Features.
    await A.page.waitForTimeout(6200); await A.page.click("#bdAi");
    await A.page.waitForFunction(() => /Used the AI/.test(document.querySelector("#bdAiMsg").textContent), null, {timeout: 10000});
    ok(aiCalls(A.ctx) === 2, "second try today");
    await A.page.waitForTimeout(6200); await A.page.click("#bdAi");
    await A.page.waitForSelector("dialog.ai-consent[open] #aiTrialTitle", {timeout: 8000});
    ok(/Today's Free Tries/.test(await A.page.textContent("#aiTrialTitle")) && /1 free try left in all/.test(await A.page.textContent("dialog.ai-consent[open]")), "out for today: the Gemini prompt, with what's left");
    ok(aiCalls(A.ctx) === 2, "no request was sent once today's tries were gone");
    if (SHOTS) await A.page.locator("dialog.ai-consent[open]").screenshot({path: path.join(SHOTS, "trial-out-today.png")});
    await A.page.click("dialog.ai-consent[open] [data-yes]");
    await A.page.waitForSelector("#aiPaste");
    ok(true, "Get My Free Gemini Key opens AI Features with Paste My Key");

    // ---- 5. Used up for good: the trial stops being offered and AI Features says so.
    env.TRIAL_USES = "2";
    await openAi(A.page); await A.page.waitForTimeout(800); await openAi(A.page);
    await A.page.waitForFunction(() => /used your free AI tries/.test(document.querySelector("#dlg").textContent), null, {timeout: 8000});
    ok(true, "used up: AI Features asks for the free Gemini key");
    ok(A.ctx.google === 0, "nothing was ever sent to Google on the trial");

    // ---- 6. With a key on the device: no message and no trial.
    const B = await device({gemini: "AIzaSyD-abcdefghijklmnopqrstuvwxyz_0123"});
    await B.page.waitForTimeout(4000);
    ok(!/Turn On AI/.test(await B.page.evaluate(() => document.querySelector("#dlg[open]") ? document.querySelector("#dlg").textContent : "")), "a student with a key gets no trial message");
    await openBreakdown(B.page);
    await B.page.waitForFunction(() => /Used the AI/.test(document.querySelector("#bdAiMsg").textContent), null, {timeout: 10000});
    ok(aiCalls(B.ctx) === 0 && B.ctx.google > 0, "their AI goes to Gemini, never the trial");

    console.log(`ai-trial e2e: ${n} checks passed`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
