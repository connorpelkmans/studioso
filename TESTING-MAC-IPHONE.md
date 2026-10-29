# Testing Studyboard on a Mac and an iPhone

Everything below runs on your Mac. You need:
- **Node.js 22**, from nodejs.org.
- **Git**: run `xcode-select --install` in Terminal if it isn't installed.
- For the iPhone: **Xcode**, from the Mac App Store, and a USB cable.

First, get the code:

```bash
git clone https://github.com/connorpelkmans/studioso.git
cd studioso
git checkout main
npm ci
```

---

## Mac

### Quickest: run it straight from the code
```bash
npm start
```
The desktop app opens, the same app you'd install. Quit it with ⌘Q. After pulling new changes, run `npm start` again.

### As an installed app (.dmg)
```bash
npm run dist:mac          # Apple silicon (M1 and later)
npm run dist:mac-intel    # Intel Macs
```
The .dmg appears in `dist/`. Open it and drag Studyboard into Applications.

This build is signed only for your own Mac, not with an Apple Developer ID. If macOS says it "can't be opened", either:
- right-click Studyboard in Applications and choose **Open**, then **Open** again; or
- run `xattr -cr /Applications/Studyboard.app`.

Other people's Macs will warn about it. For builds you can share, use the signed build in `RELEASE-CHECKLIST.md`, which needs the paid Apple Developer Program.

### What to check on the Mac
- Sign in, then check that your data syncs.
- Notes: the full-screen button, Archive and Trash, and dragging stickers.
- Whiteboard: drawing, full screen, and dark board.
- Lecture recording: macOS asks for microphone access.
- Export a file and check it lands in Downloads.
- Your companion, including Cosmo if your account has all-themes access.

---

## iPhone

The iPhone app wraps the same web app in a native shell (Capacitor). Full details are in `ios-wrapper/README-IOS.md`. These are the short steps for a first test on your own phone.

### 1. Stage the app's web files
```bash
npm run ios:stage
```
This builds the iPhone copy of the app into `ios-wrapper/ios-www/` and adds the native bridge, which handles Keychain sign-in storage, links and sharing. Run it again after every change.

### 2. One time only: create the Xcode project
```bash
cd ios-wrapper
npm init -y
npm i @capacitor/core @capacitor/ios @capacitor/app @capacitor/browser @capacitor/push-notifications \
      @capacitor/share @capacitor/filesystem @capacitor/screen-orientation capacitor-secure-storage-plugin @revenuecat/purchases-capacitor
npm i -D @capacitor/cli
npx cap add ios
cd ..
npm run ios:stage          # stages again and now also syncs into the Xcode project
```
Then copy in the app's settings, as described in README-IOS.md section 3: the privacy manifest and the native files in `ios-wrapper/native/`. (The Info.plist keys, like the camera and photo reasons, are added by `npm run ios:stage`.)

### 3. Run it on your iPhone
1. `cd ios-wrapper && npx cap open ios`. Xcode opens.
2. Plug in your iPhone and unlock it. On the phone, turn on **Settings > Privacy & Security > Developer Mode**; it restarts.
3. In Xcode, select the **App** target, then **Signing & Capabilities**, then **Team**:
   - With a **free Apple ID**, choose your "Personal Team". Change the bundle identifier to something unique, such as `com.yourname.studyboard.test`. Remove the Push Notifications, App Groups and Associated Domains capabilities if they're listed, because free teams can't use them.
   - With the **paid Developer Program**, choose your team and keep `com.studioso.app`.
4. Choose your iPhone at the top of Xcode and press **Run** (▶).
5. If you used a free account, the first launch says "Untrusted Developer". On the phone, go to **Settings > General > VPN & Device Management**, tap your Apple ID, then **Trust**.

Free-account builds stop opening after 7 days; press Run again to renew. Skip the optional Siri, widget and Dynamic Island parts (README-IOS.md 3b and 3c) for a first test.

### 4. Testers other than you (TestFlight)
TestFlight needs the paid Apple Developer Program ($99 a year):
1. In Xcode, **Product > Archive**, then in the Organizer **Distribute App > App Store Connect > Upload**.
2. Open App Store Connect, go to your app, then **TestFlight**, and add testers by email.
3. Testers install the TestFlight app on their iPhone and accept the invite.

`APP-STORE-CHECKLIST.md` lists what Apple's review needs later on.

### What to check on the iPhone
- Sign in, close the app fully, and reopen it. You should still be signed in, because the session is kept in the Keychain.
- The bottom tabs, the companion, and swiping between screens.
- Notes on a phone: Archive and Trash at the top, and the full-screen button.
- Whiteboard: drawing with a finger, two-finger zoom, and full screen.
- Links open in an in-app Safari sheet, and sharing opens the iPhone share sheet.
- Dark mode, and both portrait and landscape.
- Buying Pro uses In-App Purchase. It only works once RevenueCat is set up (README-IOS.md section 7). Skip this for a first test.
