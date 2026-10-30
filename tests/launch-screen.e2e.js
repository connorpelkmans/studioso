// node tests/launch-screen.e2e.js: the launch screen. While Studyboard starts, the app icon's blue book fills from left to
// right with what's happening underneath it; once the first page is drawn it fades away and is removed, and the app works.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2"};
let delay = 0;
const server = http.createServer((req, res) => { let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  setTimeout(() => { res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res); }, /app\.js/.test(p) ? delay : 0); });
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r));
  const b = await chromium.launch({executablePath});
  try {
    const ctx = await b.newContext({viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true, serviceWorkers: "block"});
    await ctx.addInitScript(() => { window.__SB_TEST = true; window.__SB_LAUNCH = true; try { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:tour", "done"); } catch (e) {} });
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    delay = 900;   // a slow first load, so there's time to see it working
    await page.goto("http://localhost:" + server.address().port + "/", {waitUntil: "commit"});
    await page.waitForSelector("#sbLaunch");
    await page.waitForTimeout(500);
    const early = await page.evaluate(() => { const el = document.getElementById("sbLaunch"), r = el.getBoundingClientRect(); return {cover: r.width >= innerWidth && r.height >= innerHeight, now: +el.getAttribute("aria-valuenow"), text: el.querySelector(".ls").textContent, clip: el.querySelector(".lk").style.clipPath, imgs: [...el.querySelectorAll("img")].every(i => i.complete && i.naturalWidth > 0)}; });
    ok(early.cover && early.imgs, "the launch screen covers the screen from the first moment, with the icon and wordmark");
    ok(early.now > 0 && early.now < 32 && /Opening your planner/.test(early.text) && /inset/.test(early.clip), "while the app's code loads, the book is filling and it says so: " + JSON.stringify(early));
    const seen = await page.evaluate(() => new Promise(res => { const vals = []; const t = setInterval(() => { const el = document.getElementById("sbLaunch"); if (!el || el.classList.contains("out")) { clearInterval(t); res({vals, gone: true}); return; } vals.push(+el.getAttribute("aria-valuenow")); }, 50); setTimeout(() => { clearInterval(t); res({vals, gone: false}); }, 8000); }));
    ok(seen.gone, "then it fades away by itself");
    ok(seen.vals.every((v, i) => i === 0 || v >= seen.vals[i - 1]), "the book only ever fills forwards: " + seen.vals.filter((v, i) => i % 3 === 0).join(" "));
    await page.waitForTimeout(700);
    ok(await page.evaluate(() => !document.getElementById("sbLaunch")), "and is removed from the page");
    ok(await page.evaluate(() => !!document.querySelector("nav.tabs") && !!window.__sbSync), "the app is ready underneath");
    await page.tap('nav.tabs [data-tab="notes"]'); await page.waitForTimeout(300);
    ok(await page.evaluate(() => window.__sbSync.ui.tab) === "notes", "and taps reach it");
    ok(!errs.length, "no page errors " + errs.join(" | "));
    await ctx.close();
    console.log("\nlaunch-screen.e2e: " + n + " checks passed");
  } finally { await b.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
