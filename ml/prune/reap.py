"""How much each expert of Gemma 4 26B contributes on Studyboard's own jobs (step 2 of ml/prune/README.md).

    python ml/prune/reap.py --model google/gemma-4-26B-A4B-it --calib ml/prune/work/calib.jsonl --out ml/prune/work/stats.pt

Gemma 4 26B has 30 layers of 128 experts; each word goes to 8 of them. For every calibration text (a real app request with the
full model's own answer), this runs the full model and records, for each layer, each expert and each group (the job, or the
language), over the words routed to that expert:
    count   how many words went to it
    wnorm   sum of gate weight x size of its output     (REAP: Lasby et al. 2025, "router-weighted expert activation")
    norm    sum of the size of its output                (EAN, a simpler criterion kept for comparison)
prune.py turns these into the experts to keep. Nothing is changed in the model here.

Needs: a GPU with room for the model in bf16 (about 52 GB: an 80 GB H100/A100), or --device-map auto over several cards.
"""
import argparse, json, time

import torch
import torch.nn.functional as F


def load_model(name, device_map, dtype):
    import transformers
    for cls in ("AutoModelForImageTextToText", "AutoModelForCausalLM"):
        try:
            return getattr(transformers, cls).from_pretrained(name, dtype=dtype, device_map=device_map)
        except (ValueError, KeyError):
            continue
    raise SystemExit("transformers can't load " + name + " (it needs a version with Gemma 4: pip install -U transformers)")


def expert_modules(model):
    """[(layer index, experts module)] for the text model's MoE layers, in order."""
    out = []
    for name, mod in model.named_modules():
        if type(mod).__name__.endswith("TextExperts") and hasattr(mod, "gate_up_proj") and hasattr(mod, "down_proj"):
            parts = name.split(".")
            out.append((int(parts[parts.index("layers") + 1]), mod))
    if not out:
        raise SystemExit("no MoE experts found: is this Gemma 4 26B (enable_moe_block)?")
    return sorted(out, key=lambda x: x[0])


class Recorder:
    def __init__(self, layers, n_experts, groups):
        self.g = {g: i for i, g in enumerate(groups)}
        shape = (len(layers), len(groups), n_experts)
        self.count = torch.zeros(shape, dtype=torch.float64)
        self.wnorm = torch.zeros(shape, dtype=torch.float64)
        self.norm = torch.zeros(shape, dtype=torch.float64)
        self.tokens = torch.zeros(len(groups), dtype=torch.float64)
        self.row = {layer: i for i, layer in enumerate(layers)}
        self.group = 0

    def hook(self, layer):
        r = self.row[layer]

        @torch.no_grad()
        def fn(mod, args, output):
            x, idx, w = args[0], args[1], args[2]  # [T, H], [T, K], [T, K] (same call for every experts implementation)
            idx = idx.reshape(-1, idx.shape[-1])
            w = w.reshape(idx.shape).float()
            x = x.reshape(idx.shape[0], -1)
            for e in torch.unique(idx).tolist():
                if e < 0 or e >= mod.gate_up_proj.shape[0]:
                    continue
                tok, kpos = torch.where(idx == e)
                gate, up = F.linear(x[tok], mod.gate_up_proj[e]).chunk(2, dim=-1)
                o = F.linear(mod.act_fn(gate) * up, mod.down_proj[e])
                n = o.float().norm(dim=-1)
                self.count[r, self.group, e] += tok.numel()
                self.wnorm[r, self.group, e] += (w[tok, kpos] * n).sum().item()
                self.norm[r, self.group, e] += n.sum().item()
        return fn


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--calib", required=True, help="calib.jsonl from calib.py (text or ids, group)")
    ap.add_argument("--out", required=True)
    ap.add_argument("--max-len", type=int, default=8192)
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--device-map", default="auto")
    ap.add_argument("--dtype", default="bfloat16")
    a = ap.parse_args()

    rows = [json.loads(l) for l in open(a.calib) if l.strip()]
    if a.limit:
        rows = rows[: a.limit]
    groups = sorted({r.get("group", "all") for r in rows})
    model = load_model(a.model, a.device_map, getattr(torch, a.dtype))
    model.eval()
    tok = None
    if any("ids" not in r for r in rows):
        from transformers import AutoTokenizer
        tok = AutoTokenizer.from_pretrained(a.model)
    mods = expert_modules(model)
    n_exp = mods[0][1].gate_up_proj.shape[0]
    rec = Recorder([l for l, _ in mods], n_exp, groups)
    handles = [m.register_forward_hook(rec.hook(l)) for l, m in mods]
    dev = next(model.parameters()).device
    t0, total = time.time(), 0
    for i, r in enumerate(rows):
        ids = r["ids"] if "ids" in r else tok(r["text"], add_special_tokens=False)["input_ids"]
        ids = ids[: a.max_len]
        rec.group = rec.g[r.get("group", "all")]
        rec.tokens[rec.group] += len(ids)
        with torch.no_grad():
            model(input_ids=torch.tensor([ids], device=dev), use_cache=False)
        total += len(ids)
        if (i + 1) % 25 == 0 or i + 1 == len(rows):
            print(f"  {i + 1}/{len(rows)} texts, {total:,} tokens, {total / (time.time() - t0):.0f} tok/s", flush=True)
    for h in handles:
        h.remove()
    torch.save({"layers": [l for l, _ in mods], "groups": groups, "n_experts": n_exp,
                "top_k": int(rec.count[0].sum().item() / max(1, rec.tokens.sum().item())) if total else 0,
                "count": rec.count, "wnorm": rec.wnorm, "norm": rec.norm, "tokens": rec.tokens, "model": a.model}, a.out)
    print(f"saved {a.out}: {len(mods)} layers x {n_exp} experts, {len(groups)} groups, {total:,} tokens")


if __name__ == "__main__":
    main()
