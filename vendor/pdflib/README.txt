pdf-lib 1.17.1 (pdf-lib/dist/pdf-lib.min.js) and @pdf-lib/fontkit 1.1.1 (dist/fontkit.umd.min.js), copied unmodified from the npm packages. MIT License (see LICENSE.md);
the libraries bundled inside them and their licences are listed in NOTICE.txt. fontkit is loaded only when someone adds their own font.
The PDF reader's Edit mode (src/js/99-pdf-edit.js) loads it with a <script> tag from this same-origin path the first time someone edits a PDF;
prepare.js stages the same file into the desktop app. It defines window.PDFLib. It uses no eval, so the page's CSP doesn't change.
To update: npm install pdf-lib@<version> @pdf-lib/fontkit@<version>, copy the two files here, check NOTICE.txt still lists what they bundle, update the version in this note, THIRD-PARTY-NOTICES.md and package.json, then run tests/pdf-edit.test.js and tests/pdf-edit.e2e.js.
