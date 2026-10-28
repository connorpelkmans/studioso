// node tests/shop-sticker-sharp.e2e.js
// Style Shop: every sticker preview is drawn with enough pixels for its size on screen, and is drawn again after zooming in
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const FILE = "file://" + path.join(__dirname, "..", "index.html");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };

(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    for (const [w, dpr] of [[1300, 1], [1300, 1.5], [390, 3]]) {
      const ctx = await browser.newContext({viewport: {width: w, height: 900}, deviceScaleFactor: dpr});
      const p = await ctx.newPage(), errs = []; p.on("pageerror", e => errs.push(e.message));
      await p.addInitScript(() => { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("sb:onboarded", "1"); });
      await p.goto(FILE); await p.waitForTimeout(1200);
      await p.evaluate(() => { const x = document.createElement("button"); x.dataset.act = "shop"; document.body.appendChild(x); x.click(); x.remove(); });
      await p.waitForTimeout(600);
      await p.locator('dialog[open] [data-act="shop-tab"][data-id="stickers"]').first().click(); await p.waitForTimeout(400);
      // scroll through so every pack is drawn
      await p.evaluate(async () => { const b = document.querySelector("dialog[open] .sheet-body"); for (let y = 0; y < b.scrollHeight; y += 500) { b.scrollTop = y; await new Promise(r => setTimeout(r, 60)); } b.scrollTop = 0; });
      const check = () => p.evaluate(async () => {
        const imgs = [...document.querySelectorAll("dialog[open] img[data-stk]")];
        // images below the fold load lazily; the ones near the top must be ready
        const top = imgs.filter(i => i.getBoundingClientRect().top < innerHeight);
        const t0 = Date.now(); while (Date.now() - t0 < 30000 && top.some(i => !i.complete || i.classList.contains("ui-wait") || !i.naturalWidth)) await new Promise(r => setTimeout(r, 200));
        await new Promise(r => setTimeout(r, 500));
        const d = window.devicePixelRatio || 1;
        const shown = imgs.filter(i => i.getBoundingClientRect().width > 0 && i.naturalWidth > 0);
        const soft = shown.filter(i => i.naturalWidth + 1 < i.getBoundingClientRect().width * d).map(i => `${i.dataset.stk} ${i.naturalWidth}px for ${Math.round(i.getBoundingClientRect().width * d)}`);
        return {n: shown.length, soft, wait: top.filter(i => i.classList.contains("ui-wait") || !i.naturalWidth).length};
      });
      let r = await check();
      ok(r.n >= 8 && !r.soft.length && !r.wait, `${w} @${dpr}x: all ${r.n} sticker previews are sharp: ` + r.soft.slice(0, 5).join(", "));
      // Zooming in: the previews are made again at the new density
      if (dpr === 1) {
        const cdp = await ctx.newCDPSession(p);
        await cdp.send("Emulation.setDeviceMetricsOverride", {width: w, height: 900, deviceScaleFactor: 3, mobile: false});
        await p.waitForTimeout(800);
        r = await check();
        ok(!r.soft.length, `${w}: after zooming in to 3x, they're still sharp: ` + r.soft.slice(0, 5).join(", "));
      }
      ok(!errs.length, `${w} @${dpr}x: no page errors: ` + errs.join(" | "));
      await ctx.close();
    }
  } finally { await browser.close(); }
  console.log(`\nshop-sticker-sharp.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
