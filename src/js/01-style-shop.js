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
// Founder themes: when you pick a Founder's suggestion (studyboard_founder_theme_pick), add it here like any Pro theme,
// with the same id, group: "founders" and tier: "pro". It shows under Founder Themes, and its Founder keeps it without Pro.
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
    fire("good-moment", "grade");
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

/* Each theme: spawn(W, H, dark, n) returns particles; optional draw(g, f, W, H, dark) paints under them and over() on top.
   What a particle can have (all optional except shape, x, y; speeds are per 60 fps frame):
   vx vy g drag: motion. term: the fastest it can fall, so light things drift down once a burst slows.
   sway swf: side to side drift. rock: tilts with the drift like a falling leaf, instead of spinning (vr).
   flip: tumbles in 3D and shows a darker back. face: points where it's heading, mirrored so it's never upside down.
   wig: a swimming wiggle. z: depth, so far ones are smaller, slower and fainter. tw: twinkles in place; glint: grows and
   shrinks as it twinkles. grow: grows with age. fsw: drift that starts once a burst particle is on its way down. */
const FX_LIGHT = new Set(["petal", "leaf", "mintleaf", "maple", "confetti", "sprinkle", "flower", "fallleaf", "oakleaf", "heart", "bleaf", "sprig", "japanpetal", "japansakura", "clover", "print"]);
const fxZ = o => o.depth === false ? 1 : fxR(o.zmin || 0.62, o.zmax || 1.12);
const fxDim = z => 0.55 + 0.45 * Math.min(1, z);
const fxFall = (W, H, n, shape, cols, o = {}) => Array.from({length: n}, () => { const z = fxZ(o);
  return {shape, c: fxPick(cols), x: fxR(-20, W + 20), y: fxR(-H * 0.5, -10), vx: fxR(-0.6, 0.6) * z, vy: fxR(o.vmin || 1.2, o.vmax || 2.6) * z, g: 0.012 * z, size: fxR(o.smin || 7, o.smax || 12) * z, z,
    rot: fxR(0, 6.3), vr: o.flip || o.rock ? 0 : fxR(-0.05, 0.05), rock: o.rock != null ? o.rock * fxR(0.6, 1.2) : o.flip ? fxR(0.3, 0.7) : 0, sway: (o.sway || 1.3) * z, swf: fxR(0.03, 0.06), flip: o.flip,
    life: o.life || 260, delay: Math.floor(fxR(0, o.spread || 40)), glow: o.glow, alpha: (o.alpha || 1) * fxDim(z)}; });
const fxRise = (W, H, n, shape, cols, o = {}) => Array.from({length: n}, () => { const z = fxZ(o);
  return {shape, c: fxPick(cols), x: o.cx ? fxR(o.cx[0] * W, o.cx[1] * W) : fxR(0, W), y: H + fxR(10, 60), vx: fxR(-0.3, 0.3), vy: -fxR(o.vmin || 1.4, o.vmax || 3) * z, g: 0, size: fxR(o.smin || 5, o.smax || 12) * z, z,
    rot: o.rot || 0, vr: 0, rock: o.rock || 0, sway: (o.sway || 0.8) * z, swf: fxR(0.03, 0.07), grow: o.grow || 0, flip: o.flip, alpha: (o.alpha || 1) * fxDim(z), life: o.life || 170,
    delay: Math.floor(fxR(0, o.spread || 50)), glow: o.glow}; });
const fxBurst = (W, H, n, shape, cols, pts, o = {}) => Array.from({length: n}, (_, i) => { const [bx, by] = pts[i % pts.length], up = by > 0.5, a = up ? -Math.PI / 2 + fxR(-0.7, 0.7) + (bx < 0.4 ? 0.3 : bx > 0.6 ? -0.3 : 0) : fxR(0, 6.3), sp = up ? fxR(H * 0.02, H * 0.034) : fxR(3, 8), light = FX_LIGHT.has(shape);
  return {shape, c: fxPick(cols), x: bx * W, y: by * H, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: o.g || 0.3, drag: 0.985, term: o.term || (light ? fxR(1.3, 2) : fxR(4, 6)), fsw: o.fsw != null ? o.fsw : light ? fxR(0.8, 1.6) : 0,
    swf: fxR(0.04, 0.08), size: fxR(o.smin || 7, o.smax || 12), rot: fxR(0, 6.3), vr: fxR(-0.2, 0.2), sway: 0, life: o.life || (light ? 270 : 220), delay: up ? Math.floor(fxR(0, 6)) : Math.floor(fxR(4, 14)), flip: o.flip, glow: o.glow, bounce: o.bounce}; });
const fxTw = (W, H, n, shape, cols, o = {}) => Array.from({length: n}, () => ({shape, c: fxPick(cols), x: fxR(0, W), y: fxR(0, H * (o.top || 1)), vx: 0, vy: o.vy || 0, g: 0, size: fxR(o.smin || 4, o.smax || 9), rot: fxR(0, 0.6), vr: o.glint === false ? 0 : fxR(-0.02, 0.02), sway: 0,
  life: fxR(60, 120), delay: Math.floor(fxR(0, o.spread || 110)), tw: true, glint: o.glint != null ? o.glint : shape === "sparkle" || shape === "star", grow: o.grow || 0, glow: o.glow, alpha: o.alpha || 1}));
const fxFlutter = (W, H, n, cols) => Array.from({length: n}, (_, i) => { const left = i % 2 === 0; return {shape: "butterfly", c: fxPick(cols), x: left ? fxR(-30, W * 0.2) : fxR(W * 0.8, W + 30), y: H + fxR(10, 80), vx: (left ? 1 : -1) * fxR(0.6, 1.6), vy: -fxR(1.6, 2.8), g: 0, size: fxR(12, 18), rot: 0, vr: 0, sway: 2.2, swf: fxR(0.04, 0.07), rock: 0.25, flap: fxR(0.25, 0.4), life: 240, delay: Math.floor(fxR(0, 60))}; });
const fxStreaks = (W, H, n, cols) => Array.from({length: n}, () => { const sp = fxR(9, 14); return {shape: null, streak: true, c: fxPick(cols), x: fxR(W * 0.2, W * 1.1), y: fxR(-40, H * 0.35), vx: -sp, vy: sp * 0.5, g: 0, size: 2, life: 70, delay: Math.floor(fxR(0, 120)), glow: 12}; });

/* Northern lights: curtains of glowing vertical rays that unfurl across the sky, ripple with light running along them,
   then thin out. Each ray is one stretched strip from a small prebuilt gradient, so hundreds of rays stay cheap. */
const fxAurora = () => {
  const strip = {};
  const ray = (cols, k) => strip[k] || (strip[k] = (() => { const c = document.createElement("canvas"); c.width = 4; c.height = 256; const g = c.getContext("2d"), gr = g.createLinearGradient(0, 256, 0, 0);
    cols.forEach(([at, col]) => gr.addColorStop(at, col)); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); return c; })());
  // [height of the hem as a share of the screen, ray length, waviness, speed, colors, strength]
  const CURT = [[0.36, 0.3, 1, 1, 0, 1], [0.27, 0.22, 0.7, -0.8, 1, 0.7], [0.46, 0.18, 1.3, 1.3, 2, 0.45]];
  return (g, f, W, H, d) => {
    const P = d ? [[[0, "rgba(120,255,190,0)"], [0.04, "rgba(150,255,200,.95)"], [0.18, "rgba(70,240,160,.75)"], [0.55, "rgba(90,170,255,.32)"], [0.82, "rgba(190,110,255,.16)"], [1, "rgba(190,110,255,0)"]],
                   [[0, "rgba(255,140,220,0)"], [0.05, "rgba(255,160,225,.8)"], [0.3, "rgba(180,120,255,.5)"], [1, "rgba(120,110,255,0)"]],
                   [[0, "rgba(110,255,230,0)"], [0.05, "rgba(130,255,235,.8)"], [0.4, "rgba(80,200,255,.35)"], [1, "rgba(80,160,255,0)"]]]
                : [[[0, "rgba(20,170,120,0)"], [0.04, "rgba(10,165,112,.85)"], [0.2, "rgba(20,175,135,.6)"], [0.6, "rgba(60,110,220,.28)"], [0.85, "rgba(130,80,220,.1)"], [1, "rgba(130,80,220,0)"]],
                   [[0, "rgba(210,70,170,0)"], [0.05, "rgba(205,60,160,.65)"], [0.35, "rgba(130,70,220,.36)"], [1, "rgba(90,80,220,0)"]],
                   [[0, "rgba(20,160,170,0)"], [0.05, "rgba(20,160,175,.55)"], [0.4, "rgba(40,130,210,.22)"], [1, "rgba(40,120,210,0)"]]];
    const ph = W < H, unf = fxEase(f / 70), out = 1 - fxEase((f - 195) / 85);
    if (out <= 0) return;
    g.globalCompositeOperation = d ? "lighter" : "source-over";
    const step = Math.max(2.5, W / 340), wr = step * 1.7;
    CURT.forEach(([y0, len, wav, spd, pi, str], ci) => {
      const spr = ray(P[pi], (d ? "d" : "l") + pi), yb = H * (ph ? y0 * 0.8 : y0), L0 = H * len * (ph ? 0.8 : 1), t = f * 0.016 * spd, from = ci % 2 ? W * 1.05 : -W * 0.05;
      for (let x = -W * 0.05; x < W * 1.05; x += step) {
        const reach = Math.abs(x - from) / (W * 1.1), show = fxEase((unf * 1.25 - reach) * 4); if (show <= 0) continue;
        const y = yb + Math.sin(x / (W * 0.23) + t) * H * 0.05 * wav + Math.sin(x / (W * 0.071) - t * 1.7 + ci) * H * 0.014 * wav;
        const pulse = 0.45 + 0.55 * Math.pow(0.5 + 0.5 * Math.sin(x / (W * 0.045) - f * 0.09 * spd + ci * 2), 2), fold = 0.65 + 0.35 * Math.sin(x / (W * 0.018) + ci * 5 + Math.sin(f * 0.02 + x * 0.01));
        const edge = Math.min(1, (x + W * 0.05) / (W * 0.18), (W * 1.05 - x) / (W * 0.18)), len2 = L0 * (0.7 + 0.45 * fold);
        g.globalAlpha = Math.max(0, str * show * out * pulse * edge * (0.55 + 0.45 * fold));
        g.drawImage(spr, x, y - len2, wr, len2 * 1.04);
      }
    });
    g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
  };
};

/* Richer sprites for shapes the original themes share (each keeps its d silhouette for flashcard motifs) */
(() => {
  const disc = (g, r) => { g.beginPath(); g.arc(0, 0, r, 0, 6.3); };
  const gloss = (g, r, a) => { const gr = g.createRadialGradient(-r * 0.35, -r * 0.45, 0, -r * 0.2, -r * 0.2, r * 1.15); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.5, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(0,0,0,.18)"); g.fillStyle = gr; disc(g, r); g.fill(); };
  FX_SHAPES.petal.paint = (g, c) => { const p = new Path2D(FX_SHAPES.petal.d), gr = g.createLinearGradient(0, 6, 0, -8); gr.addColorStop(0, "#FFF4F8"); gr.addColorStop(0.55, c); gr.addColorStop(1, fxShade(c, 0.92));
    g.fillStyle = gr; g.fill(p); g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 0.7; g.beginPath(); g.moveTo(0, 4.6); g.quadraticCurveTo(-0.6, -1, 0, -6); g.stroke(); };
  FX_SHAPES.lemon.paint = (g, c) => { g.fillStyle = fxShade(c, 0.92); disc(g, 10); g.fill(); g.fillStyle = "#FFFBE6"; disc(g, 8.6); g.fill();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.fillStyle = i % 2 ? c : fxShade(c, 1.06); g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 7.6, a + 0.1, a + Math.PI / 4 - 0.1); g.closePath(); g.fill(); }
    g.fillStyle = "#FFFBE6"; disc(g, 1.3); g.fill(); gloss(g, 10, 0.35); };
  FX_SHAPES.ball.paint = (g, c) => { const cols = [c, "#FFFFFF", "#FFC53D", "#FFFFFF", "#23B5D3", "#FFFFFF"];
    cols.forEach((k, i) => { g.fillStyle = k; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 10, i * Math.PI / 3, (i + 1) * Math.PI / 3); g.closePath(); g.fill(); });
    g.fillStyle = "#FFFFFF"; disc(g, 2.6); g.fill(); gloss(g, 10, 0.55); };
  FX_SHAPES.candy.paint = (g, c) => { const p = new Path2D(FX_SHAPES.candy.d); g.fillStyle = fxShade(c, 1.12); g.fill(p);
    g.save(); g.beginPath(); g.ellipse(0, 0, 5.2, 5, 0, 0, 6.3); g.clip(); g.fillStyle = c; g.fillRect(-6, -6, 12, 12); g.strokeStyle = "rgba(255,255,255,.75)"; g.lineWidth = 1.4;
    for (let x = -10; x < 10; x += 3.4) { g.beginPath(); g.moveTo(x, -6); g.lineTo(x + 6, 6); g.stroke(); } g.restore(); gloss(g, 5.2, 0.45); };
  FX_SHAPES.bubble.paint = (g, c) => { const gr = g.createRadialGradient(0, 0, 4, 0, 0, 9.4); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.75, "rgba(255,255,255,.08)"); gr.addColorStop(1, c);
    g.fillStyle = gr; disc(g, 9.4); g.fill(); g.strokeStyle = c; g.globalAlpha = 0.8; g.lineWidth = 0.9; disc(g, 9); g.stroke(); g.globalAlpha = 1;
    g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 1.5; g.lineCap = "round"; g.beginPath(); g.arc(0, 0, 6.2, 3.6, 4.5); g.stroke(); g.fillStyle = "rgba(255,255,255,.85)"; g.beginPath(); g.arc(4, 4.4, 1, 0, 6.3); g.fill(); };
  FX_SHAPES.bokeh = {d: FX_SHAPES.circle.d, paint: (g, c) => { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 10.6); gr.addColorStop(0, c); gr.addColorStop(0.82, c); gr.addColorStop(0.9, "rgba(255,255,255,.9)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.globalAlpha = 0.55; g.fillStyle = gr; disc(g, 10.6); g.fill(); g.globalAlpha = 0.5; g.strokeStyle = c; g.lineWidth = 1; disc(g, 9.6); g.stroke(); }};
  FX_SHAPES.gull = {d: "M-11 -1.4C-7.6 -5 -3.2 -4.4 0 -0.4C3.2 -4.4 7.6 -5 11 -1.4C7.4 -2.6 3.6 -1.6 0.9 1.8H-0.9C-3.6 -1.6 -7.4 -2.6 -11 -1.4Z", flat: true};
  FX_SHAPES.glint = {d: "M-10 0Q0 -1.4 10 0Q0 1.4 -10 0Z", flat: true};
  FX_SHAPES.snowsoft = {d: FX_SHAPES.circle.d, paint: (g, c) => { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 10); gr.addColorStop(0, c); gr.addColorStop(0.45, c); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; disc(g, 10); g.fill(); }};
})();

/* Moments drawn under the particles. Each builds its expensive pieces once and fades itself in and out softly. */
const fxOut = (f, a, b) => 1 - fxEase((f - a) / (b - a));
// Galaxy: a spiral galaxy blooms open from its core and slowly turns, inner stars faster than outer ones
const fxGalaxy = () => {
  const S = Array.from({length: 360}, (_, i) => ({arm: i % 3, r: Math.pow(Math.random(), 0.7), j: (Math.random() - 0.5) * 0.7, k: Math.random(), tw: Math.random() * 6.3, s: Math.random()}));
  return (g, f, W, H, d) => {
    const out = fxOut(f, 190, 270), bloom = fxEase(f / 90), cx = W * 0.5, cy = H * (W < H ? 0.4 : 0.44), R = Math.min(W, H) * (W < H ? 0.56 : 0.6) * (0.25 + 0.75 * bloom);
    if (out <= 0) return;
    const cols = d ? ["#FFFFFF", "#CFC4FF", "#FFB8E4", "#9FD8FF"] : ["#4B2FC9", "#7A4EE6", "#C04EB4", "#3A6BD6"];
    g.globalCompositeOperation = d ? "lighter" : "source-over";
    const core = g.createRadialGradient(cx, cy, 0, cx, cy, R * 0.55); core.addColorStop(0, d ? "rgba(255,236,250,.55)" : "rgba(150,100,250,.4)"); core.addColorStop(0.35, d ? "rgba(190,150,255,.18)" : "rgba(170,120,255,.12)"); core.addColorStop(1, "rgba(160,120,255,0)");
    g.globalAlpha = out * bloom; g.fillStyle = core; g.beginPath(); g.ellipse(cx, cy, R * 0.55, R * 0.4, -0.35, 0, 6.3); g.fill();
    const c = Math.cos(-0.35), si = Math.sin(-0.35);
    for (const s of S) {
      const a = s.arm * 2.094 + s.r * 4.6 + s.j * (0.4 + s.r) + f * 0.009 * (1.6 - s.r), rr = s.r * R, ex = Math.cos(a) * rr, ey = Math.sin(a) * rr * 0.5;
      const x = cx + ex * c - ey * si, y = cy + ex * si + ey * c, sz = (0.8 + s.s * 2.1) * (1.15 - s.r * 0.5) * (d ? 1 : 1.25) * Math.max(1, Math.min(W, H) / 700);
      g.globalAlpha = out * Math.min(1, bloom * 1.6 - s.r * 0.5) * (0.55 + 0.45 * Math.sin(f * 0.12 + s.tw)) * (s.r < 0.12 ? 0.7 : 1);
      if (g.globalAlpha <= 0.02) continue;
      g.fillStyle = cols[s.r < 0.18 ? 0 : 1 + (s.arm + (s.k > 0.7 ? 1 : 0)) % 3]; g.beginPath(); g.arc(x, y, sz, 0, 6.3); g.fill();
    }
    g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
  };
};
// Christmas: a string of lights is pinned along the very top of the page. It drops in, bounces to rest, and the
// bulbs (hanging straight down from the wire) swing on their sockets, light up one by one and keep twinkling
const fxGarland = () => (g, f, W, H, d) => {
  const out = fxOut(f, 200, 268) * fxEase(f / 10); if (out <= 0) return;
  const ph = W < H, swags = ph ? 2 : 3, bk = Math.max(1.15, Math.min(1.8, Math.min(W, H) / 460)), sag0 = H * (ph ? 0.085 : 0.15), cols = ["#FF4A3D", "#2FD07A", "#FFC23D", "#4A8BFF", "#FF7AC8"];
  const sag = sag0 * (1 - Math.exp(-f / 12) * Math.cos(f * 0.2));
  const pt = u => { const k = u * swags, t = k - Math.min(swags - 1, Math.floor(k)); return [W * u, -1 + sag * 4 * t * (1 - t)]; };
  g.globalAlpha = out; g.strokeStyle = d ? "#3F7A52" : "#2E5A3A"; g.lineWidth = 2 * bk; g.lineCap = "round"; g.beginPath();
  for (let u = 0; u <= 1.0001; u += 0.005) { const [x, y] = pt(u); u ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  const per = Math.max(4, Math.round(W / swags / (62 * bk)));
  for (let s = 0; s < swags; s++) for (let k = 1; k < per; k++) {
    const i = s * per + k, u = (s + k / per) / swags, [x, y] = pt(u), col = cols[i % cols.length];
    const swing = 0.4 * Math.exp(-f / 50) * Math.sin(f * 0.15 + i * 0.9) + 0.08 * Math.sin(f * 0.045 + i * 1.7);
    const on = fxEase((f - 22 - i * 1.5) / 8), tw = 0.75 + 0.25 * Math.sin(f * 0.1 + i * 2.3);
    g.save(); g.translate(x, y); g.rotate(swing); g.scale(bk, bk);
    if (on > 0) { g.globalAlpha = out * on * tw * (d ? 0.55 : 0.38); const gl = g.createRadialGradient(0, 11, 0, 0, 11, 20); gl.addColorStop(0, col); gl.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gl; g.fillRect(-20, -9, 40, 40); }
    g.globalAlpha = out; g.fillStyle = d ? "#5E6A60" : "#6E7A70"; g.fillRect(-2.6, 0, 5.2, 4.6);
    g.fillStyle = on > 0.5 ? col : fxShade(col, 0.55); g.beginPath(); g.moveTo(0, 4); g.bezierCurveTo(5.4, 4.4, 5.6, 11, 0, 17.5); g.bezierCurveTo(-5.6, 11, -5.4, 4.4, 0, 4); g.fill();
    g.fillStyle = `rgba(255,255,255,${0.25 + 0.45 * on})`; g.beginPath(); g.ellipse(-1.6, 8.6, 1.1, 2.8, 0.15, 0, 6.3); g.fill();
    g.restore();
  }
  g.globalAlpha = out; g.fillStyle = d ? "#3F7A52" : "#2E5A3A";
  for (let s = 0; s <= swags; s++) { g.beginPath(); g.arc(W * s / swags, 1, 3 * bk, 0, 6.3); g.fill(); }
};
// Café: three soft curls of steam rise from below, widen and drift apart (soft puffs stamped along each curl)
const fxSteam = () => { const puffs = {};
  return (g, f, W, H, d) => {
    const out = fxOut(f, 170, 262); if (out <= 0) return;
    const rgb = d ? "255,250,242" : "150,118,92", puff = puffs[rgb] || (puffs[rgb] = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const p = c.getContext("2d"), gr = p.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(0.5, `rgba(${rgb},.45)`); gr.addColorStop(1, `rgba(${rgb},0)`); p.fillStyle = gr; p.fillRect(0, 0, 64, 64); return c; })());
    const rise = fxEase(f / 140), base = H * 1.04, M = Math.min(W, H);
    g.save(); g.globalCompositeOperation = d ? "lighter" : "source-over";
    [[0.4, 0, 1], [0.5, 2.1, 1.15], [0.6, 4.2, 0.95]].forEach(([x0, ph, k]) => {
      const top = base - H * 0.75 * rise * k;
      for (let i = 0; i <= 34; i++) {
        const u = i / 34, y = base - (base - top) * u, x = W * x0 + W * (0.01 + 0.045 * u) * Math.sin(u * 6.5 + ph - f * 0.04) + Math.sin(f * 0.012 + ph) * W * 0.02 * u, r = M * (0.03 + 0.06 * u);
        g.globalAlpha = out * Math.sin(Math.PI * Math.min(1, u * 1.1)) * (d ? 0.075 : 0.16);
        g.drawImage(puff, x - r, y - r, 2 * r, 2 * r);
      }
    });
    g.restore();
  };
};
// Neon: a glowing check mark flickers on like a sign warming up, then hums
const fxNeonCheck = () => (g, f, W, H, d) => {
  const out = fxOut(f, 190, 262); if (out <= 0) return;
  const S = Math.min(W, H) * 0.25, cx = W * 0.5, cy = H * 0.46, pts = [[-0.62, 0.02], [-0.18, 0.44], [0.66, -0.5]];
  const lenA = Math.hypot(0.44, 0.42), lenB = Math.hypot(0.84, 0.94), total = (lenA + lenB) * S, drawn = fxEase((f - 4) / 26) * total;
  const flick = f < 40 ? [1, 0.4, 1, 1, 0.55, 1, 1, 1][Math.floor(f / 5)] : 0.92 + 0.08 * Math.sin(f * 0.6);
  g.setLineDash([drawn, total + 10]); g.lineCap = g.lineJoin = "round";
  const path = () => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(cx + x * S, cy + y * S) : g.moveTo(cx + x * S, cy + y * S)); };
  [[S * 0.2, d ? 0.22 : 0.16, "#D05BEF", 30], [S * 0.075, 0.9, d ? "#E58CFF" : "#C84BEB", 14], [S * 0.03, 0.95, "#FFFFFF", 0]].forEach(([lw, a, col, blur]) => {
    g.globalAlpha = out * a * flick; g.lineWidth = lw; g.strokeStyle = col; g.shadowBlur = blur; g.shadowColor = "#C84BEB"; path(); g.stroke(); });
  g.setLineDash([]); g.shadowBlur = 0;
  [[22, "74,134,255"], [34, "205,75,235"]].forEach(([t0, rgb]) => { const t = f - t0; if (t < 0 || t > 110) return; const r = S * 0.9 + t * Math.max(W, H) / 170, a = 1 - fxEase(t / 110);
    g.globalAlpha = out * a * 0.7; g.shadowBlur = 18; g.shadowColor = `rgb(${rgb})`; g.strokeStyle = `rgb(${rgb})`; g.lineWidth = 2.5; g.beginPath(); g.arc(cx, cy, r, 0, 6.3); g.stroke(); });
  g.shadowBlur = 0;
};
// Synthwave: a striped sun rises over a glowing grid that rushes toward you
const fxSynth = () => (g, f, W, H, d) => {
  const out = fxOut(f, 185, 262); if (out <= 0) return;
  const hz = H * 0.7, R = Math.min(W, H) * (W < H ? 0.36 : 0.3), up = fxEase(f / 75), cy = hz + R * 0.95 - R * 1.25 * up, cx = W * 0.5;
  g.save(); g.beginPath(); g.rect(0, 0, W, hz); g.clip();
  const gr = g.createLinearGradient(0, cy - R, 0, cy + R); gr.addColorStop(0, "#FFE66D"); gr.addColorStop(0.45, "#FF8A5B"); gr.addColorStop(1, "#FF2FB3");
  g.globalAlpha = out * (d ? 0.85 : 0.75); g.shadowBlur = 40; g.shadowColor = d ? "#FF4FB8" : "rgba(255,90,170,.6)"; g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, 6.3); g.fill(); g.shadowBlur = 0;
  g.globalCompositeOperation = "destination-out"; g.globalAlpha = 1;
  for (let i = 0; i < 6; i++) { const y = hz - R * (0.62 - i * 0.11), h = R * (0.018 + i * 0.016); g.fillRect(cx - R, y, 2 * R, h); }
  g.restore();
  const ga = out * fxEase((f - 10) / 40), mag = d ? "255,60,200" : "200,40,160";
  g.save(); g.beginPath(); g.rect(0, hz, W, H - hz); g.clip(); g.lineWidth = 1.6; g.strokeStyle = `rgb(${mag})`; g.shadowBlur = 10; g.shadowColor = `rgb(${mag})`;
  for (let i = 0; i < 14; i++) { const t = ((i + f * 0.035) % 14) / 14, y = hz + (H - hz) * t * t; g.globalAlpha = ga * (0.15 + 0.75 * t); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  for (let i = -12; i <= 12; i++) { g.globalAlpha = ga * 0.55; g.beginPath(); g.moveTo(cx + i * W * 0.012, hz); g.lineTo(cx + i * W * 0.16, H); g.stroke(); }
  g.restore();
  g.globalAlpha = ga * 0.8; g.fillStyle = `rgb(${mag})`; g.fillRect(0, hz - 1, W, 2);
};
// Ocean: a glassy wave rolls in from the bottom with a line of foam, then slides back out
const fxWave = () => (g, f, W, H, d) => {
  const up = fxEase(f / 55) * (1 - fxEase((f - 120) / 100)); if (up <= 0.001) return;
  const crest = x => H * (1 - 0.26 * up) + Math.sin(x / W * 7 + f * 0.05) * H * 0.016 + Math.sin(x / W * 17 - f * 0.08) * H * 0.006;
  const gr = g.createLinearGradient(0, H * 0.7, 0, H); gr.addColorStop(0, d ? "rgba(60,207,224,.38)" : "rgba(20,167,189,.32)"); gr.addColorStop(1, d ? "rgba(10,90,120,.5)" : "rgba(10,127,146,.45)");
  g.fillStyle = gr; g.beginPath(); g.moveTo(0, H);
  for (let x = 0; x <= W + 8; x += 8) g.lineTo(x, crest(x)); g.lineTo(W, H); g.closePath(); g.fill();
  g.strokeStyle = d ? "rgba(230,250,255,.85)" : "rgba(255,255,255,.95)"; g.lineWidth = 3.5; g.lineCap = "round"; g.beginPath();
  for (let x = 0; x <= W + 8; x += 8) x ? g.lineTo(x, crest(x)) : g.moveTo(x, crest(x)); g.stroke();
  g.fillStyle = "rgba(255,255,255,.7)"; for (let x = 7; x < W; x += 23) { const r = 1.5 + 1.5 * Math.abs(Math.sin(x * 1.3 + f * 0.05)); g.beginPath(); g.arc(x, crest(x) + 5 + (x * 7 % 9), r, 0, 6.3); g.fill(); }
};
// Forest: soft shafts of sunlight lean in through the trees
const fxBeams = () => (g, f, W, H, d) => {
  const a = fxEase(f / 60) * fxOut(f, 170, 250); if (a <= 0) return;
  g.globalCompositeOperation = d ? "lighter" : "source-over";
  [[0.12, 0.09, 0], [0.32, 0.05, 1.4], [0.5, 0.11, 2.6], [0.74, 0.06, 4]].forEach(([x0, w, ph]) => {
    const x = W * x0, ww = W * w, sk = H * 0.45, gr = g.createLinearGradient(x, 0, x + sk, H);
    gr.addColorStop(0, d ? "rgba(255,240,170,.16)" : "rgba(255,248,200,.5)"); gr.addColorStop(1, "rgba(255,248,200,0)");
    g.globalAlpha = a * (0.65 + 0.35 * Math.sin(f * 0.03 + ph)); g.fillStyle = gr; g.beginPath(); g.moveTo(x, -10); g.lineTo(x + ww, -10); g.lineTo(x + ww * 2.2 + sk, H); g.lineTo(x + sk, H); g.closePath(); g.fill();
  });
  g.globalCompositeOperation = "source-over";
};

