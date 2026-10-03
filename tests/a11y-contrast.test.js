// node tests/a11y-contrast.test.js
// The theme contrast guard (ensureContrast in index.html): a colour that fails is nudged just far enough, one that passes is left alone.
const fs = require("fs"), path = require("path"), assert = require("assert");
const src = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const a = src.indexOf("const HEX6 = "), b = src.indexOf("function skinVars(s, dark){");
assert(a > 0 && b > a, "contrast helpers not found");
const C = new Function(src.slice(a, b) + "; return {ensureContrast, hexContrast, hexLum};")();
let n = 0; const t = (name, fn) => { fn(); n++; console.log("ok -", name); };

t("contrast of black on white is 21, same colour is 1", () => { assert.strictEqual(Math.round(C.hexContrast("#000000", "#FFFFFF")), 21); assert.strictEqual(C.hexContrast("#336699", "#336699"), 1); });
t("a passing colour is returned unchanged", () => assert.strictEqual(C.ensureContrast("#1C2433", ["#FFFFFF", "#F3F5F8"], 4.5), "#1C2433"));
t("a failing grey on white is darkened to the target", () => { const o = C.ensureContrast("#9AA3B4", ["#FFFFFF", "#F3F5F8"], 4.5); assert(C.hexContrast(o, "#FFFFFF") >= 4.5 && C.hexContrast(o, "#F3F5F8") >= 4.5, o); assert(C.hexLum(o) < C.hexLum("#9AA3B4")); });
t("on a dark background the colour is lightened instead", () => { const o = C.ensureContrast("#556070", ["#11141A", "#1A1F28"], 4.5); assert(C.hexContrast(o, "#1A1F28") >= 4.5, o); assert(C.hexLum(o) > C.hexLum("#556070")); });
t("white button text on a pale accent: the accent is darkened until it reads", () => { const o = C.ensureContrast("#8CC152", ["#FFFFFF"], 4.5); assert(C.hexContrast(o, "#FFFFFF") >= 4.5, o); });
t("a light label on a mid-tone side bar darkens the bar", () => { const o = C.ensureContrast("#5C9A4A", ["#FFFFFF"], 5.5); assert(C.hexContrast(o, "#FFFFFF") >= 5.5, o); });
t("anything that is not a 6-digit hex is left alone", () => { assert.strictEqual(C.ensureContrast("rgba(0,0,0,.5)", ["#FFFFFF"], 4.5), "rgba(0,0,0,.5)"); assert.strictEqual(C.ensureContrast("#abc", ["#FFFFFF"], 4.5), "#abc"); assert.strictEqual(C.ensureContrast("#9AA3B4", [], 4.5), "#9AA3B4"); });
console.log(`${n} contrast checks passed`);
