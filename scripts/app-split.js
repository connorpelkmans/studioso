#!/usr/bin/env node
// The reverse of scripts/app-files.js source(): takes the app as one page (its styles in one <style>, its code in one script) and writes it
// back as src/css/*.css and src/js/*.js (cut at the "/* ===== module: NAME =====" lines), src/app.json (their order) and index.html, then
// builds bundle/. For tools that edit the app as one piece (tools/insert-theme-batches.py): bundle, edit, split.
// A new module line makes a new file; a section that is gone loses its file.
//
//   node scripts/app-split.js one-page.html
//
// Files loaded later ("lazy" in src/app.json, e.g. the scene library) appear in the one-page form as their own <script> blocks just before
// the app's script; they go back to their sections the same way.
"use strict";
const fs = require("fs"), path = require("path");
const AF = require("./app-files"), ROOT = AF.ROOT;

const nameOf = line => line.replace(/^\/\* ===== module: /, "").replace(/[ :][\s\S]*$/, "").trim();
function cut(body, ext, firstName){
  const at = [...body.matchAll(/^\/\* ===== module: [^\n]*/gm)].map(m => ({i: m.index, name: nameOf(m[0])}));
  const starts = [{i: 0, name: firstName}].concat(at), out = [];
  for (let k = 0; k < starts.length; k++) {
    const s = starts[k].i, e = k + 1 < starts.length ? starts[k + 1].i : body.length, t = body.slice(s, e);
    if (k === 0 && !t.length) continue;
    out.push({name: starts[k].name.replace(/\.(js|css)$/, "") + "." + ext, text: t});
  }
  return out;
}

// page: the one-page form. Returns {shell, manifest, files: Map(src path -> text)} without writing anything.
function parse(page, oldManifest){
  const so = page.indexOf("<style>"), sc = page.indexOf("</style>", so);
  const jo = page.lastIndexOf("<script>"), jc = page.lastIndexOf("</script>");
  if (so < 0 || sc < 0 || jo < 0 || jc < jo) throw new Error("app-split: expected one <style> and the app's script");
  const inner = page.slice(jo + 8, jc), pre = AF.INLINE_JS_PRE + AF.APP_HEAD, post = AF.APP_TAIL + AF.INLINE_JS_POST;
  if (!inner.startsWith(pre) || !inner.endsWith(post)) throw new Error("app-split: the app's script isn't in its usual wrapper");
  // lazy files: the <script> blocks right before the app's script, in src/app.json's order
  const lazyNames = Object.keys((oldManifest && oldManifest.lazy) || {}), lazyBodies = [];
  let start = jo;
  for (let k = lazyNames.length - 1; k >= 0; k--) {
    const end = page.lastIndexOf("</script>\n", start), open = page.lastIndexOf("<script>", end);
    if (end < 0 || open < 0 || end + 10 !== start) throw new Error("app-split: expected the lazy file " + lazyNames[k] + " before the app's script");
    lazyBodies.unshift(page.slice(open + 8, end)); start = open;
  }
  const css = cut(page.slice(so + 7, sc), "css", "00-base"), js = cut(inner.slice(pre.length, inner.length - post.length), "js", "00-core");
  const files = new Map(), manifest = {css: [], js: [], lazy: {}};
  for (const f of css) { files.set("src/css/" + f.name, f.text); manifest.css.push(f.name); }
  for (const f of js) { files.set("src/js/" + f.name, f.text); manifest.js.push(f.name); }
  lazyNames.forEach((n, k) => { manifest.lazy[n] = []; for (const f of cut(lazyBodies[k], "js", n.replace(/\.js$/, ""))) { if (files.has("src/js/" + f.name)) throw new Error("app-split: two sections named " + f.name); files.set("src/js/" + f.name, f.text); manifest.lazy[n].push(f.name); } });
  const names = [...files.keys()]; if (new Set(names).size !== names.length) throw new Error("app-split: two sections share a name");
  const shell = page.slice(0, so) + '<link rel="stylesheet" href="bundle/app.css?v=">' + page.slice(sc + 8, start) + '<script src="bundle/app.js?v="></script>' + page.slice(jc + 9);
  return {shell, manifest, files};
}

function split(page, opts = {}){
  const old = fs.existsSync(path.join(ROOT, "src", "app.json")) ? AF.manifest() : {css: [], js: [], lazy: {}};
  const r = parse(page, old);
  if (opts.dry) return r;
  for (const [p, t] of r.files) { const f = path.join(ROOT, p); fs.mkdirSync(path.dirname(f), {recursive: true}); if (!fs.existsSync(f) || fs.readFileSync(f, "utf8") !== t) fs.writeFileSync(f, t); }
  for (const p of AF.srcFiles(old)) if (!r.files.has(p) && fs.existsSync(path.join(ROOT, p))) fs.unlinkSync(path.join(ROOT, p));
  fs.writeFileSync(path.join(ROOT, "src", "app.json"), JSON.stringify(r.manifest, null, 1) + "\n");
  AF.build();
  // index.html: the page with its two tags back (references to lazy files in its start-up script come through unchanged, and get fresh ?v= hashes)
  fs.writeFileSync(path.join(ROOT, "index.html"), require("./csp").apply(AF.stamp(r.shell)));
  return r;
}
module.exports = {split, parse, cut};

if (require.main === module) {
  const f = process.argv[2];
  if (!f) { console.error("usage: node scripts/app-split.js one-page.html"); process.exit(2); }
  const r = split(fs.readFileSync(path.resolve(f), "utf8"));
  console.log(`app-split: wrote index.html, src/app.json and ${r.files.size} files in src/`);
}
