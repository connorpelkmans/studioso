// Is the custom model as good as Gemini, job by job? Compares the final outputs of a candidate (apploop.js eval) with the
// reference (apploop.js reference, Gemini) on the same held-out inputs, with:
//   automatic checks  cards/questions made, share flagged "check against your material", key terms covered (found by the app's
//                     own code), key facts covered (hand-written notes), errors
//   a blind judge     a strong model (JUDGE_* settings) sees the material and two outputs in random order, twice with the order
//                     swapped, and picks the better one or a tie; a verdict that flips with the order counts as a tie
// and writes a report with the parity verdict per job: PARITY when wins + ties >= 50% and it made up no more facts than Gemini.
//
//   node ml/eval/compare.js --cand ml/eval/out/student-v1.studyset.jsonl --ref ml/eval/out/gemini.studyset.jsonl \
//        --docs ml/data/splits/test.jsonl --out ml/eval/reports/student-v1 [--judge] [--export-rating 120] [--ratings ratings.json]
const fs = require("fs"), path = require("path");
const {client, readJsonl} = require("../lib/llm");
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? args[i + 1] : d; }, flag = k => args.includes("--" + k);
const cand = readJsonl(opt("cand")).filter(r => r.kind === "result"), ref = readJsonl(opt("ref")).filter(r => r.kind === "result");
const docs = new Map(readJsonl(opt("docs", "ml/data/splits/test.jsonl")).concat(readJsonl("ml/eval/handnotes.jsonl")).map(d => [d.id, d]));
const out = opt("out", "ml/eval/reports/run"); fs.mkdirSync(out, {recursive: true});
// the app's own key-term finder, so "key terms covered" means what the app means
const src = fs.readFileSync(path.join(__dirname, "..", "..", "src", "js", "01-ai.js"), "utf8");
eval(src.match(/const AI_TERM_SKIP = [^\n]+/)[0].replace("const ", "var "));
{ const i = src.indexOf("function aiKeyTerms("); eval(src.slice(i, src.indexOf("\n}\n", i) + 2)); }
const low = s => String(s || "").toLowerCase();
const textOf = r => (r.cards || []).map(c => c.front + " || " + c.back).concat(r.questions || []).concat(r.data ? [JSON.stringify(r.data)] : []).join("\n");
function auto(r, doc){
  const t = low(textOf(r)), terms = doc ? aiKeyTerms(doc.text, 30) : [];
  const facts = doc && doc.facts ? doc.facts.filter(f => f.every(g => g.some(w => t.includes(low(w))))).length / doc.facts.length : null;
  return {error: r.error ? 1 : 0, cards: (r.cards || []).length, questions: (r.questions || []).length, flagged: (r.cards || []).filter(c => c.flagged).length,
    terms: terms.length ? terms.filter(x => t.includes(low(x))).length / terms.length : null, facts, ms: r.ms || 0};
}
const JUDGE_SYS = "You judge study material made by two AI systems for a student, from the same input. Prefer: correct facts that are in the material (anything made up or wrong is a serious fault), covering the material's important ideas and key terms, specific questions that name what they ask about, short clear answers, no repeats, no trivia. For non-study outputs, prefer the one that does the job asked correctly and completely, in the requested format. Ignore length unless it hurts clarity. Reply with JSON: {\"better\": \"A\" | \"B\" | \"tie\", \"made_up_A\": number of made-up or wrong facts in A, \"made_up_B\": the same for B, \"why\": one sentence}.";
async function judgeOne(J, material, a, b){
  const ask = async (x, y) => { const [r] = await J.chat({messages: [{role: "system", content: JUDGE_SYS}, {role: "user", content: `MATERIAL:\n<<<\n${material.slice(0, 12000)}\n>>>\n\nOUTPUT A:\n<<<\n${x.slice(0, 9000)}\n>>>\n\nOUTPUT B:\n<<<\n${y.slice(0, 9000)}\n>>>`}], temperature: 0, max_tokens: 400, schema: {type: "object", properties: {better: {type: "string", enum: ["A", "B", "tie"]}, made_up_A: {type: "integer"}, made_up_B: {type: "integer"}, why: {type: "string"}}, required: ["better"]}}); return JSON.parse(r.content); };
  const p = await ask(a, b), q = await ask(b, a);
  const v1 = p.better, v2 = q.better === "A" ? "B" : q.better === "B" ? "A" : "tie";
  return {verdict: v1 === v2 ? v1 : "tie", madeA: ((p.made_up_A || 0) + (q.made_up_B || 0)) / 2, madeB: ((p.made_up_B || 0) + (q.made_up_A || 0)) / 2, why: p.why};
}
(async () => {
  const byItem = new Map(ref.map(r => [r.item, r])), rows = [];
  for (const c of cand) { const r = byItem.get(c.item.replace(/^(rp|ss):/, (m) => m)); if (r) rows.push({c, r, doc: docs.get(c.doc) || docs.get(String(c.doc).split(":")[0])}); }
  console.error(`${rows.length} items in both`);
  const J = flag("judge") ? client("JUDGE") : null;
  const jobs = {};
  for (const [i, x] of rows.entries()) {
    const job = x.c.job, J0 = jobs[job] || (jobs[job] = {n: 0, win: 0, tie: 0, loss: 0, madeC: 0, madeR: 0, autoC: [], autoR: []});
    J0.n++; J0.autoC.push(auto(x.c, x.doc)); J0.autoR.push(auto(x.r, x.doc));
    if (J) {
      try { const v = await judgeOne(J, x.doc ? x.doc.text : JSON.stringify(x.c.input || ""), textOf(x.c), textOf(x.r));
        if (v.verdict === "A") J0.win++; else if (v.verdict === "B") J0.loss++; else J0.tie++; J0.madeC += v.madeA; J0.madeR += v.madeB; x.judge = v; }
      catch (e) { console.error("judge: " + e.message); }
      if ((i + 1) % 10 === 0) console.error(`judged ${i + 1}/${rows.length} ($${J.stats.usd.toFixed(3)})`);
    }
  }
  const avg = (L, k) => { const v = L.map(x => x[k]).filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const pct = x => x == null ? "–" : Math.round(x * 100) + "%";
  const lines = ["# Custom model vs Gemini", "", `Candidate: \`${opt("cand")}\`  Reference: \`${opt("ref")}\`  Items: ${rows.length}${J ? `  Judge: ${J.model}` : "  (no judge: --judge)"}`, "",
    "| Job | Items | Wins | Ties | Losses | Made-up facts (cand / Gemini) | Key terms (cand / Gemini) | Key facts (cand / Gemini) | Errors (cand / Gemini) | Verdict |", "|---|---|---|---|---|---|---|---|---|---|"];
  const verdicts = {};
  for (const [job, J0] of Object.entries(jobs)) {
    const judged = J0.win + J0.tie + J0.loss, wt = judged ? (J0.win + J0.tie) / judged : null;
    const v = !judged ? "needs --judge" : wt >= 0.5 && J0.madeC <= J0.madeR + 0.05 * J0.n ? "PARITY" : "not yet";
    verdicts[job] = v;
    lines.push(`| ${job} | ${J0.n} | ${J0.win} | ${J0.tie} | ${J0.loss} | ${J0.madeC.toFixed(1)} / ${J0.madeR.toFixed(1)} | ${pct(avg(J0.autoC, "terms"))} / ${pct(avg(J0.autoR, "terms"))} | ${pct(avg(J0.autoC, "facts"))} / ${pct(avg(J0.autoR, "facts"))} | ${avg(J0.autoC, "error").toFixed(2)} / ${avg(J0.autoR, "error").toFixed(2)} | ${v} |`);
  }
  // blind pairs for a person to rate (ml/eval/rate/rate.html), to check the judge agrees with you
  const nRate = Number(opt("export-rating", 0));
  if (nRate) { const pick = rows.slice().sort(() => Math.random() - 0.5).slice(0, nRate).map((x, k) => { const flip = Math.random() < 0.5; return {id: k, item: x.c.item, job: x.c.job, material: x.doc ? x.doc.text.slice(0, 6000) : "", A: flip ? textOf(x.r) : textOf(x.c), B: flip ? textOf(x.c) : textOf(x.r), candIs: flip ? "B" : "A", judge: x.judge ? x.judge.verdict === "tie" ? "tie" : (x.judge.verdict === "A") === !flip ? "A" : "B" : null}; });
    fs.writeFileSync(path.join(out, "to-rate.json"), JSON.stringify(pick)); lines.push("", `Wrote ${pick.length} blind pairs to rate: open ml/eval/rate/rate.html and load ${path.join(out, "to-rate.json")}.`); }
  const rf = opt("ratings");
  if (rf) { const R = JSON.parse(fs.readFileSync(rf, "utf8")), pairs = JSON.parse(fs.readFileSync(path.join(out, "to-rate.json"), "utf8")); let agree = 0, both = 0;
    R.forEach(r => { const p = pairs.find(x => x.id === r.id); if (p && p.judge) { both++; if (p.judge === r.choice) agree++; } });
    lines.push("", `Judge agrees with your ratings on ${agree} of ${both} pairs (${both ? Math.round(agree / both * 100) : 0}%). Below about 70%, adjust JUDGE_SYS in compare.js before trusting the verdicts.`); }
  fs.writeFileSync(path.join(out, "report.md"), lines.join("\n") + "\n");
  fs.writeFileSync(path.join(out, "details.json"), JSON.stringify({verdicts, jobs, rows: rows.map(x => ({item: x.c.item, job: x.c.job, judge: x.judge || null}))}, null, 1));
  console.log(lines.join("\n"));
})().catch(e => { console.error(e); process.exit(1); });
