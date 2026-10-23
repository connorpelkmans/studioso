#!/usr/bin/env node
// Studyboard: creates the "Studyboard Pro" product in Stripe with its two prices
const KEY = process.env.STRIPE_SECRET_KEY || "";
if (!/^(sk|rk)_(test|live)_/.test(KEY)) { console.error("Set STRIPE_SECRET_KEY first (sk_test_... for test mode). See the top of this file."); process.exit(1); }
if (/_live_/.test(KEY) && process.env.ALLOW_LIVE !== "1") { console.error("That is a LIVE key. Use a test key first, or set ALLOW_LIVE=1 to create the live product on purpose."); process.exit(1); }

const MONTHLY_CENTS = 399, SEMESTER_CENTS = 1299, YEARLY_CENTS = 2999, TAX_CODE = "txcd_10103100";

const form = (o, p = "", out = []) => { for (const [k, v] of Object.entries(o)) { const key = p ? `${p}[${k}]` : k; if (v && typeof v === "object") form(v, key, out); else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`); } return out.join("&"); };
async function call(path, body) {
  const r = await fetch("https://api.stripe.com/v1/" + path, { method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/x-www-form-urlencoded" }, body: form(body) });
  const j = await r.json();
  if (!r.ok) { console.error("Stripe said:", j.error?.message || r.status); process.exit(1); }
  return j;
}

const product = await call("products", {
  name: "Studyboard Pro",
  description: "Studyboard Pro: unlimited devices, 10 GB of files and every premium theme",
  tax_code: TAX_CODE,
  default_price_data: { unit_amount: MONTHLY_CENTS, currency: "usd", recurring: { interval: "month" } },
});
const semester = await call("prices", { product: product.id, unit_amount: SEMESTER_CENTS, currency: "usd", recurring: { interval: "month", interval_count: 4 }, nickname: "Studyboard Pro semester (4 months)" });
const yearly = await call("prices", { product: product.id, unit_amount: YEARLY_CENTS, currency: "usd", recurring: { interval: "year" }, nickname: "Studyboard Pro yearly" });

console.log("\nCreated product", product.id, "\n");
console.log("STRIPE_PRICE_MONTHLY=" + product.default_price);
console.log("STRIPE_PRICE_SEMESTER=" + semester.id);
console.log("STRIPE_PRICE_YEARLY=" + yearly.id + "\n");
console.log("Save all three in Supabase > Edge Functions > Secrets. Do not run this again unless you want a second product.");
