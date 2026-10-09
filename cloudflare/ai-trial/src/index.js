// Cloudflare wiring for Studyboard's AI trial. The rules, the limits and the routes are in trial.js.
import { DurableObject } from "cloudflare:workers";
import { Student, Pool, handle, verifyUser } from "./trial.js";

// One per student, named by their Supabase user id: their tries.
export class StudentMeter extends DurableObject {
  constructor(ctx, env) { super(ctx, env); this.m = new Student(ctx.storage); }
  status(cfg) { return this.m.status(cfg); }
  take(cfg) { return this.m.take(cfg); }
  refund(day) { return this.m.refund(day); }
  setHuman() { return this.m.setHuman(); }
  forget() { return this.m.forget(); }
}

// One per UTC day, named by the date: the neurons everyone's tries may use that day.
export class DayPool extends DurableObject {
  constructor(ctx, env) { super(ctx, env); this.p = new Pool(ctx.storage); }
  reserve(n, ceiling) { return this.p.reserve(n, ceiling); }
  settle(reserved, actual) { return this.p.settle(reserved, actual); }
  async alarm() { await this.p.expire(); }
}

export default {
  async fetch(request, env) {
    try {
      return await handle(request, env, {
        user: token => verifyUser(token, env),
        student: id => env.STUDENT.getByName("u:" + id),
        pool: day => env.POOL.getByName("day:" + day),
        ai: env.AI
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: "server" }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    }
  }
};
