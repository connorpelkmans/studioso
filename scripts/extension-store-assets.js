// The store pictures for the Studyboard School Sync extension, made from the real extension and app (extension/store/):
//   screenshot-1.png, screenshot-2.png, screenshot-3.png   1280x800 (Chrome Web Store, Edge Add-ons and Firefox Add-ons all accept this size)
//   promo-small.png 440x280 (Chrome's small promo tile), promo-marquee.png 1400x560 (Chrome's marquee, optional), logo-300.png (Edge's store logo)
// Usage: node tests/extension.e2e.js   (it saves the popup and app pictures in tests-out/), then: node scripts/extension-store-assets.js
// Only the product's own names and pictures are used; school platforms are named in plain text, never with their logos.
const fs = require("fs"), path = require("path");
const {chromium, executablePath} = require("../tests/pw");
const root = path.join(__dirname, ".."), IN = path.join(root, "tests-out"), OUT = path.join(root, "extension", "store");
const img = f => { const p = path.join(IN, f); if (!fs.existsSync(p)) throw new Error("Run node tests/extension.e2e.js first (missing tests-out/" + f + ")"); return "data:image/png;base64," + fs.readFileSync(p).toString("base64"); };
const icon = "data:image/png;base64," + fs.readFileSync(path.join(root, "icon-512.png")).toString("base64");

const BASE = `*{box-sizing:border-box}html,body{margin:0}body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#fff;
  background:radial-gradient(circle at 15% 20%,#2f6fe4 0,transparent 45%),radial-gradient(circle at 90% 90%,#1b4fb8 0,transparent 40%),#0f2a5c;overflow:hidden}
  .brand{display:flex;align-items:center;gap:12px;font-weight:800}.brand img{border-radius:22%}
  .shot{border-radius:14px;box-shadow:0 30px 70px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.12);display:block}
  h1{font-size:52px;line-height:1.08;margin:0 0 18px;letter-spacing:-.01em}p{font-size:22px;line-height:1.45;margin:0;color:#dbe6ff}
  .pills{display:flex;gap:10px;flex-wrap:wrap;margin-top:26px}.pills span{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);border-radius:999px;padding:8px 16px;font-size:17px;font-weight:600}`;
const shot = (title, text, pic, w, pills) => `<style>${BASE}
  .wrap{width:1280px;height:800px;display:grid;grid-template-columns:${w > 500 ? "400px 1fr" : "1fr 420px"};align-items:center;gap:56px;padding:0 80px}
  .pic{display:flex;justify-content:center}</style>
  <div class="wrap"><div><div class="brand" style="font-size:22px;margin-bottom:34px"><img src="${icon}" width="44" height="44" alt="">Studyboard School Sync</div>
  <h1>${title}</h1><p>${text}</p>${pills ? `<div class="pills">${pills.map(x => `<span>${x}</span>`).join("")}</div>` : ""}</div>
  <div class="pic"><img class="shot" src="${pic}" style="max-width:${w}px;max-height:720px;width:auto;height:auto"></div></div>`;
const PAGES = [
  ["screenshot-1.png", 1280, 800, shot("Connect your school site once.", "Type your school's address and allow Studyboard to read that one site. That's it: no passwords, nothing to copy.", img("extension-popup-empty.png"), 380, ["Canvas", "Brightspace", "Blackboard"])],
  ["screenshot-2.png", 1280, 800, shot("Then it keeps up by itself.", "Every hour, and whenever you open your school site, it reads your due dates, submissions, grades and feedback with the sign-in your browser already has. It only reads.", img("extension-popup-synced.png"), 380, ["Read only", "No ads or tracking"])],
  ["screenshot-3.png", 1280, 800, shot("Everything lands in Studyboard.", "Submitted work is ticked off, grades reach your Grade Tracker, and your instructor's feedback and rubric scores are one click away.", img("extension-app-feedback.png"), 640)],
  ["promo-small.png", 440, 280, `<style>${BASE}.t{height:280px;display:flex;flex-direction:column;justify-content:center;padding:0 34px;gap:14px}</style>
    <div class="t"><div class="brand" style="font-size:27px"><img src="${icon}" width="58" height="58" alt="">Studyboard</div><div style="font-size:21px;font-weight:700">School Sync</div><div style="font-size:15px;color:#dbe6ff">Canvas · Brightspace · Blackboard, kept in step with your planner</div></div>`],
  ["promo-marquee.png", 1400, 560, `<style>${BASE}.t{height:560px;display:grid;grid-template-columns:1fr 360px;align-items:center;padding:0 90px;gap:40px}</style>
    <div class="t"><div><div class="brand" style="font-size:30px;margin-bottom:26px"><img src="${icon}" width="64" height="64" alt="">Studyboard School Sync</div><h1>Your school site and your planner, always in step.</h1><p>Due dates, submissions, grades and feedback from Canvas, Brightspace or Blackboard, automatically.</p></div>
    <img class="shot" src="${img("extension-popup-synced.png")}" style="width:330px"></div>`],
  ["logo-300.png", 300, 300, `<style>html,body{margin:0;background:transparent}</style><img src="${icon}" width="300" height="300" alt="">`]
];

(async () => {
  fs.mkdirSync(OUT, {recursive: true});
  const browser = await chromium.launch({executablePath});
  for (const [name, w, h, html] of PAGES) {
    const p = await browser.newPage({viewport: {width: w, height: h}});
    await p.setContent("<!doctype html><meta charset=utf-8>" + html); await p.waitForTimeout(150);
    await p.screenshot({path: path.join(OUT, name), omitBackground: name === "logo-300.png"});
    await p.close(); console.log("extension/store/" + name);
  }
  await browser.close();
})().catch(e => { console.error(e.message || e); process.exit(1); });
