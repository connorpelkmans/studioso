"""How close is a model (any GGUF) to the full Gemma 4 26B on Studyboard's answers? Word by word, on the 4-bit files.

    python ml/prune/answer_match.py --model studyboard-26b-k56.gguf --dev ml/prune/work/calib_dev.jsonl --out k56.json

The held-out texts (calib_dev.jsonl) hold real app requests in 8 languages with the full model's answers. Each model reads
the request, then the full model's answer one word at a time; at every word of the answer we check whether the model would
have picked the same word (match) and how surprised it is by it (loss, in nats; lower = closer to the full model).
Run on the full model too (the ceiling, about 95%+ because it wrote them) and on Gemma 4 E4B (the bar to beat): Gemma 4
models share one vocabulary, so the same word ids are compared. This is what agree in stream.py measures, but on the
answers only (the part a student sees) and on the real quantized files that would ship.
"""
import argparse, json, math, os, sys, time

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
TURN = "<|turn>model\n"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--dev", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--max-answer", type=int, default=200, help="words of each answer to check")
    ap.add_argument("--threads", type=int, default=os.cpu_count())
    a = ap.parse_args()
    from gen_answers import load
    rows = [json.loads(l) for l in open(a.dev) if l.strip()]
    n_ctx = max(len(r["ids"]) for r in rows) + 64
    m = load(a.model, n_ctx, a.threads)
    res, t0, nv = {}, time.time(), m.n_vocab()
    for k, r in enumerate(rows):
        cut = r["text"].rfind(TURN)
        if cut < 0:
            continue
        prompt = m.tokenize(r["text"][: cut + len(TURN)].encode(), add_bos=False, special=True)
        ids = m.tokenize(r["text"].encode(), add_bos=False, special=True)
        if ids[: len(prompt)] != prompt:
            raise SystemExit(f"{r['group']}: the request's words don't line up with the whole text's")
        ans = ids[len(prompt):][: a.max_answer]
        m.reset()
        m.eval(prompt)
        hit, loss = 0, 0.0
        for tok in ans:
            lg = np.ctypeslib.as_array(m._ctx.get_logits(), shape=(nv,)).astype(np.float64)  # the last word's (only it is kept)
            lse = lg.max() + math.log(np.exp(lg - lg.max()).sum())
            hit += int(lg.argmax() == tok)
            loss += lse - lg[tok]
            m.eval([tok])
        for g in (r["group"], "ALL"):
            d = res.setdefault(g, [0, 0.0, 0])
            d[0] += hit; d[1] += loss; d[2] += len(ans)
        print(f"  {k + 1}/{len(rows)} {r['group']}: match {hit / max(1, len(ans)):.1%}, loss {loss / max(1, len(ans)):.3f} "
              f"({(time.time() - t0) / 60:.1f} min)", flush=True)
    out = {g: {"match": round(h / n, 4), "loss": round(l / n, 4), "words": n} for g, (h, l, n) in res.items()}
    out["_model"] = os.path.basename(a.model)
    json.dump(out, open(a.out, "w"), indent=1, ensure_ascii=False)
    print(f"{out['_model']}: matches the full model's next word {out['ALL']['match']:.1%} of the time, loss {out['ALL']['loss']:.3f}")


if __name__ == "__main__":
    main()
