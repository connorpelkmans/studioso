/* Study Companions, New Theme Ideas batch n3 (Cozy Spots): greenhouse, pottery, campfire, aquarium, treehouse */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const twinkle = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${c || "#fff"}"/>`;
  const f1 = v => Math.round(v * 10) / 10;
  // a monstera leaf, stem at (x,y), pointing ang degrees (-90 = up), len long
  const monstera = (x, y, len, ang, slits = 2) => { const TH = [0, 0.06, 0.25, 0.5, 0.75, 0.9, 1], RR = [0.6, 0.52, 0.48, 0.44, 0.46, 0.4, 0.3], up = [];
    const rad = t => { for (let k = 1; k < TH.length; k++) if (t <= TH[k]) return RR[k - 1] + (RR[k] - RR[k - 1]) * (t - TH[k - 1]) / (TH[k] - TH[k - 1]); return 0.3; };
    for (let i = 0; i <= 44; i++) { const t = i / 44; let rr = rad(t); for (let s = 0; s < slits; s++) { const c = 0.22 + 0.56 * (s + 0.5) / slits, d = Math.abs(t - c); if (d < 0.026) rr = Math.min(rr, 0.15 + d * 6.5); } up.push([0.42 * len + rr * len * Math.cos(t * Math.PI), rr * len * Math.sin(t * Math.PI) * 1.05]); }
    const all = up.concat(up.slice(1, -1).reverse().map(p => [p[0], -p[1]])), a = ang * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return "M" + all.map(p => `${f1(x + p[0] * c - p[1] * s)} ${f1(y + p[0] * s + p[1] * c)}`).join("L") + "Z"; };
  const petals = (cx, cy, n, len, w, rot = 0) => { let d = ""; for (let i = 0; i < n; i++) { const a = (rot + i * 360 / n) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), P = (x, y) => `${f1(cx + x * c - y * s)} ${f1(cy + x * s + y * c)}`; d += `M${P(0, 0)}Q${P(len * 0.5, w)} ${P(len, 0)}Q${P(len * 0.5, -w)} ${P(0, 0)}Z`; } return d; };

  /* Greenhouse */
  COMP_DATA.push({
    theme: "greenhouse",
    companions: [
      {
        id: "greenhouse-prickles", name: "Prickles", kind: "Little Cactus", pose: "sit", hatTop: true,
        bio: "Low maintenance, high loyalty.",
        idle: ["topBob", "sway", "sparkle"], cheer: "hop",
        parts: {
          body: `${LG("greenhouse-prickles-greenhouse-prickles-g", [[0, "#B8E88E"], [0.55, "#6CC06A"], [1, "#3E9A52"]], 0, 0, 1, 0)}${LG("greenhouse-prickles-greenhouse-prickles-p", [[0, "#F6AE84"], [1, "#C8643E"]])}
            <rect x="35" y="30" width="50" height="62" rx="25" fill="url(#greenhouse-prickles-greenhouse-prickles-g)" ${O}/>
            <path d="M48 36V88M60 32V90M72 36V88" fill="none" stroke="#2F7A44" stroke-width="1.6" opacity=".3"/>
            <path d="M39 48l-3.5-1.6M39 64l-3.5-1.6M81 48l3.5-1.6M81 64l3.5-1.6M53 36l-1.6-3.4M67 36l1.6-3.4M47 78l-3-2M73 78l3-2" fill="none" stroke="#FFF6D6" stroke-width="1.8" stroke-linecap="round"/>
            <ellipse cx="45" cy="45" rx="3.6" ry="7.5" fill="#fff" opacity=".5"/>
            <path d="M30 88H90L84 112H36Z" fill="url(#greenhouse-prickles-greenhouse-prickles-p)" ${O}/>
            <rect x="26" y="81" width="68" height="12" rx="5" fill="#F6B892" ${O}/>
            <path d="M38 101H82" fill="none" stroke="#FFD2B8" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>`,
          armL: {svg: `<path d="M38 70H30Q24 70 24 64V52Q24 46 29.5 46Q35 46 35 52V61H38Z" fill="#7CC872" ${O}/><path d="M27 52l-2.6-1.2M27 60l-2.6-1.2" stroke="#FFF6D6" stroke-width="1.5" stroke-linecap="round"/>`, pivot: [37, 66]},
          armR: {svg: `<path d="M82 64H90Q96 64 96 58V48Q96 42 90.5 42Q85 42 85 48V55H82Z" fill="#62B464" ${O}/><path d="M93 48l2.6-1.2M93 56l2.6-1.2" stroke="#FFF6D6" stroke-width="1.5" stroke-linecap="round"/>`, pivot: [83, 60]},
          top: {svg: `<path d="${petals(60, 27, 6, 11, 4.8, -90)}" fill="#FF8FB0" ${OW(1.8)}/><circle cx="60" cy="27" r="3.6" fill="#FFE27A" ${OW(1.6)}/>`, pivot: [60, 31]}
        },
        eyes: {lx: 50, rx: 70, y: 58, r: 4.8, style: "dot", color: "#1E3A22"},
        mouth: {x: 60, y: 66.5, w: 3, color: "#1E3A22"},
        cheeks: {lx: 43.5, rx: 76.5, y: 65, w: 4.2, h: 2.6, color: "#FF9FB0"},
        anchors: {top: [60, 31, 0.85], neck: [60, 84, 1.15], chest: [74, 74, 0.6], back: [84, 58, 0.8], hands: [60, 82, 0.9]},
        lines: {
          tap: ["Hi! No hugs, but lots of cheering!", "You're looking sharp today!", "Slow and steady grows the tallest cactus!", "A little sun, a little study, perfect day!", "I don't need much, just you doing great!", "Every task is a drop of water for me!", "You've got this, prickles and all!", "Standing tall right beside you!"],
          pet: ["Careful, careful! Hehe, that was nice!", "Ooh, gentle pats! My flower is blushing!"],
          hello: ["You're back! My flower just opened for you!", "Hi hi! I saved you a sunny spot!"],
          morning: ["Good morning! Soaking up the sunshine!", "Rise and shine! Time to grow!"],
          night: ["The greenhouse is sleepy. Rest soon?", "Cactus nap time. You too, okay?"],
          focus: ["Quiet and steady, like a cactus. Go!", "I'm rooted right here with you!"],
          done: ["WOW! That session made me bloom!", "Session done! Prickly proud of you!"],
          task: ["Done! A new flower for that one!", "YES! Look at you grow!", "Checked off! Sharp work!", "Woohoo! Another one sprouted!"],
          break: ["Stretch time! Reach for the sun!", "Break time! Sip some water, like me!"]
        }
      },
      {
        id: "greenhouse-monty", name: "Monty", kind: "Monstera Leaf", pose: "stand",
        bio: "Grows a new split in its leaf every time you level up.",
        idle: ["sway", "wave", "headTilt"], cheer: "spin",
        neck: [60, 74],
        parts: {
          feet: `<ellipse cx="47" cy="110" rx="7" ry="3.8" fill="#A8502E" ${O}/><ellipse cx="73" cy="110" rx="7" ry="3.8" fill="#A8502E" ${O}/>`,
          body: `${LG("greenhouse-monty-greenhouse-monty-p", [[0, "#F6AE84"], [1, "#C8643E"]])}
            ${LINE("M60 90V72", "#4E9A58", 4.5)}
            <path d="M38 90H82L77 108H43Z" fill="url(#greenhouse-monty-greenhouse-monty-p)" ${O}/>
            <rect x="34" y="84" width="52" height="10" rx="4.5" fill="#F6B892" ${O}/>
            <ellipse cx="60" cy="85.5" rx="20" ry="2.4" fill="#6E5442"/>`,
          armL: {svg: `<path d="M56 82C50 74 40 72 34 76C38 84 48 86 56 82Z" fill="#7CC872" ${O}/><path d="M54 81Q46 77 38 77" fill="none" stroke="#3E8A4A" stroke-width="1.4" stroke-linecap="round" opacity=".5"/>`, pivot: [56, 82]},
          armR: {svg: `<path d="M64 82C70 74 80 72 86 76C82 84 72 86 64 82Z" fill="#62B464" ${O}/><path d="M66 81Q74 77 82 77" fill="none" stroke="#3E8A4A" stroke-width="1.4" stroke-linecap="round" opacity=".5"/>`, pivot: [64, 82]},
          head: `${LG("greenhouse-monty-greenhouse-monty-h", [[0, "#A6E894"], [0.5, "#52B262"], [1, "#2E8A52"]], 0.2, 0, 0.8, 1)}
            <path d="${monstera(60, 76, 66, -90, 2)}" fill="url(#greenhouse-monty-greenhouse-monty-h)" ${O}/>
            <path d="M60 68V16M60 30L50 22M60 30L70 22" fill="none" stroke="#D6F5C8" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>
            <path d="M38 34Q40 26 47 22" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>`
        },
        eyes: {lx: 50, rx: 70, y: 45, r: 5, style: "sparkle", color: "#16301E"},
        mouth: {x: 60, y: 54, w: 3.2, color: "#16301E"},
        cheeks: {lx: 42, rx: 78, y: 52.5, w: 4.4, h: 2.7, color: "#FF9FB0"},
        anchors: {top: [60, 14, 0.8], neck: [60, 80, 1.0], chest: [72, 98, 0.6], back: [88, 46, 0.8], hands: [60, 92, 0.85]},
        lines: {
          tap: ["Hi there! Want to see my newest split?", "You're growing so fast, I can tell!", "Leaf it to me to cheer you on!", "Big leaves, big ideas, big you!", "Unfurling something great today!", "Your focus is my favorite sunlight!", "One more split and I'll be fancy!", "Swaying happily beside you!"],
          pet: ["Hehe, that rustles my leaf!", "Aww, my veins are all tingly!"],
          hello: ["You're back! My leaf did a little wave!", "Hi hi! The greenhouse missed you!"],
          morning: ["Good morning! Stretching toward the light!", "Rise and shine! Time to photosynthesize!"],
          night: ["My leaf is folding up. Rest soon?", "Grow lights dimming. Sweet dreams!"],
          focus: ["Rooting for you, very quietly.", "Leaf me here to keep you company!"],
          done: ["WOW! That session grew me a new split!", "Session done! I'm unfurling with pride!"],
          task: ["Done! That's a brand new split!", "YES! Leafing that one behind!", "Checked off! Monstera-ly good!", "Woohoo! Growing, growing, grown!"],
          break: ["Stretch it out! Big leafy stretch!", "Break time! Find a sunny window!"]
        }
      },
      {
        id: "greenhouse-misty", name: "Misty", kind: "Spray Bottle", pose: "stand", wearColor: "#F2A0B8",
        bio: "Gives everyone a refreshing little spritz.",
        idle: ["topBob", "bounce", "wave"], cheer: "bounce",
        parts: {
          feet: `<ellipse cx="48" cy="110" rx="7.5" ry="4" fill="#5AA8D8" ${O}/><ellipse cx="72" cy="110" rx="7.5" ry="4" fill="#5AA8D8" ${O}/>`,
          body: `${LG("greenhouse-misty-greenhouse-misty-g", [[0, "#E8F8FE"], [0.5, "#AEDEF6"], [1, "#7CC6EA"]], 0, 0, 0.6, 1)}
            <rect x="50" y="38" width="20" height="11" rx="3" fill="#F2F6FA" ${O}/>
            <rect x="34" y="46" width="52" height="64" rx="16" fill="url(#greenhouse-misty-greenhouse-misty-g)" ${O}/>
            <path d="M37 84Q48 79 60 84T83 84V96Q83 107 71 107H49Q37 107 37 96Z" fill="#4E9AD8" opacity=".5"/>
            <circle cx="48" cy="96" r="2.2" fill="#fff" opacity=".8"/><circle cx="70" cy="100" r="1.6" fill="#fff" opacity=".8"/><circle cx="62" cy="92" r="1.2" fill="#fff" opacity=".8"/>
            <path d="M41 60Q41 52 47 50" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".85"/>`,
          armL: {svg: `<ellipse cx="30" cy="80" rx="5" ry="7.5" transform="rotate(25 30 80)" fill="#9AD4F2" ${O}/>`, pivot: [36, 76]},
          armR: {svg: `<ellipse cx="90" cy="80" rx="5" ry="7.5" transform="rotate(-25 90 80)" fill="#9AD4F2" ${O}/>`, pivot: [84, 76]},
          top: {svg: `${LINE("M51 38Q47 46 51 52", "#F2A0B8", 3)}
            <path d="M44 22H74Q80 22 80 28V39H44Z" fill="#FFFFFF" ${O}/><path d="M48 26H74" stroke="#DDE6F0" stroke-width="2" stroke-linecap="round"/>
            <rect x="33" y="24" width="13" height="7.5" rx="2.4" fill="#E8EEF6" ${O2}/>
            <circle cx="25" cy="22" r="4.2" fill="#fff" ${OW(1.6)}/><circle cx="20" cy="30" r="3" fill="#fff" ${OW(1.4)}/><circle cx="27" cy="14" r="2.4" fill="#fff" ${OW(1.4)}/>`, pivot: [60, 40]}
        },
        eyes: {lx: 50, rx: 70, y: 70, r: 5, style: "sparkle", color: "#14304A"},
        mouth: {x: 60, y: 79, w: 3.1, color: "#14304A"},
        cheeks: {lx: 43, rx: 77, y: 77.5, w: 4.3, h: 2.6, color: "#FF9FC0"},
        anchors: {top: [62, 21, 0.85], neck: [60, 48, 0.95], chest: [73, 92, 0.6], back: [86, 72, 0.8], hands: [60, 96, 0.85]},
        lines: {
          tap: ["Psst! A little spritz of encouragement!", "Hi! You're looking fresh today!", "Mist-ion accepted: cheer you on!", "Fine mist, finer focus! You've got this!", "A refreshing hello from me to you!", "Stay hydrated, stay amazing!", "Sprinkling good vibes everywhere!", "Ready to spritz some motivation?"],
          pet: ["Hehe! That tickles my trigger!", "Ooh, sloshy happy feelings!"],
          hello: ["You're back! Spritz of joy!", "Hi hi! I'm full and ready to go!"],
          morning: ["Good morning! Dewy and bright!", "Rise and shine! Fresh start, fresh mist!"],
          night: ["Misting softly. Time to rest?", "Even the ferns are sleeping. Night night!"],
          focus: ["Quietly misting beside you.", "Fine and steady. You've got this!"],
          done: ["Session done! Spritz, spritz, hooray!", "WOW! That was refreshingly good focus!"],
          task: ["Done! Celebration spritz!", "YES! Fresh and finished!", "Checked off! Misty eyes of pride!", "Woohoo! That one's watered!"],
          break: ["Break time! Drink some water!", "Stretch! Then a refreshing sip!"]
        }
      }
    ]
  });

  /* Pottery Studio */
  COMP_DATA.push({
    theme: "pottery",
    companions: [
      {
        id: "pottery-lumpy", name: "Lumpy", kind: "Clay Lump", pose: "sit", sleepy: true,
        bio: "Could become anything. Currently a lump. Happy about it.",
        idle: ["bounce", "topBob", "headTilt"], cheer: "bounce",
        neck: [60, 100],
        parts: {
          body: `${LG("pottery-lumpy-pottery-lumpy-w", [[0, "#DCE4EA"], [1, "#98A2B0"]])}
            <ellipse cx="60" cy="104" rx="42" ry="9.5" fill="url(#pottery-lumpy-pottery-lumpy-w)" ${O}/><ellipse cx="60" cy="102.5" rx="30" ry="5" fill="#C2CAD4" opacity=".8"/>`,
          armL: {svg: `<ellipse cx="25" cy="84" rx="6" ry="8.5" transform="rotate(28 25 84)" fill="#E2BCA8" ${O}/>`, pivot: [32, 82]},
          armR: {svg: `<ellipse cx="95" cy="84" rx="6" ry="8.5" transform="rotate(-28 95 84)" fill="#D6AE98" ${O}/>`, pivot: [88, 82]},
          head: `${RG("pottery-lumpy-pottery-lumpy-g", [[0, "#F8E2D4"], [0.55, "#DDB29C"], [1, "#B8866E"]], 0.4, 0.32, 0.75)}
            <path d="M24 99Q19 66 40 52Q60 40 80 52Q101 66 96 99Q60 107 24 99Z" fill="url(#pottery-lumpy-pottery-lumpy-g)" ${O}/>
            <path d="M28 90Q60 98 92 90M31 79Q60 86 89 79M37 66Q60 72 83 66" fill="none" stroke="#A47662" stroke-width="1.8" stroke-linecap="round" opacity=".42"/>
            <ellipse cx="38" cy="66" rx="4" ry="8" transform="rotate(25 38 66)" fill="#fff" opacity=".45"/>
            <circle cx="84" cy="88" r="1.4" fill="#A47662" opacity=".5"/><circle cx="34" cy="92" r="1.2" fill="#A47662" opacity=".5"/>`,
          top: {svg: `${LINE("M60 50Q55 41 61 37Q68 35 67 42Q66 46 62 45", "#DDB29C", 4)}`, pivot: [60, 50]}
        },
        eyes: {lx: 49, rx: 71, y: 73, r: 5, style: "dot", color: "#3A2418"},
        mouth: {x: 60, y: 82, w: 3.2, color: "#3A2418"},
        cheeks: {lx: 40, rx: 80, y: 80.5, w: 4.6, h: 2.8, color: "#FF9F9F"},
        anchors: {top: [60, 46, 0.95], neck: [60, 98, 1.2], chest: [77, 90, 0.6], back: [92, 72, 0.8], hands: [60, 96, 0.9]},
        lines: {
          tap: ["Hi! Still a lump. Still happy!", "You could make anything of today!", "Squish! That's my hello!", "Every great vase started as a lump like me!", "Let's center ourselves and spin!", "You're shaping up beautifully!", "A little pressure makes something wonderful!", "Lumpy and proud, cheering for you!"],
          pet: ["Ooh, careful, I'm squishable!", "Hehe! You left a happy thumbprint!"],
          hello: ["You're back! I kept my shape for you!", "Hi hi! Ready to throw something great?"],
          morning: ["Good morning! Fresh clay, fresh day!", "Rise and shine! The wheel is warming up!"],
          night: ["Drying out for the night. You rest too?", "Covered in plastic and cozy. Sleep well!"],
          focus: ["Centered and steady. You've got this.", "Spinning quietly beside you."],
          done: ["WOW! That session had perfect form!", "Session done! I'm bone-dry with pride!"],
          task: ["Done! Smooth as slip!", "YES! That one's fired and finished!", "Checked off! Wheel-y amazing!", "Woohoo! A masterpiece of a task!"],
          break: ["Stretch time! Wiggle like wet clay!", "Break time! Wash your hands, grab a snack!"]
        }
      },
      {
        id: "pottery-glaze", name: "Glaze", kind: "Glaze Jar", pose: "stand",
        bio: "A swirl of blue that changes shade when you finish something.",
        idle: ["topBob", "sparkle", "sway"], cheer: "spin",
        parts: {
          feet: `<ellipse cx="48" cy="110" rx="7.5" ry="4" fill="#2E4EA8" ${O}/><ellipse cx="72" cy="110" rx="7.5" ry="4" fill="#2E4EA8" ${O}/>`,
          body: `${LG("pottery-glaze-pottery-glaze-g", [[0, "#86ACF6"], [0.5, "#4E78DA"], [1, "#2E4EA8"]], 0, 0, 0.7, 1)}
            <rect x="32" y="46" width="56" height="62" rx="16" fill="url(#pottery-glaze-pottery-glaze-g)" ${O}/>
            <path d="M38 88Q50 74 62 86T84 82" fill="none" stroke="#B8DAFF" stroke-width="3.2" stroke-linecap="round" opacity=".85"/>
            <path d="M40 100Q54 92 68 100T84 96" fill="none" stroke="#5FD0C6" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>
            <path d="M33.5 48V57Q33.5 61 37 61Q40.5 61 40.5 57V50Q43 50 43 53V54Q43 57 46 57Q49 57 49 54V48ZM66 48V60Q66 64 69.5 64Q73 64 73 60V52Q75 52 75 55Q75 58 78 58Q81 58 81 55V48Z" fill="#9CC0FA" opacity=".9"/>
            <path d="M38 70Q38 60 44 58" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>`,
          armL: {svg: `<ellipse cx="28" cy="82" rx="5" ry="7.5" transform="rotate(25 28 82)" fill="#5A84E0" ${O}/>`, pivot: [34, 78]},
          armR: {svg: `<ellipse cx="92" cy="82" rx="5" ry="7.5" transform="rotate(-25 92 82)" fill="#5A84E0" ${O}/>`, pivot: [86, 78]},
          top: {svg: `<rect x="28" y="34" width="64" height="14" rx="6" fill="#FFF6EA" ${O}/><path d="M33 40H87" stroke="#EAD8C2" stroke-width="2" stroke-linecap="round"/><circle cx="60" cy="29" r="5" fill="#F2C84A" ${O2}/>
            ${twinkle(96, 26, 3.4, "#9B6AD6")}${twinkle(24, 24, 2.6, "#5FD0C6")}`, pivot: [60, 44]}
        },
        eyes: {lx: 50, rx: 70, y: 72, r: 5, style: "sparkle", color: "#14204A"},
        mouth: {x: 60, y: 81, w: 3.1, color: "#14204A"},
        cheeks: {lx: 42, rx: 78, y: 79.5, w: 4.4, h: 2.7, color: "#FF9FC8"},
        anchors: {top: [60, 26, 0.9], neck: [60, 48, 1.0], chest: [74, 94, 0.6], back: [88, 70, 0.8], hands: [60, 98, 0.85]},
        lines: {
          tap: ["Hi! I'm feeling extra blue today, the good kind!", "Swirl, swirl! You're doing great!", "Every layer makes the finish shine!", "You bring out my best colors!", "Dip into the next task, you've got this!", "Glossy goals, here we come!", "One coat at a time, beautifully done!", "I shimmer when you focus!"],
          pet: ["Hehe! My swirl just went teal!", "Ooh, careful, I might drip with joy!"],
          hello: ["You're back! My lid popped with joy!", "Hi hi! Ready to add some color?"],
          morning: ["Good morning! Fresh coat, fresh start!", "Rise and shine! Glossy day ahead!"],
          night: ["Kiln's cooling down. Rest soon?", "Settling into a deep midnight blue. Sleep well!"],
          focus: ["Smooth and steady, like a good glaze.", "Swirling quietly beside you."],
          done: ["WOW! That session came out glossy!", "Session done! I changed three shades!"],
          task: ["Done! I just turned violet!", "YES! Fired and fabulous!", "Checked off! Shimmering with pride!", "Woohoo! What a finish!"],
          break: ["Break time! Let it set for a bit!", "Stretch! Then a fresh splash of water!"]
        }
      },
      {
        id: "pottery-steepy", name: "Steepy", kind: "Little Teapot", pose: "stand",
        bio: "Short, stout and always brewing.",
        idle: ["waddle", "topBob", "wave"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="47" cy="108.5" rx="7.5" ry="4.2" fill="#2F8C80" ${O}/><ellipse cx="73" cy="108.5" rx="7.5" ry="4.2" fill="#2F8C80" ${O}/>`,
          body: `${RG("pottery-steepy-pottery-steepy-g", [[0, "#C2F4EA"], [0.55, "#5CC4B4"], [1, "#2F8C80"]], 0.38, 0.32, 0.75)}
            <ellipse cx="60" cy="80" rx="31" ry="26" fill="url(#pottery-steepy-pottery-steepy-g)" ${O}/>
            <path d="M31 88Q60 103 89 88" fill="none" stroke="#FFF6E6" stroke-width="5" stroke-linecap="round"/>
            <path d="M33 80Q60 93 87 80" fill="none" stroke="#FFF6E6" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="2 4" opacity=".7"/>
            <ellipse cx="42" cy="68" rx="6" ry="3.4" transform="rotate(-30 42 68)" fill="#fff" opacity=".6"/>`,
          armL: {svg: `${LINE("M33 80Q20 76 17 62", "#4CB8A8", 6)}<ellipse cx="17" cy="60" rx="5" ry="3" transform="rotate(-20 17 60)" fill="#6ACCBC" ${O2}/>`, pivot: [33, 80]},
          armR: {svg: `${LINE("M88 66Q103 63 103 77Q103 92 88 94", "#4CB8A8", 5)}`, pivot: [88, 80]},
          top: {svg: `<path d="M38 58Q60 40 82 58Z" fill="#7AD2C4" ${O}/><circle cx="60" cy="45" r="4.6" fill="#F2C84A" ${O2}/>${LINE("M70 38Q66 32 70 27", "#E8F2F0", 2)}${LINE("M78 40Q74 34 78 29", "#E8F2F0", 2)}`, pivot: [60, 56]}
        },
        eyes: {lx: 49, rx: 71, y: 76, r: 5, style: "dot", color: "#123A34"},
        mouth: {x: 60, y: 85, w: 3.2, color: "#123A34"},
        cheeks: {lx: 40.5, rx: 79.5, y: 83.5, w: 4.4, h: 2.7, color: "#FF9FB0"},
        anchors: {top: [60, 41, 0.9], neck: [60, 57, 1.05], chest: [76, 94, 0.6], back: [90, 72, 0.8], hands: [60, 98, 0.85]},
        lines: {
          tap: ["Hi! I'm short, I'm stout, I'm here for you!", "Something good is brewing, and it's you!", "Tip me over, pour me out, I'm cheering!", "Steady heat makes the best tea and the best work!", "You're steeping in greatness today!", "Let's take it one cup at a time!", "Warm thoughts coming your way!", "Whistling a happy little tune for you!"],
          pet: ["Hehe! My lid is rattling!", "Aww, toasty warm all over!"],
          hello: ["You're back! Kettle's on!", "Hi hi! I've been brewing a welcome!"],
          morning: ["Good morning! First pour of the day!", "Rise and shine! Brewing up something great!"],
          night: ["A little chamomile, then bed?", "Cooling down for the night. Sleep tight!"],
          focus: ["Steeping quietly. You've got this.", "Warm and steady right beside you."],
          done: ["WOW! That session was perfectly brewed!", "Session done! Time for a celebration cup!"],
          task: ["Done! Tea-riffic!", "YES! Poured out and finished!", "Checked off! I'm whistling!", "Woohoo! That one's steeped!"],
          break: ["Break time! Brew yourself something warm!", "Stretch! Then a cozy sip!"]
        }
      }
    ]
  });

  /* Campfire Night */
  const graham = (x, y, w, h, id) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="url(#${id})" ${O}/><g fill="#A8703A"><circle cx="${x + w * 0.2}" cy="${y + h * 0.5}" r="1.5"/><circle cx="${x + w * 0.38}" cy="${y + h * 0.5}" r="1.5"/><circle cx="${x + w * 0.62}" cy="${y + h * 0.5}" r="1.5"/><circle cx="${x + w * 0.8}" cy="${y + h * 0.5}" r="1.5"/></g><path d="M${x + w / 2} ${y + 3}V${y + h - 3}" stroke="#A8703A" stroke-width="1.4" opacity=".55"/>`;
  COMP_DATA.push({
    theme: "campfire",
    companions: [
      {
        id: "campfire-smory", name: "S'mory", kind: "S'more", pose: "sit", hatTop: true,
        bio: "Gooey in the middle, crunchy on the edges, sweet all over.",
        idle: ["topBob", "bounce", "sparkle"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="44" cy="110.5" rx="7" ry="3.6" fill="#B07A40" ${O}/><ellipse cx="76" cy="110.5" rx="7" ry="3.6" fill="#B07A40" ${O}/>`,
          body: `${LG("campfire-smory-campfire-smory-c", [[0, "#ECBE80"], [1, "#C4884A"]])}${RG("campfire-smory-campfire-smory-m", [[0, "#FFFFFF"], [0.6, "#FFF6EA"], [1, "#F2DCC0"]], 0.4, 0.3, 0.8)}
            ${graham(24, 87, 72, 21, "campfire-smory-campfire-smory-c")}
            <rect x="28" y="80" width="64" height="10" rx="3" fill="#6A3A22" ${O2}/><path d="M40 89Q41 96 44 89M72 89Q73 98 76 89" fill="#6A3A22" ${OW(1.6)}/>
            <path d="M26 82Q21 62 40 57H80Q99 62 94 82Q89 88 80 84Q70 90 60 85Q50 90 40 84Q31 88 26 82Z" fill="url(#campfire-smory-campfire-smory-m)" ${O}/>
            <ellipse cx="38" cy="65" rx="5" ry="2.6" transform="rotate(-20 38 65)" fill="#fff"/>`,
          armL: {svg: `<ellipse cx="22" cy="74" rx="5.6" ry="7.5" transform="rotate(30 22 74)" fill="#FFF6EA" ${O}/>`, pivot: [29, 72]},
          armR: {svg: `<ellipse cx="98" cy="74" rx="5.6" ry="7.5" transform="rotate(-30 98 74)" fill="#FFF6EA" ${O}/>`, pivot: [91, 72]},
          top: {svg: `${LG("campfire-smory-campfire-smory-t", [[0, "#F2C488"], [1, "#C88C4C"]])}${graham(24, 38, 72, 20, "campfire-smory-campfire-smory-t")}${twinkle(100, 34, 3.6, "#FFD86A")}`, pivot: [60, 57]}
        },
        eyes: {lx: 50, rx: 70, y: 70, r: 4.8, style: "dot", color: "#3A2414"},
        mouth: {x: 60, y: 77.5, w: 3, color: "#3A2414"},
        cheeks: {lx: 41.5, rx: 78.5, y: 76.5, w: 4.2, h: 2.6, color: "#FF9F9F"},
        anchors: {top: [60, 37, 0.9], neck: [60, 58, 1.1], chest: [76, 98, 0.6], back: [92, 70, 0.8], hands: [60, 94, 0.85]},
        lines: {
          tap: ["Hi! I'm sweet on you, you know!", "Some more? Some more cheering for you!", "Gooey hugs coming your way!", "Crunchy start, sweet finish, that's the plan!", "You're toasting through that list!", "Stay golden, my friend!", "Sandwiched between pride and joy!", "Warm by the fire, cheering for you!"],
          pet: ["Hehe! Careful, I'm melty!", "Ooh, extra gooey happiness!"],
          hello: ["You're back! Grab a stick and sit down!", "Hi hi! The fire's warm and so am I!"],
          morning: ["Good morning! S'mores for breakfast? Kidding!", "Rise and shine, happy camper!"],
          night: ["The embers are glowing. Bedtime soon?", "Cozy by the fire. Sleep sweet!"],
          focus: ["Toasting slowly. You've got this.", "Warm and quiet beside you."],
          done: ["WOW! That session was perfectly golden!", "Session done! Sweetest work ever!"],
          task: ["Done! Toasted to perfection!", "YES! That one's in the bag!", "Checked off! Gooey with pride!", "Woohoo! S'more of that, please!"],
          break: ["Stretch time! Wiggle by the fire!", "Break time! Grab a snack, maybe a sweet one!"]
        }
      },
      {
        id: "campfire-lumen", name: "Lumen", kind: "Camp Lantern", pose: "stand", wearColor: "#3E7A5C",
        bio: "Glows a little brighter as the night goes on.",
        idle: ["sway", "sparkle", "topBob"], cheer: "bounce",
        parts: {
          back: `${RG("campfire-lumen-campfire-lumen-h", [[0, "#FFE08A", 0.55], [0.6, "#FFC24A", 0.18], [1, "#FFB040", 0]], 0.5, 0.5, 0.5)}<circle cx="60" cy="72" r="42" fill="url(#campfire-lumen-campfire-lumen-h)"/>`,
          feet: `<ellipse cx="44" cy="111" rx="7" ry="3.4" fill="#24503E" ${O}/><ellipse cx="76" cy="111" rx="7" ry="3.4" fill="#24503E" ${O}/>`,
          body: `${RG("campfire-lumen-campfire-lumen-g", [[0, "#FFFBE0"], [0.55, "#FFD86A"], [1, "#F2A23A"]], 0.5, 0.5, 0.6)}${LG("campfire-lumen-campfire-lumen-f", [[0, "#5A9A7A"], [1, "#2E6A50"]])}
            <path d="M34 50H86L80 41H40Z" fill="url(#campfire-lumen-campfire-lumen-f)" ${O}/>
            <rect x="37" y="49" width="46" height="50" rx="9" fill="url(#campfire-lumen-campfire-lumen-g)" ${O}/>
            <path d="M45 50V98M75 50V98" stroke="#2E6A50" stroke-width="3.4"/>
            <path d="M54 92Q52 84 57 80Q56 86 60 88Q61 82 64 80Q68 86 66 92Z" fill="#FF8A3A" opacity=".75"/>
            <rect x="31" y="96" width="58" height="13" rx="4" fill="url(#campfire-lumen-campfire-lumen-f)" ${O}/>
            <path d="M38 102H82" stroke="#8ACCAA" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>`,
          armL: {svg: `<ellipse cx="29" cy="78" rx="4.8" ry="7" transform="rotate(25 29 78)" fill="#4E8A6A" ${O}/>`, pivot: [35, 74]},
          armR: {svg: `<ellipse cx="91" cy="78" rx="4.8" ry="7" transform="rotate(-25 91 78)" fill="#4E8A6A" ${O}/>`, pivot: [85, 74]},
          top: {svg: `${LINE("M44 43Q44 22 60 22Q76 22 76 43", "#9AB0A6", 3)}<circle cx="60" cy="21" r="3.4" fill="#C8D6CE" ${O2}/>`, pivot: [60, 44]}
        },
        eyes: {lx: 53, rx: 67, y: 68, r: 4.3, style: "sparkle", color: "#3A2414"},
        mouth: {x: 60, y: 76, w: 2.8, color: "#3A2414"},
        cheeks: {lx: 49, rx: 71, y: 74.5, w: 3, h: 2, color: "#FF8F70"},
        anchors: {top: [60, 19, 0.85], neck: [60, 46, 1.0], chest: [74, 104, 0.55], back: [88, 72, 0.8], hands: [60, 102, 0.85]},
        lines: {
          tap: ["Hi! I saved my brightest glow for you!", "Lighting the way, one task at a time!", "You're the spark, I'm just the lantern!", "Even little lights make a big difference!", "Glowing warmer the more you do!", "Follow my light, we're almost there!", "Bright idea alert! It's you!", "Shining right beside you!"],
          pet: ["Hehe! My flame just did a little dance!", "Aww, toasty and glowy!"],
          hello: ["You're back! The whole camp just lit up!", "Hi hi! Wick trimmed, ready to shine!"],
          morning: ["Good morning! I'll dim down, the sun's got it!", "Rise and shine! Brightest camper here!"],
          night: ["Glowing soft and low. Time to rest?", "I'll keep the night light on. Sleep well!"],
          focus: ["Steady flame, steady mind.", "Keeping the light on for you."],
          done: ["WOW! That session was brilliant!", "Session done! I'm glowing with pride!"],
          task: ["Done! Light it up!", "YES! Burning bright!", "Checked off! Shine on!", "Woohoo! That one's illuminated!"],
          break: ["Break time! Rest your eyes in the dark a bit!", "Stretch! Then come back to the light!"]
        }
      },
      {
        id: "campfire-moosey", name: "Moosey", kind: "Moose Calf", pose: "sit",
        bio: "Its antlers have not come in yet. It is waiting patiently.",
        idle: ["earTwitch", "headTilt", "tailSwish"], cheer: "hop",
        neck: [60, 74],
        parts: {
          tail: {svg: `<ellipse cx="88" cy="98" rx="4.5" ry="6.5" transform="rotate(40 88 98)" fill="#7A4E30" ${O}/>`, pivot: [84, 101]},
          earL: {svg: `<path d="M44 42C36 38 26 38 20 42C24 48 34 50 44 49Z" fill="#A06E46" ${O}/><path d="M41 44C35 42 29 42 25 43.5C28 46 34 47 40 46.6Z" fill="#E8B898"/>`, pivot: [43, 45]},
          earR: {svg: `<path d="M76 42C84 38 94 38 100 42C96 48 86 50 76 49Z" fill="#A06E46" ${O}/><path d="M79 44C85 42 91 42 95 43.5C92 46 86 47 80 46.6Z" fill="#E8B898"/>`, pivot: [77, 45]},
          feet: `<ellipse cx="42" cy="109" rx="8.5" ry="4.2" fill="#3E2A20" ${O}/><ellipse cx="78" cy="109" rx="8.5" ry="4.2" fill="#3E2A20" ${O}/>`,
          body: `${LG("campfire-moosey-campfire-moosey-b", [[0, "#B07A50"], [1, "#7A4E30"]])}
            <path d="M60 72C80 72 88 86 88 98C88 107 80 111 60 111C40 111 32 107 32 98C32 86 40 72 60 72Z" fill="url(#campfire-moosey-campfire-moosey-b)" ${O}/>
            <ellipse cx="60" cy="93" rx="12" ry="9.5" fill="#D8B48E"/>`,
          armL: {svg: `<rect x="43" y="92" width="11" height="17" rx="5.5" fill="#9A6A44" ${O}/><path d="M43.9 104H53.1V105C53.1 107.6 51.1 108.4 48.5 108.4C45.9 108.4 43.9 107.6 43.9 105Z" fill="#3E2A20"/>`, pivot: [48.5, 92]},
          armR: {svg: `<rect x="66" y="92" width="11" height="17" rx="5.5" fill="#9A6A44" ${O}/><path d="M66.9 104H76.1V105C76.1 107.6 74.1 108.4 71.5 108.4C68.9 108.4 66.9 107.6 66.9 105Z" fill="#3E2A20"/>`, pivot: [71.5, 92]},
          head: `${LG("campfire-moosey-campfire-moosey-h", [[0, "#C8925E"], [1, "#94603A"]])}
            <circle cx="52" cy="34" r="4" fill="#F0D6AE" ${O2}/><circle cx="68" cy="34" r="4" fill="#F0D6AE" ${O2}/>
            <ellipse cx="60" cy="52" rx="21" ry="18" fill="url(#campfire-moosey-campfire-moosey-h)" ${O}/>
            <path d="M54 35Q60 30 66 35Q62 38 60 41Q58 38 54 35Z" fill="#7A4E30"/>
            <path d="M45 46Q47 40 52 38" fill="none" stroke="#F0C89A" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>
            <ellipse cx="60" cy="66" rx="15" ry="10.5" fill="#B88058" ${O}/><ellipse cx="54.5" cy="65" rx="2" ry="2.6" fill="${INK}"/><ellipse cx="65.5" cy="65" rx="2" ry="2.6" fill="${INK}"/>`
        },
        eyes: {lx: 50, rx: 70, y: 51, r: 4.6, style: "dot", color: "#2B1A10"},
        mouth: {x: 60, y: 71, w: 2.4, style: "cat", color: "#2B1A10"},
        cheeks: {lx: 42.5, rx: 77.5, y: 58.5, w: 4, h: 2.4, color: "#FF8F8F"},
        anchors: {top: [60, 32, 0.95], neck: [60, 76, 1.05], chest: [70, 97, 0.7], back: [35, 90, 0.85], hands: [60, 96, 0.9]},
        lines: {
          tap: ["Hi! My antlers are coming any day now!", "You're moose-ively awesome!", "Big strides, little hooves, we've got this!", "Waiting patiently, cheering loudly!", "Every task is a step through the forest!", "You make this campsite cozy!", "Ears up! Ready to cheer!", "Growing a little every day, like you!"],
          pet: ["Hehe! Right behind the ears, yes!", "Aww, that's the spot!"],
          hello: ["You're back! I did a happy stomp!", "Hi hi! Pull up a log, friend!"],
          morning: ["Good morning! The lake is all misty!", "Rise and shine! Breakfast by the water?"],
          night: ["The stars are out. Time to bed down?", "Curling up by the fire. Night night!"],
          focus: ["Quiet as the woods. You've got this.", "Standing guard while you work."],
          done: ["WOW! That session was moose-sive!", "Session done! I think my antlers grew!"],
          task: ["Done! Happy hoof stomps!", "YES! One more down!", "Checked off! Ears wiggling!", "Woohoo! Trail blazed!"],
          break: ["Stretch those legs! Little trot around!", "Break time! Fresh air and water!"]
        }
      }
    ]
  });

  /* Aquarium Tunnel */
  COMP_DATA.push({
    theme: "aquarium",
    companions: [
      {
        id: "aquarium-glide", name: "Glide", kind: "Baby Manta Ray", pose: "float", wearColor: "#F2A33A",
        bio: "Swoops in loops when it is excited.",
        idle: ["finWiggle", "sway", "topBob"], cheer: "spin",
        parts: {
          tail: {svg: `${LINE("M60 90Q61 104 72 112", "#4A70B4", 2.4)}`, pivot: [60, 90]},
          wingL: {svg: `${LG("aquarium-glide-aquarium-glide-w", [[0, "#8EB8F0"], [1, "#4068B0"]], 1, 0, 0, 1)}<path d="M46 56Q26 50 8 66Q22 70 30 81Q38 86 47 81Z" fill="url(#aquarium-glide-aquarium-glide-w)" ${O}/><path d="M42 62Q28 60 16 66" fill="none" stroke="#C8DCF8" stroke-width="2" stroke-linecap="round" opacity=".7"/>`, pivot: [46, 68]},
          wingR: {svg: `${LG("aquarium-glide-aquarium-glide-v", [[0, "#8EB8F0"], [1, "#4068B0"]], 0, 0, 1, 1)}<path d="M74 56Q94 50 112 66Q98 70 90 81Q82 86 73 81Z" fill="url(#aquarium-glide-aquarium-glide-v)" ${O}/><path d="M78 62Q92 60 104 66" fill="none" stroke="#C8DCF8" stroke-width="2" stroke-linecap="round" opacity=".7"/>`, pivot: [74, 68]},
          body: `${RG("aquarium-glide-aquarium-glide-g", [[0, "#B8D6FA"], [0.55, "#6E9CE6"], [1, "#3E64AC"]], 0.42, 0.3, 0.75)}
            <ellipse cx="60" cy="70" rx="23" ry="24" fill="url(#aquarium-glide-aquarium-glide-g)" ${O}/>
            <ellipse cx="60" cy="80" rx="15" ry="9" fill="#E6F0FC" opacity=".55"/>
            <path d="M50 86l2 3M56 88l1 3M64 88l-1 3M70 86l-2 3" stroke="#3A5A96" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>
            <ellipse cx="49" cy="58" rx="5" ry="3" transform="rotate(-30 49 58)" fill="#fff" opacity=".65"/>`,
          top: {svg: `<path d="M51 50Q44 40 47 33Q53 37 55 48Z" fill="#5A80C4" ${O2}/><path d="M69 50Q76 40 73 33Q67 37 65 48Z" fill="#5A80C4" ${O2}/>`, pivot: [60, 49]}
        },
        eyes: {lx: 51.5, rx: 68.5, y: 68, r: 4.6, style: "sparkle", color: "#10203E"},
        mouth: {x: 60, y: 77, w: 3, color: "#10203E"},
        cheeks: {lx: 44.5, rx: 75.5, y: 75.5, w: 3.8, h: 2.4, color: "#FF9FC0"},
        anchors: {top: [60, 45, 0.85], neck: [60, 88, 0.9], chest: [70, 86, 0.55], back: [88, 62, 0.8], hands: [60, 86, 0.8]},
        lines: {
          tap: ["Wheee! Hi there, you!", "Gliding over to say you're great!", "Loop-de-loop! That's how happy I am!", "Smooth sailing through that list!", "Flap, flap, focus! You've got this!", "Riding the current right beside you!", "You make the whole tank sparkle!", "Swooping in with good vibes!"],
          pet: ["Hehe! That tickles my wings!", "Ooh, soft and swirly!"],
          hello: ["You're back! I did three loops!", "Hi hi! The water's lovely today!"],
          morning: ["Good morning! Sunbeams in the tank!", "Rise and shine! Let's glide into the day!"],
          night: ["Drifting slow in the deep blue. Rest soon?", "Settling on the sand. Sweet dreams!"],
          focus: ["Gliding quietly beside you.", "Calm water, calm mind. You've got this."],
          done: ["WOW! That session deserves a loop!", "Session done! Swooping with pride!"],
          task: ["Done! Loop-de-loop!", "YES! Smooth as the current!", "Checked off! Wings up!", "Woohoo! Gliding through it!"],
          break: ["Break time! Float for a bit!", "Stretch your fins, I mean arms!"]
        }
      },
      {
        id: "aquarium-puff", name: "Puff", kind: "Pufferfish", pose: "float",
        bio: "Puffs up when surprised, which is every time you finish a task.",
        idle: ["finWiggle", "topBob", "bounce"], cheer: "bounce",
        parts: {
          tail: {svg: `<path d="M84 68L104 54Q108 70 104 86Z" fill="#F2A23A" ${O}/><path d="M90 68L102 62M90 72L102 78" stroke="#FFD27A" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [85, 70]},
          back: `<g fill="#F7D46A" ${OW(2)}>${[150, 180, 210, 240, 270, 300, 330, 120, 90, 60, 30, 0].map(a => { const r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return `<path d="M${f1(58 + c * 26 - s * 4)} ${f1(70 + s * 26 + c * 4)}L${f1(58 + c * 35)} ${f1(70 + s * 35)}L${f1(58 + c * 26 + s * 4)} ${f1(70 + s * 26 - c * 4)}Z"/>`; }).join("")}</g>`,
          body: `${RG("aquarium-puff-aquarium-puff-g", [[0, "#FFF6C0"], [0.55, "#FFD24A"], [1, "#F2A23A"]], 0.38, 0.3, 0.75)}
            <circle cx="58" cy="70" r="28" fill="url(#aquarium-puff-aquarium-puff-g)" ${O}/>
            <path d="M33 78Q58 96 83 78Q80 96 58 98Q36 96 33 78Z" fill="#FFF8DC" opacity=".9"/>
            <g fill="#C88A2A" opacity=".5"><circle cx="46" cy="52" r="1.8"/><circle cx="58" cy="47" r="1.8"/><circle cx="70" cy="52" r="1.8"/><circle cx="52" cy="58" r="1.4"/><circle cx="64" cy="58" r="1.4"/></g>
            <ellipse cx="44" cy="56" rx="5" ry="3" transform="rotate(-35 44 56)" fill="#fff" opacity=".65"/>`,
          armL: {svg: `<ellipse cx="32" cy="80" rx="7" ry="4.2" transform="rotate(30 32 80)" fill="#F7C04A" ${O}/>`, pivot: [36, 78]},
          armR: {svg: `<ellipse cx="80" cy="84" rx="7" ry="4.2" transform="rotate(-25 80 84)" fill="#F7C04A" ${O}/>`, pivot: [76, 82]},
          top: {svg: `<path d="M48 44L52 33L57 41L61 30L65 42L69 36L70 46Z" fill="#F2A23A" ${O2}/>`, pivot: [58, 44]}
        },
        eyes: {lx: 47, rx: 67, y: 66, r: 6, style: "round", color: "#2B2233"},
        mouth: {x: 57, y: 79, w: 2.6, color: "#2B2233"},
        cheeks: {lx: 39.5, rx: 74.5, y: 76, w: 4.2, h: 2.6, color: "#FF8F8F"},
        anchors: {top: [58, 38, 0.85], neck: [58, 94, 0.9], chest: [70, 90, 0.55], back: [86, 58, 0.8], hands: [58, 92, 0.85]},
        lines: {
          tap: ["Oh! Hi! You startled me in the best way!", "Puffing up with pride for you!", "I'm all spiky with excitement!", "Big breath in, big focus out!", "You're doing fin-tastic!", "Small fish, big cheers!", "Let's puff through this together!", "Bubbling over with good vibes!"],
          pet: ["Eep! Hehe, careful with the spikes!", "Ooh, I'm deflating happily!"],
          hello: ["You're back! *puff* So happy!", "Hi hi! Bubbles of joy for you!"],
          morning: ["Good morning! Fresh water, fresh start!", "Rise and shine! Ready to puff into the day!"],
          night: ["Deflating for the night. Rest soon?", "Tucked into the coral. Sleep tight!"],
          focus: ["Calm and round. You've got this.", "Floating quietly beside you."],
          done: ["*PUFF!* That session was amazing!", "Session done! I'm totally puffed up with pride!"],
          task: ["*PUFF!* Done!", "YES! Surprised and so proud!", "Checked off! Spikes up!", "Woohoo! Big puff for that one!"],
          break: ["Break time! Deep breaths, then deflate!", "Stretch! Swim a lap around the room!"]
        }
      },
      {
        id: "aquarium-curly", name: "Curly", kind: "Seahorse", pose: "float",
        bio: "Holds on to your to-do list with its tail.",
        idle: ["topBob", "finWiggle", "headTilt"], cheer: "hop",
        neck: [58, 60],
        parts: {
          tail: {svg: `${LINE("M57 90Q49 102 56 109Q66 114 69 105Q71 97 63 97Q58 98 60 103", "#F7A24A", 5)}
            <g transform="rotate(-12 74 100)"><rect x="66" y="92" width="16" height="18" rx="2" fill="#FFFFFF" ${O2}/><path d="M69 97H79M69 101H79M69 105H76" stroke="#8AA6D8" stroke-width="1.4" stroke-linecap="round"/><path d="M68 96l1 1 2-2" stroke="#4FB070" stroke-width="1.2" fill="none" stroke-linecap="round"/></g>`, pivot: [58, 90]},
          body: `${RG("aquarium-curly-aquarium-curly-b", [[0, "#FFE6A8"], [0.6, "#FFB04A"], [1, "#F2873A"]], 0.4, 0.35, 0.75)}
            <path d="M48 60Q38 75 47 89Q56 97 65 90Q73 79 66 63Z" fill="url(#aquarium-curly-aquarium-curly-b)" ${O}/>
            <path d="M46 70Q52 72 58 70M45 78Q52 80 59 78M48 86Q53 88 58 86" fill="none" stroke="#FFE6B8" stroke-width="2" stroke-linecap="round" opacity=".85"/>`,
          armR: {svg: `<path d="M66 68Q82 62 83 76Q77 82 66 80Z" fill="#FFD27A" ${O2}/><path d="M69 70L79 68M69 74L80 74M69 78L78 79" stroke="#F2A23A" stroke-width="1.2" stroke-linecap="round"/>`, pivot: [67, 74]},
          head: `${RG("aquarium-curly-aquarium-curly-h", [[0, "#FFE6A8"], [0.6, "#FFB04A"], [1, "#F2873A"]], 0.4, 0.35, 0.75)}
            <path d="M68 42Q84 40 89 44Q90 51 85 52Q76 53 68 53Z" fill="url(#aquarium-curly-aquarium-curly-h)" ${O}/>
            <ellipse cx="56" cy="47" rx="16" ry="15" fill="url(#aquarium-curly-aquarium-curly-h)" ${O}/>
            <path d="M44 42Q46 36 52 34" fill="none" stroke="#FFF2CC" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>`,
          top: {svg: `<path d="M48 35L49 24L54 31L58 21L61 31L66 26L65 36Z" fill="#F2873A" ${O2}/>`, pivot: [56, 35]}
        },
        eyes: {lx: 50, rx: 62, y: 46, r: 4, style: "sparkle", color: "#3A1A10"},
        mouth: {x: 56, y: 54, w: 2.4, color: "#3A1A10"},
        cheeks: {lx: 45, rx: 67, y: 52.5, w: 3.2, h: 2, color: "#FF8FA8"},
        anchors: {top: [56, 24, 0.8], neck: [58, 62, 0.8], chest: [62, 78, 0.5], back: [44, 72, 0.75], hands: [58, 86, 0.8]},
        lines: {
          tap: ["Hi! I've got your list, nice and tight!", "Holding on for you, always!", "Curl up and conquer, you've got this!", "Bobbing along beside you!", "One item at a time, I'll keep the list safe!", "You're doing fin-credibly well!", "Tiny but mighty, like your progress!", "Swaying with the current, cheering for you!"],
          pet: ["Hehe! My tail just curled tighter!", "Aww, that makes my crown sparkle!"],
          hello: ["You're back! I kept your list for you!", "Hi hi! Ready for a gentle swim?"],
          morning: ["Good morning! Let's see today's list!", "Rise and shine! The reef is waking up!"],
          night: ["Hooking my tail on the seagrass. Rest soon?", "Swaying to sleep. Sweet dreams!"],
          focus: ["Holding steady. You've got this.", "Quietly guarding your list."],
          done: ["WOW! That session was reef-markable!", "Session done! My tail is tingling with pride!"],
          task: ["Done! Crossing it off with my tail!", "YES! One less on the list!", "Checked off! Curly-cue of joy!", "Woohoo! The list is shrinking!"],
          break: ["Break time! Drift and breathe!", "Stretch it out, uncurl a little!"]
        }
      }
    ]
  });

  /* Treehouse */
  COMP_DATA.push({
    theme: "treehouse",
    companions: [
      {
        id: "treehouse-nutters", name: "Nutters", kind: "Chipmunk", pose: "sit",
        bio: "Keeps snacks in its cheeks for long study sessions.",
        idle: ["earTwitch", "tailSwish", "headTilt"], cheer: "hop",
        neck: [60, 74],
        parts: {
          tail: {svg: `${LG("treehouse-nutters-treehouse-nutters-t", [[0, "#C8844A"], [1, "#8A5430"]])}<path d="M82 104C100 102 110 82 102 64C98 55 88 56 89 65C92 78 86 88 76 92Z" fill="url(#treehouse-nutters-treehouse-nutters-t)" ${O}/><path d="M86 96C96 92 102 80 98 68" fill="none" stroke="#F2D2A8" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>`, pivot: [80, 98]},
          earL: {svg: `<ellipse cx="42" cy="37" rx="7" ry="7.5" fill="#C07A44" ${O}/><ellipse cx="42" cy="38" rx="3.6" ry="4" fill="#FFC6B4"/>`, pivot: [45, 41]},
          earR: {svg: `<ellipse cx="78" cy="37" rx="7" ry="7.5" fill="#C07A44" ${O}/><ellipse cx="78" cy="38" rx="3.6" ry="4" fill="#FFC6B4"/>`, pivot: [75, 41]},
          feet: `<ellipse cx="44" cy="109" rx="8.5" ry="4.2" fill="#B06A38" ${O}/><ellipse cx="76" cy="109" rx="8.5" ry="4.2" fill="#B06A38" ${O}/>`,
          body: `${LG("treehouse-nutters-treehouse-nutters-b", [[0, "#E2A66E"], [1, "#B06A38"]])}
            <path d="M60 72C79 72 87 86 87 98C87 107 79 111 60 111C41 111 33 107 33 98C33 86 41 72 60 72Z" fill="url(#treehouse-nutters-treehouse-nutters-b)" ${O}/>
            <ellipse cx="60" cy="94" rx="13" ry="12" fill="#FFE6CC"/>
            <path d="M38 84Q40 92 39 100M82 84Q80 92 81 100" fill="none" stroke="#6A3E22" stroke-width="2.6" stroke-linecap="round" opacity=".55"/>
            ${LG("treehouse-nutters-treehouse-nutters-a", [[0, "#F6D09A"], [1, "#C88A4E"]])}<path d="M51 91H69Q69 102 60 107Q51 102 51 91Z" fill="url(#treehouse-nutters-treehouse-nutters-a)" ${O2}/><path d="M48 92Q48 83 60 83Q72 83 72 92Z" fill="#8A5A34" ${O2}/><path d="M60 83Q60 79 63 78" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><ellipse cx="55" cy="97" rx="1.6" ry="3" fill="#fff" opacity=".55"/>`,
          armL: {svg: `<ellipse cx="48" cy="96" rx="5" ry="6.6" transform="rotate(-25 48 96)" fill="#D08E58" ${O}/>`, pivot: [47, 89]},
          armR: {svg: `<ellipse cx="72" cy="96" rx="5" ry="6.6" transform="rotate(25 72 96)" fill="#D08E58" ${O}/>`, pivot: [73, 89]},
          head: `${LG("treehouse-nutters-treehouse-nutters-h", [[0, "#E8AE76"], [1, "#BC7A44"]])}
            <ellipse cx="60" cy="55" rx="24" ry="21" fill="url(#treehouse-nutters-treehouse-nutters-h)" ${O}/>
            <path d="M60 35V46M53 36Q52 42 54 47M67 36Q68 42 66 47" fill="none" stroke="#6A3E22" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>
            <path d="M40 50Q44 46 50 47M80 50Q76 46 70 47" fill="none" stroke="#FFF2E0" stroke-width="2.2" stroke-linecap="round"/>`,
          face: `<ellipse cx="45" cy="64" rx="9" ry="7.5" fill="#FFE6CC"/><ellipse cx="75" cy="64" rx="9" ry="7.5" fill="#FFE6CC"/><ellipse cx="60" cy="62" rx="3" ry="2.2" fill="#E07A8A" ${OW(1.4)}/>
            <path d="M40 64H32M41 67L34 70M80 64H88M79 67L86 70" stroke="#8A5A3A" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>`
        },
        eyes: {lx: 50, rx: 70, y: 53, r: 4.8, style: "sparkle", color: "#2B1A10"},
        mouth: {x: 60, y: 66, w: 2.4, style: "cat", color: "#2B1A10"},
        cheeks: {lx: 43, rx: 77, y: 61, w: 3.6, h: 2.2, color: "#FF8F8F"},
        anchors: {top: [60, 34, 0.95], neck: [60, 76, 1.05], chest: [70, 97, 0.7], back: [35, 90, 0.85], hands: [60, 96, 0.9]},
        lines: {
          tap: ["Hi! Want an acorn? I've got plenty stored!", "Cheeks full, heart fuller!", "You're nuts about learning, I love it!", "Storing up good vibes for you!", "Quick little steps get you far!", "Snack break later, focus now!", "Chattering happily beside you!", "You're the best part of the treehouse!"],
          pet: ["Hehe! My tail is all fluffy now!", "Ooh, right on the stripes!"],
          hello: ["You're back! I saved you a snack!", "Hi hi! Climb on up!"],
          morning: ["Good morning! Breakfast acorns, anyone?", "Rise and shine! Busy day in the oak!"],
          night: ["Curling into my tail. Bedtime soon?", "The fairy lights are on. Sleep tight!"],
          focus: ["Nibbling quietly. You've got this.", "Very still, very focused, like you!"],
          done: ["WOW! That session was a whole acorn stash!", "Session done! Cheeks puffed with pride!"],
          task: ["Done! Stash it away!", "YES! Another acorn for the pile!", "Checked off! Tail flick of joy!", "Woohoo! Nutty good work!"],
          break: ["Snack time! Fill those cheeks!", "Stretch! Scamper around a bit!"]
        }
      },
      {
        id: "treehouse-zip", name: "Zip", kind: "Paper Airplane", pose: "float",
        bio: "Folded from an old homework page, and it flies really well.",
        idle: ["sway", "topBob", "spin"], cheer: "spin",
        parts: {
          body: `${LG("treehouse-zip-treehouse-zip-w", [[0, "#FFFFFF"], [1, "#E6EEF8"]])}
            <path d="M14 48Q8 58 18 62" fill="none" stroke="#8AA6D8" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="2.4 3.4"/>
            <path d="M106 58L18 42L46 68Z" fill="url(#treehouse-zip-treehouse-zip-w)" ${O}/>
            <path d="M28 46L98 57M36 53L96 59" stroke="#A8C4EE" stroke-width="1.3" opacity=".8"/><path d="M34 44L44 66" stroke="#F2A0A8" stroke-width="1.3" opacity=".8"/>
            <path d="M106 58L46 68L56 92Z" fill="#E2EAF6" ${O}/>
            <path d="M46 68L56 92L42 74Z" fill="#C8D4E6" ${O}/>
            <path d="M58 70L96 62M62 78L90 66" stroke="#A8C4EE" stroke-width="1.2" opacity=".7"/>`,
          top: {svg: `<path d="M24 44L16 28L36 42Z" fill="#F4F8FC" ${O2}/>`, pivot: [26, 44]}
        },
        eyes: {lx: 66, rx: 78, y: 62, r: 4, style: "sparkle", color: "#22304A"},
        mouth: {x: 72, y: 69, w: 2.6, color: "#22304A"},
        cheeks: {lx: 61, rx: 84, y: 68, w: 3.2, h: 2, color: "#FF9FB0"},
        anchors: {top: [40, 38, 0.75], neck: [62, 72, 0.8], chest: [72, 76, 0.5], back: [32, 50, 0.7], hands: [64, 78, 0.75]},
        lines: {
          tap: ["Whoosh! Hi there, pilot!", "I used to be homework, now I'm a high-flyer!", "Ready for takeoff? You've got this!", "Folded with care, flying with flair!", "You're soaring through that list!", "Loop around the tree? Later! Focus now!", "Clear skies ahead!", "Gliding right beside you!"],
          pet: ["Hehe! Careful, don't crease me!", "Ooh, a perfect fold!"],
          hello: ["You're back! Coming in for a landing!", "Hi hi! Cleared for takeoff!"],
          morning: ["Good morning! Great flying weather!", "Rise and shine! Let's catch a breeze!"],
          night: ["Landing on the windowsill for the night.", "Folding my wings. Sweet dreams!"],
          focus: ["Smooth glide. You've got this.", "Cruising quietly beside you."],
          done: ["WOW! That session went sky high!", "Session done! Best flight ever!"],
          task: ["Done! Loop-de-loop!", "YES! Nailed the landing!", "Checked off! Zoom!", "Woohoo! Straight A's in flying!"],
          break: ["Break time! Look out the window!", "Stretch your wings! I mean arms!"]
        }
      },
      {
        id: "treehouse-twig", name: "Twig", kind: "Stick Bug", pose: "stand",
        bio: "Blends in so well you forget it is cheering for you.",
        idle: ["sway", "wave", "headTilt"], cheer: "wave",
        neck: [60, 56],
        parts: {
          feet: `${LINE("M55 96L44 110M65 96L76 110M57 92L36 104M63 92L84 104", "#8A9A44", 2.6)}`,
          body: `${LG("treehouse-twig-treehouse-twig-b", [[0, "#C2D278"], [1, "#7A8A3A"]], 0, 0, 1, 0)}
            <rect x="51" y="54" width="18" height="46" rx="9" fill="url(#treehouse-twig-treehouse-twig-b)" ${O}/>
            <path d="M51 68H69M51 82H69" stroke="#5A6A2A" stroke-width="1.6" opacity=".5"/>
            <path d="M69 74C76 70 82 72 84 76C80 80 74 80 69 78Z" fill="#7CC266" ${O2}/><path d="M51 88C44 84 38 86 36 90C40 94 46 94 51 92Z" fill="#8ACB6A" ${O2}/>`,
          armL: {svg: `${LINE("M53 64L38 56L30 42", "#8A9A44", 3)}<path d="M30 42C26 36 28 30 32 28C36 32 34 38 30 42Z" fill="#8ACB6A" ${O2}/>`, pivot: [53, 64]},
          armR: {svg: `${LINE("M67 64L82 56L90 42", "#8A9A44", 3)}<path d="M90 42C94 36 92 30 88 28C84 32 86 38 90 42Z" fill="#7CC266" ${O2}/>`, pivot: [67, 64]},
          head: `${LG("treehouse-twig-treehouse-twig-h", [[0, "#CEDC86"], [1, "#8A9A44"]])}
            ${LINE("M54 32Q46 20 38 18", "#8A9A44", 2.2)}${LINE("M66 32Q74 20 82 18", "#8A9A44", 2.2)}<circle cx="38" cy="18" r="2.6" fill="#B8C870" ${O2}/><circle cx="82" cy="18" r="2.6" fill="#B8C870" ${O2}/>
            <ellipse cx="60" cy="43" rx="15" ry="13.5" fill="url(#treehouse-twig-treehouse-twig-h)" ${O}/>
            <path d="M50 37Q52 33 57 32" fill="none" stroke="#F2F6D6" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>`
        },
        eyes: {lx: 54, rx: 66, y: 43, r: 4, style: "dot", color: "#222A12"},
        mouth: {x: 60, y: 50, w: 2.4, color: "#222A12"},
        cheeks: {lx: 49, rx: 71, y: 48.5, w: 3, h: 1.9, color: "#FF9F9F"},
        anchors: {top: [60, 29, 0.75], neck: [60, 57, 0.8], chest: [64, 78, 0.5], back: [52, 70, 0.6], hands: [60, 84, 0.7]},
        lines: {
          tap: ["Hi! Did you forget I was here? I'm cheering!", "Blending in, but always rooting for you!", "Stick with it! You've got this!", "Quiet as a branch, proud as a tree!", "Little by little, like growing a twig!", "I'm right here, the twiggy one!", "Branching out into greatness, you are!", "Sway, sway, cheer, cheer!"],
          pet: ["Oh! You found me! Hehe!", "Aww, careful, I'm a bit bendy!"],
          hello: ["You're back! I've been here the whole time!", "Hi hi! Totally not a stick!"],
          morning: ["Good morning! Soaking up some sun on the branch!", "Rise and shine! Leaves are rustling!"],
          night: ["Swaying to sleep with the branches.", "Night night! I'll blend into the dark."],
          focus: ["Very still. You've got this.", "Camouflaged and cheering quietly."],
          done: ["WOW! That session was un-be-leaf-able!", "Session done! Wave wave wave!"],
          task: ["Done! Happy little wave!", "YES! Stuck the landing!", "Checked off! Branching out!", "Woohoo! Twig-tastic!"],
          break: ["Stretch time! Long, twiggy stretch!", "Break time! Find some fresh air!"]
        }
      }
    ]
  });
})();
