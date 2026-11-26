"""Fetch Wikipedia articles on school subjects (CC BY-SA 4.0) as notes-sized documents.

    python ml/corpus/fetch_wikipedia.py --out ml/data/raw/wikipedia.jsonl --per-subject 120

Subjects come from Wikipedia's own list of 'vital articles' (Level 4: about 10,000 articles judged most important), so the
mix covers what students study: sciences, health, history, society, arts, maths, technology. Each article is cut into
chunks of about 300-1,500 words at its section headings (references, see also and the like dropped).
Polite: one request at a time, a descriptive User-Agent with no personal details, and backoff when Wikipedia says slow down.
Each line: {"id", "source": "wikipedia", "subject", "title", "section", "license", "url", "text"}
"""
import argparse, json, os, random, re, sys, time, urllib.parse, urllib.request

API = "https://en.wikipedia.org/w/api.php"
UA = "StudyboardCorpus/1.0 (education dataset builder; non-personal)"
SKIP = re.compile(r"(?i)^(see also|references|notes|further reading|external links|bibliography|sources|citations|gallery|footnotes)$")


def api(params, tries=8):
    params = dict(params, format="json", formatversion="2", maxlag="5")
    url = API + "?" + urllib.parse.urlencode(params)
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=40) as r:
                body = r.read().decode("utf-8")
            if body.startswith("{"):
                j = json.loads(body)
                if "error" in j and j["error"].get("code") == "maxlag":
                    raise RuntimeError("maxlag")
                return j
            raise RuntimeError(body[:80])
        except Exception as e:
            wait = min(120, 5 * 2 ** i)
            print(f"  wait {wait}s ({str(e)[:60]})", file=sys.stderr)
            time.sleep(wait)
    raise RuntimeError("gave up: " + url)


def vital_pages():
    j = api({"action": "query", "list": "allpages", "apnamespace": 4, "apprefix": "Vital articles/Level/4/", "aplimit": 100})
    bad = re.compile(r"(?i)article alerts|draft|archive|removed|proposal|talk|statistics|/Level/4/$")
    return [p["title"] for p in j["query"]["allpages"] if not bad.search(p["title"])]


def links(page):
    out, cont = [], {}
    while True:
        j = api(dict({"action": "query", "prop": "links", "titles": page, "plnamespace": 0, "pllimit": "max"}, **cont))
        for p in j["query"]["pages"]:
            out += [l["title"] for l in p.get("links", [])]
        if "continue" not in j:
            return out
        cont = j["continue"]
        time.sleep(1)


def extract(title):
    j = api({"action": "query", "prop": "extracts", "explaintext": 1, "exsectionformat": "wiki", "titles": title, "redirects": 1})
    p = j["query"]["pages"][0]
    return p.get("title", title), p.get("extract", "")


def chunks(title, text, lo=300, hi=1500):
    """Split at '== heading ==' lines into notes-sized pieces; small sections merge with the next."""
    parts, cur, head = [], [], "Overview"
    for line in text.split("\n"):
        m = re.match(r"^(=+)\s*(.*?)\s*=+$", line)
        if m:
            if len(m.group(1)) == 2:  # a top-level section starts
                if cur:
                    parts.append((head, cur))
                cur, head = [], m.group(2)
            else:
                cur.append("## " + m.group(2))
            continue
        if line.strip():
            cur.append(line.strip())
    if cur:
        parts.append((head, cur))
    out, acc, acc_head = [], [], None
    for head, lines in parts:
        if SKIP.match(head):
            continue
        acc_head = acc_head or head
        acc += (["## " + head] if head != "Overview" else []) + lines
        words = sum(len(l.split()) for l in acc)
        if words >= lo:
            text = "\n".join(acc)
            ws = text.split()
            out.append((acc_head, " ".join(ws[:hi]) if words > hi * 1.3 else text))
            acc, acc_head = [], None
    if acc and sum(len(l.split()) for l in acc) >= lo:
        out.append((acc_head, "\n".join(acc)))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="ml/data/raw/wikipedia.jsonl")
    ap.add_argument("--per-subject", type=int, default=120, help="articles sampled per vital-articles page")
    ap.add_argument("--max-chunks", type=int, default=3, help="chunks kept per article")
    ap.add_argument("--seed", type=int, default=11)
    ap.add_argument("--pause", type=float, default=1.0)
    a = ap.parse_args()
    rnd = random.Random(a.seed)
    os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
    done = set()
    if os.path.exists(a.out):  # resumable
        for l in open(a.out):
            try:
                done.add(json.loads(l)["title"])
            except Exception:
                pass
    pages = vital_pages()
    print(f"{len(pages)} vital-article lists", file=sys.stderr)
    n = 0
    with open(a.out, "a") as f:
        for pg in pages:
            subject = pg.split("/")[-1] if pg.count("/") >= 3 else pg
            titles = [t for t in links(pg) if not re.match(r"(?i)^(list of|outline of|index of)", t)]
            rnd.shuffle(titles)
            got = 0
            for t in titles:
                if got >= a.per_subject:
                    break
                if t in done:
                    got += 1
                    continue
                try:
                    title, text = extract(t)
                except Exception as e:
                    print(f"  {t}: {e}", file=sys.stderr)
                    continue
                time.sleep(a.pause)
                cs = chunks(title, text)
                if not cs:
                    continue
                for i, (sec, body) in enumerate(cs[: a.max_chunks]):
                    f.write(json.dumps({"id": f"wp-{re.sub(r'[^A-Za-z0-9]+', '_', title)[:80]}-{i}", "source": "wikipedia", "subject": subject, "title": title,
                                        "section": sec, "license": "https://creativecommons.org/licenses/by-sa/4.0/",
                                        "url": "https://en.wikipedia.org/wiki/" + urllib.parse.quote(title.replace(" ", "_")), "text": body}) + "\n")
                    n += 1
                f.flush()
                done.add(title)
                got += 1
            print(f"{subject}: {got} articles", file=sys.stderr)
    print(f"{n} new chunks -> {a.out}")


if __name__ == "__main__":
    main()
