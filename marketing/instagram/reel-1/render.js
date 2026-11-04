// Renders src/reel.html to a 1080x1920, 30 fps MP4 (Instagram Reel size) with ffmpeg.
// Run from the repo root:  node marketing/instagram/reel-1/render.js
// Preview frames only:     node marketing/instagram/reel-1/render.js --stills 2,5,9
const {chromium} = require('playwright');
const {spawn} = require('child_process');
const fs = require('fs'), path = require('path');
const dir = __dirname, src = path.join(dir, 'src'), art = path.join(dir, '..', 'first-post', 'assets');
const FPS = 30;
let html = fs.readFileSync(path.join(src, 'reel.html'), 'utf8');
html = html.replace(/\{\{(\w+)\}\}/g, (_, n) => fs.readFileSync(path.join(art, n + '.svg'), 'utf8'));
const tmp = path.join(src, '.reel.built.html');
fs.writeFileSync(tmp, html);
const si = process.argv.indexOf('--stills');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({viewport: {width: 1080, height: 1920}, deviceScaleFactor: 1});
  await p.goto('file://' + tmp);
  await p.evaluate(() => document.fonts.ready);
  const shot = async t => { await p.evaluate(t => window.render(t), t); return p.screenshot({type: 'png'}); };
  if (si > 0) {
    const out = path.join(dir, 'stills'); fs.mkdirSync(out, {recursive: true});
    for (const t of process.argv[si + 1].split(',').map(Number)) fs.writeFileSync(path.join(out, `t${t}.png`), await shot(t));
  } else {
    const end = await p.evaluate(() => window.END);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart',
      path.join(dir, 'studyboard-reel.mp4')], {stdio: ['pipe', 'inherit', 'inherit']});
    const frames = Math.round(end * FPS);
    for (let f = 0; f < frames; f++) { if (!ff.stdin.write(await shot(f / FPS))) await new Promise(r => ff.stdin.once('drain', r)); }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
    // Cover image for the reel (the end card)
    fs.writeFileSync(path.join(dir, 'cover.png'), await shot(end - .1));
    console.log('studyboard-reel.mp4,', frames, 'frames');
  }
  await b.close(); fs.unlinkSync(tmp);
})();
