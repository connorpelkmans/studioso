"""Train / dev / test split by SOURCE ARTICLE (never the same article on both sides), stratified by subject, with near-duplicates
removed (word 5-gram overlap). The test set is the evaluation set: it's never used to make training data.

    python ml/corpus/split.py --in ml/data/raw/wikipedia.jsonl ml/data/raw/openstax.jsonl ml/eval/handnotes.jsonl --test 400 --dev 150
Writes ml/data/splits/{train,dev,test}.jsonl and a manifest with counts.
"""
import argparse, collections, hashlib, json, os, random, re


def grams(t, n=5):
    w = re.findall(r"[a-z0-9]+", t.lower())
    return {hash(" ".join(w[i:i + n])) for i in range(0, max(0, len(w) - n), 3)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", nargs="+", required=True)
    ap.add_argument("--out", default="ml/data/splits")
    ap.add_argument("--test", type=int, default=400)
    ap.add_argument("--dev", type=int, default=150)
    ap.add_argument("--seed", type=int, default=5)
    a = ap.parse_args()
    docs = []
    for p in a.inp:
        if os.path.exists(p):
            docs += [json.loads(l) for l in open(p) if l.strip()]
    # near-duplicates out
    seen, keep = [], []
    for d in docs:
        g = grams(d["text"])
        if not g or any(len(g & s) / max(1, min(len(g), len(s))) > 0.5 for s in seen[-400:]):
            continue
        seen.append(g)
        keep.append(d)
    # group by article (title), split groups
    groups = collections.defaultdict(list)
    for d in keep:
        groups[(d.get("source"), d.get("title") or d["id"])].append(d)
    r = random.Random(a.seed)
    by_subj = collections.defaultdict(list)
    for k, v in groups.items():
        by_subj[v[0].get("subject", "other")].append(v)
    test, dev, train = [], [], []
    total = sum(len(v) for v in groups.values())
    for subj, gs in by_subj.items():
        r.shuffle(gs)
        share = sum(len(g) for g in gs) / max(1, total)
        nt, nd = round(a.test * share), round(a.dev * share)
        for g in gs:
            # hand-written evaluation notes always go to test
            if any(d.get("source") == "hand" for d in g):
                test += g
            elif sum(1 for d in test if d.get("subject") == subj) < nt:
                test += g
            elif sum(1 for d in dev if d.get("subject") == subj) < nd:
                dev += g
            else:
                train += g
    os.makedirs(a.out, exist_ok=True)
    for name, rows in (("train", train), ("dev", dev), ("test", test)):
        with open(os.path.join(a.out, name + ".jsonl"), "w") as f:
            for d in rows:
                f.write(json.dumps(d) + "\n")
    man = {"documents": len(docs), "after_dedupe": len(keep), "train": len(train), "dev": len(dev), "test": len(test),
           "subjects": collections.Counter(d.get("subject", "other") for d in keep), "sha": hashlib.sha256("".join(sorted(d["id"] for d in test)).encode()).hexdigest()[:16]}
    json.dump(man, open(os.path.join(a.out, "manifest.json"), "w"), indent=1)
    print(json.dumps(man))


if __name__ == "__main__":
    main()