const fxAt = (P, k) => P.map(p => Object.assign(p, {delay: (p.delay || 0) + k}));
const THEME_FX = {
  ocean: {spawn: (W, H, d, n) => fxRise(W, H, n(46), "bubble", d ? ["#9ED3DB", "#E2F5F7", "#6BDCEA"] : ["#0A7F92", "#14A7BD", "#3FA9BC"], {smin: 6, smax: 15, sway: 1.1, vmin: 1.2, vmax: 2.6, life: 220})
    .concat(fxAt(fxBurst(W, H, n(34), "drop", d ? ["#BFF4FA", "#6BDCEA"] : ["#14A7BD", "#7CC9D6", "#0A7F92"], [[0.25, 0.86], [0.5, 0.84], [0.75, 0.86]], {smin: 5, smax: 9}).map(p => Object.assign(p, {vx: p.vx * 0.5, vy: -fxR(4, 8), g: 0.22, rot: 0, vr: 0})), 34)),
    draw: fxWave()},
  sakura: {spawn: (W, H, d, n) => fxFall(W, H, n(90), "petal", d ? ["#FF9CC2", "#FFB8D2", "#F4C6DA", "#FFD6E6"] : ["#F48AB2", "#FFB3CF", "#F9C6D9", "#EE7AA0"], {sway: 1.6, flip: true, smin: 9, smax: 14, spread: 70}).map(p => Object.assign(p, {vx: fxR(0.5, 1.5) * p.z}))},
  forest: {spawn: (W, H, d, n) => fxFall(W, H, n(52), "leaf", d ? ["#5CCB7E", "#7EDB98", "#3F9A5D", "#A8D86A"] : ["#2F8A4E", "#45A865", "#7FB86E", "#3E9E7A", "#9CBF4A"], {sway: 1.5, flip: true, smin: 10, smax: 16, spread: 60})
    .concat(fxTw(W, H, n(26), "circle", d ? ["#F4EC8A", "#D9F79A"] : ["#E8C93A", "#B9D84A"], {smin: 1.6, smax: 3, glow: 12, vy: -0.35, spread: 150})), draw: fxBeams()},
  galaxy: {len: 280, spawn: (W, H, d, n) => fxStreaks(W, H, n(5), d ? ["#FFFFFF", "#C5BCF5", "#FF9BD6"] : ["#6B4EE6", "#C04EE6", "#8C6FF5"])
    .concat(fxTw(W, H, n(30), "sparkle", d ? ["#FFFFFF", "#B8A6FF", "#FFD1EC"] : ["#6B4EE6", "#9D86FF", "#C04EE6"], {smin: 3, smax: 7, glow: d ? 10 : 4, spread: 160})), draw: fxGalaxy()},
  arctic: {len: 280, spawn: (W, H, d, n) => fxTw(W, H, n(d ? 46 : 24), "sparkle", d ? ["#FFFFFF", "#DFFBF0", "#E8E0FF"] : ["#FFFFFF", "#CFEFFF"], {smin: 2, smax: 4.5, top: 0.55, glow: d ? 8 : 6, spread: 170}),
    draw: fxAurora()},
  autumn: {spawn: (W, H, d, n) => fxFall(W, H, n(52), "maple", ["#E07A2E", "#C8561C", "#F2B23E", "#B5401A", "#E8A13A"], {sway: 1.9, flip: true, smin: 9, smax: 15, spread: 70})
    .concat(fxFall(W, H, n(20), "oakleaf", ["#B86A2A", "#D9922F", "#9A4A1E"], {sway: 1.6, flip: true, smin: 9, smax: 13, spread: 70})).map(p => Object.assign(p, {vx: fxR(0.4, 1.6) * p.z}))},
  lemonade: {spawn: (W, H, d, n) => fxBurst(W, H, n(18), "lemon", ["#F2C200", "#FFD84A", "#F5B800", "#9CCB3A"], [[0.12, 1.02], [0.88, 1.02], [0.5, 1.04]], {smin: 11, smax: 16, flip: true})
    .concat(fxBurst(W, H, n(10), "mintleaf", ["#3FAE6A", "#5CC77F"], [[0.12, 1.02], [0.88, 1.02]], {smin: 8, smax: 11, flip: true}),
      fxRise(W, H, n(54), "bubble", d ? ["#FFF6B0", "#E8FFD0"] : ["#E0B000", "#9ED08A", "#F2C200"], {smin: 2.4, smax: 5, vmin: 2, vmax: 4, sway: 0.5, life: 200}))},
  winter: {spawn: (W, H, d, n) => fxFall(W, H, n(60), "snowsoft", d ? ["#FFFFFF", "#E6F0FF"] : ["#A9C4F2", "#C4D6F6", "#8FB0EA"], {vmin: 0.8, vmax: 1.6, sway: 1, smin: 3, smax: 6, spread: 80})
    .concat(fxFall(W, H, n(36), "snow", d ? ["#FFFFFF", "#DCE9FF", "#B9D4FF"] : ["#6F9AE0", "#5A86D6", "#3B6FD1"], {vmin: 0.9, vmax: 1.8, sway: 1.2, smin: 8, smax: 14, glow: d ? 8 : 0, rock: 0.5, spread: 80}))},
  xmas: {len: 280, spawn: (W, H, d, n) => fxFall(W, H, n(44), "snowsoft", d ? ["#FFFFFF", "#E6F0FF"] : ["#B9CDEB", "#D2DEF2"], {vmin: 0.7, vmax: 1.4, sway: 1, smin: 3, smax: 6, spread: 90})
    .concat(fxTw(W, H, n(16), "star", ["#F2C24A", "#FFE08A"], {smin: 4, smax: 7, glow: 10, spread: 160})), draw: fxGarland()},
  spring: {spawn: (W, H, d, n) => fxFlutter(W, H, n(10), ["#A884F0", "#F28BB8", "#F2C84A", "#8FC7F2"]).concat(fxFall(W, H, n(46), "petal", ["#F6A6C8", "#FFD1E3", "#FFFFFF", "#F9E28A", "#C9B2F4"], {sway: 1.5, flip: true, smin: 6, smax: 9, spread: 70}))},
  cafe: {spawn: (W, H, d, n) => fxBurst(W, H, n(22), "bean", ["#6B4226", "#8A5A2B", "#4A2E1A"], [[0.2, 1.02], [0.8, 1.02]], {smin: 8, smax: 11, flip: true})
    .concat(fxAt(fxRise(W, H, n(8), "heart", d ? ["#E8B48A", "#F5D6B8"] : ["#C8885A", "#D9A47A"], {cx: [0.4, 0.6], smin: 6, smax: 9, vmin: 0.9, vmax: 1.4, sway: 1, life: 200, alpha: 0.85}), 30)), draw: fxSteam()},
  sunset: {spawn: (W, H, d, n) => fxTw(W, H, n(46), "glint", d ? ["#FFE2A8", "#FFFFFF"] : ["#F5A623", "#FFC46B", "#E8894A"], {smin: 8, smax: 15, glow: d ? 8 : 6, glint: true, spread: 160}).map(p => Object.assign(p, {y: H * fxR(0.55, 0.98), rot: 0, vr: 0}))
    .concat(fxBurst(W, H, n(18), "shell", ["#FBC3A8", "#F7A58A", "#FFD9C2"], [[0.15, 1.02], [0.85, 1.02]], {smin: 10, smax: 14}), fxBurst(W, H, n(8), "starfish", ["#F07A8A", "#E8566C"], [[0.3, 1.02], [0.7, 1.02]], {smin: 10, smax: 14}),
      Array.from({length: 3}, (_, i) => { const l = i % 2 === 0; return {shape: "gull", c: d ? "#F4E6F0" : "#5A4652", x: l ? -40 : W + 40, y: H * fxR(0.12, 0.34), vx: (l ? 1 : -1) * fxR(1.4, 2.2), vy: fxR(-0.25, 0.1), g: 0, size: fxR(15, 21), face: true, flap: 0.11, sway: 0, life: 260, delay: 10 + i * 25}; }))},
  mint: {spawn: (W, H, d, n) => fxBurst(W, H, n(40), "mintleaf", ["#25B585", "#3FD6A0", "#0F845F"], [[0.12, 1.02], [0.88, 1.02], [0.5, 1.04]], {smin: 12, smax: 16, flip: true})
    .concat(fxBurst(W, H, n(30), "chip", ["#4A2E1A", "#6B4226", "#3A2A20"], [[0.12, 1.02], [0.88, 1.02], [0.5, 1.04]], {smin: 4.5, smax: 6.5}))},
  summer: {spawn: (W, H, d, n) => fxBurst(W, H, n(34), "drop", ["#23B5D3", "#4FC3F7", "#0E86C9"], [[0.25, 1.02], [0.75, 1.02]], {smin: 6, smax: 10})
    .concat(fxFall(W, H, n(5), "ball", ["#FF6B6B", "#FF8A3D", "#E84393"], {vmin: 3, vmax: 5, sway: 0, smin: 15, smax: 21, depth: false}).map(p => Object.assign(p, {g: 0.35, bounce: true, vr: fxR(-0.08, 0.08)})),
      fxTw(W, H, n(18), "sparkle", ["#FFD23F", "#FFE98A"], {smin: 3, smax: 7, glow: 8}))},
  bokeh: {spawn: (W, H, d, n) => fxTw(W, H, n(42), "bokeh", ["#FF64A0", "#28BEC8", "#FFB43C", "#8C6EFF", "#FFFFFF"], {smin: 10, smax: 26, grow: 0.05, vy: -0.3, alpha: d ? 0.85 : 0.75, glint: false, spread: 120}).map(p => Object.assign(p, {life: fxR(120, 190)}))},
  neon: {spawn: (W, H, d, n) => fxAt(fxBurst(W, H, n(54), "circle", ["#4A86FF", "#6E8FFF", "#D05BEF", "#C84BEB"], [[0.5, 0.46]], {smin: 1.6, smax: 3, g: 0.04, glow: 14}).map(p => Object.assign(p, {vx: p.vx * 1.3, vy: p.vy * 1.3})), 26), draw: fxNeonCheck()},
  candy: {spawn: (W, H, d, n) => fxBurst(W, H, n(60), "candy", ["#FF6FB5", "#8EE4B8", "#C9A0FF", "#FFD86B", "#6FD3FF"], [[0.12, 1.02], [0.88, 1.02], [0.5, 1.04]], {smin: 13, smax: 18, flip: true})
    .concat(fxTw(W, H, n(16), "sparkle", ["#FFFFFF", "#FFD1EC"], {smin: 3, smax: 6, glow: 8}))},
  arcade: {spawn: (W, H, d, n) => fxTw(W, H, n(30), "sparkle", ["#FF96C8", "#FFB45A", "#B48CFF", "#FFFFFF"], {smin: 3, smax: 7, glow: 12, top: 0.6, spread: 160}), draw: fxSynth()}
};


/* Sprites: each shape is drawn once into a small image, then stamped. Filled shapes get soft light from the top left
   and shade at the bottom right so they read as objects, not flat stickers. A shape can paint itself instead
   (paint(g, color, dark), in the same -12..12 box) for things that need more than one color. flat: true skips the shading. */
