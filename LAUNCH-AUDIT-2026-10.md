# Launch readiness audit: quality and security (2026-10-05)

Scope: the whole repository at commit `39bc273`. That covers the web/PWA (`index.html`, `sw.js`, `website/`), the Supabase SQL and edge functions, the Electron desktop app, the iOS/Android wrappers, the store-compliance material, the tests, CI and dependencies. This audit was done independently of the earlier self-assessments (`STORE-READINESS.md`, `SECURITY-AUDIT-APPSTORE.md` and others), and several of their "Fixed" or "Done" claims turned out to be wrong or incomplete.

The audit did not change any code. All tests were run. The top findings below were each confirmed by reading the code at the cited line.

## Verdict

| Target | Verdict | Why |
|---|---|---|
| **Website / PWA** | **Not ready. Close: about 1–2 days of fixes plus owner setup.** | Live JS crash on every page load, a stored-XSS path, an invite-code brute force, and placeholder legal/contact text shown to users |
| **Desktop (direct download)** | **Not ready** | School (LMS) sync is broken on all three platforms; builds are unsigned or ad-hoc signed; the PDF.js advisory |
| **Mac App Store** | **Not ready** | The above, plus the CI MAS job can never pass, the data folder is invisible inside the sandbox, and the Team ID and provisioning profiles are missing |
| **Apple App Store (iOS)** | **Not ready. Weeks, not days.** | There is no Xcode project. The Swift code has never been compiled. Push reminders cannot work in the wrapper. In-app text says "phone apps don't exist yet". RevenueCat is not configured. High risk under guideline 4.2 |
| **Google Play** | **Not ready. Weeks, not days.** | There is no Gradle project and no `targetSdk`. There is no way to buy Pro on Android. Reminders don't work in the WebView. The share receiver is exported and adds tasks without asking |

The core product is well built. Output escaping is careful (all 168 HTML sinks were reviewed). RLS is enabled on every table, and every SECURITY DEFINER function pins `search_path`. Billing and webhook verification is correct, and the Electron hardening is solid. Accessibility has no serious or critical axe violations. Most of the remaining work is a short list of real bugs plus the parts that were never built: the native mobile projects, push, and store billing on Android.

---

## 1. Release blockers: code fixes

