// ============================================================================
//  STUDYBOARD WEBSITE SETTINGS  (the owner edits this one file)
// ============================================================================
//  Replace every value that says YOUR-... below. Nothing in this file is secret:
//  the "anon / publishable" key is PUBLIC BY DESIGN. It is the same key the Studyboard app
//  already ships with, and what it may do is decided by the row level security rules in
//  your database (see supabase-plans.sql), not by hiding the key.
//
//  NEVER put a service_role key, a Stripe secret key (sk_...), a webhook secret (whsec_...)
//  or the ENT_SIGNING_KEY in this file or anywhere in the website folder.
// ============================================================================
window.STUDYBOARD_SITE = {
  // Supabase > Project Settings > API > Project URL  (must be https)
  SUPABASE_URL: "https://pivcmrqcjseycjkbocmc.supabase.co",

  // Supabase > Project Settings > API > "anon" key, or the newer "publishable" key (sb_publishable_...). The PUBLIC one.
  SUPABASE_ANON_KEY: "sb_publishable_hoKTO5FRblXqHs6MvO686Q_81c5_gvd",

  // Where "Open Studyboard" and "Back to the app" go (https only).
  APP_URL: "https://studyboardapp.com",

  // Where people write to you. Shown on the Privacy and Terms pages. Replace with a real address.
  SUPPORT_EMAIL: "support@studyboardapp.com",

  // The ONLY addresses the account page may send people back to when a link contains "&return=...".
  // Anything else is ignored (this stops open redirects). Origins only, https only. APP_URL is allowed automatically.
  RETURN_ALLOWLIST: [],

  // The names of your Edge Functions (leave as they are unless you deployed them under other names).
  FUNCTIONS: { checkout: "create-checkout", portal: "create-portal-session" },

  // ---- Downloads (home page) ----
  // The version shown on the page.
  VERSION: "1.13.0",

  // Where each installer lives. While a url is "" the button stays on the page and says "coming soon" when pressed. Paste the link when
  // the installer is published (https only). Tip for Windows, Mac and Linux: publish the installers as a GitHub Release, then a link like
  //   https://github.com/YOUR-NAME/YOUR-REPO/releases/download/v1.13.0/Studyboard-Setup-1.13.0.exe
  // points at one exact file. {version} in "file" is replaced by VERSION above (the names electron-builder makes).
  DOWNLOADS: {
    windows:  { label: "Windows",              url: "", file: "Studyboard-Setup-{version}.exe",       needs: "Windows 10 or 11, 64-bit" },
    macArm:   { label: "Mac (Apple M-series)", url: "", file: "Studyboard-{version}-mac.dmg",         needs: "Macs with an M1 chip or newer" },
    macIntel: { label: "Mac (Intel)",          url: "", file: "Studyboard-{version}-mac-intel.dmg",   needs: "Macs with an Intel processor" },
    linux:    { label: "Linux",                url: "", file: "Studyboard-{version}.AppImage",        needs: "64-bit Linux, runs as an AppImage" },
    ios:      { label: "App Store",            url: "", needs: "iPhone and iPad" },       // e.g. https://apps.apple.com/app/idXXXXXXXXXX
    android:  { label: "Google Play",          url: "", needs: "Android phones and tablets" }   // e.g. https://play.google.com/store/apps/details?id=com.studioso.app
  }
};
