/* Study Companions, Around the World: netherlands (Netherlands) */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const twinkle = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${c || "#fff"}"/>`;
  const f1 = v => Math.round(v * 10) / 10;
  // the crisscross waffle grid of a stroopwafel inside a circle (cx, cy, r)
  const grid = (cx, cy, r, step) => { let d = ""; for (let k = -r; k <= r; k += step) { const h = Math.sqrt(Math.max(0, r * r - k * k)) * 0.98; const a = Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
    [[k, -h, k, h]].forEach(([x1, y1, x2, y2]) => { d += `M${f1(cx + x1 * c - y1 * s)} ${f1(cy + x1 * s + y1 * c)}L${f1(cx + x2 * c - y2 * s)} ${f1(cy + x2 * s + y2 * c)}`; d += `M${f1(cx + x1 * c + y1 * s)} ${f1(cy - x1 * s + y1 * c)}L${f1(cx + x2 * c + y2 * s)} ${f1(cy - x2 * s + y2 * c)}`; }); } return d; };

  COMP_DATA.push({
    theme: "netherlands",
    companions: [
      {
        id: "netherlands-tulpa", name: "Tulpa", kind: "Tulip Sprite", pose: "float", wearColor: "#3E8A4E",
        bio: "Opens up a little more with every task you finish.",
        idle: ["sway", "topBob", "sparkle"], cheer: "spin",
        parts: {
          armL: {svg: `${LG("netherlands-tulpa-l", [[0, "#7CC46A"], [1, "#3E8A4E"]])}<path d="M56 104C46 104 34 98 28 86C40 84 52 92 57 100Z" fill="url(#netherlands-tulpa-l)" ${O}/><path d="M54 101Q44 96 33 88" fill="none" stroke="#2E6A3A" stroke-width="1.3" stroke-linecap="round" opacity=".6"/>`, pivot: [56, 102]},
          armR: {svg: `<path d="M63 104C73 104 86 98 92 86C80 84 68 92 63 100Z" fill="url(#netherlands-tulpa-l)" ${O}/><path d="M65 101Q76 96 87 88" fill="none" stroke="#2E6A3A" stroke-width="1.3" stroke-linecap="round" opacity=".6"/>`, pivot: [63, 102]},
          body: `${LG("netherlands-tulpa-b", [[0, "#FF9AA8"], [0.55, "#F2505C"], [1, "#D0283A"]])}${LG("netherlands-tulpa-k", [[0, "#E8485A"], [1, "#B01E34"]])}${RG("netherlands-tulpa-y", [[0, "#FFF2A0", 0.9], [1, "#FFD24A", 0]], 0.5, 0.6, 0.5)}
            ${LINE("M60 94Q61 102 59 108.5", "#4E9A4E", 4)}
            <path d="M60 30C52 38 46 52 46 64L60 92L74 64C74 52 68 38 60 30Z" fill="url(#netherlands-tulpa-k)" ${O}/>
            <path d="M34 44C30 56 30 74 38 86C46 96 56 97 60 96L52 60C46 52 40 46 34 44Z" fill="url(#netherlands-tulpa-k)" ${O}/>
            <path d="M86 44C90 56 90 74 82 86C74 96 64 97 60 96L68 60C74 52 80 46 86 44Z" fill="url(#netherlands-tulpa-k)" ${O}/>
            <path d="M38 52C40 50 46 52 50 58L60 46L70 58C74 52 80 50 82 52C86 66 84 82 76 90C70 95 64 97 60 97C56 97 50 95 44 90C36 82 34 66 38 52Z" fill="url(#netherlands-tulpa-b)" ${O}/>
            <ellipse cx="60" cy="70" rx="15" ry="11" fill="url(#netherlands-tulpa-y)"/>
            <path d="M43 62Q44 56 48 55" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".85"/>
            <path d="M50 92Q60 96 70 92" fill="none" stroke="#B01E34" stroke-width="1.6" stroke-linecap="round" opacity=".5"/>`,
          top: {svg: `${RG("netherlands-tulpa-d", [[0, "#FFFFFF"], [0.6, "#CDEBFF"], [1, "#8CC8F0"]], 0.4, 0.35, 0.7)}<path d="M60 12C64 18 67 22 67 26A7 7 0 0 1 53 26C53 22 56 18 60 12Z" fill="url(#netherlands-tulpa-d)" ${O2}/><circle cx="57.5" cy="25" r="1.6" fill="#fff"/>
            ${twinkle(74, 18, 3.4, "#FFD86B")}`, pivot: [60, 34]}
        },
        eyes: {lx: 51, rx: 69, y: 72, r: 4.6, style: "sparkle", color: "#3A1420"},
        mouth: {x: 60, y: 81, w: 3, color: "#3A1420"},
        cheeks: {lx: 45, rx: 75, y: 79, w: 3.8, h: 2.3, color: "#FFB0C0"},
        anchors: {top: [60, 40, 0.85], neck: [60, 96, 0.85], chest: [70, 88, 0.55], back: [84, 62, 0.8], hands: [60, 98, 0.8]},
        lines: {
          tap: ["Hello! I just opened a petal for you!", "Bright colours, bright ideas, bright you!", "One row at a time, like a tulip field!", "You're blooming beautifully today!", "Every bulb starts small. Keep going!", "Tiptoe through the tasks with me!", "My petals are open wide for good news!", "Rooting for you, all the way down!"],
          pet: ["Hehe! My petals are all fluttery!", "Aww, that feels like spring sunshine!"],
          hello: ["You're back! I opened right up!", "Hi! The whole field says hello!"],
          morning: ["Good morning! Petals open, let's go!", "Rise and bloom! A colourful day awaits!"],
          night: ["My petals close at night. Rest soon?", "Goodnight! Dream in stripes of colour."],
          focus: ["Standing tall and quiet beside you.", "Roots down, focus up. You've got this!"],
          done: ["What a session! I'm in full bloom!", "All done! A whole field of colour!"],
          task: ["Done! Bloom!", "Checked off! One more petal open!", "Another one! Fresh as a tulip!", "Yes! Full bloom proud!"],
          break: ["Sun break! Stretch toward the sky!", "Water break! Even tulips need a drink!"]
        }
      },
      {
        id: "netherlands-klompie", name: "Klompie", kind: "Wooden Clog", pose: "stand", wearColor: "#2F5E9E",
        bio: "Clip-clops along the to-do list without slipping.",
        idle: ["topBob", "bounce", "wave"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="40" cy="108" rx="8" ry="4.4" fill="#C8902E" ${O}/><ellipse cx="82" cy="108" rx="8" ry="4.4" fill="#C8902E" ${O}/>`,
          top: {svg: `${LINE("M44 66Q42 52 46 38", "#4E9A4E", 3)}<path d="M45 50C38 48 33 42 33 36C40 37 44 42 46 47Z" fill="#6AB45A" ${O2}/>
            ${LG("netherlands-klompie-t", [[0, "#FF7A86"], [1, "#D8283A"]])}<path d="M38 30C37 24 39 20 41 18L44 23L46.5 17L49 23L52 18C54 20 55 24 54 30C53 36 50 38 46 38C42 38 39 36 38 30Z" fill="url(#netherlands-klompie-t)" ${O2}/><path d="M41 27Q41 24 43 23" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>`, pivot: [44, 64]},
          armL: {svg: `<path d="M24 84Q14 88 14 98Q20 101 26 94Q28 90 28 86Z" fill="#F2C460" ${O}/>`, pivot: [26, 85]},
          armR: {svg: `<path d="M96 82Q106 84 108 94Q102 98 96 92Q93 88 93 84Z" fill="#F2C460" ${O}/>`, pivot: [95, 83]},
          body: `${LG("netherlands-klompie-g", [[0, "#FFE29A"], [0.5, "#F2C25A"], [1, "#D8962E"]])}${LG("netherlands-klompie-h", [[0, "#7A4A1E"], [1, "#4A2A10"]])}
            <path d="M20 66C20 60 26 58 34 58L62 58C70 58 72 62 76 66C84 70 98 70 106 76C112 80 110 96 102 102C96 106 84 106 70 106L28 106C20 106 16 100 16 92C16 80 18 72 20 66Z" fill="url(#netherlands-klompie-g)" ${O}/>
            <path d="M26 64C28 61 32 60 36 60L60 60C64 60 66 62 66 64C66 67 62 69 56 69L32 69C28 69 25 67 26 64Z" fill="url(#netherlands-klompie-h)" ${OW(2.2)}/>
            <path d="M22 72Q50 76 78 70" fill="none" stroke="#2F5E9E" stroke-width="3.4" stroke-linecap="round"/>
            <path d="M22 72Q50 76 78 70" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-dasharray="2 4" stroke-linecap="round"/>
            <g transform="translate(-9 0)"><path d="M84 84C82 80 84 77 86 76L88 79L90 75L92 79L94 77C96 79 96 83 94 85C92 88 86 88 84 84Z" fill="#E8384A" ${OW(1.4)}/>
            <path d="M89 88Q89 94 87 98M89 93Q84 92 82 89M89 94Q94 92 96 89" fill="none" stroke="#3E8A4E" stroke-width="1.6" stroke-linecap="round"/></g>
            <path d="M18 96Q60 102 106 92" fill="none" stroke="#B8782A" stroke-width="2" stroke-linecap="round" opacity=".6"/>
            <path d="M28 82Q30 76 36 75" fill="none" stroke="#FFF6D8" stroke-width="3.2" stroke-linecap="round"/><circle cx="26" cy="88" r="1.8" fill="#FFF6D8"/>`
        },
        eyes: {lx: 47, rx: 65, y: 85, r: 4.6, style: "sparkle", color: "#3A2410"},
        mouth: {x: 56, y: 94, w: 3, color: "#3A2410"},
        cheeks: {lx: 41, rx: 71, y: 92, w: 3.8, h: 2.3, color: "#FF9A8A"},
        anchors: {top: [46, 60, 0.85], neck: [52, 72, 0.95], chest: [70, 90, 0.6], back: [24, 78, 0.8], hands: [60, 100, 0.86]},
        lines: {
          tap: ["Clip-clop! Here I come!", "Sturdy wood, steady steps, that's us!", "Step by step gets the job done!", "No slipping today, we're on solid ground!", "You're walking tall, I can tell!", "I painted a tulip on me, just for luck!", "Let's stomp through that list together!", "Wooden heart, big cheers for you!"],
          pet: ["Hehe! That tickles my toe!", "Aww, I feel polished and shiny!"],
          hello: ["Clip-clop, you're back!", "Hi! I kept your spot warm!"],
          morning: ["Good morning! Boots on, I mean clogs!", "Rise and stride! New day, new steps!"],
          night: ["Late walk tonight. Rest your feet soon?", "Goodnight! I'll wait by the door."],
          focus: ["Standing still and steady beside you.", "Quiet steps only. You've got this!"],
          done: ["What a walk! Proud of every step!", "All done! Time to kick off our shoes!"],
          task: ["Clop! Done!", "Checked off! Solid work!", "Another step forward!", "Yes! Stomp of approval!"],
          break: ["Stretch break! Wiggle your toes!", "Walk break! A few steps, then back!"]
        }
      },
      {
        id: "netherlands-stroopie", name: "Stroopie", kind: "Stroopwafel", pose: "stand", wearColor: "#C2561C",
        bio: "Warm caramel inside, crisp determination outside.",
        idle: ["topBob", "sparkle", "headTilt"], cheer: "spin",
        neck: [60, 86],
        parts: {
          feet: `<ellipse cx="60" cy="110" rx="34" ry="5" fill="#E8F0FA" ${O}/><ellipse cx="60" cy="109" rx="20" ry="2.4" fill="#C8D8EE"/>`,
          body: `${LG("netherlands-stroopie-c", [[0, "#FFFFFF"], [1, "#DCE6F4"]], 0, 0, 1, 0)}
            <path d="M80 88Q96 86 96 96Q96 104 80 104" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M80 88Q96 86 96 96Q96 104 80 104" fill="none" stroke="#F4F8FC" stroke-width="3.6" stroke-linecap="round"/>
            <path d="M34 82H86L82 102Q80 108 72 108H48Q40 108 38 102Z" fill="url(#netherlands-stroopie-c)" ${O}/>
            <path d="M40 88H80" stroke="#2F5E9E" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M52 100C50 96 52 93 55 93C56 95 58 95 60 93C62 95 64 95 65 93C68 93 70 96 68 100C66 103 54 103 52 100Z" fill="none" stroke="#2F5E9E" stroke-width="1.8" stroke-linejoin="round"/>
            <path d="M44 94Q45 98 44 102M76 94Q75 98 76 102" fill="none" stroke="#2F5E9E" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M42 92Q42 98 44 104" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>`,
          head: `${RG("netherlands-stroopie-w", [[0, "#F8CC7A"], [0.7, "#E0A04A"], [1, "#C07A2E"]], 0.4, 0.35, 0.75)}
            <circle cx="60" cy="54" r="31" fill="url(#netherlands-stroopie-w)" ${O}/>
            <clipPath id="netherlands-stroopie-k"><circle cx="60" cy="54" r="26"/></clipPath>
            <g clip-path="url(#netherlands-stroopie-k)"><path d="${grid(60, 54, 30, 6)}" stroke="#B0702A" stroke-width="1.7" opacity=".55"/></g>
            <circle cx="60" cy="54" r="26" fill="none" stroke="#B0702A" stroke-width="1.6" opacity=".7"/>
            <path d="M31 50Q60 47 89 50" fill="none" stroke="#8A4A18" stroke-width="2.6" stroke-linecap="round"/><path d="M33 52.4Q60 50 87 52.4" fill="none" stroke="#C8701E" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
            <path d="M38 38Q44 28 56 26" fill="none" stroke="#FFF0C8" stroke-width="3.2" stroke-linecap="round" opacity=".9"/>`,
          top: {svg: `${LINE("M52 20Q48 14 52 9Q56 4 52 0", "#FFFFFF", 2.4)}${LINE("M66 20Q70 14 66 9Q62 5 66 1", "#FFFFFF", 2.4)}`, pivot: [60, 24]}
        },
        eyes: {lx: 50, rx: 70, y: 61, r: 4.8, style: "round", color: "#3A1E08"},
        mouth: {x: 60, y: 70, w: 3, color: "#3A1E08"},
        cheeks: {lx: 43, rx: 77, y: 68, w: 4, h: 2.4, color: "#FF8A70"},
        anchors: {top: [60, 24, 0.95], neck: [60, 86, 1], chest: [72, 96, 0.6], back: [88, 56, 0.8], hands: [60, 100, 0.86]},
        lines: {
          tap: ["Hi! Still warm from the waffle iron!", "Crisp outside, gooey inside, ready to go!", "Layer by layer, that's how we do it!", "You're the sweetest student around!", "Pop me on your cup, let's study!", "A little caramel for a lot of effort!", "You make this cosy, you know that?", "Stick with it, like syrup!"],
          pet: ["Hehe! My caramel's getting melty!", "Aww, warm and toasty now!"],
          hello: ["You're back! Coffee and me, ready!", "Hi! I warmed up just for you!"],
          morning: ["Good morning! Coffee's on, let's start!", "Rise and shine, crisp and fresh!"],
          night: ["Late night! Cocoa and bed soon?", "Goodnight! Sweet, syrupy dreams!"],
          focus: ["Sitting warm and quiet on my cup.", "Crisp focus! You've got this!"],
          done: ["What a sweet session! So proud!", "All done! That deserves a treat!"],
          task: ["Done! Sweet!", "Checked off! Golden crisp!", "Another layer done!", "Yes! Caramel-level proud!"],
          break: ["Coffee break! Warm me up a bit?", "Stretch break! Reach for the cookie tin!"]
        }
      }
    ]
  });
})();
