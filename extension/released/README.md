# Released versions

The exact files of each version of Studyboard School Sync sent to a store, unpacked. `tests/extension-released.e2e.js` checks every version here against the website as it is now, so a change to the website can't break a version that's in review or still installed.

| Version | Sent to | From commit | Chrome zip SHA-256 |
|---|---|---|---|
| 1.0.0 | Chrome Web Store (in review) | 04b56d5 | `be750fdd920dc46029d366a15028fd919adaa7b42e6c2f6db4741b8a9f49429a` |

Never change a folder here. For each new version sent to a store: build it (`npm run build:extension`), copy `extension/build/chrome` to `extension/released/<version>`, and add a row.
