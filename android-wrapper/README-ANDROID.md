# Studyboard for Android: Capacitor wrapper, quick capture, push, purchases

> **Status:** `npm run android:build` makes the Android project, merges everything in this folder into it and builds with Gradle. A debug `.apk` was built from the Studyboard sources on 2 November 2026 (package `com.studyboardapp.studyboard`, versionCode 11504, target API 36), so the Kotlin sources compile. **Not yet run on a phone or emulator**: do the checks in section 7 before you upload. The home-screen widgets, Focus notification, Do Not Disturb and reminder buttons (sections 8 to 11) were added on 26 November 2026 and also build (debug `.apk`); their JVM tests run with `./gradlew testDebugUnitTest` in `android-wrapper/android`.

## 0. Quick start (this is all you need to build)

Needs: Node 22, **JDK 21** (Android Studio's own JDK works) and the **Android SDK** with platform 36 and build-tools 36 (Android Studio installs both; or set `ANDROID_HOME`).

```bash
npm ci
npm run android:debug        # a debug .apk: android-wrapper/android/app/build/outputs/apk/debug/app-debug.apk
npm run android:build        # the debug .apk and the release .aab
```

The generated project is `android-wrapper/android` (not committed; the script makes it again any time). Open it in Android Studio with `npx cap open android` from `android-wrapper/`, or install the APK with `adb install -r android-wrapper/android/app/build/outputs/apk/debug/app-debug.apk`.

**Upload key (once).** Google Play needs the `.aab` signed with your own upload key:

```bash
keytool -genkeypair -v -keystore ~/studyboard-upload.jks -alias studyboard -keyalg RSA -keysize 2048 -validity 10000
```

Keep the `.jks` file and its passwords somewhere safe (a password manager): if you lose them you can't update the app without Google's key-reset process. Then create `android-wrapper/keystore.properties` (it's git-ignored):

```
storeFile=/Users/you/studyboard-upload.jks
storePassword=YOUR-STORE-PASSWORD
keyAlias=studyboard
keyPassword=YOUR-KEY-PASSWORD
```

and run `npm run android:build`. The signed bundle is `android-wrapper/android/app/build/outputs/bundle/release/app-release.aab`. **The versionCode must rise on every upload**: it comes from `package.json` (1.15.4 gives 11504). For a second upload of the same version, run `ANDROID_VERSION_CODE=11505 npm run android:build`.

**Push reminders** need `android-wrapper/google-services.json` from your Firebase project (section 4); without it the app builds and push stays off.

The rest of this file explains what each part does.

## 1. Files

| Path (under `android-wrapper/`) | Merge into | Purpose |
| --- | --- | --- |
| `app/src/main/AndroidManifest.additions.xml` | `android/app/src/main/AndroidManifest.xml` | Intent filters (`SEND`, `SEND_MULTIPLE`, `VIEW` for `studyboard://` and https App Links), share activity, tile service, shortcuts meta-data, no-cleartext, backup exclusions, `POST_NOTIFICATIONS`. |
| `app/src/main/java/com/studioso/app/capture/CaptureStore.kt` | same path | Token + endpoint encrypted with an AndroidKeyStore AES-GCM key (platform APIs only). |
| `.../CaptureClient.kt` | same | HTTPS POST (8 s, stable `Idempotency-Key`, no logging), the retry outbox and the app queue. |
| `.../StudyboardNative.kt` | same | Capacitor plugins `StudyboardCaptureToken` and `StudyboardSharedQueue`. |
| `.../ShareReceiverActivity.kt` | same | Share target, with a confirmation dialog. |
| `.../QuickCaptureTileService.kt` | same | Quick Settings tile "Quick capture". |
| `.../StudyboardLms.kt`, `.../StudyboardLmsScripts.kt` | same | School site plugin `StudyboardLms` and its generated script allowlist ("School sites on Android" below). |
| `.../widgets/` (`HomeWidgetStore.kt`, `HomeWidgetModel.kt`, `HomeWidgets.kt`, `StudyboardHomeWidgetsPlugin.kt`) | same | Home-screen widgets Today and Countdown, and the plugin `StudyboardHomeWidgets` (section 8). |
| `.../focus/StudyboardFocusActivityPlugin.kt`, `FocusNotification.kt` | same | The Focus timer's ongoing notification with Pause/Stop and the Wear OS ongoing activity (plugin `StudyboardFocusActivity`, section 9). |
| `.../focus/FocusGuard.kt` | same | Do Not Disturb during Focus (plugin `StudyboardFocusGuard`, section 10). |
| `.../notify/` (`ReminderNotifications.kt`, `StudyboardMessagingService.kt`, `StudyboardNotifActionsPlugin.kt`) | same | Reminders with Mark Done and Snooze 1 Hour (plugin `StudyboardNotifActions`, section 11). |
| `app/src/test/.../widgets/HomeWidgetsTest.kt` | `app/src/test/` | JVM tests (Robolectric): the widgets' model, the tick queue, and both layouts drawn to PNG. |
| `app/src/main/res/xml/{shortcuts,network_security_config,backup_rules,data_extraction_rules,sbw_today_info,sbw_countdown_info}.xml`, `res/values/strings.xml`, `res/values*/sbw_*.xml`, `res/layout/sbw_*.xml`, `res/drawable/*` | `res/` | Resources (every folder is copied; `strings.xml` goes in as `studyboard_strings.xml`). |
| `build.gradle.additions.txt`, `proguard-rules.additions.pro` | Gradle files | SDK levels, Kotlin, coroutines, exifinterface, keep rules. |
| `assetlinks.template.json` | your website | Digital Asset Links file for App Links (section 6). |
| `SAMSUNG-BIXBY.md` | (doc) | Samsung routes and a support matrix. |

**Not for v1:** the experimental Gemini AppFunctions code was removed (it needed the unverified `androidx.appfunctions` dependency). See "Optional later" at the end.

## 2. Build steps

**SDK levels (Google Play requirement):** `targetSdkVersion 36` and `compileSdkVersion 36`, `minSdkVersion 24` (Capacitor 8's minimum). Capacitor 8 generates exactly these in `android/variables.gradle`; keep them. Google Play has required target API 35+ for new apps and updates since 31 August 2025 and will require the next level about a year later: never lower `targetSdkVersion`.

```bash
# from the repo root, same staging as iOS but with an Android base URL:
STUDYBOARD_OUT=android-www STUDYBOARD_BASE=https://localhost/ node prepare.js     # Capacitor Android serves https://localhost by default
cp ios-wrapper/native-bridge.js android-www/native-bridge.js                       # the bridge is platform-aware (Capacitor.getPlatform())
# add <script src="native-bridge.js"></script> right after <head> in android-www/index.html (as for iOS)
cd android-wrapper && npm init -y
npm i @capacitor/core@8 @capacitor/android@8 @capacitor/app@8 @capacitor/browser@8 @capacitor/push-notifications@8 @capacitor/filesystem@8 @capacitor/share@8 \
      capacitor-secure-storage-plugin @revenuecat/purchases-capacitor
npm i -D @capacitor/cli@8
cp ../ios-wrapper/capacitor.config.json . && sed -i 's/"webDir": "ios-www"/"webDir": "android-www"/' capacitor.config.json
npx cap add android && npx cap sync android
```

Then merge the files from section 1 into `android/` (copy the Kotlin files listed there + the res folders; merge the manifest blocks by hand; add the Gradle lines from `build.gradle.additions.txt`; put `google-services.json` in `android/app/` for push, section 4). In `MainActivity` register the plugins **before** `super.onCreate`:

```kotlin
// android/app/src/main/java/com/studioso/app/MainActivity.kt (Capacitor generates MainActivity.java: replace it with this Kotlin file)
package com.studyboardapp.studyboard
import android.os.Bundle
import com.getcapacitor.BridgeActivity
import com.studyboardapp.studyboard.capture.StudyboardCaptureTokenPlugin
import com.studyboardapp.studyboard.capture.StudyboardSharedQueuePlugin
class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(StudyboardCaptureTokenPlugin::class.java)
        registerPlugin(StudyboardSharedQueuePlugin::class.java)
        registerPlugin(StudyboardLmsPlugin::class.java)          // school site sign-in and sync (StudyboardLms.kt)
        registerPlugin(StudyboardHomeWidgetsPlugin::class.java)  // home-screen widgets (section 8)
        registerPlugin(StudyboardFocusActivityPlugin::class.java) // Focus notification (section 9)
        registerPlugin(StudyboardFocusGuardPlugin::class.java)   // Do Not Disturb during Focus (section 10)
        registerPlugin(StudyboardNotifActionsPlugin::class.java) // Mark Done / Snooze on reminders (section 11)
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
  * Server note: `capture-task` dedupes an `Idempotency-Key` for **7 days**, which covers the whole retry window above, so a retry after a lost response never adds a duplicate.
* **Deep links** (`MainActivity`): `studyboard://add?text=...`, `studyboard://capture?photo=1`, `studyboard://action/quickadd`; the bridge forwards the first two to `SBCAPTURE.handleUrl` (cap-core), which always opens the confirm sheet.
* **Launcher shortcuts** (`shortcuts.xml`): long-press the icon: "Add task", "Capture photo".
* **Quick Settings tile** (`QuickCaptureTileService`): the person adds it from the tile editor; it opens `studyboard://capture`.
* **Voice assistants**: section 5.

## 4. Push reminders (FCM) and purchases (Google Play)

**Push.** Web Push never works inside the Android WebView; the app uses `@capacitor/push-notifications` (Firebase Cloud Messaging).

1. Firebase console: create a project (or use one), add an Android app with package `com.studyboardapp.studyboard`, download **`google-services.json`** into `android/app/`. Capacitor 8's template already has the `com.google.gms:google-services` classpath and applies the plugin only when that file exists.
2. In `native-bridge.js` set `PUSH_READY.android = true` (it is `false` so a build without `google-services.json` never tries to register).
3. Android 13+ shows the notification permission prompt when the page calls `StudyboardNative.enablePush()` (`POST_NOTIFICATIONS` is in the manifest additions). It resolves `{platform: "android", kind: "fcm", token}` or `null`; `StudyboardNative.pushAvailable` says whether to offer push at all. Call `enablePush({prompt: false})` on every start to save a changed token.
4. Server: send-reminders must send through the **FCM HTTP v1 API** (`https://fcm.googleapis.com/v1/projects/<project-id>/messages:send`) with a Google service account (Firebase console > Project settings > Service accounts > generate key; store it as a server secret, never in the app). Put `taskId` and `rid` in the message `data` so a tap opens the task.
5. Optional: `com.google.firebase.messaging.default_notification_icon` / `default_notification_channel_id` meta-data (see the plugin README) for a monochrome status-bar icon and a named channel.
6. Play "Data safety": declare **Device or other IDs** (the FCM token, linked, app functionality) in addition to the items in section 6.

**Purchases.** Pro is sold with **Google Play Billing** through RevenueCat (`@revenuecat/purchases-capacitor`, installed in section 2). In RevenueCat add a Play Store app for `com.studyboardapp.studyboard` (service-account credentials for Play), attach the Play subscription products to the same `pro` entitlement and the same offering (monthly + annual packages) as iOS, and put the **public** `goog_...` SDK key in `native-bridge.js` (`RC_KEYS.android`). Until that key is set, `StudyboardNative.purchasesAvailable` is `false`, the bridge does not claim `studyboard:plan-checkout` / `plan-restore`, and the page must hide Buy. Manage opens RevenueCat's `managementURL` or `https://play.google.com/store/account/subscriptions?package=com.studyboardapp.studyboard`. Play's payments policy forbids linking to an outside payment page for digital goods, so the bridge's payment-host block applies here too.

## 5. Voice assistants: the honest state of things

* **Gemini.** No integration in v1 (see "Optional later" below). "Hey Google, open Studyboard" then the in-app quick add works everywhere.
* **Google Assistant App Actions (`actions.xml`, built-in intents).** Not included. Google deprecated most Built-in Intents and App Actions for third-party apps, and there is no confirmed, still-supported built-in intent for "create a task". The static `shortcuts.xml` therefore has **no `<capability>`** elements.
* **`ACTION_CREATE_NOTE`** is intentionally not registered: it is for the notes-app role.
* **Fallbacks that do not need an assistant integration:** (a) "Hey Google, open Studyboard" then the in-app quick add; (b) a Google Assistant / Gemini routine or Bixby quick command that opens `studyboard://add?text=` or the app shortcut; (c) Tasker / HTTP Request Shortcuts calling the endpoint (SAMSUNG-BIXBY.md has copyable configs); (d) the share sheet and the tile.

## 6. Other config

* **Network:** `network_security_config.xml` forbids cleartext everywhere, trusts only system CAs, no pinning. `usesCleartextTraffic="false"` too.
* **App Links:** use the **same domain** as the iOS `applinks:` entry (`YOUR-DOMAIN.example` in both places until you fill it in). Replace it in the manifest's `android:host`, fill in `assetlinks.template.json` (package `com.studyboardapp.studyboard`; the SHA-256 fingerprint of the **Play App Signing** key from Play Console > Test and release > App integrity, plus your upload/debug key if you test sideloaded builds) and host it at `https://YOUR-DOMAIN.example/.well-known/assetlinks.json` (exact path, HTTPS, `Content-Type: application/json`, no redirect). Check with `adb shell pm get-app-links com.studyboardapp.studyboard` (state `verified`). The filter only takes the app's own address (`android:path="/"`, i.e. `/?deck=`, `/?group=`, `/?task=` as in the iOS association file), so reset-password, confirm-signup, magic-link and `/website/` pages still open in the browser.
* **Backup:** nothing is backed up or moved to a new phone. `allowBackup` is false, and because Android 12+ ignores that flag once `dataExtractionRules` is set, `data_extraction_rules.xml` (and `backup_rules.xml` for older versions) excludes every domain too: the WebView data (Supabase session, Canvas token, school sign-in cookies), the capture token (its Keystore key cannot move anyway) and the queues. Everything is re-synced from the account after sign-in.
* **Play 'Data safety':** capture sends the user's task text to the app's own Supabase project ("App activity / user content, collected, linked, for app functionality"). Push adds Device or other IDs (section 4); purchases add Purchase history (RevenueCat/Google Play). Keep the form consistent.
* **ProGuard:** `proguard-rules.additions.pro` keeps plugin and entry-point classes. Test a **release** (minified) build: Capacitor plugins found by reflection are the usual failure.
* **Permissions:** `INTERNET` and `POST_NOTIFICATIONS` (push, the Focus notification), `RECORD_AUDIO` + `MODIFY_AUDIO_SETTINGS` (Record a Lecture), `ACCESS_NOTIFICATION_POLICY` (Do Not Disturb during Focus, granted by the student in Settings) and `RECEIVE_BOOT_COMPLETED` (to put Do Not Disturb back after a restart mid-session). No storage, exact-alarm or overlay permission.

## 7. Test steps (device, `adb`)

Install a debug build, sign in, and create the capture token in Settings. Then:

```bash
# Share text: a dialog must appear; nothing is sent until "Add to Studyboard" (Cancel / back = nothing sent)
adb shell am start -a android.intent.action.SEND -t text/plain --es android.intent.extra.TEXT "bio lab report friday" -n com.studyboardapp.studyboard/.capture.ShareReceiverActivity

# file:// streams are refused ("Couldn't read that image."); test images from the Photos/Gallery share sheet instead
adb shell am start -a android.intent.action.SEND -t image/jpeg --eu android.intent.extra.STREAM file:///sdcard/Download/test.jpg -n com.studyboardapp.studyboard/.capture.ShareReceiverActivity

# Deep links
adb shell am start -a android.intent.action.VIEW -d "studyboard://add?text=bio%20lab%20report&due=friday&course=Biology&source=shortcut" com.studyboardapp.studyboard
adb shell am start -a android.intent.action.VIEW -d "studyboard://capture?photo=1" com.studyboardapp.studyboard
adb shell am start -a android.intent.action.VIEW -d "studyboard://action/quickadd" com.studyboardapp.studyboard

# Shortcuts / links resolved
adb shell dumpsys shortcut | grep -A3 -i studyboard
adb shell pm get-app-links com.studyboardapp.studyboard

# Logs: confirm NO token, push token or task text is printed
adb logcat | grep -i -E "studyboard|capture"
```

Manual: long-press the icon (shortcuts), add the tile (swipe down twice > pencil > "Quick capture"), tap it, share from Chrome / Keep / Gallery. Share a photo taken in portrait: it must arrive upright (EXIF). Offline test: airplane mode, share text ("Saved. It will be added when you're back online."), reconnect, open the app: the task appears once. Revoked token: share text, the item appears in the app's confirm sheet instead. Push: turn reminders on (permission prompt on Android 13+), check a row in `push_subscriptions`, send a test reminder, tap it: the task opens. Purchases: with a Play license-test account, buy monthly, restore, manage; with the placeholder key the Buy buttons must be hidden.

## 8. Home-screen widgets (UNTESTED on a device)

Two widgets in the launcher's widget picker (long-press the home screen > Widgets > Studyboard). The debug build compiles them and
`app/src/test/.../HomeWidgetsTest.kt` draws both layouts on the JVM (Robolectric), but nobody has placed them on a real launcher yet.

* **Today** (2x2 to 4x4, resizable): Exam Mode's countdown at the top ("Chemistry midterm in 3 days · ready 72%"), the date, **Do This
  Next** with its time slot ("Until 2:45 PM", or "3:00 PM to 3:30 PM" in a gap), then today's tasks with a round checkbox each (as many
  rows as fit the size, then "+N more"), and the Time Cushion line at the bottom when the page sends one ("2h 30m to spare", amber
  "Tight: 20m spare by Tue", red "45m short by Tue"). Tapping the checkbox ticks the task off; tapping a title opens it.
* **Countdown** (2x1 to 4x2): the exam in Exam Mode, else the next exam in the week ahead, else the nearest deadline: the days left,
  its title, the course and readiness when known (a bar at 2 rows tall). Tap to open it.
* Both follow the system's light or dark mode (`res/values-night/sbw_colors.xml`) and use the theme accent the page sends; with no data
  or after sign-out they say "Open Studyboard to see your day".

How it works: the same JSON and plugin as the iPhone widgets. The page (`src/js/70-widgets.js`, `phoneData()` v1) calls
`StudyboardNative.homeWidgets.save()` (native-bridge.js 6b, no longer iPhone-only), which stores it in private SharedPreferences and
redraws the widgets 1.5 s later. A tick is queued (`drain`/`ack`, `[{id, kind: "done", task, at}]`), shows as done at once, and is done in
the page with Undo the next time the app opens or comes back to the front. Do This Next moves on through the plan's blocks and after
midnight today's list comes from the week ahead, without the app: an inexact, non-waking `AlarmManager` alarm redraws the widgets at
the next block's start or end and just after midnight (plus on a time zone, clock or language change). The providers have to be
exported for the launcher, so ticks and redraws go through `WidgetActionReceiver`, which is not: no other app can tick off tasks.

Check on a device: add both widgets; change a task in the app (the widget follows within ~2 s); tick a box with the app closed, open
the app (the task is done, with Undo); resize Today from 2x2 to 4x4 (more rows); switch dark mode; wait for a plan block to end; sign
out (both say "Open Studyboard to see your day").

## 9. Focus timer notification and Wear OS (UNTESTED on a device or watch)

While a Focus timer runs, the app shows an ongoing notification with the system's own live countdown (Chronometer, so it ticks with the
app closed) and **Pause** (then **Resume**) and **Stop**. It is the Android side of the plugin the iPhone uses for its Live Activity
(`StudyboardFocusActivity`, `show/end/take` + an `action` event), so `src/js/01-focus.js` drives it unchanged: a press changes the
notification at once and is queued with the moment it was pressed; the page applies it (`pomoTakeLock`) when it next runs, so both end up
at exactly the same time. `show()` resolves false on Android, so the page keeps the timer in its header too. On Android 13+ the
notification permission is asked for once, the first time a session starts without it.

**Wear OS:** the notification is marked as an Ongoing Activity (`androidx.wear:wear-ongoing` 1.0.0, a timer status and the static icon).
Be aware: Wear OS does not bridge a phone's *ongoing* notifications to the watch, so a watch paired with the phone may not show this one;
the Ongoing Activity marking takes effect where the notification is posted on a Wear OS device. Showing the timer on a paired watch
reliably needs a small watch app (not in v1). The reminder buttons in section 11 do reach a paired watch (ordinary notifications are
bridged). `wear-ongoing` declares API 25, so the build adds `tools:overrideLibrary="androidx.wear.ongoing"` and the code only calls it on
API 25+.

## 10. Block distracting apps: Do Not Disturb during Focus (UNTESTED on a device)

`window.StudyboardNative.focusGuard` (native-bridge.js section 12) exists when the plugin `StudyboardFocusGuard` is in the build:

```
available(): Promise<{dnd: boolean, apps: boolean}>   // Android: dnd = true unless an Android Go phone; apps = false (no per-app blocking)
pickApps(): Promise<boolean>                          // Android: false
start({until: number, apps: boolean, dnd: boolean}): Promise<boolean>   // until = the session's end, ms since 1970
stop(): Promise<boolean>
```

`start({dnd: true})` the first time opens Settings > Do Not Disturb access (`ACCESS_NOTIFICATION_POLICY` in the manifest); back in the
app it resolves whether the access was granted and DND is on. It sets the student's own **Priority only** mode, remembers the mode
from before, and puts it back when the session ends (an alarm at `until`: exact when Android allows it without asking, otherwise within
minutes), on `stop()`, when the app next starts after being killed, and after a phone restart (`RECEIVE_BOOT_COMPLETED`). If the
student changed DND themselves in the meantime, it is left alone. Play: no special declaration is needed for notification-policy access.

## 11. Reminders with Mark Done and Snooze 1 Hour (UNTESTED on a device or watch)

`send-reminders` now sends Android reminders as FCM **data** messages (`sbRem: "1"`, title, body, taskId, rid, tok, api, k), and
`StudyboardMessagingService` (which replaces the push plugin's own `MessagingService` via `tools:node="remove"` and passes everything
on to it) draws them with **Mark Done** (tasks only) and **Snooze 1 Hour**. A paired Wear OS watch shows the same buttons. A press works
with the app closed: it calls send-reminders' `done`/`snooze` with the reminder's one-time token (only to `*.supabase.co/functions/v1/
send-reminders`), and is queued for the page (`StudyboardNative.notifActions.drain/ack`, items `{id, kind: "done"|"snooze", task, rid,
at, until?, server}`); `src/js/71-native-actions.js` ticks the task off on the device (Undo label "Completed X (from a reminder)").
A Snooze the server couldn't take is shown again by the phone after an hour. This needs push set up (section 4); data messages are not
delivered to an app the user has force-stopped. Because the FCM message changed shape, Android installs made before this build would
receive reminders but not show them: Android push was off until now (`PUSH_READY.android = false`), so there are none.

Check on a device: send a test reminder for a task, press Mark Done with the app closed, open the app (the task is done); press Snooze
in airplane mode (it comes back an hour later); repeat both from a paired Wear OS watch.

## Optional later: Gemini AppFunctions

Android 16 introduced `AppFunctions` (an app exposes functions an agent such as Gemini can call, similar to App Intents on iOS). An experimental `StudyboardAppFunctions.addTask` + `StudyboardApplication` (`AppFunctionConfiguration.Provider`) draft was written and then deleted before v1 (it is in git history): the `androidx.appfunctions` artifact names, KSP arguments, manifest requirements and Gemini/device/region availability were never verified. To try it later: restore it from git history, check the current `androidx.appfunctions` docs, add its dependencies + KSP plugin, set `android:name=".capture.StudyboardApplication"` on `<application>`, add keep rules for both classes, call `CaptureClient.send(..., source = "gemini")` (note the `CaptureResult` shape changed: `NotConfigured(queued)` and `Rejected`), and test on a supported device before saying it works.

## School sites on Android (full sync: grades, announcements, due dates)

The Android app can sign in to Brightspace, Canvas and Blackboard itself, like the desktop app, and read the same information. **UNTESTED on a device.**

* `app/src/main/java/com/studioso/app/capture/StudyboardLms.kt` is the Capacitor plugin `StudyboardLms` (`connect`, `run`, `signOut`). Register it in `MainActivity` (section 2 above shows the line).
* `StudyboardLmsScripts.kt` (same folder, copy it too) is the plugin's allowlist: it only runs the scripts built from `lms.js` (checked by SHA-256; only digits or plain JSON data may vary), so a script injected into the app's page cannot run its own code in the student's school site. It is generated: after changing `lms.js` or `lms-mobile.src.js`, run `node scripts/build-lms-mobile.js --native` (`tests/lms-mobile.test.js` fails until you do).
* The web side is `lms-mobile.js`, built from `lms-mobile.src.js` and `lms.js` by `scripts/build-lms-mobile.js`. `node prepare.js` with `STUDYBOARD_OUT=android-www` builds it into the staged folder and adds the script tag by itself. It runs the desktop app's exact harvest scripts and cleans results with lms.js's own code, and switches on only when the plugin exists.
* No new permissions are needed (the app already has `INTERNET`). The web views get no camera, microphone or location.
* Android keeps one cookie jar for the app, so platforms are separated by site and sign-out removes the cookies of that school's site and its parent domains.
* Play: the sign-in page shows the real address, Studyboard never sees the password, and it only reads. Describe this in the Data safety form and review notes.
* Test on a real device with a real account for each platform. Google single sign-on is expected to be refused inside an embedded WebView; Microsoft usually works. See `../MOBILE-SCHOOL-SYNC-SCOPE.md` for the fallbacks.
