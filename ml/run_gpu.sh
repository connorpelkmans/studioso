#!/usr/bin/env bash
# Everything that needs a graphics card, in order, on ONE Linux machine with an NVIDIA GPU (a rented one, or your own).
# Run from the repository root. Each step skips work already done, so it's safe to run again after a stop.
#
#   TEACHER=gpt-oss-120b  bash ml/run_gpu.sh        # 80 GB card (H100/A100 80GB): the strongest teacher
#   TEACHER=qwen3-30b     bash ml/run_gpu.sh        # 24 GB card (RTX 3090/4090): a good teacher, slower and a bit weaker
#   TEACHER=api           bash ml/run_gpu.sh        # teacher from an API (set TEACHER_URL, TEACHER_MODEL; key via TEACHER_KEY)
#   STUDENT_CONFIG=ml/train/configs/gemma3-1b.yaml (default) or gemma4-e2b.yaml / qwen3-1.7b.yaml / qwen3-4b.yaml
#   STEPS="data teacher-data sft eval dpo export" (default: all, in order)
set -euo pipefail
cd "$(dirname "$0")/.."
TEACHER="${TEACHER:-gpt-oss-120b}"; CFG="${STUDENT_CONFIG:-ml/train/configs/gemma3-1b.yaml}"; STEPS="${STEPS:-setup data teacher-data sft eval dpo export}"
PER_JOB="${PER_JOB:-300}"; DOCS_LIMIT="${DOCS_LIMIT:-2500}"; N="${N:-4}"; WORKERS="${WORKERS:-6}"
has() { [[ " $STEPS " == *" $1 "* ]]; }
OUT=$(python3 -c "import yaml; print(yaml.safe_load(open('$CFG'))['output_dir'])")

if has setup; then
  echo "== setup: Python training libraries, Node + the app's test browser, vLLM"
  python3 -m pip install -q -r ml/requirements-train.txt
  [ "$TEACHER" = api ] || python3 -m pip install -q vllm
  command -v node >/dev/null || { curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs; }
  npm install --no-audit --no-fund >/dev/null
  npx playwright install --with-deps chromium >/dev/null
fi

start_teacher() {
  [ "$TEACHER" = api ] && return
  if ! curl -s localhost:8000/v1/models >/dev/null; then
    case "$TEACHER" in
      gpt-oss-120b) M=openai/gpt-oss-120b; ARGS="--max-model-len 16384" ;;
      qwen3-30b) M=Qwen/Qwen3-30B-A3B-Instruct-2507; ARGS="--max-model-len 16384 --quantization fp8" ;;
      *) M="$TEACHER"; ARGS="--max-model-len 16384" ;;
    esac
    echo "== starting the teacher ($M) on :8000"
    nohup vllm serve "$M" $ARGS --port 8000 > ml/out/teacher.log 2>&1 &
    until curl -s localhost:8000/v1/models >/dev/null; do sleep 10; done
    export TEACHER_MODEL="$M"
  fi
  export TEACHER_URL="${TEACHER_URL:-http://127.0.0.1:8000/v1}" TEACHER_CONCURRENCY="${TEACHER_CONCURRENCY:-32}"
  export TEACHER_MODEL="${TEACHER_MODEL:-$(curl -s localhost:8000/v1/models | python3 -c 'import json,sys; print(json.load(sys.stdin)["data"][0]["id"])')}"
}
mkdir -p ml/out ml/data/gen ml/data/inputs

if has data; then
  echo "== source text (CPU only; skipped if already there)"
  [ -s ml/data/raw/wikipedia.jsonl ] || python3 ml/corpus/wiki_from_hf.py --shards 0,1,2,3 --out ml/data/raw/wikipedia.jsonl --max 6000 --per-subject 500
  [ -s ml/data/raw/openstax.jsonl ] || python3 ml/corpus/fetch_openstax.py --out ml/data/raw/openstax.jsonl --per-book 80 || true
  [ -s ml/data/splits/test.jsonl ] || python3 ml/corpus/split.py --in ml/data/raw/wikipedia.jsonl ml/data/raw/openstax.jsonl ml/eval/handnotes.jsonl --test 400 --dev 150
  [ -s ml/data/splits/train.noisy.jsonl ] || python3 ml/corpus/noisify.py --in ml/data/splits/train.jsonl --out ml/data/splits/train.noisy.jsonl
  [ -s ml/data/splits/test.noisy.jsonl ] || python3 ml/corpus/noisify.py --in ml/data/splits/test.jsonl --out ml/data/splits/test.noisy.jsonl --seed 9
fi

if has teacher-data; then
  start_teacher
  if [ ! -s ml/data/raw/written.jsonl ]; then
    echo "== teacher writes course material for thin subjects (nursing, psychology, the arts...), then the splits are redone"
    node ml/teacher/write_notes.js --out ml/data/raw/written.jsonl --topics 40
    python3 ml/corpus/split.py --in ml/data/raw/wikipedia.jsonl ml/data/raw/openstax.jsonl ml/data/raw/written.jsonl ml/eval/handnotes.jsonl --test 400 --dev 150
    python3 ml/corpus/noisify.py --in ml/data/splits/train.jsonl --out ml/data/splits/train.noisy.jsonl
  fi
  echo "== teacher writes inputs for the other app jobs, then answers everything through the app's real on-device path (best of $N)"
  node ml/teacher/synth_inputs.js --docs ml/data/splits/train.noisy.jsonl --per-job "$PER_JOB" --out ml/data/inputs/train.jsonl
  node ml/teacher/synth_inputs.js --docs ml/data/splits/test.noisy.jsonl --per-job 15 --out ml/data/inputs/test.jsonl
  for MODE in cards both quiz; do
    node ml/apploop.js generate --driver studyset --mode "$MODE" --docs ml/data/splits/train.noisy.jsonl --limit "$DOCS_LIMIT" --out "ml/data/gen/studyset-$MODE.jsonl" --model TEACHER --n "$N" --workers "$WORKERS"
  done
  node ml/apploop.js generate --driver replay --inputs ml/data/inputs/train.jsonl --out ml/data/gen/replay.jsonl --model TEACHER --n "$N" --workers "$WORKERS"
  python3 ml/train/prepare.py --gen 'ml/data/gen/*.jsonl' --out ml/data/train
