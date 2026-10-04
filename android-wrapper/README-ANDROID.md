# Studyboard for Android: Capacitor wrapper, quick capture (source templates)

> **Verification status: UNTESTED.** Written without Android Studio, a Kotlin compiler (`kotlinc` is not installed here), Gradle, an emulator or a device. Only the XML was parsed for well-formedness. The AppFunctions part (Gemini) is additionally **experimental**: I had no access to the current `androidx.appfunctions` documentation. Do not tell users that Gemini / Google Assistant / Galaxy AI "works" until section 6 has been run on real devices.

There is no Android project in the repo. This folder is a **merge set** for the project `npx cap add android` creates (appId `com.studioso.app`, see `../ios-wrapper/capacitor.config.json`; reuse that file, change `webDir` if you stage web files differently).

## 1. Files

| Path (under `android-wrapper/`) | Merge into | Purpose |
| --- | --- | --- |
| `app/src/main/AndroidManifest.additions.xml` | `android/app/src/main/AndroidManifest.xml` | Intent filters (`SEND`, `SEND_MULTIPLE`, `VIEW` for `studyboard://` and https), share activity, tile service, shortcuts meta-data, no-cleartext, backup exclusions. |
| `app/src/main/java/com/studioso/app/capture/CaptureStore.kt` | same path | Token + endpoint encrypted with an AndroidKeyStore AES-GCM key (platform APIs only). |
| `.../CaptureClient.kt` | same | HTTPS POST (8 s, `Idempotency-Key`, no logging) + the file queue. |
| `.../StudyboardNative.kt` | same | Capacitor plugins `StudyboardCaptureToken` and `StudyboardSharedQueue`. |
| `.../ShareReceiverActivity.kt` | same | Share target. |
| `.../QuickCaptureTileService.kt` | same | Quick Settings tile "Quick capture". |
| `.../StudyboardAppFunctions.kt`, `StudyboardApplication.kt` | same | **Experimental** `@AppFunction addTask` for Gemini. |
| `app/src/main/res/xml/{shortcuts,network_security_config,backup_rules,data_extraction_rules}.xml`, `res/values/strings.xml`, `res/drawable/ic_quick_capture.xml` | `res/` | Resources. |
| `build.gradle.additions.txt`, `proguard-rules.additions.pro` | Gradle files | Kotlin, coroutines, KSP + appfunctions (versions marked VERIFY), keep rules. |
| `SAMSUNG-BIXBY.md` | (doc) | Samsung routes and a support matrix. |

## 2. Build steps

```bash
# from the repo root, same staging as iOS but with an Android base URL:
STUDYBOARD_OUT=android-www STUDYBOARD_BASE=https://localhost/ node prepare.js     # VERIFY the base: Capacitor Android serves https://localhost by default
cp ios-wrapper/native-bridge.js android-www/native-bridge.js                       # the bridge is platform-aware (Capacitor.getPlatform())
# add <script src="native-bridge.js"></script> right after <head> in android-www/index.html (as for iOS)
cd android-wrapper && npm init -y && npm i @capacitor/core @capacitor/android @capacitor/app @capacitor/browser @capacitor/push-notifications capacitor-secure-storage-plugin
npm i -D @capacitor/cli
cp ../ios-wrapper/capacitor.config.json . && sed -i 's/"webDir": "ios-www"/"webDir": "android-www"/' capacitor.config.json
npx cap add android && npx cap sync android
```

Then merge the files from section 1 into `android/` (copy the Kotlin + res folders; merge the manifest blocks by hand; add the Gradle lines). In `MainActivity` register the plugins **before** `super.onCreate`:

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

