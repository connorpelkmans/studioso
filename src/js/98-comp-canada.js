/* ===== module: 98-comp-canada.js ===== */
/* Study Companions, Around the World: Canada */
(() => {
  const {INK, O, OW, LG, RG} = COMP_KIT;
  const O2 = OW(2.2);
  const f1 = v => Math.round(v * 10) / 10;
  // a sugar maple leaf pointing up, centred on (x, y), s its half-size
  const LEAF = [[0, -1], [.14, -.6], [.4, -.76], [.32, -.36], [.82, -.5], [.64, -.16], [.94, .02], [.5, .2], [.56, .46], [.12, .3], [.05, .78], [-.05, .78], [-.12, .3], [-.56, .46], [-.5, .2], [-.94, .02], [-.64, -.16], [-.82, -.5], [-.32, -.36], [-.4, -.76], [-.14, -.6]];
  const leafD = (x, y, s) => "M" + LEAF.map(([u, v]) => `${f1(x + u * s)} ${f1(y + v * s)}`).join("L") + "Z";
  // the beaver's mouth: a little smile over two big front teeth
  const teeth = (y, h) => `<path d="M56.4 ${y}H63.6V${f1(y + h - 1.4)}Q63.6 ${f1(y + h)} 62.2 ${f1(y + h)}H57.8Q56.4 ${f1(y + h)} 56.4 ${f1(y + h - 1.4)}Z" fill="#FFFDF4" ${OW(1.6)}/><path d="M60 ${y}V${f1(y + h)}" stroke="${INK}" stroke-width="1.1"/>`;

  COMP_DATA.push({
    theme: "canada",
    companions: [
      {
        id: "canada-mapleton", name: "Mapleton", kind: "Sugar Maple Sprite", pose: "float", wearColor: "#F2B23E",
        bio: "A sugar maple sprite who turns brighter red with every finished task.",
        idle: ["sway", "sparkle", "topBob"], cheer: "spin",
        neck: [60, 82],
        parts: {
          top: {svg: `${LG("canada-mapleton-k", [[0, "#F6D27A"], [1, "#D89A3A"]])}
            <path d="M60 22C55 14 47 10 41 12C40 16 46 20 55 22Z" fill="url(#canada-mapleton-k)" ${O2}/><path d="M60 22C65 14 73 10 79 12C80 16 74 20 65 22Z" fill="url(#canada-mapleton-k)" ${O2}/>
            <path d="M45 14Q50 15 54 19M75 14Q70 15 66 19" fill="none" stroke="#C07A2A" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>
            <circle cx="56.4" cy="22" r="3.4" fill="#C8842E" ${OW(1.8)}/><circle cx="63.6" cy="22" r="3.4" fill="#C8842E" ${OW(1.8)}/>`, pivot: [60, 24]},
          body: `${RG("canada-mapleton-g", [[0, "#FF7A52"], [0.55, "#E23A2A"], [1, "#B0221A"]], 0.42, 0.32, 0.8)}
            <path d="M60 92Q60 100 64 106" fill="none" stroke="${INK}" stroke-width="5.4" stroke-linecap="round"/><path d="M60 92Q60 100 64 106" fill="none" stroke="#8A3A22" stroke-width="2.6" stroke-linecap="round"/>
            <path d="${leafD(60, 61, 40)}" fill="url(#canada-mapleton-g)" ${O}/>
            <path d="M60 88V73M60 80L74 69M60 80L46 69M60 84L72 76M60 84L48 76M60 52V32M66 47L82 42M54 47L38 42" fill="none" stroke="#FF9E7A" stroke-width="1.8" stroke-linecap="round" opacity=".55"/>
            <path d="M40 36Q44 32 50 33" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/><path d="M28 59Q30 56 34 56" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>`
        },
        eyes: {lx: 50.5, rx: 69.5, y: 58, r: 4.6, style: "sparkle", color: "#3A1210"},
        mouth: {x: 60, y: 68, w: 3, color: "#3A1210"},
        cheeks: {lx: 44, rx: 76, y: 66, w: 3.8, h: 2.4, color: "#FFB0A0"},
        anchors: {top: [60, 24, 0.8], neck: [60, 82, 0.9], chest: [70, 76, 0.6], back: [86, 56, 0.78], hands: [60, 80, 0.8]},
        lines: {
          tap: ["Hi! I twirled all the way down to cheer you on!", "Every task you finish makes me redder. Look!", "Crisp air, clear mind. You've got this!", "One leaf at a time, the whole tree turns!", "You're glowing like a maple in October!", "I spin when I'm happy. Whee!", "Keep going! The view from the top is worth it.", "Small steps, big colors!"],
          pet: ["Hehe! That rustles in the best way!", "Ooh, I'm turning a little redder!"],
          hello: ["You're back! I saved you a sunny branch!", "Hi! The lake is sparkling for you today!"],
          morning: ["Good morning! Frost on the dock, sun on the peaks!", "Morning! Let's make today bright red!"],
          night: ["The aurora's out. Time to drift off soon?", "Goodnight! Settle softly, like a leaf."],
          focus: ["Floating quietly beside you. Focus on!", "Steady as a still lake. You've got this."],
          done: ["What a session! I'm the reddest leaf around!", "All done! Twirl of triumph!"],
          task: ["Done! A little redder!", "Checked off! Whee!", "Another one! Spin spin!", "Yes! Bright red work!"],
          break: ["Break! Step outside and feel the breeze!", "Stretch tall like a maple in the sun!"]
        }
      },
      {
        id: "canada-bucky", name: "Bucky", kind: "Beaver Kit", pose: "sit", wearColor: "#C8302A",
        bio: "A busy beaver kit who builds study habits one stick at a time.",
        idle: ["tailSwish", "headTilt", "earTwitch"], cheer: "hop",
        neck: [60, 74],
        parts: {
          tail: {svg: `${LG("canada-bucky-t", [[0, "#6E5444"], [1, "#3E2C22"]], 0, 0, 1, 1)}<path d="M76 100C82 106 96 108 104 100C110 94 110 84 104 80C98 76 90 80 86 86C82 92 78 96 76 100Z" fill="url(#canada-bucky-t)" ${O}/>
            <path d="M88 86L100 96M94 82L106 92M84 92L96 102M92 84L84 98M100 82L90 102M106 88L98 104" fill="none" stroke="#8A6E5A" stroke-width="1.2" stroke-linecap="round" opacity=".75"/>`, pivot: [80, 100]},
          feet: `<ellipse cx="47" cy="108" rx="9" ry="4.4" fill="#5A3A26" ${O}/><ellipse cx="73" cy="108" rx="9" ry="4.4" fill="#5A3A26" ${O}/><path d="M43 107v-2.2M47 107.4v-2.4M51 107v-2.2M69 107v-2.2M73 107.4v-2.4M77 107v-2.2" stroke="#8A6448" stroke-width="1.2" stroke-linecap="round"/>`,
          body: `${RG("canada-bucky-b", [[0, "#B88456"], [0.65, "#96643E"], [1, "#74482A"]], 0.45, 0.35, 0.8)}
            <path d="M60 70C77 70 85 84 85 96C85 106 77 110.5 60 110.5C43 110.5 35 106 35 96C35 84 43 70 60 70Z" fill="url(#canada-bucky-b)" ${O}/>
            <path d="M60 80C69 80 73 88 73 96C73 104 67 108 60 108C53 108 47 104 47 96C47 88 51 80 60 80Z" fill="#D8B48C"/>
            <path d="M52 90q2 -2 4 0M64 90q2 -2 4 0M57 98q2 -2 4 0" fill="none" stroke="#C49C72" stroke-width="1.4" stroke-linecap="round"/>`,
          armL: {svg: `<path d="M49 84Q42 90 44 98Q48 101 52 98Q53 92 54 87Z" fill="#8A5A38" ${O}/><path d="M45.4 98l.6 -1.8M48.6 99.4l.2 -1.9" stroke="#C49C72" stroke-width="1.2" stroke-linecap="round"/>`, pivot: [51, 85]},
          armR: {svg: `<path d="M71 84Q78 90 76 98Q72 101 68 98Q67 92 66 87Z" fill="#8A5A38" ${O}/><path d="M74.6 98l-.6 -1.8M71.4 99.4l-.2 -1.9" stroke="#C49C72" stroke-width="1.2" stroke-linecap="round"/>`, pivot: [69, 85]},
          earL: {svg: `<circle cx="41" cy="38" r="6.6" fill="#8A5A38" ${O}/><circle cx="41.4" cy="38.6" r="3.2" fill="#5A3A26"/>`, pivot: [45, 41]},
          earR: {svg: `<circle cx="79" cy="38" r="6.6" fill="#8A5A38" ${O}/><circle cx="78.6" cy="38.6" r="3.2" fill="#5A3A26"/>`, pivot: [75, 41]},
          head: `${RG("canada-bucky-h", [[0, "#C08A5C"], [0.65, "#9C6A42"], [1, "#7A4C2E"]], 0.42, 0.3, 0.8)}
            <path d="M60 32C75 32 84 42 84 55C84 68 74 77 60 77C46 77 36 68 36 55C36 42 45 32 60 32Z" fill="url(#canada-bucky-h)" ${O}/>
            <path d="M44 42Q49 36 57 35" fill="none" stroke="#D8A878" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>
            <path d="M60 56C69 56 74 61 74 66C74 72 68 75 60 75C52 75 46 72 46 66C46 61 51 56 60 56Z" fill="#D8B48C" ${OW(2)}/>
            <path d="M48 64H40M48 67.6L41 69.6M72 64H80M72 67.6L79 69.6" stroke="#5A3A26" stroke-width="1.1" stroke-linecap="round" opacity=".7"/>`,
          face: `<path d="M55.4 59.4Q60 56.6 64.6 59.4Q63.6 63 60 63.4Q56.4 63 55.4 59.4Z" fill="#2E1E16" ${OW(1)}/><ellipse cx="58.4" cy="59.4" rx="1.2" ry=".6" fill="#fff" opacity=".6"/>`
        },
        eyes: {lx: 51, rx: 69, y: 50, r: 3.8, style: "dot", color: "#24140C"},
        mouth: {x: 60, y: 66, w: 2.6, color: "#2E1E16"},
        mouths: {
          neutral: `<path d="M56 65.4Q58 67 60 65.6Q62 67 64 65.4" fill="none" stroke="#2E1E16" stroke-width="1.6" stroke-linecap="round"/>${teeth(66.2, 5.4)}`,
          smile: `<path d="M54.6 64.8Q57.4 68 60 65.8Q62.6 68 65.4 64.8" fill="none" stroke="#2E1E16" stroke-width="1.8" stroke-linecap="round"/>${teeth(66.6, 5.6)}`,
          open: `<path d="M55 65.6Q60 64.6 65 65.6Q64.4 73.6 60 74Q55.6 73.6 55 65.6Z" fill="#7A2A2A" ${OW(1.6)}/><path d="M57 72Q60 70 63 72Q60 74 57 72Z" fill="#E87A7A"/>${teeth(65.8, 4.2)}`,
          sleepy: `<path d="M57.4 65.6Q60 66.6 62.6 65.6" fill="none" stroke="#2E1E16" stroke-width="1.5" stroke-linecap="round"/>${teeth(66.2, 4.6)}`
        },
        cheeks: {lx: 44.4, rx: 75.6, y: 58, w: 3.6, h: 2.3, color: "#FF9A88"},
        anchors: {top: [60, 33, 0.9], neck: [60, 76, 1], chest: [70, 94, 0.6], back: [84, 86, 0.8], hands: [60, 96, 0.85]},
        lines: {
          tap: ["Hi! I've been building you a study dam!", "One stick at a time. That's how dams get built!", "Busy as a beaver, and so are you!", "Chomp chomp! That task didn't stand a chance.", "Slap slap! That's my tail cheering for you!", "Let's build something great today!", "Keep at it! Every twig counts.", "You've got real beaver energy today!"],
          pet: ["Hehe! Right between the ears!", "Ooh, my fur's all fluffy now!"],
          hello: ["You're back! I kept the lodge warm!", "Hi! Ready to build some progress?"],
          morning: ["Good morning! Early beavers get the best sticks!", "Morning! The lake is calm. Let's get building!"],
          night: ["Lodge time soon? Even beavers rest.", "Goodnight! Tomorrow we build again."],
          focus: ["Heads down, teeth sharp. Let's work!", "Quiet building time. You've got this."],
          done: ["Look at that! A whole dam of done!", "Session done! Tail slap of victory!"],
          task: ["Done! Another stick on the dam!", "Checked off! Chomp!", "Yes! Built it!", "Another one! Tail slap!"],
          break: ["Break! Even beavers float a while.", "Stretch out those paws! Snack time?"]
        }
      },
      {
        id: "canada-mooska", name: "Mooska", kind: "Moose Yearling", pose: "stand", sleepy: true, wearColor: "#2E9AA0",
        bio: "A gangly moose yearling with a gentle heart and enormous patience.",
        idle: ["earTwitch", "headTilt", "tailSwish"], cheer: "bounce",
        neck: [60, 62],
        parts: {
          tail: {svg: `<path d="M78 70C84 68 88 72 87 78C86 82 82 82 80 79C79 76 78 73 78 70Z" fill="#6A4630" ${O2}/>`, pivot: [79, 72]},
          feet: `${["M47 84V106", "M54 86V107", "M66 86V107", "M73 84V106"].map(d => `<path d="${d}" stroke="${INK}" stroke-width="8.4" stroke-linecap="round"/><path d="${d}" stroke="#7A5638" stroke-width="5" stroke-linecap="round"/>`).join("")}
            <path d="M47 92V100M54 94V101M66 94V101M73 92V100" stroke="#A88064" stroke-width="2" stroke-linecap="round" opacity=".55"/>
            <g fill="#3A2A22" ${OW(1.6)}><path d="M43.4 104H50.6L51 110.6H43Z"/><path d="M50.4 105H57.6L58 111H50Z"/><path d="M62.4 105H69.6L70 111H62Z"/><path d="M69.4 104H76.6L77 110.6H69Z"/></g>
            <path d="M47 104.4V110.4M54 105.4V110.8M66 105.4V110.8M73 104.4V110.4" stroke="#6A5448" stroke-width=".9"/>`,
          body: `${LG("canada-mooska-b", [[0, "#9A6A44"], [1, "#6E4628"]])}
            <path d="M60 58C76 58 84 66 84 75C84 85 76 90 60 90C44 90 36 85 36 75C36 66 44 58 60 58Z" fill="url(#canada-mooska-b)" ${O}/>
            <path d="M50 60Q60 56 70 60L68 64Q60 61 52 64Z" fill="#5A3A24"/>
            <path d="M44 72Q47 66 54 64" fill="none" stroke="#B88A60" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M52 86Q60 82 68 86" fill="none" stroke="#5A3A24" stroke-width="1.8" stroke-linecap="round" opacity=".6"/>`,
          earL: {svg: `<path d="M46 34C40 30 30 28 26 31C28 36 36 39 45 39Z" fill="#8A5E3E" ${O2}/><path d="M43 35.4C38 33 33 32 30.6 32.8C32 35 37 36.6 42.6 36.8Z" fill="#E6B8A0"/>`, pivot: [46, 36]},
          earR: {svg: `<path d="M74 34C80 30 90 28 94 31C92 36 84 39 75 39Z" fill="#8A5E3E" ${O2}/><path d="M77 35.4C82 33 87 32 89.4 32.8C88 35 83 36.6 77.4 36.8Z" fill="#E6B8A0"/>`, pivot: [74, 36]},
          head: `${RG("canada-mooska-h", [[0, "#B07C52"], [0.65, "#8E603E"], [1, "#6E4628"]], 0.42, 0.28, 0.85)}
            <path d="M53 64Q55 74 60 76Q65 74 67 64Z" fill="#6A4630" ${O2}/>
            <path d="M60 22C71 22 76 30 76 40C76 46 75 50 76 54C78 60 76 68 68 70C64 71 56 71 52 70C44 68 42 60 44 54C45 50 44 46 44 40C44 30 49 22 60 22Z" fill="url(#canada-mooska-h)" ${O}/>
            <path d="M48 52C48 47 53 45 60 45C67 45 72 47 72 52C74 58 72 66 66 68C62 69 58 69 54 68C48 66 46 58 48 52Z" fill="#B88A66" ${OW(2)}/>
            <ellipse cx="54.4" cy="58" rx="2.4" ry="3.2" fill="#3A2418" transform="rotate(-12 54.4 58)"/><ellipse cx="65.6" cy="58" rx="2.4" ry="3.2" fill="#3A2418" transform="rotate(12 65.6 58)"/>
            <path d="M52 27Q55 23 60 23" fill="none" stroke="#C49468" stroke-width="2.4" stroke-linecap="round"/>
            <ellipse cx="51" cy="25.6" rx="3" ry="2.2" fill="#C8A878" ${OW(1.6)}/><ellipse cx="69" cy="25.6" rx="3" ry="2.2" fill="#C8A878" ${OW(1.6)}/>`
        },
        eyes: {lx: 52, rx: 68, y: 37.6, r: 3.6, style: "sparkle", color: "#24140C"},
        mouth: {x: 60, y: 64, w: 2.6, color: "#3A2418"},
        cheeks: {lx: 47, rx: 73, y: 44.4, w: 3.2, h: 2, color: "#FF9A88"},
        anchors: {top: [60, 23, 0.85], neck: [60, 72, 0.85], chest: [66, 80, 0.56], back: [76, 68, 0.72], hands: [60, 84, 0.8]},
        lines: {
          tap: ["Hi... I wandered over from the lake to see you.", "Long legs, slow steps, steady progress.", "No rush. We'll get there together.", "You're doing really well. Truly.", "I'm small now, but I'll grow. So will you!", "Deep breath. The lake is calm, and so are we.", "One careful hoof at a time.", "I believe in you, as big as a moose!"],
          pet: ["Oh! My fuzzy ears are so happy.", "Mmm. That's nice. Thank you."],
          hello: ["Oh, hello! I saved you a spot by the water.", "You're back! My ears perked right up!"],
          morning: ["Good morning. Mist on the lake, sun on the peaks.", "Morning! Let's amble into the day."],
          night: ["The loons are calling. Rest soon?", "Goodnight. Sleep deep, like a still lake."],
          focus: ["Standing quietly beside you.", "Calm and patient. You've got this."],
          done: ["You did it! I'm doing a wobbly happy dance!", "Session done! So, so proud of you."],
          task: ["Done! Hoof bump!", "Checked off! Ears up!", "Another one, slow and sure!", "Yes! Big moose cheer!"],
          break: ["Break time! Go have a big drink of water.", "Stretch those legs! Mine are very long."]
        }
      }
    ]
  });
})();
/* end of module 98-comp-canada.js */


