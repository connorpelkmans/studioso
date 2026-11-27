#!/usr/bin/env node
// Builds the Google Play app in one step.
//   npm run android:build              debug .apk + release .aab (signed when android-wrapper/keystore.properties exists)
//   node scripts/android-build.js debug      only the debug .apk (installs on a phone or emulator, no signing needed)
//   node scripts/android-build.js release    only the release .aab (what you upload to Google Play)
//   node scripts/android-build.js prepare    stage and merge only, then open android-wrapper/android in Android Studio
// Needs: Node 22, JDK 21 (Android Studio's own works) and the Android SDK (ANDROID_HOME, or sdk.dir in android-wrapper/android/local.properties).
// Steps: stage the web files, make the Capacitor project the first time, sync, merge the Studyboard files (Kotlin, resources, manifest,
// Gradle), put in the icons and the version, then run Gradle. It can be run again and again: every merge step checks before it changes anything.
"use strict";
const fs = require("fs"), path = require("path"), {execFileSync} = require("child_process");
const root = path.join(__dirname, ".."), wrap = path.join(root, "android-wrapper"), proj = path.join(wrap, "android"), app = path.join(proj, "app");
const PKG = "com.studyboardapp.studyboard", DOMAIN = "studyboardapp.com";
const mode = process.argv[2] || "all";
if (!["all", "debug", "release", "prepare"].includes(mode)) { console.error("android-build: use debug, release, prepare or nothing"); process.exit(1); }
const win = process.platform === "win32";
const run = (cmd, args, cwd, env) => execFileSync(cmd, args, {cwd, stdio: "inherit", env: Object.assign({}, process.env, env || {}), shell: win && /\.(cmd|bat)$/i.test(cmd)});
const read = f => fs.readFileSync(f, "utf8"), write = (f, s) => fs.writeFileSync(f, s);
const log = m => console.log("android-build: " + m);
const version = JSON.parse(read(path.join(root, "package.json"))).version;
const [maj, min, pat] = version.split(".").map(n => parseInt(n, 10) || 0);
// Play wants a whole number that rises with every upload: 1.15.4 -> 11504. Set ANDROID_VERSION_CODE to override (for a second upload of the same version).
const versionCode = parseInt(process.env.ANDROID_VERSION_CODE || "", 10) || (maj * 10000 + min * 100 + pat);

// 1. The web files
log("staging the web files (version " + version + ", versionCode " + versionCode + ")");
run(process.execPath, [path.join(root, "prepare.js")], root, {STUDYBOARD_OUT: "android-www", STUDYBOARD_BASE: "https://localhost/"});
const www = path.join(root, "android-www");
fs.copyFileSync(path.join(root, "ios-wrapper", "native-bridge.js"), path.join(www, "native-bridge.js"));
{
  const page = path.join(www, "index.html"); let html = read(page);
  if (!html.includes('<script src="native-bridge.js"></script>')) {
    const at = html.indexOf("<head>"); if (at < 0) throw new Error("android-build: no <head> in android-www/index.html");
    html = html.slice(0, at + 6) + '\n<script src="native-bridge.js"></script>' + html.slice(at + 6); write(page, html);
  }
  const csp = (/<meta http-equiv="Content-Security-Policy" content="([^"]*)"/.exec(html) || [])[1] || "";
  if (csp && !/script-src[^;]*'self'/.test(csp)) throw new Error("android-build: the page's CSP doesn't allow 'self' scripts, so native-bridge.js would be blocked");
}
fs.rmSync(path.join(wrap, "android-www"), {recursive: true, force: true});
fs.cpSync(www, path.join(wrap, "android-www"), {recursive: true});
fs.rmSync(www, {recursive: true, force: true});

// 2. The Capacitor project
const npm = win ? "npm.cmd" : "npm", npx = win ? "npx.cmd" : "npx";
if (!fs.existsSync(path.join(wrap, "node_modules", "@capacitor", "android"))) { log("installing the Capacitor packages"); run(npm, ["install", "--no-audit", "--no-fund"], wrap); }
if (!fs.existsSync(proj)) { log("creating the Android project"); run(npx, ["cap", "add", "android"], wrap); }
log("syncing"); run(npx, ["cap", "sync", "android"], wrap);

