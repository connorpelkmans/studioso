// The worker that runs WebLLM for Studyboard (src/js/01-ai-device.js): the model runs here, off the page's thread, under this folder's
// own policy (_headers), which alone allows WebAssembly and reaching the model files.
import {WebWorkerMLCEngineHandler} from "./web-llm.js";
// the model download names no page: Hugging Face turns away some site addresses (like workers.dev), and it needn't know the page
const fetch0 = self.fetch.bind(self);
self.fetch = (u, o) => fetch0(u, Object.assign({}, o, {referrerPolicy: "no-referrer"}));
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = msg => handler.onmessage(msg);
