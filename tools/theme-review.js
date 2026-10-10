// node tools/theme-review.js <theme id> [more ids] --out <dir> [--only scene,moment,still,phone,comp]     (Playwright + Chromium)
// Close-up review renders of a theme from the real app (index.html), for finding layering mistakes, detached parts and thin detail:
//   <id>-scene-<light|dark>-t<s>.png     the scene alone (board and companion hidden), 2x pixels, at 1, 4, 9 and 15 s of the living loop
//   <id>-moment-<light|dark>-<s>.png      the scene's finish moment ("Play Scene Moment") at 0.6 .. 8 s, 2x pixels
//   <id>-still-<light|dark>.png           animations off (the still scene, also used for the Style Shop thumbnails)
//   <id>-phone-<light|dark>.png           the scene alone in a phone window, 2x pixels
//   <id>-comps.png                        each companion large: at rest, in the two idle joint swings, waving each arm, and happy
// Prints console errors and page errors, and exits 1 if there were any.
const http = require("http"), fs = require("fs"), path = require("path");
const {chromium, executablePath} = require("../tests/pw");
const root = path.join(__dirname, "..");
const args = process.argv.slice(2), oi = args.indexOf("--out"), ni = args.indexOf("--only");
if (oi < 0) { console.log("usage: node tools/theme-review.js <theme id> [...] --out <dir> [--only scene,moment,still,phone,comp]"); process.exit(2); }
const OUT = args[oi + 1], ONLY = ni >= 0 ? args[ni + 1].split(",") : ["scene", "moment", "still", "phone", "comp"];
const IDS = args.filter((a, i) => !a.startsWith("--") && i !== oi + 1 && !(ni >= 0 && i === ni + 1));
fs.mkdirSync(OUT, {recursive: true});
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp", ".webmanifest": "application/manifest+json"};
const server = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(r); });
const errors = [];
const HIDE_UI = "#view,.sheet,.toast,#toast,[role=dialog],.cp,.cp-layer,.cp-front,.cp-bubble{visibility:hidden!important}";
async function open(browser, id, scheme, viewport, style) {
  const seed = {v: 2, courses: [], tasks: [], decks: [], notes: [], files: [], events: [], settings: {style: Object.assign({skin: id}, style || {}), owned: ["skin:" + id]}, updated: 1};
  const ctx = await browser.newContext({viewport, colorScheme: scheme, deviceScaleFactor: viewport.width < 500 ? 2 : 2, serviceWorkers: "block"});
  await ctx.addInitScript(([seed, scheme]) => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studioso:theme", scheme); localStorage.setItem("studyboard:tips", "off"); } } catch (e) {} }, [seed, scheme]);
  const page = await ctx.newPage();
  page.on("console", m => { if (m.type() === "error") errors.push(`${id} ${scheme}: ${m.text()}`); });
  page.on("pageerror", e => errors.push(`${id} ${scheme}: ${e.message}`));
  await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForSelector("#view", {state: "attached"}); await page.waitForTimeout(1500);
  for (let i = 0; i < 3; i++) { await page.evaluate(() => { document.querySelectorAll("dialog[open] [data-act=close], dialog[open] .x").forEach(b => b.click()); }); await page.keyboard.press("Escape").catch(() => {}); await page.waitForTimeout(150); }
  const skin = await page.evaluate(() => document.documentElement.getAttribute("data-skin"));
  if (skin !== id) errors.push(`${id}: the app is showing "${skin}" instead`);
  return {ctx, page};
}
const shot = (page, name) => page.screenshot({path: path.join(OUT, name + ".png")}).then(() => console.log("saved", name + ".png"));
const moment = page => page.evaluate(() => { const b = document.createElement("button"); b.setAttribute("data-act", "scene-moment"); b.style.cssText = "position:fixed;left:0;top:0;opacity:0"; document.body.appendChild(b); b.click(); b.remove(); });
async function comps(browser, id) {
  const {ctx, page} = await open(browser, id, "light", {width: 1600, height: 900});
  const n = await page.evaluate(() => {
    // the same joint swings the app's idle and cheer moves use, with its signs (side(): a left part raises with + rotation) (98-companion.js: headTilt 9/-4, tailSwish 14/-9, earTwitch 16, wingFlutter 26, finWiggle 10/-8, wave 115)
    const list = SBCOMP.list(document.documentElement.getAttribute("data-skin"));
    const host = document.createElement("div");
    host.id = "rvComps"; host.style.cssText = "position:fixed;inset:0;z-index:99999;background:#F4F1F8;display:grid;grid-template-columns:repeat(6,1fr);gap:6px;padding:10px;overflow:hidden;font:600 13px system-ui;color:#333";
    const POSES = [["rest", {}],
      ["idle swing A", {rot: {head: 9, tail: 14, earL: -16, earR: 16, wingL: 26, wingR: -26, armL: 10, armR: -10}}],
      ["idle swing B", {rot: {head: -4, tail: -9, earL: -5, earR: 5, wingL: 4, wingR: -4, armL: -8, armR: 8}}],
      ["wave left arm", {rot: {armL: 115}}], ["wave right arm", {rot: {armR: -115}}], ["happy", {eyes: "happy", mouth: "smile"}]];
    list.forEach(c => {
      POSES.forEach(([label, o]) => host.insertAdjacentHTML("beforeend", `<div style="background:#fff;border-radius:10px;display:flex;flex-direction:column;align-items:center;padding:4px"><div class="rv-art">${SBCOMP.rigSvg(c.id, o)}</div><div>${c.name}: ${label}</div></div>`));
    });
    const st = document.createElement("style"); st.textContent = "#rvComps .rv-art{width:200px;height:200px;position:relative}#rvComps .rv-art>svg{position:static!important;width:200px!important;height:200px!important;overflow:visible;transform:none!important}";
    document.head.appendChild(st); document.body.appendChild(host);
    host.querySelectorAll("svg").forEach(s => { s.dataset.e = "open"; s.dataset.prop = ""; });
    return list.length;
  });
  await page.waitForTimeout(400);
  await page.locator("#rvComps").screenshot({path: path.join(OUT, `${id}-comps.png`)}); console.log("saved", `${id}-comps.png (${n} companions)`);
  await ctx.close();
}
(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch({executablePath});
  const DESK = {width: 1280, height: 800}, PHONE = {width: 390, height: 844};
  try {
    for (const id of IDS) {
      for (const scheme of ["light", "dark"]) {
        if (ONLY.includes("scene")) {
          const {ctx, page} = await open(browser, id, scheme, DESK); await page.addStyleTag({content: HIDE_UI});
          let t = 1.5; for (const at of [1, 4, 9, 15]) { await page.waitForTimeout(Math.max(0, at - t) * 1000); t = at; await shot(page, `${id}-scene-${scheme}-t${at}`); }
          await ctx.close();
        }
        if (ONLY.includes("moment")) {
          const {ctx, page} = await open(browser, id, scheme, DESK); await page.addStyleTag({content: HIDE_UI}); await page.waitForTimeout(1500);
          await moment(page); let t = 0;
          for (const at of [0.6, 1.4, 2.4, 3.6, 5, 8]) { await page.waitForTimeout((at - t) * 1000); t = at; await shot(page, `${id}-moment-${scheme}-${at}`); }
          await ctx.close();
        }
        if (ONLY.includes("still")) {
          const {ctx, page} = await open(browser, id, scheme, DESK, {motion: false}); await page.addStyleTag({content: HIDE_UI}); await page.waitForTimeout(800);
          await shot(page, `${id}-still-${scheme}`); await ctx.close();
        }
        if (ONLY.includes("phone")) {
          const {ctx, page} = await open(browser, id, scheme, PHONE); await page.addStyleTag({content: HIDE_UI}); await page.waitForTimeout(2500);
          await shot(page, `${id}-phone-${scheme}`); await ctx.close();
        }
      }
      if (ONLY.includes("comp")) await comps(browser, id);
    }
  } finally { await browser.close(); server.close(); }
  if (errors.length) { console.log("\nERRORS:\n" + [...new Set(errors)].join("\n")); process.exit(1); }
  console.log("\nno console errors");
})();
