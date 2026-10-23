#!/usr/bin/env node
// Keeps the page's Content-Security-Policy strict
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");

const MARK = "/*CSP-HASHES*/";
// The browser turns every CRLF (and lone CR) into LF before it hashes a script
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
  // index.html loads the app's code and styles from bundle/
  const AF = require("./app-files");
  const file = path.join(__dirname, "..", "index.html");
  const html = fs.readFileSync(file, "utf8");
  if (process.argv.includes("--check")) {
    if (stale(html)) { console.error("csp: index.html's script hashes are stale. Run: node scripts/csp.js"); process.exit(1); }
    const p = AF.problems(html); if (p.length) { console.error("csp: " + p.join("; ").replace("node scripts/app-files.js", "node scripts/csp.js")); process.exit(1); }
    console.log("csp: script hashes are current");
  } else {
    const built = AF.build();
    if (built.length) console.log("csp: built bundle/" + built.join(", bundle/"));
    const out = apply(AF.stamp(html));
    if (out === html) console.log("csp: already current");
    else { fs.writeFileSync(file, out); console.log("csp: updated index.html"); }
  }
}
