// Concept map embeds: which links become players, what they turn into, and that the app, desktop and website policies allow the same sites (and only them) in frames.
const assert = require("assert"), fs = require("fs"), path = require("path");
const s = require("../scripts/app-files").source(), root = path.join(__dirname, "..");
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const between = (a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); assert(i >= 0 && j > i, "marker " + a); return s.slice(i + a.length, j); };
const CMAP = new Function(between("/*CMAP-START*/", "/*CMAP-END*/") + ";return CMAP;")();
const E = u => CMAP.embedOf(u);

/* Links that become players */
const cases = [
  ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s", "youtube", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&start=90"],
  ["youtu.be/dQw4w9WgXcQ?t=42", "youtube", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&start=42"],
  ["https://m.youtube.com/shorts/abcdefghijk", "youtube", "https://www.youtube-nocookie.com/embed/abcdefghijk?rel=0"],
  ["https://vimeo.com/76979871", "vimeo", "https://player.vimeo.com/video/76979871"],
  ["https://www.loom.com/share/0123456789abcdef0123456789abcdef", "loom", "https://www.loom.com/embed/0123456789abcdef0123456789abcdef"],
  ["https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit#slide=id.p", "gslides", "https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/embed?start=false&loop=false"],
  ["https://docs.google.com/document/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit", "gdoc", "https://docs.google.com/document/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/preview"],
  ["https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit#gid=0", "gsheet", "https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/preview"],
  ["https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/view?usp=sharing", "gdrive", "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/preview"],
  ["https://www.desmos.com/calculator/abcdef1234", "desmos", "https://www.desmos.com/calculator/abcdef1234?embed"],
  ["https://www.geogebra.org/m/abcd123", "geogebra", "https://www.geogebra.org/material/iframe/id/abcd123"],
  ["https://phet.colorado.edu/en/simulations/projectile-motion", "phet", "https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_all.html"],
  ["https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5", "spotify", "https://open.spotify.com/embed/episode/7makk4oTQel546B0PZlDM5"],
  ["https://www.ted.com/talks/ken_robinson_do_schools_kill_creativity", "ted", "https://embed.ted.com/talks/ken_robinson_do_schools_kill_creativity"],
];
cases.push(["https://docs.google.com/document/d/e/2PACX-1vQabcdefghijklmnopqrstuv/pub", "gdoc", "https://docs.google.com/document/d/e/2PACX-1vQabcdefghijklmnopqrstuv/pub?embedded=true"],
  ["https://docs.google.com/presentation/d/e/2PACX-1vQabcdefghijklmnopqrstuv/pub?start=false", "gslides", "https://docs.google.com/presentation/d/e/2PACX-1vQabcdefghijklmnopqrstuv/embed?start=false&loop=false"],
  ["https://docs.google.com/spreadsheets/d/e/2PACX-1vQabcdefghijklmnopqrstuv/pubhtml", "gsheet", "https://docs.google.com/spreadsheets/d/e/2PACX-1vQabcdefghijklmnopqrstuv/pubhtml?widget=true&headers=false"],
  ["https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit?usp=sharing", "gsheet", "https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/preview"]);
for (const [u, p, e] of cases) { const r = E(u); ok(r && r.p === p && r.e === e && CMAP.embedOk(r.e), `${p}: ${u} -> ${r && r.e}`); }
ok(/i\.ytimg\.com\/vi\/dQw4w9WgXcQ\//.test(E("youtu.be/dQw4w9WgXcQ").th), "a YouTube video brings its thumbnail");

/* Links that don't */
for (const u of ["https://example.com/video", "javascript:alert(1)", "data:text/html,<script>1</script>", "https://www.youtube.com/watch?v=<x>", "https://evil.com/youtube.com/watch?v=dQw4w9WgXcQ",
  "https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ", "https://docs.google.com/forms/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/viewform", "ftp://vimeo.com/76979871", ""]) ok(!E(u), "not embeddable: " + JSON.stringify(u));
ok(!CMAP.embedOk("http://www.youtube-nocookie.com/embed/x") && !CMAP.embedOk("https://evil.com/embed") && !CMAP.embedOk("javascript:1"), "a player's address must be https on a listed site");

/* A saved map can't smuggle in another site */
const g = CMAP.graph({root: {label: "Map"}, blank: true, user: {add: [{id: "a", label: "Bad", emb: {p: "youtube", e: "https://evil.com/x"}}, {id: "b", label: "Good", emb: {p: "vimeo", e: "https://player.vimeo.com/video/76979871"}}]}});
ok(!g.nodes.find(x => x.label === "Bad").emb && g.nodes.find(x => x.label === "Good").emb.e === "https://player.vimeo.com/video/76979871", "an embed pointing anywhere else is dropped when the map is read");

const g2 = CMAP.graph({root: {label: "Map"}, blank: true, user: {add: [{id: "c", label: "", emb: {p: "vimeo", e: "https://player.vimeo.com/video/76979871"}}, {id: "d", label: ""}], links: [{a: "root", b: "idea:c"}]}});
ok(g2.nodes.find(x => x.id === "idea:c").label === "" && g2.nodes.find(x => x.id === "idea:d").label === "Untitled", "a video can have no caption (it shows the site's name); a plain idea can't");
ok(!CMAP.quizPick(g2, 1).ids.includes("idea:c"), "Fill In the Map skips a video with no caption");

/* Every policy allows the same sites in frames, and only those */
const want = CMAP.EMBED_HOSTS.map(h => "https://" + h).sort().join(" ");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8"), main = fs.readFileSync(path.join(root, "main.js"), "utf8"), hdr = fs.readFileSync(path.join(root, "_headers"), "utf8");
ok(((html.match(/frame-src ([^;"]+)/) || [])[1] || "").trim().split(/\s+/).sort().join(" ") === want, "the app's policy frames exactly the embed sites");
const mainHosts = eval((main.match(/const EMBED_HOSTS = (\[[^\]]+\])/) || [])[1] || "[]");
ok(mainHosts.map(h => "https://" + h).sort().join(" ") === want, "the desktop app frames exactly the embed sites");
ok(/"frame-src " \+ EMBED_HOSTS\.map/.test(main) && /will-frame-navigate[\s\S]{0,400}isEmbedUrl\(url\)[\s\S]{0,200}preventDefault/.test(main), "the desktop app stops any other frame (and never opens it in the browser)");
// every policy the website sends must let the players load: an explicit frame-src (else frames fall back to default-src, which is 'self')
const pol = [...hdr.matchAll(/^\s*Content-Security-Policy:\s*(.+)$/gm)].map(m => m[1]);
ok(pol.length >= 1 && pol.every(p => { const f = (/(?:^|;)\s*frame-src ([^;]+)/.exec(p) || [])[1]; return f && CMAP.EMBED_HOSTS.every(h => f.trim().split(/\s+/).includes("https://" + h)); }), `every website policy (${pol.length}) lets the embed sites load in a frame`);
const pp = (/^\s*Permissions-Policy:\s*(.+)$/m.exec(hdr) || [])[1] || "";
ok(["autoplay", "fullscreen"].every(f => { const m = new RegExp(f + "=\\(([^)]*)\\)").exec(pp); return m && CMAP.EMBED_HOSTS.every(h => m[1].includes('"https://' + h + '"')); }), "the website lets the players autoplay and go fullscreen");
console.log(`embeds: ${n} checks passed`);
