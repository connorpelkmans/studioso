// The Home Screen and Lock Screen widgets (ios-wrapper/native/HomeWidgets) put into the iPhone app's Xcode project, so nobody has
// to add them by hand in Xcode: npm run ios:stage calls this. It adds the three files to the right targets, gives the widget
// extension the App Group the app shares its day through, and says what it did. Run on its own:
//
//   node scripts/ios-widgets.js            (the project at ios-wrapper/ios/App)
//
// StudyboardHomeWidgets.swift      -> the widget extension (StudyboardWidgets...)
// StudyboardHomeWidgetData.swift   -> the widget extension and the App
// StudyboardHomeWidgetsPlugin.swift -> the App
//
// The files are copied into the project (as Xcode's "Copy items" would); ios:stage keeps those copies up to date. A widget
// extension made with a recent Xcode keeps its files in a synchronised folder (every file in it belongs to the extension): there
// the files are only placed in the folder, so nothing is built twice.
"use strict";
const fs = require("fs"), path = require("path");

const GROUP_ID = "group.com.studyboardapp.studyboard";
const FILES = [
  {name: "StudyboardHomeWidgets.swift", widget: true, app: false},
  {name: "StudyboardHomeWidgetData.swift", widget: true, app: true},
  {name: "StudyboardHomeWidgetsPlugin.swift", widget: false, app: true}
];
const unq = s => String(s || "").replace(/^"|"$/g, "");

