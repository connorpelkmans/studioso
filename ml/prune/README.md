# Studyboard 26B: Gemma 4 26B cut down for 16 GB laptops

Google's Gemma 4 26B is far smarter than the models that fit a laptop today (Chrome's built-in AI, Gemma 4 E2B/E4B), but at
4-bit it's a 15 GB file and needs about 16.6 GB of memory: too much for a 16 GB laptop. This folder makes a smaller version
that keeps the parts Studyboard's jobs use, aiming for **about 7 GB on disk and about 8.5 GB in use**, which fits a 16 GB Mac
(macOS lets the graphics chip use about 10.7 GB) and a 16 GB Windows laptop with no graphics card (with the system, a browser
and Studyboard open).

## How

Gemma 4 26B is a mixture of experts: each of its 30 layers has **128 experts**, and each word goes to 8 of them. The experts
are **22.8B of its 25.8B parameters**; only about 3.8B are used per word. So the size is mostly experts that a given job
rarely or never uses.

1. **Calibration** (`calib_lang.js`, `calib.py`): the full model answers real Studyboard requests through the app's own code
   (`ml/apploop.js`: flashcards, quizzes, syllabus reading, quick add, every job in `ml/tasks/CATALOG.md`), and the same jobs
   with the student's material in Spanish, French, German, Portuguese, Chinese, Hindi and Arabic.
2. **Measure** (`reap.py`): for every layer and expert, how much it contributes to those answers: REAP, the average of gate
   weight x output size over the words routed to it (Lasby et al., 2025, "REAP the Experts").
3. **Cut** (`prune.py`): keep the same number of experts in every layer, chosen by REAP. Every job and every language counts
   equally (a rare job isn't outvoted by flashcards), and each one's own top 2 experts always stay. Nothing is retrained:
   the router picks its 8 from the experts that remain, and a word whose 8 all stay is computed exactly as before.
4. **Check** (`kl.py`, then `ml/eval/compare.js`): word by word, how often the cut model's next word matches the full
   model's on held-out texts; then job by job through the app, on held-out material, judged blind against the full model.
5. **Package** (`run_prune.sh` step gguf): llama.cpp GGUF files, compressed with an importance matrix computed from
   Studyboard's own texts (so precision is kept where these jobs need it), plus the picture reader as a separate small file.
   The packaged files themselves are checked job by job again, since packaging loses a little too.

## Sizes (from the real tensor shapes: `python ml/prune/sizes.py`)

| experts kept | params | Q4_K_M | IQ4_XS | experts IQ3_S, rest Q6_K |
|---|---|---|---|---|
| 128 (full) | 25.2B | 15.4 GB, 16.6 in use | 13.5 GB, 14.7 | 11.8 GB, 13.0 |
| 80 | 16.7B | 10.2 GB, 11.4 | 9.0 GB, 10.1 | 8.1 GB, 9.3 (tight) |
| 72 | 15.2B | 9.3 GB, 10.5 | 8.2 GB, 9.4 (tight) | **7.5 GB, 8.7 (fits)** |
| 64 | 13.8B | 8.5 GB, 9.7 (tight) | **7.4 GB, 8.6 (fits)** | **6.9 GB, 8.1 (fits)** |
| 56 | 12.4B | **7.6 GB, 8.8 (fits)** | 6.7 GB, 7.9 | 6.3 GB, 7.4 |

"In use" adds the attention cache for 16,384 words (0.38 GB; most layers only look back 1,024 words) and 0.8 GB of working
space. Speed stays about the same whatever the count, since each word still uses about 3.8B parameters: expect roughly
20-35 words a second on an M1-M4 Mac and 8-15 on a laptop without a graphics card (estimates).

The likely winner is **64 or 72 experts**, but that's for the checks to decide: fewer experts with gentler compression, or
more experts with harder compression of the experts only. `run_prune.sh` builds and checks all of them.

## What's been checked so far

`python ml/prune/smoke.py` builds a tiny random model with Gemma 4 26B's exact layout and tensor names and checks the method
on the CPU in under a minute:
- every routed word is counted;
- keeping all experts gives identical outputs;
- a pruned model gives exactly the outputs of the full model with the dropped experts switched off in its router (so pruning
  changes nothing else);
- every job's and language's top experts stay;
- the word-by-word check gives 100% agreement for an identical model and less for a pruned one.

`calib.py` was also run on sample records with Gemma 4's real tokenizer and chat format.

**Not yet run: the real model.** That needs an 80 GB graphics card. Whether 64 or 72 experts really keeps quality on every
job is exactly what the run measures: published results on similar models (REAP on Qwen3 and GLM) kept quality at 25-50%
pruning on the tasks they calibrated for, but Studyboard spans every school subject, so don't count on it until the report
says PARITY.

## Run it

On a rented Linux machine with an **80 GB card (H100 or A100 80GB, about $2-3 an hour)** and about **400 GB of disk**:

```bash
git clone <this repo> && cd studioso && git checkout claude/vigilant-heisenberg-owznuv
```

```bash
bash ml/prune/run_prune.sh
```

About 12-20 hours in all, so roughly $30-60 (most of it is the full model writing the calibration answers and the
job-by-job checks). No API keys are needed: the full model itself writes the calibration answers and judges. Run some steps
with `STEPS="..."` and some counts with `KEEPS="72 64"`; finished work is skipped when run again.

At the end, `ml/prune/work/REPORT.md` has one table: for each cut model and each packaged file, its size, memory in use, how
closely it follows the full model, and which jobs are at PARITY. It names the pick: the most capable file that fits a 16 GB
laptop and matches the full model on every A-tier job.

## If a job falls short

- More experts with experts-only 3-bit compression (`KEEPS="80" PACKAGES="exps-IQ3_S exps-IQ3_XXS"`).
- More calibration for that job or language (`PER_JOB`, `PER_LANG`, `LANGS`), then rerun from `calib`.
- **Healing** (not built yet): a short fine-tune of the cut model on the full model's own answers (`ml/prune/work/train/`),
  with `ml/train/sft.py` and LoRA on the attention and routers, to win back what pruning lost. Only worth it if the report
  shows a gap.

## Licences

Gemma 4 is Apache 2.0, so a cut-down version can be shipped (keep Google's notice; name it as based on Gemma 4 in
`THIRD-PARTY-NOTICES.md`). All training and calibration answers come from Gemma 4 itself, not from Claude or Gemini, whose
terms restrict using their outputs to build models.

## Using it in Studyboard

The app doesn't run GGUF files yet. In the browser, WebLLM can't hold a model this size. The desktop app would run it
natively with llama.cpp (for example `node-llama-cpp` in Electron's main process): offered on computers with 16 GB or more,
downloaded in the background after the student agrees, and used in place of Gemma 4 E2B. That's the next piece of work after
the report picks a file.
