// Background App Refresh for the widgets (MainViewController.swift, StudyboardBackgroundRefresh): iOS only runs the task if it
// was registered before the app finished launching, so AppDelegate.swift's didFinishLaunchingWithOptions calls register().
// npm run ios:stage adds that one line (only when MainViewController.swift, which holds it, is in the Xcode project).
"use strict";
const fs = require("fs"), path = require("path");
const LINE = "StudyboardBackgroundRefresh.register()";

// AppDelegate.swift's text with the line added first thing in didFinishLaunchingWithOptions; null if that function isn't there
function patchAppDelegate(text){
  if (text.includes(LINE)) return text;
  const m = /func\s+application\s*\(\s*_\s+application\s*:\s*UIApplication\s*,\s*didFinishLaunchingWithOptions[^{]*\{[^\n]*\n/.exec(text);
  if (!m) return null;
  const at = m.index + m[0].length;
  const indent = (/^([ \t]*)\S/m.exec(text.slice(at)) || [null, "        "])[1] || "        ";
  return text.slice(0, at) + indent + "// Background App Refresh keeps the widgets up to date (MainViewController.swift)\n" + indent + LINE + "\n" + text.slice(at);
}

function setupBackgroundRefresh(wrap, log){
  log = log || (m => console.log("ios-stage: " + m));
  const app = path.join(wrap, "ios", "App"), pbx = path.join(app, "App.xcodeproj", "project.pbxproj"), del = path.join(app, "App", "AppDelegate.swift");
  if (!fs.existsSync(pbx) || !fs.existsSync(del)) return {ok: false};
  if (!fs.readFileSync(pbx, "utf8").includes("MainViewController.swift")) { log("widgets: Background App Refresh is off: MainViewController.swift isn't in the Xcode project"); return {ok: false}; }
  const t = fs.readFileSync(del, "utf8"), v = patchAppDelegate(t);
  if (v === null) { log("widgets: couldn't find didFinishLaunchingWithOptions in AppDelegate.swift. Add this line at its start: " + LINE); return {ok: false}; }
  if (v !== t) { fs.writeFileSync(del, v); log("widgets: Background App Refresh turned on (AppDelegate.swift)"); }
  return {ok: true, changed: v !== t};
}

module.exports = {patchAppDelegate, setupBackgroundRefresh, LINE};
