// New inputs for every app AI job that isn't a study set (driver "replay" in tasks/catalog.json): the teacher writes a new request
// in exactly the shape the app sent (same labels, sections and layout), with new content drawn from a corpus document. These are
// then answered through the app's real on-device path by apploop.js.
//
//   node ml/teacher/synth_inputs.js --docs ml/data/splits/train.jsonl --per-job 300 --out ml/data/inputs/train.jsonl
//   (--jobs cards,quiz,... to limit; --tiers A,B; TEACHER_* settings as in lib/llm.js)
const fs = require("fs"), path = require("path");
const {client, readJsonl} = require("../lib/llm");
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? args[i + 1] : d; };
const docs = readJsonl(opt("docs")), out = opt("out"), per = Number(opt("per-job", 200)), tiers = opt("tiers", "A,B").split(","), only = opt("jobs") ? opt("jobs").split(",") : null;
const catalog = require("../tasks/catalog.json").filter(j => j.driver === "replay" && tiers.includes(j.tier) && (!only || only.includes(j.id)));
const T = client(process.env.SYNTH_PREFIX || "TEACHER");
fs.mkdirSync(path.dirname(out), {recursive: true});
const have = new Set(readJsonl(out).map(x => x.id));
const SYS = "You write realistic test inputs for an AI feature in Studyboard, a student planner app. You get the exact request the app sent once, and some study material. Write a NEW request in exactly the same format: the same labels, sections, order, separators and kind of content, so the app could have sent it. Fill it with new content based on the material, and realistic made-up planner details where the format needs them (course codes, task titles, dates within a few weeks of today, grades, questions a student would type). Never copy the old request's content. Everything must be suitable for a school student. Reply with JSON: {\"text\": \"the new request\"}.";
(async () => {
  let n = 0;
  for (const job of catalog) {
    const pool = docs.slice().sort(() => Math.random() - 0.5).slice(0, per);
    await Promise.all(pool.map(async d => {
      const id = `${job.id}:${d.id}`;
      if (have.has(id)) return;
      const material = d.text.split(/\s+/).slice(0, Math.min(900, Math.max(150, Math.round(job.example.split(/\s+/).length * 1.5)))).join(" ");
      try {
        const [r] = await T.chat({messages: [{role: "system", content: SYS}, {role: "user", content: `TODAY: ${new Date().toISOString().slice(0, 10)}\n\nWHAT THE FEATURE DOES: ${job.what}\n\nTHE APP'S INSTRUCTIONS TO ITS AI (for context; don't change them):\n<<<\n${job.system.slice(0, 3000)}\n>>>\n\nTHE REQUEST IT SENT ONCE:\n<<<\n${job.example.slice(0, 6000)}\n>>>\n\nMATERIAL TO BASE THE NEW ONE ON (${d.subject || "general"}):\n<<<\n${material}\n>>>`}],
          temperature: 0.9, max_tokens: 2500, schema: {type: "object", properties: {text: {type: "string"}}, required: ["text"]}});
        const text = JSON.parse(r.content).text;
        if (!text || text.length < 10) return;
        fs.appendFileSync(out, JSON.stringify({id, job: job.id, tier: job.tier, doc: d.id, system: job.system, parts: [{text}], schema: job.schema, maxTokens: job.maxTokens}) + "\n");
        if (++n % 25 === 0) console.error(`${n} inputs ($${T.stats.usd.toFixed(3)})`);
      } catch (e) { console.error(`${id}: ${e.message}`); }
    }));
  }
  console.error(`done: ${n} new inputs -> ${out} ($${T.stats.usd.toFixed(3)})`);
})();
