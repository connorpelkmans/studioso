#!/usr/bin/env node
// Fails when a secret key (or a secrets file) is in a folder that ships to people: the web app (site/), the desktop
// app (app/, widget/), the phone apps (ios-www/, android-www/) and the browser extension (extension/build/).
// Only publishable keys belong in those folders: the Supabase publishable/anon key and the website's own settings.
// Stripe, OpenAI, Anthropic, Resend, Google and service-role keys stay in Supabase/Cloudflare secrets, used by the
// Edge Functions and Workers, never in the files a browser downloads.
//
//   node scripts/check-secrets.js            scans every built folder that exists
//   node scripts/check-secrets.js site app   scans just these
// The build scripts (build-site.js, prepare.js, build-extension.js) run it on what they just wrote and stop on a hit.
"use strict";
const fs = require("fs"), path = require("path");

const ROOT = path.join(__dirname, "..");
const DEFAULT_DIRS = ["site", "app", "widget", "ios-www", "android-www", "extension/build"];

// Each pattern needs real key material after the prefix, so code that merely checks a prefix (the app refuses an
// sb_secret_ key someone pastes in) doesn't trip it.
const PATTERNS = [
  ["Stripe secret key", /\bsk_live_[0-9A-Za-z]{10,}/],
  ["Stripe test secret key", /\bsk_test_[0-9A-Za-z]{10,}/],
  ["Stripe restricted key", /\brk_(?:live|test)_[0-9A-Za-z]{10,}/],
  ["Stripe webhook secret", /\bwhsec_[0-9A-Za-z+/]{20,}/],
  ["Anthropic API key", /\bsk-ant-(?:api|admin)\d{2}-[A-Za-z0-9_-]{20,}/],
  ["OpenAI API key", /\bsk-(?:proj-|svcacct-|admin-)?[A-Za-z0-9_-]{20,}T3BlbkFJ[A-Za-z0-9_-]{20,}/],
  ["OpenAI API key (legacy)", /\bsk-[A-Za-z0-9]{48}\b/],
  ["OpenAI project key", /\bsk-(?:proj|svcacct|admin)-[A-Za-z0-9_-]{40,}/],
  ["Resend API key", /\bre_[A-Za-z0-9]{8}_[A-Za-z0-9]{20,}/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["Supabase secret key", /\bsb_secret_[A-Za-z0-9_-]{20,}/],
  ["GitHub token", /\b(?:ghp|gho|ghs|ghu|ghr)_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{40,}/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["Slack token", /\bxox[abpors]-[0-9A-Za-z-]{20,}/],
  ["Cloudflare API token", /\bCLOUDFLARE_API_TOKEN\s*[:=]\s*["']?[A-Za-z0-9_-]{30,}/],
  ["private key", /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/],
];
// Files that should never be in a shipped folder, whatever is in them
const BAD_NAMES = /(^|\/)(\.env(\..*)?|\.dev\.vars|server\.json|keystore\.properties|google-services\.json|.*\.(pem|key|p8|p12|pfx|jks|keystore|mobileprovision|provisionprofile))$/i;
const BINARY = /\.(png|jpe?g|gif|webp|ico|icns|bmp|woff2?|ttf|otf|mp3|mp4|wav|webm|ogg|pdf|zip|wasm)$/i;

// A Supabase legacy JWT key whose role is service_role (the anon one is fine)
function serviceRoleJwts(text) {
  const out = [];
  for (const m of text.matchAll(/eyJ[A-Za-z0-9_-]{10,}\.(eyJ[A-Za-z0-9_-]{10,})\.[A-Za-z0-9_-]{10,}/g)) {
    try { const p = JSON.parse(Buffer.from(m[1], "base64url").toString("utf8")); if (p && p.role === "service_role") out.push(m[0]); } catch (e) { /* not a JWT */ }
  }
  return out;
}

const mask = s => s.length <= 12 ? s.slice(0, 4) + "…" : s.slice(0, 10) + "…" + s.slice(-2);

function scanText(text) {
  const hits = [];
  for (const [what, re] of PATTERNS) { const m = re.exec(text); if (m) hits.push({ what, sample: mask(m[0]) }); }
  for (const j of serviceRoleJwts(text)) hits.push({ what: "Supabase service_role key", sample: mask(j) });
  return hits;
}

function walk(dir, fn) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules") walk(p, fn); }
    else if (e.isFile()) fn(p);
  }
}

// Returns the problems found in one folder (empty when it's clean or doesn't exist)
function scanDir(dir) {
  const abs = path.resolve(ROOT, dir), problems = [];
  if (!fs.existsSync(abs)) return problems;
  walk(abs, file => {
    const rel = path.relative(ROOT, file).split(path.sep).join("/");
    if (BAD_NAMES.test(rel)) problems.push({ file: rel, what: "secrets file that must never ship", sample: "" });
    if (BINARY.test(file) || fs.statSync(file).size > 50 * 1024 * 1024) return;
    for (const h of scanText(fs.readFileSync(file, "utf8"))) problems.push(Object.assign({ file: rel }, h));
  });
  return problems;
}

// For the build scripts: throws when anything turned up
function assertClean(dirs, who) {
  const problems = [].concat(...dirs.map(scanDir));
  if (!problems.length) return;
  const lines = problems.map(p => `  ${p.file}: ${p.what}${p.sample ? " (" + p.sample + ")" : ""}`);
  throw new Error(`${who || "check-secrets"}: a secret is in files that ship to people. Nothing was published.\n${lines.join("\n")}\n` +
    "Move the key into Supabase Edge Function secrets or a Cloudflare Worker secret, call it from there, and rotate the key " +
    "(it may already have been copied).");
}

module.exports = { scanText, scanDir, assertClean, PATTERNS, BAD_NAMES };

if (require.main === module) {
  const dirs = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_DIRS;
  try { assertClean(dirs); }
  catch (e) { console.error(e.message); process.exit(1); }
  console.log("check-secrets: no secret keys in " + dirs.filter(d => fs.existsSync(path.resolve(ROOT, d))).join(", "));
}
