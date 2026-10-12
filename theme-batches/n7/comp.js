/* Study Companions, new theme ideas batch n7: canyon, saltflats (nature-object characters, no animals) */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const twinkle = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${c || "#fff"}"/>`;
  const shine = (x, y, rx, ry, a) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})" fill="#fff" opacity=".75"/>`;
  const petals = (cx, cy, r, n, pr, c, rot = 0) => Array.from({length: n}, (_, i) => { const a = rot + i * 2 * Math.PI / n, x = Math.round((cx + r * Math.cos(a)) * 10) / 10, y = Math.round((cy + r * Math.sin(a)) * 10) / 10; return `<ellipse cx="${x}" cy="${y}" rx="${pr}" ry="${pr * 0.7}" transform="rotate(${Math.round(a * 180 / Math.PI)} ${x} ${y})" fill="${c}" ${O2}/>`; }).join("");

  /* ================= Slot Canyon ================= */
  COMP_DATA.push({
    theme: "canyon",
    companions: [
      {
        id: "canyon-rusty", name: "Rusty", kind: "Sandstone Pebble", pose: "stand", wearColor: "#3E8A8C",
        bio: "Striped like the canyon walls. Every stripe is a thousand years of patience.",
        idle: ["topBob", "wave", "sway"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="46" cy="108" rx="8.5" ry="4.6" fill="#B8563A" ${O}/><ellipse cx="74" cy="108" rx="8.5" ry="4.6" fill="#B8563A" ${O}/>`,
          body: `${RG("canyon-rusty-b", [[0, "#FFC890"], [0.55, "#E88A52"], [1, "#B8503A"]], 0.4, 0.32, 0.8)}
            <path d="M28 82C26 62 40 50 60 50C82 50 96 62 94 82C92 100 78 107 60 107C40 107 30 100 28 82Z" fill="url(#canyon-rusty-b)" ${O}/>
            <path d="M32 70Q48 64 63 68T90 68" fill="none" stroke="#FFE2B8" stroke-width="4.4" stroke-linecap="round" opacity=".85"/>
            <path d="M31 90Q47 84 62 88T91 87" fill="none" stroke="#A23E3A" stroke-width="4" stroke-linecap="round" opacity=".5"/>
            <path d="M39 100Q56 95 70 99T84 97" fill="none" stroke="#FFE2B8" stroke-width="3.4" stroke-linecap="round" opacity=".7"/>
            <path d="M30 79Q45 75 58 78" fill="none" stroke="#C25A40" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>
            ${shine(41, 60, 6.5, 3.4, -30)}<circle cx="50" cy="55.5" r="1.8" fill="#fff"/>`,
          armL: {svg: `<ellipse cx="26" cy="84" rx="5.6" ry="7.6" transform="rotate(28 26 84)" fill="#D9784A" ${O}/>`, pivot: [31, 82]},
          armR: {svg: `<ellipse cx="94" cy="84" rx="5.6" ry="7.6" transform="rotate(-28 94 84)" fill="#D9784A" ${O}/>`, pivot: [89, 82]},
          top: {svg: `${LINE("M60 51C60 46 61 42 59.5 37", "#6E9A4A", 2.4)}<path d="M60 45C55 40 48 41 46 44C50 48 56 48 60 45Z" fill="#8FC06A" ${O2}/>
            ${petals(60, 32, 4.4, 5, 3.6, "#FF8A3A", -Math.PI / 2)}<circle cx="60" cy="32" r="2.6" fill="#FFD84A" ${OW(1.6)}/>`, pivot: [60, 50]}
        },
        eyes: {lx: 50, rx: 70, y: 77, r: 4.2, style: "dot", color: "#3A1810"},
        mouth: {x: 60, y: 87, w: 3, color: "#3A1810"},
        cheeks: {lx: 42, rx: 78, y: 85, w: 4.4, h: 2.6, color: "#FF6A5A"},
        anchors: {top: [60, 50, 0.85], neck: [60, 97, 1], chest: [74, 96, 0.6], back: [90, 76, 0.8], hands: [60, 98, 0.85]},
        lines: {
          tap: ["Hi! I'm a little bit of canyon, here to cheer!", "Layer by layer, that's how big things get built.", "You're doing great. Rocks can tell.", "Slow and steady shaped a whole canyon!", "One more stripe of progress today!", "Steady as sandstone, that's you.", "I'm proud of you, and I'm very old!", "Keep going, the light's coming through!"],
          pet: ["Hehe, that tickles my stripes!", "Ooh, warm and sunny. Like noon in the slot!"],
          hello: ["You're back! I saved you a sunny spot.", "Hi friend! Ready to make some layers?"],
          morning: ["Good morning! The sun's peeking into the canyon.", "Morning! Fresh light on the walls today."],
          night: ["Stars over the canyon. Time to rest soon.", "The walls are cooling off. You can too."],
          focus: ["Quiet as stone, right beside you.", "Steady, steady. Like the canyon."],
          done: ["What a session! That's a whole new layer!", "Done! You glowed like the walls at noon!"],
          task: ["Clack! Another one done!", "Checked off! Solid work!", "Yes! That one's set in stone!", "Done! Rock on!"],
          break: ["Break time! Stretch tall like the canyon walls.", "Rest a moment in the shade. Sip some water!"]
        }
      },
      {
        id: "canyon-pinto", name: "Pinto", kind: "Pincushion Cactus", pose: "stand", wearColor: "#E0533A",
        bio: "A tiny cactus with a flower crown. Prickly outside, soft-hearted inside.",
        idle: ["topBob", "wave", "bounce"], cheer: "hop",
        parts: {
          feet: `<path d="M24 110Q26 100 42 100H78Q94 100 96 110Q96 112 92 112H28Q24 112 24 110Z" fill="#F2C48E" ${O}/><path d="M34 106q4 2 8 0M76 107q4 2 8 0" fill="none" stroke="#D49A62" stroke-width="1.8" stroke-linecap="round"/>`,
          body: `${RG("canyon-pinto-b", [[0, "#B8EC9A"], [0.55, "#78C066"], [1, "#3E8A4E"]], 0.4, 0.32, 0.8)}
            <path d="M34 84C34 64 45 52 60 52C75 52 86 64 86 84C86 98 76 106 60 106C44 106 34 98 34 84Z" fill="url(#canyon-pinto-b)" ${O}/>
            <path d="M47 55Q41 80 46 104M73 55Q79 80 74 104M60 53V106" fill="none" stroke="#3E7E44" stroke-width="1.8" stroke-linecap="round" opacity=".55"/>
            <g fill="#FFF8E8">${[[45, 62], [43, 74], [43, 94], [75, 62], [77, 74], [77, 94], [52, 100], [68, 100], [38, 84], [82, 84]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1"/>`).join("")}</g>
            ${shine(44, 64, 4.6, 2.6, -40)}`,
          armL: {svg: `<ellipse cx="28" cy="86" rx="9.5" ry="5.8" transform="rotate(-18 28 86)" fill="#6CB45C" ${O}/><circle cx="24" cy="86" r="1" fill="#FFF8E8"/><circle cx="30" cy="84" r="1" fill="#FFF8E8"/>`, pivot: [36, 84]},
          armR: {svg: `<ellipse cx="92" cy="86" rx="9.5" ry="5.8" transform="rotate(18 92 86)" fill="#6CB45C" ${O}/><circle cx="96" cy="86" r="1" fill="#FFF8E8"/><circle cx="90" cy="84" r="1" fill="#FFF8E8"/>`, pivot: [84, 84]},
          top: {svg: `${petals(60, 45, 6, 6, 4.6, "#FF7AA8")}<circle cx="60" cy="45" r="3.6" fill="#FFD84A" ${OW(1.6)}/><circle cx="58.8" cy="43.8" r="1" fill="#fff"/>`, pivot: [60, 53]}
        },
        eyes: {lx: 51, rx: 69, y: 78, r: 4, style: "sparkle", color: "#1E3018"},
        mouth: {x: 60, y: 88, w: 2.8, color: "#1E3018"},
        cheeks: {lx: 43, rx: 77, y: 86, w: 4.2, h: 2.5, color: "#FF7A8A"},
        anchors: {top: [60, 44, 0.85], neck: [60, 96, 1], chest: [72, 94, 0.6], back: [86, 76, 0.8], hands: [60, 97, 0.85]},
        lines: {
          tap: ["Hi! Careful, I'm a hugger, but a pointy one!", "A little water and a lot of sun. You've got this!", "You bloom where you're planted. Look at you!", "Tiny steps, tiny flowers, big results!", "Look sharp! You're doing great!", "I believe in you, no prickles about it!", "Every day you grow a little!", "Stick with it! Get it? Stick!"],
          pet: ["Ooh, gently! Hehe, that's nice.", "My flower just did a little wiggle!"],
          hello: ["You're here! My flower opened just for you.", "Hi hi! Let's grow something today!"],
          morning: ["Good morning! Soaking up that first sunbeam!", "Morning! Time to bloom!"],
          night: ["My flower's closing for the night. You rest too.", "Desert nights are calm. Sleep well soon!"],
          focus: ["Growing quietly beside you.", "Rooted and ready. Focus mode!"],
          done: ["What a session! I'm in full bloom!", "Done! That's a whole flower crown of work!"],
          task: ["Pop! A new bud!", "Checked off! Bloom!", "Another one! Sharp work!", "Done! I'm so proud!"],
          break: ["Break! Drink some water. Cactus orders!", "Rest in the shade for a minute!"]
        }
      },
      {
        id: "canyon-tumble", name: "Tumble", kind: "Tumbleweed", pose: "stand", wearColor: "#3E8A8C",
        bio: "Rolls wherever the wind goes, and somehow always lands on your desk.",
        idle: ["sway", "wave", "bounce"], cheer: "spin",
        parts: {
          body: `${RG("canyon-tumble-b", [[0, "#FFF0CC"], [0.6, "#EBCB92"], [1, "#C8985A"]], 0.42, 0.34, 0.75)}
            <path d="${puff(60, 79, 28, 16, 1.06)}" fill="url(#canyon-tumble-b)" ${O}/>
            <g fill="none" stroke="#9A6A3A" stroke-width="1.7" stroke-linecap="round" opacity=".8">
              <path d="M36 66Q46 54 62 54"/><path d="M76 58Q88 66 87 80"/><path d="M34 88Q38 100 52 104"/><path d="M70 104Q84 100 88 90"/>
              <path d="M40 60Q34 74 36 84"/><path d="M58 52Q74 52 82 62"/><path d="M84 94Q80 102 70 106"/><path d="M44 102Q36 96 34 90"/>
              <path d="M44 56L50 62M78 62L74 68M38 92L44 90M82 96L76 94"/></g>
            ${shine(44, 64, 5, 2.6, -35)}`,
          armL: {svg: `${LINE("M34 84L22 91M26 89L21 84", "#B07A44", 2.4)}`, pivot: [34, 84]},
          armR: {svg: `${LINE("M86 84L98 91M94 89L99 84", "#B07A44", 2.4)}`, pivot: [86, 84]},
          top: {svg: `${LINE("M60 52C58 46 64 43 62 37C61 34 58 34 58 36", "#B07A44", 2.2)}<circle cx="64" cy="42" r="2.4" fill="#FFF6DC" ${OW(1.4)}/>`, pivot: [60, 51]}
        },
        eyes: {lx: 50, rx: 70, y: 78, r: 4.2, style: "sparkle", color: "#3A2414"},
        mouth: {x: 60, y: 88, w: 3, color: "#3A2414"},
        cheeks: {lx: 42, rx: 78, y: 86, w: 4.4, h: 2.6, color: "#FF8A6A"},
        anchors: {top: [60, 50, 0.85], neck: [60, 100, 1], chest: [74, 96, 0.6], back: [88, 78, 0.8], hands: [60, 98, 0.85]},
        lines: {
          tap: ["Whoosh! Rolled right over to say hi!", "Go with the flow, you'll get there!", "I've rolled a long way. You're my favorite stop.", "Keep rolling, you're on a roll!", "Light as a breeze and twice as cheerful!", "You make it look easy!", "A little wind, a lot of progress!"],
          pet: ["Hehe, I'm all tangly and happy!", "Wheee, don't let me roll away!"],
          hello: ["You're back! The wind brought me home.", "Hi! I tumbled all the way here!"],
          morning: ["Good morning! A fresh breeze for a fresh start!", "Morning! Ready to roll?"],
          night: ["The desert wind is resting. You should too.", "Rolling off to dreamland soon?"],
          focus: ["Staying put, just for you.", "No rolling. Only focusing."],
          done: ["Whoosh! What a session!", "Done! That was a breeze!"],
          task: ["Roll! Another one done!", "Checked off! Whee!", "Done! On a roll!", "Yes! Tumble-tastic!"],
          break: ["Break! Shake out like a tumbleweed!", "Roll your shoulders for a minute!"]
        }
      }
    ]
  });

  /* ================= Mirror Flats ================= */
  COMP_DATA.push({
    theme: "saltflats",
    companions: [
      {
        id: "saltflats-salty", name: "Salty", kind: "Salt Crystal", pose: "stand", wearColor: "#9A78CC",
        bio: "A perfect little cube of salt. Never salty about anything, honestly.",
        idle: ["sparkle", "topBob", "wave"], cheer: "spin",
        parts: {
          feet: `<rect x="40" y="101" width="14" height="10" rx="3.5" fill="#E2D8F0" ${O}/><rect x="66" y="101" width="14" height="10" rx="3.5" fill="#E2D8F0" ${O}/>`,
          body: `${LG("saltflats-salty-f", [[0, "#FFFFFF"], [1, "#E8E0F4"]])}
            <path d="M84 58L94 48V92L84 104Z" fill="#D2C4EA" ${O}/>
            <path d="M36 58L46 48H94L84 58Z" fill="#FFFFFF" ${O}/>
            <rect x="36" y="58" width="48" height="46" rx="4" fill="url(#saltflats-salty-f)" ${O}/>
            <path d="M42 64h10M42 98h8M78 64v6" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M47 51.5H66" stroke="#E8E0F4" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M88 60V78" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>
            ${twinkle(90, 40, 4, "#FFE4F0")}`,
          armL: {svg: `<rect x="25" y="74" width="12" height="12" rx="3.5" transform="rotate(-12 31 80)" fill="#F0EAF8" ${O}/>`, pivot: [36, 79]},
          armR: {svg: `<rect x="93" y="72" width="12" height="12" rx="3.5" transform="rotate(12 99 78)" fill="#D8CCEC" ${O}/>`, pivot: [94, 77]},
          top: {svg: `<path d="M64 46L67 36L72 33L75 40L72 48Z" fill="#FFFFFF" ${O2}/><path d="M67 36L72 33L75 40Z" fill="#E4DAF4"/>${twinkle(56, 38, 3, "#FFFFFF")}`, pivot: [68, 48]}
        },
        eyes: {lx: 50, rx: 70, y: 78, r: 4.4, style: "sparkle", color: "#2A2440"},
        mouth: {x: 60, y: 89, w: 3, color: "#2A2440"},
        cheeks: {lx: 43, rx: 77, y: 86, w: 4.4, h: 2.6, color: "#FF9AB8"},
        anchors: {top: [60, 46, 0.85], neck: [60, 101, 1], chest: [74, 96, 0.6], back: [92, 76, 0.8], hands: [60, 98, 0.85]},
        lines: {
          tap: ["Hi! I'm a cube, and I'm always on your side!", "You're worth your salt, and then some!", "Crystal clear: you're doing great!", "Six sides, all of them cheering for you!", "Sharp edges, soft heart. Keep going!", "A pinch of effort makes it all better!", "Look how you sparkle when you focus!", "Every grain counts. Every step too!"],
          pet: ["Hehe, I'm all sparkly now!", "Careful, I might dissolve with joy!"],
          hello: ["You're here! The flats are shining for you.", "Hi! Ready to crystallize some ideas?"],
          morning: ["Good morning! The salt is glittering already.", "Morning! Bright, white and ready!"],
          night: ["The stars are in the water tonight. Rest soon.", "Time to settle down, like salt in still water."],
          focus: ["Still as a crystal. Right here with you.", "Clear head, clear goals. You've got it."],
          done: ["What a session! I'm sparkling!", "Done! That was crystal clear brilliance!"],
          task: ["Ting! Another one done!", "Checked off! Sparkle!", "Yes! Perfectly cubed!", "Done! Pure brilliance!"],
          break: ["Break! Sip some water, add no salt!", "Rest your eyes. Look at something far away."]
        }
      },
      {
        id: "saltflats-mira", name: "Mira", kind: "Mirror Droplet", pose: "float", wearColor: "#C0628E",
        bio: "A drop of the mirror lake. Reflects the sky, and your best side.",
        idle: ["bounce", "sway", "topBob"], cheer: "hop",
        parts: {
          back: `<ellipse cx="60" cy="106" rx="32" ry="4" fill="#C8DEF6" ${OW(2.2)}/><path d="M36 106q5 2 10 0M74 106q5 2 10 0" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,
          body: `${LG("saltflats-mira-b", [[0, "#F0FAFF"], [0.55, "#A8DCF6"], [1, "#6EAEE6"]])}
            <path d="M60 34C66 46 85 60 85 79C85 93 74 101 60 101C46 101 35 93 35 79C35 60 54 46 60 34Z" fill="url(#saltflats-mira-b)" ${O}/>
            <path d="M39 84Q60 94 81 84Q80 96 60 98Q40 96 39 84Z" fill="#F6B8CE" opacity=".55"/>
            <path d="M41 88Q60 96 79 88" fill="none" stroke="#FFE2C8" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>
            ${shine(47, 62, 4.4, 8, 25)}<circle cx="52" cy="52" r="1.8" fill="#fff"/>`,
          armL: {svg: `<ellipse cx="30" cy="82" rx="4.6" ry="6.2" transform="rotate(25 30 82)" fill="#9AD0F2" ${O}/>`, pivot: [35, 79]},
          armR: {svg: `<ellipse cx="90" cy="82" rx="4.6" ry="6.2" transform="rotate(-25 90 82)" fill="#9AD0F2" ${O}/>`, pivot: [85, 79]},
          top: {svg: `${twinkle(70, 30, 5, "#FFFFFF")}<path d="M70 25Q70 30 75 30Q70 30 70 35Q70 30 65 30Q70 30 70 25Z" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>${twinkle(50, 27, 2.6, "#FFE4F0")}`, pivot: [62, 34]}
        },
        eyes: {lx: 51, rx: 69, y: 74, r: 4.4, style: "sparkle", color: "#1E2A4A"},
        mouth: {x: 60, y: 84, w: 3, color: "#1E2A4A"},
        cheeks: {lx: 43, rx: 77, y: 81, w: 4.2, h: 2.5, color: "#FF8AB0"},
        anchors: {top: [60, 38, 0.8], neck: [60, 94, 0.95], chest: [72, 88, 0.58], back: [84, 70, 0.75], hands: [60, 92, 0.8]},
        lines: {
          tap: ["Hi! Look, you're in my reflection, and you look great!", "Still water, clear thoughts!", "Drip, drop, don't stop!", "You reflect so much hard work!", "Every little drop fills the lake!", "Calm and shiny, just like you!", "I see a superstar in my mirror!"],
          pet: ["Hehe! Ripples everywhere!", "Ooh, that made me wobble!"],
          hello: ["You're back! The water got all sparkly.", "Hello! I've been reflecting on you!"],
          morning: ["Good morning! The sky's in the water again!", "Morning! Fresh as dew!"],
          night: ["I'm full of stars tonight. Sleep soon?", "The lake is still. Time to rest your mind."],
          focus: ["Still as a mirror, right beside you.", "No ripples. Just focus."],
          done: ["What a session! I'm glimmering!", "Done! That made a splash!"],
          task: ["Plip! Another one!", "Checked off! Splash!", "Done! Crystal clear!", "Yes! Ripple of joy!"],
          break: ["Break! Have a sip of water, like me!", "Float for a minute. Then back to it!"]
        }
      },
      {
        id: "saltflats-blush", name: "Blush", kind: "Sunset Cloud", pose: "float", wearColor: "#7650B0",
        bio: "A puff of sunset that turns pinker every time you finish something.",
        idle: ["sway", "topBob", "wave"], cheer: "spin",
        parts: {
          back: `<circle cx="84" cy="52" r="13" fill="#FFD27A" ${O}/><path d="M84 32v-5M98 38l4-4M104 52h5M70 38l-4-4" stroke="${INK}" stroke-width="5.2" stroke-linecap="round"/><path d="M84 32v-5M98 38l4-4M104 52h5M70 38l-4-4" stroke="#FFC24A" stroke-width="2.6" stroke-linecap="round"/>`,
          body: `${RG("saltflats-blush-b", [[0, "#FFF4F6"], [0.55, "#FFD2DE"], [1, "#F2A2BC"]], 0.42, 0.32, 0.8)}
            <path d="${puff(60, 76, 29, 9, 1.16)}" fill="url(#saltflats-blush-b)" ${O}/>
            <path d="M38 94Q60 102 82 94" fill="none" stroke="#E68AAA" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>
            <path d="M40 62Q46 54 54 53" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".9"/>`,
          armL: {svg: `<circle cx="27" cy="84" r="7" fill="#FFD8E2" ${O}/>`, pivot: [33, 82]},
          armR: {svg: `<circle cx="93" cy="84" r="7" fill="#FFD8E2" ${O}/>`, pivot: [87, 82]},
          top: {svg: `<path d="${puff(56, 44, 6.5, 6, 1.2)}" fill="#FFE8EE" ${O2}/>`, pivot: [56, 50]}
        },
        eyes: {lx: 50, rx: 70, y: 76, r: 4.2, style: "dot", color: "#3A2240"},
        mouth: {x: 60, y: 86, w: 3, color: "#3A2240"},
        cheeks: {lx: 42, rx: 78, y: 84, w: 4.6, h: 2.8, color: "#FF7AA0"},
        anchors: {top: [56, 40, 0.8], neck: [60, 98, 1], chest: [72, 92, 0.6], back: [86, 72, 0.8], hands: [60, 94, 0.85]},
        lines: {
          tap: ["Hi! I just turned a little pinker!", "Golden hour is any hour you study!", "Floating by to say you're amazing!", "Every cloud has a pink lining!", "You light up my whole sky!", "Soft and steady, that's the way!", "I'm blushing, you're doing so well!"],
          pet: ["Eep! Now I'm extra pink!", "Hehe, so fluffy, so happy!"],
          hello: ["You're here! The sunset waited for you.", "Hi! I drifted over the second I saw you!"],
          morning: ["Good morning! Sunrise pink, my favorite!", "Morning! A soft sky for a strong start!"],
          night: ["The sun's down, and so am I soon. You too?", "Look, the stars are out. Time to rest."],
          focus: ["Drifting quietly beside you.", "Soft sky, sharp focus."],
          done: ["What a session! I'm glowing gold!", "Done! That deserves a sunset!"],
          task: ["Puff! Another one done!", "Checked off! So pink!", "Done! Golden!", "Yes! Blushing with pride!"],
          break: ["Break! Watch the clouds for a minute.", "Float away from the screen a bit!"]
        }
      }
    ]
  });
})();
