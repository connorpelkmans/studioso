// node tests/ios-widgets.test.js
// scripts/ios-widgets.js puts the Home Screen and Lock Screen widgets into the iPhone app's Xcode project: each file in exactly the
// targets it belongs to, the App Group on the app and the widget extension, nothing twice, and nothing more on a second run.
// Built on Capacitor's own project template (tests/fixtures/capacitor-ios-app.pbxproj, from @capacitor/cli 7) with a widget extension
// added the way Xcode adds one: classic (files listed in the project) and synchronised (a recent Xcode: the folder is the list).
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), assert = require("assert");
const xcode = require("xcode");
const {setupHomeWidgets} = require("../scripts/ios-widgets");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
const ROOT = path.join(__dirname, "..");
const unq = s => String(s || "").replace(/^"|"$/g, "");

// A copy of ios-wrapper with an Xcode project like the owner's: the App target, plus a StudyboardWidgets extension holding the
// Focus timer's StudyboardWidgets.swift
function makeWrap(kind){
  const wrap = fs.mkdtempSync(path.join(os.tmpdir(), "sbwidgets-")), app = path.join(wrap, "ios", "App");
  fs.mkdirSync(path.join(app, "App.xcodeproj"), {recursive: true}); fs.mkdirSync(path.join(app, "App"), {recursive: true});
  fs.cpSync(path.join(ROOT, "ios-wrapper", "native"), path.join(wrap, "native"), {recursive: true});
  const pbx = path.join(app, "App.xcodeproj", "project.pbxproj");
  fs.copyFileSync(path.join(__dirname, "fixtures", "capacitor-ios-app.pbxproj"), pbx);
  if (kind === "none") return wrap;
  const p = xcode.project(pbx); p.parseSync();
  const t = p.addTarget("StudyboardWidgetsExtension", "app_extension", "StudyboardWidgets");
  p.addBuildPhase([], "PBXSourcesBuildPhase", "Sources", t.uuid);
  fs.mkdirSync(path.join(app, "StudyboardWidgets"), {recursive: true});
  fs.copyFileSync(path.join(ROOT, "ios-wrapper", "native", "FocusActivity", "StudyboardWidgets.swift"), path.join(app, "StudyboardWidgets", "StudyboardWidgets.swift"));
  if (kind === "classic") {
    const g = p.addPbxGroup([], "StudyboardWidgets", "StudyboardWidgets");
    p.addToPbxGroup(g.uuid, p.findPBXGroupKey({name: "CustomTemplate"}) || Object.keys(p.hash.project.objects.PBXGroup).find(k => !/_comment/.test(k) && !p.hash.project.objects.PBXGroup[k].name && !p.hash.project.objects.PBXGroup[k].path));
    p.addSourceFile("StudyboardWidgets.swift", {target: t.uuid}, g.uuid);
    fs.writeFileSync(pbx, p.writeSync());
  } else {
    // synchronised folder: a PBXFileSystemSynchronizedRootGroup the extension points at (written as Xcode 16 writes it)
    fs.writeFileSync(pbx, p.writeSync());
    let s = fs.readFileSync(pbx, "utf8");
    const G = "A1B2C3D4E5F6A7B8C9D0E1F2";
    s = s.replace("/* Begin PBXFrameworksBuildPhase section */", `/* Begin PBXFileSystemSynchronizedRootGroup section */\n\t\t${G} /* StudyboardWidgets */ = {isa = PBXFileSystemSynchronizedRootGroup; path = StudyboardWidgets; sourceTree = "<group>"; };\n/* End PBXFileSystemSynchronizedRootGroup section */\n\n/* Begin PBXFrameworksBuildPhase section */`);
    const at = s.indexOf(t.uuid + " /*"), isa = s.indexOf("isa = PBXNativeTarget;", at) + "isa = PBXNativeTarget;".length;
    assert(at > 0 && isa > at, "(the test's widget target was written)");
    s = s.slice(0, isa) + `\n\t\t\tfileSystemSynchronizedGroups = (\n\t\t\t\t${G} /* StudyboardWidgets */,\n\t\t\t);` + s.slice(isa);
    fs.writeFileSync(pbx, s);
  }
  return wrap;
}
// Which targets build each file, read back from the saved project
function membership(wrap){
  const p = xcode.project(path.join(wrap, "ios", "App", "App.xcodeproj", "project.pbxproj")); p.parseSync();
  const o = p.hash.project.objects, out = {};
  Object.entries(o.PBXNativeTarget).filter(([k]) => !/_comment/.test(k)).forEach(([, t]) => {
    (t.buildPhases || []).map(b => o.PBXSourcesBuildPhase && o.PBXSourcesBuildPhase[b.value]).filter(Boolean).forEach(ph => (ph.files || []).forEach(f => {
      const bf = o.PBXBuildFile[f.value], ref = bf && o.PBXFileReference[bf.fileRef]; if (!ref) return;
      const name = path.basename(unq(ref.path)); (out[name] = out[name] || []).push(unq(t.name));
    }));
  });
  const ents = {}; Object.entries(o.PBXNativeTarget).filter(([k]) => !/_comment/.test(k)).forEach(([, t]) => {
    const list = o.XCConfigurationList[t.buildConfigurationList]; ents[unq(t.name)] = (list.buildConfigurations || []).map(c => unq(o.XCBuildConfiguration[c.value].buildSettings.CODE_SIGN_ENTITLEMENTS));
  });
  return {files: out, ents};
}
const quiet = () => {};

