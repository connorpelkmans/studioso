/* ===== module: 98-comp-b6.js ===== */
/* Study Companions, batch 6 */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const f1 = v => Math.round(v * 10) / 10;
  // Points of a five-pointed star (outer radius R, inner radius r), top point up
  const starPts = (cx, cy, R, r) => Array.from({length: 10}, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r : R; return f1(cx + d * Math.cos(a)) + "," + f1(cy + d * Math.sin(a)); }).join(" ");
  // A heart leaf with its tip at 0,0 and its lobes pointing up (for shamrock leaves)
  const LEAF = "M0 0C-9 -6 -15 -14 -14.5 -22C-14 -29 -8 -32 -3.5 -30C-1.6 -29 -.4 -27.5 0 -26C.4 -27.5 1.6 -29 3.5 -30C8 -32 14 -29 14.5 -22C15 -14 9 -6 0 0Z";

  COMP_DATA.push({
    theme: "stpatricks",
    companions: [
      {
        id: "stpatricks-shamrock", name: "Clover", kind: "Shamrock Sprite", pose: "float",
        bio: "A lucky little shamrock who floats along on three soft leaves.",
        idle: ["wingFlutter", "sparkle", "spin"], cheer: "spin",
        parts: {
          tail: {svg: `${LINE("M60 99C60 104 63 107 68 106.5", "#3E9E5E", 3)}`, pivot: [60, 99]},
          wingL: {svg: `${LG("stpatricks-shamrock-w", [[0, "#9BE8AE"], [0.55, "#4CC07A"], [1, "#2A9453"]])}<g transform="translate(53 84) rotate(-104) scale(1.12)"><path d="${LEAF}" fill="url(#stpatricks-shamrock-w)" ${O}/><path d="M0 -6V-21" stroke="#D4F5DC" stroke-width="1.8" stroke-linecap="round" opacity=".9"/></g>`, pivot: [52, 82]},
          wingR: {svg: `<g transform="translate(67 84) rotate(104) scale(1.12)"><path d="${LEAF}" fill="url(#stpatricks-shamrock-w)" ${O}/><path d="M0 -6V-21" stroke="#D4F5DC" stroke-width="1.8" stroke-linecap="round" opacity=".9"/></g>`, pivot: [68, 82]},
          body: `${RG("stpatricks-shamrock-g", [[0, "#C6F4D0"], [0.5, "#6ED48C"], [1, "#2E9E5B"]], 0.45, 0.38, 0.72)}
            <path d="M58 100.3C50 95 32.5 84 31 66C29.5 52 38 42 48 42C54 42 58 45 60 49C62 45 66 42 72 42C82 42 90.5 52 89 66C87.5 84 70 95 62 100.3Q60 101.6 58 100.3Z" fill="url(#stpatricks-shamrock-g)" ${O}/>
            <path d="M37.5 62Q38 51 46 47" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".9"/>
            <path d="M50 91Q60 96.5 70 91" fill="none" stroke="#2A9453" stroke-width="2.2" stroke-linecap="round" opacity=".5"/>`
        },
        eyes: {lx: 50, rx: 70, y: 66, r: 5, style: "dot", color: "#1C3324"},
        mouth: {x: 60, y: 75, w: 3.2, color: "#1C3324"},
        cheeks: {lx: 42, rx: 78, y: 74, w: 4.6, h: 2.8, color: "#FF9FB0"},
        anchors: {top: [60, 46, 0.9], neck: [60, 86, 0.95], chest: [70, 88, 0.66], back: [84, 60, 0.8], hands: [60, 88, 0.85]},
        lines: {
          tap: ["Hi! So happy to see you!", "Lucky me, you're here!", "You make your own luck!", "Cheering you on, leaf by leaf!", "Green light! Keep going!", "A little extra luck for you!", "Look at you, showing up again!"],
          pet: ["Hehe! Lucky tickles!", "My leaves are all a-flutter!"],
          hello: ["Hello! Luck's in the air now!", "Hi! I saved you a clover!"],
          morning: ["Good morning! Fresh dew, fresh start!", "Morning, lucky one! Let's go!"],
          night: ["My leaves are folding. Rest soon?", "Sleep brings luck. Bedtime, friend?"],
          focus: ["Quiet luck mode! You've got this!", "I'll float right here! Heads down."],
          done: ["Lucky session! You were wonderful!", "Session done! I'm so proud of you!"],
          task: ["Yes! DONE!", "Luck had nothing on you! Woohoo!", "Another one, well picked! Hooray!", "Checked off! Four-leaf fantastic!"],
          break: ["Stretch out in the sun a bit!", "Water break! Great idea!"]
        }
      },
      {
        id: "stpatricks-pot", name: "Penny", kind: "Pot of Gold", pose: "sit", sleepy: true, wearColor: "#3FB568",
        bio: "A cheerful pot of gold found at the end of every study rainbow.",
        idle: ["topBob", "earTwitch", "bounce"], cheer: "hop",
        parts: {
          earL: {svg: `${LINE("M31 67C21 65 19.5 77 27.5 80", "#5A617C", 3.4)}`, pivot: [30, 70]},
          earR: {svg: `${LINE("M89 67C99 65 100.5 77 92.5 80", "#5A617C", 3.4)}`, pivot: [90, 70]},
          feet: `<ellipse cx="42" cy="107.5" rx="6.4" ry="4.4" fill="#343A4E" ${O}/><ellipse cx="78" cy="107.5" rx="6.4" ry="4.4" fill="#343A4E" ${O}/>`,
          body: `${LG("stpatricks-pot-au", [[0, "#FFF0A6"], [0.5, "#FFD34D"], [1, "#E8A21A"]])}${LG("stpatricks-pot-g", [[0, "#727A98"], [1, "#3A3F55"]], 0.2, 0, 0.8, 1)}${LG("stpatricks-pot-l", [[0, "#8A92B0"], [1, "#565C77"]])}
            <path d="M31 58C31 47 39 40 47 41C51 34 58 31 64 34C71 32 78 36 80 42C87 44 90 51 89 58Z" fill="url(#stpatricks-pot-au)" ${O}/>
            <ellipse cx="46" cy="48" rx="5.6" ry="3" fill="#FFE27A" ${OW(2)}/><ellipse cx="74" cy="48.5" rx="5.6" ry="3" fill="#FFE27A" ${OW(2)}/><ellipse cx="59" cy="41" rx="5.6" ry="3" fill="#FFE27A" ${OW(2)}/>
            <path d="M30 62C21 72 20 94 33 103C41 108.5 50 109.5 60 109.5C70 109.5 79 108.5 87 103C100 94 99 72 90 62Z" fill="url(#stpatricks-pot-g)" ${O}/>
            <rect x="26" y="54" width="68" height="11" rx="5.5" fill="url(#stpatricks-pot-l)" ${O}/>
            <path d="M32 58H52" stroke="#B4BBD4" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M32.5 84Q32 74 37 69" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".45"/>
            <path d="M42 103Q60 107.5 78 103" fill="none" stroke="#262A38" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>`,
          top: {svg: `<ellipse cx="62" cy="28" rx="6.8" ry="7.6" transform="rotate(14 62 28)" fill="#FFD34D" ${O2}/><ellipse cx="62" cy="28" rx="3.6" ry="4.4" transform="rotate(14 62 28)" fill="none" stroke="#E8A21A" stroke-width="1.8"/><path d="M71 20l1 -3.4l1 3.4l3.4 1l-3.4 1l-1 3.4l-1 -3.4l-3.4 -1Z" fill="#FFF6C8" ${OW(1.4)}/>`, pivot: [60, 36]}
        },
        eyes: {lx: 48, rx: 72, y: 80, r: 5.4, style: "round"},
        mouth: {x: 60, y: 90, w: 3.2, color: "#FFF1DC"},
        cheeks: {lx: 39.5, rx: 80.5, y: 89, w: 4.6, h: 2.8, color: "#FF8FAE"},
        anchors: {top: [60, 37, 0.95], neck: [60, 67, 1.35], chest: [75, 97, 0.72], back: [91, 76, 0.9], hands: [60, 99, 0.9]},
        lines: {
          tap: ["You found me! Lucky, lucky you!", "Your effort is worth its weight in gold!", "Every bit of study is treasure!", "Clink clink! Hello!", "You're a golden learner!", "So happy to see you!", "Small coins add up! So do your notes!"],
          pet: ["Hehe! My coins are jingling!", "Pure gold feelings!"],
          hello: ["Hi! The rainbow brought you back!", "Hello! I polished up just for you!"],
          morning: ["Good morning! A shiny day ahead!", "Morning, treasure! Let's shine!"],
          night: ["My lid is closing... bedtime soon?", "Rest up. Gold keeps till morning."],
          focus: ["Quiet as buried treasure! You've got this!", "Heads down! I'll guard the gold."],
          done: ["A golden session! Amazing!", "Done! That's pure gold!"],
          task: ["Clink! DONE!", "Another coin in the pot! Woohoo!", "Solid gold work! Yes!", "Treasure found! Checked off!"],
          break: ["Break time! Let's stretch!", "Snack and sip, then shine again!"]
        }
      },
      {
        id: "stpatricks-foal", name: "Rory", kind: "Rainbow Foal", pose: "stand",
        bio: "A little foal with a pastel rainbow mane who gallops after good luck.",
        idle: ["earTwitch", "tailSwish", "headTilt"], cheer: "hop",
        neck: [60, 72],
        parts: {
          back: `<path d="M63 31C78 28 89.5 39 88 54C87.5 61 89 67 92.5 71.5C82 72.5 76.5 64 77 55Z" fill="#FFB8C8" ${O2}/><path d="M77 55C77.5 62 80.5 68 86 71C80 75.5 73 70 72 63Z" fill="#FFE08A" ${O2}/><path d="M85 44C88.5 49 88 55 87.5 60" fill="none" stroke="#FFD3DE" stroke-width="2" stroke-linecap="round"/>`,
          tail: {svg: `<path d="M79 87C91 83 100.5 91 98.5 103C94.5 97 88.5 95 80 96Z" fill="#FFB8C8" ${O2}/><path d="M80 94C88.5 93.5 94 99 93.5 107C89.5 102.5 85 100.5 80 100.5Z" fill="#AEE6C0" ${O2}/>`, pivot: [79, 92]},
          earL: {svg: `<path d="M45.5 40L41.5 21L56 33.5Z" fill="#FBF3EA" ${O}/><path d="M46 35L44 25.5L51.5 32.5Z" fill="#FFC1D2"/>`, pivot: [48, 37]},
          earR: {svg: `<path d="M74.5 40L78.5 21L64 33.5Z" fill="#FBF3EA" ${O}/><path d="M74 35L76 25.5L68.5 32.5Z" fill="#FFC1D2"/>`, pivot: [72, 37]},
          feet: `<rect x="44.5" y="90" width="11" height="20" rx="5.5" fill="#F8EFE6" ${O}/><rect x="64.5" y="90" width="11" height="20" rx="5.5" fill="#F8EFE6" ${O}/>
            <path d="M44.5 103.5H55.5V104.5Q55.5 110 50 110Q44.5 110 44.5 104.5Z" fill="#C7B3F2" ${O2}/><path d="M64.5 103.5H75.5V104.5Q75.5 110 70 110Q64.5 110 64.5 104.5Z" fill="#C7B3F2" ${O2}/>`,
          body: `${LG("stpatricks-foal-b", [[0, "#FFFFFF"], [1, "#EADCCD"]])}
            <path d="M60 70C75 70 81 81 81 91C81 99 75 102 60 102C45 102 39 99 39 91C39 81 45 70 60 70Z" fill="url(#stpatricks-foal-b)" ${O}/>
            <path d="M43.5 88Q44 80 49 76" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/>`,
          head: `${LG("stpatricks-foal-h", [[0, "#FFFFFF"], [0.7, "#FBF4EC"], [1, "#EEDFCF"]])}
            <ellipse cx="60" cy="54.5" rx="22.5" ry="21" fill="url(#stpatricks-foal-h)" ${O}/>
            <path d="M40.5 53Q41 45 46 40.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
          face: `<ellipse cx="60" cy="66.5" rx="13" ry="8.6" fill="#F4DFCB"/><ellipse cx="54.6" cy="64.2" rx="1.2" ry="1.7" transform="rotate(-18 54.6 64.2)" fill="#B98A72"/><ellipse cx="65.4" cy="64.2" rx="1.2" ry="1.7" transform="rotate(18 65.4 64.2)" fill="#B98A72"/>`,
          top: {svg: `<path d="M48 39C45 30 51 24 58.5 25.5C55 28.5 54 32.5 55.5 38.5Z" fill="#FFB8C8" ${O2}/><path d="M54.5 37C54 28 62 23 68.5 27C63.5 28.5 61.5 32 62 37.5Z" fill="#FFE08A" ${O2}/><path d="M61 37.5C62 30.5 69 27.5 74 31C70 32.5 68 35.5 68.5 40Z" fill="#AEE6C0" ${O2}/><path d="M66.5 40C68.5 35 73 33.5 76.5 36C74 37.5 72.5 39.5 72.5 42Z" fill="#AFCFFF" ${O2}/>`, pivot: [60, 37]}
        },
        eyes: {lx: 49.5, rx: 70.5, y: 51.5, r: 4.6, style: "dot", color: "#2B2233"},
        mouth: {x: 60, y: 69.2, w: 2.6},
        cheeks: {lx: 42, rx: 78, y: 60, w: 4.2, h: 2.6, color: "#FF9FB7"},
        anchors: {top: [60, 35, 0.95], neck: [60, 74, 1.0], chest: [70, 89, 0.66], back: [82, 84, 0.85], hands: [60, 92, 0.88]},
        lines: {
          tap: ["Neigh! Hi friend! So glad you're here!", "Chasing rainbows with you!", "You're galloping along beautifully!", "Look at you, showing up again!", "Lucky me, I found you!", "Trot, trot! You're doing great!", "Every step is a lucky one!"],
          pet: ["Hehe! My mane is all fluffy!", "Hehe! Rainbow cuddles!"],
          hello: ["Hi! Welcome back! Hooray!", "Hi! I galloped right over!"],
          morning: ["Good morning! Green hills await!", "Morning, lucky one! Let's gallop!"],
          night: ["Sleepy hooves now... rest soon?", "Stars over the hills. Bedtime?"],
          focus: ["Steady trot! You've got this!", "Quiet hooves! Heads down, let's go."],
          done: ["What a gallop! Amazing!", "Session done! You were fantastic!"],
          task: ["Neigh! DONE!", "Over that hurdle! Woohoo!", "Galloped right through! Yes!", "Lucky and checked off! Hooray!"],
          break: ["Stretch those legs! Big stretch!", "Water and a snack break! Yum!"]
        }
      }
    ]
  });

  /* Easter */
  COMP_DATA.push({
    theme: "easter",
    companions: [
      {
        id: "easter-chick", name: "Chickpea", kind: "Hatchling Chick", pose: "sit",
        bio: "A fluffy chick just peeking out of its painted egg to say hi.",
        idle: ["topBob", "wingFlutter", "bounce"], cheer: "wingFlutter",
        parts: {
          body: `${LG("easter-chick-g", [[0, "#FFF6B8"], [1, "#FFD24A"]])}${LG("easter-chick-s", [[0, "#F4EDFF"], [1, "#C7B3F2"]])}
            <circle cx="60" cy="60" r="27" fill="url(#easter-chick-g)" ${O}/>
            <path d="M39.5 51Q42 41 51 37" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".9"/>
            <path d="M26 76L33 70L40 77L47 70L54 77L60 71L66 77L73 70L80 77L87 70L94 76C95 96 82 110.5 60 110.5C38 110.5 25 96 26 76Z" fill="url(#easter-chick-s)" ${O}/>
            <circle cx="40" cy="91" r="2.8" fill="#FFA8C8"/><circle cx="60" cy="98" r="2.8" fill="#8FD8BE"/><circle cx="80" cy="91" r="2.8" fill="#FFD24A"/><circle cx="50" cy="102" r="2.2" fill="#8FC7F2"/><circle cx="70" cy="102" r="2.2" fill="#FFA8C8"/>
            <path d="M31.5 85Q32.5 96 40 103" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/>`,
          armL: {svg: `<path d="M38.5 69C30 67 25.5 72 27.5 78C31 80 36 78 39.5 74Z" fill="#FFD84D" ${O}/>`, pivot: [38, 72]},
          armR: {svg: `<path d="M81.5 69C90 67 94.5 72 92.5 78C89 80 84 78 80.5 74Z" fill="#FFD84D" ${O}/>`, pivot: [82, 72]},
          top: {svg: `<path d="M59.5 34.5C54 29.5 54.5 22.5 59 21C61.5 25.5 62 30 61 34.5Z" fill="#FFE070" ${O2}/><path d="M61 34.5C62.5 28 67 24.5 71.5 26C70 30.5 66 33.5 61.5 35Z" fill="#FFE070" ${O2}/>`, pivot: [60, 34]}
        },
        eyes: {lx: 49.5, rx: 70.5, y: 56, r: 4.8, style: "dot"},
        mouths: {
          neutral: `<path d="M56.4 63Q60 61.6 63.6 63L60 67.4Z" fill="#F7A23A" ${OW(1.8)}/>`,
          smile: `<path d="M56 62.8Q60 61.2 64 62.8L60 67.6Z" fill="#F9AE45" ${OW(1.8)}/><path d="M53.5 65.8q1.6 1.2 3.2 .3M66.5 65.8q-1.6 1.2 -3.2 .3" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`,
          open: `<path d="M56.8 64.6L63.2 64.6L60 68.6Z" fill="#FF8FA8" ${OW(1.4)}/><path d="M56.2 62.2Q60 61 63.8 62.2L60 65Z" fill="#F7A23A" ${OW(1.6)}/><path d="M57.2 66.6L62.8 66.6L60 70.4Z" fill="#F7A23A" ${OW(1.6)}/>`,
          sleepy: `<path d="M56.8 63.4Q60 62.4 63.2 63.4L60 67Z" fill="#E8962E" ${OW(1.8)}/>`
        },
        mouth: {x: 60, y: 64.5, w: 3},
        cheeks: {lx: 42, rx: 78, y: 63.5, w: 4.4, h: 2.7, color: "#FF9FB0"},
        anchors: {top: [60, 35, 0.95], neck: [60, 78, 1.15], chest: [73, 94, 0.72], back: [89, 60, 0.85], hands: [60, 84, 0.9]},
        lines: {
          tap: ["Peek-a-boo! Yay, it's you!", "Cheep! You're doing amazing!", "I just hatched a great idea: you rock!", "One happy peep at a time! Let's go!", "You make my little heart flutter with pride!", "I popped out of my shell just for you!", "So, so proud of you today!"],
          pet: ["Cheep cheep! That tickles my fluff!", "Hehe! My feathers are all fluffed up now!"],
          hello: ["Cheep! You're back! Best day ever!", "Hi hi! I kept my shell warm for you!"],
          morning: ["Good morning! Fresh as a brand new egg!", "Rise and shine! Cheep cheep, let's go!"],
          night: ["Sleepy cheep... time to tuck in?", "I'm snuggling into my shell. Rest well!"],
          focus: ["Tiny quiet peeps! We've got this!", "Cozy in my shell, cheering you on!"],
          done: ["Cheep cheep! What a fantastic session!", "You did it! I'm hopping with joy!"],
          task: ["Cracked it! WOO!", "Cheep! Done and dusted! Yay!", "Yes yes yes! Another one hatched!", "Look at that! Checked off!"],
          break: ["Flap those wings and stretch! Wheee!", "Snack break time! Grab something yummy!"]
        }
      },
      {
        id: "easter-carrot", name: "Crunch", kind: "Garden Carrot", pose: "stand", sleepy: true,
        bio: "A sleepy garden carrot who is always rooting for you.",
        idle: ["topBob", "sway", "wave"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="50" cy="108.5" rx="6.4" ry="4" fill="#E0701C" ${O}/><ellipse cx="70" cy="108.5" rx="6.4" ry="4" fill="#E0701C" ${O}/>`,
          body: `${LG("easter-carrot-g", [[0, "#FFC274"], [0.55, "#FF9A3C"], [1, "#EE7420"]])}
            <path d="M60 38C78 38 86.5 48 85.5 60C84.5 76 72 95 63.5 104Q60 107.5 56.5 104C48 95 35.5 76 34.5 60C33.5 48 42 38 60 38Z" fill="url(#easter-carrot-g)" ${O}/>
            <path d="M44 81Q48 82.5 51.5 80.5M76 79Q72 80.5 68.5 78.5M55 94Q58 95.2 61 93.8" fill="none" stroke="#D8661A" stroke-width="2" stroke-linecap="round"/>
            <path d="M40 58Q40.5 48 48 43.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".8"/>`,
          armL: {svg: `<ellipse cx="34" cy="75" rx="4.4" ry="6.4" transform="rotate(30 34 75)" fill="#F99A40" ${O}/>`, pivot: [40, 73]},
          armR: {svg: `<ellipse cx="86" cy="75" rx="4.4" ry="6.4" transform="rotate(-30 86 75)" fill="#F99A40" ${O}/>`, pivot: [80, 73]},
          top: {svg: `${LG("easter-carrot-l", [[0, "#A6E08E"], [1, "#5DAA62"]])}<path d="M57.5 40C49 37 43 30 42.5 22C50 22.5 56.5 29.5 59 38.5Z" fill="url(#easter-carrot-l)" ${O2}/><path d="M62.5 40C71 37 77 30 77.5 22C70 22.5 63.5 29.5 61 38.5Z" fill="url(#easter-carrot-l)" ${O2}/><path d="M60 40C54.5 32 54.5 22 60 15C65.5 22 65.5 32 60 40Z" fill="url(#easter-carrot-l)" ${O2}/><path d="M60 35V24" stroke="#D2F2C4" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [60, 40]}
        },
        eyes: {lx: 50, rx: 70, y: 59, r: 4.8, style: "dot", color: "#3A2210"},
        mouth: {x: 60, y: 67.5, w: 3, color: "#3A2210"},
        cheeks: {lx: 42.5, rx: 77.5, y: 66.5, w: 4.2, h: 2.6, color: "#FF7F8F"},
        anchors: {top: [60, 40, 0.95], neck: [60, 75, 1.0], chest: [70, 84, 0.62], back: [84, 62, 0.85], hands: [60, 82, 0.85]},
        lines: {
          tap: ["Hi! I'm rooting for you, always!", "You're doing so great today!", "Look at you, growing so strong!", "Crunchy hello! So happy you're here!", "Little roots, big growth! Go you!", "You're the top of my whole garden!", "Freshly picked cheers, just for you!"],
          pet: ["Hehe! My leafy top is so happy!", "Aww! Now I'm blushing extra orange!"],
          hello: ["Hi! I popped right up to say hello!", "You're back! The whole garden is cheering!"],
          morning: ["Good morning! Fresh soil, fresh start!", "Morning, sprout! Let's grow today!"],
          night: ["Time to snuggle into the soil. Sleep well!", "Even carrots need rest. Cozy night!"],
          focus: ["Quiet roots, big growth. You've got this!", "Heads down! I'm cheering from the garden!"],
          done: ["Harvest time! What an amazing session!", "Session done! You grew so much today!"],
          task: ["Crunch! Done! WOO!", "Yes! Pulled that one right up!", "Another one harvested! Amazing!", "Checked off! The garden is cheering!"],
          break: ["Stretch up toward the sun! Ahh, nice!", "Water break! Every garden needs one!"]
        }
      },
      {
        id: "easter-egg", name: "Speckle", kind: "Painted Egg Sprite", pose: "float",
        bio: "A painted egg with tiny wings who loves a good hunt for answers.",
        idle: ["wingFlutter", "sparkle", "topBob"], cheer: "spin",
        parts: {
          wingL: {svg: `<path d="M34 67C25 58 15 59 13.5 65.5C13 72 22 76.5 32.5 74Z" fill="#FFFFFF" ${OW(2.4)}/><path d="M31 70Q23 68 17.5 65" fill="none" stroke="#D4C2F7" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [34, 70]},
          wingR: {svg: `<path d="M86 67C95 58 105 59 106.5 65.5C107 72 98 76.5 87.5 74Z" fill="#FFFFFF" ${OW(2.4)}/><path d="M89 70Q97 68 102.5 65" fill="none" stroke="#D4C2F7" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [86, 70]},
          body: `${LG("easter-egg-g", [[0, "#FFB9D4"], [0.27, "#FFC9DE"], [0.27, "#CFF3E4"], [0.72, "#A9E4CD"], [0.72, "#D2C0F6"], [1, "#B39BEA"]])}
            <path d="M60 34C78 34 90 60 90 78C90 95 77 104 60 104C43 104 30 95 30 78C30 60 42 34 60 34Z" fill="url(#easter-egg-g)" ${O}/>
            <path d="M34.5 86L40.5 82L46.5 86L52.5 82L58.5 86L64.5 82L70.5 86L76.5 82L82.5 86L86 83.8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="52" cy="44" r="2.2" fill="#fff"/><circle cx="63" cy="40.5" r="2.2" fill="#fff"/><circle cx="70" cy="47.5" r="2.2" fill="#fff"/>
            <circle cx="48" cy="95" r="2.2" fill="#FFF3B8"/><circle cx="60" cy="98" r="2.2" fill="#FFF3B8"/><circle cx="72" cy="95" r="2.2" fill="#FFF3B8"/>
            <path d="M39 70Q39.5 58 46 49" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".8"/>`,
          top: {svg: `${LINE("M60 35V27", "#5DAA62", 2.4)}<path d="M54 20L57 24L60 19L63 24L66 20C67 27 64 30.5 60 30.5C56 30.5 53 27 54 20Z" fill="#F28BB8" ${O2}/>`, pivot: [60, 35]}
        },
        eyes: {lx: 51, rx: 69, y: 67, r: 4.8, style: "sparkle", color: "#2E2650"},
        mouth: {x: 60, y: 75.5, w: 3, color: "#2E2650"},
        cheeks: {lx: 43.5, rx: 76.5, y: 74, w: 4.4, h: 2.7, color: "#FF9FB7"},
        anchors: {top: [60, 36, 0.8], neck: [60, 89, 1.1], chest: [71, 92, 0.66], back: [86, 66, 0.8], hands: [60, 90, 0.85]},
        lines: {
          tap: ["You found me! Great hunting!", "Every answer is a hidden egg! Go find it!", "Wow, you're so clever today!", "I'm painted with pride for you!", "Keep hunting! You're so close!", "So many bright ideas today! Yay!", "What a sunny, sparkly mind you have!"],
          pet: ["Wheee! I'm all a-wobble now!", "Hehe! Careful, you'll crack me up!"],
          hello: ["Hi! Ready for a fun hunt today?", "You're back! I hid a big smile for you!"],
          morning: ["Good morning! The meadow is sparkling!", "Morning, egg hunter! Let's find answers!"],
          night: ["Eggs rest in baskets. Bedtime soon?", "Sleep is the best prize tonight. Rest well!"],
          focus: ["Hunting quietly right beside you!", "Shh, we're close! Let's find it together!"],
          done: ["What a hunt! Your basket is overflowing!", "Session done! You found so many answers!"],
          task: ["Found it! WOO!", "Yes! Another golden egg in the basket!", "Checked off! You're the best hunter!", "Hooray! That one's done!"],
          break: ["Wobble and stretch! Wheee!", "Hop outside for fresh air! So fun!"]
        }
      }
    ]
  });

  /* Fourth of July */
  COMP_DATA.push({
    theme: "july4",
    companions: [
      {
        id: "july4-rocket", name: "Sparky", kind: "Firework Rocket", pose: "stand", wearColor: "#F2B23E",
        bio: "A little firework rocket who can't wait to cheer for you.",
        idle: ["topBob", "bounce", "wave"], cheer: "spin",
        parts: {
          feet: `${LG("july4-rocket-f", [[0, "#FF8A78"], [1, "#D63A3A"]])}<path d="M44 82C35 85.5 30.5 97 31 110Q38.5 108.5 44 103Z" fill="url(#july4-rocket-f)" ${O}/><path d="M76 82C85 85.5 89.5 97 89 110Q81.5 108.5 76 103Z" fill="url(#july4-rocket-f)" ${O}/><path d="M53 104H67L65 110H55Z" fill="#6A7190" ${O2}/>`,
          body: `${LG("july4-rocket-w", [[0, "#FFFFFF"], [1, "#DEE4F2"]], 0, 0, 1, 0)}${LG("july4-rocket-n", [[0, "#8FB0FA"], [1, "#3D6AD6"]])}
            <path d="M41 50V99Q41 106 48 106H72Q79 106 79 99V50Z" fill="url(#july4-rocket-w)" ${O}/>
            <path d="M42.5 87H77.5V95H42.5Z" fill="#E0463C"/>
            <path d="M40 52C40 39 49.5 27.5 60 22C70.5 27.5 80 39 80 52Q60 57 40 52Z" fill="url(#july4-rocket-n)" ${O}/>
            <path d="M60 36.5l1.7 3.5l3.8.5l-2.8 2.6l.7 3.8l-3.4 -1.8l-3.4 1.8l.7 -3.8l-2.8 -2.6l3.8 -.5Z" fill="#fff" ${OW(1.4)}/>
            <path d="M46 46Q48 37 53.5 31.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".75"/>`,
          armL: {svg: `<ellipse cx="37" cy="75" rx="4.4" ry="6.4" transform="rotate(30 37 75)" fill="#5A80E2" ${O}/>`, pivot: [43, 73]},
          armR: {svg: `<ellipse cx="83" cy="75" rx="4.4" ry="6.4" transform="rotate(-30 83 75)" fill="#5A80E2" ${O}/>`, pivot: [77, 73]},
          top: {svg: `<path d="M60 8.5l2.4 6.1l6.1 2.4l-6.1 2.4l-2.4 6.1l-2.4 -6.1l-6.1 -2.4l6.1 -2.4Z" fill="#FFD86B" ${O2}/><circle cx="69.5" cy="10.5" r="1.8" fill="#FF8A78"/><circle cx="50.5" cy="11.5" r="1.8" fill="#8FB0FA"/>`, pivot: [60, 24]}
        },
        eyes: {lx: 51, rx: 69, y: 67, r: 4.6, style: "dot", color: "#141C33"},
        mouth: {x: 60, y: 75.5, w: 3, color: "#141C33"},
        cheeks: {lx: 46, rx: 74, y: 74.5, w: 3.8, h: 2.5, color: "#FF8FA3"},
        anchors: {top: [60, 30, 0.8], neck: [60, 55, 0.95], chest: [71, 91, 0.6], back: [82, 72, 0.8], hands: [60, 86, 0.85]},
        lines: {
          tap: ["Fizz! I'm so excited to see you!", "You light up the whole sky today!", "Ready, set, launch! Let's go!", "Whoosh! You're on fire today!", "I can't wait to cheer for you!", "Sparks are flying! You've got this!", "Look at you, soaring so high!"],
          pet: ["Fizzle! I'm all sparkly now!", "Hehe! That makes my fuse tingle!"],
          hello: ["You're back! Cue the fireworks!", "Hi hi! I've been fizzing to see you!"],
          morning: ["Good morning! Ready for liftoff?", "Rise and shine! Today's gonna sparkle!"],
          night: ["The sky is quiet now. Time to rest!", "Even rockets cool down. Sleep well!"],
          focus: ["Countdown on! Heads down, we've got this!", "Quiet fizz, steady glow. Go you!"],
          done: ["BOOM! What a dazzling session!", "Session done! Grand finale time!"],
          task: ["WHOOSH! Another one done!", "Yes yes yes! Checked off! Kaboom!", "Fireworks for you! Done!", "Look at it go! Task launched!"],
          break: ["Launch into a big stretch! Whoosh!", "Snack break! Fuel up for the next launch!"]
        }
      },
      {
        id: "july4-eaglet", name: "Scout", kind: "Fluffy Eaglet", pose: "sit", sleepy: true,
        bio: "A fluffy eaglet who dreams of soaring while you study.",
        idle: ["wingFlutter", "headTilt", "topBob"], cheer: "wingFlutter",
        neck: [60, 72],
        parts: {
          feet: `<ellipse cx="49" cy="108.5" rx="7.4" ry="4" fill="#F5B942" ${O}/><ellipse cx="71" cy="108.5" rx="7.4" ry="4" fill="#F5B942" ${O}/>`,
          body: `${LG("july4-eaglet-b", [[0, "#B98652"], [1, "#6E4527"]])}
            <path d="M60 62C80 62 90 78 89 93C88 105 78 110 60 110C42 110 32 105 31 93C30 78 40 62 60 62Z" fill="url(#july4-eaglet-b)" ${O}/>
            <ellipse cx="60" cy="95" rx="16" ry="12" fill="#F4E4C8"/>
            <path d="M53 91l3 2.6l3-2.6M61 91l3 2.6l3-2.6M57 99l3 2.6l3-2.6" fill="none" stroke="#D8BE94" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
          armL: {svg: `<path d="M35.5 76C27 82 23.5 93.5 26.5 100C32.5 98.5 37 90 38 80Z" fill="#8A5A30" ${O}/><path d="M31 88Q29 93 29.5 96" fill="none" stroke="#B98652" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [36.5, 78]},
          armR: {svg: `<path d="M84.5 76C93 82 96.5 93.5 93.5 100C87.5 98.5 83 90 82 80Z" fill="#8A5A30" ${O}/><path d="M89 88Q91 93 90.5 96" fill="none" stroke="#B98652" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [83.5, 78]},
          head: `${RG("july4-eaglet-h", [[0, "#FFFFFF"], [0.65, "#F8F6F2"], [1, "#DCD6CC"]], 0.42, 0.36, 0.72)}
            <path d="${puff(60, 50, 22, 12, 1.16)}" fill="url(#july4-eaglet-h)" ${O}/>
            <path d="M42 45Q44.5 36 52 32" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
          top: {svg: `<path d="M58 30C55.5 23 59 18.5 64.5 20C61 22 60.5 26 62.5 30Z" fill="#FFFFFF" ${O2}/><path d="M60.5 29C60 24.5 63.5 22 67.5 23.5C65 25 64 27 64 29.5Z" fill="#F4F1EC" ${O2}/>`, pivot: [61, 30]}
        },
        eyes: {lx: 50, rx: 70, y: 51, r: 4.6, style: "dot", color: "#2B1E18"},
        mouths: {
          neutral: `<path d="M55.6 57.6Q60 55.8 64.4 57.6Q64.6 61.6 60 64.6Q55.4 61.6 55.6 57.6Z" fill="#F5B942" ${OW(1.8)}/><path d="M58.4 62.2Q60 63.4 61.6 62.2" fill="none" stroke="#D08A1E" stroke-width="1.5" stroke-linecap="round"/>`,
          smile: `<path d="M55.4 57.4Q60 55.6 64.6 57.4Q64.8 61.6 60 64.8Q55.2 61.6 55.4 57.4Z" fill="#F7C04E" ${OW(1.8)}/><path d="M52.6 60.6q1.6 1.3 3.2 .3M67.4 60.6q-1.6 1.3 -3.2 .3" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`,
          open: `<path d="M56.6 60.8L63.4 60.8L60 64.8Z" fill="#FF8FA8" ${OW(1.4)}/><path d="M55.6 57Q60 55.2 64.4 57Q63.8 60.2 60 61.6Q56.2 60.2 55.6 57Z" fill="#F5B942" ${OW(1.8)}/><path d="M57 63.2Q60 62.4 63 63.2L60 67Z" fill="#F5B942" ${OW(1.6)}/>`,
          sleepy: `<path d="M56 58Q60 56.4 64 58Q64 61.4 60 64Q56 61.4 56 58Z" fill="#E8A83A" ${OW(1.8)}/>`
        },
        mouth: {x: 60, y: 59.5, w: 3},
        cheeks: {lx: 42.5, rx: 77.5, y: 59, w: 4.4, h: 2.7, color: "#FF9FB0"},
        anchors: {top: [60, 30, 1], neck: [60, 73, 1.05], chest: [71, 92, 0.72], back: [85, 84, 0.9], hands: [60, 94, 0.95]},
        lines: {
          tap: ["Hi! You make me want to soar!", "Look at you, flying so high!", "Screech! You're amazing today!", "Your wings are getting so strong!", "I'm your biggest fan, up here in the nest!", "Every page is a little flap higher!", "Wow! You're on a roll today!"],
          pet: ["Hehe! My fluffy feathers love that!", "Ooh, so cozy! Ruffle ruffle!"],
          hello: ["You're back! My whole nest is cheering!", "Hi! I was watching the sky for you!"],
          morning: ["Good morning! Clear skies ahead!", "Rise and shine! Let's soar today!"],
          night: ["Time to tuck in the nest. Rest well!", "The stars are out. Cozy night, friend!"],
          focus: ["Eyes on the sky. You've got this!", "Steady wings, quiet nest. Let's go!"],
          done: ["Screech! What a high-flying session!", "You soared! I'm so proud of you!"],
          task: ["Swoop! Done! WOO!", "Yes! You caught that one!", "Another one done! Way up high!", "Checked off! Look at you soar!"],
          break: ["Stretch those wings wide! Ahh!", "Glide over for a snack! Yum!"]
        }
      },
      {
        id: "july4-star", name: "Spangle", kind: "Star Spangle Sprite", pose: "float", wearColor: "#E0463C",
        bio: "A plump little star who trails a ribbon like a parade.",
        idle: ["tailSwish", "sparkle", "spin"], cheer: "spin",
        parts: {
          tail: {svg: `${LINE("M60 84C57 90 65 94 61 100C59 103 60.5 106 64 106", "#E0463C", 5.4)}<path d="M60 84C57 90 65 94 61 100C59 103 60.5 106 64 106" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [60, 84]},
          body: `${LG("july4-star-g", [[0, "#8FB0FA"], [0.6, "#5A82E6"], [1, "#3A62CC"]])}
            <polygon points="${starPts(60, 63, 37, 21)}" fill="none" stroke="${INK}" stroke-width="11" stroke-linejoin="round"/>
            <polygon points="${starPts(60, 63, 37, 21)}" fill="url(#july4-star-g)" stroke="url(#july4-star-g)" stroke-width="5" stroke-linejoin="round"/>
            <path d="M44 55L36 55.5" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/><path d="M55.5 39L58.5 32" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>
            <circle cx="46" cy="84" r="2" fill="#fff"/><circle cx="76" cy="84" r="2" fill="#fff"/>`
        },
        eyes: {lx: 51, rx: 69, y: 63, r: 5, style: "round", color: "#141C33"},
        mouth: {x: 60, y: 72.5, w: 2.8, color: "#141C33"},
        cheeks: {lx: 46, rx: 74, y: 71, w: 3.8, h: 2.5, color: "#FF9FB7"},
        anchors: {top: [60, 33, 0.7], neck: [60, 80, 0.9], chest: [70, 79, 0.58], back: [88, 58, 0.75], hands: [60, 83, 0.8]},
        lines: {
          tap: ["Twinkle! You're a total star!", "Hi! Let's have a parade for you!", "You're shining so bright today!", "Ribbons up! I'm cheering for you!", "Look at you, showing up again!", "You make my whole ribbon wiggle!", "Sparkle on! You're amazing!"],
          pet: ["Twinkle twinkle! That's so nice!", "Hehe! My ribbon is all a-flutter!"],
          hello: ["You're back! Start the parade!", "Hi hi! I saved you the brightest spot!"],
          morning: ["Good morning, superstar! Let's shine!", "Rise and sparkle! Big day ahead!"],
          night: ["Stars come out, students rest. Sleep well!", "My twinkle is soft now. Bedtime soon?"],
          focus: ["Quiet sparkle! You've got this!", "Shining softly right beside you!"],
          done: ["Parade time! What a stellar session!", "You did it! I'm twinkling with pride!"],
          task: ["Twinkle! Done! YAY!", "Yes yes yes! Gold star for you!", "Checked off! Cue the parade!", "Another one done! You shine!"],
          break: ["Wave your ribbon! Stretch break!", "Twirl around and grab some water! Wheee!"]
        }
      }
    ]
  });

  /* Halloween */
  COMP_DATA.push({
    theme: "halloween",
    companions: [
      {
        id: "halloween-pumpkin", name: "Patch", kind: "Pumpkin Sprite", pose: "sit", wearColor: "#7B5CA8",
        bio: "A plump, friendly pumpkin who glows warm on autumn nights.",
        idle: ["topBob", "bounce", "waddle"], cheer: "hop",
        parts: {
          body: `${LG("halloween-pumpkin-s", [[0, "#FFA54A"], [1, "#DC6418"]])}${LG("halloween-pumpkin-g", [[0, "#FFC27A"], [0.55, "#FFA040"], [1, "#E8741C"]])}
            <ellipse cx="42" cy="83" rx="19.5" ry="25.5" fill="url(#halloween-pumpkin-s)" ${O}/>
            <ellipse cx="78" cy="83" rx="19.5" ry="25.5" fill="url(#halloween-pumpkin-s)" ${O}/>
            <ellipse cx="60" cy="81.5" rx="23.5" ry="28" fill="url(#halloween-pumpkin-g)" ${O}/>
            <path d="M28 78Q28.5 68 33.5 63" fill="none" stroke="#FFE0B8" stroke-width="3" stroke-linecap="round" opacity=".85"/>
            <path d="M46 63Q50 57 56 56" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>
            <path d="M48 104Q60 108.5 72 104" fill="none" stroke="#C0561A" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>`,
          top: {svg: `<path d="M56 56C55 49 56 44 58.5 40.5L64.5 41.5C63 46 63 51 64 56Z" fill="#6E8F3A" ${O2}/>
            ${LINE("M63.5 47C69 45 72.5 48.5 70.5 52C68.5 54 66 51 68 49.5", "#8CC63F", 1.8)}
            <path d="M63 44C67 37 75 36 80 39C77 45.5 70 47.5 63 44Z" fill="#8CC63F" ${O2}/><path d="M65 43Q71 41 77 39.5" fill="none" stroke="#5E9A2E" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [60, 55]}
        },
        eyes: {lx: 50, rx: 70, y: 79, r: 5, style: "dot", color: "#2A1C2E"},
        mouth: {x: 60, y: 88, w: 3.2, color: "#2A1C2E"},
        cheeks: {lx: 42.5, rx: 77.5, y: 87, w: 4.6, h: 2.8, color: "#FF7F8F"},
        anchors: {top: [60, 54, 1.0], neck: [60, 99, 1.4], chest: [77, 98, 0.75], back: [94, 76, 0.9], hands: [60, 100, 0.9]},
        lines: {
          tap: ["Hi! You make me glow so bright!", "You're the pick of the patch today!", "Look at you, showing up again!", "My candle is flickering with joy!", "You've got this, I just know it!", "So happy to see you! Glow glow!", "What a cozy, clever day you're having!"],
          pet: ["Hehe! My stem is all wiggly now!", "Aww! That makes my glow so warm!"],
          hello: ["You're back! I lit my candle for you!", "Hi! The whole patch missed you!"],
          morning: ["Good morning! Crisp autumn air, let's go!", "Rise and shine! It's a great day to glow!"],
          night: ["My glow is dimming. Cozy bedtime soon?", "Autumn nights are for rest. Sleep well!"],
          focus: ["Glowing quietly beside you! You've got this!", "Steady candle, steady mind. Let's go!"],
          done: ["Wow! You lit up that whole session!", "Session done! I'm glowing so proud!"],
          task: ["Glow! Done! WOO!", "Yes! Carved that one right out!", "Checked off! My candle is blazing!", "Another one done! Amazing!"],
          break: ["Roll around and stretch! Ahh!", "Warm drink break! So cozy!"]
        }
      },
      {
        id: "halloween-ghost", name: "Boo", kind: "Tiny Ghost", pose: "float", sleepy: true, wearColor: "#F28A2E",
        bio: "A shy little ghost who only haunts your to-do list, gently.",
        idle: ["sway", "wingFlutter", "sparkle"], cheer: "spin",
        parts: {
          body: `${LG("halloween-ghost-g", [[0, "#FFFFFF"], [0.6, "#F5F1FD"], [1, "#D8CCF2"]])}
            <path d="M60 28C79.5 28 91 43 91 62V88A7.75 7.75 0 0 1 75.5 88A7.75 7.75 0 0 1 60 88A7.75 7.75 0 0 1 44.5 88A7.75 7.75 0 0 1 29 88V62C29 43 40.5 28 60 28Z" fill="url(#halloween-ghost-g)" ${O}/>
            <path d="M37 60Q37.5 45 47 38" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>
            <path d="M46 85Q60 89 74 85" fill="none" stroke="#C4B4EA" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>`,
          armL: {svg: `<ellipse cx="28.5" cy="70" rx="5" ry="7" transform="rotate(38 28.5 70)" fill="#F3EEFC" ${O}/>`, pivot: [34, 67]},
          armR: {svg: `<ellipse cx="91.5" cy="70" rx="5" ry="7" transform="rotate(-38 91.5 70)" fill="#F3EEFC" ${O}/>`, pivot: [86, 67]}
        },
        eyes: {lx: 50, rx: 70, y: 57, r: 5.2, style: "dot", color: "#2A1C2E"},
        mouth: {x: 60, y: 66, w: 3, color: "#2A1C2E"},
        cheeks: {lx: 41.5, rx: 78.5, y: 65, w: 4.6, h: 2.8, color: "#FF9FC0"},
        anchors: {top: [60, 30, 0.95], neck: [60, 76, 1.2], chest: [72, 80, 0.72], back: [89, 52, 0.85], hands: [60, 80, 0.9]},
        lines: {
          tap: ["Boo! Hehe, just saying hi!", "You're doing spook-tacular!", "I'm so happy you're here!", "Floating by to cheer you on!", "Look at you go! Wow!", "I believe in you, so much!", "You make my little sheet flutter!"],
          pet: ["Ooh! That gives me happy shivers!", "Hehe! I'm floating on air now!"],
          hello: ["You're back! I'm floating with joy!", "Boo! Hi! I missed you so much!"],
          morning: ["Good morning! Even ghosts love sunshine!", "Rise and shine! Let's float through today!"],
          night: ["Even ghosts need sleep. Rest well, friend!", "Time to drift off. Cozy dreams!"],
          focus: ["Quiet as a ghost! You've got this!", "Hovering softly right beside you!"],
          done: ["Wooo! What a spook-tacular session!", "Session done! I'm doing happy loops!"],
          task: ["Poof! Done! YAY!", "Yes! That task vanished!", "Checked off! I'm floating with pride!", "Another one done! Woo!"],
          break: ["Float around and stretch! Wheee!", "Snack break! Treats time!"]
        }
      },
      {
        id: "halloween-bat", name: "Echo", kind: "Sweater Bat", pose: "stand", wearColor: "#8CC63F",
        bio: "A cozy little bat in a hand-knit sweater, up late but never scary.",
        idle: ["wingFlutter", "earTwitch", "headTilt"], cheer: "wingFlutter",
        neck: [60, 72],
        parts: {
          wingL: {svg: `<path d="M43 72C35 63 22 60 11 64C14.5 68 15.5 72.5 13.5 77.5C19 76 23.5 78 25.5 83.5C29.5 80 35 81 39 85Z" fill="#5B4A7E" ${O}/><path d="M38 76Q28 71 18 70" fill="none" stroke="#7E6CA6" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [42, 75]},
          wingR: {svg: `<path d="M77 72C85 63 98 60 109 64C105.5 68 104.5 72.5 106.5 77.5C101 76 96.5 78 94.5 83.5C90.5 80 85 81 81 85Z" fill="#5B4A7E" ${O}/><path d="M82 76Q92 71 102 70" fill="none" stroke="#7E6CA6" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [78, 75]},
          earL: {svg: `<path d="M44 41L38 19L55.5 33Z" fill="#5E4C82" ${O}/><path d="M44.2 35.5L40.8 24.5L50 31.5Z" fill="#FFB3CC"/>`, pivot: [47, 36]},
          earR: {svg: `<path d="M76 41L82 19L64.5 33Z" fill="#5E4C82" ${O}/><path d="M75.8 35.5L79.2 24.5L70 31.5Z" fill="#FFB3CC"/>`, pivot: [73, 36]},
          feet: `<ellipse cx="51" cy="108.5" rx="6.4" ry="4" fill="#4A3C66" ${O}/><ellipse cx="69" cy="108.5" rx="6.4" ry="4" fill="#4A3C66" ${O}/>`,
          body: `${LG("halloween-bat-s", [[0, "#FFB066"], [1, "#E47A2A"]])}
            <path d="M60 66C77 66 84 80 84 92C84 104 76 109 60 109C44 109 36 104 36 92C36 80 43 66 60 66Z" fill="url(#halloween-bat-s)" ${O}/>
            <path d="M39.5 90Q60 96 80.5 90" fill="none" stroke="#7B5CA8" stroke-width="4.4"/>
            <path d="M41 101Q60 108 79 101" fill="none" stroke="#FBE3C4" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M40.5 84Q41 77 45.5 73" fill="none" stroke="#FFD6A8" stroke-width="2.8" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="38" cy="89" rx="5" ry="7.4" transform="rotate(24 38 89)" fill="#F29448" ${O}/><path d="M34 93.5Q37 96 40.5 95" fill="none" stroke="#7B5CA8" stroke-width="2.2" stroke-linecap="round"/>`, pivot: [43, 84]},
          armR: {svg: `<ellipse cx="82" cy="89" rx="5" ry="7.4" transform="rotate(-24 82 89)" fill="#F29448" ${O}/><path d="M86 93.5Q83 96 79.5 95" fill="none" stroke="#7B5CA8" stroke-width="2.2" stroke-linecap="round"/>`, pivot: [77, 84]},
          head: `${LG("halloween-bat-h", [[0, "#8573AE"], [1, "#54447A"]])}
            <circle cx="60" cy="52" r="23.5" fill="url(#halloween-bat-h)" ${O}/>
            <path d="M43 45Q45.5 37 52.5 33.5" fill="none" stroke="#B8A8DC" stroke-width="3" stroke-linecap="round" opacity=".8"/>`,
          face: `<ellipse cx="60" cy="62" rx="10.5" ry="7.4" fill="#A493C9" opacity=".55"/>`
        },
        eyes: {lx: 50, rx: 70, y: 52.5, r: 5.4, style: "round", color: "#2A1C2E"},
        mouth: {x: 60, y: 62.5, w: 2.8, color: "#2A1C2E"},
        cheeks: {lx: 42.5, rx: 77.5, y: 61, w: 4.2, h: 2.6, color: "#FF9FC4"},
        anchors: {top: [60, 30, 0.95], neck: [60, 74, 1.0], chest: [71, 99, 0.66], back: [84, 84, 0.85], hands: [60, 94, 0.9]},
        lines: {
          tap: ["Squeak! I'm so happy you're here!", "You're batty good at this!", "Look at you, flying through it!", "My sweater feels extra cozy with you!", "I'm cheering upside down for you!", "Flap flap! You're amazing today!", "You've got this, I just know it!"],
          pet: ["Squeak! My sweater is so cozy now!", "Hehe! My wings are all wiggly!"],
          hello: ["You're back! I did a happy flip!", "Hi hi! I've been hanging around for you!"],
          morning: ["Good morning! I stayed up to cheer you!", "Rise and shine! Let's flap into today!"],
          night: ["It's late, even for me. Time to rest!", "Cozy sweater, cozy bed. Sleep well!"],
          focus: ["Quiet wings! You've got this!", "Hanging quietly here, cheering you on!"],
          done: ["Squeak squeak! What a session!", "You did it! I'm doing loop-de-loops!"],
          task: ["Flap! Done! WOO!", "Yes yes yes! Checked off!", "Another one done! Squeak!", "Wow! That one flew right by!"],
          break: ["Stretch those cozy wings wide! Flap flap!", "Warm cocoa break! So cozy!"]
        }
      }
    ]
  });

  /* Thanksgiving */
  const fan = [[-155, "#C8561C"], [-122, "#F2B23E"], [-90, "#E07A2E"], [-58, "#F2B23E"], [-25, "#C8561C"]].map(([a, c]) => {
    const r = a * Math.PI / 180, x = f1(60 + 30 * Math.cos(r)), y = f1(76 + 30 * Math.sin(r)), tx = f1(60 + 43 * Math.cos(r)), ty = f1(76 + 43 * Math.sin(r));
    return `<ellipse cx="${x}" cy="${y}" rx="10" ry="20" transform="rotate(${a + 90} ${x} ${y})" fill="${c}" ${O}/><circle cx="${tx}" cy="${ty}" r="3.6" fill="#FBE6C4"/>`;
  }).join("");
  COMP_DATA.push({
    theme: "thanksgiving",
    companions: [
      {
        id: "thanksgiving-turkey", name: "Gobbles", kind: "Little Turkey", pose: "stand",
        bio: "A plump little turkey who is thankful for every page you read.",
        idle: ["tailSwish", "waddle", "wingFlutter"], cheer: "wingFlutter",
        parts: {
          tail: {svg: fan, pivot: [60, 82]},
          feet: `<path d="M44 110.5Q49 104 56 110.5Q50 113 44 110.5Z" fill="#F29A3A" ${O2}/><path d="M64 110.5Q71 104 76 110.5Q70 113 64 110.5Z" fill="#F29A3A" ${O2}/>`,
          body: `${LG("thanksgiving-turkey-g", [[0, "#C08A58"], [1, "#7A4A24"]])}
            <ellipse cx="60" cy="80" rx="28" ry="29" fill="url(#thanksgiving-turkey-g)" ${O}/>
            <ellipse cx="60" cy="96" rx="15" ry="9.5" fill="#E2B886"/>
            <path d="M40 66Q43 57 51 53.5" fill="none" stroke="#E6C29A" stroke-width="3" stroke-linecap="round" opacity=".85"/>`,
          armL: {svg: `<path d="M34.5 79C26 85 23.5 96 27.5 101.5C33.5 99.5 37 91 37.5 83Z" fill="#8A5A2B" ${O}/>`, pivot: [36, 81]},
          armR: {svg: `<path d="M85.5 79C94 85 96.5 96 92.5 101.5C86.5 99.5 83 91 82.5 83Z" fill="#8A5A2B" ${O}/>`, pivot: [84, 81]}
        },
        eyes: {lx: 50, rx: 70, y: 70, r: 4.8, style: "dot", color: "#2B1A10"},
        mouths: {
          neutral: `<path d="M59 73C55.5 73.5 54.5 78.5 55.5 82C57.5 83.5 59 80.5 58.6 77Z" fill="#E0463C" ${OW(1.6)}/><path d="M56.4 74Q60 72.6 63.6 74L60 78.6Z" fill="#F5B942" ${OW(1.8)}/>`,
          smile: `<path d="M59 73C55.5 73.5 54.5 78.5 55.5 82C57.5 83.5 59 80.5 58.6 77Z" fill="#E0463C" ${OW(1.6)}/><path d="M56 73.8Q60 72.2 64 73.8L60 78.8Z" fill="#F7C04E" ${OW(1.8)}/><path d="M66.5 76.8q-1.6 1.2 -3.2 .3" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`,
          open: `<path d="M59 73C55.5 73.5 54.5 78.5 55.5 82C57.5 83.5 59 80.5 58.6 77Z" fill="#E0463C" ${OW(1.6)}/><path d="M56.8 75.6L63.2 75.6L60 79.6Z" fill="#FF8FA8" ${OW(1.4)}/><path d="M56.2 73.2Q60 72 63.8 73.2L60 76Z" fill="#F5B942" ${OW(1.6)}/><path d="M57.2 77.6L62.8 77.6L60 81.4Z" fill="#F5B942" ${OW(1.6)}/>`,
          sleepy: `<path d="M59 73C55.5 73.5 54.5 78.5 55.5 82C57.5 83.5 59 80.5 58.6 77Z" fill="#D63F36" ${OW(1.6)}/><path d="M56.8 74.4Q60 73.4 63.2 74.4L60 78.2Z" fill="#E8A83A" ${OW(1.8)}/>`
        },
        mouth: {x: 60, y: 76, w: 3},
        cheeks: {lx: 42, rx: 78, y: 77, w: 4.4, h: 2.7, color: "#FF8F8F"},
        anchors: {top: [60, 52, 0.95], neck: [60, 91, 1.2], chest: [73, 97, 0.72], back: [86, 72, 0.9], hands: [60, 96, 0.9]},
        lines: {
          tap: ["Gobble gobble! So happy to see you!", "I'm thankful for you, every day!", "Look at you, reading so much!", "You're doing amazing! Gobble!", "Every page makes my feathers fan out!", "You've got this, I just know it!", "What a wonderful study day!"],
          pet: ["Gobble! My feathers are all puffed up!", "Hehe! That's the best feeling!"],
          hello: ["You're back! Gobble gobble, hooray!", "Hi! I'm so thankful you're here!"],
          morning: ["Good morning! Let's have a great day!", "Rise and shine! Gobble gobble!"],
          night: ["Full and sleepy. Time to rest, friend!", "Thankful for today. Cozy night!"],
          focus: ["Quiet gobbles! You've got this!", "Heads down! I'm cheering right here!"],
          done: ["Gobble! What a wonderful session!", "Session done! I'm so thankful for you!"],
          task: ["Gobble! Done! WOO!", "Yes! Another one on the table!", "Checked off! My feathers are fanned!", "Hooray! That one's done!"],
          break: ["Waddle around and stretch! Ahh!", "Snack break! Grab something yummy!"]
        }
      },
      {
        id: "thanksgiving-pie", name: "Dollop", kind: "Pumpkin Pie Slice", pose: "sit", sleepy: true,
        bio: "A warm slice of pumpkin pie with a swirl of cream on top.",
        idle: ["topBob", "sway", "finWiggle"], cheer: "hop",
        parts: {
          body: `${LG("thanksgiving-pie-f", [[0, "#FFC684"], [1, "#EB8A36"]])}${LG("thanksgiving-pie-c", [[0, "#F7D79A"], [1, "#D49A52"]])}
            <path d="M56 38.5Q60 32 64 38.5L94 92Q97.5 98 90.5 98H29.5Q22.5 98 26 92Z" fill="url(#thanksgiving-pie-f)" ${O}/>
            <path d="M22 96Q60 102 98 96Q101.5 104.5 94 110.5H26Q18.5 104.5 22 96Z" fill="url(#thanksgiving-pie-c)" ${O}/>
            <path d="M34 100.5v5.5M47 101.5v6.5M60 102v7M73 101.5v6.5M86 100.5v5.5" stroke="#B87838" stroke-width="2" stroke-linecap="round"/>
            <path d="M35 86L49 60" fill="none" stroke="#FFE3BD" stroke-width="3" stroke-linecap="round" opacity=".9"/>
            <circle cx="79" cy="89" r="1.6" fill="#C8661E"/><circle cx="41" cy="92" r="1.6" fill="#C8661E"/>`,
          armL: {svg: `<ellipse cx="27" cy="85" rx="4.4" ry="6.4" transform="rotate(30 27 85)" fill="#F4A252" ${O}/>`, pivot: [33, 83]},
          armR: {svg: `<ellipse cx="93" cy="85" rx="4.4" ry="6.4" transform="rotate(-30 93 85)" fill="#F4A252" ${O}/>`, pivot: [87, 83]},
          top: {svg: `<path d="M49 43C46 37 51 32 56.5 33C57.5 27.5 64.5 27 66.5 32C72 31 75 37.5 71 42Q60 46.5 49 43Z" fill="#FFFDF8" ${O2}/><path d="M57 33C58.5 28.5 62 26 64.5 27.5" fill="#FFFDF8" ${O2}/><path d="M53.5 40Q60 42 66 39.5" fill="none" stroke="#EADFCF" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [60, 42]}
        },
        eyes: {lx: 51, rx: 69, y: 76, r: 4.6, style: "dot", color: "#3A2210"},
        mouth: {x: 60, y: 84.5, w: 3, color: "#3A2210"},
        cheeks: {lx: 44, rx: 76, y: 83.5, w: 4.2, h: 2.6, color: "#FF7F7F"},
        anchors: {top: [60, 35, 0.8], neck: [60, 97, 1.4], chest: [74, 91, 0.66], back: [86, 78, 0.85], hands: [60, 92, 0.9]},
        lines: {
          tap: ["Hi! You're the sweetest!", "You're doing so well today!", "A whole slice of cheers for you!", "Look at you, showing up again!", "You make my cream swirl with joy!", "Warm and cozy, cheering you on!", "You've got this, sweet friend!"],
          pet: ["Hehe! My cream swirl is so happy!", "Aww! I'm warm all the way through!"],
          hello: ["You're back! Fresh from the oven!", "Hi! I saved you the best slice!"],
          morning: ["Good morning! Warm and ready to go!", "Rise and shine! It's a sweet day!"],
          night: ["Cooling on the windowsill. Time to rest!", "Sweet dreams, friend. Cozy night!"],
          focus: ["Baking quietly beside you! You've got this!", "Warm and steady! Let's go!"],
          done: ["Wow! That session was just right!", "Session done! What a sweet finish!"],
          task: ["Yum! Done! WOO!", "Yes! Another slice of success!", "Checked off! So sweet!", "Hooray! That one's baked!"],
          break: ["Stretch it out! Ahh, so nice!", "Treat break! You totally earned it!"]
        }
      },
      {
        id: "thanksgiving-corn", name: "Kernel", kind: "Corn Cob", pose: "stand",
        bio: "A sunny corn cob who is always all ears for you.",
        idle: ["wingFlutter", "topBob", "sway"], cheer: "spin",
        parts: {
          wingL: {svg: `<path d="M47 70C36 74 29 88 32 105C39 99 46 90 50 80Z" fill="#9CC25A" ${O}/><path d="M44 78Q38 88 36 99" fill="none" stroke="#C6E08E" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [48, 76]},
          wingR: {svg: `<path d="M73 70C84 74 91 88 88 105C81 99 74 90 70 80Z" fill="#9CC25A" ${O}/><path d="M76 78Q82 88 84 99" fill="none" stroke="#C6E08E" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [72, 76]},
          feet: `<ellipse cx="51" cy="108.5" rx="6.4" ry="4" fill="#7FA83E" ${O}/><ellipse cx="69" cy="108.5" rx="6.4" ry="4" fill="#7FA83E" ${O}/>`,
          body: `${LG("thanksgiving-corn-g", [[0, "#FFEA8A"], [0.55, "#FFD04A"], [1, "#F0AE2E"]])}${LG("thanksgiving-corn-h", [[0, "#B8D878"], [1, "#7FA83E"]])}
            <path d="M60 31C74 31 81 48 81 68C81 90 74 106 60 106C46 106 39 90 39 68C39 48 46 31 60 31Z" fill="url(#thanksgiving-corn-g)" ${O}/>
            <path d="M47.5 43Q60 46.5 72.5 43M44 52Q60 56 76 52" fill="none" stroke="#E6A52C" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M53.5 37V44.5M60 35V45.5M66.5 37V44.5" fill="none" stroke="#E6A52C" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M43.5 70Q43 57 48 49" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".75"/>
            <path d="M60 107C47 106.5 39.5 97 37.5 80C46 85 55 93 60 107Z" fill="url(#thanksgiving-corn-h)" ${O2}/>
            <path d="M60 107C73 106.5 80.5 97 82.5 80C74 85 65 93 60 107Z" fill="url(#thanksgiving-corn-h)" ${O2}/>`,
          armL: {svg: `<ellipse cx="37" cy="74" rx="4.2" ry="6.2" transform="rotate(30 37 74)" fill="#F7C84A" ${O}/>`, pivot: [42, 72]},
          armR: {svg: `<ellipse cx="83" cy="74" rx="4.2" ry="6.2" transform="rotate(-30 83 74)" fill="#F7C84A" ${O}/>`, pivot: [78, 72]},
          top: {svg: `${LINE("M57.5 32C55 26 59 22.5 56.5 17", "#D9A441", 2.2)}${LINE("M62.5 32C65 26.5 61.5 22.5 64.5 17.5", "#C98A3A", 2.2)}`, pivot: [60, 32]}
        },
        eyes: {lx: 51, rx: 69, y: 64, r: 4.6, style: "dot", color: "#3A2A10"},
        mouth: {x: 60, y: 72.5, w: 3, color: "#3A2A10"},
        cheeks: {lx: 45, rx: 75, y: 71.5, w: 4, h: 2.6, color: "#FF8F8F"},
        anchors: {top: [60, 32, 0.8], neck: [60, 82, 1.0], chest: [70, 88, 0.62], back: [80, 60, 0.8], hands: [60, 86, 0.85]},
        lines: {
          tap: ["Hi! I'm all ears for you!", "You're doing a-maize-ing!", "Look at you, standing tall!", "So happy you're here today!", "Sunny cheers, just for you!", "You've got this! I'm listening!", "Every kernel of me is cheering!"],
          pet: ["Hehe! My husk is all rustly now!", "Ooh! That makes me pop with joy!"],
          hello: ["You're back! I'm all ears!", "Hi! The whole field missed you!"],
          morning: ["Good morning! Sunny fields today!", "Rise and shine! Let's grow tall!"],
          night: ["The field is quiet now. Time to rest!", "Tuck into your husk. Sleep well!"],
          focus: ["Quiet field, steady mind. You've got this!", "All ears and cheering you on!"],
          done: ["Pop pop! What a great session!", "Session done! What a harvest!"],
          task: ["Pop! Done! WOO!", "Yes! Another one harvested!", "Checked off! I'm popping with joy!", "Hooray! That one's done!"],
          break: ["Stretch up tall like a cornstalk!", "Snack break! Popcorn, maybe?"]
        }
      }
    ]
  });

  /* Hanukkah */
  COMP_DATA.push({
    theme: "hanukkah",
    companions: [
      {
        id: "hanukkah-dreidel", name: "Spinny", kind: "Little Dreidel", pose: "float", wearColor: "#F2C24A",
        bio: "A spinning dreidel who always lands on a happy side.",
        idle: ["spin", "topBob", "wave"], cheer: "spin",
        parts: {
          body: `${LG("hanukkah-dreidel-g", [[0, "#9DB9F6"], [0.55, "#6A90E2"], [1, "#3A64BC"]], 0.2, 0, 0.8, 1)}
            <path d="M40.5 40H79.5Q86 40 86 46.5V76L63.5 100Q60 103.5 56.5 100L34 76V46.5Q34 40 40.5 40Z" fill="url(#hanukkah-dreidel-g)" ${O}/>
            <path d="M37 78H83" stroke="#F2C24A" stroke-width="3.4"/>
            <path d="M60 83.5L64.3 91H55.7Z M60 94L64.3 86.5H55.7Z" fill="#FFD86B" stroke="#C99A2A" stroke-width="1.4" stroke-linejoin="round"/>
            <path d="M40 70V50Q40.5 46 44 45" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`,
          armL: {svg: `<ellipse cx="31" cy="63" rx="4.4" ry="6.4" transform="rotate(30 31 63)" fill="#5E86DA" ${O}/>`, pivot: [37, 60]},
          armR: {svg: `<ellipse cx="89" cy="63" rx="4.4" ry="6.4" transform="rotate(-30 89 63)" fill="#5E86DA" ${O}/>`, pivot: [83, 60]},
          top: {svg: `${LG("hanukkah-dreidel-t", [[0, "#FFE58F"], [1, "#E0A82A"]])}<rect x="55.5" y="23" width="9" height="19" rx="4" fill="url(#hanukkah-dreidel-t)" ${O}/><path d="M58 27.5V35" stroke="#FFF6D0" stroke-width="2" stroke-linecap="round"/>`, pivot: [60, 41]}
        },
        eyes: {lx: 50, rx: 70, y: 58, r: 5.4, style: "round", color: "#13203A"},
        mouth: {x: 60, y: 68, w: 3, color: "#13203A"},
        cheeks: {lx: 42, rx: 78, y: 66.5, w: 4.2, h: 2.6, color: "#FFA3C4"},
        anchors: {top: [60, 41, 0.95], neck: [60, 78, 1.05], chest: [72, 73, 0.58], back: [86, 55, 0.85], hands: [60, 80, 0.85]},
        lines: {
          tap: ["Spin spin! So happy to see you!", "You always land on the happy side!", "Look at you, on a roll today!", "Round and round, cheering for you!", "You're doing amazing! Wheee!", "Every spin is a win with you!", "You've got this, I just know it!"],
          pet: ["Wheee! You set me spinning!", "Hehe! I'm all dizzy and happy!"],
          hello: ["You're back! I'm spinning with joy!", "Hi hi! Let's have a great day!"],
          morning: ["Good morning! Let's get spinning!", "Rise and shine! A bright day awaits!"],
          night: ["Slowing my spin. Time to rest, friend!", "Cozy night! Sweet dreams!"],
          focus: ["Steady spin! You've got this!", "Quietly twirling right beside you!"],
          done: ["Wheee! What a winning session!", "Session done! Big happy spin for you!"],
          task: ["Spin! Done! WOO!", "Yes! Landed on a win!", "Checked off! Wheee!", "Another one done! Hooray!"],
          break: ["Spin around and stretch! Wheee!", "Snack break! Something sweet?"]
        }
      },
      {
        id: "hanukkah-candle", name: "Wick", kind: "Menorah Candle", pose: "stand",
        bio: "A bright little candle who adds one more glow each night.",
        idle: ["topBob", "sway", "wave"], cheer: "bounce",
        parts: {
          body: `${LG("hanukkah-candle-g", [[0, "#FFFFFF"], [1, "#DCE6F7"]], 0, 0, 1, 0)}${LG("hanukkah-candle-d", [[0, "#FFE58F"], [1, "#D9A12A"]])}
            <rect x="41" y="44" width="38" height="62" rx="9" fill="url(#hanukkah-candle-g)" ${O}/>
            <path d="M42.6 84.5L77.4 77V84L42.6 91.5Z" fill="#6A90E2"/><path d="M42.6 97.5L77.4 90V97L42.6 104.5Z" fill="#6A90E2"/>
            <path d="M46.5 77V54Q47 49.5 51 48.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            <path d="M34 103.5Q60 97.5 86 103.5Q86.5 111 60 111Q33.5 111 34 103.5Z" fill="url(#hanukkah-candle-d)" ${O}/>
            <path d="M40 104.5Q48 102.5 55 102.3" fill="none" stroke="#FFF3C0" stroke-width="2" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="37.5" cy="76" rx="4.4" ry="6.4" transform="rotate(28 37.5 76)" fill="#F4F7FD" ${O}/>`, pivot: [43, 73]},
          armR: {svg: `<ellipse cx="82.5" cy="76" rx="4.4" ry="6.4" transform="rotate(-28 82.5 76)" fill="#F4F7FD" ${O}/>`, pivot: [77, 73]},
          top: {svg: `${RG("hanukkah-candle-glow", [[0, "#FFE58F", 0.75], [1, "#FFE58F", 0]])}${LG("hanukkah-candle-f", [[0, "#FFD04A"], [1, "#FF9A3A"]])}
            <circle cx="60" cy="31" r="15" fill="url(#hanukkah-candle-glow)"/>
            ${LINE("M60 45V40.5", "#5A5060", 1.8)}
            <path d="M60 16C65 23 68.5 28 68.5 33C68.5 38.5 64.5 42 60 42C55.5 42 51.5 38.5 51.5 33C51.5 28 55 23 60 16Z" fill="url(#hanukkah-candle-f)" ${O2}/>
            <path d="M60 26.5C62.5 30 63.6 32.4 63.6 34.8C63.6 37.4 62 39 60 39C58 39 56.4 37.4 56.4 34.8C56.4 32.4 57.5 30 60 26.5Z" fill="#FFF6C8"/>`, pivot: [60, 44]}
        },
        eyes: {lx: 51, rx: 69, y: 60, r: 4.6, style: "dot", color: "#13203A"},
        mouth: {x: 60, y: 69, w: 2.8, color: "#13203A"},
        cheeks: {lx: 46, rx: 74, y: 67.5, w: 3.8, h: 2.5, color: "#FF9FB7"},
        anchors: {top: [60, 45, 0.85], neck: [60, 76, 0.95], chest: [70, 80, 0.62], back: [80, 70, 0.8], hands: [60, 84, 0.85]},
        lines: {
          tap: ["Hi! You make my flame so bright!", "One more glow, just for you!", "Look at you, shining today!", "You're doing wonderfully!", "My little wick is cheering for you!", "You've got this! Glow on!", "Every night you shine a bit brighter!"],
          pet: ["Hehe! My flame did a happy dance!", "Aww! I'm glowing extra warm now!"],
          hello: ["You're back! I lit up for you!", "Hi! The whole menorah is glowing!"],
          morning: ["Good morning! A bright day ahead!", "Rise and shine! Let's glow today!"],
          night: ["My glow is soft now. Time to rest!", "Warm light, cozy bed. Sleep well!"],
          focus: ["Steady flame! You've got this!", "Glowing quietly beside you!"],
          done: ["Wow! What a bright session!", "Session done! I'm glowing with pride!"],
          task: ["Glow! Done! WOO!", "Yes! One more light shining!", "Checked off! So bright!", "Another one done! Hooray!"],
          break: ["Stretch up tall like a candle!", "Warm drink break! So cozy!"]
        }
      },
      {
        id: "hanukkah-donut", name: "Sugar", kind: "Jelly Doughnut", pose: "sit", sleepy: true,
        bio: "A pillowy jelly doughnut dusted in sugar, sweet and cozy.",
        idle: ["topBob", "bounce", "finWiggle"], cheer: "hop",
        parts: {
          body: `${LG("hanukkah-donut-g", [[0, "#F9D08E"], [0.55, "#EDAA5C"], [1, "#CF8538"]])}${LG("hanukkah-donut-s", [[0, "#FFFFFF"], [1, "#EEF2FA"]])}
            <ellipse cx="60" cy="83" rx="34" ry="26.5" fill="url(#hanukkah-donut-g)" ${O}/>
            <path d="M27 77C27 65 41 56.5 60 56.5C79 56.5 93 65 93 77C89.5 74 86.5 78.5 82.5 76C78.5 73.5 75.5 78 71 75.5C67 73.5 64 77.5 60 75.5C56 77.5 53 73.5 49 75.5C44.5 78 41.5 73.5 37.5 76C33.5 78.5 30.5 74 27 77Z" fill="url(#hanukkah-donut-s)" ${O2}/>
            <path d="M35 69Q38 63 45 60" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            <path d="M38 101Q60 109 82 101" fill="none" stroke="#B87030" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>
            <circle cx="32" cy="88" r="1.3" fill="#fff"/><circle cx="88" cy="89" r="1.3" fill="#fff"/><circle cx="80" cy="100" r="1.3" fill="#fff"/>`,
          armL: {svg: `<ellipse cx="25.5" cy="94" rx="4.6" ry="6.4" transform="rotate(28 25.5 94)" fill="#E6A45A" ${O}/>`, pivot: [31, 91]},
          armR: {svg: `<ellipse cx="94.5" cy="94" rx="4.6" ry="6.4" transform="rotate(-28 94.5 94)" fill="#E6A45A" ${O}/>`, pivot: [89, 91]},
          top: {svg: `${LG("hanukkah-donut-j", [[0, "#FF7A7A"], [1, "#C8323C"]])}<path d="M58.5 58.5C57.5 51.5 62 47.5 67 48C72.5 48.5 75 53.5 73 58.5Q66 61.5 58.5 58.5Z" fill="url(#hanukkah-donut-j)" ${O2}/><ellipse cx="63.5" cy="52.5" rx="2" ry="1.4" fill="#fff" opacity=".85"/>`, pivot: [66, 58]}
        },
        eyes: {lx: 49, rx: 71, y: 86, r: 5, style: "dot", color: "#3A2210"},
        mouth: {x: 60, y: 95, w: 3, color: "#3A2210"},
        cheeks: {lx: 40, rx: 80, y: 94, w: 4.8, h: 2.9, color: "#FF8F9F"},
        anchors: {top: [60, 58, 1.0], neck: [60, 101, 1.35], chest: [79, 101, 0.72], back: [92, 78, 0.9], hands: [60, 102, 0.9]},
        lines: {
          tap: ["Hi! You're so sweet!", "You're doing amazing today!", "Look at you, showing up again!", "A sprinkle of cheers for you!", "You make me so happy, I could puff up!", "You've got this, sweet friend!", "Fluffy hugs and big cheers!"],
          pet: ["Hehe! My sugar is all sparkly!", "Ooh! So soft and cozy!"],
          hello: ["You're back! Fresh and fluffy for you!", "Hi! I saved you the sweetest spot!"],
          morning: ["Good morning! A sweet start to the day!", "Rise and shine! Let's have a great day!"],
          night: ["Pillowy and sleepy. Time to rest!", "Sweet dreams, friend! Cozy night!"],
          focus: ["Soft and steady! You've got this!", "Quietly cheering right beside you!"],
          done: ["Wow! What a sweet session!", "Session done! I'm so proud of you!"],
          task: ["Yum! Done! WOO!", "Yes! Another one filled with success!", "Checked off! So sweet!", "Hooray! That one's done!"],
          break: ["Stretch it out! So nice!", "Snack break! Something tasty?"]
        }
      }
    ]
  });
})();


