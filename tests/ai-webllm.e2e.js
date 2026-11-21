// node tests/ai-webllm.e2e.js: Studyboard's own on-device AI (Google's Gemma run in the browser by WebLLM, src/js/01-ai-device.js),
// used where Chrome's built-in AI isn't there. The graphics chip and the WebLLM engine are stood in for (this machine has no GPU), so
// these check Studyboard's side: when it's used, which model for which computer, asking before any download, the request it sends,
// falling back to the small model, saying Not Now and getting it later. The real vendored WebLLM files are loaded too, under the
// website's own security headers (_headers), to check they load and nothing is blocked.
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".png": "image/png", ".wasm": "application/wasm"};
const H = fs.readFileSync(path.join(ROOT, "_headers"), "utf8");
const cspFor = p => { const m = new RegExp("^" + p.replace(/[.*]/g, c => "\\" + c) + "\\n(?:  .*\\n)*?  Content-Security-Policy: (.*)$", "m").exec(H); return m ? m[1] : ""; };
const SITE = cspFor("/*"), WEB = cspFor("/vendor/webllm-0.2.89/*");
const server = http.createServer((req, res) => {
  let p; try { p = decodeURIComponent(new URL(req.url, "http://x").pathname); } catch (e) { res.writeHead(400); res.end(); return; }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream", "content-security-policy": p.startsWith("/vendor/webllm-0.2.89/") ? WEB : SITE});
  fs.createReadStream(f).pipe(res);
});
let fails = 0, n = 0; const ok = (c, m) => { n++; console.log((c ? "ok   " : "FAIL ") + m); if (!c) fails++; };

