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
    cafe: {b1: "#7a4e2a", b2: "#5a361b", b3: "#3e2614", edge: "#22140a", brand: "#f4d08a", brand2: "#fff3dc", solarbg: "#22140a", lcd1: "#f8d998", lcd2: "#e6b866", lcdink: "#3a230f", lcdframe: "#22140a", fn1: "#5c3b22", fn2: "#4a2f1c", fnink: "#f5ebdd", fnsh: "#1c110a", md1: "#6e4a2c", md2: "#57391f", nm1: "#fffaf1", nm2: "#efe0c8", nmink: "#2e2016", nmsh: "#a07d5a", op1: "#ebd7c0", op2: "#d9bf9f", opink: "#2e2016", opsh: "#8a6a48", dl1: "#93602f", dl2: "#7a4e24", dlsh: "#3e2614", eq1: "#9a6634", eq2: "#7a4e24", eqsh: "#3e2614", sh1: "#f4d08a", sh2: "#e0b062", shink: "#3a230f", alt: "#f4d08a"},
    arcade: {b1: "#1f1440", b2: "#140c28", b3: "#05020d", edge: "#ff2fb3", brand: "#7cf3ff", brand2: "#ff2fb3", solarbg: "#05020d", solar1: "#3a1a5c", solar2: "#160a2a", lcd1: "#120a26", lcd2: "#0a0616", lcdink: "#7cf3ff", lcdframe: "#05020d", lcdglow: "0 0 8px rgba(40,230,255,.9)", fn1: "#1f1440", fn2: "#170f30", fnink: "#ffb3e6", fnsh: "#05020d", md1: "#241848", md2: "#1b1238", keyline: "inset 0 0 0 1px rgba(255,47,179,.65)", nm1: "#241a4a", nm2: "#1a1238", nmink: "#f4eeff", nmsh: "#05020d", op1: "#2a1550", op2: "#1f0f3c", opink: "#28e6ff", opsh: "#05020d", dl1: "#d91795", dl2: "#b00c6c", dlsh: "#5a0638", eq1: "#c40c78", eq2: "#6a1fe0", eqsh: "#2a0a5c", sh1: "#28e6ff", sh2: "#00b8d9", shink: "#05020d", alt: "#28e6ff", xink: "#ff8fd8"},
    forest: {b1: "#3a5c40", b2: "#26402c", b3: "#16241a", edge: "#08110a", brand: "#cfe6c8", brand2: "#e8e06a", lcd1: "#d6ebcf", lcd2: "#b9d8ae", lcdink: "#10200f", lcdframe: "#08110a", fn1: "#3f6a47", fn2: "#2f5236", fnink: "#e6f1e1", fnsh: "#08110a", md1: "#43704b", md2: "#335a3a", nm1: "#f8fbf4", nm2: "#dfe9d6", nmink: "#1d2b1a", nmsh: "#7e9a76", op1: "#cfe6c8", op2: "#b4d4aa", opink: "#1d2b1a", opsh: "#6b8a62", dl1: "#e8e06a", dl2: "#cfc44a", dlink: "#2a2a08", dlsh: "#6a6a1c", eq1: "#2c8249", eq2: "#236b3b", eqsh: "#123a20", sh1: "#e8e06a", sh2: "#cfc44a", shink: "#2a2a08", alt: "#e8e06a"},
    ocean: {b1: "#0a7385", b2: "#0a6577", b3: "#0b4f5c", edge: "#04262c", brand: "#ffffff", brand2: "#b8f5ec", lcd1: "#eaf7f8", lcd2: "#c4e7ec", lcdink: "#0b2b33", lcdframe: "#04262c", fn1: "#0e6878", fn2: "#0b5562", fnink: "#e2f5f7", fnsh: "#04262c", md1: "#0f6c7c", md2: "#0b5866", nm1: "#ffffff", nm2: "#e1f0f2", nmink: "#0b2b33", nmsh: "#6fa6ae", op1: "#bfe6ec", op2: "#9fd6de", opink: "#0b2b33", opsh: "#4e8a93", dl1: "#ff9c7a", dl2: "#f07652", dlink: "#4a1a08", dlsh: "#8a3a22", eq1: "#0c7d90", eq2: "#086575", eqsh: "#03333b", sh1: "#9ff0e4", sh2: "#6fd8c8", shink: "#04262c", alt: "#ffffff", xink: "#ffffff"},
    winter: {b1: "#ffffff", b2: "#eaf0f7", b3: "#d4dfec", edge: "#9fb2c9", brand: "#223e6f", brand2: "#3b6fd1", solarbg: "#223e6f", solar1: "#5a74a0", solar2: "#2a3f66", lcd1: "#eef3fa", lcd2: "#d3deec", lcdink: "#14233a", lcdframe: "#3e5f8a", fn1: "#ffffff", fn2: "#e5edf7", fnink: "#223e6f", fnsh: "#9fb2c9", md1: "#f2f6fb", md2: "#dce6f2", nm1: "#ffffff", nm2: "#f2f6fb", nmink: "#14233a", nmsh: "#a9b9cd", op1: "#d9e3ee", op2: "#c3d1e2", opink: "#14233a", opsh: "#8c9fb8", dl1: "#5073b8", dl2: "#4066b2", dlsh: "#223e6f", eq1: "#3b6fd1", eq2: "#2c5ab5", eqsh: "#223e6f", sh1: "#a4c6ff", sh2: "#7fa8ef", shink: "#14233a", alt: "#2a55a8", xbg: "rgba(34,62,111,.08)", xink: "#223e6f", tone: "#3b6fd1"},
    lemonade: {b1: "#ffe680", b2: "#ffd23f", b3: "#f2b705", edge: "#9a6b00", brand: "#5c4500", brand2: "#2f6b4f", solarbg: "#5c4500", solar1: "#8a6a10", solar2: "#4a3700", lcd1: "#fffdf3", lcd2: "#f6edc4", lcdink: "#2e2a12", lcdframe: "#5c4500", fn1: "#fff6cf", fn2: "#ffe99a", fnink: "#5c4500", fnsh: "#b8860b", md1: "#fff9e0", md2: "#ffefb0", nm1: "#ffffff", nm2: "#fffbe8", nmink: "#2e2a12", nmsh: "#c9a227", op1: "#d9f2c7", op2: "#bfe6a8", opink: "#1f4a34", opsh: "#6aa35a", dl1: "#ff9f5a", dl2: "#f07a2e", dlink: "#3d1a00", dlsh: "#9a4a10", eq1: "#2f6b4f", eq2: "#235a40", eqsh: "#1a3f2d", sh1: "#2f6b4f", sh2: "#245a41", shink: "#fff", alt: "#1f4a34", xbg: "rgba(92,69,0,.12)", xink: "#5c4500"}
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
    const s = (typeof SKINS !== "undefined" ? SKINS : []).find(x => x.id === id);
    return s && s.light ? derive(s) : null;
  }
  const VARS = ["b1", "b2", "b3", "edge", "brand", "brand2", "solar1", "solar2", "solarbg", "lcd1", "lcd2", "lcdink", "lcdframe", "lcdglow", "fn1", "fn2", "fnink", "fnsh", "md1", "md2",
    "nm1", "nm2", "nmink", "nmsh", "op1", "op2", "opink", "opsh", "dl1", "dl2", "dlink", "dlsh", "eq1", "eq2", "eqink", "eqsh", "sh1", "sh2", "shink", "alt", "xbg", "xink", "keyline", "deco"];
  function apply(el){
    if (!el) return;
    const id = themeId(), v = varsFor(id);
    VARS.forEach(k => el.style.removeProperty("--" + k));
    if (!v) { delete el.dataset.cxskin; return; }
    el.dataset.cxskin = id;
    Object.keys(v).forEach(k => { if (VARS.includes(k)) el.style.setProperty("--" + k, v[k]); });
    const p = id === "arcade" ? "none" : pattern(id, v);
    el.style.setProperty("--deco", p);
  }
  SBCALCSKIN = window.SBCALCSKIN = {apply, varsFor, strength, themeId, motifs: id => !!MOTIFS[id],
    list: () => (typeof SKINS !== "undefined" ? SKINS : []).filter(s => s.light).map(s => ({id: s.id, name: s.name, group: s.group || "", desc: s.desc || ""})), ids: () => ["classic"].concat((typeof SKINS !== "undefined" ? SKINS : []).filter(s => s.light).map(s => s.id))};
})();
