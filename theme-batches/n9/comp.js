/* Study Companions, new theme ideas batch n9: bayou, karst. Each theme has one nature-object companion and two young animals. */
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
        id: "bayou-gumbo", name: "Gumbo", kind: "Baby Alligator", pose: "sit", wearColor: "#E0783A",
        bio: "A little gator with a big grin. Snaps up tasks like tasty bugs.",
        idle: ["tailSwish", "headTilt", "wave"], cheer: "hop",
        neck: [60, 76],
        parts: {
          tail: {svg: `${LG("bayou-gumbo-t", [[0, "#8CCB5E"], [1, "#4E8E3E"]])}
            <g fill="#5E9E46" ${OW(1.8)}><path d="M84 98.6L87.6 92.6L91 97.6Z"/><path d="M92 96.4L96.4 90.4L98.6 95Z"/></g>
            <path d="M74 97C84 99 94 97 100 89C103 85 107 86 106 91C104 101 93 109 74 109Z" fill="url(#bayou-gumbo-t)" ${O}/>
            <path d="M82 104Q92 104 99 96" fill="none" stroke="#B4E07E" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`, pivot: [78, 103]},
          feet: `<ellipse cx="44" cy="107" rx="11" ry="5.8" fill="#6EAE4E" ${O}/><ellipse cx="76" cy="107" rx="11" ry="5.8" fill="#6EAE4E" ${O}/>
            <g fill="#FFF6D8" ${OW(1.4)}><circle cx="36.6" cy="109.4" r="2"/><circle cx="41.4" cy="111" r="2"/><circle cx="46.4" cy="111.2" r="2"/><circle cx="83.4" cy="109.4" r="2"/><circle cx="78.6" cy="111" r="2"/><circle cx="73.6" cy="111.2" r="2"/></g>`,
          body: `${RG("bayou-gumbo-b", [[0, "#B4E07E"], [0.6, "#7CBC56"], [1, "#4E8E3E"]], 0.42, 0.3, 0.8)}
            <path d="M38 100C34 87 41 73 60 73C79 73 86 87 82 100C80 105.6 70 107 60 107C50 107 40 105.6 38 100Z" fill="url(#bayou-gumbo-b)" ${O}/>
            <path d="M48 102C45 93 49 83 60 83C71 83 75 93 72 102C68 105.4 52 105.4 48 102Z" fill="#F6ECB4" ${O2}/>
            <path d="M50.6 90.6H69.4M48.8 97H71.2" stroke="#D8C680" stroke-width="1.6" stroke-linecap="round"/>`,
          armL: {svg: `<path d="M44 84Q38 88 36 94.6" fill="none" stroke="${INK}" stroke-width="10.4" stroke-linecap="round"/><path d="M44 84Q38 88 36 94.6" fill="none" stroke="#7CBC56" stroke-width="5.8" stroke-linecap="round"/><ellipse cx="35.4" cy="96" rx="4.8" ry="3.8" fill="#7CBC56" ${OW(2.4)}/><g fill="#FFF6D8"><circle cx="32.6" cy="98.2" r="1.2"/><circle cx="35.6" cy="99" r="1.2"/></g>`, pivot: [44, 83]},
          armR: {svg: `<path d="M76 84Q82 88 84 94.6" fill="none" stroke="${INK}" stroke-width="10.4" stroke-linecap="round"/><path d="M76 84Q82 88 84 94.6" fill="none" stroke="#7CBC56" stroke-width="5.8" stroke-linecap="round"/><ellipse cx="84.6" cy="96" rx="4.8" ry="3.8" fill="#7CBC56" ${OW(2.4)}/><g fill="#FFF6D8"><circle cx="87.4" cy="98.2" r="1.2"/><circle cx="84.4" cy="99" r="1.2"/></g>`, pivot: [76, 83]},
          head: `${RG("bayou-gumbo-h", [[0, "#BCE486"], [0.6, "#82C25A"], [1, "#52923F"]], 0.42, 0.28, 0.85)}${LG("bayou-gumbo-s", [[0, "#A8D87C"], [1, "#74B452"]])}
            <path d="M37 58C35 51 37 46.6 41 43A9 9 0 0 1 56 39Q60 41 64 39A9 9 0 0 1 79 43C83 46.6 85 51 83 58Z" fill="url(#bayou-gumbo-h)" ${O}/>
            <rect x="29" y="53" width="62" height="25.4" rx="12.7" fill="url(#bayou-gumbo-s)" ${O}/>
            <g fill="#8CC862" ${OW(1.8)}><ellipse cx="54.6" cy="57" rx="3.6" ry="2.6"/><ellipse cx="65.4" cy="57" rx="3.6" ry="2.6"/></g>
            <ellipse cx="54.6" cy="57.2" rx="1.2" ry=".9" fill="${INK}"/><ellipse cx="65.4" cy="57.2" rx="1.2" ry=".9" fill="${INK}"/>
            <g fill="#5E9E46"><path d="M57.4 47.6l2.6-2.6l2.6 2.6l-2.6 2.2Z"/><circle cx="54" cy="51" r="1.3"/><circle cx="66" cy="51" r="1.3"/></g>
            ${shine(45, 41.6, 3.4, 1.8, -40)}<path d="M34 60q2-3 6-4" fill="none" stroke="#C8EC98" stroke-width="1.8" stroke-linecap="round"/>`
        },
        eyes: {lx: 49.6, rx: 70.4, y: 45.6, r: 4.4, style: "sparkle", color: "#1E2A16"},
        mouth: {x: 60, y: 70, w: 3},
        mouths: {
          neutral: `<path d="M36 66Q60 76 84 66" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/><path d="M42.4 68.8l1.6 2.8l1.6 -2.8Z" fill="#fff" ${OW(1.1)}/><path d="M50.4 70.4l1.6 2.8l1.6 -2.8Z" fill="#fff" ${OW(1.1)}/><path d="M66.4 70.4l1.6 2.8l1.6 -2.8Z" fill="#fff" ${OW(1.1)}/><path d="M74.4 68.8l1.6 2.8l1.6 -2.8Z" fill="#fff" ${OW(1.1)}/>`,
          smile: `<path d="M35 64.6Q60 79 85 64.6" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><path d="M42.4 68.9l1.6 3l1.6 -3Z" fill="#fff" ${OW(1.1)}/><path d="M50.4 71.1l1.6 3l1.6 -3Z" fill="#fff" ${OW(1.1)}/><path d="M66.4 71.1l1.6 3l1.6 -3Z" fill="#fff" ${OW(1.1)}/><path d="M74.4 68.9l1.6 3l1.6 -3Z" fill="#fff" ${OW(1.1)}/>`,
          open: `<path d="M40 65.6Q60 70 80 65.6Q74 77.4 60 77.4Q46 77.4 40 65.6Z" fill="#7A2E3A" ${OW(2)}/><path d="M51 74.4Q60 70.6 69 74.4Q60 77.4 51 74.4Z" fill="#FF8FA8"/><path d="M46.4 67.4l1.6 2.8l1.6-2.6ZM70.4 67.4l1.6 2.6l1.6-2.8Z" fill="#fff" ${OW(1.1)}/>`,
          sleepy: `<path d="M48 68.6Q60 72.6 72 68.6" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`
        },
        cheeks: {lx: 37.6, rx: 82.4, y: 62, w: 3.8, h: 2.4, color: "#FF8FA8"},
        anchors: {top: [60, 38, 0.85], neck: [60, 79, 0.95], chest: [68, 90, 0.6], back: [80, 82, 0.8], hands: [60, 94, 0.85]},
        lines: {
          tap: ["Hi hi! Want to see my grin? It's my best feature.", "Chomp! That's how I deal with hard homework.", "Slow and steady, like a gator in the sun.", "You're doing great! My tail is wagging.", "Snap snap! Let's get this done!", "Little gator, big plans. Same as you!", "I've got thick skin. You've got a sharp mind!"],
          pet: ["Hehe! My scales are ticklish!", "Ooh, right on the bumpy bit!"],
          hello: ["You're back! I paddled right over!", "Hi! I saved you a sunny log."],
          morning: ["Good morning! Sunbathing first, then studying!"],
          night: ["The fireflies are out. Gator nap time soon."],
          focus: ["Floating quietly, just my eyes up.", "Still as a log. You've got this."],
          done: ["What a session! Big toothy grin!", "All done! You chomped right through it!"],
          task: ["Chomp! Another one gone!", "Snap! Checked off!", "Yum, a finished task!"],
          break: ["Break time! Bask in the sun a minute."]
        }
      },
      {
        id: "bayou-flick", name: "Flick", kind: "Bayou Firefly", pose: "float", wearColor: "#3E5E96",
        bio: "Blinks its little lantern once for every good idea you have.",
        idle: ["wingFlutter", "earTwitch", "tailSwish"], cheer: "spin",
        neck: [60, 72],
        parts: {
          back: `${RG("bayou-flick-halo", [[0, "#FFF6B0", 0.9], [0.55, "#FFE680", 0.45], [1, "#FFE680", 0]])}<circle cx="60" cy="91" r="20" fill="url(#bayou-flick-halo)"/>`,
          tail: {svg: `${RG("bayou-flick-t", [[0, "#FFFDE4"], [0.5, "#FFE66A"], [1, "#F2B43A"]], 0.45, 0.4, 0.65)}
            <ellipse cx="60" cy="91" rx="12.6" ry="11.6" fill="url(#bayou-flick-t)" ${O}/>
            <path d="M49.4 88.6Q60 92.6 70.6 88.6M50.6 95.4Q60 99.4 69.4 95.4" fill="none" stroke="#E8A83A" stroke-width="1.8" stroke-linecap="round" opacity=".75"/>
            ${shine(54, 86, 3.4, 1.8, -20)}`, pivot: [60, 81]},
          wingL: {svg: `<path d="M47 74C36 60 22 56 16 61C11 67 22 80 45 80Z" fill="#EAF4FF" fill-opacity=".92" ${OW(2.2)}/><path d="M44 77Q30 70 20 63" fill="none" stroke="#A8C6E6" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M49 71C43 65 35 65 31 69C35 75 42 79 49 79Z" fill="#4A4466" ${O2}/><path d="M46 72.6C42 69.6 37.6 69.4 35 70.4" fill="none" stroke="#F2C14E" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [47, 76]},
          wingR: {svg: `<path d="M73 74C84 60 98 56 104 61C109 67 98 80 75 80Z" fill="#EAF4FF" fill-opacity=".92" ${OW(2.2)}/><path d="M76 77Q90 70 100 63" fill="none" stroke="#A8C6E6" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M71 71C77 65 85 65 89 69C85 75 78 79 71 79Z" fill="#4A4466" ${O2}/><path d="M74 72.6C78 69.6 82.4 69.4 85 70.4" fill="none" stroke="#F2C14E" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [73, 76]},
          body: `${RG("bayou-flick-b", [[0, "#6E6890"], [0.6, "#4A4466"], [1, "#2E2A40"]], 0.42, 0.3, 0.8)}
            <ellipse cx="60" cy="78.6" rx="14" ry="9.4" fill="url(#bayou-flick-b)" ${O}/>`,
          armL: {svg: `${LINE("M51 83.4L45.4 88L44.4 93", "#8A84AC", 2)}`, pivot: [51, 83]},
          armR: {svg: `${LINE("M69 83.4L74.6 88L75.6 93", "#8A84AC", 2)}`, pivot: [69, 83]},
          earL: {svg: `${LINE("M53 35C50 27 45.6 22.4 41 21.4", "#4A4466", 1.8)}<circle cx="40" cy="21" r="3" fill="#FFE66A" ${OW(1.8)}/>`, pivot: [53, 36]},
          earR: {svg: `${LINE("M67 35C70 27 74.4 22.4 79 21.4", "#4A4466", 1.8)}<circle cx="80" cy="21" r="3" fill="#FFE66A" ${OW(1.8)}/>`, pivot: [67, 36]},
          head: `${RG("bayou-flick-h", [[0, "#FFFAF0"], [0.6, "#F8E8D0"], [1, "#E4C8A4"]], 0.42, 0.34, 0.8)}
            <circle cx="60" cy="52" r="21" fill="url(#bayou-flick-h)" ${O}/>
            <path d="M39.4 49.6C39.4 37.6 48.4 31 60 31C71.6 31 80.6 37.6 80.6 49.6C74 44.6 67 43.4 60 43.4C53 43.4 46 44.6 39.4 49.6Z" fill="#F06A3A" ${O2}/>
            <ellipse cx="60" cy="37.6" rx="4.6" ry="2.6" fill="#4A4466"/>${shine(47, 38.6, 3.6, 1.8, -30)}`
        },
        eyes: {lx: 51, rx: 69, y: 55, r: 4.6, style: "sparkle", color: "#2A2240"},
        mouth: {x: 60, y: 63.4, w: 2.6, color: "#2A2240"},
        cheeks: {lx: 44, rx: 76, y: 61, w: 4, h: 2.4, color: "#FF9A9A"},
        anchors: {top: [60, 32, 0.85], neck: [60, 72, 0.85], chest: [66, 80, 0.55], back: [80, 66, 0.7], hands: [60, 84, 0.8]},
        lines: {
          tap: ["Blink! That one was for you.", "Hi! I glow brighter when you're focused.", "Little lights add up to a whole bayou.", "You're shining tonight! Well, today too.", "One spark at a time, that's how we do it.", "Follow my light. The next task is this way!", "Psst. You're doing really, really well."],
          pet: ["Eep! My lantern just flickered!", "Hehe, careful with my wings!"],
          hello: ["You're here! Blink blink, hello!", "Hi! I lit the way for you."],
          morning: ["Good morning! I'm saving my glow for later."],
          night: ["This is my time to shine! Don't stay up too long."],
          focus: ["Glowing softly right beside you.", "Steady light, steady mind. Go!"],
          done: ["We lit up the whole bayou! Wow!", "All done! Flash flash hooray!"],
          task: ["Blink! Another one done!", "Flash! Checked off!", "Glowing with pride!"],
          break: ["Break time! Rest your eyes in the dark."]
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
        id: "karst-dumpling", name: "Dumpling", kind: "Water Buffalo Calf", pose: "stand", wearColor: "#C0483A",
        bio: "Wades the rice paddies with a lotus leaf hat. Never in a hurry.",
        idle: ["earTwitch", "tailSwish", "topBob"], cheer: "bounce",
        neck: [60, 74],
        parts: {
          tail: {svg: `${LINE("M80 90Q91 90 93.4 101", "#6E7690", 2.4)}<path d="M91 99.6C89.4 103.4 91 108 94.4 108.2C97.6 107.6 98 103 96.2 99.4Z" fill="#3E4456" ${OW(1.8)}/>`, pivot: [80, 90]},
          feet: `<g fill="#5E6680" ${O}><rect x="35" y="90" width="11" height="18" rx="5"/><rect x="74" y="90" width="11" height="18" rx="5"/></g>
            <g fill="#7A8298" ${O}><rect x="45" y="93" width="12" height="18" rx="5.5"/><rect x="63" y="93" width="12" height="18" rx="5.5"/></g>
            <path d="M47.6 107.4h6.8M65.6 107.4h6.8M37.6 104.6h5.8M76.6 104.6h5.8" stroke="#3A3A4C" stroke-width="3" stroke-linecap="round"/>`,
          body: `${RG("karst-dumpling-b", [[0, "#C2C8D6"], [0.6, "#9098AE"], [1, "#6A7290"]], 0.42, 0.3, 0.8)}
            <ellipse cx="60" cy="87" rx="26" ry="16" fill="url(#karst-dumpling-b)" ${O}/>
            <ellipse cx="60" cy="96" rx="13" ry="5.4" fill="#C8CCDA"/>
            <path d="M40 80q3-2 6 0M74 80q3-2 6 0" fill="none" stroke="#6A7290" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>`,
          earL: {svg: `<ellipse cx="30.6" cy="50" rx="9" ry="5" transform="rotate(-14 30.6 50)" fill="#8A92A8" ${O}/><ellipse cx="31.4" cy="50.4" rx="5" ry="2.4" transform="rotate(-14 31.4 50.4)" fill="#F2B4B8"/>`, pivot: [38, 50]},
          earR: {svg: `<ellipse cx="89.4" cy="50" rx="9" ry="5" transform="rotate(14 89.4 50)" fill="#8A92A8" ${O}/><ellipse cx="88.6" cy="50.4" rx="5" ry="2.4" transform="rotate(14 88.6 50.4)" fill="#F2B4B8"/>`, pivot: [82, 50]},
          head: `${RG("karst-dumpling-h", [[0, "#C8CEDC"], [0.6, "#9AA2B8"], [1, "#727A94"]], 0.42, 0.3, 0.8)}
            <path d="M48 39C38 38 29 31 30 19C33 18 34 25 38 29C41 32 45 33 49 33Z" fill="#EADFC6" ${O2}/><path d="M72 39C82 38 91 31 90 19C87 18 86 25 82 29C79 32 75 33 71 33Z" fill="#EADFC6" ${O2}/><path d="M33.6 27q3 4.6 7 6.4M86.4 27q-3 4.6 -7 6.4" fill="none" stroke="#C8B894" stroke-width="1.3" stroke-linecap="round"/>
            <path d="M36 52C36 38 46 30 60 30C74 30 84 38 84 52C84 64 76 72 60 72C44 72 36 64 36 52Z" fill="url(#karst-dumpling-h)" ${O}/>
            <ellipse cx="60" cy="63" rx="17" ry="10" fill="#DCD2D4" ${O2}/>
            <ellipse cx="54" cy="60.6" rx="2" ry="1.4" fill="#5A4E58"/><ellipse cx="66" cy="60.6" rx="2" ry="1.4" fill="#5A4E58"/>
            ${shine(44, 40, 4.4, 2.2, -35)}`,
          top: {svg: `<path d="M48 31C48 26 54 23 60 23C66 23 72 26 72 31C66 33 54 33 48 31Z" fill="#6EB25A" ${O2}/><path d="M60 31.6L60 25M60 30L54.6 26.4M60 30L65.4 26.4" stroke="#A6DA84" stroke-width="1.4" stroke-linecap="round"/><path d="M60 24C57 20 58 16 60 14.6C62 16 63 20 60 24Z" fill="#FFB0C8" ${OW(1.8)}/>`, pivot: [60, 31]}
        },
        eyes: {lx: 49, rx: 71, y: 47, r: 4.2, style: "dot", color: "#1E2230"},
        mouth: {x: 60, y: 68, w: 2.8, color: "#3A2E38"},
        cheeks: {lx: 41, rx: 79, y: 55, w: 4, h: 2.4, color: "#FF9AA6"},
        anchors: {top: [60, 28, 0.85], neck: [60, 74, 1], chest: [68, 88, 0.6], back: [78, 80, 0.8], hands: [60, 92, 0.85]},
        lines: {
          tap: ["Mooo! Hi! The paddies are lovely today.", "Slow steps still get you across the field.", "You're doing great. I'm in no rush at all.", "One furrow at a time. That's the trick.", "Strong and steady, that's you and me.", "Splashing about? Only after the studying!", "I believe in you, all the way to my tail!"],
          pet: ["Mmm, a scratch behind the ears!", "Hehe, mind my lotus hat!"],
          hello: ["You're here! I waded over to say hi.", "Hello! The river is calm. Let's begin."],
          morning: ["Good morning! A cool splash and off we go!"],
          night: ["The moon's up over the peaks. Rest soon."],
          focus: ["Standing quietly right beside you.", "Head down, steady steps. Focus time."],
          done: ["What a session! Happy little moo!", "All done! That was a field well ploughed!"],
          task: ["Moo! Another one done!", "Splash! Checked off!", "Steady work! Next!"],
          break: ["Break time! Have a long cool drink."]
        }
      },
      {
        id: "karst-kormi", name: "Kormi", kind: "Cormorant Chick", pose: "stand", wearColor: "#3E8A7A",
        bio: "A fluffy river chick. Dives into hard topics headfirst.",
        idle: ["wingFlutter", "headTilt", "topBob"], cheer: "wingFlutter",
        neck: [60, 68],
        parts: {
          feet: `${LINE("M51 98V105M69 98V105", "#7A7490", 3)}<path d="M40 110.4Q41 104 49 103Q57 104 58 110.4Q53.6 108.6 49 110.4Q44.4 108.6 40 110.4Z" fill="#7A7490" ${O2}/><path d="M62 110.4Q63 104 71 103Q79 104 80 110.4Q75.6 108.6 71 110.4Q66.4 108.6 62 110.4Z" fill="#7A7490" ${O2}/>`,
          wingL: {svg: `<path d="M42 79C32 83 28.6 95 32.6 104C40 101 44.6 92 43.6 81Z" fill="#544C66" ${O}/><path d="M37 88Q35 94 36 99" fill="none" stroke="#7A7090" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [42, 81]},
          wingR: {svg: `<path d="M78 79C88 83 91.4 95 87.4 104C80 101 75.4 92 76.4 81Z" fill="#544C66" ${O}/><path d="M83 88Q85 94 84 99" fill="none" stroke="#7A7090" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [78, 81]},
          body: `${RG("karst-kormi-b", [[0, "#A89EB4"], [0.6, "#78708C"], [1, "#58506C"]], 0.42, 0.3, 0.8)}
            <path d="${puff(60, 84, 19, 13, 1.2)}" fill="url(#karst-kormi-b)" ${O}/>
            <path d="${puff(60, 88, 10.6, 9, 1.2)}" fill="#F2EADC"/>`,
          head: `${RG("karst-kormi-h", [[0, "#B4AAC0"], [0.6, "#827A96"], [1, "#605874"]], 0.42, 0.28, 0.8)}
            <path d="${puff(60, 48, 21, 13, 1.15)}" fill="url(#karst-kormi-h)" ${O}/>${shine(46, 36, 4.4, 2.2, -35)}`,
          top: {svg: `<path d="M56 29C52.6 22 54.6 16.6 58.6 15.6C57.6 19.6 59.6 23.6 61 28Z" fill="#6A6280" ${O2}/><path d="M60 28.4C61 21.4 65 18 69 18.6C67 21.6 66 25 63 29Z" fill="#6A6280" ${O2}/>`, pivot: [60, 29]}
        },
        eyes: {lx: 50, rx: 70, y: 46.6, r: 5.2, style: "round", color: "#1E8C6E"},
        mouth: {x: 60, y: 58, w: 3},
        mouths: {
          neutral: `<path d="M47.6 54.2Q60 59.8 72.4 54.2L69.6 59.8Q60 62.8 50.4 59.8Z" fill="#F6B24A" ${OW(1.8)}/><path d="M54.8 55.2Q60 52.6 65.2 55.2L62 67Q60 71.4 58 67Z" fill="#8C8A9C" ${OW(2)}/><path d="M60 56V66" stroke="#B4B2C4" stroke-width="1.3" stroke-linecap="round"/>`,
          smile: `<path d="M47.6 54.2Q60 59.8 72.4 54.2L69.6 59.8Q60 62.8 50.4 59.8Z" fill="#F6B24A" ${OW(1.8)}/><path d="M45.4 53.2q1.4 2.6 3.6 1.8M74.6 53.2q-1.4 2.6 -3.6 1.8" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/><path d="M54.8 54.800000000000004Q60 52.2 65.2 54.800000000000004L62 66.6Q60 71.0 58 66.6Z" fill="#8C8A9C" ${OW(2)}/><path d="M60 55.6V65.6" stroke="#B4B2C4" stroke-width="1.3" stroke-linecap="round"/>`,
          open: `<path d="M47.6 54.2Q60 59.8 72.4 54.2L69.6 59.8Q60 62.8 50.4 59.8Z" fill="#F6B24A" ${OW(1.8)}/><path d="M54.4 58.6Q60 60.6 65.6 58.6L62 69Q60 71.6 58 69Z" fill="#FF8FA8" ${OW(1.8)}/><path d="M53.4 54Q60 51.4 66.6 54L61.8 62Q60 64.4 58.2 62Z" fill="#8C8A9C" ${OW(2)}/>`,
          sleepy: `<path d="M47.6 54.2Q60 59.8 72.4 54.2L69.6 59.8Q60 62.8 50.4 59.8Z" fill="#F6B24A" ${OW(1.8)}/><path d="M54.8 55.2Q60 52.6 65.2 55.2L62 67Q60 71.4 58 67Z" fill="#8C8A9C" ${OW(2)}/><path d="M60 56V66" stroke="#B4B2C4" stroke-width="1.3" stroke-linecap="round"/>`
        },
        cheeks: {lx: 42, rx: 78, y: 55.6, w: 3.8, h: 2.3, color: "#FF8FA8"},
        anchors: {top: [60, 28, 0.85], neck: [60, 68, 0.95], chest: [68, 90, 0.6], back: [80, 84, 0.8], hands: [60, 94, 0.85]},
        lines: {
          tap: ["Hi! I'm still fluffy, but I'm a great diver.", "Deep breath, then dive right in!", "Hard topic? Let's go fishing for answers.", "You're doing wonderfully! Flap flap!", "My feathers are fuzzy, but my focus isn't.", "Head under, eyes open. That's studying!", "One more dive, then a little sunbathe."],
          pet: ["Hehe! You ruffled my fluff!", "Ooh, so soft, right? I know."],
          hello: ["You're back! I flapped all the way here!", "Hi! The river's full of good ideas today."],
          morning: ["Good morning! First dive of the day!"],
          night: ["The lanterns are glowing. Nest time soon."],
          focus: ["Perched quietly right next to you.", "Diving deep. You've got this."],
          done: ["What a session! Big splashy cheer!", "All done! You caught every one!"],
          task: ["Splash! Another one caught!", "Got it! Checked off!", "What a catch! Well done!"],
          break: ["Break time! Spread your wings and dry off."]
        }
      }
    ]
  });
})();
