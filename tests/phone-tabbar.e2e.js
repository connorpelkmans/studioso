// node tests/phone-tabbar.e2e.js  The phone's bottom bar in every Essentials configuration, at 360, 402 and 430 px, at default,
// Large and Extra Large text: the companion's seat is always there and always in the exact middle; Board, Calendar and Review sit
// to its left and everything else to its right, at most three a side, each side filling half the bar; no label is cut off; More
// only shows while a tab is waiting behind it; the tab beside the seat gets its cut-out. Then the one-week Show All Tabs card.
// PHONEBAR_SHOT=<dir> saves a picture of each bar.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const SHOT = process.env.PHONEBAR_SHOT || "";
const DAY = 864e5;
// unl: what Essentials has turned on (null: Essentials off, an existing student). right: the tabs expected right of the seat
const CONFIGS = [
  {name: "everything", unl: null, right: ["notes", "courses", "groups"]},
  {name: "essentials", unl: {}, right: ["courses", "MORE"]},
  {name: "notes on", unl: {notes: 1}, right: ["notes", "courses", "MORE"]},
  {name: "groups on", unl: {groups: 1}, right: ["courses", "groups", "MORE"]},
  {name: "notes and groups on", unl: {notes: 1, groups: 1}, right: ["notes", "courses", "groups"]},
  {name: "companion on", unl: {companion: 1}, right: ["courses", "MORE"]},
  {name: "all three on", unl: {notes: 1, groups: 1, companion: 1}, right: ["notes", "courses", "groups"]}
];
const LEFT = ["board", "plan", "flashcards"];
const seed = ([unl, ts, at, why, said]) => {
  const now = Date.now(), u = {}; if (unl) Object.keys(unl).forEach(k => { u[k] = {at: now, by: "test"}; });
  if (!localStorage.getItem("sb:ess")) localStorage.setItem("sb:ess", JSON.stringify(unl ? {on: true, why: why || "new", at: now - (at || 0), unl: u, said: said || {}} : {on: false, why: "existing", at: now, unl: {}, said: {}}));
  if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [{id: "c1", name: "Biology", code: "BIOL 1200", color: "#1E9E74"}], tasks: [], events: [], notes: [], decks: [], files: [], settings: {}}));
  localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done");
  if (ts) localStorage.setItem("studyboard:textsize", ts);
};
const bar = page => page.evaluate(() => {
  const nav = document.querySelector("nav.tabs"), nr = nav.getBoundingClientRect();
  const shown = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && cs.display !== "none" && cs.visibility !== "hidden"; };
  const items = [...nav.querySelectorAll(".in > *")].filter(shown).map(e => {
    const r = e.getBoundingClientRect(), k = e.dataset.tab || (e.classList.contains("ess-more") ? "MORE" : e.className);
    // the label: the button's own text, measured against the button (labels never wrap, so a cut one is wider than its button)
    const range = document.createRange(); range.selectNodeContents(e); const tr = [...range.getClientRects()].filter(x => x.height > 6 && x.width > 4);
    const tl = tr.length ? Math.min(...tr.map(x => x.left)) : r.left, trr = tr.length ? Math.max(...tr.map(x => x.right)) : r.right;
    return {k, l: r.left, r: r.right, w: r.width, cx: r.left + r.width / 2, cut: e.dataset.tab !== "companion" && (tl < r.left - 1 || trr > r.right + 1 || e.scrollWidth > e.clientWidth + 1), nl: e.classList.contains("ph-nl"), nr: e.classList.contains("ph-nr")};
  }).sort((a, b) => a.l - b.l);
  return {mid: nr.left + nr.width / 2, left: nr.left, right: nr.right, items, ts: document.documentElement.dataset.ts || "", cutout: nav.classList.contains("ph-seatcut")};
});
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  const open = async (w, args) => {
    const ctx = await browser.newContext({serviceWorkers: "block", viewport: {width: w, height: 800}, isMobile: true, hasTouch: true});
    await ctx.addInitScript(require("./consent-ok")); await ctx.routeWebSocket(/supabase\.co/, ws => ws.close()); await ctx.route(/supabase\.co/, r => r.abort());
    await ctx.addInitScript(seed, args);
    const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => typeof window.SBESS !== "undefined", null, {timeout: 40000}); await page.waitForTimeout(1600);
    return {ctx, page};
  };
  try {
    let combos = 0;
    for (const w of [360, 402, 430]) for (const ts of ["", "l", "xl"]) for (const c of CONFIGS) {
      const tag = `${w}px${ts ? " " + ts : ""} ${c.name}`;
      const {ctx, page} = await open(w, [c.unl, ts]);
      const b = await bar(page);
      if (ts) ok(b.ts === ts, `${tag}: text size applied (${b.ts})`);
      const keys = b.items.map(i => i.k), ci = keys.indexOf("companion"), comp = b.items[ci];
      ok(ci >= 0, `${tag}: the companion's seat is in the bar: ` + keys.join(","));
      ok(Math.abs(comp.cx - b.mid) <= 1, `${tag}: the seat is in the exact middle (${comp.cx.toFixed(1)} vs ${b.mid.toFixed(1)})`);
      ok(JSON.stringify(keys.slice(0, ci)) === JSON.stringify(LEFT), `${tag}: Board, Calendar and Review on the left: ` + keys.join(","));
      ok(JSON.stringify(keys.slice(ci + 1)) === JSON.stringify(c.right), `${tag}: ${c.right.join(", ")} on the right: ` + keys.join(","));
      const L = b.items.slice(0, ci), R = b.items.slice(ci + 1), span = a => a[a.length - 1].r - a[0].l;
      ok(Math.abs(span(L) - span(R)) <= 2, `${tag}: each side fills the same width (${span(L).toFixed(1)} / ${span(R).toFixed(1)})`);
      ok([L, R].every(s => s.every(i => Math.abs(i.w - s[0].w) <= 1)), `${tag}: tabs share their side equally`);
      ok(b.items.every((i, k) => i.l >= b.left - 1 && i.r <= b.right + 1 && (!k || i.l >= b.items[k - 1].r - 1)), `${tag}: every tab is inside the bar, none overlapping`);
      ok(b.items.every(i => !i.cut), `${tag}: no label is cut off: ` + b.items.filter(i => i.cut).map(i => i.k).join(","));
      ok(L[L.length - 1].nl && R[0].nr && b.items.filter(i => i.nl || i.nr).length === 2, `${tag}: the tabs beside the seat are marked for its cut-out (${L[L.length - 1].k}, ${R[0].k})`);
      if (!ts && w === 402) {
        // the tab next to the seat, when it's the page you're on, wears the cut-out
        await page.locator(`nav.tabs .in [data-tab="${R[0].k === "MORE" ? "courses" : R[0].k}"]`).first().tap(); await page.waitForTimeout(700);
        const b2 = await bar(page);
        ok(b2.cutout && Math.abs(b2.items.find(i => i.k === "companion").cx - b2.mid) <= 1, `${tag}: on another page the seat stays put and the cut-out is drawn`);
      }
      if (SHOT) { const nav = await page.$("nav.tabs"), bb = await nav.boundingBox(); await page.screenshot({path: path.join(SHOT, `bar-${w}${ts ? "-" + ts : ""}-${c.name.replace(/\s+/g, "-")}.png`), clip: {x: 0, y: bb.y - 36, width: w, height: bb.height + 44}}); }
      ok(!page.errs.length, `${tag}: no page errors ` + page.errs.join(" | "));
      await ctx.close(); combos++;
    }
    console.log(`ok - ${combos} bar layouts (7 configurations × 3 widths × 3 text sizes): seat centred, sides balanced, labels whole`);

    /* More, in Essentials on a phone, lists what isn't in the bar: never the companion (it has its seat) */
    {
      const {ctx, page} = await open(402, [{}, ""]);
      await page.locator("nav.tabs .in .ess-more").tap(); await page.waitForSelector("dialog[open] .ess-sheet");
      const ids = await page.evaluate(() => [...document.querySelectorAll("dialog[open] .ess-sheet [data-act]")].map(b => b.dataset.act + ":" + (b.dataset.id || "")));
      ok(ids.includes("ess-go:notes") && ids.includes("ess-go:groups") && !ids.includes("ess-go:companion"), "phone More lists Notes and Groups, not the companion (it's in the bar): " + ids.join(","));
      await ctx.close();
    }

    /* The one-week card */
    const card = page => page.evaluate(() => { const c = document.querySelector("#view .ess-week"); return c ? {text: c.textContent.replace(/\s+/g, " ").trim(), btns: [...c.querySelectorAll("button")].map(b => b.textContent.trim())} : null; });
    for (const w of [402, 1300]) {
      const mob = w < 640;
      const openW = async args => { const ctx = await browser.newContext({serviceWorkers: "block", viewport: {width: w, height: 860}, isMobile: mob, hasTouch: mob}); await ctx.addInitScript(require("./consent-ok")); await ctx.routeWebSocket(/supabase\.co/, ws => ws.close()); await ctx.route(/supabase\.co/, r => r.abort()); await ctx.addInitScript(seed, args); const page = await ctx.newPage(); page.errs = []; page.on("pageerror", e => page.errs.push(e.message)); await page.goto(base); await page.waitForFunction(() => typeof window.SBESS !== "undefined", null, {timeout: 40000}); await page.waitForTimeout(1600); return {ctx, page}; };
      {
        const {ctx, page} = await openW([{}, "", 6 * DAY]);
        ok(!(await card(page)), `${w}px: no card after 6 days`);
        await ctx.close();
      }
      {
        const {ctx, page} = await openW([{}, "", 8 * DAY, "user"]);
        ok(!(await card(page)), `${w}px: no card for someone who turned the essentials back on themselves`);
        await ctx.close();
      }
      {
        const {ctx, page} = await openW([{}, "", 8 * DAY]);
        const c = await card(page);
        ok(c && /a week with Studyboard/.test(c.text) && JSON.stringify(c.btns) === JSON.stringify(["Show All Tabs", "Keep It Simple"]), `${w}px: after a week, one card offers every tab: ` + JSON.stringify(c));
        ok(await page.evaluate(() => !document.querySelector("dialog[open]")), `${w}px: it's a card on the Board, not a popup`);
        if (SHOT) { const el = await page.$("#view .ess-week"); await el.screenshot({path: path.join(SHOT, `week-card-${w}.png`)}); }
        await page.locator("#view .ess-week [data-act='ess-week-all']").click(); await page.waitForTimeout(900);
        const st = await page.evaluate(() => ({on: SBESS.on(), tabs: [...document.querySelectorAll("nav.tabs .in [data-tab]")].filter(b => getComputedStyle(b).display !== "none").map(b => b.dataset.tab), more: (() => { const m = document.querySelector("nav.tabs .ess-more"); return !!m && getComputedStyle(m).display !== "none"; })()}));
        ok(!st.on && ["notes", "groups", "companion"].every(t => st.tabs.includes(t)) && !st.more, `${w}px: Show All Tabs puts every tab in the menu, More goes: ` + JSON.stringify(st));
        ok(!(await card(page)), `${w}px: and the card is gone`);
        if (mob) { const b = await bar(page); ok(Math.abs(b.items.find(i => i.k === "companion").cx - b.mid) <= 1, `${w}px: the bar re-arranges with the seat still centred`); }
        await page.reload(); await page.waitForTimeout(1800);
        ok(!(await card(page)) && !(await page.evaluate(() => SBESS.on())), `${w}px: it stays that way after a reload`);
        await ctx.close();
      }
      {
        const {ctx, page} = await openW([{}, "", 8 * DAY]);
        await page.locator("#view .ess-week [data-act='ess-week-keep']").click(); await page.waitForTimeout(700);
        ok(!(await card(page)) && (await page.evaluate(() => SBESS.on())), `${w}px: Keep It Simple keeps the essentials and removes the card`);
        await page.reload(); await page.waitForTimeout(1800);
        ok(!(await card(page)), `${w}px: and it doesn't ask again`);
        ok(!page.errs.length, `${w}px: no page errors ` + page.errs.join(" | "));
        await ctx.close();
      }
    }
  } finally { await browser.close(); server.close(); }
  console.log(`\nphone-tabbar.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
