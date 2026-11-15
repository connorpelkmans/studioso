#!/usr/bin/env bash
# Synthesises a small sound-effects kit with ffmpeg (no samples, nothing to license).
# Usage: make_sfx.sh <out-dir>   -> thud.wav, whoosh.wav, pop.wav, tick.wav
set -euo pipefail
OUT="${1:-.}"; mkdir -p "$OUT"
A=(-loglevel error -y)
# Thud: a falling sine (90 Hz -> 45 Hz) with a fast decay, plus a soft click on top.
ffmpeg "${A[@]}" -f lavfi -i "aevalsrc='0.9*sin(2*PI*(90-45*t/0.35)*t)*exp(-9*t)+0.25*(random(0)*2-1)*exp(-120*t)':s=48000:d=0.4" -ac 2 "$OUT/thud.wav"
# Whoosh: band-passed noise that swells and fades.
ffmpeg "${A[@]}" -f lavfi -i "anoisesrc=d=0.45:c=pink:a=0.6" -af "bandpass=f=1400:w=1800,volume='sin(PI*t/0.45)':eval=frame,afade=t=out:st=0.35:d=0.1" -ac 2 "$OUT/whoosh.wav"
# Pop: a short high blip for UI moments (a button press, a badge changing).
ffmpeg "${A[@]}" -f lavfi -i "aevalsrc='0.5*sin(2*PI*(880+600*t/0.08)*t)*exp(-40*t)':s=48000:d=0.12" -ac 2 "$OUT/pop.wav"
# Tick: a tiny click for typing.
ffmpeg "${A[@]}" -f lavfi -i "aevalsrc='0.35*(random(0)*2-1)*exp(-400*t)':s=48000:d=0.03" -ac 2 "$OUT/tick.wav"
echo "SFX in $OUT"
