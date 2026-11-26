Tesseract.js 7.0.0 (Apache License 2.0), its WebAssembly cores from tesseract.js-core 7.0.0 (Apache License 2.0), and the English
LSTM model eng.traineddata (4.0.0_best_int, from @tesseract.js-data/eng 1.0.0, Apache License 2.0, by Google / the Tesseract OCR
project).

Used by src/js/01-ocr.js to read the words in photos and scanned PDFs on the device, for the AI built into the browser. Loaded only
when needed, on the website only (prepare.js doesn't copy it into the desktop or phone apps; the iPhone app uses Apple's Vision).
Files: tesseract.min.js and worker.min.js (dist/), core/ (only the three LSTM builds: relaxed SIMD, SIMD and plain, the worker picks
one), lang/eng.traineddata.gz. The worker needs 'wasm-unsafe-eval', which _headers allows for this folder only.
To update: npm pack tesseract.js tesseract.js-core @tesseract.js-data/eng, copy the same files, rename the folder, and update
OCR_DIR in src/js/01-ocr.js and the path in _headers.
