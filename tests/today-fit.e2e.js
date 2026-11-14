// node tests/today-fit.e2e.js
// The date under the logo always fits: on a phone, "Wednesday September 30" becomes "Wednesday Sep 30" or "Wed Sep 30" as needed,
// never cut off with "...". A computer keeps the full date.
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = {v: 2, updated: 1, settings: {}, notes: [], files: [], events: [], decks: [], tasks: [], courses: []};
(async () => {
  const browser = await chromium.launch({executablePath}), errs = [];
  try {
    for (const [w, mobile, ts] of [[430, true], [402, true], [402, true, "xl"], [375, true], [320, true], [1280, false]]) {
      for (const when of [new Date(2026, 8, 30, 10), new Date(2026, 10, 14, 10)]) {
        const ctx = await browser.newContext(Object.assign({viewport: {width: w, height: 860}, locale: "en-US"}, mobile ? {isMobile: true, hasTouch: true} : {}));
        await ctx.clock.install({time: when});
        if (ts) await ctx.addInitScript(ts => { try { localStorage.setItem("studyboard:textsize", ts); } catch (e) {} }, ts);
        await ctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("coursework:v2", JSON.stringify(seed)); } } catch (e) {} }, SEED);
        const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
        await page.goto("file://" + path.join(__dirname, "..", "index.html")); await page.waitForTimeout(1300);
        await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close())); await page.waitForTimeout(200);
        // a running Focus timer adds its pill to the header, leaving the date less room
        await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "pomo-start"; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); });
        await page.waitForTimeout(400); await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close())); await page.waitForTimeout(300);
        const g = await page.evaluate(() => { const el = document.getElementById("todayLabel"); return {timer: !!document.querySelector("header.top [data-pomo-time]"), text: el.innerText.replace(/\s+/g, " ").trim(), fits: el.scrollWidth <= el.clientWidth + 1, shown: el.clientWidth > 0}; });
        if (!g.shown) { await ctx.close(); continue; }
        ok(g.fits, `${w}px${ts ? " (largest text)" : ""}, ${when.toDateString()}${g.timer ? ", timer running" : ""}: the date fits ("${g.text}")`);
        if (w >= 1000) ok(/^(Wednesday September 30|Saturday November 14)/.test(g.text), `${w}px: the full date on a computer ("${g.text}")`);
        await ctx.close();
      }
    }
    ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
    console.log("today-fit.e2e: " + n + " checks passed");
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
