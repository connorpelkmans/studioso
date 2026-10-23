#!/usr/bin/env node
// The app page's code and styles live in src/, one file per section, so each part is easy to find and change:
//   src/css/NN-name.css    the styles, in the order src/app.json lists them
//   src/js/NN-name.js      the code, in the order src/app.json lists them (the files share one scope: together they are one function body)
//   src/app.json           that order, plus the files loaded only when needed ("lazy")
// The browser loads files built from them (bundle/, made by this script; don't edit those by hand):
//   bundle/app.css         every style file, in order
//   bundle/app.js          every code file, in order, inside the one function the app has always run in (so it runs exactly as before)
//   bundle/<lazy>.js       a file loaded later, only when it's needed (the scene library: only when a scene theme is drawn)
// index.html names them with ?v= and a hash of their content, so browsers and the offline copy (sw.js) fetch a file again only when it changed.
//
//   node scripts/app-files.js            build bundle/ from src/ and refresh index.html's ?v= hashes (scripts/csp.js runs this too)
//   node scripts/app-files.js --check    exit 1 if bundle/ or a ?v= hash is out of date with src/
//   node scripts/app-files.js --bundle out.html   write the whole app as one page, the way index.html used to be
//   node scripts/app-files.js --where app.js:16336   which src/ file and line a line of a bundle/ file comes from (for error reports)
//
//   require("./scripts/app-files")
//     .source()          the whole app as one page (styles inline, the code inline): tests and tools that read the app's code use this
//     .build()           write bundle/ from src/ (returns the names of the files that changed)
//     .stamp(html)       html with fresh ?v= hashes for every bundle/ file it names
//     .inline(html, read) the one-page form of a page (read(path) -> text; default: from this folder)
//     .fileWith(text)    {path, file, text} of the src/ file that contains `text`
//     .manifest(), .srcFiles()
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const ROOT = path.join(__dirname, "..");
const MANIFEST = path.join(ROOT, "src", "app.json");
// The code's wrapper, as it has always been: one strict function around every section.
const APP_HEAD = '(function(){\n"use strict";\n', APP_TAIL = "})();\n";
// The one-page form: <script> + "\n" + bundle/app.js + "\n\n" + </script>, exactly the page before the split.
const INLINE_JS_PRE = "\n", INLINE_JS_POST = "\n\n";
const REF = /bundle\/([A-Za-z0-9._-]+)\?v=[0-9a-f]*/g;

const readRoot = p => fs.readFileSync(path.join(ROOT, p), "utf8");
const hash = s => crypto.createHash("sha256").update(String(s).replace(/\r\n?/g, "\n"), "utf8").digest("hex").slice(0, 10);
const manifest = () => JSON.parse(fs.readFileSync(MANIFEST, "utf8"));

