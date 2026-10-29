#!/usr/bin/env node
// Fills in your Apple details everywhere they're needed for the Mac App Store and iPhone builds, in one step.
//
//   node scripts/apple-setup.js --team ABCDE12345 --domain studyboardapp.com [--revenuecat appl_xxxxxxxx]
//
// --team        your 10-character Apple Team ID (developer.apple.com > Account > Membership details)
// --domain      the website the app's links open (universal links), without https://
// --revenuecat  optional: RevenueCat's public Apple SDK key (starts appl_), for buying Pro in the iPhone app
//
// It changes: package.json (ElectronTeamID for mac, mas, masDev), build-resources/entitlements.mas*.plist (App Group),
// ios-wrapper/App.entitlements.template.plist (associated domain), ios-wrapper/native-bridge.js (RevenueCat key),
// and writes .well-known/apple-app-site-association (served by the website) plus its header in _headers.
// Safe to run again with new values. Check the result with: npm run check:store
"use strict";
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const arg = k => { const i = process.argv.indexOf("--" + k); return i > 0 ? String(process.argv[i + 1] || "").trim() : ""; };
const team = arg("team").toUpperCase(), domain = arg("domain").replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase(), rc = arg("revenuecat");
const fail = m => { console.error("apple-setup: " + m); process.exit(1); };
if (!/^[A-Z0-9]{10}$/.test(team)) fail("--team must be your 10-character Apple Team ID, like ABCDE12345");
if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain)) fail("--domain must be a plain domain, like studyboardapp.com");
if (rc && !/^appl_[A-Za-z0-9]{10,64}$/.test(rc)) fail("--revenuecat must be RevenueCat's public Apple key (starts with appl_)");

const done = [];
const edit = (rel, fn) => {
  const f = path.join(root, rel), before = fs.readFileSync(f, "utf8"), after = fn(before);
  if (after !== before) { fs.writeFileSync(f, after); done.push(rel); }
};

// 1. package.json: the Team ID electron-builder stamps into the Mac app
edit("package.json", s => {
  const j = JSON.parse(s), b = j.build || {};
  for (const k of ["mac", "mas", "masDev"]) if (b[k]) { b[k].extendInfo = Object.assign({}, b[k].extendInfo, {ElectronTeamID: team}); }
  return JSON.stringify(j, null, 2) + "\n";
});
// 2. Mac App Store entitlements: the App Group is prefixed with the Team ID
for (const rel of ["build-resources/entitlements.mas.plist", "build-resources/entitlements.mas-dev.plist"])
  edit(rel, s => s.replace(/<string>(?:TEAM_ID|[A-Z0-9]{10})\.com\.studioso\.app<\/string>/g, `<string>${team}.com.studioso.app</string>`));
// 3. iPhone entitlements template: universal links for the domain
edit("ios-wrapper/App.entitlements.template.plist", s => s.replace(/applinks:[^<]+/g, "applinks:" + domain));
// 4. RevenueCat public key for in-app purchases
if (rc) edit("ios-wrapper/native-bridge.js", s => s.replace(/ios: "appl_[^"]*"/, `ios: "${rc}"`));
// 5. Universal links file, served by the website at /.well-known/apple-app-site-association
{
  const tpl = JSON.parse(fs.readFileSync(path.join(root, "ios-wrapper/apple-app-site-association.template.json"), "utf8"));
  tpl.applinks.details.forEach(d => { d.appIDs = [team + ".com.studioso.app"]; });
  const dir = path.join(root, ".well-known"), f = path.join(dir, "apple-app-site-association");
  fs.mkdirSync(dir, {recursive: true});
  const out = JSON.stringify(tpl, null, 2) + "\n";
  if (!fs.existsSync(f) || fs.readFileSync(f, "utf8") !== out) { fs.writeFileSync(f, out); done.push(".well-known/apple-app-site-association"); }
}
// 6. Serve it as JSON, never cached for long (Apple's CDN fetches it)
edit("_headers", s => s.includes("/.well-known/apple-app-site-association") ? s : s.replace(/\s*$/, "\n\n# Universal links for the iPhone app (scripts/apple-setup.js)\n/.well-known/apple-app-site-association\n  Content-Type: application/json\n  Cache-Control: max-age=3600\n"));

console.log(done.length ? "apple-setup: updated\n  " + done.join("\n  ") : "apple-setup: everything already set");
const rcSet = /ios: "appl_(?!REPLACE)[A-Za-z0-9]{10,64}"/.test(fs.readFileSync(path.join(root, "ios-wrapper/native-bridge.js"), "utf8"));
console.log(`Team ID ${team}, domain ${domain}, RevenueCat key ${rcSet ? "set" : "not set yet (buying Pro stays hidden in the iPhone app until you add it with --revenuecat)"}.`);
console.log("Next: put the Mac provisioning profiles in build-resources/ (Studyboard_MAS.provisionprofile, Studyboard_MASDev.provisionprofile), then run: npm run check:store");
