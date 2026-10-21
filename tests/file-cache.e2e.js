// Opened files are kept on the device (FCACHE in index.html): opening one again doesn't download it, big files and the
// searchable-text sidecars aren't kept, the oldest go first when it's full, and signing out clears it.
// Run: node tests/file-cache.e2e.js
const path = require("path"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
(async () => {
  const b = await chromium.launch({executablePath}), page = await (await b.newContext()).newPage();
  const errs = []; page.on("pageerror", e => errs.push(String(e)));
  await page.addInitScript(() => { window.__SB_TEST = true; localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studioso:welcomed", "1"); });
  await page.goto("file://" + path.resolve(__dirname, "..", "index.html")); await page.waitForTimeout(1200);
  // a stand-in storage server that counts downloads
  await page.evaluate(() => { window.__dl = []; window.__cli = {storage: {from: () => ({download: async p => { window.__dl.push(p); const size = /big/.test(p) ? 61 * 1048576 : /mid/.test(p) ? 120 * 1048576 : 1000; return {data: new Blob([new Uint8Array(size)], {type: "application/pdf"}), error: null}; }})}}; });
  const dl = p => page.evaluate(async p => { const blob = await __sbSync.sbDownload(p, window.__cli); return blob.size; }, p);
  await dl("u1/a-slides.pdf"); await page.waitForTimeout(150);
  const size = await dl("u1/a-slides.pdf");
  ok(size === 1000 && (await page.evaluate(() => window.__dl.length)) === 1, "opening a file again uses the copy on this device (one download, not two)");
  await dl("u1/_text/a-slides.pdf.json.gz"); await page.waitForTimeout(150); await dl("u1/_text/a-slides.pdf.json.gz");
  ok((await page.evaluate(() => window.__dl.filter(x => /_text/.test(x)).length)) === 2, "the searchable-text sidecars (which change) are always downloaded");
  await dl("u1/big.mp4"); await page.waitForTimeout(150); await dl("u1/big.mp4");
  ok((await page.evaluate(() => window.__dl.filter(x => /big/.test(x)).length)) === 2, "files over 60 MB aren't kept");
  // full: the least recently opened goes first
  await page.evaluate(() => { __sbSync.FCACHE.MAX = 200 * 1048576; __sbSync.FCACHE.BIG = 200 * 1048576; });
  await dl("u1/mid1.pdf"); await page.waitForTimeout(200); await dl("u1/a-slides.pdf"); await page.waitForTimeout(200);   // the slides were opened after mid1
  await dl("u1/mid2.pdf"); await page.waitForTimeout(400);   // 120 + 120 MB is over 200: mid1, opened longest ago, goes
  await page.evaluate(() => { window.__dl = []; });
  await dl("u1/mid2.pdf"); await dl("u1/a-slides.pdf"); await page.waitForTimeout(100); await dl("u1/mid1.pdf");
  ok(JSON.stringify(await page.evaluate(() => window.__dl)) === JSON.stringify(["u1/mid1.pdf"]), "when it's full, the least recently opened file is dropped first");
  // signing out clears it
  await page.evaluate(async () => { window.__dl = []; await __sbSync.wipeDeviceData2(); });
  await page.waitForTimeout(300);
  await dl("u1/a-slides.pdf");
  ok((await page.evaluate(() => window.__dl.length)) === 1, "signing out clears the kept copies");
  ok(!errs.length, "no page errors: " + errs.join(" | "));
  await b.close(); console.log(`file-cache.e2e: ${n} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
