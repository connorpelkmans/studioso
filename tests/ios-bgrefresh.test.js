// node tests/ios-bgrefresh.test.js: ios:stage registers the widgets' Background App Refresh in AppDelegate.swift, once
"use strict";
const assert = require("assert"), fs = require("fs"), os = require("os"), path = require("path");
const {patchAppDelegate, setupBackgroundRefresh, LINE} = require("../scripts/ios-bgrefresh");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
// Capacitor's AppDelegate.swift template (trimmed)
const DEL = `import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
    }
}
`;
const v = patchAppDelegate(DEL);
ok(v && v.split(LINE).length === 2, "adds the register line once");
ok(/didFinishLaunchingWithOptions[^\n]*\{\n\s*\/\/ Background App Refresh[^\n]*\n {8}StudyboardBackgroundRefresh\.register\(\)\n {8}\/\/ Override point/.test(v), "first thing in didFinishLaunchingWithOptions, indented like the rest");
ok(patchAppDelegate(v) === v, "a second run changes nothing");
ok(patchAppDelegate("class AppDelegate {}") === null, "says when the function isn't there");
const MVC = fs.readFileSync(path.join(__dirname, "..", "ios-wrapper", "native", "MainViewController.swift"), "utf8");
ok(/enum StudyboardBackgroundRefresh/.test(MVC) && /static func register\(\)/.test(MVC) && MVC.includes('"com.studyboardapp.studyboard.refresh"'), "MainViewController.swift has the task it registers");
const PL = fs.readFileSync(path.join(__dirname, "..", "ios-wrapper", "Info.plist.additions.plist"), "utf8");
ok(PL.includes("<string>com.studyboardapp.studyboard.refresh</string>") && /<string>fetch<\/string>/.test(PL), "Info.plist additions permit the same task id, with the fetch background mode");
// on a project: only when MainViewController.swift is in it
for (const has of [true, false]) {
  const wrap = fs.mkdtempSync(path.join(os.tmpdir(), "sbbg-")), app = path.join(wrap, "ios", "App");
  fs.mkdirSync(path.join(app, "App.xcodeproj"), {recursive: true}); fs.mkdirSync(path.join(app, "App"), {recursive: true});
  fs.writeFileSync(path.join(app, "App.xcodeproj", "project.pbxproj"), has ? "/* MainViewController.swift in Sources */" : "");
  fs.writeFileSync(path.join(app, "App", "AppDelegate.swift"), DEL);
  const r = setupBackgroundRefresh(wrap, () => {}), t = fs.readFileSync(path.join(app, "App", "AppDelegate.swift"), "utf8");
  ok(has ? r.ok && t.includes(LINE) : !r.ok && t === DEL, has ? "patches AppDelegate.swift when MainViewController.swift is in the project" : "leaves AppDelegate.swift alone when it isn't (it wouldn't build)");
}
console.log("ios-bgrefresh.test: " + n + " checks passed");
