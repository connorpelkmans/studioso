// One read through Supabase's REST API counts as activity, so the free project isn't paused. A row isn't needed: any answer from the
// database (even "no rows" or "not allowed" from row level security) means the project is up. Returns what happened, for the test.
export async function ping(env, fetchFn = fetch) {
  const base = String(env.SUPABASE_URL || "").replace(/\/+$/, "");
  if (!/^https:\/\//.test(base) || !env.SUPABASE_KEY) return { ok: false, status: 0, why: "SUPABASE_URL and SUPABASE_KEY must be set" };
  try {
    const res = await fetchFn(base + "/rest/v1/items?select=id&limit=1", { headers: { apikey: env.SUPABASE_KEY } });
    // 200, or 401/403/404 from the database itself, all reached it. Only a 5xx or no answer means it may be paused or down.
    return { ok: res.status < 500, status: res.status };
  } catch (e) { return { ok: false, status: 0, why: String(e && e.message || e) }; }
}

export default {
  async scheduled(controller, env, ctx) {
    const r = await ping(env);
    // A failed run shows in the dashboard (Workers & Pages > this Worker > Cron Events) so you can look at the project.
    if (!r.ok) throw new Error(`Supabase ping failed: ${r.status} ${r.why || ""}`);
  }
};
