# Sign in with Apple and Google: one-time setup

The app already shows **Continue with Apple** and **Continue with Google** on the Sign In and Create Account sheets. Until the steps below are done, those buttons return an error from Supabase ("provider is not enabled").

| Where | Apple | Google |
|---|---|---|
| Web | Apple's page, then back to the site | Google's page, then back to the site |
| iPhone app | Apple's own sign-in sheet (Face ID) | Apple's secure sign-in window, back through `studyboard://auth-callback` |
| Android app | A browser tab, back through `studyboard://auth-callback` | Same |
| Mac / Windows app | The computer's browser, back to a one-time page on `127.0.0.1` | Same |

Your Supabase project's callback address, used below, is:

```
https://pivcmrqcjseycjkbocmc.supabase.co/auth/v1/callback
```

## 1. Supabase: allowed return addresses

In Supabase, open **Authentication → URL Configuration → Redirect URLs** and add each of these:

- your web app's address followed by `/**`, for example `https://studyboardapp.com/**`
- `studyboard://auth-callback`
- `http://127.0.0.1:43821/auth`
- `http://127.0.0.1:43822/auth`
- `http://127.0.0.1:43823/auth`

## 2. Google

1. In the [Google Cloud Console](https://console.cloud.google.com/), open **APIs & Services → OAuth consent screen**.
   - Set it up as **External**, with the app name, a support email and the logo.
   - Add links to your privacy policy and terms.
   - Scopes: `email`, `profile`, `openid`.
   - Publish it.
2. Open **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Under **Authorized redirect URIs**, add the Supabase callback address shown above.
   - Copy the **Client ID** and **Client secret**.
3. In Supabase, open **Authentication → Sign In / Providers → Google**.
   - Turn it on.
   - Paste the Client ID and the secret, then save.

Nothing else is needed for the iPhone, Android or desktop apps. They all use this same web sign-in, opened outside the app.

## 3. Apple

You need an Apple Developer account.

1. In **Certificates, Identifiers & Profiles → Identifiers**, open the App ID **com.studyboardapp.studyboard** and tick **Sign in with Apple**.
2. Create a **Services ID** for the web sign-in, for example `com.studyboardapp.studyboard.signin`.
   - Tick **Sign in with Apple** and click **Configure**.
   - **Domains:** `pivcmrqcjseycjkbocmc.supabase.co`, plus your web app's domain.
   - **Return URLs:** the Supabase callback address shown above.
3. Under **Keys**, create a key with **Sign in with Apple** ticked, linked to the App ID.
   - Download the `.p8` file. Apple only lets you download it once.
   - Note the **Key ID** and your **Team ID**.
4. In Supabase, open **Authentication → Sign In / Providers → Apple** and turn it on.
   - **Client IDs:** `com.studyboardapp.studyboard.signin,com.studyboardapp.studyboard`. That is the Services ID for the web and the bundle ID for the iPhone app, comma-separated.
   - **Secret Key:** generate it from the `.p8` file, Team ID, Key ID and Services ID. The Supabase provider page links a generator.
   - **The secret expires after 6 months.** Set a reminder to generate a new one, or Apple sign-in on the web, Android and desktop stops working. The iPhone app's own sheet keeps working.
5. In Xcode, select the **App** target, open **Signing & Capabilities**, click **+ Capability** and add **Sign in with Apple**.

## 4. Mac App Store build

The Mac App Store build needs the `com.apple.security.network.server` entitlement for the one-time return page. It's already added in `build-resources/entitlements.mas.plist`.

## 5. Before App Review

- **Revoking Apple sign-in on account deletion:** when someone who signed in with Apple deletes their account, Apple requires the app to revoke their Apple token through Apple's REST API. That isn't built yet; ask for it before you submit.
- **Birthday check:** accounts made with Apple or Google skip the birthday question and the under-13 parent check on the email sign-up form. If that check matters for your launch, ask for it to be added after a first sign-in with Apple or Google.
- **Test each combination once:**
  - Apple and Google on the web
  - Apple and Google on iPhone
  - Apple and Google in the Mac app
  - Signing in with Apple or Google using the same email as an existing email-and-password account. Supabase links them when the email is confirmed by both.
