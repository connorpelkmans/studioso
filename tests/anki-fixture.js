// Builds small, real Anki collections (SQLite) for tests/import-apps.test.js and tests/import-apps.e2e.js. Not a test itself.
// Uses python3's sqlite3 module, so the file is written by real SQLite. ankiCollection(kind, opts) -> Buffer (or null without python3).
//   kind "11": the old schema (collection.anki2 / .anki21): note types and decks as JSON in col
//   kind "18": the new schema (inside collection.anki21b): decks and notetypes tables, names split by \x1f
//   kind "dummy": Anki's one-note "please update" placeholder that newer exports write next to collection.anki21b
// opts.filler: that many extra notes in a deck "Big" (with one very long field), so the tables need interior and overflow pages.
// The dates are local: day numbers count from 4 am on 2026-01-01 here, like Anki's collection creation time.
"use strict";
const cp = require("child_process"), fs = require("fs"), os = require("os"), path = require("path");

const PY = String.raw`
import sqlite3, sys, json, time, datetime, os
out, kind, filler = sys.argv[1], sys.argv[2], int(sys.argv[3])
if os.path.exists(out): os.remove(out)
db = sqlite3.connect(out)
db.execute("pragma page_size=1024")
crt = int(time.mktime(datetime.datetime(2026, 1, 1, 4, 0).timetuple()))
day = lambda y, m, d: (datetime.date(y, m, d) - datetime.date(2026, 1, 1)).days
secs = lambda y, m, d, h=12: int(time.mktime(datetime.datetime(y, m, d, h, 0).timetuple()))
db.execute("CREATE TABLE col (id integer primary key, crt integer not null, mod integer not null, scm integer not null, ver integer not null, dty integer not null, usn integer not null, ls integer not null, conf text not null, models text not null, decks text not null, dconf text not null, tags text not null)")
db.execute("CREATE TABLE notes (id integer primary key, guid text not null, mid integer not null, mod integer not null, usn integer not null, tags text not null, flds text not null, sfld integer not null, csum integer not null, flags integer not null, data text not null)")
db.execute("CREATE TABLE cards (id integer primary key, nid integer not null, did integer not null, ord integer not null, mod integer not null, usn integer not null, type integer not null, queue integer not null, due integer not null, ivl integer not null, factor integer not null, reps integer not null, lapses integer not null, left integer not null, odue integer not null, odid integer not null, flags integer not null, data text not null)")
db.execute("CREATE TABLE revlog (id integer primary key, cid integer not null, usn integer not null, ease integer not null, ivl integer not null, lastIvl integer not null, factor real not null, time integer not null, type integer not null)")
db.execute("CREATE INDEX ix_cards_nid on cards (nid)")
models = {"1001": {"id": 1001, "name": "Basic", "type": 0}, "1002": {"id": 1002, "name": "Basic (and reversed card)", "type": 0}, "1003": {"id": 1003, "name": "Cloze", "type": 1}}
decks = {"1": "Default", "2001": "Biology::Cells", "2002": "Spanish", "2003": "Chem::Cells", "2004": "Filtered Deck", "2005": "Big"}
if kind == "18":
    db.execute("CREATE TABLE decks (id integer PRIMARY KEY NOT NULL, name text NOT NULL, mtime_secs integer NOT NULL, usn integer NOT NULL, common blob NOT NULL, kind blob NOT NULL)")
    db.execute("CREATE TABLE notetypes (id integer NOT NULL PRIMARY KEY, name text NOT NULL, mtime_secs integer NOT NULL, usn integer NOT NULL, config blob NOT NULL)")
    for i, n in decks.items(): db.execute("insert into decks values (?,?,0,0,?,?)", (int(i), n.replace("::", "\x1f"), b"", b""))
    for i, m in models.items(): db.execute("insert into notetypes values (?,?,0,0,?)", (int(i), m["name"], b"\x08\x01\x1a\x02ab" if m["type"] == 1 else b"\x1a\x02ab"))
    db.execute("insert into col values (1,?,0,0,18,0,0,0,'','','','','')", (crt,))
else:
    db.execute("insert into col values (1,?,0,0,11,0,0,0,'{}',?,?,'{}','{}')", (crt, json.dumps(models), json.dumps({i: {"id": int(i), "name": n} for i, n in decks.items()})))
def note(nid, mid, *flds):
    db.execute("insert into notes values (?,?,?,0,0,'',?,'',0,0,'')", (nid, "g%d" % nid, mid, "\x1f".join(flds)))
def card(cid, nid, did, ord, type, queue, due, ivl=0, factor=0, reps=0, lapses=0, data="", odue=0, odid=0):
    db.execute("insert into cards values (?,?,?,?,0,0,?,?,?,?,?,?,?,0,?,?,0,?)", (cid, nid, did, ord, type, queue, due, ivl, factor, reps, lapses, odue, odid, data))
if kind == "dummy":
    note(1, 1001, "Please update to the latest Anki version, then import the .colpkg/.apkg file again.", "")
    card(1, 1, 1, 0, 0, 0, 1)
else:
    note(1, 1001, "Mitochondria<br>organelle", "Powerhouse &amp; <b>energy</b> <img src=\"a.jpg\">")
    card(11, 1, 2001, 0, 0, 0, 1)
    note(2, 1001, "Ribosome", "Makes <i>proteins</i>&nbsp;[sound:r.mp3]")
    card(12, 2, 2001, 0, 2, 2, day(2026, 10, 25), ivl=12, factor=2500, reps=5, lapses=1)
    for i, (y, m, d) in enumerate([(2026, 9, 1), (2026, 10, 13), (2026, 9, 20)]):
        db.execute("insert into revlog values (?,12,0,3,1,1,2500,1000,1)", (secs(y, m, d) * 1000 + i,))
    note(3, 1002, "hola", "hello")
    card(13, 3, 2002, 0, 2, 2, day(2026, 11, 5), ivl=25, factor=2300, reps=4, lapses=0, data='{"s":30.5,"d":3.2,"dr":0.9}')
    card(14, 3, 2002, 1, 0, 0, 2)
    note(4, 1003, "The capital of {{c1::France}} is <b>{{c2::Paris::city}}</b>.", "Extra info")
    card(15, 4, 2001, 0, 1, 1, secs(2026, 10, 21, 15), ivl=0, factor=0, reps=1, lapses=0)
    card(16, 4, 2001, 1, 0, 0, 3)
    note(5, 1001, "<img src=\"b.png\">", "a picture")
    card(17, 5, 2001, 0, 0, 0, 4)
    note(6, 1001, "Suspended Q", "A")
    card(18, 6, 2003, 0, 2, -1, day(2026, 11, 1), ivl=30, factor=1900, reps=8, lapses=3)
    note(7, 1001, "Filtered", "In a filtered deck")
    card(19, 7, 2004, 0, 2, 2, -100000, ivl=9, factor=2500, reps=3, lapses=0, odue=day(2026, 10, 30), odid=2002)
    for i in range(filler):
        nid = 1000 + i
        note(nid, 1001, "Filler %d" % i + (" " + "long " * 900 if i == 7 else ""), "Back %d" % i)
        card(100000 + i, nid, 2005, 0, 0, 0, 10 + i)
db.commit(); db.close()
`;

function hasPython(){ try { cp.execFileSync("python3", ["-c", "import sqlite3"], {stdio: "ignore"}); return true; } catch (e) { return false; } }
function ankiCollection(kind, opts){
  if (!hasPython()) return null;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sb-anki-")), py = path.join(dir, "make.py"), out = path.join(dir, "c.db");
  fs.writeFileSync(py, PY);
  cp.execFileSync("python3", ["-I", py, out, String(kind), String((opts && opts.filler) || 0)], {stdio: "inherit"});
  const buf = fs.readFileSync(out);
  fs.rmSync(dir, {recursive: true, force: true});
  return buf;
}
// The dates the fixture's cards should get here (local time, the same as the app)
const local = (y, m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
module.exports = {ankiCollection, hasPython, local};
