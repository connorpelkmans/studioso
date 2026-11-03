/* ===== module: 99-calculator-skins.js: the calculator in the colours of the current theme ===== */
/* The calculator (99-calculator.js) wears the theme that's on: its body, keys, screen and lettering in the theme's colours,
   and a subtle two-tone pattern of the theme's motif scattered over the body. Classic keeps the original graphite look.
   - Eight themes have hand-tuned colours (HAND). Every other theme gets colours worked out from its own palette (derive):
     a soft tinted body ("pastel"), or a deep one for darker themes (DEEP), checked so every label is at least 4.5:1.
   - The pattern is one tone just off the body colour, about 1.07:1 against it, and never strong enough to bring a
     label under 4.5:1. It's drawn once per theme (a seeded random scatter, so it looks the same every time) as one tile
     the size of the calculator, so it doesn't visibly repeat. Synthwave, Classic and the plain colour themes have none. */
var SBCALCSKIN = null;
(() => {
  /* Hand-tuned themes (the approved concepts) */
  const HAND = {
    sakura: {b1: "#fbe6ee", b2: "#f4cfdd", b3: "#e8b4c8", edge: "#c98aa5", brand: "#7a2e52", brand2: "#a8336a", solarbg: "#7a2e52", solar1: "#b04a7a", solar2: "#5c1f3a", lcd1: "#fff6f9", lcd2: "#f6dfe8", lcdink: "#5a2340", lcdframe: "#7a2e52", fn1: "#ffffff", fn2: "#f8e3ec", fnink: "#7a2e52", fnsh: "#c98aa5", md1: "#fde8f0", md2: "#f3d0de", nm1: "#ffffff", nm2: "#fdf0f5", nmink: "#3b1d2b", nmsh: "#d9a3ba", op1: "#fad2e3", op2: "#f2b8cf", opink: "#5a2340", opsh: "#c98aa5", dl1: "#c0487a", dl2: "#b53a6c", dlsh: "#7a2347", eq1: "#b5386b", eq2: "#8f2552", eqsh: "#5a1433", sh1: "#ff9cc3", sh2: "#ef6fa2", shink: "#4a1230", alt: "#8a2452", xbg: "rgba(122,46,82,.1)", xink: "#7a2e52"},
    galaxy: {b1: "#2a2068", b2: "#160f3d", b3: "#0b0820", edge: "#06041a", brand: "#c5bcf5", brand2: "#ffe57a", lcd1: "#1e1848", lcd2: "#151036", lcdink: "#d9d0ff", lcdframe: "#06041a", lcdglow: "0 0 6px rgba(157,134,255,.85)", fn1: "#3b3178", fn2: "#2c2560", fnink: "#ece8ff", fnsh: "#06041a", md1: "#4a3f92", md2: "#372d74", nm1: "#ece8ff", nm2: "#cfc6f7", nmink: "#1e1740", nmsh: "#5b45c9", op1: "#b8a6ff", op2: "#9d86ff", opink: "#120a3a", opsh: "#4a35a8", dl1: "#c93984", dl2: "#b52a73", dlsh: "#6e1645", eq1: "#6b4ee6", eq2: "#5236c9", eqsh: "#2c1f6b", sh1: "#ffe57a", sh2: "#f2c94c", shink: "#2c1f00", alt: "#ffe57a"},
    cafe: {b1: "#7a4e2a", b2: "#5a361b", b3: "#3e2614", edge: "#22140a", brand: "#f4d08a", brand2: "#fff3dc", solarbg: "#22140a", lcd1: "#f8d998", lcd2: "#e6b866", lcdink: "#3a230f", lcdframe: "#22140a", fn1: "#5c3b22", fn2: "#4a2f1c", fnink: "#f5ebdd", fnsh: "#1c110a", md1: "#6e4a2c", md2: "#57391f", nm1: "#fffaf1", nm2: "#efe0c8", nmink: "#2e2016", nmsh: "#a07d5a", op1: "#ebd7c0", op2: "#d9bf9f", opink: "#2e2016", opsh: "#8a6a48", dl1: "#93602f", dl2: "#7a4e24", dlsh: "#3e2614", eq1: "#9a6634", eq2: "#7a4e24", eqsh: "#3e2614", sh1: "#f4d08a", sh2: "#e0b062", shink: "#3a230f", alt: "#f4d08a", tone: "#000000"},
    arcade: {b1: "#1f1440", b2: "#140c28", b3: "#05020d", edge: "#ff2fb3", brand: "#7cf3ff", brand2: "#ff2fb3", solarbg: "#05020d", solar1: "#3a1a5c", solar2: "#160a2a", lcd1: "#120a26", lcd2: "#0a0616", lcdink: "#7cf3ff", lcdframe: "#05020d", lcdglow: "0 0 8px rgba(40,230,255,.9)", fn1: "#1f1440", fn2: "#170f30", fnink: "#ffb3e6", fnsh: "#05020d", md1: "#241848", md2: "#1b1238", keyline: "inset 0 0 0 1px rgba(255,47,179,.65)", nm1: "#241a4a", nm2: "#1a1238", nmink: "#f4eeff", nmsh: "#05020d", op1: "#2a1550", op2: "#1f0f3c", opink: "#28e6ff", opsh: "#05020d", dl1: "#d91795", dl2: "#b00c6c", dlsh: "#5a0638", eq1: "#c40c78", eq2: "#6a1fe0", eqsh: "#2a0a5c", sh1: "#28e6ff", sh2: "#00b8d9", shink: "#05020d", alt: "#28e6ff", xink: "#ff8fd8"},
    forest: {b1: "#3a5c40", b2: "#26402c", b3: "#16241a", edge: "#08110a", brand: "#cfe6c8", brand2: "#e8e06a", lcd1: "#d6ebcf", lcd2: "#b9d8ae", lcdink: "#10200f", lcdframe: "#08110a", fn1: "#3f6a47", fn2: "#2f5236", fnink: "#e6f1e1", fnsh: "#08110a", md1: "#43704b", md2: "#335a3a", nm1: "#f8fbf4", nm2: "#dfe9d6", nmink: "#1d2b1a", nmsh: "#7e9a76", op1: "#cfe6c8", op2: "#b4d4aa", opink: "#1d2b1a", opsh: "#6b8a62", dl1: "#e8e06a", dl2: "#cfc44a", dlink: "#2a2a08", dlsh: "#6a6a1c", eq1: "#2c8249", eq2: "#236b3b", eqsh: "#123a20", sh1: "#e8e06a", sh2: "#cfc44a", shink: "#2a2a08", alt: "#e8e06a", tone: "#000000"},
    ocean: {b1: "#0a7385", b2: "#0a6577", b3: "#0b4f5c", edge: "#04262c", brand: "#ffffff", brand2: "#b8f5ec", lcd1: "#eaf7f8", lcd2: "#c4e7ec", lcdink: "#0b2b33", lcdframe: "#04262c", fn1: "#0e6878", fn2: "#0b5562", fnink: "#e2f5f7", fnsh: "#04262c", md1: "#0f6c7c", md2: "#0b5866", nm1: "#ffffff", nm2: "#e1f0f2", nmink: "#0b2b33", nmsh: "#6fa6ae", op1: "#bfe6ec", op2: "#9fd6de", opink: "#0b2b33", opsh: "#4e8a93", dl1: "#ff9c7a", dl2: "#f07652", dlink: "#4a1a08", dlsh: "#8a3a22", eq1: "#0c7d90", eq2: "#086575", eqsh: "#03333b", sh1: "#9ff0e4", sh2: "#6fd8c8", shink: "#04262c", alt: "#ffffff", xink: "#ffffff"},
    winter: {b1: "#ffffff", b2: "#eaf0f7", b3: "#d4dfec", edge: "#9fb2c9", brand: "#223e6f", brand2: "#3b6fd1", solarbg: "#223e6f", solar1: "#5a74a0", solar2: "#2a3f66", lcd1: "#eef3fa", lcd2: "#d3deec", lcdink: "#14233a", lcdframe: "#3e5f8a", fn1: "#ffffff", fn2: "#e5edf7", fnink: "#223e6f", fnsh: "#9fb2c9", md1: "#f2f6fb", md2: "#dce6f2", nm1: "#ffffff", nm2: "#f2f6fb", nmink: "#14233a", nmsh: "#a9b9cd", op1: "#d9e3ee", op2: "#c3d1e2", opink: "#14233a", opsh: "#8c9fb8", dl1: "#5073b8", dl2: "#4066b2", dlsh: "#223e6f", eq1: "#3b6fd1", eq2: "#2c5ab5", eqsh: "#223e6f", sh1: "#a4c6ff", sh2: "#7fa8ef", shink: "#14233a", alt: "#2a55a8", xbg: "rgba(34,62,111,.08)", xink: "#223e6f", tone: "#3b6fd1"},
    lemonade: {b1: "#ffe680", b2: "#ffd23f", b3: "#f2b705", edge: "#9a6b00", brand: "#5c4500", brand2: "#2f6b4f", solarbg: "#5c4500", solar1: "#8a6a10", solar2: "#4a3700", lcd1: "#fffdf3", lcd2: "#f6edc4", lcdink: "#2e2a12", lcdframe: "#5c4500", fn1: "#fff6cf", fn2: "#ffe99a", fnink: "#5c4500", fnsh: "#b8860b", md1: "#fff9e0", md2: "#ffefb0", nm1: "#ffffff", nm2: "#fffbe8", nmink: "#2e2a12", nmsh: "#c9a227", op1: "#d9f2c7", op2: "#bfe6a8", opink: "#1f4a34", opsh: "#6aa35a", dl1: "#ff9f5a", dl2: "#f07a2e", dlink: "#3d1a00", dlsh: "#9a4a10", eq1: "#2f6b4f", eq2: "#235a40", eqsh: "#1a3f2d", sh1: "#2f6b4f", sh2: "#245a41", shink: "#fff", alt: "#1f4a34", xbg: "rgba(92,69,0,.12)", xink: "#5c4500"}
  };
  /* Designed themes: each one's colours picked from what the theme looks like (body, function keys, mode keys, number keys,
     operator keys, DEL and AC, =, SHIFT, the screen and its frame, the small labels, the brand), built into the full set by
     build(), which also makes every key's lettering read. keys: single keys in their own colour (Holi's powder colours). */
  const DESIGN = {
    // Holidays and seasons
    halloween: {body: "#1c1420", fn: "#3a2448", md: "#4a2e5c", nm: "#f3e9dc", op: "#ffb35c", dl: "#e8641c", eq: "#7b3fa8", sh: "#ff8a2a", lcd: "#1c120a", lcdink: "#ffb35c", glow: "0 0 7px rgba(255,140,40,.75)", frame: "#0d080f", alt: "#ff9f45", brand: "#f3e9dc", brand2: "#ff8a2a"},
    newyear: {body: "#141a3a", fn: "#222b5c", md: "#2c3670", nm: "#f4f2ea", op: "#f0d98a", dl: "#c43d6a", eq: "#d4a62a", sh: "#f0d98a", lcd: "#e9ecf8", frame: "#090c1f", alt: "#f0d98a", brand: "#f4f2ea", brand2: "#f0c14b"},
    lunarnewyear: {body: "#b3221e", fn: "#8c1814", md: "#9e1d18", nm: "#fff4e0", op: "#f6c85f", dl: "#2a1714", eq: "#f2b632", sh: "#f6c85f", lcd: "#fff1d6", frame: "#5a0d0a", alt: "#ffd77a", brand: "#ffe6a8", brand2: "#ffd77a"},
    valentines: {body: "#ffd6e0", fn: "#ffffff", md: "#ffe8ee", nm: "#ffffff", op: "#ffb3c6", dl: "#d81b4a", eq: "#9c1036", sh: "#ff7aa2", lcd: "#fff0f4", frame: "#9c1036", alt: "#9c1036", brand: "#9c1036", brand2: "#d81b4a"},
    stpatricks: {body: "#1f7a3f", fn: "#17602f", md: "#1d6e38", nm: "#f4fbef", op: "#c9ecb4", dl: "#f08a2c", eq: "#f2c230", sh: "#c9ecb4", lcd: "#e9f7e1", frame: "#0f3d20", alt: "#f2d470", brand: "#f4fbef", brand2: "#f2c230"},
    easter: {body: "#e9e0f7", fn: "#fff9d6", md: "#dff3e6", nm: "#ffffff", op: "#cfe9ff", dl: "#f5a3c0", eq: "#8f6fd6", sh: "#ffe27a", lcd: "#fffdf2", frame: "#6b55a8", alt: "#5b45a0", brand: "#5b45a0", brand2: "#c2457a"},
    july4: {body: "#1f2f63", fn: "#2a3d7a", md: "#34488a", nm: "#ffffff", op: "#dfe6f5", dl: "#f4f6fb", dlink: "#b81f30", eq: "#c8283a", sh: "#e9eef8", lcd: "#f3f5fb", frame: "#0f1838", alt: "#ffffff", brand: "#ffffff", brand2: "#ff6b78"},
    thanksgiving: {body: "#8a4a1f", fn: "#6e3a16", md: "#7a4219", nm: "#fbf0dc", op: "#f2c98a", dl: "#c9561c", eq: "#5a6b2a", sh: "#f2b04a", lcd: "#fbe8c4", frame: "#3e1f0b", alt: "#f7d08a", brand: "#fbf0dc", brand2: "#f2b04a"},
    hanukkah: {body: "#1e3f8f", fn: "#284c9e", md: "#3157ab", nm: "#f5f7fc", op: "#c9d6f2", dl: "#e8c45a", eq: "#c8cfdd", sh: "#e8c45a", lcd: "#eef3fc", frame: "#0f2257", alt: "#e8d590", brand: "#f5f7fc", brand2: "#e8c45a"},
    xmas: {body: "#1e5a35", fn: "#174a2b", md: "#1b5331", nm: "#fff8ec", op: "#e9dcc0", dl: "#c8283a", eq: "#e2b33c", sh: "#c8283a", lcd: "#fff4e0", frame: "#0d2c19", alt: "#f4d27a", brand: "#fff8ec", brand2: "#f4d27a"},
    diwali: {body: "#7a1f52", fn: "#5e1640", md: "#6a1a48", nm: "#fff6e6", op: "#ffcf70", dl: "#ff8a1e", eq: "#f2b632", sh: "#ffcf70", lcd: "#fff1d8", frame: "#3d0b28", alt: "#ffd27a", brand: "#fff1d8", brand2: "#ffb347"},
    ramadan: {body: "#14244a", fn: "#1f3263", md: "#263c74", nm: "#f7f1e3", op: "#e8d9a8", dl: "#2f8f86", eq: "#d4a62a", sh: "#e8d9a8", lcd: "#f6efdc", frame: "#0a1530", alt: "#e9cf86", brand: "#f7f1e3", brand2: "#e9cf86"},
    holi: {body: "#fbf7ff", fn: "#ffffff", md: "#f3ecff", nm: "#ffffff", op: "#ffffff", dl: "#8e44f0", eq: "#ff7a1a", sh: "#ff4fa3", lcd: "#fffaf0", frame: "#5b2a86", alt: "#5b2a86", brand: "#5b2a86", brand2: "#d6267a", tone: "#8e44f0",
      keys: {mul: "#ff4fa3", div: "#ffd23f", add: "#3fd17a", sub: "#3fa9ff"}},
    midautumn: {body: "#2a2350", fn: "#352d63", md: "#3f3672", nm: "#fff6e0", op: "#f6d58a", dl: "#d9452f", eq: "#f2c14b", sh: "#f6d58a", lcd: "#fff3d6", frame: "#15112b", alt: "#f6d58a", brand: "#fff6e0", brand2: "#f2c14b"},
    diadelosmuertos: {body: "#2b1a3d", fn: "#3a2452", md: "#44295f", nm: "#fff3e6", op: "#ff9d2e", dl: "#e8327a", eq: "#20a39e", sh: "#ff9d2e", lcd: "#fff1e0", frame: "#120b1d", alt: "#ffb347", brand: "#fff3e6", brand2: "#ff6fb0"},
    spring: {body: "#e6f4da", fn: "#ffffff", md: "#f4fbee", nm: "#ffffff", op: "#ffd6e3", dl: "#e85d8a", eq: "#4e9a3e", sh: "#ffe27a", lcd: "#fbfff6", frame: "#2f5128", alt: "#2f5128", brand: "#2f5128", brand2: "#c23d6c"},
    summer: {body: "#19a7c9", fn: "#148aa8", md: "#179abb", nm: "#fffaf0", op: "#ffe1a6", dl: "#ff7f50", eq: "#ffcc33", sh: "#ffcc33", lcd: "#fffdf5", frame: "#0b5a6e", alt: "#06303d", brand: "#06303d", brand2: "#7a2e10"},
    autumn: {body: "#a84a1c", fn: "#8a3a14", md: "#94401a", nm: "#fff4e6", op: "#f6c27a", dl: "#e8b13a", eq: "#6b2e14", sh: "#f6c27a", lcd: "#fbecd6", frame: "#4a1e08", alt: "#ffd8a0", brand: "#fff4e6", brand2: "#ffcf6b"},
    // World
    japan: {body: "#f6f1e7", fn: "#ffffff", md: "#f1ebdf", nm: "#ffffff", op: "#e9e2d4", dl: "#d6402b", eq: "#1f1f1f", sh: "#f2a7b8", lcd: "#fbf8f1", frame: "#1f1f1f", alt: "#b8321f", brand: "#1f1f1f", brand2: "#d6402b", tone: "#d6402b"},
    morocco: {body: "#b5502e", fn: "#933f22", md: "#a04626", nm: "#fbf1e4", op: "#3fa39b", dl: "#2c4fa8", eq: "#e3b04b", sh: "#3fa39b", lcd: "#fbefe0", frame: "#5a2410", alt: "#ffe0b8", brand: "#fbf1e4", brand2: "#ffd68a"},
    italy: {body: "#fbf3df", fn: "#ffffff", md: "#f6edd6", nm: "#ffffff", op: "#ffe17a", dl: "#e0623a", eq: "#2f7fb3", sh: "#a8cf86", lcd: "#fffcf0", frame: "#2a5f86", alt: "#2a5f86", brand: "#2a5f86", brand2: "#c4502b", tone: "#e0a21a"},
    greece: {body: "#f7f9fc", fn: "#ffffff", md: "#eef3fa", nm: "#ffffff", op: "#d6e6f7", dl: "#2f86d6", eq: "#0d4f9e", sh: "#9cc0ea", lcd: "#f2f7fd", frame: "#0d4f9e", alt: "#0d4f9e", brand: "#0d4f9e", brand2: "#2f86d6", tone: "#2f86d6"},
    egypt: {body: "#caa15a", fn: "#b88c45", md: "#c29650", nm: "#fff6e2", op: "#f3e3bd", dl: "#1f5aa8", eq: "#1f8f8a", sh: "#e8c66a", lcd: "#fbf0d6", frame: "#5a3d12", alt: "#3a2608", brand: "#3a2608", brand2: "#1f4a8a"},
    canada: {body: "#b8211a", fn: "#961a14", md: "#a51d16", nm: "#ffffff", op: "#ffe0dc", dl: "#f4f4f4", dlink: "#a01810", eq: "#3bb3c3", sh: "#ffffff", lcd: "#fff5f4", frame: "#6a0f0a", alt: "#ffffff", brand: "#ffffff", brand2: "#ffd6d2"},
    mexico: {body: "#e8931a", fn: "#c4206a", md: "#d6267a", nm: "#fff4e0", op: "#2b5fb8", dl: "#e8402c", eq: "#1f9e8f", sh: "#d6267a", lcd: "#fff6e6", frame: "#6b3a05", alt: "#3a1c00", brand: "#3a1c00", brand2: "#8a1048"},
    brazil: {body: "#1f9e4a", fn: "#188a3f", md: "#1c9444", nm: "#fffbe6", op: "#ffdf3a", dl: "#ffdf3a", eq: "#1f3f9e", sh: "#ffdf3a", lcd: "#fbfff0", frame: "#0d4a22", alt: "#fff1a0", brand: "#fffbe6", brand2: "#ffdf3a"},
    // Pro scenes
    arctic: {body: "#0e1d2b", fn: "#18304a", md: "#1e3a58", nm: "#e4f1fb", op: "#7fe6c0", dl: "#b48cff", eq: "#3cd99a", sh: "#7fe6c0", lcd: "#0a1722", lcdink: "#9ff3d0", glow: "0 0 6px rgba(80,240,180,.6)", frame: "#040b12", alt: "#9ff3d0", brand: "#e4f1fb", brand2: "#7fe6c0"},
    sunset: {body: "#f7a37c", fn: "#fff1e6", md: "#ffe2cc", nm: "#fffaf3", op: "#ffd27a", dl: "#d43f5c", eq: "#5b2a5e", sh: "#ffb08a", lcd: "#fff6ec", frame: "#5b2a5e", alt: "#4a1f4d", brand: "#4a1f4d", brand2: "#8a2440"},
    mint: {body: "#c9f0dd", fn: "#ffffff", md: "#e2f7ec", nm: "#ffffff", op: "#a8e3c6", dl: "#3a2a20", eq: "#0f845f", sh: "#8fdcb6", lcd: "#f6fffb", frame: "#3a2a20", alt: "#0f4c3a", brand: "#0f4c3a", brand2: "#3a2a20"},
    bokeh: {body: "#2a2a4a", fn: "#383866", md: "#42427a", nm: "#f7f6fb", op: "#c9c9f5", dl: "#ff7aa8", eq: "#5b5bd6", sh: "#ffd56b", lcd: "#1a1a33", lcdink: "#f7f6fb", frame: "#0f0f22", alt: "#c9c9f5", brand: "#f7f6fb", brand2: "#ffd56b"},
    neon: {body: "#0c0b22", fn: "#17163d", md: "#1d1c4a", nm: "#eef0ff", op: "#8098ff", dl: "#c84beb", eq: "#3f63ee", sh: "#8098ff", lcd: "#08071a", lcdink: "#99adff", glow: "0 0 8px rgba(128,152,255,.9)", frame: "#000000", alt: "#99adff", brand: "#eef0ff", brand2: "#e07cff"},
    candy: {body: "#fbe3f4", fn: "#ffffff", md: "#f6ecff", nm: "#ffffff", op: "#c9f2e3", dl: "#ff6fb5", eq: "#8e44f0", sh: "#ffd86f", lcd: "#fffbff", frame: "#6a4bc4", alt: "#5b3fa0", brand: "#5b3fa0", brand2: "#c4206a"},
    // Hobbies
    cats: {body: "#f3dcc8", fn: "#ffffff", md: "#f8eadf", nm: "#ffffff", op: "#e9c6a8", dl: "#b5563f", eq: "#7a3f31", sh: "#f2b89a", lcd: "#fffaf5", frame: "#7a3f31", alt: "#5c2c22", brand: "#5c2c22", brand2: "#a04a36"},
    music: {body: "#2a2468", fn: "#352e80", md: "#3d3590", nm: "#f3f2f8", op: "#c8c3f0", dl: "#f2c94c", eq: "#5b4fc9", sh: "#c8c3f0", lcd: "#f3f2f8", frame: "#15123a", alt: "#d8d4f7", brand: "#f3f2f8", brand2: "#f2c94c"},
    reading: {body: "#7d3a40", fn: "#66303a", md: "#70343d", nm: "#f6f2eb", op: "#e3cfb4", dl: "#c9a24a", eq: "#3e2a20", sh: "#e3cfb4", lcd: "#f8f2e4", frame: "#3e1a1e", alt: "#f0dcc0", brand: "#f6f2eb", brand2: "#e0c27a"},
    knitting: {body: "#dfe9d9", fn: "#ffffff", md: "#edf3ea", nm: "#ffffff", op: "#c9dcc2", dl: "#c45a6a", eq: "#4e7f58", sh: "#f2c1a6", lcd: "#fbfdf9", frame: "#39583e", alt: "#2c4630", brand: "#2c4630", brand2: "#a8434f"},
    painting: {body: "#f6f4ef", fn: "#ffffff", md: "#eeeae2", nm: "#ffffff", op: "#ffffff", dl: "#28477b", eq: "#f08a2c", sh: "#f2c230", lcd: "#fffdf8", frame: "#28477b", alt: "#28477b", brand: "#28477b", brand2: "#c43a2f", tone: "#2f66b8",
      keys: {mul: "#e8463a", div: "#f2c230", add: "#2f66b8", sub: "#3fa86a"}},
    baking: {body: "#f6dfe0", fn: "#fff6ec", md: "#fbe9df", nm: "#fffaf3", op: "#f4c9a6", dl: "#bf4d66", eq: "#6b3a24", sh: "#ffb8c8", lcd: "#fffaf3", frame: "#803946", alt: "#6a2a38", brand: "#6a2a38", brand2: "#a8384f"},
    gardening: {body: "#cfe3c3", fn: "#ffffff", md: "#e3efda", nm: "#ffffff", op: "#b7d6a6", dl: "#c9783a", eq: "#2b5631", sh: "#f2c94c", lcd: "#fbfef8", frame: "#2b5631", alt: "#234827", brand: "#234827", brand2: "#9a4f1e"},
    gaming: {body: "#1d1838", fn: "#2b2452", md: "#342b63", nm: "#f3f2fa", op: "#a99cf2", dl: "#ff5a6a", eq: "#3fd17a", sh: "#ffd23f", lcd: "#0f1a12", lcdink: "#9bf28a", glow: "0 0 5px rgba(140,240,120,.6)", frame: "#0b0918", alt: "#c9c0ff", brand: "#f3f2fa", brand2: "#ffd23f"},
    photography: {body: "#2b2b2b", fn: "#3a3a3a", md: "#444444", nm: "#f4f3f1", op: "#d6d2cc", dl: "#b35f14", eq: "#e8e4dc", sh: "#f2a65a", lcd: "#e9ecef", frame: "#111111", alt: "#f0e2cf", brand: "#f4f3f1", brand2: "#f2a65a"},
    film: {body: "#6e1a22", fn: "#571419", md: "#62171e", nm: "#fbf3e6", op: "#e6c27a", dl: "#1f1f1f", eq: "#d4a62a", sh: "#e6c27a", lcd: "#fbf3e6", frame: "#2a0a0d", alt: "#f4d48a", brand: "#fbf3e6", brand2: "#f4d48a"},
    culinary: {body: "#f4efe6", fn: "#ffffff", md: "#ece6db", nm: "#ffffff", op: "#c9e0b8", dl: "#b8643a", eq: "#3f6b3a", sh: "#e3a26f", lcd: "#fffdf8", frame: "#6b3a1e", alt: "#5a2f17", brand: "#5a2f17", brand2: "#9a4f28", tone: "#b8643a"},
    pottery: {body: "#c98a6a", fn: "#b37658", md: "#bd7f60", nm: "#fbf3ea", op: "#e8cdb8", dl: "#3f6b7a", eq: "#7a3e22", sh: "#e8cdb8", lcd: "#fbf3ea", frame: "#5a2e18", alt: "#3a1c0c", brand: "#3a1c0c", brand2: "#24505e"},
    // Majors
    nursing: {body: "#1f3346", fn: "#2a4560", md: "#314f6c", nm: "#f2f6f9", op: "#bfe0e8", dl: "#e8505b", eq: "#4fb3a9", sh: "#f6d48a", lcd: "#eef7f6", frame: "#0e1b26", alt: "#cfe3ec", brand: "#f2f6f9", brand2: "#f6d48a"},
    biology: {body: "#cfeedd", fn: "#ffffff", md: "#e2f6ea", nm: "#ffffff", op: "#b5e6cf", dl: "#e86a8a", eq: "#2a8a6a", sh: "#a6dfe8", lcd: "#f6fffa", frame: "#1d5a46", alt: "#1d4d3d", brand: "#1d4d3d", brand2: "#1f6e54"},
    compsci: {body: "#0f1a1e", fn: "#172a30", md: "#1d343c", nm: "#e6f2f0", op: "#7fe0c0", dl: "#ff6b6b", eq: "#22c38e", sh: "#7fe0c0", lcd: "#07120f", lcdink: "#4cf2a0", glow: "0 0 6px rgba(76,242,160,.7)", frame: "#000000", alt: "#7fe0c0", brand: "#e6f2f0", brand2: "#4cf2a0"},
    engineering: {body: "#1f4f8a", fn: "#2a5c9a", md: "#3266a8", nm: "#f2f6fb", op: "#d9b26a", dl: "#e8853a", eq: "#b8862a", sh: "#d9b26a", lcd: "#eaf2fb", frame: "#0f2a4f", alt: "#e8f0fa", brand: "#f2f6fb", brand2: "#e8c47a"},
    education: {body: "#2f5a3f", fn: "#3a6b4b", md: "#427755", nm: "#fdf8ec", op: "#f2d06a", dl: "#e8463a", eq: "#f2b632", sh: "#f2d06a", lcd: "#fdf8ec", frame: "#1e3a28", alt: "#f6e7b0", brand: "#fdf8ec", brand2: "#f2d06a"},
    justice: {body: "#1a1d2e", fn: "#262a42", md: "#2e334f", nm: "#f0ece4", op: "#c9b38a", dl: "#c8283a", eq: "#c9a24a", sh: "#c9b38a", lcd: "#f3eedf", frame: "#0b0d17", alt: "#e0cfa8", brand: "#f0ece4", brand2: "#e04a5a"},
    chem: {body: "#e6f4f7", fn: "#ffffff", md: "#eef8fa", nm: "#ffffff", op: "#ffffff", dl: "#8e44f0", eq: "#1f8aa8", sh: "#9be3f2", lcd: "#f8feff", frame: "#1d4f5c", alt: "#1d4f5c", brand: "#1d4f5c", brand2: "#7b2fd0", tone: "#1f8aa8",
      keys: {mul: "#ff6fa3", div: "#ffd23f", add: "#4cd18a", sub: "#4fa9ff"}},
    sketchcity: {body: "#f4f1e8", fn: "#ffffff", md: "#ebe7dc", nm: "#ffffff", op: "#e2ddd0", dl: "#3d6fb8", eq: "#2a2a2a", sh: "#f2d06a", lcd: "#fdfcf7", frame: "#2a2a2a", alt: "#2a2a2a", brand: "#2a2a2a", brand2: "#3d6fb8", tone: "#2a2a2a"},
    // Scenes
    koi: {body: "#1f5a4a", fn: "#1a4c3f", md: "#1d5646", nm: "#f3f8f2", op: "#f7a64a", dl: "#e8463a", eq: "#f2f2ea", sh: "#f7a64a", lcd: "#eaf6ef", frame: "#0d2e25", alt: "#cfeedd", brand: "#f3f8f2", brand2: "#f7a64a"},
    jelly: {body: "#10224a", fn: "#1a3264", md: "#213c74", nm: "#eef4ff", op: "#f0a6e6", dl: "#8be8f0", eq: "#c86be0", sh: "#f0a6e6", lcd: "#0a1530", lcdink: "#9ff0ff", glow: "0 0 7px rgba(140,230,255,.8)", frame: "#050b1c", alt: "#b8f0ff", brand: "#eef4ff", brand2: "#f0a6e6"},
    bamboo: {body: "#cfe3b5", fn: "#ffffff", md: "#e2eecf", nm: "#ffffff", op: "#b7d38a", dl: "#6b8a2a", eq: "#2f5a1f", sh: "#e8e08a", lcd: "#fbfef4", frame: "#2f4a1a", alt: "#2a4515", brand: "#2a4515", brand2: "#4f7a1f"},
    lavenderfields: {body: "#d8ccef", fn: "#ffffff", md: "#eae3f8", nm: "#ffffff", op: "#c4b4ea", dl: "#7a5cc9", eq: "#4a3a7a", sh: "#a8d08a", lcd: "#fbf9ff", frame: "#3d2f66", alt: "#3d2f66", brand: "#3d2f66", brand2: "#6a4fc0"},
    rainforest: {body: "#1d4a2a", fn: "#235834", md: "#29643c", nm: "#f1f8ee", op: "#9be07a", dl: "#f2a03a", eq: "#2fa8a0", sh: "#9be07a", lcd: "#eef9ea", frame: "#0c2615", alt: "#c9f0b0", brand: "#f1f8ee", brand2: "#f2c94c"},
    volcano: {body: "#3a2a2a", fn: "#4a3535", md: "#553d3d", nm: "#f6efe8", op: "#f6a65a", dl: "#e8452a", eq: "#ff7a1a", sh: "#ffc35a", lcd: "#2a1712", lcdink: "#ffb04a", glow: "0 0 7px rgba(255,120,40,.8)", frame: "#120a08", alt: "#ffb87a", brand: "#f6efe8", brand2: "#ff9a4a"},
    geology: {body: "#3a3550", fn: "#474063", md: "#524a72", nm: "#f2f0f8", op: "#b9a6f2", dl: "#6fd6e8", eq: "#9a6be0", sh: "#b9a6f2", lcd: "#f4f2fb", frame: "#1a1728", alt: "#d8cff8", brand: "#f2f0f8", brand2: "#9fe6f2"},
    marinebio: {body: "#0f4f5a", fn: "#12606e", md: "#156b7a", nm: "#eef8f6", op: "#e8b94a", dl: "#ff8a5a", eq: "#1a8a9a", sh: "#e8b94a", lcd: "#e8f6f4", frame: "#062a30", alt: "#d8f0ea", brand: "#eef8f6", brand2: "#f2c96a"},
    nighttrain: {body: "#3a1d2a", fn: "#4a2636", md: "#552b3e", nm: "#f6efe4", op: "#d9b26a", dl: "#b8443a", eq: "#c9a24a", sh: "#d9b26a", lcd: "#f6efe0", frame: "#1e0d15", alt: "#e8cf9a", brand: "#f6efe4", brand2: "#e8c47a"},
    greenhouse: {body: "#dceee0", fn: "#ffffff", md: "#e9f5eb", nm: "#ffffff", op: "#b9e0c2", dl: "#2f7a4a", eq: "#1f4a2e", sh: "#9fd6b0", lcd: "#f6fff8", frame: "#1f4a2e", alt: "#1f4a2e", brand: "#1f4a2e", brand2: "#2f7a4a"},
    campfire: {body: "#1e2433", fn: "#2a3246", md: "#323b52", nm: "#f6efe4", op: "#f2a65a", dl: "#e8562a", eq: "#ffb03a", sh: "#ffd27a", lcd: "#fff3dc", frame: "#0c0f17", alt: "#ffcf8a", brand: "#f6efe4", brand2: "#ffb03a"},
    aquarium: {body: "#0f3f6a", fn: "#134a7c", md: "#17558c", nm: "#eef6ff", op: "#8fd6ff", dl: "#ffb03a", eq: "#2fb8d9", sh: "#8fd6ff", lcd: "#e6f6ff", frame: "#06213a", alt: "#cdeeff", brand: "#eef6ff", brand2: "#8fd6ff"},
    // Plain colours: a clean two-tone design, no pattern
    paper: {body: "#f7f7f4", fn: "#ffffff", md: "#efefeb", nm: "#ffffff", op: "#e6e9ee", dl: "#2f6fdb", eq: "#24292f", sh: "#c9d8f5", lcd: "#fdfdfb", frame: "#24292f", alt: "#24292f", brand: "#24292f", brand2: "#2f6fdb"},
    slate: {body: "#5b6b80", fn: "#4a5868", md: "#536274", nm: "#f1f3f6", op: "#cdd6e2", dl: "#9fb4d1", eq: "#2e3a4a", sh: "#cdd6e2", lcd: "#eef1f5", frame: "#2e3a4a", alt: "#e7ecf3", brand: "#f1f3f6", brand2: "#cdd6e2"},
    sand: {body: "#e8d6b8", fn: "#f7ecd8", md: "#efe0c4", nm: "#fffaf1", op: "#dcc39a", dl: "#b07a3b", eq: "#7a5226", sh: "#f3d9a4", lcd: "#fffaf1", frame: "#7a5226", alt: "#5c3d1b", brand: "#5c3d1b", brand2: "#7a4f1c"},
    blush: {body: "#f6d5df", fn: "#ffffff", md: "#fbe6ec", nm: "#ffffff", op: "#efc0cf", dl: "#c24d78", eq: "#622f42", sh: "#f3a7c0", lcd: "#fff6f9", frame: "#622f42", alt: "#622f42", brand: "#622f42", brand2: "#a33d63"},
    lavender: {body: "#ddd3f3", fn: "#ffffff", md: "#ece6fa", nm: "#ffffff", op: "#c9bdee", dl: "#7457c9", eq: "#413369", sh: "#b9a6ec", lcd: "#faf8ff", frame: "#413369", alt: "#413369", brand: "#413369", brand2: "#5f45b8"},
    sky: {body: "#cfe6f7", fn: "#ffffff", md: "#e6f2fb", nm: "#ffffff", op: "#b7d9f2", dl: "#2f7dc4", eq: "#1e4366", sh: "#9cc9ee", lcd: "#f7fbff", frame: "#1e4366", alt: "#1e4366", brand: "#1e4366", brand2: "#24639c"},
    sage: {body: "#d5e6d2", fn: "#ffffff", md: "#e6f0e3", nm: "#ffffff", op: "#bdd8b8", dl: "#4e8a5b", eq: "#2f5e3a", sh: "#a8cba1", lcd: "#f8fcf6", frame: "#2f5e3a", alt: "#2f5e3a", brand: "#2f5e3a", brand2: "#3a6e46"},
    peach: {body: "#ffd9c4", fn: "#ffffff", md: "#ffe9dc", nm: "#ffffff", op: "#ffc4a6", dl: "#e0734a", eq: "#a84a28", sh: "#ffb08a", lcd: "#fffaf6", frame: "#a84a28", alt: "#7a3418", brand: "#7a3418", brand2: "#a8441e"},
    butter: {body: "#b02f46", fn: "#8c2335", md: "#9a2a3c", nm: "#fff1f2", op: "#ffc9d1", dl: "#2a1015", eq: "#fff1f2", sh: "#ffc9d1", lcd: "#fff1f2", frame: "#5a1520", alt: "#ffd6dc", brand: "#fff1f2", brand2: "#ffd6dc"},
    teal: {body: "#1f8a80", fn: "#187068", md: "#1b7c73", nm: "#f0f8f7", op: "#b6e3dd", dl: "#f2a65a", eq: "#174a46", sh: "#b6e3dd", lcd: "#f0f8f7", frame: "#0e3b37", alt: "#dff5f2", brand: "#f0f8f7", brand2: "#b6e3dd"},
    mocha: {body: "#6b4329", fn: "#573522", md: "#613b25", nm: "#f6efe8", op: "#d9bca3", dl: "#c98a5a", eq: "#3e2416", sh: "#d9bca3", lcd: "#f6efe8", frame: "#2e1a0f", alt: "#ecd2bb", brand: "#f6efe8", brand2: "#e0b48c"},
    plum: {body: "#4e264a", fn: "#5e2e59", md: "#693364", nm: "#f8f2f7", op: "#e4bfe0", dl: "#e08ad0", eq: "#8e3b84", sh: "#e4bfe0", lcd: "#f8f2f7", frame: "#2a1228", alt: "#f0d2ec", brand: "#f8f2f7", brand2: "#f0b8e6"},
    indigo: {body: "#272d66", fn: "#323a7e", md: "#3a4390", nm: "#f3f4fb", op: "#c9cdf2", dl: "#f2c94c", eq: "#3f4bb8", sh: "#c9cdf2", lcd: "#f3f4fb", frame: "#12163a", alt: "#d9dcf7", brand: "#f3f4fb", brand2: "#f2c94c"},
  };
  // Themes that look best as a deep-coloured calculator; the rest get a soft tinted one
  const DEEP = new Set(["halloween", "newyear", "neon", "xmas", "gaming", "hanukkah", "arctic", "lunarnewyear", "mocha", "indigo", "plum", "music"]);

  /* Colour helpers (mixHex, hexContrast and ensureContrast are the Style Shop's, 01-style-shop.js) */
  const mix = (a, b, f) => mixHex(a, b, f);
  const cr = (a, b) => hexContrast(a, b);
  const worst = (fg, bgs) => Math.min(...bgs.map(b => cr(fg, b)));
  const fix = (fg, bgs, min) => ensureContrast(fg, bgs, min || 4.6);
  // Deepen a key until its lettering reads (white lettering on a coloured key)
  function deepen(bg, ink, min){ let c = bg; for (let f = 0.04; worst(ink, [c]) < (min || 4.6) && f <= 1; f += 0.04) c = mix(bg, "#000000", f); return c; }
  // The lettering for a key: the theme's dark tone, darkened toward black until it reads, or else white (or black)
  function toward(fg, to, bgs){ for (let f = 0; f <= 1.001; f += 0.05) { const c = mix(fg, to, f); if (worst(c, bgs) >= 4.6) return c; } return null; }
  const inkFor = (bgs, dark) => toward(dark, "#000000", bgs) || toward("#ffffff", "#ffffff", bgs) || "#000000";

  // A design into the full set: gradients, shadows, and lettering that reads on every key
  function build(d){
    const L = hexLum(d.body) > 0.28;
    // a dark body is deepened just enough for light lettering to read on its lightest part
    let base = d.body; if (!L) for (let f = 0.03; f <= 1 && cr("#ffffff", mix(base, "#ffffff", 0.1)) < 5; f += 0.03) base = mix(d.body, "#000000", f);
    const body = [mix(base, "#ffffff", 0.1), base, mix(base, "#000000", 0.16)];
    // a key: its colour, a slightly deeper lower half, lettering that reads (the key deepens a touch if no lettering would), its shadow
    const key = (c, pref) => {
      let c2 = mix(c, "#000000", 0.08), ink = inkFor([c, c2], pref || (hexLum(c) > 0.35 ? mix(d.frame, "#000000", 0.2) : "#ffffff"));
      if (worst(ink, [c, c2]) < 4.6) { c = deepen(c, "#ffffff", 4.9); c2 = mix(c, "#000000", 0.08); ink = "#ffffff"; }
      return [c, c2, ink, mix(c, "#000000", 0.45)]; };
    let fn = key(d.fn), md = key(d.md);
    // function and mode keys share one lettering colour
    if (worst(inkFor([fn[0], fn[1], md[0], md[1]], fn[2]), [fn[0], fn[1], md[0], md[1]]) < 4.6) { fn = key(deepen(fn[0], "#ffffff", 4.9), "#ffffff"); md = key(deepen(md[0], "#ffffff", 4.9), "#ffffff"); }
    const nm = key(d.nm), op = key(d.op), dl = key(d.dl, d.dlink), eq = key(d.eq), sh = key(d.sh), lcd2 = mix(d.lcd, "#000000", 0.06);
    const fnInk = inkFor([fn[0], fn[1], md[0], md[1]], fn[2]);
    const lightOn = c => toward(c, "#ffffff", body) || toward(c, "#000000", body) || "#000000";
    const v = {b1: body[0], b2: body[1], b3: body[2], edge: mix(d.body, "#000000", L ? 0.3 : 0.6),
      brand: lightOn(d.brand), brand2: toward(d.brand2, L ? "#000000" : "#ffffff", [body[0]]) || lightOn(d.brand),
      solarbg: d.frame, solar1: mix(d.frame, "#ffffff", 0.25), solar2: mix(d.frame, "#000000", 0.3),
      lcd1: d.lcd, lcd2, lcdink: inkFor([d.lcd, lcd2], mix(d.frame, "#000000", 0.25)), lcdframe: d.frame,
      fn1: fn[0], fn2: fn[1], fnink: fnInk, fnsh: fn[3], md1: md[0], md2: md[1],
      nm1: nm[0], nm2: nm[1], nmink: nm[2], nmsh: nm[3], op1: op[0], op2: op[1], opink: op[2], opsh: op[3],
      dl1: dl[0], dl2: dl[1], dlink: dl[2], dlsh: dl[3], eq1: eq[0], eq2: eq[1], eqink: eq[2], eqsh: eq[3], sh1: sh[0], sh2: sh[1], shink: sh[2],
      alt: toward(d.alt, L ? "#000000" : "#ffffff", body) || lightOn(d.alt),
      xbg: L ? "rgba(0,0,0,.06)" : "rgba(255,255,255,.12)", xink: L ? mix(d.frame, "#000000", 0.1) : "#f4f4f4",
      // the pattern goes away from the lettering: a shade darker on a dark body, a shade lighter on a light one
      // (the very darkest and very lightest bodies, where that wouldn't show, take the other way)
      tone: d.tone || (L ? (hexLum(base) < 0.8 ? "#ffffff" : mix(d.frame, "#ffffff", 0.1)) : (hexLum(base) > 0.02 ? "#000000" : "#ffffff"))};
    if (d.lcdink) { v.lcdink = toward(d.lcdink, "#ffffff", [d.lcd, lcd2]) || v.lcdink; }
    if (d.glow) v.lcdglow = d.glow;
    if (d.keys) v.keys = Object.fromEntries(Object.entries(d.keys).map(([k, c]) => [k, key(c)]));
    return v;
  }
  function derive(s){
    const L = s.light, A = L[8], D = L[11], mark = L[14] || "#FFF3A3", deep = DEEP.has(s.id);
    if (deep) {
      const b1 = mix(D, "#ffffff", 0.08), b2 = D, b3 = mix(D, "#000000", 0.35), body = [b1, b2, b3];
      const lcd1 = mix(A, "#ffffff", 0.9), lcd2 = mix(A, "#ffffff", 0.8), fn1 = mix(D, "#ffffff", 0.2), fn2 = mix(D, "#ffffff", 0.1), md1 = deepen(mix(D, "#ffffff", 0.28), "#ffffff", 4.8), md2 = deepen(mix(D, "#ffffff", 0.16), "#ffffff", 4.8);
      const op1 = mix(A, "#ffffff", 0.7), op2 = mix(A, "#ffffff", 0.56), dl1 = mark, dl2 = mix(mark, "#000000", 0.1), eq1 = deepen(A, "#ffffff"), sh1 = mark, sh2 = mix(mark, "#000000", 0.12);
      return {b1, b2, b3, edge: mix(D, "#000000", 0.6), brand: fix(mix(A, "#ffffff", 0.75), [b1]), brand2: fix(mix(A, "#ffffff", 0.4), [b1]),
        solarbg: mix(D, "#000000", 0.55), solar1: mix(D, "#ffffff", 0.2), solar2: mix(D, "#000000", 0.4),
        lcd1, lcd2, lcdink: fix(mix(D, "#000000", 0.5), [lcd1, lcd2]), lcdframe: mix(D, "#000000", 0.6),
        fn1, fn2, fnink: toward(mix(A, "#ffffff", 0.9), "#ffffff", [fn1, fn2, md1, md2]) || "#ffffff", fnsh: mix(D, "#000000", 0.6), md1, md2,
        nm1: "#ffffff", nm2: mix(A, "#ffffff", 0.93), nmink: fix(mix(D, "#000000", 0.3), ["#ffffff", mix(A, "#ffffff", 0.93)]), nmsh: mix(D, "#000000", 0.2),
        op1, op2, opink: fix(mix(D, "#000000", 0.3), [op1, op2]), opsh: mix(D, "#000000", 0.3),
        dl1, dl2, dlink: inkFor([dl1, dl2], mix(D, "#000000", 0.3)), dlsh: mix(mark, "#000000", 0.45),
        eq1, eq2: mix(eq1, "#000000", 0.12), eqink: "#ffffff", eqsh: mix(eq1, "#000000", 0.5),
        sh1, sh2, shink: inkFor([sh1, sh2], mix(D, "#000000", 0.3)), alt: fix(mix(A, "#ffffff", 0.6), body),
        xbg: "rgba(255,255,255,.12)", xink: fix("#f2f2f2", [b1]), tone: "#ffffff"};
    }
    const b1 = mix(A, "#ffffff", 0.86), b2 = mix(A, "#ffffff", 0.78), b3 = mix(A, "#ffffff", 0.68), body = [b1, b2, b3];
    const lcd1 = mix(A, "#ffffff", 0.95), lcd2 = mix(A, "#ffffff", 0.88), fn2 = mix(A, "#ffffff", 0.9), md1 = mix(A, "#ffffff", 0.93), md2 = mix(A, "#ffffff", 0.84);
    const op1 = mix(A, "#ffffff", 0.8), op2 = mix(A, "#ffffff", 0.7), dl1 = deepen(A, "#ffffff"), eq1 = deepen(D, "#ffffff"), sh1 = mix(A, "#ffffff", 0.35);
    return {b1, b2, b3, edge: mix(D, "#ffffff", 0.35), brand: fix(D, [b1]), brand2: fix(A, [b1]),
      solarbg: D, solar1: mix(D, "#ffffff", 0.25), solar2: mix(D, "#000000", 0.3),
      lcd1, lcd2, lcdink: fix(mix(D, "#000000", 0.4), [lcd1, lcd2]), lcdframe: D,
      fn1: "#ffffff", fn2, fnink: inkFor(["#ffffff", fn2, md1, md2], D), fnsh: mix(A, "#ffffff", 0.55), md1, md2,
      nm1: "#ffffff", nm2: mix(A, "#ffffff", 0.95), nmink: fix(mix(D, "#000000", 0.3), ["#ffffff", mix(A, "#ffffff", 0.95)]), nmsh: mix(A, "#ffffff", 0.6),
      op1, op2, opink: fix(D, [op1, op2]), opsh: mix(A, "#ffffff", 0.45),
      dl1, dl2: mix(dl1, "#000000", 0.1), dlink: "#ffffff", dlsh: mix(dl1, "#000000", 0.45),
      eq1, eq2: mix(eq1, "#000000", 0.15), eqink: "#ffffff", eqsh: mix(eq1, "#000000", 0.5),
      sh1, sh2: mix(sh1, "#000000", 0.1), shink: inkFor([sh1, mix(sh1, "#000000", 0.1)], mix(D, "#000000", 0.3)), alt: fix(D, body),
      xbg: "rgba(0,0,0,.06)", xink: fix(D, [b1]), tone: "#ffffff"};
  }

  /* Motifs: small shapes drawn in the pattern's one tone (t = tone, a = opacity) */
  const F = (t, a) => `fill='${t}' fill-opacity='${a}'`, ST = (t, a) => `stroke='${t}' stroke-opacity='${a}'`;
  const ring = (n, f) => Array.from({length: n}, (_, i) => f(i * 360 / n)).join("");
  const M = {
    blossom: r => (t, a) => `<g ${F(t, a)}>${ring(5, q => `<ellipse cy='${-r * .55}' rx='${r * .42}' ry='${r * .55}' transform='rotate(${q})'/>`)}</g>`,
    petal: () => (t, a) => `<path d='M0-5C3-5 5-1 3 3 2 5-2 5-3 3-5-1-3-5 0-5Z' ${F(t, a)}/>`,
    star: r => (t, a) => `<path d='M0-${r}L${r * .28} -${r * .28} ${r} 0 ${r * .28} ${r * .28} 0 ${r} -${r * .28} ${r * .28} -${r} 0 -${r * .28} -${r * .28}Z' ${F(t, a)}/>`,
    dot: r => (t, a) => `<circle r='${r}' ${F(t, a)}/>`,
    ringO: r => (t, a) => `<circle r='${r}' fill='none' ${ST(t, a)} stroke-width='1.6'/>`,
    bean: () => (t, a) => `<ellipse rx='5' ry='7' ${F(t, a)}/><path d='M-1-6q3 6 0 12' fill='none' ${ST(t, a)} stroke-width='1.2'/>`,
    pine: h => (t, a) => { const w = h * .55; return `<path d='M0 ${-h}L${w * .5} ${-h * .5}H${w * .28}L${w * .62} ${-h * .15}H${w * .32}L${w * .7} 0H${-w * .7}L${-w * .32} ${-h * .15}H${-w * .62}L${-w * .28} ${-h * .5}H${-w * .5}Z' ${F(t, a)}/>`; },
    wave: () => (t, a) => `<path d='M-18 0q4.5-6 9 0t9 0 9 0 9 0' fill='none' ${ST(t, a)} stroke-width='1.6' stroke-linecap='round'/>`,
    flake: () => (t, a) => `<g ${ST(t, a)} stroke-width='1.6' stroke-linecap='round' fill='none'>${ring(6, q => `<path transform='rotate(${q})' d='M0 0V-9M0-5.5l-3-3M0-5.5l3-3'/>`)}</g>`,
    lemon: r => (t, a) => `<g ${ST(t, a)} fill='none' stroke-width='1.5'><circle r='${r}'/>${ring(8, q => `<path d='M0 0L${(r * .8 * Math.cos(q * Math.PI / 180)).toFixed(1)} ${(r * .8 * Math.sin(q * Math.PI / 180)).toFixed(1)}'/>`)}</g>`,
    leaf: () => (t, a) => `<path d='M-7 0C-3-5 4-5 7 0 4 5-3 5-7 0Z' ${F(t, a)}/>`,
    tulip: () => (t, a) => `<g ${F(t, a)}><path d='M-6-12C-6-4-3 0 0 0S6-4 6-12L3-8 0-13-3-8Z'/><path d='M-.8 0h1.6v9h-1.6z'/></g>`,
    sun: () => (t, a) => `<circle r='4.5' ${F(t, a)}/><g ${ST(t, a)} stroke-width='1.5' stroke-linecap='round'>${ring(8, q => `<path transform='rotate(${q})' d='M0-7v-3'/>`)}</g>`,
    maple: () => (t, a) => `<path d='M0-11 2-6 6-8 5-3 10-2 6 1 8 5 2 3 1 9H-1L-2 3-8 5-6 1-10-2-5-3-6-8-2-6Z' ${F(t, a)}/>`,
    bulb: () => (t, a) => `<g ${F(t, a)}><ellipse cy='2' rx='4' ry='6'/><rect x='-2.2' y='-7' width='4.4' height='4' rx='1'/></g>`,
    shell: () => (t, a) => `<path d='M0-8C-6-8-9-1-8 6H8C9-1 6-8 0-8Z' ${F(t, a)}/>`,
    starfish: () => (t, a) => `<path d='M0-9 2.4-3 9-3 3.8 1 5.6 8 0 3.8-5.6 8-3.8 1-9-3-2.4-3Z' ${F(t, a)}/>`,
    candy: () => (t, a) => `<g ${F(t, a)}><ellipse rx='6' ry='4.5'/><path d='M-6 0-11-4V4ZM6 0 11-4V4Z'/></g>`,
    paw: () => (t, a) => `<g ${F(t, a)}><ellipse cy='3' rx='4.5' ry='3.6'/><circle cx='-5' cy='-3' r='1.8'/><circle cx='-1.8' cy='-6' r='1.8'/><circle cx='1.8' cy='-6' r='1.8'/><circle cx='5' cy='-3' r='1.8'/></g>`,
    yarn: r => (t, a) => `<circle r='${r}' ${F(t, a)}/><path d='M${-r * .7} ${-r * .3}q${r * .7} ${r * .6} ${r * 1.4} 0M${-r * .6} ${r * .4}q${r * .6} ${-r * .5} ${r * 1.2} 0' fill='none' ${ST(t, a)} stroke-width='1'/>`,
    note: () => (t, a) => `<g ${F(t, a)}><ellipse cx='-2' cy='5' rx='3.4' ry='2.5' transform='rotate(-20 -2 5)'/><rect x='.8' y='-8' width='1.6' height='13'/><path d='M2.4-8c3 1 4.5 3 4 6-1-2-2.4-3-4-3Z'/></g>`,
    book: () => (t, a) => `<g ${F(t, a)}><path d='M-8-6C-5-7-2-7 0-5V7C-2 5-5 5-8 6Z'/><path d='M8-6C5-7 2-7 0-5V7C2 5 5 5 8 6Z'/></g>`,
    blob: r => (t, a) => `<path d='M${-r} 0C${-r} ${-r * .8} ${-r * .2} ${-r} ${r * .3} ${-r * .9}S${r} ${-r * .2} ${r * .8} ${r * .4}${-r * .1} ${r} ${-r * .5} ${r * .8}${-r} ${r * .5} ${-r} 0Z' ${F(t, a)}/>`,
    cupcake: () => (t, a) => `<g ${F(t, a)}><path d='M-6 0H6L4 8H-4Z'/><path d='M-7 0C-7-6 7-6 7 0Z'/><circle cy='-6' r='1.6'/></g>`,
    sprout: () => (t, a) => `<g ${F(t, a)}><path d='M-.7 8V0h1.4v8Z'/><path d='M0 0C-1-5-6-6-8-5-7-1-3 1 0 0Z'/><path d='M0-1C1-6 6-7 8-6 7-2 3 0 0-1Z'/></g>`,
    plus: () => (t, a) => `<path d='M-2-7h4v5h5v4H2v5h-4V2h-5v-4h5Z' ${F(t, a)}/>`,
    aperture: r => (t, a) => `<circle r='${r}' fill='none' ${ST(t, a)} stroke-width='1.6'/><circle r='${r * .4}' ${F(t, a)}/>`,
    burst: () => (t, a) => `<g ${ST(t, a)} stroke-width='1.4' stroke-linecap='round'>${ring(10, q => `<path transform='rotate(${q})' d='M0-4v-6'/>`)}</g>`,
    lantern: () => (t, a) => `<g ${F(t, a)}><ellipse rx='6' ry='7'/><rect x='-3' y='-9' width='6' height='2'/><rect x='-3' y='7' width='6' height='2'/><path d='M-.5 9h1v5h-1z'/></g>`,
    heart: () => (t, a) => `<path d='M0 7C-8 1-8-6-4-6-2-6-.6-4.6 0-3.4.6-4.6 2-6 4-6 8-6 8 1 0 7Z' ${F(t, a)}/>`,
    shamrock: () => (t, a) => `<g ${F(t, a)}><circle cx='0' cy='-4.5' r='3.6'/><circle cx='-4' cy='1' r='3.6'/><circle cx='4' cy='1' r='3.6'/><path d='M-.6 2h1.2l1.4 8h-1.2Z'/></g>`,
    egg: () => (t, a) => `<path d='M0-8C4-8 6-2 6 2 6 6 3 8 0 8S-6 6-6 2C-6-2-4-8 0-8Z' ${F(t, a)}/>`,
    bat: () => (t, a) => `<path d='M0-2C2-4 6-5 11-3 9-2 9 0 10 2 7 1 5 2 4 4 3 2 1 2 0 3-1 2-3 2-4 4-5 2-7 1-10 2-9 0-9-2-11-3-6-5-2-4 0-2Z' ${F(t, a)}/>`,
    acorn: () => (t, a) => `<g ${F(t, a)}><path d='M-5-1H5C5 5 2 8 0 9-2 8-5 5-5-1Z'/><path d='M-6-1C-6-5 6-5 6-1Z'/><path d='M-.5-5h1v-2h-1z'/></g>`,
    star6: () => (t, a) => `<g fill='none' ${ST(t, a)} stroke-width='1.5' stroke-linejoin='round'><path d='M0-8 7 4H-7Z'/><path d='M0 8-7-4H7Z'/></g>`,
    flame: () => (t, a) => `<g ${F(t, a)}><path d='M0-9C3-5 5-2 5 1 5 4 3 6 0 6S-5 4-5 1C-5-2-3-5 0-9Z'/><path d='M-8 6H8C7 9 4 10 0 10S-7 9-8 6Z'/></g>`,
    crescent: () => (t, a) => `<path d='M2-8A8 8 0 1 0 2 8 6.4 6.4 0 1 1 2-8Z' ${F(t, a)}/>`,
    moon: r => (t, a) => `<circle r='${r}' ${F(t, a)}/>`,
    marigold: () => (t, a) => `<g ${F(t, a)}>${ring(10, q => `<ellipse cy='-5.5' rx='2.4' ry='4' transform='rotate(${q})'/>`)}</g>`,
    flag: () => (t, a) => `<path d='M-6-5H6V3L3 6 0 3-3 6-6 3Z' ${F(t, a)}/>`,
    fish: () => (t, a) => `<path d='M-9 0C-5-6 4-6 7 0 4 6-5 6-9 0ZM7 0 12-5V5Z' ${F(t, a)}/>`,
    lily: r => (t, a) => `<path d='M0 0L${r} -2A${r} ${r} 0 1 1 ${r} 2Z' ${F(t, a)}/>`,
    jelly: () => (t, a) => `<path d='M-7 0C-7-9 7-9 7 0Z' ${F(t, a)}/><path d='M-4 1q-1 4 0 8M0 1q1 4 0 9M4 1q-1 4 0 8' fill='none' ${ST(t, a)} stroke-width='1.2' stroke-linecap='round'/>`,
    bamboo: () => (t, a) => `<g ${F(t, a)}><rect x='-2.2' y='-12' width='4.4' height='11' rx='1.4'/><rect x='-2.2' y='0' width='4.4' height='11' rx='1.4'/></g><path d='M2 -6C6-10 10-9 12-8 9-5 5-5 2-6Z' ${F(t, a)}/>`,
    lavender: () => (t, a) => `<g ${F(t, a)}><path d='M-.6 10V-2h1.2v12Z'/>${[-9, -6, -3, 0].map((y, i) => `<ellipse cx='${i % 2 ? 1.6 : -1.6}' cy='${y}' rx='1.8' ry='2.4'/>`).join("")}</g>`,
    cell: r => (t, a) => `<circle r='${r}' fill='none' ${ST(t, a)} stroke-width='1.5'/><circle cx='${r * .25}' cy='${-r * .2}' r='${r * .35}' ${F(t, a)}/>`,
    chip: () => (t, a) => `<rect x='-5' y='-5' width='10' height='10' rx='1.5' ${F(t, a)}/><g ${ST(t, a)} stroke-width='1.3'>${[-3, 0, 3].map(o => `<path d='M${o} -5v-3M${o} 5v3M-5 ${o}h-3M5 ${o}h3'/>`).join("")}</g>`,
    gear: () => (t, a) => `<g ${F(t, a)}>${ring(8, q => `<rect x='-1.8' y='-9' width='3.6' height='4' rx='.8' transform='rotate(${q})'/>`)}<path fill-rule='evenodd' d='M0-6.5A6.5 6.5 0 1 1 0 6.5 6.5 6.5 0 1 1 0-6.5ZM0-2.4A2.4 2.4 0 1 0 0 2.4 2.4 2.4 0 1 0 0-2.4Z'/></g>`,
    apple: () => (t, a) => `<g ${F(t, a)}><path d='M0-4C-3-7-8-6-8 0S-4 9 0 7C4 9 8 5 8 0S3-7 0-4Z'/><path d='M0-4C1-8 3-9 5-9 4-7 2-5 0-4Z'/></g>`,
    lens: () => (t, a) => `<circle cx='-2' cy='-2' r='5.5' fill='none' ${ST(t, a)} stroke-width='1.8'/><path d='M2 2 8 8' ${ST(t, a)} stroke-width='2.4' stroke-linecap='round'/>`,
    flask: () => (t, a) => `<path d='M-2.5-9H2.5V-3L8 7C8.6 8.3 7.8 9 6.6 9H-6.6C-7.8 9-8.6 8.3-8 7L-2.5-3Z' ${F(t, a)}/>`,
    building: () => (t, a) => `<path fill-rule='evenodd' d='M-6-10H6V10H-6ZM-3.5-7v2.5h2.5V-7ZM1-7v2.5h2.5V-7ZM-3.5-2v2.5h2.5V-2ZM1-2v2.5h2.5V-2ZM-3.5 3v2.5h2.5V3ZM1 3v2.5h2.5V3Z' ${F(t, a)}/>`,
    crystal: () => (t, a) => `<path d='M0-10 5-4 3 9H-3L-5-4Z' ${F(t, a)}/>`,
    mountain: () => (t, a) => `<path d='M-10 7-2-7 2-1 4-4 10 7Z' ${F(t, a)}/>`,
    film: () => (t, a) => `<path fill-rule='evenodd' d='M-6-9H6V9H-6ZM-4-6v4h8v-4ZM-4 2v4h8V2Z' ${F(t, a)}/>`,
    vase: () => (t, a) => `<path d='M-3-9H3V-7C3-5 7-3 7 2S4 9 0 9-7 7-7 2-3-5-3-7Z' ${F(t, a)}/>`,
    star8: () => (t, a) => `<g ${F(t, a)}><rect x='-6' y='-6' width='12' height='12'/><rect x='-6' y='-6' width='12' height='12' transform='rotate(45)'/></g>`,
    pyramid: () => (t, a) => `<path d='M-9 7 0-8 9 7Z' ${F(t, a)}/>`,
    palm: () => (t, a) => `<g ${F(t, a)}>${[-60, -25, 15, 50].map(q => `<path transform='rotate(${q})' d='M0 0C2-4 2-9 0-12-2-9-2-4 0 0Z'/>`).join("")}<path d='M-.7 0h1.4v10h-1.4Z'/></g>`,
    ribbon: () => (t, a) => `<path d='M-14 2C-8-6-2 6 4-2S14 0 16-4' fill='none' ${ST(t, a)} stroke-width='2' stroke-linecap='round'/>`
  };
  function starPath(r){ let d = ""; for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * .45 : r, q = (i * 36 - 90) * Math.PI / 180; d += (i ? "L" : "M") + (rr * Math.cos(q)).toFixed(1) + " " + (rr * Math.sin(q)).toFixed(1); } return d + "Z"; }
  M.star5 = r => (t, a) => `<path d='${starPath(r)}' ${F(t, a)}/>`;
  // Each theme's motifs: [motif, how often, stays upright], and the spacing between them
  const MOTIFS = {
    sakura: [30, [[M.blossom(8), 3], [M.petal(), 4], [M.blossom(4), 1]]],
    galaxy: [26, [[M.star(4), 2, 1], [M.dot(1.2), 5], [M.star(2.6), 2, 1]]],
    cafe: [34, [[M.bean(), 1]]],
    forest: [30, [[M.pine(20), 2, 1], [M.pine(13), 2, 1]]],
    ocean: [32, [[M.wave(), 3, 1], [M.dot(1.4), 1]]],
    winter: [32, [[M.flake(), 3], [M.dot(1.5), 2]]],
    lemonade: [34, [[M.lemon(9), 3], [M.leaf(), 1]]],
    spring: [32, [[M.tulip(), 2, 1], [M.leaf(), 2]]],
    summer: [32, [[M.sun(), 2], [M.wave(), 2, 1]]],
    autumn: [32, [[M.maple(), 3], [M.leaf(), 2]]],
    arctic: [30, [[M.star(4), 2, 1], [M.ribbon(), 1, 1], [M.dot(1.3), 3]]],
    xmas: [32, [[M.bulb(), 3], [M.star5(5), 1, 1]]],
    sunset: [32, [[M.shell(), 2, 1], [M.starfish(), 2]]],
    mint: [30, [[M.leaf(), 3], [M.dot(1.8), 3]]],
    bokeh: [34, [[M.ringO(6), 2], [M.dot(4), 2], [M.ringO(3.5), 2]]],
    neon: [32, [[M.ringO(5), 2], [M.ribbon(), 1, 1], [M.dot(1.4), 3]]],
    candy: [32, [[M.candy(), 3], [M.dot(2), 2]]],
    cats: [32, [[M.paw(), 3], [M.yarn(6), 1]]],
    music: [30, [[M.note(), 3, 1], [M.dot(1.3), 2]]],
    reading: [32, [[M.book(), 3], [M.dot(1.3), 2]]],
    knitting: [32, [[M.yarn(7), 3], [M.dot(1.3), 2]]],
    painting: [30, [[M.blob(6), 3], [M.dot(2.2), 2]]],
    baking: [32, [[M.cupcake(), 2, 1], [M.dot(1.6), 3]]],
    gardening: [32, [[M.sprout(), 3, 1], [M.leaf(), 2]]],
    gaming: [30, [[M.plus(), 2], [M.ringO(4), 2], [M.dot(2), 2]]],
    photography: [32, [[M.aperture(6), 3], [M.dot(1.4), 2]]],
    newyear: [32, [[M.burst(), 3], [M.dot(1.4), 3]]],
    lunarnewyear: [34, [[M.lantern(), 2, 1], [M.blossom(6), 2]]],
    valentines: [30, [[M.heart(), 3], [M.dot(1.4), 2]]],
    stpatricks: [32, [[M.shamrock(), 3], [M.dot(1.4), 2]]],
    easter: [32, [[M.egg(), 3], [M.tulip(), 1, 1]]],
    july4: [30, [[M.star5(5), 3, 1], [M.dot(1.4), 2]]],
    halloween: [34, [[M.bat(), 2, 1], [M.star5(3.5), 1, 1], [M.dot(1.4), 2]]],
    thanksgiving: [32, [[M.maple(), 2], [M.acorn(), 2, 1]]],
    hanukkah: [32, [[M.star6(), 3], [M.dot(1.4), 2]]],
    diwali: [32, [[M.flame(), 2, 1], [M.blossom(6), 2]]],
    ramadan: [34, [[M.crescent(), 2], [M.star5(3.5), 2, 1], [M.lantern(), 1, 1]]],
    holi: [30, [[M.blob(6), 3], [M.dot(2.4), 3]]],
    midautumn: [34, [[M.moon(6), 1], [M.lantern(), 2, 1], [M.dot(1.4), 2]]],
    diadelosmuertos: [32, [[M.marigold(), 3], [M.flag(), 2, 1]]],
    koi: [34, [[M.fish(), 2], [M.lily(7), 2]]],
    jelly: [34, [[M.jelly(), 2, 1], [M.dot(1.6), 3]]],
    bamboo: [32, [[M.bamboo(), 2, 1], [M.leaf(), 2]]],
    lavenderfields: [30, [[M.lavender(), 3, 1], [M.dot(1.2), 1]]],
    nursing: [32, [[M.plus(), 2], [M.heart(), 2]]],
    biology: [30, [[M.cell(6), 3], [M.dot(1.6), 2]]],
    compsci: [32, [[M.chip(), 2], [M.dot(1.6), 3]]],
    engineering: [34, [[M.gear(), 3], [M.dot(1.4), 1]]],
    education: [32, [[M.apple(), 2, 1], [M.star5(3.5), 2, 1]]],
    justice: [34, [[M.lens(), 2], [M.dot(1.4), 2]]],
    chem: [32, [[M.flask(), 2, 1], [M.ringO(3), 3]]],
    sketchcity: [34, [[M.building(), 3, 1], [M.dot(1.2), 1]]],
    rainforest: [32, [[M.leaf(), 3], [M.palm(), 1, 1]]],
    volcano: [34, [[M.mountain(), 2, 1], [M.palm(), 2, 1]]],
    geology: [32, [[M.crystal(), 3], [M.dot(1.4), 2]]],
    film: [32, [[M.film(), 2], [M.star5(3.5), 2, 1]]],
    culinary: [32, [[M.leaf(), 3], [M.dot(1.6), 2]]],
    marinebio: [32, [[M.fish(), 2], [M.wave(), 2, 1]]],
    nighttrain: [32, [[M.crescent(), 1], [M.star(3.5), 3, 1], [M.dot(1.2), 2]]],
    greenhouse: [32, [[M.leaf(), 3], [M.sprout(), 2, 1]]],
    pottery: [34, [[M.vase(), 3, 1], [M.dot(1.4), 1]]],
    campfire: [32, [[M.flame(), 2, 1], [M.star(3), 2, 1]]],
    aquarium: [32, [[M.fish(), 3], [M.ringO(2.6), 3]]],
    japan: [30, [[M.blossom(7), 3], [M.wave(), 1, 1]]],
    morocco: [34, [[M.star8(), 3], [M.dot(1.4), 1]]],
    italy: [34, [[M.lemon(8), 2], [M.sun(), 1]]],
    greece: [32, [[M.wave(), 2, 1], [M.leaf(), 2]]],
    egypt: [34, [[M.pyramid(), 2, 1], [M.sun(), 1]]],
    canada: [32, [[M.maple(), 3], [M.mountain(), 1, 1]]],
    mexico: [32, [[M.flag(), 2, 1], [M.marigold(), 2]]],
    brazil: [32, [[M.palm(), 2, 1], [M.sun(), 1], [M.leaf(), 1]]]
  };

  /* The pattern: a seeded random scatter over one tile the size of the calculator */
  const W = 360, H = 680;
  function rng(seed){ let x = seed >>> 0; return () => { x |= 0; x = x + 0x6D2B79F5 | 0; let t = Math.imul(x ^ x >>> 15, 1 | x); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  // How strong the tone can be: about 1.07:1 against the body, and never pulling a label under 4.5:1
  function strength(v){
    const tone = v.tone || "#ffffff", stops = [v.b1, v.b2, v.b3];
    let a = 0.005; while (a < 0.6 && cr(mix(v.b2, tone, a), v.b2) < 1.07) a += 0.005;
    const reads = a => worst(v.alt, stops.map(s => mix(s, tone, a))) >= 4.55 && [v.brand, v.brand2].every(c => !c || cr(c, mix(v.b1, tone, a)) >= 4.55);
    while (a > 0.005 && !reads(a)) a -= 0.005;
    return Math.round(a * 1000) / 1000;
  }
  const PAT = new Map();
  function pattern(id, v){
    const spec = MOTIFS[id]; if (!spec) return "none";
    if (PAT.has(id)) return PAT.get(id);
    const [r, motifs] = spec, rnd = rng(hash(id)), bag = [], pts = [], tone = v.tone || "#ffffff", a = strength(v);
    motifs.forEach(([m, n, up]) => { for (let i = 0; i < n; i++) bag.push([m, up]); });
    for (let i = 0; i < 4000; i++) { const x = rnd() * (W + 20) - 10, y = rnd() * (H + 20) - 10; if (pts.every(p => (p[0] - x) ** 2 + (p[1] - y) ** 2 >= r * r)) pts.push([x, y]); }
    const body = pts.map(([x, y]) => { const [m, up] = bag[Math.floor(rnd() * bag.length)], sc = 0.7 + rnd() * 0.5, rot = up ? rnd() * 24 - 12 : rnd() * 360;
      return `<g transform='translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(0)}) scale(${sc.toFixed(2)})'>${m(tone, a)}</g>`; }).join("");
    const url = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}' viewBox='0 0 ${W} ${H}'>${body}</svg>`)}") 0 0/${W}px ${H}px`;
    PAT.set(id, url); return url;
  }

  /* The theme on now, and its calculator */
  const themeId = () => document.documentElement.dataset.skin || "classic";
  function varsFor(id){
    if (!id || id === "classic") return null;
    if (HAND[id]) return Object.assign({}, HAND[id]);
    if (DESIGN[id]) return build(DESIGN[id]);
    const s = (typeof SKINS !== "undefined" ? SKINS : []).find(x => x.id === id);
    return s && s.light ? derive(s) : null;
  }
  const VARS = ["b1", "b2", "b3", "edge", "brand", "brand2", "solar1", "solar2", "solarbg", "lcd1", "lcd2", "lcdink", "lcdframe", "lcdglow", "fn1", "fn2", "fnink", "fnsh", "md1", "md2",
    "nm1", "nm2", "nmink", "nmsh", "op1", "op2", "opink", "opsh", "dl1", "dl2", "dlink", "dlsh", "eq1", "eq2", "eqink", "eqsh", "sh1", "sh2", "shink", "alt", "xbg", "xink", "keyline", "deco"];
  function apply(el){
    if (!el) return;
    const id = themeId(), v = varsFor(id);
    VARS.forEach(k => el.style.removeProperty("--" + k));
    el.querySelectorAll("[data-cx][style]").forEach(b => b.removeAttribute("style"));
    if (!v) { delete el.dataset.cxskin; return; }
    el.dataset.cxskin = id;
    Object.keys(v).forEach(k => { if (VARS.includes(k)) el.style.setProperty("--" + k, v[k]); });
    // single keys in their own colour
    if (v.keys) Object.entries(v.keys).forEach(([k, [c1, c2, ink, sh]]) => { const b = el.querySelector(`[data-cx="${k}"]`); if (b) b.setAttribute("style", `background:linear-gradient(180deg,${c1},${c2});color:${ink};box-shadow:0 2px 0 ${sh},0 3px 5px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,255,255,.5)`); });
    const p = id === "arcade" ? "none" : pattern(id, v);
    el.style.setProperty("--deco", p);
  }
  SBCALCSKIN = window.SBCALCSKIN = {apply, varsFor, strength, themeId, motifs: id => !!MOTIFS[id], designed: id => !!(HAND[id] || DESIGN[id]),
    list: () => (typeof SKINS !== "undefined" ? SKINS : []).filter(s => s.light).map(s => ({id: s.id, name: s.name, group: s.group || "", desc: s.desc || ""})), ids: () => ["classic"].concat((typeof SKINS !== "undefined" ? SKINS : []).filter(s => s.light).map(s => s.id))};
})();
