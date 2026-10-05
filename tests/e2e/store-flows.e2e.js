// Browser tests for the store-readiness flows, against a STUBBED Supabase client and a MOCK purchase bridge (both live only in this
// test, nothing here ships). Run: node tests/e2e/store-flows.e2e.js   (needs Playwright; see tests/pw.js)
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const root = path.join(__dirname, "..", "..");
const {chromium, executablePath} = require("../pw");
const TYPES = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2"};
const server = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split("?")[0]); if (p === "/") p = "/index.html";
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, {"Content-Type": TYPES[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(r);
});

/* The stub client. Everything the page calls is recorded in window.__sb.calls; behaviour is set by the test through window.__sb.cfg. */
const STUB = `(() => {
  const USER = {id: "11111111-2222-4333-8444-555555555555", email: "me@example.com"};
  const sbx = window.__sb = {calls: [], listeners: [], session: null, cfg: {}, ent: null};
  const rec = (name, ...a) => { sbx.calls.push([name, ...a]); };
  const sess = () => ({user: USER, access_token: "t"});
  const emit = (ev, s) => sbx.listeners.forEach(f => { try { f(ev, s); } catch (e) {} });
  sbx.emit = emit; sbx.USER = USER;
  const q = (table) => {
    const state = {table};
    const p = new Proxy(function () {}, {
      get(t, k) {
        if (k === "then") return res => res(table === "studyboard_entitlements" ? {data: sbx.ent, error: null} : table === "studyboard_config" ? {data: [{key: "paywall", value: true}], error: null} : {data: [], error: null});
        return () => p;
      }, apply() { return p; }
    });
    return p;
  };
  const auth = {
    getSession: async () => ({data: {session: sbx.session}}),
    onAuthStateChange: cb => { sbx.listeners.push(cb); return {data: {subscription: {unsubscribe() {}}}}; },
    signInWithPassword: async a => { rec("signInWithPassword", a); const r = sbx.cfg.signin || {}; if (r.error) return {data: null, error: {message: r.error}}; sbx.session = sess(); emit("SIGNED_IN", sbx.session); return {data: {session: sbx.session}, error: null}; },
    signUp: async a => { rec("signUp", a); return {data: {user: {identities: sbx.cfg.existing ? [] : [{}]}, session: null}, error: null}; },
    resend: async a => { rec("resend", a); return {data: {}, error: null}; },
    resetPasswordForEmail: async (e, o) => { rec("resetPasswordForEmail", e, o); return {data: {}, error: null}; },
    verifyOtp: async a => { rec("verifyOtp", a); if (a.token !== "123456") return {data: null, error: {message: "Token has expired or is invalid"}}; sbx.session = sess(); emit(a.type === "recovery" ? "PASSWORD_RECOVERY" : "SIGNED_IN", sbx.session); return {data: {session: sbx.session}, error: null}; },
    updateUser: async (a, o) => { rec("updateUser", a, o); if (sbx.cfg.needReauth && !a.nonce) return {data: null, error: {message: "Password update requires reauthentication"}}; return {data: {user: USER}, error: null}; },
    reauthenticate: async () => { rec("reauthenticate"); return {error: null}; },
    signOut: async o => { rec("signOut", o); sbx.session = null; emit("SIGNED_OUT", null); return {error: null}; }
  };
  const respond = (name, body) => {
    const h = sbx.cfg.fn && sbx.cfg.fn[name];
    if (!h) return name === "entitlement-token" ? {data: null, error: {message: "not found", context: {status: 404}}} : {data: {}, error: null};
    if (h.status && h.status >= 400) return {data: null, error: {message: "Edge Function returned a non-2xx status code", context: {status: h.status, json: async () => h.body || {}}}};
    return {data: h.body || {}, error: null};
  };
  window.supabase = {createClient: () => ({
    auth,
    from: t => { rec("from", t); return q(t); },
    rpc: async (n, a) => { rec("rpc", n, a); return {data: null, error: sbx.cfg.rpcError || null}; },
    functions: {invoke: async (n, o) => { rec("invoke", n, o && o.body); return respond(n, o && o.body); }},
    storage: {from: b => ({list: async (prefix, o) => { rec("storage.list", b, prefix); return {data: o.offset ? [] : (sbx.cfg.files || []), error: null}; }, remove: async paths => { rec("storage.remove", b, paths); return {data: [], error: null}; }, upload: async () => ({error: null}), createSignedUrl: async () => ({data: {signedUrl: ""}, error: null})})},
    channel: () => ({on() { return this; }, subscribe() { return this; }, unsubscribe() {} }), removeChannel() {}, removeAllChannels() {}
  })};
})();`;
/* The mock native purchase bridge: deterministic answers chosen by window.__bridge.next. */
const BRIDGE = `(() => {
  const b = window.__bridge = {log: [], next: {restore: "success", checkout: "success", manage: "success"}, delayMs: 50, message: ""};
  window.StudyboardNative = {platform: "ios", store: "app-store"};
  ["checkout", "restore", "manage"].forEach(a => window.addEventListener("studyboard:plan-" + a, ev => {
    ev.preventDefault(); b.log.push([a, ev.detail]);
    setTimeout(() => window.dispatchEvent(new CustomEvent("studyboard:purchase-result", {detail: {action: a, status: b.next[a], message: b.message}})), b.delayMs);
  }));
})();`;

