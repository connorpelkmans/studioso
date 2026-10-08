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

## Each release

1. Bump `version` in `package.json` (and `VERSION` in `website/config.js`).
2. `git tag v1.13.0 && git push origin v1.13.0`. Actions builds, signs, notarizes, then uploads to
   `https://github.com/connorpelkmans/installers/releases/download/v1.13.0/<file>`.
3. Fill the links in `website/config.js` and redeploy the website:

```js
windows:  { ..., url: "https://github.com/connorpelkmans/installers/releases/download/v1.13.0/Studyboard-Setup-1.13.0.exe", ... },
macArm:   { ..., url: "https://github.com/connorpelkmans/installers/releases/download/v1.13.0/Studyboard-1.13.0-mac-universal.dmg", ... },
macIntel: { ..., url: "https://github.com/connorpelkmans/installers/releases/download/v1.13.0/Studyboard-1.13.0-mac-universal.dmg", ... },
```

Until a `url` is filled the button says "coming soon", so nothing 404s.

## Unsigned test builds

Actions > Build Studyboard desktop app > Run workflow > `unsigned` makes a Windows `.exe`, a Mac M-series `.dmg` and a Mac Intel `.dmg` as workflow artifacts only.
They trigger SmartScreen / Gatekeeper warnings, so they are for testing, not for the website.
