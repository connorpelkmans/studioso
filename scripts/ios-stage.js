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

// Swift files dragged into Xcode with "Copy items if needed" are copies, so later fixes to ios-wrapper/native/ would never
// reach the app. Any of them found in the Xcode project are refreshed here (files you haven't added are left out).
{
  const proj = path.join(wrap, "ios", "App");
  if (fs.existsSync(proj)) {
    const srcs = [], walk = (d, out, skip) => { for (const f of fs.readdirSync(d, {withFileTypes: true})) { const p = path.join(d, f.name); if (f.isDirectory()) { if (!skip || !/^(Pods|build|DerivedData|node_modules|public)$/.test(f.name)) walk(p, out, skip); } else if (f.name.endsWith(".swift")) out.push(p); } };
    walk(path.join(wrap, "native"), srcs, false);
    const inProj = []; walk(proj, inProj, true);
    const done = [];
    for (const src of srcs) {
      const name = path.basename(src), text = fs.readFileSync(src, "utf8");
      for (const dst of inProj.filter(p => path.basename(p) === name)) {
        if (fs.readFileSync(dst, "utf8") !== text) { fs.writeFileSync(dst, text); done.push(path.relative(wrap, dst)); }
      }
    }
    // and any of them the Xcode project lists but that's missing from disk is put back where Xcode looks for it
    const pbx = path.join(proj, "App.xcodeproj", "project.pbxproj"), txt = fs.existsSync(pbx) ? fs.readFileSync(pbx, "utf8") : "";
    for (const src of srcs) {
      const name = path.basename(src), esc = name.replace(/[.]/g, "\\.");
      if (!new RegExp("path = \"?" + esc + "\"?;").test(txt)) continue;
      // the widget file belongs in the widget's own folder even when a copy sits elsewhere (Xcode shows it red otherwise)
      const wdir = path.join(proj, "StudyboardWidgets");
      if (name === "StudyboardWidgets.swift" && fs.existsSync(wdir) && !fs.existsSync(path.join(wdir, name))) {
        fs.copyFileSync(src, path.join(wdir, name)); done.push(path.relative(wrap, path.join(wdir, name)) + " (was missing)"); continue;
      }
      if (inProj.some(p => path.basename(p) === name)) continue;
      // put back where Xcode may look for it: the App folder, and the widget's own folder for the widget file
      for (const dir of name === "StudyboardWidgets.swift" ? ["App", "StudyboardWidgets"] : ["App"]) {
        const dst = path.join(proj, dir, name);
        fs.mkdirSync(path.dirname(dst), {recursive: true}); fs.copyFileSync(src, dst); done.push(path.relative(wrap, dst) + " (was missing)");
      }
    }
    if (done.length) console.log("ios-stage: updated in the Xcode project: " + done.join(", "));
  }
}

// So the same command works from inside ios-wrapper too (where Xcode is opened from), it gets a matching shortcut there
{
  const pj = path.join(wrap, "package.json");
  try {
    if (fs.existsSync(pj)) {
      const j = JSON.parse(fs.readFileSync(pj, "utf8"));
      j.scripts = j.scripts || {};
      if (j.scripts["ios:stage"] !== "cd .. && npm run ios:stage") { j.scripts["ios:stage"] = "cd .. && npm run ios:stage"; fs.writeFileSync(pj, JSON.stringify(j, null, 2) + "\n"); console.log("ios-stage: npm run ios:stage now also works from inside ios-wrapper"); }
    }
  } catch (e) {}
}

// The Dynamic Island widget's Info.plist: if the Xcode project uses one that isn't on disk (it goes missing when the
// files Xcode generated for the widget are deleted), it's recreated with what a widget needs
{
  const pbx = path.join(wrap, "ios", "App", "App.xcodeproj", "project.pbxproj");
  try {
    const txt = fs.existsSync(pbx) ? fs.readFileSync(pbx, "utf8") : "";
    const want = [...new Set([...txt.matchAll(/INFOPLIST_FILE = "?([^";]*StudyboardWidgets[^";]*Info\.plist)"?;/g)].map(m => m[1]))];
    for (const rel of want) {
      const f = path.join(wrap, "ios", "App", rel);
      if (fs.existsSync(f)) continue;
      fs.mkdirSync(path.dirname(f), {recursive: true});
      fs.writeFileSync(f, `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n\t<key>NSExtension</key>\n\t<dict>\n\t\t<key>NSExtensionPointIdentifier</key>\n\t\t<string>com.apple.widgetkit-extension</string>\n\t</dict>\n</dict>\n</plist>\n`);
      console.log("ios-stage: recreated the widget's " + path.join("ios", "App", rel));
    }
  } catch (e) {}
}

const cli = path.join(wrap, "node_modules", "@capacitor", "cli");
if (fs.existsSync(path.join(wrap, "ios")) && fs.existsSync(cli)) {
  execFileSync(process.platform === "win32" ? "npx.cmd" : "npx", ["cap", "sync", "ios"], {cwd: wrap, stdio: "inherit"});
  // Studyboard's own plugins are connected the same way Capacitor connects its plugins (its plugin list), for each one whose
  // file is in the Xcode project, so they work without depending on the storyboard's class setting
  try {
    const cfg = path.join(wrap, "ios", "App", "App", "capacitor.config.json"), pbx = path.join(wrap, "ios", "App", "App.xcodeproj", "project.pbxproj");
    const txt = fs.existsSync(pbx) ? fs.readFileSync(pbx, "utf8") : "";
    const ours = [["StudyboardFocusActivityPlugin.swift", "StudyboardFocusActivityPlugin"], ["StudyboardLms.swift", "StudyboardLmsPlugin"], ["StudyboardPlugins.swift", "StudyboardCaptureTokenPlugin"], ["StudyboardPlugins.swift", "StudyboardSharedQueuePlugin"]]
      .filter(([f]) => txt.includes(f)).map(([, c]) => c);
    if (ours.length && fs.existsSync(cfg)) {
      const j = JSON.parse(fs.readFileSync(cfg, "utf8")); const list = Array.isArray(j.packageClassList) ? j.packageClassList : [];
      const add = ours.filter(c => !list.includes(c));
      if (add.length) { j.packageClassList = list.concat(add); fs.writeFileSync(cfg, JSON.stringify(j, null, "\t") + "\n"); console.log("ios-stage: connected " + add.join(", ")); }
    }
  } catch (e) { console.log("ios-stage: couldn't add Studyboard's plugins to the plugin list: " + e.message); }
  console.log("ios-stage: synced into the Xcode project. Open it with: cd ios-wrapper && npx cap open ios");
} else console.log("ios-stage: no Xcode project yet (ios-wrapper/ios/) or Capacitor not installed there: see TESTING-MAC-IPHONE.md, iPhone step 2.");

