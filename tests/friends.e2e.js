// Friends in the browser (81-friends.js): the button and first-time card on Groups, the Friends sheet (add by @username, the
// friend link and its QR code, accepting, cancelling, removing, blocking) and opening someone's ?friend= link.
// An in-memory stand-in for the server's friend functions (supabase-friends.sql) sits on top of the groups stand-in.
const path = require("path"), fs = require("fs"), assert = require("assert");
const file = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const shots = path.resolve(process.argv[3] || path.join(__dirname, "..", "tests-out"));
fs.mkdirSync(shots, {recursive: true});
const {chromium, executablePath} = require("./pw");
const {stubInit} = require("./group-stub");
let checks = 0; const ok = (c, m) => { checks++; assert(c, m); console.log("ok -", m); };
const txt = async (page, sel) => { const l = page.locator(sel).first(); return (await l.count()) ? (await l.innerText()).replace(/\s+/g, " ") : ""; };
const act = (page, a) => page.evaluate(a => { const b = document.createElement("button"); b.dataset.act = a; document.body.appendChild(b); b.click(); b.remove(); }, a);

// The server's friend functions, the way supabase-friends.sql answers them
function friendsInit(opts){
  const S = window.__sbGroupsStub, me = S.user.id;
  try { localStorage.setItem("studyboard:age:" + me, "ok"); } catch (e) {}
  const PEOPLE = {u2: ["Sam", "sam_lee"], u3: ["Jo", "jo.b"], u4: ["Pat", "pat.k"]};
  const F = window.__FR = {rows: (opts.rows || []).map(r => Object.assign({}, r)), code: "MYCD-2345", blocks: [], codes: {"PATX-7777": "u4"}};
  const wait = v => new Promise(r => setTimeout(() => r(v), 20));
  const E = m => ({error: {message: m}});
  const rowOf = id => F.rows.find(r => r.user_id === id);
  const fns = {
    my_friends: () => ({data: F.rows.filter(r => !F.blocks.includes(r.user_id)).map(r => Object.assign({display_name: PEOPLE[r.user_id][0], username: PEOPLE[r.user_id][1], via: "username", since: new Date().toISOString()}, r))}),
    my_friend_code: a => { if (a.p_new) F.code = "NEWC-9876"; return {data: F.code}; },
    request_friend: a => {
      const n = String(a.p_username).replace(/^@/, "").toLowerCase(), id = Object.keys(PEOPLE).find(k => PEOPLE[k][1] === n);
      if (!id) return {data: "sent"};
      const r = rowOf(id);
      if (r && r.status === "accepted") return {data: "already"};
      if (r && !r.mine) { r.status = "accepted"; return {data: "accepted"}; }
      if (!r) F.rows.push({user_id: id, status: "pending", mine: true});
      return {data: "sent"};
    },
    friend_link_preview: a => { const id = F.codes[a.p_code]; if (!id) return {data: []}; const r = rowOf(id); return {data: [{display_name: PEOPLE[id][0], username: PEOPLE[id][1], state: r ? (r.status === "accepted" ? "friends" : r.mine ? "asked" : "asked_you") : "none"}]}; },
    request_friend_by_code: a => { const id = F.codes[a.p_code]; if (!id) return E("SB_FRIEND_LINK: That friend link isn't working anymore. Ask them to send you a new one."); if (!rowOf(id)) F.rows.push({user_id: id, status: "pending", mine: true, via: "link"}); return {data: "sent"}; },
    answer_friend: a => { const r = rowOf(a.p_user); if (!r || r.mine || r.status !== "pending") return {data: false}; if (a.p_accept) { r.status = "accepted"; return {data: true}; } F.rows = F.rows.filter(x => x !== r); return {data: false}; },
    remove_friend: a => { F.rows = F.rows.filter(x => x.user_id !== a.p_user); return {data: null}; }
  };
  const rpc0 = S.client.rpc, from0 = S.client.from;
  S.client.rpc = (name, a) => { if (!fns[name]) return rpc0(name, a); window.__calls.push(["rpc", name, a]); return wait(fns[name](a || {})); };
  // blocking goes to group_blocks; the server's trigger then ends the friendship
  S.client.from = t => {
    const q = from0(t);
    if (t !== "group_blocks") return q;
    const ins = q.insert;
    q.insert = row => { F.blocks.push(row.blocked_id); F.rows = F.rows.filter(x => x.user_id !== row.blocked_id); return ins.call(q, row); };
    return q;
  };
}