| # | Sev | Area | Finding | Evidence | Fix |
|---|---|---|---|---|---|
| B1 | **High** | Web/all | **Uncaught `ReferenceError: S is not defined` on every mascot hop.** A comma where a semicolon belongs makes `S = safeRect()` an assignment to an undeclared variable in strict mode. 15 errors appear on one phone load. It causes 4 of the 5 failing e2e suites and will flood error reporting. It came in with commit `4417a5c`. | `index.html:52805` | `...(big ? " big" : ""); const S = safeRect();` |
| B2 | **High** | Desktop | **LMS sync is broken (Brightspace, Canvas, Blackboard).** `Pv.harvest.toString()` is injected into the school page. The harvest functions call `htmlText`, which lives only in the main-process module scope, so they throw `ReferenceError` whenever a course has assignments or grades. Tests pass a pre-built harvest result, so they never catch this. | `lms.js:521` (inject), `lms.js:25` (definition), callers at `:158`, `:263`, `:368` | Inject `htmlText` and the `HT_*` constants together with the harvest, or return raw HTML and run `htmlText` in the main process. Add a test that runs the real harvest |
| B3 | **High** | Backend | **Invite codes can be brute-forced.** `join_group` calls `perform sbg_lookup_ok()`, which discards the result, so the rate limit is never enforced. Codes are 6 characters from a 31-letter alphabet (about 30 bits). Any free account can guess codes in a loop and join groups, which exposes messages, tasks, member names and room realtime. | `supabase-groups.sql:304-308`, code generator `:13-26` | `if not public.sbg_lookup_ok() then raise exception ...` at the top for every call, as `get_shared_deck` does. Lengthen codes to 10–12 characters and consider expiry |
| B4 | **Med-High** | Web | **Stored XSS through an imported backup.** `normNote()` converts only `x` and `y` to numbers. `z`, `rot` and all sticker fields are placed raw into `style="..."` attributes. A shared "template" backup can run script on import, then sync it to every device. On web and Capacitor the meta CSP allows `'unsafe-inline'`, so the script can steal the Supabase session and the user's AI keys. The desktop build is protected by its hash-only CSP. | `index.html:14351-14356` (normNote), `:14392` (sink), `:10141` (stickers) | `n.z = int(n.z)`, `n.rot = clamp(Number(n.rot)\|\|0, -30, 30)`, and validate stickers against `STICKERS`. Search for other `style="${obj.field}"` sinks |
| B5 | **High** | All | **pdfjs-dist 5.7.284 is affected by GHSA-hq66-cqwq-w95j** (arbitrary JS when opening a malicious PDF). The app only extracts text and sets `isEvalSupported:false`, so it may not be exploitable, but that can't be proven here. PDFs come from LMS attachments and from groups. **CI's `npm audit --omit=dev` cannot see this, because every dependency is a devDependency.** | `package.json` (pdfjs-dist), `vendor/pdfjs/`, `.github/workflows/build-desktop.yml:72,100` | Upgrade to ≥ 6.2.108, re-vendor and re-run the PDF tests. Change CI to `npm audit --audit-level=high` |
| B6 | Medium | Web | **Any website can silently add tasks** through the PWA share target, for example a phishing link "due tomorrow". `stagedShare` passes `trusted:true`, and auto-add is on by default, so the confirm sheet is skipped. | `sw.js:41`, `index.html:~34808`, `present()` `~34723` | Pass `trusted:false` in `stagedShare`. Reject cross-origin POSTs in the SW |
| B7 | Medium | Backend | **Anonymous bug-report flood.** The `anon` role can insert. The per-sender limit is keyed on a `client_id` the client chooses. Rows can carry a 400 KB screenshot and there is no retention. About 2 GB/day fills a free-tier DB in hours. | `supabase-bug-reports.sql:33,43-49,62-71` | Accept reports through an edge function with per-IP limits, put screenshots in storage with a cap, add retention |
| B8 | Medium | Backend | **send-reminders can be used for blind requests and traffic amplification.** `push_subscriptions.endpoint` accepts any https host, with no per-user cap. The `reminder_queue` policy is `for all`, so users can bypass the 1,000-row cap. | `supabase-reminders.sql:298-304,327-328`, `index (3).ts:55,103` | Allowlist push-service hosts. Cap subscriptions and queue rows per user. Remove direct writes to `reminder_queue` |
| B9 | Medium | Backend | **`studyboard_delete_my_account()` RPC skips re-auth, Stripe cancellation and file deletion.** It is granted to `authenticated`, so a stolen session wipes the account in one call while billing keeps running. | `supabase-lean.sql:379-390` | Revoke from `authenticated` once the `delete-account` function is deployed |

## 2. Release blockers: owner and config (no code)

- **Placeholders shown to users** in the in-app privacy text: `support@YOUR-DOMAIN`, `YOUR NAME OR COMPANY`, `YOUR EMAIL PROVIDER`, `YOUR REGION` (`index.html:61002,61013,61048,61073`). The same placeholders, plus `YOUR COUNTRY OR STATE`, appear in `website/privacy.html` and `website/terms.html`. A visible "Owner: … not legal advice" banner is still on both pages (line 30). Support links are placeholders across `website/*`. `tests/store-readiness.test.js` passes with these placeholders in place, so a green run does not mean ready.
- **Pro cannot work as shipped:** `ENT_PUBKEY = "REPLACE_WITH_ED25519_PUBLIC_KEY_BASE64URL"` (`index.html:16190`), `SITE_URL = "https://studyboard.example"` (`:16194`), `website/config.js:14-23`, `RC_KEY = "appl_REPLACE_..."` (`ios-wrapper/native-bridge.js:181`).
- **Apple:** `REPLACE_WITH_APPLE_TEAM_ID` (`package.json`), `TEAM_ID` in the MAS entitlements, missing provisioning profiles, `applinks:YOUR-DOMAIN.example`, and the AASA `TEAMID`. Android: `android:host="YOUR-DOMAIN.example"`, and `assetlinks.json` is missing.
- **Legal gaps:** the privacy policy does not name **RevenueCat** or **Sentry**, both of which process user data. The terms have no objectionable-content / zero-tolerance clause, which guideline 1.2 requires for the group chat (Report and Block are already implemented).
- **Identity:** `com.studioso.app` is permanent once uploaded, so decide now. Run a trademark clearance check on "Studyboard". The copyright line has no legal entity.
- **Edge functions are not deployable as laid out:** calendar-feed, billing-webhook, lms-feed and send-reminders sit at the repo root as `index.ts` and `index (1|2|3).ts`. SETUP-GUIDE refers to paths that don't exist. `verify_jwt` is set only in the dashboard, and security depends on it (lms-feed must be ON). Move them to `supabase/functions/<name>/` with a `config.toml`.
- **PWA paths:** `manifest.webmanifest` references `icons/*` and `widgets/*`, which don't exist in the repo. No script builds the deployable `site/` layout.

