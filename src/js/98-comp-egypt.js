/* ===== module: 98-comp-egypt.js ===== */
/* Study Companions, Around the World */
(() => {
  const {O, OW, LG, RG, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const f1 = v => Math.round(v * 10) / 10;
  const ring = (cx, cy, n, r, fn) => Array.from({length: n}, (_, i) => { const a = i / n * Math.PI * 2; return fn(f1(cx + Math.cos(a) * r), f1(cy + Math.sin(a) * r), a * 180 / Math.PI, i); }).join("");

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
        neck: [44, 64],
        parts: {
          tail: {svg: `${LINE("M97 70Q104 75 103.5 86", "#D8A46C", 2.6)}<path d="M103.5 83.5Q108.5 90 104 96.5Q98.5 90.5 103.5 83.5Z" fill="#9A6A42" ${OW(2.2)}/>`, pivot: [98, 71]},
          feet: `${[[81, "#D6A26C"], [93, "#D6A26C"], [40, "#E8BE88"], [54, "#E8BE88"]].map(([x, c]) => `<path d="M${x - 4.6} 84V103.5Q${x - 4.6} 106.5 ${x} 106.5Q${x + 4.6} 106.5 ${x + 4.6} 103.5V84Z" fill="${c}" ${O}/><path d="M${x - 6.4} 108.6Q${x - 6.4} 104.6 ${x} 104.6Q${x + 6.4} 104.6 ${x + 6.4} 108.6Q${x + 6.4} 110.6 ${x} 110.6Q${x - 6.4} 110.6 ${x - 6.4} 108.6Z" fill="#7A5236" ${OW(2.4)}/><path d="M${x} 106.4V109.6" stroke="#2B2233" stroke-width="1.6" stroke-linecap="round"/>`).join("")}`,
          body: `${RG("egypt-jamal-b", [[0, "#F8DCAE"], [0.65, "#E9BC84"], [1, "#D29C66"]], 0.4, 0.3, 0.8)}
            <defs><clipPath id="egypt-jamal-c"><path d="M34 58C33 66 31 74 31 83C31 90 35 94 42 94H88C96 94 101 89 101 81C101 72 98 66 93 62C90 52 85 46 79 46C72 46 67 52 64 60C62 64 58 66 55 64C54 62 54 60 54 57Z"/></clipPath></defs>
            <path d="M34 58C33 66 31 74 31 83C31 90 35 94 42 94H88C96 94 101 89 101 81C101 72 98 66 93 62C90 52 85 46 79 46C72 46 67 52 64 60C62 64 58 66 55 64C54 62 54 60 54 57Z" fill="url(#egypt-jamal-b)"/>
            <g clip-path="url(#egypt-jamal-c)">
              <path d="M57 69Q80 55 104 69V83Q80 95 57 83Z" fill="#C8503A" stroke="#2B2233" stroke-width="2.4" stroke-linejoin="round"/>
              <path d="M58 74.5Q80 62 103 74.5" fill="none" stroke="#F2C24A" stroke-width="2.4"/><path d="M58 79Q80 89.5 103 79" fill="none" stroke="#F2C24A" stroke-width="2.4"/>
              ${[66, 73, 80, 87, 94].map(x => `<path d="M${x} 73.4l2.6 3.1l-2.6 3.1l-2.6 -3.1Z" fill="#2E5FA8"/>`).join("")}
            </g>
            <path d="M34 58C33 66 31 74 31 83C31 90 35 94 42 94H88C96 94 101 89 101 81C101 72 98 66 93 62C90 52 85 46 79 46C72 46 67 52 64 60C62 64 58 66 55 64" fill="none" ${O}/>
            ${[64, 72, 80, 88, 96].map(x => { const t = (x - 57) / 47, y = f1(83 + 24 * t * (1 - t) - 0.6); return `<path d="M${x} ${y}V${f1(y + 3)}" stroke="#2B2233" stroke-width="1.4"/><path d="M${x} ${f1(y + 2.4)}Q${x + 2.6} ${f1(y + 5.6)} ${x} ${f1(y + 7.4)}Q${x - 2.6} ${f1(y + 5.6)} ${x} ${f1(y + 2.4)}Z" fill="#F2C24A" ${OW(1.4)}/>`; }).join("")}
            <path d="M70.5 55Q73 49.5 78.5 48.6" fill="none" stroke="#FFF4DE" stroke-width="2.6" stroke-linecap="round"/>`,
          earL: {svg: `<path d="M30 29Q19 18.5 14.5 22.5Q12.5 30 27 35.5Z" fill="#E2AE76" ${O}/><path d="M26.5 30.6Q20 25 17.4 25.6Q17 29.6 24.6 33Z" fill="#B87A52"/>`, pivot: [27, 32]},
          earR: {svg: `<path d="M58 29Q69 18.5 73.5 22.5Q75.5 30 61 35.5Z" fill="#E2AE76" ${O}/><path d="M61.5 30.6Q68 25 70.6 25.6Q71 29.6 63.4 33Z" fill="#B87A52"/>`, pivot: [61, 32]},
          head: `${RG("egypt-jamal-h", [[0, "#FCE6C0"], [0.7, "#EEC48E"], [1, "#DAA66E"]], 0.42, 0.3, 0.8)}
            <path d="M44 18C58 18 65 27 65 39C65 45 63.5 49 61.5 52C64.5 56 64.5 62 60.5 65C57 67.5 51 68.5 44 68.5C37 68.5 31 67.5 27.5 65C23.5 62 23.5 56 26.5 52C24.5 49 23 45 23 39C23 27 30 18 44 18Z" fill="url(#egypt-jamal-h)" ${O}/>
            <path d="M44 51.5C53 51.5 59.5 54.5 59.5 59.5C59.5 64.5 53 67 44 67C35 67 28.5 64.5 28.5 59.5C28.5 54.5 35 51.5 44 51.5Z" fill="#F9E2C0"/>
            <path d="M34 24C32.5 16.5 39.5 13.5 43 17.5C45.5 11.5 53.5 13 53.5 18.5C58.5 17 60.5 23 56.5 25.5Q44 20.5 31.5 25.5C29.5 24 30.5 21.5 34 24Z" fill="#B8804E" ${OW(2.2)}/>
            <path d="M28 37Q29.5 31 34.5 28" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M31.8 38.2Q30.4 37.4 29.2 35.8M33.4 36.6Q32.6 35.2 32.4 33.6M56.2 38.2Q57.6 37.4 58.8 35.8M54.6 36.6Q55.4 35.2 55.6 33.6" fill="none" stroke="#2B2233" stroke-width="1.6" stroke-linecap="round"/>`,
          face: `<ellipse cx="39.4" cy="56.2" rx="1.3" ry="2.3" transform="rotate(-38 39.4 56.2)" fill="#8A5A36"/><ellipse cx="48.6" cy="56.2" rx="1.3" ry="2.3" transform="rotate(38 48.6 56.2)" fill="#8A5A36"/>`
        },
        eyes: {lx: 36, rx: 52, y: 41, r: 4.6, style: "round", color: "#2A1C14"},
        mouth: {x: 44, y: 61.5, w: 2.8, color: "#2A1C14"},
        cheeks: {lx: 29.6, rx: 58.4, y: 48.5, w: 3.6, h: 2.2, color: "#FF9A8A"},
        anchors: {top: [44, 21, 0.85], neck: [44, 69, 0.85], chest: [40, 84, 0.55], back: [80, 54, 0.8], hands: [46, 88, 0.75]},
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
          tail: {svg: `${LINE("M78 106Q97 108.5 101 95Q103.5 84.5 97 79Q94.5 77 91.5 77.6", "#D3D6DC", 5.4)}
            <path d="M84 107Q97 108.5 101 95Q103.5 84.5 97 79" fill="none" stroke="#5E626E" stroke-width="5.4" stroke-dasharray="2.4 5"/>
            <path d="M96.4 78.6Q94.5 77 91.5 77.6" fill="none" stroke="#4A4E58" stroke-width="5.4" stroke-linecap="round"/>`, pivot: [82, 104]},
          feet: `<ellipse cx="45" cy="108" rx="8" ry="4.6" fill="#F7F8FA" ${O}/><ellipse cx="75" cy="108" rx="8" ry="4.6" fill="#F7F8FA" ${O}/>`,
          body: `${LG("egypt-miu-b", [[0, "#F3F4F6"], [1, "#BCC0C8"]])}
            <path d="M60 70C76 70 85 83 87 95C88.5 105.5 82 110.5 72 110.5H48C38 110.5 31.5 105.5 33 95C35 83 44 70 60 70Z" fill="url(#egypt-miu-b)" ${O}/>
            <path d="M60 78C68 78 73.4 88 73.4 98C73.4 104 67.4 107.4 60 107.4C52.6 107.4 46.6 104 46.6 98C46.6 88 52 78 60 78Z" fill="#FFFFFF"/>
            ${[[43, 83.6, 2.2, 1.7, -20], [38.4, 91.4, 2.6, 2, 10], [39.6, 101.4, 2.4, 1.9, 15]].map(([x, y, rx, ry, r]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${r} ${x} ${y})" fill="#5E626E"/><ellipse cx="${f1(120 - x)}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${-r} ${f1(120 - x)} ${y})" fill="#5E626E"/>`).join("")}
            <path d="M36.6 99Q38.6 89 46.4 89.6M83.4 99Q81.4 89 73.6 89.6" fill="none" stroke="#9AA0AA" stroke-width="2" stroke-linecap="round"/>
            <path d="M38 73Q60 101 82 73L79.5 71Q60 91 40.5 71Z" fill="#2E5FA8" ${OW(2.2)}/>
            <path d="M39.6 75.4Q60 97.4 80.4 75.4" fill="none" stroke="#F2C24A" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M60 86.4Q64.2 90.6 60 95.4Q55.8 90.6 60 86.4Z" fill="#F2C24A" ${OW(1.8)}/>`,
          armL: {svg: `<g transform="rotate(30 34.6 91)"><ellipse cx="34.6" cy="91" rx="5" ry="7.2" fill="#E6E8EC"/><path d="M30.1 94.2A5 7.2 0 0 0 39.1 94.2Q34.6 92.6 30.1 94.2Z" fill="#FFFFFF"/><ellipse cx="34.6" cy="91" rx="5" ry="7.2" fill="none" ${O}/></g>`, pivot: [41.6, 84]},
          armR: {svg: `<g transform="rotate(-30 85.4 91)"><ellipse cx="85.4" cy="91" rx="5" ry="7.2" fill="#E6E8EC"/><path d="M80.9 94.2A5 7.2 0 0 0 89.9 94.2Q85.4 92.6 80.9 94.2Z" fill="#FFFFFF"/><ellipse cx="85.4" cy="91" rx="5" ry="7.2" fill="none" ${O}/></g>`, pivot: [78.4, 84]},
          earL: {svg: `<path d="M35 47Q30 28 31.5 18Q33.5 14.5 37 16.5Q47 24 56 34Z" fill="#D9DBE0" ${O}/><path d="M38.4 41Q35.4 29 36.4 21.6Q43.6 27.4 49.6 34Z" fill="#F7BDC8"/>`, pivot: [44, 40]},
          earR: {svg: `<path d="M85 47Q90 28 88.5 18Q86.5 14.5 83 16.5Q73 24 64 34Z" fill="#D9DBE0" ${O}/><path d="M81.6 41Q84.6 29 83.6 21.6Q76.4 27.4 70.4 34Z" fill="#F7BDC8"/>`, pivot: [76, 40]},
          head: `${RG("egypt-miu-h", [[0, "#FFFFFF"], [0.68, "#EBECEF"], [1, "#C6CAD1"]], 0.42, 0.32, 0.8)}
            <path d="M60 30C80 30 90 42 90 56C90 70 78 79 60 79C42 79 30 70 30 56C30 42 40 30 60 30Z" fill="url(#egypt-miu-h)" ${O}/>
            <path d="M51 45.4L53.6 38L60 43.6L66.4 38L69 45.4M57 33.4L57.8 37.6M63 33.4L62.2 37.6" fill="none" stroke="#5E626E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M60 62.4C56 61.2 50.4 62.4 50.4 66.6C50.4 70.4 55 71.4 60 69.6C65 71.4 69.6 70.4 69.6 66.6C69.6 62.4 64 61.2 60 62.4Z" fill="#FFFFFF"/>
            <path d="M37 44Q40 37 47 34" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>`,
          face: `<path d="M57 61.4H63Q63 62.4 60 64.6Q57 62.4 57 61.4Z" fill="#F29AAA" ${OW(1.4)}/><path d="M50 66.4L40.5 65M50.4 68.6L41.5 70.6M70 66.4L79.5 65M69.6 68.6L78.5 70.6" stroke="#9A9FA9" stroke-width="1.2" stroke-linecap="round"/>`
        },
        eyes: {lx: 48.5, rx: 71.5, y: 54, r: 5.4, style: "round", color: "#2F7A36"},
        mouth: {x: 60, y: 67, w: 3, color: "#3A3440", style: "cat"},
        cheeks: {lx: 41, rx: 79, y: 62.6, w: 3.8, h: 2.2, color: "#FFA6B4"},
        anchors: {top: [60, 30, 0.95], neck: [60, 78, 1], chest: [70, 92, 0.6], back: [84, 84, 0.8], hands: [60, 100, 0.84]},
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
/* end of module 98-comp-egypt.js */


