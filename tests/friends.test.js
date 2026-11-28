// Friends: the app's pure rules (81-friends.js FRIENDS-START) and that the app and supabase-friends.sql agree
const fs = require("fs"), path = require("path"), assert = require("assert");
let n = 0; const ok = (c, m) => { n++; assert(c, m); }; const eq = (a, b, m) => { n++; assert.deepStrictEqual(a, b, m); };
const html = require("../scripts/app-files").source(), sql = fs.readFileSync(path.join(__dirname, "..", "supabase-friends.sql"), "utf8");
const src = html.slice(html.indexOf("/*FRIENDS-START*/"), html.indexOf("/*FRIENDS-END*/"));
ok(src.length > 200, "the FRIENDS block is in the app");
const F = new Function(src.replace("/*FRIENDS-START*/", "") + "\nreturn FRIENDS;")();

// Friend link codes, from a link or typed
eq(F.codeOf("https://studyboardapp.com/app/?friend=K7P4-QD9X&ref=abc"), "K7P4-QD9X", "a code from a link");
eq(F.codeOf("?friend=k7p4qd9x"), "K7P4-QD9X", "lower case, no dash");
eq(F.codeOf("k7p4-qd9x"), "K7P4-QD9X", "a typed code");
eq(F.codeOf("sam.lee"), "", "a username isn't a code");
eq(F.codeOf("abcdefgh"), "", "8 letters without a dash is a username, not a code");
eq(F.codeOf("https://studyboardapp.com/?group=K7P4-QD9X"), "", "a group link isn't a friend link");

// The Add box
eq(F.parseAdd("@Sam.Lee"), {kind: "name", name: "Sam.Lee"}, "a username with @");
eq(F.parseAdd("  sam_lee "), {kind: "name", name: "sam_lee"}, "a username without @, trimmed");
eq(F.parseAdd("https://x.com/?friend=K7P4-QD9X"), {kind: "code", code: "K7P4-QD9X"}, "a pasted friend link");
eq(F.parseAdd("K7P4-QD9X"), {kind: "code", code: "K7P4-QD9X"}, "a typed code");
ok(F.parseAdd("").kind === "bad" && F.parseAdd("ab").kind === "bad" && F.parseAdd("1sam").kind === "bad" && F.parseAdd("sam lee").kind === "bad", "names that can't be usernames");
ok(/isn't a friend code/.test(F.parseAdd("https://studyboardapp.com/?group=K7P4-QD9X").msg), "another kind of link says so");

// What a request's answer says; a username that may not exist never gets a different answer
ok(/If @sam is on Studyboard/.test(F.answerText("sent", "@sam")), "sent by username: the same words whether or not the name exists");
ok(F.answerText("accepted", "@sam") === "You and @sam are now friends.", "they had asked you: friends");
ok(F.answerText("already", "@sam") === "You and @sam are already friends.", "already friends");
ok(F.answerText("sent", "") === "Request sent to them.", "sent from a link");

// Lists
const rows = [
  {user_id: "a", display_name: "zed", status: "accepted", mine: true, since: "2026-01-01"},
  {user_id: "b", display_name: "Amy", status: "accepted", mine: false, since: "2026-01-02"},
  {user_id: "c", display_name: "Cal", status: "pending", mine: false, since: "2026-03-01"},
  {user_id: "d", display_name: "Dee", status: "pending", mine: false, since: "2026-03-05"},
  {user_id: "e", display_name: "Eli", status: "pending", mine: true, since: "2026-03-02"},
  null, {display_name: "no id"}];
const L = F.split(rows);
eq(L.friends.map(r => r.user_id), ["b", "a"], "friends, by name (any case)");
eq(L.incoming.map(r => r.user_id), ["d", "c"], "requests to you, newest first");
eq(L.sent.map(r => r.user_id), ["e"], "requests you sent");
eq(F.split(null), {incoming: [], friends: [], sent: []}, "nothing loaded");

// Ages
const now = Date.parse("2026-11-26T12:00:00Z");
eq([F.ago("2026-11-26T08:00:00Z", now), F.ago("2026-11-25T08:00:00Z", now), F.ago("2026-11-20T12:00:00Z", now), F.ago("2026-10-10T12:00:00Z", now), F.ago("2026-06-01T12:00:00Z", now), F.ago("", now)],
  ["today", "yesterday", "6 days ago", "a month ago", "5 months ago", ""], "how long ago");

// The friend-link card on Groups
const base = {live: true, loaded: true, hidden: false, friends: 0, incoming: 0, sent: 0};
ok(F.showCard(base), "shown: signed in, nothing yet");
ok(!F.showCard(Object.assign({}, base, {hidden: true})) && !F.showCard(Object.assign({}, base, {loaded: false})) && !F.showCard(Object.assign({}, base, {friends: 1}))
  && !F.showCard(Object.assign({}, base, {incoming: 1})) && !F.showCard(Object.assign({}, base, {sent: 1})) && !F.showCard(Object.assign({}, base, {live: false})) && !F.showCard(null), "hidden otherwise");

// The app and the server agree
const app = html.slice(html.indexOf("/* ===== module: 81-friends.js"), html.indexOf("window.SBFRIENDS"));
const called = [...app.matchAll(/rpc\("([a-z_]+)"/g)].map(m => m[1]);
eq(called.sort(), ["answer_friend", "friend_link_preview", "my_friend_code", "my_friends", "remove_friend", "request_friend", "request_friend_by_code"], "the functions the app calls");
const granted = (sql.match(/grant execute on function ([\s\S]*?) to authenticated;/) || [])[1] || "";
called.forEach(f => {
  ok(new RegExp("create or replace function public\\." + f + "\\(").test(sql), f + " is in supabase-friends.sql");
  ok(granted.includes("public." + f + "("), f + " can be run by signed-in accounts");
});
ok(/revoke all on public\.friendships, public\.friend_codes from anon, authenticated;/.test(sql), "the tables can't be read or written directly");
ok(!/grant execute on function public\.sbf_/.test(sql), "the sbf_ helpers are never granted");
ok(sql.includes("'^[a-z][a-z0-9_.]{2,19}$'") && src.includes("/^[A-Za-z][A-Za-z0-9_.]{2,19}$/"), "the same username shape on both sides");
ok(/if them is null then return 'sent'; end if;/.test(sql), "an unknown username gets 'sent', like a real request");
ok(/after insert on public\.group_blocks/.test(sql), "blocking ends the friendship");
ok(fs.existsSync(path.join(__dirname, "..", "supabase-friends-selftest.sql")), "the server self-test is there");
console.log(`friends.test: ${n} checks passed`);
