# Released versions

The exact files of each version of Studyboard School Sync sent to a store, unpacked. `tests/extension-released.e2e.js` checks every version here against the website as it is now, so a change to the website can't break a version that's in review or still installed.

| Version | Sent to | Chrome zip SHA-256 |
|---|---|---|
| 1.0.2 | Chrome Web Store (to be submitted) | `161b76691d83a0a86d61dbb4303afe2a5ae483bfe9a66b9e427e8f0c5f96cc30` |

1.0.0 was withdrawn from review before it was published, so it isn't kept here. If 1.0.2's upload ever differs from this folder (a rebuild before submitting), replace the folder and the SHA-256 before it's sent, and never after.

Never change a folder here. For each new version sent to a store: build it (`npm run build:extension`), copy `extension/build/chrome` to `extension/released/<version>`, and add a row.
