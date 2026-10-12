/* Study Companions, new theme ideas batch n8: waterfall, redwoods (one nature-object character and two young animals each) */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  // Animal rig helpers: M mirrors a left-side part to the right (around x = 60); limb is an outlined stubby limb
  const M = s => `<g transform="matrix(-1 0 0 1 120 0)">${s}</g>`;
  const limb = (d, c, w = 5.4) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 4}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  const dipWing = `<path d="M41 77C31 81 29 93 34 101C42 99 46 89 44 77Z" fill="#6E7A8E" ${O}/><path d="M35.4 89Q34.4 94 36 98" fill="none" stroke="#8C98AA" stroke-width="1.6" stroke-linecap="round"/>`;
  // a dipper chick's small dark beak with yellow gape corners
  const dbeak = (dy, open) => `<path d="M55 ${54 + dy}Q60 ${51.6 + dy} 65 ${54 + dy}L60.8 ${60.6 + dy}Q60 ${61.6 + dy} 59.2 ${60.6 + dy}Z" fill="#3E4250" ${OW(2)}/><ellipse cx="54.8" cy="${54.6 + dy}" rx="2" ry="1.4" fill="#FFD84A"/><ellipse cx="65.2" cy="${54.6 + dy}" rx="2" ry="1.4" fill="#FFD84A"/>${open ? `<path d="M56.6 ${55.4 + dy}Q60 ${59.4 + dy} 63.4 ${55.4 + dy}Z" fill="#FF8FA8"/>` : ""}`;
  const ottEar = `<circle cx="38" cy="36" r="5.4" fill="#8A5A3A" ${O2}/><circle cx="38.6" cy="36.6" r="2.4" fill="#D8A890"/>`;
  const ottArm = `${limb("M46 80Q41 87 44 93", "#8A5A3A")}<ellipse cx="45" cy="95" rx="4.4" ry="3.4" fill="#7A4E30" ${OW(2)}/>`;
  const slugStalk = `${LINE("M52 55Q46.6 43 43.4 31.6", "#F2C83A", 3.6)}<circle cx="42.8" cy="29.6" r="4" fill="#FFE070" ${OW(2.2)}/>`;
  const chipEar = `<ellipse cx="42" cy="32" rx="5.6" ry="7" transform="rotate(-20 42 32)" fill="#C8834A" ${O2}/><ellipse cx="42.4" cy="32.8" rx="2.6" ry="3.8" transform="rotate(-20 42.4 32.8)" fill="#F6B8A8"/>`;
  const chipArm = `${limb("M47 79Q41 86 43 93", "#C8834A")}<ellipse cx="43.6" cy="95" rx="4.4" ry="3.4" fill="#E8B88A" ${OW(2)}/>`;
  const shine = (x, y, rx, ry, a) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})" fill="#fff" opacity=".75"/>`;
  const leaf = (x, y, L, w, a, c) => `<path d="M0 0Q${L * 0.45} ${-w} ${L} 0Q${L * 0.45} ${w} 0 0Z" transform="translate(${x} ${y}) rotate(${a})" fill="${c}" ${OW(1.8)}/>`;
  // a small fern sprig: a curved stem with paired leaflets
  const sprig = (x, y, c) => `${LINE(`M${x} ${y}Q${x + 1} ${y - 10} ${x + 6} ${y - 21}`, "#4E8A3A", 2.2)}${[0, 1, 2, 3, 4].map(i => { const t = i / 5, px = x + 0.6 + t * t * 5.5, py = y - 4 - t * 16, L = 11 - i * 1.7; return leaf(px, py, L, 3.4 - i * 0.3, -158 + i * 6, c) + leaf(px, py, L, 3.4 - i * 0.3, -22 - i * 8, c); }).join("")}${leaf(x + 6, y - 21, 5, 2.4, -70, c)}`;
  const heart = (cx, cy, s, rot, id, extra) => `<path d="M0 12C-6 8 -13 3.5 -13 -3C-13 -8 -9.4 -11 -5.6 -11C-3 -11 -1 -9.4 0 -7.2C1 -9.4 3 -11 5.6 -11C9.4 -11 13 -8 13 -3C13 3.5 6 8 0 12Z" transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s})" fill="url(#${id})" ${OW(3 / s)}${extra || ""}/>`;

  /* ================= Fern Falls ================= */
  COMP_DATA.push({
    theme: "waterfall",
    companions: [
      {
        id: "waterfall-plip", name: "Plip", kind: "Water Droplet", pose: "float", wearColor: "#2E908A",
        bio: "A drop that took the long way down the falls and loved every tier of it.",
        idle: ["topBob", "sway", "sparkle"], cheer: "bounce",
        parts: {
          back: `<ellipse cx="60" cy="104" rx="36" ry="7.5" fill="#A6E4EE" ${O}/><path d="M30 104q5 2.4 10 0M80 105q5 2.4 10 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`,
          body: `${RG("waterfall-plip-b", [[0, "#F2FCFF"], [0.45, "#8ED8F4"], [1, "#2E86C8"]], 0.4, 0.45, 0.75)}
            <path d="M60 34C66 46 90 60 90 80C90 97 77 106 60 106C43 106 30 97 30 80C30 60 54 46 60 34Z" fill="url(#waterfall-plip-b)" ${O}/>
            <path d="M42 70C42 60 48 53 54 49" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".9"/><circle cx="41.6" cy="76.6" r="2" fill="#fff" opacity=".9"/>
            <path d="M44 99Q60 104 76 99" fill="none" stroke="#5AB4E0" stroke-width="2" stroke-linecap="round" opacity=".6"/>`,
          armL: {svg: `<path d="M31 84C26 86 25 92 29 93C33 94 35 89 35 85Z" fill="#6CC4EC" ${O}/>`, pivot: [35, 84]},
          armR: {svg: `<path d="M89 84C94 86 95 92 91 93C87 94 85 89 85 85Z" fill="#6CC4EC" ${O}/>`, pivot: [85, 84]},
          top: {svg: sprig(59, 40, "#7CC860"), pivot: [60, 40]}
        },
        eyes: {lx: 51, rx: 69, y: 77, r: 4.6, style: "sparkle", color: "#163A5A"},
        mouth: {x: 60, y: 87, w: 3.1, color: "#163A5A"},
        cheeks: {lx: 43, rx: 77, y: 85, w: 4.4, h: 2.7, color: "#FF8FA8"},
        anchors: {top: [60, 37, 0.85], neck: [60, 98, 1], chest: [72, 94, 0.62], back: [86, 76, 0.8], hands: [60, 98, 0.85]},
        lines: {
          tap: ["Plip! Hi there!", "I came down three waterfalls to say you're doing great!", "Go with the flow, you've totally got this!", "Little drops make big rivers. Little steps too!", "You're making a splash today!", "Fresh and clear, that's your focus right now!", "Drip, drip, done! One thing at a time.", "Stay cool, stay curious!"],
          pet: ["Hehe, that tickles like a ripple!", "Plip plop! Again!"],
          hello: ["You're back! I've been sparkling for you!", "Hiii! The water's lovely today!"],
          morning: ["Good morning! Fresh as dew!", "Morning! The falls are bright and so are you!"],
          night: ["The moon's on the water. Rest soon, okay?", "Time to settle like a calm pool."],
          focus: ["Trickling quietly beside you.", "Steady drip, steady focus."],
          done: ["What a session! I'm all a-shimmer!", "Done! That deserves a rainbow!"],
          task: ["Plip! Another one done!", "Splash! Checked off!", "Yes! That flowed beautifully!", "Done! Drop by drop, you did it!"],
          break: ["Break time! Sip some water, like me!", "Float for a minute, then back to it!"]
        }
      },
      {
        id: "waterfall-dipper", name: "Dipper", kind: "American Dipper Chick", pose: "stand", wearColor: "#E07A3A",
        bio: "A slate-grey chick that bobs on wet rocks and dives right in. Fearless.",
        idle: ["bounce", "wingFlutter", "tailSwish"], cheer: "hop",
        neck: [60, 68],
        parts: {
          tail: {svg: `<path d="M77 93L94 79.6Q98.6 78 99 82.6L85 100Z" fill="#6A7688" ${O}/><path d="M86 90L94.6 83" stroke="#8C98AA" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [80, 97]},
          feet: `${LINE("M53 100V108", "#E8A8A8", 3)}${LINE("M67 100V108", "#E8A8A8", 3)}${LINE("M48 110.6L53 107.6L58 110.6", "#E8A8A8", 2)}${LINE("M62 110.6L67 107.6L72 110.6", "#E8A8A8", 2)}`,
          wingL: {svg: dipWing, pivot: [43, 79]},
          wingR: {svg: M(dipWing), pivot: [77, 79]},
          body: `${RG("waterfall-dipper-b", [[0, "#AEBACA"], [0.6, "#7E8A9E"], [1, "#5C667A"]], 0.42, 0.3, 0.8)}
            <ellipse cx="60" cy="86" rx="21" ry="18.5" fill="url(#waterfall-dipper-b)" ${O}/>
            <path d="${puff(60, 90, 10.5, 9, 1.2)}" fill="#C8D0DC"/>
            <path d="M54 86q2 1.4 4 0M62 90q2 1.4 4 0M56 95q2 1.4 4 0" fill="none" stroke="#A8B2C2" stroke-width="1.4" stroke-linecap="round"/>`,
          head: `${RG("waterfall-dipper-h", [[0, "#B8C4D2"], [0.6, "#8C98AA"], [1, "#68748A"]], 0.42, 0.3, 0.8)}
            <path d="${puff(60, 47, 21, 14, 1.15)}" fill="url(#waterfall-dipper-h)" ${O}/>${shine(47, 35, 5, 2.6, -32)}`,
          top: {svg: `${LINE("M57 26C55.6 20.6 58.4 17 62 18.4", "#A8B4C4", 2.2)}${LINE("M62 26C63 21.4 66.6 20 69 22", "#A8B4C4", 2)}`, pivot: [60, 26]}
        },
        eyes: {lx: 50, rx: 70, y: 45, r: 4.4, style: "sparkle", color: "#1A1E28"},
        mouth: {x: 60, y: 56, w: 3},
        mouths: {neutral: dbeak(0, false), smile: dbeak(-0.5, false) + `<path d="M49 54q2 2.2 4.2 1.2M71 54q-2 2.2 -4.2 1.2" fill="none" stroke="#FF8FA8" stroke-width="1.6" stroke-linecap="round"/>`, open: dbeak(0, true), sleepy: dbeak(0.8, false)},
        cheeks: {lx: 43, rx: 77, y: 53, w: 4, h: 2.4, color: "#FF9AB0"},
        anchors: {top: [60, 26, 0.85], neck: [60, 69, 0.95], chest: [70, 90, 0.6], back: [80, 84, 0.78], hands: [60, 94, 0.8]},
        lines: {
          tap: ["Hi! Bob bob! That's how dippers say hello!", "Dive right in, you're doing great!", "Splashy work today!", "Little bird, big cheers for you!", "Brave as a dip under the falls!", "Bob, blink, study, repeat!", "You make it look easy!", "One rock at a time across the river!"],
          pet: ["Hehe! My feathers are all fluffed up!", "Ooh, warm hands! Bob bob!"],
          hello: ["You're back! I bobbed the whole time!", "Hi hi! The falls are sparkly today!"],
          morning: ["Good morning! Fresh spray, fresh start!", "Morning! First dip of the day!"],
          night: ["Tucking in by the falls. You rest too.", "The water's singing goodnight. Sleep soon!"],
          focus: ["Perched quietly right beside you.", "Holding still on my rock. Focus time!"],
          done: ["What a session! Big splashy bob!", "Done! That deserves a dive!"],
          task: ["Splash! Another one done!", "Checked off! Bob bob hooray!", "Done! Into the river it goes!", "Yes! Happy little dip!"],
          break: ["Break! Bob up and down and stretch!", "Rest a bit. Sip some water, like me!"]
        }
      },
      {
        id: "waterfall-ottie", name: "Ottie", kind: "River Otter Pup", pose: "sit", wearColor: "#2E908A",
        bio: "Slides down the mossy rocks all day. Takes study breaks very seriously.",
        idle: ["earTwitch", "tailSwish", "wave"], cheer: "hop",
        neck: [60, 70],
        parts: {
          tail: {svg: `${LG("waterfall-ottie-t", [[0, "#A8754C"], [1, "#7A4E30"]])}<path d="M76 98C88 98 99 99 106.6 93C107.6 103 96 111 76 109Z" fill="url(#waterfall-ottie-t)" ${O}/>`, pivot: [78, 104]},
          earL: {svg: ottEar, pivot: [41, 39]},
          earR: {svg: M(ottEar), pivot: [79, 39]},
          body: `${RG("waterfall-ottie-b", [[0, "#BC8A5E"], [0.6, "#94643E"], [1, "#74482C"]], 0.42, 0.3, 0.8)}
            <path d="M39 104C37 86 45 70 60 70C75 70 83 86 81 104C81 109 75 111 60 111C45 111 39 109 39 104Z" fill="url(#waterfall-ottie-b)" ${O}/>
            <path d="M48 80C52 75 68 75 72 80C76 92 72 106 60 106C48 106 44 92 48 80Z" fill="#EBD6B8"/>
            <ellipse cx="47" cy="108" rx="7.6" ry="4.6" fill="#7A4E30" ${O}/><ellipse cx="73" cy="108" rx="7.6" ry="4.6" fill="#7A4E30" ${O}/><path d="M44.4 110.6v-2.2M48.4 111v-2.2M71.6 111v-2.2M75.6 110.6v-2.2" stroke="#B88A62" stroke-width="1.4" stroke-linecap="round"/>`,
          armL: {svg: ottArm, pivot: [46, 80]},
          armR: {svg: M(ottArm), pivot: [74, 80]},
          head: `${RG("waterfall-ottie-h", [[0, "#C49266"], [0.6, "#9A6A44"], [1, "#7A4E30"]], 0.42, 0.3, 0.8)}
            <path d="M35 50C35 36 46 29 60 29C74 29 85 36 85 50C85 63 74 71 60 71C46 71 35 63 35 50Z" fill="url(#waterfall-ottie-h)" ${O}/>${shine(46, 37, 5, 2.6, -30)}`,
          face: `<path d="M44 59C44 52 52 50.6 60 52.6C68 50.6 76 52 76 59C76 66 69 70.4 60 70.4C51 70.4 44 66 44 59Z" fill="#F2E2CA"/>
            <path d="M56 54.4Q60 52.4 64 54.4Q63.4 58 60 58.6Q56.6 58 56 54.4Z" fill="${INK}"/><ellipse cx="58.6" cy="54.6" rx="1.2" ry=".6" fill="#fff" opacity=".7"/>
            <g fill="#A87A56"><circle cx="51" cy="60" r=".9"/><circle cx="53.4" cy="62.6" r=".9"/><circle cx="69" cy="60" r=".9"/><circle cx="66.6" cy="62.6" r=".9"/></g>
            <path d="M44 60.6l-7-1.6M44 63.4l-6.6 1.2M76 60.6l7-1.6M76 63.4l6.6 1.2" stroke="#5A3A24" stroke-width="1.2" stroke-linecap="round"/>`
        },
        eyes: {lx: 49, rx: 71, y: 46, r: 4.2, style: "sparkle", color: "#1E1410"},
        mouth: {x: 60, y: 62.4, w: 2.4, color: "#2B1A10", style: "cat"},
        cheeks: {lx: 47, rx: 73, y: 57, w: 3.4, h: 2.1, color: "#FF8A8A"},
        anchors: {top: [60, 30, 0.9], neck: [60, 72, 1], chest: [72, 96, 0.62], back: [84, 86, 0.8], hands: [60, 98, 0.85]},
        lines: {
          tap: ["Hi! Wanna see me slide? Wheee!", "Paws together for you! You're doing great!", "Go with the flow, you'll get there!", "Float on your back and think it through!", "Little splashes make big ripples!", "You otter be proud of yourself!", "Let's swim through this list!", "I found a shiny pebble. It's for you!"],
          pet: ["Hehe! My whiskers are wiggling!", "Ooh, so fluffy and warm now!"],
          hello: ["You're back! I saved you a sunny rock!", "Hi hi! Want to hold paws and study?"],
          morning: ["Good morning! The pool's all sparkly!", "Morning! Rise and splash!"],
          night: ["Floating off to sleep soon. You too?", "The falls are hushing. Time to rest."],
          focus: ["Floating quietly right beside you.", "Paws still, eyes on the goal!"],
          done: ["What a session! Big belly flop of joy!", "Done! That calls for a slide!"],
          task: ["Splash! Another one done!", "Checked off! Paw high five!", "Done! Otterly amazing!", "Yes! Happy little roll!"],
          break: ["Break! Have a stretch and a snack!", "Float for a minute. Then back to it!"]
        }
      }
    ]
  });

  /* ================= Redwood Grove ================= */
  COMP_DATA.push({
    theme: "redwoods",
    companions: [
      {
        id: "redwoods-cono", name: "Cono", kind: "Redwood Cone", pose: "stand", wearColor: "#A2452A",
        bio: "Fits in your palm, holds the seeds of a tree taller than a skyscraper.",
        idle: ["topBob", "sway", "bounce"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="49" cy="108" rx="7" ry="4" fill="#7A4428" ${O}/><ellipse cx="71" cy="108" rx="7" ry="4" fill="#7A4428" ${O}/>`,
          body: `${RG("redwoods-cono-b", [[0, "#F0B888"], [0.55, "#B8703E"], [1, "#7A3E22"]], 0.42, 0.35, 0.8)}<defs><clipPath id="redwoods-cono-c"><path d="M60 38C76 38 86 54 86 72C86 93 74 106 60 106C46 106 34 93 34 72C34 54 44 38 60 38Z"/></clipPath></defs>
            <path d="M60 38C76 38 86 54 86 72C86 93 74 106 60 106C46 106 34 93 34 72C34 54 44 38 60 38Z" fill="url(#redwoods-cono-b)" ${O}/>
            <g clip-path="url(#redwoods-cono-c)" fill="none" stroke-linecap="round">${[0, 1, 2, 3, 4, 5, 6, 7].map(r => [0, 1, 2, 3, 4, 5].map(c => { const x = 30 + c * 11 + (r % 2) * 5.5, y = 44 + r * 8.6; return `<path d="M${x - 5.4} ${y}Q${x} ${y + 7} ${x + 5.4} ${y}" stroke="#6A3018" stroke-width="2" opacity=".6"/><path d="M${x - 2.6} ${y + 1.6}Q${x} ${y + 3.6} ${x + 2.6} ${y + 1.6}" stroke="#F6C89A" stroke-width="1.2" opacity=".55"/>`; }).join("")).join("")}</g>
            <ellipse cx="60" cy="80" rx="17" ry="13" fill="#F2C49A" opacity=".85"/>
            ${shine(46, 52, 5, 2.6, -35)}`,
          armL: {svg: `<ellipse cx="31" cy="80" rx="5" ry="7" transform="rotate(28 31 80)" fill="#A8603A" ${O}/>`, pivot: [36, 78]},
          armR: {svg: `<ellipse cx="89" cy="80" rx="5" ry="7" transform="rotate(-28 89 80)" fill="#A8603A" ${O}/>`, pivot: [84, 78]},
          top: {svg: `${LINE("M60 40Q61 34 66 30L76 25", "#7A5A3A", 2)}${[0, 1, 2, 3].map(i => { const x = 64 + i * 3.4, y = 31.4 - i * 1.7; return leaf(x, y, 9 - i * 1.2, 2.8, -118 + i * 6, "#6EAA50") + leaf(x, y, 9 - i * 1.2, 2.8, 48 + i * 6, "#5E9A48"); }).join("")}`, pivot: [60, 40]}
        },
        eyes: {lx: 52, rx: 68, y: 77, r: 4.2, style: "sparkle", color: "#3A1A10"},
        mouth: {x: 60, y: 86, w: 2.9, color: "#3A1A10"},
        cheeks: {lx: 45, rx: 75, y: 84, w: 4, h: 2.5, color: "#FF8A7A"},
        anchors: {top: [60, 38, 0.85], neck: [60, 98, 0.95], chest: [72, 92, 0.6], back: [86, 72, 0.8], hands: [60, 96, 0.85]},
        lines: {
          tap: ["Hi! I'm small, but I'm going to be HUGE someday!", "Every giant redwood started as a little cone like me!", "Think big, start small. That's my motto!", "You're growing so much, I can see it!", "One ring at a time, just like a tree!", "Tiny seeds, tall dreams!", "Keep reaching up! You're doing great!", "I believe in you about three hundred feet tall!"],
          pet: ["Hehe, my scales are ticklish!", "Ooh, a pat! I feel taller already!"],
          hello: ["You're back! Let's grow some more!", "Hi hi! The grove missed you!"],
          morning: ["Good morning! The fog's lifting, let's go!", "Morning! Sun's in the canopy!"],
          night: ["The grove is sleeping. Time to rest.", "Even redwoods rest at night. Sweet dreams soon!"],
          focus: ["Growing quietly beside you.", "Rooted and ready. Let's focus."],
          done: ["WOW! That session was towering!", "Done! You grew a whole ring today!"],
          task: ["Pop! Done!", "Checked off! Reaching higher!", "Another one! Tall work!", "Yes! Growing strong!"],
          break: ["Break time! Stretch up tall like a tree!", "Rest your roots for a minute!"]
        }
      },
      {
        id: "redwoods-nana", name: "Nana", kind: "Banana Slug", pose: "stand", wearColor: "#5AA048",
        bio: "Bright as a banana, slow as a Sunday. Leaves a shiny trail of good vibes.",
        idle: ["earTwitch", "sway", "tailSwish"], cheer: "bounce",
        parts: {
          back: `<ellipse cx="68" cy="109.8" rx="40" ry="3.4" fill="#CFE8F2" opacity=".9"/><path d="M36 109.4q5 1.4 10 0M88 110q5 1.4 10 0" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,
          tail: {svg: `${LG("redwoods-nana-t", [[0, "#FFE45A"], [1, "#E8B42A"]])}<path d="M76 95C88 97 99 101 108 106.4C104.6 111 88 112 76 110Z" fill="url(#redwoods-nana-t)" ${O}/><g fill="#7A5A2A" opacity=".65"><circle cx="90" cy="104.6" r="1.8"/><circle cx="99" cy="107" r="1.3"/></g>`, pivot: [78, 104]},
          earL: {svg: slugStalk, pivot: [52, 55]},
          earR: {svg: M(slugStalk), pivot: [68, 55]},
          body: `${RG("redwoods-nana-b", [[0, "#FFF6A8"], [0.55, "#FFDC4A"], [1, "#E8AE24"]], 0.4, 0.3, 0.8)}
            <path d="M37 109C30 96 31 72 42 59C49 50 71 50 78 59C89 72 90 96 83 109Z" fill="url(#redwoods-nana-b)" ${O}/>
            <path d="M39.6 66Q60 56 80.4 66" fill="none" stroke="#E2A426" stroke-width="2" stroke-linecap="round" opacity=".75"/>
            <path d="M47 60.6q2 1.4 4 0M56.6 58.6q2 1.4 4 0M66 59q2 1.4 4 0" fill="none" stroke="#F0BE36" stroke-width="1.4" stroke-linecap="round"/>
            <path d="M35 102Q60 108.4 85 102" fill="none" stroke="#E2A426" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>
            <g fill="#7A5A2A" opacity=".6"><ellipse cx="42" cy="88" rx="2.4" ry="1.8"/><ellipse cx="79" cy="74" rx="2" ry="1.5"/><ellipse cx="78" cy="92" rx="2.6" ry="1.9"/><ellipse cx="46" cy="98" rx="1.6" ry="1.2"/></g>
            <path d="M40.6 72Q37.6 82 38.6 92" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".8"/><circle cx="45.6" cy="62.4" r="1.8" fill="#fff" opacity=".85"/><ellipse cx="81.4" cy="72" rx="1.4" ry="2.2" fill="#B07A1E" opacity=".75"/>`
        },
        eyes: {lx: 50, rx: 70, y: 72, r: 4.4, style: "sparkle", color: "#3A2A10"},
        mouth: {x: 60, y: 82, w: 3, color: "#3A2A10"},
        cheeks: {lx: 43, rx: 77, y: 80, w: 4.2, h: 2.5, color: "#FF8A6A"},
        anchors: {top: [60, 53, 0.85], neck: [60, 94, 1], chest: [72, 98, 0.6], back: [82, 80, 0.75], hands: [60, 100, 0.85]},
        lines: {
          tap: ["Hi! I came as fast as I could. It took a while!", "Slow and steady, still gets there!", "You're doing great. No rush at all!", "One tiny inch at a time, that's us!", "Bright and cheerful, just like you!", "My eyestalks are both on you. Go go!", "Look at that shiny trail of progress!", "Keep going! Slugs never give up!"],
          pet: ["Hehe, a little slimy, sorry!", "Ooh, my eyestalks just did a wiggle!"],
          hello: ["You're back! I only got halfway to the door!", "Hi friend! The forest is nice and damp!"],
          morning: ["Good morning! Fog in the trees, yay!", "Morning! Dewy and ready to go!"],
          night: ["Night is slug time, but you should rest.", "The forest is quiet. Sleep soon, okay?"],
          focus: ["Sliding quietly right beside you.", "Slow focus is still focus. Let's go!"],
          done: ["What a session! I wiggled a whole inch!", "Done! Bright banana yellow pride!"],
          task: ["Slurp! Another one done!", "Checked off! Shiny work!", "Done! Slow and steady wins!", "Yes! Happy little wiggle!"],
          break: ["Break! Stretch slowly, slug style.", "Rest a bit in the cool shade. Sip some water!"]
        }
      },
      {
        id: "redwoods-nutmeg", name: "Nutmeg", kind: "Baby Chipmunk", pose: "sit", wearColor: "#3E8A5A",
        bio: "Stuffs its cheeks with seeds and its head with facts. Never runs out.",
        idle: ["tailSwish", "earTwitch", "wave"], cheer: "hop",
        neck: [60, 70],
        parts: {
          tail: {svg: `${LG("redwoods-nutmeg-t", [[0, "#ECAE70"], [1, "#B8743E"]])}<path d="M74 104C94 104 104 88 100 70C97 58 87 54 82 60C88 70 90 86 74 94Z" fill="url(#redwoods-nutmeg-t)" ${O}/><path d="M78 98C90 95 96 84 93 69" fill="none" stroke="#7A4A2A" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>`, pivot: [76, 100]},
          earL: {svg: chipEar, pivot: [45, 37]},
          earR: {svg: M(chipEar), pivot: [75, 37]},
          body: `${RG("redwoods-nutmeg-b", [[0, "#F4C48C"], [0.6, "#D8945A"], [1, "#B07040"]], 0.42, 0.3, 0.8)}
            <path d="M39 104C37 86 45 70 60 70C75 70 83 86 81 104C81 109 75 111 60 111C45 111 39 109 39 104Z" fill="url(#redwoods-nutmeg-b)" ${O}/>
            <ellipse cx="60" cy="95" rx="11.5" ry="12.5" fill="#FFF2DC"/>
            <path d="M43.4 82Q41.4 92 42.6 102M77 82Q79 92 77.8 102" fill="none" stroke="#6A4028" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M46.6 80.6Q45 90 46 100M73.8 80.6Q75.4 90 74.4 100" fill="none" stroke="#FFF2DC" stroke-width="2" stroke-linecap="round"/>
            <ellipse cx="47" cy="108" rx="7.6" ry="4.6" fill="#C8834A" ${O}/><ellipse cx="73" cy="108" rx="7.6" ry="4.6" fill="#C8834A" ${O}/><path d="M44.4 110.6v-2.2M48.4 111v-2.2M71.6 111v-2.2M75.6 110.6v-2.2" stroke="#8A5230" stroke-width="1.4" stroke-linecap="round"/>`,
          armL: {svg: chipArm, pivot: [47, 79]},
          armR: {svg: M(chipArm), pivot: [73, 79]},
          head: `${RG("redwoods-nutmeg-h", [[0, "#F8CC96"], [0.6, "#DC9A5E"], [1, "#B87642"]], 0.42, 0.3, 0.8)}
            <path d="M34 52C34 37 46 29 60 29C74 29 86 37 86 52C86 64 75 71 60 71C45 71 34 64 34 52Z" fill="url(#redwoods-nutmeg-h)" ${O}/>
            <path d="M60 30.6V40" stroke="#6A4028" stroke-width="3" stroke-linecap="round"/><path d="M55.4 31.6Q54.8 36 55.6 39.6M64.6 31.6Q65.2 36 64.4 39.6" fill="none" stroke="#FFE2BC" stroke-width="1.8" stroke-linecap="round"/>${shine(45, 38, 4.6, 2.4, -30)}`,
          face: `<ellipse cx="44" cy="58.6" rx="8.4" ry="6.8" fill="#FFE6C4"/><ellipse cx="76" cy="58.6" rx="8.4" ry="6.8" fill="#FFE6C4"/><ellipse cx="60" cy="61" rx="7.6" ry="6.2" fill="#FFF2DC"/>
            <path d="M41 41Q47.6 36.6 54.6 39.4M79 41Q72.4 36.6 65.4 39.4" fill="none" stroke="#FFF2DC" stroke-width="2.4" stroke-linecap="round"/>
            <ellipse cx="60" cy="57.4" rx="2.6" ry="1.8" fill="#5A2A2A"/>`
        },
        eyes: {lx: 49, rx: 71, y: 48.5, r: 4.4, style: "sparkle", color: "#1E1008"},
        mouth: {x: 60, y: 62, w: 2.4, color: "#2B1A10", style: "cat"},
        cheeks: {lx: 43, rx: 77, y: 59, w: 4, h: 2.4, color: "#FF8A8A"},
        anchors: {top: [60, 30, 0.9], neck: [60, 72, 1], chest: [72, 96, 0.62], back: [84, 86, 0.8], hands: [60, 98, 0.85]},
        lines: {
          tap: ["Hi! Sorry, my cheeks are full of seeds!", "Stash those facts away, like me!", "You're doing great! Squeak!", "One seed at a time fills the burrow!", "Quick paws, busy brain, that's you!", "I believe in you more than acorns!", "Let's scurry through this list!", "Stripes up! You've got this!"],
          pet: ["Hehe! My tail is all poofy now!", "Squeak! Right on the stripes, yes!"],
          hello: ["You're back! I saved you a seed!", "Hi hi! I scurried all the way here!"],
          morning: ["Good morning! Sun through the redwoods!", "Morning! Cheeks full, ready to go!"],
          night: ["Curling up in my burrow soon. You too?", "The forest is sleepy. Rest soon, okay?"],
          focus: ["Sitting very still, right beside you.", "Quiet paws, busy brain. Let's focus!"],
          done: ["What a session! Happy tail flick!", "Done! That's a whole burrow of work!"],
          task: ["Squeak! Another one done!", "Checked off! Stashed away!", "Done! Nutty good work!", "Yes! Happy little scurry!"],
          break: ["Break! Have a snack, chipmunk orders!", "Stretch those paws, then sip some water!"]
        }
      }
    ]
  });
})();
