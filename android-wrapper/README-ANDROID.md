# Studyboard for Android: Capacitor wrapper, quick capture, push, purchases (source templates)

> **Verification status: UNTESTED on a device.** No Android Studio, Gradle, emulator or device was available. The Kotlin sources were type-checked with `kotlinc` 2.1 against the Robolectric `android-all` API 34 jar, the Capacitor 7 core jar and a stub `ExifInterface` (so API names and nullability are checked, a real build is not). The XML was parsed for well-formedness. Run section 7 on real devices before release.

There is no Android project in the repo. This folder is a **merge set** for the project `npx cap add android` creates (Capacitor 8; appId `com.studioso.app`, see `../ios-wrapper/capacitor.config.json`; reuse that file, change `webDir` if you stage web files differently).

## 1. Files

| Path (under `android-wrapper/`) | Merge into | Purpose |
| --- | --- | --- |
| `app/src/main/AndroidManifest.additions.xml` | `android/app/src/main/AndroidManifest.xml` | Intent filters (`SEND`, `SEND_MULTIPLE`, `VIEW` for `studyboard://` and https App Links), share activity, tile service, shortcuts meta-data, no-cleartext, backup exclusions, `POST_NOTIFICATIONS`. |
| `app/src/main/java/com/studioso/app/capture/CaptureStore.kt` | same path | Token + endpoint encrypted with an AndroidKeyStore AES-GCM key (platform APIs only). |
| `.../CaptureClient.kt` | same | HTTPS POST (8 s, stable `Idempotency-Key`, no logging), the retry outbox and the app queue. |
| `.../StudyboardNative.kt` | same | Capacitor plugins `StudyboardCaptureToken` and `StudyboardSharedQueue`. |
| `.../ShareReceiverActivity.kt` | same | Share target, with a confirmation dialog. |
| `.../QuickCaptureTileService.kt` | same | Quick Settings tile "Quick capture". |
| `app/src/main/res/xml/{shortcuts,network_security_config,backup_rules,data_extraction_rules}.xml`, `res/values/strings.xml`, `res/drawable/ic_quick_capture.xml` | `res/` | Resources. |
| `build.gradle.additions.txt`, `proguard-rules.additions.pro` | Gradle files | SDK levels, Kotlin, coroutines, exifinterface, keep rules. |
| `assetlinks.template.json` | your website | Digital Asset Links file for App Links (section 6). |
| `SAMSUNG-BIXBY.md` | (doc) | Samsung routes and a support matrix. |

**Not for v1:** `StudyboardAppFunctions.kt` and `StudyboardApplication.kt` (the experimental Gemini AppFunctions code) are no longer referenced by the manifest, Gradle or ProGuard additions. **Do not copy them into the project** (they need the unreleased-for-us `androidx.appfunctions` dependency and will not compile without it); delete them from this folder when convenient. See "Optional later" at the end.

## 2. Build steps

