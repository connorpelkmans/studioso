/* Study Companions, new theme ideas batch n11: meadow, glowbay. Every companion is a nature object with a face (no animals). */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const f1 = v => Math.round(v * 10) / 10;
  const twinkle = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${c || "#fff"}"/>`;
  const shine = (x, y, rx, ry, a) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})" fill="#fff" opacity=".75"/>`;
  const ring = (cx, cy, n, R, fn) => Array.from({length: n}, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return fn(f1(cx + R * Math.cos(a)), f1(cy + R * Math.sin(a)), a, i); }).join("");
  const daisy = (x, y, r) => `<g>${ring(x, y, 7, r * 0.9, (px, py) => `<circle cx="${px}" cy="${py}" r="${f1(r * 0.62)}" fill="#fff" ${OW(1.2)}/>`)}<circle cx="${x}" cy="${y}" r="${f1(r * 0.62)}" fill="#F6C83A" ${OW(1.2)}/></g>`;

  /* ================= Poppy Meadow ================= */
  COMP_DATA.push({
    theme: "meadow",
    companions: [
      {
        id: "meadow-scarlet", name: "Scarlet", kind: "Red Poppy", pose: "stand", wearColor: "#4C78DA",
        bio: "A sunny red poppy who turns to face you the way she faces the sun.",
        idle: ["headTilt", "sway", "wave"], cheer: "spin",
        neck: [60, 72],
        parts: {
          back: `${LINE("M40 108q-3-10 1-19", "#7CC060", 2.4)}${LINE("M81 108q3-11-1-20", "#7CC060", 2.4)}${LINE("M30 108q-1-7 3-12", "#8CCB66", 2)}`,
          body: `${LG("meadow-scarlet-s", [[0, "#8CCB66"], [1, "#4E9A3A"]], 0, 0, 1, 0)}
            <path d="M56.4 108V70H63.6V108Z" fill="url(#meadow-scarlet-s)" ${O}/>
            <path d="M34 108C36 100 47 97 60 97C73 97 84 100 86 108Z" fill="#6FB050" ${O}/>
            <path d="M44 103q4-3 8 0M66 102q4-3 8 0" fill="none" stroke="#9AD878" stroke-width="1.8" stroke-linecap="round"/>
            ${daisy(43, 99.5, 3.4)}<circle cx="77" cy="99.5" r="2.6" fill="#4C78DA" ${OW(1.2)}/>`,
          armL: {svg: `${LG("meadow-scarlet-l", [[0, "#8CCB66"], [1, "#4E9A3A"]])}<path d="M58 88C52 79 41 77 31 82C32 84 34 85 35 85C33 87 33 89 34 90C44 94 52 93 58 88Z" fill="url(#meadow-scarlet-l)" ${O2}/><path d="M57 88Q46 84 34 84.5" fill="none" stroke="#3E7A2E" stroke-width="1.4" stroke-linecap="round"/>`, pivot: [58, 88]},
          armR: {svg: `${LG("meadow-scarlet-r", [[0, "#8CCB66"], [1, "#4E9A3A"]])}<path d="M62 88C68 79 79 77 89 82C88 84 86 85 85 85C87 87 87 89 86 90C76 94 68 93 62 88Z" fill="url(#meadow-scarlet-r)" ${O2}/><path d="M63 88Q74 84 86 84.5" fill="none" stroke="#3E7A2E" stroke-width="1.4" stroke-linecap="round"/>`, pivot: [62, 88]},
          head: `${RG("meadow-scarlet-p", [[0, "#FF8A6A"], [0.55, "#F2442E"], [1, "#C8281E"]], 0.5, 0.5, 0.6)}${RG("meadow-scarlet-q", [[0, "#E8503A"], [1, "#A81E1A"]], 0.5, 0.5, 0.6)}
            ${ring(60, 50, 5, 16, (x, y) => `<circle cx="${x}" cy="${y}" r="14" fill="url(#meadow-scarlet-q)" ${O}/>`).replace(/cx="([\d.]+)" cy="([\d.]+)"/g, (m, x, y) => { const a = Math.atan2(y - 50, x - 60) + Math.PI / 5; return `cx="${f1(60 + 16 * Math.cos(a))}" cy="${f1(50 + 16 * Math.sin(a))}"`; })}
            ${ring(60, 50, 5, 13, (x, y) => `<circle cx="${x}" cy="${y}" r="14.5" fill="url(#meadow-scarlet-p)" ${O}/>`)}
            ${ring(60, 50, 5, 13, (x, y, a) => `<path d="M${f1(60 + 8 * Math.cos(a))} ${f1(50 + 8 * Math.sin(a))}L${f1(60 + 22 * Math.cos(a))} ${f1(50 + 22 * Math.sin(a))}" stroke="#FFB4A0" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>`)}
            <circle cx="60" cy="50" r="15.6" fill="${INK}"/>
            ${ring(60, 50, 14, 15.6, (x, y) => `<circle cx="${x}" cy="${y}" r="1.7" fill="${INK}"/>`)}
            ${shine(44, 38, 4.6, 2.4, -40)}`,
          face: `<circle cx="60" cy="50" r="12.6" fill="#FFEFD8"/>`
        },
        eyes: {lx: 55, rx: 65, y: 48, r: 3.4, style: "sparkle", color: "#2B1A1C"},
        mouth: {x: 60, y: 55, w: 2.4, color: "#2B1A1C"},
        cheeks: {lx: 51, rx: 69, y: 53.4, w: 2.6, h: 1.7, color: "#FF9A9A"},
        anchors: {top: [60, 24, 0.85], neck: [60, 74, 0.6], chest: [66, 92, 0.5], back: [72, 84, 0.6], hands: [60, 92, 0.75]},
        lines: {
          tap: ["Hi! I turned toward you like you're the sun!", "You're blooming today, I can tell!", "One petal at a time, one task at a time.", "Stand tall, little sprout. You've got this!", "Look at you grow!", "Bright red and ready to cheer!", "Your hard work is going to blossom.", "Sunshine and focus, the perfect mix!"],
          pet: ["Hehe, my petals are all fluttery!", "Aww, that feels like a warm breeze."],
          hello: ["You're here! The whole meadow is waving!", "Hello, sunshine! Let's grow some grades."],
          morning: ["Good morning! My petals just opened for you.", "Morning! The dew is sparkling. Let's begin!"],
          night: ["My petals are closing up. Rest soon, okay?", "Goodnight soon! Even poppies need sleep."],
          focus: ["Standing tall right here with you.", "Quiet meadow, clear mind. Go for it!"],
          done: ["What a session! I'm in full bloom!", "All done! You should be so proud."],
          task: ["Pop! Another one done!", "Yes! That's a whole new bloom!", "Checked off! The meadow cheers!", "Ta-da! Growing strong!"],
          break: ["Break time! Stretch up toward the sun!", "Rest your eyes. Sip some water, like a flower."]
        }
      },
      {
        id: "meadow-skip", name: "Skip", kind: "Brook Pebble", pose: "float", wearColor: "#E0533A",
        bio: "A smooth stream pebble with a quartz stripe and a tuft of moss on top.",
        idle: ["topBob", "headTilt", "sparkle"], cheer: "bounce",
        neck: [60, 92],
        parts: {
          back: `<ellipse cx="60" cy="96" rx="38" ry="9" fill="#9ED8EE" ${O}/><path d="M33 95q5 2.4 10 0M78 96q5 2.4 10 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`,
          body: `<path d="M26 97q6-3 12 0M82 98q6-3 12 0" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="31" cy="80" rx="6.2" ry="4.6" transform="rotate(-25 31 80)" fill="#96AABC" ${O}/>`, pivot: [36, 79]},
          armR: {svg: `<ellipse cx="89" cy="80" rx="6.2" ry="4.6" transform="rotate(25 89 80)" fill="#96AABC" ${O}/>`, pivot: [84, 79]},
          head: `${RG("meadow-skip-b", [[0, "#E6EEF4"], [0.55, "#AEBFCE"], [1, "#7A8EA2"]], 0.38, 0.3, 0.8)}
            <path d="M30 76C28 60 42 50 60 50C80 50 92 60 90 76C88 92 32 92 30 76Z" fill="url(#meadow-skip-b)" ${O}/>
            <path d="M34.5 66.5C48 61 72 60.5 86.5 65.5" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".85"/><path d="M36 69C50 64 70 63.6 85.6 68" fill="none" stroke="#E2ECF4" stroke-width="1.4" stroke-linecap="round"/>
            <g fill="#7E92A6">${[[40, 80, 1.6], [80, 79, 1.4], [70, 86, 1.2], [46, 86, 1.1], [84, 72, 1.1], [36, 74, 1]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>
            ${shine(43, 58, 6, 2.6, -18)}`,
          top: {svg: `<path d="M45 54C44 46 51 42 56 45C59 40 67 40 69 45C74 44 77 49 75 54Z" fill="#7CBF52" ${O2}/><path d="M50 50q3-2 6 0M61 48q3-2 6 0" fill="none" stroke="#A8DA80" stroke-width="1.6" stroke-linecap="round"/>${daisy(66, 41, 3.4)}`, pivot: [60, 53]}
        },
        eyes: {lx: 50, rx: 70, y: 73, r: 3.8, style: "dot", color: "#2B2233"},
        mouth: {x: 60, y: 81, w: 2.6},
        cheeks: {lx: 43, rx: 77, y: 79, w: 4.2, h: 2.5, color: "#FF9AA4"},
        anchors: {top: [60, 46, 0.85], neck: [60, 90, 1], chest: [72, 84, 0.6], back: [86, 64, 0.8], hands: [60, 90, 0.85]},
        lines: {
          tap: ["Hi! The stream polished me just for today.", "Steady as a stone, that's you!", "Small and smooth, and still rolling forward!", "Skip, skip, splash! Hello!", "You make hard stuff look smooth.", "A little moss, a lot of cheer!", "Let the worries flow right past you."],
          pet: ["Hehe, I'm warm from the sun!", "Ooh, that's a nice smooth pat."],
          hello: ["You're back! I skipped all the way here!", "Hello! The brook says hi too."],
          morning: ["Good morning! The water is sparkly today.", "Morning! Fresh stream, fresh start!"],
          night: ["The brook is humming a lullaby. Rest soon.", "Moonlight on the water. Time to wind down."],
          focus: ["Sitting still as a stone beside you.", "Calm water, steady focus."],
          done: ["What a session! I'm extra shiny now!", "Done! Smooth sailing all the way!"],
          task: ["Plip! Another one done!", "Checked off! Skip, skip, hooray!", "Yes! That rolled right along!", "Done! Rock solid work!"],
          break: ["Break time! Float for a minute.", "Rest a bit and let your thoughts drift."]
        }
      },
      {
        id: "meadow-billow", name: "Billow", kind: "Summer Cumulus", pose: "float", wearColor: "#F2B53A",
        bio: "A big puffy summer cloud who makes shade whenever you need a rest.",
        idle: ["sway", "sparkle", "bounce"], cheer: "spin",
        parts: {
          back: `<g>${ring(88, 38, 8, 15, (x, y, a) => `<path d="M${f1(88 + 12.5 * Math.cos(a))} ${f1(38 + 12.5 * Math.sin(a))}L${x} ${y}" stroke="#F6B83A" stroke-width="3" stroke-linecap="round"/>`)}<circle cx="88" cy="38" r="10" fill="#FFD84A" ${O2}/></g>`,
          body: `${LG("meadow-billow-b", [[0, "#FFFFFF"], [0.62, "#F4F8FD"], [1, "#C2D4EA"]])}
            <path d="${puff(60, 70, 29, 9, 1.22)}" transform="translate(60 70) scale(1.12 0.84) translate(-60 -70)" fill="url(#meadow-billow-b)" ${O}/>
            <path d="M34 86Q60 94 86 86" fill="none" stroke="#B4C8E2" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>
            ${shine(44, 52, 7, 3, -22)}<circle cx="53" cy="47" r="1.8" fill="#fff"/>`,
          armL: {svg: `<ellipse cx="23" cy="80" rx="7.4" ry="6.4" fill="#E8F0FA" ${O}/><path d="M19 78a3 3 0 0 1 4-2" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [31, 77]},
          armR: {svg: `<ellipse cx="97" cy="80" rx="7.4" ry="6.4" fill="#E8F0FA" ${O}/><path d="M97 76a3 3 0 0 1 4 2" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [89, 77]}
        },
        eyes: {lx: 50, rx: 70, y: 68, r: 4.2, style: "sparkle", color: "#2B2A44"},
        mouth: {x: 60, y: 77, w: 3, color: "#2B2A44"},
        cheeks: {lx: 41, rx: 79, y: 75, w: 4.6, h: 2.8, color: "#FFB0C0"},
        anchors: {top: [60, 40, 0.9], neck: [60, 92, 0.95], chest: [74, 86, 0.6], back: [92, 64, 0.8], hands: [60, 92, 0.85]},
        lines: {
          tap: ["Hello from up here! Nice view of you!", "Fluffy thoughts only. You've got this!", "I float, you focus. Teamwork!", "Big and puffy and proud of you!", "A little shade for your busy brain.", "Every cloud has a study plan.", "You make my whole sky brighter!"],
          pet: ["Hehe! I'm so fluffy, right?", "Whee, that tickles my puffs!"],
          hello: ["You're here! The sky just got bluer.", "Hi hi! I drifted over to say hello!"],
          morning: ["Good morning! Not a rain cloud in sight.", "Morning! Big blue sky, big good day!"],
          night: ["I'm turning silver in the moonlight. Sleep soon?", "The stars are out. Rest well, okay?"],
          focus: ["Drifting quietly overhead.", "Soft and slow. Keep going, you're doing great."],
          done: ["What a session! I'm on cloud nine!", "Done! Clear skies ahead!"],
          task: ["Poof! Another one done!", "Checked off! Fluffy hooray!", "Yes! Sunshine through the clouds!", "Done! Blue skies, buddy!"],
          break: ["Break! Lie back and watch the clouds.", "Float for a bit. Then back to it!"]
        }
      }
    ]
  });

  /* ================= Glowing Bay ================= */
  COMP_DATA.push({
    theme: "glowbay",
    companions: [
      {
        id: "glowbay-kai", name: "Kai", kind: "Sprouting Coconut", pose: "sit", wearColor: "#2EB6C4",
        bio: "Washed up on the beach, put down roots, and decided to stay.",
        idle: ["topBob", "headTilt", "wave"], cheer: "bounce",
        neck: [60, 90],
        parts: {
          body: `${LG("glowbay-kai-s", [[0, "#FBEBC8"], [1, "#E8CC98"]])}
            <path d="M22 108C26 95 42 90 60 90C78 90 94 95 98 108Z" fill="url(#glowbay-kai-s)" ${O}/>
            <path d="M28 103q4-2 8 0M84 102q4-2 8 0" fill="none" stroke="#D8B47C" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M80 100C80 95 86 94 88 98C89 101 85 103 80 100Z" fill="#F7C6C6" ${OW(1.4)}/><circle cx="37" cy="99" r="1.4" fill="#D8B47C"/><circle cx="72" cy="104" r="1.2" fill="#D8B47C"/>`,
          armL: {svg: `<ellipse cx="33.5" cy="83" rx="7" ry="5" transform="rotate(30 33.5 83)" fill="#9A6A40" ${O}/><path d="M30 82l4 2" stroke="#6A4224" stroke-width="1.2" stroke-linecap="round"/>`, pivot: [39, 80]},
          armR: {svg: `<ellipse cx="86.5" cy="83" rx="7" ry="5" transform="rotate(-30 86.5 83)" fill="#9A6A40" ${O}/><path d="M90 82l-4 2" stroke="#6A4224" stroke-width="1.2" stroke-linecap="round"/>`, pivot: [81, 80]},
          head: `${RG("glowbay-kai-h", [[0, "#C8925E"], [0.6, "#9A6A40"], [1, "#6E4626"]], 0.4, 0.3, 0.8)}
            <path d="M33 66C33 47 45 38 60 38C75 38 87 47 87 66C87 82 75 92 60 92C45 92 33 82 33 66Z" fill="url(#glowbay-kai-h)" ${O}/>
            <path d="M40 54q3-3 6-2M76 51q3 0 5 3M38 72q1 4 4 6M80 74q-1 4-4 6M49 45q3-2 6-2M66 44q3 0 6 2" fill="none" stroke="#5A3820" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>
            <g fill="#4A2E1A"><circle cx="54" cy="44.5" r="1.6"/><circle cx="60" cy="42.6" r="1.6"/><circle cx="66" cy="44.5" r="1.6"/></g>
            ${shine(44, 52, 5, 2.4, -35)}`,
          face: `<ellipse cx="60" cy="71" rx="19.5" ry="14.6" fill="#F2DAB2" ${O2}/>`,
          top: {svg: `${LINE("M60 42V31", "#4E9A3A", 2.6)}<path d="M60 33C56 24 46 23 42 28C46 34 54 36 60 33Z" fill="#7CC860" ${O2}/><path d="M60 32C65 22 76 21 80 26C76 33 67 35 60 32Z" fill="#8FD86E" ${O2}/><path d="M58 31Q51 28 45 28.5M62 30Q70 25 77 26" fill="none" stroke="#4E9A3A" stroke-width="1.3" stroke-linecap="round"/>`, pivot: [60, 42]}
        },
        eyes: {lx: 52.5, rx: 67.5, y: 69, r: 3.6, style: "sparkle", color: "#3A2414"},
        mouth: {x: 60, y: 77, w: 2.6, color: "#3A2414"},
        cheeks: {lx: 46.5, rx: 73.5, y: 75, w: 3.4, h: 2.2, color: "#FF9A8A"},
        anchors: {top: [60, 38, 0.85], neck: [60, 90, 1], chest: [74, 98, 0.6], back: [88, 64, 0.8], hands: [60, 94, 0.85]},
        lines: {
          tap: ["Aloha! The tide brought me right to you.", "Tough on the outside, sweet on the inside. Like you!", "Slow and steady, like a palm growing tall.", "You're doing great, I can see it from the beach!", "One wave at a time, friend.", "Put down roots. Then reach for the sky!", "Sunny vibes, coming your way!"],
          pet: ["Hehe, my husk is ticklish!", "Ooh, warm as afternoon sand."],
          hello: ["You're here! Pull up a patch of sand!", "Hey there! Perfect beach day for studying."],
          morning: ["Good morning! The sea is calm and so are we.", "Morning! Let's soak up some sunshine and focus."],
          night: ["Hear the waves? Time to rest soon.", "The bay is glowing. Sweet dreams later, okay?"],
          focus: ["Rooted right here beside you.", "Calm tide, clear mind. Keep going."],
          done: ["What a session! I sprouted a new leaf!", "All done! Time for a cool drink."],
          task: ["Thunk! Another one done!", "Checked off! Coco-nuts about it!", "Yes! That's tropical!", "Done! Riding the wave!"],
          break: ["Break time! Wiggle your toes in the sand.", "Rest in the shade for a bit."]
        }
      },
      {
        id: "glowbay-lumi", name: "Lumi", kind: "Glow Droplet", pose: "float", wearColor: "#7A5AE0",
        bio: "A drop of glowing seawater that shines brighter with every splash.",
        idle: ["sway", "sparkle", "topBob"], cheer: "spin",
        parts: {
          back: `<circle cx="60" cy="68" r="40" fill="#7AF0FF" opacity=".18"/><circle cx="60" cy="68" r="32" fill="#9FF6FF" opacity=".22"/>
            <ellipse cx="60" cy="102" rx="31" ry="6.5" fill="#4FD2EE" ${O2}/><path d="M38 101q4 2 8 0M74 102q4 2 8 0" fill="none" stroke="#C8FAFF" stroke-width="1.8" stroke-linecap="round"/>`,
          body: `${RG("glowbay-lumi-b", [[0, "#F2FFFF"], [0.45, "#8CF0FF"], [1, "#22AEDC"]], 0.42, 0.55, 0.75)}
            <path d="M60 30C66 44 86 57 86 75C86 91 74 100 60 100C46 100 34 91 34 75C34 57 54 44 60 30Z" fill="url(#glowbay-lumi-b)" ${O}/>
            <path d="M42 84Q51 90 60 86T78 84" fill="none" stroke="#E8FFFF" stroke-width="2" stroke-linecap="round" opacity=".8"/>
            ${shine(48, 58, 3.4, 7, 20)}<circle cx="52" cy="48" r="1.8" fill="#fff" opacity=".9"/>
            ${twinkle(76, 66, 2.6, "#fff")}${twinkle(44, 92, 2, "#E8FFFF")}`,
          armL: {svg: `<ellipse cx="31" cy="80" rx="5" ry="6.4" transform="rotate(30 31 80)" fill="#8CEEFF" ${O}/>`, pivot: [36, 78]},
          armR: {svg: `<ellipse cx="89" cy="80" rx="5" ry="6.4" transform="rotate(-30 89 80)" fill="#8CEEFF" ${O}/>`, pivot: [84, 78]},
          top: {svg: `<path d="M60 12L62.2 17.8L68 20L62.2 22.2L60 28L57.8 22.2L52 20L57.8 17.8Z" fill="#FFF6B8" ${OW(1.8)}/>${twinkle(70, 12, 2.4, "#B8F8FF")}`, pivot: [60, 28]}
        },
        eyes: {lx: 51, rx: 69, y: 73, r: 4.2, style: "sparkle", color: "#163050"},
        mouth: {x: 60, y: 82, w: 2.8, color: "#163050"},
        cheeks: {lx: 44, rx: 76, y: 80, w: 4, h: 2.4, color: "#FF9AC8"},
        anchors: {top: [60, 34, 0.8], neck: [60, 97, 0.9], chest: [72, 88, 0.6], back: [84, 66, 0.75], hands: [60, 92, 0.85]},
        lines: {
          tap: ["Hi! I glow brighter when you're around!", "Make a splash, watch me sparkle!", "Little drop, big shine. That's you!", "You light up the whole bay!", "Every wave starts with one drop.", "Glow on! You're doing amazing!", "Ripples of good work, all the way out."],
          pet: ["Eee! I'm all sparkly now!", "Hehe, I wobbled! Do it again!"],
          hello: ["You're here! Let's make some waves!", "Hello! The whole bay just lit up!"],
          morning: ["Good morning! I'm saving my glow for tonight.", "Morning! The water is clear and bright."],
          night: ["Look how the waves glow! Rest soon, okay?", "Night swim of dreams soon. Sleep well!"],
          focus: ["Glowing softly right beside you.", "Quiet water, bright mind."],
          done: ["What a session! I'm positively glowing!", "Done! That made the whole bay sparkle!"],
          task: ["Splash! Another one done!", "Checked off! Look at me glow!", "Yes! Sparkle, sparkle!", "Done! Making waves!"],
          break: ["Break time! Float and breathe.", "Rest a little. Sip some water, of course!"]
        }
      },
      {
        id: "glowbay-mira", name: "Marina", kind: "Sea Glass", pose: "stand", wearColor: "#E0703A",
        bio: "A bit of glass the sea polished for years into something soft and lovely.",
        idle: ["headTilt", "sparkle", "wave"], cheer: "hop",
        neck: [60, 97],
        parts: {
          body: `${LG("glowbay-mira-s", [[0, "#FBEBC8"], [1, "#E8CC98"]])}
            <ellipse cx="60" cy="104" rx="32" ry="7.5" fill="url(#glowbay-mira-s)" ${O}/>
            <path d="M33 103C33 100 37 99 39 101C40 103 37 104 33 103Z" fill="#8CC8F0" ${OW(1.3)}/><path d="M81 105C81 102 86 101 88 103C88 106 84 106 81 105Z" fill="#F2C060" ${OW(1.3)}/>`,
          armL: {svg: `<ellipse cx="33" cy="82" rx="6.2" ry="5" transform="rotate(-20 33 82)" fill="#A8E6D2" ${O}/>`, pivot: [38, 80]},
          armR: {svg: `<ellipse cx="87" cy="82" rx="6.2" ry="5" transform="rotate(20 87 82)" fill="#A8E6D2" ${O}/>`, pivot: [82, 80]},
          head: `${LG("glowbay-mira-g", [[0, "#D8F8EC"], [0.5, "#A4E2CC"], [1, "#6CC4A8"]], 0, 0, 0.4, 1)}
            <path d="M34 72C30 56 40 42 56 40C70 38 86 46 88 62C90 78 84 94 66 98C48 101 37 88 34 72Z" fill="url(#glowbay-mira-g)" ${O}/>
            <path d="M39 70C37 58 45 47 57 45.5C68 44 81 50 83 62" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>
            <path d="M58 46L72 52L64 60Z" fill="#E6FFF6" opacity=".45"/><path d="M76 84L83 70L84 82Z" fill="#5CB498" opacity=".35"/>
            ${shine(46, 55, 5, 2.4, -40)}${twinkle(80, 52, 2.8, "#fff")}<circle cx="70" cy="90" r="1.3" fill="#fff" opacity=".7"/>`
        },
        eyes: {lx: 52, rx: 70, y: 69, r: 4, style: "dot", color: "#1E4038"},
        mouth: {x: 61, y: 78, w: 2.8, color: "#1E4038"},
        cheeks: {lx: 45, rx: 77, y: 76, w: 4, h: 2.4, color: "#FF9AA8"},
        anchors: {top: [60, 41, 0.85], neck: [60, 97, 0.95], chest: [72, 90, 0.6], back: [86, 66, 0.8], hands: [60, 94, 0.85]},
        lines: {
          tap: ["Hi! The sea took years to smooth my edges.", "Rough days make you shine. Promise!", "Patience polishes everything, even exams.", "You're a real gem, you know that?", "Soft glow, steady progress.", "I'm cheering for you from the tide line!", "Little by little, wave by wave."],
          pet: ["Hehe, I'm all smooth, right?", "Ooh, I sparkle when you do that."],
          hello: ["You found me! Beachcomber's luck!", "Hello! The tide just left me here for you."],
          morning: ["Good morning! The light through me is so pretty.", "Morning! Fresh tide, fresh start."],
          night: ["The waves are glowing. Time to rest soon.", "Sleep well later. The sea will keep polishing."],
          focus: ["Shining quietly by your side.", "Calm and clear. You've got this."],
          done: ["What a session! I'm sparkling!", "Done! Polished and perfect!"],
          task: ["Clink! Another one done!", "Checked off! What a treasure!", "Yes! That shines!", "Done! A real gem of a job!"],
          break: ["Break time! Breathe like the tide.", "Rest your eyes for a minute. Then shine on!"]
        }
      }
    ]
  });
})();
