# Store readiness: Apple App Store and Google Play

Status key: **Done** = implemented and verified here; **Done, owner step** = implemented, needs your accounts/keys/text before launch; **Documented** = a doc or placeholder only.

Re-run everything with:

```
node tests/store-readiness.test.js
node --experimental-strip-types supabase-functions/tools/test-functions.mjs
node tests/e2e/store-flows.e2e.js            # Playwright, stubbed Supabase client + mock purchase bridge (test only)
node tests/ai-quality.test.js && node tests/ains-gates.test.js
# Supabase SQL Editor (rolls back, safe on production): supabase-delete-selftest.sql  ->  "ALL 41 ACCOUNT-DELETION CHECKS PASSED"
```

## Summary table

| # | Item | Status | Where | How verified | Remaining owner action |
|---|---|---|---|---|---|
| 1a | Delete account removes **server data** (database) | Done | `supabase-lean.sql`: `studyboard_delete_user_data(uuid)` (service role only) and `studyboard_delete_my_account()` (caller only, fallback path) | `supabase-delete-selftest.sql` (41 attacker-style checks, run on PostgreSQL 16 with a stubbed auth/storage schema); `tests/store-readiness.test.js` scans every `supabase-*.sql` for tables holding a user id and fails if one is not covered | Re-run `supabase-lean.sql` on production, run the self-test once in the SQL Editor |
| 1b | Uploaded files (storage bytes) deleted | Done | `supabase-functions/delete-account/index.ts` lists and removes every object under `<uid>/` in `studioso-files` (recursive, 100 per call), service role; SQL also sweeps the metadata rows where allowed; app fallback deletes with the person's own session | Mock tests in `test-functions.mjs` (order: Stripe, files, DB rows, auth user; paths asserted); e2e fallback test asserts `storage.remove` | Deploy the function (Verify JWT **On**); test once with a real file |
| 1c | Re-authentication, typed confirmation, rate limit, idempotent | Done | same function: `last_sign_in_at` within 10 min **or** password re-entry (verified against `/auth/v1/token`), `confirm` must be DELETE, `studyboard_plan_rate_hit` 5/hour, every step safe to repeat (auth user already gone = success) | `test-functions.mjs` (stale sign-in 403, wrong password 403, no confirm 400, rate limit 429, second run 200) | None |
| 1d | Subscriptions | Done | Stripe: server cancels all active subscriptions first and **stops if Stripe fails** (billing is never left running). App Store/Google: 409 `store_subscription`, the sheet shows a warning, the link `https://apps.apple.com/account/subscriptions` and requires a checkbox | mock tests (cancel order, Stripe 500 leaves the account intact, Apple needs ack); e2e (ack row appears, retried with `ack_store_subscription: true`) | Set `STRIPE_SECRET_KEY` and `SITE_ORIGINS` secrets on the function; test with a Stripe test-mode subscription |
| 1e | Sessions revoked, device wipe, confirmation screen | Done | deleting the auth user ends all sessions; client: `wipeDeviceData()` + `wipeDevice()` + `aiWipeLocal()`; screen "Your Account Was Deleted" lists what was removed and what is retained (backups up to 30 days, payment records at Stripe/Apple, anonymous abuse reports) | e2e: checklist text, device marker removed, no RPC fallback when the function worked | Confirm your Supabase backup retention is 30 days or less (the policy says "up to 30 days") |
| 1f | Fallback when function not deployed | Done | `deleteSheet()` in the 99-release module: 404 from `delete-account` falls back to client file deletion + `studyboard_delete_my_account()`; refuses (clear message) when a card subscription is active because it cannot cancel Stripe | e2e fallback test | Deploy the function so the fallback is never needed |
| 1g | Website deletion path (Play requires a web URL) | Done | `website/account/` "Delete account" panel calls the same function | `node --check`; panel visible in the account view; no automated browser test of the panel itself | Use `https://YOUR-DOMAIN/account/` as the Play "delete account" URL |
| 2a | Privacy policy complete and correct (hosted + in-app) | Done, owner step | `website/privacy.html` rewritten; in-app text in `index.html` (`PRIVACY`, 99-release module). Covers account email + password hash (Supabase Auth), synced data, uploaded files, Gemini/Anthropic/OpenAI (own key + consent, free-tier Google may train, content goes device to provider), **marked** anonymous crash-report section, bug reports, LMS stays on device, Stripe/Apple (plan status only), email delivery provider, retention, deletion, export, rights, international transfers, children 13+/16, contact, effective date, change policy. Also fixed a wrong sentence (it said AI keys were saved with the account; they are device-only) | `tests/store-readiness.test.js`: same section headings in the same order, identical section text (placeholders neutralised), same effective date, 28 required facts in both | Replace `YOUR NAME OR COMPANY`, `support@YOUR-DOMAIN`, `YOUR EMAIL PROVIDER`, `YOUR REGION` (website) and `SUPPORT` in the 99-release module; have it legally reviewed; ship the crash-reporting feature with it or delete that section from both (the test enforces both) |
| 2b | Links: Settings, sign-in/sign-up, Pro sheet, website footer | Done | Settings "Privacy Policy" row; `SBLEGAL.line()` on sign-in/sign-up; Pro sheet "Terms of Use" and "Privacy Policy" (back returns to the Pro sheet); every website page footer | store-readiness test (all six website pages), e2e (sign-up shows Privacy link; Pro sheet shows both) | Paste the hosted policy URL in App Store Connect |
| 2c | Auto-renewal disclosure (Apple 3.1.2) | Done | Pro sheet `renewalText()`: price, period, trial, Apple's required wording in store builds, cancel info; website pricing "Subscription details" + Terms (Apple paragraph) | e2e asserts the text; store-readiness test | Check price strings match App Store Connect |
| 2d | App Privacy label + Play Data Safety text | Done | `APP-STORE-CHECKLIST.md` sections 6, 6a, 6b | review | Paste into App Store Connect / Play Console |
| 3a | Restore Purchases reachable | Done | Pro sheet (always when Pro is switched on), Settings row "Restore Purchases", every paywall prompt opens the Pro sheet | e2e (Pro sheet, Settings row, anonymous user is asked to sign in first and no native call is made) | None |
| 3b | Store builds use native bridge only | Done | `nativeStore()` builds: Buy, Manage and Restore go through cancelable `studyboard:plan-*` events; no Stripe/website link in the store Pro sheet; `manage()` for a Stripe plan in a store build shows a message, not a link; `EXTERNAL_PURCHASE_ALLOWED` stays false | e2e: Pro sheet HTML has no stripe/checkout/site URL, `window.open` never called on Buy/Manage | RevenueCat products and webhook |
| 3c | Restore progress, success, nothing, error, refresh | Done | `restore()`, `studyboard:purchase-result` receiver (`action` + `status`: success/cancelled/nothing/error), button shows "Restoring…", success re-reads the plan up to 5 times, 60 s timeout | e2e with deterministic mock bridge (success then `StudyboardPlan.isPro()` true; nothing; error with message; cancelled; double tap ignored) | None |
| 3d | Native contract documented + example | Done | `ios-wrapper/README-IOS.md` "Purchase bridge contract"; `ios-wrapper/native-bridge.js` section 5 (RevenueCat example) | `node --check`; contract matches the receiver | Put your RevenueCat public key, offering and `pro` entitlement in `native-bridge.js`; the example was **not run on a device** |
| 4 | Sign in with Apple not required | Done (compliant) | email + password only | grep + `tests/store-readiness.test.js` (no `signInWithOAuth`/`signInWithIdToken`/`linkIdentity`/social SDK or button in the client, website, LMS, setup guide); guard note and "If you add Google sign-in later" steps in `APP-STORE-CHECKLIST.md`; SETUP-GUIDE warning | None; update the test deliberately if you add a provider |
| 5a | Sign-up with confirmation, unverified state, resend cooldown | Done | `sbSignInSheet()`: confirm step says the planner works on this device only until confirmed; "Send a New Code" has a visible 30 s countdown kept across re-opening; website code form got the same button | e2e (app) and website e2e | None |
| 5b | Forgot password (app and website), recovery form, expired link | Done | app: forgot -> code + new password with strength; link flow: `sbNewPasswordSheet()` now has confirm + strength; `SB_LINK_ERR` + `sbLinkErrorSheet()`; website: confirm + strength, expired link message with "Send a new link" | e2e (app and website) | None |
| 5c | Change email / password with re-authentication | Done | new Settings rows "Change Email" and "Change Password" (`securitySheet()`): asks the current password, change email goes through Supabase secure email change (both addresses), password falls back to the `reauthenticate()` code (nonce) | e2e (nonce path); change-email not run against a real project | Turn on Secure email change and Secure password change in Supabase |
| 5d | No user enumeration | Done | sign-up for an existing address now looks identical to a new one (was "already an account"); forgot password neutral in app and website; wrong password generic | e2e | None |
| 5e | Email templates | Done | all six templates: `<title>` and header name the app, hidden preheader, code and button, link printed in plain text, `{{ .SiteURL }}` link, recipient, no images/scripts/trackers/external URLs, only valid variables | store-readiness test | Paste into Supabase, send yourself each one |
| 5f | Redirect URLs, Site URL, SMTP checklist, Supabase settings | Documented | `SETUP-GUIDE.md` Part 1b: settings (confirm email, secure email/password change, leaked-password protection, CAPTCHA, rate limits), 4b SPF/DKIM/DMARC and deliverability checklist, 4c redirect allowlist (web, `studyboard://`, `capacitor://localhost`) | read-through | Do the checklist; **email deliverability and the real redirect flow were not tested** (no Supabase project here) |

