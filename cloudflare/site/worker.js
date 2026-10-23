// Studyboard website (Cloudflare Workers with static assets)
import {handlePublic, isPublicPath} from "./public-pages.js";
// Public flashcards and quizzes
const PASS = /^\/functions\/v1\/(cloud-files|calendar-sync)$/;
// The privacy policy and terms live in the website folder; the short addresses people
const MOVED = {"/privacy": "/website/privacy", "/privacy.html": "/website/privacy", "/terms": "/website/terms", "/terms.html": "/website/terms"};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (isPublicPath(url.pathname)) return handlePublic(request, env, ctx);
    if (MOVED[url.pathname]) return Response.redirect(new URL(MOVED[url.pathname] + url.search, url.origin).toString(), 301);
    if (PASS.test(url.pathname) && env.SUPABASE_URL) {
      const target = new URL(url.pathname + url.search, env.SUPABASE_URL);
      const headers = new Headers(request.headers);
      headers.delete("host");
      headers.set("x-studyboard-via", "site");
      const init = { method: request.method, headers, redirect: "manual" };
      if (request.method !== "GET" && request.method !== "HEAD") { init.body = request.body; init.duplex = "half"; }
      const res = await fetch(new Request(target, init));
      if (res.headers.get("x-studyboard-page") === "html") {
        const h = new Headers(res.headers); h.set("content-type", "text/html; charset=utf-8"); h.delete("x-studyboard-page");
        h.set("content-security-policy", "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
        h.set("x-frame-options", "DENY"); h.set("referrer-policy", "no-referrer");
        return new Response(res.body, {status: res.status, statusText: res.statusText, headers: h});
      }
      return res;
    }
    return env.ASSETS.fetch(request);
  },
};
