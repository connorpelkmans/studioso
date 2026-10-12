/* Study Companions, new theme ideas batch n16: saguaro, baobab. Each theme has one nature-object character and two young animals. */
(() => {
  const {INK, O, OW, LG, RG, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const f1 = v => Math.round(v * 10) / 10;
  const twinkle = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${c || "#fff"}"/>`;
  const shine = (x, y, rx, ry, a) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})" fill="#fff" opacity=".7"/>`;
  const ring = (cx, cy, n, R, fn, rot = 0) => Array.from({length: n}, (_, i) => { const a = -Math.PI / 2 + rot + i * 2 * Math.PI / n; return fn(f1(cx + R * Math.cos(a)), f1(cy + R * Math.sin(a)), a, i); }).join("");
  // a white saguaro blossom with a golden heart
  const sagFlower = (x, y, r) => `${ring(x, y, 6, r * 0.62, (px, py) => `<circle cx="${px}" cy="${py}" r="${f1(r * 0.5)}" fill="#FFFBF2" ${OW(1.3)}/>`)}<circle cx="${x}" cy="${y}" r="${f1(r * 0.42)}" fill="#F6C83A" ${OW(1.3)}/>`;
  const tuft = (x, y, r, c1, c2) => `<g>${[[-0.7, 0.1], [0.7, 0.1], [0, -0.45], [-0.35, 0.5], [0.4, 0.5]].map(([dx, dy]) => `<ellipse cx="${f1(x + dx * r)}" cy="${f1(y + dy * r)}" rx="${f1(r * 0.62)}" ry="${f1(r * 0.48)}" fill="${c1}" ${OW(1.6)}/>`).join("")}<ellipse cx="${f1(x - r * 0.2)}" cy="${f1(y - r * 0.3)}" rx="${f1(r * 0.34)}" ry="${f1(r * 0.22)}" fill="${c2}"/></g>`;

  /* ================= Saguaro Sunset ================= */
  COMP_DATA.push({
    theme: "saguaro",
    companions: [
      {
        id: "saguaro-sago", name: "Sago", kind: "Saguaro Sprout", pose: "stand", wearColor: "#E0683E",
        bio: "A young saguaro with a crown of white blossoms. Give it a hundred years.",
        idle: ["wave", "topBob", "sway"], cheer: "hop",
        neck: [60, 80],
        parts: {
          feet: `${LG("saguaro-sago-m", [[0, "#F2B88A"], [1, "#D88A62"]])}<path d="M28 112C32 103 45 100 60 100C75 100 88 103 92 112Z" fill="url(#saguaro-sago-m)" ${O}/>
            <path d="M36 107q3-2 6 0M76 106q3-2 6 0" fill="none" stroke="#B86A48" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="82" cy="104" rx="3.6" ry="2.4" fill="#A8503E" ${OW(1.4)}/>`,
          body: `${LG("saguaro-sago-b", [[0, "#5E9A50"], [0.55, "#86BC6A"], [1, "#4E8444"]], 0, 0, 1, 0)}
            <path d="M44 104V72C44 67 50 65 60 65C70 65 76 67 76 72V104Z" fill="url(#saguaro-sago-b)" ${O}/>
            <path d="M49 80V102M71 80V102M55 84V102M65 84V102" fill="none" stroke="#3E7A3A" stroke-width="1.5" stroke-linecap="round" opacity=".55"/>
            <g fill="#FFF3D6">${[[49, 86], [49, 98], [71, 88], [71, 100], [55, 92], [65, 96]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1"/>`).join("")}</g>`,
          head: `${LG("saguaro-sago-h", [[0, "#5E9A50"], [0.55, "#86BC6A"], [1, "#4E8444"]], 0, 0, 1, 0)}
            <path d="M44 74V58C44 46 51 38 60 38C69 38 76 46 76 58V74C76 78.6 70 81 60 81C50 81 44 78.6 44 74Z" fill="url(#saguaro-sago-h)" ${O}/>
            <path d="M49 48V76M54 42V52M66 42V52M71 48V76" fill="none" stroke="#3E7A3A" stroke-width="1.5" stroke-linecap="round" opacity=".55"/>
            <g fill="#FFF3D6">${[[49, 56], [49, 70], [71, 60], [71, 72], [54, 47], [66, 47]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1"/>`).join("")}</g>
            ${shine(51, 52, 2.2, 6, 8)}`,
          armL: {svg: `${LG("saguaro-sago-l", [[0, "#5E9A50"], [1, "#86BC6A"]], 0, 0, 1, 0)}<path d="M45.5 86H36C31 86 28 82 28 77V65C28 61.5 30.5 59 34 59C37.5 59 40 61.5 40 65V75H45.5Z" fill="url(#saguaro-sago-l)" ${O2}/><path d="M32 66V80" stroke="#3E7A3A" stroke-width="1.3" stroke-linecap="round" opacity=".55"/>`, pivot: [44, 80]},
          armR: {svg: `${LG("saguaro-sago-r", [[0, "#86BC6A"], [1, "#4E8444"]], 0, 0, 1, 0)}<path d="M74.5 80H84C89 80 92 76 92 71V59C92 55.5 89.5 53 86 53C82.5 53 80 55.5 80 59V69H74.5Z" fill="url(#saguaro-sago-r)" ${O2}/><path d="M88 60V74" stroke="#3E7A3A" stroke-width="1.3" stroke-linecap="round" opacity=".55"/>`, pivot: [76, 75]},
          top: {svg: `${sagFlower(51, 38, 6.4)}${sagFlower(69, 38, 6.4)}${sagFlower(60, 33, 7.4)}`, pivot: [60, 40]}
        },
        eyes: {lx: 53, rx: 67, y: 62, r: 3.6, style: "sparkle", color: "#24301E"},
        mouth: {x: 60, y: 70, w: 2.4, color: "#24301E"},
        cheeks: {lx: 49, rx: 71, y: 67, w: 2.8, h: 1.8, color: "#FF9A8A"},
        anchors: {top: [60, 28, 0.8], neck: [60, 82, 0.7], chest: [66, 90, 0.5], back: [74, 70, 0.66], hands: [60, 92, 0.8]},
        lines: {
          tap: ["Hi! I'm only a little saguaro, but I dream tall.", "Slow and steady grows the tallest cactus.", "Arms up! That's how saguaros say hooray.", "You're blooming, I can tell from here!", "Tough outside, soft inside. Just like you.", "Every big cactus started as one tiny seed.", "Sunset vibes and study time. Perfect."],
          pet: ["Careful, I'm a bit prickly! Hehe.", "Aww, my blossoms just did a happy wiggle."],
          hello: ["You're back! The whole desert is glowing.", "Hey there! Pull up a warm rock and sit."],
          morning: ["Good morning! The desert is cool and fresh."],
          night: ["My flowers open at night. Yours should close!"],
          focus: ["Standing tall right here with you.", "Quiet desert, clear mind. You've got this."],
          done: ["What a session! I'd grow a new arm for that!", "All done! That deserves a sunset."],
          task: ["Bloom! Another one done!", "Checked off! Arms up!", "Yes! That's a prickly one handled!", "Done! Growing strong!"],
          break: ["Break time! Drink some water, like a cactus."]
        }
      },
      {
        id: "saguaro-whit", name: "Whit", kind: "Elf Owlet", pose: "sit", wearColor: "#E0683E",
        bio: "The world's tiniest owl, raised in a cozy hole in a saguaro. Night person.",
        idle: ["wingFlutter", "headTilt", "bounce"], cheer: "wingFlutter",
        neck: [60, 72],
        parts: {
          feet: `<g fill="#E8C060" ${OW(1.8)}><path d="M47 106C47 103 51 102 53 104L55 110H45Z"/><path d="M73 106C73 103 69 102 67 104L65 110H75Z"/></g><path d="M48 110l-1 2M51 110v2.4M54 110l1 2M66 110l-1 2M69 110v2.4M72 110l1 2" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`,
          wingL: {svg: `${LG("saguaro-whit-wl", [[0, "#A8885E"], [1, "#7A5E40"]])}<path d="M40 74C31 80 30 96 39 106C45 99 46 86 43 74Z" fill="url(#saguaro-whit-wl)" ${O2}/><g fill="#F2E6CC"><circle cx="37" cy="86" r="1.3"/><circle cx="39.6" cy="93" r="1.3"/><circle cx="37" cy="99" r="1.1"/></g>`, pivot: [42, 76]},
          wingR: {svg: `${LG("saguaro-whit-wr", [[0, "#A8885E"], [1, "#7A5E40"]])}<path d="M80 74C89 80 90 96 81 106C75 99 74 86 77 74Z" fill="url(#saguaro-whit-wr)" ${O2}/><g fill="#F2E6CC"><circle cx="83" cy="86" r="1.3"/><circle cx="80.4" cy="93" r="1.3"/><circle cx="83" cy="99" r="1.1"/></g>`, pivot: [78, 76]},
          body: `${RG("saguaro-whit-b", [[0, "#D2B48E"], [0.6, "#B4946C"], [1, "#8E7050"]], 0.45, 0.35, 0.75)}
            <path d="M38 88C38 74 47 66 60 66C73 66 82 74 82 88C82 101 73 108 60 108C47 108 38 101 38 88Z" fill="url(#saguaro-whit-b)" ${O}/>
            <path d="M48 84C48 76 53 72 60 72C67 72 72 76 72 84C72 96 67 104 60 104C53 104 48 96 48 84Z" fill="#F2E6CC"/>
            <path d="M54 80l2 2 2-2M62 80l2 2 2-2M52 88l2 2 2-2M58 90l2 2 2-2M64 88l2 2 2-2M55 97l2 2 2-2M61 97l2 2 2-2" fill="none" stroke="#A8885E" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`,
          head: `${RG("saguaro-whit-h", [[0, "#D8BC96"], [0.6, "#BC9C74"], [1, "#94765A"]], 0.42, 0.32, 0.75)}
            <path d="M33 52C33 36 45 28 60 28C75 28 87 36 87 52C87 66 76 74 60 74C44 74 33 66 33 52Z" fill="url(#saguaro-whit-h)" ${O}/>
            <g fill="#F2E6CC">${[[42, 38], [48, 34], [55, 32], [65, 32], [72, 34], [78, 38], [38, 46], [82, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2"/>`).join("")}</g>
            ${shine(42, 40, 4, 2, -30)}`,
          face: `<circle cx="50" cy="52" r="10.4" fill="#F6ECD8"/><circle cx="70" cy="52" r="10.4" fill="#F6ECD8"/>
            <path d="M40 44Q50 39 58 46M80 44Q70 39 62 46" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round"/>
            <circle cx="50" cy="53" r="8.2" fill="#F6C83A" ${OW(1.4)}/><circle cx="70" cy="53" r="8.2" fill="#F6C83A" ${OW(1.4)}/>
            <path d="M57.4 58.6L62.6 58.6L60 64.4Z" fill="#B8B4A0" ${OW(1.5)}/>`
        },
        eyes: {lx: 50, rx: 70, y: 53, r: 6, style: "round", color: "#2B1A10"},
        mouth: {x: 60, y: 67.6, w: 2, color: "#2B1A10"},
        cheeks: {lx: 41, rx: 79, y: 62, w: 3.2, h: 2, color: "#FF9A8A"},
        anchors: {top: [60, 28, 0.85], neck: [60, 73, 0.8], chest: [68, 88, 0.55], back: [80, 80, 0.7], hands: [60, 96, 0.8]},
        lines: {
          tap: ["Hoo! Hello! I'm small but I see everything.", "I live in a saguaro. Best apartment ever.", "Big eyes, big focus. Let's do this!", "You're a real night owl hero.", "Tiny wings, mighty heart. That's us!", "Hoo hoo hooray for you!", "Wise move, opening your notes."],
          pet: ["Ooh, fluffy feathers! Hehe.", "Hoo, that's cozy. Again?"],
          hello: ["Hoo! You're here! I was waiting up.", "Hello! I just peeked out of my cactus."],
          morning: ["Morning already? Okay, one sleepy hoot. Hoo."],
          night: ["My favorite time! But you need sleep soon."],
          focus: ["Watching with my big owl eyes.", "Quiet as a feather. Keep going."],
          done: ["What a session! Hoo hoo hooray!", "Done! Wise owl approved."],
          task: ["Hoo! Another one done!", "Checked off! Wings up!", "Yes! Sharp eyes, sharp work!", "Done! A real hoot!"],
          break: ["Break time! Blink slowly, like an owl."]
        }
      },
      {
        id: "saguaro-pokey", name: "Pokey", kind: "Tortoise Hatchling", pose: "stand", wearColor: "#C8463A",
        bio: "A desert tortoise hatchling. Never rushes, never quits, always arrives.",
        idle: ["headTilt", "tailSwish", "bounce"], cheer: "hop",
        neck: [60, 92],
        parts: {
          tail: {svg: `<path d="M90 98C95 98 98 100 100 103C96 104 92 103 89 101Z" fill="#B8A070" ${O2}/>`, pivot: [90, 99]},
          feet: `<g fill="#B8A070" ${O2}><path d="M37 98C35 102 35 107 37 110H47C48 106 47 101 45 98Z"/><path d="M83 98C85 102 85 107 83 110H73C72 106 73 101 75 98Z"/></g><path d="M38 110v-2M41 110v-2.4M44 110v-2M76 110v-2M79 110v-2.4M82 110v-2" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`,
          body: `${RG("saguaro-pokey-s", [[0, "#D4AE6A"], [0.6, "#AE8448"], [1, "#86602E"]], 0.45, 0.3, 0.8)}
            <path d="M26 98C26 66 42 48 60 48C78 48 94 66 94 98Z" fill="url(#saguaro-pokey-s)" ${O}/>
            <g fill="#E2C482" opacity=".9" ${OW(1.6)}><path d="M52 56L68 56L72 66L60 72L48 66Z"/><path d="M38 70L46 68L50 80L42 88L34 84Z"/><path d="M82 70L74 68L70 80L78 88L86 84Z"/></g>
            <path d="M48 66L42 68M72 66L78 68M60 72V78M50 80L56 86M70 80L64 86M30 90H40M90 90H80" fill="none" stroke="#6E5230" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M24 98H96" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M25.5 98H94.5" stroke="#C89A58" stroke-width="3.6" stroke-linecap="round"/>
            ${shine(44, 58, 6, 2.6, -32)}`,
          head: `${RG("saguaro-pokey-h", [[0, "#D6C292"], [0.6, "#BCA674"], [1, "#9A845A"]], 0.42, 0.32, 0.8)}
            <path d="M54 96V88H66V96Z" fill="#AE9868" ${O2}/>
            <path d="M43 78C43 68 51 62 60 62C69 62 77 68 77 78C77 87 69 92 60 92C51 92 43 87 43 78Z" fill="url(#saguaro-pokey-h)" ${O}/>
            <g fill="#9A845A"><circle cx="52" cy="66.6" r="1"/><circle cx="60" cy="65" r="1.1"/><circle cx="68" cy="66.6" r="1"/><circle cx="56" cy="69" r=".8"/><circle cx="64" cy="69" r=".8"/></g>
            ${shine(50, 67, 3, 1.6, -30)}`
        },
        eyes: {lx: 53.5, rx: 66.5, y: 77, r: 3.4, style: "sparkle", color: "#2B2016"},
        mouth: {x: 60, y: 84.4, w: 2.4, color: "#2B2016"},
        cheeks: {lx: 48.5, rx: 71.5, y: 82, w: 2.8, h: 1.8, color: "#FF9A8A"},
        anchors: {top: [60, 48, 0.85], neck: [60, 94, 0.75], chest: [76, 76, 0.55], back: [74, 58, 0.75], hands: [60, 96, 0.8]},
        lines: {
          tap: ["Hi! I came as fast as I could. It took a while.", "Slow progress is still progress!", "My shell is my backpack. Always ready.", "One tiny step, then another. That's the way.", "You and me, the steady crew.", "Sun's warm, rock's warm, let's study!", "I'll be cheering. Slowly, but loudly."],
          pet: ["Hehe, that's my shell. It's very shiny now.", "Ooh, warm hands. Like a sunny rock."],
          hello: ["You're here! I started walking over an hour ago.", "Hello! Good to see you, friend."],
          morning: ["Good morning! Time to warm up in the sun."],
          night: ["Tuck in like a tortoise. Rest soon, okay?"],
          focus: ["Steady and slow, right beside you.", "No rush. Just keep going."],
          done: ["What a session! Even I'm impressed!", "Done! Slow and steady won the race."],
          task: ["Plod! Another one done!", "Checked off! Steady wins!", "Yes! One step closer!", "Done! Shell yeah!"],
          break: ["Break time! Find a sunny spot and stretch."]
        }
      }
    ]
  });

  /* ================= Baobab Dusk ================= */
  COMP_DATA.push({
    theme: "baobab",
    companions: [
      {
        id: "baobab-hery", name: "Hery", kind: "Baobab Sapling", pose: "stand", wearColor: "#C8603A",
        bio: "A baby baobab with a big round trunk. Will be giant in about 800 years.",
        idle: ["wave", "topBob", "sway"], cheer: "hop",
        parts: {
          feet: `${LG("baobab-hery-m", [[0, "#D87A56"], [1, "#B0563C"]])}<path d="M28 112C32 103 45 100 60 100C75 100 88 103 92 112Z" fill="url(#baobab-hery-m)" ${O}/>
            <path d="M36 107q3-2 6 0M78 106q3-2 6 0" fill="none" stroke="#8E4230" stroke-width="1.6" stroke-linecap="round"/><path d="M80 103q1-5 3-7M84 104q0-4 2-6" fill="none" stroke="#7A8A44" stroke-width="1.6" stroke-linecap="round"/>`,
          body: `${LG("baobab-hery-b", [[0, "#9A6A60"], [0.5, "#C29484"], [1, "#8A5A52"]], 0, 0, 1, 0)}
            <path d="M42 104C38 92 37 76 41 64C44 55 49 49 53 45H67C71 49 76 55 79 64C83 76 82 92 78 104Z" fill="url(#baobab-hery-b)" ${O}/>
            <path d="M47 96C45 86 45 74 48 64M73 96C75 86 75 74 72 64M56 98V88M64 98V88" fill="none" stroke="#7A4A44" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>
            ${shine(47, 62, 2.4, 7, 14)}`,
          armL: {svg: `<path d="M45.6 68L34 80.6C32.4 82.6 34.4 85.4 36.8 84L48.4 74Z" fill="#9A6A60" ${O2}/>${tuft(33, 85, 5, "#7A9A48", "#A8C46A")}`, pivot: [47, 70]},
          armR: {svg: `<path d="M74.4 68L86 80.6C87.6 82.6 85.6 85.4 83.2 84L71.6 74Z" fill="#9A6A60" ${O2}/>${tuft(87, 85, 5, "#7A9A48", "#A8C46A")}`, pivot: [73, 70]},
          top: {svg: `<g fill="#9A6A60" ${O2}><path d="M53 47L44 33L48 31L56 45Z"/><path d="M57 46L54 28L58 27.6L60 45Z"/><path d="M63 46L66 28L70 28.6L64.6 46Z"/><path d="M67 47L76 33L79.6 35L69 48Z"/></g>
            ${tuft(45, 30, 6.4, "#6E8E40", "#9CBC5E")}${tuft(56, 25, 6.4, "#7A9A48", "#A8C46A")}${tuft(68, 25, 6.4, "#6E8E40", "#9CBC5E")}${tuft(78, 31, 6.2, "#7A9A48", "#A8C46A")}`, pivot: [60, 47]}
        },
        eyes: {lx: 53, rx: 67, y: 74, r: 3.6, style: "sparkle", color: "#2E1A16"},
        mouth: {x: 60, y: 82, w: 2.4, color: "#2E1A16"},
        cheeks: {lx: 48.5, rx: 71.5, y: 79, w: 3, h: 1.9, color: "#FF9A8A"},
        anchors: {top: [60, 22, 0.8], neck: [60, 88, 0.75], chest: [68, 92, 0.5], back: [76, 76, 0.66], hands: [60, 94, 0.8]},
        lines: {
          tap: ["Salama! Hello from the avenue!", "Big trunk, big plans, tiny leaves.", "I store water in my trunk. You store facts!", "Roots down, branches up. Let's study.", "Even giants start as little sprouts.", "Dusk is my favorite time to grow.", "You're doing great. I'm rooting for you!"],
          pet: ["Hehe, my bark is smooth, right?", "Aww, my leaves just rustled happily."],
          hello: ["You're here! The whole avenue says hi.", "Hello! Come sit in my tiny shade."],
          morning: ["Good morning! Time to soak up the sun."],
          night: ["The stars are out. Rest your roots soon."],
          focus: ["Standing tall beside you.", "Deep roots, steady mind. Keep going."],
          done: ["What a session! I grew a whole leaf!", "Done! That's giant progress."],
          task: ["Rustle! Another one done!", "Checked off! Branches up!", "Yes! Rooted in success!", "Done! Growing strong!"],
          break: ["Break time! Drink some water. Trees insist."]
        }
      },
      {
        id: "baobab-zaza", name: "Zaza", kind: "Baby Ring-tailed Lemur", pose: "sit", wearColor: "#C8603A",
        bio: "A baby lemur with a stripy tail held high. Loves sunbathing at dusk.",
        idle: ["tailSwish", "earTwitch", "wave"], cheer: "hop",
        neck: [60, 70],
        parts: {
          tail: {svg: `<path d="M76 102C94 102 104 88 101 70C99 58 93 50 86 45" fill="none" stroke="${INK}" stroke-width="13" stroke-linecap="round"/><path d="M76 102C94 102 104 88 101 70C99 58 93 50 86 45" fill="none" stroke="#FAF6F0" stroke-width="8.4" stroke-linecap="round"/><path d="M76 102C94 102 104 88 101 70C99 58 93 50 86 45" fill="none" stroke="#3A3438" stroke-width="8.4" stroke-dasharray="5.6 5.6" stroke-dashoffset="2"/>`, pivot: [78, 100]},
          feet: `<g fill="#3A3438" ${OW(1.8)}><ellipse cx="50" cy="108" rx="7" ry="3.6"/><ellipse cx="70" cy="108" rx="7" ry="3.6"/></g><path d="M45 109v1.6M48.6 110v1.6M52.2 110v1.6M67.8 110v1.6M71.4 110v1.6M75 109v1.6" stroke="#6A6268" stroke-width="1.1" stroke-linecap="round"/>`,
          body: `${RG("baobab-zaza-b", [[0, "#C8C2C4"], [0.6, "#A8A2A6"], [1, "#8A8488"]], 0.45, 0.35, 0.75)}
            <path d="M40 90C40 77 48 68 60 68C72 68 80 77 80 90C80 102 72 108 60 108C48 108 40 102 40 90Z" fill="url(#baobab-zaza-b)" ${O}/>
            <path d="M50 88C50 80 54 75 60 75C66 75 70 80 70 88C70 98 66 104 60 104C54 104 50 98 50 88Z" fill="#F4F0EA"/>`,
          armL: {svg: `<path d="M48 78C42 82 40 92 43 100C45 102 49 102 50 100C50 92 51 86 53 81Z" fill="#A8A2A6" ${O2}/><ellipse cx="46.6" cy="100" rx="4" ry="3" fill="#3A3438" ${OW(1.6)}/>`, pivot: [50, 79]},
          armR: {svg: `<path d="M72 78C78 82 80 92 77 100C75 102 71 102 70 100C70 92 69 86 67 81Z" fill="#A8A2A6" ${O2}/><ellipse cx="73.4" cy="100" rx="4" ry="3" fill="#3A3438" ${OW(1.6)}/>`, pivot: [70, 79]},
          earL: {svg: `<path d="M43 42L33 27C40 26 47 30 50 36Z" fill="#9A9498" ${O2}/><path d="M42 38L37 30.6C40.6 31 43.4 33 45 36Z" fill="#F4F0EA"/>`, pivot: [45, 39]},
          earR: {svg: `<path d="M77 42L87 27C80 26 73 30 70 36Z" fill="#9A9498" ${O2}/><path d="M78 38L83 30.6C79.4 31 76.6 33 75 36Z" fill="#F4F0EA"/>`, pivot: [75, 39]},
          head: `${RG("baobab-zaza-h", [[0, "#C8C2C4"], [0.6, "#A8A2A6"], [1, "#848086"]], 0.45, 0.3, 0.8)}
            <path d="M37 52C37 39 47 32 60 32C73 32 83 39 83 52C83 64 73 72 60 72C47 72 37 64 37 52Z" fill="url(#baobab-zaza-h)" ${O}/>
            <path d="M60 32.4C56 36 55 40 56 44H64C65 40 64 36 60 32.4Z" fill="#6A6468"/>
            ${shine(45, 42, 4, 2, -30)}`,
          face: `<path d="M44 54C44 45 51 41 60 41C69 41 76 45 76 54C76 62 69 70 60 71C51 70 44 62 44 54Z" fill="#F4F0EA" ${OW(1.6)}/>
            <path d="M44.6 49C47 45 53 45 56 49C57 54 55 58 51 58.6C47 58.6 44 55 44.6 49Z" fill="#3A3438"/><path d="M75.4 49C73 45 67 45 64 49C63 54 65 58 69 58.6C73 58.6 76 55 75.4 49Z" fill="#3A3438"/>
            <path d="M56.6 61.6C56.6 59.6 63.4 59.6 63.4 61.6C63.4 63.6 61.4 64.6 60 64.6C58.6 64.6 56.6 63.6 56.6 61.6Z" fill="#2B2233"/>`
        },
        eyes: {lx: 51, rx: 69, y: 52, r: 4.6, style: "round", color: "#E8902A"},
        mouth: {x: 60, y: 67, w: 2, color: "#2B2233"},
        cheeks: {lx: 47, rx: 73, y: 63, w: 2.6, h: 1.6, color: "#FF9AAA"},
        anchors: {top: [60, 32, 0.85], neck: [60, 72, 0.8], chest: [68, 88, 0.55], back: [80, 80, 0.7], hands: [60, 98, 0.8]},
        lines: {
          tap: ["Hi hi! Want to see my tail? It's very stripy.", "Tail up means I'm happy. It's always up!", "Lemur tip: face the sun and stretch your arms.", "You're doing amazing, friend!", "I count my tail rings when I'm thinking. Thirteen!", "Leap from task to task, like branch to branch!", "Sunset sunbathing and studying. Best combo."],
          pet: ["Eee! That tickles! Hehe.", "Ooh, so soft. Like a warm baobab branch."],
          hello: ["You're back! I leaped all the way here!", "Hello! The whole troop says hi!"],
          morning: ["Good morning! Sun salute time! Arms up!"],
          night: ["The Milky Way is out. Curl up soon, okay?"],
          focus: ["Sitting very still. Lemur focus mode.", "Tail up, eyes on the work. Go!"],
          done: ["What a session! Tail held extra high!", "Done! Let's do a happy leap!"],
          task: ["Boing! Another one done!", "Checked off! Tail up!", "Yes! Leap complete!", "Done! Stripy hooray!"],
          break: ["Break time! Stretch out in the warm light."]
        }
      },
      {
        id: "baobab-loko", name: "Loko", kind: "Panther Chameleon", pose: "stand", wearColor: "#E0703A",
        bio: "A baby panther chameleon. Changes color with every mood, mostly happy ones.",
        idle: ["headTilt", "tailSwish", "sparkle"], cheer: "bounce",
        neck: [58, 78],
        parts: {
          tail: {svg: `<path d="M82 90C96 92 102 82 99 74C96 67 87 68 87 75C87 79 91 80 92 77" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M82 90C96 92 102 82 99 74C96 67 87 68 87 75C87 79 91 80 92 77" fill="none" stroke="#3EAA8A" stroke-width="6" stroke-linecap="round"/><path d="M90 90.4l1.6-3.4M96.6 86l-2.4-2.4M99.6 78.6l-3.2.4" stroke="#F28A6A" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [82, 90]},
          feet: `${["M42 98L38 109", "M54 101L54 110", "M68 101L68 110", "M80 96L84 108"].map(d => `<path d="${d}" stroke="${INK}" stroke-width="8.4" stroke-linecap="round"/><path d="${d}" stroke="#3EAA8A" stroke-width="4.8" stroke-linecap="round"/>`).join("")}
            <g fill="#F2A07A" ${OW(1.6)}><ellipse cx="38" cy="110" rx="4.2" ry="2.4"/><ellipse cx="54" cy="110.6" rx="4.2" ry="2.4"/><ellipse cx="68" cy="110.6" rx="4.2" ry="2.4"/><ellipse cx="84.6" cy="109.4" rx="4.2" ry="2.4"/></g>`,
          body: `${LG("baobab-loko-b", [[0, "#6AD2AE"], [0.6, "#3EAA8A"], [1, "#2A8670"]])}
            <path d="M34 90C34 77 46 70 62 70C78 70 88 78 88 90C88 100 78 104 61 104C44 104 34 100 34 90Z" fill="url(#baobab-loko-b)" ${O}/>
            <path d="M38 92C48 96 74 96 85 91" fill="none" stroke="#F6E6A0" stroke-width="3" stroke-linecap="round"/>
            <path d="M50 74C52 80 52 86 50 92M62 72C64 79 64 86 62 94M74 74C76 80 76 86 74 92" fill="none" stroke="#F28A6A" stroke-width="3.6" stroke-linecap="round" opacity=".85"/>
            <path d="M44 72l2-3 2 3 2-3.4 2 3.4 2-3.6 2 3.6 2-3.6 2 3.6 2-3.6 2 3.6 2-3.4 2 3.4 2-3 2 3" fill="#2A8670" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
            ${shine(70, 78, 5, 2, -10)}`,
          head: `${LG("baobab-loko-h", [[0, "#7ADCB8"], [0.6, "#48B898"], [1, "#2E9278"]])}
            <path d="M44 46C50 34 64 32 72 40C74 44 74 48 72 52L56 50Z" fill="#3EAA8A" ${O}/>
            <path d="M30 68C27 56 36 46 50 44C64 42 76 48 77 60C78 72 68 80 52 80C40 80 32 76 30 68Z" fill="url(#baobab-loko-h)" ${O}/>
            <path d="M33 70C42 74 58 74 72 68" fill="none" stroke="#F6E6A0" stroke-width="2.6" stroke-linecap="round"/>
            <g fill="#F28A6A"><circle cx="58" cy="41" r="1.6"/><circle cx="63.4" cy="39.4" r="1.6"/><circle cx="68" cy="41.4" r="1.4"/></g>
            ${shine(38, 54, 3.4, 1.8, -30)}`,
          face: `<circle cx="44" cy="58" r="8.6" fill="#48B898" ${O2}/><circle cx="64" cy="58" r="8.6" fill="#48B898" ${O2}/>
            <circle cx="44" cy="58" r="6.2" fill="none" stroke="#7ADCB8" stroke-width="1.6"/><circle cx="64" cy="58" r="6.2" fill="none" stroke="#7ADCB8" stroke-width="1.6"/>`
        },
        eyes: {lx: 44, rx: 64, y: 58, r: 3.8, style: "sparkle", color: "#1E2A24"},
        mouth: {x: 54, y: 70.4, w: 3, color: "#1E2A24"},
        cheeks: {lx: 37, rx: 71, y: 67, w: 2.8, h: 1.8, color: "#FF9A8A"},
        anchors: {top: [58, 38, 0.8], neck: [56, 80, 0.75], chest: [70, 90, 0.55], back: [78, 74, 0.7], hands: [60, 96, 0.8]},
        lines: {
          tap: ["Hi! I can look at you and your notes at once.", "Today I'm turquoise. That means happy!", "Slow steps, sure grip. That's the trick.", "I blushed orange. You're doing so well!", "One eye on the goal, one eye on the snacks.", "Curl your tail, uncurl your worries.", "Watch me change color when you finish!"],
          pet: ["Hehe, I just turned a little pink!", "Ooh, warm hands. I'm going sunset orange."],
          hello: ["You're here! I turned my brightest blue!", "Hello! I spotted you with both eyes."],
          morning: ["Good morning! Let's warm up on a sunny branch."],
          night: ["I'm turning sleepy green. Rest soon, okay?"],
          focus: ["Holding very still. Super focus colors on.", "Steady grip. Keep going, you've got it."],
          done: ["What a session! I'm every color at once!", "Done! That made me glow orange."],
          task: ["Zip! Another one done!", "Checked off! New color unlocked!", "Yes! Nailed it, both eyes saw!", "Done! Bright work!"],
          break: ["Break time! Look far away, then near. Eye stretch!"]
        }
      }
    ]
  });
})();
