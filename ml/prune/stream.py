"""Expert scores and pruning checks for Gemma 4 26B on an ordinary computer: no graphics card, about 12 GB of memory.

    # expert scores (what reap.py measures), from the weights on Hugging Face, one layer at a time
    python ml/prune/stream.py score --model google/gemma-4-26B-A4B-it-qat-q4_0-unquantized \
        --calib ml/prune/work/calib.jsonl --out ml/prune/work/stats.pt
    # how close pruned versions stay to the full model, word by word, on held-out texts (what kl.py measures)
    python ml/prune/stream.py agree --model google/gemma-4-26B-A4B-it-qat-q4_0-unquantized \
        --dev ml/prune/work/calib_dev.jsonl --stats ml/prune/work/stats.pt --keep 64 56 48 --out ml/prune/work/agree.json

The full model is 52 GB, but a forward pass only needs one layer at a time (about 1.7 GB). So all texts go through layer 1,
then layer 2, and so on: the weights of each layer are fetched (from a local folder, or straight from Hugging Face with range
requests: nothing is stored), used, and dropped, while the next layer downloads. The words' running states stay in memory
(about 11 KB per word). It computes exactly what the normal forward pass computes (smoke.py checks this on a tiny model).

"agree" runs the full model and each pruned version side by side (a pruned version = the full model with the dropped experts
switched off in the router, which smoke.py shows is exactly what the pruned file computes) and compares their next-word
predictions at every position: agreement on the most likely word, and KL divergence, overall and per job/language.
"""
import argparse, json, os, queue, struct, sys, threading, time, urllib.request

import torch
import torch.nn.functional as F

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
PREFIX = "model.language_model."


class Weights:
    """Tensors by name from a local folder or a Hugging Face repo (range requests: only the bytes asked for are fetched)."""

    def __init__(self, model):
        self.local = os.path.isdir(model)
        self.base = model if self.local else f"https://huggingface.co/{model}/resolve/main/"
        self.cfg = json.load(open(os.path.join(model, "config.json"))) if self.local else json.load(urllib.request.urlopen(self.base + "config.json"))
        self.where = {}  # name -> (file, start, end, dtype, shape)
        files = [f for f in os.listdir(model) if f.endswith(".safetensors")] if self.local else \
            sorted(set(json.load(urllib.request.urlopen(self.base + "model.safetensors.index.json"))["weight_map"].values()))
        for f in files:
            raw = self._read(f, 0, 8)
            n = struct.unpack("<Q", raw)[0]
            h = json.loads(self._read(f, 8, n))
            h.pop("__metadata__", None)
            for k, v in h.items():
                a, b = v["data_offsets"]
                self.where[k] = (f, 8 + n + a, 8 + n + b, v["dtype"], v["shape"])

    def _read(self, f, start, length):
        if self.local:
            with open(os.path.join(self.base, f), "rb") as fh:
                fh.seek(start)
                return fh.read(length)
        for i in range(6):
            try:
                req = urllib.request.Request(self.base + f, headers={"Range": f"bytes={start}-{start + length - 1}"})
                with urllib.request.urlopen(req, timeout=120) as r:
                    buf = bytearray(length)
                    view, got = memoryview(buf), 0
                    while got < length:
                        k = r.readinto(view[got:])
                        if not k:
                            raise IOError("short read")
                        got += k
                    return bytes(buf)
            except Exception as e:
                if i == 5:
                    raise
                time.sleep(2 ** i)

    def get(self, name, dtype=torch.float32):
        f, a, b, dt, shape = self.where[name]
        src = {"BF16": torch.bfloat16, "F16": torch.float16, "F32": torch.float32}[dt]
        t = torch.frombuffer(bytearray(self._read(f, a, b - a)), dtype=src).reshape(shape)
        return t.to(dtype)

    def layer(self, i, dtype=torch.float32):
        p = f"{PREFIX}layers.{i}."
        return {k[len(p):]: self.get(k, dtype) for k in self.where if k.startswith(p)}


def text_config(cfg):
    from transformers import Gemma4TextConfig
    tc = Gemma4TextConfig(**cfg.get("text_config", cfg))
    tc._attn_implementation = "sdpa"
    return tc


