// Email to Studyboard (Pro): a Cloudflare Email Worker. Mail sent to <key>@<your inbound domain> arrives here through Cloudflare Email
// Routing. The Worker reads the subject and the text (mime.js) and posts them to the capture-email Edge Function with a shared secret;
// the database decides whose inbox it belongs in. Nothing is stored here. See README.md.
import { parseEmail } from "./mime.js";

export const MAX_READ = 3 * 1024 * 1024;   // the text comes first in a message; big attachments after it are not read

// Reads at most max bytes of the message (a stream), then stops
export async function readRaw(stream, max){
  const reader = stream.getReader(), chunks = []; let n = 0, cut = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const room = max - n;
    if (value.byteLength >= room) { chunks.push(value.subarray(0, room)); n = max; cut = true; try { await reader.cancel(); } catch (e) { /* ignore */ } break; }
    chunks.push(value); n += value.byteLength;
  }
  const all = new Uint8Array(n); let o = 0;
  for (const c of chunks) { all.set(c, o); o += c.byteLength; }
  return { bytes: all, cut };
}

// One email in, one decision out: {action: "ok" | "drop" | "reject" | "retry", reason}
export async function deliver(message, env, fetchFn){
  const url = String(env.SUPABASE_URL || "").replace(/\/+$/, ""), secret = String(env.EMAIL_CAPTURE_SECRET || "");
  if (!/^https:\/\//.test(url) || secret.length < 32) return { action: "retry", reason: "Email to Studyboard is not set up yet." };
  const { bytes } = await readRaw(message.raw, MAX_READ);
  let mail;
  try { mail = parseEmail(bytes); }
  catch (e) { return { action: "reject", reason: "Studyboard couldn't read this email." }; }   // malformed mail is bounced, never a crash
  if (mail.autoSubmitted === "auto-replied") return { action: "drop", reason: "an automatic reply" };   // "out of office" answers
  if (!mail.subject && !mail.text.trim()) return { action: "reject", reason: "This email is empty. Studyboard reads the subject and the text." };
  let res;
  try {
    res = await fetchFn(url + "/functions/v1/capture-email", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Studyboard-Email-Secret": secret },
      // from: the header From (who wrote it; with forwarding, the envelope sender is the forwarder). It isn't verified, so the app only
      // shows it as a hint, never trusts it. The Message-ID is deduplicated per inbox (not per sender), so a resent copy isn't added twice.
      body: JSON.stringify({ to: message.to, from: mail.from || message.from, subject: mail.subject.slice(0, 900), text: mail.text.slice(0, 8000), id: mail.messageId })   // the database keeps 6,000 characters
    });
  } catch (e) { return { action: "retry", reason: "Studyboard couldn't be reached. Your mail server will try again." }; }
  if (res.ok) return { action: "ok", reason: "" };
  if (res.status === 404) return { action: "reject", reason: "There is no Studyboard inbox at this address. Check the address in Studyboard, Settings, Quick Capture." };
  if (res.status === 402) return { action: "reject", reason: "This Studyboard address needs Studyboard Pro." };
  if (res.status === 400 || res.status === 413) return { action: "reject", reason: "Studyboard couldn't read this email." };
  if (res.status === 429) return { action: "retry", reason: "This Studyboard inbox is getting a lot of mail. Your mail server will try again later." };
  return { action: "retry", reason: "Studyboard had a problem. Your mail server will try again." };
}

export default {
  async email(message, env){
    const r = await deliver(message, env, fetch);
    if (r.action === "reject") message.setReject(r.reason);
    else if (r.action === "retry") throw new Error(r.reason);   // a temporary failure: the sending server tries again
  }
};
