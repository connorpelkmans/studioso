#!/usr/bin/env bash
# Studyboard's own Gemma 4 26B for 16 GB laptops: everything, in order, on ONE Linux machine with an 80 GB NVIDIA card
# (a rented H100/A100 80GB) and about 400 GB of disk. Run from the repository root; each step skips work already done.
# What each step does and why: ml/prune/README.md.
#
#   bash ml/prune/run_prune.sh                                  # all steps
#   STEPS="kl eval" KEEPS="72 64" bash ml/prune/run_prune.sh    # some steps, some expert counts
#
#   FULL      the full model (default google/gemma-4-26B-A4B-it)
#   KEEPS     experts kept per layer to try (default "80 72 64 56"; of 128)
#   PACKAGES  4-bit packages to build per kept count (default: Q4_K_M, IQ4_XS, experts-IQ3_S/rest-Q6_K)
#   PER_JOB, DOCS_LIMIT, LANGS, EVAL_DOCS, CTX: calibration and evaluation sizes (defaults below)
#   JUDGE_URL/JUDGE_MODEL/JUDGE_KEY: a judge for the job-by-job comparison (default: the full model itself, served here)
set -euo pipefail
cd "$(dirname "$0")/../.."
FULL="${FULL:-google/gemma-4-26B-A4B-it}"; KEEPS="${KEEPS:-80 72 64 56}"; W=ml/prune/work
STEPS="${STEPS:-setup calib-data calib reap prune kl eval gguf eval-gguf report}"
PER_JOB="${PER_JOB:-40}"; DOCS_LIMIT="${DOCS_LIMIT:-240}"; LANGS="${LANGS:-es,fr,de,pt,zh,hi,ar}"; PER_LANG="${PER_LANG:-40}"
EVAL_DOCS="${EVAL_DOCS:-120}"; CTX="${CTX:-16384}"; WORKERS="${WORKERS:-6}"
PACKAGES="${PACKAGES:-Q4_K_M IQ4_XS exps-IQ3_S}"
LCPP="$W/llama.cpp"
has() { [[ " $STEPS " == *" $1 "* ]]; }
mkdir -p "$W"/{gen,inputs,eval,gguf,logs}

stop_servers() { pkill -f "vllm serve" || true; pkill -f llama-server || true; sleep 5; }
serve() {  # $1 model (dir or id), $2 port, $3 env prefix (TEACHER/STUDENT/JUDGE)
  stop_servers
  echo "   serving $1 on :$2"
  nohup vllm serve "$1" --port "$2" --max-model-len "$CTX" --gpu-memory-utilization 0.92 > "$W/logs/serve-$2.log" 2>&1 &
  until curl -s "localhost:$2/v1/models" >/dev/null; do sleep 10; done
  export "$3_URL=http://127.0.0.1:$2/v1" "$3_MODEL=$1" "$3_CONCURRENCY=${CONCURRENCY:-32}"
}
serve_gguf() {  # $1 gguf file, $2 port, $3 prefix
  stop_servers
  echo "   serving $1 (llama.cpp) on :$2"
  nohup "$LCPP/build/bin/llama-server" -m "$1" -ngl 99 -c "$((CTX * 4))" -np 4 --jinja --port "$2" > "$W/logs/llama-$2.log" 2>&1 &
  until curl -s "localhost:$2/v1/models" >/dev/null; do sleep 5; done
  export "$3_URL=http://127.0.0.1:$2/v1" "$3_MODEL=$(basename "$1")" "$3_CONCURRENCY=4"
}

if has setup; then
  echo "== setup: training libraries, vLLM, Node and the app's test browser (ml/run_gpu.sh), then llama.cpp with CUDA"
  STEPS=setup bash ml/run_gpu.sh
  [ -d "$LCPP" ] || git clone --depth 1 https://github.com/ggml-org/llama.cpp "$LCPP"
  python3 -m pip install -q -r "$LCPP/requirements/requirements-convert_hf_to_gguf.txt"
  [ -x "$LCPP/build/bin/llama-server" ] || { cmake -S "$LCPP" -B "$LCPP/build" -DGGML_CUDA=ON -DLLAMA_CURL=OFF >/dev/null && cmake --build "$LCPP/build" -j --target llama-quantize llama-imatrix llama-server; }
  python3 -c "from huggingface_hub import snapshot_download as s; print('full model at', s('$FULL', allow_patterns=['*.json','*.safetensors','*.jinja']))"
