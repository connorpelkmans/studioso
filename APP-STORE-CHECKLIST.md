# Apple App Store checklist for Studyboard

For three things: the **iOS app** (Capacitor wrapper, `ios-wrapper/`), the **Mac App Store app** (Electron, `mas` target) and the **direct download Mac app** (notarized DMG). Written against the App Store Review Guidelines as of late 2026. Apple changes them often: read the current text of any rule you are unsure about before you submit.

**How to read this file.** "Done in the repo" means the code or config exists and was tested here (what could not be tested is listed in `SECURITY-AUDIT-APPSTORE.md`, section 5). "Owner" means only you can do it (account, certificate, text, business decision). "Depends" means another change (account deletion, Pro/purchases, legal pages) must be merged first; the exact check to run afterwards is given.

Contents: 1 Accounts and identifiers · 2 Build and submit (DMG, MAS, iOS) · 3 Guideline by guideline · 4 In-app purchase rules · 5 Review notes and demo account · 6 App Privacy answers ("nutrition label") · 7 Tests before every submission · 8 After merge: greps to run

---

## 1. Accounts, certificates and identifiers (Owner)

1. **Apple Developer Program** membership (US$99/year, as an individual or an organization). An organization needs a D-U-N-S number. Note your **Team ID** (developer.apple.com > Membership), 10 characters.
2. **App IDs** (Certificates, Identifiers & Profiles > Identifiers): `com.studioso.app` for iOS and for macOS (same bundle id is fine: one purchase record, "Universal Purchase"). Capabilities to switch on: Push Notifications, In-App Purchase, Associated Domains (iOS). Nothing else.
3. **Certificates** (create in Xcode > Settings > Accounts > Manage Certificates, or on the website):
   * *Developer ID Application* (signs the direct-download DMG) and *Developer ID Installer* if you ever ship a pkg outside the store.
   * *Apple Distribution* (or *3rd Party Mac Developer Application*) and *3rd Party Mac Developer Installer* (sign the Mac App Store package).
   * *Apple Development* (test builds).
   Export each as `.p12` with a password for CI (`CSC_LINK`, `CSC_KEY_PASSWORD`; the installer one is `CSC_INSTALLER_LINK`).
4. **Provisioning profiles**: *Mac App Store distribution* for `com.studioso.app` and *Mac development* (registered test Macs). Download and save as `build-resources/Studyboard_MAS.provisionprofile` and `build-resources/Studyboard_MASDev.provisionprofile` (paths set in `package.json`; **do not commit them**). iOS profiles are handled by Xcode automatic signing.
5. **Replace the placeholders** (the build refuses to continue until you do; `npm run check:store` lists them):
   * `package.json` > `build.mas.extendInfo.ElectronTeamID` and `build.masDev.extendInfo.ElectronTeamID`, and `build.mac.extendInfo.ElectronTeamID` > your Team ID.
   * `build-resources/entitlements.mas.plist` and `entitlements.mas-dev.plist`: `TEAM_ID.com.studioso.app` > `YOURTEAMID.com.studioso.app`.
   * `package.json` > `homepage` (currently `https://github.com`) > your support or marketing website.
