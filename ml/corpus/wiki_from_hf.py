"""Study-topic Wikipedia articles (CC BY-SA 4.0) from Wikimedia's own dataset on Hugging Face, for when the Wikipedia API is
rate-limited. One parquet shard holds ~150,000 random articles; this keeps the ones about things students study (concepts,
processes, events, systems) and drops biographies, places, films, albums, sports and lists.

    python ml/corpus/wiki_from_hf.py --shards 0,7 --out ml/data/raw/wikipedia.jsonl --max 4000

Needs: pyarrow (pip install pyarrow). Each line has the same fields as fetch_wikipedia.py.
"""
import argparse, json, os, re, sys, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
from fetch_wikipedia import chunks  # same notes-sized chunking

BASE = "https://huggingface.co/datasets/wikimedia/wikipedia/resolve/main/20231101.en/train-{:05d}-of-00041.parquet"
NOT_STUDY = re.compile(r"\b(born|died|is an? (american|british|english|canadian|australian|german|french|indian|japanese|italian|spanish|irish|scottish|swedish|dutch|brazilian|mexican|russian|polish|chinese|korean)? ?(actor|actress|singer|rapper|footballer|politician|businessman|businesswoman|musician|band|album|song|film|television|tv series|village|town|city|municipality|commune|footballer|cricketer|basketball|baseball|racing|wrestler|athlete|painter|novelist|journalist|company|footballer|football club|radio station|newspaper|video game|single)|is a (species|genus) of|is a (railway )?station|census|population was)\b", re.I)
STUDY = {  # subject -> words that mark the topic
    "biology": r"\b(cell|protein|enzyme|gene|dna|rna|organism|species evolution|photosynthesis|membrane|tissue|bacteria|virus|ecosystem|metabolism)\b",
    "health": r"\b(disease|symptom|treatment|diagnosis|patient|clinical|nursing|medication|drug|therapy|infection|anatomy|physiology|blood|heart|nerve)\b",
    "chemistry": r"\b(molecule|atom|reaction|compound|acid|base|bond|ion|electron|element|solution|oxidation|catalyst|isotope)\b",
    "physics": r"\b(energy|force|velocity|momentum|quantum|wave|particle|field|mass|gravity|thermodynamic|relativity|electromagnetic)\b",
    "math": r"\b(theorem|equation|function|integral|derivative|matrix|probability|algebra|geometry|proof|set theory|vector|statistic)\b",
    "computing": r"\b(algorithm|computer|software|programming|data structure|network|protocol|database|compiler|encryption)\b",
    "history": r"\b(war|empire|revolution|dynasty|treaty|century|kingdom|colonial|independence|civilization|reign|battle)\b",
    "government": r"\b(constitution|government|parliament|congress|election|democracy|law|court|rights|policy|legislation)\b",
    "economics": r"\b(market|economy|economic|inflation|trade|price|supply|demand|monetary|fiscal|capital|labor|tax)\b",
    "psychology": r"\b(behavior|behaviour|cognitive|psychology|memory|perception|emotion|learning|personality|mental)\b",
    "earth science": r"\b(climate|geology|rock|plate tectonics|volcano|ocean|atmosphere|weather|erosion|mineral|earthquake)\b",
    "philosophy": r"\b(philosophy|ethics|moral|logic|metaphysics|epistemology|argument)\b",
    "arts and literature": r"\b(novel|poem|poetry|literary|painting|sculpture|music theory|genre|narrative|renaissance|baroque)\b",
}
STUDY_RE = {k: re.compile(v, re.I) for k, v in STUDY.items()}


