# Studyboard for iOS: Capacitor wrapper (ready-to-use setup)

This folder holds everything needed to wrap the Studyboard web build in a native iOS app with **Capacitor** (WKWebView). It does **not** contain a generated Xcode project: you create that once on a Mac with `npx cap add ios` (step 3) and then merge the files from this folder into it.

| File here | Use |
| --- | --- |
| `capacitor.config.json` | Capacitor settings: app id `com.studioso.app`, bundled web files (no remote `server.url`), navigation allow-list, no cleartext, no native HTTP/cookie plugins. |
| `native-bridge.js` | Small native glue loaded before the page (shared with Android): Keychain session storage, `StudyboardSecrets` for AI keys, safe external links, deep links, native push registration, RevenueCat purchases. |
| `native/` | **Quick capture (UNTESTED Swift sources):** App Intents for Siri/Shortcuts, Share Extension, Capacitor plugins `StudyboardCaptureToken` and `StudyboardSharedQueue`. See `native/capture.md` and `../VOICE-CAPTURE-NATIVE.md`. |
| `Info.plist.additions.plist` | Keys to merge into `ios/App/App/Info.plist` (encryption flag, usage strings, push background mode, URL scheme). |
| `App.entitlements.template.plist` | Push and associated-domains entitlements. |
| `apple-app-site-association.template.json` | The universal-links file to host on the website. |
| `../build-resources/ios/PrivacyInfo.xcprivacy` | Privacy manifest template (add to the App target). |

Layout assumed: this repo as it is (flat): `index.html`, `prepare.js` and `package.json` at the top, this folder as `ios-wrapper/`. (In the nested layout run the same commands from `desktop/` and use `scripts/prepare.js`.)

## 1. Why a native wrapper passes review (guideline 4.2, "minimum functionality")

A wrapper that only shows a website is rejected. Studyboard is a real app: all pages are bundled inside the app and work offline, it keeps your data on the device, and it adds things a website cannot: **push reminders for deadlines** (APNs), a **Today widget** (add a WidgetKit extension later; the data format is already produced for the desktop widget), **share sheet** for decks, **photo and file attach**, Keychain-protected sign-in, and deep links. Say this in the review notes (see `APP-STORE-CHECKLIST.md`). Do not ship with `server.url` pointing at a website: loading the app from a remote site is exactly what 4.2 and 2.5.2 reject, and it removes the offline behaviour.

## 2. Build the web files and install the plugins

```bash
# 2a. Stage the web build with the libraries and fonts bundled (no CDN, no Google Fonts request, strict CSP possible).
npm ci
STUDYBOARD_OUT=ios-www STUDYBOARD_BASE=capacitor://localhost/ node prepare.js
cp ios-wrapper/native-bridge.js ios-www/native-bridge.js
# Load the bridge BEFORE the page's script: add this line right after <head> in ios-www/index.html
#   <script src="native-bridge.js"></script>
# (a one-line sed, or add it in prepare.js; scripts with a src are allowed by the CSP because they are 'self')

# 2b. Capacitor
cd ios-wrapper
npm init -y
npm i @capacitor/core @capacitor/ios @capacitor/app @capacitor/browser @capacitor/push-notifications \
      @capacitor/share @capacitor/filesystem capacitor-secure-storage-plugin @revenuecat/purchases-capacitor
npm i -D @capacitor/cli
cp -R ../ios-www ./ios-www
```

Recommended plugins and why (install no others unless you need them; every plugin adds code and possibly privacy-manifest entries):

| Plugin | Purpose |
| --- | --- |
| `@capacitor/push-notifications` | Deadline reminders through APNs (web push does not exist in WKWebView). |
| `@revenuecat/purchases-capacitor` | **Apple In-App Purchase** for Pro (the only allowed way to sell digital subscriptions in the app, guideline 3.1.1). The web layer already has the hooks `plan-checkout`, `plan-restore`, `plan-manage` (see the plan module header in `index.html`). |
| `@capacitor/share` | Native share sheet for decks and group invites. |
| `@capacitor/filesystem` | Saving exported backups and files the person picks, in the app's own container. |
| `@capacitor/browser` | In-app Safari sheet for https links (used by `native-bridge.js`). |
| `@capacitor/app` | Deep links and app state. |
| `capacitor-secure-storage-plugin` | iOS **Keychain** storage (see section 5). |

## 3. Create the iOS project and merge the files

```bash
npx cap add ios          # creates ios/ (commit it to git; this is the Xcode project). capacitor.config.json is already here.
npx cap sync ios
npx cap open ios
```

In Xcode (App target):

