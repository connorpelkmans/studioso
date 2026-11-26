"""Write a smaller Gemma 4 26B that keeps only the experts Studyboard's jobs use (step 3 of ml/prune/README.md).

    python ml/prune/prune.py --src <model dir or HF id> --stats ml/prune/work/stats.pt --keep 64 --out ml/prune/work/pruned-64

Which experts stay (per layer, the same number in every layer, which llama.cpp and vLLM need):
  1. each group (a job, or a language) gets a score per expert: REAP = average of gate weight x output size over the words
     routed to it. Rarely used experts are shrunk toward zero (a few lucky words can't make an expert look important).
     Each group's scores are scaled to sum to 1, so a rare job (syllabus reading) counts as much as a common one (flashcards).
  2. protected: each group's top --protect experts always stay, so no job or language loses the experts it leans on most.
  3. the rest are filled by the average score over groups.
The router simply picks its 8 from the experts that remain; its weights are renormalized over the 8 it picks, exactly as
before, so nothing is retrained. A word whose 8 experts all stay is computed exactly as in the full model.

The weights are streamed one tensor at a time (the biggest is about 1 GB), so this runs in little memory; the output is a
normal Hugging Face folder (vLLM, transformers and llama.cpp's converter read it), with prune_info.json saying what was kept.
"""
import argparse, json, os, re, shutil

import torch

KEY = re.compile(r"language_model\.layers\.(\d+)\.(experts\.(gate_up_proj|down_proj)|router\.(proj\.weight|per_expert_scale))$")


def scores(stats, method="reap", min_share=0.25):
    """[layers, groups, experts] per-group scores, each group's row summing to 1."""
    count, wnorm, norm = stats["count"], stats["wnorm"], stats["norm"]
    if method == "freq":
        s = count.clone()
    else:
        num = wnorm if method == "reap" else norm
        if method == "ean":
            s = num.clone()
        else:
            # average over routed words, with rare experts shrunk: divide by at least min_share x the even share of words
            even = count.sum(-1, keepdim=True) / count.shape[-1]
            s = num / torch.maximum(count, min_share * even).clamp_min(1e-9)
    tot = s.sum(-1, keepdim=True)
    return torch.where(tot > 0, s / tot.clamp_min(1e-12), torch.zeros_like(s))


def merge_small(stats, below=4000, into="other-app-jobs"):
    """Groups with fewer than `below` calibration words (a job the app has one sample of) become one group, so a single text
    doesn't get experts protected for it or count as much as a job with many texts."""
    tok = stats["tokens"].float()
    small = [g for g in range(len(stats["groups"])) if 0 < tok[g] < below]
    if len(small) < 2:
        return stats
    big = [g for g in range(len(stats["groups"])) if g not in small]
    out = dict(stats)
    for k in ("count", "wnorm", "norm"):
        out[k] = torch.cat([stats[k][:, big], stats[k][:, small].sum(1, keepdim=True)], 1)
    out["tokens"] = torch.cat([stats["tokens"][big], stats["tokens"][small].sum(0, keepdim=True)])
    out["groups"] = [stats["groups"][g] for g in big] + [into]
    return out


def choose_fair(s, keep, used):
    """Per layer, add experts one at a time to maximize the sum over groups of log(the group's kept score share): a gain for
    the group that keeps least (e.g. Chinese, whose words use different experts) counts most, so no job or language is
    left with too little of its model. s: [L, G, E] per-group score shares."""
    L, G, E = s.shape
    s = s[:, used].double()
    plan = []
    for l in range(L):
        cov = torch.full((s.shape[1],), 1e-4, dtype=torch.float64)
        left = torch.ones(E, dtype=torch.bool)
        chosen = []
        for _ in range(keep):
            gain = torch.log(cov[:, None] + s[l]).sum(0) - torch.log(cov).sum()
            gain[~left] = -float("inf")
            e = int(gain.argmax())
            chosen.append(e); left[e] = False; cov += s[l, :, e]
        plan.append(sorted(chosen))
    return plan, {}


def choose(stats, keep, method="reap", protect=2, min_share=0.25, merge_below=4000, select="protect"):
    """The experts to keep per layer. select="fair": balance the groups (choose_fair); "protect": each group's top `protect`
    experts, then the best on average over groups."""
    if merge_below:
        stats = merge_small(stats, merge_below)
    s = scores(stats, method, min_share)            # [L, G, E]
    L, G, E = s.shape
    if keep >= E:
        return [list(range(E)) for _ in range(L)], {}
    used = stats["tokens"] > 0
    if select == "fair":
        return choose_fair(s, keep, used)
    overall = s[:, used].mean(1)                     # [L, E]
    plan, protected_by = [], {}
    for l in range(L):
        chosen = []
        for g in range(G):
            if not used[g]:
                continue
            for e in torch.argsort(s[l, g], descending=True)[:protect].tolist():
                if s[l, g, e] > 0 and e not in chosen:
                    chosen.append(e)
                    protected_by.setdefault(f"{l}:{e}", []).append(stats["groups"][g])
        if len(chosen) > keep:  # more protected experts than the budget: the best overall among them stay
            chosen = sorted(chosen, key=lambda e: -overall[l, e].item())[:keep]
        for e in torch.argsort(overall[l], descending=True).tolist():
            if len(chosen) >= keep:
                break
            if e not in chosen:
                chosen.append(e)
        plan.append(sorted(chosen))
    return plan, protected_by


