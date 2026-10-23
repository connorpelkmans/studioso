/* ===== module: 98-comp-m2.js ===== */
/* Study Companions, Study Fields batch m2 */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const r2 = v => Math.round(v * 100) / 100;
  // A gear outline
  const gear = (cx, cy, ro, ri, n) => {
    const pt = (r, a) => `${r2(cx + r * Math.cos(a))} ${r2(cy + r * Math.sin(a))}`;
    const step = 2 * Math.PI / n, h = step / 4;
    let d = "";
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + i * step;
      d += (i ? "L" : "M") + pt(ri, a - h * 1.25) + "L" + pt(ro, a - h * 0.72) + "L" + pt(ro, a + h * 0.72) + "L" + pt(ri, a + h * 1.25);
      d += `A${ri} ${ri} 0 0 1 ` + pt(ri, a + step - h * 1.25);
    }
    return d + "Z";
  };
  // A thick outlined segment (robot arm links, mic arms)
  const SEG = (d, color, w) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 6}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

  /* Code Night */
  COMP_DATA.push({
    theme: "compsci",
    companions: [
      {
        id: "compsci-duck", name: "Debug", kind: "Rubber Duck", pose: "sit", wearColor: "#3E7BD6",
        bio: "A squeaky rubber duck who listens to every bug until it's solved.",
        idle: ["headTilt", "tailSwish", "wave"], cheer: "wingFlutter",
        neck: [60, 75],
        parts: {
          tail: {svg: `${LG("compsci-duck-t", [[0, "#FFE36B"], [1, "#F4B827"]])}<path d="M80 98C88 96 92 88 95 78C96.5 73.5 101 74 101.5 78.5C102.5 90 96 103 82 106Z" fill="url(#compsci-duck-t)" ${O}/><path d="M95.5 80Q97 77.5 99 78" fill="none" stroke="#FFF6C4" stroke-width="2" stroke-linecap="round"/>`, pivot: [84, 102]},
          body: `${RG("compsci-duck-b", [[0, "#FFF6B0"], [0.5, "#FFE05A"], [1, "#F2B42A"]], 0.4, 0.3, 0.78)}
            <path d="M60 73C82 73 93 83 93 94C93 105 80 110.5 60 110.5C40 110.5 27 105 27 94C27 83 38 73 60 73Z" fill="url(#compsci-duck-b)" ${O}/>
            <path d="M36 87Q40 80 48 78" fill="none" stroke="#FFFBE0" stroke-width="3" stroke-linecap="round"/>
            <path d="M40 104Q60 110 80 104" fill="none" stroke="#E9A21F" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>`,
          armL: {svg: `<path d="M38 84C30 84 25 91 26 100C33 101 39 97 41 90Z" fill="#FBCB3A" ${O}/><path d="M30 92Q32 88 36 87" fill="none" stroke="#FFF1A8" stroke-width="2" stroke-linecap="round"/>`, pivot: [39, 86]},
          armR: {svg: `<path d="M82 84C90 84 95 91 94 100C87 101 81 97 79 90Z" fill="#FBCB3A" ${O}/>`, pivot: [81, 86]},
          head: `${RG("compsci-duck-h", [[0, "#FFF8C2"], [0.55, "#FFE264"], [1, "#F4BA2C"]], 0.4, 0.32, 0.72)}
            <circle cx="60" cy="51" r="24.5" fill="url(#compsci-duck-h)" ${O}/>
            <ellipse cx="47" cy="38.5" rx="6" ry="3.4" transform="rotate(-38 47 38.5)" fill="#fff" opacity=".95"/><circle cx="54.5" cy="33.6" r="1.8" fill="#fff"/>`,
          top: {svg: `<path d="M58 28C55 21 58 15 64 15C68 15 70 18 68.5 21C67.5 23 65 23 64.5 21" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M58 28C55 21 58 15 64 15C68 15 70 18 68.5 21C67.5 23 65 23 64.5 21" fill="none" stroke="#FFD840" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`, pivot: [59, 28]}
        },
        eyes: {lx: 50, rx: 70, y: 48, r: 5, style: "dot"},
        mouths: {
          neutral: `<path d="M51.5 58.5Q60 54.5 68.5 58.5Q67 64.5 60 64.5Q53 64.5 51.5 58.5Z" fill="#FF9A3C" ${OW(2)}/><path d="M54 59.6Q60 61 66 59.6" fill="none" stroke="#D96A1E" stroke-width="1.4" stroke-linecap="round"/><path d="M55.5 58Q58 56.6 60.5 56.8" fill="none" stroke="#FFD2A0" stroke-width="1.5" stroke-linecap="round"/>`,
          smile: `<path d="M50.5 57.5Q60 54 69.5 57.5Q68 63.5 60 64Q52 63.5 50.5 57.5Z" fill="#FF9A3C" ${OW(2)}/><path d="M53 58.5Q60 62 67 58.5" fill="none" stroke="#D96A1E" stroke-width="1.5" stroke-linecap="round"/><path d="M55 57Q58 55.6 60.5 55.8" fill="none" stroke="#FFD2A0" stroke-width="1.5" stroke-linecap="round"/>`,
          open: `<path d="M53.5 60.5Q60 59 66.5 60.5Q65 69 60 69Q55 69 53.5 60.5Z" fill="#FF9A3C" ${OW(2)}/><path d="M56.5 63.5Q60 66.5 63.5 63.5Q62 66.8 60 66.8Q58 66.8 56.5 63.5Z" fill="#FF8FA8"/><path d="M51 57Q60 53.5 69 57Q67.5 61.5 60 61.8Q52.5 61.5 51 57Z" fill="#FFA94A" ${OW(2)}/><path d="M55 56Q58 54.8 60.5 55" fill="none" stroke="#FFD2A0" stroke-width="1.5" stroke-linecap="round"/>`,
          sleepy: `<path d="M53 59Q60 56 67 59Q65.5 63.5 60 63.5Q54.5 63.5 53 59Z" fill="#F29234" ${OW(2)}/>`
        },
        mouth: {x: 60, y: 59, w: 3.4},
        cheeks: {lx: 41.5, rx: 78.5, y: 57.5, w: 4.6, h: 2.8, color: "#FF9A8A"},
        anchors: {top: [60, 28, 0.95], neck: [60, 76, 1.05], chest: [72, 92, 0.7], back: [87, 86, 0.9], hands: [60, 96, 0.9]},
        lines: {
          tap: ["Squeak! Tell me all about your code!", "You're debugging like a champion!", "Quack! I believe in you so much!", "Every bug you squash makes me squeak!", "Talk it through, I'm all ears!", "You're smarter than any compiler!", "Quack quack! You've totally got this!", "Best coding buddy ever? That's you!"],
          pet: ["Squeeeak! That's my happy sound!", "Hehe! Quack! Do it again!"],
          hello: ["Quack! You're back! Let's code!", "Squeak! I saved you a spot by the desk!"],
          morning: ["Good morning! Fresh day, fresh code!", "Rise and shine! Quack quack!"],
          night: ["Soft squeaks now. Time to log off!", "Code can wait. Cozy dreams, friend!"],
          focus: ["Quiet duck mode. You've got this!", "Listening closely, right beside you!"],
          done: ["QUACK! What a brilliant session!", "Session done! Zero bugs, all joy!"],
          task: ["Squeak! Bug squashed! WOO!", "Quack! Shipped it! Amazing!", "Checked off! Happy squeaks!", "Yes! It compiles! Hooray!"],
          break: ["Float and stretch! Splish splash!", "Snack break! You earned a treat!"]
        }
      },
      {
        id: "compsci-robot", name: "Bitsy", kind: "Little Robot", pose: "stand", wearColor: "#2FA79A",
        bio: "A tiny robot whose screen lights up with joy for every line you write.",
        idle: ["topBob", "earTwitch", "wave"], cheer: "wave",
        neck: [60, 71],
        parts: {
          feet: `<path d="M43.5 112V106Q43.5 101 49 101H53Q57 101 57 106V112Z" fill="#7C86A6" ${O}/><path d="M63 112V106Q63 101 67 101H71Q76.5 101 76.5 106V112Z" fill="#7C86A6" ${O}/>`,
          body: `${LG("compsci-robot-b", [[0, "#F4F8FF"], [0.6, "#D7E2FA"], [1, "#B3C2EA"]])}
            <rect x="54" y="66" width="12" height="9" rx="2.5" fill="#9AA5C4" ${O2}/>
            <rect x="41" y="72" width="38" height="32" rx="11" fill="url(#compsci-robot-b)" ${O}/>
            <path d="M46 80Q47 76 51 75.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
            <rect x="50" y="81" width="20" height="15" rx="5" fill="#2E3A5C" ${O2}/>
            <path d="M60 93.2C55 89.6 53.4 87.6 54 85.6C54.6 83.6 57.6 83.2 60 85.6C62.4 83.2 65.4 83.6 66 85.6C66.6 87.6 65 89.6 60 93.2Z" fill="#FF7FA6"/>
            <path d="M56 85.6Q56.8 84.8 57.8 85" fill="none" stroke="#FFD0DE" stroke-width="1.2" stroke-linecap="round"/>`,
          armL: {svg: `${SEG("M44 80Q36 84 34 94", "#A9B5D6", 4)}<path d="M37.5 99.5A5.2 5.2 0 1 1 30 99" fill="none" stroke="${INK}" stroke-width="6.6" stroke-linecap="round"/><path d="M37.5 99.5A5.2 5.2 0 1 1 30 99" fill="none" stroke="#7C86A6" stroke-width="3" stroke-linecap="round"/>`, pivot: [44, 80]},
          armR: {svg: `${SEG("M76 80Q84 84 86 94", "#A9B5D6", 4)}<path d="M82.5 99.5A5.2 5.2 0 1 0 90 99" fill="none" stroke="${INK}" stroke-width="6.6" stroke-linecap="round"/><path d="M82.5 99.5A5.2 5.2 0 1 0 90 99" fill="none" stroke="#7C86A6" stroke-width="3" stroke-linecap="round"/>`, pivot: [76, 80]},
          earL: {svg: `<rect x="26" y="40" width="9" height="16" rx="4" fill="#5FD0BE" ${O}/><path d="M29 43.5v4" stroke="#C8F7EE" stroke-width="2" stroke-linecap="round"/>`, pivot: [34, 48]},
          earR: {svg: `<rect x="85" y="40" width="9" height="16" rx="4" fill="#5FD0BE" ${O}/>`, pivot: [86, 48]},
          head: `${LG("compsci-robot-h", [[0, "#F7FAFF"], [0.6, "#DDE6FA"], [1, "#BAC8EE"]])}${LG("compsci-robot-s", [[0, "#34446E"], [1, "#1E2742"]])}
            <rect x="32" y="25" width="56" height="45" rx="16" fill="url(#compsci-robot-h)" ${O}/>
            <rect x="38.5" y="31" width="43" height="33" rx="11" fill="url(#compsci-robot-s)" ${O2}/>
            <path d="M43 36.5Q46 34 51 34" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>
            <path d="M36 32Q38 28 43 27.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>`,
          top: {svg: `${LINE("M60 26V15", "#9AA5C4", 2.2)}${RG("compsci-robot-a", [[0, "#FFFBE0"], [0.5, "#FFD95A"], [1, "#FFA43A"]], 0.4, 0.38, 0.6)}<circle cx="60" cy="11.5" r="5" fill="url(#compsci-robot-a)" ${O2}/><circle cx="58.4" cy="10" r="1.4" fill="#fff"/>`, pivot: [60, 26]}
        },
        eyes: {lx: 51, rx: 69, y: 46, r: 5, style: "dot", color: "#7DF2DA"},
        mouth: {x: 60, y: 55.5, w: 3, color: "#7DF2DA"},
        cheeks: {lx: 44, rx: 76, y: 53.5, w: 3.6, h: 2.2, color: "#FF8FBA"},
        anchors: {top: [60, 27, 0.95], neck: [60, 74, 0.95], chest: [71, 96, 0.6], back: [79, 86, 0.8], hands: [60, 94, 0.85]},
        lines: {
          tap: ["Beep boop! Hi! Hi! Hi!", "Processing joy: 100 percent!", "You're running at top speed today!", "My circuits sparkle when you're here!", "Beep! You're doing amazing!", "Loading cheer: done! Go you!", "Hello, world! Hello, YOU!", "Best human in my whole database!"],
          pet: ["Beep beep! Happy circuits!", "Boop! My screen is all blushy!"],
          hello: ["User detected! Yay! Welcome back!", "Beep boop! I missed you so much!"],
          morning: ["Good morning! System booting up!", "Rise and shine! Fully charged!"],
          night: ["Entering sleep mode soon. Rest well!", "Powering down softly. Sweet dreams!"],
          focus: ["Focus mode on. You've got this!", "Quiet beeps, cheering you on!"],
          done: ["BEEP BOOP! Session complete! WOW!", "Mission success! You're amazing!"],
          task: ["Beep! Task executed! WOO!", "Done! My antenna is glowing!", "Checked off! Happy beeps!", "Return value: AWESOME!"],
          break: ["Stretch time! Rebooting muscles!", "Recharge break! Grab a snack!"]
        }
      },
      {
        id: "compsci-floppy", name: "Floppy", kind: "Floppy Disk", pose: "stand", wearColor: "#E2577F",
        bio: "A retro floppy disk who saves every little win you make.",
        idle: ["wave", "bounce", "sway"], cheer: "hop",
        parts: {
          feet: `${LINE("M49 99V105M71 99V105", "#3F5FA8", 2.4)}<path d="M41.5 111.5Q41.5 104.5 49 104.5Q55 104.5 55.5 109Q55.5 111.5 52 111.5Z" fill="#FF8FAB" ${O2}/><path d="M78.5 111.5Q78.5 104.5 71 104.5Q65 104.5 64.5 109Q64.5 111.5 68 111.5Z" fill="#FF8FAB" ${O2}/>`,
          body: `${LG("compsci-floppy-b", [[0, "#9CC4FA"], [0.55, "#6F9BE8"], [1, "#5179CF"]])}${LG("compsci-floppy-m", [[0, "#F5F7FC"], [1, "#B8C1D6"]])}
            <path d="M37 26H81L91 36V93Q91 100 84 100H37Q30 100 30 93V33Q30 26 37 26Z" fill="url(#compsci-floppy-b)" ${O}/>
            <path d="M44 26H76V45Q76 48 73 48H47Q44 48 44 45Z" fill="url(#compsci-floppy-m)" ${O2}/>
            <rect x="64" y="30.5" width="7" height="13" rx="2" fill="#3A4466"/>
            <path d="M47.5 30v12" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>
            <rect x="37" y="55" width="46" height="40" rx="5" fill="#FFF9EE" ${O2}/>
            <path d="M37 60V59.5Q37 55 42 55H78Q83 55 83 59.5V60Z" fill="#FF8FAB"/>
            <rect x="37" y="55" width="46" height="40" rx="5" fill="none" ${O2}/>
            <path d="M44 89.5H76" stroke="#D7DCEA" stroke-width="1.8" stroke-linecap="round"/>
            <rect x="33.5" y="92" width="3.6" height="4" rx="1" fill="#3A4466"/>
            <path d="M34.5 50V36Q34.5 31 38.5 30" fill="none" stroke="#D6E7FF" stroke-width="2.8" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="26.5" cy="78" rx="4.6" ry="6.6" transform="rotate(22 26.5 78)" fill="#6F9BE8" ${O}/>`, pivot: [31, 74]},
          armR: {svg: `<ellipse cx="93.5" cy="78" rx="4.6" ry="6.6" transform="rotate(-22 93.5 78)" fill="#6F9BE8" ${O}/>`, pivot: [89, 74]}
        },
        eyes: {lx: 50.5, rx: 69.5, y: 72, r: 4.8, style: "dot"},
        mouth: {x: 60, y: 81, w: 3.2},
        cheeks: {lx: 43.5, rx: 76.5, y: 80, w: 4, h: 2.5, color: "#FF9AB4"},
        anchors: {top: [60, 27, 1], neck: [60, 96, 1.15], chest: [76, 90, 0.6], back: [86, 62, 0.9], hands: [60, 93, 0.85]},
        lines: {
          tap: ["Hi! Saving this happy moment!", "You're doing so well! Saved!", "1.44 megabytes of pure cheer!", "Whirr whirr! That's my happy noise!", "You're my favorite file to save!", "Ctrl S on all your awesomeness!", "You've got this! Loading pride!", "Retro hugs for my study buddy!"],
          pet: ["Whirr! My shutter is all tingly!", "Hehe! Saved to my heart!"],
          hello: ["You're back! Loading happiness!", "Hi hi! Your progress is safe with me!"],
          morning: ["Good morning! Booting up a new day!", "Rise and shine! Fresh disk, fresh day!"],
          night: ["All saved for today. Rest well!", "Ejecting gently. Sweet dreams!"],
          focus: ["Quietly saving your hard work!", "Steady and saved. You've got this!"],
          done: ["Session saved! What a great one!", "Wow! Writing that to memory forever!"],
          task: ["Saved! Done! WOO!", "Yes! Backed up and checked off!", "Click whirr! Another one done!", "Saving this win forever! Hooray!"],
          break: ["Stretch break! Spin those arms!", "Snack time! Refresh and reload!"]
        }
      }
    ]
  });

  /* Gear Works */
  COMP_DATA.push({
    theme: "engineering",
    companions: [
      {
        id: "engineering-beaver", name: "Bolt", kind: "Hard Hat Beaver", pose: "sit", wearColor: "#2C7FB8",
        bio: "A busy beaver in a hard hat who builds big plans one log at a time.",
        idle: ["tailSwish", "earTwitch", "headTilt"], cheer: "wave",
        neck: [60, 78],
        parts: {
          tail: {svg: `${LG("engineering-beaver-t", [[0, "#8A5C3E"], [1, "#5E3B27"]])}<ellipse cx="89" cy="96" rx="9.5" ry="17" transform="rotate(48 89 96)" fill="url(#engineering-beaver-t)" ${O}/><path d="M80 92L95 105M84 87L99 99M85 100L92 92M90 104L97 96M80 96L87 88" stroke="#A9775A" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>`, pivot: [78, 100]},
          feet: `<ellipse cx="46" cy="108.5" rx="9.5" ry="4.4" fill="#7A4E33" ${O}/><ellipse cx="74" cy="108.5" rx="9.5" ry="4.4" fill="#7A4E33" ${O}/>`,
          body: `${LG("engineering-beaver-b", [[0, "#D39463"], [1, "#A96B44"]])}
            <path d="M60 72C77 72 85 86 85 96C85 105 76 109.5 60 109.5C44 109.5 35 105 35 96C35 86 43 72 60 72Z" fill="url(#engineering-beaver-b)" ${O}/>
            <ellipse cx="60" cy="96" rx="14.5" ry="11" fill="#F7E2C4"/>
            <path d="M43 85Q46 79 51 77" fill="none" stroke="#E9B88E" stroke-width="2.6" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="40" cy="91" rx="5.2" ry="7.6" transform="rotate(26 40 91)" fill="#B9784C" ${O}/>`, pivot: [45, 85]},
          armR: {svg: `<ellipse cx="80" cy="91" rx="5.2" ry="7.6" transform="rotate(-26 80 91)" fill="#B9784C" ${O}/>`, pivot: [75, 85]},
          earL: {svg: `<circle cx="35.5" cy="49" r="7" fill="#B9784C" ${O}/><circle cx="35.8" cy="49.4" r="3.4" fill="#E9A48C"/>`, pivot: [40, 51]},
          earR: {svg: `<circle cx="84.5" cy="49" r="7" fill="#B9784C" ${O}/><circle cx="84.2" cy="49.4" r="3.4" fill="#E9A48C"/>`, pivot: [80, 51]},
          head: `${RG("engineering-beaver-h", [[0, "#E2A777"], [0.6, "#C98858"], [1, "#A9693F"]], 0.42, 0.4, 0.7)}
            <ellipse cx="60" cy="58" rx="26" ry="21.5" fill="url(#engineering-beaver-h)" ${O}/>
            <ellipse cx="60" cy="67.5" rx="12" ry="8.6" fill="#F7E2C4"/>
            <ellipse cx="60" cy="62.4" rx="4.2" ry="3" fill="#3A2420"/><ellipse cx="58.8" cy="61.6" rx="1.4" ry=".8" fill="#fff" opacity=".7"/>`,
          hat: `${LG("engineering-beaver-y", [[0, "#FFE27A"], [0.6, "#FFC93A"], [1, "#F2A81E"]])}
            <path d="M36 44C36 27 46 18.5 60 18.5C74 18.5 84 27 84 44Z" fill="url(#engineering-beaver-y)" ${O}/>
            <path d="M56 19.5Q55 31 56 43.5H64Q65 31 64 19.5Z" fill="#FFE68E" ${OW(1.8)}/>
            <path d="M43 36Q44 28 50 24" fill="none" stroke="#FFF6CF" stroke-width="2.8" stroke-linecap="round"/>
            <rect x="30" y="41" width="60" height="7.5" rx="3.75" fill="#F5B52A" ${O}/>
            <path d="M34 43.8H50" stroke="#FFE68E" stroke-width="2" stroke-linecap="round"/>`
        },
        eyes: {lx: 49, rx: 71, y: 56, r: 4.6, style: "dot"},
        mouths: {
          neutral: `<rect x="57.4" y="68.2" width="5.2" height="5" rx="1.2" fill="#fff" ${OW(1.6)}/><path d="M60 68.4v4.6" stroke="${INK}" stroke-width="1.1"/><path d="M55.5 67q2.25 2.2 4.5 0q2.25 2.2 4.5 0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
          smile: `<rect x="57.4" y="68.6" width="5.2" height="5" rx="1.2" fill="#fff" ${OW(1.6)}/><path d="M60 68.8v4.6" stroke="${INK}" stroke-width="1.1"/><path d="M54 66.4q3 3.4 6 0q3 3.4 6 0" fill="none" stroke="${INK}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>`,
          open: `<path d="M54.6 66.6Q60 65.4 65.4 66.6Q65.4 75.5 60 75.5Q54.6 75.5 54.6 66.6Z" fill="${INK}" ${OW(1.6)}/><path d="M56.6 72.6Q60 70.6 63.4 72.6Q62 74.6 60 74.6Q58 74.6 56.6 72.6Z" fill="#FF8FA8"/><rect x="57.3" y="66.2" width="5.4" height="4.4" rx="1" fill="#fff" ${OW(1.4)}/><path d="M60 66.4v4" stroke="${INK}" stroke-width="1"/>`,
          sleepy: `<rect x="57.8" y="68" width="4.4" height="4" rx="1" fill="#fff" ${OW(1.5)}/><path d="M56.5 67q1.75 1.6 3.5 0q1.75 1.6 3.5 0" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`
        },
        mouth: {x: 60, y: 68, w: 3},
        cheeks: {lx: 41, rx: 79, y: 64.5, w: 4.6, h: 2.8, color: "#FF9A9A"},
        anchors: {top: [60, 20, 0.95], neck: [60, 79, 1.05], chest: [70, 93, 0.68], back: [83, 88, 0.85], hands: [60, 95, 0.9]},
        lines: {
          tap: ["Hi, builder! Ready to make plans?", "You're building something amazing!", "Hard hat on, cheer level max!", "Log by log, you're doing great!", "Measure twice, cheer forever!", "Tail slap of pride for you!", "You've got this! Let's build!", "Best teammate on the whole site!"],
          pet: ["Hehe! My hard hat wiggled!", "Ooh! Happy tail thumps!"],
          hello: ["You're back! The crew is complete!", "Hi! I kept the blueprints warm!"],
          morning: ["Good morning! Big build day ahead!", "Rise and shine! Hard hats on!"],
          night: ["Site closed for tonight. Rest well!", "Tools down, cozy dreams, builder!"],
          focus: ["Steady build! You've got this!", "Quietly hammering beside you!"],
          done: ["WOW! What a solid session!", "Session done! Built to last!"],
          task: ["Thump! Done! WOO!", "Yes! Another log on the dam!", "Checked off! Rock solid!", "Built it! Hooray for you!"],
          break: ["Stretch break! Big sleepy yawn!", "Snack break! Crunchy and tasty!"]
        }
      },
      {
        id: "engineering-gear", name: "Cog", kind: "Gear Sprite", pose: "float", wearColor: "#2F8F9D",
        bio: "A spinning brass gear sprite who keeps every plan turning smoothly.",
        idle: ["spin", "topBob", "wave"], cheer: "spin",
        parts: {
          body: `${RG("engineering-gear-g", [[0, "#FFE29A"], [0.55, "#F3BE5E"], [1, "#C98A35"]], 0.4, 0.34, 0.75)}${RG("engineering-gear-p", [[0, "#FFFDF5"], [0.7, "#FFF1D2"], [1, "#F3D9A6"]], 0.42, 0.38, 0.7)}
            <path d="${gear(60, 58, 38, 31, 10)}" fill="url(#engineering-gear-g)" ${O}/>
            <circle cx="60" cy="58" r="25" fill="url(#engineering-gear-p)" ${O2}/>
            <g fill="#D9A04A"><circle cx="60" cy="29.5" r="1.8"/><circle cx="88.5" cy="58" r="1.8"/><circle cx="60" cy="86.5" r="1.8"/><circle cx="31.5" cy="58" r="1.8"/></g>
            <path d="M30 46Q33 37 40 31.5" fill="none" stroke="#FFF2C8" stroke-width="3" stroke-linecap="round"/>
            <path d="M42 45Q45 39.5 51 37.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="19" cy="72" rx="4.8" ry="6.6" transform="rotate(30 19 72)" fill="#E9AE4E" ${O}/>`, pivot: [24, 68]},
          armR: {svg: `<ellipse cx="101" cy="72" rx="4.8" ry="6.6" transform="rotate(-30 101 72)" fill="#E9AE4E" ${O}/>`, pivot: [96, 68]},
          top: {svg: `${RG("engineering-gear-s", [[0, "#C9F1EC"], [0.6, "#7CCFC4"], [1, "#4AA79D"]], 0.4, 0.36, 0.7)}<path d="${gear(86, 22, 12, 8.6, 8)}" fill="url(#engineering-gear-s)" ${O2}/><circle cx="86" cy="22" r="3.4" fill="#FFF8E8" ${OW(1.8)}/>`, pivot: [86, 22]}
        },
        eyes: {lx: 50.5, rx: 69.5, y: 56, r: 5, style: "sparkle"},
        mouth: {x: 60, y: 65, w: 3.2},
        cheeks: {lx: 43, rx: 77, y: 63.5, w: 4.2, h: 2.6, color: "#FF9A8E"},
        anchors: {top: [57, 22, 0.9], neck: [60, 88, 0.95], chest: [74, 77, 0.6], back: [89, 47, 0.85], hands: [60, 84, 0.85]},
        lines: {
          tap: ["Whirr! Hi! My teeth are spinning!", "You keep everything turning!", "Click click! You're amazing!", "We mesh so well together!", "Full speed ahead! Go go go!", "You're the gear that drives it all!", "Spinning with pride for you!", "Tick tick whirr! You've got this!"],
          pet: ["Whirrr! That's so smooth!", "Hehe! Freshly oiled happiness!"],
          hello: ["You're back! All gears go!", "Hi! I spun up the second I saw you!"],
          morning: ["Good morning! Let's get turning!", "Rise and shine! Gears are warm!"],
          night: ["Slowing to a gentle turn. Rest well!", "Gears resting. Cozy dreams!"],
          focus: ["Smooth and steady! You've got this!", "Turning quietly beside you!"],
          done: ["WHIRR! What a powerful session!", "Session done! Spinning with joy!"],
          task: ["Click! Done! WOO!", "Yes! The machine just leveled up!", "Checked off! Full spin!", "Another one done! Whirr hooray!"],
          break: ["Spin and stretch! Wheee!", "Oil break! Grab a drink!"]
        }
      },
      {
        id: "engineering-arm", name: "Grabby", kind: "Little Robot Arm", pose: "stand", wearColor: "#3E6FC2",
        bio: "A helpful robot arm who grabs every task and lifts it right up.",
        idle: ["earTwitch", "headTilt", "sway"], cheer: "hop",
        neck: [57, 64],
        parts: {
          feet: `${LG("engineering-arm-f", [[0, "#8E98B4"], [1, "#5E6784"]])}
            <path d="M34 104V107A26 5.5 0 0 0 86 107V104Z" fill="#5E6784" ${O}/>
            <ellipse cx="60" cy="104" rx="26" ry="5.5" fill="url(#engineering-arm-f)" ${O}/>
            <path d="M44 103Q52 101 60 101" fill="none" stroke="#C6CDE0" stroke-width="2" stroke-linecap="round"/>`,
          body: `${LG("engineering-arm-d", [[0, "#B7C0D8"], [1, "#7D87A6"]])}
            <path d="M45 104C45 94 51 89 60 89C69 89 75 94 75 104Z" fill="url(#engineering-arm-d)" ${O}/>
            <path d="M50 97Q52 92.5 57 91.5" fill="none" stroke="#E6EAF5" stroke-width="2.2" stroke-linecap="round"/>
            ${SEG("M60 93L43 76", "#FF9D47", 9)}
            <path d="M57 92L46 81" stroke="#FFD1A0" stroke-width="2" stroke-linecap="round"/>
            ${SEG("M43 76L56 63", "#FF9D47", 9)}
            <path d="M45 74L53 66" stroke="#FFD1A0" stroke-width="2" stroke-linecap="round"/>
            <circle cx="60" cy="93" r="6.2" fill="#A3ACC6" ${O2}/><circle cx="60" cy="93" r="2" fill="#5E6784"/>
            <circle cx="43" cy="76" r="6.2" fill="#A3ACC6" ${O2}/><circle cx="43" cy="76" r="2" fill="#5E6784"/>`,
          earL: {svg: `${SEG("M52 28Q44 21 46 10", "#A3ACC6", 4.5)}${SEG("M46 10L51 8", "#A3ACC6", 4.5)}`, pivot: [52, 28]},
          earR: {svg: `${SEG("M70 28Q78 21 76 10", "#A3ACC6", 4.5)}${SEG("M76 10L71 8", "#A3ACC6", 4.5)}`, pivot: [70, 28]},
          head: `${RG("engineering-arm-h", [[0, "#FFE2B0"], [0.55, "#FFBE6A"], [1, "#F2953A"]], 0.42, 0.34, 0.72)}
            <circle cx="57" cy="64" r="6" fill="#A3ACC6" ${O2}/>
            <rect x="35" y="25" width="52" height="39" rx="17" fill="url(#engineering-arm-h)" ${O}/>
            <rect x="52" y="22" width="18" height="6" rx="3" fill="#A3ACC6" ${O2}/>
            <path d="M40.5 38Q41.5 31 48 29" fill="none" stroke="#FFF3DC" stroke-width="2.8" stroke-linecap="round"/>`
        },
        eyes: {lx: 51, rx: 71, y: 45, r: 5.2, style: "dot"},
        mouth: {x: 61, y: 54.5, w: 3.2},
        cheeks: {lx: 43.5, rx: 78.5, y: 53, w: 4.4, h: 2.7, color: "#FF8F8F"},
        anchors: {top: [61, 24, 0.9], neck: [57, 66, 0.75], chest: [67, 98, 0.55], back: [77, 50, 0.75], hands: [61, 76, 0.8]},
        lines: {
          tap: ["Grab! Hi there! I caught a smile!", "Pinch pinch! You're amazing!", "I'd lift you up if I could!", "Precision cheering activated!", "You're building great things!", "Reach high! You've got this!", "My claws are clapping for you!", "Best project partner ever!"],
          pet: ["Whirr! My joints feel so loose!", "Hehe! Pinchy happy dance!"],
          hello: ["You're back! Grab a seat!", "Hi! I've been reaching for you!"],
          morning: ["Good morning! Ready to lift!", "Rise and shine! Calibrated and cheery!"],
          night: ["Folding up for the night. Rest well!", "Arm down, cozy dreams, friend!"],
          focus: ["Steady grip! You've got this!", "Holding steady right beside you!"],
          done: ["WOW! Heavy lifting, done!", "Session done! Raising the bar!"],
          task: ["Grabbed it! Done! WOO!", "Yes! Lifted right off the list!", "Checked off! Pinch of joy!", "Another one done! Clap clap!"],
          break: ["Stretch those joints! Whirr!", "Snack break! Grab something yummy!"]
        }
      }
    ]
  });

  /* Sunny Classroom */
  COMP_DATA.push({
    theme: "education",
    companions: [
      {
        id: "education-apple", name: "Appy", kind: "Red Apple", pose: "sit", wearColor: "#3E8E5A",
        bio: "A shiny red apple who's the teacher's pet and your biggest fan.",
        idle: ["topBob", "bounce", "wave"], cheer: "hop",
        parts: {
          body: `${RG("education-apple-g", [[0, "#FF9D8C"], [0.5, "#F2584C"], [1, "#C93538"]], 0.38, 0.36, 0.75)}
            <path d="M60 42C66 35 78 34 87 41C97 49 99 64 96 78C92 96 81 110 69 110C65 110 62.5 108 60 108C57.5 108 55 110 51 110C39 110 28 96 24 78C21 64 23 49 33 41C42 34 54 35 60 42Z" fill="url(#education-apple-g)" ${O}/>
            <path d="M52 44Q60 48 68 44" fill="none" stroke="#B52F35" stroke-width="2" stroke-linecap="round" opacity=".6"/>
            <ellipse cx="38" cy="58" rx="7" ry="4" transform="rotate(-48 38 58)" fill="#fff" opacity=".92"/><circle cx="44.5" cy="50.5" r="2" fill="#fff" opacity=".92"/>
            <path d="M88 86Q86 96 79 102" fill="none" stroke="#FFB3A6" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>`,
          armL: {svg: `<ellipse cx="22.5" cy="86" rx="5.4" ry="7.4" transform="rotate(24 22.5 86)" fill="#E24C46" ${O}/>`, pivot: [28, 82]},
          armR: {svg: `<ellipse cx="97.5" cy="86" rx="5.4" ry="7.4" transform="rotate(-24 97.5 86)" fill="#E24C46" ${O}/>`, pivot: [92, 82]},
          top: {svg: `${LINE("M60 43C60 37 61 32 63.5 27", "#7A4E33", 2.8)}${LG("education-apple-l", [[0, "#A6E07A"], [1, "#5DAE4E"]])}<path d="M62.5 33C66 25 75 22 82 25C79 32 71 36 62.5 33Z" fill="url(#education-apple-l)" ${O2}/><path d="M64.5 32Q72 28.5 79 26" fill="none" stroke="#3F8A3A" stroke-width="1.5" stroke-linecap="round"/>`, pivot: [60, 42]}
        },
        eyes: {lx: 48, rx: 72, y: 72, r: 5.2, style: "dot"},
        mouth: {x: 60, y: 81, w: 3.4},
        cheeks: {lx: 38.5, rx: 81.5, y: 80, w: 5, h: 3, color: "#FFB0B8"},
        anchors: {top: [60, 41, 1], neck: [60, 97, 1.15], chest: [80, 95, 0.72], back: [92, 72, 0.95], hands: [60, 98, 0.9]},
        lines: {
          tap: ["Hi! You're the apple of my eye!", "Gold star for showing up today!", "You're learning so much! Wow!", "Crunch crunch! That's happy noise!", "Teacher's pet? No, YOU'RE the star!", "Every lesson makes you shine!", "You've got this! Apple-solutely!", "So proud of you, friend!"],
          pet: ["Hehe! I'm extra shiny now!", "Aww! My leaf is all wiggly!"],
          hello: ["You're back! Class is so fun now!", "Hi hi! I saved you the front desk!"],
          morning: ["Good morning! Fresh as an apple!", "Rise and shine! New lesson today!"],
          night: ["Class dismissed! Rest well!", "Snuggle in the fruit bowl. Sleep well!"],
          focus: ["Listening closely! You've got this!", "Quiet as a library, right here!"],
          done: ["A+ session! You're AMAZING!", "Session done! Gold stars everywhere!"],
          task: ["Gold star! Done! WOO!", "Yes! Top of the class!", "Checked off! So crisp!", "Another one done! Hooray!"],
          break: ["Recess! Stretch up tall!", "Snack break! Something crunchy?"]
        }
      },
      {
        id: "education-pencil", name: "Scribbles", kind: "Pencil", pose: "stand", wearColor: "#4C7BD9",
        bio: "A cheerful yellow pencil who's sharp, ready and loves a good doodle.",
        idle: ["wave", "topBob", "sway"], cheer: "hop",
        parts: {
          feet: `${LINE("M44.5 92V104M75.5 92V104", "#4A4560", 2.2)}<path d="M37 111.5Q37 104.5 44.5 104.5Q50.5 104.5 51 109Q51 111.5 47.5 111.5Z" fill="#5B8DEF" ${O2}/><path d="M83 111.5Q83 104.5 75.5 104.5Q69.5 104.5 69 109Q69 111.5 72.5 111.5Z" fill="#5B8DEF" ${O2}/>`,
          body: `${LG("education-pencil-g", [[0, "#FFE680"], [0.28, "#FFD84A"], [0.29, "#FFCB2E"], [0.71, "#FFCB2E"], [0.72, "#F3B21E"], [1, "#E8A112"]], 0, 0, 1, 0)}
            <path d="M39 89H81L64 107.5Q60 111.5 56 107.5Z" fill="#F7D7A6" ${O}/>
            <path d="M54.6 103L65.4 103L62.4 107.4Q60 110.2 57.6 107.4Z" fill="#4A4560"/>
            <path d="M39 89H81L64 107.5Q60 111.5 56 107.5Z" fill="none" ${O}/>
            <rect x="38" y="31" width="44" height="60" rx="5" fill="url(#education-pencil-g)" ${O}/>
            <path d="M38.5 89Q43 93 47 89Q51 93 55 89Q59 93 63 89Q67 93 71 89Q75 93 81.5 89" fill="none" ${OW(2.4)}/>
            <path d="M42.5 37V60" stroke="#FFF6C8" stroke-width="2.6" stroke-linecap="round"/>
            ${LG("education-pencil-m", [[0, "#EEF1F7"], [1, "#AEB6CA"]])}
            <rect x="38.5" y="22" width="43" height="11" rx="2.5" fill="url(#education-pencil-m)" ${O}/>
            <path d="M41 27.5H79" stroke="#8A93AB" stroke-width="1.6" stroke-linecap="round"/>`,
          armL: {svg: `${LINE("M39.5 66Q33 70 31 78", "#F3B21E", 2.4)}<circle cx="30.6" cy="80" r="3.6" fill="#FFCB2E" ${O2}/>`, pivot: [40, 66]},
          armR: {svg: `${LINE("M80.5 66Q87 70 89 78", "#F3B21E", 2.4)}<circle cx="89.4" cy="80" r="3.6" fill="#FFCB2E" ${O2}/>`, pivot: [80, 66]},
          top: {svg: `${LG("education-pencil-e", [[0, "#FFC0CF"], [1, "#F48BA6"]])}
            <path d="M40.5 23V18Q40.5 10 48.5 10H71.5Q79.5 10 79.5 18V23Z" fill="url(#education-pencil-e)" ${O}/>
            <path d="M45 18.5Q46 13.5 51 13.5" fill="none" stroke="#FFE6EC" stroke-width="2.6" stroke-linecap="round"/>`, pivot: [60, 23]}
        },
        eyes: {lx: 50, rx: 70, y: 55, r: 4.9, style: "dot"},
        mouth: {x: 60, y: 64, w: 3.2},
        cheeks: {lx: 43, rx: 77, y: 62.5, w: 4.2, h: 2.6, color: "#FF9F8F"},
        anchors: {top: [60, 11, 0.95], neck: [60, 76, 1.05], chest: [72, 82, 0.6], back: [80, 56, 0.8], hands: [60, 80, 0.85]},
        lines: {
          tap: ["Hi! I'm sharpened and ready!", "Scribble scribble! You're amazing!", "Let's write something wonderful!", "You make my eraser blush!", "Doodling hearts for you!", "Sharp mind, big heart! That's you!", "You've got this! Point taken!", "Best notes in the whole class!"],
          pet: ["Hehe! That tickles my eraser!", "Ooh! Freshly sharpened joy!"],
          hello: ["You're back! Let's write!", "Hi! I doodled you a welcome star!"],
          morning: ["Good morning! A fresh blank page!", "Rise and shine! Pencils up!"],
          night: ["Pencil case time. Rest well!", "Lights out, little doodles. Sleep tight!"],
          focus: ["Quiet scribbles! You've got this!", "Writing along softly beside you!"],
          done: ["WOW! That session was a masterpiece!", "Session done! Big gold star!"],
          task: ["Scribble! Done! WOO!", "Yes! Crossed right off!", "Checked off! Sharp work!", "Another one done! Hooray!"],
          break: ["Wiggle break! Shake out the doodles!", "Snack break! Fuel those ideas!"]
        }
      },
      {
        id: "education-bus", name: "Buster", kind: "School Bus", pose: "stand", wearColor: "#3C6FD1",
        bio: "A sunny school bus who picks up good vibes on every study route.",
        idle: ["earTwitch", "wave", "bounce"], cheer: "hop",
        parts: {
          feet: `<rect x="29" y="95" width="16" height="17" rx="6" fill="#3A3650" ${O}/><circle cx="37" cy="104.5" r="3.4" fill="#A9AFC4"/><rect x="75" y="95" width="16" height="17" rx="6" fill="#3A3650" ${O}/><circle cx="83" cy="104.5" r="3.4" fill="#A9AFC4"/>`,
          body: `${LG("education-bus-g", [[0, "#FFE068"], [0.55, "#FFC93A"], [1, "#F2A422"]])}${LG("education-bus-w", [[0, "#E2F6FF"], [1, "#95D2F2"]])}
            <rect x="22" y="24" width="76" height="75" rx="15" fill="url(#education-bus-g)" ${O}/>
            <rect x="29.5" y="31" width="61" height="24" rx="7" fill="url(#education-bus-w)" ${O2}/>
            <path d="M60 31.5V54.5" stroke="${INK}" stroke-width="2.2"/>
            <path d="M34 44L41 35M37.5 46L44 38M64.5 44L71.5 35" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>
            <path d="M24 61H96" stroke="#3A3650" stroke-width="2.2" opacity=".55"/>
            <circle cx="32" cy="83.5" r="4.6" fill="#FFF7D6" ${O2}/><circle cx="88" cy="83.5" r="4.6" fill="#FFF7D6" ${O2}/>
            <circle cx="31" cy="82.4" r="1.4" fill="#fff"/><circle cx="87" cy="82.4" r="1.4" fill="#fff"/>
            <rect x="20" y="91" width="80" height="9" rx="4.5" fill="#4A4F66" ${O}/>
            <path d="M27 93.6H44" stroke="#8A90A8" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M26.5 50Q27 30 38 27.5" fill="none" stroke="#FFF2B0" stroke-width="2.8" stroke-linecap="round" opacity=".9"/>`,
          earL: {svg: `${LINE("M23 40L14 41", "#4A4F66", 1.8)}<rect x="7" y="35" width="8" height="15" rx="3.5" fill="#4A4F66" ${O2}/><path d="M9.6 38.5v5" stroke="#B6E3F7" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [22, 40]},
          earR: {svg: `${LINE("M97 40L106 41", "#4A4F66", 1.8)}<rect x="105" y="35" width="8" height="15" rx="3.5" fill="#4A4F66" ${O2}/><path d="M107.6 38.5v5" stroke="#B6E3F7" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [98, 40]},
          armL: {svg: `${LINE("M23 70L15 70", "#4A4F66", 1.8)}<path d="M5.69 66.14L9.14 62.69H13.86L17.31 66.14V70.86L13.86 74.31H9.14L5.69 70.86Z" fill="#F0525A" ${O2}/><path d="M8 68.5H15" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`, pivot: [23, 70]},
          top: {svg: `<rect x="44" y="15.5" width="32" height="10" rx="4" fill="#4A4F66" ${O2}/><circle cx="51" cy="20.5" r="2.6" fill="#FF7A6A"/><circle cx="69" cy="20.5" r="2.6" fill="#FF7A6A"/><rect x="56" y="18.6" width="8" height="3.8" rx="1.6" fill="#FFD35A"/>`, pivot: [60, 25]}
        },
        eyes: {lx: 47, rx: 73, y: 70.5, r: 5.2, style: "dot"},
        mouth: {x: 60, y: 80, w: 3.4},
        cheeks: {lx: 38.5, rx: 81.5, y: 78.5, w: 4.4, h: 2.7, color: "#FF9A7A"},
        anchors: {top: [60, 22, 1], neck: [60, 96, 1.3], chest: [84, 70, 0.6], back: [96, 50, 0.9], hands: [60, 90, 0.9]},
        lines: {
          tap: ["Beep beep! All aboard the cheer bus!", "Next stop: You being AMAZING!", "Honk honk! So happy you're here!", "You're driving straight to greatness!", "The wheels on the bus go YAY!", "Buckle up! You've got this!", "Best passenger on my whole route!", "Vroom! Look at you go!"],
          pet: ["Honk! That's my happy horn!", "Hehe! My wipers are waving!"],
          hello: ["You're back! Hop on board!", "Beep beep! I saved you a window seat!"],
          morning: ["Good morning! Bus is here! Let's go!", "Rise and shine! Right on schedule!"],
          night: ["Parked for the night. Rest well!", "Engine off, cozy dreams, friend!"],
          focus: ["Smooth ride! You've got this!", "Cruising quietly beside you!"],
          done: ["HONK HONK! What a ride!", "Session done! You arrived in style!"],
          task: ["Beep! Done! WOO!", "Yes! Another stop on the route!", "Checked off! Honk honk!", "Another one done! Hooray!"],
          break: ["Rest stop! Stretch those legs!", "Snack stop! You earned it!"]
        }
      }
    ]
  });

  /* On Air */
  COMP_DATA.push({
    theme: "comms",
    companions: [
      {
        id: "comms-mic", name: "Mic", kind: "Microphone", pose: "stand", wearColor: "#E2577F",
        bio: "A shiny studio mic who amplifies every great idea you have.",
        idle: ["headTilt", "tailSwish", "wave"], cheer: "hop",
        neck: [60, 74],
        parts: {
          tail: {svg: `${LINE("M66 107C80 109 89 105 91 97C93 89 100 87 104 93", "#4A4560", 2.6)}<rect x="101" y="91" width="7" height="9" rx="2" transform="rotate(30 104.5 95.5)" fill="#FF7FA3" ${O2}/>`, pivot: [66, 107]},
          feet: `<path d="M41 105Q60 98.5 79 105Q80 111.5 60 111.5Q40 111.5 41 105Z" fill="#5E5876" ${O}/><path d="M48 104Q54 102.4 60 102.2" fill="none" stroke="#A8A2C2" stroke-width="2" stroke-linecap="round"/>`,
          body: `${LG("comms-mic-b", [[0, "#6E6890"], [1, "#3F3A56"]], 0, 0, 1, 0)}
            <path d="M47 77H73L67.5 100Q66.8 103.5 63 103.5H57Q53.2 103.5 52.5 100Z" fill="url(#comms-mic-b)" ${O}/>
            <path d="M51 81L55 99" stroke="#9C96BC" stroke-width="2.2" stroke-linecap="round"/>
            <rect x="57" y="86" width="6" height="9" rx="3" fill="#2E2A40" ${OW(1.6)}/><circle cx="60" cy="88.8" r="1.8" fill="#7DF2C0"/>
            <rect x="43" y="71" width="34" height="8.5" rx="4.25" fill="#FF7FA3" ${O}/>
            <path d="M47 73.8H58" stroke="#FFD0DE" stroke-width="2" stroke-linecap="round"/>`,
          armL: {svg: `${LINE("M48.5 80Q42 81 38.5 87", "#5E5876", 2.4)}<circle cx="37.6" cy="89" r="3.8" fill="#6E6890" ${O2}/>`, pivot: [48.5, 80]},
          armR: {svg: `${LINE("M71.5 80Q78 81 81.5 87", "#5E5876", 2.4)}<circle cx="82.4" cy="89" r="3.8" fill="#6E6890" ${O2}/>`, pivot: [71.5, 80]},
          head: `${RG("comms-mic-h", [[0, "#FFFFFF"], [0.5, "#E6EAF4"], [1, "#AEB7CF"]], 0.4, 0.34, 0.72)}
            <circle cx="60" cy="46" r="27" fill="url(#comms-mic-h)" ${O}/>
            <g fill="#A3ACC6" opacity=".75"><circle cx="50" cy="25.5" r="1.3"/><circle cx="56.5" cy="23.5" r="1.3"/><circle cx="63.5" cy="23.5" r="1.3"/><circle cx="70" cy="25.5" r="1.3"/><circle cx="76" cy="29.5" r="1.3"/><circle cx="44" cy="29.5" r="1.3"/><circle cx="53" cy="29.5" r="1.3"/><circle cx="60" cy="28.5" r="1.3"/><circle cx="67" cy="29.5" r="1.3"/><circle cx="73" cy="34" r="1.3"/><circle cx="80.5" cy="35" r="1.3"/><circle cx="39.5" cy="35" r="1.3"/><circle cx="47" cy="34" r="1.3"/><circle cx="56.5" cy="33.5" r="1.3"/><circle cx="63.5" cy="33.5" r="1.3"/></g>
            <path d="M33.5 40Q60 44 86.5 40" fill="none" stroke="#A3ACC6" stroke-width="2" stroke-linecap="round"/>
            <ellipse cx="44" cy="31" rx="6" ry="3.4" transform="rotate(-40 44 31)" fill="#fff"/><circle cx="51" cy="25" r="1.6" fill="#fff"/>`
        },
        eyes: {lx: 49.5, rx: 70.5, y: 51, r: 5, style: "dot"},
        mouth: {x: 60, y: 60, w: 3.2},
        cheeks: {lx: 41.5, rx: 78.5, y: 58.5, w: 4.4, h: 2.7, color: "#FF9AB6"},
        anchors: {top: [60, 21, 1], neck: [60, 76, 0.95], chest: [67, 93, 0.55], back: [74, 88, 0.75], hands: [60, 92, 0.85]},
        lines: {
          tap: ["Testing, testing! You're AMAZING!", "Is this thing on? Yes! Hi!", "Amplifying your awesomeness!", "Your ideas sound fantastic!", "Mic check! You've got this!", "Turning the cheer volume all the way up!", "Loud and proud of you!", "Best voice in the whole studio!"],
          pet: ["Hehe! Sweet feedback! The good kind!", "Ooh! That made me hum!"],
          hello: ["You're back! We're live! Hi!", "Welcome back to the show!"],
          morning: ["Good morning, listeners! It's you!", "Rise and shine! Time for the show!"],
          night: ["Signing off softly. Rest well!", "Volume down, cozy dreams, friend!"],
          focus: ["Quiet on set! You've got this!", "Listening softly, right beside you!"],
          done: ["And that's a wrap! WOW!", "Session done! Standing ovation!"],
          task: ["Mic drop! Done! WOO!", "Yes! That's a headline!", "Checked off! Loud cheers!", "Another one done! Encore!"],
          break: ["Station break! Stretch it out!", "Water break! Keep that voice happy!"]
        }
      },
      {
        id: "comms-radio", name: "Dial", kind: "Retro Radio", pose: "stand", wearColor: "#E36A5C",
        bio: "A retro radio who tunes in to your good vibes all day long.",
        idle: ["topBob", "earTwitch", "sway"], cheer: "hop",
        parts: {
          feet: `<rect x="33" y="102" width="12" height="10" rx="4" fill="#C9775E" ${O2}/><rect x="75" y="102" width="12" height="10" rx="4" fill="#C9775E" ${O2}/>`,
          body: `${LG("comms-radio-b", [[0, "#8EDCCF"], [0.55, "#5DBFB1"], [1, "#3E9E92"]])}
            ${SEG("M38 41V33Q38 27 44 27H76Q82 27 82 33V41", "#C9775E", 4)}
            <rect x="20" y="38" width="80" height="67" rx="17" fill="url(#comms-radio-b)" ${O}/>
            <rect x="27.5" y="45.5" width="65" height="52" rx="11" fill="#FFF6E6" ${O2}/>
            <rect x="44" y="83" width="32" height="8.5" rx="4.25" fill="#FFE2A3" ${OW(2.2)}/>
            <path d="M49 85.8v3M54 86.3v2M59 85.8v3M64 86.3v2M69 85.8v3" stroke="#B9874A" stroke-width="1.2" stroke-linecap="round"/>
            <path d="M62 84.4V90.2" stroke="#E2574C" stroke-width="2" stroke-linecap="round"/>
            <circle cx="35" cy="88" r="2.6" fill="#5DBFB1" ${OW(1.6)}/><circle cx="85" cy="88" r="2.6" fill="#5DBFB1" ${OW(1.6)}/>
            <path d="M25 70V52Q25 44 32 42" fill="none" stroke="#C8F2EA" stroke-width="2.8" stroke-linecap="round"/>`,
          earL: {svg: `<circle cx="18.5" cy="71" r="7.2" fill="#FFE6B8" ${O}/><path d="M18.5 71V65.8" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`, pivot: [20, 71]},
          earR: {svg: `<circle cx="101.5" cy="71" r="7.2" fill="#FFE6B8" ${O}/><path d="M101.5 71V65.8" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`, pivot: [100, 71]},
          top: {svg: `${LINE("M80 39L93 16", "#AEB6CA", 2)}<circle cx="94.2" cy="13.4" r="3.8" fill="#FF7F7F" ${O2}/><circle cx="93.2" cy="12.4" r="1.1" fill="#fff"/>`, pivot: [80, 39]}
        },
        eyes: {lx: 47.5, rx: 72.5, y: 60, r: 5, style: "dot"},
        mouth: {x: 60, y: 69, w: 3.2},
        cheeks: {lx: 39, rx: 81, y: 67.5, w: 4.4, h: 2.7, color: "#FF9A8C"},
        anchors: {top: [60, 28, 1], neck: [60, 101, 1.3], chest: [87, 90, 0.6], back: [93, 52, 0.9], hands: [60, 97, 0.9]},
        lines: {
          tap: ["Bzzt! Tuned in to you! Hi!", "Now playing: You being awesome!", "Your vibes are coming in clear!", "Turning the happy up to eleven!", "You're my favorite station!", "Static? Nope! Just cheering!", "You've got this! On every channel!", "Best signal I ever found!"],
          pet: ["Hehe! My knobs are spinning!", "Ooh! Warm and fuzzy reception!"],
          hello: ["You're back! Back on the air!", "Hi! I kept your station saved!"],
          morning: ["Good morning! Morning show time!", "Rise and shine! Sunny forecast!"],
          night: ["Late night smooth tunes. Rest well!", "Soft static lullaby. Sleep tight!"],
          focus: ["Study beats on low. You've got this!", "Humming quietly beside you!"],
          done: ["WOW! Number one hit session!", "Session done! Top of the charts!"],
          task: ["Ding! Done! WOO!", "Yes! That's a chart topper!", "Checked off! Turn it up!", "Another one done! Hooray!"],
          break: ["Dance break! Wiggle to the beat!", "Snack break! Commercial time!"]
        }
      },
      {
        id: "comms-megaphone", name: "Hollar", kind: "Megaphone", pose: "float", wearColor: "#3C6FD1",
        bio: "A peppy megaphone who shouts your wins loud enough for everyone.",
        idle: ["topBob", "wave", "bounce"], cheer: "spin",
        parts: {
          body: `${RG("comms-megaphone-r", [[0, "#FFB3A6"], [0.55, "#FF7A6A"], [1, "#DD4E4C"]], 0.4, 0.34, 0.75)}${RG("comms-megaphone-c", [[0, "#FFFDF6"], [0.6, "#FFEED6"], [1, "#FFCFA6"]], 0.45, 0.46, 0.6)}${LG("comms-megaphone-k", [[0, "#FF8A78"], [1, "#D24A46"]])}
            <rect x="72.5" y="68" width="11" height="30" rx="5" fill="#4A4560" ${O}/>
            <path d="M76 75V91" stroke="#8A84A6" stroke-width="2" stroke-linecap="round"/>
            <path d="M46 24L97 49Q103 50.5 103 56Q103 61.5 97 63L46 90Z" fill="url(#comms-megaphone-k)" ${O}/>
            <path d="M56 30.5L92 48" stroke="#FFD0C6" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M62 82L94 64" stroke="#B83C3C" stroke-width="2" stroke-linecap="round" opacity=".5"/>
            <ellipse cx="102.5" cy="56" rx="3.6" ry="7.4" fill="#4A4560" ${OW(2.4)}/>
            <ellipse cx="46" cy="57" rx="26" ry="33" fill="url(#comms-megaphone-r)" ${O}/>
            <ellipse cx="46" cy="57" rx="22" ry="28.6" fill="none" stroke="#fff" stroke-width="2.2" opacity=".8"/>
            <ellipse cx="46" cy="57" rx="19" ry="25.4" fill="url(#comms-megaphone-c)" ${O2}/>
            <path d="M24.5 45Q27 33 35 27" fill="none" stroke="#FFE2DA" stroke-width="2.8" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="18.5" cy="72" rx="4.6" ry="6.6" transform="rotate(28 18.5 72)" fill="#F06A5E" ${O}/>`, pivot: [23, 68]},
          armR: {svg: `<ellipse cx="70" cy="85" rx="4.6" ry="6.6" transform="rotate(-28 70 85)" fill="#F06A5E" ${O}/>`, pivot: [66, 80]},
          top: {svg: `${LINE("M23 22Q18 25 17 31", "#FFC83A", 2.6)}${LINE("M20 13Q10 18 9 30", "#FFC83A", 2.6)}${LINE("M17 4Q3 11 2 28", "#FFC83A", 2.6)}`, pivot: [22, 28]}
        },
        eyes: {lx: 37.5, rx: 54.5, y: 55, r: 4.8, style: "sparkle"},
        mouth: {x: 46, y: 64.5, w: 3.2},
        cheeks: {lx: 31.5, rx: 60.5, y: 62.5, w: 3.6, h: 2.4, color: "#FF9A9A"},
        anchors: {top: [46, 26, 0.85], neck: [46, 89, 0.85], chest: [82, 60, 0.55], back: [92, 44, 0.75], hands: [46, 83, 0.85]},
        lines: {
          tap: ["HELLO! Hi! You're AMAZING!", "Announcing: You're doing great!", "Loud and proud of you!", "Everyone, look how awesome you are!", "Hey hey! You've got this!", "Turning your wins up to max volume!", "Attention please! Big cheers for you!", "Best news of the day? You're here!"],
          pet: ["Hehe! That made me squeak!", "Ooh! Soft volume, happy me!"],
          hello: ["Attention! My favorite person is back!", "HI HI HI! Welcome back!"],
          morning: ["GOOD MORNING! Big day ahead!", "Rise and shine! Rally time!"],
          night: ["Whisper mode now. Rest well!", "Softest voice: sweet dreams, friend!"],
          focus: ["Whisper cheers! You've got this!", "Volume low, rooting for you!"],
          done: ["BIG NEWS! What a session!", "Session done! Shouting it from rooftops!"],
          task: ["Breaking news! Done! WOO!", "YES! Everyone heard that one!", "Checked off! Big cheers!", "Another one done! HOORAY!"],
          break: ["Stretch break! Big wiggle!", "Water break! Rest that voice!"]
        }
      }
    ]
  });
})();

