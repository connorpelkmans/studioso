# Claude Haiku 5.5 through the app's cloud path, next to E2B and E4B

`ENGINE=cloud`: the app as a student with Claude uses it ("Claude Haiku 5.5, Studyboard AI Mode", own key), all 1,100
conversations (2,085 turns), code from before 3995833d. Replies: `results-haiku-cloud.jsonl`. Verdicts: `judged-haiku-cloud.jsonl`,
judged by the method in `JUDGING.md` (the one used for E2B and E4B): one verdict per conversation, which passes only if every
turn is right. (This replaces an earlier per-turn grading with different rules, which gave 70% of turns passing.)

## Pass rates by category (conversations)
Content pass (slow-only counted as a pass). Strict pass (slow-only counted as a fail) is the same to within 1 point, except
E4B p2 (45% strict).

| Category | n | E2B (first run) | E4B first run | E4B now (after rr4) | Haiku 5.5 cloud (first run) |
|---|---|---|---|---|---|
| p1 Planner actions | 200 | 36% | 49% | 59% | 48% |
| p2 Their notes | 200 | 28% | 13% | 49% | 77% |
| p3 Knowledge and maths | 200 | 14% | 72% | 91% | 93% |
| p4 Planner questions, study help | 200 | 30% | 37% | 60% | 70% |
| p5 Study material, the app | 200 | 32% | 44% | 57% | 53% |
| p6 Companion chats | 100 | 0% | 19% | 50% | 63% |
| **All** | **1,100** | **25%** | **41%** | **62%** | **68%** |

What each column is:
- **E2B**: the first run, on the code before any of these fixes. 34 of its fails are runner errors, not replies.
- **E4B first run**: comparable to Haiku's first run.
- **E4B now**: after four rounds of fixes, each rerunning only what still failed.
- **Haiku**: one run on the code before 3995833d.

## Haiku: failures by cause (361 conversations: 357 fails, 4 slow-only)
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

The concrete causes behind those tags:
- **Refusals of supported edits** (~60): "I'm not able to do that from the chat yet" for priority, rename, room, cards, study
  sessions, and for plain writing (a plan, a timeline, a rhyme).
- **"Not in your planner"** (~40): the data was there, but its context (marks, events, instructors, notes) wasn't sent to Claude.
- **"Done" claims with no change** (~15).
- **Multi-item edits half done** (~15): "both", "everything due this week", "same for Thursday".
- **Deck, quiz and study follow-ups**: "add one more", "keep only 5", quiz me in the chat.
- **Small talk or note snippets pasted** instead of answers.
- **App gaps**: undo of chat changes, settings that stall, the wardrobe.

3995833d and later commits target these. Rerunning Haiku's 361 failing conversations on the current code needs a Claude key
(`IDS=` with those ids); this machine has none.
