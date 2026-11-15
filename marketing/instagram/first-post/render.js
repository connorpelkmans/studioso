// Renders each post in src/posts.html for Instagram upload.
// Run from the repo root: node marketing/instagram/first-post/render.js
// Needs Node, Playwright and ImageMagick (`convert`; on a Mac: brew install imagemagick).
//
// Output, per post:
//   jpg/<id>.jpg     the file to upload: 1080x1350 (4:5)
//   jpg@2x/<id>.jpg  2160x2700 copy that stays sharp full-screen on a phone
//   png/<id>.png     lossless 1080x1350 master, for editing
//
// Each post is drawn at 2x and downscaled with Lanczos, so text and the tilted cards'
// edges are smooth. The JPEGs are plain baseline JFIF files from libjpeg (what Photoshop and
// phone cameras write) at quality 95 with full colour resolution (4:4:4), so coloured text
// doesn't blur. They carry no colour profile: phones, browsers and Instagram treat an
// untagged image as sRGB, which is what Chromium draws.
const {chromium} = require('playwright');
const {execFileSync} = require('child_process');
const fs = require('fs'), path = require('path');
const W = 1080, H = 1350, SCALE = 2;
const dir = __dirname, src = path.join(dir, 'src');
let html = fs.readFileSync(path.join(src, 'posts.html'), 'utf8');
html = html.replace(/\{\{(\w+)\}\}/g, (_, n) => fs.readFileSync(path.join(dir, 'assets', n + '.svg'), 'utf8'));
const tmp = path.join(src, '.posts.built.html');
fs.writeFileSync(tmp, html);

const im = args => execFileSync('convert', args);
const resize = ['-filter', 'Lanczos', '-resize', `${W}x${H}!`];
const jpeg = ['-strip', '-units', 'PixelsPerInch', '-density', '72', '-quality', '95', '-sampling-factor', '1x1', '-interlace', 'none'];

(async () => {
  const b = await chromium.launch({args: ['--force-color-profile=srgb']});
  const p = await b.newPage({viewport: {width: 1200, height: 1500}, deviceScaleFactor: SCALE});
  await p.goto('file://' + tmp);
  await p.evaluate(() => document.fonts.ready);
  for (const d of ['png', 'jpg', 'jpg@2x']) fs.mkdirSync(path.join(dir, d), {recursive: true});
  const big = path.join(src, '.shot@2x.png');
  for (const id of await p.$$eval('section.post', s => s.map(x => x.id))) {
    await p.locator('#' + id).screenshot({path: big});
    const out = d => path.join(dir, d, id + (d === 'png' ? '.png' : '.jpg'));
    im([big, ...resize, '-strip', 'PNG24:' + out('png')]);
    im([big, ...resize, ...jpeg, out('jpg')]);
    im([big, ...jpeg, out('jpg@2x')]);
    console.log(`jpg/${id}.jpg  jpg@2x/${id}.jpg  png/${id}.png`);
  }
  await b.close();
  fs.unlinkSync(big);
  fs.unlinkSync(tmp);
})();
