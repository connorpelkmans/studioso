# Mac App Store: App Review Information (App Store Connect > macOS version)

Fill the three placeholders before pasting: DEMO-EMAIL, DEMO-PASSWORD, REVIEW-GEMINI-KEY.
Tick "Sign-in required" and enter the demo email and password in the fields above the notes.

## Notes

Studyboard is a student planner (courses, deadlines, flashcards, study sessions, grades) that works offline and syncs to the person's own optional account.

Sign in: use the demo account in the fields above (email and password). The app also offers Continue with Apple and Continue with Google. An account is optional: everything works on the device without one. Apple and Google sign-in open the Mac's default browser, then return to the app through a one-time page on 127.0.0.1, which is why the app has the network server entitlement.

Native features beyond a website (4.2): the app bundles all of its pages and works fully offline; it uses native deadline reminders (notifications), a menu bar icon that brings the window back, a data folder the person chooses with the system folder picker, file attach and export through the system file dialogs, a focus-timer widget window, and microphone recording of lectures (only while the person records). The app runs in the App Sandbox and does not update itself.

User-generated content (1.2): Study Groups are private (invite code only). Every message, shared item and member has a Report action (Groups > open a group > Report), and reporting offers "also block". Blocked people's posts are hidden. Reports go to the developer only and are reviewed within 24 hours. Contact: support@studyboardapp.com

AI (5.1.2): optional. It uses the person's own Google, Anthropic or OpenAI key. Before first use a consent window names the company and what is sent. Test key for review: REVIEW-GEMINI-KEY (enter it in Settings > AI Features).

Purchases: Studyboard Pro is an auto-renewing subscription sold only with In-App Purchase (monthly and yearly). Restore Purchases is on the Pro screen. This build has no website purchase link, and payment websites are blocked inside the app. The demo account already has Pro. To see the purchase sheet, open Settings > Plan > Studyboard Pro.

School sites: the optional School Sites feature signs in to the person's own school website (Canvas, Brightspace, Blackboard, Moodle, Schoology or Google Classroom) in a window inside the app, read only. It is not needed to review the app.

Account deletion: Settings > Account and Sync > Delete My Account and Data.

Data: no tracking, no advertising, no analytics SDKs. Privacy Policy: https://studyboardapp.com/website/privacy
