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
/* Microsoft 365: Word, Excel and PowerPoint for the web */
cases.push(
  ["https://onedrive.live.com/embed?resid=ABC123%21105&authkey=%21AXyZ&em=2&ithint=file%2cdocx", "mword", "https://onedrive.live.com/embed?resid=ABC123%21105&authkey=%21AXyZ&em=2&ithint=file%2Cdocx"],
  ['<iframe src="https://onedrive.live.com/embed?cid=1234ABCD&amp;resid=1234ABCD%21110&amp;authkey=%21AAbc&amp;em=2&amp;wdAllowInteractivity=False" width="476px" height="288px" frameborder="0">This is an embedded Microsoft Office presentation</iframe>', "m365", "https://onedrive.live.com/embed?cid=1234ABCD&resid=1234ABCD%21110&authkey=%21AAbc&em=2&wdAllowInteractivity=False"],
  ["https://view.officeapps.live.com/op/view.aspx?src=https%3A%2F%2Fexample.edu%2Fslides%2Fweek1.pptx", "mppt", "https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fexample.edu%2Fslides%2Fweek1.pptx"]);
for (const u of ["https://evilsharepoint.com/:w:/s/x/abc", "https://contoso.sharepoint.com.evil.com/:w:/s/x/abc", "https://sharepoint.com/:w:/s/x/abc", "https://contoso.sharepoint.com/sites/Bio/SitePages/Home.aspx",
  "https://onedrive.live.com/?id=root", "https://view.officeapps.live.com/op/view.aspx?src=javascript:alert(1)"]) ok(!E(u), "not a Microsoft 365 embed: " + u);
ok(!E("https://contoso.sharepoint.com/:w:/s/Biology/EbAbCdEf123?e=XyZ1") && !CMAP.hostOk("contoso.sharepoint.com"), "a school's own SharePoint isn't framed (the policy names exact sites, never a whole domain)");
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
/* Previews: the provider's own picture by its address (documented thumbnail or oEmbed), else a live view; never a copy */
const PV = u => CMAP.previewOf(E(u));
ok(PV("youtu.be/dQw4w9WgXcQ").th === "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg" && PV("youtu.be/dQw4w9WgXcQ").oe === "https://www.youtube.com/oembed?format=json&url=https://youtu.be/dQw4w9WgXcQ", "YouTube: its thumbnail, and oEmbed for the title");
ok(PV("https://vimeo.com/76979871").oe === "https://vimeo.com/api/oembed.json?url=https://vimeo.com/76979871" && !PV("https://vimeo.com/76979871").th, "Vimeo: oEmbed");
ok(PV("https://www.loom.com/share/0123456789abcdef0123456789abcdef").oe === "https://www.loom.com/v1/oembed?url=https://www.loom.com/share/0123456789abcdef0123456789abcdef", "Loom: oEmbed");
ok(PV("https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5").oe === "https://open.spotify.com/oembed?url=https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5", "Spotify: oEmbed");
ok(PV("https://www.ted.com/talks/ken_robinson_do_schools_kill_creativity").oe === "https://www.ted.com/services/v1/oembed.json?url=https://www.ted.com/talks/ken_robinson_do_schools_kill_creativity", "TED: oEmbed");
ok(PV("https://phet.colorado.edu/en/simulations/projectile-motion").th === "https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion-600.png", "PhET: the sim's own screenshot");
ok(PV("https://docs.google.com/presentation/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/edit").th === "https://drive.google.com/thumbnail?id=1AbCdEfGhIjKlMnOpQrStUvWxYz&sz=w640" && PV("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/view").th.includes("id=1AbCdEfGhIjKlMnOpQrStUvWxYz"), "a shared Google file: Drive's thumbnail");
for (const u of ["https://docs.google.com/document/d/e/2PACX-1vQabcdefghijklmnopqrstuv/pub", "https://www.desmos.com/calculator/abcdef1234", "https://www.geogebra.org/m/abcd123", "https://www.canva.com/design/DAFabcdefgh/view"]) { const p = PV(u); ok(p.live && !p.th && !p.oe, "no picture to be had, a live view: " + u); }
ok(!CMAP.previewOf({p: "youtube", e: "https://evil.com/embed/dQw4w9WgXcQ"}).th && !CMAP.previewOf(null).th, "a preview only for a listed site's player");
const fo = CMAP.fromOembed({title: "  A   talk ", thumbnail_url: "https://i.vimeocdn.com/video/1-d_295x166"});
ok(fo.th === "https://i.vimeocdn.com/video/1-d_295x166" && fo.tt === "A talk", "oEmbed gives the picture's address and the title");
for (const bad of ["data:image/png;base64,AAAA", "blob:https://x/1", "http://i.vimeocdn.com/x.jpg", "javascript:alert(1)", 'https://x.com/"onload="1', "https://x.com/" + "a".repeat(700)]) ok(!CMAP.fromOembed({thumbnail_url: bad}).th && !CMAP.thumbOk(bad), "never kept as a picture: " + bad.slice(0, 40));
const g3 = CMAP.graph({root: {label: "Map"}, blank: true, user: {add: [{id: "v", label: "", emb: {p: "vimeo", e: "https://player.vimeo.com/video/76979871", th: "data:image/png;base64,AAAA", tt: "T"}}, {id: "w", label: "", emb: {p: "vimeo", e: "https://player.vimeo.com/video/76979871", th: "https://i.vimeocdn.com/v.jpg"}}]}});
ok(g3.nodes.find(x => x.id === "idea:v").emb.th === "" && g3.nodes.find(x => x.id === "idea:v").emb.tt === "T" && g3.nodes.find(x => x.id === "idea:w").emb.th === "https://i.vimeocdn.com/v.jpg", "a saved map keeps only an https picture address (a data: picture is dropped when read)");
// the desktop app: an embed asked for from the app names the Studyboard website as its page (YouTube's Error 153 otherwise)
ok(/onBeforeSendHeaders\(\{ urls: EMBED_HOSTS\.map\(h => `https:\/\/\$\{h\}\/\*`\) \}/.test(main) && /EMBED_REFERRER = "https:\/\/studyboardapp\.com\/"/.test(main) && /if \(!ref \|\| \/\^app:\/i\.test\(ref\)\)/.test(main), "desktop: embed requests from the app send the website as the referrer (only when there's none, or it's the app's)");
console.log(`embeds: ${n} checks passed`);
