"""Is model A better than model B at Studyboard's jobs? Held-out requests, automatic checks, and a blind judge.

    python ml/prune/eval_compare.py --requests ml/prune/work/eval_requests.jsonl \
        --a ml/prune/work/eval/k56.jsonl --a-name "Studyboard 26B (56 experts)" \
        --b ml/prune/work/eval/e4b.jsonl --b-name "Gemma 4 E4B" \
        --judge-model gemma-4-26B_q4_0-it.gguf --out ml/prune/work/eval/k56-vs-e4b

The answers come from gen_answers.py (the same requests, the same settings, for each model). For every request:
  automatic   valid JSON in the app's schema; the number of cards/questions asked for; written in the material's language
              (students' notes in Spanish get Spanish cards); key terms of the material covered (the app's own finder)
  judge       the full Gemma 4 26B sees the material and both answers, unlabeled, twice with the order swapped (a verdict
              that flips with the order is a tie), with the rules of ml/eval/compare.js: correct facts from the material,
              coverage of its important ideas, specific questions, short clear answers; made-up facts are serious faults
Writes report.md and details.json; prints wins/ties/losses per job and language.
"""
import argparse, collections, json, os, re, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
HERE = os.path.dirname(os.path.abspath(__file__))
JUDGE_SYS = re.search(r'const JUDGE_SYS = "(.*?)";\n', open(os.path.join(HERE, "..", "eval", "compare.js")).read()).group(1).replace('\\"', '"')
SCRIPT = {"zh": r"[\u4e00-\u9fff]", "hi": r"[\u0900-\u097f]", "ar": r"[\u0600-\u06ff]"}
STOP = {"en": ["the", "and", "of", "is", "to", "in", "that"], "es": ["el", "la", "de", "que", "los", "las", "y", "es"],
        "fr": ["le", "la", "les", "des", "et", "est", "du", "une"], "de": ["der", "die", "und", "das", "ist", "nicht", "von", "ein"],
        "pt": ["o", "a", "de", "que", "os", "do", "da", "não", "é"]}
COUNT = re.compile(r"exactly (\d+)|at most (\d+)")


def strip_fence(t):
    t = t.strip()
    m = re.match(r"^```(?:json)?\s*(.*?)\s*```$", t, re.S)
    return m.group(1) if m else t


def texts(o):
    if isinstance(o, dict):
        return " ".join(texts(v) for v in o.values())
    if isinstance(o, list):
        return " ".join(texts(v) for v in o)
    return str(o) if isinstance(o, str) else ""


def items(o):
    """The cards or questions in an answer (the longest list of objects in it)."""
    best = []
    def walk(x):
        nonlocal best
        if isinstance(x, list):
            if x and all(isinstance(i, dict) for i in x) and len(x) > len(best):
                best = x
            for i in x:
                walk(i)
        elif isinstance(x, dict):
            for v in x.values():
                walk(v)
    walk(o)
    return best


def language_ok(text, lang):
    """Is the answer written in the material's language? (script share for zh/hi/ar; common words otherwise)"""
    if not text.strip():
        return False
    if lang in SCRIPT:
        letters = re.findall(r"\w", text)
        return len(re.findall(SCRIPT[lang], text)) / max(1, len(letters)) > 0.3
    words = re.findall(r"[a-zà-ÿßœ]+", text.lower())
    hit = lambda L: sum(w in STOP[L] for w in words)
    if lang == "en":
        return hit("en") >= max(hit(x) for x in ("es", "fr", "de", "pt"))
    return hit(lang) > hit("en")


