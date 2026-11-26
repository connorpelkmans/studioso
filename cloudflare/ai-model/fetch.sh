#!/bin/bash
# Gets Gemma 4 E4B from Hugging Face straight into 16 MiB files in ./public/e4b/<first 8 of its sha256>/, checks the whole
# download against Google's published sha256 (any mismatch: nothing is kept and the build fails), and adds the headers file.
# Run by Cloudflare's build for the "studyboard-ai-model" Worker (build command: bash fetch.sh; deploy: npx wrangler deploy).
set -euo pipefail
cd "$(dirname "$0")"
URL="https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm/resolve/main/gemma-4-E4B-it-gpu.litertlm"
SHA="ea168f5a601b543e02712f9381f26b06ddc7d4cbe2406410387c82d69b995a60"
OUT="public/e4b/${SHA:0:8}"
rm -rf public; mkdir -p "$OUT"
curl -fL --retry 5 "$URL" | tee >(sha256sum | cut -d' ' -f1 > sum.txt) | split -b 16777216 -d -a 4 --additional-suffix=.bin - "$OUT/c"
sleep 2
if [ "$(cat sum.txt)" != "$SHA" ]; then echo "checksum mismatch: $(cat sum.txt)"; rm -rf public sum.txt; exit 1; fi
rm sum.txt
cp _headers public/_headers
echo "ok: $(ls "$OUT" | wc -l) files"
