#!/usr/bin/env python3
"""Finds one-frame glitches in rendered reels: a frame that differs sharply from both neighbours while the
neighbours match each other (A-B-A). Run it on every final render; the list should be empty.

  python3 check_glitches.py reel.mp4 [reel-b.mp4 ...]

Typical causes: an oscillating shake faster than ~5 Hz (it aliases at 30 fps), an element whose style is only set
inside an `if` so it keeps a stale value for a few frames, or a layer fading in before its contents are positioned.
"""
import subprocess, sys, numpy as np
W,H=90,160
def frames(f):
    raw=subprocess.run(["ffmpeg","-loglevel","error","-i",f,"-vf",f"scale={W}:{H},format=gray","-f","rawvideo","-"],capture_output=True).stdout
    return np.frombuffer(raw,np.uint8).reshape(-1,H,W).astype(float)
for f in sys.argv[1:]:
    F=frames(f); n=len(F)
    d=lambda a,b: np.abs(F[a]-F[b]).mean()
    hits=[]
    for i in range(1,n-1):
        a,b,c=d(i-1,i),d(i,i+1),d(i-1,i+1)
        if a>4 and b>4 and c<0.5*min(a,b): hits.append((i/30,round(a,1),round(b,1),round(c,1)))
    print(f.split('/')[-2]+'/'+f.split('/')[-1], "frames:",n, "A-B-A glitches:", hits[:12])
