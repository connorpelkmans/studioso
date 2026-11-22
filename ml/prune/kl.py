"""How close a pruned model stays to the full one, word by word, on held-out Studyboard texts (step 4 of ml/prune/README.md).

    python ml/prune/kl.py --model google/gemma-4-26B-A4B-it --dev ml/prune/work/calib_dev.jsonl --save-ref ml/prune/work/ref.pt
    python ml/prune/kl.py --model ml/prune/work/pruned-64   --dev ml/prune/work/calib_dev.jsonl --ref ml/prune/work/ref.pt

The first run keeps the full model's top --topk next-word probabilities for every position; later runs compare a pruned model
with them (the two never need to fit on the card at once). Reported overall and per group (job or language):
    agree   how often both models' most likely next word is the same (100% = the same answers when sampling is off)
    kl      KL divergence from the full model (0 = identical; on the tail beyond the top words, the leftover mass is one bucket)
Cheap and sensitive: use it to compare expert counts and settings before the slower job-by-job comparison.
"""
import argparse, collections, json

import torch


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--dev", required=True)
    ap.add_argument("--save-ref")
    ap.add_argument("--ref")
    ap.add_argument("--topk", type=int, default=32)
    ap.add_argument("--out", help="write the summary as JSON here")
    ap.add_argument("--device-map", default="auto")
    a = ap.parse_args()
    if bool(a.save_ref) == bool(a.ref):
        raise SystemExit("give exactly one of --save-ref or --ref")
    import sys, os
    sys.path.insert(0, os.path.dirname(__file__))
    from reap import load_model
    rows = [json.loads(l) for l in open(a.dev) if l.strip()]
    model = load_model(a.model, a.device_map, torch.bfloat16)
    model.eval()
    dev = next(model.parameters()).device
    ref = torch.load(a.ref, weights_only=False) if a.ref else None
    saved = []
    agg = collections.defaultdict(lambda: [0.0, 0, 0])  # group -> [kl sum, agree count, positions]
    for i, r in enumerate(rows):
        ids = torch.tensor([r["ids"]], device=dev)
        with torch.no_grad():
            logp = torch.log_softmax(model(input_ids=ids, use_cache=False).logits[0].float(), -1)
        if a.save_ref:
            v, ix = logp.topk(a.topk, -1)
            saved.append({"lp": v.half().cpu(), "ix": ix.int().cpu(), "group": r["group"]})
            continue
        R = ref["rows"][i]
        ix, p_lp = R["ix"].to(dev).long(), R["lp"].to(dev).float()
        p = p_lp.exp()
        q_lp = logp.gather(-1, ix)
        q = q_lp.exp()
        p_rest = (1 - p.sum(-1)).clamp_min(1e-9)
        q_rest = (1 - q.sum(-1)).clamp_min(1e-9)
        kl = (p * (p_lp - q_lp)).sum(-1) + p_rest * (p_rest.log() - q_rest.log())
        # the full model's top word is also this model's top word (ties count as agreement)
        agree = logp.gather(-1, ix[:, :1])[:, 0] >= logp.max(-1).values - 1e-6
        for g in (r["group"], "ALL"):
            agg[g][0] += kl.sum().item()
            agg[g][1] += agree.sum().item()
            agg[g][2] += kl.numel()
    if a.save_ref:
        torch.save({"model": a.model, "topk": a.topk, "rows": saved}, a.save_ref)
        print(f"saved the full model's reference for {len(saved)} texts to {a.save_ref}")
        return
    summary = {g: {"kl": round(s / n, 5), "agree": round(c / n, 4), "positions": n} for g, (s, c, n) in agg.items()}
    worst = sorted(((v["agree"], g) for g, v in summary.items() if g != "ALL"))[:6]
    print(f"{a.model}: agree {summary['ALL']['agree']:.2%}, KL {summary['ALL']['kl']:.4f} over {summary['ALL']['positions']:,} positions")
    print("  lowest agreement: " + ", ".join(f"{g} {v:.1%}" for v, g in worst))
    if a.out:
        json.dump(summary, open(a.out, "w"), indent=1)


if __name__ == "__main__":
    main()
