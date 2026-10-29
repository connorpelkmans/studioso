#!/usr/bin/env node
// Stages the iPhone/iPad app's web files in one step
"use strict";
const fs = require("fs"), path = require("path"), {execFileSync} = require("child_process"), {mergePlist} = require("./plist-merge");
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

// The app's Info.plist needs the keys in Info.plist.additions.plist. Without the camera, photo and microphone reasons,
// iOS closes the app the moment it opens the camera ("Take Photo"), so they're merged in here rather than left to a
// manual step. Keys already in the Info.plist are left as they are.
const plistFile = path.join(wrap, "ios", "App", "App", "Info.plist");
if (fs.existsSync(plistFile)) {
  const add = mergePlist(fs.readFileSync(plistFile, "utf8"), fs.readFileSync(path.join(wrap, "Info.plist.additions.plist"), "utf8"));
  if (add.added.length) { fs.writeFileSync(plistFile, add.text); console.log("ios-stage: added to Info.plist: " + add.added.join(", ")); }
  else console.log("ios-stage: Info.plist already has the camera, photo and other keys it needs");
}

// Plugins the page relies on that an older setup may not have installed yet: installed here, so the app gets them with
// the next sync (keyboard: the app fits above the keyboard instead of iOS sliding the page; screen orientation: upright
// except full-screen boards)
{
  const need = ["@capacitor/keyboard", "@capacitor/screen-orientation"].filter(m => fs.existsSync(path.join(wrap, "node_modules")) && !fs.existsSync(path.join(wrap, "node_modules", m)));
  if (need.length) {
    console.log("ios-stage: installing " + need.join(", ") + " in ios-wrapper");
    // the plugins' major version has to match the project's Capacitor, or npm refuses
    let major = ""; try { major = String(JSON.parse(fs.readFileSync(path.join(wrap, "node_modules", "@capacitor", "core", "package.json"), "utf8")).version || "").split(".")[0]; } catch (e) {}
    const pkgs = need.map(m => /^\d+$/.test(major) ? `${m}@^${major}` : m);
    try { execFileSync(process.platform === "win32" ? "npm.cmd" : "npm", ["install", ...pkgs], {cwd: wrap, stdio: "inherit"}); }
    catch (e) { console.log("ios-stage: couldn't install them. Run this, then npm run ios:stage again:\n  cd ios-wrapper && npm i " + pkgs.join(" ") + " && cd .."); }
  }
}

const cli = path.join(wrap, "node_modules", "@capacitor", "cli");
if (fs.existsSync(path.join(wrap, "ios")) && fs.existsSync(cli)) {
  execFileSync(process.platform === "win32" ? "npx.cmd" : "npx", ["cap", "sync", "ios"], {cwd: wrap, stdio: "inherit"});
  console.log("ios-stage: synced into the Xcode project. Open it with: cd ios-wrapper && npx cap open ios");
} else console.log("ios-stage: no Xcode project yet (ios-wrapper/ios/) or Capacitor not installed there: see TESTING-MAC-IPHONE.md, iPhone step 2.");

