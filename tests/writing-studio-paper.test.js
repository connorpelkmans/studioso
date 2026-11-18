// Writing Studio's Review cards show a paper as it's laid out: paperParts reads its opening lines as a reader would. MLA's header (student,
// teacher, course, date) before a title, a title page (the title, then its lines), or no front matter at all, and where the body starts.
const assert = require("assert");
const s = require("../scripts/app-files").source();
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const i = s.indexOf("const PM = "), j = s.indexOf("// The Writing view in Review");
assert(i > 0 && j > i, "paperParts is in the source");
const parts = new Function(s.slice(i, j) + ";return paperParts;")();
const read = t => { const r = parts(t); return {head: r.head.map(h => h.k + ":" + h.t), title: r.title, page: r.page, body: r.body.slice(0, 24)}; };

let r = read("Connor Pelkmans (53918363)\nSCIE 113 214\nPhilip Stamp\n3/12/2021\nHow does Toxoplasma gondii affect human behavior?\nEver since the first connection was made between infection with the protozoan parasite Toxoplasma gondii and behaviour in rodents, researchers have asked whether the same is true of people.");
ok(JSON.stringify(r.head) === JSON.stringify(["name:Connor Pelkmans (53918363)", "course:SCIE 113 214", "teacher:Philip Stamp", "date:3/12/2021"]) && r.title === "How does Toxoplasma gondii affect human behavior?" && !r.page && r.body === "Ever since the first con", "an MLA header: student (with an ID), course, teacher, date, then the title: " + JSON.stringify(r));
r = read("Jane Doe\nProfessor Smith\nENGL 101\n12 March 2024\nSleep and Teens\nTeenagers are chronically short on sleep, and it shows in class. Short sleep blunts memory (Walker, 2017), and the body clock shifts later.");
ok(r.head.join("|") === "name:Jane Doe|teacher:Professor Smith|course:ENGL 101|date:12 March 2024" && r.title === "Sleep and Teens", "a title that looks like a name is still the title (it comes after the date)");
r = read("Frederic Ma, 73205619\n\nThe East Bengal Crisis\n\nPeter Singer’s thesis argues that the way people from relatively affluent countries react to such a humanitarian crisis cannot be justified.");
ok(r.head.join("|") === "name:Frederic Ma, 73205619" && r.title === "The East Bengal Crisis", "a name and a student number, then the title (The… isn't a name)");
r = read("Urban Heat and Green Space\nJane Doe\nDepartment of Biology, University of Somewhere\nBIO 210: Ecology\nDr. Lee\nMarch 12, 2024\nCities are warming fast, and parks are cooler than the blocks around them (Smith & Lee, 2021). This paper looks at why.");
ok(r.page && r.title === "Urban Heat and Green Space" && r.head.join("|") === "name:Jane Doe|school:Department of Biology, University of Somewhere|course:BIO 210: Ecology|teacher:Dr. Lee|date:March 12, 2024", "an APA title page: the title first, then its lines: " + JSON.stringify(r));
r = read("Cities are warming fast (Smith & Lee 2021). Ng (2019) says cities must plan for heat. Parks are cooler than the blocks around them.");
ok(!r.head.length && !r.title && /^Cities are warming/.test(r.body), "no front matter: it's all body");
r = read("Notes on the reading\nA few thoughts");
ok(!r.head.length && !r.title, "short notes with no body paragraph aren't read as a header");
console.log(`writing-studio-paper: ${n} checks passed`);
