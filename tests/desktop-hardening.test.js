// Desktop main-process hardening, run against a fake Electron (no Electron needed)
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), assert = require("assert"), Module = require("module"), crypto = require("crypto"), cp = require("child_process");
const root = path.join(__dirname, "..");
let n = 0; const ok = (c, m) => { n++; assert(c, m); };

// A stand-in for any Electron object
function fake(over) {
  const store = Object.assign({}, over);
  return new Proxy(function () {}, {
    get: (t, k) => k in store ? store[k] : typeof k === "symbol" || k === "then" ? undefined : (store[k] = fake()),
    set: (t, k, v) => { store[k] = v; return true; },
    apply: () => undefined,
    construct: () => fake()
  });
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sb-harden-"));
for (const d of ["documents", "userData", "appData", "temp"]) fs.mkdirSync(path.join(tmp, d), { recursive: true });

function load(packaged, platform) {
  const E = { handlers: {}, opened: [], shown: [], fetched: [], sandbox: false, dialogs: [], dialogAnswer: 1, proto: null, ready: null };
  const electron = {
    app: fake({ isPackaged: packaged, getPath: k => path.join(tmp, k), requestSingleInstanceLock: () => true, isReady: () => true, getVersion: () => "1.0.0",
      whenReady: () => ({ then: f => { E.ready = Promise.resolve().then(f); return E.ready; } }), on() {}, quit() {}, enableSandbox: () => { E.sandbox = true; } }),
    ipcMain: { handle: (c, f) => { E.handlers[c] = f; }, on: (c, f) => { E.handlers[c] = f; } },
    protocol: { registerSchemesAsPrivileged() {}, handle: (s, f) => { E.proto = f; } },
    net: fake({ fetch: async u => { E.fetched.push(u); return { headers: {}, body: "x", status: 200 }; } }),
    shell: { openPath: async p => { E.opened.push(p); return ""; }, showItemInFolder: p => { E.shown.push(p); }, openExternal: async () => {} },
    session: fake({ fromPartition: () => fake() }),
    dialog: fake({ showMessageBox: async (...a) => { E.dialogs.push(a[a.length - 1]); return { response: E.dialogAnswer }; } }),
    BrowserWindow: function (o) {
      if (o && o.webPreferences && o.webPreferences.partition) return fake({ isDestroyed: () => false, destroy() {}, loadURL: async () => {},
        webContents: fake({ getURL: () => "https://school.instructure.com/", executeJavaScript: async js => E.school(js) }) });
      const w = fake({ isDestroyed: () => false }); E.win = w; return w;
    }
  };
  const el = fake(electron);
  const realLoad = Module._load, realPlatform = Object.getOwnPropertyDescriptor(process, "platform");
  Module._load = function (req, parent, isMain) {
    if (req === "electron") return el;
    if (req === "child_process" && E.exec) return { execFile: (...a) => E.exec(...a) };
    return realLoad.call(this, req, parent, isMain);
  };
  for (const f of ["main.js", "lms.js"]) delete require.cache[path.join(root, f)];
  if (platform) Object.defineProperty(process, "platform", { value: platform });
  try { require(path.join(root, "main.js")); } finally { if (platform) Object.defineProperty(process, "platform", realPlatform); }
  E.restore = () => { Module._load = realLoad; };
  E.withPlatform = async (p, fn) => { Object.defineProperty(process, "platform", { value: p }); try { return await fn(); } finally { Object.defineProperty(process, "platform", realPlatform); } };
  E.ev = () => { const wc = E.win.webContents; wc.mainFrame.url = "app://studioso/index.html"; return { sender: wc, senderFrame: wc.mainFrame }; };
  return E;
}

(async () => {
  if (process.platform === "win32") { console.log("desktop-hardening: skipped on Windows (needs symlinks and /bin/sh)"); return; }
  process.argv.push("--no-sandbox");
  const dev = load(false); await dev.ready;
  ok(!dev.sandbox, "from source, --no-sandbox still works (tests run as root in a container)");
  const docs = path.join(tmp, "documents", "Studyboard");

  /* 1. app:// blocklist */
  const get = async (E, url) => { E.fetched.length = 0; const r = await E.proto({ method: "GET", url }); return { status: r.status, csp: r.headers.get("content-security-policy"), file: E.fetched[0] || "" }; };
  for (const u of ["error-config.json", "error-config.json/", "./error-config.json", "x/../error-config.json", "x%2F..%2Ferror-config.json", "Error-Config.JSON", "error-config.json.", "error-config.json%20",
    "csp-hashes.json/", "x%2F..%2Fcsp-hashes.json", "errreport-core.js/", "x%2f..%2ferrreport-core.js", "index.html%3A%3A%24DATA", "error-config.json::$DATA"]) {
    ok((await get(dev, "app://studioso/" + u)).status === 404, `app://studioso/${u} is not served`);
  }
  ok((await get(dev, "app://widget/x%2F..%2Fwidget-preload.js")).status === 404, "the widget's preload is not served through an encoded path");
  ok((await get(dev, "app://studioso/..%2Fmain.js")).status === 404, "nothing outside the app folder");
  const page = await get(dev, "app://studioso/");
  ok(page.status === 200 && /index\.html$/.test(page.file) && /script-src/.test(page.csp), "the page itself is still served, with its CSP");
  ok((await get(dev, "app://studioso/vendor/fonts/a.woff2")).status === 200, "ordinary files are still served");

  /* 3. Mark of the Web */
  const write = dev.handlers["fs:write"], marks = [];
  dev.exec = (file, args, opts, cb) => { marks.push([file, args]); cb(null, "", ""); };
  await dev.withPlatform("win32", async () => {
    ok(await write(dev.ev(), "Files/a.pdf", new Uint8Array([1, 2]), { origin: "https://school.example/courses/1?x=y" }), "write with an origin works");
    ok(fs.readFileSync(path.join(docs, "Files", "a.pdf:Zone.Identifier"), "utf8") === "[ZoneTransfer]\r\nZoneId=3\r\nHostUrl=https://school.example\r\n", "Windows: Internet zone, origin only (no path or query)");
    await write(dev.ev(), "Files/b.pdf", "x", { untrusted: true, origin: "javascript:alert(1)\r\nZoneId=0" });
    ok(fs.readFileSync(path.join(docs, "Files", "b.pdf:Zone.Identifier"), "utf8").endsWith("HostUrl=about:internet\r\n"), "a non-https origin becomes about:internet (nothing injected)");
    await write(dev.ev(), "Files/c.pdf", "x", { untrusted: true });
    ok(fs.existsSync(path.join(docs, "Files", "c.pdf:Zone.Identifier")), "untrusted without an origin is marked too");
    await write(dev.ev(), "Files/d.pdf", "x");
    ok(!fs.existsSync(path.join(docs, "Files", "d.pdf:Zone.Identifier")), "the page's own files are not marked");
  });
  await dev.withPlatform("darwin", async () => {
    await write(dev.ev(), "Files/e.docx", "x", { origin: "https://school.example" });
    const m = marks.find(x => x[0] === "/usr/bin/xattr");
    ok(m && m[1][0] === "-w" && m[1][1] === "com.apple.quarantine" && /^0081;[0-9a-f]+;Studyboard;$/.test(m[1][2]) && m[1][3] === path.join(fs.realpathSync(path.join(docs, "Files")), "e.docx"), "macOS: quarantine attribute through xattr, the path as its own argument");
    marks.length = 0; await write(dev.ev(), "Files/f.docx", "x");
    ok(!marks.length, "macOS: the page's own files are not marked");
  });

  /* 4. openSafely */
  const open = dev.handlers["fs:open"];
  fs.writeFileSync(path.join(docs, "Files", "payload.exe"), "MZ");
  fs.symlinkSync(path.join(docs, "Files", "payload.exe"), path.join(docs, "Files", "notes.pdf"));
  dev.opened.length = 0; dev.shown.length = 0;
  ok(/^blocked/.test(await open(dev.ev(), "Files/notes.pdf")) && !dev.opened.length, "a .pdf shortcut to a program is never opened");
  fs.writeFileSync(path.join(docs, "Files", "real.txt"), "hi");
  fs.symlinkSync(path.join(docs, "Files", "real.txt"), path.join(docs, "Files", "link.txt"));
  ok(/^blocked/.test(await open(dev.ev(), "Files/link.txt")) && !dev.opened.length && dev.shown.length === 1, "a shortcut to a plain file is shown in its folder, not opened");
  fs.mkdirSync(path.join(docs, "Files", "Course")); fs.symlinkSync(path.join(docs, "Files", "Course"), path.join(docs, "Files", "Linked"));
  ok(await open(dev.ev(), "Files/Linked") === "" && dev.opened.length === 1, "a linked folder inside the Studyboard folder still opens");
  for (const ext of ["doc", "xls", "ppt", "rtf"]) {
    fs.writeFileSync(path.join(docs, "Files", "old." + ext), "x"); dev.opened.length = 0; dev.shown.length = 0;
    await open(dev.ev(), "Files/old." + ext);
    ok(!dev.opened.length && dev.shown.length === 1, `.${ext} is shown in its folder, not opened`);
  }
  dev.opened.length = 0; await open(dev.ev(), "Files/real.txt");
  ok(dev.opened.length === 1, "an ordinary file still opens");

  /* 5. focus block */
  const src = fs.readFileSync(path.join(root, "main.js"), "utf8");
  const vm = src.match(/const verify = sum => ('[^\n]*'\s*\+\s*\n\s*'[^\n]*');/);
  ok(vm, "the hosts check script is found");
  const verify = new Function("sum", "return " + vm[1].replace(/\n\s*/g, ""));
  const d = fs.mkdtempSync(path.join(tmp, "hosts-")), hostsFile = path.join(d, "hosts"), prep = path.join(d, "hosts.next");
  const sum = cp.spawnSync("/bin/sh", ["-c", "command -v sha256sum"]).status === 0 ? "sha256sum" : "shasum -a 256";
  const sh = verify(sum).replace(/\/etc\/hosts/g, hostsFile).replace("/etc/.studyboard", path.join(d, ".studyboard"));
  fs.writeFileSync(hostsFile, "orig\n"); fs.writeFileSync(prep, "swapped after the prompt\n");
  const want = crypto.createHash("sha256").update("0.0.0.0 example.com\n").digest("hex");
  let r = cp.spawnSync("/bin/sh", ["-c", sh, "sh", prep, "60", want]);
  ok(r.status === 3 && fs.readFileSync(hostsFile, "utf8") === "orig\n" && fs.readdirSync(d).length === 2, "a file changed after hashing is refused, the hosts file untouched, no temp left");
  fs.writeFileSync(prep, "0.0.0.0 example.com\n");
  r = cp.spawnSync("/bin/sh", ["-c", sh, "sh", prep, "60", want]);
  ok(r.status === 0 && fs.readFileSync(hostsFile, "utf8") === "0.0.0.0 example.com\n" && fs.readdirSync(d).length === 2, "the file Studyboard wrote is copied in");
  ok(/verify\("\/usr\/bin\/shasum -a 256"\)/.test(src) && /verify\("sha256sum"\)/.test(src), "macOS and Linux both run the check");
  ok(/ReadAllBytes\(\$\{q\(prepared\)\}\); \$h = .*ComputeHash\(\$b\).*if \(\$h -ne \$\{q\(hash\)\}\) \{ exit 3 \}; \[IO\.File\]::WriteAllBytes\(\$\{q\(HOSTS\)\}, \$b\)/.test(src), "Windows hashes and writes the same bytes, read once");
  ok(!/Copy-Item -LiteralPath \$\{q\(prepared\)\}/.test(src), "Windows no longer copies the prepared file by name");
  dev.exec = (file, args, opts, cb) => { marks.push([file, args]); cb(null, "", ""); };
  marks.length = 0;
  await dev.withPlatform("linux", () => dev.handlers["block:clear"](dev.ev()));
  ok(!marks.some(m => m[0] === "pkexec"), "clearing with no block left asks for nothing");

  /* 6. Canvas reply needs the native confirmation */
  const lms = require(path.join(root, "lms.js"));
  ok(/mail\(String\(id\), host, spec, getMain\(\)\)/.test(fs.readFileSync(path.join(root, "lms.js"), "utf8")), "the IPC handler passes the main window for the dialog");
  ok(/never posts|never submits, posts or changes anything|Read-only;/.test(fs.readFileSync(path.join(root, "lms.js"), "utf8") + fs.readFileSync(path.join(root, "preload.js"), "utf8")) === false, "no comment still claims the school sites are read-only");
  ok((await lms.mail("canvas", "school.instructure.com", { op: "send", id: "5", body: "  " })).error === "empty", "an empty reply is refused before anything");
  const ran = [];
  dev.school = js => { const spec = JSON.parse(js.slice(js.lastIndexOf(")(") + 2, -1)); ran.push(spec.op); return spec.op === "get" ? { ok: true, subject: "Lab 3 question", course: "BIO101", names: ["Dr. Reyes", "Sam Student"], messages: [] } : { ok: true }; };
  dev.dialogs.length = 0; dev.dialogAnswer = 1;
  const parent = fake({ isDestroyed: () => false });
  const cancelled = await lms.mail("canvas", "school.instructure.com", { op: "send", id: "11", body: "Sure, sending it now." }, parent);
  const box = dev.dialogs[0] || {};
  ok(cancelled.error === "cancelled" && ran.join() === "get", "Cancel sends nothing (the conversation was only read for the dialog)");
  ok(box.defaultId === 1 && box.cancelId === 1 && box.buttons[0] === "Send" && /Lab 3 question/.test(box.detail) && /Dr\. Reyes/.test(box.detail) && /Sure, sending it now\./.test(box.detail) && /school\.instructure\.com/.test(box.detail), "the dialog names the conversation, the people, the site and the message, with Cancel as the default");
  ran.length = 0; dev.dialogAnswer = 0;
  ok((await lms.mail("canvas", "school.instructure.com", { op: "send", id: "11", body: "Sure" }, parent)).ok === true && ran.join() === "get,send", "Send posts the reply");
  ran.length = 0; dev.dialogs.length = 0;
  ok((await lms.mail("canvas", "school.instructure.com", { op: "list" }, parent)).ok === true && !dev.dialogs.length, "reading the inbox asks nothing");
  dev.restore();

  /* 2. packaged: no 'unsafe-inline', sandbox always on */
  const pk = load(true); await pk.ready;
  ok(pk.sandbox, "an installed app enables the sandbox even with --no-sandbox");
  const pg = await get(pk, "app://studioso/index.html");
  const scriptSrc = (pg.csp.match(/script-src[^;]*/) || [""])[0];
  ok(scriptSrc && !/unsafe-inline/.test(scriptSrc), "an installed app without hashes allows no inline script: " + scriptSrc);
  pk.restore();

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`desktop-hardening: ${n} checks passed`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
