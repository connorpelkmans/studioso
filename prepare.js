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
const out = path.join(root, "app"), vendor = path.join(out, "vendor");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(vendor, "fonts"), { recursive: true });
const nm = p => path.join(root, "node_modules", p);
const copy = (from, to) => fs.copyFileSync(nm(from), path.join(vendor, to));

copy("@supabase/supabase-js/dist/umd/supabase.js", "supabase.js");
copy("pdfjs-dist/build/pdf.min.js", "pdf.min.js");
copy("pdfjs-dist/build/pdf.worker.min.js", "pdf.worker.min.js");

const faces = [["Lexend", "lexend", [400, 500, 600, 700, 800]], ["Atkinson Hyperlegible Next", "atkinson-hyperlegible-next", [400, 500, 700]], ["Atkinson Hyperlegible", "atkinson-hyperlegible", [400, 700]]];
let css = "";
for (const [family, pkg, weights] of faces) for (const w of weights) {
  const f = `${pkg}-latin-${w}-normal.woff2`;
  fs.copyFileSync(nm(`@fontsource/${pkg}/files/${f}`), path.join(vendor, "fonts", f));
  css += `@font-face{font-family:"${family}";font-style:normal;font-weight:${w};font-display:swap;src:url(fonts/${f}) format("woff2")}\n`;
}
fs.writeFileSync(path.join(vendor, "fonts.css"), css);

let html = fs.readFileSync(src, "utf8");
const swaps = [
  [/<link rel="preconnect" href="https:\/\/fonts\.(googleapis|gstatic)\.com"[^>]*>\s*/g, ""],
  [/<link href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]+" rel="stylesheet">/, '<link href="vendor/fonts.css" rel="stylesheet">'],
  ["https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js", "vendor/supabase.js"],
  ["https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js", new URL("vendor/pdf.worker.min.js", "app://studioso/").href],
  ["https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js", "vendor/pdf.min.js"]
];
for (const [a, b] of swaps) {
  const before = html;
  html = typeof a === "string" ? html.split(a).join(b) : html.replace(a, b);
  if (html === before && !(a instanceof RegExp && a.global)) throw new Error("prepare: couldn't find " + a);
}
fs.writeFileSync(path.join(out, "index.html"), html);

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
  stage("widget", ["widget.html", "widget.css", "widget.js", { from: "widget-preload.js", to: "widget-preload.js" }]);
  stage("build", ["icon.ico", "icon.png", "icon.icns", "installerSidebar.bmp", "uninstallerSidebar.bmp", "installerHeader.bmp"]);
}
console.log("Prepared app/ from", src);
