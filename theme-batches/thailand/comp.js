/* Study Companions, Around the World: thailand */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const f1 = v => Math.round(v * 10) / 10;
  const ring = (cx, cy, n, r, fn) => Array.from({length: n}, (_, i) => { const a = i / n * Math.PI * 2; return fn(f1(cx + Math.cos(a) * r), f1(cy + Math.sin(a) * r), a * 180 / Math.PI, i); }).join("");
  // a five-petal frangipani at (x, y), petal length r
  const frang = (x, y, r, rot, fill) => ring(x, y, 5, r * 0.5, (px, py, a) => `<ellipse cx="${px}" cy="${py}" rx="${f1(r * 0.55)}" ry="${f1(r * 0.32)}" transform="rotate(${f1(a + rot)} ${px} ${py})" fill="${fill}" ${OW(1.1)}/>`) + `<circle cx="${x}" cy="${y}" r="${f1(r * 0.24)}" fill="#FFC83A"/>`;

  COMP_DATA.push({
    theme: "thailand",
    companions: [
      {
        id: "thailand-chang", name: "Chang", kind: "Thai Elephant Calf", pose: "stand", wearColor: "#D8463A",
        bio: "Carries your hardest task with a trunk-curling smile.",
        idle: ["earTwitch", "tailSwish", "topBob"], cheer: "bounce",
        parts: {
          tail: {svg: `${LINE("M86 88Q98 86 100 96", "#A6A2BC", 2.6)}<path d="M98 94Q104 95 103 101Q97 101 98 94Z" fill="#5A5470" ${OW(1.6)}/>`, pivot: [86, 88]},
          feet: `<rect x="37" y="95" width="14" height="15" rx="5" fill="#A8A4C0" ${O}/><rect x="69" y="95" width="14" height="15" rx="5" fill="#A8A4C0" ${O}/>
            <path d="M39 106.5h3M44 107h3M71 106.5h3M76 107h3" stroke="#F4F0FA" stroke-width="2.2" stroke-linecap="round"/>`,
          earL: {svg: `${LG("thailand-chang-e", [[0, "#C8C4DA"], [1, "#9C98B6"]])}<path d="M40 44C24 32 7 40 9 58C11 73 25 80 40 71Z" fill="url(#thailand-chang-e)" ${O}/>
            <path d="M34 50C24 44 15 49 16 59C17 67 25 71 33 67Z" fill="#F4B4C6" opacity=".8"/>`, pivot: [40, 56]},
          earR: {svg: `<path d="M80 44C96 32 113 40 111 58C109 73 95 80 80 71Z" fill="url(#thailand-chang-e)" ${O}/>
            <path d="M86 50C96 44 105 49 104 59C103 67 95 71 87 67Z" fill="#F4B4C6" opacity=".8"/>`, pivot: [80, 56]},
          body: `${LG("thailand-chang-b", [[0, "#CCC8DE"], [1, "#9E9AB8"]])}${LG("thailand-chang-c", [[0, "#E2483A"], [1, "#B02E2A"]])}
            <path d="M34 97C30 80 42 69 60 69C78 69 90 80 86 97Z" fill="url(#thailand-chang-b)" ${O}/>
            <path d="M40 80Q60 72 80 80L82 92Q60 86 38 92Z" fill="url(#thailand-chang-c)" ${O2}/>
            <path d="M39 90Q60 84 81 90" fill="none" stroke="#F2C24A" stroke-width="2.2" stroke-linecap="round"/>
            ${[44, 52, 60, 68, 76].map(x => `<path d="M${x} ${x === 60 ? 87 : 88}l-1.6 5h3.2z" fill="#F2C24A" ${OW(0.9)}/>`).join("")}
            <circle cx="60" cy="79" r="3" fill="#F2C24A" ${OW(1.2)}/>
            <path d="M60 28C80 28 88 42 86 57C84 69 74 76 60 76C46 76 36 69 34 57C32 42 40 28 60 28Z" fill="url(#thailand-chang-b)" ${O}/>
            <path d="M56 62Q54 72 59 79Q65 84 71 79Q74 75 71 72" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round"/><path d="M56 62Q54 72 59 79Q65 84 71 79Q74 75 71 72" fill="none" stroke="#B4B0CA" stroke-width="6.4" stroke-linecap="round"/>
            <path d="M55 68h4.4M57 74.5h4M63 79.6l2.4-3" stroke="#8C88A8" stroke-width="1.4" stroke-linecap="round"/>
            <path d="M44 66Q41 70 45 72M76 66Q79 70 75 72" fill="none" stroke="#FFFDF4" stroke-width="3" stroke-linecap="round"/>
            <path d="M42 38Q46 32 52 31" fill="none" stroke="#E6E2F2" stroke-width="2.6" stroke-linecap="round"/>`,
          top: {svg: `<path d="M48 31Q60 22 72 31L68 34Q60 29 52 34Z" fill="#E2483A" ${O2}/>
            <path d="M54 26L60 15L66 26Z" fill="#F2C24A" ${O2}/><circle cx="60" cy="14" r="2.6" fill="#F2C24A" ${OW(1.4)}/>
            ${frang(49, 27, 7, 10, "#FFFFFF")}${frang(71, 27, 7, -10, "#FFC6D8")}`, pivot: [60, 32]}
        },
        eyes: {lx: 48, rx: 72, y: 52, r: 4.6, style: "sparkle", color: "#2A2440"},
        mouth: {x: 49, y: 66, w: 2.4, color: "#2A2440"},
        cheeks: {lx: 40, rx: 80, y: 60, w: 4, h: 2.4, color: "#FF8FB0"},
        anchors: {top: [60, 28, 0.95], neck: [60, 75, 1], chest: [72, 88, 0.6], back: [84, 80, 0.8], hands: [60, 94, 0.8]},
        lines: {
          tap: ["Paoo! Hi! Shall I carry that heavy task?", "My trunk is curled up in a big smile for you!", "Big ears, big heart, big cheers!", "Step by step, like an elephant. We'll get there!", "An elephant never forgets, and neither will you!", "You're stronger than you think, little one!", "One slow stomp at a time. Steady wins!", "I painted my ears pink just for today!"],
          pet: ["Paoo! That tickles behind my ears!", "Hehe! More pats, please! I'm very soft."],
          hello: ["Paoo! You're back! Happy ear flaps!", "Hi friend! I saved you a mango!"],
          morning: ["Good morning! Splash of river water, then study!", "Rise and shine! The temple bells are ringing!"],
          night: ["Big sleepy yawn... my trunk is drooping.", "Goodnight! I'll dream of warm beaches."],
          focus: ["Quiet as a tiptoeing elephant. Go!", "Ears open, trunk still. You've got this."],
          done: ["PAOO! What a mighty session!", "All done! Trunk-curling proud of you!"],
          task: ["Paoo! Done!", "Stomp! Checked off!", "Another one! My ears are flapping!", "Yes! Carried all the way!"],
          break: ["Splash break! Grab some water!", "Stretch those legs! All four of them!"]
        }
      },
      {
        id: "thailand-mamuang", name: "Mamuang", kind: "Mango Sticky Rice", pose: "stand", wearColor: "#F2A81E",
        bio: "Sweet, golden and secretly very sticky about goals.",
        idle: ["topBob", "sway", "sparkle"], cheer: "hop",
        parts: {
          feet: `${LG("thailand-mamuang-l", [[0, "#6AB85A"], [1, "#3E8A3E"]])}
            <path d="M18 100Q60 92 102 100Q100 110 60 111Q20 110 18 100Z" fill="url(#thailand-mamuang-l)" ${O}/>
            <path d="M24 102Q60 97 96 102M36 101l-4 5M50 99l-2 6M70 99l2 6M84 101l4 5" fill="none" stroke="#2E6A30" stroke-width="1.3" stroke-linecap="round" opacity=".7"/>`,
          body: `${RG("thailand-mamuang-r", [[0, "#FFFFFF"], [0.7, "#F6F2E6"], [1, "#E2D8C0"]], 0.4, 0.35, 0.7)}
            <path d="M24 99C20 84 26 64 40 56C50 50 70 50 80 56C94 64 100 84 96 99Z" fill="url(#thailand-mamuang-r)" ${O}/>
            ${[[34, 70, 20], [44, 62, -10], [80, 68, 30], [88, 82, -20], [30, 86, 40], [72, 92, 10], [48, 94, -30], [86, 94, 20], [58, 58, 80]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="3.2" ry="1.4" transform="rotate(${r} ${x} ${y})" fill="#E8DEC6"/>`).join("")}
            <path d="M28 82Q34 90 44 88Q52 96 62 92Q72 98 80 90Q88 92 93 84L95 96Q60 104 25 96Z" fill="#FFF8EA" opacity=".9"/>
            <path d="M28 82Q34 90 44 88Q52 96 62 92Q72 98 80 90Q88 92 93 84" fill="none" stroke="#E8D8B0" stroke-width="1.6" stroke-linecap="round"/>
            ${[[38, 92], [52, 96], [66, 95], [82, 92], [46, 90]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="#E8B83A" ${OW(0.8)}/>`).join("")}
            <path d="M32 70Q34 62 42 58" fill="none" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round"/>`,
          top: {svg: `${LG("thailand-mamuang-m", [[0, "#FFD84A"], [0.6, "#F6B21E"], [1, "#E8901A"]])}
            <path d="M30 54Q36 30 64 28Q90 28 92 46Q84 52 60 54Q44 56 30 54Z" fill="url(#thailand-mamuang-m)" ${O}/>
            <path d="M40 50Q44 38 56 34M52 52Q56 40 68 34M64 52Q68 42 80 36M76 50Q80 44 86 42" fill="none" stroke="#E08A16" stroke-width="1.5" stroke-linecap="round" opacity=".75"/>
            <path d="M40 40Q48 32 60 31" fill="none" stroke="#FFF2B0" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M88 44Q98 36 104 26Q96 30 90 38Z" fill="#5EA84A" ${OW(1.6)}/><path d="M90 42Q96 36 101 29" fill="none" stroke="#3E7A30" stroke-width="1" stroke-linecap="round"/>`, pivot: [60, 54]}
        },
        eyes: {lx: 49, rx: 71, y: 72, r: 4.6, style: "sparkle", color: "#3A2A14"},
        mouth: {x: 60, y: 81, w: 3, color: "#3A2A14"},
        cheeks: {lx: 42, rx: 78, y: 79, w: 4.2, h: 2.4, color: "#FFB0A0"},
        anchors: {top: [60, 30, 0.9], neck: [60, 96, 1], chest: [74, 88, 0.6], back: [92, 74, 0.8], hands: [60, 96, 0.86]},
        lines: {
          tap: ["Hi! I'm sweet, but I stick to my goals!", "Golden mango, golden effort!", "Coconut cream on top of a great study day!", "Stick with it! I know a thing or two about sticky!", "You're the ripest mind in the room!", "One spoonful at a time, it all adds up!", "Sweet and steady wins the dessert!", "Ripe and ready to cheer you on!"],
          pet: ["Hehe! Careful, I'm a little sticky!", "Aww! Sweeter than coconut cream!"],
          hello: ["You're back! Freshly steamed and happy!", "Hi! I saved you the ripest slice!"],
          morning: ["Good morning! A golden day is ripening!", "Rise and shine! Mango season is study season!"],
          night: ["Getting sleepy under my mango slice...", "Goodnight! Dream sweet, golden mango dreams!"],
          focus: ["Sticking right beside you. Focus!", "Quiet and sweet. You've got this!"],
          done: ["What a golden session! So sweet!", "All done! A whole plate of success!"],
          task: ["Done! Sweet!", "Checked off! Golden!", "Another one! That one stuck!", "Yes! Ripe for the next one!"],
          break: ["Snack break! Something sweet, maybe?", "Stretch time! Shake off the sticky!"]
        }
      },
      {
        id: "thailand-tukky", name: "Tukky", kind: "Little Tuk-Tuk", pose: "stand", wearColor: "#2E7FD0",
        bio: "Beeps happily and gets you anywhere on time.",
        idle: ["topBob", "bounce", "sparkle"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="60" cy="102" rx="10" ry="9" fill="#2E2838" ${O}/><circle cx="60" cy="102" r="4" fill="#C8C4D4" ${OW(1.6)}/>
            <ellipse cx="25" cy="101" rx="7" ry="9" fill="#2E2838" ${O}/><ellipse cx="95" cy="101" rx="7" ry="9" fill="#2E2838" ${O}/>
            <circle cx="25" cy="101" r="2.6" fill="#C8C4D4"/><circle cx="95" cy="101" r="2.6" fill="#C8C4D4"/>`,
          body: `${LG("thailand-tukky-b", [[0, "#5AA8F0"], [1, "#1E66B8"]])}${LG("thailand-tukky-g", [[0, "#E8F6FF"], [1, "#A8D4F0"]])}
            <path d="M22 98L24 60Q26 50 36 48H84Q94 50 96 60L98 98Q60 104 22 98Z" fill="url(#thailand-tukky-b)" ${O}/>
            <path d="M33 54H87Q92 55 92 62V76Q60 80 28 76V62Q28 55 33 54Z" fill="url(#thailand-tukky-g)" ${O2}/>
            <path d="M34 58L46 58L38 72Z" fill="#FFFFFF" opacity=".6"/>
            <path d="M24 82Q60 88 96 82" fill="none" stroke="#F6C83A" stroke-width="3.6" stroke-linecap="round"/>
            <path d="M48 90Q60 94 72 90L70 98H50Z" fill="#F6C83A" ${O2}/>
            <circle cx="30" cy="90" r="4.6" fill="#FFF6C8" ${OW(1.8)}/><circle cx="90" cy="90" r="4.6" fill="#FFF6C8" ${OW(1.8)}/>
            <circle cx="29" cy="89" r="1.6" fill="#FFFFFF"/><circle cx="89" cy="89" r="1.6" fill="#FFFFFF"/>`,
          top: {svg: `${LG("thailand-tukky-t", [[0, "#3EB06A"], [1, "#22844A"]])}
            <path d="M18 50Q20 36 34 34H86Q100 36 102 50Z" fill="url(#thailand-tukky-t)" ${O}/>
            <path d="M18 50H102L98 56H22Z" fill="#F6C83A" ${O2}/>
            ${[30, 42, 54, 66, 78, 90].map(x => `<path d="M${x} 56q3 4 6 0" fill="#F6C83A" ${OW(1.4)}/>`).join("")}
            <rect x="48" y="26" width="24" height="9" rx="3" fill="#FFE070" ${O2}/><circle cx="54" cy="30.5" r="1.6" fill="#E8483A"/><circle cx="60" cy="30.5" r="1.6" fill="#2E7FD0"/><circle cx="66" cy="30.5" r="1.6" fill="#3EB06A"/>
            <path d="M30 40Q40 36 50 37" fill="none" stroke="#9AE0B0" stroke-width="2.4" stroke-linecap="round"/>`, pivot: [60, 54]}
        },
        eyes: {lx: 49, rx: 71, y: 66, r: 4.6, style: "sparkle", color: "#1E2A48"},
        mouth: {x: 60, y: 73, w: 2.8, color: "#1E2A48"},
        cheeks: {lx: 40, rx: 80, y: 71, w: 3.8, h: 2.2, color: "#FF8FA8"},
        anchors: {top: [60, 26, 0.9], neck: [60, 82, 1], chest: [74, 88, 0.6], back: [94, 70, 0.8], hands: [60, 92, 0.86]},
        lines: {
          tap: ["Beep beep! Hop in, where are we studying?", "Tuk-tuk-tuk! Full speed ahead!", "Three wheels, zero worries!", "I know all the shortcuts to a good grade!", "Next stop: that task you've been avoiding!", "Engine warm, lights on, ready to go!", "Hold on tight, we're making great time!", "Beep! You're right on schedule!"],
          pet: ["Beep beep! That's my happy horn!", "Hehe! That made my headlights twinkle!"],
          hello: ["Beep beep! You're back! Hop in!", "Hi! Engine's running, let's ride!"],
          morning: ["Good morning! Fuelled up and ready to roll!", "Beep! The morning roads are wide open!"],
          night: ["Headlights dimming... parking soon?", "Goodnight! I'll be outside at sunrise."],
          focus: ["Engine off, quiet mode. Go go go!", "Idling right beside you. You've got this!"],
          done: ["BEEP BEEP! We made it, and on time!", "All done! What a smooth ride!"],
          task: ["Beep! Done!", "Checked off! Next stop!", "Another one! Zoom zoom!", "Yes! Right on time!"],
          break: ["Pit stop! Grab a drink!", "Stretch break! Wheels need a rest too!"]
        }
      }
    ]
  });
})();
