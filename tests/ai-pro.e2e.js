// Browser test for Studyboard AI (included with Pro): the app against the real Worker logic (cloudflare/ai-pro/src/pro.js),
// with Anthropic, Whisper and the embeddings model faked
const path = require("path"), fs = require("fs"), assert = require("assert"), {pathToFileURL} = require("url");
const {chromium, executablePath} = require("./pw");
const ROOT = path.join(__dirname, ".."), APP = "https://app.test", PRO = "https://pro.test";
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const TYPES = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json"};
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addD = k => { const d = new Date(); d.setDate(d.getDate() + k); return iso(d); };
const SEED = {v: 2, courses: [{id: "c1", name: "Marine Biology", code: "BIO210", color: "#3B6FE0"}], settings: {capacity: 15, dailyHours: 3}, updated: 1, tasks: [
  {id: "t1", title: "Research paper on coral reefs", courseId: "c1", type: "Assignment", due: addD(14), start: addD(0), hours: 12, status: "todo", priority: "med", notes: "Write a 6 page paper on coral bleaching. Use 5 scholarly sources and include 4 sections.", created: Date.now() - 864e5}],
  notes: [{id: "n1", text: "Coral bleaching\nWarm water makes corals expel their algae.", color: "yellow", x: 40, y: 40, z: 1, courseId: "c1"}]};
const STAGES = {kind: "paper", stages: [
  {title: "Pick a coral bleaching question and find sources", steps: ["Narrow to one question"], weight: 2, kind: "project"},
  {title: "Read the sources and take notes", steps: ["Quote the key findings"], weight: 3, kind: "reading"},
  {title: "Outline the four sections", steps: ["One sentence per section"], weight: 1.5},
  {title: "Write the six page draft", steps: ["Draft the body first"], weight: 4},
  {title: "Revise, cite and submit", steps: ["Check the citation style"], weight: 1.5}]};
