"""Checks the pruning pipeline on a tiny random Gemma 4 MoE on the CPU (seconds, no GPU, no download of the real weights).

    python ml/prune/smoke.py

It builds a tiny model from the real Gemma 4 26B config (same layout and tensor names, shrunk), then checks:
  1. reap.py counts every routed word: per layer, count sums to words x top_k
  2. prune.py keeping every expert writes a model with exactly the same outputs
  3. a pruned model gives exactly the outputs of the full model with the dropped experts switched off in its router
     (so pruning removes those experts and changes nothing else)
  4. the plan protects each group's top experts, and coverage is reported
  5. kl.py: a model compared with itself agrees 100% with zero KL; a pruned one scores below that
"""
import json, os, shutil, subprocess, sys, tempfile

import torch

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)


def tiny(dirname):
    from transformers import Gemma4Config, Gemma4ForConditionalGeneration
    text = dict(model_type="gemma4_text", hidden_size=64, intermediate_size=96, moe_intermediate_size=32, num_experts=16,
                top_k_experts=4, enable_moe_block=True, num_hidden_layers=4, num_attention_heads=4, num_key_value_heads=2,
                num_global_key_value_heads=1, head_dim=16, global_head_dim=32, attention_k_eq_v=True, vocab_size=512,
                vocab_size_per_layer_input=512, hidden_size_per_layer_input=0, sliding_window=8, max_position_embeddings=512,
                layer_types=["sliding_attention", "sliding_attention", "sliding_attention", "full_attention"],
                rope_parameters={"full_attention": {"partial_rotary_factor": 0.25, "rope_theta": 1e6, "rope_type": "proportional"},
                                 "sliding_attention": {"rope_theta": 1e4, "rope_type": "default"}},
                final_logit_softcapping=30.0, tie_word_embeddings=True, hidden_activation="gelu_pytorch_tanh",
                pad_token_id=0, bos_token_id=2, eos_token_id=1, num_kv_shared_layers=0, use_double_wide_mlp=False)
    vision = dict(model_type="gemma4_vision", hidden_size=32, intermediate_size=48, num_attention_heads=2, num_key_value_heads=2,
                  head_dim=16, global_head_dim=16, num_hidden_layers=1, patch_size=4, pooling_kernel_size=2, position_embedding_size=64)
    torch.manual_seed(0)
    cfg = Gemma4Config(text_config=text, vision_config=vision, audio_config=None)
    m = Gemma4ForConditionalGeneration(cfg).eval()
    with torch.no_grad():  # random routers, so experts get very different use (as in a trained model)
        for name, p in m.named_parameters():
            if name.endswith("router.proj.weight"):
                p.normal_(0, 0.5)
            if name.endswith("router.per_expert_scale"):
                p.uniform_(0.5, 1.5)
    m.save_pretrained(dirname)
    return m


def logits(model_dir, ids, mask=None):
    from reap import load_model
    m = load_model(model_dir, "cpu", torch.float32).eval()
    if mask is not None:  # switch experts off in the router: their scores can never be in the top k
        for layer, keep in mask.items():
            router = m.model.language_model.layers[layer].router
            drop = torch.ones(router.proj.weight.shape[0], dtype=torch.bool)
            drop[keep] = False
            with torch.no_grad():
                router.proj.weight[drop] = 0
            orig = router.proj.forward
            router.proj.forward = (lambda f, d: (lambda x: f(x).masked_fill(d, float("-inf"))))(orig, drop)
    with torch.no_grad():
        return m(input_ids=torch.tensor([ids]), use_cache=False).logits[0]


def run(*a):
    r = subprocess.run([sys.executable, *a], capture_output=True, text=True)
    if r.returncode:
        print(r.stdout, r.stderr)
        raise SystemExit(f"failed: {a}")
    return r.stdout


