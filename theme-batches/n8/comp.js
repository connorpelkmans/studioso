/* Study Companions, new theme ideas batch n8: waterfall, redwoods (nature-object characters, no animals) */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
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
        id: "waterfall-mossby", name: "Mossby", kind: "Mossy Pebble", pose: "sit", wearColor: "#5E9A48",
        bio: "A mossy river stone that has sat by the falls for ages, in no hurry at all.",
        idle: ["topBob", "bounce", "sparkle"], cheer: "hop",
        parts: {
          body: `${RG("waterfall-mossby-b", [[0, "#E2EAE6"], [0.6, "#A8B6B0"], [1, "#77867F"]], 0.4, 0.35, 0.8)}${RG("waterfall-mossby-m", [[0, "#B4E27A"], [1, "#5E9A40"]], 0.4, 0.3, 0.8)}
            <path d="M26 90C24 68 40 56 60 56C82 56 96 68 94 90C93 104 80 109 60 109C40 109 27 104 26 90Z" fill="url(#waterfall-mossby-b)" ${O}/>
            <g fill="#8A9892" opacity=".7"><circle cx="38" cy="98" r="1.8"/><circle cx="82" cy="96" r="2.2"/><circle cx="74" cy="104" r="1.4"/><circle cx="46" cy="104" r="1.2"/></g>
            <path d="M28 80C29 64 43 54 60 54C78 54 92 64 92 80C87 75 82 79 76 74C70 80 63 73 57 78C51 73 44 79 38 74C34 77 31 77 28 80Z" fill="url(#waterfall-mossby-m)" ${O2}/>
            <g fill="#D8F2A8"><circle cx="44" cy="64" r="1.8"/><circle cx="52" cy="60" r="1.3"/><circle cx="72" cy="61" r="1.6"/><circle cx="80" cy="68" r="1.2"/></g>
            <path d="M36 80v6M47 78v7M75 77v6M84 80v5" stroke="#5E9A40" stroke-width="1.8" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="25" cy="94" rx="6.4" ry="5" transform="rotate(-20 25 94)" fill="#A4B2AC" ${O}/>`, pivot: [30, 92]},
          armR: {svg: `<ellipse cx="95" cy="94" rx="6.4" ry="5" transform="rotate(20 95 94)" fill="#A4B2AC" ${O}/>`, pivot: [90, 92]},
          top: {svg: `${LINE("M60 56C60 49 61 44 64 40", "#5E9A40", 2.4)}<path d="M64 40C64 33 72 32 72 37C72 40 68 41 67 39" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M64 40C64 33 72 32 72 37C72 40 68 41 67 39" fill="none" stroke="#9AD66A" stroke-width="2.6" stroke-linecap="round"/>${leaf(61, 48, 9, 3, -160, "#8AD06A")}`, pivot: [60, 56]}
        },
        eyes: {lx: 50, rx: 70, y: 89, r: 3.9, style: "dot", color: "#24302C"},
        mouth: {x: 60, y: 98, w: 2.8, color: "#24302C"},
        cheeks: {lx: 42, rx: 78, y: 96, w: 4.2, h: 2.5, color: "#FF9A9A"},
        anchors: {top: [60, 56, 0.85], neck: [60, 104, 1], chest: [74, 100, 0.6], back: [88, 80, 0.8], hands: [60, 102, 0.85]},
        lines: {
          tap: ["Oh, hello. I've been sitting here, being steady for you.", "Slow and steady wears down mountains. Trust me.", "You're doing wonderfully. Rock solid.", "A little moss grows every day. So do you.", "No rush. Stones never rush.", "You can lean on me. I don't mind.", "Calm, cool and a bit mossy. That's the way.", "One more step. I'll be right here."],
          pet: ["Mmm, that's nice. Very soft.", "Hehe, careful, you'll ruffle my moss."],
          hello: ["Ah, you're back. Welcome, friend.", "Hello! I kept your seat warm. Well, cool."],
          morning: ["Good morning. The dew is lovely on my moss.", "Morning! Another fine day to be steady."],
          night: ["The night is quiet. Time to rest.", "Even stones sleep. Probably."],
          focus: ["Sitting still right beside you.", "Steady as a stone. You've got this."],
          done: ["A fine session. I'm proud of you.", "Done! That's a thousand years of progress in one sitting."],
          task: ["Another one done. Splendid.", "Checked off! Rock on!", "Lovely work. Truly.", "Done! Steady wins again."],
          break: ["Rest a bit. Sit like a stone.", "Break time. Breathe in the cool air."]
        }
      },
      {
        id: "waterfall-misty", name: "Nebbia", kind: "Spray Cloud", pose: "float", wearColor: "#5AB8F2",
        bio: "A puff of waterfall spray with a tiny rainbow that shows whenever the sun does.",
        idle: ["sway", "topBob", "sparkle"], cheer: "spin",
        parts: {
          body: `${RG("waterfall-misty-b", [[0, "#FFFFFF"], [0.7, "#EEF8FC"], [1, "#BFE0F0"]], 0.42, 0.35, 0.8)}
            <path d="${puff(60, 78, 26, 9)}" fill="url(#waterfall-misty-b)" ${O}/>
            <path d="M40 92Q60 100 80 92" fill="none" stroke="#BFE0F0" stroke-width="2.4" stroke-linecap="round"/>
            <g fill="#8ED0F0" ${OW(1.4)}><path d="M44 103c-2 3 -2 5 0 5s2 -2 0 -5z"/><path d="M60 106c-2 3 -2 5 0 5s2 -2 0 -5z"/><path d="M76 103c-2 3 -2 5 0 5s2 -2 0 -5z"/></g>
            ${shine(46, 64, 6, 3, -30)}`,
          armL: {svg: `<circle cx="31" cy="86" r="6.4" fill="#F4FBFE" ${O}/>`, pivot: [36, 84]},
          armR: {svg: `<circle cx="89" cy="86" r="6.4" fill="#F4FBFE" ${O}/>`, pivot: [84, 84]},
          top: {svg: `<path d="M38 56A22 22 0 0 1 82 56" fill="none" stroke="${INK}" stroke-width="11.6" stroke-linecap="round"/>${["#FF7A7A", "#FFC85A", "#7EDB6A", "#5AB8F2", "#A68AF0"].map((c, i) => `<path d="M${38 + i * 2} 56A${22 - i * 2} ${22 - i * 2} 0 0 1 ${82 - i * 2} 56" fill="none" stroke="${c}" stroke-width="2.3"/>`).join("")}<circle cx="38" cy="57" r="5" fill="#fff" ${O2}/><circle cx="82" cy="57" r="5" fill="#fff" ${O2}/>`, pivot: [60, 58]}
        },
        eyes: {lx: 50, rx: 70, y: 78, r: 4.4, style: "sparkle", color: "#24405A"},
        mouth: {x: 60, y: 88, w: 3, color: "#24405A"},
        cheeks: {lx: 42, rx: 78, y: 86, w: 4.4, h: 2.7, color: "#FF9AB8"},
        anchors: {top: [60, 50, 0.85], neck: [60, 100, 1], chest: [72, 94, 0.62], back: [86, 76, 0.8], hands: [60, 98, 0.85]},
        lines: {
          tap: ["Whoosh! Hi! I just floated up from the falls!", "Every time you smile, my rainbow gets brighter!", "Light and airy, you're doing great!", "Here comes the sun, and here comes your progress!", "Mist you! Hehe, I mean, missed you!", "A little sparkle for your study time!", "Rise up like spray, you've got this!", "Colors everywhere when you focus like that!"],
          pet: ["Hehe! I'm all fluffy and damp!", "Ooh, my rainbow wiggled!"],
          hello: ["You're here! Rainbow time!", "Hiii! I drifted over to say hello!"],
          morning: ["Good morning! The sun's on the spray!", "Morning! Let's make today colorful!"],
          night: ["My rainbow's sleeping. Yours should too, soon.", "Moon mist tonight. Rest well."],
          focus: ["Floating quietly beside you.", "Soft and still, right here with you."],
          done: ["What a session! Double rainbow!", "Done! I'm glowing in every color!"],
          task: ["Whoosh! Done!", "Checked off! Sparkle!", "Another one! Rainbow bright!", "Yes! That's a colorful win!"],
          break: ["Break! Float around for a minute!", "Breathe in the cool, misty air!"]
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
        id: "redwoods-hartley", name: "Hartley", kind: "Sorrel Sprout", pose: "stand", wearColor: "#5AA048",
        bio: "Redwood sorrel with three heart leaves. Naps whenever the sun gets too bright.",
        idle: ["sway", "wave", "topBob"], cheer: "spin",
        neck: [60, 84],
        parts: {
          feet: `<path d="M60 106C56 108 50 110 46 109M60 106C64 108 70 110 74 109" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M60 106C56 108 50 110 46 109M60 106C64 108 70 110 74 109" fill="none" stroke="#C89A70" stroke-width="2.4" stroke-linecap="round"/>`,
          body: `${LINE("M60 84C59 92 61 98 60 106", "#6AA84A", 4)}${LINE("M59 99Q50 98 41 100M61 99Q70 98 79 100", "#6AA84A", 2.4)}`,
          armL: {svg: `${RG("redwoods-hartley-l", [[0, "#B8EA88"], [1, "#4E9A3E"]], 0.5, 0.35, 0.8)}${heart(31, 101.6, 0.8, -100, "redwoods-hartley-l")}`, pivot: [40, 100]},
          armR: {svg: `${RG("redwoods-hartley-r", [[0, "#B8EA88"], [1, "#4E9A3E"]], 0.5, 0.35, 0.8)}${heart(89, 101.6, 0.8, 100, "redwoods-hartley-r")}`, pivot: [80, 100]},
          head: `${RG("redwoods-hartley-h", [[0, "#C8F098"], [0.6, "#7CC45A"], [1, "#4E9A3E"]], 0.45, 0.35, 0.8)}
            <path d="M60 88C46 80 30 72 30 56C30 45 39 38 48 38C54 38 58 41 60 46C62 41 66 38 72 38C81 38 90 45 90 56C90 72 74 80 60 88Z" fill="url(#redwoods-hartley-h)" ${O}/>
            <path d="M60 50V82" stroke="#5A9A40" stroke-width="1.6" stroke-linecap="round" opacity=".5"/>
            ${shine(42, 48, 5, 2.6, -40)}`,
          top: {svg: `${LINE("M60 46V36", "#6AA84A", 2)}${[0, 1, 2, 3, 4].map(i => { const a = i * 72 * Math.PI / 180; return `<ellipse cx="${(60 + Math.sin(a) * 5).toFixed(2)}" cy="${(31 - Math.cos(a) * 5).toFixed(2)}" rx="3.6" ry="5" transform="rotate(${i * 72} ${(60 + Math.sin(a) * 5).toFixed(2)} ${(31 - Math.cos(a) * 5).toFixed(2)})" fill="#FFF0F4" ${OW(1.8)}/>`; }).join("")}<circle cx="60" cy="31" r="2.6" fill="#FFD45A" ${OW(1.4)}/><path d="M57 27l1.6 2.6M63 27l-1.6 2.6" stroke="#F28AB0" stroke-width="1" stroke-linecap="round"/>`, pivot: [60, 46]}
        },
        eyes: {lx: 51, rx: 69, y: 59, r: 3.9, style: "dot", color: "#1E3A1A"},
        mouth: {x: 60, y: 67, w: 2.8, color: "#1E3A1A"},
        cheeks: {lx: 43, rx: 77, y: 65, w: 4.2, h: 2.5, color: "#FF9AB0"},
        anchors: {top: [60, 40, 0.85], neck: [60, 86, 0.8], chest: [66, 98, 0.5], back: [84, 70, 0.7], hands: [60, 98, 0.8]},
        lines: {
          tap: ["Hi! I've got three hearts and they're all cheering for you!", "You're doing lovely work today!", "Tiny but mighty, that's us!", "A little green goes a long way!", "You make the forest floor feel sunny!", "Leaf it to me, I'll cheer you on!", "Heart, heart, heart! That's how much I believe in you!", "Soft steps, steady progress!"],
          pet: ["Hehe, my leaves are folding up from joy!", "Ooh, that made my flower blush!"],
          hello: ["You're back! All three leaves are waving!", "Hello! I saved you a sunny spot!"],
          morning: ["Good morning! Leaves open, ready to go!", "Morning! There's dew on my hearts!"],
          night: ["Folding my leaves for the night. You rest too!", "Goodnight soon, friend. Sleep soft."],
          focus: ["Growing quietly right here.", "Leaves open, mind open. Let's focus."],
          done: ["What a session! I'm blooming!", "Done! My flower opened just for you!"],
          task: ["Yay! Done!", "Checked off! Heart-y work!", "Another one! Blooming lovely!", "Yes! Leaf-tastic!"],
          break: ["Break! Turn your face to the light for a minute!", "Rest a bit. Even sorrel naps!"]
        }
      },
      {
        id: "redwoods-burl", name: "Burl", kind: "Sprouting Stump", pose: "sit", wearColor: "#C0663A",
        bio: "An old redwood stump with a new shoot on top. Knows all about starting again.",
        idle: ["topBob", "bounce", "sparkle"], cheer: "bounce",
        parts: {
          body: `${LG("redwoods-burl-b", [[0, "#B86A44"], [1, "#7A3E26"]], 0, 0, 1, 0)}${RG("redwoods-burl-t", [[0, "#F6D6A8"], [1, "#D49A64"]], 0.5, 0.5, 0.6)}
            <path d="M28 66V98Q28 104 22 108H98Q92 104 92 98V66Z" fill="url(#redwoods-burl-b)" ${O}/>
            <path d="M36 74V100M46 76V104M74 76V104M84 74V100" stroke="#5E2C18" stroke-width="2" stroke-linecap="round" opacity=".45"/>
            <ellipse cx="60" cy="66" rx="32" ry="10" fill="url(#redwoods-burl-t)" ${O}/>
            <g fill="none" stroke="#B87A48" stroke-width="1.5" opacity=".8"><ellipse cx="60" cy="66" rx="22" ry="6.6"/><ellipse cx="60" cy="66" rx="13" ry="3.8"/><ellipse cx="60" cy="66" rx="5" ry="1.5"/></g>
            <path d="M34 101Q60 107 86 101" fill="none" stroke="#5E2C18" stroke-width="1.6" opacity=".4"/>
            <ellipse cx="60" cy="88" rx="20" ry="12" fill="#E2A27A" opacity=".55"/>`,
          armL: {svg: `${LINE("M30 84L20 78", "#8A4A2C", 3.2)}${leaf(20, 78, 9, 3.4, -130, "#7CBE5A")}`, pivot: [30, 84]},
          armR: {svg: `${LINE("M90 84L100 78", "#8A4A2C", 3.2)}${leaf(100, 78, 9, 3.4, -50, "#7CBE5A")}`, pivot: [90, 84]},
          top: {svg: `${LINE("M60 66C60 58 59 52 60 46", "#5DAA62", 2.6)}<path d="M60 48C55 39 45 38 40 43C45 50 54 52 60 48Z" fill="#8AD08A" ${O2}/><path d="M60 47C64 37 74 34 80 38C77 46 68 50 60 47Z" fill="#9BDA95" ${O2}/>`, pivot: [60, 66]}
        },
        eyes: {lx: 51, rx: 69, y: 86, r: 4.1, style: "dot", color: "#2A140C"},
        mouth: {x: 60, y: 95, w: 3, color: "#2A140C"},
        cheeks: {lx: 43, rx: 77, y: 93, w: 4.2, h: 2.5, color: "#FF8A7A"},
        anchors: {top: [60, 62, 0.9], neck: [60, 104, 1], chest: [74, 98, 0.62], back: [90, 78, 0.8], hands: [60, 100, 0.85]},
        lines: {
          tap: ["Hello there! Still growing, after all these years.", "Every ring is a year of trying. Keep going!", "A fresh shoot every spring. A fresh start every day!", "You're sturdier than you think.", "Deep roots, steady growth. That's you.", "Mistakes are just rings in the wood. They make you stronger.", "Slow growth is still growth!", "I'm proud of how far you've come."],
          pet: ["Oh! That's kind. My shoot is wiggling.", "Hehe, nobody's patted me in a century!"],
          hello: ["Ah, you're back! Come sit on my rings.", "Hello, friend! The grove's been quiet without you."],
          morning: ["Good morning! New light, new growth!", "Morning! My little shoot's reaching for the sun."],
          night: ["The grove is resting. Time for you to rest too.", "Goodnight soon. Tomorrow we grow again."],
          focus: ["Rooted right here beside you.", "Quiet and steady. You've got this."],
          done: ["A fine session! That's a ring to remember!", "Done! My shoot grew a whole leaf!"],
          task: ["Done! Another ring!", "Checked off! Sturdy work!", "Yes! Growing strong!", "Another one! Proud of you!"],
          break: ["Break time! Stretch your branches!", "Rest a while. Good things grow slowly."]
        }
      }
    ]
  });
})();
