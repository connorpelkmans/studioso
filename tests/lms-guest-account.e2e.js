// Connecting Canvas without an account: the Connect sheet leads with a free account (the calendar link needs one), and after
// making it the student lands back on Canvas's Connect sheet to paste the link, inside the welcome setup or outside it,
// and also after a page reload (back from Google, Apple or Microsoft)
const fs = require("fs"), path = require("path"), http = require("http"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const ROOT = path.join(__dirname, "..");
const SB = "https://pivcmrqcjseycjkbocmc.supabase.co";
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("  ok " + m); };

const web = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p === "/") p = "/index.html";
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT)) { res.writeHead(404); res.end(); return; }
  fs.readFile(f, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, {"content-type": /\.html$/.test(p) ? "text/html" : /\.m?js$/.test(p) ? "text/javascript" : /\.css$/.test(p) ? "text/css" : /\.svg$/.test(p) ? "image/svg+xml" : /\.json$/.test(p) ? "application/json" : "application/octet-stream"}); res.end(b); });
});

/* stand-in Supabase: sign-up gives a session at once, and lms-feed returns a small Canvas calendar */
const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url");
const USER = {id: "22222222-2222-2222-2222-222222222222", aud: "authenticated", role: "authenticated", email: "sam@example.com", app_metadata: {provider: "email"}, user_metadata: {}, created_at: new Date().toISOString()};
const mint = () => { const iat = Math.floor(Date.now() / 1000), exp = iat + 3600; return {access_token: b64({alg: "HS256"}) + "." + b64({sub: USER.id, exp, iat, role: "authenticated", aud: "authenticated"}) + ".sig", token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: "rt" + iat, user: USER}; };
const ev = (id, t, d) => `BEGIN:VEVENT\r\nUID:event-assignment-${id}\r\nDTSTART:${d}T235900Z\r\nDTEND:${d}T235900Z\r\nSUMMARY:${t} [CHEM 110 General Chemistry]\r\nURL:https://school.instructure.com/courses/1/assignments/${id}\r\nEND:VEVENT\r\n`;
const day = k => { const d = new Date(Date.now() + k * 864e5); return d.toISOString().slice(0, 10).replace(/-/g, ""); };
const ICS = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Instructure//EN\r\n" + ev(1, "Lab Report 3", day(8)) + ev(2, "Problem Set 7", day(10)) + ev(3, "Midterm Review Quiz", day(15)) + "END:VCALENDAR\r\n";
const log = [];
async function handle(route){
  const q = route.request(), u = new URL(q.url()), m = q.method(), P = u.pathname;
  const send = (st, b) => route.fulfill({status: st, contentType: "application/json", headers: {"access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*", "access-control-expose-headers": "*"}, body: b === undefined ? "" : JSON.stringify(b)});
  if (m === "OPTIONS") return send(200);
  log.push(m + " " + P);
  if (P === "/auth/v1/signup" || P === "/auth/v1/token") return send(200, mint());
  if (P === "/auth/v1/user") return send(200, USER);
  if (P === "/functions/v1/lms-feed") return send(200, {ok: true, ics: ICS, hash: "h1"});
  if (P.startsWith("/functions/")) return send(200, {});
  if (P.startsWith("/rest/v1/rpc/")) return send(404, {code: "PGRST202", message: "x"});
  if (P.startsWith("/rest/v1/")) { if (m === "GET") return /object/.test(q.headers()["accept"] || "") ? send(406, {code: "PGRST116", message: "0 rows"}) : send(200, []); return send(201, [{updated_at: new Date().toISOString()}]); }
  return send(404, {});
}
async function open(browser, seed){
  const ctx = await browser.newContext({serviceWorkers: "block", viewport: {width: 390, height: 844}});
  await ctx.route(SB + "/**", handle);
  if (seed) await ctx.addInitScript(([s, sess]) => {
    if (sessionStorage.getItem("seeded")) return; sessionStorage.setItem("seeded", "1");
    localStorage.setItem("studioso:welcomed", "1");
    if (s.signedIn) localStorage.setItem("studioso-auth", sess);
    if (s.onboarded) { localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("sb:onboarded:" + s.uid, "1"); localStorage.setItem("studyboard:tour", "done"); }
    if (s.resume) localStorage.setItem("studyboard:lms:resume", JSON.stringify({id: "canvas", at: Date.now()}));
  }, [Object.assign({uid: USER.id}, seed), JSON.stringify(mint())]);
  const page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push(e.message));
  await page.goto("http://127.0.0.1:" + web.address().port + "/");
  return {ctx, page, errs};
}
const text = page => page.evaluate(() => { const d = document.querySelector("dialog[open]"); return d ? d.innerText : ""; });
async function until(page, fn, ms){ const end = Date.now() + (ms || 10000); while (Date.now() < end) { if (await page.evaluate(fn).catch(() => false)) return true; await page.waitForTimeout(150); } return false; }

