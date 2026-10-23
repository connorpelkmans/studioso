// The scene library (bundle/scenes.js, about 3 MB) loads only when it's needed
"use strict";
const fs = require("fs"), path = require("path"), http = require("http"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp"), AF = require("../scripts/app-files");
const root = path.join(__dirname, "..");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };

const asked = [];
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  asked.push(p);
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".png": "image/png", ".woff2": "font/woff2"}[path.extname(f)];
  res.writeHead(200, {"content-type": mime || "application/octet-stream"});
  if (p === "/index.html" || p === "/bundle/app.js") { res.end((p === "/index.html" ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
const scenesAsked = () => asked.filter(p => p === "/bundle/scenes.js").length;

(async () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8"), listed = (/\/\*SCENE-IDS\*\/"([^"]*)"/.exec(html) || [])[1] || "";
  ok(listed.split(" ").includes("ocean") && listed.split(" ").includes("lavenderfields") && listed === AF.sceneIds(), "index.html lists every scene by name (and the theme ids that draw one under another name)");
  ok(!/SCN20_LIB|buildSceneAt/.test(fs.readFileSync(path.join(root, "bundle", "app.js"), "utf8").split("/* ===== module: 20-scenes-load.js")[0]), "the app's code doesn't carry the scene library");

  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 800}, serviceWorkers: "block"});
    await ctx.addInitScript(() => {
      try { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:tour", "done"); sessionStorage.setItem("seeded", "1"); } } catch (e) {}
      document.addEventListener("DOMContentLoaded", () => { window.__libAtStart = typeof SCN20_LIB !== "undefined"; });
    });
    const page = await ctx.newPage();
    const errors = []; page.on("pageerror", e => errors.push(String(e && e.message || e)));
    const act = (a, data) => page.evaluate(([a, data]) => { const b = document.createElement("button"); b.dataset.act = a; Object.assign(b.dataset, data || {}); document.body.appendChild(b); b.click(); b.remove(); }, [a, data]);

    await page.goto(base); await page.waitForTimeout(2500);
    ok(await page.locator("[data-tab]").count() > 3, "the app opens");
    ok(scenesAsked() === 0 && !(await page.evaluate(() => window.__libAtStart)), "with a plain theme, the scene library isn't fetched");

    await act("shop"); await page.waitForSelector("dialog[open] .sheet.shop");
    await page.waitForFunction(() => document.querySelectorAll(".sc-thumb img").length > 10 && !document.querySelector("img[data-scn-thumb]"), null, {timeout: 30000});
    ok(scenesAsked() === 1, "opening the Style Shop loads the library once");
    ok(await page.evaluate(() => [...document.querySelectorAll(".sc-thumb img")].every(i => /^(blob:|data:image\/svg)/.test(i.getAttribute("src") || ""))), "every scene preview is drawn once it has loaded");
    await page.keyboard.press("Escape"); await page.waitForTimeout(200);

    await act("shop-use", {kind: "skin", id: "ocean"}); await page.waitForTimeout(800);
    ok(await page.evaluate(() => document.documentElement.dataset.skin) === "ocean" && await page.locator("#sceneArt svg").count() > 0, "picking a scene theme draws its scene");

    asked.length = 0;
    await page.reload(); await page.waitForTimeout(2500);
    ok(scenesAsked() === 1 && await page.evaluate(() => window.__libAtStart), "with a scene theme saved, the next open loads the library at start (before the app runs)");
    ok(await page.locator("#sceneArt svg").count() > 0, "and the scene is there from the first paint");

    await page.evaluate(() => localStorage.removeItem("studyboard:skin"));
    asked.length = 0;
    await page.reload(); await page.waitForTimeout(500);
    await page.waitForFunction(() => document.querySelector("#sceneArt svg"), null, {timeout: 30000});
    ok(scenesAsked() === 1, "a scene theme the start-up script didn't know about still loads the library and draws its scene");
    ok(!errors.length, "no page errors: " + errors.slice(0, 3).join(" | "));
  } finally { await browser.close(); server.close(); }
  console.log(`\nscenes-lazy: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