1. **Signing & Capabilities**: pick your team; bundle id `com.studioso.app`; add **Push Notifications**, **In-App Purchase**, and **Associated Domains** (`applinks:YOUR-DOMAIN.example`). Do not add capabilities you do not use. Compare with `App.entitlements.template.plist`.
2. **Info.plist**: merge `Info.plist.additions.plist` (open both as source). The result must contain `ITSAppUsesNonExemptEncryption = NO` and **no** `NSAppTransportSecurity` block (App Transport Security stays fully on: every address the app talks to is https).
3. **Privacy manifest**: drag `build-resources/ios/PrivacyInfo.xcprivacy` into the App group, tick the App target. Then **Product > Archive > Distribute > App Store Connect > Generate Privacy Report** and compare it with the App Privacy answers in `APP-STORE-CHECKLIST.md` section 6; Xcode merges the plugins' own manifests into it.
4. App icon: 1024 x 1024 PNG without transparency or rounded corners (`icon-1024.png` in the repo is the source). Launch screen: the Capacitor storyboard is fine.
5. **Usage strings** (all in the additions file) are only for features the app has:

| Key | Why it is there |
| --- | --- |
| `NSPhotoLibraryUsageDescription` | Photo picker for attachments, photo flashcards/notes, bug-report screenshot. |
| `NSCameraUsageDescription` | The same pickers offer "Take Photo". |
| (none) microphone, location, contacts, calendars, tracking | Not used. Do not add them: an unused permission string is a rejection reason, and an unexplained use is a crash. `NSUserTrackingUsageDescription` is deliberately absent because nothing tracks (see the checklist). |

### 3b. Quick capture: Siri, Shortcuts, share sheet (optional, untested)

Needs the App Groups and Keychain Sharing capabilities, the Swift files in `native/`, a Share Extension target and the plugin registration in `MainViewController`. Follow `native/capture.md` section 2 step by step; the test plan is section 5 there. Nothing in `native/` has been compiled: expect to fix errors, and do not advertise Siri support before a device test. Plugin names are already listed in `capacitor.config.json` (`StudyboardCaptureToken`, `StudyboardSharedQueue`). Capacitor 5 or older: plugins need a `.m` file with `CAP_PLUGIN(...)` instead of `CAPBridgedPlugin`.

## 4. Build, test and submit

```bash
STUDYBOARD_OUT=ios-www STUDYBOARD_BASE=capacitor://localhost/ node prepare.js && cp ios-wrapper/native-bridge.js ios-www/ && cd ios-wrapper && cp -R ../ios-www . && npx cap sync ios
```

Then in Xcode: run on a device, test with the checklist, **Product > Archive**, upload with the Organizer, test through TestFlight, and submit in App Store Connect. Every web change needs the staging line above again.

## 5. Tokens and secrets: Keychain, not localStorage

* The **Supabase session** (access and refresh tokens) must not sit in the web view's `localStorage`, which is a plain file inside the app container. `native-bridge.js` sets `window.StudyboardAuthStorage`; `index.html` hands that to supabase-js (`authStorage()`), so the tokens live in the iOS Keychain (`capacitor-secure-storage-plugin` stores with `kSecAttrAccessibleAfterFirstUnlock` by default; if you want them unreadable while the phone is locked after a restart choose the stricter accessibility option in the plugin's settings). An older copy found in localStorage is moved into the Keychain on first start.
* **AI keys** (the person's own Gemini/Claude/OpenAI key) are always device-only: never in the settings that sync to the account, never in backups, wiped at sign-out. In the wrappers `native-bridge.js` exposes `window.StudyboardSecrets` (same API as the desktop app's `secrets`: `available()`, `get(name)`, `set(name, value)`, `remove(name)`; Keychain via `capacitor-secure-storage-plugin`, keys prefixed `studyboard.secret.`), and `index.html` uses `DESK.secrets || window.StudyboardSecrets`, so the keys are no longer in `localStorage` when the plugin is installed.
* The **capture token** (Quick Capture, for Siri and the share extension) lives in a shared Keychain group, set through `window.StudyboardNative.saveCaptureToken(token, supabaseUrl)` and removed with `clearCaptureToken()`; see `native/capture.md`.
* Never ship secrets in the bundle: only the Supabase **publishable** key (`sb_publishable_...`) belongs in the app. No service-role key, no RevenueCat secret key (only the public SDK key), no Stripe keys, no AI keys.

## 6. Universal links and deep links

1. Host `apple-app-site-association.template.json` as `https://YOUR-DOMAIN.example/.well-known/apple-app-site-association` (no extension, `Content-Type: application/json`, no redirect). Replace `TEAMID` with your 10-character Team ID.
2. Put `applinks:YOUR-DOMAIN.example` in the Associated Domains capability.
3. `native-bridge.js` accepts only `?deck=`, `?group=`, `?task=` (codes of letters, digits, `.:-`) and `studyboard://action/<name>`; everything else in a link is ignored.
4. Add the domain to `server.allowNavigation` in `capacitor.config.json` only if the app must navigate to it inside the web view (it normally does not: links open in the in-app browser).