# what the first sentence says the article is about: these are never study topics
NOT_TOPIC = re.compile(r"\b(radio station|television station|tv station|video game|company|corporation|brand|restaurant|retailer|newspaper|magazine|album|single|song|film|movie|episode|band|rapper|singer|actor|actress|footballer|cricketer|player|coach|wrestler|politician|businessman|businesswoman|baron|baronet|lord|lady|earl|bishop|priest|road|street|highway|railway|rail accident|station|airport|bridge|building|stadium|hotel|school|college|university|village|town|city|county|municipality|district|parish|neighborhood|neighbourhood|island|river|mountain|lake|ship|aircraft|regiment|formation|brigade|battalion|squadron|football club|sports club|team|league|tournament|championship|season|race|award|prize|festival|organization|organisation|charity|foundation|society|association|museum|library|church|cathedral|temple|mosque|painter|poet|novelist|writer|author|journalist|composer|musician|artist|architect|engineer|businessperson|entrepreneur|historian|philosopher|mathematician|physicist|chemist|biologist|scientist|economist|lawyer|judge|general|admiral|king|queen|prince|princess|emperor|empress|saint|family|dynasty member)\b", re.I)
BIO = re.compile(r"\(\s*(?:born|c\.|b\.|died|fl\.|\d{1,2} \w+ \d{3,4}|\w+ \d{1,2}, \d{3,4}|\d{3,4})\s*[–-]|\(born\b", re.I)


def subject_of(title, text):
    head = text[:4000]
    first = re.split(r"(?<=[.!?])\s", text[:600], maxsplit=1)[0]
    if BIO.search(first) or NOT_STUDY.search(head[:400]) or re.match(r"(?i)^(list of|outline of|index of|timeline of|\d{4} in |history of .* \(.*\))", title):
        return None
    # "X is a/an/the <noun>": the noun must not be a place, person, organization, product or event
    m = re.search(r"\b(?:is|are|was|were) (?:an?|the|one of the) ([^.;]{0,90})", first)
    if not m or NOT_TOPIC.search(m.group(1)):
        return None
    scores = {k: r.findall(head) for k, r in STUDY_RE.items()}
    k = max(scores, key=lambda x: len(scores[x]))
    distinct = len({w.lower() for w in scores[k]})
    return k if len(scores[k]) >= 10 and distinct >= 4 else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--shards", default="0")
    ap.add_argument("--out", default="ml/data/raw/wikipedia.jsonl")
    ap.add_argument("--max", type=int, default=4000, help="articles kept in all")
    ap.add_argument("--per-subject", type=int, default=400)
    ap.add_argument("--cache", default="ml/data/cache")
    a = ap.parse_args()
    import pyarrow.parquet as pq
    os.makedirs(a.cache, exist_ok=True)
    os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
    kept, per = 0, {}
    with open(a.out, "a") as f:
        for sh in [int(x) for x in a.shards.split(",")]:
            path = os.path.join(a.cache, f"wiki-{sh:05d}.parquet")
            if not os.path.exists(path):
                print(f"downloading shard {sh}...", file=sys.stderr)
                urllib.request.urlretrieve(BASE.format(sh), path + ".part")
                os.rename(path + ".part", path)
            t = pq.read_table(path, columns=["id", "url", "title", "text"])
            for row in t.to_pylist():
                if kept >= a.max:
                    break
                text, title = row["text"], row["title"]
                if len(text.split()) < 600:
                    continue
                subj = subject_of(title, text)
                if not subj or per.get(subj, 0) >= a.per_subject:
                    continue
                # the dataset strips '== headings =='; paragraphs are separated by blank lines, so chunk on those
                cs = chunks(title, text.replace("\n\n", "\n"))
                if not cs:
                    continue
                for i, (sec, body) in enumerate(cs[:2]):
                    f.write(json.dumps({"id": f"wp-{row['id']}-{i}", "source": "wikipedia", "subject": subj, "title": title, "section": sec,
                                        "license": "https://creativecommons.org/licenses/by-sa/4.0/", "url": row["url"], "text": body}) + "\n")
                per[subj] = per.get(subj, 0) + 1
                kept += 1
            print(f"shard {sh}: {kept} articles so far {per}", file=sys.stderr)
    print(f"{kept} articles -> {a.out}")


if __name__ == "__main__":
    main()
