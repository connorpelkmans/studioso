// Founders and Early Supporters in the app (99-early.js): the offer, the member card, friend codes, theme suggestions, a kept theme
const fs = require("fs"), path = require("path"), http = require("http"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const ROOT = path.join(__dirname, "..");
const SB = "https://early.supabase.test";
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("  ok " + m); };

const web = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p === "/") p = "/index.html";
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT)) { res.writeHead(404); res.end(); return; }
  fs.readFile(f, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, {"content-type": /\.html$/.test(p) ? "text/html" : /\.m?js$/.test(p) ? "text/javascript" : /\.css$/.test(p) ? "text/css" : "application/octet-stream"}); res.end(b); });
});

/* stand-in Supabase */
const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url");
const USER = {id: "22222222-2222-2222-2222-222222222222", aud: "authenticated", role: "authenticated", email: "me@example.com", app_metadata: {provider: "email"}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z"};
function mint(){
  const iat = Math.floor(Date.now() / 1000), exp = iat + 3600;
  return {access_token: b64({alg: "HS256", typ: "JWT"}) + "." + b64({sub: USER.id, exp, iat, role: "authenticated", aud: "authenticated"}) + ".sig", token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: "rt", user: USER};
}
const S = {early: null, saves: []};
async function handle(route){
  const req = route.request(), u = new URL(req.url()), m = req.method();
  const send = (status, body) => route.fulfill({status, contentType: "application/json", headers: {"access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*", "access-control-expose-headers": "*"}, body: body === undefined ? "" : JSON.stringify(body)});
  if (m === "OPTIONS") return send(200);
  if (u.pathname === "/auth/v1/token") return send(200, mint());
  if (u.pathname === "/auth/v1/user") return send(200, USER);
  if (u.pathname === "/rest/v1/rpc/studyboard_my_early" || u.pathname === "/rest/v1/rpc/studyboard_early_status") return send(200, S.early);
  if (u.pathname === "/rest/v1/rpc/founder_theme_save") {
    const a = JSON.parse(req.postData() || "{}"); S.saves.push(a);
    const t = S.early.themes.filter(x => x.slot !== a.p_slot);
    if (a.p_name) t.push({slot: a.p_slot, name: a.p_name, description: a.p_description, status: "suggested", themeId: null});
    S.early.themes = t.sort((x, y) => x.slot - y.slot);
    return send(200, {ok: true});
  }
  if (u.pathname.startsWith("/rest/v1/rpc/")) return send(404, {code: "PGRST202", message: "Could not find the function"});
  if (u.pathname === "/rest/v1/studyboard_config") return send(200, [{key: "paywall", value: true}]);
  if (u.pathname.startsWith("/rest/v1/")) {
    if (m === "GET") return /vnd\.pgrst\.object/.test(req.headers()["accept"] || "") ? send(406, {code: "PGRST116", message: "0 rows"}) : send(200, []);
    return send(201, m === "POST" ? [{updated_at: new Date().toISOString()}] : []);
  }
  return send(404, {});
}
async function open(browser, early, settings){
  S.early = early; S.saves = [];
  const ctx = await browser.newContext({serviceWorkers: "block", viewport: {width: 390, height: 844}});
  await ctx.route(SB + "/**", handle);
  await ctx.addInitScript(([sb, sess, settings]) => {
    if (sessionStorage.getItem("seeded")) return; sessionStorage.setItem("seeded", "1");
    localStorage.setItem("studioso:sb", JSON.stringify({url: sb, key: "anon-key"}));
    localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1");
    localStorage.setItem("studyboard:paywall-test", "1");
    localStorage.setItem("studioso-auth", sess);
    localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, settings: settings || {}, tasks: [], courses: []}));
  }, [SB, JSON.stringify(mint()), settings]);
  const page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push(e.message));
  await page.goto("http://127.0.0.1:" + web.address().port + "/");
  await page.waitForFunction(() => window.SBEARLY && window.PLAN !== undefined, null, {timeout: 15000}).catch(() => {});
  await page.waitForTimeout(2500);
  return {ctx, page, errs};
}
const act = (page, a, id) => page.evaluate(([a, id]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id || ""]);
const sheet = page => page.evaluate(() => { const d = document.querySelector("#dlg"); return d && d.open ? d.innerText.replace(/\s+/g, " ") : ""; });
const closeAll = page => page.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); document.querySelectorAll(".qod-pop,.qod").forEach(e => e.remove()); });

const FOUNDER = {on: true, founders: 10, supporters: 100, foundersLeft: 7, supportersLeft: 80, member: true, founder: true, number: 4, founderNumber: 3, term: "yearly",
  codes: [{code: "SB-AAAA-BBBB-CCCC", used: false, off: false, until: "2027-10-28T00:00:00Z"}, {code: "SB-DDDD-EEEE-FFFF", used: true, off: false, until: "2027-10-28T00:00:00Z"}, {code: "SB-GGGG-HHHH-JJJJ", used: false, off: false, until: "2027-10-28T00:00:00Z"}],
  themes: [], keep: []};

