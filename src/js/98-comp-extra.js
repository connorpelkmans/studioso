/* ===== module: 98-comp-extra.js ===== */
/* Extra companions: not part of any theme's set. Each one is offered as one more choice in every theme's companion picker, but only
   to an account that may see the hidden themes (window.SBThemes.all(): all_themes in studyboard_theme_access, see
   supabase-theme-access.sql), so nobody else ever sees them. 98-companion.js reads COMP_EXTRA.
   Cosmo: drawn from photos of the owner's cat (a fluffy brown tabby, white mittens and bib, golden-green eyes, a huge smoky tail). */
var COMP_EXTRA = [];
(() => {
  function MAKE_CAT(K, id){
    const {INK, O, OW, LG, RG, puff} = K;
    const O2 = OW(2.2);
    const TAN = "#B99872", STRIPE = "#3F3129", WHITE = "#FFFDF8", PINK = "#F4B3C0";
    return {
      id, name: "Cosmo", kind: "Fluffy Tabby", pose: "sit", sleepy: true, wearColor: "#7A8C9E",
      bio: "A fluffy tabby with white mittens and a tail bigger than a pillow.",
      idle: ["tailSwish", "earTwitch", "headTilt"], cheer: "hop",
      neck: [60, 78],
      parts: {
        tail: {svg: (() => {
          // a big smoky plume: overlapping circles along the curve make its fluffy outline (outlines first, then one smooth fill on top)
          const P = [[80, 101, 6.4], [87.4, 104, 8.4], [96, 103.4, 10.2], [103.6, 98, 11.4], [108.4, 88.6, 12], [109.4, 77.8, 11.6], [106.2, 67.8, 10.4], [100.6, 60.6, 8.6], [95, 57.4, 6.2]];
          const c = (x, y, r, a) => `<circle cx="${x}" cy="${y}" r="${r}" ${a}/>`;
          return `<g transform="translate(-5 0)"><defs><linearGradient id="${id}-t" gradientUnits="userSpaceOnUse" x1="86" y1="108" x2="112" y2="60"><stop offset="0" stop-color="#4A403B"/><stop offset=".55" stop-color="#5F544E"/><stop offset="1" stop-color="#7C716A"/></linearGradient>
            <radialGradient id="${id}-tf" gradientUnits="userSpaceOnUse" cx="100" cy="84" r="24"><stop offset=".55" stop-color="#B3AAA3" stop-opacity="0"/><stop offset="1" stop-color="#B8AFA8" stop-opacity=".7"/></radialGradient></defs>`
            + P.map(([x, y, r]) => c(x, y, r, `fill="${INK}" stroke="${INK}" stroke-width="6"`)).join("")
            + P.map(([x, y, r]) => c(x, y, r, `fill="url(#${id}-t)"`)).join("")
            + `<path d="M88.6 97.4Q93.6 100.6 93.4 106.4M99 94.6Q104.6 97.6 105.6 104M103.4 85.6Q109.6 86.6 113.4 91.6M103 74.6Q108.8 73.6 113.6 76.4" fill="none" stroke="#3B322E" stroke-width="2.6" stroke-linecap="round" opacity=".75"/>
            <path d="M115.6 91.6q-3 -4.4 -2.4 -9.6M117 79.4q-3.6 -3.8 -3.6 -8.6M113 67.4q-4 -2.6 -5.4 -7M106 59.4q-3.6 -1.6 -5.6 -4.6M98 55.6q-2 -1.6 -3 -3.6M110.6 102.6q-3.6 -2.4 -4.6 -6.6M101.4 109.8q-2 -3.4 -1.4 -7.2" fill="none" stroke="#ADA39C" stroke-width="2.2" stroke-linecap="round" opacity=".7"/></g>`;
        })(), pivot: [80, 100]},
        feet: `<ellipse cx="47" cy="107.6" rx="8.8" ry="4.8" fill="${WHITE}" ${O}/><ellipse cx="73" cy="107.6" rx="8.8" ry="4.8" fill="${WHITE}" ${O}/>
          <path d="M44.4 109.6v-2.4M48.6 109.8v-2.4M70.4 109.8v-2.4M74.6 109.6v-2.4" stroke="#D8CFC6" stroke-width="1.2" stroke-linecap="round"/>`,
        body: `${RG(id + "-b", [[0, "#E2C59E"], [0.6, "#BE9B74"], [1, "#8E7357"]], 0.45, 0.35, 0.8)}
          <path d="M60 67C77 67 85.6 80.6 85.6 94C85.6 106.4 77 110.4 60 110.4C43 110.4 34.4 106.4 34.4 94C34.4 80.6 43 67 60 67Z" fill="url(#${id}-b)" ${O}/>
          <path d="M37.4 88.6q4.4 -2.6 8.6 0.6M36.4 96.4q5 -2.4 9.2 1M38.6 103.6q4.4 -1.4 7.6 1.2M82.6 88.6q-4.4 -2.6 -8.6 0.6M83.6 96.4q-5 -2.4 -9.2 1M81.4 103.6q-4.4 -1.4 -7.6 1.2" fill="none" stroke="${STRIPE}" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>
          <path d="${puff(60, 81.4, 13, 13, 1.25)}" fill="${WHITE}"/><path d="${puff(60, 77.6, 10, 10, 1.2)}" fill="#F4E6D2"/>
          <path d="M54 92.6l1.4 2.6M60 94v2.8M66 92.6l-1.4 2.6" stroke="${WHITE}" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M46.8 78.6Q60 85.4 73.2 78.6" fill="none" stroke="#C6CDD6" stroke-width="2.6" stroke-linecap="round"/>
          ${RG(id + "-bell", [[0, "#FFFFFF"], [0.5, "#DDE2E8"], [1, "#9AA3AE"]], 0.38, 0.32, 0.7)}
          <circle cx="60" cy="85.2" r="3.4" fill="url(#${id}-bell)" ${OW(1.4)}/><path d="M60 86.2v2" stroke="#6A7380" stroke-width="1" stroke-linecap="round"/>
          <path d="M41.2 90Q41.4 80 47.6 74.6" fill="none" stroke="#F6E6D0" stroke-width="2.8" stroke-linecap="round" opacity=".9"/>`,
        armL: {svg: `<ellipse cx="50.5" cy="99.4" rx="5.8" ry="7.8" fill="${TAN}" ${O}/><path d="M45 101.4C45.6 106.6 55.4 106.6 56 101.4C55 99 46 99 45 101.4Z" fill="${WHITE}"/>
          <path d="M48.6 105.6v-2M52.4 105.6v-2" stroke="#D8CFC6" stroke-width="1.1" stroke-linecap="round"/><path d="M47 95.4q3.4 -1.4 7 0" fill="none" stroke="${STRIPE}" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`, pivot: [50.5, 92.6]},
        armR: {svg: `<ellipse cx="69.5" cy="99.4" rx="5.8" ry="7.8" fill="${TAN}" ${O}/><path d="M64 101.4C64.6 106.6 74.4 106.6 75 101.4C74 99 65 99 64 101.4Z" fill="${WHITE}"/>
          <path d="M67.6 105.6v-2M71.4 105.6v-2" stroke="#D8CFC6" stroke-width="1.1" stroke-linecap="round"/><path d="M66 95.4q3.4 -1.4 7 0" fill="none" stroke="${STRIPE}" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`, pivot: [69.5, 92.6]},
        earL: {svg: `<path d="M36.4 47L38.6 22.6L55.4 37Z" fill="${TAN}" ${O}/><path d="M40.4 41.4L41.4 29.4L49.6 36.6Z" fill="${PINK}"/>
          <path d="M41.6 41l1.2 -6.4M44.6 40l2.2 -5.2" stroke="${WHITE}" stroke-width="1.3" stroke-linecap="round"/>
          <path d="M38.8 23.6L37.8 19.2" stroke="${STRIPE}" stroke-width="2.2" stroke-linecap="round"/>`, pivot: [46, 40]},
        earR: {svg: `<path d="M83.6 47L81.4 22.6L64.6 37Z" fill="${TAN}" ${O}/><path d="M79.6 41.4L78.6 29.4L70.4 36.6Z" fill="${PINK}"/>
          <path d="M78.4 41l-1.2 -6.4M75.4 40l-2.2 -5.2" stroke="${WHITE}" stroke-width="1.3" stroke-linecap="round"/>
          <path d="M81.2 23.6L82.2 19.2" stroke="${STRIPE}" stroke-width="2.2" stroke-linecap="round"/>`, pivot: [74, 40]},
        head: `${RG(id + "-h", [[0, "#E8CFAA"], [0.62, "#C6A47C"], [1, "#9A7C5E"]], 0.45, 0.42, 0.8)}
          <path d="M60 32.6C77.6 32.6 86 42.6 87 54.4C89.4 57.4 90.8 61.6 88.8 64.4C90.4 67.2 88.6 70.4 85.8 71C82.6 77 73 80.4 60 80.4C47 80.4 37.4 77 34.2 71C31.4 70.4 29.6 67.2 31.2 64.4C29.2 61.6 30.6 57.4 33 54.4C34 42.6 42.4 32.6 60 32.6Z" fill="url(#${id}-h)" ${O}/>
          <path d="M51.4 45.4L53.8 37.6L57.2 43L60 36.4L62.8 43L66.2 37.6L68.6 45.4" fill="none" stroke="${STRIPE}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M45.6 41.4l3.2 3.6M74.4 41.4l-3.2 3.6" stroke="${STRIPE}" stroke-width="2" stroke-linecap="round" opacity=".8"/>
          <path d="M43.6 49.6q5 -2.4 9.6 -0.4M76.4 49.6q-5 -2.4 -9.6 -0.4" fill="none" stroke="${STRIPE}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
          <path d="M34.6 60.4q4.4 -1.4 8 1.2M35 66q4.4 -0.6 7.6 1.6M85.4 60.4q-4.4 -1.4 -8 1.2M85 66q-4.4 -0.6 -7.6 1.6" fill="none" stroke="${STRIPE}" stroke-width="2" stroke-linecap="round" opacity=".85"/>
          <ellipse cx="49.6" cy="61.4" rx="5" ry="2.4" fill="#EED8B6" opacity=".7"/><ellipse cx="70.4" cy="61.4" rx="5" ry="2.4" fill="#EED8B6" opacity=".7"/>
          <path d="M60 61C55.2 60.4 50.4 62.8 50.4 67.2C50.4 72.4 55 75.6 60 79.6C65 75.6 69.6 72.4 69.6 67.2C69.6 62.8 64.8 60.4 60 61Z" fill="${WHITE}"/>
          <path d="M39.6 50Q41.4 42 48.4 38.4" fill="none" stroke="#F6E6D0" stroke-width="3" stroke-linecap="round"/>`,
        face: `<path d="M57.4 62.6H62.6L60 65.4Z" fill="#E98E9A" ${OW(1.2)}/>
          <path d="M50 66.6l-15 -3.4M50 68.6l-15.6 0.8M50.6 70.4l-13.4 4.2M70 66.6l15 -3.4M70 68.6l15.6 0.8M69.4 70.4l13.4 4.2" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity=".18"/>
          <path d="M50 66.6l-15 -3.4M50 68.6l-15.6 0.8M50.6 70.4l-13.4 4.2M70 66.6l15 -3.4M70 68.6l15.6 0.8M69.4 70.4l13.4 4.2" stroke="#FFFFFF" stroke-width="1.1" stroke-linecap="round"/>`
      },
      eyes: {lx: 49.6, rx: 70.4, y: 55.6, r: 5.3, style: "round", color: "#8A7A24"},
      mouth: {x: 60, y: 67.8, w: 2.8, color: "#3A2A2A", style: "cat"},
      cheeks: {lx: 42, rx: 78, y: 65.4, w: 4.2, h: 2.4, color: "#F2A4AE"},
      anchors: {top: [60, 33, 0.95], neck: [60, 80, 1], chest: [60, 94, 0.62], back: [86, 88, 0.8], hands: [60, 100, 0.86]},
      lines: {
        tap: ["Mrrp! I was guarding the cozy spot for you.", "My tail is fluffier than your notes are long. Almost.", "Slow blink. That means you're doing great.", "I tried to sit on your homework. You may proceed.", "White mittens on, ready to study!", "Purr... one page at a time, friend."],
        pet: ["Purrrr! Right behind the ears!", "Mrrrp! More, please!"],
        hello: ["You're back! I kept the chair warm.", "Mew! I missed you. Mostly."],
        morning: ["Good morning! I already stretched twice.", "Rise and shine! Breakfast, then studying?"],
        night: ["Curling up now. You should rest soon too.", "Night night! My tail makes a great blanket."],
        focus: ["Shh. Loaf mode on. Focusing.", "I'll sit right here and watch you work."],
        done: ["Session done! Big stretch, big yawn!", "That was amazing! Purrs all round!"],
        task: ["Done! My tail is extra floofy now!", "Checked off! Mrrp!", "Another one! Pounce!", "Yes! Worth a happy tail swish!"],
        break: ["Break time! Stretch like a cat!", "Find a sunny spot and rest your eyes!"]
      }
    };
  }
  COMP_EXTRA.push(MAKE_CAT(COMP_KIT, "extra-cosmo"));
})();
