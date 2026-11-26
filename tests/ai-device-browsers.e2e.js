// node tests/ai-device-browsers.e2e.js: which on-device AI each kind of browser and device gets (01-ai-device.js). A graphics chip
// (WebGPU) and WebLLM are stood in for; the browser is told apart by its user agent as real ones are.
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".webp": "image/webp", ".wasm": "application/wasm"};
const server = http.createServer((req, res) => {
  let f; try { f = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };
const UA = {
  chromeMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
  edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0",
  iphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1",
  android: "Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36",
  ipad: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15",
  safariMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15"};
(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const port = server.address().port, b = await chromium.launch({executablePath});
  const open = async o => {
    const ctx = await b.newContext({viewport: {width: 1000, height: 800}, userAgent: o.ua, serviceWorkers: "block", hasTouch: !!o.touch});
    await ctx.addInitScript(o2 => {
      window.__SB_TEST = true; window.__SB_DEVICE_AI_TEST = true;
      Object.defineProperty(navigator, "userAgentData", {value: undefined, configurable: true});
      if (o2.mem === null) Object.defineProperty(navigator, "deviceMemory", {value: undefined, configurable: true}); else Object.defineProperty(navigator, "deviceMemory", {value: o2.mem, configurable: true});
      if (o2.touch) Object.defineProperty(navigator, "maxTouchPoints", {value: 5, configurable: true});
      if (o2.gpu) window.__SB_GPU_STUB = {requestAdapter: async () => ({features: new Set(["shader-f16"]), limits: {maxBufferSize: 4e9, maxStorageBufferBindingSize: 2e9}})};
      else Object.defineProperty(navigator, "gpu", {value: undefined, configurable: true});
      window.__SB_WEBLLM_STUB = {stubWorker: true, cached: false, CreateWebWorkerMLCEngine: async () => ({chat: {completions: {create: async () => ({choices: [{message: {content: "{}"}}]})}}, unload: async () => {}, interruptGenerate(){}})};
      if (o2.lm) window.LanguageModel = {availability: async () => "available", create: async () => ({destroy(){}, prompt: async () => "{}"})};
      localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:whatsNew", JSON.stringify({v: "9.9.9"}));
    }, o);
    const p = await ctx.newPage(); p.errs = []; p.on("pageerror", e => p.errs.push(e.message));
    await p.goto(`http://127.0.0.1:${port}/index.html`); await p.waitForFunction(() => window.__sbDevAI, null, {timeout: 30000}); await p.waitForTimeout(700);
    const st = await p.evaluate(() => ({kind: window.__sbDevAI.state.kind || "", status: window.__sbDevAI.state.status || "", model: (window.__sbDevAI.state.web || {}).id || "", provider: window.__sbDevAI.cfg().provider}));
    return {ctx, p, st};
  };
  const setupText = async p => { await p.evaluate(() => { const x = document.createElement("button"); x.dataset.act = "ai-setup"; document.body.appendChild(x); x.click(); x.remove(); }); await p.waitForTimeout(400); return p.evaluate(() => (document.querySelector("dialog[open]") || {}).innerText || ""); };

  let R = await open({ua: UA.chromeMac, gpu: true, mem: 8});
  ok(R.st.kind === "webllm" && /gemma-4/.test(R.st.model), "a Mac computer without Chrome's AI: the full Gemma 4 download: " + JSON.stringify(R.st)); await R.ctx.close();
  R = await open({ua: UA.safariMac, gpu: true, mem: null});
  ok(R.st.kind === "webllm" && /gemma-4/.test(R.st.model), "Safari on a Mac (it doesn't say its memory): the full model: " + JSON.stringify(R.st)); await R.ctx.close();
  R = await open({ua: UA.iphone, gpu: true, mem: null, touch: true});
  ok(!R.st.kind || R.st.kind !== "webllm", "Safari on an iPhone (memory unknown): no download: " + JSON.stringify(R.st));
  ok(/isn't available in this phone's browser/.test(await setupText(R.p)) && /Studyboard app uses Apple Intelligence/.test(await R.p.evaluate(() => document.querySelector("dialog[open]").innerText)), "and AI Features says why, and what works instead"); await R.ctx.close();
  R = await open({ua: UA.android, gpu: true, mem: 8, touch: true});
  ok(R.st.kind === "webllm" && /gemma3-1b/.test(R.st.model), "an Android phone with 8 GB: only the small model: " + JSON.stringify(R.st)); await R.ctx.close();
  R = await open({ua: UA.android, gpu: true, mem: 4, touch: true});
  ok(R.st.kind !== "webllm", "an Android phone with 4 GB: none: " + JSON.stringify(R.st)); await R.ctx.close();
  R = await open({ua: UA.ipad, gpu: true, mem: null, touch: true});
  ok(R.st.kind === "webllm" && /gemma3-1b/.test(R.st.model), "an iPad (it looks like a Mac, with touch): the small model: " + JSON.stringify(R.st)); await R.ctx.close();
  R = await open({ua: UA.edge, gpu: true, mem: 8, lm: true});
  const t = await setupText(R.p);
  ok(R.st.kind === "chrome" && /Edge's built-in AI/.test(t) && !/Chrome's built-in AI/.test(t), "Edge's own built-in AI is named as Edge's: " + (t.match(/[^.]*built-in AI[^.]*/) || [""])[0]); await R.ctx.close();
  R = await open({ua: UA.chromeMac, gpu: false, mem: 8});
  { const tx = await setupText(R.p); ok(/doesn.t support WebGPU/.test(tx), "a browser without WebGPU: AI Features says why, and which browsers can: " + JSON.stringify(R.st) + " " + (tx.match(/[^\n]*(WebGPU|built-in AI|key below)[^\n]*/) || [""])[0]); } await R.ctx.close();
  await b.close(); server.close();
  console.log(`\nai-device-browsers.e2e: ${n - fails}/${n} passed`); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