**SDK levels (Google Play requirement):** `targetSdkVersion 36` and `compileSdkVersion 36`, `minSdkVersion 24` (Capacitor 8's minimum). Capacitor 8 generates exactly these in `android/variables.gradle`; keep them. Google Play has required target API 35+ for new apps and updates since 31 August 2025 and will require the next level about a year later: never lower `targetSdkVersion`.

```bash
# from the repo root, same staging as iOS but with an Android base URL:
STUDYBOARD_OUT=android-www STUDYBOARD_BASE=https://localhost/ node prepare.js     # Capacitor Android serves https://localhost by default
cp ios-wrapper/native-bridge.js android-www/native-bridge.js                       # the bridge is platform-aware (Capacitor.getPlatform())
# add <script src="native-bridge.js"></script> right after <head> in android-www/index.html (as for iOS)
cd android-wrapper && npm init -y
npm i @capacitor/core@8 @capacitor/android@8 @capacitor/app@8 @capacitor/browser@8 @capacitor/push-notifications@8 \
      capacitor-secure-storage-plugin @revenuecat/purchases-capacitor
npm i -D @capacitor/cli@8
cp ../ios-wrapper/capacitor.config.json . && sed -i 's/"webDir": "ios-www"/"webDir": "android-www"/' capacitor.config.json
npx cap add android && npx cap sync android
```

Then merge the files from section 1 into `android/` (copy the Kotlin files listed there + the res folders; merge the manifest blocks by hand; add the Gradle lines from `build.gradle.additions.txt`; put `google-services.json` in `android/app/` for push, section 4). In `MainActivity` register the plugins **before** `super.onCreate`:

```kotlin
// android/app/src/main/java/com/studioso/app/MainActivity.kt (Capacitor generates MainActivity.java: replace it with this Kotlin file)
package com.studioso.app
import android.os.Bundle
import com.getcapacitor.BridgeActivity
import com.studioso.app.capture.StudyboardCaptureTokenPlugin
import com.studioso.app.capture.StudyboardSharedQueuePlugin
class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(StudyboardCaptureTokenPlugin::class.java)
        registerPlugin(StudyboardSharedQueuePlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
```

The web layer calls the same functions as on iOS (cap-server's Settings UI): `window.StudyboardNative?.saveCaptureToken?.(token, SUPABASE_URL)` and `clearCaptureToken?.()`. The bridge drains `StudyboardSharedQueue` into `SBCAPTURE.ingest(item)` on start and on resume (which also retries the native outbox, section 3). AI keys: `window.StudyboardSecrets` (same API as the desktop `secrets`) keeps them in `capacitor-secure-storage-plugin` instead of `localStorage`; `index.html` uses `DESK.secrets || window.StudyboardSecrets`.

## 3. What each entry point does

* **Share sheet** (`ShareReceiverActivity`). The activity must be exported, so any app could start it: it **never acts without a tap**. It shows a dialog with the text preview and "Add to Studyboard" / "Cancel".
  * Text (subject + text, max 500 chars): on "Add", posted to `capture-task` with `source: "android-share"`; a Toast reports the result.
  * Image: on "Add", decoded only from a `content://` URI whose provider is **not** this app (file:// and our own providers are refused so a caller cannot make us read our private files), MIME must be `image/*`, sides over 30000 px refused, **EXIF orientation applied** (`androidx.exifinterface`), downscaled to max 2048 px / 8 MB JPEG, saved in `filesDir/pending-captures`, then the app opens; the web app ingests it and shows its own confirm sheet. Only the first image of a multi-share is used.
  * (Alternative considered: hand text to the web app's confirm sheet via the queue. The native dialog was kept because it works while the app is closed and still requires an explicit tap.)
* **Delivery and retries** (`CaptureClient`). Each capture gets one UUID used as `Idempotency-Key` on every attempt; it is written to `filesDir/capture-outbox` (tmp file + rename) **before** the network call.
  * 2xx with `ok: true`: removed. 4xx other than 401/403/408/429 (bad input, too large): **dropped**, never retried.
  * 401/403 (token revoked): moved to the app queue, so the person sees it in the web app's confirm sheet; never retried against the server.
  * 408/429/5xx/network: kept with an attempt count and backoff (30 s, 1, 2, 5, 15, 60 min), retried on app start/resume and after the next successful share. After 6 attempts or 7 days it is moved to the app queue instead. Nothing loops forever.
  * `clearCaptureToken()` (sign-out/revoke) wipes the outbox, so one account's captures are never sent with the next account's token. App-queue items the web app never accepts are dropped after 30 days.
  * Server note: `capture-task` dedupes an `Idempotency-Key` for **10 minutes**. A retry more than 10 minutes after an attempt whose response was lost can add a duplicate; a longer server window (for example 7 days) removes that without app changes.
* **Deep links** (`MainActivity`): `studyboard://add?text=...`, `studyboard://capture?photo=1`, `studyboard://action/quickadd`; the bridge forwards the first two to `SBCAPTURE.handleUrl` (cap-core), which always opens the confirm sheet.
* **Launcher shortcuts** (`shortcuts.xml`): long-press the icon: "Add task", "Capture photo".
* **Quick Settings tile** (`QuickCaptureTileService`): the person adds it from the tile editor; it opens `studyboard://capture`.
* **Voice assistants**: section 5.

## 4. Push reminders (FCM) and purchases (Google Play)

**Push.** Web Push never works inside the Android WebView; the app uses `@capacitor/push-notifications` (Firebase Cloud Messaging).

1. Firebase console: create a project (or use one), add an Android app with package `com.studioso.app`, download **`google-services.json`** into `android/app/`. Capacitor 8's template already has the `com.google.gms:google-services` classpath and applies the plugin only when that file exists.
2. In `native-bridge.js` set `PUSH_READY.android = true` (it is `false` so a build without `google-services.json` never tries to register).
3. Android 13+ shows the notification permission prompt when the page calls `StudyboardNative.enablePush()` (`POST_NOTIFICATIONS` is in the manifest additions). It resolves `{platform: "android", kind: "fcm", token}` or `null`; `StudyboardNative.pushAvailable` says whether to offer push at all. Call `enablePush({prompt: false})` on every start to save a changed token.
4. Server: send-reminders must send through the **FCM HTTP v1 API** (`https://fcm.googleapis.com/v1/projects/<project-id>/messages:send`) with a Google service account (Firebase console > Project settings > Service accounts > generate key; store it as a server secret, never in the app). Put `taskId` and `rid` in the message `data` so a tap opens the task.
5. Optional: `com.google.firebase.messaging.default_notification_icon` / `default_notification_channel_id` meta-data (see the plugin README) for a monochrome status-bar icon and a named channel.
6. Play "Data safety": declare **Device or other IDs** (the FCM token, linked, app functionality) in addition to the items in section 6.

**Purchases.** Pro is sold with **Google Play Billing** through RevenueCat (`@revenuecat/purchases-capacitor`, installed in section 2). In RevenueCat add a Play Store app for `com.studioso.app` (service-account credentials for Play), attach the Play subscription products to the same `pro` entitlement and the same offering (monthly + annual packages) as iOS, and put the **public** `goog_...` SDK key in `native-bridge.js` (`RC_KEYS.android`). Until that key is set, `StudyboardNative.purchasesAvailable` is `false`, the bridge does not claim `studyboard:plan-checkout` / `plan-restore`, and the page must hide Buy. Manage opens RevenueCat's `managementURL` or `https://play.google.com/store/account/subscriptions?package=com.studioso.app`. Play's payments policy forbids linking to an outside payment page for digital goods, so the bridge's payment-host block applies here too.

## 5. Voice assistants: the honest state of things

* **Gemini.** No integration in v1 (see "Optional later" below). "Hey Google, open Studyboard" then the in-app quick add works everywhere.
* **Google Assistant App Actions (`actions.xml`, built-in intents).** Not included. Google deprecated most Built-in Intents and App Actions for third-party apps, and there is no confirmed, still-supported built-in intent for "create a task". The static `shortcuts.xml` therefore has **no `<capability>`** elements.
* **`ACTION_CREATE_NOTE`** is intentionally not registered: it is for the notes-app role.
* **Fallbacks that do not need an assistant integration:** (a) "Hey Google, open Studyboard" then the in-app quick add; (b) a Google Assistant / Gemini routine or Bixby quick command that opens `studyboard://add?text=` or the app shortcut; (c) Tasker / HTTP Request Shortcuts calling the endpoint (SAMSUNG-BIXBY.md has copyable configs); (d) the share sheet and the tile.

## 6. Other config

* **Network:** `network_security_config.xml` forbids cleartext everywhere, trusts only system CAs, no pinning. `usesCleartextTraffic="false"` too.
* **App Links:** use the **same domain** as the iOS `applinks:` entry (`YOUR-DOMAIN.example` in both places until you fill it in). Replace it in the manifest's `android:host`, fill in `assetlinks.template.json` (package `com.studioso.app`; the SHA-256 fingerprint of the **Play App Signing** key from Play Console > Test and release > App integrity, plus your upload/debug key if you test sideloaded builds) and host it at `https://YOUR-DOMAIN.example/.well-known/assetlinks.json` (exact path, HTTPS, `Content-Type: application/json`, no redirect). Check with `adb shell pm get-app-links com.studioso.app` (state `verified`).
* **Backup:** the capture token's Keystore key does not move between devices, so the prefs file and queues are excluded from backup/transfer. `allowBackup` is false (Capacitor's web data is re-synced from the account).
* **Play 'Data safety':** capture sends the user's task text to the app's own Supabase project ("App activity / user content, collected, linked, for app functionality"). Push adds Device or other IDs (section 4); purchases add Purchase history (RevenueCat/Google Play). Keep the form consistent.
* **ProGuard:** `proguard-rules.additions.pro` keeps plugin and entry-point classes. Test a **release** (minified) build: Capacitor plugins found by reflection are the usual failure.
* **Permissions:** `INTERNET` and `POST_NOTIFICATIONS` (push). No microphone, storage or overlay permission.

## 7. Test steps (device, `adb`)

Install a debug build, sign in, and create the capture token in Settings. Then:

```bash
# Share text: a dialog must appear; nothing is sent until "Add to Studyboard" (Cancel / back = nothing sent)
adb shell am start -a android.intent.action.SEND -t text/plain --es android.intent.extra.TEXT "bio lab report friday" -n com.studioso.app/.capture.ShareReceiverActivity

# file:// streams are refused ("Couldn't read that image."); test images from the Photos/Gallery share sheet instead
adb shell am start -a android.intent.action.SEND -t image/jpeg --eu android.intent.extra.STREAM file:///sdcard/Download/test.jpg -n com.studioso.app/.capture.ShareReceiverActivity

# Deep links
adb shell am start -a android.intent.action.VIEW -d "studyboard://add?text=bio%20lab%20report&due=friday&course=Biology&source=shortcut" com.studioso.app
adb shell am start -a android.intent.action.VIEW -d "studyboard://capture?photo=1" com.studioso.app
adb shell am start -a android.intent.action.VIEW -d "studyboard://action/quickadd" com.studioso.app

# Shortcuts / links resolved
adb shell dumpsys shortcut | grep -A3 -i studyboard
adb shell pm get-app-links com.studioso.app

# Logs: confirm NO token, push token or task text is printed
adb logcat | grep -i -E "studyboard|capture"
```

Manual: long-press the icon (shortcuts), add the tile (swipe down twice > pencil > "Quick capture"), tap it, share from Chrome / Keep / Gallery. Share a photo taken in portrait: it must arrive upright (EXIF). Offline test: airplane mode, share text ("Saved. It will be added when you're back online."), reconnect, open the app: the task appears once. Revoked token: share text, the item appears in the app's confirm sheet instead. Push: turn reminders on (permission prompt on Android 13+), check a row in `push_subscriptions`, send a test reminder, tap it: the task opens. Purchases: with a Play license-test account, buy monthly, restore, manage; with the placeholder key the Buy buttons must be hidden.

## Optional later: Gemini AppFunctions

Android 16 introduced `AppFunctions` (an app exposes functions an agent such as Gemini can call, similar to App Intents on iOS). An experimental `StudyboardAppFunctions.addTask` + `StudyboardApplication` (`AppFunctionConfiguration.Provider`) draft exists in this folder but is **not part of v1**: the `androidx.appfunctions` artifact names, KSP arguments, manifest requirements and Gemini/device/region availability were never verified. To try it later: check the current `androidx.appfunctions` docs, add its dependencies + KSP plugin, set `android:name=".capture.StudyboardApplication"` on `<application>`, add keep rules for both classes, call `CaptureClient.send(..., source = "gemini")` (note the `CaptureResult` shape changed: `NotConfigured(queued)` and `Rejected`), and test on a supported device before saying it works.
