// node tools/extract-i18n.js [--check]
// Collects every tr("key", "English") / trn("key", n, "one|other") call (and data-i18n attributes) in index.html into locales/en.json.
// --check: exit 1 if locales/en.json is out of date, or if a key is used with two different English texts, or a locale file has keys that no longer exist.
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, ".."), src = fs.readFileSync(path.join(root, "index.html"), "utf8");
const found = {}, clash = [];
const unq = (q, s) => s.replace(/\\(["'`\\])/g, "$1").replace(/\\n/g, "\n");
const add = (k, en) => { if (found[k] != null && found[k] !== en) clash.push(`${k}: "${found[k]}" vs "${en}"`); found[k] = en; };
const STR = String.raw`("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')`;
let m;
const reTr = new RegExp(String.raw`(?<![\w.$])tr\(\s*${STR}\s*,\s*${STR}`, "g");
while ((m = reTr.exec(src))) add(unq(m[1][0], m[1].slice(1, -1)), unq(m[2][0], m[2].slice(1, -1)));
const reTrn = new RegExp(String.raw`(?<![\w.$])trn\(\s*${STR}\s*,\s*[^,]+,\s*${STR}`, "g");
while ((m = reTrn.exec(src))) add(unq(m[1][0], m[1].slice(1, -1)), unq(m[2][0], m[2].slice(1, -1)));
const reAttr = /data-i18n(-aria)?="([\w.]+)"[^>]*?>([^<]*)/g;
const reAria = /data-i18n-aria="([\w.]+)"[^>]*?aria-label="([^"]*)"/g;
while ((m = reAria.exec(src))) add(m[1], m[2]);
const reTxt = /<button[^>]*data-i18n="([\w.]+)"[^>]*>(?:<svg[\s\S]*?<\/svg>)?([^<]+)</g;
while ((m = reTxt.exec(src))) add(m[1], m[2].trim());
const sorted = Object.fromEntries(Object.keys(found).sort().map(k => [k, found[k]]));
const out = path.join(root, "locales", "en.json"), text = JSON.stringify(sorted, null, 2) + "\n";
if (process.argv.includes("--check")) {
  let bad = 0;
  if (clash.length) { console.error("Same key, different English:\n  " + clash.join("\n  ")); bad = 1; }
  if (!fs.existsSync(out) || fs.readFileSync(out, "utf8") !== text) { console.error("locales/en.json is out of date. Run: node tools/extract-i18n.js"); bad = 1; }
  for (const f of fs.readdirSync(path.join(root, "locales"))) {
    if (f === "en.json" || !f.endsWith(".json")) continue;
    const c = JSON.parse(fs.readFileSync(path.join(root, "locales", f), "utf8"));
    const extra = Object.keys(c).filter(k => !(k in sorted)); if (extra.length) { console.error(`${f} has keys that no longer exist: ${extra.join(", ")}`); bad = 1; }
  }
  if (!bad) console.log(`i18n ok: ${Object.keys(sorted).length} strings`);
  process.exit(bad);
} else { fs.writeFileSync(out, text); console.log(`wrote locales/en.json: ${Object.keys(sorted).length} strings`); }
