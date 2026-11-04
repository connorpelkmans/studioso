// Renders each post in src/posts.html to a 1080x1350 PNG in png/.
// Run from the repo root: node marketing/instagram/first-post/render.js
const {chromium} = require('playwright');
const fs = require('fs'), path = require('path');
const dir = __dirname, src = path.join(dir, 'src');
let html = fs.readFileSync(path.join(src, 'posts.html'), 'utf8');
html = html.replace(/\{\{(\w+)\}\}/g, (_, n) => fs.readFileSync(path.join(dir, 'assets', n + '.svg'), 'utf8'));
const tmp = path.join(src, '.posts.built.html');
fs.writeFileSync(tmp, html);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({viewport: {width: 1200, height: 1500}, deviceScaleFactor: 1});
  await p.goto('file://' + tmp);
  await p.evaluate(() => document.fonts.ready);
  fs.mkdirSync(path.join(dir, 'png'), {recursive: true});
  for (const id of await p.$$eval('section.post', s => s.map(x => x.id))) {
    await p.locator('#' + id).screenshot({path: path.join(dir, 'png', id + '.png')});
    console.log('png/' + id + '.png');
  }
  await b.close();
  fs.unlinkSync(tmp);
})();
