// The worker that runs WebLLM for Studyboard (src/js/01-ai-device.js): the model runs here, off the page's thread, under this folder's
// own policy (_headers), which alone allows WebAssembly and reaching the model files.
import {WebWorkerMLCEngineHandler} from "./web-llm.js";
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = msg => handler.onmessage(msg);
