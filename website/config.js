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

  // -- Downloads (home page)
  VERSION: "1.15.0",

  // Where each installer lives
  DOWNLOADS: {
    // store: the Microsoft Store page
    windows:  { label: "Windows",              store: "https://apps.microsoft.com/detail/9N8PHL54N3SN?ocid=pdpshare", url: "https://github.com/connorpelkmans/installers/releases/download/v1.14.4/Studyboard-Setup-1.14.4.exe", file: "Studyboard-Setup-{version}.exe",       needs: "Windows 10 and 11" },
    macArm:   { label: "Mac (Apple M-series)", url: "https://github.com/connorpelkmans/installers/releases/download/v1.14.4/Studyboard-1.14.4-mac.dmg", file: "Studyboard-{version}-mac.dmg", needs: "Macs with an M1 chip or newer" },
    macIntel: { label: "Mac (Intel)",          url: "https://github.com/connorpelkmans/installers/releases/download/v1.14.4/Studyboard-1.14.4-mac-intel.dmg", file: "Studyboard-{version}-mac-intel.dmg", needs: "Macs with an Intel processor" },
    linux:    { label: "Linux",                url: "", file: "Studyboard-{version}.AppImage",        needs: "64-bit Linux, runs as an AppImage" },
    ios:      { label: "App Store",            url: "", needs: "iPhone and iPad" },
    android:  { label: "Google Play",          url: "", needs: "Android phones and tablets" },
    // store: the extension's Chrome Web Store page
    chrome:   { label: "Chrome Web Store",     store: "https://chromewebstore.google.com/detail/studyboard-school-sync/ibibaefpedmlgaamopopcoelnnaaollf", needs: "Chrome, Edge and Brave on a computer" }
  }
};
