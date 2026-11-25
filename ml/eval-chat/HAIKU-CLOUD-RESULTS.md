# Claude Haiku 5.5 through the app's cloud path: first run (2026-11-25)

`ENGINE=cloud`: the app as a student with Claude uses it ("Claude Haiku 5.5, Studyboard AI Mode", own key), all 1,100 conversations
(2,085 turns), code from before 3995833d. Every turn judged against planner.js and its expectation (8 judges, one rule set):
`judged-haiku-cloud.jsonl` (id, turn, verdict, cause, note). Replies: `results-haiku-cloud.jsonl`.

| Category | Turns | Pass | Partial | Fail |
|---|---|---|---|---|
| p1 Planner actions | 326 | 178 (54%) | 36 | 112 |
| p2 Their notes | 325 | 234 (72%) | 55 | 36 |
| p3 Knowledge and maths | 339 | 312 (92%) | 20 | 7 |
| p4 Planner questions, study help | 335 | 230 (68%) | 54 | 51 |
| p5 Study material, the app | 353 | 201 (56%) | 80 | 72 |
| p6 Companion chats | 407 | 321 (78%) | 58 | 28 |
| **All** | **2,085** | **1,476 (70%)** | **303** | **306** |

Speed: median 2.6 s a turn, 90% under 6 s (after the structured-outputs fix in 01-ai-policy.js; before it, 3 minutes a request).

## Causes (partial and fail)
- **no_action 101** (p1 53, p5 37): says it did something ("I marked Read Chapter 7 as done", "added the card") and nothing changed.
- **not_found 91** (p4 33, p2 29): marks, events, instructors and notes said to be missing when they're in the planner: Claude
  wasn't sent them.
- **false_cant 72**: "I'm not able to do that from the chat yet" for things the chat does (priority, rename, room, cards, study
  sessions) and for plain writing (a plan, a timeline, a rhyme, a joke).
- **poor_chat 59** (p6 34): stilted, preachy or padded replies.
- **wrong_fact 58**, **followup_lost 56** (a follow-up about what it just said looked up as a new question: "who else was on the
  moon landing" after naming Aldrin and Collins), **wrong_action 46** (relative dates off, a grade removal deleted the task, 17 on the
  psych paper overwrote 88/100), **garbled 30** (cut note snippets instead of answers), **slow 27**, **unasked_change 16** (88 on the
  psych paper saved onto the midterm; "i'm putting that on a sticky note" made one), **off_topic 14** ("hi bramble" and "hello again"
  sent to a web search; flashcards about torrent files and the game show "500 Questions"), **wrong_target 13** (a study group name
  renamed the Psych Midterm).

## Next
3995833d (after this run) targets the biggest causes: planner data sent to Claude, writing requests not refused, notes answered not
pasted, short follow-ups keeping their topic, "Done" only when done. Rerun the 454 conversations with a partial or fail on the current
code (`IDS=haiku-cloud-retry.txt`) and judge them again; fix what's left.
