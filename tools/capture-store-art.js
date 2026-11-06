// node tools/capture-store-art.js [outDir]
// App Store featuring art at the sizes in Apple's Creative Assets template: Header (3840 x 1646), Search (3840 x 2560) and
// Universal (5244 x 2950), each also with the Studyboard logo above the phones (*-logo.png). Three phones in a fan on Studyboard navy, their tops (logo, Dynamic Island, today's plan) inside
// each size's "art safe area", running on past it like the template's sample art. No text: the App Store adds its own.
// Needs the raw captures from tools/capture-ios-screens.js (build-resources/ios-listing/screenshots/raw).
const http = require("http"), fs = require("fs"), path = require("path");
const {chromium, executablePath} = require("../tests/pw");
const root = path.join(__dirname, ".."), RAW = path.join(root, "build-resources/ios-listing/screenshots/raw");
const OUT = process.argv[2] || path.join(root, "build-resources/ios-listing/art");
// from the template: canvas size and art safe area (x, y, width, height), in pixels
const SIZES = [
  {name: "header", w: 3840, h: 1646, safe: [1097, 493, 1646, 661]},
  {name: "search", w: 3840, h: 2560, safe: [836, 765, 2168, 1030]},
  {name: "universal", w: 5244, h: 2950, safe: [1921, 660, 1402, 962]}];
// left, middle (in front), right
const PHONES = ["03-due", "01-today", "05-grades"];
for (const p of PHONES) if (!fs.existsSync(path.join(RAW, p + ".png"))) { console.error("missing " + p + ".png: run node tools/capture-ios-screens.js first"); process.exit(1); }
fs.mkdirSync(OUT, {recursive: true});
const server = http.createServer((q, r) => { const p = decodeURIComponent(new URL(q.url, "http://x").pathname), f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, {"content-type": /\.html$/.test(f) ? "text/html" : "application/octet-stream"}); fs.createReadStream(f).pipe(r); });

// one phone, framed as in the screenshots (tools/ios-frame.html), cut out on a clear background
async function phone(browser, name) {
  const ctx = await browser.newContext({viewport: {width: 440, height: 956}, deviceScaleFactor: 6});
  const page = await ctx.newPage(); await page.goto("http://localhost:" + server.address().port + "/tools/ios-frame.html");
  const shot = "data:image/png;base64," + fs.readFileSync(path.join(RAW, name + ".png")).toString("base64");
  await page.evaluate(shot => window.setShot(shot, ""), shot);
  await page.addStyleTag({content: "html,body,.f{background:transparent!important}h1{display:none}.phone{box-shadow:none!important}"});
  await page.evaluate(() => Promise.all([document.fonts.ready, document.getElementById("shot").decode()])); await page.waitForTimeout(200);
  const png = await page.locator(".phone").screenshot({omitBackground: true});
  await ctx.close();
  return "data:image/png;base64," + png.toString("base64");
}

// with logo: the Studyboard logo (white, website/assets/logo-dark.webp, 1086 x 240) centred at the top of the safe area, the
// phones just below it
const LOGO = "data:image/webp;base64," + fs.readFileSync(path.join(root, "website/assets/logo-dark.webp")).toString("base64");
async function art(browser, s, imgs, logo) {
  const [sx, sy, sw, sh] = s.safe, cx = sx + sw / 2;
  const lw = Math.round(Math.min(sw * 0.6, 1086)), lh = Math.round(lw * 240 / 1086), ltop = Math.round(sy + sh * 0.05);
  // the fan is about 1.3 times as wide as the safe area; each phone is 352 x 744 in shape
  const pw = Math.round(1.3 * sw / 2.24), ph = Math.round(pw * 744 / 352), top = logo ? ltop + lh + Math.round(sh * 0.08) : Math.round(sy + sh * 0.05);
  const side = (img, dir) => `<img src="${img}" style="position:absolute;width:${Math.round(pw * 0.9)}px;left:${Math.round(cx - pw * 0.45 + dir * pw * 0.66)}px;top:${Math.round(top + ph * 0.06)}px;transform:rotate(${dir * 9}deg);transform-origin:50% 100%;filter:drop-shadow(0 ${pw * 0.05}px ${pw * 0.08}px rgba(0,0,0,.45)) brightness(.92)">`;
  const html = `<!doctype html><html><head><style>html,body{margin:0;width:${s.w}px;height:${s.h}px;overflow:hidden}
    .bg{position:absolute;inset:0;background:radial-gradient(${Math.round(sw * 1.1)}px ${Math.round(sh * 1.6)}px at ${cx}px ${sy + sh * 0.45}px,#2E62AE 0%,#1B4686 40%,#0F2D5E 75%,#0A1F44 100%)}</style></head>
    <body><div class="bg"></div>${side(imgs[0], -1)}${side(imgs[2], 1)}
    <img src="${imgs[1]}" style="position:absolute;width:${pw}px;left:${Math.round(cx - pw / 2)}px;top:${top}px;filter:drop-shadow(0 ${pw * 0.06}px ${pw * 0.1}px rgba(0,0,0,.5))">
    ${logo ? `<img src="${LOGO}" style="position:absolute;width:${lw}px;height:${lh}px;left:${Math.round(cx - lw / 2)}px;top:${ltop}px;filter:drop-shadow(0 ${lh * 0.06}px ${lh * 0.2}px rgba(0,0,0,.35))">` : ""}</body></html>`;
  const ctx = await browser.newContext({viewport: {width: s.w, height: s.h}, deviceScaleFactor: 1});
  const page = await ctx.newPage(); await page.setContent(html);
  await page.evaluate(() => Promise.all([...document.images].map(i => i.decode()))); await page.waitForTimeout(200);
  const file = s.name + (logo ? "-logo" : "");
  await page.screenshot({path: path.join(OUT, file + ".png")});
  // the same with the safe area marked, to check by eye (not for upload)
  await page.evaluate(([x, y, w, h]) => { const d = document.createElement("div"); d.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;outline:8px solid #0f0;background:rgba(0,255,0,.12)`; document.body.appendChild(d); }, s.safe);
  await page.screenshot({path: path.join(OUT, "check-" + file + ".png")});
  console.log("made", file, s.w + "x" + s.h);
  await ctx.close();
}

(async () => {
  await new Promise(r => server.listen(0, r)); const browser = await chromium.launch({executablePath});
  try {
    const imgs = []; for (const p of PHONES) imgs.push(await phone(browser, p));
    for (const s of SIZES) { await art(browser, s, imgs, false); await art(browser, s, imgs, true); }
  } finally { await browser.close(); server.close(); }
  console.log("done:", OUT);
})().catch(e => { console.error(e); process.exit(1); });