async function boot(browser, w, rows, url){
  const ctx = await browser.newContext({viewport: {width: w, height: w < 600 ? 844 : 900}});
  const page = await ctx.newPage(), errs = [];
  page.on("pageerror", e => errs.push("pageerror: " + e.message));
  page.on("console", c => { if (c.type() === "error" && !/net::ERR|CORS|Failed to load resource|supabase-js/.test(c.text())) errs.push("console: " + c.text().slice(0, 200)); });
  await page.addInitScript(stubInit, {me: "u1"});
  await page.addInitScript(friendsInit, {rows});
  await page.goto("file://" + file + (url || "")); await page.waitForTimeout(1500);
  return {ctx, page, errs};
}

async function main(browser, w){
  const tag = w + "px";
  // Groups: the Friends button with its request count, and the friend-link card only while there's nobody yet
  {
    const {ctx, page, errs} = await boot(browser, w, []);
    await act(page, "grp-page"); await page.waitForSelector(".frd-head-btn"); await page.waitForTimeout(600);
    ok(await page.isVisible(".frd-head-btn"), tag + " Groups shows a Friends button");
    ok(/Studying With Someone\?/.test(await txt(page, ".frd-card")), tag + " the first-time card shows with no friends yet");
    await page.screenshot({path: path.join(shots, `friends-${w}-groups.png`)});
    await page.click('.frd-card [data-act="frd-card-hide"]');
    await page.waitForFunction(() => !!localStorage.getItem("studyboard:friendCard:u1"), null, {timeout: 3000}); await page.waitForTimeout(300);
    ok(!(await page.isVisible(".frd-card")), tag + " Not Now hides the card");
    await page.reload(); await page.waitForTimeout(1500); await act(page, "grp-page"); await page.waitForSelector(".frd-head-btn"); await page.waitForTimeout(600);
    ok(!(await page.isVisible(".frd-card")), tag + " ... and it stays hidden");

    // The Friends sheet: the link, its QR code, adding by username
    await page.click(".frd-head-btn"); await page.waitForSelector("#frdSheet"); await page.waitForTimeout(400);
    ok(/MYCD-2345/.test(await txt(page, ".frd-code")) || /friend=MYCD-2345/.test(await txt(page, ".frd-code")), tag + " the sheet shows your friend link");
    await page.click('[data-act="frd-qr"]'); await page.waitForTimeout(200);
    ok(await page.$(".frd-qr svg") !== null || !/friend=/.test(await txt(page, ".frd-code")), tag + " Show QR Code draws a QR code (when there's a link to draw)");
    await page.fill("#frdWho", "ab"); await page.click("#frdGo"); await page.waitForTimeout(150);
    ok(/whole username/.test(await txt(page, "#frdMsg")) && (await page.getAttribute("#frdMsg", "class")).includes("bad"), tag + " a name that can't be a username is caught before sending");
    await page.fill("#frdWho", "@sam_lee"); await page.click("#frdGo"); await page.waitForTimeout(500);
    ok(/Request sent\. If @sam_lee is on Studyboard/.test(await txt(page, "#frdMsg")), tag + " asking by @username says the request is sent");
    ok(/Sam/.test(await txt(page, ".frd-sec:has-text('Sent')")), tag + " ... and it's listed under Sent");
    ok(await page.inputValue("#frdWho") === "", tag + " the box is cleared");
    await page.fill("#frdWho", "ghost_user"); await page.click("#frdGo"); await page.waitForTimeout(500);
    ok(/Request sent\. If @ghost_user is on Studyboard/.test(await txt(page, "#frdMsg")), tag + " an unknown username gets exactly the same answer");
    await page.screenshot({path: path.join(shots, `friends-${w}-sheet.png`)});
    await page.click('.frd-sec:has-text("Sent") [data-act="frd-cancel"]'); await page.waitForTimeout(500);
    ok(!(await page.isVisible('.frd-sec:has-text("Sent")')) && /cancelled/.test(await txt(page, "#frdMsg")), tag + " Cancel takes the request back");
    await page.click('[data-act="frd-newlink"]'); await page.waitForSelector("dialog[open] [data-submit]"); await page.click("dialog[open] [data-submit]"); await page.waitForTimeout(700);
    ok(/NEWC-9876/.test(await txt(page, ".frd-code")), tag + " Make a New Link replaces the code");
    ok(!errs.length, tag + " no errors: " + errs.join(" | "));
    await ctx.close();
  }
  // Requests: the badge, Accept, Remove and Block
  {
    const rows = [{user_id: "u3", status: "pending", mine: false, via: "link"}, {user_id: "u2", status: "accepted", mine: false}];
    const {ctx, page, errs} = await boot(browser, w, rows);
    await act(page, "grp-page"); await page.waitForSelector(".frd-head-btn"); await page.waitForTimeout(700);
    ok(await txt(page, ".frd-head-btn .frd-badge") === "1", tag + " the Friends button counts requests waiting for you");
    ok(!(await page.isVisible(".frd-card")), tag + " no first-time card once there's someone");
    await page.click(".frd-head-btn"); await page.waitForSelector("#frdSheet .frd-sec"); await page.waitForTimeout(300);
    ok(/Used your friend link/.test(await txt(page, '.frd-sec:has-text("Requests")')), tag + " a request says it came from your link");
    await page.screenshot({path: path.join(shots, `friends-${w}-requests.png`)});
    await page.click('[data-act="frd-accept"][data-id="u3"]'); await page.waitForTimeout(500);
    ok(/You and Jo are now friends/.test(await txt(page, "#frdMsg")) && /Jo/.test(await txt(page, '.frd-sec:has-text("Friends")')), tag + " Accept: Jo is a friend");
    ok(!(await page.isVisible('.frd-sec:has-text("Requests")')), tag + " ... and the request is gone");
    await page.click('.frd-row[data-fr="u3"] summary'); await page.click('.frd-row[data-fr="u3"] [data-act="frd-block"]');
    await page.waitForSelector("dialog[open] [data-submit]");
    ok(/Block Jo\?/.test(await txt(page, "dialog[open] .sheet-head")), tag + " Block asks first");
    await page.click("dialog[open] [data-submit]"); await page.waitForSelector("#frdSheet .frd-sec"); await page.waitForTimeout(600);
    ok(await page.evaluate(() => window.__FR.blocks.includes("u3")) && !(await page.isVisible('.frd-row[data-fr="u3"]')), tag + " Block: Jo is blocked and gone from Friends");
    await page.click('.frd-row[data-fr="u2"] summary'); await page.click('.frd-row[data-fr="u2"] [data-act="frd-remove"]');
    await page.waitForSelector("dialog[open] [data-submit]"); await page.click("dialog[open] [data-submit]"); await page.waitForSelector("#frdSheet .frd-sec"); await page.waitForTimeout(600);
    ok(!(await page.isVisible('.frd-row[data-fr="u2"]')) && /No friends yet/.test(await txt(page, '.frd-sec:has-text("Friends")')), tag + " Remove Friend: Sam is gone");
    ok(!errs.length, tag + " no errors: " + errs.join(" | "));
    await ctx.close();
  }
  // Opening someone's friend link
  {
    const {ctx, page, errs} = await boot(browser, w, [], "?friend=patx7777");
    await page.waitForSelector("#frdLinkSheet .frd-who", {timeout: 8000}); await page.waitForTimeout(200);
    ok(/Pat/.test(await txt(page, "#frdLinkSheet")) && /@pat\.k/.test(await txt(page, "#frdLinkSheet")), tag + " a ?friend= link shows whose it is");
    ok(!/friend=/.test(await page.evaluate(() => location.search)), tag + " the code is taken out of the address");
    await page.screenshot({path: path.join(shots, `friends-${w}-link.png`)});
    await page.click('[data-act="frd-link-ask"]'); await page.waitForTimeout(500);
    ok(await page.evaluate(() => window.__calls.some(c => c[1] === "request_friend_by_code" && c[2].p_code === "PATX-7777")), tag + " Ask to Be Friends sends the request");
    ok(/Request sent/.test(await txt(page, "#toast")), tag + " ... and says so");
    // a code typed into Add a Friend opens the same sheet; a link that doesn't work says so
    await act(page, "frd-open"); await page.waitForSelector("#frdSheet");
    await page.fill("#frdWho", "ZZZZ-2222"); await page.click("#frdGo");
    await page.waitForSelector('#frdLinkSheet [role="alert"]', {timeout: 5000});
    ok(/isn't working anymore/.test(await txt(page, "#frdLinkSheet")), tag + " a link that doesn't work says so");
    ok(!errs.length, tag + " no errors: " + errs.join(" | "));
    await ctx.close();
  }
}

(async () => {
  const browser = await chromium.launch({executablePath});
  try { for (const w of [1280, 390]) await main(browser, w); } finally { await browser.close(); }
  console.log(`friends.e2e: ${checks} checks passed`);
})().catch(e => { console.error(e); process.exit(1); });