// 3. Kotlin sources: every package folder under android-wrapper/app/src/main/java/com/studyboardapp/studyboard (capture, widgets, focus, notify)
const kt = path.join(app, "src", "main", "java", ...PKG.split("."));
const ktRoot = path.join(wrap, "app", "src", "main", "java", ...PKG.split("."));
for (const sub of fs.readdirSync(ktRoot, {withFileTypes: true}).filter(d => d.isDirectory()).map(d => d.name)) {
  fs.mkdirSync(path.join(kt, sub), {recursive: true});
  for (const f of fs.readdirSync(path.join(ktRoot, sub))) if (f.endsWith(".kt")) fs.copyFileSync(path.join(ktRoot, sub, f), path.join(kt, sub, f));
}
// JVM tests (Robolectric: the widgets' model and layouts, no emulator needed): ./gradlew testDebugUnitTest in android-wrapper/android
{
  const tSrc = path.join(wrap, "app", "src", "test", "java", ...PKG.split(".")), tDst = path.join(app, "src", "test", "java", ...PKG.split("."));
  if (fs.existsSync(tSrc)) for (const sub of fs.readdirSync(tSrc, {withFileTypes: true}).filter(d => d.isDirectory()).map(d => d.name)) {
    fs.mkdirSync(path.join(tDst, sub), {recursive: true});
    for (const f of fs.readdirSync(path.join(tSrc, sub))) if (f.endsWith(".kt")) fs.copyFileSync(path.join(tSrc, sub, f), path.join(tDst, sub, f));
  }
  // the tests' own manifest: the same allowance for wear-ongoing (API 25+) as the app's (step 5), and without RevenueCat's Amazon
  // store receiver, whose old bytecode Robolectric's class loader refuses when it registers the manifest's receivers
  write(path.join(app, "src", "test", "AndroidManifest.xml"), `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools">
    <uses-sdk tools:overrideLibrary="androidx.wear.ongoing" />
    <application>
        <receiver android:name="com.amazon.device.iap.ResponseReceiver" tools:node="remove" />
    </application>
</manifest>
`);
}
fs.rmSync(path.join(kt, "MainActivity.java"), {force: true});
write(path.join(kt, "MainActivity.kt"), `package ${PKG}

import android.os.Bundle
import com.getcapacitor.BridgeActivity
import ${PKG}.capture.StudyboardCaptureTokenPlugin
import ${PKG}.capture.StudyboardLmsPlugin
import ${PKG}.capture.StudyboardSharedQueuePlugin
import ${PKG}.focus.StudyboardFocusActivityPlugin
import ${PKG}.focus.StudyboardFocusGuardPlugin
import ${PKG}.notify.StudyboardNotifActionsPlugin
import ${PKG}.widgets.StudyboardHomeWidgetsPlugin

// Studyboard's own plugins have to be registered before super.onCreate
class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(StudyboardCaptureTokenPlugin::class.java)
        registerPlugin(StudyboardSharedQueuePlugin::class.java)
        registerPlugin(StudyboardLmsPlugin::class.java)
        registerPlugin(StudyboardHomeWidgetsPlugin::class.java)     // home-screen widgets (widgets/)
        registerPlugin(StudyboardFocusActivityPlugin::class.java)   // the Focus timer's ongoing notification (focus/)
        registerPlugin(StudyboardFocusGuardPlugin::class.java)      // Do Not Disturb during Focus (focus/FocusGuard.kt)
        registerPlugin(StudyboardNotifActionsPlugin::class.java)    // Mark Done / Snooze on reminders (notify/)
        super.onCreate(savedInstanceState)
    }
}
`);

// 4. Resources: ours first, then the icons and splash
const resDst = path.join(app, "src", "main", "res"), resSrc = path.join(wrap, "app", "src", "main", "res");
// every folder (xml, drawable, layout, values, values-night, values-v31); values/strings.xml goes in as studyboard_strings.xml so
// Capacitor's own strings.xml stays
for (const sub of fs.readdirSync(resSrc, {withFileTypes: true}).filter(d => d.isDirectory()).map(d => d.name)) {
  fs.mkdirSync(path.join(resDst, sub), {recursive: true});
  for (const f of fs.readdirSync(path.join(resSrc, sub))) fs.copyFileSync(path.join(resSrc, sub, f), path.join(resDst, sub, sub === "values" && f === "strings.xml" ? "studyboard_strings.xml" : f));
}
const brand = path.join(wrap, "branding", "res");
if (fs.existsSync(brand)) fs.cpSync(brand, resDst, {recursive: true});
else log("WARNING: android-wrapper/branding/res is missing, so the app keeps Capacitor's icon (run python3 tools/make-android-icons.py)");

