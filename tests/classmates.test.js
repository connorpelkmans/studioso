// Unit tests for Classmates: which courses are sent to the server, and how
const assert = require("assert");
const s = require("../scripts/app-files").source();
const cut = (a, b) => s.slice(s.indexOf(a), s.indexOf(b));
const T = new Function(cut("/*CM-START*/", "/*CM-END*/") + ";return {cmPayload, cmSig};")();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };

const canvas = {id: "cv_1", name: "Calculus I", code: "MATH 101", cv: {ou: 48213}, links: [{label: "Canvas", url: "https://canvas.ubc.ca/courses/48213"}]};
const bright = {id: "bs_2", name: "Biology", code: "", bs: {ou: "6606"}, links: [{label: "Notes", url: "https://x.com"}, {label: "Brightspace", url: "https://learn.school.ca:8443/d2l/home/6606"}]};
const room = {id: "gc_3", name: "AP Chem", code: "", gc: {ou: "NjI5"}, links: []};
const manual = {id: "c4", name: "Piano", code: "MUS 1", links: [{label: "Canvas", url: "https://canvas.ubc.ca/courses/1"}]};
const archived = Object.assign({}, canvas, {id: "cv_5", archived: true});
const insecure = {id: "cv_6", name: "Old", cv: {ou: "7"}, links: [{label: "Canvas", url: "http://canvas.old.edu/courses/7"}]};
const noLink = {id: "md_7", name: "Moodle course", md: {ou: "12"}, links: []};

const out = T.cmPayload([canvas, bright, room, manual, archived, insecure, noLink, canvas]);
ok(out.length === 3, "three courses can be matched: " + JSON.stringify(out));
ok(JSON.stringify(out[0]) === JSON.stringify({ref: "cv_1", platform: "cv", origin: "https://canvas.ubc.ca", ou: "48213", label: "MATH 101"}), "Canvas: the site's address from the course link, the id as text, the course code as the label");
ok(out[1].origin === "https://learn.school.ca:8443" && out[1].label === "Biology", "Brightspace: a port is kept; no code means the name is the label");
ok(out[2].platform === "gc" && out[2].origin === "https://classroom.google.com", "Google Classroom always has the same address");
ok(!out.some(x => x.ref === "c4"), "a course added by hand isn't sent, even with a school site link");
ok(!out.some(x => x.ref === "cv_5"), "archived courses aren't sent");
ok(!out.some(x => x.ref === "cv_6"), "an address that isn't https isn't sent");
ok(!out.some(x => x.ref === "md_7"), "a course without its school site's address isn't sent");
ok(out.filter(x => x.ref === "cv_1").length === 1, "a course is sent once");

const many = Array.from({length: 55}, (_, i) => ({id: "cv_" + i, name: "C" + i, cv: {ou: String(i)}, links: [{label: "Canvas", url: "https://c.edu/courses/" + i}]}));
ok(T.cmPayload(many).length === 40, "at most 40 courses");
ok(T.cmPayload([{id: "x", cv: {ou: "1".repeat(121)}, links: [{label: "Canvas", url: "https://c.edu"}]}]).length === 0, "an over-long course id is skipped");
ok(T.cmPayload(null).length === 0 && T.cmPayload([null, {}]).length === 0, "nothing in, nothing out");

ok(T.cmSig(T.cmPayload([canvas])) === T.cmSig(T.cmPayload([Object.assign({}, canvas, {links: [{label: "Canvas", url: "https://CANVAS.ubc.ca/x"}]})])), "the signature ignores letter case in the address");
ok(T.cmSig(T.cmPayload([canvas])) !== T.cmSig(T.cmPayload([Object.assign({}, canvas, {code: "MATH 102"})])), "a new label changes the signature");

console.log(`classmates: ${n} checks passed`);
