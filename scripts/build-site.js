#!/usr/bin/env node
// Builds site/ — the folder you upload as the Studyboard web app (the PWA) — in the layout the manifests, the service worker and the
// notification code expect: icons in icons/, Today widget files in widgets/. The repository keeps them flat in the root, so serving the
// root as-is leaves one set of icon paths and every widget path missing (RELEASE-CHECKLIST.md, section 1).
//
//   node scripts/build-site.js            -> site/  (gitignored; delete and rebuild any time)
//   node scripts/build-site.js --check    -> builds into a temporary folder and exits non-zero if anything the manifests or sw.js name is missing
//
// What goes in: index.html, sw.js, both manifests, vendor/ (supabase-js, fonts, PDF.js), the icons, the widget files and the security headers
// (_headers with the page's inline scripts allowed by hash). Email templates, tools and desktop files stay out.
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const ROOT = path.join(__dirname, "..");
const check = process.argv.includes("--check");
const OUT = check ? fs.mkdtempSync(path.join(os.tmpdir(), "sbsite-")) : path.join(ROOT, "site");

const ICONS = ["icon-192.png", "icon-512.png", "maskable-192.png", "maskable-512.png", "apple-touch-icon.png",
  "shortcut-add.png", "shortcut-today.png", "shortcut-focus.png", "shortcut-search.png"];
const WIDGETS = ["today-data.json", "today-template.json", "today-screenshot.png"];
const TOP = ["index.html", "sw.js", "manifest.webmanifest", "today.webmanifest", "lms-grab.js"];

function copy(rel, to){
  const src = path.join(ROOT, rel), dst = path.join(OUT, to || rel);
  if (!fs.existsSync(src)) throw new Error("missing in the repository: " + rel);
  fs.mkdirSync(path.dirname(dst), {recursive: true});
  if (fs.statSync(src).isDirectory()) fs.cpSync(src, dst, {recursive: true});
  else fs.copyFileSync(src, dst);
}

if (!check && fs.existsSync(OUT)) fs.rmSync(OUT, {recursive: true, force: true});
fs.mkdirSync(OUT, {recursive: true});
TOP.forEach(f => copy(f));
copy("vendor");
// Icons go in icons/ and also stay next to index.html (the manifests list both, and old installs may still ask for the root copies).
ICONS.forEach(f => { copy(f, "icons/" + f); copy(f); });
WIDGETS.forEach(f => copy(f, "widgets/" + f));
// Fresh script hashes in the page's own policy, and the same strict script-src in the HTTP header (which also covers the policy script itself).
{
  const crypto = require("crypto"), file = path.join(OUT, "index.html");
  const html = require("./csp").apply(fs.readFileSync(file, "utf8"));
  fs.writeFileSync(file, html);
  const all = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => "'sha256-" + crypto.createHash("sha256").update(m[1], "utf8").digest("base64") + "'");
  const base = fs.readFileSync(path.join(ROOT, "_headers"), "utf8");
  const strict = base.replace(/script-src 'self' 'unsafe-inline'(?: https:\/\/cdn\.jsdelivr\.net)?/, "script-src 'self' " + all.join(" "));
  if (strict === base) throw new Error("build-site: couldn't find script-src in _headers");
  fs.writeFileSync(path.join(OUT, "_headers"), strict);
}

// Every local path the manifests and the service worker name must now exist.
const missing = [];
const local = u => typeof u === "string" && !/^[a-z]+:/i.test(u) && !u.startsWith("//") && u !== "url";
for (const m of ["manifest.webmanifest", "today.webmanifest"]) {
  const j = JSON.parse(fs.readFileSync(path.join(OUT, m), "utf8"));
  const walk = o => { if (Array.isArray(o)) return o.forEach(walk); if (!o || typeof o !== "object") return;
    for (const [k, v] of Object.entries(o)) { if ((k === "src" || k === "data" || k === "ms_ac_template") && local(v)) { const p = v.replace(/^\.\//, "").split(/[?#]/)[0]; if (p && !fs.existsSync(path.join(OUT, p))) missing.push(`${m}: ${v}`); } else walk(v); } };
  walk(j);
}
const sw = fs.readFileSync(path.join(OUT, "sw.js"), "utf8");
for (const m of sw.matchAll(/"\.\/((?:icons|widgets|vendor)\/[^"]+)"/g)) if (!fs.existsSync(path.join(OUT, m[1]))) missing.push("sw.js: ./" + m[1]);
for (const m of sw.matchAll(/sbwUrl\("([^"]+)"\)/g)) if (!fs.existsSync(path.join(OUT, m[1]))) missing.push("sw.js: " + m[1]);

if (check) fs.rmSync(OUT, {recursive: true, force: true});
if (missing.length) { console.error("build-site: missing files\n  " + missing.join("\n  ")); process.exit(1); }
console.log(check ? "build-site: every manifest and service-worker path resolves" : `build-site: wrote ${path.relative(ROOT, OUT)}/ (upload this folder)`);