// 5. The manifest
{
  const mf = path.join(app, "src", "main", "AndroidManifest.xml"); let m = read(mf);
  const add = read(path.join(wrap, "app", "src", "main", "AndroidManifest.additions.xml")).replace(/YOUR-DOMAIN\.example/g, DOMAIN);
  // (once only: the manifest never contains the text "studyboard://", so checking for it merged the blocks again on every run)
  if (!m.includes("ShareReceiverActivity")) {
    m = m.replace('android:allowBackup="true"', 'android:allowBackup="false"\n        android:networkSecurityConfig="@xml/network_security_config"\n        android:usesCleartextTraffic="false"\n        android:dataExtractionRules="@xml/data_extraction_rules"\n        android:fullBackupContent="@xml/backup_rules"');
    const main = /<activity android:name="\.MainActivity"[^>]*>([\s\S]*?)<\/activity>/.exec(add);
    if (!main) throw new Error("android-build: MainActivity block not found in AndroidManifest.additions.xml");
    m = m.replace(/(<category android:name="android\.intent\.category\.LAUNCHER" \/>\s*<\/intent-filter>)/, "$1\n" + main[1].replace(/^\n+|\s+$/g, ""));
    const share = /<activity\s+android:name="\.capture\.ShareReceiverActivity"[\s\S]*?<\/activity>/.exec(add), tile = /<service[\s\S]*?<\/service>/.exec(add);
    if (!share || !tile) throw new Error("android-build: share or tile block not found in AndroidManifest.additions.xml");
    m = m.replace("</application>", "\n        " + share[0] + "\n\n        " + tile[0] + "\n    </application>");
    write(mf, m); log("merged the manifest");
  } else if (m.includes(`android:scheme="https" android:host="${DOMAIN}" />`)) {
    // projects merged before the App Link was limited to the app's own address (reset-password etc. stay in the browser)
    write(mf, m.split(`android:scheme="https" android:host="${DOMAIN}" />`).join(`android:scheme="https" android:host="${DOMAIN}" android:path="/" />`)); log("limited the App Link to the app's address");
  }
  // Studyboard's widgets, Focus notification, Do Not Disturb and reminder buttons: one block, merged once (also into projects made
  // before it existed) and kept up to date, and every permission the additions list
  m = read(mf);
  const block = /<!-- BEGIN sb-native[\s\S]*?<!-- END sb-native -->/.exec(add);
  if (!block) throw new Error("android-build: the sb-native block is missing from AndroidManifest.additions.xml");
  if (!m.includes("<!-- BEGIN sb-native")) {
    if (!m.includes("xmlns:tools=")) m = m.replace(/<manifest\b/, '<manifest xmlns:tools="http://schemas.android.com/tools"');
    m = m.replace("</application>", "\n        " + block[0] + "\n    </application>"); log("merged the widgets, Focus notification and reminder buttons into the manifest");
  } else m = m.replace(/<!-- BEGIN sb-native[\s\S]*?<!-- END sb-native -->/, () => block[0]);
  // androidx.wear:wear-ongoing says API 25+; every Wear OS watch is, and FocusNotification.kt only calls it there
  if (!m.includes("tools:overrideLibrary")) m = m.replace(/(\s*)<application\b/, '$1<uses-sdk tools:overrideLibrary="androidx.wear.ongoing" />$1<application');
  for (const p of add.match(/<uses-permission [^>]*\/>/g) || []) if (!m.includes(p.replace(/\s+/g, " ")) && !m.includes('"' + /android:name="([^"]+)"/.exec(p)[1] + '"')) m = m.replace("</manifest>", "    " + p + "\n</manifest>");
  write(mf, m);
}

