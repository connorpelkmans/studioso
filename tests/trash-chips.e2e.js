// node tests/trash-chips.e2e.js [screenshot folder]
// Recently Deleted on a phone: the kind filters (All, Tasks, Events, Bulk Deletions) stay on one line instead of wrapping onto a
// second at the usual phone widths (on a very narrow one they may wrap, but are never cut off).
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const FILE = "file://" + path.join(__dirname, "..", "index.html"), SHOTS = process.argv[2] || "";
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  const browser = await chromium.launch({executablePath}), errs = [];
  try {
    for (const w of [430, 402, 375, 360]) {
      const ctx = await browser.newContext({viewport: {width: w, height: 874}, isMobile: true, hasTouch: true, deviceScaleFactor: SHOTS ? 2 : 1});
      await ctx.addInitScript(() => {
        window.__SB_TEST = true;
        try {
          if (localStorage.getItem("coursework:v2")) return;
          localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:tour", "done");
          localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [], tasks: [], decks: [], notes: [], files: [], events: [], settings: {}}));
          const e = (i, kind, label, items) => ({id: kind + i, kind, label, detail: "", deletedAt: Date.now() - (i + 1) * 864e5, items: items || [{kind, id: "x" + kind + i, data: {id: "x" + kind + i, title: label}}]});
          const bin = [...Array(18)].map((_, i) => e(i, "task", "Biol 260 homework " + i)).concat([e(0, "event", "Shift"), e(1, "event", "Study group"),
            e(0, "bulk", "Imported tasks", [...Array(70)].map((_, k) => ({kind: "task", id: "b0" + k, data: {id: "b0" + k, title: "T" + k}}))), e(1, "bulk", "Old term", [...Array(80)].map((_, k) => ({kind: "task", id: "b1" + k, data: {id: "b1" + k, title: "T" + k}})))]);
          localStorage.setItem("studioso:trash", JSON.stringify(bin));
        } catch (x) {}
      });
      const page = await ctx.newPage(); page.on("pageerror", x => errs.push(x.message));
      await page.goto(FILE); await page.waitForTimeout(1500);
      await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
      await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "trash-open"; b.hidden = true; document.body.appendChild(b); b.click(); b.remove(); });
      await page.waitForSelector("#trChips .chip"); await page.waitForTimeout(300);
      const g = await page.evaluate(() => { const row = document.getElementById("trChips"), r = row.getBoundingClientRect();
        return {labels: [...row.children].map(c => c.textContent.trim()), tops: [...row.children].map(c => Math.round(c.getBoundingClientRect().top)), rights: [...row.children].map(c => Math.round(c.getBoundingClientRect().right)), rowRight: Math.round(r.right), clipped: [...row.children].some(c => { const q = c.getBoundingClientRect(); return q.top < r.top - 0.5 || q.bottom > r.bottom + 0.5; }), h: Math.round(r.height), scroll: row.scrollWidth > row.clientWidth + 1}; });
      ok(g.labels.length === 4 && /Bulk Deletions/.test(g.labels[3]), `${w}px: the filters are All, Tasks, Events, Bulk Deletions (${g.labels.join(" | ")})`);
      if (w >= 390) ok(new Set(g.tops).size === 1, `${w}px: they're all on one line (tops ${g.tops.join(", ")})`);
      ok(!g.clipped && g.h >= 30, `${w}px: the chips are shown whole (${g.h}px)`);
      ok(Math.max(...g.rights) <= g.rowRight && !g.scroll, `${w}px: and every chip is fully on screen`);
      if (SHOTS) await page.locator("#dlg").screenshot({path: path.join(SHOTS, `trash-chips-${w}.png`)});
      // the filter still works
      await page.click('#trChips [data-k="bulk"]'); await page.waitForTimeout(200);
      ok(await page.locator('#trChips [data-k="bulk"].on').count() === 1, `${w}px: tapping Bulk Deletions picks it`);
      await ctx.close();
    }
    ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
    console.log("trash-chips.e2e: " + n + " checks passed");
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
