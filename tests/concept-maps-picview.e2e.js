// node tests/concept-maps-picview.e2e.js
// A tap on a box's picture shows it big over the map (Escape or a tap closes it); a tap on the box's words still picks the box.
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const ext = path.extname(f), mime = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".webmanifest": "application/manifest+json"};
  res.writeHead(200, {"content-type": mime[ext] || "application/octet-stream"});
  if (p === "/index.html" || /^\/bundle\/[^/]+\.js$/.test(p)) { res.end((/\.html$/.test(p) ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const SEED = () => ({v: 2, updated: 1, settings: {}, courses: [{id: "c1", name: "Physics", code: "PHY 101", color: "#2F6FE4", maps: [{id: "m1", name: "Motion", auto: false, created: 1, at: 1,
  add: [{id: "p1", label: "credits 1300", img: {k: "k1", w: 4, h: 3}}], links: [], pos: {"idea:p1": [0, 0]}}]}], tasks: [], notes: [], decks: [], files: [], events: []});
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  for (const vp of [{width: 1280, height: 860}, {width: 390, height: 844}]) {
    const ctx = await browser.newContext({viewport: vp, serviceWorkers: "block", hasTouch: vp.width < 500});
    await ctx.addInitScript(seed => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify(seed)); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:sb", JSON.stringify("local")); localStorage.setItem("studyboard:tour", "done"); } } catch (e) {} }, SEED());
    const page = await ctx.newPage(), errs = []; page.on("pageerror", e => errs.push(e.message));
    await page.goto(base); await page.waitForFunction(() => window.__sbProStudy && window.SBCMAP); await page.waitForTimeout(400);
    await page.evaluate(async () => { const c = document.createElement("canvas"); c.width = 400; c.height = 300; const g = c.getContext("2d"); g.fillStyle = "#1E3A8A"; g.fillRect(0, 0, 400, 300); g.fillStyle = "#F2B83A"; g.beginPath(); g.arc(200, 150, 90, 0, 7); g.fill();
      const b = await new Promise(r => c.toBlob(r, "image/jpeg", .9)); await window.__sbProStudy.idbSet("cimg:k1", b); });
    await page.evaluate(() => { const b = document.createElement("button"); b.dataset.act = "cm-open"; b.dataset.id = "c1"; b.dataset.kind = "course"; b.dataset.map = "m1"; b.style.display = "none"; document.body.appendChild(b); b.click(); b.remove(); });
    await page.waitForSelector('.cm-node[data-n="idea:p1"] image.cm-img', {timeout: 8000}); await page.waitForTimeout(400);
    const tag = vp.width + "px";
    const im = await page.locator('.cm-node[data-n="idea:p1"] image.cm-img').boundingBox();
    await page.mouse.click(im.x + im.width / 2, im.y + im.height / 2); await page.waitForTimeout(300);
    ok(await page.locator(".cm-picview img").count() === 1, tag + ": a tap on the picture shows it big");
    const big = await page.locator(".cm-picview img").boundingBox();
    ok(big.width > im.width * 1.3, tag + ": bigger than on the map (" + Math.round(im.width) + " -> " + Math.round(big.width) + "px)");
    ok(/credits 1300/.test(await page.textContent(".cm-picview .cm-player-head")), tag + ": with the box's name");
    if (process.env.SHOTS) await page.screenshot({path: require("path").join(process.env.SHOTS, "picview-" + vp.width + ".png")});
    await page.keyboard.press("Escape"); await page.waitForTimeout(250);
    ok(await page.locator(".cm-picview").count() === 0 && await page.locator(".cm-node").count() > 0, tag + ": Escape closes it, and the map stays open");
    await page.mouse.click(im.x + im.width / 2, im.y + im.height / 2); await page.waitForTimeout(250);
    await page.click(".cm-picbig"); await page.waitForTimeout(250);
    ok(await page.locator(".cm-picview").count() === 0, tag + ": a tap on the big picture closes it too");
    // start with nothing picked (the tap on the picture picked the box too)
    await page.evaluate(() => { const n = document.querySelector('.cm-node.is-sel'); if (n) n.classList.remove("is-sel"); });
    { const cv = await page.locator(".cm-svg").boundingBox(); await page.mouse.click(cv.x + 14, cv.y + 14); await page.waitForTimeout(500); }
    const lab = await page.locator('.cm-node[data-n="idea:p1"] .cm-lab').boundingBox();
    await page.mouse.click(lab.x + lab.width / 2, lab.y + lab.height / 2); await page.waitForTimeout(300);
    ok(await page.locator(".cm-picview").count() === 0 && await page.evaluate(() => !!document.querySelector('.cm-node[data-n="idea:p1"].is-sel')), tag + ": a tap on the box's words picks the box instead");
    ok(errs.length === 0, tag + ": no page errors " + errs.join(" | "));
    await ctx.close();
  }
  await browser.close(); server.close();
  console.log("\nconcept-maps-picview.e2e: " + n + " checks passed");
})().catch(e => { console.error(e); process.exit(1); });
