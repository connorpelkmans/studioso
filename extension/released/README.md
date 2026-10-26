# Released versions

The exact files of each version of Studyboard School Sync sent to a store, unpacked. `tests/extension-released.e2e.js` checks every version here against the website as it is now, so a change to the website can't break a version that's in review or still installed.

| Version | Sent to | Chrome zip SHA-256 |
|---|---|---|
| 1.0.2 | Chrome Web Store (to be submitted) | `e70d8a6f6e589360b60ab33cc95a18c9d4aeb146c8c61f6f89e76837f34eddae` |
| 1.0.5 | Chrome Web Store, Edge Add-ons, Firefox Add-ons (to be submitted) | `d5838df6bdae6d49eaa6326fa4a54c3c0e975b7b1bc7008e6e4a67a79930f4fc` |
| 1.0.6 | Chrome Web Store, Edge Add-ons, Firefox Add-ons (to be submitted) | `726b5f2f13118e7b8b728070bb0733f357d9434a45977cb3559b095e14c55ae8` |
| 1.0.7 | Chrome Web Store, Edge Add-ons, Firefox Add-ons (to be submitted) | `f933ab060933eae202963a1b810d974aa2d1eb1282be092450470d297ead5a47` |

1.0.0 was withdrawn from review before it was published, so it isn't kept here. 1.0.5 adds marks that aren't on the Grades page (quiz Submissions pages, assignment feedback, the Assignments page, discussion pages, Blackboard attempts) and the website's switches for them. 1.0.6 finds a quiz the quiz list API leaves out (from the Quizzes page), reads a quiz's Submissions page even when nothing else says it was sat, and checks every discussion topic nearest today (not just the first 20) and every page of a topic's posts. 1.0.7 finds your post by your name too, or on the topic's page when the posts list is refused, counts a group member's post in a group topic, and reads when you finished a quiz and posted. If 1.0.2's upload ever differs from this folder (a rebuild before submitting), replace the folder and the SHA-256 before it's sent, and never after.

Never change a folder here. For each new version sent to a store: build it (`npm run build:extension`), copy `extension/build/chrome` to `extension/released/<version>`, and add a row.
