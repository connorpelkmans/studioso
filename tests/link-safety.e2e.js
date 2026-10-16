// Browser test for the sign-in link and AI key safety checks (October 2026). Run: node tests/link-safety.e2e.js
//  1. a session in the address (#access_token=...) is only taken when this browser asked for an email, or when nothing on the device
//     could be lost or shared (no account here, nothing saved); otherwise it is refused and taken off the address. Error links still pass.
//  2. AI keys left on a device belong to the account that added them: a different account signing in there gets none of them.
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const FILE = "file://" + path.join(__dirname, "..", "index.html");
let n = 0; const ok = (c, m) => { n++; assert(c, m); };

(async () => {
  const browser = await chromium.launch({executablePath});
  const ctx = await browser.newContext({viewport: {width: 1200, height: 800}});
  await ctx.addInitScript(() => {
    window.__SB_TEST = true;
    try {
      if (sessionStorage.getItem("seeded")) return;
      sessionStorage.setItem("seeded", "1");
      localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done");
    } catch (e) {}
  });
  const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", e => errs.push(e.message));
  try {
    await page.goto(FILE); await page.waitForTimeout(2000);
    const check = (setup, params) => page.evaluate(([setup, params]) => {
      localStorage.removeItem("studioso:linkAsked"); localStorage.removeItem("studioso:owner");
      const P = window.__sbPrivacy, st = {courses: {}, tasks: {}, files: {}, notes: {}, decks: {}, events: {}, trash: {}, settings: {capacity: 15}, updated: 0};
      if (setup.task) st.tasks.t1 = {id: "t1", title: "Essay"};
      P.setState(st);
      if (setup.asked) localStorage.setItem("studioso:linkAsked", String(Date.now() - setup.asked));
      if (setup.owner) localStorage.setItem("studioso:owner", setup.owner);
      history.replaceState(null, "", location.pathname + "#access_token=x");
      const took = P.sbUrlSessionOk(new URL(location.href), params);
      return {took, hash: location.hash, asked: localStorage.getItem("studioso:linkAsked")};
    }, [setup, params]);
    const TOK = {access_token: "a", refresh_token: "r", token_type: "bearer"};

    // 1. Sessions in the address
    let r = await check({}, TOK);
    ok(r.took === true, "a fresh device with nothing on it takes the link (opening a sign-up link on another device still works)");
    r = await check({task: true}, TOK);
    ok(r.took === false && r.hash === "", "a device with its own data and no account refuses a link nobody asked for, and clears the address");
    r = await check({owner: "11111111-1111-1111-1111-111111111111"}, TOK);
    ok(r.took === false, "a device signed in to an account refuses a link nobody asked for");
    r = await check({owner: "none"}, TOK);
    ok(r.took === true, "a device wiped by signing out takes the link");
    r = await check({owner: "11111111-1111-1111-1111-111111111111", task: true, asked: 60 * 1000}, TOK);
    ok(r.took === true && r.asked === null, "a link this browser asked for (sign up, reset, change email) is taken, once");
    r = await check({task: true, asked: 3 * 864e5}, TOK);
    ok(r.took === false, "an ask more than two days old doesn't count");
    r = await check({task: true}, {error: "access_denied", error_code: "otp_expired"});
    ok(r.took === true, "an error link (expired, already used) still passes, so it can be explained");
    r = await check({}, {});
    ok(r.took === false, "an address with nothing in it isn't a sign-in link");

    // 2. AI keys belong to the account that added them
    const keys = await page.evaluate(async () => {
      const P = window.__sbPrivacy;
      P.setState({courses: {}, tasks: {}, files: {}, notes: {}, decks: {}, events: {}, trash: {}, settings: {capacity: 15}, updated: 0});
      localStorage.setItem("studioso:owner", "none"); localStorage.setItem("studyboard:aiKeysOwner", "aaaaaaaa-0000-0000-0000-000000000000");
      P.aiKeys = {gemini: "AIzaTEST"}; localStorage.setItem("studyboard:aiKeys", JSON.stringify(P.aiKeys));
      await P.claimDevice("aaaaaaaa-0000-0000-0000-000000000000");
      const same = Object.keys(P.aiKeys).length;
      localStorage.setItem("studioso:owner", "none");
      await P.claimDevice("bbbbbbbb-0000-0000-0000-000000000000");
      return {same, other: Object.keys(P.aiKeys).length, stored: localStorage.getItem("studyboard:aiKeys"), owner: localStorage.getItem("studyboard:aiKeysOwner")};
    });
    ok(keys.same === 1, "the person who added the keys signs back in and keeps them");
    ok(keys.other === 0 && keys.stored === null && keys.owner === "bbbbbbbb-0000-0000-0000-000000000000", "another account signing in on the device gets none of them");

    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log("\nlink-safety.e2e: " + n + " checks passed");
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
