// No secret key in the repository or in anything that ships to people (web app, desktop app, phone apps, extension).
// Only the Supabase publishable key may appear; Stripe, OpenAI, Anthropic, Resend and service-role keys live in
// Supabase Edge Function secrets and Cloudflare Worker secrets.
const fs = require("fs"), path = require("path"), assert = require("assert"), {execFileSync} = require("child_process");
const ROOT = path.join(__dirname, ".."), S = require("../scripts/check-secrets");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };

// The scanner catches each kind of key. The fakes are put together at run time so this file doesn't hold one.
const j = (...p) => p.join("");
const fakes = {
  "Stripe secret key": j("sk_", "live_", "51Habc", "DEFghiJKLmnoPQR"),
  "Stripe restricted key": j("rk_", "live_", "51Habc", "DEFghiJKLmnoPQR"),
  "Stripe webhook secret": j("whs", "ec_", "a".repeat(32)),
  "Anthropic API key": j("sk-", "ant-api03-", "x".repeat(40)),
  "OpenAI project key": j("sk-", "proj-", "y".repeat(60)),
  "OpenAI API key (legacy)": j("sk-", "Z".repeat(48)),
  "Resend API key": j("re", "_", "AbCd1234", "_", "e".repeat(24)),
  "Google API key": j("AI", "za", "S", "b".repeat(34)),
  "Supabase secret key": j("sb_", "secret_", "c".repeat(30)),
  "private key": j("-----BEGIN ", "PRIVATE KEY-----"),
};
for (const [what, key] of Object.entries(fakes)) ok(S.scanText(`const k = "${key}";`).some(h => h.what === what), "finds a " + what);
const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url");
ok(S.scanText(j("eyJhbGciOiJIUzI1NiJ9.", b64({role: "service_role", iss: "supabase"}), ".", "s".repeat(43))).length === 1, "finds a Supabase service_role JWT");
ok(S.scanText(j("eyJhbGciOiJIUzI1NiJ9.", b64({role: "anon", iss: "supabase"}), ".", "s".repeat(43))).length === 0, "the anon JWT key is allowed");
ok(S.scanText('SUPABASE_ANON_KEY: "sb_publishable_hoKTO5FRblXqHs6MvO686Q_81c5_gvd"').length === 0, "the Supabase publishable key is allowed");
ok(S.scanText('if (/^sb_secret_/i.test(key)) refuse(); if (/^sk-ant-/.test(k)) x(); const KEY_RE = /^sk-[\\w-]{20,300}$/;').length === 0,
  "code that checks a key's prefix (to refuse a pasted secret key) isn't a key");
for (const f of [".env", ".env.production", "app/.dev.vars", "site/server.json", "x/AuthKey_ABC.p8", "x/key.pem", "android-www/keystore.properties"])
  ok(S.BAD_NAMES.test(f), f + " is never allowed in a shipped folder");

// Every committed file (test fixtures and docs aside) is free of keys: a real key committed anywhere fails CI
const tracked = execFileSync("git", ["ls-files", "-z"], {cwd: ROOT}).toString().split("\0").filter(Boolean)
  .filter(f => !/^tests\//.test(f) && !/^supabase-functions\/tools\/test-/.test(f) && !/\.md$/i.test(f))
  .filter(f => !/\.(png|jpe?g|gif|webp|ico|icns|bmp|woff2?|ttf|otf|mp3|mp4|wav|webm|ogg|pdf|zip|wasm)$/i.test(f));
const leaks = [];
for (const f of tracked) {
  const p = path.join(ROOT, f); if (!fs.existsSync(p) || fs.statSync(p).size > 50 * 1024 * 1024) continue;
  for (const h of S.scanText(fs.readFileSync(p, "utf8"))) leaks.push(`${f}: ${h.what} (${h.sample})`);
}
ok(!leaks.length, `no secret key in the ${tracked.length} committed source files` + (leaks.length ? "\n  " + leaks.join("\n  ") : ""));
ok(!tracked.some(f => S.BAD_NAMES.test(f)), "no .env, .dev.vars, server.json or key file is committed");

// The .env-style files stay out of git
const gi = fs.readFileSync(path.join(ROOT, ".gitignore"), "utf8").split(/\r?\n/);
for (const g of [".env", ".env.*", ".dev.vars", "server.json", "*.pem", "*.p8"]) ok(gi.includes(g), ".gitignore keeps out " + g);

// The web app is built from a fixed list of files, so a stray .env next to index.html can't be uploaded, and the build
// itself runs the scan (it stops before writing site/ when a key turns up)
const build = fs.readFileSync(path.join(ROOT, "scripts", "build-site.js"), "utf8");
ok(/const TOP = \[/.test(build) && !/cpSync\(ROOT\b/.test(build), "build-site copies named files and folders, never the whole repository");
ok(/check-secrets"\)\.assertClean\(\[OUT\]/.test(build), "build-site scans site/ for keys");
ok(/check-secrets\.js/.test(fs.readFileSync(path.join(ROOT, "prepare.js"), "utf8")), "prepare (desktop and phone apps) scans its output for keys");
ok(/check-secrets"\)\.scanText/.test(fs.readFileSync(path.join(ROOT, "scripts", "build-extension.js"), "utf8")), "the extension build scans its files for keys");
execFileSync(process.execPath, [path.join(ROOT, "scripts", "build-site.js"), "--check"], {cwd: ROOT, stdio: "pipe"});
ok(true, "a fresh web app build has no secret key in it");

// Workers: only publishable values in plain "vars" (those are visible in the dashboard and the repository)
for (const w of ["wrangler.jsonc", ...fs.readdirSync(path.join(ROOT, "cloudflare")).map(d => `cloudflare/${d}/wrangler.jsonc`)]) {
  const p = path.join(ROOT, w); if (!fs.existsSync(p)) continue;
  const vars = (fs.readFileSync(p, "utf8").match(/"vars"\s*:\s*\{([\s\S]*?)\n\s*\}/) || [])[1] || "";
  const names = [...vars.matchAll(/"([A-Z0-9_]+)"\s*:/g)].map(m => m[1]);
  ok(!names.some(k => /SECRET|PRIVATE|PASSWORD|TOKEN|SERVICE_ROLE|STRIPE|OPENAI|ANTHROPIC|RESEND/.test(k)), w + ": no secret in plain vars (" + (names.join(", ") || "none") + ")");
}

console.log(`\n${n} checks passed`);
