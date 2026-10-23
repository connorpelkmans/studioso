#!/usr/bin/env node
// Stages the iPhone/iPad app's web files in one step (ios-wrapper/README-IOS.md sections 2 and 4 did this by hand):
//   1. node prepare.js into ios-www/ for capacitor://localhost/ (libraries and fonts bundled, no CDN)
//   2. copies ios-wrapper/native-bridge.js next to the page and loads it first (right after <head>), before the app's own script
//   3. copies ios-www/ into ios-wrapper/ios-www/ (Capacitor's webDir) and, when the Xcode project exists (ios-wrapper/ios/) and
//      Capacitor is installed there, runs `npx cap sync ios`.
// Run after every change to the app:   npm run ios:stage
"use strict";
const fs = require("fs"), path = require("path"), {execFileSync} = require("child_process");
const root = path.join(__dirname, ".."), www = path.join(root, "ios-www"), wrap = path.join(root, "ios-wrapper");

execFileSync(process.execPath, [path.join(root, "prepare.js")], {cwd: root, stdio: "inherit", env: Object.assign({}, process.env, {STUDYBOARD_OUT: "ios-www", STUDYBOARD_BASE: "capacitor://localhost/"})});

fs.copyFileSync(path.join(wrap, "native-bridge.js"), path.join(www, "native-bridge.js"));
const page = path.join(www, "index.html");
let html = fs.readFileSync(page, "utf8");
if (!html.includes('<script src="native-bridge.js"></script>')) {
  const at = html.indexOf("<head>");
  if (at < 0) throw new Error("ios-stage: no <head> in ios-www/index.html");
  html = html.slice(0, at + 6) + '\n<script src="native-bridge.js"></script>' + html.slice(at + 6);
  fs.writeFileSync(page, html);
}
const csp = (/<meta http-equiv="Content-Security-Policy" content="([^"]*)"/.exec(html) || [])[1] || "";
if (csp && !/script-src[^;]*'self'/.test(csp)) throw new Error("ios-stage: the page's CSP doesn't allow 'self' scripts, so native-bridge.js would be blocked");

const dest = path.join(wrap, "ios-www");
fs.rmSync(dest, {recursive: true, force: true});
fs.cpSync(www, dest, {recursive: true});
console.log("ios-stage: staged ios-wrapper/ios-www/ (with native-bridge.js)");

const cli = path.join(wrap, "node_modules", "@capacitor", "cli");
if (fs.existsSync(path.join(wrap, "ios")) && fs.existsSync(cli)) {
  execFileSync(process.platform === "win32" ? "npx.cmd" : "npx", ["cap", "sync", "ios"], {cwd: wrap, stdio: "inherit"});
  console.log("ios-stage: synced into the Xcode project. Open it with: cd ios-wrapper && npx cap open ios");
} else console.log("ios-stage: no Xcode project yet (ios-wrapper/ios/) or Capacitor not installed there: see TESTING-MAC-IPHONE.md, iPhone step 2.");
