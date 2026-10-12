/* Study Companions, new theme ideas batch n15: fjord, storm. Each theme has two baby animals and one nature-object character. */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const f1 = v => Math.round(v * 10) / 10;
  const twinkle = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${c || "#fff"}"/>`;
  const shine = (x, y, rx, ry, a) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})" fill="#fff" opacity=".75"/>`;
  const whisk = (x, y, s) => `<path d="M${x} ${y}l${-11 * s} -2.4M${x} ${y + 2.4}l${-11 * s} 1.4M${x} ${y + 4.6}l${-10 * s} 4.4" fill="none" stroke="#5A5560" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>`;

  /* ================= Fjord ================= */
  COMP_DATA.push({
    theme: "fjord",
    companions: [
      {
        id: "fjord-selma", name: "Selma", kind: "Harbor Seal Pup", pose: "sit", wearColor: "#D8573E",
        bio: "A round little seal pup who sunbathes on the fjord rocks between dips.",
        idle: ["headTilt", "wave", "tailSwish"], cheer: "bounce",
        neck: [60, 74],
        parts: {
          back: `${LG("fjord-selma-r", [[0, "#A8ACB0"], [1, "#74787E"]])}<path d="M20 112C20 102 30 97 42 97H80C92 97 101 102 101 112Z" fill="url(#fjord-selma-r)" ${O}/><path d="M30 104q6-3 12-1M70 102q8-3 15 0" fill="none" stroke="#C8CCD0" stroke-width="2" stroke-linecap="round"/><path d="M12 112q5-3 10 0M98 112q5-3 10 0" fill="none" stroke="#8ACCE6" stroke-width="2.4" stroke-linecap="round"/>`,
          tail: {svg: `<path d="M80 99C88 97 96 92 101 86C103 91 103 95 99 98C103 98 106 101 105 104C98 106 88 105 80 103Z" fill="#8E98A4" ${O2}/><path d="M92 100l8-3" stroke="#6E7884" stroke-width="1.4" stroke-linecap="round"/>`, pivot: [82, 101]},
          body: `${RG("fjord-selma-b", [[0, "#D4DAE0"], [0.6, "#A8B2BC"], [1, "#86909C"]], 0.4, 0.3, 0.8)}
            <path d="M34 98C32 84 40 70 60 70C80 70 88 84 86 98C85 104 78 106 60 106C42 106 35 104 34 98Z" fill="url(#fjord-selma-b)" ${O}/>
            <path d="M46 98C46 88 52 82 60 82C68 82 74 88 74 98C72 102 48 102 46 98Z" fill="#E8EDF2"/>
            <g fill="#7A8592" opacity=".7"><circle cx="42" cy="86" r="1.8"/><circle cx="79" cy="88" r="1.6"/><circle cx="76" cy="80" r="1.2"/><circle cx="40" cy="95" r="1.3"/></g>`,
          armL: {svg: `<path d="M41 84C34 88 30 94 31 99C34 101 39 98 44 92Z" fill="#949EAA" ${O2}/><path d="M33 97l3-1.6M34.6 99l2.4-2" stroke="#6E7884" stroke-width="1.1" stroke-linecap="round"/>`, pivot: [42, 86]},
          armR: {svg: `<path d="M79 84C86 88 90 94 89 99C86 101 81 98 76 92Z" fill="#949EAA" ${O2}/><path d="M87 97l-3-1.6M85.4 99l-2.4-2" stroke="#6E7884" stroke-width="1.1" stroke-linecap="round"/>`, pivot: [78, 86]},
          head: `${RG("fjord-selma-h", [[0, "#DCE2E8"], [0.6, "#AEB8C2"], [1, "#8A94A0"]], 0.38, 0.28, 0.8)}
            <path d="M37 54C37 40 47 31 60 31C73 31 83 40 83 54C83 67 73 76 60 76C47 76 37 67 37 54Z" fill="url(#fjord-selma-h)" ${O}/>
            <g fill="#7E8996" opacity=".65"><circle cx="46" cy="40" r="1.6"/><circle cx="73" cy="38" r="1.3"/><circle cx="78" cy="47" r="1.1"/><circle cx="51" cy="35" r="1"/></g>
            ${shine(48, 40, 5, 2.4, -35)}`,
          face: `<ellipse cx="60" cy="63" rx="11" ry="7.6" fill="#EEF2F5" ${OW(1.6)}/><path d="M56.6 59.4C56.6 57.6 63.4 57.6 63.4 59.4C63.4 61.4 61.4 62.6 60 62.6C58.6 62.6 56.6 61.4 56.6 59.4Z" fill="#3A3038"/>
            <g fill="#9AA4AE"><circle cx="54" cy="64.4" r=".8"/><circle cx="52" cy="62.6" r=".8"/><circle cx="66" cy="64.4" r=".8"/><circle cx="68" cy="62.6" r=".8"/></g>${whisk(51, 62, 1)}${whisk(69, 62, -1)}`
        },
        eyes: {lx: 50, rx: 70, y: 51, r: 5.6, style: "sparkle", color: "#1E1A24"},
        mouth: {x: 60, y: 66.4, w: 2.4, color: "#3A3038"},
        cheeks: {lx: 45, rx: 75, y: 60, w: 3.6, h: 2.2, color: "#FFA0B0"},
        anchors: {top: [60, 32, 0.9], neck: [60, 75, 0.95], chest: [70, 90, 0.6], back: [80, 82, 0.7], hands: [60, 94, 0.85]},
        lines: {
          tap: ["Hi! I just bobbed up to say hello!", "Flipper five! You're doing great!", "Slow and steady, like a seal on a sunny rock.", "Big eyes, big focus. Let's go!", "The fjord is calm, and so are we.", "You swim through this list like a pro!", "A little splash of cheer for you!"],
          pet: ["Hehe, that's my favourite spot!", "Ooh, warm as a sunny rock."],
          hello: ["You're here! I flopped right over!", "Hello! The water's lovely today."],
          morning: ["Good morning! Time for a sunny rock and a plan."],
          night: ["The twilight's so pretty. Rest soon, okay?"],
          focus: ["Floating quietly right beside you.", "Calm water, clear mind. Keep going."],
          done: ["What a session! Happy flipper flaps!", "Done! Time for a little sunbathe."],
          task: ["Splash! Another one done!", "Checked off! Flipper clap!", "Yes! Smooth swimming!", "Done! You're on a roll!"],
          break: ["Break! Stretch out like a seal on a rock."]
        }
      },
      {
        id: "fjord-tova", name: "Tova", kind: "Norway Lemming", pose: "sit", wearColor: "#3E8AC8",
        bio: "A round little lemming in a black cap and golden coat, bold as a mountain.",
        idle: ["earTwitch", "headTilt", "tailSwish"], cheer: "hop",
        neck: [60, 74],
        parts: {
          back: `<path d="M28 112C30 104 38 101 46 102C52 98 66 98 72 102C82 101 90 105 92 112Z" fill="#7CB858" ${O2}/><path d="M36 108q4-3 8-1M74 107q4-3 9-1" fill="none" stroke="#A8DA82" stroke-width="1.6" stroke-linecap="round"/>`,
          tail: {svg: `<ellipse cx="82" cy="102" rx="6" ry="3.6" transform="rotate(-20 82 102)" fill="#C89050" ${O2}/>`, pivot: [77, 102]},
          feet: `<ellipse cx="49" cy="108" rx="7.4" ry="3.8" fill="#E8B898" ${O}/><ellipse cx="71" cy="108" rx="7.4" ry="3.8" fill="#E8B898" ${O}/><path d="M46 109v1.6M49 109.4v1.6M52 109v1.6M68 109v1.6M71 109.4v1.6M74 109v1.6" stroke="#B88870" stroke-width="1.2" stroke-linecap="round"/>`,
          body: `${RG("fjord-tova-b", [[0, "#E8BC74"], [0.6, "#C8944C"], [1, "#A0703A"]], 0.4, 0.3, 0.8)}
            <path d="M36 98C34 84 44 72 60 72C76 72 86 84 84 98C83 106 74 109 60 109C46 109 37 106 36 98Z" fill="url(#fjord-tova-b)" ${O}/>
            <path d="M48 100C47 90 52 84 60 84C68 84 73 90 72 100C70 105 50 105 48 100Z" fill="#F6E2B4"/>
            <path d="M44 80C50 75 56 74 60 74C64 74 70 75 76 80C70 79 64 80 60 82C56 80 50 79 44 80Z" fill="#3A2E2A"/>
            <path d="M40 92q3-4 7-5M73 87q4 1 7 5" fill="none" stroke="#F0CC88" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>`,
          earL: {svg: `<ellipse cx="42" cy="40" rx="7" ry="6.4" fill="#C8944C" ${O2}/><ellipse cx="42.4" cy="40.6" rx="3.8" ry="3.4" fill="#F2B2AE"/>`, pivot: [46, 44]},
          earR: {svg: `<ellipse cx="78" cy="40" rx="7" ry="6.4" fill="#C8944C" ${O2}/><ellipse cx="77.6" cy="40.6" rx="3.8" ry="3.4" fill="#F2B2AE"/>`, pivot: [74, 44]},
          head: `${RG("fjord-tova-h", [[0, "#ECC07A"], [0.6, "#CC9850"], [1, "#A8743C"]], 0.4, 0.45, 0.8)}
            <path d="M38 56C38 43 47 35 60 35C73 35 82 43 82 56C82 68 73 76 60 76C47 76 38 68 38 56Z" fill="url(#fjord-tova-h)" ${O}/>
            <path d="M40 50C42 40 50 36 60 36C70 36 78 40 80 50C76 46 70 46 66 48C64 46 62 46 60 47C58 46 56 46 54 48C50 46 44 46 40 50Z" fill="#3A2E2A"/>
            ${shine(50, 40, 4.4, 2, -25)}`,
          face: `<ellipse cx="60" cy="66" rx="10" ry="7" fill="#F8E6C2" ${OW(1.6)}/><path d="M57.4 62.6C57.4 61.2 62.6 61.2 62.6 62.6C62.6 64 61.2 65 60 65C58.8 65 57.4 64 57.4 62.6Z" fill="#E87A8A" ${OW(1.1)}/>
            <path d="M52 64l-9-1.6M52 66l-9 1.6M68 64l9-1.6M68 66l9 1.6" stroke="#6A5450" stroke-width="1.1" stroke-linecap="round" opacity=".7"/>`
        },
        eyes: {lx: 50, rx: 70, y: 55, r: 4.4, style: "sparkle", color: "#1E1614"},
        mouth: {x: 60, y: 68.6, w: 2.2, color: "#3A2A26"},
        cheeks: {lx: 45, rx: 75, y: 62, w: 3.4, h: 2, color: "#FF9AA4"},
        anchors: {top: [60, 36, 0.85], neck: [60, 76, 0.9], chest: [68, 94, 0.6], back: [80, 86, 0.7], hands: [60, 96, 0.8]},
        lines: {
          tap: ["Hi! I scurried all the way down the mountain!", "Small but brave. Just like you!", "Nibble by nibble, the whole list gets done.", "Squeak! That's lemming for you're awesome.", "Tiny paws, big plans. Let's go!", "Bold as a mountain, round as a berry!", "I'll guard your snacks while you study."],
          pet: ["Hehe, my fur is all fluffed up!", "Ooh, right on my black cap!"],
          hello: ["You're back! Happy squeaks!", "Hi! I dug you a cozy seat in the moss."],
          morning: ["Good morning! The fjord is sparkly today."],
          night: ["The sky's all pink and pale. Rest soon?"],
          focus: ["Curled up in the moss, keeping you company.", "Quiet paws. You've got this."],
          done: ["What a session! Happy little hops!", "Done! You brave, clever thing!"],
          task: ["Squeak! Another one done!", "Checked off! Paw five!", "Yes! Nibbled right through it!", "Done! Ears up, hooray!"],
          break: ["Break! Have a big stretch and a snack."]
        }
      },
      {
        id: "fjord-bluebell", name: "Harriet", kind: "Harebell", pose: "stand", wearColor: "#E0603A",
        bio: "A nodding harebell from the cliff ledges who chimes softly when you do well.",
        idle: ["headTilt", "sway", "wave"], cheer: "spin",
        neck: [60, 27],
        parts: {
          back: `<path d="M34 112C36 105 44 102 52 103C58 98 70 99 74 104C82 103 88 107 88 112Z" fill="#7CB858" ${O2}/><path d="M42 108q4-3 8-1M66 107q4-3 9-1" fill="none" stroke="#A8DA82" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="82" cy="109" rx="5" ry="3.2" fill="#B4B2AC" ${OW(1.6)}/>`,
          body: `${LINE("M62 108C64 92 72 70 74 50C76 34 70 24 60 22", "#6EAE4C", 2.8)}
            <path d="M66 98q4-4 2-10" fill="none" stroke="#5A9A3C" stroke-width="1.4" stroke-linecap="round"/>`,
          armL: {svg: `<path d="M64 92C56 90 46 86 39 78C42 77 46 78 49 80C47 76 47 73 48 71C54 76 60 84 64 89Z" fill="#7CBC58" ${O2}/><path d="M63 90Q54 85 46 77" fill="none" stroke="#5A9A3C" stroke-width="1.2" stroke-linecap="round"/>`, pivot: [64, 90]},
          armR: {svg: `<path d="M68 84C76 84 85 80 91 72C88 71 85 72 82 74C84 70 84 67 83 65C77 70 72 77 68 81Z" fill="#7CBC58" ${O2}/><path d="M69 83Q77 79 84 71" fill="none" stroke="#5A9A3C" stroke-width="1.2" stroke-linecap="round"/>`, pivot: [68, 83]},
          head: `${RG("fjord-bluebell-h", [[0, "#C8D0FF"], [0.55, "#8C9AF0"], [1, "#5E6CD0"]], 0.4, 0.3, 0.8)}
            <path d="M58 27C58 25 62 25 62 27V30C74 31 82 40 82 54C82 63 85 69 90 74C84 77 79 74 76 77C72 74 66 77 60 75C54 77 48 74 44 77C41 74 36 77 30 74C35 69 38 63 38 54C38 40 46 31 58 30Z" fill="url(#fjord-bluebell-h)" ${O}/>
            <path d="M44 77C46 72 52 70 60 70C68 70 74 72 76 77C72 74 66 77 60 75C54 77 48 74 44 77Z" fill="#4A56B8"/>
            <path d="M50 36Q46 46 47 58M70 36Q74 46 73 58" fill="none" stroke="#B8C2FF" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
            <path d="M55 29q5-4 10 0" fill="none" stroke="#5A9A3C" stroke-width="2.4" stroke-linecap="round"/>
            ${shine(47, 40, 3, 5.4, 15)}`,
          top: {svg: `<path d="M58 22C54 16 56 10 62 9C66 9 67 13 64 15" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M58 22C54 16 56 10 62 9C66 9 67 13 64 15" fill="none" stroke="#7CBC58" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="65.5" cy="16" rx="2.6" ry="3.4" fill="#A0AAF4" ${OW(1.4)}/>`, pivot: [59, 24]}
        },
        eyes: {lx: 52, rx: 68, y: 53, r: 3.8, style: "sparkle", color: "#1E2048"},
        mouth: {x: 60, y: 60, w: 2.4, color: "#1E2048"},
        cheeks: {lx: 46, rx: 74, y: 58, w: 3.2, h: 2, color: "#F49AC8"},
        anchors: {top: [60, 30, 0.75], neck: [60, 70, 0.75], chest: [70, 84, 0.5], back: [74, 64, 0.6], hands: [60, 92, 0.7]},
        lines: {
          tap: ["Ding! Hello there!", "I grow on cliff ledges. You can do hard things too!", "A gentle nod for your hard work.", "Bloom where you're planted, friend!", "Chime, chime! That's my happy sound.", "Small and steady, every single day.", "You make my petals sparkle!"],
          pet: ["Hehe, I'm ringing with joy!", "Ooh, a soft little breeze!"],
          hello: ["You're here! Ding ding ding!", "Hello! I nodded the moment I saw you."],
          morning: ["Good morning! The dew is on my petals."],
          night: ["My bell is closing for the night. Rest soon."],
          focus: ["Swaying quietly beside you.", "Soft breeze, steady mind. Keep going."],
          done: ["What a session! I'm chiming!", "Done! That deserves a big ding!"],
          task: ["Ding! Another one done!", "Checked off! Chime, chime!", "Yes! That rang true!", "Done! A happy little nod!"],
          break: ["Break! Sway a little and breathe."]
        }
      }
    ]
  });

  /* ================= Storm Prairie ================= */
  COMP_DATA.push({
    theme: "storm",
    companions: [
      {
        id: "storm-sprig", name: "Sprig", kind: "Pronghorn Fawn", pose: "stand", wearColor: "#3E8AC8",
        bio: "A speedy pronghorn fawn with big ears who races the wind across the wheat.",
        idle: ["earTwitch", "tailSwish", "headTilt"], cheer: "hop",
        neck: [60, 72],
        parts: {
          tail: {svg: `<path d="M84 80C90 78 94 82 92 87C90 90 86 89 84 86Z" fill="#FFFFFF" ${O2}/>`, pivot: [84, 82]},
          feet: `${["M45 90V108", "M53 92V109", "M67 92V109", "M75 90V108"].map(d => `<path d="${d}" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="${d}" stroke="#D8A060" stroke-width="4.6" stroke-linecap="round"/>`).join("")}<g fill="#2E2222"><rect x="41.6" y="105.4" width="6.8" height="4.6" rx="1.8"/><rect x="49.6" y="106.4" width="6.8" height="4.6" rx="1.8"/><rect x="63.6" y="106.4" width="6.8" height="4.6" rx="1.8"/><rect x="71.6" y="105.4" width="6.8" height="4.6" rx="1.8"/></g>`,
          body: `${RG("storm-sprig-b", [[0, "#F0BE84"], [0.6, "#D8995A"], [1, "#B87A40"]], 0.4, 0.3, 0.8)}
            <path d="M34 84C33 74 42 68 54 68C64 68 74 67 82 70C89 73 91 81 88 88C85 95 74 96 60 96C46 96 35 94 34 84Z" fill="url(#storm-sprig-b)" ${O}/>
            <path d="M40 90C46 92 54 93 62 93C72 93 80 92 86 88C84 94 74 96 60 96C48 96 42 94 40 90Z" fill="#FFFFFF"/>
            <path d="M84 72C89 75 90 81 88 86C85 83 83 78 84 72Z" fill="#FFFFFF"/>
            <path d="M38 78C42 72 48 70 56 70" fill="none" stroke="#F8D2A0" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>`,
          earL: {svg: `<path d="M45 46C37 40 32 30 33 22C41 25 47 33 49 41Z" fill="#D8995A" ${O}/><path d="M44 42C39 37 37 31 37 27C41 30 44 35 46 40Z" fill="#F6C8B4"/>`, pivot: [47, 44]},
          earR: {svg: `<path d="M75 46C83 40 88 30 87 22C79 25 73 33 71 41Z" fill="#D8995A" ${O}/><path d="M76 42C81 37 83 31 83 27C79 30 76 35 74 40Z" fill="#F6C8B4"/>`, pivot: [73, 44]},
          head: `${RG("storm-sprig-h", [[0, "#F4C68C"], [0.6, "#DCA060"], [1, "#BA7C42"]], 0.4, 0.3, 0.8)}
            <path d="M42 54C42 43 50 37 60 37C70 37 78 43 78 54C78 66 71 75 60 75C49 75 42 66 42 54Z" fill="url(#storm-sprig-h)" ${O}/>
            <path d="M55 39C55 35 57 33 58 33M65 39C65 35 63 33 62 33" fill="none" stroke="#3A2A22" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M44 62C46 68 52 74 60 75C68 74 74 68 76 62C72 66 66 68 60 68C54 68 48 66 44 62Z" fill="#FFFFFF"/>
            ${shine(49, 45, 4.6, 2.2, -35)}`,
          face: `<ellipse cx="60" cy="66" rx="8.6" ry="6.4" fill="#F8EEE4" ${OW(1.6)}/><path d="M56.4 63.4C56.4 61.6 63.6 61.6 63.6 63.4C63.6 65.4 61.6 66.6 60 66.6C58.4 66.6 56.4 65.4 56.4 63.4Z" fill="#2A1E1E"/>`
        },
        eyes: {lx: 51, rx: 69, y: 54, r: 4.2, style: "sparkle", color: "#2A1810"},
        mouth: {x: 60, y: 69.6, w: 2.2, color: "#2A1E1E"},
        cheeks: {lx: 46, rx: 74, y: 61, w: 3.4, h: 2, color: "#FF9A88"},
        anchors: {top: [60, 34, 0.85], neck: [60, 74, 0.9], chest: [72, 86, 0.6], back: [80, 72, 0.7], hands: [60, 92, 0.85]},
        lines: {
          tap: ["Hi! I raced the wind just to get here!", "Big ears, quick feet, bright mind. That's you!", "Storms pass. Good work stays.", "Zoom! Let's speed through this one!", "You're faster than a prairie gust!", "Little leaps add up to long journeys.", "Ears up! I'm cheering for you!"],
          pet: ["Hehe, right between my big ears!", "Ooh, that's better than a dust roll."],
          hello: ["You're back! Happy hoof skips!", "Hello! The wheat is waving at you."],
          morning: ["Good morning! Fresh grass, fresh start!"],
          night: ["Hear the far thunder? Time to rest soon."],
          focus: ["Standing still and listening, right beside you.", "Steady as the prairie. Keep going."],
          done: ["What a session! Victory zoomies!", "Done! You outran that one!"],
          task: ["Zoom! Another one done!", "Checked off! Hoof bump!", "Yes! Swift work!", "Done! Ears up, hooray!"],
          break: ["Break! Have a big stretch and some water."]
        }
      },
      {
        id: "storm-ollie", name: "Ollie", kind: "Burrowing Owlet", pose: "stand", wearColor: "#3E7AD0",
        bio: "A long-legged owlet who peeks out of his burrow to watch the storms roll by.",
        idle: ["wingFlutter", "headTilt", "bounce"], cheer: "hop",
        neck: [60, 70],
        parts: {
          back: `<path d="M26 112C28 102 40 97 60 97C80 97 92 102 94 112Z" fill="#C8A26A" ${O2}/><path d="M74 112C74 105 80 101 86 102C90 104 92 108 92 112Z" fill="#5A3E26"/><path d="M34 106q4-2 8 0M52 103q4-2 8 0" fill="none" stroke="#E2C48C" stroke-width="1.6" stroke-linecap="round"/>`,
          feet: `${["M53 90V106", "M67 90V106"].map(d => `<path d="${d}" stroke="${INK}" stroke-width="6.4" stroke-linecap="round"/><path d="M${d.slice(1)}" stroke="#E8D8B8" stroke-width="3.4" stroke-linecap="round"/>`).join("")}<path d="M47 108L53 105L59 108M61 108L67 105L73 108" fill="none" stroke="${INK}" stroke-width="5.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M47 108L53 105L59 108M61 108L67 105L73 108" fill="none" stroke="#E8D8B8" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
          body: `${RG("storm-ollie-b", [[0, "#C49A6A"], [0.6, "#A27A50"], [1, "#84603E"]], 0.4, 0.3, 0.8)}
            <path d="M42 80C42 70 50 64 60 64C70 64 78 70 78 80C78 90 70 96 60 96C50 96 42 90 42 80Z" fill="url(#storm-ollie-b)" ${O}/>
            <path d="M50 82C50 75 54 70 60 70C66 70 70 75 70 82C70 89 66 93 60 93C54 93 50 89 50 82Z" fill="#F2E6CE"/>
            <path d="M54 77h3M62 78h3M53 84h3.4M61 85h3.4M56 90h3M63 90h2" stroke="#A27A50" stroke-width="1.6" stroke-linecap="round"/>`,
          wingL: {svg: `<path d="M45 70C37 74 34 84 37 94C42 92 47 86 48 78Z" fill="#94704A" ${O2}/><g fill="#F2E6CE"><circle cx="41" cy="80" r="1.3"/><circle cx="40" cy="87" r="1.2"/><circle cx="44" cy="76" r="1"/></g>`, pivot: [46, 72]},
          wingR: {svg: `<path d="M75 70C83 74 86 84 83 94C78 92 73 86 72 78Z" fill="#94704A" ${O2}/><g fill="#F2E6CE"><circle cx="79" cy="80" r="1.3"/><circle cx="80" cy="87" r="1.2"/><circle cx="76" cy="76" r="1"/></g>`, pivot: [74, 72]},
          head: `${RG("storm-ollie-h", [[0, "#CCA272"], [0.6, "#A8805A"], [1, "#88643E"]], 0.4, 0.3, 0.8)}
            <path d="M38 50C38 37 48 29 60 29C72 29 82 37 82 50C82 63 72 72 60 72C48 72 38 63 38 50Z" fill="url(#storm-ollie-h)" ${O}/>
            <g fill="#F2E6CE"><circle cx="46" cy="38" r="1.4"/><circle cx="52" cy="34" r="1.3"/><circle cx="60" cy="33" r="1.2"/><circle cx="68" cy="34" r="1.3"/><circle cx="74" cy="38" r="1.4"/><circle cx="42" cy="46" r="1.1"/><circle cx="78" cy="46" r="1.1"/></g>
            ${shine(47, 40, 4.6, 2.2, -35)}`,
          face: `<path d="M41 47C44 42 53 41 59 46M79 47C76 42 67 41 61 46" fill="none" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round"/>
            <circle cx="51" cy="52" r="7.2" fill="#F6D04A" ${OW(1.8)}/><circle cx="69" cy="52" r="7.2" fill="#F6D04A" ${OW(1.8)}/>
            <path d="M44 62C50 66 56 66 60 64C64 66 70 66 76 62" fill="none" stroke="#F2E6CE" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M57.4 58H62.6L60 63.4Z" fill="#D8C27E" ${OW(1.4)}/>`
        },
        eyes: {lx: 51, rx: 69, y: 52, r: 4.4, style: "dot", color: "#1E1A18"},
        mouth: {x: 60, y: 66.6, w: 2, color: "#2B2233"},
        cheeks: {lx: 43, rx: 77, y: 59.6, w: 3, h: 1.8, color: "#FF9A9A"},
        anchors: {top: [60, 30, 0.85], neck: [60, 70, 0.8], chest: [66, 82, 0.55], back: [76, 76, 0.65], hands: [60, 88, 0.75]},
        lines: {
          tap: ["Hoo! Hi there!", "I watch the sky. You watch your goals!", "Long legs, big eyes, bigger cheers!", "Peek! I see you working hard!", "Wise owls take one step at a time.", "Hoo hoo hooray for you!", "Stand tall, little scholar!"],
          pet: ["Hehe, my feathers are all fluffed!", "Ooh, a soft little ruffle!"],
          hello: ["You're back! I hopped out of my burrow!", "Hoo! Hello! Nice to see you."],
          morning: ["Good morning! Bright eyes, bright day!"],
          night: ["Look, silent lightning! Rest soon, okay?"],
          focus: ["Keeping a quiet lookout for you.", "Big eyes on the goal. Keep going."],
          done: ["What a session! Hoo hoo hooray!", "Done! That was a wise use of time!"],
          task: ["Hoo! Another one done!", "Checked off! Wing flap!", "Yes! Sharp as an owl!", "Done! Feathers fluffed with pride!"],
          break: ["Break! Blink those big eyes and stretch."]
        }
      },
      {
        id: "storm-rumble", name: "Rumble", kind: "Little Thundercloud", pose: "float", wearColor: "#F2A83A",
        bio: "A small storm cloud with a golden lining and a very gentle rumble.",
        idle: ["sway", "sparkle", "topBob"], cheer: "spin",
        parts: {
          back: `<g stroke="#7AA8E0" stroke-width="2.6" stroke-linecap="round"><path d="M44 96l-2 6"/><path d="M58 98l-2 7"/><path d="M72 96l-2 6"/><path d="M51 103l-1.4 4"/><path d="M65 104l-1.4 4"/></g>`,
          body: `${LG("storm-rumble-b", [[0, "#B8C2D4"], [0.55, "#8E9AB2"], [1, "#6A7690"]])}
            <path d="${puff(60, 70, 27, 9, 1.24)}" transform="translate(60 70) scale(1.14 0.86) translate(-60 -70)" fill="url(#storm-rumble-b)" ${O}/>
            <path d="M33 66C34 56 42 48 52 47" fill="none" stroke="#FFE2A0" stroke-width="3.2" stroke-linecap="round"/><path d="M40 50C46 46 54 45 60 47" fill="none" stroke="#FFF2C8" stroke-width="2" stroke-linecap="round" opacity=".8"/>
            <path d="M36 88Q60 96 84 88" fill="none" stroke="#5A6680" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>`,
          armL: {svg: `<ellipse cx="24" cy="78" rx="7" ry="6" fill="#9AA6BC" ${O}/>`, pivot: [31, 76]},
          armR: {svg: `<ellipse cx="96" cy="78" rx="7" ry="6" fill="#9AA6BC" ${O}/>`, pivot: [89, 76]},
          top: {svg: `<path d="M63 22L52 37H59L55 49L68 32H61Z" fill="#FFD24A" ${OW(2)}/>${twinkle(72, 24, 2.6, "#FFF2B0")}`, pivot: [60, 46]}
        },
        eyes: {lx: 50, rx: 70, y: 69, r: 4.2, style: "sparkle", color: "#22243A"},
        mouth: {x: 60, y: 78, w: 3, color: "#22243A"},
        cheeks: {lx: 41, rx: 79, y: 76, w: 4.4, h: 2.6, color: "#FFB0C0"},
        anchors: {top: [60, 44, 0.85], neck: [60, 92, 0.95], chest: [74, 84, 0.6], back: [90, 64, 0.8], hands: [60, 92, 0.85]},
        lines: {
          tap: ["Rumble rumble! That's my happy sound!", "Every storm has a golden lining. Like you!", "I bring the drama, you bring the focus!", "Pitter patter, let's get this done!", "A little thunder for your big effort!", "Clear skies are coming. Keep going!", "Zap! That's a spark of genius!"],
          pet: ["Hehe! My fluff is all staticky!", "Ooh, I'm going soft and silver."],
          hello: ["You're here! I rolled right over!", "Hi! I brought a tiny breeze."],
          morning: ["Good morning! Sunshine first, storms later!"],
          night: ["I'm flickering softly tonight. Rest soon?"],
          focus: ["Rumbling quietly overhead.", "Calm before the cheering. Keep going!"],
          done: ["What a session! Thunderous applause!", "Done! The sun's breaking through!"],
          task: ["Boom! Another one done!", "Checked off! Lightning fast!", "Yes! What a spark!", "Done! Rumble of joy!"],
          break: ["Break! Let it drizzle and breathe."]
        }
      }
    ]
  });
})();
