#!/usr/bin/env bash
# Brings branches up to date with main so their pull requests keep merging.
#
# Every branch rebuilds bundle/ and re-stamps index.html (the ?v= hashes and the start-up script's CSP fingerprint), so once one
# pull request merges, every other open one conflicts on those generated lines. For each branch given, this merges origin/main in;
# when the only conflicts are in generated files (index.html, bundle/*), it rebuilds them from the merged sources with
# scripts/app-files.js instead of picking a side, checks the result, commits and pushes. A conflict in any source file is left
# alone for a person: that branch is skipped and listed at the end.
#
#   scripts/refresh-pr-branches.sh claude/some-branch [more branches...]
#   PUSH=0 scripts/refresh-pr-branches.sh ...   (do everything but push)
#
# Run by .github/workflows/refresh-pr-branches.yml whenever main changes. Needs git and node only (no npm install).
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"
PUSH="${PUSH:-1}"
start=$(git rev-parse --abbrev-ref HEAD)
git fetch -q origin main
skipped=() done_=()
for b in "$@"; do
  echo "::group::$b"
  if ! git fetch -q origin "$b"; then echo "$b: not on origin, skipped"; skipped+=("$b (missing)"); echo "::endgroup::"; continue; fi
  git checkout -q -B "$b" "origin/$b"
  if ! git merge -q --no-edit origin/main >/dev/null 2>&1; then
    mapfile -t conf < <(git diff --name-only --diff-filter=U)
    bad=$(printf '%s\n' "${conf[@]}" | grep -v -E '^(index\.html|bundle/.*)$' || true)
    if [ -n "$bad" ]; then
      echo "$b: a source file conflicts with main, left for a person: $bad"
      git merge --abort; skipped+=("$b (conflict in: $(echo $bad))"); echo "::endgroup::"; continue
    fi
    # keep this branch's side of each generated hunk; the rebuild below rewrites them all from the merged sources
    python3 - "${conf[@]}" <<'PY'
import re, sys
for f in sys.argv[1:]:
    s = open(f, encoding="utf-8").read()
    s = re.sub(r'<<<<<<< [^\n]*\n(.*?)=======\n.*?>>>>>>> [^\n]*\n', lambda m: m.group(1), s, flags=re.S)
    open(f, "w", encoding="utf-8").write(s)
PY
    git add -- "${conf[@]}"
  fi
  node scripts/app-files.js >/dev/null
  if ! node scripts/app-files.js --check || ! node -e "new Function(require('fs').readFileSync('bundle/app.js','utf8'))" \
     || grep -qE '^(<<<<<<<|>>>>>>>) ' index.html bundle/*; then
    echo "$b: the rebuilt files didn't check out, left for a person"
    git merge --abort 2>/dev/null || git reset -q --hard "origin/$b"; skipped+=("$b (rebuild failed)"); echo "::endgroup::"; continue
  fi
  git add -A
  if git rev-parse -q --verify MERGE_HEAD >/dev/null; then git commit -q --no-edit; elif ! git diff --cached --quiet; then git commit -q -m "Rebuild bundle and index.html from the merged sources"; fi
  if [ "$(git rev-parse HEAD)" = "$(git rev-parse "origin/$b")" ]; then echo "$b: already up to date"; done_+=("$b (up to date)"); echo "::endgroup::"; continue; fi
  if [ "$PUSH" = "1" ]; then
    if git push -q origin "$b"; then echo "$b: updated and pushed"; done_+=("$b"); else echo "$b: push refused (it moved meanwhile), left for the next run"; skipped+=("$b (push refused)"); fi
  else echo "$b: updated (not pushed)"; done_+=("$b (not pushed)"); fi
  echo "::endgroup::"
done
git checkout -q "$start" 2>/dev/null || true
echo; echo "Updated: ${done_[*]:-none}"; echo "Skipped: ${skipped[*]:-none}"
[ ${#skipped[@]} -eq 0 ]
