"""Fetch OpenStax textbook sections (CC BY 4.0 books only) as plain-text 'documents' for training and evaluation.

    python ml/corpus/fetch_openstax.py --out ml/data/raw/openstax.jsonl --per-book 60

Each line: {"id", "source": "openstax", "book", "subject", "title", "chapter", "license", "url", "text"}
Books whose license isn't plain CC BY (several are CC BY-NC-SA, which doesn't fit a paid app) are skipped, and the license of
every document is kept so ATTRIBUTION.md can be generated from the data itself.
"""
import argparse, json, random, re, sys, time, xml.etree.ElementTree as ET
import urllib.request

RAW = "https://raw.githubusercontent.com/openstax/osbooks-{repo}/main/{path}"
# repo -> subject (repos checked to exist; each may hold several books, each book's own license decides)
REPOS = {
    "chemistry-bundle": "chemistry", "university-physics-bundle": "physics", "college-physics-bundle": "physics",
    "psychology": "psychology", "american-government": "government", "us-history": "history", "world-history": "history",
    "anatomy-physiology": "anatomy and physiology", "microbiology": "microbiology", "introduction-philosophy": "philosophy",
    "statistics": "statistics", "introductory-statistics-bundle": "statistics", "college-algebra-bundle": "math",
    "calculus-bundle": "calculus", "prealgebra-bundle": "math", "astronomy": "astronomy", "business-ethics": "business",
    "life-liberty-pursuit-happiness": "history", "writing-guide": "writing", "organic-chemistry": "chemistry",
    "introduction-business": "business", "principles-accounting-bundle": "accounting", "lifespan-development": "psychology",
    "introduction-anthropology": "anthropology", "entrepreneurship": "business", "biology-bundle": "biology",
}
NS = {"c": "http://cnx.rice.edu/cnxml", "md": "http://cnx.rice.edu/mdml", "col": "http://cnx.rice.edu/collxml"}
CC_BY = re.compile(r"creativecommons\.org/licenses/by/\d")


def get(url, tries=4):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "studyboard-corpus/1"}), timeout=30) as r:
                return r.read().decode("utf-8")
        except Exception as e:  # network hiccup: back off and retry
            if i == tries - 1:
                raise
            time.sleep(2 ** i)


def text_of(el):
    """CNXML element -> readable text: paragraphs, lists as '- ', terms in **bold**, math reduced to its text."""
    out = []

    def walk(e, buf):
        tag = e.tag.split("}")[-1]
        if tag in ("math", "media", "figure", "table", "exercise", "note") and tag != "note":
            if tag == "table":  # keep table text roughly
                for row in e.iter("{%s}row" % NS["c"]):
                    cells = [" ".join("".join(x.itertext()).split()) for x in row if x.tag.endswith("entry")]
                    if any(cells):
                        out.append(" | ".join(cells))
            return
        if tag == "term":
            buf.append("**" + " ".join("".join(e.itertext()).split()) + "**")
            if e.tail:
                buf.append(e.tail)
            return
        if e.text:
            buf.append(e.text)
        for ch in e:
            walk(ch, buf)
        if e.tail:
            buf.append(e.tail)

    for e in el.iter():
        tag = e.tag.split("}")[-1]
        if tag == "title" and e is not el:
            t = " ".join("".join(e.itertext()).split())
            if t:
                out.append("## " + t)
        elif tag == "para":
            buf = []
            walk(e, buf)
            t = " ".join("".join(buf).split())
            if t:
                out.append(t)
        elif tag == "item":
            t = " ".join("".join(e.itertext()).split())
            if t:
                out.append("- " + t)
    # de-duplicate items nested in paras
    seen, res = set(), []
    for line in out:
        if line not in seen:
            seen.add(line)
            res.append(line)
    return "\n".join(res)


def module_doc(repo, mid):
    x = get(RAW.format(repo=repo, path=f"modules/{mid}/index.cnxml"))
    root = ET.fromstring(x)
    title_el = root.find("c:title", NS)
    title = " ".join("".join(title_el.itertext()).split()) if title_el is not None else mid
    content = root.find("c:content", NS)
    if content is None:
        return title, ""
    # drop end-of-section exercises, glossary and summaries' review questions from the main text
    for parent in content.iter():
        for ch in list(parent):
            cls = (ch.get("class") or "")
            if ch.tag.endswith("exercise") or re.search(r"review-questions|critical-thinking|free-response|art-connection|interactive|ap-test-prep", cls):
                parent.remove(ch)
    return title, text_of(content)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="ml/data/raw/openstax.jsonl")
    ap.add_argument("--per-book", type=int, default=60, help="sections sampled per book (spread across chapters)")
    ap.add_argument("--repos", default=",".join(REPOS))
    ap.add_argument("--seed", type=int, default=7)
    a = ap.parse_args()
    rnd = random.Random(a.seed)
    import os
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    n = 0
    with open(a.out, "w") as f:
        for repo in a.repos.split(","):
            try:
                books = ET.fromstring(get(RAW.format(repo=repo, path="META-INF/books.xml")))
            except Exception as e:
                print(f"skip {repo}: {e}", file=sys.stderr)
                continue
            for b in books:
                slug, href = b.get("slug"), b.get("href", "").replace("../", "")
                col = ET.fromstring(get(RAW.format(repo=repo, path=href)))
                lic = col.find(".//md:license", NS)
                url = lic.get("url") if lic is not None else ""
                if not CC_BY.search(url or ""):
                    print(f"skip {slug}: license {url}", file=sys.stderr)
                    continue
                # modules with their chapter titles
                mods = []

                def walk(node, chapter):
                    for ch in node:
                        t = ch.tag.split("}")[-1]
                        if t == "subcollection":
                            tt = ch.find("md:title", NS)
                            walk(ch.find("col:content", NS), (tt.text if tt is not None else chapter))
                        elif t == "module":
                            mods.append((ch.get("document"), chapter))
                walk(col.find("col:content", NS), "")
                body = [m for m in mods if m[1]]  # skip preface/appendix without a chapter
                pick = body if len(body) <= a.per_book else sorted(rnd.sample(body, a.per_book), key=body.index)
                got = 0
                for mid, chapter in pick:
                    try:
                        title, text = module_doc(repo, mid)
                    except Exception as e:
                        print(f"  {slug}/{mid}: {e}", file=sys.stderr)
                        continue
                    words = len(text.split())
                    if words < 250 or re.match(r"(?i)introduction$|key terms|summary|review questions", title):
                        continue
                    f.write(json.dumps({"id": f"os-{slug}-{mid}", "source": "openstax", "book": slug, "subject": REPOS[repo], "title": title,
                                        "chapter": chapter, "license": url, "url": f"https://openstax.org/books/{slug}", "text": text}) + "\n")
                    got += 1
                    n += 1
                print(f"{slug}: {got} sections", file=sys.stderr)
    print(f"{n} documents -> {a.out}")


if __name__ == "__main__":
    main()
