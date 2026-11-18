#!/usr/bin/env python3
"""Cuts a reel's background track from footage and solid-colour placeholders.

  python3 build_bg.py shots.json bg.mp4

shots.json is a list of segments, in order:
  {"clip": "path/to/clip.mp4", "in": 3.4, "dur": 2.6, "speed": 1.0, "pre": "eq=brightness=0.05"}   # footage (scaled + cropped to 9:16; "pre" optional)
  {"color": "#0E2A56", "dur": 3.0}                                     # placeholder: reel.html draws its own scene here

Paths are relative to the JSON file. Output is 1080x1920, 30 fps, H.264, no audio. Then render the overlay with
  render.js <folder> --footage bg.mp4
and give reel.html opaque scenes for the colour segments.

Short reels: pass {"xf": 0.2, "shots": [...]} instead of a list to dissolve between shots over xf seconds, centred on
each cut, so cuts can sit on the music hits without looking harsh. Total length stays the sum of the durs.
"""
import json, os, subprocess, sys, tempfile

W, H, FPS = 1080, 1920, 30
spec_path, out = sys.argv[1], sys.argv[2]
base = os.path.dirname(os.path.abspath(spec_path))
spec = json.load(open(spec_path))
XF = float(spec.get("xf", 0)) if isinstance(spec, dict) else 0.0
shots = spec["shots"] if isinstance(spec, dict) else spec
tmp = tempfile.mkdtemp()
parts = []
for i, s in enumerate(shots):
    p = os.path.join(tmp, f"{i:02d}.mp4")
    d = float(s["dur"]) + XF   # each part runs xf longer so the dissolve has frames from both sides
    if "clip" in s:
        speed = float(s.get("speed", 1.0))
        pre = (s["pre"] + ",") if s.get("pre") else ""   # optional ffmpeg filters first, e.g. a crop to punch in or eq= to brighten
        vf = (f"{pre}setpts=PTS/{speed},scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
              f"fps={FPS},setsar=1,trim=duration={d},setpts=PTS-STARTPTS")
        cmd = ["ffmpeg", "-loglevel", "error", "-y", "-ss", str(s.get("in", 0)), "-i", os.path.join(base, s["clip"]),
               "-an", "-vf", vf, "-t", str(d)]
    else:
        cmd = ["ffmpeg", "-loglevel", "error", "-y", "-f", "lavfi",
               "-i", f"color=c={s['color']}:s={W}x{H}:r={FPS}:d={d}"]
    subprocess.run(cmd + ["-c:v", "libx264", "-preset", "fast", "-crf", "16", "-pix_fmt", "yuv420p", p], check=True)
    parts.append(p)
total = sum(float(s["dur"]) for s in shots)
if XF > 0 and len(parts) > 1:
    # shot k is fully in xf/2 after its cut; dissolve k runs over [cut - xf/2, cut + xf/2]
    ins, chain, prev, cut = [], [], "0:v", 0.0
    for p in parts: ins += ["-i", p]
    for k in range(1, len(parts)):
        cut += float(shots[k - 1]["dur"])
        lab = f"v{k}"
        chain.append(f"[{prev}][{k}:v]xfade=transition=fade:duration={XF}:offset={cut - XF / 2:.4f}[{lab}]")
        prev = lab
    chain.append(f"[{prev}]trim=duration={total},setpts=PTS-STARTPTS[out]")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *ins, "-filter_complex", ";".join(chain), "-map", "[out]",
                    "-c:v", "libx264", "-preset", "fast", "-crf", "16", "-pix_fmt", "yuv420p", "-r", str(FPS), out], check=True)
else:
    lst = os.path.join(tmp, "list.txt")
    open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst,
                    "-c:v", "libx264", "-preset", "fast", "-crf", "16", "-pix_fmt", "yuv420p", "-r", str(FPS), out], check=True)
print(f"{out}: {len(shots)} shots, {total:.2f}s")
