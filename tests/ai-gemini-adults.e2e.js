// node tests/ai-gemini-adults.e2e.js: a Gemini API key is for adults only (Google's Gemini API terms: 18 or older). AI Features
// shows the option only to a signed-in student whose birthday makes them 18 or older, under Advanced, with that rule and a link to
// the terms; everyone else never sees it, and saving AI Features still works for them.
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => { let f; try { f = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; } res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res); });
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const b = await chromium.launch({executablePath});
  const open = async (adult, key) => {
    const ctx = await b.newContext({viewport: {width: 1100, height: 900}, serviceWorkers: "block"});
    await ctx.addInitScript(([adult, key]) => { window.__SB_TEST = true; if (adult) window.__SB_ADULT = true;
      localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:whatsNew", JSON.stringify({v: "9.9.9"}));
      if (key) { localStorage.setItem("studyboard:aiKeys", JSON.stringify({gemini: "AIzaTESTTESTTESTTESTTESTTEST12345"})); localStorage.setItem("studyboard:aiConsent", JSON.stringify({gemini: {v: 1, at: 1}})); } }, [adult, key]);
    const p = await ctx.newPage(); p.errs = []; p.on("pageerror", e => p.errs.push(e.message));
    await p.goto(`http://127.0.0.1:${server.address().port}/index.html`); await p.waitForFunction(() => window.__sbSync, null, {timeout: 30000}); await p.waitForTimeout(500);
    await p.evaluate(() => { const x = document.createElement("button"); x.dataset.act = "ai-setup"; document.body.appendChild(x); x.click(); x.remove(); }); await p.waitForTimeout(500);
    return {ctx, p};
  };
  // 1. Not known to be 18 or older (not signed in, under 18, or no birthday): no Gemini key anywhere
  { const R = await open(false), t = await R.p.evaluate(() => (document.querySelector("dialog[open]") || {}).innerText || "");
    ok(!/Gemini API Key|Google AI Studio|Create API Key/.test(t), "no Gemini key option or steps for someone not known to be 18 or older");
    ok(!/uses Google Gemini by default/.test(t), "and Gemini isn't presented as the default");
    await R.p.evaluate(() => { const s = [...document.querySelectorAll("dialog[open] button")].find(x => /^Save$/.test(x.textContent.trim())); if (s) s.click(); }); await R.p.waitForTimeout(500);
    ok(!R.p.errs.length, "saving AI Features still works: " + R.p.errs.join(" | "));
    await R.ctx.close(); }
  // 2. An adult: under Advanced, with the 18+ rule and Google's terms
  { const R = await open(true), info = await R.p.evaluate(() => { const d = document.querySelector("dialog[open] .ai-gem-adv"); return d ? {sum: d.querySelector("summary").textContent, note: (d.querySelector(".ai-gem-18") || {}).textContent || "", link: (d.querySelector('.ai-gem-18 a') || {}).href || "", input: !!d.querySelector('[data-key="gemini"]'), open: d.open} : null; });
    ok(info && /Use Your Own Gemini API Key \(Advanced\)/.test(info.sum), "an adult has it, under Advanced (open only when there's no free AI on the computer): " + JSON.stringify(info && info.sum));
    ok(info && /You must be 18 or older to use a Gemini API key/.test(info.note) && /Gemini API Terms of Service/.test(info.note), "with the 18+ rule right where the key goes");
    ok(info && info.link === "https://ai.google.dev/gemini-api/terms", "linking Google's Gemini API terms");
    ok(info && info.input, "and the key box inside it");
    ok(!R.p.errs.length, "no page errors: " + R.p.errs.join(" | "));
    await R.ctx.close(); }
  // 3. Someone with a key saved before this: it stays visible (and can be removed)
  { const R = await open(false, true), has = await R.p.evaluate(() => !!document.querySelector('dialog[open] .ai-gem-adv [data-key="gemini"]'));
    ok(has, "a key saved before stays visible so it can be removed");
    await R.ctx.close(); }
  await b.close(); server.close();
  console.log(`\n${n - fails}/${n} passed`); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
