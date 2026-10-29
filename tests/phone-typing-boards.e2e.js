// node tests/phone-typing-boards.e2e.js: typing on a phone with the keyboard up (simulated as the iPhone app does it: the
// app shrinks to the space above the keyboard and is told the keyboard is up).
// Whiteboard: a text box tapped in low on the board rises above the keyboard by lifting the board, while the page and its
// toolbars stay where they are; it settles back after. Notes: the note editor rests on the keyboard as a compact sheet with
// just the text and the Done bar, never reaching the top of the screen.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => { let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; } res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res); });
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const W = 402, H = 874, KB = 336;
const SEED = {v: 2, courses: [], tasks: [], decks: [], files: [], events: [], settings: {}, updated: 1,
  notes: [{id: "w1", text: "Board", wb: {v: 1, tpl: "blank", pa: 1.6}, courseId: "", board: "", created: 1, updated: 1},
    {id: "n1", text: "Remember the enzyme quiz", x: 40, y: 60, color: "yellow", rot: 0, created: 1}]};
async function open(b, view){
  const ctx = await b.newContext({viewport: {width: W, height: H}, isMobile: true, hasTouch: true});
  await ctx.addInitScript(([seed, view]) => { window.__SB_TEST = true;
    try { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studyboard:notesView", view); localStorage.setItem("studyboard:wbCur", "w1");
      if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(seed)); } catch (e) {} }, [SEED, view]);
  const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
  await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(1200);
  await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
  await page.tap('nav.tabs [data-tab="notes"]'); await page.waitForTimeout(700);
  // the keyboard as the app has it: the app is resized above it and the bridge marks it up
  const kb = async on => { await page.setViewportSize({width: W, height: on ? H - KB : H}); await page.evaluate(on => { document.documentElement.classList.add("kb-native"); document.documentElement.classList.toggle("kb-open", on); }, on); };
  return {ctx, page, errs, kb};
}
(async () => {
  await new Promise(r => server.listen(0, r));
  const b = await chromium.launch({executablePath});
  try {
    { const {ctx, page, errs, kb} = await open(b, "wb");
      await page.waitForSelector(".wb-stage .wb-frame");
      await page.evaluate(() => document.querySelector('.wb-tray [data-wb="tool"][data-id="text"]').click()); await page.waitForTimeout(150);
      const before = await page.evaluate(() => ({tray: Math.round(document.querySelector(".wb-tray").getBoundingClientRect().top), y: scrollY, f: document.querySelector(".wb-frame").getBoundingClientRect().toJSON()}));
      const tx = before.f.left + before.f.width / 2, ty = Math.min(before.f.bottom, H) - 40;
      const cam0 = await page.evaluate(() => JSON.stringify(window.SBWB.cam()));
      await page.touchscreen.tap(tx, ty); await page.waitForSelector(".wb-ta"); await page.waitForTimeout(100);
      const pre = await page.evaluate(() => getComputedStyle(document.querySelector(".wb-frame")).getPropertyValue("--lift").trim());
      ok(parseInt(pre, 10) > 0, "the board starts rising the moment the text box opens, with the keyboard, not after it (" + pre + ")");
      await kb(true); await page.keyboard.type("Hello"); await page.waitForTimeout(1000);
      const up = await page.evaluate(() => { const t = document.querySelector(".wb-ta").getBoundingClientRect(), f = document.querySelector(".wb-frame").getBoundingClientRect(); return {ta: Math.round(t.bottom), taTop: Math.round(t.top), fTop: Math.round(f.top), fb: Math.round(Math.min(f.bottom, innerHeight)), tray: Math.round(document.querySelector(".wb-tray").getBoundingClientRect().top), y: scrollY, lift: getComputedStyle(document.querySelector(".wb-frame")).getPropertyValue("--lift")}; });
      ok(up.ta <= up.fb - 8 && up.taTop >= up.fTop, "whiteboard: the text box tapped in low rises into view above the keyboard: " + JSON.stringify(up));
      ok(up.y === before.y && up.tray === before.tray, "the page and the toolbar stay where they were (no sliding)");
      ok(parseInt(up.lift, 10) > 0, "the board itself lifted (" + up.lift + ")");
      ok(await page.evaluate(() => JSON.stringify(window.SBWB.cam())) === cam0, "the app shrinking for the keyboard doesn't refit or move the board's view");
      const word = await page.evaluate(() => document.querySelector(".wb-ta").value);
      ok(word === "Hello", "and typing goes into it: " + word);
      // done: the text is saved where it was tapped, and the board settles back
      await page.evaluate(() => document.querySelector(".wb-ta").blur()); await kb(false); await page.waitForTimeout(800);
      const after = await page.evaluate(() => ({lift: getComputedStyle(document.querySelector(".wb-frame")).getPropertyValue("--lift").trim(), t: [...document.querySelectorAll(".wb-t")].map(e => e.getBoundingClientRect().top)}));
      ok(after.lift === "0px" && after.t.length === 1 && Math.abs(after.t[0] - (ty - 12)) < 40, "keyboard down: the board settles back and the text sits where it was tapped: " + JSON.stringify([after, ty]));
      ok(!errs.length, "whiteboard: no page errors " + errs.join(" | "));
      await ctx.close(); }
    { const {ctx, page, errs, kb} = await open(b, "notes");
      await page.waitForSelector('.note[data-note="n1"]'); await page.tap('.note[data-note="n1"]'); await page.waitForSelector("#noteText"); await page.waitForTimeout(500);
      await page.focus("#noteText"); await kb(true); await page.waitForTimeout(500);
      const s = await page.evaluate(() => { const el = document.querySelector(".note.editing"), r = el.getBoundingClientRect(), t = document.getElementById("noteText").getBoundingClientRect(), c = el.querySelector(".note-colors"), d = el.querySelector(".note-btns");
        return {top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight, tTop: Math.round(t.top), tH: Math.round(t.height), colors: c ? getComputedStyle(c).display : "none", done: d ? Math.round(d.getBoundingClientRect().bottom) : -1}; });
      ok(s.top >= 40 && s.bottom <= s.vh + 1 && s.tTop >= s.top, "notes: the editor stays on screen above the keyboard, its text at the top of it: " + JSON.stringify(s));
      ok(s.colors === "none" && s.done > 0 && s.done <= s.vh + 1, "while typing it shows just the text and the Done bar");
      ok(s.tH >= 100 && s.top >= 150, "it's a compact sheet resting on the keyboard, the board still showing above it (top " + s.top + "px, text " + s.tH + "px)");
      await page.evaluate(() => document.getElementById("noteText").blur()); await kb(false); await page.waitForTimeout(300);
      ok(await page.evaluate(() => { const c = document.querySelector(".note.editing .note-colors"); return !!c && getComputedStyle(c).display !== "none"; }), "keyboard down: the colours and other options are back");
      ok(!errs.length, "notes: no page errors " + errs.join(" | "));
      await ctx.close(); }
    // No keyboard plugin (Safari, or an app build without it): iOS keeps the page's size, shows the keyboard over it and
    // slides the visible part down to the text box. The note editor still rests on the keyboard, goes compact, and stays
    // fully in view.
    { const ctx = await b.newContext({viewport: {width: W, height: H}, isMobile: true, hasTouch: true});
      await ctx.addInitScript(([seed]) => { window.__SB_TEST = true;
        try { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studyboard:notesView", "notes");
          if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(seed)); } catch (e) {} }, [SEED]);
      await ctx.addInitScript(KB => { let open = false, pan = 0; const vv = window.visualViewport;
        Object.defineProperty(vv, "height", {configurable: true, get: () => innerHeight - (open ? KB : 0)});
        Object.defineProperty(vv, "offsetTop", {configurable: true, get: () => pan});
        window.__kbWeb = (on, p) => { open = on; pan = p || 0; vv.dispatchEvent(new Event("resize")); vv.dispatchEvent(new Event("scroll")); }; }, KB);
      const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
      await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(1200);
      await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
      await page.tap('nav.tabs [data-tab="notes"]'); await page.waitForSelector('.note[data-note="n1"]'); await page.tap('.note[data-note="n1"]'); await page.waitForSelector("#noteText"); await page.waitForTimeout(500);
      await page.focus("#noteText"); await page.evaluate(() => window.__kbWeb(true, 320)); await page.waitForTimeout(400);
      const w = await page.evaluate(() => { const el = document.querySelector(".note.editing"), r = el.getBoundingClientRect(), vv = visualViewport, c = el.querySelector(".note-colors");
        return {kb: document.documentElement.classList.contains("kb-open"), top: Math.round(r.top), bottom: Math.round(r.bottom), visTop: vv.offsetTop, visBottom: Math.round(vv.offsetTop + vv.height), colors: c ? getComputedStyle(c).display : "none"}; });
      ok(w.kb, "no plugin, page slid up: the keyboard is still seen as up");
      ok(Math.abs(w.bottom - w.visBottom) <= 2 && w.top >= w.visTop, "the note editor rests on the keyboard and stays fully in view: " + JSON.stringify(w));
      ok(w.colors === "none", "and it's the compact typing editor");
      ok(!errs.length, "no plugin: no page errors " + errs.join(" | "));
      await ctx.close(); }
    console.log("\nphone-typing-boards.e2e: " + n + " checks passed");
  } finally { await b.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
