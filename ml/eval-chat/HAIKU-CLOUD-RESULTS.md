# Claude Haiku 5.5 through the app's cloud path, next to E2B and E4B

`ENGINE=cloud`: the app as a student with Claude uses it ("Claude Haiku 5.5, Studyboard AI Mode", own key), all 1,100
conversations (2,085 turns), judged by the method in `JUDGING.md` (the one used for E2B and E4B): one verdict per conversation,
which passes only if every turn is right; the latest verdict for each conversation is its result.

## Pass rates by category (conversations)
Content pass (slow-only counted as a pass). No Haiku turn in the final runs took over 30 seconds (mean 3.5 s a turn), so strict
pass is the same as content pass for Haiku.

| Category | n | E2B (first run) | E4B first run | E4B now (after rr4) | Haiku first run | Haiku final full run | Haiku now (latest verdicts) |
|---|---|---|---|---|---|---|---|
| p1 Planner actions | 200 | 36% | 49% | 59% | 48% | 96% | 100% |
| p2 Their notes | 200 | 28% | 13% | 49% | 77% | 98% | 100% |
| p3 Knowledge and maths | 200 | 14% | 72% | 91% | 93% | 99% | 100% |
| p4 Planner questions, study help | 200 | 30% | 37% | 60% | 70% | 94% | 100% |
| p5 Study material, the app | 200 | 32% | 44% | 57% | 53% | 86% | 100% |
| p6 Companion chats | 100 | 0% | 19% | 50% | 63% | 90% | 98% |
| **All** | **1,100** | **25%** | **41%** | **62%** | **68%** | **94.0%** | **99.8%** |

What each Haiku column is:
- **First run**: one run on the code before 3995833d (`results-haiku-cloud.jsonl`, `judged-haiku-cloud.jsonl`).
- **Final full run**: all 1,100 rerun once on the new Claude step (`results-haiku-cloud-final.jsonl`), every conversation judged.
- **Now**: the final run's verdicts, with each conversation that failed there rerun after a fix and judged again (the method's
  "latest verdict" rule), in `judged-haiku-cloud-final.jsonl` (its `round` field says which run each verdict is from). Still
  failing: p6-038 and p6-043, both companion chats where the reply's tone drifts to tasks; they fail on different turns from run
  to run.
- A single fresh run is lower than "now" because Claude's replies vary a little from run to run: some conversations pass one
  run and fail the next (the final run had 8 of these, mostly a self-contradicting first sentence or a misread follow-up).

Held-out wordings (`heldout.json`, 60 conversations the fixes were never tuned on): 53 of 60 on the first run of the new step,
56 of 60 after the next round, **60 of 60 now** (`heldout-cloud.jsonl`, `judged-heldout-cloud.jsonl`). Of the original 361
failures (`haiku-cloud-retry.txt`), 360 pass now.

## What was fixed, and why

**The cause of most failures: the steps built for the small on-device models.** With Claude, a message went through regex
handlers, a narrow intent step that saw only task titles, and then word checks of the model's choice, all made for E2B. They
were what went wrong: "set it back to to-do" turned into chat by a word check, "extended by 2 days" counted from today (the
intent step never saw due dates), "put it back to not started" read as undo, cards made from the wrong note, the old quiz grabbing
"quiz me on countertransference" and asking about transference.

**The Claude-only step** (`98-companion-tab.js`, `claudeTurn`/`agApply`, used only when `aiSbMode` is on and not on the device;
E2B and E4B are unchanged): one request carries the whole planner with a ref for everything (tasks with due dates, status,
priority, marks; classes and events by date; school days off; grades; decks with their cards and how they've gone in study;
notes in full; files; recently deleted tasks), a calendar of the weeks around today, the timer, the look, the app guide, the
conversation, and what each earlier reply really changed (old → new). Claude answers and lists the changes: changes on refs,
new tasks, events, courses, class times, notes, decks and cards, the timer, undo, a study session, a concept map, theme,
accessories, groups, settings. The app checks every change against the planner (98-assist.js `check`), makes the valid ones in
one step (one undo), and says plainly what it couldn't do, so a reply never claims what didn't happen. The crisis reply and exact
maths stay written in code. Thinking is medium (low scheduled study after due dates); replies take about 4 seconds.

**Checks around Claude's reply**, each from a failure:
- A reply that claims an action with none listed is asked again; a reply in plain words instead of JSON is the answer (it was
  thrown away as a failure); an empty or "placeholder" reply is asked again, then said honestly, never answered by the old steps.
- Each change names its item, and a ref pointing at the row next to it is put right.
- Wardrobe and group results are said in the companion's and Groups' own words; an accessory nobody named isn't worn or
  recoloured instead; a colour snapped to the nearest course colour says so.
- Ref codes are taken out of replies; a weekday that doesn't match its date is corrected.
- Navigation happens only when the words ask for it; today's plan goes to Claude only when the talk is about time or work (it was
  pushed into greetings and trivia).
- A rate limit is waited out; a task deleted with other changes is brought back on its own; a setting changed from the chat
  reopens the chat.

**Shared bugs found on the way** (every engine): an event's catalog ref collided with another event the same day ("make the
meeting 30 min" changed the clinical orientation); "15% off a $48 jacket" was "$1 with 5% off" (98-math.js); "teal" was called a
colour though there's a Teal theme; archived finished tasks were missing from the catalog ("clear all my done tasks" named 2 of
5); a chat-made concept map went to a stray "General" course, was named "Freud'S", and "add more from my note" never saw the note.

**Runner** (`run.js`): a turn is done when its reply is saved in the chat (newer than the message), wherever the app is showing; a
reply that opens another page is read from the saved chat with where it went; the focus timer is cleared between conversations;
replies are kept to 6,000 characters; failed Claude requests and (CONSOLE=1) page warnings are logged.

**Tests**: `tests/chat-direct.e2e.js` has 32 checks of the Claude step with a stubbed Claude (`CLAUDE_ONLY=1` runs just those);
chat-direct, chat-controls, ai-truth, ai-e4b, ai-pro.test and claude-structured all pass.

## Haiku's first run: failures by cause (361 conversations: 357 fails, 4 slow-only)
| Tag | All | p1 | p2 | p3 | p4 | p5 | p6 |
|---|---|---|---|---|---|---|---|
| action-missing | 99 | 59 | | | 10 | 30 | |
| wrong-answer | 62 | 9 | 15 | 1 | 18 | 8 | 11 |
| non-answer | 59 | 2 | 14 | 4 | 15 | 16 | 8 |
| wrong-action | 50 | 22 | 3 | | 3 | 20 | 2 |
| partial | 47 | 12 | 11 | 2 | 12 | 7 | 3 |
| off-track | 21 | | | 5 | 2 | 4 | 10 |
| unrelated | 9 | 1 | 1 | 1 | | 4 | 2 |
| ai-error | 6 | | | | | 5 | 1 |
| other | 4 | | 2 | 1 | | 1 | |
| slow-only | 4 | | | 1 | 2 | 1 | |