## What was changed (map)

* `supabase-lean.sql`: new `studyboard_delete_user_data(p_uid)` (jsonb counts, groups handed over or deleted, authored group content deleted, grants and billing events anonymized, reports unlinked, rate counters removed, bug reports and email-matching bug reports removed, storage rows swept) and `studyboard_delete_my_account()` now calls it.
* `supabase-functions/delete-account/index.ts` (new), tests in `supabase-functions/tools/test-functions.mjs` (+3 tests, 20 checks total).
* `supabase-delete-selftest.sql` (new).
* `index.html`: 99-release module (`callDelete`, `deleteSheet`, `deletedSheet`, `securitySheet`, privacy and terms text); plan module (`nativeFire`, `waitResult`, `restore`, `afterNativeCheckout`, `renewalText`, Settings restore row); auth (`SB_LINK_ERR`, `sbStrength`, `sbSignInSheet` resend cooldown, `sbNewPasswordSheet`, `sbLinkErrorSheet`).
* `website/privacy.html`, `website/terms.html`, `website/index.html`, `website/account/index.html`, `website/account/account.js`.
* `confirm-signup.html`, `reset-password.html`, `magic-link.html`, `change-email.html`, `invite.html`, `reauthentication.html`.
* `ios-wrapper/README-IOS.md`, `ios-wrapper/native-bridge.js`, `SETUP-GUIDE.md`, `APP-STORE-CHECKLIST.md`.
* Tests: `tests/store-readiness.test.js`, `tests/e2e/store-flows.e2e.js`.

