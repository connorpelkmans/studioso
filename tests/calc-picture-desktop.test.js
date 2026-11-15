// The desktop app's side of the calculator's Capture from Screen, as far as it can be checked without Electron:
// the page's bridge (preload.js), the overlay's bridge (shot-preload.js) and how main.js wires them.
// Run: node tests/calc-picture-desktop.test.js
const fs = require("fs"), path = require("path"), assert = require("assert"), Module = require("module");
const root = path.join(__dirname, "..");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };

// Load a preload with a stand-in for electron, and return what it exposes plus what it sent
function load(file){
  const exposed = {}, sent = [], invoked = [], on = {};
  const electron = {
    contextBridge: {exposeInMainWorld: (k, v) => { exposed[k] = v; }},
    ipcRenderer: {invoke: (...a) => { invoked.push(a); return Promise.resolve(true); }, send: (...a) => sent.push(a), on: (ch, fn) => { on[ch] = fn; }}
  };
  const orig = Module._load;
  Module._load = function(req, ...rest){ return req === "electron" ? electron : orig.call(this, req, ...rest); };
  try { delete require.cache[require.resolve(file)]; require(file); } finally { Module._load = orig; }
  return {exposed, sent, invoked, on};
}

// The page's bridge
{ const {exposed, sent, invoked, on} = load(path.join(root, "preload.js"));
  const d = exposed.studiosoDesktop;
  ok(d && typeof d.captureEquation === "function" && typeof d.onEquationShot === "function", "the page can ask for a capture (captureEquation) and hear back (onEquationShot)");
  d.captureEquation();
  ok(invoked.some(a => a[0] === "shot:calc" && a.length === 1), "captureEquation asks main for shot:calc with nothing else");
  let got = null; d.onEquationShot(b => { got = b; });
  ok(sent.some(a => a[0] === "desk:listen" && a[1] === "desk:calc-shot"), "onEquationShot tells main the page is listening on desk:calc-shot");
  on["desk:calc-shot"]({}, [255, 216, 255]);
  ok(got instanceof Uint8Array && got[0] === 255 && got.length === 3, "the JPEG bytes reach the page as a Uint8Array");
  ok(typeof d.captureScreen === "function" && typeof d.onScreenshot === "function", "Screenshot to Studyboard's bridge is still there");
}

// The overlay's bridge passes the mode through, and only "calc" or ""
{ const {exposed, on} = load(path.join(root, "shot-preload.js"));
  const calls = []; exposed.studyboardShot.onInit((url, mode) => calls.push([url, mode]));
  on["shot:init"]({}, "data:image/png;base64,AA", "calc"); on["shot:init"]({}, "data:image/png;base64,AA"); on["shot:init"]({}, "data:image/png;base64,AA", "<b>x</b>"); on["shot:init"]({}, "javascript:alert(1)", "calc");
  ok(calls.length === 3 && calls[0][1] === "calc" && calls[1][1] === "" && calls[2][1] === "", "the overlay hears calc mode, and anything else as the plain screenshot");
}

// main.js
{ const src = fs.readFileSync(path.join(root, "main.js"), "utf8");
  ok(/const PAGE_CHANNELS = \[[^\]]*"desk:calc-shot"/.test(src), "desk:calc-shot is a channel the page may listen on");
  ok(/ipcMain\.handle\("shot:calc", e => \{ if \(!fromMain\(e\)/.test(src), "shot:calc is only accepted from Studyboard's own page");
  ok(/toPage\(calc \? "desk:calc-shot" : "desk:screenshot", out\)/.test(src), "the boxed part goes to the calculator in calc mode, to Quick Capture otherwise");
  ok(/send\("shot:init", shotImg\.toDataURL\(\), shotMode\)/.test(src), "the overlay is told its mode");
  ok(/shotMode === "calc" && win && !win\.isDestroyed\(\) && win\.isVisible\(\)[^\n]*\n\s*shotHid = true;\n\s*if \(process\.platform === "darwin"\) win\.hide\(\); else win\.minimize\(\);/.test(src), "Studyboard's window steps aside before the screen is captured for the calculator");
  const start = src.slice(src.indexOf("async function startShot("), src.indexOf("function closeShot("));
  ok(start.indexOf("getMediaAccessStatus(\"screen\")") > 0 && start.indexOf("getMediaAccessStatus(\"screen\")") < start.indexOf("win.hide()"), "the Screen Recording check comes first (no hiding when it's denied)");
  ok(/fail\("Allow Studyboard under System Settings > Privacy & Security > Screen Recording, then try again\."\)/.test(start) && /function shotBack\(\)/.test(src) && /const fail = body => \{[^}]*shotBack\(\)/.test(start), "a denied Screen Recording permission says the same thing and brings Studyboard back");
  ok(/shotWin\.on\("closed", \(\) => \{[^\n]*if \(shotMode === "calc"\) shotBack\(\)/.test(src), "cancelling the overlay brings Studyboard back");
  ok(/const CALC_SHOT_KEY = "CommandOrControl\+Shift\+Alt\+E"/.test(src) && /if \(globalShortcut\.register\(CALC_SHOT_KEY, \(\) => startShot\("calc"\)\)\) calcShotRegistered = CALC_SHOT_KEY/.test(src), "the calculator's shortcut is only claimed when it's free");
  ok(/registerCalcShotKey\(\);/.test(src) && /calcShotKey: calcShotRegistered/.test(src), "it's registered at start and reported to the page (for the button's tip)");
  ok(/globalShortcut\.register\(shotKey\(\), \(\) => startShot\(\)\)/.test(src), "Screenshot to Studyboard's own shortcut is unchanged");
}
console.log(`calc-picture-desktop.test: ${n} checks passed`);