const SB_CFG = JSON.stringify({url: "https://stub.supabase.co", key: "sb_publishable_stub_key_for_tests"});
let passed = 0;
async function newPage(browser, {signedIn = false, bridge = false, hash = "", cfg = {}, ent = null} = {}) {
  const ctx = await browser.newContext({viewport: {width: 1100, height: 900}});
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", e => errs.push(e.message));
  await page.addInitScript(STUB);
  if (bridge) await page.addInitScript(BRIDGE);
  await page.addInitScript(([c, signed, pay, cf, e]) => {
    try {
      localStorage.setItem("studioso:sb", c); localStorage.setItem("studioso:welcomed", "1");
      if (pay) localStorage.setItem("studyboard:paywall-test", "1");
      localStorage.setItem("studioso:tour:done", "1");
    } catch (x) {}
    window.__sb.cfg = cf; window.__sb.ent = e;
    if (signed) window.__sb.session = {user: window.__sb.USER, access_token: "t"};
  }, [SB_CFG, signedIn, bridge, cfg, ent]);
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html${hash}`);
  await page.waitForTimeout(900);
  return {ctx, page, errs};
}
const test = async (name, fn) => { try { await fn(); passed++; console.log("ok   " + name); } catch (e) { console.error("FAIL " + name + "\n" + (e.stack || e)); process.exitCode = 1; } };
const openMenu = async page => {   // Settings, Account category (two-pane layout on a wide screen)
  await page.locator('[data-act="menu"]:visible').first().click(); await page.waitForSelector("dialog[open] .us");
  await page.click('dialog[open] .us-cat[data-us="account"]'); await page.waitForTimeout(150);
};
const calls = (page, name) => page.evaluate(n => window.__sb.calls.filter(c => c[0] === n), name);
const dlgText = page => page.evaluate(() => { const d = document.querySelector("dialog[open]"); return d ? d.innerText : ""; });
const fillSubmit = async (page, fields) => { for (const [k, v] of Object.entries(fields)) await page.fill(`dialog[open] [name=${k}]`, v); await page.click("dialog[open] [data-submit]"); await page.waitForTimeout(250); };

(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch({executablePath});

  await test("sign up -> unverified/confirm state -> resend cooldown (survives reopening) -> wrong code -> verified", async () => {
    const {ctx, page, errs} = await newPage(browser);
    await page.waitForSelector("dialog[open] form.sb-acct");
    await page.click('dialog[open] [data-sbm="signup"]');
    assert.match(await dlgText(page), /Create Your Studyboard Account/);
    assert.match(await dlgText(page), /Privacy Policy/, "sign-up links to the privacy policy");
    await fillSubmit(page, {email: "new@example.com", password: "correct horse 7"});
    const t = await dlgText(page);
    assert.match(t, /Check Your Email/); assert.match(t, /If\s+new@example\.com\s+can be used/i); assert.match(t, /works on this device only/i);
    assert.equal((await calls(page, "signUp")).length, 1);
    await page.click("#sbResend"); await page.waitForTimeout(200);
    assert.equal((await calls(page, "resend")).length, 1);
    assert.match(await page.textContent("#sbResend"), /Send again in \d+s/); assert.ok(await page.isDisabled("#sbResend"));
    await page.click('dialog[open] [data-sbm="signin"]'); await page.click('dialog[open] [data-sbm="signup"]');   // away and back
    await fillSubmit(page, {email: "new@example.com", password: "correct horse 7"});
    assert.match(await page.textContent("#sbResend"), /Send again in \d+s/, "cooldown is still running after the sheet was re-opened");
    await fillSubmit(page, {code: "000000"});
    assert.match(await page.textContent("#sbMsg"), /didn't work or has expired/);
    await fillSubmit(page, {code: "123456"});
    await page.waitForTimeout(300);
    assert.ok(!(await page.evaluate(() => !!document.querySelector("dialog[open] form.sb-acct"))), "sheet closed after verifying");
    assert.deepEqual(errs, []); await ctx.close();
  });

  await test("sign up with an address that already has an account looks identical (no enumeration)", async () => {
    const {ctx, page} = await newPage(browser, {cfg: {existing: true}});
    await page.waitForSelector("dialog[open] form.sb-acct"); await page.click('dialog[open] [data-sbm="signup"]');
    await fillSubmit(page, {email: "taken@example.com", password: "correct horse 7"});
    const t = await dlgText(page); assert.match(t, /Check Your Email/); assert.ok(!/already/i.test(t.replace(/Already have an account\?/i, "")));
    await ctx.close();
  });

  await test("sign in: unconfirmed email moves to the confirm step and re-sends; wrong password gives the same words for every address", async () => {
    const {ctx, page} = await newPage(browser, {cfg: {signin: {error: "Email not confirmed"}}});
    await page.waitForSelector("dialog[open] form.sb-acct");
    await fillSubmit(page, {email: "u@example.com", password: "whatever12"});
    assert.match(await dlgText(page), /isn't confirmed yet/); assert.equal((await calls(page, "resend")).length, 1);
    await ctx.close();
    const b = await newPage(browser, {cfg: {signin: {error: "Invalid login credentials"}}});
    await b.page.waitForSelector("dialog[open] form.sb-acct");
    await fillSubmit(b.page, {email: "nobody@example.com", password: "whatever12"});
    assert.match(await b.page.textContent("#sbMsg"), /That email and password don't match/);
    await b.ctx.close();
  });

  await test("forgot password from sign-in: neutral message, code + new password", async () => {
    const {ctx, page} = await newPage(browser);
    await page.waitForSelector("dialog[open] form.sb-acct"); await page.click('dialog[open] [data-sbm="forgot"]');
    assert.match(await dlgText(page), /Reset Your Password/);
    await fillSubmit(page, {email: "ghost@example.com"});
    const t = await dlgText(page); assert.match(t, /Set a New Password/); assert.match(t, /If an account uses\s+ghost@example\.com/i);
    assert.equal((await calls(page, "resetPasswordForEmail")).length, 1);
    await fillSubmit(page, {code: "123456", password: "a-long-new-pass-9"});
    await page.waitForTimeout(300);
    const up = await calls(page, "updateUser"); assert.equal(up.length, 1); assert.equal(up[0][1].password, "a-long-new-pass-9");
    assert.equal((await calls(page, "verifyOtp"))[0][1].type, "recovery");
    await ctx.close();
  });

  await test("recovery link: new-password form needs confirm + strength, then succeeds", async () => {
    const {ctx, page} = await newPage(browser);
    await page.evaluate(() => window.__sb.emit("PASSWORD_RECOVERY", {user: window.__sb.USER}));
    await page.waitForSelector("dialog[open] [name=confirm]", {timeout: 3000});
    await page.fill("dialog[open] [name=password]", "abcdefgh"); await page.fill("dialog[open] [name=confirm]", "abcdefgh");
    assert.match(await page.textContent("#sbStrength"), /Strength: (Weak|Okay)/);
    await page.click("dialog[open] [data-submit]"); await page.waitForTimeout(150);
    assert.match(await page.textContent("#sbMsg"), /too easy to guess/);
    await fillSubmit(page, {password: "Tr1cky-Longer-Pass", confirm: "Different-Pass-123"});
    assert.match(await page.textContent("#sbMsg"), /don't match/);
    assert.equal((await calls(page, "updateUser")).length, 0);
    await fillSubmit(page, {password: "Tr1cky-Longer-Pass", confirm: "Tr1cky-Longer-Pass"});
    await page.waitForTimeout(300);
    assert.equal((await calls(page, "updateUser")).length, 1);
    assert.ok(/Password updated/.test(await page.evaluate(() => document.body.innerText)));
    await ctx.close();
  });

  await test("expired / used email link: clear message and a way to send a new one", async () => {
    const {ctx, page} = await newPage(browser, {hash: "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired"});
    await page.waitForSelector("dialog[open]", {timeout: 4000});
    const t = await dlgText(page); assert.match(t, /That Link Didn't Work/); assert.match(t, /expired or was already used/);
    await page.click('dialog[open] [data-sbm="forgot"]');
    assert.match(await dlgText(page), /Reset Your Password/);
    assert.ok(!/error_code/.test(await page.evaluate(() => location.href)), "the error is cleaned out of the address");
    await ctx.close();
  });

  await test("change password asks for re-authentication code when the server wants it (nonce)", async () => {
    const {ctx, page} = await newPage(browser, {signedIn: true, cfg: {needReauth: true}});
    await openMenu(page); await page.waitForSelector('[data-act="acct-pass"]');
    await page.click('[data-act="acct-pass"]');
    await fillSubmit(page, {current: "old-password-1", password: "Tr1cky-Longer-Pass", confirm: "Tr1cky-Longer-Pass"});
    assert.equal((await calls(page, "reauthenticate")).length, 1); assert.ok(await page.isVisible("#secCodeRow"));
    await fillSubmit(page, {code: "654321"});
    const up = await calls(page, "updateUser"); assert.equal(up[up.length - 1][1].nonce, "654321");
    await ctx.close();
  });

  const openDelete = async page => { await openMenu(page); await page.waitForSelector('[data-act="acct-delete"]'); await page.click('[data-act="acct-delete"]'); await page.waitForSelector("#delConfirm"); };

  await test("delete account: server function path, checklist screen, local wipe", async () => {
    const {ctx, page, errs} = await newPage(browser, {signedIn: true, cfg: {fn: {"delete-account": {body: {ok: true, deleted: {files_deleted: 3, stripe_subscriptions_cancelled: 1, account: true}, retained: ["Payment records stay with Stripe."]}}}}});
    await page.evaluate(() => localStorage.setItem("studyboard:marker", "x"));
    await openDelete(page);
    assert.ok(await page.isDisabled("#delGo"));
    await page.fill("#delConfirm", "delete"); assert.ok(!(await page.isDisabled("#delGo")));
    await page.fill("#delPw", "my-password");
    await page.click("#delGo"); await page.waitForSelector("#delDone", {timeout: 4000});
    const inv = (await calls(page, "invoke")).filter(c => c[1] === "delete-account");
    assert.equal(inv.length, 1); assert.equal(inv[0][2].confirm, "DELETE"); assert.equal(inv[0][2].password, "my-password");
    const t = await dlgText(page);
    assert.match(t, /Your Account Was Deleted/); assert.match(t, /3 deleted from storage/); assert.match(t, /card subscription \(cancelled/); assert.match(t, /What we keep/); assert.match(t, /Payment records stay with Stripe/);
    assert.equal((await calls(page, "rpc")).filter(c => c[1] === "studyboard_delete_my_account").length, 0, "no fallback when the function worked");
    assert.equal(await page.evaluate(() => localStorage.getItem("studyboard:marker")), null, "device wiped");
    assert.deepEqual(errs, []); await ctx.close();
  });

  await test("delete account: function not deployed -> client files + SQL RPC fallback", async () => {
    const {ctx, page} = await newPage(browser, {signedIn: true, cfg: {fn: {"delete-account": {status: 404}}, files: [{id: "f1", name: "a.pdf"}]}});
    await openDelete(page); await page.fill("#delConfirm", "DELETE"); await page.click("#delGo");
    await page.waitForSelector("#delDone", {timeout: 4000});
    assert.equal((await calls(page, "rpc")).filter(c => c[1] === "studyboard_delete_my_account").length, 1);
    assert.deepEqual((await calls(page, "storage.remove"))[0][2], ["11111111-2222-4333-8444-555555555555/a.pdf"]);
    assert.match(await dlgText(page), /fallback/);
    await ctx.close();
  });

  await test("delete account: App Store subscription needs acknowledgement; wrong password / reauth messages; nothing deleted on failure", async () => {
    const store = {status: 409, body: {error: "store_subscription", message: "Your Pro plan is billed by the App Store or Google Play."}};
    const {ctx, page} = await newPage(browser, {signedIn: true, cfg: {fn: {"delete-account": store}}});
    await openDelete(page); await page.fill("#delConfirm", "DELETE"); await page.click("#delGo"); await page.waitForTimeout(400);
    assert.ok(await page.isVisible("#delStore"), "acknowledgement checkbox revealed");
    assert.match(await page.textContent("#delMsg"), /billed by the App Store/);
    assert.ok(!(await page.isDisabled("#delGo")), "can try again");
    assert.equal((await calls(page, "rpc")).filter(c => c[1] === "studyboard_delete_my_account").length, 0);
    await page.evaluate(() => { window.__sb.cfg.fn["delete-account"] = {status: 403, body: {error: "wrong_password", message: "That password isn't right."}}; });
    await page.check("[name=ack]"); await page.click("#delGo"); await page.waitForTimeout(400);
    assert.match(await page.textContent("#delMsg"), /password isn't right/);
    const last = (await calls(page, "invoke")).filter(c => c[1] === "delete-account").pop();
    assert.equal(last[2].ack_store_subscription, true);
    assert.ok(!(await page.evaluate(() => !!document.querySelector("#delDone"))));
    await ctx.close();
  });

  const proSheet = async page => { await page.evaluate(() => StudyboardPlan.openSheet()); await page.waitForSelector(".plan-sheet"); };

  await test("Pro sheet in a store build: Restore Purchases via the native bridge (success), no website links, renewal wording + legal links", async () => {
    const {ctx, page, errs} = await newPage(browser, {signedIn: true, bridge: true});
    await proSheet(page);
    const t = await dlgText(page);
    assert.match(t, /auto-renewing subscription: \$2\.99 per month or \$19\.99 per year, after a 7-day free trial/);
    assert.match(t, /renews automatically unless it is cancelled at least 24 hours before/); assert.match(t, /Terms of Use/); assert.match(t, /Privacy Policy/);
    assert.ok(!(await page.evaluate(() => /stripe|checkout|studyboard\.example/i.test(document.querySelector("dialog[open]").innerHTML))), "no Stripe or website link in the store Pro sheet");
    assert.ok(await page.isVisible('dialog[open] [data-act="plan-restore"]'));
    // success: the bridge says success, then the plan is re-read; the server now says Pro
    await page.evaluate(() => { window.__sb.ent = {plan: "pro", source: "revenuecat", will_renew: true, pro_until: new Date(Date.now() + 864e5).toISOString()}; });
    await page.evaluate(() => { window.__bridge.delayMs = 700; });
    await page.click('dialog[open] [data-act="plan-restore"]');
    await page.waitForTimeout(120);
    assert.match(await page.textContent('dialog[open] [data-act="plan-restore"]'), /Restoring/); assert.ok(await page.isDisabled('dialog[open] [data-act="plan-restore"]'));
    await page.waitForFunction(() => /Purchases restored/.test(document.body.innerText), null, {timeout: 6000});
    assert.equal(await page.evaluate(() => window.__bridge.log.filter(l => l[0] === "restore").length), 1);
    assert.equal(await page.evaluate(() => window.__bridge.log[0][1].userId), "11111111-2222-4333-8444-555555555555");
    assert.equal(await page.evaluate(() => StudyboardPlan.isPro()), true, "plan refresh after restore");
    assert.deepEqual(errs, []); await ctx.close();
  });

  await test("Restore Purchases: nothing to restore, error, cancelled; reachable from Settings; refuses without sign-in; no double taps", async () => {
    const {ctx, page} = await newPage(browser, {signedIn: true, bridge: true});
    await openMenu(page); await page.waitForSelector('[data-act="plan-restore"]');   // Settings row
    const say = async () => { await page.waitForTimeout(500); return page.evaluate(() => [...document.querySelectorAll(".toast")].map(t => t.innerText).join(" | ")); };
    await page.evaluate(() => { window.__bridge.next.restore = "nothing"; });
    await page.click('[data-act="plan-restore"]'); await page.click('[data-act="plan-restore"]', {force: true}).catch(() => {});
    assert.match(await say(), /Nothing to restore/);
    assert.equal(await page.evaluate(() => window.__bridge.log.filter(l => l[0] === "restore").length), 1, "second tap while restoring is ignored");
    await page.waitForTimeout(3500);
    await page.evaluate(() => { window.__bridge.next.restore = "error"; window.__bridge.message = "Apple said no."; });
    await page.click('[data-act="plan-restore"]'); assert.match(await say(), /Apple said no/);
    await page.waitForTimeout(3500);
    await page.evaluate(() => { window.__bridge.next.restore = "cancelled"; });
    await page.click('[data-act="plan-restore"]'); assert.match(await say(), /Restore cancelled/);
    await ctx.close();
    const anon = await newPage(browser, {signedIn: false, bridge: true});
    await anon.page.evaluate(() => StudyboardPlan.openSheet()); await anon.page.waitForSelector(".plan-sheet");
    await anon.page.click('dialog[open] [data-act="plan-restore"]'); await anon.page.waitForTimeout(500);
    assert.match(await dlgText(anon.page), /Sign In|Welcome/, "asked to sign in first");
    assert.equal(await anon.page.evaluate(() => window.__bridge.log.length), 0, "no native call without an account");
    await anon.ctx.close();
  });

  await test("Buy in a store build uses the native sheet only and reports cancel / success", async () => {
    const {ctx, page} = await newPage(browser, {signedIn: true, bridge: true});
    await page.evaluate(() => { window.__bridge.next.checkout = "cancelled"; window.__opened = []; window.open = u => { window.__opened.push(u); return null; }; });
    await proSheet(page); await page.click('dialog[open] [data-act="plan-buy"][data-id="yearly"]');
    await page.waitForTimeout(600);
    assert.deepEqual(await page.evaluate(() => window.__bridge.log.map(l => [l[0], l[1].period])), [["checkout", "yearly"]]);
    assert.deepEqual(await page.evaluate(() => window.__opened), [], "no browser window was opened");
    assert.match(await page.evaluate(() => [...document.querySelectorAll(".toast")].map(t => t.innerText).join(" ")), /Purchase cancelled/);
    await ctx.close();
  });

  await test("Manage Plan in a store build goes to the bridge, never to Stripe", async () => {
    const {ctx, page} = await newPage(browser, {signedIn: true, bridge: true, ent: {plan: "pro", source: "stripe", will_renew: true, pro_until: new Date(Date.now() + 864e5).toISOString()}});
    await page.evaluate(() => { window.__opened = []; window.open = u => { window.__opened.push(u); return null; }; });
    await page.evaluate(() => StudyboardPlan.refresh()); await page.waitForTimeout(600);
    await proSheet(page); await page.click('dialog[open] [data-act="plan-manage"]'); await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => window.__bridge.log.filter(l => l[0] === "manage").length), 1);
    assert.deepEqual(await page.evaluate(() => window.__opened), []);
    await ctx.close();
  });


  /* ---------- the website account page, same stub idea ---------- */
  const SITE_CFG = `window.STUDYBOARD_SITE = {SUPABASE_URL: "https://stub.supabase.co", SUPABASE_ANON_KEY: "sb_publishable_stub_key_for_tests_0123456789", APP_URL: "https://app.example.test", SUPPORT_EMAIL: "x@example.test", RETURN_ALLOWLIST: [], FUNCTIONS: {checkout: "create-checkout", portal: "create-portal-session"}};`;
  const SITE_SB = `(() => { const L = []; const x = window.__w = {calls: [], L};
    const sess = {user: {id: "u1", email: "me@example.com"}, access_token: "t"};
    window.supabase = {createClient: () => ({
      auth: {getSession: async () => ({data: {session: x.session || null}}), onAuthStateChange: cb => { L.push(cb); return {data: {subscription: {unsubscribe() {}}}}; },
        signInWithPassword: async () => ({error: null}), signUp: async a => { x.calls.push(["signUp", a]); return {data: {session: null}, error: null}; },
        resend: async a => { x.calls.push(["resend", a]); return {error: null}; }, resetPasswordForEmail: async e => { x.calls.push(["reset", e]); return {error: null}; },
        verifyOtp: async a => { x.calls.push(["verify", a]); if (a.token !== "123456") return {error: {message: "Token has expired or is invalid"}}; L.forEach(f => f("PASSWORD_RECOVERY", sess)); return {data: {session: sess}, error: null}; },
        updateUser: async a => { x.calls.push(["update", a]); return {data: {}, error: null}; }, signOut: async o => { x.calls.push(["signOut", o]); return {error: null}; }},
      from: () => { const p = new Proxy(function () {}, {get: (t, k) => k === "then" ? (r => r({data: null, error: null})) : () => p, apply: () => p}); return p; }
    })}; })();`;
  async function sitePage(hash = "") {
    const ctx = await browser.newContext({viewport: {width: 420, height: 900}}), page = await ctx.newPage();
    await page.route("**/website/config.js", r => r.fulfill({contentType: "text/javascript", body: SITE_CFG}));
    await page.addInitScript(SITE_SB);   // the real library is pinned by an integrity hash, so the stub goes in before the page and the library file is not loaded
    await page.route("**/website/vendor/supabase-js*", r => r.fulfill({contentType: "text/javascript", body: "/* stub in use */"}));
    await page.goto(`http://127.0.0.1:${server.address().port}/website/account/index.html${hash}`); await page.waitForTimeout(500);
    return {ctx, page};
  }
  await test("website account: forgot password -> code step with resend cooldown -> recovery form needs confirm + strength", async () => {
    const {ctx, page} = await sitePage();
    await page.click("#tab-reset"); await page.fill("#form-reset [name=email]", "ghost@example.com"); await page.click("#form-reset button[type=submit]");
    await page.waitForSelector("#form-code:not([hidden])");
    assert.match(await page.textContent("#code-intro"), /If an account uses ghost@example\.com/);
    assert.match(await page.textContent("#code-resend"), /Send again in \d+s/); assert.ok(await page.isDisabled("#code-resend"));
    await page.fill("#form-code [name=code]", "000000"); await page.click("#form-code button[type=submit]"); await page.waitForTimeout(200);
    assert.match(await page.textContent("#auth-msg"), /didn't work or has expired/);
    await page.fill("#form-code [name=code]", "123456"); await page.click("#form-code button[type=submit]");
    await page.waitForSelector("#form-newpass:not([hidden])");
    await page.fill("#form-newpass [name=password]", "abcdefgh"); await page.fill("#form-newpass [name=confirm]", "abcdefgh");
    assert.match(await page.textContent("#np-strength"), /Strength/);
    await page.click("#form-newpass button[type=submit]"); assert.match(await page.textContent("#auth-msg"), /too easy to guess/);
    await page.fill("#form-newpass [name=password]", "Tr1cky-Longer-Pass"); await page.fill("#form-newpass [name=confirm]", "nope-nope-nope-1");
    await page.click("#form-newpass button[type=submit]"); assert.match(await page.textContent("#auth-msg"), /don't match/);
    assert.equal(await page.evaluate(() => window.__w.calls.filter(c => c[0] === "update").length), 0);
    await page.fill("#form-newpass [name=confirm]", "Tr1cky-Longer-Pass"); await page.click("#form-newpass button[type=submit]"); await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => window.__w.calls.filter(c => c[0] === "update").length), 1);
    await ctx.close();
  });
  await test("website account: expired email link shows a clear message and a 'Send a new link' action", async () => {
    const {ctx, page} = await sitePage("#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired");
    assert.match(await page.textContent("#auth-msg"), /expired or was already used/); assert.ok(await page.isVisible("#expired-new"));
    await page.click("#expired-new"); assert.ok(await page.isVisible("#form-reset"));
    await ctx.close();
  });

  await browser.close(); server.close();
  console.log(`\n${passed} e2e checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
