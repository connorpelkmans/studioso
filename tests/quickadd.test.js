// Unit tests for Quick Add Files and Learning Objectives (the pure code between QADD-START and QADD-END in index.html).
// Run: node tests/quickadd.test.js
const fs = require("fs"), path = require("path"), assert = require("assert");
const s = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const code = s.slice(s.indexOf("/*QADD-START*/"), s.indexOf("/*QADD-END*/"));
const Q = new Function(code + ";return QADD;")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const eq = (a, b, m) => { n++; assert.deepStrictEqual(a, b, m); };

// ---- what kind of file
const kind = (name, text) => Q.kindOf(name, text).kind;
eq(kind("BIO101_Syllabus_Fall.pdf", "Office hours: Tue 2-4. Grading policy. Academic integrity."), "syllabus", "syllabus by name and words");
eq(kind("course.pdf", "Course schedule. Office hours Tuesdays. Grading policy: exams 50%. Required textbook: Campbell."), "syllabus", "syllabus by words alone");
eq(kind("Lecture 3.pptx", "Slide 1:\nCell Respiration\n\nSlide 2:\nWhy it matters"), "slides", "slides by extension and text");
eq(kind("week4.pdf", "Slides for lecture 4"), "slides", "slides by words");
eq(kind("hw4.pdf", "Homework 4. Due Friday Oct 9. Submit via Canvas. 20 points"), "assignment", "assignment");
eq(kind("midterm_practice.pdf", "Practice exam. Multiple choice. Question 1."), "exam", "practice exam");
eq(kind("chapter5.pdf", "Chapter 5. Abstract. Smith et al."), "reading", "reading");
eq(kind("study guide unit 2.docx", ""), "notes", "study guide is notes");
eq(kind("scan001.pdf", ""), "other", "nothing to go on is Other");
eq(kind("Final Project Brief.pdf", "Final project instructions. Submit by the due date. Rubric attached."), "assignment", "a final project is not an exam");
ok(Q.kindOf("scan001.pdf", "").conf < 0.5, "low confidence when it is a guess");
ok(Q.kindOf("BIO101_Syllabus_Fall.pdf", "Office hours. Grading policy.").conf > 0.6, "high confidence when clear");

// ---- which course
const cs = [{id: "c1", name: "Introduction to Biology", code: "BIO 101", instructor: "Dr. Jane Okafor"}, {id: "c2", name: "Calculus II", code: "MATH 152", instructor: "Prof. Lee Chen"}, {id: "c3", name: "Organic Chemistry", code: "CHM 220", instructor: ""}];
eq(Q.courseOfFile("lecture3.pptx", "BIO101 Fall - Cell respiration", cs).courseId, "c1", "course code in the text, with the space left out");
eq(Q.courseOfFile("notes.pdf", "Integrals and series. Calculus II. Prof Chen", cs).courseId, "c2", "course name and instructor");
eq(Q.courseOfFile("CHM220-lab1.pdf", "", cs).courseId, "c3", "course code in the file name");
eq(Q.courseOfFile("random.pdf", "hello world", cs).courseId, "", "no clear course stays empty");
eq(Q.courseOfFile("x.pdf", "BIO101 and MATH152 joint session", cs).courseId, "", "two courses equally likely stays empty");
eq(Q.courseOfFile("x.pdf", "BIO101", []).courseId, "", "no courses");
const g = Q.guess("hw4.pdf", "Calculus II homework due Friday. Submit. 20 points", cs);
eq([g.courseId, g.kind], ["c2", "assignment"], "guess puts both together");
ok(/assignment/i.test(g.why) && /course/i.test(g.why), "and says why: " + g.why);

// ---- folders
eq(Q.folderFor("slides", ["syllabus", "notes", "other"]), "notes", "slides go in Lecture Notes");
eq(Q.folderFor("exam", ["syllabus", "exams", "other"]), "exams", "exam folder");
eq(Q.folderFor("exam", ["syllabus", "other"]), "other", "a course without that folder uses Other");
eq(Q.folderFor("syllabus", []), "other", "no folders at all");
eq(Q.folderFor("reading", ["syllabus", "notes", "other"]), "other", "readings go in Other");

