// ESLint flat config: catches real bugs (undefined names, duplicate keys, unreachable code, reassigned consts), not style.
// Run: npm run lint   (this file for the .js sources, then scripts/lint-inline.js for the inline <script> blocks in index.html)
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
  "no-sequences": "off",          // the codebase uses comma expressions on purpose
  "no-unused-vars": "off",        // noisy on purpose-built one-liners; not a bug finder here
};

// Tests reach into the page from page.evaluate(): allow the page's own globals and the window.X stubs the tests install themselves.
function testGlobals() {
  const g = {};
  try { for (const n of appGlobals(fs.readFileSync(path.join(__dirname, "index.html"), "utf8"))) g[n] = "writable"; } catch (e) { /* no index.html */ }
  const walk = d => fs.readdirSync(d, {withFileTypes: true}).forEach(e => {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f);
    else if (/\.js$/.test(e.name)) for (const m of fs.readFileSync(f, "utf8").matchAll(/\bwindow\.([A-Za-z_$][\w$]*)\s*=(?!=)/g)) g[m[1]] = "writable";
  });
  try { walk(path.join(__dirname, "tests")); } catch (e) { /* no tests */ }
  for (const n of Object.keys(g)) if (n in globals.node || n in globals.browser) delete g[n];
  return g;
}

module.exports = [
  {ignores: ["node_modules/**", "dist/**", "app/**", "build/**", "widget/**", "site/**", "ios-www/**", "tests-out/**",
    "vendor/**", "website/vendor/**", "**/*.min.js", "android-wrapper/**", "ios-wrapper/**", "supabase-functions/**", "index*.ts"]},
  // Electron main process and Node build/tooling scripts
  {
    files: ["main.js", "prepare.js", "make-headers.js", "notarize.js", "build-id.js", "scripts/**/*.js", "eslint.config.js", "build-resources/**/*.js"],
    languageOptions: {ecmaVersion: 2024, sourceType: "commonjs", globals: {...globals.node}},
    rules: bugRules,
  },
  // Electron preloads, and lms.js (main process, but some of its functions are sent into the school's pages to run there)
  {
    files: ["preload.js", "widget-preload.js", "shot-preload.js", "lms.js"],
    languageOptions: {ecmaVersion: 2024, sourceType: "commonjs", globals: {...globals.node, ...globals.browser}},
    rules: bugRules,
  },
  // Renderer pages loaded with <script src>: widget and screenshot overlays, the marketing site
  {
    files: ["widget.js", "shot.js", "website/**/*.js"],
    languageOptions: {ecmaVersion: 2024, sourceType: "script", globals: {...globals.browser, supabase: "readonly", SITE_CONFIG: "readonly"}},
    rules: bugRules,
  },
  // Service worker
  {
    files: ["sw.js"],
    languageOptions: {ecmaVersion: 2024, sourceType: "script", globals: {...globals.serviceworker}},
    rules: bugRules,
  },
  // Tests run under Node; page.evaluate() callbacks run in the browser, so browser globals are allowed too
  {
    files: ["tests/**/*.js"],
    languageOptions: {ecmaVersion: 2024, sourceType: "commonjs", globals: {...globals.node, ...globals.browser, ...testGlobals()}},
    rules: bugRules,
  },
];
module.exports.bugRules = bugRules;
