/* ===== module: 10-plan-mac.js ===== */
/* Mac App Store: Studyboard Pro through Apple's in-app purchase (main.js, preload iap). The plan module asks with the
   cancelable events studyboard:plan-checkout and studyboard:plan-restore, as on iPhone; this answers with
   studyboard:purchase-result. After Apple's sheet, Apple's receipt goes to RevenueCat (its public key, the same App Store
   app as iPhone: one bundle id, Universal Purchase), whose webhook switches Pro on for the account. */
(() => {
  // RevenueCat's PUBLIC Apple key (appl_...), the same as RC_KEYS.ios in ios-wrapper/native-bridge.js
  const MAC_RC_KEY = "appl_REPLACE_WITH_REVENUECAT_PUBLIC_KEY";
  const D = window.studiosoDesktop;
  if (!D || !D.mas || !D.iap) return;
  const RC = "https://api.revenuecat.com/v1", keyOk = /^appl_[A-Za-z0-9]{10,64}$/.test(MAC_RC_KEY);
  const rcHead = {Authorization: "Bearer " + MAC_RC_KEY, "X-Platform": "macos", "Content-Type": "application/json"};
  const result = (action, status, message) => { try { window.dispatchEvent(new CustomEvent("studyboard:purchase-result", {detail: {action, status, message: message || ""}})); } catch (e) {} };
  const NOT_HERE = "Studyboard Pro isn't available in your country yet. Everything else in Studyboard works as usual.";
  // The product for monthly / yearly / semester, from RevenueCat's current offering (the same packages as iPhone)
  async function productFor(uid, period){
    const r = await fetch(`${RC}/subscribers/${encodeURIComponent(uid)}/offerings`, {headers: rcHead});
    if (!r.ok) throw new Error("offerings " + r.status);
    const j = await r.json(), cur = (j.offerings || []).find(o => o.identifier === j.current_offering_id) || (j.offerings || [])[0];
    const want = period === "yearly" ? "$rc_annual" : period === "semester" ? "semester" : "$rc_monthly";
    const pkg = cur && (cur.packages || []).find(p => p.identifier === want);
    return pkg && pkg.platform_product_identifier || "";
  }
  // Apple's receipt to RevenueCat for this account; true when Pro is active there
  async function sendReceipt(uid){
    const receipt = await D.iap.receipt();
    if (!receipt) return false;
    const r = await fetch(`${RC}/receipts`, {method: "POST", headers: rcHead, body: JSON.stringify({app_user_id: uid, fetch_token: receipt})});
    if (!r.ok) throw new Error("receipts " + r.status);
    const j = await r.json(), e = j && j.subscriber && j.subscriber.entitlements && j.subscriber.entitlements.pro;
    return !!e && (!e.expires_date || Date.parse(e.expires_date) > Date.now());
  }
  window.addEventListener("studyboard:plan-checkout", ev => {
    if (!keyOk) return;   // not set up: the plan module says buying isn't available in this build
    ev.preventDefault();
    const d = ev.detail || {}, uid = String(d.userId || "");
    (async () => {
      try {
        const id = await productFor(uid, d.period);
        if (!id) return result("checkout", "error", "That plan isn't available right now.");
        // Apple sells nothing where the products aren't available (an owner choice per country in App Store Connect)
        if (!(await D.iap.products([id])).length) return result("checkout", "error", NOT_HERE);
        const r = await D.iap.buy(id, uid);
        if (r.status === "cancelled") return result("checkout", "cancelled");
        if (r.status !== "success") return result("checkout", "error", r.message || "The purchase didn't go through. You weren't charged.");
        await sendReceipt(uid).catch(() => false);
        result("checkout", "success");
      } catch (e) { result("checkout", "error", "Couldn't reach the App Store. Check your connection and try again."); }
    })();
  });
  window.addEventListener("studyboard:plan-restore", ev => {
    if (!keyOk) return;
    ev.preventDefault();
    const uid = String((ev.detail || {}).userId || "");
    (async () => {
      try { await D.iap.restore(); result("restore", (await sendReceipt(uid)) ? "success" : "nothing"); }
      catch (e) { result("restore", "error", "Couldn't restore purchases. Check your connection and try again."); }
    })();
  });
})();