## 6b. Push reminders (APNs)

Web Push does not exist inside WKWebView, so the app uses native push through `@capacitor/push-notifications`:

1. Xcode > App target > Signing & Capabilities: add **Push Notifications** (gives `aps-environment`, see `App.entitlements.template.plist`) and **Background Modes > Remote notifications** (`UIBackgroundModes` in `Info.plist.additions.plist`).
2. Add the two methods the plugin needs to `ios/App/App/AppDelegate.swift`:
   ```swift
   func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
       NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
   }
   func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
       NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
   }
   ```
3. Apple Developer > Keys: create an **APNs Auth Key** (.p8). Note the Key ID and your Team ID. Give the .p8, Key ID, Team ID and bundle id `com.studioso.app` to the server as secrets (never ship them in the app). Debug builds get sandbox tokens (`api.sandbox.push.apple.com`), TestFlight/App Store builds production tokens (`api.push.apple.com`).
4. The page calls `window.StudyboardNative.enablePush()` from the reminders switch; it resolves `{platform: "ios", kind: "apns", token}` (hex device token) or `null`. `StudyboardNative.pushAvailable` tells the page whether to offer it. Call `enablePush({prompt: false})` on every start to pick up a changed token. The server sends through APNs directly (or through FCM only if you add the Firebase iOS SDK, which this setup does not).
5. A tap on a notification whose data carries `taskId` / `rid` opens `?sbtask=&sbrid=` (the same parameters as the web push click).

## 7. Purchases (guideline 3.1.1, 3.1.3)

* Pro is a digital subscription: in this app it must be sold with **In-App Purchase** through RevenueCat. The web build's Stripe payment link must never appear in the iOS app. `index.html` already treats `window.Capacitor` and `window.StudyboardNative` as a store build (`nativeStore()` in the plan module) and `native-bridge.js` refuses to open payment hosts. Re-check after the Pro work is merged (`APP-STORE-CHECKLIST.md` section 3).
* "Restore Purchases" must be reachable from the Pro screen (the `plan-restore` hook).
* Subscription terms (price, length, auto-renew, how to cancel, links to Privacy Policy and Terms) must be shown next to the buy button.
### Purchase bridge contract (page <-> native)

The page (`index.html`, plan module) never talks to RevenueCat itself. In a store build (`nativeStore()` is true: `window.Capacitor` native, `window.StudyboardNative`, or the `studyboardStore` message handler) Buy, Manage Plan and Restore Purchases only use this contract, and the page never shows a Stripe or website link (unless `EXTERNAL_PURCHASE_ALLOWED` is changed in the plan module).

Page to native: three **cancelable** window events. The native side calls `event.preventDefault()` to say "I'm handling this"; if nobody does, the page tells the person the feature isn't available in this build.

| Event | `event.detail` | Meaning |
| --- | --- | --- |
| `studyboard:plan-checkout` | `{period: "monthly" or "yearly", userId}` | Start the Apple purchase sheet for that package. `userId` is the Supabase user id, use it as the RevenueCat app user id. |
| `studyboard:plan-restore` | `{userId}` | Run `restorePurchases()` and re-link the purchase to this account. |
| `studyboard:plan-manage` | `{entitlement}` | Open the App Store subscription management screen. |

