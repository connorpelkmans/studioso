/* Study Companions, new theme ideas batch n2: mushrooms, sunflowers, cloudkingdom, nighttrain, ramen */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const twinkle = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${c || "#fff"}"/>`;
  const shine = (x, y, rx, ry, rot) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})" fill="#fff" opacity=".85"/>`;

  /* ================= Mushroom Hollow ================= */
  COMP_DATA.push({
    theme: "mushrooms",
    companions: [
      {
        id: "mushrooms-toadie", name: "Toadie", kind: "Toadstool Pal", pose: "stand", wearColor: "#6DB35E",
        bio: "Red cap, white spots, and a big umbrella-sized heart.",
        idle: ["topBob", "sway", "sparkle"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="47" cy="109.5" rx="9" ry="4.4" fill="#E6D2B8" ${O}/><ellipse cx="73" cy="109.5" rx="9" ry="4.4" fill="#E6D2B8" ${O}/>`,
          body: `${LG("mushrooms-toadie-mushrooms-toadie-s", [[0, "#FFFBF2"], [0.6, "#F8EBD8"], [1, "#E6D0B4"]], 0, 0, 1, 0)}
            <path d="M42 52C40 70 36 92 38 104Q60 112 82 104C84 92 80 70 78 52Z" fill="url(#mushrooms-toadie-mushrooms-toadie-s)" ${O}/>
            <path d="M44 100Q60 106 76 100" fill="none" stroke="#E2C8A8" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M46 60Q45 72 46 84" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/>`,
          armL: {svg: `<ellipse cx="35" cy="82" rx="5" ry="8" transform="rotate(28 35 82)" fill="#F6E8D4" ${O}/>`, pivot: [41, 77]},
          armR: {svg: `<ellipse cx="85" cy="82" rx="5" ry="8" transform="rotate(-28 85 82)" fill="#F6E8D4" ${O}/>`, pivot: [79, 77]},
          top: {svg: `${RG("mushrooms-toadie-mushrooms-toadie-c", [[0, "#FFA890"], [0.5, "#EC5A48"], [1, "#C23A32"]], 0.38, 0.28, 0.75)}
            <path d="M14 52C14 28 34 14 60 14C86 14 106 28 106 52C106 58 100 60 92 60H28C20 60 14 58 14 52Z" fill="url(#mushrooms-toadie-mushrooms-toadie-c)" ${O}/>
            <path d="M24 56Q60 64 96 56" fill="none" stroke="#F4D8C0" stroke-width="3" stroke-linecap="round" opacity=".8"/>
            <ellipse cx="34" cy="38" rx="7" ry="5.4" fill="#FFF8EE"/><ellipse cx="58" cy="26" rx="8" ry="6" fill="#FFF8EE"/><ellipse cx="84" cy="38" rx="6.4" ry="5" fill="#FFF8EE"/><ellipse cx="50" cy="46" rx="4.4" ry="3.4" fill="#FFF8EE"/><ellipse cx="74" cy="22" rx="3.4" ry="2.6" fill="#FFF8EE"/><ellipse cx="96" cy="48" rx="3" ry="2.4" fill="#FFF8EE"/>
            ${shine(28, 28, 6, 3, -35)}`, pivot: [60, 58]}
        },
        eyes: {lx: 51, rx: 69, y: 76, r: 4.6, style: "round", color: "#3A1E1A"},
        mouth: {x: 60, y: 85, w: 3, color: "#3A1E1A"},
        cheeks: {lx: 44, rx: 76, y: 83, w: 4, h: 2.6, color: "#FF8F9A"},
        anchors: {top: [60, 16, 0.95], neck: [60, 94, 0.9], chest: [70, 96, 0.6], back: [86, 74, 0.8], hands: [60, 98, 0.8]},
        lines: {
          tap: ["Hi hi! Want to share my umbrella? It's my cap!", "You're growing so well today!", "Slow and steady, like moss on a log. You've got this!", "My spots are all sparkly because you're here!", "Little by little, a whole forest grows!", "Rain or shine, I'm cheering for you!", "Deep breath of forest air. Ahh. Okay, onward!"],
          pet: ["Hehe, careful, my cap is ticklish!", "Aww, that made my spots blush!"],
          hello: ["You're back! The glade feels brighter already!", "Hello, friend! I kept your spot dry for you!"],
          morning: ["Good morning! The dew is sparkling just for you!", "Rise and sprout! Today's a good growing day!"],
          night: ["The glade is glowing softly. Rest soon?", "Even mushrooms need their sleep. Cozy dreams!"],
          focus: ["Quiet as moss. I'm right here with you.", "Growing roots of focus together. Let's go!"],
          done: ["What a session! You grew so much!", "Done! That's a whole ring of hard work!"],
          task: ["Pop! Another one done!", "Yay! Checked off and spotless!", "WOO! That one's in the basket!", "You did it! My cap is doing a happy wiggle!"],
          break: ["Stretch time! Reach up like a tall toadstool!", "Break time! Go find a sunbeam!"]
        }
      },
      {
        id: "mushrooms-fiddle", name: "Fiddle", kind: "Fern Fiddlehead", pose: "stand", wearColor: "#C98B5A",
        bio: "A curl that unrolls a little more every time you finish something.",
        idle: ["sway", "topBob", "headTilt"], cheer: "spin",
        neck: [60, 66],
        parts: {
          feet: `<path d="M38 110Q60 102 82 110Q60 114 38 110Z" fill="#8A6A48" ${O2}/><path d="M44 108Q50 104 54 108M64 108Q70 104 76 108" fill="none" stroke="#B88E62" stroke-width="2" stroke-linecap="round"/>`,
          body: `${LG("mushrooms-fiddle-mushrooms-fiddle-b", [[0, "#9ED676"], [1, "#5E9E4E"]])}
            <path d="M52 66C50 80 50 96 52 108H68C70 96 70 80 68 66Z" fill="url(#mushrooms-fiddle-mushrooms-fiddle-b)" ${O}/>
            <path d="M56 72Q55 88 56 102" fill="none" stroke="#C8EEA8" stroke-width="2.4" stroke-linecap="round"/>`,
          armL: {svg: `<g transform="rotate(-46 52 83)"><path d="M52 82C42 74 30 74 24 80C32 88 44 88 52 84Z" fill="#8CCB6A" ${O}/><path d="M50 83Q38 80 28 80" fill="none" stroke="#5E9E4E" stroke-width="1.8" stroke-linecap="round"/></g>`, pivot: [52, 83]},
          armR: {svg: `<g transform="rotate(46 68 83)"><path d="M68 82C78 74 90 74 96 80C88 88 76 88 68 84Z" fill="#8CCB6A" ${O}/><path d="M70 83Q82 80 92 80" fill="none" stroke="#5E9E4E" stroke-width="1.8" stroke-linecap="round"/></g>`, pivot: [68, 83]},
          head: `${RG("mushrooms-fiddle-mushrooms-fiddle-h", [[0, "#C8F0A0"], [0.6, "#8CCB6A"], [1, "#5E9E4E"]], 0.4, 0.35, 0.7)}
            <circle cx="60" cy="44" r="27" fill="url(#mushrooms-fiddle-mushrooms-fiddle-h)" ${O}/>
            <path d="M74 30a3 3 0 1 1 -5 3a8 8 0 1 1 8 -10a14 14 0 1 1 -24 -4" fill="none" stroke="#4E8E3E" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>
            ${shine(46, 30, 6, 3, -35)}`,
          top: {svg: `${LINE("M66 18Q70 10 78 9", "#6DB35E", 2.4)}<path d="M78 9C84 4 92 6 92 12C86 14 80 13 78 9Z" fill="#A6DA7E" ${O2}/>`, pivot: [65, 19]}
        },
        eyes: {lx: 50, rx: 70, y: 46, r: 4.4, style: "dot", color: "#20301A"},
        mouth: {x: 60, y: 55, w: 2.8, color: "#20301A"},
        cheeks: {lx: 43, rx: 77, y: 53, w: 3.8, h: 2.4, color: "#FF8FA0"},
        anchors: {top: [60, 18, 0.85], neck: [60, 70, 0.7], chest: [64, 90, 0.5], back: [76, 86, 0.6], hands: [60, 88, 0.7]},
        lines: {
          tap: ["Hi! I unrolled a tiny bit just seeing you!", "Every page you read, I uncurl a little more!", "Curious minds grow the tallest. That's you!", "One frond at a time, one task at a time!", "You're in such a good groove today!", "Shh, can you hear the forest cheering?", "Stretch your thinking, like me!"],
          pet: ["Eep! That makes me curl up giggling!", "Hehe, soft pats make my leaves wiggle!"],
          hello: ["You're back! I've been curling with excitement!", "Hiya! Ready to grow a little today?"],
          morning: ["Good morning! Time to unfurl and shine!", "Morning! The forest floor is all sparkly!"],
          night: ["Curling up for the night. You too, soon?", "Sleepy fronds, sleepy friend. Good night!"],
          focus: ["Rooted and ready. Let's focus!", "Quietly uncurling beside you."],
          done: ["Look! I unrolled a whole extra leaf!", "Session done! You helped me grow so much!"],
          task: ["Done! Uncurl, uncurl, YAY!", "Another one finished! I'm so proud!", "Checked off! My leaves are dancing!", "Wheee! That one counts double!"],
          break: ["Stretch it out, like a fern in the sun!", "Break time! Wiggle your fingers and toes!"]
        }
      },
      {
        id: "mushrooms-dormy", name: "Dormy", kind: "Hazel Dormouse", pose: "sit", sleepy: true, wearColor: "#7FA6FF",
        bio: "Naps in a mushroom cup between study sessions.",
        idle: ["earTwitch", "tailSwish", "headTilt"], cheer: "hop",
        neck: [60, 74],
        parts: {
          tail: {svg: `${LG("mushrooms-dormy-mushrooms-dormy-t", [[0, "#F2B878"], [1, "#C8803E"]])}<path d="M82 96C98 94 108 80 104 64C102 56 94 54 90 60C96 70 92 82 80 88Z" fill="url(#mushrooms-dormy-mushrooms-dormy-t)" ${O}/><path d="M96 66Q99 76 92 84" fill="none" stroke="#FFE2B8" stroke-width="2" stroke-linecap="round"/>`, pivot: [82, 92]},
          feet: `${RG("mushrooms-dormy-mushrooms-dormy-cup", [[0, "#FF9E86"], [1, "#C23A32"]], 0.4, 0.3, 0.8)}
            <path d="M26 92Q26 114 60 114Q94 114 94 92Z" fill="url(#mushrooms-dormy-mushrooms-dormy-cup)" ${O}/>
            <ellipse cx="40" cy="102" rx="4" ry="3" fill="#FFF8EE"/><ellipse cx="58" cy="108" rx="4.6" ry="3" fill="#FFF8EE"/><ellipse cx="78" cy="101" rx="3.6" ry="2.8" fill="#FFF8EE"/>`,
          body: `${LG("mushrooms-dormy-mushrooms-dormy-b", [[0, "#F6C690"], [1, "#D8904A"]])}
            <path d="M34 94C34 76 44 68 60 68C76 68 86 76 86 94Z" fill="url(#mushrooms-dormy-mushrooms-dormy-b)" ${O}/>
            <ellipse cx="60" cy="88" rx="13" ry="8" fill="#FFF2DE"/>`,
          armL: {svg: `<ellipse cx="46" cy="90" rx="6" ry="4.6" fill="#F2B878" ${O}/>`, pivot: [48, 88]},
          armR: {svg: `<ellipse cx="74" cy="90" rx="6" ry="4.6" fill="#F2B878" ${O}/>`, pivot: [72, 88]},
          earL: {svg: `<circle cx="38" cy="36" r="11" fill="#E8A462" ${O}/><circle cx="38" cy="36" r="6" fill="#FFC8C0"/>`, pivot: [44, 44]},
          earR: {svg: `<circle cx="82" cy="36" r="11" fill="#E8A462" ${O}/><circle cx="82" cy="36" r="6" fill="#FFC8C0"/>`, pivot: [76, 44]},
          head: `${RG("mushrooms-dormy-mushrooms-dormy-h", [[0, "#FAD2A0"], [0.7, "#ECA864"], [1, "#D88E48"]], 0.42, 0.35, 0.75)}
            <ellipse cx="60" cy="54" rx="26" ry="23" fill="url(#mushrooms-dormy-mushrooms-dormy-h)" ${O}/>
            ${shine(46, 40, 5, 2.6, -35)}`,
          face: `<ellipse cx="60" cy="64" rx="10" ry="7" fill="#FFF2DE"/><ellipse cx="60" cy="60.6" rx="2.6" ry="2" fill="#5A3A2A"/>
            <path d="M48 62H38M48 65L39 68M72 62H82M72 65L81 68" stroke="#8A5A3A" stroke-width="1.2" stroke-linecap="round"/>`
        },
        eyes: {lx: 50, rx: 70, y: 53, r: 4.6, style: "round", color: "#2A1A12"},
        mouth: {x: 60, y: 65, w: 2.2, style: "cat", color: "#2A1A12"},
        cheeks: {lx: 42, rx: 78, y: 61, w: 4, h: 2.4, color: "#FF8F9A"},
        anchors: {top: [60, 32, 0.85], neck: [60, 74, 0.85], chest: [60, 88, 0.55], back: [86, 82, 0.7], hands: [60, 90, 0.75]},
        lines: {
          tap: ["*yawn* Oh! Hi! I was just resting my eyes!", "You study, I'll keep this mushroom warm!", "Tiny steps, cozy pace, big results!", "You're doing wonderfully, sleepy-head approved!", "Snack, stretch, then back to it?", "My whiskers say today is a good day!", "Curl up with a good chapter? I'll join you!"],
          pet: ["Mmm, that's the coziest pat ever!", "Hehe, now I'm extra snuggly!"],
          hello: ["*blink blink* You're here! Best wake-up ever!", "Hello! I saved you the comfiest spot!"],
          morning: ["Good morning! I'm awake! Mostly!", "Morning, friend! Hazelnut breakfast first?"],
          night: ["Nap o'clock! Rest well, okay?", "So cozy. Let's both sleep soon."],
          focus: ["Wide awake for you! Let's focus!", "Quiet as a dormouse. That's very quiet."],
          done: ["Wow! You worked hard enough for both of us!", "Session done! Time for a celebratory nap!"],
          task: ["Yay! Done! *happy squeak*", "Checked off! My tail is swishing!", "Another one! You're unstoppable!", "Woo! That deserves a hazelnut!"],
          break: ["Break time! Have a little stretch and a snack!", "Rest your eyes for a minute. I'll keep watch!"]
        }
      }
    ]
  });

  /* ================= Sunflower Field ================= */
  const sunPetals = (cx, cy, n, R, w, r0, fill) => Array.from({length: n}, (_, i) => `<path d="M${cx + r0} ${cy}Q${(cx + (r0 + R) / 2).toFixed(1)} ${cy - w} ${cx + R} ${cy}Q${(cx + (r0 + R) / 2).toFixed(1)} ${cy + w} ${cx + r0} ${cy}Z" transform="rotate(${(i * 360 / n).toFixed(1)} ${cx} ${cy})" fill="${fill}" ${OW(2)}/>`).join("");
  COMP_DATA.push({
    theme: "sunflowers",
    companions: [
      {
        id: "sunflowers-sole", name: "Solé", kind: "Sunflower Sprite", pose: "stand", wearColor: "#5E9A3E",
        bio: "Turns toward whatever you are working on.",
        idle: ["sway", "headTilt", "sparkle"], cheer: "spin",
        neck: [60, 74],
        parts: {
          feet: `<ellipse cx="50" cy="109" rx="7.4" ry="4" fill="#4E8A34" ${O}/><ellipse cx="70" cy="109" rx="7.4" ry="4" fill="#4E8A34" ${O}/>`,
          body: `${LG("sunflowers-sole-sunflowers-sole-b", [[0, "#9ED676"], [1, "#5E9A3E"]])}
            <path d="M46 76C42 88 42 100 46 108H74C78 100 78 88 74 76Z" fill="url(#sunflowers-sole-sunflowers-sole-b)" ${O}/>
            <path d="M50 84Q49 94 51 102" fill="none" stroke="#C8EEA8" stroke-width="2.4" stroke-linecap="round"/>`,
          armL: {svg: `<g transform="rotate(-44 46 88)"><path d="M46 86C36 78 24 80 20 88C30 94 40 92 46 90Z" fill="#7ABF56" ${O}/><path d="M44 88Q34 86 25 88" fill="none" stroke="#4E8A34" stroke-width="1.6" stroke-linecap="round"/></g>`, pivot: [46, 88]},
          armR: {svg: `<g transform="rotate(44 74 88)"><path d="M74 86C84 78 96 80 100 88C90 94 80 92 74 90Z" fill="#7ABF56" ${O}/><path d="M76 88Q86 86 95 88" fill="none" stroke="#4E8A34" stroke-width="1.6" stroke-linecap="round"/></g>`, pivot: [74, 88]},
          head: `${LG("sunflowers-sole-sunflowers-sole-p", [[0, "#FFE680"], [1, "#F5A51A"]])}${RG("sunflowers-sole-sunflowers-sole-c", [[0, "#E0A060"], [0.6, "#C07A3A"], [1, "#9A5A28"]], 0.4, 0.35, 0.7)}
            ${sunPetals(60, 44, 14, 38, 7, 18, "url(#sunflowers-sole-sunflowers-sole-p)")}
            <circle cx="60" cy="44" r="22" fill="url(#sunflowers-sole-sunflowers-sole-c)" ${O}/>
            <circle cx="50" cy="32" r="1.4" fill="#E8B070" opacity=".7"/><circle cx="70" cy="34" r="1.2" fill="#E8B070" opacity=".7"/><circle cx="74" cy="52" r="1.3" fill="#E8B070" opacity=".7"/><circle cx="46" cy="54" r="1.2" fill="#E8B070" opacity=".7"/>
            ${shine(50, 34, 4, 2, -35)}`
        },
        eyes: {lx: 51, rx: 69, y: 43, r: 4.6, style: "sparkle", color: "#2A1406"},
        mouth: {x: 60, y: 52, w: 3, color: "#2A1406"},
        cheeks: {lx: 45, rx: 75, y: 50, w: 3.8, h: 2.4, color: "#FF9A8A"},
        anchors: {top: [60, 8, 0.9], neck: [60, 76, 0.75], chest: [60, 94, 0.55], back: [76, 92, 0.6], hands: [60, 94, 0.75]},
        lines: {
          tap: ["Hi! I'm turning toward you, of course!", "You're my favorite kind of sunshine!", "Stand tall and keep reaching up!", "Every task is a little ray of light!", "Look at you blooming today!", "Sip some water! Flowers and students need it!", "Face the sun, then face that next page!"],
          pet: ["Hehe! My petals went all fluttery!", "Aww, I'm glowing even brighter now!"],
          hello: ["You're here! My petals just perked right up!", "Hello, sunshine! I've been facing the door!"],
          morning: ["Good morning! Let's soak up some light!", "Rise and shine! I already did both!"],
          night: ["My petals are folding for the night. Rest too?", "The sun's asleep. Time for you to sleep soon!"],
          focus: ["Facing your work with you. Let's go!", "Bright and steady. You've got this!"],
          done: ["What a sunny session! Amazing!", "Session done! You were absolutely radiant!"],
          task: ["Done! I'm blooming with pride!", "Yay! Another petal for the crown!", "Checked off! Sunshine dance!", "WOO! Bright work, friend!"],
          break: ["Break time! Find a sunny window!", "Stretch up tall, like a sunflower!"]
        }
      },
      {
        id: "sunflowers-chirpy", name: "Chirpy", kind: "Goldfinch", pose: "stand", wearColor: "#E8504A",
        bio: "Sings one note per finished task. Composes slowly.",
        idle: ["wingFlutter", "headTilt", "topBob"], cheer: "wingFlutter",
        neck: [60, 66],
        parts: {
          tail: {svg: `<path d="M38 92L16 100L22 88L14 80L40 84Z" fill="#3A3440" ${O}/><path d="M22 92L34 90" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [40, 88]},
          feet: `<path d="M50 104V111M46 111H54M70 104V111M66 111H74" stroke="#E8A050" stroke-width="3.4" stroke-linecap="round"/>`,
          body: `${RG("sunflowers-chirpy-sunflowers-chirpy-b", [[0, "#FFF2A0"], [0.6, "#FFD83A"], [1, "#F0B020"]], 0.4, 0.35, 0.75)}
            <ellipse cx="60" cy="86" rx="24" ry="21" fill="url(#sunflowers-chirpy-sunflowers-chirpy-b)" ${O}/>
            <ellipse cx="60" cy="92" rx="13" ry="10" fill="#FFF8D8"/>`,
          wingL: {svg: `<path d="M38 76C26 80 24 96 34 104C40 98 44 88 42 78Z" fill="#3A3440" ${O}/><path d="M32 88L40 86M31 95L39 92" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`, pivot: [40, 78]},
          wingR: {svg: `<path d="M82 76C94 80 96 96 86 104C80 98 76 88 78 78Z" fill="#3A3440" ${O}/><path d="M88 88L80 86M89 95L81 92" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`, pivot: [80, 78]},
          head: `${RG("sunflowers-chirpy-sunflowers-chirpy-h", [[0, "#FFF2A0"], [0.6, "#FFD83A"], [1, "#F0B020"]], 0.4, 0.35, 0.75)}
            <circle cx="60" cy="48" r="22" fill="url(#sunflowers-chirpy-sunflowers-chirpy-h)" ${O}/>
            <path d="M44 34Q50 24 62 26Q72 26 76 34Q66 30 60 34Q52 30 44 34Z" fill="#3A3440"/>
            ${shine(48, 40, 4.4, 2.4, -35)}`,
          top: {svg: `<path d="M58 28C56 18 60 12 66 10C66 16 64 22 62 28Z" fill="#3A3440" ${O2}/><path d="M62 28C64 20 70 16 76 18C74 22 70 26 64 29Z" fill="#E8504A" ${O2}/>`, pivot: [61, 29]}
        },
        eyes: {lx: 51, rx: 69, y: 47, r: 4.2, style: "round", color: "#2A1A12"},
        mouths: {
          neutral: `<path d="M55 54L65 54L60 61Z" fill="#F2A040" ${OW(2)}/>`,
          smile: `<path d="M55 54L65 54L60 60Z" fill="#F6B04A" ${OW(2)}/>`,
          open: `<path d="M55 53L65 53L60 57Z" fill="#F2A040" ${OW(2)}/><path d="M56 57L64 57L60 63Z" fill="#F2A040" ${OW(2)}/>`,
          sleepy: `<path d="M56 55L64 55L60 60Z" fill="#E09A3C" ${OW(2)}/>`
        },
        mouth: {x: 60, y: 57, w: 2.6},
        cheeks: {lx: 44, rx: 76, y: 55, w: 3.8, h: 2.4, color: "#FF8F7A"},
        anchors: {top: [60, 26, 0.85], neck: [60, 68, 0.85], chest: [60, 92, 0.55], back: [84, 84, 0.7], hands: [60, 96, 0.75]},
        lines: {
          tap: ["Tweet! That's my hello note!", "I'm composing a song about your hard work!", "La la la! You're doing great!", "One note at a time makes a whole song!", "You've got the rhythm today!", "Peep! Water break? Birds love water!", "Your focus is music to my ears!"],
          pet: ["Chirp chirp! My feathers are fluffing!", "Eee! That's my favorite pat!"],
          hello: ["Tweet tweet! You're back!", "Hello! I warmed up my singing voice!"],
          morning: ["Good morning! Dawn chorus, just for you!", "Morning! The field is full of seeds today!"],
          night: ["Tucking my head under my wing soon. You too?", "Hush now. Lullaby time. Sleep well!"],
          focus: ["Humming softly while you work.", "Perched and focused. Let's go!"],
          done: ["That session gets a whole chorus!", "Done! I just wrote a brand new verse!"],
          task: ["TWEET! New note added!", "Done! Do-re-mi-YAY!", "Checked off! That's a high note!", "One more note! The song is growing!"],
          break: ["Flap those arms! Wing stretch time!", "Break time! Go hear some real birds!"]
        }
      },
      {
        id: "sunflowers-bale", name: "Bale", kind: "Hay Bale Pal", pose: "stand", wearColor: "#C8423A",
        bio: "Soft, square and dependable.",
        idle: ["topBob", "bounce", "waddle"], cheer: "bounce",
        parts: {
          feet: `<rect x="38" y="104" width="14" height="8" rx="4" fill="#B88A3E" ${O}/><rect x="68" y="104" width="14" height="8" rx="4" fill="#B88A3E" ${O}/>`,
          body: `${LG("sunflowers-bale-sunflowers-bale-b", [[0, "#FFE29A"], [0.6, "#F2C66A"], [1, "#D9A040"]])}
            <rect x="22" y="40" width="76" height="66" rx="14" fill="url(#sunflowers-bale-sunflowers-bale-b)" ${O}/>
            <path d="M28 56H92M28 92H92M30 74H40M80 74H90" stroke="#C8902E" stroke-width="2" stroke-linecap="round" opacity=".8"/>
            <path d="M38 40V106M82 40V106" stroke="#C8423A" stroke-width="4"/>
            <path d="M24 44l-6-6M30 40l-2-8M90 40l4-7M96 46l7-4M22 100l-6 4M98 100l6 4" stroke="#E0B050" stroke-width="2.6" stroke-linecap="round"/>
            ${shine(32, 50, 5, 2.4, -20)}`,
          armL: {svg: `<path d="M24 78L12 84L14 76L8 72L22 70Z" fill="#F2C66A" ${O}/>`, pivot: [24, 74]},
          armR: {svg: `<path d="M96 78L108 84L106 76L112 72L98 70Z" fill="#F2C66A" ${O}/>`, pivot: [96, 74]},
          top: {svg: `${LINE("M66 42V30", "#5E9A3E", 2.4)}${sunPetals(66, 24, 10, 12, 3, 5, "#FFC21F")}<circle cx="66" cy="24" r="5.4" fill="#7A4A1E" ${O2}/>`, pivot: [66, 42]}
        },
        eyes: {lx: 50, rx: 70, y: 72, r: 4.8, style: "round", color: "#3A2410"},
        mouth: {x: 60, y: 82, w: 3.2, color: "#3A2410"},
        cheeks: {lx: 43, rx: 77, y: 80, w: 4.2, h: 2.6, color: "#FF8F7A"},
        anchors: {top: [60, 40, 1], neck: [60, 96, 1], chest: [72, 92, 0.6], back: [96, 70, 0.8], hands: [60, 98, 0.85]},
        lines: {
          tap: ["Howdy! Sit on me anytime, I'm comfy!", "Steady wins the harvest, friend!", "You're working like a whole farm crew!", "Square, sturdy and proud of you!", "Hay there! Keep it up!", "Water and a snack, then back to the field?", "Little by little, the barn fills up!"],
          pet: ["Hehe! That's a bit scratchy, but I like it!", "Aww shucks, thank you kindly!"],
          hello: ["Hay hay! You're back!", "Howdy, partner! Ready to get to work?"],
          morning: ["Mornin'! Roosters are up and so are we!", "Good morning! Fresh hay, fresh start!"],
          night: ["Barn lights are on. Time to rest soon!", "Even the cows are asleep. Good night, partner!"],
          focus: ["Steady as a fence post. Let's focus!", "Working right alongside you!"],
          done: ["Harvest is in! What a session!", "Done! You plowed right through that!"],
          task: ["Yee-haw! Another one done!", "Stacked and done! Nice work!", "Checked off! Bounce bounce!", "That's one more bale in the barn!"],
          break: ["Break time! Go stretch your legs in the sun!", "Lean back and rest a spell, partner!"]
        }
      }
    ]
  });

  /* ================= Cloud Kingdom ================= */
  COMP_DATA.push({
    theme: "cloudkingdom",
    companions: [
      {
        id: "cloudkingdom-nimbus", name: "Nimbus", kind: "Cloud Puppy", pose: "sit", wearColor: "#8A6AE0",
        bio: "Fluffy, slightly damp, always happy to see you.",
        idle: ["tailSwish", "earTwitch", "topBob"], cheer: "hop",
        parts: {
          tail: {svg: `<path d="${puff(92, 86, 9, 6, 1.2)}" fill="#F4F6FF" ${O}/>`, pivot: [84, 92]},
          feet: `<ellipse cx="44" cy="108" rx="9" ry="5.6" fill="#EAEEFF" ${O}/><ellipse cx="76" cy="108" rx="9" ry="5.6" fill="#EAEEFF" ${O}/>`,
          body: `${RG("cloudkingdom-nimbus-cloudkingdom-nimbus-b", [[0, "#FFFFFF"], [0.6, "#F2F4FF"], [1, "#D6DCF6"]], 0.42, 0.35, 0.75)}
            <path d="${puff(60, 72, 34, 11, 1.18)}" fill="url(#cloudkingdom-nimbus-cloudkingdom-nimbus-b)" ${O}/>
            <path d="M42 98Q60 104 78 98" fill="none" stroke="#C8D0F0" stroke-width="2.4" stroke-linecap="round"/>
            ${shine(42, 52, 6, 3, -35)}`,
          earL: {svg: `<path d="M32 50C20 50 16 64 22 74C30 72 36 62 36 54Z" fill="#E2E8FF" ${O}/>`, pivot: [34, 52]},
          earR: {svg: `<path d="M88 50C100 50 104 64 98 74C90 72 84 62 84 54Z" fill="#E2E8FF" ${O}/>`, pivot: [86, 52]},
          face: `<ellipse cx="60" cy="78" rx="9" ry="6.4" fill="#FFFFFF" opacity=".9"/><ellipse cx="60" cy="75" rx="3.4" ry="2.4" fill="${INK}"/>`,
          top: {svg: `<path d="M56 38C54 30 60 26 64 30C66 24 74 26 72 34C76 36 74 40 70 40H58C54 40 54 38 56 38Z" fill="#B8C8F8" ${O2}/><path d="M60 44l-1 4M66 44l-1 4" stroke="#7FC4F0" stroke-width="2.2" stroke-linecap="round"/>`, pivot: [64, 40]}
        },
        eyes: {lx: 48, rx: 72, y: 66, r: 5, style: "sparkle", color: "#2A2A4A"},
        mouth: {x: 60, y: 81, w: 2.6, style: "cat", color: "#2A2A4A"},
        cheeks: {lx: 40, rx: 80, y: 76, w: 4.4, h: 2.8, color: "#FF9AC0"},
        anchors: {top: [62, 40, 0.95], neck: [60, 92, 1], chest: [70, 96, 0.6], back: [88, 76, 0.8], hands: [60, 98, 0.8]},
        lines: {
          tap: ["Arf! Fluffy hello from the sky!", "You're doing great! I'm wagging so much it's drizzling!", "Every task floats you a little higher!", "Woof! I believe in you a cloud-ton!", "Stay cozy, stay curious!", "Drink some water! I'm made of it, so I'd know!", "You make every day a little sunnier!"],
          pet: ["Hehe! Pats make me extra fluffy!", "Woof woof! Don't stop, don't stop!"],
          hello: ["You're back! Happy drizzle!", "ARF! I missed you this much!"],
          morning: ["Good morning! Clear skies ahead!", "Morning! Let's chase the sunrise!"],
          night: ["Floating down to my cloud bed. You too?", "Sleepy puppy, sleepy sky. Good night!"],
          focus: ["Sitting like a good pup. Focus time!", "Quiet as a summer cloud. Let's go!"],
          done: ["What a session! Rainbow wags!", "Done! You flew so high today!"],
          task: ["ARF ARF! Another one done!", "Yay! Fluffy happy spin!", "Checked off! Good human!", "Woohoo! Sky-high work!"],
          break: ["Walkies! Stretch those legs!", "Break time! Go look at the sky!"]
        }
      },
      {
        id: "cloudkingdom-zephyr", name: "Zephyr", kind: "Wind Sprite", pose: "float", wearColor: "#5AB8F0",
        bio: "A little swirl of breeze that turns your pages for you.",
        idle: ["spin", "sway", "sparkle"], cheer: "spin",
        parts: {
          tail: {svg: `${LINE("M44 92Q32 104 18 98Q10 94 16 88", "#BFE8FF", 3.4)}${LINE("M76 94Q86 106 100 102", "#D8D0FF", 3)}${LINE("M60 100Q60 108 53 111", "#BFF0E8", 2.6)}`, pivot: [60, 90]},
          body: `${RG("cloudkingdom-zephyr-cloudkingdom-zephyr-b", [[0, "#FFFFFF"], [0.5, "#D4F0FF"], [1, "#94CCF2"]], 0.4, 0.32, 0.75)}
            <path d="M60 28C82 28 94 44 94 62C94 82 80 96 60 96C40 96 26 82 26 62C26 50 32 40 42 34C40 42 44 48 52 46C46 38 50 28 60 28Z" fill="url(#cloudkingdom-zephyr-cloudkingdom-zephyr-b)" ${O}/>
            <path d="M74 84C84 78 86 66 80 58" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/>
            <path d="M40 70Q46 84 62 86" fill="none" stroke="#9AD0F0" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
            ${twinkle(84, 40, 3.4, "#FFE38A")}${twinkle(32, 46, 2.4, "#fff")}`,
          armL: {svg: `<g transform="rotate(-42 29 70)"><path d="M28 68C18 66 12 72 14 78C20 78 26 74 30 72Z" fill="#C8E8FF" ${O}/></g>`, pivot: [29, 70]},
          armR: {svg: `<g transform="rotate(42 91 70)"><path d="M92 68C102 66 108 72 106 78C100 78 94 74 90 72Z" fill="#C8E8FF" ${O}/></g>`, pivot: [91, 70]}
        },
        eyes: {lx: 51, rx: 71, y: 62, r: 4.6, style: "sparkle", color: "#1E2A48"},
        mouth: {x: 61, y: 71, w: 2.8, color: "#1E2A48"},
        cheeks: {lx: 44, rx: 78, y: 69, w: 4, h: 2.4, color: "#FF9AC0"},
        anchors: {top: [62, 30, 0.85], neck: [60, 88, 0.85], chest: [66, 82, 0.55], back: [88, 60, 0.75], hands: [60, 88, 0.75]},
        lines: {
          tap: ["Whoosh! Hello there!", "I'll turn the page, you do the thinking!", "You're breezing through today!", "Fresh air, fresh ideas! Let's go!", "Swirl swirl! You're doing amazing!", "Take a big breath, nice and slow. Ahh!", "Light as a breeze, steady as the wind!"],
          pet: ["Hehe! You made me spin!", "Ooh, that tickles my swirl!"],
          hello: ["Whoosh! You blew in! Hello!", "Hi hi! I've been twirling around waiting!"],
          morning: ["Good morning! A fresh breeze for a fresh start!", "Morning! Open a window, I'll come say hi!"],
          night: ["The wind is settling down. Rest soon?", "Soft breeze, sweet dreams. Good night!"],
          focus: ["Calm winds only. Let's focus!", "Gently turning pages beside you."],
          done: ["What a gust of good work!", "Session done! You swept right through it!"],
          task: ["WHOOSH! Done!", "Blown away! Another one finished!", "Checked off! Twirl of joy!", "Yay! That one flew by!"],
          break: ["Break time! Go feel some fresh air!", "Stretch and sway like a tree in the wind!"]
        }
      },
      {
        id: "cloudkingdom-kitey", name: "Kitey", kind: "Paper Kite", pose: "float", wearColor: "#FF8FA8",
        bio: "Rises higher the longer you stay focused.",
        idle: ["sway", "topBob", "wave"], cheer: "spin",
        parts: {
          back: `<g transform="translate(0 -6)">${LINE("M60 104Q52 108 58 112Q64 116 56 118", "#8A80B8", 1.6)}
            <path d="M52 108L44 104L44 112Z M64 114L72 110L72 118Z" fill="#B9A0F0" ${OW(1.8)}/></g>`,
          body: `<g transform="translate(0 -6)"><path d="M60 18L96 58L60 104L24 58Z" fill="#FF8FA8" ${O}/>
            <path d="M60 18L96 58H60Z" fill="#FFD86B"/><path d="M24 58L60 104V58Z" fill="#8FD8FF"/><path d="M60 58L96 58L60 104Z" fill="#B9F0A8"/>
            <path d="M60 18L96 58L60 104L24 58Z" fill="none" ${O}/><path d="M60 18V104M24 58H96" stroke="${INK}" stroke-width="2"/>
            ${shine(46, 44, 5, 2.4, -50)}</g>`,
          armL: {svg: `<g transform="translate(0 -6)"><ellipse cx="22" cy="66" rx="5" ry="7" transform="rotate(30 22 66)" fill="#FFB8C8" ${O}/></g>`, pivot: [27, 56]},
          armR: {svg: `<g transform="translate(0 -6)"><ellipse cx="98" cy="66" rx="5" ry="7" transform="rotate(-30 98 66)" fill="#FFE08A" ${O}/></g>`, pivot: [93, 56]},
          top: {svg: `<g transform="translate(0 -6)"><path d="M60 18L50 10L50 22Z M60 18L70 10L70 22Z" fill="#E8504A" ${O2}/><circle cx="60" cy="17" r="3" fill="#E8504A" ${O2}/></g>`, pivot: [60, 14]}
        },
        eyes: {lx: 51, rx: 69, y: 52, r: 4.6, style: "round", color: "#2A1A2A"},
        mouth: {x: 60, y: 61, w: 2.8, color: "#2A1A2A"},
        cheeks: {lx: 44, rx: 76, y: 59, w: 3.8, h: 2.4, color: "#FF7A9A"},
        anchors: {top: [60, 10, 0.85], neck: [60, 78, 0.8], chest: [60, 74, 0.55], back: [60, 34, 0.7], hands: [60, 80, 0.75]},
        lines: {
          tap: ["Hi! The wind's just right for studying!", "The longer you focus, the higher I fly!", "Up, up, up! You're doing so well!", "Hold the string steady, I'll do the soaring!", "You've got a tailwind today!", "Water break? Kites like light snacks!", "Look how high we've climbed!"],
          pet: ["Wheee! You made me do a loop!", "Hehe! My tail bows are dancing!"],
          hello: ["You're here! Let's catch a breeze!", "Hello! I've been fluttering for you!"],
          morning: ["Good morning! Perfect flying weather!", "Morning! Let's rise with the sun!"],
          night: ["Coming down to rest. You should too!", "Folding my tail for the night. Sleep well!"],
          focus: ["Climbing higher with every minute!", "Steady wind, steady mind. Let's go!"],
          done: ["We touched the clouds! Amazing session!", "Done! Highest flight yet!"],
          task: ["Wheee! Another one done!", "Up we go! Checked off!", "YAY! Loop-de-loop of joy!", "Soaring! That one's finished!"],
          break: ["Break time! Go look up at the sky!", "Stretch your arms wide like kite wings!"]
        }
      }
    ]
  });

  /* ================= Night Train ================= */
  COMP_DATA.push({
    theme: "nighttrain",
    companions: [
      {
        id: "nighttrain-choo", name: "Choo", kind: "Little Steam Engine", pose: "stand", wearColor: "#D9A848",
        bio: "Puffs a happy whistle at every station.",
        idle: ["topBob", "bounce", "sparkle"], cheer: "bounce",
        parts: {
          feet: `<circle cx="40" cy="104" r="9" fill="#3A3448" ${O}/><circle cx="80" cy="104" r="9" fill="#3A3448" ${O}/><circle cx="40" cy="104" r="3" fill="#D9A848"/><circle cx="80" cy="104" r="3" fill="#D9A848"/><path d="M32 104H88" stroke="#D9A848" stroke-width="3" stroke-linecap="round"/>`,
          body: `${LG("nighttrain-choo-nighttrain-choo-b", [[0, "#F27060"], [0.6, "#D8463E"], [1, "#B0302E"]])}
            <path d="M24 60Q24 46 38 46H82Q96 46 96 60V96H24Z" fill="url(#nighttrain-choo-nighttrain-choo-b)" ${O}/>
            <circle cx="60" cy="70" r="24" fill="#3A3448" ${O}/><circle cx="60" cy="70" r="19" fill="#FFF4DE"/>
            <rect x="18" y="92" width="84" height="9" rx="4" fill="#3A3448" ${O}/>
            <circle cx="30" cy="56" r="4.4" fill="#FFE08A" ${O2}/><circle cx="90" cy="56" r="4.4" fill="#FFE08A" ${O2}/>
            ${shine(34, 52, 5, 2.2, -10)}`,
          armL: {svg: `<ellipse cx="18" cy="76" rx="5" ry="7.4" transform="rotate(25 18 76)" fill="#E8584A" ${O}/>`, pivot: [24, 72]},
          armR: {svg: `<ellipse cx="102" cy="76" rx="5" ry="7.4" transform="rotate(-25 102 76)" fill="#E8584A" ${O}/>`, pivot: [96, 72]},
          top: {svg: `<path d="M40 46V30H54V46Z" fill="#3A3448" ${O}/><rect x="36" y="26" width="22" height="7" rx="2.5" fill="#4A4460" ${O}/>
            <path d="M44 20C38 20 36 14 41 12C41 6 49 4 52 9C56 4 64 8 62 13C67 14 66 20 61 20Z" fill="#F2F0FA" ${O2}/>`, pivot: [47, 46]}
        },
        eyes: {lx: 52, rx: 68, y: 68, r: 4.2, style: "round", color: "#2A1A12"},
        mouth: {x: 60, y: 77, w: 2.8, color: "#2A1A12"},
        cheeks: {lx: 46, rx: 74, y: 75, w: 3.6, h: 2.2, color: "#FF8F9A"},
        anchors: {top: [72, 46, 0.85], neck: [60, 92, 1], chest: [84, 84, 0.55], back: [96, 66, 0.8], hands: [60, 96, 0.8]},
        lines: {
          tap: ["Toot toot! All aboard the study express!", "Chugga chugga, you're doing great!", "Next stop: Finished Homework Station!", "Full steam ahead, friend!", "I think I can, and so can you!", "Coal break? I mean, snack break?", "We're right on schedule today!"],
          pet: ["Toot! That made my whistle squeak!", "Hehe, my wheels are spinning with joy!"],
          hello: ["Toot toot! You made it to the platform!", "Welcome aboard! I saved you a window seat!"],
          morning: ["Good morning! The first train of the day!", "Morning! Steam's up, let's roll!"],
          night: ["Pulling into the station for the night. Rest soon?", "Last stop: Dreamland. Sleep well!"],
          focus: ["Steady on the tracks. Let's focus!", "Chugging quietly beside you."],
          done: ["What a journey! Amazing session!", "Arrived! You powered the whole way!"],
          task: ["TOOT TOOT! Station reached!", "Done! Puff puff hooray!", "Checked off! Right on time!", "Another stop on the line! Woo!"],
          break: ["Station break! Stretch your legs!", "Platform stop! Grab some water!"]
        }
      },
      {
        id: "nighttrain-stub", name: "Stub", kind: "Ticket Stub", pose: "stand", wearColor: "#B8484C",
        bio: "Gets one hole punched for each finished task.",
        idle: ["sway", "wave", "headTilt"], cheer: "spin",
        neck: [60, 76],
        parts: {
          feet: `<ellipse cx="50" cy="110" rx="7" ry="3.6" fill="#B8484C" ${O}/><ellipse cx="70" cy="110" rx="7" ry="3.6" fill="#B8484C" ${O}/>`,
          body: `${LG("nighttrain-stub-nighttrain-stub-b", [[0, "#FFF4D8"], [1, "#F0D8A4"]])}
            <path d="M38 68H82V108H38Z" fill="url(#nighttrain-stub-nighttrain-stub-b)" ${O}/>
            <path d="M46 88H74M46 96H66" stroke="#C8A070" stroke-width="2.4" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="36.4" cy="93" rx="4.6" ry="9.4" transform="rotate(10 36.4 93)" fill="#F6E2B8" ${O}/>`, pivot: [38, 84]},
          armR: {svg: `<ellipse cx="83.6" cy="93" rx="4.6" ry="9.4" transform="rotate(-10 83.6 93)" fill="#F6E2B8" ${O}/>`, pivot: [82, 84]},
          head: `${LG("nighttrain-stub-nighttrain-stub-h", [[0, "#FFF8E4"], [1, "#F4DEB0"]])}
            <path d="M28 22H92V40A6 6 0 0 0 92 52V76H28V52A6 6 0 0 0 28 40Z" fill="url(#nighttrain-stub-nighttrain-stub-h)" ${O}/>
            <path d="M30 76H90" stroke="#C8A070" stroke-width="2" stroke-dasharray="3 3"/>
            <path d="M34 28H86" stroke="#B8484C" stroke-width="4"/><circle cx="80" cy="64" r="4.4" fill="#2E2440" ${OW(1.8)}/>
            ${twinkle(38, 64, 3, "#D9A848")}`
        },
        eyes: {lx: 51, rx: 69, y: 47, r: 4.4, style: "dot", color: "#2E2018"},
        mouth: {x: 60, y: 56, w: 2.8, color: "#2E2018"},
        cheeks: {lx: 44, rx: 76, y: 54, w: 3.8, h: 2.4, color: "#FF8F9A"},
        anchors: {top: [60, 22, 0.9], neck: [60, 78, 0.85], chest: [60, 92, 0.55], back: [80, 90, 0.6], hands: [60, 96, 0.75]},
        lines: {
          tap: ["Ticket, please! Oh wait, I'm the ticket!", "Every task gets a punch! Click!", "You've got a first class ticket to success!", "Valid for one amazing study session!", "Keep me safe, I'm your pass to greatness!", "Water break? It's included in the fare!", "Destination: You, but even smarter!"],
          pet: ["Hehe! Careful, don't crease me!", "Aww! I feel like a golden ticket now!"],
          hello: ["Welcome aboard! Ticket's ready!", "Hello! I've been waiting at the gate!"],
          morning: ["Good morning! Today's ticket is fresh!", "Morning! First stop, a great day!"],
          night: ["Ticket's stamped for today. Rest soon!", "Overnight route to dreams. Good night!"],
          focus: ["Punched in and ready. Let's focus!", "Quiet carriage rules! Focusing with you."],
          done: ["What a ride! Fully punched!", "Session complete! Ticket of honor!"],
          task: ["CLICK! Another hole punched!", "Done! That's one more stamp!", "Checked off! Punch punch hooray!", "Woo! Ticket's looking great!"],
          break: ["Rest stop! Stretch and wiggle!", "Break time! Back aboard in five!"]
        }
      },
      {
        id: "nighttrain-satchel", name: "Satchel", kind: "Travel Suitcase", pose: "stand", wearColor: "#7FB8D8",
        bio: "Covered in stickers from everywhere you have studied.",
        idle: ["topBob", "waddle", "wave"], cheer: "hop",
        parts: {
          feet: `<circle cx="38" cy="108" r="5" fill="#3A3448" ${O}/><circle cx="82" cy="108" r="5" fill="#3A3448" ${O}/>`,
          body: `${LG("nighttrain-satchel-nighttrain-satchel-b", [[0, "#D89A62"], [0.6, "#B87A44"], [1, "#94603A"]])}
            <rect x="20" y="40" width="80" height="64" rx="12" fill="url(#nighttrain-satchel-nighttrain-satchel-b)" ${O}/>
            <path d="M36 40V104M84 40V104" stroke="#6A4428" stroke-width="4"/>
            <circle cx="48" cy="92" r="6" fill="#8FD8FF" ${OW(1.8)}/><path d="M45 92h6M48 89v6" stroke="#fff" stroke-width="1.6"/>
            <rect x="62" y="86" width="14" height="10" rx="2" fill="#FFD86B" ${OW(1.8)} transform="rotate(12 69 91)"/>
            <path d="M24 98l7-6l3 8z" fill="#FF8FA8" ${OW(1.6)}/>
            ${twinkle(90, 94, 3.2, "#fff")}${shine(30, 50, 5, 2.4, -20)}`,
          armL: {svg: `<ellipse cx="16" cy="74" rx="5" ry="7.4" transform="rotate(25 16 74)" fill="#C8884E" ${O}/>`, pivot: [22, 70]},
          armR: {svg: `<ellipse cx="104" cy="74" rx="5" ry="7.4" transform="rotate(-25 104 74)" fill="#C8884E" ${O}/>`, pivot: [98, 70]},
          top: {svg: `<path d="M46 42V32Q46 26 52 26H68Q74 26 74 32V42" fill="none" stroke="${INK}" stroke-width="8.4" stroke-linecap="round"/><path d="M46 42V32Q46 26 52 26H68Q74 26 74 32V42" fill="none" stroke="#6A4428" stroke-width="4" stroke-linecap="round"/>`, pivot: [60, 42]}
        },
        eyes: {lx: 50, rx: 70, y: 64, r: 4.8, style: "round", color: "#2A1A10"},
        mouth: {x: 60, y: 74, w: 3, color: "#2A1A10"},
        cheeks: {lx: 43, rx: 77, y: 72, w: 4, h: 2.6, color: "#FF8F9A"},
        anchors: {top: [60, 40, 0.95], neck: [60, 98, 1], chest: [60, 84, 0.55], back: [96, 66, 0.8], hands: [60, 98, 0.85]},
        lines: {
          tap: ["Hi! I packed snacks AND study notes!", "Every place you study gets a sticker on me!", "Ready for the next adventure, friend?", "You're well-traveled in knowledge!", "Pack light, think big!", "Snack check! I've got crackers in here!", "Look at all my stickers! All from your hard work!"],
          pet: ["Hehe! My latches are rattling!", "Aww, I'm all packed with happiness!"],
          hello: ["You're back! Where are we studying today?", "Hello! I'm packed and ready!"],
          morning: ["Good morning! New day, new destination!", "Morning! Let's pack the day full of wins!"],
          night: ["Unpacking for the night. Rest soon?", "Zipped up and sleepy. Good night!"],
          focus: ["All packed. Let's focus!", "Quietly guarding your notes."],
          done: ["What a trip! Amazing session!", "Done! That one earns a new sticker!"],
          task: ["New sticker unlocked! Done!", "Checked off! Into the case it goes!", "Yay! Another souvenir!", "WOO! Packed and done!"],
          break: ["Break time! Stretch your travel legs!", "Rest stop! Have a little snack!"]
        }
      }
    ]
  });

  /* ================= Ramen Shop ================= */
  COMP_DATA.push({
    theme: "ramen",
    companions: [
      {
        id: "ramen-yolky", name: "Yolky", kind: "Soft-Boiled Egg", pose: "stand", wearColor: "#7ACB5A",
        bio: "Jammy in the middle and proud of it.",
        idle: ["topBob", "bounce", "sparkle"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="48" cy="110" rx="7.4" ry="3.8" fill="#F2E6D4" ${O}/><ellipse cx="72" cy="110" rx="7.4" ry="3.8" fill="#F2E6D4" ${O}/>`,
          body: `${LG("ramen-yolky-ramen-yolky-w", [[0, "#FFFFFF"], [0.7, "#FBF4EA"], [1, "#EADCC8"]], 0, 0, 1, 1)}${RG("ramen-yolky-ramen-yolky-y", [[0, "#FFD27A"], [0.6, "#F8A02A"], [1, "#E07A10"]], 0.42, 0.38, 0.7)}
            <path d="M60 26C82 26 96 50 96 74C96 96 80 108 60 108C40 108 24 96 24 74C24 50 38 26 60 26Z" fill="url(#ramen-yolky-ramen-yolky-w)" ${O}/>
            <circle cx="60" cy="76" r="22" fill="url(#ramen-yolky-ramen-yolky-y)" ${OW(2.4)}/>
            <path d="M44 68Q46 60 54 57" fill="none" stroke="#FFE8B0" stroke-width="2.6" stroke-linecap="round"/>
            ${shine(38, 44, 6, 3, -40)}`,
          armL: {svg: `<ellipse cx="22" cy="80" rx="5" ry="7.4" transform="rotate(25 22 80)" fill="#FBF4EA" ${O}/>`, pivot: [27, 76]},
          armR: {svg: `<ellipse cx="98" cy="80" rx="5" ry="7.4" transform="rotate(-25 98 80)" fill="#FBF4EA" ${O}/>`, pivot: [93, 76]},
          top: {svg: `<path d="M58 28C54 20 56 12 62 8C64 14 62 22 60 28Z" fill="#7ACB5A" ${O2}/><path d="M61 28C64 22 70 20 74 22C72 26 66 28 62 29Z" fill="#9ADB6A" ${O2}/>`, pivot: [60, 29]}
        },
        eyes: {lx: 51, rx: 69, y: 74, r: 4.4, style: "round", color: "#4A2406"},
        mouth: {x: 60, y: 83, w: 2.8, color: "#4A2406"},
        cheeks: {lx: 44, rx: 76, y: 81, w: 3.8, h: 2.4, color: "#FF7A6A"},
        anchors: {top: [60, 28, 0.9], neck: [60, 98, 0.9], chest: [76, 96, 0.55], back: [92, 70, 0.75], hands: [60, 100, 0.8]},
        lines: {
          tap: ["Hi! Perfectly jammy and ready to help!", "Soft on the outside, strong in the middle. Like you!", "Six and a half minutes of focus? Perfect!", "You're cooking up something great today!", "Egg-cellent progress, friend!", "Sip some water! Even broth needs a break!", "Golden center, golden effort!"],
          pet: ["Hehe! Careful, I'm a little wobbly!", "Aww, my yolk is all warm now!"],
          hello: ["You're back! Freshly boiled for you!", "Hello! Ready to get cracking?"],
          morning: ["Good morning! Breakfast egg reporting for duty!", "Morning! Sunny side up, like your day!"],
          night: ["Simmering down for the night. Rest soon?", "Cozy shell, cozy dreams. Good night!"],
          focus: ["Steady simmer. Let's focus!", "Sitting perfectly still, like a good egg."],
          done: ["Egg-straordinary session!", "Done! Cooked to perfection!"],
          task: ["Done! Egg-cellent!", "Checked off! Jammy joy!", "Woo! Another one, sunny side up!", "Cracked it! Great job!"],
          break: ["Break time! Stretch and cool off!", "Rest for a bit. Good things take time!"]
        }
      },
      {
        id: "ramen-naru", name: "Naru", kind: "Fishcake Swirl", pose: "stand", wearColor: "#F27AA0",
        bio: "Spins when it is happy, which is often.",
        idle: ["spin", "topBob", "sway"], cheer: "spin",
        parts: {
          feet: `<ellipse cx="50" cy="110" rx="7" ry="3.6" fill="#F6E8EC" ${O}/><ellipse cx="70" cy="110" rx="7" ry="3.6" fill="#F6E8EC" ${O}/>`,
          body: `${RG("ramen-naru-ramen-naru-b", [[0, "#FFFFFF"], [0.7, "#FBF4F6"], [1, "#EADCE2"]], 0.42, 0.35, 0.75)}
            <path d="${Array.from({length: 24}, (_, i) => { const a = -Math.PI / 2 + i / 24 * Math.PI * 2, r = i % 2 ? 36 : 39.5; return (i ? "L" : "M") + (60 + Math.cos(a) * r).toFixed(1) + " " + (70 + Math.sin(a) * r).toFixed(1); }).join("")}Z" fill="url(#ramen-naru-ramen-naru-b)" ${O}/>
            <path d="${Array.from({length: 31}, (_, k) => { const a = k / 30 * 10.5 + 2.4, r = 3 + k / 30 * 24; return (k ? "L" : "M") + (60 + Math.cos(a) * r).toFixed(1) + " " + (70 + Math.sin(a) * r * 0.95).toFixed(1); }).join("")}" fill="none" stroke="#F7A8C2" stroke-width="5" stroke-linecap="round" opacity=".75"/>
            ${shine(40, 50, 6, 3, -40)}`,
          armL: {svg: `<ellipse cx="20" cy="78" rx="5" ry="7.4" transform="rotate(25 20 78)" fill="#FBF0F4" ${O}/>`, pivot: [25, 74]},
          armR: {svg: `<ellipse cx="100" cy="78" rx="5" ry="7.4" transform="rotate(-25 100 78)" fill="#FBF0F4" ${O}/>`, pivot: [95, 74]},
          top: {svg: `${LINE("M60 32V24", "#5AA84A", 2.2)}<path d="M60 24C56 16 58 10 64 8C66 14 64 20 60 24Z" fill="#7ACB5A" ${O2}/>`, pivot: [60, 32]}
        },
        eyes: {lx: 50, rx: 70, y: 68, r: 4.6, style: "sparkle", color: "#3A1A2A"},
        mouth: {x: 60, y: 77, w: 2.8, color: "#3A1A2A"},
        cheeks: {lx: 43, rx: 77, y: 75, w: 4, h: 2.6, color: "#FF7AA0"},
        anchors: {top: [60, 32, 0.9], neck: [60, 100, 0.85], chest: [74, 92, 0.55], back: [94, 66, 0.75], hands: [60, 100, 0.8]},
        lines: {
          tap: ["Hi hi! *happy spin* Wheee!", "You're on a roll! A swirly one!", "Round and round, task by task!", "I'm the cutest topping and you're the best student!", "Spin spin! You've got this!", "Snack break? I'm not a snack, just a friend!", "Your focus is making me dizzy with joy!"],
          pet: ["Wheee! You made me spin again!", "Hehe! My swirl is blushing pink!"],
          hello: ["You're back! Welcome spin!", "Hello! Fresh from the bowl and ready!"],
          morning: ["Good morning! Let's swirl into the day!", "Morning! A fresh bowl, a fresh start!"],
          night: ["Slowing my spin for the night. Rest soon?", "Swirly dreams! Good night!"],
          focus: ["Holding perfectly still. Mostly. Let's focus!", "Quiet swirl mode on."],
          done: ["What a session! Mega spin!", "Done! My swirl is spinning with pride!"],
          task: ["SPIN! Another one done!", "Wheee! Checked off!", "Yay! Swirls of joy!", "Done and twirled!"],
          break: ["Break time! Do a little spin yourself!", "Stretch, swirl, and sip some water!"]
        }
      },
      {
        id: "ramen-nori", name: "Nori", kind: "Seaweed Sheet", pose: "stand", wearColor: "#F2C870",
        bio: "Stands up straight in the bowl like a little flag.",
        idle: ["sway", "wave", "bounce"], cheer: "bounce",
        neck: [60, 82],
        parts: {
          feet: `${LG("ramen-nori-ramen-nori-br", [[0, "#F6D888"], [1, "#E8B860"]])}<path d="M20 100Q60 92 100 100Q100 112 60 114Q20 112 20 100Z" fill="url(#ramen-nori-ramen-nori-br)" ${O}/>
            <path d="M30 102Q40 98 48 103Q56 98 64 103Q72 98 82 102" fill="none" stroke="#FFEFB0" stroke-width="2.2" stroke-linecap="round"/>`,
          body: `${LG("ramen-nori-ramen-nori-h", [[0, "#4E7E5A"], [0.6, "#3A6446"], [1, "#2A4A34"]], 0, 0, 1, 1)}
            <path d="M34 20H86L83 104H37Z" fill="url(#ramen-nori-ramen-nori-h)" ${O}/>
            <path d="M42 30L48 34M70 28L76 32M44 72L50 70M72 74L78 70M58 24L62 27" stroke="#6A9A72" stroke-width="2" stroke-linecap="round" opacity=".8"/>
            <path d="M40 26V96" stroke="#7AAA82" stroke-width="2.6" stroke-linecap="round" opacity=".6"/>
            ${twinkle(80, 30, 2.6, "#C8F0D0")}
            <path d="M44 92L50 90M70 94L76 91" stroke="#6A9A72" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>`,
          armL: {svg: `<ellipse cx="33.6" cy="94" rx="4.4" ry="8.6" transform="rotate(25 33.6 94)" fill="#3A6446" ${O}/>`, pivot: [37, 87]},
          armR: {svg: `<ellipse cx="86.4" cy="94" rx="4.4" ry="8.6" transform="rotate(-25 86.4 94)" fill="#3A6446" ${O}/>`, pivot: [83, 87]}
        },
        eyes: {lx: 51, rx: 69, y: 50, r: 4.6, style: "sparkle", color: "#0E1A12"},
        mouth: {x: 60, y: 60, w: 2.8, color: "#0E1A12"},
        cheeks: {lx: 44, rx: 76, y: 57, w: 3.8, h: 2.4, color: "#FF8FA8"},
        anchors: {top: [60, 20, 0.9], neck: [60, 82, 0.8], chest: [60, 94, 0.55], back: [80, 60, 0.7], hands: [60, 96, 0.75]},
        lines: {
          tap: ["Hi! Standing tall in the bowl for you!", "Crisp, salty and cheering you on!", "Stand up straight, you're doing great!", "I'm your little flag of focus!", "Wave hello! You've got this!", "Water break! I'm already soaking, ha!", "Every bowl needs a nori. Every study day needs you!"],
          pet: ["Hehe! Careful, I might get soggy!", "Aww! I feel extra crispy now!"],
          hello: ["You're back! Flag up, hello!", "Hello! Standing tall and ready!"],
          morning: ["Good morning! Fresh and crisp today!", "Morning! Let's raise the flag on a good day!"],
          night: ["Leaning back for the night. Rest soon?", "Soft and sleepy. Good night, friend!"],
          focus: ["Standing still and steady. Let's focus!", "Flag at full height! Focus time!"],
          done: ["What a session! Flags waving everywhere!", "Done! You stood tall the whole time!"],
          task: ["Done! Wave wave!", "Checked off! Flag up!", "Woo! Another one finished!", "YES! Crisp and complete!"],
          break: ["Break time! Lean back and relax!", "Stretch tall, then flop like a noodle!"]
        }
      }
    ]
  });
})();
