/* Study Companions, new theme ideas batch n10: icecave, geysers. Each theme has one nature-object companion and two young animals. */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const shine = (x, y, rx, ry, a) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})" fill="#fff" opacity=".75"/>`;

  /* ================= Blue Ice Cave ================= */
  COMP_DATA.push({
    theme: "icecave",
    companions: [
      {
        id: "icecave-glint", name: "Shard", kind: "Ice Crystal", pose: "stand", wearColor: "#2A9CC4",
        bio: "A little crystal of glacier ice. Catches the light and throws it back as a grin.",
        idle: ["sparkle", "topBob", "sway"], cheer: "spin",
        parts: {
          feet: `<ellipse cx="50" cy="106" rx="7.4" ry="4.4" fill="#7FD0EA" ${O}/><ellipse cx="70" cy="106" rx="7.4" ry="4.4" fill="#7FD0EA" ${O}/>`,
          body: `${LG("icecave-glint-b", [[0, "#ECFDFF"], [0.5, "#A6E8F5"], [1, "#56BCDE"]])}
            <path d="M60 28L83 42V90L60 104L37 90V42Z" fill="url(#icecave-glint-b)" ${O}/>
            <path d="M60 52L83 42V90L60 104Z" fill="#2E8EBE" opacity=".16"/>
            <path d="M60 28L83 42L60 52L37 42Z" fill="#fff" opacity=".55"/>
            <path d="M37.5 42L60 52L82.5 42" fill="none" stroke="#5AB4D8" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M43 50V64M43 70V74" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".9"/>
            <path d="M77 82l-3 5M73 92l-2.4 3" stroke="#3E9CC4" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>`,
          armL: {svg: `<path d="M39 64L24 71L29 81L39 76Z" fill="#A6E8F5" ${O}/><path d="M27 72.5L35 69" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>`, pivot: [38, 70]},
          armR: {svg: `<path d="M81 64L96 71L91 81L81 76Z" fill="#8EDCEE" ${O}/><path d="M85 69L93 72.5" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6"/>`, pivot: [82, 70]},
          top: {svg: `<path d="M60 6Q61.4 14.6 70 16Q61.4 17.4 60 26Q58.6 17.4 50 16Q58.6 14.6 60 6Z" fill="#FFF4B0" ${OW(2)}/><circle cx="70" cy="7" r="2" fill="#FFF4B0" ${OW(1.4)}/>`, pivot: [60, 27]}
        },
        eyes: {lx: 51, rx: 69, y: 68, r: 4.2, style: "sparkle", color: "#163450"},
        mouth: {x: 60, y: 79, w: 3, color: "#163450"},
        cheeks: {lx: 44, rx: 76, y: 77, w: 4, h: 2.4, color: "#FF9AB8"},
        anchors: {top: [60, 30, 0.8], neck: [60, 92, 0.95], chest: [72, 90, 0.6], back: [84, 66, 0.8], hands: [60, 94, 0.85]},
        lines: {
          tap: ["Hi! I'm Shard. I sparkle when you work hard.", "You're crystal clear today!", "Cool, calm and collected. That's us!", "Every task makes me shine a bit brighter.", "You've got a brilliant mind, you know.", "Hold steady. Good ideas take shape slowly.", "Clear head, clear plan. Let's go!", "I believe in you, facet by facet."],
          pet: ["Hehe! That makes me glitter!", "Ooh, careful, I'm a little cold!"],
          hello: ["You're back! The cave lit up!", "Hello, friend! Ready to shine?"],
          morning: ["Good morning! The light's coming through!", "Morning! Fresh ice, fresh start!"],
          night: ["The cave's gone blue and quiet. Rest soon?", "Even crystals need a little dark."],
          focus: ["Glowing quietly beside you.", "Still and clear. You've got this."],
          done: ["What a session! I'm all sparkles!", "Done! You polished that right up!"],
          task: ["Clink! One more done!", "Checked off! Shine on!", "Yes! Crystal clear work!", "Done and dazzling!"],
          break: ["Break time! Stretch and sip some water.", "Rest a moment. Let your mind melt a bit."]
        }
      },
      {
        id: "icecave-frost", name: "Frost", kind: "Arctic Fox Kit", pose: "sit", wearColor: "#2A9CC4",
        bio: "Curls up in its own tail when it's cold. Perks right up for you.",
        idle: ["earTwitch", "tailSwish", "headTilt"], cheer: "hop",
        neck: [60, 74],
        parts: {
          tail: {svg: `${RG("icecave-frost-t", [[0, "#FFFFFF"], [0.6, "#EEF3FA"], [1, "#C4D2E6"]], 0.4, 0.4, 0.8)}
            <path d="M74 106C88 108 101 99 103 84C104 73 99 65 92 64C87 70 90 79 86 87C83 93 78 95 72 95Z" fill="url(#icecave-frost-t)" ${O}/>
            <path d="M94 74q-2 4 0 8M98 86q-3 3 -2 7" fill="none" stroke="#B4C6DE" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [76, 101]},
          feet: `<ellipse cx="46" cy="108" rx="8.6" ry="4.6" fill="#F4F7FC" ${O}/><ellipse cx="74" cy="108" rx="8.6" ry="4.6" fill="#F4F7FC" ${O}/>
            <path d="M43 109.6v-2.4M47 110.2v-2.4M73 110.2v-2.4M77 109.6v-2.4" stroke="#B4C6DE" stroke-width="1.4" stroke-linecap="round"/>`,
          body: `${RG("icecave-frost-b", [[0, "#FFFFFF"], [0.6, "#EEF3FA"], [1, "#C4D2E6"]], 0.42, 0.3, 0.8)}
            <path d="M40 101C36 90 40 78 50 74H70C80 78 84 90 80 101C78 106 70 107 60 107C50 107 42 106 40 101Z" fill="url(#icecave-frost-b)" ${O}/>
            <path d="M50 78L54 87L57 81L60 90L63 81L66 87L70 78Z" fill="#FFFFFF"/>`,
          armL: {svg: `<ellipse cx="42.6" cy="92" rx="5.6" ry="9" transform="rotate(18 42.6 92)" fill="#EEF3FA" ${O}/><path d="M38.4 98.4l-.6 1.8M41.4 99.4l-.4 1.8" stroke="#A8BCD8" stroke-width="1.3" stroke-linecap="round"/>`, pivot: [46, 83]},
          armR: {svg: `<ellipse cx="77.4" cy="92" rx="5.6" ry="9" transform="rotate(-18 77.4 92)" fill="#EEF3FA" ${O}/><path d="M81.6 98.4l.6 1.8M78.6 99.4l.4 1.8" stroke="#A8BCD8" stroke-width="1.3" stroke-linecap="round"/>`, pivot: [74, 83]},
          earL: {svg: `<path d="M38 46C33 36 33 27 36 22C43 23 50 29 54 37Z" fill="#F4F7FC" ${O}/><path d="M39.6 40C37.4 34 37.4 29.4 38.6 26.4C42 27.6 46 31 48.4 35Z" fill="#F7B8C4"/>`, pivot: [45, 40]},
          earR: {svg: `<path d="M82 46C87 36 87 27 84 22C77 23 70 29 66 37Z" fill="#F4F7FC" ${O}/><path d="M80.4 40C82.6 34 82.6 29.4 81.4 26.4C78 27.6 74 31 71.6 35Z" fill="#F7B8C4"/>`, pivot: [75, 40]},
          head: `${RG("icecave-frost-h", [[0, "#FFFFFF"], [0.6, "#F0F4FA"], [1, "#C8D4E8"]], 0.42, 0.3, 0.8)}
            <path d="M60 32C75 32 86 41 86 53L92 58L85 62L89 68L79 69C74 74 67 76 60 76C53 76 46 74 41 69L31 68L35 62L28 58L34 53C34 41 45 32 60 32Z" fill="url(#icecave-frost-h)" ${O}/>
            <ellipse cx="60" cy="63.4" rx="9.6" ry="6.8" fill="#FFFFFF" ${OW(1.8)}/>
            <path d="M56.6 58.8Q60 57.6 63.4 58.8Q62.6 62 60 62.4Q57.4 62 56.6 58.8Z" fill="${INK}"/><circle cx="58.8" cy="59" r=".8" fill="#fff"/>
            <path d="M44 40q4-3 8-2" fill="none" stroke="#C8D4E8" stroke-width="1.6" stroke-linecap="round"/>${shine(45, 43, 4, 2, -35)}`
        },
        eyes: {lx: 49, rx: 71, y: 51.4, r: 4.4, style: "sparkle", color: "#22304A"},
        mouth: {x: 60, y: 65.6, w: 2.2, style: "cat", color: "#22304A"},
        cheeks: {lx: 42, rx: 78, y: 60, w: 4, h: 2.4, color: "#FF9AB4"},
        anchors: {top: [60, 33, 0.85], neck: [60, 76, 1], chest: [68, 90, 0.6], back: [80, 84, 0.8], hands: [60, 98, 0.85]},
        lines: {
          tap: ["Hi! My ears heard you coming a mile away.", "Cold outside, cozy in here. Let's study!", "You're doing great. My tail is all fluffed up!", "Pounce on that next task!", "Quick paws, sharp mind. That's us!", "Even in a blizzard, you keep going. Wow.", "I'll keep your toes warm while you work."],
          pet: ["Hehe! So fluffy, right?", "Mmm, right behind the ears!"],
          hello: ["You're back! I trotted all the way here!", "Hi! I kept a warm spot by the ice for you."],
          morning: ["Good morning! Fresh snow, fresh paw prints!"],
          night: ["The aurora's out. Curl up and rest soon."],
          focus: ["Curled up quietly right beside you.", "Ears up, eyes on the goal. Go!"],
          done: ["What a session! Happy fox hop!", "All done! You were so quick!"],
          task: ["Pounce! Another one done!", "Got it! Checked off!", "Swish! Nicely done!"],
          break: ["Break time! Stretch like a fox in the sun."]
        }
      },
      {
        id: "icecave-hopper", name: "Hopper", kind: "Snowshoe Hare Leveret", pose: "sit", wearColor: "#5A8AD0",
        bio: "Its big white feet work like snowshoes. Never sinks, never quits.",
        idle: ["earTwitch", "wave", "headTilt"], cheer: "hop",
        neck: [60, 74],
        parts: {
          tail: {svg: `<circle cx="85" cy="99" r="6.6" fill="#FFFFFF" ${O}/>`, pivot: [80, 100]},
          body: `${RG("icecave-hopper-b", [[0, "#ECCEA6"], [0.6, "#CDA072"], [1, "#A47C52"]], 0.42, 0.3, 0.8)}
            <path d="M40 102C37 88 42 72 60 72C78 72 83 88 80 102C78 108 70 109.4 60 109.4C50 109.4 42 108 40 102Z" fill="url(#icecave-hopper-b)" ${O}/>
            <ellipse cx="60" cy="93" rx="12" ry="12.6" fill="#FFF8EE"/>
            <ellipse cx="44" cy="107.6" rx="13" ry="5.4" fill="#FAFBFD" ${O}/><ellipse cx="76" cy="107.6" rx="13" ry="5.4" fill="#FAFBFD" ${O}/>
            <path d="M36 109.6v-2.4M40 110.6v-2.4M44 110.8v-2.4M76 110.8v-2.4M80 110.6v-2.4M84 109.6v-2.4" stroke="#B8C4D6" stroke-width="1.4" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="43.4" cy="89" rx="5" ry="8.6" transform="rotate(16 43.4 89)" fill="#CDA072" ${O}/><ellipse cx="41.4" cy="95.4" rx="3.8" ry="3" transform="rotate(16 41.4 95.4)" fill="#FAFBFD" ${OW(1.8)}/>`, pivot: [46, 80]},
          armR: {svg: `<ellipse cx="76.6" cy="89" rx="5" ry="8.6" transform="rotate(-16 76.6 89)" fill="#CDA072" ${O}/><ellipse cx="78.6" cy="95.4" rx="3.8" ry="3" transform="rotate(-16 78.6 95.4)" fill="#FAFBFD" ${OW(1.8)}/>`, pivot: [74, 80]},
          earL: {svg: `<path d="M51 38C44 30 40 18 42 10C44 4 51 5 53 13C55 21 56 30 55 38Z" fill="#D4AA7A" ${O}/><path d="M52.4 32C48.6 26 46.6 19 47.4 14.4C49 12 51.2 13 52 16.4C53.2 22 53.8 27 53.2 32Z" fill="#F7C0C4"/><path d="M42.4 11.4C43.6 5.6 50.4 4.6 52.6 11.6C49.2 10.4 45.6 10.4 42.4 11.4Z" fill="#5A4234"/>`, pivot: [53, 37]},
          earR: {svg: `<path d="M69 38C76 30 80 18 78 10C76 4 69 5 67 13C65 21 64 30 65 38Z" fill="#D4AA7A" ${O}/><path d="M67.6 32C71.4 26 73.4 19 72.6 14.4C71 12 68.8 13 68 16.4C66.8 22 66.2 27 66.8 32Z" fill="#F7C0C4"/><path d="M77.6 11.4C76.4 5.6 69.6 4.6 67.4 11.6C70.8 10.4 74.4 10.4 77.6 11.4Z" fill="#5A4234"/>`, pivot: [67, 37]},
          head: `${RG("icecave-hopper-h", [[0, "#F2D6B0"], [0.6, "#D4AA7A"], [1, "#AC8458"]], 0.42, 0.3, 0.8)}
            <ellipse cx="60" cy="53" rx="22" ry="19" fill="url(#icecave-hopper-h)" ${O}/>
            <path d="M48 61C48 55 54 53 60 55C66 53 72 55 72 61C72 67 66 70.6 60 70.6C54 70.6 48 67 48 61Z" fill="#FFF8EE"/>
            <path d="M57.6 58.4Q60 57.4 62.4 58.4Q61.6 60.6 60 61Q58.4 60.6 57.6 58.4Z" fill="#E87A8A" ${OW(1.2)}/>
            <path d="M47 62.6l-6 -1M47 65l-5.6 1.4M73 62.6l6 -1M73 65l5.6 1.4" stroke="#8A6A4A" stroke-width="1.2" stroke-linecap="round"/>${shine(46, 42, 4.4, 2.2, -35)}`
        },
        eyes: {lx: 50, rx: 70, y: 50, r: 4.4, style: "sparkle", color: "#2B1A10"},
        mouth: {x: 60, y: 63.6, w: 2, style: "cat", color: "#5A3A2A"},
        cheeks: {lx: 43, rx: 77, y: 58, w: 3.8, h: 2.3, color: "#FF9AA6"},
        anchors: {top: [60, 35, 0.85], neck: [60, 74, 0.95], chest: [68, 90, 0.6], back: [80, 84, 0.8], hands: [60, 96, 0.85]},
        lines: {
          tap: ["Hi! Did you see my feet? They're snowshoes!", "Hop, hop, hop. One task at a time.", "You never sink in deep snow. Or deep work!", "My ears are up. I'm all yours!", "You're doing great. I'm doing a happy thump.", "Quick hop to the next one? Let's go!", "Soft paws, big leaps. You've got this!"],
          pet: ["Hehe! Mind the ears!", "Ooh, my nose is twitching with joy!"],
          hello: ["You're back! I hopped right over!", "Hi! Fresh snow and fresh notes today."],
          morning: ["Good morning! I'm up and hopping!"],
          night: ["The aurora is glowing. Burrow in soon, okay?"],
          focus: ["Sitting very still right beside you.", "Ears up, focus on. You've got this."],
          done: ["What a session! Binky time!", "All done! You leapt right through it!"],
          task: ["Hop! Another one done!", "Thump thump! Checked off!", "Boing! Well done!"],
          break: ["Break time! Have a little hop and stretch."]
        }
      }
    ]
  });

  /* ================= Geyser Basin ================= */
  COMP_DATA.push({
    theme: "geysers",
    companions: [
      {
        id: "geysers-bisby", name: "Bisby", kind: "Bison Calf", pose: "stand", wearColor: "#4E9A5A",
        bio: "A little red calf with a curly forelock. Stands firm through any storm.",
        idle: ["headTilt", "tailSwish", "earTwitch"], cheer: "hop",
        neck: [60, 74],
        parts: {
          tail: {svg: `${LINE("M80 89Q90 87.4 93 97.6", "#C46A32", 2.4)}<path d="M90.6 96.4C88.8 100 90.2 105 93.8 105.4C97.2 104.8 97.6 100 95.6 96.6Z" fill="#6A3A22" ${OW(1.8)}/>`, pivot: [80, 89]},
          feet: `<g fill="#A85A2A" ${O}><rect x="35" y="90" width="11" height="18" rx="5"/><rect x="74" y="90" width="11" height="18" rx="5"/></g>
            <g fill="#C8763C" ${O}><rect x="45" y="93" width="12" height="18" rx="5.5"/><rect x="63" y="93" width="12" height="18" rx="5.5"/></g>
            <path d="M47.6 107.4h6.8M65.6 107.4h6.8M37.6 104.6h5.8M76.6 104.6h5.8" stroke="#4A2A1A" stroke-width="3" stroke-linecap="round"/>`,
          body: `${RG("geysers-bisby-b", [[0, "#F4B67C"], [0.6, "#DA8A4C"], [1, "#B86A34"]], 0.42, 0.3, 0.8)}
            <ellipse cx="60" cy="87" rx="26" ry="16" fill="url(#geysers-bisby-b)" ${O}/>
            <path d="${puff(60, 79, 10.4, 8, 1.2)}" fill="#C46E34" ${O2}/>`,
          earL: {svg: `<ellipse cx="32.6" cy="49" rx="7.6" ry="4.4" transform="rotate(-18 32.6 49)" fill="#C8763C" ${O}/><ellipse cx="33.4" cy="49.2" rx="4" ry="2" transform="rotate(-18 33.4 49.2)" fill="#F2A8A0"/>`, pivot: [39, 49]},
          earR: {svg: `<ellipse cx="87.4" cy="49" rx="7.6" ry="4.4" transform="rotate(18 87.4 49)" fill="#C8763C" ${O}/><ellipse cx="86.6" cy="49.2" rx="4" ry="2" transform="rotate(18 86.6 49.2)" fill="#F2A8A0"/>`, pivot: [81, 49]},
          head: `${RG("geysers-bisby-h", [[0, "#F8C690"], [0.6, "#E09656"], [1, "#BE6E36"]], 0.42, 0.3, 0.8)}
            <path d="M37 52C36 39 46 30 60 30C74 30 84 39 83 52C82 64 74 72 60 72C46 72 38 64 37 52Z" fill="url(#geysers-bisby-h)" ${O}/>
            <path d="M44.6 37Q40.6 31 43.6 28.4Q48.6 30 49 35.4Z" fill="#4A2E22" ${O2}/><path d="M75.4 37Q79.4 31 76.4 28.4Q71.4 30 71 35.4Z" fill="#4A2E22" ${O2}/>
            <path d="M47.6 62C47.6 56 53 54 60 54C67 54 72.4 56 72.4 62C72.4 68 67 71.6 60 71.6C53 71.6 47.6 68 47.6 62Z" fill="#B88062" ${O2}/>
            <ellipse cx="55.4" cy="59.6" rx="1.8" ry="1.3" fill="#3A1E14"/><ellipse cx="64.6" cy="59.6" rx="1.8" ry="1.3" fill="#3A1E14"/>`,
          top: {svg: `<path d="${puff(60, 32, 8.4, 7, 1.25)}" fill="#A85A2A" ${O2}/><path d="M56.6 31q1.6-2.6 3.6-.6M61 33.6q1.6-2.4 3.4-.4" fill="none" stroke="#D88A4C" stroke-width="1.4" stroke-linecap="round"/>`, pivot: [60, 37]}
        },
        eyes: {lx: 49, rx: 71, y: 47, r: 4.2, style: "sparkle", color: "#2B1A10"},
        mouth: {x: 60, y: 66, w: 2.6, color: "#3A1E14"},
        cheeks: {lx: 41, rx: 79, y: 55, w: 4, h: 2.4, color: "#FF8A8A"},
        anchors: {top: [60, 26, 0.85], neck: [60, 74, 1], chest: [68, 88, 0.6], back: [78, 80, 0.8], hands: [60, 92, 0.85]},
        lines: {
          tap: ["Hi! Did you see my forelock? It's extra curly.", "Head down, hooves steady. That's the way.", "You're tougher than a prairie winter!", "Little calf, big heart. Just like you.", "Steam's up, spirits up! Let's go!", "One step, then another. We'll get there.", "I believe in you, all the way down to my hooves!"],
          pet: ["Hehe! You found my fluffy spot!", "Mmm, scratch the curly bit!"],
          hello: ["You're back! I trotted over the boardwalk!", "Hi! The geysers are puffing hello too."],
          morning: ["Good morning! Frosty grass and warm steam!"],
          night: ["The stars are out over the basin. Rest soon."],
          focus: ["Standing steady right beside you.", "Head down, full focus. You've got this."],
          done: ["What a session! Happy calf kick!", "All done! You stood firm the whole way!"],
          task: ["Stomp! Another one done!", "Yes! Checked off!", "Hooves up! Well done!"],
          break: ["Break time! Have a good roll in the grass."]
        }
      },
      {
        id: "geysers-prism", name: "Sinter", kind: "Prismatic Pebble", pose: "sit", wearColor: "#E0782E",
        bio: "A warm sinter pebble with a tiny rainbow pool on top. Very proud of its colors.",
        idle: ["sparkle", "topBob", "sway"], cheer: "bounce",
        parts: {
          body: `${RG("geysers-prism-b", [[0, "#FCFAF4"], [0.6, "#E4DED2"], [1, "#B8AE9E"]], 0.42, 0.3, 0.8)}
            <path d="M60 52C84 52 96 70 96 86C96 102 82 110 60 110C38 110 24 102 24 86C24 70 36 52 60 52Z" fill="url(#geysers-prism-b)" ${O}/>
            <ellipse cx="60" cy="66" rx="22" ry="7.4" fill="#E58A3E" ${O2}/><ellipse cx="60" cy="66" rx="18" ry="5.9" fill="#F2C54E"/><ellipse cx="60" cy="66" rx="14.6" ry="4.7" fill="#62BC98"/>
            <ellipse cx="60" cy="66" rx="12" ry="3.8" fill="#3EB0D2"/><ellipse cx="60.5" cy="65.7" rx="7.6" ry="2.4" fill="#1D5EA6"/><path d="M52 64.4q3-1.4 6-1.2" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>
            <g fill="#A89C8C" opacity=".6"><circle cx="34" cy="96" r="1.5"/><circle cx="88" cy="94" r="1.4"/><circle cx="82" cy="104" r="1.2"/><circle cx="40" cy="78" r="1.2"/></g>
            ${shine(36, 76, 4, 2.2, -50)}`,
          armL: {svg: `<ellipse cx="26" cy="92" rx="5.6" ry="7" transform="rotate(28 26 92)" fill="#DCD4C6" ${O}/>`, pivot: [30, 88]},
          armR: {svg: `<ellipse cx="94" cy="92" rx="5.6" ry="7" transform="rotate(-28 94 92)" fill="#D2C8B8" ${O}/>`, pivot: [90, 88]},
          top: {svg: `${LINE("M60 62q-4-5 0-10t0-9", "#FFFFFF", 2.2)}${LINE("M70 62q-3-4 0-8", "#FFFFFF", 1.8)}`, pivot: [60, 63]}
        },
        eyes: {lx: 49, rx: 71, y: 86, r: 4, style: "dot", color: "#3A2E24"},
        mouth: {x: 60, y: 96, w: 2.8, color: "#3A2E24"},
        cheeks: {lx: 40, rx: 80, y: 94, w: 4.2, h: 2.5, color: "#FF9A8A"},
        anchors: {top: [60, 58, 0.85], neck: [60, 104, 1], chest: [74, 100, 0.6], back: [90, 80, 0.8], hands: [60, 102, 0.85]},
        lines: {
          tap: ["Hi! Want to see my little rainbow?", "You bring out my best colors!", "Warm heart, bright ideas. That's you!", "Small pebble, big pride in you!", "Every color on me is cheering for you!", "Steady and warm. That's how we do it.", "You're making today shine!"],
          pet: ["Hehe! My pool just rippled!", "Ooh, warm hands! Thank you!"],
          hello: ["You're back! My colors just got brighter!", "Hello! The basin missed you!"],
          morning: ["Good morning! Rainbows come out first thing!", "Morning! Toasty and ready!"],
          night: ["My pool glows softly at night. Rest well.", "Cooling off for the night. You too?"],
          focus: ["Sitting warm and quiet right here.", "Calm colors, calm mind."],
          done: ["What a session! I'm glowing every color!", "Done! That was beautifully layered work!"],
          task: ["Bloop! Done!", "Checked off! Rainbow hooray!", "Another one! So colorful!", "Yes! Bright work!"],
          break: ["Break time! Warm drink and a stretch?", "Rest a bit. Even geysers take their time."]
        }
      },
      {
        id: "geysers-marley", name: "Marley", kind: "Yellow-bellied Marmot", pose: "stand", wearColor: "#3E8AC4",
        bio: "A marmot pup who loves a warm rock and a long sunny study session.",
        idle: ["wave", "earTwitch", "tailSwish"], cheer: "hop",
        neck: [60, 68],
        parts: {
          tail: {svg: `<path d="M74 103C85 108 95 103 97 93C97.6 89 93.4 87.4 91.4 91C89 97 84 99 76 97Z" fill="#6E4A32" ${O}/><path d="M85 101q5-1 8-6" fill="none" stroke="#9A7050" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [76, 100]},
          feet: `<ellipse cx="48" cy="108.6" rx="8" ry="4" fill="#4E3424" ${O}/><ellipse cx="72" cy="108.6" rx="8" ry="4" fill="#4E3424" ${O}/>`,
          body: `${RG("geysers-marley-b", [[0, "#B8946C"], [0.6, "#8E6A48"], [1, "#6A4A32"]], 0.42, 0.3, 0.8)}
            <path d="M36 99C32 83 40 65 60 65C80 65 88 83 84 99C82 107 72 110.6 60 110.6C48 110.6 38 107 36 99Z" fill="url(#geysers-marley-b)" ${O}/>
            <path d="M46 103.6C42 92 48 78 60 78C72 78 78 92 74 103.6C70 108.6 50 108.6 46 103.6Z" fill="#F4C25E"/>
            <g fill="#C8A47E" opacity=".8"><circle cx="40.6" cy="84" r="1.2"/><circle cx="43" cy="92" r="1"/><circle cx="79.4" cy="84" r="1.2"/><circle cx="77" cy="92" r="1"/></g>`,
          armL: {svg: `<path d="M45 79Q42 86 48 91.4" fill="none" stroke="${INK}" stroke-width="10.4" stroke-linecap="round"/><path d="M45 79Q42 86 48 91.4" fill="none" stroke="#8E6A48" stroke-width="5.8" stroke-linecap="round"/><ellipse cx="49.6" cy="92" rx="4.4" ry="3.4" fill="#5E3E2A" ${OW(2.2)}/>`, pivot: [45, 78]},
          armR: {svg: `<path d="M75 79Q78 86 72 91.4" fill="none" stroke="${INK}" stroke-width="10.4" stroke-linecap="round"/><path d="M75 79Q78 86 72 91.4" fill="none" stroke="#8E6A48" stroke-width="5.8" stroke-linecap="round"/><ellipse cx="70.4" cy="92" rx="4.4" ry="3.4" fill="#5E3E2A" ${OW(2.2)}/>`, pivot: [75, 78]},
          earL: {svg: `<circle cx="41.6" cy="37" r="4.6" fill="#6E4A32" ${O}/><circle cx="42" cy="37.4" r="2" fill="#D8A080"/>`, pivot: [44, 39]},
          earR: {svg: `<circle cx="78.4" cy="37" r="4.6" fill="#6E4A32" ${O}/><circle cx="78" cy="37.4" r="2" fill="#D8A080"/>`, pivot: [76, 39]},
          head: `${RG("geysers-marley-h", [[0, "#C8A47C"], [0.6, "#A07A56"], [1, "#7A563A"]], 0.42, 0.3, 0.8)}
            <path d="M37 50C37 38 47 31 60 31C73 31 83 38 83 50C83 62 74 69 60 69C46 69 37 62 37 50Z" fill="url(#geysers-marley-h)" ${O}/>
            <path d="M41.4 43.6C42.6 36.4 50 32.6 60 32.6C70 32.6 77.4 36.4 78.6 43.6C71 40 49 40 41.4 43.6Z" fill="#5E3E2A"/>
            <path d="M56.4 44.6Q60 42.8 63.6 44.6L62.4 52.6H57.6Z" fill="#F6F0E4"/>
            <ellipse cx="60" cy="59" rx="9.4" ry="6.6" fill="#F6F0E4" ${OW(1.8)}/>
            <ellipse cx="60" cy="55.8" rx="2.6" ry="1.8" fill="${INK}"/><path d="M57.8 62.2h4.4v2.6q0 .9 -.9 .9h-2.6q-.9 0 -.9 -.9Z" fill="#fff" ${OW(1.1)}/><path d="M60 62.4v3.2" stroke="#C8C0B4" stroke-width=".8"/>${shine(45, 40, 3.6, 1.8, -35)}`
        },
        eyes: {lx: 49, rx: 71, y: 48.4, r: 4.2, style: "sparkle", color: "#2B1A10"},
        mouth: {x: 60, y: 60.6, w: 2.2, style: "cat", color: "#3A2418"},
        cheeks: {lx: 42, rx: 78, y: 57, w: 4, h: 2.4, color: "#FF9A8A"},
        anchors: {top: [60, 32, 0.85], neck: [60, 69, 0.95], chest: [68, 88, 0.6], back: [80, 82, 0.8], hands: [60, 94, 0.85]},
        lines: {
          tap: ["Hi! This rock is warm. Want to share?", "Sun's out, books out! Let's go!", "You're doing great! Happy whistle!", "Little paws, big progress.", "I stand up tall when I'm proud of you.", "Chubby cheeks, sharp mind. That's me!", "One more task, then we bask!"],
          pet: ["Hehe! My fur's all warm from the sun!", "Ooh, right on my fuzzy belly!"],
          hello: ["You're back! I popped out of my burrow!", "Hi! I kept a sunny rock warm for you."],
          morning: ["Good morning! Waiting for the sun to hit my rock."],
          night: ["Burrow time soon. The stars are out."],
          focus: ["Sitting up quietly right beside you.", "Lookout on duty. You focus!"],
          done: ["What a session! Big happy whistle!", "All done! Time for a sunbath!"],
          task: ["Wheet! Another one done!", "Yes! Checked off!", "Pop! Nicely done!"],
          break: ["Break time! Find a sunny spot and stretch."]
        }
      }
    ]
  });
})();
