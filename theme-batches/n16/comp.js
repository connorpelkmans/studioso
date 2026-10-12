/* Study Companions, new theme ideas batch n16: saguaro. The theme has one nature-object character and two young animals. */
(() => {
  const {INK, O, OW, LG, RG, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const f1 = v => Math.round(v * 10) / 10;
  const twinkle = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${c || "#fff"}"/>`;
  const shine = (x, y, rx, ry, a) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})" fill="#fff" opacity=".7"/>`;
  const ring = (cx, cy, n, R, fn, rot = 0) => Array.from({length: n}, (_, i) => { const a = -Math.PI / 2 + rot + i * 2 * Math.PI / n; return fn(f1(cx + R * Math.cos(a)), f1(cy + R * Math.sin(a)), a, i); }).join("");
  // a white saguaro blossom with a golden heart
  const sagFlower = (x, y, r) => `${ring(x, y, 6, r * 0.62, (px, py) => `<circle cx="${px}" cy="${py}" r="${f1(r * 0.5)}" fill="#FFFBF2" ${OW(1.3)}/>`)}<circle cx="${x}" cy="${y}" r="${f1(r * 0.42)}" fill="#F6C83A" ${OW(1.3)}/>`;

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
})();
