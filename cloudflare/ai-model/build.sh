#!/bin/bash
# By hand, from a computer signed in with "npx wrangler login": the same as Cloudflare's build does
set -euo pipefail
cd "$(dirname "$0")"
bash fetch.sh
npx wrangler deploy
