// Store-readiness guards (static checks, no browser). Run: node tests/store-readiness.test.js
//  1. every table that holds user data is handled by account deletion (cascade or explicit) and storage is covered
//  2. the in-app privacy policy and website/privacy.html state the same key facts, with the same sections and date
//  3. no third-party / social login exists (Sign in with Apple is therefore not required)
//  4. the auth email templates use the right variables and have the app name, a plain-text link fallback and no trackers
//  5. the Pro sheet has auto-renewal wording, Terms and Privacy links, and Restore Purchases is reachable
const fs = require("fs"), path = require("path"), assert = require("assert");
const root = path.join(__dirname, "..");
const read = p => fs.readFileSync(path.join(root, p), "utf8");
let n = 0; const ok = (c, m) => { n++; assert(c, m); };

/* ---------- 1. deletion coverage ---------- */
const sqlFiles = fs.readdirSync(root).filter(f => /^supabase-.*\.sql$/.test(f) && !/selftest/.test(f));
const lean = read("supabase-lean.sql");
const worker = lean.slice(lean.indexOf("function public.studyboard_delete_user_data"), lean.indexOf("create or replace function public.studyboard_delete_my_account"));
const tables = {};   // table -> {fkCascade: bool, userCols: Set}
for (const f of sqlFiles) {
  const s = read(f);
  for (const m of s.matchAll(/create table if not exists public\.(\w+)\s*\(([\s\S]*?)\n\);/g)) {
    const t = tables[m[1]] = tables[m[1]] || {cascade: new Set(), setnull: new Set(), plain: new Set()};
    for (const line of m[2].split("\n")) {
      const c = line.match(/^\s*(\w+)\s+uuid\b/);
      if (!c) continue;
      if (/references auth\.users\s*\(id\) on delete cascade/.test(line)) t.cascade.add(c[1]);
      else if (/references auth\.users\s*\(id\) on delete set null/.test(line)) t.setnull.add(c[1]);
      else if (/^(user_id|owner_id|created_by|started_by|uid|reporter_id|reported_user_id|blocker_id|blocked_id)$/.test(c[1])) t.plain.add(c[1]);
    }
  }
}
const mentioned = t => new RegExp(`\\['${t}'`).test(worker) || new RegExp(`public\\.${t}\\b`).test(worker);
ok(Object.keys(tables).length > 25, "found the tables");
for (const [t, v] of Object.entries(tables)) {
  for (const c of v.plain) ok(mentioned(t), `${t}.${c} holds a user id with no foreign key: the delete worker must handle it`);
  for (const c of v.setnull) ok(mentioned(t) || t === "group_reports", `${t}.${c} is set null by the foreign key: confirm that is the intended rule`);
  // cascade tables are removed with the auth row; the explicit list in the worker is a belt-and-braces and gives the audit row counts
  for (const c of v.cascade) ok(mentioned(t) || t === "study_groups", `${t}.${c} cascades from auth.users but is not in the worker list (add it so the Edge Function path deletes it before the auth row goes)`);
}
ok(/split_part\(name, '\/', 1\) = p_uid::text/.test(worker) && /delete from storage\.objects/.test(worker), "worker sweeps storage rows it is allowed to");
ok(/studyboard_pro_grants[\s\S]*email = null/.test(worker) && /studyboard_billing_events[\s\S]*user_id = null/.test(worker), "grants and billing events are anonymized");
ok(/revoke all on function public\.studyboard_delete_user_data\(uuid\) from public, anon, authenticated/.test(lean), "worker is service-role only");
const fn = read("supabase-functions/delete-account/index.ts");
ok(/storage\/v1\/object\/\$\{BUCKET\}/.test(fn) && /admin\/users/.test(fn) && /studyboard_delete_user_data/.test(fn) && /api\.stripe\.com\/v1\/subscriptions/.test(fn), "edge function removes files, DB rows, Stripe subs and the auth user");
ok(/const BUCKET = "studioso-files"/.test(fn), "bucket name matches");