// 6. Gradle
{
  const top = path.join(proj, "build.gradle"); let t = read(top);
  if (!t.includes("kotlin-gradle-plugin")) { t = t.replace("classpath 'com.google.gms:google-services:4.4.4'", "classpath 'com.google.gms:google-services:4.4.4'\n        classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:2.2.20'"); write(top, t); }
  const ap = path.join(app, "build.gradle"); let g = read(ap);
  if (!g.includes("org.jetbrains.kotlin.android")) g = g.replace("apply plugin: 'com.android.application'", "apply plugin: 'com.android.application'\napply plugin: 'org.jetbrains.kotlin.android'");
  g = g.replace(/versionCode \d+/, "versionCode " + versionCode).replace(/versionName "[^"]*"/, 'versionName "' + version + '"');
  if (!g.includes("keystore.properties")) {
    g = g.replace("android {", `// The upload key: android-wrapper/keystore.properties (storeFile, storePassword, keyAlias, keyPassword). Never commit it.
def keystorePropsFile = rootProject.file("../keystore.properties")
def keystoreProps = new Properties()
if (keystorePropsFile.exists()) { keystorePropsFile.withInputStream { keystoreProps.load(it) } }

android {
    signingConfigs {
        if (keystorePropsFile.exists()) {
            release {
                storeFile file(keystoreProps['storeFile'])
                storePassword keystoreProps['storePassword']
                keyAlias keystoreProps['keyAlias']
                keyPassword keystoreProps['keyPassword']
            }
        }
    }`);
    g = g.replace("buildTypes {\n        release {", "buildTypes {\n        release {\n            if (keystorePropsFile.exists()) { signingConfig signingConfigs.release }");
    g = g.replace("\nrepositories {", `
kotlin {
    compilerOptions { jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_21 }
}

repositories {`);
    g = g.replace("dependencies {\n", `dependencies {
    implementation "org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.2"   // ShareReceiverActivity, CaptureClient
    implementation "androidx.exifinterface:exifinterface:1.3.7"                // orientation of shared photos
`);
  }
  // the Wear OS ongoing activity for the Focus notification, and Firebase Messaging for Studyboard's own messaging service (the push
  // plugin already brings it at run time; the app needs it to compile StudyboardMessagingService)
  if (!g.includes("androidx.wear:wear-ongoing")) g = g.replace("dependencies {\n", `dependencies {
    implementation "androidx.wear:wear-ongoing:1.0.0"                         // Focus notification as a Wear OS ongoing activity
    implementation "com.google.firebase:firebase-messaging:25.0.1"             // notify/StudyboardMessagingService (same version as @capacitor/push-notifications)
`);
  if (!g.includes("org.robolectric:robolectric")) g = g.replace("dependencies {\n", `dependencies {
    testImplementation "org.robolectric:robolectric:4.16"                     // app/src/test: the widgets drawn on the JVM
    testImplementation "org.json:json:20240303"                                // (the real org.json; android.jar only has stubs)
`);
  // the tests draw the real layouts; SBW_SHOTS=<folder> saves them as PNGs
  if (!g.includes("includeAndroidResources")) g = g.replace('    namespace = "com.studyboardapp.studyboard"', `    testOptions {
        unitTests {
            includeAndroidResources = true
            all { systemProperty "sbw.shots", System.getenv("SBW_SHOTS") ?: "" }
        }
    }
    namespace = "com.studyboardapp.studyboard"`);
  write(ap, g);
  const pro = path.join(app, "proguard-rules.pro"), extra = read(path.join(wrap, "proguard-rules.additions.pro"));
  if (!read(pro).includes("StudyboardCaptureTokenPlugin")) fs.appendFileSync(pro, "\n" + extra);
  else if (!read(pro).includes("StudyboardHomeWidgetsPlugin")) fs.appendFileSync(pro, "\n" + extra.split("\n").filter(l => /widgets|focus|notify/.test(l)).join("\n") + "\n");
  // the sdk location, when ANDROID_HOME is set
  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT, lp = path.join(proj, "local.properties");
  if (sdk && !fs.existsSync(lp)) write(lp, "sdk.dir=" + sdk.replace(/\\/g, "\\\\") + "\n");
}
// Firebase: push reminders need google-services.json from your Firebase project (android-wrapper/google-services.json); without it the app still builds
{
  const gs = path.join(wrap, "google-services.json");
  if (fs.existsSync(gs)) { fs.copyFileSync(gs, path.join(app, "google-services.json")); log("using google-services.json (push reminders on)"); }
  else log("no android-wrapper/google-services.json: push reminders stay off (see android-wrapper/README-ANDROID.md section 4)");
}
log("project ready: android-wrapper/android");
if (mode === "prepare") process.exit(0);

// 7. Gradle
const gradlew = path.join(proj, win ? "gradlew.bat" : "gradlew");
if (!win) fs.chmodSync(gradlew, 0o755);
const tasks = mode === "debug" ? ["assembleDebug"] : mode === "release" ? ["bundleRelease"] : ["assembleDebug", "bundleRelease"];
run(gradlew, tasks.concat(["--no-daemon", "--console=plain"]), proj);
const out = [];
for (const [dir, ext] of [["apk/debug", ".apk"], ["bundle/release", ".aab"]]) {
  const d = path.join(app, "build", "outputs", dir);
  if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) if (f.endsWith(ext)) out.push(path.join(d, f));
}
const signed = fs.existsSync(path.join(wrap, "keystore.properties"));
console.log("\nandroid-build: done\n  " + out.join("\n  "));
if (out.some(f => f.endsWith(".aab")) && !signed) console.log("\nThe .aab above is NOT signed with your upload key, so Google Play won't accept it yet. Create android-wrapper/keystore.properties (see android-wrapper/README-ANDROID.md) and run again.");
