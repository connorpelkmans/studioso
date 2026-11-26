// The companion chat keeps where you scrolled to through page redraws, and jumps to the newest answer only when one arrives
const assert = require("assert"), path = require("path");
const {chromium, executablePath} = require("./pw");
const file = path.resolve(__dirname, "..", "index.html");
let n = 0; const ok = (c, m) => { n++; assert(c, m); };

(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 1140, height: 700}}); const page = await ctx.newPage(), errs = [];
    page.on("pageerror", e => errs.push(e.message));
    await page.addInitScript(() => {
      window.__SB_TEST = true;
      const msgs = Array.from({length: 16}, (_, i) => ({q: "Question number " + (i + 1), a: {answer: ("Answer " + (i + 1) + ". ").repeat(30)}, at: 1790000000000 + i * 60000}));
      try {
        localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, tasks: [], notes: [], decks: [], courses: [], settings: {capacity: 15, dailyHours: 3}}));
        localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done");
        localStorage.setItem("studyboard:comp:chats", JSON.stringify([{id: "c1", title: "Long chat", at: 1790001000000, msgs}]));
      } catch (e) {}
    });
    await page.goto("file://" + file); await page.waitForTimeout(1200);
    await page.evaluate(() => { const B = window.__sbBreakdown; B.ui.cpt.id = "c1"; B.ui.tab = "companion"; B.render(); });
    await page.waitForSelector("#cptLog .cpt-q"); await page.waitForTimeout(400);
    const at = () => page.evaluate(() => { const l = document.getElementById("cptLog"); return {top: Math.round(l.scrollTop), max: l.scrollHeight - l.clientHeight}; });
    const first = await at();
    ok(first.max > 400 && first.top > first.max - 900, "a chat opens at its newest answer: " + JSON.stringify(first));

    // scroll up, then the page redraws several times (in animation frames, like a theme's scene or a sync)
    await page.evaluate(() => { document.getElementById("cptLog").scrollTop = 120; }); await page.waitForTimeout(150);
    await page.evaluate(() => new Promise(res => { let k = 0; const B = window.__sbBreakdown; const step = () => { B.render(); if (++k < 8) requestAnimationFrame(step); else setTimeout(res, 200); }; requestAnimationFrame(step); }));
    const kept = await at();
    ok(Math.abs(kept.top - 120) <= 2, "redraws keep the place you scrolled to: " + JSON.stringify(kept));

    // a new answer arrives: the chat shows it
    await page.evaluate(() => { const a = JSON.parse(localStorage.getItem("studyboard:comp:chats")); a[0].msgs.push({q: "Brand new question", a: {answer: "New answer"}, at: Date.now()}); localStorage.setItem("studyboard:comp:chats", JSON.stringify(a)); window.__sbBreakdown.render(); });
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => { const l = document.getElementById("cptLog"), q = [...l.querySelectorAll(".cpt-q")].pop(); return {q: q.textContent, d: Math.round(q.getBoundingClientRect().top - l.getBoundingClientRect().top), end: l.scrollHeight - l.clientHeight - l.scrollTop < 2}; });
    ok(/Brand new question/.test(after.q) && after.d >= 0 && (after.d < 60 || after.end), "a new answer jumps to its question: " + JSON.stringify(after));
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    await ctx.close();
  } finally { await browser.close(); }
  console.log(`companion-scroll-keep e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
