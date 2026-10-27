# Released versions

The exact files of each version of Studyboard School Sync sent to a store, unpacked. `tests/extension-released.e2e.js` checks every version here against the website as it is now, so a change to the website can't break a version that's in review or still installed.

| Version | Sent to | Chrome zip SHA-256 |
|---|---|---|
| 1.0.2 | Chrome Web Store (to be submitted) | `e70d8a6f6e589360b60ab33cc95a18c9d4aeb146c8c61f6f89e76837f34eddae` |
| 1.0.5 | Chrome Web Store, Edge Add-ons, Firefox Add-ons (to be submitted) | `d5838df6bdae6d49eaa6326fa4a54c3c0e975b7b1bc7008e6e4a67a79930f4fc` |
| 1.0.6 | Chrome Web Store, Edge Add-ons, Firefox Add-ons (to be submitted) | `726b5f2f13118e7b8b728070bb0733f357d9434a45977cb3559b095e14c55ae8` |
| 1.0.7 | Chrome Web Store, Edge Add-ons, Firefox Add-ons (to be submitted) | `858ff9be9b74dd6682229c3d9c8e538bf731a75a48d095af95db9b0fbd9cb05e` |
| 1.0.8 | Chrome Web Store, Edge Add-ons, Firefox Add-ons (to be submitted) | `0249ad291ba9d8546bdf23508cafbf7c1fec2e25a6341e7495df3c4c1ffe331e` |
| 1.0.9 | Chrome Web Store, Edge Add-ons, Firefox Add-ons (to be submitted) | `0a96257a58bf7892062a9d7c9fbb324b53b9af6ab6f051948dcbfd6cdf72045d` |
| 1.0.10 | Chrome Web Store, Edge Add-ons, Firefox Add-ons (to be submitted) | `1bcfe815a1dafb708abae9b5012199bf254c09878de5526672467285196df3ec` |
| 1.0.11 | Chrome Web Store, Edge Add-ons, Firefox Add-ons (to be submitted) | `6c8474aa6807f10b82e1379b5b82b9ca1256412d1df8bdc73dd6dc0bc004fe7b` |

1.0.0 was withdrawn from review before it was published, so it isn't kept here. 1.0.5 adds marks that aren't on the Grades page (quiz Submissions pages, assignment feedback, the Assignments page, discussion pages, Blackboard attempts) and the website's switches for them. 1.0.6 finds a quiz the quiz list API leaves out (from the Quizzes page), reads a quiz's Submissions page even when nothing else says it was sat, and checks every discussion topic nearest today (not just the first 20) and every page of a topic's posts. 1.0.7 finds your post by your name too, or on the topic's page when the posts list is refused, counts a group member's post in a group topic, and reads when you finished a quiz and posted; on Canvas it finds your reply in an ungraded discussion, and on Blackboard it leaves a hidden column's attempt score alone. 1.0.8 records what each step of a Brightspace read got (each quiz's Submissions page, each topic's posts and page, sign-in redirects), for the website's Copy Sync Report. 1.0.9 finds a closed exam that's gone from the quiz list through the calendar entry tied to it (and reads its mark), gives each discussion topic its forum's name, keeps a read inside a time budget so it isn't thrown away on a big term, and tells the website how its last try went. 1.0.10 reads a course's Grades page when the course refuses the grades list (403) or gives none, finds quizzes linked from the course content, and reports the grade rows and exam calendar entries it saw. 1.0.11 reads an assignment's mark from the Assignments page's Score column by its heading (also when the API gives no out-of), from the feedback link for you, or from its View Feedback page, and reports each step per assignment. If 1.0.2's upload ever differs from this folder (a rebuild before submitting), replace the folder and the SHA-256 before it's sent, and never after.

Never change a folder here. For each new version sent to a store: build it (`npm run build:extension`), copy `extension/build/chrome` to `extension/released/<version>`, and add a row.
