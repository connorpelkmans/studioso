// electron-builder hooks (package.json: build.afterSign and build.afterAllArtifactBuild both = "notarize.js", relative to the project folder).
// electron-builder calls the default export for each; it tells them apart by what it is handed (an app folder after signing, the list of
// finished files after the whole build).
//
//   Direct download (Developer ID, DMG):  signs with hardened runtime (electron-builder), then THIS script sends the app to Apple's
//                                          notary service, waits and staples the ticket to the .app (afterSign). When every file is built,
//                                          it sends each .dmg too and staples the ticket to it (afterAllArtifactBuild), so the DMG opens
//                                          without a network check on the first launch. electron-builder itself does neither (mac.notarize is off).
//   Mac App Store (mas, mas-dev):          no notarization step (Apple checks the upload in App Store Connect). This script only
//                                          checks that the placeholders in package.json were replaced, so a bad build fails early.
//   Unsigned / ad-hoc local builds:        skipped with a message, so `npm run dist:mac` keeps working without an Apple account.
//                                          Those builds are for testing on your own Mac only: other Macs refuse to open them (Gatekeeper).
//
// Credentials come from the environment only (never commit them, never print them). Either:
//   APPLE_API_KEY (path to the AuthKey_XXXX.p8 file), APPLE_API_KEY_ID, APPLE_API_ISSUER   <- recommended (App Store Connect API key)
//   APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID                                   <- app-specific password from appleid.apple.com
// Set REQUIRE_NOTARIZATION=1 (do this on the release job) to make a missing credential an error instead of a skip.
//
// `node notarize.js --check <target>` prints what is ready and what is missing for one kind of build, exit code 1 if something blocks it:
//   mas       Mac App Store package (build.mas, Studyboard_MAS.provisionprofile)        npm run check:store
//   mas-dev   Mac App Store development build (build.masDev, Studyboard_MASDev...)     npm run check:mas-dev
//   signed    Developer ID + notarized DMG (Apple credentials in the environment)      npm run check:signed
//   all       every one of the above
// @electron/notarize 3 is an ES module (Node 22.12+), so it is loaded with import().
const fs = require("fs"), path = require("path");

const has = k => !!(process.env[k] && String(process.env[k]).trim());
function credentials() {
  if (has("APPLE_API_KEY") && has("APPLE_API_KEY_ID") && has("APPLE_API_ISSUER"))
    return { kind: "App Store Connect API key", opts: { appleApiKey: process.env.APPLE_API_KEY, appleApiKeyId: process.env.APPLE_API_KEY_ID, appleApiIssuer: process.env.APPLE_API_ISSUER } };
  if (has("APPLE_ID") && has("APPLE_APP_SPECIFIC_PASSWORD") && has("APPLE_TEAM_ID"))
    return { kind: "Apple ID + app-specific password", opts: { appleId: process.env.APPLE_ID, appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD, teamId: process.env.APPLE_TEAM_ID } };
  return null;
}
// Project folder: this file sits next to package.json (flat repo) or in desktop/scripts/ (nested layout).
const ROOT = fs.existsSync(path.join(__dirname, "package.json")) ? __dirname : path.join(__dirname, "..");
const PLACEHOLDER = /REPLACE_WITH|PLACEHOLDER|TEAMID/i;

function readBuildConfig() {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).build || {}; } catch (e) { return {}; }
}
// Problems that would make Apple reject a Mac App Store upload.
function masProblems(cfg, which) {
  const out = [], c = (cfg[which] || {});
  const team = c.extendInfo && c.extendInfo.ElectronTeamID;
  if (!team || PLACEHOLDER.test(team)) out.push(`build.${which}.extendInfo.ElectronTeamID is still a placeholder (put your 10-character Apple Team ID)`);
  const prof = c.provisioningProfile && path.resolve(ROOT, c.provisioningProfile);
  if (!prof || !fs.existsSync(prof)) out.push(`provisioning profile not found: ${c.provisioningProfile || "(not set)"} (download it from developer.apple.com and put it there)`);
  for (const k of ["entitlements", "entitlementsInherit"]) {
    const f = c[k] && path.resolve(ROOT, c[k]);
    if (!f || !fs.existsSync(f)) out.push(`entitlements file missing: ${c[k] || k}`);
    else if (/<string>\s*(TEAM_ID|REPLACE_WITH)/.test(fs.readFileSync(f, "utf8"))) out.push(`${c[k]} still contains a TEAM_ID placeholder`);
  }
  return out;
}

const unsignedBuild = mac => mac.identity === "-" || mac.identity === null || (process.env.CSC_IDENTITY_AUTO_DISCOVERY === "false" && !has("CSC_LINK") && !has("CSC_NAME"));
async function notarizeFile(file, cred) {
  const { notarize } = await import("@electron/notarize");
  await notarize({ appPath: file, ...cred.opts });                  // sends the file, waits for Apple, then staples the ticket (xcrun stapler staple)
}