// The stand-ins: a graphics chip (o.gpu: f16, buffer limits), and WebLLM's engine, which records what it's asked and answers JSON
const stubs = o => {
  if (o.mem) Object.defineProperty(navigator, "deviceMemory", {value: o.mem, configurable: true});
  if (o.gpu) window.__SB_GPU_STUB = {requestAdapter: async () => ({features: new Set(o.gpu.f16 ? ["shader-f16"] : []), limits: {maxBufferSize: o.gpu.buf || 4e9, maxStorageBufferBindingSize: o.gpu.bind || 2e9}})};
  if (o.chrome) window.LanguageModel = {availability: async () => "available", create: async () => ({contextWindow: 6000, contextUsage: 100, destroy(){}, prompt: async () => JSON.stringify({answer: "from Chrome"})})};
  const log = window.__webLog = {loads: [], reqs: [], unloads: 0};
  window.__SB_WEBLLM_STUB = {stubWorker: true, cached: !!o.cached,
    CreateWebWorkerMLCEngine: async (w, id, cfg) => {
      log.loads.push({id, cfg: JSON.parse(JSON.stringify(cfg.appConfig))});
      if (o.oomBig && /gemma-4/.test(id)) throw new Error("GPUDevice was lost: out of memory");
      cfg.initProgressCallback({progress: 0.4, text: "Fetching"}); cfg.initProgressCallback({progress: 1, text: "Done"});
      return {chat: {completions: {create: async req => { log.reqs.push(JSON.parse(JSON.stringify(req))); return {choices: [{message: {content: JSON.stringify({answer: "from Gemma " + id})}, finish_reason: "stop"}]}; }}},
        unload: async () => { log.unloads++; }, interruptGenerate(){}};
    }};
};
(async () => {
  ok(/'wasm-unsafe-eval'/.test(WEB) && /https:\/\/huggingface\.co/.test(WEB) && !/'wasm-unsafe-eval'/.test(SITE), "_headers: only WebLLM's folder may compile WebAssembly and reach the model host");
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const port = server.address().port, b = await chromium.launch({executablePath});
  const open = async (o = {}) => {
    const ctx = await b.newContext({viewport: {width: 1100, height: 900}, serviceWorkers: "block"});
    await ctx.addInitScript({content: `(${stubs})(${JSON.stringify(o)}); window.__SB_TEST = true; window.__SB_DEVICE_AI_TEST = true; window.__csp = []; document.addEventListener("securitypolicyviolation", e => window.__csp.push(e.violatedDirective + " " + e.blockedURI));`});
    await ctx.addInitScript(() => { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); localStorage.setItem("studyboard:whatsNew", JSON.stringify({v: "1.15.8"})); });
    const p = await ctx.newPage(); p.errs = []; p.on("pageerror", e => p.errs.push(e.message));
    await p.goto(`http://127.0.0.1:${port}/index.html`); await p.waitForFunction(() => window.__sbDevAI, null, {timeout: 30000}); await p.waitForTimeout(600);
    return {ctx, p};
  };
  const cfg = p => p.evaluate(() => { const c = window.__sbDevAI.cfg(); return {provider: c.provider, kind: window.__sbDevAI.state.kind, status: window.__sbDevAI.state.status, model: (window.__sbDevAI.state.web || {}).id}; });
  const ask = p => p.evaluate(async () => { try { const r = await window.__sbDevAI.call({system: "Say hi.", parts: [{text: "Hello"}], schema: {type: "OBJECT", properties: {answer: {type: "STRING"}}}}); return {ok: true, answer: r.data.answer}; } catch (e) { return {ok: false, code: e.code, msg: e.message}; } });
  const sheet = async p => { await p.evaluate(() => { const x = document.createElement("button"); x.dataset.act = "ai-setup"; document.body.appendChild(x); x.click(); x.remove(); }); await p.waitForTimeout(300); return p.evaluate(() => (document.querySelector("dialog[open]") || {}).innerText || ""); };

  // 1. No Chrome model, a capable graphics chip: Gemma 4, asked before downloading
  { const R = await open({gpu: {f16: true}});
    const c = await cfg(R.p);
    ok(c.provider === "device" && c.kind === "webllm" && c.status === "downloadable" && c.model === "gemma-4-E2B-it-q4f16_1-MLC", "no Chrome model, a capable graphics chip: Gemma 4 E2B, not downloaded yet: " + JSON.stringify(c));
    ok(/AI is ready on this computer, no setup needed/.test(await sheet(R.p)) && /asks before downloading it once \(about 2\.8 GB\)/.test(await R.p.evaluate(() => document.querySelector("dialog[open]").innerText)), "AI Features says it's ready and that it asks before the one-time download");
    await R.p.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    const pending = ask(R.p);
    await R.p.waitForSelector("dialog.web-ai-ask[open]", {timeout: 5000});
    const dt = await R.p.evaluate(() => document.querySelector("dialog.web-ai-ask").innerText);
    ok(/Download Free AI to This Computer\?/.test(dt) && /Gemma 4/.test(dt) && /about 2\.8 GB/.test(dt) && /nothing you give it leaves this computer/.test(dt), "the first AI use asks first, saying what, how big, and that it stays on the computer");
    ok(await R.p.evaluate(() => window.__webLog.loads.length === 0), "nothing is downloaded before the student agrees");
    await R.p.click("dialog.web-ai-ask [data-yes]");
    const r = await pending;
    ok(r.ok && /from Gemma gemma-4-E2B-it-q4f16_1-MLC/.test(r.answer), "after Download, the request is answered by Gemma on the computer: " + JSON.stringify(r));
    const L = await R.p.evaluate(() => window.__webLog);
    const m = L.loads[0].cfg.model_list.find(x => x.model_id === "gemma-4-E2B-it-q4f16_1-MLC");
    ok(m && m.model === "https://huggingface.co/mlc-ai/gemma-4-E2B-it-q4f16_1-MLC" && /\/vendor\/webllm-0\.2\.89\/libs\/gemma-4-E2B-it-q4f16_1_cs512-webgpu\.wasm$/.test(m.model_lib), "the model files come from Hugging Face; its engine is Studyboard's own copy, not GitHub's");
    const q = L.reqs[0];
    ok(q.response_format.type === "json_object" && /"answer"/.test(q.response_format.schema) && /JSON Schema exactly/.test(q.messages[0].content) && /suitable for a school student/.test(q.messages[0].content), "the answer's shape is enforced and spelled out, and kept suitable for a school student");
    ok(q.max_tokens <= 1200 && q.temperature <= 0.7, "fitted to its 4,096-token window, with steady answers");
    const r2 = await ask(R.p);
    ok(r2.ok && !(await R.p.$("dialog.web-ai-ask[open]")) && (await R.p.evaluate(() => window.__webLog.loads.length)) === 1, "the next request doesn't ask again or reload the model");
    ok(await R.p.evaluate(() => localStorage.getItem("studyboard:webAIReady") === "gemma-4-E2B-it-q4f16_1-MLC"), "it remembers the model is downloaded");
    ok(!R.p.errs.length, "no page errors: " + R.p.errs.join(" | "));
    await R.ctx.close(); }

  // 2. Not Now: no download, the usual key setup, and AI Features offers it later
  { const R = await open({gpu: {f16: true}});
    const pending = ask(R.p); await R.p.waitForSelector("dialog.web-ai-ask[open]"); await R.p.click("dialog.web-ai-ask [data-no]");
    const r = await pending;
    ok(!r.ok && r.code === "no-consent" && /download it any time in Settings, AI Features/.test(r.msg), "Not Now: nothing is downloaded, and the student is told where to get it later");
    ok((await cfg(R.p)).provider !== "device", "and on-device AI isn't used until they choose it");
    const t = await sheet(R.p);
    ok(/Free AI on this computer\./.test(t) && await R.p.locator('[data-act="web-ai-get"]').count() === 1, "AI Features offers Download Free AI");
    await R.p.click('[data-act="web-ai-get"]'); await R.p.waitForTimeout(800);
    ok((await cfg(R.p)).provider === "device" && (await R.p.evaluate(() => window.__webLog.loads.length)) === 1, "and the button downloads it, after which it's used");
    await R.ctx.close(); }

  // 3. Which model for which computer
  { const R = await open({gpu: {f16: false}});
    ok((await cfg(R.p)).model === "gemma-4-E2B-it-q4f32_1-MLC", "a graphics chip without 16-bit support: the 32-bit build of Gemma 4");
    await R.ctx.close(); }
  { const R = await open({gpu: {f16: true}, mem: 4});
    ok((await cfg(R.p)).model === "gemma3-1b-it-q4f16_1-MLC", "a computer with 4 GB of memory: the small Gemma 3 1B (about 0.6 GB)");
    await R.ctx.close(); }
  { const R = await open({gpu: {f16: false}, mem: 4});
    ok((await cfg(R.p)).kind !== "webllm", "too small for either: not offered (the usual key setup)");
    await R.ctx.close(); }
  { const R = await open({});
    ok((await cfg(R.p)).kind !== "webllm", "no graphics chip access (WebGPU): not offered");
    await R.ctx.close(); }

  // 4. Gemma 4 turns out too big when it loads: the small model, from then on
  { const R = await open({gpu: {f16: true}, oomBig: true});
    const pending = ask(R.p); await R.p.waitForSelector("dialog.web-ai-ask[open]"); await R.p.click("dialog.web-ai-ask [data-yes]");
    const r = await pending;
    ok(r.ok && /gemma3-1b/.test(r.answer), "Gemma 4 runs out of memory: Gemma 3 1B answers instead: " + JSON.stringify(r));
    ok(await R.p.evaluate(() => localStorage.getItem("studyboard:webAISmall") === "1"), "and the small model is remembered for next time");
    await R.ctx.close(); }

  // 5. Chrome's built-in AI comes first when it's there
  { const R = await open({gpu: {f16: true}, chrome: true});
    const c = await cfg(R.p), r = await ask(R.p);
    ok(c.kind === "chrome" && r.answer === "from Chrome" && (await R.p.evaluate(() => window.__webLog.loads.length)) === 0, "with Chrome's built-in AI available, it's used, and nothing else is downloaded");
    await R.ctx.close(); }

  // 6. The real vendored WebLLM loads under the website's security headers (the model itself needs a graphics chip, not here)
  { const ctx = await b.newContext({serviceWorkers: "block"}), p = await ctx.newPage(), errs = [];
    p.on("pageerror", e => errs.push(e.message));
    await ctx.addInitScript({content: `window.__csp = []; document.addEventListener("securitypolicyviolation", e => window.__csp.push(e.violatedDirective + " " + e.blockedURI));`});
    await p.goto(`http://127.0.0.1:${port}/index.html`); await p.waitForTimeout(500);
    const r = await p.evaluate(async () => {
      const lib = await import("/vendor/webllm-0.2.89/web-llm.js");
      const w = new Worker("/vendor/webllm-0.2.89/worker.js", {type: "module"}); let werr = "";
      w.onerror = e => { werr = e.message || "worker error"; };
      await new Promise(res => setTimeout(res, 1500)); w.terminate();
      return {fns: ["CreateWebWorkerMLCEngine", "hasModelInCache", "WebWorkerMLCEngineHandler"].filter(k => typeof lib[k] === "function"), werr, csp: window.__csp};
    });
    ok(r.fns.length === 3, "the vendored WebLLM loads and has what Studyboard uses: " + r.fns.join(", "));
    ok(!r.werr, "its worker starts under its own policy: " + (r.werr || "no error"));
    ok(!r.csp.length, "nothing was blocked by the security policies: " + r.csp.join(", "));
    for (const f of ["gemma-4-E2B-it-q4f16_1_cs512-webgpu.wasm", "gemma-4-E2B-it-q4f32_1_cs512-webgpu.wasm", "gemma3-1b-it-q4f16_1_cs512-webgpu.wasm"]) {
      const sz = fs.statSync(path.join(ROOT, "vendor/webllm-0.2.89/libs", f)).size; ok(sz > 1e6 && sz < 25e6, `${f} is vendored and fits the website's 25 MB file limit (${(sz / 1e6).toFixed(1)} MB)`);
    }
    await ctx.close(); }

  await b.close(); server.close();
  console.log(fails ? `ai-webllm.e2e: ${fails} of ${n} FAILED` : `ai-webllm.e2e: ${n} checks passed`);
  process.exitCode = fails ? 1 : 0;
})().catch(e => { console.error(e); process.exit(1); });
