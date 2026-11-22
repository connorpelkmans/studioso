// Search by meaning on the student's own device (src/js/30-search.js): turns text into "meaning vectors" with BAAI's bge-small-en-v1.5
// (MIT license, about 34 MB, fetched once from Hugging Face and kept in the browser's cache), run by transformers.js on ONNX Runtime's
// WebAssembly engine on the processor. Nothing leaves the device. Bundled from @huggingface/transformers 4.3.2 with
// onnxruntime-web's CPU-only engine (see BUILD.md here); its own files are this folder's, so no CDN is ever used.
import { pipeline, env } from "./embed-lib.min.js";
// the model download names no page: Hugging Face turns away some site addresses (like workers.dev), and it needn't know the page
const fetch0 = self.fetch.bind(self);
self.fetch = (u, o) => fetch0(u, Object.assign({}, o, {referrerPolicy: "no-referrer"}));
env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm.wasmPaths = new URL("./", import.meta.url).href;
env.backends.onnx.wasm.numThreads = 1;   // the site isn't cross-origin isolated, so one thread (it's a small model)
const MODEL = "Xenova/bge-small-en-v1.5", QUERY = "Represent this sentence for searching relevant passages: ";
let ext = null;
self.onmessage = async e => {
  const {id, texts, query} = e.data || {};
  try {
    if (!ext) ext = pipeline("feature-extraction", MODEL, {dtype: "q8", progress_callback: p => { if (p && p.status === "progress" && /\.onnx$/.test(p.file || "")) self.postMessage({progress: (p.progress || 0) / 100}); }});
    const f = await ext;
    const inp = (texts || []).map(t => (query ? QUERY : "") + String(t || "").slice(0, 2000));
    const out = await f(inp, {pooling: "cls", normalize: true});
    self.postMessage({id, vecs: out.tolist()});
  } catch (err) { ext = null; self.postMessage({id, error: String((err && err.message) || err).slice(0, 300)}); }
};
