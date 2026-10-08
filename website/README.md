# Studyboard website

Plain HTML, CSS and JavaScript. No build step. Upload this whole folder to any static host (Cloudflare Pages, Netlify, GitHub Pages, S3...).

1. Edit `config.js` (Supabase URL, public anon/publishable key, app address, support email). Nothing in it is secret.
2. Search the pages for the highlighted placeholders (`support@YOUR-DOMAIN`, `YOUR NAME OR COMPANY`, ...) in `privacy.html` and `terms.html` and fill them in.
3. Serve it over HTTPS only. `_headers` carries the security headers for Netlify and Cloudflare Pages.
4. If your Supabase address is not `*.supabase.co` (a custom domain), add it to `connect-src` in the CSP meta tag of each page and in `_headers`.

Pages: `index.html` (landing, features, pricing), `account/` (sign in, sign up, reset, plan, buy, manage billing), `success.html`, `cancel.html`, `privacy.html`, `terms.html`.
Links the app uses: `account/?plan=monthly|yearly&src=app` (sign in, then checkout starts by itself).
See PRO-PLANS-GUIDE.md in the main folder for the full owner steps.


## Look, downloads and fonts (new design)

- `assets/site.css` holds every style (the same colors, fonts and graph-paper background as the app, light and dark). No inline styles or scripts are used, because the pages have a strict Content-Security-Policy.
- `assets/fonts/` and `assets/fonts.css` are self-hosted copies of Lexend and Atkinson Hyperlegible Next (SIL OFL licenses included), so no outside font service is needed.
- `assets/logo-light.webp` and `assets/logo-dark.webp` are the wordmark for light and dark.
- **Installers:** open `config.js` and paste each link into `DOWNLOADS` (Windows, Mac Apple M-series, Mac Intel, Linux, App Store, Google Play). While a link is empty its button stays on the page and says "coming soon" when pressed. The home page detects the visitor's device and highlights the right one. To preview another device add `?os=` to the address: `windows`, `mac-arm`, `mac-intel`, `mac-unknown`, `linux`, `ios` or `android`.
- `VERSION` in `config.js` is the version number shown on the page.

## Screenshots of the real app

The home page shows real screens from the app (`assets/screens/`, light and dark, plus one image per theme). To refresh them after the app changes, run `node tools/capture-site-screens.js <folder>` (Playwright and Chromium; it runs the app on a fixed date with made-up student data, with AI shown as switched on and no request made), then save the PNGs as WebP into `assets/screens/` (for example with Pillow, `Image.save(name + ".webp", quality=80)`; theme images at 640x400, the others at 1120x700).

## Live theme tiles and companions (home page)

The nine theme tiles run the app's own scenes, and the companions are the app's own art and animation code. The files `assets/scenes-lib.js`, `assets/companions-data.js` and
`assets/companions-engine.js` are copies made from `index.html`. After the app's scenes or companions change, run `python3 tools/make-website-assets.py` from the repo root
and publish the new files. `assets/scenes.js` and `assets/companions.js` are the website's own code. They load the big files only when a tile or companion comes near the
screen, stop when it is off screen or the tab is hidden, and respect "reduce motion" (no movement, but companions still say a line now and then).
