// node tests/sort-placeholder.e2e.js [screenshot folder]
// Dragging a course card to reorder it: as on Flashcards and Quizzes, a dashed outline the card's size marks where it will land
// (the card itself is lifted, not left behind faded); dropping saves the new order.
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const FILE = "file://" + path.join(__dirname, "..", "index.html"), SHOTS = process.argv[2] || "";
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = {v: 2, updated: 1, settings: {}, tasks: [], notes: [], files: [], events: [], decks: [],
  courses: [{id: "c1", name: "Biology", code: "BIO 101", color: "#3FA37A", order: 0}, {id: "c2", name: "Chemistry", code: "CHEM 211", color: "#8E3FA0", order: 10}, {id: "c3", name: "Nursing", code: "BSNC 1030", color: "#C0563A", order: 20}]};
(async () => {
  const browser = await chromium.launch({executablePath}), errs = [];
  try {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 860}, deviceScaleFactor: SHOTS ? 2 : 1});
    await ctx.addInitScript(seed => { window.__SB_TEST = true; try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("coursework:v2", JSON.stringify(seed)); } } catch (e) {} }, SEED);
    const page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.goto(FILE); await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    await page.evaluate(() => { const S = window.__sbSync; S.ui.tab = "courses"; S.ui.courseId = null; S.render(); }); await page.waitForTimeout(500);
    const order = () => page.evaluate(() => [...document.querySelectorAll('#view [data-sortable="courses"] > [data-sort-id]')].map(e => e.dataset.sortId).join(","));
    ok(await order() === "c1,c2,c3", "the courses start in their order");
    const a = await page.locator('#view [data-sort-id="c1"]').boundingBox(), c = await page.locator('#view [data-sort-id="c3"]').boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + 30); await page.mouse.down();
    await page.mouse.move(a.x + a.width / 2 + 10, a.y + 40, {steps: 3});
    // onto the lower half of the last course (it sits on the next row)
    await page.mouse.move(c.x + c.width * 0.8, c.y + c.height * 0.8, {steps: 12}); await page.waitForTimeout(150);
    const mid = await page.evaluate(() => { const ph = document.querySelector('#view [data-sortable="courses"] > .sort-ph'), card = document.querySelector('#view .course-wrap:not(.sort-ghost)[style*="display: none"]');
      if (!ph) return null; const cs = getComputedStyle(ph), r = ph.getBoundingClientRect(); return {style: cs.borderTopStyle, color: cs.borderTopColor, radius: cs.borderTopLeftRadius, cardRadius: getComputedStyle(document.querySelector('#view [data-sort-id="c2"] .course-card')).borderTopLeftRadius, w: Math.round(r.width), h: Math.round(r.height), hidden: !!card, ghost: !!document.querySelector("#view .sort-ghost"), at: [...ph.parentNode.children].filter(e => e.matches("[data-sort-id]")).indexOf(ph)}; });
    ok(mid && mid.style === "dashed" && mid.ghost && mid.hidden, "while dragging: a dashed outline marks the spot, the card is lifted and not left behind (" + JSON.stringify(mid) + ")");
    ok(mid && parseFloat(mid.radius) > 0 && mid.radius === mid.cardRadius, `the outline has the card's rounded corners (${mid && mid.radius} vs ${mid && mid.cardRadius})`);
    ok(mid && Math.abs(mid.w - a.width) <= 1 && Math.abs(mid.h - a.height) <= 1, "the outline is the card's size");
    ok(mid && mid.at === 2, "the outline has moved to the end, where the card will land");
    if (SHOTS) await page.screenshot({path: path.join(SHOTS, "courses-drag.png"), clip: {x: 200, y: 0, width: 1080, height: 520}});
    await page.mouse.up(); await page.waitForTimeout(400);
    ok(!(await page.$("#view .sort-ph")) && !(await page.$("#view .sort-ghost")), "dropping clears the outline and the lifted copy");
    ok(await order() === "c2,c3,c1", "Biology now comes last (" + await order() + ")");
    const saved = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("coursework:v2")); const cs = Array.isArray(s.courses) ? s.courses : Object.values(s.courses); return cs.sort((x, y) => x.order - y.order).map(x => x.id).join(","); });
    ok(saved === "c2,c3,c1", "and the new order is saved (" + saved + ")");
    ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
    console.log("sort-placeholder.e2e: " + n + " checks passed");
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