6. **App Store Connect > My Apps > +**: create the app record once, with the platforms iOS and macOS under one record. Name, subtitle, primary category **Education** (secondary: Productivity), age rating, price, availability.
7. **APNs key** (Keys > + > Apple Push Notifications service): upload to your push provider or Supabase function that sends reminders.
8. **App Store Connect API key** (Users and Access > Integrations > App Store Connect API): used for notarization and uploads from CI (`APPLE_API_KEY`, `APPLE_API_KEY_ID`, `APPLE_API_ISSUER`). Safer than an Apple ID password. Fallback: an *app-specific password* (appleid.apple.com) with `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`.
9. **Privacy Policy URL**, **Support URL** (a page with a contact email and how to report abuse), **Marketing URL** (optional), **Terms of Use** (needed for subscriptions; Apple's standard EULA is acceptable if you say so). They must be real pages on the web, not files in the app.
10. **RevenueCat** project with the App Store app connected (Pro). **Paid Apps Agreement**, tax and banking in App Store Connect > Business (needed before any in-app purchase can be tested or sold).

## 2. Build and submit

### 2a. Direct-download Mac app (notarized DMG)

```bash
npm ci          # from the project folder (the repo root; `desktop/` if you use the nested layout)
export CSC_LINK=...base64 or path of the Developer ID Application .p12   CSC_KEY_PASSWORD=...
export APPLE_API_KEY=/path/AuthKey_XXXX.p8 APPLE_API_KEY_ID=XXXX APPLE_API_ISSUER=xxxxxxxx-...   # or APPLE_ID / APPLE_APP_SPECIFIC_PASSWORD / APPLE_TEAM_ID
export REQUIRE_NOTARIZATION=1        # fail instead of skipping if the credentials are missing
npm run dist:mac-signed              # universal (Apple silicon + Intel), hardened runtime, notarized by notarize.js
spctl -a -vvv -t install dist/*.dmg  # should say "accepted, source=Notarized Developer ID"
xcrun stapler validate dist/*.dmg
```

CI: *Actions > Build Studyboard desktop app > Run workflow > kind: signed* (secrets listed at the top of `build-desktop.yml`). Plain `npm run dist:mac` still produces an ad-hoc signed, **un-notarized** DMG for testing (Gatekeeper will warn).

### 2b. Mac App Store

```bash
export CSC_LINK=...(Apple Distribution / 3rd Party Mac Developer Application .p12) CSC_KEY_PASSWORD=...
export CSC_INSTALLER_LINK=...(3rd Party Mac Developer Installer .p12) CSC_INSTALLER_KEY_PASSWORD=...
npm run check:store                  # must print "ready" for mas
npm run dist:mas-dev                 # first: a development build on a registered Mac, to test the sandbox
npm run dist:mas                     # dist/mas-universal/Studyboard-x.y.z-mas.pkg
xcrun altool --validate-app -f dist/mas-universal/*.pkg -t macos --apiKey XXXX --apiIssuer xxxx   # or the Transporter app
```

Upload the `.pkg` with the **Transporter** app (or `xcrun altool --upload-app`), pick the build in App Store Connect and submit. MAS differences already handled in code (`process.mas`): sandboxed with the entitlements in `build-resources/entitlements.mas*.plist`; the chosen data folder is kept with a security-scoped bookmark; no start-at-login switch; no outside payment links (Stripe and similar hosts are refused by `openExternal`); the app never updates itself (App Store only). Things to test **inside the sandbox** (`dist:mas-dev`): data folder in Documents, Choose Folder, export a backup, attach a file, Brightspace/Canvas/Blackboard sign-in window, native reminders, Today widget, tray icon, deep link `studyboard://open`.

### 2c. iOS app

Follow `ios-wrapper/README-IOS.md` (stage web files, `npx cap add ios`, merge `Info.plist.additions.plist`, add capabilities, privacy manifest, archive, TestFlight, submit).

### 2d. Auto-update (note)

* **iOS and Mac App Store**: updates come only from the store. Do not add updater code (guideline 2.4.5(vii) forbids it for Mac App Store apps).
* **Direct DMG**: there is no updater in the app (`publish: null`, `electron-updater` is not installed). People install a new DMG manually. If you want automatic updates later, use `electron-updater` with signed, notarized builds and an `https` feed only, and make the updater a non-MAS code path (`if (!process.mas)`). Squirrel.Mac and the old Electron versions have had update-installation advisories; stay on a supported Electron major (see the audit).
* **Electron support window**: Electron supports the latest three major versions. `package.json` now pins `^44.5.1` (previous: 38, out of support with open advisories). Plan to bump the major every ~8 weeks and re-run the checks in section 7.

## 3. Guideline by guideline

| # | Rule | Status for Studyboard | What to do |
| --- | --- | --- | --- |
| **1.2** | User-generated content needs: filter for objectionable content, a way to **report** content, a way to **block** abusive users, and **published contact info** | Study Groups have a message board and shared items. **Done in repo**: Report on every message, shared item and member, "also block" option, block list per person (hidden on screen and filtered by the server), reports stored in `group_reports` (insert-only for members, nobody can read them in the app). | **Owner**: run `supabase-moderation.sql` after `supabase-groups.sql`; check `group_reports` daily and act within 24 h (SQL examples are in the file; say so in review notes); put a support email on the Support URL page and in the app (Settings > About, rel-polish adds the page). Optional: a profanity filter on `group_messages.body` (a Postgres trigger or Edge Function); Apple's text asks for a "method for filtering", so mention the report/remove process in the notes and consider a basic word filter before launch. Group invites are by private code only (no public search, no discovery of strangers), which lowers risk. |
| **2.1** | App completeness: no placeholders, no crashes, **demo account** for reviewers | No lorem ipsum found in shipped files; `homepage` in `package.json` and the AI "yourschool.example" strings are placeholders (the latter are input hints, fine). | **Owner**: demo account (section 5); replace `homepage`; delete `download` and other stray files from the app bundle (`files` in `package.json` already limits what is packed). **"Coming soon" wording is gone**: `shopUnlock()` now says "This item is part of Studyboard Pro." and the calendar-feed fallback is titled "Live Link Unavailable" (re-grep for `coming soon` before each submission). Hosted users also see server "setup" messages (`srvSetup(...)`) for any feature whose SQL file has not been run: **run every `supabase-*.sql` file on the production project before review**, then walk through every tab once. |
| **2.3 / 5.2** | Accurate metadata, screenshots from the app, no other company's trademarks | Brightspace, Canvas, Blackboard, Google Calendar, Outlook, Gemini, Claude, ChatGPT are mentioned by name. | **Owner**: write them as "works with ..."; do not use their logos; state in the description that these brands belong to their owners. |
| **2.5.2** | No downloading code that changes the app | The iOS and Mac builds bundle all pages and libraries (`prepare.js`), no CDN code. The web page can fetch the libraries from a CDN, the app builds do not. | Keep using `prepare.js` output for store builds. Never set Capacitor `server.url`. |
| **2.4.5** (Mac) | Sandbox, no self-update, no unrelated launch items, public APIs only | Done: sandbox entitlements are minimal; no updater; start-at-login hidden in the MAS build; tray icon present only to bring the window back. | Test closing the window with "Keep running in the background" on and off; the first-close tip explains where the icon is. |
| **3.1.1 / 3.1.3** | Digital subscriptions must use In-App Purchase | See section 4. Routing verified after the merge. | **Owner**: IAP products and RevenueCat; re-run the section 8 greps after Pro changes. |
| **4.0 / 4.1** | Design, copycats | n/a | n/a |
| **4.2** | Minimum functionality: a web wrapper is rejected | Bundled app with offline use, push reminders, share sheet, photo/file attach, Keychain, widgets. | Put the sentence from section 5 in the review notes. For iOS add the WidgetKit "Today" extension before submitting if you want the widget in the description (it is not required; do not claim it if it is not there). |
| **4.8** | Sign in with Apple required if you offer a third-party or social login | **Compliant: email + password only (re-verified: no `signInWithOAuth`, `signInWithIdToken`, `linkIdentity`, Google/Facebook/Apple SDK or button anywhere in the client, website account page, LMS code or setup guide; `tests/store-readiness.test.js` fails if one appears).** The only sign-in is the app's own email address and password with an email code (`signInWithPassword`, `signUp`, `verifyOtp`, `resetPasswordForEmail`). There is no Google, Facebook, Microsoft or other social login. The Brightspace/Canvas/Blackboard windows sign in to the school's own site to read school data; they are not an account for Studyboard. | **If you ever add Google/Microsoft/Facebook login**: you must also offer Sign in with Apple (or another login that limits data to name and email, lets people hide their email, and does not track). Plan: Supabase supports Apple as an auth provider (`signInWithOAuth({provider: "apple"})` on the web, `signInWithIdToken` with `@capacitor-community/apple-sign-in` on iOS); add the *Sign in with Apple* capability and entitlement `com.apple.developer.applesignin`; show the button with Apple's official style. |
| **5.1.1(i)** | Privacy policy link in App Store Connect and in the app; data collection disclosure | **Done in the app** (rel-polish: Privacy Policy, Terms of Service and About sheets in Settings and on the sign-in screen). | **Owner**: publish the same policy on the web at a stable URL, paste it in App Store Connect, and make sure it matches the in-app sheet (re-read the in-app text: it must mention the AI providers, the consent window and that keys stay on the device). It must say: what is collected (section 6), who processes it (Supabase hosting, RevenueCat, the AI company the person chooses), retention, how to delete the account, contact email. |
| **5.1.1(ii)** | Consent for data collection | The account creation screen collects only email and password; AI use asks consent (below). | The Privacy and Terms sheets are reachable from the sign-in screen (rel-polish); check the create-account text links to them. |
| **5.1.1(iv)** | Do not insist on permissions; works without | Notifications are asked only when the person turns reminders on; photos and camera only when they tap a picker. The app works without an account (local mode). | Keep it that way. |
| **5.1.1(v)** | **Account deletion inside the app** (server data, not just log out) | **Done, end to end.** Settings > Account and Sync > Delete My Account and Data: shows what is deleted, warns about an App Store subscription (checkbox plus link to `https://apps.apple.com/account/subscriptions`) or says a card subscription is cancelled for you, needs the typed word DELETE and a recent sign-in (or the password), then calls the `delete-account` Edge Function (`supabase-functions/delete-account/index.ts`): Stripe subscriptions cancelled, every file under `<uid>/` removed from the `studioso-files` bucket, `studyboard_delete_user_data()` removes the database rows (rules in `supabase-lean.sql`), the auth user is deleted (all sessions end). If the function is not deployed the app falls back to the old route (client deletes files, then `studyboard_delete_my_account()`). It then wipes the device (`wipeDeviceData`, AI keys) and shows a confirmation screen listing what was removed and what is retained (backups up to 30 days, payment records at Stripe/Apple, anonymous abuse reports). Verified by `supabase-delete-selftest.sql` (39 attacker-style checks), `supabase-functions/tools/test-functions.mjs` and `tests/e2e/store-flows.e2e.js`. | **Owner**: deploy `delete-account` (Verify JWT On, secrets `STRIPE_SECRET_KEY`, `SITE_ORIGINS`), re-run `supabase-lean.sql`, run the self-test, and test once with a throw-away account that has a file (Storage) and, if you sell by card, a Stripe test subscription. Confirm your Supabase backup retention is 30 days or less (policy says "up to 30 days"). |
| **5.1.2** | Data use and sharing; **sharing personal data with third-party AI needs clear disclosure and explicit permission** | **Done in repo**: a one-time consent window before the first AI use of each provider, naming the company (Google, Anthropic or OpenAI), the host it goes to, what is sent and what is not, with a link to that company's privacy policy and a "Not Now" choice. Declining changes nothing else. Background (automatic) AI, search-by-meaning and the companion's AI chat stay off until the person has agreed. AI only works with the person's own key. Consent is stored on the device and wiped at sign-out, "Turn Off" and account deletion. AI keys are always device-only (the system keychain in the desktop app). | **Owner**: repeat the same disclosure in the privacy policy and review notes. See section 6 for the label. |
| **5.1.2(i)** (ATT) | App Tracking Transparency | **No tracking.** No analytics, advertising, attribution or fingerprinting SDKs in the page or the wrappers (searched for gtag, fbq, mixpanel, sentry, posthog, amplitude, segment, firebase, appsflyer, adjust: none). Network calls go only to the person's Supabase project, the AI company the person chose, RevenueCat (purchases) and, in the web version only, Google Fonts and two CDNs. | Answer "Data Not Used to Track You". Do **not** add `NSUserTrackingUsageDescription` or call ATT. If you add any analytics later, re-do the label and the privacy manifest. |
| **5.6** | Developer code of conduct | n/a for code | **Owner**: honest reviews and metadata, answer reports quickly, no fake ratings, no misleading screenshots. |
| **1.5** | Developer contact information | Support URL required | **Owner** (section 1, item 9). |
| **Encryption export** | Export compliance | The app uses only Apple's built-in TLS and Keychain (exempt). | `ITSAppUsesNonExemptEncryption = false` is set in `package.json` (`mac`, `mas`, `masDev` extendInfo) and in `ios-wrapper/Info.plist.additions.plist`. In App Store Connect answer "No" to proprietary/non-standard encryption if asked. |
| **Age rating** | Questionnaire | Chat between members of private groups = user-generated content; no web browsing, no gambling, no mature content. | Typical answers: Unrestricted Web Access **No**; User-Generated Content **Yes** (with the report/block tools above, rating usually lands at 12+ or 13+); everything else None. Set "Made for Kids" **No** (students include adults). If any users may be under 13, add parental-consent flows (COPPA) before launch. |
| **Accessibility labels** | Not required for review but expected | rel-polish does an accessibility pass. | Add "Accessibility Nutrition Label" answers in App Store Connect only for features you have verified. |

### 5.1.1(v) account deletion: what is built and the rules it follows

Implemented as described in the table row above. Data rules (also in `supabase-lean.sql` and the privacy policy): everything the person owns is deleted (synced items, deletion log, archive, devices and device-removal log, plan, usage, billing link, reminders, push devices, calendar tokens, profile, shared decks, bug reports and any bug report that left their email as the contact address, rate counters, uploaded files). **Owned study groups** go to the longest-standing other member (they become owner), or are deleted when nobody else is in them. **Authored group content** (messages, items, quiz scores, RSVPs, reactions, check-ins, stats) is deleted with the account. **Reports** made by or about the person stay for safety with no link to the account. **Payment bookkeeping we must keep** (`studyboard_billing_events`, `studyboard_pro_grants`) is anonymized (user id, email and free-text reason removed). Error-report tables from the crash-reporting work are anonymous by design (no user id); if that branch adds a table with a user id, add it to the list in `studyboard_delete_user_data` (the guard `tests/store-readiness.test.js` fails until it is handled). Apple subscriptions cannot be cancelled by us: the dialog says so and links to the Apple page.

## If you add Google sign-in later you must also add Sign in with Apple

Guideline 4.8: an app that offers a third-party or social login must also offer an equivalent login that limits data to name and email, lets people hide their email, and does not track. Today Studyboard has none, so it needs nothing. If you ever add Google, Facebook, Microsoft or similar:

1. Add **Sign in with Apple** in the same release (not later). In Apple Developer: Identifiers > your App ID > enable the *Sign in with Apple* capability; create a **Services ID** (for the website/web build) with your domain and the Supabase callback `https://<project>.supabase.co/auth/v1/callback`; create a **Key** for Sign in with Apple and note the Key ID and Team ID.
2. Supabase > Authentication > Sign In / Providers > **Apple**: turn on, paste the Services ID, Team ID, Key ID and the private key (or the generated client secret; Apple secrets expire after 6 months, set a reminder).
3. iOS wrapper: add the capability in Xcode and use the native flow (`@capacitor-community/apple-sign-in`), then `supabase.auth.signInWithIdToken({provider: "apple", token, nonce})`. Web: `signInWithOAuth({provider: "apple"})`.
4. Handle Apple's "Hide My Email" relay addresses (mail to them needs your sending domain registered in Apple's *Private Email Relay* settings: add your SPF/DKIM-verified domain).
5. Put the Apple button first, same size and prominence as the other providers; keep email + password.
6. Account deletion must also **revoke the Apple token** (Apple requires it for apps with Sign in with Apple): call Apple's `https://appleid.apple.com/auth/revoke` from the `delete-account` function with the stored refresh token before deleting the user.
7. Update the privacy policy, the App Privacy label (Contact Info: name), the review notes, and `tests/store-readiness.test.js` (it fails when an OAuth call appears, on purpose: update it deliberately).

