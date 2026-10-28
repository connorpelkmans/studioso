/* ===== module: 01-style-shop.js: the app's core, the Style Shop, completion animations, theme kits ===== */
/* Style Shop: themes, flashcard styles, note shapes, pins, stickers */
/* ============================================================================================================
   FLIP TO true TO LAUNCH PRO
   ------------------------------------------------------------------------------------------------------------
   This one constant is the app-side Pro switch. While it is false (and the server switch below is off) every
   theme, shop item, companion and limit is unlocked for everyone, exactly as before.
   When Pro enforcement is ON, everything below follows from it automatically: STORE.paywall, PLAN.paywall(),
   PLAN.isPro(), the Style Shop locks, sticker packs, theme collections, companions, photo themes, scrapbook
   extras, Study Together limits, group limits and the Studyboard Pro sheet.

   Enforcement is ON if ANY of these is true (the first two are "real" switches, the third is for testing):
     1. PRO_ENFORCED below is true (needs a new build of the app), OR
     2. the server says so: studyboard_config.paywall = true (flip it in Supabase, no rebuild needed), OR
     3. the test override localStorage "studyboard:paywall-test" = "1" (can only force it ON).
   Nothing local can ever turn enforcement OFF once the constant or the server says ON: the last server answer is
   latched on this device and only a successful server answer of "false" releases it (so you can still switch back).
   To launch with the constant, change false to true on the next line, rebuild, and set the server switch too
   (see "Launch Day" in PRO-PLANS-GUIDE.md).
   ============================================================================================================ */
const PRO_ENFORCED = true;

