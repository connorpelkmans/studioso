// node ml/tasks/build_catalog.js: the list of every AI job in Studyboard, from the requests the test suite captured
// (ml/capture/unique.json, made by ml/capture/runall.sh + unique.js), with what the custom model should do about each.
//   tier A: structured text jobs a small model can learn to do as well as Gemini Flash (trained, scored for parity)
//   tier B: reasoning or open-ended text jobs (trained too, but parity isn't expected; they keep their honest labels)
//   tier M: needs a picture or audio (the device reads the words first with OCR; the text part is trained under its text job)
//   tier W: needs the web (never on the device)
//   tier X: test scaffolding, not a real job
// priority 1 = what students use most for studying; 3 = rarely used
const fs = require("fs"), path = require("path");
const U = require("../capture/unique.json");
// index in unique.json -> [id, tier, priority, driver, what it is]
//   driver "studyset": the app's own on-device study-set pipeline (sections, facts, cards, quiz, self-check) on a note
//   driver "replay": the captured request with new inputs, through the app's on-device call path (__sbDevAI.call)
const T = {
  1: ["cards", "A", 1, "studyset", "Flashcards from notes or files (on the device: facts, then cards, then checks)"],
  3: ["quiz", "A", 1, "studyset", "Practice quiz with answer keys and rationales (on the device: then it takes its own quiz)"],
  20: ["linknotes", "A", 1, "replay", "Notes and cards from a web article or pasted text"],
  34: ["lecture-notes", "A", 1, "replay", "Study notes from a lecture transcript"],
  35: ["lecture-cards", "A", 1, "replay", "Flashcards from lecture study notes"],
  38: ["lecture-summary", "A", 1, "replay", "Compact summary of a lecture"],
  50: ["notes-cards", "A", 1, "replay", "Flashcards from the student's own note"],
  39: ["highlight-card", "A", 1, "replay", "One flashcard from a highlighted passage"],
  52: ["hints", "A", 1, "replay", "Two recall hints for a flashcard"],
  10: ["answer-check", "A", 1, "replay", "Is a short answer correct, with feedback"],
  51: ["teachback-check", "A", 1, "replay", "Check a student's explanation of a topic"],
  49: ["weak-spot-quiz", "A", 1, "replay", "Targeted practice questions on weak spots"],
  37: ["transcript-tidy", "A", 2, "replay", "Tidy a raw lecture transcript"],
  17: ["syllabus", "A", 2, "replay", "Course, dates, weights and assignments from a syllabus"],
  45: ["objectives", "A", 2, "replay", "Learning objectives from a syllabus or slides"],
  6: ["breakdown", "A", 2, "replay", "Split an assignment into milestones"],
  16: ["breakdown-2", "A", 2, "replay", "Split an assignment into milestones (from Breakdown)"],
  18: ["task-tidy", "A", 2, "replay", "Tidy vague new task titles"],
  43: ["email-triage", "A", 2, "replay", "Tasks and dates from a forwarded school email"],
  44: ["file-docs", "A", 3, "replay", "File documents under courses"],
  46: ["exam-remote", "A", 3, "replay", "Is an exam taken from home or in person"],
  24: ["examprep-words", "A", 2, "replay", "One-line instructions for exam study sessions"],
  36: ["lecture-sort", "A", 2, "replay", "Sort lectures into an exam's topics"],
  23: ["conceptmap-match", "A", 3, "replay", "Match cards and questions to concept map ideas"],
  55: ["connections", "A", 3, "replay", "How course material connects"],
  40: ["icon-words", "A", 3, "replay", "Search words for course icons"],
  41: ["icon-pick", "A", 3, "replay", "Pick icons for a course"],
  13: ["settings-pick", "A", 2, "replay", "Pick the settings control for a request"],
  5: ["plan", "B", 2, "replay", "The automatic study plan"],
  14: ["assist", "B", 1, "replay", "Ask (the companion): answers and proposed changes"],
  9: ["ask-planner", "B", 1, "replay", "Answer a question from the planner's own items"],
  11: ["ask-general", "B", 2, "replay", "Answer a study question from general knowledge"],
  25: ["grade-coach", "B", 2, "replay", "Grade coach advice"],
  26: ["grade-coach-zero", "B", 3, "replay", "Grade coach advice (no grades yet)"],
  48: ["rubric", "B", 2, "replay", "Feedback on a draft against its rubric"],
  32: ["group-plan", "B", 3, "replay", "Plan a group project"],
  47: ["weekly", "B", 3, "replay", "A warm recap of the student's week"],
  2: ["companion-line", "B", 3, "replay", "The companion's short spoken line"],
  4: ["companion-facts", "B", 3, "replay", "The companion's planner facts"],
  15: ["whiteboard-describe", "M", 3, "-", "Describe a whiteboard picture"],
  19: ["calc-read", "M", 3, "-", "Read math from a picture for the calculator"],
  22: ["conceptmap-photo", "M", 3, "-", "Read a hand-drawn concept map photo"],
  27: ["gradescale-read", "M", 3, "-", "Read a grading scale from a picture"],
  33: ["photo-notes", "M", 2, "-", "Notes from photos of slides or whiteboards (text part trained as notes-cards/linknotes)"],
  42: ["transcribe", "M", 3, "-", "Transcribe a recording (Whisper's job, not the text model's)"],
  53: ["whiteboard-notes", "M", 3, "-", "Notes from a whiteboard picture"],
  54: ["handwriting", "M", 3, "-", "Read handwriting on the whiteboard"],
  28: ["gradescale-search", "W", 3, "-", "Search the web for grading rules"], 29: ["gradescale-urls", "W", 3, "-", "Find a school's grading pages"],
  30: ["gradescale-know", "W", 3, "-", "Recall a school's grading rules"], 31: ["gradescale-pages", "W", 3, "-", "Read grading rules from pages"],
  0: ["test-hedge", "X", 0, "-", "test scaffolding"], 7: ["test-json", "X", 0, "-", "test scaffolding"], 8: ["test-stall", "X", 0, "-", "test scaffolding"],
  12: ["test-empty", "X", 0, "-", "test scaffolding"], 21: ["test-x", "X", 0, "-", "test scaffolding"]
};
const missing = U.map((_, i) => i).filter(i => !T[i]);
if (missing.length) { console.error("not classified: " + missing.join(", ") + " (add them to the table)"); process.exit(1); }
const jobs = U.map((u, i) => { const [id, tier, priority, driver, what] = T[i];
  return {id, tier, priority, driver, what, feature: u.test.replace(/\.e2e\.js$/, ""), schema: u.schema, maxTokens: u.maxTokens, media: u.media, web: !!(u.search || u.urlc),
    system: u.system, example: u.parts.map(p => p.text).join("\n\n")}; });
fs.writeFileSync(path.join(__dirname, "catalog.json"), JSON.stringify(jobs, null, 1));
const md = ["# Studyboard's AI jobs", "", "Made by `node ml/tasks/build_catalog.js` from the requests the test suite captured. Tier A: structured jobs the custom model is trained and scored on for parity with Gemini Flash. B: reasoning jobs (trained, parity not expected). M: need a picture or audio. W: need the web. X: test scaffolding.", "",
  "| Job | Tier | Priority | How data is made | What it is |", "|---|---|---|---|---|",
  ...jobs.filter(j => j.tier !== "X").sort((a, b) => a.tier.localeCompare(b.tier) || a.priority - b.priority).map(j => `| ${j.id} | ${j.tier} | ${j.priority} | ${j.driver} | ${j.what} |`), "",
  `${jobs.filter(j => j.tier === "A").length} tier A, ${jobs.filter(j => j.tier === "B").length} tier B, ${jobs.filter(j => j.tier === "M").length} tier M, ${jobs.filter(j => j.tier === "W").length} tier W.`];
fs.writeFileSync(path.join(__dirname, "CATALOG.md"), md.join("\n") + "\n");
console.log(md.slice(-1)[0]);
