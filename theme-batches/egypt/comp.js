/* Study Companions, Around the World: Egypt (Kheper the scarab, Jamal the camel calf, Miu the Mau kitten) */
(() => {
  const {O, OW, LG, RG, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const f1 = v => Math.round(v * 10) / 10;
  const ring = (cx, cy, n, r, fn) => Array.from({length: n}, (_, i) => { const a = i / n * Math.PI * 2; return fn(f1(cx + Math.cos(a) * r), f1(cy + Math.sin(a) * r), a * 180 / Math.PI, i); }).join("");
  // a broad bead collar along an arc under the chin: alternating gold and lapis beads
  const collar = (cx, cy, rx, ry, n, r) => Array.from({length: n}, (_, i) => { const a = Math.PI * (0.15 + 0.7 * i / (n - 1)), x = f1(cx + Math.cos(a) * rx), y = f1(cy + Math.sin(a) * ry); return `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 2 ? "#2E5FA8" : "#F2C24A"}" ${OW(1.2)}/>`; }).join("");

  COMP_DATA.push({
    theme: "egypt",
    companions: [
      {
        id: "egypt-kheper", name: "Kheper", kind: "Scarab Beetle", pose: "stand", wearColor: "#2A8A84",
        bio: "A steady scarab beetle who rolls every big task forward, one push at a time.",
        idle: ["topBob", "sparkle", "bounce"], cheer: "spin",
        parts: {
          feet: `<path d="M44 100Q40 106 38 111H50Q49 106 50 101Z" fill="#1F5C6A" ${O}/><path d="M76 100Q80 106 82 111H70Q71 106 70 101Z" fill="#1F5C6A" ${O}/>`,
          armL: {svg: `<path d="M34 64Q22 60 17 70Q16 76 21 77Q24 70 35 71Z" fill="#2A6F82" ${O}/><path d="M17 72L13 74M19 76L15 80" stroke="#1F5C6A" stroke-width="2.4" stroke-linecap="round"/>`, pivot: [35, 67]},
          armR: {svg: `<path d="M86 64Q98 60 103 70Q104 76 99 77Q96 70 85 71Z" fill="#2A6F82" ${O}/><path d="M103 72L107 74M101 76L105 80" stroke="#1F5C6A" stroke-width="2.4" stroke-linecap="round"/>`, pivot: [85, 67]},
          body: `${LG("egypt-kheper-s", [[0, "#7FE0D2"], [0.45, "#3AAFB2"], [1, "#2A5F9E"]])}${LG("egypt-kheper-w", [[0, "#3FB4B0"], [1, "#24508C"]])}
            <path d="M30 84Q20 86 18 94M90 84Q100 86 102 94" fill="none" stroke="#1F5C6A" stroke-width="4" stroke-linecap="round"/>
            ${LINE("M47 36Q42 26 36 22", "#2A6F82", 2)}${LINE("M73 36Q78 26 84 22", "#2A6F82", 2)}<circle cx="35" cy="21" r="3.6" fill="#2A6F82" ${OW(1.6)}/><circle cx="85" cy="21" r="3.6" fill="#2A6F82" ${OW(1.6)}/>
            <path d="M60 34C81 34 92 48 92 68C92 94 79 108 60 108C41 108 28 94 28 68C28 48 39 34 60 34Z" fill="url(#egypt-kheper-s)" ${O}/>
            <path d="M31 74Q60 84 89 74C90 92 79 106 60 106C41 106 30 92 31 74Z" fill="url(#egypt-kheper-w)"/>
            <path d="M30 74Q60 84 90 74M60 79V106" fill="none" stroke="#F2C24A" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M40 88Q44 96 52 100M80 88Q76 96 68 100" fill="none" stroke="#9EF0E2" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>
            <path d="M43 40L46 32L50 38L55 30L60 36L65 30L70 38L74 32L77 40Q60 35 43 40Z" fill="#F2C24A" ${OW(1.8)}/>
            <path d="M38 52Q40 44 48 41" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/><circle cx="36" cy="58" r="1.6" fill="#fff" opacity=".8"/>`,
          top: {svg: `${RG("egypt-kheper-sun", [[0, "#FFF6C8"], [0.6, "#FFD25A"], [1, "#F29A1C"]], 0.4, 0.35, 0.65)}
            ${ring(60, 18, 10, 12.5, (x, y, a) => `<path d="M${x} ${y}l${f1(Math.cos(a * Math.PI / 180) * 3)} ${f1(Math.sin(a * Math.PI / 180) * 3)}" stroke="#F6B42A" stroke-width="2.2" stroke-linecap="round"/>`)}
            <circle cx="60" cy="18" r="9.5" fill="url(#egypt-kheper-sun)" ${O2}/><path d="M55 14Q57 11 61 11" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`, pivot: [60, 32]}
        },
        eyes: {lx: 48, rx: 72, y: 56, r: 5, style: "sparkle", color: "#10282C"},
        mouth: {x: 60, y: 66, w: 3, color: "#10282C"},
        cheeks: {lx: 40, rx: 80, y: 63, w: 4, h: 2.4, color: "#FF9AA8"},
        anchors: {top: [60, 34, 0.9], neck: [60, 76, 1], chest: [72, 90, 0.6], back: [88, 60, 0.8], hands: [60, 94, 0.82]},
        lines: {
          tap: ["Push, push! Every big task rolls if you keep at it.", "Little legs, big progress! Let's roll on.", "I carry the sunrise on my head for luck!", "One small push now saves a big push later.", "Shiny shell, shiny ideas! You've got this.", "We roll forward together, one bit at a time.", "Even the pyramids were built one block at a time!", "That idea of yours? Pure gold!"],
          pet: ["Hehe! My shell is all sparkly now!", "Aww, a gentle pat for a hard worker!"],
          hello: ["You're back! Let's get rolling!", "Hello! The sun came up just for you!"],
          morning: ["Good morning! Time to push the sun up!", "Rise and roll! A golden day awaits."],
          night: ["The sun rolled away. Rest soon?", "Goodnight! I'll keep the sun warm for tomorrow."],
          focus: ["Pushing quietly right beside you.", "Steady pushes, steady progress. Go!"],
          done: ["Rolled all the way! What a session!", "Done! That's a whole pyramid of effort!"],
          task: ["Rolled it! Next!", "Checked off! Shiny!", "One more block in place!", "Yes! Golden push!"],
          break: ["Shell break! Stretch all six legs!", "Sunbathe for a minute. You earned it!"]
        }
      },
      {
        id: "egypt-jamal", name: "Jamal", kind: "Camel Calf", pose: "stand", wearColor: "#C8503A",
        bio: "A long-lashed camel calf with stamina for the longest study sessions.",
        idle: ["earTwitch", "tailSwish", "headTilt"], cheer: "hop",
        neck: [60, 74],
        parts: {
          tail: {svg: `${LINE("M90 82Q100 86 101 96", "#D8A46C", 2.6)}<path d="M101 94Q106 100 101 106Q96 101 101 94Z" fill="#8A5A36" ${OW(1.8)}/>`, pivot: [90, 82]},
          feet: `<path d="M40 90V108M80 90V108" stroke="#C48C58" stroke-width="7" stroke-linecap="round"/>
            <path d="M48 92Q47 102 48 107M72 92Q73 102 72 107" fill="none" stroke="#2B2233" stroke-width="11" stroke-linecap="round"/><path d="M48 92Q47 102 48 107M72 92Q73 102 72 107" fill="none" stroke="#E6BC86" stroke-width="7" stroke-linecap="round"/>
            <ellipse cx="48" cy="109" rx="6.4" ry="3.6" fill="#7A5236" ${OW(2.2)}/><ellipse cx="72" cy="109" rx="6.4" ry="3.6" fill="#7A5236" ${OW(2.2)}/>
            <ellipse cx="40" cy="108.6" rx="5" ry="3" fill="#6A4630" ${OW(2)}/><ellipse cx="80" cy="108.6" rx="5" ry="3" fill="#6A4630" ${OW(2)}/>`,
          body: `${RG("egypt-jamal-b", [[0, "#F6D6A4"], [0.7, "#E6B57C"], [1, "#CC9460"]], 0.4, 0.3, 0.8)}
            <path d="M66 70C68 52 88 50 92 70Z" fill="url(#egypt-jamal-b)" ${O}/>
            <path d="M60 66C82 66 95 74 95 86C95 97 83 100 60 100C37 100 25 97 25 86C25 74 38 66 60 66Z" fill="url(#egypt-jamal-b)" ${O}/>
            <path d="M64 64C72 60 86 60 92 68L94 82Q78 86 62 80Z" fill="#C8503A" ${OW(2.2)}/><path d="M64 70Q78 74 93 72M63 76Q78 80 94 77" fill="none" stroke="#F2C24A" stroke-width="2" stroke-linecap="round"/>
            <path d="M66 81L65 87M72 82.6L71.4 88.6M78 83L78 89M84 82.6L84.6 88.6M90 81.4L91.4 87" stroke="#2E5FA8" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M34 78Q40 72 50 71" fill="none" stroke="#FFF2D8" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>`,
          earL: {svg: `<ellipse cx="35" cy="40" rx="5" ry="8" transform="rotate(-40 35 40)" fill="#E2AE76" ${O}/><ellipse cx="35.6" cy="40.6" rx="2.2" ry="4.6" transform="rotate(-40 35.6 40.6)" fill="#B87A52"/>`, pivot: [40, 44]},
          earR: {svg: `<ellipse cx="85" cy="40" rx="5" ry="8" transform="rotate(40 85 40)" fill="#E2AE76" ${O}/><ellipse cx="84.4" cy="40.6" rx="2.2" ry="4.6" transform="rotate(40 84.4 40.6)" fill="#B87A52"/>`, pivot: [80, 44]},
          head: `${RG("egypt-jamal-h", [[0, "#FBE2B8"], [0.7, "#EDC28C"], [1, "#D8A46C"]], 0.42, 0.3, 0.8)}
            <path d="M60 28C76 28 84 38 84 50C84 58 81 64 78 68C76 74 70 78 60 78C50 78 44 74 42 68C39 64 36 58 36 50C36 38 44 28 60 28Z" fill="url(#egypt-jamal-h)" ${O}/>
            <ellipse cx="60" cy="68" rx="15" ry="9.6" fill="#F8DDB4" ${OW(2.2)}/>
            <path d="M48 31C49 22 56 24 58 28C60 21 68 22 68 29C73 27 76 32 72 35Q60 30 48 35C44 33 45 29 48 31Z" fill="#B8804E" ${OW(2)}/>
            <path d="M41 42Q44 37 50 35" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>
            <path d="M44.6 44.6L43 41.6M47.6 43.6L47 40.4M50.8 43.4L51.2 40.2M75.4 44.6L77 41.6M72.4 43.6L73 40.4M69.2 43.4L68.8 40.2" stroke="#2B2233" stroke-width="1.6" stroke-linecap="round"/>`,
          face: `<path d="M54 66Q55 64 57 65M66 66Q65 64 63 65" fill="none" stroke="#7A5236" stroke-width="1.8" stroke-linecap="round"/>`
        },
        eyes: {lx: 49, rx: 71, y: 50, r: 4.8, style: "round", color: "#2A1C14"},
        mouth: {x: 60, y: 71, w: 3, color: "#2A1C14"},
        cheeks: {lx: 42, rx: 78, y: 58, w: 3.8, h: 2.2, color: "#FF9A8A"},
        anchors: {top: [60, 30, 0.9], neck: [60, 77, 1], chest: [52, 88, 0.6], back: [80, 70, 0.8], hands: [60, 92, 0.8]},
        lines: {
          tap: ["Long legs, long lashes, long study sessions!", "Slow and steady crosses any desert.", "I store snacks in my hump. Kidding! Mostly.", "One step, then another. That's the caravan way.", "The oasis is just past this chapter!", "Hehe, you're doing so well! Keep plodding!", "I never get thirsty for knowledge. Never!", "Every dune looks smaller once you're on top."],
          pet: ["Hehe! My lashes are fluttering!", "Aww, scratch right behind the ear, please!"],
          hello: ["You're back! The caravan can start!", "Hello! I saved you a spot in the shade."],
          morning: ["Good morning! Cool sand, fresh start!", "Rise and plod! Let's go before the heat."],
          night: ["The stars are out. Time to rest soon?", "Goodnight! I'll dream of a big green oasis."],
          focus: ["Plodding quietly beside you.", "Steady steps. We'll get there together."],
          done: ["What a long walk! So proud of us!", "All done! Oasis time, you earned it!"],
          task: ["Done! Plod plod!", "Checked off! One dune down!", "Another step forward!", "Yes! The caravan moves on!"],
          break: ["Water break! Have a big sip!", "Rest in the shade for a minute!"]
        }
      },
      {
        id: "egypt-miu", name: "Miu", kind: "Mau Kitten", pose: "sit", wearColor: "#2E5FA8",
        bio: "A spotted Mau kitten with ancient manners and a curious mind.",
        idle: ["tailSwish", "earTwitch", "headTilt"], cheer: "bounce",
        neck: [60, 76],
        parts: {
          tail: {svg: `${LINE("M84 102Q100 100 102 86Q103 76 96 72", "#CFC4B2", 5)}<path d="M101 82l-4 -.4M100 77l-4 .6" stroke="#5E5248" stroke-width="2" stroke-linecap="round"/><circle cx="96" cy="72" r="3.2" fill="#3E342E" ${OW(1.6)}/>`, pivot: [84, 100]},
          feet: `<ellipse cx="49" cy="108" rx="7.6" ry="4.6" fill="#F2ECE2" ${O}/><ellipse cx="71" cy="108" rx="7.6" ry="4.6" fill="#F2ECE2" ${O}/><path d="M47 106.6v2.4M51 106.6v2.4M69 106.6v2.4M73 106.6v2.4" stroke="#B8AC9C" stroke-width="1.2" stroke-linecap="round"/>`,
          body: `${LG("egypt-miu-b", [[0, "#F0EBE2"], [1, "#CABFAE"]])}
            <path d="M60 66C78 66 86 82 86 96C86 106 76 110.5 60 110.5C44 110.5 34 106 34 96C34 82 42 66 60 66Z" fill="url(#egypt-miu-b)" ${O}/>
            <path d="M60 76C68 76 72 88 70 104H50C48 88 52 76 60 76Z" fill="#FAF7F2"/>
            ${[[40, 84, 3, 2.2], [44, 94, 3.4, 2.4], [38, 100, 2.4, 1.8], [80, 84, 3, 2.2], [76, 94, 3.4, 2.4], [82, 100, 2.4, 1.8], [46, 76, 2.2, 1.6], [74, 76, 2.2, 1.6]].map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#6E6052"/>`).join("")}
            <path d="M42 76Q60 90 78 76" fill="none" stroke="#2E5FA8" stroke-width="5" stroke-linecap="round"/>${collar(60, 72, 19, 13, 9, 2.3)}
            <path d="M58 86L60 90L62 86Z" fill="#F2C24A" ${OW(1.2)}/>`,
          earL: {svg: `<path d="M36 46L31 16L55 34Z" fill="#DCD3C4" ${O}/><path d="M38 40L35.4 22L49 33Z" fill="#F8C0C8"/>`, pivot: [44, 40]},
          earR: {svg: `<path d="M84 46L89 16L65 34Z" fill="#DCD3C4" ${O}/><path d="M82 40L84.6 22L71 33Z" fill="#F8C0C8"/>`, pivot: [76, 40]},
          head: `${RG("egypt-miu-h", [[0, "#FBF8F3"], [0.7, "#E8E1D5"], [1, "#CFC5B4"]], 0.42, 0.32, 0.8)}
            <path d="M60 30C80 30 90 42 90 56C90 70 78 79 60 79C42 79 30 70 30 56C30 42 40 30 60 30Z" fill="url(#egypt-miu-h)" ${O}/>
            <path d="M52 42L54 34L57 40L60 33L63 40L66 34L68 42" fill="none" stroke="#6E6052" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M31 54Q36 54 40 56M31 60Q36 59 40 60M89 54Q84 54 80 56M89 60Q84 59 80 60" fill="none" stroke="#7E7064" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M42 46Q46 44 49 45M78 46Q74 44 71 45" fill="none" stroke="#7E7064" stroke-width="1.6" stroke-linecap="round"/>
            <ellipse cx="60" cy="66" rx="9" ry="6" fill="#FFFFFF" opacity=".75"/>
            <path d="M37 44Q40 37 47 34" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".85"/>`,
          face: `<path d="M57 61.6H63L60 64.6Z" fill="#F29AAA" ${OW(1.2)}/><path d="M48 66H38M48 68.6L39 71M72 66H82M72 68.6L81 71" stroke="#8A7E72" stroke-width="1" stroke-linecap="round" opacity=".8"/>`
        },
        eyes: {lx: 48.5, rx: 71.5, y: 54, r: 5.4, style: "round", color: "#2E6A2E"},
        mouth: {x: 60, y: 67, w: 3, color: "#3A2E28", style: "cat"},
        cheeks: {lx: 41, rx: 79, y: 62, w: 3.8, h: 2.2, color: "#FFA6B4"},
        anchors: {top: [60, 30, 0.95], neck: [60, 76, 1], chest: [70, 92, 0.6], back: [84, 84, 0.8], hands: [60, 100, 0.84]},
        lines: {
          tap: ["Mrrp! Hello, honored student!", "My ancestors napped in palaces. I nap on notes.", "Curious about everything? Me too!", "Spots, whiskers and big ideas. That's us!", "A proper cat studies with great dignity.", "Purr... you're doing beautifully.", "Is that a new chapter? Let me sit on it.", "Golden collar, golden effort!"],
          pet: ["Purrrr... how gentle. Thank you!", "Mrrp! A royal scratch, how kind!"],
          hello: ["Mrrp! You're back! I kept your seat warm.", "Hello! I've been waiting very politely."],
          morning: ["Good morning! The sunbeam is ready for us.", "Rise and shine! Breakfast, then books?"],
          night: ["The moon is up. Curl up and rest soon?", "Goodnight! I'll guard your notes till morning."],
          focus: ["Sitting very still, very regal, very close.", "Quiet paws. Let's focus together."],
          done: ["Purrfect session! I'm so proud!", "All done! Time for a well-earned nap!"],
          task: ["Pounced! Done!", "Checked off! Mrrp!", "Another one caught!", "Yes! Purrfect work!"],
          break: ["Stretch like a cat! Long, then longer!", "Find a sunbeam and rest your eyes!"]
        }
      }
    ]
  });
})();