def auto(req, ans, terms):
    raw = strip_fence(ans.get("completion", [{}])[0].get("content", "") if ans else "")
    out = {"json": False, "count_ok": None, "lang_ok": False, "terms": None, "finish": (ans or {}).get("finish")}
    try:
        obj = json.loads(raw)
        out["json"] = True
    except Exception:
        obj = None
    body = texts(obj) if obj is not None else raw
    out["lang_ok"] = language_ok(body, req["lang"])
    m = COUNT.search(req["user"].split("\n")[-1] + " " + req["user"][:400])
    if obj is not None and m and req["job"] in ("cards", "quiz", "notes-cards"):
        n = int(m.group(1) or m.group(2))
        k = len(items(obj))
        out["count_ok"] = (k == n) if m.group(1) else (0 < k <= n)
    if terms:
        low = body.lower()
        out["terms"] = sum(t.lower() in low for t in terms) / len(terms)
    return out, body


def material(req):
    u = req["user"]
    m = re.search(r"<notes>\n(.*)\n</notes>", u, re.S)
    return m.group(1) if m else u


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--requests", required=True)
    ap.add_argument("--a", required=True); ap.add_argument("--a-name", default="A")
    ap.add_argument("--b", required=True); ap.add_argument("--b-name", default="B")
    ap.add_argument("--judge-model", help="a GGUF to judge with (the full model); omit for automatic checks only")
    ap.add_argument("--out", required=True)
    ap.add_argument("--threads", type=int, default=os.cpu_count())
    a = ap.parse_args()
    reqs = [json.loads(l) for l in open(a.requests) if l.strip()]
    A = {r["id"]: r for r in map(json.loads, filter(str.strip, open(a.a)))}
    B = {r["id"]: r for r in map(json.loads, filter(str.strip, open(a.b)))}
    reqs = [r for r in reqs if r["id"] in A and r["id"] in B]
    os.makedirs(a.out, exist_ok=True)
    kt = subprocess.run(["node", os.path.join(HERE, "keyterms.js")], input="\n".join(json.dumps({"id": r["id"], "text": material(r)}) for r in reqs),
                        capture_output=True, text=True, check=True).stdout
    terms = {x["id"]: x["terms"] for x in map(json.loads, filter(str.strip, kt.split("\n")))}
    for r in reqs:  # the app's finder looks for slide-style terms; for prose, the material's most frequent long words
        if len(terms.get(r["id"]) or []) < 5:
            words = [w for w in re.findall(r"\w{7,}", material(r).lower()) if not w.isdigit()]
            terms[r["id"]] = [w for w, _ in collections.Counter(words).most_common(15)] or None
    rows = []
    for r in reqs:
        ra, ta = auto(r, A[r["id"]], terms.get(r["id"]))
        rb, tb = auto(r, B[r["id"]], terms.get(r["id"]))
        rows.append({"id": r["id"], "job": r["job"], "lang": r["lang"], "a": ra, "b": rb, "a_text": ta, "b_text": tb})
    judge_path = os.path.join(a.out, "judged.jsonl")
    judged = {}
    if os.path.exists(judge_path):
        judged = {x["id"]: x for x in map(json.loads, filter(str.strip, open(judge_path)))}
    if a.judge_model:
        from gen_answers import load
        J = load(a.judge_model, 8192, a.threads)
        schema = {"type": "object", "properties": {"better": {"type": "string", "enum": ["A", "B", "tie"]}, "made_up_A": {"type": "integer"},
                                                   "made_up_B": {"type": "integer"}, "why": {"type": "string"}}, "required": ["better", "made_up_A", "made_up_B", "why"]}

        def ask(mat, x, y):
            msg = f"MATERIAL:\n<<<\n{mat[:9000]}\n>>>\n\nOUTPUT A:\n<<<\n{x[:6000]}\n>>>\n\nOUTPUT B:\n<<<\n{y[:6000]}\n>>>"
            out = J.create_chat_completion([{"role": "system", "content": JUDGE_SYS}, {"role": "user", "content": msg}], temperature=0, max_tokens=300,
                                           response_format={"type": "json_object", "schema": schema})
            try:
                return json.loads(strip_fence(out["choices"][0]["message"]["content"]))
            except Exception:
                return {"better": "tie", "made_up_A": 0, "made_up_B": 0, "why": "unreadable verdict"}
        for i, x in enumerate(rows):
            if x["id"] in judged:
                continue
            req = next(r for r in reqs if r["id"] == x["id"])
            mat, ta, tb = material(req), A[x["id"]]["completion"][0]["content"], B[x["id"]]["completion"][0]["content"]
            p, q = ask(mat, ta, tb), ask(mat, tb, ta)
            v2 = {"A": "B", "B": "A"}.get(q.get("better"), "tie")
            v = p.get("better") if p.get("better") == v2 else "tie"
            j = {"id": x["id"], "verdict": v, "made_a": (p.get("made_up_A", 0) + q.get("made_up_B", 0)) / 2,
                 "made_b": (p.get("made_up_B", 0) + q.get("made_up_A", 0)) / 2, "why": p.get("why"), "why2": q.get("why")}
            judged[x["id"]] = j
            with open(judge_path, "a") as f:
                f.write(json.dumps(j, ensure_ascii=False) + "\n")
            print(f"  judged {i + 1}/{len(rows)} {x['id']}: {j['verdict']}", flush=True)

    def summarize(sel):
        n = len(sel)
        s = {"n": n}
        for side in ("a", "b"):
            s[side] = {"json": sum(x[side]["json"] for x in sel) / n, "lang": sum(x[side]["lang_ok"] for x in sel) / n}
            c = [x[side]["count_ok"] for x in sel if x[side]["count_ok"] is not None]
            t = [x[side]["terms"] for x in sel if x[side]["terms"] is not None]
            s[side]["count"] = sum(c) / len(c) if c else None
            s[side]["terms"] = sum(t) / len(t) if t else None
        js = [judged[x["id"]] for x in sel if x["id"] in judged]
        if js:
            s["wins"] = sum(j["verdict"] == "A" for j in js); s["ties"] = sum(j["verdict"] == "tie" for j in js); s["losses"] = sum(j["verdict"] == "B" for j in js)
            s["made_a"] = sum(j["made_a"] for j in js) / len(js); s["made_b"] = sum(j["made_b"] for j in js) / len(js)
        return s

    groups = {"ALL": rows}
    for x in rows:
        groups.setdefault("job:" + x["job"], []).append(x)
        groups.setdefault("lang:" + x["lang"], []).append(x)
    summ = {g: summarize(v) for g, v in groups.items()}
    pct = lambda v: "-" if v is None else f"{v:.0%}"
    lines = [f"# {a.a_name} (A) vs {a.b_name} (B) on Studyboard jobs", "",
             f"{len(rows)} held-out requests (material never used to choose experts). Judge: the full Gemma 4 26B, blind, both orders.", "",
             "| group | n | A wins | ties | B wins | made-up facts A / B | valid JSON A / B | right count A / B | material's language A / B | key terms A / B |",
             "|---|---|---|---|---|---|---|---|---|---|"]
    for g in ["ALL"] + sorted(k for k in summ if k != "ALL"):
        s = summ[g]
        j = f"{s['wins']} | {s['ties']} | {s['losses']} | {s['made_a']:.2f} / {s['made_b']:.2f}" if "wins" in s else "- | - | - | -"
        lines.append(f"| {g} | {s['n']} | {j} | {pct(s['a']['json'])} / {pct(s['b']['json'])} | {pct(s['a']['count'])} / {pct(s['b']['count'])} | "
                     f"{pct(s['a']['lang'])} / {pct(s['b']['lang'])} | {pct(s['a']['terms'])} / {pct(s['b']['terms'])} |")
    open(os.path.join(a.out, "report.md"), "w").write("\n".join(lines) + "\n")
    json.dump({"summary": summ, "rows": [{k: v for k, v in x.items() if not k.endswith("_text")} for x in rows], "judged": judged},
              open(os.path.join(a.out, "details.json"), "w"), indent=1, ensure_ascii=False)
    print("\n".join(lines))


if __name__ == "__main__":
    main()
