// Merges the top-level keys of one plist into another (used by ios-stage.js for the iPhone app's Info.plist)
"use strict";
// Top-level <key>…</key><value> pairs of a plist's outer <dict> (comments dropped; values may be nested arrays/dicts)
function plistPairs(xml){
  const body = xml.replace(/<!--[\s\S]*?-->/g, ""), start = body.indexOf("<dict>"), out = [];
  if (start < 0) return out;
  let i = start + 6, depth = 0;
  const re = /<(\/?)(key|dict|array|string|integer|real|true|false|date|data)(\s*\/)?>/g;
  re.lastIndex = i;
  let key = null, valStart = -1, m;
  while ((m = re.exec(body))) {
    const close = m[1] === "/", tag = m[2], self = !!m[3] || tag === "true" || tag === "false" && !close;
    if (depth === 0 && !close && tag === "key") { const e = body.indexOf("</key>", m.index); key = body.slice(m.index + 5, e).trim(); re.lastIndex = e + 6; continue; }
    if (depth === 0 && close && tag === "dict") break;
    if (depth === 0 && !close && key != null && valStart < 0) valStart = m.index;
    if (tag === "dict" || tag === "array") { if (m[3]) {} else depth += close ? -1 : 1; }
    if (key != null && valStart >= 0 && depth === 0) {
      let end = re.lastIndex;
      if (!close && !m[3] && !["dict", "array", "true", "false"].includes(tag)) { const e = body.indexOf("</" + tag + ">", m.index); end = e + tag.length + 3; re.lastIndex = end; }
      out.push([key, body.slice(valStart, end)]); key = null; valStart = -1;
    }
  }
  return out;
}
function mergePlist(target, additions){
  const have = new Set(plistPairs(target).map(p => p[0])), added = [];
  const ins = plistPairs(additions).filter(([k]) => !have.has(k)).map(([k, v]) => { added.push(k); return "\t<key>" + k + "</key>\n\t" + v.trim(); }).join("\n");
  if (!ins) return {text: target, added};
  const at = target.lastIndexOf("</dict>");
  if (at < 0) throw new Error("ios-stage: Info.plist has no closing </dict>");
  return {text: target.slice(0, at) + ins + "\n" + target.slice(at), added};
}
module.exports = {plistPairs, mergePlist};
