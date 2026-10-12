/* Study Companions, world theme: morocco */
(() => {
  const {O, OW, LG, RG, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const twinkle = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${c || "#fff"}"/>`;
  const f1 = v => Math.round(v * 10) / 10;
  const ring = (cx, cy, n, r, fn) => Array.from({length: n}, (_, i) => { const a = i / n * Math.PI * 2; return fn(f1(cx + Math.cos(a) * r), f1(cy + Math.sin(a) * r), a * 180 / Math.PI, i); }).join("");
  const star = (cx, cy, R, r, n, rot = 0) => { let d = ""; for (let i = 0; i < n * 2; i++) { const a = rot - Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; d += (i ? "L" : "M") + f1(cx + q * Math.cos(a)) + " " + f1(cy + q * Math.sin(a)); } return d + "Z"; };
  const blossom = (x, y, r, c = "#FFFFFF") => `${ring(x, y, 5, r * 0.62, (px, py) => `<circle cx="${px}" cy="${py}" r="${f1(r * 0.55)}" fill="${c}" ${OW(1.1)}/>`)}<circle cx="${x}" cy="${y}" r="${f1(r * 0.36)}" fill="#F6D24A"/>`;

  COMP_DATA.push({
    theme: "morocco",
    companions: [
      {
        id: "morocco-nana", name: "Nana", kind: "Mint Teapot", pose: "stand", wearColor: "#2E8E6E",
        bio: "Pours from a great height and never spills a drop.",
        idle: ["topBob", "sway", "sparkle"], cheer: "bounce",
        parts: {
          feet: `${LG("morocco-nana-f", [[0, "#E8ECF2"], [1, "#9AA4B4"]])}<path d="M42 100H78L83 108Q60 112 37 108Z" fill="url(#morocco-nana-f)" ${O}/>`,
          body: `${RG("morocco-nana-g", [[0, "#FFFFFF"], [0.45, "#E4E8EF"], [1, "#A2ACBC"]], 0.38, 0.32, 0.75)}${LG("morocco-nana-s", [[0, "#F2F4F8"], [1, "#B2BAC8"]])}
            <path d="M33 66Q14 62 15 80Q16 95 33 94" fill="none" stroke="#2B2233" stroke-width="8.6" stroke-linecap="round"/><path d="M33 66Q14 62 15 80Q16 95 33 94" fill="none" stroke="#C4CBD6" stroke-width="4" stroke-linecap="round"/>
            <path d="M86 88Q99 86 103 64L108 50Q112 46 113 51L110 66Q106 92 88 98Z" fill="url(#morocco-nana-s)" ${O}/>
            <path d="M60 46C84 46 92 64 92 80C92 98 80 104 60 104C40 104 28 98 28 80C28 64 36 46 60 46Z" fill="url(#morocco-nana-g)" ${O}/>
            <rect x="45" y="41" width="30" height="8" rx="3" fill="#D8DEE8" ${O2}/>
            <path d="M33 63Q60 70 87 63" fill="none" stroke="#C99A2E" stroke-width="2.6" stroke-linecap="round"/>
            ${[38, 49, 60, 71, 82].map((x, i) => `<path d="${star(x, i === 2 ? 67.6 : i % 4 ? 67 : 65.4, 2.4, 1.2, 8)}" fill="#C99A2E"/>`).join("")}
            <path d="M32 95Q60 103 88 95" fill="none" stroke="#9AA4B4" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 4"/>
            <path d="M38 76Q39 60 52 54" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".9"/><circle cx="37" cy="84" r="1.8" fill="#fff" opacity=".9"/>
            ${twinkle(106, 40, 3, "#C9F0E0")}`,
          top: {svg: `${LG("morocco-nana-l", [[0, "#FFFFFF"], [1, "#B8C0CE"]])}
            <path d="M44 43Q45 30 60 28Q75 30 76 43Z" fill="url(#morocco-nana-l)" ${O}/>
            <path d="M48 38Q60 33 72 38" fill="none" stroke="#C99A2E" stroke-width="2" stroke-linecap="round"/>
            <path d="M57.6 28L60 17L62.4 28Z" fill="#C99A2E" ${O2}/><circle cx="60" cy="22" r="3.4" fill="#E2B04A" ${O2}/><circle cx="60" cy="15.4" r="2.2" fill="#E2B04A" ${OW(1.6)}/>
            ${LINE("M70 32Q74 24 78 20", "#3E8A4E", 2)}
            <path d="M74 25C76 17 84 15 88 18C86 25 79 28 74 25Z" fill="#5EB86A" ${O2}/><path d="M76 24Q81 21 86 19" fill="none" stroke="#3E8A4E" stroke-width="1.2" stroke-linecap="round"/>
            <path d="M77 21C74 13 78 7 82 7C84 13 81 19 77 21Z" fill="#7ACC7A" ${O2}/>`, pivot: [60, 44]}
        },
        eyes: {lx: 50, rx: 70, y: 77, r: 4.6, style: "sparkle", color: "#2A2230"},
        mouth: {x: 60, y: 87, w: 3, color: "#2A2230"},
        cheeks: {lx: 42, rx: 78, y: 85, w: 4, h: 2.4, color: "#FF9AA8"},
        anchors: {top: [60, 30, 0.8], neck: [60, 49, 0.9], chest: [70, 94, 0.6], back: [30, 78, 0.7], hands: [60, 100, 0.84]},
        lines: {
          tap: ["Ahlan! Fresh mint tea, poured just for you!", "Three glasses: one for focus, one for joy, one for luck.", "Pour from up high, and do your best work!", "Steady hands, steady mind. You've got this!", "Sweet and minty, like a job well done!", "Steeping ideas takes patience. You're doing great!", "A little sip, a little step, every day.", "The best study chats happen over tea!"],
          pet: ["Hehe! Careful, I'm still warm!", "Aww, that makes my lid jiggle!"],
          hello: ["Marhaba! The kettle's on for you!", "You're back! Sit, sit, have some tea!"],
          morning: ["Good morning! Fresh mint, fresh start!", "Rise and pour! It's a bright day ahead."],
          night: ["Lanterns are lit. Maybe one last cup, then rest?", "Goodnight! Sweet dreams and sweeter tea."],
          focus: ["Steeping quietly beside you.", "Calm and warm. Pour your focus in!"],
          done: ["What a session! Tea's on me!", "All done! Poured to perfection!"],
          task: ["Done! Not a drop spilled!", "Checked off! Minty fresh!", "Another one! Pour me another!", "Yes! Perfectly steeped!"],
          break: ["Tea break! Sip slowly and stretch.", "Rest a moment. Smell the fresh mint!"]
        }
      },
      {
        id: "morocco-fenn", name: "Fenn", kind: "Fennec Fox Kit", pose: "sit", sleepy: true, wearColor: "#C8642E",
        bio: "Giant ears for hearing every deadline coming.",
        idle: ["earTwitch", "tailSwish", "headTilt"], cheer: "hop",
        neck: [60, 76],
        parts: {
          tail: {svg: `${LG("morocco-fenn-t", [[0, "#F4D6A8"], [1, "#D8A266"]], 0, 1, 1, 0)}
            <path d="M76 104C100 108 116 90 112 66C110 55 95 52 92 63C90 78 86 86 72 88Z" fill="url(#morocco-fenn-t)" ${O}/>
            <path d="M112 66C110 55 95 52 92 63C97 67 106 68 112 66Z" fill="#3A2A26"/><path d="M112 66C110 55 95 52 92 63" fill="none" ${O}/>
            <path d="M86 98Q100 92 104 76" fill="none" stroke="#FFF2DC" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`, pivot: [80, 98]},
          feet: `<ellipse cx="45" cy="108" rx="9.6" ry="4.8" fill="#F8E6C8" ${O}/><ellipse cx="75" cy="108" rx="9.6" ry="4.8" fill="#F8E6C8" ${O}/>
            <path d="M41 106.6v2.6M45 106.4v2.8M71 106.4v2.8M75 106.6v2.6" stroke="#C8A27A" stroke-width="1.2" stroke-linecap="round"/>`,
          body: `${LG("morocco-fenn-b", [[0, "#F6DCB0"], [1, "#E2B47A"]])}
            <path d="M60 72C80 72 86 88 86 98C86 107 78 110.5 60 110.5C42 110.5 34 107 34 98C34 88 40 72 60 72Z" fill="url(#morocco-fenn-b)" ${O}/>
            <path d="M60 78C70 78 74 88 72 98C70 104 50 104 48 98C46 88 50 78 60 78Z" fill="#FFF6E8"/>
            <path d="M46 84Q60 90 74 84" fill="none" stroke="#C8642E" stroke-width="3.6" stroke-linecap="round"/><path d="${star(60, 90, 4.2, 2, 8)}" fill="#2C5FA8" ${OW(1.3)}/>`,
          earL: {svg: `${LG("morocco-fenn-e", [[0, "#F2CE9C"], [1, "#E4B27A"]])}<path d="M44 44C32 32 20 10 25 3C34 2 52 22 55 39Z" fill="url(#morocco-fenn-e)" ${O}/><path d="M44 37C36 27 29 14 30.5 9.6C36 11 46 24 49 34Z" fill="#FFC6C2"/><path d="M38 25Q40 28 41 31M34 18Q36 21 37 24" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>`, pivot: [49, 41]},
          earR: {svg: `<path d="M76 44C88 32 100 10 95 3C86 2 68 22 65 39Z" fill="url(#morocco-fenn-e)" ${O}/><path d="M76 37C84 27 91 14 89.5 9.6C84 11 74 24 71 34Z" fill="#FFC6C2"/><path d="M82 25Q80 28 79 31M86 18Q84 21 83 24" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>`, pivot: [71, 41]},
          head: `${RG("morocco-fenn-h", [[0, "#FCE8C6"], [0.7, "#F2D2A2"], [1, "#E2B47A"]], 0.42, 0.32, 0.78)}
            <path d="M60 36C80 36 87 49 87 60C87 72 75 81 60 81C45 81 33 72 33 60C33 49 40 36 60 36Z" fill="url(#morocco-fenn-h)" ${O}/>
            <path d="M47 70C49 63 55 62 60 64C65 62 71 63 73 70C70 78 50 78 47 70Z" fill="#FFF8EC"/>
            <path d="M40 48Q44 41 52 39" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            <path d="M44 54Q48 52 52 54M68 54Q72 52 76 54" fill="none" stroke="#C8925A" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`,
          face: `<ellipse cx="60" cy="67" rx="3.6" ry="2.6" fill="#3A2A26"/><circle cx="59" cy="66.2" r=".9" fill="#fff"/>`
        },
        eyes: {lx: 49, rx: 71, y: 60, r: 4.4, style: "round", color: "#2A2026"},
        mouth: {x: 60, y: 72.5, w: 2.6, color: "#2A2026", style: "cat"},
        cheeks: {lx: 42, rx: 78, y: 67, w: 3.6, h: 2.2, color: "#FFA2A2"},
        anchors: {top: [60, 37, 0.9], neck: [60, 80, 1], chest: [60, 92, 0.6], back: [84, 90, 0.8], hands: [60, 100, 0.86]},
        lines: {
          tap: ["My ears heard you studying from the desert!", "Big ears, big plans, little paws. Let's go!", "I hear a deadline... and you're way ahead of it!", "Desert foxes keep cool. So can you!", "Every grain of sand adds up to a dune!", "Listen closely: you're doing great!", "I dug a cozy spot right next to your notes.", "Sharp ears, sharp mind. That's you!"],
          pet: ["Hehe! Scratch behind the big ears!", "Aww, my tail is wagging all by itself!"],
          hello: ["My ears perked up! You're back!", "Hi hi! I heard you coming!"],
          morning: ["Good morning! The sand is still cool!", "Rise and shine! Ears up, let's go!"],
          night: ["Fennecs love the night. You need sleep though!", "Goodnight! I'll listen for the stars."],
          focus: ["Ears tuned in. Focus mode on.", "Quiet as the desert. You've got this."],
          done: ["What a session! My ears are glowing!", "All done! Big happy fox hops!"],
          task: ["Done! I heard that click!", "Checked off! Tail wag!", "Another one! Ears up!", "Yes! Swift as a fox!"],
          break: ["Break time! Have a drink of water!", "Stretch those paws, then a little nap?"]
        }
      },
      {
        id: "morocco-limoun", name: "Limoun", kind: "Little Orange", pose: "stand", wearColor: "#3E8A4E",
        bio: "Grown in the courtyard and full of sunshine.",
        idle: ["topBob", "sway", "wave"], cheer: "spin",
        parts: {
          feet: `<ellipse cx="48" cy="106" rx="7.6" ry="4.4" fill="#E87A1E" ${O}/><ellipse cx="72" cy="106" rx="7.6" ry="4.4" fill="#E87A1E" ${O}/>`,
          armL: {svg: `<ellipse cx="26" cy="78" rx="5" ry="7.4" transform="rotate(30 26 78)" fill="#F59A2A" ${O}/>`, pivot: [32, 74]},
          armR: {svg: `<ellipse cx="94" cy="78" rx="5" ry="7.4" transform="rotate(-30 94 78)" fill="#F59A2A" ${O}/>`, pivot: [88, 74]},
          body: `${RG("morocco-limoun-g", [[0, "#FFE0A0"], [0.5, "#FFB040"], [1, "#E8781A"]], 0.38, 0.32, 0.75)}
            <circle cx="60" cy="72" r="33" fill="url(#morocco-limoun-g)" ${O}/>
            ${Array.from({length: 24}, (_, i) => { const a = i * 2.4, d = 8 + (i * 7 % 22); return `<circle cx="${f1(60 + Math.cos(a) * d)}" cy="${f1(72 + Math.sin(a) * d)}" r=".9" fill="#E07014" opacity=".45"/>`; }).join("")}
            <path d="M38 58Q42 46 54 42" fill="none" stroke="#FFF4D6" stroke-width="3.6" stroke-linecap="round"/><circle cx="36" cy="66" r="2" fill="#FFF4D6"/>
            ${twinkle(98, 50, 3.4, "#FFE27A")}${twinkle(22, 104, 2.6, "#FFE27A")}`,
          top: {svg: `${LINE("M60 41Q59 36 61 31", "#7A4A2A", 2.4)}
            <path d="M61 34C67 23 81 22 86 27C81 36 69 38 61 34Z" fill="#4EA05A" ${O2}/><path d="M63 33Q73 28 83 27" fill="none" stroke="#2E7A3E" stroke-width="1.4" stroke-linecap="round"/>
            <path d="M59 35C54 28 45 28 42 32C46 38 54 38 59 35Z" fill="#6ABE6A" ${O2}/>
            ${blossom(50, 25, 6.4)}`, pivot: [60, 42]}
        },
        eyes: {lx: 50, rx: 70, y: 71, r: 4.8, style: "sparkle", color: "#3A1E10"},
        mouth: {x: 60, y: 81, w: 3, color: "#3A1E10"},
        cheeks: {lx: 42, rx: 78, y: 79, w: 4, h: 2.4, color: "#FF7A6A"},
        anchors: {top: [60, 40, 0.95], neck: [60, 99, 1], chest: [72, 92, 0.62], back: [88, 64, 0.8], hands: [60, 99, 0.86]},
        lines: {
          tap: ["Hi! I'm a little ball of courtyard sunshine!", "Squeeze the day! Gently, please!", "You're growing so much, just like my tree!", "Bright ideas ripen with time. Keep going!", "Zesty work today! I'm so proud!", "The fountain sings, the sun shines, you study!", "A little sweet, a little tangy, all good!", "Orange you glad you showed up today? I am!"],
          pet: ["Hehe! That tickles my peel!", "Aww, I smell like blossoms now!"],
          hello: ["You're here! The courtyard feels sunnier!", "Hi! I've been ripening, waiting for you!"],
          morning: ["Good morning! Sun's up, peel's shiny!", "Rise and shine, it's a juicy day!"],
          night: ["The lanterns glow like oranges. Rest soon?", "Goodnight! I'll dream of orange blossoms."],
          focus: ["Sunny and quiet, right beside you.", "Ripening patiently. You focus!"],
          done: ["What a juicy session! So proud!", "All done! A whole tree full of wins!"],
          task: ["Done! Fresh squeezed!", "Checked off! Zesty!", "Another one! Ripe and ready!", "Yes! Pure sunshine!"],
          break: ["Snack break! Maybe something fruity?", "Stretch toward the sun, like my tree!"]
        }
      }
    ]
  });
})();
