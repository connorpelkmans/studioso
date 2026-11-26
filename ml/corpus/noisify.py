"""Turn clean source text into what students actually paste or upload, so the model learns on realistic input:

  clean       as written
  slides      slide decks: 'Slide N' headings, short bullet fragments, little grammar
  shorthand   class notes: abbreviations (w/, b/c, ->, approx), lowercase, dropped articles
  ocr         a photo or scan read by OCR: confused letters (rn/m, l/1, O/0), broken words, stray marks
  pdf         text pulled from a PDF: hard line breaks mid-sentence, hyphenated breaks, repeated headers and page numbers
  transcript  a lecture recording: lowercase run-on speech with fillers ('um', 'so basically', 'right?')

    python ml/corpus/noisify.py --in ml/data/splits/train.jsonl --out ml/data/splits/train.noisy.jsonl --seed 3

Deterministic for a seed. Each output line keeps the document's fields and adds "style"; facts are never changed (only form),
so a card checked against the noisy text is still checked against true content.
"""
import argparse, json, random, re

ABBR = [(r"\bwith\b", "w/"), (r"\bwithout\b", "w/o"), (r"\bbecause\b", "b/c"), (r"\bleads to\b", "->"), (r"\bcauses\b", "->"), (r"\bresults in\b", "->"),
        (r"\bapproximately\b", "approx"), (r"\bimportant\b", "impt"), (r"\bdefinition\b", "def"), (r"\bexample\b", "ex"), (r"\bfor example\b", "e.g."),
        (r"\bincrease(s|d)?\b", "↑"), (r"\bdecrease(s|d)?\b", "↓"), (r"\band\b", "&"), (r"\bthat is\b", "i.e."), (r"\bgovernment\b", "govt"), (r"\btherefore\b", "∴"),
        (r"\bversus\b", "vs"), (r"\bnumber\b", "#"), (r"\bthrough\b", "thru"), (r"\bminutes\b", "min"), (r"\bhours\b", "hrs")]
OCR_SWAP = [("rn", "m"), ("m", "rn"), ("l", "1"), ("I", "l"), ("O", "0"), ("0", "O"), ("e", "c"), ("cl", "d"), ("ri", "n"), (".", ","), ("S", "5")]
FILLERS = ["um", "uh", "so", "so basically", "right?", "okay", "you know", "like", "alright so", "and um"]


def sentences(t):
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+(?=[A-Z0-9*\"(])", t) if s.strip()]


def strip_md(t):
    return re.sub(r"\*\*(.+?)\*\*", r"\1", t)


def no_heads(t):
    return re.sub(r"(?m)^#+\s*", "", t)


def slides(text, r):
    out, n = [], 1
    for block in re.split(r"\n(?=#+ )", text.strip()):
        lines = block.split("\n")
        m = re.match(r"#+\s+(.*)", lines[0])
        head = m.group(1) if m else ""
        if head and not any(l.strip() for l in lines[1:]):
            continue
        body = " ".join(l for l in lines[1:] if l.strip()) if head else block
        ss = sentences(strip_md(body))
        for i in range(0, len(ss), r.randint(3, 5)):
            out.append(f"Slide {n}")
            out.append(head or (ss[i].split(",")[0][:50] if ss[i:] else "Notes"))
            for s in ss[i:i + 5]:
                frag = re.sub(r"^(The|A|An|This|These|It|In addition,|However,|Also,)\s+", "", s).rstrip(".")
                frag = re.sub(r"\b(is|are|was|were) (a|an|the) ", ": ", frag, count=1) if r.random() < 0.4 else frag
                out.append(("• " if r.random() < 0.7 else "- ") + frag)
            out.append("")
            n += 1
    return "\n".join(out).strip()


def shorthand(text, r):
    t = strip_md(text)
    for pat, rep in ABBR:
        if r.random() < 0.7:
            t = re.sub(pat, rep, t, flags=re.I)
    t = re.sub(r"\b(the|a|an) (?=\w)", lambda m: "" if r.random() < 0.5 else m.group(0), t, flags=re.I)
    lines = []
    for s in sentences(t):
        s = s[0].lower() + s[1:] if r.random() < 0.6 and s else s
        lines.append(("- " if r.random() < 0.5 else "") + s.rstrip(".") + ("" if r.random() < 0.5 else "."))
    return "\n".join(lines)


def ocr(text, r, rate=0.025):
    t = no_heads(strip_md(text))
    out = []
    for w in t.split(" "):
        if r.random() < rate and len(w) > 3:
            a, b = r.choice(OCR_SWAP)
            if a in w:
                w = w.replace(a, b, 1)
        if r.random() < 0.006:
            w = w[: len(w) // 2] + " " + w[len(w) // 2:]
        out.append(w)
    t = " ".join(out)
    lines, cur = [], ""
    for w in t.split(" "):
        cur += w + " "
        if len(cur) > r.randint(45, 75):
            lines.append(cur.strip())
            cur = ""
    lines.append(cur.strip())
    if r.random() < 0.5:
        lines.insert(r.randint(0, len(lines)), r.choice(["~", "|", "'", ".", "—"]))
    return "\n".join(lines)


def pdf(text, r):
    t = no_heads(strip_md(text))
    header = r.choice(["Chapter 3 | Introduction", "Unit 2 Notes", "Lecture 7", "COURSE 201 - Fall"])
    out, cur, page, n = [], "", r.randint(2, 40), 0
    for w in t.split():
        if len(cur) + len(w) > r.randint(60, 85):
            if r.random() < 0.08 and len(w) > 6:
                k = len(w) // 2
                out.append(cur + w[:k] + "-")
                cur = w[k:] + " "
            else:
                out.append(cur.rstrip())
                cur = w + " "
            n += 1
            if n % 38 == 0:
                out += [str(page), header]
                page += 1
            continue
        cur += w + " "
    out.append(cur.rstrip())
    return "\n".join(out)


def transcript(text, r):
    t = re.sub(r"(?m)^#+\s*(.*)$", r"\1.", strip_md(text))
    out = []
    for s in sentences(t):
        s = s.rstrip(".").lower()
        if r.random() < 0.45:
            s = r.choice(FILLERS) + " " + s
        if r.random() < 0.2:
            s += " " + r.choice(["right?", "okay?", "so keep that in mind", "and this will be on the exam"])
        out.append(s)
    return " ".join(out)


STYLES = {"clean": lambda t, r: t, "slides": slides, "shorthand": shorthand, "ocr": ocr, "pdf": pdf, "transcript": transcript}
WEIGHTS = {"clean": 2, "slides": 3, "shorthand": 3, "ocr": 1, "pdf": 2, "transcript": 1}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--seed", type=int, default=3)
    ap.add_argument("--styles", default="", help="comma list to force; default: a weighted mix, one style per document")
    a = ap.parse_args()
    r = random.Random(a.seed)
    names, w = list(WEIGHTS), list(WEIGHTS.values())
    n = 0
    with open(a.inp) as f, open(a.out, "w") as g:
        for line in f:
            d = json.loads(line)
            st = a.styles.split(",") if a.styles else [r.choices(names, w)[0]]
            for s in st:
                g.write(json.dumps(dict(d, id=d["id"] + ":" + s, style=s, text=STYLES[s](d["text"], r))) + "\n")
                n += 1
    print(f"{n} documents -> {a.out}")


if __name__ == "__main__":
    main()
