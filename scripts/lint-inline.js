#!/usr/bin/env node
// Lints the inline <script> blocks of index.html (or the HTML files given) with ESLint's bug-finding rules, no-undef above all.
//   node scripts/lint-inline.js [file.html ...]       exit 1 on any error; line numbers are the HTML file's own
// All inline scripts of a page share one global scope, so each block may use what the others declare at top level or put on window.
// Browser globals, the page's own globals and a short list of libraries loaded at run time are allowed; anything else is reported.
// Also exports appGlobals(html) for eslint.config.js (the tests call the page's globals inside page.evaluate()).
"use strict";
const fs = require("fs"), path = require("path");

const ROOT = path.join(__dirname, "..");
// Loaded at run time by <script src> or a lazy loader, not declared in the inline scripts.
const RUNTIME_GLOBALS = ["supabase", "pdfjsLib", "Tesseract", "JSZip", "mammoth", "marked", "DOMPurify", "katex", "Sentry", "webkit", "chrome", "Capacitor", "AndroidBridge"];

// <script> blocks without src (or with an inline type), with the line each starts on.
function inlineScripts(html) {
  const out = [], re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1];
    if (/\bsrc\s*=/i.test(attrs)) continue;
    const type = (attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i) || [])[1];
    if (type && !/^(text\/javascript|application\/javascript|module)$/i.test(type)) continue;   // JSON, templates, etc.
    const bodyStart = m.index + m[0].indexOf(">") + 1;
    const line = html.slice(0, bodyStart).split("\n").length;            // 1-based line of the first character of the body
    const col = bodyStart - html.lastIndexOf("\n", bodyStart - 1) - 1;   // 0-based column of that character
    out.push({code: m[2], line, col, module: /^module$/i.test(type || "")});
  }
  return out;
}

// Names a script declares at its top level (they become globals shared with the page's other classic scripts).
function topLevelNames(code, module) {
  const espree = require("espree");
  let ast;
  try { ast = espree.parse(code, {ecmaVersion: "latest", sourceType: module ? "module" : "script"}); } catch (e) { return []; }
  const names = [];
  const pat = p => {
    if (!p) return;
    if (p.type === "Identifier") names.push(p.name);
    else if (p.type === "ObjectPattern") p.properties.forEach(q => pat(q.type === "RestElement" ? q.argument : q.value));
    else if (p.type === "ArrayPattern") p.elements.forEach(pat);
    else if (p.type === "AssignmentPattern") pat(p.left);
    else if (p.type === "RestElement") pat(p.argument);
  };
  for (const n of ast.body) {
    if ((n.type === "FunctionDeclaration" || n.type === "ClassDeclaration") && n.id) names.push(n.id.name);
    else if (n.type === "VariableDeclaration") n.declarations.forEach(d => pat(d.id));
  }
  return names;
}

// Every global the page defines: top-level declarations of its classic inline scripts plus window.X / globalThis.X / self.X assignments.
function appGlobals(html) {
  const set = new Set();
  for (const s of inlineScripts(html)) if (!s.module) topLevelNames(s.code, false).forEach(n => set.add(n));
  for (const m of html.matchAll(/\b(?:window|globalThis|self)\.([A-Za-z_$][\w$]*)\s*=(?!=)/g)) set.add(m[1]);
  for (const m of html.matchAll(/\b(?:window|globalThis)\[["']([A-Za-z_$][\w$]*)["']\]\s*=(?!=)/g)) set.add(m[1]);
  return set;
}

async function lintFile(file, eslint) {
  const html = fs.readFileSync(file, "utf8");
  const scripts = inlineScripts(html), shared = appGlobals(html);
  RUNTIME_GLOBALS.forEach(n => shared.add(n));
  const results = [];
  for (const s of scripts) {
    // A script's own declarations are not "globals" for it (that would trip no-redeclare).
    const own = new Set(s.module ? [] : topLevelNames(s.code, false));
    const g = {};
    for (const n of shared) if (!own.has(n)) g[n] = "writable";
    // Pad with newlines and spaces so ESLint's line:column positions are the HTML file's own.
    const text = "\n".repeat(s.line - 1) + " ".repeat(s.col) + s.code;
    const [r] = await eslint.lintText(text, {filePath: path.join(ROOT, "index.inline.js")});
    // lintText can't take per-call globals, so filter no-undef here against the page's globals instead.
    r.messages = r.messages.filter(msg => !(msg.ruleId === "no-undef" && g[(msg.message.match(/^'(.+)' is not defined/) || [])[1]]));
    r.errorCount = r.messages.filter(x => x.severity === 2).length; r.warningCount = r.messages.filter(x => x.severity === 1).length;
    r.fatalErrorCount = r.messages.filter(x => x.fatal).length;
    r.filePath = path.resolve(file); r.source = undefined;
    results.push(r);
  }
  // Merge the blocks into one result per HTML file.
  return results.reduce((a, r) => (a.messages.push(...r.messages), a.errorCount += r.errorCount, a.warningCount += r.warningCount, a.fatalErrorCount += r.fatalErrorCount, a),
    {filePath: path.resolve(file), messages: [], errorCount: 0, warningCount: 0, fatalErrorCount: 0, fixableErrorCount: 0, fixableWarningCount: 0, suppressedMessages: [], usedDeprecatedRules: []});
}

async function main() {
  const {ESLint} = require("eslint"), globals = require("globals");
  const files = process.argv.slice(2).length ? process.argv.slice(2) : [path.join(ROOT, "index.html")];
  const cfg = require(path.join(ROOT, "eslint.config.js"));
  const bugRules = cfg.bugRules;
  const eslint = new ESLint({cwd: ROOT, overrideConfigFile: true, overrideConfig: [{
    files: ["**/*.js"],
    languageOptions: {ecmaVersion: "latest", sourceType: "script", globals: {...globals.browser}},
    linterOptions: {reportUnusedDisableDirectives: "off"},
    rules: Object.assign({}, bugRules, {
      "no-func-assign": "off",   // the page extends its own functions on purpose: render = (o => function(){ ...; o(); })(render)
      "no-redeclare": "off",     // only function-scoped var reuse in the drawing code (var p in two loops); let/const redeclares are syntax errors anyway
      "no-self-assign": "warn",  // a few no-op "x = x" lines: worth a look, not a broken page
    }),
  }]});
  const results = [];
  for (const f of files) results.push(await lintFile(f, eslint));
  const out = (await eslint.loadFormatter("stylish")).format(results);
  if (out) console.log(out);
  const errors = results.reduce((n, r) => n + r.errorCount, 0);
  if (!errors) console.log(`lint-inline: ${files.map(f => path.relative(ROOT, f)).join(", ")} clean`);
  process.exit(errors ? 1 : 0);
}

module.exports = {inlineScripts, topLevelNames, appGlobals};
if (require.main === module) main().catch(e => { console.error(e); process.exit(2); });
