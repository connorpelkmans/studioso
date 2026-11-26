# How this folder was built

On-device search by meaning (src/js/30-search.js). Rebuild only to update the versions; keep the folder name in step with
`_headers`, `prepare.js` and `30-search.js` if the version changes.

```bash
mkdir b && cd b && npm init -y
npm install --ignore-scripts @huggingface/transformers@4.3.2 esbuild@0.25.10
echo 'export { pipeline, env } from "@huggingface/transformers";' > entry.js
npx esbuild entry.js --bundle --format=esm --platform=browser --minify \
  --alias:onnxruntime-web/webgpu=onnxruntime-web/wasm --conditions=onnxruntime-web-use-extern-wasm --outfile=embed-lib.min.js
cp node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm .
```

Why this way: the published browser build loads its engine from a CDN (blocked by the site's policy) and uses a 25.6 MB engine
file, over Cloudflare's 25 MiB per-file limit. Bundled against ONNX Runtime Web's CPU-only build, the engine is 14 MB and is served
from this folder. `embed-worker.js` is Studyboard's own code. The model (Xenova/bge-small-en-v1.5, q8, about 34 MB) is not in the
app: the worker downloads it once from Hugging Face into the browser's cache.
