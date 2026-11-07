// Every companion in every accessory: contact sheets to look at, plus a pixel check of each item
//   node tools/companion-wear-review.js --out <dir> [--only <id,...|theme,...>] [--rows 12] [--no-sheets]
// Writes <dir>/wear-NN.png (one row per companion: bare, then each accessory) and <dir>/wear-report.json.
// The check renders each companion three ways (no accessory, only the accessory, everything with the accessory in a flat colour)
// and reports per item: vis (share of the accessory not hidden behind arms, wings...), on (share of it that sits on the character),
// out (share outside the 120x120 drawing) and gap (pixels between it and the character, 0 = touching).
"use strict";
const http = require("http"), fs = require("fs"), path = require("path");
const {chromium, executablePath} = require("../tests/pw");
const root = path.join(__dirname, "..");
const args = process.argv.slice(2), arg = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const OUT = arg("--out"); if (!OUT) { console.log("usage: node tools/companion-wear-review.js --out <dir> [--only ids/themes] [--rows 12] [--no-sheets]"); process.exit(2); }
const ONLY = (arg("--only") || "").split(",").filter(Boolean), ROWS = Number(arg("--rows")) || 12, SHEETS = !args.includes("--no-sheets");
fs.mkdirSync(OUT, {recursive: true});
const MIME = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".webp": "image/webp", ".webmanifest": "application/manifest+json"};
const server = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, "http://x").pathname); if (p === "/") p = "/index.html"; const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(r); });
const ITEMS = ["scarf", "bowtie", "medal", "star", "cape", "glasses", "hat", "beanie", "cap", "crown"];

