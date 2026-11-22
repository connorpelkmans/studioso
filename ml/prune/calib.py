"""Calibration texts for pruning and for the 4-bit packaging (step 1 of ml/prune/README.md).

    python ml/prune/calib.py --in ml/prune/work/train/sft.jsonl ml/prune/work/gen/lang.jsonl \
        --tokenizer google/gemma-4-26B-A4B-it --out ml/prune/work

Each record is a real app request (system + user, exactly as the app sends it) with the full model's own answer, written in
the model's chat format. Jobs are balanced (at most --per-job each) so the common ones don't drown out the rare ones; a
language other than English is its own group, so its experts are protected like a job's.

Writes:
  calib.jsonl      {"text", "ids", "group"} for reap.py (expert scores)
  calib_dev.jsonl  held-out texts (never used to choose experts) for kl.py (how close a pruned model stays to the full one)
  calib.txt        the same texts as plain text, for llama.cpp's importance matrix (4-bit packaging tuned on these jobs)
"""
import argparse, collections, json, os, random


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", nargs="+", required=True, help="sft.jsonl-style files: {prompt, completion, job[, lang]}")
    ap.add_argument("--tokenizer", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--per-job", type=int, default=48)
    ap.add_argument("--dev-share", type=float, default=0.12)
    ap.add_argument("--max-len", type=int, default=8192)
    ap.add_argument("--seed", type=int, default=7)
    a = ap.parse_args()
    from transformers import AutoTokenizer
    tok = AutoTokenizer.from_pretrained(a.tokenizer)
    rnd = random.Random(a.seed)
    by = collections.defaultdict(list)
    for f in a.inp:
        if not os.path.exists(f):
            print("  (missing, skipped)", f)
            continue
        for line in open(f):
            if not line.strip():
                continue
            r = json.loads(line)
            lang = (r.get("lang") or "en").lower()
            group = r.get("job", "other") if lang == "en" else "lang:" + lang
            by[group].append(r)
    os.makedirs(a.out, exist_ok=True)
    calib, dev, stats = [], [], {}
    for group, rs in sorted(by.items()):
        rnd.shuffle(rs)
        rs = rs[: a.per_job]
        n_dev = max(1, round(len(rs) * a.dev_share)) if len(rs) >= 4 else 0
        for i, r in enumerate(rs):
            msgs = list(r["prompt"]) + list(r["completion"])
            text = tok.apply_chat_template(msgs, tokenize=False)
            ids = tok(text, add_special_tokens=False)["input_ids"][: a.max_len]
            (dev if i < n_dev else calib).append({"text": text, "ids": ids, "group": group})
        stats[group] = len(rs)
    for name, rows in (("calib.jsonl", calib), ("calib_dev.jsonl", dev)):
        with open(os.path.join(a.out, name), "w") as f:
            for r in rows:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")
    with open(os.path.join(a.out, "calib.txt"), "w") as f:
        for r in calib:
            f.write(r["text"] + "\n\n")
    toks = sum(len(r["ids"]) for r in calib)
    print(f"{len(calib)} calibration texts ({toks:,} tokens) and {len(dev)} held out, in {len(stats)} groups:")
    print("  " + ", ".join(f"{g} {n}" for g, n in sorted(stats.items())))


if __name__ == "__main__":
    main()
