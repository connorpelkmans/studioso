// Every function a row-level security rule calls must be runnable by the people the rule is for. A rule for `authenticated`
// that calls a function `authenticated` can't execute fails every query the rule covers (once, a storage rule like that
// broke every file download), so each public.* function named in a rule needs `grant execute ... to authenticated`
// somewhere in the SQL files, and no later `revoke` in the same file taking it away.
const fs = require("fs"), path = require("path"), assert = require("assert");
const root = path.join(__dirname, "..");
const files = fs.readdirSync(root).filter(f => /^supabase-.*\.sql$/.test(f) && !/selftest/.test(f));
assert(files.length > 5, "found the SQL files");
// a policy can sit inside a DO block's execute '...': undo the doubled quotes so it reads like plain SQL
const plain = s => s.replace(/--[^\n]*/g, "").replace(/''/g, "'");
const fnsIn = s => [...s.matchAll(/\bpublic\.([a-z_][a-z0-9_]*)\s*\(/gi)].map(m => m[1].toLowerCase());
const granted = new Map();   // function -> granted to authenticated at the end of some file
const rules = [];
for (const f of files) {
  const sql = plain(fs.readFileSync(path.join(root, f), "utf8")), state = new Map();
  // grants and revokes, in file order
  for (const m of sql.matchAll(/\b(grant|revoke)\s+(?:all|execute)(?:\s+privileges)?\s+on\s+function\s+([\s\S]*?)\s+(to|from)\s+([^;]*);/gi)) {
    const who = m[4].toLowerCase().split(/[\s,]+/);
    if (!who.includes("authenticated") && !who.includes("public")) continue;
    fnsIn(m[2]).forEach(fn => {
      if (m[1].toLowerCase() === "grant") state.set(fn, true);
      else if (who.includes("authenticated")) state.set(fn, false);
    });
  }
  state.forEach((v, fn) => { if (v) granted.set(fn, true); else if (!granted.has(fn)) granted.set(fn, false); });
  for (const m of sql.matchAll(/\bcreate\s+policy\s+("[^"]+"|\S+)\s+on\s+([\w.]+)([\s\S]*?)(?:;|'\s*;|\$\$)/gi)) {
    const body = m[3], to = (/\bto\s+([\w\s,]+?)\s+(?:using|with)\b/i.exec(body) || [])[1] || "public";
    if (!/\b(authenticated|public)\b/i.test(to)) continue;
    fnsIn(body).forEach(fn => rules.push({f, policy: m[1], table: m[2], fn}));
  }
}
assert(rules.length > 20, "found the rules that call functions (" + rules.length + ")");
const bad = rules.filter(r => granted.get(r.fn) !== true);
assert(!bad.length, "rules call functions signed-in people can't run (add grant execute ... to authenticated):\n" + bad.map(r => `  ${r.f}: ${r.policy} on ${r.table} calls public.${r.fn}`).join("\n"));
// the live concept map tables (supabase-groups.sql) are covered: members only, and every helper they use is granted
const groups = plain(fs.readFileSync(path.join(root, "supabase-groups.sql"), "utf8"));
["group_maps", "group_map_ops", "group_map_people"].forEach(t => {
  assert(new RegExp(`alter table public\\.${t} enable row level security`).test(groups), t + " has row-level security");
  assert(new RegExp(`revoke all on public\\.${t} from anon`).test(groups), t + " is closed to anon");
  assert(rules.some(r => r.table === "public." + t && r.fn === "sbg_is_member"), t + " is for group members only");
});
assert(/grant execute on function public\.group_map_preview\(uuid, jsonb\) to authenticated/.test(groups), "members can send a map's preview");
console.log(`sql-policy-grants.test: ${rules.length} function calls in ${new Set(rules.map(r => r.policy + r.table)).size} rules, all runnable by signed-in people`);
