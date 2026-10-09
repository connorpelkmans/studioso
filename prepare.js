// Copies the Studioso page into app/ and points it at local copies of its fonts and libraries,
// so the desktop app opens and works with no internet connection.
// Usage: node prepare.js [path to index.html]
// Works from two layouts:
//  - flat (this repository): prepare.js sits next to index.html, main.js, widget.* and the icon files.
//    It also stages widget/ and build/ from those flat files, so `npm run prep|start|dist` work as they are.
//  - nested: prepare.js is in desktop/scripts/ and the page is one folder above desktop/ (default ../index.html).
const fs = require("fs"), path = require("path");
const flat = fs.existsSync(path.join(__dirname, "main.js")) && fs.existsSync(path.join(__dirname, "index.html"));
const root = flat ? __dirname : path.join(__dirname, "..");
const src = path.resolve(process.argv[2] || (flat ? path.join(root, "index.html") : path.join(root, "..", "index.html")));
// STUDYBOARD_OUT (a folder inside this project, default app/) and STUDYBOARD_BASE (the page's own address, default app://studioso/) let the same
// script stage the iOS wrapper's web folder: STUDYBOARD_OUT=ios-www STUDYBOARD_BASE=capacitor://localhost/ node prepare.js (see ios-wrapper/README-IOS.md).
const out = process.env.STUDYBOARD_OUT ? path.resolve(root, process.env.STUDYBOARD_OUT) : path.join(root, "app"), vendor = path.join(out, "vendor");
if (!out.startsWith(root + path.sep)) throw new Error("prepare: STUDYBOARD_OUT must be a folder inside " + root);
const BASE = process.env.STUDYBOARD_BASE || "app://studioso/";
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(vendor, "fonts"), { recursive: true });
const nm = p => path.join(root, "node_modules", p);
const copy = (from, to) => fs.copyFileSync(nm(from), path.join(vendor, to));

// The same file the website serves (vendor/ next to index.html, verified against its SRI hash in index.html); fall back to the npm package.
const vendoredSb = path.join(root, "vendor", "supabase-js-2.117.2.umd.js");
if (fs.existsSync(vendoredSb)) fs.copyFileSync(vendoredSb, path.join(vendor, "supabase-js-2.117.2.umd.js"));
else copy("@supabase/supabase-js/dist/umd/supabase.js", "supabase-js-2.117.2.umd.js");
// PDF.js is loaded by index.html with import() from vendor/pdfjs/ (the same relative path the web page uses), so no URL rewrite is needed.
// The legacy build (ES modules plus polyfills for older WebViews) is staged from the installed package, and must match the copy committed in vendor/pdfjs/.
fs.mkdirSync(path.join(vendor, "pdfjs"), { recursive: true });
copy("pdfjs-dist/legacy/build/pdf.min.mjs", "pdfjs/pdf.min.mjs");
copy("pdfjs-dist/legacy/build/pdf.worker.min.mjs", "pdfjs/pdf.worker.min.mjs");
copy("pdfjs-dist/LICENSE", "pdfjs/LICENSE");

const faces = [["Lexend", "lexend", [400, 500, 600, 700, 800]], ["Atkinson Hyperlegible Next", "atkinson-hyperlegible-next", [400, 500, 700]], ["Atkinson Hyperlegible", "atkinson-hyperlegible", [400, 700]]];
let css = "";
for (const [family, pkg, weights] of faces) for (const w of weights) {
  const f = `${pkg}-latin-${w}-normal.woff2`;
  fs.copyFileSync(nm(`@fontsource/${pkg}/files/${f}`), path.join(vendor, "fonts", f));
  css += `@font-face{font-family:"${family}";font-style:normal;font-weight:${w};font-display:swap;src:url(fonts/${f}) format("woff2")}\n`;
}
fs.writeFileSync(path.join(vendor, "fonts.css"), css);

// Language catalogs (locales/*.json) are fetched by the page on demand
if (fs.existsSync(path.join(root, "locales"))) {
  fs.mkdirSync(path.join(out, "locales"), { recursive: true });
  for (const f of fs.readdirSync(path.join(root, "locales"))) if (f.endsWith(".json") && f !== "en.json") fs.copyFileSync(path.join(root, "locales", f), path.join(out, "locales", f));
}

