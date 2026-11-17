# Publishing the desktop installers (signed) and linking the website buttons

This repo is private, so its own Releases can't be downloaded by visitors. Installers are published as GitHub Releases in the public repo `connorpelkmans/installers` (Supabase's free plan caps files at 50 MB, too small for the installers).
Mac builds can only be made on macOS, so everything is built by GitHub Actions (`.github/workflows/build-desktop.yml`) when you push a `v*` tag.

## One-time setup

1. **Public repo.** `connorpelkmans/installers` (public, with a README).
2. **Token.** GitHub > Settings > Developer settings > Fine-grained tokens: only `connorpelkmans/installers`, Contents: read and write. Save it in this repo as the Actions secret `RELEASES_TOKEN`.
3. **Mac signing** (Apple Developer Program, $99/yr). Secrets: `CSC_LINK` (Developer ID Application cert as base64 `.p12`), `CSC_KEY_PASSWORD`,
   `APPLE_API_KEY_BASE64` (App Store Connect API key `.p8`, base64), `APPLE_API_KEY_ID`, `APPLE_API_ISSUER`.
   Steps are in `APP-STORE-CHECKLIST.md` section 1. Base64 a file with `base64 -i cert.p12 | pbcopy`.
   One universal DMG (`Studyboard-<version>-mac-universal.dmg`) runs on both M-series and Intel Macs, so both website Mac buttons point at it.
4. **Windows signing** (pick one):
   * *Azure Trusted Signing* (recommended, about $10/mo): secrets `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_SIGN_ENDPOINT`, `AZURE_SIGN_ACCOUNT`, `AZURE_SIGN_PROFILE`, `WIN_PUBLISHER_NAME`.
   * *A code-signing certificate* (.pfx from a CA): secrets `WIN_CSC_LINK` (base64 .pfx) and `WIN_CSC_KEY_PASSWORD`.
   Without either, the release has no Windows installer.

## Each release (automatic for the Mac)

1. Bump `version` in `package.json` (and `VERSION` in `website/config.js`, `APP_VERSION` in `src/js/49-feedback.js` and `src/js/49-errreport.js`, `VERSION` in `src/js/99-release.js`, the website footers).
2. `git tag v1.15.8 && git push origin v1.15.8`. Actions runs lint and the tests, builds, signs and notarizes the universal DMG, then uploads it to
   `https://github.com/connorpelkmans/installers/releases/download/v1.15.8/<file>`, **plus a copy named `Studyboard-mac-universal.dmg`**, and marks that release *latest*.
3. Nothing else for the Mac: the website's Mac buttons link to
   `https://github.com/connorpelkmans/installers/releases/latest/download/Studyboard-mac-universal.dmg`, which always serves the newest signed DMG
   (unsigned test builds are published as pre-releases, so they never become *latest*). The website only needs deploying once, for this link change.

Before the automatic links, each release changed the links by hand (still how the Windows `.exe` link works, if Windows signing is set up):

```js
windows:  { ..., url: "https://github.com/connorpelkmans/installers/releases/download/v1.13.0/Studyboard-Setup-1.13.0.exe", ... },
macArm:   { ..., url: "https://github.com/connorpelkmans/installers/releases/download/v1.13.0/Studyboard-1.13.0-mac-universal.dmg", ... },
macIntel: { ..., url: "https://github.com/connorpelkmans/installers/releases/download/v1.13.0/Studyboard-1.13.0-mac-universal.dmg", ... },
```

Until a `url` is filled the button says "coming soon", so nothing 404s.

## Unsigned test builds

Actions > Build Studyboard desktop app > Run workflow > `unsigned` makes a Windows `.exe`, a Mac M-series `.dmg` and a Mac Intel `.dmg` as workflow artifacts only.
They trigger SmartScreen / Gatekeeper warnings, so they are for testing, not for the website.
