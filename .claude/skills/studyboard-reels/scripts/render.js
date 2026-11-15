#!/usr/bin/env node
// Renders a reel folder's reel.html to a 1080x1920, 30 fps MP4 with Playwright and ffmpeg.
//
//   node render.js <reel-folder>                      full render -> reel.mp4 + cover.png
//   node render.js <reel-folder> --stills 0,1.5,4     frames only -> <reel-folder>/stills/t<sec>.png
//   node render.js <reel-folder> --stills 0,4 --guides   shade the zones platform UI covers
//   node render.js <reel-folder> --footage clip.mp4   overlays on top of the user's footage (keeps its audio)
//   node render.js <reel-folder> --audio voice.m4a    add an audio track (replaces footage audio)
//   node render.js <reel-folder> --html reel-b.html --out reel-b.mp4   render a variant
//
// In reel.html: {{ROOT}} -> repo root (file URL), {{owl}} {{mochi}} {{inky}} {{packy}} -> companion SVGs.
// The page must define window.render(t) and window.END (seconds). Optional window.COVER (seconds).
const {chromium} = require('playwright');
const {spawn, spawnSync} = require('child_process');
const fs = require('fs'), path = require('path'), url = require('url');

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const ART = path.join(ROOT, 'marketing', 'instagram', 'first-post', 'assets');
const FPS = 30, W = 1080, H = 1920;

const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf('--' + n); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : null; };
const dir = path.resolve(args[0] && !args[0].startsWith('--') ? args[0] : '.');
const htmlName = opt('html') || 'reel.html';
const outName = opt('out') || (htmlName === 'reel.html' ? 'reel.mp4' : htmlName.replace(/\.html$/, '.mp4'));
const stills = opt('stills'), guides = !!opt('guides');
const footage = opt('footage') ? path.resolve(opt('footage')) : null;
const audio = opt('audio') ? path.resolve(opt('audio')) : null;

const srcFile = path.join(dir, htmlName);
if (!fs.existsSync(srcFile)) { console.error(`No ${htmlName} in ${dir}`); process.exit(1); }
for (const f of [footage, audio]) if (f && !fs.existsSync(f)) { console.error(`Not found: ${f}`); process.exit(1); }

let html = fs.readFileSync(srcFile, 'utf8');
const rootUrl = url.pathToFileURL(ROOT).href;
html = html.replace(/\{\{ROOT\}\}/g, rootUrl).replace(/\{\{(\w+)\}\}/g, (m, n) => {
  const f = path.join(ART, n + '.svg');
  if (!fs.existsSync(f)) { console.error(`Unknown placeholder ${m} (companions: ${fs.readdirSync(ART).map(x => x.replace('.svg', '')).join(', ')})`); process.exit(1); }
  return fs.readFileSync(f, 'utf8');
});
const head = [];
if (footage) head.push('<style>html,body,#stage{background:transparent!important}</style><script>window.FOOTAGE=true</script>');
html = html.replace(/<head>/i, '<head>' + head.join(''));
const tmp = path.join(dir, '.' + htmlName.replace(/\.html$/, '') + '.built.html');
fs.writeFileSync(tmp, html);

const GUIDES = `(() => { const d = document.createElement('div'); d.id = '__guides';
  d.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99999';
  const z = (css, label) => { const e = document.createElement('div'); e.style.cssText = 'position:absolute;background:rgba(255,0,60,.28);outline:2px dashed rgba(255,0,60,.9);color:#fff;font:600 26px system-ui;padding:8px;' + css; e.textContent = label; d.appendChild(e); };
  z('left:0;right:0;top:0;height:250px', 'top bar');
  z('left:0;right:0;bottom:0;height:440px', 'caption + username');
  z('right:0;top:1050px;width:140px;bottom:440px', 'buttons');
  const c = document.createElement('div'); c.style.cssText = 'position:absolute;left:539px;top:0;bottom:0;width:2px;background:rgba(0,255,200,.8)'; d.appendChild(c);
  document.body.appendChild(d); })()`;

