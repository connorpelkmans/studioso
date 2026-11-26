# Studyboard's AI jobs

Made by `node ml/tasks/build_catalog.js` from the requests the test suite captured. Tier A: structured jobs the custom model is trained and scored on for parity with Gemini Flash. B: reasoning jobs (trained, parity not expected). M: need a picture or audio. W: need the web. X: test scaffolding.

| Job | Tier | Priority | How data is made | What it is |
|---|---|---|---|---|
| cards | A | 1 | studyset | Flashcards from notes or files (on the device: facts, then cards, then checks) |
| quiz | A | 1 | studyset | Practice quiz with answer keys and rationales (on the device: then it takes its own quiz) |
| answer-check | A | 1 | replay | Is a short answer correct, with feedback |
| linknotes | A | 1 | replay | Notes and cards from a web article or pasted text |
| lecture-notes | A | 1 | replay | Study notes from a lecture transcript |
| lecture-cards | A | 1 | replay | Flashcards from lecture study notes |
| lecture-summary | A | 1 | replay | Compact summary of a lecture |
| highlight-card | A | 1 | replay | One flashcard from a highlighted passage |
| weak-spot-quiz | A | 1 | replay | Targeted practice questions on weak spots |
| notes-cards | A | 1 | replay | Flashcards from the student's own note |
| teachback-check | A | 1 | replay | Check a student's explanation of a topic |
| hints | A | 1 | replay | Two recall hints for a flashcard |
| breakdown | A | 2 | replay | Split an assignment into milestones |
| settings-pick | A | 2 | replay | Pick the settings control for a request |
| breakdown-2 | A | 2 | replay | Split an assignment into milestones (from Breakdown) |
| syllabus | A | 2 | replay | Course, dates, weights and assignments from a syllabus |
| task-tidy | A | 2 | replay | Tidy vague new task titles |
| examprep-words | A | 2 | replay | One-line instructions for exam study sessions |
| lecture-sort | A | 2 | replay | Sort lectures into an exam's topics |
| transcript-tidy | A | 2 | replay | Tidy a raw lecture transcript |
| email-triage | A | 2 | replay | Tasks and dates from a forwarded school email |
| objectives | A | 2 | replay | Learning objectives from a syllabus or slides |
| conceptmap-match | A | 3 | replay | Match cards and questions to concept map ideas |
| icon-words | A | 3 | replay | Search words for course icons |
| icon-pick | A | 3 | replay | Pick icons for a course |
| file-docs | A | 3 | replay | File documents under courses |
| exam-remote | A | 3 | replay | Is an exam taken from home or in person |
| connections | A | 3 | replay | How course material connects |
| ask-planner | B | 1 | replay | Answer a question from the planner's own items |
| assist | B | 1 | replay | Ask (the companion): answers and proposed changes |
| plan | B | 2 | replay | The automatic study plan |
| ask-general | B | 2 | replay | Answer a study question from general knowledge |
| grade-coach | B | 2 | replay | Grade coach advice |
| rubric | B | 2 | replay | Feedback on a draft against its rubric |
| companion-line | B | 3 | replay | The companion's short spoken line |
| companion-facts | B | 3 | replay | The companion's planner facts |
| grade-coach-zero | B | 3 | replay | Grade coach advice (no grades yet) |
| group-plan | B | 3 | replay | Plan a group project |
| weekly | B | 3 | replay | A warm recap of the student's week |
| photo-notes | M | 2 | - | Notes from photos of slides or whiteboards (text part trained as notes-cards/linknotes) |
| whiteboard-describe | M | 3 | - | Describe a whiteboard picture |
| calc-read | M | 3 | - | Read math from a picture for the calculator |
| conceptmap-photo | M | 3 | - | Read a hand-drawn concept map photo |
| gradescale-read | M | 3 | - | Read a grading scale from a picture |
| transcribe | M | 3 | - | Transcribe a recording (Whisper's job, not the text model's) |
| whiteboard-notes | M | 3 | - | Notes from a whiteboard picture |
| handwriting | M | 3 | - | Read handwriting on the whiteboard |
| gradescale-search | W | 3 | - | Search the web for grading rules |
| gradescale-urls | W | 3 | - | Find a school's grading pages |
| gradescale-know | W | 3 | - | Recall a school's grading rules |
| gradescale-pages | W | 3 | - | Read grading rules from pages |

28 tier A, 11 tier B, 8 tier M, 4 tier W.
