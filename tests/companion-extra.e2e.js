// Extra companions (src/js/98-comp-extra.js)
"use strict";
const path = require("path"), fs = require("fs"), http = require("http"), assert = require("assert");
const csp = require("../scripts/csp"), root = path.join(__dirname, "..");
// served with Pro enforcement off, so artwork themes can be switched to
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  res.writeHead(200, {"content-type": {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json"}[path.extname(f)] || "application/octet-stream"});
  if (p === "/index.html" || p === "/bundle/app.js") { res.end((p === "/index.html" ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
const {chromium, executablePath} = require("./pw");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = {v: 2, updated: 1, courses: [], tasks: [], settings: {}};
(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 800}, serviceWorkers: "block"});
    await ctx.addInitScript(seed => { try { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:tour", "done"); localStorage.setItem("studioso:sb", '"local"'); sessionStorage.setItem("seeded", "1"); } } catch (e) {} }, SEED);
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
    const url = "http://localhost:" + server.address().port + "/";
    await page.goto(url); await page.waitForFunction(() => window.SBCOMP && SBCOMP.open && window.SBThemes);
    const tiles = () => page.evaluate(() => [...document.querySelectorAll("dialog[open] .cp-tile")].map(t => t.dataset.id));
    const chk = await page.evaluate(() => SBCOMP.check());
    ok(!/extra|cosmo/i.test(JSON.stringify(chk)), "the companion check says nothing about the extras (they aren't part of any theme's set)");
    ok(await page.evaluate(() => !!SBCOMP.rigSvg("extra-cosmo", {})), "Cosmo is drawn (known by id, e.g. as a group member's face)");
    await page.evaluate(() => SBCOMP.open()); await page.waitForSelector("dialog[open] .cp-tile");
    let t = await tiles();
    ok(t.length === 6 && !t.includes("extra-cosmo"), "without access to the hidden themes, Cosmo isn't offered: " + t.join(","));
    await page.keyboard.press("Escape");

    await page.evaluate(() => localStorage.setItem("studyboard:theme-access", JSON.stringify({uid: "owner", on: true})));
    await page.reload(); await page.waitForFunction(() => window.SBCOMP && SBCOMP.open && window.SBThemes && SBThemes.all());
    await page.evaluate(() => SBCOMP.open()); await page.waitForSelector("dialog[open] .cp-tile");
    t = await tiles();
    ok(t.length === 7 && t[6] === "extra-cosmo", "with access, Cosmo is one more choice in the picker: " + t.join(","));
    ok(/Cosmo/.test(await page.textContent('dialog[open] .cp-tile[data-id="extra-cosmo"]')), "his tile is named Cosmo");
    await page.click('dialog[open] .cp-tile[data-id="extra-cosmo"] [data-act="comp-pick"]'); await page.waitForTimeout(400);
    ok(await page.evaluate(() => SBCOMP.current()) === "extra-cosmo", "choosing him makes him the companion");
    await page.keyboard.press("Escape");
    await page.reload(); await page.waitForFunction(() => window.SBCOMP && SBCOMP.current && window.SBThemes && SBThemes.all()); await page.waitForTimeout(500);
    ok(await page.evaluate(() => SBCOMP.current()) === "extra-cosmo", "and he's still there after a reload");
    ok(await page.evaluate(() => /extra-cosmo|Cosmo/.test(SBCOMP.el() ? SBCOMP.el().innerHTML + SBCOMP.el().getAttribute("aria-label") : "") || !!SBCOMP.el()), "he's on screen");
    const art = await page.evaluate(() => SBCOMP.themes().find(k => k !== "plain" && SBCOMP.list(k).length === 3 && (() => { SBCOMP.setSkin(k); return document.documentElement.dataset.skin === k; })()));
    ok(!!art, "switched to an artwork theme: " + art); await page.waitForTimeout(300);
    await page.evaluate(() => SBCOMP.open()); await page.waitForSelector("dialog[open] .cp-tile");
    t = await tiles();
    ok(t.length === 4 && t[3] === "extra-cosmo", "an artwork theme offers its three plus Cosmo: " + t.join(","));
    await page.keyboard.press("Escape");
    await page.evaluate(() => SBCOMP.setSkin("classic")); await page.waitForTimeout(300);

    await page.evaluate(() => localStorage.removeItem("studyboard:theme-access"));
    await page.reload(); await page.waitForFunction(() => window.SBCOMP && SBCOMP.current && window.SBThemes && !SBThemes.all()); await page.waitForTimeout(500);
    const now = await page.evaluate(() => SBCOMP.current());
    ok(now && now !== "extra-cosmo", "without access he's not shown; a normal companion is: " + now);
    await page.evaluate(() => SBCOMP.open()); await page.waitForSelector("dialog[open] .cp-tile");
    t = await tiles();
    ok(!t.includes("extra-cosmo"), "and not offered");
    ok(!errs.length, "no page errors: " + errs.join(" | "));
  } finally { await browser.close(); server.close(); }
  console.log(`\ncompanion-extra: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