(The same three calls are also run through the page's internal `hook("plan-checkout" / "plan-restore" / "plan-manage")` list, used by the desktop app and tests.)

Native to page: when the action finishes, answer with

```js
window.dispatchEvent(new CustomEvent("studyboard:purchase-result", {detail: {action, status, message}}));
```

* `action`: `"checkout"`, `"restore"` or `"manage"`.
* `status`: `"success"`, `"cancelled"` (the person backed out, no error shown), `"nothing"` (a restore that found no purchase) or `"error"`.
* `message` (optional, max 200 characters, plain text): shown to the person on `"error"`. Do not put secrets or stack traces in it.

What the page does with the answer: it shows progress ("Restoring your purchases…" and a disabled Restore button), then "Purchases restored. Pro is on.", "Nothing to restore…", "Restore cancelled." or the error text. After a success it re-reads the plan from the server (up to 5 tries, 2 s apart, because RevenueCat tells the server through its webhook first). **A result never turns Pro on by itself**: Pro only appears when the signed entitlement from the server says so. Unanswered restores time out after 60 s and fall back to one plan refresh.

`native-bridge.js` section 6 is a minimal working example of the native side with `@revenuecat/purchases-capacitor` (set `RC_KEYS.ios` to the `appl_...` public key and `RC_KEYS.android` to the `goog_...` key, an offering with monthly and annual packages, and an entitlement named `pro`). The key is picked by `Capacitor.getPlatform()`. **`window.StudyboardNative.purchasesAvailable`** is `false` when the plugin is missing or the key for this platform is still a placeholder: then the bridge does not claim `plan-checkout` / `plan-restore` (the page shows "isn't available in this build"), and the page should hide the Buy buttons. Manage opens RevenueCat's `managementURL`, else the App Store / Google Play subscriptions page. Restore Purchases is reachable from: the Pro sheet, Settings (the "Restore Purchases" row under Studyboard Pro), and every paywall prompt (they all open the Pro sheet).

* Reader-app style links to an outside payment page are only allowed under Apple's external-purchase entitlement rules for your storefront; leave them out unless you apply for that entitlement.

## 8. Security checklist for the wrapper

- [ ] `server.url` is **not** set (bundled files only), `cleartext` is false, `allowNavigation` lists only the hosts in `capacitor.config.json`.
- [ ] `ios.webContentsDebuggingEnabled` is false in the release build (it is, in this config).
- [ ] No `NSAppTransportSecurity` exceptions in Info.plist.
- [ ] `CapacitorHttp` and `CapacitorCookies` stay disabled (they bypass web-view CORS and cookie rules).
- [ ] Supabase session in the Keychain (section 5). Test: sign in, force-quit, relaunch: still signed in; sign out: the Keychain item is gone.
- [ ] Release build has no `console.log` of tokens or keys (the web code never logs them; the bug-report diagnostics scrub keys).
- [ ] `ITSAppUsesNonExemptEncryption` is NO and the privacy manifest is in the target.
- [ ] Web files come from `prepare.js` (libraries and fonts bundled; the page makes no request to a CDN or Google Fonts).
- [ ] Certificate pinning is **not** used (Supabase rotates certificates; pinning would lock people out). Standard iOS TLS validation applies.
- [ ] Jailbreak detection, screenshot blocking and similar are not needed and not added.
- [ ] Push token (APNs, `enablePush()`) is sent only to your own backend (Supabase) after sign-in; reminders contain the task title, so consider "Show Previews" behaviour in your privacy text.
- [ ] Apple Sign-In: not required (email and password only; see the checklist).
- [ ] Review the plugin list: `npm ls --prod` should show only the plugins above; run `npm audit --omit=dev`.

## 8b. Crash and error reporting (no third-party SDK)

* **Native crashes** (the app dies, the web view process is killed, memory kills) are collected by **Apple**: App Store Connect > your app > TestFlight > Crashes, and Xcode > Window > Organizer > Crashes. Apple only sends logs from people who chose "Share With App Developers" in their iPhone's Analytics settings, so you need no SDK, no `NSPrivacyTracking`, and no extra App Privacy answer for these logs. Symbolicate with the dSYM Xcode uploads with the archive.
* **Web errors** (a JavaScript exception, a failed sync, a broken screen, a storage-full failure) are reported by the page itself, in the same module as the website and desktop app (`index.html`, `49-errreport.js`). Nothing native is involved: it is one `fetch` POST of a scrubbed event to your Sentry project (or your Supabase `error-ingest` function), so it works the same inside Capacitor. The event's `platform` tag is `ios-wrapper` (the page checks `window.Capacitor.isNativePlatform()`), so you can filter iOS-wrapper issues in Sentry. `native-bridge.js` does not need to do anything for this.
* **The bridge**: there is none to build. If you later want native crash logs inside Sentry too, add the Sentry Capacitor plugin as a separate, deliberate step; it is a third-party SDK that must then be listed in the App Privacy answers and in `PrivacyInfo.xcprivacy` (Crash Data and Performance Data are already declared there, not linked, no tracking, app functionality).
* **Before submitting**: the privacy manifest in `build-resources/ios/PrivacyInfo.xcprivacy` declares `CrashData` and `PerformanceData`. If you ship with an empty DSN and no Supabase fallback (nothing is sent), delete those two entries and answer "not collected" for Crash Data and Performance Data in App Store Connect. The in-app switch is Settings, Send Anonymous Crash Reports (default on; off when Do Not Track / Global Privacy Control is set).
* The build id (`1.13.0+<12 hex>`) is stamped into the staged page by `prepare.js`, so a stack line `index.html:LINE:COL` can be matched to the exact file in this build: see `ERROR-REPORTING.md`, "Reading a stack".

## 9. Known differences from the web app on iOS

* There is no service worker inside the app (WKWebView only allows them for "app-bound domains"); the bundled files make the app work offline anyway. Reminders come from APNs instead of web push (section 6b).
* `navigator.clipboard`, file pickers and downloads behave like Safari; "Save backup" uses the share sheet or the Filesystem plugin.
* The desktop-only features (tray, global shortcuts, the data folder in Documents) do not exist on iOS; the web code hides them when `window.studiosoDesktop` is missing.
