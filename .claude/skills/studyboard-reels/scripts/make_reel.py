#!/usr/bin/env python3
"""Fills assets/problem-fix-template.html with one reel's scenes.

  python3 make_reel.py scenes.html reel.html

scenes.html holds four blocks, each between its own markers:
  <!-- SCENE CSS --> ... <!-- /SCENE CSS -->
  <!-- PROBLEM HTML --> ... <!-- /PROBLEM HTML -->
  <!-- FIX HTML --> ... <!-- /FIX HTML -->
  <!-- SCENE JS --> ... <!-- /SCENE JS -->
The SCENE JS block sets CAPS, TAG, PROB(t, lt) and FIX(t, lt) (see the template's header comment).
"""
import os, re, sys
here = os.path.dirname(os.path.abspath(__file__))
tpl = open(os.path.join(here, "..", "assets", "problem-fix-template.html")).read()
src = open(sys.argv[1]).read()
def block(name):
    m = re.search(rf"<!-- {name} -->(.*?)<!-- /{name} -->", src, re.S)
    if not m: sys.exit(f"missing block: {name}")
    return m.group(1).strip("\n")
for name, (o, c) in {"SCENE CSS": ("/* ===== SCENE CSS ===== */", "/* ===== /SCENE CSS ===== */"),
                     "PROBLEM HTML": ("<!-- ===== PROBLEM HTML ===== -->", "<!-- ===== /PROBLEM HTML ===== -->"),
                     "FIX HTML": ("<!-- ===== FIX HTML ===== -->", "<!-- ===== /FIX HTML ===== -->"),
                     "SCENE JS": ("/* ===== SCENE JS ===== */", "/* ===== /SCENE JS ===== */")}.items():
    i, j = tpl.index(o) + len(o), tpl.index(c)
    tpl = tpl[:i] + "\n" + block(name) + "\n" + tpl[j:]
open(sys.argv[2], "w").write(tpl)
print(f"wrote {sys.argv[2]}")
