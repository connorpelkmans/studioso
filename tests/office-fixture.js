// Builds small, real .docx, .pptx and .xlsx files for the Office renderer tests (01-office.js)
"use strict";
const zlib = require("zlib");

const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xFFFFFFFF; for (const x of b) c = CRC[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
// files: {name: string | Buffer}; method 8 (deflate) unless store
function zip(files, store){
  const locals = [], central = []; let off = 0;
  for (const [name, body] of Object.entries(files)) {
    const data = Buffer.isBuffer(body) ? body : Buffer.from(body, "utf8"), nm = Buffer.from(name, "utf8");
    const comp = store ? data : zlib.deflateRawSync(data), method = store ? 0 : 8, crc = crc32(data);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(method, 8); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nm.length, 26);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(method, 10); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(nm.length, 28); ch.writeUInt32LE(off, 42);
    locals.push(lh, nm, comp); central.push(ch, nm); off += 30 + nm.length + comp.length;
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(central.length / 2, 8); end.writeUInt16LE(central.length / 2, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
  return Buffer.concat([...locals, cd, end]);
}
// A small solid red PNG
function png(w, h){
  const chunk = (type, data) => { const len = Buffer.alloc(4), crc = Buffer.alloc(4), td = Buffer.concat([Buffer.from(type, "latin1"), data]); len.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { raw[y * (w * 3 + 1) + 1 + x * 3] = 220; }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
const PNG = png(4, 4);
const X = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const W_NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const rels = list => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${list.map(([id, type, target, ext]) => `<Relationship Id="${id}" Type="${type.includes("://") ? type : REL + "/" + type}" Target="${X(target)}"${ext ? ' TargetMode="External"' : ""}/>`).join("")}</Relationships>`;
const CT = '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>';

function docx(opts){
  opts = opts || {};
  const p = (text, extra) => `<w:p>${extra && extra.pPr ? `<w:pPr>${extra.pPr}</w:pPr>` : ""}<w:r>${extra && extra.rPr ? `<w:rPr>${extra.rPr}</w:rPr>` : ""}<w:t xml:space="preserve">${X(text)}</w:t></w:r></w:p>`;
  const body = [
    p("Lab Report", {pPr: '<w:pStyle w:val="Title"/>'}),
    p("Introduction", {pPr: '<w:pStyle w:val="Heading1"/>'}),
    `<w:p><w:r><w:t xml:space="preserve">Plain then </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>bold words</w:t></w:r><w:r><w:t xml:space="preserve"> and </w:t></w:r><w:r><w:rPr><w:i/><w:color w:val="C00000"/><w:sz w:val="28"/></w:rPr><w:t>red italic</w:t></w:r><w:r><w:rPr><w:vertAlign w:val="superscript"/></w:rPr><w:t>2</w:t></w:r><w:r><w:rPr><w:highlight w:val="yellow"/></w:rPr><w:t>marked</w:t></w:r></w:p>`,
    p("First step", {pPr: '<w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>'}),
    p("Second step", {pPr: '<w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>'}),
    p("A bullet", {pPr: '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr>'}),
    `<w:p><w:hyperlink r:id="rIdLink"><w:r><w:t>Course site</w:t></w:r></w:hyperlink><w:r><w:t xml:space="preserve"> and </w:t></w:r><w:hyperlink r:id="rIdBad"><w:r><w:t>bad link</w:t></w:r></w:hyperlink></w:p>`,
    `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="0" w:type="auto"/></w:tblPr><w:tblGrid><w:gridCol w:w="3000"/><w:gridCol w:w="3000"/><w:gridCol w:w="3000"/></w:tblGrid>
      <w:tr><w:trPr><w:tblHeader/></w:trPr><w:tc><w:tcPr><w:gridSpan w:val="2"/><w:shd w:val="clear" w:fill="D9E2F3"/></w:tcPr>${p("Merged header")}</w:tc><w:tc>${p("H3")}</w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:vMerge w:val="restart"/></w:tcPr>${p("Tall cell")}</w:tc><w:tc>${p("B2")}</w:tc><w:tc>${p("C2")}</w:tc></w:tr>
      <w:tr><w:tc><w:tcPr><w:vMerge/></w:tcPr>${p("")}</w:tc><w:tc>${p("B3")}</w:tc><w:tc>${p("C3")}</w:tc></w:tr></w:tbl>`,
    `<w:p><w:r><w:drawing><wp:inline><wp:extent cx="952500" cy="476250"/><wp:docPr id="1" name="Picture 1" descr="A red square"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:blipFill><a:blip r:embed="rIdImg"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`,
    `<w:p><w:r><w:drawing><wp:inline><wp:extent cx="952500" cy="952500"/><wp:docPr id="2" name="Picture 2"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:blipFill><a:blip r:embed="rIdEmf"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`,
    p('Evil <script>alert(1)</script> "onerror=alert(2) <img src=x onerror=alert(3)>', {rPr: '<w:color w:val="red;background:url(x)"/><w:rFonts w:ascii="x&apos;;background:url(y)"/><w:sz w:val="9e9"/>'}),
    `<w:p><w:r><w:t>Before break</w:t></w:r><w:r><w:br w:type="page"/></w:r><w:r><w:t>After break</w:t></w:r></w:p>`,
  ];
  for (let i = 0; i < (opts.filler || 60); i++) body.push(p(`Filler paragraph ${i + 1}. ` + "The quick brown fox jumps over the lazy dog. ".repeat(6)));
  body.push(p("The end."));
  const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${W_NS}><w:body>${body.join("")}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>`;
  const styles = `<?xml version="1.0" encoding="UTF-8"?><w:styles ${W_NS}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="259" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
    <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
    <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:rPr><w:sz w:val="56"/></w:rPr></w:style>
    <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="2F5496"/><w:sz w:val="32"/></w:rPr></w:style>
    <w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="720"/><w:contextualSpacing/></w:pPr></w:style>
    <w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:color="000000"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr></w:style></w:styles>`;
  const numbering = `<?xml version="1.0" encoding="UTF-8"?><w:numbering ${W_NS}>
    <w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>
    <w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/><w:lvlText w:val="&#61623;"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol"/></w:rPr></w:lvl></w:abstractNum>
    <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num></w:numbering>`;
  return zip({
    "[Content_Types].xml": CT,
    "_rels/.rels": rels([["rId1", "officeDocument", "word/document.xml"]]),
    "word/document.xml": doc, "word/styles.xml": styles, "word/numbering.xml": numbering,
    "word/_rels/document.xml.rels": rels([["rId1", "styles", "styles.xml"], ["rId2", "numbering", "numbering.xml"], ["rIdImg", "image", "media/image1.png"], ["rIdEmf", "image", "media/image2.emf"],
      ["rIdLink", "hyperlink", "https://example.edu/course?a=1&b=2", true], ["rIdBad", "hyperlink", "javascript:alert(1)", true]]),
    "word/media/image1.png": PNG, "word/media/image2.emf": Buffer.from("not really an emf file"),
  }, opts.store);
}

const P_NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
const sp = (id, name, ph, xfrm, body, fill) => `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${name}"/><p:cNvSpPr/><p:nvPr>${ph || ""}</p:nvPr></p:nvSpPr><p:spPr>${xfrm || ""}${fill || ""}</p:spPr>${body ? `<p:txBody><a:bodyPr/><a:lstStyle/>${body}</p:txBody>` : ""}</p:sp>`;
const xf = (x, y, w, h) => `<a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm>`;
const tree = inner => `<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>${inner}</p:spTree></p:cSld>`;
function pptx(){
  const theme = `<?xml version="1.0"?><a:theme ${P_NS} name="T"><a:themeElements><a:clrScheme name="c"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2><a:accent1><a:srgbClr val="4472C4"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="f"><a:majorFont><a:latin typeface="Calibri Light"/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/></a:minorFont></a:fontScheme></a:themeElements></a:theme>`;
  const master = `<?xml version="1.0"?><p:sldMaster ${P_NS}>${tree(sp(2, "Title", '<p:ph type="title"/>', xf(838200, 365125, 10515600, 1325563), '<a:p><a:r><a:t>Master title</a:t></a:r></a:p>') + sp(3, "Logo bar", "", xf(0, 6400800, 12192000, 457200), "", '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:schemeClr val="accent2"/></a:solidFill>'))}<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:txStyles><p:titleStyle><a:lvl1pPr algn="ctr"><a:defRPr sz="4400"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mj-lt"/></a:defRPr></a:lvl1pPr></p:titleStyle><p:bodyStyle><a:lvl1pPr marL="228600" indent="-228600"><a:buFont typeface="Arial"/><a:buChar char="•"/><a:defRPr sz="2800"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill></a:defRPr></a:lvl1pPr></p:bodyStyle><p:otherStyle/></p:txStyles></p:sldMaster>`;
  const layout = `<?xml version="1.0"?><p:sldLayout ${P_NS}>${tree(sp(2, "Title 1", '<p:ph type="title"/>', xf(838200, 365125, 10515600, 1325563), "") + sp(3, "Body", '<p:ph idx="1"/>', xf(838200, 1825625, 10515600, 4351338), ""))}</p:sldLayout>`;
  const slide1 = `<?xml version="1.0"?><p:sld ${P_NS}><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFF2CC"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>`
    + sp(2, "Title 1", '<p:ph type="title"/>', "", '<a:p><a:r><a:rPr lang="en-US" b="1"/><a:t>Cell Biology</a:t></a:r></a:p>')
    + sp(3, "Content", '<p:ph idx="1"/>', "", '<a:p><a:r><a:t>Mitochondria</a:t></a:r></a:p><a:p><a:r><a:t>Ribosomes</a:t></a:r></a:p>')
    + sp(4, "Box", "", xf(914400, 914400, 3048000, 914400), '<a:p><a:pPr algn="ctr"/><a:r><a:rPr sz="2000"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:rPr><a:t>Blue box &lt;b&gt;</a:t></a:r></a:p>', '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:schemeClr val="accent1"/></a:solidFill>')
    + sp(5, "Evil", "", xf(0, 0, 952500, 952500), '<a:p><a:r><a:rPr><a:solidFill><a:srgbClr val="red;background:url(x)"/></a:solidFill><a:latin typeface="Arial&quot;;x:y"/></a:rPr><a:t>&lt;script&gt;alert(1)&lt;/script&gt;"onerror=</a:t></a:r></a:p>')
    + "</p:spTree></p:cSld></p:sld>";
  const grp = `<p:grpSp><p:nvGrpSpPr><p:cNvPr id="10" name="G"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="1905000" y="1905000"/><a:ext cx="1905000" cy="1905000"/><a:chOff x="0" y="0"/><a:chExt cx="3810000" cy="3810000"/></a:xfrm></p:grpSpPr>${sp(11, "In group", "", xf(952500, 952500, 952500, 952500), '<a:p><a:r><a:t>Grouped</a:t></a:r></a:p>', '<a:prstGeom prst="ellipse"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="00B050"/></a:solidFill>')}</p:grpSp>`;
  const pic = `<p:pic><p:nvPicPr><p:cNvPr id="20" name="Pic" descr="diagram"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr>${xf(6096000, 952500, 1905000, 1905000)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
  const tbl = `<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="30" name="Table"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr><p:xfrm><a:off x="952500" y="4762500"/><a:ext cx="3810000" cy="740000"/></p:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblPr firstRow="1" bandRow="1"/><a:tblGrid><a:gridCol w="1905000"/><a:gridCol w="1905000"/></a:tblGrid><a:tr h="370000"><a:tc><a:txBody><a:bodyPr/><a:p><a:r><a:t>Organelle</a:t></a:r></a:p></a:txBody><a:tcPr/></a:tc><a:tc><a:txBody><a:bodyPr/><a:p><a:r><a:t>Role</a:t></a:r></a:p></a:txBody><a:tcPr/></a:tc></a:tr><a:tr h="370000"><a:tc><a:txBody><a:bodyPr/><a:p><a:r><a:t>Nucleus</a:t></a:r></a:p></a:txBody><a:tcPr/></a:tc><a:tc><a:txBody><a:bodyPr/><a:p><a:r><a:t>DNA</a:t></a:r></a:p></a:txBody><a:tcPr/></a:tc></a:tr></a:tbl></a:graphicData></a:graphic></p:graphicFrame>`;
  const slide2 = `<?xml version="1.0"?><p:sld ${P_NS}>${tree(sp(2, "Title", '<p:ph type="title"/>', "", '<a:p><a:r><a:t>Second slide</a:t></a:r></a:p>') + grp + pic + tbl)}</p:sld>`;
  const notes = `<?xml version="1.0"?><p:notes ${P_NS}>${tree(sp(2, "Notes", '<p:ph type="body" idx="1"/>', "", '<a:p><a:r><a:t>Remember the powerhouse joke</a:t></a:r></a:p>'))}</p:notes>`;
  const pres = `<?xml version="1.0"?><p:presentation ${P_NS}><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst><p:sldId id="256" r:id="rId3"/><p:sldId id="257" r:id="rId2"/></p:sldIdLst><p:sldSz cx="12192000" cy="6858000"/></p:presentation>`;
  return zip({
    "[Content_Types].xml": CT,
    "_rels/.rels": rels([["rId1", "officeDocument", "ppt/presentation.xml"]]),
    "ppt/presentation.xml": pres,
    // slide order comes from sldIdLst: slide2.xml is shown first
    "ppt/_rels/presentation.xml.rels": rels([["rId1", "slideMaster", "slideMasters/slideMaster1.xml"], ["rId3", "slide", "slides/slide2.xml"], ["rId2", "slide", "slides/slide1.xml"]]),
    "ppt/slides/slide2.xml": slide1, "ppt/slides/slide1.xml": slide2,
    "ppt/slides/_rels/slide2.xml.rels": rels([["rId1", "slideLayout", "../slideLayouts/slideLayout1.xml"], ["rId9", "notesSlide", "../notesSlides/notesSlide1.xml"]]),
    "ppt/slides/_rels/slide1.xml.rels": rels([["rId1", "slideLayout", "../slideLayouts/slideLayout1.xml"], ["rId2", "image", "../media/image1.png"]]),
    "ppt/notesSlides/notesSlide1.xml": notes,
    "ppt/slideLayouts/slideLayout1.xml": layout, "ppt/slideLayouts/_rels/slideLayout1.xml.rels": rels([["rId1", "slideMaster", "../slideMasters/slideMaster1.xml"]]),
    "ppt/slideMasters/slideMaster1.xml": master, "ppt/slideMasters/_rels/slideMaster1.xml.rels": rels([["rId1", "theme", "../theme/theme1.xml"]]),
    "ppt/theme/theme1.xml": theme, "ppt/media/image1.png": PNG,
  });
}

function xlsx(){
  const S = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
  const wb = `<?xml version="1.0"?><workbook ${S}><sheets><sheet name="Grades" sheetId="1" r:id="rId1"/><sheet name="Budget" sheetId="2" r:id="rId2"/><sheet name="Secret" sheetId="3" state="hidden" r:id="rId3"/></sheets></workbook>`;
  const ss = `<?xml version="1.0"?><sst ${S} count="5" uniqueCount="5"><si><t>Student grades</t></si><si><t>Name</t></si><si><r><t>Sc</t></r><r><rPr><b/></rPr><t>ore</t></r></si><si><t>Ada &lt;script&gt;</t></si><si><t xml:space="preserve">Due</t></si></sst>`;
  const styles = `<?xml version="1.0"?><styleSheet ${S}><numFmts count="1"><numFmt numFmtId="164" formatCode="0.0%"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFC00000"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFFF00"/></patternFill></fill></fills><borders count="1"><border/></borders><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFont="1"/><xf numFmtId="14" fontId="0" fillId="0" borderId="0"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0"/><xf numFmtId="4" fontId="0" fillId="0" borderId="0"/></cellXfs></styleSheet>`;
  const sheet1 = `<?xml version="1.0"?><worksheet ${S}><cols><col min="1" max="1" width="20" customWidth="1"/></cols><sheetData>
    <row r="1"><c r="A1" t="s" s="1"><v>0</v></c></row>
    <row r="2"><c r="A2" t="s"><v>1</v></c><c r="B2" t="s"><v>2</v></c><c r="C2" t="s"><v>4</v></c><c r="D2" t="inlineStr"><is><t>Pct</t></is></c></row>
    <row r="3"><c r="A3" t="s"><v>3</v></c><c r="B3"><v>1234.5</v></c><c r="C3" s="2"><v>45306</v></c><c r="D3" s="3"><v>0.875</v></c><c r="E3" t="b"><v>1</v></c><c r="F3" s="4"><v>-1234.567</v></c></row>
  </sheetData><mergeCells count="1"><mergeCell ref="A1:C1"/></mergeCells></worksheet>`;
  const sheet2 = `<?xml version="1.0"?><worksheet ${S}><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Rent</t></is></c><c r="B1"><v>800</v></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>Food</t></is></c><c r="B2"><f>B1/4</f><v>200</v></c></row></sheetData></worksheet>`;
  return zip({
    "[Content_Types].xml": CT, "_rels/.rels": rels([["rId1", "officeDocument", "xl/workbook.xml"]]),
    "xl/workbook.xml": wb, "xl/_rels/workbook.xml.rels": rels([["rId1", "worksheet", "worksheets/sheet1.xml"], ["rId2", "worksheet", "worksheets/sheet2.xml"], ["rId3", "worksheet", "worksheets/sheet3.xml"], ["rId4", "sharedStrings", "sharedStrings.xml"], ["rId5", "styles", "styles.xml"]]),
    "xl/sharedStrings.xml": ss, "xl/styles.xml": styles, "xl/worksheets/sheet1.xml": sheet1, "xl/worksheets/sheet2.xml": sheet2,
    "xl/worksheets/sheet3.xml": `<?xml version="1.0"?><worksheet ${S}><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>hidden</t></is></c></row></sheetData></worksheet>`,
  });
}

const csv = () => Buffer.from('﻿Name;Score;Note\r\n"Smith; Ann";91.5;"said ""hi"""\r\nLee;78;<b>bold?</b>\r\n', "utf8");

module.exports = {zip, docx, pptx, xlsx, csv, PNG};
