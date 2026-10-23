const fs = require("fs"), path = require("path");
const flat = fs.existsSync(path.join(__dirname, "main.js")) && fs.existsSync(path.join(__dirname, "index.html"));
const root = flat ? __dirname : path.join(__dirname, "..");
const src = path.resolve(process.argv[2] || (flat ? path.join(root, "index.html") : path.join(root, "..", "index.html")));
// STUDYBOARD_OUT (a folder inside this project, default app/) and STUDYBOARD_BASE
const out = process.env.STUDYBOARD_OUT ? path.resolve(root, process.env.STUDYBOARD_OUT) : path.join(root, "app"), vendor = path.join(out, "vendor");
if (!out.startsWith(root + path.sep)) throw new Error("prepare: STUDYBOARD_OUT must be a folder inside " + root);
const BASE = process.env.STUDYBOARD_BASE || "app://studioso/";
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(vendor, "fonts"), { recursive: true });
const nm = p => path.join(root, "node_modules", p);
const copy = (from, to) => fs.copyFileSync(nm(from), path.join(vendor, to));

// The same file the website serves
const vendoredSb = path.join(root, "vendor", "supabase-js-2.117.2.umd.js");
if (fs.existsSync(vendoredSb)) fs.copyFileSync(vendoredSb, path.join(vendor, "supabase-js-2.117.2.umd.js"));
else copy("@supabase/supabase-js/dist/umd/supabase.js", "supabase-js-2.117.2.umd.js");
// fzstd (MIT) unpacks newer Anki files in Import From Another App
for (const f of ["fzstd-0.1.1.umd.js", "fzstd-LICENSE.txt"]) fs.copyFileSync(path.join(root, "vendor", f), path.join(vendor, f));
// PDF.js is loaded by index.html with import() from vendor/pdfjs/
fs.mkdirSync(path.join(vendor, "pdfjs"), { recursive: true });
copy("pdfjs-dist/legacy/build/pdf.min.mjs", "pdfjs/pdf.min.mjs");
copy("pdfjs-dist/legacy/build/pdf.worker.min.mjs", "pdfjs/pdf.worker.min.mjs");
copy("pdfjs-dist/LICENSE", "pdfjs/LICENSE");

