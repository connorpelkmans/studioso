#!/usr/bin/env python3
"""Puts theme batches from theme-batches/<batch>/ into index.html, each part in the same place the existing batches use.
Run from the repo root:   python3 tools/insert-theme-batches.py [batch ...]     (no names: every folder in theme-batches/)
Safe to run again: a batch's earlier copy is taken out before the new one goes in.

A batch folder can hold any of these files (all optional):
  scenes.js   -> the scene library (inside SCN20), as "// ---- scenes_<batch>.js", before lib_tail.js
  engines.js  -> the scene library (inside SCN20), as "// ---- engines_<batch>.js", before setAnim (put the UIC.<id> lines here too)
  maj.js      -> module 20-scenes-maj-<batch>.js (MAJ_THEMES.push calls), before 20-scenes-majors.js
  tp.css      -> module 96-tp-<batch>.css, before 96-tp-zreg.css
  tp.js       -> module 96-tp-<batch>.js (TP_DATA.push calls), before 96-tp-zreg.js
  comp.js     -> module 98-comp-<batch>.js (COMP_DATA.push calls), before 98-companion.js
  sounds.json -> {"<theme id>": "<mix>"} entries added to the ambient sound mixes in 98-sounds.js"""
import json, os, re, sys

ROOT = "theme-batches"
src = open("index.html", encoding="utf-8").read().split("\n")

def find(pred, start=0, what=""):
    for i in range(start, len(src)):
        if pred(src[i]): return i
    sys.exit("not found: " + what)

def remove_block(start_line, is_end):
    """Removes the block that starts with the exact line start_line and runs until a line where is_end(line) is true."""
    global src
    if start_line not in src: return
    a = src.index(start_line); b = a + 1
    while b < len(src) and not is_end(src[b]): b += 1
    src = src[:a] + src[b:]

lib_end = lambda l: l.startswith("// ---- ") or l.startswith("function setAnim(a)")
mod_end = lambda l: l.startswith("/* ===== module: ")

def put_lib(head, text, before):
    remove_block(head, lib_end)
    i = find(lambda l: l.startswith(before), 0, before)
    src[i:i] = [head] + text.rstrip("\n").split("\n") + [""]

def put_module(name, text, before):
    head = "/* ===== module: %s ===== */" % name
    remove_block(head, mod_end)
    i = find(lambda l: l.startswith("/* ===== module: %s ===== */" % before), 0, before)
    src[i:i] = [head] + text.rstrip("\n").split("\n") + ["", ""]

def put_sounds(batch, mixes):
    global src
    tag = "  // sounds-" + batch
    src = [l for l in src if not l.endswith(tag)]
    i = find(lambda l: 'sketchcity: "library 1, city .4"' in l, 0, "sounds anchor")
    if not src[i].rstrip().endswith(","): src[i] = src[i].rstrip() + ","
    j = i + 1
    while not src[j].strip().startswith("};"): j += 1
    line = "    " + ", ".join("%s: %s" % (k, json.dumps(v)) for k, v in mixes.items()) + "," + tag
    src.insert(j, line)

batches = sys.argv[1:] or sorted(d for d in os.listdir(ROOT) if os.path.isdir(os.path.join(ROOT, d)))
for b in batches:
    if not re.match(r"^[a-z0-9]+$", b): sys.exit("bad batch name: " + b)
    d = os.path.join(ROOT, b)
    rd = lambda f: open(os.path.join(d, f), encoding="utf-8").read() if os.path.exists(os.path.join(d, f)) else None
    t = rd("scenes.js")
    if t: put_lib("// ---- scenes_%s.js" % b, t, "// ---- lib_tail.js")
    t = rd("engines.js")
    if t: put_lib("// ---- engines_%s.js" % b, t, "function setAnim(a)")
    t = rd("maj.js")
    if t: put_module("20-scenes-maj-%s.js" % b, t, "20-scenes-majors.js")
    t = rd("tp.css")
    if t: put_module("96-tp-%s.css" % b, t, "96-tp-zreg.css")
    t = rd("tp.js")
    if t: put_module("96-tp-%s.js" % b, t, "96-tp-zreg.js")
    t = rd("comp.js")
    if t: put_module("98-comp-%s.js" % b, t, "98-companion.js")
    t = rd("sounds.json")
    if t: put_sounds(b, json.loads(t))
    print("inserted", b)

open("index.html", "w", encoding="utf-8").write("\n".join(src))
