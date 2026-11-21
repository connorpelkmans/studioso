# Studyboard's Own AI Model

A small model trained only on Studyboard's own AI jobs, so the free AI that runs on a student's computer does those jobs nearly as
well as Gemini Flash, without a bigger download or more power. It replaces the stock Gemma that WebLLM downloads today (when
Chrome has no built-in AI). This folder has everything to build it; the parts that need a graphics card are one script.

## Status

| Step | What | State |
|---|---|---|
| 0 | Every AI job in the app, cataloged (`tasks/CATALOG.md`: 28 structured, 11 reasoning, 8 picture/audio, 4 web) | Done |
| 0 | Held-out test set: 400 study articles + 4 hand-written notes with key facts (`data/splits/test.jsonl`) | Done |
| 1 | Source text: study-topic Wikipedia (CC BY-SA) from Wikimedia's dataset; OpenStax (CC BY books only) | Done here (2,500 articles); more on the GPU run |
| 1 | Realistic student input: slides, shorthand, scan errors, broken PDF text, transcripts (`corpus/noisify.py`) | Done |
| 1 | Teacher-written material for thin subjects (nursing, psychology, the arts...) (`teacher/write_notes.js`) | Ready; runs with the teacher |
| 2 | The app in the loop: the app's REAL on-device path, teacher answering best-of-n, scored by the app's own checks (`apploop.js`) | Done, tested end to end with a stand-in teacher |
| 2 | Inputs for the 37 other jobs, in the exact shape the app sends (`teacher/synth_inputs.js`) | Ready; runs with the teacher |
| 3 | Training sets, with a test-leakage guard (`train/prepare.py`) | Done, tested |
| 4 | Supervised fine-tuning, LoRA/QLoRA/full (`train/sft.py`, configs for Gemma 3 1B, Gemma 4 E2B, Qwen3 1.7B/4B) | Done, tested on CPU with a tiny model |
| 4 | Preference training on the student's own mistakes (`train/dpo.py`) | Done, tested on CPU with a tiny model |
| 3 | Comparison with Gemini per job: automatic checks + blind judge, parity verdict (`eval/compare.js`) | Done, tested |
| 3 | Your blind ratings, to check the judge agrees with you (`eval/rate/rate.html`) | Done |
| 5 | Package for the browser and upload (`export/merge.py`, `export/to_webllm.sh`) | Ready |
| 5 | The app can switch to it with one setting (`WEB_CUSTOM` in `src/js/01-ai-device.js`) | Done |
| — | **Needs a GPU**: teacher answers, training, evaluation | **Your turn: one command below** |

## What you need

- **A Linux computer with an NVIDIA graphics card**: your own, or rented by the hour (RunPod, Lambda, Vast.ai).
  - **Training only** (the teacher answers come from an API): 8 GB or more for the 1B model (QLoRA), 16 GB for the larger ones.
  - **Teacher on your own card**: 24 GB (RTX 3090/4090) runs Qwen3 30B-A3B, which is good but slower and a bit weaker than gpt-oss-120b. That needs an 80 GB card (rented H100 or A100, about $2–3 an hour).
  - **Apple Silicon Mac (16 GB or more)**: can train the 1B model with Apple's MLX tools (`pip install mlx-lm`, then `mlx_lm.lora` on `data/train/sft.jsonl`). The teacher still needs an API or a rented card.
- **A Hugging Face account**: accept Google's Gemma terms on the model page (google/gemma-3-1b-it), then run `hf auth login` on the GPU machine.
- **Optional: your own Gemini key** (`GEMINI_KEY`), used only to make the reference outputs for comparison. Never trained on: `prepare.py` refuses them.
- **Budget**: about $100–250 the first time (mostly the teacher), then about $20–40 a retrain. With your own 24 GB card, about $0 (it takes days instead of hours).

## Run it

On the GPU machine, from the repository root:

```bash
git clone <this repo> && cd studioso && git checkout claude/vigilant-heisenberg-owznuv
```

```bash
TEACHER=gpt-oss-120b STUDENT_CONFIG=ml/train/configs/gemma3-1b.yaml GEMINI_KEY=... HF_USER=<you> bash ml/run_gpu.sh
```

`TEACHER` is `gpt-oss-120b` (80 GB card), `qwen3-30b` (24 GB card), or `api` (set `TEACHER_URL`, `TEACHER_MODEL`, and `TEACHER_KEY` in the environment, e.g. DeepInfra's gpt-oss-120b). The script runs, in order, skipping finished steps when run again:

1. **setup**: Python libraries, Node and the test browser, vLLM.
2. **data**: more Wikipedia, OpenStax (CC BY only), the splits, the noisy copies.
3. **teacher-data**: the teacher writes thin-subject material and inputs for every job, then answers everything through the app's real on-device path (best of 4, scored by the app's own checks).
4. **sft**: round 1 training, then merge.
5. **eval**: the student on the held-out set; with `GEMINI_KEY`, Gemini on the same inputs, a blind judge, and `ml/eval/reports/*/report.md` with a verdict per job.
6. **dpo**: round 2, the student's own mistakes, sorted by the app's checks, then preference training.
7. **export**: package for WebLLM and upload to Hugging Face.

