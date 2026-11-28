// node tests/launch.e2e.js: the launch tools in 99-launch.js (server side: supabase-launch.sql, tested with real PostgreSQL in
// tests/launch-sql.sh). The daily check-in (counted once a day, then only the version rule every 6 hours), the update switch
// (a broken version pauses syncing and asks to update; a nudge is a toast), the invite link's code kept for after sign-up,
// Invite Friends (signed in and not), and What's New (once, after an update, never for a brand-new student).
const path = require("path"), fs = require("fs"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const ROOT = path.join(__dirname, ".."), APP = "https://app.test", SHOTS = path.join(ROOT, "tests-out");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const TYPES = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".webp": "image/webp"};
const SEED = {v: 2, updated: 1, courses: [{id: "c1", name: "Biology", code: "BIO 110", color: "#3B6FE0"}], settings: {}, decks: [], notes: [], files: [], events: [],
  tasks: [{id: "t1", title: "Lab report", courseId: "c1", type: "Assignment", due: "2026-12-01", status: "todo"}]};
// a signed-in account, through a stand-in for supabase-js; rpc answers are set per test in window.__RPC
const STUB = () => {
  const empty = () => { const b = new Proxy(function () {}, {get(_, m) { if (m === "then") return ok => Promise.resolve({data: [], error: null, count: 0}).then(ok); return () => b; }, apply() { return b; }}); return b; };
  const user = {id: "0b6f2a1c-1d2e-4f50-8a9b-0c1d2e3f4a5b", email: "maya@example.com", email_confirmed_at: "2026-10-01T00:00:00Z"};
  window.__calls = [];
  window.supabase = {createClient: () => ({
    auth: {getSession: async () => ({data: {session: {user, access_token: "t"}}}), onAuthStateChange: () => ({data: {subscription: {unsubscribe() {}}}}),
      signOut: async () => ({}), getUser: async () => ({data: {user}}), refreshSession: async () => ({data: {session: {user, access_token: "t"}}})},
    from: () => empty(),
    rpc: async (fn, args) => { window.__calls.push({fn, args}); const R = window.__RPC || {}; if (fn === "my_age") return {data: 20, error: null};
      return fn in R ? {data: typeof R[fn] === "function" ? R[fn](args) : R[fn], error: null} : {data: null, error: null}; },
    channel: () => { const ch = {on() { return ch; }, subscribe() { return ch; }}; return ch; }, removeChannel() {},
    storage: {from: () => ({upload: async () => ({error: {message: "no"}}), remove: async () => ({}), download: async () => ({error: {message: "no"}})})},
    functions: {invoke: async () => ({data: null, error: {message: "none"}})}
  })};
};

