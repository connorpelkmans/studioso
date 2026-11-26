// node tests/ios-school-safari.test.js
// scripts/ios-school-safari.js puts school sign-in through Safari (schools that sign in with Google) into the iPhone app's Xcode
// project: SBSchoolHandoff.swift into the App whenever StudyboardLms.swift is there (or the app wouldn't build), and, once the
// Safari extension target exists, Studyboard's handler, the shared file, the App Group and keychain group, and the Info.plist key.
// Built on Capacitor's own project template (tests/fixtures/capacitor-ios-app.pbxproj), like tests/ios-widgets.test.js.
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), assert = require("assert");
const xcode = require("xcode");
const {setupSchoolSafari, KEYCHAIN} = require("../scripts/ios-school-safari");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const ROOT = path.join(__dirname, "..");
const unq = s => String(s || "").replace(/^"|"$/g, "");

function makeWrap({lms, safari}){
  const wrap = fs.mkdtempSync(path.join(os.tmpdir(), "sbsafari-")), app = path.join(wrap, "ios", "App");
  fs.mkdirSync(path.join(app, "App.xcodeproj"), {recursive: true}); fs.mkdirSync(path.join(app, "App"), {recursive: true});
  fs.cpSync(path.join(ROOT, "ios-wrapper", "native"), path.join(wrap, "native"), {recursive: true});
  const pbx = path.join(app, "App.xcodeproj", "project.pbxproj");
  fs.copyFileSync(path.join(__dirname, "fixtures", "capacitor-ios-app.pbxproj"), pbx);
  const p = xcode.project(pbx); p.parseSync();
  const o = p.hash.project.objects;
  const appT = Object.entries(o.PBXNativeTarget).find(([k, t]) => !/_comment/.test(k) && unq(t.name) === "App")[0];
  const appGroup = Object.keys(o.PBXGroup).find(k => !/_comment/.test(k) && unq(o.PBXGroup[k].path) === "App");
  if (lms) { fs.copyFileSync(path.join(ROOT, "ios-wrapper", "native", "StudyboardLms.swift"), path.join(app, "App", "StudyboardLms.swift")); p.addSourceFile("StudyboardLms.swift", {target: appT}, appGroup); }
  if (safari) {
    // as Xcode makes a Safari Extension target: its own folder, the template handler, an Info.plist
    const t = p.addTarget("StudyboardSafari", "app_extension", "StudyboardSafari");
    p.addBuildPhase([], "PBXSourcesBuildPhase", "Sources", t.uuid);
    const dir = path.join(app, "StudyboardSafari");
    fs.mkdirSync(dir, {recursive: true});
    fs.writeFileSync(path.join(dir, "SafariWebExtensionHandler.swift"), "// Xcode's template handler\n");
    fs.writeFileSync(path.join(dir, "Info.plist"), `<?xml version="1.0" encoding="UTF-8"?>\n<plist version="1.0">\n<dict>\n\t<key>NSExtension</key>\n\t<dict/>\n</dict>\n</plist>\n`);
    const g = p.addPbxGroup([], "StudyboardSafari", "StudyboardSafari");
    const main = Object.keys(o.PBXGroup).find(k => !/_comment/.test(k) && !o.PBXGroup[k].name && !o.PBXGroup[k].path);
    p.addToPbxGroup(g.uuid, main);
    p.addSourceFile("SafariWebExtensionHandler.swift", {target: t.uuid}, g.uuid);
    const list = o.XCConfigurationList[o.PBXNativeTarget[t.uuid].buildConfigurationList];
    list.buildConfigurations.forEach(c => { o.XCBuildConfiguration[c.value].buildSettings.INFOPLIST_FILE = '"StudyboardSafari/Info.plist"'; });
    if (safari === "with-files") p.addFile("../../ios-safari-extension", g.uuid, {lastKnownFileType: "folder"});
  }
  fs.writeFileSync(pbx, p.writeSync());
  return wrap;
}
function membership(wrap){
  const p = xcode.project(path.join(wrap, "ios", "App", "App.xcodeproj", "project.pbxproj")); p.parseSync();
  const o = p.hash.project.objects, out = {}, ents = {};
  Object.entries(o.PBXNativeTarget).filter(([k]) => !/_comment/.test(k)).forEach(([, t]) => {
    (t.buildPhases || []).map(b => o.PBXSourcesBuildPhase && o.PBXSourcesBuildPhase[b.value]).filter(Boolean).forEach(ph => (ph.files || []).forEach(f => {
      const bf = o.PBXBuildFile[f.value], ref = bf && o.PBXFileReference[bf.fileRef]; if (!ref) return;
      const name = path.basename(unq(ref.path)); (out[name] = out[name] || []).push(unq(t.name));
    }));
    const list = o.XCConfigurationList[t.buildConfigurationList];
    ents[unq(t.name)] = (list.buildConfigurations || []).map(c => unq(o.XCBuildConfiguration[c.value].buildSettings.CODE_SIGN_ENTITLEMENTS)).find(Boolean) || "";
  });
  return {files: out, ents};
}
const logs = () => { const l = []; const f = m => l.push(m); f.lines = l; return f; };

