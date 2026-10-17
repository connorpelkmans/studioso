#!/bin/bash
# Makes the Safari version of Studyboard School Sync: an Xcode project with a small Mac app and iPhone/iPad app that carry the extension.
# Run on a Mac with Xcode installed (free from the App Store):   bash scripts/make-safari-app.sh
# Then open extension/safari-app/Studyboard School Sync/Studyboard School Sync.xcodeproj in Xcode.
# The project points at extension/build/safari/ rather than copying it, so after a change: run `node scripts/build-extension.js` and
# build again in Xcode. Run this script again only to start the project over (it asks first; your signing settings would be lost).
set -euo pipefail
cd "$(dirname "$0")/.."
if [ "$(uname)" != "Darwin" ]; then echo "This needs a Mac with Xcode (Safari extensions are built with Apple's tools)." >&2; exit 1; fi
if ! xcrun --find safari-web-extension-converter >/dev/null 2>&1; then
  echo "Xcode's Safari converter wasn't found. Install Xcode from the App Store, open it once, then run: sudo xcode-select -s /Applications/Xcode.app" >&2; exit 1
fi
node scripts/build-extension.js
OUT="extension/safari-app"
if [ -d "$OUT" ]; then
  read -r -p "$OUT already exists. Start the Xcode project over? Your signing settings in it will be lost. [y/N] " a
  [ "$a" = "y" ] || [ "$a" = "Y" ] || { echo "Left as it is. To pick up changes, just build again in Xcode."; exit 0; }
  rm -rf "$OUT"
fi
# The bundle identifier is permanent once the app is in the App Store; the extension inside gets <it>.Extension
xcrun safari-web-extension-converter extension/build/safari \
  --project-location "$OUT" \
  --app-name "Studyboard School Sync" \
  --bundle-identifier "com.studyboardapp.SchoolSync" \
  --swift --no-open --no-prompt
echo
echo "Done. Next:"
echo "  1. open \"$OUT/Studyboard School Sync/Studyboard School Sync.xcodeproj\""
echo "  2. In Xcode pick the 'Studyboard School Sync (macOS)' scheme and press Run. Your free Apple ID works for this (Signing & Capabilities, Team)."
echo "  3. In Safari: Settings > Advanced > Show features for web developers; then Develop > Allow Unsigned Extensions (needed again after Safari restarts)."
echo "  4. Safari > Settings > Extensions: turn on Studyboard School Sync. See extension/README.md, 'Safari'."