const ffprobeHasAudio = f => {
  const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0', f], {encoding: 'utf8'});
  return r.status === 0 && r.stdout.trim().length > 0;
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({viewport: {width: W, height: H}, deviceScaleFactor: 1});
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('requestfailed', r => errors.push('Failed to load ' + r.url()));
  await p.goto(url.pathToFileURL(tmp).href);
  await p.evaluate(() => document.fonts.ready);
  const ok = await p.evaluate(() => typeof window.render === 'function' && typeof window.END === 'number');
  if (!ok) { console.error('reel.html must define window.render(t) and window.END'); await b.close(); process.exit(1); }
  const END = await p.evaluate(() => window.END);
  const COVER = await p.evaluate(() => typeof window.COVER === 'number' ? window.COVER : 0.5);
  const shot = async (t, transparent) => { await p.evaluate(t => window.render(t), t); return p.screenshot({type: 'png', omitBackground: !!transparent}); };

  if (stills) {
    const out = path.join(dir, 'stills'); fs.mkdirSync(out, {recursive: true});
    if (guides) await p.evaluate(GUIDES);
    for (const t of String(stills).split(',').map(Number)) {
      if (footage) {
        // Put the footage frame at time t behind the page so the still shows the real composite
        const fr = path.join(out, `.bg-${t}.png`);
        spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(t), '-i', footage, '-frames:v', '1',
          '-vf', `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`, fr]);
        if (fs.existsSync(fr)) await p.evaluate(async u => {
          let im = document.getElementById('__bg');
          if (!im) { im = document.createElement('img'); im.id = '__bg'; im.style.cssText = 'position:fixed;left:0;top:0;width:1080px;height:1920px;z-index:-1'; document.body.prepend(im); }
          im.src = u + '?' + Date.now(); await im.decode();
        }, url.pathToFileURL(fr).href);
      }
      fs.writeFileSync(path.join(out, `t${t}.png`), await shot(t));
    }
    for (const f of fs.readdirSync(out)) if (f.startsWith('.bg-')) fs.unlinkSync(path.join(out, f));
    console.log(`Stills in ${out}`);
  } else {
    const outFile = path.join(dir, outName);
    const ff = ['-y', '-loglevel', 'error'];
    const enc = ['-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(FPS), '-movflags', '+faststart'];
    if (footage) {
      ff.push('-i', footage, '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-');
      if (audio) ff.push('-i', audio);
      ff.push('-filter_complex', `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=${FPS},setsar=1,tpad=stop_mode=clone:stop_duration=${END}[bg];[bg][1:v]overlay=0:0:shortest=1:format=auto,format=yuv420p[v]`, '-map', '[v]');
      if (audio) ff.push('-map', '2:a', '-c:a', 'aac', '-b:a', '192k');
      else if (ffprobeHasAudio(footage)) ff.push('-map', '0:a', '-c:a', 'aac', '-b:a', '192k');
      ff.push('-t', String(END));
    } else {
      ff.push('-f', 'image2pipe', '-framerate', String(FPS), '-i', '-');
      if (audio) ff.push('-i', audio, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-t', String(END));
    }
    const proc = spawn('ffmpeg', [...ff, ...enc, outFile], {stdio: ['pipe', 'inherit', 'inherit']});
    let closed = false; proc.on('close', () => { closed = true; });
    proc.stdin.on('error', () => {});
    const frames = Math.round(END * FPS);
    for (let f = 0; f < frames && !closed; f++) {
      if (!proc.stdin.write(await shot(f / FPS, !!footage))) await new Promise(r => proc.stdin.once('drain', r));
      if (f % 60 === 0) process.stdout.write(`\rframe ${f}/${frames}`);
    }
    proc.stdin.end();
    const code = await new Promise(r => closed ? r(proc.exitCode) : proc.on('close', r));
    process.stdout.write('\n');
    if (code !== 0) { console.error('ffmpeg failed'); await b.close(); process.exit(1); }
    const coverName = outName === 'reel.mp4' ? 'cover.png' : outName.replace(/\.mp4$/, '-cover.png');
    if (!footage) fs.writeFileSync(path.join(dir, coverName), await shot(COVER));
    else spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(COVER), '-i', outFile, '-frames:v', '1', path.join(dir, coverName)]);
    console.log(`${outFile} (${frames} frames, ${END}s) and ${coverName}`);
  }
  if (errors.length) console.warn('Page warnings:\n  ' + [...new Set(errors)].join('\n  '));
  await b.close(); fs.unlinkSync(tmp);
})().catch(e => { console.error(e); try { fs.unlinkSync(tmp); } catch {} process.exit(1); });
