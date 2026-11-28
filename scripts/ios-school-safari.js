// Signing in to schools that use Google, on iPhone (ios-wrapper/README-IOS.md, "Schools that sign in with Google"), put into
// the iPhone app's Xcode project: npm run ios:stage calls this. Run on its own:
//
//   node scripts/ios-school-safari.js      (the project at ios-wrapper/ios/App)
//
// What it does, and only where the pieces are there:
//  - SBSchoolHandoff.swift and StudyboardSchoolBackground.swift go into the App target whenever StudyboardLms.swift is in it
//    (StudyboardLms.swift needs them to build).
//  - With the Safari extension target added in Xcode (File > New > Target > Safari Extension, named StudyboardSafari), it gets
//    SBSchoolHandoff.swift and Studyboard's SafariWebExtensionHandler.swift, the App Group and keychain group it shares with the
//    app, and the SBKeychainAccessGroup key in its Info.plist. The extension's web files are ios-wrapper/ios-safari-extension/
//    (made by ios:stage from extension/src; a folder reference in the target, added once by hand).
"use strict";
const fs = require("fs"), path = require("path");

const GROUP_ID = "group.com.studyboardapp.studyboard";
const KEYCHAIN = "$(AppIdentifierPrefix)com.studyboardapp.studyboard.shared";
const SHARED = "SBSchoolHandoff.swift", HANDLER = "SafariWebExtensionHandler.swift", BACKGROUND = "StudyboardSchoolBackground.swift";
const APP_FILES = [SHARED, BACKGROUND];
const unq = s => String(s || "").replace(/^"|"$/g, "");