// What each bundle/ file is made of: {"app.css": [...], "app.js": [...], "<lazy>.js": [...]}
function plan(m = manifest()){
  const out = {"app.css": m.css.map(n => "src/css/" + n), "app.js": m.js.map(n => "src/js/" + n)};
  for (const [name, parts] of Object.entries(m.lazy || {})) out[name] = parts.map(n => "src/js/" + n);
  return out;
}
const srcFiles = (m = manifest()) => [].concat(...Object.values(plan(m)));
function built(name, read = readRoot, m = manifest()){
  const body = plan(m)[name].map(read).join("");
  return name === "app.js" ? APP_HEAD + body + APP_TAIL : body;
}
function build(){
  const changed = [], m = manifest();
  fs.mkdirSync(path.join(ROOT, "bundle"), {recursive: true});
  for (const name of Object.keys(plan(m))) {
    const f = path.join(ROOT, "bundle", name), text = built(name, readRoot, m);
    if (!fs.existsSync(f) || fs.readFileSync(f, "utf8") !== text) { fs.writeFileSync(f, text); changed.push(name); }
  }
  // a bundle file no section makes any more
  for (const f of fs.readdirSync(path.join(ROOT, "bundle"))) if (!plan(m)[f]) { fs.unlinkSync(path.join(ROOT, "bundle", f)); changed.push(f + " (removed)"); }
  return changed;
}
const refs = html => [...new Set([...String(html).matchAll(REF)].map(x => x[1]))];
// The scene names index.html's start-up script lists (/*SCENE-IDS*/"..."): every scene in bundle/scenes.js, plus the theme ids that draw one
// of them under another name (SCENE_ALIAS in 20-scenes.js). It loads the library early when the saved theme is one of these.
const idCache = new Map();
function sceneIds(read = readRoot){
  const lib = read("bundle/scenes.js"), key = hash(lib) + hash(read("bundle/app.js"));
  if (idCache.has(key)) return idCache.get(key);
  const vm = require("vm"), ctx = {Path2D: function () {}, Math, console: {log(){}, warn(){}, error(){}}};
  vm.createContext(ctx);
  vm.runInContext(lib + "\n;globalThis.__ids = Object.keys(SCN20_LIB.SCENES);", ctx, {filename: "bundle/scenes.js"});
  const alias = ((/const SCENE_ALIAS = \{([^}]*)\}/.exec(read("bundle/app.js")) || [])[1] || "").match(/[A-Za-z0-9_]+(?=\s*:)/g) || [];
  const ids = [...new Set([...ctx.__ids].concat(alias))].sort().join(" ");
  idCache.set(key, ids);
  return ids;
}
function stamp(html, read = readRoot){
  let out = String(html).replace(REF, (all, name) => "bundle/" + name + "?v=" + hash(read("bundle/" + name)));
  if (out.includes("/*SCENE-IDS*/")) out = out.replace(/\/\*SCENE-IDS\*\/"[^"]*"/, () => '/*SCENE-IDS*/"' + sceneIds(read) + '"');
  return out;
}
// The one-page form: app.css inline as <style>, every lazy file and app.js inline as scripts (the lazy ones first, as if already loaded).
function inline(html, read = readRoot){
  let out = String(html);
  out = out.replace(/<link rel="stylesheet" href="bundle\/app\.css\?v=[0-9a-f]*">/, () => "<style>" + read("bundle/app.css") + "</style>");
  const lazy = refs(out).filter(n => n !== "app.css" && n !== "app.js");
  out = out.replace(/<script src="bundle\/app\.js\?v=[0-9a-f]*"><\/script>/, () =>
    lazy.map(n => "<script>" + read("bundle/" + n) + "</script>\n").join("") + "<script>" + INLINE_JS_PRE + read("bundle/app.js") + INLINE_JS_POST + "</script>");
  return out;
}
const source = () => inline(readRoot("index.html"));
function fileWith(text){
  for (const p of srcFiles()) { const t = readRoot(p); if (t.includes(text)) return {path: p, file: path.join(ROOT, p), text: t}; }
  return null;
}
// bundle/<name> line N (1-based) -> {path: "src/js/...", line}; null for the wrapper lines
function where(name, line, read = readRoot){
  let at = name === "app.js" ? APP_HEAD.split("\n").length : 1;   // the first line of the first file
  for (const p of plan()[name] || []) {
    const n = read(p).split("\n").length - 1;   // each file ends with a newline, so it adds n lines
    if (line < at + n) return {path: p, line: line - at + 1};
    at += n;
  }
  return null;
}
function problems(html = readRoot("index.html")){
  const out = [], m = manifest();
  for (const p of srcFiles(m)) if (!fs.existsSync(path.join(ROOT, p))) out.push("missing: " + p);
  if (out.length) return out;
  for (const name of Object.keys(plan(m))) {
    const f = path.join(ROOT, "bundle", name);
    if (!fs.existsSync(f) || fs.readFileSync(f, "utf8") !== built(name, readRoot, m)) out.push("bundle/" + name + " is out of date with src/. Run: node scripts/csp.js");
  }
  for (const n of refs(html)) if (!plan(m)[n]) out.push("index.html names bundle/" + n + ", which src/app.json doesn't make");
  for (const [n, parts] of Object.entries(m.lazy || {})) if (n === "scenes.js" && !parts.some(p => /\bvar SCN20_LIB = \(function/.test(readRoot("src/js/" + p))))
    out.push("src/js/" + parts[0] + " must define var SCN20_LIB (it's loaded on its own; the app reaches it through SCN20 in 20-scenes-load.js). A regenerated library starting with const SCN20 = needs that one line changed back");
  if (!out.length && stamp(html) !== html) out.push("index.html's ?v= hashes are stale. Run: node scripts/csp.js");
  return out;
}
module.exports = {manifest, plan, srcFiles, built, build, refs, stamp, sceneIds, where, inline, source, fileWith, problems, hash, APP_HEAD, APP_TAIL, INLINE_JS_PRE, INLINE_JS_POST, ROOT};

if (require.main === module) {
  const a = process.argv.slice(2), file = path.join(ROOT, "index.html");
  if (a.includes("--check")) { const p = problems(); if (p.length) { console.error("app-files: " + p.join("\n  ")); process.exit(1); } console.log("app-files: bundle/ and the ?v= hashes are current"); }
  else if (a.includes("--where")) {
    const m = /^(?:bundle\/)?([^:]+):(\d+)/.exec(a[a.indexOf("--where") + 1] || "");
    const w = m && where(m[1], Number(m[2]));
    console.log(w ? `${w.path}:${w.line}` : "app-files: not a line of a bundle file (give e.g. app.js:16336)");
  }
  else if (a.includes("--bundle")) { const o = a[a.indexOf("--bundle") + 1]; fs.writeFileSync(path.resolve(o), source()); console.log("app-files: wrote " + o); }
  else {
    const changed = build(), html = fs.readFileSync(file, "utf8"), next = stamp(html);
    if (next !== html) fs.writeFileSync(file, next);
    console.log("app-files: " + (changed.length ? "built " + changed.join(", ") : "bundle/ already current") + (next !== html ? "; updated index.html" : ""));
  }
}
