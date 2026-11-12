// node tests/pro-trial-tags.e2e.js (Playwright + Chromium; see tests/pw.js)
// On the free weeks of Pro, PRO tags stay on Pro features and items (as on the free plan); paying for Pro hides them
const http = require("http"), fs = require("fs"), path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const root = path.join(__dirname, "..");
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname); if (p === "/") p = "/index.html";
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("no"); return; }
  const mime = {".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css"};
  res.writeHead(200, {"content-type": mime[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  await new Promise(r => server.listen(0, r)); const base = "http://localhost:" + server.address().port + "/";
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, serviceWorkers: "block"});
    await ctx.addInitScript(() => { window.__SB_TEST = true; localStorage.setItem("studyboard:paywall-test", "1"); if (!localStorage.getItem("coursework:v2")) { localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, settings: {}, courses: [], tasks: []})); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:tour", "1"); } });
    const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
    await p.goto(base); await p.waitForTimeout(1200);
    const count = trial => p.evaluate(trial => {
      const P = window.__sbPlanObj(); P.paywall = () => true; P.isPro = () => true; P.trialTags = () => trial;
      document.querySelectorAll("dialog[open]").forEach(d => d.close());
      SBCOMP.open();
      const b = document.querySelector(".cp-pickbody"); const r = {acc: b.querySelectorAll(".cp-acc-n .pro-badge").length, pats: !!b.querySelector("h3.fsec .pro-badge"), all: b.querySelectorAll(".pro-badge").length};
      document.querySelectorAll("dialog[open]").forEach(d => d.close()); return r;
    }, trial);
    const trial = await count(true), paid = await count(false);
    ok(trial.acc > 0, "on the free weeks, Pro accessories keep their PRO tag: " + JSON.stringify(trial));
    ok(paid.all === 0, "paying for Pro, no PRO tags in the companion picker: " + JSON.stringify(paid));
    // Photo themes: none can be made on the free weeks; paid Pro can make them; after Pro ends, a theme someone made stays theirs
    const addTile = trial => p.evaluate(async trial => {
      const P = window.__sbPlanObj(); P.paywall = () => true; P.isPro = () => true; P.trialTags = () => trial;
      document.querySelectorAll("dialog[open]").forEach(d => d.close());
      const b = document.createElement("button"); b.dataset.act = "style-shop"; b.hidden = true; document.body.appendChild(b); b.click(); b.remove();
      await new Promise(r => setTimeout(r, 400)); const t2 = document.createElement("button"); t2.dataset.act = "shop-tab"; t2.dataset.id = "themes"; t2.hidden = true; document.body.appendChild(t2); t2.click(); t2.remove();
      await new Promise(r => setTimeout(r, 500)); const t = document.querySelector(".ph-add");
      const r = t ? {locked: t.classList.contains("locked"), text: t.textContent.replace(/\s+/g, " ").trim()} : null;
      document.querySelectorAll("dialog[open]").forEach(d => d.close()); return r;
    }, trial);
    const at = await addTile(true), ap = await addTile(false);
    ok(at && at.locked && /subscribe/.test(at.text), "on the free weeks, Add a Photo is locked: " + JSON.stringify(at));
    ok(ap && !ap.locked, "with paid Pro, Add a Photo is open: " + JSON.stringify(ap));
    const kept = await p.evaluate(() => { const P = window.__sbPlanObj(); P.paywall = () => true; P.isPro = () => false; P.trialTags = () => false; 
      return {photo: window.__sbOwns("skin", "ph-test1"), proSkin: window.__sbOwns("skin", "winter")}; });
    ok(kept.photo && !kept.proSkin, "after Pro ends, a photo theme someone made is still theirs (Pro themes lock): " + JSON.stringify(kept));
    ok(!errs.length, "no page errors: " + errs.join(" | "));
    console.log(`pro-trial-tags.e2e: ${n} checks passed`);
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally { await browser.close(); server.close(); }
})();
