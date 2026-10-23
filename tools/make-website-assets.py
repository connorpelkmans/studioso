#!/usr/bin/env python3
"""Copies the app's scene library and companion art/animation code into website/assets, so the home page shows the real thing.
Run from the repo root after the app's scenes or companions change:   python3 tools/make-website-assets.py
Writes: website/assets/scenes-lib.js, website/assets/companions-data.js, website/assets/companions-engine.js"""
import re, sys
# The app is split into files (index.html, css/, js/; scripts/app-files.js)
import subprocess
src = subprocess.run(["node", "-e", "process.stdout.write(require('./scripts/app-files').source())"], check=True, capture_output=True, text=True, encoding="utf-8").stdout.split("\n")
def find(prefix, start=0):
    for i in range(start, len(src)):
        if src[i].startswith(prefix): return i
    sys.exit("not found: " + prefix)
def rng(a, b): return "\n".join(src[a:b]) + "\n"

# 1. scene library
lib = open("src/js/20-scenes-lib.js", encoding="utf-8").read().split("\n")
s = next(i for i, l in enumerate(lib) if l.startswith("var SCN20_LIB = (function"))
body = "\n".join(lib[s:]).replace("var SCN20_LIB = (function", "const SCN20 = (function", 1)
open("website/assets/scenes-lib.js", "w", encoding="utf-8").write("/* Studyboard scene library, copied unchanged from the app (module 20-scenes-lib). Do not edit by hand: run tools/make-website-assets.py. */\n" + body)

# 2. companion art data (COMP_DATA and COMP_KIT plus every batch)
s = find("/* ===== module: 98-comp-00.js ===== */"); e = find("/* ===== module: 98-companion.js ===== */")
# 98-comp-extra.js
x = next((i for i in range(s, e) if src[i].startswith("/* ===== module: 98-comp-extra.js")), None)
if x is not None:
    x_end = next(i for i in range(x + 1, len(src)) if src[i].startswith("/* ===== module: "))
    if x_end != e: sys.exit("98-comp-extra.js must come right before 98-companion.js")
    e = x
open("website/assets/companions-data.js", "w", encoding="utf-8").write("/* Studyboard companion art, copied unchanged from the app (modules 98-comp-*). Do not edit by hand: run tools/make-website-assets.py. */\n" + rng(s, e))

# 3. companion drawing + animation actor from 98-companion.js
m = find("/* ===== module: 98-companion.js ===== */")
a0 = find("  const VB = 120", m)
tiers = find("  /* ---------- Tiers:", m); draw = find("  /* ---------- Drawing ---------- */", m); sett = find("  /* ---------- Settings ---------- */", m)
actor0 = find("  /* ---------- An actor: animations on one rendered rig ---------- */", m); front0 = find("  /* ---------- The companion on screen:", m)
parts = [rng(a0, tiers), rng(draw, sett), rng(actor0, front0)]
stubs = '''
  // The app's settings and conditions, reduced to what the website needs.
  const cfg = () => ({});
  const skinId = () => "classic";
  const mq = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  const still = () => !!(mq && mq.matches);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const owns = () => true;
'''
head = "/* Studyboard companion drawing and animation, copied from the app (module 98-companion). Do not edit by hand: run tools/make-website-assets.py. */\n/* global COMP_EXTRA, SBThemes */\nwindow.SBCOMPW = (function () {\n"
tail = "\n  return {REG, BYID, rigSvg, actor, GENERIC, partSvg};\n})();\n"
open("website/assets/companions-engine.js", "w", encoding="utf-8").write(head + stubs + parts[0] + parts[1] + parts[2] + tail)
print("ok")
