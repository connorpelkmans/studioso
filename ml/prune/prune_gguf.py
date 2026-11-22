"""Cut experts out of a llama.cpp GGUF file directly, byte for byte (no re-compression, no GPU, little memory).

    python ml/prune/prune_gguf.py --src gemma-4-26B_q4_0-it.gguf --stats ml/prune/work/stats.pt --keep 56 \
        --out studyboard-26b-k56-q4_0.gguf

Made for Google's QAT 4-bit file of Gemma 4 26B (gemma-4-26B-A4B-it-qat-q4_0-gguf): Google trained that model to be
compressed to exactly this 4-bit format, so its quality at 4-bit is close to the full-precision model's. Re-compressing it
(to another 4-bit format) would lose that, so instead this copies the kept experts' bytes unchanged.

In the file, each layer stores its experts as one tensor with the expert as the outermost dimension (expert e's weights are
one contiguous run of bytes), so keeping some experts is taking some runs:
    blk.N.ffn_gate_up_exps.weight   [128 experts] x 1408 x 2816   (Q4_0)
    blk.N.ffn_down_exps.weight      [128 experts] x 2816 x 704    (Q4_0)
    blk.N.ffn_down_exps.scale       [128]                         (the router's per-expert scale, F32)
    blk.N.ffn_gate_inp.weight       [128 experts] x 2816          (the router, F32)
gemma4.expert_count becomes the kept count; everything else is copied as is. The same experts are kept as prune.py would
keep (the same choose()), and the plan is stored in the file's metadata (studyboard.prune).
"""
import argparse, json, os, re, sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
PER_EXPERT = re.compile(r"^blk\.(\d+)\.(ffn_gate_up_exps\.weight|ffn_down_exps\.weight|ffn_down_exps\.scale|ffn_gate_inp\.weight|ffn_gate_exps\.weight|ffn_up_exps\.weight)$")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    ap.add_argument("--stats", help="stats.pt from stream.py/reap.py (the experts to keep are chosen as prune.py does)")
    ap.add_argument("--plan", help="or a prune_info.json / plan JSON with 'kept' (per layer)")
    ap.add_argument("--keep", type=int, required=True)
    ap.add_argument("--method", default="reap")
    ap.add_argument("--protect", type=int, default=2)
    ap.add_argument("--out", required=True)
    ap.add_argument("--name", default="Studyboard 26B")
    a = ap.parse_args()
    import gguf
    r = gguf.GGUFReader(a.src)
    arch = r.fields["general.architecture"].contents()
    E = int(r.fields[f"{arch}.expert_count"].contents())
    used = int(r.fields[f"{arch}.expert_used_count"].contents())
    if a.keep < used:
        raise SystemExit(f"--keep {a.keep} is below the experts used per word ({used})")
    if a.plan:
        info = json.load(open(a.plan))
        kept = info["kept"]
        layers = info.get("layers", list(range(len(kept))))
    elif a.stats:
        import torch
        from prune import choose, coverage
        st = torch.load(a.stats, weights_only=False)
        kept, _ = choose(st, a.keep, a.method, a.protect)
        layers = st["layers"]
        info = {"keep": a.keep, "of": E, "method": a.method, "protect": a.protect, "coverage": coverage(st, kept),
                "tokens": int(st["tokens"].sum().item()), "source_stats": st.get("model")}
    else:
        raise SystemExit("give --stats or --plan")
    plan = {int(l): np.array(sorted(k), dtype=np.int64) for l, k in zip(layers, kept)}
    if any(len(v) != a.keep for v in plan.values()):
        raise SystemExit("the plan doesn't keep --keep experts in every layer")

    w = gguf.GGUFWriter(a.out, arch=arch, endianess=r.endianess)
    new = {f"{arch}.expert_count": (a.keep, gguf.GGUFValueType.UINT32),
           "general.name": (a.name, gguf.GGUFValueType.STRING),
           "general.size_label": (f"{a.keep}x2.6B", gguf.GGUFValueType.STRING)}
    for field in r.fields.values():
        if field.name == gguf.Keys.General.ARCHITECTURE or field.name.startswith("GGUF."):
            continue
        vt = field.types[0]
        sub = field.types[-1] if vt == gguf.GGUFValueType.ARRAY else None
        if field.name in new:
            v, t = new.pop(field.name)
            w.add_key_value(field.name, v, t)
        else:
            w.add_key_value(field.name, field.contents(), vt, sub_type=sub)
    for k, (v, t) in new.items():
        w.add_key_value(k, v, t)
    w.add_key_value("studyboard.prune", json.dumps({**{k: v for k, v in info.items() if k != "kept"},
                    "kept": {str(l): plan[l].tolist() for l in sorted(plan)}}), gguf.GGUFValueType.STRING)

    datas = []
    for t in r.tensors:
        d = t.data
        m = PER_EXPERT.match(t.name)
        if m:
            layer = int(m.group(1))
            if d.shape[0] != E:
                raise SystemExit(f"{t.name}: outermost dimension {d.shape[0]} isn't the {E} experts")
            d = d[plan[layer]]
        datas.append(d)
        w.add_tensor_info(t.name, d.shape, d.dtype, d.nbytes, t.tensor_type)
    w.write_header_to_file()
    w.write_kv_data_to_file()
    w.write_ti_data_to_file()
    total = 0
    for d in datas:
        w.write_tensor_data(np.ascontiguousarray(d), tensor_endianess=r.endianess)
        total += d.nbytes
    w.close()
    print(f"wrote {a.out}: {a.keep} of {E} experts per layer, {os.path.getsize(a.out) / 1e9:.2f} GB")


if __name__ == "__main__":
    main()
