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
    // Spanish is a preview (only the menus are translated): a Spanish browser gets the finished English app, not a mixed page
    const SEEN = () => { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:sb", JSON.stringify("local")); };
    const openSettings = async () => { await page.evaluate(() => document.querySelector('nav.tabs .nav-foot [data-act="menu"]').click()); await page.waitForTimeout(600); };
    ctx = await browser.newContext({locale: "es-ES"}); page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.addInitScript(SEEN);
    await page.goto(base); await page.waitForSelector('nav.tabs [data-tab="notes"]'); await page.waitForTimeout(1200);
    ok(/Board/.test(await page.textContent('nav.tabs [data-tab="board"]')) && await page.evaluate(() => document.documentElement.lang) === "en", "a Spanish browser on Auto gets the English app while Spanish is a preview");
    await openSettings();
    ok(await page.evaluate(() => !document.querySelector('[data-act="lang-set"]')), "Settings offers no half-translated language");
    await ctx.close();
    // Spanish set on purpose (a translator): the whole menu is Spanish, the page stays marked English, the translated bits Spanish
    ctx = await browser.newContext({locale: "es-ES"}); page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.addInitScript(SEEN); await page.addInitScript(() => localStorage.setItem("studyboard:lang", "es"));
    await page.goto(base); await page.waitForFunction(() => /Tablero/.test(document.querySelector('nav.tabs [data-tab="board"]').textContent), null, {timeout: 8000});
    ok(/Repaso/.test(await page.textContent('nav.tabs [data-tab="flashcards"]')), "Spanish nav label");
    ok(await page.evaluate(() => document.documentElement.lang) === "en", "html lang stays en while Spanish is a preview");
    ok(await page.evaluate(() => document.querySelector('nav.tabs [data-tab="board"]').lang) === "es", "the translated nav label is marked Spanish");
    ok(await page.evaluate(() => document.querySelector('nav.tabs [data-tab="courses"]').getAttribute("aria-label")).then(t => /Cursos y archivos/.test(t)), "aria-label translated");
    ok(await page.evaluate(() => { const b = document.querySelector('nav.tabs [data-tab="plan"]'); return !b.hasAttribute("aria-label") && /Calendario/.test(b.textContent); }), "the Calendar tab is named by its visible label");
    ok(await page.evaluate(() => document.querySelector('nav.tabs [data-tab="board"] svg') !== null), "icons survive translation");
    const rest = await page.evaluate(() => ["groups", "pomo-open", "search", "calc-open", "shop", "menu"].map(k => { const b = document.querySelector(`nav.tabs [data-tab="${k}"], nav.tabs [data-act="${k}"]`); return b ? b.textContent.trim() + "|" + (b.getAttribute("aria-label") || "") : "-"; }).join(", "));
    ok(rest === "Grupos|, Enfoque|Abrir el temporizador de enfoque, Buscar|Buscar, Calculadora|Calculadora, Estilo|Tienda de estilos, Ajustes|Ajustes, copias de seguridad e importación", "the rest of the sidebar is Spanish too: " + rest);
    ok(await page.evaluate(() => new Date(2026, 10, 2).toLocaleDateString(undefined, {weekday: "long"})) === "Monday", "dates stay English while the sentences around them are English");
    await openSettings();
    ok(await page.evaluate(() => [...document.querySelectorAll('[data-act="lang-set"]')].map(b => b.dataset.id + ":" + b.textContent).join()) === "auto:Automático,en:English,es:Español (vista previa)", "while it's chosen, the picker shows the preview, labelled, with English to switch back to");
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
    // English chosen: with no finished language besides English there is nothing to pick
    ctx = await browser.newContext({locale: "en-US"}); page = await ctx.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.addInitScript(() => { localStorage.setItem("studyboard:lang", "en"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:sb", JSON.stringify("local")); });
    await page.goto(base); await page.waitForSelector('nav.tabs [data-tab="notes"]'); await page.waitForTimeout(800);
    await page.evaluate(() => [...document.querySelectorAll("nav.tabs .nav-foot button")].find(b => /Settings/.test(b.textContent)).click()); await page.waitForTimeout(600);
    ok(await page.evaluate(() => !document.querySelector('[data-act="lang-set"]')), "with English chosen and Spanish a preview, Settings shows no language picker");
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
