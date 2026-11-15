// node tests/prop-reveal.e2e.js [screenshot folder]
// A new companion prop is shown in the middle of the screen in a burst of light: its name, what earned it, Put It On and Later.
// Put It On dresses the companion; Later or Escape closes it; it waits while a sheet is open; one shows at a time.
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const FILE = "file://" + path.join(__dirname, "..", "index.html"), SHOTS = process.argv[2] || "";
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = {v: 2, updated: 1, notes: [], files: [], events: [], decks: [], tasks: [], courses: [], settings: {capacity: 15, comp: {earned: {medal: 1, scarf: 1}}}};
(async () => {
  const browser = await chromium.launch({executablePath}), errs = [];
  try {
    const ctx = await browser.newContext({viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true, deviceScaleFactor: SHOTS ? 3 : 1});
    await ctx.addInitScript(seed => { window.__SB_TEST = true; try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("coursework:v2", JSON.stringify(seed)); } } catch (e) {} }, SEED);
    const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.goto(FILE); await page.waitForTimeout(2000);
    await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close())); await page.waitForTimeout(300);
    ok(await page.evaluate(() => !!(window.SBCOMP && SBCOMP.current())), "a companion is out");
    // 1. the reveal
    await page.evaluate(() => SBCOMP.reveal("medal")); await page.waitForTimeout(1300);
    const r = await page.evaluate(() => { const o = document.querySelector(".cpu"); if (!o) return null; const b = o.querySelector(".cpu-prop").getBoundingClientRect();
      return {name: o.querySelector(".cpu-name").textContent, kick: o.querySelector(".cpu-kick").textContent, btns: [...o.querySelectorAll("[data-cpu]")].map(x => x.textContent), focus: document.activeElement && document.activeElement.textContent,
        cx: Math.round(b.left + b.width / 2), art: !!o.querySelector(".cpu-prop svg g, .cpu-prop svg path"), role: o.getAttribute("role"), label: o.getAttribute("aria-labelledby"), top: o.matches(":popover-open") || getComputedStyle(o).position === "fixed"}; });
    ok(r && r.name === "Champion Medal" && /New Prop Unlocked/i.test(r.kick) && r.art, "the new prop shows with its name and picture: " + JSON.stringify(r));
    ok(r && Math.abs(r.cx - 201) <= 2 && r.top, "in the middle of the screen, over everything");
    ok(r && r.btns.join("|") === "Later|Put It On" && r.focus === "Put It On" && r.role === "dialog" && r.label === "cpuName", "with Later and Put It On (focused), as a named dialog");
    if (SHOTS) await page.screenshot({path: path.join(SHOTS, "reveal.png")});
    // 2. Put It On
    await page.click('.cpu [data-cpu="wear"]'); await page.waitForTimeout(500);
    ok(!(await page.$(".cpu")), "Put It On closes it");
    ok((await page.evaluate(() => SBCOMP.wornNames())).includes("Champion Medal"), "and the companion is wearing the medal");
    // 3. it waits while a sheet is open
    await page.evaluate(() => { const b = document.querySelector('[data-act="menu"]'); b && b.click(); }); await page.waitForTimeout(500);
    ok(await page.evaluate(() => !!document.querySelector("dialog[open]")), "(a sheet is open)");
    await page.evaluate(() => SBCOMP.reveal("scarf")); await page.waitForTimeout(1200);
    ok(!(await page.$(".cpu")), "a new prop waits while a sheet is open");
    await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close())); await page.waitForTimeout(2000);
    ok(!!(await page.$(".cpu")) && (await page.textContent(".cpu-name")) === "Cozy Scarf", "and shows once it's closed");
    // 4. Escape: closed, not worn
    await page.keyboard.press("Escape"); await page.waitForTimeout(500);
    ok(!(await page.$(".cpu")) && !(await page.evaluate(() => SBCOMP.wornNames())).includes("Cozy Scarf"), "Escape closes it without putting it on");
    // 5. a prop not earned yet (Pro or not reached): one Got It button
    await page.evaluate(() => SBCOMP.reveal("cape")); await page.waitForTimeout(1300);
    const g = await page.evaluate(() => [...document.querySelectorAll(".cpu [data-cpu]")].map(x => x.textContent));
    ok(g.join("|") === "Got It", "a prop the companion can't wear yet has one Got It button: " + g.join("|"));
    await page.click('.cpu [data-cpu]'); await page.waitForTimeout(500);
    ok(!(await page.$(".cpu")), "Got It closes it");
    ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
    console.log("prop-reveal.e2e: " + n + " checks passed");
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