def main():
    w = tempfile.mkdtemp(prefix="prune-smoke-")
    try:
        full = os.path.join(w, "full")
        tiny(full)
        names = json.load(open(os.path.join(full, "model.safetensors.index.json")))["weight_map"] if os.path.exists(os.path.join(full, "model.safetensors.index.json")) else None
        from safetensors import safe_open
        keys = list(safe_open(os.path.join(full, "model.safetensors"), "pt").keys()) if names is None else list(names)
        need = ["model.language_model.layers.0.experts.gate_up_proj", "model.language_model.layers.0.experts.down_proj",
                "model.language_model.layers.0.router.proj.weight", "model.language_model.layers.0.router.per_expert_scale"]
        assert all(k in keys for k in need), "tensor names differ from the real checkpoint's"
        g = torch.Generator().manual_seed(1)
        rows = [{"ids": torch.randint(3, 500, (n,), generator=g).tolist(), "group": grp} for n, grp in
                [(40, "cards"), (33, "cards"), (50, "quiz"), (27, "syllabus"), (45, "lang:es"), (38, "lang:es")]]
        calib = os.path.join(w, "calib.jsonl")
        open(calib, "w").write("".join(json.dumps(r) + "\n" for r in rows))
        stats_f = os.path.join(w, "stats.pt")
        run(os.path.join(HERE, "reap.py"), "--model", full, "--calib", calib, "--out", stats_f, "--device-map", "cpu", "--dtype", "float32")
        st = torch.load(stats_f, weights_only=False)
        words = sum(len(r["ids"]) for r in rows)
        for l in range(st["count"].shape[0]):
            assert st["count"][l].sum().item() == words * 4, "1. not every routed word was counted"
        print("1. ok: reap.py counted all", words, "words x top 4 in each of", st["count"].shape[0], "layers")

        same = os.path.join(w, "keep16")
        run(os.path.join(HERE, "prune.py"), "--src", full, "--stats", stats_f, "--keep", "16", "--out", same)
        ids = rows[0]["ids"]
        a, b = logits(full, ids), logits(same, ids)
        assert torch.equal(a, b), "2. keeping every expert changed the outputs"
        print("2. ok: keeping all 16 experts gives identical outputs")

        small = os.path.join(w, "keep8")
        out = run(os.path.join(HERE, "prune.py"), "--src", full, "--stats", stats_f, "--keep", "8", "--out", small)
        info = json.load(open(os.path.join(small, "prune_info.json")))
        cfg = json.load(open(os.path.join(small, "config.json")))
        assert cfg["text_config"]["num_experts"] == 8 and all(len(k) == 8 for k in info["kept"])
        masked = logits(full, ids, mask=dict(zip(info["layers"], info["kept"])))
        pruned = logits(small, ids)
        assert torch.allclose(masked, pruned, atol=1e-5), f"3. pruned differs from masked full model by {(masked - pruned).abs().max()}"
        diff = (a - pruned).abs().max().item()
        print(f"3. ok: the 8-expert model equals the full model with the other 8 switched off (and differs from the full one by {diff:.3f})")

        from prune import choose, scores
        s = scores(st)
        for l in range(s.shape[0]):
            for gi in range(s.shape[1]):
                top = torch.argsort(s[l, gi], descending=True)[:2].tolist()
                assert all(e in info["kept"][l] for e in top if s[l, gi, e] > 0), "4. a group's top expert was dropped"
        print("4. ok: every group's top 2 experts stay;", out.strip().splitlines()[0])

        ref = os.path.join(w, "ref.pt")
        run(os.path.join(HERE, "kl.py"), "--model", full, "--dev", calib, "--save-ref", ref, "--device-map", "cpu")
        o1 = os.path.join(w, "kl_same.json"); o2 = os.path.join(w, "kl_small.json")
        run(os.path.join(HERE, "kl.py"), "--model", same, "--dev", calib, "--ref", ref, "--out", o1, "--device-map", "cpu")
        run(os.path.join(HERE, "kl.py"), "--model", small, "--dev", calib, "--ref", ref, "--out", o2, "--device-map", "cpu")
        k1, k2 = json.load(open(o1))["ALL"], json.load(open(o2))["ALL"]
        assert k1["agree"] == 1.0 and k1["kl"] < 1e-3, k1
        assert k2["kl"] > k1["kl"], (k1, k2)
        print(f"5. ok: kl.py: identical model agrees {k1['agree']:.0%} (KL {k1['kl']:.4f}); 8-expert model agrees {k2['agree']:.0%} (KL {k2['kl']:.4f})")

        run(os.path.join(HERE, "sizes.py"), "--model", small, "--keep", "8", "4")
        print("6. ok: sizes.py reads a local pruned model")

        # 7. the layer-at-a-time path (stream.py) computes what the normal forward pass computes
        from stream import Stream
        S = Stream(full)
        st_ = S.start(ids)
        for i, L in S.layers():
            S.run_layer(L, i, st_)
        streamed = S.logits(st_["x"])
        assert torch.allclose(streamed, a, atol=1e-4), f"7. streamed logits differ by {(streamed - a).abs().max()}"
        sstats = os.path.join(w, "sstats.pt")
        run(os.path.join(HERE, "stream.py"), "score", "--model", full, "--calib", calib, "--out", sstats)
        s2 = torch.load(sstats, weights_only=False)
        assert torch.equal(s2["count"], st["count"]), "7. streamed expert counts differ from reap.py's"
        assert torch.allclose(s2["wnorm"], st["wnorm"], rtol=1e-4), "7. streamed REAP sums differ from reap.py's"
        print("7. ok: stream.py gives the same logits and the same expert scores as the normal forward pass")

        ag = os.path.join(w, "agree.json")
        run(os.path.join(HERE, "stream.py"), "agree", "--model", full, "--dev", calib, "--stats", sstats, "--keep", "16", "8", "--out", ag)
        r = json.load(open(ag))
        assert r["16"]["ALL"]["agree"] == 1.0 and r["16"]["ALL"]["kl"] < 1e-6, r["16"]["ALL"]
        assert abs(r["8"]["ALL"]["agree"] - k2["agree"]) < 0.02, (r["8"]["ALL"], k2)
        print(f"8. ok: stream.py agree: all experts {r['16']['ALL']['agree']:.0%}; 8 experts {r['8']['ALL']['agree']:.0%} (kl.py on the pruned file: {k2['agree']:.0%})")
        print("all smoke checks passed")
    finally:
        shutil.rmtree(w, ignore_errors=True)


if __name__ == "__main__":
    main()
