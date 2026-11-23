#!/bin/bash
# Downloads Gemma 4 E4B from Hugging Face, checks it against Google's published sha256, splits it into 16 MiB files in ./public,
# then deploys them: bash cloudflare/ai-model/build.sh (needs about 7 GB free while it runs)
set -euo pipefail
cd "$(dirname "$0")"
URL="https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm/resolve/main/gemma-4-E4B-it-gpu.litertlm"
SHA="ea168f5a601b543e02712f9381f26b06ddc7d4cbe2406410387c82d69b995a60"
mkdir -p public/e4b/${SHA:0:8}
curl -L --retry 5 -C - -o model.litertlm "$URL"
echo "$SHA  model.litertlm" | sha256sum -c -
split -b 16777216 -d -a 4 --additional-suffix=.bin model.litertlm public/e4b/${SHA:0:8}/c
rm model.litertlm
cp _headers public/_headers
npx wrangler deploy
