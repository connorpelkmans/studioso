WebLLM 0.2.89 (@mlc-ai/web-llm, Apache License 2.0, MLC team): web-llm.js is the unmodified lib/index.js of the npm package.
worker.js is Studyboard's own (5 lines). libs/ holds the compiled model engines for the models Studyboard uses, unmodified, from
github.com/mlc-ai/binary-mlc-llm-libs (web-llm-models/v0_2_87/base), so they don't depend on GitHub at run time:
  gemma-4-E2B-it-q4f16_1_cs512-webgpu.wasm, gemma-4-E2B-it-q4f32_1_cs512-webgpu.wasm (Gemma 4 E2B, Apache 2.0)
  gemma3-1b-it-q4f16_1_cs512-webgpu.wasm (Gemma 3 1B, Gemma Terms of Use)
The model weights themselves (about 2.8 GB and 0.6 GB) are downloaded by the student's browser, only after they agree, from
huggingface.co/mlc-ai, and kept in the browser's cache.

Used by src/js/01-ai-device.js as the AI on the device where Chrome's built-in AI isn't available. Website and desktop app
(prepare.js copies it); not the phone apps. The worker needs 'wasm-unsafe-eval' and the model host, which _headers allows for this
folder only. To update: npm pack @mlc-ai/web-llm, copy lib/index.js to web-llm.js, fetch the matching libs for its modelVersion,
rename the folder, and update WEBLLM_DIR in src/js/01-ai-device.js and the path in _headers.
