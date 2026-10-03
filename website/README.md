# Studyboard website

Plain HTML, CSS and JavaScript. No build step. Upload this whole folder to any static host (Cloudflare Pages, Netlify, GitHub Pages, S3...).

1. Edit `config.js` (Supabase URL, public anon/publishable key, app address, support email). Nothing in it is secret.
2. Search the pages for the highlighted placeholders (`support@YOUR-DOMAIN`, `YOUR NAME OR COMPANY`, ...) in `privacy.html` and `terms.html` and fill them in.
3. Serve it over HTTPS only. `_headers` carries the security headers for Netlify and Cloudflare Pages.
4. If your Supabase address is not `*.supabase.co` (a custom domain), add it to `connect-src` in the CSP meta tag of each page and in `_headers`.

Pages: `index.html` (landing, features, pricing), `account/` (sign in, sign up, reset, plan, buy, manage billing), `success.html`, `cancel.html`, `privacy.html`, `terms.html`.
Links the app uses: `account/?plan=monthly|yearly&src=app` (sign in, then checkout starts by itself).
See PRO-PLANS-GUIDE.md in the main folder for the full owner steps.
