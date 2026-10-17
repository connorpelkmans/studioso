# Studyboard School Sync: store listings

Everything to paste into the Chrome Web Store, Microsoft Edge Add-ons and Firefox Add-ons (AMO), with the steps for each. Build the packages first (`npm run build:extension`; see [README.md](README.md)). The pictures are in `extension/store/`.

| Store | Upload | Account | Review |
|---|---|---|---|
| Chrome Web Store | `dist/…-chrome.zip` | [Developer Dashboard](https://chrome.google.com/webstore/devconsole), one-time US$5 registration | Usually a few days. Optional host permissions can add time. |
| Microsoft Edge Add-ons | `dist/…-chrome.zip` (the same file) | [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview), free | Up to 7 business days |
| Firefox Add-ons (AMO) | `dist/…-firefox.zip`, plus `dist/…-source.zip` when asked for source | [AMO Developer Hub](https://addons.mozilla.org/developers/), free | Automatic checks, then a human review because of the source upload |

After each listing goes live, put its address in `EXT_STORE` in `index.html` (search for `const EXT_STORE`) and deploy the website. The Studyboard bookmark's sheet then offers "Get It for Chrome / Edge / Firefox". Before that, it only mentions the extension to people who already have it installed.

---

## Listing text (all three stores)

**Name:** Studyboard School Sync

**Summary / short description** (132 characters at most; this is the manifest description):
> Keeps Studyboard up to date with your Canvas, Brightspace or Blackboard: due dates, submissions, grades and feedback.

**Description:**
> Studyboard School Sync keeps your Studyboard planner in step with your school's learning platform, automatically.
>
> Connect your school site once. Every hour (or as often as every 15 minutes), whenever you open the site and whenever you open Studyboard, the extension reads your due dates, what you've submitted (and whether it was late, is missing or got an extension), your grades, your instructor's feedback and rubric scores, announcements, your teaching team and the course syllabus. Open Studyboard at studyboardapp.com in the same browser and it's all there:
> • New assignments, quizzes and discussions become tasks with their due dates
> • Work you've handed in is ticked off for you
> • Grades go to your Grade Tracker, and the feedback is one click away
> • Rubrics show on each task, so you know what's being marked
> • Class times, office hours and grade weights are filled in from the syllabus
>
> Private by design
> • It reads only the one site you connect, and only after your browser asks you to allow it.
> • It only reads. It never submits, posts or changes anything on your school site, and it never sees your password: it uses the sign-in your browser already has.
> • The extension itself sends your data nowhere: it keeps it in your browser until Studyboard picks it up, and Studyboard keeps it like the rest of your planner (on your device, and in your Studyboard account if you have one).
> • No ads, no analytics, no tracking.
>
> Works with Canvas, Brightspace (D2L) and Blackboard Learn (Ultra and Original). You need a Studyboard planner at studyboardapp.com (free).
>
> Canvas is a trademark of Instructure, Inc. Brightspace and D2L are trademarks of D2L Corporation. Blackboard is a trademark of its owner. Studyboard isn't affiliated with or endorsed by any of them.

**Category:** Chrome: Education. Edge: Education (or Productivity). Firefox: Other.
**Language:** English
**Website / homepage:** https://studyboardapp.com/website/
**Support:** support@studyboardapp.com
**Privacy policy:** https://studyboardapp.com/website/privacy.html (its "Studyboard School Sync browser extension" paragraph, `#extension`)

**Pictures** (`extension/store/`)
- Screenshots, 1280×800: `screenshot-1.png` (connect), `screenshot-2.png` (synced), `screenshot-3.png` (feedback in Studyboard)
- Chrome small promo tile, 440×280 (required): `promo-small.png`
- Chrome marquee, 1400×560 (optional): `promo-marquee.png`
- Edge store logo, 300×300: `logo-300.png`
- Store icon, 128×128 (96×96 artwork with 16 px transparent padding, as Chrome asks): `store-icon-128.png`

---

## Chrome Web Store

1. Register at the Developer Dashboard (US$5, one time). Under **Account**, verify the contact email and complete the **trader** declaration (EU Digital Services Act). Studyboard sells a paid plan, so it's a trader: the business name, address, email and phone you enter there are shown on the listing.
2. **Items → New item** and upload `studyboard-school-sync-<version>-chrome.zip`.
3. **Store listing:** paste the text above, choose Education, add the pictures.
4. **Privacy practices:**
   - **Single purpose:** "Keep the user's Studyboard planner up to date with the school learning platform (Canvas, Brightspace or Blackboard) they connect: read their courses, due dates, submissions, grades and feedback there and hand them to Studyboard in the same browser."
   - **Permission justifications:**
     - `storage`: "Keeps the connected school site, the sync settings and the last read (until Studyboard picks it up) in the browser."
     - `alarms`: "Syncs on a schedule the user picks (every 15 minutes to 12 hours) without a page being open."
     - `scripting`: "If a background read isn't signed in (some school single sign-on setups), runs the extension's own packaged read script in the user's open tab of the school site they connected, which has their sign-in. It never runs on any other site."
     - `activeTab`: "When the user opens the popup on their school site, its address is filled in for them."
     - **Host permissions** (`optional_host_permissions: https://*/*`): "Schools host Canvas, Brightspace and Blackboard on their own domains, so the extension can't list them in advance. Nothing is granted at install: when the user connects their school, the extension asks for that one site (for example https://school.instructure.com/*) with the browser's permission prompt. The user can remove it at any time."
     - **Content script on studyboardapp.com:** "Hands what the extension read to the Studyboard web app, which is the extension's purpose. It runs on no other site."
   - **Remote code:** No. All code is in the package.
   - **Data usage:** tick **Personally identifiable information** (the student's name and the names and school emails of their instructors, as the school site shows them), **Personal communications** (Canvas Inbox messages) and **Website content** (courses, due dates, grades, feedback, announcements, syllabus). Don't tick authentication information: the extension never sees passwords or tokens. Tick all three certifications (not sold to third parties; not used for unrelated purposes; not used for creditworthiness or lending).
   - **Privacy policy URL:** as above. Its extension paragraph has the affirmative statement the Limited Use policy asks for ("…complies with the Chrome Web Store User Data Policy, including the Limited Use requirements"), and the popup shows what is read and where it goes, right above **Agree, Allow and Connect**, before anything is read (prominent disclosure and consent).
5. **Test instructions** (Developer Dashboard, the item's **Test instructions** section): put the school site's test student in the username and password fields, and paste the text below in the instructions box, with the placeholders filled in. A Studyboard test account is optional (Studyboard works without one); if you give one, make it in Supabase with Auto Confirm and keep its password only in the dashboard.
   > Studyboard School Sync reads the student's own Canvas, Brightspace (D2L) or Blackboard Learn site, with the sign-in the browser already has, and hands what it read to the Studyboard web app (https://studyboardapp.com) in the same browser.
   >
   > Test accounts
   > - Canvas test student: the username and password above, at https://<canvas test site>/
   > - Studyboard (optional, Studyboard also works without an account): <studyboard email> / <studyboard password>
   >
   > Steps
   > 1. Open https://<canvas test site>/ and sign in with the Canvas test student.
   > 2. Click the Studyboard School Sync button in the toolbar. The site's address is filled in. Read the disclosure, click **Agree, Allow and Connect**, and allow the permission Chrome asks for (that one site only).
   > 3. Within a minute the popup shows "Synced" with the number of courses, items and grades.
   > 4. Open https://studyboardapp.com/ in the same browser. Choose **Use Without an Account** (or sign in with the Studyboard test account). A welcome tour opens: click **Skip Tour**. (What the extension read is brought in once these windows are closed.)
   > 5. Within a few seconds the Canvas courses are added and their assignments appear as tasks on the Board, with their due dates; the ones already submitted are ticked off. Nothing needs to be confirmed (Studyboard only asks if two entries look like the same item). Click a task to see its grade, feedback and rubric, when the course has them.
   >
   > Notes
   > - Permissions: storage (the connected site, settings and the last read), alarms (a sync every hour by default; the student can choose 15 minutes to 12 hours), scripting (when the background read doesn't work, for example because the school's single sign-on doesn't sign it in, runs the extension's own packaged read script in a tab of the connected site the student already has open), activeTab (fills in the address when the popup is opened on the school site). Site access is optional and asked for one school site at a time.
   > - studyboardapp.com: the content script relay.js runs only on studyboardapp.com, to hand what was read to the Studyboard page; externally_connectable lets that page ask the extension for what it read or for a sync now, and nothing else. No other site can talk to the extension.
   > - It only makes GET requests to the connected site. It never submits, posts or changes anything there, and never sees passwords.
   > - The extension sends nothing to any server: it keeps what it read in extension storage and passes it to the Studyboard page in the same browser.
   > - No remote code: harvest.js is generated at build time from the app's lms.js, unminified, and included in the package.
6. **Distribution:** Free, all regions, Public. Use **Unlisted** if you'd rather test it with a few students first. Submit for review.

## Microsoft Edge Add-ons

1. Sign in to Partner Center with a Microsoft account and enroll in the **Microsoft Edge** program (free).
2. **Create new extension** and upload the same `…-chrome.zip`.
3. **Availability:** Public, all markets.
4. **Properties:** category Education (or Productivity), privacy policy URL (required, because the extension handles personal information), website, support email. Mature content: No.
5. **Store listings → English:** the description above (Edge needs at least 250 characters), the summary, `logo-300.png` as the store logo, the screenshots, and optionally `promo-small.png` as the small tile and `promo-marquee.png` as the large one.
6. **Submit**, and paste the reviewer steps from Chrome step 5 in **Notes for certification**.

## Firefox Add-ons (AMO)

1. Sign in at the AMO Developer Hub with a Firefox account. **Submit a New Add-on → On this site** (listed).
2. Upload `studyboard-school-sync-<version>-firefox.zip`. The validator should show 0 errors and 0 warnings (check first with `npx addons-linter extension/dist/*-firefox.zip`). Leave Android compatibility on; the add-on works in Firefox for Android 142 or newer.
3. **"Do you need to submit source code?" → Yes.** Upload `studyboard-school-sync-<version>-source.zip`. Its `BUILD.txt` tells the reviewer how to rebuild: Node 18+, `node scripts/build-extension.js`, no packages.
4. **Describe:** name, summary (250 characters at most: the summary above works), the description above, category **Other**, support email and website, and **License: All Rights Reserved**.
5. **Privacy policy:** paste the full text of the extension paragraph from privacy.html, plus a link to the whole policy.
6. **Notes to reviewer:** the steps from Chrome step 5, a test account if you have one, and: "harvest.js and the first part of background.js are generated, unminified, from lms.js by scripts/build-extension.js (in the source upload). The data collection declared in the manifest (websiteContent, personallyIdentifyingInfo, personalCommunications) is the school data the add-on reads and hands to the Studyboard web page in the same browser. The add-on itself sends nothing to any server."
7. Submit. Firefox shows the declared data collection to people when they install, and they agree to it then.

The add-on id is `school-sync@studyboardapp.com` (set in `scripts/build-extension.js`). Keep it the same forever: AMO ties the listing to it.

---

## Each update

1. Change the code, then bump `"version"` in `extension/src/manifest.json`.
2. Run `npm run build:extension` and the tests (`node tests/extension.test.js`, `node tests/extension.e2e.js`).
3. Upload the new chrome zip to Chrome and Edge, and the firefox zip (with the new source zip) to AMO.
4. If you add a permission, the stores re-review it and Chrome may disable the extension for users until they accept. Keep permissions as they are unless there's no other way.

## Not included yet

- **Safari** needs the extension wrapped in a Mac/iOS app with Xcode (`xcrun safari-web-extension-converter`) and an App Store listing. The same `build/chrome` folder is the starting point.
- **Firefox before version 140** can't install it, because older versions don't read the data collection declaration that AMO requires.
