# Automatic AI feature review

Scope: every automatic or ambient AI feature in Studyboard (the ones that run without the student pressing an AI button). Manual AI features are reviewed separately.

Tests applied to each feature: does it save real time or prevent a real mistake; is it specific and accurate to the student's own data; is it timely and rare enough; can it be acted on in one tap and undone; does it work without AI; does it avoid clutter and fake personality.

How it was tested: seeded semesters in Playwright (5 courses, 24 tasks, 3 exams, a heavy Thursday, an overdue task, a stalled task; plus light-week, heavy-week and brand-new-user data) with `aiCall` stubbed to return plausible and deliberately bad output (generic advice, invented ids, duplicates, past dates, 15x hour guesses, wrong counts, 260 character text, an exam readiness number with no evidence, claims about "instructions" that do not exist). Pure gate logic is unit tested in `tests/ains-gates.test.js` (`node tests/ains-gates.test.js`, 42 checks) plus the existing AINS tests.

## Verdicts

| Feature | Verdict | Why | What changed |
|---|---|---|---|
| Do This Next, AI pick (autoPlan `next`) | Improve | Re-ordering is already guarded by the deterministic ranking, and it is useful when it breaks ties with evidence. The model's "why" and "first step" were shown unchecked, so "stay organized" or the task title again could appear. | Why must cite data and not restate the title; step must be specific; otherwise the app's own concrete reasons show. Label "AI pick" only when the AI actually chose; no sparkle or companion "'s Pick" when it did not. |
| Heads Up (autoPlan `headsUp`) | Improve | The highest-value ambient AI idea (hidden earlier deadline, changed date) and the highest risk of filler. It was regenerated on every plan change, reworded, so a dismissed line came back. | Gates: real task ref (invented refs dropped), must cite a task, course, day or number, no generic advice, not the title again, not already said by the tray, claims about "instructions/announcements" need real notes or announcements, "N deadlines on <day>" must equal the real count, max 2. Dismissal is per task for 3 days. Prompt demands named evidence. |
| AI hours estimate (`aiHours`) | Improve | Fills a real gap for tasks with no estimate and is invisible plumbing. A 90h guess was accepted (limit was 200h). | Must be 0.25 to 40h and within 3.5x of the app's own estimate, else ignored. |
| AI hours left (`aiLeft`) | Keep | Already capped to 1.5x the task's effort and tied to a progress signature. | Hard cap 40h. |
| AI difficulty (`aiDiff`) | Keep | Only fills "difficulty not set", enum checked, invisible, expires in 14 days. | None. |
| Exam readiness % (`aiPrep`) | Improve | A percentage with nothing behind it is a guess dressed as a measurement. | Only accepted when there are done study sessions, flashcard mastery or a quiz score for that exam's course; note must pass the same filler gate. |
| Study session tuning (autoTune) and practice test (autoPractice) | Keep, now switchable | Directly uses weak flashcards, scoped to tomorrow's sessions. Practice test is the one big request. | New "Tune Study Sessions" switch; still budget-limited and never on a paid model without confirmation. |
| Tidy New Tasks (autoTriage) | Improve | Useful for "hw3" and "reading", noisy for everything else. | Hours-only suggestions dropped (they restate the app's own estimate); a course is only offered when the task text names it; title max 80 chars and must keep numbers; hours cap 20. Renamed "Fix Vague Tasks". Max 2 shown. |
| Announcement Alerts (autoNews) | Improve | Strong: a moved exam or room is a real mistake prevented, and keyword rules work without AI. Summaries of ordinary announcements just restated the post below them, with an "Auto" badge. | Summary dropped if it restates the title; ISO dates in text become "Sat, Oct 10"; proposed tasks/events must use words from the announcement and not be in the past or duplicate; the Announcements tab shows the AI line only for items that need attention, no badge. |
| Exam Study Plans (autoCoach) | Improve | The deterministic day/hour placement is the valuable part. It produced 9 to 12 micro-sessions for a 9 to 12 day window, with repeated generic focus lines. | Max 6 sessions of at least 45 minutes, evenly spread and ending the day before; filler steps and repeated focus lines are replaced by distinct subject-neutral fallbacks; max 1 plan shown at a time. |
| Weekly Review (autoWeekly) | Improve | Fine when something happened, noise on quiet weeks. | Skipped unless something slipped, a heavy day or exam is ahead, or 3+ tasks were done; recap numbers must match real counts; suggestion must name a real task or weekday; otherwise the plain fallback with the same facts. |
| Exam Location Check (`autoRemote`, new) | Add | Exams and quizzes are only suggested as Do This Next when they can be taken from home, so Studyboard has to know. Deterministic rules read what the school site stores (Canvas submission types and quiz settings, Brightspace dropbox and quiz tools, Blackboard grading type), the title, instructions and location, and your Schedule. Only when those can't settle it does the AI read the synced instructions (sanitized, 2000 characters, no links). | Strict JSON `{takeHome, confidence, evidence}`; the evidence must appear in (or be a close keyword match of) the text it was shown, `yes` is rejected if any in-person cue is present, `no` is rejected when the text has strong online cues and the evidence has no in-person cue, confidence under 0.7 is not applied, no description means the AI is not called. Cached by text, 6 runs a day, own switch. Unknown counts as in person; a one-tap question in the Suggestions tray (Yes, from home / No, in person) settles it, and your answer always wins over rules, AI and later syncs. |
| Study Material Tips (no AI) | Keep | Deterministic, specific, one tap. | Max 1 shown. |
| Crowded Days / Stalled / Overdue (no AI) | Improve | Correct and actionable, but stalled re-appeared every 3 days and overdue every day after dismissal. | Dismissed once means gone (stable ids); 1 stalled and 2 overdue at most. |
| Grade Risk Alerts (no AI) | Keep | Deterministic, from the student's marks, only at risk or worse. | None. |
| Suggestions tray | Improve | A wall of up to 9 items with an "Auto" badge and a sparkle on mostly non-AI items. | Max 6 total, caps per kind, plain "Suggestions" header with "Manage", "AI draft" tag only on rows the AI wrote. Dismiss shows a toast with Undo and "Turn off <feature>"; three dismissals of one kind in a week pause that kind for a week. Acting on a suggestion resets the streak. |
| "What Automatic AI is doing" panel | Improve | Jargon names, no examples. | Plain names, what each does, an example of real output, what happens without AI, last run and budget, a "paused because you dismissed several" note; new switches for the core plan and session tuning. |
| "Planned by <name>" / "AI-enhanced" chip on Today | Cut (kept only for the paid-confirm pause) | Pure decoration when working. | Now shown only when Automatic AI is paused waiting for paid-model confirmation. |
| "Auto" badge, sparkle on non-AI rows, companion "signs it with its face" copy | Cut | Badge noise and fake personality. | Removed from tray header, announcement lines and the ranking explainer; AI-written content is marked "AI draft"/"AI pick" instead. |

## Safeguards kept

Paid models still require the explicit per-model confirmation; free Gemini only by default; daily budget (40 free, 12 paid) and the reserve for small extras are unchanged; nothing changes data without a tap, and every Apply goes through the existing undoable change path.

## Not done

- Exam Location Check: Blackboard's public gradebook API gives no submission type, only the grading type (Attempts or Manual), so Blackboard exams are often left to the instructions, the AI or the question. The Respondus flag, quiz IP filter and time limit are read when Canvas reports them; if a school hides them they simply add no evidence.
- A take-home exam or quiz is not offered by the Crowded Days, Stalled or Overdue nudges (they still skip all exams and quizzes); only Do This Next, Today's Plan time, the focus buttons and the companion use the new gate.

- A moved-exam announcement offers "Add event" but not "move the existing exam to this date".
- Weekly review is verified by unit tests only (it only fires Sunday/Monday).
- No usage telemetry exists to measure real acceptance rates; the per-type feedback (`nufb`) already adjusts Do This Next, but Suggestions dismissals are stored locally only.
