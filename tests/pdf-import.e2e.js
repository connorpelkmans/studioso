// Browser test for PDF text extraction with the vendored PDF.js (vendor/pdfjs/).
// Run: node tests/pdf-import.e2e.js    (Playwright + Chromium; the repo is served over a throwaway local http server, because
// module import() is blocked on file:// URLs)
// Covers: the vendored PDF.js loads as an ES module the way index.html loads it (same URL, same worker, the exact PDF_OPTS read out of
// index.html), and reads the text of a real (hand-built) two-page PDF in order, the way pdfText() does.
const path = require("path"), fs = require("fs"), http = require("http"), assert = require("assert");
const {chromium, executablePath} = require("./pw");
const ROOT = path.join(__dirname, "..");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };

// A minimal valid PDF: two pages, Helvetica text, correct xref offsets.
function makePdf(pages){
  const objs = [];
  const kids = pages.map((_, i) => `${3 + i * 2} 0 R`).join(" ");
  objs.push("<< /Type /Catalog /Pages 2 0 R >>");
  objs.push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  const fontId = 3 + pages.length * 2;
  pages.forEach((lines, i) => {
    const stream = "BT /F1 18 Tf 72 720 Td " + lines.map((l, j) => (j ? "0 -28 Td " : "") + `(${l.replace(/[()\\]/g, "\\$&")}) Tj`).join(" ") + " ET";
    objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${4 + i * 2} 0 R >>`);
    objs.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
  });
  objs.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  let out = "%PDF-1.4\n"; const offs = [];
  objs.forEach((o, i) => { offs.push(Buffer.byteLength(out)); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = Buffer.byteLength(out);
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, "0") + " 00000 n \n").join("");
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

const TYPES = {".html": "text/html", ".mjs": "text/javascript", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".woff2": "font/woff2", ".png": "image/png", ".webmanifest": "application/manifest+json"};
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/+/, "") || "index.html";
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": TYPES[path.extname(file)] || "application/octet-stream"});
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({executablePath});
  try {
    const ctx = await browser.newContext({serviceWorkers: "block"});
    await ctx.addInitScript(() => { try { localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "1"); } catch (e) {} });
    const page = await ctx.newPage();
    const errors = []; page.on("pageerror", e => errors.push(String(e && e.message || e)));
    await page.goto(base + "index.html");
    const src = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    const opts = (src.match(/const PDF_OPTS = (\{[^\n]*\});/) || [])[1];
    const lib = (src.match(/const PDFJS_URL = "([^"]+)"/) || [])[1], wk = (src.match(/const PDFW_URL = "([^"]+)"/) || [])[1];
    ok(opts && lib && wk, "PDF_OPTS, PDFJS_URL and PDFW_URL found in index.html");
    const PDF_OPTS = Function("return " + opts)();
    ok(PDF_OPTS.enableXfa === false && PDF_OPTS.disableFontFace === true, "hardened options (no XFA, no font faces)");
    const pdf = makePdf([["Biology 101 Syllabus", "Midterm exam October 20"], ["Final project due December 5"]]);
    const run = async ([b64, PDF_OPTS, lib, wk]) => {
      const mod = await import(new URL(lib, document.baseURI).href);
      mod.GlobalWorkerOptions.workerSrc = new URL(wk, document.baseURI).href;
      const bin = atob(b64), buf = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      const doc = await mod.getDocument({data: buf, ...PDF_OPTS}).promise, pages = [], parts = [];
      for (let p = 1; p <= doc.numPages; p++) {
        pages.push(p);
        const tc = await (await doc.getPage(p)).getTextContent();
        parts.push(tc.items.filter(i => typeof i.str === "string" && i.str.trim() && Array.isArray(i.transform) && typeof i.width === "number").map(i => i.str).join("\n"));
      }
      return {text: parts.join("\n"), pages, version: mod.version};
    };
    const got = await page.evaluate(run, [pdf.toString("base64"), PDF_OPTS, lib, wk]);
    ok(/^6\./.test(got.version || ""), "PDF.js 6.x is loaded (" + got.version + ")");
    ok(/Biology 101 Syllabus/.test(got.text), "page 1 heading extracted");
    ok(/Midterm exam October 20/.test(got.text), "page 1 second line extracted");
    ok(/Final project due December 5/.test(got.text), "page 2 extracted");
    ok(got.text.indexOf("Biology") < got.text.indexOf("Final project"), "pages come out in order");
    ok(got.pages.join(",") === "1,2", "progress reported for both pages");
    const bad = await page.evaluate(async ([o, l]) => { try { const mod = await import(new URL(l, document.baseURI).href); await mod.getDocument({data: new TextEncoder().encode("not a pdf"), ...o}).promise; return "no error"; } catch (e) { return "error"; } }, [PDF_OPTS, lib]);
    ok(bad === "error", "a file that isn't a PDF is rejected with an error, not a hang");
    ok(!errors.length, "no page errors" + (errors.length ? ": " + errors.join("; ") : ""));
    console.log(`\n${n} checks passed`);
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error("FAIL:", e && e.message || e); server.close(); process.exit(1); });