Run one part with `STEPS="eval"`. Compare models by running with each config and reading the reports side by side. Pick the best quality per gigabyte, and keep a "light" model for weak laptops.

**Rate 60 pairs yourself (about an hour)**: open `ml/eval/rate/rate.html` in a browser and load `ml/eval/reports/<model>-studyset/to-rate.json`. Save, then run:

```bash
node ml/eval/compare.js --cand ... --ref ... --out ml/eval/reports/<model>-studyset --ratings ratings.json
```

If the judge agrees with you less than about 70% of the time, sharpen `JUDGE_SYS` in `compare.js` before trusting its verdicts.

## Ship it

1. Set the uploaded model in `src/js/01-ai-device.js`:
   ```js
   const WEB_CUSTOM = {big16: null, big32: null, small: {id: "studyboard-gemma3-1b-it-q4f16_1-MLC", hf: "https://huggingface.co/<you>/"}};
   ```
   It replaces the stock model of the same size. The architecture is the same, so the WebLLM library Studyboard already ships runs it.
2. Run `node scripts/csp.js` and the device tests (`node tests/ai-webllm.e2e.js`, `node tests/ai-device.e2e.js`).
3. Update the privacy policy and in-app text where they name "Google's Gemma" (it becomes "Studyboard's AI, based on Google's Gemma"), and `THIRD-PARTY-NOTICES.md`.
4. Ship to some students first and compare how many cards they delete or edit on the review screen.

**Only jobs marked PARITY should rely on it.** For the others, keep the honest labels and the ChatGPT/Gemini option.

## How it works (and why)

- **The app in the loop** (`apploop.js`). Studyboard runs headless with its WebLLM engine replaced by a bridge to the model being trained or tested. Every request is exactly what the downloaded model gets on a student's computer: the same instructions, sections, fitting to 4,096 tokens, and 1,200-token answers. So the model learns the real prompts, not a copy that drifts from the app.
- **Best of n, scored by the app's own checks.** These are `window.__sbAIGates` in test mode: the card gate (repeats, too long, vague, copied), grounding against the notes, the source sentence check, the question gate, and facts in the notes. The best answer goes back to the app, so later steps (cards from facts, the self-check quiz) see good input. Everything is logged, the good becomes training data, and good-vs-worse pairs become preference data.
- **Two rounds.** Supervised fine-tuning on the best answers, then DPO on the student's own outputs sorted by the same checks. The second round fixes the student's own habits (made-up facts, vague fronts), which is where small models fail most.
- **Licenses.**
  - Teachers: gpt-oss and Qwen are Apache 2.0, and Gemma's terms allow training on its output (the result is then a Gemma "model derivative", under Gemma's terms).
  - Never Gemini or Claude outputs for training: their terms restrict building other models. Gemini is used for evaluation only.
  - Source text: CC BY / CC BY-SA, or written by the teacher. No real student's notes.

## Files

| Path | What |
|---|---|
| `tasks/` | The job catalog, built from the captured requests (`capture/`) |
| `corpus/` | Source fetchers (`fetch_openstax.py`, `fetch_wikipedia.py`, `wiki_from_hf.py`), `noisify.py`, `split.py` |
| `teacher/` | `synth_inputs.js` (inputs for every job), `write_notes.js` (material for thin subjects) |
| `apploop.js` | Generate / evaluate / reference through the real app |
| `lib/` | Model client (any OpenAI-compatible server), schema check, job names, `mockserver.js` (a stand-in model for testing) |
| `train/` | `prepare.py`, `sft.py`, `dpo.py`, `configs/` |
| `eval/` | `handnotes.jsonl` (key facts), `compare.js`, `rate/rate.html` |
| `export/` | `merge.py`, `to_webllm.sh` |
| `run_gpu.sh` | Everything that needs a GPU, in order |

Data, outputs and model weights stay out of git (`.gitignore`). The scripts rebuild them: the Wikipedia dataset version is fixed, so the splits come out the same. The test set is committed, so every model is scored on the same notes.

## Checking the pipeline without a GPU (what was run here)

```bash
node ml/lib/mockserver.js 8090 &
```

```bash
TEACHER_URL=http://127.0.0.1:8090/v1 TEACHER_MODEL=mock node ml/apploop.js generate --driver studyset --docs ml/eval/handnotes.jsonl --out /tmp/gen.jsonl --n 3 --limit 2
```

```bash
python3 ml/train/prepare.py --gen /tmp/gen.jsonl --out ml/data/train --min-score 0 --gap 1
```

```bash
python3 ml/train/sft.py --config ml/train/configs/smoke.yaml --max-steps 6
```

```bash
python3 ml/export/merge.py --adapter ml/out/smoke-sft --out ml/out/smoke-sft-merged
```

```bash
python3 ml/train/dpo.py --config ml/train/configs/smoke.yaml --max-steps 4
```
