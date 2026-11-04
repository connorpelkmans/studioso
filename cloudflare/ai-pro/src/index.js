// Cloudflare wiring for Studyboard Pro AI
import { DurableObject } from "cloudflare:workers";
import Anthropic from "@anthropic-ai/sdk";
import { Meter, Ceiling, handle, verifyUser, planOf, WHISPER_MODEL } from "./pro.js";

// One per student, named by their Supabase user id
export class StudentMeter extends DurableObject {
  constructor(ctx, env) { super(ctx, env); this.m = new Meter(ctx.storage); }
  reserve(cost, lim) { return this.m.reserve(cost, lim); }
  settle(id, actual) { return this.m.settle(id, actual); }
  status(lim) { return this.m.status(lim); }
  forget() { return this.m.forget(); }
}

// One per UTC day for everyone, named by the date
export class DayCeiling extends DurableObject {
  constructor(ctx, env) { super(ctx, env); this.c = new Ceiling(ctx.storage); }
  reserve(cost, max) { return this.c.reserve(cost, max); }
  settle(reserved, actual) { return this.c.settle(reserved, actual); }
  async alarm() { await this.c.expire(); }
}

const b64 = bytes => { let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };

export default {
  async fetch(request, env, ctx) {
    try {
      // No retries inside the SDK: a retried request could be billed twice without being charged twice
      const client = env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 0, timeout: 170000, ...(env.ANTHROPIC_BASE_URL ? { baseURL: env.ANTHROPIC_BASE_URL } : {}) }) : null;
      return await handle(request, env, {
        user: token => verifyUser(token, env),
        plan: (token, uid) => planOf(token, uid, env),
        meter: id => env.STUDENT.getByName("u:" + id),
        ceiling: day => env.CEILING.getByName("day:" + day),
        claude: {
          create: req => client.messages.create(req),
          count: async req => { const { max_tokens, ...rest } = req; void max_tokens; return (await client.messages.countTokens(rest)).input_tokens; }
        },
        whisper: env.AI ? bytes => env.AI.run(WHISPER_MODEL, { audio: b64(bytes), task: "transcribe", vad_filter: true }) : null,
        defer: p => ctx.waitUntil(p.catch(() => {}))
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: "server" }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    }
  }
};
