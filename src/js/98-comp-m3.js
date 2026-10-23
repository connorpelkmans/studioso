/* ===== module: 98-comp-m3.js ===== */
/* Study Companions, Study Fields batch m3 */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const f = v => Math.round(v * 100) / 100;
  // A frilly oval (tutus, ruffles)
  const puffE = (cx, cy, rx, ry, n, bump = 1.1) => {
    const p = i => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; };
    let d = `M${f(p(0)[0])} ${f(p(0)[1])}`;
    for (let i = 1; i <= n; i++) {
      const a = p(i - 1), b = p(i), r = Math.hypot(b[0] - a[0], b[1] - a[1]) / 2 * bump;
      d += `A${f(r)} ${f(r)} 0 0 1 ${f(b[0])} ${f(b[1])}`;
    }
    return d + "Z";
  };

  /* Civic Square */
  COMP_DATA.push({
    theme: "civics",
    companions: [
      {
        id: "civics-gavel", name: "Gavvy", kind: "Little Gavel", pose: "sit", sleepy: true, wearColor: "#3E7CC4",
        bio: "A cheerful little gavel who taps a happy rap for every win.",
        idle: ["topBob", "bounce", "finWiggle"], cheer: "hop",
        parts: {
          feet: `<path d="M27 101V105.5Q27 111.5 60 111.5Q93 111.5 93 105.5V101Z" fill="#8A5530" ${O}/>
            <ellipse cx="60" cy="101" rx="33" ry="6.4" fill="#C58A55" ${O}/>
            <path d="M36 99.5Q60 96 84 99.5" fill="none" stroke="#E2B07E" stroke-width="2" stroke-linecap="round" opacity=".8"/>`,
          body: `${LG("civics-gavel-g", [[0, "#E9B47C"], [0.5, "#CF9058"], [1, "#A9693A"]])}${LG("civics-gavel-c", [[0, "#C98A52"], [1, "#8E5530"]])}
            <path d="M33 51.5Q60 47.5 87 51.5Q91.5 75 87 98.5Q60 102.5 33 98.5Q28.5 75 33 51.5Z" fill="url(#civics-gavel-g)" ${O}/>
            <path d="M23 46.5Q29 44 35 46.5Q40.5 75 35 103.5Q29 106 23 103.5Q17.5 75 23 46.5Z" fill="url(#civics-gavel-c)" ${O}/>
            <path d="M85 46.5Q91 44 97 46.5Q102.5 75 97 103.5Q91 106 85 103.5Q79.5 75 85 46.5Z" fill="url(#civics-gavel-c)" ${O}/>
            <path d="M39.5 51Q35 75 39.5 99M80.5 51Q85 75 80.5 99" fill="none" stroke="#F2C14E" stroke-width="3.2" stroke-linecap="round"/>
            <path d="M25 56Q23.5 63 24 70" fill="none" stroke="#E6B079" stroke-width="2.6" stroke-linecap="round" opacity=".9"/>
            <path d="M40 91Q60 95 80 91" fill="none" stroke="#B1733F" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>
            <path d="M40 62Q42 56.5 49 56" fill="none" stroke="#FFF1DD" stroke-width="3.2" stroke-linecap="round" opacity=".9"/><circle cx="54" cy="56" r="1.6" fill="#FFF1DD"/>`,
          armL: {svg: `<ellipse cx="15.5" cy="84" rx="5" ry="7" transform="rotate(26 15.5 84)" fill="#B87A45" ${O}/>`, pivot: [21, 80]},
          armR: {svg: `<ellipse cx="104.5" cy="84" rx="5" ry="7" transform="rotate(-26 104.5 84)" fill="#B87A45" ${O}/>`, pivot: [99, 80]},
          top: {svg: `${LINE("M66 50L88 23", "#C68A52", 7.4)}<path d="M71.5 41.5L79 32.5" stroke="#EBC08E" stroke-width="2.2" stroke-linecap="round"/>
            <ellipse cx="90.5" cy="20" rx="6.4" ry="5.6" transform="rotate(-50 90.5 20)" fill="#B87A45" ${O}/><circle cx="88.6" cy="18.4" r="1.7" fill="#F5D6B0"/>
            <path d="M73 35.4L78.8 40.2M75.2 32.7L81 37.5" stroke="#8E5530" stroke-width="2" stroke-linecap="round"/>
            <path d="M59.5 50.5L71.5 50.5L70.3 46.4L60.7 46.4Z" fill="#F2C14E" ${OW(2.2)}/>`, pivot: [65.5, 50]}
        },
        eyes: {lx: 50, rx: 70, y: 70, r: 5, style: "dot", color: "#3A2318"},
        mouth: {x: 60, y: 79, w: 3.2, color: "#3A2318"},
        cheeks: {lx: 42, rx: 78, y: 78, w: 4.6, h: 2.8, color: "#FF9A8E"},
        anchors: {top: [51, 52, 0.92], neck: [60, 96, 1.15], chest: [77, 89, 0.72], back: [93, 70, 0.9], hands: [60, 97, 0.9]},
        lines: {
          tap: ["Tap tap! Hello, my brilliant friend!", "Order of the day: being amazing!", "I rule in your favor, always!", "You make my handle wiggle with joy!", "The case for you is SO strong!", "Every study session counts! Tap!", "Objection! You're too awesome!", "You've got this, I just know it!"],
          pet: ["Hehe! My handle is all wiggly!", "Tap tap! That's my happy rhythm!"],
          hello: ["You're here! This session is in order!", "Hi hi! I saved you the best seat!"],
          morning: ["Good morning! Today's agenda: greatness!", "Rise and shine! Court of awesome is open!"],
          night: ["Adjourned for the night. Rest well!", "Soft taps only now. Sweet dreams!"],
          focus: ["Quiet in the court. You've got this!", "Tapping softly right beside you!"],
          done: ["TAP TAP TAP! What a session!", "Session done! Ruled totally amazing!"],
          task: ["BANG! Done! WOOHOO!", "Case closed! You did it!", "Approved! Stamped! Celebrated!", "Another one done! Tap tap hooray!"],
          break: ["Recess! Go stretch and wiggle!", "Snack recess! You earned it!"]
        }
      },
      {
        id: "civics-scales", name: "Libra", kind: "Scales of Justice", pose: "stand", wearColor: "#5B7FD6",
        bio: "A golden little scale who always finds you perfectly balanced.",
        idle: ["wingFlutter", "topBob", "sway"], cheer: "wingFlutter",
        parts: {
          feet: `<path d="M36 105Q36 100 44 100H76Q84 100 84 105V107Q84 111.5 76 111.5H44Q36 111.5 36 107Z" fill="#D9A033" ${O}/>
            <path d="M42 104.5H58" stroke="#FFE7A0" stroke-width="2.2" stroke-linecap="round"/>`,
          body: `${RG("civics-scales-g", [[0, "#FFF2C2"], [0.5, "#F8D371"], [1, "#DDA43A"]], 0.4, 0.4, 0.75)}
            <path d="M60 40C65 40 67 44 67 49C80 52 85 63 85 75C85 90 75 101 60 101C45 101 35 90 35 75C35 63 40 52 53 49C53 44 55 40 60 40Z" fill="url(#civics-scales-g)" ${O}/>
            <path d="M42 92Q60 99 78 92" fill="none" stroke="#C48A2C" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>
            <path d="M41 70Q42 61 49 56" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".9"/><circle cx="41" cy="76" r="1.6" fill="#fff" opacity=".85"/>`,
          armL: {svg: `${LINE("M55 47.5H18", "#E8B445", 3.4)}${LINE("M18 49L8 76M18 49L28 76", "#C9962E", 1.2)}
            <path d="M5 75.5H31Q30 87 18 87Q6 87 5 75.5Z" fill="#F4C556" ${O}/><path d="M9.5 79.5Q12 83.5 17 84" fill="none" stroke="#FFF0BF" stroke-width="2" stroke-linecap="round"/>
            <circle cx="18" cy="47.5" r="3" fill="#F4C556" ${OW(2)}/>`, pivot: [56, 47.5]},
          armR: {svg: `${LINE("M65 47.5H102", "#E8B445", 3.4)}${LINE("M102 49L92 76M102 49L112 76", "#C9962E", 1.2)}
            <path d="M89 75.5H115Q114 87 102 87Q90 87 89 75.5Z" fill="#F4C556" ${O}/><path d="M93.5 79.5Q96 83.5 101 84" fill="none" stroke="#FFF0BF" stroke-width="2" stroke-linecap="round"/>
            <circle cx="102" cy="47.5" r="3" fill="#F4C556" ${OW(2)}/>`, pivot: [64, 47.5]},
          top: {svg: `<path d="M60 22L63 32H57Z" fill="#F4C556" ${OW(2)}/><circle cx="60" cy="37" r="5.4" fill="#F8D371" ${O}/><circle cx="58.4" cy="35.4" r="1.6" fill="#fff"/>`, pivot: [60, 42]}
        },
        eyes: {lx: 51, rx: 69, y: 75, r: 4.8, style: "dot", color: "#3A2A14"},
        mouth: {x: 60, y: 84, w: 3, color: "#3A2A14"},
        cheeks: {lx: 43, rx: 77, y: 83, w: 4.4, h: 2.7, color: "#FF9C8A"},
        anchors: {top: [60, 41, 0.85], neck: [60, 97, 1.05], chest: [75, 90, 0.68], back: [84, 70, 0.85], hands: [60, 96, 0.9]},
        lines: {
          tap: ["Hi hi! You tip my scales toward joy!", "Perfectly balanced, just like you!", "Study and rest? Beautiful balance!", "The evidence is in: you're amazing!", "Fair and square, you're a superstar!", "I weighed it up: you've got this!", "My pans are swinging with happiness!", "Justice for snacks and good notes!"],
          pet: ["Wheee! My pans are all a-sway!", "Hehe! I feel so balanced now!"],
          hello: ["You're back! My scales just lit up!", "Hi! Everything feels balanced now!"],
          morning: ["Good morning! A fair and sunny start!", "Rise and shine! Let's weigh in on today!"],
          night: ["Balance means rest too. Sleep well!", "Scales settled for the night. Rest!"],
          focus: ["Steady and level. You've got this!", "Holding perfectly still beside you!"],
          done: ["Wow! That session tipped to AMAZING!", "Session done! Perfectly balanced work!"],
          task: ["Done! The scales say WOOHOO!", "Yes! Weighed and wonderful!", "Checked off! Fair and fabulous!", "Another one done! Hooray for you!"],
          break: ["Rest pan, study pan. Balance time!", "Stretch break! Sway side to side!"]
        }
      },
      {
        id: "civics-ballot", name: "Votey", kind: "Ballot Box", pose: "stand",
        bio: "A bright little ballot box who votes for you every single time.",
        idle: ["topBob", "wave", "bounce"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="45" cy="109.5" rx="7.4" ry="3.9" fill="#4F72B8" ${O}/><ellipse cx="75" cy="109.5" rx="7.4" ry="3.9" fill="#4F72B8" ${O}/>`,
          body: `${LG("civics-ballot-g", [[0, "#B7D3F8"], [0.55, "#90B4EE"], [1, "#6E95DC"]])}
            <rect x="27" y="55" width="66" height="52" rx="8" fill="url(#civics-ballot-g)" ${O}/>
            <path d="M33 44H87Q91 44 92.5 47.5L95 56H25L27.5 47.5Q29 44 33 44Z" fill="#E1ECFD" ${O}/>
            <rect x="45" y="47.3" width="30" height="4.4" rx="2.2" fill="${INK}"/>
            <rect x="46" y="88.5" width="28" height="12" rx="4" fill="#F7FAFF" ${OW(2.2)}/>
            <path d="M54.5 94.5L58.5 98L66 91" fill="none" stroke="#4FB07E" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M32.5 76V64Q32.5 60.5 36 60.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".85"/><circle cx="32.5" cy="81.5" r="1.6" fill="#fff" opacity=".8"/>`,
          armL: {svg: `<ellipse cx="22.5" cy="84" rx="5.2" ry="7" transform="rotate(26 22.5 84)" fill="#7FA3E4" ${O}/>`, pivot: [29, 80]},
          armR: {svg: `<ellipse cx="97.5" cy="84" rx="5.2" ry="7" transform="rotate(-26 97.5 84)" fill="#7FA3E4" ${O}/>`, pivot: [91, 80]},
          top: {svg: `<path d="M50.5 50L48.5 27.5Q48.3 25 50.8 24.8L68.6 23.6Q71.1 23.4 71.3 25.9L72.5 50Z" fill="#FFFDF6" ${OW(2.4)}/>
            <rect x="52.5" y="29" width="6" height="6" rx="1.4" fill="#FFE3EA" stroke="#E46E8E" stroke-width="1.6"/>
            <path d="M53.6 31.8L55.4 33.6L58.6 29.8" fill="none" stroke="#E0517A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M61 31.4H67.5M53 39.4H67.8M53.4 44.2H64" stroke="#C7C1D3" stroke-width="1.8" stroke-linecap="round"/>
            <rect x="45" y="47.3" width="30" height="4.4" rx="2.2" fill="${INK}"/>`, pivot: [60, 50]}
        },
        eyes: {lx: 49, rx: 71, y: 72, r: 5, style: "dot", color: "#1F2A4A"},
        mouth: {x: 60, y: 81, w: 3.2, color: "#1F2A4A"},
        cheeks: {lx: 39.5, rx: 80.5, y: 80, w: 4.6, h: 2.8, color: "#FF9FB7"},
        anchors: {top: [60, 46, 0.95], neck: [60, 92, 1.15], chest: [80, 99, 0.7], back: [91, 74, 0.95], hands: [60, 98, 0.9]},
        lines: {
          tap: ["Hi hi! I vote for YOU! Every time!", "Unanimous! You're doing amazing!", "Your ideas count, and so do you!", "All in favor of you? Every hand up!", "A landslide of cheers, just for you!", "Pop in a question, I love those!", "Look at you, showing up again!", "You've got my vote, superstar!"],
          pet: ["Hehe! My slot is smiling!", "Eek! My little ballot is wiggling!"],
          hello: ["You're back! The cheers are counted!", "Hello! Polls say I missed you lots!"],
          morning: ["Good morning! Today wins my vote!", "Rise and shine! Let's make it count!"],
          night: ["Polls are closed. Time to rest!", "Counting stars, not votes. Sleep well!"],
          focus: ["Quiet counting. You've got this!", "Right here, cheering on the down low!"],
          done: ["Results are in: AMAZING session!", "Session done! Unanimous applause!"],
          task: ["DONE! The crowd goes WILD!", "Yes! That one won by a mile!", "Checked off! Ballot of joy!", "Another one done! Hip hip hooray!"],
          break: ["Stretch break! All arms up, yay!", "Snack break! Motion carried!"]
        }
      }
    ]
  });

  /* Case Room */
  COMP_DATA.push({
    theme: "justice",
    companions: [
      {
        id: "justice-beagle", name: "Sleuth", kind: "Detective Beagle", pose: "stand",
        bio: "A trench-coated beagle who sniffs out clues and finds your best ideas.",
        idle: ["earTwitch", "tailSwish", "headTilt"], cheer: "hop",
        neck: [60, 72],
        parts: {
          tail: {svg: `${LINE("M78 98C88 96 94 88 93 78", "#9A6238", 4.6)}${LINE("M93.2 80.5C93.4 78.5 93.2 76.6 92.8 75", "#FFF8EE", 4.6)}`, pivot: [78, 99]},
          feet: `<ellipse cx="49" cy="108.8" rx="8" ry="4.4" fill="#FFF8EE" ${O}/><ellipse cx="71" cy="108.8" rx="8" ry="4.4" fill="#FFF8EE" ${O}/>`,
          body: `${LG("justice-beagle-c", [[0, "#E9CC92"], [0.6, "#D6B178"], [1, "#BF955C"]])}
            <path d="M60 68C76 68 84 81 85 94C86 105 78 110 60 110C42 110 34 105 35 94C36 81 44 68 60 68Z" fill="url(#justice-beagle-c)" ${O}/>
            <path d="M53 69L60 84L67 69Z" fill="#FFF8EE"/>
            <path d="M51 69.5L60 86L55 89L44.5 74Z" fill="#C79E62" ${OW(2.2)}/><path d="M69 69.5L60 86L65 89L75.5 74Z" fill="#C79E62" ${OW(2.2)}/>
            <path d="M36.5 98Q60 104.5 83.5 98" fill="none" stroke="${INK}" stroke-width="7.4" stroke-linecap="round"/>
            <path d="M36.5 98Q60 104.5 83.5 98" fill="none" stroke="#A47A42" stroke-width="4.4" stroke-linecap="round"/>
            <rect x="56" y="97.6" width="8" height="6.2" rx="1.6" fill="#F2C14E" ${OW(1.6)}/>
            <circle cx="54" cy="92" r="1.8" fill="#8E6A3A"/><circle cx="66" cy="92" r="1.8" fill="#8E6A3A"/>
            <path d="M41 88Q42 80 47 76" fill="none" stroke="#FFF3D6" stroke-width="2.8" stroke-linecap="round" opacity=".85"/>`,
          armL: {svg: `<path d="M42 78C34 84 31 94 33 100C38 102 43 95 45 86Z" fill="#D2AB70" ${O}/><circle cx="33.5" cy="101" r="4.2" fill="#FFF8EE" ${OW(2.4)}/>`, pivot: [43, 79]},
          armR: {svg: `<path d="M78 78C86 84 89 94 87 100C82 102 77 95 75 86Z" fill="#D2AB70" ${O}/><circle cx="86.5" cy="101" r="4.2" fill="#FFF8EE" ${OW(2.4)}/>`, pivot: [77, 79]},
          earL: {svg: `<path d="M39 33C27 33 20 47 20.5 61C21 70.5 29 74 33.5 68C38.5 60.5 42 46 42 38Z" fill="#8E5632" ${O}/><path d="M26 50Q25 58 27 64" fill="none" stroke="#B57A4E" stroke-width="2.2" stroke-linecap="round"/>`, pivot: [39, 36]},
          earR: {svg: `<path d="M81 33C93 33 100 47 99.5 61C99 70.5 91 74 86.5 68C81.5 60.5 78 46 78 38Z" fill="#8E5632" ${O}/>`, pivot: [81, 36]},
          head: `${RG("justice-beagle-h", [[0, "#F2C18A"], [0.6, "#DDA064"], [1, "#C2804A"]], 0.42, 0.36, 0.72)}
            <ellipse cx="60" cy="50" rx="25" ry="22" fill="url(#justice-beagle-h)" ${O}/>
            <path d="M60 30C62.5 30 63.5 37 63.5 43C63.5 47 70 51 72 57C72.5 65 67 70.5 60 70.5C53 70.5 47.5 65 48 57C50 51 56.5 47 56.5 43C56.5 37 57.5 30 60 30Z" fill="#FFF8EE"/>
            <ellipse cx="60" cy="50" rx="25" ry="22" fill="none" ${O}/>
            <path d="M41 45Q43 37 50 33" fill="none" stroke="#FFE6C2" stroke-width="3" stroke-linecap="round" opacity=".9"/>`,
          face: `<ellipse cx="60" cy="57.5" rx="4.6" ry="3.2" fill="${INK}"/><ellipse cx="58.6" cy="56.6" rx="1.5" ry=".9" fill="#fff" opacity=".85"/><path d="M60 60.5V62.2" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`
        },
        eyes: {lx: 48.5, rx: 71.5, y: 49, r: 4.6, style: "dot", color: "#2A1A12"},
        mouth: {x: 60, y: 63.2, w: 2.8, color: "#2A1A12", style: "cat"},
        cheeks: {lx: 44, rx: 76, y: 58.5, w: 4.2, h: 2.6, color: "#FF9C8A"},
        anchors: {top: [60, 30, 1], neck: [60, 71, 1.05], chest: [73, 93, 0.7], back: [84, 86, 0.9], hands: [60, 95, 0.95]},
        lines: {
          tap: ["Sniff sniff! I smell a superstar!", "Clue found: you're doing amazing!", "Elementary! You've totally got this!", "My nose never lies. You're brilliant!", "Every note is a clue. Keep going!", "Woof! Another mystery cracked open!", "Following the trail right beside you!", "The evidence says you're awesome!"],
          pet: ["Hehe! My ears are flopping happily!", "Woof woof! Best pats in the whole case!"],
          hello: ["You're back! My tail solved that one!", "Hi hi! I've been sniffing you out!"],
          morning: ["Good morning, partner! New case today!", "Rise and shine! Fresh clues await!"],
          night: ["Case files away. Time to rest!", "Cozy coat, sleepy nose. Sweet dreams!"],
          focus: ["Nose down, on the trail. You've got this!", "Quiet sleuthing, right beside you!"],
          done: ["Woof! What a brilliant session!", "Session done! Top detective work!"],
          task: ["CASE CLOSED! WOOHOO!", "Solved it! You're a genius!", "Checked off! Tail wags galore!", "Another one cracked! Hooray!"],
          break: ["Sniff around and stretch! Wiggle!", "Snack break! Treats for detectives!"]
        }
      },
      {
        id: "justice-lens", name: "Lens", kind: "Magnifying Glass", pose: "float", wearColor: "#C2563F",
        bio: "A bright little magnifying glass who notices every good thing you do.",
        idle: ["sparkle", "tailSwish", "sway"], cheer: "spin",
        parts: {
          tail: {svg: `${LINE("M84 80L98 95", "#F2C14E", 8.4)}${LINE("M88 84.5L101 98.5", "#9A5A3C", 7)}<path d="M93 89.5L99.5 96.5" stroke="#C58360" stroke-width="2" stroke-linecap="round"/>`, pivot: [81, 77]},
          body: `${LG("justice-lens-r", [[0, "#FFE59A"], [0.5, "#F2C14E"], [1, "#C98A2E"]], 0, 0, 1, 1)}${RG("justice-lens-g", [[0, "#FFFFFF"], [0.55, "#E6F6FF"], [1, "#B5DDF2"]], 0.45, 0.4, 0.7)}
            <circle cx="60" cy="56" r="30" fill="url(#justice-lens-r)" ${O}/>
            <circle cx="60" cy="56" r="23" fill="url(#justice-lens-g)" ${OW(2.4)}/>
            <path d="M34.5 44Q39 33 49 28.5" fill="none" stroke="#FFF6D2" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M41 47Q43.5 39 51 35.5" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="40.5" cy="53.5" r="2" fill="#fff"/>
            <path d="M68 76Q76 73 79.5 66" fill="none" stroke="#9FCBE4" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`,
          armL: {svg: `<ellipse cx="27" cy="68" rx="4.6" ry="6" transform="rotate(28 27 68)" fill="#E8B445" ${O}/>`, pivot: [33, 65]},
          armR: {svg: `<ellipse cx="93" cy="64" rx="4.6" ry="6" transform="rotate(-28 93 64)" fill="#E8B445" ${O}/>`, pivot: [87, 61]}
        },
        eyes: {lx: 50.5, rx: 69.5, y: 55, r: 6.2, style: "round", color: "#2B3550"},
        mouth: {x: 60, y: 66, w: 3, color: "#2B3550"},
        cheeks: {lx: 43, rx: 77, y: 64.5, w: 4.2, h: 2.6, color: "#FFA3B8"},
        anchors: {top: [60, 28, 0.95], neck: [60, 86, 0.95], chest: [73, 79, 0.6], back: [84, 50, 0.8], hands: [60, 84, 0.85]},
        lines: {
          tap: ["Ooh! Up close, you're even more amazing!", "I spy a brilliant mind! It's you!", "Zooming in on your awesome work!", "Every tiny detail you do sparkles!", "Look closer! See? Pure progress!", "I notice everything, and I'm SO proud!", "Hi hi! You look great from here!", "Focus magnified! You've got this!"],
          pet: ["Hehe! My glass is all shiny now!", "Wheee! Everything looks rosy!"],
          hello: ["You're back! I spotted you instantly!", "Hi! My lens lit right up!"],
          morning: ["Good morning! Today looks crystal clear!", "Rise and shine! Let's look closely!"],
          night: ["Lens dimming low. Time to rest!", "Even sharp eyes need sleep. Night!"],
          focus: ["Zoomed in with you. You've got this!", "Sharp and steady, right beside you!"],
          done: ["Wow! Magnificent session, magnified!", "Session done! I saw every bit of it!"],
          task: ["DONE! Zoom in on that WIN!", "Yes! Spotted another finished task!", "Checked off! Clearly brilliant!", "Another one done! Shine shine!"],
          break: ["Eye break! Look far away, ahh!", "Stretch break! Twirl around!"]
        }
      },
      {
        id: "justice-print", name: "Whorl", kind: "Fingerprint Sprite", pose: "float",
        bio: "A swirly fingerprint sprite proving no one studies quite like you.",
        idle: ["sparkle", "topBob", "wave"], cheer: "spin",
        parts: {
          body: `${RG("justice-print-g", [[0, "#FFFFFF"], [0.5, "#E6E9FF"], [1, "#BCC3F4"]], 0.42, 0.36, 0.75)}
            <path d="M60 29C80 29 90 48 90 66C90 86 78 97 60 97C42 97 30 86 30 66C30 48 40 29 60 29Z" fill="url(#justice-print-g)" ${O}/>
            <g fill="none" stroke="#9EA7EA" stroke-width="2.1" stroke-linecap="round">
              <path d="M35.5 76C33 52 45 35.5 60 35.5C75 35.5 87 52 84.5 76"/>
              <path d="M41 70C40 54 48.5 41.5 60 41.5C71.5 41.5 80 54 79 70"/>
              <path d="M47 56.5C48.5 50.5 53.5 47 60 47C66.5 47 71.5 50.5 73 56.5"/>
              <path d="M55.5 54C55.5 52 57.5 51.6 60 51.6C62.5 51.6 64.5 52.4 64.2 54.6"/>
              <path d="M37.5 84.5Q60 98 82.5 84.5M45.5 91Q60 96 74.5 91"/>
            </g>
            <path d="M36.5 56Q38.5 44 46.5 38" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="30" cy="76" rx="4.8" ry="6.4" transform="rotate(28 30 76)" fill="#C7CDF7" ${O}/>`, pivot: [36, 73]},
          armR: {svg: `<ellipse cx="90" cy="76" rx="4.8" ry="6.4" transform="rotate(-28 90 76)" fill="#C7CDF7" ${O}/>`, pivot: [84, 73]},
          top: {svg: `${LINE("M60 31C59 24 63 20 67 22C70.5 24 69 29 65.5 28.5", "#8C98E6", 2.6)}`, pivot: [60, 32]}
        },
        eyes: {lx: 50.5, rx: 69.5, y: 63, r: 5, style: "sparkle", color: "#262A5C"},
        mouth: {x: 60, y: 72.5, w: 3, color: "#262A5C"},
        cheeks: {lx: 42.5, rx: 77.5, y: 71, w: 4.4, h: 2.7, color: "#FF9FC2"},
        anchors: {top: [60, 33, 0.95], neck: [60, 91, 1], chest: [73, 84, 0.64], back: [86, 58, 0.85], hands: [60, 88, 0.85]},
        lines: {
          tap: ["Hi hi! There's only ONE you!", "Your study style is one of a kind!", "Swirly happy hello to you!", "You leave sparkles on everything!", "Proof you're amazing: right here!", "I'm swirling with pride for you!", "Unique, brilliant and doing great!", "You've got this, my one and only!"],
          pet: ["Hehe! My swirls are all wiggly!", "Ooh! That made me swirl with joy!"],
          hello: ["You're back! I knew it was you!", "Hi! I'd know you anywhere!"],
          morning: ["Good morning! A brand new swirl of a day!", "Rise and shine! Leave your mark today!"],
          night: ["Swirling down slow. Time to rest!", "Soft swirls, sweet dreams. Night!"],
          focus: ["Quiet little swirls. You've got this!", "Floating softly right beside you!"],
          done: ["Wow! A one-of-a-kind session!", "Session done! Totally your style!"],
          task: ["DONE! Swirl swirl WOOHOO!", "Yes! Your mark is on that one!", "Checked off! Signed and sealed!", "Another one done! Twirl time!"],
          break: ["Twirl and stretch! Wheee!", "Wiggle your fingers! Break time!"]
        }
      }
    ]
  });

  /* Writer's Retreat */
  COMP_DATA.push({
    theme: "writing",
    companions: [
      {
        id: "writing-typewriter", name: "Clack", kind: "Typewriter", pose: "sit", sleepy: true, wearColor: "#D9705A",
        bio: "A vintage typewriter who clacks out cheers for every word you write.",
        idle: ["topBob", "bounce", "wave"], cheer: "hop",
        parts: {
          feet: `<rect x="31" y="104" width="14" height="6.5" rx="3.2" fill="#3F6F68" ${O}/><rect x="75" y="104" width="14" height="6.5" rx="3.2" fill="#3F6F68" ${O}/>`,
          body: `${LG("writing-typewriter-g", [[0, "#A8E0D3"], [0.5, "#7FC8B8"], [1, "#58A898"]])}
            ${LINE("M24 42L13 32", "#C9D1DC", 2.2)}<circle cx="11.5" cy="30.5" r="3.2" fill="#E8EDF3" ${OW(2.2)}/>
            <path d="M36 46H84Q92 46 93 54L97 98Q98 107 88 107H32Q22 107 23 98L27 54Q28 46 36 46Z" fill="url(#writing-typewriter-g)" ${O}/>
            <path d="M27.3 85H92.7L94.6 100Q95.2 104.5 89 104.5H31Q24.8 104.5 25.4 100Z" fill="#3F8B7E"/>
            <g fill="#FFF6E3" ${OW(1.6)}><circle cx="35" cy="91" r="3"/><circle cx="43.3" cy="91" r="3"/><circle cx="51.6" cy="91" r="3"/><circle cx="60" cy="91" r="3"/><circle cx="68.4" cy="91" r="3"/><circle cx="76.7" cy="91" r="3"/><circle cx="85" cy="91" r="3"/>
              <circle cx="39" cy="99" r="3"/><circle cx="47.4" cy="99" r="3"/><circle cx="72.6" cy="99" r="3"/><circle cx="81" cy="99" r="3"/></g>
            <rect x="53" y="96.2" width="14" height="5.6" rx="2.8" fill="#FFF6E3" ${OW(1.6)}/>
            <rect x="21" y="37.5" width="78" height="10.5" rx="5.2" fill="#3A3450" ${O}/>
            <path d="M27 40.5H92" stroke="#7D7598" stroke-width="2" stroke-linecap="round"/>
            <circle cx="17" cy="42.8" r="5.4" fill="#E8EDF3" ${O}/><circle cx="103" cy="42.8" r="5.4" fill="#E8EDF3" ${O}/>
            <path d="M31.5 66Q32 57 37 52" fill="none" stroke="#E6FFF8" stroke-width="3.2" stroke-linecap="round" opacity=".9"/><circle cx="30.8" cy="72" r="1.6" fill="#E6FFF8"/>`,
          armL: {svg: `<ellipse cx="20" cy="80" rx="5.2" ry="7.2" transform="rotate(26 20 80)" fill="#6DBBAA" ${O}/>`, pivot: [26.5, 76]},
          armR: {svg: `<ellipse cx="100" cy="80" rx="5.2" ry="7.2" transform="rotate(-26 100 80)" fill="#6DBBAA" ${O}/>`, pivot: [93.5, 76]},
          top: {svg: `<path d="M41 38.6V20Q41 16.5 44.5 16.5H75.5Q79 16.5 79 20V38.6Z" fill="#FFFDF6" ${OW(2.4)}/>
            <path d="M46 22.5H72M46 27.5H66M46 32.5H62" stroke="#B9B2C4" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M70.5 30.5c-1.4-1.6-3.6-.4-2.6 1.4l2.6 2.6l2.6-2.6c1-1.8-1.2-3-2.6-1.4Z" fill="#F07A98"/>`, pivot: [60, 39]}
        },
        eyes: {lx: 49, rx: 71, y: 64, r: 5, style: "dot", color: "#1E3A36"},
        mouth: {x: 60, y: 73, w: 3.2, color: "#1E3A36"},
        cheeks: {lx: 39.5, rx: 80.5, y: 72, w: 4.6, h: 2.8, color: "#FF9A9A"},
        anchors: {top: [60, 37, 1], neck: [60, 84, 1.2], chest: [82, 77, 0.66], back: [92, 66, 0.9], hands: [60, 92, 0.9]},
        lines: {
          tap: ["Clack clack! Hello, my favorite writer!", "Every word you type makes me sing!", "Ding! New line, new brilliant idea!", "Your sentences sparkle today!", "Keep the keys clacking! You're great!", "I love your words SO much!", "A little draft is a big start!", "Clackety cheers just for you!"],
          pet: ["Ding ding! That tickles my keys!", "Hehe! My platen is all spinny!"],
          hello: ["You're back! Fresh page, loaded!", "Clack! Hi hi! I missed your words!"],
          morning: ["Good morning! Chapter one of today!", "Rise and shine! The page is waiting!"],
          night: ["Last line of the night. Rest well!", "Covers on, keys quiet. Sweet dreams!"],
          focus: ["Soft little clacks. You've got this!", "Typing quietly right beside you!"],
          done: ["DING! What a beautiful session!", "Session done! What a chapter!"],
          task: ["CLACK! DING! DONE! WOO!", "Yes! The end of that one!", "Checked off! Bravo, author!", "Another one done! Ding ding!"],
          break: ["Shake out those hands! Wiggle!", "Tea break! Let the words steep!"]
        }
      },
      {
        id: "writing-raven", name: "Poe", kind: "Little Raven", pose: "stand", wearColor: "#E0A84A",
        bio: "A fluffy little raven who adores stories and quoths only cheers.",
        idle: ["wingFlutter", "tailSwish", "topBob"], cheer: "wingFlutter",
        parts: {
          tail: {svg: `<path d="M78 92C90 93 99 100 103 109C95 111 85 108 78 101Z" fill="#2C2F52" ${O}/><path d="M84 98Q92 101 98 107" fill="none" stroke="#5C5F96" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [80, 97]},
          feet: `<path d="M44 110.5Q49 104 55 110.5Q49.5 113 44 110.5Z" fill="#F4B860" ${O2}/><path d="M65 110.5Q71 104 76 110.5Q70.5 113 65 110.5Z" fill="#F4B860" ${O2}/>`,
          body: `${LG("writing-raven-g", [[0, "#5D628F"], [0.55, "#43476F"], [1, "#2E3155"]])}
            <path d="M60 30C82 30 92 50 92 72C92 96 80 109 60 109C40 109 28 96 28 72C28 50 38 30 60 30Z" fill="url(#writing-raven-g)" ${O}/>
            <ellipse cx="60" cy="91" rx="18" ry="14" fill="#6A70A4" opacity=".7"/>
            <path d="M52 87l3 3l3-3M62 87l3 3l3-3M57 95l3 3l3-3" fill="none" stroke="#8C92C6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M40 46Q46 37 55 34" fill="none" stroke="#A99BEA" stroke-width="3.2" stroke-linecap="round" opacity=".9"/><circle cx="37" cy="53" r="1.7" fill="#A99BEA"/>`,
          armL: {svg: `<path d="M32 60C22 68 20 86 28 98C36 93 38 74 32 60Z" fill="#262946" ${O}/><path d="M29 72Q26.5 81 29 89" fill="none" stroke="#5C5F96" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [32, 62]},
          armR: {svg: `<path d="M88 60C98 68 100 86 92 98C84 93 82 74 88 60Z" fill="#262946" ${O}/><path d="M91 72Q93.5 81 91 89" fill="none" stroke="#5C5F96" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [88, 62]},
          top: {svg: `<path d="M55 33C52 25 54 19 58 17C57.5 22 59.5 27 61 31.5Z" fill="#3A3E66" ${O2}/><path d="M60 32C61 24 66 20 70.5 20.5C67.5 24 66.5 28 65.5 33Z" fill="#3A3E66" ${O2}/>`, pivot: [60, 33]}
        },
        eyes: {lx: 48.5, rx: 71.5, y: 56, r: 6.6, style: "round", color: "#2B2233"},
        mouths: {
          neutral: `<path d="M55.2 65Q60 63 64.8 65L60 72.5Z" fill="#F4B860" ${OW(2)}/>`,
          smile: `<path d="M54.8 64.6Q60 62.4 65.2 64.6L60 72Z" fill="#F7C673" ${OW(2)}/><path d="M52.2 68q2 1.6 4 .4M67.8 68q-2 1.6 -4 .4" fill="none" stroke="#FFE3B0" stroke-width="1.6" stroke-linecap="round"/>`,
          open: `<path d="M55.4 67.4L64.6 67.4L60 72.6Z" fill="#FF8FA8" ${OW(1.8)}/><path d="M54.8 64Q60 62 65.2 64L60 67.8Z" fill="#F4B860" ${OW(2)}/><path d="M56.4 70L63.6 70L60 75.2Z" fill="#F4B860" ${OW(2)}/>`,
          sleepy: `<path d="M55.8 65.4Q60 63.8 64.2 65.4L60 71.4Z" fill="#E0A04E" ${OW(2)}/>`
        },
        mouth: {x: 60, y: 68, w: 3},
        cheeks: {lx: 39, rx: 81, y: 67, w: 4.6, h: 2.8, color: "#FF8FB0"},
        anchors: {top: [60, 32, 1], neck: [60, 78, 1.3], chest: [74, 95, 0.78], back: [90, 74, 0.9], hands: [60, 92, 0.95]},
        lines: {
          tap: ["Caw caw! Hello, my favorite author!", "Quoth the raven: you're AMAZING!", "Your story gets better every day!", "Flapping happy wings for you!", "Every page you read makes me glow!", "Caw! That idea is pure poetry!", "I'd write a whole ode to you!", "You've got this, my brilliant friend!"],
          pet: ["Caw! My feathers are all fluffed!", "Hehe! Softest pats, nevermore sad!"],
          hello: ["You're back! A new chapter begins!", "Caw caw! I've been waiting on my perch!"],
          morning: ["Good morning! Today is a fresh page!", "Rise and shine! Let's write a good one!"],
          night: ["Moonlit hush. Time to rest, friend!", "Tucking my beak in. Sweet dreams!"],
          focus: ["Quiet as a library. You've got this!", "Perched right beside you, cheering!"],
          done: ["Caw caw! What a poetic session!", "Session done! A true masterpiece!"],
          task: ["CAW! DONE! WOOHOO!", "Yes! Another chapter finished!", "Checked off! Bravo, bravo!", "Another one done! Flap flap!"],
          break: ["Stretch those wings! Flap flap!", "Tea and a cozy break! Caw!"]
        }
      },
      {
        id: "writing-pen", name: "Penn", kind: "Fountain Pen", pose: "float",
        bio: "A jolly fountain pen who signs every finished task with a flourish.",
        idle: ["sparkle", "sway", "wave"], cheer: "spin",
        parts: {
          tail: {svg: `${LINE("M61 113C64 117 70 117 72 113C73.5 110 70.5 108 69 110.5", "#6A7BE0", 2.2)}`, pivot: [61, 112]},
          body: `${LG("writing-pen-g", [[0, "#F4AACB"], [0.5, "#D46E9C"], [1, "#A6487D"]], 0, 0, 1, 0)}${LG("writing-pen-n", [[0, "#FFE7A0"], [1, "#D9A033"]])}
            <path d="M51 99H69L61.5 113.4Q60 116 58.5 113.4Z" fill="url(#writing-pen-n)" ${O}/>
            <path d="M60 104.6V112" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/><circle cx="60" cy="104" r="1.5" fill="${INK}"/>
            <path d="M47 92H73L69 100H51Z" fill="#3A3450" ${O}/>
            <path d="M38 58H82V82Q82 93 70 94H50Q38 93 38 82Z" fill="url(#writing-pen-g)" ${O}/>
            <path d="M38 58V34Q38 21 60 21Q82 21 82 34V58Z" fill="url(#writing-pen-g)" ${O}/>
            <rect x="35.5" y="53.5" width="49" height="7" rx="3.5" fill="#F2C14E" ${O}/>
            <path d="M41 55.6H56" stroke="#FFF1C2" stroke-width="1.8" stroke-linecap="round"/>
            <rect x="72.5" y="25" width="5" height="25" rx="2.5" fill="#F2C14E" ${OW(2)}/><circle cx="75" cy="49" r="3.2" fill="#F8D371" ${OW(2)}/>
            <path d="M43.5 47V34Q43.5 28 49.5 26" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>
            <path d="M43 82V67" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45"/>`,
          armL: {svg: `<ellipse cx="34" cy="78" rx="4.6" ry="6.4" transform="rotate(28 34 78)" fill="#CE6596" ${O}/>`, pivot: [39.5, 74]},
          armR: {svg: `<ellipse cx="86" cy="78" rx="4.6" ry="6.4" transform="rotate(-28 86 78)" fill="#CE6596" ${O}/>`, pivot: [80.5, 74]},
          top: {svg: `<ellipse cx="60" cy="21" rx="9" ry="3.6" fill="#F2C14E" ${OW(2.2)}/><circle cx="60" cy="16" r="3.6" fill="#F8D371" ${OW(2.2)}/>`, pivot: [60, 22]}
        },
        eyes: {lx: 50.5, rx: 69.5, y: 71, r: 4.8, style: "dot", color: "#2E1428"},
        mouth: {x: 60, y: 80, w: 3, color: "#2E1428"},
        cheeks: {lx: 44, rx: 76, y: 78.5, w: 3.8, h: 2.5, color: "#FFB0C8"},
        anchors: {top: [60, 22, 0.9], neck: [60, 95, 0.95], chest: [72, 86, 0.6], back: [82, 62, 0.8], hands: [60, 90, 0.85]},
        lines: {
          tap: ["Hi hi! Let's write something wonderful!", "Your ideas flow like the finest ink!", "Swish swirl! You're doing amazing!", "Every word you write is a treasure!", "I'd sign my name under your work!", "Fresh ink, fresh thoughts! Love it!", "Your notes look absolutely lovely!", "You've got this, with a flourish!"],
          pet: ["Hehe! My nib is all tingly!", "Ooh! A happy little ink swirl!"],
          hello: ["You're back! My ink is all warmed up!", "Hi! Let's make a beautiful page!"],
          morning: ["Good morning! Ready to write the day!", "Rise and shine! Fresh ink, fresh page!"],
          night: ["Capping my nib for tonight. Rest!", "Ink's resting, you should too. Night!"],
          focus: ["Smooth and steady strokes. You've got this!", "Writing quietly right beside you!"],
          done: ["Signed, sealed, AMAZING session!", "Session done! Written beautifully!"],
          task: ["DONE! With a big swirly flourish!", "Yes! Signed off and finished!", "Checked off! Bravo, writer!", "Another one done! Swish swish!"],
          break: ["Stretch those fingers! Wiggle!", "Break time! Let the ink dry a bit!"]
        }
      }
    ]
  });
})();

