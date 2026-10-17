# Released versions

The exact files of each version of Studyboard School Sync sent to a store, unpacked. `tests/extension-released.e2e.js` checks every version here against the website as it is now, so a change to the website can't break a version that's in review or still installed.

| Version | Sent to | Chrome zip SHA-256 |
|---|---|---|
| 1.0.2 | Chrome Web Store (to be submitted) | `e70d8a6f6e589360b60ab33cc95a18c9d4aeb146c8c61f6f89e76837f34eddae` |

1.0.0 was withdrawn from review before it was published, so it isn't kept here. If 1.0.2's upload ever differs from this folder (a rebuild before submitting), replace the folder and the SHA-256 before it's sent, and never after.

Never change a folder here. For each new version sent to a store: build it (`npm run build:extension`), copy `extension/build/chrome` to `extension/released/<version>`, and add a row.
