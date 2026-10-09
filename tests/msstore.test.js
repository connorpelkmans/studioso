// Microsoft Store (MSIX) build guards (static checks, no browser). Run: node tests/msstore.test.js
//  1. package.json build.appx has the identity fields, the tiles exist at every scale with the right pixel sizes (no electron-builder sample art)
//  2. electron-builder's own manifest writer turns the config into a valid AppxManifest with the studyboard:// link and an off-by-default startup task
//  3. main.js and preload.js handle the packaged app: no app ID override, no registry protocol call, start-at-login through Windows Settings
//  4. the screenshot shortcuts on Windows never use Ctrl+Alt+letter alone (that is AltGr on many keyboards)
"use strict";
const fs = require("fs"), path = require("path"), assert = require("assert");
const root = path.join(__dirname, "..");
const read = p => fs.readFileSync(path.join(root, p), "utf8");
let n = 0; const ok = (c, m) => { n++; assert(c, m); };

/* ---------- 1. config and images ---------- */
const pkg = JSON.parse(read("package.json")), appx = pkg.build.appx;
ok(appx && appx.identityName && appx.publisher && appx.publisherDisplayName, "build.appx has identityName, publisher and publisherDisplayName");
ok(/^CN=/.test(appx.publisher), "publisher is a CN= value (copied from Partner Center)");
ok(appx.publisherDisplayName.length <= 50, "publisher display name fits Partner Center's 50 characters");
ok(appx.publisherDisplayName === pkg.author.name && pkg.build.copyright.includes(appx.publisherDisplayName), "the same publisher name in author, copyright and the Store package");
ok(appx.addAutoLaunchExtension === false && fs.existsSync(path.join(root, appx.customExtensionsPath)), "the startup task comes from our own extension file, not electron-builder's (which is on by default)");
ok(/--win appx --x64 --arm64/.test(pkg.scripts["dist:msstore"]), "dist:msstore builds x64 and arm64 packages");
const size = f => { const b = fs.readFileSync(f); assert(b.toString("ascii", 1, 4) === "PNG", f + " is a PNG"); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
const dir = path.join(root, "build-resources", "appx");
const BASE = {StoreLogo: [50, 50], Square44x44Logo: [44, 44], Square150x150Logo: [150, 150], Wide310x150Logo: [310, 150], LargeTile: [310, 310], SmallTile: [71, 71]};
for (const [name, [w, h]] of Object.entries(BASE)) for (const sc of [100, 125, 150, 200, 400]) {
  const f = path.join(dir, `${name}.scale-${sc}.png`);
  ok(fs.existsSync(f), `${name}.scale-${sc}.png exists`);
  const [W, H] = size(f);
  ok(W === Math.round(w * sc / 100) && H === Math.round(h * sc / 100), `${name}.scale-${sc}.png is ${Math.round(w * sc / 100)}x${Math.round(h * sc / 100)} (got ${W}x${H})`);
}
for (const t of [16, 24, 32, 48, 256]) for (const alt of ["", "_altform-unplated", "_altform-lightunplated"]) {
  const f = path.join(dir, `Square44x44Logo.targetsize-${t}${alt}.png`);
  ok(fs.existsSync(f) && size(f)[0] === t, `taskbar icon ${t}px${alt} exists`);
}
ok(/build-resources", "appx"/.test(read("prepare.js")), "prepare.js stages the tiles into build/appx (it empties build/ first)");

/* ---------- 2. the manifest electron-builder writes ---------- */
const AT = path.join(root, "node_modules/app-builder-lib/out/targets/AppxTarget.js");
if (fs.existsSync(AT)) {
  const AppX = require(AT).default, {Arch} = require(path.join(root, "node_modules/builder-util"));
  const t = Object.create(AppX.prototype);
  t.options = Object.assign({}, appx, /REPLACE_WITH_/.test(appx.identityName) ? {identityName: "12345ConnorPelkmans.Studyboard"} : {});
  t.packager = {appInfo: {productFilename: pkg.build.win.executableName, productName: pkg.productName, description: pkg.description, companyName: pkg.author.name, name: pkg.name,
    getVersionInWeirdWindowsForm: () => pkg.version + ".0"}, config: pkg.build, platformSpecificBuildOptions: pkg.build.win, info: {appDir: root, metadata: pkg},
    getResource: async p => p ? path.join(root, p) : null};
  const out = path.join(require("os").tmpdir(), "studyboard-appxmanifest-" + process.pid + ".xml");
  t.writeManifest(out, Arch.x64, appx.publisher, fs.readdirSync(dir)).then(() => {
    const xml = fs.readFileSync(out, "utf8"); fs.unlinkSync(out);
    ok(/<uap:Protocol Name="studyboard">/.test(xml), "the manifest registers studyboard:// links");
    ok(/<desktop:StartupTask TaskId="StudyboardStartup" Enabled="false"/.test(xml), "the startup task is declared and off until the person turns it on");
    ok(new RegExp(`Executable="app\\\\${pkg.build.win.executableName}\\.exe"`).test(xml.split("windows.startupTask")[1] || ""), "the startup task points at the app's own exe");
    ok(/Square310x310Logo="assets\\LargeTile.png"/.test(xml) && /Square71x71Logo="assets\\SmallTile.png"/.test(xml), "large and small tiles are in the manifest");
    ok(!/SampleAppx/.test(xml), "no sample art");
    ok((xml.match(/<Extensions>/g) || []).length === 1 && (xml.match(/<\/Extensions>/g) || []).length === 1, "one well-formed Extensions block");
    finish();
  }).catch(e => { console.error(e); process.exit(1); });
} else { console.log("(app-builder-lib not installed: manifest check skipped)"); setImmediate(finish); }

/* ---------- 3. main.js / preload.js ---------- */
const main = read("main.js"), preload = read("preload.js");
ok(/const IS_MSSTORE = !!process\.windowsStore/.test(main), "main.js knows when it runs from the Microsoft Store");
ok(/if \(!IS_MSSTORE\) app\.setAppUserModelId\(/.test(main), "the packaged app keeps the app ID Windows gives it (notifications)");
ok(/app\.isPackaged && !IS_MAS && !IS_MSSTORE\) \{/.test(main), "no registry protocol registration in the Store build (the manifest does it)");
ok(/process\.platform === "win32" && !IS_MSSTORE/.test(main) && /startupSettings: IS_MSSTORE/.test(main), "the Store build offers Windows Startup Settings instead of a toggle that does nothing");
ok(/shell\.openExternal\("ms-settings:startupapps"\)/.test(main), "Startup Settings opens a fixed ms-settings address");
ok(/storeArg === "mas" \|\| storeArg === "msstore"/.test(preload) && /openStartupSettings/.test(preload), "preload passes the store and the startup-settings call to the page");
const page = read("index.html");
ok(/data-act="sbw-startup"/.test(page) && /act === "sbw-startup"/.test(page), "Settings, Widgets and Desktop has the Open Startup Settings button");
ok(/DESK && \(DESK\.mas \|\| DESK\.store === "mas"\)/.test(page), "only the Mac App Store build uses in-app purchase; the Microsoft Store build buys like the direct download");

/* ---------- 4. screenshot shortcuts ---------- */
const keys = main.match(/: \["CommandOrControl\+Shift\+Alt\+C"[^\]]*\]/);
ok(keys, "Windows/Linux shortcut list found");
for (const k of JSON.parse(keys[0].slice(2))) ok(/Shift/.test(k), `${k} is not Ctrl+Alt+letter (AltGr) on Windows`);

function finish(){ console.log(`msstore: ${n} checks passed`); }
