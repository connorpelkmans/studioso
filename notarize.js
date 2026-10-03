// electron-builder "afterSign" hook (package.json: build.afterSign = "scripts/notarize.js"). Lives next to prepare.js
// (in the repo's intended layout both are in desktop/scripts/).
//
//   Direct download (Developer ID, DMG):  signs with hardened runtime (electron-builder), then THIS script sends the app to Apple's
//                                          notary service and waits. electron-builder staples the ticket to the DMG afterwards.
//   Mac App Store (mas, mas-dev):          no notarization step (Apple checks the upload in App Store Connect). This script only
//                                          checks that the placeholders in package.json were replaced, so a bad build fails early.
//   Unsigned / ad-hoc local builds:        skipped with a message, so `npm run dist:mac` keeps working without an Apple account.
//
// Credentials come from the environment only (never commit them, never print them). Either:
//   APPLE_API_KEY (path to the AuthKey_XXXX.p8 file), APPLE_API_KEY_ID, APPLE_API_ISSUER   <- recommended (App Store Connect API key)
//   APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID                                   <- app-specific password from appleid.apple.com
// Set REQUIRE_NOTARIZATION=1 (do this on the release job) to make a missing credential an error instead of a skip.
//
// `node scripts/notarize.js --check` prints what is ready and what is missing (exit code 1 if something blocks a store build).
const fs = require("fs"), path = require("path");

const has = k => !!(process.env[k] && String(process.env[k]).trim());
function credentials() {
  if (has("APPLE_API_KEY") && has("APPLE_API_KEY_ID") && has("APPLE_API_ISSUER"))
    return { kind: "App Store Connect API key", opts: { appleApiKey: process.env.APPLE_API_KEY, appleApiKeyId: process.env.APPLE_API_KEY_ID, appleApiIssuer: process.env.APPLE_API_ISSUER } };
  if (has("APPLE_ID") && has("APPLE_APP_SPECIFIC_PASSWORD") && has("APPLE_TEAM_ID"))
    return { kind: "Apple ID + app-specific password", opts: { appleId: process.env.APPLE_ID, appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD, teamId: process.env.APPLE_TEAM_ID } };
  return null;
}
const PLACEHOLDER = /REPLACE_WITH|PLACEHOLDER|TEAMID/i;

function readBuildConfig() {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8")).build || {}; } catch (e) { return {}; }
}
// Problems that would make Apple reject a Mac App Store upload.
function masProblems(cfg, which) {
  const out = [], c = (cfg[which] || {});
  const team = c.extendInfo && c.extendInfo.ElectronTeamID;
  if (!team || PLACEHOLDER.test(team)) out.push(`build.${which}.extendInfo.ElectronTeamID is still a placeholder (put your 10-character Apple Team ID)`);
  const prof = c.provisioningProfile && path.resolve(__dirname, "..", c.provisioningProfile);
  if (!prof || !fs.existsSync(prof)) out.push(`provisioning profile not found: ${c.provisioningProfile || "(not set)"} (download it from developer.apple.com and put it there)`);
  for (const k of ["entitlements", "entitlementsInherit"]) {
    const f = c[k] && path.resolve(__dirname, "..", c[k]);
    if (!f || !fs.existsSync(f)) out.push(`entitlements file missing: ${c[k] || k}`);
    else if (/<string>\s*(TEAM_ID|REPLACE_WITH)/.test(fs.readFileSync(f, "utf8"))) out.push(`${c[k]} still contains a TEAM_ID placeholder`);
  }
  return out;
}

exports.default = async function notarizeHook(context) {
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
  const unsigned = mac.identity === "-" || mac.identity === null || (process.env.CSC_IDENTITY_AUTO_DISCOVERY === "false" && !has("CSC_LINK") && !has("CSC_NAME"));
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
  const { notarize } = require("@electron/notarize");
  await notarize({ appPath, ...cred.opts });
  console.log("  • notarization accepted by Apple");
};

if (require.main === module) {
  const cfg = readBuildConfig();
  const lines = [], bad = [];
  const cred = credentials();
  lines.push(`Developer ID notarization credentials: ${cred ? "found (" + cred.kind + ")" : "NOT set (APPLE_API_KEY* or APPLE_ID + APPLE_APP_SPECIFIC_PASSWORD + APPLE_TEAM_ID)"}`);
  lines.push(`Developer ID certificate for signing: ${has("CSC_LINK") || has("CSC_NAME") ? "provided via CSC_LINK/CSC_NAME" : "none in env (the keychain is used when auto-discovery is on)"}`);
  for (const which of ["mas", "masDev"]) {
    const p = masProblems(cfg, which);
    lines.push(`${which}: ${p.length ? "NOT ready" : "ready"}`);
    p.forEach(x => { lines.push("    - " + x); bad.push(x); });
  }
  console.log(lines.join("\n"));
  process.exit(bad.length ? 1 : 0);
}
