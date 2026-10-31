#!/usr/bin/env python3
"""Builds supabase-lms-districts.sql: each high school's school board or district, and that district's web domains, so
"Find your school" can find a high school's Brightspace, Canvas or Blackboard site (they're run by the district, not the school).

  python3 tools/build-lms-districts.py <ontario-sif.xlsx> <bc-schoolmailing.csv>

Sources (download first):
  Ontario: School information and student demographics (data.ontario.ca, Open Government Licence - Ontario), the newest
           "sif_data_table_..._en.xlsx": each school's board and the board's website
  British Columbia: https://bcschoolcontacts.gov.bc.ca/api/download/allschoolmailing.csv (Open Government Licence - British
           Columbia): each school's district, and school email addresses (the district's domain)
  United States public schools: the district is the first 7 digits of the school's NCES id, and its domain is the most common
           one among that district's high school websites already in supabase-schools-hs-*.sql
"""
import collections, csv, glob, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# website hosts that aren't the district's own
HOSTING = re.compile(r"(^|\.)(google\.com|googleusercontent\.com|facebook\.com|weebly\.com|wixsite\.com|wix\.com|wordpress\.com|blogspot\.com|"
                     r"squarespace\.com|schoolloop\.com|schoolinsites\.com|schoolwires\.net|schoolwires\.com|finalsite\.net|finalsite\.com|"
                     r"edlio\.com|edliocloud\.com|edlioschool\.com|apptegy\.net|thrillshare\.com|myschoolapp\.com|schoolmessenger\.com|"
                     r"sharpschool\.com|sharpschool\.net|eschoolview\.com|campussuite\.com|socs\.net|cms4schools\.com|responsiveed\.com|"
                     r"k12\.com|connectionsacademy\.com|stride\.com|shaw\.ca|telus\.net)$|(^|\.)(gmail|yahoo|hotmail|outlook|live|icloud|aol)\.[a-z.]+$", re.I)
# endings that are shared by many districts (the district is the label before them)
SHARED = re.compile(r"^(k12\.[a-z]{2}\.us|[a-z]{2}\.us|wednet\.edu|(edu\.)?(on|bc|ab|qc|ns|nb|mb|sk|pe|nl|nt|yk|nu)\.ca|"
                    r"(co|ac|edu|sch|org|gov|net|k12)\.[a-z]{2}|[a-z]{2,3})$")


# Districts on a province's shared Brightspace, each checked by hand (guessing them goes wrong: Simcoe County DSB is scdsb,
# but so is Sudbury Catholic's old domain). Ontario: <board>.elearningontario.ca; BC: <district>.onlinelearningbc.com
VLE = {
    "on:B28010": "adsb",
    "on:B28029": "rdsb",
    "on:B28037": "nndsb",
    "on:B28045": "kpdsb",
    "on:B28053": "rrdsb",
    "on:B28070": "sgdsb",
    "on:B29009": "ncdsb",
    "on:B29017": "npsc",
    "on:B29025": "hscdsb",
    "on:B29050": "kcdsb",
    "on:B29068": "tbcdsb",
    "on:B29076": "sncdsb",
    "on:B66001": "bwdsb",
    "on:B66010": "amdsb",
    "on:B66028": "gecdsb",
    "on:B66036": "lkdsb",
    "on:B66044": "tvdsb",
    "on:B66052": "tdsb",
    "on:B66060": "durham",
    "on:B66079": "kprdsb",
    "on:B66087": "tldsb",
    "on:B66095": "yrdsb",
    "on:B66109": "scdsb",
    "on:B66117": "ugdsb",
    "on:B66125": "pdsb",
    "on:B66133": "hdsb",
    "on:B66141": "hwdsb",
    "on:B66150": "dsbn",
    "on:B66168": "gedsb",
    "on:B66176": "wrdsb",
    "on:B66184": "ocdsb",
    "on:B66192": "ucdsb",
    "on:B66206": "ldsb",
    "on:B66214": "rcdsb",
    "on:B67008": "bgcdsb",
    "on:B67016": "hpcdsb",
    "on:B67024": "wecdsb",
    "on:B67032": "ldcsb",
    "on:B67040": "sccdsb",
    "on:B67059": "tcdsb",
    "on:B67067": "pvnccdsb",
    "on:B67075": "ycdsb",
    "on:B67083": "dpcdsb",
    "on:B67091": "smcdsb",
    "on:B67113": "hcdsb",
    "on:B67121": "hwcdsb",
    "on:B67130": "welcdsb",
    "on:B67148": "wcdsb",
    "on:B67156": "niagaracatholic",
    "on:B67164": "bhncdsb",
    "on:B67172": "cdsbeo",
    "on:B67180": "ocsb",
    "on:B67199": "rccdsb",
    "on:B67202": "alcdsb",
    "bc:005": "sd5.onlinelearningbc.com",
    "bc:006": "sd6.onlinelearningbc.com",
    "bc:008": "sd8.onlinelearningbc.com",
    "bc:010": "sd10.onlinelearningbc.com",
    "bc:022": "sd22.onlinelearningbc.com",
    "bc:023": "sd23.onlinelearningbc.com",
    "bc:027": "sd27.onlinelearningbc.com",
    "bc:034": "abbyschools.onlinelearningbc.com",
    "bc:036": "surreyschools.onlinelearningbc.com",
    "bc:037": "sd37.onlinelearningbc.com",
    "bc:039": "vsb.onlinelearningbc.com",
    "bc:040": "sd40.onlinelearningbc.com",
    "bc:041": "sd41.onlinelearningbc.com",
    "bc:043": "sd43.onlinelearningbc.com",
    "bc:044": "sd44.onlinelearningbc.com",
    "bc:046": "sd46.onlinelearningbc.com",
    "bc:047": "sd47.onlinelearningbc.com",
    "bc:048": "sd48.onlinelearningbc.com",
    "bc:052": "sd52.onlinelearningbc.com",
    "bc:057": "sd57.onlinelearningbc.com",
    "bc:058": "sd58.onlinelearningbc.com",
    "bc:059": "sd59.onlinelearningbc.com",
    "bc:060": "sd60.onlinelearningbc.com",
    "bc:062": "sd62.onlinelearningbc.com",
    "bc:063": "sd63.onlinelearningbc.com",
    "bc:064": "sd64.onlinelearningbc.com",
    "bc:067": "sd67.onlinelearningbc.com",
    "bc:068": "sd68.onlinelearningbc.com",
    "bc:070": "sd70.onlinelearningbc.com",
    "bc:071": "sd71.onlinelearningbc.com",
    "bc:072": "sd72.onlinelearningbc.com",
    "bc:074": "sd74.onlinelearningbc.com",
    "bc:075": "sd75.onlinelearningbc.com",
    "bc:079": "sd79.onlinelearningbc.com",
    "bc:083": "sd83.onlinelearningbc.com",
    "bc:084": "sd84.onlinelearningbc.com",
    "bc:085": "sd85.onlinelearningbc.com",
    "bc:087": "sd87.onlinelearningbc.com",
    "bc:092": "nisgaa.onlinelearningbc.com",
}
for _k, _v in list(VLE.items()):
    if "." not in _v:
        VLE[_k] = _v + ".elearningontario.ca"