const faces = [["Lexend", "lexend", [400, 500, 600, 700, 800]], ["Atkinson Hyperlegible Next", "atkinson-hyperlegible-next", [400, 500, 700]], ["Atkinson Hyperlegible", "atkinson-hyperlegible", [400, 700]], ["Permanent Marker", "permanent-marker", [400]], ["Patrick Hand", "patrick-hand", [400]], ["Caveat", "caveat", [400]], ["Kalam", "kalam", [400]], ["Gochi Hand", "gochi-hand", [400]]];
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
// The page loads its code and styles from bundle/
const AF = require(fs.existsSync(path.join(root, "scripts", "app-files.js")) ? path.join(root, "scripts", "app-files.js") : path.join(root, "..", "scripts", "app-files.js"));
const srcDir = path.dirname(src), parts = AF.refs(html).map(n => "bundle/" + n), files = new Map(parts.map(p => [p, fs.readFileSync(path.join(srcDir, p), "utf8")]));
const readPart = p => files.get(p);
const swaps = [
  [/<link rel="preconnect" href="https:\/\/fonts\.(googleapis|gstatic)\.com"[^>]*>\s*/g, ""],
  [/<link href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]+" rel="stylesheet">/g, '<link href="vendor/fonts.css" rel="stylesheet">'],
  ["https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js", "vendor/supabase-js-2.117.2.umd.js"]
];
for (const [a, b] of swaps) {
  let hit = false;
  const swap = t => { const next = typeof a === "string" ? t.split(a).join(b) : t.replace(a, b); if (next !== t) hit = true; return next; };
  html = swap(html);
  for (const [p, t] of files) files.set(p, swap(t));
  if (!hit && !(a instanceof RegExp && a.global)) throw new Error("prepare: couldn't find " + a);
}
// Crash reports
const bid = require("./build-id.js");
if (!parts.length) html = bid.stamp(html);
else {
  // the id is taken over the whole page (as one piece)
  const id = bid.idOf(AF.inline(html, readPart));
  for (const [p, t] of files) if (/const BUILD_ID = "[^"]*";/.test(t)) files.set(p, t.replace(/const BUILD_ID = "[^"]*";/, () => `const BUILD_ID = "${id}";`));
}
{
  const whole = parts.length ? AF.inline(html, readPart) : html;
  const pick = re => (re.exec(whole) || [])[1] || "";
  const core = whole.slice(whole.indexOf("/*ERRREPORT-START*/"), whole.indexOf("/*ERRREPORT-END*/"));
  if (!core) console.warn("prepare: crash-report core not found in the page; main-process reports are off");
  else fs.writeFileSync(path.join(out, "errreport-core.js"), core + "\nmodule.exports = ERRCORE;\n");
  fs.writeFileSync(path.join(out, "error-config.json"), JSON.stringify({ dsn: pick(/const ERROR_REPORTING = \{\s*dsn: "([^"]*)"/), environment: pick(/environment: "([^"]*)"/), release: pick(/const APP_VERSION = "([^"]+)"/), build: pick(/const BUILD_ID = "([^"]+)"/), minidump: process.env.STUDYBOARD_MINIDUMP_URL || "" }));
}
for (const [p, t] of files) { fs.mkdirSync(path.dirname(path.join(out, p)), { recursive: true }); fs.writeFileSync(path.join(out, p), t); }
if (parts.length) html = AF.stamp(html, readPart);
{
  const cspJs = [path.join(root, "scripts", "csp.js"), path.join(root, "..", "scripts", "csp.js")].find(f => fs.existsSync(f));
  if (cspJs) html = require(cspJs).apply(html);
  else console.warn("prepare: scripts/csp.js not found; the page's own CSP hashes may be stale");
}
// The iPhone and Android apps
{
  const lmsBuild = path.join(root, "scripts", "build-lms-mobile.js");
  if (process.env.STUDYBOARD_OUT && fs.existsSync(lmsBuild) && fs.existsSync(path.join(root, "lms.js"))) {
    require(lmsBuild).build(path.join(out, "lms-mobile.js"));
    if (!html.includes("lms-mobile.js")) html = html.replace("<head>", '<head>\n<script src="lms-mobile.js"></script>');
  }
}
fs.writeFileSync(path.join(out, "index.html"), html);

// Content-Security-Policy support for the desktop app
const crypto = require("crypto");
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => "sha256-" + crypto.createHash("sha256").update(m[1].replace(/\r\n?/g, "\n"), "utf8").digest("base64"));
const markup = html.replace(/<script[\s\S]*?<\/script>/gi, "");
if (/<script\b[^>]*\ssrc=["']https?:/i.test(markup)) console.warn("prepare: a script is still loaded from the network; the app's CSP will block it");
if (/<script\b(?![^>]*\ssrc=)[^>]+>/i.test(html.replace(/<script>[\s\S]*?<\/script>/gi, "<!--s-->"))) console.warn("prepare: a script tag with attributes is not covered by the CSP hashes");
if (/<[a-z][^>]*\son(click|load|error|change|input|submit|keydown|keyup|mouse\w+)=["']/i.test(markup)) console.warn("prepare: inline event handlers (onclick=...) are blocked by the app's CSP");
fs.writeFileSync(path.join(out, "csp-hashes.json"), JSON.stringify(inline));
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
  // Microsoft Store (MSIX) tiles and logos (tools/make-appx-assets.py)
  const appxSrc = path.join(root, "build-resources", "appx");
  if (fs.existsSync(appxSrc)) fs.cpSync(appxSrc, path.join(root, "build", "appx"), { recursive: true });
  else console.warn("prepare: build-resources/appx missing; a Microsoft Store build would use electron-builder's sample tiles");
}
console.log("Build id " + (/const BUILD_ID = "([^"]+)"/.exec(parts.length ? AF.inline(html, readPart) : html) || [])[1] + ".");
console.log("Prepared app/ from", src, `(${inline.length} inline scripts hashed for the CSP)`);
