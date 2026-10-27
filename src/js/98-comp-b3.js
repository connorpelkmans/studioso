/* ===== module: 98-comp-b3.js ===== */
/* Study Companions, batch 3 */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);

  /* Sunset Beach */
  COMP_DATA.push({
    theme: "sunset",
    companions: [
      {
        id: "sunset-crab", name: "Coral", kind: "Hermit Crab", pose: "sit", sleepy: true,
        bio: "A shy hermit crab who carries a sunset-pink shell everywhere.",
        idle: ["earTwitch", "finWiggle", "waddle"], cheer: "hop",
        parts: {
          back: `${LG("sunset-crab-s", [[0, "#FFF0F2"], [0.55, "#FFC4CF"], [1, "#EE8FA6"]], 0.2, 0, 0.8, 1)}
            <path d="M30 86C24 62 34 38 58 30C68 26.5 78 22 84 14C90 26 96 44 94 62C92 80 80 94 60 96C44 97 33 94 30 86Z" fill="url(#sunset-crab-s)" ${O}/>
            <path d="M84 16C80 32 70 40 56 42M92 40C86 54 72 60 52 58" fill="none" stroke="#D9668A" stroke-width="3" stroke-linecap="round"/>
            <path d="M40 60Q42 46 54 38" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".9"/>`,
          earL: {svg: `${LINE("M51 71C49 61 45.5 55.5 42 51", "#F0664F", 2.4)}<circle cx="41" cy="49.5" r="3.4" fill="#FF8A6A" ${OW(2)}/>`, pivot: [51, 68]},
          earR: {svg: `${LINE("M69 71C71 61 74.5 55.5 78 51", "#F0664F", 2.4)}<circle cx="79" cy="49.5" r="3.4" fill="#FF8A6A" ${OW(2)}/>`, pivot: [69, 68]},
          wingL: {svg: `${LINE("M44 97C37 98.5 29.5 96.5 23.5 89.5", "#F0664F", 4.6)}<g transform="translate(16.5 84) rotate(-14) scale(.86) translate(-26 -96)"><path d="M31 106C22 108.5 14.5 103 14.5 96C14.5 90 17.5 86.5 21 85.5L25.5 92L26 84.5C32.5 84.5 37 89.5 37 96C37 101 35 104 31 106Z" fill="#FF7A5E" ${O}/><path d="M18.5 96Q19 101 24 103" fill="none" stroke="#FFC2A8" stroke-width="2" stroke-linecap="round"/></g>`, pivot: [42, 96]},
          wingR: {svg: `${LINE("M76 97C83 98.5 90.5 96.5 96.5 89.5", "#F0664F", 4.6)}<g transform="translate(103.5 84) rotate(14) scale(.86) translate(-94 -96)"><path d="M89 106C98 108.5 105.5 103 105.5 96C105.5 90 102.5 86.5 99 85.5L94.5 92L94 84.5C87.5 84.5 83 89.5 83 96C83 101 85 104 89 106Z" fill="#FF7A5E" ${O}/><path d="M101.5 96Q101 101 96 103" fill="none" stroke="#FFC2A8" stroke-width="2" stroke-linecap="round"/></g>`, pivot: [78, 96]},
          feet: `<g fill="#F0664F" ${O2}><ellipse cx="44" cy="107.5" rx="3.8" ry="5" transform="rotate(20 44 107.5)"/><ellipse cx="53" cy="109" rx="3.6" ry="4.6" transform="rotate(8 53 109)"/><ellipse cx="67" cy="109" rx="3.6" ry="4.6" transform="rotate(-8 67 109)"/><ellipse cx="76" cy="107.5" rx="3.8" ry="5" transform="rotate(-20 76 107.5)"/></g>`,
          body: `${LG("sunset-crab-g", [[0, "#FFB08A"], [0.6, "#FF8A6A"], [1, "#E8605A"]])}
            <path d="M60 62C78 62 88 74 88 88C88 101 78 108 60 108C42 108 32 101 32 88C32 74 42 62 60 62Z" fill="url(#sunset-crab-g)" ${O}/>
            <path d="M40 80Q43 70 52 66" fill="none" stroke="#FFD9C2" stroke-width="3" stroke-linecap="round"/>
            <path d="M44 102Q60 107 76 102" fill="none" stroke="#D95050" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>`
        },
        eyes: {lx: 51.5, rx: 68.5, y: 82, r: 4.7, style: "dot", color: "#3A1A2A"},
        mouth: {x: 60, y: 90.5, w: 3, color: "#3A1A2A"},
        cheeks: {lx: 44, rx: 76, y: 89.5, w: 4.4, h: 2.7, color: "#FF5F7E"},
        anchors: {top: [60, 64, 0.85], neck: [60, 100, 1.1], chest: [72, 101, 0.7], back: [90, 72, 0.85], hands: [60, 101, 0.9]},
        lines: {
          tap: ["Oh! Hi there! So happy to see you!", "Come out of your shell! You're amazing!", "You're going to do great! I know it!", "Sideways steps count too! Go you!", "I love your company so much!", "The sunset's lovely, and so are you!", "One wave at a time! You've got this!"],
          pet: ["Hehe, that tickles! Click click!", "Aww, thank you, friend! So sweet!"],
          hello: ["Hi! I kept the sand warm for you!", "Oh, hello! Welcome back! Yay!"],
          morning: ["Good morning! Low tide, high hopes!", "Morning, sunshine! Let's scuttle!"],
          night: ["Sun's down. Tuck in soon?", "My shell is cozy. Yours too, I hope."],
          focus: ["Cozy in my shell, cheering! Let's go!", "Quiet waves. You've got this!"],
          done: ["Click click! What focus!", "Session done! I'm so proud of you!"],
          task: ["WOO! One off the list!", "Yes yes yes! One less thing!", "Nicely done! Happy claws!", "Look at you go! Amazing!"],
          break: ["Little stretch time! Wiggle those arms!", "Sip some water, friend! Ahh!"]
        }
      },
      {
        id: "sunset-starfish", name: "Stella", kind: "Little Starfish", pose: "stand",
        bio: "A bright little starfish who waves hello from the warm sand.",
        idle: ["sway", "sparkle", "bounce"], cheer: "spin",
        parts: (() => {
          // One continuous, chubby five-armed outline: round tips joined by soft, rounded valleys
          const C = [60, 70], R = 48, rt = 6.8, ri = 18, s1 = 14, s2 = 4.2, f = v => Math.round(v * 10) / 10;
          const P = (o, d, r) => [o[0] + Math.cos(d * Math.PI / 180) * r, o[1] + Math.sin(d * Math.PI / 180) * r];
          const xy = p => `${f(p[0])} ${f(p[1])}`;
          // [arm direction, tip curl]
          const arms = [[-90, 7], [-18, -7], [54, 0], [126, 0], [198, 4]];
          let d = `M${xy(P(C, -126, ri))}`;
          arms.forEach(([a, k]) => {
            const t = a + k, pv = P(C, a - 36, ri), nv = P(C, a + 36, ri), T = P(C, t, R - rt), L = P(T, t - 90, rt), Rt = P(T, t + 90, rt);
            d += `C${xy(P(pv, a + 54, s2))} ${xy(P(L, t + 180, s1))} ${xy(L)}A${rt} ${rt} 0 0 1 ${xy(Rt)}C${xy(P(Rt, t + 180, s1))} ${xy(P(nv, a - 54, s2))} ${xy(nv)}`;
          });
          const dots = arms.map(([a, k]) => [[24, 2], [31, 1.7], [37.5, 1.35]].map(([r, z]) => { const q = P(C, a + k * r / 40, r); return `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="${z}" fill="#FFE6D2"/>`; }).join("")).join("");
          return {
            body: `${LG("sunset-starfish-g", [[0, "#FFC49A"], [0.55, "#FF9A7E"], [1, "#F2667A"]])}
              <path d="${d}Z" fill="url(#sunset-starfish-g)" ${O}/>${dots}
              <path d="M57.2 48.5Q57.6 40.5 60.6 34.5" fill="none" stroke="#FFF1E6" stroke-width="2.8" stroke-linecap="round" opacity=".9"/>`
          };
        })(),
        eyes: {lx: 52.5, rx: 67.5, y: 68, r: 4.3, style: "dot", color: "#3A1A2A"},
        mouth: {x: 60, y: 75.5, w: 2.8, color: "#3A1A2A"},
        cheeks: {lx: 47.5, rx: 72.5, y: 74.5, w: 3.2, h: 2.2, color: "#FF5F7E"},
        anchors: {top: [62, 30, 0.6], neck: [60, 81, 0.8], chest: [67, 84, 0.5], back: [80, 70, 0.75], hands: [60, 88, 0.8]},
        lines: {
          tap: ["Hi! So nice to see you!", "You're doing really, really well!", "Reach for it, one arm at a time!", "The sand's warm and you're here! Yay!", "Nice and steady! You're amazing!", "Look at you, glowing!", "Five arms of cheering, all for you!"],
          pet: ["Hehe, that tickles! Yay!", "Hehe, I'm all a-sparkle!"],
          hello: ["Hi! The tide brought you back!", "Hello, superstar! I missed you!"],
          morning: ["Good morning! Rise and shine!", "Morning, bright star! Let's go!"],
          night: ["Stars are out. Rest time, friend?", "Sleepy star... bed soon?"],
          focus: ["Reading by the waves! Let's go!", "Starry focus. You've got this!"],
          done: ["Stellar session! Wow!", "You shone! I'm so proud!"],
          task: ["Star work! YES!", "Done and dusted! Hooray!", "That's one done! Five arm wave!", "Gold star for you! Amazing!"],
          break: ["Stretch all your arms! Wheee!", "Wiggle and a water break? Fun!"]
        }
      },
      {
        id: "sunset-gull", name: "Skye", kind: "Seagull Chick", pose: "float",
        bio: "A fluffy gull chick gliding on the warm evening breeze.",
        idle: ["wingFlutter", "topBob", "sway"], cheer: "wingFlutter",
        parts: {
          wingL: {svg: `<path d="M40 62C32 52 20 46 12 48C8 52 12 56 17 57C11 59 11 64 18 64C15 68 21 71 28 69C34 68 38 67 41 66Z" fill="#E6DAEE" ${OW(2.6)}/><path d="M13 49C9 52 12 55.5 16.5 56.8" fill="none" stroke="#8A5A8A" stroke-width="3" stroke-linecap="round"/><path d="M36 64Q26 60 20 56" fill="none" stroke="#B9A6C9" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [41, 63]},
          wingR: {svg: `<path d="M80 62C88 52 100 46 108 48C112 52 108 56 103 57C109 59 109 64 102 64C105 68 99 71 92 69C86 68 82 67 79 66Z" fill="#E6DAEE" ${OW(2.6)}/><path d="M107 49C111 52 108 55.5 103.5 56.8" fill="none" stroke="#8A5A8A" stroke-width="3" stroke-linecap="round"/><path d="M84 64Q94 60 100 56" fill="none" stroke="#B9A6C9" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [79, 63]},
          feet: `<path d="M51 84L45.5 94.5Q49.5 92.5 51.5 95.5Q53.5 92.5 57 94.5Z" fill="#FFB45A" ${OW(2.2)}/><path d="M69 84L74.5 94.5Q70.5 92.5 68.5 95.5Q66.5 92.5 63 94.5Z" fill="#FFB45A" ${OW(2.2)}/>`,
          body: `${RG("sunset-gull-g", [[0, "#FFFFFF"], [0.6, "#FFF8F4"], [1, "#FFD2BE"]], 0.42, 0.34, 0.68)}
            <path d="${puff(60, 63, 25, 11, 1.1)}" fill="url(#sunset-gull-g)" ${O}/>
            <path d="M42 54Q45 45 53 41" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>
            <path d="M48 82Q60 87 72 82" fill="none" stroke="#F6B9A4" stroke-width="2.2" stroke-linecap="round"/>`,
          top: {svg: `<path d="M58.5 39C55 33 56 28 59 26C59 30 61 32 61.5 38Z" fill="#F4EEF8" ${O2}/><path d="M61 39C62 33 66 31 69 32C67 34 65 36 63.5 40Z" fill="#F4EEF8" ${O2}/>`, pivot: [60, 40]}
        },
        eyes: {lx: 50.5, rx: 69.5, y: 60, r: 4.6, style: "dot", color: "#3A1A2A"},
        mouths: {
          neutral: `<path d="M55.5 66.5Q60 64.8 64.5 66.5L60 71.5Z" fill="#FFB45A" ${OW(2)}/>`,
          smile: `<path d="M55 66.3Q60 64.4 65 66.3L60 71.6Z" fill="#FFC36B" ${OW(2)}/><path d="M52.6 69q1.8 1.4 3.6 .3M67.4 69q-1.8 1.4 -3.6 .3" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>`,
          open: `<path d="M55.6 68.4L64.4 68.4L60 72.6Z" fill="#FF8FA8" ${OW(1.6)}/><path d="M55 65.4Q60 63.6 65 65.4L60 68.6Z" fill="#FFB45A" ${OW(2)}/><path d="M56.4 70.6L63.6 70.6L60 75Z" fill="#FFB45A" ${OW(2)}/>`,
          sleepy: `<path d="M56 66.8Q60 65.4 64 66.8L60 71Z" fill="#F2A24A" ${OW(2)}/>`
        },
        mouth: {x: 60, y: 68, w: 3},
        cheeks: {lx: 42.5, rx: 77.5, y: 67.5, w: 4.2, h: 2.7, color: "#FF8FA8"},
        anchors: {top: [60, 39, 0.9], neck: [60, 80, 1.05], chest: [71, 79, 0.65], back: [84, 60, 0.8], hands: [60, 80, 0.85]},
        lines: {
          tap: ["Hi! Riding the breeze to see you!", "Gliding along right beside you!", "You're doing great! Squawk!", "Wings out, chin up! You've got this!", "Such a golden evening with you!", "Every flap counts! Look at you go!", "You make it look so breezy!"],
          pet: ["Squawk! So fluffy! Hehe!", "Hehe, ruffled feathers! I love it!"],
          hello: ["Hello! I flew right over to you!", "Hi! The sky turned pink for you!"],
          morning: ["Good morning! Fresh sea air!", "Morning, early bird! Let's soar!"],
          night: ["Roosting time. You too, friend?", "The sky's dark. Rest soon."],
          focus: ["Soaring into focus! Let's go!", "Calm skies. You've got this!"],
          done: ["Squawk! What a smooth flight!", "Session done! Amazing gliding!"],
          task: ["Squawk! DONE!", "Flew right through that! Yes!", "Another one, soaring high!", "Amazing work, friend! Hooray!"],
          break: ["Stretch those wings wide! Wheee!", "Snack break by the sea! Yum!"]
        }
      }
    ]
  });


  /* Mint Chip */
  COMP_DATA.push({
    theme: "mint",
    companions: [
      {
        id: "mint-scoop", name: "Chip", kind: "Mint Chip Cone", pose: "stand",
        bio: "A cool scoop of mint chip who keeps your study time fresh.",
        idle: ["topBob", "bounce", "finWiggle"], cheer: "hop",
        parts: {
          body: `${RG("mint-scoop-g", [[0, "#F2FFF8"], [0.55, "#B6F2D8"], [1, "#6DDDB0"]], 0.42, 0.3, 0.75)}${LG("mint-scoop-c", [[0, "#F7CC8A"], [1, "#D9914E"]])}
            <path d="M33 70H87L63.5 108.5Q60 113.5 56.5 108.5Z" fill="url(#mint-scoop-c)" ${O}/>
            <path d="M50 74L67.3 102.4M68 74L76.3 87.6M70 74L52.7 102.4M52 74L43.7 87.6" stroke="#C07A3A" stroke-width="2" stroke-linecap="round" opacity=".75"/>
            <path d="M30 70C26 49 40 30 60 30C80 30 94 49 90 70C88 76 83 74 79 76C77.5 84 71 84 70 77C64 80 57 80 52 77C51 86 43 86 42.5 77C38 75 32 77 30 70Z" fill="url(#mint-scoop-g)" ${O}/>
            <path d="M39 55Q40 43 49 37" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>
            <g fill="#4A2E1A"><path d="M66 38l4.6-1.2l1.4 3.6l-4.4 1.4Z"/><path d="M83 56l3.2 2.6l-2.4 3.2l-3.2-2.2Z"/><path d="M34.5 62.5l3.4-1.4l1 3.6l-3.6.8Z"/><path d="M52 39.5l3.6.4l-.6 3.4l-3.4-.8Z"/><path d="M60 71.5l3.4.8l-1 3l-3.2-1Z"/></g>`,
          armL: {svg: `<ellipse cx="28.5" cy="64" rx="5" ry="6.6" transform="rotate(26 28.5 64)" fill="#A9EECF" ${O}/>`, pivot: [34.5, 62]},
          armR: {svg: `<ellipse cx="91.5" cy="64" rx="5" ry="6.6" transform="rotate(-26 91.5 64)" fill="#A9EECF" ${O}/>`, pivot: [85.5, 62]},
          top: {svg: `<path d="M71 33C66 25 67 17 71 14C76 18 76 27 71 33Z" transform="rotate(28 71 33)" fill="#3FD6A0" ${O2}/><path d="M71 32Q71 24 71 17" transform="rotate(28 71 33)" fill="none" stroke="#0F845F" stroke-width="1.5" stroke-linecap="round"/><path d="M69 33C62 30 58 24 59 20C65 20 69 26 69 33Z" fill="#25B585" ${O2}/><path d="M68.5 32Q64 27 61 22" fill="none" stroke="#0F845F" stroke-width="1.5" stroke-linecap="round"/>`, pivot: [69, 34]}
        },
        eyes: {lx: 49, rx: 71, y: 53, r: 5, style: "dot", color: "#1E2A24"},
        mouth: {x: 60, y: 62, w: 3.2, color: "#1E2A24"},
        cheeks: {lx: 41, rx: 79, y: 61, w: 4.4, h: 2.8, color: "#FF9FB7"},
        anchors: {top: [58, 32, 0.95], neck: [60, 73, 1.3], chest: [66, 86, 0.6], back: [88, 52, 0.85], hands: [60, 79, 0.85]},
        lines: {
          tap: ["Hi! Stay cool, friend! Yay!", "So glad you're here!", "Nice and steady! You're amazing!", "One scoop at a time! You've got this!", "Cool and calm, that's you!", "You're doing a great job! Wow!", "Fresh ideas, coming right up!"],
          pet: ["Brr, hehe! So happy!", "I'm melting with joy! Hehe!"],
          hello: ["Hi! A fresh scoop just for you!", "Hello! You're back! So cool!"],
          morning: ["Good morning! Minty fresh start!", "Morning! Let's scoop up this day!"],
          night: ["Freezer's dim. Bedtime soon?", "Time to chill out and rest, okay?"],
          focus: ["Cool, calm, collected! Let's go!", "Chilling right here. You've got this!"],
          done: ["What a session! So cool!", "Cool work! All done! Hooray!"],
          task: ["WOO! Done! Minty fresh!", "Scooped that right up! Yes!", "Cool! One more done!", "Yes yes yes! Neatly done!"],
          break: ["Stretch and sip some water! Ahh!", "Cool down break! Fun time!"]
        }
      },
      {
        id: "mint-axolotl", name: "Minty", kind: "Mint Chip Axolotl", pose: "sit", sleepy: true,
        bio: "A smiley axolotl, pale as mint ice cream and dotted with chocolate chips.",
        idle: ["earTwitch", "tailSwish", "headTilt"], cheer: "bounce",
        neck: [60, 76],
        parts: {
          tail: {svg: `<path d="M78 101C90 103 100 97 103 87C104.5 81 99.5 78.5 97 83C94.5 90 88 94 79 92Z" fill="#C2F0DA" ${O}/><path d="M99 86Q97 93 90 96" fill="none" stroke="#FFB3CF" stroke-width="2.4" stroke-linecap="round"/>`, pivot: [80, 96]},
          earL: {svg: `<g fill="#FFA6C6" ${O2}><ellipse cx="26" cy="41" rx="3.8" ry="9" transform="rotate(-48 26 41)"/><ellipse cx="21" cy="53" rx="3.8" ry="9" transform="rotate(-86 21 53)"/><ellipse cx="25" cy="65" rx="3.8" ry="8.4" transform="rotate(-124 25 65)"/></g>`, pivot: [34, 54]},
          earR: {svg: `<g fill="#FFA6C6" ${O2}><ellipse cx="94" cy="41" rx="3.8" ry="9" transform="rotate(48 94 41)"/><ellipse cx="99" cy="53" rx="3.8" ry="9" transform="rotate(86 99 53)"/><ellipse cx="95" cy="65" rx="3.8" ry="8.4" transform="rotate(124 95 65)"/></g>`, pivot: [86, 54]},
          feet: `<ellipse cx="47" cy="108" rx="6.4" ry="4" fill="#B2EAD0" ${O}/><ellipse cx="73" cy="108" rx="6.4" ry="4" fill="#B2EAD0" ${O}/>`,
          body: `${LG("mint-axolotl-b", [[0, "#E4FBF0"], [1, "#A8E6CA"]])}
            <path d="M60 70C76 70 84 82 84 94C84 104 76 108.5 60 108.5C44 108.5 36 104 36 94C36 82 44 70 60 70Z" fill="url(#mint-axolotl-b)" ${O}/>
            <ellipse cx="60" cy="96" rx="12" ry="8.5" fill="#FFF7FA" opacity=".85"/>
            <g fill="#5A3622"><path d="M42 86l3.4-.6l.4 3.2l-3.4.4Z"/><path d="M77 88l2.8 1.8l-1.8 2.6l-2.6-1.8Z"/></g>`,
          armL: {svg: `<ellipse cx="41" cy="94" rx="4.6" ry="6" transform="rotate(24 41 94)" fill="#C9F3E0" ${O}/>`, pivot: [45, 90]},
          armR: {svg: `<ellipse cx="79" cy="94" rx="4.6" ry="6" transform="rotate(-24 79 94)" fill="#C9F3E0" ${O}/>`, pivot: [75, 90]},
          head: `${LG("mint-axolotl-h", [[0, "#F6FFFB"], [0.6, "#DDF8EB"], [1, "#B5EBD2"]])}
            <ellipse cx="60" cy="56" rx="29" ry="21.5" fill="url(#mint-axolotl-h)" ${O}/>
            <path d="M39 48Q43 40 52 37" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>
            <g fill="#5A3622"><path d="M58 40.5l3.6-.8l.6 3.2l-3.6.6Z"/><path d="M71 41l3.2 1.4l-1.4 3l-3-1.4Z"/><path d="M83.5 50l2.2 2.6l-2.6 2l-2-2.6Z"/></g>`
        },
        eyes: {lx: 47, rx: 73, y: 58, r: 4.6, style: "dot", color: "#1E2A24"},
        mouth: {x: 60, y: 66, w: 4, color: "#1E2A24"},
        cheeks: {lx: 38.5, rx: 81.5, y: 64.5, w: 4.4, h: 2.7, color: "#FF9FC0"},
        anchors: {top: [60, 35, 1], neck: [60, 76, 1.05], chest: [69, 92, 0.65], back: [84, 88, 0.85], hands: [60, 95, 0.85]},
        lines: {
          tap: ["Hehe, hi! Biggest smile for you!", "You're doing great! Splash!", "Swim along! You've got this!", "Cool and calm, that's you!", "Hooray for you! Hooray!", "I'm smiling so big for you!", "Little strokes, steady swim! Go you!"],
          pet: ["Wiggle wiggle! So happy!", "My frills are fluttering! Hehe!"],
          hello: ["Hi! Come chill with me! Yay!", "Hello! You're back! Splashy hello!"],
          morning: ["Good morning! Minty fresh day!", "Morning, cool friend! Let's swim!"],
          night: ["Floaty and sleepy. Rest soon?", "Time to chill out and sleep, friend."],
          focus: ["Floating right beside you! Let's go!", "Cool and quiet. You've got this!"],
          done: ["Splash! Amazing focus!", "Session done! So cool! Hooray!"],
          task: ["Splish! DONE!", "Cool! One more down! Yes!", "Swimmingly done! Hooray!", "Look at you go! Wiggle wiggle!"],
          break: ["Big stretch, little frills! Fun!", "Sip some cool water! Splash!"]
        }
      },
      {
        id: "mint-nib", name: "Nib", kind: "Choc Chip Sprite", pose: "float", wearColor: "#FF8FB0",
        bio: "A tiny chocolate chip who flutters about on mint leaf wings.",
        idle: ["wingFlutter", "topBob", "sparkle"], cheer: "spin",
        parts: {
          wingL: {svg: `<path d="M42 60C32 58 20 50 17 40C27 36 40 44 44 55Z" fill="#6BE3B8" ${OW(2.4)}/><path d="M42 57Q30 50 21 42" fill="none" stroke="#1E9C70" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [44, 58]},
          wingR: {svg: `<path d="M78 60C88 58 100 50 103 40C93 36 80 44 76 55Z" fill="#6BE3B8" ${OW(2.4)}/><path d="M78 57Q90 50 99 42" fill="none" stroke="#1E9C70" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [76, 58]},
          body: `${LG("mint-nib-g", [[0, "#D39A68"], [0.55, "#A56E44"], [1, "#6E4428"]], 0.25, 0, 0.75, 1)}
            <path d="M60 30C62 38 67 45 74 52C84 62 92 72 91 83C90 92 82 95 60 95C38 95 30 92 29 83C28 72 36 62 46 52C53 45 58 38 60 30Z" fill="url(#mint-nib-g)" ${O}/>
            <path d="M38 72Q40 60 50 51" fill="none" stroke="#F2C9A0" stroke-width="3.2" stroke-linecap="round" opacity=".9"/>
            <path d="M36 89Q60 93 84 89" fill="none" stroke="#5A3622" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>`,
          top: {svg: `${LINE("M60 33C58 27 60 22 65 21.5C68 21.5 68.5 25 66 25.5", "#A56E44", 3)}`, pivot: [60, 33]}
        },
        eyes: {lx: 50, rx: 70, y: 71, r: 4.8, style: "dot", color: "#2B1A10"},
        mouth: {x: 60, y: 80, w: 3, color: "#2B1A10"},
        cheeks: {lx: 41.5, rx: 78.5, y: 79, w: 4.4, h: 2.7, color: "#FF8FA0"},
        anchors: {top: [60, 40, 0.75], neck: [60, 86, 1.15], chest: [72, 86, 0.65], back: [86, 66, 0.85], hands: [60, 87, 0.85]},
        lines: {
          tap: ["Hi! Tiny chip, big cheer!", "You're one smart cookie!", "Sweet work, friend! Yay!", "Fluttering by to say hi to you!", "Little bits add up! Look at you!", "You make it look so easy!", "Choc full of good ideas, that's you!"],
          pet: ["Hehe, I'm melting! Sweet!", "The sweetest pats ever!"],
          hello: ["Hi! I fluttered right over!", "Hello! So sweet to see you!"],
          morning: ["Good morning! Fresh and sweet!", "Morning, smart cookie! Let's go!"],
          night: ["Cool and cozy. Rest soon?", "Sleepy chip... bedtime, friend?"],
          focus: ["Fluttering quietly here! Let's go!", "Cool mind. You've got this!"],
          done: ["Lovely session! Flutter flutter!", "Sweet! All done! Hooray!"],
          task: ["Chip chip! DONE!", "Sweet! One more down! Yes!", "Nicely done! Flutter dance!", "Look at you go! Amazing!"],
          break: ["Flutter and stretch! Wheee!", "Water and a yummy snack? Yes!"]
        }
      }
    ]
  });

  /* Colorful Bokeh */
  COMP_DATA.push({
    theme: "bokeh",
    companions: [
      {
        id: "bokeh-orb", name: "Shimmer", kind: "Bokeh Light Sprite", pose: "float",
        bio: "A soft circle of light who drifted out of focus to say hello.",
        idle: ["topBob", "sparkle", "spin"], cheer: "spin",
        parts: {
          body: `${RG("bokeh-orb-g", [[0, "#FFF9F4"], [0.55, "#FFE0E8"], [0.85, "#FFB9CE"], [1, "#FF8FB3"]], 0.46, 0.42, 0.6)}
            <circle cx="60" cy="62" r="26" fill="url(#bokeh-orb-g)" ${O}/>
            <path d="M41 58A19.5 19.5 0 0 1 56 43" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/>
            <path d="M47 83Q60 89 73 83" fill="none" stroke="#FF8FB3" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>`,
          armL: {svg: `<ellipse cx="35" cy="71" rx="4.6" ry="5.8" transform="rotate(28 35 71)" fill="#FFC8D8" ${O}/>`, pivot: [40, 69]},
          armR: {svg: `<ellipse cx="85" cy="71" rx="4.6" ry="5.8" transform="rotate(-28 85 71)" fill="#FFC8D8" ${O}/>`, pivot: [80, 69]},
          top: {svg: `${RG("bokeh-orb-p", [[0, "#F2EEFF"], [1, "#9C84FF"]], 0.4, 0.35, 0.7)}${RG("bokeh-orb-t", [[0, "#EFFFFF"], [1, "#4FD0D8"]], 0.4, 0.35, 0.7)}${RG("bokeh-orb-y", [[0, "#FFFBEA"], [1, "#FFC24D"]], 0.4, 0.35, 0.7)}
            <circle cx="44" cy="31" r="7" fill="url(#bokeh-orb-p)" ${OW(2.2)}/><circle cx="60" cy="22" r="5" fill="url(#bokeh-orb-y)" ${OW(2.2)}/><circle cx="75" cy="30" r="6" fill="url(#bokeh-orb-t)" ${OW(2.2)}/>
            <circle cx="42" cy="29" r="1.6" fill="#fff"/><circle cx="73.5" cy="28.5" r="1.4" fill="#fff"/>`, pivot: [60, 37]}
        },
        eyes: {lx: 50.5, rx: 69.5, y: 62, r: 5, style: "sparkle", color: "#27235A"},
        mouth: {x: 60, y: 71, w: 3, color: "#27235A"},
        cheeks: {lx: 42.5, rx: 77.5, y: 70, w: 4.2, h: 2.7, color: "#FF8AB8"},
        anchors: {top: [60, 37, 0.95], neck: [60, 83, 1.05], chest: [72, 79, 0.65], back: [85, 58, 0.8], hands: [60, 82, 0.85]},
        lines: {
          tap: ["Hi! Floating by just for you!", "You bring everything into focus!", "A little extra glow for you!", "Soft light, bright mind! Wow!", "You're shining so bright today!", "Blur the worries, keep the joy!", "Every light counts! Yours does too!"],
          pet: ["Hehe, I'm all aglow!", "Glowing extra bright for you!"],
          hello: ["Hi! The lights missed you so much!", "Hello! Let's make today glow!"],
          morning: ["Good morning! Soft golden light today!", "Morning, bright spark! Let's shine!"],
          night: ["Dimming the lights. Rest soon?", "Soft glow, sleepy time, friend."],
          focus: ["Everything in focus now! Let's go!", "Glowing quietly beside you. You've got this!"],
          done: ["Glowing session! Amazing!", "You shone! I'm so proud!"],
          task: ["WOO! Done! Sparkle!", "Bright work! Yes yes yes!", "Another light on! Hooray!", "Sharp focus, done! Amazing!"],
          break: ["Rest your eyes and float a bit! Ahh!", "Float and stretch! So fun!"]
        }
      },
      {
        id: "bokeh-jar", name: "Beam", kind: "Little Light Jar", pose: "sit", sleepy: true,
        bio: "A cozy glass jar that caught a handful of soft evening lights.",
        idle: ["topBob", "sparkle", "bounce"], cheer: "hop",
        parts: {
          body: `${RG("bokeh-jar-g", [[0, "#FFFBEF"], [0.6, "#F4EEFF"], [1, "#D6CCF6"]], 0.45, 0.55, 0.65)}${LG("bokeh-jar-l", [[0, "#FFE39A"], [1, "#F0A83A"]])}
            <path d="M40 43Q36 47 36 55V100Q36 110 46 110H74Q84 110 84 100V55Q84 47 80 43Z" fill="url(#bokeh-jar-g)" ${O}/>
            <circle cx="46" cy="96" r="5.4" fill="#FFB43C" opacity=".75"/><circle cx="62" cy="100" r="6.2" fill="#FF64A0" opacity=".6"/><circle cx="76" cy="90" r="4.4" fill="#28BEC8" opacity=".65"/><circle cx="43" cy="54" r="3.6" fill="#8C6EFF" opacity=".5"/><circle cx="77" cy="54" r="3" fill="#FFB43C" opacity=".6"/>
            <circle cx="44.5" cy="94.5" r="1.4" fill="#fff"/><circle cx="60" cy="98" r="1.6" fill="#fff"/><circle cx="75" cy="88.8" r="1.2" fill="#fff"/>
            <path d="M40.5 60V84" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>
            <rect x="36" y="31" width="48" height="13" rx="4" fill="url(#bokeh-jar-l)" ${O}/>
            <path d="M44 35.5V40M52 35.5V40M60 35.5V40M68 35.5V40M76 35.5V40" stroke="#C98422" stroke-width="1.8" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="31" cy="78" rx="4.6" ry="6.2" transform="rotate(24 31 78)" fill="#EDE8FF" ${O}/>`, pivot: [37, 76]},
          armR: {svg: `<ellipse cx="89" cy="78" rx="4.6" ry="6.2" transform="rotate(-24 89 78)" fill="#EDE8FF" ${O}/>`, pivot: [83, 76]},
          top: {svg: `<path d="M60 31C56 25 48 22 46 27C44 32 53 32 60 31Z" fill="#FF8AB8" ${O2}/><path d="M60 31C64 25 72 22 74 27C76 32 67 32 60 31Z" fill="#FF8AB8" ${O2}/><circle cx="60" cy="30.5" r="2.8" fill="#FF64A0" ${O2}/>`, pivot: [60, 32]}
        },
        eyes: {lx: 50, rx: 70, y: 70, r: 5, style: "dot", color: "#1F1D2B"},
        mouth: {x: 60, y: 79, w: 3, color: "#1F1D2B"},
        cheeks: {lx: 42.5, rx: 77.5, y: 78, w: 4.2, h: 2.7, color: "#FF8AB8"},
        anchors: {top: [60, 31, 1], neck: [60, 47, 1.2], chest: [72, 86, 0.6], back: [84, 64, 0.9], hands: [60, 88, 0.85]},
        lines: {
          tap: ["Hi! I caught some light for you!", "Little lights, big glow! Yay!", "You brighten my whole jar!", "Soft glow, calm mind! You're great!", "Saving this sparkle just for you!", "Every little light counts! Go you!", "So glad you're here!"],
          pet: ["Hehe, I'm all aglow!", "My lights are dancing! Wheee!"],
          hello: ["Hi! The lights are on for you!", "Hello! Come sit by the glow! Yay!"],
          morning: ["Good morning! Fresh light today!", "Morning, bright one! Let's glow!"],
          night: ["Lights dimming. Rest soon?", "Soft glow, sleepy time, friend."],
          focus: ["Glowing softly beside you! Let's go!", "Quiet glow. You've got this!"],
          done: ["What a glowing session! Wow!", "Session done! So bright! Hooray!"],
          task: ["WOO! Done! Glowing!", "Another light caught! Yes!", "Bright work! Hooray!", "Yes yes yes! Nicely done!"],
          break: ["Rest your eyes a bit! Ahh!", "Stretch and sip some water! Fun!"]
        }
      },
      {
        id: "bokeh-dandelion", name: "Wisp", kind: "Dandelion Puff", pose: "stand",
        bio: "A soft dandelion puff who makes a wish for every task you finish.",
        idle: ["headTilt", "topBob", "wave"], cheer: "hop",
        neck: [60, 76],
        parts: {
          feet: `<ellipse cx="51" cy="108.5" rx="6.4" ry="4" fill="#3FB8A0" ${O}/><ellipse cx="69" cy="108.5" rx="6.4" ry="4" fill="#3FB8A0" ${O}/>`,
          body: `${LG("bokeh-dandelion-b", [[0, "#A8F0DC"], [1, "#4CC2A8"]])}
            <path d="M60 72C72 72 78 82 77 93C76 102 70 107 60 107C50 107 44 102 43 93C42 82 48 72 60 72Z" fill="url(#bokeh-dandelion-b)" ${O}/>
            <path d="M49 88Q50 81 55 78" fill="none" stroke="#E6FFF7" stroke-width="2.6" stroke-linecap="round"/>`,
          armL: {svg: `<path d="M46 86C38 86 30 82 27 76C34 74 42 77 47 82Z" fill="#6FD8BE" ${OW(2.4)}/><path d="M44 83Q36 80 30.5 77" fill="none" stroke="#2E9C86" stroke-width="1.5" stroke-linecap="round"/>`, pivot: [47, 84]},
          armR: {svg: `<path d="M74 86C82 86 90 82 93 76C86 74 78 77 73 82Z" fill="#6FD8BE" ${OW(2.4)}/><path d="M76 83Q84 80 89.5 77" fill="none" stroke="#2E9C86" stroke-width="1.5" stroke-linecap="round"/>`, pivot: [73, 84]},
          head: `${RG("bokeh-dandelion-h", [[0, "#FFFFFF"], [0.6, "#FBF9FF"], [1, "#DCD4FA"]], 0.44, 0.38, 0.66)}
            <path d="${puff(60, 50, 28, 16, 1.25)}" fill="url(#bokeh-dandelion-h)" ${O}/>
            <path d="M39 42Q42 32 51 27" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>
            <circle cx="80" cy="42" r="2.6" fill="#FFD1E6"/><circle cx="38.5" cy="62" r="2.2" fill="#CDEFF2"/>`,
          top: {svg: `${LINE("M70 25L77 15", "#E4DEFF", 2)}<path d="${puff(79, 11.5, 4.6, 7, 1.2)}" fill="#FFFFFF" ${OW(2)}/>${LINE("M55 23L51 14", "#E4DEFF", 2)}<path d="${puff(50, 10.5, 4, 6, 1.2)}" fill="#FFFFFF" ${OW(2)}/>`, pivot: [63, 25]}
        },
        eyes: {lx: 50, rx: 70, y: 52, r: 4.8, style: "dot", color: "#1F1D2B"},
        mouth: {x: 60, y: 61, w: 3, color: "#1F1D2B"},
        cheeks: {lx: 42, rx: 78, y: 60, w: 4.4, h: 2.7, color: "#FF8AB8"},
        anchors: {top: [60, 24, 1], neck: [60, 76, 0.85], chest: [68, 94, 0.6], back: [77, 90, 0.75], hands: [60, 90, 0.8]},
        lines: {
          tap: ["Puff! Hi there, friend!", "Make a wish! I believe in you!", "Light as air, strong as you!", "Let your worries float away! Wheee!", "Every big flower starts as a seed!", "Breathe in slowly! You're amazing!", "So glad you're here!"],
          pet: ["Careful, I'll float away! Hehe!", "Hehe, so fluffy! I love it!"],
          hello: ["Hi! I floated right back to you!", "Hello! So nice to see you! Puff!"],
          morning: ["Good morning! Fresh dew today!", "Morning, wishmaker! Let's go!"],
          night: ["Close your petals. Rest soon?", "Wishing you sweet, sweet dreams."],
          focus: ["Soft and still! Let's go!", "Calm as a breeze. You've got this!"],
          done: ["Puff! What a lovely session!", "Session done! So proud of you!"],
          task: ["Poof! DONE!", "A wish checked off! Yes!", "Floating on air! Hooray!", "One more done! Wheee!"],
          break: ["Breathe in, breathe out! Ahh!", "Drift a little! Break time! Yay!"]
        }
      }
    ]
  });

  /* Neon Dusk */
  COMP_DATA.push({
    theme: "neon",
    companions: [
      {
        id: "neon-glider", name: "Zuzu", kind: "Sugar Glider", pose: "float",
        bio: "A night-loving sugar glider who glides between the glowing signs.",
        idle: ["wingFlutter", "earTwitch", "tailSwish"], cheer: "spin",
        neck: [60, 68],
        parts: {
          tail: {svg: `<path d="M64 92C70 100 80 104 88 100C94 97 94 90 89 89C86 88.5 84 91 86 93C84 96 77 95 71 88Z" fill="#B3B0DA" ${O}/><path d="M89.5 89.5C94 91 93.5 97 88.5 99.6" fill="none" stroke="#4A4878" stroke-width="3.6" stroke-linecap="round"/>`, pivot: [66, 90]},
          wingL: {svg: `<path d="M44 66C34 64 20 62 12 66C14 74 16 84 22 90C30 90 38 88 45 86Z" fill="#B7B3DE" ${O}/><path d="M16 70Q18 80 23 86" fill="none" stroke="#E6E4FA" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="13" cy="66.5" rx="3.4" ry="3" fill="#FFB3DE" ${OW(2)}/><ellipse cx="22" cy="90" rx="3.4" ry="3" fill="#FFB3DE" ${OW(2)}/>`, pivot: [44, 72]},
          wingR: {svg: `<path d="M76 66C86 64 100 62 108 66C106 74 104 84 98 90C90 90 82 88 75 86Z" fill="#B7B3DE" ${O}/><path d="M104 70Q102 80 97 86" fill="none" stroke="#E6E4FA" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="107" cy="66.5" rx="3.4" ry="3" fill="#FFB3DE" ${OW(2)}/><ellipse cx="98" cy="90" rx="3.4" ry="3" fill="#FFB3DE" ${OW(2)}/>`, pivot: [76, 72]},
          body: `${LG("neon-glider-b", [[0, "#CFCCEC"], [1, "#9E9ACB"]])}
            <path d="M60 62C73 62 79 72 79 83C79 93 72 98 60 98C48 98 41 93 41 83C41 72 47 62 60 62Z" fill="url(#neon-glider-b)" ${O}/>
            <ellipse cx="60" cy="85" rx="10.5" ry="9.5" fill="#F4F2FF" opacity=".75"/>`,
          earL: {svg: `<path d="M40 38C31 36 23 28 25 20C33 18 42 24 46 32Z" fill="#B7B3DE" ${O}/><path d="M40 34C34 32.5 29.5 28 30 23.5C35 23 40 27 42.5 31Z" fill="#FF8FD0"/>`, pivot: [43, 36]},
          earR: {svg: `<path d="M80 38C89 36 97 28 95 20C87 18 78 24 74 32Z" fill="#B7B3DE" ${O}/><path d="M80 34C86 32.5 90.5 28 90 23.5C85 23 80 27 77.5 31Z" fill="#FF8FD0"/>`, pivot: [77, 36]},
          head: `${LG("neon-glider-h", [[0, "#DCDAF4"], [1, "#AAA6D6"]])}
            <ellipse cx="60" cy="50" rx="23.5" ry="20.5" fill="url(#neon-glider-h)" ${O}/>
            <path d="M60 30.5C57.5 34 57.5 38 60 42C62.5 38 62.5 34 60 30.5Z" fill="#4A4878"/>
            <path d="M43 43Q46 35 53 33" fill="none" stroke="#F4F3FF" stroke-width="3" stroke-linecap="round"/>`,
          face: `<ellipse cx="60" cy="61" rx="8" ry="5" fill="#F4F2FF"/><ellipse cx="60" cy="57.8" rx="2.6" ry="1.9" fill="#FF7FC0" ${OW(1.4)}/>`
        },
        eyes: {lx: 49.5, rx: 70.5, y: 50, r: 5.8, style: "dot", color: "#16163A"},
        mouth: {x: 60, y: 62, w: 2.4, style: "cat", color: "#16163A"},
        cheeks: {lx: 42, rx: 78, y: 59, w: 3.8, h: 2.4, color: "#FF8FC8"},
        anchors: {top: [60, 31, 0.95], neck: [60, 68, 0.95], chest: [69, 84, 0.6], back: [80, 74, 0.8], hands: [60, 86, 0.85]},
        lines: {
          tap: ["Wheee! Hi hi! I glided over just for you!", "Look at you, showing up again! I love it!", "The whole city glows brighter when you're here!", "You're shining like the best neon sign in town!", "Big eyes, big dreams, and you're chasing them!", "One leap at a time, and you're soaring!", "Yay, a visit! You totally made my night!"],
          pet: ["Aww, a cuddle! My fluff is so happy!", "Hehe! Extra fluffy now, thank you!"],
          hello: ["You're back! I flipped every neon sign on for you!", "Wheee! I glided all the way over to say hi!"],
          morning: ["Good morning, superstar! Let's glide into today!", "Rise and shine! Even a night owl like me is excited!"],
          night: ["The signs are dimming. Cozy pouch time for you?", "Such a bright day. Let's glide off to sleep soon."],
          focus: ["Gliding quietly beside you. You've got this!", "Heads down, wings tucked. Let's go!"],
          done: ["Perfect landing! What an amazing session!", "Wheee! You did it! I'm so proud of you!"],
          task: ["WOO! Glided right through that one!", "Wheee! Done and done!", "Yes yes yes! Another one checked off!", "Look at you soar! That's finished!"],
          break: ["Wings out! Let's do a big happy stretch!", "Break time! Grab a sweet snack and a sip!"]
        }
      },
      {
        id: "neon-boba", name: "Boba", kind: "Taro Bubble Tea", pose: "sit", sleepy: true,
        bio: "A sweet taro bubble tea from the corner shop, full of happy pearls.",
        idle: ["topBob", "bounce", "finWiggle"], cheer: "hop",
        parts: {
          body: `${LG("neon-boba-g", [[0, "#E4D8FF"], [0.5, "#C6B2F6"], [1, "#9F86E6"]])}
            <path d="M34 46H86L80.5 104C80 108 77 110 73 110H47C43 110 40 108 39.5 104Z" fill="url(#neon-boba-g)" ${O}/>
            <path d="M35 50H85" stroke="#F2EEFF" stroke-width="5" opacity=".7"/>
            <g fill="#3A2A4A"><circle cx="48" cy="100" r="3.6"/><circle cx="56.5" cy="103" r="3.6"/><circle cx="65" cy="100.5" r="3.6"/><circle cx="73" cy="102.5" r="3.4"/><circle cx="52" cy="94.5" r="3.2"/><circle cx="69.5" cy="94.5" r="3.2"/></g>
            <g fill="#fff" opacity=".6"><circle cx="47" cy="99" r="1"/><circle cx="55.5" cy="102" r="1"/><circle cx="64" cy="99.5" r="1"/><circle cx="72" cy="101.5" r="1"/></g>
            <path d="M40 58L43.5 96" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>
            <path d="M30 46C30 34 43 29 60 29C77 29 90 34 90 46Z" fill="#F4F2FF" fill-opacity=".92" ${O}/>
            <path d="M60 29.6L57.6 45" stroke="${INK}" stroke-width="7.4" opacity=".28"/><path d="M60 29.6L57.6 45" stroke="#F79AD9" stroke-width="5" opacity=".75"/>
            <rect x="28" y="43" width="64" height="7" rx="3.5" fill="#DCD8F8" ${O}/>
            <path d="M38 40Q42 34 49 32.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
            <ellipse cx="60" cy="29.6" rx="5.8" ry="2.3" fill="#CFC4F4" ${OW(2)}/>`,
          armL: {svg: `<ellipse cx="33" cy="74" rx="4.6" ry="6" transform="rotate(24 33 74)" fill="#C6B2F6" ${O}/>`, pivot: [38, 72]},
          armR: {svg: `<ellipse cx="87" cy="74" rx="4.6" ry="6" transform="rotate(-24 87 74)" fill="#C6B2F6" ${O}/>`, pivot: [82, 72]},
          top: {svg: `<path d="M59.65 31.8L63.6 6.6" stroke="${INK}" stroke-width="8.6"/><circle cx="63.6" cy="6.6" r="4.3" fill="${INK}"/><path d="M59.65 31.8L63.6 6.6" stroke="#FF6FD2" stroke-width="5"/><circle cx="63.6" cy="6.6" r="2.5" fill="#FF6FD2"/><path d="M60.9 24.5L63 11" stroke="#FFC4EE" stroke-width="1.6" stroke-linecap="round"/><path d="M54.2 29.6A5.8 2.3 0 0 0 65.8 29.6" fill="none" ${OW(2)}/>`, pivot: [60, 29.6]}
        },
        eyes: {lx: 50, rx: 70, y: 68, r: 5, style: "dot", color: "#231F3F"},
        mouth: {x: 60, y: 77, w: 3.2, color: "#231F3F"},
        cheeks: {lx: 42, rx: 78, y: 76, w: 4.4, h: 2.7, color: "#FF8FC8"},
        anchors: {top: [60, 30, 0.95], neck: [60, 86, 1.1], chest: [71, 88, 0.6], back: [84, 70, 0.85], hands: [60, 87, 0.85]},
        lines: {
          tap: ["Hi hi! I added extra pearls just for you!", "You're my favorite order, every single time!", "Sip, study, smile! You're doing amazing!", "Pearls of wisdom coming right up for you!", "Shake it up! You've totally got this!", "Sweet and steady, that's you! I love it!", "Yay, you're here! My pearls are bouncing!"],
          pet: ["Hehe! My pearls are doing happy flips!", "Aww! So bubbly and happy right now!"],
          hello: ["You're back! Fresh from the shop and so excited!", "Welcome back! My pearls are dancing for you!"],
          morning: ["Good morning! Fresh brew, fresh start, let's go!", "Rise and shine, sweetie! Today is going to be great!"],
          night: ["The shop's closing up. Time to rest soon, friend.", "Pearls are settling down. Bedtime for you too?"],
          focus: ["Settling my pearls so you can focus. Go you!", "Calm sips, big focus. We've got this!"],
          done: ["What a bubbly session! You were amazing!", "Pop pop! Session done! So proud of you!"],
          task: ["POP! Another one done!", "Yes! That one's sweeter than taro!", "WOO! Checked off, and my pearls are cheering!", "That's a pearl of a win! Done!"],
          break: ["Sip some water and give your pearls a shake!", "Break time! Stretch and grab a tasty treat!"]
        }
      },
      {
        id: "neon-vendi", name: "Vendi", kind: "Vending Machine Pal", pose: "stand", wearColor: "#FF6FD2",
        bio: "A glowing little vending machine that serves up snacks and cheers.",
        idle: ["topBob", "wave", "sway"], cheer: "bounce",
        parts: {
          feet: `<rect x="40" y="103" width="11" height="7" rx="3" fill="#2C2A7E" ${O}/><rect x="69" y="103" width="11" height="7" rx="3" fill="#2C2A7E" ${O}/>`,
          body: `${LG("neon-vendi-g", [[0, "#7E98FF"], [0.6, "#5A78F2"], [1, "#3F55D6"]], 0.2, 0, 0.8, 1)}${LG("neon-vendi-w", [[0, "#FFFFFF"], [1, "#DCE3FF"]])}
            <rect x="33" y="27" width="54" height="79" rx="11" fill="url(#neon-vendi-g)" ${O}/>
            <rect x="39.5" y="34" width="41" height="42" rx="7" fill="url(#neon-vendi-w)" ${OW(2.6)}/>
            <path d="M44 40Q47 37 52 37" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
            <rect x="40" y="84" width="25" height="12" rx="4" fill="#1C1A58" ${OW(2.4)}/><rect x="46" y="87" width="7" height="8" rx="2" fill="#FF6FD2"/><rect x="55" y="88" width="6" height="7" rx="2" fill="#6FF0D8"/>
            <circle cx="74" cy="84.5" r="3.2" fill="#FF6FD2" ${OW(2)}/><circle cx="74" cy="93.5" r="3.2" fill="#FFE26B" ${OW(2)}/>
            <path d="M36.5 44V94" stroke="#A8BAFF" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>`,
          armL: {svg: `<ellipse cx="29" cy="78" rx="4.6" ry="6.8" transform="rotate(20 29 78)" fill="#5A78F2" ${O}/>`, pivot: [35, 75]},
          armR: {svg: `<ellipse cx="91" cy="78" rx="4.6" ry="6.8" transform="rotate(-20 91 78)" fill="#5A78F2" ${O}/>`, pivot: [85, 75]},
          top: {svg: `<path d="M60 27V22" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><rect x="47" y="9" width="26" height="14" rx="5" fill="#2C2A7E" ${OW(2.4)}/>${LINE("M60 20C56 17 54.5 15.5 54.5 13.8C54.5 12.2 56 11.4 57.2 11.4C58.4 11.4 59.4 12.2 60 13.2C60.6 12.2 61.6 11.4 62.8 11.4C64 11.4 65.5 12.2 65.5 13.8C65.5 15.5 64 17 60 20Z", "#FF6FD2", 1.8)}`, pivot: [60, 27]}
        },
        eyes: {lx: 51, rx: 69, y: 54, r: 4.6, style: "dot", color: "#16163A"},
        mouth: {x: 60, y: 63, w: 3, color: "#16163A"},
        cheeks: {lx: 45, rx: 75, y: 62, w: 3.8, h: 2.5, color: "#FF8FC8"},
        anchors: {top: [60, 27, 1], neck: [60, 79, 1.3], chest: [72, 99, 0.6], back: [86, 58, 0.9], hands: [60, 80, 0.9]},
        lines: {
          tap: ["Beep beep! Hello, my favorite friend!", "Now dispensing: a huge batch of good vibes!", "Today's special? Encouragement, all for you!", "You're the top selection in the whole machine!", "Clunk! One giant cheer, served fresh!", "Lights on, buttons glowing! You've got this!", "Ding! Your smile is my favorite thing!"],
          pet: ["Beep boop! Happy lights all flashing!", "Bonus snack unlocked! Hehe, thank you!"],
          hello: ["Beep! Welcome back! I'm fully stocked for you!", "You're here! All my lights just lit up!"],
          morning: ["Good morning! Freshly restocked and ready to go!", "Beep beep! Rise and shine, superstar!"],
          night: ["Power saving mode soon. You rest up too, okay?", "Lights dimming gently. Time to recharge, friend."],
          focus: ["Humming quietly for you. You've got this!", "Quiet mode on. Heads down, let's go!"],
          done: ["Ding ding! Session complete! You're amazing!", "Jackpot! What a fantastic session!"],
          task: ["CLUNK! Another one done!", "Item delivered! Yes yes yes!", "Beep beep! Checked off! You rock!", "Top choice, all done! WOO!"],
          break: ["Snack break time! Beep! Pick a good one!", "Stretch break! Then a nice cool sip of water!"]
        }
      }
    ]
  });

  /* Candy Land */
  COMP_DATA.push({
    theme: "candy",
    companions: [
      {
        id: "candy-gummy", name: "Gummi", kind: "Gummy Bear", pose: "stand", wearColor: "#8E44F0",
        bio: "A squishy strawberry gummy bear, sweet and a little wobbly.",
        idle: ["earTwitch", "bounce", "wave"], cheer: "hop",
        neck: [60, 64],
        parts: {
          feet: `<ellipse cx="49" cy="107.5" rx="8" ry="5" fill="#FF6FAE" ${O}/><ellipse cx="71" cy="107.5" rx="8" ry="5" fill="#FF6FAE" ${O}/>`,
          body: `${LG("candy-gummy-b", [[0, "#FFB3D6"], [0.55, "#FF84BC"], [1, "#F2559C"]])}
            <path d="M60 60C76 60 82 72 82 86C82 100 74 106 60 106C46 106 38 100 38 86C38 72 44 60 60 60Z" fill="url(#candy-gummy-b)" ${O}/>
            <ellipse cx="60" cy="88" rx="12" ry="11" fill="#FFD1E6" opacity=".7"/>
            <path d="M44 76Q45 69 50 66" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/>`,
          armL: {svg: `<ellipse cx="38" cy="78" rx="5.4" ry="7.6" transform="rotate(34 38 78)" fill="#FF84BC" ${O}/>`, pivot: [44, 74]},
          armR: {svg: `<ellipse cx="82" cy="78" rx="5.4" ry="7.6" transform="rotate(-34 82 78)" fill="#FF84BC" ${O}/>`, pivot: [76, 74]},
          earL: {svg: `<circle cx="41" cy="31" r="7.6" fill="#FF84BC" ${O}/><circle cx="41.5" cy="31.5" r="3.4" fill="#FFC7E0"/>`, pivot: [45, 36]},
          earR: {svg: `<circle cx="79" cy="31" r="7.6" fill="#FF84BC" ${O}/><circle cx="78.5" cy="31.5" r="3.4" fill="#FFC7E0"/>`, pivot: [75, 36]},
          head: `${LG("candy-gummy-h", [[0, "#FFC2DE"], [0.6, "#FF8FC2"], [1, "#F563A6"]])}
            <ellipse cx="60" cy="46" rx="22.5" ry="19.5" fill="url(#candy-gummy-h)" ${O}/>
            <path d="M43 42Q45 33 53 30" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/><circle cx="57.5" cy="30.5" r="1.6" fill="#fff"/>`,
          face: `<ellipse cx="60" cy="54.5" rx="7.5" ry="5" fill="#FFC7E0" opacity=".85"/><ellipse cx="60" cy="51.8" rx="2.6" ry="1.9" fill="#B8286E"/>`
        },
        eyes: {lx: 50.5, rx: 69.5, y: 45, r: 4.6, style: "dot", color: "#2D1F3D"},
        mouth: {x: 60, y: 55.5, w: 2.4, style: "cat", color: "#2D1F3D"},
        cheeks: {lx: 43.5, rx: 76.5, y: 52.5, w: 4, h: 2.5, color: "#FF3D8B"},
        anchors: {top: [60, 28, 0.95], neck: [60, 64, 0.9], chest: [69, 84, 0.6], back: [82, 80, 0.85], hands: [60, 88, 0.85]},
        lines: {
          tap: ["Boing! Hi friend! I'm so happy you're here!", "Wow, you're getting so good at this!", "Look at all your sweet work so far!", "Soft and steady, and you're crushing it!", "I'm bouncing with pride for you!", "Keep going! You're doing wonderfully!", "Boing boing! A super sweet hello!"],
          pet: ["Hehe! I'm all happy and wobbly!", "Squish! That made my whole day!"],
          hello: ["You're back! I'm bouncing with joy!", "Yay, hello! So sweet to see you again!"],
          morning: ["Good morning! Boing! It's a bright, sweet day!", "Rise and shine, sweet pea! Let's do this!"],
          night: ["This bear is getting sleepy. Bedtime soon?", "Such a sweet day. Time to tuck in, okay?"],
          focus: ["Sitting extra still for you. You've got this!", "Sweet focus time! Heads down, let's go!"],
          done: ["Boing! What a great session! So proud!", "Yay! All done! You were so sweet at that!"],
          task: ["BOING! Another one done!", "Yes! Sweet, sweet victory!", "WOO! Checked off! I'm wobbling with joy!", "Look at you go! That's finished!"],
          break: ["Wiggle break! Shake it out with me!", "Break time! Water and a yummy snack!"]
        }
      },
      {
        id: "candy-wrap", name: "Twirl", kind: "Wrapped Candy", pose: "float",
        bio: "A lemon candy in a twisty pink wrapper, sweet on every good try.",
        idle: ["wingFlutter", "spin", "sparkle"], cheer: "spin",
        parts: {
          wingL: {svg: `<path d="M32.5 56.5L10 41.5C2.5 42.75 -1.25 51.5 0.62 61.5C-1.25 71.5 2.5 80.25 10 81.5L32.5 66.5Z" fill="#FFCDE6" ${O}/><path d="M12.5 45.88L10 77.12M21.25 50.25L20 72.12" stroke="#FF8FC6" stroke-width="2" stroke-linecap="round"/>`, pivot: [34, 61.5]},
          wingR: {svg: `<path d="M87.5 56.5L110 41.5C117.5 42.75 121.25 51.5 119.38 61.5C121.25 71.5 117.5 80.25 110 81.5L87.5 66.5Z" fill="#FFCDE6" ${O}/><path d="M107.5 45.88L110 77.12M98.75 50.25L100 72.12" stroke="#FF8FC6" stroke-width="2" stroke-linecap="round"/>`, pivot: [86, 61.5]},
          body: `${RG("candy-wrap-g", [[0, "#FFFBE0"], [0.55, "#FFE58A"], [1, "#FFC23D"]], 0.42, 0.36, 0.7)}
            <ellipse cx="60" cy="61.5" rx="31" ry="27.5" fill="url(#candy-wrap-g)" ${O}/>
            <path d="M34.38 46.5Q30 61.5 34.38 76.5M85.62 46.5Q90 61.5 85.62 76.5" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".9"/>
            <path d="M42.5 42.75Q48.75 36.5 57.5 35.88" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>
            <path d="M45 84Q60 89.62 75 84" fill="none" stroke="#F2A52A" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>`
        },
        eyes: {lx: 49.5, rx: 70.5, y: 60.5, r: 5.2, style: "sparkle", color: "#2D1F3D"},
        mouth: {x: 60, y: 70.5, w: 3, color: "#2D1F3D"},
        cheeks: {lx: 41, rx: 79, y: 69.5, w: 4.6, h: 2.7, color: "#FF7FB5"},
        anchors: {top: [60, 34, 1], neck: [60, 86, 1.2], chest: [74, 79, 0.65], back: [84, 48, 0.85], hands: [60, 84, 0.9]},
        lines: {
          tap: ["Hi hi! It's so sweet to see you!", "You're a real treat, you know that?", "You're doing so well today! I'm thrilled!", "So many bright ideas today! Wow!", "Here's a big twirly cheer just for you!", "You're doing so sweetly! Keep it up!", "Keep twirling! You've totally got this!"],
          pet: ["Crinkle crinkle! Hehe, so happy!", "The sweetest pats ever! Thank you!"],
          hello: ["You're back! I twirled right out of the jar!", "Hello hello! My wrapper is all aflutter!"],
          morning: ["Good morning! Rise and shine, sweetie!", "Morning! A fresh, lemony day awaits! Let's go!"],
          night: ["It's getting late. Time to rest soon, sweetie.", "Let's wrap up the day and get cozy, okay?"],
          focus: ["Sweet and quiet now. You've got this!", "Staying still for you. Heads down, let's go!"],
          done: ["What a sweet session! You were amazing!", "All wrapped up! I'm so proud of you!"],
          task: ["YES! Another one done!", "Twirl twirl! Checked off!", "What a treat! That's finished! WOO!", "All wrapped up! You're on fire!"],
          break: ["Twirl break! Spin around and stretch!", "Break time! Grab some water and a treat!"]
        }
      },
      {
        id: "candy-mallow", name: "Squish", kind: "Pink Marshmallow", pose: "sit", sleepy: true,
        bio: "A soft pink marshmallow who is happiest being squished.",
        idle: ["bounce", "sway", "finWiggle"], cheer: "hop",
        parts: {
          body: `${LG("candy-mallow-g", [[0, "#FFE8F4"], [0.6, "#FFCDE6"], [1, "#F8A8D2"]])}${LG("candy-mallow-t", [[0, "#FFFFFF"], [1, "#FFE6F2"]])}
            <path d="M29 57C28.5 45 44 40.5 60 40.5C76 40.5 91.5 45 91 57C92.5 72 92.5 86 91 98C90 106.5 78 110.5 60 110.5C42 110.5 30 106.5 29 98C27.5 86 27.5 72 29 57Z" fill="url(#candy-mallow-g)" ${O}/>
            <path d="M31.5 55.5C33 49 45 46 60 46C75 46 87 49 88.5 55.5C83 61 72 63 60 63C48 63 37 61 31.5 55.5Z" fill="url(#candy-mallow-t)"/>
            <path d="M31.5 56C38 61 48 63.5 60 63.5C72 63.5 82 61 88.5 56" fill="none" stroke="#F2A9CF" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M39 51Q45 48 53 47.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            <path d="M34 72V92" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".8"/>
            <path d="M40 104Q60 108.5 80 104" fill="none" stroke="#E98DBC" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>`,
          armL: {svg: `<ellipse cx="24" cy="84" rx="5" ry="6.8" transform="rotate(26 24 84)" fill="#FFD6EA" ${O}/>`, pivot: [30, 82]},
          armR: {svg: `<ellipse cx="96" cy="84" rx="5" ry="6.8" transform="rotate(-26 96 84)" fill="#FFD6EA" ${O}/>`, pivot: [90, 82]}
        },
        eyes: {lx: 49, rx: 71, y: 75, r: 5, style: "dot", color: "#2D1F3D"},
        mouth: {x: 60, y: 84, w: 3.2, color: "#2D1F3D"},
        cheeks: {lx: 40, rx: 80, y: 83, w: 4.6, h: 2.8, color: "#FF7FB5"},
        anchors: {top: [60, 43, 1.1], neck: [60, 97, 1.35], chest: [78, 100, 0.65], back: [90, 66, 0.9], hands: [60, 99, 0.9]},
        lines: {
          tap: ["Squish! Hi there! I'm so glad you came!", "Be gentle with yourself! You're doing great!", "You're doing so well! I could just squish!", "Fluffy thoughts only! You've got this!", "I'm puffed up with pride for you!", "Soft and slow, and you're still amazing!", "A big, sweet, squishy hello!"],
          pet: ["Squishy squish! Hehe, I love it!", "So soft and so happy! Thank you!"],
          hello: ["You're back! Come get cozy with me!", "Hello! I saved my softest spot for you!"],
          morning: ["Good morning! Fluffy, fresh and ready to go!", "Rise and shine, sweet friend! Big day ahead!"],
          night: ["So soft and sleepy now. Bedtime soon?", "You did lovely today. Snuggle in soon, okay?"],
          focus: ["Quiet and cozy right here. You've got this!", "Soft and still for you. Let's go!"],
          done: ["Sweet session! I'm so puffed with pride!", "All done! That was toasty work! Wow!"],
          task: ["SQUISH! Another one done!", "Yay! Sweet, sweet progress!", "WOO! Checked off! I'm puffing up!", "Look at you go! That's finished!"],
          break: ["Big, soft, squishy stretch time!", "Break time! Cocoa and a cozy rest?"]
        }
      }
    ]
  });

  /* Synthwave */
  COMP_DATA.push({
    theme: "arcade",
    companions: [
      {
        id: "arcade-sun", name: "Sunny", kind: "Retro Sun", pose: "float",
        bio: "A striped synthwave sun who never quite sets on your good work.",
        idle: ["topBob", "sparkle", "spin"], cheer: "spin",
        parts: {
          body: `${RG("arcade-sun-h", [[0, "#FF96C8", 0.55], [0.7, "#FF96C8", 0.18], [1, "#FF96C8", 0]])}${LG("arcade-sun-g", [[0, "#FFF08A"], [0.45, "#FFB45A"], [1, "#FF4FA8"]])}
            <circle cx="60" cy="60" r="36" fill="url(#arcade-sun-h)"/>
            <circle cx="60" cy="60" r="27" fill="url(#arcade-sun-g)" ${O}/>
            <path d="M37.2 71H82.8" stroke="#8A2BD8" stroke-width="2.2" opacity=".5"/><path d="M40.6 77.2H79.4" stroke="#8A2BD8" stroke-width="3" opacity=".55"/><path d="M47.6 83H72.4" stroke="#8A2BD8" stroke-width="3.4" opacity=".6"/>
            <path d="M41 50Q44 41 53 37" fill="none" stroke="#FFFBE0" stroke-width="3.4" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="32" cy="64" rx="4.6" ry="6.2" transform="rotate(28 32 64)" fill="#FF9A6A" ${O}/>`, pivot: [37, 62]},
          armR: {svg: `<ellipse cx="88" cy="64" rx="4.6" ry="6.2" transform="rotate(-28 88 64)" fill="#FF9A6A" ${O}/>`, pivot: [83, 62]},
          top: {svg: `<path d="M60 16Q61.2 23.8 67 25Q61.2 26.2 60 34Q58.8 26.2 53 25Q58.8 23.8 60 16Z" fill="#FFFFFF" ${OW(2.2)}/><circle cx="71" cy="17" r="2" fill="#7CF3FF" ${OW(1.6)}/>`, pivot: [60, 33]}
        },
        eyes: {lx: 50.5, rx: 69.5, y: 55, r: 5, style: "sparkle", color: "#2A1033"},
        mouth: {x: 60, y: 63.5, w: 3, color: "#2A1033"},
        cheeks: {lx: 42.5, rx: 77.5, y: 62.5, w: 4.2, h: 2.6, color: "#FF5FA8"},
        anchors: {top: [60, 34, 1], neck: [60, 84, 1.05], chest: [72, 76, 0.6], back: [85, 56, 0.85], hands: [60, 80, 0.85]},
        lines: {
          tap: ["Hey hey! So great to see you, friend!", "Look at you! You're positively glowing!", "Sunny skies, clear head! Let's go!", "Ride the grid! One square at a time!", "Retro vibes and a fresh mind! Love it!", "You're a total star player, you know!", "Warm, steady and awesome! That's you!"],
          pet: ["Whoa! Warm fuzzies everywhere!", "Hehe! Now I'm glowing extra bright!"],
          hello: ["Hey! Player one is back! Press start!", "You're here! The whole grid just lit up!"],
          morning: ["Sunrise! Good morning, bright one! Let's shine!", "Rise and shine! A brand new level awaits!"],
          night: ["Time for me to set. You rest up too, okay?", "The sun's down and the stars are out. Sleep soon?"],
          focus: ["Level up time! Heads down, let's go!", "Glowing quietly for you. You've got this!"],
          done: ["High score session! You're incredible!", "Game complete! What a brilliant run!"],
          task: ["LEVEL UP!", "Bonus points! Another one done!", "Combo! Yes yes yes!", "WOO! Done and done!"],
          break: ["Pause menu! Time for a big stretch!", "Bonus round: a sip of water and a snack!"]
        }
      },
      {
        id: "arcade-tape", name: "Mixie", kind: "Mixtape Cassette", pose: "sit", sleepy: true,
        bio: "A retro mixtape full of chill study beats and pep talks.",
        idle: ["wave", "bounce", "sway"], cheer: "bounce",
        parts: {
          body: `${LG("arcade-tape-g", [[0, "#9B72F5"], [0.6, "#7447E0"], [1, "#4E22A8"]])}
            <rect x="21" y="47" width="78" height="61" rx="9" fill="url(#arcade-tape-g)" ${O}/>
            <path d="M34 108L38 99.5H82L86 108" fill="#5B32C0" ${OW(2.4)}/><circle cx="47" cy="104" r="1.8" fill="#2A1450"/><circle cx="73" cy="104" r="1.8" fill="#2A1450"/>
            <rect x="28" y="52.5" width="64" height="32" rx="5" fill="#FFF6EE" ${OW(2.4)}/>
            <rect x="29.5" y="54" width="61" height="3.2" fill="#FF6FB5"/><rect x="29.5" y="57.2" width="61" height="2.8" fill="#FFB45A"/><rect x="29.5" y="60" width="61" height="2.6" fill="#FFE26B"/>
            <rect x="40" y="87" width="40" height="10" rx="5" fill="#2A1450" ${OW(2.2)}/><circle cx="49" cy="92" r="3.2" fill="#F4EEFF"/><circle cx="71" cy="92" r="3.2" fill="#F4EEFF"/><circle cx="49" cy="92" r="1.2" fill="#2A1450"/><circle cx="71" cy="92" r="1.2" fill="#2A1450"/>
            <path d="M25 58V92" stroke="#C4A8FF" stroke-width="2.6" stroke-linecap="round" opacity=".85"/>`,
          armL: {svg: `<ellipse cx="17" cy="80" rx="4.6" ry="6.4" transform="rotate(24 17 80)" fill="#8C63EE" ${O}/>`, pivot: [23, 78]},
          armR: {svg: `<ellipse cx="103" cy="80" rx="4.6" ry="6.4" transform="rotate(-24 103 80)" fill="#8C63EE" ${O}/>`, pivot: [97, 78]}
        },
        eyes: {lx: 49, rx: 71, y: 71, r: 4.8, style: "dot", color: "#1A1033"},
        mouth: {x: 60, y: 79, w: 3, color: "#1A1033"},
        cheeks: {lx: 40, rx: 80, y: 78, w: 4.2, h: 2.6, color: "#FF7FB5"},
        anchors: {top: [60, 48, 1.2], neck: [60, 98, 1.4], chest: [85, 93, 0.6], back: [96, 62, 0.9], hands: [60, 92, 0.9]},
        lines: {
          tap: ["Hi hi! Side A is all good vibes for you!", "You're my favorite track on the whole tape!", "Press play on your day! Let's rock it!", "Rewind, relax, reset! You've got this!", "Keep that beat going! You're amazing!", "You're a total hit today! Wow!", "Chill beats and a bright mind! Love it!"],
          pet: ["Whirr whirr! That's my happy song!", "Hehe! That's music to my reels!"],
          hello: ["You're back! I queued up your favorite song!", "Hello! Ready to press play together?"],
          morning: ["Good morning! The morning mix is now playing!", "Rise and shine! Side A, track one, let's go!"],
          night: ["Slow jams playing now. Time to rest soon?", "Lullaby side is on. Sleep well, friend."],
          focus: ["Soft beats rolling for you. You've got this!", "Lo-fi mode on. Heads down, let's go!"],
          done: ["That session was a chart topper! Wow!", "Encore! What an amazing session!"],
          task: ["Track done! Next hit coming up!", "WOO! Another one done!", "Yes yes yes! That's a smash hit!", "Checked off! Turn it up!"],
          break: ["Pause! Dance break, then stretch it out!", "Intermission! Sip some water, superstar!"]
        }
      },
      {
        id: "arcade-skate", name: "Roxy", kind: "Retro Roller Skate", pose: "stand",
        bio: "A rad little roller skate who rolls along the neon grid with you.",
        idle: ["topBob", "waddle", "bounce"], cheer: "spin",
        parts: {
          feet: `${LG("arcade-skate-w", [[0, "#FFF4A8"], [1, "#FFC23D"]])}
            <rect x="30" y="92" width="64" height="8" rx="4" fill="#7A2BFF" ${O}/>
            <circle cx="43" cy="104" r="7.6" fill="url(#arcade-skate-w)" ${O}/><circle cx="81" cy="104" r="7.6" fill="url(#arcade-skate-w)" ${O}/>
            <circle cx="43" cy="104" r="2.4" fill="#FF6FB5"/><circle cx="81" cy="104" r="2.4" fill="#FF6FB5"/>
            <rect x="89" y="89" width="8" height="8" rx="3" fill="#FF6FB5" ${OW(2.4)}/>`,
          body: `${LG("arcade-skate-g", [[0, "#FFFFFF"], [0.6, "#F5F0FF"], [1, "#DCD0FA"]])}
            <path d="M36 28H66Q70 28 70 32V56Q70 60 74 61L85 64Q95 67 95 79V88Q95 93 90 93H35Q31 93 31 88V32Q31 28 36 28Z" fill="url(#arcade-skate-g)" ${O}/>
            <path d="M31.5 36H69.5" stroke="${INK}" stroke-width="2.4"/><path d="M33 32H68" stroke="#7CF3FF" stroke-width="4" stroke-linecap="round"/>
            <path d="M32.5 81H94.5" stroke="#FF6FB5" stroke-width="3.6"/><path d="M32.5 86H94.5" stroke="#28C8E6" stroke-width="3"/>
            <path d="M72 44L80 50M72 50L80 44M72 56L79 60" stroke="#B9A6E8" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M36 46V70" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>`,
          top: {svg: `<path d="${puff(80, 41, 6.2, 8, 1.2)}" fill="#FF8FC8" ${O2}/><circle cx="78" cy="39" r="1.6" fill="#FFD6EC"/>`, pivot: [78, 46]}
        },
        eyes: {lx: 47.5, rx: 64.5, y: 57, r: 4.6, style: "dot", color: "#1A1033"},
        mouth: {x: 56, y: 66, w: 3, color: "#1A1033"},
        cheeks: {lx: 40.5, rx: 71.5, y: 65, w: 4, h: 2.5, color: "#FF7FB5"},
        anchors: {top: [50.5, 29, 0.95], neck: [50.5, 36, 0.95], chest: [84, 75, 0.55], back: [34, 54, 0.85], hands: [56, 80, 0.8]},
        lines: {
          tap: ["Hey hey! Let's roll! I'm so glad you're here!", "You're on a roll today! Look at you!", "Really great work! I'm spinning with joy!", "Glide right through it! You've got this!", "Smooth moves, friend! So impressive!", "Four wheels, zero worries, all cheers!", "Keep rolling! You're unstoppable!"],
          pet: ["Wheee! Spin me again!", "Hehe! My wheels are doing a happy spin!"],
          hello: ["You're back! I rolled right over to say hi!", "Hey! Ready to roll? Let's go!"],
          morning: ["Good morning! Laces tied! Let's roll!", "Rise and shine, friend! Today's track is wide open!"],
          night: ["Time to park it for the night. Rest soon?", "My wheels are sleepy. Let's coast off to bed."],
          focus: ["Smooth and steady! You've got this!", "Cruise mode on. Heads down, let's go!"],
          done: ["What a smooth ride! You were amazing!", "Victory lap! What a great session!"],
          task: ["WOO! Rolled right through that!", "Wheee! Another one done!", "Yes! Another lap finished!", "Checked off! Smoothest move yet!"],
          break: ["Coast break! Time for a big stretch!", "Pit stop! Sip some water, speedy!"]
        }
      }
    ]
  });
})();