def coverage(stats, plan):
    """Share of routed words (per group) whose expert stays: how much of the full model each job still gets exactly."""
    count = stats["count"]
    out = {}
    for g, name in enumerate(stats["groups"]):
        kept = sum(count[l, g, plan[l]].sum().item() for l in range(count.shape[0]))
        allw = count[:, g].sum().item()
        out[name] = round(kept / allw, 4) if allw else None
    return out


def write(src, dst, plan, layer_ids, keep):
    from huggingface_hub import snapshot_download
    from safetensors import safe_open
    from safetensors.torch import save_file
    if not os.path.isdir(src):
        src = snapshot_download(src, allow_patterns=["*.json", "*.safetensors", "*.jinja", "*.model", "*.txt"])
    os.makedirs(dst, exist_ok=True)
    rows = {layer: torch.tensor(plan[i]) for i, layer in enumerate(layer_ids)}
    shards = sorted(f for f in os.listdir(src) if f.endswith(".safetensors"))
    weight_map, part, part_bytes, n_part, total = {}, {}, 0, 0, 0
    names = []

    def flush():
        nonlocal part, part_bytes, n_part
        if not part:
            return
        n_part += 1
        fn = f"model-{n_part:05d}.safetensors"
        save_file(part, os.path.join(dst, fn), metadata={"format": "pt"})
        for k in part:
            weight_map[k] = fn
        names.append(fn)
        part, part_bytes = {}, 0

    for sh in shards:
        with safe_open(os.path.join(src, sh), framework="pt") as f:
            for k in f.keys():
                t = f.get_tensor(k)
                m = KEY.search(k)
                if m:
                    layer = int(m.group(1))
                    if layer not in rows:
                        raise SystemExit(f"stats have no layer {layer} (stats from another model?)")
                    if t.shape[0] < keep:
                        raise SystemExit(f"{k} has {t.shape[0]} experts, fewer than --keep {keep}")
                    t = t.index_select(0, rows[layer]).contiguous()
                part[k] = t
                part_bytes += t.numel() * t.element_size()
                total += t.numel() * t.element_size()
                if part_bytes >= 4 * 1024 ** 3:
                    flush()
    flush()
    # rename to model-0000i-of-0000n
    final = {}
    for i, fn in enumerate(names, 1):
        new = f"model-{i:05d}-of-{len(names):05d}.safetensors"
        os.replace(os.path.join(dst, fn), os.path.join(dst, new))
        final[fn] = new
    json.dump({"metadata": {"total_size": total}, "weight_map": {k: final[v] for k, v in sorted(weight_map.items())}},
              open(os.path.join(dst, "model.safetensors.index.json"), "w"), indent=2)
    cfg = json.load(open(os.path.join(src, "config.json")))
    tc = cfg.get("text_config", cfg)
    if tc.get("top_k_experts", 0) > keep:
        raise SystemExit(f"--keep {keep} is below the router's top_k ({tc['top_k_experts']})")
    tc["num_experts"] = keep
    json.dump(cfg, open(os.path.join(dst, "config.json"), "w"), indent=2)
    for f in os.listdir(src):
        if f not in ("config.json", "model.safetensors.index.json") and not f.endswith(".safetensors") and os.path.isfile(os.path.join(src, f)):
            shutil.copy(os.path.join(src, f), os.path.join(dst, f))
    return total


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, help="the full model: a local folder or a Hugging Face id")
    ap.add_argument("--stats", required=True)
    ap.add_argument("--keep", type=int, required=True, help="experts kept per layer (of 128)")
    ap.add_argument("--out", required=True)
    ap.add_argument("--method", default="reap", choices=["reap", "ean", "freq"])
    ap.add_argument("--protect", type=int, default=2, help="each job's/language's own top experts that always stay")
    ap.add_argument("--min-share", type=float, default=0.25)
    ap.add_argument("--plan-only", action="store_true", help="print the plan and coverage; write no model")
    a = ap.parse_args()
    st = torch.load(a.stats, weights_only=False)
    plan, prot = choose(st, a.keep, a.method, a.protect, a.min_share)
    cov = coverage(st, plan)
    worst = sorted((v, k) for k, v in cov.items() if v is not None)[:5]
    print(f"keep {a.keep}/{st['n_experts']} per layer ({a.method}); routed words still on a kept expert, lowest groups:",
          ", ".join(f"{k} {v:.1%}" for v, k in worst))
    info = {"keep": a.keep, "of": st["n_experts"], "method": a.method, "protect": a.protect, "min_share": a.min_share,
            "source": st.get("model"), "layers": st["layers"], "kept": plan, "coverage": cov, "tokens": int(st["tokens"].sum().item())}
    if a.plan_only:
        print(json.dumps({k: v for k, v in info.items() if k != "kept"}, indent=1))
        return
    size = write(a.src, a.out, plan, st["layers"], a.keep)
    json.dump(info, open(os.path.join(a.out, "prune_info.json"), "w"), indent=1)
    print(f"wrote {a.out}: {size / 1e9:.1f} GB in bf16")


if __name__ == "__main__":
    main()
