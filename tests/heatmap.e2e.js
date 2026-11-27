// node tests/heatmap.e2e.js  The Study Heatmap: a free card in Insights (next to the Focus Garden) and a compact one on a course page,
// with a tooltip on hover or tap, arrow-key navigation, a monthly table for screen readers, and nothing at all without history.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const seed = require("./heatmap-seed");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const act = (page, a, id) => page.evaluate(([a, id]) => { const b = document.createElement("button"); b.dataset.act = a; if (id) b.dataset.id = id; b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); }, [a, id || ""]);
const EMPTY = {v: 2, updated: 1, files: [], notes: [], events: [], decks: [], tasks: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIOL 1200", color: "#1E9E74"}]};
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const open = async (w, h, mob, data, free) => {
    const ctx = await browser.newContext({serviceWorkers: "block", viewport: {width: w, height: h}, isMobile: mob, hasTouch: mob, locale: "en-US"}); await ctx.addInitScript(require("./consent-ok")); await ctx.routeWebSocket(/supabase\.co/, ws => ws.close()); await ctx.route(/supabase\.co/, r => r.abort());
    await ctx.addInitScript(([data, free]) => {
      if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(data));
      localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done");
      if (free) localStorage.setItem("studyboard:paywall-test", "1");
    }, [data, !!free]);
    const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => typeof window.SBREVIEW !== "undefined", null, {timeout: 40000}); await page.waitForTimeout(600);
    return {ctx, page};
  };
  const tip = page => page.evaluate(sel => { const t = document.querySelector(sel + " .hm-tip"); const l = document.querySelector(sel + " .hm-live"); const on = document.querySelector(sel + " .hm-on"); return {shown: !!t && !t.hidden, text: t ? t.textContent : "", live: l ? l.textContent : "", on: on ? on.dataset.d : ""}; }, ".hm-card");
  try {
    for (const [w, h, mob] of [[402, 874, true], [1300, 860, false]]) {
      const {ctx, page} = await open(w, h, mob, seed(), true);
      /* Insights */
      await act(page, "pro-ins-open"); await page.waitForSelector(".pro-ins-body .hm-card", {timeout: 5000});
      // every weekday row is the same height: the Mon/Wed/Fri labels used to make their rows taller than the ~7px desktop cells
      const rowH = await page.evaluate(() => [...document.querySelectorAll(".hm-card .hm-wd:not(.hm-corner)")].map(e => e.getBoundingClientRect().height));
      ok(rowH.length === 7 && Math.max(...rowH) - Math.min(...rowH) < 0.6, `${w}px: all 7 weekday rows are the same height (labels don't stretch theirs): ` + rowH.map(x => x.toFixed(1)).join(","));
      const ins = await page.evaluate(() => {
        const body = document.querySelector(".pro-ins-body"), card = body.querySelector(".hm-card"), kids = [...body.children];
        const sc = card.querySelector(".hm-scroll"), r = card.getBoundingClientRect();
        return {title: card.querySelector("h3").textContent, badge: !!card.querySelector(".pro-badge, .badge-pro, [class*='pro-b']") || /PRO/.test(card.querySelector("h3").innerHTML),
          afterGarden: kids.findIndex(x => x.classList.contains("sp-garden")) > 0 && kids.indexOf(card) === kids.findIndex(x => x.classList.contains("sp-garden")) + 1,
          cells: card.querySelectorAll(".hm-grid .hm-c").length, levels: [...new Set([...card.querySelectorAll(".hm-grid .hm-c")].map(c => c.dataset.l))].sort().join(""),
          stats: [...card.querySelectorAll(".hm-stat")].map(s => s.textContent), today: !!card.querySelector(".hm-today"),
          sw: sc.scrollWidth, cw: sc.clientWidth, sl: Math.round(sc.scrollLeft), page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          cardFits: r.left >= 0 && r.right <= innerWidth + 0.5, rows: card.querySelectorAll("table.sr tbody tr").length, caption: (card.querySelector("table.sr caption") || {}).textContent,
          locked: body.querySelectorAll(".pro-lockcard").length, how: card.querySelector(".hm-how").textContent};
      });
      ok(ins.title === "Study Heatmap" && !ins.badge, `${w}px: Insights shows the free Study Heatmap card, with no Pro badge: ` + ins.title);
      ok(ins.locked > 0, `${w}px: this student is on the free plan (other Insights cards are previews)`);
      ok(ins.afterGarden, `${w}px: it sits right after the Focus Garden`);
      ok(ins.cells >= 365 && ins.cells <= 371, `${w}px: a year of days: ${ins.cells}`);
      ok(ins.levels === "01234", `${w}px: all 5 steps are used by 6 months of history: ` + ins.levels);
      ok(ins.stats.length === 3 && /Current run/.test(ins.stats[0]) && /Longest run/.test(ins.stats[1]) && /This term/.test(ins.stats[2]), `${w}px: current run, longest run and this term: ` + JSON.stringify(ins.stats));
      ok(ins.today, `${w}px: today is marked`);
      ok(/½ minute per card/.test(ins.how) && /10 minutes per task/.test(ins.how), `${w}px: the formula is shown`);
      ok(ins.rows === 12 || ins.rows === 13, `${w}px: a monthly summary table for screen readers (${ins.rows} rows): ${ins.caption}`);
      ok(ins.page <= 0 && ins.cardFits, `${w}px: the page itself never scrolls sideways (${ins.page})`);
      if (mob) ok(ins.sw > ins.cw && ins.sl >= ins.sw - ins.cw - 2, `${w}px: the year scrolls inside its card and starts at today: ` + JSON.stringify({sw: ins.sw, cw: ins.cw, sl: ins.sl}));
      else ok(ins.sw <= ins.cw + 1, `${w}px: the whole year fits: ` + JSON.stringify({sw: ins.sw, cw: ins.cw}));

      /* Tooltip: hover on a desktop, tap on a phone */
      const target = await page.evaluate(() => { const c = [...document.querySelectorAll(".hm-card .hm-grid .hm-c[data-l='4']")].pop(); c.scrollIntoView({block: "center", inline: "center"}); return c.dataset.d; });
      await page.waitForTimeout(150);
      const cell = page.locator(`.hm-card .hm-c[data-d="${target}"]`);
      if (mob) await cell.tap(); else await cell.hover();
      await page.waitForTimeout(200);
      let t = await tip(page);
      ok(t.shown && t.on === target && /of study/.test(t.text) && /focus/.test(t.text), `${w}px: ${mob ? "tapping" : "hovering"} a day shows its tooltip: ` + t.text);
      const tb = await page.evaluate(() => { const t = document.querySelector(".hm-card .hm-tip").getBoundingClientRect(), wr = document.querySelector(".hm-card .hm-wrap").getBoundingClientRect(); return t.left >= wr.left - 1 && t.right <= wr.right + 1; });
      ok(tb, `${w}px: the tooltip stays inside the card`);
      const cover = await page.evaluate(d => { const t = document.querySelector(".hm-card .hm-tip").getBoundingClientRect(), c = document.querySelector(`.hm-card .hm-c[data-d="${d}"]`).getBoundingClientRect(); return t.bottom <= c.top + 0.5 || t.top >= c.bottom - 0.5; }, target);
      ok(cover, `${w}px: the tooltip doesn't cover the day it describes`);
      if (!mob) { await page.mouse.move(5, 5); await page.waitForTimeout(150); ok(!(await tip(page)).shown, `${w}px: moving away hides it`); }

      /* Keyboard */
      await page.evaluate(() => document.querySelector(".hm-card .hm-grid").focus()); await page.waitForTimeout(150);
      const today = await page.evaluate(() => document.querySelector(".hm-card .hm-today").dataset.d);
      t = await tip(page);
      const startD = t.on;
      ok(t.shown && (startD === today || startD === target), `${w}px: focusing the grid shows the chosen day (or today): ` + t.on);
      await page.keyboard.press("End"); await page.keyboard.press("Control+End"); await page.waitForTimeout(80);
      t = await tip(page); ok(t.on === today && /today/.test(t.text), `${w}px: Ctrl+End goes to today: ` + t.text);
      await page.keyboard.press("ArrowRight"); t = await tip(page); ok(t.on === today, `${w}px: there is nothing after today`);
      await page.keyboard.press("ArrowLeft"); t = await tip(page);
      const wk = await page.evaluate(([a, b]) => (new Date(a) - new Date(b)) / 864e5, [today, t.on]);
      ok(wk === 7, `${w}px: ArrowLeft goes back a week: ${t.on}`);
      await page.keyboard.press("ArrowUp"); const t2 = await tip(page);
      ok(await page.evaluate(([a, b]) => (new Date(a) - new Date(b)) / 864e5, [t.on, t2.on]) === 1, `${w}px: ArrowUp goes back a day: ${t2.on}`);
      ok(t2.live && t2.live.indexOf(t2.text.slice(0, 6)) === 0, `${w}px: the day is announced in a live region: ` + t2.live);
      await page.keyboard.press("Control+Home"); t = await tip(page);
      const first = await page.evaluate(() => document.querySelector(".hm-card .hm-grid .hm-c").dataset.d);
      ok(t.on === first, `${w}px: Ctrl+Home goes to the first day shown`);
      const sl = await page.evaluate(() => document.querySelector(".hm-card .hm-scroll").scrollLeft);
      ok(!mob || sl < 30, `${w}px: the grid scrolls to keep the chosen day in view (${sl})`);
      await page.keyboard.press("Escape"); ok(!(await tip(page)).shown, `${w}px: Escape hides the tooltip`);
      ok(await page.evaluate(() => document.querySelector("#dlg").open), `${w}px: ...and leaves Insights open`);
      ok(await page.evaluate(() => document.querySelector(".hm-card .hm-grid").getAttribute("role") === "application" && /arrow keys/.test(document.querySelector(".hm-card .hm-grid").getAttribute("aria-label"))), `${w}px: the grid says how to use it`);

      /* This Term shows it too */
      await page.evaluate(() => document.querySelector('[data-act="pro-ins-kind"][data-id="term"]').click()); await page.waitForTimeout(300);
      ok(await page.locator(".pro-ins-body .hm-card").count() === 1, `${w}px: This Term shows the heatmap too`);
      await page.evaluate(() => document.querySelector("#dlg").close());

      /* Course page */
      await page.evaluate(() => { const b = document.querySelector('[data-tab="courses"]'); if (b) b.click(); }); await page.waitForTimeout(200);
      await act(page, "open-course", "c1"); await page.waitForTimeout(400);
      const cp = await page.evaluate(() => {
        const c = document.querySelector("#view .hm-course"); if (!c) return null; const sc = c.querySelector(".hm-scroll");
        return {cells: c.querySelectorAll(".hm-grid .hm-c").length, title: c.querySelector(".c2-bh .t").textContent, line: c.querySelector(".hm-line").textContent, sw: sc.scrollWidth, cw: sc.clientWidth, sl: Math.round(sc.scrollLeft),
          page: document.documentElement.scrollWidth - document.documentElement.clientWidth, rows: c.querySelectorAll("table.sr tbody tr").length};
      });
      ok(cp && cp.title === "Study Days" && cp.cells >= 176 && cp.cells <= 182, `${w}px: the course page has a compact 6-month heatmap: ` + JSON.stringify(cp));
      ok(cp.page <= 0 && (cp.sw <= cp.cw + 1 || cp.sl >= cp.sw - cp.cw - 2), `${w}px: it fits or starts scrolled to today, inside its card: ` + JSON.stringify(cp));
      ok(cp.rows === 6 || cp.rows === 7, `${w}px: with its own monthly table`);
      // only that course: Calculus's days differ from Biology's
      const c2 = await page.evaluate(() => { const ids = [...document.querySelectorAll("#view .hm-course .hm-c[data-v]")].map(c => c.dataset.d); return ids.length; });
      const cc = page.locator("#view .hm-course .hm-c[data-v]").last(); await cc.scrollIntoViewIfNeeded();
      if (mob) await cc.tap(); else await cc.hover();
      await page.waitForTimeout(150);
      ok(await page.evaluate(() => { const t = document.querySelector("#view .hm-course .hm-tip"); return !!t && !t.hidden && /study|focus/.test(t.textContent); }), `${w}px: the course heatmap's tooltip works (${c2} days with study)`);
      await act(page, "back"); await page.waitForTimeout(200);
      await act(page, "open-course", "c3"); await page.waitForTimeout(300);
      ok(await page.locator("#view .hm-course").count() === 0 && await page.locator("#view .c2-cols").count() === 1, `${w}px: a course with no study history shows no heatmap at all`);
      ok(!page.errs.length, `${w}px: no page errors: ` + page.errs.join(" | "));
      await ctx.close();

      /* Empty planner */
      const E = await open(w, h, mob, EMPTY, true);
      await act(E.page, "pro-ins-open"); await E.page.waitForSelector(".pro-ins-body .pro-card", {timeout: 5000});
      ok(await E.page.locator(".pro-ins-body .hm-card").count() === 0, `${w}px: with no history yet, Insights shows no heatmap`);
      await E.page.evaluate(() => document.querySelector("#dlg").close());
      await E.page.evaluate(() => { const b = document.querySelector('[data-tab="courses"]'); if (b) b.click(); }); await E.page.waitForTimeout(200);
      await act(E.page, "open-course", "c1"); await E.page.waitForTimeout(300);
      ok(await E.page.locator("#view .hm-course").count() === 0, `${w}px: ...and neither does the course page`);
      ok(!E.page.errs.length, `${w}px: no page errors (empty): ` + E.page.errs.join(" | "));
      await E.ctx.close();
    }
    /* Reduced motion: the tooltip appears without its fade */
    {
      const ctx = await browser.newContext({serviceWorkers: "block", viewport: {width: 1300, height: 860}, reducedMotion: "reduce", locale: "en-US"}); await ctx.addInitScript(require("./consent-ok")); await ctx.route(/supabase\.co/, r => r.abort());
      await ctx.addInitScript(data => { localStorage.setItem("coursework:v2", JSON.stringify(data)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done"); }, seed());
      const page = await ctx.newPage(); await page.goto(base); await page.waitForFunction(() => typeof window.SBREVIEW !== "undefined", null, {timeout: 40000}); await page.waitForTimeout(500);
      await act(page, "pro-ins-open"); await page.waitForSelector(".pro-ins-body .hm-card");
      await page.evaluate(() => document.querySelector(".hm-card .hm-grid").focus()); await page.waitForTimeout(100);
      ok(await page.evaluate(() => { const t = document.querySelector(".hm-card .hm-tip"); return !t.hidden && getComputedStyle(t).animationName === "none"; }), "reduced motion: the tooltip shows with no animation");
      await ctx.close();
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\nheatmap.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
