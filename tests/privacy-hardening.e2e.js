// Browser test for the privacy hardening (October 2026). Run: node tests/privacy-hardening.e2e.js
//  1. a Canvas access token is never kept as plain text: an old plain localStorage copy is moved into the encrypted device store and erased,
//     the stored copy doesn't contain the token, it survives a reload, and wiping the device (sign-out, another account) removes it
//  2. school calendar links never leave the device: not in synced settings, not in backup files; this device's link survives settings from the account
//  3. the bug-report error log is cleaned like crash reports (the person's own titles are hidden)
//  4. persistent storage: the app asks for it and Settings can show the result
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const FILE = "file://" + path.join(__dirname, "..", "index.html");
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const TOKEN = "7~AbCdEfGhIjKlMnOpQrStUvWxYz0123456789secret";

(async () => {
  const browser = await chromium.launch({executablePath});
  const ctx = await browser.newContext({viewport: {width: 1200, height: 800}});
  await ctx.addInitScript(([tok]) => {
    window.__SB_TEST = true;
    try {
      if (sessionStorage.getItem("seeded")) return;
      sessionStorage.setItem("seeded", "1");
      localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done");
      localStorage.setItem("studyboard:cvmail", JSON.stringify({host: "https://school.instructure.com", token: tok}));
    } catch (e) {}
  }, [TOKEN]);
  const page = await ctx.newPage(); const errs = [];
  page.on("pageerror", e => errs.push(e.message));
  try {
    await page.goto(FILE); await page.waitForTimeout(2500);

    // 1. Canvas token
    const legacyGone = await page.evaluate(() => localStorage.getItem("studyboard:cvmail"));
    ok(legacyGone === null, "the plain localStorage copy of the token is erased");
    const raw = await page.evaluate(() => new Promise(res => { const r = indexedDB.open("studyboard-secrets"); r.onsuccess = () => { const d = r.result, q = d.transaction("s").objectStore("s").get("canvas-mail"); q.onsuccess = () => { const v = q.result; d.close(); res(v ? {ct: Array.from(v.ct), iv: Array.from(v.iv)} : null); }; }; r.onerror = () => res(null); }));
    ok(raw && raw.ct.length > 0 && raw.iv.length === 12, "the token is stored as an encrypted box");
    ok(!Buffer.from(raw.ct).toString("latin1").includes(TOKEN.slice(3, 20)), "the stored box does not contain the token");
    const keyInfo = await page.evaluate(() => new Promise(res => { const r = indexedDB.open("studyboard-secrets"); r.onsuccess = () => { const d = r.result, q = d.transaction("s").objectStore("s").get("_key"); q.onsuccess = () => { const k = q.result; d.close(); res(k ? {ext: k.extractable, alg: k.algorithm.name} : null); }; }; }));
    ok(keyInfo && keyInfo.ext === false && keyInfo.alg === "AES-GCM", "the encryption key is AES-GCM and can't be exported");
    const back = await page.evaluate(async () => JSON.parse(await __sbPrivacy.DEVSECRET.get("canvas-mail")));
    ok(back.token.length > 10 && back.host === "https://school.instructure.com", "the token can be read back on this device");
    const everywhere = await page.evaluate(() => JSON.stringify(localStorage) + JSON.stringify(__sbPrivacy.exportArrays()) + JSON.stringify(__sbPrivacy.syncSettings(__sbPrivacy.settings)));
    ok(!everywhere.includes(TOKEN.slice(3, 20)), "the token is in no localStorage key, backup or synced settings");
    await page.reload(); await page.waitForTimeout(2000);
    ok(await page.evaluate(async () => !!(await __sbPrivacy.DEVSECRET.get("canvas-mail"))), "the token survives a reload");

    // 2. calendar links stay on the device
    const feeds = await page.evaluate(() => {
      const {syncSettings, exportArrays, keepLocalFeeds} = __sbPrivacy;
      __sbPrivacy.setSettings({canvas: {mode: "feed", feed: "https://school.instructure.com/feeds/calendars/user_SECRETFEED.ics"}, ai: {provider: "gemini", keys: {gemini: "AIzaFAKE"}}});
      const synced = syncSettings(__sbPrivacy.settings), backup = exportArrays();
      const mine = __sbPrivacy.settings, incoming = {canvas: {mode: "feed"}, capacity: 9};
      keepLocalFeeds(incoming, mine);
      const legacy = {canvas: {mode: "feed", feed: "https://old/f.ics"}}, hadOld = keepLocalFeeds(legacy, {});
      return {synced: JSON.stringify(synced), backup: JSON.stringify(backup.settings || {}), kept: incoming.canvas.feed, hadOld, legacyKept: legacy.canvas.feed};
    });
    ok(!/SECRETFEED/.test(feeds.synced) && !/AIzaFAKE/.test(feeds.synced), "synced settings have no calendar link and no AI key");
    ok(!/SECRETFEED/.test(feeds.backup), "backup files have no calendar link");
    ok(/SECRETFEED/.test(feeds.kept), "this device's calendar link survives settings arriving from the account");
    ok(feeds.hadOld === true && feeds.legacyKept === "https://old/f.ics", "a link an older version synced is taken in once and flagged for removal from the account");

    // 3. bug-report error log cleaning
    const scrubbed = await page.evaluate(() => {
      __sbPrivacy.addTask({id: "zz1", title: "Frog dissection lab writeup", notes: ""});
      return window.SBERR.scrub("Couldn't save Frog dissection lab writeup for me@example.com at https://school.example.edu/x?y=1");
    });
    ok(!/Frog dissection/i.test(scrubbed) && !/me@example\.com/.test(scrubbed) && !/school\.example\.edu/.test(scrubbed), "error text loses titles, emails and outside addresses: " + scrubbed);

    // 4. persistent storage
    const st = await page.evaluate(async () => ({r: await __sbPrivacy.storageProtect(false), row: typeof __sbPrivacy.storageRow() === "string"}));
    ok(["granted", "denied", "unsupported", "unknown"].includes(st.r) && st.row, "the storage check runs and Settings can show it: " + st.r);

    // 1b. wiping the device (sign-out, another account signing in) removes the token
    await page.evaluate(async () => { await __sbPrivacy.wipeDeviceData(); });
    ok(await page.evaluate(async () => (await __sbPrivacy.DEVSECRET.get("canvas-mail")) === null), "wiping the device removes the Canvas token");

    ok(errs.length === 0, "no page errors: " + errs.join("; "));
    console.log(`privacy-hardening: ${n} checks passed`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