// 1. school sign-in in the app, no Safari extension yet: the app still builds, and it says what's missing
{
  const wrap = makeWrap({lms: true}), log = logs(), r = setupSchoolSafari(wrap, log), m = membership(wrap);
  ok(r.ok && !r.ext, "no extension target: set up as far as it goes");
  ok(JSON.stringify(m.files["SBSchoolHandoff.swift"]) === JSON.stringify(["App"]), "SBSchoolHandoff.swift is built by the App (StudyboardLms.swift needs it)");
  ok(fs.readFileSync(path.join(wrap, "ios", "App", "App", "SBSchoolHandoff.swift"), "utf8") === fs.readFileSync(path.join(ROOT, "ios-wrapper", "native", "SchoolSafari", "SBSchoolHandoff.swift"), "utf8"), "the copy in the App folder is the current file");
  ok(log.lines.some(x => /No Safari extension target yet/.test(x)), "it says the Safari extension target is missing");
  const r2 = setupSchoolSafari(wrap, () => {});
  ok(r2.changed.length === 0 && JSON.stringify(membership(wrap).files["SBSchoolHandoff.swift"]) === JSON.stringify(["App"]), "a second run changes nothing");
}

// 2. no school sign-in in the app: nothing added
{
  const wrap = makeWrap({}), r = setupSchoolSafari(wrap, () => {});
  ok(r.ok && !membership(wrap).files["SBSchoolHandoff.swift"], "without StudyboardLms.swift nothing is added to the App");
}

// 3. the Safari extension target, before and after its web files are added
{
  const wrap = makeWrap({lms: true, safari: true}), log = logs(), r = setupSchoolSafari(wrap, log), m = membership(wrap);
  const app = path.join(wrap, "ios", "App"), xdir = path.join(app, "StudyboardSafari");
  ok((m.files["SBSchoolHandoff.swift"] || []).sort().join() === "App,StudyboardSafari", "SBSchoolHandoff.swift is built by the App and the extension: " + m.files["SBSchoolHandoff.swift"]);
  ok(JSON.stringify(m.files["SafariWebExtensionHandler.swift"]) === JSON.stringify(["StudyboardSafari"]), "the handler is built by the extension only");
  ok(fs.readFileSync(path.join(xdir, "SafariWebExtensionHandler.swift"), "utf8") === fs.readFileSync(path.join(ROOT, "ios-wrapper", "native", "SchoolSafari", "SafariWebExtensionHandler.swift"), "utf8"), "Xcode's template handler is replaced with Studyboard's");
  const ent = fs.readFileSync(path.join(app, m.ents.StudyboardSafari), "utf8");
  ok(m.ents.StudyboardSafari && /group\.com\.studyboardapp\.studyboard/.test(ent) && ent.includes(KEYCHAIN), "the extension has the App Group and keychain group: " + m.ents.StudyboardSafari);
  const info = fs.readFileSync(path.join(xdir, "Info.plist"), "utf8");
  ok(info.includes("<key>SBKeychainAccessGroup</key>") && info.includes(KEYCHAIN) && info.includes("<key>NSExtension</key>") && /<key>CFBundleDisplayName<\/key>\s*<string>Studyboard<\/string>/.test(info), "the extension's Info.plist gets the keychain group key and the name Safari shows, keeping what's there");
  ok(!r.ext && log.lines.some(x => /WEB FILES AREN'T IN THE StudyboardSafari TARGET/.test(x)), "it says the web files still need adding");
  const r2 = setupSchoolSafari(wrap, () => {});
  ok(r2.changed.length === 0 && (fs.readFileSync(path.join(xdir, "Info.plist"), "utf8").match(/SBKeychainAccessGroup/g) || []).length === 1, "a second run changes nothing");

  const wrap2 = makeWrap({lms: true, safari: "with-files"}), log2 = logs(), r3 = setupSchoolSafari(wrap2, log2);
  ok(r3.ext && !log2.lines.some(x => /WEB FILES/.test(x)), "with the web files in the target, it's all set up");
}
console.log("ios-school-safari: " + n + " checks passed");