## 4. In-app purchase rules (3.1.1, 3.1.3)

* **iOS app and Mac App Store app**: digital goods (Studyboard Pro, cosmetic packs, extra storage) must be sold with **Apple In-App Purchase** (through RevenueCat). The app must not show, link to or mention a Stripe or website purchase page, and must not tell people they can pay cheaper elsewhere (3.1.1). A "manage subscription" link must go to Apple's subscription page for Apple subscriptions (already in the plan module).
* **Direct-download Mac app and the website**: Stripe is fine.
* **Restore Purchases** button must be reachable.
* Show price, billing period, auto-renewal text, cancel instructions, Privacy Policy and Terms links beside the buy button; free trials must say what happens when the trial ends.
* **How this repo enforces it** (until the Pro work lands): `nativeStore()` in the plan module is true for the iOS wrapper (`window.Capacitor`, `window.StudyboardNative`) and now also for the Mac App Store build (`studiosoDesktop.store === "mas"`, passed from `main.js`), and `PLAN.buy()` only opens the website or `checkout_url_*` when the route is not "store". In addition `main.js` refuses to open payment hosts (stripe.com, paypal.com, paddle.com, lemonsqueezy.com, gumroad.com, ko-fi.com, buymeacoffee.com, patreon.com) in the MAS build, and `ios-wrapper/native-bridge.js` does the same on iOS. The purchase UI is also off until `PRO_ENFORCED` is true.
* **Verified after the merge** (pro-client): `PLAN.buy()` picks the route by `route()`: `nativeStore() && !EXTERNAL_PURCHASE_ALLOWED` is the "store" route (in-app purchase through the `plan-checkout` hook; if no native layer handles it the app only says buying isn't available in this build), otherwise the website route. `const EXTERNAL_PURCHASE_ALLOWED = false` in the plan module. `nativeStore()` is true for Capacitor, `StudyboardNative`, and the Mac App Store build (`studiosoDesktop.mas` / `.store === "mas"`). `manage()` in a store build goes to Apple's subscription page. Pro enforcement itself is off until `PRO_ENFORCED` is flipped. Re-run the greps in section 8 after any change to that module. The rule to confirm: in store builds, `EXTERNAL_PURCHASE_ALLOWED` must be `false` unless you have deliberately taken part in Apple's external-purchase program for a specific storefront (the rules differ by storefront and have changed recently, so check Apple's current text for each country before you rely on it). Even then, links must not be hidden behind the iOS build for storefronts where they are not allowed.
* Entitlements shown in the app must come from the server (`studyboard_entitlements`, written by `billing-webhook` from RevenueCat events), never from the client alone.

