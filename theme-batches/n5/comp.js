/* Study Companions, batch n5: pride, graduation, birthday, geology, languages */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const twinkle = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${c || "#fff"}"/>`;
  const RB = ["#F0606A", "#F7A04A", "#F8D54E", "#66C46C", "#5498E0", "#9466D0"];
  const arms = (lx, rx, y, c, rot = 26, rx2 = 4.8, ry = 6.6) => ({armL: {svg: `<ellipse cx="${lx}" cy="${y}" rx="${rx2}" ry="${ry}" transform="rotate(${rot} ${lx} ${y})" fill="${c}" ${O}/>`, pivot: [lx + 6, y - 3]}, armR: {svg: `<ellipse cx="${rx}" cy="${y}" rx="${rx2}" ry="${ry}" transform="rotate(${-rot} ${rx} ${y})" fill="${c}" ${O}/>`, pivot: [rx - 6, y - 3]}});
  const feet = (c, a = 48, b = 72, y = 109.5) => `<ellipse cx="${a}" cy="${y}" rx="7" ry="4" fill="${c}" ${O}/><ellipse cx="${b}" cy="${y}" rx="7" ry="4" fill="${c}" ${O}/>`;

  /* Pride Parade */
  COMP_DATA.push({
    theme: "pride",
    companions: [
      {
        id: "pride-prism", name: "Prism", kind: "Rainbow Prism", pose: "stand", wearColor: "#9466D0",
        bio: "Turns plain light into every color.",
        idle: ["sparkle", "spin", "topBob"], cheer: "spin",
        parts: {
          back: `${RB.map((c, i) => `<path d="M76 70L114 ${50 + i * 7}V${57 + i * 7}Z" fill="${c}"/>`).join("")}<path d="M76 70L114 50V92Z" fill="none" ${O2}/>${LINE("M4 58L40 68", "#FFFFFF", 4)}`,
          feet: feet("#B9D8F0", 46, 74),
          body: `${LG("pride-prism-pride-prism-g", [[0, "#FFFFFF"], [0.5, "#E6F4FF"], [1, "#B8DDF4"]], 0.2, 0, 0.8, 1)}
            <path d="M60 24C62 24 63.5 25 64.6 27L97 100C98.4 103.4 96.6 106.5 93 106.5H27C23.4 106.5 21.6 103.4 23 100L55.4 27C56.5 25 58 24 60 24Z" fill="url(#pride-prism-pride-prism-g)" ${O}/>
            <path d="M56 36L34 92" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M64 34L82 76" stroke="#C8B4F0" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
            <path d="M32 98H88" stroke="#A8CCE8" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>${twinkle(70, 92, 3, "#F8D54E")}`,
          ...arms(27, 93, 84, "#D6ECFA"),
          top: {svg: `${LINE("M60 24V15", "#F8D54E", 2.4)}<path d="M60 4L62.6 11.4L70 12L64.2 16.6L66.2 24L60 19.8L53.8 24L55.8 16.6L50 12L57.4 11.4Z" fill="#F8D54E" ${O2}/>`, pivot: [60, 24]}
        },
        eyes: {lx: 51, rx: 69, y: 72, r: 5, style: "sparkle", color: "#2A2048"},
        mouth: {x: 60, y: 81, w: 3.1, color: "#2A2048"},
        cheeks: {lx: 44, rx: 76, y: 79, w: 4.2, h: 2.6, color: "#FF9FC0"},
        anchors: {top: [60, 28, 0.85], neck: [60, 94, 1], chest: [72, 92, 0.65], back: [30, 70, 0.85], hands: [60, 96, 0.9]},
        lines: {
          tap: ["Hi! You make me shine in every color!", "Every bit of you is bright today!", "Bend the light, bend the rules, ace the quiz!", "You've got a whole rainbow of ideas!", "Proud of you, every single shade!", "Sparkle mode: on. Let's go!", "Light in, rainbow out. That's you studying!"],
          pet: ["Hehe! You made me sparkle!", "Aww! Now I'm glowing all over!"],
          hello: ["You're back! The light just got brighter!", "Hi hi! Ready to make some rainbows?"],
          morning: ["Good morning! Fresh light, fresh colors!"], night: ["Dimming my sparkle now. Rest soon?"],
          focus: ["Focused like a beam of light. You've got this.", "Shining quietly right beside you."],
          done: ["WOW! That session was full spectrum!", "Done! Every color of awesome!"],
          task: ["DONE! Rainbow burst!", "Checked off! That sparkles!", "Yes! Another shade of amazing!"],
          break: ["Break time! Go find some sunshine!"]
        }
      },
      {
        id: "pride-flamingo", name: "Fifi", kind: "Flamingo Chick", pose: "stand", wearColor: "#5498E0",
        bio: "Fluffy, pink and practicing its one-legged stand.",
        idle: ["headTilt", "wingFlutter", "sway"], cheer: "wingFlutter",
        parts: {
          feet: `${LINE("M60 98V110", "#F28AA0", 3)}<path d="M53 111.5H67" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M53 111.5H67" stroke="#F28AA0" stroke-width="2.4" stroke-linecap="round"/>${LINE("M66 97L74 104L68 106", "#F28AA0", 2.6)}`,
          body: `${RG("pride-flamingo-pride-fla-g", [[0, "#FFF0F4"], [0.6, "#FFC4D4"], [1, "#F59AB4"]], 0.42, 0.35, 0.75)}
            <path d="${puff(60, 80, 21, 11, 1.2)}" fill="url(#pride-flamingo-pride-fla-g)" ${O}/><path d="M48 90Q60 98 72 90" fill="none" stroke="#F59AB4" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>`,
          wingL: {svg: `<path d="M41 76C30 78 26 90 32 96C38 94 44 86 43 78Z" fill="#FFB0C6" ${O}/>`, pivot: [42, 78]},
          wingR: {svg: `<path d="M79 76C90 78 94 90 88 96C82 94 76 86 77 78Z" fill="#FFB0C6" ${O}/>`, pivot: [78, 78]},
          head: `${RG("pride-flamingo-pride-flh-g", [[0, "#FFF4F7"], [0.7, "#FFCADA"], [1, "#F7A4BE"]], 0.4, 0.35, 0.8)}
            ${LINE("M60 62V56", "#FFC4D4", 6)}<path d="${puff(60, 42, 17, 10, 1.15)}" fill="url(#pride-flamingo-pride-flh-g)" ${O}/>
            <path d="M72 42C84 38 92 44 91 54C89 61 85 63 84 58C84 53 80 50 74 51Z" fill="#FFF4E6" ${O2}/><path d="M85 48C89 49 91 52 90.6 56C89.6 60 86 62 85 58Z" fill="${INK}"/>
            ${LINE("M58 25C56 20 60 17 62 20", "#F59AB4", 2.2)}`
        },
        eyes: {lx: 53, rx: 67, y: 42, r: 3.6, style: "sparkle", color: "#3A1E30"},
        mouth: {x: 60, y: 50, w: 2, color: "#3A1E30"},
        cheeks: {lx: 47.5, rx: 72, y: 48, w: 3.4, h: 2.2, color: "#FF7FA0"},
        neck: [60, 60],
        anchors: {top: [60, 27, 0.75], neck: [60, 60, 0.7], chest: [70, 86, 0.6], back: [82, 70, 0.75], hands: [60, 92, 0.8]},
        lines: {
          tap: ["Hi! Watch me stand on one leg! ...Almost!", "You're doing fab-ulous today!", "Pink, proud and cheering for you!", "Balance is tricky, but you've got it!", "Fluff up! We're on a roll!", "Strike a pose, then strike that task!", "Every wobble counts as practice!"],
          pet: ["Eee! My fluff is all puffed up!", "Hehe! That tickles my feathers!"],
          hello: ["You're here! I'm flapping with joy!", "Hello! Ready to strut through today?"],
          morning: ["Good morning! Stretch those legs, both of them!"], night: ["Tucking my head in soon. You too?"],
          focus: ["Standing very still for you. Focus mode!", "Quiet feathers, busy brain. Go go!"],
          done: ["WOW! That session was flamazing!", "Session done! Big fluffy cheers!"],
          task: ["Done! Flap flap flap!", "YES! Strut-worthy work!", "Checked off! I'm so proud!"],
          break: ["Break time! Wiggle and stretch!"]
        }
      },
      {
        id: "pride-ribbon", name: "Swirl", kind: "Parade Ribbon", pose: "float", wearColor: "#F0606A",
        bio: "Twirls through the air in every color at once.",
        idle: ["sway", "wave", "spin"], cheer: "spin",
        parts: {
          back: `${RB.map((c, i) => `<path d="M${18 + i * 1.4} ${40 + i * 3.6}C${30 + i} ${20 + i * 2} ${50} ${26 + i * 3} ${60} ${50 + i * 2}" fill="none" stroke="${c}" stroke-width="3.8" stroke-linecap="round"/>`).join("")}
            ${RB.map((c, i) => `<path d="M${60} ${70 + i * 2}C${72} ${96 + i * 2} ${90 - i} ${106 - i} ${104 - i * 1.4} ${88 - i * 3.6}" fill="none" stroke="${c}" stroke-width="3.8" stroke-linecap="round"/>`).join("")}
            <path d="M15 38C28 14 52 22 61 48M60 70C72 104 92 112 107 86" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" opacity=".35"/>`,
          body: `${RG("pride-ribbon-pride-rib-g", [[0, "#FFFFFF"], [0.5, "#FFE6F2"], [1, "#F4B0D2"]], 0.4, 0.35, 0.75)}
            <circle cx="60" cy="62" r="23" fill="url(#pride-ribbon-pride-rib-g)" ${O}/>
            ${RB.map((c, i) => `<path d="M${40 + i * 0.6} ${74 + i * 1.6}Q60 ${82 + i * 1.2} ${80 - i * 0.6} ${74 + i * 1.6}" fill="none" stroke="${c}" stroke-width="1.8" opacity=".9"/>`).join("")}
            <ellipse cx="47" cy="51" rx="5" ry="3" transform="rotate(-38 47 51)" fill="#fff"/>${twinkle(84, 40, 3, "#F8D54E")}${twinkle(34, 86, 2.6, "#5498E0")}`,
          ...arms(36, 84, 66, "#F7C4DC", 25, 4.4, 5.8)
        },
        eyes: {lx: 51, rx: 69, y: 60, r: 4.8, style: "sparkle", color: "#3A1E40"},
        mouth: {x: 60, y: 69, w: 3, color: "#3A1E40"},
        cheeks: {lx: 44, rx: 76, y: 67, w: 4.2, h: 2.6, color: "#FF8FB8"},
        anchors: {top: [60, 40, 0.85], neck: [60, 84, 0.95], chest: [72, 78, 0.6], back: [86, 54, 0.8], hands: [60, 84, 0.85]},
        lines: {
          tap: ["Wheee! Twirling just for you!", "Every color of you is welcome here!", "Loop de loop, you're doing great!", "Let's make today a parade!", "You bring the color to this whole board!", "Swish! Another idea caught!", "Proud of you, swirl to swirl!"],
          pet: ["Hehe! I'm all tangled with happiness!", "Wheee! Spin me again!"],
          hello: ["You're back! Cue the parade!", "Hi hi! I saved you a spot on the float!"],
          morning: ["Good morning! Let's twirl into the day!"], night: ["Curling up in a soft loop. Rest soon?"],
          focus: ["Floating quietly beside you. You've got this.", "Slow swirls, steady focus."],
          done: ["WOW! That session deserves a parade!", "Done! Confetti and ribbons for you!"],
          task: ["DONE! Big rainbow twirl!", "Yes! Swish, checked off!", "Woohoo! Another float in the parade!"],
          break: ["Break time! Twirl around the room!"]
        }
      }
    ]
  });

  /* Graduation Day */
  COMP_DATA.push({
    theme: "graduation",
    companions: [
      {
        id: "graduation-cap", name: "Tassel", kind: "Grad Cap", pose: "stand", wearColor: "#F2B83A",
        bio: "Has been waiting for this moment all year.",
        idle: ["topBob", "sway", "headTilt"], cheer: "spin", hatTop: true,
        parts: {
          feet: feet("#1E3366", 48, 72),
          body: `${LG("graduation-cap-grad-cap-b", [[0, "#4A6AB0"], [1, "#24386E"]])}
            <path d="M38 80Q38 106 60 107Q82 106 82 80Z" fill="url(#graduation-cap-grad-cap-b)" ${O}/><path d="M52 82L60 94L68 82" fill="none" stroke="#F2B83A" stroke-width="3" stroke-linejoin="round"/>`,
          ...arms(36, 84, 92, "#3A5AA0"),
          head: `${LG("graduation-cap-grad-cap-h", [[0, "#5A7ACC"], [1, "#2E4A8A"]])}${RG("graduation-cap-grad-cap-f", [[0, "#FFF6EC"], [1, "#F6DCC4"]], 0.42, 0.35, 0.8)}
            <path d="M33 58C33 42 45 36 60 36C75 36 87 42 87 58C87 74 75 84 60 84C45 84 33 74 33 58Z" fill="url(#graduation-cap-grad-cap-f)" ${O}/>
            <path d="M36 44Q38 34 60 33Q82 34 84 44Q72 40 60 40Q48 40 36 44Z" fill="url(#graduation-cap-grad-cap-h)" ${O}/>
            <path d="M60 14L104 30L60 46L16 30Z" fill="#2E4A8A" ${O}/><path d="M26 29L58 17.6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".35"/><circle cx="60" cy="30" r="3.6" fill="#F2B83A" ${O2}/>`,
          top: {svg: `${LINE("M60 30L92 38V58", "#F2B83A", 2.6)}<path d="M88 56H96L98 70H86Z" fill="#F2B83A" ${O2}/><path d="M89 60V68M92 60V68M95 60V68" stroke="#C88A1A" stroke-width="1.2"/>`, pivot: [60, 30]}
        },
        eyes: {lx: 51, rx: 69, y: 60, r: 4.8, style: "sparkle", color: "#1E2A4A"},
        mouth: {x: 60, y: 69, w: 3, color: "#1E2A4A"},
        cheeks: {lx: 43.5, rx: 76.5, y: 67, w: 4.2, h: 2.6, color: "#FF9FB0"},
        neck: [60, 82],
        anchors: {top: [60, 22, 0.9], neck: [60, 84, 0.85], chest: [70, 96, 0.6], back: [86, 74, 0.8], hands: [60, 98, 0.85]},
        lines: {
          tap: ["Hi! One step closer to the big day!", "Every task is a step across the stage!", "Tassel's on the right side of awesome!", "You're going to make it. I just know!", "Caps off to you today!", "Study now, celebrate later!", "Class of AMAZING, that's you!"],
          pet: ["Hehe! My tassel is swinging!", "Aww! Careful, don't knock my cap off!"],
          hello: ["You're back! Let's earn that diploma!", "Hi hi! Ready for another step?"],
          morning: ["Good morning, future graduate!"], night: ["Even grads need sleep. Rest soon?"],
          focus: ["Eyes on the stage. You've got this.", "Quiet cap, steady focus."],
          done: ["WOW! Throw your cap! That was great!", "Session done! Top of the class!"],
          task: ["DONE! Caps in the air!", "Checked off! Honor roll stuff!", "YES! One step closer!"],
          break: ["Break time! Stretch like a victory pose!"]
        }
      },
      {
        id: "graduation-diploma", name: "Dippy", kind: "Rolled Diploma", pose: "stand", wearColor: "#9A2E4A",
        bio: "Tied with a ribbon. Unrolls when you finish big things.",
        idle: ["topBob", "wave", "sparkle"], cheer: "bounce",
        parts: {
          feet: feet("#C9A866", 49, 71),
          body: `${LG("graduation-diploma-grad-dip-g", [[0, "#FFFBEE"], [0.55, "#F6E6C0"], [1, "#E2C890"]], 0, 0, 1, 0)}
            <rect x="38" y="26" width="44" height="80" rx="20" fill="url(#graduation-diploma-grad-dip-g)" ${O}/><ellipse cx="60" cy="31" rx="20" ry="6" fill="#FFF8E6" ${O2}/><ellipse cx="60" cy="31" rx="8" ry="2.6" fill="#E2C890"/>
            <path d="M45 40V96" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".8"/>
            <rect x="38" y="84" width="44" height="8" fill="#9A2E4A" ${O2}/><circle cx="72" cy="88" r="6" fill="#F2B83A" ${O2}/><circle cx="72" cy="88" r="2.6" fill="#FFE7A0"/>`,
          ...arms(33, 87, 72, "#F6E6C0"),
          top: {svg: `<path d="M60 28C50 14 38 18 44 27Z M60 28C70 14 82 18 76 27Z" fill="#9A2E4A" ${O2}/><circle cx="60" cy="27" r="4" fill="#C84A6A" ${O2}/>`, pivot: [60, 28]}
        },
        eyes: {lx: 52, rx: 68, y: 56, r: 4.6, style: "dot", color: "#3A2A1A"},
        mouth: {x: 60, y: 65, w: 3, color: "#3A2A1A"},
        cheeks: {lx: 46, rx: 74, y: 63, w: 4, h: 2.5, color: "#FF9FB0"},
        anchors: {top: [60, 22, 0.9], neck: [60, 78, 0.8], chest: [70, 98, 0.55], back: [86, 60, 0.8], hands: [60, 92, 0.85]},
        lines: {
          tap: ["Hi! I'm all rolled up and ready!", "Big things ahead, I can feel it!", "Your name looks great in fancy letters!", "Every page you study counts!", "You're writing your own success story!", "Ribbon-worthy work today!", "I'll unroll the moment you finish!"],
          pet: ["Hehe! You'll crinkle my paper!", "Aww! My ribbon is blushing!"],
          hello: ["You're back! Let's earn some ribbons!", "Hello! Fresh paper, fresh start!"],
          morning: ["Good morning! Today's a ribbon kind of day!"], night: ["Rolling up for the night. Sleep soon?"],
          focus: ["Rolled up and quiet. Focus time!", "Right here, cheering in cursive."],
          done: ["WOW! I'm unrolling with pride!", "Session done! That's certificate level!"],
          task: ["DONE! Signed, sealed, finished!", "Yes! Official awesome!", "Checked off with a gold seal!"],
          break: ["Break time! Unroll those shoulders!"]
        }
      },
      {
        id: "graduation-laurel", name: "Laurel", kind: "Laurel Wreath Sprite", pose: "float", wearColor: "#F2B83A",
        bio: "A ring of leaves for every win, big or small.",
        idle: ["sparkle", "sway", "spin"], cheer: "spin",
        parts: {
          back: `${[...Array(9)].map((_, i) => { const a = (150 + i * 30) * Math.PI / 180, x = +(60 + Math.cos(a) * 36).toFixed(1), y = +(64 + Math.sin(a) * 36).toFixed(1); return `<ellipse cx="${x}" cy="${y}" rx="10" ry="5" transform="rotate(${+(a * 57.3 + 115).toFixed(1)} ${x} ${y})" fill="${i % 2 ? "#8CCB7E" : "#6CB070"}" ${O2}/>`; }).join("")}
            ${[...Array(9)].map((_, i) => { const a = (30 - i * 30) * Math.PI / 180, x = +(60 + Math.cos(a) * 36).toFixed(1), y = +(64 + Math.sin(a) * 36).toFixed(1); return `<ellipse cx="${x}" cy="${y}" rx="10" ry="5" transform="rotate(${+(a * 57.3 + 65).toFixed(1)} ${x} ${y})" fill="${i % 2 ? "#8CCB7E" : "#6CB070"}" ${O2}/>`; }).join("")}
            <path d="M52 100Q60 94 68 100L66 110L60 105L54 110Z" fill="#9A2E4A" ${O2}/>`,
          body: `${RG("graduation-laurel-grad-lau-g", [[0, "#FFFCE8"], [0.55, "#FFE490"], [1, "#F2B83A"]], 0.42, 0.35, 0.75)}
            <circle cx="60" cy="64" r="22" fill="url(#graduation-laurel-grad-lau-g)" ${O}/><ellipse cx="48" cy="54" rx="5" ry="3" transform="rotate(-38 48 54)" fill="#fff"/>
            ${twinkle(60, 22, 5, "#F2B83A")}${twinkle(20, 40, 3, "#FFE490")}${twinkle(100, 44, 3, "#FFE490")}`,
          ...arms(39, 81, 70, "#FFD86B", 25, 4.4, 5.8)
        },
        eyes: {lx: 52, rx: 68, y: 62, r: 4.6, style: "sparkle", color: "#3A2A10"},
        mouth: {x: 60, y: 71, w: 2.9, color: "#3A2A10"},
        cheeks: {lx: 45, rx: 75, y: 69, w: 4, h: 2.5, color: "#FF9F8F"},
        anchors: {top: [60, 44, 0.85], neck: [60, 84, 0.9], chest: [72, 78, 0.6], back: [88, 54, 0.8], hands: [60, 84, 0.85]},
        lines: {
          tap: ["Hi! A leaf for you, and another!", "Every win counts, even the tiny ones!", "You're a champion of showing up!", "Victory is made of little steps!", "Crowning you with leaves today!", "Big win, small win, all wins!", "Glowing with pride for you!"],
          pet: ["Hehe! My leaves are rustling!", "Aww! That's a golden pat!"],
          hello: ["You're back! Ready to collect some wins?", "Hi hi! Your wreath is waiting!"],
          morning: ["Good morning, champion!"], night: ["Leaves folding in. Rest well, winner."],
          focus: ["Quietly growing a leaf for this session.", "Glowing softly beside you. Keep going."],
          done: ["WOW! That earns the golden wreath!", "Session done! A whole new leaf!"],
          task: ["DONE! Another leaf on the wreath!", "Yes! Victory lap!", "Checked off! Champion move!"],
          break: ["Break time! Take a victory stretch!"]
        }
      }
    ]
  });

  /* Birthday Bash */
  COMP_DATA.push({
    theme: "birthday",
    companions: [
      {
        id: "birthday-popper", name: "Pop", kind: "Party Popper", pose: "stand", wearColor: "#FF7FA8",
        bio: "Saves its confetti for the moments that count.",
        idle: ["topBob", "bounce", "sparkle"], cheer: "bounce",
        parts: {
          feet: feet("#E89A3A", 52, 68),
          body: `${LG("birthday-popper-bday-pop-g", [[0, "#FFE890"], [1, "#F29A3A"]], 0, 0, 1, 1)}
            <path d="M28 40H92L64 106Q60 110 56 106Z" fill="url(#birthday-popper-bday-pop-g)" ${O}/>
            <path d="M33 52L87 52M40 68L80 68M48 86L72 86" stroke="#FF7FA8" stroke-width="5"/><path d="M28 40H92L64 106Q60 110 56 106Z" fill="none" ${O}/>
            <ellipse cx="60" cy="40" rx="32" ry="7" fill="#FFF6E0" ${O}/><path d="M36 48L52 98" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>`,
          ...arms(30, 90, 66, "#FFD86B"),
          top: {svg: `${LINE("M50 38Q44 24 50 14", "#7FC8F0", 2.6)}${LINE("M70 38Q78 26 74 14", "#B58CF2", 2.6)}${LINE("M60 36V20", "#FF7FA8", 2.6)}
            <rect x="40" y="22" width="7" height="4" rx="1" fill="#7FD8C0" ${OW(1.4)} transform="rotate(-25 43 24)"/><rect x="76" y="26" width="7" height="4" rx="1" fill="#FFD45A" ${OW(1.4)} transform="rotate(30 79 28)"/><circle cx="60" cy="14" r="3.6" fill="#FFD45A" ${OW(1.6)}/>${twinkle(36, 12, 3.4, "#FF7FA8")}${twinkle(86, 10, 3, "#7FC8F0")}`, pivot: [60, 38]}
        },
        eyes: {lx: 51, rx: 69, y: 60, r: 4.8, style: "sparkle", color: "#3A2010"},
        mouth: {x: 60, y: 69, w: 3, color: "#3A2010"},
        cheeks: {lx: 44, rx: 76, y: 67, w: 4.2, h: 2.6, color: "#FF8F9F"},
        anchors: {top: [60, 34, 0.9], neck: [60, 78, 0.8], chest: [68, 88, 0.55], back: [86, 58, 0.8], hands: [60, 84, 0.85]},
        lines: {
          tap: ["Hi! I'm full of confetti for you!", "Saving my biggest pop for your big win!", "You're the life of this study party!", "Every finished task deserves a pop!", "Ready, set, celebrate soon!", "Party mode starts after this page!", "You make every day feel special!"],
          pet: ["Eep! Careful, I might pop!", "Hehe! A little confetti slipped out!"],
          hello: ["You're back! Party time can begin!", "Hi hi! Let's earn some confetti!"],
          morning: ["Good morning! Today's worth celebrating!"], night: ["Saving my pop for tomorrow. Sleep well!"],
          focus: ["Holding my confetti very still. Go go!", "Quiet popper, big cheers inside."],
          done: ["POP! That session was a party!", "Done! Confetti everywhere!"],
          task: ["POP! DONE!", "Yes! Confetti for that one!", "Checked off! Party time!"],
          break: ["Break time! Do a little party dance!"]
        }
      },
      {
        id: "birthday-pinata", name: "Piña", kind: "Llama Piñata", pose: "stand", wearColor: "#B58CF2",
        bio: "Colorful, fringed, and wants to be admired, not hit.",
        idle: ["earTwitch", "sway", "headTilt"], cheer: "hop",
        parts: {
          feet: `${[44, 54, 66, 76].map((x, i) => `<rect x="${x - 4.5}" y="92" width="9" height="18" rx="3" fill="${["#5CCFC0", "#FF8FB8", "#B58CF2", "#FFD45A"][i]}" ${O}/>`).join("")}`,
          body: `<rect x="34" y="70" width="52" height="28" rx="8" fill="#FF8FB8" ${O}/>
            <path d="M35 78H85M35 85H85M35 92H85" stroke="${INK}" stroke-width="0"/><rect x="35.5" y="77" width="49" height="7" fill="#FFD45A"/><rect x="35.5" y="84" width="49" height="7" fill="#5CCFC0"/><rect x="36" y="91" width="48" height="5.5" rx="2" fill="#B58CF2"/>
            <rect x="34" y="70" width="52" height="28" rx="8" fill="none" ${O}/><path d="M38 73Q44 71 50 73" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>
            ${LINE("M34 76Q22 74 22 62", "#B58CF2", 4)}`,
          head: `${RG("birthday-pinata-bday-pin-h", [[0, "#FFFFFF"], [1, "#FFEEDC"]], 0.4, 0.35, 0.8)}
            <rect x="48" y="50" width="24" height="24" fill="#FFD45A" ${O}/><rect x="48.5" y="56" width="23" height="6" fill="#5CCFC0"/><rect x="48.5" y="62" width="23" height="6" fill="#FF8FB8"/><rect x="48" y="50" width="24" height="24" fill="none" ${O}/>
            <path d="M60 22C76 22 82 32 82 40C82 50 74 56 60 56C46 56 38 50 38 40C38 32 44 22 60 22Z" fill="url(#birthday-pinata-bday-pin-h)" ${O}/>
            <ellipse cx="60" cy="49" rx="10" ry="6" fill="#FFF8F0" ${O2}/><path d="M57 48q3 2.4 6 0" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M48 24Q60 18 72 24" fill="none" stroke="#FF8FB8" stroke-width="4" stroke-linecap="round"/>`,
          earL: {svg: `<path d="M44 30L38 10L52 24Z" fill="#FFF4E6" ${O}/><path d="M44 26L41 15L48.5 23Z" fill="#FFB3C6"/>`, pivot: [46, 27]},
          earR: {svg: `<path d="M76 30L82 10L68 24Z" fill="#FFF4E6" ${O}/><path d="M76 26L79 15L71.5 23Z" fill="#FFB3C6"/>`, pivot: [74, 27]}
        },
        eyes: {lx: 51, rx: 69, y: 38, r: 4.2, style: "sparkle", color: "#2E2033"},
        mouth: {x: 60, y: 46, w: 0.1},
        mouths: {
          neutral: `<path d="M57 48q3 2.4 6 0" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`,
          smile: `<path d="M56 47.6q4 4 8 0" fill="none" stroke="${INK}" stroke-width="1.9" stroke-linecap="round"/>`,
          open: `<path d="M56.6 47.4q3.4 5 6.8 0z" fill="${INK}" ${OW(1.4)}/><path d="M58 49.6q2 -1.2 4 0q-2 1.6 -4 0z" fill="#FF8FA8"/>`,
          sleepy: `<ellipse cx="60" cy="49" rx="1.6" ry="1.9" fill="${INK}"/>`
        },
        cheeks: {lx: 44, rx: 76, y: 45, w: 3.8, h: 2.4, color: "#FF8FB8"},
        neck: [60, 72],
        anchors: {top: [60, 20, 0.85], neck: [60, 70, 0.8], chest: [74, 82, 0.55], back: [40, 64, 0.8], hands: [60, 90, 0.8]},
        lines: {
          tap: ["Hi! Admire my fringe, gently please!", "No bats, just high fives, okay?", "You make me feel extra colorful!", "Every stripe of me is cheering for you!", "Party look, study brain. Love it!", "Let's fill today with sweet wins!", "Looking good, studying better!"],
          pet: ["Hehe! Gentle pats only, thank you!", "Aww! My fringe is fluttering!"],
          hello: ["You're back! I fluffed my fringe for you!", "Hi hi! Ready to party study?"],
          morning: ["Good morning! Fresh fringe, fresh day!"], night: ["Hanging up for the night. Sleep tight!"],
          focus: ["Hanging very still for you. Focus!", "Quiet llama, busy brain. You've got this."],
          done: ["WOW! That session was sweeter than candy!", "Done! I'm wiggling all my fringe!"],
          task: ["DONE! Sweet success!", "Yes! Candy-level win!", "Checked off! Fringe shimmy!"],
          break: ["Break time! Shake your fringe!"]
        }
      },
      {
        id: "birthday-cake", name: "Layla", kind: "Cake Slice", pose: "stand", wearColor: "#7FD8C0",
        bio: "Three layers, extra frosting, one candle.",
        idle: ["topBob", "sparkle", "bounce"], cheer: "spin",
        parts: {
          feet: feet("#E8A0B8", 48, 72),
          body: `${LG("birthday-cake-bday-cak-g", [[0, "#FFF0D8"], [1, "#F2CC98"]])}
            <path d="M24 50L96 50L92 104Q92 107 89 107H31Q28 107 28 104Z" fill="url(#birthday-cake-bday-cak-g)" ${O}/>
            <path d="M26.5 68H94M27.4 86H93" stroke="#F49AB8" stroke-width="6"/><path d="M26.5 68H94M27.4 86H93" stroke="#FFD0E2" stroke-width="2.4"/>
            <path d="M24 50L96 50L92 104Q92 107 89 107H31Q28 107 28 104Z" fill="none" ${O}/>
            <path d="M22 50C22 42 30 38 60 38C90 38 98 42 98 50C98 56 92 54 90 60C88 56 84 55 82 60C80 55 74 55 72 59C70 55 64 55 62 60C60 55 54 55 52 59C50 55 44 55 42 60C40 55 34 55 32 60C30 55 22 56 22 50Z" fill="#FFF6FA" ${O}/>
            <rect x="34" y="44" width="4" height="2" rx="1" fill="#FF5A7A" transform="rotate(30 36 45)"/><rect x="78" y="44" width="4" height="2" rx="1" fill="#5AB8F0" transform="rotate(-30 80 45)"/><rect x="48" y="42" width="4" height="2" rx="1" fill="#FFD45A"/><rect x="70" y="41" width="4" height="2" rx="1" fill="#B58CF2"/>
            <path d="M34 72V98" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/>`,
          ...arms(23, 97, 78, "#FFE0C0"),
          top: {svg: `<rect x="56" y="18" width="8" height="22" rx="3" fill="#7FD8C0" ${O2}/><path d="M56.5 24L63.5 21M56.5 31L63.5 28" stroke="#fff" stroke-width="2"/>${LINE("M60 18V15", "#5A4A40", 1.6)}<path d="M60 3C55 9 56 14 60 14C64 14 65 9 60 3Z" fill="#FFB53A" ${O2}/><path d="M60 8C58.6 10.4 58.8 12 60 12C61.2 12 61.4 10.4 60 8Z" fill="#FFF4C0"/>`, pivot: [60, 40]}
        },
        eyes: {lx: 50, rx: 70, y: 76, r: 4.8, style: "sparkle", color: "#3A2418"},
        mouth: {x: 60, y: 83, w: 3, color: "#3A2418"},
        cheeks: {lx: 42, rx: 78, y: 82, w: 4.2, h: 2.6, color: "#FF8FA8"},
        anchors: {top: [60, 36, 0.9], neck: [60, 62, 1.05], chest: [74, 96, 0.6], back: [94, 66, 0.85], hands: [60, 98, 0.9]},
        lines: {
          tap: ["Hi! Extra frosting on your day today!", "You're the icing on this study cake!", "Make a wish, then make it happen!", "Layer by layer, you're getting there!", "Sweet work, keep it coming!", "One candle, one goal, all you!", "You deserve a celebration slice!"],
          pet: ["Hehe! Careful, frosting smudge!", "Aww! My candle is flickering happily!"],
          hello: ["You're back! Cake o'clock!", "Hi hi! I saved you the biggest slice!"],
          morning: ["Good morning! Today's a sweet one!"], night: ["Blowing my candle out soon. Sleep well!"],
          focus: ["Candle steady, focus steady. Go!", "Quiet as a cake cooling. You've got this."],
          done: ["WOW! That session takes the cake!", "Done! Make a wish, you earned it!"],
          task: ["DONE! Sweet!", "Yes! Extra sprinkles for that!", "Checked off! Piece of cake!"],
          break: ["Break time! Grab a snack, cake friend's orders!"]
        }
      }
    ]
  });

  /* Crystal Cave */
  COMP_DATA.push({
    theme: "geology",
    companions: [
      {
        id: "geology-geode", name: "Geo", kind: "Geode", pose: "sit", wearColor: "#9A62D8",
        bio: "Plain on the outside, sparkly on the inside.",
        idle: ["topBob", "sparkle", "bounce"], cheer: "spin",
        parts: {
          body: `${RG("geology-geode-geo-geo-r", [[0, "#D2C4B4"], [0.6, "#A8988A"], [1, "#7E6E62"]], 0.38, 0.3, 0.8)}${RG("geology-geode-geo-geo-i", [[0, "#FFF0FF"], [0.45, "#C890F4"], [1, "#7A3EC8"]], 0.5, 0.5, 0.6)}
            <path d="M60 30C84 30 98 50 98 72C98 96 82 109 60 109C38 109 22 96 22 72C22 50 36 30 60 30Z" fill="url(#geology-geode-geo-geo-r)" ${O}/>
            <circle cx="36" cy="54" r="3" fill="#8A7A6C"/><circle cx="86" cy="60" r="2.4" fill="#8A7A6C"/><circle cx="80" cy="44" r="1.8" fill="#8A7A6C"/>
            <path d="M34 90L40 84L46 88L54 82L62 88L70 82L78 88L86 84L88 92Q78 104 60 104Q42 104 33 94Z" fill="#F4F0FA" ${O2}/>
            <path d="M38 92L45 89L53 85L61 90L70 85L78 90L84 88Q76 100 60 100Q46 100 38 92Z" fill="url(#geology-geode-geo-geo-i)"/>
            ${[[44, 94], [52, 92], [60, 95], [68, 92], [76, 94]].map(([x, y]) => `<path d="M${x - 3} ${y + 4}L${x} ${y - 5}L${x + 3} ${y + 4}Z" fill="#E8C8FF" opacity=".9"/>`).join("")}
            <ellipse cx="44" cy="44" rx="6" ry="3.4" transform="rotate(-38 44 44)" fill="#fff" opacity=".6"/>`,
          ...arms(23, 97, 76, "#B4A496"),
          top: {svg: `<path d="M54 32L56 18L60 12L64 18L66 32Z" fill="#B58CF2" ${O2}/><path d="M60 12V32" stroke="${INK}" stroke-width="1" opacity=".4"/><path d="M57 20L59 15" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>${`<path d="M70 18Q70 22 74 22Q70 22 70 26Q70 22 66 22Q70 22 70 18Z" fill="#E8C8FF"/>`}`, pivot: [60, 32]}
        },
        eyes: {lx: 50, rx: 70, y: 64, r: 5, style: "sparkle", color: "#2E2024"},
        mouth: {x: 60, y: 73, w: 3, color: "#2E2024"},
        cheeks: {lx: 42.5, rx: 77.5, y: 71, w: 4.2, h: 2.6, color: "#FF9FB4"},
        anchors: {top: [60, 32, 0.9], neck: [60, 84, 1], chest: [76, 80, 0.6], back: [92, 60, 0.85], hands: [60, 88, 0.9]},
        lines: {
          tap: ["Hi! Don't judge a rock by its crust!", "You've got sparkles inside too!", "Crack open that chapter! I believe in you!", "Rock solid work today!", "Every layer you learn makes you shine!", "You're a gem, truly!", "Pressure makes crystals. You're doing great!"],
          pet: ["Hehe! My crystals are tingling!", "Aww! That's a rock-star pat!"],
          hello: ["You're back! My inside sparkles just lit up!", "Hi hi! Ready to dig in?"],
          morning: ["Good morning! Let's uncover something shiny!"], night: ["Going rock-still for the night. Rest soon?"],
          focus: ["Steady as stone. You've got this.", "Quietly sparkling beside you."],
          done: ["WOW! That session cracked me wide open!", "Done! Pure amethyst energy!"],
          task: ["DONE! Sparkle crack!", "Yes! Gem of a job!", "Checked off! Rock on!"],
          break: ["Break time! Stretch, then dig back in!"]
        }
      },
      {
        id: "geology-trilobite", name: "Trilo", kind: "Trilobite", pose: "stand", wearColor: "#3EB4C0",
        bio: "Has been studying for 500 million years.",
        idle: ["waddle", "headTilt", "topBob"], cheer: "hop",
        parts: {
          feet: `${[36, 46, 56, 64, 74, 84].map((x, i) => `<path d="M${x} 98L${x + (i < 3 ? -4 : 4)} 110" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M${x} 98L${x + (i < 3 ? -4 : 4)} 110" stroke="#C8956A" stroke-width="2.4" stroke-linecap="round"/>`).join("")}`,
          body: `${LG("geology-trilobite-geo-tri-b", [[0, "#F2D2AC"], [1, "#C08A5E"]])}
            <path d="M32 62H88L84 98Q72 108 60 108Q48 108 36 98Z" fill="url(#geology-trilobite-geo-tri-b)" ${O}/>
            ${[70, 78, 86, 94].map(y => `<path d="M${33 + (y - 62) * 0.12} ${y}Q60 ${y + 4} ${87 - (y - 62) * 0.12} ${y}" fill="none" stroke="${INK}" stroke-width="1.8" opacity=".45"/>`).join("")}
            <path d="M50 64V104M70 64V104" stroke="${INK}" stroke-width="1.8" opacity=".4"/><path d="M38 70Q38 88 44 98" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".5"/>`,
          head: `${RG("geology-trilobite-geo-tri-h", [[0, "#FAE4C6"], [1, "#D2A070"]], 0.4, 0.35, 0.8)}
            <path d="M22 66C22 44 38 32 60 32C82 32 98 44 98 66Q60 72 22 66Z" fill="url(#geology-trilobite-geo-tri-h)" ${O}/>
            <path d="M22 66L14 82M98 66L106 82" stroke="${INK}" stroke-width="5.4" stroke-linecap="round"/><path d="M22 66L14 82M98 66L106 82" stroke="#D2A070" stroke-width="2.6" stroke-linecap="round"/>
            <ellipse cx="44" cy="44" rx="6" ry="3.2" transform="rotate(-30 44 44)" fill="#fff" opacity=".6"/>`,
          top: {svg: `${LINE("M52 34Q46 18 36 14", "#C08A5E", 2.4)}${LINE("M68 34Q74 18 84 14", "#C08A5E", 2.4)}<circle cx="36" cy="14" r="3" fill="#F2D2AC" ${OW(1.6)}/><circle cx="84" cy="14" r="3" fill="#F2D2AC" ${OW(1.6)}/>`, pivot: [60, 34]}
        },
        eyes: {lx: 48, rx: 72, y: 52, r: 5, style: "round", color: "#2A1E18"},
        mouth: {x: 60, y: 61, w: 3, color: "#2A1E18"},
        cheeks: {lx: 38, rx: 82, y: 58, w: 4.2, h: 2.6, color: "#FF9F9F"},
        neck: [60, 66],
        anchors: {top: [60, 32, 0.9], neck: [60, 66, 1.05], chest: [72, 86, 0.6], back: [88, 76, 0.85], hands: [60, 92, 0.9]},
        lines: {
          tap: ["Hi! I've been studying since the Cambrian!", "Slow and steady, like sediment!", "Half a billion years of experience says: you've got this!", "Every layer you learn is a new rock record!", "You're making history. Literal history!", "Tiny legs, big dreams!", "Fossils are proof that showing up lasts!"],
          pet: ["Hehe! My segments are wiggling!", "Aww! A pat worth fossilizing!"],
          hello: ["You're back! Only took you an epoch!", "Hello! Ready to dig into some learning?"],
          morning: ["Good morning! A fresh layer of today!"], night: ["Curling up like a fossil. Sleep well!"],
          focus: ["Scuttling quietly beside you. Focus!", "Patient as stone. You've got this."],
          done: ["WOW! That session will be in the rock record!", "Done! Prehistoric levels of focus!"],
          task: ["DONE! Scuttle of joy!", "Yes! That one's set in stone!", "Checked off! Ancient wisdom approves!"],
          break: ["Break time! Stretch all those little legs!"]
        }
      },
      {
        id: "geology-sprite", name: "Glint", kind: "Crystal Sprite", pose: "float", wearColor: "#C29AFF",
        bio: "A purple point of light that hums when you focus.",
        idle: ["sparkle", "spin", "topBob"], cheer: "spin",
        parts: {
          back: `<path d="M38 70C22 60 14 74 22 82C28 86 36 82 40 76Z" fill="#C8FAFF" fill-opacity=".85" ${O2}/><path d="M82 70C98 60 106 74 98 82C92 86 84 82 80 76Z" fill="#C8FAFF" fill-opacity=".85" ${O2}/>`,
          body: `${LG("geology-sprite-geo-spr-a", [[0, "#F2E2FF"], [0.5, "#C29AFF"], [1, "#8A52E0"]], 0, 0, 1, 1)}
            <path d="M60 22L84 52L78 100L60 110L42 100L36 52Z" fill="url(#geology-sprite-geo-spr-a)" ${O}/>
            <path d="M60 22L60 110M36 52L60 60L84 52" fill="none" stroke="${INK}" stroke-width="1.6" opacity=".35"/><path d="M46 52L58 30" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".8"/>
            ${twinkle(30, 40, 3.4, "#FFD8EE")}${twinkle(92, 98, 3, "#C8FAFF")}`,
          ...arms(36, 84, 78, "#D6BEFF", 25, 4.2, 5.6),
          top: {svg: `${twinkle(60, 12, 8, "#FFF4B0")}<path d="M60 4Q60 12 68 12Q60 12 60 20Q60 12 52 12Q60 12 60 4Z" fill="none" ${OW(1.6)}/>`, pivot: [60, 22]}
        },
        eyes: {lx: 51, rx: 69, y: 68, r: 4.8, style: "sparkle", color: "#2A1648"},
        mouth: {x: 60, y: 77, w: 3, color: "#2A1648"},
        cheeks: {lx: 44, rx: 76, y: 75, w: 4.2, h: 2.6, color: "#FF9FD8"},
        anchors: {top: [60, 26, 0.8], neck: [60, 88, 0.85], chest: [70, 92, 0.55], back: [86, 62, 0.8], hands: [60, 92, 0.85]},
        lines: {
          tap: ["Hmmmm! That's my happy hum!", "You make me glow brighter!", "Focus makes crystals grow. Let's grow!", "Bright mind, bright day!", "I'll light the way, you take the steps!", "Little light, big belief in you!", "Shine on, study star!"],
          pet: ["Hehe! I'm humming all over!", "Aww! Now I'm extra sparkly!"],
          hello: ["You're back! My glow just turned on!", "Hi hi! Let's light up some learning!"],
          morning: ["Good morning! Catch the first light!"], night: ["Dimming to a soft glow. Rest soon?"],
          focus: ["Hmmmm... humming along while you focus.", "Glowing steady. You've got this."],
          done: ["WOW! I'm glowing at full brightness!", "Done! What a shimmering session!"],
          task: ["DONE! Flash of light!", "Yes! Crystal clear win!", "Checked off! Sparkle sparkle!"],
          break: ["Break time! Rest your eyes from the glow!"]
        }
      }
    ]
  });

  /* Postcard Plaza */
  COMP_DATA.push({
    theme: "languages",
    companions: [
      {
        id: "languages-parrot", name: "Polly", kind: "Polyglot Parrot", pose: "stand", wearColor: "#3E7AE0",
        bio: "Says hello in twelve languages and goodbye in none.",
        idle: ["headTilt", "wingFlutter", "topBob"], cheer: "wingFlutter",
        parts: {
          tail: {svg: `<path d="M54 100L48 118L58 112L60 120L64 112L72 118L66 100Z" fill="#3E7AE0" ${O}/>`, pivot: [60, 100]},
          feet: `${LINE("M52 104L50 110M68 104L70 110", "#E8A070", 3)}`,
          body: `${LG("languages-parrot-lang-par-b", [[0, "#8AE8A4"], [1, "#2EA05A"]])}
            <path d="M60 60C78 60 86 74 86 86C86 100 74 106 60 106C46 106 34 100 34 86C34 74 42 60 60 60Z" fill="url(#languages-parrot-lang-par-b)" ${O}/>
            <ellipse cx="60" cy="90" rx="13" ry="11" fill="#FFE07A" opacity=".85"/><path d="M52 86l3 3l3-3M62 86l3 3l3-3" fill="none" stroke="#E8A040" stroke-width="1.6" stroke-linecap="round"/>`,
          wingL: {svg: `<path d="M36 72C24 76 22 92 30 100C38 98 42 86 40 76Z" fill="#E8505B" ${O}/><path d="M30 92Q32 98 34 96" stroke="#FFD45A" stroke-width="2.4" stroke-linecap="round"/>`, pivot: [38, 74]},
          wingR: {svg: `<path d="M84 72C96 76 98 92 90 100C82 98 78 86 80 76Z" fill="#E8505B" ${O}/><path d="M90 92Q88 98 86 96" stroke="#FFD45A" stroke-width="2.4" stroke-linecap="round"/>`, pivot: [82, 74]},
          head: `${RG("languages-parrot-lang-par-h", [[0, "#FF9A90"], [0.6, "#EE5A52"], [1, "#C83A3A"]], 0.4, 0.35, 0.8)}
            <path d="M60 22C78 22 86 34 86 46C86 58 76 66 60 66C44 66 34 58 34 46C34 34 42 22 60 22Z" fill="url(#languages-parrot-lang-par-h)" ${O}/>
            <ellipse cx="60" cy="47" rx="17" ry="13" fill="#FFF4E6" opacity=".95"/>
            <path d="M60 50C68 50 72 56 68 62C66 60 62 58 60 60C58 58 54 60 52 62C48 56 52 50 60 50Z" fill="#FFD45A" ${O2}/><path d="M56 59Q60 63 64 59" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>
            <ellipse cx="44" cy="32" rx="5" ry="2.8" transform="rotate(-35 44 32)" fill="#fff" opacity=".5"/>`,
          top: {svg: `<path d="M56 24C50 12 54 4 60 8C58 14 60 20 60 24ZM62 24C62 12 68 6 72 10C68 14 66 20 64 24Z" fill="#FFD45A" ${O2}/><path d="M52 26C44 18 44 12 50 12C52 18 54 22 56 25Z" fill="#3E7AE0" ${O2}/>`, pivot: [60, 24]}
        },
        eyes: {lx: 51, rx: 69, y: 44, r: 4.4, style: "sparkle", color: "#1E1A2E"},
        mouth: {x: 60, y: 57, w: 0.1},
        mouths: {
          neutral: `<path d="M56 59Q60 62 64 59" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`,
          smile: `<path d="M55 58.4Q60 63.6 65 58.4" fill="none" stroke="${INK}" stroke-width="1.9" stroke-linecap="round"/>`,
          open: `<path d="M56 57.6Q60 66 64 57.6Z" fill="#FF8FA8" ${OW(1.6)}/>`,
          sleepy: `<ellipse cx="60" cy="60" rx="1.5" ry="1.8" fill="${INK}"/>`
        },
        cheeks: {lx: 45, rx: 75, y: 51, w: 3.8, h: 2.4, color: "#FF8FA8"},
        neck: [60, 64],
        anchors: {top: [60, 22, 0.85], neck: [60, 66, 0.85], chest: [70, 92, 0.6], back: [86, 80, 0.8], hands: [60, 96, 0.85]},
        lines: {
          tap: ["Hola! Bonjour! Ciao! Hi!", "Squawk! You're doing great in every language!", "Repeat after me: I've got this!", "New word unlocked! Brilliant!", "Grazie for studying with me!", "Practice makes perfecto!", "Words are wings. Let's fly!"],
          pet: ["Squawk! Merci, merci!", "Hehe! Ruffled feathers, happy heart!"],
          hello: ["Hello! Hallo! Olá! You're back!", "Konnichiwa! Ready for new words?"],
          morning: ["Buenos días! Good morning, friend!"], night: ["Bonne nuit... I mean, rest soon!"],
          focus: ["Shh... silent in every language. Go!", "Quiet beak, big cheers. Focus!"],
          done: ["Bravo! Bravissimo! What a session!", "Fantástico! Session done!"],
          task: ["DONE! Fantastique!", "Sí! Checked off!", "Wunderbar! Another one!"],
          break: ["Pausa! Stretch your wings!"]
        }
      },
      {
        id: "languages-stamp", name: "Stampy", kind: "Postage Stamp", pose: "stand", wearColor: "#C2443E",
        bio: "Collects one city for every unit you finish.",
        idle: ["topBob", "sway", "wave"], cheer: "bounce",
        parts: {
          feet: feet("#C2443E", 48, 72),
          body: `${LG("languages-stamp-lang-stp-i", [[0, "#A8DCF0"], [1, "#6AB4D8"]])}
            <path d="${(() => { let d = "M30 28"; for (let i = 1; i <= 8; i++) d += `Q${30 + i * 7.5 - 3.75} ${31} ${30 + i * 7.5} 28`; for (let i = 1; i <= 10; i++) d += `Q${87} ${28 + i * 8 - 4} 90 ${28 + i * 8}`; for (let i = 1; i <= 8; i++) d += `Q${90 - i * 7.5 + 3.75} ${105} ${90 - i * 7.5} 108`; for (let i = 1; i <= 10; i++) d += `Q${33} ${108 - i * 8 + 4} 30 ${108 - i * 8}`; return d + "Z"; })()}" fill="#FFFFFF" ${O}/>
            <rect x="37" y="35" width="46" height="66" rx="3" fill="url(#languages-stamp-lang-stp-i)" ${O2}/>
            <path d="M37 86Q50 76 60 84T83 80V101H37Z" fill="#7FC07A"/><circle cx="74" cy="44" r="5" fill="#FFE08A"/>
            <path d="M52 101V88H68V101" fill="#E8A898" ${OW(1.4)}/><path d="M50 88L60 81L70 88Z" fill="#D2704E" ${OW(1.4)}/>
            <text x="44" y="98" font-family="Lexend,Arial,sans-serif" font-weight="800" font-size="8" fill="#fff">50</text>`,
          ...arms(26, 94, 72, "#FFFFFF"),
          top: {svg: `<g fill="none" stroke="#3E5A9A" stroke-width="2.2" stroke-linecap="round" opacity=".85"><circle cx="82" cy="24" r="10"/><path d="M60 18Q64 15 68 18T76 18M58 24Q62 21 66 24T74 24M60 30Q64 27 68 30T76 30"/></g>`, pivot: [70, 30]}
        },
        eyes: {lx: 51, rx: 69, y: 56, r: 4.8, style: "sparkle", color: "#1E2A40"},
        mouth: {x: 60, y: 65, w: 3, color: "#1E2A40"},
        cheeks: {lx: 44, rx: 76, y: 63, w: 4.2, h: 2.6, color: "#FF8FA8"},
        anchors: {top: [60, 26, 0.85], neck: [60, 76, 0.85], chest: [72, 92, 0.55], back: [88, 60, 0.85], hands: [60, 96, 0.85]},
        lines: {
          tap: ["Hi! Stick with it, like me!", "One more unit, one more city!", "First class work today!", "You deliver every time!", "My collection grows with you!", "Sealed with a smile for you!", "Next stop: success!"],
          pet: ["Hehe! Don't lick me, just pat!", "Aww! That's a first-class pat!"],
          hello: ["You're back! Special delivery: me!", "Hi hi! Where are we studying today?"],
          morning: ["Good morning! Fresh mail, fresh day!"], night: ["Off to the mailbag for the night. Rest soon?"],
          focus: ["Stuck right here beside you. Focus!", "Quiet as a letter in a drawer."],
          done: ["WOW! That session goes in my album!", "Done! Stamped and approved!"],
          task: ["DONE! Stamped!", "Yes! Another city collected!", "Checked off! Postmarked awesome!"],
          break: ["Break time! Stretch your perforations!"]
        }
      },
      {
        id: "languages-map", name: "Atlas", kind: "Folded Map", pose: "stand", wearColor: "#3E7A70",
        bio: "Always knows the way, never folds back right.",
        idle: ["sway", "wave", "headTilt"], cheer: "spin",
        parts: {
          feet: feet("#C8A070", 48, 72),
          body: `<path d="M30 66L48 62L60 66L72 62L90 66V106L72 102L60 106L48 102L30 106Z" fill="#FFF4DC" ${O}/>
            <path d="M48 62V102M60 66V106M72 62V102" stroke="${INK}" stroke-width="1.6" opacity=".35"/><path d="M48 62L60 66V106L48 102Z M72 62L90 66V106L72 102Z" fill="#E8D6B4" opacity=".7"/>
            <path d="M34 92Q44 82 52 88T70 84T86 78" fill="none" stroke="#E8505B" stroke-width="2" stroke-dasharray="3 3" stroke-linecap="round"/><path d="M34 74Q40 70 44 76T40 86Z" fill="#9CCB8C"/><path d="M76 86Q82 82 86 88T80 96Z" fill="#9CCB8C"/>
            <path d="M84 74C84 70 88 70 88 74C88 77 86 79 86 80C86 79 84 77 84 74Z" fill="#E8505B" ${OW(1.2)}/>`,
          ...arms(26, 94, 80, "#FFF4DC"),
          head: `${LG("languages-map-lang-map-h", [[0, "#FFFAEC"], [1, "#F2E2C2"]])}
            <path d="M28 30L48 24L60 30L72 24L92 30V64L72 58L60 64L48 58L28 64Z" fill="url(#languages-map-lang-map-h)" ${O}/>
            <path d="M48 24V58M60 30V64M72 24V58" stroke="${INK}" stroke-width="1.6" opacity=".3"/><path d="M28 30L48 24V58L28 64Z" fill="#E8D6B4" opacity=".5"/>
            <path d="M80 30L84 36L80 42L76 36Z" fill="#E8505B" ${OW(1.2)}/><path d="M80 34V38" stroke="#fff" stroke-width="1"/><path d="M33 36Q37 32 41 36" fill="none" stroke="#7FC4E0" stroke-width="2" stroke-linecap="round"/>`
        },
        eyes: {lx: 51, rx: 69, y: 44, r: 4.6, style: "sparkle", color: "#2A2016"},
        mouth: {x: 60, y: 53, w: 3, color: "#2A2016"},
        cheeks: {lx: 43, rx: 77, y: 51, w: 4, h: 2.5, color: "#FF9F8F"},
        neck: [60, 64],
        anchors: {top: [60, 26, 0.9], neck: [60, 64, 0.95], chest: [74, 92, 0.55], back: [90, 76, 0.85], hands: [60, 96, 0.85]},
        lines: {
          tap: ["Hi! You are here, and that's great!", "I know the way: one step at a time!", "Next stop: understanding!", "Plotting a route to your goals!", "Every chapter is a new country!", "Lost? Never. Just exploring!", "X marks the spot, and that spot is success!"],
          pet: ["Hehe! Now I'll never fold back right!", "Aww! My creases are smiling!"],
          hello: ["You're back! Let's chart today's route!", "Hi hi! Where are we headed?"],
          morning: ["Good morning! A whole map of possibility!"], night: ["Folding up for the night. Sweet dreams!"],
          focus: ["Route set. Full speed ahead!", "Quiet as a map in a backpack. Go!"],
          done: ["WOW! We covered so much ground!", "Done! Destination reached!"],
          task: ["DONE! Checkpoint reached!", "Yes! New territory!", "Checked off! On the map!"],
          break: ["Break time! Take the scenic route!"]
        }
      }
    ]
  });
})();
