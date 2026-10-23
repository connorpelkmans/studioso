// electron-builder config for a signed Windows installer
const path = require("path");
const base = require(path.join(__dirname, "..", "package.json")).build;
const has = k => !!(process.env[k] && String(process.env[k]).trim());

const win = Object.assign({}, base.win);
if (["AZURE_TENANT_ID", "AZURE_CLIENT_ID", "AZURE_CLIENT_SECRET", "AZURE_SIGN_ENDPOINT", "AZURE_SIGN_ACCOUNT", "AZURE_SIGN_PROFILE", "WIN_PUBLISHER_NAME"].every(has)) {
  win.azureSignOptions = { publisherName: process.env.WIN_PUBLISHER_NAME, endpoint: process.env.AZURE_SIGN_ENDPOINT,
    codeSigningAccountName: process.env.AZURE_SIGN_ACCOUNT, certificateProfileName: process.env.AZURE_SIGN_PROFILE };
  console.log("  • Windows signing: Azure Trusted Signing");
} else if (has("WIN_CSC_LINK") || has("CSC_LINK")) {
  win.signtoolOptions = Object.assign({}, base.win && base.win.signtoolOptions, { signingHashAlgorithms: ["sha256"], rfc3161TimeStampServer: "http://timestamp.digicert.com" });
  console.log("  • Windows signing: certificate from WIN_CSC_LINK / CSC_LINK");
} else if (process.env.ALLOW_UNSIGNED_WINDOWS !== "1") {
  throw new Error("No Windows signing credentials in the environment (Azure Trusted Signing variables or WIN_CSC_LINK/CSC_LINK). See build-resources/electron-builder.win-signed.js.");
}

module.exports = Object.assign({}, base, { win });