## 5. Review notes and demo account (paste into App Store Connect > App Review Information)

**Demo account (Owner, create before submitting):** Supabase dashboard > Authentication > Users > *Add user* > email `appreview@YOURDOMAIN`, a strong password, tick *Auto Confirm User* (so no email code is needed). Sign in once and fill it with realistic data: 3 courses, ~15 tasks with due dates, a note, a flashcard deck, a file, and a study group that contains a second demo user (`appreview2@...`) with a few messages (so the reviewer can see report and block). Grant Pro: `insert into studyboard_entitlements ...` (see `supabase-plans.sql`) or a RevenueCat promotional entitlement. Tick *Sign-in required* and enter the credentials. Delete or disable the account after review, and keep it out of public search.

**AI features need the reviewer's own key.** The reviewer will not have one. Put in the notes a **restricted, low-quota Gemini key** created for review (AI Studio > Create API key, no billing, delete it after approval) and say "the key is entered in Settings > AI Features". Never embed it in the app. Nothing else in the app needs it.

**Notes template:**

> Studyboard is a student planner (courses, deadlines, flashcards, study sessions, grades) that works offline and syncs to the person's own account.
> **Sign in:** use the demo account in the fields above (email + password; there is no social login, so Sign in with Apple does not apply).
> **Native features beyond a website (4.2):** all pages are bundled and work offline; deadline reminders arrive as push notifications; share sheet for decks; photo and file attach; the session is stored in the iOS Keychain; deep links to tasks and shared decks.
> **User-generated content (1.2):** Study Groups are private (invite code only). Every message, shared item and member has a **Report** action (Groups > open a group > Report), reporting offers "also block"; blocked people's posts are hidden. Reports reach the developer only and are reviewed within 24 hours. Contact: SUPPORT-EMAIL.
> **AI (5.1.2):** optional. Uses the person's own Google/Anthropic/OpenAI key; before first use a consent window names the company and what is sent. Test key for review: PASTE-KEY (Settings > AI Features).
> **Purchases:** Pro is an auto-renewing subscription sold with In-App Purchase. Restore Purchases is on the Pro screen. No outside payment links exist in this build.
> **Account deletion:** Settings > Account > Delete Account.
> **Data:** no tracking, no advertising, no analytics SDKs.

