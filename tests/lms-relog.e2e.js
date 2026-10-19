// node tests/lms-relog.e2e.js  (Playwright + Chromium; the desktop app's school bridge is stubbed)
// Desktop school sign-in: the regular "who am I" check notices when Brightspace has signed you out and a Sign In Again button appears at
// the bottom middle of the screen; × hides it until the next sign-out; it steps aside while a sheet is open; one click signs you in and
// it goes away; a check that finds the sign-in good again clears it. Also (no browser): kept cookies in lms.js.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert"), Module = require("module");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, ".."), SHOTS = process.env.SHOTS || path.join(require("os").tmpdir(), "relog-shots");
fs.mkdirSync(SHOTS, {recursive: true});
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp"};
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  /* ---------- lms.js keeps session cookies (no Electron: stubbed) ---------- */
  {
    const load = Module._load;
    Module._load = function (req) { if (req === "electron") return {app: {isPackaged: true, userAgentFallback: "", on() {}}, BrowserWindow: function () {}, ipcMain: {handle() {}}, net: {}, session: {}}; return load.apply(this, arguments); };
    const L = require("../lms.js"); Module._load = load;
    let fire = null; const sets = [];
    L.keepCookies({cookies: {on: (ev, fn) => { if (ev === "changed") fire = fn; }, set: async d => { sets.push(d); }}});
    const now = Date.now() / 1000;
    fire({}, {name: "d2lSessionVal", value: "abc", domain: "learn.example.edu", hostOnly: true, path: "/", secure: true, httpOnly: true, session: true, sameSite: "lax"}, "explicit", false);
    ok(sets.length === 1 && sets[0].url === "https://learn.example.edu/" && !sets[0].domain && sets[0].expirationDate > now + 29 * 86400 && sets[0].httpOnly && sets[0].secure && sets[0].sameSite === "lax",
      "a session cookie is kept for 30 days, with its flags");
    fire({}, {name: "ESTSAUTH", value: "x", domain: ".login.microsoftonline.com", hostOnly: false, path: "/", secure: true, httpOnly: true, session: true, sameSite: "no_restriction"}, "explicit", false);
    ok(sets.length === 2 && sets[1].domain === ".login.microsoftonline.com" && sets[1].url === "https://login.microsoftonline.com/", "a domain cookie keeps its domain");
    fire({}, {name: "a", value: "1", domain: "x.edu", path: "/", session: false, expirationDate: now + 60}, "explicit", false);
    fire({}, {name: "b", value: "1", domain: "x.edu", path: "/", session: true}, "expired", true);
    ok(sets.length === 2, "cookies that already expire, and cookies the site removes, are left alone");
    ok(typeof L.ping === "function", "lms.js has the sign-in check");
  }
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({serviceWorkers: "block", viewport: {width: 1280, height: 800}}); await ctx.route(/supabase\.co/, r => r.abort());
    await ctx.addInitScript(() => {
      localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, courses: [{id: "c1", name: "Biology", code: "BIOL 1200", color: "#1E9E74"}], tasks: [], settings: {}}));
      localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("studyboard:tour", "done");
      const H = {ok: true, origin: "https://learn.example.edu", me: {name: "Anna"}, all: [], errors: [], items: [], completions: [], courses: [{ou: "7", code: "BIOL1200", name: "BIOL 1200 - Biology", folders: [], quizzes: [], grades: [], news: [], events: [], discussions: [], staff: []}]};
      window.__pings = []; window.__pingR = {ok: true}; window.__connects = 0;
      window.studiosoLms = {
        connect: async () => { window.__connects++; return {ok: true, origin: "https://learn.example.edu", name: "Anna"}; },
        sync: async () => JSON.parse(JSON.stringify(H)),
        ping: async (id, host) => { window.__pings.push([id, host]); return window.__pingR; },
        signOut: async () => true, file: async () => ({error: "x"}), feed: async () => ({error: "x"})
      };
    });
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.SBLMS && SBLMS.brightspace && window.__sbRelog, null, {timeout: 40000});
    await page.evaluate(() => { SBLMS.brightspace.save({mode: "api", host: "learn.example.edu", map: {"7": "c1"}, last: Date.now()}); });
    const pill = () => page.evaluate(() => { const e = document.querySelector("#lmsRelog"); if (!e) return null; const r = e.getBoundingClientRect(); return {t: e.textContent.replace(/\s+/g, " ").trim(), cx: r.left + r.width / 2, mid: document.documentElement.clientWidth / 2, bottom: innerHeight - r.bottom, shown: getComputedStyle(e).display !== "none"}; });
    await page.evaluate(() => window.__sbRelog.keepAlive()); await page.waitForTimeout(200);
    ok(await page.evaluate(() => window.__pings.some(p => p[0] === "brightspace" && p[1] === "learn.example.edu")), "the check asks the desktop app about the connected school");
    ok(!(await pill()), "no button while the sign-in is good");
    await page.evaluate(() => { window.__pingR = {needLogin: true}; return window.__sbRelog.keepAlive(); }); await page.waitForTimeout(300);
    let p = await pill();
    ok(p && /Brightspace signed you out/.test(p.t) && /Sign In Again/.test(p.t), "a signed-out school gets the button: " + (p && p.t));
    await page.waitForTimeout(450); p = await pill();
    ok(p && Math.abs(p.cx - p.mid) < 10 && p.bottom >= 12 && p.bottom < 40, "it sits at the bottom middle of the screen " + JSON.stringify(p));
    await page.screenshot({path: path.join(SHOTS, "relog.png")});
    await page.evaluate(() => SBLMS.brightspace.bsSheet()); await page.waitForTimeout(150);
    ok(!(await pill()).shown, "it steps aside while a sheet is open");
    await page.evaluate(() => document.querySelector("#dlg").close()); await page.waitForTimeout(100);
    await page.click("#lmsRelog .lr-x"); await page.waitForTimeout(100);
    ok(!(await pill()), "× hides it");
    await page.evaluate(() => { const T = window.__sbNotecards; T.render(); }); await page.waitForTimeout(100);
    ok(!(await pill()), "and it stays hidden across redraws");
    await page.evaluate(() => { window.__pingR = {ok: true}; return window.__sbRelog.keepAlive(); }); await page.waitForTimeout(200);
    ok(!(await page.evaluate(() => SBLMS.brightspace.local().needLogin)), "a check that finds the sign-in good again clears it");
    await page.evaluate(() => { window.__pingR = {needLogin: true}; return window.__sbRelog.keepAlive(); }); await page.waitForTimeout(300);
    ok(!!(await pill()), "the next sign-out shows it again");
    await page.click("#lmsRelog .lr-go");
    await page.waitForFunction(() => !document.querySelector("#lmsRelog"), null, {timeout: 8000});
    ok(await page.evaluate(() => window.__connects === 1 && !SBLMS.brightspace.local().needLogin), "Sign In Again opens the sign-in and the button goes away");
    ok(!errs.length, "no page errors: " + errs.join(" | "));
  } finally { await browser.close(); server.close(); }
  console.log(`\nlms-relog.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
