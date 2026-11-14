// Turns a Swift compilation flag on or off in the Xcode project's build configurations that belong to one target, found by a word
// that appears in their settings (the StudyboardWidgets extension's configurations mention StudyboardWidgets in INFOPLIST_FILE and
// PRODUCT_BUNDLE_IDENTIFIER). Used by scripts/ios-stage.js; returns the text unchanged when nothing needs to change.
"use strict";
const KEY = "SWIFT_ACTIVE_COMPILATION_CONDITIONS";

function setSwiftFlag(pbx, marker, flag, on) {
  let changed = false;
  const text = pbx.replace(/(isa = XCBuildConfiguration;\s*buildSettings = \{)([\s\S]*?)(\n(\s*)\};\s*\n\s*name = )/g, (all, head, body, tail) => {
    if (!body.includes(marker)) return all;
    const next = editBody(body, flag, on);
    if (next === body) return all;
    changed = true;
    return head + next + tail;
  });
  return {text, changed};
}

function editBody(body, flag, on) {
  const indent = (/\n(\s+)\S/.exec(body) || [, "\t\t\t\t"])[1];
  // a list: KEY = ( DEBUG, "$(inherited)", );
  const list = new RegExp("(\\n\\s*" + KEY + " = \\()([\\s\\S]*?)(\\);)").exec(body);
  if (list) {
    const items = list[2].split(",").map(x => x.trim()).filter(Boolean);
    const has = items.some(x => x.replace(/"/g, "") === flag);
    if (has === on) return body;
    const out = on ? items.concat(flag) : items.filter(x => x.replace(/"/g, "") !== flag);
    return body.replace(list[0], list[1] + "\n" + out.map(x => indent + "\t" + x + ",").join("\n") + "\n" + indent + list[3]);
  }
  // one string: KEY = "DEBUG $(inherited)"; or KEY = DEBUG;
  const one = new RegExp("\\n(\\s*)" + KEY + " = (\"[^\"]*\"|[^;\\s]+);").exec(body);
  if (one) {
    const words = one[2].replace(/^"|"$/g, "").split(/\s+/).filter(Boolean);
    const has = words.includes(flag);
    if (has === on) return body;
    const out = on ? words.concat(flag) : words.filter(w => w !== flag);
    if (!out.length || (!on && out.length === 1 && out[0] === "$(inherited)")) return body.replace(one[0], "");
    return body.replace(one[0], "\n" + one[1] + KEY + " = \"" + out.join(" ") + "\";");
  }
  if (!on) return body;
  return "\n" + indent + KEY + " = \"$(inherited) " + flag + "\";" + body;
}

module.exports = {setSwiftFlag};
