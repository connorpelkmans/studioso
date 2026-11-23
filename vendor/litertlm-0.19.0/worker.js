// Studyboard's stronger on-device AI: Google's Gemma 4 E4B, run by LiteRT-LM (litertlm.js, bundled from @litert-lm/core 0.19.0,
// Apache-2.0) on the graphics chip, in this worker so the page never stalls. src/js/01-ai-device.js talks to it:
//   {t: "load", model: Blob | URL, wasm: [paths to try], ctx}  -> {t: "loaded"} or {t: "error"}
//   {t: "ask", id, system, text, schema, maxTokens, temperature} -> {t: "partial", id, n} while it writes, then {t: "done", id, text} or {t: "error", id}
//   {t: "cancel", id}
// An answer's shape is enforced: the model answers by calling one "respond" tool whose parameters are the shape asked for, with
// LiteRT-LM's constrained decoding, so what comes back always parses. Each request is a fresh conversation (nothing carries over).
// (a classic worker: LiteRT-LM loads its WebAssembly's JavaScript with importScripts, which module workers don't have)
importScripts("./litertlm.js");
const { Engine, loadLiteRtLm } = self.LiteRTLM;

let engine = null, current = null;
const post = m => self.postMessage(m);
// Gemini-style shapes (OBJECT, STRING...) to the JSON Schema subset LiteRT-LM reads
function schemaOf(s){
  if (!s || typeof s !== "object") return {type: "object"};
  const out = {};
  if (s.type) out.type = String(s.type).toLowerCase();
  if (s.description) out.description = String(s.description).slice(0, 300);
  if (Array.isArray(s.enum)) out.enum = s.enum.map(String);
  if (s.properties) { out.properties = {}; for (const [k, v] of Object.entries(s.properties)) out.properties[k] = schemaOf(v); }
  if (Array.isArray(s.required)) out.required = s.required.slice();
  if (s.items) out.items = schemaOf(s.items);
  return out;
}
async function load(model, wasm, ctx){
  let err = null;
  // (in a worker, its WebAssembly would be looked for next to this file: it's told where it really is)
  for (const path of wasm) { const dir = String(path).replace(/\/+$/, ""); try { self.Module = {locateFile: f => dir + "/" + f}; await loadLiteRtLm(dir); err = null; break; } catch (e) { err = e; } }
  if (err) throw err;
  engine = await Engine.create({model, mainExecutorSettings: {maxNumTokens: ctx || 8192}});
}
function textOf(msg){
  const c = msg && msg.content;
  if (typeof c === "string") return c;
  return (Array.isArray(c) ? c : []).filter(x => x && x.type === "text").map(x => x.text).join("");
}
async function ask(m){
  // the answer's shape enforced with a "respond" tool; if this model or runtime won't do that, once more as plain JSON
  try { await askWith(m, true); }
  catch (err) { if (m.sent || /cancel/i.test(String(err && err.message))) throw err; await askWith(m, false); }
}
async function askWith(m, useTool){
  const {id, system, text, schema, maxTokens, temperature} = m;
  // (LiteRT-LM reads tools in the OpenAI form: {type: "function", function: {name, description, parameters}})
  const tool = {type: "function", function: {name: "respond", description: "Give your complete answer. Always answer by calling this, exactly once.", parameters: schemaOf(schema)}};
  const sessionConfig = {maxOutputTokens: Math.max(64, Math.min(4096, Number(maxTokens) || 1500)), samplerParams: {temperature: temperature == null ? 0.3 : Math.max(0, Math.min(1, Number(temperature))), k: 40, p: 0.95}};
  const conv = await engine.createConversation(useTool ? {
    preface: {messages: [{role: "system", content: `${system}\n\nAnswer by calling the respond tool once, with every field filled from what you were given.`}], tools: [tool]},
    enableConstrainedDecoding: true, sessionConfig
  } : {
    preface: {messages: [{role: "system", content: `${system}\n\nReply with only one JSON object matching this JSON Schema, and nothing else (no code fences):\n${JSON.stringify(schemaOf(schema))}`}]},
    sessionConfig
  });
  current = {id, conv};
  try {
    let n = 0, last = null;
    const stream = conv.sendMessageStreaming({role: "user", content: text});
    for await (const chunk of stream) {
      if (!current || current.id !== id) break;
      last = chunk; n += textOf(chunk).length + JSON.stringify(chunk.tool_calls || "").length;
      post({t: "partial", id, n}); m.sent = true;
    }
    // the tool call's arguments are the answer; plain text (JSON) if it answered without the tool
    const all = conv.getHistory ? await conv.getHistory() : null;
    const msg = Array.isArray(all) ? all.filter(m => m && m.role !== "user" && m.role !== "system").pop() : last;
    const call = msg && Array.isArray(msg.tool_calls) && msg.tool_calls.find(c => c && c.function && c.function.name === "respond");
    if (call) post({t: "done", id, text: JSON.stringify(call.function.arguments || {})});
    else post({t: "done", id, text: textOf(msg)});
  } finally { current = null; try { conv.delete && conv.delete(); } catch (e) {} }
}
self.onmessage = async e => {
  const m = e.data || {};
  try {
    if (m.t === "load") { await load(m.model, m.wasm || [], m.ctx); post({t: "loaded", id: m.id}); }
    else if (m.t === "ask") await ask(m);
    else if (m.t === "cancel" && current && current.id === m.id) { try { current.conv.cancel(); } catch (x) {} current = null; }
  } catch (err) { post({t: "error", id: m.id, message: String((err && err.message) || err)}); }
};
