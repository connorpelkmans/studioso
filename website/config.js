window.STUDYBOARD_SITE = {
  // Supabase > Project Settings > API > Project URL (must be https)
  SUPABASE_URL: "https://pivcmrqcjseycjkbocmc.supabase.co",

  // Supabase > Project Settings > API > "anon" key, or the newer "publishable" key
  SUPABASE_ANON_KEY: "sb_publishable_hoKTO5FRblXqHs6MvO686Q_81c5_gvd",

  // Where "Open Studyboard" and "Back to the app" go (https only)
  APP_URL: "https://studyboardapp.com",

  // Where people write to you
  SUPPORT_EMAIL: "support@studyboardapp.com",

  RETURN_ALLOWLIST: [],

  // The names of your Edge Functions
  FUNCTIONS: { checkout: "create-checkout", portal: "create-portal-session" },

  // -- Downloads (home page). VERSION is the web app's; each installer's label and file name use the version in its own url,
  // and `npm run check:release` fails while those urls are older than package.json (upload the installers, then bump the links)
  VERSION: "1.15.6",

  // Where each installer lives
  DOWNLOADS: {
    // store: the Microsoft Store page
    windows:  { label: "Windows",              store: "https://apps.microsoft.com/detail/9N8PHL54N3SN?ocid=pdpshare", url: "https://github.com/connorpelkmans/installers/releases/download/v1.14.4/Studyboard-Setup-1.14.4.exe", file: "Studyboard-Setup-{version}.exe",       needs: "Windows 10 and 11" },
    macArm:   { label: "Mac (Apple M-series)", url: "https://github.com/connorpelkmans/installers/releases/download/v1.15.6/Studyboard-1.15.6-mac-universal.dmg", file: "Studyboard-{version}-mac-universal.dmg", needs: "Macs with an M1 chip or newer" },
    macIntel: { label: "Mac (Intel)",          url: "https://github.com/connorpelkmans/installers/releases/download/v1.15.6/Studyboard-1.15.6-mac-universal.dmg", file: "Studyboard-{version}-mac-universal.dmg", needs: "Macs with an Intel processor" },
    linux:    { label: "Linux",                url: "", file: "Studyboard-{version}.AppImage",        needs: "64-bit Linux, runs as an AppImage" },
    // appId: the app's Apple ID, digits only (App Store Connect > your app > App Information > Apple ID). Once set, the iPhone
    // download button goes to the App Store, and every page shows Safari's Smart App Banner: "Open" when Studyboard is installed,
    // "Get" (to the App Store) when it isn't. The banner is added by npm run build:site (scripts/build-site.js).
    ios:      { label: "App Store",            url: "https://apps.apple.com/us/app/studyboard-student-planner/id6828721365", appId: "6828721365", needs: "iPhone and iPad" },
    android:  { label: "Google Play",          url: "", needs: "Android phones and tablets" },
    // store: the extension's Chrome Web Store page
    chrome:   { label: "Chrome Web Store",     store: "https://chromewebstore.google.com/detail/studyboard-school-sync/ibibaefpedmlgaamopopcoelnnaaollf", needs: "Chrome, Edge, Brave and Firefox on a computer" },
    // store: the extension's Firefox Add-ons page
    firefox:  { label: "Firefox Add-ons",      store: "https://addons.mozilla.org/en-US/firefox/addon/studyboard-school-sync/" },
    // store: the extension's Microsoft Edge Add-ons page
    edge:     { label: "Edge Add-ons",         store: "https://microsoftedge.microsoft.com/addons/detail/studyboard-school-sync/naphniaaapegibhbnnhmgimeegbodikh" }
  }
};
