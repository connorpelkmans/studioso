// node tests/link-device.e2e.js: Cards From a Link with the AI built into the device, which can't open web pages. The website asks
// its own /api/page-text (the real handler from cloudflare/site/page-text.js runs here, with a stand-in for the web); the iPhone app
// fetches the page itself. The model is stood in for and gets the page's text.
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const csp = require("../scripts/csp");
const ROOT = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png"};
const para = (k, topic) => Array.from({length: k}, (_, i) => `<p>${topic} fact ${i + 1}: the sodium potassium pump moves three sodium ions out of the cell and two potassium ions in for every ATP it uses, which keeps the membrane potential steady.</p>`).join("");
const ARTICLE = `<html><head><title>Active transport | Khan Academy</title><script>window.x=1</script></head><body><nav><a>Home</a></nav><main><article><h1>Active transport</h1><h2>Primary active transport</h2>${para(5, "Primary")}<h2>Secondary active transport</h2>${para(5, "Secondary")}</article></main><footer>Terms</footer></body></html>`;
const WEB = {"https://www.khanacademy.org/active": [200, "text/html", ARTICLE], "https://news.com/locked": [402, "text/html", ""], "https://files.com/a.pdf": [200, "application/pdf", "%PDF"]};
let handlePageText, apiCalls = 0;
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  if (p === "/api/page-text") {
    apiCalls++;
    const r = await handlePageText(new Request("https://studyboardapp.com" + req.url, {headers: {"sec-fetch-site": req.headers["sec-fetch-site"] || "", origin: req.headers.origin || ""}}), {}, null,
      async url => { const w = WEB[url]; return w ? new Response(w[2], {status: w[0], headers: {"content-type": w[1]}}) : new Response("", {status: 404}); });
    res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(await r.text()); return;
  }
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"});
  if (p === "/index.html" || /^\/bundle\/[^/]+\.js$/.test(p)) { res.end((/\.html$/.test(p) ? csp.apply : String)(fs.readFileSync(f, "utf8").replace("const PRO_ENFORCED = true;", "const PRO_ENFORCED = false;"))); return; }
  fs.createReadStream(f).pipe(res);
});
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
const fake = () => {
  const log = window.__devLog = [];
  window.LanguageModel = {availability: async () => "available", create: async o => ({contextWindow: 6000, contextUsage: 300, destroy(){}, async prompt(input, po){
    const text = input.map(m => m.content.map(c => c.value).join("\n")).join("\n"), sch = JSON.stringify(po.responseConstraint || {}); log.push(text);
    if (/"overview"/.test(sch)) return JSON.stringify({status: "ok", title: "Active transport", overview: "How cells move ions against their gradients using ATP or other gradients.", sections: [{heading: "Pumps", points: ["The sodium potassium pump uses ATP"]}], terms: [], reason: ""});
    const s = (text.match(/(Primary|Secondary) fact \d+[^.]*\./g) || []).slice(0, 3);
    return JSON.stringify({deckTitle: "Active Transport", cards: s.map((b, i) => ({basis: b, front: `What does the pump do (${b.split(" ").slice(0, 3).join(" ")})?`, back: `Fact ${(/fact (\d+)/.exec(b) || [])[1]}: it keeps the gradient across the membrane, case ${i + 1}.`}))});
  }})};
};
(async () => {
  ({handlePageText} = await import(path.join(ROOT, "cloudflare", "site", "page-text.js")));
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const port = server.address().port, b = await chromium.launch({executablePath});
  const open = async (ios) => {
    const ctx = await b.newContext({viewport: {width: 1200, height: 900}, serviceWorkers: "block"});
    await ctx.addInitScript({content: `(${fake})();` + (ios ? `window.__iosGets = []; window.Capacitor = {isNativePlatform: () => true, getPlatform: () => "ios", isPluginAvailable: n => false, registerPlugin: () => ({}), Plugins: {CapacitorHttp: {get: async o => { window.__iosGets.push(o.url); return {status: 200, url: o.url, headers: {"Content-Type": "text/html"}, data: ${JSON.stringify(ARTICLE)}}; }}}};` : "")});
    await ctx.addInitScript(() => { window.__SB_TEST = true; window.__SB_DEVICE_AI_TEST = true;
      localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:whatsNew", JSON.stringify({v: "1.15.8"}));
      localStorage.setItem("coursework:v2", JSON.stringify({v: 2, updated: 1, tasks: [], files: [], notes: [], events: [], decks: [], settings: {}, courses: [{id: "c1", name: "Biology", code: "BIO 110", color: "#3B6FE0"}]})); });
    const p = await ctx.newPage(); p.errs = []; p.on("pageerror", e => p.errs.push(e.message));
    await p.goto(`http://127.0.0.1:${port}/index.html`); await p.waitForFunction(() => window.__sbSync && window.SBLINKCARDS, null, {timeout: 30000}); await p.waitForTimeout(500);
    await p.evaluate(() => { const S = window.__sbSync; S.ui.filter = "c1"; S.ui.tab = "flashcards"; S.render(); const x = document.createElement("button"); x.dataset.act = "fc-ai-cards"; document.body.appendChild(x); x.click(); x.remove(); });
    await p.waitForSelector("#aiGo"); await p.click("#aiLinkD summary");
    return {ctx, p};
  };
  const go = async (p, url) => { await p.fill("#aiLink", url); await p.click("#aiGo");
    await p.waitForFunction(() => document.querySelector("#arSave") || (document.querySelector("#aiGo") && !document.querySelector("#aiGo").disabled && !document.querySelector("#aiGo").classList.contains("busy")), null, {timeout: 60000, polling: 300});
    return p.evaluate(() => ({cards: document.querySelectorAll("#arCards li").length, status: (document.querySelector("#aiStatus") || {}).textContent || "", log: window.__devLog})); };

  // The website: its own /api/page-text reads the page, the model gets its text
  { const R = await open(false);
    ok(await R.p.evaluate(() => window.__sbDevAI.cfg().provider === "device"), "no key: the AI on the device");
    const out = await go(R.p, "https://www.khanacademy.org/active");
    ok(apiCalls === 1, "the page is read once, through the website's own /api/page-text");
    ok(out.log.some(t => /Its text, read from the page “Active transport \| Khan Academy”/.test(t)), "the model is told the text was read from the page, with its title");
    ok(out.log.every(t => !/window\.x|<p>|Home|Terms/.test(t)), "it gets clean text: no code, tags, menu or footer");
    const cardReqs = out.log.filter(t => /Make exactly \d+ flashcard/.test(t));
    ok(cardReqs.length >= 2 && cardReqs.some(t => /Notes \(.*Primary active transport\)/.test(t)) && cardReqs.some(t => /Notes \(.*Secondary active transport\)/.test(t)), "the cards are made from the page's own text, section by section, by its headings: " + cardReqs.length);
    ok(out.cards >= 2, "and come back for review: " + out.cards);
    ok(!R.p.errs.length, "no page errors: " + R.p.errs.join(" | "));
    await R.ctx.close(); }
  // a paywall and a PDF are explained, nothing is made up
  { const R = await open(false), before = 0;
    let x = await go(R.p, "https://news.com/locked");
    ok(/behind a login or paywall/.test(x.status) && x.log.length === before, "a paywalled page is explained, and nothing goes to the model: " + x.status.slice(0, 90));
    x = await go(R.p, "https://files.com/a.pdf");
    ok(/That link is a PDF\. Download it and add it with Add Files instead/.test(x.status), "a link to a PDF says how to add it");
    x = await go(R.p, "http://192.168.0.10/notes");
    ok(!/read from the page/.test(x.log.slice(before).join(" ")), "a private address never gets fetched: " + x.status.slice(0, 90));
    ok(!R.p.errs.length, "no page errors: " + R.p.errs.join(" | "));
    await R.ctx.close(); }

  // The iPhone app: fetches the page itself (no website round trip) and extracts the text on the phone
  { const calls0 = apiCalls, R = await open(true);
    const out = await go(R.p, "https://www.khanacademy.org/active");
    ok(apiCalls === calls0 && (await R.p.evaluate(() => window.__iosGets)).length === 1, "the iPhone app fetches the page itself, without the website");
    ok(out.log.some(t => /Its text, read from the page/.test(t)) && out.cards >= 2, "and the model gets its text and makes the cards: " + out.cards);
    await R.ctx.close(); }

  await b.close(); server.close();
  console.log(fails ? `link-device.e2e: ${fails} of ${n} FAILED` : `link-device.e2e: ${n} checks passed`);
  process.exitCode = fails ? 1 : 0;
})().catch(e => { console.error(e); process.exit(1); });
