#!/usr/bin/env node
// Studyboard: makes the signing key pair for the entitlement-token function (Ed25519)
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
console.log("ENT_SIGNING_KEY=" + b64url(pkcs8));
console.log("");
console.log("2) PUBLIC key. Paste into the app: const ENT_PUBKEY = \"...\"");
console.log("   (32 raw bytes, base64url. Safe to publish.)");
console.log("");
console.log("ENT_PUBKEY=" + b64url(raw));
console.log("");
