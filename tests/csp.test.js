// Content-Security-Policy and site-layout checks.
// Run: node tests/csp.test.js
// Covers: the page's inline scripts are allowed by hash (not 'unsafe-inline') and the hashes in index.html are current; the policy keeps the
// other restrictions; the deployable site/ layout resolves every path the manifests and the service worker name.
const fs = require("fs"), path = require("path"), assert = require("assert"), crypto = require("crypto"), {execFileSync} = require("child_process");
const ROOT = path.join(__dirname, ".."), csp = require("../scripts/csp");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };

const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const first = scripts[0];
ok(/cm\.httpEquiv="Content-Security-Policy"/.test(first), "the first inline script installs the policy");
ok(!csp.stale(html), "script hashes in index.html are current (run `node scripts/csp.js` after editing an inline script)");
const H = (first.match(/\/\*CSP-HASHES\*\/"([^"]*)"/) || [])[1] || "";
const want = scripts.slice(1).map(s => "'sha256-" + crypto.createHash("sha256").update(s, "utf8").digest("base64") + "'");
ok(H === want.join(" "), `every inline script after the injector is hashed (${want.length})`);
ok(/script-src 'self' "\+\(lax\?"'unsafe-inline'":H\)\+"/.test(first), "script-src uses the hashes; 'unsafe-inline' only in Claude's artifact preview");
ok(/lax=!H\|\|\/\(\^\|\\\.\)claudeusercontent\\\.com\$\/\.test\(location\.hostname\)/.test(first), "the lax case is limited to *.claudeusercontent.com (or no hashes at all)");
ok(!/cdn\.jsdelivr\.net/.test(first), "no CDN in the page's script-src (supabase-js is served from vendor/)");
for (const d of ["object-src 'none'", "frame-src 'none'", "base-uri 'self'", "form-action 'self'", "default-src 'self'"]) ok(first.includes(d), "policy keeps " + d);
ok(!/\son[a-z]+\s*=\s*["']/i.test(html.replace(/<script>[\s\S]*?<\/script>/g, "")), "no inline event handler attributes in the page markup (they would be blocked)");

// apply() is idempotent and updates a changed script.
ok(csp.apply(html) === html, "apply() leaves a current page unchanged");
const edited = html.replace("<script>try{var ts=", "<script>/*x*/try{var ts=");
ok(csp.stale(edited) && !csp.stale(csp.apply(edited)), "apply() refreshes the hashes after a script changes");

// The deployable site layout.
const out = execFileSync(process.execPath, [path.join(ROOT, "scripts", "build-site.js"), "--check"], {encoding: "utf8"});
ok(/every manifest and service-worker path resolves/.test(out), "site/ layout: every manifest and service-worker path resolves");

console.log(`\ncsp: ${n} checks passed`);
