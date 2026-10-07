// Unit tests for keeping note boards when settings arrive from the account (code between /*NB-START*/ and /*NB-END*/ in index.html).  Run: node tests/noteboards.test.js
const fs = require("fs"), path = require("path"), assert = require("assert");
const s = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const keep = new Function(s.slice(s.indexOf("/*NB-START*/"), s.indexOf("/*NB-END*/")) + ";return keepNoteBoards;")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); }; const eq = (a, b, m) => { n++; assert.deepStrictEqual(a, b, m); };
const B = (id, name, extra) => Object.assign({id, name}, extra);
const names = st => (st.noteBoards || []).map(b => b.name);

// the account's copy has no boards (older, empty or reset): every board on this device survives
let next = {capacity: 15}, mine = {noteBoards: [B("a", "Biology"), B("b", "Chemistry")]};
ok(keep(next, mine) === true, "reports that boards were put back"); eq(names(next), ["Biology", "Chemistry"], "boards survive an account copy without any");
next = {noteBoards: []}; keep(next, mine); eq(names(next), ["Biology", "Chemistry"], "and one with an empty list");
// the account has other boards: both sets are kept
next = {noteBoards: [B("c", "History")]}; keep(next, mine); eq(names(next).sort(), ["Biology", "Chemistry", "History"], "boards from two devices are joined");
// nothing to add: no needless write
next = {noteBoards: [B("a", "Biology"), B("b", "Chemistry")]}; ok(keep(next, mine) === false, "nothing lost, nothing to send");
// deleted boards stay deleted, on both sides
next = {noteBoards: [B("a", "Biology")], noteBoardsGone: [{id: "b", at: 5}]}; keep(next, mine); eq(names(next), ["Biology"], "a board deleted on another device is not brought back");
next = {noteBoards: [B("a", "Biology"), B("b", "Chemistry")]}; keep(next, {noteBoards: [B("a", "Biology")], noteBoardsGone: [{id: "b", at: 5}]}); eq(names(next), ["Biology"], "a board deleted here is not brought back by the account's older copy");
eq(next.noteBoardsGone, [{id: "b", at: 5}], "the deletion is remembered");
next = {noteBoards: []}; keep(next, {noteBoards: [], noteBoardsGone: Array.from({length: 40}, (_, i) => ({id: "x" + i, at: i}))}); eq(next.noteBoardsGone.length, 30, "only the last 30 deletions are kept");
// names: a real name beats a placeholder
next = {noteBoards: [B("a", "Recovered Board")]}; keep(next, {noteBoards: [B("a", "Biology")]}); eq(names(next), ["Biology"], "a real name replaces Recovered Board");
next = {noteBoards: [B("a", "Biology (renamed)")]}; keep(next, {noteBoards: [B("a", "Biology")]}); eq(names(next), ["Biology (renamed)"], "otherwise the account's name stands");
// junk in either list is ignored
next = {noteBoards: [null, {name: "no id"}, B("a", "Biology")]}; keep(next, {noteBoards: [B("a", "Biology"), 7]}); eq(names(next), ["Biology"], "bad entries are ignored");
next = {capacity: 15}; ok(keep(next, undefined) === false && next.noteBoards === undefined, "no boards anywhere: settings untouched");
console.log(`noteboards.test: ${n} checks passed`);
