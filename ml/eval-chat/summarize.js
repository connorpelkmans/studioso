// Summarizes a results file from run.js: state-check failures, errors, slow turns, and dumps chunks for judging.
// node summarize.js results-e2b.jsonl [chunkDir]
const fs = require("fs"), path = require("path");
const F = process.argv[2], DIR = process.argv[3];
const rows = fs.readFileSync(F, "utf8").split("\n").filter(Boolean).map(l => JSON.parse(l));
let turns = 0, stateBad = 0, err = 0, slow = 0, left = 0, secs = 0; const byCat = {};
const CANT = /couldn't (get|find) (a full|an) answer|isn't answering|took too long/i;
rows.forEach(r => r.turns.forEach(t => {
  turns++; secs += t.secs;
  const k = r.id.split("-")[0]; byCat[k] = byCat[k] || {n: 0, bad: 0, err: 0};
  byCat[k].n++;
  if (t.stateOk === false) { stateBad++; byCat[k].bad++; }
  if (t.why || CANT.test(t.ans) || !t.ans) { err++; byCat[k].err++; }
  if (t.secs > 30) slow++;
  if (t.left) left++;
}));
console.log(`${rows.length} conversations, ${turns} turns, state fails ${stateBad}, errors/empty ${err}, >30s ${slow}, left chat ${left}, mean ${(secs / turns).toFixed(1)}s`);
console.log(byCat);
if (DIR) {
  fs.mkdirSync(DIR, {recursive: true});
  const by = {}; rows.forEach(r => { const k = r.id.split("-")[0]; (by[k] = by[k] || []).push(r); });
  Object.entries(by).forEach(([k, list]) => { for (let i = 0; i < list.length; i += 50) {
    const txt = list.slice(i, i + 50).map(r => `### ${r.id} [${r.cat}]${r.err ? " ERR " + r.err : ""}\n` + r.turns.map((t, j) => `Q${j + 1}: ${t.q}\nEXPECT: ${t.expect}\nANSWER (${t.secs}s${t.stateOk === false ? ", STATE CHECK FAILED: " + t.state : t.stateOk ? ", state ok" : ""}${t.diff.length ? ", changed: " + t.diff.join("; ") : ""}${t.dlg ? ", opened: " + t.dlg : ""}${t.why ? ", " + t.why : ""}): ${t.ans}`).join("\n")).join("\n\n");
    fs.writeFileSync(path.join(DIR, `${k}-${String(i / 50 + 1).padStart(2, "0")}.txt`), txt); } });
}
