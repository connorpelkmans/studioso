// Moving a sticker around on a sticky note never opens the note's editor
"use strict";
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = {v: 2, updated: 1, courses: [], tasks: [], settings: {},
  notes: [{id: "n1", text: "Mitosis\nPMAT", color: "yellow", x: 60, y: 60, z: 1, stickers: [{k: "dot", x: 30, yp: 40, r: 0, s: 1.4}]}]};
(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    for (const [w, h, label] of [[1280, 800, "desktop"], [390, 844, "phone"]]) {
      const ctx = await browser.newContext({viewport: {width: w, height: h}, hasTouch: w < 600});
      await ctx.addInitScript(seed => { try { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("studioso:sb", '"local"'); sessionStorage.setItem("seeded", "1"); } } catch (e) {} }, SEED);
      const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
      await page.goto("file://" + path.join(__dirname, "..", "index.html")); await page.waitForTimeout(1500);
      await page.evaluate(() => { const b = document.createElement("button"); b.dataset.tab = "notes"; document.body.appendChild(b); b.click(); b.remove(); });
      await page.waitForSelector(".nb-board .note .stk"); await page.waitForTimeout(300);
      const editing = () => page.evaluate(() => !!document.querySelector(".note.editing"));
      const drag = async (dx, dy) => {
        const s = await page.locator(".nb-board .note .stk").first().boundingBox(), x = s.x + s.width / 2, y = s.y + s.height / 2;
        await page.mouse.move(x, y); await page.mouse.down();
        for (let i = 1; i <= 8; i++) await page.mouse.move(x + dx * i / 8, y + dy * i / 8);
        await page.mouse.up(); await page.waitForTimeout(250);
      };
      for (const [dx, dy] of [[40, 30], [-30, 25], [15, -20], [-45, -10]]) await drag(dx, dy);
      ok(!(await editing()), `${label}: moving a sticker around on its note never opens the note's editor`);
      const st = await page.evaluate(() => JSON.parse(localStorage.getItem("coursework:v2")).notes[0].stickers);
      ok(st.length === 1 && (st[0].x !== 30 || st[0].yp !== 40), `${label}: and the sticker moved: ` + JSON.stringify(st[0]));
      await page.waitForTimeout(600);
      const nb = await page.locator(".nb-board .note").first().boundingBox();
      await page.mouse.click(nb.x + nb.width * 0.7, nb.y + nb.height * 0.85); await page.waitForTimeout(300);
      ok(await editing(), `${label}: a plain click on the note still opens it`);
      ok(!errs.length, `${label}: no page errors: ` + errs.join(" | "));
      await ctx.close();
    }
  } finally { await browser.close(); }
  console.log(`\nsticker-drag: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
