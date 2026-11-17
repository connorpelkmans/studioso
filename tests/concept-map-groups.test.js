// Live group concept maps (99-concept-map-groups.js): a map's changes item by item, merging two people's edits, what arrives
// from others checked, and the group's copy of a map keeping the sharer's own notes, decks and files private.
const assert = require("assert");
const s = require("../scripts/app-files").source();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const between = (a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); assert(i >= 0 && j > i, "marker " + a); return s.slice(i + a.length, j); };
const CMAP = new Function(between("/*CMAP-START*/", "/*CMAP-END*/") + ";return CMAP;")();
const CMG = new Function(between("/*CMG-START*/", "/*CMG-END*/") + ";return CMGOF;")()(CMAP);
const base = {id: "m1", name: "Cell respiration", auto: false, g: {gid: "g1", bid: "b1", gn: "Bio"},
  add: [{id: "a", label: "Glycolysis"}, {id: "b", label: "Krebs cycle"}], links: [{a: "root", b: "idea:a", label: "starts with"}, {a: "idea:a", b: "idea:b", label: ""}],
  pos: {root: [0, 0], "idea:a": [100, 50], "idea:b": [220, 60]}, styles: {}, names: {}, hide: [], cut: []};
const clone = o => JSON.parse(JSON.stringify(o));

/* Changes, item by item */
let x = clone(base); x.pos["idea:a"] = [140, 80];
let st = CMG.steps(base, x);
ok(st.after.length === 1 && st.after[0].t === "p" && st.after[0].id === "idea:a" && JSON.stringify(st.after[0].v) === "[140,80]" && JSON.stringify(st.before[0].v) === "[100,50]", "moving a box is one change: its place (and the place before, for Undo)");
x = clone(base); x.add = x.add.concat([{id: "c", label: "ATP", at: {f: "secretfile", p: 3}, ev: ["c:deck1:card1"]}]); x.links.push({a: "idea:b", b: "idea:c", label: "makes", arrow: "end"});
st = CMG.steps(base, x);
const addOp = st.after.find(o => o.t === "a");
ok(st.after.length === 2 && addOp.id === "idea:c" && addOp.v.label === "ATP" && !("at" in addOp.v) && !("ev" in addOp.v) && JSON.stringify(st.after).indexOf("secretfile") < 0, "a new idea and its connection; its link to a PDF page and its cards never go to the group");
ok(st.after.some(o => o.t === "l" && o.id === "idea:b|idea:c" && o.v.arrow === "end" && o.v.label === "makes"), "a connection is keyed by the two boxes it joins");
x = clone(base); x.name = "Respiration"; x.pack = "biology"; x.styles = {"idea:b": {shape: "circle", fill: "#FFE066"}};
st = CMG.steps(base, x);
ok(st.after.some(o => o.t === "m" && o.id === "name" && o.v === "Respiration") && st.after.some(o => o.t === "m" && o.id === "pack" && o.v === "biology") && st.after.some(o => o.t === "s" && o.v.shape === "circle"), "renaming the map, its Map Style and a box's style are changes too");
ok(!CMG.steps(base, Object.assign(clone(base), {deck: "d1", mat: ["note:n1"], at: 99, created: 5})).after.length, "the map's own deck, chosen material and dates stay on the device");

/* Two people at once: both edits survive */
const mine = clone(base); mine.add[0].label = "Glycolysis (cytoplasm)";
const theirs = clone(base); theirs.pos["idea:b"] = [400, 400]; theirs.add.push({id: "z", label: "Electron transport"});
const opsMine = CMG.steps(base, mine).after, opsTheirs = CMG.steps(base, theirs).after;
const atMe = CMG.apply(mine, CMG.clean(JSON.parse(JSON.stringify(opsTheirs)))), atThem = CMG.apply(theirs, CMG.clean(JSON.parse(JSON.stringify(opsMine))));
ok(atMe.add.find(i => i.id === "a").label === "Glycolysis (cytoplasm)" && atMe.add.some(i => i.id === "z") && atMe.pos["idea:b"][0] === 400, "my rename and their move and new idea all survive on my side");
ok(JSON.stringify(CMG.parts(atMe).values ? [...CMG.parts(atMe).entries()].sort() : 0) === JSON.stringify([...CMG.parts(atThem).entries()].sort()), "and both sides end up with the same map");
// undo only takes back my own step
const step = CMG.steps(base, mine), undone = CMG.apply(atMe, step.before);
ok(undone.add.find(i => i.id === "a").label === "Glycolysis" && undone.add.some(i => i.id === "z") && undone.pos["idea:b"][0] === 400, "Undo puts back my rename and keeps what they did meanwhile");
const del = clone(base); del.add = del.add.filter(i => i.id !== "b"); del.links = del.links.filter(l => l.b !== "idea:b");
const delOps = CMG.steps(base, del).after;
ok(delOps.some(o => o.t === "a" && o.id === "idea:b" && o.v === null) && delOps.some(o => o.t === "l" && o.v === null), "deleting an idea removes it and its connections");
ok(!CMG.apply(base, delOps).add.some(i => i.id === "b"), "and the delete applies on the other side");

