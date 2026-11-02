# Studyboard School Sync for Safari: App Store listing

Use this for the two Safari apps in App Store Connect (macOS and iOS), bundle ID `com.studyboardapp.SchoolSync`.
Replace the CAPITAL placeholders in the review notes before submitting.

Name: Studyboard School Sync
Subtitle (max 30): School sites into Studyboard
Promotional Text (max 170): Keeps your Studyboard planner in step with your school site: due dates, submitted work, grades and feedback. Read only, and nothing leaves your browser.
Keywords (max 100): canvas,brightspace,blackboard,moodle,d2l,lms,school,student,assignments,grades,homework,planner,sync
Support URL: https://studyboardapp.com/website/
Marketing URL: https://studyboardapp.com/
Privacy Policy URL: https://studyboardapp.com/website/privacy
Copyright: 2026 Connor Pelkmans
Category: Education (secondary: Productivity)
Price: Free
Age rating: answer the questionnaire; no user-generated content, no web browsing inside the app, no purchases. Expect 4+.

## Description
Studyboard School Sync keeps your Studyboard planner in step with your school's learning platform, automatically.

Connect your school site once. Every hour (or as often as every 15 minutes), whenever you open the site and whenever you open Studyboard, the extension reads your due dates, what you've submitted (and whether it was late, is missing or got an extension), your grades, your instructor's feedback and rubric scores, announcements, your teaching team and the course syllabus. Open Studyboard at studyboardapp.com in Safari and it's all there:
• New assignments, quizzes and discussions become tasks with their due dates
• Work you've handed in is ticked off for you
• Grades go to your Grade Tracker, and the feedback is one click away
• Rubrics show on each task, so you know what's being marked
• Class times, office hours and grade weights are filled in from the syllabus

HOW TO TURN IT ON
1. Open this app once, then go to Safari > Settings > Extensions and turn on Studyboard School Sync.
2. Open your school's site, click the extension's button in the toolbar and connect.
3. When Safari asks, choose Always Allow on This Website, so it can keep syncing.
Requires Safari 17 or later.

PRIVATE BY DESIGN
• It reads only the one site you connect, and only after Safari asks you to allow it.
• It only reads. It never submits, posts or changes anything on your school site, and it never sees your password: it uses the sign-in Safari already has.
• The extension itself sends your data nowhere: it keeps it in Safari until Studyboard picks it up, and Studyboard keeps it like the rest of your planner (on your device, and in your Studyboard account if you have one).
• No ads, no analytics, no tracking.

Works with Canvas, Brightspace (D2L), Blackboard Learn (Ultra and Original) and Moodle. You need a Studyboard planner at studyboardapp.com (free).

Canvas is a trademark of Instructure, Inc. Brightspace and D2L are trademarks of D2L Corporation. Blackboard is a trademark of its owner. Studyboard isn't affiliated with or endorsed by any of them.

Privacy Policy: https://studyboardapp.com/website/privacy
Terms of Use: https://studyboardapp.com/website/terms

## App Privacy (App Store Connect > App Privacy)
The extension itself sends nothing to any server. It reads school data in Safari and hands it to the Studyboard web page in the same browser. Two honest ways to answer:
- Narrow reading ("Data Not Collected"): the app and extension transmit nothing off the device themselves. This is defensible for this app on its own.
- Cautious reading (recommended, because the Studyboard page can save what it received to the student's Studyboard account on your server when they have one): declare these, all "Linked to the user", NOT used for tracking, purpose "App Functionality":
  * Contact Info: Name; Email Address (the student's name and their instructors' names and school emails as the school site shows them)
  * User Content: Other User Content (courses, due dates, grades, feedback, announcements, syllabus)
  * User Content: Emails or Text Messages (Canvas Inbox messages)
- Tracking: No. Third-party advertising: No.
Keep this consistent with the Studyboard app's own App Privacy answers (APP-STORE-CHECKLIST.md section 6a).

## Screenshots
- Mac (accepted sizes: 1280x800, 1440x900, 2560x1600, 2880x1800): use `extension/store/screenshot-1.png`, `screenshot-2.png`, `screenshot-3.png` (1280x800: connect, synced, feedback in Studyboard).
- iPhone (required for the iOS app): 6.9-inch (1320x2868 or 1290x2796). Take them in the iOS Simulator with Cmd+S, showing Safari with the extension popup and Studyboard with the synced courses. These are not made yet.
- Only upload iPad sizes if the iOS app supports iPad.

## App Review Information
Sign-in required: No (the extension needs a school site, not a Studyboard login). Give the Canvas test student in the notes.
Notes:
Studyboard School Sync is a Safari extension (inside a small container app) that reads the student's own Canvas, Brightspace (D2L), Blackboard Learn or Moodle site, using the sign-in Safari already has, and hands what it read to the Studyboard web app (https://studyboardapp.com) in Safari. It only reads: it never submits, posts or changes anything on the school site, and it never sees passwords. The extension sends nothing to any server.

Test account: Canvas test student at https://CANVAS-TEST-SITE/ , username CANVAS-USER , password CANVAS-PASSWORD . (The extension needs a school site to read, so this is a test Canvas course set up for review.)

How to test (Mac, Safari 17 or later):
1. Open the app once. It points you to Safari.
2. Safari > Settings > Extensions: turn on Studyboard School Sync.
3. Open https://CANVAS-TEST-SITE/ in Safari and sign in with the test student.
4. Click the Studyboard School Sync button in the toolbar. The site's address is filled in. Read the disclosure, click Agree, Allow and Connect, and when Safari asks for permission choose Always Allow on This Website.
5. Within a minute the popup shows Synced with the number of courses, items and grades.
6. Open https://studyboardapp.com/ in Safari. Choose Use Without an Account. A welcome tour opens: click Skip Tour. The Canvas courses are added and their assignments appear as tasks on the Board with due dates; submitted work is ticked off. Click a task to see its grade, feedback and rubric.

On iPhone or iPad: Settings > Apps > Safari > Extensions > Studyboard School Sync, then the same steps in Safari.

Permissions: storage (the connected site, settings and the last read), alarms (a sync on a schedule the student chooses), scripting (runs the extension's own packaged read script in a tab of the connected school site, only if the background read is not signed in), activeTab (fills in the site address from the popup). Access to the school site is optional and asked for one site at a time. The extension's content script runs only on studyboardapp.com, to hand the data to the Studyboard page. No remote code: all code is in the package.

Privacy: no tracking, no advertising, no analytics. Privacy Policy: https://studyboardapp.com/website/privacy
Contact: support@studyboardapp.com

## Before you submit
1. macOS target > General > App Category = Education (this fixes the LSApplicationCategoryType upload error).
2. The Safari manifest description is already within 112 characters (scripts/build-extension.js).
3. Create the app records for the macOS and iOS apps first (bundle ID com.studyboardapp.SchoolSync).
4. Set up a real Canvas test course for the reviewer. Apple will reject it if they can't see it work (guideline 2.1).
5. After approval, put the App Store link in EXT_STORE.safari in index.html.