(async () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const browser = await chromium.launch({executablePath});
  const device = async ({signedIn, seed, w = 1100, path: p = "/", extra = ""} = {}) => {
    const ctx = await browser.newContext({viewport: {width: w, height: w < 600 ? 844 : 900}, serviceWorkers: "block"});
    await ctx.addInitScript({content: `
      try { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1");
        ${seed === null ? "" : `localStorage.setItem("coursework:v2", ${JSON.stringify(JSON.stringify(seed || SEED))});`}
        localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:tour", "done");
        ${signedIn ? "" : `localStorage.setItem("studioso:sb", '"local"');`} } } catch (e) {}
      window.__SB_TEST = true; window.__SB_LAUNCH_TEST = true; ${extra}
      ${signedIn ? `(${STUB.toString()})();` : ""}`});
    await ctx.route(`${APP}/**`, route => {
      const q = decodeURIComponent(new URL(route.request().url()).pathname);
      if (q === "/" || q === "/index.html") return route.fulfill({status: 200, contentType: "text/html", body: html});
      const f = path.join(ROOT, q); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({status: 404, body: ""});
      route.fulfill({status: 200, contentType: TYPES[path.extname(f)] || "application/octet-stream", body: fs.readFileSync(f)});
    });
    // the check-in without an account goes straight to the database's REST address with the public key
    ctx.checkins = []; ctx.policy = {};
    await ctx.route(/supabase\.co\/rest\/v1\/rpc\/studyboard_checkin/, route => { ctx.checkins.push(JSON.parse(route.request().postData() || "{}"));
      route.fulfill({status: 200, contentType: "application/json", body: JSON.stringify({policy: ctx.policy})}); });
    await ctx.route(/supabase\.co\/(?!rest\/v1\/rpc\/studyboard_checkin)/, route => route.fulfill({status: 200, contentType: "application/json", body: "[]"}));
    const page = await ctx.newPage(); page.errs = [];
    page.on("pageerror", e => page.errs.push(e.message));
    await page.goto(APP + p);
    await page.waitForFunction(() => window.__sbSync && window.SBINVITE, null, {timeout: 20000});
    return {ctx, page};
  };

  // 1. No account: the check-in counts once a day; the rule is applied; a broken version pauses syncing
  { const {ctx, page} = await device({extra: `localStorage.setItem("studyboard:whatsNew", JSON.stringify({v: "1.15.8"}));`});
    await page.waitForTimeout(3800);
    ok(ctx.checkins.length === 1, "the app checks in once on opening: " + ctx.checkins.length);
    const c = ctx.checkins[0];
    ok(c.p_count === true && c.p_platform === "web" && /^\d+\.\d+\.\d+$/.test(c.p_version) && Object.keys(c).sort().join() === "p_count,p_platform,p_version",
      "it sends only the version, the kind of device and whether to count it (no id of any kind): " + JSON.stringify(c));
    ok(!(await page.$("#sbUpd")), "no update notice while the version is fine");
    ctx.policy = {bad: [c.p_version], message: "Version 1.15.8 can lose changes made offline."};
    await page.evaluate(() => SBINVITE.checkin());
    await page.waitForSelector("#sbUpd");
    ok(ctx.checkins[1].p_count === false, "a second check-in the same day isn't counted again");
    ok(await page.evaluate(() => window.__sbSyncPaused === true), "a version on the bad list pauses syncing");
    ok(/Update Studyboard to Keep Syncing/.test(await page.textContent("#sbUpd")) && /can lose changes/.test(await page.textContent("#sbUpd")), "and says so, with the reason given");
    ok(await page.textContent('#sbUpd [data-act="sb-update"]') === "Reload", "on the website the button reloads to the newest version");
    await page.screenshot({path: path.join(SHOTS, "launch-update-desk.png")});
    // it stays paused on the next opening, before the network answers
    ok(await page.evaluate(() => JSON.parse(localStorage.getItem("studyboard:versionPolicy")).bad.length === 1), "the rule is remembered for the next opening (offline too)");
    ctx.policy = {min: "0.1.0"};
    await page.evaluate(() => SBINVITE.checkin());
    await page.waitForFunction(() => !document.getElementById("sbUpd"));
    ok(await page.evaluate(() => window.__sbSyncPaused === false), "lifting the rule resumes syncing and removes the notice");
    ctx.policy = {min: "99.0.0"};
    await page.evaluate(() => SBINVITE.checkin()); await page.waitForSelector("#sbUpd");
    ok(true, "a version older than min is paused too");
    ctx.policy = {nudge: "99.0.0"};
    await page.evaluate(() => SBINVITE.checkin()); await page.waitForFunction(() => !document.getElementById("sbUpd"));
    await page.waitForFunction(() => /An update to Studyboard is ready/.test((document.querySelector(".toast") || {}).textContent || ""), null, {timeout: 6000});
    ok(true, "a nudge is only a toast, and syncing carries on");
    ok(await page.evaluate(() => SBINVITE.cmp("1.15.10", "1.15.9") === 1 && SBINVITE.cmp("1.15.8", "1.15.8") === 0 && SBINVITE.cmp("junk", "1.0.0") === 0), "versions compare by number (1.15.10 > 1.15.9), and junk never pauses");
    ok(!page.errs.length, "no page errors: " + page.errs.join(" | "));
    await ctx.close(); }

  // 2. Opening a friend's invite link: the code is kept for after sign-up and taken off the address
  { const {ctx, page} = await device({path: "/?group=ABCD-EFGH&from=Maya&ref=k7pq2mzx"});
    const r = await page.evaluate(() => ({p: JSON.parse(localStorage.getItem("studyboard:ref") || "null"), url: location.search}));
    ok(r.p && r.p.code === "K7PQ2MZX" && r.p.via === "group", "the invite code is kept, with where it came from: " + JSON.stringify(r.p));
    ok(!/ref=/.test(r.url), "and taken off the address: " + r.url);
    // signed out: Invite Friends asks for an account first
    await page.evaluate(() => SBINVITE.open()); await page.waitForSelector("dialog[open] .inv-sheet");
    ok(/Sign In or Create Account/.test(await page.textContent("dialog[open] .inv-sheet")), "Invite Friends without an account asks to sign in");
    await ctx.close(); }

  // 3. Signed in: the pending invite is claimed; Invite Friends shows the link and progress; a new reward is celebrated
  for (const w of [1100, 390]) {
    const {ctx, page} = await device({signedIn: true, w, extra: `
      localStorage.setItem("studyboard:ref", JSON.stringify({code: "K7PQ2MZX", via: "group", at: Date.now()}));
      localStorage.setItem("studyboard:refRewards", "0"); localStorage.setItem("studyboard:whatsNew", JSON.stringify({v: "1.15.8"}));
      window.__RPC = {studyboard_checkin: {policy: {}, rewards: 1}, studyboard_claim_invite: {ok: true},
        studyboard_my_invites: {code: "MAYA2345", need: 3, cap: 6, joined: 4, qualified: 3, toward: 2, waiting: 1, rewards: 1, year: 1, promo_until: new Date(Date.now() + 20 * 864e5).toISOString()}};`});
    await page.waitForTimeout(4200);
    const calls = await page.evaluate(() => window.__calls.map(c => c.fn));
    ok(calls.includes("studyboard_checkin") && calls.includes("studyboard_claim_invite"), w + "px: signed in, the check-in goes through the account and the invite is claimed: " + calls.join(","));
    ok(await page.evaluate(() => localStorage.getItem("studyboard:ref") === null), "the claimed invite is cleared");
    await page.waitForFunction(() => /earned a month of Pro free/.test((document.querySelector(".toast") || {}).textContent || ""), null, {timeout: 6000});
    ok(true, "a new reward is announced");
    await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "invite-friends"; document.body.appendChild(b); b.click(); b.remove(); });
    await page.waitForSelector("dialog[open] #invShare");
    const t = (await page.textContent("dialog[open] .inv-sheet")).replace(/\s+/g, " ");
    ok(/2 of 3/.test(t) && /1 friend joined/.test(t) && /earned 1 free month/.test(t) && /Studyboard AI Pro and extra storage aren't included/.test(t), "the sheet shows progress, who's waiting, what's earned and what the month includes");
    ok(/\?ref=MAYA2345$/.test(await page.inputValue("#invLink")), "with your link: " + await page.inputValue("#invLink"));
    ok(await page.evaluate(() => document.querySelectorAll(".inv-dot.on").length === 2), "two of the three dots filled");
    ok(await page.evaluate(() => SBINVITE.myCode() === "MAYA2345"), "your code is remembered, so group and deck invite links carry it");
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "no sideways scrolling");
    await page.screenshot({path: path.join(SHOTS, `launch-invite-${w < 600 ? "phone" : "desk"}.png`)});
    ok(!page.errs.length, "no page errors: " + page.errs.join(" | "));
    await ctx.close();
  }

  // 4. What's New: once after an update for someone who used the app before, never for a brand-new student
  for (const w of [1100, 390]) {
    const {ctx, page} = await device({w, extra: `window.__SB_WHATSNEW_TEST = true; localStorage.setItem("studyboard:whatsNew", JSON.stringify({v: "1.14.0"}));`});
    await page.waitForSelector("dialog[open] .wn-sheet", {timeout: 9000});
    ok(await page.evaluate(() => document.querySelectorAll(".wn-list li").length) === 3, w + "px: What's New shows the 3 biggest changes");
    await page.waitForTimeout(500);
    await page.screenshot({path: path.join(SHOTS, `launch-whatsnew-${w < 600 ? "phone" : "desk"}.png`)});
    await page.click('dialog[open] .sheet-foot [data-act="close"]');
    ok(await page.evaluate(() => JSON.parse(localStorage.getItem("studyboard:whatsNew")).v === "1.15.8" && window.__sbLaunch.whatsNewDue() === null), "and only once");
    await ctx.close();
  }
  { const {ctx, page} = await device({seed: null, extra: `window.__SB_WHATSNEW_TEST = true;`});
    await page.waitForTimeout(5000);
    ok(!(await page.$("dialog[open] .wn-sheet")), "a brand-new student doesn't get What's New");
    await ctx.close(); }

  await browser.close();
  console.log(`\nlaunch.e2e.js: ${n} checks passed`);
})().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
