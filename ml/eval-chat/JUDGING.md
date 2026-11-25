# How every chat reply is judged (the rules used for judged-haiku-cloud.jsonl)

Studyboard is a student planner. Each line of your input file is one conversation: `{id, cat, turns: [...]}`. Each turn has the
student's message `q`, what the test writer expected `expect` (sometimes wrong), the reply `ans` (cut at 1,500 characters),
`opened` (a sheet/page the chat opened, if any), `leftChat` (the chat navigated away to a page: then `ans` may be empty, which is fine
if going to that page is what was asked), `stateCheck`/`stateOk` (an automatic JS check of the planner after the turn: null = none;
a check can be wrong or too strict), `changed` (what changed in the planner), `secs` (time).

Every conversation starts from the same sample planner: ml/eval-chat/planner.js (a nursing student; courses PSYN 2100,
BIOS 230, BSNC 1000, HIST 1010; dates are relative: d(n) = today + n days). Read it first. Check the run date: the first Haiku run started Tuesday 2026-11-24 and passed midnight (from about p1-141 "today" was Wed Nov 25)
(so d(1) = Wed Nov 25). Judge against planner.js, not only `expect`.

The bar the owner set: any wording understood; follow-ups that work (answers to its own questions, "it/that/what about X/why", "make it
more detailed"); an honest "I can't do that yet" instead of a wrong or unrelated answer; never changing something nobody asked to change;
never answering a question nobody asked; quick replies; a companion that holds a good, natural conversation without drifting.

For EVERY turn, write one JSON line to your output file:
{"id": "...", "turn": 0-based index, "verdict": "pass" | "partial" | "fail", "cause": one of the causes below or "", "note": "under 25 words"}
Causes: wrong_target (acted on the wrong item), wrong_action (a different change than asked, or the wrong value), no_action (asked to
do something the app can do, did nothing), false_cant (said it can't, but this is something the chat can do), unasked_change (changed or
offered to change something on a question or chat message), followup_lost (lost the thread of the conversation), wrong_fact (incorrect
information, including about the planner), not_found (said it couldn't find/answer something it should know), off_topic (answered
something else), poor_chat (companion replies robotic, preachy, repetitive or off-track), garbled (odd wording, leaked JSON/markup,
truncated), slow (over 15 s), other.
Pass = fully right. Partial = right but with a real flaw (e.g. needed a confirm when it could just act, slightly wrong detail, slow).
Be strict and consistent; don't fail a turn only because `expect` disagrees with planner.js when the reply is right by planner.js.

When a judge (a subagent) is done, it replies with ONLY: counts of pass/partial/fail, the top 5 causes with counts, and the 10 most important failures as
"id turn: what went wrong (cause)". Nothing else.
