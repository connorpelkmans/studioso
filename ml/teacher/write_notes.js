// Course material written by the teacher model, for the subjects real sources cover thinly (nursing, psychology, the arts...):
// for each subject, the teacher lists the core topics of the course, then writes material on each topic in one of the forms
// students bring to Studyboard (lecture slides, class notes, a study guide, a textbook section, a lecture transcript). Open-model
// output, so it's free to train on. Facts are the teacher's: the student model is trained to restate what's in the input, so a
// rare teacher mistake teaches a wrong fact only as "what the notes said", not as knowledge.
//
//   node ml/teacher/write_notes.js --out ml/data/raw/written.jsonl --topics 40
const fs = require("fs"), path = require("path");
const {client, readJsonl} = require("../lib/llm");
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf("--" + k); return i >= 0 ? args[i + 1] : d; };
const out = opt("out", "ml/data/raw/written.jsonl"), nTopics = Number(opt("topics", 40));
const SUBJECTS = ["Introductory Psychology", "Abnormal Psychology", "Developmental Psychology", "Psychiatric and Mental Health Nursing", "Fundamentals of Nursing", "Pharmacology for Nurses",
  "Medical-Surgical Nursing", "Maternal and Newborn Nursing", "Pediatric Nursing", "Anatomy and Physiology", "Microbiology", "Nutrition", "Introductory Sociology", "Introduction to Philosophy",
  "Ethics", "World Religions", "Art History", "Music Theory", "Introduction to Film", "American Literature", "British Literature", "Creative Writing", "Rhetoric and Composition",
  "Spanish Grammar", "French Grammar", "Earth Science", "Environmental Science", "Astronomy", "Marketing", "Management", "Accounting", "Personal Finance", "Business Law",
  "Criminal Justice", "Social Work", "Early Childhood Education", "Kinesiology", "Public Health", "Statistics", "Algebra", "Geometry", "Calculus", "Computer Science Principles",
  "Data Structures", "Networking", "Cybersecurity", "AP Biology", "AP Chemistry", "AP Physics", "AP US History", "AP World History", "AP Government", "AP Macroeconomics", "AP Psychology"];
const FORMS = [["slides", "lecture slides as plain text: each slide a 'Slide N' line, a title line, then 3 to 6 short bullet points (fragments, not full sentences), with terms on their own line followed by their definition"],
  ["notes", "a student's own class notes: headings, short lines, some abbreviations, key terms followed by a colon and their meaning"],
  ["guide", "an instructor's study guide: sections with key terms in bold and short explanations, a few lists"],
  ["textbook", "a textbook section: a heading and 4 to 6 paragraphs of clear prose with key terms in bold"],
  ["transcript", "the transcript of part of a lecture: spoken, informal, with the instructor explaining and giving examples"]];
const T = client(process.env.WRITE_PREFIX || "TEACHER");
const have = new Set(readJsonl(out).map(d => d.id));
fs.mkdirSync(path.dirname(out), {recursive: true});
(async () => {
  let n = 0;
  for (const subj of SUBJECTS) {
    let topics = [];
    try { const [r] = await T.chat({messages: [{role: "system", content: "You plan courses. Reply with JSON."}, {role: "user", content: `List the ${nTopics} most important topics taught in a ${subj} course, each specific enough for one lecture (e.g. "Defense mechanisms", not "Psychology"). JSON: {"topics": [strings]}`}], temperature: 0.4, max_tokens: 1500, schema: {type: "object", properties: {topics: {type: "array", items: {type: "string"}}}, required: ["topics"]}}); topics = JSON.parse(r.content).topics.slice(0, nTopics); }
    catch (e) { console.error(subj + ": " + e.message); continue; }
    await Promise.all(topics.map(async (topic, k) => {
      const [form, how] = FORMS[k % FORMS.length], id = `wr-${subj}-${topic}`.replace(/[^A-Za-z0-9]+/g, "_").slice(0, 120);
      if (have.has(id)) return;
      try {
        const [r] = await T.chat({messages: [{role: "system", content: "You write accurate course material for students. Use only well-established facts; include specific terms, definitions, examples, numbers, names and processes where the topic has them. Suitable for a school student. Reply with JSON."},
          {role: "user", content: `Course: ${subj}\nTopic: ${topic}\nWrite about 500 to 800 words of ${how}. JSON: {"text": "..."}`}], temperature: 0.7, max_tokens: 2200, schema: {type: "object", properties: {text: {type: "string"}}, required: ["text"]}});
        const text = JSON.parse(r.content).text;
        if (!text || text.split(/\s+/).length < 200) return;
        fs.appendFileSync(out, JSON.stringify({id, source: "written", subject: subj, title: topic, style: form, license: "teacher-written (open model output)", text}) + "\n");
        if (++n % 25 === 0) console.error(`${n} written ($${T.stats.usd.toFixed(3)})`);
      } catch (e) { console.error(`${id}: ${e.message}`); }
    }));
  }
  console.error(`done: ${n} -> ${out}`);
})();
