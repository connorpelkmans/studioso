# Sign in with Apple, Google and Microsoft: one-time setup

The app (Sign In and Create Account sheets) and the website's Account page both show **Continue with Google** and **Continue with Microsoft** everywhere, and **Continue with Apple** on Apple devices. Until a provider's steps below are done, its button says "Signing in with … isn't turned on yet. Use your email for now."

| Where | Apple | Google | Microsoft |
|---|---|---|---|
| Web | Apple's page, then back to the site | Google's page, then back to the site | Microsoft's page, then back to the site |
| iPhone app | Apple's own sign-in sheet (Face ID) | Apple's secure sign-in window, back through `studyboard://auth-callback` | Same as Google |
| Android app | A browser tab, back through `studyboard://auth-callback` | Same | Same |
| Mac / Windows app | The computer's browser, back to a one-time page on `127.0.0.1` | Same | Same |

Nothing in the iPhone, Android or desktop apps needs changing or rebuilding for a provider: they all open the provider's page outside the app and take back what Supabase returns. Turning a provider on is done entirely in its own console and in Supabase.

Your Supabase project's callback address, used below, is:

```
https://pivcmrqcjseycjkbocmc.supabase.co/auth/v1/callback
```

## 1. Supabase: allowed return addresses (shared by all three)

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

## 4. Microsoft

Microsoft sign-in works with **personal Microsoft accounts** (Outlook, Hotmail, Xbox) and **school or work accounts** (Microsoft 365, which many schools use). In Supabase it's called **Azure**.

You need a free Microsoft account. You don't need an Azure subscription or a credit card for this part.

**Already set up Outlook Calendar sync, OneDrive or OneNote?** (SETUP-GUIDE.md) Then you already have the **Studyboard** app registration, and its client ID is your `MS_CLIENT_ID` function secret. Use that same registration for sign-in. Students then see the one Studyboard app they already trust, and its publisher verification (D2) covers sign-in too. In that case:
- In step A, skip **New registration**. Open the existing **Studyboard** registration, go to **Authentication → Web → Redirect URIs**, add the Supabase callback address shown at the top, and save. Its client ID is on **Overview**.
- In step B, you can reuse its current secret if you still have the value. Otherwise make a new one: Microsoft keeps old secrets working until they expire, so nothing else breaks.
- Do C. D is probably already done (check below). Then do E.