class Stream:
    """The text model, one layer at a time."""

    def __init__(self, model, dtype=torch.float32):
        from transformers.models.gemma4.modeling_gemma4 import Gemma4TextRotaryEmbedding, Gemma4RMSNorm
        self.W = Weights(model)
        self.tc = text_config(self.W.cfg)
        self.dtype = dtype
        self.embed = self.W.get(PREFIX + "embed_tokens.weight", dtype)
        self.scale = torch.tensor(self.tc.hidden_size ** 0.5, dtype=torch.bfloat16).to(dtype)  # as the model does (bf16)
        self.rotary = Gemma4TextRotaryEmbedding(self.tc)
        self.norm = Gemma4RMSNorm(self.tc.hidden_size, eps=self.tc.rms_norm_eps)
        self.norm.weight.data = self.W.get(PREFIX + "norm.weight", dtype)
        self.n_layers = self.tc.num_hidden_layers

    def start(self, ids):
        """A text's running state: just its words' vectors (masks and positions are rebuilt per layer, to save memory)."""
        return {"x": F.embedding(torch.tensor([ids]), self.embed) * self.scale}

    def _ctx(self, x):
        from transformers.masking_utils import create_causal_mask, create_sliding_window_causal_mask
        pos = torch.arange(x.shape[1]).unsqueeze(0)
        kw = dict(config=self.tc, inputs_embeds=x, attention_mask=None, past_key_values=None, position_ids=pos)
        try:
            masks = {"full_attention": create_causal_mask(**kw), "sliding_attention": create_sliding_window_causal_mask(**kw)}
        except TypeError:
            kw["cache"] = kw.pop("past_key_values")
            masks = {"full_attention": create_causal_mask(**kw), "sliding_attention": create_sliding_window_causal_mask(**kw)}
        return pos, masks

    def make_layer(self, i, tensors):
        from transformers.models.gemma4.modeling_gemma4 import Gemma4TextDecoderLayer
        with torch.device("meta"):
            L = Gemma4TextDecoderLayer(self.tc, i)
        L = L.to_empty(device="cpu").to(self.dtype)
        missing, unexpected = L.load_state_dict(tensors, strict=False, assign=True)
        if missing or unexpected:
            raise SystemExit(f"layer {i}: missing {missing}, unexpected {unexpected}")
        return L.eval()

    def run_layer(self, L, i, st):
        t = self.tc.layer_types[i]
        with torch.no_grad():
            pos, masks = self._ctx(st["x"])
            pe = self.rotary(st["x"], pos, t)
            from transformers.models.gemma4.modeling_gemma4 import KVSharingDict
            st["x"] = L(st["x"], None, shared_kv_states=KVSharingDict(None), position_embeddings=pe, attention_mask=masks[t], position_ids=pos)

    def logits(self, x):
        h = self.norm(x)[0]
        out = (h.to(self.embed.dtype) @ self.embed.T).float()
        cap = self.tc.final_logit_softcapping
        return torch.tanh(out / cap) * cap if cap else out

    def layers(self):
        """(index, layer module), the next one downloading while the current one is used."""
        q = queue.Queue(maxsize=1)

        def fetch():
            for i in range(self.n_layers):
                q.put((i, self.W.layer(i, self.dtype)))
            q.put(None)
        threading.Thread(target=fetch, daemon=True).start()
        while True:
            item = q.get()
            if item is None:
                return
            i, tensors = item
            yield i, self.make_layer(i, tensors)


DTYPES = {"bfloat16": torch.bfloat16, "float32": torch.float32}


def mask_router(L, keep):
    """Switch off every expert not in keep: its router score can never be among the top k (= what the pruned file computes)."""
    drop = torch.ones(L.router.proj.weight.shape[0], dtype=torch.bool)
    drop[keep] = False
    f = L.router.proj.forward
    L.router.proj.forward = lambda h: f(h).masked_fill(drop, float("-inf"))
    return f