/* What arrives is checked */
const bad = CMG.clean([{t: "a", id: "note:n1", v: {label: "x"}}, {t: "a", id: "root", v: {label: "x"}}, {t: "x", id: "idea:q", v: 1}, {t: "l", id: "idea:a|idea:b", v: {a: "idea:a", b: "idea:z"}},
  {t: "a", id: "idea:q", v: {label: "<b>hi</b>".repeat(40), img: {src: "javascript:alert(1)", w: 3, h: 2}, at: {f: "x", p: 1}}}, {t: "s", id: "idea:q", v: {shape: "evil", fill: "red", color: "#123456"}},
  {t: "p", id: "idea:q", v: ["a", 3]}, {t: "m", id: "owner", v: "me"}, {t: "m", id: "name", v: ""}, {t: "a", id: "idea:p", v: {label: "Pic", img: {src: "data:image/png;base64,iVBORw0KGgo=", w: 40, h: 30}}}]);
ok(bad.length === 3, "only real ideas, known items and good values get through: " + bad.map(o => o.t + " " + o.id).join(", "));
const q1 = bad.find(o => o.id === "idea:q" && o.t === "a");
ok(q1 && q1.v.label.length === 120 && !q1.v.img && !q1.v.at, "names are cut to length, a picture that isn't a picture and private links are dropped");
ok(bad.find(o => o.t === "s").v.color === "#123456" && !bad.find(o => o.t === "s").v.shape, "styles keep only known shapes and colours");
ok(bad.some(o => o.id === "idea:p" && o.v.img && /^data:image\/png/.test(o.v.img.src)), "a real picture comes through");

/* The group's copy: private boxes become plain ideas (or are left out) */
const src = {root: {label: "Biology Map", kind: "course"}, mode: "course", notes: [{id: "n1", label: "My lecture notes", text: "SECRET body"}], decks: [{id: "d1", label: "Cells deck", from: []}],
  files: [{id: "f1", label: "Slides.pdf", pdf: true}], user: {add: [{id: "i1", label: "Mitochondria", at: {f: "f1", p: 4}, img: {k: "a:asset1", w: 400, h: 300}}],
  links: [{a: "root", b: "note:n1", label: "covers"}, {a: "note:n1", b: "idea:i1", label: "explains"}, {a: "idea:i1", b: "deck:d1", label: ""}, {a: "root", b: "file:f1", label: ""}], styles: {"note:n1": {fill: "#FFE066"}}}};
const g = CMAP.graph(src), pos = CMAP.layout(g, {}, false);
let k = 0; const pv = CMG.privatize(g, pos, {styles: src.user.styles}, {newId: () => "x" + (++k), name: "Biology Map"});
const txt = JSON.stringify(pv.rec);
ok(pv.priv === 3 && pv.pics === 1, "it counts the boxes that open your own things (3) and the pictures (1)");
ok(pv.rec.add.length === 4 && pv.rec.add.some(i => i.label === "My lecture notes") && pv.rec.add.every(i => /^x\d+$/.test(i.id)), "each box goes as an idea with a new id, private ones by name only");
ok(!/note:|deck:|file:|"n1"|"d1"|"f1"|SECRET/.test(txt) && !/"at"/.test(txt), "nothing points back at your notes, decks or files, and no page links: " + txt.slice(0, 200));
ok(pv.rec.links.length === 4 && pv.rec.links.some(l => l.label === "explains") && pv.rec.styles[Object.keys(pv.rec.styles)[0]].fill === "#FFE066", "connections and styles come along");
ok(Object.keys(pv.rec.pos).length === 5, "and every box keeps its place");
k = 0; const dr = CMG.privatize(g, pos, {styles: src.user.styles}, {newId: () => "y" + (++k), name: "Biology Map", drop: true});
ok(dr.rec.add.length === 1 && dr.rec.add[0].label === "Mitochondria" && dr.rec.links.length === 0, "Leave those boxes out: only your own ideas go");
const sendable = CMG.steps({}, Object.assign({name: "Biology Map"}, pv.rec)).after;
ok(sendable.length > 8 && sendable.every(o => CMG.clean([JSON.parse(JSON.stringify(o.t === "a" && o.v.img ? Object.assign({}, o, {v: Object.assign({}, o.v, {img: {src: "data:image/jpeg;base64,AAAA", w: 1, h: 1}})}) : o))]).length === 1), "everything the copy sends passes the same checks on arrival");

/* The group's preview */
const prev = CMG.preview(g, pos), back = CMG.readPreview(JSON.parse(JSON.stringify(prev)));
ok(back && back.g.nodes.length === g.nodes.length && back.g.edges.length === g.edges.length && back.g.nodes.some(n => n.root), "a preview is the map's boxes, lines and places");
ok(CMG.readPreview({n: [{id: "<script>", l: "x"}, {id: "n1", l: "<img src=x onerror=alert(1)>", fill: "url(javascript:1)"}], e: [["n1", "zz"]], p: {n1: [1, "x"]}}).g.nodes.length === 1 && !CMG.readPreview({n: [{id: "n1", l: "y", fill: "url(x)"}]}).g.nodes[0].fill, "a bad preview draws nothing it shouldn't");
console.log(`concept-map-groups.test: ${n} checks passed`);
