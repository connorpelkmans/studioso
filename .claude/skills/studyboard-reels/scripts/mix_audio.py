#!/usr/bin/env python3
"""Builds a reel's soundtrack: a music bed plus sound effects placed at exact times,
then muxes it onto a rendered (silent) reel.

  python3 mix_audio.py --video reel.mp4 --music bed.wav --out reel-final.mp4 \
      --sfx thud.wav@1.40 --sfx thud.wav@1.90 --sfx whoosh.wav@2.15:0.8 \
      [--music-start 0.0] [--music-volume 0.8] [--sfx-dir path]

--sfx FILE@SECONDS[:VOLUME]. Music is trimmed or looped to the video length, faded out
over the last 0.3 s, and the mix is normalised to about -14 LUFS (platform loudness).
"""
import argparse, os, subprocess, sys

def dur(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                       capture_output=True, text=True, check=True)
    return float(r.stdout.strip())

ap = argparse.ArgumentParser()
ap.add_argument("--video", required=True)
ap.add_argument("--music")
ap.add_argument("--out", required=True)
ap.add_argument("--sfx", action="append", default=[])
ap.add_argument("--sfx-dir", default="")
ap.add_argument("--music-start", type=float, default=0.0, help="skip this many seconds into the music")
ap.add_argument("--music-volume", type=float, default=0.8)
ap.add_argument("--bed", action="append", default=[],
                help="extra music section FILE@AT:OFFSET:DUR[:VOL] - plays DUR s of FILE from OFFSET, starting at AT in the video "
                     "(use two beds to switch tracks, e.g. tense hook music into a calm beat at the payoff)")
a = ap.parse_args()

L = dur(a.video)
inputs, filters, labels = ["-i", a.video], [], []
idx = 1
if a.music:
    inputs += ["-stream_loop", "-1", "-ss", str(a.music_start), "-i", a.music]
    filters.append(f"[{idx}:a]atrim=0:{L},asetpts=PTS-STARTPTS,volume={a.music_volume},"
                   f"afade=t=out:st={max(0, L - 0.3)}:d=0.3[m]")
    labels.append("[m]"); idx += 1
for j, b in enumerate(a.bed):
    f, rest = b.split("@")
    at, off, d, vol = (rest.split(":") + ["0.8"])[:4]
    at, off, d = float(at), float(off), float(d)
    inputs += ["-ss", str(off), "-t", str(d), "-i", f]
    ms = int(at * 1000)
    filters.append(f"[{idx}:a]asetpts=PTS-STARTPTS,volume={vol},afade=t=in:st=0:d=0.05,"
                   f"afade=t=out:st={max(0, d - 0.12)}:d=0.12,adelay={ms}|{ms}[b{j}]")
    labels.append(f"[b{j}]"); idx += 1
for i, s in enumerate(a.sfx):
    f, rest = s.split("@")
    t, vol = (rest.split(":") + ["1"])[:2]
    path = os.path.join(a.sfx_dir, f) if a.sfx_dir else f
    inputs += ["-i", path]
    ms = int(float(t) * 1000)
    filters.append(f"[{idx}:a]volume={vol},adelay={ms}|{ms}[s{i}]")
    labels.append(f"[s{i}]"); idx += 1
if not labels:
    sys.exit("Nothing to mix")
filters.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0,atrim=0:{L},"
               f"loudnorm=I=-14:TP=-1.5:LRA=11[aout]")
cmd = ["ffmpeg", "-loglevel", "error", "-y", *inputs, "-filter_complex", ";".join(filters),
       "-map", "0:v", "-map", "[aout]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
       "-movflags", "+faststart", a.out]
subprocess.run(cmd, check=True)
print(f"{a.out} ({L:.2f}s, {len(a.sfx)} sfx{', music' if a.music else ''})")
