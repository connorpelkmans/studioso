// node tests/pbx-flag.test.js
// scripts/pbx-flag.js: the widget extension's Swift flag goes on and off in its own build configurations only
"use strict";
const assert = require("assert"), fs = require("fs"), path = require("path");
const {setSwiftFlag} = require("../scripts/pbx-flag");
let n = 0; const t = (name, fn) => { fn(); n++; console.log("ok -", name); };

const cfg = (id, name, settings) => `\t\t${id} /* ${name} */ = {
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {
${settings.map(s => "\t\t\t\t" + s).join("\n")}
\t\t\t};
\t\t\tname = ${name};
\t\t};
`;
const PBX = `/* Begin XCBuildConfiguration section */
${cfg("A1", "Debug", ["INFOPLIST_FILE = App/Info.plist;", "PRODUCT_BUNDLE_IDENTIFIER = com.studyboardapp.studyboard;", "SWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG;"])}${cfg("A2", "Release", ["INFOPLIST_FILE = App/Info.plist;", "PRODUCT_BUNDLE_IDENTIFIER = com.studyboardapp.studyboard;"])}${cfg("W1", "Debug", ["INFOPLIST_FILE = StudyboardWidgets/Info.plist;", "PRODUCT_BUNDLE_IDENTIFIER = com.studyboardapp.studyboard.StudyboardWidgets;", "SWIFT_ACTIVE_COMPILATION_CONDITIONS = \"DEBUG $(inherited)\";"])}${cfg("W2", "Release", ["INFOPLIST_FILE = StudyboardWidgets/Info.plist;", "PRODUCT_BUNDLE_IDENTIFIER = com.studyboardapp.studyboard.StudyboardWidgets;"])}/* End XCBuildConfiguration section */
`;
const block = (txt, id) => txt.slice(txt.indexOf("\t\t" + id + " /*"), txt.indexOf("name = ", txt.indexOf("\t\t" + id + " /*")));

t("turning it on adds the flag to the widget extension's Debug and Release, and nowhere else", () => {
  const r = setSwiftFlag(PBX, "StudyboardWidgets", "STUDYBOARD_HOME_WIDGETS", true);
  assert.ok(r.changed);
  assert.ok(/SWIFT_ACTIVE_COMPILATION_CONDITIONS = "DEBUG \$\(inherited\) STUDYBOARD_HOME_WIDGETS";/.test(block(r.text, "W1")));
  assert.ok(/SWIFT_ACTIVE_COMPILATION_CONDITIONS = "\$\(inherited\) STUDYBOARD_HOME_WIDGETS";/.test(block(r.text, "W2")));
  assert.strictEqual(block(r.text, "A1"), block(PBX, "A1"));
  assert.strictEqual(block(r.text, "A2"), block(PBX, "A2"));
  // still one settings dict per configuration, closed properly
  assert.strictEqual((r.text.match(/buildSettings = \{/g) || []).length, 4);
  assert.strictEqual((r.text.match(/\n\t\t\t\};\n\t\t\tname = /g) || []).length, 4);
});

t("running it again changes nothing", () => {
  const once = setSwiftFlag(PBX, "StudyboardWidgets", "STUDYBOARD_HOME_WIDGETS", true).text;
  const twice = setSwiftFlag(once, "StudyboardWidgets", "STUDYBOARD_HOME_WIDGETS", true);
  assert.ok(!twice.changed); assert.strictEqual(twice.text, once);
});

t("turning it off puts the project back as it was", () => {
  const on = setSwiftFlag(PBX, "StudyboardWidgets", "STUDYBOARD_HOME_WIDGETS", true).text;
  const off = setSwiftFlag(on, "StudyboardWidgets", "STUDYBOARD_HOME_WIDGETS", false);
  assert.ok(off.changed);
  assert.ok(!off.text.includes("STUDYBOARD_HOME_WIDGETS"));
  assert.ok(/SWIFT_ACTIVE_COMPILATION_CONDITIONS = "DEBUG \$\(inherited\)";/.test(block(off.text, "W1")));
  assert.ok(!block(off.text, "W2").includes("SWIFT_ACTIVE_COMPILATION_CONDITIONS"));
  assert.ok(!setSwiftFlag(PBX, "StudyboardWidgets", "STUDYBOARD_HOME_WIDGETS", false).changed);
});

t("a list-style setting gets the flag as one more entry", () => {
  const pbx = cfg("W3", "Release", ["INFOPLIST_FILE = StudyboardWidgets/Info.plist;", "SWIFT_ACTIVE_COMPILATION_CONDITIONS = (", "\t\"$(inherited)\",", "\tFOO,", ");"]);
  const r = setSwiftFlag(pbx, "StudyboardWidgets", "STUDYBOARD_HOME_WIDGETS", true);
  assert.ok(/\(\n\t+"\$\(inherited\)",\n\t+FOO,\n\t+STUDYBOARD_HOME_WIDGETS,\n\t+\);/.test(r.text), r.text);
  const back = setSwiftFlag(r.text, "StudyboardWidgets", "STUDYBOARD_HOME_WIDGETS", false).text;
  assert.ok(!back.includes("STUDYBOARD_HOME_WIDGETS") && back.includes("FOO,"));
});

t("the widget bundle lists the Home Screen widgets only under the flag ios-stage sets", () => {
  const swift = fs.readFileSync(path.join(__dirname, "..", "ios-wrapper", "native", "FocusActivity", "StudyboardWidgets.swift"), "utf8");
  const body = swift.slice(swift.indexOf("struct StudyboardWidgets: WidgetBundle"), swift.indexOf("\n}\n", swift.indexOf("struct StudyboardWidgets: WidgetBundle")));
  assert.ok(/#if STUDYBOARD_HOME_WIDGETS\s+StudyboardTodayWidget\(\)\s+StudyboardLockWidget\(\)\s+#endif/.test(body));
  assert.ok(fs.readFileSync(path.join(__dirname, "..", "scripts", "ios-stage.js"), "utf8").includes('"STUDYBOARD_HOME_WIDGETS"'));
});

console.log(n + " passed");
