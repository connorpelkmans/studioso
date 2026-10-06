// Builds lms-mobile.js (the phone apps' school site layer) from lms-mobile.src.js and lms.js, so the iPhone and Android apps run the very same
// harvest scripts and result cleaning as the desktop app. Usage: node scripts/build-lms-mobile.js [outFile]   (prepare.js calls build(out))
const fs = require("fs"), path = require("path"), Module = require("module");
const root = path.join(__dirname, "..");

function loadLms() {
  const realLoad = Module._load;
  Module._load = function (req, ...rest) {
    if (req === "electron") return { app: { isPackaged: true, userAgentFallback: "" }, BrowserWindow: function () {}, ipcMain: { handle() {} }, net: {}, session: {} };
    return realLoad.call(this, req, ...rest);
  };
  try { return require(path.join(root, "lms.js")); } finally { Module._load = realLoad; }
}
// Text of lms.js between two markers (both must exist, so a rename in lms.js fails the build instead of silently shipping a stale copy)
function slice(src, from, to) {
  const a = src.indexOf(from), b = src.indexOf(to, a + 1);
  if (a < 0 || b < 0) throw new Error("build-lms-mobile: marker not found in lms.js: " + (a < 0 ? from : to));
  return src.slice(a, b);
}
function build(outFile) {
  const L = loadLms(), lmsSrc = fs.readFileSync(path.join(root, "lms.js"), "utf8"), shim = fs.readFileSync(path.join(root, "lms-mobile.src.js"), "utf8");
  const httpsLine = (lmsSrc.match(/^const httpsOnly = .*$/m) || [])[0];
  if (!httpsLine) throw new Error("build-lms-mobile: httpsOnly not found in lms.js");
  const fromLms = [
    "  // ---- copied from lms.js: origin rules, then result cleaning ----",
    "  var TEST_MODE = false;",
    slice(lmsSrc, "// \"learn.example.edu\"", "// Addresses that are not on the public internet"),
    httpsLine,
    slice(lmsSrc, "const KEY_OK =", "function connect(")
  ].join("\n");
  const SAFE = "@@SAFE@@", providers = {}, harvest = {}, who = {};
  for (const id of Object.keys(L.P)) {
    const Pv = L.P[id];
    providers[id] = { home: Pv.home, ctx: Pv.ctx };
    harvest[id] = L.harvestScript(Pv, SAFE);
    who[id] = L.WHO[id];
  }
  const scripts = { providers, harvest, who, bsFile: L.BS_FILE("{{ou}}", "{{folder}}", "{{id}}"), cvFile: L.CV_FILE("{{id}}"), mail: `(${L.cvMail.toString()})(${JSON.stringify(SAFE)})` };
  const out = shim.replace("/*@@FROM_LMS_JS@@*/", () => fromLms).replace("/*@@SCRIPTS@@*/null", () => JSON.stringify(scripts));
  if (out.includes("@@FROM_LMS_JS@@") || out.includes("@@SCRIPTS@@")) throw new Error("build-lms-mobile: a placeholder was not filled");
  if (outFile) { fs.mkdirSync(path.dirname(outFile), { recursive: true }); fs.writeFileSync(outFile, out); }
  return out;
}
module.exports = { build };
if (require.main === module) { const f = path.resolve(process.argv[2] || path.join(root, "lms-mobile.js")); build(f); console.log("Wrote " + f); }