const STUB = () => {
  const empty = () => { const b = new Proxy(function () {}, {get(_, m) { if (m === "then") return (ok) => Promise.resolve({data: [], error: null, count: 0}).then(ok); return () => b; }, apply() { return b; }}); return b; };
  const user = {id: "0b6f2a1c-1d2e-4f50-8a9b-0c1d2e3f4a5b", email: "student@example.com", email_confirmed_at: "2026-10-01T00:00:00Z"};
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
  const P = await import(pathToFileURL(path.join(ROOT, "cloudflare", "ai-pro", "src", "pro.js")).href);
  const mem = () => { const m = new Map(); return {get: async k => m.get(k), put: async (k, v) => { if (typeof k === "object") Object.entries(k).forEach(([x, y]) => m.set(x, y)); else m.set(k, v); },
    deleteAll: async () => m.clear(), getAlarm: async () => null, setAlarm: async () => {}}; };
  const env = {CF_ACCOUNT_ID: "acct", AI_GATEWAY_ID: "gw", CF_AIG_TOKEN: "cf", SUPABASE_URL: "https://sb.test", SUPABASE_KEY: "k"};
  const W = {tier: "paid", meters: new Map(), sent: []};
  const deps = {
    user: async tok => tok === "t" ? {id: "0b6f2a1c-1d2e-4f50-8a9b-0c1d2e3f4a5b", confirmed: true, anonymous: false} : null,
    plan: async () => W.tier,
    meter: id => { if (!W.meters.has(id)) W.meters.set(id, new P.Meter(mem())); return W.meters.get(id); },
    claude: {
      create: async req => { W.sent.push(req); const sys = JSON.stringify(req.system || "");
        const data = /break|milestone|stage/i.test(sys) ? STAGES : {};
        return {content: [{type: "text", text: JSON.stringify(data)}], stop_reason: "end_turn", usage: {input_tokens: 1200, output_tokens: 300}}; },
      count: async () => 4000},
    embed: async texts => ({data: texts.map((t, i) => Array.from({length: 1024}, (_, k) => Math.sin(i + k)))}),
    whisper: async () => ({text: "Today we cover coral bleaching.", transcription_info: {duration: 30}})
  };
  const html = require("../scripts/csp").apply(require("../scripts/app-files").source().replace('const AI_PRO = "https://ai.studyboardapp.com";', `const AI_PRO = "${PRO}";`));
  ok(html.includes(`const AI_PRO = "${PRO}";`), "test copy of the app points at the test Studyboard AI server");

  const browser = await chromium.launch({executablePath});
  const device = async ({keys, consent, ownKey, proSeed} = {}) => {
    const ctx = await browser.newContext({viewport: {width: 1100, height: 900}, serviceWorkers: "block"});
    const seed = Object.assign({}, SEED, ownKey ? {settings: Object.assign({}, SEED.settings, {ai: {ownKey: true}})} : {});
    await ctx.addInitScript({content: `
      try { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1");
        localStorage.setItem("coursework:v2", ${JSON.stringify(JSON.stringify(seed))}); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("studyboard:uname:0b6f2a1c-1d2e-4f50-8a9b-0c1d2e3f4a5b", "student");
        ${keys ? `localStorage.setItem("studyboard:aiKeys", ${JSON.stringify(JSON.stringify(keys))});` : ""}
        ${consent ? `localStorage.setItem("studyboard:aiConsent", ${JSON.stringify(JSON.stringify(consent))});` : ""}
        ${proSeed ? `localStorage.setItem("studyboard:aiPro", JSON.stringify(Object.assign({uid: "0b6f2a1c-1d2e-4f50-8a9b-0c1d2e3f4a5b", at: Date.now()}, ${JSON.stringify(proSeed)})));` : ""} } } catch (e) {}
      window.__SB_TEST = true; (${STUB.toString()})();`});
    await ctx.route(`${APP}/**`, route => {
      const p = decodeURIComponent(new URL(route.request().url()).pathname);
      if (p === "/" || p === "/index.html") return route.fulfill({status: 200, contentType: "text/html", body: html});
      const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({status: 404, body: ""});
      route.fulfill({status: 200, contentType: TYPES[path.extname(f)] || "application/octet-stream", body: fs.readFileSync(f)});
    });
    ctx.calls = [];
    await ctx.route(`${PRO}/**`, async route => {
      const r = route.request(), u = new URL(r.url()); let body = r.postDataBuffer();
      if (r.method() === "POST" && u.pathname === "/v1/ai") { try { ctx.calls.push({path: u.pathname, body: JSON.parse(body.toString())}); } catch (e) { ctx.calls.push({path: u.pathname}); } }
      else ctx.calls.push({path: u.pathname, method: r.method()});
      const res = await P.handle(new Request(r.url(), {method: r.method(), headers: r.headers(), body: ["GET", "OPTIONS", "DELETE"].includes(r.method()) ? undefined : body}), env, deps);
      route.fulfill({status: res.status, headers: Object.fromEntries(res.headers), body: res.status === 204 ? "" : Buffer.from(await res.arrayBuffer())});
    });
    ctx.google = 0;
    ctx.claude = [];
    await ctx.route(/api\.anthropic\.com/, async route => { const r = route.request(), u = new URL(r.url()); const b = JSON.parse(r.postData() || "{}");
      if (u.pathname.endsWith("/count_tokens")) return route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({input_tokens: 3000})});
      ctx.claude.push({b, h: r.headers()}); const sys = JSON.stringify(b.system || "");
      route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({content: [{type: "text", text: JSON.stringify(/break|milestone|stage/i.test(sys) ? STAGES : {})}], stop_reason: "end_turn", usage: {input_tokens: 1200, output_tokens: 300}})}); });
    await ctx.route(/generativelanguage\.googleapis\.com/, route => { ctx.google++; route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(STAGES)}]}, finishReason: "STOP"}]})}); });
    const page = await ctx.newPage();
    page.on("pageerror", e => console.error("page error:", e.message));
    await page.goto(APP + "/");
    await page.waitForSelector("#view", {state: "attached"});
    return {ctx, page};
  };
  const aiPosts = ctx => ctx.calls.filter(c => c.path === "/v1/ai");
  const openAi = async page => { await page.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); const b = document.createElement("button"); b.dataset.act = "ai-setup"; document.body.appendChild(b); b.click(); b.remove(); }); await page.waitForSelector("#dlg[open] #aiSave"); };
  const openTask = async (page, id) => {
    const row = page.locator(`#view [data-act="edit-task"][data-id="${id}"]:visible`);
    if (!(await row.count())) await page.evaluate(() => { const b = document.querySelector('[data-act="bview"][data-id="board"]'); if (b) b.click(); });
    await row.first().click(); await page.click("#dlg #tvEdit"); await page.waitForSelector("#dlg[open] form.sheet");
  };

  try {
    // 1. A Pro student with no key of their own
    const A = await device({});
    await A.page.waitForFunction(() => { try { return __sbAi.cfg().provider === "studyboard"; } catch (e) { return false; } }, null, {timeout: 15000});
    ok(A.ctx.calls.some(c => c.path === "/v1/status"), "the app asked the server whether Studyboard AI is included");
    ok(true, "a Pro student with no key uses Studyboard AI");
    await openAi(A.page);
    const sheet = await A.page.textContent("#dlg");
    ok(/Studyboard AI is included with your Pro plan/.test(sheet) && /Nothing to set up/.test(sheet), "AI Features says it's included, nothing to set up");
    ok(await A.page.isChecked("#aiUsePro"), "with its switch on");
    ok(!/Google Gemini<\/b> by default|non-Pro users/.test(await A.page.innerHTML("#dlg")) && !(await A.page.$("#dlg .ai-steps")) && !/Free from Google AI Studio/.test(sheet), "a Pro student isn't walked through getting a free Gemini key");
    ok(!/Use a Paid Model Instead/.test(sheet) && !/These cost money/.test(sheet) && !(await A.page.$('#dlg [data-show="anthropic"], #dlg [data-show="openai"], #dlg [data-show="gemini"]')), "and has no separate Gemini, Claude or OpenAI boxes");
    ok(/Backup API Key/.test(sheet) && /Used if your Studyboard AI runs out\. Paste a Gemini, OpenAI or Claude key\./.test(sheet) && await A.page.isVisible("#aiBackupKey") && await A.page.isVisible("#aiBackupShow") && await A.page.isVisible("#aiBackupTest"), "one Backup API Key box, with Show and Test");
    ok(!/always runs in Studyboard AI Mode/.test(sheet), "and no note about a Claude key's Studyboard AI Mode");

    // 2. Break It Down: consent names Anthropic, then the request goes through the server
    await A.page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    await openTask(A.page, "t1"); await A.page.click('#dlg [data-act="bd-open"]'); await A.page.waitForSelector("#bdList li");
    await A.page.click("#bdAi");
    await A.page.waitForSelector("dialog.ai-consent[open]");
    const consent = await A.page.textContent("dialog.ai-consent[open]");
    ok(/Anthropic/.test(consent) && /doesn't store what you send/.test(consent) && /doesn't use it to train/.test(consent), "consent names Anthropic, and says nothing is stored or trained on");
    await A.page.click("dialog.ai-consent[open] [data-yes]");
    await A.page.waitForFunction(() => /Used the AI/.test((document.querySelector("#bdAiMsg") || {}).textContent || ""), null, {timeout: 15000});
    const bd = aiPosts(A.ctx).find(c => c.body && c.body.task === "breakdown");
    ok(bd && Array.isArray(bd.body.content) && bd.body.content[0].type === "text" && /coral bleaching/.test(bd.body.content.map(b => b.text || "").join(" ")), "the job went to Studyboard AI as content blocks, with the assignment text");
    ok(bd && !("model" in bd.body) && !("maxTokens" in bd.body) && !("temperature" in bd.body), "the app sends no model, cap or temperature (the server decides)");
    const sent = W.sent.find(r => /break|milestone|stage/i.test(JSON.stringify(r.system || "")));
    ok(sent && sent.model === "claude-haiku-5-5" && sent.output_config.effort === "high", "the server ran it on Haiku 5.5 at high effort");
    ok((await A.page.$$eval("#bdList [data-f=title]", e => e.map(x => x.value)))[0] === STAGES.stages[0].title, "and the answer is used");
    ok(A.ctx.google === 0, "nothing went to Google");
    for (let i = 0; i < 40 && !aiPosts(A.ctx).some(c => c.body && c.body.task === "plan"); i++) await A.page.waitForTimeout(250);
    const planJob = aiPosts(A.ctx).find(c => c.body && c.body.task === "plan"), planSent = W.sent.find(r => /expert study planner/i.test(JSON.stringify(r.system || "")));
    ok(planJob && planJob.body.auto === true && planSent && planSent.output_config.effort === "medium", "the automatic plan is sent as automatic, and runs on Haiku 5.5 at medium");

    // 3. The month's allowance used up: the student is told, and no request is sent
    const m = deps.meter("0b6f2a1c-1d2e-4f50-8a9b-0c1d2e3f4a5b"); m.now = () => Date.now() - 3 * 86400000;
    const lim = P.limits(env), fill = lim.monthMicro - (await m.read()).spent - 5;
    const big = await m.reserve(fill, {...lim, dayMicro: 9e6}); assert(big.ok, "test setup: fill the month"); await m.settle(big.id, fill); m.now = () => Date.now();
    const before = W.sent.length;
    await A.page.waitForTimeout(6500); await A.page.click("#bdAi");
    await A.page.waitForSelector("dialog.ai-consent[open] #aiProTitle", {timeout: 10000}); 
    ok(/This Month's Studyboard AI/.test(await A.page.textContent("#aiProTitle")) && /resets on/.test(await A.page.textContent("dialog.ai-consent[open]")), "used up: the student is told when it resets and offered a free Gemini key");
    ok(W.sent.length === before, "and nothing reached Anthropic");
    await A.page.click("dialog.ai-consent[open] [data-no]");
    await A.ctx.close();

    // 4. Their own Gemini key is only the backup: the month has room, today's allowance runs out on this job,
    //    and the job moves to their Gemini key with no message
    W.meters.clear();
    { const mb = deps.meter("0b6f2a1c-1d2e-4f50-8a9b-0c1d2e3f4a5b"), lb = P.limits(env), rb = await mb.reserve(lb.dayMicro - 500, lb); await mb.settle(rb.id, lb.dayMicro - 500); }
    const B = await device({keys: {gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"}, consent: {gemini: {v: 1, at: 1}, studyboard: {v: 1, at: 1}}});
    await B.page.evaluate(() => __sbAi.proRefresh());
    ok(await B.page.evaluate(() => __sbAi.cfg().provider) === "studyboard", "a paid Pro student with a Gemini key uses Studyboard AI first");
    await openTask(B.page, "t1"); await B.page.click('#dlg [data-act="bd-open"]'); await B.page.waitForSelector("#bdList li");
    await B.page.waitForTimeout(6500);
    if (!/Used the AI/.test(await B.page.evaluate(() => (document.querySelector("#bdAiMsg") || {}).textContent || ""))) await B.page.click("#bdAi");
    await B.page.waitForFunction(() => /Used the AI/.test((document.querySelector("#bdAiMsg") || {}).textContent || ""), null, {timeout: 15000});
    ok(aiPosts(B.ctx).some(c => c.body && c.body.task === "breakdown") && B.ctx.google > 0, "out of today's allowance on the server: the job moved to their Gemini key");
    ok(!(await B.page.$("dialog.ai-consent[open] #aiProTitle")), "with no used-up message (they have a backup)");
    ok(await B.page.evaluate(() => __sbAi.cfg().provider) === "gemini", "and their Gemini key carries on until it resets");
    await B.ctx.close();
    W.meters.clear();

    // 5. Their own key by choice
    const C = await device({keys: {gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"}, consent: {gemini: {v: 1, at: 1}}, ownKey: true});
    await C.page.evaluate(() => __sbAi.proRefresh());
    ok(await C.page.evaluate(() => __sbAi.cfg().provider) === "gemini", "a student who turned Studyboard AI off uses their own key");
    await openAi(C.page);
    ok(!(await C.page.isChecked("#aiUsePro")), "and the switch shows it off");
    await C.page.click("#aiUsePro");
    ok(await C.page.evaluate(() => __sbAi.cfg().provider) === "studyboard", "turning it back on switches to Studyboard AI");
    await C.ctx.close();

    // 6. A free account: the server says no, and the app never sends a job
    W.tier = "none";
    const D = await device({});
    await D.page.evaluate(() => __sbAi.proRefresh()); await D.page.waitForTimeout(500);
    ok(await D.page.evaluate(() => __sbAi.cfg().provider) !== "studyboard", "a free account doesn't get Studyboard AI");
    ok(aiPosts(D.ctx).length === 0, "and sent no AI job to the server");
    await D.ctx.close();
    W.tier = "paid";

    // 6b. A free account with a free Gemini key: exactly as before (Gemini, with no Studyboard AI requests)
    W.tier = "none";
    const D2 = await device({keys: {gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"}, consent: {gemini: {v: 1, at: 1}}});
    await D2.page.evaluate(() => __sbAi.proRefresh()); await D2.page.waitForTimeout(300);
    ok(await D2.page.evaluate(() => __sbAi.cfg().provider + "|" + __sbAi.cfg().model) === "gemini|auto", "a free account's Gemini key works as before (Gemini, Auto)");
    await openTask(D2.page, "t1"); await D2.page.click('#dlg [data-act="bd-open"]'); await D2.page.waitForSelector("#bdList li");
    await D2.page.waitForTimeout(6500);
    if (!/Used the AI/.test(await D2.page.evaluate(() => (document.querySelector("#bdAiMsg") || {}).textContent || ""))) await D2.page.click("#bdAi");
    await D2.page.waitForFunction(() => /Used the AI/.test((document.querySelector("#bdAiMsg") || {}).textContent || ""), null, {timeout: 15000});
    ok(D2.ctx.google > 0 && aiPosts(D2.ctx).length === 0, "and its jobs go to Gemini, none to Studyboard's server");
    await D2.ctx.close();
    W.tier = "paid";

    // 7. Search by meaning and the companion's Ask Me without a Gemini key
    const E = await device({consent: {studyboard: {v: 1, at: 1}}});
    await E.page.waitForFunction(() => { try { return __sbAi.cfg().provider === "studyboard"; } catch (e) { return false; } }, null, {timeout: 15000});
    await E.page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "search"; document.body.appendChild(b); b.click(); b.remove(); });
    await E.page.waitForFunction(() => window.__PRO_EMBED_SEEN, null, {timeout: 1}).catch(() => {});
    for (let i = 0; i < 40 && !E.ctx.calls.some(c => c.path === "/v1/embed"); i++) await E.page.waitForTimeout(250);
    ok(E.ctx.calls.some(c => c.path === "/v1/embed"), "search by meaning indexes through Studyboard AI (no Gemini key needed)");
    ok(await E.page.evaluate(() => window.SBCOMP && SBCOMP.askAvailable && SBCOMP.askAvailable()), "the companion's Ask Me is available on Studyboard AI");
    await E.ctx.close();
    const F = await device({keys: {anthropic: "sk-ant-test-key-0000000000"}, consent: {anthropic: {v: 1, at: 1}}, ownKey: true});
    await F.page.waitForTimeout(800);
    ok(await F.page.evaluate(() => __sbAi.cfg().provider) === "anthropic", "a student with only a Claude key uses Claude");
    ok(await F.page.evaluate(() => window.SBCOMP && SBCOMP.askAvailable && SBCOMP.askAvailable()), "and Ask Me is available with Claude too");
    await F.ctx.close();

    // 8. Your own Claude key in Studyboard AI Mode: the same rules, on this device
    W.tier = "none";
    const G = await device({keys: {anthropic: "sk-ant-test-key-0000000000"}, consent: {anthropic: {v: 1, at: 1}}});
    await G.page.evaluate(() => __sbAi.useOwnMode());
    ok(await G.page.evaluate(() => __sbAi.cfg().provider + "|" + __sbAi.cfg().model) === "anthropic|studyboard", "a Claude key in Studyboard AI Mode");
    await openTask(G.page, "t1"); await G.page.click('#dlg [data-act="bd-open"]'); await G.page.waitForSelector("#bdList li");
    // Break It Down runs the AI by itself when it opens with a key; tap only if it didn't
    await G.page.waitForTimeout(6500);
    if (!/Used the AI/.test(await G.page.evaluate(() => (document.querySelector("#bdAiMsg") || {}).textContent || ""))) await G.page.click("#bdAi");
    await G.page.waitForFunction(() => /Used the AI/.test((document.querySelector("#bdAiMsg") || {}).textContent || ""), null, {timeout: 15000});
    const own = G.ctx.claude.find(c => /break|milestone|stage/i.test(JSON.stringify(c.b.system || "")));
    const ref = P.buildRequest({system: "x", blocks: [{type: "text", text: "y"}], task: P.taskOf("breakdown")});
    ok(own && own.b.model === "claude-haiku-5-5" && own.b.output_config.effort === "high" && own.b.max_tokens === ref.max_tokens && JSON.stringify(own.b.thinking) === JSON.stringify(ref.thinking), "the same model, thinking and output cap as Studyboard AI for this job");
    ok(own && !("temperature" in own.b) && own.h["x-api-key"] === "sk-ant-test-key-0000000000", "sent with the student's own key, no temperature");
    ok(G.ctx.calls.filter(c => c.path === "/v1/ai").length === 0, "and nothing went through Studyboard's server");
    const spent = await G.page.evaluate(() => JSON.parse(localStorage.getItem("studyboard:ownAI") || "{}").spent || 0);
    ok(G.ctx.claude.length >= 1 && spent === G.ctx.claude.length * P.costOf({input_tokens: 1200, output_tokens: 300}), `every job (${G.ctx.claude.length}, automatic ones included) charged to this device's allowance at its real cost`);
    // fill this month's limit, then the next job is stopped before it reaches Anthropic
    await G.page.evaluate(lim => { const o = JSON.parse(localStorage.getItem("studyboard:ownAI") || "{}"); o.spent = lim - 5; localStorage.setItem("studyboard:ownAI", JSON.stringify(o)); }, P.limits({}).monthMicro);
    const n0 = G.ctx.claude.length;
    await G.page.waitForTimeout(6500); await G.page.click("#bdAi");
    await G.page.waitForSelector("dialog.ai-consent[open] #aiProTitle", {timeout: 10000});
    ok(/Claude Key's Monthly Limit/.test(await G.page.textContent("#aiProTitle")), "the same monthly limit stops it, with its own message");
    ok(G.ctx.claude.length === n0, "and nothing reached Anthropic");
    await G.ctx.close();
    W.tier = "paid";

    // 9. Adding a Claude key next to a Gemini key makes Claude the default (it used to sit unused behind Gemini)
    W.tier = "none";
    const K = await device({keys: {gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"}, consent: {gemini: {v: 1, at: 1}}});
    await openAi(K.page);
    ok((await K.page.inputValue("#aiDefault")).startsWith("gemini|"), "with only a Gemini key, Gemini is the default");
    await K.page.evaluate(() => { const d = document.querySelector("#dlg details.ai-paid:not(#aiHoIn)"); if (d) d.open = true; });
    await K.page.fill('[data-key="anthropic"]', "sk-ant-test-key-0000000000");
    await K.page.dispatchEvent('[data-key="anthropic"]', "change");
    ok(await K.page.inputValue("#aiDefault") === "anthropic|studyboard", "typing a Claude key switches the default to Claude (Studyboard AI Mode)");
    await K.ctx.close();
    W.tier = "paid";

    // 10. A file named like the question that's slow to read (a big download from Drive) doesn't hold up the chat
    W.tier = "none";
    const M = await device({keys: {anthropic: "sk-ant-test-key-0000000000"}, consent: {anthropic: {v: 1, at: 1}}});
    await M.page.waitForFunction(() => window.__sbSync && window.SBCOMPTAB);
    await M.page.evaluate(() => { window.SBFILETEXT = () => new Promise(r => setTimeout(() => r("Grade breakdown"), 15000));
      window.__sbSync.state.files.fg = {id: "fg", name: "Best Grade Breakdown.pdf", kind: "file", courseId: "c1", folderId: "", taskIds: [], desc: "", url: "", revs: [{assetId: "local:fg", name: "Best Grade Breakdown.pdf", size: 5000, type: "application/pdf", at: 1}]}; });
    await M.page.evaluate(() => SBCOMPTAB.open()); await M.page.waitForSelector("#cptIn");
    const n1 = M.ctx.claude.length, tq = Date.now();
    await M.page.fill("#cptIn", "What's my best grade so far"); await M.page.click("#cptGo");
    let chatAt = 0; for (let i = 0; i < 80 && !chatAt; i++) { if (M.ctx.claude.slice(n1).some(c => /You are \w+/.test(JSON.stringify(c.b.system || "")) && JSON.stringify(c.b.messages).includes("best grade"))) chatAt = Date.now() - tq; else await M.page.waitForTimeout(100); }
    ok(chatAt > 0 && chatAt < 4000, `with a file that takes 15 seconds to read, the question still reaches the AI in ${chatAt} ms`);
    await M.ctx.close();
    W.tier = "paid";

    // 11. Files get to the AI faster: read while the question is typed, then kept for next time
    W.tier = "none";
    const Q = await device({keys: {anthropic: "sk-ant-test-key-0000000000"}, consent: {anthropic: {v: 1, at: 1}}});
    await Q.page.waitForFunction(() => window.__sbSync && window.SBCOMPTAB && window.SBFILETEXT);
    await Q.page.evaluate(() => { window.__reads = 0;
      window.__sxBytes = async assetId => { if (assetId !== "a-slow") return null; window.__reads++; await new Promise(r => setTimeout(r, 2500)); return new TextEncoder().encode("Coral grade scale: an A is 90 percent or more."); };
      window.__sbSync.state.files.fs = {id: "fs", name: "Coral Grades.txt", kind: "file", courseId: "c1", folderId: "", taskIds: [], desc: "", url: "", revs: [{assetId: "a-slow", name: "Coral Grades.txt", size: 46, type: "text/plain", at: 1}]}; });
    await Q.page.evaluate(() => SBCOMPTAB.open()); await Q.page.waitForSelector("#cptIn");
    await Q.page.type("#cptIn", "what is the coral grade scale for an A", {delay: 90});
    const q0 = Q.ctx.claude.length; await Q.page.click("#cptGo");
    let sentQ = null; for (let i = 0; i < 60 && !sentQ; i++) { sentQ = Q.ctx.claude.slice(q0).find(c => JSON.stringify(c.b.messages).includes("coral grade scale for an A")); if (!sentQ) await Q.page.waitForTimeout(100); }
    ok(sentQ && JSON.stringify(sentQ.b.messages).includes("an A is 90 percent"), "a file that takes 2.5 seconds to download was read while the question was typed, and its text went with it");
    await Q.page.waitForTimeout(1500);
    const q1 = Q.ctx.claude.length, reads1 = await Q.page.evaluate(() => window.__reads);
    await Q.page.fill("#cptIn", "remind me what the coral grades file says"); await Q.page.click("#cptGo");
    let sentR = null; for (let i = 0; i < 60 && !sentR; i++) { sentR = Q.ctx.claude.slice(q1).find(c => JSON.stringify(c.b.messages).includes("coral grades file says")); if (!sentR) await Q.page.waitForTimeout(100); }
    ok(sentR && JSON.stringify(sentR.b.messages).includes("an A is 90 percent") && (await Q.page.evaluate(() => window.__reads)) === reads1 && reads1 === 1, "the next question uses the saved text: the file was downloaded once");
    await Q.ctx.close();
    W.tier = "paid";
    // 12. Pro's one Backup API Key box: the key's format says which company it's from, and it's saved where the separate boxes save it
    {
      const R = await device({keys: {gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"}, consent: {gemini: {v: 1, at: 1}, openai: {v: 1, at: 1}, anthropic: {v: 1, at: 1}, studyboard: {v: 1, at: 1}}});
      await R.page.waitForFunction(() => { try { return __sbAi.cfg().provider === "studyboard"; } catch (e) { return false; } }, null, {timeout: 15000});
      await openAi(R.page);
      ok(await R.page.inputValue("#aiBackupKey") === "AIzaTESTTESTTESTTESTTESTTEST12345" && /Saved: Google Gemini key/.test(await R.page.textContent("#aiBackupKind")), "a saved Gemini key shows in the backup box, named");
      ok(await R.page.evaluate(() => getComputedStyle(document.querySelector("#aiBackupKey")).webkitTextSecurity) === "disc", "masked");
      await R.page.click("#aiBackupShow");
      ok(await R.page.evaluate(() => getComputedStyle(document.querySelector("#aiBackupKey")).webkitTextSecurity) === "none" && await R.page.textContent("#aiBackupShow") === "Hide", "Show reveals it");
      const keysLS = () => R.page.evaluate(() => JSON.parse(localStorage.getItem("studyboard:aiKeys") || "{}"));
      const saveAi = async () => { await R.page.click("#aiSave"); await R.page.waitForFunction(() => !document.querySelector("#dlg[open] #aiSave"), null, {timeout: 5000}); await R.page.waitForTimeout(500); await R.page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close())); };
      await R.page.fill("#aiBackupKey", "sk-proj-abcdefghijklmnop0123456789");
      ok(/New: OpenAI ChatGPT key/.test(await R.page.textContent("#aiBackupKind")), "an sk-proj- key is read as OpenAI");
      await saveAi();
      ok(JSON.stringify(await keysLS()) === JSON.stringify({openai: "sk-proj-abcdefghijklmnop0123456789"}), "and saved as the OpenAI key, replacing the Gemini one");
      ok(await R.page.evaluate(() => __sbAi.cfg().provider) === "studyboard", "Studyboard AI is still used first");
      await openAi(R.page);
      ok(await R.page.inputValue("#aiBackupKey") === "sk-proj-abcdefghijklmnop0123456789" && /Saved: OpenAI ChatGPT key/.test(await R.page.textContent("#aiBackupKind")), "it shows again next time");
      await R.page.fill("#aiBackupKey", "sk-ant-test-key-0000000000");
      ok(/New: Anthropic Claude key/.test(await R.page.textContent("#aiBackupKind")), "an sk-ant- key is read as Claude");
      await saveAi();
      ok(JSON.stringify(await keysLS()) === JSON.stringify({anthropic: "sk-ant-test-key-0000000000"}), "and saved as the Claude key");
      await openAi(R.page);
      await R.page.fill("#aiBackupKey", "hello-not-a-key");
      await R.page.click("#aiSave");
      ok(/doesn't look like a Gemini, OpenAI or Claude key/.test(await R.page.textContent("#aiBackupMsg")) && await R.page.isVisible("#dlg[open] #aiSave"), "a key in no known format isn't saved");
      await R.page.click("#aiBackupTest");
      ok(/doesn't look like/.test(await R.page.textContent("#aiBackupMsg")), "and Test says so too");
      await R.page.fill("#aiBackupKey", "AIzaTESTTESTTESTTESTTESTTEST12345");
      await R.page.click("#aiBackupTest");
      await R.page.waitForFunction(() => /It works/.test(document.querySelector("#aiBackupMsg").textContent), null, {timeout: 10000});
      ok(R.ctx.google > 0, "Test checks a Gemini key with Google");
      await R.page.fill("#aiBackupKey", "");
      await saveAi();
      ok(JSON.stringify(await keysLS()) === "{}", "clearing the box removes the backup key");
      ok(await R.page.evaluate(() => __sbAi.cfg().provider) === "studyboard", "and Studyboard AI carries on");
      // turned off: the backup box is their key, and Save keeps it off
      await openAi(R.page);
      await R.page.click("#aiUsePro");
      ok(/Used while Studyboard AI is off/.test(await R.page.textContent("#aiBackupHint")), "with Studyboard AI off, the hint says the key is used instead");
      await R.page.fill("#aiBackupKey", "AIzaTESTTESTTESTTESTTESTTEST12345");
      await saveAi();
      ok(await R.page.evaluate(() => __sbAi.cfg().provider) === "gemini", "and saving keeps Studyboard AI off, using the key");
      await R.ctx.close();
    }

    // 13. A free account still gets the Gemini set-up, with the paid models, and no note about Studyboard AI Mode
    W.tier = "none";
    {
      const S = await device({keys: {anthropic: "sk-ant-test-key-0000000000"}, consent: {anthropic: {v: 1, at: 1}}});
      await S.page.evaluate(() => __sbAi.useOwnMode());
      await openAi(S.page);
      const t = await S.page.textContent("#dlg");
      ok(/Studyboard uses Google Gemini by default/.test(t) && await S.page.$("#dlg .ai-steps") && await S.page.isVisible('#dlg [data-key="gemini"]') && /Use a Paid Model Instead/.test(t) && await S.page.$('#dlg [data-key="anthropic"]') && await S.page.$('#dlg [data-key="openai"]'), "a free account sees the Gemini steps and the separate key boxes");
      ok(!(await S.page.$("#aiBackupKey")) && !/Backup API Key/.test(t), "and no backup box");
      ok(!/always runs in Studyboard AI Mode/.test(t) && !/This month: \d+% used/.test(t), "the Studyboard AI Mode note and its usage line are gone");
      await S.ctx.close();
    }
    W.tier = "paid";
  } finally { await browser.close(); }
  console.log(`ai-pro e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