// afterSign: one app folder.
async function afterSign(context) {
  if (context.electronPlatformName !== "darwin") return;
  const names = (context.targets || []).map(t => t.name);
  const isMas = names.includes("mas") || names.includes("mas-dev");
  const cfg = readBuildConfig();
  if (isMas) {
    const bad = masProblems(cfg, names.includes("mas") ? "mas" : "masDev");
    if (bad.length) throw new Error("Mac App Store build is not ready:\n - " + bad.join("\n - "));
    console.log("  • Mac App Store build: notarization is not used (Apple reviews the upload); configuration checks passed");
    return;
  }
  const mac = context.packager.platformSpecificBuildOptions || {};
  const unsigned = unsignedBuild(mac);
  const cred = credentials();
  if (unsigned || !cred) {
    const why = unsigned ? "this build is not signed with a Developer ID certificate" : "no Apple credentials in the environment (APPLE_API_KEY* or APPLE_ID/APPLE_APP_SPECIFIC_PASSWORD/APPLE_TEAM_ID)";
    if (process.env.REQUIRE_NOTARIZATION === "1") throw new Error("Notarization is required but " + why);
    console.log("  • skipped notarization: " + why);
    return;
  }
  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(context.appOutDir, appName + ".app");
  console.log(`  • notarizing ${appName}.app with ${cred.kind} (this can take several minutes)`);
  await notarizeFile(appPath, cred);
  console.log("  • notarization accepted by Apple, ticket stapled to the app");
}

// afterAllArtifactBuild: every finished file. Only signed DMGs built on a Mac with credentials are sent; nothing else is touched.
async function afterAllArtifactBuild(result) {
  const dmgs = (result.artifactPaths || []).filter(f => /\.dmg$/i.test(f));
  if (!dmgs.length || process.platform !== "darwin") return [];
  const mac = (result.configuration && result.configuration.mac) || {};
  const cred = credentials();
  if (unsignedBuild(mac) || !cred) {
    if (process.env.REQUIRE_NOTARIZATION === "1") throw new Error("Notarization is required but " + (cred ? "the DMG is not from a Developer ID signed build" : "no Apple credentials are in the environment"));
    console.log("  • skipped DMG notarization (unsigned build or no Apple credentials)");
    return [];
  }
  for (const f of dmgs) {
    console.log(`  • notarizing ${path.basename(f)} with ${cred.kind}`);
    await notarizeFile(f, cred);
    console.log(`  • ${path.basename(f)} notarized and stapled`);
  }
  return [];                                                          // no extra files to publish
}

exports.default = async function notarizeHook(context) {
  if (context && Array.isArray(context.artifactPaths) && !context.appOutDir) return afterAllArtifactBuild(context);
  return afterSign(context);
};

// What each kind of build needs. Returns the list of problems that block it.
function targetProblems(cfg, target) {
  if (target === "mas") return masProblems(cfg, "mas");
  if (target === "mas-dev") return masProblems(cfg, "masDev");
  if (target === "signed") return credentials() ? [] : ["no Apple notarization credentials in the environment (APPLE_API_KEY + APPLE_API_KEY_ID + APPLE_API_ISSUER, or APPLE_ID + APPLE_APP_SPECIFIC_PASSWORD + APPLE_TEAM_ID)"];
  return null;
}

if (require.main === module) {
  const i = process.argv.indexOf("--check");
  const target = i >= 0 ? process.argv[i + 1] : undefined;
  const TARGETS = ["mas", "mas-dev", "signed"];
  if (i < 0 || !(TARGETS.includes(target) || target === "all")) {
    console.error("usage: node notarize.js --check mas | mas-dev | signed | all");
    process.exit(2);
  }
  const cfg = readBuildConfig();
  const lines = [], bad = [];
  const cred = credentials();
  lines.push(`Developer ID notarization credentials: ${cred ? "found (" + cred.kind + ")" : "NOT set (APPLE_API_KEY* or APPLE_ID + APPLE_APP_SPECIFIC_PASSWORD + APPLE_TEAM_ID)"}`);
  lines.push(`Developer ID certificate for signing: ${has("CSC_LINK") || has("CSC_NAME") ? "provided via CSC_LINK/CSC_NAME" : "none in env (the keychain is used when auto-discovery is on)"}`);
  for (const which of target === "all" ? TARGETS : [target]) {
    const p = targetProblems(cfg, which);
    lines.push(`${which}: ${p.length ? "NOT ready" : "ready"}`);
    p.forEach(x => { lines.push("    - " + x); bad.push(x); });
  }
  console.log(lines.join("\n"));
  process.exit(bad.length ? 1 : 0);
}
