// node tests/area-one-choice.e2e.js
// Area of Study: a field from the list or your own typed in, never both. Picking a field empties the box; typing unpicks the
// field and saves as your own (Something Else, tuned by the AI). It used to keep both, and the picked field was ignored.
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = {v: 2, updated: 1, tasks: [], notes: [], files: [], decks: [], events: [], courses: [], settings: {area: {id: "law", text: "Big man"}}};
(async () => {
  const browser = await chromium.launch({executablePath}), errs = [];
  try {
    const ctx = await browser.newContext({viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true});
    await ctx.addInitScript(seed => { window.__SB_TEST = true; try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("coursework:v2", JSON.stringify(seed)); } } catch (e) {} }, SEED);
    const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.goto("file://" + path.join(__dirname, "..", "index.html")); await page.waitForFunction(() => window.__sbSync && window.SBAREA, null, {timeout: 15000}); await page.waitForTimeout(600);
    const open = async () => { await page.evaluate(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); SBAREA.sheet(); }); await page.waitForTimeout(300); };
    const view = () => page.evaluate(() => ({on: [...document.querySelectorAll(".area-chip.on[data-area]")].map(b => b.dataset.area), text: document.getElementById("areaText").value}));
    // a saved field with both (from before): shown as the typed field, nothing picked
    await open();
    let v = await view();
    ok(v.on.length === 0 && v.text === "Big man", `an area saved with both shows as the typed field, nothing picked (${JSON.stringify(v)})`);
    // picking a field empties the box
    await page.click('.area-chip[data-area="health"]');
    v = await view();
    ok(v.on.join() === "health" && v.text === "", "picking a field empties the box");
    // typing unpicks the field
    await page.fill("#areaText", "Marine Biology");
    v = await view();
    ok(v.on.length === 0 && v.text === "Marine Biology", "typing your own field unpicks the field");
    await page.click("[data-area-save]"); await page.waitForTimeout(200);
    let a = await page.evaluate(() => SBAREA.get());
    ok(a.id === "other" && a.text === "Marine Biology", "it saves as your own field: " + JSON.stringify(a));
    // and back: picking a field saves just that
    await open(); await page.click('.area-chip[data-area="cs"]'); await page.click("[data-area-save]"); await page.waitForTimeout(200);
    a = await page.evaluate(() => SBAREA.get());
    ok(a.id === "cs" && !a.text, "picking a field saves just the field: " + JSON.stringify(a));
    await open(); v = await view();
    ok(v.on.join() === "cs" && v.text === "", "and it reopens that way");
    // emptying the box after typing leaves Save off until something is picked or typed
    await page.fill("#areaText", "x"); await page.fill("#areaText", "");
    ok(await page.evaluate(() => document.querySelector("[data-area-save]").disabled), "typing then emptying the box leaves nothing chosen, so Save waits");
    ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
    console.log("area-one-choice.e2e: " + n + " checks passed");
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
