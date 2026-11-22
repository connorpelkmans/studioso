// The app's own key-term finder (aiKeyTerms in src/js/01-ai.js), for scoring how much of the material an answer covers.
// stdin: JSON lines {id, text}; stdout: JSON lines {id, terms}. Used by ml/prune/eval_compare.py.
const fs = require("fs"), path = require("path");
const src = fs.readFileSync(path.join(__dirname, "..", "..", "src", "js", "01-ai.js"), "utf8");
eval(src.match(/const AI_TERM_SKIP = [^\n]+/)[0].replace("const ", "var "));
{ const i = src.indexOf("function aiKeyTerms("); eval(src.slice(i, src.indexOf("\n}\n", i) + 2)); }
const out = [];
for (const line of fs.readFileSync(0, "utf8").split("\n")) {
  if (!line.trim()) continue;
  const r = JSON.parse(line);
  out.push(JSON.stringify({id: r.id, terms: aiKeyTerms(r.text, 30)}));
}
process.stdout.write(out.join("\n") + "\n");
