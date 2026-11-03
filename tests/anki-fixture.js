// Builds small, real Anki collections
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
io = kind in ("io", "io18")
if io:
    # Anki's own Image Occlusion note type (a cloze kind, stock kind 6) and the Image Occlusion Enhanced add-on's
    models["1004"] = {"id": 1004, "name": "Image Occlusion", "type": 1, "originalStockKind": 6, "flds": [{"name": n, "ord": i} for i, n in enumerate(["Occlusion", "Image", "Header", "Back Extra", "Comments"])]}
    models["1005"] = {"id": 1005, "name": "Image Occlusion Enhanced", "type": 0, "flds": [{"name": n, "ord": i} for i, n in enumerate(["ID (hidden)", "Header", "Image", "Question Mask", "Footer", "Remarks", "Sources", "Extra 1", "Extra 2", "Answer Mask", "Original Mask"])]}
    decks["2010"] = "Anatomy"
if kind in ("18", "io18"):
    db.execute("CREATE TABLE decks (id integer PRIMARY KEY NOT NULL, name text NOT NULL, mtime_secs integer NOT NULL, usn integer NOT NULL, common blob NOT NULL, kind blob NOT NULL)")
    db.execute("CREATE TABLE notetypes (id integer NOT NULL PRIMARY KEY, name text NOT NULL, mtime_secs integer NOT NULL, usn integer NOT NULL, config blob NOT NULL)")
    for i, n in decks.items(): db.execute("insert into decks values (?,?,0,0,?,?)", (int(i), n.replace("::", "\x1f"), b"", b""))
    for i, m in models.items(): db.execute("insert into notetypes values (?,?,0,0,?)", (int(i), m["name"], (b"\x08\x01" if m["type"] == 1 else b"") + (b"\x48\x06" if m.get("originalStockKind") == 6 else b"") + b"\x1a\x02ab"))
    # field names, as newer Anki keeps them: a table made WITHOUT ROWID
    db.execute("CREATE TABLE fields (ntid integer NOT NULL, ord integer NOT NULL, name text NOT NULL, config blob NOT NULL, PRIMARY KEY (ntid, ord)) without rowid")
    for i, m in models.items():
        for f in m.get("flds", []): db.execute("insert into fields values (?,?,?,?)", (int(i), f["ord"], f["name"], b""))
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
elif io:
    # hide all, guess one (oi=1): a box, an oval, and a polygon grouped with a box as card 3; a text label isn't a mask
    note(50, 1004, "{{c1::image-occlusion:rect:left=.1:top=.1:width=.2:height=.1:oi=1}}<br>{{c2::image-occlusion:ellipse:left=.5:top=.2:rx=.1:ry=.05:oi=1}}<br>{{c3::image-occlusion:polygon:left=.1:top=.6:points=.1,.6 .3,.65 .2,.8:oi=1}}<br>{{c3::image-occlusion:rect:left=.7:top=.7:width=.15:height=.1:oi=1}}<br>{{c0::image-occlusion:text:left=.4:top=.02:text=The heart:scale=1:fs=.05}}<br>",
        '<img src="heart diagram.png">', "Parts of the &lt;heart&gt;", "Right side carries \\(O_2\\)-poor blood", "Lecture 4")
    card(60, 50, 2010, 0, 2, 2, day(2026, 11, 10), ivl=10, factor=2500, reps=3, lapses=1)
    card(61, 50, 2010, 1, 0, 0, 5)
    card(62, 50, 2010, 2, 2, 2, day(2026, 11, 20), ivl=20, factor=2500, reps=4, lapses=0, data='{"s":20.5,"d":4.1}')
    # hide one, guess one (no oi), in pixels as older notes have them
    note(51, 1004, "{{c1::image-occlusion:rect:left=40:top=30:width=80:height=60}}<br>{{c2::image-occlusion:rect:left=200:top=150:width=100:height=50}}", '<img src="cell.png">', "", "", "")
    card(63, 51, 2010, 0, 0, 0, 6)
    card(64, 51, 2010, 1, 0, 0, 7)
    # Image Occlusion Enhanced: three notes of one picture, the third a group
    for k in (1, 2, 3):
        note(70 + k, 1005, "abc123-ao-%d" % k, "Brain" if k == 1 else "", '<img src="brain.png">', '<img src="abc123-ao-%d-Q.svg">' % k, "Footer %d" % k, "", "", "", "", '<img src="abc123-ao-%d-A.svg">' % k, '<img src="abc123-ao-O.svg">')
        card(80 + k, 70 + k, 2010, 0, 2 if k == 2 else 0, 2 if k == 2 else 0, day(2026, 11, 12) if k == 2 else 8 + k, ivl=6 if k == 2 else 0, factor=2100 if k == 2 else 0, reps=2 if k == 2 else 0)
    # math as Anki writes it
    note(90, 1001, "Area of a circle: \\(\\pi r^2\\)<br>[$]x &lt; y[/$]", "[latex]\\documentclass{article}\\begin{document}$A = \\pi r^{2}$\\end{document}[/latex] and \\[a<br>+b\\]")
    card(91, 90, 2010, 0, 0, 0, 9)
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
// Pictures and masks for the image occlusion notes above: {name: bytes}
function png(w, h, rgb){
  const zlib = require("zlib"), crcTable = [];
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; }
  const crc = b => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  const row = Buffer.alloc(1 + w * 3); for (let x = 0; x < w; x++) row.set(rgb || [200, 220, 240], 1 + x * 3);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ih), chunk("IDAT", zlib.deflateSync(Buffer.concat(Array(h).fill(row)))), chunk("IEND", Buffer.alloc(0))]);
}
const IOE_SHAPES = [
  q => `<rect id="abc123-ao-1" x="50" y="40" width="100" height="40" stroke="#2D2D2D" fill="${q ? "#FF7E7E" : "#FFEBA2"}" class="${q ? "qshape" : "shape"}"/>`,
  q => `<ellipse id="abc123-ao-2" cx="300" cy="100" rx="50" ry="20" stroke="#2D2D2D" fill="${q ? "#FF7E7E" : "#FFEBA2"}" class="${q ? "qshape" : "shape"}"/>`,
  q => `<g id="abc123-ao-3"${q ? ' class="qshape"' : ""}><rect x="100" y="300" width="50" height="40" fill="${q ? "#FF7E7E" : "#FFEBA2"}"/><polygon points="300,300 400,300 350,380" fill="${q ? "#FF7E7E" : "#FFEBA2"}"/></g>`,
];
const ioeSvg = k => `<svg width="500" height="400" xmlns="http://www.w3.org/2000/svg"><g><title>Masks</title>${IOE_SHAPES.map((f, i) => f(i + 1 === k)).join("")}</g></svg>`;
function ioMedia(){
  const m = {"heart diagram.png": png(800, 600), "cell.png": png(400, 300, [250, 230, 200]), "brain.png": png(500, 400, [230, 210, 240]), "abc123-ao-O.svg": Buffer.from(ioeSvg(0))};
  [1, 2, 3].forEach(k => { m[`abc123-ao-${k}-Q.svg`] = Buffer.from(ioeSvg(k)); m[`abc123-ao-${k}-A.svg`] = Buffer.from(ioeSvg(0)); });
  return m;
}
// Newer packages list their media as protobuf (MediaEntries: name = 1 in each entry = 1)
function pbMediaList(names){
  const v = n => { const o = []; while (n > 127) { o.push((n & 127) | 128); n >>>= 7; } o.push(n); return Buffer.from(o); };
  return Buffer.concat(names.map(n => { const nm = Buffer.from(n), e = Buffer.concat([Buffer.from([10]), v(nm.length), nm, Buffer.from([16]), v(1)]); return Buffer.concat([Buffer.from([10]), v(e.length), e]); }));
}
module.exports = {ankiCollection, hasPython, local, ioMedia, pbMediaList, png};
