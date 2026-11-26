// A small JSON Schema check (the subset the app's schemas use): type, properties, required, items, enum
const {loose} = require("./llm");
function check(data, schema, path = "$", errs = []){
  const s = loose(schema);
  if (!s || typeof s !== "object") return errs;
  const t = s.type, ty = Array.isArray(data) ? "array" : data === null ? "null" : typeof data;
  if (t) {
    const ok = t === "integer" ? Number.isInteger(data) : t === "number" ? typeof data === "number" : t === ty;
    if (!ok) { errs.push(`${path}: want ${t}, got ${ty}`); return errs; }
  }
  if (s.enum && !s.enum.includes(data)) errs.push(`${path}: not one of ${s.enum.join("/")}`);
  if (ty === "object" && s.properties) {
    (s.required || []).forEach(k => { if (!(k in data)) errs.push(`${path}.${k}: missing`); });
    for (const [k, v] of Object.entries(data)) if (s.properties[k]) check(v, s.properties[k], `${path}.${k}`, errs);
  }
  if (ty === "array" && s.items) data.forEach((x, i) => check(x, s.items, `${path}[${i}]`, errs));
  return errs;
}
module.exports = {check};
