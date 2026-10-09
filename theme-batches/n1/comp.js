/* Study Companions, new theme ideas batch n1: onsen, rainforest, tidepool, volcano, savanna */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const twinkle = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${c || "#fff"}"/>`;
  const f1 = v => Math.round(v * 10) / 10;
  const shine = (x, y, rx, ry, a) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})" fill="#fff" opacity=".75"/>`;

  /* ================= Hot Spring ================= */
  COMP_DATA.push({
    theme: "onsen",
    companions: [
      {
        id: "onsen-kapi", name: "Kapi", kind: "Onsen Capybara", pose: "sit", sleepy: true, wearColor: "#5A8AD0",
        bio: "Will sit in warm water for as long as you study. Possibly longer.",
        idle: ["topBob", "earTwitch", "headTilt"], cheer: "bounce",
        neck: [60, 74],
        parts: {
          back: `${LINE("M24 70q-4-6 0-12t0-12", "#FFFFFF", 2.4)}${LINE("M98 66q-4-6 0-12t0-12", "#FFFFFF", 2.4)}`,
          body: `${LG("onsen-kapi-b", [[0, "#D9A577"], [1, "#A8744A"]])}${LG("onsen-kapi-t", [[0, "#F2C892"], [1, "#C08A52"]])}
            <path d="M30 86C30 72 42 66 60 66C78 66 90 72 90 86Z" fill="url(#onsen-kapi-b)" ${O}/>
            <ellipse cx="60" cy="86" rx="37" ry="7" fill="#9FE0EA" ${O}/>
            <path d="M22 86H98L93 108Q92 111 88 111H32Q28 111 27 108Z" fill="url(#onsen-kapi-t)" ${O}/>
            <path d="M24.5 95H95.5M26.6 104H93.4" stroke="${INK}" stroke-width="4.4"/><path d="M24.5 95H95.5M26.6 104H93.4" stroke="#D2D8E0" stroke-width="2.2"/>
            <path d="M40 87V110M60 87V111M80 87V110" stroke="#B07A46" stroke-width="1.4" opacity=".55"/>
            <path d="M34 84.5q6 2 12 0M70 86q6 2 12 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="36" cy="85" rx="7" ry="5" fill="#B8845A" ${O}/>`, pivot: [40, 84]},
          armR: {svg: `<ellipse cx="84" cy="85" rx="7" ry="5" fill="#B8845A" ${O}/>`, pivot: [80, 84]},
          earL: {svg: `<circle cx="40" cy="31" r="6" fill="#A8744A" ${O}/><circle cx="40.6" cy="31.6" r="2.6" fill="#E8A898"/>`, pivot: [42, 35]},
          earR: {svg: `<circle cx="80" cy="31" r="6" fill="#A8744A" ${O}/><circle cx="79.4" cy="31.6" r="2.6" fill="#E8A898"/>`, pivot: [78, 35]},
          head: `${RG("onsen-kapi-h", [[0, "#E8BC8C"], [0.6, "#CC9662"], [1, "#A8744A"]], 0.42, 0.3, 0.8)}
            <path d="M35 48C35 36 45 29 60 29C75 29 85 36 85 48V60C85 70 76 77 60 77C44 77 35 70 35 60Z" fill="url(#onsen-kapi-h)" ${O}/>
            ${shine(44, 38, 5, 2.6, -30)}`,
          face: `<rect x="44" y="53" width="32" height="20" rx="10" fill="#EBC59C" ${O2}/>
            <ellipse cx="54" cy="58.6" rx="2.6" ry="1.7" fill="${INK}"/><ellipse cx="66" cy="58.6" rx="2.6" ry="1.7" fill="${INK}"/>`,
          top: {svg: `<path d="M42 33Q60 22 78 33L76 39Q60 29 44 39Z" fill="#FFFFFF" ${O2}/><path d="M50 29.4L51.4 34.6M60 27V32.6M70 29.4L68.6 34.6" stroke="#5A8AD0" stroke-width="2.2" stroke-linecap="round"/>`, pivot: [60, 34]}
        },
        eyes: {lx: 50, rx: 70, y: 46, r: 3.8, style: "dot", color: "#2B1A10"},
        mouth: {x: 60, y: 67, w: 3, color: "#2B1A10"},
        cheeks: {lx: 41.5, rx: 78.5, y: 55, w: 4.4, h: 2.6, color: "#FF9A9A"},
        anchors: {top: [60, 30, 0.9], neck: [60, 78, 1.05], chest: [76, 96, 0.68], back: [92, 74, 0.8], hands: [60, 88, 0.85]},
        lines: {
          tap: ["Ahh, hi! The water's just right today.", "You're doing great. Want to soak in that for a second?", "No rush. One task at a time, like one bath at a time.", "I'm so calm, and you're so capable!", "Steady and warm, that's how we study.", "Every little step counts. I believe in you.", "Relax your shoulders. There we go!", "You make studying look cozy."],
          pet: ["Mmm, that's the good spot.", "Hehe, I might melt into the tub."],
          hello: ["You're here! I kept the water warm.", "Hello, friend! Come sit, come study."],
          morning: ["Good morning! A warm start to a good day.", "Morning! The steam says today's going to be nice."],
          night: ["It's late. A warm bath and bed sound lovely.", "Time to unwind soon, okay?"],
          focus: ["Soaking quietly right beside you.", "Calm water, calm mind. You've got this."],
          done: ["What a lovely session. Ahh!", "Done! You earned a long, warm soak."],
          task: ["Ahh, checked off! So satisfying.", "One more done! Pure bliss!", "Yes! That's the warm fuzzy feeling!", "Look at you go! Splash!"],
          break: ["Break time! Stretch and sip some water.", "Rest a bit. Warm drink, maybe?"]
        }
      },
      {
        id: "onsen-momo", name: "Momo", kind: "Snow Monkey Baby", pose: "sit", wearColor: "#E0533A",
        bio: "Keeps a snowball on its head at all times, for balance.",
        idle: ["earTwitch", "wave", "tailSwish"], cheer: "hop",
        parts: {
          tail: {svg: `<ellipse cx="92" cy="100" rx="7.5" ry="5" transform="rotate(-30 92 100)" fill="#B8A898" ${O}/>`, pivot: [86, 103]},
          earL: {svg: `<ellipse cx="30" cy="52" rx="7" ry="8.4" fill="#C8B6A6" ${O}/><ellipse cx="31" cy="52.6" rx="3.6" ry="4.6" fill="#F4A0A0"/>`, pivot: [36, 52]},
          earR: {svg: `<ellipse cx="90" cy="52" rx="7" ry="8.4" fill="#C8B6A6" ${O}/><ellipse cx="89" cy="52.6" rx="3.6" ry="4.6" fill="#F4A0A0"/>`, pivot: [84, 52]},
          feet: `<ellipse cx="46" cy="109" rx="8.4" ry="4.4" fill="#F2A0A0" ${O}/><ellipse cx="74" cy="109" rx="8.4" ry="4.4" fill="#F2A0A0" ${O}/>`,
          body: `${RG("onsen-momo-f", [[0, "#F2EAE0"], [0.6, "#D8CABC"], [1, "#B4A496"]], 0.42, 0.3, 0.8)}
            <path d="${puff(60, 92, 21, 11, 1.25)}" fill="url(#onsen-momo-f)" ${O}/>
            <ellipse cx="60" cy="96" rx="12" ry="9" fill="#F2EBE2"/>
            <path d="${puff(60, 54, 26, 13, 1.2)}" fill="url(#onsen-momo-f)" ${O}/>
            <path d="M60 40C70 35.5 79 43 77 54C75.6 63 68.4 68.5 60 68.5C51.6 68.5 44.4 63 43 54C41 43 50 35.5 60 40Z" fill="#F7A6A6" ${O2}/>
            <ellipse cx="57.6" cy="57.6" rx="1" ry="1.3" fill="#9A4A50"/><ellipse cx="62.4" cy="57.6" rx="1" ry="1.3" fill="#9A4A50"/>`,
          armL: {svg: `<ellipse cx="37" cy="88" rx="7" ry="10.4" transform="rotate(22 37 88)" fill="#CDBEB0" ${O}/><ellipse cx="34" cy="97" rx="4.6" ry="3.6" fill="#F2A0A0" ${OW(2)}/>`, pivot: [41, 81]},
          armR: {svg: `<ellipse cx="83" cy="88" rx="7" ry="10.4" transform="rotate(-22 83 88)" fill="#CDBEB0" ${O}/><ellipse cx="86" cy="97" rx="4.6" ry="3.6" fill="#F2A0A0" ${OW(2)}/>`, pivot: [79, 81]},
          top: {svg: `${RG("onsen-momo-s", [[0, "#FFFFFF"], [1, "#C4D6F0"]], 0.38, 0.32, 0.75)}<circle cx="60" cy="24" r="10" fill="url(#onsen-momo-s)" ${O}/><path d="M54 21.5a6.4 6.4 0 0 1 5-4.6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`, pivot: [60, 32]}
        },
        eyes: {lx: 53, rx: 67, y: 50.5, r: 3.6, style: "dot", color: "#3A1A1E"},
        mouth: {x: 60, y: 61.5, w: 2.6, color: "#3A1A1E"},
        cheeks: {lx: 48.5, rx: 71.5, y: 57, w: 3.4, h: 2.2, color: "#FF6F8E"},
        anchors: {top: [60, 27, 0.85], neck: [60, 76, 1], chest: [72, 98, 0.62], back: [86, 84, 0.8], hands: [60, 98, 0.8]},
        lines: {
          tap: ["Hi hi! Don't mind the snowball, it's for balance.", "You're so good at this! Wheee!", "Let's do the next one together!", "I believe in you more than snowballs!", "Brrr, studying warms me right up!", "Ooh, you're on a roll!", "Little steps, big monkey cheers!"],
          pet: ["Hehe! Careful, the snowball!", "Eee! That tickles my ears!"],
          hello: ["You're back! I saved you a warm rock!", "Hiii! Ready for some monkey business? The study kind!"],
          morning: ["Good morning! Fresh snow and fresh ideas!", "Morning! I made a brand new snowball for today!"],
          night: ["Yawn. Even monkeys need sleep.", "The stars are out. Bedtime soon?"],
          focus: ["Shh, I'm balancing very quietly.", "Focus mode! Not even my snowball wobbles."],
          done: ["You did it! Monkey flips!", "Session done! I'm so proud of you!"],
          task: ["Yes! One more done! Ooh ooh!", "Checked off! Snowball high five!", "Woohoo! Look at that!", "Done and dusted! Hooray!"],
          break: ["Break time! Let's stretch like monkeys!", "Shake out those paws! Then a sip of water!"]
        }
      },
      {
        id: "onsen-yuzu", name: "Yuzu", kind: "Floating Yuzu", pose: "float", wearColor: "#5AAA5A",
        bio: "A sunny citrus that bobs, rolls and never quite sinks.",
        idle: ["topBob", "sway", "sparkle"], cheer: "spin",
        parts: {
          back: `<ellipse cx="60" cy="96" rx="38" ry="9" fill="#A6E4EE" ${O}/><path d="M30 96q5 2.4 10 0M80 97q5 2.4 10 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`,
          body: `${RG("onsen-yuzu-b", [[0, "#FFF6B8"], [0.5, "#FFD24A"], [1, "#F29A1E"]], 0.38, 0.3, 0.78)}
            <circle cx="60" cy="68" r="29" fill="url(#onsen-yuzu-b)" ${O}/>
            <g fill="#E89A2A" opacity=".5"><circle cx="44" cy="80" r="1.4"/><circle cx="78" cy="56" r="1.4"/><circle cx="74" cy="84" r="1.4"/><circle cx="46" cy="56" r="1.2"/><circle cx="82" cy="72" r="1.2"/></g>
            ${shine(46, 52, 7, 4, -38)}<circle cx="54" cy="46" r="1.8" fill="#fff"/>`,
          armL: {svg: `<ellipse cx="32.5" cy="76" rx="4.6" ry="5.8" transform="rotate(25 32.5 76)" fill="#FFC23A" ${O}/>`, pivot: [37, 74]},
          armR: {svg: `<ellipse cx="87.5" cy="76" rx="4.6" ry="5.8" transform="rotate(-25 87.5 76)" fill="#FFC23A" ${O}/>`, pivot: [83, 74]},
          top: {svg: `${LINE("M60 40V32", "#7A5A2A", 2.6)}<path d="M61 34C64 24 76 20 85 24C81 33 71 37 61 34Z" fill="#7CC860" ${O2}/><path d="M63 33Q72 28 81 25" fill="none" stroke="#4E9A3E" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [60, 40]}
        },
        eyes: {lx: 50, rx: 70, y: 67, r: 4.4, style: "sparkle", color: "#3A2414"},
        mouth: {x: 60, y: 77, w: 3.1, color: "#3A2414"},
        cheeks: {lx: 43, rx: 77, y: 75, w: 4.4, h: 2.7, color: "#FF8F7A"},
        anchors: {top: [60, 38, 0.85], neck: [60, 92, 1], chest: [74, 86, 0.62], back: [86, 62, 0.8], hands: [60, 90, 0.85]},
        lines: {
          tap: ["Bob bob! Hi there!", "I never sink, and neither will your grades!", "Zesty work today!", "You're the sunniest student I know!", "Roll with it, you've got this!", "A little citrus cheer, just for you!", "Fresh start, fresh focus!", "You're doing a-peel-ing work!"],
          pet: ["Hehe, I'm rolling with joy!", "Ooh, that smells nice and zesty!"],
          hello: ["You're here! Let's float through this!", "Hello, sunshine! Well, hello from sunshine!"],
          morning: ["Good morning! Bright and zesty!", "Morning! I bobbed up early for you!"],
          night: ["Floating off to sleep soon. You too?", "Calm water, sweet dreams."],
          focus: ["Bobbing quietly beside you.", "Steady float, steady focus."],
          done: ["What a session! I'm glowing!", "Session done! Juicy work!"],
          task: ["Pop! Another one done!", "Yay! That's citrus-tastic!", "Checked off! Bob bob hooray!", "Done! So fresh, so good!"],
          break: ["Break! Roll your shoulders like a yuzu!", "Float for a minute. Then back to it!"]
        }
      }
    ]
  });

  /* ================= Rainforest Canopy ================= */
  const beak = (dy, open) => `<path d="M50 ${55 + dy}C56 51 66 51 71 ${55 + dy}C78 ${61 + dy} 81 ${72 + dy} 77 ${81 + dy}C73 ${74 + dy} 65 ${66 + dy} 51 ${62 + dy}Z" fill="#FF8A2A" ${OW(2.4)}/>
    <path d="M52 ${56 + dy}C58 ${53 + dy} 66 ${53 + dy} 70 ${56.5 + dy}C75 ${60 + dy} 78 ${66 + dy} 78 ${71 + dy}C72 ${64 + dy} 63 ${59 + dy} 52 ${58.5 + dy}Z" fill="#FFD23F"/>
    <path d="M77 ${80.5 + dy}C79 ${76 + dy} 79 ${73 + dy} 78.6 ${71 + dy}L74.6 ${75 + dy}C75.6 ${77 + dy} 76.6 ${79 + dy} 77 ${80.5 + dy}Z" fill="${INK}"/>${open ? `<path d="M54 ${63 + dy}Q64 ${70 + dy} 72 ${76 + dy}Q62 ${73 + dy} 54 ${66 + dy}Z" fill="#FF8FA8" ${OW(1.6)}/>` : ""}`;
  COMP_DATA.push({
    theme: "rainforest",
    companions: [
      {
        id: "rainforest-mosey", name: "Mosey", kind: "Baby Sloth", pose: "sit", sleepy: true, wearColor: "#3E9A5A",
        bio: "Does everything slowly, including finishing your sentence.",
        idle: ["headTilt", "sway", "wave"], cheer: "wave",
        neck: [60, 72],
        parts: {
          feet: `<ellipse cx="44" cy="109" rx="9" ry="4.4" fill="#8A6A4E" ${O}/><ellipse cx="76" cy="109" rx="9" ry="4.4" fill="#8A6A4E" ${O}/><path d="M40 112v-3M44 112.5v-3M80 112v-3M76 112.5v-3" stroke="#F2E6D2" stroke-width="1.6" stroke-linecap="round"/>`,
          body: `${RG("rainforest-mosey-b", [[0, "#E2CCAE"], [0.6, "#C4A47E"], [1, "#9A7A58"]], 0.45, 0.3, 0.8)}
            <path d="M32 108C26 92 32 74 60 72C88 74 94 92 88 108Z" fill="url(#rainforest-mosey-b)" ${O}/>
            <ellipse cx="60" cy="94" rx="15" ry="11" fill="#EADCC4"/><path d="M40 84l3 3M78 84l-3 3M36 96l3 2M84 96l-3 2" stroke="#8A6A4E" stroke-width="1.6" stroke-linecap="round"/>`,
          armL: {svg: `<path d="M40 80C30 86 25 98 29 108C33 111 38 109 38 104C38 96 42 90 47 86Z" fill="#B8956E" ${O}/><path d="M29.6 105.6l-2.4 3.6M32.6 107l-1.2 4M36 107v4" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [44, 82]},
          armR: {svg: `<path d="M80 80C90 86 95 98 91 108C87 111 82 109 82 104C82 96 78 90 73 86Z" fill="#B8956E" ${O}/><path d="M90.4 105.6l2.4 3.6M87.4 107l1.2 4M84 107v4" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [76, 82]},
          head: `${RG("rainforest-mosey-h", [[0, "#DCC4A2"], [0.6, "#BC9C74"], [1, "#94744E"]], 0.45, 0.3, 0.8)}
            <ellipse cx="60" cy="50" rx="27" ry="24" fill="url(#rainforest-mosey-h)" ${O}/>
            <path d="M44 30Q50 24 56 28M60 26Q66 22 72 28" fill="none" stroke="#8A6A4E" stroke-width="2" stroke-linecap="round"/>`,
          face: `<ellipse cx="60" cy="54" rx="20" ry="15.5" fill="#F4E8D2"/>
            <path d="M37 50Q45 41 55 49Q49 58 37 50Z" fill="#7A5638"/><path d="M83 50Q75 41 65 49Q71 58 83 50Z" fill="#7A5638"/>
            <ellipse cx="60" cy="58.5" rx="3.8" ry="2.6" fill="${INK}"/><ellipse cx="59" cy="57.6" rx="1.2" ry=".7" fill="#fff" opacity=".7"/>`
        },
        eyes: {lx: 47, rx: 73, y: 49.5, r: 3.6, style: "round", color: "#2B1A10"},
        mouth: {x: 60, y: 64, w: 2.8, color: "#2B1A10"},
        cheeks: {lx: 43, rx: 77, y: 60, w: 4, h: 2.4, color: "#FF9A9A"},
        anchors: {top: [60, 27, 0.95], neck: [60, 74, 1.05], chest: [74, 94, 0.68], back: [88, 86, 0.8], hands: [60, 96, 0.85]},
        lines: {
          tap: ["Heyyy... friend... hi.", "Slow and steady... still gets there.", "You're doing great... no rush.", "One... thing... at a time. Perfect.", "I like your pace... it's lovely.", "Hang in there... like me!", "Big things... start small.", "Deep breath... you've got this."],
          pet: ["Mmm... so cozy... thank you.", "Hehe... slow happy wiggle."],
          hello: ["Oh... you're here... yay.", "Hiii... I was... waiting."],
          morning: ["Good... morning... sunshine.", "Morning... let's take it easy... but steady."],
          night: ["So sleepy... you too?", "Time to... hang up for the night."],
          focus: ["Focusing... very... slowly.", "Quietly... right here... with you."],
          done: ["You... did it! Wow!", "Session done... that was amazing."],
          task: ["Done! ...Yay!", "Checked off... so proud.", "Another one... wonderful!", "Look at that... finished!"],
          break: ["Break time... my favorite.", "Stretch... reeeal slow."]
        }
      },
      {
        id: "rainforest-tiko", name: "Tiko", kind: "Toucan Chick", pose: "stand", wearColor: "#FF8A2A",
        bio: "Its beak is bigger than its plans, and its plans are big.",
        idle: ["headTilt", "wingFlutter", "topBob"], cheer: "wingFlutter",
        neck: [60, 70],
        parts: {
          feet: `<path d="M48 104V110M44 111L48 108L52 111M72 104V110M68 111L72 108L76 111" fill="none" stroke="${INK}" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M48 104V110M44 111L48 108L52 111M72 104V110M68 111L72 108L76 111" fill="none" stroke="#7A8494" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
          wingL: {svg: `<path d="M38 74C27 80 24 95 30 104C39 100 42 87 40 74Z" fill="#3A3644" ${O}/><path d="M33 86Q31 92 32 98" fill="none" stroke="#5A5666" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [39, 76]},
          wingR: {svg: `<path d="M82 74C93 80 96 95 90 104C81 100 78 87 80 74Z" fill="#3A3644" ${O}/><path d="M87 86Q89 92 88 98" fill="none" stroke="#5A5666" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [81, 76]},
          body: `${RG("rainforest-tiko-b", [[0, "#5A5666"], [0.6, "#34303E"], [1, "#22202A"]], 0.4, 0.3, 0.8)}
            <ellipse cx="60" cy="88" rx="24" ry="21" fill="url(#rainforest-tiko-b)" ${O}/>
            <ellipse cx="60" cy="86" rx="13.5" ry="13" fill="#FFF1C8"/><ellipse cx="60" cy="106.5" rx="8" ry="3" fill="#E8403A"/>`,
          head: `${RG("rainforest-tiko-h", [[0, "#5A5666"], [0.6, "#34303E"], [1, "#22202A"]], 0.4, 0.28, 0.8)}
            <circle cx="60" cy="49" r="24" fill="url(#rainforest-tiko-h)" ${O}/>${shine(46, 36, 5, 2.6, -35)}`,
          face: `<circle cx="49" cy="46" r="8.4" fill="#6FD0F4" ${O2}/><circle cx="71" cy="46" r="8.4" fill="#6FD0F4" ${O2}/>`,
          top: {svg: `<path d="M57 28C54 20 58 13 63 10C63 16 66 20 64 28Z" fill="#3A3644" ${O2}/><path d="M61 27C61 22 65 18 69 17C68 21 67 24 64 28Z" fill="#3A3644" ${O2}/>`, pivot: [60, 29]}
        },
        eyes: {lx: 49, rx: 71, y: 46, r: 5, style: "round", color: "#1A1820"},
        mouth: {x: 63, y: 66, w: 3},
        mouths: {neutral: beak(0, false), smile: beak(-0.6, false) + `<path d="M46 58q2 2.4 4.6 1.6M74 58q-2 2.4 -4.6 1.6" fill="none" stroke="#FF8FA8" stroke-width="1.6" stroke-linecap="round"/>`, open: beak(0, true), sleepy: beak(1, false)},
        cheeks: {lx: 40, rx: 80, y: 57, w: 3.8, h: 2.3, color: "#FF8FA8"},
        anchors: {top: [60, 26, 0.9], neck: [60, 72, 1], chest: [70, 92, 0.62], back: [84, 86, 0.8], hands: [60, 96, 0.85]},
        lines: {
          tap: ["Hi! Did you notice my beak? Everyone notices my beak.", "Big plans today! Huge plans!", "You're doing toucan-tastic!", "Two can do it better: you and me!", "Hop hop! Next task!", "Your notes look colorful today!", "I spy a superstar student!", "Let's fly through this list!"],
          pet: ["Squawk! Hehe, that tickles!", "Careful, the beak is very important!"],
          hello: ["You're back! Big beak hello!", "Hiii! I've been hopping around waiting!"],
          morning: ["Good morning! The canopy is wide awake!", "Morning! The early bird gets the A!"],
          night: ["Tucking my beak in soon. You too?", "The frogs are singing goodnight."],
          focus: ["Quiet beak, busy brain. Let's go!", "Perched right here, cheering softly."],
          done: ["WOW! That session was huge, like my beak!", "Done! Flap flap hooray!"],
          task: ["SQUAWK! Done!", "Checked off! Big beak energy!", "Another one! You're soaring!", "Yes! Hop hop hooray!"],
          break: ["Stretch your wings! I mean arms!", "Snack break! Fruit, maybe?"]
        }
      },
      {
        id: "rainforest-dart", name: "Dart", kind: "Blue Tree Frog", pose: "stand", wearColor: "#FF9A3A",
        bio: "Small, bright and very proud of its sticky toes.",
        idle: ["bounce", "earTwitch", "sparkle"], cheer: "hop",
        parts: {
          earL: {svg: `<circle cx="29" cy="66" r="4.6" fill="#3A8AE0" ${OW(2.2)}/><circle cx="29" cy="66" r="2" fill="#7FC4FF"/>`, pivot: [32, 66]},
          earR: {svg: `<circle cx="91" cy="66" r="4.6" fill="#3A8AE0" ${OW(2.2)}/><circle cx="91" cy="66" r="2" fill="#7FC4FF"/>`, pivot: [88, 66]},
          feet: `<g fill="#FF9A3A" ${OW(2.2)}><circle cx="34" cy="108" r="4.4"/><circle cx="42" cy="110.5" r="4"/><circle cx="78" cy="110.5" r="4"/><circle cx="86" cy="108" r="4.4"/></g>`,
          body: `${RG("rainforest-dart-b", [[0, "#A8E2FF"], [0.55, "#4FA8F0"], [1, "#2A6ED0"]], 0.4, 0.3, 0.8)}
            <path d="M28 76C28 62 33 56 36 54A13 13 0 1 1 58 50.5Q60 50.4 62 50.5A13 13 0 1 1 84 54C87 56 92 62 92 76C92 96 78 106 60 106C42 106 28 96 28 76Z" fill="url(#rainforest-dart-b)" ${O}/>
            <ellipse cx="60" cy="90" rx="19" ry="13" fill="#D6F2FF"/>
            <g fill="#2A5AB8" opacity=".55"><circle cx="36" cy="72" r="2.4"/><circle cx="84" cy="74" r="2"/><circle cx="80" cy="86" r="1.6"/><circle cx="40" cy="88" r="1.8"/></g>
            ${shine(40, 62, 5, 2.6, -35)}`,
          armL: {svg: `<path d="M34 84C26 88 24 96 28 100" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M34 84C26 88 24 96 28 100" fill="none" stroke="#4FA8F0" stroke-width="5.4" stroke-linecap="round"/><circle cx="28" cy="101" r="4" fill="#FF9A3A" ${OW(2)}/>`, pivot: [36, 84]},
          armR: {svg: `<path d="M86 84C94 88 96 96 92 100" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M86 84C94 88 96 96 92 100" fill="none" stroke="#4FA8F0" stroke-width="5.4" stroke-linecap="round"/><circle cx="92" cy="101" r="4" fill="#FF9A3A" ${OW(2)}/>`, pivot: [84, 84]}
        },
        eyes: {lx: 44, rx: 76, y: 44, r: 7, style: "round", color: "#1A1820"},
        mouth: {x: 60, y: 69, w: 4.6, color: "#1A3A6A"},
        cheeks: {lx: 38, rx: 82, y: 64, w: 4.6, h: 2.8, color: "#FF8FB8"},
        anchors: {top: [60, 34, 0.9], neck: [60, 94, 1.1], chest: [74, 92, 0.65], back: [90, 72, 0.8], hands: [60, 98, 0.85]},
        lines: {
          tap: ["Ribbit! Hi! Look at my sticky toes!", "You're sticking with it! Nice!", "Hop to it, you're doing great!", "Small frog, big cheers!", "You're the brightest thing in this jungle!", "Leap to the next one!", "Every hop counts!"],
          pet: ["Hehe, I'm a little bit sticky, sorry!", "Ribbit! Again again!"],
          hello: ["You're back! Ribbit ribbit hooray!", "Hi hi! I hopped all the way over!"],
          morning: ["Good morning! Fresh dew on every leaf!", "Morning! Toes ready, let's go!"],
          night: ["Night time is frog time, but you should rest!", "I'll glow softly while you sleep."],
          focus: ["Sticking right here with you.", "Quiet frog, focused friend."],
          done: ["Ribbit! What a session!", "Done! That deserves a big leap!"],
          task: ["Hop! Done!", "Ribbit! Checked off!", "Another one! Sticky success!", "Yes! Leaping with joy!"],
          break: ["Break! Do a little frog stretch!", "Hop up, drink some water!"]
        }
      }
    ]
  });

  /* ================= Tide Pools ================= */
  const tentacles = (cx, cy, n, R, a0, a1, c, tip) => Array.from({length: n}, (_, i) => { const a = (a0 + (a1 - a0) * (i + 0.5) / n) * Math.PI / 180, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R, mx = cx + Math.cos(a) * R * 0.5 + Math.sin(i * 1.7) * 3, my = cy + Math.sin(a) * R * 0.5; return LINE(`M${cx} ${cy}Q${f1(mx)} ${f1(my)} ${f1(x)} ${f1(y)}`, c, 4.2) + `<circle cx="${f1(x)}" cy="${f1(y)}" r="3.4" fill="${tip}" ${OW(2)}/>`; }).join("");
  const pbeak = (dy, open) => `<path d="M53 ${56 + dy}Q60 ${50 + dy} 67 ${56 + dy}L64 ${67 + dy}Q60 ${70 + dy} 56 ${67 + dy}Z" fill="#FF7A3A" ${OW(2.2)}/><path d="M54.4 ${59 + dy}Q60 ${55.6 + dy} 65.6 ${59 + dy}" fill="none" stroke="#7A8494" stroke-width="2"/><path d="M55.8 ${63 + dy}Q60 ${60.6 + dy} 64.2 ${63 + dy}" fill="none" stroke="#FFD45A" stroke-width="1.6"/>${open ? `<path d="M56 ${66 + dy}Q60 ${73 + dy} 64 ${66 + dy}Z" fill="#FF8FA8" ${OW(1.6)}/>` : ""}`;
  COMP_DATA.push({
    theme: "tidepool",
    companions: [
      {
        id: "tidepool-annie", name: "Annie", kind: "Sea Anemone", pose: "stand", wearColor: "#3E9EA8",
        bio: "Waves at everyone with all forty arms.",
        idle: ["sway", "finWiggle", "topBob"], cheer: "bounce",
        parts: {
          feet: `<path d="M30 110C30 102 42 100 60 100C78 100 90 102 90 110Z" fill="#9A8C82" ${O}/><circle cx="40" cy="105" r="1.8" fill="#E6E0D6"/><circle cx="78" cy="106" r="1.6" fill="#E6E0D6"/>`,
          body: `${LG("tidepool-annie-b", [[0, "#FFB0CC"], [0.6, "#F27AA6"], [1, "#D8507E"]], 0, 0, 1, 1)}
            <path d="M38 58C38 52 82 52 82 58V98Q82 106 72 106H48Q38 106 38 98Z" fill="url(#tidepool-annie-b)" ${O}/>
            <path d="M46 62V100M74 62V100" stroke="#FFC8DA" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>
            <ellipse cx="60" cy="56" rx="23" ry="6.4" fill="#FFD6E4" ${O2}/>`,
          armL: {svg: `${LINE("M40 64Q30 62 24 54", "#FF8FB8", 4.2)}<circle cx="24" cy="53.6" r="3.4" fill="#FFE0EC" ${OW(2)}/>`, pivot: [40, 64]},
          armR: {svg: `${LINE("M80 64Q90 62 96 54", "#FF8FB8", 4.2)}<circle cx="96" cy="53.6" r="3.4" fill="#FFE0EC" ${OW(2)}/>`, pivot: [80, 64]},
          top: {svg: tentacles(60, 55, 9, 24, -168, -12, "#FF8FB8", "#FFE0EC"), pivot: [60, 56]}
        },
        eyes: {lx: 51, rx: 69, y: 76, r: 4.6, style: "sparkle", color: "#4A1830"},
        mouth: {x: 60, y: 86, w: 3, color: "#4A1830"},
        cheeks: {lx: 44, rx: 76, y: 84, w: 4.2, h: 2.6, color: "#FF5E8E"},
        anchors: {top: [60, 40, 0.85], neck: [60, 96, 1], chest: [72, 96, 0.6], back: [84, 72, 0.8], hands: [60, 100, 0.85]},
        lines: {
          tap: ["Hi! I'm waving with all my arms!", "You're doing wonderfully, swish swish!", "Forty arms, forty cheers for you!", "Every wave brings something new!", "You're the brightest thing in my pool!", "Let the tide carry you to the next one!", "Hugs from every tentacle!", "Swaying along with your progress!"],
          pet: ["Ooh! That tickles all forty arms!", "Hehe! I'm closing up with joy!"],
          hello: ["You're back! A big wave hello!", "Hi hi! The tide brought you here!"],
          morning: ["Good morning! The tide is out and so is the sun!", "Morning! I opened up just for you!"],
          night: ["Closing up for the night soon. Rest well!", "The moon's on the water. Sleepy time?"],
          focus: ["Swaying quietly beside you.", "Calm pool, calm mind. You've got this."],
          done: ["What a session! I'm blooming!", "Done! All my arms are cheering!"],
          task: ["Swish! Done!", "Checked off! Forty high fives!", "Another one! I'm wiggling with pride!", "Yes! Big happy bloom!"],
          break: ["Break! Wave your arms around like me!", "Rest a bit, let the tide come in."]
        }
      },
      {
        id: "tidepool-spike", name: "Spike", kind: "Purple Sea Urchin", pose: "stand", wearColor: "#2FA0B8",
        bio: "Looks prickly. Is actually soft and shy.",
        idle: ["topBob", "sparkle", "bounce"], cheer: "spin",
        parts: {
          back: Array.from({length: 18}, (_, i) => { const a = (i / 18) * Math.PI * 2 + 0.17, x0 = 60 + Math.cos(a) * 24, y0 = 74 + Math.sin(a) * 24, x1 = 60 + Math.cos(a) * 42, y1 = 74 + Math.sin(a) * 40; return y1 < 50 && Math.abs(x1 - 60) < 14 ? "" : LINE(`M${f1(x0)} ${f1(y0)}L${f1(x1)} ${f1(y1)}`, "#B888F0", 2.6); }).join(""),
          feet: `<g fill="#F7A6C8" ${OW(2)}><circle cx="46" cy="104" r="3.4"/><circle cx="54" cy="106" r="3.4"/><circle cx="66" cy="106" r="3.4"/><circle cx="74" cy="104" r="3.4"/></g>`,
          body: `${RG("tidepool-spike-b", [[0, "#E2C2FF"], [0.55, "#A06ADC"], [1, "#6A38B0"]], 0.4, 0.3, 0.8)}
            <circle cx="60" cy="74" r="28" fill="url(#tidepool-spike-b)" ${O}/>
            <g fill="#C8A0F4" opacity=".6"><circle cx="44" cy="66" r="1.6"/><circle cx="78" cy="64" r="1.6"/><circle cx="80" cy="84" r="1.6"/><circle cx="42" cy="86" r="1.6"/><circle cx="60" cy="96" r="1.6"/></g>
            ${shine(47, 58, 6, 3, -35)}`,
          top: {svg: `${LINE("M60 47L60 30", "#B888F0", 2.6)}${LINE("M52 49L46 34", "#B888F0", 2.6)}${LINE("M68 49L74 34", "#B888F0", 2.6)}`, pivot: [60, 48]}
        },
        eyes: {lx: 51, rx: 69, y: 72, r: 3.8, style: "dot", color: "#2A1240"},
        mouth: {x: 60, y: 81.5, w: 2.3, color: "#2A1240"},
        cheeks: {lx: 44, rx: 76, y: 79, w: 5.4, h: 3.2, color: "#FF7FAE"},
        anchors: {top: [60, 44, 0.85], neck: [60, 98, 1], chest: [72, 92, 0.6], back: [86, 64, 0.8], hands: [60, 96, 0.85]},
        lines: {
          tap: ["Oh! Um, hi. I'm soft, I promise.", "You're doing really well... just saying.", "I'm quietly cheering for you.", "Don't mind the spikes, they're just for show.", "You make me feel brave!", "Little steps are still steps!", "I believe in you. Shyly. But a lot."],
          pet: ["Eep! That was nice actually.", "Hehe... I'm blushing all over."],
          hello: ["Oh! You're back... yay!", "Hi... I'm really glad you're here."],
          morning: ["Good morning... the pool is nice and clear.", "Morning! I'll be brave today if you will."],
          night: ["Tucking in between the rocks. Sleep well!", "Shh... the tide's coming in. Rest soon."],
          focus: ["Very quietly being here for you.", "Shy cheers. Big focus."],
          done: ["Wow... you did all of that!", "Session done! I'm so proud... out loud!"],
          task: ["Yay! Done!", "Checked off! *happy wiggle*", "Another one... amazing!", "You did it! Spikes up!"],
          break: ["Break time! Roll around a little!", "Rest for a bit. You earned it."]
        }
      },
      {
        id: "tidepool-pippin", name: "Pippin", kind: "Puffin Chick", pose: "stand", wearColor: "#FF7A3A",
        bio: "A fluffball in a tuxedo that waddles to every pool to check on it.",
        idle: ["waddle", "headTilt", "wingFlutter"], cheer: "wingFlutter",
        neck: [60, 72],
        parts: {
          feet: `<path d="M40 111L46 102L52 111Z" fill="#FF8A3A" ${OW(2.2)}/><path d="M68 111L74 102L80 111Z" fill="#FF8A3A" ${OW(2.2)}/>`,
          wingL: {svg: `<path d="M38 76C27 82 24 96 30 104C38 98 41 88 40 76Z" fill="#3A3644" ${O}/>`, pivot: [39, 78]},
          wingR: {svg: `<path d="M82 76C93 82 96 96 90 104C82 98 79 88 80 76Z" fill="#3A3644" ${O}/>`, pivot: [81, 78]},
          body: `${RG("tidepool-pippin-b", [[0, "#6A6474"], [0.6, "#45404E"], [1, "#2A2632"]], 0.4, 0.3, 0.8)}
            <path d="${puff(60, 89, 23, 12, 1.15)}" fill="url(#tidepool-pippin-b)" ${O}/>
            <ellipse cx="60" cy="92" rx="15" ry="15" fill="#FFFFFF"/><path d="M50 84q2-2 4 0M58 82q2-2 4 0M66 84q2-2 4 0" fill="none" stroke="#E6E2EA" stroke-width="1.6" stroke-linecap="round"/>`,
          head: `${RG("tidepool-pippin-h", [[0, "#6A6474"], [0.6, "#45404E"], [1, "#2A2632"]], 0.4, 0.28, 0.8)}
            <path d="${puff(60, 50, 23, 13, 1.1)}" fill="url(#tidepool-pippin-h)" ${O}/>`,
          face: `<ellipse cx="60" cy="54" rx="16.5" ry="13.5" fill="#F6F4F0"/>`
        },
        eyes: {lx: 51, rx: 69, y: 50, r: 3.6, style: "dot", color: "#1A1820"},
        mouth: {x: 60, y: 62, w: 3},
        mouths: {neutral: pbeak(0, false), smile: pbeak(-0.6, false) + `<path d="M50 59q1.6 1.8 3.4 1M70 59q-1.6 1.8 -3.4 1" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`, open: pbeak(-1, true), sleepy: pbeak(0.8, false)},
        cheeks: {lx: 47, rx: 73, y: 59, w: 3.4, h: 2.2, color: "#FF8FA8"},
        anchors: {top: [60, 28, 0.9], neck: [60, 74, 1], chest: [70, 94, 0.62], back: [84, 86, 0.8], hands: [60, 98, 0.85]},
        lines: {
          tap: ["Hello! Pool inspection complete, all is well!", "Waddle waddle, you're doing great!", "I checked every pool. You're the best one!", "Tuxedo on, ready to study!", "Fluffy but focused!", "Let's waddle to the next task!", "You're puff-ectly on track!", "Beak up, chest out, here we go!"],
          pet: ["Hehe! My fluff is extra fluffy now!", "Peep peep! Again!"],
          hello: ["You're back! I waddled right over!", "Hi hi! I saved you a rock by the pool!"],
          morning: ["Good morning! Low tide, high spirits!", "Morning! I'm dressed and ready!"],
          night: ["Burrow time soon. Tuck in, okay?", "The sea is sleepy. You should be too."],
          focus: ["Standing guard by the pools for you.", "Quiet waddle, big focus."],
          done: ["Flap flap! What a session!", "Done! Fluff-tastic work!"],
          task: ["Peep! Done!", "Checked off! Happy waddle!", "Another one! Tuxedo-level fancy!", "Yes! Flippers up!"],
          break: ["Break time! Waddle around a bit!", "Shake out your feathers! I mean shoulders!"]
        }
      }
    ]
  });

  /* ================= Volcano Island ================= */
  COMP_DATA.push({
    theme: "volcano",
    companions: [
      {
        id: "volcano-ember", name: "Ember", kind: "Lava Blob", pose: "stand", wearColor: "#2EA2A0",
        bio: "Warm, glowing and a little gooey. Gives the best hugs from a safe distance.",
        idle: ["bounce", "sparkle", "topBob"], cheer: "hop",
        parts: {
          back: `<circle cx="60" cy="74" r="42" fill="#FFB04A" opacity=".22"/>`,
          feet: `<path d="M42 104Q44 112 48 108M72 106Q74 113 78 108" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M42 104Q44 112 48 108M72 106Q74 113 78 108" fill="none" stroke="#F2602A" stroke-width="3.6" stroke-linecap="round"/>`,
          body: `${RG("volcano-ember-b", [[0, "#FFF2B0"], [0.45, "#FFB04A"], [1, "#E8402A"]], 0.42, 0.42, 0.8)}
            <path d="M60 36C66 47 90 56 90 80C90 98 78 108 60 108C42 108 30 98 30 80C30 56 54 47 60 36Z" fill="url(#volcano-ember-b)" ${O}/>
            <g fill="#B8302A" opacity=".45"><ellipse cx="42" cy="94" rx="4" ry="2.4"/><ellipse cx="80" cy="92" rx="3.4" ry="2"/><ellipse cx="74" cy="60" rx="2.6" ry="1.6"/></g>
            <path d="M42 66C42 58 48 52 54 48" fill="none" stroke="#FFF8D8" stroke-width="3.4" stroke-linecap="round" opacity=".9"/>`,
          armL: {svg: `<ellipse cx="29" cy="84" rx="5" ry="7" transform="rotate(32 29 84)" fill="#FF8A3A" ${O}/>`, pivot: [34, 82]},
          armR: {svg: `<ellipse cx="91" cy="84" rx="5" ry="7" transform="rotate(-32 91 84)" fill="#FF8A3A" ${O}/>`, pivot: [86, 82]},
          top: {svg: `<path d="M60 38C53 30 57 19 64 13C64 21 71 25 67 34Q64 39 60 38Z" fill="#FFE07A" ${OW(2.2)}/><path d="M61 35C59 30 61 26 63 23C64 27 66 30 64 34Z" fill="#FFF6D0"/>`, pivot: [60, 38]}
        },
        eyes: {lx: 51, rx: 69, y: 76, r: 4.6, style: "sparkle", color: "#4A1408"},
        mouth: {x: 60, y: 86, w: 3.2, color: "#4A1408"},
        cheeks: {lx: 43, rx: 77, y: 84, w: 4.4, h: 2.7, color: "#FF5A6A"},
        anchors: {top: [60, 34, 0.85], neck: [60, 98, 1], chest: [72, 94, 0.62], back: [86, 74, 0.8], hands: [60, 98, 0.85]},
        lines: {
          tap: ["Hi! I'm warm, I'm glowy, I'm here for you!", "You're on fire today! The good kind!", "Hot tip: you're doing amazing!", "Bubbling with pride over here!", "Keep that glow going!", "Gooey hug from a safe distance!", "You're heating up! Love it!", "Molten-level motivation, activated!"],
          pet: ["Ooh, careful, I'm toasty! Hehe!", "Bloop! That made me glow brighter!"],
          hello: ["You're back! I've been glowing for you!", "Hiii! Warm welcome, literally!"],
          morning: ["Good morning! Rise and shine, rise and glow!", "Morning! Fired up and ready!"],
          night: ["Cooling down for the night. You too?", "Dimming my glow. Sweet dreams!"],
          focus: ["Simmering quietly beside you.", "Steady glow, steady focus."],
          done: ["WOW! That session was red hot!", "Done! Erupting with joy!"],
          task: ["Bloop! Done!", "Checked off! Sparks everywhere!", "Another one! Hot stuff!", "YES! Lava-ly work!"],
          break: ["Cool-down break! Sip some water!", "Stretch it out, stay toasty!"]
        }
      },
      {
        id: "volcano-pumi", name: "Pumi", kind: "Pumice Pebble", pose: "float", wearColor: "#E0533A",
        bio: "So light it floats. Not sure if that counts as swimming.",
        idle: ["topBob", "sway", "headTilt"], cheer: "spin",
        neck: [60, 92],
        parts: {
          back: `<ellipse cx="60" cy="96" rx="38" ry="9" fill="#8ED8D2" ${O}/>`,
          body: `<path d="M26 96q6-3 12 0M82 97q6-3 12 0" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>`,
          head: `${RG("volcano-pumi-b", [[0, "#FAF6F0"], [0.6, "#DCD2C8"], [1, "#B0A498"]], 0.38, 0.3, 0.8)}
            <path d="M30 74C28 55 42 45 60 45C80 45 92 55 90 74C88 92 32 93 30 74Z" fill="url(#volcano-pumi-b)" ${O}/>
            <g fill="#A89C92">${[[40, 60, 2.4], [80, 58, 2], [78, 78, 2.6], [42, 80, 1.8], [62, 52, 1.6], [86, 70, 1.4], [34, 70, 1.6], [52, 84, 1.4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join("")}</g>
            ${shine(44, 52, 6, 3, -25)}`,
          top: {svg: `${LINE("M60 46V39", "#5DAA62", 2.4)}<path d="M60 41C56 33 47 33 44 37C48 43 56 44 60 41Z" fill="#8AD08A" ${O2}/><path d="M60 40C64 32 73 32 76 36C72 42 64 43 60 40Z" fill="#9BDA95" ${O2}/>`, pivot: [60, 47]}
        },
        eyes: {lx: 50, rx: 70, y: 66, r: 3.8, style: "dot", color: "#2B2233"},
        mouth: {x: 60, y: 75, w: 2.7},
        cheeks: {lx: 43, rx: 77, y: 73, w: 4.2, h: 2.6, color: "#FF9A9A"},
        anchors: {top: [60, 40, 0.85], neck: [60, 90, 1], chest: [72, 84, 0.6], back: [86, 62, 0.8], hands: [60, 90, 0.85]},
        lines: {
          tap: ["Hi! Look, I'm floating! Is this swimming?", "Light as air, strong as rock. Like you!", "You're doing great, I can tell from here!", "Drifting along, cheering you on!", "Little pebble, big belief in you!", "Keep it light, keep it going!", "You make hard things look easy!"],
          pet: ["Hehe! I'm bobbing with joy!", "Ooh, I almost floated away!"],
          hello: ["You're back! I drifted right over!", "Hi! The tide brought me to you!"],
          morning: ["Good morning! Bright sun, light heart!", "Morning! Ready to float through today!"],
          night: ["Bobbing off to sleep soon. You too?", "The waves are gentle tonight. Rest well."],
          focus: ["Floating quietly right here.", "Steady bob, steady focus."],
          done: ["Wow! I'm so light with happiness!", "Session done! Floating on air!"],
          task: ["Bloop! Done!", "Checked off! Floaty hooray!", "Another one! Light work!", "Yes! Bob bob bob!"],
          break: ["Break! Lie back and float for a minute!", "Rest time. Let the waves rock you."]
        }
      },
      {
        id: "volcano-iggy", name: "Iggy", kind: "Marine Iguana", pose: "sit", wearColor: "#2EA2A0",
        bio: "Sunbathes after every dip and sneezes out salt when happy.",
        idle: ["tailSwish", "headTilt", "earTwitch"], cheer: "bounce",
        neck: [60, 74],
        parts: {
          tail: {svg: LINE("M82 102C98 106 108 96 106 84C105 77 98 78 100 85", "#6E7C84", 6.4), pivot: [82, 100]},
          feet: `<path d="M38 104l-6 6M42 106l-3 6M46 106v6M82 104l6 6M78 106l3 6M74 106v6" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="42" cy="104" rx="8" ry="4" fill="#5E6C74" ${OW(2.2)}/><ellipse cx="78" cy="104" rx="8" ry="4" fill="#5E6C74" ${OW(2.2)}/>`,
          body: `${RG("volcano-iggy-b", [[0, "#A8B8BC"], [0.6, "#6E7C84"], [1, "#46525A"]], 0.42, 0.3, 0.8)}
            <path d="M34 106C30 90 38 76 60 74C82 76 90 90 86 106Z" fill="url(#volcano-iggy-b)" ${O}/>
            <ellipse cx="60" cy="94" rx="13" ry="10" fill="#B8D0C8"/>
            <g fill="#E07A5A" opacity=".75"><ellipse cx="40" cy="90" rx="3.6" ry="2.4"/><ellipse cx="80" cy="88" rx="3.2" ry="2.2"/></g>
            <g fill="#4FB8A8" opacity=".6"><circle cx="46" cy="80" r="2"/><circle cx="74" cy="80" r="2"/></g>`,
          armL: {svg: `<ellipse cx="40" cy="92" rx="5" ry="8" transform="rotate(18 40 92)" fill="#6E7C84" ${O}/>`, pivot: [43, 86]},
          armR: {svg: `<ellipse cx="80" cy="92" rx="5" ry="8" transform="rotate(-18 80 92)" fill="#6E7C84" ${O}/>`, pivot: [77, 86]},
          earL: {svg: `<path d="M42 36L38 22L49 31Z" fill="#E8A040" ${O2}/><path d="M50 32L50 18L57 29Z" fill="#E8A040" ${O2}/>`, pivot: [48, 34]},
          earR: {svg: `<path d="M78 36L82 22L71 31Z" fill="#E8A040" ${O2}/><path d="M70 32L70 18L63 29Z" fill="#E8A040" ${O2}/>`, pivot: [72, 34]},
          head: `${RG("volcano-iggy-h", [[0, "#B0C0C4"], [0.6, "#76848C"], [1, "#4A565E"]], 0.42, 0.3, 0.8)}
            <path d="M34 54C34 38 46 30 60 30C74 30 86 38 86 54C86 68 76 76 60 76C44 76 34 68 34 54Z" fill="url(#volcano-iggy-h)" ${O}/>
            <g fill="#F4FAFA"><circle cx="50" cy="36" r="2"/><circle cx="58" cy="33.4" r="1.6"/><circle cx="66" cy="34" r="2.2"/><circle cx="73" cy="38" r="1.4"/><circle cx="62" cy="38" r="1.2"/></g>
            <g fill="#5A6870" opacity=".55"><circle cx="40" cy="60" r="1.6"/><circle cx="80" cy="60" r="1.6"/><circle cx="44" cy="67" r="1.3"/><circle cx="76" cy="67" r="1.3"/></g>`,
          face: `<ellipse cx="55" cy="60" rx="1.4" ry="1" fill="${INK}"/><ellipse cx="65" cy="60" rx="1.4" ry="1" fill="${INK}"/>`
        },
        eyes: {lx: 48, rx: 72, y: 50, r: 5, style: "round", color: "#2B1A10"},
        mouth: {x: 60, y: 66, w: 4.2},
        cheeks: {lx: 41, rx: 79, y: 60, w: 4.2, h: 2.6, color: "#FF8F8F"},
        anchors: {top: [60, 28, 0.95], neck: [60, 76, 1.05], chest: [72, 96, 0.68], back: [86, 88, 0.8], hands: [60, 98, 0.85]},
        lines: {
          tap: ["Hi! Just sunbathing between study sessions.", "Achoo! Sorry, that's a happy salt sneeze!", "You're doing great, mate!", "Slow blink of approval.", "Warm rocks, warm heart, warm wishes!", "Let's dive into the next one!", "You're tougher than lava rock!"],
          pet: ["Achoo! Hehe, happy sneeze!", "Ooh, right on the spiky bits!"],
          hello: ["You're back! Grab a warm rock!", "Hey hey! Sun's out, study's on!"],
          morning: ["Good morning! Time to warm up in the sun!", "Morning! I sneezed three times, so it's a great day!"],
          night: ["Rocks are cooling down. Bedtime soon?", "Sleeping in a cozy pile tonight. You rest too!"],
          focus: ["Basking quietly beside you.", "Still as a rock. Focused as one too."],
          done: ["Achoo! That was a great session!", "Done! Big happy sunbathe!"],
          task: ["Achoo! Done!", "Checked off! Salty success!", "Another one! Iguana be proud!", "Yes! Tail wag!"],
          break: ["Break! Go find some sunshine!", "Stretch out on a warm rock for a bit!"]
        }
      }
    ]
  });

  /* ================= Savanna Sunset ================= */
  COMP_DATA.push({
    theme: "savanna",
    companions: [
      {
        id: "savanna-peanut", name: "Peanut", kind: "Baby Elephant", pose: "stand", wearColor: "#D27A2A",
        bio: "Never forgets a due date.",
        idle: ["earTwitch", "tailSwish", "topBob"], cheer: "bounce",
        parts: {
          earL: {svg: `${LG("savanna-peanut-e", [[0, "#C8C0CC"], [1, "#9A92A2"]])}<path d="M40 46C22 36 10 52 14 68C18 82 32 80 42 70Z" fill="url(#savanna-peanut-e)" ${O}/><path d="M38 52C26 46 19 56 22 66C25 74 32 72 38 66Z" fill="#F6B8C4"/>`, pivot: [40, 58]},
          earR: {svg: `${LG("savanna-peanut-e2", [[0, "#C8C0CC"], [1, "#9A92A2"]])}<path d="M80 46C98 36 110 52 106 68C102 82 88 80 78 70Z" fill="url(#savanna-peanut-e2)" ${O}/><path d="M82 52C94 46 101 56 98 66C95 74 88 72 82 66Z" fill="#F6B8C4"/>`, pivot: [80, 58]},
          tail: {svg: `${LINE("M84 92Q94 94 96 102", "#9A92A2", 2.6)}<path d="M94 100l3 6l2-5z" fill="${INK}"/>`, pivot: [84, 92]},
          feet: `<rect x="40" y="94" width="15" height="16" rx="6" fill="#A8A0B0" ${O}/><rect x="65" y="94" width="15" height="16" rx="6" fill="#A8A0B0" ${O}/><path d="M43 108h3M49 108h3M68 108h3M74 108h3" stroke="#F2EEF4" stroke-width="2" stroke-linecap="round"/>`,
          body: `${RG("savanna-peanut-b", [[0, "#E2DCE6"], [0.6, "#B8B0C0"], [1, "#948CA0"]], 0.42, 0.3, 0.8)}
            <ellipse cx="60" cy="86" rx="27" ry="19" fill="url(#savanna-peanut-b)" ${O}/>
            <circle cx="60" cy="54" r="25" fill="url(#savanna-peanut-b)" ${O}/>${shine(46, 40, 6, 3, -35)}`,
          face: `${LINE("M60 62C58 74 56 84 62 88C68 90 72 86 69 81", "#B0A8B8", 7.4)}<path d="M57 68h6M56.5 74h6.4M57 80h6" stroke="#948CA0" stroke-width="1.4" stroke-linecap="round"/>`,
          top: {svg: `<path d="M56 31Q54 24 58 22M60 30Q60 22 64 20M64 31Q67 25 70 25" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`, pivot: [60, 31]}
        },
        eyes: {lx: 48, rx: 72, y: 52, r: 3.8, style: "dot", color: "#2B2233"},
        mouth: {x: 48, y: 69, w: 2.4},
        cheeks: {lx: 43, rx: 77, y: 61, w: 4.4, h: 2.7, color: "#FF9AB0"},
        anchors: {top: [60, 30, 0.95], neck: [60, 80, 1.1], chest: [76, 90, 0.68], back: [86, 80, 0.8], hands: [60, 94, 0.85]},
        lines: {
          tap: ["Hi! I remembered you'd come. I always remember!", "You're doing great, and I'll never forget it!", "Big ears, big heart, big cheers!", "Trunk up for your hard work!", "Let's stomp through this list together!", "I never forget a due date. Or a friend!", "Splash of encouragement coming your way!", "Step by step, like a little elephant."],
          pet: ["Hehe! My ears are flapping with joy!", "Ooh, trunk hug for you!"],
          hello: ["You're back! I knew you would be!", "Hi hi! I saved you some shade!"],
          morning: ["Good morning! Sun's up, ears up!", "Morning! I remembered everything for today!"],
          night: ["The stars are out over the acacias. Rest soon?", "Sleepy ears. Goodnight soon, okay?"],
          focus: ["Standing quietly right here with you.", "Big ears, listening, focusing."],
          done: ["What a session! Trumpet toot!", "Done! I'll remember this one forever!"],
          task: ["Toot toot! Done!", "Checked off! Big happy splash!", "Another one! Unforgettable!", "Yes! Ears flapping hooray!"],
          break: ["Break! Have a big drink of water!", "Shake it out! Flap those ears!"]
        }
      },
      {
        id: "savanna-stretch", name: "Stretch", kind: "Giraffe Calf", pose: "stand", wearColor: "#4E9A4E",
        bio: "Can see your deadlines coming from miles away.",
        idle: ["headTilt", "tailSwish", "earTwitch"], cheer: "hop",
        neck: [60, 54],
        parts: {
          tail: {svg: `${LINE("M40 80Q30 84 30 96", "#C88A3A", 2.4)}<path d="M28 94l2 7l3-6z" fill="#6A4A2A" ${OW(1.6)}/>`, pivot: [41, 80]},
          feet: `${["M46 88V108", "M54 88V109", "M66 88V109", "M74 88V108"].map(d => `<path d="${d}" stroke="${INK}" stroke-width="8.4" stroke-linecap="round"/><path d="${d}" stroke="#F2C46A" stroke-width="4.8" stroke-linecap="round"/>`).join("")}<g fill="#6A4A2A"><rect x="42.6" y="106" width="7" height="4.4" rx="1.6"/><rect x="50.6" y="107" width="7" height="4.4" rx="1.6"/><rect x="62.6" y="107" width="7" height="4.4" rx="1.6"/><rect x="70.6" y="106" width="7" height="4.4" rx="1.6"/></g>`,
          body: `${LG("savanna-stretch-b", [[0, "#FFD88A"], [1, "#E8A84A"]])}
            <ellipse cx="60" cy="82" rx="22" ry="12" fill="url(#savanna-stretch-b)" ${O}/>
            <path d="M52 82C52 70 53 58 54 48H66C67 58 68 70 68 82Z" fill="url(#savanna-stretch-b)" ${O}/>
            <path d="M66.6 50C67.4 60 68 70 68.4 78" fill="none" stroke="#B87A3A" stroke-width="3" stroke-linecap="round"/>
            <g fill="#C8803A"><ellipse cx="57" cy="64" rx="3" ry="2.6"/><ellipse cx="62" cy="72" rx="2.6" ry="2.4"/><ellipse cx="58" cy="56" rx="2.2" ry="2"/><ellipse cx="48" cy="82" rx="3.2" ry="2.6"/><ellipse cx="70" cy="86" rx="3" ry="2.4"/><ellipse cx="60" cy="88" rx="2.4" ry="2"/></g>`,
          earL: {svg: `<ellipse cx="38" cy="33" rx="8" ry="4" transform="rotate(-18 38 33)" fill="#F2C46A" ${O2}/><ellipse cx="38" cy="33" rx="4.4" ry="1.8" transform="rotate(-18 38 33)" fill="#F6B0B8"/>`, pivot: [44, 35]},
          earR: {svg: `<ellipse cx="82" cy="33" rx="8" ry="4" transform="rotate(18 82 33)" fill="#F2C46A" ${O2}/><ellipse cx="82" cy="33" rx="4.4" ry="1.8" transform="rotate(18 82 33)" fill="#F6B0B8"/>`, pivot: [76, 35]},
          head: `${RG("savanna-stretch-h", [[0, "#FFE6A8"], [0.6, "#F6C870"], [1, "#E0A04A"]], 0.42, 0.3, 0.8)}
            ${LINE("M53 24V15", "#C88A3A", 2.6)}${LINE("M67 24V15", "#C88A3A", 2.6)}<circle cx="53" cy="14" r="3.4" fill="#8A5A30" ${O2}/><circle cx="67" cy="14" r="3.4" fill="#8A5A30" ${O2}/>
            <path d="M42 36C42 26 50 21 60 21C70 21 78 26 78 36C78 46 72 54 60 54C48 54 42 46 42 36Z" fill="url(#savanna-stretch-h)" ${O}/>
            <g fill="#C8803A" opacity=".8"><circle cx="50" cy="27" r="2"/><circle cx="71" cy="29" r="1.6"/></g>`,
          face: `<ellipse cx="60" cy="46" rx="11" ry="7" fill="#F8DDA8" ${OW(1.8)}/><ellipse cx="56" cy="45" rx="1.2" ry="1.5" fill="${INK}"/><ellipse cx="64" cy="45" rx="1.2" ry="1.5" fill="${INK}"/>`
        },
        eyes: {lx: 52, rx: 68, y: 35, r: 3.4, style: "dot", color: "#2B1A10"},
        mouth: {x: 60, y: 50, w: 2.4, color: "#2B1A10"},
        cheeks: {lx: 46, rx: 74, y: 42, w: 3.4, h: 2.2, color: "#FF9A9A"},
        anchors: {top: [60, 18, 0.8], neck: [60, 56, 0.8], chest: [66, 84, 0.58], back: [78, 78, 0.72], hands: [60, 88, 0.8]},
        lines: {
          tap: ["Hi from up here! I can see your progress!", "I spy a deadline... and you're way ahead of it!", "You're reaching new heights!", "Long neck, long list, no problem!", "Head held high, you're doing great!", "The view is lovely, and so is your work!", "Stretch for it! You've got this!"],
          pet: ["Hehe! You reached all the way up!", "Ooh, right behind the ears!"],
          hello: ["You're back! I saw you coming from miles away!", "Hi! The view's better with you here!"],
          morning: ["Good morning! I can see the whole day from here!", "Morning! Tall plans, sunny skies!"],
          night: ["Folding my legs for the night. You rest too!", "The moon's up over the acacias. Sleepy time."],
          focus: ["Keeping a lookout while you focus.", "Quiet up here. You've got this."],
          done: ["What a session! Sky-high work!", "Done! I'm standing extra tall!"],
          task: ["Done! Way up high!", "Checked off! I saw it from here!", "Another one! Reaching new heights!", "Yes! Happy hoof dance!"],
          break: ["Break! Stretch that neck!", "Look far away for a bit. Rest your eyes!"]
        }
      },
      {
        id: "savanna-sentry", name: "Sentry", kind: "Meerkat Pup", pose: "stand", wearColor: "#D27A2A",
        bio: "Stands guard while you focus, then reports all clear.",
        idle: ["headTilt", "topBob", "bounce"], cheer: "hop",
        neck: [60, 64],
        parts: {
          tail: {svg: `${LINE("M70 104Q88 108 90 92", "#C8A06E", 3.2)}<circle cx="90" cy="90" r="2.4" fill="#5A3A28"/>`, pivot: [70, 104]},
          feet: `<ellipse cx="50" cy="109" rx="7.4" ry="3.6" fill="#B8905E" ${O}/><ellipse cx="70" cy="109" rx="7.4" ry="3.6" fill="#B8905E" ${O}/>`,
          body: `${LG("savanna-sentry-b", [[0, "#ECD2A6"], [1, "#B88E5C"]])}
            <path d="M42 108C38 94 40 72 48 64H72C80 72 82 94 78 108Z" fill="url(#savanna-sentry-b)" ${O}/>
            <ellipse cx="60" cy="92" rx="10" ry="14" fill="#F6E6C8"/>`,
          armL: {svg: `<path d="M48 72Q42 78 50 82" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M48 72Q42 78 50 82" fill="none" stroke="#C8A06E" stroke-width="4.4" stroke-linecap="round"/>`, pivot: [49, 71]},
          armR: {svg: `<path d="M72 72Q78 78 70 82" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M72 72Q78 78 70 82" fill="none" stroke="#C8A06E" stroke-width="4.4" stroke-linecap="round"/>`, pivot: [71, 71]},
          earL: {svg: `<circle cx="39" cy="40" r="4.6" fill="#6A4A32" ${O2}/>`, pivot: [42, 42]},
          earR: {svg: `<circle cx="81" cy="40" r="4.6" fill="#6A4A32" ${O2}/>`, pivot: [78, 42]},
          head: `${LG("savanna-sentry-h", [[0, "#EED6AA"], [1, "#BE9460"]])}
            <path d="M40 46C40 33 49 27 60 27C71 27 80 33 80 46C80 56 70 66 60 66C50 66 40 56 40 46Z" fill="url(#savanna-sentry-h)" ${O}/>
            <path d="M52 30Q56 33 60 30Q64 33 68 30" fill="none" stroke="#9A7046" stroke-width="1.8" stroke-linecap="round"/>`,
          face: `<ellipse cx="51" cy="45" rx="6.4" ry="5.4" fill="#5A3A28"/><ellipse cx="69" cy="45" rx="6.4" ry="5.4" fill="#5A3A28"/>
            <ellipse cx="60" cy="56" rx="7" ry="5" fill="#F6E6C8"/><ellipse cx="60" cy="54.4" rx="2.4" ry="1.7" fill="${INK}"/>`,
          top: {svg: `<path d="M56 29Q57 21 61 19Q60 24 63 28" fill="#BE9460" ${O2}/>`, pivot: [60, 29]}
        },
        eyes: {lx: 51, rx: 69, y: 45, r: 4, style: "round", color: "#1A1008"},
        mouth: {x: 60, y: 59.5, w: 2.2, color: "#2B1A10"},
        cheeks: {lx: 45, rx: 75, y: 54, w: 3.4, h: 2.2, color: "#FF9A9A"},
        anchors: {top: [60, 27, 0.9], neck: [60, 66, 0.92], chest: [70, 88, 0.6], back: [80, 84, 0.75], hands: [60, 90, 0.8]},
        lines: {
          tap: ["Reporting for duty! All clear!", "Lookout says: you're doing great!", "Scanning the horizon... yep, you're amazing.", "I've got your back, you focus!", "No distractions in sight. Carry on!", "Standing tall for you!", "Perimeter secure, progress excellent!", "Sentry on watch, you on task!"],
          pet: ["Hehe! Off duty for one second!", "Ooh, a pat! Still on watch though!"],
          hello: ["You're back! Lookout post ready!", "Hi! I kept watch while you were away!"],
          morning: ["Good morning! First watch of the day!", "Morning! Sun's up, eyes open!"],
          night: ["Night shift is quiet. Time to rest soon.", "All clear for sleeping. Goodnight soon!"],
          focus: ["On guard. You focus, I'll watch.", "Shh. Keeping lookout for you."],
          done: ["Report: session complete! Excellent work!", "All clear! What a session!"],
          task: ["Done! Reporting a win!", "Checked off! Lookout approves!", "Another one! Mission success!", "Yes! All clear and happy!"],
          break: ["Break time! I'll stand watch!", "Stretch up tall like a meerkat!"]
        }
      }
    ]
  });
})();
