"""Will it fit a 16 GB laptop? Size and memory of Gemma 4 26B with N experts per layer, for each way of packaging it.

    python ml/prune/sizes.py                                   # the full model on Hugging Face (reads only the file headers)
    python ml/prune/sizes.py --model ml/prune/work/pruned-64   # a local model (the pruned folders too)
    python ml/prune/sizes.py --keep 128 96 80 64 56 48 --ctx 16384

Counts the real tensors (from the safetensors headers, no download of the weights): experts, the rest of the text model, and
the picture reader (vision tower, shipped as a separate file that's loaded only for picture jobs). Then, for each experts
count and package, the download size and the memory while running (weights + the attention cache at --ctx + working space).

The 16 GB budget: macOS lets the graphics chip use about 10.7 GB of a 16 GB Mac; a Windows or Linux laptop without a
graphics card runs it from main memory, where the system, a browser and Studyboard itself take about 5-6 GB. So the target is
about 9 GB in use (FITS), 10 GB at most (TIGHT: close other apps). Sizes from bits per weight are estimates (within ~5%);
llama.cpp's real file sizes are reported by run_prune.sh after packaging.
"""
import argparse, json, os, re, struct, urllib.request

# llama.cpp packages: (bits per weight for the experts, bits for everything else in the text model)
PACKAGES = {
    "Q4_K_M": (4.85, 5.2),
    "IQ4_XS": (4.25, 4.6),
    "experts IQ4_XS, rest Q6_K": (4.25, 6.56),
    "experts IQ3_S, rest Q6_K": (3.44, 6.56),
    "experts IQ3_XXS, rest Q5_K": (3.06, 5.5),
}
EXPERT = re.compile(r"language_model\.layers\.\d+\.experts\.")


def headers(model):
    """{tensor name: number of values} from every safetensors file of a local folder or a Hugging Face id."""
    out, cfg = {}, None
    if os.path.isdir(model):
        cfg = json.load(open(os.path.join(model, "config.json")))
        for f in os.listdir(model):
            if f.endswith(".safetensors"):
                with open(os.path.join(model, f), "rb") as fh:
                    n = struct.unpack("<Q", fh.read(8))[0]
                    out.update(parse(fh.read(n)))
        return out, cfg
    base = f"https://huggingface.co/{model}/resolve/main/"
    cfg = json.load(urllib.request.urlopen(base + "config.json"))
    idx = json.load(urllib.request.urlopen(base + "model.safetensors.index.json"))
    for f in sorted(set(idx["weight_map"].values())):
        n = struct.unpack("<Q", fetch(base + f, 0, 7))[0]
        out.update(parse(fetch(base + f, 8, 8 + n - 1)))
    return out, cfg


def fetch(url, a, b):
    return urllib.request.urlopen(urllib.request.Request(url, headers={"Range": f"bytes={a}-{b}"})).read()


def parse(raw):
    h = json.loads(raw)
    h.pop("__metadata__", None)
    out = {}
    for k, v in h.items():
        n = 1
        for d in v["shape"]:
            n *= d
        out[k] = (n, v["shape"])
    return out


def kv_bytes(tc, ctx, bytes_per=2):
    """The attention cache: sliding-window layers hold at most the window; full-attention layers hold the whole context."""
    total = 0
    for t in tc.get("layer_types", ["full_attention"] * tc["num_hidden_layers"]):
        if t == "sliding_attention":
            total += min(ctx, tc.get("sliding_window", ctx)) * tc["num_key_value_heads"] * tc["head_dim"] * 2
        else:
            heads = tc.get("num_global_key_value_heads") or tc["num_key_value_heads"]
            dim = tc.get("global_head_dim") or tc["head_dim"]
            total += ctx * heads * dim * (1 if tc.get("attention_k_eq_v") else 2)
    return total * bytes_per


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="google/gemma-4-26B-A4B-it")
    ap.add_argument("--keep", type=int, nargs="*", default=[128, 96, 80, 72, 64, 56, 48])
    ap.add_argument("--ctx", type=int, default=16384)
    ap.add_argument("--overhead-gb", type=float, default=0.8, help="working space and the runtime itself")
    ap.add_argument("--json", help="also write the table here")
    a = ap.parse_args()
    t, cfg = headers(a.model)
    tc = cfg.get("text_config", cfg)
    E = tc["num_experts"]
    experts = sum(n for k, (n, _) in t.items() if EXPERT.search(k))
    vision = sum(n for k, (n, _) in t.items() if "vision" in k or "audio" in k)
    rest = sum(n for n, _ in t.values()) - experts - vision
    per = experts / E
    kv = kv_bytes(tc, a.ctx) / 1e9
    print(f"{a.model}: {E} experts per layer, top {tc['top_k_experts']}; experts {experts / 1e9:.2f}B, rest of the text model "
          f"{rest / 1e9:.2f}B, picture reader {vision / 1e9:.2f}B (separate file); attention cache at {a.ctx:,} words: {kv:.2f} GB")
    active = rest + per * tc["top_k_experts"]
    print(f"used per word: about {active / 1e9:.1f}B parameters, whatever the experts count (so speed stays about the same)\n")
    rows = []
    print(f"{'experts':>8} {'params':>7}  " + "  ".join(f"{p:>26}" for p in PACKAGES))
    for k in a.keep:
        if k > E:
            continue
        cells = []
        for name, (be, br) in PACKAGES.items():
            gb = (per * k * be + rest * br) / 8 / 1e9
            use = gb + kv + a.overhead_gb
            verdict = "FITS" if use <= 9.0 else "TIGHT" if use <= 10.0 else "no"
            cells.append(f"{gb:5.1f} GB file, {use:4.1f} in use {verdict:>5}")
            rows.append({"keep": k, "package": name, "file_gb": round(gb, 2), "in_use_gb": round(use, 2), "verdict": verdict})
        print(f"{k:>8} {(per * k + rest) / 1e9:6.1f}B  " + "  ".join(cells))
    print(f"\npicture reader file: about {vision * 2 / 1e9:.2f} GB at f16, {vision * 1.06 / 1e9:.2f} GB at Q8_0 (loaded only for photo jobs)")
    if a.json:
        json.dump(rows, open(a.json, "w"), indent=1)


if __name__ == "__main__":
    main()
