// node tests/cushion.e2e.js  Time Cushion: the pill next to Time Today (spare: green, up to 1h short: yellow, over 1h short: red, nothing due, a day off) and its sheet,
// at phone (402 px) and desktop (1300 px) width. CUSH_SHOT=<dir> saves screenshots of each state.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const SHOT = process.env.CUSH_SHOT || "";
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
// Thursday 26 November 2026, 9:00 in the morning
const NOW = new Date(2026, 10, 26, 9, 0);
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const D = k => { const d = new Date(NOW); d.setDate(d.getDate() + k); return iso(d); };
const T = (id, title, due, o) => Object.assign({id, title, courseId: "c1", type: "Assignment", start: D(-2), due, time: "", priority: "med", status: "todo", notes: "", hours: 2, checklist: [], pct: 0, dependsOn: [], history: [], created: 1, order: 10}, o || {});
const data = (tasks, settings) => JSON.stringify({v: 2, updated: 1, courses: [{id: "c1", name: "Biology", code: "BIOL 1200", color: "#1E9E74"}, {id: "c2", name: "Writing", code: "ENGL 1100", color: "#D9661F"}], tasks, events: [], notes: [], decks: [], files: [], settings: Object.assign({dailyHours: 3}, settings || {})});

(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    for (const [w, h, mob] of [[402, 874, true], [1300, 860, false]]) {
      for (const scheme of ["light", "dark"]) {
        if (scheme === "dark" && !SHOT) continue;
        const dark = scheme === "dark", tag = `${dark ? "dark-" : ""}${w}`;
        const ctx = await browser.newContext({serviceWorkers: "block", viewport: {width: w, height: h}, isMobile: mob, hasTouch: mob, deviceScaleFactor: 1, colorScheme: scheme});
        await ctx.addInitScript(require("./consent-ok")); await ctx.routeWebSocket(/supabase\.co/, ws => ws.close()); await ctx.route(/supabase\.co/, r => r.abort());
        await ctx.addInitScript(() => { localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done"); window.__SB_TEST = true; });
        const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
        await page.clock.setFixedTime(NOW);
        const load = async (tasks, settings) => {
          await page.goto(base + "#blank");
          await page.evaluate(([k, v]) => { localStorage.setItem(k, v); localStorage.removeItem("coursework:today"); }, ["coursework:v2", data(tasks, settings)]);
          await page.goto(base); await page.waitForFunction(() => window.SBCUSH && document.querySelector("section.plan"), null, {timeout: 40000});
          await page.waitForTimeout(700);
        };
        const cush = () => page.evaluate(() => { const c = SBCUSH.now(); return c && {state: c.state, mins: c.mins, by: c.by, rows: c.groups.length, tight: c.tight, noEst: c.noEst, fixes: c.fixes.map(f => f.kind)}; });
        const pill = () => page.evaluate(() => {
          const all = [...document.querySelectorAll(".cush-pill")].filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== "hidden");
          const e = all[0]; if (!e) return null;
          const r = e.getBoundingClientRect(), hc = e.closest(".hours-ctl, .bv-hours"), btns = hc ? [...hc.querySelectorAll('[data-act="today-h"]')].map(b => b.getBoundingClientRect()) : [];
          const over = btns.some(b => !(b.right <= r.left || b.left >= r.right || b.bottom <= r.top || b.top >= r.bottom));
          return {n: all.length, text: e.textContent.trim(), cls: e.className, left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height), over, oneLine: (() => { const g = document.createRange(); g.selectNodeContents(e.querySelector("span")); return g.getClientRects().length === 1; })(), near: !!hc, color: getComputedStyle(e).color, bg: getComputedStyle(e).backgroundColor};
        });
        const shot = async (name, p) => {
          if (!SHOT || !p) return;
          await page.screenshot({path: path.join(SHOT, `cushion-${name}-${tag}.png`), clip: {x: Math.max(0, mob ? 0 : p.left - 220), y: Math.max(0, p.top - (p.cls.includes("cush-below") ? 46 : 30)), width: mob ? w : Math.min(w - Math.max(0, p.left - 220), 600), height: 100}});
        };
        if (!dark) console.log(`\n${w}px`);

        // spare: a light fortnight
        await load([T("a", "Lab Report", D(4), {hours: 2}), T("b", "Reading Notes", D(6), {hours: 1, courseId: "c2"})]);
        let c = await cush(), p = await pill();
        if (!dark) {
          ok(c.state === "spare" && c.mins >= 30 && c.rows === 2, `${w}px spare: ` + JSON.stringify(c));
          ok(p && /^\d+h( \d+m)? to spare$|^\d+m to spare$/.test(p.text) && /cush-spare/.test(p.cls), `${w}px spare: the pill says how much is spare: ` + JSON.stringify(p));
          ok(p.near && !p.over && p.left >= 0 && p.right <= w && p.oneLine, `${w}px: the pill sits with Time Today, on screen, on one line, clear of its buttons: ` + JSON.stringify(p));
          ok(p.n === 1, `${w}px: only one pill is shown`);
        }
        await shot("spare", p);

        // yellow ("tight"): tune one task so it's about 30 minutes short (short by up to an hour is yellow; more is red)
        const H = 2 + (c.mins + 30) / 60;
        await load([T("a", "Lab Report", D(4), {hours: Math.round(H * 100) / 100}), T("b", "Reading Notes", D(6), {hours: 1, courseId: "c2"})]);
        c = await cush(); p = await pill();
        if (!dark) {
          ok(c.state === "tight" && c.mins < 0 && c.mins >= -60, `${w}px yellow, up to an hour short: ` + JSON.stringify(c));
          ok(p && /^\d+m short by Mon$/.test(p.text) && /cush-tight/.test(p.cls) && p.oneLine && !p.over && p.right <= w, `${w}px yellow: "…m short by Mon": ` + JSON.stringify(p));
        }
        await shot("tight", p);

        // red ("short"): well over an hour more work than time, with one task that has no estimate
        await load([T("a", "Lab Report", D(4), {hours: 17}), T("b", "Reading Notes", D(6), {hours: null, courseId: "c2", type: "Reading"}), T("c", "Essay Plan", D(9), {hours: 3, courseId: "c2"})]);
        c = await cush(); p = await pill();
        if (!dark) {
          ok(c.state === "short" && c.mins < -60 && c.by === D(4) && c.noEst === 1, `${w}px red, over an hour short: ` + JSON.stringify(c));
          ok(p && /^(\d+h )?\d+m short by Mon$|^\d+h short by Mon$/.test(p.text) && /cush-short/.test(p.cls) && p.oneLine && !p.over && p.right <= w, `${w}px short: "… short by Mon": ` + JSON.stringify(p));
          const heads = await page.evaluate(() => /you're about .* short for what's due by then/.test(document.querySelector("section.plan").textContent));
          ok(heads, `${w}px short: the Heads Up shortfall line is still there`);
        }
        await shot("short", p);

        // the sheet
        await page.locator(".cush-pill:visible").first().click(); await page.waitForTimeout(600);
        const sh = await page.evaluate(() => {
          const s = document.querySelector("dialog[open] .cush-sheet"); if (!s) return null;
          const b = s.querySelector(".sheet-body"), rows = [...s.querySelectorAll(".cush-row")];
          const wide = [...s.querySelectorAll("*")].filter(e => { const r = e.getBoundingClientRect(), br = b.getBoundingClientRect(); return r.width && (r.right > br.right + 1 || r.left < br.left - 1); }).map(e => e.className).slice(0, 4);
          return {title: (s.querySelector("h2") || {}).textContent, sum: s.querySelector(".cush-sum").textContent.replace(/\s+/g, " ").trim(), rows: rows.length, tight: rows.findIndex(r => r.classList.contains("is-tight")), tag: (s.querySelector(".is-tight .cush-tag") || {}).textContent,
            nums: rows.map(r => [...r.querySelectorAll("dd")].map(d => d.textContent)), fixes: [...s.querySelectorAll(".cush-fix [data-act]")].map(x => x.dataset.act + ":" + x.textContent.trim()), est: !!s.querySelector('.cush-note [data-act="est-open"]'),
            note: (s.querySelector(".cush-note") || {}).textContent || "", lede: s.querySelector(".cush-lede").textContent, wide, sx: b.scrollWidth - b.clientWidth, sheetW: Math.round(s.getBoundingClientRect().width)};
        });
        if (!dark) {
          ok(sh && sh.title === "Time Cushion" && /short for what's due by Mon, Nov 30/.test(sh.sum), `${w}px sheet: opens with the shortfall and its date: ` + JSON.stringify(sh && sh.sum));
          ok(sh.rows === 3 && sh.tight === 0 && /Tightest/i.test(sh.tag) && /short$/.test(sh.nums[0][2]) && /spare$/.test(sh.nums[2][2]), `${w}px sheet: a row per deadline, the tightest marked: ` + JSON.stringify(sh.nums));
          ok(sh.fixes.some(f => /^cush-add:Add \d+h( \d+m)? Today|^cush-add:Add \d+m Today/.test(f)) && sh.fixes.some(f => f === "cush-earlier:Start Earlier"), `${w}px sheet: fixes to add time today and start earlier: ` + JSON.stringify(sh.fixes));
          ok(sh.est && /1 task has no time estimate/.test(sh.note), `${w}px sheet: names the task without an estimate, with a link to Quick Estimates`);
          ok(/next 2 weeks/.test(sh.lede) && /time your work|really takes/.test(sh.lede), `${w}px sheet: says what is counted and the accuracy line: ` + sh.lede);
          ok(!sh.wide.length && sh.sx <= 0 && sh.sheetW <= w, `${w}px sheet: nothing spills sideways: ` + JSON.stringify(sh.wide) + " " + sh.sx);
        }
        if (SHOT) await page.screenshot({path: path.join(SHOT, `cushion-sheet-${tag}.png`)});
        if (!dark) {
          // Add time today: the cushion grows, and Undo puts it back
          const before = c.mins;
          await page.locator('dialog[open] [data-act="cush-add"]').click(); await page.waitForTimeout(600);
          const after = await cush(), th = await page.evaluate(() => { const o = JSON.parse(localStorage.getItem("coursework:today") || "null"); return o ? o.h : 3; });
          ok(after.mins > before && th > 3 && await page.evaluate(() => !!document.querySelector("dialog[open] .cush-sheet")), `${w}px Add Time Today: the cushion grows (${before} → ${after.mins}) and the sheet stays with the new numbers`);
          const toast = await page.evaluate(() => { const t = document.getElementById("toast"); return t && t.classList.contains("show") ? t.textContent : ""; });
          ok(/Added \d.* to Time Today/.test(toast) && /Undo/.test(toast), `${w}px: a toast with Undo: ` + toast);
          await page.locator("#toastUndo").click(); await page.waitForTimeout(500);
          ok((await cush()).mins === before && await page.evaluate(() => { const o = JSON.parse(localStorage.getItem("coursework:today") || "null"); return o ? o.h : 3; }) === 3, `${w}px Undo: Time Today and the cushion are back`);
          // Check Estimates opens Quick Estimates
          await page.locator('dialog[open] .cush-note [data-act="est-open"]').click(); await page.waitForTimeout(500);
          ok(await page.evaluate(() => !!document.querySelector("dialog[open] .est-sheet")), `${w}px: Check Estimates opens Quick Estimates`);
          await page.keyboard.press("Escape"); await page.waitForTimeout(300);
          // Start Earlier opens the Crunch preview for that week
          await page.locator(".cush-pill:visible").first().click(); await page.waitForTimeout(400);
          await page.locator('dialog[open] [data-act="cush-earlier"]').click(); await page.waitForTimeout(700);
          ok(await page.evaluate(() => !!document.querySelector("dialog[open] .cr-sheet")), `${w}px: Start Earlier opens the Crunch preview`);
          await page.keyboard.press("Escape"); await page.waitForTimeout(300);
        }

        if (!dark) {
          // a long one ("13h 45m short by tomorrow"): still on screen, on one line, clear of the − and + buttons
          await load([T("a", "Lab Report", D(1), {hours: 20})]);
          p = await pill();
          ok(p && /short by tomorrow$/.test(p.text) && p.oneLine && !p.over && p.left >= 0 && p.right <= w, `${w}px a long pill still fits: ` + JSON.stringify(p));
          if (SHOT) await shot("long", p);
          // nothing due: no pill, and the widget feed says so
          await load([T("far", "Final Project", D(30), {hours: 20})]);
          c = await cush();
          ok(c.state === "none" && !(await pill()), `${w}px nothing due in 2 weeks: no pill`);
          ok(JSON.stringify(await page.evaluate(() => window.__sbPhoneWidgets.data().cushion)) === JSON.stringify({mins: 0, by: "", state: "none"}), `${w}px nothing due: the widget feed says none`);

          // a day off: a day off tomorrow and the day after takes their time away; taking today off hides the pill (no Time Today)
          const work = [T("a", "Lab Report", D(4), {hours: 10})];
          await load(work); const on = await cush();
          await load(work, {daysOff: {[D(1)]: 1, [D(2)]: 1}}); const off = await cush(); p = await pill();
          ok(off.mins < on.mins && off.mins === on.mins - 360 && p, `${w}px days off: two days off take 6h off the cushion (${on.mins} → ${off.mins})`);
          ok(off.state === "short" && off.fixes.includes("dayoff"), `${w}px days off: short, and studying on a day off is offered: ` + JSON.stringify(off));
          await page.locator(".cush-pill:visible").first().click(); await page.waitForTimeout(400);
          const offBtn = await page.evaluate(() => { const b = document.querySelector('dialog[open] [data-act="cush-off"]'); return b && b.textContent; });
          ok(/^Study Friday$/.test(offBtn || ""), `${w}px: "Study Friday" button: ` + offBtn);
          await page.locator('dialog[open] [data-act="cush-off"]').click(); await page.waitForTimeout(500);
          ok(await page.evaluate(d => !(window.__sbSync.state.settings.daysOff || {})[d], D(1)) && (await cush()).mins > off.mins, `${w}px Study Friday: Friday is a study day again and the cushion grows`);
          await page.locator("#toastUndo").click(); await page.waitForTimeout(400);
          ok(await page.evaluate(d => !!(window.__sbSync.state.settings.daysOff || {})[d], D(1)) && (await cush()).mins === off.mins, `${w}px Undo: the day off is back`);
          await page.keyboard.press("Escape"); await page.waitForTimeout(200);
          await load(work, {daysOff: {[D(0)]: 1}});
          ok(!(await pill()) && (await cush()).state !== "none", `${w}px today off: no pill (Time Today isn't shown), though the cushion is still worked out`);

          // the widget feed carries it, in whole numbers
          await load([T("a", "Lab Report", D(4), {hours: 15})]);
          const wd = await page.evaluate(() => window.__sbPhoneWidgets.data().cushion);
          ok(Number.isInteger(wd.mins) && wd.mins < 0 && ["tight", "short"].includes(wd.state) && wd.by === D(4), `${w}px widget numbers are whole: ` + JSON.stringify(wd));
          ok(!errs.length, `${w}px no page errors: ` + errs.join(" | "));
        }
        await ctx.close();
      }
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\ncushion.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