// 1. classic project
{
  const wrap = makeWrap("classic"), r = setupHomeWidgets(wrap, quiet), m = membership(wrap);
  ok(r.ok && !r.sync, "classic project: the widgets are set up");
  ok(JSON.stringify(m.files["StudyboardHomeWidgets.swift"]) === JSON.stringify(["StudyboardWidgetsExtension"]), "StudyboardHomeWidgets.swift is built by the widget extension only: " + m.files["StudyboardHomeWidgets.swift"]);
  ok((m.files["StudyboardHomeWidgetData.swift"] || []).sort().join() === "App,StudyboardWidgetsExtension", "StudyboardHomeWidgetData.swift by both the App and the widget extension: " + m.files["StudyboardHomeWidgetData.swift"]);
  ok(JSON.stringify(m.files["StudyboardHomeWidgetsPlugin.swift"]) === JSON.stringify(["App"]), "StudyboardHomeWidgetsPlugin.swift by the App only");
  const app = path.join(wrap, "ios", "App");
  ok(fs.existsSync(path.join(app, "StudyboardWidgets", "StudyboardHomeWidgets.swift")) && fs.existsSync(path.join(app, "App", "StudyboardHomeWidgetsPlugin.swift")), "the files are copied into the project's folders");
  ok(m.ents.StudyboardWidgetsExtension.every(e => e === "StudyboardWidgets/StudyboardWidgets.entitlements") && m.ents.App.every(e => e === "App/App.entitlements"), "both targets sign with an entitlements file: " + JSON.stringify(m.ents));
  for (const f of ["StudyboardWidgets/StudyboardWidgets.entitlements", "App/App.entitlements"]) ok(fs.readFileSync(path.join(app, f), "utf8").includes("group.com.studyboardapp.studyboard"), f + " has the App Group");
  const again = setupHomeWidgets(wrap, quiet);
  ok(again.ok && again.changed.length === 0 && JSON.stringify(membership(wrap)) === JSON.stringify(m), "a second run changes nothing");
}
// 2. synchronised widget folder (recent Xcode)
{
  const wrap = makeWrap("sync"), r = setupHomeWidgets(wrap, quiet), m = membership(wrap), app = path.join(wrap, "ios", "App");
  ok(r.ok && r.sync, "synchronised widget folder: the widgets are set up");
  ok(fs.existsSync(path.join(app, "StudyboardWidgets", "StudyboardHomeWidgets.swift")) && fs.existsSync(path.join(app, "StudyboardWidgets", "StudyboardHomeWidgetData.swift")), "the widget's files are put in its folder (which makes them the extension's)");
  ok(!m.files["StudyboardHomeWidgets.swift"] && JSON.stringify(m.files["StudyboardHomeWidgetData.swift"]) === JSON.stringify(["App"]), "nothing is listed for the extension a second time; the App builds the shared data file: " + JSON.stringify(m.files));
  ok(JSON.stringify(m.files["StudyboardHomeWidgetsPlugin.swift"]) === JSON.stringify(["App"]) && !fs.existsSync(path.join(app, "StudyboardWidgets", "StudyboardHomeWidgetsPlugin.swift")), "the plugin goes to the App, not into the widget's folder");
  const p = xcode.project(path.join(app, "App.xcodeproj", "project.pbxproj")); p.parseSync();
  const ref = Object.values(p.hash.project.objects.PBXFileReference).find(r => r && r.path && /StudyboardHomeWidgetData/.test(r.path));
  ok(ref && unq(ref.path) === "../StudyboardWidgets/StudyboardHomeWidgetData.swift", "the App's reference is the same file in the widget's folder: " + (ref && ref.path));
  ok(fs.readFileSync(path.join(app, "App.xcodeproj", "project.pbxproj"), "utf8").includes("PBXFileSystemSynchronizedRootGroup"), "the synchronised folder is kept in the project");
  ok(setupHomeWidgets(wrap, quiet).changed.length === 0, "a second run changes nothing");
}
// 3. no widget extension: says how to add one, changes nothing
{
  const wrap = makeWrap("none"), pbx = path.join(wrap, "ios", "App", "App.xcodeproj", "project.pbxproj"), before = fs.readFileSync(pbx, "utf8"), said = [];
  const r = setupHomeWidgets(wrap, m => said.push(m));
  ok(!r.ok && /WIDGET EXTENSION ISN'T IN THE XCODE PROJECT/.test(said.join(" ")) && fs.readFileSync(pbx, "utf8") === before, "with no widget extension it says how to add one and leaves the project alone");
}
console.log("ios-widgets.test: " + n + " checks passed");
