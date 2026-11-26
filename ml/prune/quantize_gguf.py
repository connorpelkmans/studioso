"""Re-compress a (pruned) GGUF to fewer bits with llama.cpp's own quantizer (through llama-cpp-python; no build, no GPU).

    python ml/prune/quantize_gguf.py --src studyboard-26b-k96.gguf --type Q3_K_S --embed Q4_0 --out studyboard-26b-k96-q3ks.gguf

Pruning alone can't get Gemma 4 26B to about 9 GB without losing languages (its experts aren't specialized: every job and
language uses all of them about evenly). Keeping more experts at fewer bits is the other half of the trade: llama.cpp's
mix for a type keeps the sensitive tensors (attention values and keys of a many-expert model) at more bits, and the
vocabulary table (--embed) can be kept as is. --dry-run prints the size without writing.
"""
import argparse, os


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--type", default="Q3_K_S", help="a llama.cpp file type: Q3_K_S, Q3_K_M, IQ3_S, Q2_K, ...")
    ap.add_argument("--embed", default="Q4_0", help="type for the vocabulary table (also the output layer: tied)")
    ap.add_argument("--threads", type=int, default=os.cpu_count())
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    import llama_cpp as L
    p = L.llama_model_quantize_default_params()
    p.ftype = getattr(L, "LLAMA_FTYPE_MOSTLY_" + a.type)
    p.nthread = a.threads
    p.allow_requantize = True  # the source is Google's 4-bit file: its values are the ones the model was trained to work with
    if a.embed:
        p.token_embedding_type = int(getattr(L, "GGML_TYPE_" + a.embed))
    p.dry_run = a.dry_run
    rc = L.llama_model_quantize(a.src.encode(), a.out.encode(), L.byref(p))
    if rc != 0:
        raise SystemExit(f"llama.cpp's quantizer failed ({rc})")
    if not a.dry_run:
        print(f"wrote {a.out}: {os.path.getsize(a.out) / 1e9:.2f} GB ({a.type}, vocabulary {a.embed})")


if __name__ == "__main__":
    main()
