# Website security headers (Studyboard web app / PWA)

Headers are the part of web security that a `<meta>` tag cannot do. Most importantly, **`frame-ancestors` (clickjacking protection) is ignored when a CSP is delivered in a `<meta>` tag**, and so are HSTS, `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy`. They have to be real HTTP response headers from wherever the site is hosted.

Files in this repo:

| File | What it is |
| --- | --- |
| `_headers` | Ready to deploy on **Netlify** or **Cloudflare Pages** (put it next to `index.html`). Relaxed baseline: allows the page's two inline scripts with `'unsafe-inline'`, so it never goes stale. |
| `make-headers.js` | `node make-headers.js` writes `_headers.strict`: the same file, but with the inline scripts allowed by SHA-256 hash instead of `'unsafe-inline'`. Deploy it as `_headers`. **Re-run it every time `index.html` changes**, because a stale hash blocks the page. |
| this file | Nginx and Apache snippets, and what each header is for. |

If the rel-sec agent's `<meta http-equiv="Content-Security-Policy">` is also in `index.html`, both policies apply and the browser enforces the intersection. Keep the two in step (the header one is the authority; the meta one is a fallback for hosts that cannot set headers).

## The headers

| Header | Value | Why |
| --- | --- | --- |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | The browser never talks to the site over plain http again. Only add `preload` (and submit at hstspreload.org) when every subdomain is https. |
| `X-Content-Type-Options` | `nosniff` | A file served as text is never run as a script. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Links to other sites only reveal the site's address, not the page's path or query (deck and group links carry codes). |
| `Permissions-Policy` | camera, microphone, geolocation, payment, USB and the rest switched off | Studyboard uses none of them; this also stops any injected or third-party code from asking. (`clipboard-write` and `fullscreen` stay for "Copy link" and full screen.) |
| `Content-Security-Policy` | see `_headers` | Limits where scripts, styles, fonts, images and network calls can come from; blocks plugins (`object-src 'none'`), `<base>` tricks (`base-uri 'none'`), and **framing by other sites (`frame-ancestors 'none'`)**. |
| `X-Frame-Options` | `DENY` | Same as `frame-ancestors`, for old browsers. |
| `Cross-Origin-Opener-Policy` | `same-origin` | Pages opened from Studyboard cannot reach back into it through `window.opener`. |
| `Cache-Control: no-cache` on `/sw.js`, `/index.html`, the manifests | | The service worker and the app shell are re-checked on every load, so a fix reaches everyone quickly (the worker itself serves the offline copy). |

### What the Content-Security-Policy allows, and why

* `script-src 'self'` plus the two inline scripts (hash or `'unsafe-inline'`) plus `cdn.jsdelivr.net` (only the fallback copy of supabase-js, which is SRI-pinned; the primary copy is `vendor/supabase-js-2.117.2.umd.js` on your own site) and `cdnjs.cloudflare.com` (pdf.js). Deploy the `vendor/` folder with the site. If you also host pdf.js yourself (the desktop app already does, see `prepare.js`), delete both hosts from the policy.
* `style-src 'self' 'unsafe-inline'` and `font-src 'self' data:`: fonts are self-hosted from `vendor/fonts/` (the Google Fonts hosts were removed from the policy).
* `connect-src 'self' https: wss: blob: data:`: the Supabase project (its address is chosen by the person, or by you) and the AI company the person picked with their own key (`generativelanguage.googleapis.com`, `api.anthropic.com`, `api.openai.com`). If you only ever use your own Supabase project and only these three AI hosts, replace `https:` with those exact hosts. That is stricter and recommended for the App Store build, but it would block people who point the app at their own server.
* `img-src ... https:`: pictures in LMS announcements and links. `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'none'` close the remaining doors.
* The page has **no inline event handlers** (`onclick=` and friends) and does not use `eval` or `new Function`, so `'unsafe-eval'` is not needed (pdf.js is started with `isEvalSupported: false`).

## Nginx

```nginx
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "accelerometer=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), usb=(), serial=(), hid=(), bluetooth=(), clipboard-write=(self), fullscreen=(self)" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header X-Frame-Options "DENY" always;
# One line. Copy the value from _headers (or _headers.strict) after "Content-Security-Policy:".
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; connect-src 'self' https: wss: blob: data:; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; manifest-src 'self'; upgrade-insecure-requests" always;

location = /sw.js { add_header Cache-Control "no-cache"; add_header Service-Worker-Allowed "/"; # repeat the add_header lines above here: nginx drops inherited headers when a location sets its own
}
location = /index.html { add_header Cache-Control "no-cache"; }
```

Note: in nginx, `add_header` lines inside a `location` replace (not add to) the ones from the `server` block, so repeat the security headers in any `location` that sets its own `add_header`.

## Apache (`.htaccess`, needs `mod_headers`)

```apache
<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "accelerometer=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), usb=(), serial=(), hid=(), bluetooth=(), clipboard-write=(self), fullscreen=(self)"
  Header always set Cross-Origin-Opener-Policy "same-origin"
  Header always set X-Frame-Options "DENY"
  Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; connect-src 'self' https: wss: blob: data:; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; manifest-src 'self'; upgrade-insecure-requests"
  <FilesMatch "^(sw\.js|index\.html|manifest\.webmanifest|today\.webmanifest)$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
  <Files "sw.js">
    Header set Service-Worker-Allowed "/"
  </Files>
</IfModule>
AddType application/manifest+json .webmanifest
# Force https
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

## GitHub Pages

GitHub Pages cannot set response headers. Either put Cloudflare (free) in front of it and add the headers there (Rules > Transform Rules > Modify Response Header), or move to Cloudflare Pages / Netlify, which read `_headers`. Until then rely on the `<meta>` CSP in `index.html`, and know that `frame-ancestors`, HSTS and `nosniff` are not in effect.

## Checking it

* `curl -sI https://YOUR-SITE/ | grep -iE "strict-transport|content-security|x-content-type|referrer|permissions|frame"`
* securityheaders.com and observatory.mozilla.org grade the result.
* Open the site, open the browser console, use every tab once: there should be no "Refused to ..." messages.

## Service worker notes (`sw.js`)

* **Scope**: the worker sits at the site root, so it controls the whole origin. Do not host other apps on the same origin (or add a `Service-Worker-Allowed` / different path for them), because they would be served through Studyboard's cache rules.
* **What it caches**: the app shell and same-origin files (GET only), plus the vendored fonts and supabase-js (precached) and the CDN libraries by host name. Your data, your Supabase account and AI calls are never cached (they are other origins and are not on the list, and non-GET requests are ignored). Cached copies hold no sign-in tokens.
* **Messages**: the worker only accepts "widget data" messages from Studyboard's own pages (checked by `event.source.url`), and the page only listens to its own worker. There is no `window.postMessage` listener anywhere in the app, so there is no cross-origin message surface.
* **Update behaviour**: `skipWaiting` + `clients.claim` means a new worker takes over immediately. With `no-cache` on `sw.js` and `index.html` (above) a fixed version reaches people on their next visit.
* **Push**: reminder pushes are shown with data from the push payload. Only your own Supabase function can send them (the push service authenticates the sender with your VAPID key). The "Snooze" and "Mark done" buttons call the address in the payload, which must be `https:`; keep the VAPID private key secret.
