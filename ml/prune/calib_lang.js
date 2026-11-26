// Calibration in other languages (step 1 of ml/prune/README.md). Students' notes come in many languages and the app writes in
// the language of the material, so a pruned model must keep the experts those languages use. This takes English requests the
// full model already answered (sft.jsonl), has the TEACHER (the full Gemma 4 26B) translate the student's material into each
// language, then answer it with the app's unchanged instructions. Each language becomes its own group in calib.py, so its
// most-used experts are protected when pruning.
//
//   node ml/prune/calib_lang.js --in ml/prune/work/train/sft.jsonl --out ml/prune/work/gen/lang.jsonl --langs es,fr,de,pt,zh,hi,ar --per-lang 40
const fs = require("fs"), path = require("path");
const {client, readJsonl} = require("../lib/llm");
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? args[i + 1] : d; };
const NAMES = {es: "Spanish", fr: "French", de: "German", pt: "Portuguese", it: "Italian", zh: "Simplified Chinese", ja: "Japanese",
  ko: "Korean", hi: "Hindi", ar: "Arabic", vi: "Vietnamese", tr: "Turkish", pl: "Polish", nl: "Dutch", id: "Indonesian", ru: "Russian"};
const langs = opt("langs", "es,fr,de,pt,zh,hi,ar").split(",").map(s => s.trim()).filter(Boolean);
const perLang = Number(opt("per-lang", 40)), out = opt("out", "ml/prune/work/gen/lang.jsonl");
const T = client("TEACHER");
const done = new Set(readJsonl(out).map(r => r.key));
fs.mkdirSync(path.dirname(out), {recursive: true});

// A spread of jobs: round-robin over jobs, short-ish requests first (translation is the slow part)
function pick(rows, n, seed){
  const by = new Map();
  rows.forEach(r => { const u = r.prompt.find(m => m.role === "user"); if (u && String(u.content).length < 12000) (by.get(r.job) || by.set(r.job, []).get(r.job)).push(r); });
  const lists = [...by.values()].map(l => l.sort((a, b) => ((a.prompt[1].content.length * 31 + seed) % 97) - ((b.prompt[1].content.length * 31 + seed) % 97)));
  const outRows = [];
  for (let i = 0; outRows.length < n && lists.some(l => l.length > i); i++) lists.forEach(l => { if (l[i] && outRows.length < n) outRows.push(l[i]); });
  return outRows;
}

async function one(r, lang){
  const key = lang + ":" + r.job + ":" + require("crypto").createHash("sha1").update(JSON.stringify(r.prompt)).digest("hex").slice(0, 12);
  if (done.has(key)) return null;
  const sys = r.prompt.find(m => m.role === "system"), user = r.prompt.find(m => m.role === "user");
  const [tr] = await T.chat({temperature: 0.2, max_tokens: 6000, messages: [
    {role: "system", content: `Translate the user's text into ${NAMES[lang] || lang}, as a student who speaks it would write their notes. Keep every number, date, formula, name, code, JSON key, list marker and line break exactly. Translate only; add nothing. Output only the translation.`},
    {role: "user", content: String(user.content)}]});
  if (!tr || !tr.content || tr.finish !== "stop") return null;
  const wasJson = (() => { try { JSON.parse(r.completion[0].content); return true; } catch (e) { return false; } })();
  const [ans] = await T.chat({temperature: 0.4, max_tokens: 6000, messages: [sys, {role: "user", content: tr.content}].filter(Boolean),
    extra: wasJson ? {response_format: {type: "json_object"}} : {}});
  if (!ans || !ans.content || ans.finish !== "stop") return null;
  if (wasJson) { try { JSON.parse(ans.content); } catch (e) { return null; } }
  return {key, lang, job: r.job, prompt: [sys, {role: "user", content: tr.content}].filter(Boolean), completion: [{role: "assistant", content: ans.content}]};
}

(async () => {
  const rows = readJsonl(opt("in", "ml/prune/work/train/sft.jsonl"));
  if (!rows.length) { console.error("no input requests: run the calibration answers first (run_prune.sh, step calib-data)"); process.exit(2); }
  let made = 0;
  for (const [i, lang] of langs.entries()) {
    const jobs = pick(rows, perLang, i + 1).map(r => one(r, lang).then(x => { if (x) { fs.appendFileSync(out, JSON.stringify(x) + "\n"); made++; } }, e => console.error("  skipped:", String(e.message || e).slice(0, 120))));
    await Promise.all(jobs);
    console.log(`  ${lang}: done (${made} written so far)`);
  }
  console.log(`wrote ${made} requests in ${langs.length} languages to ${out}; teacher calls ${T.stats.calls}, failures ${T.stats.fails}`);
})();