const FX_SPR = new Map(), SPR_U = 2.4, SPR_S = 64, SPR_G = 96;
const fxShade = (c, k) => { const m = /^#([0-9a-f]{6})$/i.exec(c); if (!m) return c; const v = parseInt(m[1], 16); return "#" + [16, 8, 0].map(s => Math.round(((v >> s) & 255) * k)).map(x => Math.min(255, x).toString(16).padStart(2, "0")).join(""); };
function fxSprite(shape, color, glow, dark, back){
  const key = shape + "|" + color + "|" + (glow || 0) + "|" + (dark ? 1 : 0) + (back ? "|b" : "");
  let c = FX_SPR.get(key); if (c) return c;
  const S = glow ? SPR_G : SPR_S, sh = FX_SHAPES[shape];
  const body = document.createElement("canvas"); body.width = body.height = S;
  const b = body.getContext("2d"); b.translate(S / 2, S / 2); b.scale(SPR_U, SPR_U);
  const col = back ? fxShade(color, 0.74) : color;
  const clear = /^#[0-9a-f]{6}$/i.test(col) ? col + "00" : "rgba(0,0,0,0)";   // soft edges fade in their own color, never through grey
  if (sh.paint) sh.paint(b, col, dark);
  else {
    const pp = fxPath(shape);
    if (shape === "orb") { const gr = b.createRadialGradient(0, 0, 0, 0, 0, 10); gr.addColorStop(0, col); gr.addColorStop(0.55, col); gr.addColorStop(1, clear); b.globalAlpha = 0.9; b.fillStyle = gr; b.beginPath(); b.arc(0, 0, 10, 0, 6.3); b.fill(); }
    else if (shape === "puffsoft") { const gr = b.createRadialGradient(0, 0, 0, 0, 0, 12); gr.addColorStop(0, col); gr.addColorStop(1, clear); b.fillStyle = gr; b.beginPath(); b.arc(0, 0, 12, 0, 6.3); b.fill(); }
    else if (sh.stroke) { b.strokeStyle = col; b.lineWidth = sh.lw || 1.4; b.lineCap = b.lineJoin = "round"; b.stroke(pp.d); }
    else {
      b.fillStyle = col; b.fill(pp.d);
      if (!sh.flat) { b.save(); b.globalCompositeOperation = "source-atop"; const gr = b.createLinearGradient(-7, -10, 7, 10); gr.addColorStop(0, `rgba(255,255,255,${back ? 0.1 : 0.34})`); gr.addColorStop(0.42, "rgba(255,255,255,0)"); gr.addColorStop(1, `rgba(0,0,0,${dark ? 0.26 : 0.2})`); b.fillStyle = gr; b.fillRect(-13, -13, 26, 26); b.restore(); }
    }
    if (pp.detail && shape !== "orb" && shape !== "puffsoft") {
      if (sh.dfill) { b.fillStyle = shape === "bulb" ? "#9AA0A8" : dark ? "rgba(0,0,0,.35)" : "rgba(255,255,255,.55)"; b.fill(pp.detail); }
      else { b.strokeStyle = shape === "butterfly" ? "rgba(40,30,60,.55)" : shape === "bubble" ? col : shape === "bean" ? "rgba(255,240,220,.6)" : "rgba(255,255,255,.7)"; b.lineWidth = 1.1; b.lineCap = "round"; b.stroke(pp.detail); }
    }
  }
  if (!glow) c = body;
  else { c = document.createElement("canvas"); c.width = c.height = S; const g = c.getContext("2d"); g.shadowBlur = glow * SPR_U; g.shadowColor = color; g.drawImage(body, 0, 0); }
  c._half = S / 2 / SPR_U;
  FX_SPR.set(key, c); if (FX_SPR.size > 500) FX_SPR.delete(FX_SPR.keys().next().value);
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

/* Plays one theme's pop-up. It lasts fx.len frames (about 4.5 s by default) and always ends with a gentle fade of the
   whole layer over its last second, so nothing is ever cut off mid-flight. */
const FX_LEN = 270, FX_FADE = 60;
const fxEase = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
function runThemeFx(fx){
  if (window.SBMotion && SBMotion.noParticles()) { SBMotion.flash(); return; }
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cv = document.createElement("canvas");
  cv.className = "confetti"; cv.setAttribute("aria-hidden", "true");
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight, dark = isDarkNow();
  cv.width = W * dpr; cv.height = H * dpr; document.body.appendChild(cv);
  const g = cv.getContext("2d"); g.scale(dpr, dpr);
  const scale = 1.6 * Math.max(0.8, Math.min(1.6, Math.sqrt(W * H) / 900));
  const n = x => Math.max(3, Math.round(x * (reduce ? 0.3 : 1) * Math.min(1.3, Math.max(0.55, W * H / 1100000))));
  const LEN = Math.min(360, fx.len || FX_LEN), FADE = Math.min(FX_FADE, LEN / 3);
  const P = fx.spawn(W, H, dark, n);
  P.sort((a, b) => (a.z || 1) - (b.z || 1));
  P.forEach(p => { p.age = 0; p.ph0 = p.ph0 != null ? p.ph0 : fxR(0, 6.3); p.rot = p.rot || 0; p.rot0 = p.rot;
    if (p.flip) { p.fsp = fxR(0.05, 0.11); p.fph = fxR(0, 6.3); }
    if (p.shape) { p.spr = fxSprite(p.shape, p.c, p.glow, dark); if (p.flip) p.sprB = fxSprite(p.shape, p.c, p.glow, dark, true); } });
  fxUntil = performance.now() + LEN * 16.7 + 400; ambientPause(true);
  let f = 0, last = performance.now(), acc = 0, done = false;
  const finish = () => { if (done) return; done = true; cv.remove(); ambientPause(false); fxUntil = performance.now() + 200; };
  const step = now => {
    acc += Math.min(100, now - last); last = now;
    let ticks = 0; while (acc >= 16.6 && ticks < 4) { acc -= 16.6; ticks++; tick(); }
    if (!ticks) { requestAnimationFrame(step); return; }
    if (f >= LEN) { finish(); return; }
    cv.style.opacity = String(1 - fxEase((f - (LEN - FADE)) / FADE));
    g.clearRect(0, 0, W, H);
    if (fx.draw) { g.save(); fx.draw(g, f, W, H, dark); g.restore(); }
    for (const p of P) {
      if (f < (p.delay || 0) || p.dead) continue;
      let a = p.alpha || 1, s = p.size * scale / 10 * (1 + (p.grow || 0) * p.age / 10);
      if (p.tw) { const e = Math.sin(Math.PI * p.age / p.life); a *= e; if (p.glint) s *= 0.35 + 0.65 * e; }
      else { const left = p.life - p.age; a *= fxEase(left / 40) * fxEase(p.age / 10); }
      if (a <= 0.01) continue;
      g.globalAlpha = Math.min(1, a);
      if (p.streak) {
        const len = 70 * scale, m = Math.hypot(p.vx, p.vy), ux = p.vx / m, uy = p.vy / m, grd = g.createLinearGradient(p.x, p.y, p.x - ux * len, p.y - uy * len);
        grd.addColorStop(0, p.c); grd.addColorStop(1, "rgba(255,255,255,0)");
        g.strokeStyle = grd; g.lineWidth = 2.2; g.lineCap = "round"; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - ux * len, p.y - uy * len); g.stroke();
        continue;
      }
      let rot = p.rot, mx = 1, spr = p.spr;
      if (p.face) { const vx = p.vx + (p.dx || 0), vy = p.vy; if (vx < 0) { mx = -1; rot = Math.atan2(-vy, -vx); } else rot = Math.atan2(vy, vx); }
      if (p.wig) rot += Math.sin(p.age * 0.22 + p.ph0) * p.wig;
      let fl = 1;
      if (p.flip) { fl = Math.cos(p.age * p.fsp + p.fph); if (fl < 0 && p.sprB) spr = p.sprB; fl = Math.sign(fl || 1) * Math.max(0.12, Math.abs(fl)); }
      const fp = p.flap ? 0.35 + 0.65 * Math.abs(Math.cos(p.age * p.flap)) : 1;
      const sx = s * fl * fp * mx, c = Math.cos(rot), si = Math.sin(rot), h = spr._half;
      g.setTransform(dpr * c * sx, dpr * si * sx, -dpr * si * s, dpr * c * s, dpr * p.x, dpr * p.y);
      g.drawImage(spr, -h, -h, 2 * h, 2 * h);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    g.globalAlpha = 1;
    if (fx.over) { g.save(); fx.over(g, f, W, H, dark); g.restore(); }
    requestAnimationFrame(step);
  };
  const tick = () => {
    for (const p of P) {
      if (f < (p.delay || 0) || p.dead) continue;
      p.age++;
      if (p.age > p.life) { p.dead = true; continue; }
      p.vy += p.g || 0; if (p.drag) { p.vx *= p.drag; p.vy *= p.drag; }
      if (p.term && p.vy > p.term) p.vy += (p.term - p.vy) * 0.12;
      const ph = p.age * (p.swf || 0.05) + p.ph0;
      let sw = p.sway || 0; if (p.fsw && p.term) sw += p.fsw * Math.max(0, Math.min(1, p.vy / p.term));
      p.dx = sw ? Math.sin(ph) * sw : 0;
      p.x += p.vx + p.dx; p.y += p.vy;
      if (p.rock) p.rot = p.rot0 + Math.cos(ph) * p.rock; else p.rot += p.vr || 0;
      if (p.fsw && p.term && !p.rock && p.vy > 0) p.vr *= 0.97;
      if (p.bounce && p.y > H - p.size * scale && p.vy > 0) { p.y = H - p.size * scale; p.vy *= -0.62; p.vx *= 0.9; }
      if (p.y > H + 80 || p.y < -H || p.x < -W * 0.6 || p.x > W * 1.6) p.dead = true;
    }
    f++;
  };
  requestAnimationFrame(t => { last = t; requestAnimationFrame(step); });
}

FX_SHAPES.fish = {d: "M10 0C6 -5.5 -3 -5.5 -6 0C-3 5.5 6 5.5 10 0ZM-5 0L-10.5 -4.5L-9.5 0L-10.5 4.5Z", detail: "M4 -1.2a1 1 0 1 0 2 0a1 1 0 1 0 -2 0", dfill: true};
FX_SHAPES.fallleaf = {d: "M0 -10.5C4.6 -8 7.2 -3.2 6.4 1.6C5.8 5.4 3.2 8.2 0.6 9.4L0.6 12.5L-0.6 12.5L-0.6 9.4C-3.2 8.2 -5.8 5.4 -6.4 1.6C-7.2 -3.2 -4.6 -8 0 -10.5Z", detail: "M0 -8.5L0 9M0 -3L3.4 -5.6M0 1L4 -1.6M0 -3L-3.4 -5.6M0 1L-4 -1.6", dstroke: true};
FX_SHAPES.oakleaf = {d: "M0 -11C2 -10 3.4 -8.6 3 -7C5.2 -7.4 6.2 -5.6 5 -4C7.4 -3.8 7.6 -1.2 5.8 0C7.8 1 7 3.6 4.8 3.8C5.4 6 3.4 7.4 1.4 6.8L0.7 12.5L-0.7 12.5L-1.4 6.8C-3.4 7.4 -5.4 6 -4.8 3.8C-7 3.6 -7.8 1 -5.8 0C-7.6 -1.2 -7.4 -3.8 -5 -4C-6.2 -5.6 -5.2 -7.4 -3 -7C-3.4 -8.6 -2 -10 0 -11Z", detail: "M0 -8.5L0 8", dstroke: true};
FX_SHAPES.sprinkle = {d: "M-7 -1.8H7A1.8 1.8 0 0 1 7 1.8H-7A1.8 1.8 0 0 1 -7 -1.8Z"};


/* Shapes for the hobby and holiday themes */
(() => {
  const c = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`, sh = fxShade;
  const P = s => new Path2D(s), fillP = (g, col, s) => { g.fillStyle = col; g.fill(P(s)); }, line = (g, col, w, s) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = g.lineJoin = "round"; g.stroke(P(s)); };
  const gloss = (g, s, k = 0.34) => { g.save(); g.clip(P(s)); const gr = g.createLinearGradient(-8, -10, 8, 10); gr.addColorStop(0, `rgba(255,255,255,${k})`); gr.addColorStop(0.45, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(0,0,0,.2)"); g.fillStyle = gr; g.fillRect(-13, -13, 26, 26); g.restore(); };
  // pixel art: one string per row, o outline, c color, s shade, h highlight, w white
  const pix = rows => (g, col) => { const h = rows.length, w = rows[0].length, u = 21 / Math.max(w, h), pal = {o: sh(col, 0.5), c: col, s: sh(col, 0.76), h: sh(col, 1.45), w: "#FFFFFF"};
    rows.forEach((r, y) => [...r].forEach((k, x) => { if (k === ".") return; g.fillStyle = pal[k]; g.fillRect((x - w / 2) * u - 0.04, (y - h / 2) * u - 0.04, u + 0.08, u + 0.08); })); };
  const egg = "M0 -10C5 -10 7.6 -1 7.6 3.2A7.6 7.2 0 0 1 -7.6 3.2C-7.6 -1 -5 -10 0 -10Z", heartD = "M0 9C-8 3.4 -10.4 -1.6 -9.2 -5.2C-8 -9 -2.4 -9.6 0 -5C2.4 -9.6 8 -9 9.2 -5.2C10.4 -1.6 8 3.4 0 9Z";
  const pumpkinD = "M0 -5.6C3.4 -8 8.6 -6.6 9.8 -1.6C11 3.6 8 9 3.2 9C1.6 9 0.6 8.4 0 8C-0.6 8.4 -1.6 9 -3.2 9C-8 9 -11 3.6 -9.8 -1.6C-8.6 -6.6 -3.4 -8 0 -5.6Z";
  const lanternD = "M-6.5 -7.5H6.5L8.6 -4C10.4 -0.5 10.4 2.5 8.6 5.6L6.5 7.5H-6.5L-8.6 5.6C-10.4 2.5 -10.4 -0.5 -8.6 -4Z";
  const cupD = "M-6.4 1.4H6.4L4.8 9.4H-4.8Z M-7.4 1.4C-8.4 -2.6 -4.6 -4.8 -2.4 -4.6C-2.2 -8.4 2.6 -9.6 3.4 -5.8C6.4 -6.6 8.6 -2.6 7.4 1.4Z";
  // paint splats: a wobbly blob with a few flung drops
  const splat = seed => { let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const pts = [];
    for (let i = 0; i < 22; i++) { const a = i / 22 * 6.283, r = 6.2 + 1.3 * Math.sin(3 * a + seed) + 0.8 * Math.sin(5 * a + 2 * seed) + (rnd() < 0.22 ? 2.6 : 0); pts.push(`${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`); }
    let d = "M" + pts.join("L") + "Z"; for (let i = 0; i < 4; i++) { const a = rnd() * 6.283, r = 9 + rnd() * 2.4; d += c(+(Math.cos(a) * r).toFixed(2), +(Math.sin(a) * r).toFixed(2), +(0.8 + rnd() * 0.9).toFixed(2)); } return d; };
  Object.assign(FX_SHAPES, {
    note: {d: "M-6.2 6.4C-6.8 4.4 -4.6 2.4 -1.8 2.2C0 2.1 1 2.6 1.4 3.2V-9.6H3V-9.4C3.4 -6.4 7.6 -5.6 7.2 -1.6C6.8 -3.6 5 -5 3 -5.2V5.4C3 7.6 0.6 9.2 -2.2 9.2C-4.2 9.2 -5.8 8.2 -6.2 6.4Z"},
    note2: {d: "M-9.4 6.4a3.4 2.5 -20 1 0 6.8 0a3.4 2.5 -20 1 0 -6.8 0Z M2.6 4.4a3.4 2.5 -20 1 0 6.8 0a3.4 2.5 -20 1 0 -6.8 0Z M-4.1 6H-2.6V-5.4L7.9 -8.2V4H9.4V-10.4L-4.1 -6.8Z"},
    paw: {d: c(0, 3.6, 4.6) + c(-5.6, -2.4, 2.3) + c(-2, -6.2, 2.3) + c(2, -6.2, 2.3) + c(5.6, -2.4, 2.3)},
    yarn: {d: c(0, 0, 9), detail: "M-8 -3C-3 -6 3 -6 8 -3M-8.6 1.5C-3 -2 3 -2 8.6 1.5M-6 6.5C-2 3 2 3 6 6.5M-3 -8.4C2 -4 3 3 1 8.8", dstroke: true,
      paint: (g, col) => { fillP(g, col, c(0, 0, 9)); g.save(); g.clip(P(c(0, 0, 9)));
        for (let i = -3; i <= 3; i++) line(g, sh(col, 0.72), 0.8, `M-10 ${i * 2.6 - 3}Q0 ${i * 2.6 + 3} 10 ${i * 2.6 - 4}`);
        for (let i = -2; i <= 2; i++) line(g, sh(col, 1.28), 0.7, `M${i * 3 - 2} -10Q${i * 3 + 4} 0 ${i * 3 - 1} 10`); g.restore(); gloss(g, c(0, 0, 9), 0.3); line(g, sh(col, 0.8), 0.9, "M6.4 6.4Q9 9.4 11.6 8.6"); }},
    pixel: {d: "M-6 -6H6V6H-6Z"},
    coin: {d: c(0, 0, 9), detail: c(0, 0, 6.2), dstroke: true,
      paint: (g, col) => { fillP(g, sh(col, 0.72), c(0.5, 0.6, 9)); fillP(g, col, c(0, 0, 9)); line(g, sh(col, 0.74), 1, c(0, 0, 6.4)); line(g, sh(col, 1.3), 1.2, "M-2 -4.6V4.6M2 -4.6V4.6"); gloss(g, c(0, 0, 9), 0.45); }},
    pcoin: {d: c(0, 0, 9), paint: pix(["..oooo..", ".ohhcco.", "ohcwcsco", "ohcwcsco", "occwcsco", "occcssco", ".occsso.", "..oooo.."])},
    pheart: {d: heartD, paint: pix([".oo...oo.", "ohco.occo", "ohcccccso", "occccccso", ".occccso.", "..occso..", "...oso...", "....o...."])},
    pstar: {d: "M0 -10L2.9 -4L9.5 -3.1L4.7 1.5L5.9 8.1L0 5L-5.9 8.1L-4.7 1.5L-9.5 -3.1L-2.9 -4Z", paint: pix(["....o....", "...oco...", "...ohco..", "ooochccoo", "ohcccccso", ".occccso.", "..occcso.", ".occoocso", ".ooo..ooo"])},
    pgem: {d: "M-8 -3L-4 -8H4L8 -3L0 9Z", paint: pix([".oooooo.", "ohwccsso", "oooooooo", ".ohccso.", "..ohso..", "...oo..."])},
    gem: {d: "M-8 -3L-4 -8H4L8 -3L0 9Z", detail: "M-8 -3H8M-4 -8L-1.6 -3L0 9M4 -8L1.6 -3", dstroke: true},
    clover: {d: "M0 -1C-2.5 -9 -9.5 -7 -6.5 -2.4C-9.8 -4 -11 2.8 -4.6 2.6C-8 5.4 -2 8.2 -0.6 2.6L-1.2 10H1.2L0.6 2.6C2 8.2 8 5.4 4.6 2.6C11 2.8 9.8 -4 6.5 -2.4C9.5 -7 2.5 -9 0 -1Z"},
    egg: {d: egg, detail: "M-7 1.2L-4.6 -1.4L-2.3 1.2L0 -1.4L2.3 1.2L4.6 -1.4L7 1.2", dstroke: true,
      paint: (g, col) => { fillP(g, col, egg); g.save(); g.clip(P(egg)); fillP(g, sh(col, 0.8), "M-9 -4.6H9V-3.2H-9Z"); line(g, "#FFFFFF", 1.5, "M-8 1.6L-5.4 -1.2L-2.7 1.6L0 -1.2L2.7 1.6L5.4 -1.2L8 1.6");
        [-5, -1.7, 1.7, 5].forEach((x, i) => fillP(g, i % 2 ? "#FFFFFF" : sh(col, 0.72), c(x, 5.2, 1))); fillP(g, sh(col, 0.72), c(0, -7, 1.1)); g.restore(); gloss(g, egg, 0.4); line(g, sh(col, 0.78), 0.5, egg); }},
    bat: {d: "M0 -2.2C0.8 -4.6 2 -4.4 2.4 -2.4C5 -5.4 9.4 -5.6 11.4 -3.2C9.4 -2.2 9 0 9.6 2.2C7.6 1 5.8 1.6 5.2 3.2C3.6 1.6 1.6 2.2 0 4.4C-1.6 2.2 -3.6 1.6 -5.2 3.2C-5.8 1.6 -7.6 1 -9.6 2.2C-9 0 -9.4 -2.2 -11.4 -3.2C-9.4 -5.6 -5 -5.4 -2.4 -2.4C-2 -4.4 -0.8 -4.6 0 -2.2Z"},
    pumpkin: {d: pumpkinD, detail: "M0 -5.2C-1.6 -1 -1.6 4 0 7.8M-4.6 -6.6C-7.2 -2 -7 4 -4.2 8.6M4.6 -6.6C7.2 -2 7 4 4.2 8.6M0 -5.6L1.4 -9.6", dstroke: true,
      paint: (g, col, dark) => { fillP(g, col, pumpkinD); line(g, sh(col, 0.78), 0.8, "M0 -5.2C-1.6 -1 -1.6 4 0 7.8M-4.6 -6.6C-7.2 -2 -7 4 -4.2 8.6M4.6 -6.6C7.2 -2 7 4 4.2 8.6"); gloss(g, pumpkinD, 0.3);
        line(g, "#5E7A2E", 1.6, "M0 -5.6Q0.4 -8.4 2 -9.8"); const face = dark ? "#FFD25A" : "#5A2A0C";
        fillP(g, face, "M-6 -0.6L-3.4 -3.4L-1.8 -0.2Z M6 -0.6L3.4 -3.4L1.8 -0.2Z M-6.4 2.6Q0 4.4 6.4 2.6Q5.6 6.8 0 7Q-5.6 6.8 -6.4 2.6Z"); fillP(g, col, "M-2.6 3.4H-1V5H-2.6Z M1 3.4H2.6V5H1Z"); }},
    lantern: {d: lanternD, detail: "M-3 -7.5C-4.6 -2.5 -4.6 2.5 -3 7.5M3 -7.5C4.6 -2.5 4.6 2.5 3 7.5M0 7.5V11.5M0 -7.5V-10.5", dstroke: true,
      paint: (g, col) => { line(g, "#C8962A", 0.7, "M0 -7.5V-11.6"); fillP(g, col, lanternD); g.save(); g.clip(P(lanternD)); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 9); gr.addColorStop(0, "rgba(255,214,120,.75)"); gr.addColorStop(1, "rgba(255,214,120,0)"); g.fillStyle = gr; g.fillRect(-11, -9, 22, 18); g.restore();
        line(g, sh(col, 0.66), 0.7, "M-3.4 -7.5C-5.2 -2.5 -5.2 2.5 -3.4 7.5M3.4 -7.5C5.2 -2.5 5.2 2.5 3.4 7.5M0 -7.5V7.5"); fillP(g, "#E8B83A", "M-6.8 -9H6.8V-7H-6.8Z M-6.8 7H6.8V9H-6.8Z"); line(g, "#E8B83A", 0.8, "M-1 9V12.6M0 9V13M1 9V12.6"); gloss(g, lanternD, 0.25); }},
    stardavid: {d: "M0 -9.6L8.3 4.8H-8.3ZM0 9.6L8.3 -4.8H-8.3Z", stroke: true, lw: 1.7},
    dreidel: {d: "M-5.4 -5H5.4V3.2L0 9.4L-5.4 3.2Z M-1.1 -5V-9.4H1.1V-5Z",
      paint: (g, col) => { fillP(g, sh(col, 0.8), "M-1.1 -5V-9.4H1.1V-5Z"); fillP(g, col, "M-5.4 -5H0V9.4L-5.4 3.2Z"); fillP(g, sh(col, 0.74), "M0 -5H5.4V3.2L0 9.4Z"); fillP(g, sh(col, 1.3), "M-5.4 -5L-3.8 -6.6H3.8L5.4 -5Z"); line(g, "#F2D27A", 1, "M-3.6 -2.4H-1.6V3M3 -2.6Q1.2 -2.6 1.6 0.4"); }},
    confetti: {d: "M-5 -1.8H5V1.8H-5Z"},
    flame: {d: "M0 -10.4C3.4 -5.4 6 -2.2 6 2.4A6 6.4 0 0 1 -6 2.4C-6 -1.4 -2.2 -3.6 0 -10.4Z", detail: "M0 -2.6C1.6 0 2.6 1.4 2.6 3.2A2.6 2.6 0 0 1 -2.6 3.2C-2.6 1.4 -1.2 0.4 0 -2.6Z", dfill: true},
    acorn: {d: "M-6.6 -2.4C-6.6 -6.8 6.6 -6.8 6.6 -2.4ZM-5.4 -2.4C-5.4 3.6 -2.2 8 0 9.4C2.2 8 5.4 3.6 5.4 -2.4ZM-0.8 -6.6V-9.4H0.8V-6.6Z",
      paint: (g, col) => { const nut = "M-5.4 -2.6C-5.4 3.6 -2.2 8 0 9.4C2.2 8 5.4 3.6 5.4 -2.6Z", cap = "M-6.8 -2C-7 -7 7 -7 6.8 -2Q0 -0.6 -6.8 -2Z"; fillP(g, col, nut); gloss(g, nut, 0.4); line(g, "#5A3A1E", 1.4, "M0 -5.6Q0.4 -8.6 2 -9.6"); fillP(g, "#6E4424", cap);
        g.save(); g.clip(P(cap)); line(g, "#8E6238", 0.6, "M-7 -6L-2 -1M-3 -7L2 -1M1 -7L6 -1M-7 -2L-2 -7M-3 -1L2 -7M1 -1L6 -7"); g.restore(); }},
    cupcake: {d: cupD, detail: "M-2.6 1.6L-2 9.2M0.6 1.6V9.2M3.6 1.6L3 9.2", dstroke: true,
      paint: (g, col) => { const wrap = "M-6.4 1.4H6.4L4.8 9.4H-4.8Z", top = "M-7.4 1.8C-8.4 -2.2 -4.6 -4.4 -2.4 -4.2C-2.2 -8 2.6 -9.2 3.4 -5.4C6.4 -6.2 8.6 -2.2 7.4 1.8Z"; fillP(g, "#E3A15C", wrap); g.save(); g.clip(P(wrap)); line(g, "#C27C38", 0.9, "M-4 1L-3.2 10M-1.3 1L-0.9 10M1.3 1L0.9 10M4 1L3.2 10"); g.restore(); fillP(g, col, top); gloss(g, top, 0.42);
        line(g, sh(col, 1.25), 0.9, "M-5.4 -0.6C-2 -2.8 2 -2.8 5.6 -0.8"); [["#FF6FB5", -4, -1.8, 0.5], ["#6FD3FF", 2.6, -3.2, -0.6], ["#FFD86B", -0.6, -5.4, 1], ["#8EE4B8", 4.6, -0.6, 0.2]].forEach(([k, x, y, r]) => { g.save(); g.translate(x, y); g.rotate(r); g.fillStyle = k; g.fillRect(-1, -0.35, 2, 0.7); g.restore(); });
        fillP(g, "#D8344A", c(1, -8.2, 1.9)); line(g, "#5E7A2E", 0.6, "M1.2 -10Q1.8 -11.6 3.4 -12"); fillP(g, "rgba(255,255,255,.6)", c(0.4, -8.8, 0.55)); }},
    cookie: {d: c(0, 0, 9), paint: (g, col) => { const b = "M-9 0C-9 -5 -5 -9 0 -9C5.2 -9 9 -5 8.8 0.4C8.6 5.2 5 9 0 9C-5 9 -9 5 -9 0Z"; fillP(g, sh(col, 0.82), b); fillP(g, col, c(-0.3, -0.3, 7.6)); gloss(g, b, 0.3);
      [[-3.4, -3.6, 1.5], [2.6, -4.2, 1.2], [3.8, 1.8, 1.5], [-1.8, 3.6, 1.3], [-4.8, 1, 1], [0.6, 0, 1.1]].forEach(([x, y, r]) => fillP(g, "#4E2C18", c(x, y, r))); }},
    camera: {d: "M-9.6 -4.4H-4.4L-2.4 -7.4H2.4L4.4 -4.4H9.6V7.4H-9.6Z", detail: c(0, 1.4, 3.8), dstroke: true},
    book: {d: "M-9 -6.4H9V6.4H-9Z", detail: "M0 -6.4V6.4M-7 -3.6H-2M-7 -0.6H-2M2 -3.6H7M2 -0.6H7", dstroke: true},
    // an open book seen from the front; flapping it (scaled on x) reads as a book flying like a bird
    flybook: {d: "M0 -4L-10.5 -7.5V4.5L0 8ZM0 -4L10.5 -7.5V4.5L0 8Z",
      paint: (g, col) => { fillP(g, col, "M0 -2.6L-11.6 -6.6V6L0 10L11.6 6V-6.6Z"); fillP(g, "#FFFCF2", "M0 -3.6L-10.4 -7.4V4.6L0 8.2Z"); fillP(g, "#F1EADA", "M0 -3.6L10.4 -7.4V4.6L0 8.2Z");
        line(g, "rgba(90,80,70,.5)", 0.55, "M-8.6 -4.4L-2 -2.2M-8.6 -2L-2 0.2M-8.6 0.4L-2 2.6M-8.6 2.8L-4.6 4.2M2 -2.2L8.6 -4.4M2 0.2L8.6 -2M2 2.6L8.6 0.4M2 5L6 3.6"); line(g, sh(col, 0.7), 0.7, "M0 -3.6V8.2"); }},
    print: {d: "M-8.6 -10H8.6V10.6H-8.6Z",
      paint: (g, col, dark) => { g.fillStyle = "rgba(40,30,20,.22)"; g.fillRect(-7.9, -9.1, 17.4, 20.6); g.fillStyle = dark ? "#F3EEE4" : "#FFFFFF"; g.fillRect(-8.6, -10, 17.2, 20.6); g.strokeStyle = "rgba(70,60,50,.3)"; g.lineWidth = 0.5; g.strokeRect(-8.6, -10, 17.2, 20.6);
        g.save(); g.beginPath(); g.rect(-7, -8.4, 14, 12.8); g.clip(); const gr = g.createLinearGradient(0, -8.4, 0, 4.4); gr.addColorStop(0, sh(col, 1.3)); gr.addColorStop(1, col); g.fillStyle = gr; g.fillRect(-7, -8.4, 14, 12.8);
        fillP(g, "#FFF4C8", c(3, -4.4, 2.1)); fillP(g, sh(col, 0.66), "M-7 4.4V0.2Q-3 -3.6 1 0.6Q4 -1.6 7 0.8V4.4Z"); fillP(g, sh(col, 0.48), "M-7 4.4V2.6Q-1 0.6 7 3.4V4.4Z"); g.restore(); }},
    heart: {d: heartD, paint: (g, col) => { fillP(g, col, heartD); gloss(g, heartD, 0.36); fillP(g, "rgba(255,255,255,.55)", "M-6.6 -5.4C-6 -7.2 -3.8 -7.4 -2.8 -6.2C-4.2 -6.4 -5.6 -5.8 -6.6 -5.4Z"); }},
    flower: {d: c(0, -5, 3.6) + c(4.8, -1.5, 3.6) + c(3, 4, 3.6) + c(-3, 4, 3.6) + c(-4.8, -1.5, 3.6), detail: c(0, 0, 2.6), dfill: true},
    bloom: {d: c(0, -5, 3.6) + c(4.8, -1.5, 3.6) + c(3, 4, 3.6) + c(-3, 4, 3.6) + c(-4.8, -1.5, 3.6),
      paint: (g, col) => { for (let i = 0; i < 6; i++) { g.save(); g.rotate(i / 6 * 6.283); fillP(g, col, "M0 0C-4.6 -2.4 -4.4 -9.4 0 -10.4C4.4 -9.4 4.6 -2.4 0 0Z"); line(g, sh(col, 0.78), 0.5, "M0 -2V-8"); g.restore(); }
        for (let i = 0; i < 6; i++) { g.save(); g.rotate((i + 0.5) / 6 * 6.283); fillP(g, sh(col, 1.25), "M0 0C-2.6 -1.6 -2.6 -6 0 -6.6C2.6 -6 2.6 -1.6 0 0Z"); g.restore(); } fillP(g, "#F2B32A", c(0, 0, 2.8)); fillP(g, "#C97E12", c(0.6, 0.6, 1.2)); }},
    marigold: {d: c(0, 0, 9), paint: (g, col) => { for (let r = 0; r < 3; r++) for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283 + r * 0.26, R = 7.4 - r * 2.2; fillP(g, sh(col, 1 - r * 0.1 + (i % 2) * 0.08), c(+(Math.cos(a) * R).toFixed(2), +(Math.sin(a) * R).toFixed(2), 2.6 - r * 0.35)); } fillP(g, sh(col, 0.6), c(0, 0, 1.4)); }},
    // bee and bunny face +x
    bee: {d: "M-7 0C-7 -4.4 5.4 -4.4 6.6 0C5.4 4.4 -7 4.4 -7 0Z",
      paint: (g) => { fillP(g, "rgba(225,240,255,.85)", "M-1 -2.4C-5 -10 2 -11 1.6 -2.6Z M1.4 -2.2C3 -9 8 -7.6 3.2 -1.8Z"); const b = "M-7 0.6C-7 -4 5.4 -4 6.6 0.6C5.4 5 -7 5 -7 0.6Z"; fillP(g, "#F6C340", b); g.save(); g.clip(P(b)); fillP(g, "#3A2A1A", "M-4.6 -5H-2.6V6H-4.6Z M-0.4 -5H1.6V6H-0.4Z"); g.restore();
        fillP(g, "#3A2A1A", c(6, 0.4, 2.4)); fillP(g, "#3A2A1A", "M-7 0.2L-9.6 0.8L-7 1.6Z"); gloss(g, b, 0.35); fillP(g, "#FFFFFF", c(6.8, -0.4, 0.6)); }},
    bunny: {d: "M-9 3a7 5.5 0 1 0 14 0a7 5.5 0 1 0 -14 0Z" + c(5.4, -1.6, 3.6) + "M3.6 -4C2.4 -9.4 3.4 -12 4.8 -11.4C6 -10.8 6.2 -8 5.6 -4.4Z",
      paint: (g, col, dark) => { const ear = "M3.4 -3.6C2 -9.4 3.2 -12.2 4.8 -11.6C6.2 -11 6.4 -8 5.8 -4Z", ear2 = "M5.2 -3.8C5.4 -9.6 7.4 -11.8 8.6 -10.8C9.8 -9.8 8.4 -7 7 -3.4Z", body = "M-9 3a7 5.6 0 1 0 14 0a7 5.6 0 1 0 -14 0Z";
        fillP(g, sh(col, 0.86), ear2); fillP(g, "#F2A6B8", "M6.2 -4.6C6.6 -8.6 7.6 -10 8.2 -9.6C8.8 -9 8 -7 6.8 -4.4Z"); fillP(g, col, body); fillP(g, col, ear); fillP(g, "#F2A6B8", "M4.2 -4.4C3.4 -8.8 4.2 -10.6 4.9 -10.3C5.6 -9.9 5.6 -7.6 5.2 -4.6Z"); fillP(g, col, c(5.4, -1.4, 3.7));
        fillP(g, sh(col, 0.86), "M-4 7.4C-2.6 9.6 2.6 9.6 3.6 8C2 7 -2 6.6 -4 7.4Z"); fillP(g, dark ? "#FFFFFF" : sh(col, 1.25), c(-9.2, 1.6, 2.3)); gloss(g, body, 0.3); fillP(g, "#2A2024", c(6.6, -2.2, 0.75)); fillP(g, "#F2A6B8", c(8.9, -0.9, 0.6)); }}
  });
  [1, 2, 3].forEach(i => { FX_SHAPES["splat" + i] = {d: splat(i * 7919)}; });
})();


/* Completion animations for the hobby and holiday themes. Small helpers first. */
const hbSc = (W, H) => 1.6 * Math.max(0.8, Math.min(1.6, Math.sqrt(W * H) / 900));
const hbBack = t => t <= 0 ? 0 : t >= 1 ? 1 : 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
// draws one cached sprite at (x, y), s pixels per shape unit
const hbStamp = (g, shape, col, d, x, y, s, rot, mx, glow) => { const spr = fxSprite(shape, col, glow, d), h = spr._half; g.save(); g.translate(x, y); if (rot) g.rotate(rot); g.scale(s * (mx || 1), s); g.drawImage(spr, -h, -h, 2 * h, 2 * h); g.restore(); };
// per-play state for draw()/over(): rebuilt when a new play starts (frame count goes back) or the screen changes
const hbRun = init => { let st = null; return (W, H, d, f) => { if (!st || f < st.f0 || st.W !== W || st.H !== H || st.d !== d) { st = init(W, H, d); Object.assign(st, {W, H, d}); } st.f0 = f; return st; }; };
// a small candle flame with a warm glow, (x, y) is its base
const hbFlame = (g, x, y, s, fl) => { g.save(); g.translate(x, y); g.scale(s * (1 - fl * 0.06), s * (1 + fl * 0.1)); g.shadowBlur = 14 * s; g.shadowColor = "rgba(255,170,40,.9)"; g.fillStyle = "#FFB347";
  g.beginPath(); g.moveTo(0, -11); g.bezierCurveTo(3 + fl * 0.6, -6, 4.6, -3, 4.6, 0); g.arc(0, 0, 4.6, 0, Math.PI); g.bezierCurveTo(-4.6, -3, -3 + fl * 0.6, -6, 0, -11); g.fill(); g.shadowBlur = 0;
  g.fillStyle = "#FFF3C2"; g.beginPath(); g.moveTo(0, -5.6); g.bezierCurveTo(1.8, -3, 2.4, -1.6, 2.4, 0.2); g.arc(0, 0.2, 2.4, 0, Math.PI); g.bezierCurveTo(-2.4, -1.6, -1.8, -3, 0, -5.6); g.fill(); g.restore(); };

/* Fireworks: shells climb on a sparking trail and burst. Every star's path (drag + gravity) is worked out once per play
   so it can be read at any frame, and drawn as a short curved trail that burns out where the star dies.
   Kinds: peony (fat stars, a pistil core), chrys (long trails), willow / crown (gold, hang and droop with glitter dust),
   ring, palm (thick comet arms), cross (stars split in four), multi (bursts, then every star bursts again),
   glitter (stars that twinkle and crackle). Stars change color as they fall. Each burst lights the sky with a soft bloom.
   pal(dark) gives the colors; o: show (a whole show in waves building to a finale, then a gold shower), shells, t0, gap,
   ymin, ymax, size, types, gold [light, dark], glit [light, dark]. */
const FW_KIND = {
  peony: {n: 72, r: 1, dr: 0.95, g: 1, tl: 8, L: 100, w: 1.3, pis: 1},
  chrys: {n: 84, r: 1.1, dr: 0.955, g: 0.9, tl: 22, L: 115, w: 0.95},
  willow: {n: 56, r: 1.02, dr: 0.962, g: 0.9, tl: 50, L: 160, w: 0.72, gold: 1, dust: 1},
  crown: {n: 66, r: 1.12, dr: 0.966, g: 1, tl: 40, L: 165, w: 0.9, gold: 1, dust: 1, up: 0.26},
  ring: {n: 46, r: 0.95, dr: 0.95, g: 0.9, tl: 10, L: 100, w: 1.15, ring: 1},
  palm: {n: 11, r: 0.95, dr: 0.972, g: 1.5, tl: 30, L: 92, w: 1.9, gold: 1, dust: 1, up: 0.3, fix: 1},
  cross: {n: 22, r: 0.62, dr: 0.955, g: 0.8, tl: 11, L: 30, w: 1.3, split: 1},
  multi: {n: 7, r: 0.55, dr: 0.95, g: 0.6, tl: 12, L: 26, w: 1.8, split: 2, fix: 1},
  glitter: {n: 64, r: 1, dr: 0.952, g: 1.1, tl: 7, L: 125, w: 0.8, glit: 1}
};
// the full show: [burst frame, kind, x, y, size, color, second color]
const FW_SHOW = [[40, "peony", 0.28, 0.32, 1, 0, 1], [60, "chrys", 0.72, 0.27, 1.05, 2, 3], [82, "ring", 0.5, 0.22, 0.9, 1, 5],
  [102, "palm", 0.2, 0.34, 1, 0, 1], [112, "cross", 0.8, 0.3, 1, 3, 2], [124, "glitter", 0.42, 0.2, 0.95, 0, 0], [136, "multi", 0.62, 0.34, 1, 5, 2], [148, "willow", 0.3, 0.22, 0.9, 0, 0],
  [170, "chrys", 0.14, 0.3, 1.05, 1, 2], [173, "chrys", 0.86, 0.3, 1.05, 3, 4], [178, "glitter", 0.36, 0.25, 1.05, 0, 0], [181, "peony", 0.64, 0.23, 1.1, 2, 1],
  [186, "ring", 0.5, 0.36, 1, 4, 3], [190, "multi", 0.24, 0.2, 0.85, 1, 5], [194, "crown", 0.5, 0.2, 1.3, 0, 0], [199, "willow", 0.18, 0.17, 1, 0, 0], [202, "willow", 0.82, 0.17, 1, 0, 0]];
const fxFirework = (pal, o = {}) => {
  const BLOOM = new Map(), bloom = c => { let cv = BLOOM.get(c); if (cv) return cv; cv = document.createElement("canvas"); cv.width = cv.height = 96; const b = cv.getContext("2d"), gr = b.createRadialGradient(48, 48, 0, 48, 48, 48);
    gr.addColorStop(0, c); gr.addColorStop(0.3, c + "88"); gr.addColorStop(1, c + "00"); b.fillStyle = gr; b.fillRect(0, 0, 96, 96); BLOOM.set(c, cv); return cv; };
  // where a star is u frames after it set off
  const at = (b, sp, u) => { const A = b.dr * (1 - Math.pow(b.dr, u)) / (1 - b.dr); return [sp.x0 + sp.vx * A + b.wind * u, sp.y0 + b.vt * u + (sp.vy - b.vt) * A]; };
  const S = hbRun((W, H, d) => {
    const k = Math.max(0.6, Math.min(1.5, Math.min(W, H) / 650)), A = Math.max(0.65, Math.min(1.2, Math.sqrt(W * H) / 900)), cols = pal(d), CL = cols.length, wind = fxR(-0.1, 0.1) * k,
      gold = (o.gold || ["#B87A0A", "#FFC861"])[d ? 1 : 0], glit = (o.glit || ["#A8740A", "#FFF1C4"])[d ? 1 : 0], tall = H > W * 1.25, Rb = Math.min(W * (tall ? 0.42 : 0.33), H * 0.36) * (o.size || 1);
    let prog = d ? FW_SHOW : FW_SHOW.filter(e => e[1] !== "cross" && e[1] !== "multi" && e[0] !== 124);   // light mode: fewer, bigger, denser bursts
    if (!o.show) { const N = o.shells || 7, types = o.types || ["peony", "willow", "ring", "peony", "glitter", "peony", "ring"], slots = Array.from({length: N}, (_, i) => (i + 0.5) / N).sort(() => Math.random() - 0.5);
      prog = slots.map((sx, i) => [Math.round((o.t0 || 4) + i * (o.gap || 19) + 40 + fxR(-3, 3)), types[i % types.length], 0.08 + 0.84 * sx, fxR(o.ymin || 0.16, o.ymax || 0.4), 0.72, i, i + 2]); }
    const B = [], RK = [], BL = [], mkB = (tb, kd, extra) => Object.assign({tb, dr: kd.dr, gy: 0.045 * k * kd.g, tl: kd.tl, w: kd.w, glit: kd.glit, dust: kd.dust, wind, sp: []}, extra);
    const fin = b => { b.vt = b.gy / (1 - b.dr); b.cs = [...new Set(b.sp.flatMap(p => [p.c1, p.c2]))]; b.sp.forEach(p => { p.i1 = b.cs.indexOf(p.c1); p.i2 = b.cs.indexOf(p.c2); });
      b.L = Math.max(...b.sp.map(p => p.t0 + p.end)) + b.tl; b.pt = new Float32Array(b.sp.length * 26); b.bc = new Uint8Array(b.sp.length * 6); b.ok = new Uint8Array(b.sp.length); B.push(b); return b; };
    const ball = (m, ph) => Array.from({length: m}, (_, i) => { const z = 1 - 2 * (i + 0.5) / m, rr = Math.sqrt(1 - z * z), a = ph + i * 2.39996; return [Math.cos(a) * rr, Math.sin(a) * rr, rr]; });
    prog.forEach(([tb, ty, fx, fy, sz, i1, i2]) => {
      const kd = FW_KIND[ty] || FW_KIND.peony, x = W * (fx + fxR(-0.02, 0.02)), y = H * ((tall ? 0.08 + fy * 1.2 : fy) + fxR(-0.02, 0.02)), R = Rb * kd.r * sz * fxR(0.92, 1.06) * (d ? 1 : 1.08), v = R * (1 - kd.dr) / kd.dr,
        c1 = kd.gold ? gold : kd.glit ? glit : cols[i1 % CL], c2 = !d ? c1 : ty === "palm" ? cols[i1 % CL] : kd.gold ? gold : kd.glit ? glit : cols[i2 % CL], c3 = cols[(i2 + 1) % CL], T = Math.round(Math.min(tb, fxR(38, 50)));
      RK.push({t0: tb - T, T, xs: x + fxR(-0.05, 0.05) * W, x, y, th: ty === "palm" ? 1.9 : 1, wob: fxR(0, 6.3)});
      BL.push({t: tb, x, y, R: R * 1.45, c: kd.glit ? gold : c1, a: kd.split ? 0.7 : 1});
      const b = mkB(tb, kd, {x, y, w: kd.w * (d || !kd.fix ? 1 : 0.6), tl: Math.round(kd.tl * (d ? 1 : 1.6))}), m = kd.fix ? kd.n : Math.round(kd.n * A * (d ? 1 : 1.1)), ph = fxR(0, 6.3), tilt = fxR(0, 6.3), sq = fxR(0.3, 0.5);
      const dirs = kd.ring ? Array.from({length: m}, (_, i) => { const a = i / m * 6.283, rx = Math.cos(a), ry = Math.sin(a) * sq; return [rx * Math.cos(tilt) - ry * Math.sin(tilt), rx * Math.sin(tilt) + ry * Math.cos(tilt), 1]; })
        : kd.fix ? Array.from({length: m}, (_, i) => [Math.cos(ph + i / m * 6.283), Math.sin(ph + i / m * 6.283), 1]) : ball(m, ph);
      if (kd.ring) for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; dirs.push([Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0.3]); }
      dirs.forEach(([dx, dy, rr], i) => { const s = v * fxR(0.94, 1.04), core = (kd.pis || kd.ring) && rr < 0.5;
        b.sp.push({x0: x, y0: y, t0: 0, vx: dx * s, vy: dy * s - (kd.up || 0) * v, c1: core ? c3 : c1, c2: core ? c3 : c2, tc: kd.L * fxR(0.36, 0.5), end: kd.split ? kd.L : kd.L * fxR(0.72, 1), h: i * 7 % 23}); });
      fin(b);
      if (kd.split === 1) { // crossette: every star splits into four that fly apart in a cross
        const kb = mkB(tb, {dr: 0.95, g: 0.9, tl: 10, w: 1.05}); b.sp.forEach((p, i) => { const [px, py] = at(b, p, p.end), a0 = Math.atan2(p.vy, p.vx) + 0.785, vk = R * 0.34 * 0.05 / 0.95;
          for (let q = 0; q < 4; q++) kb.sp.push({x0: px, y0: py, t0: p.end, vx: Math.cos(a0 + q * 1.571) * vk, vy: Math.sin(a0 + q * 1.571) * vk, c1: c2, c2: q % 2 ? c2 : c1, tc: 26, end: fxR(40, 56), h: (i * 4 + q) * 7 % 23}); }); fin(kb); }
      if (kd.split === 2) { // multi-break: each comet bursts again into its own little peony
        const kb = mkB(tb, {dr: 0.95, g: 0.9, tl: 9, w: 1.15}), mm = Math.max(10, Math.round(15 * A)); b.sp.forEach((p, i) => { const [px, py] = at(b, p, p.end), t0 = p.end + i * 2, c = i % 2 ? c2 : c3, vk = R * 0.42 * 0.05 / 0.95;
          ball(mm, fxR(0, 6.3)).forEach(([dx, dy], j) => kb.sp.push({x0: px, y0: py, t0, vx: dx * vk * fxR(0.92, 1.05), vy: dy * vk, c1: c, c2: c, tc: 99, end: fxR(52, 72), h: (i * mm + j) * 7 % 23}));
          BL.push({t: tb + t0, x: px, y: py, R: R * 0.55, c, a: 0.55}); }); fin(kb); }
    });
    const SH = o.show ? Array.from({length: Math.round(54 * A)}, () => ({t0: Math.round(fxR(188, 245)), x: fxR(0.04, 0.96) * W, y: H * fxR(0.05, 0.42), vy: fxR(0.35, 0.75) * k, sw: fxR(4, 10) * k, ph: fxR(0, 6.3), L: fxR(70, 100), s: fxR(0.55, 0.95) * k})) : [];
    return {k, B, RK, BL, SH, gold, glit, bud: W < 600 ? 800 : 1500};
  });
  return (g, f, W, H, d) => {
    const s = S(W, H, d, f), k = s.k, lw = Math.max(1.3, 1.9 * k) * (d ? 1 : 1.3), lift = d ? 1 : 1.1, flick = (h, j) => ((Math.floor(f / 3) + h + j * 3) % 5) < 2, rd = (x, y, r) => { g.moveTo(x + r, y); g.arc(x, y, r, 0, 6.283); };
    g.lineCap = g.lineJoin = "round"; if (d) g.globalCompositeOperation = "lighter";
    // soft colored bloom behind each burst (all together never past ~0.3)
    let tot = 0; for (const bl of s.BL) { const t = f - bl.t; bl.e = t < 0 || t > 140 ? 0 : Math.min(1, t / 4) * Math.exp(-t / 30) * bl.a; tot += bl.e; }
    const ba = (d ? 0.2 : 0.11) * (tot > 1.5 ? 1.5 / tot : 1);
    for (const bl of s.BL) { if (bl.e < 0.01) continue; g.globalAlpha = bl.e * ba; g.drawImage(bloom(bl.c), bl.x - bl.R, bl.y - bl.R, 2 * bl.R, 2 * bl.R);
      const t = f - bl.t; if (d && t < 10) { const r = bl.R * 0.22; g.globalAlpha = (1 - t / 10) * 0.6 * bl.a; g.drawImage(bloom("#FFFFFF"), bl.x - r, bl.y - r, 2 * r, 2 * r); } }
    // rockets climbing on a short tail that tapers away (sparks drop off it at night)
    const rp = (r, u) => { const e = 1 - Math.pow(1 - Math.max(0, u) / r.T, 2); return [r.xs + (r.x - r.xs) * e + Math.sin(u * 0.3 + r.wob) * 0.8 * k, H + 8 - (H + 8 - r.y) * e]; };
    for (const r of s.RK) { const u = f - r.t0; if (u < 0 || u >= r.T) continue; const w = lw * 0.9 * r.th, sl = d ? 4 : 3.5;
      g.strokeStyle = d ? "#FFE2B0" : s.gold; for (let j = 0; j < 4; j++) { const [x0, y0] = rp(r, u - j * sl), [x1, y1] = rp(r, u - (j + 1) * sl); g.globalAlpha = Math.pow(1 - j / 4, 1.5) * (d ? 0.85 : 0.7); g.lineWidth = w * (1 - j * 0.22); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
      if (d) { g.fillStyle = s.gold; for (let bt = Math.max(0, u - 24 - u % 3); bt <= u; bt += 3) { const a = u - bt, [ex, ey] = rp(r, bt), sx = ((bt * 7 + r.t0) % 5 - 2) * 0.25 * k; g.globalAlpha = (1 - a / 24) * 0.9; g.beginPath(); rd(ex + sx * a, ey + 0.03 * k * a * a, w * 0.5); g.fill(); } }
      const [hx, hy] = rp(r, u); g.globalAlpha = d ? 1 : 0.85; g.fillStyle = d ? "#FFFFFF" : s.gold; g.beginPath(); rd(hx, hy, w * (d ? 1.2 : 0.65)); g.fill(); }
    // stars: segments per star are set by how many stars are alive, to keep the frame light
    let act = 0; for (const b of s.B) { const t = f - b.tb; if (t >= 0 && t < b.L && !(b.glit && !d)) act += b.sp.length; }
    const SG = Math.max(d ? 1 : 3, Math.min(d ? 4 : 6, Math.floor(s.bud / Math.max(1, act)))), NP = 2 * SG + 1, f0 = d ? 0.62 : 0.32;
    for (const b of s.B) { const t = f - b.tb; if (t < 0 || t >= b.L) continue; const fa = 1 - fxEase((t - b.L * f0) / (b.L * (d ? 1 - f0 : 0.42))), pt = b.pt, sp = b.sp;
      for (let i = 0; i < sp.length; i++) { const p = sp[i], lt = t - p.t0, ue = Math.min(lt, p.end), us = Math.max(0, lt - b.tl); b.ok[i] = ue > 0 && us < ue ? 1 : 0; if (!b.ok[i]) continue;
        for (let j = 0; j < NP; j++) { const u = ue - (ue - us) * j / (NP - 1), A = b.dr * (1 - Math.pow(b.dr, u)) / (1 - b.dr); pt[i * 26 + 2 * j] = p.x0 + p.vx * A + b.wind * u; pt[i * 26 + 2 * j + 1] = p.y0 + b.vt * u + (p.vy - b.vt) * A; }
        for (let j = 0; j < SG; j++) b.bc[i * 6 + j] = ue - (ue - us) * (j + 0.5) / SG < p.tc ? p.i1 : p.i2; }
      // each trail: thick and solid at the head, thinning and fading to nothing at the tail
      if (!(b.glit && !d)) for (let j = 0; j < SG; j++) { g.lineWidth = lw * b.w * (d ? 1 - 0.45 * j / SG : 1 - 0.7 * j / SG); g.globalAlpha = Math.min(1, fa * lift * Math.pow(1 - j / SG, d ? 0.9 : 1.1) * (b.glit ? 0.55 : 1));
        for (let c = 0; c < b.cs.length; c++) { g.strokeStyle = b.cs[c]; g.beginPath(); let any = 0;
          for (let i = 0; i < sp.length; i++) { if (!b.ok[i] || b.bc[i * 6 + j] !== c) continue; const q = i * 26 + 4 * j, x0 = pt[q], y0 = pt[q + 1], x2 = pt[q + 4], y2 = pt[q + 5];
            g.moveTo(x0, y0); g.quadraticCurveTo(2 * pt[q + 2] - (x0 + x2) / 2, 2 * pt[q + 3] - (y0 + y2) / 2, x2, y2); any = 1; }
          if (any) g.stroke(); } }
      if (d && t < 34) { g.fillStyle = "#FFFFFF"; g.globalAlpha = fa * (1 - t / 34) * 0.9; const z = lw * b.w * 0.55; g.beginPath(); for (let i = 0; i < sp.length; i++) if (b.ok[i] && t - sp[i].t0 < 34) rd(pt[i * 26], pt[i * 26 + 1], z); g.fill(); }
      if (b.glit && t > (d ? 12 : 4)) { const z = lw * (d ? 0.85 : 0.75); g.fillStyle = d ? "#FFFFFF" : s.glit;   // glitter: round twinkles, then a soft crackle as they die
        for (const on of [1, 0]) { g.globalAlpha = fa * (on ? 1 : 0.3); g.beginPath();
          for (let i = 0; i < sp.length; i++) { const p = sp[i], lt = t - p.t0; if (lt > p.end + 10) continue; const q = i * 26;
            if (lt <= p.end) { if (+flick(p.h, 0) === on) rd(pt[q], pt[q + 1], z); if (d && on && flick(p.h, 1)) rd(pt[q + 4], pt[q + 5], z * 0.6); }
            if (on && lt > p.end - 6) for (let c = 0; c < 3; c++) { const a = p.h + c * 2.1, r = (5 + (p.h + c * 5) % 7) * k * Math.min(1, (lt - p.end + 6) / 6); if (flick(p.h, c + 2)) rd(pt[q] + Math.cos(a) * r, pt[q + 1] + Math.sin(a) * r, z * 0.6); } }
          g.fill(); } }
      if (d && b.dust && t > 8) { const z = lw * 0.4; g.fillStyle = s.glit; g.globalAlpha = fa * 0.85; g.beginPath();   // glitter dust sifting from gold trails
        for (let i = 0; i < sp.length; i += 2) { if (!b.ok[i]) continue; const q = i * 26; for (let j = 1; j <= 2; j++) { if (!flick(sp[i].h, j)) continue; const dt = j * (b.tl / 6), jj = Math.min(NP - 1, j * 2);
          rd(pt[q + 2 * jj] + ((sp[i].h % 5) - 2) * 0.4 * j, pt[q + 2 * jj + 1] + 0.012 * k * dt * dt, z); } } g.fill(); } }
    // a last gentle shower of gold sparkles drifting down as the show fades
    for (const p of s.SH) { const t = f - p.t0; if (t < 0 || t > p.L) continue; const x = p.x + Math.sin(t * 0.05 + p.ph) * p.sw, y = p.y + p.vy * t + 0.002 * k * t * t, a = Math.sin(Math.PI * t / p.L) * (0.65 + 0.35 * Math.sin(t * 0.2 + p.ph));
      g.globalAlpha = a * 0.4; g.strokeStyle = s.gold; g.lineWidth = lw * 0.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(t * 0.05 + p.ph) * p.sw * 0.25, y - 12 * k); g.stroke();
      g.globalAlpha = a; hbStamp(g, "sparkle", s.gold, d, x, y, p.s, 0, 1, d ? 6 : 0); }
  };
};

// Cats: two trails of paw prints walk across the screen, step by step
const hbPaws = (W, H, d, n) => { const sc = hbSc(W, H), size = 12, s = size * sc / 10, stride = 25 * s, out = [], cols = d ? ["#F4B39A", "#EBC6B4"] : ["#9A4E3A", "#B5654C"];
  [[[-0.04, 0.86], [1.04, 0.34], 0, 1], [[1.04, 0.95], [-0.04, 0.6], 34, -1]].forEach(([[x0, y0], [x1, y1], t0, bend]) => {
    const dx = (x1 - x0) * W, dy = (y1 - y0) * H, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, steps = Math.floor(L / stride), c = fxPick(cols);
    for (let i = 0; i <= steps; i++) { const u = i / steps, w = Math.sin(u * Math.PI * 2) * H * 0.07 * bend, side = i % 2 ? 1 : -1, tx = ux - uy * Math.cos(u * Math.PI * 2) * 0.4 * bend, ty = uy + ux * Math.cos(u * Math.PI * 2) * 0.4 * bend;
      out.push({shape: "paw", c, x: x0 * W + dx * u - uy * (w + side * 5 * s), y: y0 * H + dy * u + ux * (w + side * 5 * s), vx: 0, vy: 0, g: 0, size, rot: Math.atan2(ty, tx) + Math.PI / 2, vr: 0, sway: 0, life: 105, delay: Math.round(t0 + u * Math.min(130, steps * 7))}); } });
  return out; };

// Knitting: balls of yarn tumble across in loops, unwinding a curly thread behind them
const hbYarn = () => { const S = hbRun((W, H, d) => { const sc = hbSc(W, H), cols = ["#E07A8A", "#6FA8E0", "#E8B03A", "#8CC46E", "#B08AE0"].sort(() => Math.random() - 0.5);
    return {sc, balls: [[0.3, 1, 0], [0.66, -1, 36], [0.16, -1, 78]].slice(0, W > 700 ? 3 : 2).map(([y, dir, t0], i) => { const T = 175, v = W * 1.2 / T, w = 0.15, c = cols[i]; return {y0: H * y, dir, t0, T, v, w, L: 1.45 * v / w, dy: H * fxR(-0.0008, 0.0012), c, ph: fxR(0, 6.3)}; })}; });
  const pos = (b, W, t) => [(b.dir > 0 ? -0.1 * W : 1.1 * W) + b.dir * (b.v * t + b.L * Math.sin(b.w * t)), b.y0 + b.dy * t - b.L * 0.75 * Math.cos(b.w * t + 0.4)];
  return (g, f, W, H, d) => { const s = S(W, H, d, f), lw = Math.max(1.6, s.sc * 1.3); g.lineCap = g.lineJoin = "round";
    for (const b of s.balls) { const t = Math.min(b.T, f - b.t0); if (t <= 0) continue; g.globalAlpha = 0.9; g.strokeStyle = fxShade(b.c, d ? 1 : 0.86); g.lineWidth = lw; g.beginPath();
      for (let u = 0; u <= t; u += 1.5) { const [x, y] = pos(b, W, u); u ? g.lineTo(x, y) : g.moveTo(x, y); } const [x, y] = pos(b, W, t); g.lineTo(x, y); g.stroke();
      g.globalAlpha = 1; hbStamp(g, "yarn", b.c, d, x, y, s.sc * 1.7, b.dir * t * 0.09); } }; };

// Music: a staff draws itself across the screen in a wave and its notes lift off it
const hbStaffY = (x, f, W, H) => H * 0.6 + Math.sin(x / W * 5 + f * 0.016) * H * 0.07;
const hbStaff = (g, f, W, H, d) => { const a = fxEase(f / 20) * (1 - fxEase((f - 150) / 80)); if (a <= 0) return; const xr = (W + 60) * fxEase(f / 64) - 30, sp = Math.max(7, hbSc(W, H) * 5.4);
  g.strokeStyle = d ? "#C9B8FF" : "#6A4FC9"; g.lineWidth = Math.max(1.2, sp * 0.16); g.lineCap = "round"; g.globalAlpha = a * (d ? 0.55 : 0.45); g.beginPath();
  for (let l = -2; l <= 2; l++) for (let x = -30; x <= xr; x += 14) { const y = hbStaffY(x, f, W, H) + l * sp; x === -30 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); };
const hbNotes = (W, H, d, n) => { const m = n(30), sp = Math.max(7, hbSc(W, H) * 5.4), cols = d ? ["#C9B8FF", "#F6E7FF", "#8FB0FF", "#FF9FCF"] : ["#6A4FC9", "#8C6FF5", "#3D6AD6", "#C04E9A"];
  return Array.from({length: m}, (_, i) => { const x = W * (0.04 + 0.92 * (i + fxR(0.1, 0.9)) / m), t = Math.max(2, Math.round(Math.acos(1 - 2 * Math.min(1, (x + 30) / (W + 60))) / Math.PI * 64)), y = hbStaffY(x, t, W, H) + (Math.round(fxR(-4, 4)) / 2) * sp - 4 * sp * 0.4;
    return {shape: i % 3 ? "note" : "note2", c: fxPick(cols), x, y, vx: fxR(-0.2, 0.2), vy: -fxR(0.1, 0.4), g: -fxR(0.008, 0.016), size: fxR(11, 15), rot: fxR(-0.2, 0.2), rock: 0.22, sway: 0.7, swf: fxR(0.03, 0.05), life: Math.round(fxR(170, 200)), delay: t + 4}; }); };

// Painting: wide brush strokes swipe across, paint splats land on top
const hbBrush = () => { const S = hbRun((W, H, d) => { const k = Math.min(W, H), cols = d ? ["#FF6B5E", "#5C9BFF", "#FFC83D"] : ["#E0463C", "#3D7BE0", "#F2B32A"];
    return {strokes: [[0.24, 0.36, 0, 1], [0.78, 0.6, 22, -1], [0.5, 0.45, 46, 1]].map(([y0, y1, t0, dir], i) => ({y0: H * y0, y1: H * y1, t0, dir, c: cols[i], w: k * fxR(0.07, 0.09), br: Array.from({length: 13}, (_, j) => ({o: j / 12 - 0.5 + fxR(-0.03, 0.03), a: fxR(0.45, 0.95), e: fxR(0.86, 1), s: fxR(0.92, 1.05)}))}))}; });
  return (g, f, W, H, d) => { const s = S(W, H, d, f); g.lineCap = "round";
    for (const st of s.strokes) { const r = fxEase((f - st.t0) / 38); if (r <= 0) continue; const fade = 1 - fxEase((f - 150) / 90), lw = st.w / 13 * 2.1; g.strokeStyle = st.c; g.lineWidth = lw;
      for (const b of st.br) { g.globalAlpha = b.a * fade * 0.85; g.beginPath(); const end = r * b.e;
        for (let u = 0; u <= end + 0.001; u += 0.04) { const uu = Math.min(u, end), x = st.dir > 0 ? W * (-0.06 + 1.12 * uu) : W * (1.06 - 1.12 * uu), taper = 0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, uu * 1.4 + 0.15)), y = st.y0 + (st.y1 - st.y0) * uu + Math.sin(uu * 5 + st.t0) * H * 0.015 + b.o * st.w * taper * b.s; uu ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); } } }; };
const hbSplats = (W, H, d, n) => { const cols = ["#E0463C", "#3D7BE0", "#F2B32A", "#2E9E5B", "#A45CD6", "#F28A3A", "#E8508C"];
  return Array.from({length: n(16)}, (_, i) => ({shape: "splat" + (1 + i % 3), c: fxPick(cols), x: fxR(0.05, 0.95) * W, y: fxR(0.08, 0.92) * H, vx: 0, vy: 0, g: 0, size: fxR(12, 20), rot: fxR(0, 6.3), vr: 0, sway: 0, life: Math.round(fxR(150, 190)), delay: Math.round(20 + i * 7 + fxR(0, 6))})); };

// Gardening: stems grow up from the bottom, unfold leaves and open into flowers
const hbGarden = () => { const S = hbRun((W, H, d) => { const m = Math.max(4, Math.min(9, Math.round(W / 140))), cols = ["#F27AA8", "#F2B32A", "#B48CF0", "#F0805A", "#E8466E", "#6FA8E0"].sort(() => Math.random() - 0.5), ord = Array.from({length: m}, (_, i) => i).sort(() => Math.random() - 0.5);
    return {sc: hbSc(W, H), st: Array.from({length: m}, (_, i) => ({x: W * (i + 0.5) / m + fxR(-0.2, 0.2) * W / m, h: H * fxR(0.24, 0.46), b: fxR(-1, 1) * Math.min(W, H) * 0.06, t0: 4 + ord[i] * 9, c: cols[i % cols.length], ph: fxR(0, 6.3), sz: fxR(1.6, 2.1)}))}; });
  return (g, f, W, H, d) => { const s = S(W, H, d, f), lw = Math.max(2.2, s.sc * 1.7), stem = d ? "#6CC070" : "#3E8A3E", leaf = d ? "#5CB860" : "#3E9E4F"; g.lineCap = "round";
    for (const st of s.st) { const gr = fxEase((f - st.t0) / 56); if (gr <= 0) continue; const sw = Math.sin(f * 0.035 + st.ph) * s.sc * 3;
      const pt = u => [st.x + st.b * u * u + sw * u * u, H + 6 - st.h * u]; g.strokeStyle = stem; g.lineWidth = lw; g.globalAlpha = 1; g.beginPath();
      for (let u = 0; u <= gr + 0.001; u += 0.05) { const [x, y] = pt(Math.min(u, gr)); u ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      [[0.32, 1], [0.55, -1], [0.75, 1]].forEach(([u, side]) => { const lg = fxEase((gr - u) / 0.25); if (lg <= 0) return; const [x, y] = pt(u); hbStamp(g, "leaf", leaf, d, x, y, s.sc * 1.1 * lg, side * 1.05 + Math.sin(f * 0.04 + st.ph) * 0.08); });
      const bl = hbBack((f - st.t0 - 50) / 22); if (bl <= 0) continue; const [x, y] = pt(1); hbStamp(g, "bloom", st.c, d, x, y, s.sc * st.sz * bl, Math.sin(f * 0.03 + st.ph) * 0.2 + (1 - bl) * 1.5); } }; };
const hbBees = (W, H, d, n) => Array.from({length: n(3)}, (_, i) => { const l = i % 2 === 0; return {shape: "bee", c: "#F6C340", face: true, wig: 0.12, x: l ? -30 : W + 30, y: H * fxR(0.2, 0.55), vx: (l ? 1 : -1) * fxR(1.8, 2.8), vy: fxR(-0.35, 0.35), g: 0, size: fxR(14, 16), rot: 0, vr: 0, sway: 0.5, swf: 0.09, life: 260, delay: Math.round(30 + i * 30 + fxR(0, 20))}; });

// Photography: a camera iris snaps shut and open with a soft flash, then polaroids from a golden-hour walk drop onto a
// clothesline, get pegged and develop while they sway, with golden bokeh and a warm light leak behind
// a little painted scene in a w x h box: 0 sunset sea, 1 pine woods, 2 city at dusk, 3 beach, 4 mountain lake, 5 flower meadow, 6 balloons
const hbScene = (b, w, h, k) => {
  const lg = (y0, y1, ...c) => { const gr = b.createLinearGradient(0, y0 * h, 0, y1 * h); c.forEach((x, i) => gr.addColorStop(i / (c.length - 1), x)); return gr; };
  const rect = (y0, y1, c) => { b.fillStyle = c; b.fillRect(0, y0 * h, w, (y1 - y0) * h + 1); };
  const poly = (c, pts) => { b.fillStyle = c; b.beginPath(); pts.forEach(([x, y], i) => i ? b.lineTo(x * w, y * h) : b.moveTo(x * w, y * h)); b.closePath(); b.fill(); };
  const disc = (x, y, r, c) => { b.fillStyle = c; b.beginPath(); b.arc(x * w, y * h, r * w, 0, 6.3); b.fill(); };
  const glow = (x, y, r, c) => { const gr = b.createRadialGradient(x * w, y * h, 0, x * w, y * h, r * w); gr.addColorStop(0, c); gr.addColorStop(1, c.slice(0, 7) + "00"); b.fillStyle = gr; b.fillRect(0, 0, w, h); };
  if (k === 0) { rect(0, 0.64, lg(0, 0.64, "#4E4A8C", "#E9687A", "#FFC46B")); glow(0.5, 0.6, 0.45, "#FFD98A"); disc(0.5, 0.6, 0.15, "#FFF0B8");
    rect(0.62, 1, lg(0.62, 1, "#5B5B9C", "#262E60")); b.fillStyle = "#FFD27A"; for (let i = 0; i < 6; i++) { const ww = 0.34 - i * 0.045; b.globalAlpha = 0.9 - i * 0.12; b.fillRect((0.5 - ww / 2) * w, (0.66 + i * 0.055) * h, ww * w, 0.02 * h); } b.globalAlpha = 1;
    poly("#2A2346", [[0.62, 0.64], [0.7, 0.6], [0.76, 0.62], [0.86, 0.57], [1, 0.62], [1, 0.645]]); }
  else if (k === 1) { rect(0, 1, lg(0, 0.7, "#8CC8EA", "#FFE3A8", "#FFB874")); glow(0.22, 0.62, 0.5, "#FFE9A0"); disc(0.22, 0.62, 0.09, "#FFF6D0");
    poly("#A8BE98", [[0, 0.62], [0.25, 0.52], [0.5, 0.6], [0.78, 0.48], [1, 0.56], [1, 1], [0, 1]]); rect(0.78, 1, "#7DA455");
    [[0.08, 0.86, 0.5], [0.3, 0.9, 0.62], [0.48, 0.84, 0.44], [0.66, 0.92, 0.7], [0.88, 0.86, 0.56], [0.97, 0.9, 0.4]].forEach(([x, y, s], i) => { const c = i % 2 ? "#2E5E45" : "#3C7350";
      for (let j = 0; j < 3; j++) { const ty = y - s * (0.22 + j * 0.24), bw = s * (0.22 - j * 0.05); poly(c, [[x, ty - s * 0.2], [x + bw, ty + s * 0.16], [x - bw, ty + s * 0.16]]); } b.fillStyle = "#5A3E2A"; b.fillRect((x - 0.012) * w, (y - s * 0.07) * h, 0.024 * w, s * 0.09 * h); }); }
  else if (k === 2) { rect(0, 1, lg(0, 0.85, "#26346C", "#7A5FA8", "#F59A72")); disc(0.8, 0.2, 0.06, "#FFF1D0");
    const bl = [[0, 0.5, 0.14], [0.13, 0.36, 0.12], [0.24, 0.56, 0.1], [0.33, 0.24, 0.13], [0.45, 0.46, 0.12], [0.56, 0.3, 0.1], [0.65, 0.52, 0.14], [0.78, 0.4, 0.11], [0.88, 0.58, 0.13]];
    bl.forEach(([x, y, bw], i) => { b.fillStyle = i % 2 ? "#1B2040" : "#252A4E"; b.fillRect(x * w, y * h, bw * w, (1 - y) * h); b.fillStyle = "#FFD66B";
      for (let wy = y + 0.04; wy < 0.94; wy += 0.07) for (let wx = x + 0.02; wx < x + bw - 0.03; wx += 0.04) if ((wx * 97 + wy * 61 + i) % 1 > 0.45) b.fillRect(wx * w, wy * h, 0.018 * w, 0.03 * h); });
    b.fillStyle = "#1B2040"; b.fillRect(0.375 * w, 0.14 * h, 0.01 * w, 0.1 * h); }
  else if (k === 3) { rect(0, 0.54, lg(0, 0.54, "#5DB8EA", "#D4F0FB")); glow(0.78, 0.2, 0.3, "#FFF4C0"); disc(0.78, 0.2, 0.08, "#FFF6CE");
    rect(0.52, 0.72, lg(0.52, 0.72, "#1C8DBA", "#5CC6DE")); rect(0.7, 1, lg(0.7, 1, "#F6DFAE", "#E9C688")); b.fillStyle = "rgba(255,255,255,.85)"; b.fillRect(0, 0.695 * h, w, 0.022 * h);
    b.fillStyle = "#6B4A2E"; b.fillRect(0.34 * w, 0.5 * h, 0.018 * w, 0.4 * h);
    for (let i = 0; i < 4; i++) { b.fillStyle = i % 2 ? "#FFFFFF" : "#E8504A"; b.beginPath(); b.moveTo(0.349 * w, 0.48 * h); b.arc(0.349 * w, 0.58 * h, 0.22 * w, Math.PI + i * Math.PI / 4, Math.PI + (i + 1) * Math.PI / 4); b.closePath(); b.fill(); }
    poly("#2E9E8E", [[0.75, 0.9], [0.86, 0.84], [0.93, 0.9]]); }
  else if (k === 5) { rect(0, 1, lg(0, 0.7, "#F7B07A", "#FFE6B0")); glow(0.7, 0.5, 0.4, "#FFF0B0"); disc(0.7, 0.5, 0.1, "#FFF6D2");
    poly("#9CBF6A", [[0, 0.62], [0.3, 0.55], [0.62, 0.62], [1, 0.54], [1, 1], [0, 1]]); poly("#6E9E48", [[0, 0.76], [0.4, 0.68], [0.8, 0.74], [1, 0.7], [1, 1], [0, 1]]);
    for (let i = 0; i < 46; i++) { const x = (i * 0.618) % 1, y = 0.72 + ((i * 0.377) % 1) * 0.26; disc(x, y, 0.012 + y * 0.016, ["#F06A8E", "#FFD24A", "#FFFFFF", "#E8604A"][i % 4]); } }
  else if (k === 6) { rect(0, 1, lg(0, 1, "#7FB8E8", "#CFE3F2", "#FFD6B0")); b.fillStyle = "rgba(255,255,255,.8)"; [[0.2, 0.3], [0.7, 0.72]].forEach(([x, y]) => { b.beginPath(); b.ellipse(x * w, y * h, 0.16 * w, 0.04 * h, 0, 0, 6.3); b.fill(); });
    [[0.32, 0.4, 0.17, "#E8504A", "#FFC84A"], [0.72, 0.28, 0.12, "#2FA7A0", "#FFFFFF"], [0.6, 0.62, 0.08, "#F2A23A", "#7A5CC8"]].forEach(([x, y, r, c1, c2]) => { disc(x, y, r, c1); b.fillStyle = c2; b.beginPath(); b.ellipse(x * w, y * h, r * 0.38 * w, r * w, 0, 0, 6.3); b.fill();
      b.strokeStyle = "rgba(60,40,30,.6)"; b.lineWidth = 0.6; b.beginPath(); b.moveTo((x - r * 0.5) * w, (y + r * 0.86) * h); b.lineTo((x - r * 0.18) * w, (y + r * 1.4) * h); b.moveTo((x + r * 0.5) * w, (y + r * 0.86) * h); b.lineTo((x + r * 0.18) * w, (y + r * 1.4) * h); b.stroke();
      b.fillStyle = "#8A5A34"; b.fillRect((x - r * 0.2) * w, (y + r * 1.4) * h, r * 0.4 * w, r * 0.3 * w); }); }
  else { rect(0, 0.66, lg(0, 0.66, "#F49A86", "#FCE0C2")); glow(0.62, 0.5, 0.35, "#FFE7B0");
    poly("#9A86BE", [[0, 0.62], [0.2, 0.34], [0.36, 0.5], [0.58, 0.22], [0.8, 0.46], [1, 0.36], [1, 0.66], [0, 0.66]]);
    poly("#FFFFFF", [[0.58, 0.22], [0.64, 0.3], [0.6, 0.29], [0.56, 0.32], [0.52, 0.29]]); poly("#FFFFFF", [[0.2, 0.34], [0.25, 0.4], [0.2, 0.39], [0.16, 0.4]]);
    poly("#6A5A94", [[0, 0.66], [0.14, 0.5], [0.3, 0.66]]); poly("#6A5A94", [[0.62, 0.66], [0.84, 0.48], [1, 0.6], [1, 0.66]]);
    rect(0.66, 1, lg(0.66, 1, "#F4B08E", "#B985A6")); b.globalAlpha = 0.35; poly("#8A78B4", [[0.2, 0.66], [0.36, 0.76], [0.58, 0.72], [0.8, 0.78], [1, 0.72], [1, 0.66]]); b.globalAlpha = 1;
    b.fillStyle = "rgba(255,255,255,.55)"; [0.74, 0.82, 0.9].forEach((y, i) => b.fillRect((0.3 + i * 0.12) * w, y * h, 0.2 * w, 0.01 * h)); }
};
const hbPhoto = () => {
  // a polaroid print, painted once: soft white paper, a square photo and the wide bottom margin
  const mkPrint = (pw, k) => { const ph = pw * 1.2, m = pw * 0.065, iw = pw - 2 * m, Z = 2, c = document.createElement("canvas"); c.width = Math.ceil(pw * Z); c.height = Math.ceil(ph * Z); const b = c.getContext("2d"); b.scale(Z, Z);
    const gr = b.createLinearGradient(0, 0, pw, ph); gr.addColorStop(0, "#FFFFFF"); gr.addColorStop(1, "#ECE5D8"); b.fillStyle = gr; b.fillRect(0, 0, pw, ph);
    b.save(); b.translate(m, m); b.beginPath(); b.rect(0, 0, iw, iw); b.clip(); hbScene(b, iw, iw, k); const sh = b.createLinearGradient(0, 0, iw, iw); sh.addColorStop(0, "rgba(255,255,255,.22)"); sh.addColorStop(0.45, "rgba(255,255,255,0)"); sh.addColorStop(1, "rgba(0,0,0,.08)"); b.fillStyle = sh; b.fillRect(0, 0, iw, iw); b.restore();
    b.strokeStyle = "rgba(0,0,0,.14)"; b.lineWidth = 0.8; b.strokeRect(m, m, iw, iw); b.strokeStyle = "rgba(0,0,0,.08)"; b.strokeRect(0.4, 0.4, pw - 0.8, ph - 0.8); return {c, pw, ph, m, iw}; };
  const mkBokeh = c => { const cv = document.createElement("canvas"); cv.width = cv.height = 64; const b = cv.getContext("2d"), gr = b.createRadialGradient(32, 32, 0, 32, 32, 31);
    gr.addColorStop(0, c + "55"); gr.addColorStop(0.78, c + "77"); gr.addColorStop(0.9, c + "CC"); gr.addColorStop(1, c + "00"); b.fillStyle = gr; b.fillRect(0, 0, 64, 64); return cv; };
  const S = hbRun((W, H, d) => { const m = Math.min(W, H), tall = H > W * 1.25, rows = tall ? [[0.1, 3], [0.6, 2]] : [[0.07, W > 1000 ? 5 : 4], [0.6, 3]], kinds = [0, 1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5); let q = 0;
    const pw = Math.min(W / Math.max(...rows.map(r => r[1])) * 0.8, H * 0.22, 160), lines = rows.map(([y, n], r) => { const t0 = 62 + r * 34;
      return {y: H * y, sag: H * 0.03, t0, prints: Array.from({length: n}, (_, i) => ({x: W * (i + 0.5) / n + fxR(-0.02, 0.02) * W, t0: t0 + 18 + i * 16 + fxR(0, 4), rot0: fxR(0.07, 0.14) * (i % 2 ? 1 : -1), dy: fxR(0, 0.04) * pw, ...mkPrint(pw, kinds[q++ % 7])}))}; });
    const cols = d ? ["#FFC861", "#FFB070", "#FFE3A0", "#FF9A7A"] : ["#F2A93A", "#F0904A", "#E8B84A", "#F08A6A"];
    return {lines, bok: Array.from({length: Math.round(Math.max(8, Math.min(16, W * H / 40000)))}, () => ({x: fxR(0, W), y: fxR(0.1, 1) * H, r: m * fxR(0.025, 0.075), vy: fxR(0.1, 0.35), ph: fxR(0, 6.3), a: fxR(0.5, 1), spr: mkBokeh(fxPick(cols))}))}; });
  const N = 7, P = new Float32Array(N * 2);
  return (g, f, W, H, d) => { const s = S(W, H, d, f), m = Math.min(W, H);
    // warm light leak and golden bokeh behind everything
    const amb = fxEase((f - 18) / 40) * (1 - fxEase((f - 200) / 60));
    if (amb > 0) { const x0 = -W * 0.15 + Math.sin(f * 0.012) * W * 0.06, gr = g.createLinearGradient(x0, 0, x0 + W * 0.55, H * 0.55); gr.addColorStop(0, "rgba(255,110,40,1)"); gr.addColorStop(0.4, "rgba(255,170,80,.55)"); gr.addColorStop(1, "rgba(255,190,110,0)");
      g.globalAlpha = amb * (d ? 0.2 : 0.16); g.fillStyle = gr; g.fillRect(0, 0, W, H); const g2 = g.createLinearGradient(W * 1.05, H, W * 0.6, H * 0.55); g2.addColorStop(0, "rgba(255,80,90,1)"); g2.addColorStop(1, "rgba(255,120,90,0)"); g.globalAlpha = amb * (d ? 0.14 : 0.1); g.fillStyle = g2; g.fillRect(0, 0, W, H);
      if (d) g.globalCompositeOperation = "lighter"; for (const b of s.bok) { const x = b.x + Math.sin(f * 0.012 + b.ph) * 14, y = b.y - f * b.vy; g.globalAlpha = amb * b.a * (d ? 0.5 : 0.42) * (0.75 + 0.25 * Math.sin(f * 0.035 + b.ph)); g.drawImage(b.spr, x - b.r, y - b.r, 2 * b.r, 2 * b.r); }
      g.globalCompositeOperation = "source-over"; }
    // the clothesline and the prints pegged onto it
    for (const L of s.lines) { const lr = fxEase((f - L.t0) / 40); if (lr <= 0) continue; const ly = x => L.y + L.sag * (1 - Math.pow((x - W / 2) / (W / 2 + 20), 2)) + Math.sin(f * 0.025 + L.y) * 1.2;
      g.globalAlpha = 1; g.strokeStyle = d ? "rgba(236,222,198,.75)" : "rgba(122,98,70,.8)"; g.lineWidth = Math.max(1.2, m * 0.0026); g.beginPath(); for (let x = -10; x <= -10 + (W + 20) * lr; x += 12) x === -10 ? g.moveTo(x, ly(x)) : g.lineTo(x, ly(x)); g.stroke();
      for (const p of L.prints) { const t = f - p.t0; if (t < 0) continue; const py = ly(p.x), e = fxEase(t / 46), th = p.rot0 * Math.exp(-t / 70) * Math.cos(t * 0.06) + Math.sin(f * 0.022 + p.x) * 0.02, y = py - (1 - e) * (p.ph * 0.9 + 30);
        g.save(); g.globalAlpha = fxEase(t / 18); g.translate(p.x, y); g.rotate(th); g.shadowColor = d ? "rgba(0,0,0,.55)" : "rgba(70,45,20,.28)"; g.shadowBlur = 12; g.shadowOffsetY = 5; g.drawImage(p.c, -p.pw / 2, -p.pw * 0.06 + p.dy, p.pw, p.ph); g.shadowColor = "rgba(0,0,0,0)";
        const dv = fxEase((t - 12) / 85); if (dv < 1) { g.globalAlpha = (1 - dv) * 0.94; g.fillStyle = "#47464E"; g.fillRect(-p.pw / 2 + p.m, -p.pw * 0.06 + p.dy + p.m, p.iw, p.iw); g.globalAlpha = 1; }
        const pg = fxEase((t - 34) / 16); if (pg > 0) { const u = p.pw / 100; g.scale(pg, pg); g.fillStyle = "#C99A62"; g.fillRect(-4.6 * u, -13 * u, 4.4 * u, 25 * u); g.fillStyle = "#DDB47E"; g.fillRect(0.2 * u, -13 * u, 4.4 * u, 25 * u);
          g.fillStyle = "#9AA0A8"; g.fillRect(-5.4 * u, -3 * u, 10.8 * u, 2.6 * u); g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(0.9 * u, -12 * u, 1.2 * u, 22 * u); }
        g.restore(); } }
    // the shutter: blades close to a pinpoint, a soft flash, then open wide and fall away
    const vis = fxEase(f / 12) * (1 - fxEase((f - 50) / 28)); if (vis <= 0) return;
    const R = m * 0.24, cx = W / 2, cy = H * 0.42, sc = 1 + 0.22 * fxEase((f - 44) / 34), op = f < 8 ? 0.92 : f < 32 ? 0.92 - 0.86 * fxEase((f - 8) / 24) : f < 36 ? 0.06 : 0.06 + 1.02 * fxEase((f - 36) / 24), rot = (1 - op) * 0.9;
    g.save(); g.globalAlpha = vis; g.translate(cx, cy); g.scale(sc, sc);
    if (op < 1.08) { const r = R * op; for (let i = 0; i < N; i++) { const a = rot + i / N * 6.283; P[2 * i] = Math.cos(a) * r; P[2 * i + 1] = Math.sin(a) * r; }
      g.save(); g.beginPath(); g.arc(0, 0, R, 0, 6.3); g.clip(); g.lineWidth = 1.2;
      for (let i = 0; i < N; i++) { const j = (i + 1) % N, h = (i + N - 1) % N, ux = P[2 * j] - P[2 * i], uy = P[2 * j + 1] - P[2 * i + 1], ul = Math.hypot(ux, uy) || 1, vx = P[2 * i] - P[2 * h], vy = P[2 * i + 1] - P[2 * h + 1], vl = Math.hypot(vx, vy) || 1;
        g.fillStyle = i % 2 ? (d ? "#3E414B" : "#2C2E36") : (d ? "#4A4E59" : "#363943"); g.beginPath(); g.moveTo(P[2 * i], P[2 * i + 1]); g.lineTo(P[2 * j] + ux / ul * 3 * R, P[2 * j + 1] + uy / ul * 3 * R); g.lineTo(P[2 * i] + vx / vl * 3 * R, P[2 * i + 1] + vy / vl * 3 * R); g.closePath(); g.fill();
        g.strokeStyle = "rgba(255,255,255,.2)"; g.beginPath(); g.moveTo(P[2 * i], P[2 * i + 1]); g.lineTo(P[2 * i] + vx / vl * 3 * R, P[2 * i + 1] + vy / vl * 3 * R); g.stroke(); }
      g.strokeStyle = "rgba(255,200,120,.45)"; g.beginPath(); for (let i = 0; i <= N; i++) { const j = i % N; i ? g.lineTo(P[2 * j], P[2 * j + 1]) : g.moveTo(P[0], P[1]); } g.stroke();
      g.restore(); }
    const gr = g.createLinearGradient(-R, -R, R, R); gr.addColorStop(0, "#5A5E68"); gr.addColorStop(0.5, "#1C1D22"); gr.addColorStop(1, "#3A3D45"); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R * 1.2, 0, 6.3); g.arc(0, 0, R, 0, 6.3, true); g.fill();
    g.strokeStyle = "rgba(255,214,150,.55)"; g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, R * 1.2, 0, 6.3); g.stroke(); g.strokeStyle = "rgba(255,255,255,.12)"; g.beginPath(); g.arc(0, 0, R * 1.1, 0, 6.3); g.stroke();
    g.fillStyle = "rgba(255,255,255,.4)"; for (let i = 0; i < 24; i++) { const a = i / 24 * 6.283; g.fillRect(Math.cos(a) * R * 1.15 - 0.8, Math.sin(a) * R * 1.15 - 0.8, 1.6, 1.6); } g.restore();
    const fl = f < 31 ? 0 : fxEase((f - 31) / 6) * Math.exp(-Math.max(0, f - 37) / 14); if (fl > 0.01) { const gr2 = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.8); gr2.addColorStop(0, "rgba(255,250,235,1)"); gr2.addColorStop(1, "rgba(255,250,235,0)"); g.globalAlpha = Math.min(1, fl) * 0.22; g.fillStyle = gr2; g.fillRect(0, 0, W, H); } };
};

// Halloween: bats flap across in side view (heads first, wings beating) past a rising moon
// small canvas drawn once at 2x (fn draws in CSS pixels), and a 0..1..0 bump between frames a and b
const hbCv = (w, h, fn) => { const c = document.createElement("canvas"); c.width = Math.max(2, Math.ceil(w * 2)); c.height = Math.max(2, Math.ceil(h * 2)); const x = c.getContext("2d"); x.scale(2, 2); fn(x); return c; };
const hbBump = (f, a, b) => f <= a || f >= b ? 0 : Math.sin(Math.PI * (f - a) / (b - a));

// Easter: a big painted egg wobbles, cracks and pops its top off, and a fluffy chick hatches, blinks and hops. Tulips pop
// up along the bottom one by one and small painted eggs roll in from the sides.
FX_SHAPES.eggbit = {d: "M-6 -4L5 -6L7 1L2 3.5L4 6L-5 5L-7 1Z"};
const hbEggGeo = (W, H) => { const ph = W < H, b = Math.min(H * 0.17, W * 0.21, 150), a = b * 0.74, gh = Math.max(16, H * 0.045), gy = H - gh * 0.55;
  return {ph, a, b, cx: W / 2, gy, gh, ey: gy - b * 0.94, y0: -0.08 * b, side: ph ? 1 : -1}; };
const hbEggLine = (g, a, b) => { g.beginPath(); for (let i = 0; i <= 56; i++) { const t = i / 56 * 6.283; g[i ? "lineTo" : "moveTo"](a * Math.sin(t) * (1 - 0.17 * Math.cos(t)), -b * Math.cos(t)); } g.closePath(); };
const hbHatch = () => {
  const EC = {base: "#C7B2F2", pink: "#F7A8C4", yel: "#F9DC7A", mint: "#9EDDC5", blue: "#9CC8F2"};
  const S = hbRun((W, H, d) => { const G = hbEggGeo(W, H), {a, b, y0, cx, gy, gh} = G, cw = 2 * a + 6, ch = 2 * b + 6;
    const crack = Array.from({length: 11}, (_, i) => [(-1.15 + 2.3 * i / 10) * a, y0 + (i % 2 ? -1 : 1) * 0.085 * b]);
    const egg = hbCv(cw, ch, x => { x.translate(cw / 2, ch / 2); hbEggLine(x, a, b); x.save(); x.clip(); x.fillStyle = EC.base; x.fillRect(-cw, -ch, 2 * cw, 2 * ch);
      const band = (t0, t1, col) => { x.fillStyle = col; x.fillRect(-cw, t0 * b, 2 * cw, (t1 - t0) * b); };
      const zig = (y, amp, n, col, lw) => { x.strokeStyle = col; x.lineWidth = lw; x.lineJoin = "round"; x.beginPath(); for (let i = 0; i <= n; i++) x[i ? "lineTo" : "moveTo"](-a * 1.1 + 2.2 * a * i / n, y + (i % 2 ? -amp : amp)); x.stroke(); };
      band(-1.1, -0.64, EC.pink); [[-0.24, -0.86], [0.24, -0.86], [0, -0.74], [-0.42, -0.7], [0.42, -0.7]].forEach(([u, v]) => { x.fillStyle = "#FFFFFF"; x.beginPath(); x.arc(u * a, v * b, 0.055 * b, 0, 6.3); x.fill(); });
      zig(-0.47 * b, 0.07 * b, 10, "#FFFFFF", 0.07 * b); band(-0.3, -0.17, EC.yel);
      for (let i = 0; i < 5; i++) { x.fillStyle = i % 2 ? EC.blue : EC.mint; x.beginPath(); x.arc((-0.8 + 0.4 * i) * a, 0.17 * b, 0.075 * b, 0, 6.3); x.fill(); }
      band(0.38, 0.56, EC.pink); zig(0.47 * b, 0.035 * b, 14, "#FFFFFF", 0.025 * b); band(0.72, 1.1, EC.mint);
      [-0.5, 0, 0.5].forEach(u => { x.fillStyle = EC.yel; x.beginPath(); x.arc(u * a, 0.86 * b, 0.05 * b, 0, 6.3); x.fill(); });
      const sh = x.createRadialGradient(-0.35 * a, -0.45 * b, 0, -0.2 * a, -0.2 * b, 1.5 * b); sh.addColorStop(0, "rgba(255,255,255,.55)"); sh.addColorStop(0.35, "rgba(255,255,255,0)"); sh.addColorStop(1, "rgba(70,40,110,.22)");
      x.fillStyle = sh; x.fillRect(-cw, -ch, 2 * cw, 2 * ch); x.restore(); x.strokeStyle = "rgba(110,80,160,.35)"; x.lineWidth = 1.2; hbEggLine(x, a, b); x.stroke(); });
    // the two halves of the shell, cut along the zigzag crack, with a white shell edge
    const half = top => hbCv(cw, ch, x => { x.translate(cw / 2, ch / 2); x.beginPath(); crack.forEach(([u, v], i) => x[i ? "lineTo" : "moveTo"](u, v)); x.lineTo(1.2 * a, (top ? -1 : 1) * 1.2 * b); x.lineTo(-1.2 * a, (top ? -1 : 1) * 1.2 * b); x.closePath(); x.clip();
      x.drawImage(egg, -cw / 2, -ch / 2, cw, ch); x.save(); hbEggLine(x, a, b); x.clip(); x.strokeStyle = "#FFFDF6"; x.lineWidth = Math.max(2, b * 0.03); x.lineJoin = "round"; x.beginPath(); crack.forEach(([u, v], i) => x[i ? "lineTo" : "moveTo"](u, v)); x.stroke(); x.restore(); });
    const R = 0.8 * a, chick = hbCv(2.8 * R, 2.8 * R, x => { x.translate(1.4 * R, 1.4 * R);
      const gr = x.createLinearGradient(0, -R, 0, R); gr.addColorStop(0, "#FFEC8E"); gr.addColorStop(1, "#FFC43A"); x.fillStyle = gr; x.beginPath(); x.arc(0, 0, R * 0.92, 0, 6.3);
      for (let k = 0; k < 18; k++) { const an = k / 18 * 6.283, px = Math.cos(an) * R * 0.88, py = Math.sin(an) * R * 0.88; x.moveTo(px + R * 0.15, py); x.arc(px, py, R * 0.15, 0, 6.3); } x.fill();
      x.fillStyle = "#FFD24A"; [[-0.12, -1.0, -0.55], [0.03, -1.08, 0.05], [0.17, -1.0, 0.6]].forEach(([u, v, r]) => { x.save(); x.translate(u * R, v * R); x.rotate(r); x.beginPath(); x.ellipse(0, 0, 0.07 * R, 0.19 * R, 0, 0, 6.3); x.fill(); x.restore(); });
      x.fillStyle = "rgba(255,250,215,.55)"; x.beginPath(); x.ellipse(0, 0.38 * R, 0.55 * R, 0.42 * R, 0, 0, 6.3); x.fill();
      const hl = x.createRadialGradient(-0.35 * R, -0.42 * R, 0, -0.35 * R, -0.42 * R, 0.7 * R); hl.addColorStop(0, "rgba(255,255,255,.6)"); hl.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = hl; x.beginPath(); x.arc(0, 0, R, 0, 6.3); x.fill();
      x.fillStyle = "rgba(255,130,140,.42)"; [-1, 1].forEach(s => { x.beginPath(); x.ellipse(s * 0.52 * R, 0.1 * R, 0.15 * R, 0.1 * R, 0, 0, 6.3); x.fill(); }); });
    // grass along the bottom edge
    const grass = hbCv(W, gh * 2, x => { const gr = x.createLinearGradient(0, 0, 0, gh * 2); gr.addColorStop(0, d ? "#6FAF7E" : "#A9DC9C"); gr.addColorStop(1, d ? "#4E8A5E" : "#86C77E"); x.fillStyle = gr; x.beginPath(); x.moveTo(0, gh * 2);
      for (let px = 0; px <= W + 12; px += 12) { const h = gh * (0.55 + 0.3 * Math.abs(Math.sin(px * 0.37))); x.lineTo(px - 6, gh * 2 - h * 0.55); x.lineTo(px, gh * 2 - h - gh * 0.25); } x.lineTo(W, gh * 2); x.closePath(); x.fill(); });
    // tulips: slots along the bottom, skipping the big egg and where its top lands; they pop up in a random order
    const land = cx + G.side * (G.ph ? 1.95 : 2.35) * a, slots = [], m = Math.max(4, Math.min(9, Math.round(W / 125)));
    for (let i = 0; i < m + 6; i++) { const x = W * (0.04 + 0.92 * i / (m + 5)); if (Math.abs(x - cx) > 1.2 * a && Math.abs(x - land) > 0.95 * a) slots.push(x); }
    const tcols = ["#F48FB8", "#B597EC", "#F9A97E", "#F6CF5A", "#EE7FA0", "#8FBDF0"], ord = slots.map((_, i) => i).sort(() => Math.random() - 0.5), u = hbSc(W, H);
    const tul = slots.map((x, i) => ({x: x + fxR(-8, 8), t0: 18 + ord[i] * 13, h: H * fxR(0.07, 0.12) + 14 * u, r: u * fxR(8.5, 10.5), c: tcols[(i + ord[0]) % tcols.length], ph: fxR(0, 6.3)}));
    // small eggs that roll in from the sides
    const ecols = [EC.pink, EC.mint, EC.yel, EC.blue, "#B99AE8"], es = 1.4 * u, rest = G.ph ? [[-1, 0.15], [1, 0.9]] : [[-1, 0.08], [-1, 0.2], [1, 0.8], [1, 0.92]];
    const eggs = rest.map(([sd, rx], i) => { const xs = sd < 0 ? -30 : W + 30, xr = W * rx, dist = Math.abs(xr - xs), K = Math.max(1, Math.round(dist / (6.283 * 8.5 * es)));
      return {xs, xr, t0: 28 + i * 22 + fxR(0, 10), T: 70 + fxR(0, 15), c: ecols[i % ecols.length], end: Math.sign(xr - xs) * (Math.PI / 2 + 6.283 * K), s: es * fxR(0.9, 1.1)}; });
    return {G, crack, egg, top: half(true), bot: half(false), chick, R, cw, ch, grass, tul, eggs, land};
  });
  const tulip = (g, t, f, d, gy) => { const e = (f - t.t0) / 30; if (e <= 0) return; const st = fxEase(e * 1.5), hd = hbBack((e - 0.3) / 0.6), hh = t.h * st, r = t.r, sw = Math.sin(f * 0.035 + t.ph) * 0.05 * st;
    g.save(); g.translate(t.x, gy + 4); g.rotate(sw); const green = d ? "#7CCB88" : "#5FAE6C";
    g.fillStyle = d ? "#8FD69A" : "#79C283"; [[-1, 0.62], [1, 0.45]].forEach(([s, k]) => { g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(s * r * 1.3, -hh * k * 0.5, s * r * 0.9, -hh * k); g.quadraticCurveTo(s * r * 0.2, -hh * k * 0.45, 0, 0); g.fill(); });
    g.strokeStyle = green; g.lineWidth = Math.max(2, r * 0.22); g.lineCap = "round"; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(r * 0.3, -hh * 0.5, 0, -hh); g.stroke();
    if (hd > 0) { g.translate(0, -hh - r * 0.2); g.scale(hd, hd); g.rotate(Math.sin(f * 0.05 + t.ph) * 0.06);
      g.fillStyle = fxShade(t.c, 0.82); g.beginPath(); g.moveTo(-0.62 * r, -0.2 * r); g.quadraticCurveTo(-0.6 * r, -1.1 * r, 0, -1.25 * r); g.quadraticCurveTo(0.6 * r, -1.1 * r, 0.62 * r, -0.2 * r); g.fill();
      g.fillStyle = t.c; g.beginPath(); g.moveTo(-0.78 * r, -0.95 * r); g.quadraticCurveTo(-0.5 * r, -0.55 * r, -0.3 * r, -0.5 * r); g.quadraticCurveTo(0, -0.9 * r, 0.3 * r, -0.5 * r); g.quadraticCurveTo(0.5 * r, -0.55 * r, 0.78 * r, -0.95 * r);
      g.quadraticCurveTo(0.95 * r, 0.55 * r, 0, 0.6 * r); g.quadraticCurveTo(-0.95 * r, 0.55 * r, -0.78 * r, -0.95 * r); g.fill();
      g.fillStyle = fxShade(t.c, 1.1); g.beginPath(); g.moveTo(0, -1.05 * r); g.quadraticCurveTo(0.55 * r, -0.4 * r, 0.32 * r, 0.52 * r); g.quadraticCurveTo(0, 0.62 * r, -0.32 * r, 0.52 * r); g.quadraticCurveTo(-0.55 * r, -0.4 * r, 0, -1.05 * r); g.fill();
      g.fillStyle = "rgba(255,255,255,.4)"; g.beginPath(); g.ellipse(-0.12 * r, -0.35 * r, 0.08 * r, 0.3 * r, 0.15, 0, 6.3); g.fill(); }
    g.restore(); };
  return (g, f, W, H, d) => { const s = S(W, H, d, f), {G, R} = s, {a, b, cx, ey, y0, gy, gh} = G, out = 1;   // the whole layer fades at the end, so solid pieces never go see-through
    g.globalAlpha = out; for (const t of s.tul) tulip(g, t, f, d, gy);
    g.drawImage(s.grass, 0, H - gh * 2 + gh * 2 * (1 - fxEase(f / 18)), W, gh * 2);
    // small eggs: bounce in, roll, rock to a stop lying on their side
    for (const e of s.eggs) { const t = f - e.t0; if (t <= 0) continue; const p = 1 - Math.pow(1 - Math.min(1, t / e.T), 2.2), x = e.xs + (e.xr - e.xs) * p;
      const rot = e.end * p + (t > e.T ? 0.18 * Math.exp(-(t - e.T) / 14) * Math.sin((t - e.T) * 0.35) : 0), hop = H * 0.05 * Math.exp(-t / 16) * Math.abs(Math.sin(t * 0.2));
      hbStamp(g, "egg", e.c, d, x, gy + 3 - e.s * (7.6 + 2.6 * Math.abs(Math.cos(rot))) - hop, e.s, rot); }
    // the big egg: pops in, wobbles, cracks, then the top flies off and lands on the grass
    const pop = hbBack(f / 24), wob = Math.sin(f * 0.5) * (0.09 * hbBump(f, 26, 52) + 0.13 * hbBump(f, 60, 98)) + (f > 100 ? 0.06 * Math.exp(-(f - 100) / 12) * Math.sin((f - 100) * 0.5) : 0);
    g.save(); g.translate(cx, ey + b); g.rotate(wob); g.scale(pop, pop); g.translate(0, -b);
    if (f < 100) { g.drawImage(s.egg, -s.cw / 2, -s.ch / 2, s.cw, s.ch);
      const cr = fxEase((f - 52) / 40); if (cr > 0) { g.save(); hbEggLine(g, a, b); g.clip(); g.strokeStyle = "rgba(90,60,130,.75)"; g.lineWidth = Math.max(1.6, b * 0.022); g.lineJoin = g.lineCap = "round";
        const k = cr * 5; [1, -1].forEach(dir => { g.beginPath(); g.moveTo(...s.crack[5]); for (let i = 1; i <= Math.ceil(k); i++) { const [x0, y1] = s.crack[5 + dir * (i - 1)], [x1, y2] = s.crack[5 + dir * i], q = Math.min(1, k - i + 1); g.lineTo(x0 + (x1 - x0) * q, y1 + (y2 - y1) * q); } g.stroke(); }); g.restore(); } }
    else { // inside of the shell, then the chick, then the front of the shell
      g.fillStyle = "#FFF6E4"; g.beginPath(); g.ellipse(0, y0, a * 0.95, a * 0.22, 0, 0, 6.3); g.fill();
      const rise = hbBack((f - 104) / 26), hops = [[160, 30], [198, 30]], P = hops.map(([h0, L]) => (f - h0) / L).find(p => p > 0 && p < 1);
      let lift = 0, sq = 0, flap = Math.sin(f * 0.2) * 0.1; if (P != null) { if (P < 0.2) sq = Math.sin(P / 0.2 * Math.PI) * 0.12; else if (P < 0.85) { lift = Math.sin(Math.PI * (P - 0.2) / 0.65) * 0.8 * a; sq = -0.06; flap = Math.sin(f * 0.9) * 0.7; } else sq = Math.sin((P - 0.85) / 0.15 * Math.PI) * 0.1; }
      const cy = 0.9 * b + (-0.3 * b - 0.9 * b) * rise - lift, blink = [140, 186, 236].reduce((m, t0) => Math.max(m, hbBump(f, t0, t0 + 9)), 0), chirp = hbBump(f, 182, 196) + hbBump(f, 226, 240);
      g.save(); g.beginPath(); g.rect(-2 * a, -4 * b, 4 * a, 4.9 * b); g.clip(); g.translate(0, cy + R); g.scale(1 + sq, 1 - sq); g.translate(0, -R);
      g.fillStyle = "#F49A34"; [-1, 1].forEach(sd => { g.beginPath(); g.ellipse(sd * 0.3 * R, 0.95 * R, 0.17 * R, 0.07 * R, 0, 0, 6.3); g.fill(); });
      g.drawImage(s.chick, -1.4 * R, -1.4 * R, 2.8 * R, 2.8 * R);
      g.fillStyle = "#FFBC30"; [-1, 1].forEach(sd => { g.save(); g.translate(sd * 0.8 * R, 0.16 * R); g.rotate(sd * (0.5 + flap)); g.beginPath(); g.ellipse(0, 0.08 * R, 0.13 * R, 0.25 * R, 0, 0, 6.3); g.fill(); g.restore(); });
      g.fillStyle = "#2E2230"; [-1, 1].forEach(sd => { g.beginPath(); g.ellipse(sd * 0.28 * R, -0.16 * R, 0.085 * R, Math.max(0.012, 0.11 * (1 - blink)) * R, 0, 0, 6.3); g.fill(); });
      if (blink < 0.5) { g.fillStyle = "#FFFFFF"; [-1, 1].forEach(sd => { g.beginPath(); g.arc(sd * 0.28 * R - 0.03 * R, -0.2 * R, 0.035 * R, 0, 6.3); g.fill(); }); }
      g.fillStyle = "#E57A22"; g.beginPath(); g.moveTo(-0.08 * R, 0.03 * R); g.lineTo(0.08 * R, 0.03 * R); g.lineTo(0, (0.1 + 0.09 * chirp) * R); g.fill();
      g.fillStyle = "#F7A23A"; g.beginPath(); g.moveTo(-0.12 * R, -0.03 * R); g.lineTo(0.12 * R, -0.03 * R); g.lineTo(0, 0.1 * R - chirp * 0.02 * R); g.fill(); g.restore();
      g.drawImage(s.bot, -s.cw / 2, -s.ch / 2, s.cw, s.ch); }
    g.restore();
    if (f >= 100) { const t = f - 100, T = 46, q = Math.min(1, t / T), pc = -0.55 * b, x0 = cx, yA = ey + pc, yB = gy - 0.45 * b + 2, x1 = s.land;
      const x = x0 + (x1 - x0) * q, y = yA + (yB - yA) * q - 4 * q * (1 - q) * H * (G.ph ? 0.16 : 0.22), rot = G.side * (3 * Math.PI * q) + (t > T ? G.side * 0.22 * Math.exp(-(t - T) / 16) * Math.sin((t - T) * 0.3) : 0);
      g.save(); g.translate(x, y); g.rotate(rot); g.translate(0, -pc); g.drawImage(s.top, -s.cw / 2, -s.ch / 2, s.cw, s.ch); g.restore(); }
    g.globalAlpha = 1; }; };
const hbHatchBits = (W, H, d, n) => { const G = hbEggGeo(W, H), y = G.ey + G.y0, sc = d ? ["#FFE08A", "#FFB8D6", "#D4C2FF", "#FFFFFF"] : ["#F2B84A", "#F28BB8", "#A884F0", "#7FC9AE"];
  return Array.from({length: n(14)}, () => ({shape: "sparkle", c: fxPick(sc), x: G.cx + fxR(-0.6, 0.6) * G.a, y: y + fxR(-0.1, 0.1) * G.b, vx: fxR(-3.2, 3.2), vy: -fxR(2, 5.5), g: 0.05, drag: 0.97, size: fxR(6, 10), rot: 0, vr: fxR(-0.1, 0.1), sway: 0, life: 75, delay: 100 + Math.round(fxR(0, 8)), glow: d ? 8 : 0}))
    .concat(Array.from({length: n(9)}, () => ({shape: "eggbit", c: fxPick(["#C7B2F2", "#F7A8C4", "#9EDDC5", "#F9DC7A"]), x: G.cx + fxR(-0.8, 0.8) * G.a, y, vx: fxR(-4, 4), vy: -fxR(4, 8), g: 0.28, flip: true, size: fxR(5, 7.5), rot: fxR(0, 6.3), vr: fxR(-0.2, 0.2), sway: 0, life: 80, delay: 100}))); };

// Halloween: a big full moon rises, a witch on her broom flies across its face, bats burst up from below, a little ghost
// floats up and waves, and a row of jack-o'-lanterns along the bottom lights up one by one.
// the moon sits up in the top right, clear of the middle of the screen where the app content is
const hbMoonGeo = (W, H) => { const ph = W < H, R = ph ? Math.min(W * 0.22, H * 0.12) : Math.min(H * 0.16, W * 0.12); return {ph, R, mx: W * (ph ? 0.68 : 0.8), my: H * (ph ? 0.15 : 0.18)}; };
const hbWitchAt = (W, H, t) => { const m = hbMoonGeo(W, H), u = t / 150; return [W * (-0.14 + 1.28 * u), m.my + m.R * (0.25 - 0.4 * u) + Math.sin(t * 0.045) * m.R * 0.1]; };
const hbNight = () => {
  const S = hbRun((W, H, d) => { const M = hbMoonGeo(W, H), {R} = M, mc = R * 3.6;
    const moon = hbCv(mc, mc, x => { x.translate(mc / 2, mc / 2); const h = x.createRadialGradient(0, 0, R * 0.9, 0, 0, R * 1.75); h.addColorStop(0, d ? "rgba(255,220,150,.32)" : "rgba(245,170,70,.3)"); h.addColorStop(1, "rgba(255,220,150,0)"); x.fillStyle = h; x.fillRect(-mc, -mc, 2 * mc, 2 * mc);
      const gr = x.createRadialGradient(-0.3 * R, -0.35 * R, 0, 0, 0, R); gr.addColorStop(0, d ? "#FFFBEA" : "#FDEBB4"); gr.addColorStop(1, d ? "#F6DA9A" : "#F1BD5E"); x.fillStyle = gr; x.beginPath(); x.arc(0, 0, R, 0, 6.3); x.fill();
      [[-0.35, -0.2, 0.2], [0.3, 0.3, 0.15], [0.1, -0.5, 0.1], [-0.15, 0.48, 0.12], [0.55, -0.15, 0.08]].forEach(([u, v, r]) => { x.fillStyle = d ? "rgba(214,170,100,.3)" : "rgba(200,130,50,.25)"; x.beginPath(); x.arc(u * R, v * R, r * R, 0, 6.3); x.fill();
        x.fillStyle = "rgba(255,255,255,.22)"; x.beginPath(); x.arc(u * R - r * R * 0.2, v * R - r * R * 0.2, r * R * 0.7, 0, 6.3); x.fill(); }); });
    // jack-o'-lanterns: a row along the bottom, each with its own face; unlit and lit faces are drawn once
    const m = M.ph ? 4 : Math.max(5, Math.min(8, Math.round(W / 150))), r0 = Math.min(W / (m * 2.7), H * 0.075), pc = r0 * 3.2;
    const face = (x, r, v, fill, glow) => { x.fillStyle = fill; if (glow) { x.shadowColor = "#FFA51F"; x.shadowBlur = r * 0.35; } x.beginPath();
      [-1, 1].forEach(s => { if (v === 1) { x.moveTo(s * 0.52 * r, -0.08 * r); x.quadraticCurveTo(s * 0.35 * r, -0.42 * r, s * 0.16 * r, -0.08 * r); x.closePath(); } else { x.moveTo(s * 0.55 * r, -0.04 * r); x.lineTo(s * 0.16 * r, -0.04 * r); x.lineTo(s * (v === 2 ? 0.28 : 0.36) * r, -0.4 * r); x.closePath(); } });
      x.moveTo(-0.08 * r, 0.06 * r); x.lineTo(0.08 * r, 0.06 * r); x.lineTo(0, -0.08 * r); x.closePath();
      x.moveTo(-0.62 * r, 0.16 * r); x.quadraticCurveTo(0, (v === 2 ? 0.55 : 0.32) * r, 0.62 * r, 0.16 * r); x.quadraticCurveTo(0.45 * r, 0.62 * r, 0, 0.66 * r); x.quadraticCurveTo(-0.45 * r, 0.62 * r, -0.62 * r, 0.16 * r); x.fill();
      x.shadowBlur = 0; x.fillStyle = "#F07E22"; if (v !== 2) [[-0.3, 0.3], [0.18, 0.3]].forEach(([u, w]) => x.fillRect(u * r, 0.22 * r, 0.13 * r, w * 0.5 * r)); };
    const body = hbCv(pc, pc, x => { const r = r0 * 1.2; x.translate(pc / 2, pc / 2 + r * 0.1);
      x.strokeStyle = "#5E7A2E"; x.lineWidth = r * 0.06; x.lineCap = "round"; x.beginPath(); x.moveTo(0.08 * r, -0.9 * r); x.bezierCurveTo(0.4 * r, -1.1 * r, 0.55 * r, -0.85 * r, 0.4 * r, -0.78 * r); x.stroke();
      x.fillStyle = "#6B7F2E"; x.beginPath(); x.moveTo(-0.1 * r, -0.75 * r); x.quadraticCurveTo(-0.14 * r, -1.05 * r, 0.04 * r, -1.2 * r); x.lineTo(0.18 * r, -1.1 * r); x.quadraticCurveTo(0.06 * r, -0.98 * r, 0.12 * r, -0.75 * r); x.fill();
      [[-0.6, 0.5, 0.8], [0.6, 0.5, 0.8], [-0.3, 0.58, 0.9], [0.3, 0.58, 0.9], [0, 0.55, 1]].forEach(([u, w, k]) => { const gr = x.createLinearGradient(0, -0.9 * r, 0, 0.9 * r); gr.addColorStop(0, fxShade("#FFA040", 0.85 + 0.15 * k)); gr.addColorStop(1, fxShade("#D9601A", 0.8 + 0.2 * k));
        x.fillStyle = gr; x.strokeStyle = "rgba(150,60,10,.35)"; x.lineWidth = r * 0.025; x.beginPath(); x.ellipse(u * r, 0, w * r, 0.86 * r, 0, 0, 6.3); x.fill(); x.stroke(); });
      x.fillStyle = "rgba(255,240,200,.25)"; x.beginPath(); x.ellipse(-0.62 * r, -0.42 * r, 0.08 * r, 0.18 * r, 0.5, 0, 6.3); x.fill(); });
    const faces = [0, 1, 2].map(v => [hbCv(pc, pc, x => { const r = r0 * 1.2; x.translate(pc / 2, pc / 2 + r * 0.1); face(x, r, v, "#5A2508"); }),
      hbCv(pc, pc, x => { const r = r0 * 1.2; x.translate(pc / 2, pc / 2 + r * 0.1); const gr = x.createRadialGradient(0, 0.15 * r, 0, 0, 0.15 * r, 0.8 * r); gr.addColorStop(0, "#FFF6B0"); gr.addColorStop(0.6, "#FFD035"); gr.addColorStop(1, "#FF9A12"); face(x, r, v, gr, true); })]);
    const halo = hbCv(pc, pc, x => { const gr = x.createRadialGradient(pc / 2, pc / 2, 0, pc / 2, pc / 2, pc / 2); gr.addColorStop(0, d ? "rgba(255,170,50,.6)" : "rgba(255,160,40,.4)"); gr.addColorStop(1, "rgba(255,170,50,0)"); x.fillStyle = gr; x.fillRect(0, 0, pc, pc); });
    const ord = Array.from({length: m}, (_, i) => i).sort(() => Math.random() - 0.5);
    const pumps = Array.from({length: m}, (_, i) => { const k = fxR(0.82, 1.12) * (i % 2 ? 0.9 : 1.05); return {x: W * (i + 0.5) / m + fxR(-0.1, 0.1) * W / m * (M.ph ? 0.4 : 1), k, v: (i + ord[0]) % 3, on: 62 + ord[i] * 16, ph: fxR(0, 6.3)}; });
    // bats burst up from behind the pumpkins and fan out
    const bk = Math.max(1.4, Math.min(W, H) * 0.0032), bats = Array.from({length: M.ph ? 10 : 16}, (_, i) => { const z = fxR(0.65, 1.15), sd = i % 2 ? 1 : -1;
      return {x0: W * (0.5 + sd * fxR(0, 0.3)), ang: sd * fxR(0.05, 0.75), curl: sd * fxR(-0.6, 1.4), sp: H * fxR(0.009, 0.013) * (0.7 + 0.3 * z), t0: 34 + i * 2.6 + fxR(0, 6), fr: fxR(0.32, 0.45), ph: fxR(0, 6.3), k: bk * z, z}; });
    const gs = Math.max(56, Math.min(W, H) * (M.ph ? 0.19 : 0.15));
    return {M, moon, mc, pumps, r0, pc, body, faces, halo, bats, gs, gx: W * (M.ph ? 0.18 : 0.15), gy: H * (M.ph ? 0.68 : 0.5)};
  });
  const sil = d => d ? "#1C1428" : "#2D2140";
  const witch = (g, f) => { const w = k => Math.sin(f * 0.32 + k);
    g.strokeStyle = g.fillStyle; g.lineCap = g.lineJoin = "round";
    g.lineWidth = 2; g.beginPath(); g.moveTo(-20, 5); g.lineTo(26, -1.5); g.stroke();
    g.beginPath(); g.moveTo(-18, 3); g.lineTo(-33 + w(1), -1.5 + w(2) * 0.8); g.quadraticCurveTo(-37, 6, -34 + w(3), 13 + w(1) * 0.8); g.lineTo(-18, 8); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(1, -12); g.bezierCurveTo(-6, -14, -14, -14 + w(0) * 2, -24, -13 + w(0.7) * 3); g.quadraticCurveTo(-19, -10 + w(1.4) * 1.5, -22, -5 + w(2) * 3); g.quadraticCurveTo(-14, -4 + w(2.6), -14, 1 + w(3.2) * 2); g.quadraticCurveTo(-8, 1, -3, 3); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-9, 4); g.quadraticCurveTo(-5, -4, -1, -12); g.lineTo(5, -12); g.quadraticCurveTo(7, -4, 6, 3); g.quadraticCurveTo(10, 8, 6, 10); g.lineTo(-8, 7); g.closePath(); g.fill();
    g.lineWidth = 2.6; g.beginPath(); g.moveTo(4, 6); g.lineTo(11, 8); g.lineTo(10, 13); g.stroke(); g.beginPath(); g.moveTo(9, 13.2); g.lineTo(14.5, 12.4); g.stroke();
    g.lineWidth = 2.2; g.beginPath(); g.moveTo(3, -9); g.quadraticCurveTo(9, -5, 13, 1); g.stroke();
    g.beginPath(); g.arc(4.5, -16, 4.2, 0, 6.3); g.fill(); g.beginPath(); g.moveTo(7.5, -18); g.lineTo(12, -15.5); g.lineTo(7.5, -14); g.fill();
    g.lineWidth = 1.6; [0, 1].forEach(i => { g.beginPath(); g.moveTo(1.5, -17.5 + i * 2.5); g.quadraticCurveTo(-3, -16 + i * 2.5 + w(i) * 1.2, -7.5, -13.5 + i * 3 + w(i + 1) * 1.5); g.stroke(); });
    g.beginPath(); g.ellipse(4, -20.3, 9.5, 1.9, -0.12, 0, 6.3); g.fill();
    g.beginPath(); g.moveTo(-0.5, -20.5); g.lineTo(8.5, -21.2); g.quadraticCurveTo(5, -27, 0, -31); g.quadraticCurveTo(-4, -34 + w(4) * 0.8, -9, -31.5 + w(4) * 1.2); g.quadraticCurveTo(-4, -30.5, -2, -27); g.closePath(); g.fill(); };
  const bat = (g, fl) => { const up = fl * 6, sp = 14 * (0.8 + 0.2 * Math.abs(fl));
    [-1, 1].forEach(s => { const tx = s * sp, ty = -2 - up; g.beginPath(); g.moveTo(s * 1.6, -2.4); g.quadraticCurveTo(s * sp * 0.5, -6 - up * 0.8, tx, ty);
      for (let k = 1; k <= 3; k++) { const q = k / 3, ex = tx + (s * 1.4 - tx) * q, ey = ty + (3 - ty) * q, mx = tx + (s * 1.4 - tx) * (q - 1 / 6), my = ty + (3 - ty) * (q - 1 / 6) - 2.6; g.quadraticCurveTo(mx, my, ex, ey); } g.closePath(); g.fill(); });
    g.beginPath(); g.ellipse(0, 0.4, 2.4, 3.8, 0, 0, 6.3); g.fill(); g.beginPath(); g.arc(0, -4.4, 2.3, 0, 6.3); g.fill();
    g.beginPath(); g.moveTo(-2.2, -5); g.lineTo(-2, -8.4); g.lineTo(-0.6, -6.2); g.moveTo(2.2, -5); g.lineTo(2, -8.4); g.lineTo(0.6, -6.2); g.fill(); };
  const batAt = (b, t, H) => { const dist = b.sp * (40 * (1 - Math.exp(-t / 40)) + 0.45 * t), a = b.ang + b.curl * t * 0.004; return [b.x0 + Math.sin(a) * dist + Math.sin(t * 0.08 + b.ph) * 10, H + 20 - Math.cos(a) * dist]; };
  return (g, f, W, H, d) => { const s = S(W, H, d, f), {M} = s, out = 1, col = sil(d);   // the layer fade at the end covers it
    // moon
    const mr = fxEase(f / 80), my = M.my + H * 0.25 * (1 - mr); g.globalAlpha = out * 0.85 * fxEase(f / 25); g.drawImage(s.moon, M.mx - s.mc / 2, my - s.mc / 2, s.mc, s.mc);
    // witch
    const wt = f - 40; if (wt > 0 && wt < 175) { const [x, y] = hbWitchAt(W, H, wt), [x2, y2] = hbWitchAt(W, H, wt + 1), k = M.R * 1.1 / 60;
      g.save(); g.globalAlpha = out; g.translate(x, y); g.rotate(Math.atan2(y2 - y, x2 - x) * 0.7 + Math.sin(f * 0.09) * 0.04); g.scale(k, k); g.fillStyle = col;
      witch(g, f); g.restore(); }
    // ghost
    const gr = fxEase((f - 46) / 70); if (gr > 0) { const gs = s.gs, x = s.gx + Math.sin(f * 0.04) * gs * 0.18, y = s.gy + (H - s.gy + gs * 1.2) * (1 - gr) + Math.sin(f * 0.07) * gs * 0.06, hem = f * 0.16;
      g.save(); g.globalAlpha = out * Math.min(1, gr * 1.5) * 0.96; g.translate(x, y); g.rotate(Math.sin(f * 0.05) * 0.09); g.scale(gs / 2, gs / 2);
      const wave = hbBump(f, 112, 220), arm = wave > 0 ? -1.2 * Math.min(1, wave * 2) + 0.45 * Math.sin(f * 0.32) * Math.min(1, wave * 2) : 0.5;
      const shape = () => { g.beginPath(); g.moveTo(-0.72, 0.5); g.bezierCurveTo(-0.78, -0.55, -0.42, -1, 0, -1); g.bezierCurveTo(0.42, -1, 0.78, -0.55, 0.72, 0.5);
        for (let k = 0; k < 4; k++) { const x0 = 0.72 - k * 0.36, x1 = x0 - 0.36, yy = 0.62 + 0.07 * Math.sin(hem + k * 1.6); g.quadraticCurveTo((x0 + x1) / 2, yy + 0.22, x1, 0.5 + 0.05 * Math.sin(hem + k * 1.6 + 0.8)); } g.closePath(); };
      const fillG = g.createLinearGradient(0, -1, 0, 0.8); fillG.addColorStop(0, "#FFFFFF"); fillG.addColorStop(1, d ? "#DCD6F2" : "#E4DCF4");
      g.fillStyle = fillG; g.strokeStyle = "rgba(80,60,120,.4)"; g.lineWidth = 0.035;
      [[-1, 0.5], [1, arm]].forEach(([sd, an]) => { g.save(); g.translate(sd * 0.62, 0.02); g.rotate(sd * an); g.beginPath(); g.ellipse(sd * 0.2, 0, 0.24, 0.13, 0, 0, 6.3); g.fill(); if (!d) g.stroke(); g.restore(); });
      if (d) { g.shadowColor = "rgba(210,200,255,.8)"; g.shadowBlur = gs * 0.25; } shape(); g.fill(); g.shadowBlur = 0; if (!d) g.stroke();
      g.fillStyle = "#2A2238"; [-1, 1].forEach(sd => { g.beginPath(); g.ellipse(sd * 0.24, -0.32, 0.09, 0.13 * (1 - hbBump(f, 170, 178)) + 0.01, 0, 0, 6.3); g.fill(); });
      g.fillStyle = "#FFFFFF"; [-1, 1].forEach(sd => { g.beginPath(); g.arc(sd * 0.24 - 0.03, -0.37, 0.03, 0, 6.3); g.fill(); });
      g.fillStyle = "#2A2238"; g.beginPath(); g.ellipse(0, -0.08, 0.08, 0.06 + 0.04 * wave, 0, 0, 6.3); g.fill();
      g.fillStyle = "rgba(255,130,170,.45)"; [-1, 1].forEach(sd => { g.beginPath(); g.ellipse(sd * 0.42, -0.14, 0.1, 0.06, 0, 0, 6.3); g.fill(); }); g.restore(); }
    // bats
    g.fillStyle = d ? "#4E3C70" : col; for (const b of s.bats) { const t = f - b.t0; if (t <= 0) continue; const [x, y] = batAt(b, t, H), [x2, y2] = batAt(b, t + 1, H); if (y < -60 || x < -60 || x > W + 60) continue;
      g.save(); g.globalAlpha = out * Math.min(1, t / 8) * (0.6 + 0.4 * Math.min(1, b.z)); g.translate(x, y); g.rotate(Math.atan2(y2 - y, x2 - x) + Math.PI / 2); g.scale(b.k, b.k); bat(g, Math.sin(t * b.fr + b.ph)); g.restore(); }
    // jack-o'-lanterns
    for (const p of s.pumps) { const up = hbBack((f - 4 - p.x / W * 14) / 22); if (up <= 0) continue; const w = s.pc * p.k, x = p.x - w / 2, y = H - s.r0 * p.k * 1.15 - w / 2 + (1 - up) * w;
      const t = f - p.on, on = t < 0 ? 0 : t < 16 ? [0.5, 0, 0.8, 0.3, 1, 1, 0.6, 1][Math.floor(t / 2)] : 1, fl = on * (0.86 + 0.14 * Math.sin(f * 0.5 + p.ph) * Math.sin(f * 0.21 + p.ph * 2));
      if (fl > 0) { g.globalAlpha = out * fl * 0.9; g.drawImage(s.halo, x - w * 0.3, y - w * 0.3, w * 1.6, w * 1.6); }
      g.globalAlpha = out; g.drawImage(s.body, x, y, w, w); g.drawImage(s.faces[p.v][0], x, y, w, w); if (on > 0) { g.globalAlpha = out * on; g.drawImage(s.faces[p.v][1], x, y, w, w); } }
    g.globalAlpha = 1; }; };
const hbNightBits = (W, H, d, n) => fxTw(W, H, n(14), "sparkle", d ? ["#FFE7A8", "#D8C8FF"] : ["#8A5AD0", "#D98A1E"], {smin: 3, smax: 6, top: 0.5, glow: d ? 8 : 0, spread: 150})
  .concat(Array.from({length: n(14)}, (_, i) => { const t = 20 + i * 9 + fxR(0, 5), [x, y] = hbWitchAt(W, H, t), k = hbMoonGeo(W, H).R * 1.1 / 60;
    return {shape: "star", c: fxPick(d ? ["#FFE08A", "#FFFFFF", "#C9B4FF"] : ["#E89A1E", "#9A5AE0", "#F2B84A"]), x: x - 34 * k, y: y + 8 * k, vx: fxR(-0.4, 0.2), vy: fxR(0.2, 0.7), g: 0.004, size: fxR(4, 7), rot: fxR(0, 6.3), vr: fxR(-0.05, 0.05), sway: 0.4, life: 70, delay: Math.round(40 + t), glow: d ? 8 : 0}; }));

// Thanksgiving: a cartoon turkey pops up at the bottom, fans its tail open feather by feather and bobs its head and wattle,
// while a gust of autumn leaves swirls past in a spiral (some in front of the turkey, some behind) and acorns tumble down.
const hbTurkey = () => {
  // a soft settle with only a hint of overshoot, so the turkey and its feathers ease into place
  const soft = t => t <= 0 ? 0 : t >= 1 ? 1 : 1 + 1.15 * Math.pow(t - 1, 3) + 0.15 * Math.pow(t - 1, 2);
  const S = hbRun((W, H, d) => { const ph = W < H, rb = Math.min(H * 0.105, W * 0.15, 92), u = hbSc(W, H);
    const feather = (L, col) => { const w = L * 0.2, cw = w * 2.6 + 4; const c = hbCv(cw, L + 4, x => { x.translate(cw / 2, L + 2);
      const P = () => { x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(w * 0.9, -L * 0.25, w * 1.2, -L * 0.8, 0, -L); x.bezierCurveTo(-w * 1.2, -L * 0.8, -w * 0.9, -L * 0.25, 0, 0); };
      const gr = x.createLinearGradient(0, 0, 0, -L); gr.addColorStop(0, fxShade(col, 0.7)); gr.addColorStop(0.5, col); gr.addColorStop(1, fxShade(col, 1.08)); x.fillStyle = gr; P(); x.fill();
      x.save(); P(); x.clip(); x.fillStyle = fxShade(col, 0.68); x.fillRect(-w * 2, -L * 1.1, w * 4, L * 0.2); x.fillStyle = "rgba(255,246,225,.55)"; x.fillRect(-w * 2, -L * 0.92, w * 4, L * 0.035);
      x.strokeStyle = "rgba(255,255,255,.14)"; x.lineWidth = 1; for (let i = 1; i < 7; i++) { x.beginPath(); x.moveTo(0, -L * i * 0.12); x.lineTo(w * 1.2, -L * (i * 0.12 + 0.1)); x.moveTo(0, -L * i * 0.12); x.lineTo(-w * 1.2, -L * (i * 0.12 + 0.1)); x.stroke(); } x.restore();
      x.strokeStyle = fxShade(col, 0.62); x.lineWidth = Math.max(1, w * 0.07); x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -L * 0.9); x.stroke(); x.lineWidth = 1; P(); x.stroke(); }); c._w = cw; c._L = L; return c; };
    // three layered rows: long rust and brown at the back, gold in the middle, short cream in front
    const N = ph ? 7 : 9, A = 1.38, rows = [[N, 2.35, ["#B8461E", "#7A4322"]], [N - 1, 1.8, ["#E3A23A", "#D2862A"]], [N - 2, 1.32, ["#F3DFB5", "#E8C98E"]]];
    const fe = []; rows.forEach(([n, k, cols], r) => { const sp = cols.map(c => feather(rb * k, c)); for (let i = 0; i < n; i++) { const t = n > 1 ? i / (n - 1) : 0.5, o = Math.abs(t - 0.5) * (n - 1);
      fe.push({r, an: (-1 + 2 * t) * A * (1 - r * 0.06), spr: sp[i % 2], t0: 24 + r * 16 + o * 6 + (t < 0.5 ? 0 : 3)}); } });
    const body = hbCv(rb * 2.6, rb * 2.6, x => { x.translate(rb * 1.3, rb * 1.3); const gr = x.createRadialGradient(-0.3 * rb, -0.35 * rb, 0, 0, 0, rb); gr.addColorStop(0, "#A8693E"); gr.addColorStop(1, "#6A3B1E"); x.fillStyle = gr; x.beginPath(); x.arc(0, 0, rb, 0, 6.3); x.fill();
      x.strokeStyle = "rgba(255,225,180,.22)"; x.lineWidth = Math.max(1, rb * 0.025); for (let j = 0; j < 3; j++) for (let i = -2; i <= 2; i++) { const cx = i * 0.24 * rb + (j % 2) * 0.12 * rb, cy = (0.05 + j * 0.2) * rb; x.beginPath(); x.arc(cx, cy, 0.12 * rb, 0.3, Math.PI - 0.3); x.stroke(); }
      [-1, 1].forEach(s => { x.save(); x.translate(s * 0.72 * rb, 0.12 * rb); x.rotate(s * -0.35); const wg = x.createLinearGradient(0, -0.6 * rb, 0, 0.6 * rb); wg.addColorStop(0, "#6E3C1C"); wg.addColorStop(1, "#4E2810"); x.fillStyle = wg;
        x.beginPath(); x.moveTo(0, -0.55 * rb); x.bezierCurveTo(s * 0.42 * rb, -0.4 * rb, s * 0.4 * rb, 0.3 * rb, s * 0.05 * rb, 0.62 * rb); x.bezierCurveTo(-s * 0.2 * rb, 0.3 * rb, -s * 0.22 * rb, -0.3 * rb, 0, -0.55 * rb); x.fill();
        x.strokeStyle = "rgba(255,210,160,.25)"; [0, 0.2, 0.4].forEach(v => { x.beginPath(); x.moveTo(s * 0.02 * rb, (v - 0.05) * rb); x.quadraticCurveTo(s * 0.14 * rb, (v + 0.02) * rb, s * 0.22 * rb, (v + 0.12) * rb); x.stroke(); }); x.restore(); }); });
    const L = ph ? 18 : 30, shapes = ["maple", "oakleaf", "fallleaf", "maple"], cols = ["#C8561C", "#E07A2E", "#E8A13A", "#B5401A", "#9A5A2A"];
    const leaves = Array.from({length: L}, (_, i) => { const q = (i >> 1) / (L / 2), rr = 0.12 + 0.88 * q + fxR(-0.1, 0.1); return {sh: shapes[i % 4], c: fxPick(cols), s: u * fxR(0.85, 1.25), th: (i % 2) * Math.PI + rr * 4.2 + fxR(-0.35, 0.35), om: 0.042 * (1.25 - 0.55 * rr), rr, lag: q * 14 + fxR(0, 4), spin: fxR(-0.025, 0.025), fr: fxR(0.03, 0.06), ph: fxR(0, 6.3), sink: fxR(0, 1)}; });
    return {ph, rb, u, fe, body, leaves, cx: W / 2, by: H - rb * 1.2, Rg: ph ? W * 0.42 : Math.min(W, H) * 0.34};
  });
  const leafPos = (s, l, f, W, H) => { const e = (f - 6 - l.lag) / 290, gx = W * (-0.3 + 1.6 * e), gy = H * (s.ph ? 0.3 : 0.32) + Math.sin(f * 0.02) * H * 0.05, r = s.Rg * l.rr * (0.55 + 0.45 * fxEase((f - l.lag) / 90)), th = l.th + l.om * f;
    return [gx + Math.cos(th) * r, gy + Math.sin(th) * r * (s.ph ? 0.8 : 0.66) + l.sink * Math.max(0, f - 120) * 0.25, Math.sin(th)]; };
  const leaves = front => (g, f, W, H, d) => { const s = S(W, H, d, f), out = fxOut(f, 225, 296);
    for (const l of s.leaves) { const [x, y, z] = leafPos(s, l, f, W, H); if ((z > 0) !== front || x < -40 || x > W + 40) continue;
      const fl = Math.cos(f * l.fr + l.ph), spr = fxSprite(l.sh, l.c, 0, d, fl < 0), h = spr._half, k = l.s * (0.9 + 0.18 * z);
      g.globalAlpha = out * Math.min(1, (x + 40) / 120) * (front ? 1 : 0.85); g.save(); g.translate(x, y); g.rotate(l.ph + f * l.spin * 2); g.scale(k * Math.max(0.15, Math.abs(fl)), k); g.drawImage(spr, -h, -h, 2 * h, 2 * h); g.restore(); }
    g.globalAlpha = 1; };
  const back = leaves(false), front = leaves(true);
  const draw = (g, f, W, H, d) => { back(g, f, W, H, d); const s = S(W, H, d, f), {rb} = s, out = 1, pop = soft(f / 42);   // the layer fade at the end covers it
    g.save(); g.globalAlpha = out; g.translate(s.cx, s.by + rb * 1.2 * (1 - pop));
    if (d) { const hr = rb * 2.8, hg = g.createRadialGradient(0, -0.4 * rb, 0, 0, -0.4 * rb, hr); hg.addColorStop(0, "rgba(255,190,110,.22)"); hg.addColorStop(1, "rgba(255,190,110,0)"); g.globalAlpha = out * fxEase((f - 20) / 60); g.fillStyle = hg; g.fillRect(-hr, -0.4 * rb - hr, 2 * hr, 2 * hr); g.globalAlpha = out; }
    const bob = Math.sin(f * 0.11) * rb * 0.025;
    const shake = hbBump(f, 104, 150), fy = -0.25 * rb;
    for (const p of s.fe) { const e = soft((f - p.t0) / 30); if (e <= 0) continue; const an = p.an * e + Math.sin(f * 0.05 + p.an) * 0.015 + Math.sin(f * 0.28 + p.an * 1.5) * 0.03 * shake;
      g.save(); g.translate(0, fy + bob * 0.5); g.rotate(an); const k = 0.45 + 0.55 * Math.min(1, e); g.scale(k, k); g.drawImage(p.spr, -p.spr._w / 2, -p.spr._L - 2, p.spr._w, p.spr._L + 4); g.restore(); }
    g.strokeStyle = "#E58A2A"; g.lineWidth = Math.max(2, rb * 0.07); g.lineCap = "round"; [-1, 1].forEach(sd => { g.beginPath(); g.moveTo(sd * 0.3 * rb, 0.8 * rb); g.lineTo(sd * 0.32 * rb, 1.08 * rb); [-0.14, 0, 0.14].forEach(t => { g.moveTo(sd * 0.32 * rb, 1.06 * rb); g.lineTo(sd * 0.32 * rb + t * rb, 1.16 * rb); }); g.stroke(); });
    g.drawImage(s.body, -rb * 1.3, -rb * 1.3 + bob, rb * 2.6, rb * 2.6);
    // head: bobs, and gobbles twice with a gentle side to side wag; the wattle swings softly behind the motion
    const gob = Math.max(hbBump(f, 120, 150), hbBump(f, 196, 226)), hx = Math.sin(f * 0.3) * 0.05 * rb * gob, hy = -1.18 * rb + Math.sin(f * 0.13) * 0.05 * rb + bob * 2, tilt = Math.sin(f * 0.3) * 0.07 * gob + Math.sin(f * 0.04) * 0.05;
    g.fillStyle = "#8A5230"; g.beginPath(); g.ellipse(hx * 0.5, -0.82 * rb + bob, 0.27 * rb, 0.4 * rb, 0, 0, 6.3); g.fill();
    g.save(); g.translate(hx, hy); g.rotate(tilt); const hg = g.createRadialGradient(-0.12 * rb, -0.14 * rb, 0, 0, 0, 0.42 * rb); hg.addColorStop(0, "#B57848"); hg.addColorStop(1, "#86502C"); g.fillStyle = hg; g.beginPath(); g.arc(0, 0, 0.4 * rb, 0, 6.3); g.fill();
    const wa = -Math.sin(f * 0.3 - 0.9) * 0.3 * gob + Math.sin(f * 0.07) * 0.08; g.save(); g.translate(0.05 * rb, 0.1 * rb); g.rotate(wa); g.fillStyle = "#D8384A";
    g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(0.14 * rb, 0.08 * rb, 0.16 * rb, 0.34 * rb, 0.03 * rb, 0.4 * rb); g.bezierCurveTo(-0.11 * rb, 0.38 * rb, -0.08 * rb, 0.12 * rb, 0, 0); g.fill(); g.restore();
    g.fillStyle = "#F2B03A"; g.beginPath(); g.moveTo(-0.11 * rb, 0.02 * rb); g.lineTo(0.11 * rb, 0.02 * rb); g.lineTo(0, 0.22 * rb); g.fill();
    const bl = Math.max(hbBump(f, 150, 158), hbBump(f, 232, 240)); [-1, 1].forEach(sd => { g.fillStyle = "#FFFFFF"; g.beginPath(); g.ellipse(sd * 0.15 * rb, -0.1 * rb, 0.12 * rb, 0.13 * rb * (1 - bl) + 0.01 * rb, 0, 0, 6.3); g.fill();
      if (bl >= 0.5) { g.strokeStyle = "#5A3418"; g.lineWidth = Math.max(1.2, rb * 0.03); g.beginPath(); g.arc(sd * 0.15 * rb, -0.13 * rb, 0.1 * rb, 0.4, Math.PI - 0.4); g.stroke(); }
      if (bl < 0.5) { g.fillStyle = "#2A1A10"; g.beginPath(); g.arc(sd * 0.15 * rb + 0.02 * rb, -0.08 * rb, 0.065 * rb, 0, 6.3); g.fill(); g.fillStyle = "#FFFFFF"; g.beginPath(); g.arc(sd * 0.15 * rb, -0.11 * rb, 0.022 * rb, 0, 6.3); g.fill(); } });
    g.fillStyle = "rgba(240,110,90,.4)"; [-1, 1].forEach(sd => { g.beginPath(); g.ellipse(sd * 0.27 * rb, 0.08 * rb, 0.07 * rb, 0.045 * rb, 0, 0, 6.3); g.fill(); }); g.restore();
    g.restore(); };
  return {draw, over: front}; };

// St. Patrick's: a rainbow arcs over the screen, gold coins spill from its ends
// St. Patrick's: a rainbow grows from the ground on the left, arcs over and comes down to the ground on the right (its feet
// are below the bottom edge, so it never hangs in the air); gold coins spill up where it lands
const hbRainbowR = (W, H) => Math.min(W * 0.46, H * 0.78);
const hbRainbow = (g, f, W, H, d) => { const e = fxEase(f / 55), a = fxEase(f / 20) * (1 - fxEase((f - 170) / 90)); if (a <= 0) return; const R = hbRainbowR(W, H), cx = W / 2, cy = H + R * 0.04, bw = R * 0.06;
  g.lineCap = "butt"; ["#E8504A", "#F28A2E", "#F2C83A", "#4CB86A", "#3D86D6", "#8A5CD0"].forEach((c, i) => { const r = R - i * bw; g.strokeStyle = c;
    g.globalAlpha = a * (d ? 0.22 : 0.2); g.lineWidth = bw * 1.6; g.beginPath(); g.arc(cx, cy, r, Math.PI, Math.PI + Math.PI * e); g.stroke();
    g.globalAlpha = a * (d ? 0.6 : 0.55); g.lineWidth = bw * 1.02; g.beginPath(); g.arc(cx, cy, r, Math.PI, Math.PI + Math.PI * e); g.stroke(); }); };

// Hanukkah: a menorah lights its candles one by one, the helper candle first
const hbMenorah = (g, f, W, H, d) => { const a = fxEase(f / 22) * (1 - fxEase((f - 200) / 70)); if (a <= 0) return;
  const Wm = Math.min(W * 0.78, 400, H * 0.62), st = Wm / 8.6, cx = W / 2, by = H * 0.97, armY = by - st * 4.5, metal = d ? "#E8C46A" : "#B88A1E", lw = Math.max(2, st * 0.14);
  g.globalAlpha = a; const gr = g.createRadialGradient(cx, armY - st, 0, cx, armY - st, Wm * 0.7); gr.addColorStop(0, d ? "rgba(255,190,90,.22)" : "rgba(255,190,90,.16)"); gr.addColorStop(1, "rgba(255,190,90,0)"); g.fillStyle = gr; g.fillRect(cx - Wm, armY - st - Wm * 0.7, Wm * 2, Wm * 1.4);
  g.strokeStyle = metal; g.fillStyle = metal; g.lineWidth = lw; g.lineCap = "round"; g.beginPath(); for (let i = 1; i <= 4; i++) { g.moveTo(cx + i * st, armY); g.arc(cx, armY, i * st, 0, Math.PI); } g.moveTo(cx, armY - st * 0.5); g.lineTo(cx, by - st * 0.3); g.stroke();
  g.beginPath(); g.moveTo(cx - st * 1.2, by); g.quadraticCurveTo(cx, by - st * 0.7, cx + st * 1.2, by); g.closePath(); g.fill();
  for (let i = 0; i < 9; i++) { const sh = i === 4, x = cx + (i - 4) * st, y = sh ? armY - st * 0.55 : armY; g.fillStyle = metal; g.fillRect(x - st * 0.28, y - st * 0.12, st * 0.56, st * 0.2);
    const ch = st * (sh ? 0.95 : 0.85); g.fillStyle = i % 2 ? (d ? "#8FB0FF" : "#3D6AD6") : (d ? "#E6ECFF" : "#7F9FD8"); g.fillRect(x - st * 0.12, y - st * 0.12 - ch, st * 0.24, ch);
    const lt = 10 + (sh ? 0 : (Math.abs(i - 4) * 2 - (i < 4 ? 1 : 0)) * 8), fl = hbBack((f - lt) / 14); if (fl <= 0) continue;
    hbFlame(g, x, y - st * 0.12 - ch - st * 0.02, st / 26 * fl, Math.sin(f * 0.45 + i * 1.7) + 0.5 * Math.sin(f * 1.13 + i)); g.globalAlpha = a; } };

// Diwali: a row of clay diyas lights up from the middle out
const hbDiyaP = new Path2D("M-10 -1.5C-9 4.5 -4 6.4 0 6.4C4 6.4 9 4.5 10 -1.5C11.8 -2.2 12.8 -3.4 13.2 -4.6C10 -3.2 7 -2.2 0 -2.2C-6 -2.2 -9 -2.4 -10 -1.5Z");
const hbDiyas = (g, f, W, H, d) => { const a = fxEase(f / 18) * (1 - fxEase((f - 200) / 70)); if (a <= 0) return; const m = Math.max(4, Math.min(9, Math.round(W / 120))), u = Math.min(W / m * 0.046, hbSc(W, H) * 2), y = H - 9 * u;
  for (let i = 0; i < m; i++) { const x = W * (i + 0.5) / m, ord = Math.abs(i - (m - 1) / 2); g.globalAlpha = a; g.save(); g.translate(x, y); g.scale(u, u); g.fillStyle = "#C8642E"; g.fill(hbDiyaP); g.fillStyle = "#E88A3A"; g.fillRect(-9.4, -2.4, 18.8, 1.4); g.fillStyle = "#F2C24A";
    for (let j = -2; j <= 2; j++) { g.beginPath(); g.arc(j * 3, 2.2, 0.85, 0, 6.3); g.fill(); } g.restore();
    const fl = hbBack((f - 6 - ord * 10) / 14); if (fl > 0) hbFlame(g, x + 0.4 * u, y - 2.6 * u, u * 0.62 * fl, Math.sin(f * 0.5 + i * 2.1) + 0.5 * Math.sin(f * 1.3 + i)); } };

const hbBoth = (...fs) => (g, f, W, H, d) => fs.forEach(fn => { g.save(); fn(g, f, W, H, d); g.restore(); });
Object.assign(THEME_FX, {
  cats: {spawn: (W, H, d, n) => hbPaws(W, H, d, n).concat(fxFall(W, H, n(3), "yarn", ["#E07A8A", "#6FA8E0", "#E8B03A", "#8CC46E"], {vmin: 3, vmax: 5, sway: 0, smin: 15, smax: 20, depth: false}).map(p => Object.assign(p, {g: 0.35, bounce: true, vr: fxR(-0.08, 0.08), delay: Math.round(fxR(10, 60))})), fxTw(W, H, n(10), "heart", d ? ["#FFB3CF"] : ["#E8688A"], {smin: 5, smax: 8, glint: false}))},
  music: {spawn: (W, H, d, n) => hbNotes(W, H, d, n).concat(fxTw(W, H, n(16), "sparkle", d ? ["#FFFFFF", "#FFD1EC"] : ["#8C6FF5", "#C04E9A"], {smin: 3, smax: 6, glow: d ? 8 : 0})), draw: hbStaff},
  reading: {spawn: (W, H, d, n) => Array.from({length: n(14)}, (_, i) => { const l = i % 2 ? 1 : -1; return {shape: "flybook", c: fxPick(d ? ["#E8A08A", "#8FB8E8", "#E8C77A", "#A8D8B0"] : ["#B5563F", "#3D6AD6", "#C9962A", "#3E8A5A"]), x: W / 2 + fxR(-0.05, 0.05) * W, y: H * 0.86, vx: l * fxR(0.5, 2.4), vy: -fxR(2, 3.2), g: 0, drag: 0.996, size: fxR(13, 19), rot: 0, vr: 0, sway: 1.4, swf: fxR(0.03, 0.05), rock: 0.22, flap: fxR(0.18, 0.28), life: 220, delay: Math.round(10 + i * 9 + fxR(0, 6))}; })
    .concat(fxTw(W, H, n(22), "sparkle", d ? ["#FFE08A", "#FFFFFF"] : ["#D9A21E", "#E8B83A"], {smin: 3, smax: 7, glow: d ? 10 : 0, top: 0.8})), draw: (g, f, W, H, d) => { const a = fxEase(f / 18) * (1 - fxEase((f - 170) / 70)); if (a <= 0) return; const bw = Math.min(W * 0.2, 150), cx = W / 2, cy = H * 0.9;
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, bw * 2.2); gr.addColorStop(0, d ? "rgba(255,225,150,.35)" : "rgba(255,200,90,.28)"); gr.addColorStop(1, "rgba(255,225,150,0)"); g.globalAlpha = a; g.fillStyle = gr; g.fillRect(cx - bw * 2.2, cy - bw * 2.2, bw * 4.4, bw * 4.4);
      g.fillStyle = d ? "#8A5A3A" : "#7A3E2E"; g.beginPath(); g.moveTo(cx, cy - bw * 0.08); g.lineTo(cx - bw * 1.06, cy - bw * 0.3); g.lineTo(cx - bw * 1.06, cy + bw * 0.42); g.lineTo(cx, cy + bw * 0.56); g.lineTo(cx + bw * 1.06, cy + bw * 0.42); g.lineTo(cx + bw * 1.06, cy - bw * 0.3); g.fill();
      [-1, 1].forEach(s => { g.fillStyle = s < 0 ? "#FFFCF2" : "#F1EADA"; g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(cx + s * bw * 0.5, cy - bw * 0.36, cx + s * bw, cy - bw * 0.3); g.lineTo(cx + s * bw, cy + bw * 0.36); g.quadraticCurveTo(cx + s * bw * 0.5, cy + bw * 0.28, cx, cy + bw * 0.46); g.fill();
        g.strokeStyle = "rgba(90,80,70,.35)"; g.lineWidth = 1; g.beginPath(); for (let j = 0; j < 5; j++) { const yy = cy - bw * 0.12 + j * bw * 0.1; g.moveTo(cx + s * bw * 0.14, yy); g.quadraticCurveTo(cx + s * bw * 0.5, yy - bw * 0.1, cx + s * bw * 0.86, yy - bw * 0.06); } g.stroke(); }); }},
  knitting: {spawn: (W, H, d, n) => fxRise(W, H, n(16), "heart", d ? ["#FFB3CF", "#F28BB8"] : ["#E8688A", "#F28BB8"], {smin: 7, smax: 11, spread: 120, life: 200}).concat(fxTw(W, H, n(14), "sparkle", d ? ["#FFE08A"] : ["#E8B03A"], {smin: 3, smax: 6})), draw: hbYarn()},
  painting: {spawn: (W, H, d, n) => hbSplats(W, H, d, n).concat(fxBurst(W, H, n(36), "circle", ["#E0463C", "#3D7BE0", "#F2C24A", "#2E9E5B", "#A45CD6"], [[0.12, 1.02], [0.88, 1.02]], {smin: 3.5, smax: 6})), draw: hbBrush()},
  baking: {spawn: (W, H, d, n) => fxFall(W, H, n(80), "sprinkle", ["#FF6FB5", "#5CCB9A", "#A97CF0", "#FFC83D", "#4FB8F0", "#FF8A5C"], {smin: 11, smax: 14, rock: 0.9, sway: 1.2}).concat(fxBurst(W, H, n(9), "cupcake", ["#F7A8C4", "#C9A0E8", "#9FD8C4", "#FFE3A0"], [[0.25, 1.02], [0.75, 1.02]], {smin: 15, smax: 19, g: 0.2}), fxBurst(W, H, n(8), "cookie", ["#D9A066", "#C8894E"], [[0.12, 1.02], [0.88, 1.02], [0.5, 1.04]], {smin: 13, smax: 16, g: 0.2}))},
  gardening: {spawn: (W, H, d, n) => fxFlutter(W, H, n(5), ["#A884F0", "#F28BB8", "#F2C84A", "#6FA8E0"]).concat(hbBees(W, H, d, n), fxTw(W, H, n(18), "circle", d ? ["#FFE98A", "#FFFFFF"] : ["#E8B83A", "#F2C84A"], {smin: 1.6, smax: 3, glow: d ? 8 : 0, vy: -0.3, top: 0.8})), draw: hbGarden()},
  gaming: {spawn: (W, H, d, n) => fxBurst(W, H, n(30), "pcoin", ["#F2C24A"], [[0.2, 1.02], [0.8, 1.02], [0.5, 1.04]], {smin: 11, smax: 14, flip: true, g: 0.16, term: 3}).concat(fxBurst(W, H, n(10), "pheart", ["#FF4F6E"], [[0.3, 1.02], [0.7, 1.02]], {smin: 12, smax: 15, g: 0.16, term: 3}), fxBurst(W, H, n(6), "pstar", ["#FFD23F"], [[0.5, 1.04]], {smin: 14, smax: 17, g: 0.16, term: 3}), fxBurst(W, H, n(10), "pgem", ["#3EC8F0", "#A87CFF", "#4CD98A"], [[0.15, 1.02], [0.85, 1.02]], {smin: 12, smax: 15, g: 0.16, term: 3}), fxTw(W, H, n(26), "pixel", d ? ["#FFFFFF", "#7CE8FF", "#FFD23F"] : ["#7A5AF0", "#2BB0E0", "#F28A2E"], {smin: 2.2, smax: 3.6, glint: true})).map((p, i) => p.shape !== "pixel" && i % 2 ? Object.assign(p, {delay: p.delay + 56}) : p)},
  photography: {len: 300, spawn: (W, H, d, n) => fxTw(W, H, n(12), "sparkle", d ? ["#FFE7A8", "#FFFFFF"] : ["#E8A02A", "#F2B84A"], {smin: 3, smax: 6, glow: d ? 8 : 0, spread: 120}).map(p => Object.assign(p, {delay: p.delay + 50})), draw: hbPhoto()},
  newyear: {len: 340, spawn: (W, H, d, n) => fxFall(W, H, n(20), "confetti", d ? ["#FFD25A", "#FF5FB4", "#45E3D6", "#B49BFF", "#F7E7C6"] : ["#D99A0E", "#D1207F", "#0E9A90", "#6A3FD6", "#C08A30"], {sway: 1.6, flip: true, smin: 6, smax: 9, spread: 50}).map(p => Object.assign(p, {delay: p.delay + 175})),
    draw: fxFirework(d => d ? ["#FFD25A", "#FF4FB0", "#3FE6D8", "#A98BFF", "#F7E7C6", "#FFFFFF"] : ["#C98A0A", "#D1207F", "#0E9A90", "#6A3FD6", "#B07A2A", "#2B2F7A"], {show: true, gold: ["#B87A0A", "#FFC861"], glit: ["#A8740A", "#FFF1C4"]})},
  lunarnewyear: {spawn: (W, H, d, n) => fxRise(W, H, n(12), "lantern", ["#E0463C", "#D6362F", "#F05A46"], {smin: 15, smax: 21, vmin: 1.6, vmax: 2.6, sway: 0.6, rock: 0.12, glow: d ? 16 : 0, life: 250, spread: 70}).concat(fxTw(W, H, n(22), "sparkle", d ? ["#F5C451", "#FFE08A"] : ["#D99A0E", "#E8B83A"], {smin: 3, smax: 7, glow: d ? 10 : 0}), fxFall(W, H, n(22), "flower", ["#F7A8C4", "#FFD1E3", "#F28BB8"], {sway: 1.6, rock: 0.6, smin: 6, smax: 9})),
    draw: fxFirework(d => d ? ["#FF5A4A", "#FFD25A"] : ["#D62F2F", "#D99A0E"], {shells: 4, t0: 20, gap: 32, ymax: 0.34, types: ["peony", "glitter", "peony", "willow"]})},
  valentines: {spawn: (W, H, d, n) => { const m = n(36), R = Math.min(W, H) * 0.019, cx = W / 2, cy = H * 0.42, cols = d ? ["#FF86B5", "#FFB3CF", "#FF5C8A"] : ["#E8466E", "#F27AA8", "#C9265A"];
      return Array.from({length: m}, (_, i) => { const t = i / m * 6.283, x = 16 * Math.pow(Math.sin(t), 3), y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) - 2.5;
        return {shape: "heart", c: fxPick(cols), x: cx + x * R, y: cy + y * R, vx: x * 0.008, vy: 0, g: -fxR(0.008, 0.013), size: fxR(10, 14), rot: fxR(-0.25, 0.25), vr: 0, rock: 0.12, sway: 0, swf: 0.04, life: Math.round(fxR(195, 225)), delay: Math.round(4 + Math.min(t, 6.283 - t) / Math.PI * 46)}; })
        .concat(fxRise(W, H, n(22), "heart", cols, {smin: 6, smax: 10, sway: 1.2, spread: 90, alpha: 0.8}), fxTw(W, H, n(14), "sparkle", d ? ["#FFFFFF", "#FFD6E6"] : ["#F27AA8", "#E8B83A"], {smin: 3, smax: 6, glow: d ? 8 : 0})); }},
  stpatricks: {spawn: (W, H, d, n) => { const R = (hbRainbowR(W, H) - hbRainbowR(W, H) * 0.15) / W; return fxFall(W, H, n(46), "clover", ["#2E9E5B", "#4CC07A", "#1F7A44", "#8FD8A0"], {flip: true, sway: 1.6, smin: 9, smax: 13, spread: 70}).concat(fxBurst(W, H, n(26), "coin", ["#F2C24A", "#E8B030"], [[0.5 + R, 1.02]], {smin: 8, smax: 11, flip: true}).map(p => Object.assign(p, {vy: p.vy * 0.85, delay: p.delay + 52}))); }, draw: hbRainbow},
  easter: {len: 300, spawn: (W, H, d, n) => hbHatchBits(W, H, d, n).concat(fxTw(W, H, n(10), "sparkle", d ? ["#FFE08A", "#FFC8E0", "#D4C2FF"] : ["#F2B84A", "#F28BB8", "#A884F0"], {smin: 4, smax: 7, top: 0.55, glow: d ? 8 : 0, spread: 160})), draw: hbHatch()},
  july4: {len: 340, spawn: (W, H, d, n) => fxFall(W, H, n(20), "star", d ? ["#FF4A4A", "#4F86FF", "#FFFFFF"] : ["#D0202E", "#2457C5", "#1D2F7A"], {sway: 1.2, smin: 7, smax: 10, spread: 60}).map(p => Object.assign(p, {delay: p.delay + 170})),
    draw: fxFirework(d => d ? ["#FF4A4A", "#FFFFFF", "#4F86FF"] : ["#D0202E", "#1D2F7A", "#2457C5"], {show: true, gold: ["#3A4C82", "#E6ECF7"], glit: ["#2B3A6E", "#F2F6FF"]})},
  halloween: {len: 300, spawn: hbNightBits, draw: hbNight()},
  thanksgiving: Object.assign({len: 300, spawn: (W, H, d, n) => fxFall(W, H, n(5), "acorn", ["#B8793A", "#A0662E"], {vmin: 1, vmax: 1.8, sway: 0, smin: 11, smax: 13, depth: false}).map(p => Object.assign(p, {x: W * (Math.random() < 0.5 ? fxR(0.04, 0.28) : fxR(0.72, 0.96)), g: 0.1, bounce: true, vr: fxR(-0.035, 0.035), delay: Math.round(fxR(20, 120))}))
    .concat(fxFall(W, H, n(12), "oakleaf", ["#C8561C", "#E8A13A", "#9A5A2A"], {flip: true, smin: 9, smax: 12, sway: 1.4, vmin: 0.8, vmax: 1.6, spread: 60}).map(p => Object.assign(p, {delay: p.delay + 100, life: 190})))}, hbTurkey()),
  hanukkah: {spawn: (W, H, d, n) => fxTw(W, H, n(22), "stardavid", d ? ["#CFE0FF", "#FFFFFF", "#8FB0FF"] : ["#2F5FB8", "#5A86D6"], {smin: 7, smax: 11, glow: d ? 10 : 0, top: 0.6, spread: 140}).concat(fxBurst(W, H, n(8), "dreidel", ["#3D6AD6", "#5A86D6"], [[0.1, 1.02], [0.9, 1.02]], {smin: 12, smax: 14}), fxBurst(W, H, n(14), "coin", ["#F2C24A", "#E8B030"], [[0.1, 1.02], [0.9, 1.02]], {smin: 8, smax: 11, flip: true})), draw: hbMenorah},
  diwali: {spawn: (W, H, d, n) => fxRise(W, H, n(26), "circle", ["#FFB347", "#FFD86B", "#FF8A3A"], {smin: 1.6, smax: 3.2, sway: 0.8, glow: 10, vmin: 1, vmax: 2.2, spread: 120}).concat(fxBurst(W, H, n(16), "marigold", ["#F29A1E", "#F2C02A", "#E8601C"], [[0.1, 1.02], [0.9, 1.02]], {smin: 9, smax: 12})),
    draw: hbBoth(fxFirework(d => d ? ["#FFB347", "#FF6FB0", "#FFD86B"] : ["#D97A0E", "#C2307A", "#C98A12"], {shells: 4, t0: 26, gap: 30, ymax: 0.34, types: ["peony", "willow", "glitter", "peony"]}), hbDiyas)}
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
  // A photo theme someone made (ph-...) stays theirs after Pro ends; only making or editing one needs Pro
  if (kind === "skin" && typeof id === "string" && id.indexOf("ph-") === 0) return true;
  if (typeof PLAN !== "undefined" && !!PLAN && (PLAN.isPro() || (PLAN.styleGrace && PLAN.styleGrace()))) return true;
  // A Founder keeps the theme made from their suggestion, with or without Pro
  if (kind === "skin" && window.SBEARLY && SBEARLY.keeps(id)) return true;
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
// Test handle (only when a test page sets window.__SB_TEST)
if (window.__SB_TEST) window.__sbOwns = (kind, id) => owns(kind, id);
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
// PRO tags also show on the free weeks of Pro, so people see what they'd lose when those end (PLAN.trialTags)
const tagPro = () => { try { return typeof PLAN !== "undefined" && !!PLAN && typeof PLAN.trialTags === "function" && PLAN.trialTags(); } catch (e) { return false; } };
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
  return row("motion", "✨", "Background Animations", "Moving artwork and little scene details in artwork themes.") + row("celebrate", "🎉", "Completion Animations", "Confetti, fireworks or the theme's own animation when you finish a task.")
    + row("quotes", "💬", "Daily Quote", "A short motivational quote the first time you open Studyboard each day.")
    + `<button data-act="daily-quote"><span>${STREAK_HIDDEN ? "Today's Quote" : "Today's Quote and Streak"}<span class="sub">${esc(STREAK_HIDDEN ? "See today's quote again" : streakLine())}</span></span></button>`;
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
      ${[["plain", "Free · Plain Colors"], ["world", `${PRO_BADGE} Pro · Around the World`], ["ideas", `${PRO_BADGE} Pro · New Theme Ideas`], ["season", `${PRO_BADGE} Pro · Seasons`], ["pro", `${PRO_BADGE} Pro · Scenes`], ["majors", `${PRO_BADGE} Pro · Fields`], ["hobby", `${PRO_BADGE} Pro · Hobbies`], ["holiday", `${PRO_BADGE} Pro · Holidays`], ["founders", `${PRO_BADGE} Pro · Founder Themes`]].map(([g, t]) => section(t, SKINS.filter(s => (s.group || "plain") === g || (g === "pro" && s.group === "newscenes")), s => `<div class="shop-tile ${cfg.skin === s.id ? "on" : ""}"><div class="skin-pair">${skinPreview(s, false)}${skinPreview(s, true)}</div>${nameRow(s)}${btnFor("skin", s, cfg.skin === s.id)}</div>`)).join("")}`;
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
// The same ownership check as the shop (owns), so Pro stickers don't lock in the grace period while their pack shows as yours
const stkOwns = k => { const i = stkPackInfo((STICKERS[k] || {}).pack); return !i || owns("sticker", i.id); };
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
// The note under a screen point. Where something else covers the board (the sticker tray on a phone), the point is tested against the notes themselves
function stkNoteAt(x, y){
  const el = document.elementFromPoint(x, y), hit = el && el.closest ? el.closest(".nb-board .note") : null;
  if (hit) return hit;
  const sc = document.querySelector(".nb-scroll"); if (sc) { const r = sc.getBoundingClientRect(); if (x < r.left || x > r.right || y < r.top || y > r.bottom) return null; }
  const zk = nbZ(); let best = null, bz = -1e9;
  document.querySelectorAll(".nb-board .note").forEach(n => {
    const r = n.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, w = n.offsetWidth, h = n.offsetHeight;
    const rot = (parseFloat(n.style.getPropertyValue("--rot")) || 0) * Math.PI / 180, dx = (x - cx) / zk, dy = (y - cy) / zk;
    const lx = dx * Math.cos(-rot) - dy * Math.sin(-rot), ly = dx * Math.sin(-rot) + dy * Math.cos(-rot);
    const z = parseInt(getComputedStyle(n).zIndex, 10) || 0;
    if (Math.abs(lx) <= w / 2 && Math.abs(ly) <= h / 2 && z >= bz) { best = n; bz = z; }
  });
  return best;
}
function stkEnd(ok, e){
  const d = sDrag; sDrag = null; if (!d) return;
  // Find the note while the tray is still out of the way, before the drag styling comes off
  const target = ok && d.moved ? stkNoteAt(e.clientX, e.clientY) || d.hover : null;
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
  // On a phone the envelope covers the board, so it stays tucked away once a sticker from it lands
  if (!d.fromNote && window.matchMedia && window.matchMedia("(max-width:700px)").matches) { ui.envOpen = false; try { localStorage.setItem("studyboard:env", "0"); } catch(err) {} }
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
    const g = document.createElement("div"); g.className = "stk stk-ghost sm-skip"; g.innerHTML = stickerSvg(sDrag.k);
    const sz = Math.max(40, Math.min(90, sDrag.size || 48)); g.style.width = g.style.height = sz + "px";
    document.body.appendChild(g); sDrag.ghost = g;
    if (sDrag.el) sDrag.el.style.opacity = "0";
  }
  sDrag.ghost.style.left = e.clientX + "px"; sDrag.ghost.style.top = e.clientY + "px";
  // Over empty cork near the edge of the board, it scrolls so notes further down or across can be reached
  const sc = !stkNoteAt(e.clientX, e.clientY) && document.querySelector(".nb-scroll");
  if (sc) { const r = sc.getBoundingClientRect(); if (e.clientX > r.left && e.clientX < r.right) { if (e.clientY > r.bottom - 60) sc.scrollTop += 10; else if (e.clientY < r.top + 60) sc.scrollTop -= 10; } }
  const t = stkNoteAt(e.clientX, e.clientY); sDrag.hover = t;
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
  // On a phone the sticker drawer rises and fades in when it opens, and sinks away before it closes
  "env-toggle": () => {
    const opening = ui.envOpen === false, env = document.querySelector(".env");
    const r = document.documentElement, glide = env && env.animate && matchMedia("(max-width:639px)").matches && r.dataset.motion !== "static" && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ease = "cubic-bezier(.32,.72,0,1)";
    const flip = () => {
      ui.envOpen = opening; try { localStorage.setItem("studyboard:env", ui.envOpen ? "1" : "0"); } catch(e) {} render();
      const e = glide && opening && document.querySelector(".env:not(.closed)");
      if (e) e.animate([{translate: "0 48px", opacity: 0}, {translate: "0 0", opacity: 1}], {duration: 360, easing: ease});
    };
    if (glide && !opening) { env.animate([{translate: "0 0", opacity: 1}, {translate: "0 48px", opacity: 0}], {duration: 220, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards"}).finished.then(flip, flip); return; }
    flip();
  }
};
// The sticker envelope starts closed; once you open it, it stays the way you left it
try { const v = localStorage.getItem("studyboard:env"); ui.envOpen = v ? v === "1" : false; } catch(e) { ui.envOpen = false; }
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
  "nu-enough": el => { const t = state.tasks[el.dataset.id]; if (!t) return; const n = clone(t); n.history = (n.history || []).concat({at: Date.now(), text: "Enough for today"}).slice(-30); const inv = applyChanges([{kind: "task", id: t.id, after: n}], ""); toast(t.due === todayISO() && t.status !== "done" ? `Okay, moving on from “${t.title}” for today. It's still due today${t.time ? " at " + fmtTime(t.time) : ""}.` : `Okay, moving on from “${t.title}” for today. It stays on your list.`, inv ? () => { applyChanges(inv, null); toast("Undone"); } : undefined); render(); },
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
