"""Fold a LoRA into its base model, giving plain weights that WebLLM's converter (and llama.cpp, vLLM) can read.

    python ml/export/merge.py --adapter ml/out/gemma3-1b-sft --out ml/out/gemma3-1b-sft-merged
"""
import argparse


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--adapter", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    import torch
    from peft import AutoPeftModelForCausalLM
    from transformers import AutoTokenizer
    m = AutoPeftModelForCausalLM.from_pretrained(a.adapter, torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32)
    m = m.merge_and_unload()
    m.save_pretrained(a.out, safe_serialization=True)
    AutoTokenizer.from_pretrained(a.adapter).save_pretrained(a.out)
    print("merged ->", a.out)


if __name__ == "__main__":
    main()