/* ---------- 2. privacy policy sync ---------- */
const app = read("index.html");
const appPrivacy = app.slice(app.indexOf("const PRIVACY = () =>"), app.indexOf("const TERMS = () =>")).replace(/`;\s*$/, "");
const web = read("website/privacy.html");
const webPrivacy = web.slice(web.indexOf("<h1>Privacy Policy</h1>"), web.indexOf("</div></section>", web.indexOf("<h1>Privacy Policy</h1>")));
const norm = h => h.replace(/<!--[\s\S]*?-->/g, "").replace(/\$\{[^}]*\}/g, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").toLowerCase();
const heads = h => [...h.matchAll(/<h[23]>(.*?)<\/h[23]>/g)].map(m => m[1].trim().toLowerCase());
const hApp = heads(appPrivacy), hWeb = heads(webPrivacy);
ok(hApp.length >= 16, "in-app policy has its sections");
assert.deepStrictEqual(hApp, hWeb, "in-app and website privacy sections must be the same, in the same order");
const dateApp = (app.match(/const UPDATED = "([^"]+)"/) || [])[1], dateWeb = (webPrivacy.match(/Effective: ([A-Za-z]+ \d+, \d{4})/) || [])[1];
ok(dateApp && dateApp === dateWeb, `effective date must match (app ${dateApp}, website ${dateWeb})`);
const FACTS = [/supabase auth/, /salted hash/, /gemini/, /anthropic/, /openai/, /your own key/, /improve its products/, /not pass through our servers|does not pass through/, /anonymous crash reports \(no personal content\)/, /turn this off at any time in settings/,
  /bug report/, /stays on your device/, /stripe/, /app store/, /only your plan status|we receive only your plan status/, /email delivery provider/, /support@your-domain|your-domain/, /45 days/, /30 days/, /13 and over/, /up to 16/, /international transfers/, /standard contractual clauses/,
  /delete my account and data/, /export a backup file/, /cancel/, /no analytics, no ads, no tracking/, /your rights/];
for (const re of FACTS) { ok(re.test(norm(appPrivacy)) || re.test(norm(appPrivacy.replace(/\$\{contact\(\)\}/g, "support@YOUR-DOMAIN"))), "in-app privacy must say: " + re); ok(re.test(norm(webPrivacy)), "website privacy must say: " + re); }
// paragraph text of every section matches once placeholders are neutralized
const body = h => norm(h.replace(/<h1>[\s\S]*?<\/h1>/, "").replace(/<p class="legal-meta">[\s\S]*?<\/p>/, "").replace(/<p class="muted">[\s\S]*?<\/p>/, "").replace(/<p class="msg">[\s\S]*?<\/p>/, "")).replace(/your name or company|your email provider|your region|support@your-domain/g, "").replace(/\s+/g, " ").trim();
const sec = (h, i) => body(h.split(/<h[23]>/)[i + 1] || "");
for (let i = 0; i < hApp.length; i++) {
  const a = sec(appPrivacy, i).replace(/^.*?<\/h[23]>/, ""), b = sec(webPrivacy, i);
  assert.strictEqual(a.replace(/\s+/g, ""), b.replace(/\s+/g, ""), `section "${hApp[i]}" text differs between the app and the website`);
}
// links
ok(/data-act="legal-privacy"/.test(app) && /SBLEGAL\.line\(\)/.test(app), "settings, sign-in and sign-up link to the privacy policy");
ok(/id="planLegal"/.test(app) && /data-act="legal-terms">Terms of Use/.test(app) && /data-act="legal-privacy">Privacy Policy/.test(app), "Pro sheet has Terms of Use and Privacy Policy links");
ok(/renews automatically unless it is cancelled at least 24 hours before the end of the current period/.test(app), "Apple auto-renewal wording present in the Pro sheet");
const site = read("website/index.html");
ok(/auto-renewing subscription/.test(site) && /terms\.html/.test(site) && /privacy\.html/.test(site), "website pricing has the renewal disclosure and links");
for (const f of ["website/index.html", "website/privacy.html", "website/terms.html", "website/account/index.html", "website/success.html", "website/cancel.html"]) ok(/href="(\.\.\/)?privacy\.html"/.test(read(f)) && /href="(\.\.\/)?terms\.html"/.test(read(f)), f + " footer links to privacy and terms");

/* ---------- 3. no social login ---------- */
const authFiles = ["index.html", "website/account/account.js", "website/account/index.html", "SETUP-GUIDE.md", "lms.js", "sw.js"].map(f => [f, read(f)]);
for (const [f, s] of authFiles) {
  ok(!/signInWithOAuth|signInWithIdToken|signInWithSSO|linkIdentity|provider:\s*["'](google|facebook|apple|github|azure|twitter|discord)/i.test(s), f + ": no OAuth/social sign-in call");
  ok(!/Continue with (Google|Facebook|Apple)|Sign in with (Google|Facebook)|accounts\.google\.com\/gsi|appleid\.auth|connect\.facebook\.net/i.test(s), f + ": no social login button or SDK");
}

/* ---------- 4. email templates ---------- */
const T = {"confirm-signup.html": ["Token", "ConfirmationURL"], "reset-password.html": ["Token", "ConfirmationURL"], "magic-link.html": ["Token", "ConfirmationURL"], "change-email.html": ["Token", "ConfirmationURL", "NewEmail"], "invite.html": ["ConfirmationURL"], "reauthentication.html": ["Token"]};
for (const [f, vars] of Object.entries(T)) {
  const s = read(f);
  for (const v of vars) ok(new RegExp(`\\{\\{ \\.${v} \\}\\}`).test(s), `${f} uses {{ .${v} }}`);
  ok(/<title>[^<]*Studyboard[^<]*<\/title>/.test(s) && />Studyboard</.test(s), f + " names the app");
  ok(/\{\{ \.SiteURL \}\}/.test(s), f + " links to the hosted site");
  if (vars.includes("ConfirmationURL")) ok(/copy this link[\s\S]*\{\{ \.ConfirmationURL \}\}/.test(s), f + " has a plain-text link fallback");
  ok(!/<script|<img|<iframe|<link|@import|url\(http|pixel|track|utm_/i.test(s), f + " has no scripts, images, trackers");
  ok(!/https?:\/\/(?!www\.w3\.org)/.test(s.replace(/\{\{[^}]*\}\}/g, "")), f + " has no hard-coded external URLs");
  ok(/color-scheme/.test(s) && /role="presentation"/.test(s), f + " is a simple table layout");
}

/* ---------- 5. restore purchases reachable ---------- */
ok((app.match(/data-act="plan-restore"/g) || []).length >= 2, "Restore Purchases in the Pro sheet and in Settings");
ok(/studyboard:purchase-result/.test(app) && /studyboard:plan-restore/.test(app), "purchase-result receiver and cancelable events exist");
ok(/studyboard:purchase-result/.test(read("ios-wrapper/README-IOS.md")) && /studyboard:purchase-result/.test(read("ios-wrapper/native-bridge.js")), "bridge contract documented and exampled");

console.log(`store-readiness: ${n} checks passed`);
