# Publishing Studyboard to the Mac App Store and the iPhone App Store

One guide from start to submission. Everything runs on a Mac. Deeper detail: `APP-STORE-CHECKLIST.md` (rules, review notes,
privacy answers), `ios-wrapper/README-IOS.md` (iPhone wrapper), `TESTING-MAC-IPHONE.md` (testing on your own devices).

What you need: a Mac with **Xcode** (Mac App Store), **Node.js 22**, the **Transporter** app (Mac App Store), an iPhone, and
**US$99/year** for the Apple Developer Program.

---

## Part 1. Apple account setup (once, about an hour, plus waiting for Apple)

1. **Join the Apple Developer Program**: developer.apple.com/programs > Enroll. As a person (fastest) or a company (needs a
   D-U-N-S number). When it's active, open developer.apple.com > Account > **Membership details** and copy your **Team ID**
   (10 letters and digits).
2. **App ID**: developer.apple.com > Certificates, IDs & Profiles > **Identifiers** > + > App IDs > App. Bundle ID
   `com.studyboardapp.studyboard` (Explicit). Tick **Push Notifications**, **In-App Purchase**, **Associated Domains**, **App Groups**.
   Platforms: iOS and macOS (one App ID, so one purchase covers both).
3. **App Group**: Identifiers > + > App Groups > `group.com.studyboardapp.studyboard`. Then open the App ID again, App Groups > Configure,
   and tick it.
4. **Certificates** (easiest: Xcode > Settings > Accounts > your team > Manage Certificates > +):
   * **Apple Distribution** (iPhone and Mac App Store).
   * **Mac Installer Distribution** (shown as "3rd Party Mac Developer Installer"; signs the Mac App Store .pkg).
   * **Apple Development** (test builds).
5. **Mac provisioning profiles** (Profiles > +):
   * **Mac App Store Connect** (distribution) for `com.studyboardapp.studyboard` > download > save as
     `build-resources/Studyboard_MAS.provisionprofile`.
   * **macOS App Development** for `com.studyboardapp.studyboard`, with your Mac registered under Devices > download > save as
     `build-resources/Studyboard_MASDev.provisionprofile`.
   Don't commit these two files. iPhone profiles are made by Xcode automatically.
6. **Push key** (for iPhone reminders): Keys > + > **Apple Push Notifications service (APNs)** > download the `.p8` once.
   Keep the file, its Key ID and your Team ID; they go to the server that sends reminders, never into the app.
7. **App Store Connect** (appstoreconnect.apple.com):
   * **Business**: accept the **Paid Apps Agreement**, add tax and bank details (needed before Pro can be sold or tested).
   * **Apps > + > New App**: platforms **iOS** and **macOS**, name **Studyboard**, language, bundle ID `com.studyboardapp.studyboard`,
     SKU (any, e.g. `studyboard`).
   * **Subscriptions** (Pro): create a subscription group "Studyboard Pro" with a monthly and a yearly subscription.
8. **RevenueCat** (sells Pro through Apple): app.revenuecat.com > new project > add the App Store app (bundle id
   `com.studyboardapp.studyboard`, App Store Connect API key). Add the two products, an entitlement named **`pro`**, and an offering with
   **monthly** and **annual** packages (and optionally a custom **semester** package for the one-time 4-month plan, see `PRO-PLANS-GUIDE.md` step 10). Copy the **public Apple SDK key** (starts with `appl_`). Set its webhook to your
   Supabase function (see `PRO-PLANS-GUIDE.md`) so Pro turns on in the account.

## Part 2. Put your details into the project (one command)

From the project folder:

```bash
npm ci
npm run apple:setup -- --team YOURTEAMID --domain studyboardapp.com --revenuecat appl_YOURKEY
npm run check:store        # must end with "mas: ready" (needs the two provisioning profiles from step 5)
```

