#!/usr/bin/env python3
"""Fills assets/short-template.html (the 8-10 s real-people format), or assets/native-template.html when the config has
a NATIVE JS block (the native screen-recording format), with one reel's config.

  python3 make_short.py config.html reel.html

config.html holds three blocks, each between its own markers:
  <!-- SHORT CSS --> ... <!-- /SHORT CSS -->      styles for drawn scenes (may be empty)
  <!-- SHORT HTML --> ... <!-- /SHORT HTML -->    drawn scenes: <div class="scene navybg" id="sc-NAME">...</div>
  <!-- SHORT JS --> ... <!-- /SHORT JS -->        sets REEL = {...} (see the template's header comment)
"""
import os, re, sys
here = os.path.dirname(os.path.abspath(__file__))
src = open(sys.argv[1]).read()
NATIVE = "<!-- NATIVE JS -->" in src   # the native format uses assets/native-template.html
tpl = open(os.path.join(here, "..", "assets", "native-template.html" if NATIVE else "short-template.html")).read()
def block(name):
    m = re.search(rf"<!-- {name} -->(.*?)<!-- /{name} -->", src, re.S)
    return m.group(1).strip("\n") if m else ""
MARKS = {"NATIVE CSS": ("/* ===== NATIVE CSS ===== */", "/* ===== /NATIVE CSS ===== */"),
         "NATIVE JS": ("/* ===== NATIVE JS ===== */", "/* ===== /NATIVE JS ===== */")} if NATIVE else None
for name, (o, c) in (MARKS or {"SHORT CSS": ("/* ===== SHORT CSS ===== */", "/* ===== /SHORT CSS ===== */"),
                     "SHORT HTML": ("<!-- ===== SHORT HTML ===== -->", "<!-- ===== /SHORT HTML ===== -->"),
                     "SHORT JS": ("/* ===== SHORT JS ===== */", "/* ===== /SHORT JS ===== */")}).items():
    i, j = tpl.index(o) + len(o), tpl.index(c)
    tpl = tpl[:i] + "\n" + block(name) + "\n" + tpl[j:]
open(sys.argv[2], "w").write(tpl)
print(f"wrote {sys.argv[2]}")
