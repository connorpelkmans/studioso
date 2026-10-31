// Archives the iPhone app and uploads it to App Store Connect from Terminal (the same as Xcode's Product > Archive, then
// Distribute App > App Store Connect > Upload), printing any error plainly.
//
//   npm run ios:upload -- <Team ID>
//
// Needs: Xcode signed in to your Apple account (Xcode > Settings > Accounts), the app created in App Store Connect with
// bundle ID com.studyboardapp.studyboard, and npm run ios:stage run first. The build number goes up by one each upload.
const {execFileSync} = require("child_process"), fs = require("fs"), path = require("path"), os = require("os");
const team = process.argv[2];
if (!/^[A-Z0-9]{10}$/.test(team || "")) { console.error("Usage: npm run ios:upload -- <Team ID>   (10 characters, top right of developer.apple.com/account)"); process.exit(1); }
const app = path.join(__dirname, "..", "ios-wrapper", "ios", "App");
const proj = path.join(app, "App.xcodeproj");
if (!fs.existsSync(proj)) { console.error("No Xcode project at " + proj + ". Run npm run ios:stage first."); process.exit(1); }
const work = fs.mkdtempSync(path.join(os.tmpdir(), "studyboard-upload-"));
const archive = path.join(work, "Studyboard.xcarchive"), opts = path.join(work, "ExportOptions.plist");
const build = String(Math.floor(Date.now() / 60000));   // always higher than the last upload
fs.writeFileSync(opts, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>method</key><string>app-store-connect</string>
  <key>destination</key><string>upload</string>
  <key>signingStyle</key><string>automatic</string>
  <key>teamID</key><string>${team}</string>
  <key>uploadSymbols</key><true/>
  <key>manageAppVersionAndBuildNumber</key><false/>
</dict></plist>
`);
const run = (args, what) => {
  console.log("\n▶ " + what + "…");
  try { execFileSync("xcodebuild", args, {stdio: "inherit"}); }
  catch (e) { console.error("\n✗ " + what + " failed. The error is a few lines above (look for \"error:\")."); process.exit(1); }
};
run(["-project", proj, "-scheme", "App", "-configuration", "Release", "-destination", "generic/platform=iOS", "-archivePath", archive,
     "-allowProvisioningUpdates", `DEVELOPMENT_TEAM=${team}`, `CURRENT_PROJECT_VERSION=${build}`, "archive", "-quiet"], "Archiving (a few minutes)");
run(["-exportArchive", "-archivePath", archive, "-exportOptionsPlist", opts, "-exportPath", path.join(work, "export"), "-allowProvisioningUpdates"], "Uploading to App Store Connect");
console.log("\n✓ Uploaded (build " + build + "). It appears in App Store Connect > your app > TestFlight in 10 to 30 minutes.");