fi

serve_student() {  # $1 = model dir; serves it OpenAI-style on :8001 for the app loop
  pkill -f "port 8001" || true
  nohup vllm serve "$1" --port 8001 --max-model-len 6144 > ml/out/student.log 2>&1 &
  until curl -s localhost:8001/v1/models >/dev/null; do sleep 5; done
  export STUDENT_URL=http://127.0.0.1:8001/v1 STUDENT_MODEL="$1"
}

if has sft; then
  echo "== round 1: supervised fine-tuning ($CFG)"
  [ -s "$OUT/sft-result.json" ] || python3 ml/train/sft.py --config "$CFG"
  [ -d "$OUT-merged" ] || python3 ml/export/merge.py --adapter "$OUT" --out "$OUT-merged"
fi

if has eval; then
  echo "== evaluation on held-out notes: the student (and, once, Gemini as the bar)"
  serve_student "$OUT-merged"
  NAME=$(basename "$OUT")
  node ml/apploop.js eval --driver studyset --mode both --docs ml/data/splits/test.noisy.jsonl --out "ml/eval/out/$NAME.studyset.jsonl" --model STUDENT --workers "$WORKERS"
  node ml/apploop.js eval --driver replay --inputs ml/data/inputs/test.jsonl --out "ml/eval/out/$NAME.replay.jsonl" --model STUDENT --workers "$WORKERS"
  if [ -n "${GEMINI_KEY:-}" ]; then
    [ -s ml/eval/out/gemini.studyset.jsonl ] || node ml/apploop.js reference --driver studyset --mode both --docs ml/data/splits/test.noisy.jsonl --out ml/eval/out/gemini.studyset.jsonl --workers 2
    [ -s ml/eval/out/gemini.replay.jsonl ] || node ml/apploop.js reference --driver replay --inputs ml/data/inputs/test.jsonl --out ml/eval/out/gemini.replay.jsonl --workers 2
    J="--judge"; [ -n "${JUDGE_URL:-}" ] || { export JUDGE_URL="$TEACHER_URL" JUDGE_MODEL="$TEACHER_MODEL"; }
    node ml/eval/compare.js --cand "ml/eval/out/$NAME.studyset.jsonl" --ref ml/eval/out/gemini.studyset.jsonl --docs ml/data/splits/test.noisy.jsonl --out "ml/eval/reports/$NAME-studyset" $J --export-rating 60
    node ml/eval/compare.js --cand "ml/eval/out/$NAME.replay.jsonl" --ref ml/eval/out/gemini.replay.jsonl --out "ml/eval/reports/$NAME-replay" $J
  else echo "   (set GEMINI_KEY to compare with Gemini)"; fi
fi

if has dpo; then
  echo "== round 2: the student's own mistakes, sorted by the app's checks, then preference training (DPO)"
  serve_student "$OUT-merged"
  node ml/apploop.js generate --driver studyset --mode both --docs ml/data/splits/train.noisy.jsonl --limit 800 --out ml/data/gen-onpolicy/studyset.jsonl --model STUDENT --n 4 --workers "$WORKERS"
  node ml/apploop.js generate --driver replay --inputs ml/data/inputs/train.jsonl --limit 3000 --out ml/data/gen-onpolicy/replay.jsonl --model STUDENT --n 4 --workers "$WORKERS"
  python3 ml/train/prepare.py --gen 'ml/data/gen-onpolicy/*.jsonl' --out ml/data/train-onpolicy --min-score 10 --gap 6
  python3 - "$CFG" <<'PY'
import sys, yaml
c = yaml.safe_load(open(sys.argv[1])); c.setdefault("dpo", {})["train"] = "ml/data/train-onpolicy/dpo.jsonl"; c["dpo"]["start_from"] = c["output_dir"] + "-merged"
yaml.safe_dump(c, open(sys.argv[1] + ".dpo.yaml", "w"))
PY
  python3 ml/train/dpo.py --config "$CFG.dpo.yaml"
  python3 ml/export/merge.py --adapter "$OUT-dpo" --out "$OUT-final-merged"
  echo "   now run STEPS=eval again with OUT pointing at the final model to see the change"
fi

if has export; then
  echo "== packaging for the browser (WebLLM) and uploading (needs HF_USER)"
  FINAL="$OUT-final-merged"; [ -d "$FINAL" ] || FINAL="$OUT-merged"
  [ -n "${HF_USER:-}" ] && bash ml/export/to_webllm.sh "$CFG" "$FINAL" "$HF_USER" || echo "   set HF_USER to upload; the merged model is in $FINAL"
fi
echo "== done"