function setupHomeWidgets(wrap, log){
  log = log || (m => console.log("ios-widgets: " + m));
  const appDir = path.join(wrap, "ios", "App"), pbxPath = path.join(appDir, "App.xcodeproj", "project.pbxproj"), src = path.join(wrap, "native", "HomeWidgets");
  if (!fs.existsSync(pbxPath)) { log("no Xcode project yet (ios/App/App.xcodeproj)"); return {ok: false}; }
  const xcode = require("xcode");
  const p = xcode.project(pbxPath); p.parseSync();
  const objs = p.hash.project.objects;
  const targets = Object.entries(objs.PBXNativeTarget || {}).filter(([k, v]) => !/_comment$/.test(k) && v && typeof v === "object");
  const appT = targets.find(([, t]) => unq(t.name) === "App");
  const wT = targets.find(([, t]) => /StudyboardWidgets/i.test(unq(t.name)) && /app-extension/.test(unq(t.productType)));
  if (!appT) { log("couldn't find the App target"); return {ok: false}; }
  if (!wT) {
    log("THE WIDGET EXTENSION ISN'T IN THE XCODE PROJECT, so the widgets can't be added. In Xcode: File > New > Target > Widget Extension, name it StudyboardWidgets, untick Include Configuration App Intent, Finish, Activate. Then npm run ios:stage again (see ios-wrapper/README-IOS.md 3c).");
    return {ok: false};
  }
  const [appKey] = appT, [wKey, wTarget] = wT;
  const changed = [];

  // where the widget's own files live: a synchronised folder (recent Xcode), a classic group, or neither
  const syncSec = objs.PBXFileSystemSynchronizedRootGroup || {};
  const syncKeys = (wTarget.fileSystemSynchronizedGroups || []).map(x => x.value || x);
  const syncDir = syncKeys.map(k => syncSec[k]).filter(Boolean).map(g => unq(g.path)).find(Boolean) || "";
  const groups = objs.PBXGroup || {};
  const groupKeyByPath = want => Object.keys(groups).find(k => !/_comment$/.test(k) && groups[k] && (unq(groups[k].path) === want || unq(groups[k].name) === want));
  const appGroupKey = groupKeyByPath("App");
  if (!appGroupKey) { log("couldn't find the App folder's group"); return {ok: false}; }
  const wName = syncDir || ["StudyboardWidgets", unq(wTarget.name)].find(n => groupKeyByPath(n) && fs.existsSync(path.join(appDir, n))) || "";
  const wGroupKey = !syncDir && wName ? groupKeyByPath(wName) : null;
  const wDir = wName ? path.join(appDir, wName) : path.join(appDir, "App");

  // file references already in the project, by file name
  const refs = objs.PBXFileReference || {};
  const refOf = name => Object.keys(refs).find(k => !/_comment$/.test(k) && refs[k] && path.basename(unq(refs[k].path)) === name);
  const phaseOf = tKey => { const t = objs.PBXNativeTarget[tKey]; const ids = (t.buildPhases || []).map(x => x.value); return ids.find(id => objs.PBXSourcesBuildPhase && objs.PBXSourcesBuildPhase[id]); };
  const inPhase = (tKey, refKey) => { const ph = objs.PBXSourcesBuildPhase[phaseOf(tKey)]; return (ph.files || []).some(f => objs.PBXBuildFile[f.value] && objs.PBXBuildFile[f.value].fileRef === refKey); };
  const addToPhase = (tKey, refKey, name) => {
    const uuid = p.generateUuid(), phKey = phaseOf(tKey);
    if (!phKey) throw new Error("no Sources phase in target " + unq(objs.PBXNativeTarget[tKey].name));
    objs.PBXBuildFile[uuid] = {isa: "PBXBuildFile", fileRef: refKey, fileRef_comment: name};
    objs.PBXBuildFile[uuid + "_comment"] = name + " in Sources";
    objs.PBXSourcesBuildPhase[phKey].files.push({value: uuid, comment: name + " in Sources"});
  };
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
    if (!fs.existsSync(to) || fs.readFileSync(to, "utf8") !== fs.readFileSync(from, "utf8")) fs.copyFileSync(from, to);
  };

  for (const f of FILES) {
    if (!fs.existsSync(path.join(src, f.name))) { log("missing " + path.join("native", "HomeWidgets", f.name)); return {ok: false}; }
    let ref = refOf(f.name);
    // the widget's side
    if (f.widget) {
      if (syncDir) {
        // a synchronised folder: the file belongs to the extension by being in it
        if (!fs.existsSync(path.join(wDir, f.name))) { copyIn(wDir, f.name); changed.push(`${f.name} put in ${wName}/ (the widget's folder)`); }
      } else {
        if (!ref) {
          // the copy sits in the folder of the group that lists it (the widget's group, or the App's when the widget has none)
          copyIn(wGroupKey ? wDir : path.join(appDir, "App"), f.name);
          ref = wGroupKey ? addRef(wGroupKey, f.name, f.name) : addRef(appGroupKey, f.name, f.name);
          changed.push(`${f.name} added to the project`);
        }
        if (!inPhase(wKey, ref)) { addToPhase(wKey, ref, f.name); changed.push(`${f.name} in the widget extension`); }
      }
    }
    // the app's side
    if (f.app) {
      if (!ref) {
        if (f.widget && syncDir) ref = addRef(appGroupKey, path.posix.join("..", wName, f.name), f.name);   // the same file as the widget's
        else { copyIn(path.join(appDir, "App"), f.name); ref = addRef(appGroupKey, f.name, f.name); }
        changed.push(`${f.name} added to the project`);
      }
      if (!inPhase(appKey, ref)) { addToPhase(appKey, ref, f.name); changed.push(`${f.name} in the App`); }
    }
  }

  // the App Group: the app and the widget extension both carry it (the widgets read the day the app saves there)
  const configsOf = tKey => { const list = objs.XCConfigurationList[objs.PBXNativeTarget[tKey].buildConfigurationList]; return (list.buildConfigurations || []).map(c => objs.XCBuildConfiguration[c.value]).filter(Boolean); };
  const ensureGroup = (tKey, fallback, label) => {
    const cfgs = configsOf(tKey);
    let rel = cfgs.map(c => unq(c.buildSettings.CODE_SIGN_ENTITLEMENTS)).find(Boolean);
    if (!rel) { rel = fallback; cfgs.forEach(c => { c.buildSettings.CODE_SIGN_ENTITLEMENTS = `"${rel}"`; }); changed.push(`${label} signs with ${rel}`); }
    else cfgs.forEach(c => { if (!c.buildSettings.CODE_SIGN_ENTITLEMENTS) c.buildSettings.CODE_SIGN_ENTITLEMENTS = `"${rel}"`; });
    const file = path.join(appDir, rel);
    const head = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n</dict>\n</plist>\n`;
    let t = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : head;
    if (t.includes(GROUP_ID)) { if (!fs.existsSync(file)) fs.writeFileSync(file, t); return; }
    const key = "<key>com.apple.security.application-groups</key>";
    if (t.includes(key)) { const at = t.indexOf("<array>", t.indexOf(key)); if (at >= 0) t = t.slice(0, at + 7) + `\n\t\t<string>${GROUP_ID}</string>` + t.slice(at + 7); }
    else { const at = t.lastIndexOf("</dict>"); t = t.slice(0, at) + `\t${key}\n\t<array>\n\t\t<string>${GROUP_ID}</string>\n\t</array>\n` + t.slice(at); }
    fs.mkdirSync(path.dirname(file), {recursive: true}); fs.writeFileSync(file, t);
    changed.push(`${label} has the App Group (${rel})`);
  };
  ensureGroup(appKey, "App/App.entitlements", "the App");
  ensureGroup(wKey, wName ? `${wName}/${wName}.entitlements` : "StudyboardWidgets.entitlements", "the widget extension");

  if (changed.length) { fs.writeFileSync(pbxPath, p.writeSync()); changed.forEach(c => log(c)); }
  log("the Home Screen and Lock Screen widgets are in the project");
  return {ok: true, changed, sync: !!syncDir, widgetDir: wName};
}

module.exports = {setupHomeWidgets, FILES, GROUP_ID};
if (require.main === module) { const r = setupHomeWidgets(path.join(__dirname, "..", "ios-wrapper")); process.exitCode = r.ok ? 0 : 1; }