## 3. Mobile: what is actually missing

**iOS** (`ios-wrapper/`):
1. There is no Xcode project and no Capacitor dependency. Every Swift file is marked "UNTESTED: written without compiler access".
2. **Push reminders cannot work.** The page uses Web Push only, and `pushOn()` refuses whenever `isIOS() && !standalone()` (`index.html:33683`), which is always true inside WKWebView. Nothing calls `StudyboardNative.enablePush`, and there is no APNs sender. Meanwhile the push entitlement and the `remote-notification` background mode are declared.
3. **Web-only text appears in the native app:** "Add to Home Screen", "iPhone doesn't offer app shortcuts for web apps", "phone apps … don't exist yet" (`index.html:35101-35119`, `installRow()` `:15531`). Reviewers reject this.
4. Guideline 4.2 risk: the native value is limited to an untested Share Extension and Siri intents.
5. The Share Extension's Info.plist also needs `SBKeychainAccessGroup`. Without it, capture silently shows "not configured".

**Android** (`android-wrapper/`):
1. There is no Gradle project. Versions read `VERIFY_VERSION`. **`targetSdk` is never set**, and Play requires a current API level (36).
2. There is no way to buy Pro: RevenueCat is not installed for Android and the only key is iOS-only. Either add Play Billing or hide the paywall.
3. Reminders don't work: there is no Push API in the WebView and no FCM. The "Install as an App" row also shows inside the Play app.
4. `ShareReceiverActivity.kt` is exported and **POSTs shared text to the account without confirmation** (lines 39-50). Any app can inject tasks, and `EXTRA_STREAM` URIs are not limited to `content://`. Failed captures, including 4xx responses, are re-queued forever (`CaptureClient.kt:66-68`).
5. `StudyboardAppFunctions.kt` uses unverified experimental APIs. Remove it for v1.

## 4. Desktop: other findings

- **CI:** `npm run check:store` requires both MAS profiles, but CI writes only one, so the MAS job always fails (`notarize.js:81-87`, `build-desktop.yml:102`). `contents: write` is granted to the whole workflow, including the signing jobs. Actions are pinned by tag, not SHA. A tag push publishes **unsigned Windows and ad-hoc Mac builds** to GitHub Releases, while the signed job never publishes.
- `openSafely` checks `isDirectory()` before `RISKY_EXT`, so `.app`, `.workflow` and `.action` bundles get launched (`main.js:207-208`). This contradicts the "D1 fixed" claim in `SECURITY-AUDIT-APPSTORE.md`.
- `fs:write` follows a symlink planted at `<path>.partial` out of the data folder (`main.js:609-611`).
- MAS: the default data folder is the hidden container `Documents`, and changing folders can silently lose the copy (`main.js:173,588,595`).
- Low: calendar-feed fetches can redirect to LAN https hosts (`lms.js:592`). The school sign-in window has no visible host. Data returned from school pages is not shape-checked. `MAX_WRITE` is 1.5 GB. The DMG itself is not notarized, only the `.app`.
- Distribution: Windows builds are unsigned (SmartScreen warning) and there is no auto-updater for direct downloads.

## 5. Other backend and web findings (Low)