fi

if has calib-data; then
  echo "== 1. calibration: the full model answers real app requests (the app's own path), then the same jobs in $LANGS"
  STEPS=data bash ml/run_gpu.sh
  serve "$FULL" 8000 TEACHER
  [ -s "$W/inputs/train.jsonl" ] || node ml/teacher/synth_inputs.js --docs ml/data/splits/train.noisy.jsonl --per-job "$PER_JOB" --out "$W/inputs/train.jsonl"
  [ -s "$W/inputs/test.jsonl" ] || node ml/teacher/synth_inputs.js --docs ml/data/splits/test.noisy.jsonl --per-job 12 --out "$W/inputs/test.jsonl"
  for MODE in cards quiz; do
    [ -s "$W/gen/studyset-$MODE.jsonl" ] || node ml/apploop.js generate --driver studyset --mode "$MODE" --docs ml/data/splits/train.noisy.jsonl --limit "$DOCS_LIMIT" --out "$W/gen/studyset-$MODE.jsonl" --model TEACHER --n 1 --ctx "$CTX" --workers "$WORKERS"
  done
  [ -s "$W/gen/replay.jsonl" ] || node ml/apploop.js generate --driver replay --inputs "$W/inputs/train.jsonl" --out "$W/gen/replay.jsonl" --model TEACHER --n 1 --ctx "$CTX" --workers "$WORKERS"
  python3 ml/train/prepare.py --gen "$W/gen/studyset-*.jsonl" "$W/gen/replay.jsonl" --out "$W/train" --min-score 8
  node ml/prune/calib_lang.js --in "$W/train/sft.jsonl" --out "$W/gen/lang.jsonl" --langs "$LANGS" --per-lang "$PER_LANG"
fi

if has calib; then
  echo "== calibration texts (balanced by job and language; some held out)"
  python3 ml/prune/calib.py --in "$W/train/sft.jsonl" "$W/train/sft_dev.jsonl" "$W/gen/lang.jsonl" --tokenizer "$FULL" --out "$W"
fi

if has reap; then
  echo "== 2. how much each expert contributes to Studyboard's jobs (the full model, bf16)"
  stop_servers
  [ -s "$W/stats.pt" ] || python3 ml/prune/reap.py --model "$FULL" --calib "$W/calib.jsonl" --out "$W/stats.pt"
  [ -s "$W/ref.pt" ] || python3 ml/prune/kl.py --model "$FULL" --dev "$W/calib_dev.jsonl" --save-ref "$W/ref.pt"
fi

if has prune; then
  echo "== 3. pruned models: $KEEPS experts per layer"
  for K in $KEEPS; do
    [ -s "$W/pruned-$K/prune_info.json" ] || python3 ml/prune/prune.py --src "$FULL" --stats "$W/stats.pt" --keep "$K" --out "$W/pruned-$K"
  done
fi

if has kl; then
  echo "== 4a. word-by-word agreement with the full model (held-out texts)"
  stop_servers
  for K in $KEEPS; do
    [ -s "$W/kl-$K.json" ] || python3 ml/prune/kl.py --model "$W/pruned-$K" --dev "$W/calib_dev.jsonl" --ref "$W/ref.pt" --out "$W/kl-$K.json"
  done
fi

judge() {  # $1 = name of the candidate outputs in $W/eval; compares with the full model's, job by job
  for KIND in studyset replay; do
    [ -s "ml/eval/reports/$1-$KIND/details.json" ] && continue
    node ml/eval/compare.js --cand "$W/eval/$1.$KIND.jsonl" --ref "$W/eval/full.$KIND.jsonl" --docs ml/data/splits/test.noisy.jsonl --out "ml/eval/reports/$1-$KIND" --judge
  done
}
start_judge() { if [ -z "${JUDGE_URL:-}" ]; then serve "$FULL" 8000 JUDGE; fi; }
app_eval() {  # $1 = model prefix, $2 = output name
  [ -s "$W/eval/$2.studyset.jsonl" ] || node ml/apploop.js eval --driver studyset --mode both --docs ml/data/splits/test.noisy.jsonl --limit "$EVAL_DOCS" --out "$W/eval/$2.studyset.jsonl" --model "$1" --ctx "$CTX" --workers "$WORKERS"
  [ -s "$W/eval/$2.replay.jsonl" ] || node ml/apploop.js eval --driver replay --inputs "$W/inputs/test.jsonl" --out "$W/eval/$2.replay.jsonl" --model "$1" --ctx "$CTX" --workers "$WORKERS"
}

