// node tests/cls-totop.e2e.js [screenshot folder]
// A course's Lectures tab on a phone: scrolled well down the class list, a Back to Top arrow shows just above the add button;
// tapping it glides back to the top of the page, and it goes away there. Not shown on other tabs.
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const FILE = "file://" + path.join(__dirname, "..", "index.html"), SHOTS = process.argv[2] || "";
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const NOW = new Date(2026, 9, 5, 10, 30, 0);
const SEED = {v: 2,
  courses: [{id: "c1", name: "Biology", code: "BIO 101", color: "#3B6FE0", created: 1, classDates: {from: "2026-07-06", until: "2026-12-11"},
    meetings: [{id: "m1", kind: "Lecture", days: [1, 3, 5], start: "10:00", end: "11:40", where: "Burnham Hall, Room 308"}, {id: "m3", kind: "Office Hours", days: [1, 4], start: "12:00", end: "13:00"}]}],
  tasks: [], decks: [], notes: [], files: [], events: [], settings: {}, updated: 1};
const act = (page, a, id) => page.evaluate(([a, i]) => { const b = document.createElement("button"); b.dataset.act = a; if (i) b.dataset.id = i; b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id]);
(async () => {
  const browser = await chromium.launch({executablePath});
  const ctx = await browser.newContext({viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true, deviceScaleFactor: SHOTS ? 2 : 1});
  await ctx.clock.install({time: NOW});
  await ctx.addInitScript(seed => {
    try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("coursework:v2", JSON.stringify(seed)); } } catch (e) {}
  }, SEED);
  const page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push(e.message));
  try {
    await page.goto(FILE); await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    const btn = () => page.evaluate(() => { const b = document.querySelector(".cls-totop"); if (!b) return {shown: false}; const r = b.getBoundingClientRect(), cs = getComputedStyle(b), f = document.querySelector(".fab"), fr = f && f.getBoundingClientRect();
      return {shown: b.classList.contains("on") && cs.visibility === "visible", r: {l: Math.round(r.left), t: Math.round(r.top), b: Math.round(r.bottom), w: Math.round(r.width)}, fab: fr ? {cx: Math.round(fr.left + fr.width / 2), t: Math.round(fr.top)} : null, y: Math.round(scrollY), label: b.getAttribute("aria-label")}; });
    await page.evaluate(() => { const b = document.querySelector('[data-tab="courses"]'); if (b) b.click(); }); await page.waitForTimeout(300);
    await act(page, "open-course", "c1"); await page.waitForTimeout(300);
    await act(page, "course-tab", "lectures"); await page.waitForSelector(".cls-tab"); await page.waitForTimeout(500);
    // the tab opens at this week, already well down the list
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300);
    ok(!(await btn()).shown, "at the top of the list there's no Back to Top arrow");
    await page.evaluate(() => window.scrollTo(0, 2400)); await page.waitForTimeout(400);
    const b = await btn();
    ok(b.shown && b.label === "Back to top", "scrolled well down the class list, a Back to Top arrow shows (" + JSON.stringify(b) + ")");
    ok(b.fab && Math.abs(b.r.l + b.r.w / 2 - b.fab.cx) <= 1 && b.r.b <= b.fab.t - 8 && b.r.b >= b.fab.t - 16, "it sits just above the add button, lined up with it");
    if (SHOTS) await page.screenshot({path: path.join(SHOTS, "cls-totop.png")});
    await page.tap(".cls-totop"); await page.waitForTimeout(1500);
    const after = await btn();
    ok(after.y === 0, "tapping it goes back to the top of the page (scrollY " + after.y + ")");
    ok(!after.shown, "and at the top it goes away again");
    // other course tabs don't get it
    await act(page, "course-tab", "overview"); await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo(0, 2400)); await page.waitForTimeout(300);
    ok(!(await btn()).shown, "on the course's other tabs there's no arrow");
    ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
    console.log("cls-totop.e2e: " + n + " checks passed");
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