This fills your Team ID into `package.json` and the Mac entitlements, your domain into the iPhone entitlements, the RevenueCat
key into `ios-wrapper/native-bridge.js`, and creates `.well-known/apple-app-site-association` (the website serves it, so links
to studyboardapp.com open the app). Commit those changes and deploy the website once.

## Part 3. Mac App Store

```bash
# 1. A test build that runs in the App Store sandbox on your Mac
npm run dist:mas-dev
open dist/mas-dev-universal/Studyboard.app
```

Check inside it: sign in and sync, Choose Folder for the data folder, export a backup, attach a file, record a lecture
(microphone prompt), school site sign-in, reminders. Then:

```bash
# 2. The App Store build (uses the Apple Distribution and Mac Installer certificates in your keychain)
npm run dist:mas           # makes dist/mas-universal/Studyboard-<version>-mas.pkg
```

**Buying Pro in the Mac app.** The Mac App Store build sells Pro with Apple's in-app purchase. The Mac app has no website link, because the US storefront rule can't be checked from the Mac build, so it uses in-app purchase everywhere.
* Apple's sheet takes the payment (`main.js`, Electron's `inAppPurchase`). The page then sends Apple's receipt to RevenueCat for the signed-in account (`src/js/10-plan-mac.js`), and RevenueCat's webhook switches Pro on, as it does for iPhone.
* It uses the same RevenueCat key as iPhone. `npm run apple:setup -- --revenuecat appl_...` fills in both. Until the key is set, the Mac app says buying isn't available in this build.
* The Mac and iPhone apps share one bundle ID, so in RevenueCat the same App Store app covers both. Nothing extra is needed there.
* In App Store Connect, open your app's page and add **macOS** with **+ Add Platform** in the sidebar, if the app was created for iOS only. The subscriptions are shared by both platforms (Universal Purchase): someone who subscribes on iPhone has Pro on the Mac, and the reverse.
* Countries where the subscriptions aren't available (the EU, if you leave them unticked) get "Studyboard Pro isn't available in your country yet" when they try to buy.
* To test: `npm run dist:mas-dev`, open the app, sign in, and buy with a **Sandbox** account (System Settings > App Store > Sandbox Account on macOS 14 and later). Check that Pro turns on, then try **Restore Purchases**.
* Sign in with Apple in the Mac app opens your web browser (the web sign-in with the Services ID), so the Mac App ID needs no extra capability for it.

3. Open **Transporter**, sign in, drag the `.pkg` in, **Deliver**. After 10 to 30 minutes the build appears in App Store
   Connect > your app > **macOS** > Build.

## Part 4. iPhone app

```bash
# 1. One time: create the Xcode project
cd ios-wrapper
npm init -y
npm i @capacitor/core @capacitor/ios @capacitor/app @capacitor/browser @capacitor/push-notifications \
      @capacitor/share @capacitor/filesystem @capacitor/screen-orientation @capacitor/keyboard capacitor-secure-storage-plugin @revenuecat/purchases-capacitor
npm i -D @capacitor/cli
npx cap add ios
cd ..

# 2. Every release: build the app's pages into the iPhone project
npm run ios:stage

# 3. Open Xcode
cd ios-wrapper && npx cap open ios
```

In Xcode, once (target **App**):

1. **Signing & Capabilities**: Team = yours, Bundle Identifier `com.studyboardapp.studyboard`, "Automatically manage signing" on. Add with
   **+ Capability**: Push Notifications, In-App Purchase, Associated Domains (`applinks:studyboardapp.com`), App Groups
   (`group.com.studyboardapp.studyboard`), Background Modes > Remote notifications. Compare with
   `ios-wrapper/App.entitlements.template.plist`.
2. **Info.plist**: nothing to do. `npm run ios:stage` adds every key from `ios-wrapper/Info.plist.additions.plist`
   (camera, photos and microphone reasons, URL scheme, encryption flag) and keeps any already there. Without the camera
   reason, iOS closes the app the moment Take Photo opens the camera.
