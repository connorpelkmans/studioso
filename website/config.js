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
  FUNCTIONS: { checkout: "create-checkout", portal: "create-portal-session" }
};
