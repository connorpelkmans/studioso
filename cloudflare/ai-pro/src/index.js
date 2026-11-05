// Cloudflare wiring for Studyboard AI
import { DurableObject } from "cloudflare:workers";
import Anthropic from "@anthropic-ai/sdk";
import { Meter, Totals, handle, verifyUser, planOf, WHISPER_MODEL, EMBED_MODEL, YT } from "./pro.js";

// One per student, named by their Supabase user id
export class StudentMeter extends DurableObject {
  constructor(ctx, env) { super(ctx, env); this.m = new Meter(ctx.storage); }
  reserve(cost, lim) { return this.m.reserve(cost, lim); }
  settle(id, actual) { return this.m.settle(id, actual); }
  status(lim) { return this.m.status(lim); }
  touch(lim) { return this.m.touch(lim); }
  forget() { return this.m.forget(); }
  take(name, max) { return this.m.take(name, max); }
  give(name) { return this.m.give(name); }
  used(name) { return this.m.used(name); }
  summary(lim) { return this.m.summary(lim); }
}

// One per UTC day: the owner's usage totals (counts only)
export class DayTotals extends DurableObject {
  constructor(ctx, env) { super(ctx, env); this.t = new Totals(ctx.storage); }
  add(kind, task, usage, cost) { return this.t.add(kind, task, usage, cost); }
  read() { return this.t.read(); }
}

const b64 = bytes => { let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };
// AI Gateway, paid with Cloudflare's Unified Billing: Cloudflare's own provider keys, billed to this Cloudflare account's
// credits. The request carries only the gateway token: with no x-api-key, the gateway uses Unified Billing.
const gatewayBase = env => env.AI_GATEWAY_BASE || `https://gateway.ai.cloudflare.com/v1/${env.CF_ACCOUNT_ID}/${env.AI_GATEWAY_ID}`;

export default {
  async fetch(request, env, ctx) {
    try {
      const on = env.CF_ACCOUNT_ID && env.AI_GATEWAY_ID && env.CF_AIG_TOKEN;
      // No retries inside the SDK: a retried request could be billed twice without being charged twice
      const client = on ? new Anthropic({ apiKey: "unified-billing", baseURL: `${gatewayBase(env)}/anthropic`, maxRetries: 0, timeout: 170000,
        defaultHeaders: { "cf-aig-authorization": `Bearer ${env.CF_AIG_TOKEN}`, "x-api-key": null, Authorization: null } }) : null;
      return await handle(request, env, {
        user: token => verifyUser(token, env),
        plan: (token, uid) => planOf(token, uid, env),
        meter: id => env.STUDENT.getByName("u:" + id),
        totals: day => env.TOTALS.getByName("t:" + day),
        claude: {
          // Web fetch is a beta tool on Haiku-class models
          create: req => client.messages.create(req, (req.tools || []).some(t => t.name === "web_fetch") ? { headers: { "anthropic-beta": "web-fetch-2025-09-10" } } : undefined),
          count: async req => { const { max_tokens, ...rest } = req; void max_tokens; return (await client.messages.countTokens(rest)).input_tokens; }
        },
        // YouTube links: Google's Gemini API, also through AI Gateway with Unified Billing
        gemini: on ? async body => { const res = await fetch(`${gatewayBase(env)}/google-ai-studio/v1beta/models/${YT.model}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "cf-aig-authorization": `Bearer ${env.CF_AIG_TOKEN}` }, body: JSON.stringify(body) }); return { status: res.status, json: await res.json().catch(() => null) }; } : null,
        embed: env.AI ? texts => env.AI.run(EMBED_MODEL, { text: texts }) : null,
        whisper: env.AI ? bytes => env.AI.run(WHISPER_MODEL, { audio: b64(bytes), task: "transcribe", vad_filter: true }) : null,
        defer: p => ctx.waitUntil(p.catch(() => {}))
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: "server" }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    }
  }
};
