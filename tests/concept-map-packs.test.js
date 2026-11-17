// Concept map styles (CMPACK): every style draws its boxes and lines for any size and either kind of idea, with nothing broken in the SVG,
// backgrounds that tile, and a picture for the style picker. Match My Theme covers the themes with their own style, and any other theme's kit.
const assert = require("assert");
const s = require("../scripts/app-files").source();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const between = (a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); assert(i >= 0 && j > i, "marker " + a); return s.slice(i + a.length, j); };
const C = new Function(between("/*CMPACK-START*/", "/*CMPACK-END*/") + ";return CMPACK;")();
const FONTS = ["", "rounded", "readable", "serif", "mono", "hand", "casual", "marker"];
const bad = str => /NaN|undefined|Infinity|\[object/.test(str);

const ids = Object.keys(C.P);
ok(ids.length === 35, `35 styles: 15 themes and 20 subjects (${ids.length})`);
ok(C.SUBJECTS.length === 20 && C.THEMES.length === 15, "20 subjects, 15 themes");
ok(C.THEMES.every(t => C.P[C.THEME_OF[t]] && C.P[C.THEME_OF[t]].group === "theme"), "each theme with a style of its own points at it");
const sizes = [[60, 30], [120, 40], [220, 64], [90, 90]];
ids.forEach(id => {
  const pk = C.P[id];
  ok(pk.id === id && pk.name && pk.desc && /^#[0-9A-F]{6}$/i.test(pk.base), `${id}: a name, a description and a background colour`);
  ok(pk.tile && pk.tile.w >= 20 && pk.tile.h >= 18 && /^<svg[^>]+width="\d+"[^>]+height="\d+"/.test(pk.tile.svg) && !bad(pk.tile.svg), `${id}: a background tile that repeats`);
  ok(/^url\("data:image\/svg\+xml,/.test(C.tileUrl(pk)) && !/[\s"]/.test(C.tileUrl(pk).slice(5, -2)), `${id}: the tile works as a CSS background`);
  sizes.forEach(([w, h]) => [true, false].forEach(root => [0, 1, 2].forEach(i => {
    const b = pk.box({w, h, root, i});
    ok(b && typeof b.o === "string" && /^<(rect|path|circle|ellipse)\b[^>]*style="[^"]*fill:[^;"]+;stroke:/.test(b.o) && !/class=/.test(b.o), `${id}: the box's outline is one shape with its own fill and outline (${w}x${h} ${root ? "main" : "idea"} ${i})`);
    ok(!bad(b.o + (b.pre || "") + (b.post || "")), `${id}: the box draws cleanly (${w}x${h})`);
    const t = b.t || {}; ok(/^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(t.ink || ""), `${id}: the words have a colour`);
    ok(!t.font || FONTS.includes(t.font), `${id}: the words use a font the map has (${t.font})`);
  })));
  [[[0, 0], [30, 0], [60, 0], [90, 0]], [[0, 0], [40, 80], [120, -40], [200, 160]], [[5, 5], [6, 6], [7, 7], [8, 8]]].forEach(p => [0, 1, 2].forEach(i => {
    const L = pk.line(p, i);
    ok(L && typeof L.st === "string" && /stroke:/.test(L.st) && !bad(L.st + (L.pre || "") + (L.post || "") + (L.d || "")), `${id}: a line, long or very short (${i})`);
  }));
  const pv = C.preview(pk, {serif: "Georgia", mono: "monospace", hand: "Caveat", casual: "Patrick Hand", marker: "Permanent Marker", rounded: "Lexend"});
  ok(/^<svg viewBox="0 0 168 96"/.test(pv) && pv.includes(pk.base) && !bad(pv), `${id}: a picture for the picker`);
});
// ids inside a style's own drawings start pk- (they share the map's page), and every url(#...) it uses is defined by it
ids.forEach(id => { const pk = C.P[id], all = (pk.defs || "") + pk.box({w: 120, h: 40, root: true, i: 0}).o + pk.box({w: 120, h: 40, root: false, i: 1}).post + JSON.stringify(pk.line([[0, 0], [30, 0], [60, 0], [90, 0]], 0));
  const used = [...all.matchAll(/url\(#([\w-]+)\)/g)].map(m => m[1]), defined = [...(pk.defs || "").matchAll(/id="([\w-]+)"/g)].map(m => m[1]);
  ok(defined.every(d => d.startsWith("pk-")) && used.every(u => defined.includes(u)), `${id}: its gradients and filters are its own (${used.join(",")})`); });

/* Match My Theme for any other theme: its colours and motif */
const k = C.kit({name: "Lemonade", mc: "#E8B40C", bd: "#F2D98A", ink: "#3A2A00", card: ["#FFFBEA"], paper: "#FFF6CC", motif: "M0 -10a10 10 0 1 0 0.1 0Z"});
ok(k.group === "theme" && k.base === "#FFF6CC" && k.tile.svg.includes("M0 -10a10 10") && k.box({w: 100, h: 40, root: true, i: 0}).o.includes("#E8B40C"), "a kit theme: its paper, its motif on the background, its main colour on the main idea");
const plain = C.kit({});
ok(/^#/.test(plain.base) && !bad(plain.tile.svg) && plain.tile.svg.includes("<circle"), "a theme with no kit: dots in its accent colour");
ok(C.kit({dark: true, paper: "#111111"}).dark === true, "a dark theme stays dark");
ok(C.kit({id: "t-lavender"}).id === "t-lavender" && C.kit({id: "bad id\""}).id === "kit", "a theme's style is named after the theme (safely)");
ok(C.get("nope") === null && C.get("med") === C.P.med, "an unknown style is none");

/* The map keeps its style, and the app uses it */
ok(/meta\.pack|\{pack: v \|\| null\}/.test(s) && s.includes("function packOf()"), "the map remembers its style");
ok(/"99-concept-map-packs\.js",\s*"99-concept-map\.js"/.test(require("fs").readFileSync(require("path").join(__dirname, "../src/app.json"), "utf8")), "the styles load with the map");
console.log(`concept-map-packs: ${n} checks passed`);
