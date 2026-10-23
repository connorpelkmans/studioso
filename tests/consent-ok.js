// Pre-agrees the school sync consent screen for tests that aren't about it
module.exports = () => {
  const K = "coursework:v2", P = ["canvas", "brightspace", "blackboard"];
  const add = v => { try { const s = JSON.parse(v); if (s && s.settings) { P.forEach(p => { if (!(s.settings[p] && s.settings[p].consent)) s.settings[p] = Object.assign({}, s.settings[p], {consent: {v: 1, at: 1}}); }); return JSON.stringify(s); } } catch (e) {} return v; };
  const set = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) { return set.call(this, k, k === K ? add(v) : v); };
  try { const v = localStorage.getItem(K); if (v) set.call(localStorage, K, add(v)); } catch (e) {}
  const yes = () => { const b = document.querySelector("#lmsConsentDlg[open] #lmsConsentYes"); if (b) b.click(); };
  new MutationObserver(yes).observe(document, {childList: true, subtree: true, attributes: true, attributeFilter: ["open"]});
};