Also provide: screenshots for each device size you claim (6.9" and 6.5" iPhone, 13" iPad if universal; Mac 2880 x 1800), an app preview video (optional), description, keywords, promotional text, "What's New", copyright, and the support, marketing and privacy URLs.

## 6. App Privacy answers ("nutrition label") and privacy manifest

App Store Connect > App Privacy. Match these answers to `build-resources/ios/PrivacyInfo.xcprivacy` and `build-resources/mac/PrivacyInfo.xcprivacy` (both declare: no tracking, no tracking domains, the types below). **Third-party code in the app builds**: Supabase client (talks to your own project), RevenueCat SDK (purchases), Capacitor and plugins (no data leaves the device except through these), pdf.js (local). Answer for yourself **and** those partners.

**Data Used to Track You: none. Tracking: No.**

| Data type (Apple's name) | Collected? | Linked to the person? | Used for | Where it comes from |
| --- | --- | --- | --- | --- |
| Contact Info > **Email Address** | Yes | Yes | App Functionality (account, password reset, optional bug-report reply address) | Sign-up |
| Contact Info > **Name** | Yes (optional display name) | Yes | App Functionality (shown to group members) | Study groups |
| User Content > **Other User Content** | Yes | Yes | App Functionality (tasks, courses, notes, flashcards, file records, group messages, shared decks, bug-report text) | Synced to Supabase when signed in |
| User Content > **Photos or Videos** | Yes (only what the person attaches) | Yes | App Functionality (stored files, bug-report screenshot) | Attachments |
| Identifiers > **User ID** | Yes | Yes | App Functionality (Supabase user id; RevenueCat app user id) | Account |
| Identifiers > **Device ID** | Yes (random per-install id for the device limit and push) | Yes | App Functionality | Device registration, reminders |
| Purchases > **Purchase History** | Yes (when Pro is on) | Yes | App Functionality (entitlement) | RevenueCat / Apple |
| Usage Data > **Product Interaction** | Yes (study minutes and quiz counts, only inside a group the person chose) | Yes | App Functionality | Group stats |
| Diagnostics > **Other Diagnostic Data** | Only inside a bug report the person sends (app version, device type, recent error text, scrubbed of keys) | Yes (carries user id when signed in) | App Functionality | Report a Bug |

**Crash reports (added with the anonymous crash-reporting work; the privacy policy has a marked section for it).** Diagnostics > **Crash Data**: Yes, **not linked to the person**, not used for tracking, purpose App Functionality (bug fixing); contains the error message, app version and device type, no user id, no content. If the crash feature is not shipped, answer No and delete the "Anonymous crash reports" section from `website/privacy.html` and the in-app policy together (the sync test enforces both).

Not collected: location, contacts, health and fitness, financial info, sensitive info, browsing or search history, audio, advertising data (and crash data unless the crash-reporting feature ships, see above). (Search runs on the device; the optional "search by meaning" sends text to Google's embedding API with the person's own key, covered by the AI consent.)

**AI providers.** Studyboard does not receive what is sent to Google, Anthropic or OpenAI: it goes straight from the device to the company the person picked, with the person's own key, after consent. Say exactly that in the privacy policy ("third parties" section) and in the notes. If App Review asks, the conservative label answer is: User Content > Other User Content, shared with a third party **at the person's direction**.

**Privacy manifest (`PrivacyInfo.xcprivacy`).** Required-reason APIs declared for a Chromium/WKWebView wrapper: file timestamp (`C617.1`, `3B52.1`), user defaults (`CA92.1`), system boot time (`35F9.1`), disk space (`E174.1`). Generate the Xcode privacy report on the real archive and adjust: plugins add their own entries.

### 6a. Ready-to-paste App Privacy answers (App Store Connect > App Privacy)

**Do you or your third-party partners collect data from this app?** Yes.

| Data type | Linked to the user | Used to track | Purposes |
| --- | --- | --- | --- |
| Contact Info: **Email Address** | Yes | No | App Functionality |
| Contact Info: **Name** (optional group display name) | Yes | No | App Functionality |
| User Content: **Other User Content** (study data, notes, flashcards, files, group messages, bug report text) | Yes | No | App Functionality |
| User Content: **Photos or Videos** (only files the person attaches) | Yes | No | App Functionality |
| Identifiers: **User ID** | Yes | No | App Functionality |
| Identifiers: **Device ID** (random per-install id) | Yes | No | App Functionality |
| Purchases: **Purchase History** (plan status only; we never receive card data) | Yes | No | App Functionality |
| Usage Data: **Product Interaction** (group study stats the person shares) | Yes | No | App Functionality |
| Diagnostics: **Crash Data** (anonymous, only if crash reporting ships) | **No** | No | App Functionality |
| Diagnostics: **Other Diagnostic Data** (inside a bug report the person sends) | Yes | No | App Functionality |

**Data Not Used to Track You:** select it; do not add tracking domains. **Third-party AI:** Google (Gemini), Anthropic (Claude) and OpenAI receive the content of an AI request **only with the person's own key and after an explicit consent prompt that names the company**; it goes from the device to the provider, not through us. On Google's free tier Google may use it to improve its products (the policy and the consent window say so). Declare it as User Content shared with a third party at the person's direction; if you want the strictest reading, treat "Other User Content" as also shared with third parties for App Functionality.

### 6b. Google Play Data safety (if you ship the Android app)

| Section | Answer |
| --- | --- |
| Does your app collect or share any of the required user data types? | Yes |
| Is all of the user data collected by your app encrypted in transit? | Yes (HTTPS) |
| Do you provide a way for users to request that their data is deleted? | Yes: in app (Settings, Account and Sync, Delete My Account and Data) **and** web: Play requires a URL; use `https://YOUR-DOMAIN/account/` (the Delete account panel there calls the same `delete-account` function) |
| Personal info: Email address | Collected, not shared; required; purpose App functionality, Account management |
| Personal info: Name | Collected (optional display name), shared only with the person's own study group members (do not mark as shared with third parties); optional; App functionality |
| Personal info: User IDs | Collected, not shared; App functionality, Account management |
| Messages: Other in-app messages | Collected (group chat), not shared outside the group; App functionality |
| Photos and videos / Files and docs | Collected (only what the person uploads); not shared; App functionality |
| App activity: Other user-generated content | Collected (study data); not shared; App functionality |
| Financial info: Purchase history | Collected (plan status from Google Play Billing/RevenueCat); not shared; App functionality |
| App info and performance: Crash logs | Collected **only if crash reporting ships**; not shared; Analytics (diagnostics) or App functionality; the data is anonymous |
| App info and performance: Diagnostics | Collected inside bug reports the person sends; optional |
| Device or other IDs | Collected (random install id); not shared; App functionality |
| Data shared with third parties | AI content: shared with Google, Anthropic or OpenAI **only at the person's direction with their own key**; mark User-generated content as "shared" with purpose App functionality, optional, user-initiated |
| Data sold? | No. Data used for advertising? No. |

## 7. Tests before every submission

Automated, from the repo root (all must pass): `node tests/store-readiness.test.js` (deletion covers every table, in-app and website privacy policy say the same things, no social login, email templates, Pro sheet wording), `node --experimental-strip-types supabase-functions/tools/test-functions.mjs` (includes `delete-account`), `node tests/e2e/store-flows.e2e.js` (Playwright with a stubbed Supabase client and a mock purchase bridge: sign-up/verify/resend, forgot/reset, expired link, Restore Purchases, Buy, Manage, account deletion), and in the Supabase SQL Editor `supabase-delete-selftest.sql`.


- [ ] Fresh install: first launch shows no error, no permission prompt appears until the person asks for reminders or a photo.
- [ ] Create account (email + code), sign in, sign out, sign in again; reset password.
- [ ] **Delete My Account and Data** works end to end with a throw-away account, and the same email can sign up again.
- [ ] Airplane mode: app opens and works; a change made offline syncs later.
- [ ] AI: first use shows the consent window naming the company; "Not Now" sends nothing; "I Agree" works; Settings > AI Features > Turn Off removes the keys and the consent.
- [ ] Groups: Report a message, a member and a shared item; block someone; their posts disappear; Unblock brings them back.
- [ ] Notifications arrive and open the right task (iOS: push; Mac: native).
- [ ] No Stripe or website purchase link appears anywhere in the iOS or MAS build (search every Pro screen). Restore Purchases works with a sandbox tester.
- [ ] `npm run check:store` prints "ready" (MAS) with the real values; `spctl` accepts the notarized DMG; the MAS build runs under `dist:mas-dev`.
- [ ] Dark mode, Dynamic Type / large text, VoiceOver on the main screens, iPad and small iPhone layouts.
- [ ] Privacy report from Xcode matches section 6.
- [ ] The privacy policy, terms and support pages are online and match the app.

## 8. After merging the other agents' work: checks to run (from the repo root)

```bash
# Account deletion and legal pages (present since the rel-polish merge: expect hits)
grep -nE "studyboard_delete_my_account|Delete My Account" index.html supabase-*.sql | head
grep -nE "legal-privacy|legal-terms|Privacy Policy|Terms of Service" index.html | head

# Purchases: store builds must not reach an outside payment page
grep -nE "EXTERNAL_PURCHASE_ALLOWED" index.html | head          # constant exists and is false
grep -nE "checkout_url|buy\.stripe\.com|checkout\.stripe|payment[_-]?link|window\.open\(.*(checkout|stripe)" index.html | head
grep -nE "nativeStore\(\)|route\(\)|DESK\.mas|DESK\.store" index.html | head   # every external-purchase path is behind the store route
grep -nE "Purchases\.|plan-checkout|plan-restore" index.html | head                           # the IAP path exists

# No placeholder wording
grep -nEi "coming soon|lorem ipsum" index.html | head          # expect nothing

# Still true after merges: nothing sends content to an AI company without the consent gate
grep -nE "generativelanguage|api\.anthropic|api\.openai" index.html | head                    # expect only the 5 known call sites
grep -nE "aiConsented\(" index.html | head                                                     # aiCall, embKey, autoState

# Nothing new tracks people
grep -nEi "gtag|google-analytics|fbq\(|mixpanel|sentry|posthog|amplitude|segment\.|firebase|appsflyer|adjust\.com|clarity\.ms|hotjar" index.html sw.js *.html | head

# Build config still valid
node -e "JSON.parse(require('fs').readFileSync('package.json'))" && node notarize.js --check
python3 - <<'PY'
import plistlib,glob
for f in glob.glob('build-resources/**/*.plist',recursive=True)+glob.glob('build-resources/**/*.xcprivacy',recursive=True)+glob.glob('ios-wrapper/*.plist'):
    plistlib.load(open(f,'rb')); print('ok',f)
PY
```
