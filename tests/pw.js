// Shared Playwright loader for the browser tests (*.e2e.js, *.pw.js). Not a test itself.
// Playwright module: $PLAYWRIGHT_MODULE / $PW_MODULE, else require("playwright") (repo devDependency), else /opt/node-tools (this repo's dev image).
// Chromium binary:   $PLAYWRIGHT_CHROMIUM_EXECUTABLE / $CHROMIUM_PATH / $PW_CHROMIUM, else /opt/pw-browsers/chromium when it exists,
//                    else undefined so Playwright uses its own browser (e.g. after `npx playwright install chromium` in CI).
const fs = require("fs");

const FALLBACK_MODULE = "/opt/node-tools/node_modules/playwright";
const FALLBACK_CHROMIUM = "/opt/pw-browsers/chromium";

function loadPlaywright() {
  const override = process.env.PLAYWRIGHT_MODULE || process.env.PW_MODULE;
  if (override) return require(override);
  try { return require("playwright"); } catch (e) {
    if (e.code !== "MODULE_NOT_FOUND") throw e;
    return require(FALLBACK_MODULE);
  }
}

function chromiumExecutable() {
  const env = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || process.env.CHROMIUM_PATH || process.env.PW_CHROMIUM;
  if (env) return env;
  return fs.existsSync(FALLBACK_CHROMIUM) ? FALLBACK_CHROMIUM : undefined;
}

const playwright = loadPlaywright();
module.exports = {playwright, chromium: playwright.chromium, executablePath: chromiumExecutable()};
