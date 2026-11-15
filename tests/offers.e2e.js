// Browser test for the offers on Today's Plan (99-offers.js): node tests/offers.e2e.js
// The exam trial card (3 to 10 days before an exam with a prep plan, while Quiz Me has free sessions), the follow-up once they're used,
// the new-term card, and when none of them show (Pro, a quiet period, within 2 days of the exam, once dismissed).
const assert = require("assert");
const {chromium, executablePath} = require("./pw");
const F = require("./exam-study-fixture");
let n = 0; const ok = (c, m) => { n++; assert(c, m); console.log("ok -", m); };
// the offers sit in the board's Notices: open the dropdown first (it remembers being open until the board is left)
const openNotices = page => page.evaluate(() => { const b = document.querySelector('#view [data-act="bn-more"][aria-expanded="false"]'); if (b) b.click(); });
const card = page => page.evaluate(() => { const c = document.querySelector(".offer-card"); return c ? {kind: c.dataset.offer, text: c.innerText.replace(/\s+/g, " ").trim()} : null; });
const redraw = page => page.evaluate(() => { window.__sbProStudy.render(); });
const setS = (page, patch) => page.evaluate(p => { const st = window.__sbProStudy.state(); st.settings = Object.assign({}, st.settings, p); window.__sbProStudy.render(); }, patch);
const monday = () => { const d = new Date(F.NOW); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7); const p = x => String(x).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };

