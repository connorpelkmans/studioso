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
  const env = {ANTHROPIC_API_KEY: "sk-test", SUPABASE_URL: "https://sb.test", SUPABASE_KEY: "k"};
  const W = {tier: "paid", meters: new Map(), ceilings: new Map(), sent: []};
  const deps = {
    user: async tok => tok === "t" ? {id: "0b6f2a1c-1d2e-4f50-8a9b-0c1d2e3f4a5b", confirmed: true, anonymous: false} : null,
    plan: async () => W.tier,
    meter: id => { if (!W.meters.has(id)) W.meters.set(id, new P.Meter(mem())); return W.meters.get(id); },
    ceiling: d => { if (!W.ceilings.has(d)) W.ceilings.set(d, new P.Ceiling(mem())); return W.ceilings.get(d); },
    claude: {
      create: async req => { W.sent.push(req); const sys = JSON.stringify(req.system || "");
        const data = /break|milestone|stage/i.test(sys) ? STAGES : {};
        return {content: [{type: "text", text: JSON.stringify(data)}], stop_reason: "end_turn", usage: {input_tokens: 1200, output_tokens: 300}}; },
      count: async () => 4000},
    embed: async texts => ({data: texts.map((t, i) => Array.from({length: 1024}, (_, k) => Math.sin(i + k)))}),
    whisper: async () => ({text: "Today we cover coral bleaching.", transcription_info: {duration: 30}})
  };
  const html = require("../scripts/csp").apply(require("../scripts/app-files").source().replace('const AI_PRO = "";', `const AI_PRO = "${PRO}";`));
  ok(html.includes(`const AI_PRO = "${PRO}";`), "test copy of the app points at the test Studyboard AI server");

  const browser = await chromium.launch({executablePath});
  const device = async ({keys, consent, ownKey} = {}) => {
    const ctx = await browser.newContext({viewport: {width: 1100, height: 900}, serviceWorkers: "block"});
    const seed = Object.assign({}, SEED, ownKey ? {settings: Object.assign({}, SEED.settings, {ai: {ownKey: true}})} : {});
    await ctx.addInitScript({content: `
      try { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1");
        localStorage.setItem("coursework:v2", ${JSON.stringify(JSON.stringify(seed))}); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("studyboard:uname:0b6f2a1c-1d2e-4f50-8a9b-0c1d2e3f4a5b", "student");
        ${keys ? `localStorage.setItem("studyboard:aiKeys", ${JSON.stringify(JSON.stringify(keys))});` : ""}
        ${consent ? `localStorage.setItem("studyboard:aiConsent", ${JSON.stringify(JSON.stringify(consent))});` : ""} } } catch (e) {}
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
    await ctx.route(/generativelanguage\.googleapis\.com/, route => { ctx.google++; route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({candidates: [{content: {parts: [{text: JSON.stringify(STAGES)}]}, finishReason: "STOP"}]})}); });
    const page = await ctx.newPage();
    page.on("pageerror", e => console.error("page error:", e.message));
    await page.goto(APP + "/");
    await page.waitForSelector("#view", {state: "attached"});
    return {ctx, page};
  };
  const aiPosts = ctx => ctx.calls.filter(c => c.path === "/v1/ai");
  const openAi = async page => { await page.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); const b = document.createElement("button"); b.dataset.act = "ai-setup"; document.body.appendChild(b); b.click(); b.remove(); }); await page.waitForSelector('#dlg[open] [data-key="gemini"]'); };
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

    // 3. The month's allowance used up: the student is told, and no request is sent
    const m = deps.meter("0b6f2a1c-1d2e-4f50-8a9b-0c1d2e3f4a5b"); m.now = () => Date.now() - 3 * 86400000;
    const lim = P.limitsFor("paid", P.config(env)), fill = lim.monthMicro - (await m.read()).spent - 5;
    const big = await m.reserve(fill, {...lim, dayMicro: 9e6}); assert(big.ok, "test setup: fill the month"); await m.settle(big.id, fill); m.now = () => Date.now();
    const before = W.sent.length;
    await A.page.waitForTimeout(6500); await A.page.click("#bdAi");
    await A.page.waitForSelector("dialog.ai-consent[open] #aiProTitle", {timeout: 10000}); 
    ok(/This Month's Studyboard AI/.test(await A.page.textContent("#aiProTitle")) && /resets on/.test(await A.page.textContent("dialog.ai-consent[open]")), "used up: the student is told when it resets and offered a free Gemini key");
    ok(W.sent.length === before, "and nothing reached Anthropic");
    await A.page.click("dialog.ai-consent[open] [data-no]");
    await A.ctx.close();

    // 4. Their own key once this month's is used up
    const B = await device({keys: {gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"}, consent: {gemini: {v: 1, at: 1}, studyboard: {v: 1, at: 1}}});
    await B.page.evaluate(() => __sbAi.proRefresh());
    ok(await B.page.evaluate(() => __sbAi.cfg().provider) === "gemini", "with the month used up, the student's own Gemini key takes over");
    await B.ctx.close();
    // a fresh month for the next students
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
  } finally { await browser.close(); }
  console.log(`ai-pro e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
