#!/usr/bin/env node
// Studyboard: makes the signing key pair for the entitlement-token function (Ed25519).
//
//   node supabase-functions/tools/gen-ent-key.mjs
//
// It prints two things:
//   1. ENT_SIGNING_KEY   the PRIVATE key. Put it in Supabase > Edge Functions > Secrets as ENT_SIGNING_KEY. Never put it in the app,
//                        the website, git, a chat or an email. Anyone who has it can mint Pro tokens.
//   2. ENT_PUBKEY        the PUBLIC key (32 bytes, base64url). Paste it into the app's ENT_PUBKEY constant. It is safe to publish.
// Run it once. If the private key ever leaks, run it again, replace both, and ship the app update (old tokens stop working).
// Needs Node 18.4 or newer (uses the built-in WebCrypto). Nothing is written to disk.
import { webcrypto as crypto } from "node:crypto";

const b64 = (buf) => Buffer.from(buf).toString("base64");
const b64url = (buf) => b64(buf).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const pair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
const pkcs8 = await crypto.subtle.exportKey("pkcs8", pair.privateKey);
const raw = await crypto.subtle.exportKey("raw", pair.publicKey);

console.log("");
console.log("Studyboard entitlement signing key (Ed25519)");
console.log("=============================================");
console.log("");
console.log("1) PRIVATE key. Supabase > Edge Functions > Secrets > name: ENT_SIGNING_KEY");
console.log("   Keep it secret. Do not paste it anywhere else.");
console.log("");
console.log("ENT_SIGNING_KEY=" + b64url(pkcs8));   // PKCS8 DER, base64url
console.log("");
console.log("2) PUBLIC key. Paste into the app: const ENT_PUBKEY = \"...\"");
console.log("   (32 raw bytes, base64url. Safe to publish.)");
console.log("");
console.log("ENT_PUBKEY=" + b64url(raw));
console.log("");
