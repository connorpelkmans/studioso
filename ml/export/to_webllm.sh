#!/usr/bin/env bash
# Package a trained model for WebLLM (what runs it in the student's browser), and upload it to Hugging Face.
#
#   bash ml/export/to_webllm.sh ml/train/configs/gemma3-1b.yaml ml/out/gemma3-1b-final-merged <your-hf-user>
#
# The fine-tuned model has the SAME architecture as the stock one, so WebLLM's prebuilt library for it (the .wasm Studyboard already
# ships in vendor/webllm-0.2.89/libs) runs it: only the weights change. That's why no WebGPU compile step is needed here.
# Needs: pip install --pre -U -f https://mlc.ai/wheels mlc-llm-nightly-cpu mlc-ai-nightly-cpu ; hf (huggingface_hub) logged in.
set -euo pipefail
CFG="$1"; MODEL="$2"; HF_USER="${3:?your Hugging Face user or organization}"
read_cfg() { python3 -c "import yaml,sys; c=yaml.safe_load(open('$CFG'))['webllm']; print(c['$1'])"; }
QUANT=$(read_cfg quant); CONV=$(read_cfg conv_template); CTX=$(read_cfg context); BASE=$(read_cfg base_id)
NAME="studyboard-${BASE}"
OUT="ml/dist/${NAME}"
mkdir -p "$OUT"
echo "== converting weights ($QUANT)"
mlc_llm convert_weight "$MODEL" --quantization "$QUANT" -o "$OUT"
echo "== writing the chat config (template $CONV, context $CTX)"
mlc_llm gen_config "$MODEL" --quantization "$QUANT" --conv-template "$CONV" --context-window-size "$CTX" -o "$OUT"
echo "== uploading to https://huggingface.co/${HF_USER}/${NAME}"
hf upload "${HF_USER}/${NAME}" "$OUT" . --repo-type model
cat <<EOF

Done. To use it in Studyboard, set WEB_CUSTOM in src/js/01-ai-device.js:
  ${BASE%%-q4*}: {id: "${NAME}", hf: "https://huggingface.co/${HF_USER}/"}
(see ml/README.md, Ship It). The model card must carry the base model's license (Gemma terms for Gemma; Apache 2.0 for Qwen).
EOF
