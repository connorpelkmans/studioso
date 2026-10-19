// node tests/csp-crlf.test.js
// A page saved with Windows line endings (a Windows checkout, as on the Windows build machine) must get the same CSP hashes as the
// LF page: the browser turns CRLF into LF before hashing, so hashes taken over CRLF text block every multi-line script (a blank app).
"use strict";
const fs = require("fs"), path = require("path"), assert = require("assert");
const csp = require("../scripts/csp");
const root = path.join(__dirname, "..");
const lf = fs.readFileSync(path.join(root, "index.html"), "utf8"), crlf = lf.replace(/\r?\n/g, "\r\n");
const list = h => (h.match(/CSP-HASHES\*\/"([^"]*)"/) || [])[1];
assert(list(lf) && list(csp.apply(crlf)) === list(lf), "a CRLF copy of index.html gets the same CSP hashes as the LF one");
assert(/\*\.html\s+text eol=lf/.test(fs.readFileSync(path.join(root, ".gitattributes"), "utf8")), ".gitattributes keeps index.html LF on every checkout");
assert(/replace\(\/\\r\\n\?\/g, "\\n"\)/.test(fs.readFileSync(path.join(root, "prepare.js"), "utf8")), "prepare.js hashes the desktop page's scripts with LF line endings too");
console.log("csp-crlf: 3 checks passed");
