"""Supervised fine-tuning (step 1 of 2): the student learns the teacher's best answers to the app's real requests.

    python ml/train/sft.py --config ml/train/configs/gemma3-1b.yaml
    python ml/train/sft.py --config ml/train/configs/smoke.yaml        (a tiny model on the CPU, to check the pipeline)

The config names the base model, LoRA or full fine-tuning, 4-bit loading (QLoRA, for 8-16 GB graphics cards), batch sizes and
where the data and output go. Loss is on the answer only (prompt-completion data), so the model learns to answer, not to
repeat the app's instructions. The chat template is the model's own, the same one WebLLM uses on the student's computer.
"""
import argparse, json, os, sys
import yaml


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--max-steps", type=int, default=None, help="override, e.g. for a quick check")
    a = ap.parse_args()
    C = yaml.safe_load(open(a.config))
    import torch
    from datasets import load_dataset
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from trl import SFTConfig, SFTTrainer
    from peft import LoraConfig

    gpu = torch.cuda.is_available()
    mps = getattr(torch.backends, "mps", None) and torch.backends.mps.is_available()
    dtype = torch.bfloat16 if gpu and torch.cuda.is_bf16_supported() else (torch.float16 if gpu else torch.float32)
    kw = {"torch_dtype": dtype}
    if C.get("load_4bit") and gpu:
        from transformers import BitsAndBytesConfig
        kw["quantization_config"] = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_compute_dtype=dtype, bnb_4bit_use_double_quant=True)
    if C.get("attn_implementation"):
        kw["attn_implementation"] = C["attn_implementation"]
    tok = AutoTokenizer.from_pretrained(C["base_model"])
    if tok.pad_token is None:
        tok.pad_token = tok.eos_token
    model = AutoModelForCausalLM.from_pretrained(C["base_model"], **kw)
    data = load_dataset("json", data_files={"train": C["data"]["train"], "eval": C["data"]["eval"]})
    data = data.remove_columns([c for c in data["train"].column_names if c not in ("prompt", "completion")])
    peft = None
    if C.get("lora"):
        L = C["lora"]
        peft = LoraConfig(r=L.get("r", 16), lora_alpha=L.get("alpha", 32), lora_dropout=L.get("dropout", 0.05), target_modules=L.get("targets", "all-linear"), task_type="CAUSAL_LM")
    T = C.get("train", {})
    cfg = SFTConfig(
        output_dir=C["output_dir"], num_train_epochs=T.get("epochs", 2), max_steps=a.max_steps or T.get("max_steps", -1),
        per_device_train_batch_size=T.get("batch", 4), per_device_eval_batch_size=T.get("batch", 4), gradient_accumulation_steps=T.get("grad_accum", 4),
        learning_rate=float(T.get("lr", 2e-4)), lr_scheduler_type="cosine", warmup_steps=T.get("warmup_steps", 20), weight_decay=0.0,
        max_length=T.get("max_length", 5400), packing=False, completion_only_loss=True,
        logging_steps=T.get("log_every", 10), eval_strategy="steps", eval_steps=T.get("eval_every", 200), save_steps=T.get("save_every", 400), save_total_limit=3,
        bf16=dtype == torch.bfloat16, fp16=dtype == torch.float16, gradient_checkpointing=T.get("grad_ckpt", gpu),
        report_to=T.get("report_to", "none"), seed=T.get("seed", 17), use_cpu=not gpu and not mps)
    trainer = SFTTrainer(model=model, args=cfg, train_dataset=data["train"], eval_dataset=data["eval"], processing_class=tok, peft_config=peft)
    trainer.train()
    trainer.save_model(C["output_dir"])
    tok.save_pretrained(C["output_dir"])
    m = trainer.evaluate()
    json.dump({"eval": m, "config": C}, open(os.path.join(C["output_dir"], "sft-result.json"), "w"), indent=1)
    print("saved", C["output_dir"], json.dumps(m))


if __name__ == "__main__":
    main()
