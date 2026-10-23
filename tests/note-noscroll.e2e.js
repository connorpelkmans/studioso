// node tests/note-noscroll.e2e.js
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, ".."), SHOTS = process.env.SHOTS || path.join(require("os").tmpdir(), "noscroll-shots");
fs.mkdirSync(SHOTS, {recursive: true});
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const LONG = Array.from({length: 40}, (_, i) => `Line ${i + 1}: how often an upgrade prompt is shown, trial starts and payments.`).join("\n");
const SEED = {v: 2, courses: [], settings: {}, updated: 1, tasks: [], decks: [],
  notes: [{id: "n1", text: LONG, color: "yellow", x: 40, y: 40, z: 1, rot: 0, courseId: "", created: 1},
          {id: "n2", text: "Short note.", color: "pink", x: 360, y: 40, z: 2, rot: 0, courseId: "", created: 2}]};
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 900}});
    await ctx.route(/supabase\.co/, r => r.abort());
    await ctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {} }, SEED);
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.__sbNotecards);
    await page.evaluate(() => { const T = window.__sbNotecards; T.ui.tab = "notes"; T.ui.noteBoard = ""; T.render(); });
    await page.waitForSelector('.note[data-note="n1"] .note-more'); await page.waitForTimeout(200);
    const info = id => page.evaluate(id => { const el = document.querySelector(`.note[data-note="${id}"]`), b = el.querySelector(".note-body");
      return {clip: el.classList.contains("nb-clip"), open: el.classList.contains("nb-open"), more: !!el.querySelector(".note-more"), label: (el.querySelector(".note-more") || {}).textContent || "",
        oy: getComputedStyle(b).overflowY, sh: b.scrollHeight, ch: b.clientHeight, editing: el.classList.contains("editing")}; }, id);
    let a = await info("n1");
    ok(a.clip && a.more && /Show More/.test(a.label), "a long note shows a Show More button");
    ok(a.oy === "hidden" && a.ch <= 482 && a.sh > a.ch, "a long note stops at 480px with no scrollbar");
    const b = await info("n2"); ok(!b.more && !b.clip, "a short note has no button");
    await page.screenshot({path: path.join(SHOTS, "1-closed.png")});
    await page.click('.note[data-note="n1"] .note-more'); await page.waitForTimeout(150);
    a = await info("n1");
    ok(a.open && !a.editing && /Show Less/.test(a.label), "Show More opens the whole note without starting to edit");
    ok(a.sh <= a.ch + 2, "the open note fits all its text");
    await page.screenshot({path: path.join(SHOTS, "2-open.png"), fullPage: false});
    await page.evaluate(() => window.__sbNotecards.render()); await page.waitForTimeout(150);
    ok((await info("n1")).open, "the note stays open after a redraw");
    await page.click('.note[data-note="n1"] .note-more'); await page.waitForTimeout(150);
    a = await info("n1"); ok(!a.open && a.clip && !a.editing, "Show Less closes it again");
    await page.click('.note[data-note="n1"] .note-body'); await page.waitForSelector('.note.editing[data-note="n1"] #noteText'); await page.waitForTimeout(250);
    const box = () => page.evaluate(() => { const t = document.querySelector("#noteText"); return {sh: t.scrollHeight, ch: t.clientHeight, oy: getComputedStyle(t).overflowY, rz: getComputedStyle(t).resize}; });
    let t1 = await box(); ok(t1.sh <= t1.ch + 2 && t1.oy === "hidden" && t1.rz === "none", "the edit box fits the whole note with no scrollbar");
    await page.focus("#noteText"); await page.keyboard.press("End"); await page.keyboard.press("Control+End");
    for (let i = 0; i < 6; i++) { await page.keyboard.press("Enter"); await page.keyboard.type("more"); }
    const t2 = await box(); ok(t2.ch > t1.ch && t2.sh <= t2.ch + 2, "the edit box grows as you type");
    const fit = await page.evaluate(() => { const b = document.querySelector("#nbBoard"), n = document.querySelector(".note.editing"); return b.offsetHeight >= n.offsetTop + n.offsetHeight; });
    ok(fit, "the cork board grows to hold the taller note");
    await page.screenshot({path: path.join(SHOTS, "3-editing.png")});
    ok(!errs.length, "no page errors " + errs.join(" | "));
    console.log(`\n${n} passed`);
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
