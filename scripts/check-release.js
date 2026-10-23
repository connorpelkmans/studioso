#!/usr/bin/env node
// Release gate: fails while anything that ships still holds an owner placeholder
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");

const COMMON = [
  /YOUR-DOMAIN/, /YOUR-PROJECT/, /YOUR-ANON-OR-PUBLISHABLE-KEY/, /YOUR-APP-ADDRESS/, /YOUR NAME OR COMPANY/, /YOUR EMAIL PROVIDER/,
  /YOUR REGION/, /YOUR COUNTRY OR STATE/, /REPLACE_WITH_[A-Z0-9_]+/, /studyboard\.example/,
];
// Files that ship, per target
const TARGETS = {
  web: {files: ["index.html", "website/config.js", "website/index.html", "website/privacy.html", "website/terms.html", "website/account/index.html",
    "website/success.html", "website/cancel.html", "website/assets/site.js", "manifest.webmanifest", "today.webmanifest"],
    extra: [[/<strong>Owner:<\/strong>/, "the Owner note at the top of the legal page (remove it once the text has been reviewed)"]]},
  desktop: {files: ["index.html", "package.json", "build-resources/entitlements.mas.plist", "build-resources/entitlements.mas-dev.plist",
    "build-resources/entitlements.mas.inherit.plist"], extra: [[/\bTEAM_ID\b/, "Apple Team ID"]],
    need: ["build-resources/Studyboard_MAS.provisionprofile"]},
  // Microsoft Store
  msstore: {files: ["index.html", "build-resources/appx-extensions.xml", {file: "package.json", label: "package.json build.appx", pick: s => JSON.stringify(JSON.parse(s).build.appx, null, 2)}],
    need: ["build-resources/appx/StoreLogo.scale-100.png", "build-resources/appx/Square44x44Logo.scale-100.png", "build-resources/appx/Square150x150Logo.scale-100.png",
      "build-resources/appx/Wide310x150Logo.scale-100.png"]},
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
  // index.html stands for the whole app page
  const pageFiles = () => { try { return ["index.html"].concat(require("./app-files").srcFiles()); } catch (e) { return ["index.html"]; } };
  for (const entry of T.files.flatMap(e => e === "index.html" ? pageFiles() : [e])) {
    const rel = typeof entry === "string" ? entry : entry.label, file = path.join(ROOT, typeof entry === "string" ? entry : entry.file);
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    const lines = (typeof entry === "string" ? text : entry.pick(text)).split("\n");
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
