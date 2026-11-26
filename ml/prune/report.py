"""One table for choosing the model to ship (last step of ml/prune/README.md).

    python ml/prune/report.py --work ml/prune/work --out ml/prune/work/REPORT.md

For each pruned model: experts kept, how much of each job's routing it keeps, word-by-word agreement with the full model
(kl.py), and the job-by-job verdicts against the full model (compare.js). For each packaged file (GGUF): its real size, the
memory in use on a laptop, and its own job verdicts. The pick: the most capable file that FITS a 16 GB laptop and is at
PARITY with the full model on every A-tier job (the ones students use most; ml/tasks/CATALOG.md).
"""
import argparse, glob, json, os, re


def verdicts(path):
    try:
        return json.load(open(path))["verdicts"]
    except Exception:
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--work", default="ml/prune/work")
    ap.add_argument("--reports", default="ml/eval/reports")
    ap.add_argument("--catalog", default="ml/tasks/catalog.json")
    ap.add_argument("--kv-gb", type=float, default=0.38, help="attention cache at 16k words (sizes.py)")
    ap.add_argument("--overhead-gb", type=float, default=0.8)
    ap.add_argument("--out")
    a = ap.parse_args()
    tier = {j["id"]: j["tier"] for j in json.load(open(a.catalog))}
    lines = ["# Studyboard 26B for 16 GB laptops: results", ""]

    def job_cell(prefix):
        vs = {}
        for kind in ("studyset", "replay"):
            v = verdicts(os.path.join(a.reports, f"{prefix}-{kind}", "details.json"))
            if v:
                vs.update(v)
        if not vs:
            return "not evaluated", None
        a_jobs = [j for j in vs if tier.get(j) == "A"]
        a_ok = sum(vs[j] == "PARITY" for j in a_jobs)
        all_ok = sum(v == "PARITY" for v in vs.values())
        missing = sorted(j for j in a_jobs if vs[j] != "PARITY")
        return f"A-tier {a_ok}/{len(a_jobs)}, all {all_ok}/{len(vs)}" + (f" (not yet: {', '.join(missing[:6])})" if missing else ""), (not missing and bool(a_jobs))

    lines += ["## Pruned models (bf16, before packaging)", "", "| experts kept | routing kept (lowest group) | agrees with full | KL | jobs at parity with full |", "|---|---|---|---|---|"]
    for d in sorted(glob.glob(os.path.join(a.work, "pruned-*")), key=lambda p: -int(re.findall(r"\d+", os.path.basename(p))[0])):
        k = int(re.findall(r"\d+", os.path.basename(d))[0])
        info = json.load(open(os.path.join(d, "prune_info.json")))
        cov = {g: v for g, v in info["coverage"].items() if v is not None}
        low = min(cov.items(), key=lambda x: x[1]) if cov else ("-", 0)
        kl = {}
        try:
            kl = json.load(open(os.path.join(a.work, f"kl-{k}.json")))["ALL"]
        except Exception:
            pass
        cell, _ = job_cell(f"prune-{k}")
        lines.append(f"| {k}/{info['of']} | {min(cov.values()) if cov else 0:.1%} ({low[0]}) | {kl.get('agree', float('nan')):.2%} | {kl.get('kl', float('nan')):.4f} | {cell} |")

    lines += ["", "## Packaged files (what a laptop downloads)", "", "| file | size | in use (16k words) | 16 GB laptop | jobs at parity with full |", "|---|---|---|---|---|"]
    picks = []
    for f in sorted(glob.glob(os.path.join(a.work, "gguf", "*.gguf"))):
        name = os.path.basename(f)
        if "bf16" in name or "mmproj" in name:
            continue
        gb = os.path.getsize(f) / 1e9
        use = gb + a.kv_gb + a.overhead_gb
        fit = "FITS" if use <= 9.0 else "TIGHT" if use <= 10.0 else "no"
        cell, ok = job_cell("gguf-" + name[:-5])
        lines.append(f"| {name} | {gb:.2f} GB | {use:.1f} GB | {fit} | {cell} |")
        if fit == "FITS" and ok:
            picks.append((gb, name))
    lines += [""]
    if picks:
        best = max(picks)  # the biggest file that fits and is at parity is the most capable one
        lines.append(f"**Pick: {best[1]}** ({best[0]:.2f} GB): fits a 16 GB laptop and matches the full model on every A-tier job.")
    else:
        lines.append("**No file both fits and matches the full model on every A-tier job yet.** Try more experts with experts-only "
                     "3-bit packaging, a larger calibration set, or the optional healing step (README).")
    text = "\n".join(lines) + "\n"
    print(text)
    if a.out:
        open(a.out, "w").write(text)


if __name__ == "__main__":
    main()
