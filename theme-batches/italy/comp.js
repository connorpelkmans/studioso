/* Study Companions, Around the World: italy (Amalfi Coast) */
(() => {
  const {O, OW, LG, RG, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const f1 = v => Math.round(v * 10) / 10;
  const twinkle = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${c || "#fff"}"/>`;
  const blossom = (x, y, r, c) => Array.from({length: 5}, (_, i) => { const a = -Math.PI / 2 + i / 5 * Math.PI * 2; return `<circle cx="${f1(x + Math.cos(a) * r)}" cy="${f1(y + Math.sin(a) * r)}" r="${f1(r * 0.85)}" fill="${c || "#FFFFFF"}" ${OW(1)}/>`; }).join("") + `<circle cx="${x}" cy="${y}" r="${f1(r * 0.6)}" fill="#F6C833"/>`;

  COMP_DATA.push({
    theme: "italy",
    companions: [
      {
        id: "italy-limo", name: "Limo", kind: "Amalfi Lemon", pose: "stand", wearColor: "#2C9A70",
        bio: "Sunny, zesty and always a little bit extra.",
        idle: ["topBob", "sway", "sparkle"], cheer: "bounce",
        parts: {
          feet: `<ellipse cx="49" cy="106.5" rx="7.4" ry="4.2" fill="#E8A81E" ${O}/><ellipse cx="71" cy="106.5" rx="7.4" ry="4.2" fill="#E8A81E" ${O}/>`,
          armL: {svg: `<ellipse cx="27" cy="91" rx="5" ry="7.4" transform="rotate(40 27 91)" fill="#F6CC3A" ${O}/>`, pivot: [32, 87]},
          armR: {svg: `<ellipse cx="93" cy="91" rx="5" ry="7.4" transform="rotate(-40 93 91)" fill="#F6CC3A" ${O}/>`, pivot: [88, 87]},
          body: `${RG("italy-limo-g", [[0, "#FFF7B8"], [0.55, "#FFDD4A"], [1, "#EDB018"]], 0.4, 0.33, 0.78)}
            <path d="M60 38C79 38 91 50 95 63Q104 65 110 70Q104 75 95 77C91 91 79 102 60 102C41 102 29 91 25 77Q16 75 10 70Q16 65 25 63C29 50 41 38 60 38Z" fill="url(#italy-limo-g)" ${O}/>
            ${[[40, 52], [76, 50], [86, 82], [34, 86], [62, 96], [50, 44], [82, 64]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" fill="#E0A818" opacity=".7"/>`).join("")}
            <path d="M36 56Q40 46 52 42" fill="none" stroke="#FFFBE0" stroke-width="3.6" stroke-linecap="round"/><circle cx="33" cy="64" r="2" fill="#FFFBE0"/>
            <path d="M44 99Q60 104 76 99" fill="none" stroke="#D89A14" stroke-width="2" stroke-linecap="round" opacity=".55"/>`,
          top: {svg: `${LINE("M60 39Q60 33 62 29", "#7A5A34", 2.4)}
            ${LG("italy-limo-l", [[0, "#7CCB72"], [1, "#3E8A4A"]], 0, 0, 1, 1)}<path d="M62 31C66 21 78 17 88 20C84 30 72 35 62 31Z" fill="url(#italy-limo-l)" ${O2}/><path d="M64.5 30Q74 25 84 21.4" fill="none" stroke="#2E6E3A" stroke-width="1.4" stroke-linecap="round"/>
            <path d="M60 32C55 25 45 24 40 28C45 34 54 35 60 32Z" fill="url(#italy-limo-l)" ${O2}/>
            ${blossom(50, 22, 3.2)}`, pivot: [60, 38]}
        },
        eyes: {lx: 49, rx: 71, y: 69, r: 5, style: "sparkle", color: "#3A2A08"},
        mouth: {x: 60, y: 80, w: 3.2, color: "#3A2A08"},
        cheeks: {lx: 40, rx: 80, y: 78, w: 4.4, h: 2.6, color: "#FF9A6A"},
        anchors: {top: [60, 38, 0.95], neck: [60, 96, 1.05], chest: [74, 90, 0.66], back: [90, 60, 0.8], hands: [60, 98, 0.86]},
        lines: {
          tap: ["Ciao! Fresh from the terraces, just for you!", "When life gives you lemons, ace the quiz!", "Zesty brain, sunny heart. That's you!", "You're doing great. Squeeze in one more!", "A little bit extra never hurt anyone!", "Zest it up, we've got pages to cover!", "Bright, bold and on a roll today!", "Sun on the terraces, focus in your eyes!"],
          pet: ["Hehe! You smell like lemon now!", "Aww, that's the zest feeling ever!"],
          hello: ["Ciao, ciao! You're back! Sunshine time!", "Buongiorno, friend! Ready to shine?"],
          morning: ["Buongiorno! The sun's on the lemon trees!", "Good morning! Fresh squeezed and ready!"],
          night: ["The cove is all twinkly. Rest soon?", "Buonanotte! Dream of sunny terraces."],
          focus: ["Shh, ripening quietly beside you.", "Zest mode on. You've totally got this!"],
          done: ["What a session! Brilliantly zesty!", "All done! You're the cream of the crop!"],
          task: ["Done! Zesty!", "Checked off! Pure sunshine!", "Another one! Lemon-tastic!", "Yes! Squeezed every drop!"],
          break: ["Limonata break! Sip something cool!", "Stretch in the sun for a minute!"]
        }
      },
      {
        id: "italy-brio", name: "Brio", kind: "Little Scooter", pose: "stand", wearColor: "#F6C833",
        bio: "Takes the hairpin bends and the hard chapters with style.",
        idle: ["topBob", "bounce", "sparkle"], cheer: "hop",
        parts: {
          feet: `${LG("italy-brio-w", [[0, "#4A4048"], [1, "#221C22"]], 0, 0, 1, 0)}<rect x="52" y="90" width="16" height="22" rx="7" fill="url(#italy-brio-w)" ${O}/><rect x="57" y="96" width="6" height="10" rx="3" fill="#B8BCC8"/>`,
          body: `${LG("italy-brio-g", [[0, "#FF7A6A"], [0.55, "#E8403A"], [1, "#B82228"]], 0, 0, 0, 1)}
            <path d="M44 92Q44 86 60 85Q76 86 76 92L74 96H46Z" fill="#D8343A" ${O}/>
            <path d="M60 44C76 44 86 50 88 62L90 86Q90 94 80 94H40Q30 94 30 86L32 62C34 50 44 44 60 44Z" fill="url(#italy-brio-g)" ${O}/>
            <path d="M40 56Q44 49 54 47" fill="none" stroke="#FFD6CC" stroke-width="3.4" stroke-linecap="round"/><circle cx="37" cy="64" r="2" fill="#FFD6CC"/>
            <path d="M36 86H84" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".85"/>
            <rect x="52" y="48" width="16" height="6" rx="3" fill="#C8C8D4" ${OW(1.6)}/>`,
          top: {svg: `${LINE("M24 40Q40 46 60 44Q80 46 96 40", "#5A5462", 3)}
            <rect x="15" y="35.5" width="11" height="8" rx="4" fill="#3A3238" ${O2} transform="rotate(-12 20.5 39.5)"/><rect x="94" y="35.5" width="11" height="8" rx="4" fill="#3A3238" ${O2} transform="rotate(12 99.5 39.5)"/>
            ${LINE("M34 41L30 28", "#5A5462", 1.6)}${LINE("M86 41L90 28", "#5A5462", 1.6)}<ellipse cx="29" cy="25" rx="5" ry="4" fill="#CFE6F4" ${O2}/><ellipse cx="91" cy="25" rx="5" ry="4" fill="#CFE6F4" ${O2}/>
            ${RG("italy-brio-h", [[0, "#FFFFFF"], [0.6, "#FFF2B0"], [1, "#F6C833"]], 0.4, 0.35, 0.7)}<circle cx="60" cy="34" r="9.4" fill="#E8403A" ${O}/><circle cx="60" cy="34" r="6.4" fill="url(#italy-brio-h)"/>
            <circle cx="57.6" cy="31.6" r="1.6" fill="#fff"/>`, pivot: [60, 44]}
        },
        eyes: {lx: 50, rx: 70, y: 68, r: 4.8, style: "round", color: "#2A1A1E"},
        mouth: {x: 60, y: 77.5, w: 3, color: "#2A1A1E"},
        cheeks: {lx: 42, rx: 78, y: 76, w: 4, h: 2.4, color: "#FFB0A0"},
        anchors: {top: [60, 30, 0.9], neck: [60, 88, 1], chest: [72, 82, 0.62], back: [86, 62, 0.8], hands: [60, 86, 0.86]},
        lines: {
          tap: ["Beep beep! Hop on, let's zip through it!", "Hairpin bend ahead? We lean in and go!", "Vroom! That chapter didn't stand a chance!", "Full tank of focus, open coast road!", "Small engine, big dreams. Just like you!", "Wind in your hair, notes in your head!", "Smooth riding! You're cruising today!", "Next stop: the top of the class!"],
          pet: ["Hehe! That made my headlight twinkle!", "Purr purr! That's my happy engine!"],
          hello: ["Beep beep! You're back! Let's ride!", "Ciao! Engine's warm and ready to go!"],
          morning: ["Buongiorno! Coast road's wide open!", "Good morning! First ride of the day!"],
          night: ["Headlight's on low. Time to park soon?", "Buonanotte! Parking by the harbour."],
          focus: ["Cruising quietly right beside you.", "Steady speed, eyes on the road. Go!"],
          done: ["What a ride! Every bend nailed!", "Session done! Victory lap time!"],
          task: ["Zoom! Done!", "Checked off! Beep beep!", "Another bend taken in style!", "Yes! Full throttle!"],
          break: ["Pit stop! Water and a stretch!", "Park it for a minute and breathe!"]
        }
      },
      {
        id: "italy-gela", name: "Gela", kind: "Gelato Cone", pose: "stand", wearColor: "#F48AA6",
        bio: "Three scoops of encouragement, no brain freeze.",
        idle: ["sway", "headTilt", "wave"], cheer: "spin",
        neck: [60, 82],
        parts: {
          armL: {svg: `<path d="M41 88Q31 88 28 80Q30 76 34 79Q37 84 43 84Z" fill="#E8B068" ${O}/>`, pivot: [42, 86]},
          armR: {svg: `<path d="M79 88Q89 88 92 80Q90 76 86 79Q83 84 77 84Z" fill="#E8B068" ${O}/>`, pivot: [78, 86]},
          body: `${LG("italy-gela-c", [[0, "#F6CC86"], [1, "#D8954A"]], 0, 0, 1, 0)}
            <path d="M38 80H82L62.5 110Q60 113 57.5 110Z" fill="url(#italy-gela-c)" ${O}/>
            <path d="M44 88L71 88M48 95L67 95M53 102L63 102M46 82L64 109M58 82L70 99M70 82L74 87M40 82L55 104M74 82L58 108M62 82L50 100M50 82L46 90" stroke="#B8763A" stroke-width="1.4" stroke-linecap="round" opacity=".75"/>
            <path d="M42 81Q44 86 46 81" fill="none" stroke="#FFF0C8" stroke-width="2" stroke-linecap="round" opacity=".7"/>`,
          head: `${RG("italy-gela-p", [[0, "#E8F4C0"], [1, "#9CC46A"]], 0.4, 0.35, 0.75)}${RG("italy-gela-s", [[0, "#FFE0EA"], [1, "#F48AA6"]], 0.4, 0.35, 0.75)}${RG("italy-gela-y", [[0, "#FFFBD8"], [1, "#F6D24A"]], 0.4, 0.35, 0.75)}
            <path d="M60 4C70 4 76 11 76 19C76 26 70 30 60 30C50 30 44 26 44 19C44 11 50 4 60 4Z" fill="url(#italy-gela-y)" ${O}/>
            <path d="M60 22C76 22 84 31 84 40C84 48 76 51 60 51C44 51 36 48 36 40C36 31 44 22 60 22Z" fill="url(#italy-gela-s)" ${O}/>
            <path d="M60 42C78 42 88 52 88 64C88 74 84 78 82 81Q78 86 74 81Q70 86 66 81Q62 86 58 81Q54 86 50 81Q46 86 42 81Q38 86 36 80C33 76 32 72 32 64C32 52 42 42 60 42Z" fill="url(#italy-gela-p)" ${O}/>
            <path d="M40 54Q44 47 52 45" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".85"/><path d="M45 31Q49 26 55 25" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity=".85"/><path d="M50 11Q53 8 57 7.6" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity=".9"/>
            ${[[46, 36, "#D8546E"], [72, 34, "#D8546E"], [64, 40, "#D8546E"], [52, 16, "#E8B020"], [68, 14, "#E8B020"]].map(([x, y, c]) => `<ellipse cx="${x}" cy="${y}" rx="1.4" ry="2" fill="${c}"/>`).join("")}
            <path d="M70 6Q76 -2 82 2" fill="none" stroke="#2B2233" stroke-width="5" stroke-linecap="round"/><path d="M70 6Q76 -2 82 2" fill="none" stroke="#C8783A" stroke-width="2.4" stroke-linecap="round"/>
            ${blossom(46, 6, 2.6)}`
        },
        eyes: {lx: 51, rx: 69, y: 63, r: 4.6, style: "sparkle", color: "#2E2A1A"},
        mouth: {x: 60, y: 72, w: 3, color: "#2E2A1A"},
        cheeks: {lx: 43, rx: 77, y: 70, w: 4, h: 2.4, color: "#FF8FA8"},
        anchors: {top: [60, 6, 0.85], neck: [60, 82, 0.95], chest: [70, 90, 0.6], back: [84, 62, 0.8], hands: [60, 92, 0.8]},
        lines: {
          tap: ["Ciao! Three scoops of cheering, coming up!", "Pistachio for focus, fragola for fun!", "You're the cherry on top of today!", "Cool, calm and totally got this!", "No brain freeze, just brain power!", "One scoop at a time, you'll finish it!", "Sweet work! Keep it rolling!", "Gelato tastes better after a good chapter!"],
          pet: ["Hehe! Careful, I might melt!", "Aww, you make my scoops wobble!"],
          hello: ["Ciao ciao! You're back! Extra scoop!", "Hi! I saved you the best flavour!"],
          morning: ["Buongiorno! Gelato for breakfast? Kidding!", "Good morning! Sweet day ahead!"],
          night: ["The piazza's quiet. Rest soon, dolce?", "Buonanotte! Sweet dreams, three scoops!"],
          focus: ["Staying cool right here with you.", "Scoop by scoop. You've got this!"],
          done: ["What a session! Molto bene!", "All done! A triple scoop of pride!"],
          task: ["Done! Delizioso!", "Checked off! Sprinkles!", "Another scoop added!", "Yes! Sweet success!"],
          break: ["Gelato break! Or water. Water's good!", "Stretch time! Wiggle like a wafer!"]
        }
      }
    ]
  });
})();
