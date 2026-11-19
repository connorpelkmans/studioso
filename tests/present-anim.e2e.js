// node tests/present-anim.e2e.js: presentation practice with builds and videos.
// A PowerPoint's bullets appear one click at a time (Next shows the next bullet before the next slide; Back goes back a click,
// and back onto the previous slide finished); its embedded video plays on the slide when its click comes, and can be skipped, its
// length still counting; a video added by hand nudges the plan to fit it. A PDF that prints each step of a build on its own page
// is practised as one slide with clicks (and can be shown page by page again); its YouTube link counts as a video once it has a
// length. (tests/fixtures/make-present-anim.py makes the PowerPoint.)
const {chromium, executablePath} = require("./pw");
const path = require("path"), fs = require("fs"), http = require("http");
const ROOT = path.join(__dirname, "..");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2"};
const server = http.createServer((req, res) => {
  let f; try { f = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname)); } catch (e) { res.writeHead(400); res.end(); return; }
  if (!f.startsWith(ROOT + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {"content-type": MIME[path.extname(f)] || "application/octet-stream"}); fs.createReadStream(f).pipe(res);
});
const FX = path.join(__dirname, "fixtures"), OUT = require("os").tmpdir() + "/sbanim";
const SEED = {v: 2, updated: 1, tasks: [], files: [], notes: [], events: [], decks: [], settings: {}, courses: [{id: "c1", name: "Composition", code: "ENGL 102", color: "#7A4FD6"}]};
const ok = (c, m) => { console.log((c ? "ok   " : "FAIL ") + m); if (!c) process.exitCode = 1; };
(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  const b = await chromium.launch({executablePath, args: ["--autoplay-policy=no-user-gesture-required"]});
  // a PDF like Keynote or Beamer prints a build: one page per step
  const mk = await b.newPage();
  const pg = (h) => `<section style="width:960px;height:540px;padding:40px;box-sizing:border-box;font:28px sans-serif;page-break-after:always">${h}</section>`;
  await mk.setContent(`<style>@page{size:960px 540px;margin:0}body{margin:0}</style>` +
    pg(`<h1>Why teens sleep less</h1><p>Phones at night</p>`) +
    pg(`<h1>Why teens sleep less</h1><p>Phones at night</p><p>Early school starts</p>`) +
    pg(`<h1>Why teens sleep less</h1><p>Phones at night</p><p>Early school starts</p><p>Homework load</p>`) +
    pg(`<h1>What helps</h1><p>Watch: <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">a short talk</a></p>`));
  const pdfPath = OUT + "-builds.pdf";
  await mk.pdf({path: pdfPath, width: "960px", height: "540px", printBackground: true}); await mk.close();

  const ctx = await b.newContext({viewport: {width: 1280, height: 800}, serviceWorkers: "block"});
  await ctx.addInitScript(s => { window.__SB_TEST = true; localStorage.setItem("studioso:sb", '"local"'); localStorage.setItem("sb:onboarded", "1"); localStorage.setItem("studyboard:tour", "done"); localStorage.setItem("studioso:welcomed", "1"); if (!localStorage.getItem("coursework:v2")) localStorage.setItem("coursework:v2", JSON.stringify(s)); }, SEED);
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message)); p.on("console", m => { if (m.type() === "error" && !/Failed to load resource|WebSocket|realtime|supabase/i.test(m.text())) errs.push(m.text()); });
  await p.goto("http://127.0.0.1:" + port + "/index.html");
  await p.waitForFunction(() => window.__sbSync && window.SBPRESENT && document.readyState === "complete", null, {timeout: 20000}); await p.waitForTimeout(600);
  await p.evaluate(() => { window.__sbPlanObj().isPro = () => true; const S = window.__sbSync; S.ui.tab = "flashcards"; S.ui.rvView = "present"; S.render(); });
  await p.waitForTimeout(400);
  const stage = () => p.evaluate(() => { const S = window.SBPRESENT.px.stage(); return S ? {i: S.i, k: S.k, vp: !!S.vp, acc: S.acc, vskip: S.vskip.slice()} : null; });
  const offs = () => p.$$eval("#prSlide .pr-off", e => e.map(x => (x.dataset.sp || "") + ":" + (x.dataset.pi || "")));

  // ---- a PowerPoint with animations and a video
  await p.click('#view [data-act="pr-new"]'); await p.waitForSelector("#prFile", {state: "attached"});
  await p.setInputFiles("#prFile", FX + "/present-anim.pptx"); await p.waitForSelector(".pr-picked", {timeout: 20000}); await p.waitForTimeout(300);
  const found = await p.textContent(".pr-found").catch(() => "");
  ok(/2 slides have animations, shown click by click/.test(found) && /1 video \(0:03\)/.test(found), "adding the slides says what it found: " + found);
  await p.screenshot({path: OUT + "-found.png"});
  await p.fill("#prName", "Sleep Talk"); await p.click('[data-act="pr-create"]'); await p.waitForSelector("#prStage .pr-play", {timeout: 15000}); await p.waitForTimeout(500);
  await p.click('[data-act="pr-plan"]'); await p.waitForSelector(".pr-plan-list .pr-pl"); await p.waitForTimeout(300);
  const badges = await p.$$eval(".pr-pl", e => e.map(x => [...x.querySelectorAll(".pr-pl-b")].map(b => b.textContent).join("+")));
  ok(badges[1] === "2 clicks" && badges[2] === "2 clicks+0:03", "the plan shows each slide's clicks and video: " + JSON.stringify(badges));
  ok(/Slide 3/.test(await p.textContent(".pr-plan-vids")) && /in the slides/.test(await p.textContent(".pr-plan-vids")), "the plan lists the video");
  // a video the student adds: a slide shorter than it gets a nudge to fit
  await p.click(".pr-vadd summary"); await p.selectOption("#prVSlide", {value: "4"}); await p.fill("#prVLen", "2:00"); await p.click('[data-act="pr-vadd"]'); await p.waitForTimeout(250);
  ok(await p.locator('.pr-pl:nth-child(5) .pr-pl-b.vid.warn').count() === 1 && await p.locator('.pr-pl:nth-child(5) [data-act="pr-vfit"]').count() === 1, "a slide shorter than its video is flagged, with Fit the Video");
  await p.screenshot({path: OUT + "-plan.png"});
  await p.click('.pr-pl:nth-child(5) [data-act="pr-vfit"]'); await p.waitForTimeout(250);
  ok(await p.textContent('.pr-pl:nth-child(5) .pr-pl-tm b') === "2:15", "Fit the Video gives the slide the video's length and a moment more");
  await p.click('[data-act="pr-plan"]'); await p.waitForTimeout(200);

  // practising: bullets appear click by click
  await p.click('#prStage [data-act="pr-play"]'); await p.waitForTimeout(500);
  await p.keyboard.press("ArrowRight"); await p.waitForTimeout(500);
  let st = await stage(); let off = await offs();
  ok(st.i === 1 && st.k === 0 && off.includes(":0") && off.includes(":1"), "slide 2 opens with its bullets hidden: " + JSON.stringify(off));
  ok(await p.locator("#prOver .pr-steps i").count() === 2, "a pill shows the slide's two clicks");
  await p.keyboard.press("ArrowRight"); await p.waitForTimeout(450);
  st = await stage(); off = await offs();
  ok(st.i === 1 && st.k === 1 && !off.includes(":0") && off.includes(":1"), "Next shows the first bullet, still on slide 2");
  await p.screenshot({path: OUT + "-build.png"});
  await p.keyboard.press("ArrowRight"); await p.waitForTimeout(450);
  ok((await offs()).length === 0 && (await stage()).k === 2, "the next click shows the second bullet");
  // slide 3: the video
  await p.keyboard.press("ArrowRight"); await p.waitForTimeout(700);
  st = await stage();
  ok(st.i === 2 && st.k === 0 && (await offs()).some(x => /^41/.test(x)), "slide 3 opens with its callout hidden");
  ok(await p.locator("#prOver .pr-mv-play").count() === 1 && /Video\s*0:03/.test(await p.textContent("#prVChip")), "its video shows a play button and its length: " + (await p.textContent("#prVChip")));
  await p.screenshot({path: OUT + "-video.png"});
  await p.keyboard.press("ArrowRight"); await p.waitForTimeout(1200);
  st = await stage();
  ok(st.vp && await p.locator("#prOver video").count() === 1 && /Playing/.test(await p.textContent("#prVChip")), "the click plays the video on the slide");
  await p.screenshot({path: OUT + "-playing.png"});
  const acc0 = st.acc;
  await p.click('#prVChip [data-act="pr-vskip"]'); await p.waitForTimeout(300);
  st = await stage();
  ok(!st.vp && st.vskip.length === 1 && st.vskip[0][0] === 2 && st.vskip[0][1] > 300 && st.vskip[0][1] <= 3000 && st.acc > acc0, "Skip the Rest stops it and the rest of its length counts: " + JSON.stringify(st.vskip));
  ok(/Video counted/.test(await p.textContent("#prVChip")), "the chip says the video counted");
  await p.keyboard.press("ArrowRight"); await p.waitForTimeout(450);
  ok((await offs()).length === 0 && (await stage()).k === 2, "the last click shows the callout");
  // back: a click at a time, then onto slide 2 finished
  await p.keyboard.press("ArrowLeft"); await p.waitForTimeout(400);
  ok((await stage()).k === 1 && (await offs()).some(x => /^41/.test(x)), "Back hides the callout again");
  await p.keyboard.press("ArrowLeft"); await p.keyboard.press("ArrowLeft"); await p.waitForTimeout(500);
  st = await stage();
  ok(st.i === 1 && st.k === 2 && (await offs()).length === 0, "Back from a slide's start lands on the previous slide finished");
  for (let k = 0; k < 3; k++) { await p.keyboard.press("ArrowRight"); await p.waitForTimeout(250); }
  // slide 5's own video (added by hand): no file, so Skip adds its length
  await p.keyboard.press("ArrowRight"); await p.keyboard.press("ArrowRight"); await p.waitForTimeout(500);
  ok((await stage()).i === 4 && /Skip · adds 2:00/.test(await p.textContent("#prVChip")), "a video added by hand can be skipped for its length");
  const a1 = (await stage()).acc; await p.click('#prVChip [data-act="pr-vskip"]'); await p.waitForTimeout(200);
  ok((await stage()).acc - a1 === 120000, "skipping adds exactly its 2:00");
  await p.click('#prStage [data-act="pr-end"]'); await p.waitForTimeout(1500);
  const run = await p.evaluate(() => window.SBPRESENT.list()[0].runs[0]);
  ok(run && Array.isArray(run.vskip) && run.vskip.length === 2 && run.times[4] >= 120000, "the run keeps the skipped video time on its slides: " + JSON.stringify(run && run.vskip));
  await p.keyboard.press("Escape"); await p.waitForTimeout(500);

  // ---- a PDF with a build printed page by page
  await p.evaluate(() => { const S = window.__sbSync; S.ui.tab = "flashcards"; S.ui.rvView = "present"; S.render(); }); await p.waitForTimeout(300);
  await p.evaluate(() => window.SBPRESENT.add("")); await p.waitForSelector("#prFile", {state: "attached"});
  await p.setInputFiles("#prFile", pdfPath); await p.waitForSelector(".pr-picked", {timeout: 20000}); await p.waitForTimeout(300);
  const pk = await p.textContent(".pr-picked");
  ok(/2 slides \(from 4 pages\)/.test(pk) && /builds up over several pages/.test(pk) && /1 video/.test(pk), "a PDF's build-up pages become one slide with clicks, and its YouTube link a video: " + pk.replace(/\s+/g, " "));
  await p.fill("#prName", "Sleep PDF"); await p.click('[data-act="pr-create"]'); await p.waitForSelector("#prStage .pr-play", {timeout: 15000}); await p.waitForTimeout(500);
  ok(await p.locator(".pr-th").count() === 2, "two slides in the strip");
  await p.click('[data-act="pr-plan"]'); await p.waitForSelector(".pr-plan-vids"); await p.waitForTimeout(200);
  ok(/YouTube link/.test(await p.textContent(".pr-plan-vids")), "the plan lists the YouTube link");
  await p.fill(".pr-vlen", "1:30"); await p.press(".pr-vlen", "Tab"); await p.waitForTimeout(250);
  ok(/1:30/.test(await p.textContent('.pr-pl:nth-child(2) .pr-pl-b.vid')), "its length can be set in the plan");
  await p.click('[data-act="pr-plan"]'); await p.waitForTimeout(200);
  await p.click('#prStage [data-act="pr-play"]'); await p.waitForTimeout(500);
  await p.keyboard.press("ArrowRight"); await p.waitForTimeout(500);
  st = await stage(); ok(st.i === 0 && st.k === 1, "Next shows the build's next page, still slide 1");
  await p.keyboard.press("ArrowRight"); await p.waitForTimeout(500); await p.keyboard.press("ArrowRight"); await p.waitForTimeout(700);
  st = await stage(); ok(st.i === 1 && st.k === 0, "after its last page, the next slide");
  ok(/Skip · adds 1:30/.test(await p.textContent("#prVChip")) && await p.locator('#prVChip a[href*="youtube.com"]').count() === 1, "the link's chip opens it or skips it");
  await p.screenshot({path: OUT + "-pdf.png"});
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);
  await p.click('#prStage [data-act="pr-end"]').catch(() => {}); await p.waitForTimeout(1200); await p.keyboard.press("Escape"); await p.waitForTimeout(400);
  // the build-up pages can be shown one by one again
  await p.evaluate(() => { const x = window.SBPRESENT.list().find(q => q.name === "Sleep PDF"); window.SBPRESENT.open(x.id); }); await p.waitForSelector("#prStage .pr-play", {timeout: 15000}); await p.waitForTimeout(400);
  await p.click('[data-act="pr-plan"]'); await p.waitForSelector('[data-act="pr-pages"]'); await p.click('[data-act="pr-pages"]'); await p.waitForTimeout(800);
  ok(await p.locator(".pr-th").count() === 4 && await p.evaluate(() => window.SBPRESENT.list().find(q => q.name === "Sleep PDF").slides) === 4, "Show Every Page makes each page a slide again");
  ok(await p.evaluate(() => Object.keys(window.SBPRESENT.list().find(q => q.name === "Sleep PDF").vids).join()) === "3", "the video moves with its page (slide 4)");
  // sharing a PowerPoint with a group leaves its videos out (they'd use the sharer's storage); the slides still open
  const slim = await p.evaluate(async () => { const x = window.SBPRESENT.list().find(q => q.name === "Sleep Talk"), b = await window.SBPRESENT.px.get("deck:" + x.id), G = window.SBPRESENT._groups;
    const m = await G.mediaBytes(b), sl = await G.slimPptx(b), r = await window.SBOFFICE.render(sl, "x.pptx"); return {full: b.byteLength, media: m, slim: sl.byteLength, pages: r.pages.length, hasVid: /ppt\/media\/media1\.webm/.test(new TextDecoder("latin1").decode(sl))}; });
  ok(slim.media > 1000 && !slim.hasVid && slim.pages === 6, "the shared copy leaves out its video and still opens: " + JSON.stringify(slim));
  ok(!errs.length, "no page errors: " + errs.join(" | "));
  await b.close(); server.close();
  console.log("present-anim.e2e: done" + (process.exitCode ? "" : ", all passed"));
})().catch(e => { console.error(e); process.exit(1); });
