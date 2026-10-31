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
      // Xcode lists it with no folder (added to the project's top level): it looks right in ios/App, so a copy goes there too
      const top = path.join(proj, name);
      if (!fs.existsSync(top) && new RegExp("path = \"?" + esc + "\"?; sourceTree = \"<group>\"").test(txt)) {
        fs.copyFileSync(src, top); done.push(path.relative(wrap, top) + " (was missing)");
      }
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

// The App target's entitlements file (Sign in with Apple, push): if Xcode is set to use one that isn't on disk (it can go missing
// when files Xcode made are cleaned up), it's recreated with what the app uses. Xcode's automatic signing adds the matching
// capabilities to the App ID.
{
  const pbx = path.join(wrap, "ios", "App", "App.xcodeproj", "project.pbxproj");
  try {
    const txt = fs.existsSync(pbx) ? fs.readFileSync(pbx, "utf8") : "";
    const want = [...new Set([...txt.matchAll(/CODE_SIGN_ENTITLEMENTS = "?([^";]+\.entitlements)"?;/g)].map(m => m[1]))];
    const head = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n`;
    const group = `\t<key>com.apple.security.application-groups</key>\n\t<array>\n\t\t<string>group.com.studyboardapp.studyboard</string>\n\t</array>\n`;
    for (const rel of want) {
      const f = path.join(wrap, "ios", "App", rel);
      if (fs.existsSync(f)) continue;
      // the widget (and the share extension) only share the App Group; the app also has Sign in with Apple and push
      const ext = /Widget|Share/i.test(rel);
      const body = ext ? group : `\t<key>aps-environment</key>\n\t<string>development</string>\n\t<key>com.apple.developer.applesignin</key>\n\t<array>\n\t\t<string>Default</string>\n\t</array>\n` + group;
      fs.mkdirSync(path.dirname(f), {recursive: true});
      fs.writeFileSync(f, head + body + "</dict>\n</plist>\n");
      console.log("ios-stage: recreated " + path.join("ios", "App", rel) + (ext ? " (App Group)" : " (Sign in with Apple, push and the App Group)"));
    }
  } catch (e) {}
}

// The app's ID is com.studyboardapp.studyboard; extensions (the widget, the share extension) must start with it, so any still
// named after the old com.studioso.app are renamed in the Xcode project
{
  const pbx = path.join(wrap, "ios", "App", "App.xcodeproj", "project.pbxproj");
  try {
    if (fs.existsSync(pbx)) {
      const t = fs.readFileSync(pbx, "utf8");
      const u = t.replace(/(PRODUCT_BUNDLE_IDENTIFIER = "?)com\.studioso\.app(\.[A-Za-z0-9.-]+)?("?;)/g, (m, a, rest, b) => a + "com.studyboardapp.studyboard" + (rest || "") + b);
      if (u !== t) { fs.writeFileSync(pbx, u); console.log("ios-stage: bundle IDs now start with com.studyboardapp.studyboard (were com.studioso.app)"); }
    }
  } catch (e) {}
}

// The app icon: ios-wrapper/AppIcon-1024.png (square, no transparency, as the App Store needs; iOS rounds the corners) as
// Xcode's single-size AppIcon. Without this the build carries Capacitor's placeholder and App Store Connect shows no icon.
{
  const set = path.join(wrap, "ios", "App", "App", "Assets.xcassets", "AppIcon.appiconset"), src = path.join(wrap, "AppIcon-1024.png");
  try {
    if (fs.existsSync(path.dirname(set)) && fs.existsSync(src)) {
      fs.mkdirSync(set, {recursive: true});
      const dst = path.join(set, "AppIcon-1024.png"), buf = fs.readFileSync(src);
      const contents = JSON.stringify({images: [{filename: "AppIcon-1024.png", idiom: "universal", platform: "ios", size: "1024x1024"}], info: {author: "xcode", version: 1}}, null, 2) + "\n";
      const cj = path.join(set, "Contents.json");
      if (!fs.existsSync(dst) || !fs.readFileSync(dst).equals(buf) || !fs.existsSync(cj) || fs.readFileSync(cj, "utf8") !== contents) {
        for (const f of fs.readdirSync(set)) if (/\.png$/i.test(f) && f !== "AppIcon-1024.png") fs.rmSync(path.join(set, f));
        fs.writeFileSync(dst, buf); fs.writeFileSync(cj, contents);
        console.log("ios-stage: app icon installed (AppIcon, 1024 x 1024)");
      }
    }
  } catch (e) { console.log("ios-stage: couldn't install the app icon: " + e.message); }
}
// The privacy manifest Apple requires (build-resources/ios/PrivacyInfo.xcprivacy), next to the app's Info.plist. Xcode
// builds it in once it's in the App target (once: File > Add Files, tick App).
{
  const src = path.join(root, "build-resources", "ios", "PrivacyInfo.xcprivacy"), dst = path.join(wrap, "ios", "App", "App", "PrivacyInfo.xcprivacy");
  try {
    if (fs.existsSync(src) && fs.existsSync(path.dirname(dst)) && (!fs.existsSync(dst) || fs.readFileSync(dst, "utf8") !== fs.readFileSync(src, "utf8"))) {
      fs.copyFileSync(src, dst); console.log("ios-stage: privacy manifest copied to ios/App/App/PrivacyInfo.xcprivacy");
    }
    const pbx = path.join(wrap, "ios", "App", "App.xcodeproj", "project.pbxproj");
    if (fs.existsSync(pbx) && !/PrivacyInfo\.xcprivacy/.test(fs.readFileSync(pbx, "utf8")))
      console.log("ios-stage: in Xcode, add ios/App/App/PrivacyInfo.xcprivacy to the App target once (File > Add Files to \"App\", tick App)");
  } catch (e) {}
}

// Native parts that only work once their files are in the Xcode project (Xcode doesn't pick files up by itself): say which
// are missing, so a feature isn't silently off (school site sign-in, the Lock Screen timer)
{
  const pbx = path.join(wrap, "ios", "App", "App.xcodeproj", "project.pbxproj");
  try {
    const txt = fs.existsSync(pbx) ? fs.readFileSync(pbx, "utf8") : "";
    const need = [["StudyboardLms.swift", "school site sign-in"], ["StudyboardLmsScripts.swift", "school site sign-in"], ["StudyboardPlugins.swift", "quick capture and the share sheet"]]
      .filter(([f]) => txt && !txt.includes(f));
    if (need.length) {
      console.log("ios-stage: NOT IN THE XCODE PROJECT YET (so these are off in the app):");
      for (const [f, what] of need) console.log("  - ios-wrapper/native/" + f + " (" + what + ")");
      console.log("  Add them in Xcode: File > Add Files to \"App\", choose them in ios-wrapper/native, untick \"Copy items if needed\" (reference them in place), tick the App target, Add. Then run npm run ios:stage again.");
    }
  } catch (e) {}
}

// The app's name as people see it (Home Screen, permission and sign-in prompts): Studyboard, not Capacitor's starting "App"
{
  const plist = path.join(wrap, "ios", "App", "App", "Info.plist");
  try {
    if (fs.existsSync(plist)) {
      const t = fs.readFileSync(plist, "utf8");
      const u = t.replace(/(<key>CFBundleDisplayName<\/key>\s*<string>)(?:App|\$\(PRODUCT_NAME\))(<\/string>)/, "$1Studyboard$2");
      const v = /<key>CFBundleDisplayName<\/key>/.test(u) ? u : u.replace(/<dict>/, "<dict>\n\t<key>CFBundleDisplayName</key>\n\t<string>Studyboard</string>");
      if (v !== t) { fs.writeFileSync(plist, v); console.log("ios-stage: the app is named Studyboard (was App)"); }
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
    const ours = [["StudyboardFocusActivityPlugin.swift", "StudyboardFocusActivityPlugin"], ["StudyboardLms.swift", "StudyboardLmsPlugin"], ["StudyboardPlugins.swift", "StudyboardCaptureTokenPlugin"], ["StudyboardPlugins.swift", "StudyboardSharedQueuePlugin"], ["MainViewController.swift", "StudyboardSignInPlugin"], ["MainViewController.swift", "StudyboardStorePlugin"]]
      .filter(([f]) => txt.includes(f)).map(([, c]) => c);
    if (ours.length && fs.existsSync(cfg)) {
      const j = JSON.parse(fs.readFileSync(cfg, "utf8")); const list = Array.isArray(j.packageClassList) ? j.packageClassList : [];
      const add = ours.filter(c => !list.includes(c));
      if (add.length) { j.packageClassList = list.concat(add); fs.writeFileSync(cfg, JSON.stringify(j, null, "\t") + "\n"); console.log("ios-stage: connected " + add.join(", ")); }
    }
  } catch (e) { console.log("ios-stage: couldn't add Studyboard's plugins to the plugin list: " + e.message); }
  console.log("ios-stage: synced into the Xcode project. Open it with: cd ios-wrapper && npx cap open ios");
} else console.log("ios-stage: no Xcode project yet (ios-wrapper/ios/) or Capacitor not installed there: see TESTING-MAC-IPHONE.md, iPhone step 2.");