let html = fs.readFileSync(src, "utf8");
const swaps = [
  [/<link rel="preconnect" href="https:\/\/fonts\.(googleapis|gstatic)\.com"[^>]*>\s*/g, ""],
  [/<link href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]+" rel="stylesheet">/g, '<link href="vendor/fonts.css" rel="stylesheet">'],
  ["https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js", "vendor/supabase-js-2.117.2.umd.js"]
];
for (const [a, b] of swaps) {
  const before = html;
  html = typeof a === "string" ? html.split(a).join(b) : html.replace(a, b);
  if (html === before && !(a instanceof RegExp && a.global)) throw new Error("prepare: couldn't find " + a);
}
// Crash reports: stamp the build id (version + hash of this exact file) into the staged page, and give main.js (the desktop app's own main process)
// the reporter settings and the same pure scrubbing / envelope code the page uses, so both send identical, scrubbed events. See ERROR-REPORTING.md.
const bid = require("./build-id.js");
html = bid.stamp(html);
{
  const pick = re => (re.exec(html) || [])[1] || "";
  const core = html.slice(html.indexOf("/*ERRREPORT-START*/"), html.indexOf("/*ERRREPORT-END*/"));
  if (!core) console.warn("prepare: crash-report core not found in the page; main-process reports are off");
  else fs.writeFileSync(path.join(out, "errreport-core.js"), core + "\nmodule.exports = ERRCORE;\n");
  fs.writeFileSync(path.join(out, "error-config.json"), JSON.stringify({ dsn: pick(/const ERROR_REPORTING = \{\s*dsn: "([^"]*)"/), environment: pick(/environment: "([^"]*)"/), release: pick(/const APP_VERSION = "([^"]+)"/), build: pick(/const BUILD_ID = "([^"]+)"/), minidump: process.env.STUDYBOARD_MINIDUMP_URL || "" }));
}
// The page's own CSP (a meta tag set by its first inline script) allows inline scripts by hash; the edits above (build id, local supabase) change
// script text, so the hashes are recomputed here from the final page. The header hashes below are then taken from this same final html.
{
  const cspJs = [path.join(root, "scripts", "csp.js"), path.join(root, "..", "scripts", "csp.js")].find(f => fs.existsSync(f));
  if (cspJs) html = require(cspJs).apply(html);
  else console.warn("prepare: scripts/csp.js not found; the page's own CSP hashes may be stale");
}
// The iPhone and Android apps (a staged STUDYBOARD_OUT folder) also get the school site layer: the same harvest scripts the desktop app runs, built from lms.js,
// loaded before the page. It only switches on when the native StudyboardLms plugin exists (see ios-wrapper/README-IOS.md, "School sites").
{
  const lmsBuild = path.join(root, "scripts", "build-lms-mobile.js");
  if (process.env.STUDYBOARD_OUT && fs.existsSync(lmsBuild) && fs.existsSync(path.join(root, "lms.js"))) {
    require(lmsBuild).build(path.join(out, "lms-mobile.js"));
    if (!html.includes("lms-mobile.js")) html = html.replace("<head>", '<head>\n<script src="lms-mobile.js"></script>');
  }
}
fs.writeFileSync(path.join(out, "index.html"), html);

// Content-Security-Policy support for the desktop app: main.js allows exactly these inline scripts (by SHA-256 hash) and no others.
// The page must keep working without inline event handlers (on...="") and with no script from the network, so both are checked here.
const crypto = require("crypto");
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => "sha256-" + crypto.createHash("sha256").update(m[1], "utf8").digest("base64"));
const markup = html.replace(/<script[\s\S]*?<\/script>/gi, "");          // the page's HTML without the code inside its scripts
if (/<script\b[^>]*\ssrc=["']https?:/i.test(markup)) console.warn("prepare: a script is still loaded from the network; the app's CSP will block it");
if (/<script\b(?![^>]*\ssrc=)[^>]+>/i.test(html.replace(/<script>[\s\S]*?<\/script>/gi, "<!--s-->"))) console.warn("prepare: a script tag with attributes is not covered by the CSP hashes");
if (/<[a-z][^>]*\son(click|load|error|change|input|submit|keydown|keyup|mouse\w+)=["']/i.test(markup)) console.warn("prepare: inline event handlers (onclick=...) are blocked by the app's CSP");
fs.writeFileSync(path.join(out, "csp-hashes.json"), JSON.stringify(inline));
// Flat layout: stage the widget window files and the icon / installer artwork into the folders electron-builder expects.
if (flat) {
  const stage = (dir, names) => {
    const d = path.join(root, dir);
    fs.rmSync(d, { recursive: true, force: true });
    fs.mkdirSync(d, { recursive: true });
    for (const n of names) {
      const from = path.join(root, n.from || n);
      if (!fs.existsSync(from)) { console.warn("prepare: missing " + (n.from || n) + ", skipped"); continue; }
      fs.copyFileSync(from, path.join(d, n.to || n));
    }
  };
  stage("widget", ["widget.html", "widget.css", "widget.js", { from: "widget-preload.js", to: "widget-preload.js" }, "shot.html", "shot.css", "shot.js", { from: "shot-preload.js", to: "shot-preload.js" }]);
  stage("build", ["icon.ico", "icon.png", "icon.icns", "installerSidebar.bmp", "uninstallerSidebar.bmp", "installerHeader.bmp"]);
  // Microsoft Store (MSIX) tiles and logos (tools/make-appx-assets.py). Without build/appx electron-builder packs its own sample images.
  const appxSrc = path.join(root, "build-resources", "appx");
  if (fs.existsSync(appxSrc)) fs.cpSync(appxSrc, path.join(root, "build", "appx"), { recursive: true });
  else console.warn("prepare: build-resources/appx missing; a Microsoft Store build would use electron-builder's sample tiles");
}
console.log("Build id " + (/const BUILD_ID = "([^"]+)"/.exec(html) || [])[1] + ".");
console.log("Prepared app/ from", src, `(${inline.length} inline scripts hashed for the CSP)`);
