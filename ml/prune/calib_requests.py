"""Calibration requests: what Studyboard really asks its AI, with real study material, in English and 7 other languages.

    python ml/prune/calib_requests.py --out ml/prune/work/requests.jsonl

No model is needed to write them:
  - every text job in ml/tasks/catalog.json, with the request the app actually sent (its exact instructions and layout);
  - the requests captured from the app's own tests (ml/capture/unique.json);
  - the material jobs (flashcards, quizzes, notes, lecture summaries, transcripts, highlights) rebuilt in the app's exact
    layout around real study material: study-topic Wikipedia articles from the dev split (never the test split), and
    Wikipedia articles in Spanish, French, German, Portuguese, Chinese, Hindi and Arabic (Wikimedia's dataset, CC BY-SA),
    because students' notes come in their own language and the app answers in the material's language.
The full model then answers them (gen_answers.py), and those texts decide which experts stay.
"""
import argparse, io, json, os, random, re, urllib.request

ML = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
WIKI = "https://huggingface.co/datasets/wikimedia/wikipedia/resolve/main/20231101.{lang}/{file}"
SHARDS = {"es": "train-00010-of-00013.parquet", "fr": "train-00011-of-00017.parquet", "de": "train-00014-of-00020.parquet",
          "pt": "train-00002-of-00006.parquet", "zh": "train-00002-of-00006.parquet", "hi": "train-00001-of-00002.parquet",
          "ar": "train-00004-of-00007.parquet"}
# words that mark a study topic (school subjects), per language
STUDY = {
    "es": r"célula|proteína|energía|ecuación|reacción|economía|gobierno|constitución|imperio|revolución|enfermedad|molécula|teorema|átomo|clima|mercado",
    "fr": r"cellule|protéine|énergie|équation|réaction|économie|gouvernement|constitution|empire|révolution|maladie|molécule|théorème|atome|climat|marché",
    "de": r"Zelle|Protein|Energie|Gleichung|Reaktion|Wirtschaft|Regierung|Verfassung|Reich|Revolution|Krankheit|Molekül|Satz des|Atom|Klima|Markt",
    "pt": r"célula|proteína|energia|equação|reação|economia|governo|constituição|império|revolução|doença|molécula|teorema|átomo|clima|mercado",
    "zh": r"细胞|蛋白质|能量|方程|反应|经济|政府|宪法|帝国|革命|疾病|分子|定理|原子|气候|市场",
    "hi": r"कोशिका|प्रोटीन|ऊर्जा|समीकरण|अभिक्रिया|अर्थव्यवस्था|सरकार|संविधान|साम्राज्य|क्रांति|रोग|अणु|प्रमेय|परमाणु|जलवायु|बाजार",
    "ar": r"خلية|بروتين|طاقة|معادلة|تفاعل|اقتصاد|حكومة|دستور|إمبراطورية|ثورة|مرض|جزيء|مبرهنة|ذرة|مناخ|سوق",
}
SRC = os.path.join(ML, "..", "src", "js")
# the on-device path's format instructions, read from the app (01-ai-device.js: DEV_TAIL and devWeb's schema line)
DEV_TAIL = json.loads(re.search(r'const DEV_TAIL = ("(?:[^"\\]|\\.)*");', open(os.path.join(SRC, "01-ai-device.js")).read()).group(1))


def to_json_schema(s):
    """The app's toJsonSchema (01-ai.js): Gemini-style schema to JSON Schema, same keys in the same order."""
    if isinstance(s, list):
        return [to_json_schema(x) for x in s]
    if not isinstance(s, dict):
        return s
    o = {}
    for k, v in s.items():
        if k == "type":
            o["type"] = str(v).lower()
        elif k == "properties":
            o["properties"] = {pk: to_json_schema(pv) for pk, pv in v.items()}
        elif k == "items":
            o["items"] = to_json_schema(v)
        elif k in ("required", "enum", "description"):
            o[k] = v
    return o


