/* ===== module: 98-comp-b1.js ===== */
/* Study Companions, batch 1 */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);

  /* Spring */
  COMP_DATA.push({
    theme: "spring",
    companions: [
      {
        id: "spring-tulip", name: "Tully", kind: "Tulip Bud", pose: "stand",
        bio: "A sunny little tulip who blooms a bit more with every task.",
        idle: ["sway", "wave", "bounce"], cheer: "spin",
        parts: {
          feet: `${LINE("M60 90V104", "#5DAA4E", 4.4)}
            <path d="M60 106C54 100 45 99 39 104C44 110 53 111 60 106Z" fill="#8CCB6E" ${O}/>
            <path d="M60 106C66 100 75 99 81 104C76 110 67 111 60 106Z" fill="#8CCB6E" ${O}/>`,
          body: `${LG("spring-tulip-g", [[0, "#FFC9DD"], [0.5, "#F9A0C4"], [1, "#EC79A8"]])}
            <path d="M60 94C41 94 30 83 30 66C30 56 31 47 33 39C39 41 45 45 48 50C51 42 55 36 60 31C65 36 69 42 72 50C75 45 81 41 87 39C89 47 90 56 90 66C90 83 79 94 60 94Z" fill="url(#spring-tulip-g)" ${O}/>
            <path d="M48 50Q45.5 55 45 60.5M72 50Q74.5 55 75 60.5" fill="none" stroke="#E0679A" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M36 62Q35.5 52 37.5 45" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".8"/><circle cx="36.5" cy="68.5" r="1.8" fill="#fff" opacity=".7"/>
            <path d="M42 87Q60 95 78 87" fill="none" stroke="#DB6699" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>`,
          armL: {svg: `<path d="M35 76C29 71.5 21.5 73 18 79C23 84 30.5 83.5 36 80Z" fill="#8CCB6E" ${O}/><path d="M33.5 78Q27 77 21.5 79" fill="none" stroke="#5DAA4E" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [36, 78]},
          armR: {svg: `<path d="M85 76C91 71.5 98.5 73 102 79C97 84 89.5 83.5 84 80Z" fill="#8CCB6E" ${O}/><path d="M86.5 78Q93 77 98.5 79" fill="none" stroke="#5DAA4E" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [84, 78]}
        },
        eyes: {lx: 50, rx: 70, y: 70, r: 4.8, style: "dot"},
        mouth: {x: 60, y: 79, w: 3.2},
        cheeks: {lx: 42.5, rx: 77.5, y: 77.5, w: 4.4, h: 2.8, color: "#FF7FA6"},
        anchors: {top: [60, 40, 0.85], neck: [60, 90, 0.95], chest: [71, 87, 0.68], back: [86, 68, 0.85], hands: [60, 90, 0.85]},
        lines: {
          tap: ["Hi! I'm in full bloom for you!", "You're growing a little every day!", "You're blossoming beautifully, friend!", "Sun on your face, notes in hand! Yay!", "Tiny petals, big progress!", "Water, snack, then back to blooming?", "Spring into it! You've got this!"],
          pet: ["Hehe, that tickles my petals!", "Aww, thank you! I'm blooming!"],
          hello: ["Hello! The tulips missed you so much!", "Hi hi! Ready to grow together?"],
          morning: ["Good morning! My petals are opening for you!", "Morning, sunshine! What a bright day!"],
          night: ["Petals closing now. Rest soon?", "Even flowers sleep. You too, friend."],
          focus: ["Rooting for you quietly! Let's focus!", "Quiet garden, calm mind. You've got this!"],
          done: ["You bloomed! What a session!", "Session done! I'm so proud of you!"],
          task: ["WOO! One more done!", "Another petal open! Yay!", "Done and done! Amazing!", "Yes yes! That's real growth!"],
          break: ["Stretch toward the sun! Ahh!", "Break time! Sip some water and smile!"]
        }
      },
      {
        id: "spring-butterfly", name: "Flutterby", kind: "Chubby Butterfly", pose: "float",
        bio: "A round little butterfly who flutters by to cheer you on.",
        idle: ["wingFlutter", "earTwitch", "sparkle"], cheer: "wingFlutter",
        parts: {
          wingL: {svg: `${LG("spring-butterfly-wl", [[0, "#FFD0E4"], [1, "#F48DBB"]])}
            <path d="M44 56C36 42 22 30 14 35C7 40 10 55 22 61C30 65 39 64 44 62Z" fill="url(#spring-butterfly-wl)" ${O}/>
            <path d="M44 67C34 68 22 74 22 84C23 92 35 92 42 82C44 78 45 72 44 67Z" fill="url(#spring-butterfly-wl)" ${O}/>
            <circle cx="24" cy="46" r="5" fill="#FFE89A"/><circle cx="32" cy="81" r="3.6" fill="#FFE89A"/>`, pivot: [45, 62]},
          wingR: {svg: `${LG("spring-butterfly-wr", [[0, "#FFD0E4"], [1, "#F48DBB"]])}
            <path d="M76 56C84 42 98 30 106 35C113 40 110 55 98 61C90 65 81 64 76 62Z" fill="url(#spring-butterfly-wr)" ${O}/>
            <path d="M76 67C86 68 98 74 98 84C97 92 85 92 78 82C76 78 75 72 76 67Z" fill="url(#spring-butterfly-wr)" ${O}/>
            <circle cx="96" cy="46" r="5" fill="#FFE89A"/><circle cx="88" cy="81" r="3.6" fill="#FFE89A"/>`, pivot: [75, 62]},
          earL: {svg: `${LINE("M53 43C51 35 47 30 43 28", "#7A5FC8", 2.4)}<circle cx="42" cy="27" r="4" fill="#F7CF55" ${O2}/>`, pivot: [54, 44]},
          earR: {svg: `${LINE("M67 43C69 35 73 30 77 28", "#7A5FC8", 2.4)}<circle cx="78" cy="27" r="4" fill="#F7CF55" ${O2}/>`, pivot: [66, 44]},
          body: `${RG("spring-butterfly-g", [[0, "#F1E9FF"], [0.55, "#D2BFFA"], [1, "#A98AEE"]], 0.42, 0.34, 0.72)}
            <ellipse cx="60" cy="64" rx="22" ry="23" fill="url(#spring-butterfly-g)" ${O}/>
            <path d="M42.5 58Q44 49 51 44.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".85"/>
            <path d="M46 82Q60 88.5 74 82" fill="none" stroke="#9677E0" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>`,
          armL: {svg: `<ellipse cx="39.5" cy="75" rx="4.4" ry="5.6" transform="rotate(25 39.5 75)" fill="#C3ADF6" ${O}/>`, pivot: [44, 73]},
          armR: {svg: `<ellipse cx="80.5" cy="75" rx="4.4" ry="5.6" transform="rotate(-25 80.5 75)" fill="#C3ADF6" ${O}/>`, pivot: [76, 73]}
        },
        eyes: {lx: 51, rx: 69, y: 63, r: 5, style: "dot", color: "#2E2250"},
        mouth: {x: 60, y: 72, w: 3},
        cheeks: {lx: 44, rx: 76, y: 70.5, w: 4.2, h: 2.7, color: "#FF94BC"},
        anchors: {top: [60, 43, 0.85], neck: [60, 82, 0.95], chest: [70, 80, 0.6], back: [81, 58, 0.8], hands: [60, 81, 0.85]},
        lines: {
          tap: ["Flutter flutter, hi hi!", "I'm so happy to see you!", "Light as a wing, you've got this!", "Little changes, big beautiful wings!", "Floating by to say you're amazing!", "Every step is a flutter forward!", "Little by little, you're soaring!"],
          pet: ["Hehe, wing hugs! Yay!", "My wings are all a-flutter!"],
          hello: ["Hi! I flew right over to see you!", "Hello! Such a pretty day with you here!"],
          morning: ["Good morning! My wings are warm and ready!", "Morning, bright bud! Let's fly today!"],
          night: ["Folding my wings now. Rest soon?", "Moonlit meadow. Bedtime, friend?"],
          focus: ["Landing quietly beside you. Let's go!", "Hovering right here. You've got this!"],
          done: ["You soared! What a session!", "Session done! Happy flutters for you!"],
          task: ["Flutter flutter! DONE!", "Wings up! That's finished!", "Yes! One more done!", "Look at you fly! Amazing!"],
          break: ["Stretch those wings! Flap flap!", "Float around a little! Break time!"]
        }
      },
      {
        id: "spring-mole", name: "Digby", kind: "Garden Mole", pose: "sit", sleepy: true,
        bio: "A velvety garden mole who pops up between the tulips to say hi.",
        idle: ["topBob", "finWiggle", "bounce"], cheer: "hop",
        parts: {
          body: `${LG("spring-mole-g", [[0, "#C8BEE6"], [0.55, "#AA9ED4"], [1, "#8C7FBA"]])}${LG("spring-mole-d", [[0, "#B07C52"], [1, "#7E5334"]])}
            <path d="M60 38C80 38 88 54 88 72C88 88 80 100 60 100C40 100 32 88 32 72C32 54 40 38 60 38Z" fill="url(#spring-mole-g)" ${O}/>
            <path d="M38.5 66Q39 53 47 45.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".7"/>
            <ellipse cx="60" cy="76" rx="9.5" ry="6.6" fill="#E4DEF3"/>
            <ellipse cx="60" cy="72.6" rx="4.2" ry="3.1" fill="#FF9DB6" ${OW(2)}/>
            <path d="M24 111C26 101 40 96 60 96C80 96 94 101 96 111Z" fill="url(#spring-mole-d)" ${O}/>
            <path d="M34 103Q40 99.5 47 99" fill="none" stroke="#C99C72" stroke-width="2.4" stroke-linecap="round"/>
            <circle cx="72" cy="104.5" r="1.8" fill="#C99C72"/><circle cx="82" cy="106" r="1.4" fill="#C99C72"/>`,
          armL: {svg: `<path d="M45 86C37 86 30 92 31 98.5C32 103 38 104.5 44 102.5C49.5 100.5 51.5 94 48 89Z" fill="#FFB9CB" ${O}/><path d="M35 99.5Q38 101.5 42 101" fill="none" stroke="#F08FAA" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [45, 86]},
          armR: {svg: `<path d="M75 86C83 86 90 92 89 98.5C88 103 82 104.5 76 102.5C70.5 100.5 68.5 94 72 89Z" fill="#FFB9CB" ${O}/><path d="M85 99.5Q82 101.5 78 101" fill="none" stroke="#F08FAA" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [75, 86]},
          top: {svg: `${LINE("M60 39.5C60 35 60.5 32 62 29", "#5DAA4E", 2.4)}<path d="M60.5 35C56 31 50 31.5 47.5 34C51 37.5 56.5 38 60.5 35Z" fill="#8CCB6E" ${OW(2)}/>
            ${[0, 60, 120, 180, 240, 300].map(a => `<ellipse cx="63" cy="20.5" rx="2.9" ry="4.6" transform="rotate(${a} 63 25.5)" fill="#FFFFFF" ${OW(1.8)}/>`).join("")}
            <circle cx="63" cy="25.5" r="3" fill="#F7CF55" ${OW(1.8)}/>`, pivot: [60, 40]}
        },
        eyes: {lx: 49.5, rx: 70.5, y: 63, r: 4.5, style: "dot", color: "#2A2140"},
        mouth: {x: 60, y: 78.5, w: 2.6, style: "cat", color: "#2A2140"},
        cheeks: {lx: 42, rx: 78, y: 71, w: 4.4, h: 2.7, color: "#FF94B4"},
        anchors: {top: [60, 41, 0.9], neck: [60, 88, 1.0], chest: [74, 84, 0.62], back: [86, 64, 0.85], hands: [60, 90, 0.9]},
        lines: {
          tap: ["Pop! Hi there, friend!", "Dig in! You're doing great!", "Deep roots, strong growth! That's you!", "Little tunnels, big progress!", "I really dig your study style!", "Water, snack, then back to it?", "Rest is part of growing, and you're growing!"],
          pet: ["Hehe, soft pats! I love it!", "Hehe, my nose is wiggling with joy!"],
          hello: ["Pop! You're back! Hooray!", "Hi! The whole garden missed you!"],
          morning: ["Good morning! Popping up just to say hi!", "Morning, sunshine! Let's dig in today!"],
          night: ["Burrow time. Bed soon, friend?", "Cozy tunnel, cozy sleep. Rest well."],
          focus: ["Digging in quietly with you. Let's go!", "Shh, cozy focus time. You've got this!"],
          done: ["You dug deep! What a session!", "Session done! I'm so proud of you!"],
          task: ["Pop! DONE!", "Dug that one right up! Woo!", "Yes! One less thing!", "Look at you go! Amazing!"],
          break: ["Stretch those paws! Wiggle wiggle!", "Snack and some sunshine! Fun break!"]
        }
      }
    ]
  });

  /* Summer */
  COMP_DATA.push({
    theme: "summer",
    companions: [
      {
        id: "summer-scoop", name: "Scoop", kind: "Ice Cream Cone", pose: "float", wearColor: "#3FB8A6", hatTop: true,
        bio: "A sweet strawberry scoop who keeps cool while you study.",
        idle: ["topBob", "wave", "sway"], cheer: "hop",
        parts: (() => {
          const f1 = v => Math.round(v * 10) / 10;
          const cone = "M37 70H83L64.6 104.6Q60 111.4 55.4 104.6Z";
          // the waffle crosshatch: diagonals cut to the cone's box, then clipped to the cone
          const X0 = 36, X1 = 84, Y0 = 69, Y1 = 112;
          let hatch = "";
          for (let c = X0 - Y1; c <= X1 - Y0; c += 7.5) {
            const a = [Math.max(X0, Y0 + c), Math.min(X1, Y1 + c)];
            if (a[1] - a[0] > 1) hatch += `M${f1(a[0])} ${f1(a[0] - c)}L${f1(a[1])} ${f1(a[1] - c)}`;
            const d = 120 - c, b = [Math.max(X0, d - Y1), Math.min(X1, d - Y0)];
            if (b[1] - b[0] > 1) hatch += `M${f1(b[0])} ${f1(d - b[0])}L${f1(b[1])} ${f1(d - b[1])}`;
          }
          // the scoop: a round dome with a soft scalloped drip edge (one longer drip)
          const scoop = "M32 72C26 52 41 31 60 31C79 31 94 52 88 72A6 6 0 0 1 77 75A5.5 5.5 0 0 1 66 75V80A5 5 0 0 1 56 80V75A6 6 0 0 1 44 75A6 6 0 0 1 32 72Z";
          const spr = (x, y, a, c) => `<path d="M${f1(x - 2.4 * Math.cos(a * Math.PI / 180))} ${f1(y - 2.4 * Math.sin(a * Math.PI / 180))}L${f1(x + 2.4 * Math.cos(a * Math.PI / 180))} ${f1(y + 2.4 * Math.sin(a * Math.PI / 180))}" stroke="${c}" stroke-width="2.8" stroke-linecap="round"/>`;
          return {
            body: `${LG("summer-scoop-c", [[0, "#F7CF8C"], [1, "#DE9F55"]])}${RG("summer-scoop-s", [[0, "#FFE1EA"], [0.55, "#FFB3C9"], [1, "#F587A8"]], 0.42, 0.34, 0.75)}
              <defs><clipPath id="summer-scoop-clip"><path d="${cone}"/></clipPath></defs>
              <path d="${cone}" fill="url(#summer-scoop-c)"/>
              <path d="${hatch}" clip-path="url(#summer-scoop-clip)" fill="none" stroke="#C98840" stroke-width="1.7" stroke-linecap="round"/>
              <path d="${cone}" fill="none" ${O}/>
              <path d="${scoop}" fill="url(#summer-scoop-s)" ${O}/>
              <path d="M37.5 54Q38.5 43.5 46.5 37" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>
              ${spr(55, 37, -20, "#FFD54A")}${spr(66.5, 36.5, 35, "#5EC8E8")}${spr(76, 42.5, -55, "#8EDB9E")}${spr(47.5, 44.5, 60, "#B98CF0")}${spr(81.5, 52, 20, "#FFD54A")}${spr(60, 44, 80, "#FF9F43")}`,
            armL: {svg: `<ellipse cx="43.5" cy="87" rx="4.8" ry="6.8" transform="rotate(32 43.5 87)" fill="#F3C27D" ${O}/>`, pivot: [47.5, 83]},
            armR: {svg: `<ellipse cx="76.5" cy="87" rx="4.8" ry="6.8" transform="rotate(-32 76.5 87)" fill="#F3C27D" ${O}/>`, pivot: [72.5, 83]},
            top: {svg: `${RG("summer-scoop-k", [[0, "#FF8A8A"], [0.6, "#F04656"], [1, "#C92A3E"]], 0.38, 0.32, 0.75)}
              ${LINE("M60.5 26Q61.5 19 67.5 14.5", "#6BAF5A", 2.2)}
              <circle cx="60" cy="27.5" r="6.4" fill="url(#summer-scoop-k)" ${O}/><circle cx="57.6" cy="25.2" r="1.6" fill="#fff"/>`, pivot: [60, 33]}
          };
        })(),
        eyes: {lx: 49, rx: 71, y: 58, r: 4.8, style: "dot"},
        mouth: {x: 60, y: 66, w: 3.2},
        cheeks: {lx: 41.5, rx: 78.5, y: 65, w: 4.2, h: 2.6, color: "#FF5C86"},
        anchors: {top: [60, 33, 0.9], neck: [60, 78, 1.0], chest: [71, 87, 0.6], back: [86, 62, 0.85], hands: [60, 92, 0.85]},
        lines: {
          tap: ["Hi! Cool, sweet, and happy to see you!", "You're doing scoop-er work today!", "One scoop at a time, you've got this!", "Stay cool! You're on a roll!", "Sending you sprinkles of good luck!", "Sip some water! Even ice cream says so!", "Brain freeze? Nope, brain BREEZE!"],
          pet: ["Hehe, careful, I might melt!", "Aww, that's the cherry on top!"],
          hello: ["Hi! Fresh scoop, just for you!", "Hello! Perfect weather for studying!"],
          morning: ["Good morning! Rise and sprinkle!", "Morning, sunshine! Let's make today sweet!"],
          night: ["Back to the freezer for me. Bed soon?", "Cool summer night. Rest well, friend."],
          focus: ["Chill focus mode. You've got this!", "Staying cool right beside you. Let's go!"],
          done: ["Sweet session! You were amazing!", "Session done! Extra sprinkles for you!"],
          task: ["Scoop! DONE!", "Yes! Cherry on top!", "Another scoop of success! Woo!", "Done and dusted with sprinkles!"],
          break: ["Cool down and stretch! Ahh!", "Break! Grab a cold drink and some shade!"]
        }
      },
      {
        id: "summer-melon", name: "Mellie", kind: "Watermelon Slice", pose: "stand",
        bio: "A juicy watermelon slice who's sweet on sunny study days.",
        idle: ["sway", "wave", "bounce"], cheer: "spin",
        parts: {
          feet: `<ellipse cx="50" cy="107.5" rx="6.6" ry="4.2" fill="#4E9A3E" ${O}/><ellipse cx="70" cy="107.5" rx="6.6" ry="4.2" fill="#4E9A3E" ${O}/>`,
          body: `${LG("summer-melon-r", [[0, "#8ED67A"], [1, "#4E9A3E"]])}${LG("summer-melon-f", [[0, "#FFA3AE"], [0.55, "#FF7F8E"], [1, "#F2606F"]])}
            <path d="M25 82Q60 96 95 82C96.5 91 91 98 84 100.5Q60 108 36 100.5C29 98 23.5 91 25 82Z" fill="url(#summer-melon-r)" ${O}/>
            <path d="M28 86.5Q60 99 92 86.5" fill="none" stroke="#F2FBE6" stroke-width="5" stroke-linecap="round"/>
            <path d="M60 24C65 24 69 27 72 33C80 48 88 66 92 81C93 86 90 89 86 89.6Q60 95 34 89.6C30 89 27 86 28 81C32 66 40 48 48 33C51 27 55 24 60 24Z" fill="url(#summer-melon-f)" ${O}/>
            <path d="M47.5 39Q43 47 40.5 55" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".75"/>
            <ellipse cx="60" cy="36" rx="1.7" ry="2.6" fill="#3A2530"/><ellipse cx="54" cy="46" rx="1.7" ry="2.6" transform="rotate(-15 54 46)" fill="#3A2530"/><ellipse cx="66" cy="46" rx="1.7" ry="2.6" transform="rotate(15 66 46)" fill="#3A2530"/>
            <ellipse cx="45" cy="83" rx="1.7" ry="2.6" transform="rotate(-20 45 83)" fill="#3A2530"/><ellipse cx="75" cy="83" rx="1.7" ry="2.6" transform="rotate(20 75 83)" fill="#3A2530"/>`,
          armL: {svg: `<ellipse cx="30.5" cy="75" rx="4.6" ry="6.4" transform="rotate(30 30.5 75)" fill="#FF8C98" ${O}/>`, pivot: [36.5, 73]},
          armR: {svg: `<ellipse cx="89.5" cy="75" rx="4.6" ry="6.4" transform="rotate(-30 89.5 75)" fill="#FF8C98" ${O}/>`, pivot: [83.5, 73]}
        },
        eyes: {lx: 50, rx: 70, y: 64, r: 4.8, style: "dot"},
        mouth: {x: 60, y: 73, w: 3.2},
        cheeks: {lx: 42.5, rx: 77.5, y: 72, w: 4.2, h: 2.6, color: "#FF4F72"},
        anchors: {top: [60, 27, 0.8], neck: [60, 85, 1.2], chest: [72, 80, 0.66], back: [85, 66, 0.85], hands: [60, 84, 0.85]},
        lines: {
          tap: ["Hi! I'm so happy to see you!", "You're doing lovely work!", "Sweet work so far! Keep it up!", "Stay cool, stay sweet, stay awesome!", "Slice by slice, you've got this!", "Hydrate! Melons know best!", "Sending you the sunniest thoughts!"],
          pet: ["Hehe, that tickles my rind!", "Aww, sweet as summer!"],
          hello: ["Hi! Fresh, chilled, and thrilled you're here!", "Hello! Perfect picnic weather!"],
          morning: ["Good morning! What a sweet start!", "Morning, sunshine! Let's make today juicy!"],
          night: ["Chilling in the fridge now. Bed soon?", "Summer nights are for resting. Sleep well."],
          focus: ["Cool focus! Let's go!", "Quiet and sweet. You've got this!"],
          done: ["Sweet session! You were amazing!", "That was a fantastic session!"],
          task: ["Yes! That's DONE!", "Done! So sweet!", "That's a win! Hooray!", "A juicy slice of success! Woo!"],
          break: ["Cool down and sip some water! Ahh!", "Stretch in the shade! Fun break!"]
        }
      },
      {
        id: "summer-ball", name: "Bobo", kind: "Beach Ball Buddy", pose: "float",
        bio: "A bouncy beach ball who's always up for a happy little bounce.",
        idle: ["bounce", "finWiggle", "spin"], cheer: "spin",
        parts: {
          body: `${RG("summer-ball-s", [[0, "#FFFFFF", 0], [0.66, "#FFFFFF", 0], [1, "#13283A", 0.2]], 0.42, 0.38, 0.64)}
            <circle cx="60" cy="62" r="32" fill="#FFFFFF"/>
            <path d="M60 30A32 32 0 0 0 60 94C44.6 88.1 37.5 76.2 37.5 62C37.5 47.8 44.6 35.9 60 30Z" fill="#FF7A70"/>
            <path d="M60 30A32 32 0 0 1 60 94C75.4 88.1 82.5 76.2 82.5 62C82.5 47.8 75.4 35.9 60 30Z" fill="#2EC0DA"/>
            <circle cx="60" cy="62" r="32" fill="url(#summer-ball-s)"/>
            <path d="M60 30C44.6 35.9 37.5 47.8 37.5 62C37.5 76.2 44.6 88.1 60 94M60 30C75.4 35.9 82.5 47.8 82.5 62C82.5 76.2 75.4 88.1 60 94" fill="none" stroke="${INK}" stroke-width="1.8" opacity=".45"/>
            <circle cx="60" cy="62" r="32" fill="none" ${O}/>
            <ellipse cx="60" cy="32.8" rx="7" ry="4.2" fill="#FFD23F" ${O2}/>
            <path d="M34.5 56Q36 45 43.5 38.5" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" opacity=".85"/><circle cx="34.5" cy="64" r="2" fill="#fff" opacity=".75"/>`,
          armL: {svg: `<ellipse cx="27" cy="77" rx="4.8" ry="6.4" transform="rotate(30 27 77)" fill="#FF8F86" ${O}/>`, pivot: [33, 74]},
          armR: {svg: `<ellipse cx="93" cy="77" rx="4.8" ry="6.4" transform="rotate(-30 93 77)" fill="#52CCE2" ${O}/>`, pivot: [87, 74]}
        },
        eyes: {lx: 50.5, rx: 69.5, y: 63, r: 5, style: "dot"},
        mouth: {x: 60, y: 72.5, w: 3.2},
        cheeks: {lx: 44, rx: 76, y: 71, w: 4.2, h: 2.6, color: "#FF8A9E"},
        anchors: {top: [60, 33, 0.9], neck: [60, 90, 1.0], chest: [72, 84, 0.65], back: [88, 52, 0.85], hands: [60, 86, 0.9]},
        lines: {
          tap: ["Boing! Hi hi!", "Bouncing with joy for you!", "Keep the ball rolling! You're great!", "Sun's out, fun's out!", "You're totally on the ball today!", "Float on, superstar!", "Having a ball with you!"],
          pet: ["Boing boing! Hehe!", "Whee, spin me again!"],
          hello: ["Hi! Let's play hard after studying!", "Hello! Big beach day energy!"],
          morning: ["Good morning! Bounce right out of bed!", "Morning, sunny! Today's going to be fun!"],
          night: ["Deflating a little. Sleep soon?", "The beach is quiet now. Rest well."],
          focus: ["Rolling quietly beside you. Let's go!", "Eye on the ball! You've got this!"],
          done: ["What a play! Amazing session!", "Session done! Big happy bounce!"],
          task: ["Boing! DONE!", "Nailed it! Woohoo!", "Right on the ball! Yes!", "Score! What a shot!"],
          break: ["Bounce and stretch! Boing boing!", "Break! Splash some water on your face!"]
        }
      }
    ]
  });

  /* Autumn */
  COMP_DATA.push({
    theme: "autumn",
    companions: [
      {
        id: "autumn-fawn", name: "Russet", kind: "Autumn Fawn", pose: "sit",
        bio: "A gentle little fawn who tiptoes through the fallen leaves with you.",
        idle: ["earTwitch", "tailSwish", "headTilt"], cheer: "hop",
        neck: [60, 75],
        parts: {
          tail: {svg: `<ellipse cx="86" cy="95" rx="5" ry="7.5" transform="rotate(38 86 95)" fill="#C7743A" ${O}/><ellipse cx="88.5" cy="92.2" rx="2.4" ry="3.2" transform="rotate(38 88.5 92.2)" fill="#FFF3E3"/>`, pivot: [82, 99]},
          earL: {svg: `<path d="M47 44C40 36 30 30 20 31C22 40 32 47.5 44 50Z" fill="#D98B4C" ${O}/><path d="M43.5 45.5C38 40 31.5 36 25 35.5C27.5 41 34 45.5 41 47.8Z" fill="#FFD6C2"/>`, pivot: [45, 46]},
          earR: {svg: `<path d="M73 44C80 36 90 30 100 31C98 40 88 47.5 76 50Z" fill="#D98B4C" ${O}/><path d="M76.5 45.5C82 40 88.5 36 95 35.5C92.5 41 86 45.5 79 47.8Z" fill="#FFD6C2"/>`, pivot: [75, 46]},
          feet: `<ellipse cx="40" cy="108.5" rx="8.5" ry="4.2" fill="#B8652E" ${O}/><ellipse cx="80" cy="108.5" rx="8.5" ry="4.2" fill="#B8652E" ${O}/>`,
          body: `${LG("autumn-fawn-b", [[0, "#E39A5C"], [1, "#B8652E"]])}
            <path d="M60 72C78 72 86 86 86 98C86 107 78 111 60 111C42 111 34 107 34 98C34 86 42 72 60 72Z" fill="url(#autumn-fawn-b)" ${O}/>
            <ellipse cx="60" cy="91" rx="11" ry="9" fill="#FFEBD4"/>
            <circle cx="41.5" cy="88" r="2.6" fill="#FFF3E3"/><circle cx="43" cy="96.5" r="2" fill="#FFF3E3"/><circle cx="78.5" cy="88" r="2.6" fill="#FFF3E3"/><circle cx="77" cy="96.5" r="2" fill="#FFF3E3"/>`,
          armL: {svg: `<rect x="43.5" y="93" width="11" height="16" rx="5.5" fill="#E09A5C" ${O}/><path d="M44.4 104H53.6V104.8C53.6 107.4 51.6 108.3 49 108.3C46.4 108.3 44.4 107.4 44.4 104.8Z" fill="#6B4430"/>`, pivot: [49, 93]},
          armR: {svg: `<rect x="65.5" y="93" width="11" height="16" rx="5.5" fill="#E09A5C" ${O}/><path d="M66.4 104H75.6V104.8C75.6 107.4 73.6 108.3 71 108.3C68.4 108.3 66.4 107.4 66.4 104.8Z" fill="#6B4430"/>`, pivot: [71, 93]},
          head: `${LG("autumn-fawn-h", [[0, "#EDA968"], [1, "#CC7A3C"]])}
            <ellipse cx="60" cy="56" rx="22" ry="19.5" fill="url(#autumn-fawn-h)" ${O}/>
            <path d="M43.5 49Q46 42 52.5 39" fill="none" stroke="#FFD9B4" stroke-width="3" stroke-linecap="round"/>
            <circle cx="60" cy="41.5" r="1.9" fill="#FFF3E3"/><circle cx="66" cy="43" r="1.5" fill="#FFF3E3"/>`,
          face: `<ellipse cx="60" cy="67.5" rx="9.5" ry="6.4" fill="#FFF1E0"/><ellipse cx="60" cy="64" rx="2.8" ry="2" fill="${INK}"/>`
        },
        eyes: {lx: 50, rx: 70, y: 55, r: 5, style: "dot", color: "#2B1A10"},
        mouth: {x: 60, y: 70, w: 2.4, style: "cat", color: "#2B1A10"},
        cheeks: {lx: 42.5, rx: 77.5, y: 63.5, w: 4.2, h: 2.6, color: "#FF8F8F"},
        anchors: {top: [60, 38, 0.95], neck: [60, 76, 1.05], chest: [70, 97, 0.7], back: [35, 90, 0.85], hands: [60, 96, 0.9]},
        lines: {
          tap: ["Oh, hi there! I'm so glad you came!", "It's wonderful to have you here!", "Tiptoe through it! You're doing great!", "Crunchy leaves, cozy notes, happy me!", "You're falling into a great rhythm!", "Water, snack, then back to it?", "Soft steps still get you there!"],
          pet: ["Hehe, that tickles my ears!", "Hehe, so cozy and warm!"],
          hello: ["Hi! The leaves are golden and you're here!", "Hello! Isn't it a lovely crisp day?"],
          morning: ["Good morning! Misty and bright, like you!", "Morning! I'm so excited to start with you!"],
          night: ["Curling up in the leaves. You too?", "The woods are sleepy. Rest soon."],
          focus: ["Quiet as falling leaves. You've got this!", "Tiptoeing in beside you. Let's focus!"],
          done: ["What a harvest! Wonderful session!", "Session done! Beautifully paced!"],
          task: ["Yay! One off the list!", "Done! Happy little hops!", "Another one down! WOO!", "Look at you go! Amazing!"],
          break: ["Stretch those legs! Prance around!", "Break time! A warm drink sounds lovely!"]
        }
      },
      {
        id: "autumn-acorn", name: "Cappy", kind: "Little Acorn", pose: "stand", sleepy: true,
        bio: "A snug little acorn in a cozy cap, dozing through the crisp days.",
        idle: ["topBob", "waddle", "sway"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="51" cy="108" rx="6.4" ry="4.2" fill="#7E4E26" ${O}/><ellipse cx="69" cy="108" rx="6.4" ry="4.2" fill="#7E4E26" ${O}/>`,
          body: `${LG("autumn-acorn-n", [[0, "#FAD292"], [0.55, "#F0B066"], [1, "#D98E3E"]])}${LG("autumn-acorn-c", [[0, "#B07A48"], [1, "#7A4A24"]])}
            <path d="M34 56C34 81 45 100 57 104.5Q60 107.5 63 104.5C75 100 86 81 86 56Z" fill="url(#autumn-acorn-n)" ${O}/>
            <path d="M39.5 70Q40 82 45 91" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".7"/>
            <path d="M28 55C28 40 42 30 60 30C78 30 92 40 92 55C92 60.5 88 62.5 84 61.5C76 59.5 68 58.5 60 58.5C52 58.5 44 59.5 36 61.5C32 62.5 28 60.5 28 55Z" fill="url(#autumn-acorn-c)" ${O}/>
            <path d="M32 52.5Q60 45 88 52.5" fill="none" stroke="#C48D58" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M36.5 44Q42 36 52 33.5" fill="none" stroke="#D9A46C" stroke-width="3" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="33.5" cy="80" rx="4.6" ry="6.4" transform="rotate(28 33.5 80)" fill="#E9A457" ${O}/>`, pivot: [39, 78]},
          armR: {svg: `<ellipse cx="86.5" cy="80" rx="4.6" ry="6.4" transform="rotate(-28 86.5 80)" fill="#E9A457" ${O}/>`, pivot: [81, 78]},
          top: {svg: `${LINE("M60 31C60 26 61.5 22.5 64.5 20", "#7A4A24", 3.4)}<path d="M64 21.5C66 14 74 11 81 13C79 20.5 71.5 24 64 21.5Z" fill="#F2B23E" ${O2}/><path d="M66 20.5Q72 17 78 14.5" fill="none" stroke="#D98A2A" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [60, 31]}
        },
        eyes: {lx: 50, rx: 70, y: 74, r: 4.8, style: "dot", color: "#2B1A10"},
        mouth: {x: 60, y: 83, w: 3, color: "#2B1A10"},
        cheeks: {lx: 43, rx: 77, y: 81.5, w: 4.2, h: 2.7, color: "#FF8F8F"},
        anchors: {top: [60, 33, 1.0], neck: [60, 63, 1.2], chest: [71, 92, 0.68], back: [86, 72, 0.85], hands: [60, 93, 0.85]},
        lines: {
          tap: ["Hi! Snug in my cap and happy to see you!", "Mighty oaks start small, just like this!", "You're growing, little by little!", "Crisp air, clear mind, great you!", "Tiny acorn, big dreams, bigger you!", "Rest is part of growing too!", "Okay, you've totally got this!"],
          pet: ["Hehe, my cap! So happy!", "So cozy! Thank you, thank you!"],
          hello: ["Hello! Pull up a leaf and stay a while!", "Hi! Cozy season is here, and so are you!"],
          morning: ["Good morning! Let's sprout today!", "Morning, friend! Crisp, bright, and ready!"],
          night: ["Burrowing in now. Bed soon?", "Time to rest up, little oak."],
          focus: ["Snug and quiet beside you. Let's go!", "Shh, cozy focus time. You've got this!"],
          done: ["What a great session! Wow!", "You did it! I'm so proud!"],
          task: ["Yes! That's DONE!", "One more gathered! Woo!", "Nicely done! Hooray!", "That's a win! Happy cap toss!"],
          break: ["Stretch up tall like an oak!", "Warm cider break! Cozy and fun!"]
        }
      },
      {
        id: "autumn-leaf", name: "Maple", kind: "Maple Leaf Sprite", pose: "float",
        bio: "A warm maple leaf who drifts in to twirl through the golden light.",
        idle: ["sway", "spin", "finWiggle"], cheer: "spin",
        parts: {
          tail: {svg: `${LINE("M60 87C60 95 62 100 67 103", "#8A4A22", 3)}`, pivot: [60, 86]},
          body: `${LG("autumn-leaf-g", [[0, "#FBC54A"], [0.5, "#EE7A30"], [1, "#CF4424"]])}
            <path d="M60 90C55 85 49 84 43 87C36 90 28 88 27 82C26 78 30 74 35 72C28 70 20 64 19 56C18 48 24 42 30 44C34 45 38 48 41 50C40 42 42 34 48 30C52 27 56 24 60 20C64 24 68 27 72 30C78 34 80 42 79 50C82 48 86 45 90 44C96 42 102 48 101 56C100 64 92 70 85 72C90 74 94 78 93 82C92 88 84 90 77 87C71 84 65 85 60 90Z" fill="url(#autumn-leaf-g)" ${O}/>
            <path d="M60 44V29M56 83Q44 82 34 80M64 83Q76 82 86 80M40 63Q31 59 25 53M80 63Q89 59 95 53" fill="none" stroke="#FFD58C" stroke-width="2" stroke-linecap="round" opacity=".85"/>
            <path d="M47 38Q49.5 32 55 28" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`
        },
        eyes: {lx: 51, rx: 69, y: 60, r: 4.8, style: "sparkle", color: "#3A1A0A"},
        mouth: {x: 60, y: 69, w: 3, color: "#3A1A0A"},
        cheeks: {lx: 44, rx: 76, y: 67.5, w: 4, h: 2.6, color: "#FF7A7A"},
        anchors: {top: [60, 27, 0.8], neck: [60, 80, 1.0], chest: [70, 76, 0.62], back: [88, 52, 0.8], hands: [60, 80, 0.85]},
        lines: {
          tap: ["Hi! I drifted by just to see you!", "Turning over a new leaf with you!", "You glow like golden hour!", "It's all falling into place!", "Crisp and cozy, that's you!", "Twirl, breathe, and keep shining!", "Every leaf lands softly, and so will you!"],
          pet: ["Whee, a leafy twirl!", "Hehe, I'm all rustly with joy!"],
          hello: ["Hello! The light is golden, and you're here!", "Hi! I blew in just to see you!"],
          morning: ["Good morning! Crisp, bright, and wonderful!", "Morning, sunshine! Let's twirl into today!"],
          night: ["Drifting down now. Rest soon?", "Leaves settle at night. You too."],
          focus: ["Gently drifting with you. You've got this!", "Calm breeze, steady focus. Let's go!"],
          done: ["You shone! What a session!", "Session done! Pure gold!"],
          task: ["Whoosh! DONE!", "Another leaf turned! Yay!", "Golden work! Woohoo!", "All finished! I'm twirling with joy!"],
          break: ["Stretch with the breeze! Twirl twirl!", "Break time! A warm drink sounds perfect!"]
        }
      }
    ]
  });

  /* Ocean */
  COMP_DATA.push({
    theme: "ocean",
    companions: [
      {
        id: "ocean-otter", name: "Ripple", kind: "Sea Otter Pup", pose: "sit", sleepy: true,
        bio: "A snuggly sea otter pup who naps on the waves beside you.",
        idle: ["earTwitch", "tailSwish", "headTilt"], cheer: "bounce",
        neck: [60, 74],
        parts: {
          tail: {svg: `<path d="M80 99C90 97 102 99 108 105.5C102 110 90 111 80 108Z" fill="#8A5E42" ${O}/>`, pivot: [80, 103]},
          earL: {svg: `<circle cx="39.5" cy="42" r="6" fill="#9C6E50" ${O}/><circle cx="39.5" cy="42" r="2.8" fill="#E7C9AE"/>`, pivot: [43, 45]},
          earR: {svg: `<circle cx="80.5" cy="42" r="6" fill="#9C6E50" ${O}/><circle cx="80.5" cy="42" r="2.8" fill="#E7C9AE"/>`, pivot: [77, 45]},
          feet: `<ellipse cx="44" cy="108.5" rx="8" ry="4.2" fill="#6E4A33" ${O}/><ellipse cx="76" cy="108.5" rx="8" ry="4.2" fill="#6E4A33" ${O}/>`,
          body: `${LG("ocean-otter-b", [[0, "#B8886A"], [1, "#86593D"]])}
            <path d="M60 70C80 70 88 86 87 98C86 108 78 111 60 111C42 111 34 108 33 98C32 86 40 70 60 70Z" fill="url(#ocean-otter-b)" ${O}/>
            <ellipse cx="60" cy="97" rx="15" ry="12" fill="#E3C7A8" opacity=".9"/>`,
          armL: {svg: `<ellipse cx="55" cy="89" rx="4.6" ry="6.2" transform="rotate(-38 55 89)" fill="#7E553B" ${O}/>`, pivot: [47, 82]},
          armR: {svg: `<ellipse cx="65" cy="89" rx="4.6" ry="6.2" transform="rotate(38 65 89)" fill="#7E553B" ${O}/>`, pivot: [73, 82]},
          head: `${LG("ocean-otter-h", [[0, "#BE8F70"], [1, "#936446"]])}
            <ellipse cx="60" cy="56" rx="24.5" ry="20.5" fill="url(#ocean-otter-h)" ${O}/>
            <path d="M42 45Q46 39 53 37" fill="none" stroke="#DDB696" stroke-width="3" stroke-linecap="round"/>`,
          face: `<path d="M37.5 60C37.5 51 46 46.5 60 48.5C74 46.5 82.5 51 82.5 60C82.5 70.5 72 76 60 76C48 76 37.5 70.5 37.5 60Z" fill="#F4E4D0"/>
            <path d="M56.5 61.4Q60 60 63.5 61.4Q63 64.4 60 65Q57 64.4 56.5 61.4Z" fill="#3A2A26"/>
            <path d="M38.5 63.5l-8 -1.5M38.5 67l-8 1.2M81.5 63.5l8 -1.5M81.5 67l8 1.2" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>`
        },
        eyes: {lx: 50, rx: 70, y: 57, r: 4.6, style: "dot", color: "#2B1E18"},
        mouth: {x: 60, y: 67.5, w: 2.6, style: "cat"},
        cheeks: {lx: 43, rx: 77, y: 65, w: 4.2, h: 2.6, color: "#FF9AA8"},
        anchors: {top: [60, 37, 0.95], neck: [60, 75, 1.05], chest: [70, 97, 0.7], back: [34, 90, 0.85], hands: [60, 93, 0.9]},
        lines: {
          tap: ["Hi! Floating by to cheer you on!", "You're doing amazing!", "Hold my paw, we've got this!", "Ride the wave! You're doing great!", "Little splashes add up to big waves!", "Water, snack, then back to it?", "Calm seas, clear mind, brilliant you!"],
          pet: ["Aww, that's so nice! Happy otter!", "Hehe, my whiskers are wiggling!"],
          hello: ["Hi! Come float with me! Yay!", "Hello! The tide is lovely, and you're here!"],
          morning: ["Good morning! Fresh sea breeze, fresh start!", "Morning, friend! Let's make a splash today!"],
          night: ["Floating off to sleep. You too?", "Holding paws. Time to rest, friend."],
          focus: ["Floating quietly beside you. Let's go!", "Shh, cozy focus time. You've got this!"],
          done: ["What a lovely session! Wow!", "You did it! Splash splash!"],
          task: ["Splash! DONE!", "Yes! Another one finished!", "That's a keeper! Woohoo!", "Look at you go! Happy flips!"],
          break: ["Stretch and float a bit! Ahh!", "Break time! Sip some water and smile!"]
        }
      },
      {
        id: "ocean-octopus", name: "Tako", kind: "Baby Octopus", pose: "float",
        bio: "A curly little octopus who gives the best eight-armed hugs.",
        idle: ["finWiggle", "wave", "sparkle"], cheer: "spin",
        parts: {
          feet: `${LG("ocean-octopus-t", [[0, "#FF9F8F"], [1, "#F07D72"]])}
            <path d="M38 70.4L38 72L38 74.1L37.9 76.6L37.7 79.1L37.5 81.3L37.3 83.3L37 85.2L36.7 87L36.4 88.7L35.9 90.2L35.4 91.7L34.7 93.2L34 94.5L33.3 95.6L32.7 96.4L32 97L31.1 97.5L30.2 97.9L29.4 98.1L29.1 98.2L29 98.2L28.6 97.9L28.1 97.3L27.7 96.7L27.6 96.4L27.5 96.6L27.8 96.1L28.3 95.4L28.9 94.8L29.4 94.2A1.8 1.8 0 0 0 26.6 91.8L26.3 92.2L25.6 92.8L24.7 93.7L23.9 94.8L23.4 96.6L23.7 98.1L24.3 99.4L25.1 100.8L26.3 102L27.9 102.8L29.7 103L31.4 102.8L33 102.4L34.7 101.6L36.3 100.6L37.7 99.3L39 97.9L40.1 96.3L41.1 94.6L42.1 92.8L42.9 90.9L43.7 88.9L44.3 86.9L44.9 84.8L45.5 82.7L46 80.4L46.6 77.8L47.1 75.2L47.6 73.1L48 71.6Z" fill="url(#ocean-octopus-t)" ${O}/><circle cx="41.7" cy="88.3" r="1.3" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/><circle cx="39.5" cy="93.7" r="1.2" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/><circle cx="35.9" cy="98.9" r="1.2" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/><circle cx="30.3" cy="101.5" r="1.1" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/><circle cx="24.9" cy="97.7" r="1" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/>
            <path d="M72 71.6L72.4 73.1L72.9 75.2L73.4 77.8L74 80.4L74.5 82.7L75.1 84.8L75.7 86.9L76.3 88.9L77.1 90.9L77.9 92.8L78.9 94.6L79.9 96.3L81 97.9L82.3 99.3L83.7 100.6L85.3 101.6L87 102.4L88.6 102.8L90.3 103L92.1 102.8L93.7 102L94.9 100.8L95.7 99.4L96.3 98.1L96.6 96.6L96.1 94.8L95.3 93.7L94.4 92.8L93.7 92.2L93.4 91.8A1.8 1.8 0 0 0 90.6 94.2L91.1 94.8L91.7 95.4L92.2 96.1L92.5 96.6L92.4 96.4L92.3 96.7L91.9 97.3L91.4 97.9L91 98.2L90.9 98.2L90.6 98.1L89.8 97.9L88.9 97.5L88 97L87.3 96.4L86.7 95.6L86 94.5L85.3 93.2L84.6 91.7L84.1 90.2L83.6 88.7L83.3 87L83 85.2L82.7 83.3L82.5 81.3L82.3 79.1L82.1 76.6L82 74.1L82 72L82 70.4Z" fill="url(#ocean-octopus-t)" ${O}/><circle cx="78.3" cy="88.3" r="1.3" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/><circle cx="80.5" cy="93.7" r="1.2" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/><circle cx="84.1" cy="98.9" r="1.2" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/><circle cx="89.7" cy="101.5" r="1.1" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/><circle cx="95.1" cy="97.7" r="1" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/>
            <path d="M47 69.7L47.1 71.1L47.1 73.3L47 76L47.1 78.7L47.3 81.3L47.8 83.9L48.6 86L49.2 87.7L49.7 89L49.9 90L49.8 91.2L49.7 92.5L49.3 93.8L48.9 95.1L48.3 96.3L47.6 97.5L46.7 98.7L45.7 99.7L44.8 100.5L44.2 100.9L43.6 101.1L42.6 101.1L41.6 100.9L40.7 100.6L40.1 100.2L39.7 99.8L39.2 99L38.8 97.9L38.6 96.9L38.5 96.4L38.5 96.2L39 95.7L39.7 95.1L40.5 94.4L41.2 93.9A1.8 1.8 0 0 0 38.8 91.1L38.4 91.4L37.5 92L36.4 92.8L35.3 93.9L34.5 95.6L34.4 97.3L34.6 98.9L35 100.6L35.8 102.3L36.9 103.8L38.3 104.8L40 105.6L41.8 106.2L43.8 106.4L45.8 106.1L47.8 105.3L49.5 104.1L51 102.8L52.5 101.3L53.7 99.7L54.7 98L55.6 96.2L56.3 94.3L56.8 92.2L57.1 90L57 87.6L56.6 85.5L56.1 83.6L55.8 82L55.7 80.7L55.8 78.8L56 76.5L56.4 74.1L56.7 71.9L57 70.3Z" fill="url(#ocean-octopus-t)" ${O}/><circle cx="55" cy="90" r="1.3" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/><circle cx="52.6" cy="98" r="1.2" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/><circle cx="47.7" cy="103.4" r="1.2" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/><circle cx="39.7" cy="104" r="1.1" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/><circle cx="35.6" cy="97.2" r="1" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/>
            <path d="M63 70.3L63.3 71.9L63.6 74.1L64 76.5L64.2 78.8L64.3 80.7L64.2 82L63.9 83.6L63.4 85.5L63 87.6L62.9 90L63.2 92.2L63.7 94.3L64.4 96.2L65.3 98L66.3 99.7L67.5 101.3L69 102.8L70.5 104.1L72.2 105.3L74.2 106.1L76.2 106.4L78.2 106.2L80 105.6L81.7 104.8L83.1 103.8L84.2 102.3L85 100.6L85.4 98.9L85.6 97.3L85.5 95.6L84.7 93.9L83.6 92.8L82.5 92L81.6 91.4L81.2 91.1A1.8 1.8 0 0 0 78.8 93.9L79.5 94.4L80.3 95.1L81 95.7L81.5 96.2L81.5 96.4L81.4 96.9L81.2 97.9L80.8 99L80.3 99.8L79.9 100.2L79.3 100.6L78.4 100.9L77.4 101.1L76.4 101.1L75.8 100.9L75.2 100.5L74.3 99.7L73.3 98.7L72.4 97.5L71.7 96.3L71.1 95.1L70.7 93.8L70.3 92.5L70.2 91.2L70.1 90L70.3 89L70.8 87.7L71.4 86L72.2 83.9L72.7 81.3L72.9 78.7L73 76L72.9 73.3L72.9 71.1L73 69.7Z" fill="url(#ocean-octopus-t)" ${O}/><circle cx="65" cy="90" r="1.3" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/><circle cx="67.4" cy="98" r="1.2" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/><circle cx="72.3" cy="103.4" r="1.2" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/><circle cx="80.3" cy="104" r="1.1" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/><circle cx="84.4" cy="97.2" r="1" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/>`,
          body: `${RG("ocean-octopus-g", [[0, "#FFD3C7"], [0.55, "#FFA493"], [1, "#F3817A"]], 0.4, 0.3, 0.75)}
            <path d="M60 19C83 19 95 36 95 55C95 71 85 79 60 79C35 79 25 71 25 55C25 36 37 19 60 19Z" fill="url(#ocean-octopus-g)" ${O}/>
            <path d="M35.5 50Q37 36 49 28.5" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" opacity=".9"/><circle cx="53.5" cy="26.5" r="1.8" fill="#fff" opacity=".9"/>
            <ellipse cx="72" cy="31.5" rx="3.6" ry="2.8" fill="#F27E78" opacity=".55"/><ellipse cx="82" cy="40" rx="2.6" ry="2.1" fill="#F27E78" opacity=".55"/><ellipse cx="63" cy="25.5" rx="2" ry="1.6" fill="#F27E78" opacity=".55"/>`,
          armL: {svg: `<path d="M29.9 65.8L29.2 66.3L28.2 67.1L26.9 68L25.6 69L24.5 70L23.7 70.7L22.8 71.4L21.8 72.3L20.7 73.4L19.8 74.8L19 76.4L18.3 78.1L17.7 79.8L17.2 81.5L16.8 83.2L16.6 85L16.6 86.6L16.7 87.8L16.8 88.6L16.8 89L16.5 89.8L16.1 90.7L15.6 91.5L15.2 92L15.3 92.1L15.3 92.2L14.9 92.1L14.2 91.9L13.6 91.5L13.3 91.4L13.3 91.3L13.2 90.6L13.2 89.5L13.3 88.5L13.3 87.6A1.8 1.8 0 0 0 9.7 87.4L9.6 88L9.4 89.1L9.2 90.4L9.2 91.9L9.7 93.6L10.7 94.9L11.9 95.8L13.3 96.5L14.8 97L16.7 96.9L18.4 96L19.6 94.9L20.6 93.7L21.5 92.4L22.2 91L22.7 89.3L22.8 87.7L22.9 86.5L23 85.5L23.2 84.8L23.7 83.7L24.3 82.4L25 81.1L25.6 80L26.2 79.2L26.7 78.7L27.1 78.4L27.7 78.1L28.5 77.6L29.5 77L30.6 76.5L31.8 75.8L33.1 75.2L34.3 74.6L35.1 74.2A5 5 0 0 0 29.9 65.8Z" fill="#F98E80" ${O}/><circle cx="19.9" cy="79.8" r="1.3" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/><circle cx="18.4" cy="85.2" r="1.2" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/><circle cx="18.2" cy="90.1" r="1.2" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/><circle cx="15.7" cy="93.5" r="1.1" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/><circle cx="12.2" cy="91.8" r="1" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/>`, pivot: [32, 70]},
          armR: {svg: `<path d="M84.9 74.2L85.7 74.6L86.9 75.2L88.2 75.8L89.4 76.5L90.5 77L91.5 77.6L92.3 78.1L92.9 78.4L93.3 78.7L93.8 79.2L94.4 80L95 81.1L95.7 82.4L96.3 83.7L96.8 84.8L97 85.5L97.1 86.5L97.2 87.7L97.3 89.3L97.8 91L98.5 92.4L99.4 93.7L100.4 94.9L101.6 96L103.3 96.9L105.2 97L106.7 96.5L108.1 95.8L109.3 94.9L110.3 93.6L110.8 91.9L110.8 90.4L110.6 89.1L110.4 88L110.3 87.4A1.8 1.8 0 0 0 106.7 87.6L106.7 88.5L106.8 89.5L106.8 90.6L106.7 91.3L106.7 91.4L106.4 91.5L105.8 91.9L105.1 92.1L104.7 92.2L104.7 92.1L104.8 92L104.4 91.5L103.9 90.7L103.5 89.8L103.2 89L103.2 88.6L103.3 87.8L103.4 86.6L103.4 85L103.2 83.2L102.8 81.5L102.3 79.8L101.7 78.1L101 76.4L100.2 74.8L99.3 73.4L98.2 72.3L97.2 71.4L96.3 70.7L95.5 70L94.4 69L93.1 68L91.8 67.1L90.8 66.3L90.1 65.8A5 5 0 0 0 84.9 74.2Z" fill="#F98E80" ${O}/><circle cx="100.1" cy="79.8" r="1.3" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/><circle cx="101.6" cy="85.2" r="1.2" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/><circle cx="101.8" cy="90.1" r="1.2" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/><circle cx="104.3" cy="93.5" r="1.1" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/><circle cx="107.8" cy="91.8" r="1" fill="#FFE3DA" stroke="#E4776E" stroke-width=".9"/>`, pivot: [88, 70]}
        },
        eyes: {lx: 48.5, rx: 71.5, y: 60, r: 5.4, style: "sparkle", color: "#2B1E30"},
        mouth: {x: 60, y: 68.5, w: 3.2},
        cheeks: {lx: 42.5, rx: 77.5, y: 67, w: 4.4, h: 2.8, color: "#FF6F8E"},
        anchors: {top: [60, 21, 1.0], neck: [60, 80, 1.15], chest: [73, 74, 0.6], back: [88, 52, 0.85], hands: [60, 82, 0.9]},
        lines: {
          tap: ["Hi! I'm waving all eight arms!", "Cheering for you with every arm!", "You've got this, times eight!", "Go with the flow! You're doing great!", "Small waves make big tides!", "Water, snack, then back to it?", "You're doing amazing, sea buddy!"],
          pet: ["Eight-armed hug! Squeeze!", "Hehe, I'm blushing pink with joy!"],
          hello: ["Hi! You're back! Yay yay!", "Hello! Let's make some waves today!"],
          morning: ["Good morning! I'm stretching all eight arms!", "Morning, sea buddy! Today's going to be great!"],
          night: ["Tucking in my arms now. Rest soon?", "Moon on the sea. Sleep well, friend."],
          focus: ["Holding still and cheering quietly. Go!", "Calm waters, steady focus. You've got this!"],
          done: ["Amazing session! Eight arms up!", "Session done! Big splash!"],
          task: ["Splash! DONE!", "Yes! Nicely done!", "You're making waves! Woohoo!", "Eight thumbs up! Hooray!"],
          break: ["Stretch every single arm! Wiggle!", "Sip some water! Fun break time!"]
        }
      },
      {
        id: "ocean-lighthouse", name: "Beacon", kind: "Little Lighthouse", pose: "stand",
        bio: "A little lighthouse who keeps a warm light on for late study nights.",
        idle: ["sway", "wave", "sparkle"], cheer: "spin",
        parts: {
          feet: `${LG("ocean-lighthouse-r", [[0, "#B3C4CA"], [1, "#7E949C"]])}
            <path d="M28 111C26 104 32 98 40 99C44 94 54 93.5 60 96.5C66 93.5 76 94 80 99C88 98 94 104 92 111Z" fill="url(#ocean-lighthouse-r)" ${O}/>
            <path d="M34 104Q36 101 40 101" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>`,
          body: `${LG("ocean-lighthouse-t", [[0, "#FFFFFF"], [1, "#E2EEF1"]], 0, 0, 1, 0)}${LG("ocean-lighthouse-l", [[0, "#FFF8CF"], [1, "#FFD266"]])}
            ${LINE("M38 39L30 35.5M38 45L29.5 46M82 39L90 35.5M82 45L90.5 46", "#FFD266", 2.6)}
            <path d="M40 54H80L87 104Q60 108 33 104Z" fill="url(#ocean-lighthouse-t)"/>
            <path d="M40 54H80L81 61H39Z" fill="#F27A6B"/>
            <path d="M35 90H85L87 104Q60 108 33 104Z" fill="#F27A6B"/>
            <path d="M55.5 106V99A4.5 4.5 0 0 1 64.5 99V106Z" fill="#0B4F5C"/>
            <path d="M40 54H80L87 104Q60 108 33 104Z" fill="none" ${O}/>
            <path d="M42 64V85" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            <rect x="45" y="33" width="30" height="16" rx="3" fill="url(#ocean-lighthouse-l)" ${O}/>
            <path d="M60 34.5V47.5" stroke="#E8B94A" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M41 35C43 26 51 20 60 20C69 20 77 26 79 35Z" fill="#F27A6B" ${O}/>
            <path d="M47 29Q50 25 55 23.5" fill="none" stroke="#FFC2B8" stroke-width="2.4" stroke-linecap="round"/>
            <rect x="35" y="48" width="50" height="7" rx="3.5" fill="#1C6B7A" ${O}/>`,
          armL: {svg: `<ellipse cx="31.5" cy="80" rx="4.4" ry="6" transform="rotate(26 31.5 80)" fill="#FFFFFF" ${O}/>`, pivot: [37, 78]},
          armR: {svg: `<ellipse cx="88.5" cy="80" rx="4.4" ry="6" transform="rotate(-26 88.5 80)" fill="#FFFFFF" ${O}/>`, pivot: [83, 78]},
          top: {svg: `${LINE("M60 21V14", "#1C6B7A", 2)}<path d="M61 11.5L70 14L61 16.5Z" fill="#F27A6B" ${OW(1.8)}/><circle cx="60" cy="12" r="2.8" fill="#FFD266" ${OW(2)}/>`, pivot: [60, 21]}
        },
        eyes: {lx: 51, rx: 69, y: 71, r: 4.6, style: "dot", color: "#0B2B33"},
        mouth: {x: 60, y: 79.5, w: 3, color: "#0B2B33"},
        cheeks: {lx: 44, rx: 76, y: 78, w: 4, h: 2.5, color: "#FF8FA3"},
        anchors: {top: [60, 25, 0.7], neck: [60, 62, 1.0], chest: [72, 97, 0.62], back: [85, 70, 0.85], hands: [60, 87, 0.85]},
        lines: {
          tap: ["Hi! My light is on just for you!", "Shining your way! You're amazing!", "Steady as the shore, that's you!", "Every wave passes, and you stay strong!", "Guiding you, one bright page at a time!", "You light up the whole room!", "Keep that warm glow going!"],
          pet: ["Hehe, I'm all aglow!", "Beaming with joy!"],
          hello: ["Hello! Welcome back to the harbor!", "Hi! I kept the light on for you!"],
          morning: ["Good morning! The sun's taking over the shining!", "Morning, sailor! Smooth seas ahead today!"],
          night: ["My light's low now. Time to rest?", "Safe harbor tonight. Sleep well."],
          focus: ["Shining quietly beside you. Let's go!", "Steady light, steady focus. You've got this!"],
          done: ["Brilliant session! Wow!", "Safe to shore! You were amazing!"],
          task: ["Beaming! DONE!", "Bright work! Hooray!", "Guided home! Yes yes!", "Shine on! Another one finished!"],
          break: ["Stretch and gaze out at the sea! Ahh!", "Break time! Sip some water!"]
        }
      }
    ]
  });

  /* Sakura */
  COMP_DATA.push({
    theme: "sakura",
    companions: [
      {
        id: "sakura-shiba", name: "Hana", kind: "Shiba Pup", pose: "sit", sleepy: true,
        bio: "A sleepy shiba pup with a blossom on her head, happy under the trees.",
        idle: ["earTwitch", "tailSwish", "topBob"], cheer: "hop",
        neck: [60, 76],
        parts: {
          tail: {svg: `${LINE("M80 100C92 102 100 94 98 86C96 79 88 79 87 85C86.5 88.5 90 90 92 88", "#E8A060", 6)}`, pivot: [80, 100]},
          earL: {svg: `<path d="M40 50L38 28C38 25 41 24 43 26L56 38Z" fill="#E8984F" ${O}/><path d="M42 44L41 31.5L50 39Z" fill="#FFF0E0"/>`, pivot: [46, 42]},
          earR: {svg: `<path d="M80 50L82 28C82 25 79 24 77 26L64 38Z" fill="#E8984F" ${O}/><path d="M78 44L79 31.5L70 39Z" fill="#FFF0E0"/>`, pivot: [74, 42]},
          feet: `<ellipse cx="42" cy="108.5" rx="8.5" ry="4.2" fill="#FFF4E6" ${O}/><ellipse cx="78" cy="108.5" rx="8.5" ry="4.2" fill="#FFF4E6" ${O}/>`,
          body: `${LG("sakura-shiba-b", [[0, "#F4B67E"], [1, "#D98849"]])}
            <path d="M60 72C79 72 87 86 87 98C87 107 78 111 60 111C42 111 33 107 33 98C33 86 41 72 60 72Z" fill="url(#sakura-shiba-b)" ${O}/>
            <path d="M48 76C52 80 56 82 60 82C64 82 68 80 72 76C76 86 74 104 60 106C46 104 44 86 48 76Z" fill="#FFF4E6"/>`,
          armL: {svg: `<ellipse cx="51" cy="101" rx="5.8" ry="8" fill="#FFF4E6" ${O}/><path d="M49 106.5v2M53 106.5v2" stroke="#E0C4A8" stroke-width="1.5" stroke-linecap="round"/>`, pivot: [51, 93]},
          armR: {svg: `<ellipse cx="69" cy="101" rx="5.8" ry="8" fill="#FFF4E6" ${O}/><path d="M67 106.5v2M71 106.5v2" stroke="#E0C4A8" stroke-width="1.5" stroke-linecap="round"/>`, pivot: [69, 93]},
          head: `${LG("sakura-shiba-h", [[0, "#F8C08C"], [1, "#E0914F"]])}
            <path d="M60 37C75 37 85 46 85 59C85 71 75 79 60 79C45 79 35 71 35 59C35 46 45 37 60 37Z" fill="url(#sakura-shiba-h)" ${O}/>
            <path d="M40.5 52Q43 44 50 40.5" fill="none" stroke="#FFDDBC" stroke-width="3" stroke-linecap="round"/>`,
          face: `<path d="M38 65C42 61 50 62 54 64.5C56.5 63 58 62.5 60 62.5C62 62.5 63.5 63 66 64.5C70 62 78 61 82 65C81 74 72 78.5 60 78.5C48 78.5 39 74 38 65Z" fill="#FFF4E6"/>
            <ellipse cx="49.5" cy="48" rx="2.8" ry="1.9" fill="#FFF4E6"/><ellipse cx="70.5" cy="48" rx="2.8" ry="1.9" fill="#FFF4E6"/>
            <ellipse cx="60" cy="65.6" rx="2.7" ry="1.9" fill="${INK}"/>`,
          top: {svg: `${[0, 72, 144, 216, 288].map(a => `<ellipse cx="72" cy="33.2" rx="3.3" ry="4.4" transform="rotate(${a} 72 37.5)" fill="#FFB7CF" ${OW(1.8)}/>`).join("")}<circle cx="72" cy="37.5" r="2.2" fill="#F27AA8"/>`, pivot: [69, 40]}
        },
        eyes: {lx: 50, rx: 70, y: 57, r: 4.4, style: "dot", color: "#2B1E18"},
        mouth: {x: 60, y: 69, w: 2.6, style: "cat"},
        cheeks: {lx: 43, rx: 77, y: 66, w: 4.2, h: 2.6, color: "#FF8FB0"},
        anchors: {top: [60, 38, 0.95], neck: [60, 78, 1.05], chest: [69, 92, 0.7], back: [86, 90, 0.9], hands: [60, 97, 0.9]},
        lines: {
          tap: ["Wan! Hi hi!", "Petals and pats, my favorite things!", "You're doing wonderfully!", "Big tail wags for your hard work!", "Bloom at your own pace! You're great!", "Water, snack, then back to it?", "I'm so proud of you, friend!"],
          pet: ["Wan wan! Happiest pup ever!", "Wiggly tail! So so happy!"],
          hello: ["Wan! You're here! Yay!", "Hi! The blossoms are out to greet you!"],
          morning: ["Good morning! Petals everywhere!", "Morning! Big stretch, then a great day!"],
          night: ["Yawn. Time to curl up soon?", "The blossoms are sleeping. Rest, okay?"],
          focus: ["Resting under the tree, cheering quietly!", "Shh, cozy focus time. You've got this!"],
          done: ["You did it! Happy wags everywhere!", "Session done! I'm so proud!"],
          task: ["Wan! DONE!", "Good job, good human! Yay!", "Fetched and finished! Woohoo!", "Biggest tail wag for that one!"],
          break: ["Big puppy stretch! Reach!", "Tea and a stretch! Fun break!"]
        }
      },
      {
        id: "sakura-sprite", name: "Petal", kind: "Blossom Sprite", pose: "float",
        bio: "A soft cherry blossom sprite who floats down with gentle luck.",
        idle: ["sparkle", "spin", "finWiggle"], cheer: "spin",
        parts: {
          tail: {svg: `${LINE("M60 83C60 90 57.5 95 52.5 97.5", "#7BB86A", 2.6)}<path d="M55 95C56 90 61 88 65 89.5C64 94 59 96.5 55 95Z" fill="#9BD08A" ${OW(2)}/>`, pivot: [60, 83]},
          body: `${LG("sakura-sprite-p", [[0, "#FFE6EF"], [1, "#F7A3C3"]])}${RG("sakura-sprite-c", [[0, "#FFFFFF"], [0.7, "#FFF3F7"], [1, "#FFDCE8"]], 0.42, 0.38, 0.65)}
            ${[0, 72, 144, 216, 288].map(a => `<g transform="rotate(${a} 60 62)"><path d="M60 66C49 57 42 42 46 29C49 24 55 24 60 31C65 24 71 24 74 29C78 42 71 57 60 66Z" fill="url(#sakura-sprite-p)" ${O}/><path d="M60 35V41" stroke="#F07FA8" stroke-width="1.8" stroke-linecap="round"/></g>`).join("")}
            <circle cx="60" cy="62" r="22" fill="url(#sakura-sprite-c)" ${O}/>
            <path d="M44 56Q46.5 48 53 44.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`
        },
        eyes: {lx: 51.5, rx: 68.5, y: 61, r: 4.6, style: "sparkle", color: "#5A2440"},
        mouth: {x: 60, y: 70, w: 2.8, color: "#5A2440"},
        cheeks: {lx: 45, rx: 75, y: 68, w: 3.8, h: 2.4, color: "#FF8FB5"},
        anchors: {top: [60, 41, 0.8], neck: [60, 82, 0.9], chest: [71, 77, 0.6], back: [86, 50, 0.8], hands: [60, 80, 0.85]},
        lines: {
          tap: ["Hi! A lucky petal, just for you!", "Bloom right where you are!", "Soft and steady, like spring!", "Every petal falls just right!", "Floating by with lots of good luck!", "Pause and breathe! So pretty out here!", "You're in full bloom today!"],
          pet: ["Hehe, petal shower!", "I'm blushing pink with joy!"],
          hello: ["Hello! The trees bloomed just for you!", "Hi! I floated over to see you!"],
          morning: ["Good morning! Fresh blossoms everywhere!", "Morning, petal! Let's bloom today!"],
          night: ["Night blossoms glow softly. Rest soon?", "Petals settle. Time to sleep?"],
          focus: ["Floating quietly with you. You've got this!", "Soft breeze, steady focus. Let's go!"],
          done: ["What a beautiful session!", "You blossomed! Wonderful work!"],
          task: ["Bloom! DONE!", "Yes! Beautifully finished!", "Lovely work! Petals everywhere!", "One more blossom! Hooray!"],
          break: ["Twirl and stretch! Wheee!", "Tea break under the tree! Lovely!"]
        }
      },
      {
        id: "sakura-dango", name: "Tama", kind: "Hanami Dango", pose: "stand",
        bio: "A sweet three-color dango who loves picnics under the blossoms.",
        idle: ["sway", "bounce", "wave"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="50" cy="108.5" rx="6" ry="4" fill="#78B060" ${O}/><ellipse cx="70" cy="108.5" rx="6" ry="4" fill="#78B060" ${O}/>`,
          body: `${LG("sakura-dango-gr", [[0, "#D4EDB4"], [1, "#98CB7E"]])}${LG("sakura-dango-pk", [[0, "#FFD3E1"], [1, "#F59BB9"]])}${LG("sakura-dango-wh", [[0, "#FFFFFF"], [1, "#F1E4E9"]])}
            <ellipse cx="60" cy="89" rx="23" ry="15.5" fill="url(#sakura-dango-gr)" ${O}/>
            <path d="M44 87Q46 81 51 79" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>
            <ellipse cx="60" cy="35.5" rx="22" ry="15.5" fill="url(#sakura-dango-pk)" ${O}/>
            <path d="M46 33Q48 27 54 24.5" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" opacity=".85"/>
            <ellipse cx="60" cy="63" rx="24.5" ry="16.5" fill="url(#sakura-dango-wh)" ${O}/>
            <path d="M40 58Q42 51 48 48.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            <path d="M47 77Q60 80.5 73 77" fill="none" stroke="#E2CDD5" stroke-width="2.2" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="33.5" cy="69" rx="4.4" ry="5.8" transform="rotate(28 33.5 69)" fill="#FFFFFF" ${O}/>`, pivot: [39, 67]},
          armR: {svg: `<ellipse cx="86.5" cy="69" rx="4.4" ry="5.8" transform="rotate(-28 86.5 69)" fill="#FFFFFF" ${O}/>`, pivot: [81, 67]},
          top: {svg: `<path d="M57.8 22.5V12Q60 7.5 62.2 12V22.5Z" fill="#E6BE86" ${OW(2.2)}/>`, pivot: [60, 22]}
        },
        eyes: {lx: 49.5, rx: 70.5, y: 62, r: 4.6, style: "dot"},
        mouth: {x: 60, y: 70.5, w: 3},
        cheeks: {lx: 42, rx: 78, y: 69, w: 4, h: 2.5, color: "#FF8FB0"},
        anchors: {top: [60, 24, 0.85], neck: [60, 79, 1.05], chest: [72, 91, 0.66], back: [85, 62, 0.85], hands: [60, 82, 0.85]},
        lines: {
          tap: ["Hi! Is it picnic time? Yay!", "Three cheers, one for each of my dango!", "Sweet and steady, that's you!", "You're on a roll today!", "Stick with it! You're amazing!", "Water, snack, then back to it?", "One bite at a time, and you're doing it!"],
          pet: ["Hehe, so squishy and happy!", "Aww, thank you! Triple happy!"],
          hello: ["Hi! I brought snacks! Welcome back!", "Hello! Blossoms and dango and you!"],
          morning: ["Good morning! Fresh and sweet today!", "Morning, picnic pal! Let's have fun!"],
          night: ["The picnic's packed up. Sleep soon?", "It's late now. Rest well, friend."],
          focus: ["Sticking right with you. Let's focus!", "Quiet picnic study time. You've got this!"],
          done: ["Sweet session! You were great!", "You did it! Triple yay!"],
          task: ["Done! So SWEET!", "Stuck the landing! Woohoo!", "Another one done! Yay yay yay!", "Amazing work, friend! Three cheers!"],
          break: ["Snack break! Hehe, my favorite!", "Stretch under the blossoms! Ahh!"]
        }
      }
    ]
  });
})();