## Data inventory used for the deletion audit

| Table / store | Holds | Handling on deletion |
|---|---|---|
| `items`, `studyboard_deletions`, `studyboard_archive` | synced planner, deletion log, packed archive | deleted |
| `studyboard_entitlements`, `studyboard_devices`, `studyboard_device_removals`, `studyboard_usage`, `studyboard_billing_customers` | plan, devices, usage, Stripe customer link | deleted (Stripe's own record stays with Stripe) |
| `studyboard_pro_grants` | who got Pro, email, reason | kept, anonymized: user id, email and reason set null |
| `studyboard_billing_events` | processed payment events | kept, `user_id` set null |
| `studyboard_rate`, `studyboard_plan_rate` | counters keyed by user id | rows for the user removed |
| `study_groups`, `group_members` | groups, membership | owned group: ownership to the longest-standing other member, else deleted; memberships deleted |
| `group_messages`, `group_items`, `group_rsvps`, `group_reactions`, `group_checkins`, `group_quiz_scores`, `group_stats` | authored group content | deleted (rule: authored content goes with the account) |
| `group_reports` | abuse reports | kept for safety, `reporter_id` / `reported_user_id` set null |
| `group_blocks`, `study_profiles`, `shared_decks` | blocks, profile, shared decks | deleted |
| `study_rooms`, `study_room_people` | rooms started / joined | deleted |
| `push_subscriptions`, `reminder_queue`, `calendar_feeds` | push addresses, reminders, calendar tokens | deleted |
| `bug_reports` | reports with `user_id`, `contact_email` | deleted (also signed-out reports whose contact email is the account email) |
| Storage `studioso-files/<uid>/…` | uploaded files | deleted by the Edge Function (bytes), rows swept by SQL |
| Supabase Auth | email, password hash, sessions | `auth.admin.deleteUser` |
| Stripe | customer, subscriptions, invoices | subscriptions cancelled; records retained by Stripe by law |
| Apple / Google, RevenueCat | purchases | cannot be cancelled by us; the person is told how |
| AI providers | content sent with the person's own key | never passes through us; nothing to delete on our side |
| Error-report tables (crash-reporting work, other branch) | anonymous, no user id | not present in this branch; the test fails if one with a user id appears |

## Caveats

* The SQL self-test ran on a local PostgreSQL 16 with a stubbed `auth` and `storage` schema, not on Supabase itself (no Supabase project here). `reminders` SQL's cron/pg_net parts do not exist locally; its tables were created and tested.
* The Edge Function was tested with mocked `fetch` under Node (strip-types), not deployed on Deno, and never called against real Stripe, Supabase Storage or GoTrue endpoints. The URLs used are the documented REST paths (`/storage/v1/object/list/{bucket}`, `DELETE /storage/v1/object/{bucket}` with `prefixes`, `DELETE /auth/v1/admin/users/{id}`, Stripe `DELETE /v1/subscriptions/{id}`).
* The re-authentication test relies on `last_sign_in_at` from `/auth/v1/user`, not the token `iat` (a refresh renews `iat` without a sign-in).
* Email deliverability, real redirect handling and the Supabase dashboard settings are owner work (checklists in `SETUP-GUIDE.md`).
* The privacy policy is a plain-language draft, not legal advice. The crash-report paragraph describes a feature built in another branch; keep them together.
* The native purchase bridge example was not run on a device or against RevenueCat.
* Password-strength rules are client-side hints; the server minimum (8 characters, optional leaked-password check) is what enforces.
