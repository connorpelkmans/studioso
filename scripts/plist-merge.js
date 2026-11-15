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
// A list of strings already there (UIBackgroundModes, BGTaskSchedulerPermittedIdentifiers) gets the strings it's missing; other
// keys already there are kept as they are
const strings = v => /^<array>\s*(<string>[^<]*<\/string>\s*)*<\/array>$/.test(v.trim()) ? [...v.matchAll(/<string>([^<]*)<\/string>/g)].map(m => m[1]) : null;
function mergePlist(target, additions){
  const pairs = plistPairs(target), have = new Map(pairs.map(p => [p[0], p[1]])), added = [];
  for (const [k, v] of plistPairs(additions)) {
    if (!have.has(k)) continue;
    const mine = strings(have.get(k)), theirs = strings(v);
    if (!mine || !theirs) continue;
    const missing = theirs.filter(x => !mine.includes(x));
    if (!missing.length) continue;
    // the existing <array> of this key, found after its <key>, gets the missing strings before its </array>
    const ki = target.indexOf("<key>" + k + "</key>"), ai = target.indexOf("</array>", ki);
    if (ki < 0 || ai < 0) continue;
    target = target.slice(0, ai) + missing.map(x => "\t<string>" + x + "</string>\n\t").join("") + target.slice(ai);
    added.push(k + " (" + missing.join(", ") + ")");
  }
  const ins = plistPairs(additions).filter(([k]) => !have.has(k)).map(([k, v]) => { added.push(k); return "\t<key>" + k + "</key>\n\t" + v.trim(); }).join("\n");
  if (!ins) return {text: target, added};
  const at = target.lastIndexOf("</dict>");
  if (at < 0) throw new Error("ios-stage: Info.plist has no closing </dict>");
  return {text: target.slice(0, at) + ins + "\n" + target.slice(at), added};
}
module.exports = {plistPairs, mergePlist};
