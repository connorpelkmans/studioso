// A finger drag (real touch events) from the envelope onto notes on a phone
"use strict";
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = {v: 2, updated: 1, courses: [], tasks: [], settings: {},
  notes: [{id: "n1", text: "A", color: "yellow", x: 20, y: 20, z: 1}, {id: "n2", text: "B", color: "blue", x: 200, y: 250, z: 2}, {id: "n3", text: "C", color: "pink", x: 10, y: 310, z: 3}]};
(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 390, height: 844}, hasTouch: true, isMobile: true, deviceScaleFactor: 3});
    await ctx.addInitScript(seed => { try { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:env", "1"); sessionStorage.setItem("seeded", "1"); } } catch (e) {} }, SEED);
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto("file://" + path.join(__dirname, "..", "index.html")); await page.waitForTimeout(1500);
    await page.evaluate(() => { const b = document.createElement("button"); b.dataset.tab = "notes"; document.body.appendChild(b); b.click(); b.remove(); });
    await page.waitForSelector(".env:not(.closed) [data-stk-src]"); await page.waitForTimeout(400);
    const cdp = await ctx.newCDPSession(page);
    const touch = (type, x, y) => cdp.send("Input.dispatchTouchEvent", {type, touchPoints: type === "touchEnd" ? [] : [{x, y}]});
    const stickers = id => page.evaluate(id => (JSON.parse(localStorage.getItem("coursework:v2")).notes.find(x => x.id === id).stickers || []).length, id);
    const envOpen = () => page.evaluate(() => !!document.querySelector(".env:not(.closed)"));
    for (const id of ["n1", "n2", "n3"]) {
      if (!(await envOpen())) { await page.click(".env-head"); await page.waitForSelector(".env:not(.closed) [data-stk-src]"); await page.waitForTimeout(300); }
      const s = await page.locator(".env-sheet [data-stk-src]").nth(1).boundingBox();
      const t = await page.evaluate(id => { const q = document.querySelector(`.nb-board .note[data-note="${id}"]`).getBoundingClientRect(); return {x: q.left + q.width / 2, y: q.top + q.height / 2}; }, id);
      const x0 = s.x + s.width / 2, y0 = s.y + s.height / 2;
      await touch("touchStart", x0, y0);
      for (let i = 1; i <= 12; i++) { await touch("touchMove", x0 + (t.x - x0) * i / 12, y0 + (t.y - y0) * i / 12); await page.waitForTimeout(16); }
      await touch("touchEnd"); await page.waitForTimeout(400);
      ok(await stickers(id) === 1, `a sticker dragged by finger onto ${id} sticks to it`);
      ok(!(await envOpen()), `and the sticker envelope stays closed after the drop`);
    }
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    await ctx.close();
  } finally { await browser.close(); }
  console.log(`\nsticker-drop-touch: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
