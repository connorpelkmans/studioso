#!/bin/bash
cd /home/user/studioso
H=/tmp/claude-0/-home-user-studioso/d6e8ac28-d43f-5f7e-a5fe-8c3c5ce673ae/scratchpad/capture
for t in $(grep -ln 'generativelanguage' tests/*.e2e.js); do
  s=$(date +%s); timeout 600 node -r $H/hook.js $t > $H/log-$(basename $t).txt 2>&1; echo "$t exit=$? $(( $(date +%s) - s ))s" >> $H/progress.txt
done
echo DONE >> $H/progress.txt
