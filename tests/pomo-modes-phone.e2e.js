// node tests/pomo-modes-phone.e2e.js
// The Focus timer's Focus / Short Break / Long Break switch on a phone: the chosen one is marked by the pill alone, with no second,
// taller tinted shape around it (the timer sheet's own tint used to fill the whole button as well)
const assert = require("assert"), path = require("path");
const {chromium, executablePath} = require("./pw");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = {v: 2, updated: 1, settings: {}, tasks: [], notes: [], files: [], events: [], courses: [], decks: []};
(async () => {
  const browser = await chromium.launch({executablePath}), errs = [];
  try {
    for (const scheme of ["dark", "light"]) {
      const ctx = await browser.newContext({viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true, colorScheme: scheme});
      await ctx.addInitScript(([seed, scheme]) => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("studioso:theme", scheme); localStorage.setItem("coursework:v2", JSON.stringify(seed)); } } catch (e) {} }, [SEED, scheme]);
      const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
      await page.goto("file://" + path.join(__dirname, "..", "index.html")); await page.waitForTimeout(1500);
      await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
      await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "pomo-open"; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); });
      await page.waitForSelector("#pomoDlg .pomo-modes"); await page.waitForTimeout(400);
      for (const m of ["focus", "short"]) {
        if (m !== "focus") { await page.click(`#pomoDlg .pomo-modes [data-id="${m}"]`); await page.waitForTimeout(300); }
        const g = await page.evaluate(m => { const b = document.querySelector(`#pomoDlg .pomo-modes [data-id="${m}"]`), cs = getComputedStyle(b), be = getComputedStyle(b, "::before"); return {pressed: b.getAttribute("aria-pressed"), bg: cs.backgroundColor, pill: be.backgroundColor}; }, m);
        ok(g.pressed === "true", `${scheme}: ${m} is chosen`);
        ok(/rgba\(0, 0, 0, 0\)|transparent/.test(g.bg) && !/rgba\(0, 0, 0, 0\)/.test(g.pill), `${scheme}: only the pill marks it, the button itself isn't tinted (button ${g.bg}, pill ${g.pill})`);
      }
      await ctx.close();
    }
    ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
    console.log("pomo-modes-phone.e2e: " + n + " checks passed");
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
