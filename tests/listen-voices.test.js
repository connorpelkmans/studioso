// node tests/listen-voices.test.js
// Listen picks the best voice the device offers (Web Speech API), from realistic voice lists
const assert = require("assert");
const src = require("../scripts/app-files").source();
const a = src.indexOf("/*LISTEN-START*/"), b = src.indexOf("/*LISTEN-END*/", a);
assert(a > 0 && b > a, "the LISTEN block is in the app");
const V = new Function(src.slice(a + 16, b) + "; return {voiceRank, rankVoices, bestVoice};")();
let n = 0; const t = (name, fn) => { fn(); n++; console.log("ok -", name); };
const v = (name, lang, extra) => Object.assign({name, lang, voiceURI: name, localService: true, default: false}, extra || {});
const names = list => list.map(x => x.v.name);

// Chrome on a Mac: macOS voices (with the novelty and Eloquence ones) plus Chrome's Google network voices
const CHROME_MAC = [v("Albert", "en-US"), v("Bad News", "en-US"), v("Bells", "en-US"), v("Boing", "en-US"), v("Bubbles", "en-US"), v("Cellos", "en-US"), v("Daniel", "en-GB"),
  v("Eddy (English (US))", "en-US"), v("Flo (English (US))", "en-US"), v("Fred", "en-US"), v("Good News", "en-US"), v("Grandma (English (US))", "en-US"), v("Jester", "en-US"), v("Junior", "en-US"),
  v("Karen", "en-AU"), v("Kathy", "en-US"), v("Moira", "en-IE"), v("Organ", "en-US"), v("Ralph", "en-US"), v("Reed (English (US))", "en-US"), v("Rishi", "en-IN"),
  v("Samantha", "en-US", {default: true}), v("Superstar", "en-US"), v("Trinoids", "en-US"), v("Whisper", "en-US"), v("Wobble", "en-US"), v("Zarvox", "en-US"), v("Thomas", "fr-FR"), v("Anna", "de-DE"),
  v("Google Deutsch", "de-DE", {localService: false}), v("Google US English", "en-US", {localService: false}), v("Google UK English Female", "en-GB", {localService: false}), v("Google UK English Male", "en-GB", {localService: false}), v("Google français", "fr-FR", {localService: false})];
// Edge on Windows: the SAPI desktop voices and the Online (Natural) ones
const EDGE_WIN = [v("Microsoft David - English (United States)", "en-US", {default: true}), v("Microsoft Mark - English (United States)", "en-US"), v("Microsoft Zira - English (United States)", "en-US"),
  v("Microsoft Aria Online (Natural) - English (United States)", "en-US", {localService: false}), v("Microsoft Guy Online (Natural) - English (United States)", "en-US", {localService: false}),
  v("Microsoft Jenny Online (Natural) - English (United States)", "en-US", {localService: false}), v("Microsoft Sonia Online (Natural) - English (United Kingdom)", "en-GB", {localService: false}),
  v("Microsoft Katja Online (Natural) - German (Germany)", "de-DE", {localService: false}), v("Microsoft Denise Online (Natural) - French (France)", "fr-FR", {localService: false})];
// Chrome on Windows: no Natural voices, Google ones instead
const CHROME_WIN = EDGE_WIN.filter(x => !/Online/.test(x.name)).concat([v("Google US English", "en-US", {localService: false}), v("Google UK English Female", "en-GB", {localService: false})]);
// Safari on an iPhone with an Enhanced and a Premium voice downloaded
const IOS = [v("Albert", "en-US"), v("Bad News", "en-US"), v("Fred", "en-US"), v("Samantha", "en-US", {default: true}), v("Ava (Enhanced)", "en-US"), v("Ava (Premium)", "en-US"), v("Zoe (Enhanced)", "en-US"),
  v("Daniel (Enhanced)", "en-GB"), v("Karen", "en-AU"), v("Amélie", "fr-CA"), v("Junior", "en-US")];
// Chrome on Android: Speech Services by Google
const ANDROID = [v("English United States", "en-US", {default: true}), v("English United Kingdom", "en-GB"), v("English India", "en-IN"), v("Deutsch Deutschland", "de-DE"),
  {name: "en-us-x-tpf-network", voiceURI: "en-us-x-tpf-network", lang: "en-US", localService: false}, {name: "en-us-x-sfg-local", voiceURI: "en-us-x-sfg-local", lang: "en-US", localService: true}];
// Chromium on Linux with speech-dispatcher: eSpeak only
const LINUX = [v("English (America) eSpeak NG", "en-US", {voiceURI: "espeak-ng English (America)", default: true}), v("English (Great Britain) eSpeak NG", "en-GB", {voiceURI: "espeak-ng English (Great Britain)"}), v("German eSpeak NG", "de", {voiceURI: "espeak-ng German"})];

