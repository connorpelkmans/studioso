// An OpenAI-compatible chat client for the teacher, the judge and the student (vLLM, llama.cpp's server, Ollama, DeepInfra,
// Together, Cloudflare Workers AI's OpenAI endpoint...). Configured by environment variables with a prefix:
//   <P>_URL    base URL ending in /v1 (e.g. http://127.0.0.1:8000/v1)
//   <P>_MODEL  model name the server knows
//   <P>_KEY    API key if the server needs one (read from the environment only; never written to any file or log)
//   <P>_PRICE_IN / <P>_PRICE_OUT  US dollars per million tokens, to keep a running cost (optional)
//   <P>_CONCURRENCY  requests at once (default 4)
const fs = require("fs");
function client(prefix){
  const env = k => process.env[`${prefix}_${k}`];
  const url = (env("URL") || "").replace(/\/$/, ""), model = env("MODEL"), key = env("KEY") || "";
  if (!url || !model) throw new Error(`Set ${prefix}_URL and ${prefix}_MODEL (see ml/README.md)`);
  const pin = Number(env("PRICE_IN") || 0), pout = Number(env("PRICE_OUT") || 0);
  let running = 0; const queue = [], max = Number(env("CONCURRENCY") || 4);
  const stats = {calls: 0, fails: 0, inTok: 0, outTok: 0, usd: 0};
  const slot = () => new Promise(r => { if (running < max) { running++; r(); } else queue.push(r); });
  const free = () => { const n = queue.shift(); if (n) n(); else running--; };
  async function chat({messages, temperature = 0.7, max_tokens = 1200, schema, n = 1, extra = {}}){
    await slot();
    try {
      const body = Object.assign({model, messages, temperature, max_tokens}, extra);
      // JSON mode where the server has it; the schema is also in the system prompt (as the app sends it)
      if (schema) body.response_format = process.env[`${prefix}_JSON`] === "object" ? {type: "json_object"} : {type: "json_schema", json_schema: {name: "out", schema: loose(schema), strict: false}};
      if (n > 1 && process.env[`${prefix}_N`] !== "0") body.n = n;
      for (let i = 0; ; i++) {
        try {
          const r = await fetch(url + "/chat/completions", {method: "POST", headers: Object.assign({"content-type": "application/json"}, key ? {authorization: "Bearer " + key} : {}), body: JSON.stringify(body)});
          if (r.status === 429 || r.status >= 500) throw new Error("status " + r.status);
          const j = await r.json();
          if (!j.choices) throw new Error("no choices: " + JSON.stringify(j).slice(0, 200));
          stats.calls++; const u = j.usage || {}; stats.inTok += u.prompt_tokens || 0; stats.outTok += u.completion_tokens || 0;
          stats.usd = (stats.inTok * pin + stats.outTok * pout) / 1e6;
          let outs = j.choices.map(c => ({content: (c.message && c.message.content) || "", finish: c.finish_reason}));
          // servers without n: ask again for the rest
          while (outs.length < n) { const more = await chat({messages, temperature, max_tokens, schema, n: 1, extra}); outs = outs.concat(more); }
          return outs;
        } catch (e) {
          if (i >= 5) { stats.fails++; throw e; }
          await new Promise(r => setTimeout(r, 1000 * 2 ** i));
        }
      }
    } finally { free(); }
  }
  return {chat, stats, model, prefix};
}
// The app's schemas are Gemini-style (type: "OBJECT"); servers want JSON Schema
function loose(s){
  if (!s || typeof s !== "object") return s;
  if (Array.isArray(s)) return s.map(loose);
  const o = {};
  for (const [k, v] of Object.entries(s)) {
    if (k === "type" && typeof v === "string") o.type = v.toLowerCase();
    else if (k === "propertyOrdering" || k === "nullable") continue;
    else o[k] = loose(v);
  }
  return o;
}
const readJsonl = f => fs.existsSync(f) ? fs.readFileSync(f, "utf8").split("\n").filter(Boolean).map(l => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean) : [];
module.exports = {client, loose, readJsonl};
