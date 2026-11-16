// Every @keyframes name is defined once (or identically): CSS uses the last definition of a name, so a second, different one
// quietly replaces the first everywhere it's used. (Two cpFloat definitions made every floating companion fade in and out.)
const assert = require("assert"), fs = require("fs"), path = require("path");
const root = path.join(__dirname, ".."), defs = {};
const files = [...fs.readdirSync(path.join(root, "src/css")).map(f => "src/css/" + f), ...fs.readdirSync(path.join(root, "src/js")).map(f => "src/js/" + f)].filter(f => /\.(css|js)$/.test(f));
for (const f of files) {
  const s = fs.readFileSync(path.join(root, f), "utf8"), re = /@keyframes\s+([\w-]+)\s*\{/g; let m;
  while ((m = re.exec(s))) {
    let i = m.index + m[0].length, d = 1; while (i < s.length && d) { if (s[i] === "{") d++; else if (s[i] === "}") d--; i++; }
    const body = s.slice(m.index + m[0].length, i - 1).replace(/\s+/g, "");
    if (/\$\{/.test(m[1]) || /\$\{/.test(body)) continue; // built from template values at run time
    (defs[m[1]] = defs[m[1]] || []).push({at: `${f}:${s.slice(0, m.index).split("\n").length}`, body});
  }
}
const clash = Object.entries(defs).filter(([, v]) => new Set(v.map(x => x.body)).size > 1);
assert(clash.length === 0, "animation names defined differently in more than one place (rename one):\n" + clash.map(([k, v]) => `  ${k}: ${v.map(x => x.at).join(", ")}`).join("\n"));
assert(defs.cpFloat && defs.cpFloat.every(x => !/opacity/.test(x.body)), "cpFloat (the floating companions' hover) moves them, never fades them");
console.log(`keyframes-unique.test: ${Object.keys(defs).length} animation names, none clashing`);
