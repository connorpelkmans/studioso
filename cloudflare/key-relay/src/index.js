// Cloudflare wiring for the Studyboard key relay. The logic and the routes are in relay.js.
import { DurableObject } from "cloudflare:workers";
import { Slot, handle } from "./relay.js";

// One Durable Object per mailbox (named by its id), so each box has its own storage and its own 10-minute alarm.
export class Handoff extends DurableObject {
  constructor(ctx, env) { super(ctx, env); this.slot = new Slot(ctx.storage); }
  put(box) { return this.slot.put(box); }
  take() { return this.slot.take(); }
  status() { return this.slot.status(); }
  cancel() { return this.slot.cancel(); }
  async alarm() { await this.slot.expire(); }
}

export default {
  async fetch(request, env) {
    try { return await handle(request, env); }
    catch (e) { return new Response(JSON.stringify({ error: "server" }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }); }
  }
};
