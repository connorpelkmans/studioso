// node tests/settings-echo.e2e.js
// Settings sync: the server tells every device about each settings save, this one included. An echo of an earlier save from this
// device that arrives after a newer change (two quick taps on the whiteboard's light / dark switch) must not switch the setting
// back for a moment; a change made on another device is still taken.
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = {v: 2, updated: 1, settings: {wbTheme: "light"}, notes: [], files: [], events: [], decks: [], tasks: [], courses: []};
(async () => {
  const browser = await chromium.launch({executablePath}), errs = [];
  try {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 860}});
    await ctx.addInitScript(seed => { window.__SB_TEST = true; try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("coursework:v2", JSON.stringify(seed)); } } catch (e) {} }, SEED);
    const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.goto("file://" + path.join(__dirname, "..", "index.html")); await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    // a whiteboard open, light
    await page.evaluate(() => { const b = document.querySelector('nav.tabs [data-tab="notes"]'); b && b.click(); }); await page.waitForTimeout(400);
    await page.click('.nv-tabs [data-id="wb"]'); await page.waitForTimeout(400);
    await page.click('.wb-empty [data-act="wb-quick"][data-id="blank"]'); await page.waitForSelector(".wb-stage .wb-frame"); await page.waitForTimeout(600);
    const look = () => page.evaluate(() => ({pref: window.__sbSync.state.settings.wbTheme, dark: document.querySelector(".wb-stage").classList.contains("wb-dk")}));
    ok((await look()).dark === false, "the board starts light");
    // tap 1: dark, saved; tap 2: light again, saved
    const sent = [];
    for (let i = 0; i < 2; i++) {
      await page.evaluate(() => document.querySelector(".wb-stage .wbz-theme").click()); await page.waitForTimeout(150);
      sent.push(await page.evaluate(() => { const S = window.__sbSync, d = {schema: 2, settings: S.syncSettings(S.state.settings)}; S.noteMetaSent(d); return d; }));
    }
    ok(sent[0].settings.wbTheme === "dark" && sent[1].settings.wbTheme === "light" && (await look()).dark === false, "two taps: dark, then light again (both saved)");
    // the server's echo of the first save arrives late, after the second tap
    const seen = await page.evaluate(d => new Promise(res => { const st = document.querySelector(".wb-stage"), flips = []; const mo = new MutationObserver(() => flips.push(st.classList.contains("wb-dk")));
      mo.observe(st, {attributes: true, attributeFilter: ["class"]}); window.__sbSync.applyRemoteSettings(d); setTimeout(() => { mo.disconnect(); res(flips); }, 600); }), sent[0]);
    const after = await look();
    ok(after.pref === "light" && after.dark === false && !seen.includes(true), `the late echo of the earlier save doesn't switch the board back to dark (setting ${after.pref}, flips ${JSON.stringify(seen)})`);
    // the echo of the latest save changes nothing either
    await page.evaluate(d => window.__sbSync.applyRemoteSettings(d), sent[1]); await page.waitForTimeout(300);
    ok((await look()).dark === false, "the echo of the latest save changes nothing");
    // a change made on another device is taken
    const other = JSON.parse(JSON.stringify(sent[1])); other.settings.wbTheme = "dark"; other.settings.capacity = 17;
    await page.evaluate(d => window.__sbSync.applyRemoteSettings(d), other); await page.waitForTimeout(500);
    const o = await look();
    ok(o.pref === "dark" && o.dark === true && (await page.evaluate(() => window.__sbSync.state.settings.capacity)) === 17, "a change from another device still comes through (the board turns dark)");
    ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
    console.log("settings-echo.e2e: " + n + " checks passed");
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
