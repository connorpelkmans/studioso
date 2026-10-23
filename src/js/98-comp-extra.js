/* ===== module: 98-comp-extra.js ===== */
/* Extra companions */
var COMP_EXTRA = [];
(() => {
  function MAKE_CAT(K, id){
      const {INK, O, OW, RG, puff} = K;
      const STRIPE = "#5C4838", WHITE = "#FFFDF8", CREAM = "#F6EBDD", PINK = "#FFB6C6", TAN = "#C9AA84", BAND = "#4E433D", WISP = "#D6CCC4";
      const MIR = s => `<g transform="matrix(-1 0 0 1 120 0)">${s}</g>`;
      const blob = (P, fill) => P.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}" stroke="${INK}" stroke-width="6"/>`).join("") + P.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join("");
      const tailFill = (n, x1, y1, x2, y2) => `<defs><linearGradient id="${id}-${n}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="#6A5E57"/><stop offset=".6" stop-color="#887A71"/><stop offset="1" stop-color="#A59890"/></linearGradient></defs>`;
      const furGrad = (n, cx = 0.45, cy = 0.35) => RG(id + "-" + n, [[0, "#ECD8BA"], [0.6, "#CFB08A"], [1, "#A8896A"]], cx, cy, 0.8);
      const HEADD = "M60 33C77 33 86.4 43 87 55.6L90.6 59.4L87.4 61.6L90 66L85.6 67.6C82 75.6 72.6 79.6 60 79.6C47.4 79.6 38 75.6 34.4 67.6L30 66L32.6 61.6L29.4 59.4L33 55.6C33.6 43 43 33 60 33Z";
      const HEAD = `${RG(id + "-h", [[0, "#F0DEC4"], [0.62, "#D5B893"], [1, "#AE8E6A"]], 0.45, 0.4, 0.8)}<path d="${HEADD}" fill="url(#${id}-h)" ${O}/>
        <path d="M53.2 45.4L54.8 39.6L57.6 43.4L60 38.6L62.4 43.4L65.2 39.6L66.8 45.4" fill="none" stroke="#55412F" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" opacity=".92"/>
        <path d="M39.6 47.4q3.6 -1.6 7 0.8M80.4 47.4q-3.6 -1.6 -7 0.8" fill="none" stroke="${STRIPE}" stroke-width="1.8" stroke-linecap="round" opacity=".75"/>
        <path d="M32.8 59.2q4.6 -1.2 8.4 1.2M86.2 59.2q-4.6 -1.2 -8.4 1.2" fill="none" stroke="${STRIPE}" stroke-width="2" stroke-linecap="round" opacity=".85"/>
        <ellipse cx="49.5" cy="62.4" rx="4.6" ry="2" fill="#F5E7D0" opacity=".85"/><ellipse cx="70.5" cy="62.4" rx="4.6" ry="2" fill="#F5E7D0" opacity=".85"/>
        <path d="M60 60.6C55.4 60.2 50.8 62.6 50.8 66.8C50.8 71.6 55.4 74.6 60 78C64.6 74.6 69.2 71.6 69.2 66.8C69.2 62.6 64.6 60.2 60 60.6Z" fill="${WHITE}"/>
        <path d="M39.4 51Q41.4 43 48 39.4" fill="none" stroke="#FFF6E8" stroke-width="3" stroke-linecap="round" opacity=".9"/>`;
      const FACE = `<path d="M57.6 62.6H62.4L60 65.2Z" fill="#F29AAA" ${OW(1.2)}/>`;
      const WHISKERS = `<path d="M46 65.4l-12.6 -1.8M46 68l-12.6 1.6M74 65.4l12.6 -1.8M74 68l12.6 1.6" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" opacity=".2"/>
        <path d="M46 65.4l-12.6 -1.8M46 68l-12.6 1.6M74 65.4l12.6 -1.8M74 68l12.6 1.6" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round"/>`;
      const EAR = (tuft = 6) => `<path d="M37.6 46L39.4 23.6L55 37Z" fill="${TAN}" ${O}/><path d="M41.2 40.6L42 29.6L49.4 36.4Z" fill="${PINK}"/>
        <path d="M42.4 40.6l1 -5.2M45.2 39.8l1.8 -4.4" stroke="${WHITE}" stroke-width="1.3" stroke-linecap="round"/>
        <path d="M37.8 27.4C37 ${23 - tuft * 0.5} 37.6 ${21 - tuft * 0.8} 39 ${22.6 - tuft}C40.6 ${21 - tuft * 0.6} 41.6 ${23.6 - tuft * 0.4} 41.4 27Z" fill="#DCC29C" ${OW(1.5)}/><path d="M39.2 ${25.6 - tuft * 0.6}l0 ${-tuft * 0.5}" stroke="#8C7360" stroke-width="1.1" stroke-linecap="round"/>`;
      const HT = (s, dy) => `translate(60 ${dy}) scale(${s}) translate(-60 0)`;
      const hy = (s, dy, y) => Math.round((dy + s * y) * 100) / 100, hx = (s, x) => Math.round((60 + s * (x - 60)) * 100) / 100;
      const LINES = {
        tap: ["Mrrp! I was guarding the cozy spot for you.", "My tail is fluffier than your notes are long. Almost.", "Slow blink. That means you're doing great.", "I tried to sit on your homework. You may proceed.", "White mittens on, ready to study!", "Purr... one page at a time, friend."],
        pet: ["Purrrr! Right behind the ears!", "Mrrrp! More, please!"],
        hello: ["You're back! I kept the chair warm.", "Mew! I missed you. Mostly."],
        morning: ["Good morning! I already stretched twice.", "Rise and shine! Breakfast, then studying?"],
        night: ["Curling up now. You should rest soon too.", "Night night! My tail makes a great blanket."],
        focus: ["Shh. Loaf mode on. Focusing.", "I'll sit right here and watch you work."],
        done: ["Session done! Big stretch, big yawn!", "That was amazing! Purrs all round!"],
        task: ["Done! My tail is extra floofy now!", "Checked off! Mrrp!", "Another one! Pounce!", "Yes! Worth a happy tail swish!"],
        break: ["Break time! Stretch like a cat!", "Find a sunny spot and rest your eyes!"]
      };
      const EYE = "#8E8A2A";
      const chain = P => { const out = []; for (let i = 0; i < P.length - 1; i++) { const a = P[Math.max(0, i - 1)], b = P[i], c = P[i + 1], d = P[Math.min(P.length - 1, i + 2)];
          const len = Math.hypot(c[0] - b[0], c[1] - b[1]), n = Math.max(2, Math.ceil(len / (0.45 * Math.min(b[2], c[2]))));
          for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t, f = j => 0.5 * ((2 * b[j]) + (-a[j] + c[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * t2 + (-a[j] + 3 * b[j] - 3 * c[j] + d[j]) * t3);
            out.push([f(0), f(1), b[2] + (c[2] - b[2]) * t].map(v => Math.round(v * 10) / 10)); } }
        out.push(P[P.length - 1]);
        const fl = [];
        for (let i = 1; i < out.length - 1; i += 3) { const [x, y, r] = out[i], p = out[i - 1], q = out[i + 1], dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, sd = (i % 2 ? 1 : 0.85);
          fl.push([x + nx * r * 0.7 * sd, y + ny * r * 0.7 * sd, r * 0.45], [x - nx * r * 0.7, y - ny * r * 0.7, r * 0.42]); }
        return out.concat(fl.map(c => c.map(v => Math.round(v * 10) / 10))); };
      const TP = [[80, 101, 6], [87, 103.4, 7.6], [95, 102, 9], [101.4, 96, 9.8], [104.6, 87.6, 10], [104.6, 78.4, 9.4], [101.6, 70.4, 8.2], [97, 65.4, 6.6], [92.6, 63.4, 4.8]];
      const EARC = EAR(0).replace(/<path d="M37\.8 27\.4[\s\S]*$/, "");
      return {
        id, name: "Cosmo", kind: "Fluffy Tabby", pose: "sit", sleepy: true, wearColor: "#6E8297",
        bio: "A fluffy tabby with white mittens and a tail bigger than a pillow.",
        idle: ["tailSwish", "earTwitch", "headTilt"], cheer: "hop", neck: [60, 78],
        parts: {
          tail: {svg: tailFill("t", 86, 108, 104, 62) + blob(chain(TP), `url(#${id}-t)`)
            + `<path d="M91 96.6q3.4 4.4 2.6 10M99.4 91.8q5.4 2.4 7.2 8.4M102.4 83.4q6 0.4 9.6 4.6M101.6 74.8q5.6 -1.2 9.4 1.8" fill="none" stroke="${BAND}" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>
               <path d="M112.6 88q-2.6 -4 -2 -8.6M111.6 75.4q-3.2 -3 -3.6 -7.4M104.4 65.6q-3.4 -1.2 -5.2 -4" fill="none" stroke="${WISP}" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>`, pivot: [80, 100]},
          feet: `<ellipse cx="47" cy="107.6" rx="8.6" ry="4.6" fill="${WHITE}" ${O}/><ellipse cx="73" cy="107.6" rx="8.6" ry="4.6" fill="${WHITE}" ${O}/>
            <path d="M44.6 109.4v-2.2M48.4 109.6v-2.2M70.6 109.6v-2.2M74.4 109.4v-2.2" stroke="#D8CFC6" stroke-width="1.2" stroke-linecap="round"/>`,
          body: `${furGrad("b")}<path d="M60 68C76 68 84 81 84 94C84 106 76 110 60 110C44 110 36 106 36 94C36 81 44 68 60 68Z" fill="url(#${id}-b)" ${O}/>
            <path d="M38.8 88.4q4.2 -2.2 8 0.8M38 95.8q4.6 -2 8.4 1.2M39.8 102.6q4 -1.2 7 1.2M81.2 88.4q-4.2 -2.2 -8 0.8M82 95.8q-4.6 -2 -8.4 1.2M80.2 102.6q-4 -1.2 -7 1.2" fill="none" stroke="${STRIPE}" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>
            <ellipse cx="60" cy="98" rx="11" ry="10.4" fill="${CREAM}"/>
            <path d="${puff(60, 80.6, 12.4, 12, 1.25)}" fill="${WHITE}"/>
            <defs><clipPath id="${id}-cc"><path d="M60 68C76 68 84 81 84 94C84 106 76 110 60 110C44 110 36 106 36 94C36 81 44 68 60 68Z"/></clipPath></defs><path d="M34 76.8Q60 88.6 86 76.8" fill="none" stroke="#6E8297" stroke-width="3.6" clip-path="url(#${id}-cc)"/>
            ${RG(id + "-bell", [[0, "#FFFFFF"], [0.5, "#DDE2E8"], [1, "#9AA3AE"]], 0.38, 0.32, 0.7)}<circle cx="60" cy="85.6" r="3.2" fill="url(#${id}-bell)" ${OW(1.4)}/>
            <path d="M42 90Q42 80 48 75" fill="none" stroke="#FFF6E8" stroke-width="3" stroke-linecap="round" opacity=".9"/>`,
          armL: {svg: `<ellipse cx="50.5" cy="99.6" rx="5.8" ry="7.6" fill="${TAN}" ${O}/><path d="M45 101.6C45.6 106.8 55.4 106.8 56 101.6C55 99.2 46 99.2 45 101.6Z" fill="${WHITE}"/><path d="M48.6 105.4v-2M52.4 105.4v-2" stroke="#D8CFC6" stroke-width="1.1" stroke-linecap="round"/><path d="M47.2 95.6q3.3 -1.4 6.6 0" fill="none" stroke="${STRIPE}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`, pivot: [50.5, 93]},
          armR: {svg: MIR(`<ellipse cx="50.5" cy="99.6" rx="5.8" ry="7.6" fill="${TAN}" ${O}/><path d="M45 101.6C45.6 106.8 55.4 106.8 56 101.6C55 99.2 46 99.2 45 101.6Z" fill="${WHITE}"/><path d="M48.6 105.4v-2M52.4 105.4v-2" stroke="#D8CFC6" stroke-width="1.1" stroke-linecap="round"/><path d="M47.2 95.6q3.3 -1.4 6.6 0" fill="none" stroke="${STRIPE}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`), pivot: [69.5, 93]},
          earL: {svg: EARC, pivot: [46, 40]},
          earR: {svg: MIR(EARC), pivot: [74, 40]},
          head: HEAD + `<path d="M56.8 38.4l-.6 -3.4M60 38l0 -3.8M63.2 38.4l.6 -3.4" fill="none" stroke="#5C4838" stroke-width="1.3" stroke-linecap="round" opacity=".55"/>`, face: FACE, top: WHISKERS
        },
        eyes: {lx: 49.5, rx: 70.5, y: 55.8, r: 5.2, style: "round", color: EYE},
        mouth: {x: 60, y: 67.6, w: 2.8, color: "#3A2A2A", style: "cat"},
        anchors: {top: [60, 34, 0.95], neck: [60, 80, 1], chest: [60, 94, 0.62], back: [84, 88, 0.8], hands: [60, 100, 0.86]},
        lines: LINES
      };
  }
  COMP_EXTRA.push(MAKE_CAT(COMP_KIT, "extra-cosmo"));
})();
