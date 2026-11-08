// Browser test (phone, the iPhone app): typing in a note, tapping elsewhere in the note to put the keyboard away (its options
// show again), then tapping back in the text box keeps the note open with the cursor in it. Focusing the box hides the
// options at once, so the sheet shrinks under the finger: the end of that same tap used to land on the dimmed page behind it
// and close the note.
// Run: node tests/note-refocus.e2e.js
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".json": "application/json", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const url = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    await ctx.addInitScript(() => { try { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [], tasks: [], decks: [], files: [], events: [], settings: {}, updated: 1, notes: [{id: "n1", text: "Hello note", color: "yellow", x: 60, y: 60, z: 1}]})); } catch (e) {} });
    const page = await ctx.newPage(), errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(url); await page.waitForTimeout(1500);
    // the iPhone app's keyboard bridge, as ios-wrapper/native-bridge.js does it: kb-native always; a text box focused while no
    // keyboard is up raises kb-open and the keyboard's last height straight away (inside the focus); putting it away drops them
    await page.evaluate(() => {
      const R = document.documentElement, KB = 300; let kb = 0;
      R.classList.add("kb-native"); window.sbVisibleH = () => innerHeight - kb;
      window.__kb = on => { kb = on ? KB : 0; R.classList.toggle("kb-open", on); R.style.setProperty("--kb-h", kb + "px"); dispatchEvent(new Event("sb-kb-cover")); };
      document.addEventListener("focusin", e => { if (/^(INPUT|TEXTAREA)$/.test(e.target.tagName) && !kb) window.__kb(true); }, true);
    });
    await page.click('nav.tabs [data-tab="notes"]'); await page.waitForTimeout(800);
    const b = await (await page.$('.note[data-note="n1"]')).boundingBox();
    await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(700);
    ok(await page.evaluate(() => !!document.querySelector(".note.editing.n-sheet") && document.activeElement && document.activeElement.id === "noteText"), "tapping the note opens it as a sheet, typing");
    await page.keyboard.type(" and more"); await page.waitForTimeout(200);
    // tap inside the note, away from the text box: the keyboard goes away and the note's options show
    const away = await page.evaluate(() => { const r = document.querySelector(".note.n-sheet").getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + 12}; });
    await page.touchscreen.tap(away.x, away.y); await page.waitForTimeout(100);
    await page.evaluate(() => window.__kb(false)); await page.waitForTimeout(400);
    const mid = await page.evaluate(() => { const s = document.querySelector(".note.editing.n-sheet"), a = document.activeElement; return {open: !!s, typing: !!a && a.id === "noteText", tools: !!s && [...s.querySelectorAll(".note-tools > :not(.note-btns)")].some(e => e.getClientRects().length)}; });
    ok(mid.open && !mid.typing && mid.tools, "tapping elsewhere in the note puts the keyboard away and shows the options: " + JSON.stringify(mid));
    // tap back in the text box, near its top (the part the sheet leaves when it shrinks for the keyboard)
    const tb = await page.evaluate(() => { const r = document.getElementById("noteText").getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + 14}; });
    await page.touchscreen.tap(tb.x, tb.y); await page.waitForTimeout(600);
    const end = await page.evaluate(() => {
      const s = document.querySelector(".note.editing.n-sheet"), a = document.activeElement, r = s && s.getBoundingClientRect();
      return {open: !!s, typing: !!a && a.id === "noteText", top: r && Math.round(r.top), bottom: r && Math.round(r.bottom), h: innerHeight};
    });
    ok(end.open, "tapping back in the text box keeps the note open: " + JSON.stringify(end));
    ok(end.typing, "with the cursor in the text box");
    ok(end.top >= 0 && end.bottom <= end.h && end.bottom - end.top > 100, "and the note is on screen: " + JSON.stringify(end));
    await page.keyboard.type("!"); await page.waitForTimeout(200);
    ok(await page.evaluate(() => /and more!$/.test(document.getElementById("noteText").value)), "typing carries on in the same note");
    // a tap on the dimmed page above the note still closes it, keeping what was typed
    const top = await page.evaluate(() => document.querySelector(".note.n-sheet").getBoundingClientRect().top);
    await page.touchscreen.tap(195, Math.max(120, top / 2)); await page.waitForTimeout(700);
    ok(await page.evaluate(() => !document.querySelector(".note.editing") && /and more!/.test(document.querySelector('.note[data-note="n1"]').textContent)), "a tap away from the note still closes it, saved");
    ok(!errs.length, "no page errors " + errs.join(" | "));
    console.log(`note-refocus.e2e: ${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
