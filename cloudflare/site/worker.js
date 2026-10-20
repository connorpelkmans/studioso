// Studyboard website (Cloudflare Workers with static assets). Everything is served from site/ as before, except the sign-in return
// addresses of Google Drive / OneDrive and two-way calendar sync: studyboardapp.com/functions/v1/cloud-files and .../calendar-sync are
// passed straight through to the Supabase functions of the same name. That way Google's and Microsoft's sign-in pages show
// studyboardapp.com, not the Supabase project's address.
//
// The path is kept the same on both sides on purpose: the functions set a short cookie scoped to /functions/v1/<name> that ties a
// connection to the browser that started it, and it has to come back on the same path.
// Supabase also refuses to serve web pages from supabase.co (they arrive as text), so the connect pages only display properly from here.
// SUPABASE_URL is set in wrangler.jsonc (vars). Only these two paths run this code (assets.run_worker_first); the rest never does.
const PASS = /^\/functions\/v1\/(cloud-files|calendar-sync)$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (PASS.test(url.pathname) && env.SUPABASE_URL) {
      const target = new URL(url.pathname + url.search, env.SUPABASE_URL);
      const headers = new Headers(request.headers);
      headers.delete("host");
      headers.set("x-studyboard-via", "site");   // (so a function knows the browser is on the website, where its cookie belongs)
      const init = { method: request.method, headers, redirect: "manual" };
      if (request.method !== "GET" && request.method !== "HEAD") { init.body = request.body; init.duplex = "half"; }
      const res = await fetch(new Request(target, init));
      // Supabase serves every function answer as plain text (it won't show web pages on supabase.co). The functions mark their small
      // connect pages with X-Studyboard-Page; here, on studyboardapp.com, they're shown as the pages they are. Redirects and cookies
      // pass through unchanged.
      if (res.headers.get("x-studyboard-page") === "html") {
        const h = new Headers(res.headers); h.set("content-type", "text/html; charset=utf-8"); h.delete("x-studyboard-page");
        // Supabase adds its own "show nothing" policy (sandboxed, no styles, no forms); the connect page needs its styles and its one form
        h.set("content-security-policy", "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
        h.set("x-frame-options", "DENY"); h.set("referrer-policy", "no-referrer");
        return new Response(res.body, {status: res.status, statusText: res.statusText, headers: h});
      }
      return res;
    }
    return env.ASSETS.fetch(request);
  },
};
