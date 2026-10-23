// ESLint flat config: catches real bugs (undefined names, duplicate keys, unreachable code, reassigned consts), not style.
// Run: npm run lint
"use strict";
const fs = require("fs"), path = require("path"), globals = require("globals");
const {appGlobals} = require("./scripts/lint-inline");

const bugRules = {
  "no-undef": "error",
  "no-dupe-keys": "error",
  "no-dupe-args": "error",
  "no-dupe-class-members": "error",
  "no-duplicate-case": "error",
  "no-unreachable": "error",
  "no-redeclare": "error",
  "no-const-assign": "error",
  "no-func-assign": "error",
  "no-import-assign": "error",
  "no-class-assign": "error",
  "no-self-assign": "error",
  "no-unsafe-negation": "error",
  "no-unsafe-finally": "error",
  "no-obj-calls": "error",
  "no-invalid-regexp": "error",
  "use-isnan": "error",
  "valid-typeof": "error",
  "no-compare-neg-zero": "error",
  "no-cond-assign": ["error", "except-parens"],
  "getter-return": "error",
  "no-setter-return": "error",
  "for-direction": "error",
  "no-sparse-arrays": "warn",
  "no-sequences": "off",
  "no-unused-vars": "off",
};

// Tests reach into the page from page.evaluate()
function testGlobals() {
  const g = {};
  try { for (const n of require("./scripts/lint-inline").splitGlobals()) g[n] = "writable"; } catch (e) { }
  const walk = d => fs.readdirSync(d, {withFileTypes: true}).forEach(e => {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f);
    else if (/\.js$/.test(e.name)) {
      const src = fs.readFileSync(f, "utf8");
      for (const m of src.matchAll(/\bwindow\.([A-Za-z_$][\w$]*)\s*=(?!=)/g)) g[m[1]] = "writable";
      for (const m of src.matchAll(/\bObject\.defineProperty\(\s*window\s*,\s*["']([A-Za-z_$][\w$]*)["']/g)) g[m[1]] = "writable";
    }
  });
  try { walk(path.join(__dirname, "tests")); } catch (e) { }
  for (const n of Object.keys(g)) if (n in globals.node || n in globals.browser) delete g[n];
  return g;
}

module.exports = [
  {ignores: ["src/js/**", "bundle/**", "node_modules/**", "dist/**", "app/**", "build/**", "widget/**", "site/**", "ios-www/**", "tests-out/**",
    "vendor/**", "website/vendor/**", "extension/build/**", "extension/dist/**", "extension/released/**", "**/*.min.js", "android-wrapper/**", "ios-wrapper/**", "supabase-functions/**", "index*.ts"]},
  // Electron main process and Node build/tooling scripts
  {
    files: ["main.js", "prepare.js", "make-headers.js", "notarize.js", "build-id.js", "scripts/**/*.js", "eslint.config.js", "build-resources/**/*.js"],
    languageOptions: {ecmaVersion: 2024, sourceType: "commonjs", globals: {...globals.node}},
    rules: bugRules,
  },
  // Electron preloads, and lms.js
  {
    files: ["preload.js", "widget-preload.js", "shot-preload.js", "lms.js"],
    languageOptions: {ecmaVersion: 2024, sourceType: "commonjs", globals: {...globals.node, ...globals.browser}},
    rules: bugRules,
  },
  // Renderer pages loaded with <script src>
  {
    files: ["widget.js", "shot.js", "website/**/*.js"],
    // SCN20 and COMP_DATA are declared by scenes-lib.js and companions-data.js
    languageOptions: {ecmaVersion: 2024, sourceType: "script", globals: {...globals.browser, supabase: "readonly", SITE_CONFIG: "readonly", SCN20: "readonly", COMP_DATA: "readonly"}},
    rules: bugRules,
  },
  // The app's scene and companion code, copied unchanged by tools/make-website-assets.py
  {
    files: ["website/assets/scenes-lib.js", "website/assets/companions-engine.js", "website/assets/companions-data.js"],
    rules: {"no-redeclare": "off", "no-self-assign": "warn"},
  },
  // The browser extension (extension/src)
  {
    files: ["extension/src/**/*.js"],
    languageOptions: {ecmaVersion: 2024, sourceType: "script", globals: {...globals.browser, ...globals.serviceworker, ...globals.webextensions}},
    rules: bugRules,
  },
  // Service worker
  {
    files: ["sw.js"],
    languageOptions: {ecmaVersion: 2024, sourceType: "script", globals: {...globals.serviceworker}},
    rules: bugRules,
  },
  // Tests run under Node; page.evaluate() callbacks run in the browser
  {
    files: ["tests/**/*.js"],
    languageOptions: {ecmaVersion: 2024, sourceType: "commonjs", globals: {...globals.node, ...globals.browser, ...testGlobals()}},
    // a test's own /* global ... */ comment may name a page global another test also exposes
    rules: {...bugRules, "no-redeclare": ["error", {builtinGlobals: false}]},
  },
];
module.exports.bugRules = bugRules;
