/* Study Companions, new theme ideas batch n9: bayou. Each theme has one nature-object companion and two young animals. */
(() => {
  const {INK, O, OW, LG, RG, LINE} = COMP_KIT;
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
})();
