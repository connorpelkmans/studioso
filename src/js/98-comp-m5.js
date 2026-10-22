/* ===== module: 98-comp-m5.js ===== */
/* Study Companions, batch m5: observatory, ruins, valley, sketchcity */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const twinkle = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${c || "#fff"}"/>`;

  /* Observatory */
  COMP_DATA.push({
    theme: "observatory",
    companions: [
      {
        id: "observatory-scope", name: "Scope", kind: "Telescope", pose: "stand", wearColor: "#F2A33A",
        bio: "A starry little telescope who spots something amazing in you every night.",
        idle: ["topBob", "sway", "wave"], cheer: "hop",
        parts: {
          feet: `${LINE("M53 94L42 109M67 94L78 109M60 95V111", "#C99A52", 3)}
            <circle cx="42" cy="109.5" r="3.4" fill="#A9773A" ${O2}/><circle cx="78" cy="109.5" r="3.4" fill="#A9773A" ${O2}/><circle cx="60" cy="111" r="3.4" fill="#A9773A" ${O2}/>
            <rect x="52" y="88" width="16" height="8" rx="3" fill="#E3A845" ${O2}/>`,
          body: `${LG("observatory-scope-g", [[0, "#8396E6"], [0.5, "#5A6CC8"], [1, "#3B4796"]], 0, 0, 1, 1)}
            ${RG("observatory-scope-l", [[0, "#FFFFFF"], [0.5, "#D8EBFF"], [1, "#94B8EE"]], 0.38, 0.32, 0.8)}
            <rect x="93" y="21" width="11" height="9" rx="2.5" transform="rotate(-43 98.5 25.5)" fill="#3B4796" ${O}/>
            <path d="M38.2 47L79.1 26.5A13 13 0 0 1 96.9 45.5L73.8 85Z" fill="url(#observatory-scope-g)" ${O}/>
            ${LINE("M61 35.5Q76 45 86.5 63.5", "#F4C766", 4)}
            <path d="M68 33L86 26" stroke="#B8C6FF" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>
            ${twinkle(88, 45, 2.4, "#FFF3C4")}<circle cx="80" cy="56" r="1.1" fill="#DDE4FF"/>
            <circle cx="56" cy="66" r="26" fill="#F4C766" ${O}/>
            <circle cx="56" cy="66" r="21" fill="url(#observatory-scope-l)" ${OW(2.4)}/>
            <path d="M33 58Q35 47 44 42" fill="none" stroke="#FFF0BE" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M40 60Q41.5 52.5 48 49" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            ${twinkle(70, 54, 2.2, "#fff")}`,
          armL: {svg: `<ellipse cx="27" cy="77" rx="4.8" ry="6.6" transform="rotate(28 27 77)" fill="#F4C766" ${O}/>`, pivot: [33, 74]},
          armR: {svg: `<ellipse cx="85" cy="77" rx="4.8" ry="6.6" transform="rotate(-28 85 77)" fill="#F4C766" ${O}/>`, pivot: [79, 74]},
          top: {svg: `${LINE("M63 34L66 30", "#8E6A3A", 2)}<rect x="56" y="22" width="18" height="7" rx="3.5" transform="rotate(-30 65 25.5)" fill="#7D90E0" ${O2}/><circle cx="57.6" cy="29.6" r="2.6" fill="#D8EBFF" ${OW(1.8)}/>`, pivot: [64, 33]}
        },
        eyes: {lx: 47, rx: 65, y: 66, r: 5, style: "sparkle", color: "#1E2148"},
        mouth: {x: 56, y: 75, w: 3.1, color: "#1E2148"},
        cheeks: {lx: 40, rx: 72, y: 73, w: 4.2, h: 2.6, color: "#FF9FC0"},
        anchors: {top: [52, 43, 0.92], neck: [58, 91, 0.92], chest: [70, 84, 0.62], back: [32, 56, 0.85], hands: [56, 88, 0.86]},
        lines: {
          tap: ["Hi! I spotted a superstar, and it's you!", "Zooming in on greatness! Hello!", "You're shining brighter than any planet!", "Every page brings the universe closer!", "Look at you go! Out of this world!", "Big ideas, tiny lens, huge cheers for you!", "You've got this! I can see it clearly!", "Stargazing is fun, but you're the best view!"],
          pet: ["Hehe! My lens is all fogged up!", "Aww! Seeing stars, the happy kind!"],
          hello: ["You're back! Best sighting of the day!", "Hi hi! Lens polished and ready for you!"],
          morning: ["Good morning! The stars said hi for you!", "Rise and shine! Even the sun is cheering!"],
          night: ["The stars are out. Rest your eyes soon?", "Clear skies, cozy dreams. Sleep well!"],
          focus: ["Focused and steady, just like a lens.", "Watching the sky quietly beside you."],
          done: ["WOW! That session was stellar!", "Session done! A whole galaxy of focus!"],
          task: ["DONE! A brand new star just appeared!", "Woohoo! That one's out of this world!", "Checked off! I saw it through my lens!", "YES! Shooting star level awesome!"],
          break: ["Stretch time! Reach for the stars!", "Break time! Look out a window and smile!"]
        }
      },
      {
        id: "observatory-atom", name: "Adam", kind: "Atom", pose: "float", wearColor: "#4FA7D8",
        bio: "A bouncy little atom whose electrons zip around with excitement.",
        idle: ["tailSwish", "finWiggle", "sparkle"], cheer: "spin",
        parts: {
          back: `<ellipse cx="60" cy="62" rx="44" ry="13" transform="rotate(32 60 62)" fill="none" stroke="${INK}" stroke-width="5.4"/>
            <ellipse cx="60" cy="62" rx="44" ry="13" transform="rotate(32 60 62)" fill="none" stroke="#B9A6F2" stroke-width="2.8"/>
            <circle cx="28" cy="40" r="4.6" fill="#B9A6F2" ${O2}/><circle cx="27" cy="38.6" r="1.4" fill="#fff"/>`,
          tail: {svg: `<ellipse cx="60" cy="62" rx="44" ry="13" transform="rotate(-32 60 62)" fill="none" stroke="${INK}" stroke-width="5.4"/>
            <ellipse cx="60" cy="62" rx="44" ry="13" transform="rotate(-32 60 62)" fill="none" stroke="#7FD3F0" stroke-width="2.8"/>
            <circle cx="93.5" cy="42" r="5" fill="#7FD3F0" ${O2}/><circle cx="92.2" cy="40.4" r="1.6" fill="#fff"/>
            <circle cx="26.5" cy="83" r="4.4" fill="#FFE27A" ${O2}/><circle cx="25.4" cy="81.6" r="1.4" fill="#fff"/>`, pivot: [60, 62]},
          body: `${RG("observatory-atom-g", [[0, "#FFF0F4"], [0.5, "#FFB8CB"], [1, "#EC86A6"]], 0.4, 0.34, 0.72)}
            <circle cx="60" cy="62" r="24" fill="url(#observatory-atom-g)" ${O}/>
            <g fill="#FFD6E1" opacity=".7"><circle cx="72" cy="47" r="4.2"/><circle cx="80" cy="57" r="3.2"/><circle cx="43" cy="77" r="3.4"/><circle cx="74" cy="80" r="3.8"/></g>
            <ellipse cx="45" cy="51" rx="5.2" ry="3" transform="rotate(-38 45 51)" fill="#fff"/><circle cx="52.5" cy="45.5" r="1.6" fill="#fff"/>`,
          armL: {svg: `<ellipse cx="35.5" cy="72" rx="4.6" ry="5.8" transform="rotate(25 35.5 72)" fill="#F7A4BC" ${O}/>`, pivot: [40.5, 70]},
          armR: {svg: `<ellipse cx="84.5" cy="72" rx="4.6" ry="5.8" transform="rotate(-25 84.5 72)" fill="#F7A4BC" ${O}/>`, pivot: [79.5, 70]}
        },
        eyes: {lx: 51, rx: 69, y: 62, r: 4.8, style: "sparkle", color: "#3A1730"},
        mouth: {x: 60, y: 71, w: 3, color: "#3A1730"},
        cheeks: {lx: 43.5, rx: 76.5, y: 69, w: 4.2, h: 2.6, color: "#FF7FA6"},
        anchors: {top: [60, 40, 0.88], neck: [60, 82, 1], chest: [72, 77, 0.64], back: [86, 54, 0.8], hands: [60, 82, 0.85]},
        lines: {
          tap: ["Hi! My electrons are zooming with joy!", "You're full of positive energy today!", "Big things are made of tiny steps, like me!", "You've got amazing potential energy!", "Look at you, buzzing with ideas!", "Zip zip zip! You're doing great!", "You make my whole nucleus glow!", "We have great chemistry, you and me!"],
          pet: ["Hehe! My electrons are giggling!", "Whee! I'm totally excited now!"],
          hello: ["You're back! Every orbit just sped up!", "Hi hi! Full of energy and ready to go!"],
          morning: ["Good morning! Charged up for today!", "Rise and shine! Let's get the atoms moving!"],
          night: ["Slowing my orbits now. Rest soon?", "Low energy state, cozy mode. Sleep well!"],
          focus: ["Steady orbit, steady mind. You've got this.", "Humming quietly right beside you."],
          done: ["WOW! That session had serious energy!", "Session done! I'm totally electrified!"],
          task: ["DONE! That's a quantum leap!", "YES! My electrons are doing laps!", "Checked off! Pure positive energy!", "Woohoo! Splitting with joy over that one!"],
          break: ["Stretch it out! Spin around a little!", "Break time! Recharge those batteries!"]
        }
      },
      {
        id: "observatory-comet", name: "Zoom", kind: "Comet", pose: "float", wearColor: "#7B6FD6",
        bio: "A speedy little comet who streaks by to cheer on every study session.",
        idle: ["tailSwish", "sparkle", "sway"], cheer: "spin",
        parts: {
          tail: {svg: `${LG("observatory-comet-t", [[0, "#FFF2A8"], [0.35, "#FFC98E"], [0.68, "#FFAED2"], [1, "#BBA8F4"]], 0, 1, 1, 0)}
            <path d="M44 48C56 32 78 18 108 8C100 18 101 22 112 22C100 30 100 36 113 40C101 46 94 54 87 66C80 72 72 72 64 68C52 62 44 56 44 48Z" fill="url(#observatory-comet-t)" ${O}/>
            <path d="M66 46Q84 30 100 18M74 56Q90 46 104 38" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>
            ${twinkle(104, 30, 3, "#fff")}${twinkle(90, 14, 2.2, "#fff")}<circle cx="96" cy="50" r="1.4" fill="#fff"/>`, pivot: [66, 58]},
          body: `${RG("observatory-comet-g", [[0, "#FFFDF0"], [0.5, "#FFE07A"], [1, "#F5AE3C"]], 0.4, 0.35, 0.72)}
            <circle cx="60" cy="66" r="23.5" fill="url(#observatory-comet-g)" ${O}/>
            <ellipse cx="46" cy="55" rx="5.4" ry="3.1" transform="rotate(-38 46 55)" fill="#fff"/><circle cx="53.5" cy="49.5" r="1.7" fill="#fff"/>
            <path d="M45 82Q52 87 60 87.5" fill="none" stroke="#E9962E" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>`,
          armL: {svg: `<ellipse cx="36" cy="76" rx="4.6" ry="5.8" transform="rotate(25 36 76)" fill="#FFD25E" ${O}/>`, pivot: [41, 74]},
          armR: {svg: `<ellipse cx="84" cy="76" rx="4.6" ry="5.8" transform="rotate(-25 84 76)" fill="#FFD25E" ${O}/>`, pivot: [79, 74]}
        },
        eyes: {lx: 51, rx: 69, y: 65, r: 5, style: "sparkle", color: "#3A2414"},
        mouth: {x: 60, y: 74, w: 3.1, color: "#3A2414"},
        cheeks: {lx: 43.5, rx: 76.5, y: 72.5, w: 4.3, h: 2.7, color: "#FF8F8F"},
        anchors: {top: [56, 45, 0.85], neck: [60, 86, 0.95], chest: [72, 81, 0.66], back: [36, 58, 0.8], hands: [60, 85, 0.85]},
        lines: {
          tap: ["Zoom zoom! Hi there, superstar!", "Whoosh! You're on a roll today!", "Look at you streaking through your list!", "You leave a sparkly trail everywhere!", "Full speed ahead! You've got this!", "Making a wish, and it's all for you!", "You're the brightest thing in the sky!", "Every lap around the sun, you grow!"],
          pet: ["Wheee! My tail is all sparkly!", "Hehe! That gave me a speed boost!"],
          hello: ["Whoosh! You're back! I zoomed right over!", "Hi hi! Ready to blaze a trail?"],
          morning: ["Good morning! Let's zoom into the day!", "Rise and shine! Fresh sky, fresh start!"],
          night: ["Gliding slowly now. Time to rest soon?", "Soft glow, sweet dreams. Sleep well!"],
          focus: ["Cruising quietly beside you. Keep going.", "Steady glide. You've got this."],
          done: ["WHOOSH! What a blazing session!", "Session done! You lit up the whole sky!"],
          task: ["ZOOM! Done and dusted! WOO!", "YES! Make a wish, that one's finished!", "Checked off at lightspeed! Amazing!", "Another one done! Sparkle trail!"],
          break: ["Slow orbit time! Stretch and breathe!", "Break time! Twirl around a little!"]
        }
      }
    ]
  });

  /* Ancient Ruins */
  COMP_DATA.push({
    theme: "ruins",
    companions: [
      {
        id: "ruins-hourglass", name: "Sandy", kind: "Hourglass", pose: "stand", wearColor: "#3E8FB0",
        bio: "A cheerful hourglass who knows every grain of effort adds up.",
        idle: ["topBob", "sway", "wave"], cheer: "spin",
        parts: {
          feet: `<circle cx="36" cy="109.5" r="3.8" fill="#8C5530" ${O2}/><circle cx="84" cy="109.5" r="3.8" fill="#8C5530" ${O2}/>`,
          body: `${LG("ruins-hourglass-w", [[0, "#D39462"], [1, "#9A5F36"]])}
            ${LG("ruins-hourglass-s", [[0, "#FFE29A"], [1, "#E8AE4E"]])}
            <path d="M42 30C34 41 37 51 47 57.5C53.5 61.5 57 63 57.5 65.5C57 68 53.5 69.5 47 73.5C37 80 34 90 42 100H78C86 90 83 80 73 73.5C66.5 69.5 63 68 62.5 65.5C63 63 66.5 61.5 73 57.5C83 51 86 41 78 30Z" fill="#EAF6FF" fill-opacity=".9" ${O}/>
            <path d="M47 57.5Q60 54.5 73 57.5C66.5 61.5 63 63 62.5 65.5H57.5C57 63 53.5 61.5 47 57.5Z" fill="url(#ruins-hourglass-s)"/>
            <path d="M60 65V90" stroke="#F0BC5C" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M41.5 100C42.5 91 51 86.5 60 86.5C69 86.5 77.5 91 78.5 100Z" fill="url(#ruins-hourglass-s)"/>
            <path d="M42 30C34 41 37 51 47 57.5C53.5 61.5 57 63 57.5 65.5C57 68 53.5 69.5 47 73.5C37 80 34 90 42 100H78C86 90 83 80 73 73.5C66.5 69.5 63 68 62.5 65.5C63 63 66.5 61.5 73 57.5C83 51 86 41 78 30Z" fill="none" ${O}/>
            <path d="M41.5 38Q39.5 46 44 52M42 83Q40.5 89 43 94" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            <rect x="28.5" y="29" width="6.5" height="72" rx="3" fill="url(#ruins-hourglass-w)" ${OW(2.4)}/><rect x="85" y="29" width="6.5" height="72" rx="3" fill="url(#ruins-hourglass-w)" ${OW(2.4)}/>
            <rect x="25" y="22" width="70" height="9" rx="4.5" fill="url(#ruins-hourglass-w)" ${O}/><rect x="25" y="99" width="70" height="9" rx="4.5" fill="url(#ruins-hourglass-w)" ${O}/>
            <path d="M30 25.5H62M30 102.5H62" stroke="#EBB98A" stroke-width="2" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="23" cy="68" rx="4.8" ry="6.6" transform="rotate(26 23 68)" fill="#C9884F" ${O}/>`, pivot: [29, 66]},
          armR: {svg: `<ellipse cx="97" cy="68" rx="4.8" ry="6.6" transform="rotate(-26 97 68)" fill="#C9884F" ${O}/>`, pivot: [91, 66]},
          top: {svg: `${LINE("M60 22V17", "#9A5F36", 3)}<circle cx="60" cy="14" r="4.6" fill="#E3A845" ${O2}/><circle cx="58.6" cy="12.6" r="1.4" fill="#FFF0BE"/>`, pivot: [60, 22]}
        },
        eyes: {lx: 51, rx: 69, y: 43, r: 4.6, style: "dot", color: "#2E2240"},
        mouth: {x: 60, y: 50.5, w: 2.9, color: "#2E2240"},
        cheeks: {lx: 44, rx: 76, y: 49, w: 4, h: 2.5, color: "#FF9FB0"},
        anchors: {top: [60, 21, 0.95], neck: [60, 66, 0.85], chest: [70, 91, 0.66], back: [94, 52, 0.85], hands: [60, 86, 0.9]},
        lines: {
          tap: ["Hi! Every grain of effort counts!", "Tick tock, you're doing amazing!", "Time flies when you're this awesome!", "Little by little, you're making history!", "You turn hours into wonders!", "One grain at a time, you've got this!", "Ancient wisdom says you're incredible!", "History will remember this study session!"],
          pet: ["Hehe! My sand is all wiggly!", "Aww! That's a timeless pat!"],
          hello: ["You're back! Right on time, as always!", "Hi hi! Let's make every minute shine!"],
          morning: ["Good morning! A fresh glass of time!", "Rise and shine! The day is all yours!"],
          night: ["My sand is settling. Time to rest soon?", "Even time takes naps. Sleep well!"],
          focus: ["Sand falling softly. You're doing great.", "Quiet minutes, steady you."],
          done: ["WOW! Time well spent! Amazing!", "Session done! That was legendary!"],
          task: ["DONE! Flip me over, let's celebrate!", "YES! That one's history now!", "Checked off! Time to cheer! WOO!", "Another one done! Golden grains!"],
          break: ["Flip time! Stretch tall and breathe!", "Break time! Let the sand rest a bit!"]
        }
      },
      {
        id: "ruins-knight", name: "Sir Clank", kind: "Little Knight", pose: "stand", wearColor: "#E8566B", hatTop: true,
        bio: "A brave little knight sworn to protect your study time.",
        idle: ["topBob", "headTilt", "wave"], cheer: "wave",
        neck: [60, 74],
        parts: {
          feet: `<path d="M42 104H56V108Q56 111.5 52 111.5H44Q40 111.5 40 108.5Q40 105.5 42 104Z" fill="#8E9AAE" ${O}/><path d="M78 104H64V108Q64 111.5 68 111.5H76Q80 111.5 80 108.5Q80 105.5 78 104Z" fill="#8E9AAE" ${O}/>`,
          body: `${LG("ruins-knight-b", [[0, "#E4E9F2"], [1, "#9DA8BC"]])}
            <path d="M60 70C76 70 82 82 82 93C82 104 74 107.5 60 107.5C46 107.5 38 104 38 93C38 82 44 70 60 70Z" fill="url(#ruins-knight-b)" ${O}/>
            <path d="M48 73H72L70.5 102Q60 106 49.5 102Z" fill="#4F7BD6" ${OW(2.4)}/>
            <path d="M60 81L64 86.5L60 92L56 86.5Z" fill="#F4C766" ${OW(1.8)}/>
            <path d="M49.5 96.5Q60 99.5 70.5 96.5" fill="none" stroke="#F4C766" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M51 77Q52 74.5 55 74.5" fill="none" stroke="#9DB9F2" stroke-width="2" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="38.5" cy="89" rx="5.2" ry="6.8" transform="rotate(26 38.5 89)" fill="#C7CFDC" ${O}/><path d="M36 86.5Q38 85 40.5 85.5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [44, 85]},
          armR: {svg: `<ellipse cx="81.5" cy="89" rx="5.2" ry="6.8" transform="rotate(-26 81.5 89)" fill="#C7CFDC" ${O}/>`, pivot: [76, 85]},
          head: `${RG("ruins-knight-h", [[0, "#FFFFFF"], [0.5, "#DCE2EC"], [1, "#9DA8BC"]], 0.38, 0.3, 0.75)}
            <circle cx="60" cy="49" r="26" fill="url(#ruins-knight-h)" ${O}/>
            <path d="M42.5 45Q42.5 38.5 50 38.5H70Q77.5 38.5 77.5 45V58Q77.5 68.5 60 69.5Q42.5 68.5 42.5 58Z" fill="#FFE3CC" ${OW(2.4)}/>
            <path d="M37 37Q60 25 83 37" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M37 37Q60 25 83 37" fill="none" stroke="#B9C3D4" stroke-width="3.2" stroke-linecap="round"/>
            <path d="M41 33Q46 28 52 26.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
            <circle cx="37.5" cy="54" r="1.6" fill="#7E8AA0"/><circle cx="82.5" cy="54" r="1.6" fill="#7E8AA0"/>`,
          top: {svg: `${LG("ruins-knight-p", [[0, "#FF8A9A"], [1, "#D9445C"]])}
            <path d="M59 25C55 15 61 5.5 74 4.5C70.5 8 72 11 79.5 11C73.5 14.5 75 18 82.5 19.5C75 25.5 66 25.5 61.5 27Z" fill="url(#ruins-knight-p)" ${O}/>
            <path d="M62 22Q65 13 72 8.5M66 23Q72 18 78 17" fill="none" stroke="#FFC4CD" stroke-width="1.8" stroke-linecap="round"/>
            <rect x="55.5" y="22.5" width="9" height="6" rx="2.2" fill="#F4C766" ${OW(2.2)}/>`, pivot: [60, 27]}
        },
        eyes: {lx: 51, rx: 69, y: 52, r: 4.4, style: "dot", color: "#2B2233"},
        mouth: {x: 60, y: 61, w: 2.8},
        cheeks: {lx: 46, rx: 74, y: 59, w: 3.8, h: 2.4, color: "#FF9FA8"},
        anchors: {top: [60, 25, 1], neck: [60, 75, 1], chest: [70, 93, 0.66], back: [80, 88, 0.8], hands: [60, 95, 0.85]},
        lines: {
          tap: ["Huzzah! Greetings, brave scholar!", "Onward! Your quest goes splendidly!", "I shall guard your focus with honor!", "Clank clank! You're doing marvelously!", "Every page is a battle won!", "You've got the heart of a hero!", "By my helmet, you're amazing!", "Your study quest makes legends!"],
          pet: ["Clank! My armor is blushing!", "Hehe! A knightly pat, most kind!"],
          hello: ["Huzzah! My hero returns!", "Hail, friend! The castle missed you!"],
          morning: ["Good morrow! A grand quest awaits!", "Rise and shine, noble scholar!"],
          night: ["The castle sleeps. Rest well, brave one.", "Sheathing my sword for the night. Sleep well!"],
          focus: ["Standing guard quietly. You've got this.", "No distractions shall pass. Onward."],
          done: ["HUZZAH! A legendary session!", "Victory! The bards will sing of this!"],
          task: ["HUZZAH! Quest complete!", "Clank clank! Another victory! WOO!", "Done! I raise my shield for you!", "YES! A heroic deed indeed!"],
          break: ["Rest your sword arm! Big stretch!", "Feast break! A snack fit for a hero!"]
        }
      },
      {
        id: "ruins-scroll", name: "Scrolly", kind: "Scroll", pose: "stand", wearColor: "#C2453D",
        bio: "An ancient little scroll who can't wait to record your story.",
        idle: ["topBob", "sway", "wave"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="50" cy="109.5" rx="6" ry="3.6" fill="#9B6236" ${O}/><ellipse cx="70" cy="109.5" rx="6" ry="3.6" fill="#9B6236" ${O}/>`,
          body: `${LG("ruins-scroll-p", [[0, "#FFF8E4"], [0.6, "#FBEBC4"], [1, "#EED7A2"]])}
            ${LG("ruins-scroll-r", [[0, "#FFF2CF"], [0.55, "#F0D9A2"], [1, "#D4B379"]])}
            <path d="M37 34H83Q80.5 50 83 66Q85.5 82 83 98H37Q34.5 82 37 66Q39.5 50 37 34Z" fill="url(#ruins-scroll-p)" ${O}/>
            <path d="M47 84H73M50 89H70" stroke="#D9BE8A" stroke-width="2" stroke-linecap="round"/>
            <path d="M41.5 42Q40 54 42 64" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            ${LINE("M27 30H93", "#9B6236", 3)}${LINE("M27 101H93", "#9B6236", 3)}
            <rect x="32" y="23.5" width="56" height="13" rx="6.5" fill="url(#ruins-scroll-r)" ${O}/><rect x="32" y="94.5" width="56" height="13" rx="6.5" fill="url(#ruins-scroll-r)" ${O}/>
            <path d="M37 27.5H70M37 98.5H70" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".85"/>
            <circle cx="25.5" cy="30" r="3.6" fill="#C98A4E" ${O2}/><circle cx="94.5" cy="30" r="3.6" fill="#C98A4E" ${O2}/><circle cx="25.5" cy="101" r="3.6" fill="#C98A4E" ${O2}/><circle cx="94.5" cy="101" r="3.6" fill="#C98A4E" ${O2}/>`,
          armL: {svg: `<ellipse cx="32" cy="68" rx="4.8" ry="6.6" transform="rotate(26 32 68)" fill="#F6E3B4" ${O}/>`, pivot: [38, 66]},
          armR: {svg: `<ellipse cx="88" cy="68" rx="4.8" ry="6.6" transform="rotate(-26 88 68)" fill="#F6E3B4" ${O}/>`, pivot: [82, 66]},
          top: {svg: `${LINE("M72 30Q78 24 81 20", "#7A5A8C", 1.6)}<path d="M79 22C80 13 88 6 97 4C96 12 90 20 79 22Z" fill="#B9A6F2" ${O2}/><path d="M81 20.5Q88 13 95 6" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity=".85"/>`, pivot: [73, 30]}
        },
        eyes: {lx: 50.5, rx: 69.5, y: 58, r: 4.8, style: "dot", color: "#3A2414"},
        mouth: {x: 60, y: 67, w: 3, color: "#3A2414"},
        cheeks: {lx: 43, rx: 77, y: 65.5, w: 4.3, h: 2.7, color: "#FF9F9F"},
        anchors: {top: [60, 22, 0.95], neck: [60, 90, 1.08], chest: [72, 82, 0.68], back: [88, 60, 0.85], hands: [60, 88, 0.88]},
        lines: {
          tap: ["Hi! I'm writing you into the history books!", "You're making legendary progress!", "Every great story starts with today!", "Unroll the fun! You're doing great!", "You're the hero of this chapter!", "A scroll full of wins, all yours!", "I'm keeping a record of your awesomeness!", "Wise scholars long ago would cheer for you!"],
          pet: ["Hehe! I'm curling up with joy!", "Aww! My edges are all crinkly happy!"],
          hello: ["You're back! A brand new chapter begins!", "Hi hi! I unrolled myself just for you!"],
          morning: ["Good morning! A fresh page of history!", "Rise and shine! Let's write today's story!"],
          night: ["Rolling up for the night. Rest soon?", "The story continues tomorrow. Sleep well!"],
          focus: ["Taking quiet notes beside you.", "Soft scribbles of support. You've got this."],
          done: ["WOW! A truly historic session!", "Session done! This one goes in the archive!"],
          task: ["DONE! Recorded for all of history!", "YES! Another legendary entry! WOO!", "Checked off! I'm unrolling with pride!", "Hooray! That's one for the ages!"],
          break: ["Unroll and stretch! So nice!", "Break time! A snack worthy of a scholar!"]
        }
      }
    ]
  });

  /* Green Valley */
  COMP_DATA.push({
    theme: "valley",
    companions: [
      {
        id: "valley-earth", name: "Terra", kind: "Little Earth", pose: "float", wearColor: "#F2A33A",
        bio: "A tiny planet with a big green heart who grows with every win.",
        idle: ["topBob", "finWiggle", "sparkle"], cheer: "spin",
        parts: {
          body: `${RG("valley-earth-g", [[0, "#C8F0FF"], [0.5, "#7CC4F0"], [1, "#3D8BD6"]], 0.4, 0.34, 0.75)}
            <defs><clipPath id="valley-earth-c"><circle cx="60" cy="63" r="26"/></clipPath></defs>
            <circle cx="60" cy="63" r="26" fill="url(#valley-earth-g)"/>
            <g clip-path="url(#valley-earth-c)" fill="#86CF6E" stroke="#5DAA55" stroke-width="1.6" stroke-linejoin="round">
              <path d="M44 38C50 35 58 37 62 41C66 45 72 44 76 47C79 50 74 53 68 52C62 51 58 55 52 54C46 53 40 50 39 46C38 42 40 40 44 38Z"/>
              <path d="M82 58C86 60 88 66 86 72C84 76 80 74 79 70C78 66 78 60 82 58Z"/>
              <path d="M50 80C56 78 66 79 72 82C78 85 76 92 68 92C62 92 56 90 52 88C47 86 46 82 50 80Z"/>
              <path d="M32 62C35 60 38 64 37 69C36 73 32 74 31 70Z"/>
            </g>
            <path d="M47 46.5Q51 45 55 46.5M71 87Q74 86 77 87" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".9"/>
            <circle cx="60" cy="63" r="26" fill="none" ${O}/>
            <ellipse cx="44.5" cy="51" rx="5.4" ry="3" transform="rotate(-40 44.5 51)" fill="#fff" opacity=".95"/><circle cx="51.5" cy="45" r="1.6" fill="#fff"/>`,
          armL: {svg: `<path d="M35.5 69C29 68 25 72 25 78C31 79.5 35.5 76.5 37.5 72Z" fill="#8FD07A" ${O}/>`, pivot: [37, 70]},
          armR: {svg: `<path d="M84.5 69C91 68 95 72 95 78C89 79.5 84.5 76.5 82.5 72Z" fill="#8FD07A" ${O}/>`, pivot: [83, 70]},
          top: {svg: `${LINE("M60 38C60 33 59.5 30 60.5 26", "#5DAA62", 2.4)}
            <path d="M60 28C55.5 20 46.5 19.5 42.5 24C46.5 30 54.5 31.5 60 28Z" fill="#8AD08A" ${O2}/><path d="M58 27.5Q51.5 24 45.5 24.5" fill="none" stroke="#5DAA62" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M60.5 27C63.5 18.5 72.5 15.5 78 19C75.5 26 67.5 30 60.5 27Z" fill="#9BDA95" ${O2}/><path d="M62.5 26Q69 21.5 75.5 19.8" fill="none" stroke="#5DAA62" stroke-width="1.5" stroke-linecap="round"/>`, pivot: [60, 38]}
        },
        eyes: {lx: 50.5, rx: 69.5, y: 63, r: 4.9, style: "dot", color: "#1E2A44"},
        mouth: {x: 60, y: 72, w: 3.1, color: "#1E2A44"},
        cheeks: {lx: 43, rx: 77, y: 70.5, w: 4.3, h: 2.7, color: "#FF9FB7"},
        anchors: {top: [60, 39, 0.9], neck: [60, 85, 1], chest: [72, 81, 0.64], back: [86, 56, 0.8], hands: [60, 84, 0.85]},
        lines: {
          tap: ["Hi! The whole world is cheering for you!", "You make my forests grow greener!", "Look at you, making the world better!", "Big round hugs from one planet to you!", "You're a force of nature today!", "Every little step helps the planet grow!", "My oceans are sparkling just for you!", "You've got this! Earth believes in you!"],
          pet: ["Hehe! You made my clouds swirl!", "Aww! A warm sunny glow all over!"],
          hello: ["You're back! The sun just came out!", "Hi hi! The whole valley missed you!"],
          morning: ["Good morning! A brand new sunrise for you!", "Rise and shine! Let's grow something today!"],
          night: ["My night side says time to rest soon.", "Stars out, valley quiet. Sleep well!"],
          focus: ["Spinning softly beside you. Keep going.", "Calm skies, steady you. You've got this."],
          done: ["WOW! That session was a breath of fresh air!", "Session done! The whole planet is proud!"],
          task: ["DONE! A new tree just sprouted! WOO!", "YES! That one's good for the planet!", "Checked off! Blooming with pride!", "Another one done! Green light all the way!"],
          break: ["Fresh air break! Stretch toward the sky!", "Break time! Sip some water, plant style!"]
        }
      },
      {
        id: "valley-turbine", name: "Whirl", kind: "Wind Turbine", pose: "stand", wearColor: "#4FA36B",
        bio: "A breezy wind turbine who spins up good energy for your studies.",
        idle: ["tailSwish", "headTilt", "wave"], cheer: "spin",
        neck: [60, 62],
        parts: {
          tail: {svg: `${LG("valley-turbine-bl", [[0, "#FFFFFF"], [1, "#DCE8F2"]], 0, 0, 1, 0)}
            <g fill="url(#valley-turbine-bl)" ${O}>
              <path d="M60 44C51.5 35 51 16 58.5 5C67 9 68.5 30 60 44Z"/>
              <path d="M60 44C51.5 35 51 16 58.5 5C67 9 68.5 30 60 44Z" transform="rotate(120 60 44)"/>
              <path d="M60 44C51.5 35 51 16 58.5 5C67 9 68.5 30 60 44Z" transform="rotate(240 60 44)"/>
            </g>
            <g fill="#8FD6A8"><path d="M58.8 6.6C56 10 54.6 13.5 54 17H65.2C64.6 12 62.6 8.4 58.8 6.6Z"/><path d="M58.8 6.6C56 10 54.6 13.5 54 17H65.2C64.6 12 62.6 8.4 58.8 6.6Z" transform="rotate(120 60 44)"/><path d="M58.8 6.6C56 10 54.6 13.5 54 17H65.2C64.6 12 62.6 8.4 58.8 6.6Z" transform="rotate(240 60 44)"/></g>`, pivot: [60, 44]},
          feet: `${LG("valley-turbine-gr", [[0, "#A6DE86"], [1, "#6DB65E"]])}<path d="M30 110C30 103 44 100.5 60 100.5C76 100.5 90 103 90 110Z" fill="url(#valley-turbine-gr)" ${O}/><path d="M38 104.5Q44 102.5 50 102.5" fill="none" stroke="#D6F4C2" stroke-width="2.2" stroke-linecap="round"/>`,
          body: `${LG("valley-turbine-b", [[0, "#FFFFFF"], [0.7, "#EEF3F8"], [1, "#C9D6E4"]], 0, 0, 1, 0)}
            <path d="M51 58H69L76 102Q60 107 44 102Z" fill="url(#valley-turbine-b)" ${O}/>
            <path d="M54.5 93Q54.5 87.5 60 87.5Q65.5 87.5 65.5 93V104H54.5Z" fill="#7FB8E6" ${OW(2.2)}/>
            <circle cx="63" cy="96.5" r="1.1" fill="${INK}"/>
            <path d="M54 64L50 92" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="44.5" cy="80" rx="4.4" ry="6.2" transform="rotate(26 44.5 80)" fill="#F4F7FB" ${O}/>`, pivot: [50.5, 77]},
          armR: {svg: `<ellipse cx="75.5" cy="80" rx="4.4" ry="6.2" transform="rotate(-26 75.5 80)" fill="#F4F7FB" ${O}/>`, pivot: [69.5, 77]},
          head: `${RG("valley-turbine-h", [[0, "#FFFFFF"], [0.6, "#F1F5FA"], [1, "#C7D4E3"]], 0.4, 0.34, 0.75)}
            <circle cx="60" cy="44.5" r="21.5" fill="url(#valley-turbine-h)" ${O}/>
            <path d="M44 37Q47 30 53.5 27" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            <circle cx="60" cy="27" r="1.9" fill="#F27A6B"/>`
        },
        eyes: {lx: 51.5, rx: 68.5, y: 45, r: 4.6, style: "dot", color: "#24324A"},
        mouth: {x: 60, y: 53, w: 2.8, color: "#24324A"},
        cheeks: {lx: 45, rx: 75, y: 51.5, w: 4, h: 2.5, color: "#FF9FB0"},
        anchors: {top: [60, 26, 0.86], neck: [60, 63, 0.72], chest: [67.5, 79, 0.56], back: [74, 84, 0.78], hands: [60, 84, 0.8]},
        lines: {
          tap: ["Whoosh! Hi hi! Spinning with joy!", "You bring the best breeze!", "Clean energy, clear mind, that's you!", "Look at you, powering through!", "Every spin makes more good energy!", "You've got this! Full power ahead!", "Breezy day, bright you, big cheers!", "You're a total powerhouse today!"],
          pet: ["Hehe! My blades are all wobbly!", "Whee! That's a happy little gust!"],
          hello: ["Whoosh! You're back! Full spin ahead!", "Hi hi! The wind picked up just for you!"],
          morning: ["Good morning! Fresh breeze, fresh start!", "Rise and shine! Let's power up the day!"],
          night: ["Slow spins now. Time to rest soon?", "Gentle breeze, cozy dreams. Sleep well!"],
          focus: ["Turning steadily beside you. Keep going.", "Quiet hum, steady power. You've got this."],
          done: ["WHOOSH! What a powerful session!", "Session done! Fully charged with pride!"],
          task: ["DONE! Full spin! WOO!", "YES! That one powered the whole valley!", "Checked off! Clean, green and finished!", "Another one done! Whirly whoosh!"],
          break: ["Breezy break! Stretch your arms wide!", "Break time! Step outside for fresh air!"]
        }
      },
      {
        id: "valley-moss", name: "Mossy", kind: "Moss Ball", pose: "sit", sleepy: true, wearColor: "#E8836B",
        bio: "A soft, fuzzy moss ball who grows a tiny bit with every study day.",
        idle: ["bounce", "topBob", "finWiggle"], cheer: "hop",
        parts: {
          feet: `${LG("valley-moss-w", [[0, "#D8F1FB"], [1, "#9ED3EC"]])}
            <ellipse cx="60" cy="106.5" rx="39" ry="6.5" fill="url(#valley-moss-w)" ${O}/>
            <path d="M28 106Q34 104 40 106M82 106Q88 104 94 106" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`,
          body: `${RG("valley-moss-g", [[0, "#C9EE8E"], [0.55, "#86C85E"], [1, "#4E9A44"]], 0.42, 0.34, 0.75)}
            <path d="${puff(60, 75, 31, 24, 1.32)}" fill="url(#valley-moss-g)" ${O}/>
            <g stroke="#5FA84B" stroke-width="1.6" stroke-linecap="round" opacity=".75">
              <path d="M37 72l2.5 2M83 70l-2 2.6M42 92l2.6-1.4M78 93l-2.4-1.8M58 99l1 2.6M70 99.5l-.6 2.4M48 99l1.2 2.2M34 82l2.6.6M86 82l-2.6.8"/>
            </g>
            <g stroke="#E2F7B8" stroke-width="1.6" stroke-linecap="round" opacity=".9">
              <path d="M68 52l1.6-2.2M78 60l2.4-1M52 51l-1-2.4"/>
            </g>
            <ellipse cx="45" cy="59" rx="6" ry="3.4" transform="rotate(-38 45 59)" fill="#fff" opacity=".9"/><circle cx="53" cy="53" r="1.8" fill="#fff" opacity=".9"/>`,
          armL: {svg: `<path d="${puff(31.5, 86, 5.8, 8, 1.3)}" fill="#7DC05A" ${O}/>`, pivot: [36, 84]},
          armR: {svg: `<path d="${puff(88.5, 86, 5.8, 8, 1.3)}" fill="#7DC05A" ${O}/>`, pivot: [84, 84]},
          top: {svg: `<circle cx="72" cy="35" r="3.6" fill="#E6F7FF" fill-opacity=".8" stroke="#7FBAD8" stroke-width="1.8"/><circle cx="71" cy="34" r="1" fill="#fff"/>
            <circle cx="79" cy="26" r="2.4" fill="#E6F7FF" fill-opacity=".8" stroke="#7FBAD8" stroke-width="1.6"/>
            ${LINE("M60 45C59.5 40 58 37 55.5 34", "#5DAA62", 2.2)}<path d="M55.5 35C50 31 50 25.5 53 23C57 26 58.5 31 55.5 35Z" fill="#A6DE86" ${O2}/>`, pivot: [60, 46]}
        },
        eyes: {lx: 49, rx: 71, y: 75, r: 5, style: "dot", color: "#1F3320"},
        mouth: {x: 60, y: 83.5, w: 3.2, color: "#1F3320"},
        cheeks: {lx: 40.5, rx: 79.5, y: 82, w: 4.8, h: 3, color: "#FF9FA8"},
        anchors: {top: [60, 46, 1], neck: [60, 98, 1.15], chest: [79, 95, 0.74], back: [90, 76, 0.9], hands: [60, 99, 0.9]},
        lines: {
          tap: ["Hi! I'm a fuzzy ball of cheer for you!", "Soft and steady, and you're thriving!", "Growing a little every day, just like you!", "Bloop! You're doing wonderfully!", "Fuzzy hugs for my favorite studier!", "You make my moss extra green!", "Slow growth is still growth! Go you!", "I'm rolling around with pride for you!"],
          pet: ["Hehe! So fuzzy, so happy!", "Bloop bloop! That's the best feeling!"],
          hello: ["You're back! Happy little bloops!", "Hi hi! I rolled over to say hello!"],
          morning: ["Good morning! Soaking up the sunshine!", "Rise and shine! Let's grow today!"],
          night: ["Sinking down for a cozy nap. You too?", "Calm water, sleepy moss. Sleep well!"],
          focus: ["Floating calmly beside you. Keep going.", "Quiet and fuzzy. You've got this."],
          done: ["WOW! What a lush, lovely session!", "Session done! I grew a whole millimeter!"],
          task: ["DONE! Happy bloops all around! WOO!", "YES! I'm floating up with joy!", "Checked off! So fresh, so green!", "Another one done! Fuzzy high five!"],
          break: ["Float and stretch! Bloop bloop!", "Water break! Moss approved!"]
        }
      }
    ]
  });

  /* Sketch City */
  COMP_DATA.push({
    theme: "sketchcity",
    companions: [
      {
        id: "sketchcity-house", name: "Homey", kind: "Little House", pose: "stand", wearColor: "#5B8FD6",
        bio: "A cozy little house who builds you up, one brick at a time.",
        idle: ["topBob", "sway", "wave"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="49" cy="108.5" rx="7" ry="4" fill="#9C8577" ${O}/><ellipse cx="71" cy="108.5" rx="7" ry="4" fill="#9C8577" ${O}/>`,
          body: `${LG("sketchcity-house-w", [[0, "#FFF8EC"], [1, "#F0DCC0"]])}
            <path d="M36 56H84V98Q84 105 77 105H43Q36 105 36 98Z" fill="url(#sketchcity-house-w)" ${O}/>
            <path d="M53.5 105V93Q53.5 87.5 60 87.5Q66.5 87.5 66.5 93V105" fill="#7FB0E0" ${OW(2.4)}/>
            <circle cx="63.6" cy="97" r="1.2" fill="${INK}"/>
            <path d="M40.5 66Q40 80 41.5 92" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            <path d="M74 95h6M72 99.5h6M42 99.5h6" stroke="#E2C9A6" stroke-width="2" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="31.5" cy="82" rx="4.8" ry="6.6" transform="rotate(26 31.5 82)" fill="#FBEBD6" ${O}/>`, pivot: [38, 79]},
          armR: {svg: `<ellipse cx="88.5" cy="82" rx="4.8" ry="6.6" transform="rotate(-26 88.5 82)" fill="#FBEBD6" ${O}/>`, pivot: [82, 79]},
          top: {svg: `${LG("sketchcity-house-r", [[0, "#F79B7A"], [1, "#D9604A"]])}
            <path d="M72 46V29.5Q72 28 73.5 28H79.5Q81 28 81 29.5V46Z" fill="#B97A5E" ${O}/><path d="M71 28H82" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
            <circle cx="80" cy="20" r="3.2" fill="#fff" ${OW(1.8)}/><circle cx="85" cy="13.5" r="2.2" fill="#fff" ${OW(1.6)}/>
            <path d="M60 25Q62.5 25 64.5 27L91.5 52.5Q94.5 56 92.5 59Q91 61 88 61H32Q29 61 27.5 59Q25.5 56 28.5 52.5L55.5 27Q57.5 25 60 25Z" fill="url(#sketchcity-house-r)" ${O}/>
            <path d="M41 50Q45 53 49 50Q53 53 57 50Q61 53 65 50Q69 53 73 50Q77 53 81 50" fill="none" stroke="#C14F3B" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>
            <path d="M50 41Q54 44 58 41Q62 44 66 41Q70 44 72 42" fill="none" stroke="#C14F3B" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>
            <path d="M35 51L54 33" stroke="#FFD0BC" stroke-width="2.6" stroke-linecap="round"/>`, pivot: [60, 60]}
        },
        eyes: {lx: 50, rx: 70, y: 71, r: 4.8, style: "dot", color: "#2E2233"},
        mouth: {x: 60, y: 79.5, w: 3},
        cheeks: {lx: 43, rx: 77, y: 78, w: 4.3, h: 2.7, color: "#FF9FA8"},
        anchors: {top: [60, 33, 0.9], neck: [60, 91, 1.12], chest: [76, 90, 0.66], back: [86, 74, 0.85], hands: [60, 95, 0.88]},
        lines: {
          tap: ["Hi! Welcome home, friend!", "You're building something amazing!", "Brick by brick, you're doing great!", "My door is always open for you!", "Solid foundations, that's you!", "You've got this! Strong walls, strong you!", "Lights on, heart full, cheering for you!", "You make this place feel like home!"],
          pet: ["Hehe! My chimney is puffing happily!", "Aww! Cozy and warm all over!"],
          hello: ["You're home! I kept the lights on!", "Hi hi! Come in, come in!"],
          morning: ["Good morning! Curtains open, sun in!", "Rise and shine! Let's build a great day!"],
          night: ["Porch light's on low. Rest soon?", "Cozy house, cozy dreams. Sleep well!"],
          focus: ["Quiet house, calm mind. Keep going.", "Building softly beside you."],
          done: ["WOW! What a well-built session!", "Session done! I'm proud from roof to floor!"],
          task: ["DONE! Another brick in place! WOO!", "YES! Raise the roof for that one!", "Checked off! Housewarming party time!", "Another one done! Home sweet win!"],
          break: ["Stretch time! Open a window and breathe!", "Break time! Cozy snack in the kitchen?"]
        }
      },
      {
        id: "sketchcity-crane", name: "Lifty", kind: "Construction Crane", pose: "stand", wearColor: "#3E7CC8",
        bio: "A hardworking little crane who lifts your spirits sky high.",
        idle: ["topBob", "bounce", "wave"], cheer: "hop",
        parts: {
          feet: `${LG("sketchcity-crane-t", [[0, "#7A8292"], [1, "#4C5262"]])}
            <rect x="29" y="96" width="62" height="14.5" rx="7.25" fill="url(#sketchcity-crane-t)" ${O}/>
            <g fill="#B8C0CE" ${OW(1.8)}><circle cx="38" cy="103.2" r="3.6"/><circle cx="50" cy="103.2" r="3.6"/><circle cx="62" cy="103.2" r="3.6"/><circle cx="74" cy="103.2" r="3.6"/><circle cx="84" cy="103.2" r="3"/></g>`,
          body: `${LG("sketchcity-crane-b", [[0, "#FFE27A"], [0.6, "#FFC93E"], [1, "#EFA52A"]])}
            <path d="M44 52H76Q84 52 84 60V90Q84 97 77 97H43Q36 97 36 90V60Q36 52 44 52Z" fill="url(#sketchcity-crane-b)" ${O}/>
            <defs><clipPath id="sketchcity-crane-c"><rect x="37.5" y="88" width="45" height="7.5"/></clipPath></defs>
            <rect x="37.5" y="88" width="45" height="7.5" fill="#3B3F4C"/>
            <g clip-path="url(#sketchcity-crane-c)" fill="#FFC93E"><path d="M36 96L44 88H49L41 96ZM48 96L56 88H61L53 96ZM60 96L68 88H73L65 96ZM72 96L80 88H85L77 96Z"/></g>
            <path d="M36 88H84" stroke="${INK}" stroke-width="2.4"/>
            <path d="M41 60Q40.5 70 41.5 80" fill="none" stroke="#FFF4C4" stroke-width="3" stroke-linecap="round"/>
            <path d="M42 52V47.5Q42 45 44.5 45H47.5Q50 45 50 47.5V52Z" fill="#FF8A4C" ${OW(2.2)}/><path d="M44 47.5h2" stroke="#FFD2B0" stroke-width="1.4" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="31.5" cy="78" rx="4.8" ry="6.6" transform="rotate(26 31.5 78)" fill="#FFD04F" ${O}/>`, pivot: [38, 75]},
          armR: {svg: `<ellipse cx="88.5" cy="78" rx="4.8" ry="6.6" transform="rotate(-26 88.5 78)" fill="#FFD04F" ${O}/>`, pivot: [82, 75]},
          top: {svg: `${LINE("M66 53L99 15M73 56L103 21", "#F2B630", 2.6)}
            <path d="M68.5 52.5L77 56M74 45L80 49M79 39L85.5 42.5M84.5 33L91 36.5M90 27L96.5 30M95 21L101 24" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
            <circle cx="101" cy="18" r="3.4" fill="#FF8A4C" ${O2}/>
            ${LINE("M101 21V35", "#8E96A6", 1.2)}
            <path d="M101 35.5Q104.5 36 104 39.5Q103.5 42.5 100 42" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
            <rect x="89" y="43" width="23" height="5" rx="1.4" fill="#F27A5A" ${OW(2)}/><path d="M91.5 45.5H109.5" stroke="#FFC0A6" stroke-width="1.3" stroke-linecap="round"/>`, pivot: [69, 54]}
        },
        eyes: {lx: 50, rx: 70, y: 69, r: 4.8, style: "dot", color: "#2E2233"},
        mouth: {x: 60, y: 78, w: 3.1},
        cheeks: {lx: 43, rx: 77, y: 76.5, w: 4.3, h: 2.7, color: "#FF8F8F"},
        anchors: {top: [54, 48, 0.85], neck: [60, 88, 1.08], chest: [74, 84, 0.66], back: [82, 68, 0.85], hands: [60, 90, 0.88]},
        lines: {
          tap: ["Beep beep! Hi there, builder!", "Lifting your spirits sky high!", "You're raising the bar today!", "Look at you, building big things!", "Heavy lifting? You make it look easy!", "Up, up, up! You've got this!", "Every beam counts, and so does every page!", "Hard hats off to you, superstar!"],
          pet: ["Beep! My boom is wiggling with joy!", "Hehe! That's a happy little lift!"],
          hello: ["Beep beep! You're back! Let's build!", "Hi hi! The site is ready for you!"],
          morning: ["Good morning! Hard hat on, let's go!", "Rise and shine! Time to build a great day!"],
          night: ["Site's closed for the night. Rest soon?", "Boom down, lights low. Sleep well!"],
          focus: ["Steady lift, steady mind. Keep going.", "Working quietly right beside you."],
          done: ["WOW! What a towering session!", "Session done! You built something great!"],
          task: ["DONE! Beam in place! WOO!", "YES! Lifted that one right off the list!", "Checked off! Beep beep hooray!", "Another one done! Sky high!"],
          break: ["Lunch whistle! Stretch up tall!", "Break time! Builders need snacks too!"]
        }
      },
      {
        id: "sketchcity-compass", name: "Arc", kind: "Drafting Compass", pose: "stand", wearColor: "#3E7CC8",
        bio: "A precise little compass who draws a big happy circle around your wins.",
        idle: ["topBob", "headTilt", "sway"], cheer: "spin",
        neck: [60, 56],
        parts: {
          back: `<path d="M24 106A36 36 0 0 1 96 106" fill="none" stroke="#8FB8EE" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="1 6"/>`,
          feet: `${LINE("M41 99L39 110", "#6E7686", 1.6)}
            <path d="M76.5 98L83 97L81 107Z" fill="#F5C98B" ${OW(2.2)}/><path d="M80.6 104L81.4 103.8L81 108.6Z" fill="${INK}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`,
          body: `${LG("sketchcity-compass-l", [[0, "#F4F7FB"], [0.5, "#C9D2E0"], [1, "#9AA6B9"]], 0, 0, 1, 0)}
            <path d="M54 52L63 56L45 100L37.5 97Z" fill="url(#sketchcity-compass-l)" ${O}/>
            <path d="M66 52L57 56L76 99L83.5 96Z" fill="url(#sketchcity-compass-l)" ${O}/>
            ${LINE("M48 80H72", "#B7C1D0", 2.2)}
            <circle cx="60" cy="80" r="3.6" fill="#F4C766" ${O2}/>
            <path d="M52 61L46 76" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="42.5" cy="70" rx="4.4" ry="6" transform="rotate(26 42.5 70)" fill="#D8DFEA" ${O}/>`, pivot: [48.5, 68]},
          armR: {svg: `<ellipse cx="77.5" cy="70" rx="4.4" ry="6" transform="rotate(-26 77.5 70)" fill="#D8DFEA" ${O}/>`, pivot: [71.5, 68]},
          head: `${RG("sketchcity-compass-h", [[0, "#FFF6D6"], [0.55, "#F6D27A"], [1, "#D9A441"]], 0.4, 0.34, 0.75)}
            <circle cx="60" cy="41" r="21.5" fill="url(#sketchcity-compass-h)" ${O}/>
            <circle cx="60" cy="41" r="16.5" fill="none" stroke="#E8B856" stroke-width="1.6" opacity=".8"/>
            <path d="M45 33Q48 26.5 55 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
          top: {svg: `<rect x="55" y="7" width="10" height="14" rx="3" fill="#9AA6B9" ${O2}/><path d="M57 10.5H63M57 14H63M57 17.5H63" stroke="#E4E9F2" stroke-width="1.4" stroke-linecap="round"/>`, pivot: [60, 20]}
        },
        eyes: {lx: 51.5, rx: 68.5, y: 41, r: 4.6, style: "dot", color: "#2E2233"},
        mouth: {x: 60, y: 49, w: 2.8},
        cheeks: {lx: 45, rx: 75, y: 47.5, w: 3.8, h: 2.4, color: "#FF9F8F"},
        anchors: {top: [60, 22, 0.88], neck: [60, 61, 0.7], chest: [60, 88, 0.56], back: [78, 66, 0.78], hands: [60, 86, 0.82]},
        lines: {
          tap: ["Hi! Drawing a happy circle around you!", "You're right on point today!", "Perfectly measured awesomeness!", "Every great plan starts with a sketch!", "Look at you, designing your future!", "You've got this, down to the millimeter!", "Round of applause, a perfect round one!", "Your ideas have such great proportions!"],
          pet: ["Hehe! I'm spinning in happy circles!", "Aww! That's a perfectly round pat!"],
          hello: ["You're back! Let's draft something great!", "Hi hi! Pencil sharp and ready for you!"],
          morning: ["Good morning! A fresh blank page awaits!", "Rise and shine! Let's plan a great day!"],
          night: ["Folding my legs for the night. Rest soon?", "Plans can wait till morning. Sleep well!"],
          focus: ["Steady lines, steady you. Keep going.", "Sketching quietly right beside you."],
          done: ["WOW! A perfectly drafted session!", "Session done! That was full circle amazing!"],
          task: ["DONE! Circled and celebrated! WOO!", "YES! Right on point!", "Checked off! Precise and perfect!", "Another one done! Big happy circle!"],
          break: ["Stretch your legs wide, like me!", "Break time! Doodle something fun!"]
        }
      }
    ]
  });
})();