(async () => {
  await new Promise(r => web.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch({executablePath});
  try {
    // Not a member yet, on the free plan: the Pro sheet offers the places left
    let {ctx, page, errs} = await open(browser, {on: true, founders: 10, supporters: 100, foundersLeft: 7, supportersLeft: 80, member: false});
    await closeAll(page);
    await act(page, "plan-open"); await page.waitForTimeout(400);
    let t = await sheet(page);
    ok(/Become a Founder/.test(t) && /7 of 10 places left/.test(t) && /80 left/.test(t), "the Pro sheet shows the Founder offer and the places left: " + t.slice(0, 240));
    ok(!errs.length, "no page errors: " + errs.join("; "));
    await ctx.close();

    // Program off: nothing is shown
    ({ctx, page, errs} = await open(browser, {on: false, member: false}));
    await closeAll(page);
    await act(page, "plan-open"); await page.waitForTimeout(400);
    ok(!/Founder|Early Supporter/.test(await sheet(page)), "with the program off the Pro sheet says nothing about it");
    await ctx.close();

    // A Founder whose Pro has ended
    ({ctx, page, errs} = await open(browser, JSON.parse(JSON.stringify(FOUNDER))));
    ok(await page.evaluate(() => SBEARLY.kind()) === "founder", "the app knows this account is a Founder");
    ok(await page.evaluate(() => /Founder #3/.test(document.body.innerText)), "a one-time welcome says Founder #3");
    await closeAll(page);
    await act(page, "plan-open"); await page.waitForTimeout(400);
    t = await sheet(page);
    ok(/Founder #3/.test(t) && /Show My Founder Badge in Groups/.test(t), "the Pro sheet has the Founder card with the badge switch");
    ok(await page.locator("#dlg .ec-codes li").count() === 3 && await page.locator('#dlg [data-act="early-copy"]').count() === 2 && /Used/.test(t), "the friend codes are listed, the used one marked Used");
    ok(!/Show My Badge in Groups/.test(t), "the plain Pro badge switch isn't shown twice");
    await page.click('#dlg [data-act="pro-badge"]'); await page.waitForTimeout(200);
    ok(await page.getAttribute('#dlg .early-card [data-act="pro-badge"]', "aria-checked") === "true", "the badge switch works without Pro");
    await act(page, "early-themes"); await page.waitForTimeout(300);
    ok(await page.locator("#earlyThemes fieldset").count() === 3, "the theme sheet has 3 suggestions");
    await page.fill('#earlyThemes [name="n1"]', "Ocean Glass");
    await page.fill('#earlyThemes [name="d1"]', "Sea glass greens and soft waves.");
    await page.fill('#earlyThemes [name="n2"]', "No description");
    await page.click("#ecSave"); await page.waitForTimeout(500);
    ok(/description for theme 2/.test(await page.locator("#ecMsg").innerText()), "a name without a description is caught before saving");
    await page.fill('#earlyThemes [name="n2"]', "");
    await page.click("#ecSave"); await page.waitForTimeout(900);
    ok(S.saves.length === 1 && S.saves[0].p_slot === 1 && S.saves[0].p_name === "Ocean Glass", "the suggestion is sent to the server: " + JSON.stringify(S.saves));
    ok(await page.evaluate(() => SBEARLY.mine().themes.length === 1), "the app reloads the saved suggestion");
    ok(!errs.length, "no page errors: " + errs.join("; "));
    await ctx.close();

    // A picked theme stays on for its Founder without Pro (here: Winter stands in for it)
    const kept = Object.assign(JSON.parse(JSON.stringify(FOUNDER)), {themes: [{slot: 1, name: "Snow Day", description: "x", status: "picked", themeId: "winter"}], keep: ["winter"]});
    ({ctx, page, errs} = await open(browser, kept, {style: {skin: "winter"}}));
    await page.waitForTimeout(1500);
    ok(await page.evaluate(() => document.documentElement.dataset.skin) === "winter", "the Founder keeps their picked theme without Pro");
    await ctx.close();
    ({ctx, page, errs} = await open(browser, Object.assign(JSON.parse(JSON.stringify(FOUNDER)), {keep: []}), {style: {skin: "winter"}}));
    await page.waitForTimeout(11000);
    ok(await page.evaluate(() => document.documentElement.dataset.skin || "classic") === "classic", "a Pro theme that isn't theirs still needs Pro");
    await ctx.close();
    console.log("early e2e ok (" + n + " checks)");
  } finally { await browser.close(); web.close(); }
})().catch(e => { console.error(e); process.exit(1); });
