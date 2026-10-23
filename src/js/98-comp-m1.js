/* ===== module: 98-comp-m1.js ===== */
/* Study Companions, Study Fields batch m1 */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const O16 = OW(1.6);
  // A bumpy outline around an ellipse (puff() is round only)
  const ellPuff = (cx, cy, rx, ry, n, bump = 1.15) => {
    const f = v => Math.round(v * 100) / 100;
    const p = i => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; };
    let d = `M${f(p(0)[0])} ${f(p(0)[1])}`;
    for (let i = 1; i <= n; i++) {
      const a = p(i - 1), b = p(i), r = Math.hypot(b[0] - a[0], b[1] - a[1]) / 2 * bump;
      d += `A${f(r)} ${f(r)} 0 0 1 ${f(b[0])} ${f(b[1])}`;
    }
    return d + "Z";
  };
  // A small heart shape, top dip at (x, y), half width s
  const heart = (x, y, s, fill, stroke) => `<path d="M${x} ${y + s * 0.35}C${x} ${y - s * 0.25} ${x - s} ${y - s * 0.3} ${x - s} ${y + s * 0.2}C${x - s} ${y + s * 0.65} ${x - s * 0.3} ${y + s * 0.95} ${x} ${y + s * 1.25}C${x + s * 0.3} ${y + s * 0.95} ${x + s} ${y + s * 0.65} ${x + s} ${y + s * 0.2}C${x + s} ${y - s * 0.3} ${x} ${y - s * 0.25} ${x} ${y + s * 0.35}Z" fill="${fill}"${stroke ? " " + stroke : ""}/>`;

  /* Market District */
  COMP_DATA.push({
    theme: "business",
    companions: [
      {
        id: "business-piggy", name: "Nickel", kind: "Piggy Bank", pose: "stand", wearColor: "#2F9E7A",
        bio: "A round little piggy bank who saves up every single win for you.",
        idle: ["earTwitch", "tailSwish", "topBob"], cheer: "hop",
        parts: {
          tail: {svg: `${LINE("M89 96C97 99 104 94 101 88.5C99 85 94.5 86.5 96.5 90.5C97.6 92.5 100.6 91.6 100.4 89.4", "#F48FAD", 2.6)}`, pivot: [89, 96]},
          earL: {svg: `<path d="M36 55C31 46 32 36 37 33C43 34 49 41 51 48Z" fill="#F7A4BD" ${O}/><path d="M38.5 49C36 43 36.5 38.5 38.6 37.4C41.5 38.8 44.5 42.5 45.6 46.5Z" fill="#FFD2DF"/>`, pivot: [44, 50]},
          earR: {svg: `<path d="M84 55C89 46 88 36 83 33C77 34 71 41 69 48Z" fill="#F7A4BD" ${O}/><path d="M81.5 49C84 43 83.5 38.5 81.4 37.4C78.5 38.8 75.5 42.5 74.4 46.5Z" fill="#FFD2DF"/>`, pivot: [76, 50]},
          feet: `<rect x="40" y="96" width="12" height="15.5" rx="5.6" fill="#F59CB6" ${O}/><rect x="68" y="96" width="12" height="15.5" rx="5.6" fill="#F59CB6" ${O}/>
            <path d="M41.6 107.2H50.4M69.6 107.2H78.4" stroke="#D86F92" stroke-width="2" stroke-linecap="round"/>`,
          body: `${RG("business-piggy-g", [[0, "#FFE4EC"], [0.55, "#FFC0D2"], [1, "#F396B3"]], 0.42, 0.36, 0.7)}
            <ellipse cx="60" cy="74" rx="34" ry="31" fill="url(#business-piggy-g)" ${O}/>
            <rect x="47.5" y="45.5" width="25" height="4.4" rx="2.2" fill="#B9557A" ${OW(2)}/>
            <path d="M34 66Q35.5 56 43 50.5" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".9"/><circle cx="33.6" cy="73" r="1.9" fill="#fff" opacity=".85"/>
            <path d="M40 98Q60 106 80 98" fill="none" stroke="#E98AAA" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>
            <ellipse cx="60" cy="82" rx="11.5" ry="8" fill="#FFB0C6" ${OW(2.4)}/><ellipse cx="55.6" cy="82" rx="2" ry="3" fill="#C9587E"/><ellipse cx="64.4" cy="82" rx="2" ry="3" fill="#C9587E"/>
            <path d="M52 78.4Q54 76.6 57 76.5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`,
          armL: {svg: `<ellipse cx="27.5" cy="85" rx="5.2" ry="7.4" transform="rotate(26 27.5 85)" fill="#F7A4BD" ${O}/>`, pivot: [33, 82]},
          armR: {svg: `<ellipse cx="92.5" cy="85" rx="5.2" ry="7.4" transform="rotate(-26 92.5 85)" fill="#F7A4BD" ${O}/>`, pivot: [87, 82]},
          top: {svg: `${LG("business-piggy-c", [[0, "#FFE58A"], [0.6, "#F7C443"], [1, "#DE9A2A"]])}
            <path d="M48.5 47.6A11.5 11.5 0 0 1 71.5 47.6Z" fill="url(#business-piggy-c)" ${OW(2.4)}/>
            <path d="M53.4 46.4A6.6 6.6 0 0 1 66.6 46.4" fill="none" stroke="#C9871E" stroke-width="1.7" stroke-linecap="round"/>
            <path d="M52.6 42.6Q54.2 39 57.8 37.8" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [60, 47]}
        },
        eyes: {lx: 47, rx: 73, y: 68, r: 4.8, style: "dot", color: "#3A1E2C"},
        mouth: {x: 60, y: 93, w: 3, color: "#3A1E2C"},
        cheeks: {lx: 39, rx: 81, y: 80, w: 4.6, h: 2.8, color: "#FF7FA3"},
        anchors: {top: [60, 42, 0.95], neck: [60, 101, 1.15], chest: [80, 96, 0.72], back: [93, 68, 0.9], hands: [60, 99, 0.9]},
        lines: {
          tap: ["Oink oink! Hi, my favorite saver!", "Every win goes right in my piggy bank!", "Look at all that progress adding up!", "You're worth a whole fortune to me!", "Cha-ching! That's the sound of you!", "Small steps add up to big things!", "My coin is shiny and so are you!", "Invest in you! Best deal ever!"],
          pet: ["Oink! That's my happy spot!", "Hehe! My coins are jingling!"],
          hello: ["You're back! Cha-ching, cha-ching!", "Oink! I saved you the best seat!"],
          morning: ["Good morning! Markets are open, let's go!", "Rise and shine! Today's full of gold!"],
          night: ["Markets closed. Rest up, superstar.", "Coins tucked in. Sleep well, friend."],
          focus: ["Saving up focus with you. Go go!", "Quiet piggy power, right beside you!"],
          done: ["What a session! My piggy bank is full!", "Session done! Pure gold, all of it!"],
          task: ["CHA-CHING! DONE!", "Oink oink! Another one in the bank!", "Done! That's a jackpot!", "WOO! Profits everywhere!"],
          break: ["Stretch time! A happy piggy wiggle!", "Snack break! You've earned it!"]
        }
      },
      {
        id: "business-bull", name: "Buck", kind: "Bull Calf", pose: "stand", wearColor: "#3E7BD6",
        bio: "A bouncy bull calf in a tiny tie who's always bullish on you.",
        idle: ["earTwitch", "headTilt", "tailSwish"], cheer: "hop",
        neck: [60, 76],
        parts: {
          tail: {svg: `${LINE("M83 99C91 100 96 95 97 88", "#B9784A", 2.4)}<path d="${puff(97.5, 85.5, 3.6, 6, 1.25)}" fill="#7A4A2A" ${O2}/>`, pivot: [83, 99]},
          feet: `<ellipse cx="49" cy="108.4" rx="7.4" ry="4.2" fill="#6B4129" ${O}/><ellipse cx="71" cy="108.4" rx="7.4" ry="4.2" fill="#6B4129" ${O}/>`,
          body: `${LG("business-bull-b", [[0, "#E8AE78"], [1, "#BE7E4C"]])}
            <path d="M60 71C77 71 85 83 85 95C85 105 76 109.5 60 109.5C44 109.5 35 105 35 95C35 83 43 71 60 71Z" fill="url(#business-bull-b)" ${O}/>
            <ellipse cx="60" cy="98" rx="13" ry="8.6" fill="#F6DCC0"/>
            <path d="M57 75.5H63L61.6 80.5H58.4Z" fill="#2E8F6E" ${OW(2)}/><path d="M58.4 80.5H61.6L64 93L60 97L56 93Z" fill="#3BAE85" ${OW(2)}/>
            <path d="M58.6 84.5L62.6 88.5" stroke="#9AE3C6" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M40 88Q41.5 81 46 77.5" fill="none" stroke="#F6D2AC" stroke-width="3" stroke-linecap="round" opacity=".85"/>`,
          armL: {svg: `<ellipse cx="37" cy="91" rx="5.2" ry="7.6" transform="rotate(24 37 91)" fill="#C98853" ${O}/>`, pivot: [41.5, 86]},
          armR: {svg: `<ellipse cx="83" cy="91" rx="5.2" ry="7.6" transform="rotate(-24 83 91)" fill="#C98853" ${O}/>`, pivot: [78.5, 86]},
          earL: {svg: `<path d="M38 46C30 41 20 42 16.5 48C21 54 31 55 39 52Z" fill="#D49460" ${O}/><path d="M35 47.5C29.5 45.5 24 46 21.5 48.5C25 51 30.5 51.5 35 50.5Z" fill="#F7B8A8"/>`, pivot: [38, 49]},
          earR: {svg: `<path d="M82 46C90 41 100 42 103.5 48C99 54 89 55 81 52Z" fill="#D49460" ${O}/><path d="M85 47.5C90.5 45.5 96 46 98.5 48.5C95 51 89.5 51.5 85 50.5Z" fill="#F7B8A8"/>`, pivot: [82, 49]},
          head: `${LG("business-bull-h", [[0, "#F0BC88"], [1, "#C88752"]])}
            <ellipse cx="60" cy="52" rx="24.5" ry="22.5" fill="url(#business-bull-h)" ${O}/>
            <path d="M53 31.5C54 26.5 60 25 63.5 28C61 28.2 59.5 29.6 60.4 32C58 30.8 55 30.8 53 31.5Z" fill="#8C5530" ${O2}/>
            <path d="M42 43Q45 36 51.5 33.5" fill="none" stroke="#FBD9B4" stroke-width="3" stroke-linecap="round" opacity=".9"/>
            <ellipse cx="60" cy="65.5" rx="15.5" ry="9.6" fill="#F7CDBE" ${OW(2.4)}/>
            <ellipse cx="54.6" cy="64" rx="1.8" ry="2.4" fill="#B9746A"/><ellipse cx="65.4" cy="64" rx="1.8" ry="2.4" fill="#B9746A"/>
            <path d="M50 61.5Q52 59.4 55 59" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".8"/>`,
          top: {svg: `<path d="M45.5 35.5C41 32.5 39.5 26 42 21.5C45 25 48.5 28 51.5 30.5Z" fill="#FFF2D2" ${O2}/><path d="M74.5 35.5C79 32.5 80.5 26 78 21.5C75 25 71.5 28 68.5 30.5Z" fill="#FFF2D2" ${O2}/>
            <path d="M43.5 27.5L45.5 29.5M76.5 27.5L74.5 29.5" stroke="#E2C99A" stroke-width="1.4" stroke-linecap="round"/>`, pivot: [60, 32]}
        },
        eyes: {lx: 48.5, rx: 71.5, y: 50, r: 4.6, style: "dot", color: "#2E1A12"},
        mouth: {x: 60, y: 69.5, w: 2.6, color: "#5A2A22"},
        cheeks: {lx: 40, rx: 80, y: 58, w: 4.2, h: 2.6, color: "#FF8F8F"},
        anchors: {top: [60, 31, 0.95], neck: [60, 77, 1.05], chest: [73, 90, 0.7], back: [84, 84, 0.85], hands: [60, 96, 0.9]},
        lines: {
          tap: ["Moo! I'm totally bullish on you!", "Charging ahead! Look at you go!", "Your progress chart only goes up!", "Big moves today, I can feel it!", "Tie straight, head high, let's do this!", "You're my top investment, always!", "Hooves up for the hardest worker!", "Stampede of cheers coming your way!"],
          pet: ["Moo hoo! My ears are flapping!", "Hehe! That tickles my horns!"],
          hello: ["You're here! Bull market, baby!", "Moo! Ready to charge into today?"],
          morning: ["Good morning! Opening bell, let's go!", "Rise and shine! Charts up, chin up!"],
          night: ["Closing bell. Time to rest, partner.", "Even calves need sleep. Night night!"],
          focus: ["Steady hooves, steady mind. Go!", "Quietly charging beside you!"],
          done: ["What a session! Record high!", "Session done! All charts point up!"],
          task: ["MOO! DONE! WOO!", "Charged right through that one!", "Done! Stock in you just soared!", "Yes yes! Happy hoof stomps!"],
          break: ["Stretch those hooves! Big stretch!", "Grazing break! Grab a tasty snack!"]
        }
      },
      {
        id: "business-case", name: "Brief", kind: "Little Briefcase", pose: "stand", wearColor: "#C9603E",
        bio: "A tidy little briefcase packed full of big plans and high fives.",
        idle: ["topBob", "wave", "bounce"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="42" cy="108.6" rx="6.4" ry="3.6" fill="#4A3426" ${O}/><ellipse cx="78" cy="108.6" rx="6.4" ry="3.6" fill="#4A3426" ${O}/>`,
          top: {svg: `<path d="M46 47V39.5Q46 32.5 53 32.5H67Q74 32.5 74 39.5V47" fill="none" stroke="${INK}" stroke-width="9.6" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M46 47V39.5Q46 32.5 53 32.5H67Q74 32.5 74 39.5V47" fill="none" stroke="#8A5531" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M50 37Q51 35 54 35H58" fill="none" stroke="#C88E5E" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [60, 46]},
          body: `${LG("business-case-g", [[0, "#E6A86A"], [0.55, "#CE8A4C"], [1, "#AC6A33"]])}
            <rect x="21" y="44" width="78" height="63" rx="14" fill="url(#business-case-g)" ${O}/>
            <path d="M21 58Q21 44 35 44H85Q99 44 99 58V60H21Z" fill="#B8733D"/>
            <path d="M21.5 60H98.5" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
            <rect x="21" y="44" width="78" height="63" rx="14" fill="none" ${O}/>
            <rect x="27" y="65" width="66" height="36.5" rx="9" fill="none" stroke="#F4CB9A" stroke-width="1.6" stroke-dasharray="3 3.2" opacity=".75"/>
            <rect x="35" y="55" width="9" height="10" rx="2.4" fill="#F7C94F" ${OW(2.2)}/><rect x="76" y="55" width="9" height="10" rx="2.4" fill="#F7C94F" ${OW(2.2)}/>
            <path d="M37.4 58H41.6M78.4 58H82.6" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".85"/>
            <path d="M28 51Q30 47.5 35 47" fill="none" stroke="#FFDDB6" stroke-width="2.8" stroke-linecap="round" opacity=".9"/>
            <path d="M26.5 72V88" stroke="#F6C894" stroke-width="3" stroke-linecap="round" opacity=".7"/>`,
          armL: {svg: `<ellipse cx="18" cy="83" rx="5" ry="7.4" transform="rotate(24 18 83)" fill="#B8733D" ${O}/>`, pivot: [23, 80]},
          armR: {svg: `<ellipse cx="102" cy="83" rx="5" ry="7.4" transform="rotate(-24 102 83)" fill="#B8733D" ${O}/>`, pivot: [97, 80]}
        },
        eyes: {lx: 48.5, rx: 71.5, y: 77, r: 5.6, style: "dot", color: "#2E1A10"},
        mouth: {x: 60, y: 86.5, w: 3.4, color: "#2E1A10"},
        cheeks: {lx: 40, rx: 80, y: 85, w: 4.6, h: 2.8, color: "#FF8F8A"},
        anchors: {top: [60, 41, 1], neck: [60, 98, 1.25], chest: [83, 96, 0.72], back: [93, 66, 0.9], hands: [60, 99, 0.95]},
        lines: {
          tap: ["Click clack! Ready for business!", "Your plans are looking so sharp!", "Packed with snacks and big ideas!", "You're the boss of this day!", "Meeting adjourned: you're amazing!", "I carry all your best ideas!", "Briefly: you're doing great!", "Pitch perfect, every single time!"],
          pet: ["Hehe! My clasps are all clicky!", "Ooh, a pat on the handle! Yay!"],
          hello: ["You're back! Let's get down to business!", "Hello, boss! Your agenda awaits!"],
          morning: ["Good morning! Today's agenda: shine!", "Rise and shine! Big plans ahead!"],
          night: ["Office is closed. Rest up, boss.", "All packed for tomorrow. Sleep well!"],
          focus: ["Do not disturb mode! You've got this!", "Quietly organizing beside you!"],
          done: ["Session done! What a power move!", "Wow! That was executive level focus!"],
          task: ["DONE! Deal closed! WOO!", "Signed, sealed, finished!", "Checked off! Promotion time!", "Yes! Another win in the bag!"],
          break: ["Coffee break! Stretch those arms!", "Lunch break! You've earned it, boss!"]
        }
      }
    ]
  });

  /* Night Shift */
  COMP_DATA.push({
    theme: "nursing",
    companions: [
      {
        id: "nursing-heart", name: "Pulse", kind: "Heartbeat Heart", pose: "float", wearColor: "#33A98A",
        bio: "A warm little heart that beats a happy rhythm just for you.",
        idle: ["wingFlutter", "sparkle", "bounce"], cheer: "spin",
        parts: {
          wingL: {svg: `<path d="M32 52C23 42 11 42 8.5 49C7.5 57 19 62 31 60Z" fill="#FFFFFF" ${OW(2.4)}/><path d="M29 56Q20 53 13.5 49.5" fill="none" stroke="#FFC4D2" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [31, 56]},
          wingR: {svg: `<path d="M88 52C97 42 109 42 111.5 49C112.5 57 101 62 89 60Z" fill="#FFFFFF" ${OW(2.4)}/><path d="M91 56Q100 53 106.5 49.5" fill="none" stroke="#FFC4D2" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [89, 56]},
          body: `${RG("nursing-heart-g", [[0, "#FFD3DC"], [0.55, "#FF95AB"], [1, "#EC6488"]], 0.4, 0.34, 0.72)}
            <path d="M60 38C53 24 28 22 24 42C20 62 40 86 60 106C80 86 100 62 96 42C92 22 67 24 60 38Z" fill="url(#nursing-heart-g)" ${O}/>
            <path d="M31 42Q33 32.5 42 30" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" opacity=".9"/><circle cx="30.4" cy="49.6" r="2" fill="#fff" opacity=".85"/>
            <path d="M44 82.5H51L54 77L58.4 89L62.2 79.5L64.8 82.5H76" fill="none" stroke="#FFE3EA" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M44 82.5H51L54 77L58.4 89L62.2 79.5L64.8 82.5H76" fill="none" stroke="#2FB58C" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
          armL: {svg: `<ellipse cx="27" cy="73" rx="4.8" ry="6.6" transform="rotate(30 27 73)" fill="#F47596" ${O}/>`, pivot: [32, 70]},
          armR: {svg: `<ellipse cx="93" cy="73" rx="4.8" ry="6.6" transform="rotate(-30 93 73)" fill="#F47596" ${O}/>`, pivot: [88, 70]}
        },
        eyes: {lx: 48.5, rx: 71.5, y: 59, r: 5.2, style: "sparkle", color: "#4A1430"},
        mouth: {x: 60, y: 68.5, w: 3, color: "#4A1430"},
        cheeks: {lx: 40, rx: 80, y: 67, w: 4.4, h: 2.7, color: "#FF5C8A"},
        anchors: {top: [60, 34, 0.9], neck: [60, 94, 0.9], chest: [72, 88, 0.6], back: [86, 48, 0.8], hands: [60, 92, 0.85]},
        lines: {
          tap: ["Ba-dum! Ba-dum! Hi hi!", "My heart beats faster when you're here!", "You care so much, and it shows!", "Every beat is cheering for you!", "You've got the biggest heart around!", "Steady rhythm, happy you!", "Kindness looks great on you!", "I love you a whole heartbeat's worth!"],
          pet: ["Ba-dum! That made me skip a beat!", "Aww! I'm all warm and fluttery!"],
          hello: ["You're back! My heart is racing!", "Hello! Ba-dum, ba-dum, welcome!"],
          morning: ["Good morning! New shift, new sunshine!", "Rise and shine, caring heart!"],
          night: ["Slow and steady beats now. Rest soon?", "Soft little heartbeats. Sleep well!"],
          focus: ["Calm, steady rhythm. You've got this!", "Beating quietly right beside you!"],
          done: ["Session done! My heart is so full!", "What focus! I'm beaming with pride!"],
          task: ["BA-DUM! DONE! WOO!", "My heart just did a happy flip!", "Done! You're amazing, truly!", "Yes! A big heart hug for that one!"],
          break: ["Deep breath and a big stretch! Ahh!", "Water break! Your heart says thanks!"]
        }
      },
      {
        id: "nursing-bandage", name: "Bandy", kind: "Bandage Buddy", pose: "stand", wearColor: "#E9668C",
        bio: "A sticky-sweet bandage buddy who's always got your back.",
        idle: ["wave", "sway", "bounce"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="50" cy="108.6" rx="6.6" ry="3.8" fill="#D88E66" ${O}/><ellipse cx="70" cy="108.6" rx="6.6" ry="3.8" fill="#D88E66" ${O}/>`,
          body: `${LG("nursing-bandage-g", [[0, "#FCDCC0"], [0.55, "#F5C29C"], [1, "#E8A77D"]], 0, 0, 1, 1)}
            <rect x="32" y="18" width="56" height="90" rx="28" fill="url(#nursing-bandage-g)"/>
            <rect x="32" y="46" width="56" height="34" fill="#FFF7EE"/>
            <path d="M32.5 46H87.5M32.5 80H87.5" stroke="#D99670" stroke-width="2"/>
            <g fill="#E9CDB5"><circle cx="37" cy="51" r="1"/><circle cx="37" cy="58" r="1"/><circle cx="37" cy="65" r="1"/><circle cx="37" cy="72" r="1"/><circle cx="83" cy="51" r="1"/><circle cx="83" cy="58" r="1"/><circle cx="83" cy="65" r="1"/><circle cx="83" cy="72" r="1"/></g>
            <g fill="#D48A62" opacity=".6"><circle cx="52" cy="28" r="1.5"/><circle cx="60" cy="27" r="1.5"/><circle cx="68" cy="28" r="1.5"/><circle cx="48" cy="36" r="1.5"/><circle cx="56" cy="36" r="1.5"/><circle cx="64" cy="36" r="1.5"/><circle cx="72" cy="36" r="1.5"/>
              <circle cx="48" cy="90" r="1.5"/><circle cx="56" cy="90" r="1.5"/><circle cx="64" cy="90" r="1.5"/><circle cx="72" cy="90" r="1.5"/><circle cx="52" cy="98" r="1.5"/><circle cx="60" cy="99" r="1.5"/><circle cx="68" cy="98" r="1.5"/></g>
            ${heart(79.5, 72.6, 3.2, "#FF8FAE", OW(1.3))}
            <rect x="32" y="18" width="56" height="90" rx="28" fill="none" ${O}/>
            <path d="M39 36Q41 26 48 22.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".85"/><circle cx="38.4" cy="41.5" r="1.7" fill="#fff" opacity=".8"/>`,
          armL: {svg: `<ellipse cx="29" cy="76" rx="5.2" ry="7.6" transform="rotate(26 29 76)" fill="#EDB48A" ${O}/>`, pivot: [34.5, 72]},
          armR: {svg: `<ellipse cx="91" cy="76" rx="5.2" ry="7.6" transform="rotate(-26 91 76)" fill="#EDB48A" ${O}/>`, pivot: [85.5, 72]}
        },
        eyes: {lx: 50, rx: 70, y: 60, r: 4.8, style: "dot", color: "#3A2418"},
        mouth: {x: 60, y: 69.5, w: 3, color: "#3A2418"},
        cheeks: {lx: 42.5, rx: 77.5, y: 68, w: 4, h: 2.5, color: "#FF9AAE"},
        anchors: {top: [60, 21, 0.9], neck: [60, 91, 1.05], chest: [73, 98, 0.66], back: [84, 60, 0.85], hands: [60, 92, 0.9]},
        lines: {
          tap: ["Hi hi! I'm stuck on you, friend!", "I've always got your back!", "You make everyone feel better!", "Patch by patch, you're doing it!", "Sticking by your side all day!", "Kindness is your superpower!", "You're the best teammate ever!", "Stick with it! You're amazing!"],
          pet: ["Hehe! My sticky side is all giggly!", "Aww! That's the best little pat!"],
          hello: ["You're back! I stuck around for you!", "Hello! Ready to make today better?"],
          morning: ["Good morning! Fresh start, fresh pad!", "Rise and shine! Let's care big today!"],
          night: ["Time to unstick and rest, friend.", "Quiet night. You deserve sleep."],
          focus: ["Stuck right here with you. Go go!", "Quiet teamwork mode. You've got this!"],
          done: ["Session done! You stuck with it!", "What focus! I'm so proud of you!"],
          task: ["DONE! Stuck the landing! WOO!", "Yes! All wrapped up and finished!", "Checked off! You're incredible!", "Another one done! Happy hops!"],
          break: ["Stretch it out! Wiggle wiggle!", "Water and a snack! Care for you too!"]
        }
      },
      {
        id: "nursing-teddy", name: "Florence", kind: "Nurse Teddy Bear", pose: "sit", sleepy: true, wearColor: "#5AA6D6", hatTop: true,
        bio: "A soft teddy in a little heart cap who gives the warmest hugs.",
        idle: ["earTwitch", "headTilt", "wave"], cheer: "hop",
        neck: [60, 74],
        parts: {
          feet: `<ellipse cx="41" cy="106.5" rx="10.5" ry="6" fill="#D99A60" ${O}/><ellipse cx="79" cy="106.5" rx="10.5" ry="6" fill="#D99A60" ${O}/>
            <ellipse cx="41" cy="107" rx="5" ry="3.2" fill="#F7DDBF"/><ellipse cx="79" cy="107" rx="5" ry="3.2" fill="#F7DDBF"/>`,
          body: `${LG("nursing-teddy-b", [[0, "#ECBA84"], [1, "#C98A52"]])}
            <path d="M60 70C78 70 86 84 86 95C86 105 77 110 60 110C43 110 34 105 34 95C34 84 42 70 60 70Z" fill="url(#nursing-teddy-b)" ${O}/>
            <path d="M47.5 79H72.5V93Q72.5 101.5 60 101.5Q47.5 101.5 47.5 93Z" fill="#FFFFFF" ${OW(2.2)}/>
            ${heart(60, 86, 4.2, "#FF7FA0", OW(1.4))}
            <path d="M39 90Q39.5 83 43.5 78.5" fill="none" stroke="#F8D3A6" stroke-width="3" stroke-linecap="round" opacity=".85"/>`,
          armL: {svg: `<ellipse cx="37" cy="92" rx="6.4" ry="9" transform="rotate(20 37 92)" fill="#D99A60" ${O}/>`, pivot: [41.5, 84]},
          armR: {svg: `<ellipse cx="83" cy="92" rx="6.4" ry="9" transform="rotate(-20 83 92)" fill="#D99A60" ${O}/>`, pivot: [78.5, 84]},
          earL: {svg: `<circle cx="38.5" cy="36.5" r="9.5" fill="#D99A60" ${O}/><circle cx="38.5" cy="36.5" r="5" fill="#F4C7A0"/>`, pivot: [43, 41]},
          earR: {svg: `<circle cx="81.5" cy="36.5" r="9.5" fill="#D99A60" ${O}/><circle cx="81.5" cy="36.5" r="5" fill="#F4C7A0"/>`, pivot: [77, 41]},
          head: `${LG("nursing-teddy-h", [[0, "#F2C592"], [1, "#D39457"]])}
            <ellipse cx="60" cy="52" rx="25.5" ry="22" fill="url(#nursing-teddy-h)" ${O}/>
            <path d="M41.5 45Q44 38 50.5 35" fill="none" stroke="#FBDDB8" stroke-width="3" stroke-linecap="round" opacity=".9"/>
            <ellipse cx="60" cy="62" rx="10.5" ry="7.8" fill="#FBE6CF"/>
            <ellipse cx="60" cy="58.4" rx="3.6" ry="2.6" fill="#4A2A1C"/><ellipse cx="59" cy="57.6" rx="1.2" ry=".8" fill="#fff" opacity=".8"/>`,
          top: {svg: `<path d="M43.5 34L46 22.5Q60 17 74 22.5L76.5 34Q60 29.5 43.5 34Z" fill="#FFFFFF" ${OW(2.4)}/>
            <path d="M46.5 30.2Q60 26.2 73.5 30.2" fill="none" stroke="#FFC6D4" stroke-width="2" stroke-linecap="round"/>
            ${heart(60, 22.5, 3.8, "#FF7FA0", OW(1.4))}`, pivot: [60, 32]}
        },
        eyes: {lx: 48.5, rx: 71.5, y: 50.5, r: 4.4, style: "dot", color: "#2E1A12"},
        mouth: {x: 60, y: 63.5, w: 2.4, style: "cat", color: "#4A2A1C"},
        cheeks: {lx: 41, rx: 79, y: 58.5, w: 4.4, h: 2.7, color: "#FF8F9F"},
        anchors: {top: [60, 22, 0.9], neck: [60, 75, 1.05], chest: [74, 88, 0.66], back: [86, 86, 0.85], hands: [60, 95, 0.9]},
        lines: {
          tap: ["Hello, sweetheart! Bear hug time!", "Your kindness makes the world softer!", "You care so well for everyone!", "I'm beary, beary proud of you!", "Teamwork makes the dream work!", "A little care goes a long way!", "You're doing wonderfully, truly!", "Soft paws, big cheers for you!"],
          pet: ["Mmm! The coziest pat ever!", "Hehe! My cap is wiggling!"],
          hello: ["You're here! Big bear hug for you!", "Hello, dear! Ready for a lovely shift?"],
          morning: ["Good morning! The sunrise shift is here!", "Rise and shine! Let's care big today!"],
          night: ["Night shift snuggles. Rest soon, dear.", "Yawn. Even bears need their sleep."],
          focus: ["Quiet paws, steady heart. You've got this!", "Cuddled up beside you while you work!"],
          done: ["Session done! Beary well done!", "Wonderful focus! Hug time!"],
          task: ["DONE! Bear hug! WOO!", "Yay! Taking care of business!", "Checked off! I'm so proud!", "Another one done! Happy paws!"],
          break: ["Big bear stretch! Reach up high!", "Tea and a snack! Care for you too!"]
        }
      }
    ]
  });

  /* Mind Garden */
  COMP_DATA.push({
    theme: "psych",
    companions: [
      {
        id: "psych-brain", name: "Neuro", kind: "Little Brain", pose: "stand", wearColor: "#7E6BD6",
        bio: "A curious little brain whose light bulb pops on with every idea.",
        idle: ["topBob", "sway", "wave"], cheer: "spin",
        parts: {
          feet: `<ellipse cx="50" cy="108.6" rx="6.6" ry="3.8" fill="#E77FA0" ${O}/><ellipse cx="70" cy="108.6" rx="6.6" ry="3.8" fill="#E77FA0" ${O}/>`,
          top: {svg: `${LINE("M60 46C55.5 43.5 64.5 40.5 60 38C55.5 35.5 64.5 32.5 60 30", "#9C8BD6", 1.8)}
            ${RG("psych-brain-bulb", [[0, "#FFFBE0"], [0.6, "#FFE680"], [1, "#F7C94A"]], 0.42, 0.4, 0.6)}
            <rect x="56" y="24.5" width="8" height="5.6" rx="1.6" fill="#B8B1CC" ${OW(2)}/>
            <circle cx="60" cy="18" r="7.6" fill="url(#psych-brain-bulb)" ${OW(2.2)}/>
            <path d="M56.6 15.4Q57.6 13 60 12.6" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M48.5 13L51 14.5M71.5 13L69 14.5M60 5.2V7.8" stroke="#F7B733" stroke-width="2" stroke-linecap="round"/>`, pivot: [60, 46]},
          body: `${RG("psych-brain-g", [[0, "#FFE6EE"], [0.55, "#FFC4D6"], [1, "#F59AB8"]], 0.42, 0.36, 0.72)}
            <path d="${ellPuff(60, 73, 35, 26.5, 13, 1.14)}" fill="url(#psych-brain-g)" ${O}/>
            <path d="M60 47Q56 51 60.5 55Q56.5 58 59.5 61.5" fill="none" stroke="#E07A9E" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M44 55q4 -4.5 9 -1.5M67 53.5q5 -3 9 1.5M30.5 70q4.5 -3.8 9 -.6M80.5 69.4q4.5 -3.2 9 .6M33 87q4 3.6 8.5 1M78.5 88q4.5 2.6 8.5 -1M36 59q3 -3.4 7 -2.4M77 56.6q4 -1 7 2.4" fill="none" stroke="#E07A9E" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M33 63Q34.5 55 41.5 50.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".9"/><circle cx="34" cy="76.5" r="1.8" fill="#fff" opacity=".8"/>`,
          armL: {svg: `<ellipse cx="24.5" cy="86" rx="4.8" ry="7" transform="rotate(28 24.5 86)" fill="#F7A9C2" ${O}/>`, pivot: [30, 83]},
          armR: {svg: `<ellipse cx="95.5" cy="86" rx="4.8" ry="7" transform="rotate(-28 95.5 86)" fill="#F7A9C2" ${O}/>`, pivot: [90, 83]}
        },
        eyes: {lx: 49, rx: 71, y: 74, r: 5.4, style: "dot", color: "#3A1A34"},
        mouth: {x: 60, y: 83, w: 3, color: "#3A1A34"},
        cheeks: {lx: 40.5, rx: 79.5, y: 81.5, w: 4.4, h: 2.7, color: "#FF6F9A"},
        anchors: {top: [60, 46, 0.95], neck: [60, 98, 1.15], chest: [77, 94, 0.7], back: [91, 68, 0.9], hands: [60, 97, 0.9]},
        lines: {
          tap: ["Ding! Idea alert! Hi hi!", "Your neurons are firing so bright!", "Ooh, I love how you think!", "Big thoughts, happy brain!", "Curiosity looks amazing on you!", "Every question grows a new idea!", "My light bulb is on because of you!", "You're wired for wonderful things!"],
          pet: ["Hehe! That tickles my wrinkles!", "Ooh! Happy brain chemicals!"],
          hello: ["You're back! My bulb lit right up!", "Hello! Let's think big thoughts!"],
          morning: ["Good morning! Brain booting up! Ding!", "Rise and shine! Fresh ideas today!"],
          night: ["Dimming my bulb. Sleep helps memory!", "Time to rest that brilliant mind."],
          focus: ["Deep thinking mode. You've got this!", "Quietly thinking right beside you!"],
          done: ["Session done! Mind blown! Wow!", "What focus! My bulb is so bright!"],
          task: ["DING DING! DONE! WOO!", "Brilliant! Another one finished!", "Done! That's what I call smart!", "Yes! Neurons doing a happy dance!"],
          break: ["Brain break! Stretch and breathe!", "Water time! Brains love water!"]
        }
      },
      {
        id: "psych-sheep", name: "Dozy", kind: "Dream Sheep", pose: "sit", sleepy: true, wearColor: "#8C7BD8",
        bio: "A fluffy dream sheep who counts your wins instead of sheep.",
        idle: ["earTwitch", "tailSwish", "bounce"], cheer: "hop",
        neck: [60, 75],
        parts: {
          tail: {svg: `<path d="${puff(89, 98, 5.6, 7, 1.2)}" fill="#F4F0FF" ${O}/>`, pivot: [85, 99]},
          feet: `<ellipse cx="45" cy="108.2" rx="6.4" ry="4" fill="#5E5172" ${O}/><ellipse cx="75" cy="108.2" rx="6.4" ry="4" fill="#5E5172" ${O}/>`,
          body: `${RG("psych-sheep-b", [[0, "#FFFFFF"], [0.6, "#F2EDFE"], [1, "#D3C7F2"]], 0.45, 0.35, 0.7)}
            <path d="${ellPuff(60, 92, 25, 14.5, 12, 1.2)}" fill="url(#psych-sheep-b)" ${O}/>
            <path d="M42 89q2.4 2 4.8 .6M73 98q2.4 1.6 4.8 0M56 101q2.4 1.6 4.8 0" fill="none" stroke="#C9BEEA" stroke-width="1.8" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="41" cy="96" rx="5.6" ry="7.4" transform="rotate(14 41 96)" fill="#FBF9FF" ${O}/><ellipse cx="40" cy="102" rx="3.6" ry="2.2" fill="#5E5172"/>`, pivot: [43, 89]},
          armR: {svg: `<ellipse cx="79" cy="96" rx="5.6" ry="7.4" transform="rotate(-14 79 96)" fill="#FBF9FF" ${O}/><ellipse cx="80" cy="102" rx="3.6" ry="2.2" fill="#5E5172"/>`, pivot: [77, 89]},
          earL: {svg: `<path d="M41 55C33 52 25 55 23 61C28 65 36 63 42 59Z" fill="#F6DCCB" ${O}/><path d="M38.5 57C33.5 56 29.5 57.5 28 60.5C31 62 35 61.2 38.5 59.4Z" fill="#FFB9C6"/>`, pivot: [41, 57]},
          earR: {svg: `<path d="M79 55C87 52 95 55 97 61C92 65 84 63 78 59Z" fill="#F6DCCB" ${O}/><path d="M81.5 57C86.5 56 90.5 57.5 92 60.5C89 62 85 61.2 81.5 59.4Z" fill="#FFB9C6"/>`, pivot: [79, 57]},
          head: `${RG("psych-sheep-w", [[0, "#FFFFFF"], [0.6, "#F3EEFE"], [1, "#DAD0F3"]], 0.45, 0.35, 0.7)}${LG("psych-sheep-f", [[0, "#FFF5EC"], [1, "#F4D8C6"]])}
            <path d="${ellPuff(60, 51, 23, 18, 11, 1.2)}" fill="url(#psych-sheep-w)" ${O}/>
            <ellipse cx="60" cy="61.5" rx="18" ry="14.8" fill="url(#psych-sheep-f)" ${O}/>
            <path d="${ellPuff(60, 47.5, 12, 5.8, 7, 1.25)}" fill="url(#psych-sheep-w)" ${O2}/>
            <path d="M42 42Q45 36.5 51 35" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
          top: {svg: `<path d="M73 23.5A9 9 0 1 0 80.5 37.5A7 7 0 1 1 73 23.5Z" fill="#FFE27A" ${OW(2.2)}/><circle cx="69" cy="30" r="1" fill="#F2B83A"/><path d="M86.5 22.5v4M84.5 24.5h4" stroke="#FFE27A" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [68, 38]}
        },
        eyes: {lx: 52, rx: 68, y: 61.5, r: 4.3, style: "dot", color: "#3B2E4A"},
        mouth: {x: 60, y: 69, w: 2.4, style: "cat", color: "#5A3E50"},
        cheeks: {lx: 46, rx: 74, y: 67, w: 3.8, h: 2.3, color: "#FF9FB7"},
        anchors: {top: [60, 37, 0.95], neck: [60, 77, 1.05], chest: [72, 90, 0.66], back: [84, 86, 0.85], hands: [60, 96, 0.9]},
        lines: {
          tap: ["Baa! Hi, my dreamy friend!", "Counting your wins instead of sheep!", "You're the stuff of sweet dreams!", "Fluffy cheers, coming right up!", "Dream big! You're doing it!", "So soft, so proud of you!", "Your mind is a lovely garden!", "Woolly hugs for my favorite human!"],
          pet: ["Baa! My wool is extra fluffy now!", "Hehe! So cozy, so happy!"],
          hello: ["Baa! You're back! What a dream!", "Hello! I saved the comfiest cloud!"],
          morning: ["Good morning! I'm awake for you! Baa!", "Rise and shine! Dreams come true today!"],
          night: ["Baa. Sweet dreams are calling.", "Moon's up. Time to rest, friend."],
          focus: ["Quiet and fluffy beside you. Go!", "Soft focus vibes. You've got this!"],
          done: ["Session done! A dream come true!", "What a session! Woolly cheers!"],
          task: ["BAA! DONE! WOO!", "Yes! One more fluffy win!", "Done! Better than a sweet dream!", "Checked off! Happy hops!"],
          break: ["Big fluffy stretch! Ahh!", "Rest your eyes and breathe! Baa!"]
        }
      },
      {
        id: "psych-bubble", name: "Wonder", kind: "Thought Bubble", pose: "float", wearColor: "#5C9BD6",
        bio: "A floaty thought bubble full of what-ifs and bright ideas.",
        idle: ["tailSwish", "topBob", "sparkle"], cheer: "spin",
        parts: {
          tail: {svg: `<circle cx="45" cy="92" r="6.4" fill="#F6F2FF" ${O}/><circle cx="35.5" cy="104" r="4" fill="#F6F2FF" ${O}/><circle cx="43" cy="90" r="1.6" fill="#fff"/>`, pivot: [50, 86]},
          body: `${RG("psych-bubble-g", [[0, "#FFFFFF"], [0.55, "#F3EEFF"], [1, "#D2C8F3"]], 0.42, 0.36, 0.72)}
            <path d="${ellPuff(60, 58, 32, 25, 12, 1.18)}" fill="url(#psych-bubble-g)" ${O}/>
            <path d="M34 52Q36 43 44.5 38.5" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/><circle cx="33.5" cy="60" r="2" fill="#fff"/>
            <path d="M42 77Q60 83 78 77" fill="none" stroke="#C3B6EC" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`,
          armL: {svg: `<circle cx="27" cy="68" r="5.4" fill="#F1ECFF" ${O}/>`, pivot: [31, 66]},
          armR: {svg: `<circle cx="93" cy="68" r="5.4" fill="#F1ECFF" ${O}/>`, pivot: [89, 66]},
          top: {svg: `<path d="M60 13L62.4 20.6L70 23L62.4 25.4L60 33L57.6 25.4L50 23L57.6 20.6Z" fill="#FFD966" ${OW(2.2)}/><circle cx="71.5" cy="14" r="2" fill="#FFB8D2" ${O16}/><path d="M59 19.5L60 17" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>`, pivot: [60, 33]}
        },
        eyes: {lx: 50, rx: 70, y: 58, r: 5, style: "sparkle", color: "#3A3160"},
        mouth: {x: 60, y: 67, w: 3, color: "#3A3160"},
        cheeks: {lx: 41.5, rx: 78.5, y: 65.5, w: 4.4, h: 2.7, color: "#FF9EC0"},
        anchors: {top: [60, 35, 0.95], neck: [60, 82, 1], chest: [76, 76, 0.64], back: [86, 50, 0.8], hands: [60, 80, 0.85]},
        lines: {
          tap: ["Ooh! I just had a thought: you rock!", "What if today is your best day yet?", "I wonder how amazing you'll be today!", "Thinking happy thoughts about you!", "Curious minds go the farthest!", "Pop! Another great idea!", "Your thoughts are so bright!", "Floating by to say you're wonderful!"],
          pet: ["Hehe! I'm all floaty and fizzy!", "Ooh! That gave me happy thoughts!"],
          hello: ["You're back! What a lovely thought!", "Hi! I was just thinking about you!"],
          morning: ["Good morning! So many ideas today!", "Rise and shine! Wonder awaits!"],
          night: ["Soft thoughts now. Time to dream.", "Let the big ideas rest till morning."],
          focus: ["Quiet thoughts, clear mind. Go!", "Floating calmly beside you!"],
          done: ["Session done! What a bright mind!", "Wow! My thoughts are all sparkly!"],
          task: ["POP! DONE! WOO!", "Yes! What a brilliant finish!", "Checked off! I knew you could!", "Another one done! Pop pop pop!"],
          break: ["Let your thoughts drift! Stretch!", "Daydream break! You've earned it!"]
        }
      }
    ]
  });

  /* Cell Garden */
  COMP_DATA.push({
    theme: "biology",
    companions: [
      {
        id: "biology-tardigrade", name: "Tardi", kind: "Tardigrade", pose: "stand", wearColor: "#3FA28C",
        bio: "A tiny, mighty water bear who never ever gives up.",
        idle: ["waddle", "wave", "finWiggle"], cheer: "hop",
        parts: {
          feet: `<rect x="31" y="98" width="11" height="13.5" rx="5.4" fill="#F4C3A2" ${O}/><rect x="45.5" y="99.5" width="11" height="12.5" rx="5.4" fill="#F4C3A2" ${O}/><rect x="63.5" y="99.5" width="11" height="12.5" rx="5.4" fill="#F4C3A2" ${O}/><rect x="78" y="98" width="11" height="13.5" rx="5.4" fill="#F4C3A2" ${O}/>
            <path d="M34 110l-.6 2.2M38.6 110l.6 2.2M48.6 110.4l-.6 2.2M53.4 110.4l.6 2.2M66.6 110.4l-.6 2.2M71.4 110.4l.6 2.2M81.4 110l-.6 2.2M86 110l.6 2.2" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`,
          body: `${LG("biology-tardigrade-g", [[0, "#FFF0E2"], [0.55, "#FCD9BE"], [1, "#EDB592"]])}
            <path d="M60 30C80 30 91 44 91 63C91 73 93 83 91 91C89 101 78 105 60 105C42 105 31 101 29 91C27 83 29 73 29 63C29 44 40 30 60 30Z" fill="url(#biology-tardigrade-g)" ${O}/>
            <path d="M31.5 80Q60 88 88.5 80M32 93Q60 100 88 93" fill="none" stroke="#DDA07E" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M42 38Q60 33 78 38" fill="none" stroke="#DDA07E" stroke-width="2" stroke-linecap="round" opacity=".8"/>
            <ellipse cx="60" cy="67.6" rx="7.6" ry="5.6" fill="#FFF6EE" stroke="#DDA07E" stroke-width="1.6"/>
            <g fill="#E8A987"><circle cx="36" cy="70" r="1.4"/><circle cx="84" cy="72" r="1.4"/><circle cx="44" cy="86" r="1.2"/><circle cx="76" cy="87" r="1.2"/><circle cx="60" cy="98" r="1.2"/></g>
            <path d="M35 58Q36 46 45 39.5" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".9"/><circle cx="34.6" cy="65.5" r="1.8" fill="#fff" opacity=".85"/>`,
          armL: {svg: `<ellipse cx="26.5" cy="82" rx="5.4" ry="8" transform="rotate(26 26.5 82)" fill="#F4C3A2" ${O}/><path d="M22 87.5l-2.4 1.2M24 89.4l-1.4 2" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>`, pivot: [32, 78]},
          armR: {svg: `<ellipse cx="93.5" cy="82" rx="5.4" ry="8" transform="rotate(-26 93.5 82)" fill="#F4C3A2" ${O}/><path d="M98 87.5l2.4 1.2M96 89.4l1.4 2" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>`, pivot: [88, 78]}
        },
        eyes: {lx: 48.5, rx: 71.5, y: 56.5, r: 4.8, style: "dot", color: "#3A2418"},
        mouth: {x: 60, y: 67.6, w: 2.6, color: "#3A2418"},
        cheeks: {lx: 40, rx: 80, y: 65.5, w: 4.4, h: 2.7, color: "#FF9AA8"},
        anchors: {top: [60, 32, 1], neck: [60, 76, 1.25], chest: [77, 91, 0.72], back: [90, 64, 0.9], hands: [60, 93, 0.95]},
        lines: {
          tap: ["Hi hi! Eight tiny legs of cheering!", "I survive anything, and so can you!", "Small but mighty, just like you!", "Unstoppable! That's us!", "Tiny steps, giant progress!", "You're tougher than you think!", "Water bear hugs for you!", "I've been to space! You're cooler!"],
          pet: ["Hehe! All eight legs are wiggling!", "Ooh! Squishy happy water bear!"],
          hello: ["You're back! Let's be unstoppable!", "Hi hi! Tiny bear, huge welcome!"],
          morning: ["Good morning! Ready for anything!", "Rise and shine! Mighty day ahead!"],
          night: ["Curling up to rest. You too, okay?", "Even mighty bears need sleep. Night!"],
          focus: ["Steady little steps. You've got this!", "Tiny and quiet beside you. Go!"],
          done: ["Session done! Totally unstoppable!", "Wow! What mighty focus!"],
          task: ["DONE! Mighty, mighty you! WOO!", "Yes! Nothing can stop you!", "Checked off! Eight legs dancing!", "Another one done! Unstoppable!"],
          break: ["Stretch all your legs! Wiggle!", "Water break! I love water!"]
        }
      },
      {
        id: "biology-dna", name: "Helix", kind: "DNA Sprout", pose: "stand", wearColor: "#5B7FD6",
        bio: "A little sprout with a twisty DNA stem who loves to grow with you.",
        idle: ["topBob", "sway", "wave"], cheer: "spin",
        parts: {
          feet: `<ellipse cx="50" cy="108.8" rx="6.6" ry="3.8" fill="#5FA66F" ${O}/><ellipse cx="70" cy="108.8" rx="6.6" ry="3.8" fill="#5FA66F" ${O}/>`,
          top: {svg: `${LINE("M54.4 55.8H65.6M52.5 51.7H67.5M54.4 46.2H65.6", "#FFD35A", 2)}${LINE("M54.4 37.8H65.6M52.5 33H67.5M54.4 28.2H65.6", "#FF8FB0", 2)}
            ${LINE("M60 60C50 55 50 47 60 42C70 37 70 29 60 24", "#6C9BEA", 3)}
            ${LINE("M60 60C70 55 70 47 60 42C50 37 50 29 60 24", "#F07AA2", 3)}
            <path d="M60 25C55 16 45.5 15.5 41 20C45.5 27 54 29 60 25Z" fill="#8AD08A" ${O2}/><path d="M58 24.5Q51.5 20.5 45 20.5" fill="none" stroke="#5DAA62" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M60.5 24C64 14 74 11 80 15C77 23 68 27 60.5 24Z" fill="#9BDA95" ${O2}/><path d="M62.5 23Q70 18 77 16" fill="none" stroke="#5DAA62" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [60, 60]},
          body: `${RG("biology-dna-g", [[0, "#EEFBE4"], [0.55, "#CDEFB6"], [1, "#94D27C"]], 0.42, 0.36, 0.7)}
            <path d="M60 57C80 57 89 72 89 86C89 101 78 108 60 108C42 108 31 101 31 86C31 72 40 57 60 57Z" fill="url(#biology-dna-g)" ${O}/>
            <path d="M37 80Q38.5 70 46 64" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".9"/><circle cx="36.6" cy="87" r="1.8" fill="#fff" opacity=".85"/>
            <path d="M42 102Q60 108 78 102" fill="none" stroke="#7CBF66" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>`,
          armL: {svg: `<path d="M35 86C27 82 19 85 17.5 91C24 95 31 93 35.5 90Z" fill="#9BDA95" ${O}/><path d="M33 88.4Q26 88 21 90.6" fill="none" stroke="#5DAA62" stroke-width="1.4" stroke-linecap="round"/>`, pivot: [35, 88]},
          armR: {svg: `<path d="M85 86C93 82 101 85 102.5 91C96 95 89 93 84.5 90Z" fill="#9BDA95" ${O}/><path d="M87 88.4Q94 88 99 90.6" fill="none" stroke="#5DAA62" stroke-width="1.4" stroke-linecap="round"/>`, pivot: [85, 88]}
        },
        eyes: {lx: 50, rx: 70, y: 81, r: 4.7, style: "dot", color: "#24361E"},
        mouth: {x: 60, y: 90, w: 3, color: "#24361E"},
        cheeks: {lx: 41.5, rx: 78.5, y: 88.5, w: 4.4, h: 2.7, color: "#FF9AA8"},
        anchors: {top: [60, 60, 0.95], neck: [60, 100, 1.1], chest: [77, 99, 0.68], back: [88, 78, 0.9], hands: [60, 100, 0.9]},
        lines: {
          tap: ["Hi hi! Twisting with joy to see you!", "Learning is in your DNA!", "Growing a little every day, like you!", "You're one of a kind, genetically!", "Base pair? More like best pair!", "Twist and shout! You're amazing!", "Your brain cells are thriving!", "Sprouting cheers just for you!"],
          pet: ["Hehe! My helix is all twisty!", "Ooh! My leaves are wiggling!"],
          hello: ["You're back! My leaves perked up!", "Hello! Let's grow together today!"],
          morning: ["Good morning! Time to grow and glow!", "Rise and shine! Sunlight, let's go!"],
          night: ["Leaves folding in. Rest well, friend.", "Growing happens in sleep too!"],
          focus: ["Growing quietly beside you. Go!", "Steady sprout, steady mind!"],
          done: ["Session done! Look how you grew!", "Wow! That was evolution level focus!"],
          task: ["DONE! Twist and cheer! WOO!", "Yes! Another sprout of progress!", "Checked off! Leafy high five!", "One more done! You're thriving!"],
          break: ["Stretch toward the sun! Ahh!", "Water break! Sprouts love water!"]
        }
      },
      {
        id: "biology-amoeba", name: "Amy", kind: "Friendly Amoeba", pose: "sit", wearColor: "#E0729A",
        bio: "A wobbly, jelly-soft amoeba who stretches out for big hugs.",
        idle: ["finWiggle", "sway", "bounce"], cheer: "hop",
        parts: {
          armL: {svg: `<path d="M34 76C25 71 15 72 13 79C12 86 23 89 35 85Z" fill="#A9D7F4" ${O}/>`, pivot: [33, 80]},
          armR: {svg: `<path d="M86 74C95 67 106 67 108 73.5C109.5 80.5 99 84 86 83Z" fill="#A9D7F4" ${O}/>`, pivot: [87, 79]},
          body: `${RG("biology-amoeba-g", [[0, "#F2FAFF"], [0.55, "#CBE8FA"], [1, "#8FC8EE"]], 0.42, 0.38, 0.7)}
            <path d="M60 39C73 38 82 44 86 53C90 61 92 66 91 74C90 82 94 89 93 96C92 104 84 108 73 108H47C35 108 27 104 27 96C27 89 30 84 29 76C28 66 30 58 34 51C39 43 48 39.5 60 39Z" fill="url(#biology-amoeba-g)" ${O}/>
            <circle cx="75" cy="53" r="7.4" fill="#FFC9DA" stroke="#E58AAA" stroke-width="1.8"/><circle cx="76.6" cy="51.6" r="2.8" fill="#F08DB0"/><circle cx="72.6" cy="50.6" r="1.4" fill="#fff" opacity=".8"/>
            <circle cx="39" cy="94" r="3.6" fill="#E8F6FF" stroke="#86BEE6" stroke-width="1.4"/><circle cx="82" cy="96" r="2.4" fill="#E8F6FF" stroke="#86BEE6" stroke-width="1.3"/><circle cx="47" cy="101" r="1.6" fill="#86BEE6"/>
            <path d="M35.5 62Q38 50 47.5 44.5" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" opacity=".95"/><circle cx="34.5" cy="70" r="2" fill="#fff" opacity=".85"/>`
        },
        eyes: {lx: 49, rx: 70, y: 72, r: 5, style: "sparkle", color: "#1F3A44"},
        mouth: {x: 59.5, y: 81, w: 3, color: "#1F3A44"},
        cheeks: {lx: 40.5, rx: 78.5, y: 79.5, w: 4.4, h: 2.7, color: "#FF9AB4"},
        anchors: {top: [60, 41, 0.95], neck: [60, 92, 1.2], chest: [76, 98, 0.68], back: [88, 64, 0.85], hands: [60, 95, 0.9]},
        lines: {
          tap: ["Bloop! Hi hi, my favorite cell!", "Stretching out for a big hug!", "You're growing so fast! Wow!", "Wobbly with excitement for you!", "Divide and conquer, superstar!", "Small but full of big potential!", "I'm all jelly with joy!", "You've got this, one blob at a time!"],
          pet: ["Bloop bloop! So squishy happy!", "Hehe! I'm wobbling all over!"],
          hello: ["Bloop! You're back! Hugs incoming!", "Hello! I oozed over to say hi!"],
          morning: ["Good morning! Fresh cells, fresh start!", "Rise and shine! Let's grow today!"],
          night: ["Curling into a cozy blob. Rest soon?", "Sleepy bloop. Sweet dreams, friend."],
          focus: ["Calm and squishy beside you. Go!", "Quiet little bloops of support!"],
          done: ["Session done! I'm bursting with joy!", "What focus! Bloop bloop hooray!"],
          task: ["BLOOP! DONE! WOO!", "Yes! That deserves a jelly hug!", "Checked off! I'm so proud!", "Another one done! Wobble dance!"],
          break: ["Stretch out like me! Way out!", "Water break! Cells love water!"]
        }
      }
    ]
  });
})();