(async () => {
  await new Promise(r => server.listen(0, r));
  const browser = await chromium.launch({executablePath});
  const ctx = await browser.newContext({viewport: {width: 1800, height: 1500}, deviceScaleFactor: 1, serviceWorkers: "block"});
  await ctx.addInitScript(() => { try { if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify({v: 2, courses: [], tasks: [], settings: {}, updated: 1})); localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); localStorage.setItem("studyboard:tips", "off"); localStorage.setItem("studyboard:theme-access", JSON.stringify({uid: "owner", on: true})); } } catch (e) {} });
  const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(e.message));
  await page.goto("http://localhost:" + server.address().port + "/"); await page.waitForFunction(() => window.SBCOMP && SBCOMP.all);
  await page.waitForTimeout(800);
  const all = await page.evaluate(only => {
    const extra = ["extra-cosmo"].filter(id => SBCOMP.rigSvg(id, {}));
    const list = SBCOMP.all().map(c => ({id: c.id, name: c.name, theme: c.theme})).concat(extra.map(id => ({id, name: id.replace("extra-", ""), theme: "extra"})));
    return only.length ? list.filter(c => only.includes(c.id) || only.includes(c.theme)) : list;
  }, ONLY);
  console.log(all.length + " companions");

  // The pixel check
  const report = await page.evaluate(async ([list, items]) => {
    const S = 2, W = 120 * S, PAD = 40 * S, CW = W + PAD * 2;
    const cv = document.createElement("canvas"); cv.width = cv.height = CW; const cx = cv.getContext("2d", {willReadFrequently: true});
    const HIDE = ".cp-eyes .cp-e-happy,.cp-eyes .cp-e-sleepy,.cp-mouth>g:not(.cp-m-neutral),.cp-zs,.cp-prop{display:none}";
    const prep = (svg, css) => svg.replace(/<svg([^>]*)viewBox="0 0 120 120"/, `<svg$1 xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CW}" viewBox="-40 -40 200 200"`).replace(/^(<svg[^>]*>)/, `$1<style>${HIDE}${css}</style>`).replace(/ class="cp-svg"/, ' class="cp-svg" style="--cp-wear:#5B7FD6"');
    const draw = svg => new Promise((res, rej) => { const im = new Image(); im.onload = () => { cx.clearRect(0, 0, CW, CW); cx.drawImage(im, 0, 0); res(cx.getImageData(0, 0, CW, CW).data); }; im.onerror = () => rej(new Error("img")); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); });
    const MAG = ".cp-acc,.cp-acc *{fill:#FF00FF!important;stroke:#FF00FF!important;fill-opacity:1!important;stroke-opacity:1!important;opacity:1!important}.cp-acc [fill=none]{fill:none!important}";
    const out = [];
    for (const c of list) {
      const bare = await draw(prep(SBCOMP.rigSvg(c.id, {wear: []}), ""));
      const sil = new Uint8Array(CW * CW); let sx0 = CW, sy0 = CW, sx1 = 0, sy1 = 0;
      for (let i = 0; i < CW * CW; i++) if (bare[i * 4 + 3] > 40) { sil[i] = 1; const x = i % CW, y = (i / CW) | 0; if (x < sx0) sx0 = x; if (x > sx1) sx1 = x; if (y < sy0) sy0 = y; if (y > sy1) sy1 = y; }
      // the eyes and mouth: nothing but glasses may cover them (clothes may go over the blush)
      const fm = await draw(prep(SBCOMP.rigSvg(c.id, {wear: []}), "svg *{visibility:hidden}.cp-eyes *,.cp-mouth *{visibility:visible}"));
      const faceM = new Uint8Array(CW * CW); let faceN = 0; for (let i = 0; i < CW * CW; i++) if (fm[i * 4 + 3] > 100) { faceM[i] = 1; faceN++; }
      const row = {id: c.id, name: c.name, theme: c.theme, box: [sx0, sy0, sx1, sy1].map(v => Math.round((v - PAD) / S)), items: {}};
      for (const it of items) {
        const svg = SBCOMP.rigSvg(c.id, {wear: [it]});
        const only = await draw(prep(svg, MAG + "svg *{visibility:hidden}.cp-acc,.cp-acc *{visibility:visible}"));
        const full = await draw(prep(svg, MAG));
        let tot = 0, vis = 0, on = 0, outside = 0, face = 0; const pts = [];
        for (let i = 0; i < CW * CW; i++) {
          if (only[i * 4 + 3] < 128) continue;
          tot++; const x = i % CW, y = (i / CW) | 0;
          if (sil[i]) on++;
          if (x < PAD || y < PAD || x >= PAD + W || y >= PAD + W) outside++;
          const r = full[i * 4], g = full[i * 4 + 1], b = full[i * 4 + 2];
          if (r > 200 && g < 60 && b > 200) { vis++; if (faceM[i]) face++; }
          if ((i & 3) === 0) pts.push(i);
        }
        // distance from the item to the character's outline
        let gap = 0;
        if (tot && !on) {
          gap = 1e9;
          for (const i of pts) { const x = i % CW, y = (i / CW) | 0; for (let d = 1; d < 60 && d < gap; d++) { let hit = false; for (const [dx, dy] of [[d, 0], [-d, 0], [0, d], [0, -d]]) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < CW && yy < CW && sil[yy * CW + xx]) { hit = true; break; } } if (hit) { gap = Math.min(gap, d); break; } } }
          gap = gap === 1e9 ? 99 : Math.round(gap / S);
        }
        row.items[it] = {px: Math.round(tot / S / S), vis: tot ? +(vis / tot).toFixed(2) : 0, on: tot ? +(on / tot).toFixed(2) : 0, out: tot ? +(outside / tot).toFixed(2) : 0, gap, face: faceN ? +(face / faceN).toFixed(3) : 0};
      }
      out.push(row);
    }
    return out;
  }, [all, ITEMS]);
  fs.writeFileSync(path.join(OUT, "wear-report.json"), JSON.stringify(report, null, 1));
  // Items that look wrong
  const RULES = {vis: 0.7, on: {scarf: 0.35, bowtie: 0.35, medal: 0.5, star: 0.5, cape: 0.15, glasses: 0.5, hat: 0.1, beanie: 0.12, cap: 0.08, crown: 0.08}};
  const flags = [];
  report.forEach(r => ITEMS.forEach(it => { const m = r.items[it], why = [];
    if (it !== "cape" && m.vis < RULES.vis) why.push(`only ${Math.round(m.vis * 100)}% visible`);
    if (it === "cape" && m.vis < 0.12) why.push(`cape only ${Math.round(m.vis * 100)}% visible`);
    if (m.gap > 0) why.push(`floating ${m.gap}px off the body`);
    else if (m.on < RULES.on[it]) why.push(`only ${Math.round(m.on * 100)}% on the body`);
    if (it !== "glasses" && m.face > 0.004) why.push(`covers ${(m.face * 100).toFixed(1)}% of the face (eyes/mouth)`);
    if (it !== "cape" && m.out > 0.08) why.push(`${Math.round(m.out * 100)}% outside the drawing`);
    if (why.length) flags.push(`${r.id} ${it}: ${why.join(", ")}`);
  }));
  fs.writeFileSync(path.join(OUT, "wear-flags.txt"), flags.join("\n") + "\n");
  console.log(flags.length + " flagged items (wear-flags.txt)");

  if (SHEETS) {
    const cols = ["bare"].concat(ITEMS), fl = new Set(flags.map(f => f.split(":")[0]));
    for (let s = 0; s * ROWS < all.length; s++) {
      const chunk = all.slice(s * ROWS, (s + 1) * ROWS);
      await page.evaluate(([chunk, cols, flagged]) => {
        document.getElementById("rvWear")?.remove();
        const host = document.createElement("div"); host.id = "rvWear";
        host.style.cssText = `position:fixed;left:0;top:0;z-index:99999;background:#F4F1F8;display:grid;grid-template-columns:110px repeat(${cols.length},140px);gap:3px;padding:6px;font:600 11px system-ui;color:#333`;
        host.insertAdjacentHTML("beforeend", `<div></div>` + cols.map(c => `<div style="text-align:center">${c}</div>`).join(""));
        chunk.forEach(c => {
          host.insertAdjacentHTML("beforeend", `<div style="display:flex;align-items:center;font-size:10px;word-break:break-all">${c.id}</div>`);
          cols.forEach(it => host.insertAdjacentHTML("beforeend", `<div class="rv-art" style="background:#fff;border-radius:8px;${flagged.includes(c.id + " " + it) ? "box-shadow:inset 0 0 0 2px #E5484D" : ""}">${SBCOMP.rigSvg(c.id, {wear: it === "bare" ? [] : [it]})}</div>`));
        });
        if (!document.getElementById("rvWearCss")) { const st = document.createElement("style"); st.id = "rvWearCss"; st.textContent = "#rvWear .rv-art{width:140px;height:140px;position:relative;overflow:hidden}#rvWear .rv-art>svg{position:absolute!important;left:17px;top:17px;width:106px!important;height:106px!important;overflow:visible;transform:none!important}#rvWear .cp-zs{display:none}"; document.head.appendChild(st); }
        document.body.appendChild(host);
        host.querySelectorAll("svg").forEach(s => { s.dataset.e = "open"; s.dataset.prop = ""; s.style.setProperty("--cp-wear", "#5B7FD6"); });
      }, [chunk, cols, [...fl]]);
      await page.waitForTimeout(150);
      const name = `wear-${String(s + 1).padStart(2, "0")}.png`;
      await page.locator("#rvWear").screenshot({path: path.join(OUT, name)}); console.log("saved", name);
    }
  }
  if (errs.length) console.log("page errors:\n" + errs.join("\n"));
  await browser.close(); server.close();
})().catch(e => { console.error(e); process.exit(1); });
