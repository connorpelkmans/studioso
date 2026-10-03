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
| **4.8** | Sign in with Apple required if you offer a third-party or social login | **Compliant, nothing needed.** The only sign-in is the app's own email address and password with an email code (`signInWithPassword`, `signUp`, `verifyOtp`, `resetPasswordForEmail`). There is no Google, Facebook, Microsoft or other social login. The Brightspace/Canvas/Blackboard windows sign in to the school's own site to read school data; they are not an account for Studyboard. | **If you ever add Google/Microsoft/Facebook login**: you must also offer Sign in with Apple (or another login that limits data to name and email, lets people hide their email, and does not track). Plan: Supabase supports Apple as an auth provider (`signInWithOAuth({provider: "apple"})` on the web, `signInWithIdToken` with `@capacitor-community/apple-sign-in` on iOS); add the *Sign in with Apple* capability and entitlement `com.apple.developer.applesignin`; show the button with Apple's official style. |
| **5.1.1(i)** | Privacy policy link in App Store Connect and in the app; data collection disclosure | **Done in the app** (rel-polish: Privacy Policy, Terms of Service and About sheets in Settings and on the sign-in screen). | **Owner**: publish the same policy on the web at a stable URL, paste it in App Store Connect, and make sure it matches the in-app sheet (re-read the in-app text: it must mention the AI providers, the consent window and that keys stay on the device). It must say: what is collected (section 6), who processes it (Supabase hosting, RevenueCat, the AI company the person chooses), retention, how to delete the account, contact email. |
| **5.1.1(ii)** | Consent for data collection | The account creation screen collects only email and password; AI use asks consent (below). | The Privacy and Terms sheets are reachable from the sign-in screen (rel-polish); check the create-account text links to them. |
| **5.1.1(iv)** | Do not insist on permissions; works without | Notifications are asked only when the person turns reminders on; photos and camera only when they tap a picker. The app works without an account (local mode). | Keep it that way. |
| **5.1.1(v)** | **Account deletion inside the app** | **Present** (rel-polish): Settings > Account and Sync > Delete My Account and Data, type DELETE to confirm; it removes uploaded files, then calls `studyboard_delete_my_account()` (in `supabase-lean.sql`), which deletes the data and the auth user. This pass also wipes the device's AI keys and AI consent after deletion. | **Owner**: run `supabase-lean.sql` on production; test deletion with a throw-away account (checklist 7); make sure the policy says what is deleted. Review the requirements below against what was built: group messages/items by the user are removed by the cascade; Apple subscriptions are not cancelled by deletion (the dialog says to cancel the plan first; also link to https://apps.apple.com/account/subscriptions for Apple purchases). |
| **5.1.2** | Data use and sharing; **sharing personal data with third-party AI needs clear disclosure and explicit permission** | **Done in repo**: a one-time consent window before the first AI use of each provider, naming the company (Google, Anthropic or OpenAI), the host it goes to, what is sent and what is not, with a link to that company's privacy policy and a "Not Now" choice. Declining changes nothing else. Background (automatic) AI, search-by-meaning and the companion's AI chat stay off until the person has agreed. AI only works with the person's own key. Consent is stored on the device and wiped at sign-out, "Turn Off" and account deletion. AI keys are always device-only (the system keychain in the desktop app). | **Owner**: repeat the same disclosure in the privacy policy and review notes. See section 6 for the label. |
| **5.1.2(i)** (ATT) | App Tracking Transparency | **No tracking.** No analytics, advertising, attribution or fingerprinting SDKs in the page or the wrappers (searched for gtag, fbq, mixpanel, sentry, posthog, amplitude, segment, firebase, appsflyer, adjust: none). Network calls go only to the person's Supabase project, the AI company the person chose, RevenueCat (purchases) and, in the web version only, Google Fonts and two CDNs. | Answer "Data Not Used to Track You". Do **not** add `NSUserTrackingUsageDescription` or call ATT. If you add any analytics later, re-do the label and the privacy manifest. |
| **5.6** | Developer code of conduct | n/a for code | **Owner**: honest reviews and metadata, answer reports quickly, no fake ratings, no misleading screenshots. |
| **1.5** | Developer contact information | Support URL required | **Owner** (section 1, item 9). |
| **Encryption export** | Export compliance | The app uses only Apple's built-in TLS and Keychain (exempt). | `ITSAppUsesNonExemptEncryption = false` is set in `package.json` (`mac`, `mas`, `masDev` extendInfo) and in `ios-wrapper/Info.plist.additions.plist`. In App Store Connect answer "No" to proprietary/non-standard encryption if asked. |
| **Age rating** | Questionnaire | Chat between members of private groups = user-generated content; no web browsing, no gambling, no mature content. | Typical answers: Unrestricted Web Access **No**; User-Generated Content **Yes** (with the report/block tools above, rating usually lands at 12+ or 13+); everything else None. Set "Made for Kids" **No** (students include adults). If any users may be under 13, add parental-consent flows (COPPA) before launch. |
| **Accessibility labels** | Not required for review but expected | rel-polish does an accessibility pass. | Add "Accessibility Nutrition Label" answers in App Store Connect only for features you have verified. |