// ---- objectives
const SYL = "Syllabus\nCourse Description\nBlah blah\n\nLearning Objectives\nBy the end of this course, students will be able to:\n• Describe the structure of the cell membrane\n• Explain how ATP is produced in\n  mitochondria\n• Compare mitosis and meiosis\n• Solve basic genetics problems using Punnett squares\n\nGrading\nExams 50%";
eq(Q.objectives(SYL), ["Describe the structure of the cell membrane", "Explain how ATP is produced in mitochondria", "Compare mitosis and meiosis", "Solve basic genetics problems using Punnett squares"], "bullets under a heading, wrapped line joined, stops at the next heading");
eq(Q.objectives("Slide 1:\nIntro to Thermodynamics\n\nSlide 2:\nLearning Objectives\nDefine entropy\nExplain the first law\nApply the ideal gas law\n\nSlide 3:\nAgenda\nBlah"), ["Define entropy", "Explain the first law", "Apply the ideal gas law"], "slide text: lines that start with a verb, ends at the slide");
eq(Q.objectives("Students will be able to: define limits; compute derivatives; apply the chain rule"), ["Define limits", "Compute derivatives", "Apply the chain rule"], "an inline list split on semicolons");
eq(Q.objectives("1. Introduction\n2. Methods\nLearning Outcomes\n1. Analyze market structures\n2. Evaluate monetary policy tools\n3) Interpret GDP data\n\nReading List\nChapter 3"), ["Analyze market structures", "Evaluate monetary policy tools", "Interpret GDP data"], "numbered outcomes; other numbered lists are not picked up");
eq(Q.objectives("The objectives of the school include nothing relevant. Welcome to class."), [], "a sentence that merely says 'objectives' is not a list");
eq(Q.objectives(""), [], "empty text");
eq(Q.objectives("Learning Objectives\n- Define osmosis\n- Define osmosis\n- Explain diffusion").length, 2, "repeats are dropped");
ok(Q.objectives("Learning Objectives\n" + Array.from({length: 40}, (_, i) => `- Explain topic number ${i}`).join("\n")).length <= 20, "at most 20");

// ---- coverage and repeats
const objs = [{id: "o1", text: "Explain how the Krebs cycle produces ATP"}, {id: "o2", text: "Compare mitosis and meiosis"}, {id: "o3", text: "Define osmosis"}];
const cov = Q.coverage(objs, {cards: [{front: "What does the Krebs cycle make?", back: "ATP, NADH and FADH2", obj: ""}, {front: "x", back: "y", obj: "o2"}], notes: [{text: "mitosis vs meiosis differences"}], files: [{name: "krebs cycle slides.pdf"}]});
eq(cov.o1, {cards: 1, linked: 0, notes: 0, files: 1}, "a card and a file that mention the Krebs cycle cover objective 1");
eq(cov.o2, {cards: 1, linked: 1, notes: 1, files: 0}, "a linked card and a note cover objective 2");
eq(cov.o3, {cards: 0, linked: 0, notes: 0, files: 0}, "objective 3 has nothing");
eq(Q.fresh([{text: "Explain how the Krebs cycle produces ATP"}], ["Explain how ATP is produced by the Krebs cycle", "Define osmosis", "define osmosis"]), ["Define osmosis"], "near-repeats of existing objectives and of each other are skipped");
eq(Q.shortName("Explain how the Krebs cycle produces ATP"), "Krebs cycle produces ATP", "topic name drops the verb");
ok(Q.shortName("Describe " + "very long words ".repeat(20)).length <= 70, "topic names are short");
eq(Q.tidy("• students will be able to: explain osmosis."), "Explain osmosis", "tidy strips bullets, the lead-in and the full stop");

console.log(`quickadd: ${n} checks passed`);
