// node tests/age-gate.e2e.js: Studyboard accounts are for people 13 and older. Supabase is faked here (the server's own
// refusals are tested in supabase-functions/tools/test-functions.mjs and by running supabase-usernames.sql).
//  - email sign-up: a birthday under 13 makes no account, and the device remembers (an older birthday after that is refused too)
//  - Apple / Google / Microsoft (and any account with no birthday): asked once after signing in, can't be skipped;
//    under 13 deletes the account (delete-account, underage) and signs out
//  - an account with a birthday of 13 or more is never asked
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url");
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const yearsAgo = y => { const d = new Date(); d.setFullYear(d.getFullYear() - y); return ymd(d); };
const KID = yearsAgo(11), ADULT = yearsAgo(25);

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const errs = [];
  // S: the fake server's state for one browser. user: who signs in; age: what my_age answers (null = no birthday)
  const fake = async (ctx, S) => {
    S.calls = []; S.bodies = {};
    const user = () => Object.assign({aud: "authenticated", role: "authenticated", app_metadata: {provider: "google"}, user_metadata: {}}, S.user);
    const jwt = () => b64({alg: "HS256", typ: "JWT"}) + "." + b64({sub: S.user.id, aud: "authenticated", role: "authenticated", email: S.user.email, exp: Math.floor(Date.now() / 1000) + 3600}) + ".sig";
    await ctx.routeWebSocket(/supabase\.co/, ws => ws.close());
    await ctx.route(/supabase\.co/, async r => {
      const u = new URL(r.request().url()), m = r.request().method(), body = r.request().postData() || "";
      const key = m + " " + u.pathname; S.calls.push(key); (S.bodies[key] = S.bodies[key] || []).push(body);
      const j = (o, status = 200) => r.fulfill({status, contentType: "application/json", body: JSON.stringify(o)});
      if (u.pathname === "/auth/v1/authorize") return r.fulfill({status: 302, headers: {location: u.searchParams.get("redirect_to") + "#access_token=" + jwt() + "&refresh_token=rt1&expires_in=3600&token_type=bearer"}});
      if (u.pathname === "/auth/v1/user") return j(user());
      if (u.pathname === "/auth/v1/token") return j({access_token: jwt(), refresh_token: "rt2", expires_in: 3600, token_type: "bearer", user: user()});
      if (u.pathname === "/auth/v1/signup") return j({id: "new", email: JSON.parse(body).email, user_metadata: JSON.parse(body).data || {}, identities: [{}]});   // confirm-your-email
      if (u.pathname === "/auth/v1/logout") { S.loggedOut = true; return r.fulfill({status: 204}); }
      if (u.pathname === "/rest/v1/rpc/my_age") return j(S.age === undefined ? null : S.age);
      if (u.pathname === "/rest/v1/rpc/set_birthdate") {
        const d = JSON.parse(body).p_date, b = new Date(d + "T12:00:00"), now = new Date(); let y = now.getFullYear() - b.getFullYear(); if (now < new Date(now.getFullYear(), b.getMonth(), b.getDate())) y--;
        if (y < 13) return j({code: "P0001", message: "SB_UNDER13: Studyboard accounts are for people 13 and older."}, 400);
        S.age = y; return j(y);
      }
      if (u.pathname === "/rest/v1/rpc/my_username") return j(null);
      if (u.pathname === "/functions/v1/delete-account") { S.deleted = JSON.parse(body); return j({ok: true, deleted: {account: true}, retained: []}); }
      if (u.pathname.startsWith("/rest/") || u.pathname.startsWith("/storage/") || u.pathname.startsWith("/functions/")) return j([]);
      return r.abort();
    });
  };
  const open = async (S, init) => {
    const ctx = await browser.newContext({viewport: {width: 430, height: 900}});
    await fake(ctx, S);
    await ctx.addInitScript(() => { try { localStorage.setItem("studioso:welcomed", "1"); } catch (e) {} });
    if (init) await ctx.addInitScript(init);
    const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.goto(base);
    return {ctx, page};
  };
  // the app reloads itself after signing in or out (handing the device over): read again once the page is back
  const safe = async (page, fn, arg) => { for (let i = 0; ; i++) { try { await page.waitForLoadState("domcontentloaded"); return await page.evaluate(fn, arg); } catch (e) { if (i > 8 || !/context was destroyed|navigat/i.test(String(e.message))) throw e; await page.waitForTimeout(500); } } };
  const dlgText = page => safe(page, () => (document.querySelector("dialog[open]") || {}).innerText || "");
  const signedIn = page => safe(page, () => Object.keys(localStorage).some(k => /studioso-auth/.test(k) && /access_token/.test(localStorage.getItem(k) || "")));
  const toSignUp = async page => {
    await page.waitForFunction(() => typeof window.sbSignInSheet === "function" || document.querySelector('[data-act="sb-signin"]') || document.querySelector("dialog[open] form.sb-acct"), null, {timeout: 15000}).catch(() => {});
    await page.evaluate(() => { const d = document.querySelector("dialog"); if (d && d.open) d.close(); });
    await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "sb-signin"; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); });
    await page.waitForSelector('dialog[open] form.sb-acct [data-sbm="signup"]', {timeout: 15000});
    await page.click('dialog[open] [data-sbm="signup"]'); await page.waitForSelector('dialog[open] form.sb-acct[data-mode="signup"]');
  };
  const fillSignUp = async (page, bday) => {
    await page.fill("dialog[open] input[name=email]", "kid@example.com");
    await page.fill("dialog[open] input[name=password]", "Correct-Horse-9-Battery");
    await page.fill("dialog[open] input[name=bday]", bday);
    await page.click("dialog[open] [data-submit]"); await page.waitForTimeout(500);
  };
  const oauth = async page => {
    await page.evaluate(() => { const d = document.querySelector("dialog"); if (d && d.open) d.close(); const b = document.createElement("button"); b.dataset.act = "sb-signin"; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); });
    await page.waitForSelector("dialog[open] [data-oauth=google]", {timeout: 15000});
    await page.click("dialog[open] [data-oauth=google]");
    await page.waitForFunction(() => Object.keys(localStorage).some(k => /studioso-auth/.test(k) && /access_token/.test(localStorage.getItem(k) || "")), null, {timeout: 10000});
  };
  const birthdayAsked = page => page.waitForSelector("dialog[open] #ageAsk input[name=bday]", {timeout: 15000}).then(() => true, () => false);
  const NEW = () => new Date().toISOString(), OLD = new Date(Date.now() - 400 * 864e5).toISOString();

  try {
    /* 1. Email sign-up */
    {
      const S = {user: {id: "aaaaaaaa-0000-0000-0000-000000000001", email: "kid@example.com", created_at: NEW()}};
      const {ctx, page} = await open(S);
      await toSignUp(page);
      ok(await page.locator("dialog[open] input[name=bday][type=date]").count() === 1, "sign-up asks for a birthday");
      ok(await page.locator("dialog[open] #u13, dialog[open] [name=parentok]").count() === 0 && !/parent|guardian|under 13|13 and older/i.test(await dlgText(page)), "there is no parent checkbox, and nothing hints at the age needed (a neutral question)");
      await fillSignUp(page, KID);
      ok(/can't make a Studyboard account/.test(await dlgText(page)), "a birthday under 13: no account, in neutral words");
      ok(!S.calls.includes("POST /auth/v1/signup"), "and nothing is sent to the server: " + S.calls.filter(c => /auth/.test(c)).join(", "));
      ok(await page.evaluate(() => [...document.querySelectorAll('dialog[open] [data-submit], dialog[open] [data-oauth]')].every(b => b.disabled)), "Create Account and the Apple / Google / Microsoft buttons are turned off");
      ok(await page.evaluate(() => !!localStorage.getItem("studyboard:agegate")), "the device remembers the refusal");
      // back to the form, with an older birthday this time
      await page.reload(); await toSignUp(page);
      ok(/can't make a Studyboard account/.test(await dlgText(page)) && await page.evaluate(() => document.querySelector("dialog[open] [data-submit]").disabled), "reopening sign-up on this device: still refused, before anything is typed");
      await page.evaluate(() => document.querySelectorAll("dialog[open] input, dialog[open] [data-submit]").forEach(x => { x.disabled = false; }));
      await fillSignUp(page, ADULT);
      ok(!S.calls.includes("POST /auth/v1/signup") && /can't make a Studyboard account/.test(await dlgText(page)), "and changing the birthday to an older one doesn't get around it");
      await ctx.close();
    }
    {
      const S = {user: {id: "aaaaaaaa-0000-0000-0000-000000000002", email: "adult@example.com", created_at: NEW()}};
      const {ctx, page} = await open(S);
      await toSignUp(page); await fillSignUp(page, ADULT);
      const sent = JSON.parse((S.bodies["POST /auth/v1/signup"] || ["{}"])[0]);
      ok(S.calls.includes("POST /auth/v1/signup") && sent.data && sent.data.birth_date === ADULT && !("parent_consent" in sent.data), "13 or older: the account is made, with the birthday and no parent consent field");
      ok(/Check Your Email/.test(await dlgText(page)), "and it asks to confirm the email");
      await ctx.close();
    }

    /* 2. Apple / Google / Microsoft: a new account with no birthday */
    {
      const S = {user: {id: "bbbbbbbb-0000-0000-0000-000000000001", email: "kid2@example.com", created_at: NEW()}, age: null};
      const {ctx, page} = await open(S);
      await oauth(page);
      ok(await birthdayAsked(page), "after Sign in with Google, a new account is asked for a birthday");
      ok(/Sign Out/.test(await page.textContent("#bdLater")) && !/under 13|13 and older|parent/i.test(await dlgText(page)), "the only other choice is Sign Out, and the question is neutral");
      await page.fill("dialog[open] input[name=bday]", KID); await page.click("#bdSave");
      await page.waitForFunction(() => /can't make a Studyboard account/.test((document.querySelector("dialog[open]") || {}).innerText || ""), null, {timeout: 10000});
      ok(true, "under 13: refused, in the same words");
      ok(S.deleted && S.deleted.underage === true && S.deleted.confirm === "DELETE", "the account is deleted with everything it stored (delete-account, underage): " + JSON.stringify(S.deleted));
      ok(!S.calls.includes("POST /rest/v1/rpc/set_birthdate"), "the under-13 birthday is never sent to be saved");
      ok(!(await signedIn(page)), "this device is signed out");
      ok(await safe(page, () => !!localStorage.getItem("studyboard:agegate")), "and remembers the refusal");
      await page.click("dialog[open] [data-act=close]"); await page.waitForTimeout(1500);
      // again, as a different new account from the same device
      S.user = {id: "bbbbbbbb-0000-0000-0000-000000000002", email: "kid2b@example.com", created_at: NEW()}; S.deleted = null;
      await oauth(page);
      await page.waitForFunction(() => /can't make a Studyboard account/.test((document.querySelector("dialog[open]") || {}).innerText || ""), null, {timeout: 15000}).catch(() => {});
      ok(S.deleted && S.deleted.underage === true && !(await page.$("dialog[open] #ageAsk")), "a second new account from this device is closed without asking again");
      await ctx.close();
    }
    {
      const S = {user: {id: "bbbbbbbb-0000-0000-0000-000000000003", email: "adult2@example.com", created_at: NEW()}, age: null};
      const {ctx, page} = await open(S);
      await oauth(page);
      ok(await birthdayAsked(page), "an adult signing in with Google for the first time is asked too");
      await page.fill("dialog[open] input[name=bday]", ADULT); await page.click("#bdSave"); await page.waitForTimeout(800);
      ok(JSON.parse(S.bodies["POST /rest/v1/rpc/set_birthdate"][0]).p_date === ADULT && !S.deleted && await signedIn(page), "13 or older: the birthday is saved and they stay signed in");
      ok(!(await page.$("dialog[open] #ageAsk")), "and the question is gone");
      await page.reload(); await page.waitForTimeout(4000);
      ok(!(await page.$("dialog[open] #ageAsk")) && S.calls.filter(c => c === "POST /rest/v1/rpc/set_birthdate").length === 1, "it isn't asked again");
      await ctx.close();
    }

    /* 3. Skipping it */
    for (const how of ["Sign Out", "Escape"]) {
      const S = {user: {id: "cccccccc-0000-0000-0000-00000000000" + (how === "Escape" ? 2 : 1), email: "skip@example.com", created_at: OLD}, age: null};
      const {ctx, page} = await open(S);
      await oauth(page);
      ok(await birthdayAsked(page), "an older account with no birthday (made before this check) is asked once too");
      if (how === "Sign Out") await page.click("#bdLater"); else await page.keyboard.press("Escape");
      await page.waitForFunction(() => !Object.keys(localStorage).some(k => /studioso-auth/.test(k) && /access_token/.test(localStorage.getItem(k) || "")), null, {timeout: 15000}).catch(() => {});
      ok(!(await signedIn(page)) && !S.deleted, `${how}: signs out, and the account is kept`);
      await ctx.close();
    }

    /* 4. Refused on this device, then someone signs in to an older account with no birthday: signed out, not deleted */
    {
      const S = {user: {id: "dddddddd-0000-0000-0000-000000000001", email: "parent@example.com", created_at: OLD}, age: null};
      const {ctx, page} = await open(S, () => { try { localStorage.setItem("studyboard:agegate", "1"); } catch (e) {} });
      await oauth(page);
      await page.waitForFunction(() => /can't make a Studyboard account/.test((document.querySelector("dialog[open]") || {}).innerText || ""), null, {timeout: 15000}).catch(() => {});
      ok(/contact Studyboard support/.test(await dlgText(page)) && !(await page.$("dialog[open] #ageAsk")), "an older account with no birthday on a refused device: not asked, told to contact support");
      await page.click("dialog[open] [data-act=close]");
      await page.waitForFunction(() => !Object.keys(localStorage).some(k => /studioso-auth/.test(k) && /access_token/.test(localStorage.getItem(k) || "")), null, {timeout: 15000}).catch(() => {});
      ok(!(await signedIn(page)) && !S.deleted, "it is signed out, and not deleted (it may be a parent's)");
      await ctx.close();
    }

    /* 5. Accounts with a birthday */
    {
      const S = {user: {id: "eeeeeeee-0000-0000-0000-000000000001", email: "old@example.com", created_at: OLD}, age: 30};
      const {ctx, page} = await open(S, () => { try { localStorage.setItem("studyboard:agegate", "1"); } catch (e) {} });
      await oauth(page); await page.waitForTimeout(4500);
      ok(!(await page.$("dialog[open] #ageAsk")) && !(await page.$("dialog[open] #ageNo")) && await signedIn(page) && !S.deleted, "13 or older on file: never asked, even on a refused device (a parent's own account works)");
      await ctx.close();
    }
    {
      const S = {user: {id: "eeeeeeee-0000-0000-0000-000000000002", email: "young@example.com", created_at: OLD}, age: 12};
      const {ctx, page} = await open(S);
      await oauth(page);
      await page.waitForFunction(() => /can't make a Studyboard account/.test((document.querySelector("dialog[open]") || {}).innerText || ""), null, {timeout: 15000}).catch(() => {});
      ok(S.deleted && S.deleted.underage === true && !(await signedIn(page)), "an account with an under-13 birthday from before this change is deleted at its next sign-in");
      await ctx.close();
    }
    {
      const S = {user: {id: "eeeeeeee-0000-0000-0000-000000000003", email: "meta@example.com", created_at: NEW(), user_metadata: {birth_date: ADULT}}, age: null};
      const {ctx, page} = await open(S);
      await oauth(page); await page.waitForTimeout(4500);
      ok(S.calls.includes("POST /rest/v1/rpc/set_birthdate") && !(await page.$("dialog[open] #ageAsk")) && await signedIn(page), "the birthday from the email sign-up form is saved after the email is confirmed, without asking again");
      await ctx.close();
    }
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log(`\n${n} e2e checks passed`);
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