if has eval; then
  echo "== 4b. job by job through the app (held-out material): each pruned model vs the full model"
  if [ ! -s "$W/eval/full.replay.jsonl" ]; then serve "$FULL" 8000 STUDENT; app_eval STUDENT full; fi
  for K in $KEEPS; do
    if [ ! -s "$W/eval/prune-$K.replay.jsonl" ]; then serve "$W/pruned-$K" 8001 STUDENT; app_eval STUDENT "prune-$K"; fi
  done
  start_judge
  for K in $KEEPS; do judge "prune-$K"; done
fi

if has gguf; then
  echo "== 5. packaging for laptops (llama.cpp GGUF), with an importance matrix from Studyboard's own texts"
  stop_servers
  for K in ${GGUF_KEEPS:-$KEEPS}; do
    B="$W/gguf/keep$K-bf16.gguf"
    [ -s "$B" ] || python3 "$LCPP/convert_hf_to_gguf.py" "$W/pruned-$K" --outtype bf16 --outfile "$B"
    [ -s "$W/gguf/keep$K.imatrix" ] || "$LCPP/build/bin/llama-imatrix" -m "$B" -f "$W/calib.txt" -o "$W/gguf/keep$K.imatrix" -ngl 99 -c 4096 > "$W/logs/imatrix-$K.log" 2>&1
    for P in $PACKAGES; do
      O="$W/gguf/studyboard-26b-keep$K-$P.gguf"
      [ -s "$O" ] && continue
      case "$P" in
        exps-*) T="${P#exps-}"; "$LCPP/build/bin/llama-quantize" --imatrix "$W/gguf/keep$K.imatrix" --tensor-type "exps=${T,,}" "$B" "$O" Q6_K > "$W/logs/quant-$K-$P.log" 2>&1 ;;
        *) "$LCPP/build/bin/llama-quantize" --imatrix "$W/gguf/keep$K.imatrix" "$B" "$O" "$P" > "$W/logs/quant-$K-$P.log" 2>&1 ;;
      esac
      echo "   $(basename "$O"): $(du -h "$O" | cut -f1)"
    done
    [ "${KEEP_BF16:-0}" = 1 ] || rm -f "$B"  # about 25-35 GB each; the pruned folder can rebuild it
  done
  # the picture reader is the same for every expert count: one separate file, loaded only for photo jobs
  K1=$(echo $KEEPS | cut -d' ' -f1)
  [ -s "$W/gguf/mmproj-studyboard-26b-Q8_0.gguf" ] || python3 "$LCPP/convert_hf_to_gguf.py" "$W/pruned-$K1" --mmproj --outtype q8_0 --outfile "$W/gguf/mmproj-studyboard-26b-Q8_0.gguf"
fi

if has eval-gguf; then
  echo "== 6. the files a laptop would run, job by job through the app, vs the full model"
  for F in "$W"/gguf/studyboard-26b-keep*.gguf; do
    N="gguf-$(basename "$F" .gguf)"
    if [ ! -s "$W/eval/$N.replay.jsonl" ]; then serve_gguf "$F" 8002 STUDENT; app_eval STUDENT "$N"; fi
  done
  start_judge
  for F in "$W"/gguf/studyboard-26b-keep*.gguf; do judge "gguf-$(basename "$F" .gguf)"; done
fi

if has report; then
  stop_servers
  python3 ml/prune/sizes.py --model "$FULL" --keep 128 $KEEPS --json "$W/sizes.json" || true
  python3 ml/prune/report.py --work "$W" --out "$W/REPORT.md"
fi
echo "== done"
