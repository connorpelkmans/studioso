// Usernames: the app's instant check
const fs = require("fs"), path = require("path"), assert = require("assert");
let n = 0; const ok = (c, m) => { n++; assert(c, m); };
const html = require("../scripts/app-files").source(), sql = fs.readFileSync(path.join(__dirname, "..", "supabase-usernames.sql"), "utf8");
const src = html.slice(html.indexOf("/*UNAME-START*/"), html.indexOf("/*UNAME-END*/"));
const UNAME = new Function(src.replace("/*UNAME-START*/", "") + "\nreturn UNAME;")();

// the same word list, allow list and reserved names as the server
const words = [...sql.slice(sql.indexOf("insert into public.username_words"), sql.indexOf("on conflict (word)")).matchAll(/\('([a-z]+)', (true|false)\)/g)].map(m => [m[1], m[2] === "true" ? 1 : 0]);
ok(words.length > 100 && JSON.stringify(words) === JSON.stringify(UNAME.WORDS), "the app's word list matches the server's (" + words.length + " words)");
const allow = [...sql.match(/allow constant text\[\] := array\[(.*?)\];/)[1].matchAll(/'([a-z]+)'/g)].map(m => m[1]);
ok(JSON.stringify(allow) === JSON.stringify(UNAME.ALLOW), "the allow list matches the server's");
ok(html.includes(sql.match(/if l ~ '\^\((.*?)\)\$'/)[1]), "the reserved names match the server's");

// the same answers the server gave (checked on Postgres when these rules were written)
const fine = ["connor", "Connor_P", "classic_nerd", "grape.juice", "biol.nerd", "Sussex", "scunthorpe", "peacock", "cocktail", "analysis_king", "therapist", "Shiitake", "montenegro", "torpedo99", "Anna.Lee", "hello2026"];
const banned = ["a55hole", "fuuuck", "ass", "big_ass", "fuuuuck_you", "sh1tty", "serial_rapist", "fatass", "xxx_lover", "kkkfan", "n1gga", "f4g", "b1tch", "Phuck", "dickhead", "Moby.Dick", "the_n1gg3r"];
fine.forEach(u => ok(UNAME.problem(u) === "", `${u} is allowed: ${UNAME.problem(u)}`));
banned.forEach(u => ok(UNAME.problem(u) === "That name isn't allowed. Pick another.", `${u} is not allowed: ${UNAME.problem(u)}`));
ok(UNAME.problem("x") === "Use at least 3 characters." && UNAME.problem("abcdefghijklmnopqrstu") === "Use at most 20 characters.", "length limits");
ok(/Start with a letter/.test(UNAME.problem("1abc")) && /Start with a letter/.test(UNAME.problem("hello world")) && /Start with a letter/.test(UNAME.problem("5h1t_lord")), "only letters, numbers, _ and . , starting with a letter");
ok(/next to each other/.test(UNAME.problem("abc__d")) && /next to each other/.test(UNAME.problem("abc.")) && /next to each other/.test(UNAME.problem("a._b")), "no __ .. ._ or a trailing _ .");
ok(/reserved/.test(UNAME.problem("admin")) && /reserved/.test(UNAME.problem("studyboard_help")) && /reserved/.test(UNAME.problem("Support")), "reserved names");
console.log(`usernames.test: ${n} checks passed`);
