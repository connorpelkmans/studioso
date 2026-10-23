// Unit tests for where a new note goes on the board (code between /*NOTESPOT-START*/ and /*NOTESPOT-END*/).  Run: node tests/note-spot.test.js
const assert = require("assert");
const s = require("../scripts/app-files").source();
const a = "/*NOTESPOT-START*/", i = s.indexOf(a), j = s.indexOf("/*NOTESPOT-END*/", i);
assert(i >= 0 && j > i, "marker");
const spot = new Function(s.slice(i + a.length, j) + ";return noteFreeSpot;")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const W = 200, H = 160, view = {x: 0, y: 0, w: 900, h: 600};
const clear = (p, rects) => rects.every(r => p.x >= r.x + r.w || p.x + W <= r.x || p.y >= r.y + r.h || p.y + H <= r.y);

ok(JSON.stringify(spot([], view, W, H)) === JSON.stringify({x: 16, y: 16}), "an empty board starts at the top left");
let rects = [{x: 40, y: 40, w: 200, h: 150}];
let p = spot(rects, view, W, H);
ok(clear(p, rects) && p.y === 16, "the next note goes beside the first one, on the same row: " + JSON.stringify(p));
rects = [{x: 0, y: 0, w: 900, h: 300}];
p = spot(rects, view, W, H);
ok(clear(p, rects) && p.y >= 300, "a full row sends it below: " + JSON.stringify(p));
rects = [{x: 0, y: 0, w: 900, h: 600}];
p = spot(rects, view, W, H);
ok(clear(p, rects) && p.y >= 600, "a full view puts it just under the notes there: " + JSON.stringify(p));
p = spot([], {x: 400, y: 900, w: 500, h: 400}, W, H);
ok(p.x === 416 && p.y === 916, "it stays in the part of the board you're looking at: " + JSON.stringify(p));

console.log(`note-spot: ${n} checks passed`);
