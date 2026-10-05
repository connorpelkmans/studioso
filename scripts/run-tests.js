#!/usr/bin/env node
// Runs the Studyboard test files one after another, each in its own Node process with a timeout, and prints a summary table.
//   node scripts/run-tests.js                 unit tests (tests/*.test.js + the Edge Function checks)
//   node scripts/run-tests.js --e2e           unit tests + browser tests (tests/*.e2e.js, tests/avail-e2e.js, tests/e2e/*.e2e.js, tests/*.pw.js)
//   options: --no-unit (skip unit tests)  --no-slow (skip slow browser tests)  --only-slow  --only=<substr>[,<substr>]  --verbose (stream output)
//            --list (print the plan and exit)  --timeout-scale=<n> (multiply every timeout)
// Exit code 0 only when every selected file passes. Browser tests need Playwright + Chromium (see tests/pw.js).
"use strict";
const fs = require("fs"), path = require("path"), cp = require("child_process");

const root = path.join(__dirname, "..");
const args = process.argv.slice(2);
const flag = n => args.includes(n);
const opt = n => { const a = args.find(x => x.startsWith(n + "=")); return a ? a.slice(n.length + 1) : null; };
const known = new Set(["--e2e", "--no-unit", "--no-slow", "--only-slow", "--verbose", "-v", "--list"]);
for (const a of args) if (!known.has(a) && !/^--(only|timeout-scale)=/.test(a)) { console.error("unknown option " + a); process.exit(2); }

const E2E = flag("--e2e"), UNIT = !flag("--no-unit"), VERBOSE = flag("--verbose") || flag("-v");
const ONLY = (opt("--only") || "").split(",").filter(Boolean), SCALE = Number(opt("--timeout-scale") || 1);
const MIN = 60 * 1000;

// Per-file settings for browser tests. slow: excluded by --no-slow, run alone in CI. timeout in ms.
const SPECIAL = {
  "tests/mascot-bounds.pw.js": {slow: true, timeout: 25 * MIN},
  "tests/sync-two-device.e2e.js": {timeout: 8 * MIN},
  "tests/examprep.e2e.js": {timeout: 8 * MIN},
};

const ls = (dir, re) => { const d = path.join(root, dir); return fs.existsSync(d) ? fs.readdirSync(d).filter(f => re.test(f)).sort().map(f => path.posix.join(dir, f)) : []; };

const plan = [];
if (UNIT) {
  for (const f of ls("tests", /\.test\.js$/)) plan.push({file: f, kind: "unit", timeout: 2 * MIN});
  for (const f of ["supabase-functions/tools/test-functions.mjs", "supabase-functions/tools/test-capture.mjs"])
    if (fs.existsSync(path.join(root, f))) plan.push({file: f, kind: "unit", timeout: 2 * MIN, node: ["--experimental-strip-types", "--no-warnings"]});
}
if (E2E) {
  const browser = [...ls("tests", /\.e2e\.js$/), ...ls("tests", /^avail-e2e\.js$/), ...ls("tests/e2e", /\.e2e\.js$/), ...ls("tests", /\.pw\.js$/)];
  for (const f of browser) plan.push(Object.assign({file: f, kind: "e2e", timeout: 5 * MIN, slow: false}, SPECIAL[f] || {}));
}
let run = plan.filter(t => !ONLY.length || ONLY.some(s => t.file.includes(s)));
if (flag("--no-slow")) run = run.filter(t => !t.slow);
if (flag("--only-slow")) run = run.filter(t => t.slow);

if (flag("--list")) { for (const t of run) console.log(`${t.kind.padEnd(4)} ${String(Math.round(t.timeout * SCALE / 1000)).padStart(5)}s ${t.slow ? "slow " : "     "}${t.file}`); process.exit(0); }
if (!run.length) { console.error("no test files selected"); process.exit(2); }

function runOne(t) {
  return new Promise(resolve => {
    const start = Date.now(), timeout = t.timeout * SCALE;
    const child = cp.spawn(process.execPath, [...(t.node || []), t.file], {cwd: root, stdio: ["ignore", "pipe", "pipe"], detached: process.platform !== "win32"});
    let out = "", timedOut = false;
    const take = d => { out += d; if (out.length > 4e6) out = out.slice(-2e6); if (VERBOSE) process.stdout.write(d); };
    child.stdout.on("data", take); child.stderr.on("data", take);
    const kill = sig => { try { process.platform !== "win32" ? process.kill(-child.pid, sig) : child.kill(sig); } catch (e) { /* already gone */ } };
    const timer = setTimeout(() => { timedOut = true; kill("SIGTERM"); setTimeout(() => kill("SIGKILL"), 5000).unref(); }, timeout);
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      kill("SIGKILL"); // stray grandchildren (browsers, servers)
      resolve({t, ms: Date.now() - start, status: timedOut ? "TIMEOUT" : code === 0 ? "pass" : "FAIL", code: code == null ? signal : code, out});
    });
  });
}

const fmt = ms => ms < 1000 ? ms + "ms" : ms < 60000 ? (ms / 1000).toFixed(1) + "s" : Math.floor(ms / 60000) + "m" + String(Math.round(ms % 60000 / 1000)).padStart(2, "0") + "s";

(async () => {
  const results = [];
  console.log(`Running ${run.length} test file(s)${E2E ? " (including browser tests)" : ""}\n`);
  for (const t of run) {
    process.stdout.write(`> ${t.file}${VERBOSE ? "\n" : " ... "}`);
    const r = await runOne(t);
    results.push(r);
    console.log(`${VERBOSE ? "< " + t.file + " " : ""}${r.status} (${fmt(r.ms)})`);
    if (r.status !== "pass" && !VERBOSE) {
      const lines = r.out.trimEnd().split("\n");
      console.log(lines.slice(-60).map(l => "    | " + l).join("\n") + (r.status === "TIMEOUT" ? `\n    | (killed after ${fmt(t.timeout * SCALE)})` : ""));
    }
  }
  const w = Math.max(...results.map(r => r.t.file.length), 4);
  console.log("\n" + "file".padEnd(w) + "  status   time");
  console.log("-".repeat(w) + "  -------  --------");
  for (const r of results) console.log(r.t.file.padEnd(w) + "  " + r.status.padEnd(7) + "  " + fmt(r.ms));
  const bad = results.filter(r => r.status !== "pass");
  console.log(`\n${results.length - bad.length} passed, ${bad.length} failed` + (bad.length ? ": " + bad.map(r => r.t.file).join(", ") : ""));
  process.exit(bad.length ? 1 : 0);
})();