### A. Register the app
1. Open the [Microsoft Entra admin center](https://entra.microsoft.com) and sign in. (The same pages are in the [Azure portal](https://portal.azure.com) under **Microsoft Entra ID**.)
2. Go to **Identity → Applications → App registrations → New registration**.
   - **Name:** `Studyboard` (students see this on Microsoft's sign-in page).
   - **Supported account types:** choose **Accounts in any organizational directory (any Microsoft Entra ID tenant, multitenant) and personal Microsoft accounts**. This is the one that lets both school and personal accounts sign in.
   - **Redirect URI:** platform **Web**, address: the Supabase callback address shown at the top.
   - Click **Register**.
3. On the app's **Overview** page, copy the **Application (client) ID**.

### B. Create the secret
1. Open **Certificates & secrets → Client secrets → New client secret**.
2. Description `Supabase`; expiry: the longest offered (24 months).
3. Copy the secret's **Value** right away (not the "Secret ID"). Microsoft only shows it once.
4. **The secret expires.** Set a reminder a few weeks before. To renew: make a new secret, paste it into Supabase, then delete the old one. If it lapses, Microsoft sign-in stops working everywhere until it's replaced.

### C. Make sure Microsoft sends a verified email
Supabase needs the account's email, and needs to know Microsoft verified it. Otherwise someone could create a school tenant with an email they don't own and sign in as that person.
1. Open **Token configuration → Add optional claim → ID → email**. Click **Add**. If asked, tick **Turn on the Microsoft Graph email permission**.
2. Open **Manifest**. Find `"optionalClaims"`, and in its `"idToken"` list add `xms_edov` next to `email`:
   ```json
   "idToken": [
     {"name": "email", "source": null, "essential": false, "additionalProperties": []},
     {"name": "xms_edov", "source": null, "essential": false, "additionalProperties": []}
   ]
   ```
   Save. (`xms_edov` tells Supabase whether the email's domain was verified.)
3. Open **API permissions** and check that Microsoft Graph has **email**, **openid**, **profile** and **offline_access** (delegated). Add any that are missing.

### D. Your name, logo and links (what students see)
1. **Branding & properties:** add the logo, home page `https://studyboardapp.com`, and the Terms and Privacy links.
2. **Publisher verification (needed for school accounts).** Many schools only let students sign in to apps from a *verified publisher*. Without it, school accounts see "Need admin approval", while personal accounts still work.
   - First prove you own the domain. The website already serves `.well-known/microsoft-identity-association.json` (with and without `.json`, as JSON; see `_headers`), listing your existing app IDs. If you made a **new** registration in step A, add its client ID to that file's `associatedApplications` list and deploy the website. Then set the publisher domain to `studyboardapp.com` in **Branding & properties → Publisher domain**.
   - Then click **Add MPN ID to verify publisher** and enter a Microsoft AI Cloud Partner Program ID. Joining the program is free.
   - Some schools block all outside apps whatever you do. Their students can use Google or their email instead.

### E. Turn it on in Supabase
1. Open **Authentication → Sign In / Providers → Azure** and turn it on.
2. **Application (client) ID:** from step A.
3. **Secret Value:** from step B.
4. **Azure Tenant URL:** leave it **empty**. Empty means the "common" endpoint: every Microsoft account, personal and school.
5. Save. The return addresses from Part 1 are already shared by every provider, so there's nothing more to add.

### F. Test it
- On the web, in the Windows or Mac app, and on iPhone and Android: sign in once with a personal Microsoft account and once with a school account.
- Then sign in with Microsoft using the same email as an existing email-and-password account. Supabase links the two when the email is verified on both sides (which step C makes possible).

## 5. Mac App Store build

The Mac App Store build needs the `com.apple.security.network.server` entitlement for the one-time return page. It's already added in `build-resources/entitlements.mas.plist`.

## 6. Before App Review

- **Revoking Apple sign-in on account deletion (built in, needs setup).** Apple requires that deleting an account made with Sign in with Apple also revokes it with Apple. After an Apple sign-in in the iPhone app, the app sends Apple's one-time code to the server. The `delete-account` function swaps the code for a token and keeps it, then revokes the token with Apple before deleting the account. When an Apple account is deleted in the iPhone app, Apple's sheet appears once more to confirm, which also covers accounts made before this was set up. To turn it on:
  1. Run `supabase-apple-signin.sql` in the SQL Editor, then run `supabase-lean.sql` again.
  2. Deploy `delete-account` again.
  3. Add these Supabase function secrets:
     - `APPLE_TEAM_ID`: your 10-character Team ID
     - `APPLE_SIGNIN_KEY_ID`: the Key ID of the Sign in with Apple key from Part 3C
     - `APPLE_SIGNIN_PRIVATE_KEY`: the whole text of that `.p8` file
     - `APPLE_BUNDLE_ID` = `com.studyboardapp.studyboard`
  4. Test it: sign in with Apple on your iPhone, then delete the account. Settings → [your name] → Sign-In & Security → Sign in with Apple should no longer list Studyboard.
- **Birthday check:** accounts made with Apple, Google or Microsoft skip the birthday question and the under-13 parent check on the email sign-up form. If that check matters for your launch, ask for it to be added after a first sign-in with one of them.
- **Test each combination once:**
  - Apple and Google on the web
  - Apple and Google on iPhone
  - Apple and Google in the Mac app
  - Microsoft on the web, iPhone, Android, Mac and Windows (Part 4F)
  - Signing in with Apple, Google or Microsoft using the same email as an existing email-and-password account. Supabase links them when the email is confirmed by both.
