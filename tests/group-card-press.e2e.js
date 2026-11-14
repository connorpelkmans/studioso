// Phone: pressing and holding a group card to reorder it keeps the card's shape (rounded corners, full-size content)
const path = require("path"), fs = require("fs"), assert = require("assert");
const file = path.resolve(__dirname, "..", "index.html");
const {chromium, executablePath} = require("./pw");
let checks = 0; const ok = (c, m) => { checks++; assert(c, m); };

// Reuse the stub Supabase harness from groupkinds.e2e.js
const gk = fs.readFileSync(path.join(__dirname, "groupkinds.e2e.js"), "utf8");
const stubSrc = gk.slice(gk.indexOf("function stubInit"), gk.indexOf("\nconst SEED"));
const seedSrc = gk.slice(gk.indexOf("const SEED"), gk.indexOf("\nasync function boot"));
const SEED = new Function(seedSrc + "\nreturn SEED;")();

// Shape of the card and its content, measured on the page. The card's own lift (a gentle rotate/scale of the
// whole card) is set aside while measuring, so only changes to the inside of the card show.
const measure = (page, sel) => page.evaluate(sel => {
  const card = document.querySelector(sel); if (!card) return null;
  const main = card.querySelector(".grp-main"), band = card.querySelector(".g2-band"), name = card.querySelector(".grp-name");
  const cs = getComputedStyle(card), keep = card.style.cssText;
  card.style.setProperty("transform", "none", "important");
  const cr = card.getBoundingClientRect(), br = band.getBoundingClientRect();
  const out = {radius: cs.borderTopRightRadius, overflow: cs.overflow, mainTransform: getComputedStyle(main).transform,
    cardW: cr.width, bandW: br.width, bandInset: br.left - cr.left, nameW: name.getBoundingClientRect().width,
    font: getComputedStyle(name).fontSize, active: main.matches(":active")};
  card.style.cssText = keep; return out;
}, sel);

(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    const page = await ctx.newPage(), errs = [];
    page.on("pageerror", e => errs.push("pageerror: " + e.message));
    await page.addInitScript({content: `(${stubSrc})(${JSON.stringify({seed: SEED, me: "u1"})})`});
    await page.goto("file://" + file); await page.waitForTimeout(1500);
    await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "grp-page"; document.body.appendChild(b); b.click(); b.remove(); });
    await page.waitForSelector('#view .grp-card[data-sort-id="g2"] .grp-main'); await page.waitForTimeout(500);
    ok(await page.evaluate(() => matchMedia("(hover:none)").matches), "phone emulation has no hover");

    const sel = '#view .grp-card[data-sort-id="g2"]:not(.sort-ghost)';
    const base = await measure(page, sel);
    ok(base && parseFloat(base.radius) >= 12, "card is rounded at rest: " + (base && base.radius));
    const box = await page.locator(sel).boundingBox();
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    const cdp = await ctx.newCDPSession(page);
    const touch = (type, px, py) => cdp.send("Input.dispatchTouchEvent", {type, touchPoints: type === "touchEnd" ? [] : [{x: px, y: py, id: 1}]});

    const same = (m, label) => {
      ok(m, label + ": card found");
      ok(m.radius === base.radius, `${label}: corners stay rounded (${m.radius} vs ${base.radius})`);
      ok(m.mainTransform === "none", `${label}: card content is not scaled on its own (${m.mainTransform})`);
      ok(Math.abs(m.bandW / m.cardW - base.bandW / base.cardW) < 0.005, `${label}: coloured band still spans the card (${m.bandW}/${m.cardW} vs ${base.bandW}/${base.cardW})`);
      ok(Math.abs(m.bandInset - base.bandInset) < 1, `${label}: band not inset from the card edge (${m.bandInset} vs ${base.bandInset})`);
      ok(Math.abs(m.nameW - base.nameW) < 1 && m.font === base.font, `${label}: text keeps its size (${m.nameW}/${m.font} vs ${base.nameW}/${base.font})`);
    };

    await touch("touchStart", x, y);
    // Headless Chromium does not turn a CDP touch into :active, so hold the pressed state the way a phone browser does
    await cdp.send("DOM.enable"); await cdp.send("CSS.enable");
    const {root} = await cdp.send("DOM.getDocument", {depth: -1});
    const {nodeId} = await cdp.send("DOM.querySelector", {nodeId: root.nodeId, selector: sel + " .grp-main"});
    await cdp.send("CSS.forcePseudoState", {nodeId, forcedPseudoClasses: ["active"]});
    for (const t of [60, 150, 250]) {
      await page.waitForTimeout(t === 60 ? 60 : 90);
      // (on a slow run the hold can finish before the last look: the card has then lifted, checked below)
      if (await page.evaluate(() => document.body.classList.contains("sorting"))) break;
      const m = await measure(page, sel); ok(m.active, "card is in its pressed state"); same(m, "pressed " + t + "ms");
    }
    await page.waitForTimeout(300); // past the 380ms hold: the card lifts
    await touch("touchMove", x + 2, y + 3); await page.waitForTimeout(50);
    await touch("touchMove", x + 4, y + 8); await page.waitForTimeout(80);
    ok(await page.evaluate(() => document.body.classList.contains("sorting")), "holding lifts the card for reordering");
    const ghost = await measure(page, "#view .sort-ghost");
    same(ghost, "lifted copy");
    ok(ghost.overflow === "hidden", "lifted copy clips its content to the rounded corners");
    // where it will land: a dashed outline the card's size and shape (as on Flashcards and Quizzes); the card itself waits hidden
    const ph = await page.evaluate(() => { const p = document.querySelector("#view .grp-grid > .sort-ph"); if (!p) return null; const cs = getComputedStyle(p), r = p.getBoundingClientRect(), g = document.querySelector("#view .sort-ghost").getBoundingClientRect();
      return {style: cs.borderTopStyle, radius: cs.borderTopRightRadius, w: Math.round(r.width), h: Math.round(r.height), gw: Math.round(g.width), gh: Math.round(g.height), cardShown: [...document.querySelectorAll("#view .grp-grid > .grp-card")].filter(c => getComputedStyle(c).display !== "none").length}; });
    ok(ph && ph.style === "dashed" && ph.radius === base.radius, "a dashed outline with the card's corners marks its spot: " + JSON.stringify(ph));
    ok(ph && Math.abs(ph.w - box.width) <= 1 && Math.abs(ph.h - box.height) <= 1, `the outline is the card's size at rest (${ph && ph.w}x${ph && ph.h} vs ${Math.round(box.width)}x${Math.round(box.height)})`);
    await cdp.send("CSS.forcePseudoState", {nodeId, forcedPseudoClasses: []});
    await touch("touchEnd"); await page.waitForTimeout(150);
    ok(!(await page.$("#view .sort-ghost")), "lifted copy goes away on release");
    ok(!(await page.$("#view .sort-ph")) && await page.locator(sel).isVisible(), "on release the outline goes and the card is back");
    ok(!errs.length, "no errors: " + errs.join(" | "));
    await ctx.close();
  } finally { await browser.close(); }
  console.log(`group-card-press.e2e.js: ${checks} checks passed.`);
})().catch(e => { console.error("FAILED:", e.message.split("\n")[0]); process.exit(1); });
