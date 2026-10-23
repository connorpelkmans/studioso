// Email to Studyboard (Pro)
import { parseEmail } from "./mime.js";

export const MAX_READ = 3 * 1024 * 1024;

// Reads at most max bytes of the message (a stream), then stops
export async function readRaw(stream, max){
  const reader = stream.getReader(), chunks = []; let n = 0, cut = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const room = max - n;
    if (value.byteLength >= room) { chunks.push(value.subarray(0, room)); n = max; cut = true; try { await reader.cancel(); } catch (e) { } break; }
    chunks.push(value); n += value.byteLength;
  }
  const all = new Uint8Array(n); let o = 0;
  for (const c of chunks) { all.set(c, o); o += c.byteLength; }
  return { bytes: all, cut };
}

// One email in, one decision out
export async function deliver(message, env, fetchFn){
  const url = String(env.SUPABASE_URL || "").replace(/\/+$/, ""), secret = String(env.EMAIL_CAPTURE_SECRET || "");
  if (!/^https:\/\//.test(url) || secret.length < 32) return { action: "retry", reason: "Email to Studyboard is not set up yet." };
  const { bytes } = await readRaw(message.raw, MAX_READ);
  let mail;
  try { mail = parseEmail(bytes); }
  catch (e) { return { action: "reject", reason: "Studyboard couldn't read this email." }; }
  if (mail.autoSubmitted === "auto-replied") return { action: "drop", reason: "an automatic reply" };
  if (!mail.subject && !mail.text.trim()) return { action: "reject", reason: "This email is empty. Studyboard reads the subject and the text." };
  let res;
  try {
    res = await fetchFn(url + "/functions/v1/capture-email", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Studyboard-Email-Secret": secret },
      body: JSON.stringify({ to: message.to, from: mail.from || message.from, subject: mail.subject.slice(0, 900), text: mail.text.slice(0, 8000), id: mail.messageId })
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
    else if (r.action === "retry") throw new Error(r.reason);
  }
};
