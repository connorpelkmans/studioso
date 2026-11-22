"""The full model answers the calibration requests, on this computer, with llama.cpp (no GPU, no API, no cost).

    python ml/prune/gen_answers.py --model gemma-4-26B_q4_0-it.gguf --requests ml/prune/work/requests.jsonl \
        --out ml/prune/work/answers.jsonl --max-tokens 450

Google's QAT 4-bit file of the full Gemma 4 26B, memory-mapped so it runs in about 15 GB without copying the weights. Answers
follow the app's JSON schema where the job has one. For calibration an answer doesn't need to be complete (it's the words,
in the job's style and language, that show which experts get used), so long answers are cut at --max-tokens. Writes
sft.jsonl-style records ({prompt, completion, job, lang}) that calib.py reads; resumes where it stopped.
"""
import argparse, json, os, sys, time


def loose(s):
    """The app's Gemini-style schema (type: "OBJECT") as JSON Schema."""
    if isinstance(s, list):
        return [loose(x) for x in s]
    if not isinstance(s, dict):
        return s
    out = {}
    for k, v in s.items():
        if k == "type" and isinstance(v, str):
            out[k] = v.lower()
        elif k in ("propertyOrdering", "nullable"):
            continue
        else:
            out[k] = loose(v)
    return out


def load(model, ctx, threads):
    import llama_cpp.llama as LL
    from llama_cpp import Llama
    orig = LL.llama_cpp.llama_model_default_params

    def params():  # keep the weights memory-mapped (no CPU repacking copy)
        p = orig()
        p.use_extra_bufts = False
        return p
    LL.llama_cpp.llama_model_default_params = params
    return Llama(model, n_ctx=ctx, n_threads=threads, n_batch=512, verbose=False, use_mmap=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--requests", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--max-tokens", type=int, default=450)
    ap.add_argument("--ctx", type=int, default=8192)
    ap.add_argument("--threads", type=int, default=os.cpu_count())
    ap.add_argument("--temperature", type=float, default=0.3)
    ap.add_argument("--grammar", action="store_true", help="force the job's JSON schema while generating (slow on a CPU)")
    a = ap.parse_args()
    reqs = [json.loads(l) for l in open(a.requests) if l.strip()]
    done = set()
    if os.path.exists(a.out):
        done = {json.loads(l)["id"] for l in open(a.out) if l.strip()}
    todo = [r for r in reqs if r["id"] not in done]
    print(f"{len(todo)} to answer ({len(done)} done already)", flush=True)
    m = load(a.model, a.ctx, a.threads)
    t0, toks = time.time(), 0
    for i, r in enumerate(todo):
        msgs = [{"role": "system", "content": r["system"]}, {"role": "user", "content": r["user"]}]
        n_prompt = len(m.tokenize((r["system"] + "\n" + r["user"]).encode(), add_bos=False)) + 16
        if n_prompt + 64 > a.ctx:
            print(f"  skipped {r['id']}: request too long ({n_prompt} tokens)", flush=True)
            continue
        kw = {}
        if r.get("schema") and a.grammar:  # forcing the schema is slow on a CPU (262k-word vocabulary); the app's prompts ask for JSON anyway
            kw["response_format"] = {"type": "json_object", "schema": loose(r["schema"])}
        try:
            out = m.create_chat_completion(msgs, max_tokens=min(a.max_tokens, a.ctx - n_prompt - 32), temperature=a.temperature, **kw)
        except Exception as e:  # a schema the grammar can't take: answer without it
            print(f"  {r['id']}: {str(e)[:120]}; retrying without the schema", flush=True)
            out = m.create_chat_completion(msgs, max_tokens=min(a.max_tokens, a.ctx - n_prompt - 32), temperature=a.temperature)
        text = out["choices"][0]["message"]["content"] or ""
        toks += out["usage"]["completion_tokens"]
        with open(a.out, "a") as f:
            f.write(json.dumps({"id": r["id"], "job": r["job"], "lang": r["lang"], "prompt": msgs,
                                "completion": [{"role": "assistant", "content": text}], "finish": out["choices"][0]["finish_reason"],
                                "usage": out["usage"]}, ensure_ascii=False) + "\n")
        el = time.time() - t0
        print(f"  {i + 1}/{len(todo)} {r['id']}: {out['usage']['prompt_tokens']}+{out['usage']['completion_tokens']} tokens; "
              f"{el / 60:.0f} min, about {el / (i + 1) * (len(todo) - i - 1) / 60:.0f} min left", flush=True)


if __name__ == "__main__":
    main()
