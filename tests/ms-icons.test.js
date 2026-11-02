// Microsoft's Office app icons are shown exactly as Microsoft made them: src/js/01-ms-icons.js must be what
// scripts/gen-ms-icons.js makes from vendor/microsoft-office-icons/, and each data: URI must decode to the file byte for byte
"use strict";
const fs = require("fs"), path = require("path"), assert = require("assert"), cp = require("child_process");
const root = path.join(__dirname, ".."), dir = path.join(root, "vendor", "microsoft-office-icons"), gen = path.join(root, "src", "js", "01-ms-icons.js");
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const src = fs.readFileSync(gen, "utf8");
const MS_ICON = new Function(src + ";return MS_ICON;")();
const FILES = {onenote: "onenote", word: "word", excel: "excel", ppt: "powerpoint"};
for (const [k, f] of Object.entries(FILES)) for (const s of [20, 32]) {
  const uri = MS_ICON[k]["s" + s], file = fs.readFileSync(path.join(dir, `${f}_${s}x1.svg`));
  ok(uri.startsWith("data:image/svg+xml;base64,"), `${k} ${s}: a data URI`);
  ok(Buffer.from(uri.split(",")[1], "base64").equals(file), `${k} ${s}: byte for byte Microsoft's file`);
  ok(!/<script|on\w+=|href=/i.test(file.toString()), `${k} ${s}: the file has no scripts or links`);
}
ok(fs.existsSync(path.join(dir, "microsoft_fabric_assets_license_agreement_nov_2019.pdf")) && fs.existsSync(path.join(dir, "README.md")), "the license and README are kept with the icons");
// regenerating changes nothing (nobody edited the generated file by hand)
const before = src; cp.execFileSync(process.execPath, [path.join(root, "scripts", "gen-ms-icons.js")], {stdio: "ignore"});
ok(fs.readFileSync(gen, "utf8") === before, "src/js/01-ms-icons.js is current: run node scripts/gen-ms-icons.js");
console.log(`ms-icons.test: ${n} checks passed`);
