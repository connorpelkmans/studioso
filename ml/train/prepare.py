"""Generated records (apploop.js generate) -> training sets.

    python ml/train/prepare.py --gen ml/data/gen/*.jsonl --out ml/data/train --min-score 12 --cap-per-job 4000

Writes:
  sft.jsonl / sft_dev.jsonl   {"prompt": [system, user], "completion": [assistant], "job"}: the chosen (best-scoring) answer to
                              each request, exactly as the app's WebLLM path sends it
  dpo.jsonl                   {"prompt", "chosen", "rejected", "job"}: the best answer vs a clearly worse one to the same request
                              (score gap >= --gap), for preference training
  report.json                 counts per job, what was dropped and why

Guards: a request from a document in the test split is never used (ml/data/splits/test.jsonl); records made by the reference
model (Gemini, for evaluation only) are refused; an answer that isn't valid JSON is never a training target.
"""
import argparse, collections, glob, hashlib, json, os, random


def load(paths):
    for p in paths:
        for f in glob.glob(p):
            for line in open(f):
                line = line.strip()
                if line:
                    try:
                        yield json.loads(line)
                    except Exception:
                        pass


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--gen", nargs="+", required=True)
    ap.add_argument("--out", default="ml/data/train")
    ap.add_argument("--test", default="ml/data/splits/test.jsonl")
    ap.add_argument("--min-score", type=float, default=12)
    ap.add_argument("--gap", type=float, default=6)
    ap.add_argument("--cap-per-job", type=int, default=4000)
    ap.add_argument("--dev-share", type=float, default=0.03)
    ap.add_argument("--seed", type=int, default=13)
    a = ap.parse_args()
    test_docs = set()
    if os.path.exists(a.test):
        for d in load([a.test]):
            test_docs.add(d["id"])
            test_docs.add(d["id"].split(":")[0])
    r = random.Random(a.seed)
    why = collections.Counter()
    per_job = collections.defaultdict(list)
    pairs = collections.defaultdict(list)
    seen = set()
    for rec in load(a.gen):
        if rec.get("kind") != "call":
            continue
        if rec.get("engine") == "gemini" or rec.get("reference"):
            why["reference model output (never trained on)"] += 1
            continue
        doc = str(rec.get("doc") or "")
        if doc in test_docs or doc.split(":")[0] in test_docs:
            why["from a test document"] += 1
            continue
        cands = rec.get("candidates") or []
        if not cands:
            why["no candidates"] += 1
            continue
        msgs = rec["messages"]
        key = hashlib.sha1(json.dumps(msgs, sort_keys=True).encode()).hexdigest()
        if key in seen:
            why["duplicate request"] += 1
            continue
        seen.add(key)
        best = max(cands, key=lambda c: c.get("score", -1e9))
        try:
            json.loads(best["content"])
        except Exception:
            why["best answer not JSON"] += 1
            continue
        if best.get("score", -1e9) < a.min_score:
            why["best answer scored too low"] += 1
            continue
        prompt = [{"role": m["role"], "content": m["content"]} for m in msgs]
        job = rec.get("job") or "other"
        per_job[job].append({"prompt": prompt, "completion": [{"role": "assistant", "content": best["content"]}], "job": job, "score": best["score"]})
        worse = [c for c in cands if best.get("score", 0) - c.get("score", 0) >= a.gap]
        if worse:
            w = min(worse, key=lambda c: c.get("score", 0))
            pairs[job].append({"prompt": prompt, "chosen": [{"role": "assistant", "content": best["content"]}], "rejected": [{"role": "assistant", "content": w["content"]}], "job": job})
    os.makedirs(a.out, exist_ok=True)
    sft, dev, dpo, counts = [], [], [], {}
    for job, rows in per_job.items():
        r.shuffle(rows)
        rows = rows[: a.cap_per_job]
        k = max(1, int(len(rows) * a.dev_share)) if len(rows) > 20 else 0
        dev += rows[:k]
        sft += rows[k:]
        p = pairs[job][: a.cap_per_job // 2]
        dpo += p
        counts[job] = {"sft": len(rows) - k, "dev": k, "dpo": len(p)}
    r.shuffle(sft)
    r.shuffle(dpo)
    for name, rows in (("sft", sft), ("sft_dev", dev), ("dpo", dpo)):
        with open(os.path.join(a.out, name + ".jsonl"), "w") as f:
            for x in rows:
                f.write(json.dumps(x) + "\n")
    rep = {"jobs": counts, "dropped": dict(why), "totals": {"sft": len(sft), "dev": len(dev), "dpo": len(dpo)}}
    json.dump(rep, open(os.path.join(a.out, "report.json"), "w"), indent=1)
    print(json.dumps(rep["totals"]), json.dumps(rep["dropped"]))


if __name__ == "__main__":
    main()
