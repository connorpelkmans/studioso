// node tests/plist-merge.test.js: npm run ios:stage merges the keys the iPhone app needs (camera, photos, microphone...)
// into the Xcode project's Info.plist. Without the camera reason, iOS closes the app as soon as Take Photo opens the camera.
const assert = require("assert"), fs = require("fs"), path = require("path");
const {mergePlist, plistPairs} = require("../scripts/plist-merge");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
// the Info.plist a new Capacitor project starts with (trimmed)
const CAP = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CAPACITOR_DEBUG</key>
	<string>$(CAPACITOR_DEBUG)</string>
	<key>LSRequiresIPhoneOS</key>
	<true/>
	<key>UISupportedInterfaceOrientations</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
		<string>UIInterfaceOrientationLandscapeLeft</string>
	</array>
	<key>UIRequiresFullScreen</key>
	<true/>
</dict>
</plist>
`;
const ADD = fs.readFileSync(path.join(__dirname, "..", "ios-wrapper", "Info.plist.additions.plist"), "utf8");
const keys = x => plistPairs(x).map(p => p[0]);
ok(keys(CAP).join() === "CAPACITOR_DEBUG,LSRequiresIPhoneOS,UISupportedInterfaceOrientations,UIRequiresFullScreen", "reads the top-level keys, skipping nested values");
const r = mergePlist(CAP, ADD), after = keys(r.text);
for (const k of ["NSCameraUsageDescription", "NSPhotoLibraryUsageDescription", "NSMicrophoneUsageDescription", "CFBundleURLTypes"]) ok(after.includes(k), "adds " + k);
ok(!r.added.includes("UIRequiresFullScreen") && /<key>UIRequiresFullScreen<\/key>\s*<true\/>/.test(r.text), "keeps a key the project already has, as it is");
ok(after.filter(k => k === "UIRequiresFullScreen").length === 1, "and doesn't add it twice");
ok(/<key>NSCameraUsageDescription<\/key>\s*<string>[^<]{20,}<\/string>/.test(r.text), "the camera key carries its reason");
ok(/<key>CFBundleURLSchemes<\/key>\s*<array>\s*<string>studyboard<\/string>/.test(r.text), "nested values come across whole");
ok(r.text.trim().endsWith("</dict>\n</plist>") && (r.text.match(/<dict>/g) || []).length === (r.text.match(/<\/dict>/g) || []).length, "the result is still one well-formed plist");
ok(mergePlist(r.text, ADD).added.length === 0, "running it again changes nothing");
console.log("\nplist-merge.test: " + n + " checks passed");
