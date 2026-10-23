/* ===== module: 98-comp-b7.js ===== */
/* Study Companions, batch 7 */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);

  /* Diwali */
  COMP_DATA.push({
    theme: "diwali",
    companions: [
      {
        id: "diwali-diya", name: "Diya", kind: "Little Diya Lamp", pose: "sit", sleepy: true,
        bio: "A warm clay lamp whose tiny flame glows brighter with every win.",
        idle: ["topBob", "bounce", "finWiggle"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="60" cy="107.5" rx="15" ry="4.4" fill="#B8552A" ${O}/>`,
          body: `${LG("diwali-diya-g", [[0, "#F8B46A"], [0.55, "#E7873F"], [1, "#C4602C"]])}
            <ellipse cx="60" cy="64" rx="33" ry="8.5" fill="#E98C47" ${O}/>
            <ellipse cx="60" cy="63.2" rx="26" ry="5" fill="#F9CB55"/>
            <path d="M27 64A33 8.5 0 0 0 93 64C93 88 79 105 60 105C41 105 27 88 27 64Z" fill="url(#diwali-diya-g)" ${O}/>
            <path d="M36 95Q42 99 48 95Q54 99 60 95Q66 99 72 95Q78 99 84 95" fill="none" stroke="#B8367A" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="42" cy="100.5" r="1.7" fill="#FCE3A1"/><circle cx="54" cy="100.5" r="1.7" fill="#FCE3A1"/><circle cx="66" cy="100.5" r="1.7" fill="#FCE3A1"/><circle cx="78" cy="100.5" r="1.7" fill="#FCE3A1"/>
            <path d="M33.5 75Q35 83 39.5 89" fill="none" stroke="#FFD8A8" stroke-width="3.2" stroke-linecap="round" opacity=".85"/>`,
          armL: {svg: `<ellipse cx="25.5" cy="81" rx="5.2" ry="7" transform="rotate(28 25.5 81)" fill="#D8763A" ${O}/>`, pivot: [32, 78]},
          armR: {svg: `<ellipse cx="94.5" cy="81" rx="5.2" ry="7" transform="rotate(-28 94.5 81)" fill="#D8763A" ${O}/>`, pivot: [88, 78]},
          top: {svg: `${LG("diwali-diya-f", [[0, "#FFE07A"], [0.6, "#FFAA3B"], [1, "#F57A2A"]])}
            <path d="M60 25C66 34 73.5 43 72 51.5C70.8 58.5 65.8 63 60 63C54.2 63 49.2 58.5 48 51.5C46.5 43 54 34 60 25Z" fill="url(#diwali-diya-f)" ${O}/>
            <path d="M60 40C63.5 45 66 49 65 53.5C64.3 56.8 62.4 58.5 60 58.5C57.6 58.5 55.7 56.8 55 53.5C54 49 56.5 45 60 40Z" fill="#FFF4C2"/>`, pivot: [60, 62]}
        },
        eyes: {lx: 49, rx: 71, y: 78, r: 4.8, style: "dot", color: "#3A1A14"},
        mouth: {x: 60, y: 86.5, w: 3.2, color: "#3A1A14"},
        cheeks: {lx: 41, rx: 79, y: 85, w: 4.6, h: 2.8, color: "#FF8FA3"},
        anchors: {top: [60, 60, 0.9], neck: [60, 92, 1.15], chest: [75, 94, 0.72], back: [89, 76, 0.9], hands: [60, 96, 0.9]},
        lines: {
          tap: ["Hi! My flame glows brighter for you!", "You're shining so bright today!", "Look at you, lighting the way!", "Every win makes me glow!", "You're doing wonderfully!", "You've got this! Glow on!", "Warm light and big cheers for you!"],
          pet: ["Hehe! My little flame is dancing!", "Aww! I'm glowing so warm now!"],
          hello: ["You're back! I lit up for you!", "Hi! Happy glow, happy you!"],
          morning: ["Good morning! A bright day ahead!", "Rise and shine! Let's glow today!"],
          night: ["My flame is soft now. Time to rest!", "Warm light, cozy dreams. Sleep well!"],
          focus: ["Steady flame, steady mind! You've got this!", "Glowing quietly beside you!"],
          done: ["Wow! What a glowing session!", "Session done! I'm shining with pride!"],
          task: ["Glow! Done! WOO!", "Yes! My flame just got brighter!", "Checked off! So bright!", "Another one done! Hooray!"],
          break: ["Stretch up tall! So nice!", "Sweet treat break! You earned it!"]
        }
      },
      {
        id: "diwali-peacock", name: "Mayu", kind: "Peacock Chick", pose: "stand",
        bio: "A proud little peacock who fans out its tail for every finished task.",
        idle: ["tailSwish", "topBob", "wingFlutter"], cheer: "wingFlutter",
        parts: {
          tail: {svg: `<g ${O}>
              <circle cx="24" cy="80" r="12"/><circle cx="31" cy="60" r="12"/><circle cx="46" cy="47" r="12"/><circle cx="74" cy="47" r="12"/><circle cx="89" cy="60" r="12"/><circle cx="96" cy="80" r="12"/></g>
            <g fill="#4FAE7E"><circle cx="24" cy="80" r="12"/><circle cx="31" cy="60" r="12"/><circle cx="46" cy="47" r="12"/><circle cx="74" cy="47" r="12"/><circle cx="89" cy="60" r="12"/><circle cx="96" cy="80" r="12"/></g>
            <g fill="#F4C24E"><ellipse cx="22" cy="80" rx="5.6" ry="6.2"/><ellipse cx="28.5" cy="59" rx="5.6" ry="6.2"/><ellipse cx="44" cy="44" rx="5.6" ry="6.2"/><ellipse cx="76" cy="44" rx="5.6" ry="6.2"/><ellipse cx="91.5" cy="59" rx="5.6" ry="6.2"/><ellipse cx="98" cy="80" rx="5.6" ry="6.2"/></g>
            <g fill="#2A5F9E"><circle cx="22" cy="80.5" r="3"/><circle cx="28.5" cy="59.5" r="3"/><circle cx="44" cy="44.5" r="3"/><circle cx="76" cy="44.5" r="3"/><circle cx="91.5" cy="59.5" r="3"/><circle cx="98" cy="80.5" r="3"/></g>`, pivot: [60, 96]},
          feet: `<path d="M44 110.5Q49 103.5 55 110.5Q49.5 113 44 110.5Z" fill="#F2A33A" ${O2}/><path d="M65 110.5Q71 103.5 76 110.5Q70.5 113 65 110.5Z" fill="#F2A33A" ${O2}/>`,
          body: `${LG("diwali-peacock-g", [[0, "#5CB9D8"], [0.55, "#3C8FC7"], [1, "#2D68A8"]])}
            <path d="M60 35C78 35 86 50 86 66C86 78 90 88 88 97C86 106 76 109 60 109C44 109 34 106 32 97C30 88 34 78 34 66C34 50 42 35 60 35Z" fill="url(#diwali-peacock-g)" ${O}/>
            <ellipse cx="60" cy="94" rx="15" ry="11.5" fill="#BFE6F0"/>
            <path d="M42 50Q46 42 53 39.5" fill="none" stroke="#B5E4F4" stroke-width="3" stroke-linecap="round" opacity=".85"/>`,
          armL: {svg: `<path d="M37 74C29 80 26 91 29 98C35 97 39.5 88 40 79Z" fill="#2F74B0" ${O}/>`, pivot: [38, 76]},
          armR: {svg: `<path d="M83 74C91 80 94 91 91 98C85 97 80.5 88 80 79Z" fill="#2F74B0" ${O}/>`, pivot: [82, 76]},
          top: {svg: `${LINE("M60 37V25M60 37L52 27M60 37L68 27", "#2D68A8", 1.8)}
            <circle cx="60" cy="22.5" r="4" fill="#4FAE7E" ${O2}/><circle cx="50.5" cy="25" r="3.6" fill="#4FAE7E" ${O2}/><circle cx="69.5" cy="25" r="3.6" fill="#4FAE7E" ${O2}/>
            <circle cx="60" cy="22.5" r="1.7" fill="#F4C24E"/><circle cx="50.5" cy="25" r="1.5" fill="#F4C24E"/><circle cx="69.5" cy="25" r="1.5" fill="#F4C24E"/>`, pivot: [60, 37]}
        },
        eyes: {lx: 50, rx: 70, y: 59, r: 4.8, style: "dot", color: "#1E2A44"},
        mouths: {
          neutral: `<path d="M56.2 65.2Q60 64 63.8 65.2L60 70Z" fill="#F4B33E" ${OW(1.8)}/>`,
          smile: `<path d="M55.8 65Q60 63.6 64.2 65L60 70.2Z" fill="#F7BE50" ${OW(1.8)}/><path d="M53.2 68.2q1.6 1.3 3.3 .3M66.8 68.2q-1.6 1.3 -3.3 .3" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`,
          open: `<path d="M56.6 66.8L63.4 66.8L60 70.8Z" fill="#FF8FA8" ${OW(1.4)}/><path d="M56 64.4Q60 63.2 64 64.4L60 67.2Z" fill="#F4B33E" ${OW(1.8)}/><path d="M57.2 68.8L62.8 68.8L60 72.6Z" fill="#F4B33E" ${OW(1.8)}/>`,
          sleepy: `<path d="M56.6 65.6Q60 64.6 63.4 65.6L60 69.6Z" fill="#E0A23A" ${OW(1.8)}/>`
        },
        mouth: {x: 60, y: 67, w: 3},
        cheeks: {lx: 42.5, rx: 77.5, y: 66, w: 4.4, h: 2.7, color: "#FFB0C6"},
        anchors: {top: [60, 38, 0.95], neck: [60, 75, 1.2], chest: [71, 92, 0.75], back: [86, 84, 0.9], hands: [60, 94, 0.95]},
        lines: {
          tap: ["Hi! I'm fanning my tail for you!", "You're so dazzling today!", "Look at you, strutting along!", "You make my feathers shimmer!", "You're doing amazing! Wow!", "You've got this, I just know it!", "So proud of you, every day!"],
          pet: ["Hehe! My tail is all fluffed up!", "Ooh! That makes me shimmer!"],
          hello: ["You're back! Full tail fan for you!", "Hi hi! I'm so happy to see you!"],
          morning: ["Good morning! Let's strut into the day!", "Rise and shine! Colors everywhere!"],
          night: ["Folding my tail for the night. Rest well!", "Cozy night, friend. Sweet dreams!"],
          focus: ["Feathers tucked! You've got this!", "Quietly cheering right beside you!"],
          done: ["Wow! What a dazzling session!", "Session done! Big tail fan for you!"],
          task: ["Fan! Done! WOO!", "Yes! Tail fully fanned for that one!", "Checked off! So dazzling!", "Another one done! Hooray!"],
          break: ["Strut around and stretch! Ahh!", "Snack break! Something tasty?"]
        }
      },
      {
        id: "diwali-kandil", name: "Kandi", kind: "Star Lantern", pose: "float",
        bio: "A paper star lantern who floats nearby and lights the way.",
        idle: ["sparkle", "tailSwish", "spin"], cheer: "spin",
        parts: {
          tail: {svg: `${LINE("M53.5 86C49.5 91 52.5 96 46.5 101", "#F4C24E", 3)}${LINE("M60 85.5C57 91 63 96 60 103", "#2FA595", 3)}${LINE("M66.5 86C70.5 91 67.5 96 73.5 101", "#F4C24E", 3)}
            <circle cx="46" cy="102.5" r="2.6" fill="#E0578F" ${OW(2)}/><circle cx="60" cy="104.5" r="2.6" fill="#E0578F" ${OW(2)}/><circle cx="74" cy="102.5" r="2.6" fill="#E0578F" ${OW(2)}/>`, pivot: [60, 84]},
          body: `${RG("diwali-kandil-g", [[0, "#FFE7A8"], [0.42, "#FFB0C8"], [1, "#D94F8E"]], 0.5, 0.56, 0.6)}
            <path d="M56.12 31.46Q60 26 63.88 31.46L70.6 40.93Q72.93 44.2 76.77 45.4L87.85 48.87Q94.24 50.88 90.24 56.25L83.32 65.57Q80.92 68.8 80.97 72.82L81.09 84.43Q81.16 91.12 74.81 88.99L63.81 85.28Q60 84 56.19 85.28L45.19 88.99Q38.84 91.12 38.91 84.43L39.03 72.82Q39.08 68.8 36.68 65.57L29.76 56.25Q25.76 50.88 32.15 48.87L43.23 45.4Q47.07 44.2 49.4 40.93Z" fill="url(#diwali-kandil-g)" ${O}/>
            <path d="M33 52Q38.5 49.5 45 48.5M53.5 38.5Q56 35 58 33.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/>
            <path d="M44 84.5Q52 80 60 80Q68 80 76 84.5" fill="none" stroke="#B8367A" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>
            <g fill="#F4C24E" ${OW(1.8)}><circle cx="89.5" cy="52.5" r="2.6"/><circle cx="30.5" cy="52.5" r="2.6"/><circle cx="79" cy="87.5" r="2.6"/><circle cx="41" cy="87.5" r="2.6"/></g>`,
          top: {svg: `${LINE("M60 27V20", "#C98A2E", 1.8)}<path d="M55.5 18.5a4.5 4.5 0 1 1 9 0a4.5 4.5 0 1 1 -9 0Z" fill="none" stroke="${INK}" stroke-width="4.6"/><path d="M55.5 18.5a4.5 4.5 0 1 1 9 0a4.5 4.5 0 1 1 -9 0Z" fill="none" stroke="#F4C24E" stroke-width="2"/>`, pivot: [60, 28]}
        },
        eyes: {lx: 51, rx: 69, y: 61, r: 4.6, style: "sparkle", color: "#4A1330"},
        mouth: {x: 60, y: 69.5, w: 3, color: "#4A1330"},
        cheeks: {lx: 43.5, rx: 76.5, y: 68, w: 4.2, h: 2.6, color: "#FF7FA6"},
        anchors: {top: [60, 34, 0.75], neck: [60, 80, 1], chest: [72, 76, 0.66], back: [84, 54, 0.8], hands: [60, 80, 0.85]},
        lines: {
          tap: ["Hi! I'm lighting the way for you!", "You're shining so bright today!", "Look at you, glowing along!", "Floating by to cheer you on!", "You're doing wonderfully!", "You've got this! Shine on!", "My star points are all sparkly for you!"],
          pet: ["Hehe! I'm swaying with joy!", "Aww! My paper glows so warm now!"],
          hello: ["You're back! I lit up for you!", "Hi! I've been floating nearby, waiting!"],
          morning: ["Good morning! A bright day ahead!", "Rise and shine! Let's light the way!"],
          night: ["My glow is gentle now. Time to rest!", "Soft light, cozy dreams. Sleep well!"],
          focus: ["Steady glow! You've got this!", "Lighting your path, quietly!"],
          done: ["Wow! What a bright session!", "Session done! I'm glowing with pride!"],
          task: ["Shine! Done! WOO!", "Yes! Another light in the sky!", "Checked off! So bright!", "Another one done! Hooray!"],
          break: ["Sway and stretch! So nice!", "Sweet treat break! You earned it!"]
        }
      }
    ]
  });

  /* Balloon Festival */
  COMP_DATA.push({
    theme: "balloons",
    companions: [
      {
        id: "balloons-balloon", name: "Breezy", kind: "Hot-Air Balloon", pose: "float", wearColor: "#2F8F8F",
        bio: "A little hot-air balloon who drifts along and lifts your mood.",
        idle: ["topBob", "sway", "sparkle"], cheer: "spin",
        parts: {
          body: `${LG("balloons-balloon-g", [[0, "#F8A68F"], [0.55, "#EC7F68"], [1, "#D4604D"]], 0.2, 0, 0.8, 1)}
            ${LINE("M47 84L50.5 95M73 84L69.5 95", "#B98552", 1.6)}
            <path d="M47 94.5H73L71 104.5Q70.5 107 68 107H52Q49.5 107 49 104.5Z" fill="#D39A5C" ${O}/>
            <path d="M50 99.5H70M51 103.5H69" fill="none" stroke="#A8703A" stroke-width="1.6" stroke-linecap="round"/>
            <rect x="45.5" y="92.5" width="29" height="4.6" rx="2.3" fill="#B97A42" ${OW(2.4)}/>
            <path d="M60 17C84 17 96 34 95 52C94 68 81 78 73 85H47C39 78 26 68 25 52C24 34 36 17 60 17Z" fill="url(#balloons-balloon-g)" ${O}/>
            <path d="M51 18.8C36 27 29 49 43 84.5H47.5C37 57 40.5 32 58 17.8Z" fill="#F6C860"/>
            <path d="M69 18.8C84 27 91 49 77 84.5H72.5C83 57 79.5 32 62 17.8Z" fill="#F6C860"/>
            <path d="M60 17C84 17 96 34 95 52C94 68 81 78 73 85H47C39 78 26 68 25 52C24 34 36 17 60 17Z" fill="none" ${O}/>
            <path d="M41.5 78.5Q60 84 78.5 78.5L73 85H47Z" fill="#4FA7A8" ${OW(2.4)}/>
            <path d="M33 45Q35 33 44 26" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".85"/>`,
          top: {svg: `${LINE("M60 18V6", "#B98552", 1.6)}<path d="M61 5.5L71.5 9L61 12.5Z" fill="#4FA7A8" ${OW(2)}/>`, pivot: [60, 18]}
        },
        eyes: {lx: 51, rx: 69, y: 52, r: 5, style: "dot"},
        mouth: {x: 60, y: 61, w: 3.2},
        cheeks: {lx: 43.5, rx: 76.5, y: 59.5, w: 4.3, h: 2.7, color: "#FFD3CF"},
        anchors: {top: [60, 20, 0.95], neck: [60, 88, 0.85], chest: [72, 72, 0.7], back: [88, 44, 0.85], hands: [60, 79, 0.85]},
        lines: {
          tap: ["Hi! You lift me right up!", "You're soaring today!", "Look at you, rising so high!", "Up, up and away! Let's go!", "You're doing amazing!", "You've got this, I just know it!", "Floating on happy clouds with you!"],
          pet: ["Wheee! I'm floating higher now!", "Hehe! That gave me a happy puff!"],
          hello: ["You're back! My basket is cheering!", "Hi! The skies are brighter with you!"],
          morning: ["Good morning! Perfect day for flying!", "Rise and shine! Up, up and away!"],
          night: ["Drifting down for the night. Rest well!", "Soft landing, cozy dreams. Sleep well!"],
          focus: ["Steady flight! You've got this!", "Drifting quietly beside you!"],
          done: ["Whoosh! What a high-flying session!", "Session done! You soared!"],
          task: ["Up! Done! WOO!", "Yes! Another one floated away!", "Checked off! Sky high!", "Another one done! Hooray!"],
          break: ["Float around and stretch! Wheee!", "Fresh air break! Look at the sky!"]
        }
      },
      {
        id: "balloons-dog", name: "Twisty", kind: "Balloon Pup", pose: "sit",
        bio: "A squeaky balloon pup twisted into shape at the festival fair.",
        idle: ["tailSwish", "earTwitch", "bounce"], cheer: "hop",
        neck: [60, 76],
        parts: {
          tail: {svg: `${LG("balloons-dog-t", [[0, "#FFD978"], [1, "#EAA93A"]])}<path d="M80 99C88 99 93 91 94 82C94.5 77 99.5 76.5 100 81.5C101 93 92 105 80 105.5Z" fill="url(#balloons-dog-t)" ${O}/><ellipse cx="97.2" cy="77.2" rx="2.6" ry="2.2" fill="#EAA93A" ${OW(2)}/>`, pivot: [82, 102]},
          feet: `<ellipse cx="36" cy="105.5" rx="13" ry="6.2" fill="#F2BC4C" ${O}/><ellipse cx="84" cy="105.5" rx="13" ry="6.2" fill="#F2BC4C" ${O}/><path d="M29 103Q32 101 36 101" fill="none" stroke="#FFF1C4" stroke-width="2.4" stroke-linecap="round"/>`,
          body: `${LG("balloons-dog-b", [[0, "#FFE08A"], [0.6, "#F6C552"], [1, "#E6A437"]])}
            <ellipse cx="60" cy="94" rx="21" ry="16" fill="url(#balloons-dog-b)" ${O}/>
            <path d="M45 88Q48 82 54 80" fill="none" stroke="#FFF4CC" stroke-width="3" stroke-linecap="round"/>`,
          armL: {svg: `<rect x="44" y="84" width="11" height="25" rx="5.5" fill="#F7C955" ${O}/><path d="M47 88.5v6" stroke="#FFF4CC" stroke-width="2.4" stroke-linecap="round"/>`, pivot: [49.5, 86]},
          armR: {svg: `<rect x="65" y="84" width="11" height="25" rx="5.5" fill="#F7C955" ${O}/><path d="M68 88.5v6" stroke="#FFF4CC" stroke-width="2.4" stroke-linecap="round"/>`, pivot: [70.5, 86]},
          earL: {svg: `<ellipse cx="32" cy="41" rx="7.2" ry="13" transform="rotate(-55 32 41)" fill="#F6C552" ${O}/><path d="M24.5 38Q28 34 32.5 33.5" fill="none" stroke="#FFF4CC" stroke-width="2.4" stroke-linecap="round"/>`, pivot: [42, 46]},
          earR: {svg: `<ellipse cx="88" cy="41" rx="7.2" ry="13" transform="rotate(55 88 41)" fill="#F6C552" ${O}/>`, pivot: [78, 46]},
          head: `${RG("balloons-dog-h", [[0, "#FFF0B8"], [0.55, "#FAD06A"], [1, "#EBA93C"]], 0.4, 0.34, 0.7)}
            <ellipse cx="60" cy="56" rx="25" ry="22.5" fill="url(#balloons-dog-h)" ${O}/>
            <ellipse cx="45" cy="44.5" rx="5.2" ry="3" transform="rotate(-35 45 44.5)" fill="#fff" opacity=".95"/><circle cx="52.5" cy="39.8" r="1.7" fill="#fff"/>`,
          face: `<ellipse cx="60" cy="65.5" rx="9.5" ry="7" fill="#FFE39A" ${O2}/><ellipse cx="60" cy="61.8" rx="3.6" ry="2.6" fill="#3A2A2E"/><ellipse cx="59" cy="61.1" rx="1.2" ry=".7" fill="#fff" opacity=".8"/>`
        },
        eyes: {lx: 47, rx: 73, y: 54, r: 4.6, style: "dot"},
        mouth: {x: 60, y: 67.5, w: 2.8, style: "cat"},
        cheeks: {lx: 40, rx: 80, y: 62.5, w: 4.4, h: 2.7, color: "#FF9D9D"},
        anchors: {top: [60, 35, 0.95], neck: [60, 77, 1.05], chest: [69, 92, 0.7], back: [84, 86, 0.9], hands: [60, 95, 0.9]},
        lines: {
          tap: ["Squeak! So happy to see you!", "Woof! You're doing great!", "Look at you, showing up again!", "My tail is twisting with joy!", "You're amazing! Squeak squeak!", "You've got this, buddy!", "Best study buddy at the whole fair!"],
          pet: ["Squeak! That's the best feeling!", "Hehe! My twisty tail is wagging!"],
          hello: ["You're back! Happy squeaks!", "Woof woof! I missed you!"],
          morning: ["Good morning! Let's have fun today!", "Rise and shine! Squeak squeak!"],
          night: ["Squeaking softly now. Time to rest!", "Cozy night, buddy. Sweet dreams!"],
          focus: ["Quiet squeaks! You've got this!", "Sitting nicely, cheering you on!"],
          done: ["Woof! What an amazing session!", "Session done! Happy squeaks for you!"],
          task: ["Squeak! Done! WOO!", "Yes! Fetched that one!", "Checked off! Tail wags!", "Another one done! Woof!"],
          break: ["Bounce around and stretch! Boing!", "Snack break! Treats for you!"]
        }
      },
      {
        id: "balloons-hamster", name: "Ace", kind: "Pilot Hamster", pose: "stand",
        bio: "A brave little pilot who checks the winds before every study flight.",
        idle: ["headTilt", "wave", "earTwitch"], cheer: "wave",
        neck: [60, 78],
        parts: {
          feet: `<ellipse cx="50" cy="109" rx="6.8" ry="4" fill="#F6C9A6" ${O}/><ellipse cx="70" cy="109" rx="6.8" ry="4" fill="#F6C9A6" ${O}/>`,
          body: `${LG("balloons-hamster-b", [[0, "#F6B77E"], [1, "#DB8E55"]])}
            <path d="M60 72C76 72 82 84 82 94C82 104 74 108.5 60 108.5C46 108.5 38 104 38 94C38 84 44 72 60 72Z" fill="url(#balloons-hamster-b)" ${O}/>
            <ellipse cx="60" cy="96" rx="13.5" ry="10" fill="#FFF1E0"/>
            <path d="M47 78Q51 73.5 56 73" fill="none" stroke="#FFD9B5" stroke-width="2.6" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="38.5" cy="89" rx="5" ry="6.6" transform="rotate(26 38.5 89)" fill="#F7C79C" ${O}/>`, pivot: [44, 86]},
          armR: {svg: `<ellipse cx="81.5" cy="89" rx="5" ry="6.6" transform="rotate(-26 81.5 89)" fill="#F7C79C" ${O}/>`, pivot: [76, 86]},
          earL: {svg: `<circle cx="39" cy="35" r="8.5" fill="#E79A62" ${O}/><circle cx="39.5" cy="35.5" r="4.4" fill="#FFB5B5"/>`, pivot: [43, 40]},
          earR: {svg: `<circle cx="81" cy="35" r="8.5" fill="#E79A62" ${O}/><circle cx="80.5" cy="35.5" r="4.4" fill="#FFB5B5"/>`, pivot: [77, 40]},
          head: `${LG("balloons-hamster-h", [[0, "#F8BE88"], [1, "#E69A60"]])}
            <path d="M60 30C80 30 88 43 88 56C88 70 77 80 60 80C43 80 32 70 32 56C32 43 40 30 60 30Z" fill="url(#balloons-hamster-h)" ${O}/>
            <path d="M60 58C51 57.5 38 61 37.5 67C39 74 49 79.5 60 79.5C71 79.5 81 74 82.5 67C82 61 69 57.5 60 58Z" fill="#FFF1E0"/>
            `,
          hat: `<path d="M33.5 44.5Q60 33 86.5 44.5" fill="none" stroke="${INK}" stroke-width="7.5" stroke-linecap="round"/><path d="M33.5 44.5Q60 33 86.5 44.5" fill="none" stroke="#7A4E34" stroke-width="3.6" stroke-linecap="round"/>
            ${RG("balloons-hamster-l", [[0, "#D9F4F2"], [1, "#58B6B4"]], 0.38, 0.35, 0.7)}
            <circle cx="50" cy="39.5" r="6.4" fill="url(#balloons-hamster-l)" stroke="#8A5A3A" stroke-width="3.4"/><circle cx="70" cy="39.5" r="6.4" fill="url(#balloons-hamster-l)" stroke="#8A5A3A" stroke-width="3.4"/>
            <circle cx="50" cy="39.5" r="8.1" fill="none" ${OW(1.8)}/><circle cx="70" cy="39.5" r="8.1" fill="none" ${OW(1.8)}/>
            <path d="M47.5 37.5l2-2M67.5 37.5l2-2" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`,
          face: `<path d="M57.9 62.4h4.2l-2.1 2.4Z" fill="#FF8FA8" ${OW(1.3)}/>`
        },
        eyes: {lx: 49, rx: 71, y: 57, r: 4.4, style: "dot"},
        mouth: {x: 60, y: 67, w: 2.6, style: "cat"},
        cheeks: {lx: 41.5, rx: 78.5, y: 64.5, w: 4.8, h: 3, color: "#FF9FA8"},
        anchors: {top: [60, 33, 0.95], neck: [60, 79, 1], chest: [69, 94, 0.7], back: [81, 90, 0.8], hands: [60, 96, 0.85]},
        lines: {
          tap: ["Captain here! So glad you're aboard!", "You're flying great today!", "Look at you, cruising along!", "Winds are perfect! Let's go!", "You're amazing, co-pilot!", "You've got this! Smooth skies!", "Every flight with you is the best!"],
          pet: ["Hehe! My goggles are all foggy!", "Squeak! That's the best!"],
          hello: ["You're back! Ready for takeoff!", "Hi, co-pilot! I missed you!"],
          morning: ["Good morning! Winds look perfect!", "Rise and shine! Time to fly!"],
          night: ["Landing for the night. Rest well!", "Hangar's cozy. Sweet dreams, pilot!"],
          focus: ["Steady flight! You've got this!", "Cruising quietly right beside you!"],
          done: ["Smooth landing! What a session!", "Session done! Top pilot!"],
          task: ["Roger! Done! WOO!", "Yes! Mission complete!", "Checked off! Great flying!", "Another one done! Hooray!"],
          break: ["Stretch your wings, pilot! Ahh!", "Snack break! Refuel time!"]
        }
      }
    ]
  });

  /* Koi Pond */
  COMP_DATA.push({
    theme: "koi",
    companions: [
      {
        id: "koi-koi", name: "Koko", kind: "Baby Koi", pose: "float", wearColor: "#2E8C80",
        bio: "A baby koi who swims happy circles around your notes.",
        idle: ["tailSwish", "finWiggle", "topBob"], cheer: "spin",
        parts: {
          back: `<circle cx="60" cy="64" r="41" fill="#E6F6F3" fill-opacity=".55" stroke="#FFFFFF" stroke-width="2.4" stroke-opacity=".9"/>
            <path d="M27 50Q31 36 43 28.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".9"/>
            <circle cx="93.5" cy="37" r="3.6" fill="#E6F6F3" fill-opacity=".6" stroke="#fff" stroke-width="1.8"/><circle cx="100" cy="27.5" r="2.3" fill="#E6F6F3" fill-opacity=".6" stroke="#fff" stroke-width="1.6"/>`,
          tail: {svg: `${LG("koi-koi-t", [[0, "#F6A26B"], [1, "#E8683A"]])}<path d="M60 84C56 92 47 97 42 104C49 107.5 56 104 60 98C64 104 71 107.5 78 104C73 97 64 92 60 84Z" fill="url(#koi-koi-t)" ${O}/><path d="M60 92V99" stroke="#C94F2A" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>`, pivot: [60, 86]},
          body: `${LG("koi-koi-g", [[0, "#FFFFFF"], [0.6, "#FFF7EE"], [1, "#F1DCC9"]])}
            <ellipse cx="60" cy="63" rx="25.5" ry="26" fill="url(#koi-koi-g)" ${O}/>
            <path d="M36.5 53C38 42 48 37.5 60 37.5C72 37.5 82 42 83.5 52C77 48 71 50.5 66 47C62 44.5 55 45.5 51 48.5C46 51.5 41 50 36.5 53Z" fill="#F08A4B"/>
            <path d="M74.5 78.5C79 76 83 73 84.5 69C85 76 82 82 77 85C74.5 84 73.5 81 74.5 78.5Z" fill="#F08A4B"/>
            <path d="M42 46Q46 41 52 39.5" fill="none" stroke="#FFC7A0" stroke-width="2.8" stroke-linecap="round"/>
            <ellipse cx="60" cy="63" rx="25.5" ry="26" fill="none" ${O}/>`,
          armL: {svg: `<path d="M37.5 70C31 71 27 77 28 85C33.5 85.5 37.5 81 39.5 75Z" fill="#F7A06A" ${O}/>`, pivot: [38.5, 72]},
          armR: {svg: `<path d="M82.5 70C89 71 93 77 92 85C86.5 85.5 82.5 81 80.5 75Z" fill="#F7A06A" ${O}/>`, pivot: [81.5, 72]},
          top: {svg: `<path d="M50 40.5C52 32 58 27 66 26C64 30 66 35 70 39.5Z" fill="#F08A4B" ${O2}/><path d="M57 37Q60 32 64 30" fill="none" stroke="#FFC7A0" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [60, 40]}
        },
        eyes: {lx: 50, rx: 70, y: 62, r: 4.8, style: "dot"},
        mouths: {
          neutral: `<ellipse cx="60" cy="71.2" rx="2.6" ry="2" fill="#F07A74" ${OW(1.8)}/>`,
          smile: `<path d="M56.2 70Q60 75 63.8 70Z" fill="#F07A74" ${OW(1.8)}/>`,
          open: `<ellipse cx="60" cy="71.6" rx="3.2" ry="3.4" fill="#F07A74" ${OW(1.8)}/><ellipse cx="60" cy="73" rx="1.8" ry="1.2" fill="#FFB3BE"/>`,
          sleepy: `<ellipse cx="60" cy="71.2" rx="1.8" ry="1.5" fill="#F07A74" ${OW(1.6)}/>`
        },
        mouth: {x: 60, y: 71, w: 2.8},
        cheeks: {lx: 42.5, rx: 77.5, y: 69, w: 4.4, h: 2.7, color: "#FF9FB0"},
        anchors: {top: [60, 40, 0.9], neck: [60, 82, 1.05], chest: [72, 76, 0.66], back: [85, 55, 0.8], hands: [60, 82, 0.85]},
        lines: {
          tap: ["Splash! So happy to see you!", "You're doing amazing!", "Look at you, swimming along!", "Happy circles, just for you!", "You've got this! Splish!", "You make my fins flutter!", "Best day in the pond with you!"],
          pet: ["Hehe! My fins are wiggling!", "Splash! That tickles!"],
          hello: ["You're back! Happy splashes!", "Hi! I swam right over!"],
          morning: ["Good morning! The pond is sparkling!", "Rise and shine! Let's swim today!"],
          night: ["Floating softly now. Time to rest!", "Cozy pond, cozy dreams. Sleep well!"],
          focus: ["Quiet swims! You've got this!", "Gliding gently beside you!"],
          done: ["Splash! What a great session!", "Session done! Happy circles for you!"],
          task: ["Splash! Done! WOO!", "Yes! Another one swum through!", "Checked off! Happy fins!", "Another one done! Hooray!"],
          break: ["Wiggle and stretch! Splish!", "Water break! Fishy approved!"]
        }
      },
      {
        id: "koi-frog", name: "Jade", kind: "Lily Pad Frog", pose: "sit", sleepy: true,
        bio: "A calm little frog who keeps you company on a lily pad.",
        idle: ["bounce", "finWiggle", "sway"], cheer: "hop",
        neck: [60, 76],
        parts: {
          feet: `${LG("koi-frog-p", [[0, "#5FB07A"], [1, "#3E8A5F"]])}
            <path d="M60 99.5C83 99.5 101 102.5 101 107.5C101 112 83 114 60 114C37 114 19 112 19 107.5C19 104 30 101.3 44 100.2L54 106.5Z" fill="url(#koi-frog-p)" ${O}/>
            <path d="M68 102.5Q84 103 94 106" fill="none" stroke="#8FD0A2" stroke-width="2.4" stroke-linecap="round"/>
            <ellipse cx="38" cy="104" rx="10" ry="5" fill="#86C96A" ${O}/><ellipse cx="82" cy="104" rx="10" ry="5" fill="#86C96A" ${O}/>`,
          body: `${LG("koi-frog-b", [[0, "#A8DD86"], [1, "#72B85E"]])}
            <path d="M60 70C77 70 85 83 85 94C85 103 76 106.5 60 106.5C44 106.5 35 103 35 94C35 83 43 70 60 70Z" fill="url(#koi-frog-b)" ${O}/>
            <ellipse cx="60" cy="95" rx="15" ry="10" fill="#EEF7C9"/>`,
          armL: {svg: `<path d="M44 84C40 91 40 98 43 103.5C47 104.5 50 103 50 100C49 95 49 90 50 86Z" fill="#8FCD6E" ${O}/>`, pivot: [47, 85]},
          armR: {svg: `<path d="M76 84C80 91 80 98 77 103.5C73 104.5 70 103 70 100C71 95 71 90 70 86Z" fill="#8FCD6E" ${O}/>`, pivot: [73, 85]},
          head: `${LG("koi-frog-h", [[0, "#B6E592"], [1, "#7CC063"]])}
            <g ${O}><circle cx="45" cy="46" r="11"/><circle cx="75" cy="46" r="11"/><ellipse cx="60" cy="61" rx="31" ry="18"/></g>
            <g fill="url(#koi-frog-h)"><circle cx="45" cy="46" r="11"/><circle cx="75" cy="46" r="11"/><ellipse cx="60" cy="61" rx="31" ry="18"/></g>
            <path d="M37.5 41Q40 36.5 45 35.5" fill="none" stroke="#E6F7C8" stroke-width="2.8" stroke-linecap="round"/>
            <path d="M52 49.5Q60 47.5 68 49.5" fill="none" stroke="#6AAE56" stroke-width="2" stroke-linecap="round" opacity=".7"/>`
        },
        eyes: {lx: 45, rx: 75, y: 47, r: 5.4, style: "dot"},
        mouth: {x: 60, y: 64, w: 4},
        cheeks: {lx: 38, rx: 82, y: 63, w: 5, h: 3, color: "#FF9FB0"},
        anchors: {top: [60, 45, 0.9], neck: [60, 78, 1.1], chest: [70, 92, 0.72], back: [86, 88, 0.9], hands: [60, 94, 0.9]},
        lines: {
          tap: ["Ribbit! So happy to see you!", "You're doing amazing today!", "Look at you, hopping along!", "Big hops of cheer for you!", "You've got this, friend!", "You make my lily pad bounce!", "Best company on the pond!"],
          pet: ["Ribbit! That's so nice!", "Hehe! I'm all hoppy now!"],
          hello: ["You're back! Happy ribbits!", "Hi! I saved you a lily pad!"],
          morning: ["Good morning! Let's hop to it!", "Rise and shine! Ribbit!"],
          night: ["Croaking softly now. Time to rest!", "Cozy lily pad, cozy dreams!"],
          focus: ["Calm and steady! You've got this!", "Sitting quietly beside you!"],
          done: ["Ribbit! What a great session!", "Session done! Big happy hop!"],
          task: ["Ribbit! Done! WOO!", "Yes! Hopped right over that one!", "Checked off! Leap of joy!", "Another one done! Hooray!"],
          break: ["Hop around and stretch! Boing!", "Water break! Pond approved!"]
        }
      },
      {
        id: "koi-lotus", name: "Lotie", kind: "Lotus Sprite", pose: "stand",
        bio: "A gentle lotus sprite who blooms a little more each study day.",
        idle: ["earTwitch", "wave", "sway"], cheer: "spin",
        neck: [60, 78],
        parts: {
          back: `${LG("koi-lotus-p", [[0, "#F58FB6"], [1, "#FBD0E0"]])}
            <path d="M60 62C65.2 42.7 52.2 32.5 35.4 30.5C33.3 47.3 40 62.4 60 62Z" fill="url(#koi-lotus-p)" ${O}/>
            <path d="M60 62C80 62.4 86.7 47.3 84.6 30.5C67.8 32.5 54.8 42.7 60 62Z" fill="url(#koi-lotus-p)" ${O}/>
            <path d="M60 62C77 49.4 72.8 32.6 60 20C47.2 32.6 43 49.4 60 62Z" fill="url(#koi-lotus-p)" ${O}/>
            <path d="M60 27V39M41.5 37L48 43.5M78.5 37L72 43.5" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`,
          earL: {svg: `<path d="M60 62C53.2 45.7 38.4 45.3 25.2 52.7C32.9 65.6 45.9 72.7 60 62Z" fill="#F9B3CD" ${O}/><path d="M31 54Q37 55 42 58" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".8" fill="none"/>`, pivot: [45, 61]},
          earR: {svg: `<path d="M60 62C66.8 45.7 81.6 45.3 94.8 52.7C87.1 65.6 74.1 72.7 60 62Z" fill="#F9B3CD" ${O}/><path d="M89 54Q83 55 78 58" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".8" fill="none"/>`, pivot: [75, 61]},
          feet: `<ellipse cx="51" cy="109" rx="6.6" ry="4" fill="#3E9A74" ${O}/><ellipse cx="69" cy="109" rx="6.6" ry="4" fill="#3E9A74" ${O}/>`,
          body: `${LG("koi-lotus-b", [[0, "#8ED6A6"], [1, "#4FAA7E"]])}
            <path d="M60 74C73 74 80 86 81 96C82 104 74 108 60 108C46 108 38 104 39 96C40 86 47 74 60 74Z" fill="url(#koi-lotus-b)" ${O}/>
            <path d="M46 88Q48 83 52 80" fill="none" stroke="#C9F0D6" stroke-width="2.6" stroke-linecap="round"/>`,
          armL: {svg: `<path d="M43 85C35 83 29 87 28 94C35 96.5 41 93 44 88Z" fill="#6CC393" ${O}/><path d="M42 87.5Q35 89.5 31 93" fill="none" stroke="#3E9A74" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [45, 86]},
          armR: {svg: `<path d="M77 85C85 83 91 87 92 94C85 96.5 79 93 76 88Z" fill="#6CC393" ${O}/><path d="M78 87.5Q85 89.5 89 93" fill="none" stroke="#3E9A74" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [75, 86]},
          head: `${RG("koi-lotus-h", [[0, "#FFFFFF"], [0.6, "#FFEAF1"], [1, "#F9C3D5"]], 0.42, 0.38, 0.7)}
            <ellipse cx="60" cy="60" rx="22" ry="20" fill="url(#koi-lotus-h)" ${O}/>
            <path d="M44 53Q46 46.5 52 43.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`
        },
        eyes: {lx: 51, rx: 69, y: 60, r: 4.5, style: "sparkle", color: "#3A2140"},
        mouth: {x: 60, y: 68.5, w: 2.8, color: "#3A2140"},
        cheeks: {lx: 44, rx: 76, y: 67, w: 4.2, h: 2.6, color: "#FF8FB0"},
        anchors: {top: [60, 41, 0.85], neck: [60, 79, 0.95], chest: [69, 94, 0.66], back: [80, 90, 0.8], hands: [60, 95, 0.85]},
        lines: {
          tap: ["Hi! I'm blooming for you!", "You're doing wonderfully!", "Look at you, growing so well!", "A little more bloom each day!", "You've got this, I just know it!", "My petals are open wide for you!", "So proud of you, every day!"],
          pet: ["Hehe! My petals are all fluttery!", "Aww! I'm blooming even more!"],
          hello: ["You're back! Full bloom for you!", "Hi! The pond is brighter now!"],
          morning: ["Good morning! Let's bloom today!", "Rise and shine! Petals open!"],
          night: ["Closing my petals now. Time to rest!", "Cozy pond, sweet dreams. Sleep well!"],
          focus: ["Calm petals! You've got this!", "Blooming quietly beside you!"],
          done: ["Wow! What a blooming session!", "Session done! I'm so proud of you!"],
          task: ["Bloom! Done! WOO!", "Yes! Another petal opened!", "Checked off! Full bloom!", "Another one done! Hooray!"],
          break: ["Stretch up toward the sun! Ahh!", "Water break! Petal approved!"]
        }
      }
    ]
  });

  /* Rainy Window */
  COMP_DATA.push({
    theme: "rain",
    companions: [
      {
        id: "rain-duck", name: "Puddle", kind: "Rain Boot Duckling", pose: "stand",
        bio: "A sunny little duckling in rain boots who loves a puddle day.",
        idle: ["waddle", "wingFlutter", "headTilt"], cheer: "wingFlutter",
        neck: [60, 74],
        parts: {
          feet: `<path d="M43 95H56V106.5Q56 111 51.5 111H40.5Q37.5 111 37.5 108.5Q37.5 105.5 41.5 105L43 104.5Z" fill="#3F80BD" ${O}/><path d="M77 95H64V106.5Q64 111 68.5 111H79.5Q82.5 111 82.5 108.5Q82.5 105.5 78.5 105L77 104.5Z" fill="#3F80BD" ${O}/>
            <path d="M44.5 101.5H54.5M65.5 101.5H75.5" stroke="#9CC4EA" stroke-width="2.6" stroke-linecap="round"/><circle cx="49.5" cy="106" r="1.4" fill="#fff"/><circle cx="70.5" cy="106" r="1.4" fill="#fff"/>`,
          body: `${LG("rain-duck-b", [[0, "#FFE680"], [1, "#F5BC3C"]])}
            <path d="M60 68C77 68 84 79 84 88C84 97 75 101.5 60 101.5C45 101.5 36 97 36 88C36 79 43 68 60 68Z" fill="url(#rain-duck-b)" ${O}/>
            <ellipse cx="60" cy="88.5" rx="13" ry="8.5" fill="#FFF3B8"/>`,
          armL: {svg: `<path d="M39 78C31 82 28 91 31 97C37 97 41 90 42 83Z" fill="#F7C94B" ${O}/>`, pivot: [40, 80]},
          armR: {svg: `<path d="M81 78C89 82 92 91 89 97C83 97 79 90 78 83Z" fill="#F7C94B" ${O}/>`, pivot: [80, 80]},
          head: `${RG("rain-duck-h", [[0, "#FFF2A6"], [0.6, "#FFDE62"], [1, "#F4BA3A"]], 0.4, 0.34, 0.7)}
            <circle cx="60" cy="52" r="24.5" fill="url(#rain-duck-h)" ${O}/>
            <path d="M42 45Q45 36.5 53 33.5" fill="none" stroke="#FFFBE0" stroke-width="3.2" stroke-linecap="round"/>`,
          top: {svg: `<path d="M60 29C57 22 60 16 65 16C62.5 19.5 63 24 64.5 28Z" fill="#FFD95A" ${O2}/><path d="M59.5 29.5C54 25 53 19.5 56 16.5C57 21 58.5 25 62 28Z" fill="#FFE27A" ${O2}/>`, pivot: [60, 29]}
        },
        eyes: {lx: 49.5, rx: 70.5, y: 51, r: 4.7, style: "dot"},
        mouths: {
          neutral: `<path d="M53.5 59.5Q60 56.5 66.5 59.5Q67.5 64 60 64.8Q52.5 64 53.5 59.5Z" fill="#F59A3C" ${OW(2)}/><path d="M55.5 61.6Q60 62.8 64.5 61.6" fill="none" stroke="#C8662A" stroke-width="1.5" stroke-linecap="round"/>`,
          smile: `<path d="M53.5 59.3Q60 56.3 66.5 59.3Q67.8 64.5 60 65.2Q52.2 64.5 53.5 59.3Z" fill="#F7A646" ${OW(2)}/><path d="M55 61.2Q60 64 65 61.2" fill="none" stroke="#C8662A" stroke-width="1.6" stroke-linecap="round"/>`,
          open: `<path d="M54.5 62.5Q60 61 65.5 62.5Q65.5 68 60 68.5Q54.5 68 54.5 62.5Z" fill="#F59A3C" ${OW(2)}/><ellipse cx="60" cy="63.6" rx="4" ry="1.8" fill="#FF8FA8"/><path d="M53.5 59Q60 56 66.5 59Q66.8 62 60 62.4Q53.2 62 53.5 59Z" fill="#F7A646" ${OW(2)}/>`,
          sleepy: `<path d="M54.5 60Q60 57.5 65.5 60Q66.3 63.5 60 64.2Q53.7 63.5 54.5 60Z" fill="#E88E36" ${OW(2)}/>`
        },
        mouth: {x: 60, y: 61, w: 3.5},
        cheeks: {lx: 41.5, rx: 78.5, y: 59, w: 4.4, h: 2.7, color: "#FF9F8F"},
        anchors: {top: [60, 30, 0.95], neck: [60, 75, 1.05], chest: [70, 89, 0.7], back: [83, 83, 0.85], hands: [60, 90, 0.9]},
        lines: {
          tap: ["Quack! Hi hi hi! I'm so happy you're here!", "Puddles are just tiny ponds, and I love them all!", "Splish splash, you've totally got this!", "Rainy days are the coziest study days!", "Look at you, showing up again! Yay!", "Every drop counts, and so does every page!", "You bring the sunshine, even on rainy days!"],
          pet: ["Quack quack! Hehe, that tickles!", "Fluffy, dry, and SO happy! Thank you!"],
          hello: ["Quack! You're back! Best day ever!", "Hi hi! Boots on, let's make a splash!"],
          morning: ["Good morning! Puddle check, and you're here!", "Rise and shine, sunshine! Let's go!"],
          night: ["Rain lullaby time. Bed soon, okay?", "Sleepy quack. You did great today. Rest well."],
          focus: ["Pitter patter, heads down. We've got this!", "Cozy rain, calm mind. You're doing great."],
          done: ["Quack quack! What a session! So proud!", "You did it! Time for a happy puddle stomp!"],
          task: ["SPLASH! Another one done!", "Yes yes yes! Checked off! Quack!", "Look at you making a big splash! Woohoo!", "Drip drop, DONE! I'm flapping with joy!"],
          break: ["Break time! Let's waddle and stretch!", "Warm drink and a big stretch? Yes please!"]
        }
      },
      {
        id: "rain-cloud", name: "Drizzle", kind: "Rain Cloud", pose: "float", wearColor: "#E8A33D",
        bio: "A soft little cloud whose gentle rain helps your ideas grow.",
        idle: ["tailSwish", "sway", "finWiggle"], cheer: "bounce",
        parts: {
          tail: {svg: `<g ${O2}><path d="M44 84C44 84 40.5 89 40.5 91.5A3.5 3.5 0 0 0 47.5 91.5C47.5 89 44 84 44 84Z" fill="#5A8FC8"/><path d="M60 88C60 88 56.5 93 56.5 95.5A3.5 3.5 0 0 0 63.5 95.5C63.5 93 60 88 60 88Z" fill="#5A8FC8"/><path d="M76 84C76 84 72.5 89 72.5 91.5A3.5 3.5 0 0 0 79.5 91.5C79.5 89 76 84 76 84Z" fill="#5A8FC8"/></g>
            <path d="M42.8 90.5v1.2M58.8 94.5v1.2M74.8 90.5v1.2" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [60, 80]},
          body: `${LG("rain-cloud-g", [[0, "#F4F7FC"], [0.55, "#DCE5F1"], [1, "#B7C6DB"]])}
            <g ${O}><circle cx="39" cy="66" r="15"/><circle cx="58" cy="53" r="21"/><circle cx="80" cy="63" r="16"/><rect x="25" y="62" width="70" height="21" rx="10.5"/></g>
            <g fill="url(#rain-cloud-g)"><circle cx="39" cy="66" r="15"/><circle cx="58" cy="53" r="21"/><circle cx="80" cy="63" r="16"/><rect x="25" y="62" width="70" height="21" rx="10.5"/></g>
            <path d="M42 45Q46 36 55 33.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>
            <path d="M34 78Q60 84 86 78" fill="none" stroke="#A9B9D0" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`,
          armL: {svg: `<ellipse cx="25" cy="76" rx="6.4" ry="7.6" transform="rotate(30 25 76)" fill="#EEF2F9" ${O}/>`, pivot: [31, 73]},
          armR: {svg: `<ellipse cx="95" cy="76" rx="6.4" ry="7.6" transform="rotate(-30 95 76)" fill="#EEF2F9" ${O}/>`, pivot: [89, 73]}
        },
        eyes: {lx: 50, rx: 70, y: 62, r: 4.8, style: "dot", color: "#26324A"},
        mouth: {x: 60, y: 70.5, w: 3, color: "#26324A"},
        cheeks: {lx: 42, rx: 78, y: 69, w: 4.4, h: 2.7, color: "#FFA6BD"},
        anchors: {top: [58, 33, 0.95], neck: [60, 80, 1.3], chest: [78, 74, 0.7], back: [86, 54, 0.85], hands: [60, 80, 0.9]},
        lines: {
          tap: ["Drip drop, hi! I'm so glad you're here!", "Growing ideas, one happy drop at a time!", "A little rain helps everything grow, you too!", "Cloudy outside, sunny in here with you!", "Soft rain, sharp mind! Let's do this!", "Look at you go! I'm raining confetti!", "Every storm passes, and you shine right through!"],
          pet: ["Pitter patter, hehe! I'm all puffed up!", "Ooh, I'm so fluffy now! Thank you!"],
          hello: ["Hi! Yay, you're back! Cozy weather awaits!", "Hello hello! I brought a happy drizzle!"],
          morning: ["Good morning! Rain or shine, let's go!", "Morning mist and a big hello! Ready?"],
          night: ["Drizzling off to dreamland. Bedtime soon?", "A soft rain lullaby for you. Rest well."],
          focus: ["Gentle rain, steady you. We've got this!", "Pitter patter, heads down. You're doing great."],
          done: ["What a steady session! I'm so proud!", "Session done! Rainbow time, you earned it!"],
          task: ["DRIP! Done and dusted! Yay!", "Right through it! You're amazing!", "Clear skies ahead! Another one checked off!", "Rainbow earned! Woohoo, look at you!"],
          break: ["Break time! Let's float and stretch!", "Ooh, warm tea time? Let's take a break!"]
        }
      },
      {
        id: "rain-snail", name: "Dewey", kind: "Window Snail", pose: "sit", sleepy: true,
        bio: "A slow and steady snail who naps on the windowsill while you work.",
        idle: ["earTwitch", "sway", "headTilt"], cheer: "bounce",
        neck: [52, 84],
        parts: {
          back: `${RG("rain-snail-s", [[0, "#FFE3A8"], [0.6, "#F2B56B"], [1, "#D98E45"]], 0.45, 0.4, 0.62)}
            <circle cx="76" cy="70" r="26" fill="url(#rain-snail-s)" ${O}/>
            <path d="M76 70C76 66 81 66 81.5 70.5C82 76 74.5 78 71 74C66.5 69 70.5 60.5 78 60.5C87 60.5 91.5 69 89 76.5C86 85.5 73 88 65 82" fill="none" stroke="#B8702E" stroke-width="3" stroke-linecap="round"/>
            <path d="M58 60Q62 50 72 46" fill="none" stroke="#FFF1CC" stroke-width="3" stroke-linecap="round"/>`,
          earL: {svg: `${LINE("M46 66C44 58 41 52 38 47", "#B9C6EA", 3)}<circle cx="37.5" cy="45.5" r="4" fill="#CDD7F2" ${O2}/>`, pivot: [46, 68]},
          earR: {svg: `${LINE("M58 66C59 58 60 52 62 46", "#B9C6EA", 3)}<circle cx="62.5" cy="44.5" r="4" fill="#CDD7F2" ${O2}/>`, pivot: [57, 68]},
          body: `${LG("rain-snail-b", [[0, "#D5DEF6"], [1, "#A4B3DE"]])}
            <path d="M22 106C22 99 28 94 38 94H86C95 94 101 97 101 102C101 107 96 109.5 88 109.5H30C25 109.5 22 108.5 22 106Z" fill="url(#rain-snail-b)" ${O}/>
            <path d="M31 99Q36 97 42 97" fill="none" stroke="#EEF2FC" stroke-width="2.6" stroke-linecap="round"/>`,
          head: `${LG("rain-snail-h", [[0, "#E0E7FA"], [1, "#AFBDE4"]])}
            <path d="M52 64C66 64 72 74 72 86C72 97 64 104 52 104C40 104 32 97 32 86C32 74 38 64 52 64Z" fill="url(#rain-snail-h)" ${O}/>
            <path d="M38 76Q40.5 70 46 67.5" fill="none" stroke="#F4F7FF" stroke-width="3" stroke-linecap="round"/>`
        },
        eyes: {lx: 43.5, rx: 60.5, y: 83, r: 4.4, style: "dot", color: "#2A2F4A"},
        mouth: {x: 52, y: 91, w: 2.8, color: "#2A2F4A"},
        cheeks: {lx: 37, rx: 67, y: 90, w: 3.8, h: 2.5, color: "#FF9FBA"},
        anchors: {top: [52, 66, 0.85], neck: [52, 98, 0.95], chest: [90, 101, 0.6], back: [76, 64, 0.95], hands: [52, 100, 0.85]},
        lines: {
          tap: ["Oh hello there! You made my whole day!", "Slow and steady, and you're doing so well!", "No rush at all. You're doing wonderfully!", "I carry my cozy, and I'm sharing it with you!", "Rainy day, happy snail, happier with you here!", "One inch at a time, and look how far you've come!", "Your pace is the right pace! I love it!"],
          pet: ["Mmm, so gentle! My shell is all warm!", "Happy little shell wiggle! Thank you!"],
          hello: ["Oh, you're back! I woke right up for you!", "Hi hi! The rain is lovely, and so are you!"],
          morning: ["Good morning, dewdrop! What a lovely day!", "Morning! Slow stretch, big smile. Let's go!"],
          night: ["Tucking into my shell. Time for you to rest?", "Sleepy rain outside. Rest well, friend."],
          focus: ["Slow and steady, heads down. We've got this!", "I'll stay right here. You're doing great!"],
          done: ["Steady wins the day! I'm so proud of you!", "You made it! What a wonderful session!"],
          task: ["YAY! One more done, slow and sure!", "Checked off! My shell is spinning with joy!", "Look at that! Another one finished! Woohoo!", "Inch by inch, DONE! You're amazing!"],
          break: ["Break time! Let's peek out at the rain!", "Stretch break! Even snails love a good stretch!"]
        }
      }
    ]
  });

  /* Alpine Lake */
  COMP_DATA.push({
    theme: "alpine",
    companions: [
      {
        id: "alpine-goat", name: "Tilly", kind: "Mountain Goat Kid", pose: "stand",
        bio: "A fluffy goat kid with a tiny bell who hops from peak to peak with you.",
        idle: ["earTwitch", "headTilt", "hop"], cheer: "hop",
        neck: [60, 76],
        parts: {
          earL: {svg: `<path d="M38.5 51C31 49 23 51.5 20 56.5C25 60 33 60 39.5 57Z" fill="#F4ECE2" ${O}/><path d="M36 53.5C31 53 26.5 54.5 24.5 56.5C28 57.8 32.5 57.5 36 56Z" fill="#FFC3CC"/>`, pivot: [39, 54]},
          earR: {svg: `<path d="M81.5 51C89 49 97 51.5 100 56.5C95 60 87 60 80.5 57Z" fill="#F4ECE2" ${O}/><path d="M84 53.5C89 53 93.5 54.5 95.5 56.5C92 57.8 87.5 57.5 84 56Z" fill="#FFC3CC"/>`, pivot: [81, 54]},
          feet: `<path d="M44 101H55V108.5Q55 111 52.5 111H46.5Q44 111 44 108.5Z" fill="#5E6678" ${O2}/><path d="M65 101H76V108.5Q76 111 73.5 111H67.5Q65 111 65 108.5Z" fill="#5E6678" ${O2}/>`,
          body: `${LG("alpine-goat-b", [[0, "#FFFFFF"], [1, "#E3E6EE"]])}
            <path d="M60 72C76 72 82 83 82 92C82 101 74 105 60 105C46 105 38 101 38 92C38 83 44 72 60 72Z" fill="url(#alpine-goat-b)" ${O}/>
            <path d="M44 81Q47 76 53 74.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M45 78Q60 84 75 78" fill="none" stroke="#D2463E" stroke-width="3.6" stroke-linecap="round"/>
            <path d="M56 81.5Q56 78.5 60 78.5Q64 78.5 64 81.5L65 87H55Z" fill="#F2C24A" ${OW(2)}/><circle cx="60" cy="88" r="1.6" fill="#8A6420"/>`,
          armL: {svg: `<ellipse cx="41" cy="90" rx="5" ry="7.2" transform="rotate(22 41 90)" fill="#F6F2EC" ${O}/>`, pivot: [45, 85]},
          armR: {svg: `<ellipse cx="79" cy="90" rx="5" ry="7.2" transform="rotate(-22 79 90)" fill="#F6F2EC" ${O}/>`, pivot: [75, 85]},
          head: `${LG("alpine-goat-h", [[0, "#FFFFFF"], [1, "#E8E9F0"]])}
            <path d="M48 36C46 29 47.5 23 52 20.5C51 25.5 52.5 30 55 33Z" fill="#D8B889" ${O2}/><path d="M72 36C74 29 72.5 23 68 20.5C69 25.5 67.5 30 65 33Z" fill="#D8B889" ${O2}/>
            <ellipse cx="60" cy="55" rx="23.5" ry="22" fill="url(#alpine-goat-h)" ${O}/>
            <ellipse cx="60" cy="66" rx="10" ry="7" fill="#F9E8E3"/>
            <path d="M42.5 48Q45 41 51 38" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
          face: `<path d="M57.8 62h4.4l-2.2 2.4Z" fill="#FF8FA8" ${OW(1.3)}/>`,
          top: {svg: `<path d="${puff(60, 36, 7.5, 7, 1.2)}" fill="#FFFFFF" ${O2}/>`, pivot: [60, 40]}
        },
        eyes: {lx: 49, rx: 71, y: 54, r: 4.5, style: "dot"},
        mouth: {x: 60, y: 67.5, w: 2.6, style: "cat"},
        cheeks: {lx: 42, rx: 78, y: 62, w: 4.4, h: 2.7, color: "#FF9FB3"},
        anchors: {top: [60, 36, 0.95], neck: [60, 77, 1], chest: [71, 94, 0.66], back: [82, 86, 0.85], hands: [60, 95, 0.85]},
        lines: {
          tap: ["Ding ding! Hi! My bell is so happy to see you!", "Hop hop! We're climbing higher every day!", "Look at you scaling this mountain! Wow!", "You're on fire today! Peak after peak!", "Every step up is a step worth cheering!", "I believe in you all the way to the top!", "Fresh air, big views, and you! Perfect!"],
          pet: ["Ding a ling! Hehe, that's my happy bell!", "Ooh, so soft! My fluff is doing a little hop!"],
          hello: ["You're back! Ding ding ding! Let's climb!", "Hi hi! I saved you the best spot on the peak!"],
          morning: ["Good morning! The sun is on the peaks! Let's go!", "Rise and hop! A whole new mountain awaits!"],
          night: ["The stars are out. Time to rest your hooves?", "Soft bell, sleepy goat. Rest well, climber."],
          focus: ["One step at a time. We've got this!", "Heads down, steady climb. You're doing great!"],
          done: ["Summit reached! What a session! Ding ding!", "You did it! I'm hopping in circles for you!"],
          task: ["WOO! Another peak conquered!", "Yes yes yes! Checked off! Ding ding!", "Top of the mountain! You're unstoppable!", "Another one done! I'm doing happy hops!"],
          break: ["Break time! Let's hop around and stretch!", "Mountain air break! Big deep breath, go!"]
        }
      },
      {
        id: "alpine-peak", name: "Summit", kind: "Snowy Peak", pose: "sit", sleepy: true, wearColor: "#E8A33D",
        bio: "A calm little mountain with a snowy cap and a very steady heart.",
        idle: ["sway", "bounce", "sparkle"], cheer: "bounce",
        parts: {
          body: `${LG("alpine-peak-g", [[0, "#B9AEEE"], [0.6, "#978AD9"], [1, "#7B6DC4"]])}
            <path d="M60 17C65.5 17 69.5 22.5 73 30L96.5 87C101 98 96 108.5 85 108.5H35C24 108.5 19 98 23.5 87L47 30C50.5 22.5 54.5 17 60 17Z" fill="url(#alpine-peak-g)" ${O}/>
            <path d="M60 17C54.5 17 50.5 22.5 47 30L40.5 45.5Q45 50.5 49 45.5Q54 51.5 59 45.5Q64 51 68.5 45.5Q74.5 51.5 79.5 45.5L73 30C69.5 22.5 65.5 17 60 17Z" fill="#FFFFFF"/>
            <path d="M40.5 45.5Q45 50.5 49 45.5Q54 51.5 59 45.5Q64 51 68.5 45.5Q74.5 51.5 79.5 45.5" fill="none" stroke="#D2CCF2" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M60 17C65.5 17 69.5 22.5 73 30L96.5 87C101 98 96 108.5 85 108.5H35C24 108.5 19 98 23.5 87L47 30C50.5 22.5 54.5 17 60 17Z" fill="none" ${O}/>
            <path d="M51 29Q53.5 23 57.5 21" fill="none" stroke="#E4EEF9" stroke-width="3" stroke-linecap="round"/>
            ${LG("alpine-peak-m", [[0, "#9ED68E"], [1, "#6DB07A"]])}
            <path d="M22.2 91Q27 95.5 32 92.5Q38 97.5 45 93.5Q52.5 98.5 60 94Q67.5 98.5 75 93.5Q82 97.5 88 92.5Q93 95.5 97.8 91C100 100 95 108.5 85 108.5H35C25 108.5 20 100 22.2 91Z" fill="url(#alpine-peak-m)" ${OW(2.4)}/>
            <circle cx="37" cy="101" r="1.8" fill="#FFF3A6"/><circle cx="52" cy="103" r="1.8" fill="#fff"/><circle cx="70" cy="102" r="1.8" fill="#FFF3A6"/><circle cx="84" cy="100.5" r="1.8" fill="#fff"/>
            <path d="M60 17C65.5 17 69.5 22.5 73 30L96.5 87C101 98 96 108.5 85 108.5H35C24 108.5 19 98 23.5 87L47 30C50.5 22.5 54.5 17 60 17Z" fill="none" ${O}/>`
        },
        eyes: {lx: 50, rx: 70, y: 76, r: 5, style: "dot", color: "#2A2248"},
        mouth: {x: 60, y: 85, w: 3.2, color: "#2A2248"},
        cheeks: {lx: 41.5, rx: 78.5, y: 84, w: 4.6, h: 2.8, color: "#FFB0C4"},
        anchors: {top: [60, 21, 0.8], neck: [60, 94, 1.35], chest: [77, 96, 0.72], back: [84, 70, 0.9], hands: [60, 95, 0.9]},
        lines: {
          tap: ["Hello, climber! I'm so glad you're here!", "Steady and strong, just like you! Wow!", "Look how high you've climbed already!", "My snowy cap is sparkling just for you!", "You're showing up again! I love to see it!", "Rock solid effort today! Keep it up!", "The view from here? It's you, doing great!"],
          pet: ["Oh! A little snow just fell from joy!", "So gentle! My whole mountain is smiling!"],
          hello: ["Welcome back! The trail lit up when you came!", "Hello again! I've been waiting with a big view!"],
          morning: ["Good morning! Sunrise on the summit, just for you!", "Morning! Fresh snow and a fresh start! Let's go!"],
          night: ["The stars are settling on my peak. Rest now?", "Calm snow, quiet night. Sleep well, friend."],
          focus: ["Steady as a mountain. We've got this!", "Heads down, strong and calm. You're doing great."],
          done: ["What a climb! I'm so proud of you!", "Session done! You stood tall the whole way!"],
          task: ["WOW! Another one conquered!", "Yes! Checked off! Rock solid work!", "Avalanche of awesome! Another one done!", "Peak achieved! You're incredible!"],
          break: ["Break time! Stand tall and stretch!", "Let's take in the view! Deep breath, relax!"]
        }
      },
      {
        id: "alpine-edelweiss", name: "Edie", kind: "Edelweiss Sprite", pose: "float",
        bio: "A fuzzy mountain flower sprite who blooms high above the lake.",
        idle: ["wingFlutter", "spin", "sparkle"], cheer: "spin",
        parts: {
          wingL: {svg: `<path d="M46 72C36 72 26 78 22 88C31 91 41 86 47 78Z" fill="#7CBF82" ${O2}/><path d="M44 76Q35 80 27 87" fill="none" stroke="#4F9A62" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [47, 74]},
          wingR: {svg: `<path d="M74 72C84 72 94 78 98 88C89 91 79 86 73 78Z" fill="#7CBF82" ${O2}/><path d="M76 76Q85 80 93 87" fill="none" stroke="#4F9A62" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [73, 74]},
          body: `${RG("alpine-edelweiss-p", [[0, "#FFFFFF"], [0.6, "#F3F6F1"], [1, "#C3D4C6"]], 0.5, 0.5, 0.55)}
            <path d="M60 60C70.5 43.3 65.2 29 60 23C54.8 29 49.5 43.3 60 60ZM60 60C77.9 56.9 82.8 44.6 83.3 36.7C75.4 37.2 63.1 42.1 60 60ZM60 60C76.7 70.5 91 65.2 97 60C91 54.8 76.7 49.5 60 60ZM60 60C63.1 77.9 75.4 82.8 83.3 83.3C82.8 75.4 77.9 63.1 60 60ZM60 60C49.5 76.7 54.8 91 60 97C65.2 91 70.5 76.7 60 60ZM60 60C42.1 63.1 37.2 75.4 36.7 83.3C44.6 82.8 56.9 77.9 60 60ZM60 60C43.3 49.5 29 54.8 23 60C29 65.2 43.3 70.5 60 60ZM60 60C56.9 42.1 44.6 37.2 36.7 36.7C37.2 44.6 42.1 56.9 60 60Z" fill="url(#alpine-edelweiss-p)" ${O}/>
            ${RG("alpine-edelweiss-g", [[0, "#FFFBE6"], [0.6, "#FFEFB0"], [1, "#F4CF6A"]], 0.42, 0.38, 0.7)}
            <circle cx="60" cy="61" r="21" fill="url(#alpine-edelweiss-g)" ${O}/>
            <path d="M46 55Q48 47.5 55 44.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            <path d="M60 28V37M60 85V92M29 60H36M84 60H91" stroke="#C9D8CD" stroke-width="2" stroke-linecap="round"/>`
        },
        eyes: {lx: 51.5, rx: 68.5, y: 60, r: 4.6, style: "sparkle", color: "#2E3550"},
        mouth: {x: 60, y: 68.5, w: 2.8, color: "#2E3550"},
        cheeks: {lx: 44.5, rx: 75.5, y: 67, w: 4, h: 2.5, color: "#FF9FB0"},
        anchors: {top: [60, 41, 0.85], neck: [60, 81, 1], chest: [72, 74, 0.62], back: [84, 50, 0.8], hands: [60, 80, 0.85]},
        lines: {
          tap: ["Hello, sunshine! I'm blooming just for you!", "You make my petals sparkle! Hi hi!", "Look at you, growing every single day!", "Up here, everything shines, especially you!", "You're blooming beautifully today!", "Fresh mountain air and a fresh new page! Yay!", "I'm your biggest fan up on this mountain!"],
          pet: ["Ooh, my fuzzy petals are so happy! Thank you!", "Hehe! I'm blooming even brighter now!"],
          hello: ["You're back! My whole meadow is cheering!", "Hi hi! I saved you a sunny spot by the lake!"],
          morning: ["Good morning! The lake is sparkling! Let's go!", "Rise and bloom! Today's going to be lovely!"],
          night: ["My petals are closing up. Time to rest too?", "The lake is so calm tonight. Sleep well, friend."],
          focus: ["Quiet petals, bright mind. We've got this!", "Heads down, growing strong. You're doing great!"],
          done: ["What a session! You're in full bloom!", "You did it! I'm so proud I could twirl!"],
          task: ["YAY! Another one blossomed!", "Checked off! My petals are dancing!", "Woohoo! Done and blooming beautifully!", "Yes yes yes! You're amazing!"],
          break: ["Break time! Let's soak up some sunshine!", "Stretch toward the sky like a flower! Go!"]
        }
      }
    ]
  });
})();


