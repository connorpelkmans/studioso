/* Study Companions, around the world: venice (Venice) */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const f1 = v => Math.round(v * 10) / 10;
  const twinkle = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${c || "#fff"}"/>`;
  // a little lapping wave under a floating friend
  const wave = (x0, x1, y) => { let d = `M${x0} ${y}`; for (let x = x0; x < x1; x += 8) d += `Q${x + 2} ${y - 4} ${x + 4} ${y}Q${x + 6} ${y + 3} ${x + 8} ${y}`; return d; };

  /* ================= Venice ================= */
  COMP_DATA.push({
    theme: "venice",
    companions: [
      {
        id: "venice-gondi", name: "Gondi", kind: "Little Gondola", pose: "stand", wearColor: "#C8302E",
        bio: "Glides through the trickiest canals of your schedule.",
        idle: ["sway", "topBob", "sparkle"], cheer: "bounce",
        neck: [60, 88],
        parts: {
          feet: `${LG("venice-gondi-w", [[0, "#7CCAC0"], [1, "#3E9A92"]])}
            <path d="M14 106Q20 100 28 104Q36 108 44 103Q52 99 60 104Q68 108 76 103Q84 99 92 104Q100 108 106 103L106 111Q60 115 14 111Z" fill="url(#venice-gondi-w)" ${O}/>
            <path d="${wave(22, 98, 108)}" fill="none" stroke="#D4F0EC" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`,
          body: `${LG("venice-gondi-h", [[0, "#3A3A52"], [0.6, "#24243A"], [1, "#16162A"]])}
            <path d="M10 60Q6 70 12 80Q22 98 60 101Q94 100 104 84Q108 76 110 64Q104 66 100 74Q94 84 60 86Q30 86 20 76Q16 70 18 62Z" fill="url(#venice-gondi-h)" ${O}/>
            <path d="M18 64Q8 58 12 50Q18 46 20 54" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M18 64Q8 58 12 50Q18 46 20 54" fill="none" stroke="#2E2E46" stroke-width="3.2" stroke-linecap="round"/>
            <path d="M104 70L110 46L114 46L112 70Z" fill="#E4E8F0" ${O2}/>
            <path d="M110.6 50H116M110.2 55H115.4M109.6 60H114.6" stroke="#E4E8F0" stroke-width="2.6" stroke-linecap="round"/><path d="M110.6 50H116M110.2 55H115.4M109.6 60H114.6" stroke="${INK}" stroke-width=".9" stroke-linecap="round" opacity=".5"/>
            <path d="M22 80Q60 94 100 80" fill="none" stroke="#E2B048" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M28 86Q44 92 58 92" fill="none" stroke="#5A5A78" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
            ${twinkle(96, 92, 2.6, "#FFE27A")}`,
          head: `${LG("venice-gondi-c", [[0, "#FFF8EA"], [1, "#F0E2C6"]])}
            <path d="M36 86V60Q36 44 60 44Q84 44 84 60V86Z" fill="url(#venice-gondi-c)" ${O}/>
            <path d="M36 60Q36 48 46 46L46 86H36Z" fill="#C8302E" ${O2}/><path d="M84 60Q84 48 74 46L74 86H84Z" fill="#C8302E" ${O2}/>
            <path d="M40 54V80M80 54V80" stroke="#E2605A" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M48 50Q54 47 60 47" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>`,
          top: {svg: `${LG("venice-gondi-s", [[0, "#F6DE96"], [1, "#D8B460"]])}
            <ellipse cx="60" cy="44" rx="23" ry="5" fill="url(#venice-gondi-s)" ${O}/>
            <path d="M47 43V33Q47 30 50 30H70Q73 30 73 33V43Z" fill="url(#venice-gondi-s)" ${O}/>
            <path d="M47 37H73V41.4H47Z" fill="#C8302E" ${OW(1.8)}/><path d="M73 39L80 35L79 42Z" fill="#C8302E" ${OW(1.6)}/>
            <path d="M50 33H58" stroke="#FFF6D6" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [60, 46]}
        },
        eyes: {lx: 52, rx: 68, y: 64, r: 4, style: "sparkle", color: "#22203A"},
        mouth: {x: 60, y: 73, w: 3, color: "#22203A"},
        cheeks: {lx: 48.6, rx: 71.4, y: 71, w: 3, h: 2, color: "#FF8A90"},
        anchors: {top: [60, 38, 0.9], neck: [60, 86, 1], chest: [60, 94, 0.6], back: [22, 76, 0.8], hands: [60, 96, 0.84]},
        lines: {
          tap: ["Ciao! All aboard for a calm study ride!", "One stroke at a time, we glide through it!", "Your schedule has canals? I know them all!", "Steady oar, steady mind. Bellissimo!", "We'll float past that deadline easily!", "No traffic on the water. Just focus!", "Lean in, little stroke, big progress!", "Under the bridge and on to the next page!"],
          pet: ["Hehe! You're rocking the boat!", "Aww, smooth sailing now!"],
          hello: ["Ciao! Your gondola is ready!", "You're back! Hop aboard, friend!"],
          morning: ["Buongiorno! The canal is calm today.", "Good morning! Fresh tides, fresh start!"],
          night: ["Buonanotte! Even gondolas need mooring.", "The lanterns are lit. Rest soon, okay?"],
          focus: ["Gliding quietly right beside you.", "Smooth water ahead. Keep rowing!"],
          done: ["What a voyage! Bravissimo!", "All done! Docked in style!"],
          task: ["Done! Smooth sailing!", "Checked off! Bravo!", "Another canal crossed!", "Yes! Full speed ahead!"],
          break: ["Mooring break! Stretch on the dock!", "Drift for a bit, then back to rowing!"]
        }
      },
      {
        id: "venice-pippo", name: "Pippo", kind: "Venetian Pigeon", pose: "stand", wearColor: "#5FA888",
        bio: "Struts around the piazza like it owns your to-do list.",
        idle: ["headTilt", "wingFlutter", "waddle"], cheer: "wingFlutter",
        neck: [60, 66],
        parts: {
          tail: {svg: `<path d="M42 92L27 96Q24 100 27 104L42 100Z" fill="#8A90A4" ${O}/><path d="M28 99L38 97.6M28.6 102L38 100" stroke="#5A5E72" stroke-width="1.4" stroke-linecap="round"/>`, pivot: [42, 96]},
          feet: `<path d="M50 104V110M46 111L50 109L54 111M70 104V110M66 111L70 109L74 111" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M50 104V110M46 111L50 109L54 111M70 104V110M66 111L70 109L74 111" fill="none" stroke="#E88A96" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
          wingL: {svg: `${LG("venice-pippo-w", [[0, "#C4CAD8"], [1, "#9AA0B4"]])}<path d="M42 72C30 76 26 90 30 100C38 98 46 90 46 78Z" fill="url(#venice-pippo-w)" ${O}/><path d="M32 88L42 84M33 94L42 90" stroke="#4A4E5C" stroke-width="2" stroke-linecap="round"/>`, pivot: [44, 74]},
          wingR: {svg: `<path d="M78 72C90 76 94 90 90 100C82 98 74 90 74 78Z" fill="url(#venice-pippo-w)" ${O}/><path d="M88 88L78 84M87 94L78 90" stroke="#4A4E5C" stroke-width="2" stroke-linecap="round"/>`, pivot: [76, 74]},
          body: `${RG("venice-pippo-b", [[0, "#C8CEDC"], [0.7, "#A8AEC2"], [1, "#8A90A6"]], 0.45, 0.35, 0.7)}${LG("venice-pippo-n", [[0, "#6CB89A"], [0.5, "#5FA888"], [1, "#9070B0"]])}
            <ellipse cx="60" cy="86" rx="24" ry="20" fill="url(#venice-pippo-b)" ${O}/>
            <path d="M44 72Q60 82 76 72Q76 64 60 62Q44 64 44 72Z" fill="url(#venice-pippo-n)" ${O2}/>
            <path d="M48 72Q54 75 58 74" fill="none" stroke="#B8E0CC" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
            <ellipse cx="60" cy="92" rx="11" ry="8" fill="#D6DAE6" opacity=".7"/>`,
          head: `${RG("venice-pippo-h", [[0, "#B8BED0"], [0.8, "#969CB2"], [1, "#868CA2"]], 0.42, 0.32, 0.75)}
            <circle cx="60" cy="50" r="19" fill="url(#venice-pippo-h)" ${O}/>
            <path d="M56 58L60 54L64 58L60 64Z" fill="#3A3430" ${O2}/><ellipse cx="60" cy="54.6" rx="3.6" ry="1.8" fill="#F2ECEA" ${OW(1.4)}/>
            <path d="M48 38Q54 33 62 33" fill="none" stroke="#DCE0EC" stroke-width="2.6" stroke-linecap="round"/>
            `
        },
        eyes: {lx: 50, rx: 70, y: 46, r: 3.8, style: "round", color: "#2A1E22"},
        mouth: {x: 60, y: 66, w: 2, color: "#3A3430"},
        cheeks: {lx: 45, rx: 75, y: 54, w: 3, h: 2, color: "#FF9EB0"},
        anchors: {top: [60, 32, 0.85], neck: [60, 66, 0.95], chest: [60, 84, 0.6], back: [80, 82, 0.8], hands: [60, 96, 0.84]},
        lines: {
          tap: ["Coo! This whole piazza is my study hall!", "Strut, peck, study. That's the plan!", "I have walked every square. Now your list!", "Crumbs of progress everywhere. Love it!", "Head up, chest out, one task at a time!", "Coo coo! I'm proud of you, truly!", "I'll guard your notes from the seagulls!", "Peck, peck! That's how big tasks get done!"],
          pet: ["Coo! My shiny neck feathers!", "Hehe! Ruffled, but happy!"],
          hello: ["Coo! You came back to the piazza!", "Hi hi! I saved you the sunny spot!"],
          morning: ["Buongiorno! Breakfast crumbs and books!", "Good morning! The bells woke me up!"],
          night: ["Buonanotte! Time to roost, friend.", "It's late! Tuck in your feathers soon."],
          focus: ["Perched quietly beside you.", "No fluttering now. Deep focus!"],
          done: ["Coo coo! Champion of the piazza!", "All done! Victory strut!"],
          task: ["Done! Coo!", "Checked off! Flap flap!", "Another one pecked away!", "Yes! Proud pigeon moment!"],
          break: ["Break! Go stretch your wings!", "Take a stroll around the square!"]
        }
      },
      {
        id: "venice-masca", name: "Masca", kind: "Carnival Mask", pose: "stand", wearColor: "#E2B048",
        bio: "Hides a big grin behind all that glitter.",
        idle: ["sparkle", "headTilt", "topBob"], cheer: "spin",
        neck: [60, 82],
        parts: {
          feet: `<ellipse cx="50" cy="106" rx="7" ry="4.2" fill="#2E6A7A" ${O}/><ellipse cx="70" cy="106" rx="7" ry="4.2" fill="#2E6A7A" ${O}/>`,
          armL: {svg: `<ellipse cx="34" cy="92" rx="5" ry="6.6" transform="rotate(28 34 92)" fill="#F6EEE4" ${O}/>`, pivot: [40, 88]},
          armR: {svg: `<ellipse cx="86" cy="92" rx="5" ry="6.6" transform="rotate(-28 86 92)" fill="#F6EEE4" ${O}/>`, pivot: [80, 88]},
          body: `${LG("venice-masca-b", [[0, "#C8463E"], [1, "#9A2A30"]])}
            <path d="M42 84Q60 80 78 84L84 104Q60 110 36 104Z" fill="url(#venice-masca-b)" ${O}/>
            <path d="M48 84L52 94L48 104M60 82L64 94L60 108M72 84L68 94L72 104" fill="none" stroke="#E2B048" stroke-width="1.8" stroke-linejoin="round"/>
            <path d="M52 94L56 88L60 94L56 100Z M64 94L68 88L72 94L68 100Z" fill="#2E7A86"/>
            <path d="${puff(60, 84, 14, 10, 1.25)}" fill="#FFFFFF" ${O2}/>`,
          head: `${RG("venice-masca-h", [[0, "#FFF8F0"], [1, "#F0E0D0"]], 0.42, 0.35, 0.75)}${LG("venice-masca-m", [[0, "#F6D06A"], [0.5, "#E2B048"], [1, "#C08A2E"]])}
            <circle cx="60" cy="60" r="22" fill="url(#venice-masca-h)" ${O}/>
            <path d="M34 54Q33 44 44 44Q54 44 60 50Q66 44 76 44Q87 44 86 54Q86 64 76 66Q66 68 60 60Q54 68 44 66Q34 64 34 54Z" fill="url(#venice-masca-m)" ${O}/>
            <ellipse cx="49" cy="55" rx="7" ry="5" fill="#FFF8F0" ${OW(1.8)}/><ellipse cx="71" cy="55" rx="7" ry="5" fill="#FFF8F0" ${OW(1.8)}/>
            <path d="M38 50Q40 46 44 46M82 50Q80 46 76 46" fill="none" stroke="#FFF2C8" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M58 49L60 46L62 49L60 52Z" fill="#2E7A86" ${OW(1)}/>
            <path d="M34 54Q28 52 28 46Q28 42 32 42" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M34 54Q28 52 28 46Q28 42 32 42" fill="none" stroke="#E2B048" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M86 54Q92 52 92 46Q92 42 88 42" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M86 54Q92 52 92 46Q92 42 88 42" fill="none" stroke="#E2B048" stroke-width="2.6" stroke-linecap="round"/>
            ${[[40, 62], [80, 62], [47, 47], [73, 47]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1" fill="#FFFFFF"/>`).join("")}`,
          top: {svg: `<path d="M56 42Q46 24 52 10Q58 22 60 40Z" fill="#2E7A86" ${O2}/><path d="M60 40Q60 18 70 6Q72 24 64 42Z" fill="#C8463E" ${O2}/><path d="M64 42Q72 28 84 24Q78 36 68 44Z" fill="#E2B048" ${O2}/>
            <path d="M53 14Q56 26 58 38M68 10Q64 24 62 38M80 27Q72 34 66 42" fill="none" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round" opacity=".6"/>
            <circle cx="61" cy="42" r="4" fill="#E2B048" ${OW(1.8)}/><circle cx="60" cy="41" r="1.2" fill="#FFF6D0"/>`, pivot: [61, 44]}
        },
        eyes: {lx: 49, rx: 71, y: 55, r: 3.6, style: "sparkle", color: "#2A1E30"},
        mouth: {x: 60, y: 72, w: 4, color: "#2A1E30"},
        cheeks: {lx: 45, rx: 75, y: 70, w: 3.4, h: 2.2, color: "#FF8AA0"},
        anchors: {top: [60, 38, 0.9], neck: [60, 82, 1], chest: [60, 94, 0.6], back: [82, 90, 0.8], hands: [60, 100, 0.84]},
        lines: {
          tap: ["Ta-da! Behind this mask, a huge grin!", "Glitter on, focus on. Let's go!", "Every page is a little masquerade!", "Who's that genius? Oh, it's you!", "Carnival rule: twirl after every task!", "Sparkle mode activated. You've got this!", "I wear gold, but your work shines more!", "A dash of glitter, a lot of grit!"],
          pet: ["Hehe! Careful, the glitter spreads!", "Aww! My feathers are blushing!"],
          hello: ["Ciao! The carnival starts now!", "You're back! Masks off, smiles on!"],
          morning: ["Buongiorno! Fresh glitter for today!", "Good morning! Let's sparkle!"],
          night: ["Buonanotte! Even the carnival sleeps.", "Late again? Hang up the mask soon!"],
          focus: ["Shimmering quietly beside you.", "Eyes on the work. Masterful!"],
          done: ["What a grand finale! Bravissimo!", "All done! Take a bow, star!"],
          task: ["Done! Twirl time!", "Checked off! Sparkle!", "Another one! Encore!", "Yes! Pure gold!"],
          break: ["Intermission! Stretch and dance!", "Take a little twirl, then back!"]
        }
      }
    ]
  });
})();