### 5.1.1(v) account deletion: what it must do (reviewed against rel-polish's version)

Add it to **Settings > Account > Delete Account** (visible without contacting anyone; a link to a web form is not enough, Apple allows a web flow only for highly regulated industries).

1. Show what will be deleted, require a deliberate confirmation (type the email address or re-enter the password; supabase `reauthenticate`/`signInWithPassword`).
2. Delete the **auth user and all personal data on the server**: `items` (tasks, courses, notes, decks, files metadata, backups, settings including any synced AI keys), **storage objects** (the user's folder in the files bucket, including `_text/` copies), `study_profiles`, `group_members`, `group_messages` and `group_items` they authored (or anonymize), `group_quiz_scores`/`rsvps`/`stats`/`checkins`/`reactions`, `group_blocks`, `group_reports.reporter_id` (set null), `studyboard_entitlements`, device registrations, push subscriptions and reminders, `shared_decks`. Groups they own: delete or transfer. Most tables already `references auth.users(id) on delete cascade`, so deleting the auth user does most of it. Deleting from `auth.users` needs the service role: do it in an **Edge Function** that checks the caller's JWT (`supabase.auth.getUser`) and only ever deletes that caller. Storage objects are not removed by the cascade: delete them in the function first.
3. Sign out and wipe the device: `localStorage`, the AI keys (`aiWipeLocal()`), IndexedDB caches, the desktop Studyboard folder is the person's own files, so ask before touching it.
4. **Subscriptions**: Apple subscriptions are not cancelled by deleting the account. Say so in the dialog and link to `https://apps.apple.com/account/subscriptions` (the code already has that link for `source === "apple"`). A Stripe subscription (website customers) should be cancelled by the function.
5. Tell the person when it is done, and keep nothing except what the law requires (say what in the policy).

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

### 5b. Siri, App Intents, share extension and App Groups (only if the quick-capture sources in `ios-wrapper/native/` are shipped)

Sources are UNTESTED (written without Xcode): do the device tests in `ios-wrapper/native/capture.md` section 5 first. Then:

- [ ] Capabilities on **both** the App and the Share Extension targets: **App Groups** (`group.com.studioso.app`) and **Keychain Sharing** (`com.studioso.app.shared`); both registered in the Developer portal (Identifiers) and in the provisioning profiles (regenerate them after adding).
- [ ] No `NSSiriUsageDescription` (App Intents need none; the key is for the old SiriKit extensions). No microphone or speech-recognition string: Siri does the listening.
- [ ] Share Extension `NSExtensionActivationRule` is the **dictionary** form (text, 1 web URL, 1 image), not `TRUEPREDICATE`; the extension has its own `PrivacyInfo.xcprivacy`.
- [ ] Privacy manifest: no new required-reason API from the native code (Keychain, URLSession, App Group files). If you add App Group `UserDefaults`, add reason `1C8F.1` (verify on Apple's current list). Run Generate Privacy Report on the archive.
- [ ] App Privacy answers unchanged (task text goes to the person's own account; same "Other User Content" row).
- [ ] The capture token is a bearer secret kept in the Keychain, revocable in Settings; never shown in logs.
- [ ] Review notes: add the Siri / Shortcuts paragraph from `VOICE-CAPTURE-NATIVE.md` section 4 and a demo account with a token.
- [ ] Do not claim Apple Intelligence / iOS 27 Siri support in the listing until tested on that OS.

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

Not collected: location, contacts, health and fitness, financial info, sensitive info, browsing or search history, audio, crash data, advertising data. (Search runs on the device; the optional "search by meaning" sends text to Google's embedding API with the person's own key, covered by the AI consent.)

**AI providers.** Studyboard does not receive what is sent to Google, Anthropic or OpenAI: it goes straight from the device to the company the person picked, with the person's own key, after consent. Say exactly that in the privacy policy ("third parties" section) and in the notes. If App Review asks, the conservative label answer is: User Content > Other User Content, shared with a third party **at the person's direction**.

**Privacy manifest (`PrivacyInfo.xcprivacy`).** Required-reason APIs declared for a Chromium/WKWebView wrapper: file timestamp (`C617.1`, `3B52.1`), user defaults (`CA92.1`), system boot time (`35F9.1`), disk space (`E174.1`). Generate the Xcode privacy report on the real archive and adjust: plugins add their own entries.

## 7. Tests before every submission

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
