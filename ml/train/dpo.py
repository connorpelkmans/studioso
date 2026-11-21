"""Preference training (step 2 of 2, DPO): the student learns which of two answers is better, from pairs where the app's own checks
told them apart (a made-up fact, a vague card, a copied sentence, a broken answer key vs a good answer to the same request).
Run it on the student's OWN mistakes (on-policy) for the biggest effect: see README, Round 2.

    python ml/train/dpo.py --config ml/train/configs/gemma3-1b.yaml

Uses the config's dpo: section. The starting point is the SFT result (merged), with a new LoRA on top.
"""
import argparse, json, os
import yaml


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--max-steps", type=int, default=None)
    a = ap.parse_args()
    C = yaml.safe_load(open(a.config))
    D = C.get("dpo", {})
    import torch
    from datasets import load_dataset
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from trl import DPOConfig, DPOTrainer
    from peft import LoraConfig

    gpu = torch.cuda.is_available()
    dtype = torch.bfloat16 if gpu and torch.cuda.is_bf16_supported() else (torch.float16 if gpu else torch.float32)
    start = D.get("start_from", C["output_dir"] + "-merged")
    kw = {"torch_dtype": dtype}
    if C.get("load_4bit") and gpu:
        from transformers import BitsAndBytesConfig
        kw["quantization_config"] = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_compute_dtype=dtype)
    tok = AutoTokenizer.from_pretrained(start)
    if tok.pad_token is None:
        tok.pad_token = tok.eos_token
    model = AutoModelForCausalLM.from_pretrained(start, **kw)
    data = load_dataset("json", data_files={"train": D.get("train", "ml/data/train/dpo.jsonl")})["train"]
    data = data.remove_columns([c for c in data.column_names if c not in ("prompt", "chosen", "rejected")])
    split = data.train_test_split(test_size=min(200, max(1, len(data) // 20)), seed=3)
    L = C.get("lora") or {}
    peft = LoraConfig(r=L.get("r", 16), lora_alpha=L.get("alpha", 32), lora_dropout=0.05, target_modules=L.get("targets", "all-linear"), task_type="CAUSAL_LM")
    out = D.get("output_dir", C["output_dir"] + "-dpo")
    cfg = DPOConfig(output_dir=out, beta=D.get("beta", 0.1), num_train_epochs=D.get("epochs", 1), max_steps=a.max_steps or D.get("max_steps", -1),
                    per_device_train_batch_size=D.get("batch", 2), gradient_accumulation_steps=D.get("grad_accum", 8), learning_rate=float(D.get("lr", 5e-6)),
                    max_length=D.get("max_length", 5400), logging_steps=10, eval_strategy="steps", eval_steps=100, save_steps=200, save_total_limit=2,
                    bf16=dtype == torch.bfloat16, fp16=dtype == torch.float16, gradient_checkpointing=gpu, report_to="none", use_cpu=not gpu)
    trainer = DPOTrainer(model=model, args=cfg, train_dataset=split["train"], eval_dataset=split["test"], processing_class=tok, peft_config=peft)
    trainer.train()
    trainer.save_model(out)
    tok.save_pretrained(out)
    m = trainer.evaluate()
    json.dump({"eval": m}, open(os.path.join(out, "dpo-result.json"), "w"), indent=1)
    print("saved", out, json.dumps(m))


if __name__ == "__main__":
    main()
