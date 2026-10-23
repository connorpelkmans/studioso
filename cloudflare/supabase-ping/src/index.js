// One read through Supabase's REST API counts as activity, so the free project isn't paused
export async function ping(env, fetchFn = fetch) {
  const base = String(env.SUPABASE_URL || "").replace(/\/+$/, "");
  if (!/^https:\/\//.test(base) || !env.SUPABASE_KEY) return { ok: false, status: 0, why: "SUPABASE_URL and SUPABASE_KEY must be set" };
  try {
    const res = await fetchFn(base + "/rest/v1/items?select=id&limit=1", { headers: { apikey: env.SUPABASE_KEY } });
    return { ok: res.status < 500, status: res.status };
  } catch (e) { return { ok: false, status: 0, why: String(e && e.message || e) }; }
}

export default {
  async scheduled(controller, env, ctx) {
    const r = await ping(env);
    if (!r.ok) throw new Error(`Supabase ping failed: ${r.status} ${r.why || ""}`);
  }
};