function setupSchoolSafari(wrap, log){
  log = log || (m => console.log("ios-school-safari: " + m));
  const appDir = path.join(wrap, "ios", "App"), pbxPath = path.join(appDir, "App.xcodeproj", "project.pbxproj"), src = path.join(wrap, "native", "SchoolSafari");
  if (!fs.existsSync(pbxPath)) { log("no Xcode project yet (ios/App/App.xcodeproj)"); return {ok: false}; }
  const xcode = require("xcode");
  const p = xcode.project(pbxPath); p.parseSync();
  const objs = p.hash.project.objects;
  const targets = Object.entries(objs.PBXNativeTarget || {}).filter(([k, v]) => !/_comment$/.test(k) && v && typeof v === "object");
  const appT = targets.find(([, t]) => unq(t.name) === "App");
  if (!appT) { log("couldn't find the App target"); return {ok: false}; }
  const refs = objs.PBXFileReference || {}, groups = objs.PBXGroup || {};
  const refOf = name => Object.keys(refs).find(k => !/_comment$/.test(k) && refs[k] && path.basename(unq(refs[k].path)) === name);
  const refsOf = name => Object.keys(refs).filter(k => !/_comment$/.test(k) && refs[k] && path.basename(unq(refs[k].path)) === name);
  const phaseOf = tKey => { const t = objs.PBXNativeTarget[tKey]; return (t.buildPhases || []).map(x => x.value).find(id => objs.PBXSourcesBuildPhase && objs.PBXSourcesBuildPhase[id]); };
  const inPhase = (tKey, refKey) => { const ph = objs.PBXSourcesBuildPhase[phaseOf(tKey)]; return !!ph && (ph.files || []).some(f => objs.PBXBuildFile[f.value] && objs.PBXBuildFile[f.value].fileRef === refKey); };
  const anyInPhase = (tKey, name) => refsOf(name).some(r => inPhase(tKey, r));
  const addToPhase = (tKey, refKey, name) => {
    const uuid = p.generateUuid(), phKey = phaseOf(tKey);
    if (!phKey) throw new Error("no Sources phase in target " + unq(objs.PBXNativeTarget[tKey].name));
    objs.PBXBuildFile[uuid] = {isa: "PBXBuildFile", fileRef: refKey, fileRef_comment: name};
    objs.PBXBuildFile[uuid + "_comment"] = name + " in Sources";
    objs.PBXSourcesBuildPhase[phKey].files.push({value: uuid, comment: name + " in Sources"});
  };
  const groupKeyByPath = want => Object.keys(groups).find(k => !/_comment$/.test(k) && groups[k] && (unq(groups[k].path) === want || unq(groups[k].name) === want));
  const addRef = (groupKey, relPath, name) => {
    const uuid = p.generateUuid();
    refs[uuid] = {isa: "PBXFileReference", lastKnownFileType: "sourcecode.swift", path: `"${relPath}"`, sourceTree: '"<group>"'};
    refs[uuid + "_comment"] = name;
    groups[groupKey].children.push({value: uuid, comment: name});
    return uuid;
  };
  const copyIn = (dir, name) => {
    const from = path.join(src, name), to = path.join(dir, name);
    fs.mkdirSync(dir, {recursive: true});
    if (!fs.existsSync(to) || fs.readFileSync(to, "utf8") !== fs.readFileSync(from, "utf8")) { fs.copyFileSync(from, to); return true; }
    return false;
  };
  const changed = [];
  const [appKey] = appT, appGroupKey = groupKeyByPath("App");

  // 1. The App: StudyboardLms.swift needs SBSchoolHandoff.swift and StudyboardSchoolBackground.swift (school sites in the background)
  if (anyInPhase(appKey, "StudyboardLms.swift")) {
    for (const name of APP_FILES) {
      if (anyInPhase(appKey, name)) continue;
      if (!appGroupKey) { log("couldn't find the App folder's group, so " + name + " wasn't added. Add it in Xcode (target App), or the app won't build."); return {ok: false}; }
      copyIn(path.join(appDir, "App"), name);
      const ref = refOf(name) || addRef(appGroupKey, name, name);
      addToPhase(appKey, ref, name);
      changed.push(name + " in the App (school site sign-in needs it)");
    }
  }

  // 2. The Safari extension target, if it's been made
  const xT = targets.find(([, t]) => /app-extension/.test(unq(t.productType)) && /safari/i.test(unq(t.name)));
  let ext = false;
  if (xT) {
    const [xKey, xTarget] = xT, xName = unq(xTarget.name);
    const xDir = [xName, "StudyboardSafari"].map(n => path.join(appDir, n)).find(d => fs.existsSync(d)) || path.join(appDir, xName);
    const xGroupKey = groupKeyByPath(path.basename(xDir));
    const syncSec = objs.PBXFileSystemSynchronizedRootGroup || {};
    const synced = (xTarget.fileSystemSynchronizedGroups || []).map(x => syncSec[x.value || x]).some(Boolean);
    // Studyboard's handler replaces the one Xcode made (same file name, same class name)
    if (copyIn(xDir, HANDLER)) changed.push(HANDLER + " in " + path.basename(xDir) + "/ is Studyboard's");
    if (synced) { if (copyIn(xDir, SHARED)) changed.push(SHARED + " put in " + path.basename(xDir) + "/ (the extension's folder)"); }
    else if (!anyInPhase(xKey, SHARED)) {
      if (xGroupKey) { copyIn(xDir, SHARED); addToPhase(xKey, addRef(xGroupKey, SHARED, SHARED), SHARED); changed.push(SHARED + " in the Safari extension"); }
      else log("couldn't find the Safari extension's folder group: add native/SchoolSafari/" + SHARED + " to the " + xName + " target in Xcode");
    }
    // entitlements: App Group and keychain group, the same as the app's
    const configsOf = tKey => { const list = objs.XCConfigurationList[objs.PBXNativeTarget[tKey].buildConfigurationList]; return (list.buildConfigurations || []).map(c => objs.XCBuildConfiguration[c.value]).filter(Boolean); };
    const cfgs = configsOf(xKey);
    let rel = cfgs.map(c => unq(c.buildSettings.CODE_SIGN_ENTITLEMENTS)).find(Boolean);
    if (!rel) { rel = `${path.basename(xDir)}/${path.basename(xDir)}.entitlements`; cfgs.forEach(c => { c.buildSettings.CODE_SIGN_ENTITLEMENTS = `"${rel}"`; }); changed.push(`the Safari extension signs with ${rel}`); }
    const efile = path.join(appDir, rel);
    let t = fs.existsSync(efile) ? fs.readFileSync(efile, "utf8") : `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n</dict>\n</plist>\n`;
    const t0 = t;
    const ensure = (key, value) => {
      if (t.includes(`<string>${value}</string>`)) return;
      const k = `<key>${key}</key>`;
      if (t.includes(k)) { const at = t.indexOf("<array>", t.indexOf(k)); if (at >= 0) t = t.slice(0, at + 7) + `\n\t\t<string>${value}</string>` + t.slice(at + 7); }
      else { const at = t.lastIndexOf("</dict>"); t = t.slice(0, at) + `\t${k}\n\t<array>\n\t\t<string>${value}</string>\n\t</array>\n` + t.slice(at); }
    };
    ensure("com.apple.security.application-groups", GROUP_ID);
    ensure("keychain-access-groups", KEYCHAIN);
    if (t !== t0 || !fs.existsSync(efile)) { fs.mkdirSync(path.dirname(efile), {recursive: true}); fs.writeFileSync(efile, t); changed.push(`the Safari extension has the App Group and keychain group (${rel})`); }
    // Info.plist: where SBSchoolHandoff finds the keychain group
    const ip = cfgs.map(c => unq(c.buildSettings.INFOPLIST_FILE)).find(Boolean);
    const ipFile = ip ? path.join(appDir, ip) : null;
    if (ipFile && fs.existsSync(ipFile)) {
      let x = fs.readFileSync(ipFile, "utf8");
      // (the name Settings > Apps > Safari > Extensions shows, which the app's sign-in steps call "Studyboard")
      for (const [k, v] of [["SBKeychainAccessGroup", KEYCHAIN], ["CFBundleDisplayName", "Studyboard"]]) {
        if (x.includes(`<key>${k}</key>`)) continue;
        const at = x.indexOf("<dict>");
        if (at >= 0) { x = x.slice(0, at + 6) + `\n\t<key>${k}</key>\n\t<string>${v}</string>` + x.slice(at + 6); fs.writeFileSync(ipFile, x); changed.push(`${k} in the Safari extension's Info.plist`); }
      }
    } else {
      // a target with a generated Info.plist: the keys go in as build settings
      for (const [k, v] of [["SBKeychainAccessGroup", KEYCHAIN], ["CFBundleDisplayName", "Studyboard"]]) {
        if (cfgs.some(c => c.buildSettings["INFOPLIST_KEY_" + k])) continue;
        cfgs.forEach(c => { c.buildSettings["INFOPLIST_KEY_" + k] = `"${v}"`; });
        changed.push(`${k} in the Safari extension's Info.plist (build setting)`);
      }
    }
    // the web files: a folder reference to ios-wrapper/ios-safari-extension (made once in Xcode)
    const hasWww = Object.keys(refs).some(k => !/_comment$/.test(k) && refs[k] && path.basename(unq(refs[k].path)) === "ios-safari-extension");
    if (!hasWww) log(`THE SAFARI EXTENSION'S WEB FILES AREN'T IN THE ${xName} TARGET YET. In Xcode: delete its Resources group (Move to Trash), then File > Add Files to "App", pick ios-wrapper/ios-safari-extension, choose "Create folder references", untick "Copy items if needed", tick only the ${xName} target, Add (ios-wrapper/README-IOS.md, "Schools that sign in with Google").`);
    ext = hasWww;
  } else {
    log("No Safari extension target yet, so schools that sign in with Google can't be connected on iPhone (everything else works). To add it: ios-wrapper/README-IOS.md, \"Schools that sign in with Google\".");
  }

  if (changed.length) { fs.writeFileSync(pbxPath, p.writeSync()); changed.forEach(c => log(c)); }
  return {ok: true, ext, changed};
}

module.exports = {setupSchoolSafari, GROUP_ID, KEYCHAIN};
if (require.main === module) setupSchoolSafari(path.join(__dirname, "..", "ios-wrapper"));
