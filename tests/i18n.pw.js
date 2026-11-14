// node tests/i18n.pw.js (Playwright + Chromium) Localization groundwork
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    let ctx = await browser.newContext({locale: "en-US"}), page = await ctx.newPage(); const errs = [];
    page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForSelector('nav.tabs [data-tab="notes"]');
    ok(/Notes/.test(await page.textContent('nav.tabs [data-tab="notes"]')), "English nav label");
    ok(await page.evaluate(() => document.documentElement.lang) === "en", "html lang is en");
    const r = await page.evaluate(() => { const I = window.SBI18N; return null; }).catch(() => null);
    await ctx.close();
    // Spanish is a finished language: a Spanish browser on Auto gets the whole app in Spanish, the page marked Spanish, Spanish dates
    const SEEN = () => { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:sb", JSON.stringify("local")); };
    const openSettings = async () => { await page.evaluate(() => document.querySelector('nav.tabs .nav-foot [data-act="menu"]').click()); await page.waitForTimeout(600); };
    const DATA = () => { if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [{id: "c1", name: "Calculus I", code: "MATH 1300", color: "#9A4FD1"}], tasks: [{id: "t1", title: "Study Group", courseId: "c1", type: "Assignment", due: "2099-01-05", time: "", priority: "high", status: "todo", notes: "", hours: 2, checklist: [], pct: 0, dependsOn: [], history: [], created: 1, order: 1}], events: [], notes: [], decks: [], files: [], settings: {capacity: 18, dailyHours: 4}, updated: 1})); };
    ctx = await browser.newContext({locale: "es-ES"}); page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.addInitScript(SEEN); await page.addInitScript(DATA);
    await page.goto(base); await page.waitForFunction(() => /Tablero/.test(document.querySelector('nav.tabs [data-tab="board"]').textContent), null, {timeout: 8000});
    ok(/Repaso/.test(await page.textContent('nav.tabs [data-tab="flashcards"]')), "a Spanish browser on Auto gets Spanish: nav");
    ok(/^es\b/.test(await page.evaluate(() => document.documentElement.lang)), "html lang is Spanish (with the browser's region)");
    ok(await page.evaluate(() => !document.querySelector('nav.tabs [data-tab="board"]').hasAttribute("lang")), "nothing is marked separately when the whole page is Spanish");
    ok(await page.evaluate(() => document.querySelector('nav.tabs [data-tab="courses"]').getAttribute("aria-label")).then(t => /Cursos y archivos/.test(t)), "aria-label translated");
    ok(await page.evaluate(() => { const b = document.querySelector('nav.tabs [data-tab="plan"]'); return !b.hasAttribute("aria-label") && /Calendario/.test(b.textContent); }), "the Calendar tab is named by its visible label");
    ok(await page.evaluate(() => document.querySelector('nav.tabs [data-tab="board"] svg') !== null), "icons survive translation");
    const rest = await page.evaluate(() => ["groups", "pomo-open", "search", "calc-open", "shop", "menu"].map(k => { const b = document.querySelector(`nav.tabs [data-tab="${k}"], nav.tabs [data-act="${k}"]`); return b ? b.textContent.trim() + "|" + (b.getAttribute("aria-label") || "") : "-"; }).join(", "));
    ok(rest === "Grupos|, Enfoque|Abrir el temporizador de enfoque, Buscar|Buscar, Calculadora|Calculadora, Estilo|Tienda de estilos, Ajustes|Ajustes, copias de seguridad e importación", "the rest of the sidebar is Spanish too: " + rest);
    ok(await page.evaluate(() => new Date(2026, 10, 2).toLocaleDateString(undefined, {weekday: "long"})) === "lunes", "dates are Spanish with the Spanish page");
    // the page's own text: the Board's toggle, a status column, a chip with a number in it; the task's title is left as written
    await page.evaluate(() => document.querySelector('[data-act="bview"][data-id="board"]').click()); await page.waitForTimeout(500);
    const board = await page.evaluate(() => document.querySelector("#view").innerText);
    ok(/Tablero de tareas/.test(board) && /Por hacer/.test(board) && /Plan de hoy/.test(board), "the Board's own words are Spanish");
    ok(/Study Group/.test(board) && !/Estudiar Group/.test(board), "a task's title is never translated, even when it starts like an app phrase");
    ok(!/\b(To Do|In Progress|Today's Plan|Task Board)\b/.test(board), "no English left in the Board's labels");
    // a select whose options carry no value of their own still reads back the English the code expects
    await page.evaluate(() => document.querySelector("#fab").click()); await page.waitForTimeout(600);
    const sel = await page.evaluate(() => { const s = [...document.querySelectorAll(".sheet select")].find(s => [...s.options].some(o => /Lectura/.test(o.text))); if (!s) return "none"; const o = [...s.options].find(o => /Lectura/.test(o.text)); s.value = o.value; s.dispatchEvent(new Event("change", {bubbles: true})); return o.value; });
    ok(sel === "Reading", "a translated option keeps its English value: " + sel);
    await page.keyboard.press("Escape"); await page.waitForTimeout(300);
    await openSettings();
    ok(await page.evaluate(() => [...document.querySelectorAll('[data-act="lang-set"]')].map(b => b.dataset.id + ":" + b.textContent).join()) === "auto:Automático,en:English,es:Español", "Settings offers Spanish as a finished language");
    ok(await page.evaluate(() => !document.querySelector('[data-act="spell-set"]')), "the English spelling choice is hidden on a Spanish page");
    // switching to English without a reload puts back the English the code wrote
    await page.evaluate(() => document.querySelector('[data-act="lang-set"][data-id="en"]').click()); await page.waitForTimeout(900);
    ok(await page.evaluate(() => document.documentElement.lang === "en" && /Board/.test(document.querySelector('nav.tabs [data-tab="board"]').textContent) && /Settings/.test(document.querySelector('nav.tabs .nav-foot [data-act="menu"]').textContent)), "back to English on the spot");
    ok(errs.length === 0, "no page errors: " + errs.join("; "));
    await ctx.close();
    // A catalog covering every string still leaves the Board and Calendar English: it stays a preview (page language, dates, direction)
    ctx = await browser.newContext({locale: "de-DE"}); page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    const big = {}; for (const k of Object.keys(JSON.parse(fs.readFileSync(path.join(root, "locales", "en.json"), "utf8")))) big[k] = "[" + k + "]";
    await page.addInitScript(SEEN); await page.addInitScript(c => { localStorage.setItem("studyboard:lang", "ar"); localStorage.setItem("studyboard:lang:ar", c); }, JSON.stringify(big));
    await page.goto(base); await page.waitForFunction(() => /\[nav\.board\]/.test(document.querySelector('nav.tabs [data-tab="board"]').textContent), null, {timeout: 8000});
    const pv = await page.evaluate(() => [document.documentElement.lang, document.documentElement.dir, new Date(2026, 10, 2).toLocaleDateString(undefined, {weekday: "long"})].join());
    ok(pv === "en,ltr,Monday", "a full catalog for an unfinished language keeps the page English, left to right, with English dates: " + pv);
    await ctx.close();
    // English chosen: Spanish is offered to switch to
    ctx = await browser.newContext({locale: "en-US"}); page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.addInitScript(() => { localStorage.setItem("studyboard:lang", "en"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:sb", JSON.stringify("local")); });
    await page.goto(base); await page.waitForSelector('nav.tabs [data-tab="notes"]'); await page.waitForTimeout(800);
    await page.evaluate(() => [...document.querySelectorAll("nav.tabs .nav-foot button")].find(b => /Settings/.test(b.textContent)).click()); await page.waitForTimeout(600);
    ok(await page.evaluate(() => [...document.querySelectorAll('[data-act="lang-set"]')].map(b => b.dataset.id + ":" + b.textContent).join()) === "auto:Auto,en:English,es:Español", "with English chosen, Settings offers English and Spanish");
    ok(await page.evaluate(() => !!document.querySelector('[data-act="spell-set"]')), "the spelling choice is there in English");
    await ctx.close();
    // Right to left, forced for testing (no Arabic or Hebrew catalog ships yet): the side menu, the page's toolbars and the
    // direction of arrows mirror, and nothing in the Board's toolbar row lands on anything else
    ctx = await browser.newContext({locale: "en-US", viewport: {width: 1366, height: 900}}); page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.addInitScript(SEEN); await page.addInitScript(() => localStorage.setItem("studyboard:dir", "rtl"));
    await page.goto(base); await page.waitForSelector('nav.tabs [data-tab="notes"]'); await page.waitForTimeout(800);
    const rt = await page.evaluate(() => { const n = document.querySelector("nav.tabs").getBoundingClientRect(), v = document.querySelector("#view").getBoundingClientRect(); return [document.documentElement.dir, n.left > v.right - 1].join(); });
    ok(rt === "rtl,true", "the side menu is on the right: " + rt);
    await page.evaluate(() => document.querySelector('[data-act="bview"][data-id="board"]').click()); await page.waitForTimeout(500);
    const clash = await page.evaluate(() => { const r = [...document.querySelectorAll("#view .bview-row button, #view .bview-row label, #view .bview-row select")].filter(e => e.getClientRects().length).map(e => e.getBoundingClientRect()); let n = 0; for (let a = 0; a < r.length; a++) for (let b = a + 1; b < r.length; b++) { const x = Math.min(r[a].right, r[b].right) - Math.max(r[a].left, r[b].left), y = Math.min(r[a].bottom, r[b].bottom) - Math.max(r[a].top, r[b].top); if (x > 3 && y > 3) n++; } return n; });
    ok(clash === 0, "the Board's view switch and Group By controls don't overlap: " + clash);
    await page.evaluate(() => document.querySelector('nav.tabs [data-tab="plan"]').click()); await page.waitForTimeout(400);
    await page.evaluate(() => { const b = document.querySelector('[data-act="plan-view"][data-id="schedule"]'); b && b.click(); }); await page.waitForTimeout(500);
    ok(await page.evaluate(() => { const s = document.querySelector('[aria-label="Previous week"] svg'); return !!s && getComputedStyle(s).scale === "-1 1"; }), "the previous-week chevron points right");
    await ctx.close();
    // A German browser on an English page: dates in English ("Monday", not "Montag"), in the region's own order and clock
    ctx = await browser.newContext({locale: "de-DE"}); page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForSelector('nav.tabs [data-tab="notes"]'); await page.waitForTimeout(600);
    const dd = await page.evaluate(() => { const d = new Date(2026, 10, 2, 15, 5); return [document.documentElement.lang, d.toLocaleDateString(undefined, {weekday: "long"}), d.toLocaleDateString(undefined, {month: "short", day: "numeric"}), d.toLocaleTimeString(undefined, {hour: "numeric", minute: "2-digit"}), new Intl.DateTimeFormat(undefined, {weekday: "long"}).format(d), d.toLocaleDateString("de-DE", {weekday: "long"})]; });
    ok(JSON.stringify(dd) === JSON.stringify(["en", "Monday", "2 Nov", "15:05", "Monday", "Montag"]), "German browser: dates in English with the German order and 24-hour clock; an explicit language is still honoured: " + dd);
    ok(errs.length === 0, "no page errors: " + errs.join("; "));
    await ctx.close();
  } finally { await browser.close(); server.close(); }
  console.log(`\n${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