The web layer calls the same two functions as on iOS (cap-server's Settings UI): `window.StudyboardNative?.saveCaptureToken?.(token, SUPABASE_URL)` and `clearCaptureToken?.()`. The bridge drains `StudyboardSharedQueue` into `SBCAPTURE.ingest(item)` on start and on resume.

## 3. What each entry point does

* **Share sheet** (`ShareReceiverActivity`): text/plain (subject + text) is posted straight to `capture-task` with `source: "android-share"` and a Toast says "Added to Studyboard". An image is downscaled (max 2048 px, 8 MB), saved in `filesDir/pending-captures`, then the app opens and ingests it. Only the first image of a multi-share is used. EXIF rotation is not applied (verify with a rotated photo).
* **Deep links** (`MainActivity`): `studyboard://add?text=...`, `studyboard://capture?photo=1`, `studyboard://action/quickadd`; the bridge forwards the first two to `SBCAPTURE.handleUrl` (cap-core).
* **Launcher shortcuts** (`shortcuts.xml`): long-press the icon: "Add task", "Capture photo".
* **Quick Settings tile** (`QuickCaptureTileService`): the person adds it from the tile editor; it opens `studyboard://capture`.
* **Gemini / Assistant**: section 4.

## 4. Voice assistants: the honest state of things

* **Gemini via AppFunctions (experimental, the forward path).** Android 16 introduced `AppFunctions`: an app exposes functions that an agent such as Gemini can discover and call, much as App Intents work on iOS. `StudyboardAppFunctions.addTask(appFunctionContext, title, dueDate?, course?)` posts to the capture endpoint and returns one speakable sentence. **Unknown to me and must be verified:** the exact artifact names/versions and KSP arguments, whether the first parameter and the `AppFunctionConfiguration.Provider` wiring are as written, any manifest/permission requirement, which devices and Android/One UI versions let Gemini call third-party app functions, whether the user must enable it, and which regions. Treat it as "may work on some Pixel / Galaxy devices after setup", nothing more. Delete `StudyboardAppFunctions.kt`, `StudyboardApplication.kt`, the three appfunctions Gradle lines and `android:name=".capture.StudyboardApplication"` if you want a build without it; nothing else depends on them.
* **Google Assistant App Actions (`actions.xml`, built-in intents).** Not included. Google deprecated most Built-in Intents and App Actions for third-party apps, and I am not certain of a valid, still-supported built-in intent for "create a task" (`actions.intent.CREATE_THING` is a generic schema.org "create" and I could not confirm Assistant still routes it). Shipping an unverified `actions.xml` risks a Play Console warning for nothing. The static `shortcuts.xml` therefore has **no `<capability>`** elements. If you confirm a supported intent in the current docs, add the `<capability>` + `<intent>` + `<extra-data>` mapping to `shortcuts.xml`, upload with Android Studio's App Actions test tool, and test with "Hey Google, add a task to Studyboard".
* **`ACTION_CREATE_NOTE`** is intentionally not registered: it is for the notes-app role.
* **Fallbacks that do not need an assistant integration:** (a) "Hey Google, open Studyboard" then the in-app quick add; (b) a Google Assistant / Gemini routine or Bixby quick command that opens `studyboard://add?text=` or the app shortcut; (c) Tasker / HTTP Request Shortcuts calling the endpoint (SAMSUNG-BIXBY.md has copyable configs); (d) the share sheet and the tile.

## 5. Other config

* **Network:** `network_security_config.xml` forbids cleartext everywhere, trusts only system CAs, no pinning. `usesCleartextTraffic="false"` too.
* **App Links:** host `https://YOUR-DOMAIN.example/.well-known/assetlinks.json`:
  `[{"relation":["delegate_permission/common.handle_all_urls"],"target":{"namespace":"android_app","package_name":"com.studioso.app","sha256_cert_fingerprints":["<release signing cert SHA-256; also the Play App Signing cert>"]}}]`
  Check with `adb shell pm get-app-links com.studioso.app`.
* **Backup:** the capture token's Keystore key does not move between devices, so the prefs file and queue are excluded from backup/transfer. `allowBackup` is false (Capacitor's web data is re-synced from the account).
* **Play 'Data safety':** unchanged: capture sends the user's task text to the app's own Supabase project, already declared as "App activity / user content, collected, linked, for app functionality". No new SDK, no new data type. Keep the form consistent if you add analytics later.
* **Proguard:** `proguard-rules.additions.pro` keeps plugin and entry-point classes. Test a **release** (minified) build: Capacitor plugins found by reflection are the usual failure.
* **Permissions:** only `INTERNET`. No notification, microphone, storage or overlay permission is needed for any of this.

## 6. Test steps (device, `adb`)

Install a debug build, sign in, and create the capture token in Settings. Then:

```bash
# Share text (should add a task and show the Toast; works without the app opening)
adb shell am start -a android.intent.action.SEND -t text/plain --es android.intent.extra.TEXT "bio lab report friday" -n com.studioso.app/.capture.ShareReceiverActivity

# Share an image (push one first)
adb push test.jpg /sdcard/Download/test.jpg
adb shell am start -a android.intent.action.SEND -t image/jpeg --eu android.intent.extra.STREAM file:///sdcard/Download/test.jpg -n com.studioso.app/.capture.ShareReceiverActivity
#   (on recent Android a file:// stream may be refused: test the image path from the Photos/Gallery share sheet instead)

# Deep links
adb shell am start -a android.intent.action.VIEW -d "studyboard://add?text=bio%20lab%20report&due=friday&course=Biology&source=shortcut" com.studioso.app
adb shell am start -a android.intent.action.VIEW -d "studyboard://capture?photo=1" com.studioso.app
adb shell am start -a android.intent.action.VIEW -d "studyboard://action/quickadd" com.studioso.app

# Shortcuts / links resolved
adb shell dumpsys shortcut | grep -A3 -i studyboard
adb shell pm get-app-links com.studioso.app

# Logs: confirm NO token or task text is printed
adb logcat | grep -i -E "studyboard|capture"
```

Manual: long-press the icon (shortcuts), add the tile (swipe down twice > pencil > "Quick capture"), tap it, share from Chrome / Keep / Gallery. Offline test: airplane mode, share text (Toast "Saved..."), then reconnect and open the app: the task appears once.

**Gemini (unverified):** update Google app and Gemini, then "Hey Google, add a task to Studyboard" and "Hey Google, add bio lab report to Studyboard". Check Gemini app > Settings > Apps / Connected apps for whether Studyboard is listed (the name and location of this setting change). Record Android version, Gemini version, region. Expected if AppFunctions is supported: Gemini asks or confirms and replies with the spoken sentence from `addTask`; on devices without it, Gemini will not know the app. On failure use the fallbacks in section 4. `adb shell cmd app_function --help` may exist on Android 16+ to list/execute functions: **verify**.
