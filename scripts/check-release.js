#!/usr/bin/env node
// Release gate: fails while anything that ships still holds an owner placeholder (YOUR-DOMAIN, REPLACE_WITH_..., studyboard.example, ...).
// The store-readiness test checks the wording is right; this checks the blanks have been filled in. Run it before every store or web release.
//
//   node scripts/check-release.js              every target
//   node scripts/check-release.js web desktop  only these (web, desktop, ios, android)
//
// Exit code 0 = nothing left to fill in for the chosen targets; 1 = placeholders listed with file:line.
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");

const COMMON = [
  /YOUR-DOMAIN/, /YOUR-PROJECT/, /YOUR-ANON-OR-PUBLISHABLE-KEY/, /YOUR-APP-ADDRESS/, /YOUR NAME OR COMPANY/, /YOUR EMAIL PROVIDER/,
  /YOUR REGION/, /YOUR COUNTRY OR STATE/, /REPLACE_WITH_[A-Z0-9_]+/, /studyboard\.example/,
];
// Files that ship, per target. Docs and tests are not checked (they explain the placeholders on purpose).
const TARGETS = {
  web: {files: ["index.html", "website/config.js", "website/index.html", "website/privacy.html", "website/terms.html", "website/account/index.html",
    "website/success.html", "website/cancel.html", "website/assets/site.js", "manifest.webmanifest", "today.webmanifest"],
    extra: [[/<strong>Owner:<\/strong>/, "the Owner note at the top of the legal page (remove it once the text has been reviewed)"]]},
  desktop: {files: ["index.html", "package.json", "build-resources/entitlements.mas.plist", "build-resources/entitlements.mas-dev.plist",
    "build-resources/entitlements.mas.inherit.plist"], extra: [[/\bTEAM_ID\b/, "Apple Team ID"]],
    need: ["build-resources/Studyboard_MAS.provisionprofile"]},
  ios: {files: ["index.html", "ios-wrapper/native-bridge.js", "ios-wrapper/App.entitlements.template.plist", "ios-wrapper/apple-app-site-association.template.json",
    "ios-wrapper/capacitor.config.json"], extra: [[/\bTEAMID\b/, "Apple Team ID"], [/appl_REPLACE/, "RevenueCat Apple key"]]},
  android: {files: ["index.html", "ios-wrapper/native-bridge.js", "android-wrapper/app/src/main/AndroidManifest.additions.xml", "android-wrapper/build.gradle.additions.txt",
    "android-wrapper/assetlinks.template.json"], extra: [[/VERIFY_VERSION/, "dependency version"], [/goog_REPLACE/, "RevenueCat Google key"], [/REPLACE_WITH_SHA256/, "signing certificate fingerprint"]]},
};

const want = process.argv.slice(2).filter(a => !a.startsWith("-"));
const bad = want.filter(t => !TARGETS[t]);
if (bad.length) { console.error("Unknown target(s): " + bad.join(", ") + ". Use: " + Object.keys(TARGETS).join(", ")); process.exit(2); }
const chosen = want.length ? want : Object.keys(TARGETS);

const seen = new Set(), problems = [];
for (const t of chosen) {
  const T = TARGETS[t];
  for (const rel of T.need || []) if (!fs.existsSync(path.join(ROOT, rel))) problems.push(`[${t}] ${rel}: missing (needed to build this target)`);
  for (const rel of T.files) {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) continue;
    const lines = fs.readFileSync(file, "utf8").split("\n");
    const pats = COMMON.map(re => [re, null]).concat(T.extra || []);
    lines.forEach((line, i) => {
      for (const [re, why] of pats) {
        const m = line.match(re); if (!m) continue;
        const key = `${rel}:${i + 1}:${m[0]}`; if (seen.has(key)) continue; seen.add(key);
        problems.push(`[${t}] ${rel}:${i + 1}: ${m[0]}${why ? ` (${why})` : ""}`);
      }
    });
  }
}
if (!problems.length) { console.log(`check-release: nothing left to fill in for ${chosen.join(", ")}`); process.exit(0); }
console.log(problems.join("\n"));
console.log(`\ncheck-release: ${problems.length} placeholder(s) left for ${chosen.join(", ")}. Fill them in (see SETUP-GUIDE.md and APP-STORE-CHECKLIST.md) before releasing.`);
process.exit(1);