(async () => {
  const browser = await chromium.launch({executablePath});
  try {
    // Free, with an AI key: the exam trial card
    {
      const {ctx, page} = await F.mk(browser, 390, 844, {free: true, ai: true});
      await page.waitForTimeout(500);
      const c = await card(page);
      ok(c && c.kind === "ex" && /Midterm in \d+ days\. Try Quiz Me on it: you have 3 free sessions this week\./.test(c.text) && /Quiz Me on/.test(c.text), "free: the exam trial card on Today's Plan: " + (c && c.text));
      ok(await page.evaluate(() => { const c = document.querySelector(".offer-card"), qa = document.querySelector("#view > .qa-wrap"); return !!c && c.parentElement.id === "view" && c.classList.contains("bn-shut") && !!(c.compareDocumentPosition(qa) & Node.DOCUMENT_POSITION_FOLLOWING) && !c.closest(".focus"); }), "it sits under the Notices dropdown (closed), not inside Today's Plan");
      await openNotices(page); await page.waitForTimeout(150);
      ok(await page.evaluate(() => { const c = document.querySelector(".offer-card"); return !!c && !c.classList.contains("bn-shut") && c.offsetHeight > 0; }), "opening Notices shows it");
      ok(await F.noHScroll(page), "it fits at 390px");
      await page.waitForTimeout(300);
      ok(await page.evaluate(() => { const o = window.__sbProStudy.state().settings.offers; return !!(o && o.ex && o.ex.ex1 && o.ex.ex1.d); }), "it's remembered as shown today (in settings, so other devices know)");
      await redraw(page); await page.waitForTimeout(200);
      ok((await card(page) || {}).kind === "ex", "and it stays for the rest of today");
      await openNotices(page); await page.waitForTimeout(150); await page.click('.offer-card [data-act="offer-go"]'); await page.waitForTimeout(800);
      ok(await page.evaluate(() => { const d = document.querySelector("#sxDlg"); return !!(d && d.open && d.classList.contains("is-ask")); }) && /What do I need to know for Midterm/.test(await page.evaluate(() => document.querySelector("#sxQ").value)), "the button opens Ask Your Course on the exam, to start Quiz Me on the answer");
      await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close())); await redraw(page); await page.waitForTimeout(200);
      ok(!(await card(page)), "once used, the card is gone");

      // this week's free sessions used up, the exam more than 3 days away: the follow-up, with the semester plan picked
      await setS(page, {freeRuns: {wk: monday(), quiz: 3}}); await page.waitForTimeout(200);
      const f = await card(page);
      ok(f && f.kind === "fu" && /Pro through the end of term/.test(f.text), "free runs used up: the follow-up card: " + (f && f.text));
      await openNotices(page); await page.waitForTimeout(150); await page.click('.offer-card [data-act="offer-go"]'); await page.waitForSelector("dialog[open] .plan-sheet");
      ok(await page.evaluate(() => { const b = document.querySelector('dialog[open] [data-act="plan-pick"][aria-checked="true"]'); return b ? b.dataset.id : ""; }) === "semester", "it opens the Pro sheet with Semester picked");
      ok(/Semester/.test(await page.textContent("dialog[open] .plan-go")), "and the buy button says Semester");
      await page.evaluate(() => document.querySelectorAll("dialog[open]").forEach(d => d.close())); await redraw(page); await page.waitForTimeout(200);
      ok(!(await card(page)), "the follow-up shows once");
      ok(page.errs.length === 0, "no page errors: " + page.errs.join(" | "));
      await ctx.close();
    }
    // Not now: dismissed for good
    {
      const {ctx, page} = await F.mk(browser, 1280, 800, {free: true, ai: true});
      await page.waitForSelector(".offer-card", {state: "attached"}); await openNotices(page); await page.waitForTimeout(150); await page.click('.offer-card [data-act="offer-x"]'); await page.waitForTimeout(300);
      ok(!(await card(page)), "Not Now dismisses it");
      await ctx.close();
    }
    // When nothing shows
    {
      const {ctx, page} = await F.mk(browser, 1280, 800, {ai: true});
      ok(!(await card(page)), "Pro (paywall off here): no offers");
      await ctx.close();
    }
    {
      const {ctx, page} = await F.mk(browser, 1280, 800, {free: true, ai: true});
      await page.evaluate(() => { localStorage.setItem("studyboard:reviewQuietUntil", String(Date.now() + 3 * 864e5)); window.__sbProStudy.render(); }); await page.waitForTimeout(200);
      ok(!(await card(page)), "not during a quiet period (after a limit, the paywall or the free weeks ending)");
      await page.evaluate(() => { localStorage.removeItem("studyboard:reviewQuietUntil"); const st = window.__sbProStudy.state(); st.settings = Object.assign({}, st.settings, {offers: {}}); const ex = st.tasks.ex1; const d = new Date(Date.parse(ex.due + "T12:00:00") - 0); }, null);
      await page.evaluate(([t]) => { const st = window.__sbProStudy.state(); st.tasks.ex1.due = t; st.tasks.ex1.start = t; st.updated = Date.now(); window.__sbProStudy.render(); }, [F.plus(2)]); await page.waitForTimeout(200);
      ok(!(await card(page)), "not within 2 days of the exam");
      await ctx.close();
    }
    // The first week of a new term: the semester plan
    {
      const s = F.SEED(); s.tasks.forEach(t => { if (t.id === "ex1") Object.assign(t, {due: F.plus(30), start: F.plus(30)}); }); s.settings = Object.assign({}, s.settings, {scrap: {cur: {s: F.plus(-3)}}});
      const {ctx, page} = await F.mk(browser, 390, 844, {free: true, seed: s});
      const c = await card(page);
      ok(c && c.kind === "term" && /New term, fresh start\./.test(c.text) && /Pro for the whole term: \$15\.99 \(renews every 4 months, cancel any time\)\./.test(c.text), "first week of term: the new-term card: " + (c && c.text));
      await openNotices(page); await page.waitForTimeout(150); await page.click('.offer-card [data-act="offer-go"]'); await page.waitForSelector("dialog[open] .plan-sheet");
      ok(await page.evaluate(() => (document.querySelector('dialog[open] [data-act="plan-pick"][aria-checked="true"]') || {dataset: {}}).dataset.id) === "semester", "it opens the Pro sheet with Semester picked");
      ok(page.errs.length === 0, "no page errors (term): " + page.errs.join(" | "));
      await ctx.close();
    }
    console.log(`\noffers.e2e: ${n} checks passed`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
