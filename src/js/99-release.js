/* ===== module: 99-release.js ===== */
/* Studyboard 1.13.0 release polish */
(() => {
  const VERSION = "1.15.2";
  // The support address shown in the policies and About
  const SUPPORT = "support@studyboardapp.com";
  const UPDATED = "October 27, 2026", TERMS_UPDATED = "October 27, 2026";
  const FIRST_YEAR = 2026;
  const contact = () => `<a href="mailto:${esc(SUPPORT)}">${esc(SUPPORT)}</a>`;
  const year = () => { const y = new Date().getFullYear(); return y > FIRST_YEAR ? FIRST_YEAR + "–" + y : String(FIRST_YEAR); };
  let backFn = null;

  /* Texts */
  const PRIVACY = () => `
    <p class="legal-meta">Effective ${UPDATED}</p>
<p>Studyboard is a planner for courses, deadlines, notes and flashcards, run by Connor Pelkmans, who publishes it as Studyboard ("we"). This page explains, in plain words, what we collect, why, who else handles it, how long we keep it and how to delete it. The short version: without an account your work stays on your device; with a free account it is also kept online so it syncs between your devices. There are no ads, and nothing in Studyboard tracks you or sells your data.</p>

<h3>Where your planner is kept</h3>
<p>You can use Studyboard without an account. Then your courses, tasks, notes, flashcards, grades and settings are saved only on the device you use (in the browser's storage on the website, or in the app's folder on desktop and phone), and nothing leaves it except through the optional features below. With a free account they are also kept in your account on our servers (see Your account and synced data, below), so they are the same on every device you sign in on, and a copy stays on each device so Studyboard keeps working offline. Either way, what always stays on your device and is never sent to us: your daily backups, your AI keys (unless you choose to share them between your devices, described below), and your school-site connections, including a school calendar link or a Canvas access token. If you turn on folder backups, copies are also written to the folder you pick.</p>
<p>On the website, Studyboard asks your browser to keep its storage permanently, so the browser does not clear it on its own to free up space or after a while without a visit. Most browsers agree once Studyboard is installed as an app or added to the Home Screen, and Settings shows whether yours has. Clearing your browser's site data removes this device's copy and its daily backups. Without an account that is everything, so make an account or export a backup now and then; with one, what is in your account stays and comes back when you sign in again (changes made offline that hadn't synced yet are lost). Access tokens and similar secrets are kept locked (encrypted) in the device's secure storage: the system keychain in the apps, and an encrypted store in the browser on the website.</p>

<h3>No analytics, no ads, no tracking</h3>
<p>Studyboard has no analytics, advertising or tracking tools, and it sets no tracking cookies. We do not track you across other apps or websites, and we do not sell or share your data for advertising. The only things stored in your browser are the ones needed to work: your data, settings and sign-in. Apart from syncing your planner to your account if you have one, Studyboard sends only two things on its own: anonymous crash reports, described next, and anonymous upgrade counts.</p>

<h3>Anonymous upgrade counts</h3>
<p>When the free plan shows a Studyboard Pro offer, the app adds one to a daily total for that offer (for example "Insights are part of Studyboard Pro: shown"), and does the same when a price is tapped and when Pro is bought after that. Only the offer's wording and the date are counted, with numbers and names taken out. Nothing identifies you or your device, and nothing is stored per person. It tells us which Pro features people want, and it stops whenever Pro isn't on sale.</p>

<!-- CRASH-REPORTING-PARAGRAPH: keep in step with the crash-reporting feature (49-errreport.js). -->
<h3>Anonymous crash reports</h3>
<p>When Studyboard hits an error (a crash, a failed sync or a broken screen), it can send a short report so we can fix the bug. A report holds the kind of error and where in the code it happened, the app version, the platform (website, installed app, desktop or iPhone/iPad app), whether you have a free or paid plan, the theme in use, and the last few actions of the app itself (such as which tab was open). It never contains your tasks, notes, courses, files, email address, account id, AI keys or anything you typed, and it is not linked to you: it carries a random number made on your device that is not your account (deleted when you switch reports off) and a one-way scrambled form of your network address, scrambled with a secret only our server holds together with the date, so it can't be traced back or matched from one day to the next, kept with the report only to stop one device from flooding us with reports. We do not use reports for advertising or tracking and never share them. They are kept for about 30 days. This is on by default (off if your browser sends Do Not Track or Global Privacy Control). Turn it off any time in Settings, Send Anonymous Crash Reports. On iPhone and iPad, Apple may also give us crash logs through App Store Connect if you chose to share app analytics with developers in your device's settings. Reports go to our own Supabase project, and, if we turn it on, to Sentry (Functional Software, Inc.), an error-tracking service that receives the same anonymous report and keeps it for no more than 30 days.</p>

<h3>Your account and synced data</h3>
<p>If you create an account, we store your email address. Your password is never stored or seen by anyone, including us: our hosting provider, Supabase (Supabase Auth), keeps only a salted hash of it (a one-way code), which can check a password you type but can't be turned back into it. No one can look up your password, so if you forget it you reset it by email. Your planner then syncs between your devices (what you made before signing up comes along), so your courses, tasks, notes, flashcards, settings and file records are stored on our Supabase project, in your account. With Studyboard Pro, a weekly backup copy of your planner is also kept in your account for 30 days, so you can restore an earlier version. Each account can only read its own rows (what you post in a study group is the one exception: the group's members can see it, as described below). We also keep the name and type of each device signed in to your account, how much storage your account uses (for the plan limits), and your plan status. Your AI keys stay on the device unless you turn on AI Keys on All My Devices in Settings (or use Add AI to Another Device, described under AI below): then they are locked on your device with a passphrase only you know, and only the scrambled copy is stored, so we cannot read them. They are always left out of the backup files you export. School calendar links and Canvas access tokens are never synced. Your newest companion chats are also synced to your account. When you make an account we also ask for your birthday, once, to apply age rules: it is never shown to anyone. Students under 13 need a parent or guardian to create the account with the parent's own email and agree on the child's behalf; those accounts can't publish or share with a public link.</p>
<p>Like any online service, the people who run the server can technically reach what is stored on it. We only look at it to keep the service working, fix a problem you ask us to look into, or comply with the law.</p>

<h3>Uploaded files</h3>
<p>Files you attach (for example PDFs and images) are stored in a private storage area of our Supabase project, in a folder that only your account can open. On the website, attaching files needs an account, and the files are kept there rather than in your browser; the desktop app also keeps a copy in its folder on your computer. Photos you choose for your own theme are stored the same way, so they follow you to your other devices. They count toward your plan's storage limit and are deleted when you delete them or your account.</p>

<h3>Optional: AI features, with your own key</h3>
<p>AI is off until you add your own key from Google (Gemini), Anthropic (Claude) or OpenAI and agree, in a prompt that names the company, to send content to it. When you use an AI feature, the content it needs (for example task titles, notes, a syllabus or PDF you import, flashcards, your question, or the text of your items when you use search by meaning) is sent straight from your device to the provider you chose, using your key. It does not pass through our servers. If you're signed in and haven't added a key, you can try AI a few times for free: those requests go to Studyboard's trial server, run on Cloudflare, which passes them to an open AI model (Google's Gemma) run by Cloudflare's Workers AI service and sends the answer back, so Cloudflare processes what you send to produce the answer. The trial server keeps only a count of your tries and whether you passed its one-time robot check, under your account id, and deletes both when you delete your account. It never stores what you send. If the robot check (Cloudflare Turnstile) is switched on, Cloudflare sees your network address while it runs. If you use Add AI to Another Device, your keys are locked (encrypted) on your device with a one-time code, and only the locked copy is left with our key relay, which runs on Cloudflare. It is deleted as soon as your other device collects it, or after 10 minutes at most, and we can't unlock it, because the code never reaches our servers. That provider's own terms and privacy policy apply, and they decide how long they keep it. On Google's free tier, Google may use what you send to improve its products, so do not send anything private. You can switch AI off and remove your key at any time. Studyboard never uses what you send, or anything in your planner, to train AI models. AI answers can be wrong, so check dates, grades and facts; a reply to a school message that AI drafted for you is marked as drafted by AI.</p>

<h3>Optional: your school's learning platform</h3>
<p>If you connect Brightspace, Canvas or Blackboard, the connection stays on your device. In the desktop and phone apps you sign in on your school's own page (Studyboard never sees your password) and the sign-in is kept in a private store on that device. On the website, the Studyboard School Sync browser extension does this instead (below). The apps then read your own school work through the platform's own interface, a few requests at a time, and each request from the desktop app names Studyboard as the app asking, so your school can always tell it apart.</p>
<p>Grades, feedback and messages from your school are private (in the United States they can be protected by FERPA). What Studyboard brings in (your courses, due dates, submission status, grades, feedback and rubrics, announcements, the syllabus and your instructors' names and school email addresses) becomes part of your planner: kept on your device, and stored in your account on our servers (Supabase) if you have one, so it syncs between your devices. Your school Inbox messages are never stored in your account: they are read when you open them, or kept on the device that read them. We never sell this data, share it, publish it or use it for anything except showing your own school work to you, and you can delete it with your account at any time. Studyboard is an independent app: it is not affiliated with, endorsed by or sponsored by Instructure (Canvas), D2L (Brightspace) or Blackboard.</p>
<p id="extension">The Studyboard School Sync browser extension (for Chrome, Edge and Firefox) reads your school site by itself. It can read only the school site you connect in it, and only after your browser asks you and you allow it; you can remove that permission any time, in the extension or in your browser. About every hour, and when you open that site, it reads your courses, due dates, submission status, grades, feedback and rubrics, announcements, the names and school email addresses of your instructors and teaching assistants, the course syllabus and, for Canvas, your Inbox messages, with the sign-in your browser already has. It only reads: it never submits, posts or changes anything on your school site, and it never sees your password. What it reads is kept in your browser's storage for the extension and handed to Studyboard when you open studyboardapp.com in the same browser; the extension itself sends nothing to Studyboard's servers or to anyone else, and it has no analytics or tracking. Once Studyboard brings it into your planner, it is treated like everything else in your planner: kept on your device, and in your account if you have one (above). Removing a school in the extension, or uninstalling it, deletes what it kept. We do not sell this data, use it for advertising or credit decisions, or use it for anything except showing your own school work in your planner. Studyboard School Sync's use of information it receives complies with the <a href="https://developer.chrome.com/docs/webstore/program-policies/policies">Chrome Web Store User Data Policy</a>, including the Limited Use requirements.</p>
<p>If you paste a calendar link instead, it is saved on that device only. It works like a password to your calendar, so it is never synced to your account and never put in a backup or export. On the website and phone the link is passed through a small function on our server that fetches the calendar for you and stores nothing. Studyboard does not ask for or use Canvas access tokens. A token an earlier version saved on a device is deleted from it, and you can also delete it in Canvas (Account, Settings). Studyboard only reads from your school's site. What it brings in (due dates, grades, announcements) becomes part of your planner and syncs to your account like everything else if you have one.</p>

<h3>Optional: reminders, calendar link, study groups</h3>
<p><b>Phone and desktop reminders</b> need your device's push address and your upcoming reminders (task titles and times for the next two weeks) to be stored on our server so a notification can arrive when Studyboard is closed. The notification itself is delivered by your browser or phone maker's push service (Google, Apple or Mozilla). <b>Calendar Sync</b> stores a private link token and your choices so your calendar app can fetch your deadlines. <b>Study groups, shared decks and Study Together rooms</b> share the display name and the decks, deadlines and messages you choose to share with the people in that group. Members of a group can see what is posted in it and who posted it, including messages, shared tasks, quiz scores, check-ins and focus time. Someone with a group's invite code can see only its name, course, member count and owner's name before joining. If you report something in a group, the report keeps a short copy of what was reported so we can review it. Turn any of these off, or leave a group, and it stops. <b>Voice and shortcut capture</b> (optional, for example "Hey Siri, add a task") stores a private capture token (only a hash of it, shown to you once) and the short notes you send, in an inbox on our server until your app collects them; you can revoke the token any time, and everything is deleted with your account. <b>Email to Studyboard</b> (Pro, optional) gives you a private email address. An email you forward to it passes through our email service (Cloudflare) and waits in the same inbox on our server, as its subject, the sender's address and up to 6,000 characters of its text, until your app collects it (it is then deleted within 7 days, and after 30 days at the latest). Your app reads it, with your AI provider if you have agreed to that, and shows you what it found before anything is added. You can make a new address or turn it off at any time. <b>Two-way calendar sync</b> (Pro, optional) connects your Google or Outlook calendar when you ask it to. We keep that account's sign-in, encrypted, so Studyboard can keep a calendar called Studyboard up to date there; it only ever writes to that calendar. For Outlook, if you choose, it also reads your other events (with their titles, or as busy times only); for Google Calendar it doesn&rsquo;t read your other events so your plan can work around them, and they are saved in your planner like your other events. Disconnect any time, which also removes our access; it is deleted with your account. <b>Record a Lecture</b> (Pro, optional) uses your microphone only while you are recording. Live captions use your browser's own speech service, which may send the audio to the browser's maker (Google, in Chrome). A recording you choose to keep is stored with your files, and Transcribe with AI sends the audio to Google with your own key, like other AI features. <b>Share links and the Course Library:</b> when you make a link for a deck, note or quiz, anyone who has the link can see its text and your display name, without an account, until you stop sharing it. A deck you list in the Course Library can be found by anyone who looks up that course code; it shows your display name, the school you picked and how many people saved a copy. <b>Published flashcards and quizzes:</b> if you choose Publish on a shared deck or quiz, it gets a public page on studyboardapp.com that anyone can find, including through search engines such as Google, showing its cards or questions, your username, your school and when it was updated, until you unpublish it. Your username is chosen by you, unique, and also visible to people you share with. Your study progress, photos and stickers are never shared. Shared items can be reported, and we review reports. The first time you share with a link or publish, we keep a record that you agreed to the sharing rules in the Terms, with the date and the version of the Terms.</p>

<h3>Optional: Google Drive and OneDrive</h3>
<p>If you connect Google Drive or OneDrive, Studyboard can save your files, lecture recordings and (if you turn it on) automatic backups there instead of in Studyboard&rsquo;s storage, and open them again when you ask. Our server keeps the sign-in Google or Microsoft gives us, encrypted, and uses it only to give your own Studyboard a short-lived key; your files travel straight between your device and Google or Microsoft, never through our server. Studyboard keeps only each file&rsquo;s name, size, link and where you filed it, with your other data.</p>
<p><b>Google Drive:</b> Studyboard asks only for access to the files it creates (in a folder called &ldquo;Studyboard&rdquo;); it can&rsquo;t see anything else in your Drive. <b>OneDrive:</b> Studyboard saves into the folder you choose and reads only the folders you ask it to watch. It never deletes anything in Google Drive or OneDrive. A file&rsquo;s contents are read only when you ask (to open, summarize or study from it), and go to an AI service only if you allowed AI for that account (a checkbox when you connect it, which you can change any time in Files, Cloud) and then use an AI feature on that file. Studyboard&rsquo;s use of information received from Google APIs follows the <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>, including the Limited Use requirements. Disconnect any time in Files, Cloud (or in your Google or Microsoft account settings); deleting your Studyboard account deletes the stored sign-in too.</p>

<h3>How Studyboard uses Google user data</h3>
<p>This section covers what happens when you connect a Google account to Studyboard: Google Drive or two-way calendar sync with Google Calendar (Pro). Both are optional and start only when you ask.</p>
<ul>
<li><b>What Studyboard accesses:</b> your Google account&rsquo;s email address, to show which account is connected. For Google Drive, only the files Studyboard itself creates (Google&rsquo;s &ldquo;drive.file&rdquo; permission); it can&rsquo;t see or open anything else in your Drive. For Google Calendar, only a calendar called Studyboard that Studyboard creates and keeps up to date (Google&rsquo;s &ldquo;calendar.app.created&rdquo; permission). Studyboard doesn&rsquo;t read your other Google calendars or their events.</li>
<li><b>How it is used:</b> only to provide the feature you turned on: saving and opening your files, putting your deadlines and study sessions on your calendar, and planning around your other events. Google user data is never used for advertising, never sold, never used to build profiles, and never used to train AI models.</li>
<li><b>How it is stored and protected:</b> the sign-in Google gives us is kept encrypted on our server (Supabase) and used only to give your own Studyboard a short-lived key. Your files travel straight between your device and Google and are never stored on our server. Studyboard keeps each Drive file&rsquo;s name, size and link, and the calendar events you chose to bring in, with your other planner data, protected the same way (encrypted in transit, private to your account).</li>
<li><b>Sharing:</b> we don&rsquo;t share Google user data with anyone, except the hosting provider that runs Studyboard&rsquo;s server (Supabase), the AI provider you set up when you yourself use an AI feature on a file or event, or when the law requires it. No person at Studyboard reads it, unless you ask us to (for example, for support), it is needed for security, or the law requires it.</li>
<li><b>Keeping and deleting it:</b> it is kept only while the account stays connected. Disconnecting (Files, Cloud for Drive; Calendar Sync, Two-Way for Calendar) deletes the stored sign-in from our server and asks Google to revoke Studyboard&rsquo;s access; you can also remove access any time at <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a>. Deleting your Studyboard account deletes all of it, and you can ask us to delete it by email at any time. Files Studyboard saved in your Drive stay yours, in your Drive.</li>
</ul>
<p>Studyboard&rsquo;s use and transfer of information received from Google APIs to any other app will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>

<h3>Bug reports and feedback</h3>
<p>If you send a report, it includes what you wrote, an optional screenshot you attach, an optional email address for a reply, and basic technical details (app version, browser and device type, screen size, your plan and recent error messages, cleaned of your titles, email addresses and web addresses), and a random number made on your device so its reports can be limited and grouped. If you are signed in, the report is linked to your account. It contains none of your tasks or notes unless you type them. When you report an AI response, the form also fills in that response, which you can shorten or remove before sending. Only the app's owner can read reports.</p>

<h3>Payments</h3>
<p>Pro is sold through Stripe (website and desktop) or through the App Store and Google Play (iPhone, iPad and Android apps). Stripe and the app stores handle your card and billing details; we never see or store them. We receive only your plan status: whether you have Pro, when it ends and where you bought it. If you pay with Stripe we also keep a Stripe customer id so we can open your billing page. Purchases in the iPhone, iPad and Android apps are checked through RevenueCat (RevenueCat, Inc.), which receives your account id (a random number, not your email), the store's purchase record and your device's platform so it can confirm the subscription with Apple or Google and tell us your plan status.</p>

<h3>Email delivery</h3>
<p>Emails we send you (confirming your address, resetting your password, signing in) are sent through our email delivery provider, Supabase, which handles your email address and the message so it can be delivered. We send no marketing email.</p>

<h3>Other services we use</h3>
<p>Studyboard runs on Supabase (accounts, sync and storage). The website and the web app are delivered by Cloudflare, which hosts them and, like any web host, sees your IP address and the pages you load; Cloudflare also runs the AI trial and the key relay described above. On the website, fonts, the sign-in library and the PDF reader are served from the same site as the page, so no other third party is contacted for them. If the sign-in library's copy can't be loaded the page falls back to a public content network (jsDelivr), which can then see your IP address as for any web page. Studyboard also contacts the AI provider you chose, only when you use AI, and Stripe when you pay on the website. If you download the Windows or Mac installer from our website, the file is delivered by GitHub, which can see your IP address as for any download. That desktop app also asks GitHub about once a day whether a newer version is out, so it can tell you; GitHub sees your IP address, and nothing else is sent.</p>

<h3>How long we keep things</h3>
<ul>
<li><b>Your account and planner:</b> until you delete them. Deleted items are remembered for 45 days only so your other devices can catch up.</li>
<li><b>After you delete your account:</b> your data is removed from our database and storage straight away. Encrypted backups can hold a copy for up to 30 days before they are overwritten; nothing is restored for a deleted account.</li>
<li><b>Payment records:</b> Stripe and the app stores keep them as tax and accounting law requires. We keep a log of payment events (such as a renewal or a cancellation) linked to your account for up to 120 days so your plan stays right, then delete it. When you delete your account, your Stripe customer profile is deleted and any payment records we still hold lose their link to you.</li>
<li><b>Crash reports:</b> kept for about 30 days, then deleted. They are anonymous and not linked to your account.</li>
<li><b>Study group reports:</b> kept for up to a year. The copy of what was reported is cleared 90 days after the report is handled.</li>
<li><b>AI trial count:</b> until you delete your account.</li>
<li><b>Bug reports:</b> kept only as long as needed to fix the problem, and never longer than 180 days (screenshots attached to a report are deleted after 30 days). Reports sent while signed in are deleted with your account.</li>
<li><b>Free trial record:</b> if you had a free trial or the free week of Pro that new accounts get, we keep a one-way scrambled code (a hash) made from your email address, also after your account is deleted, only so the same address can't get another one. It can't be turned back into your email address.</li>
</ul>

<h3>Your choices and your data</h3>
<ul>
<li><b>Export:</b> Settings, Data and Backups, Export a Backup File gives you everything in one file.</li>
<li><b>Get a copy of your data (access and portability):</b> Settings, Data and Backups, Export My Data makes a ZIP with one JSON file and spreadsheet (CSV) files of your tasks, notes, grades, flashcards, courses, schedule and study sessions. It is made on your device, works offline, and never includes AI keys, access tokens, school calendar links, sign-in details or device ids.</li>
<li><b>Deleted by mistake:</b> things you delete wait in Settings, Data and Backups, Recently Deleted for 30 days (synced with your account like the rest of your data), then are removed for good.</li>
<li><b>Delete everything on this device:</b> Settings, Data and Backups, Clear All Data. Clearing your browser's site data also removes it.</li>
<li><b>Delete your account and online data:</b> Settings, Account and Sync, Delete My Account and Data. This removes your account, synced data, uploaded files, reminders, devices, calendar links and calendar connections, your Studyboard email address and plan record from our server, and cancels a card subscription for you. Study groups you own pass to another member, or are deleted if nobody else is in them, and your group messages are deleted. Subscriptions bought through the App Store or Google Play must be cancelled by you in your store account, because we cannot cancel them. You can also email us from the address on the account to ask for deletion.</li>
<li><b>Your rights:</b> depending on where you live (for example the EU, UK or California) you may have the right to access, correct, delete or port your data and to object to its use. Use the steps above, or contact us.</li>
</ul>

<h3>International transfers</h3>
<p>Our servers are in the United States (US West). Supabase, Cloudflare, Stripe, RevenueCat, Sentry, our email provider and the AI provider you choose may process data in other countries, including the United States. Where the law requires it we rely on safeguards such as standard contractual clauses.</p>

<h3>Children</h3>
<p>Studyboard is for students aged 13 and over. In the European Economic Area and the UK, where the age of digital consent is higher in some countries (up to 16), a person under that age needs a parent or guardian's permission to make an account. If you are younger than 13, please do not create an account. If you think a child has given us personal data, contact us and we will delete it.</p>

<h3>Security</h3>
<p>Connections are encrypted (HTTPS). Each account can only read its own rows, and plans can only be changed by our payment system, never from your device (apart from starting a free trial once, when one is offered). No system is perfectly safe; if something affecting you goes wrong we will tell you.</p>

<h3>Changes and contact</h3>
<p>If this policy changes in a way that matters, we will update the effective date above and tell you in the app. Questions or requests about your data: ${contact()}.</p>
`;

  const TERMS = () => `
    <p class="legal-meta">Effective ${TERMS_UPDATED}</p>
    <p>These terms are the agreement between you and Connor Pelkmans, who publishes Studyboard ("we"), for using Studyboard: the app and its website. By using Studyboard you agree to them. If you do not agree, please do not use it. Questions: ${contact()}.</p>

    <h3>Using Studyboard</h3>
    <p>Studyboard is a planner that helps you keep track of your courses and work. You can use it for free on your own device, with or without an account; a free account keeps your planner online and in sync on your devices. You must be at least 13 years old. Use it lawfully, and do not try to break it, attack or overload it, get around plan limits or payments, use someone else's account, get into other people's data, or use it to harass anyone.</p>

    <h3>Your account and your content</h3>
    <p>Keep your password private; you are responsible for what happens under your account. Everything you put into Studyboard is yours. You give us a worldwide, non-exclusive, royalty-free permission to store, copy, process, sync and show it so Studyboard can work: back to you, to the people you share it with and, when you publish something, to anyone. We use it for nothing else. The permission ends when you delete it, except for copies other people already saved and backups we keep for a short time. You can export it or delete it at any time (see the Privacy Policy). Keep your own backups of anything important. You must be 13 or older to make an account yourself; a parent or guardian can make one for a younger student and agrees to these Terms for them. Accounts for students under 13 can't publish or share with a link. Only publish sets you made or have the right to share, and never answers to graded work; we remove what is reported.</p>

    <h3>Course materials and copyright</h3>
    <p>Slides, handouts, readings, tests and other course materials usually belong to your instructor, your school or a publisher. You may upload them to Studyboard to study from them yourself, as your school allows. Course files you upload, such as lecture slides, stay private to your account: no one else can open them, and Studyboard never shares or publishes them or lets you share them with a group. Pictures, files and text copied word for word from a file can't be shared anywhere in Studyboard: not in a group, with another person or on a public page. You can share what you write or draw yourself, and what AI writes for you in its own words; pictures on a whiteboard stay on your own copy. You alone are responsible for having the right to upload them. When you share or publish anything in Studyboard (a deck, a quiz, notes, a whiteboard, a message or a link, in a group or with a link), you promise that you made it or have the right to share it, and that sharing it doesn't break anyone's copyright or other rights or your school's rules. You confirm this each time you share or publish, and we keep a record of when you agreed and to which version of these terms. Share the cards and questions you wrote, or that AI wrote for you in its own words. Don't share uploaded slides or handouts, pictures taken from them, wording copied from them, questions from your instructor's tests or quizzes, or answers to graded work, unless you have permission.</p>
    <p><b>Copyright complaints:</b> If you think something shared in Studyboard copies your work, use Report on it for a quick review, or send a formal notice to ${contact()} with: your physical or electronic signature; your name, postal address, phone number and email; the work you own; where the copy appears in Studyboard (a link or share code); a statement that you believe in good faith the use isn't allowed by the owner, its agent or the law; and a statement that your notice is accurate and, under penalty of perjury, that you own the work or may act for the owner. We may remove or disable anything shared in Studyboard when we receive a complaint, without notice, and we tell the person who shared it. We stop people who repeatedly share content that breaks other people's rights from sharing, and may close their accounts.</p>
    <p><b>If we removed something you shared:</b> If you think it was removed by mistake or misidentified, send a counter-notice to ${contact()} with: your physical or electronic signature; your name, postal address and phone number; what was removed and where it was (a link or share code); a statement, under penalty of perjury, that you believe in good faith it was removed by mistake or misidentification; and a statement that you consent to the jurisdiction of the federal district court for your address (or, if you live outside the United States, any judicial district where we may be found) and will accept service of legal papers from the person who complained. We send your counter-notice, with your contact details, to the person who complained. Unless they tell us they have started a court case to stop it being shared, we may put it back 10 to 14 business days after we receive your counter-notice. Anyone who knowingly makes a false notice or counter-notice can be liable for damages.</p>

    <h3>Study groups and shared content</h3>
    <p>Study groups, study rooms and shared decks let you post content other people see. There is zero tolerance for objectionable content or abusive users: no harassment, bullying, hate, threats, sexual content, spam, cheating services or sharing other people's personal information. Use Report on a group message, a shared item or a group member to tell us, and Block (in the group's member list) to stop seeing someone's messages straight away. We review reports within 24 hours, remove content that breaks these rules and remove people who post it. We don't check what people share before it appears and we aren't responsible for it; content made by other people is theirs, not ours, and you use it at your own risk. Anyone who can see something you share or publish can save a copy, and unpublishing or deleting it doesn't remove the copies they already saved.</p>

    <h3>AI features</h3>
    <p>AI features are optional. They use either your own key from a provider you choose, whose terms and any costs are between you and that provider, or, if you are signed in without a key, a small number of free trial requests answered by an open AI model run on Cloudflare (see the Privacy Policy). AI answers can be wrong or out of date. Check dates, grades and facts before you rely on them, and use AI only as your school and instructors allow. When AI makes flashcards, quizzes or other study material from your slides, notes or files, Studyboard tells it to restate the facts and ideas in its own words instead of copying the wording, and not to copy your instructor's test or quiz questions. Picture cards, including ones made from your slides or PDFs, stay in your own decks and are never shared. Check what AI makes before you share it.</p>

    <h3>Study use only</h3>
    <p>Studyboard is a study tool. Flashcards, quizzes, summaries, plans and answers in it, whether written by you, by AI or by other students, can be wrong, incomplete or out of date, and we don't promise they will help you pass. They are not medical, nursing, legal, financial or other professional advice: never use them to make decisions about a patient's care, your health or anyone's safety, and always check your course materials, your instructor and official guidelines. You are responsible for following your school's academic integrity rules. Don't use Studyboard to cheat, to share or collect answers to graded work or questions from real tests, or to hand in AI-written work where your school doesn't allow it.</p>

    <h3>Your school and other services</h3>
    <p>Connecting a school learning platform, calendar or other service is your choice. You're responsible for using it as your school's rules allow. Studyboard only reads from those sites. Studyboard is not affiliated with Brightspace, Canvas, Blackboard, Google, Anthropic, OpenAI, Apple or any school. Links and services from other companies are run by them, under their own terms; we aren't responsible for them.</p>

    <h3>Free and Pro</h3>
    <ul>
    <li>Studyboard has a free plan and an optional paid plan called Pro with higher limits and extras. What each includes, the prices and the renewal terms are shown before you buy. We may change prices or features for the future; if you subscribe, the price you agreed to stays the same until your next renewal after we tell you, and we will not take away what you have paid for during the period you paid for.</li>
    <li><b>Free week of Pro:</b> each new account gets 7 days of Pro once, with no card and no charge. When the week ends, the account goes back to the free plan unless you choose a plan. Nothing you made is deleted. One free week per person: it isn't given again to a new account made with the same email address.</li>
    <li><b>Free trial:</b> if a free trial is ever offered at checkout, your plan starts and you are charged when it ends unless you cancel before then.</li>
    <li><b>Renewal and cancelling:</b> subscriptions renew automatically each month, every 4 months (the semester plan) or each year until you cancel. Payments are handled by Stripe, the App Store or Google Play. Cancel any time on the Manage billing page of our website (or in your App Store or Google Play account if you bought there); you keep Pro until the end of the period you paid for.</li>
    <li><b>Refunds:</b> payments are generally not refunded for time already used, except where the law or the purchase page says otherwise. If something went wrong, write to us and we'll sort it out fairly: ${contact()}. Purchases made in the App Store or Google Play follow Apple's or Google's rules for billing, cancelling and refunds.</li>
    <li><b>Apple subscriptions (iPhone and iPad):</b> Payment will be charged to your Apple ID account at confirmation of purchase. The subscription renews automatically unless it is cancelled at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours before the end of the current period. You can manage and cancel your subscriptions in your App Store account settings after purchase (<a href="https://apps.apple.com/account/subscriptions" target="_blank" rel="noopener noreferrer">apps.apple.com/account/subscriptions</a>). Any unused portion of a free trial period, if offered, is forfeited when you buy a subscription.</li>
    <li>If a payment is reversed (a refund or a dispute), Pro for that payment ends.</li>
    <li>If you go over a free limit after a plan ends, nothing is deleted; you just can't add more until you're under the limit.</li>
    </ul>

    <h3>Availability and no warranty</h3>
    <p>We work hard to keep Studyboard reliable and your data safe, but it is provided "as is" and "as available". To the fullest extent the law allows, we make no promises or warranties of any kind, express or implied, including that it will always work, be error free, be secure, never lose data, or be fit for a particular purpose, and none about the accuracy of AI answers or of content other people share. Back up what matters (the app makes it easy). Do not rely on reminders alone for something critical.</p>

    <h3>Limit of liability</h3>
    <p>To the fullest extent the law allows, we are not liable for lost data, for content other people share, for AI answers, or for indirect or consequential losses, such as a missed deadline or lost grade, and our total responsibility for any claim is limited to what you paid us in the last 12 months (or zero if you use the free plan). Nothing here limits rights you have by law that cannot be limited.</p>

    <h3>Claims caused by your use</h3>
    <p>If you break these terms or the law, or something you upload, share or publish breaks someone else's rights (for example their copyright), and that leads to a claim against us, you agree to cover our reasonable costs of that claim, including reasonable legal fees and any amount we have to pay, to the extent the law allows. We'll tell you about the claim and may handle it ourselves.</p>

    <h3>Ending your use</h3>
    <p>You can stop at any time and delete your account in Settings. We may suspend or close accounts that break these terms or put the service or other people at risk.</p>

    <h3>Our code and content</h3>
    <p>Studyboard's code, design, text and graphics belong to Studyboard and are protected by copyright. We give you a personal, non-transferable right to use the app and the website. You may not copy, modify, redistribute, sell, host or frame Studyboard, decompile or reverse engineer it, or use its code or design to make another product. The parts Studyboard is built with keep their own licenses: see About in the app.</p>

    <h3>Disputes</h3>
    <p>If you have a problem with Studyboard, write to us first at ${contact()}; most things can be sorted out quickly. Before starting a legal claim, either of us will give the other a written description of the problem and 30 days to try to resolve it informally. Any claim must be brought in the state or federal courts located in the State of Washington, United States, unless the law where you live gives you the right to bring it there.</p>

    <h3>Other terms</h3>
    <p>These terms, the Privacy Policy and anything shown when you buy are the whole agreement between you and us about Studyboard. If part of these terms can't be enforced, the rest still applies. If we don't enforce something right away, we can still enforce it later. You can't transfer your account or these terms to someone else; we may transfer them as part of a sale or reorganization of Studyboard. We aren't responsible for delays or failures caused by things outside our reasonable control, such as outages at the services Studyboard runs on. The parts of these terms that by their nature should last after you stop using Studyboard (such as copyright complaints, covering claims, the limits of liability and disputes) keep applying.</p>

    <h3>Changes, law and contact</h3>
    <p>We may update these terms. If a change matters, we will update the date above and tell you in the app. Using Studyboard after that means you accept the new terms. These terms are governed by the laws of the State of Washington, United States. Questions: ${contact()}.</p>`;

  const ABOUT = () => `
    <div class="about-top"><div class="about-name">Studyboard</div><div class="about-ver">Version ${VERSION}${DESK && DESK.version ? ` (desktop ${esc(String(DESK.version))})` : ""}</div></div>
    <p>A calm student planner for courses, deadlines, study sessions and flashcards. It works without an account and without internet.</p>
    <p class="mini">© ${year()} Connor Pelkmans (Studyboard). All rights reserved.</p>
    <p class="mini">Build ${esc(typeof BUILD_ID === "string" ? BUILD_ID : "")}. Anonymous crash reports are ${window.SBERR && SBERR.enabled() ? "on" : "off"}; change this in Settings, Send Anonymous Crash Reports.</p>
    <h3>Learn more</h3>
    <div class="menu-list about-links">
      <button type="button" data-act="legal-privacy"><span>Privacy Policy</span></button>
      <button type="button" data-act="legal-terms"><span>Terms of Service</span></button>
      <button type="button" data-act="bug-open"><span>Report a Bug or Send Feedback</span></button>
    </div>
    <h3>Credits and licenses</h3>
    <ul class="about-credits">
      <li><b>Atkinson Hyperlegible</b> and <b>Atkinson Hyperlegible Next</b> typefaces, by the Braille Institute. SIL Open Font License 1.1.</li>
      <li><b>Lexend</b> typeface, by the Lexend Project Authors. SIL Open Font License 1.1.</li>
      <li><b>Permanent Marker</b> typeface (the Whiteboard's marker writing), by Font Diner, Inc. Apache License 2.0.</li>
      <li><b>Patrick Hand</b>, <b>Caveat</b>, <b>Kalam</b> and <b>Gochi Hand</b> typefaces (the Whiteboard's writing styles), by Patrick Wagesreiter, the Caveat Project Authors, Indian Type Foundry and HT Fonts. SIL Open Font License 1.1.</li>
      <li><b>PDF.js</b> (pdfjs-dist 6.4.299), by Mozilla, reads the PDFs you import. Apache License 2.0.</li>
      <li><b>fzstd</b> 0.1.1, by Arjun Barrett, unpacks newer Anki files when you import them. MIT License.</li>
      <li><b>Supabase JS</b>, by Supabase, connects to your account. MIT License.</li>
      <li><b>Electron</b>, by the OpenJS Foundation, runs the desktop app. MIT License.</li>
      <li><b>Lucide</b> icons, by Lucide Icons and Contributors (some derived from Feather, by Cole Bemis), are the starting point for course icons you make with Create. ISC License (Feather: MIT License).</li>
    </ul>
    <details class="about-lic"><summary>Lucide and Feather licenses</summary><pre>${esc(LU_LICENSE)}</pre></details>
    <p class="mini">Full notices are in THIRD-PARTY-NOTICES.md in the project's files. Support: ${contact()}.</p>`;

  /* Sheets */
  function legalSheet(title, html, back){
    backFn = back || null;
    openSheet(`<div class="sheet legal-sheet">${head(title)}<div class="sheet-body legal" tabindex="0">${html}</div>
      <div class="sheet-foot">${back ? `<button type="button" class="btn" data-act="legal-back">Back</button>` : ""}<span class="spacer"></span><button type="button" class="btn primary" data-act="close">Close</button></div></div>`);
    const b = dlg.querySelector(".legal"); if (b) b.scrollTop = 0;
  }
  const showPrivacy = back => legalSheet("Privacy Policy", PRIVACY(), back);
  const showTerms = back => legalSheet("Terms of Service", TERMS(), back);
  const showAbout = back => legalSheet("About Studyboard", ABOUT(), back);
  // Where "Back" goes from the sheet that the link was in
  function backFor(el){
    if (el && el.closest(".sb-acct")) {
      const f = el.closest("form"), mode = f && f.dataset.mode || "signin", em = f && f.querySelector("input[name=email]");
      const email = em ? em.value.trim() : "";
      return () => sbSignInSheet(mode, email);
    }
    if (el && el.closest(".plan-sheet") && window.PLAN && PLAN.openSheet) return () => PLAN.openSheet();
    if (el && el.closest(".about-links")) { const keep = backFn; return () => showAbout(keep); }
    return () => menuSheet();
  }
  // One line for the sign-in screen
  function line(){
    return `<p class="mini legal-line" style="margin:0">By continuing you agree to the <button type="button" class="link-btn" data-act="legal-terms">Terms of Service</button> and the <button type="button" class="link-btn" data-act="legal-privacy">Privacy Policy</button>.</p>`;
  }

  /* Delete My Account and Data */
  const canDelete = () => { try { return !inPreview() && !!sb && !!sbUser; } catch (e) { return false; } };
  function deleteErr(e){
    const m = String((e && (e.message || e.error_description)) || e || "");
    if (e && (e.code === "PGRST202" || e.status === 404) || /could not find the function|schema cache|not found/i.test(m)) return `Account deletion isn't switched on for this server yet. Email ${SUPPORT} and ask us to delete your account.`;
    if (/failed to fetch|network|load failed|timeout/i.test(m)) return "Couldn't reach the server. Check your connection and try again.";
    if (/SB_NOT_SIGNED_IN|jwt|not authenticated/i.test(m)) return "You've been signed out. Sign in again, then try again.";
    if (/SB_REAUTH/.test(m)) return "For your safety, enter your password (or sign in again), then try again.";
    if (/SB_CARD_SUBSCRIPTION/.test(m)) return "Cancel your plan first (Studyboard Pro, Manage Plan), then try again.";
    try { return typeof sbWords === "function" ? sbWords(e) : "Something went wrong. Try again in a moment."; } catch (x) { return "Something went wrong. Try again in a moment."; }
  }
  async function listFiles(prefix, depth){
    const out = [];
    for (let off = 0; off < 5000; off += 100) {
      const {data, error} = await sb.storage.from(SB_BUCKET).list(prefix, {limit: 100, offset: off});
      if (error || !data || !data.length) break;
      for (const o of data) {
        if (o.id === null || o.id === undefined) { if (depth < 3) out.push(...await listFiles(prefix + "/" + o.name, depth + 1)); }
        else out.push(prefix + "/" + o.name);
      }
      if (data.length < 100) break;
    }
    return out;
  }
  async function removeFiles(uid){
    try {
      const files = await listFiles(uid, 0);
      for (let i = 0; i < files.length; i += 100) await sb.storage.from(SB_BUCKET).remove(files.slice(i, i + 100));
    } catch (e) { }
  }
  async function wipeDevice(){
    try { localStorage.clear(); } catch (e) {}
    try { sessionStorage.clear(); } catch (e) {}
    try {
      const names = indexedDB.databases ? (await indexedDB.databases()).map(d => d.name).filter(Boolean) : ["studyboard-sync", "studioso-fs", "studyboard-ui-cache", "studyboard-photos"];
      names.forEach(n => { try { indexedDB.deleteDatabase(n); } catch (e) {} });
    } catch (e) {}
    try { if (window.caches) for (const k of await caches.keys()) await caches.delete(k); } catch (e) {}
  }
  /* What plan the person pays for, from the plan module */
  const planEnt = () => { try { return typeof PLAN !== "undefined" && PLAN && PLAN.entitlement ? PLAN.entitlement() : null; } catch (e) { return null; } };
  const payingNow = e => !!e && e.plan === "pro" && (!e.pro_until || Date.parse(e.pro_until) > Date.now());
  const storeSub = () => { const e = planEnt(); return payingNow(e) && ["apple", "google", "revenuecat"].includes(e.source) && e.will_renew !== false; };
  const cardSub = () => { const e = planEnt(); return payingNow(e) && e.source === "stripe"; };
  const APPLE_SUBS = "https://apps.apple.com/account/subscriptions";
  // Calls the delete-account Edge Function
  async function callDelete(payload){
    let res;
    const unreachable = async error => { try { const {error: pe} = await sb.rpc("studyboard_delete_my_account_check"); if (!pe) return {kind: "missing"}; } catch (e) {} return {kind: "network", error}; };
    try { res = await sb.functions.invoke("delete-account", {body: payload}); }
    catch (e) { return unreachable(e); }
    if (!res || !res.error) return {kind: "ok", data: res && res.data};
    const err = res.error, c = err.context;
    let status = c && c.status || 0, body = null;
    try { if (c && typeof c.json === "function") body = await c.json(); } catch (e) {}
    if (status === 404 && !(body && body.error)) return {kind: "missing"};
    if (!status) return unreachable(err);
    return {kind: "http", status, body: body || {}, error: err};
  }
  const deletedList = (data, wiped) => {
    const d = (data && data.deleted) || {}, rows = [];
    rows.push("Your account and sign-in, on every device");
    rows.push("Your synced courses, tasks, notes, flashcards and settings");
    rows.push(typeof d.files_deleted === "number" ? `Your uploaded files (${d.files_deleted} deleted from storage)` : "Your uploaded files");
    rows.push("Your reminders, push devices, calendar link, devices, usage and plan record");
    rows.push("Your bug reports, shared decks and study profile");
    rows.push("Study groups you owned: passed to another member, or deleted if nobody else was in them. Your messages and activity in groups were deleted");
    if (typeof d.stripe_subscriptions_cancelled === "number" && d.stripe_subscriptions_cancelled > 0) rows.push("Your card subscription (cancelled, no further charges)");
    rows.push(wiped ? "The copy of your data on this device" : "The copy on this device was kept (you can erase it in your browser or app settings)");
    return rows;
  };
  const RETAINED = [
    "Payment records stay with Stripe, Apple or Google as the law requires. Studyboard never had your card number.",
    "Encrypted server backups can hold a copy for up to 30 days, then it is overwritten. Nothing is restored for a deleted account.",
    "Reports about abuse in study groups stay, with no link to your account.",
    "If you had an App Store subscription, cancel it in your Apple ID settings: " + APPLE_SUBS
  ];
  function deletedSheet(data, wiped, fallback){
    const keep = (data && Array.isArray(data.retained) && data.retained.length ? data.retained : RETAINED.slice(0, 3)).slice();
    if (storeSub() || fallback === "store") keep.push(RETAINED[3]);
    openSheet(`<div class="sheet" id="delDone">${head("Your Account Was Deleted")}
      <div class="sheet-body">
        <p style="margin:0" role="status"><b>Done.</b> Your Studyboard account and its online data were permanently deleted${fallback ? " (using the server's fallback method)" : ""}.</p>
        <h3 class="fsec">What was removed</h3>
        <ul class="legal-list">${deletedList(data, wiped).map(t => `<li>${esc(t)}</li>`).join("")}</ul>
        <h3 class="fsec">What we keep, and for how long</h3>
        <ul class="legal-list">${keep.map(t => `<li>${esc(t).replace(APPLE_SUBS, `<a href="${APPLE_SUBS}" target="_blank" rel="noopener">${APPLE_SUBS}</a>`)}</li>`).join("")}</ul>
        <p class="mini" style="margin:0">Questions? ${contact()}.</p>
      </div>
      <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn primary" data-act="del-done">Done</button></div></div>`);
    dlg.addEventListener("close", () => location.reload(), {once: true});
  }
  function deleteSheet(){
    if (!canDelete()) { toast("Sign in to your account first."); return; }
    const card = cardSub(), store = storeSub();
    openSheet(`<form class="sheet" id="delForm">${head("Delete My Account and Data")}
      <div class="sheet-body">
        <p style="margin:0"><b>This permanently deletes your Studyboard account and everything stored online for it.</b> It can't be undone.</p>
        <ul class="legal-list">
          <li>Your synced courses, tasks, notes, flashcards, settings and uploaded files</li>
          <li>Your reminders, devices, calendar link and plan record</li>
          <li>Study groups you own are passed to another member, or deleted if nobody else is in them. Your group messages are deleted</li>
        </ul>
        ${card ? `<p class="mini" id="delCard" style="margin:0"><b>Paid plan:</b> your card subscription is cancelled for you when the account is deleted, so you won't be charged again.</p>` : ""}
        <div id="delStore" ${store ? "" : "hidden"}>
          <p class="mini" style="margin:0"><b>Your Pro plan is billed by the App Store or Google Play.</b> Deleting your account does not cancel it. Cancel it first in your store account (iPhone and iPad: Settings, your name, Subscriptions, or <a href="${APPLE_SUBS}" target="_blank" rel="noopener">${APPLE_SUBS}</a>).</p>
          <label class="mi-check"><input type="checkbox" name="ack"> I understand that I must cancel my App Store or Google Play subscription myself</label>
        </div>
        <p class="mini" style="margin:0">The copy on this device is erased too unless you untick the box below. <button type="button" class="link-btn" data-act="export">Export a Backup First</button></p>
        <label class="mi-check"><input type="checkbox" name="wipe" checked> Also erase the copy of my data on this device</label>
        <label class="f"><span class="lh">Your password <span class="hint">Needed if you signed in more than 10 minutes ago</span></span><input type="password" name="password" id="delPw" autocomplete="current-password" data-noenter></label>
        <label class="f"><span class="lh">Type DELETE to confirm</span><input type="text" name="confirm" id="delConfirm" autocomplete="off" autocapitalize="characters" spellcheck="false" data-noenter></label>
        <p class="status-msg" id="delMsg" style="margin:0" aria-live="polite" role="status"></p>
      </div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="close">Cancel</button><span class="spacer"></span><button type="button" class="btn primary" id="delGo" data-submit disabled style="background:var(--late);border-color:var(--late);color:#fff">Delete My Account</button></div>
    </form>`, fd => {
      if (String(fd.get("confirm") || "").trim().toUpperCase() !== "DELETE") return false;
      const wipe = !!fd.get("wipe"), pw = String(fd.get("password") || ""), say = t => { const m = $("#delMsg"); if (m) m.textContent = t; }, go = $("#delGo");
      let ack = !!fd.get("ack");
      if (go) go.disabled = true;
      const stop = (msg, showStore) => { say(msg); if (showStore) { const x = $("#delStore"); if (x) x.hidden = false; } if (go) go.disabled = false; };
      (async () => {
        try {
          const uid = sbUser.id;
          if (storeSub() && !ack) { stop("Tick the box about your App Store subscription first.", true); return; }
          say("Deleting your account on the server…");
          try { await aiTrialForget(); } catch (e) {}
          const payload = {confirm: "DELETE", ack_store_subscription: ack};
          if (pw) payload.password = pw;
          const r = await callDelete(payload);
          let data = null, fallback = "";
          if (r.kind === "ok") data = r.data;
          else if (r.kind === "missing") {
            if (cardSub()) { stop("Cancel your plan first (Studyboard Pro, Manage Plan), then try again. This server can't cancel it for you yet."); return; }
            if (storeSub() && !ack) { stop("Tick the box about your App Store subscription first.", true); return; }
            if (pw && sbUser && sbUser.email) { const {error: ae} = await sb.auth.signInWithPassword({email: sbUser.email, password: pw}); if (ae) { stop("That password isn't right. Try again."); const i = $("#delPw"); if (i) i.focus(); return; } }
            const {data: why, error: ce} = await sb.rpc("studyboard_delete_my_account_check");
            if (!ce && why === "SB_REAUTH") { stop("For your safety, enter your password (or sign in again), then try again."); const i = $("#delPw"); if (i) i.focus(); return; }
            if (!ce && why === "SB_CARD_SUBSCRIPTION") { stop("Cancel your plan first (Studyboard Pro, Manage Plan), then try again. This server can't cancel it for you yet."); return; }
            say("Deleting your files…");
            await removeFiles(uid);
            say("Deleting your account…");
            const {error} = await sb.rpc("studyboard_delete_my_account");
            if (error) throw error;
            data = {deleted: {}}; fallback = storeSub() ? "store" : "rpc";
          } else if (r.kind === "network") { stop("Couldn't reach the server. Check your connection and try again."); return; }
          else {
            const b = r.body || {}, code = String(b.error || "");
            if (code === "store_subscription") { stop(b.message || "Cancel your App Store subscription first.", true); return; }
            if (code === "reauth_required" || code === "wrong_password") { stop(b.message || "Enter your password and try again."); const i = $("#delPw"); if (i) i.focus(); return; }
            if (r.status === 401) { stop("You've been signed out. Sign in again, then try again."); return; }
            stop(b.message || deleteErr(r.error)); return;
          }
          try { await sb.auth.signOut({scope: "local"}); } catch (e) {}
          try { localStorage.removeItem(OUTBOX); } catch (e) {}
          aiWipeLocal();
          if (wipe) { try { await wipeDeviceData(); } catch (e) {} await wipeDevice(); }
          deletedSheet(data, wipe, fallback);
        } catch (e) { stop(deleteErr(e)); }
      })();
      return false;
    });
    const inp = $("#delConfirm"), go = $("#delGo");
    if (inp && go) inp.addEventListener("input", () => { go.disabled = inp.value.trim().toUpperCase() !== "DELETE"; });
  }

  /* Change email and change password (both ask for the current password first) Email */
  function securitySheet(kind){
    if (!canDelete()) { toast("Sign in to your account first."); return; }
    const isMail = kind === "email", T = isMail ? "Change Email" : "Change Password";
    openSheet(`<form class="sheet" id="secForm" data-kind="${kind}">${head(T)}
      <div class="sheet-body">
        <p style="margin:0">${isMail ? `Your email is <b>${esc(sbUser.email || "")}</b>. We'll email both your current and your new address, and it changes once you confirm.` : "Choose a new password. You'll stay signed in on this device."}</p>
        <label class="f"><span class="lh">Current Password</span><input type="password" name="current" required autocomplete="current-password" autofocus></label>
        ${isMail ? `<label class="f"><span class="lh">New Email</span><input type="email" name="email" required autocomplete="email"></label>`
          : `${sbPwHtml("New Password", "new-password", {req: false, id: "secStrength"})}
             <label class="f"><span class="lh">Confirm New Password</span><input type="password" name="confirm" required minlength="8" autocomplete="new-password"></label>
             <label class="f" id="secCodeRow" hidden><span class="lh">Code from the email <span class="hint">We emailed you a security code</span></span><input type="text" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="10"></label>`}
        <p class="status-msg" id="secMsg" style="margin:0" aria-live="polite" role="status"></p>
      </div>
      <div class="sheet-foot"><button type="button" class="btn" data-act="close">Cancel</button><span class="spacer"></span><button type="button" class="btn primary" data-submit>${isMail ? "Send Confirmation" : "Save Password"}</button></div>
    </form>`, fd => {
      const say = t => { const m = $("#secMsg"); if (m) m.textContent = t; };
      const cur = String(fd.get("current") || "");
      (async () => {
        try {
          if (!cur) { say("Enter your current password."); return; }
          say("Checking…");
          const chk = await sb.auth.signInWithPassword({email: sbUser.email, password: cur});
          if (chk.error) { say(/invalid login/i.test(chk.error.message || "") ? "That current password isn't right." : sbWords(chk.error)); return; }
          if (isMail) {
            const em = String(fd.get("email") || "").trim();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em) || em.length > 254) { say("That email address doesn't look right."); return; }
            if (em.toLowerCase() === String(sbUser.email || "").toLowerCase()) { say("That's already your email."); return; }
            sbLinkAsked(); const {error} = await sb.auth.updateUser({email: em}, /^https?:/.test(location.protocol) ? {emailRedirectTo: location.origin + location.pathname} : undefined);
            if (error) throw error;
            say(`We sent a confirmation to ${sbUser.email} and to ${em}. Open both emails and confirm. Your email changes after that.`);
          } else {
            const pw = String(fd.get("password") || "");
            if (pw.length < 8) { say("Use at least 8 characters."); return; }
            if (!sbStrength(pw).ok) { say(SB_WEAK); return; }
            if (pw !== String(fd.get("confirm") || "")) { say("The two passwords don't match."); return; }
            const code = String(fd.get("code") || "").replace(/\s+/g, "");
            let r = await sb.auth.updateUser(code ? {password: pw, nonce: code} : {password: pw});
            if (r.error && /reauth|nonce/i.test(String(r.error.message || ""))) {
              if (!code) {
                await sb.auth.reauthenticate();
                const row = $("#secCodeRow"); if (row) row.hidden = false;
                say("For your security we emailed you a code. Enter it above and press Save Password again.");
                return;
              }
            }
            if (r.error) throw r.error;
            if (dlg.open) dlg.close();
            toast("Password updated");
          }
        } catch (e) { say(sbWords(e)); }
      })();
      return false;
    });
    sbPwWire(dlg);
  }

  /* Hooks */
  hook("menu", () => {
    const rows = [
      `<button data-act="legal-about" data-group="app"><span>About Studyboard<span class="sub">Version ${VERSION}, credits and licenses</span></span></button>`,
      `<button data-act="legal-privacy" data-group="app"><span>Privacy Policy<span class="sub">What Studyboard does with your information</span></span></button>`,
      `<button data-act="legal-terms" data-group="app"><span>Terms of Service<span class="sub">The rules for using Studyboard</span></span></button>`
    ];
    if (canDelete()) rows.push(`<button data-act="acct-email" data-group="account"><span>Change Email<span class="sub">Confirmed from both your old and new address</span></span></button>`, `<button data-act="acct-pass" data-group="account"><span>Change Password<span class="sub">Needs your current password</span></span></button>`);
    if (canDelete()) rows.push(`<button data-act="acct-delete" data-group="account" style="color:var(--late)"><span>Delete My Account and Data<span class="sub">Permanently remove your account and everything stored online</span></span></button>`);
    return rows.join("");
  });
  hook("act", (act, el) => {
    if (act === "legal-privacy") { showPrivacy(backFor(el)); return true; }
    if (act === "legal-terms") { showTerms(backFor(el)); return true; }
    if (act === "legal-about") { showAbout(backFor(el)); return true; }
    if (act === "legal-back") { const f = backFn; backFn = null; if (f) f(); else if (dlg.open) dlg.close(); return true; }
    if (act === "acct-email") { securitySheet("email"); return true; }
    if (act === "acct-pass") { securitySheet("password"); return true; }
    if (act === "acct-delete") { deleteSheet(); return true; }
    if (act === "del-done") { location.reload(); return true; }
    return false;
  });
  window.SBLEGAL = {line, privacy: showPrivacy, terms: showTerms, about: showAbout, version: VERSION};

  /* Left and Right Arrow move between the tabs of a tab list (Enter or Space picks one) */
  document.addEventListener("keydown", e => {
    if (!/^(ArrowLeft|ArrowRight|Home|End)$/.test(e.key) || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target, list = t && t.matches && t.matches('[role="tab"]') ? t.closest('[role="tablist"]') : null;
    if (!list || list.classList.contains("us-cats") || list.getAttribute("aria-orientation") === "vertical") return;
    const tabs = [...list.querySelectorAll('[role="tab"]')].filter(x => !x.disabled && x.offsetParent !== null), i = tabs.indexOf(t);
    if (i < 0 || tabs.length < 2) return;
    const j = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    e.preventDefault(); tabs[j].focus();
  });

  /* Closing a sheet puts keyboard focus back where it was */
  const was = new WeakMap();
  const sigOf = el => el && el.nodeType === 1 && el !== document.body ? {el, act: el.dataset && el.dataset.act, id: el.dataset && el.dataset.id, tab: el.dataset && el.dataset.tab} : null;
  const visible = el => !!el && el.isConnected && el.getClientRects().length > 0 && !el.disabled;
  function refocus(sig){
    if (!sig) return;
    const a = document.activeElement;
    if (a && a !== document.body && a.isConnected && !a.closest("dialog:not([open])")) return;
    let t = visible(sig.el) ? sig.el : null;
    if (!t && sig.act) t = [...document.querySelectorAll(`[data-act="${CSS.escape(sig.act)}"]${sig.id ? `[data-id="${CSS.escape(sig.id)}"]` : ""}`)].find(visible) || null;
    if (!t && sig.tab) t = [...document.querySelectorAll(`[data-tab="${CSS.escape(sig.tab)}"]`)].find(visible) || null;
    if (t) { try { t.focus({preventScroll: true}); } catch (e) {} }
  }
  /* Top-level sheets are exclusive */
  const TOP = ["dlg", "pomoDlg", "sxDlg", "capDlg"];
  TOP.forEach(id => {
    const d = document.getElementById(id);
    if (!d || typeof d.showModal !== "function") return;
    const open = d.showModal.bind(d);
    d.showModal = function(){
      if (d.open) return;
      let sig = sigOf(document.activeElement);
      const tour = document.getElementById("sbTour");
      if (!(tour && tour.open)) TOP.forEach(oid => {
        const o = document.getElementById(oid);
        if (!o || o === d || !o.open) return;
        if (!sig || o.contains(sig.el)) sig = was.get(o) || null;
        was.delete(o);
        try { o.close(); } catch (e) { o.removeAttribute("open"); }
      });
      was.set(d, sig);
      return open();
    };
    d.addEventListener("close", () => { const sig = was.get(d); was.delete(d); setTimeout(() => refocus(sig), 90); });
  });
  /* Header and nav buttons that open a sheet ignore double clicks and ghost taps */
  const OPENERS = {"pomo-open": "pomoDlg", "search": "sxDlg", "menu": "dlg", "ann-open": "dlg", "new-task": "dlg"};
  let lastOpen = {act: "", at: 0};
  document.addEventListener("click", e => {
    const el = e.target && e.target.closest ? e.target.closest("[data-act]") : null;
    if (!el || !OPENERS[el.dataset.act] || !el.closest("header.top, nav.tabs, .nav-foot, #fab")) return;
    const act = el.dataset.act, now = Date.now(), d = document.getElementById(OPENERS[act]);
    const tour = document.getElementById("sbTour");
    if (tour && tour.open) return;
    const same = lastOpen.act === act && now - lastOpen.at < 450;
    const open = d && d.open && (act === "pomo-open" || act === "search" ? true : !!d.querySelector(act === "menu" ? ".menu-list" : act === "ann-open" ? ".ann-sheet" : "form.sheet"));
    if (same || open) { e.stopImmediatePropagation(); e.preventDefault(); return; }
    lastOpen = {act, at: now};
  }, true);
  // Once its sheet has closed, the button works again straight away
  new Set(Object.values(OPENERS)).forEach(id => { const d = document.getElementById(id); if (d) d.addEventListener("close", () => { if (OPENERS[lastOpen.act] === id) lastOpen = {act: "", at: 0}; }); });

  /* Every sheet gets a name for screen readers */
  const nameSheet = d => {
    const h = d.querySelector("h2");
    if (h && h.textContent.trim()) d.setAttribute("aria-label", h.textContent.trim());
  };
  try { new MutationObserver(() => nameSheet(dlg)).observe(dlg, {childList: true}); } catch (e) {}
})();


