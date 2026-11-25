# Studyboard AI chat evaluation: handoff

This folder lets a session on a computer with a graphics chip run the full chat test that was too slow on a CPU-only cloud machine.
Branch: `claude/vigilant-heisenberg-owznuv` (push there only). The test site `test-studioso.connor-pelkmans.workers.dev` deploys
every non-main branch to one shared alias, so another branch's push can replace it; redeploy this branch's build if that happens.

## What the owner asked for
Ask the on-device AI (Gemma 4 E4B on 16 GB+ laptops; Chrome's built-in AI / Gemma 4 E2B below that) **1,100 conversations**
(`conversations.json`: 2,085 messages, 711 with follow-ups, plus 100 casual companion chats of 4 to 5 turns), judge every reply,
and for every failure **change the instructions and architecture so it's right next time**. Different instructions per engine:
E4B's matched to what it can do; the smaller ones (Chrome's AI, E2B, Apple's) get extra worked examples and helping hands.
The owner wants: any wording understood, honest "I can't do that yet" instead of wrong or unrelated answers, real follow-ups
(answers to its own questions, "it/that/what about X/why", "make it more detailed"), quick replies, and a companion that holds a
nice conversation without drifting.

## Files
- `conversations.json`: the 1,100 conversations, `{id, cat, turns: [{q, expect, state?}]}`. ids p1 (planner actions), p2 (their
  notes), p3 (general knowledge and maths), p4 (planner questions and study help), p5 (study material and the app), p6 (casual chat).
  `state` is a JS check on the planner after that turn (helpers: T, TB, E, C, D, NT, same, A, B). Some writers' expectations can
  be off (e.g. the sample planner does have class meeting times): judge against `planner.js`, not just `expect`.
- `planner.js`: the sample planner every conversation starts from (a nursing student: PSYN 2100, BIOS 230, BSNC 1000, HIST 1010).
- `run.js`: the runner. Each conversation in a fresh copy of the app (served from this repo), turns sent through the real chat
  (`#cptIn`/`#cptGo`), one JSON line per conversation in OUT with each turn's reply, any sheet opened, whether it left the chat,
  the state check, and what changed. Wikipedia goes through a disk cache. Resumes from OUT.
- `actions-bank.js`, `quickadd-bank.js`: the earlier phrasing banks (199 action wordings; 3,451 quick-add wordings, all passing).

## Running it with a graphics chip
The CPU-only run used llama-cpp-python serving GGUF files as stand-ins: `gemma3n-e2b-q4km.gguf` (Gemma 3n E2B, for Chrome's AI)
on port 8088 and Google's QAT `gemma-4-e4b` Q4_0 GGUF on 8089. With a GPU, use a llama.cpp server build for it (CUDA or Vulkan)
with the same models and ports, n_ctx 8192. Then, from this folder:
`ENGINE=chrome QFILE=conversations.json OUT=results-e2b.jsonl node run.js` (and `ENGINE=e4b ... OUT=results-e4b.jsonl`).
Playwright: `tests/pw.js` finds Chromium; install with `npx playwright install chromium` if needed.
Even better where possible: the real thing in Chrome (the app's own LiteRT-LM WebGPU engine), but the runner stubs the engine.

## Judging and fixing
Grade every turn: action turns by `state` and what changed; answers by reading them against `expect` and `planner.js` (use
subagents over chunks). Group failures by cause, fix in `src/js/` (build with `node scripts/app-files.js`), add a check to
`tests/chat-direct.e2e.js`, rerun the failures, commit and push. Keep `tests/chat-direct`, `chat-controls`, `ai-truth`, `ai-e4b`
passing. Known pre-existing failures: `assist-actions` (3 checks: the Ask bubble now applies edits directly), `ai-planner-facts`
(one marks check), `capture.e2e` (input focus).

## The architecture now (src/js/98-companion-tab.js unless noted)
- Order in the chat: two-in-one requests (split, each done) → timer/undo controls → the companion about itself → follow-ups
  (slot answers, more on a map, maths carried on, "it/that/what about/why" rewritten against the last turn) → `directAct`
  (exact handlers: flashcard into a named deck, empty deck, study a deck, quiz from a deck/card, cards from a quiz, notes with
  their words, themes, accessory colours, wear by kind, study groups) → instant planner answers (`98-truth.js` facts, questions
  only) → the AI's action step `intentAct`/`route` (every non-question on device; requests only on Gemini/Claude) with its
  choice checked against the words (done vs moved vs priority, notes only when asked for, the course they named, joining vs
  starting a group, questions never change anything) → notes-then-web knowledge (`98-truth.js` knowledge) → the general chat
  model with the last 6 turns. A request nothing could do says so plainly.
- `ISYS_SMALL`: extra worked examples for the smaller models; E4B reads the base `ISYS`.
- `98-truth.js`: arithmetic without eval (`calc`), class announcements, "how am I doing" overview, backups and the assistant's
  own saved replies never used as study material (`30-search.js`).
- `75-capture.js`: quick add strips how it was said ("i have hw3 due monday at 4" is Homework 3).
- E4B (`01-ai-device.js`, `vendor/litertlm-0.19.0/worker.js`): plain JSON answers (the constrained tool mode wasn't proven fast),
  worker loaded at `worker.js?v=` (vendor files are cached for a month), loads early, falls back to the other AI if it never answers,
  `SBAITEST()` in the console times both answer modes on the user's GPU. Model download: Studyboard's own copy on Cloudflare
  static assets (`cloudflare/ai-model`), Hugging Face as fallback.

## Started on CPU before the move
`p3` (general knowledge and maths) had begun on E2B. First finding, already fixed: maths follow-ups ("divide that by 3",
"show your work") now carry on from the last result.

## Claude Haiku 5.5 runs (no graphics chip needed)
Both need `npm install --no-save @anthropic-ai/sdk` and `ANTHROPIC_API_KEY` (a Claude Console key: sk-ant-api... or a personal sk-ant-usr...).
- `ENGINE=cloud`: the app's real Claude path ("Claude Haiku 5.5, Studyboard AI Mode", the student's own key): its cloud instructions
  and steps, none of the on-device helpers. The app calls the Claude API itself; the runner counts tokens and reports rate limits.
  This is the comparison for Studyboard AI.
- `ENGINE=e4b CLAUDE=claude-haiku-5-5`: Haiku answering in place of the on-device model, through the on-device path (E4B's instructions
  and steps). Thinking off, effort low; schemas are given in the prompt (`CLAUDE_FORMAT=1` enforces them with structured outputs,
  but compiling the 30-field intent schema took about 3 minutes a request).
A long turn reports every 30s what it's waiting on; a crashed test browser is started again; a sign-in error stops the run at once.