(async () => {
  await new Promise(r => web.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch({executablePath});
  try {
    console.log("1. no account, in the welcome setup: Connect, a free account, and straight back to Canvas");
    {
      const {ctx, page, errs} = await open(browser, null);
      await page.waitForSelector("text=Plan My Semester", {timeout: 15000});
      await page.click("text=Plan My Semester");
      await page.waitForSelector("dialog[open] [data-ob-area]", {timeout: 10000});
      await page.click("dialog[open] [data-ob-area]");
      await page.click("dialog[open] [data-ob=next]");
      await page.click("dialog[open] [data-ob=lms]");
      await page.click("dialog[open] [data-act=cv-open], dialog[open] .bs-plist button:has-text('Connect') >> nth=0");
      await page.waitForSelector("dialog[open] [data-act=cv-acct]");
      const t = await text(page);
      ok(/Keep It Synced Automatically/.test(t) && /Create a Free Account/.test(t), "the Connect sheet leads with a free account");
      ok(!/Import Your Calendar File/.test(t) && /calendar file once, without an account/.test(t), "the one-off calendar file is under Other options");
      ok(await page.locator("dialog[open] .bs-how").count() === 1, "how to find the calendar link is right there");
      ok(/On a phone\?/.test(await page.evaluate(() => document.querySelector("dialog[open] .bs-how").textContent)), "and it says the Canvas phone app doesn't show it");
      await page.click("dialog[open] [data-act=cv-acct]");
      await page.waitForSelector("dialog[open] form.sb-acct[data-mode=signup]", {timeout: 10000});
      ok(/Create Your Studyboard Account/.test(await text(page)), "Create a Free Account opens account creation (not Sign In)");
      await page.fill("dialog[open] [name=bday]", "2005-03-04").catch(() => {});
      await page.fill("dialog[open] [name=email]", "sam@example.com");
      await page.fill("dialog[open] [name=password]", "Correct-Horse-9-Battery");
      await page.click("dialog[open] [data-submit]");
      ok(await until(page, () => !!document.querySelector("dialog[open] #bsFeedIn")), "after making the account, Canvas's Connect sheet is back with the link field");
      ok(await page.evaluate(() => localStorage.getItem("studyboard:lms:resume")) === null, "the way back is used once");
      await page.fill("#bsFeedIn", "https://school.instructure.com/feeds/calendars/user_abc123.ics");
      await page.click("dialog[open] [data-act=cv-feed-connect]");
      await page.waitForSelector("dialog[open] .sheet-foot .btn.primary:has-text('Import')", {timeout: 10000});
      await page.click("dialog[open] .sheet-foot .btn.primary:has-text('Import')");
      ok(await until(page, () => !!document.querySelector("dialog[open] .ob-tally")), "back in the welcome setup's courses step");
      const t2 = await text(page);
      ok(/3 items found/.test(t2), "with the Canvas due dates counted");
      ok(/Canvas connected/.test(t2) && /Connect Another/.test(t2), "and the school site card says Canvas is connected");
      ok(!errs.length, "no page errors " + errs.join(" | "));
      await ctx.close();
    }

    console.log("2. back from Google, Apple or Microsoft (a page load), a new account: the setup opens on Canvas");
    {
      const {ctx, page, errs} = await open(browser, {signedIn: true, resume: true});
      ok(await until(page, () => !!document.querySelector("dialog[open] #bsFeedIn"), 15000), "Canvas's Connect sheet opens by itself");
      await page.click("dialog[open] .sheet-foot [data-act=close]");
      ok(await until(page, () => /Your Courses and Deadlines/.test((document.querySelector("dialog[open]") || {}).innerText || "")), "closing it goes to the setup's courses step, not back to step 1");
      ok(!errs.length, "no page errors " + errs.join(" | "));
      await ctx.close();
    }

    console.log("3. setup already done: Canvas opens once signed in");
    {
      const {ctx, page, errs} = await open(browser, {signedIn: true, resume: true, onboarded: true});
      ok(await until(page, () => !!document.querySelector("dialog[open] #bsFeedIn"), 15000), "Canvas's Connect sheet opens by itself");
      ok(!errs.length, "no page errors " + errs.join(" | "));
      await ctx.close();
    }

    console.log("4. not signed in: the way back waits");
    {
      const {ctx, page} = await open(browser, {resume: true});
      await page.waitForTimeout(4000);
      ok(!(await page.locator("dialog[open] #bsFeedIn").count()), "no Canvas sheet without an account");
      ok(!!(await page.evaluate(() => localStorage.getItem("studyboard:lms:resume"))), "the way back is kept for after signing in");
      await ctx.close();
    }
  } finally { await browser.close(); web.close(); }
  console.log(n + " checks passed");
})().catch(e => { console.error("FAIL", e.message); console.error(log.slice(-15).join("\n")); process.exit(1); });
