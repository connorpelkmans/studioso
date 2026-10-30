// Makes the "Secret Key (for OAuth)" Supabase needs for Sign in with Apple, from your Sign in with Apple key file (.p8).
// Runs only on your computer; the key is never sent anywhere. The secret lasts 6 months (Apple's limit): run this again then
// and paste the new one into Supabase (Authentication > Sign In / Providers > Apple).
//
//   node scripts/apple-secret.js <path to AuthKey_XXXX.p8> <Team ID> <Key ID> [Services ID, default com.studioso.app.signin]
const fs = require("fs"), crypto = require("crypto");
const [file, team, kid, sub = "com.studioso.app.signin"] = process.argv.slice(2);
if (!file || !/^[A-Z0-9]{10}$/.test(team || "") || !/^[A-Z0-9]{10}$/.test(kid || "")) {
  console.error("Usage: node scripts/apple-secret.js <AuthKey_XXXX.p8> <Team ID (10 characters)> <Key ID (10 characters)> [Services ID]");
  process.exit(1);
}
const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url");
const now = Math.floor(Date.now() / 1000), exp = now + 180 * 86400;   // just under Apple's 6-month maximum
const head = b64({alg: "ES256", kid}), body = b64({iss: team, iat: now, exp, aud: "https://appleid.apple.com", sub});
const sig = crypto.sign("sha256", Buffer.from(head + "." + body), {key: fs.readFileSync(file, "utf8"), dsaEncoding: "ieee-p1363"}).toString("base64url");
console.log(head + "." + body + "." + sig);
console.error("\nPaste the line above into Supabase. It expires on " + new Date(exp * 1000).toDateString() + "; make a new one before then.");
