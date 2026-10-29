// node tests/phone-orientation.e2e.js: in the iPhone app the screen stays upright, so the "turn your phone upright" screen
// never shows; only full-screen notes or the whiteboard unlock it to turn sideways, and leaving full screen locks it again.
// Also the keyboard: the app fits itself above it. Runs ios-wrapper/native-bridge.js with stand-ins for
// @capacitor/screen-orientation and @capacitor/keyboard.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => { const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } const mime = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json"}; res.writeHead(200, {"content-type": mime[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res); });
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const BRIDGE = fs.readFileSync(path.join(root, "ios-wrapper", "native-bridge.js"), "utf8");
async function open(b, idiom){
  const ctx = await b.newContext({viewport: idiom === "pad" ? {width: 820, height: 1180} : {width: 402, height: 874}, isMobile: true, hasTouch: true});
  const seed = {v: 2, updated: 1, settings: {}, courses: [], tasks: [], notes: [{id: "n1", text: "Hi", x: 40, y: 60, color: "yellow", rot: 0, created: 1}]};
  await ctx.addInitScript(([s, idiom]) => {
    window.__SB_TEST = true;
    try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(s)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {}
    window.__so = [];
    window.StudyboardDevice = Object.freeze({idiom});
    window.Capacitor = {isNativePlatform: () => true, getPlatform: () => "ios", Plugins: {ScreenOrientation: {
      lock: o => { window.__so.push("lock:" + o.orientation); return Promise.resolve(); }, unlock: () => { window.__so.push("unlock"); return Promise.resolve(); }},
      Keyboard: {setAccessoryBarVisible: o => { window.__kbBar = o.isVisible; return Promise.resolve(); }, addListener: (ev, fn) => { (window.__kbL = window.__kbL || {})[ev] = fn; return Promise.resolve({remove(){}}); }}}};
  }, [seed, idiom]);
  await ctx.addInitScript(BRIDGE);
  const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
  await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForFunction(() => window.__sbSync); await page.waitForTimeout(700);
  return {ctx, page, errs};
}
(async () => {
  await new Promise(r => server.listen(0, r));
  const b = await chromium.launch({executablePath});
  try {
    { const {ctx, page, errs} = await open(b, "phone");
      const so = () => page.evaluate(() => window.__so.slice());
      ok(JSON.stringify(await so()) === '["lock:portrait"]', "iPhone app: the screen is locked upright from the start: " + await so());
      ok(await page.evaluate(() => /user-scalable=no/.test(document.querySelector('meta[name="viewport"]').content)), "and the app can't zoom as a whole");
      await page.evaluate(() => { window.__sbSync.ui.tab = "notes"; window.__sbSync.render(); }); await page.waitForTimeout(300);
      await page.evaluate(() => document.querySelector('[data-act="board-max"]').click()); await page.waitForTimeout(200);
      ok((await so()).slice(-1)[0] === "unlock", "full-screen notes unlock it, so the board can turn sideways: " + await so());
      await page.evaluate(() => document.querySelector('[data-act="board-max"]').click()); await page.waitForTimeout(200);
      ok((await so()).slice(-1)[0] === "lock:portrait", "leaving full screen locks it upright again: " + await so());
      await page.evaluate(() => { document.documentElement.classList.add("x-other"); }); await page.waitForTimeout(100);
      ok((await so()).length === 3, "other page changes don't touch the lock: " + await so());
      // the keyboard: the app shrinks above it (keyboard plugin), and the page hears when it opens
      ok(await page.evaluate(() => document.documentElement.classList.contains("kb-native") && window.__kbBar === false), "keyboard: the app fits itself above the keyboard and hides the arrows-and-Done bar");
      await page.evaluate(() => { window.__sbSync.ui.tab = "tasks"; window.__sbSync.render(); window.__kbL.keyboardWillShow({keyboardHeight: 336}); visualViewport.dispatchEvent(new Event("resize")); }); await page.waitForTimeout(150);
      ok(await page.evaluate(() => document.documentElement.classList.contains("kb-open") && getComputedStyle(document.querySelector("nav.tabs")).visibility === "hidden"), "keyboard up: the tab bar steps aside (and a viewport resize doesn't undo it)");
      await page.evaluate(() => window.__kbL.keyboardWillHide()); await page.waitForTimeout(150);
      ok(await page.evaluate(() => !document.documentElement.classList.contains("kb-open") && getComputedStyle(document.querySelector("nav.tabs")).visibility !== "hidden"), "keyboard down: the tab bar is back");
      // the Focus sheet says why the timer isn't in the Dynamic Island (this build has no island plugin)
      await page.evaluate(() => document.querySelector('[data-act="pomo-open"]').click()); await page.waitForTimeout(300);
      const note = await page.evaluate(() => { const p = document.querySelector("#pomoDlg .pomo-island"); return p && !p.hidden ? p.textContent : ""; });
      ok(/isn't in this build/.test(note), "Focus sheet: says the Dynamic Island timer isn't in this build: " + note);
      await page.evaluate(() => document.getElementById("pomoDlg").close());
      ok(!errs.length, "no page errors " + errs.join(" | "));
      await ctx.close(); }
    { const {ctx, page} = await open(b, "pad");
      ok((await page.evaluate(() => window.__so.slice())).length === 0, "iPad: turns freely, nothing is locked");
      await ctx.close(); }
    console.log("\nphone-orientation.e2e: " + n + " checks passed");
  } finally { await b.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
