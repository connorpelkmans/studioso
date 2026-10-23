#!/usr/bin/env node
// Keeps the page's Content-Security-Policy strict: inline <script> blocks are allowed by SHA-256 hash, not 'unsafe-inline', so markup that
// sneaks into the page can't run code. The policy is added by the first inline script in index.html (a static <meta> made Chrome fire junk
// requests, see SECURITY-REVIEW.md #13); this tool rewrites the hash list inside it.
//
//   node scripts/csp.js           update index.html in place (run after editing any inline script or anything in src/: it also builds
//                                 bundle/ from src/; `npm test` fails while either is stale)
//   node scripts/csp.js --check   exit 1 if index.html's hashes don't match its scripts
//   require("./scripts/csp").apply(html) -> html with fresh hashes (prepare.js and build-site.js call this after they change the page)
//
// The first script (the one that installs the policy) runs before the policy exists, so it is never hashed. Every later inline script is.
// Inside Claude's artifact preview (*.claudeusercontent.com), which injects scripts of its own, the injector keeps 'unsafe-inline'.
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");

const MARK = "/*CSP-HASHES*/";
// The browser turns every CRLF (and lone CR) into LF before it hashes a script, so the hash is taken the same way: a page saved with
// Windows line endings (a Windows checkout) must still match.
const sha = s => "'sha256-" + crypto.createHash("sha256").update(String(s).replace(/\r\n?/g, "\n"), "utf8").digest("base64") + "'";

function apply(html){
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  if (scripts.length < 2) throw new Error("csp: expected the policy script plus at least one more inline script");
  const first = scripts[0][1];
  if (!first.includes('cm.httpEquiv="Content-Security-Policy"') || !first.includes(MARK)) throw new Error("csp: the first inline script must be the policy injector with " + MARK);
  const hashes = scripts.slice(1).map(m => sha(m[1])).join(" ");
  // The hash list sits between the marker comment and the closing quote of the H variable: var H=/*CSP-HASHES*/"...";
  const re = new RegExp(MARK.replace(/[*/]/g, "\\$&") + '"[^"]*"');
  const next = first.replace(re, MARK + '"' + hashes + '"');
  return html.replace(first, () => next);
}

function stale(html){ return apply(html) !== html; }

module.exports = {apply, stale};

if (require.main === module) {
  // index.html loads the app's code and styles from bundle/ (built from src/, with a ?v= hash of each); this run rebuilds and restamps them
  // too (scripts/app-files.js), so editing a file in src/ and running this one command is all it takes.
  const AF = require("./app-files");
  const file = path.join(__dirname, "..", "index.html");
  const html = fs.readFileSync(file, "utf8");
  if (process.argv.includes("--check")) {
    if (stale(html)) { console.error("csp: index.html's script hashes are stale. Run: node scripts/csp.js"); process.exit(1); }
    const p = AF.problems(html); if (p.length) { console.error("csp: " + p.join("; ").replace("node scripts/app-files.js", "node scripts/csp.js")); process.exit(1); }
    console.log("csp: script hashes are current");
  } else {
    const built = AF.build();   // src/ -> bundle/ first, so the ?v= hashes below are the new files'
    if (built.length) console.log("csp: built bundle/" + built.join(", bundle/"));
    const out = apply(AF.stamp(html));
    if (out === html) console.log("csp: already current");
    else { fs.writeFileSync(file, out); console.log("csp: updated index.html"); }
  }
}