def device_system(system, schema):
    """The system prompt exactly as the app's on-device path sends it (what a laptop model gets)."""
    js = json.dumps(to_json_schema(schema or {"type": "OBJECT"}), ensure_ascii=False, separators=(",", ":"))
    return system + DEV_TAIL + "\n\nReply with JSON that matches this JSON Schema exactly: " + js


MATERIAL_JOBS = ["cards", "quiz", "notes-cards", "linknotes", "lecture-summary", "lecture-notes", "transcript-tidy", "highlight-card"]


def chunk(text, n_chars):
    """The first n_chars of an article, on paragraph and sentence boundaries, without headings or very short lines."""
    paras = [p.strip() for p in re.split(r"\n+", text) if len(p.strip()) > 80]
    out, size = [], 0
    for p in paras:
        if size + len(p) > n_chars:
            if not out:
                cut = p[:n_chars]
                out.append(cut[: max(cut.rfind(". "), cut.rfind("。"), cut.rfind("। "), n_chars // 2) + 1])
            break
        out.append(p)
        size += len(p) + 1
    return "\n".join(out)


def build(job, ex, doc, rnd):
    """The app's request for a material job, around new material (the layout copied from the app's real request)."""
    title, subject, text = doc["title"], doc.get("subject") or "General", doc["text"]
    paras = re.split(r"\n\s*\n", ex)
    if job in ("cards", "quiz"):
        n = rnd.choice([3, 4, 5, 6])
        tail = re.sub(r"exactly \d+", f"exactly {n}", paras[-1])
        return f"{paras[0]}\n\nPart 1 of 1 of the material: {title}\n\n{chunk(text, 2600)}\n\n{tail}"
    if job == "notes-cards":
        return f"Course: {subject}\nMake at most {rnd.choice([4, 6, 8])} flashcards from the notes between the tags.\n\n<notes>\n{chunk(text, 1500)}\n</notes>"
    if job == "linknotes":
        return f"Source: {doc.get('url') or 'https://en.wikipedia.org/wiki/' + title.replace(' ', '_')}\nThe student pasted its text:\n\n{chunk(text, 3500)}\n\nMake the study notes from the text above."
    if job == "lecture-summary":
        return f"Course: {subject}. Lecture: {title}.\nTranscript:\n{chunk(text, 3000)}"
    if job == "lecture-notes":
        body = chunk(text, 3000)
        return f"Course: {subject}. Lecture: {title}.\nTranscript:\n{body}\n\nSlides and notes for this lecture:\n--- Note ---\n{title}\n{body[:200]}"
    if job == "transcript-tidy":
        raw = re.sub(r"[.,;:]", "", chunk(text, 2500)).lower()  # a raw speech-to-text transcript: no punctuation or capitals
        return f"Lecture: {title}. Part 1 of 1.\n\n{raw}"
    if job == "highlight-card":
        sents = [s for s in re.split(r"(?<=[.。।])\s*", chunk(text, 1500)) if len(s) > 40]
        return f"Passage (page {rnd.randint(1, 30)}): {rnd.choice(sents) if sents else chunk(text, 300)}"
    raise KeyError(job)


def wiki_docs(lang, n, cache, skip=0):
    import pyarrow.parquet as pq
    os.makedirs(cache, exist_ok=True)
    f = os.path.join(cache, f"wiki-{lang}.parquet")
    if not os.path.exists(f):
        urllib.request.urlretrieve(WIKI.format(lang=lang, file=SHARDS[lang]), f + ".part")  # whole file or nothing
        os.replace(f + ".part", f)
    t = pq.read_table(f, columns=["title", "text", "url"])
    rx = re.compile(STUDY[lang], re.I)
    docs = []
    for title, text, url in zip(*(t.column(c).to_pylist() for c in ("title", "text", "url"))):
        if 3000 <= len(text) <= 40000 and len(rx.findall(text[:4000])) >= 4:
            docs.append({"title": title, "text": text, "url": url, "subject": None})
            if len(docs) >= (n + skip) * 8:
                break
    random.Random(lang).shuffle(docs)
    return docs[skip:skip + n]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="ml/prune/work/requests.jsonl")
    ap.add_argument("--per-job", type=int, default=6, help="requests per material job with English material")
    ap.add_argument("--langs", default="es,fr,de,pt,zh,hi,ar")
    ap.add_argument("--per-lang", type=int, default=8)
    ap.add_argument("--cache", default="ml/prune/work/cache")
    ap.add_argument("--seed", type=int, default=11)
    ap.add_argument("--docs", default=os.path.join(ML, "data", "splits", "dev.jsonl"), help="English material (dev for calibration; test for evaluation)")
    ap.add_argument("--no-app", action="store_true", help="only the material jobs (for evaluation: the app's own examples were calibration)")
    ap.add_argument("--lang-skip", type=int, default=0, help="skip this many articles per language (evaluation: articles not used in calibration)")
    a = ap.parse_args()
    rnd = random.Random(a.seed)
    cat = {j["id"]: j for j in json.load(open(os.path.join(ML, "tasks", "catalog.json")))}
    by_system = {j["system"]: j["id"] for j in cat.values() if j.get("system")}
    reqs, seen = [], set()

    def add(job, lang, system, user, schema, max_tokens, source):
        key = (system, user)
        if not user or key in seen:
            return
        seen.add(key)
        reqs.append({"id": f"{job}:{lang}:{len(reqs)}", "job": job, "lang": lang, "system": device_system(system, schema), "user": user,
                     "schema": schema, "maxTokens": max_tokens, "source": source})

    # 1. every text job, as the app sent it
    for j in ([] if a.no_app else cat.values()):
        if j["tier"] in ("X", "M") or not j.get("example") or not j.get("system"):
            continue
        add(j["id"], "en", j["system"], j["example"], j.get("schema"), j.get("maxTokens"), "app")
    # 2. the app's own tests (more requests in the same shapes)
    for c in ([] if a.no_app else json.load(open(os.path.join(ML, "capture", "unique.json")))):
        if c.get("media") or not c.get("system"):
            continue
        user = "\n".join(p.get("text", "") for p in c.get("parts") or [] if isinstance(p, dict) and "text" in p).strip()
        job = by_system.get(c["system"])
        if job and cat[job]["tier"] not in ("X", "M"):
            add(job, "en", c["system"], user, c.get("schema"), c.get("maxTokens"), "app-test")
    # 3. material jobs around real study material
    dev = [json.loads(l) for l in open(a.docs) if l.strip()]
    dev = [d for d in dev if len(d["text"]) > 1200]
    rnd.shuffle(dev)
    k = 0
    for job in MATERIAL_JOBS:
        for _ in range(a.per_job):
            d = dev[k % len(dev)]; k += 1
            add(job, "en", cat[job]["system"], build(job, cat[job]["example"], d, rnd), cat[job].get("schema"), cat[job].get("maxTokens"), "doc:" + d["id"])
    for lang in [x for x in a.langs.split(",") if x]:
        docs = wiki_docs(lang, a.per_lang, a.cache, a.lang_skip)
        for i, d in enumerate(docs):
            job = MATERIAL_JOBS[i % 5]  # cards, quiz, notes-cards, linknotes, lecture-summary
            add(job, lang, cat[job]["system"], build(job, cat[job]["example"], d, rnd), cat[job].get("schema"), cat[job].get("maxTokens"), f"wiki-{lang}:{d['title']}")
        print(f"  {lang}: {len(docs)} articles")
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    with open(a.out, "w") as f:
        for r in reqs:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    from collections import Counter
    print(f"{len(reqs)} requests -> {a.out}")
    print("  by language:", dict(Counter(r["lang"] for r in reqs)))
    print("  by job:", dict(sorted(Counter(r["job"] for r in reqs).items())))


if __name__ == "__main__":
    main()
