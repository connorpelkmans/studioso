// node tests/note-open-app.e2e.js: in the iPhone app (real native bridge, a stand-in keyboard plugin), opening a note to type
// moves the editor in one smooth rise to rest on the keyboard: it never leaves the screen, never jumps back, and a redraw
// while typing doesn't move it.
const assert = require("assert"); let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const http = require("http"), fs = require("fs"), path = require("path");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css"};
const server = http.createServer((req, res) => { let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res); });
const BRIDGE = fs.readFileSync(path.join(root, "ios-wrapper", "native-bridge.js"), "utf8");
const SEED = {v: 2, courses: [], tasks: [], decks: [], files: [], events: [], settings: {}, updated: 1, notes: [{id: "n1", text: "Make sure objectives to get accessories makes sense", x: 40, y: 60, color: "yellow", rot: 0, created: 1}]};
(async () => {
  await new Promise(r => server.listen(0, r));
  const b = await chromium.launch({executablePath});
  const ctx = await b.newContext({viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true});
  await ctx.addInitScript(seed => { window.__SB_TEST = true; try { localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studyboard:notesView", "notes"); if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(seed)); } catch (e) {}
    window.StudyboardDevice = Object.freeze({idiom: "phone"});
    window.Capacitor = {isNativePlatform: () => true, getPlatform: () => "ios", Plugins: {ScreenOrientation: {lock: () => Promise.resolve(), unlock: () => Promise.resolve()}, Keyboard: {setScroll: () => Promise.resolve(), setAccessoryBarVisible: () => Promise.resolve(), addListener: (ev, fn) => { (window.__kbL = window.__kbL || {})[ev] = fn; return Promise.resolve({remove(){}}); }}}}; }, SEED);
  await ctx.addInitScript(BRIDGE);
  const page = await ctx.newPage(); page.on("pageerror", e => console.log("ERR", e.message));
  await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForTimeout(1200);
  await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
  await page.tap('nav.tabs [data-tab="notes"]'); await page.waitForSelector('.note[data-note="n1"]'); await page.waitForTimeout(600);
  // the very first note opened after the app starts
  await page.tap('.note[data-note="n1"]'); await page.waitForTimeout(60); await page.evaluate(() => { document.getElementById("noteText").focus(); window.__kbL.keyboardWillShow({keyboardHeight: 336}); }); await page.waitForTimeout(600);
  const first = await page.evaluate(() => { const r = document.querySelector(".note.editing").getBoundingClientRect(); return {top: Math.round(r.top), bottom: Math.round(r.bottom)}; });
  ok(first.top >= 0 && Math.abs(first.bottom - (874 - 336)) <= 2, "the first note opened after launch rests on the keyboard, on screen: " + JSON.stringify(first));
  await page.evaluate(() => { document.getElementById("noteText").blur(); window.__kbL.keyboardWillHide(); document.querySelector('.note.editing [data-act="note-done"]').click(); }); await page.waitForTimeout(900);
  await page.evaluate(() => { window.__f = []; const t0 = performance.now(), look = () => { const el = document.querySelector(".note.editing"); let v = null; if (el) { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); const visTop = Math.max(0, r.top), visBot = Math.min(innerHeight - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--kb-h")) || 0), r.bottom); v = {top: Math.round(r.top), bottom: Math.round(r.bottom), layer: el.matches(":popover-open")}; } if (v) window.__f.push(v); if (performance.now() - t0 < 1400) requestAnimationFrame(look); }; requestAnimationFrame(look); });
  await page.tap('.note[data-note="n1"]');
  await page.waitForTimeout(40); await page.evaluate(() => document.getElementById("noteText") && document.getElementById("noteText").focus());
  await page.waitForTimeout(30); await page.evaluate(() => window.__kbL.keyboardWillShow({keyboardHeight: 336}));
  await page.waitForTimeout(250); await page.evaluate(() => window.__sbSync.render());
  await page.waitForTimeout(1100);
  const f = await page.evaluate(() => window.__f), end = f[f.length - 1];
  ok(f.every(x => x.top >= -2), "the editor never leaves the top of the screen (lowest top " + Math.min(...f.map(x => x.top)) + ")");
  ok(Math.abs(end.bottom - (874 - 336)) <= 2, "it ends resting on the keyboard: " + JSON.stringify(end));
  const tops = f.map(x => x.top); let ups = 0; for (let i = 1; i < tops.length; i++) if (tops[i] > tops[i - 1] + 3) ups++;
  ok(ups <= 1, "it rises in one move, never dropping back down on the way (" + ups + " drops): " + tops.slice(0, 12).join(" "));
  ok(f.every(x => x.layer), "it stays on its own layer the whole time");
  console.log("\nnote-open-app.e2e: " + n + " checks passed");
  await b.close(); server.close();
})().catch(e => { console.error(e); process.exit(1); });
