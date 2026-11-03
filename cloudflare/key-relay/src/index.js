// Cloudflare wiring for the Studyboard key relay
import { DurableObject } from "cloudflare:workers";
import { Slot, handle } from "./relay.js";
import { ScanSession } from "./scan.js";

// One Durable Object per mailbox (named by its id)
export class Handoff extends DurableObject {
  constructor(ctx, env) { super(ctx, env); this.slot = new Slot(ctx.storage); }
  put(box) { return this.slot.put(box); }
  take() { return this.slot.take(); }
  status() { return this.slot.status(); }
  cancel() { return this.slot.cancel(); }
  async alarm() { await this.slot.expire(); }
}

// One Durable Object per phone-photo session (named by its id)
export class ScanDrop extends DurableObject {
  constructor(ctx, env) { super(ctx, env); this.sess = new ScanSession(ctx.storage); }
  open() { return this.sess.open(); }
  add(bytes) { return this.sess.add(bytes); }
  waiting() { return this.sess.waiting(); }
  take(k) { return this.sess.take(k); }
  status() { return this.sess.status(); }
  cancel() { return this.sess.cancel(); }
  async alarm() { await this.sess.expire(); }
}

export default {
  async fetch(request, env) {
    try { return await handle(request, env); }
    catch (e) { return new Response(JSON.stringify({ error: "server" }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }); }
  }
};