3. **Privacy manifest**: drag `build-resources/ios/PrivacyInfo.xcprivacy` into the App folder in Xcode, tick target App.
4. **App's own Swift code**: drag these from `ios-wrapper/native/` into the App folder (tick "Copy items" and target App):
   `MainViewController.swift`, `StudyboardPlugins.swift`, `SBCapture.swift`, `StudyboardLms.swift`, `StudyboardLmsScripts.swift`,
   `FocusActivity/StudyboardFocusActivityPlugin.swift`, `FocusActivity/StudyboardFocusAttributes.swift`. Then open
   `Main.storyboard`, select the Bridge View Controller, and in the Identity inspector set Class to **MainViewController**.
   These files haven't been compiled yet, so expect to fix small errors. To ship sooner, add only `MainViewController.swift`
   and delete its `registerPluginInstance` lines for the features you leave out.
5. **Push** (AppDelegate.swift, inside the class):
   ```swift
   func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
       NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
   }
   func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
       NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
   }
   ```
6. **App icon**: Assets > AppIcon > drop in `icon-1024.png` (1024 x 1024, no transparency).
7. **General**: Version (e.g. `1.15.2`, from `package.json`) and Build (`1`, raise it on every upload). Minimum iOS 16.2 or later.

Optional extras (not needed for the first release): the Dynamic Island focus timer (README-IOS.md 3c) and Siri/Share
capture (README-IOS.md 3b).

Then:

1. Plug in your iPhone, pick it at the top, press **Run**, and test (list in `TESTING-MAC-IPHONE.md`).
2. Choose **Any iOS Device (arm64)** at the top > **Product > Archive** > **Distribute App > App Store Connect > Upload**.
3. In the Organizer, before uploading, choose **Generate Privacy Report** and compare it with Part 5.
4. App Store Connect > TestFlight: add yourself and testers, test buying Pro with a **Sandbox** tester (Users and Access >
   Sandbox), including Restore Purchases.

## Part 5. App Store Connect listing (both apps)

For each platform (iOS and macOS tabs):

* **Screenshots**: App Store Connect lists the sizes it needs for each device; at the time of writing that's a 6.9" iPhone
  (1320 x 2868) and, if you support iPad, 13" iPad (2064 x 2752). Mac: 2880 x 1800 (or 2560 x 1600, 1440 x 900,
  1280 x 800). Take them from the simulator (Cmd+S) and on the Mac with Cmd+Shift+4.
* **Text**: name, subtitle, description, keywords, promotional text, support URL (a page with your email), privacy policy URL
  (`https://studyboardapp.com/privacy`), marketing URL (optional), copyright.
* **Category**: Education (secondary: Productivity). **Age rating**: answer the questionnaire (Study Groups have user
  messages; Report and Block exist).
* **App Privacy**: paste the answers from `APP-STORE-CHECKLIST.md` section 6a. Tracking: No.
* **Encryption**: already answered in the app (`ITSAppUsesNonExemptEncryption = NO`).
* **Subscriptions**: add the two Pro subscriptions to this version, with a review screenshot of the Pro screen.
* **App Review Information**: a demo account (create it in Supabase with Auto Confirm, fill it with sample courses and tasks,
  give it Pro) and the notes from `APP-STORE-CHECKLIST.md` section 5, including a throw-away low-quota Gemini key for the AI
  features (delete it after approval).

Before you submit, on the production Supabase project: run every `supabase-*.sql` file, deploy the `delete-account` function,
and check that Settings > Delete My Account works with a throw-away account.

## Part 6. Submit

Pick the build in each platform's version page > **Add for Review** > **Submit**. Review usually takes 1 to 3 days. If Apple
rejects something, the message names the guideline; `APP-STORE-CHECKLIST.md` section 3 covers each likely one.

For each update: raise the version in `package.json` (and the Build number in Xcode), then `npm run dist:mas` + Transporter for
the Mac, and `npm run ios:stage` + Archive for the iPhone.
