// node tests/scene-keyboard.e2e.js: the theme's scene never changes when the keyboard comes up. In the iPhone app the
// keyboard shrinks the app; the scene used to be redrawn at the smaller height (squashed), and a picture theme slid up.
// Now the keyboard just covers the scene's lower part, and it's the same when the keyboard goes.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp", ".jpg": "image/jpeg"};
const server = http.createServer((req, res) => { let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; } res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res); });
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r));
  const b = await chromium.launch({executablePath});
  try {
    const ctx = await b.newContext({viewport: {width: 402, height: 874}, isMobile: true, hasTouch: true, serviceWorkers: "block"});
    await ctx.addInitScript(() => { window.__SB_TEST = true; try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, settings: {}, courses: [], tasks: [], notes: []})); } } catch (e) {} });
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForFunction(() => window.__sbSync); await page.waitForTimeout(1200);
    // a scene theme, saved as if picked earlier
    await page.evaluate(() => { const st = window.__sbSync.state; st.settings.style = Object.assign({}, st.settings.style || {}, {skin: "ocean"}); localStorage.setItem("studyboard:skin", "ocean"); localStorage.setItem("coursework:v2", JSON.stringify(st)); });
    await page.reload(); await page.waitForFunction(() => window.__sbSync && window.__sbPlanObj);
    await page.evaluate(() => { window.__sbPlanObj().isPro = () => true; window.__sbSync.render(); });
    await page.waitForFunction(() => document.querySelector("#sceneArt svg"), null, {timeout: 30000}); await page.waitForTimeout(800);
    const look = () => page.evaluate(() => { const a = document.getElementById("sceneArt"); return {h: a.style.height, w: a.style.width, top: Math.round(a.getBoundingClientRect().top), sig: a.innerHTML.length, node: a.dataset.k || (a.dataset.k = String(Math.random()))}; });
    const before = await look();
    // the keyboard as the app has it: the app shrinks to the space above it and is told it's up
    await page.evaluate(() => document.documentElement.classList.add("kb-native", "kb-open")); await page.setViewportSize({width: 402, height: 538}); await page.waitForTimeout(900);
    const up = await look();
    ok(up.h === before.h && up.w === before.w && up.top === before.top && up.sig === before.sig, "keyboard up: the scene keeps its full size and place, not redrawn: " + JSON.stringify([before, up]));
    await page.setViewportSize({width: 402, height: 874}); await page.evaluate(() => document.documentElement.classList.remove("kb-open")); await page.waitForTimeout(900);
    const down = await look();
    ok(down.h === before.h && down.sig === before.sig, "keyboard down: still the same scene");
    // switching tabs: only the page's content cross-fades; the scene (and the rest) stays live, never frozen into a still
    await page.waitForTimeout(400);
    await page.tap('nav.tabs [data-tab="notes"]');
    const vt = await page.evaluate(() => new Promise(res => requestAnimationFrame(() => {
      const g = document.querySelector(".tab-ghost"), nav = document.querySelector("nav.tabs"), fr = document.querySelector(".cp-front");
      const z = el => el ? (+getComputedStyle(el).zIndex || 0) : -99;
      res({ghost: !!g, ghostZ: z(g), navZ: z(nav), compZ: z(fr), pseudo: document.getAnimations().some(a => a.effect && a.effect.pseudoElement)});
    })));
    ok(vt.ghost && !vt.pseudo, "switching tabs cross-fades the page content only (a still copy of the old page fades out); nothing else is captured or frozen: " + JSON.stringify(vt));
    ok(vt.navZ > vt.ghostZ && vt.compZ > vt.navZ, "the tab bar stays above the fading page, and the companion above the tab bar");
    await page.waitForTimeout(600);
    ok(await page.evaluate(() => !!document.querySelector("#sceneArt svg")), "and the scene is the same one after");
    // turning the phone sideways is a real change, and the scene follows it
    await page.setViewportSize({width: 874, height: 402}); await page.waitForTimeout(900);
    ok((await look()).w !== before.w, "a real size change (turning the phone) still redraws it");
    ok(!errs.length, "no page errors " + errs.join(" | "));
    console.log("\nscene-keyboard.e2e: " + n + " checks passed");
  } finally { await b.close(); server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
