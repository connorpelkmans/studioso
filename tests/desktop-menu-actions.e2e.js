// node tests/desktop-menu-actions.e2e.js   (Linux needs a display: xvfb-run -a node tests/desktop-menu-actions.e2e.js)
// The desktop app (Mac and Windows): Settings… in the app menu (and its Cmd/Ctrl+, shortcut) opens Settings, also while a sheet such
// as the Welcome or New Task is open and after the window was hidden. It used to do nothing then: the main process forgot what the
// page listens for when a frame inside the page started loading, so menu, Dock, tray and reminder actions were never delivered.
// Runs the real app (main.js, preload.js and app/, built by prepare.js); skipped when Electron isn't installed.
const fs = require("fs"), os = require("os"), path = require("path"), assert = require("assert"), {execFileSync} = require("child_process");
const root = path.join(__dirname, "..");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
let exe = ""; try { exe = require(path.join(root, "node_modules", "electron")); } catch (e) {}
if (!exe || !fs.existsSync(exe)) { console.log("desktop-menu-actions.e2e: skipped (Electron isn't installed: node node_modules/electron/install.js)"); process.exit(0); }
if (process.platform === "linux" && !process.env.DISPLAY) { console.log("desktop-menu-actions.e2e: skipped (no display; run it with xvfb-run -a)"); process.exit(0); }
(async () => {
  execFileSync(process.execPath, [path.join(root, "prepare.js")], {cwd: root, stdio: "ignore"});
  const {_electron} = require("playwright");
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "sbdesk-"));
  const app = await _electron.launch({executablePath: exe, args: [root, "--no-sandbox", "--user-data-dir=" + home], env: Object.assign({}, process.env, {HOME: home}), timeout: 60000});
  const errs = [];
  try {
    const win = await app.firstWindow(); win.on("pageerror", e => errs.push(e.message));
    await win.waitForLoadState(); await win.waitForFunction(() => window.studiosoDesktop && document.querySelector("#view"), null, {timeout: 30000}); await win.waitForTimeout(3000);
    const open = () => win.evaluate(() => { const d = document.querySelector("dialog[open]"); return d ? ((d.querySelector("h2") || d).textContent || "").trim() : ""; });
    const close = () => win.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close()));
    const menu = async () => { const r = await app.evaluate(({Menu}) => { const find = items => { for (const i of items) { if (/^Settings/.test(i.label || "")) return i; if (i.submenu) { const f = find(i.submenu.items); if (f) return f; } } return null; }; const it = find(Menu.getApplicationMenu().items); if (!it) return ""; it.click(); return it.accelerator; }); await win.waitForTimeout(1500); return r; };
    // first launch: the Welcome is open
    const first = await open();
    const acc = await menu();
    ok(acc === "CmdOrCtrl+,", "Settings… is in the app menu with Cmd/Ctrl+,");
    ok(/Settings/.test(await open()), `Settings… opens Settings over the first-launch sheet (${first || "none"})`);
    await close(); await win.evaluate(() => { const b = document.querySelector('[data-act="new-task"]'); if (b) b.click(); }); await win.waitForTimeout(800);
    const was = await open(); await menu();
    ok(/Settings/.test(await open()), `and over another open sheet (${was})`);
    await close(); await app.evaluate(({BrowserWindow}) => BrowserWindow.getAllWindows().forEach(w => w.hide())); await win.waitForTimeout(400);
    await menu();
    ok(/Settings/.test(await open()) && await app.evaluate(({BrowserWindow}) => BrowserWindow.getAllWindows().some(w => w.isVisible())), "and from a hidden window, which comes back");
    await close(); await win.reload(); await win.waitForFunction(() => window.studiosoDesktop && document.querySelector("#view"), null, {timeout: 30000}); await win.waitForTimeout(2500); await close();
    await menu();
    ok(/Settings/.test(await open()), "and after the page reloads");
    ok(!errs.length, "no page errors" + (errs.length ? ": " + errs.join(" | ") : ""));
    console.log("desktop-menu-actions.e2e: " + n + " checks passed");
  } finally { await app.close(); }
})().catch(e => { console.error(e); process.exit(1); });
