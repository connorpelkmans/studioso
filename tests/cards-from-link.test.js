// node tests/cards-from-link.test.js
const assert = require("assert");
const src = require("../scripts/app-files").source();
const a = src.indexOf("/*LINKCARDS-START*/"), b = src.indexOf("/*LINKCARDS-END*/");
assert(a > 0 && b > a, "the LINKCARDS block is in the app");
const L = new Function(src.slice(a, b) + "; return LINKCARDS;")();
let n = 0; const t = (name, fn) => { fn(); n++; console.log("ok -", name); };
const yt = (u, id) => { const r = L.parse(u); assert(r.ok && r.kind === "youtube" && r.id === id && r.url === "https://www.youtube.com/watch?v=" + id, u + " " + JSON.stringify(r)); return r; };

t("YouTube links of every common shape", () => {
  yt("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ");
  yt("https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s&list=PL123", "dQw4w9WgXcQ");
  yt("https://m.youtube.com/watch?feature=share&v=dQw4w9WgXcQ", "dQw4w9WgXcQ");
  yt("https://youtu.be/dQw4w9WgXcQ?si=abc", "dQw4w9WgXcQ");
  assert(yt("https://www.youtube.com/shorts/aBcDeFgHiJk", "aBcDeFgHiJk").shorts);
  yt("https://www.youtube.com/live/aBcDeFgHiJk?feature=share", "aBcDeFgHiJk");
  yt("https://www.youtube.com/embed/aBcDeFgHiJk", "aBcDeFgHiJk");
  yt("youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ");
  yt("  <https://youtu.be/dQw4w9WgXcQ>  ", "dQw4w9WgXcQ");
});
t("YouTube pages that aren't one video", () => {
  assert.strictEqual(L.parse("https://www.youtube.com/@CrashCourse").why, "yt-list");
  assert.strictEqual(L.parse("https://www.youtube.com/playlist?list=PL8dPuuaLjXtNlUrzyH5r6jN9ulIgZBpdo").why, "yt-list");
  assert.strictEqual(L.parse("https://www.youtube.com/watch?v=short").why, "yt-bad");
  assert.strictEqual(L.parse("https://youtu.be/").why, "yt-bad");
});
t("articles", () => {
  const r = L.parse("https://www.khanacademy.org/science/biology/membranes#section-2");
  assert(r.ok && r.kind === "article" && r.url === "https://www.khanacademy.org/science/biology/membranes" && r.host === "khanacademy.org");
  assert.strictEqual(L.parse("en.wikipedia.org/wiki/Osmosis").url, "https://en.wikipedia.org/wiki/Osmosis");
  assert(L.parse("http://example.edu/notes.pdf").ok);
});
t("only http and https, real hosts", () => {
  assert.strictEqual(L.parse("").why, "empty");
  assert.strictEqual(L.parse("javascript:alert(1)").why, "scheme");
  assert.strictEqual(L.parse("ftp://files.example.com/a.pdf").why, "scheme");
  assert.strictEqual(L.parse("file:///Users/me/notes.pdf").why, "scheme");
  assert.strictEqual(L.parse("data:text/html,hi").why, "scheme");
  assert.strictEqual(L.parse("osmosis notes").why, "bad");
  assert.strictEqual(L.parse("https://intranet/page").why, "bad");
  assert.strictEqual(L.parse("http://localhost:3000/x").why, "local");
  assert.strictEqual(L.parse("http://192.168.1.4/x").why, "local");
  assert.strictEqual(L.parse("https://user:pw@example.com/").why, "bad");
});
t("the summary note credits the source and links the deck", () => {
  const txt = L.noteText({title: "How Osmosis Works", overview: "Water moves toward more solute.", sections: [{heading: "Osmosis", points: ["Water crosses membranes", ""]}], terms: [{term: "Tonicity", definition: "Relative solute on two sides"}, {term: "", definition: "x"}]},
    {kind: "youtube", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", host: "youtube.com"}, "BIO101 [Osmosis]");
  const lines = txt.split("\n");
  assert.strictEqual(lines[0], "How Osmosis Works");
  assert(/From the YouTube video “How Osmosis Works”, summarized in AI's own words\./.test(txt));
  assert(txt.includes("Source: How Osmosis Works, https://www.youtube.com/watch?v=dQw4w9WgXcQ"));
  assert(txt.includes("Flashcards: [[BIO101 Osmosis]]"));
  assert(txt.includes("• Water crosses membranes") && txt.includes("• Tonicity: Relative solute on two sides") && !/•\s*$/m.test(txt));
});
t("a transcript copied from YouTube becomes running text", () => {
  const c = L.cleanTranscript("Transcript\nSearch in video\n0:00\nhey everyone welcome back\n0:04\n[Music]\nso today we're looking at\n0:07\nthe Krebs cycle\n1:02:03\n2 minutes, 5 seconds\nand that's it\n");
  assert.strictEqual(c.text, "hey everyone welcome back so today we're looking at the Krebs cycle and that's it");
  assert.strictEqual(c.removed, 4);
  assert.strictEqual(L.cleanTranscript("0:00 hello there\n0:03 >> general kenobi").text, "hello there general kenobi");
  assert.strictEqual(L.cleanTranscript("(0:12) [Applause] thanks , everyone").text, "thanks, everyone");
});
t("subtitle files (SRT and WebVTT) lose their numbers and times", () => {
  const srt = "1\n00:00:01,000 --> 00:00:04,000\nMitochondria make ATP.\n\n2\n00:00:04,500 --> 00:00:07,000\n<i>Mostly</i> in the inner membrane.\n";
  assert.strictEqual(L.cleanTranscript(srt).text, "Mitochondria make ATP. Mostly in the inner membrane.");
  assert.strictEqual(L.cleanTranscript("WEBVTT\nKind: captions\nLanguage: en\n\n00:01.000 --> 00:03.000\nPhotosynthesis\n").text, "Photosynthesis");
  assert.strictEqual(L.cleanTranscript("Plain notes with no timestamps.\nSecond line.").text, "Plain notes with no timestamps. Second line.");
  assert.strictEqual(L.cleanTranscript("").text, "");
});
t("a share that is just a YouTube video is recognised; a task that mentions one isn't", () => {
  assert.strictEqual(L.videoFromShare({text: "https://youtu.be/dQw4w9WgXcQ?si=abc"}).id, "dQw4w9WgXcQ");
  assert.strictEqual(L.videoFromShare({title: "Krebs Cycle in 5 Minutes", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}).id, "dQw4w9WgXcQ");
  assert.strictEqual(L.videoFromShare({text: "Watch this! https://m.youtube.com/watch?v=dQw4w9WgXcQ"}).id, "dQw4w9WgXcQ");
  assert.strictEqual(L.videoFromShare({text: "Bio lab report due Friday at 5pm, read chapter 4 first and finish the worksheet questions 1 through 12 before the lab session starts, see https://youtu.be/dQw4w9WgXcQ for the demo"}), null);
  assert.strictEqual(L.videoFromShare({text: "https://example.com/article"}), null);
  assert.strictEqual(L.videoFromShare({text: "https://www.youtube.com/@CrashCourse"}), null);
  assert.strictEqual(L.videoFromShare({}), null);
});
console.log(`\n${n} passed`);
