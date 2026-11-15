// node tests/companion-no-mouth-appears.e2e.js
// A companion with no mouth at rest (a bird showing just its beak) doesn't grow one when it smiles: tapping it used to draw little
// smile lines beside the beak on 15 birds (Gobbles had just one, on one side). For every companion with its own mouth drawings, a
// smile, open or sleepy face only adds a line-only stroke (a mouth line) when its resting face already has one.
// Also: every companion shows a mouth (or beak) at rest, measured in pixels, so no mouth is hidden at rest and then appears.
// And Gobbles' wattle hangs below the beak (it used to start at the top of the beak and hang over its side).
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  const browser = await chromium.launch({executablePath}), errs = [];
  try {
    const page = await browser.newPage(); page.on("pageerror", e => errs.push(e.message));
    await page.addInitScript(() => { window.__SB_TEST = true; localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studioso:tour", "done"); });
    await page.goto("file://" + path.join(__dirname, "..", "index.html")); await page.waitForFunction(() => window.SBCOMP && SBCOMP.all && SBCOMP.rigSvg, null, {timeout: 20000}); await page.waitForTimeout(1000);
    const r = await page.evaluate(async () => {
      // line-only strokes (fill none) in a mouth state; "ink" ones are dark (a mouth line, not a beak's own coloured detail)
      const lines = g => g ? [...g.querySelectorAll('path[fill="none"]')].filter(p => (p.getAttribute("stroke") || "") !== "") : [];
      const dark = p => { const s = p.getAttribute("stroke") || ""; const m = /^#([0-9a-f]{6})$/i.exec(s); if (!m) return false; const v = parseInt(m[1], 16); return (0.2126 * (v >> 16) + 0.7152 * ((v >> 8) & 255) + 0.0722 * (v & 255)) / 255 < 0.35; };
      // the birds whose resting face is just a beak (they used to get smile lines beside it)
      const BEAK_ONLY = ["plain-owl", "winter-penguin", "lemonade-bird", "sunset-gull", "music-bird", "valentines-lovebird", "easter-chick", "july4-eaglet", "thanksgiving-turkey", "diwali-peacock", "rooftops-pigeon", "writing-raven", "brazil-tuca", "rainforest-tiko", "tidepool-pippin"];
      const custom = [], bad = [];
      for (const c of SBCOMP.all()) {
        const box = document.createElement("div"); box.innerHTML = SBCOMP.rigSvg(c.id, {wear: []});
        const m = box.querySelector(".cp-mouth"); if (!m) continue;
        const st = k => m.querySelector(":scope > .cp-m-" + k);
        const neutral = lines(st("neutral"));
        if (BEAK_ONLY.includes(c.id)) {
          custom.push(c.id);
          // no state draws more lines than the resting beak's own (a beak keeps its detail lines; no smile lines are added)
          for (const k of ["smile", "open", "sleepy"]) { const l = lines(st(k)); if (l.length > neutral.length || l.some(dark) && !neutral.some(dark)) bad.push(`${c.name} (${c.id}) ${k}: ${l.map(p => p.getAttribute("d")).join(" | ")}`); }
          continue;
        }
        // every other companion: a dark mouth line only in a face that has one at rest
        if (neutral.some(dark) || !m.querySelector(":scope > .cp-m-neutral *")) continue;
        const restHasMouth = [...st("neutral").querySelectorAll("*")].some(e => dark(e) || /^(#2[0-9a-f]{5}|#1[0-9a-f]{5})$/i.test(e.getAttribute("fill") || ""));
        if (restHasMouth) continue;
        for (const k of ["smile", "open", "sleepy"]) { const add = lines(st(k)).filter(dark); if (add.length) bad.push(`${c.name} (${c.id}) ${k}: ${add.map(p => p.getAttribute("d")).join(" | ")}`); }
      }
      // pixels: how much each companion's resting mouth adds to its picture
      const base = ".cp-p,.cp-headg,.cp-eye,.cp-page{transform-box:view-box}.cp-cheeks{opacity:.62}.cp-e-happy,.cp-e-sleepy,.cp-mouth>g,.cp-prop,.cp-zs{display:none}";
      const draw = async (id, show) => {
        let svg = SBCOMP.rigSvg(id, {wear: []}).replace(/var\(--cp-wear,([^)]*)\)/g, "$1");
        svg = svg.replace(/<svg([^>]*)>/, (all, at) => `<svg xmlns="http://www.w3.org/2000/svg"${at} width="240" height="240"><style>${base}${show ? ".cp-mouth>.cp-m-neutral{display:inline}" : ""}</style>`);
        const img = new Image(); img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); await img.decode();
        const cv = document.createElement("canvas"); cv.width = cv.height = 240; const x = cv.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, 240, 240); x.drawImage(img, 0, 0, 240, 240);
        return x.getImageData(0, 0, 240, 240).data;
      };
      const hidden = [];
      for (const c of SBCOMP.all()) {
        const a = await draw(c.id, false), b = await draw(c.id, true); let d = 0;
        for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 60) d++;
        if (d < 8) hidden.push(`${c.name} (${c.id}): ${d}px`);
      }
      // Gobbles: the wattle (the red shape) starts below the top of the beak and reaches below its tip
      const box = document.createElement("div"); box.innerHTML = SBCOMP.rigSvg("thanksgiving-turkey", {wear: []});
      const g = box.querySelector(".cp-mouth > .cp-m-neutral"), ps = [...g.querySelectorAll("path")];
      const nums = p => (p.getAttribute("d").match(/-?\d+(?:\.\d+)?/g) || []).map(Number), ys = p => nums(p).filter((v, i) => i % 2 === 1);
      const wattle = ps.find(p => /^#E0463C$/i.test(p.getAttribute("fill") || "")), beak = ps.find(p => /^#F5B942$/i.test(p.getAttribute("fill") || ""));
      const gob = wattle && beak ? {wTop: Math.min(...ys(wattle)), wBottom: Math.max(...ys(wattle)), bTop: Math.min(...ys(beak)), bTip: Math.max(...ys(beak)), first: ps.indexOf(wattle) < ps.indexOf(beak)} : null;
      return {total: SBCOMP.all().length, custom, bad, hidden, gob};
    });
    ok(r.custom.length === 15, `the ${r.custom.length} birds whose resting face is just a beak are all here`);
    ok(!r.bad.length, "none of them grows a mouth line when it smiles, talks or sleeps" + (r.bad.length ? ":\n  " + r.bad.join("\n  ") : ""));
    ok(!r.hidden.length, `every one of the ${r.total} companions shows its mouth or beak at rest` + (r.hidden.length ? ": " + r.hidden.join(", ") : ""));
    ok(r.gob && r.gob.wTop > r.gob.bTop + 1.5 && r.gob.wBottom > r.gob.bTip + 3 && r.gob.first, "Gobbles' wattle hangs from under the beak (drawn behind it), not over it: " + JSON.stringify(r.gob));
    ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
    console.log("companion-no-mouth-appears.e2e: " + n + " checks passed");
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
