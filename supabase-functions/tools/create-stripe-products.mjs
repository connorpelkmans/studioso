#!/usr/bin/env node
// Studyboard: creates the "Studyboard Pro" product in Stripe with its two prices (run it once, in TEST mode first).
//
//   Windows PowerShell:   $env:STRIPE_SECRET_KEY = "sk_test_..." ; node supabase-functions/tools/create-stripe-products.mjs
//   Mac / Linux:          STRIPE_SECRET_KEY=sk_test_... node supabase-functions/tools/create-stripe-products.mjs
//
// The key is read from the environment, never from a file. Use a key that can write Products and Prices (a test-mode secret key from
// Stripe > Developers > API keys is simplest; the restricted key made for create-checkout cannot create products). Delete or roll that
// key afterwards if it was only for this. It prints the two price ids: save them in Supabase > Edge Functions > Secrets as
// STRIPE_PRICE_MONTHLY and STRIPE_PRICE_YEARLY. Needs Node 18 or newer. Nothing is written to disk.
//
// Change the amounts or the tax code below if you want something else. tax_code is the product's tax category (txcd_10103100 is the
// digital code used by Stripe's Managed Payments example; check it fits your app in Stripe > Product catalog > Tax category).
const KEY = process.env.STRIPE_SECRET_KEY || "";
if (!/^(sk|rk)_(test|live)_/.test(KEY)) { console.error("Set STRIPE_SECRET_KEY first (sk_test_... for test mode). See the top of this file."); process.exit(1); }
if (/_live_/.test(KEY) && process.env.ALLOW_LIVE !== "1") { console.error("That is a LIVE key. Use a test key first, or set ALLOW_LIVE=1 to create the live product on purpose."); process.exit(1); }

const MONTHLY_CENTS = 300, YEARLY_CENTS = 1999, TAX_CODE = "txcd_10103100";

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
const yearly = await call("prices", { product: product.id, unit_amount: YEARLY_CENTS, currency: "usd", recurring: { interval: "year" }, nickname: "Studyboard Pro yearly" });

console.log("\nCreated product", product.id, "\n");
console.log("STRIPE_PRICE_MONTHLY=" + product.default_price);
console.log("STRIPE_PRICE_YEARLY=" + yearly.id + "\n");
console.log("Save both in Supabase > Edge Functions > Secrets. Do not run this again unless you want a second product.");
