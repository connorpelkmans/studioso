// A wide header/banner picture for the Safari extension (3840 x 2160, and 1400 x 560 for stores that use a wide tile).
//   SB_DSF=3 node tests/extension.e2e.js   (makes tests-out/extension-popup-synced.png at 3x), then:  node tools/make-safari-header.js [outDir]
"use strict";
const fs = require("fs"), path = require("path");
const {chromium, executablePath} = require("../tests/pw");
const root = path.join(__dirname, ".."), OUT = path.resolve(process.argv[2] || path.join(root, "build-resources", "safari-ios-listing"));
const b64 = f => "data:image/png;base64," + fs.readFileSync(f).toString("base64");
const pop = b64(path.join(root, "tests-out", "extension-popup-synced.png")), icon = b64(path.join(root, "icon-512.png"));
const html = (w, h, big) => `<!doctype html><meta charset="utf-8"><style>*{box-sizing:border-box}html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden}
body{font-family:-apple-system,"SF Pro Display","Helvetica Neue",Arial,sans-serif;color:#fff;background:radial-gradient(circle at 15% 20%,#2f6fe4 0,transparent 45%),radial-gradient(circle at 90% 90%,#1b4fb8 0,transparent 40%),#0f2a5c}
.t{height:${h}px;display:grid;grid-template-columns:1fr ${big ? 520 : 330}px;align-items:center;gap:${big ? 90 : 40}px;padding:0 ${big ? 190 : 90}px}
.brand{display:flex;align-items:center;gap:16px;font-weight:800;font-size:${big ? 44 : 30}px;margin-bottom:${big ? 48 : 26}px}.brand img{width:${big ? 92 : 64}px;height:${big ? 92 : 64}px;border-radius:22%}
h1{font-size:${big ? 104 : 52}px;line-height:1.06;margin:0 0 ${big ? 34 : 18}px;letter-spacing:-.02em}p{font-size:${big ? 40 : 21}px;line-height:1.4;margin:0;color:#dbe6ff}
.pills{display:flex;gap:14px;flex-wrap:wrap;margin-top:${big ? 44 : 24}px}.pills span{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);border-radius:999px;padding:10px 22px;font-size:${big ? 30 : 16}px;font-weight:600}
.pop{width:100%;display:block;border-radius:${big ? 28 : 14}px;box-shadow:0 30px 80px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.14)}</style>
<div class="t"><div><div class="brand"><img src="${icon}" alt="">Studyboard School Sync</div><h1>Your school site and your planner, always in step.</h1>
<p>Due dates, submitted work, grades and feedback from Canvas, Brightspace, Blackboard and Moodle, brought into Studyboard. Read only.</p>
<div class="pills"><span>Canvas</span><span>Brightspace</span><span>Blackboard</span><span>Moodle</span></div></div><img class="pop" src="${pop}" alt=""></div>`;
(async () => {
  fs.mkdirSync(OUT, {recursive: true});
  const browser = await chromium.launch({executablePath});
  for (const [name, w, h, scale, big] of [["header-3840x2160.png", 1920, 1080, 2, true], ["header-1400x560.png", 1400, 560, 1, false]]) {
    const ctx = await browser.newContext({viewport: {width: w, height: h}, deviceScaleFactor: scale}), p = await ctx.newPage();
    await p.setContent(html(w, h, big)); await p.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map(i => i.decode())]));
    await p.screenshot({path: path.join(OUT, name)}); console.log("saved", name); await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error(e.message || e); process.exit(1); });
