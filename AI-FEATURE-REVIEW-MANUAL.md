# AI Feature Review: user-invoked AI

Scope: features the student starts themselves (automatic or ambient AI is audited separately). Lens: does it solve a real student problem better than the non-AI path, is the output grounded in the student's own material, is the flow fast and honest, and does the student stay in control.

## Verdicts

| Feature | Verdict | Why |
|---|---|---|
| Ask With AI / Search Everywhere answers (`exactAnswer`, snapshot, `ASK_SYSTEM`) | Keep, improved | Best-designed AI path: exact date/grade math is done in code with no AI, the model only reads a dated snapshot plus numbered sources and may answer "not found". Added exact answers for instructor, office hours and room (common, previously needed the model). Citations that point at a source that does not exist are now stripped. |
| Study sets: flashcards, quizzes, cases (`aiMakeStudySet`, `AI_STYLES`) | Keep, improved | Real time saver versus typing cards, and the review/edit step before saving already existed. Weak points were quality control, so: stricter grounding prompt (own terms and numbers only, source reference required, language of the source, plain text), near-duplicate and oversize card removal, count capped to what was asked, markdown/HTML/LaTeX stripped and simple math and chemistry written with real sub/superscripts, repeated questions and questions with repeated options removed, one automatic retry on garbled output, cut-off JSON salvaged (every complete card kept instead of an error), and a lexical grounding check for pasted/text sources that marks cards whose numbers or vocabulary are not in the material ("Check") with a one-tap remove. Closing the window now cancels the request (no stray review sheet, no wasted quota). |
| Style chips and custom style | Keep | Matches how students actually describe exams. Chips are optional, custom text wins. No change. |
| Syllabus import (dates to tasks) | Keep, improved | High value, and already flags guessed dates and existing duplicates. Added a gate: merges repeated items and blanks any date far from the rest of the course (usually a wrong year) so the student fills it in rather than trusting it, with a visible note. The status line now names the actual model instead of always saying Gemini. |
| Quick add (natural language) | Improve (done) | The AI was called for every line, even "bio lab report fri 5pm 3h", which the on-device parser reads correctly. Now the deterministic parser runs first; the AI is only used when the line is ambiguous (several tasks, leftover date-like words, long text). When the AI is used, dates far in the past/future and absurd hours are dropped, and explicit date, time, hours, weight and course typed by the student override the AI's guess. Result: instant, free, repeatable for normal lines, and the AI keeps the cases it is good at. A note appears when a task has no date. |
| Photo to notes | Keep | Real problem (whiteboard photos), prompt already says keep numbers exactly and mark [unclear]. Result is previewed before saving. |
| File summary | Keep, improved | Prompt now forbids facts not in the file and requires the file's language and plain text. |
| Topic extraction for exams | Improve (done) | Prompt now restricts topics to what files and notes actually mention instead of guessing general topics. |
| Exam plan | Keep | Uses the student's topics and confidence; steps are concrete. Falls back to a plan without AI details on failure. |
| Tutor (course chat) | Keep | Cites files, and flags when the answer is not from the files (`inFiles`). No change. |
| Explain this / Explain more | Keep | Short, tied to a specific card or question, stored on the item. |
| Grading short answers (`smartGrade`) | Keep | Already local-first: exact and fuzzy match decide first, the AI only judges answers that did not match, and the student can override. |
| AI effort estimate | Keep | Falls back to a history-based local estimate; the result is editable in the form. |
| Heavy-week rewrite note | Improve (done) | Prompt hard-coded "nursing student"; now "a student". Still low value as prose, kept because it is short and optional. |
| Weak-spots quiz | Keep | Targets the student's own misses. |
| Duplicate entry points | Merge (partly) | "Create with AI" appears on the deck list, inside a deck and in Search; they open the same sheet, so no new confusion was added. Left as is. |

## What changed in code
- `aiRepairJson`, `aiTidyText`, `aiGateCards`, `aiGateQuestions`, `aiCorpus`/`aiGroundNote`, `aiGateSyllabus`, `aiCleanCites`, `qaConfident` (marked `AI-QUALITY-START/END` in `index.html`, tested by `tests/ai-quality.test.js`).
- `aiCall` accepts an abort `signal`, threaded to all three providers; `aiMakeStudySet` retries once on garbled output.
- Quick add runs the local parser first.

## Left for later
- Grounding check only works for text sources (pasted notes, slides/Word/text converted to text). PDFs and photos go to the model directly, so those sets are not checked.
- No source quotes shown per card; only the slide/page reference the model gives.
- Quick add does not yet understand "end of the month" or "next week" locally (it correctly hands those to the AI).