t("Chrome on a Mac: Google US English, never a novelty voice", () => {
  const r = V.rankVoices(CHROME_MAC, "en-US");
  assert.strictEqual(V.bestVoice(CHROME_MAC, "en-US").name, "Google US English");
  assert.deepStrictEqual(names(r.slice(0, 2)), ["Google US English", "Samantha"]);
  assert(r.findIndex(x => x.v.name === "Samantha") < r.findIndex(x => x.v.name === "Fred"), "Samantha before Fred");
  ["Albert", "Bad News", "Bells", "Boing", "Bubbles", "Cellos", "Fred", "Good News", "Jester", "Junior", "Kathy", "Organ", "Ralph", "Superstar", "Trinoids", "Whisper", "Wobble", "Zarvox", "Eddy (English (US))", "Grandma (English (US))", "Reed (English (US))", "Flo (English (US))"]
    .forEach(nm => assert.strictEqual(r.find(x => x.v.name === nm).tier, "robotic", nm));
  const firstRobot = r.findIndex(x => x.tier === "robotic"), lastMine = r.map(x => x.mine && x.tier !== "robotic").lastIndexOf(true);
  assert(lastMine < firstRobot, "every usable English voice comes before the robotic ones");
  assert.strictEqual(r.find(x => x.v.name === "Google US English").tier, "enhanced");
  assert(r.findIndex(x => x.v.name === "Google UK English Female") < r.findIndex(x => x.v.name === "Google Deutsch"), "English before German for an English speaker");
});
t("Chrome on a Mac in the UK and in Germany", () => {
  assert(/^Google UK English/.test(V.bestVoice(CHROME_MAC, "en-GB").name));
  assert.strictEqual(V.bestVoice(CHROME_MAC, "de-DE").name, "Google Deutsch");
  assert.strictEqual(V.bestVoice(CHROME_MAC, "fr-FR").name, "Google français");
});
t("Edge on Windows: a Natural voice, not the desktop default", () => {
  const best = V.bestVoice(EDGE_WIN, "en-US");
  assert(/Online \(Natural\) - English \(United States\)/.test(best.name), best.name);
  const r = V.rankVoices(EDGE_WIN, "en-US");
  assert(r.slice(0, 3).every(x => x.tier === "natural" && x.v.lang === "en-US"), names(r.slice(0, 3)).join());
  assert.strictEqual(r[3].v.name, "Microsoft Sonia Online (Natural) - English (United Kingdom)", "then other English Natural voices");
  assert(/Natural/.test(V.bestVoice(EDGE_WIN, "en-GB").name) && /Sonia/.test(V.bestVoice(EDGE_WIN, "en-GB").name));
  assert(/Katja/.test(V.bestVoice(EDGE_WIN, "de-DE").name));
});
t("Chrome on Windows: Google US English over the SAPI voices", () => assert.strictEqual(V.bestVoice(CHROME_WIN, "en-US").name, "Google US English"));
t("Safari on an iPhone: the Premium voice, then Enhanced", () => {
  const r = V.rankVoices(IOS, "en-US");
  assert.strictEqual(r[0].v.name, "Ava (Premium)");
  assert.deepStrictEqual(names(r.slice(1, 3)).sort(), ["Ava (Enhanced)", "Zoe (Enhanced)"]);
  assert.strictEqual(r.find(x => x.v.name === "Daniel (Enhanced)").tier, "enhanced");
  assert(r.findIndex(x => x.v.name === "Samantha") < r.findIndex(x => x.v.name === "Albert"));
  assert.strictEqual(V.bestVoice(IOS, "en-GB").name, "Daniel (Enhanced)");
});
t("Chrome on Android: a network voice, else the default English one", () => {
  assert.strictEqual(V.bestVoice(ANDROID, "en-US").name, "en-us-x-tpf-network");
  assert.strictEqual(V.bestVoice(ANDROID.slice(0, 4), "en-US").name, "English United States");
  assert.strictEqual(V.bestVoice(ANDROID, "en-GB").name, "English United Kingdom");
});
t("Linux with eSpeak only: no automatic pick (the browser default), all marked robotic", () => {
  assert.strictEqual(V.bestVoice(LINUX, "en-US"), null);
  assert(V.rankVoices(LINUX, "en-US").every(x => x.tier === "robotic"));
  assert.strictEqual(V.rankVoices(LINUX, "en-US")[0].v.lang, "en-US", "still sorted by language");
});
t("no voices yet, odd input", () => {
  assert.strictEqual(V.bestVoice([], "en-US"), null);
  assert.deepStrictEqual(V.rankVoices(null, "en-US"), []);
  assert.strictEqual(V.bestVoice([v("Samantha", "en_US")], "en-US").name, "Samantha", "en_US is English too");
  assert.strictEqual(V.bestVoice([v("Thomas", "fr-FR")], "en-US"), null, "no voice in the student's language: the browser decides");
});
console.log(`\n${n} passed`);