def domain(url_or_host: str) -> str:
    """The district-level domain of a web address: elite.guhsd.net -> guhsd.net, www.isd535.k12.mn.us -> isd535.k12.mn.us"""
    h = re.sub(r"^[a-z]+://", "", (url_or_host or "").strip().lower()).split("/")[0].split(":")[0].split("@")[-1].strip(".")
    h = re.sub(r"^www\d?\.", "", h)
    if not re.fullmatch(r"[a-z0-9.-]+\.[a-z]{2,}", h) or HOSTING.search(h):
        return ""
    labels = h.split(".")
    for i in range(len(labels) - 1):
        rest = ".".join(labels[i + 1:])
        if SHARED.match(rest):
            return ".".join(labels[i:])
    return h


def top(c: collections.Counter) -> list:
    """The district's own domains: the most common, and any nearly as common (not the odd school's own website)"""
    best = c.most_common(3)
    return [d for d, n in best if n * 4 >= best[0][1] and (n >= 2 or n == best[0][1])]


def sql(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def ontario(path):
    import openpyxl
    ws = openpyxl.load_workbook(path, read_only=True).active
    rows = ws.iter_rows(values_only=True)
    head = next(rows)
    schools, boards = {}, {}
    for r in rows:
        d = dict(zip(head, r))
        if d.get("School Type") != "Public" and d.get("School Type") != "Catholic":
            continue
        b = str(d.get("Board Number") or "").strip()
        num = str(d.get("School Number") or "").strip()
        if not b or not num:
            continue
        schools[num] = "on:" + b
        bd = boards.setdefault("on:" + b, {"name": d.get("Board Name") or "", "doms": collections.Counter()})
        for k in ("Board Website", "School Website"):
            dm = domain(str(d.get(k) or ""))
            if dm:
                bd["doms"][dm] += 3 if k == "Board Website" else 1
    return {"hs:on:" + k: v for k, v in schools.items()}, boards


def bc(path):
    schools, dists = {}, {}
    with open(path, encoding="utf-8-sig") as f:
        for d in csv.DictReader(f):
            if d.get("School Category") != "Public School":
                continue
            n, code = (d.get("District Number") or "").strip(), (d.get("School Code") or "").strip()
            if not n or not code:
                continue
            schools["hs:bc:" + code] = "bc:" + n
            dd = dists.setdefault("bc:" + n, {"name": "School District " + n.lstrip("0"), "doms": collections.Counter()})
            dm = domain(d.get("Email") or "")
            if dm:
                dd["doms"][dm] += 1
    for k, dd in dists.items():
        dd["doms"]["sd%s.bc.ca" % k[3:].lstrip("0")] += 1   # most BC districts are sdNN.bc.ca
    return schools, dists


def us():
    dists = {}
    row = re.compile(r"^\('([^']*)','((?:[^']|'')*)','((?:[^']|'')*)','((?:[^']|'')*)'\)[,;]?$")
    for f in sorted(glob.glob(os.path.join(ROOT, "supabase-schools-hs-*.sql"))):
        public = False
        for line in open(f, encoding="utf-8"):
            if line.startswith("select "):
                public = line.startswith("select 'hs:us:'")
                continue
            if not public:
                continue
            m = row.match(line.strip())
            if not m or not re.fullmatch(r"\d{12}", m.group(1)):
                continue
            dm = domain(m.group(4))
            if dm:
                dists.setdefault("us:" + m.group(1)[:7], collections.Counter())[dm] += 1
    return {k: {"name": "", "doms": v} for k, v in dists.items()}


def main():
    on_s, on_d = ontario(sys.argv[1])
    bc_s, bc_d = bc(sys.argv[2])
    us_d = us()
    dists = {**on_d, **bc_d, **us_d}
    known = set()
    for f in glob.glob(os.path.join(ROOT, "supabase-schools-hs-*.sql")):
        known.update("hs:on:" + k for k in re.findall(r"^\('(\d{6})'", open(f, encoding="utf-8").read(), re.M))
        known.update("hs:bc:" + k for k in re.findall(r"^\('(\d{8})'", open(f, encoding="utf-8").read(), re.M))
    links = {k: v for k, v in {**on_s, **bc_s}.items() if k in known}
    out = [
        "-- Studyboard: each high school's school board or district, and the district's web domains, so \"Find your school\"",
        "-- (supabase-functions/lms-find) can find a high school's Brightspace, Canvas or Blackboard site, which the district runs.",
        "-- Made by tools/build-lms-districts.py from: Ontario Ministry of Education, School information and student demographics",
        "-- (Open Government Licence - Ontario); BC School and District Contact Information (Open Government Licence - British",
        "-- Columbia); US public schools: the district in each school's NCES id and its schools' websites.",
        "-- Run once in the Supabase SQL Editor after supabase-schools.sql and supabase-lms-find.sql; safe to run again.",
        "-- Only the service role reaches these tables (row-level security on, no policies).",
        "",
        "create table if not exists public.lms_districts (",
        "  district text primary key,",
        "  name text not null default '',",
        "  domains text[] not null default '{}',",
        "  brightspace text not null default '',   -- a known Brightspace address, when guessing it isn't safe",
        "  shared boolean not null default false   -- another district's domain starts with the same name (lcps.org, lcps.k12.nm.us)",
        ");",
        "alter table public.lms_districts add column if not exists shared boolean not null default false;",
        "alter table public.lms_districts add column if not exists brightspace text not null default '';",
        "-- high schools whose district isn't in their key (US public schools' is: the first 7 digits of the NCES id)",
        "create table if not exists public.school_districts (",
        "  school_key text primary key,",
        "  district text not null",
        ");",
        "alter table public.lms_districts enable row level security;",
        "alter table public.school_districts enable row level security;",
        "revoke all on public.lms_districts, public.school_districts from anon, authenticated;",
        "",
    ]
    items = sorted((k, v) for k, v in dists.items() if v["doms"])
    names = collections.Counter(n for _, v in items for n in {d.split(".")[0] for d in top(v["doms"])})
    for i in range(0, len(items), 1000):
        out.append("insert into public.lms_districts (district, name, domains, brightspace, shared) values")
        out.append(",\n".join("(%s,%s,array[%s]::text[],%s,%s)" % (sql(k), sql(v["name"]), ",".join(sql(d) for d in top(v["doms"])),
                              sql(VLE.get(k, "")), "true" if any(names[d.split(".")[0]] > 1 for d in top(v["doms"])) else "false")
                              for k, v in items[i:i + 1000]))
        out.append("on conflict (district) do update set name = excluded.name, domains = excluded.domains, brightspace = excluded.brightspace, shared = excluded.shared;")
    ls = sorted(links.items())
    for i in range(0, len(ls), 1000):
        out.append("insert into public.school_districts (school_key, district) values")
        out.append(",\n".join("(%s,%s)" % (sql(k), sql(v)) for k, v in ls[i:i + 1000]))
        out.append("on conflict (school_key) do update set district = excluded.district;")
    open(os.path.join(ROOT, "supabase-lms-districts.sql"), "w", encoding="utf-8").write("\n".join(out) + "\n")
    print("districts", len(items), "(on %d, bc %d, us %d)" % (sum(1 for k, _ in items if k.startswith("on:")),
          sum(1 for k, _ in items if k.startswith("bc:")), sum(1 for k, _ in items if k.startswith("us:"))), "school links", len(ls))


if __name__ == "__main__":
    main()
