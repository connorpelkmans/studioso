# Released versions

The exact files of each version of Studyboard School Sync sent to a store, unpacked. `tests/extension-released.e2e.js` checks every version here against the website as it is now, so a change to the website can't break a version that's in review or still installed.

| Version | Sent to | Chrome zip SHA-256 |
|---|---|---|
| 1.0.2 | Chrome Web Store (to be submitted) | `e70d8a6f6e589360b60ab33cc95a18c9d4aeb146c8c61f6f89e76837f34eddae` |
| 1.0.5 | Chrome Web Store, Edge Add-ons, Firefox Add-ons (to be submitted) | `d5838df6bdae6d49eaa6326fa4a54c3c0e975b7b1bc7008e6e4a67a79930f4fc` |

1.0.0 was withdrawn from review before it was published, so it isn't kept here. 1.0.5 adds marks that aren't on the Grades page (quiz Submissions pages, assignment feedback, the Assignments page, discussion pages, Blackboard attempts) and the website's switches for them. If 1.0.2's upload ever differs from this folder (a rebuild before submitting), replace the folder and the SHA-256 before it's sent, and never after.

Never change a folder here. For each new version sent to a store: build it (`npm run build:extension`), copy `extension/build/chrome` to `extension/released/<version>`, and add a row.