// PRO items are free while enforcement is off; once it's on they need Pro
const STORE = (() => {
  const K_CFG = "studyboard:plancfg", K_LATCH = "studyboard:pw-latch", K_TEST = "studyboard:paywall-test";
  const ls = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  let server = false;
  try { const c = JSON.parse(ls(K_CFG) || "null"); server = !!(c && c.rows && c.rows.paywall === true); } catch (e) {}
  if (ls(K_LATCH) === "1") server = true;
  const st = {
    get paywall(){ return PRO_ENFORCED === true || server || ls(K_TEST) === "1"; },
    // v: true | false from a successful read of studyboard_config.paywall
    serverPaywall(v){ server = !!v; try { if (v) localStorage.setItem(K_LATCH, "1"); else localStorage.removeItem(K_LATCH); } catch (e) {} },
    get enforcedByApp(){ return PRO_ENFORCED === true; }
  };
  return st;
})();
const svgUrl = svg => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
const SVGH = (vb, body, ar = "none") => `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${vb}' preserveAspectRatio='${ar}'>${body}</svg>`;
// Theme colors: [paper, grid, surface, ink, muted, line, soft, field, accent, accent-2
const SKINS = [
  {id: "classic", name: "Classic", tier: "free", group: "plain", desc: "The original notebook blue on graph paper."},
  {id: "paper", name: "Plain Paper", tier: "free", group: "plain", desc: "Clean white, nothing extra.", plain: true,
    light: ["#FAFAF7", "rgba(47,111,219,.10)", "#FFFFFF", "#1F2328", "#656D76", "#E3E3DF", "#F0F0EC", "#F7F7F4", "#2F6FDB", "#4D86E5", "#FFFFFF", "#24292F", "#24292F", "#D0D7DE", "#FFF3A3"],
    dark: ["#111315", "rgba(108,160,255,.08)", "#1A1D21", "#E6E8EA", "#9AA1A9", "#2B3036", "#22262B", "#16191C", "#6CA0FF", "#8BB4FF", "#0B1530", "#3A4250", "#0B0C0E", "#AEB6BF", "#5C5214"]},
  {id: "slate", name: "Slate", tier: "free", group: "plain", desc: "Calm cool gray.", plain: true,
    light: ["#F1F3F6", "rgba(74,111,165,.10)", "#FFFFFF", "#1E2733", "#5F6B7A", "#D8DEE6", "#E7EBF0", "#F7F9FB", "#4A6FA5", "#6386BA", "#FFFFFF", "#2E3A4A", "#2E3A4A", "#CDD6E2", "#FFE9A8"],
    dark: ["#13171C", "rgba(134,168,218,.08)", "#1B2129", "#E4E9EF", "#97A3B3", "#2C3440", "#222932", "#171C23", "#86A8DA", "#A2BDE5", "#0E1826", "#4A5E7A", "#0B0E12", "#AAB6C6", "#5A4E1C"]},
  {id: "sand", name: "Sand", tier: "free", group: "plain", desc: "Soft warm neutrals.", plain: true,
    light: ["#F8F0E2", "rgba(176,122,59,.11)", "#FFFCF6", "#2E271E", "#7A6B57", "#EADCC5", "#F3E8D6", "#FFFAF1", "#B07A3B", "#CFA066", "#FFFFFF", "#7A5226", "#7E5A30", "#F7EAD3", "#FFE3A0"],
    dark: ["#1A1610", "rgba(214,170,110,.08)", "#241E16", "#F2E8D8", "#B9A88E", "#3D3326", "#2E271D", "#1F1A13", "#E0B47A", "#EAC796", "#2A1C08", "#8A6A40", "#2E2418", "#EAD7B8", "#5E4A1A"]},
  {id: "blush", name: "Blush", tier: "free", group: "plain", desc: "Soft pink.", plain: true,
    light: ["#FBF3F5", "rgba(194,77,120,.10)", "#FFFFFF", "#2E1F25", "#7A6069", "#EFDDE3", "#F7E7EC", "#FDF9FA", "#C24D78", "#D17A9A", "#FFFFFF", "#622F42", "#9C4A6B", "#E3CCD6", "#FFF3A3"],
    dark: ["#181114", "rgba(240,139,176,.08)", "#22181C", "#F4E8EC", "#B89AA5", "#3A2A30", "#2E1D24", "#1D1418", "#F08BB0", "#F3A2C0", "#2A0F1A", "#8F546A", "#3A1E2A", "#C8C0C3", "#5C5214"]},
  {id: "lavender", name: "Lavender", tier: "free", group: "plain", desc: "Gentle purple.", plain: true,
    light: ["#F6F4FB", "rgba(116,87,201,.10)", "#FFFFFF", "#251F36", "#6B6485", "#E3DEF0", "#EDE9F7", "#FAFAFD", "#7457C9", "#9781D6", "#FFFFFF", "#413369", "#5B479E", "#D1CBE4", "#FFF3A3"],
    dark: ["#13111A", "rgba(179,157,255,.08)", "#1C1926", "#EDEAF7", "#A9A2C2", "#2E2A3E", "#231F31", "#181520", "#B39DFF", "#C2B1FF", "#1A1033", "#6B5E98", "#2A2342", "#C3C1CA", "#5C5214"]},
  {id: "sky", name: "Sky", tier: "free", group: "plain", desc: "Clear light blue.", plain: true,
    light: ["#F2F7FB", "rgba(47,125,196,.10)", "#FFFFFF", "#152433", "#5B6E80", "#DAE6F0", "#E4EEF7", "#F8FBFD", "#2F7DC4", "#639ED3", "#FFFFFF", "#1E4366", "#2F6596", "#C5D4E2", "#FFF3A3"],
    dark: ["#0F141A", "rgba(125,187,242,.08)", "#161E27", "#E6EEF5", "#97A8B8", "#26323F", "#1A2530", "#121920", "#7DBBF2", "#97C9F5", "#0A1F33", "#4C7091", "#1C2A38", "#BFC3C7", "#5C5214"]},
  {id: "sage", name: "Sage", tier: "free", group: "plain", desc: "Muted green.", plain: true,
    light: ["#EEF4EC", "rgba(78,138,91,.11)", "#FCFEFB", "#1D2A20", "#5E7062", "#D6E3D6", "#E4EEE3", "#F7FBF6", "#4E8A5B", "#7FB08A", "#FFFFFF", "#2F5E3A", "#3B6A47", "#E3F1E5", "#FFF3A3"],
    dark: ["#111712", "rgba(140,205,155,.08)", "#18211A", "#E6F0E7", "#9FB3A3", "#2A3A2D", "#1E2A21", "#141C16", "#8CCB9B", "#A8DBB4", "#0E2414", "#4F7A5A", "#1D2E22", "#D3E8D7", "#4E5A1C"]},
  {id: "peach", name: "Peach", tier: "free", group: "plain", desc: "Warm peach.", plain: true,
    light: ["#FFF2EA", "rgba(224,115,74,.10)", "#FFFCFA", "#33221A", "#86685A", "#F6DCCD", "#FDE8DC", "#FFF9F5", "#E0734A", "#F29A76", "#FFFFFF", "#A84A28", "#A2482A", "#FFE6DA", "#FFF3A3"],
    dark: ["#1A1310", "rgba(255,160,120,.08)", "#251A15", "#F8EDE6", "#C4A596", "#43302A", "#311F18", "#1F1612", "#FF9E73", "#FFB896", "#2E1206", "#A85A38", "#3A2018", "#F8D8C8", "#5C4A14"]},
  {id: "butter", name: "Cherry", tier: "free", group: "plain", desc: "Bold cherry red.", plain: true,
    light: ["#FFF1F2", "rgba(176,48,70,.09)", "#FFFCFC", "#2E1519", "#855A62", "#F3D6DB", "#FCE6EA", "#FFF8F9", "#B02F46", "#C95A6E", "#FFFFFF", "#8C2335", "#91293B", "#FFE3E8", "#FFF3A3"],
    dark: ["#1A0F11", "rgba(255,111,134,.08)", "#251517", "#F9E9EC", "#C79CA4", "#45252B", "#33191E", "#1F1214", "#FF6F86", "#FF91A2", "#2E0610", "#A83347", "#3A1720", "#F9D3DA", "#5C4A14"]},
  {id: "teal", name: "Teal", tier: "free", group: "plain", desc: "Deep blue-green.", plain: true,
    light: ["#F0F8F7", "rgba(31,138,128,.10)", "#FFFFFF", "#132826", "#56716E", "#D3E7E4", "#E1F0EF", "#F8FCFB", "#1F8A80", "#57A7A0", "#FFFFFF", "#174A46", "#1F6E67", "#C0D6D4", "#FFF3A3"],
    dark: ["#0E1615", "rgba(111,209,197,.08)", "#152120", "#E3F2F0", "#93B2AE", "#243533", "#182927", "#121C1A", "#6FD1C5", "#8CDAD1", "#06231F", "#437D76", "#1A2B29", "#BFC4C3", "#5C5214"]},
  {id: "mocha", name: "Mocha", tier: "free", group: "plain", desc: "Coffee brown.", plain: true,
    light: ["#F6EFE8", "rgba(154,99,64,.10)", "#FFFCFA", "#2B211B", "#78665A", "#E6D9CD", "#EFE4DA", "#FCF8F4", "#9A6340", "#C08A63", "#FFFFFF", "#6B4329", "#5A3B28", "#F3E2D3", "#FFE3A0"],
    dark: ["#16110D", "rgba(220,170,128,.08)", "#211913", "#F3EAE2", "#B8A493", "#3A2D24", "#2B2019", "#1B1511", "#DCAA80", "#E6BE9C", "#2A1608", "#87654A", "#2E2018", "#EBD6C4", "#5C4A1A"]},
  {id: "plum", name: "Plum", tier: "free", group: "plain", desc: "Rich purple.", plain: true,
    light: ["#F8F2F7", "rgba(142,59,132,.10)", "#FFFFFF", "#2C1A2A", "#74606F", "#EBDCE8", "#F1E5EF", "#FCF8FB", "#8E3B84", "#AA6CA3", "#FFFFFF", "#4E264A", "#6E2E66", "#D6C4D4", "#FFF3A3"],
    dark: ["#161015", "rgba(224,138,212,.08)", "#20171F", "#F3E8F1", "#B69CB0", "#372835", "#2A1C28", "#1B141A", "#E08AD4", "#E6A1DD", "#2A0B25", "#85537E", "#301F2D", "#C5C0C4", "#5C5214"]},
  {id: "indigo", name: "Indigo", tier: "free", group: "plain", desc: "Deep blue.", plain: true,
    light: ["#F3F4FB", "rgba(63,75,184,.10)", "#FFFFFF", "#1A1D3A", "#5F6384", "#DCDFF1", "#E6E8F6", "#F9FAFD", "#3F4BB8", "#6F78CA", "#FFFFFF", "#272D66", "#343C94", "#C6C8E1", "#FFF3A3"],
    dark: ["#0F1018", "rgba(142,152,255,.08)", "#171926", "#E8E9F6", "#9EA1C2", "#282B40", "#1C1E2F", "#13141F", "#8E98FF", "#A5ADFF", "#0F1440", "#555B97", "#212438", "#C1C2C7", "#5C5214"]},
  {id: "winter", name: "Winter", tier: "pro", group: "season", desc: "Snowflakes by day, gentle snowfall by night.",
    light: ["#F2F6FA", "transparent", "#FFFFFF", "#14233A", "#5B6B80", "#D9E3EE", "#E5EDF7", "#F8FAFC", "#3B6FD1", "#6C93DC", "#FFFFFF", "#223E6F", "#3E5F8A", "#C9D2DE", "#FFF3A3"],
    dark: ["#0B1220", "transparent", "#131C2E", "#E6EEF8", "#93A3B8", "#243149", "#182336", "#0F1727", "#8DB8FF", "#A4C6FF", "#0B1630", "#536D9B", "#1E2E4A", "#C0C4CC", "#5C5214"],
    glow: ["radial-gradient(80% 60% at 0% 0%, rgba(141,184,255,.26), transparent 62%), radial-gradient(80% 60% at 100% 100%, rgba(200,225,245,.6), transparent 62%), #F2F6FA", "radial-gradient(80% 60% at 0% 0%, rgba(80,120,200,.22), transparent 62%), radial-gradient(80% 60% at 100% 100%, rgba(140,180,255,.10), transparent 62%), #0B1220"], spine: ["linear-gradient(180deg,#3E5F8A,#26395A)", "linear-gradient(180deg,#1E2E4A,#070C16)"], btn: ["linear-gradient(135deg,#3B6FD1,#5FA0E8)", "linear-gradient(135deg,#8DB8FF,#B9D4FF)"]},
  {id: "spring", name: "Spring", tier: "pro", group: "season", desc: "Tulips and butterflies.",
    light: ["#F6FAF1", "transparent", "#FFFFFF", "#1E2A1C", "#607056", "#DDE8D2", "#EAF3E4", "#FAFCF8", "#4E9A3E", "#7AB36E", "#FFFFFF", "#2F5128", "#5C9A4A", "#D1E3CC", "#FFF3A3"],
    dark: ["#0F160E", "transparent", "#182216", "#EAF3E4", "#A1B598", "#2A3A26", "#1C2918", "#141C12", "#8CD670", "#A3DE8D", "#0F2108", "#548044", "#2E4A26", "#C4CCC2", "#5C5214"],
    glow: ["radial-gradient(80% 60% at 100% 0%, rgba(255,180,210,.30), transparent 62%), radial-gradient(90% 70% at 0% 100%, rgba(140,200,110,.22), transparent 62%), #F6FAF1", "radial-gradient(80% 60% at 100% 0%, rgba(255,150,190,.10), transparent 62%), radial-gradient(90% 70% at 0% 100%, rgba(78,154,62,.20), transparent 62%), #0F160E"], spine: ["linear-gradient(180deg,#5C9A4A,#3C6E34)", "linear-gradient(180deg,#2E4A26,#0A1108)"], btn: ["linear-gradient(135deg,#4E9A3E,#8CC152)", "linear-gradient(135deg,#8CD670,#B8E07A)"]},
  {id: "summer", name: "Summer", tier: "pro", group: "season", desc: "A top-down beach with turquoise water.",
    light: ["#F3FAFD", "transparent", "#FFFFFF", "#13283A", "#587084", "#D4E8F2", "#E3F2F9", "#F9FCFE", "#0E86C9", "#4AA4D6", "#FFFFFF", "#11496C", "#1580B8", "#BDDBEB", "#FFF3A3"],
    dark: ["#081722", "transparent", "#0F2231", "#E4F2FA", "#8FAFC4", "#1D3A4E", "#0F2837", "#0C1C2A", "#4FC3F7", "#72CFF9", "#04202E", "#2F7697", "#0E4466", "#BCCBD4", "#5C5214"],
    glow: ["radial-gradient(80% 60% at 100% 0%, rgba(255,200,80,.34), transparent 62%), radial-gradient(90% 70% at 0% 100%, rgba(40,175,215,.26), transparent 62%), #EEF6FA", "radial-gradient(80% 60% at 100% 0%, rgba(255,200,80,.10), transparent 62%), radial-gradient(90% 70% at 0% 100%, rgba(30,140,190,.22), transparent 62%), #081722"], spine: ["linear-gradient(180deg,#1580B8,#0D5A85)", "linear-gradient(180deg,#0E4466,#050E15)"], btn: ["linear-gradient(135deg,#0E86C9,#23B5D3)", "linear-gradient(135deg,#4FC3F7,#7FE0F0)"]},
  {id: "autumn", name: "Fall", tier: "pro", group: "season", desc: "Drifting leaves in warm light.",
    light: ["#FBF3EA", "rgba(200,100,30,.11)", "#FFFDF9", "#33200F", "#80644C", "#EFDCC7", "#F8E8D6", "#FEF9F3", "#C8561C", "#E07A2E", "#FFFFFF", "#6B2E14", "#6B2E14", "#F4D5BC", "#FFCF6B"],
    dark: ["#1A0F08", "rgba(255,140,60,.08)", "#26170D", "#F9ECDF", "#C8A387", "#45301F", "#362314", "#1F130A", "#FF8A47", "#FFA56B", "#2E1203", "#A8481C", "#100904", "#E6C2A5", "#6E4A10"],
    glow: ["radial-gradient(90% 70% at 100% 0%, rgba(255,207,107,.32), transparent 62%), radial-gradient(80% 60% at 0% 100%, rgba(224,122,46,.16), transparent 62%), #FBF3EA", "radial-gradient(90% 70% at 100% 0%, rgba(255,165,107,.13), transparent 62%), radial-gradient(80% 60% at 0% 100%, rgba(168,72,28,.22), transparent 62%), #1A0F08"], spine: ["linear-gradient(180deg,#8A3A18,#5A2410)", "linear-gradient(180deg,#4A1F0C,#100904)"], btn: ["linear-gradient(135deg,#C8561C,#E0942E)", "linear-gradient(135deg,#C8561C,#E0942E)"]},
  {id: "ocean", name: "Ocean Waves", tier: "pro", group: "pro", desc: "Soft layered waves with foam lines.",
    light: ["#EEF7F8", "rgba(0,140,160,.10)", "#FFFFFF", "#0B2B33", "#4E6F77", "#CFE3E6", "#E1F0F2", "#F5FBFB", "#0A7F92", "#14A7BD", "#FFFFFF", "#0B4F5C", "#0B4F5C", "#BFE6EC", "#9FF0E4"],
    dark: ["#071C21", "rgba(60,200,220,.08)", "#0D2A31", "#E2F5F7", "#8DB5BC", "#1C434B", "#123840", "#0A2328", "#3CCFE0", "#6BDCEA", "#04262C", "#1F7F8F", "#041419", "#9ED3DB", "#1F6F66"],
    glow: ["radial-gradient(120% 80% at 100% 100%, rgba(20,167,189,.22), transparent 62%), radial-gradient(90% 70% at 0% 0%, rgba(159,240,228,.45), transparent 62%), #EEF7F8", "radial-gradient(120% 80% at 100% 100%, rgba(60,207,224,.18), transparent 62%), radial-gradient(90% 70% at 0% 0%, rgba(31,127,143,.32), transparent 62%), #071C21"], spine: ["linear-gradient(180deg,#0E6878,#0B3F4C)", "linear-gradient(180deg,#0A3A44,#041419)"], btn: ["linear-gradient(135deg,#0A7F92,#1795C8)", "linear-gradient(135deg,#3CCFE0,#2AA7E0)"]},
  {id: "sakura", name: "Sakura", tier: "pro", group: "pro", desc: "A cherry branch in bloom.",
    light: ["#FFF4F7", "rgba(235,120,160,.14)", "#FFFFFF", "#3B1D2B", "#8C6474", "#F5D6E1", "#FDE6EE", "#FFF9FB", "#C9427A", "#F27AA8", "#FFFFFF", "#7A2E52", "#7A2E52", "#FAD2E3", "#FFD6E6"],
    dark: ["#1D0F16", "rgba(255,150,190,.10)", "#2B1621", "#FCE9F1", "#C99AAF", "#4A2637", "#3A1D2B", "#24121B", "#FF86B5", "#FFA4C8", "#2E0918", "#B04A7A", "#13080E", "#EDB9D0", "#7A3A55"],
    glow: ["radial-gradient(90% 70% at 100% 0%, rgba(255,170,200,.40), transparent 62%), radial-gradient(80% 60% at 0% 100%, rgba(255,214,230,.65), transparent 62%), #FFF4F7", "radial-gradient(90% 70% at 100% 0%, rgba(255,120,170,.15), transparent 62%), radial-gradient(80% 60% at 0% 100%, rgba(176,74,122,.18), transparent 62%), #1D0F16"], spine: ["linear-gradient(180deg,#A8456F,#6E2A4B)", "linear-gradient(180deg,#5A2240,#13080E)"], btn: ["linear-gradient(135deg,#C9427A,#E8688A)", "linear-gradient(135deg,#FF86B5,#FF9E9E)"]},
  {id: "forest", name: "Evergreen", tier: "pro", group: "pro", desc: "Misty ridges and a quiet treeline.",
    light: ["#F1F5EC", "rgba(60,120,60,.10)", "#FFFFFC", "#1D2B1A", "#5D6E57", "#D6E1CC", "#E6EEDD", "#F8FBF4", "#2F8A4E", "#45A865", "#FFFFFF", "#274D2F", "#274D2F", "#CFE6C8", "#E8E06A"],
    dark: ["#0E1710", "rgba(120,200,120,.07)", "#16241A", "#E6F1E1", "#9DB397", "#2A4030", "#1D3124", "#122016", "#5CCB7E", "#7EDB98", "#07210F", "#3F7A4D", "#08110A", "#B7D8B0", "#6A6A1C"],
    glow: ["radial-gradient(100% 70% at 0% 100%, rgba(69,168,101,.20), transparent 62%), radial-gradient(80% 60% at 100% 0%, rgba(232,224,106,.22), transparent 62%), #F1F5EC", "radial-gradient(100% 70% at 0% 100%, rgba(92,203,126,.14), transparent 62%), radial-gradient(80% 60% at 100% 0%, rgba(63,122,77,.25), transparent 62%), #0E1710"], spine: ["linear-gradient(180deg,#2F6A3C,#1E3F26)", "linear-gradient(180deg,#1F3A26,#08110A)"], btn: ["linear-gradient(135deg,#2F8A4E,#3E9E7A)", "linear-gradient(135deg,#5CCB7E,#3AA86A)"]},
  {id: "galaxy", name: "Galaxy", tier: "pro", group: "pro", desc: "Soft glowing stars over a faint planet.",
    light: ["#F3F1FC", "rgba(110,90,220,.2)", "#FFFFFF", "#1E1740", "#625A8A", "#DDD8F3", "#EAE6FA", "#F8F7FE", "#6B4EE6", "#8C6FF5", "#FFFFFF", "#2C1F6B", "#231A5A", "#D2CBF7", "#FFE57A"],
    dark: ["#0B0820", "rgba(210,200,255,.4)", "#151036", "#ECE8FF", "#A49CD6", "#2C2560", "#1E1848", "#110D2B", "#9D86FF", "#B8A6FF", "#120A3A", "#5B45C9", "#06041A", "#C5BCF5", "#6B5A1A"],
    glow: ["radial-gradient(70% 60% at 10% 15%, rgba(160,130,255,.22), transparent 62%), radial-gradient(70% 60% at 90% 85%, rgba(255,140,210,.18), transparent 62%), #F3F1FC", "radial-gradient(70% 60% at 10% 15%, rgba(140,90,255,.32), transparent 62%), radial-gradient(70% 60% at 90% 85%, rgba(255,90,190,.22), transparent 62%), radial-gradient(50% 40% at 70% 20%, rgba(60,160,255,.14), transparent 62%), #0B0820"], spine: ["linear-gradient(180deg,#3A2A8A,#1A1248)", "linear-gradient(180deg,#2A1F6B,#06041A)"], btn: ["linear-gradient(135deg,#6B4EE6,#C04EE6)", "linear-gradient(135deg,#6B4EE6,#C04EE6)"]},
  {id: "arctic", name: "Northern Lights", tier: "pro", group: "pro", desc: "Aurora ribbons over snow.",
    light: ["#F0F7FC", "rgba(90,160,210,.18)", "#FFFFFF", "#10263A", "#587189", "#D5E5F1", "#E4EFF7", "#F7FBFE", "#2A7FC0", "#4DA3DF", "#FFFFFF", "#1B3F5E", "#1B3F5E", "#CFE6F7", "#BDEBFF"],
    dark: ["#061019", "rgba(180,220,255,.5)", "#0E1D2B", "#E4F1FB", "#8DA8BF", "#1E3448", "#142838", "#0A1722", "#6CC0FF", "#93D2FF", "#04182A", "#2F6E9E", "#040B12", "#A8CBE6", "#1F5E73"],
    glow: ["radial-gradient(60% 35% at 30% 0%, rgba(80,220,170,.24), transparent 62%), radial-gradient(55% 32% at 72% 4%, rgba(150,120,255,.16), transparent 62%), #F0F7FC", "radial-gradient(60% 35% at 30% 0%, rgba(60,255,170,.24), transparent 62%), radial-gradient(55% 32% at 72% 4%, rgba(150,90,255,.26), transparent 62%), #061019"], spine: ["linear-gradient(180deg,#1B5E7A,#2A3F7A)", "linear-gradient(180deg,#0E3A4A,#1E1848 70%,#040B12)"], btn: ["linear-gradient(135deg,#2A9FC0,#6A5AE0)", "linear-gradient(135deg,#2A9FC0,#6A5AE0)"]},
  {id: "lemonade", name: "Lemonade", tier: "pro", group: "pro", desc: "Lemon slices on sunny yellow.",
    light: ["#FFFBE8", "rgba(220,180,20,.16)", "#FFFFFF", "#2E2A12", "#736B45", "#F1E7B8", "#FBF3CF", "#FFFDF3", "#9A6B00", "#F2B705", "#FFFFFF", "#2F6B4F", "#2F6B4F", "#D9F2C7", "#FFF08A"],
    dark: ["#1A1706", "rgba(255,220,80,.08)", "#26220C", "#FBF6DC", "#C2B98A", "#423B17", "#332D10", "#1F1B08", "#FFD23F", "#FFE070", "#2A2200", "#3D8A63", "#0F0D03", "#E4DDAF", "#6E5F10"],
    glow: ["radial-gradient(90% 70% at 100% 0%, rgba(242,183,5,.22), transparent 62%), radial-gradient(80% 60% at 0% 100%, rgba(217,242,199,.75), transparent 62%), #FFFBE8", "radial-gradient(90% 70% at 100% 0%, rgba(255,210,63,.13), transparent 62%), radial-gradient(80% 60% at 0% 100%, rgba(61,138,99,.18), transparent 62%), #1A1706"], spine: ["linear-gradient(180deg,#3E8A62,#2A5E44)", "linear-gradient(180deg,#1E4A34,#0F0D03)"], btn: ["linear-gradient(135deg,#B58000,#3E8A62)", "linear-gradient(135deg,#FFD23F,#8EE08A)"]},
  {id: "xmas", name: "Christmas Lights", tier: "pro", group: "pro", desc: "Glowing holiday lights.",
    light: ["#FBF6EF", "transparent", "#FFFFFF", "#2A1E16", "#7A6656", "#EADFD2", "#F6E8E2", "#FDFAF7", "#B8322F", "#CA6563", "#FFFFFF", "#5C251F", "#1F5A3A", "#C0D1C8", "#FFF3A3"],
    dark: ["#0F1512", "transparent", "#18211C", "#F5EEE4", "#B3A897", "#2B3A31", "#271E1A", "#141B17", "#FF6B5E", "#FF897E", "#2A0806", "#93443C", "#173F29", "#BEC9C3", "#5C5214"],
    glow: ["radial-gradient(80% 60% at 100% 0%, rgba(255,200,90,.26), transparent 62%), radial-gradient(80% 60% at 0% 100%, rgba(214,60,50,.10), transparent 62%), #FBF6EF", "radial-gradient(80% 60% at 100% 0%, rgba(255,180,70,.12), transparent 62%), radial-gradient(80% 60% at 0% 100%, rgba(40,140,80,.18), transparent 62%), #0F1512"], spine: ["linear-gradient(180deg,#1F5A3A,#123824)", "linear-gradient(180deg,#173F29,#070D0A)"], btn: ["linear-gradient(135deg,#B8322F,#D9542B)", "linear-gradient(135deg,#FF6B5E,#FFB347)"]},
  {id: "cafe", name: "Cozy Café", tier: "pro", group: "pro", desc: "Coffee beans and drifting steam.",
    light: ["#F7F0E6", "rgba(120,80,40,.10)", "#FFFCF7", "#2E2016", "#7A6352", "#E8DACA", "#F1E6D8", "#FCF7F0", "#8A5A2B", "#B07A45", "#FFFFFF", "#4A2F1C", "#4A2F1C", "#EBD7C0", "#F4D08A"],
    dark: ["#17110C", "rgba(220,170,120,.07)", "#221912", "#F5EBDD", "#BFA48C", "#3D2E22", "#2E231A", "#1C150F", "#D9A06A", "#E8B888", "#2A1808", "#8A5A2B", "#0E0A07", "#D9C2A6", "#6B4A18"],
    glow: ["radial-gradient(90% 70% at 100% 100%, rgba(176,122,69,.18), transparent 62%), radial-gradient(70% 60% at 0% 0%, rgba(244,208,138,.30), transparent 62%), #F7F0E6", "radial-gradient(90% 70% at 100% 100%, rgba(217,160,106,.13), transparent 62%), radial-gradient(70% 60% at 0% 0%, rgba(138,90,43,.20), transparent 62%), #17110C"], spine: ["linear-gradient(90deg,#5A3A24,#43291A 40%,#5A3A24)", "linear-gradient(90deg,#2A1A10,#1A100A 40%,#2A1A10)"], btn: ["linear-gradient(135deg,#8A5A2B,#A8703C)", "linear-gradient(135deg,#D9A06A,#B07A45)"]},
  {id: "sunset", name: "Sunset Beach", tier: "pro", group: "pro", desc: "Seashells and a starfish on the sand.",
    light: ["#FFF3EC", "rgba(240,110,80,.08)", "#FFFFFF", "#3A1A2A", "#86606F", "#F4D9CE", "#FCE7DE", "#FFF8F4", "#D43F5C", "#FF7A59", "#FFFFFF", "#5B2A5E", "#5B2A5E", "#F6CFE0", "#FFD27A"],
    dark: ["#1E1020", "rgba(255,140,110,.06)", "#2A1730", "#FBE9EF", "#C49AAE", "#472A4B", "#3A2140", "#241329", "#FF7A8F", "#FF9E7A", "#2A0A12", "#B0487A", "#140A16", "#E6B6CC", "#8A5A1A"],
    glow: ["radial-gradient(80% 60% at 80% 100%, rgba(255,122,89,.18), transparent 62%), linear-gradient(180deg, #FFE3D6, #FFF3EC 60%)", "radial-gradient(80% 60% at 80% 100%, rgba(255,122,143,.16), transparent 62%), linear-gradient(180deg, #2E1234, #1E1020 60%)"], spine: ["linear-gradient(180deg,#8A3A6A,#E0664A)", "linear-gradient(180deg,#5A2050,#140A16)"], btn: ["linear-gradient(135deg,#D43F5C,#FF9A4A)", "linear-gradient(135deg,#D43F5C,#FF9A4A)"]},
  {id: "mint", name: "Mint Chip", tier: "pro", group: "pro", desc: "Mint sprigs and chocolate shavings.",
    light: ["#EFFAF5", "rgba(58,42,32,.13)", "#FFFFFF", "#0F2A21", "#52756A", "#D0EBDF", "#E0F4EB", "#F6FCF9", "#0F845F", "#25B585", "#FFFFFF", "#0F4C3A", "#3A2A20", "#D5F5E7", "#C9F7E3"],
    dark: ["#0A1A14", "rgba(200,160,120,.10)", "#11261E", "#E3F7EE", "#8FB9A8", "#1D3F32", "#163428", "#0D1F18", "#3FD6A0", "#6BE3B8", "#04241A", "#1E8A66", "#140E0A", "#B9EBD6", "#1E5A45"],
    glow: ["radial-gradient(90% 70% at 0% 0%, rgba(37,181,133,.17), transparent 62%), radial-gradient(80% 60% at 100% 100%, rgba(90,63,46,.10), transparent 62%), #EFFAF5", "radial-gradient(90% 70% at 0% 0%, rgba(63,214,160,.13), transparent 62%), radial-gradient(80% 60% at 100% 100%, rgba(140,90,60,.16), transparent 62%), #0A1A14"], spine: ["linear-gradient(180deg,#5A3F2E,#3A2A20)", "linear-gradient(180deg,#3A2A20,#140E0A)"], btn: ["linear-gradient(135deg,#0F845F,#25B585)", "linear-gradient(135deg,#0F845F,#25B585)"]},
  {id: "bokeh", name: "Colorful Bokeh", tier: "pro", group: "pro", desc: "Soft circles of colored light.",
    light: ["#F7F6FB", "transparent", "#FFFFFF", "#1F1D2B", "#666378", "#E2E0EC", "#ECEBF8", "#FBFAFD", "#5B5BD6", "#8484E0", "#FFFFFF", "#343367", "#34315A", "#C6C5D1", "#FFF3A3"],
    dark: ["#0E0D16", "transparent", "#17162A", "#EEEDF7", "#A3A1BC", "#2A2842", "#1C1B2D", "#121220", "#9B9BFF", "#AFAFFF", "#FFFFFF", "#5C5B96", "#26234A", "#C2C1CC", "#5C5214"],
    glow: ["radial-gradient(70% 60% at 0% 0%, rgba(255,100,160,.10), transparent 62%), radial-gradient(70% 60% at 100% 100%, rgba(40,190,200,.10), transparent 62%), #F7F6FB", "radial-gradient(70% 60% at 0% 0%, rgba(255,100,160,.14), transparent 62%), radial-gradient(70% 60% at 100% 100%, rgba(40,190,200,.14), transparent 62%), #0E0D16"], spine: ["linear-gradient(180deg,#34315A,#1E1C38)", "linear-gradient(180deg,#26234A,#07060E)"], btn: ["linear-gradient(135deg,#5B5BD6,#D65BA0)", "linear-gradient(135deg,#5B5BD6,#D65BA0)"]},
  {id: "neon", name: "Neon Dusk", tier: "pro", group: "pro", desc: "Glowing blue and magenta neon.",
    light: ["#F5F4FC", "transparent", "#FFFFFF", "#17163A", "#5F5D86", "#DEDBF2", "#E8EAFB", "#FAFAFE", "#3F63EE", "#6F8AF2", "#FFFFFF", "#253179", "#2C2A7E", "#C4C3DB", "#FFF3A3"],
    dark: ["#08071A", "transparent", "#100F2B", "#EDECFF", "#A09CCC", "#24214B", "#141631", "#0C0B22", "#8098FF", "#99ADFF", "#FFFFFF", "#4A5798", "#1C1A58", "#BFBFD0", "#5C5214"],
    glow: ["radial-gradient(80% 60% at 0% 0%, rgba(72,110,245,.14), transparent 62%), radial-gradient(80% 60% at 100% 100%, rgba(200,75,235,.13), transparent 62%), #F5F4FC", "radial-gradient(80% 60% at 0% 0%, rgba(72,110,245,.22), transparent 62%), radial-gradient(80% 60% at 100% 100%, rgba(200,75,235,.22), transparent 62%), #08071A"], spine: ["linear-gradient(180deg,#2C2A7E,#1A1542)", "linear-gradient(180deg,#1C1A58,#06050F)"], btn: ["linear-gradient(135deg,#486EF5,#C84BEB)", "linear-gradient(135deg,#486EF5,#C84BEB)"]},
  {id: "candy", name: "Candy Land", tier: "pro", group: "pro", desc: "Wrapped candies in pastel colors.",
    light: ["#FDF6FF", "rgba(170,120,255,.12)", "#FFFFFF", "#2D1F3D", "#75648A", "#EADDF7", "#F6ECFF", "#FFFBFF", "#8E44F0", "#FF6FB5", "#FFFFFF", "#5B3FA0", "#6A4BC4", "#F1E4FF", "#BFF5E0"],
    dark: ["#160F20", "rgba(200,160,255,.10)", "#21172E", "#F7EEFF", "#B7A5CF", "#3A2B50", "#2C2040", "#1B1327", "#C08BFF", "#FF8FC6", "#1E0B33", "#7B55D6", "#0D0814", "#E1CCFF", "#3E6B5A"],
    glow: ["radial-gradient(70% 60% at 0% 0%, rgba(255,111,181,.18), transparent 62%), radial-gradient(70% 60% at 100% 30%, rgba(142,68,240,.14), transparent 62%), radial-gradient(70% 60% at 40% 100%, rgba(142,228,184,.24), transparent 62%), #FDF6FF", "radial-gradient(70% 60% at 0% 0%, rgba(255,111,181,.13), transparent 62%), radial-gradient(70% 60% at 100% 30%, rgba(142,68,240,.20), transparent 62%), radial-gradient(70% 60% at 40% 100%, rgba(62,107,90,.25), transparent 62%), #160F20"], spine: ["linear-gradient(180deg,#8E5AF0,#D65AB0)", "linear-gradient(180deg,#5A2E9E,#2A0F3A)"], btn: ["linear-gradient(135deg,#8E44F0,#FF6FB5)", "linear-gradient(135deg,#8E44F0,#FF6FB5)"]},
  {id: "arcade", name: "Synthwave", tier: "pro", group: "pro", desc: "Retro stripes in orange, pink and violet.",
    light: ["#F7F2FF", "rgba(255,0,170,.08)", "#FFFFFF", "#1A1033", "#5E527E", "#DCD4F5", "#ECE7FF", "#FAF9FF", "#D0107F", "#00B8D9", "#FFFFFF", "#1A1033", "#1A1033", "#7CF3FF", "#B8FF3B"],
    dark: ["#0A0616", "rgba(0,240,255,.08)", "#140C28", "#F4EEFF", "#A596CF", "#33225C", "#1F1440", "#0F0920", "#FF2FB3", "#28E6FF", "#16001E", "#7A2BFF", "#05020D", "#7CF3FF", "#3F6B00"],
    glow: ["linear-gradient(180deg, rgba(255,111,200,.14), transparent 45%), radial-gradient(80% 50% at 50% 100%, rgba(0,184,217,.16), transparent 62%), #F7F2FF", "linear-gradient(180deg, rgba(122,43,255,.28), transparent 50%), radial-gradient(80% 50% at 50% 100%, rgba(255,47,179,.22), transparent 62%), #0A0616"], spine: ["linear-gradient(180deg,#3A1466,#1A1033)", "linear-gradient(180deg,#3A0F6A,#05020D)"], btn: ["linear-gradient(135deg,#FF2FB3,#7A2BFF)", "linear-gradient(135deg,#FF2FB3,#7A2BFF)"]},
  {id: "cats", name: "Cozy Cats", tier: "pro", group: "hobby", desc: "A cat batting a ball of yarn.",
    light: ["#F7F0EA", "rgba(181,86,63,.10)", "#FFFDFB", "#33231F", "#7D6760", "#EADDD4", "#F3E7E0", "#FCF8F4", "#B5563F", "#C8806F", "#FFFFFF", "#7A3F31", "#5A3A32", "#EFDAD5", "#E1BBB2"],
    dark: ["#1A1412", "rgba(240,154,120,.08)", "#241C19", "#F6ECE6", "#BFA79C", "#3D302B", "#2F211C", "#1E1715", "#F09A78", "#F4B39A", "#2A120A", "#855745", "#120D0B", "#F4D3C5", "#704A3B"],
    glow: ["radial-gradient(90% 70% at 100% 100%, rgba(230,150,110,.20), transparent 62%), radial-gradient(80% 60% at 0% 0%, rgba(250,215,170,.32), transparent 62%), #F7F0EA", "radial-gradient(90% 70% at 100% 100%, rgba(240,154,120,.12), transparent 62%), radial-gradient(80% 60% at 0% 0%, rgba(138,90,74,.22), transparent 62%), #1A1412"], spine: ["linear-gradient(180deg,#8A5A4A,#5A3A32)", "linear-gradient(180deg,#4A3029,#120D0B)"], btn: ["linear-gradient(135deg,#B5563F,#D98A5C)", "linear-gradient(135deg,#F09A78,#F5C08A)"]},
  {id: "music", name: "Music Room", tier: "pro", group: "hobby", desc: "Flowing sheet music.",
    light: ["#F3F2F8", "rgba(91,79,201,.10)", "#FFFFFF", "#1E1B38", "#645F86", "#DFDCEE", "#EAE8F5", "#FAFAFC", "#5B4FC9", "#847BD6", "#FFFFFF", "#403888", "#29254F", "#DBD8F3", "#BDB9E9"],
    dark: ["#0F0E1A", "rgba(169,155,255,.08)", "#181628", "#ECEAFB", "#A29DC6", "#2B2848", "#1E1C31", "#131120", "#A99BFF", "#BEB4FF", "#16103A", "#5C548C", "#08070F", "#D8D2FC", "#4D4676"],
    glow: ["radial-gradient(90% 70% at 100% 100%, rgba(140,110,230,.16), transparent 62%), radial-gradient(80% 60% at 0% 0%, rgba(255,190,220,.22), transparent 62%), #F3F2F8", "radial-gradient(90% 70% at 100% 100%, rgba(140,110,255,.16), transparent 62%), radial-gradient(80% 60% at 0% 0%, rgba(200,90,170,.12), transparent 62%), #0F0E1A"], spine: ["linear-gradient(180deg,#453E86,#29254F)", "linear-gradient(180deg,#2C2760,#08070F)"], btn: ["linear-gradient(135deg,#5B4FC9,#8A63D6)", "linear-gradient(135deg,#A99BFF,#D0A6FF)"]},
  {id: "reading", name: "Reading Nook", tier: "pro", group: "hobby", desc: "A stack of well-loved books.",
    light: ["#F6F2EB", "rgba(150,64,74,.10)", "#FFFDF9", "#2B1F1C", "#76665F", "#E8DFD3", "#F0E7E1", "#FBF9F3", "#96404A", "#B07077", "#FFFFFF", "#663135", "#451D24", "#E8D5D7", "#D5B3B7"],
    dark: ["#16110F", "rgba(240,144,154,.08)", "#211A17", "#F5ECE4", "#BCA89C", "#3A2E29", "#2C1E1D", "#1A1512", "#F0909A", "#F4ACB3", "#2E0A10", "#835054", "#0F0A09", "#F4D0CE", "#6D4447"],
    glow: ["radial-gradient(90% 70% at 100% 100%, rgba(150,64,74,.12), transparent 62%), radial-gradient(80% 60% at 0% 0%, rgba(250,210,150,.30), transparent 62%), #F6F2EB", "radial-gradient(90% 70% at 100% 100%, rgba(240,144,154,.08), transparent 62%), radial-gradient(80% 60% at 0% 0%, rgba(200,140,80,.14), transparent 62%), #16110F"], spine: ["linear-gradient(180deg,#6E3038,#451D24)", "linear-gradient(180deg,#4A2328,#0F0A09)"], btn: ["linear-gradient(135deg,#96404A,#C0704E)", "linear-gradient(135deg,#F0909A,#F2B98A)"]},
  {id: "knitting", name: "Knitting Nook", tier: "pro", group: "hobby", desc: "Yarn balls and knitting needles.",
    light: ["#F2F4EE", "rgba(78,127,88,.10)", "#FFFFFD", "#20291F", "#667160", "#DDE3D6", "#E8EDE5", "#FAFBF7", "#4E7F58", "#7A9F82", "#FFFFFF", "#39583E", "#3A5440", "#D8E3DA", "#B8CCBC"],
    dark: ["#10150F", "rgba(149,211,156,.08)", "#182018", "#EAF1E6", "#A3B39C", "#2A3629", "#1D281D", "#131913", "#95D39C", "#B0DEB5", "#0C2410", "#527456", "#090D09", "#D0E8D0", "#456147"],
    glow: ["radial-gradient(90% 70% at 100% 100%, rgba(230,190,90,.22), transparent 62%), radial-gradient(80% 60% at 0% 0%, rgba(150,200,150,.24), transparent 62%), #F2F4EE", "radial-gradient(90% 70% at 100% 100%, rgba(230,190,90,.10), transparent 62%), radial-gradient(80% 60% at 0% 0%, rgba(78,127,88,.20), transparent 62%), #10150F"], spine: ["linear-gradient(180deg,#5A7A5E,#3A5440)", "linear-gradient(180deg,#2F4A33,#090D09)"], btn: ["linear-gradient(135deg,#4E7F58,#7AA260)", "linear-gradient(135deg,#95D39C,#D8C46A)"]},
  {id: "painting", name: "Art Studio", tier: "pro", group: "hobby", desc: "A painter's palette with dabs of paint.",
    light: ["#F6F4EF", "rgba(47,102,184,.10)", "#FFFFFF", "#1F2230", "#646878", "#E4E1DA", "#EAEBEC", "#FBFBF9", "#2F66B8", "#638CCA", "#FFFFFF", "#28477B", "#222C48", "#D1DDEF", "#ACC2E3"],
    dark: ["#10121A", "rgba(134,178,255,.08)", "#181B26", "#ECEEF6", "#A2A7BC", "#2A2F40", "#1C2231", "#13161F", "#86B2FF", "#A4C5FF", "#0B1A36", "#4B628C", "#07090F", "#CDDCF9", "#3F5276"],
    glow: ["radial-gradient(80% 60% at 100% 100%, rgba(240,110,130,.14), transparent 62%), radial-gradient(80% 60% at 0% 0%, rgba(90,150,240,.16), transparent 62%), radial-gradient(60% 50% at 100% 0%, rgba(250,200,80,.16), transparent 62%), #F6F4EF", "radial-gradient(80% 60% at 100% 100%, rgba(240,110,130,.12), transparent 62%), radial-gradient(80% 60% at 0% 0%, rgba(90,150,240,.14), transparent 62%), radial-gradient(60% 50% at 100% 0%, rgba(250,200,80,.06), transparent 62%), #10121A"], spine: ["linear-gradient(180deg,#34466E,#222C48)", "linear-gradient(180deg,#26345A,#07090F)"], btn: ["linear-gradient(135deg,#2F66B8,#D0506A)", "linear-gradient(135deg,#86B2FF,#FF94A8)"]},
  {id: "baking", name: "Bake Shop", tier: "pro", group: "hobby", desc: "A pastry case of sweet treats.",
    light: ["#FAF4EE", "rgba(191,77,102,.10)", "#FFFDFA", "#33211F", "#7E6663", "#EFE0D8", "#F6EAE6", "#FDF9F5", "#BF4D66", "#CF7A8C", "#FFFFFF", "#803946", "#5E2E3C", "#F1D8DD", "#E5B8C2"],
    dark: ["#1A1213", "rgba(255,148,168,.08)", "#251A1B", "#F8ECEA", "#C4A6A6", "#3F2D2F", "#311F22", "#1E1516", "#FF94A8", "#FFAFBE", "#2E0A14", "#8C535E", "#120C0D", "#FAD2D6", "#76464F"],
    glow: ["radial-gradient(90% 70% at 100% 100%, rgba(240,180,120,.22), transparent 62%), radial-gradient(80% 60% at 0% 0%, rgba(255,190,200,.26), transparent 62%), #FAF4EE", "radial-gradient(90% 70% at 100% 100%, rgba(240,160,110,.10), transparent 62%), radial-gradient(80% 60% at 0% 0%, rgba(191,77,102,.14), transparent 62%), #1A1213"], spine: ["linear-gradient(180deg,#8E4A5A,#5E2E3C)", "linear-gradient(180deg,#522A34,#120C0D)"], btn: ["linear-gradient(135deg,#BF4D66,#E08A6A)", "linear-gradient(135deg,#FF94A8,#FFC08A)"]},
  {id: "gardening", name: "Garden Plot", tier: "pro", group: "hobby", desc: "Potted plants and trailing vines.",
    light: ["#F2F5EC", "rgba(53,122,67,.10)", "#FFFFFC", "#1F2A1B", "#62705A", "#DCE4D2", "#E7EEE2", "#FAFBF6", "#357A43", "#689B72", "#FFFFFF", "#2B5631", "#325532", "#D3E2D6", "#AECAB4"],
    dark: ["#0F150E", "rgba(140,214,122,.08)", "#172016", "#E9F2E3", "#A0B497", "#293827", "#1C2819", "#121911", "#8CD67A", "#A9E09B", "#0D2208", "#4E7644", "#090E08", "#CDEAC4", "#416239"],
    glow: ["radial-gradient(90% 70% at 100% 0%, rgba(255,210,110,.26), transparent 62%), radial-gradient(90% 70% at 0% 100%, rgba(120,180,90,.20), transparent 62%), #F2F5EC", "radial-gradient(90% 70% at 100% 0%, rgba(255,200,90,.08), transparent 62%), radial-gradient(90% 70% at 0% 100%, rgba(78,140,70,.18), transparent 62%), #0F150E"], spine: ["linear-gradient(180deg,#4E7F48,#325532)", "linear-gradient(180deg,#2C4A2A,#090E08)"], btn: ["linear-gradient(135deg,#357A43,#7AAE48)", "linear-gradient(135deg,#8CD67A,#D6C470)"]},
  {id: "gaming", name: "Game Night", tier: "pro", group: "hobby", desc: "A controller, coins and power-ups.",
    light: ["#F3F2FA", "rgba(98,70,214,.10)", "#FFFFFF", "#1C1936", "#625E86", "#DEDBF1", "#EAE8F8", "#FAFAFD", "#6246D6", "#8974E0", "#FFFFFF", "#42328E", "#261B55", "#DCD6F6", "#C0B5EF"],
    dark: ["#0C0B18", "rgba(158,139,255,.08)", "#15132A", "#EEEBFF", "#A39ECB", "#28244A", "#1B182F", "#100E1F", "#9E8BFF", "#B6A8FF", "#120A36", "#554B8C", "#07060F", "#D6CEFF", "#463E74"],
    glow: ["radial-gradient(90% 70% at 100% 100%, rgba(98,70,214,.14), transparent 62%), radial-gradient(80% 60% at 0% 0%, rgba(47,200,220,.16), transparent 62%), #F3F2FA", "radial-gradient(90% 70% at 100% 100%, rgba(98,70,214,.22), transparent 62%), radial-gradient(80% 60% at 0% 0%, rgba(47,200,220,.12), transparent 62%), #0C0B18"], spine: ["linear-gradient(180deg,#43308E,#261B55)", "linear-gradient(180deg,#2E2170,#07060F)"], btn: ["linear-gradient(135deg,#6246D6,#2FA7C8)", "linear-gradient(135deg,#9E8BFF,#5FE0E8)"]},
  {id: "photography", name: "Photo Walk", tier: "pro", group: "hobby", desc: "Film, prints and a camera.",
    light: ["#F4F3F1", "rgba(179,95,20,.10)", "#FFFFFF", "#1E1E22", "#66666E", "#E2E0DD", "#F0EAE4", "#FBFAF9", "#B35F14", "#C6874F", "#FFFFFF", "#70421A", "#222228", "#EEDCCB", "#E1BFA1"],
    dark: ["#101012", "rgba(242,164,78,.08)", "#19191C", "#EFEFF2", "#A6A6AE", "#2C2C32", "#271F18", "#141416", "#F2A44E", "#F5BB7A", "#2A1400", "#815A30", "#08080A", "#F0D8C1", "#6A4B2A"],
    glow: ["radial-gradient(90% 70% at 100% 0%, rgba(242,164,78,.18), transparent 62%), radial-gradient(80% 60% at 0% 100%, rgba(120,140,170,.14), transparent 62%), #F4F3F1", "radial-gradient(90% 70% at 100% 0%, rgba(242,164,78,.10), transparent 62%), radial-gradient(80% 60% at 0% 100%, rgba(120,140,170,.10), transparent 62%), #101012"], spine: ["linear-gradient(180deg,#3E3E46,#222228)", "linear-gradient(180deg,#2E2E35,#08080A)"], btn: ["linear-gradient(135deg,#B35F14,#D98A2B)", "linear-gradient(135deg,#F2A44E,#F5C77A)"]},
  {id: "newyear", name: "New Year's Eve", tier: "pro", group: "holiday", desc: "Fireworks over the city.",
    light: ["#F2F2F8", "rgba(61,75,176,.10)", "#FFFFFF", "#1A1C36", "#5F6284", "#DDDEEF", "#E7E8F4", "#FAFAFC", "#3D4BB0", "#6E78C4", "#FFFFFF", "#2D3679", "#1A1F48", "#D4D7EE", "#B1B7DF"],
    dark: ["#0B0C1A", "rgba(242,200,98,.08)", "#14152A", "#EDEEFF", "#A1A3C8", "#262848", "#221F21", "#0F1020", "#F2C862", "#F5D689", "#2A1E00", "#7E6A3E", "#06060F", "#EEE3D0", "#675737"],
    glow: ["radial-gradient(80% 60% at 100% 0%, rgba(242,200,98,.24), transparent 62%), radial-gradient(90% 70% at 0% 100%, rgba(120,110,230,.16), transparent 62%), #F2F2F8", "radial-gradient(80% 60% at 100% 0%, rgba(242,200,98,.10), transparent 62%), radial-gradient(90% 70% at 0% 100%, rgba(90,80,220,.22), transparent 62%), #0B0C1A"], spine: ["linear-gradient(180deg,#2E3674,#1A1F48)", "linear-gradient(180deg,#232A66,#06060F)"], btn: ["linear-gradient(135deg,#3D4BB0,#8A55C8)", "linear-gradient(135deg,#F2C862,#F59A6A)"]},
  {id: "lunarnewyear", name: "Lunar New Year", tier: "pro", group: "holiday", desc: "Red lanterns and plum blossoms.",
    light: ["#FAF1EC", "rgba(184,48,44,.10)", "#FFFDFB", "#35171A", "#81605F", "#F0DDD6", "#F6E5E0", "#FDF8F5", "#B8302C", "#CA6461", "#FFFFFF", "#7D2524", "#641A18", "#EFD1D1", "#E3ACAB"],
    dark: ["#1A0F0E", "rgba(255,122,106,.08)", "#261716", "#FAECE8", "#C9A29C", "#44292A", "#311A17", "#1F1211", "#FF7A6A", "#FF9B8F", "#300806", "#8C443C", "#120808", "#FCCAC2", "#763A33"],
    glow: ["radial-gradient(80% 60% at 100% 0%, rgba(240,190,90,.26), transparent 62%), radial-gradient(90% 70% at 0% 100%, rgba(214,60,50,.12), transparent 62%), #FAF1EC", "radial-gradient(80% 60% at 100% 0%, rgba(255,180,70,.10), transparent 62%), radial-gradient(90% 70% at 0% 100%, rgba(184,48,44,.20), transparent 62%), #1A0F0E"], spine: ["linear-gradient(180deg,#9E2A26,#641A18)", "linear-gradient(180deg,#5E1A18,#120808)"], btn: ["linear-gradient(135deg,#B8302C,#D9782A)", "linear-gradient(135deg,#FF7A6A,#F5C062)"]},
  {id: "valentines", name: "Valentine's Day", tier: "pro", group: "holiday", desc: "Floating hearts.",
    light: ["#FBF1F3", "rgba(194,58,94,.10)", "#FFFFFF", "#36171F", "#835F68", "#F2DCE1", "#F8E6EA", "#FDF9FA", "#C23A5E", "#D16B86", "#FFFFFF", "#832A42", "#6A1F3A", "#F2D4DC", "#E7B0BF"],
    dark: ["#1C0F14", "rgba(255,134,166,.08)", "#29161D", "#FCEAF0", "#CC9DAC", "#4A2634", "#331B23", "#211218", "#FF86A6", "#FFA4BC", "#33061A", "#8E4A5D", "#14080D", "#FDCCDA", "#773F4E"],
    glow: ["radial-gradient(90% 70% at 100% 100%, rgba(240,110,150,.20), transparent 62%), radial-gradient(80% 60% at 0% 0%, rgba(255,190,200,.30), transparent 62%), #FBF1F3", "radial-gradient(90% 70% at 100% 100%, rgba(255,90,140,.14), transparent 62%), radial-gradient(80% 60% at 0% 0%, rgba(160,40,90,.18), transparent 62%), #1C0F14"], spine: ["linear-gradient(180deg,#A33358,#6A1F3A)", "linear-gradient(180deg,#5E1E38,#14080D)"], btn: ["linear-gradient(135deg,#C23A5E,#E8708A)", "linear-gradient(135deg,#FF86A6,#FFB0A0)"]},
  {id: "stpatricks", name: "St. Patrick's Day", tier: "pro", group: "holiday", desc: "Shamrocks and a corner rainbow.",
    light: ["#F0F6EF", "rgba(31,132,70,.10)", "#FFFFFD", "#142A1B", "#587060", "#D6E6D6", "#E3EFE5", "#F9FBF7", "#1F8446", "#57A374", "#FFFFFF", "#1A5C33", "#154E2C", "#CEE4D6", "#A5CEB5"],
    dark: ["#0B160F", "rgba(107,220,140,.08)", "#132219", "#E6F5EA", "#96B8A0", "#23392A", "#152A1C", "#0E1B13", "#6BDC8C", "#90E5A9", "#062010", "#3B794E", "#060D08", "#C1EECE", "#316541"],
    glow: ["radial-gradient(90% 70% at 100% 100%, rgba(60,170,90,.18), transparent 62%), radial-gradient(80% 60% at 100% 0%, rgba(240,210,100,.22), transparent 62%), #F0F6EF", "radial-gradient(90% 70% at 100% 100%, rgba(60,170,90,.18), transparent 62%), radial-gradient(80% 60% at 100% 0%, rgba(240,210,100,.07), transparent 62%), #0B160F"], spine: ["linear-gradient(180deg,#237A44,#154E2C)", "linear-gradient(180deg,#1A4A2C,#060D08)"], btn: ["linear-gradient(135deg,#1F8446,#5AAE3E)", "linear-gradient(135deg,#6BDC8C,#E6D26A)"]},
  {id: "easter", name: "Easter", tier: "pro", group: "holiday", desc: "An egg hunt with a bunny and tulips.",
    light: ["#F6F3FA", "rgba(115,81,196,.10)", "#FFFFFF", "#241F36", "#6A6484", "#E3DDF0", "#EEE9F7", "#FBFAFD", "#7351C4", "#967CD3", "#FFFFFF", "#4F3A84", "#51408A", "#E0D9F2", "#C7B9E7"],
    dark: ["#12101A", "rgba(185,162,255,.08)", "#1B1827", "#F1EEFA", "#AAA2C4", "#2E2942", "#231F31", "#16131F", "#B9A2FF", "#CAB9FF", "#1A1040", "#66598C", "#09080F", "#E0D7FC", "#554A76"],
    glow: ["radial-gradient(90% 70% at 0% 100%, rgba(150,220,160,.24), transparent 62%), radial-gradient(80% 60% at 100% 0%, rgba(255,200,220,.30), transparent 62%), #F6F3FA", "radial-gradient(90% 70% at 0% 100%, rgba(110,180,120,.12), transparent 62%), radial-gradient(80% 60% at 100% 0%, rgba(200,120,180,.12), transparent 62%), #12101A"], spine: ["linear-gradient(180deg,#7A62B8,#51408A)", "linear-gradient(180deg,#3E3170,#09080F)"], btn: ["linear-gradient(135deg,#7351C4,#D66FA8)", "linear-gradient(135deg,#B9A2FF,#FFA8CF)"]},
  {id: "july4", name: "Fourth of July", tier: "pro", group: "holiday", desc: "Waving stripes and stars.",
    light: ["#F3F4F8", "rgba(184,48,61,.10)", "#FFFFFF", "#141C33", "#5B6480", "#DDE1EC", "#EFE8ED", "#FAFBFC", "#B8303D", "#CA646E", "#FFFFFF", "#6E2738", "#172448", "#EFD1D4", "#E3ACB1"],
    dark: ["#0A0E1A", "rgba(255,122,132,.08)", "#131A2B", "#EAF0FB", "#9CA8C2", "#243048", "#221925", "#0E1321", "#FF7A84", "#FF9BA3", "#330810", "#84444F", "#05070D", "#F0CDD7", "#6C3944"],
    glow: ["radial-gradient(80% 60% at 100% 0%, rgba(90,120,210,.16), transparent 62%), radial-gradient(90% 70% at 0% 100%, rgba(220,80,90,.10), transparent 62%), #F3F4F8", "radial-gradient(80% 60% at 100% 0%, rgba(90,120,210,.20), transparent 62%), radial-gradient(90% 70% at 0% 100%, rgba(220,80,90,.12), transparent 62%), #0A0E1A"], spine: ["linear-gradient(180deg,#26386E,#172448)", "linear-gradient(180deg,#1E2E5E,#05070D)"], btn: ["linear-gradient(135deg,#B8303D,#D9564A)", "linear-gradient(135deg,#FF7A84,#FFB36A)"]},
  {id: "halloween", name: "Halloween", tier: "pro", group: "holiday", desc: "Glowing jack-o'-lanterns and bats.",
    light: ["#F7F1EB", "rgba(194,83,26,.10)", "#FFFDFA", "#2A1C2E", "#76657A", "#EADFD8", "#F4E8DE", "#FCF8F4", "#C2531A", "#D17E53", "#FFFFFF", "#7E3A23", "#2C1A3C", "#F2D9CD", "#E7BAA3"],
    dark: ["#140F18", "rgba(255,154,74,.08)", "#1E1724", "#F5EDF7", "#B3A2BC", "#352B3E", "#2C1D1D", "#18121D", "#FF9A4A", "#FFB377", "#2A1000", "#8A5431", "#09060C", "#F8D4C3", "#72472C"],
    glow: ["radial-gradient(90% 70% at 100% 100%, rgba(240,140,60,.20), transparent 62%), radial-gradient(80% 60% at 0% 0%, rgba(150,110,200,.16), transparent 62%), #F7F1EB", "radial-gradient(90% 70% at 100% 100%, rgba(255,140,60,.12), transparent 62%), radial-gradient(80% 60% at 0% 0%, rgba(120,70,170,.22), transparent 62%), #140F18"], spine: ["linear-gradient(180deg,#4E2E66,#2C1A3C)", "linear-gradient(180deg,#3A2250,#09060C)"], btn: ["linear-gradient(135deg,#C2531A,#E08A2E)", "linear-gradient(135deg,#FF9A4A,#FFC860)"]},
  {id: "thanksgiving", name: "Thanksgiving", tier: "pro", group: "holiday", desc: "A turkey, a cornucopia and fall leaves.",
    light: ["#F8F2E9", "rgba(168,80,30,.10)", "#FFFDF8", "#30210F", "#7C6650", "#EDE0CD", "#F3E8DD", "#FCF9F2", "#A8501E", "#BE7C56", "#FFFFFF", "#723B17", "#4E2E14", "#ECD8CE", "#DCB9A5"],
    dark: ["#18120B", "rgba(242,164,90,.08)", "#231B12", "#F6EDE0", "#C2AA8C", "#3E3122", "#2E2113", "#1C160E", "#F2A45A", "#F5BB83", "#2E1400", "#855B32", "#0F0B06", "#F5D7B8", "#6F4C2B"],
    glow: ["radial-gradient(90% 70% at 100% 100%, rgba(210,120,50,.18), transparent 62%), radial-gradient(80% 60% at 0% 0%, rgba(240,200,110,.28), transparent 62%), #F8F2E9", "radial-gradient(90% 70% at 100% 100%, rgba(210,120,50,.12), transparent 62%), radial-gradient(80% 60% at 0% 0%, rgba(180,120,50,.14), transparent 62%), #18120B"], spine: ["linear-gradient(180deg,#7A4A22,#4E2E14)", "linear-gradient(180deg,#4A2C12,#0F0B06)"], btn: ["linear-gradient(135deg,#A8501E,#C8862E)", "linear-gradient(135deg,#F2A45A,#F0CC70)"]},
  {id: "hanukkah", name: "Hanukkah", tier: "pro", group: "holiday", desc: "A menorah under a festive garland.",
    light: ["#F1F4FA", "rgba(46,92,176,.10)", "#FFFFFF", "#13203A", "#5A6982", "#D9E1EE", "#E5EBF6", "#F9FBFD", "#2E5CB0", "#6285C4", "#FFFFFF", "#22417B", "#1C335F", "#D1DBEE", "#ABBEDF"],
    dark: ["#0A1020", "rgba(141,182,255,.08)", "#121A2E", "#E8EFFC", "#97A6C2", "#22304C", "#172136", "#0D1426", "#8DB6FF", "#AAC8FF", "#0A1A3A", "#4C6390", "#050810", "#CDDEFD", "#3E5279"],
    glow: ["radial-gradient(90% 70% at 100% 100%, rgba(80,130,220,.16), transparent 62%), radial-gradient(80% 60% at 0% 0%, rgba(200,215,240,.40), transparent 62%), radial-gradient(50% 40% at 90% 80%, rgba(250,210,110,.14), transparent 62%), #F1F4FA", "radial-gradient(90% 70% at 100% 100%, rgba(80,130,220,.18), transparent 62%), radial-gradient(80% 60% at 0% 0%, rgba(60,90,160,.16), transparent 62%), radial-gradient(50% 40% at 90% 80%, rgba(250,210,110,.06), transparent 62%), #0A1020"], spine: ["linear-gradient(180deg,#2F5294,#1C335F)", "linear-gradient(180deg,#223F78,#050810)"], btn: ["linear-gradient(135deg,#2E5CB0,#4F8AD6)", "linear-gradient(135deg,#8DB6FF,#C8D6F0)"]},
  {id: "diwali", name: "Diwali", tier: "pro", group: "holiday", desc: "Diyas, rangoli and hanging lanterns.",
    light: ["#FAF2E8", "rgba(184,54,122,.10)", "#FFFDF9", "#33191F", "#80636A", "#F0DDCF", "#F6E7E1", "#FDF9F2", "#B8367A", "#CA689B", "#FFFFFF", "#7C2951", "#5A1A3C", "#EFD3E2", "#E3AFCA"],
    dark: ["#1A0F12", "rgba(255,160,74,.08)", "#26171B", "#FBEDEF", "#C9A0AA", "#452A31", "#311E18", "#1F1216", "#FFA04A", "#FFB877", "#2E1200", "#8C582E", "#12080B", "#FCD6BE", "#764928"],
    glow: ["radial-gradient(90% 70% at 100% 100%, rgba(250,170,60,.24), transparent 62%), radial-gradient(80% 60% at 0% 0%, rgba(230,110,170,.16), transparent 62%), #FAF2E8", "radial-gradient(90% 70% at 100% 100%, rgba(255,160,74,.14), transparent 62%), radial-gradient(80% 60% at 0% 0%, rgba(184,54,122,.18), transparent 62%), #1A0F12"], spine: ["linear-gradient(180deg,#8E2A5E,#5A1A3C)", "linear-gradient(180deg,#5A1A3C,#12080B)"], btn: ["linear-gradient(135deg,#B8367A,#E0782E)", "linear-gradient(135deg,#FFA04A,#FF7AB0)"]}
];
const SKIN_KEYS = ["paper", "grid", "surface", "ink", "muted", "line", "soft", "field", "accent", "accent-2", "accent-ink", "sel", "spine", "spine-ink", "mark"];
// Light mode is toned down a touch
function dimLight(v){
  const hx = h => /^#[0-9a-f]{6}$/i.test(h), ink = hx(v[3]) ? v[3] : "#1A1A1A";
  const mix = (a, f) => { if (!hx(a)) return a; const A = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), B = [1, 3, 5].map(i => parseInt(ink.substr(i, 2), 16)); return "#" + A.map((x, i) => Math.round(x + (B[i] - x) * f).toString(16).padStart(2, "0")).join(""); };
  const o = v.slice(); [[0, 0.075], [2, 0.045], [5, 0.035], [6, 0.045], [7, 0.055]].forEach(([i, f]) => { o[i] = mix(o[i], f); }); return o;
}
/* Readable text on every theme */
const HEX6 = /^#[0-9a-f]{6}$/i;
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
const rgbHex = c => "#" + c.map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("");
const hexLum = h => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }, c = hexRgb(h); return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const hexContrast = (a, b) => { const x = hexLum(a), y = hexLum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
function ensureContrast(fg, bgs, min){
  bgs = (bgs || []).filter(b => HEX6.test(b)); if (!HEX6.test(fg) || !bgs.length) return fg;
  const worst = f => Math.min(...bgs.map(b => hexContrast(f, b)));
  if (worst(fg) >= min) return fg;
  const to = bgs.reduce((a, b) => a + hexLum(b), 0) / bgs.length > 0.4 ? [0, 0, 0] : [255, 255, 255], c = hexRgb(fg);
  for (let f = 0.05; f < 1.001; f += 0.05) { const m = rgbHex(c.map((x, i) => x + (to[i] - x) * f)); if (worst(m) >= min) return m; }
  return rgbHex(to);
}
// Plain colors: a soft sidebar gradient from the theme's own spine and accent
const mixHex = (a, b, f) => HEX6.test(a) && HEX6.test(b) ? rgbHex(hexRgb(a).map((x, i) => x + (hexRgb(b)[i] - x) * f)) : a;
const plainSpine = (base, accent, dark) => HEX6.test(base) ? `radial-gradient(130% 55% at 0% 0%,rgba(255,255,255,${dark ? 0.036 : 0.068}),transparent 70%),linear-gradient(170deg,${mixHex(base, accent, dark ? 0.18 : 0.28)} 0%,${base} 45%,${mixHex(base, "#000000", dark ? 0.29 : 0.31)} 100%)` : base;
function skinVars(s, dark){
  let v = dark ? s.dark : s.light; if (!v) return "";
  const dim = !dark && s.id !== "paper"; if (dim) v = dimLight(v);
  const o = {}; SKIN_KEYS.forEach((k, i) => { o[k] = v[i]; });
  o["sel-ink"] = "#FFFFFF"; o["navy"] = v[12]; o["spine-hi"] = dark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.14)";
  if (s.glow) { o.bgimg = dim ? s.glow[0].replace(/#[0-9A-Fa-f]{6}\s*$/, v[0]) : s.glow[dark ? 1 : 0]; o.bgsize = "100% 100%"; o.bgpos = "0 0"; o.bgatt = "fixed"; }
  o.scene = "none"; o["scene-h"] = "0px";
  o["spine-bg"] = s.spine ? s.spine[dark ? 1 : 0] : s.plain ? plainSpine(v[12], v[9], dark) : v[12];
  o["btn-bg"] = s.btn ? s.btn[dark ? 1 : 0] : v[8];
  try {
    o.muted = ensureContrast(o.muted, [o.paper, o.surface, o.soft, o.field, o.line], 5);
    o.accent = ensureContrast(o.accent, [o.paper, o.surface], 4.5);
    o["accent-2"] = ensureContrast(o["accent-2"], [o.paper, o.surface], 3);
    o.sel = ensureContrast(o.sel, [o["sel-ink"]], 4.5);
    const ink0 = o["spine-ink"];
    o.spine = ensureContrast(o.spine, [ink0], 5.5);
    o["spine-bg"] = String(o["spine-bg"]).replace(/#[0-9a-f]{6}/gi, h => ensureContrast(h, [ink0], 5.5));
    o["spine-ink"] = ensureContrast(ink0, [o.spine].concat(String(o["spine-bg"]).match(/#[0-9a-f]{6}/gi) || []), 7);
    o["btn-bg"] = String(o["btn-bg"]).replace(/#[0-9a-f]{6}/gi, h => ensureContrast(h, [o["accent-ink"]], 4.5));
  } catch (e) {}
  const kv = kitVars(s.id);
  return Object.entries(o).map(([k, x]) => `--${k}:${x}`).join(";") + (kv ? ";" + kv : "");
}
function skinCss(s){
  if (!s || !s.light) return "";
  const L0 = skinVars(s, false), ab = (L0.match(/--accent:\s*(#[0-9A-Fa-f]{3,8})/) || [])[1], L = L0 + (ab ? `;--accent-band:${ab}` : ""), D = skinVars(s, true) + (ab ? `;--accent-band:${ab}` : ""), r = `:root[data-skin="${s.id}"]`;
  return `${r}{${L};color-scheme:light}@media (prefers-color-scheme:dark){${r}:not([data-theme="light"]){${D};color-scheme:dark}}${r}[data-theme="dark"]{${D};color-scheme:dark}`;
}

/* Theme artwork */
const skinOf = id => SKINS.find(x => x.id === id);
const isDarkNow = () => { const t = document.documentElement.getAttribute("data-theme"); return t === "dark" || (t !== "light" && !!(window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches)); };
let artSig = "";
function renderSkinArt(){ fire("skinart"); }
let artRaf = 0;
const queueArt = () => { cancelAnimationFrame(artRaf); artRaf = requestAnimationFrame(renderSkinArt); };
addEventListener("resize", queueArt);
if (window.matchMedia) { const mq = matchMedia("(prefers-color-scheme: dark)"); (mq.addEventListener ? mq.addEventListener("change", queueArt) : mq.addListener(queueArt)); }
new MutationObserver(queueArt).observe(document.documentElement, {attributes: true, attributeFilter: ["data-theme", "data-skin"]});
function artThumb(id, dark){ return fire("thumb", id, dark).find(Boolean) || ""; }

/* Completion animations Classic and plain colors keep confetti (drag) and fireworks */
function celebrate(kind){
  if (styleCfg().celebrate === false) return;
  if (fire("celebrate", kind).some(Boolean)) return;
  const id = document.documentElement.dataset.skin;
  const fx = id && THEME_FX[id];
  if (!fx) { fxUntil = performance.now() + 4500; return kind === "check" ? fireworks() : confetti(); }
  runThemeFx(fx);
}
/* A good grade gets the same celebration as finishing a task */
const GRADE_CHEER = (() => {
  const KEY = "studyboard:gradeCheer", MIN = 80;
  const read = () => { try { const o = JSON.parse(localStorage.getItem(KEY) || "null"); return o && typeof o === "object" ? o : null; } catch (e) { return null; } };
  const write = o => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };
  const pctOf = t => t && t.mark && Number(t.mark.outOf) > 0 && t.mark.got !== "" && t.mark.got != null && !isNaN(Number(t.mark.got)) ? Number(t.mark.got) / Number(t.mark.outOf) * 100 : null;
  const good = t => { const p = pctOf(t); return p != null && p >= MIN && (t.type === "Quiz" || t.type === "Assignment") && !t.deleted && !t.archived; };
  const sigOf = t => `${t.mark.got}/${t.mark.outOf}`;
  let T = 0;
  function scan(){
    let seen = null; try { seen = read(); } catch (e) {}
    const list = typeof tasksArr === "function" ? tasksArr() : [];
    const now = list.filter(good);
    if (!seen) { const o = {}; now.forEach(t => { o[t.id] = sigOf(t); }); write(o); return; }
    const fresh = now.filter(t => seen[t.id] !== sigOf(t));
    if (!fresh.length) return;
    if (document.hidden) return;
    fresh.forEach(t => { seen[t.id] = sigOf(t); });
    write(seen);
    try { celebrate("check"); } catch (e) {}
    const t = fresh[0], p = Math.round(pctOf(t));
    try { toast(fresh.length === 1 ? `${p}% on ${t.title}. Great work!` : `${fresh.length} new grades of ${MIN}% or more. Great work!`); } catch (e) {}
  }
  const soon = ms => { clearTimeout(T); T = setTimeout(() => { try { scan(); } catch (e) { console.warn("grade cheer", e); } }, ms); };
  hook("render", () => soon(1500));
  hook("changed", () => soon(600));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) soon(1200); });
  return {scan};
})();
const FX_SHAPES = (() => {
  const r1 = n => Math.round(n * 100) / 100;
  const circ = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
  const polar = (n, fn) => Array.from({length: n}, (_, i) => fn(i, i * 2 * Math.PI / n));
  const snow = polar(6, (i, a) => { const c = Math.cos(a), s = Math.sin(a), bx = 5.5 * c, by = 5.5 * s; return `M0 0L${r1(10 * c)} ${r1(10 * s)}M${r1(bx)} ${r1(by)}L${r1(bx + 3 * Math.cos(a + .7))} ${r1(by + 3 * Math.sin(a + .7))}M${r1(bx)} ${r1(by)}L${r1(bx + 3 * Math.cos(a - .7))} ${r1(by + 3 * Math.sin(a - .7))}`; }).join("");
  const star5 = (R, r) => "M" + polar(10, (i, a) => { const t = a - Math.PI / 2, rr = i % 2 ? r : R; return `${r1(rr * Math.cos(t))} ${r1(rr * Math.sin(t))}`; }).join("L") + "Z";
  const wedgeLines = polar(8, (i, a) => `M0 0L${r1(7.4 * Math.cos(a))} ${r1(7.4 * Math.sin(a))}`).join("");
  const shellD = "M0 8" + Array.from({length: 15}, (_, i) => { const t = (200 + 140 * i / 14) * Math.PI / 180, rr = i % 2 ? 9.2 : 10; return `L${r1(rr * Math.cos(t))} ${r1(8 + rr * Math.sin(t))}`; }).join("") + "Z";
  const shellRibs = [2, 4, 6, 8, 10, 12].map(i => { const t = (200 + 140 * i / 14) * Math.PI / 180; return `M0 8L${r1(8.6 * Math.cos(t))} ${r1(8 + 8.6 * Math.sin(t))}`; }).join("");
  return {
    petal: {d: "M0 -8C5 -8 7 -2 4 4C2.4 6.6 1 7 0 5.6C-1 7 -2.4 6.6 -4 4C-7 -2 -5 -8 0 -8Z"},
    leaf: {d: "M0 -10C6 -6 6 5 0 10C-6 5 -6 -6 0 -10Z", detail: "M0 -8L0 9", dstroke: true},
    maple: {d: "M0 -11L2.6 -5L7.5 -7.5L6 -2L10.5 -1L6.5 2.5L8.5 6L3 5L2 9.5L0 7L-2 9.5L-3 5L-8.5 6L-6.5 2.5L-10.5 -1L-6 -2L-7.5 -7.5L-2.6 -5Z"},
    snow: {d: snow, stroke: true, lw: 1.6},
    bubble: {d: circ(0, 0, 9), stroke: true, lw: 1.4, detail: "M-5 -3A6 6 0 0 1 -1 -6.5", dstroke: true},
    drop: {d: "M0 -10C3.5 -4 6.5 0 6.5 3.5A6.5 6.5 0 0 1 -6.5 3.5C-6.5 0 -3.5 -4 0 -10Z"},
    circle: {d: circ(0, 0, 10)},
    ring: {d: circ(0, 0, 9), stroke: true, lw: 2},
    sparkle: {d: "M0 -10L2.4 -2.4L10 0L2.4 2.4L0 10L-2.4 2.4L-10 0L-2.4 -2.4Z"},
    star: {d: star5(10, 4.4)},
    starfish: {d: star5(10, 4.2), detail: circ(0, -5, .9) + circ(4.7, -1.5, .9) + circ(2.9, 4, .9) + circ(-2.9, 4, .9) + circ(-4.7, -1.5, .9), dfill: true},
    bean: {d: "M-9 0C-9 -5 -4 -6.5 0 -6.5S9 -5 9 0S4 6.5 0 6.5S-9 5 -9 0Z", detail: "M-7 0Q0 3 7 0", dstroke: true},
    chip: {d: "M-4 3C-4 -1 -1 -5 0 -6C1 -5 4 -1 4 3C4 5 2 6 0 6S-4 5 -4 3Z"},
    mintleaf: {d: "M-10 0C-6 -7 5 -7 10 0C5 7 -6 7 -10 0Z", detail: "M-8 0L8 0", dstroke: true},
    shell: {d: shellD, detail: shellRibs, dstroke: true},
    lemon: {d: circ(0, 0, 10), detail: circ(0, 0, 7.6) + wedgeLines, dstroke: true},
    candy: {d: "M-5 -1.2C-4.6 -5.6 4.6 -5.6 5 -1.2L6 -0.6L9.6 -3.6L9 0L9.6 3.6L6 0.6L5 1.2C4.6 5.6 -4.6 5.6 -5 1.2L-6 0.6L-9.6 3.6L-9 0L-9.6 -3.6L-6 -0.6Z", detail: "M-2.4 -3.8Q-1 0 -2.4 3.8M1 -4.2Q2.4 0 1 4.2", dstroke: true},
    butterfly: {d: "M0.3 -3C2 -10 10 -11 10.5 -6C11 -2 6 0 0.3 0.4ZM0.3 0.2C6 0.6 8.6 4 7.4 7.4C6.4 10 2 8 0.3 3ZM-0.3 -3C-2 -10 -10 -11 -10.5 -6C-11 -2 -6 0 -0.3 0.4ZM-0.3 0.2C-6 0.6 -8.6 4 -7.4 7.4C-6.4 10 -2 8 -0.3 3Z", detail: "M0 -5L0 6", dstroke: true},
    bulb: {d: "M0 -4C4 -4 5.5 1 5 4C4.4 8 1.8 10 0 10C-1.8 10 -4.4 8 -5 4C-5.5 1 -4 -4 0 -4Z", detail: "M-2.6 -4H2.6V-8H-2.6Z", dfill: true},
    ball: {d: circ(0, 0, 10), detail: "M0 -10C-5 -4 -5 4 0 10M0 -10C5 -4 5 4 0 10M-10 0H10", dstroke: true},
    puff: {d: circ(0, 0, 10)}
  };
})();


const FX_PATHS = {};
const fxPath = k => FX_PATHS[k] || (FX_PATHS[k] = {d: new Path2D(FX_SHAPES[k].d), detail: FX_SHAPES[k].detail ? new Path2D(FX_SHAPES[k].detail) : null});
const fxR = (a, b) => a + Math.random() * (b - a), fxPick = a => a[Math.floor(Math.random() * a.length)];

/* Each theme: spawn(W, H, dark, n) returns particles; optional draw */
const fxFall = (W, H, n, shape, cols, o = {}) => Array.from({length: n}, () => ({shape, c: fxPick(cols), x: fxR(-20, W + 20), y: fxR(-H * 0.5, -10), vx: fxR(-0.6, 0.6), vy: fxR(o.vmin || 1.2, o.vmax || 2.6), g: 0.012, size: fxR(o.smin || 7, o.smax || 12), rot: fxR(0, 6.3), vr: fxR(-0.06, 0.06), sway: o.sway || 1.3, swf: fxR(0.03, 0.06), flip: o.flip, life: 260, delay: Math.floor(fxR(0, 40)), glow: o.glow}));
const fxRise = (W, H, n, shape, cols, o = {}) => Array.from({length: n}, () => ({shape, c: fxPick(cols), x: o.cx ? fxR(o.cx[0] * W, o.cx[1] * W) : fxR(0, W), y: H + fxR(10, 60), vx: fxR(-0.3, 0.3), vy: -fxR(o.vmin || 1.4, o.vmax || 3), g: 0, size: fxR(o.smin || 5, o.smax || 12), rot: 0, vr: 0, sway: o.sway || 0.8, swf: fxR(0.03, 0.07), grow: o.grow || 0, alpha: o.alpha || 1, life: o.life || 170, delay: Math.floor(fxR(0, 50)), glow: o.glow}));
const fxBurst = (W, H, n, shape, cols, pts, o = {}) => Array.from({length: n}, (_, i) => { const [bx, by] = pts[i % pts.length], up = by > 0.5, a = up ? -Math.PI / 2 + fxR(-0.7, 0.7) + (bx < 0.4 ? 0.3 : bx > 0.6 ? -0.3 : 0) : fxR(0, 6.3), sp = up ? fxR(H * 0.02, H * 0.034) : fxR(3, 8); return {shape, c: fxPick(cols), x: bx * W, y: by * H, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: o.g || 0.3, drag: 0.985, size: fxR(o.smin || 7, o.smax || 12), rot: fxR(0, 6.3), vr: fxR(-0.2, 0.2), sway: 0, life: 210, delay: up ? 0 : Math.floor(fxR(4, 14)), flip: o.flip, glow: o.glow, bounce: o.bounce}; });
const fxTw = (W, H, n, shape, cols, o = {}) => Array.from({length: n}, () => ({shape, c: fxPick(cols), x: fxR(0, W), y: fxR(0, H * (o.top || 1)), vx: 0, vy: o.vy || 0, g: 0, size: fxR(o.smin || 4, o.smax || 9), rot: fxR(0, 0.6), vr: 0, sway: 0, life: fxR(60, 120), delay: Math.floor(fxR(0, 110)), tw: true, grow: o.grow || 0, glow: o.glow, alpha: o.alpha || 1}));
const fxFlutter = (W, H, n, cols) => Array.from({length: n}, (_, i) => { const left = i % 2 === 0; return {shape: "butterfly", c: fxPick(cols), x: left ? fxR(-30, W * 0.2) : fxR(W * 0.8, W + 30), y: H + fxR(10, 80), vx: (left ? 1 : -1) * fxR(0.6, 1.6), vy: -fxR(1.6, 2.8), g: 0, size: fxR(12, 18), rot: 0, vr: 0, sway: 2.2, swf: fxR(0.04, 0.07), flap: fxR(0.25, 0.4), life: 240, delay: Math.floor(fxR(0, 60))}; });
const fxStreaks = (W, H, n, cols) => Array.from({length: n}, () => { const sp = fxR(9, 14); return {shape: null, streak: true, c: fxPick(cols), x: fxR(W * 0.2, W * 1.1), y: fxR(-40, H * 0.35), vx: -sp, vy: sp * 0.5, g: 0, size: 2, life: 70, delay: Math.floor(fxR(0, 120)), glow: 12}; });

const THEME_FX = {
  ocean: {spawn: (W, H, d, n) => fxRise(W, H, n(70), "bubble", d ? ["#9ED3DB", "#E2F5F7", "#3CCFE0"] : ["#0A7F92", "#14A7BD", "#7CC9D6"], {smin: 5, smax: 15, sway: 1.1}).concat(fxBurst(W, H, n(36), "drop", d ? ["#3CCFE0", "#6BDCEA"] : ["#14A7BD", "#0A7F92", "#7CC9D6"], [[0.3, 1.02], [0.7, 1.02]], {smin: 5, smax: 9}))},
  sakura: {spawn: (W, H, d, n) => fxFall(W, H, n(110), "petal", d ? ["#FF86B5", "#FFA4C8", "#EDB9D0", "#FFD6E6"] : ["#F27AA8", "#FFB3CF", "#F9C6D9", "#E8688A"], {sway: 1.8, flip: true})},
  forest: {spawn: (W, H, d, n) => fxFall(W, H, n(80), "leaf", d ? ["#5CCB7E", "#7EDB98", "#3F7A4D"] : ["#2F8A4E", "#45A865", "#8FB886", "#3E9E7A"], {sway: 1.6, flip: true}).concat(fxTw(W, H, n(26), "circle", ["#E8E06A", "#C9F28A"], {smin: 1.6, smax: 3, glow: 10, vy: -0.4}))},
  galaxy: {spawn: (W, H, d, n) => fxStreaks(W, H, n(9), d ? ["#FFFFFF", "#C5BCF5", "#FF9BD6"] : ["#6B4EE6", "#C04EE6", "#8C6FF5"]).concat(fxTw(W, H, n(70), "sparkle", d ? ["#FFFFFF", "#B8A6FF", "#FFD1EC"] : ["#6B4EE6", "#9D86FF", "#C04EE6"], {smin: 3, smax: 8, glow: d ? 10 : 4}))},
  arctic: {spawn: (W, H, d, n) => fxTw(W, H, n(50), "sparkle", d ? ["#FFFFFF", "#A8FFD8", "#C9B8FF"] : ["#2A9FC0", "#6A5AE0", "#3FB39A"], {smin: 2.5, smax: 6, top: 0.6, glow: d ? 8 : 2}),
    draw: (g, f, W, H, d) => { const a = Math.sin(Math.min(1, f / 200) * Math.PI); if (a <= 0) return; [[0.16, "60,255,170", 0], [0.24, "150,90,255", 1.6], [0.1, "80,220,210", 3.1]].forEach(([y0, rgb, ph]) => { g.save(); g.globalAlpha = a * (d ? 0.5 : 0.35); g.shadowBlur = 30; g.shadowColor = `rgb(${rgb})`; g.strokeStyle = `rgba(${rgb},.6)`; g.lineWidth = H * 0.05; g.lineCap = "round"; g.beginPath(); for (let x = -40; x <= W + 40; x += 20) { const y = H * y0 + Math.sin(x / 140 + f / 22 + ph) * H * 0.04 + Math.sin(x / 57 + ph) * H * 0.012; x === -40 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); g.restore(); }); }},
  autumn: {spawn: (W, H, d, n) => fxFall(W, H, n(90), "maple", ["#E07A2E", "#C8561C", "#F2B23E", "#B5401A", "#E8A13A"], {sway: 2.2, flip: true, smin: 8, smax: 14})},
  lemonade: {spawn: (W, H, d, n) => fxBurst(W, H, n(26), "lemon", ["#F2C200", "#FFD84A", "#F5B800"], [[0.12, 1.02], [0.88, 1.02], [0.5, 1.04]], {smin: 9, smax: 14}).concat(fxRise(W, H, n(60), "circle", d ? ["#FFF08A", "#D9F2C7"] : ["#F2C200", "#9ED08A", "#FFE06B"], {smin: 1.5, smax: 4, vmin: 2, vmax: 4, sway: 0.6}))},
  winter: {spawn: (W, H, d, n) => fxFall(W, H, n(100), "snow", d ? ["#FFFFFF", "#DCE9FF", "#B9D4FF"] : ["#6F9AE0", "#9DBBEF", "#3B6FD1"], {vmin: 0.8, vmax: 1.8, sway: 1.2, smin: 5, smax: 12, glow: d ? 8 : 0})},
  xmas: {spawn: (W, H, d, n) => fxBurst(W, H, n(60), "bulb", ["#E0463C", "#2E9E5B", "#F2B53A", "#3D7BE0"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 6, smax: 10, glow: d ? 14 : 6}).concat(fxTw(W, H, n(40), "star", ["#F2C24A", "#FFE08A"], {smin: 3, smax: 7, glow: 10}))},
  spring: {spawn: (W, H, d, n) => fxFlutter(W, H, n(12), ["#A884F0", "#F28BB8", "#F2C84A", "#8FC7F2"]).concat(fxFall(W, H, n(46), "petal", ["#F6A6C8", "#FFD1E3", "#FFFFFF", "#F9E28A"], {sway: 1.6, flip: true, smin: 5, smax: 8}))},
  cafe: {spawn: (W, H, d, n) => fxRise(W, H, n(34), "puff", d ? ["#F5EBDD"] : ["#B99B7E", "#C8AE94"], {cx: [0.36, 0.64], smin: 10, smax: 18, vmin: 1, vmax: 1.8, sway: 1.4, grow: 0.25, alpha: d ? 0.14 : 0.18, glow: 24, life: 190}).concat(fxBurst(W, H, n(24), "bean", ["#6B4226", "#8A5A2B", "#4A2E1A"], [[0.35, 1.02], [0.65, 1.02]], {smin: 7, smax: 10}))},
  sunset: {spawn: (W, H, d, n) => fxBurst(W, H, n(26), "shell", ["#FBC3A8", "#F7A58A", "#FFD9C2"], [[0.15, 1.02], [0.85, 1.02]], {smin: 9, smax: 13}).concat(fxBurst(W, H, n(12), "starfish", ["#F07A8A", "#E8566C"], [[0.3, 1.02], [0.7, 1.02]], {smin: 9, smax: 13}), fxTw(W, H, n(24), "sparkle", ["#FFC06B", "#FFE2A8"], {smin: 3, smax: 6, glow: 8}))},
  mint: {spawn: (W, H, d, n) => fxBurst(W, H, n(50), "mintleaf", ["#25B585", "#3FD6A0", "#0F845F"], [[0.12, 1.02], [0.88, 1.02], [0.3, 0.2], [0.7, 0.2]], {smin: 8, smax: 12, flip: true}).concat(fxBurst(W, H, n(40), "chip", ["#4A2E1A", "#6B4226", "#3A2A20"], [[0.12, 1.02], [0.88, 1.02], [0.5, 1.04]], {smin: 3.5, smax: 5}))},
  summer: {spawn: (W, H, d, n) => fxBurst(W, H, n(40), "drop", ["#23B5D3", "#4FC3F7", "#0E86C9"], [[0.25, 1.02], [0.75, 1.02]], {smin: 5, smax: 9}).concat(fxFall(W, H, n(6), "ball", ["#FF6B6B", "#FFC53D", "#23B5D3"], {vmin: 3, vmax: 5, sway: 0, smin: 14, smax: 20}).map(p => Object.assign(p, {g: 0.35, bounce: true, vr: fxR(-0.08, 0.08)})), fxTw(W, H, n(20), "sparkle", ["#FFD23F", "#FFE98A"], {smin: 3, smax: 6, glow: 8}))},
  bokeh: {spawn: (W, H, d, n) => fxTw(W, H, n(60), "circle", ["#FF64A0", "#28BEC8", "#FFB43C", "#8C6EFF"], {smin: 6, smax: 18, grow: 0.12, glow: 20, alpha: d ? 0.5 : 0.4})},
  neon: {spawn: (W, H, d, n) => fxBurst(W, H, n(80), "circle", ["#4A86FF", "#6E8FFF", "#D05BEF", "#C84BEB"], [[0.5, 0.5]], {smin: 1.6, smax: 3, g: 0.04, glow: 14}).map(p => Object.assign(p, {vx: p.vx * 1.4, vy: p.vy * 1.4})),
    draw: (g, f, W, H, d) => { [[0, "74,134,255"], [18, "205,75,235"], [36, "74,134,255"]].forEach(([t0, rgb]) => { const t = f - t0; if (t < 0 || t > 90) return; const r = t * Math.max(W, H) / 150, a = 1 - t / 90; g.save(); g.globalAlpha = a * 0.8; g.shadowBlur = 22; g.shadowColor = `rgb(${rgb})`; g.strokeStyle = `rgb(${rgb})`; g.lineWidth = 3; g.beginPath(); g.arc(W / 2, H / 2, r, 0, 6.3); g.stroke(); g.restore(); }); }},
  candy: {spawn: (W, H, d, n) => fxBurst(W, H, n(80), "candy", ["#FF6FB5", "#8EE4B8", "#C9A0FF", "#FFD86B", "#6FD3FF"], [[0.12, 1.02], [0.88, 1.02], [0.5, 1.04], [0.3, 0.2], [0.7, 0.2]], {smin: 9, smax: 14})},
  arcade: {spawn: (W, H, d, n) => fxTw(W, H, n(40), "sparkle", ["#FF96C8", "#FFB45A", "#B48CFF", "#FFFFFF"], {smin: 3, smax: 8, glow: 12}),
    draw: (g, f, W, H, d) => { const t = Math.min(1, f / 60), fade = f < 150 ? 1 : Math.max(0, 1 - (f - 150) / 60); if (fade <= 0) return; const R = Math.hypot(W, H) * 0.34 * (0.4 + 0.6 * (1 - Math.pow(1 - t, 3))), w = Math.max(10, Math.min(W, H) * 0.028); [["255,150,60", 0], ["255,80,170", 1], ["150,80,255", 2]].forEach(([rgb, i]) => { g.save(); g.globalAlpha = fade * (d ? 0.55 : 0.45); g.shadowBlur = 16; g.shadowColor = `rgb(${rgb})`; g.strokeStyle = `rgb(${rgb})`; g.lineWidth = w; g.lineCap = "round"; const rr = R - i * w * 1.5; g.beginPath(); g.arc(-W * 0.02, H * 1.02, rr, -Math.PI / 2, -Math.PI / 2 + t * Math.PI / 2); g.stroke(); g.beginPath(); g.arc(W * 1.02, -H * 0.02, rr * 0.8, Math.PI / 2, Math.PI / 2 + t * Math.PI / 2); g.stroke(); g.restore(); }); }}
};


/* Sprites: each shape is drawn once into a small image, then stamped */
const FX_SPR = new Map(), SPR_U = 2.4, SPR_S = 64, SPR_G = 96;
function fxSprite(shape, color, glow, dark){
  const key = shape + "|" + color + "|" + (glow || 0) + "|" + (dark ? 1 : 0);
  let c = FX_SPR.get(key); if (c) return c;
  const S = glow ? SPR_G : SPR_S, sh = FX_SHAPES[shape], pp = fxPath(shape);
  c = document.createElement("canvas"); c.width = c.height = S;
  const g = c.getContext("2d");
  g.translate(S / 2, S / 2); g.scale(SPR_U, SPR_U);
  if (glow) { g.shadowBlur = glow * SPR_U; g.shadowColor = color; }
  if (shape === "orb") { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 10); gr.addColorStop(0, color); gr.addColorStop(0.55, color); gr.addColorStop(1, "rgba(0,0,0,0)"); g.globalAlpha = 0.9; g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 10, 0, 6.3); g.fill(); }
  else if (shape === "puffsoft") { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 12); gr.addColorStop(0, color); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 12, 0, 6.3); g.fill(); }
  else if (sh.stroke) { g.strokeStyle = color; g.lineWidth = sh.lw || 1.4; g.lineCap = "round"; g.stroke(pp.d); }
  else { g.fillStyle = color; g.fill(pp.d); }
  if (pp.detail && shape !== "orb" && shape !== "puffsoft") {
    g.shadowBlur = 0;
    if (sh.dfill) { g.fillStyle = shape === "bulb" ? "#9AA0A8" : dark ? "rgba(0,0,0,.35)" : "rgba(255,255,255,.55)"; g.fill(pp.detail); }
    else { g.strokeStyle = shape === "butterfly" ? "rgba(40,30,60,.55)" : shape === "bubble" ? color : shape === "bean" ? "rgba(255,240,220,.6)" : "rgba(255,255,255,.7)"; g.lineWidth = 1.1; g.lineCap = "round"; g.stroke(pp.detail); }
  }
  c._half = S / 2 / SPR_U;
  FX_SPR.set(key, c); if (FX_SPR.size > 400) FX_SPR.delete(FX_SPR.keys().next().value);
  return c;
}
FX_SHAPES.orb = {d: "M-10 0a10 10 0 1 0 20 0a10 10 0 1 0-20 0"};
FX_SHAPES.puffsoft = {d: "M-10 0a10 10 0 1 0 20 0a10 10 0 1 0-20 0"};

/* Busy window: while a completion animation plays, heavy background work */
let fxUntil = 0;
const fxBusyMs = () => Math.max(0, fxUntil - performance.now());
const fxDefer = fn => { const w = fxBusyMs(); w > 0 ? setTimeout(fn, w + 120) : fn(); };

/* The pop-up plays in front of the page */
function ambientPause(on){}

function runThemeFx(fx){
  if (window.SBMotion && SBMotion.noParticles()) { SBMotion.flash(); return; }
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cv = document.createElement("canvas");
  cv.className = "confetti"; cv.setAttribute("aria-hidden", "true");
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight, dark = isDarkNow();
  cv.width = W * dpr; cv.height = H * dpr; document.body.appendChild(cv);
  const g = cv.getContext("2d"); g.scale(dpr, dpr);
  const scale = 1.5 * Math.max(0.8, Math.min(1.6, Math.sqrt(W * H) / 900));
  const n = x => Math.max(3, Math.round(x * (reduce ? 0.3 : 1) * Math.min(1.3, Math.max(0.55, W * H / 1100000))));
  const P = fx.spawn(W, H, dark, n);
  P.forEach(p => { p.age = 0; if (p.shape) p.spr = fxSprite(p.shape, p.c, p.glow, dark); });
  fxUntil = performance.now() + 5200; ambientPause(true);
  let f = 0, last = performance.now(), acc = 0;
  const step = now => {
    acc += Math.min(100, now - last); last = now;
    let ticks = 0; while (acc >= 16.6 && ticks < 4) { acc -= 16.6; ticks++; tick(); }
    if (!ticks) { requestAnimationFrame(step); return; }
    g.clearRect(0, 0, W, H);
    if (fx.draw) fx.draw(g, f, W, H, dark);
    let alive = 0;
    for (const p of P) {
      if (f < (p.delay || 0)) { alive++; continue; }
      if (p.dead) continue;
      alive++;
      let a = p.alpha || 1;
      if (p.tw) a *= Math.sin(Math.PI * p.age / p.life);
      else { const left = p.life - p.age; if (left < 30) a *= left / 30; if (p.age < 8) a *= p.age / 8; }
      if (a <= 0.01) continue;
      g.globalAlpha = Math.min(1, a);
      if (p.streak) {
        const len = 70 * scale, m = Math.hypot(p.vx, p.vy), ux = p.vx / m, uy = p.vy / m, grd = g.createLinearGradient(p.x, p.y, p.x - ux * len, p.y - uy * len);
        grd.addColorStop(0, p.c); grd.addColorStop(1, "rgba(255,255,255,0)");
        g.strokeStyle = grd; g.lineWidth = 2.2; g.lineCap = "round"; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - ux * len, p.y - uy * len); g.stroke();
        continue;
      }
      const s = p.size * scale / 10 * (1 + (p.grow || 0) * p.age / 10);
      const fl = p.flip ? Math.cos(p.age * 0.08 + p.x * 0.02) : 1, fp = p.flap ? 0.35 + 0.65 * Math.abs(Math.cos(p.age * p.flap)) : 1;
      const sx = s * fl * fp, c = Math.cos(p.rot), si = Math.sin(p.rot), h = p.spr._half;
      g.setTransform(dpr * c * sx, dpr * si * sx, -dpr * si * s, dpr * c * s, dpr * p.x, dpr * p.y);
      g.drawImage(p.spr, -h, -h, 2 * h, 2 * h);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    g.globalAlpha = 1;
    if ((alive || (fx.draw && f < 200)) && f < 300) requestAnimationFrame(step);
    else { cv.style.transition = "opacity .3s"; cv.style.opacity = "0"; setTimeout(() => { cv.remove(); ambientPause(false); }, 320); fxUntil = performance.now() + 350; }
  };
  const tick = () => {
    for (const p of P) {
      if (f < (p.delay || 0) || p.dead) continue;
      p.age++;
      if (p.age > p.life) { p.dead = true; continue; }
      p.vy += p.g || 0; if (p.drag) { p.vx *= p.drag; p.vy *= p.drag; }
      p.x += p.vx + (p.sway ? Math.sin(p.age * (p.swf || 0.05) + p.ph0) * p.sway : 0); p.y += p.vy; p.rot += p.vr || 0;
      if (p.bounce && p.y > H - p.size * scale && p.vy > 0) { p.y = H - p.size * scale; p.vy *= -0.62; p.vx *= 0.9; }
      if (p.y > H + 60 || p.y < -H) p.dead = true;
    }
    f++;
  };
  P.forEach(p => { p.ph0 = p.x * 0.01; p.rot = p.rot || 0; });
  requestAnimationFrame(t => { last = t; requestAnimationFrame(step); });
}


FX_SHAPES.fish = {d: "M10 0C6 -5.5 -3 -5.5 -6 0C-3 5.5 6 5.5 10 0ZM-5 0L-10.5 -4.5L-9.5 0L-10.5 4.5Z", detail: "M4 -1.2a1 1 0 1 0 2 0a1 1 0 1 0 -2 0", dfill: true};
FX_SHAPES.fallleaf = {d: "M0 -10.5C4.6 -8 7.2 -3.2 6.4 1.6C5.8 5.4 3.2 8.2 0.6 9.4L0.6 12.5L-0.6 12.5L-0.6 9.4C-3.2 8.2 -5.8 5.4 -6.4 1.6C-7.2 -3.2 -4.6 -8 0 -10.5Z", detail: "M0 -8.5L0 9M0 -3L3.4 -5.6M0 1L4 -1.6M0 -3L-3.4 -5.6M0 1L-4 -1.6", dstroke: true};
FX_SHAPES.oakleaf = {d: "M0 -11C2 -10 3.4 -8.6 3 -7C5.2 -7.4 6.2 -5.6 5 -4C7.4 -3.8 7.6 -1.2 5.8 0C7.8 1 7 3.6 4.8 3.8C5.4 6 3.4 7.4 1.4 6.8L0.7 12.5L-0.7 12.5L-1.4 6.8C-3.4 7.4 -5.4 6 -4.8 3.8C-7 3.6 -7.8 1 -5.8 0C-7.6 -1.2 -7.4 -3.8 -5 -4C-6.2 -5.6 -5.2 -7.4 -3 -7C-3.4 -8.6 -2 -10 0 -11Z", detail: "M0 -8.5L0 8", dstroke: true};
FX_SHAPES.sprinkle = {d: "M-7 -1.8H7A1.8 1.8 0 0 1 7 1.8H-7A1.8 1.8 0 0 1 -7 -1.8Z"};


/* Shapes for the hobby and holiday themes */
(() => {
  const c = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  Object.assign(FX_SHAPES, {
    note: {d: "M-6.2 6.4C-6.8 4.4 -4.6 2.4 -1.8 2.2C0 2.1 1 2.6 1.4 3.2V-9.6H3V-9.4C3.4 -6.4 7.6 -5.6 7.2 -1.6C6.8 -3.6 5 -5 3 -5.2V5.4C3 7.6 0.6 9.2 -2.2 9.2C-4.2 9.2 -5.8 8.2 -6.2 6.4Z"},
    paw: {d: c(0, 3.6, 4.6) + c(-5.6, -2.4, 2.3) + c(-2, -6.2, 2.3) + c(2, -6.2, 2.3) + c(5.6, -2.4, 2.3)},
    yarn: {d: c(0, 0, 9), detail: "M-8 -3C-3 -6 3 -6 8 -3M-8.6 1.5C-3 -2 3 -2 8.6 1.5M-6 6.5C-2 3 2 3 6 6.5M-3 -8.4C2 -4 3 3 1 8.8", dstroke: true},
    pixel: {d: "M-6 -6H6V6H-6Z"},
    coin: {d: c(0, 0, 9), detail: c(0, 0, 6.2), dstroke: true},
    gem: {d: "M-8 -3L-4 -8H4L8 -3L0 9Z", detail: "M-8 -3H8M-4 -8L-1.6 -3L0 9M4 -8L1.6 -3", dstroke: true},
    clover: {d: "M0 -1C-2.5 -9 -9.5 -7 -6.5 -2.4C-9.8 -4 -11 2.8 -4.6 2.6C-8 5.4 -2 8.2 -0.6 2.6L-1.2 10H1.2L0.6 2.6C2 8.2 8 5.4 4.6 2.6C11 2.8 9.8 -4 6.5 -2.4C9.5 -7 2.5 -9 0 -1Z"},
    egg: {d: "M0 -10C5 -10 7.6 -1 7.6 3.2A7.6 7.2 0 0 1 -7.6 3.2C-7.6 -1 -5 -10 0 -10Z", detail: "M-7 1.2L-4.6 -1.4L-2.3 1.2L0 -1.4L2.3 1.2L4.6 -1.4L7 1.2", dstroke: true},
    bat: {d: "M0 -2.2C0.8 -4.6 2 -4.4 2.4 -2.4C5 -5.4 9.4 -5.6 11.4 -3.2C9.4 -2.2 9 0 9.6 2.2C7.6 1 5.8 1.6 5.2 3.2C3.6 1.6 1.6 2.2 0 4.4C-1.6 2.2 -3.6 1.6 -5.2 3.2C-5.8 1.6 -7.6 1 -9.6 2.2C-9 0 -9.4 -2.2 -11.4 -3.2C-9.4 -5.6 -5 -5.4 -2.4 -2.4C-2 -4.4 -0.8 -4.6 0 -2.2Z"},
    pumpkin: {d: "M0 -5.6C3.4 -8 8.6 -6.6 9.8 -1.6C11 3.6 8 9 3.2 9C1.6 9 0.6 8.4 0 8C-0.6 8.4 -1.6 9 -3.2 9C-8 9 -11 3.6 -9.8 -1.6C-8.6 -6.6 -3.4 -8 0 -5.6Z", detail: "M0 -5.2C-1.6 -1 -1.6 4 0 7.8M-4.6 -6.6C-7.2 -2 -7 4 -4.2 8.6M4.6 -6.6C7.2 -2 7 4 4.2 8.6M0 -5.6L1.4 -9.6", dstroke: true},
    lantern: {d: "M-6.5 -7.5H6.5L8.6 -4C10.4 -0.5 10.4 2.5 8.6 5.6L6.5 7.5H-6.5L-8.6 5.6C-10.4 2.5 -10.4 -0.5 -8.6 -4Z", detail: "M-3 -7.5C-4.6 -2.5 -4.6 2.5 -3 7.5M3 -7.5C4.6 -2.5 4.6 2.5 3 7.5M0 7.5V11.5M0 -7.5V-10.5", dstroke: true},
    stardavid: {d: "M0 -9.6L8.3 4.8H-8.3ZM0 9.6L8.3 -4.8H-8.3Z", stroke: true, lw: 1.7},
    dreidel: {d: "M-5.4 -5H5.4V3.2L0 9.4L-5.4 3.2Z M-1.1 -5V-9.4H1.1V-5Z"},
    confetti: {d: "M-5 -1.8H5V1.8H-5Z"},
    flame: {d: "M0 -10.4C3.4 -5.4 6 -2.2 6 2.4A6 6.4 0 0 1 -6 2.4C-6 -1.4 -2.2 -3.6 0 -10.4Z", detail: "M0 -2.6C1.6 0 2.6 1.4 2.6 3.2A2.6 2.6 0 0 1 -2.6 3.2C-2.6 1.4 -1.2 0.4 0 -2.6Z", dfill: true},
    acorn: {d: "M-6.6 -2.4C-6.6 -6.8 6.6 -6.8 6.6 -2.4ZM-5.4 -2.4C-5.4 3.6 -2.2 8 0 9.4C2.2 8 5.4 3.6 5.4 -2.4ZM-0.8 -6.6V-9.4H0.8V-6.6Z"},
    cupcake: {d: "M-6.4 1.4H6.4L4.8 9.4H-4.8Z M-7.4 1.4C-8.4 -2.6 -4.6 -4.8 -2.4 -4.6C-2.2 -8.4 2.6 -9.6 3.4 -5.8C6.4 -6.6 8.6 -2.6 7.4 1.4Z", detail: "M-2.6 1.6L-2 9.2M0.6 1.6V9.2M3.6 1.6L3 9.2", dstroke: true},
    camera: {d: "M-9.6 -4.4H-4.4L-2.4 -7.4H2.4L4.4 -4.4H9.6V7.4H-9.6Z", detail: c(0, 1.4, 3.8), dstroke: true},
    book: {d: "M-9 -6.4H9V6.4H-9Z", detail: "M0 -6.4V6.4M-7 -3.6H-2M-7 -0.6H-2M2 -3.6H7M2 -0.6H7", dstroke: true},
    print: {d: "M-8 -8.4H8V9.4H-8Z", detail: "M-6 -6.4H6V4.2H-6Z", dstroke: true},
    heart: {d: "M0 9C-8 3.4 -10.4 -1.6 -9.2 -5.2C-8 -9 -2.4 -9.6 0 -5C2.4 -9.6 8 -9 9.2 -5.2C10.4 -1.6 8 3.4 0 9Z"},
    flower: {d: c(0, -5, 3.6) + c(4.8, -1.5, 3.6) + c(3, 4, 3.6) + c(-3, 4, 3.6) + c(-4.8, -1.5, 3.6), detail: c(0, 0, 2.6), dfill: true}
  });
})();



/* Completion animations for the hobby and holiday themes */
const fxFirework = cols => (g, f, W, H, d) => {
  const B = [[0.28, 0.3, 0], [0.7, 0.24, 16], [0.5, 0.42, 34], [0.18, 0.5, 52], [0.84, 0.46, 66]];
  g.save(); g.lineCap = "round"; if (d) g.globalCompositeOperation = "lighter";
  B.forEach(([bx, by, t0], i) => {
    const t = f - t0; if (t < 0 || t > 110) return;
    const p = t / 110, e = 1 - Math.pow(1 - Math.min(1, p * 1.6), 3), R = Math.min(W, H) * (0.16 + 0.05 * (i % 2)), a = Math.max(0, 1 - Math.pow(p, 1.6));
    const col = cols[i % cols.length], cx = bx * W, cy = by * H, n = 18;
    for (let k = 0; k < n; k++) {
      const ang = k / n * Math.PI * 2 + i, r1 = R * e * 0.45, r2 = R * e, droop = p * p * R * 0.35;
      const x1 = cx + Math.cos(ang) * r1, y1 = cy + Math.sin(ang) * r1 + droop * 0.5, x2 = cx + Math.cos(ang) * r2, y2 = cy + Math.sin(ang) * r2 + droop;
      g.globalAlpha = a * 0.75; g.strokeStyle = col; g.lineWidth = Math.max(1.4, R * 0.022);
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      g.globalAlpha = a; g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(x2, y2, Math.max(1.2, R * 0.016), 0, 6.3); g.fill();
    }
  });
  g.restore();
};
Object.assign(THEME_FX, {
  cats: {spawn: (W, H, d, n) => fxBurst(W, H, n(40), "paw", d ? ["#F4B39A", "#F6ECE6", "#D98A6C"] : ["#B5563F", "#D98A6C", "#8C4A38"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 8, smax: 13}).concat(fxFall(W, H, n(5), "yarn", ["#E07A8A", "#8FB8E8", "#F2C24A", "#9FD08A"], {vmin: 3, vmax: 5, sway: 0, smin: 14, smax: 20}).map(p => Object.assign(p, {g: 0.35, bounce: true, vr: fxR(-0.08, 0.08)})))},
  music: {spawn: (W, H, d, n) => fxRise(W, H, n(70), "note", d ? ["#C9B8FF", "#F6E7FF", "#8FB0FF"] : ["#6A4FC9", "#8C6FF5", "#3D6AD6"], {smin: 9, smax: 15, sway: 1.8, vmin: 1.6, vmax: 3})},
  reading: {spawn: (W, H, d, n) => fxFall(W, H, n(40), "book", d ? ["#E8A08A", "#8FB8E8", "#E8C77A", "#A8D8B0"] : ["#B5563F", "#3D6AD6", "#C9962A", "#3E8A5A"], {flip: true, smin: 9, smax: 14, sway: 1.4}).concat(fxTw(W, H, n(26), "sparkle", ["#F2C24A", "#FFE08A"], {smin: 3, smax: 7, glow: d ? 10 : 4}))},
  knitting: {spawn: (W, H, d, n) => fxFall(W, H, n(10), "yarn", ["#E07A8A", "#8FB8E8", "#F2C24A", "#9FD08A", "#C9A0E8"], {vmin: 3, vmax: 5, sway: 0, smin: 14, smax: 22}).map(p => Object.assign(p, {g: 0.35, bounce: true, vr: fxR(-0.08, 0.08)})).concat(fxRise(W, H, n(30), "heart", ["#F28BB8", "#FFB3CF"], {smin: 6, smax: 10}))},
  painting: {spawn: (W, H, d, n) => fxBurst(W, H, n(90), "circle", ["#E0463C", "#3D7BE0", "#F2C24A", "#2E9E5B", "#A45CD6", "#F28A3A"], [[0.12, 1.02], [0.88, 1.02], [0.5, 1.04], [0.3, 0.2], [0.7, 0.2]], {smin: 4, smax: 11})},
  baking: {spawn: (W, H, d, n) => fxBurst(W, H, n(70), "sprinkle", ["#FF6FB5", "#8EE4B8", "#C9A0FF", "#FFD86B", "#6FD3FF"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 5, smax: 7}).concat(fxBurst(W, H, n(10), "cupcake", ["#F7A8C4", "#C9A0E8", "#9FD8C4"], [[0.3, 1.02], [0.7, 1.02]], {smin: 11, smax: 15}))},
  gardening: {spawn: (W, H, d, n) => fxBurst(W, H, n(50), "leaf", ["#3E9E4F", "#6CC070", "#2F7A3E"], [[0.12, 1.02], [0.88, 1.02]], {smin: 8, smax: 12, flip: true}).concat(fxBurst(W, H, n(30), "flower", ["#F28BB8", "#F2C24A", "#FFFFFF", "#C9A0E8"], [[0.3, 1.02], [0.7, 1.02], [0.5, 1.04]], {smin: 7, smax: 11}))},
  gaming: {spawn: (W, H, d, n) => fxBurst(W, H, n(36), "coin", ["#F2C24A", "#FFD86B"], [[0.2, 1.02], [0.8, 1.02], [0.5, 1.04]], {smin: 8, smax: 11}).concat(fxBurst(W, H, n(40), "pixel", ["#FF5C8A", "#4AD9FF", "#8CFF6A", "#B48CFF"], [[0.3, 1.02], [0.7, 1.02]], {smin: 3, smax: 5}), fxBurst(W, H, n(6), "star", ["#FFD84A"], [[0.5, 1.04]], {smin: 12, smax: 16, glow: 12}), fxBurst(W, H, n(6), "gem", ["#4AD9FF", "#B48CFF"], [[0.15, 1.02], [0.85, 1.02]], {smin: 9, smax: 12}))},
  photography: {spawn: (W, H, d, n) => fxFall(W, H, n(26), "print", d ? ["#F4EFE6", "#E8E0D2"] : ["#FFFFFF", "#F4EFE6"], {flip: false, smin: 12, smax: 18, sway: 1.2}).concat(fxTw(W, H, n(30), "sparkle", ["#FFFFFF", "#FFE7A8"], {smin: 4, smax: 9, glow: 14}))},
  newyear: {spawn: (W, H, d, n) => fxFall(W, H, n(90), "confetti", ["#F5C451", "#F07AA0", "#3CC8C0", "#9B7BF0", "#FFFFFF"], {sway: 1.6, flip: true, smin: 5, smax: 8}), draw: fxFirework(["#F5C451", "#F07AA0", "#3CC8C0", "#9B7BF0", "#FFE7A8"])},
  lunarnewyear: {spawn: (W, H, d, n) => fxRise(W, H, n(14), "lantern", ["#E0463C", "#D6362F", "#F05A46"], {smin: 12, smax: 18, vmin: 1, vmax: 1.8, sway: 0.8, glow: d ? 18 : 6}).concat(fxTw(W, H, n(36), "sparkle", ["#F5C451", "#FFE08A"], {smin: 3, smax: 7, glow: 10}), fxFall(W, H, n(30), "petal", ["#F7A8C4", "#FFD1E3", "#FFFFFF"], {sway: 1.8, flip: true, smin: 5, smax: 8}))},
  valentines: {spawn: (W, H, d, n) => fxRise(W, H, n(80), "heart", d ? ["#FF86B5", "#FFB3CF", "#E8466E", "#FFD6E6"] : ["#E8466E", "#F28BB8", "#FFB3CF", "#C9265A"], {smin: 7, smax: 15, sway: 1.4})},
  stpatricks: {spawn: (W, H, d, n) => fxFall(W, H, n(70), "clover", ["#2E9E5B", "#4CC07A", "#1F7A44", "#8FD8A0"], {flip: true, sway: 1.6, smin: 8, smax: 13}).concat(fxBurst(W, H, n(24), "coin", ["#F2C24A", "#FFD86B"], [[0.2, 1.02], [0.8, 1.02]], {smin: 7, smax: 10}))},
  easter: {spawn: (W, H, d, n) => fxBurst(W, H, n(40), "egg", ["#F7A8C4", "#C9A0E8", "#9FD8C4", "#F9E28A", "#8FC7F2"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 9, smax: 13}).concat(fxFlutter(W, H, n(8), ["#A884F0", "#F28BB8", "#F2C84A", "#8FC7F2"]))},
  july4: {spawn: (W, H, d, n) => fxFall(W, H, n(60), "star", ["#E0463C", "#3D6AD6", d ? "#FFFFFF" : "#8FA3C8"], {sway: 1.2, smin: 5, smax: 9, flip: false}), draw: fxFirework(["#E0463C", "#FFFFFF", "#3D7BE0", "#F07A7A", "#8FB0FF"])},
  halloween: {spawn: (W, H, d, n) => fxFlutter(W, H, n(12), d ? ["#6E5A8A", "#8A76A8"] : ["#3A2A4A", "#56446A"]).map(p => Object.assign(p, {shape: "bat", size: fxR(12, 18)})).concat(fxBurst(W, H, n(16), "pumpkin", ["#F28A2E", "#E8741C", "#F5A04A"], [[0.15, 1.02], [0.85, 1.02]], {smin: 11, smax: 15, glow: d ? 12 : 0}))},
  thanksgiving: {spawn: (W, H, d, n) => fxFall(W, H, n(60), "fallleaf", ["#E07A2E", "#C8561C", "#F2B23E", "#B5401A"], {sway: 2, flip: true, smin: 9, smax: 14}).concat(fxFall(W, H, n(16), "acorn", ["#8A5A2B", "#6B4226"], {sway: 0.6, smin: 8, smax: 11}))},
  hanukkah: {spawn: (W, H, d, n) => fxTw(W, H, n(40), "stardavid", d ? ["#CFE0FF", "#FFFFFF", "#8FB0FF"] : ["#2F5FB8", "#5A86D6", "#9FB4D8"], {smin: 6, smax: 12, glow: d ? 10 : 2}).concat(fxBurst(W, H, n(14), "dreidel", ["#3D6AD6", "#8FA3C8"], [[0.2, 1.02], [0.8, 1.02]], {smin: 10, smax: 13}), fxBurst(W, H, n(20), "coin", ["#F2C24A", "#FFD86B"], [[0.5, 1.04]], {smin: 7, smax: 10}))},
  diwali: {spawn: (W, H, d, n) => fxRise(W, H, n(40), "flame", ["#FFB347", "#FFD86B", "#FF8A3A"], {smin: 5, smax: 9, sway: 1.2, glow: 14}).concat(fxBurst(W, H, n(40), "flower", ["#F2A33A", "#E0463C", "#F2C24A"], [[0.15, 1.02], [0.85, 1.02], [0.5, 1.04]], {smin: 7, smax: 11}), fxTw(W, H, n(26), "sparkle", ["#FFE08A", "#FFFFFF"], {smin: 3, smax: 7, glow: 12}))}
});

/* Theme kits: each artwork theme brings its own flashcards, note colors, note shape */
const THEME_KIT = {
  ocean:   {motif: "drop",      card: ["#F3FBFC", "#DDF1F4"], ink: "#0B2B33", bd: "#9ED3DB", mc: "#14A7BD", r: 18, notes: ["#FFF1B8", "#FFD2C9", "#BFE9EE", "#C8F0DA", "#FFE0A8", "#D6D8FF"], shape: "rounded", pin: "magnet", fab: "28px 28px 28px 8px", btn: "14px"},
  sakura:  {motif: "petal",     card: ["#FFF7FA", "#FDE6EE"], ink: "#3B1D2B", bd: "#F5C6D8", mc: "#E8688A", r: 22, notes: ["#FFF0C2", "#FFD1E1", "#E6DBFF", "#D9F0D8", "#FFDCC8", "#FBE3F0"], shape: "scallop", pin: "pin", fab: "999px", btn: "999px"},
  forest:  {motif: "leaf",      card: ["#FAFCF6", "#E8F0DF"], ink: "#1D2B1A", bd: "#B8CFA9", mc: "#45A865", r: 8, notes: ["#F4EDB0", "#E9D6C0", "#CFE6C8", "#D6EAD9", "#EFD9A6", "#DDE3CF"], shape: "torn", pin: "tape", fab: "10px 22px 10px 22px", btn: "8px"},
  galaxy:  {motif: "star",      card: ["#F7F5FF", "#E7E2FB"], ink: "#1E1740", bd: "#C9BFF3", mc: "#8C6FF5", r: 16, notes: ["#FFF3B0", "#FFD1EC", "#D2CBF7", "#C9E8FF", "#FFE0B8", "#E8D6FF"], shape: "circle", pin: "starpin", fab: "999px", btn: "999px"},
  arctic:  {motif: "sparkle",   card: ["#F7FBFE", "#E2EFF8"], ink: "#10263A", bd: "#BCD7EA", mc: "#2A9FC0", r: 14, notes: ["#FFF6C6", "#FFDDE8", "#CFE6F7", "#CDF3E3", "#FFE6C4", "#DCD6FF"], shape: "rounded", pin: "clip", fab: "18px 18px 6px 18px", btn: "12px"},
  autumn:  {motif: "maple",     card: ["#FFFAF3", "#F6E6D2"], ink: "#33200F", bd: "#E8C8A6", mc: "#E07A2E", r: 10, notes: ["#FFE7A6", "#F9C9B0", "#EAD7C0", "#E3E6B8", "#FFCF9E", "#F0D2C8"], shape: "folded", pin: "pin", fab: "22px 6px 22px 6px", btn: "10px"},
  lemonade:{motif: "lemon",     card: ["#FFFDF2", "#FBF3CF"], ink: "#2E2A12", bd: "#EFDF9A", mc: "#F2B705", r: 20, notes: ["#FFF08A", "#FFD6C2", "#D9F2C7", "#CFF0E8", "#FFE6A0", "#F1E4FF"], shape: "circle", pin: "corners", fab: "999px", btn: "999px"},
  winter:  {motif: "snow",      card: ["#FAFCFF", "#E6EEF8"], ink: "#14233A", bd: "#C4D6EE", mc: "#6F9AE0", r: 16, notes: ["#FFF6D0", "#FBE0EA", "#D9E6FA", "#DDF2EE", "#FDE8D2", "#E4DEFA"], shape: "cloud", pin: "clip", fab: "16px", btn: "12px"},
  xmas:    {motif: "star",      card: ["#FFFCF7", "#F7ECDD"], ink: "#2A1E16", bd: "#E6C9A8", mc: "#D9542B", r: 12, notes: ["#FFE9A8", "#F9C4BF", "#C9E8D2", "#D7E6FA", "#FFD8A8", "#EBD8F0"], shape: "classic", pin: "starpin", fab: "12px", btn: "10px"},
  spring:  {motif: "butterfly", card: ["#FBFEF7", "#EAF5DF"], ink: "#1E2A1C", bd: "#C6E0B4", mc: "#A884F0", r: 22, notes: ["#FFF3B0", "#FFD1E3", "#DCD2FF", "#D2F0C6", "#FFE0B8", "#CFE8FF"], shape: "scallop", pin: "heartpin", fab: "24px 24px 24px 6px", btn: "14px"},
  cafe:    {motif: "bean",      card: ["#FFFCF7", "#F3E7D8"], ink: "#2E2016", bd: "#DCC4A8", mc: "#8A5A2B", r: 6, notes: ["#F6E7B8", "#EFCDBA", "#E6D8C6", "#DDE3C8", "#F3D2A6", "#E2D2E0"], shape: "lined", pin: "tape", fab: "8px 8px 20px 20px", btn: "8px"},
  sunset:  {motif: "shell",     card: ["#FFF9F5", "#FDE6DC"], ink: "#3A1A2A", bd: "#F4C9B8", mc: "#F07A8A", r: 18, notes: ["#FFE8B0", "#FFCFC4", "#F6CFE0", "#CDEFEA", "#FFD9A8", "#E5D6F6"], shape: "rounded", pin: "washi2", fab: "26px 26px 8px 26px", btn: "14px"},
  mint:    {motif: "mintleaf",  card: ["#F6FDF9", "#DDF3E8"], ink: "#0F2A21", bd: "#A9DCC4", mc: "#25B585", r: 16, notes: ["#F4F1C2", "#EBD0C4", "#C9F0DD", "#D2ECF2", "#F2DDBE", "#DDD6F2"], shape: "folded", pin: "magnet", fab: "999px", btn: "12px"},
  summer:  {motif: "ball",      card: ["#F5FCFE", "#DDF2F8"], ink: "#13283A", bd: "#A8DDEE", mc: "#FF8A5B", r: 20, notes: ["#FFF08A", "#FFD0C2", "#BFEAF5", "#CFF3D6", "#FFD9A0", "#E0D8FF"], shape: "rounded", pin: "corners", fab: "999px", btn: "999px"},
  bokeh:   {motif: "circle",    card: ["#FBFAFF", "#ECE9F8"], ink: "#1F1D2B", bd: "#D6D1EE", mc: "#FF64A0", r: 18, notes: ["#FFF1B8", "#FFD1E6", "#CDEFF2", "#E0D6FF", "#FFE0B8", "#D7F2DE"], shape: "circle", pin: "gold", fab: "999px", btn: "999px"},
  neon:    {motif: "ring",      card: ["#F7F7FF", "#E4E4FA"], ink: "#16163A", bd: "#C4C8F5", mc: "#C84BEB", r: 12, notes: ["#FFF3B0", "#F9D0F5", "#CFD8FF", "#CFF3EA", "#FFE0C4", "#E6D6FF"], shape: "rounded", pin: "binder", fab: "6px", btn: "6px"},
  candy:   {motif: "candy",     card: ["#FFF8FD", "#F6E8FF"], ink: "#2D1F3D", bd: "#EACBF5", mc: "#FF6FB5", r: 26, notes: ["#FFF3B0", "#FFCDE6", "#D9C8FF", "#C8F3E0", "#FFDDB8", "#CDEBFF"], shape: "heart", pin: "washi2", fab: "999px", btn: "999px"},
  arcade:  {motif: "sparkle",   card: ["#FBF8FF", "#EDE4FF"], ink: "#1A1033", bd: "#D8C8F7", mc: "#FF2FB3", r: 6, notes: ["#FFF08A", "#FFC8E6", "#CFF3FF", "#D8FFC2", "#FFD6A8", "#E2D0FF"], shape: "gridnote", pin: "binder", fab: "4px 18px 4px 18px", btn: "4px"},
  cats: {motif: "paw", card: ["#FDF8F5", "#F2E4DC"], ink: "#33231F", bd: "#EADDD4", mc: "#B5563F", r: 18, notes: ["#EFDAD5", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "rounded", pin: "pin", fab: "999px", btn: "14px"},
  music: {motif: "note", card: ["#FAFAFD", "#E7E5F4"], ink: "#1E1B38", bd: "#DFDCEE", mc: "#5B4FC9", r: 14, notes: ["#DBD8F3", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "lined", pin: "clip", fab: "999px", btn: "12px"},
  reading: {motif: "book", card: ["#FCF7F4", "#EEE4DE"], ink: "#2B1F1C", bd: "#E8DFD3", mc: "#96404A", r: 10, notes: ["#E8D5D7", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "folded", pin: "corners", fab: "10px", btn: "10px"},
  knitting: {motif: "yarn", card: ["#FAFBF8", "#E5EBE2"], ink: "#20291F", bd: "#DDE3D6", mc: "#4E7F58", r: 18, notes: ["#D8E3DA", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "scallop", pin: "tape", fab: "999px", btn: "14px"},
  painting: {motif: "circle", card: ["#F9FAFD", "#E6E9EB"], ink: "#1F2230", bd: "#E4E1DA", mc: "#2F66B8", r: 12, notes: ["#D1DDEF", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "torn", pin: "pin", fab: "30px 30px 30px 10px", btn: "12px"},
  baking: {motif: "cupcake", card: ["#FDF8F6", "#F5E7E3"], ink: "#33211F", bd: "#EFE0D8", mc: "#BF4D66", r: 20, notes: ["#F1D8DD", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "scallop", pin: "washi2", fab: "999px", btn: "999px"},
  gardening: {motif: "leaf", card: ["#F9FBF6", "#E3EBDE"], ink: "#1F2A1B", bd: "#DCE4D2", mc: "#357A43", r: 16, notes: ["#D3E2D6", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "rounded", pin: "tape", fab: "24px 24px 24px 8px", btn: "12px"},
  gaming: {motif: "pixel", card: ["#FAF9FE", "#E7E4F7"], ink: "#1C1936", bd: "#DEDBF1", mc: "#6246D6", r: 8, notes: ["#DCD6F6", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "gridnote", pin: "binder", fab: "8px", btn: "6px"},
  photography: {motif: "camera", card: ["#FDFAF8", "#EFE7DF"], ink: "#1E1E22", bd: "#E2E0DD", mc: "#B35F14", r: 6, notes: ["#EEDCCB", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "classic", pin: "corners", fab: "12px", btn: "10px"},
  newyear: {motif: "star", card: ["#F9FAFD", "#E4E5F2"], ink: "#1A1C36", bd: "#DDDEEF", mc: "#3D4BB0", r: 16, notes: ["#D4D7EE", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "rounded", pin: "starpin", fab: "999px", btn: "999px"},
  lunarnewyear: {motif: "lantern", card: ["#FDF7F5", "#F5E2DD"], ink: "#35171A", bd: "#F0DDD6", mc: "#B8302C", r: 10, notes: ["#EFD1D1", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "classic", pin: "gold", fab: "14px", btn: "10px"},
  valentines: {motif: "heart", card: ["#FDF9FA", "#F6E2E7"], ink: "#36171F", bd: "#F2DCE1", mc: "#C23A5E", r: 22, notes: ["#F2D4DC", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "heart", pin: "heartpin", fab: "999px", btn: "999px"},
  stpatricks: {motif: "clover", card: ["#F8FBF8", "#DFEDE1"], ink: "#142A1B", bd: "#D6E6D6", mc: "#1F8446", r: 16, notes: ["#CEE4D6", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "rounded", pin: "pin", fab: "999px", btn: "12px"},
  easter: {motif: "egg", card: ["#FBFAFD", "#ECE6F6"], ink: "#241F36", bd: "#E3DDF0", mc: "#7351C4", r: 20, notes: ["#E0D9F2", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "cloud", pin: "washi2", fab: "999px", btn: "999px"},
  july4: {motif: "star", card: ["#FDF9F9", "#EEE4E9"], ink: "#141C33", bd: "#DDE1EC", mc: "#B8303D", r: 10, notes: ["#EFD1D4", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "classic", pin: "starpin", fab: "12px", btn: "10px"},
  halloween: {motif: "pumpkin", card: ["#FDF8F3", "#F3E4DA"], ink: "#2A1C2E", bd: "#EADFD8", mc: "#C2531A", r: 10, notes: ["#F2D9CD", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "torn", pin: "pin", fab: "14px", btn: "10px"},
  thanksgiving: {motif: "fallleaf", card: ["#FCF8F1", "#F2E5D9"], ink: "#30210F", bd: "#EDE0CD", mc: "#A8501E", r: 10, notes: ["#ECD8CE", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "folded", pin: "tape", fab: "22px 6px 22px 6px", btn: "10px"},
  hanukkah: {motif: "stardavid", card: ["#F9FAFD", "#E1E8F4"], ink: "#13203A", bd: "#D9E1EE", mc: "#2E5CB0", r: 14, notes: ["#D1DBEE", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "rounded", pin: "starpin", fab: "16px", btn: "12px"},
  diwali: {motif: "flame", card: ["#FDF7F5", "#F5E3DF"], ink: "#33191F", bd: "#F0DDCF", mc: "#B8367A", r: 20, notes: ["#EFD3E2", "#FFF3B8", "#D9F0D8", "#D6E6FF", "#FFD9C8", "#EBD9FF"], shape: "scallop", pin: "gold", fab: "999px", btn: "999px"}
};
const themeKit = () => THEME_KIT[document.documentElement.dataset.skin || ""] || null;
function kitMotifUrl(kit, color, op){
  const sh = FX_SHAPES[kit.motif] || FX_SHAPES.star, c = color || kit.mc, o = op == null ? 0.22 : op;
  const body = sh.stroke ? `<path d='${sh.d}' fill='none' stroke='${c}' stroke-width='${sh.lw || 1.4}' stroke-linecap='round' opacity='${o}'/>` : `<path d='${sh.d}' fill='${c}' opacity='${o}'/>`;
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='-12 -12 24 24'>${body}</svg>`)}")`;
}
function kitVars(id){
  const k = THEME_KIT[id]; if (!k) return "";
  return [`--tc-bg:linear-gradient(160deg,${k.card[0]},${k.card[1]})`, `--tc-ink:${k.ink}`, `--tc-bd:${k.bd}`, `--tc-r:${k.r}px`, `--tc-mc:${k.mc}`,
    `--fab-r:${k.fab}`, `--btn-r:${k.btn}`].join(";");
}

const CARD_STYLES = [
  {id: "theme", name: "Match Theme", tier: "free", desc: "Each artwork theme's own flashcard design."},
  {id: "index", name: "Index Card", tier: "free", desc: "Ruled lines and a red header line."},
  {id: "plain", name: "Clean", tier: "free", desc: "Plain white with round corners."},
  {id: "grid", name: "Graph Paper", tier: "free", desc: "A simple blue grid."},
  {id: "holo", name: "Holographic", tier: "pro", desc: "A shimmering rainbow foil that slowly shifts."},
  {id: "neon", name: "Neon", tier: "pro", desc: "Glowing pink and cyan on midnight."},
  {id: "chalk", name: "Chalkboard", tier: "pro", desc: "Chalk on green slate in a wood frame."},
  {id: "blueprint", name: "Blueprint", tier: "pro", desc: "White lines on engineering blue."},
  {id: "parchment", name: "Parchment", tier: "pro", desc: "Aged paper with toasted edges."},
  {id: "polaroid", name: "Polaroid", tier: "pro", desc: "An instant photo frame."},
  {id: "ticket", name: "Ticket", tier: "pro", desc: "An admit-one stub with notched sides."},
  {id: "kraft", name: "Kraft Paper", tier: "pro", desc: "Brown recycled paper."},
  {id: "pastel", name: "Pastel Dream", tier: "pro", desc: "A soft rainbow gradient."}
];
const NOTE_SHAPES = [
  {id: "classic", name: "Square", tier: "free", desc: "A plain square note."},
  {id: "rounded", name: "Rounded", tier: "free", desc: "Soft round corners."},
  {id: "torn", name: "Torn Edge", tier: "pro", desc: "Torn off the bottom of a pad."},
  {id: "folded", name: "Dog-Eared", tier: "pro", desc: "A folded-down corner."},
  {id: "lined", name: "Lined Paper", tier: "pro", desc: "Ruled lines and a margin."},
  {id: "gridnote", name: "Graph Paper", tier: "pro", desc: "A little square of graph paper."},
  {id: "speech", name: "Speech Bubble", tier: "pro", desc: "Say it with a bubble."},
  {id: "circle", name: "Circle", tier: "pro", desc: "A round note."},
  {id: "heart", name: "Heart", tier: "pro", desc: "A heart-shaped note."},
  {id: "cloud", name: "Cloud", tier: "pro", desc: "A fluffy cloud."},
  {id: "scallop", name: "Scalloped", tier: "pro", desc: "Wavy scalloped edges."}
];
const PIN_SVG = {
  heartpin: `<svg viewBox="0 0 30 30"><defs><linearGradient id="phg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8FB0"/><stop offset="1" stop-color="#D81B4A"/></linearGradient></defs><path d="M15 27S3 19.5 3 11a6 6 0 0 1 12-2 6 6 0 0 1 12 2c0 8.5-12 16-12 16z" fill="url(#phg)" stroke="#8A0F2E" stroke-width="1"/><ellipse cx="9.5" cy="9.5" rx="3" ry="2" fill="#fff" opacity=".7" transform="rotate(-30 9.5 9.5)"/></svg>`,
  starpin: `<svg viewBox="0 0 30 30"><defs><linearGradient id="psg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF08A"/><stop offset="1" stop-color="#E8A000"/></linearGradient></defs><path d="M15 2l3.8 8.2 9 1-6.7 6.1 1.8 8.9L15 21.8l-7.9 4.4 1.8-8.9L2.2 11.2l9-1z" fill="url(#psg)" stroke="#8A6100" stroke-width="1"/><circle cx="12" cy="11" r="1.6" fill="#fff" opacity=".8"/></svg>`,
  clip: `<svg viewBox="0 0 22 50"><path d="M8 40V9a5.5 5.5 0 0 1 11 0v31a8.5 8.5 0 0 1-17 0V14" fill="none" stroke="#6E7788" stroke-width="3.2" stroke-linecap="round"/><path d="M8 40V9a5.5 5.5 0 0 1 11 0v31a8.5 8.5 0 0 1-17 0V14" fill="none" stroke="#D9DEE7" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  binder: `<svg viewBox="0 0 44 40"><path d="M12 18C10 8 16 3 22 3s12 5 10 15" fill="none" stroke="#B8BFCC" stroke-width="2.6"/><path d="M14 18C13 10 17 6 22 6s9 4 8 12" fill="none" stroke="#7A8394" stroke-width="1.4"/><path d="M4 18h36l-5 18H9z" fill="#262A33"/><path d="M6 20h32" stroke="#4A505E" stroke-width="2"/></svg>`,
  magnet: `<svg viewBox="0 0 30 30"><defs><radialGradient id="pmg" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#9BE7FF"/><stop offset=".6" stop-color="#3E86E0"/><stop offset="1" stop-color="#1E4EA8"/></radialGradient></defs><circle cx="15" cy="15" r="12" fill="url(#pmg)" stroke="#173B80" stroke-width="1"/><path d="M10 13l3 2-3 2M15 17h5" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`
};
const PINS = [
  {id: "pin", name: "Red Pin (Default)", tier: "free", desc: "A classic red pushpin."},
  {id: "tape", name: "Clear Tape", tier: "free", desc: "A strip of clear tape."},
  {id: "staple", name: "Staple", tier: "free", desc: "One silver staple."},
  {id: "none", name: "No Pin", tier: "free", desc: "Just the note."},
  {id: "washi", name: "Washi Dots", tier: "pro", desc: "Pink polka-dot washi tape."},
  {id: "gold", name: "Gold Pushpin", tier: "pro", desc: "A shiny gold pushpin."},
  {id: "heartpin", name: "Heart Pin", tier: "pro", desc: "A glossy heart."},
  {id: "starpin", name: "Star Pin", tier: "pro", desc: "A gold star."},
  {id: "washi2", name: "Washi Stripes", tier: "pro", desc: "Candy-striped washi tape."},
  {id: "corners", name: "Corner Tape", tier: "pro", desc: "Tape across both top corners."},
  {id: "clip", name: "Paperclip", tier: "pro", desc: "A silver paperclip on the edge."},
  {id: "binder", name: "Binder Clip", tier: "pro", desc: "A black binder clip."},
  {id: "magnet", name: "Magnet", tier: "pro", desc: "A round fridge magnet."}
];
// How each pin attaches, so it can sit right on round, heart and cloud notes
const PIN_KIND = {tape: "tape", washi: "tape", washi2: "tape", corners: "corners", clip: "clip", binder: "top", staple: "flat", none: "none"};
const pinHtml = k => `<span class="pin pk-${k} pkk-${PIN_KIND[k] || "badge"}" aria-hidden="true">${PIN_SVG[k] || ""}</span>`;

const STICKERS = {}; STICKER_PACKS.forEach(p => Object.entries(p.items).forEach(([k, svg]) => { STICKERS[k] = {svg, pack: p.id}; }));
const stickerSvg = k => STICKERS[k] ? `<svg viewBox="0 0 64 64" aria-hidden="true">${STICKERS[k].svg}</svg>` : "";

/* Ownership: free items always; PRO items once Pro enforcement is on need Pro */
const STYLE_LISTS = {skin: SKINS, card: CARD_STYLES, note: NOTE_SHAPES, pin: PINS, sticker: STICKER_PACKS, comp: [], prop: []};
// The tier of a theme (a skin id, or "plain" for the free plain colors)
const themeTier = id => id === "plain" || !id ? "free" : ((SKINS.find(x => x.id === id) || {}).tier || "free");
const itemTier = (kind, id) => ((STYLE_LISTS[kind] || []).find(x => x.id === id) || {}).tier || "free";
const owns = (kind, id) => {
  if (!STORE.paywall || itemTier(kind, id) === "free") return true;
  if (typeof PLAN !== "undefined" && !!PLAN && (PLAN.isPro() || (PLAN.styleGrace && PLAN.styleGrace()))) return true;
  if (cpAllows(kind, id)) return true;
  if (kind === "comp") { const it = (STYLE_LISTS.comp || []).find(x => x.id === id); if (it && it.theme && cpAllows("skin", it.theme)) return true; }
  return false;
};
/* The theme from last time is painted before any script runs (the snippet in <head>) */
const SKIN_HOLD = (() => { try { return localStorage.getItem("studyboard:skin") || ""; } catch (e) { return ""; } })(), SKIN_HOLD_UNTIL = Date.now() + 10000;
const skinHeld = id => !!SKIN_HOLD && id === SKIN_HOLD && Date.now() < SKIN_HOLD_UNTIL && typeof PLAN !== "undefined" && !!PLAN && typeof PLAN.settled === "function" && !PLAN.settled();
const skinOk = id => owns("skin", id) || skinHeld(id);
if (SKIN_HOLD) setTimeout(() => { try { if (document.documentElement.dataset.skin === SKIN_HOLD && !owns("skin", SKIN_HOLD)) applySkin(); } catch (e) {} }, 10050);
// The theme actually on screen
const effSkinId = () => { const id = ((state.settings && state.settings.style) || {}).skin || "classic"; return SKINS.some(x => x.id === id) && owns("skin", id) ? id : "classic"; };
const styleCfg = () => Object.assign({skin: "classic", card: "index", note: "classic", pin: "pin"}, (state.settings && state.settings.style) || {});

const CP_MAX = 3, CP_MS = 5 * 60000, CP_KEYS = ["skin", "skinAt", "card", "cardAuto", "pin", "pinAuto", "pinPicked", "note", "noteAuto", "notePicked"];
function cpState(){
  const c = state && state.settings && state.settings.collPreview;
  const used = c && Array.isArray(c.used) ? c.used.filter(x => typeof x === "string") : [];
  const a = c && c.active && typeof c.active === "object" && typeof c.active.id === "string" && Number(c.active.until) > 0 ? c.active : null;
  return {used, active: a};
}
function cpActive(){ const a = cpState().active; return a && a.until > Date.now() ? a : null; }
function cpIsPro(){ return !STORE.paywall || (typeof PLAN !== "undefined" && !!PLAN && PLAN.isPro()); }
function cpLeft(){ return Math.max(0, CP_MAX - cpState().used.length); }
function cpItems(id){
  const out = {skin: [id], card: [], pin: [], sticker: []};
  try { const r = window.SBTP && window.SBTP.rec ? window.SBTP.rec(id) : null; if (r) { if (r.pack) out.sticker.push(r.pack); (r.pins || []).forEach(x => out.pin.push(x)); if (r.card) out.card.push(r.card); } } catch (e) {}
  return out;
}
function cpAllows(kind, id){ const a = cpActive(); if (!a) return false; const l = cpItems(a.id)[kind]; return !!l && l.includes(id); }
function cpCanStart(id){ return !cpIsPro() && themeTier(id) === "pro" && !cpActive() && !cpState().used.includes(id) && cpLeft() > 0; }
function cpBtn(id){ return cpCanStart(id) ? `<button type="button" class="btn small" data-act="cp-start" data-id="${esc(id)}">Preview 5 Min</button>` : ""; }
function cpNote(){
  if (cpIsPro()) return "";
  const a = cpActive(), n = cpLeft();
  return `<p class="mini cp-note">${a ? "A preview is running." : n ? `Free previews left: <b>${n} of ${CP_MAX}</b>. Try a Pro collection for 5 minutes, once each.` : `You've used all ${CP_MAX} free previews. Go Pro to use any collection.`}</p>`;
}
function cpBanner(){
  let el = document.getElementById("cpBanner"); const a = cpActive();
  if (!a) { if (el) el.remove(); return; }
  if (!el) {
    el = document.createElement("div"); el.id = "cpBanner"; el.className = "cp-banner"; el.setAttribute("role", "status");
    el.innerHTML = `<span class="cp-txt"></span><button type="button" class="btn small" data-act="cp-end">End Preview</button>`;
    document.body.appendChild(el);
  }
  const sec = Math.max(0, Math.ceil((a.until - Date.now()) / 1000)), name = (skinOf(a.id) || {}).name || "this collection";
  const t = el.querySelector(".cp-txt"), txt = `Previewing ${name}: ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")} left`;
  if (t && t.textContent !== txt) t.textContent = txt;
}
function cpStart(id){
  if (!cpCanStart(id)) {
    toast(cpActive() ? "Finish your current preview first." : cpState().used.includes(id) ? "You already previewed that collection." : cpLeft() ? "This collection is part of Studyboard Pro." : `You've used all ${CP_MAX} free previews. Go Pro to use any collection.`);
    return;
  }
  const raw = (state.settings && state.settings.style) || {}, prev = {};
  CP_KEYS.forEach(k => { if (k in raw) prev[k] = raw[k]; });
  state.settings = Object.assign({}, state.settings, {collPreview: {used: cpState().used.concat(id), active: {id, until: Date.now() + CP_MS, prev}}});
  saveStyle({skin: id});
  try { applySkin(); render(); } catch (e) { console.warn(e); }
  cpBanner();
  toast(`Previewing ${(skinOf(id) || {}).name || "the collection"} for 5 minutes. ${cpLeft()} of ${CP_MAX} previews left.`);
  try { if (document.querySelector(".sheet.ui-shop")) styleShop(); } catch (e) {}
}
function cpEnd(auto){
  const c = cpState(), a = c.active; if (!a) return;
  const style = Object.assign({}, (state.settings && state.settings.style) || {}), prev = a.prev && typeof a.prev === "object" ? a.prev : {};
  if (!cpIsPro()) CP_KEYS.forEach(k => { if (k in prev) style[k] = prev[k]; else delete style[k]; });
  state.settings = Object.assign({}, state.settings, {style, collPreview: {used: c.used, active: null}}); saveSettings();
  try { applySkin(); render(); } catch (e) { console.warn(e); }
  cpBanner();
  toast(cpIsPro() ? "Preview ended." : auto ? "Your preview ended. Your theme is back." : "Preview ended. Your theme is back.");
  try { if (document.querySelector(".sheet.ui-shop")) styleShop(); } catch (e) {}
}
function cpTick(){ try { const c = cpState(); if (c.active && c.active.until <= Date.now()) cpEnd(true); else cpBanner(); } catch (e) {} }
setInterval(cpTick, 1000);
document.addEventListener("visibilitychange", cpTick);
window.__sbCollPreview = {get state(){ return state; }, start: cpStart, end: cpEnd, tick: cpTick, canStart: cpCanStart, left: cpLeft, status: cpState, items: cpItems, shown: effSkinId, owns};
const cardStyleOf = d => { const cfg = styleCfg(), kit = themeKit(); let s = (d && d.cardStyle) || (cfg.cardAuto !== false && kit ? "theme" : cfg.card); if (s === "theme") return kit ? "theme" : "index"; return owns("card", s) && CARD_STYLES.some(x => x.id === s) ? s : "index"; };
const noteShapeOf = n => { const cfg = styleCfg(); if (n && n.shape) return owns("note", n.shape) && NOTE_SHAPES.some(x => x.id === n.shape) ? n.shape : "classic"; const s = cfg.note; return owns("note", s) && NOTE_SHAPES.some(x => x.id === s) ? s : "classic"; };
// The default pin is the Red Pin
const notePinOf = n => { const cfg = styleCfg(), kit = themeKit(); if (n && n.pin) return owns("pin", n.pin) && PINS.some(x => x.id === n.pin) ? n.pin : "pin"; if (cfg.pinAuto === true && kit) return kit.pin; const s = cfg.pin; return owns("pin", s) && PINS.some(x => x.id === s) ? s : "pin"; };
function saveStyle(patch){
  const cur = styleCfg(), shapeBefore = noteShapeOf(null);
  if (patch.skin && patch.skin !== cur.skin) {
    patch.skinAt = Date.now();
    if (cur.noteAuto === undefined && !("noteAuto" in patch)) Object.assign(patch, {note: noteShapeOf(null), noteAuto: false});
    if (cur.pinAuto === undefined && !("pinAuto" in patch)) Object.assign(patch, {pin: notePinOf(null), pinAuto: false});
  }
  state.settings = Object.assign({}, state.settings, {style: Object.assign({}, (state.settings && state.settings.style) || {}, patch)}); saveSettings();
  try {
    if (noteShapeOf(null) !== shapeBefore) {
      const keep = Object.values(state.notes || {}).filter(n => n && !n.shape).map(n => ({kind: "note", id: n.id, after: Object.assign(clone(n), {shape: shapeBefore})}));
      if (keep.length) applyChanges(keep, "");
    }
  } catch(e) {}
}
function applySkin(){
  let id = styleCfg().skin; if (!skinOk(id) || !SKINS.some(x => x.id === id)) id = "classic";
  const s = SKINS.find(x => x.id === id) || SKINS[0], root = document.documentElement;
  let el = document.getElementById("skinCss");
  if (!el) { el = document.createElement("style"); el.id = "skinCss"; document.head.appendChild(el); }
  const css = skinCss(s);
  if (el.textContent !== css) el.textContent = css;
  if (s.light) root.dataset.skin = s.id; else delete root.dataset.skin;
  renderSkinArt();
  try { if (s.light) { localStorage.setItem("studyboard:skin", s.id); localStorage.setItem("studyboard:skincss", css); } else { localStorage.removeItem("studyboard:skin"); localStorage.removeItem("studyboard:skincss"); } } catch(e) {}
  const tc = document.querySelector('meta[name="theme-color"]'); if (window.SBBARTINT && innerWidth < 640) SBBARTINT(); else if (tc) tc.setAttribute("content", getComputedStyle(root).getPropertyValue("--spine").trim() || "#0E2A56");
  if (DESK) setTimeout(deskTint, 30);
}
function shopUnlock(kind, id){ toast("This item is part of Studyboard Pro."); }

/* The shop */
const PRO_BADGE = `<span class="pro-badge">PRO</span>`, FREE_BADGE = `<span class="free-badge">Free</span>`;
function skinPreview(s, dark){
  const vars = s.light ? skinVars(s, dark) : dark ? "--paper:#0A1428;--grid:rgba(96,160,255,.07);--surface:#111E38;--ink:#E7EEFA;--muted:#93A3C2;--line:#22355C;--accent:#5B9DFF;--accent-ink:#071430;--spine:#060F24;--spine-ink:#A9BADC;--mark:#8C7713;--soft:#172848;--spine-bg:linear-gradient(165deg,#0E2148,#060F24 52%,#040A18)" : "--paper:#E6EBF3;--grid:rgba(57,136,254,.09);--surface:#F4F6FA;--ink:#0F1F3D;--muted:#5A6A86;--line:#D9E2EF;--accent:#1F6FEB;--accent-ink:#FFFFFF;--spine:#0E2A56;--spine-ink:#C9D7F2;--mark:#FFE45C;--soft:#E3EAF4;--spine-bg:linear-gradient(165deg,#1B4486,#0E2A56 52%,#0B2245)";
  const base = "--bgimg:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);--bgsize:12px 12px;--bgpos:0 0;--scene:none;--scene-h:0px;--btn-bg:var(--accent);--spine-bg:var(--spine);--sel:var(--accent);--accent-2:var(--accent);";
  return `<div class="skin-prev" style="${esc(base + vars)}" aria-hidden="true">${artThumb(s.id, dark)}<span class="sp-spine"><i></i><i></i><i></i></span><span class="sp-main"><span class="sp-card"><b></b><em></em></span><span class="sp-card sm"><b></b></span><span class="sp-btn"></span></span><span class="sp-mode">${dark ? "Dark" : "Light"}</span></div>`;
}
// A note's pin list
const pinBase = x => String(x.name).replace(/\s*\(Default\)\s*$/i, "");
function pinOptionsHtml(n){
  const dp = PINS.find(x => x.id === styleCfg().pin) || PINS[0], mine = n && n.pin && n.pin !== dp.id ? n.pin : "";
  return `<option value="" ${mine ? "" : "selected"}>${esc(pinBase(dp))} (Default)</option>` + PINS.filter(x => x.id !== dp.id).map(x => `<option value="${x.id}" ${mine === x.id ? "selected" : ""} ${owns("pin", x.id) ? "" : "disabled"}>${esc(pinBase(x))}${x.tier === "pro" ? " ✦" : ""}</option>`).join("");
}
function noteDemo(shape, pin, i, stk){
  return `<div class="ns-demo"><div class="note ns-${shape}" style="--nc:${noteColor(NOTE_COLORS[i % NOTE_COLORS.length][0])};--rot:${i % 2 ? 2 : -2}deg">${pinHtml(pin)}<div class="note-body">Quiz on Friday!</div>${stk ? `<span class="stk" style="left:80%;top:74px;--r:12deg">${stickerSvg(stk)}</span>` : ""}</div></div>`;
}
function kitFollow(kind, list, cur, auto){
  const kit = themeKit(); if (!kit || kind === "note") return "";
  const def = list.find(x => x.id === kit[kind === "note" ? "shape" : "pin"]);
  return `<div class="kit-row"><span>This theme's own ${kind === "note" ? "note shape" : "pin"}: <b>${esc(def ? def.name : "")}</b></span>${auto !== false ? `<span class="mini">In use${auto === true ? ", changes with your theme" : ""}</span>` : `<button type="button" class="btn small" data-act="kit-follow" data-kind="${kind}" title="Changes with each theme you pick">Always Match Theme</button>`}</div>`;
}
function animRows(){
  const c = styleCfg(), row = (key, icon, title, sub) => `<div class="cap-row"><span style="flex:1;font-weight:600">${icon} ${title}<span class="sub">${sub}</span></span><label class="anim-tog"><input type="checkbox" data-act="anim-toggle" data-key="${key}" ${c[key] !== false ? "checked" : ""}> On</label></div>`;
  return row("motion", "✨", "Background Animations", "Moving artwork and little scene details in artwork themes. Turn off if they get distracting.") + row("celebrate", "🎉", "Completion Animations", "Confetti, fireworks or the theme's own animation when you finish a task.")
    + row("quotes", "💬", "Daily Quote", "A short motivational quote the first time you open Studyboard each day.")
    + `<button data-act="daily-quote"><span>Today's Quote and Streak<span class="sub">${esc(streakLine())}</span></span></button>`;
}
function styleShop(tab){
  if (typeof PLAN !== "undefined" && PLAN && PLAN.endStyleGrace && PLAN.endStyleGrace()) { try { applySkin(); } catch (e) {} render(); }
  ui.shopTab = tab || ui.shopTab || "themes";
  const cfg = styleCfg();
  const btnFor = (kind, it, cur, useLabel) => !owns(kind, it.id) ? `<button type="button" class="btn small" data-act="shop-unlock" data-kind="${kind}" data-id="${it.id}">🔒 Unlock</button>${kind === "skin" ? cpBtn(it.id) : ""}` : cur ? `<button type="button" class="btn small" disabled>In Use</button>` : `<button type="button" class="btn small primary" data-act="shop-use" data-kind="${kind}" data-id="${it.id}">${useLabel || "Use"}</button>`;
  const nameRow = it => `<div class="shop-name"><b>${esc(it.name)}</b>${it.tier === "pro" ? PRO_BADGE : FREE_BADGE}</div><p class="mini">${esc(it.desc || "")}</p>`;
  const grid = (list, fn) => `<div class="shop-grid">${list.map(fn).join("")}</div>`;
  const section = (title, list, fn) => list.length ? `<h3 class="fsec shop-sec">${title}</h3>${grid(list, fn)}` : "";
  const split = (list, fn) => section("Free", list.filter(x => x.tier === "free"), fn) + section(`${PRO_BADGE} Pro`, list.filter(x => x.tier === "pro"), fn);
  let body = "";
  if (ui.shopTab === "themes") {
    body = `<div class="shop-mode"><span class="mini">Preview in</span>${themeRow().replace(/^[\s\S]*?(<div class="segb)/, "$1").replace(/<\/div>\s*$/, "")}<label class="motion-tog"><input type="checkbox" id="motionTog" data-act="motion-toggle" ${cfg.motion !== false ? "checked" : ""}> Background Animations</label></div>
      ${[["plain", "Free · Plain Colors"], ["world", `${PRO_BADGE} Pro · Around the World`], ["ideas", `${PRO_BADGE} Pro · New Theme Ideas`], ["season", `${PRO_BADGE} Pro · Seasons`], ["pro", `${PRO_BADGE} Pro · Scenes`], ["majors", `${PRO_BADGE} Pro · Fields`], ["hobby", `${PRO_BADGE} Pro · Hobbies`], ["holiday", `${PRO_BADGE} Pro · Holidays`]].map(([g, t]) => section(t, SKINS.filter(s => (s.group || "plain") === g || (g === "pro" && s.group === "newscenes")), s => `<div class="shop-tile ${cfg.skin === s.id ? "on" : ""}"><div class="skin-pair">${skinPreview(s, false)}${skinPreview(s, true)}</div>${nameRow(s)}${btnFor("skin", s, cfg.skin === s.id)}</div>`)).join("")}`;
  } else if (ui.shopTab === "cards") {
    body = `<p class="mini" style="margin:0">How flashcards look while you study. You can also give one deck its own style under Edit Deck.</p>
      ${split(CARD_STYLES.filter(c => c.id !== "theme" || themeKit()), c => `<div class="shop-tile ${cardStyleOf(null) === c.id ? "on" : ""}"><div class="cs-demo cs-${c.id}"><span class="face"><span class="face-label">Front</span><span class="face-text">Mitochondria</span></span></div>${nameRow(c)}${btnFor("card", c, cardStyleOf(null) === c.id, "Use for All Decks")}</div>`)}`;
  } else if (ui.shopTab === "notes") {
    body = `<p class="mini" style="margin:0">The shape of your sticky notes. Change one note's shape while editing it.</p>
      ${split(NOTE_SHAPES, (sh, i) => `<div class="shop-tile ${noteShapeOf(null) === sh.id ? "on" : ""}">${noteDemo(sh.id, notePinOf(null), NOTE_SHAPES.indexOf(sh))}${nameRow(sh)}${btnFor("note", sh, noteShapeOf(null) === sh.id, "Use for Notes")}</div>`)}`;
  } else if (ui.shopTab === "pins") {
    body = `<p class="mini" style="margin:0">What holds your notes to the board. Pins work with any note shape; change one note's pin while editing it.</p>
      ${kitFollow("pin", PINS, notePinOf(null), cfg.pinAuto === true)}${section("All Pins", PINS, pn => `<div class="shop-tile ${notePinOf(null) === pn.id ? "on" : ""}">${noteDemo(noteShapeOf(null), pn.id, PINS.indexOf(pn) + 1)}${nameRow(pn)}${btnFor("pin", pn, notePinOf(null) === pn.id && !(cfg.pinAuto !== false && themeKit()), "Use for Notes")}</div>`)}`;
  } else {
    body = `<p class="mini" style="margin:0">Stickers live in the envelope beside your Notes board. Drag one onto a note and it moves with the note. Drag it off to remove it, or tap it to resize.</p>
      ${[["free", "Free"], ["pro", `${PRO_BADGE} Pro`]].map(([t, l]) => `<h3 class="fsec shop-sec">${l}</h3>${STICKER_PACKS.filter(p => p.tier === t).map(p => `<div class="shop-pack"><div class="shop-name"><b>${esc(p.name)}</b><span class="mini">${Object.keys(p.items).length} stickers</span>${owns("sticker", p.id) ? "" : `<button type="button" class="btn small" data-act="shop-unlock" data-kind="sticker" data-id="${p.id}">🔒 Unlock</button>`}</div><div class="pack-grid">${Object.keys(p.items).map(k => `<span class="stk-cell">${stickerSvg(k)}</span>`).join("")}</div></div>`).join("")}`).join("")}`;
  }
  const tabs = [["themes", "Themes"], ["cards", "Flashcards"], ["notes", "Note Shapes"], ["pins", "Pins"], ["stickers", "Stickers"]];
  openSheet(`<form class="sheet shop">${head("Style Shop")}
    <div class="sheet-body">
      ${STORE.paywall ? "" : `<p class="shop-note">✦ Everything here is free while Studyboard is in early access. Items marked ${PRO_BADGE} will be part of Studyboard Pro later.</p>`}
      <div class="segb shop-tabs" role="tablist">${tabs.map(([k, l]) => `<button type="button" role="tab" data-act="shop-tab" data-id="${k}" aria-selected="${ui.shopTab === k}" aria-pressed="${ui.shopTab === k}">${l}</button>`).join("")}</div>
      ${body}
    </div>
    <div class="sheet-foot"><span class="spacer"></span><button type="button" class="btn primary" data-act="close">Done</button></div></form>`);
}
function shopRow(){
  const s = SKINS.find(x => x.id === styleCfg().skin) || SKINS[0];
  return `<div class="cap-row"><span style="flex:1;font-weight:600">Style Shop<span class="sub">Themes, flashcard styles, note shapes, pins and stickers. Theme: ${esc(s.name)}.</span></span><button class="btn small" data-act="shop">Open</button></div>`;
}

/* Stickers: an envelope beside the board */
function noteStickersHtml(n){
  return (n.stickers || []).map((x, i) => [x, i]).filter(([x]) => STICKERS[x.k] && stkOwns(x.k)).map(([x, i]) => `<span class="stk" data-stk="${i}" title="Drag to move, drag off the note to remove, tap to resize, turn it with the round handle" style="left:${x.x}%;top:${x.yp != null ? `min(${x.yp}px, calc(100% - 8px))` : (x.y || 50) + "%"};--r:${x.r || 0}deg;--s:${x.s || 1}">${stickerSvg(x.k)}<i class="stk-rot" aria-hidden="true">${ROT_ICON}</i></span>`).join("");
}
/* Sticker search */
const STK_WORDS = {
  dot: "circle ball blue", fstar: "star favorite gold yellow rating important ⭐", fheart: "heart love like red favorite ❤", fcheck: "check tick done complete yes correct green ✅", fx: "cross no wrong cancel close delete ❌",
  farrow: "arrow next right direction purple →", ftri: "triangle warning shape", fsquare: "square box shape", fbang: "exclamation important alert warning urgent !", fq: "question help unsure confused ?",
  ldue: "due deadline date label tag soon", lread: "read reading label tag book",
  star: "⭐ night shine", heart: "❤ love", sparkle: "✨ glitter shine magic", smile: "😊 happy face", rainbow: "🌈 colorful", bolt: "⚡ lightning energy electric power", moon: "🌙 night sleep", sun: "☀ sunny day bright", cloud: "☁ sky weather", flower: "🌸 blossom bloom",
  aplus: "grade top mark excellent exam a+", check: "done complete tick yes", hundred: "💯 100 perfect score", pencil: "✏ write writing draw", book: "📖 read reading study textbook", coffee: "☕ cafe drink tea caffeine", bulb: "💡 idea light lightbulb thought", trophy: "🏆 win winner award prize champion", flask: "🧪 science chemistry lab experiment", brain: "🧠 think smart mind memory",
  cat: "🐱 kitten kitty pet", dog: "🐶 puppy pet", fox: "🦊", panda: "🐼 bear", frog: "🐸 toad", bear: "🐻 teddy", bunny: "🐰 rabbit easter", owl: "🦉 bird night wise", penguin: "🐧 bird arctic", chick: "🐤 bird baby chicken",
  pizza: "🍕 slice", donut: "🍩 doughnut sweet dessert", avocado: "🥑", strawberry: "🍓 berry fruit", icecream: "🍦 ice cream dessert sweet", boba: "🧋 bubble tea drink", cookie: "🍪 biscuit dessert", taco: "🌮 mexican",
  planet: "🪐 saturn", rocket: "🚀 launch ship", ufo: "🛸 alien flying saucer", alien: "👽 extraterrestrial", comet: "☄ shooting star meteor", astro: "🧑‍🚀 astronaut spaceman",
  fish: "🐟", whale: "🐋", octopus: "🐙", crab: "🦀", shell: "🐚 seashell beach", jelly: "jellyfish", turtle: "🐢 tortoise", starfish: "sea star",
  cactus: "🌵 desert", sunflower: "🌻", tulip: "🌷 flower", mushroom: "🍄 toadstool", leaf: "🍃 plant green nature", succulent: "plant", bee: "🐝 honey insect", blossom: "🌸 flower cherry",
  trex: "🦖 t-rex tyrannosaurus dinosaur", stego: "🦕 stegosaurus dinosaur", longneck: "🦕 brontosaurus sauropod dinosaur", egg: "🥚 dinosaur easter", ptero: "pterodactyl flying dinosaur", volcano: "🌋 lava", bone: "🦴 fossil", footprint: "🐾 paw print track",
  unicorn: "🦄 horse magic", dragon: "🐉 fire", crystal: "💎 gem magic", castle: "🏰 kingdom", wand: "🪄 magic wizard", potion: "🧪 magic brew", crown: "👑 king queen royal", mushhouse: "🍄 fairy house",
  love: "😍 heart eyes crush", lol: "😂 laughing laugh funny joy", wow: "😮 surprised shocked amazed", sleepy: "😴 tired sleep zzz", cool: "😎 sunglasses", grumpy: "😠 angry mad annoyed", party: "🥳 celebrate birthday", think: "🤔 thinking hmm wonder",
  headphones: "🎧 listen", note: "🎵 song melody music", guitar: "🎸", mic: "🎤 microphone sing karaoke", vinyl: "record disc", speaker: "🔊 sound loud",
  pumpkin: "🎃 halloween", ghost: "👻 halloween spooky", snowman: "⛄ winter christmas snow", gift: "🎁 present birthday christmas", cane: "candy cane christmas", balloon: "🎈 party birthday", clover: "🍀 lucky st patrick irish", egg2: "easter egg",
  umbrella: "☂ rain", snowflake: "❄ winter cold snow", rain: "🌧 rainy drizzle", storm: "⛈ thunder lightning", rainbow2: "🌈 colorful", thermo: "🌡 temperature hot cold",
  petal: "🌸 flower", maple: "🍁 fall autumn canada", snow: "❄ winter", bubble: "bubbles soap", drop: "💧 water rain", ring: "💍", lemon: "🍋 citrus", candy: "🍬 sweet", butterfly: "🦋", ball: "⚽ sport", paw: "🐾 pet", yarn: "🧶 knit knitting", pixel: "game gaming", coin: "🪙 money", gem: "💎", bat: "🦇 halloween", lantern: "🏮 lunar new year diwali", dreidel: "hanukkah spinning top", confetti: "🎉 party celebrate", flame: "🔥 fire hot", acorn: "🌰 fall", cupcake: "🧁 dessert", camera: "📷 photo", print: "stamp"
};
let stkIdx = null, stkIdxSig = "";
const stkNorm = t => String(t).toLowerCase().replace(/\uFE0F/g, "");
const stkPacks = new Map();
function stkPackInfo(id){
  STICKER_PACKS.forEach((p, i) => { if (!stkPacks.has(p.id)) stkPacks.set(p.id, {id: p.id, name: p.name, tier: p.tier, theme: p.theme, i}); });
  return stkPacks.get(id) || null;
}
const stkOwns = k => { const i = stkPackInfo((STICKERS[k] || {}).pack); return !STORE.paywall || !i || i.tier !== "pro" || (typeof PLAN !== "undefined" && !!PLAN && PLAN.isPro()) || cpAllows("sticker", i.id); };
function stkIndex(){
  stkPackInfo("");
  const sig = Object.keys(STICKERS).length + ":" + stkPacks.size;
  if (stkIdx && sig === stkIdxSig) return stkIdx;
  stkIdxSig = sig;
  stkIdx = Object.keys(STICKERS).map(k => {
    const p = stkPackInfo(STICKERS[k].pack) || {}, pi = p.i == null ? 99 : p.i;
    const th = p.theme ? ((SKINS.find(x => x.id === p.theme) || {}).name || "") : "";
    const base = p.id === "basics" && k !== "dot" ? k.slice(1) : p.id === "labels" ? k.slice(1) : k;
    const nm = stkNorm(base.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_\d]+/g, " ").trim());
    const ws = stkNorm(STK_WORDS[k] || "").split(/[\s,]+/).filter(Boolean).concat(nm.split(" "));
    const pw = stkNorm(`${p.name || ""} ${th}`).split(/[^a-z0-9']+/).filter(Boolean);
    return {k, nm, ws, pw, pi, text: `${nm} ${ws.join(" ")} ${pw.join(" ")}`};
  });
  return stkIdx;
}
function stkSearch(q){
  const toks = stkNorm(q).split(/\s+/).filter(Boolean).map(t => t.length > 3 && t.endsWith("s") && !t.endsWith("ss") ? t.slice(0, -1) : t);
  if (!toks.length) return [];
  const out = [];
  stkIndex().forEach(e => {
    let sc = 0;
    for (const t of toks) {
      const s = e.nm === t ? 100 : e.nm.startsWith(t) ? 70 : e.ws.includes(t) ? 50 : e.ws.some(w => w.startsWith(t)) ? 35 : e.pw.some(w => w.startsWith(t)) ? 20 : t.length >= 3 && e.text.includes(t) ? 8 : 0;
      if (!s) return;
      sc += s;
    }
    out.push({k: e.k, sc, pi: e.pi});
  });
  out.sort((a, b) => b.sc - a.sc || a.pi - b.pi);
  return out.slice(0, 80).map(x => x.k);
}
// One sticker in the envelope
const stkCellHtml = (k, mark) => `<span class="env-stk" data-stk-src="${k}" ${mark && !stkOwns(k) ? 'data-locked="1"' : ""} role="button" tabindex="0" aria-label="${esc(k)} sticker. Press Enter to put it on the top note." title="${esc(k)}">${stickerSvg(k)}</span>`;
function stkParts(){
  const q = (ui.stkQ || "").trim(), cur = STICKER_PACKS.find(p => p.id === ui.stkPack) || STICKER_PACKS[0];
  if (q) {
    const ks = stkSearch(q);
    return {name: `<b>${ks.length ? `${ks.length} sticker${ks.length === 1 ? "" : "s"}` : "No stickers found"}</b><span class="mini">for “${esc(q.slice(0, 24))}”</span>`,
      results: ks.length ? `<div class="env-sheet env-found" role="group" aria-label="Sticker search results">${ks.map(k => stkCellHtml(k, true)).join("")}</div>`
        : `<div class="env-empty" role="status"><b>Nothing matches “${esc(q.slice(0, 24))}”</b><span>Try a shorter word, or one of these:</span><span class="env-try">${["heart", "star", "cat", "study", "happy"].map(w => `<button type="button" data-act="stk-try" data-id="${w}">${w}</button>`).join("")}</span><button type="button" class="link-btn" data-act="stk-qclear">Clear Search</button></div>`};
  }
  const locked = !owns("sticker", cur.id);
  return {name: `<b>${esc(cur.name)}</b>${cur.tier === "pro" ? PRO_BADGE : ""}`,
    results: `<div class="env-sheet ${locked ? "locked" : ""}">${Object.keys(cur.items).map(k => stkCellHtml(k)).join("")}</div>`};
}
// Search as you type
function stkRefresh(){
  const env = document.querySelector(".env"); if (!env) return;
  const p = stkParts(), n = env.querySelector(".env-name"), r = env.querySelector(".env-results"), x = env.querySelector(".env-qx"), inp = env.querySelector(".env-q");
  if (n) n.innerHTML = p.name; if (r) r.innerHTML = p.results;
  if (x) x.hidden = !(ui.stkQ || "").length;
  if (inp && inp.value !== (ui.stkQ || "")) inp.value = ui.stkQ || "";
  env.classList.toggle("searching", !!(ui.stkQ || "").trim());
}
function envelopeHtml(){
  const cur = STICKER_PACKS.find(p => p.id === ui.stkPack) || STICKER_PACKS[0], p = stkParts(), q = ui.stkQ || "";
  const open = ui.envOpen !== false;
  return `<aside class="env ${open ? "" : "closed"} ${q.trim() ? "searching" : ""}" aria-label="Sticker envelope">
    <button type="button" class="env-head" data-act="env-toggle" aria-expanded="${open}"><span class="env-title">Stickers</span><span class="env-caret" aria-hidden="true">${open ? "▾" : "▸"}</span></button>
    <div class="env-body">
      <div class="env-search" role="search"><input type="search" class="env-q" placeholder="Search stickers" aria-label="Search all sticker packs" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search" maxlength="40" value="${esc(q)}"><button type="button" class="env-qx" data-act="stk-qclear" aria-label="Clear search" ${q ? "" : "hidden"}>×</button></div>
      <div class="env-packs" role="group" aria-label="Sticker packs">${STICKER_PACKS.map(p => `<button type="button" data-act="stk-pack" data-id="${p.id}" class="${p === cur ? "on" : ""}" title="${esc(p.name)}${p.tier === "pro" ? " (Pro)" : ""}" aria-label="${esc(p.name)}" aria-pressed="${p === cur}">${stickerSvg(Object.keys(p.items)[0])}${owns("sticker", p.id) ? "" : `<i class="lock">🔒</i>`}</button>`).join("")}</div>
      <div class="env-name">${p.name}</div>
      <div class="env-results">${p.results}</div>
      <p class="env-hint tip-everyday">Drag onto a note, or press Enter.</p>
    </div>
    <div class="env-pocket" aria-hidden="true"></div>
  </aside>`;
}
// Keyboard: put a sticker on the top note (the last one drawn)
function stkKeyAdd(k){
  if (!STICKERS[k]) return;
  if (!stkOwns(k)) { shopUnlock("sticker", STICKERS[k].pack); return; }
  const els = $$(".nb-board .note"), el = els[els.length - 1], n = el && state.notes[el.dataset.note];
  if (!n) { toast("Add a sticky note first, then put stickers on it"); return; }
  const t = clone(n); t.stickers = (t.stickers || []).concat({k, r: Math.round(Math.random() * 30 - 15), s: 1, x: 50 + Math.round(Math.random() * 30 - 15), yp: Math.round(Math.min(el.offsetHeight, 140) * 0.5)}).slice(-16);
  applyChanges([{kind: "note", id: n.id, after: t}], "Sticker added to your top note");
}
document.addEventListener("input", e => { const t = e.target; if (t && t.classList && t.classList.contains("env-q")) { ui.stkQ = t.value.slice(0, 40); stkRefresh(); } });
document.addEventListener("keydown", e => {
  const t = e.target; if (!t || !t.classList) return;
  const env = t.closest && t.closest(".env"); if (!env) return;
  if (t.classList.contains("env-q")) {
    if (e.key === "Escape") { if (t.value) { e.preventDefault(); e.stopPropagation(); ui.stkQ = ""; stkRefresh(); } else t.blur(); }
    else if (e.key === "ArrowDown" || e.key === "Enter") { const f = env.querySelector(".env-results .env-stk"); if (f) { e.preventDefault(); f.focus(); } }
    return;
  }
  if (!t.classList.contains("env-stk") || !t.dataset.stkSrc) return;
  const cells = [...env.querySelectorAll(".env-results .env-stk")], i = cells.indexOf(t);
  const go = j => { const c = cells[Math.max(0, Math.min(cells.length - 1, j))]; if (c) { e.preventDefault(); c.focus(); c.scrollIntoView({block: "nearest", inline: "nearest"}); } };
  const per = Math.max(1, cells.filter(c => Math.abs(c.offsetTop - cells[0].offsetTop) < 4).length);
  if (e.key === "ArrowRight") go(i + 1); else if (e.key === "ArrowLeft") go(i - 1);
  else if (e.key === "ArrowDown") go(i + per); else if (e.key === "Home") go(0); else if (e.key === "End") go(cells.length - 1);
  else if (e.key === "ArrowUp") { if (i - per < 0) { const q = env.querySelector(".env-q"); if (q) { e.preventDefault(); q.focus(); } } else go(i - per); }
  else if (e.key === "Escape") { const q = env.querySelector(".env-q"); if (q) { e.preventDefault(); q.focus(); } }
  else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); stkKeyAdd(t.dataset.stkSrc); }
});
// Where a screen point lands on a (possibly rotated) note
function noteLocalPoint(noteEl, px, py){
  const r = noteEl.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const w = noteEl.offsetWidth, h = noteEl.offsetHeight;
  const rot = (parseFloat(noteEl.style.getPropertyValue("--rot")) || 0) * Math.PI / 180;
  const zk = noteEl.closest("#nbBoard") ? nbZ() : 1, dx = (px - cx) / zk, dy = (py - cy) / zk;
  const lx = dx * Math.cos(-rot) - dy * Math.sin(-rot), ly = dx * Math.sin(-rot) + dy * Math.cos(-rot);
  return {x: Math.round(Math.max(-8, Math.min(108, (lx + w / 2) / w * 100))), yp: Math.round(Math.max(-14, Math.min(h + 14, ly + h / 2)))};
}
let sDrag = null, stkClickBlock = 0;
function stkNoteAt(x, y){ const el = document.elementFromPoint(x, y); return el && el.closest ? el.closest(".nb-board .note") : null; }
function stkEnd(ok, e){
  const d = sDrag; sDrag = null; if (!d) return;
  // Find the note while the tray is still out of the way, before the drag styling comes off
  const target = ok && d.moved ? stkNoteAt(e.clientX, e.clientY) : null;
  document.body.classList.remove("stk-dragging");
  $$(".note.stk-target").forEach(n => n.classList.remove("stk-target"));
  if (d.ghost) d.ghost.remove();
  if (d.el) d.el.style.opacity = "";
  if (!ok) return;
  stkClickBlock = Date.now();
  if (!d.moved) {
    if (d.fromNote) { const n = state.notes[d.noteId]; if (!n) return; const m = clone(n), s = m.stickers[d.i]; if (!s) return; const sizes = [1, 1.4, 0.7]; s.s = sizes[(sizes.indexOf(s.s || 1) + 1) % sizes.length]; applyChanges([{kind: "note", id: n.id, after: m}], ""); }
    else toast("Drag the sticker onto a sticky note");
    return;
  }
  const tid = target && target.dataset.note;
  const changes = [];
  let moved = null;
  if (d.fromNote) {
    const src = state.notes[d.noteId]; if (!src) return;
    const m = clone(src); moved = m.stickers.splice(d.i, 1)[0]; if (!moved) return;
    if (tid === d.noteId) { Object.assign(moved, noteLocalPoint(target, e.clientX, e.clientY)); delete moved.y; m.stickers.splice(d.i, 0, moved); applyChanges([{kind: "note", id: src.id, after: m}], ""); return; }
    changes.push({kind: "note", id: src.id, after: m});
    if (!tid) { applyChanges(changes, "Sticker removed"); return; }
  }
  if (!tid || !state.notes[tid]) { if (!d.fromNote) toast("Drop stickers onto a sticky note"); return; }
  const t = clone(state.notes[tid]);
  const s = Object.assign(moved || {k: d.k, r: Math.round(Math.random() * 30 - 15), s: 1}, noteLocalPoint(target, e.clientX, e.clientY)); delete s.y;
  t.stickers = (t.stickers || []).concat(s).slice(-16);
  changes.push({kind: "note", id: tid, after: t});
  applyChanges(changes, "");
}
// Turning a sticker
let sRot = null;
document.addEventListener("pointerdown", e => {
  const h = e.target.closest && e.target.closest(".nb-board .note .stk .stk-rot"); if (!h || sRot || sDrag) return;
  const el = h.closest(".stk"), noteEl = el.closest(".note"), r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  sRot = {el, noteId: noteEl.dataset.note, i: Number(el.dataset.stk), cx, cy, a0: Math.atan2(e.clientY - cy, e.clientX - cx), r0: parseFloat(el.style.getPropertyValue("--r")) || 0, r: null, pid: e.pointerId};
  el.classList.add("rotating"); e.preventDefault(); e.stopPropagation();
}, true);
document.addEventListener("pointermove", e => {
  if (!sRot || e.pointerId !== sRot.pid) return;
  let r = sRot.r0 + (Math.atan2(e.clientY - sRot.cy, e.clientX - sRot.cx) - sRot.a0) * 180 / Math.PI;
  r = ((r + 540) % 360) - 180; if (Math.abs(r) < 3) r = 0;
  sRot.r = Math.round(r); sRot.el.style.setProperty("--r", sRot.r + "deg"); e.preventDefault(); e.stopPropagation();
}, {capture: true, passive: false});
const sRotEnd = e => { if (!sRot || e.pointerId !== sRot.pid) return; const d = sRot; sRot = null; d.el.classList.remove("rotating"); stkClickBlock = Date.now(); e.stopPropagation();
  const n = state.notes[d.noteId]; if (!n || d.r == null || !n.stickers || !n.stickers[d.i]) return; const m = clone(n); m.stickers[d.i].r = d.r; applyChanges([{kind: "note", id: n.id, after: m}], ""); };
document.addEventListener("pointerup", sRotEnd, true); document.addEventListener("pointercancel", sRotEnd, true);
document.addEventListener("pointerdown", e => {
  if (sDrag || sRot || (e.pointerType === "mouse" && e.button !== 0)) return;
  const src = e.target.closest && e.target.closest("[data-stk-src]");
  const on = !src && e.target.closest && e.target.closest(".nb-board .note .stk");
  if (!src && !on) return;
  if (src && (src.dataset.locked || src.closest(".env-sheet.locked"))) { shopUnlock("sticker", (STICKERS[src.dataset.stkSrc] || {}).pack || ui.stkPack); e.preventDefault(); return; }
  const noteEl = on && on.closest(".note");
  const n = noteEl && state.notes[noteEl.dataset.note], i = on ? Number(on.dataset.stk) : -1;
  sDrag = {fromNote: !!on, k: src ? src.dataset.stkSrc : n && n.stickers[i] && n.stickers[i].k, el: on || null, noteId: noteEl && noteEl.dataset.note, i, x0: e.clientX, y0: e.clientY, pid: e.pointerId, moved: false, size: on ? on.getBoundingClientRect().width : 48};
  if (!sDrag.k) { sDrag = null; return; }
  e.preventDefault(); e.stopPropagation();
}, true);
document.addEventListener("pointermove", e => {
  if (!sDrag || e.pointerId !== sDrag.pid) return;
  if (!sDrag.moved && Math.hypot(e.clientX - sDrag.x0, e.clientY - sDrag.y0) < 6) return;
  if (!sDrag.moved) {
    sDrag.moved = true; document.body.classList.add("stk-dragging");
    const g = document.createElement("div"); g.className = "stk stk-ghost"; g.innerHTML = stickerSvg(sDrag.k);
    const sz = Math.max(40, Math.min(90, sDrag.size || 48)); g.style.width = g.style.height = sz + "px";
    document.body.appendChild(g); sDrag.ghost = g;
    if (sDrag.el) sDrag.el.style.opacity = "0";
  }
  sDrag.ghost.style.left = e.clientX + "px"; sDrag.ghost.style.top = e.clientY + "px";
  const t = stkNoteAt(e.clientX, e.clientY);
  $$(".note.stk-target").forEach(n => { if (n !== t) n.classList.remove("stk-target"); });
  if (t) t.classList.add("stk-target");
  e.preventDefault(); e.stopPropagation();
}, {capture: true, passive: false});
document.addEventListener("pointerup", e => { if (sDrag && e.pointerId === sDrag.pid) { e.stopPropagation(); stkEnd(true, e); } }, true);
document.addEventListener("pointercancel", e => { if (sDrag && e.pointerId === sDrag.pid) stkEnd(sDrag.moved, e); }, true);
// The click that ends a sticker drag, turn or resize must not open the note
document.addEventListener("click", e => { if (Date.now() - stkClickBlock < 500 && e.target.closest && e.target.closest(".stk,[data-stk-src],.note,#nbBoard")) { e.preventDefault(); e.stopPropagation(); } }, true);
document.addEventListener("touchmove", e => { if (sDrag && sDrag.moved) e.preventDefault(); }, {passive: false});
const STYLE_ACTS = {
  "shop": () => styleShop(),
  "shop-tab": el => styleShop(el.dataset.id),
  "shop-unlock": el => shopUnlock(el.dataset.kind, el.dataset.id),
  "cp-start": el => cpStart(el.dataset.id),
  "cp-end": () => cpEnd(false),
  "shop-use": el => {
    const k = el.dataset.kind, id = el.dataset.id;
    if (!owns(k, id)) { shopUnlock(k, id); return; }
    if (k === "skin") { saveStyle({skin: id}); applySkin(); }
    else if (k === "card") saveStyle({card: id, cardAuto: id === "theme"});
    else if (k === "note") saveStyle({note: id, noteAuto: false, notePicked: true});
    else if (k === "pin") saveStyle({pin: id, pinAuto: false, pinPicked: true});
    render(); styleShop();
  },
  "stk-pack": el => { ui.stkPack = el.dataset.id; ui.stkQ = ""; render(); },
  "stk-qclear": () => { ui.stkQ = ""; stkRefresh(); const q = document.querySelector(".env-q"); if (q) q.focus(); },
  "stk-try": el => { ui.stkQ = el.dataset.id || ""; stkRefresh(); const q = document.querySelector(".env-q"); if (q) q.focus(); },
  "motion-toggle": el => { saveStyle({motion: !!el.checked}); artSig = ""; renderSkinArt(); },
  "anim-toggle": el => { saveStyle({[el.dataset.key]: !!el.checked}); artSig = ""; renderSkinArt(); },
  "kit-follow": el => { saveStyle({[el.dataset.kind + "Auto"]: true}); render(); styleShop(); },
  "env-toggle": () => { ui.envOpen = ui.envOpen === false; try { localStorage.setItem("studyboard:env", ui.envOpen ? "1" : "0"); } catch(e) {} render(); }
};
try { const v = localStorage.getItem("studyboard:env"); if (v) ui.envOpen = v === "1"; else if (window.matchMedia && window.matchMedia("(max-width:700px)").matches) ui.envOpen = false; } catch(e) {}
document.addEventListener("change", e => {
  const c = e.target.classList; if (!c || !(c.contains("note-shape") || c.contains("note-pin"))) return;
  const n = state.notes[e.target.dataset.id]; if (!n) return;
  const kind = c.contains("note-shape") ? "note" : "pin", field = kind === "note" ? "shape" : "pin", v = e.target.value;
  if (v && !owns(kind, v)) { shopUnlock(kind, v); e.target.value = n[field] || ""; return; }
  applyChanges([{kind: "note", id: n.id, after: Object.assign(clone(n), {[field]: v})}], "");
});

const AI_ACTS = {
  "cf-view": el => { const v = el.dataset.id; if (dlg.open && dlg.contains(el)) dlg.close(); ui.tab = v === "files" ? "files" : v === "emails" ? "emails" : "courses"; ui.courseId = null; ui.courseTab = v === "grades" ? "grades" : ""; ui.courseTabFor = null; render(); window.scrollTo(0, 0); },
  "plan-view": el => { const t = el.dataset.id === "schedule" || el.dataset.id === "crunch" ? el.dataset.id : "timeline"; if (t === "timeline" && ui.tab !== "timeline") ui.tlJump = true; ui.tab = t; render(); window.scrollTo(0, 0); },
  "bview": el => { ui.bview = el.dataset.id; try { localStorage.setItem("studyboard:bview", ui.bview); } catch(e) {} render(); window.scrollTo(0, 0); },
  "qa-add": () => qaAdd(), "qa-full": () => qaFull(), "qa-cancel": () => { ui.qa = null; render(); },
  "qa-rm": el => { if (ui.qa) { ui.qa.items.splice(Number(el.dataset.i), 1); if (!ui.qa.items.length) ui.qa = null; render(); } },
  "tf-est": el => tfEstimate(el),
  "nu-skip": el => { nuSkips().ids.push(el.dataset.id); nuSkipSave(); if (!/^study:/.test(el.dataset.id)) nufbAdd("skip", state.tasks[el.dataset.id]); render(); },
  "nu-more": el => { ui.nuMore = !ui.nuMore; const c = el.closest(".next-up"); if (c) c.classList.toggle("nu-open", ui.nuMore); el.setAttribute("aria-expanded", String(!!ui.nuMore)); },
  "nu-enough": el => { const t = state.tasks[el.dataset.id]; if (!t) return; const n = clone(t); n.history = (n.history || []).concat({at: Date.now(), text: "Enough for today"}).slice(-30); applyChanges([{kind: "task", id: t.id, after: n}], null); toast(`Okay, moving on from “${t.title}” for today. It stays on your list.`); render(); },
  "nu-back": () => { const id = nuSkips().ids.pop(); nuSkipSave(); ui.nuLast = null; if (id && !/^study:/.test(id)) nufbDrop("skip", id); render(); },
  "heads-hide": el => { let h = {}; try { h = JSON.parse(localStorage.getItem(HEADS_HIDE) || "{}") || {}; } catch(e) {} Object.keys(h).forEach(k => { if (Date.now() - h[k] > 8 * 864e5 || h[k] === 1) delete h[k]; }); h[el.dataset.id] = Date.now(); try { localStorage.setItem(HEADS_HIDE, JSON.stringify(h)); } catch(e) {} render(); },
  "ai-explain": el => runExplain(el.dataset.key, el.dataset.given),
  "fc-weak": el => weakSheet(el.dataset.id ? [el.dataset.id] : decksArr().filter(d => ui.filter === "all" || d.courseId === ui.filter).map(d => d.id)),
  "fc-case": el => caseStyleSheet(el.dataset.id),
  "exam-plan": el => examPlanSheet(el.dataset.id),
  "fc-study-plan": el => { const t = state.tasks[el.dataset.id]; const ids = ((t && t.studyDecks) || []).filter(id => state.decks[id]); if (dlg.open) dlg.close(); if (!ids.length) return; const only = AUTO_ON && (t.studyCardIds || []).length ? t.studyCardIds : null; startStudy(ids, only); },
  "fc-practice-plan": el => { const t = state.tasks[el.dataset.id]; const ids = ((t && t.studyDecks) || []).filter(id => state.decks[id]); if (dlg.open) dlg.close();
    const pq = t && t.practiceQuiz; if (pq && pq.quizId && state.decks[pq.deckId] && (state.decks[pq.deckId].aiQuizzes || []).some(q => q.id === pq.quizId)) { startAiQuiz(pq.deckId, pq.quizId); return; } const withQ = ids.map(id => state.decks[id]).filter(d => (d.aiQuizzes || []).some(q => q.kind !== "weak")); if (withQ.length) { const d = withQ[0], q = d.aiQuizzes.filter(x => x.kind !== "weak").slice(-1)[0]; startAiQuiz(d.id, q.id); } else if (ids.length) quizSheet(ids); },
  "f-summarize": el => summarizeFile(el.dataset.id),
  "note-photo": () => photoNoteSheet(),
  "ask-course": el => askSheet(el.dataset.id || "")
};
