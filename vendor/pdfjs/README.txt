PDF.js (pdfjs-dist) 6.4.299, "legacy" build (ES modules with polyfills for older Safari/WebViews), copied unmodified from the npm package
(pdfjs-dist/legacy/build/pdf.min.mjs and pdf.worker.min.mjs). Mozilla Foundation, Apache License 2.0 (see LICENSE in this folder).
index.html loads it with import() from this same-origin path; prepare.js stages the same two files into the desktop app.
To update: npm install pdfjs-dist@<version>, copy the two files from node_modules/pdfjs-dist/legacy/build/ here, update the version in this note,
THIRD-PARTY-NOTICES.md and package.json, then re-run the PDF import tests.
