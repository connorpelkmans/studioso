// node tests/companion-no-shrink.e2e.js
// On a computer the companion is always its full size, on every page: on busy pages (Schedule, Due Dates, Courses) it used to
// shrink to fit a gap (to 94%, 88% or 82%). With a full term's data, at three window sizes.
const fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const src = fs.readFileSync(path.join(__dirname, "..", "tools", "capture-store-screens.js"), "utf8");
const {SEED} = new Function(src.slice(src.indexOf("const NOW"), src.indexOf("const SHOTS = [")) + "\nreturn {SEED, NOW};")();
const TABS = ["board", "schedule", "timeline", "crunch", "flashcards", "notes", "courses", "files", "groups"];
(async () => {
  const browser = await chromium.launch({executablePath}), errs = [];
  try {
    for (const [w, h] of [[1280, 800], [1440, 900], [1024, 700]]) {
      const ctx = await browser.newContext({viewport: {width: w, height: h}});
      await ctx.addInitScript(seed => { window.__SB_TEST = true; if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("coursework:v2", JSON.stringify(seed)); } }, SEED);
      const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
      await page.goto("file://" + path.join(__dirname, "..", "index.html")); await page.waitForFunction(() => window.SBCOMP && SBCOMP.bounds && window.__sbSync, null, {timeout: 15000}); await page.waitForTimeout(1500);
      await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
      const seen = [];
      for (const t of TABS) {
        await page.evaluate(t => { const S = window.__sbSync; S.ui.tab = t; S.render(); }, t); await page.waitForTimeout(1500);
        const r = await page.evaluate(() => { const b = [...document.querySelectorAll(".cp[data-px]")].find(x => x.offsetParent || x.getClientRects().length); return {shrink: SBCOMP.bounds().shrink, px: b ? Number(b.dataset.px) : 0}; });
        seen.push(`${t} ${r.shrink}/${r.px}px`);
        ok(r.shrink === 1, `${w}x${h}, ${t}: full size (${r.shrink}, ${r.px}px)`);
      }
      const px = new Set(seen.map(s => s.split("/")[1]));
      ok(px.size === 1, `${w}x${h}: the same size on every page (${[...px].join(", ")})`);
      await ctx.close();
    }
    ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
    console.log("companion-no-shrink.e2e: " + n + " checks passed");
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
