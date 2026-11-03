// App Store screenshots for the Studyboard School Sync Safari extension on iPhone (6.9", 1320 x 2868) and iPad (13", 2064 x 2752).
//   SB_DSF=3 node tests/extension.e2e.js                       (makes tests-out/extension-*.png at 3x)
//   node tools/capture-ios-screens.js <dir> 05-grades          (the Studyboard grades screen at iPhone size, into <dir>/raw/)
//   node tools/make-safari-ios-assets.js <dir-with-raw> [outDir]
// Output: outDir/iphone-1..3.png and outDir/ipad-1..3.png (default build-resources/safari-ios-listing).
// The pictures are the extension's own popup and the Studyboard app, on Studyboard navy with a headline: marketing-style
// screenshots, not Simulator captures. Replace them with Simulator captures (Cmd+S) if you prefer.
"use strict";
const fs = require("fs"), path = require("path");
const {chromium, executablePath} = require("../tests/pw");
const root = path.join(__dirname, ".."), IN = path.join(root, "tests-out");
const rawDir = path.resolve(process.argv[2] || ""), OUT = path.resolve(process.argv[3] || path.join(root, "build-resources", "safari-ios-listing"));
const need = f => { if (!fs.existsSync(f)) throw new Error("missing " + f); return "data:image/png;base64," + fs.readFileSync(f).toString("base64"); };
const popEmpty = need(path.join(IN, "extension-popup-empty.png")), popSynced = need(path.join(IN, "extension-popup-synced.png")), appWide = need(path.join(IN, "extension-app-feedback.png"));
const grades = need(path.join(rawDir, "raw", "05-grades.png"));
const icon = need(path.join(root, "icon-512.png"));
fs.mkdirSync(OUT, {recursive: true});

// device: css size and scale; a card (the picture) is shown at "w" css px wide
const DEV = {
  iphone: {w: 440, h: 956, scale: 3, h1: 38, p: 18, brand: 18, top: 58, gap: 18, side: 30},
  ipad: {w: 1032, h: 1376, scale: 2, h1: 62, p: 28, brand: 26, top: 90, gap: 26, side: 90}
};
const page = (d, kind, title, text, pic, picW, pills) => `<!doctype html><meta charset="utf-8"><style>
*{box-sizing:border-box}html,body{margin:0;width:${d.w}px;height:${d.h}px;overflow:hidden}
body{font-family:-apple-system,"SF Pro Display","Helvetica Neue",Arial,sans-serif;color:#fff;
 background:radial-gradient(90% 55% at 50% 0%,#2F6FE4 0%,transparent 70%),radial-gradient(70% 45% at 100% 100%,#1B4FB8 0%,transparent 70%),#0F2A5C;position:relative}
.brand{display:flex;align-items:center;justify-content:center;gap:${d.brand * .55}px;font-weight:800;font-size:${d.brand}px;margin-top:${d.top}px}
.brand img{width:${d.brand * 2}px;height:${d.brand * 2}px;border-radius:22%}
h1{margin:${d.gap * 1.2}px ${d.side}px ${d.gap * .5}px;text-align:center;font-size:${d.h1}px;line-height:1.1;font-weight:800;letter-spacing:-.02em;text-wrap:balance}
p{margin:0 ${d.side}px;text-align:center;font-size:${d.p}px;line-height:1.4;color:#DBE6FF;text-wrap:balance}
.pills{display:flex;gap:${d.gap * .4}px;justify-content:center;flex-wrap:wrap;margin-top:${d.gap}px}
.pills span{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);border-radius:999px;padding:${d.p * .35}px ${d.p * .9}px;font-size:${d.p * .85}px;font-weight:600}
.pic{position:absolute;left:50%;bottom:${d.top * .7}px;transform:translateX(-50%);width:${picW}px;display:flex;justify-content:center}
.pic img{display:block;width:100%;height:auto;max-height:${Math.round(d.h - d.top * 3.6 - d.h1 * 3.4 - d.p * 5)}px;object-fit:contain;border-radius:${kind === "phone" ? 40 : 18}px;box-shadow:0 ${d.gap}px ${d.gap * 3}px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.14)}
</style><div class="brand"><img src="${icon}" alt="">Studyboard School Sync</div><h1>${title}</h1><p>${text}</p>
${pills ? `<div class="pills">${pills.map(x => `<span>${x}</span>`).join("")}</div>` : ""}
<div class="pic"><img src="${pic}" alt=""></div>`;

const SHOTS = [
  {title: "Connect your school site once.", text: "Type your school's address and allow Studyboard to read that one site. No passwords, nothing to copy.", pills: ["Canvas", "Brightspace", "Blackboard", "Moodle"], pic: popEmpty, w: {iphone: 330, ipad: 560}},
  {title: "Then it keeps up by itself.", text: "Every hour, and whenever you open your school site, it reads your due dates, submissions and grades. It only reads.", pills: ["Read only", "No ads or tracking"], pic: popSynced, w: {iphone: 330, ipad: 560}},
  {title: "Everything lands in Studyboard.", text: "Submitted work is ticked off, grades reach your Grade Tracker, and feedback is one tap away.", pic: null, w: {iphone: 300, ipad: 880}}
];

(async () => {
  const browser = await chromium.launch({executablePath});
  for (const dev of ["iphone", "ipad"]) {
    const d = DEV[dev];
    for (let i = 0; i < SHOTS.length; i++) {
      const s = SHOTS[i];
      const pic = i === 2 ? (dev === "iphone" ? grades : appWide) : s.pic;
      // the Studyboard screen on iPhone is a full phone screen: show it tall, with rounded corners
      const w = s.w[dev], kind = i === 2 && dev === "iphone" ? "phone" : "card";
      const ctx = await browser.newContext({viewport: {width: d.w, height: d.h}, deviceScaleFactor: d.scale});
      const p = await ctx.newPage();
      await p.setContent(page(d, kind, s.title, s.text, pic, w, s.pills));
      await p.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map(i => i.decode())])); await p.waitForTimeout(250);
      const out = path.join(OUT, `${dev}-${i + 1}.png`);
      await p.screenshot({path: out}); console.log("saved", path.relative(root, out));
      await ctx.close();
    }
  }
  await browser.close();
})().catch(e => { console.error(e.message || e); process.exit(1); });
