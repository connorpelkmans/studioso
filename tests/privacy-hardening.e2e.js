// Browser test for the privacy hardening (October 2026)
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

    ok(await page.evaluate(() => localStorage.getItem("studyboard:cvmail")) === null, "an old plain copy of a Canvas token is erased");
    ok(await page.evaluate(async () => (await __sbPrivacy.DEVSECRET.get("canvas-mail")) === null), "and not moved into the device store");
    await page.evaluate(async tok => { await __sbPrivacy.DEVSECRET.set("canvas-mail", JSON.stringify({host: "https://school.instructure.com", token: tok})); }, TOKEN);
    await page.reload(); await page.waitForTimeout(2000);
    ok(await page.evaluate(async () => (await __sbPrivacy.DEVSECRET.get("canvas-mail")) === null), "an encrypted token an older version saved is erased on the next start");
    await page.evaluate(async tok => { await __sbPrivacy.DEVSECRET.set("probe", tok); }, TOKEN);
    const raw = await page.evaluate(() => new Promise(res => { const r = indexedDB.open("studyboard-secrets"); r.onsuccess = () => { const d = r.result, q = d.transaction("s").objectStore("s").get("probe"); q.onsuccess = () => res(q.result ? {ct: Array.from(new Uint8Array(q.result.ct)), iv: Array.from(new Uint8Array(q.result.iv))} : null); }; }));
    ok(raw && raw.ct.length > 0 && raw.iv.length === 12, "secrets are stored as encrypted boxes");
    ok(!Buffer.from(raw.ct).toString("latin1").includes(TOKEN.slice(3, 20)), "the stored box does not contain the secret");
    await page.evaluate(async () => { await __sbPrivacy.DEVSECRET.remove("probe"); });

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

    const scrubbed = await page.evaluate(() => {
      __sbPrivacy.addTask({id: "zz1", title: "Frog dissection lab writeup", notes: ""});
      return window.SBERR.scrub("Couldn't save Frog dissection lab writeup for me@example.com at https://school.example.edu/x?y=1");
    });
    ok(!/Frog dissection/i.test(scrubbed) && !/me@example\.com/.test(scrubbed) && !/school\.example\.edu/.test(scrubbed), "error text loses titles, emails and outside addresses: " + scrubbed);

    const st = await page.evaluate(async () => ({r: await __sbPrivacy.storageProtect(false), row: typeof __sbPrivacy.storageRow() === "string"}));
    ok(["granted", "denied", "unsupported", "unknown"].includes(st.r) && st.row, "the storage check runs and Settings can show it: " + st.r);

    await page.evaluate(async () => { await __sbPrivacy.DEVSECRET.set("probe2", "x"); await __sbPrivacy.wipeDeviceData(); });
    ok(await page.evaluate(async () => (await __sbPrivacy.DEVSECRET.get("probe2")) === null), "wiping the device empties the device store");

    ok(errs.length === 0, "no page errors: " + errs.join("; "));
    console.log(`privacy-hardening: ${n} checks passed`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
