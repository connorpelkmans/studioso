/* Study Companions, new theme ideas batch n9: bayou, karst. Every companion here is a little piece of nature, not an animal. */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const f1 = v => Math.round(v * 10) / 10;
  const shine = (x, y, rx, ry, a) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})" fill="#fff" opacity=".75"/>`;
  // a pointed petal or leaf from (cx, cy) along angle a (degrees), length L, half width w
  const petal = (cx, cy, a, L, w) => { const t = a * Math.PI / 180, c = Math.cos(t), s = Math.sin(t), P = (u, v) => `${f1(cx + u * c - v * s)} ${f1(cy + u * s + v * c)}`; return `M${P(0, 0)}Q${P(L * 0.42, -w)} ${P(L, 0)}Q${P(L * 0.42, w)} ${P(0, 0)}Z`; };

  /* ================= Firefly Bayou ================= */
  COMP_DATA.push({
    theme: "bayou",
    companions: [
      {
        id: "bayou-lily", name: "Lily", kind: "Water Lily", pose: "float", wearColor: "#5EA04E",
        bio: "Opens a petal for every task you finish. Closes them all at bedtime.",
        idle: ["topBob", "sway", "sparkle"], cheer: "spin",
        parts: {
          back: `${LG("bayou-lily-pad", [[0, "#8CC864"], [1, "#4E8A3A"]])}
            <path d="M60 100L74.4 109.4A42 10 0 1 0 56.3 110Z" fill="url(#bayou-lily-pad)" ${O}/>
            <path d="M60 100L30 96M60 100L42 108M60 100L90 96M60 100L84 106" stroke="#A6D884" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
            ${LG("bayou-lily-p", [[0, "#FFFFFF"], [1, "#FFB0C8"]], 0, 0, 0, 1)}
            ${[-90, -50, -130, -12, -168, 22, 158].map(a => `<path d="${petal(60, 72, a, 39, 14)}" fill="url(#bayou-lily-p)" ${O2}/>`).join("")}
            ${[-70, -110, -31, -149].map(a => `<path d="${petal(60, 72, a, 33, 11)}" fill="#FFE2EC" ${O2}/>`).join("")}`,
          body: `${RG("bayou-lily-b", [[0, "#FFFFFF"], [0.6, "#FFF0F4"], [1, "#F8C4D4"]], 0.42, 0.32, 0.75)}
            <circle cx="60" cy="72" r="24" fill="url(#bayou-lily-b)" ${O}/>
            ${shine(49, 61, 6, 3.2, -35)}<circle cx="56" cy="56.5" r="1.6" fill="#fff"/>`,
          armL: {svg: `<path d="${petal(40, 84, 150, 17, 6)}" fill="#9ACC6E" ${O2}/>`, pivot: [40, 84]},
          armR: {svg: `<path d="${petal(80, 84, 30, 17, 6)}" fill="#9ACC6E" ${O2}/>`, pivot: [80, 84]},
          top: {svg: `${[-24, -8, 8, 24].map((a, i) => { const t = (a - 90) * Math.PI / 180, x = f1(60 + Math.cos(t) * 11), y = f1(49 + Math.sin(t) * 11); return `${LINE(`M60 50L${x} ${y}`, "#E8B83A", 1.6)}<circle cx="${x}" cy="${y}" r="${i % 3 ? 2.6 : 3}" fill="#FFD24A" ${OW(1.6)}/>`; }).join("")}`, pivot: [60, 50]}
        },
        eyes: {lx: 50, rx: 70, y: 71, r: 4.3, style: "sparkle", color: "#3A2430"},
        mouth: {x: 60, y: 80, w: 3, color: "#3A2430"},
        cheeks: {lx: 43, rx: 77, y: 78, w: 4.2, h: 2.6, color: "#FF8FA8"},
        anchors: {top: [60, 44, 0.85], neck: [60, 94, 1], chest: [72, 86, 0.6], back: [86, 64, 0.8], hands: [60, 90, 0.85]},
        lines: {
          tap: ["Hi! The water's so still today. Perfect for thinking.", "One petal at a time. That's how blooming works.", "You're doing beautifully, truly!", "Calm water, clear mind. You've got this.", "I float, you focus. Great team!", "Every little bit you learn makes you bloom.", "Look at you, opening up to new ideas!"],
          pet: ["Hehe, that tickles my petals!", "Ooh, I'm blushing pink now."],
          hello: ["You're here! I opened up just for you.", "Hello! Come sit by the water with me."],
          morning: ["Good morning! I open with the sun. You too?"],
          night: ["The fireflies are out. Time to rest soon, okay?"],
          focus: ["Floating quietly right here with you.", "Shh, the bayou is listening. Focus time."],
          done: ["What a session! I'm in full bloom!", "All done! You glowed like a firefly."],
          task: ["A new petal opens! Well done!", "Bloom! Another one done!", "Checked off! So lovely!"],
          break: ["Break time! Float for a minute and breathe."]
        }
      },
      {
        id: "bayou-knobby", name: "Knobby", kind: "Cypress Knee", pose: "stand", wearColor: "#C27A36",
        bio: "Pokes up out of the water to see how your studying is going.",
        idle: ["wave", "topBob", "sway"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="60" cy="108" rx="34" ry="6" fill="#7EBCA8" ${O}/>
            <g fill="#9CC64E">${[[34, 108], [40, 111], [78, 110], [86, 107], [48, 106.5], [73, 106]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8"/>`).join("")}</g>
            <path d="M30 107q4 2 8 0M82 109q4 2 8 0" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`,
          body: `${LG("bayou-knobby-b", [[0, "#C8986A"], [1, "#8A5E3A"]], 0, 0, 1, 1)}
            <path d="M33 107C36 96 39 84 41 70C42 54 46 38 57 33C68 29 77 36 79 50C81 64 80 86 87 107Z" fill="url(#bayou-knobby-b)" ${O}/>
            <path d="M46 96C47 88 47 80 48 74M73 98C72 90 73 84 74 78M57 102C57 96 58 92 58 88" fill="none" stroke="#6E4628" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>
            <path d="M58 36C66 34 72 38 75 45C70 43 64 43 58 45C54 42 54 38 58 36Z" fill="#A8B08C" ${O2}/>
            <path d="M62 44v6M67 44v8M71 45v5" stroke="#A8B08C" stroke-width="2" stroke-linecap="round"/>
            ${shine(48, 50, 3.4, 6, 15)}`,
          armL: {svg: `${LINE("M42 76L33 84L30 91", "#8A5E3A", 2.6)}${LINE("M33 84L27 84", "#8A5E3A", 2)}<path d="${petal(30, 91, 110, 8, 2.6)}" fill="#7EB060" ${OW(1.6)}/>`, pivot: [42, 76]},
          armR: {svg: `${LINE("M79 76L88 84L91 91", "#8A5E3A", 2.6)}${LINE("M88 84L94 84", "#8A5E3A", 2)}<path d="${petal(91, 91, 70, 8, 2.6)}" fill="#7EB060" ${OW(1.6)}/>`, pivot: [79, 76]},
          top: {svg: `${LINE("M60 34C60 28 62 22 66 17", "#7A5A36", 2)}${[[61, 30, 200], [61, 30, -20], [62.5, 25, 210], [62.5, 25, -15], [64.5, 20, 220], [64.5, 20, -5]].map(([x, y, a]) => `<path d="${petal(x, y, a, 9, 2.4)}" fill="#6EA846" ${OW(1.4)}/>`).join("")}`, pivot: [60, 34]}
        },
        eyes: {lx: 52, rx: 70, y: 60, r: 4, style: "dot", color: "#2B1A10"},
        mouth: {x: 61, y: 69, w: 3, color: "#2B1A10"},
        cheeks: {lx: 46, rx: 76, y: 67, w: 4, h: 2.4, color: "#FF9A8A"},
        anchors: {top: [60, 33, 0.85], neck: [61, 78, 0.95], chest: [61, 90, 0.7], back: [78, 72, 0.8], hands: [61, 94, 0.85]},
        lines: {
          tap: ["Hi there! I popped up to check on you.", "Steady roots, steady progress.", "Slow and sturdy wins the semester.", "You're tougher than old cypress wood!", "I've stood here for ages. You can sit for an hour!", "Knock knock! It's me, cheering you on.", "Little by little, like rings in a tree."],
          pet: ["Hehe, mind the moss!", "Ooh, a little polish. Thank you!"],
          hello: ["Hey hey! You're back! The water's calm.", "Hello, friend! I kept your spot dry."],
          morning: ["Morning! The mist is lifting. Let's go!"],
          night: ["The moon's up. Time to rest your roots."],
          focus: ["Standing still and quiet with you.", "Deep roots, deep focus. You've got this."],
          done: ["That was a solid session! Rock solid!", "All done! Proud of you, truly."],
          task: ["Knock on wood! Another one done!", "Yes! Checked off!", "Sturdy work! Next!"],
          break: ["Stretch time! Even trees sway a little."]
        }
      },
      {
        id: "bayou-fringe", name: "Fringe", kind: "Spanish Moss Tuft", pose: "float", wearColor: "#7A8A5E",
        bio: "A soft gray tuft of moss that loves a long, slow sway.",
        idle: ["sway", "finWiggle", "topBob"], cheer: "bounce",
        parts: {
          back: `${[[40, 80, 98, -2], [45, 84, 106, 2], [50, 86, 102, -1], [55, 88, 109, 2], [60, 89, 104, -2], [65, 88, 108, 1], [70, 86, 101, -2], [75, 84, 105, 2], [80, 80, 96, -1]].map(([x, y0, y1, d], i) => `<path d="M${x} ${y0}C${x + d * 2} ${f1(y0 + (y1 - y0) * 0.35)} ${x - d * 2} ${f1(y0 + (y1 - y0) * 0.65)} ${x + d} ${y1}" fill="none" stroke="${i % 2 ? "#A2AA8A" : "#7E8868"}" stroke-width="2" stroke-linecap="round"/>`).join("")}`,
          body: `${RG("bayou-fringe-b", [[0, "#EEF0DE"], [0.6, "#C8CCB0"], [1, "#98A284"]], 0.4, 0.3, 0.8)}
            <path d="${puff(60, 66, 25, 12, 1.2)}" fill="url(#bayou-fringe-b)" ${O}/>
            <path d="M42 74q3 3 6 0M70 82q3 3 6 0M47 53q3-3 6 0M73 57q3 3 6 0" fill="none" stroke="#8A9478" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
            ${shine(48, 54, 6, 3.4, -30)}`,
          armL: {svg: `<ellipse cx="34" cy="76" rx="5.4" ry="7" transform="rotate(20 34 76)" fill="#C2C6A8" ${O2}/><path d="M32 82q-1 4 1 7M36 83q0 3 2 6" fill="none" stroke="#9EA688" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [38, 72]},
          armR: {svg: `<ellipse cx="86" cy="76" rx="5.4" ry="7" transform="rotate(-20 86 76)" fill="#C2C6A8" ${O2}/><path d="M88 82q1 4 -1 7M84 83q0 3 -2 6" fill="none" stroke="#9EA688" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [82, 72]},
          top: {svg: `${LINE("M38 30C50 26 70 27 84 31", "#7A5A36", 3.4)}${LINE("M52 28L54 42M66 28L65 42", "#9EA688", 1.8)}<path d="${petal(80, 30, -40, 12, 3.6)}" fill="#7EB060" ${OW(1.6)}/>`, pivot: [60, 40]}
        },
        eyes: {lx: 51, rx: 69, y: 65, r: 4, style: "round", color: "#2B2233"},
        mouth: {x: 60, y: 74, w: 2.8},
        cheeks: {lx: 44, rx: 76, y: 72, w: 4, h: 2.4, color: "#FF9AA6"},
        anchors: {top: [60, 41, 0.85], neck: [60, 90, 1], chest: [70, 82, 0.6], back: [84, 62, 0.8], hands: [60, 88, 0.85]},
        lines: {
          tap: ["Hiii. Just swaying along with you.", "No need to rush. The bayou never does.", "Soft and steady, that's the way.", "You're doing great. I can tell from up here.", "Hang in there! I do it all day.", "A gentle breeze of good luck, just for you!"],
          pet: ["Hehe, I'm all fluffy now!", "Mmm, cozy. Sway with me?"],
          hello: ["Oh, hello! I drifted over to say hi.", "You're back! Let's take it slow and easy."],
          morning: ["Good morning! The dew is on my strands."],
          night: ["The fireflies are glowing. Rest soon, okay?"],
          focus: ["Hanging quietly beside you.", "Shh, swaying softly. You focus."],
          done: ["Ahh, what a lovely session.", "All done! Let's sway in celebration!"],
          task: ["Swish! Another one done!", "Yay! So smooth!", "Checked off! Breezy!"],
          break: ["Break time! Let your shoulders hang loose."]
        }
      }
    ]
  });

  /* ================= Karst River ================= */
  COMP_DATA.push({
    theme: "karst",
    companions: [
      {
        id: "karst-peaky", name: "Peaky", kind: "Karst Peak", pose: "stand", wearColor: "#C0483A",
        bio: "A little limestone tower with a mist scarf and big views.",
        idle: ["topBob", "sway", "wave"], cheer: "hop",
        parts: {
          feet: `<g fill="#F4F8F6" ${O2}><circle cx="30" cy="108" r="5"/><circle cx="88" cy="108" r="5"/><circle cx="40" cy="109" r="6"/><circle cx="78" cy="109" r="6"/></g>`,
          back: `<path d="M66 108C68 94 72 84 78 78C84 72 90 74 93 82C96 92 96 100 98 108Z" fill="#BCD2C6" ${O}/><ellipse cx="86" cy="77" rx="4" ry="2.2" fill="#7EB070"/>`,
          body: `${LG("karst-peaky-b", [[0, "#C6D6CC"], [0.55, "#94B2A4"], [1, "#628A7A"]], 0, 0, 1, 1)}
            <path d="M30 108C32 98 38 92 38 82C38 70 34 62 37 50C40 38 48 30 57 30C67 30 74 38 75 50C76 60 72 66 74 76C76 88 84 96 84 108Z" fill="url(#karst-peaky-b)" ${O}/>
            <path d="M66 33C72 40 75 50 74 58C72 66 71 70 73 78C75 90 82 98 82 106H75C75 96 70 88 69 78C68 66 71 58 70 48C69 42 68 37 66 33Z" fill="#5E8676" opacity=".4"/>
            <path d="M39 62Q46 60 51 63M63 72Q69 70 73 72M38 102Q46 100 52 103" fill="none" stroke="#5E8676" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
            <g fill="#5E9E5A"><ellipse cx="42" cy="60" rx="4.6" ry="2.4"/><ellipse cx="71" cy="70" rx="4.4" ry="2.4"/><ellipse cx="45" cy="100" rx="5" ry="2.4"/><ellipse cx="49" cy="36" rx="4.6" ry="2.8"/><ellipse cx="65" cy="35" rx="4.6" ry="2.8"/></g>
            <path d="M33 86C37 80 43 82 45 85C48 80 55 81 57 85C60 80 68 81 70 85C73 81 80 82 83 87C81 92 75 92 73 90C70 94 63 94 60 91C57 95 49 95 46 91C43 94 36 94 33 86Z" fill="#FFFFFF" ${O2}/>
            ${shine(45, 45, 3.4, 6.5, 20)}`,
          armL: {svg: `<ellipse cx="31" cy="72" rx="6" ry="5" fill="#A2BCB0" ${O}/>`, pivot: [36, 72]},
          armR: {svg: `<ellipse cx="81" cy="72" rx="6" ry="5" fill="#8AA898" ${O}/>`, pivot: [76, 72]},
          top: {svg: `${LINE("M57 31V23", "#7A5A36", 2.2)}<ellipse cx="57" cy="20" rx="10" ry="5.6" fill="#5EA25A" ${O2}/><ellipse cx="50" cy="24" rx="6" ry="3.6" fill="#4E9050" ${O2}/><ellipse cx="64" cy="24" rx="6" ry="3.6" fill="#4E9050" ${O2}/><ellipse cx="54" cy="18" rx="3" ry="1.4" fill="#9AD27E"/>`, pivot: [57, 31]}
        },
        eyes: {lx: 48, rx: 66, y: 58, r: 4, style: "dot", color: "#1E2A28"},
        mouth: {x: 57, y: 67, w: 3, color: "#1E2A28"},
        cheeks: {lx: 42, rx: 72, y: 65, w: 4, h: 2.4, color: "#FF9A9A"},
        anchors: {top: [57, 28, 0.85], neck: [57, 84, 0.95], chest: [57, 98, 0.6], back: [76, 66, 0.8], hands: [57, 96, 0.85]},
        lines: {
          tap: ["Hello from up here! The view is lovely.", "Every peak was a pebble once. Keep going!", "You're rising, one layer at a time.", "Steady as stone, that's you today.", "The mist always lifts. Keep at it!", "Big goals are just small steps stacked high.", "I believe in you, from my head to my roots!"],
          pet: ["Hehe, careful, my scarf might slip!", "Ooh, that tickles my moss!"],
          hello: ["You're back! I can see you from way up here.", "Hi! The river and I saved you a spot."],
          morning: ["Good morning! The mist is rolling off my shoulders."],
          night: ["The moon is up between the peaks. Rest soon."],
          focus: ["Standing tall and quiet beside you.", "Calm as a mountain. Focus time."],
          done: ["What a climb! You reached the top!", "All done! Peak performance!"],
          task: ["Up we go! Another one done!", "Summit reached! Well done!", "Checked off! Rock solid!"],
          break: ["Break time! Breathe in that misty air."]
        }
      },
      {
        id: "karst-shoot", name: "Shoot", kind: "Bamboo Shoot", pose: "stand", wearColor: "#5E9A4E",
        bio: "Grows a little taller every time you finish something.",
        idle: ["topBob", "wave", "sway"], cheer: "bounce",
        parts: {
          feet: `<ellipse cx="60" cy="108" rx="28" ry="5.4" fill="#8A6A44" ${O}/><path d="M40 106q3-2 6 0M74 106q3-2 6 0" fill="none" stroke="#B08A5E" stroke-width="1.6" stroke-linecap="round"/>`,
          body: `${LG("karst-shoot-b", [[0, "#E8D49A"], [1, "#B8925A"]], 0, 0, 1, 1)}
            <path d="M38 106C38 84 44 60 52 44C55 38 58 32 60 28C62 32 65 38 68 44C76 60 82 84 82 106Z" fill="url(#karst-shoot-b)" ${O}/>
            <path d="M38 106C40 94 48 88 58 86C52 94 50 100 50 106Z" fill="#A27E48" ${O2}/>
            <path d="M82 106C80 94 72 88 62 86C68 94 70 100 70 106Z" fill="#A27E48" ${O2}/>
            <path d="M44 84C44 76 48 70 54 66C52 72 52 78 54 84" fill="#C8A86A" ${O2}/>
            <path d="M76 84C76 76 72 70 66 66C68 72 68 78 66 84" fill="#C8A86A" ${O2}/>
            <g fill="#8A6A3A" opacity=".55"><circle cx="46" cy="98" r="1.2"/><circle cx="73" cy="97" r="1.2"/><circle cx="49" cy="78" r="1"/><circle cx="71" cy="76" r="1"/></g>
            ${shine(53, 52, 2.6, 6, 18)}`,
          armL: {svg: `<path d="${petal(45, 74, 200, 16, 4)}" fill="#7EB85A" ${O2}/>`, pivot: [45, 74]},
          armR: {svg: `<path d="${petal(75, 74, -20, 16, 4)}" fill="#7EB85A" ${O2}/>`, pivot: [75, 74]},
          top: {svg: `<path d="${petal(60, 31, -120, 17, 4)}" fill="#8CC864" ${O2}/><path d="${petal(60, 31, -62, 19, 4.4)}" fill="#7EB85A" ${O2}/><path d="M60 31L60 26" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`, pivot: [60, 32]}
        },
        eyes: {lx: 53, rx: 67, y: 60, r: 3.8, style: "sparkle", color: "#2B1A10"},
        mouth: {x: 60, y: 68, w: 2.6, color: "#2B1A10"},
        cheeks: {lx: 48, rx: 72, y: 66, w: 3.6, h: 2.2, color: "#FF9A8A"},
        anchors: {top: [60, 26, 0.85], neck: [60, 78, 0.9], chest: [60, 92, 0.6], back: [76, 72, 0.8], hands: [60, 94, 0.85]},
        lines: {
          tap: ["Hi! I grew a tiny bit just now. Did you see?", "Bamboo grows fast because it never gives up!", "Bend, don't break. You've got this.", "Little shoots become tall forests.", "You're growing so much this term!", "Reach for the sky, one ring at a time.", "Stay rooted, keep reaching!"],
          pet: ["Hehe! That's my sprouty spot!", "Ooh, I feel taller already."],
          hello: ["You're here! I popped up to say hello.", "Hi hi! Ready to grow together?"],
          morning: ["Good morning! Fresh dew, fresh start!"],
          night: ["Growing happens while we sleep. Rest soon!"],
          focus: ["Growing quietly right next to you.", "Roots down, focus up. Go!"],
          done: ["Wow! I grew a whole new ring!", "Session done! We're shooting up!"],
          task: ["Sprout! Another one done!", "Up up up! Checked off!", "Yes! Growing strong!"],
          break: ["Break! Stretch up tall like bamboo."]
        }
      },
      {
        id: "karst-yun", name: "Yun", kind: "River Mist", pose: "float", wearColor: "#3E8A7A",
        bio: "A soft curl of morning mist that drifts wherever you go.",
        idle: ["sway", "sparkle", "topBob"], cheer: "spin",
        parts: {
          back: `<path d="M22 86C30 82 36 90 44 86M78 90C86 86 92 92 100 88M34 98C44 94 52 100 62 96" fill="none" stroke="#CFE6E0" stroke-width="3.4" stroke-linecap="round"/>`,
          body: `${RG("karst-yun-b", [[0, "#FFFFFF"], [0.65, "#EEF6F4"], [1, "#C6E0DA"]], 0.42, 0.3, 0.8)}
            <path d="${puff(60, 68, 27, 9, 1.2)}" fill="url(#karst-yun-b)" ${O}/>
            <path d="M40 82c3 3 7 3 8 0c1-2-1-4-3-2M70 52c4-2 9 0 9 4" fill="none" stroke="#A8D2C8" stroke-width="2" stroke-linecap="round"/>
            ${shine(48, 56, 6, 3.4, -30)}`,
          armL: {svg: `<circle cx="32" cy="76" r="6" fill="#F4FAF8" ${O}/>`, pivot: [36, 75]},
          armR: {svg: `<circle cx="88" cy="76" r="6" fill="#F4FAF8" ${O}/>`, pivot: [84, 75]},
          top: {svg: `<path d="${petal(52, 43, -24, 20, 4.2)}" fill="#7EB85A" ${O2}/><path d="M53 42L70 35" fill="none" stroke="#5E944A" stroke-width="1.2" stroke-linecap="round"/>`, pivot: [56, 43]}
        },
        eyes: {lx: 50, rx: 70, y: 68, r: 4.2, style: "round", color: "#1E2A30"},
        mouth: {x: 60, y: 77, w: 2.8, color: "#1E2A30"},
        cheeks: {lx: 43, rx: 77, y: 75, w: 4.2, h: 2.6, color: "#FFA0B0"},
        anchors: {top: [60, 41, 0.85], neck: [60, 94, 1], chest: [72, 86, 0.6], back: [86, 64, 0.8], hands: [60, 90, 0.85]},
        lines: {
          tap: ["Hello! I drifted in on the morning breeze.", "Foggy thoughts clear up with a little focus.", "You're doing wonderfully. Soft and steady.", "Let the worries float away like mist.", "I love watching you learn. It's so calm.", "Breathe in, breathe out. Now, let's study!", "Even the tallest peaks hide in me sometimes!"],
          pet: ["Hehe, you went right through me!", "Ooh, so cozy. I'm all swirly now."],
          hello: ["Oh, there you are! I was floating by.", "Hi! The river is calm. Perfect study weather."],
          morning: ["Good morning! I'm at my fluffiest right now."],
          night: ["The lanterns are glowing. Drift off soon, okay?"],
          focus: ["Drifting quietly right beside you.", "Clear skies ahead. You can do this."],
          done: ["Whoosh! What a lovely session!", "All done! The mist has lifted!"],
          task: ["Poof! Another one done!", "Swirl! Checked off!", "Clear as day! Well done!"],
          break: ["Break time! Float for a moment."]
        }
      }
    ]
  });
})();