def score(a):
    from reap import Recorder
    rows = [json.loads(l) for l in open(a.calib) if l.strip()]
    if a.limit:
        rows = rows[: a.limit]
    S = Stream(a.model, DTYPES[a.dtype])
    groups = sorted({r.get("group", "all") for r in rows})
    states = [S.start(r["ids"][: a.max_len]) for r in rows]
    gi = {g: k for k, g in enumerate(groups)}
    E = S.tc.num_experts
    rec = Recorder(list(range(S.n_layers)), E, groups)
    for r, st in zip(rows, states):
        rec.tokens[gi[r.get("group", "all")]] += st["x"].shape[1]
    total = int(rec.tokens.sum().item())
    print(f"{len(rows)} texts, {total:,} words, {len(groups)} groups; {S.n_layers} layers of {E} experts", flush=True)
    t0 = time.time()
    for i, L in S.layers():
        h = L.experts.register_forward_hook(rec.hook(i))
        for r, st in zip(rows, states):
            rec.group = gi[r.get("group", "all")]
            S.run_layer(L, i, st)
        h.remove()
        el = time.time() - t0
        print(f"  layer {i + 1}/{S.n_layers} done ({el / 60:.1f} min, about {el / (i + 1) * (S.n_layers - i - 1) / 60:.0f} min left)", flush=True)
        torch.save({"layers": list(range(S.n_layers)), "groups": groups, "n_experts": E, "top_k": S.tc.top_k_experts,
                    "count": rec.count, "wnorm": rec.wnorm, "norm": rec.norm, "tokens": rec.tokens, "model": a.model,
                    "done_layers": i + 1}, a.out)
    print(f"saved {a.out}")


def agree(a):
    from prune import choose
    rows = [json.loads(l) for l in open(a.dev) if l.strip()]
    if a.limit:
        rows = rows[: a.limit]
    st_ = torch.load(a.stats, weights_only=False)
    plans = {k: choose(st_, k, a.method, a.protect)[0] for k in a.keep}
    S = Stream(a.model, DTYPES[a.dtype])
    names = ["full"] + [str(k) for k in a.keep]
    states = {n: [S.start(r["ids"][: a.max_len]) for r in rows] for n in names}
    t0 = time.time()
    for i, L in S.layers():
        for n in names:
            orig = mask_router(L, plans[int(n)][i]) if n != "full" else None
            for st in states[n]:
                S.run_layer(L, i, st)
            if orig is not None:
                L.router.proj.forward = orig
        print(f"  layer {i + 1}/{S.n_layers} ({(time.time() - t0) / 60:.1f} min)", flush=True)
    res = {n: {} for n in names[1:]}
    for j, r in enumerate(rows):
        T = states["full"][j]["x"].shape[1]
        for c in range(0, T, 256):
            sl = slice(c, min(T, c + 256))
            p = torch.log_softmax(S.logits(states["full"][j]["x"][:, sl]).float(), -1)
            for n in names[1:]:
                q = torch.log_softmax(S.logits(states[n][j]["x"][:, sl]).float(), -1)
                kl = (p.exp() * (p - q)).sum(-1)
                top = p.argmax(-1)
                ag = q.gather(-1, top[:, None])[:, 0] >= q.max(-1).values - 1e-6
                for g in (r["group"], "ALL"):
                    d = res[n].setdefault(g, [0.0, 0, 0])
                    d[0] += kl.sum().item(); d[1] += ag.sum().item(); d[2] += kl.numel()
    out = {n: {g: {"kl": round(s / m, 5), "agree": round(c / m, 4), "positions": m} for g, (s, c, m) in v.items()} for n, v in res.items()}
    for n in names[1:]:
        o = out[n]["ALL"]
        worst = sorted((v["agree"], g) for g, v in out[n].items() if g != "ALL")[:5]
        print(f"keep {n}: agrees with the full model on {o['agree']:.2%} of next words, KL {o['kl']:.4f}; lowest: " + ", ".join(f"{g} {v:.1%}" for v, g in worst))
    json.dump(out, open(a.out, "w"), indent=1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["score", "agree"])
    ap.add_argument("--model", required=True)
    ap.add_argument("--calib")
    ap.add_argument("--dev")
    ap.add_argument("--stats")
    ap.add_argument("--keep", type=int, nargs="*", default=[64, 56, 48])
    ap.add_argument("--method", default="reap")
    ap.add_argument("--protect", type=int, default=2)
    ap.add_argument("--out", required=True)
    ap.add_argument("--max-len", type=int, default=6144)
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--threads", type=int, default=0)
    ap.add_argument("--dtype", default="bfloat16", choices=list(DTYPES),
                    help="bfloat16 (the model's own precision; half the memory, and fast on CPUs with AMX/AVX-512 BF16) or float32")
    a = ap.parse_args()
    if a.threads:
        torch.set_num_threads(a.threads)
    (score if a.cmd == "score" else agree)(a)


if __name__ == "__main__":
    main()
