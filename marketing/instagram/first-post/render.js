// Renders each post in src/posts.html for Instagram upload.
// Run from the repo root: node marketing/instagram/first-post/render.js
// Needs Node, Playwright and ffmpeg.
//
// Output, per post:
//   jpg/<id>.jpg  the file to upload: 1080x1350 (4:5), sRGB, JPEG quality ~98, 4:4:4 chroma
//   png/<id>.png  lossless 1080x1350 master, for editing
//   jpg@2x/<id>.jpg  2160x2700 copy: looks sharp full-screen on a phone (camera roll, previews)
//
// Each post is drawn at 2x (2160x2700) and downscaled with Lanczos, which gives smoother
// text and cleaner edges on the tilted cards than drawing at 1x. The JPEG keeps full colour
// resolution (no 4:2:0 subsampling), so coloured text and thin edges don't blur, and it
// carries an sRGB profile so colours look the same everywhere.
const {chromium} = require('playwright');
const {execFileSync} = require('child_process');
const fs = require('fs'), path = require('path');
const W = 1080, H = 1350, SCALE = 2;
const dir = __dirname, src = path.join(dir, 'src');
let html = fs.readFileSync(path.join(src, 'posts.html'), 'utf8');
html = html.replace(/\{\{(\w+)\}\}/g, (_, n) => fs.readFileSync(path.join(dir, 'assets', n + '.svg'), 'utf8'));
const tmp = path.join(src, '.posts.built.html');
fs.writeFileSync(tmp, html);

// Inserts an ICC profile into a JPEG as an APP2 segment, right after SOI/APP0.
function embedIcc(jpeg, icc) {
  const head = Buffer.concat([Buffer.from('ICC_PROFILE\0', 'latin1'), Buffer.from([1, 1])]);
  const len = 2 + head.length + icc.length;
  const seg = Buffer.concat([Buffer.from([0xFF, 0xE2, len >> 8, len & 0xFF]), head, icc]);
  let at = 2; // after SOI
  if (jpeg[2] === 0xFF && jpeg[3] === 0xE0) at = 4 + jpeg.readUInt16BE(4); // after JFIF APP0
  return Buffer.concat([jpeg.subarray(0, at), seg, jpeg.subarray(at)]);
}

const ff = args => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args]);
const scaleTo = `scale=${W}:${H}:flags=lanczos+accurate_rnd+full_chroma_int`;

(async () => {
  const b = await chromium.launch({args: ['--force-color-profile=srgb']});
  const p = await b.newPage({viewport: {width: 1200, height: 1500}, deviceScaleFactor: SCALE});
  await p.goto('file://' + tmp);
  await p.evaluate(() => document.fonts.ready);
  const icc = fs.readFileSync(path.join(dir, 'assets', 'sRGB.icc'));
  for (const d of ['png', 'jpg', 'jpg@2x']) fs.mkdirSync(path.join(dir, d), {recursive: true});
  const big = path.join(src, '.shot@2x.png');
  for (const id of await p.$$eval('section.post', s => s.map(x => x.id))) {
    await p.locator('#' + id).screenshot({path: big});
    const png = path.join(dir, 'png', id + '.png'), jpg = path.join(dir, 'jpg', id + '.jpg');
    ff(['-i', big, '-vf', scaleTo, '-pix_fmt', 'rgb24', png]);
    ff(['-i', big, '-vf', scaleTo + ':out_range=full', '-pix_fmt', 'yuvj444p', '-q:v', '1', '-qmin', '1', jpg]);
    fs.writeFileSync(jpg, embedIcc(fs.readFileSync(jpg), icc));
    const jpg2 = path.join(dir, 'jpg@2x', id + '.jpg');
    ff(['-i', big, '-vf', 'scale=out_range=full', '-pix_fmt', 'yuvj444p', '-q:v', '1', '-qmin', '1', jpg2]);
    fs.writeFileSync(jpg2, embedIcc(fs.readFileSync(jpg2), icc));
    console.log(`jpg/${id}.jpg  jpg@2x/${id}.jpg  png/${id}.png`);
  }
  await b.close();
  fs.unlinkSync(big);
  fs.unlinkSync(tmp);
})();