- lms-feed: SSRF checks look at the hostname only (no DNS or private-IP check). Raw fetch errors are returned to the caller. The body is read fully before the size check. The rate limiter fails open.
- error-ingest: `req.text()` has no byte cap; the global cap is high.
- Calendar-feed tokens are stored in plaintext (store a SHA-256 hash instead). `UID`, `DTSTART` and `RRULE` are not run through `clean()`.
- `send-reminders` `action:"send"` needs no auth (use a shared-secret header from cron).
- The trial can be reused by deleting and re-creating the account.
- CSP: the meta tag (`index.html:6`) still has `'unsafe-inline'`, although there are only 3 inline scripts and no inline handlers. Use hashes, as desktop already does. Narrow `connect-src https:` to Supabase plus the AI hosts, and drop `cdn.jsdelivr.net`. `_headers` says "two inline scripts"; there are three.
- Sign-out leaves `studyboard:search:recent`, `studyboard:bd` (drafts) and `studyboard:prep` behind. Clear by prefix instead.
- AI keys are kept in plaintext localStorage on web and mobile (they are in the keychain on desktop).

## 6. Quality, tests, CI, performance

**Tests run** (Playwright + Chromium):

| Suite | Result |
|---|---|
| 17 × `tests/*.test.js` | all pass |
| `test-functions.mjs` (20), `test-capture.mjs` (18) | pass |
| breakdown, capture, examprep, examprep-integration, avail, sync-two-device, error-report, a11y-motion-tz, mascot-bounds e2e | pass |
| **grouptasks.e2e, trash-export.e2e, store-flows.e2e (2/16)** | **fail**, all from B1 |
| **remotex.e2e** | **flaky** (1 pass out of 3). localStorage data is missing after a reload. Could be a real persistence race; investigate |
| `tests/store-readiness.test.js` | 183 pass, but it does not check that placeholders are filled |

- **No CI runs any test.** There is no `npm test` script and no lint config. B1 would have been caught by ESLint `no-undef` (the only real hit across the 5.9 MB script). The tests hardcode `/opt/node-tools` and `/opt/pw-browsers`.
- No tests cover calendar-feed, lms-feed or send-reminders.
- **Size:** `index.html` is 6.6 MB (1.9 MB gzip): 5.9 MB of JS that must be parsed before the app runs. Phone-sized DOM-interactive time was 2.85 s with 4× CPU slowdown and no network delay. About 2.5 MB of it is decoration: scenes `SCN20` 1.57 MB, mascot 0.9 MB, themes 0.63 MB. This could be lazy-loaded. Any release invalidates the entire cached file. The `98-comp-m1.js` module marker appears twice, so check the concatenation step for duplicated code.
- Accessibility (axe): no serious or critical issues. One moderate `region` issue. Contrast needs a manual check.
- Dependencies: `http-cache-semantics` (high, dev-only; `npm audit fix`). supabase-js is current, and the vendored copies match npm byte for byte.
- Hygiene: the stray `download` file, duplicate binaries (`icon.png` = `icon-512.png`, the two sidebar BMPs), 17 root docs (364 KB) that overlap.

## 7. Recommended order

1. **This week (code):** B1, B2, B3, B4, B6 are each a few lines. Then B5 (PDF.js 6.x), add `npm test` and a CI workflow running the unit and e2e suites plus ESLint `no-undef`, and fix the CI audit command.
2. **Before the website launch:** B7–B9, move the edge functions into `supabase/functions` with `config.toml`, fill every placeholder, get the legal text reviewed (add RevenueCat, Sentry and a UGC clause), build a script for the `site/` layout, and switch to a hash-only CSP.
3. **Before desktop releases:** sign and notarize (Mac), Authenticode (Windows), fix the MAS CI and the data folder, publish only signed builds, fix the `openSafely` order and the `.partial` symlink.
4. **Before store submission:** generate the Capacitor iOS and Android projects, set `targetSdk 36`, compile and device-test the native code, implement native push (APNs/FCM) or drop the reminder promise and the entitlement, hide web-only install and widget text in native builds, configure RevenueCat for both stores, add a confirm step to the Android share receiver, and remove AppFunctions.
5. **Then:** performance work (lazy-load decoration, split JS for caching), the Low items, and docs consolidation.
