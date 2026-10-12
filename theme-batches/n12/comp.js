/* Study Companions, new theme ideas batch n12: wisteria, bluebells. Each theme has two young animals and one nature object with a face. */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const f1 = v => Math.round(v * 10) / 10;
  const shine = (x, y, rx, ry, a) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})" fill="#fff" opacity=".75"/>`;
  // a tiny wisteria floret cluster (for decorations)
  const florets = (x, y, s) => [[0, 0, 3.2, "#C8B4EC"], [-2.6, 3.4, 2.7, "#A486D8"], [2.6, 3.4, 2.7, "#B49AE2"], [0, 6.6, 2.2, "#8A66C6"], [0, 9.2, 1.5, "#6A48AE"]].map(([dx, dy, r, c]) => `<ellipse cx="${f1(x + dx * s)}" cy="${f1(y + dy * s)}" rx="${f1(r * s)}" ry="${f1(r * s * 0.8)}" fill="${c}" ${OW(1.2)}/>`).join("");
  const bellD = "M50 30C46 40 44 56 40 70C38 74 33 76 31 80C36 82 40 79 44 80C47 83 50 81 53 82C56 84 58 82 60 84C62 82 64 84 67 82C70 81 73 83 76 80C80 79 84 82 89 80C87 76 82 74 80 70C76 56 74 40 70 30C66 24 54 24 50 30Z";
  // a small hanging bluebell bell at (x,y) scaled by s
  const miniBell = (x, y, s, fill) => `<path d="M${f1(x - 3.4 * s)} ${y}C${f1(x - 4 * s)} ${f1(y + 4 * s)} ${f1(x - 4.4 * s)} ${f1(y + 7 * s)} ${f1(x - 6.4 * s)} ${f1(y + 9 * s)}C${f1(x - 3 * s)} ${f1(y + 10 * s)} ${f1(x - 1.4 * s)} ${f1(y + 9 * s)} ${x} ${f1(y + 10 * s)}C${f1(x + 1.4 * s)} ${f1(y + 9 * s)} ${f1(x + 3 * s)} ${f1(y + 10 * s)} ${f1(x + 6.4 * s)} ${f1(y + 9 * s)}C${f1(x + 4.4 * s)} ${f1(y + 7 * s)} ${f1(x + 4 * s)} ${f1(y + 4 * s)} ${f1(x + 3.4 * s)} ${y}C${f1(x + 2 * s)} ${f1(y - 1.4 * s)} ${f1(x - 2 * s)} ${f1(y - 1.4 * s)} ${f1(x - 3.4 * s)} ${y}Z" fill="${fill}" ${OW(1.6)}/>`;

  /* ================= Wisteria Walk ================= */
  COMP_DATA.push({
    theme: "wisteria",
    companions: [
      {
        id: "wisteria-wisty", name: "Wisty", kind: "Wisteria Raceme", pose: "float", wearColor: "#6C9A52",
        bio: "A drooping wisteria bloom who sways happily whenever a breeze goes by.",
        idle: ["sway", "topBob", "wave"], cheer: "spin",
        parts: {
          back: `${[[44, 30, 5.2], [76, 30, 5.2], [37, 41, 5.6], [83, 41, 5.6], [52, 25, 4.6], [68, 25, 4.6]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f1(r * 0.82)}" fill="#E2D6F8" ${OW(2)}/>`).join("")}`,
          body: `${RG("wisteria-wisty-b", [[0, "#F6F0FF"], [0.55, "#D8CAF4"], [1, "#A88ADA"]], 0.45, 0.36, 0.72)}
            <path d="M60 24C84 24 92 44 87 62C82 80 68 94 60 104C52 94 38 80 33 62C28 44 36 24 60 24Z" fill="url(#wisteria-wisty-b)" ${O}/>
            ${[[34, 54, 6.2, "#D2C2F2"], [36, 67, 6, "#BCA4EA"], [41, 79, 5.6, "#A88ADA"], [47, 89, 5, "#9472CA"], [53, 97, 4.2, "#7E5CBE"], [60, 104, 3.4, "#6A48AE"]].map(([x, y, r, c]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f1(r * 0.82)}" fill="${c}" ${OW(2)}/><ellipse cx="${120 - x}" cy="${y}" rx="${r}" ry="${f1(r * 0.82)}" fill="${c}" ${OW(2)}/>`).join("")}
            ${[[44, 88, 3.4], [76, 88, 3.4], [52, 95, 2.8], [68, 95, 2.8], [60, 98, 2.4]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f1(r * 0.8)}" fill="#8A66C6" ${OW(1.4)}/>`).join("")}
            ${[[42, 74, 3], [78, 74, 3], [48, 82, 2.8], [72, 82, 2.8], [56, 88, 2.6], [64, 88, 2.6]].map(([x, y, r]) => `<path d="M${x - r} ${y}q${r} ${-r * 1.2} ${r * 2} 0" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".75"/>`).join("")}
            ${shine(44, 38, 5, 2.4, -40)}<circle cx="78" cy="74" r="1.3" fill="#fff"/>`,
          armL: {svg: `<path d="M36 62C29 57 20 58 15 64C21 69 30 68 36 62Z" fill="#8CC060" ${O2}/><path d="M35 62.4Q26 63 17 64" fill="none" stroke="#5E8E3E" stroke-width="1.3" stroke-linecap="round"/>`, pivot: [36, 62]},
          armR: {svg: `<path d="M84 62C91 57 100 58 105 64C99 69 90 68 84 62Z" fill="#8CC060" ${O2}/><path d="M85 62.4Q94 63 103 64" fill="none" stroke="#5E8E3E" stroke-width="1.3" stroke-linecap="round"/>`, pivot: [84, 62]},
          top: {svg: `${LINE("M60 25C59 18 62 13 69 11", "#6C9A52", 2.6)}<path d="M61 19C55 11 46 11 41 15C47 21 55 21 61 19Z" fill="#9CCC6A" ${O2}/><path d="M66 13C70 6 78 5 83 8C79 14 72 15 66 13Z" fill="#8CC060" ${O2}/>`, pivot: [60, 25]}
        },
        eyes: {lx: 51, rx: 69, y: 54, r: 4.2, style: "sparkle", color: "#2E1E48"},
        mouth: {x: 60, y: 63, w: 3, color: "#2E1E48"},
        cheeks: {lx: 45, rx: 75, y: 61, w: 3.8, h: 2.3, color: "#FF9AC0"},
        anchors: {top: [60, 22, 0.8], neck: [60, 74, 0.7], chest: [70, 80, 0.55], back: [80, 50, 0.7], hands: [60, 84, 0.7]},
        lines: {
          tap: ["Hello! I'm hanging around just for you!", "One floret at a time, one task at a time.", "You're blooming beautifully today!", "Sway with it. You're doing great!", "A little breeze and a lot of focus!", "Petal power, activate!", "I'm so proud I could drop a petal!"],
          pet: ["Hehe, my florets are all fluttery!", "Ooh, that's like a warm spring breeze."],
          hello: ["You're here! The whole tunnel is swaying!", "Hi hi! I saved you a spot in the shade."],
          morning: ["Good morning! My top florets just opened.", "Morning! Fresh petals, fresh start!"],
          night: ["The moon makes me glow. Rest soon, okay?", "Petals closing up. Sleep well tonight!"],
          focus: ["Hanging quietly right beside you.", "Soft breeze, calm mind. You've got this."],
          done: ["What a session! I'm in full bloom!", "All done! The whole walk is cheering!"],
          task: ["Plip! Another petal for your crown!", "Done! That deserves a little sway!", "Checked off! Bloom, bloom, hooray!", "Yes! One more floret open!"],
          break: ["Break time! Stretch and sway a little.", "Rest your eyes under the blossoms."]
        }
      },
      {
        id: "wisteria-meji", name: "Meji", kind: "White-eye Chick", pose: "stand", wearColor: "#9A72D0",
        bio: "A tiny green songbird chick with white spectacles and a big appetite for nectar.",
        idle: ["headTilt", "wingFlutter", "topBob"], cheer: "hop",
        neck: [60, 72],
        parts: {
          feet: `${LINE("M14 108C38 103 82 103 106 108", "#8A6A52", 4)}<path d="M50 102v5M47 107l3-2.4 3 2.4M70 102v5M67 107l3-2.4 3 2.4" fill="none" stroke="#6A6A7A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>${florets(96, 108, 0.9)}`,
          body: `${RG("wisteria-meji-b", [[0, "#DCE892"], [0.6, "#B4CC5A"], [1, "#88A43C"]], 0.45, 0.3, 0.8)}
            <ellipse cx="60" cy="82" rx="27" ry="22" fill="url(#wisteria-meji-b)" ${O}/>
            <ellipse cx="60" cy="88" rx="17" ry="14" fill="#F6F2DE"/><path d="M45 73Q60 80 75 73Q73 80 60 82Q47 80 45 73Z" fill="#F2DC5A"/>
            <path d="M50 92q2 2 4 0M60 96q2 2 4 0M56 88q2 2 4 0" fill="none" stroke="#E2D8B0" stroke-width="1.4" stroke-linecap="round"/>`,
          wingL: {svg: `<path d="M36 72C26 78 25 93 33 100C40 97 43 86 41 74Z" fill="#7E9A3A" ${O2}/><path d="M33 84q3 2 6 1M32 91q3 2 6 0" fill="none" stroke="#5E7A2A" stroke-width="1.4" stroke-linecap="round"/>`, pivot: [39, 74]},
          wingR: {svg: `<path d="M84 72C94 78 95 93 87 100C80 97 77 86 79 74Z" fill="#7E9A3A" ${O2}/><path d="M87 84q-3 2 -6 1M88 91q-3 2 -6 0" fill="none" stroke="#5E7A2A" stroke-width="1.4" stroke-linecap="round"/>`, pivot: [81, 74]},
          head: `${RG("wisteria-meji-h", [[0, "#DAE88C"], [0.6, "#B2CA56"], [1, "#8AA63E"]], 0.42, 0.3, 0.8)}
            <circle cx="60" cy="50" r="25" fill="url(#wisteria-meji-h)" ${O}/>
            <path d="M46 64Q60 73 74 64Q71 73 60 74.5Q49 73 46 64Z" fill="#F2DC5A"/>
            ${shine(46, 36, 5, 2.4, -35)}`,
          face: `<circle cx="50" cy="50" r="7.2" fill="#fff" ${OW(1.6)}/><circle cx="70" cy="50" r="7.2" fill="#fff" ${OW(1.6)}/>
            <path d="M56.4 57.6L60 63.4L63.6 57.6Q60 56 56.4 57.6Z" fill="#5C5A6A" ${OW(1.4)}/>`,
          top: {svg: `<path d="M57 27C54 21 56 15 61 12C60 17 62 21 66 23C63 25 60 26 57 27Z" fill="#A4C050" ${O2}/>`, pivot: [60, 27]}
        },
        eyes: {lx: 50, rx: 70, y: 50, r: 3.8, style: "round", color: "#1E1A24"},
        mouth: {x: 60, y: 67, w: 2, color: "#1E1A24"},
        cheeks: {lx: 40, rx: 80, y: 60, w: 3.6, h: 2.2, color: "#FFA0A8"},
        anchors: {top: [60, 25, 0.85], neck: [60, 74, 0.9], chest: [70, 88, 0.6], back: [84, 80, 0.7], hands: [60, 92, 0.8]},
        lines: {
          tap: ["Tsee tsee! That means hello in bird!", "My spectacles say you're doing great!", "Small wings, big dreams. Just like you!", "I'll sing a little song for your focus.", "Chirp! You're on a roll today!", "One little hop at a time!", "I found the sweetest blossom. And you!"],
          pet: ["Eep! My feathers went all fluffy!", "Hehe, that's my favorite spot!"],
          hello: ["You're back! I fluttered here so fast!", "Hello hello! Let's sing through today!"],
          morning: ["Good morning! The nectar is fresh today!"],
          night: ["Tucking my head under my wing. Rest soon?"],
          focus: ["Perched quietly right beside you.", "No chirping. Just focus. You've got this."],
          done: ["What a session! Tsee tsee hooray!", "Done! You flew through that!"],
          task: ["Chirp! Another one done!", "Yes! That deserves a happy hop!", "Checked off! Wings up!", "Tweet! Look at you go!"],
          break: ["Break time! Stretch those wings!", "Sip some water like a little songbird."]
        }
      },
      {
        id: "wisteria-kero", name: "Kero", kind: "Pond Froglet", pose: "sit", wearColor: "#B49AE2",
        bio: "A little green froglet who naps on a lily pad beneath the arched bridge.",
        idle: ["headTilt", "wave", "topBob"], cheer: "bounce",
        neck: [60, 72],
        parts: {
          back: `${RG("wisteria-kero-p", [[0, "#9AD07A"], [1, "#5E9E4A"]], 0.5, 0.4, 0.7)}<path d="M14 104C14 96 36 92 60 92C84 92 106 96 106 104C106 110 84 113 60 113C36 113 14 110 14 104Z" fill="url(#wisteria-kero-p)" ${O}/>
            <path d="M60 103L100 100M60 103L22 99M60 103L36 110M60 103L86 110" fill="none" stroke="#4E8A3E" stroke-width="1.4" stroke-linecap="round" opacity=".6"/>${florets(96, 98, 0.8)}`,
          body: `<ellipse cx="33" cy="97" rx="12" ry="8" fill="#7CBF52" ${O}/><ellipse cx="87" cy="97" rx="12" ry="8" fill="#7CBF52" ${O}/>
            <path d="M22 103q3-3 6 0q3-3 6 0M86 103q3-3 6 0q3-3 6 0" fill="#7CBF52" ${OW(1.8)}/>
            ${RG("wisteria-kero-b", [[0, "#B8E07A"], [0.6, "#8ACB58"], [1, "#5EA03E"]], 0.45, 0.3, 0.8)}
            <path d="M33 98C29 81 39 67 60 67C81 67 91 81 87 98C85 104 35 104 33 98Z" fill="url(#wisteria-kero-b)" ${O}/>
            <ellipse cx="60" cy="90" rx="16" ry="10" fill="#EAF4C4"/>`,
          armL: {svg: `${LINE("M45 78C41 85 39 93 41 100", "#7CBF52", 4.6)}<ellipse cx="41" cy="101" rx="6" ry="3.4" fill="#8ACB58" ${OW(1.8)}/>`, pivot: [45, 78]},
          armR: {svg: `${LINE("M75 78C79 85 81 93 79 100", "#7CBF52", 4.6)}<ellipse cx="79" cy="101" rx="6" ry="3.4" fill="#8ACB58" ${OW(1.8)}/>`, pivot: [75, 78]},
          head: `${RG("wisteria-kero-h", [[0, "#BEE480"], [0.6, "#8ECC5C"], [1, "#62A442"]], 0.45, 0.3, 0.8)}
            <circle cx="45" cy="40" r="11" fill="url(#wisteria-kero-h)" ${O}/><circle cx="75" cy="40" r="11" fill="url(#wisteria-kero-h)" ${O}/>
            <path d="M29 57C29 44 41 38 60 38C79 38 91 44 91 57C91 70 78 76 60 76C42 76 29 70 29 57Z" fill="url(#wisteria-kero-h)" ${O}/>
            <path d="M34.4 45.4C37 50 41 51.4 45 51.4C49 51.4 53 50 55.6 45.4M64.4 45.4C67 50 71 51.4 75 51.4C79 51.4 83 50 85.6 45.4" fill="none" stroke="#8ECC5C" stroke-width="4"/>
            <circle cx="38" cy="64" r="1.8" fill="#5E9A3E"/><circle cx="84" cy="62" r="2.2" fill="#5E9A3E"/><circle cx="80" cy="68" r="1.4" fill="#5E9A3E"/>${shine(38, 34, 3.4, 1.8, -40)}`,
          face: `<circle cx="45" cy="40" r="7.6" fill="#fff"/><circle cx="75" cy="40" r="7.6" fill="#fff"/><circle cx="56.6" cy="56" r="1.1" fill="${INK}"/><circle cx="63.4" cy="56" r="1.1" fill="${INK}"/>`,
          top: {svg: florets(60, 31, 1), pivot: [60, 36]}
        },
        eyes: {lx: 45, rx: 75, y: 40.5, r: 4.6, style: "round", color: "#1E2A1A"},
        mouth: {x: 60, y: 62, w: 6, color: "#1E2A1A"},
        cheeks: {lx: 38, rx: 82, y: 56, w: 4, h: 2.4, color: "#FF9AA4"},
        anchors: {top: [60, 30, 0.85], neck: [60, 76, 1], chest: [72, 88, 0.6], back: [88, 76, 0.7], hands: [60, 92, 0.8]},
        lines: {
          tap: ["Ribbit! That's froggy for you rock!", "Leap into it! I believe in you!", "My lily pad is your cheering section.", "Hop, hop, hooray for your hard work!", "Still pond, clear mind. You've got this.", "A petal landed on me. Lucky day!", "You're un-frog-gettable, you know!"],
          pet: ["Hehe! I'm a little bit squishy!", "Ribbit ribbit! Do that again!"],
          hello: ["You're here! I hopped all the way over!", "Hello! The pond missed you!"],
          morning: ["Good morning! The water is so still today."],
          night: ["The moon is in the pond. Time to rest!"],
          focus: ["Sitting still as a stone on my pad.", "Quiet pond. Deep focus. Go for it!"],
          done: ["What a session! Big happy ribbit!", "Done! You leaped right through it!"],
          task: ["Ribbit! Another one done!", "Splash! That's checked off!", "Hop! Look at you go!", "Yes! A leap in the right direction!"],
          break: ["Break time! Float for a minute.", "Stretch those legs. Froggy style!"]
        }
      }
    ]
  });

  /* ================= Bluebell Wood ================= */
  COMP_DATA.push({
    theme: "bluebells",
    companions: [
      {
        id: "bluebells-bluebelle", name: "Bluebelle", kind: "Bluebell", pose: "stand", wearColor: "#86C04A",
        bio: "A nodding bluebell who rings a tiny silent chime for every task you finish.",
        idle: ["headTilt", "sway", "wave"], cheer: "hop",
        neck: [60, 28],
        parts: {
          back: `${LINE("M64 108C68 82 84 52 81 28C79 14 63 13 60 28", "#5E9A4A", 3)}
            ${LINE("M81 32Q86 34 87 39", "#5E9A4A", 1.8)}${miniBell(88, 40, 1.2, "#7470D8")}${LINE("M82 52Q88 53 90 58", "#5E9A4A", 1.6)}${miniBell(91, 59, 0.95, "#8A84E2")}`,
          body: `${LG("bluebells-bluebelle-l", [[0, "#6AAE52"], [1, "#3E7A34"]])}
            <path d="M60 110C52 98 44 86 46 74C52 84 58 96 62 110Z" fill="url(#bluebells-bluebelle-l)" ${O2}/><path d="M60 110C68 98 78 88 80 78C72 86 64 98 58 110Z" fill="url(#bluebells-bluebelle-l)" ${O2}/>
            <path d="M40 110C46 106 74 106 80 110" fill="#7A5A42" ${O2}/><circle cx="48" cy="108" r="1.4" fill="#5A4030"/><circle cx="72" cy="108.4" r="1.2" fill="#5A4030"/>`,
          armL: {svg: `<path d="M56 104C46 96 34 90 22 92C30 98 42 104 54 108Z" fill="#5EA04A" ${O2}/><path d="M54 105Q40 97 25 93" fill="none" stroke="#8ACB68" stroke-width="1.2" stroke-linecap="round"/>`, pivot: [56, 104]},
          armR: {svg: `<path d="M64 104C74 96 86 90 98 92C90 98 78 104 66 108Z" fill="#5EA04A" ${O2}/><path d="M66 105Q80 97 95 93" fill="none" stroke="#8ACB68" stroke-width="1.2" stroke-linecap="round"/>`, pivot: [64, 104]},
          head: `${LG("bluebells-bluebelle-h", [[0, "#9A9AF0"], [0.55, "#6E6ADC"], [1, "#4E48BE"]])}
            <path d="${bellD}" fill="url(#bluebells-bluebelle-h)" ${O}/>
            <path d="M44 80C47 83 50 81 53 82C56 84 58 82 60 84C62 82 64 84 67 82C70 81 73 83 76 80Q60 76 44 80Z" fill="#3A348E"/>
            <path d="M53 33C50 46 48 60 45 72M67 33C70 46 72 60 75 72" fill="none" stroke="#B4B4F8" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
            <circle cx="55" cy="84.4" r="1.6" fill="#F6E8A8" ${OW(1)}/><circle cx="60" cy="86" r="1.6" fill="#F6E8A8" ${OW(1)}/><circle cx="65" cy="84.4" r="1.6" fill="#F6E8A8" ${OW(1)}/>
            ${shine(53, 38, 2.4, 5, 12)}`
        },
        eyes: {lx: 52.5, rx: 67.5, y: 53, r: 3.8, style: "sparkle", color: "#1E1A44"},
        mouth: {x: 60, y: 62, w: 2.6, color: "#1E1A44"},
        cheeks: {lx: 47, rx: 73, y: 59, w: 3.2, h: 2, color: "#F49AD0"},
        anchors: {top: [60, 27, 0.75], neck: [62, 92, 0.6], chest: [64, 98, 0.5], back: [80, 60, 0.7], hands: [60, 100, 0.7]},
        lines: {
          tap: ["Ding! That's my quiet little hello!", "Nodding along to your great work!", "A whole wood of bells is cheering you!", "Ring ring! Time to shine!", "You make my petals curl with joy!", "Every bell starts as a tiny bud.", "Blue skies under the beech leaves!"],
          pet: ["Hehe! I'm ringing, can you hear it?", "Ooh, that makes me nod all over!"],
          hello: ["You're here! The carpet just turned bluer!", "Hello! I rang a tiny bell for you."],
          morning: ["Good morning! The dew makes me sparkle."],
          night: ["Blue hour is my favorite. Rest soon?"],
          focus: ["Nodding quietly right beside you.", "Soft and still. Keep going, you're great."],
          done: ["What a session! Ding ding ding!", "Done! The whole wood is ringing!"],
          task: ["Ding! Another one done!", "Ring ring! Checked off!", "Yes! One more bell for you!", "Chime! Look at you go!"],
          break: ["Break time! Breathe in the spring air.", "Rest a bit, like a sleepy bud."]
        }
      },
      {
        id: "bluebells-brocky", name: "Brocky", kind: "Badger Cub", pose: "sit", wearColor: "#5A58C4",
        bio: "A striped little badger cub who digs cozy dens and cozier study corners.",
        idle: ["earTwitch", "headTilt", "wave"], cheer: "bounce",
        neck: [60, 72],
        parts: {
          feet: `<ellipse cx="47" cy="107" rx="9" ry="5" fill="#3A3438" ${O}/><ellipse cx="73" cy="107" rx="9" ry="5" fill="#3A3438" ${O}/><path d="M42 110v-2.4M46 110.6v-2.4M74 110.6v-2.4M78 110v-2.4" stroke="#C8C4CC" stroke-width="1.4" stroke-linecap="round"/>`,
          body: `${RG("bluebells-brocky-b", [[0, "#D4D2D8"], [0.6, "#B0ACB6"], [1, "#86828E"]], 0.45, 0.3, 0.8)}
            <path d="M30 106C26 88 36 72 60 70C84 72 94 88 90 106Z" fill="url(#bluebells-brocky-b)" ${O}/>
            <path d="M46 82C50 76 70 76 74 82C76 92 72 102 60 105C48 102 44 92 46 82Z" fill="#4A4448"/><path d="M38 90l3 2M82 90l-3 2M36 98l3 1.4M84 98l-3 1.4" stroke="#7A7682" stroke-width="1.6" stroke-linecap="round"/>`,
          armL: {svg: `<path d="M39 81C33 87 31 97 35 103C39 105 43 102 43 97C43 91 45 87 47 84Z" fill="#3E383C" ${O}/>`, pivot: [43, 82]},
          armR: {svg: `<path d="M81 81C87 87 89 97 85 103C81 105 77 102 77 97C77 91 75 87 73 84Z" fill="#3E383C" ${O}/>`, pivot: [77, 82]},
          earL: {svg: `<circle cx="37" cy="31" r="7" fill="#3E383C" ${O}/><path d="M32 29a5.6 5.6 0 0 1 9 -3" fill="none" stroke="#F2F0EE" stroke-width="2.2" stroke-linecap="round"/>`, pivot: [40, 36]},
          earR: {svg: `<circle cx="83" cy="31" r="7" fill="#3E383C" ${O}/><path d="M88 29a5.6 5.6 0 0 0 -9 -3" fill="none" stroke="#F2F0EE" stroke-width="2.2" stroke-linecap="round"/>`, pivot: [80, 36]},
          head: `<path d="M31 50C31 34 44 26 60 26C76 26 89 34 89 50C89 66 76 74 60 74C44 74 31 66 31 50Z" fill="#F6F4F2"/>
            <path d="M31 50C31 40 35 33 40 30C37 41 37 55 41 67C35 63 31 57 31 50Z" fill="#B4B0B8"/><path d="M89 50C89 40 85 33 80 30C83 41 83 55 79 67C85 63 89 57 89 50Z" fill="#B4B0B8"/>
            <path d="M45 28C49 38 52 52 54 64C49 66 45 64 43 60C40 50 40 37 45 28Z" fill="#2E2A2E"/><path d="M75 28C71 38 68 52 66 64C71 66 75 64 77 60C80 50 80 37 75 28Z" fill="#2E2A2E"/>
            <path d="M31 50C31 34 44 26 60 26C76 26 89 34 89 50C89 66 76 74 60 74C44 74 31 66 31 50Z" fill="none" ${O}/>`,
          face: `<circle cx="49" cy="50" r="5.6" fill="#5E585E"/><circle cx="71" cy="50" r="5.6" fill="#5E585E"/><ellipse cx="60" cy="62" rx="4.6" ry="3.2" fill="${INK}"/><ellipse cx="58.6" cy="61" rx="1.4" ry=".8" fill="#fff" opacity=".7"/>`
        },
        eyes: {lx: 49, rx: 71, y: 50, r: 3.8, style: "sparkle", color: "#141014"},
        mouth: {x: 60, y: 67.4, w: 2.6, color: "#2B2233"},
        cheeks: {lx: 40, rx: 80, y: 61, w: 3.8, h: 2.2, color: "#FF9AA8"},
        anchors: {top: [60, 26, 0.9], neck: [60, 76, 1], chest: [72, 90, 0.6], back: [86, 80, 0.75], hands: [60, 94, 0.8]},
        lines: {
          tap: ["Hi! I dug a tunnel just to say hello!", "Stripes up! You're doing great!", "Dig deep. You've got this!", "Snuffle snuffle. I smell success!", "Cozy den, clear head, big progress!", "Small paws can move a lot of dirt!", "I found a bluebell for you!"],
          pet: ["Hehe! My fur's all fluffed up now!", "Mmm, that's the perfect scratch."],
          hello: ["You're back! I tidied the den for you!", "Hello! Let's dig into today together."],
          morning: ["Morning! I'm usually asleep, but for you..."],
          night: ["Night time! That's when badgers wake up!"],
          focus: ["Curled up quietly right here with you.", "Head down, paws busy. Let's focus!"],
          done: ["What a session! Happy badger wiggle!", "Done! You dug right through that!"],
          task: ["Dig! Another one done!", "Snuffle! That's checked off!", "Yes! Paws up for you!", "Done! Rock solid digging!"],
          break: ["Break time! Have a little snack.", "Stretch out like a sleepy badger."]
        }
      },
      {
        id: "bluebells-dapple", name: "Dapple", kind: "Roe Deer Fawn", pose: "stand", wearColor: "#7A78DE",
        bio: "A spotted fawn who tiptoes through the bluebells without bending a single one.",
        idle: ["earTwitch", "headTilt", "tailSwish"], cheer: "hop",
        neck: [60, 70],
        parts: {
          feet: `${LINE("M44 88V106", "#A8683A", 4.4)}${LINE("M76 88V106", "#A8683A", 4.4)}${LINE("M52 92V108", "#B8743E", 4.6)}${LINE("M68 92V108", "#B8743E", 4.6)}
            <path d="M41.6 104h4.8l.6 3.4h-6Z" fill="#3A2A22" ${OW(1.6)}/><path d="M73.6 104h4.8l.6 3.4h-6Z" fill="#3A2A22" ${OW(1.6)}/><path d="M49.4 106h5.2l.6 4h-6.4Z" fill="#3A2A22" ${OW(1.6)}/><path d="M65.4 106h5.2l.6 4h-6.4Z" fill="#3A2A22" ${OW(1.6)}/>`,
          tail: {svg: `<ellipse cx="86" cy="76" rx="5" ry="6.4" transform="rotate(20 86 76)" fill="#F6EEE2" ${O2}/>`, pivot: [83, 79]},
          body: `${RG("bluebells-dapple-b", [[0, "#E8A86C"], [0.6, "#C8814A"], [1, "#9A5A2E"]], 0.45, 0.3, 0.8)}
            <ellipse cx="60" cy="83" rx="25" ry="15" fill="url(#bluebells-dapple-b)" ${O}/>
            <path d="M51 73Q60 69 69 73L66 94Q60 96 54 94Z" fill="#F4E6D0"/>
            ${[[40, 80, 1.8], [44, 87, 1.5], [78, 79, 1.8], [80, 87, 1.5], [74, 84, 1.3], [46, 76, 1.3]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#FBF2E4"/>`).join("")}`,
          earL: {svg: `<path d="M41 40C30 32 21 33 16 39C22 46 33 46 41 43Z" fill="#C8814A" ${O}/><path d="M38 41C30 36 24 37 21 39.6C26 43 32 43.4 38 42.4Z" fill="#F2C0B0"/>`, pivot: [41, 41]},
          earR: {svg: `<path d="M79 40C90 32 99 33 104 39C98 46 87 46 79 43Z" fill="#C8814A" ${O}/><path d="M82 41C90 36 96 37 99 39.6C94 43 88 43.4 82 42.4Z" fill="#F2C0B0"/>`, pivot: [79, 41]},
          head: `${RG("bluebells-dapple-h", [[0, "#ECAE72"], [0.6, "#CC864C"], [1, "#A2602F"]], 0.45, 0.3, 0.8)}
            <path d="M38 48C38 34 48 27 60 27C72 27 82 34 82 48C82 61 73 70 60 72C47 70 38 61 38 48Z" fill="url(#bluebells-dapple-h)" ${O}/>
            <path d="M54 30Q60 27 66 30" fill="none" stroke="#E8B07A" stroke-width="2" stroke-linecap="round"/>${shine(47, 36, 4, 2, -35)}`,
          face: `<ellipse cx="60" cy="61" rx="11" ry="8.4" fill="#F4E6D0"/><ellipse cx="60" cy="57.4" rx="4" ry="2.8" fill="${INK}"/><ellipse cx="58.8" cy="56.6" rx="1.2" ry=".7" fill="#fff" opacity=".7"/>`
        },
        eyes: {lx: 50, rx: 70, y: 47, r: 4.4, style: "sparkle", color: "#1E140E"},
        mouth: {x: 60, y: 64.6, w: 2.4, color: "#2B1A10"},
        cheeks: {lx: 44, rx: 76, y: 55, w: 3.6, h: 2.2, color: "#FF9A9A"},
        anchors: {top: [60, 28, 0.85], neck: [60, 72, 0.85], chest: [66, 86, 0.6], back: [76, 74, 0.7], hands: [60, 90, 0.75]},
        lines: {
          tap: ["Hi! I tiptoed over so I wouldn't bump you!", "Wobbly legs, steady heart. You've got this!", "My spots say you're doing great!", "Every step counts, even small ones!", "Ears up! I'm listening and cheering!", "The bluebells told me you're amazing.", "Bounce, bounce! Let's keep going!"],
          pet: ["Hehe! My ears went all twitchy!", "Aww, that's so soft and gentle."],
          hello: ["You're here! I pranced all the way!", "Hello! The wood is so pretty today."],
          morning: ["Good morning! The dew is on every bell."],
          night: ["The mist is rolling in. Time to rest!"],
          focus: ["Standing still and quiet beside you.", "Soft steps, steady focus. Go for it!"],
          done: ["What a session! Happy fawn bounce!", "Done! You leaped right over that!"],
          task: ["Boing! Another one done!", "Yes! That's checked off!", "Hop! Look at you go!", "Done! A spring in your step!"],
          break: ["Break time! Stretch those legs!", "Rest a bit in the dappled light."]
        }
      }
    ]
  });
})();
