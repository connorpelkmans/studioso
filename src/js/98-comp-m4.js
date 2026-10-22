/* ===== module: 98-comp-m4.js ===== */
/* Study Companions, Study Fields batch m4: concert, track, math, chem */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const f = v => Math.round(v * 100) / 100;

  // A golden (logarithmic) spiral, from the centre outwards, for Fibo's shell.
  const spiral = (cx, cy, r0, r1, turns, rot) => {
    const T = turns * 2 * Math.PI, b = Math.log(r1 / r0) / T;
    let d = "";
    for (let t = 0; t <= T + 0.001; t += 0.12) {
      const r = r0 * Math.exp(b * t), a = rot + t;
      d += (d ? "L" : "M") + f(cx + r * Math.cos(a)) + " " + f(cy + r * Math.sin(a));
    }
    return d;
  };

  /* Concert Hall */
  COMP_DATA.push({
    theme: "concert",
    companions: [
      {
        id: "concert-metronome", name: "Tempo", kind: "Metronome", pose: "stand", wearColor: "#C2415B",
        bio: "A cheerful metronome who ticks along to keep your study rhythm steady.",
        idle: ["topBob", "wave", "bounce"], cheer: "hop",
        parts: {
          feet: `<rect x="21" y="100" width="78" height="10" rx="4.5" fill="#7A4426" ${O}/><path d="M27 103.5H93" stroke="#A8673E" stroke-width="2" stroke-linecap="round"/>`,
          body: `${LG("concert-metronome-g", [[0, "#E3A469"], [0.5, "#C9814A"], [1, "#A2602F"]], 0.1, 0, 0.9, 1)}
            <path d="M48 24Q48 20 52 20H68Q72 20 72 24L95 99Q96.5 104 91 104H29Q23.5 104 25 99Z" fill="url(#concert-metronome-g)" ${O}/>
            ${LG("concert-metronome-w", [[0, "#FFF8EA"], [1, "#F3DFC0"]])}
            <path d="M53.5 27H66.5Q68 27 68.4 28.4L75.6 64Q76 66 74 66H46Q44 66 44.4 64L51.6 28.4Q52 27 53.5 27Z" fill="url(#concert-metronome-w)" ${OW(2.2)}/>
            <path d="M66 34H70M67.2 40H71.4M68.4 46H72.6M69.6 52H74M70.8 58H75" stroke="#C99A5E" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M31.5 96H88.5" stroke="#F2C35A" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M46.5 32L37 70" fill="none" stroke="#FFE0B8" stroke-width="3" stroke-linecap="round" opacity=".8"/>`,
          armL: {svg: `<ellipse cx="26" cy="85" rx="5" ry="7" transform="rotate(26 26 85)" fill="#B9733F" ${O}/>`, pivot: [31.5, 82]},
          armR: {svg: `<ellipse cx="94" cy="85" rx="5" ry="7" transform="rotate(-26 94 85)" fill="#B9733F" ${O}/>`, pivot: [88.5, 82]},
          top: {svg: `${LINE("M60 63V17", "#E4B040", 2)}<rect x="54" y="28" width="12" height="8.5" rx="2.6" fill="#F2C35A" ${O2}/><path d="M56.5 30.5H61" stroke="#FFF1C2" stroke-width="1.6" stroke-linecap="round"/><circle cx="60" cy="63" r="3.4" fill="#F2C35A" ${OW(2)}/>`, pivot: [60, 63]}
        },
        eyes: {lx: 50.5, rx: 69.5, y: 79, r: 4.9, style: "dot", color: "#2E1A12"},
        mouth: {x: 60, y: 87.5, w: 3.1, color: "#2E1A12"},
        cheeks: {lx: 42, rx: 78, y: 86, w: 4.4, h: 2.7, color: "#FF8F8F"},
        anchors: {top: [60, 22, 0.78], neck: [60, 69, 1.1], chest: [76, 94, 0.68], back: [86, 76, 0.85], hands: [60, 97, 0.85]},
        lines: {
          tap: ["Tick tock! Hi hi, my favorite person!", "You're right on the beat today!", "Steady tempo, big progress! Wow!", "Tick, tock, you rock! It's true!", "Every beat counts, and you're nailing it!", "You set the rhythm and I love it!", "Keeping time with you is the best!", "Allegro energy! Let's go go go!"],
          pet: ["Tick tick tick! That made me speed up!", "Hehe! My pendulum is all wiggly now!"],
          hello: ["You're here! Let's find our rhythm!", "Hi hi! Ready on the count of four!"],
          morning: ["Good morning! A fresh tempo for a new day!", "Rise and shine! One, two, three, go!"],
          night: ["Slowing to a gentle largo. Rest soon?", "Soft ticks now. Time for sweet dreams."],
          focus: ["Steady beat, steady mind. You've got this!", "Ticking quietly right beside you."],
          done: ["Bravo! That session was perfectly timed!", "Session done! Right on the beat! WOW!"],
          task: ["Tick! DONE! Standing ovation!", "YES! That was music to my ears!", "Checked off right on the beat! WOO!", "Another one done! Encore, encore!"],
          break: ["Rest beat! Stretch and sway along!", "Intermission! Grab some water!"]
        }
      },
      {
        id: "concert-violin", name: "Viola", kind: "Little Violin", pose: "stand", wearColor: "#3E6FB8",
        bio: "A little violin who plays a happy tune for every step you take.",
        idle: ["topBob", "sway", "wave"], cheer: "spin",
        parts: {
          feet: `<ellipse cx="51" cy="109" rx="6.6" ry="4" fill="#6B3A22" ${O}/><ellipse cx="69" cy="109" rx="6.6" ry="4" fill="#6B3A22" ${O}/>`,
          body: `${RG("concert-violin-g", [[0, "#FFC27D"], [0.5, "#EE9446"], [1, "#C2602A"]], 0.45, 0.4, 0.7)}
            <path d="M60 39C70 39 81 42 81 52C81 60 75 63 75 69C75 74 87 77 87 91C87 103 75 108 60 108C45 108 33 103 33 91C33 77 45 74 45 69C45 63 39 60 39 52C39 42 50 39 60 39Z" fill="url(#concert-violin-g)" ${O}/>
            <path d="M60 42.5C68.5 42.5 77.5 45 77.5 52.5C77.5 59 72 62 72 68.5C72 75 83.5 78 83.5 91C83.5 101 73.5 104.5 60 104.5C46.5 104.5 36.5 101 36.5 91C36.5 78 48 75 48 68.5C48 62 42.5 59 42.5 52.5C42.5 45 51.5 42.5 60 42.5Z" fill="none" stroke="#9E4A1E" stroke-width="1.3" opacity=".55"/>
            <path d="M46 47.5q-2.5 4 0 7.5q2.5 3.5 0 7.5M74 47.5q2.5 4 0 7.5q-2.5 3.5 0 7.5" fill="none" stroke="#5A2A14" stroke-width="2" stroke-linecap="round"/>
            <circle cx="46" cy="47.5" r="1.3" fill="#5A2A14"/><circle cx="46" cy="62.5" r="1.3" fill="#5A2A14"/><circle cx="74" cy="47.5" r="1.3" fill="#5A2A14"/><circle cx="74" cy="62.5" r="1.3" fill="#5A2A14"/>
            <path d="M56 30H64V64Q64 67 60 67Q56 67 56 64Z" fill="#3B2A33" ${OW(2.2)}/>
            <path d="M58 32V64M60 32V65M62 32V64" stroke="#E9DCC6" stroke-width=".7" opacity=".85"/>
            <path d="M40 80Q41 73 46 71" fill="none" stroke="#FFE2BA" stroke-width="3" stroke-linecap="round" opacity=".9"/><path d="M44 46Q47 42.5 52 42" fill="none" stroke="#FFE2BA" stroke-width="2.6" stroke-linecap="round" opacity=".9"/>`,
          armL: {svg: `<ellipse cx="38.5" cy="79" rx="4.6" ry="6.6" transform="rotate(30 38.5 79)" fill="#D97A36" ${O}/>`, pivot: [44, 76]},
          armR: {svg: `<ellipse cx="81.5" cy="79" rx="4.6" ry="6.6" transform="rotate(-30 81.5 79)" fill="#D97A36" ${O}/>`, pivot: [76, 76]},
          top: {svg: `<path d="M56.5 40V24H63.5V40Z" fill="#B5592A" ${OW(2.4)}/>
            <path d="M52 26L56.5 27M52 32L56.5 32M68 26L63.5 27M68 32L63.5 32" stroke="${INK}" stroke-width="4.6" stroke-linecap="round"/><path d="M52 26L56.5 27M52 32L56.5 32M68 26L63.5 27M68 32L63.5 32" stroke="#3B2A33" stroke-width="2.2" stroke-linecap="round"/>
            <circle cx="60" cy="16" r="7.4" fill="#C9682F" ${OW(2.4)}/><path d="M60 16m-3.6 0a3.6 3.6 0 1 1 3.6 3.6a2 2 0 0 1 -1.6 -3.2" fill="none" stroke="#5A2A14" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [60, 41]}
        },
        eyes: {lx: 50.5, rx: 69.5, y: 82, r: 4.8, style: "dot", color: "#2E1A12"},
        mouth: {x: 60, y: 90, w: 3, color: "#2E1A12"},
        cheeks: {lx: 42.5, rx: 77.5, y: 89, w: 4.3, h: 2.6, color: "#FF7F86"},
        anchors: {top: [60, 12, 0.62], neck: [60, 70, 0.9], chest: [74, 100, 0.62], back: [80, 58, 0.85], hands: [60, 99, 0.85]},
        lines: {
          tap: ["Hello! You make my strings sing!", "You're playing beautifully today!", "Every practice makes a sweeter song!", "Bravo, bravo! Look at you go!", "You're in perfect tune with your goals!", "I'm humming a happy song for you!", "Your hard work sounds amazing!"],
          pet: ["Ooh! That made my strings hum!", "Hehe! A happy little vibrato!"],
          hello: ["You're back! Cue the happy music!", "Hi! I've been tuning up for you!"],
          morning: ["Good morning! Let's play a bright tune!", "Rise and shine! Fresh strings, fresh day!"],
          night: ["Playing a soft lullaby for you now.", "Time to rest your bow. Sweet dreams!"],
          focus: ["Playing softly beside you. You've got this!", "A quiet melody for your focus."],
          done: ["What a performance! Bravo, bravo!", "Session done! That was a masterpiece!"],
          task: ["Ta-da! DONE! What a finale!", "YES! My strings are singing for you!", "Checked off! Brava! Brava!", "Another one done! Standing ovation!"],
          break: ["Loosen up those shoulders! Ahh!", "Intermission time! Stretch and sip!"]
        }
      },
      {
        id: "concert-piano", name: "Keys", kind: "Grand Piano", pose: "sit", sleepy: true, wearColor: "#C2415B",
        bio: "A tiny grand piano who plays a big chord for every win.",
        idle: ["topBob", "bounce", "sparkle"], cheer: "hop",
        parts: {
          feet: `<path d="M61 88V101" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M61 88V101" stroke="#CFC6DF" stroke-width="3.6" stroke-linecap="round"/>
            <path d="M28 88V104M88 86V104" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M28 88V104M88 86V104" stroke="#EDE6F5" stroke-width="5" stroke-linecap="round"/>
            <circle cx="28" cy="106" r="3.6" fill="#F2C35A" ${OW(2)}/><circle cx="88" cy="106" r="3.6" fill="#F2C35A" ${OW(2)}/>`,
          body: `${LG("concert-piano-g", [[0, "#FFFFFF"], [0.6, "#F6F1FB"], [1, "#DCD3EA"]])}
            <path d="M22 47H68C90 47 105 56 105 70C105 83 93 91 78 91H22Q15 91 15 84V54Q15 47 22 47Z" fill="url(#concert-piano-g)" ${O}/>
            <path d="M22 51H67C84 51 98 57 100.5 66" fill="none" stroke="#F2C35A" stroke-width="1.8" stroke-linecap="round" opacity=".9"/>
            <path d="M22 56Q22 54 26 54" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            <path d="M92 60Q100 64 100.5 72" fill="none" stroke="#C9BEDD" stroke-width="2.2" stroke-linecap="round"/>
            <rect x="19" y="79" width="76" height="11" rx="2.5" fill="#FFFDF8" ${OW(2.4)}/>
            <path d="M25.3 80V89.5M31.6 80V89.5M37.9 80V89.5M44.2 80V89.5M50.5 80V89.5M56.8 80V89.5M63.1 80V89.5M69.4 80V89.5M75.7 80V89.5M82 80V89.5M88.3 80V89.5" stroke="#B8B0C8" stroke-width="1.2"/>
            <g fill="#2B2338"><rect x="23.4" y="79.5" width="3.8" height="6" rx="1"/><rect x="29.7" y="79.5" width="3.8" height="6" rx="1"/><rect x="42.3" y="79.5" width="3.8" height="6" rx="1"/><rect x="48.6" y="79.5" width="3.8" height="6" rx="1"/><rect x="54.9" y="79.5" width="3.8" height="6" rx="1"/><rect x="67.5" y="79.5" width="3.8" height="6" rx="1"/><rect x="73.8" y="79.5" width="3.8" height="6" rx="1"/><rect x="86.4" y="79.5" width="3.8" height="6" rx="1"/></g>`,
          top: {svg: `${LINE("M74 47L80 31", "#F2C35A", 1.6)}${LG("concert-piano-l", [[0, "#FFFFFF"], [1, "#E4DCF0"]])}
            <path d="M18 46.5L92 19Q101 16.5 102 23.5Q102.5 28 97 31Q74 43 40 47.5Z" fill="url(#concert-piano-l)" ${O}/>
            <path d="M30 43L84 23.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M44 46.5Q68 42 88 33" fill="none" stroke="#F2C35A" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>`, pivot: [19, 47]}
        },
        eyes: {lx: 50, rx: 70, y: 66, r: 5.4, style: "dot", color: "#2B2233"},
        mouth: {x: 60, y: 74, w: 3},
        cheeks: {lx: 40.5, rx: 79.5, y: 73, w: 4.2, h: 2.6, color: "#FF9FB4"},
        anchors: {top: [42, 46, 0.8], neck: [60, 92, 1.3], chest: [97, 72, 0.6], back: [96, 56, 0.85], hands: [60, 82, 0.85]},
        lines: {
          tap: ["Plink plink! Hi there, superstar!", "You hit all the right notes today!", "Look at you, playing it by ear!", "Every key you press makes music!", "You're doing grand! Truly grand!", "Sharp mind, natural talent! That's you!", "My keys are tinkling just for you!"],
          pet: ["Plink! That tickled my high notes!", "Hehe! A happy little chord for you!"],
          hello: ["You're back! Big cheerful chord!", "Hi hi! My lid is open just for you!"],
          morning: ["Good morning! Let's play in C major!", "Rise and shine! Warm-up scales, go!"],
          night: ["Soft pedal on now. Time to rest?", "Closing my lid soon. Sleep well, friend."],
          focus: ["Pianissimo cheering. You've got this!", "Playing a calm tune while you work."],
          done: ["Grand finale! What a session!", "Session done! Fortissimo applause!"],
          task: ["DONE! Big triumphant chord!", "YES! A glissando of joy for you!", "Checked off! Every key is cheering!", "Another one done! Encore!"],
          break: ["Shake out those fingers! Wiggle!", "Intermission! A snack and a stretch?"]
        }
      }
    ]
  });

  /* Track and Field */
  COMP_DATA.push({
    theme: "track",
    companions: [
      {
        id: "track-sneaker", name: "Sprint", kind: "Running Sneaker", pose: "stand", wearColor: "#2E9C8F",
        bio: "A speedy sneaker with a winged heel who races to cheer you on.",
        idle: ["topBob", "tailSwish", "hop"], cheer: "hop",
        parts: {
          tail: {svg: `<path d="M21 56C13 46 1 44 -2 50C-3.5 54 1 57 6 58C0 60 -2 64 0.5 67.5C4 71 11 69 14 67C10 71 10 75 13 77C17 79 21 75 21 70Z" fill="#FFFFFF" ${OW(2.4)}/><path d="M18 57Q10 51 3 50.5M18 62Q10 62 4 63.5M18 67Q15 70 14 73" fill="none" stroke="#B7CDE0" stroke-width="1.5" stroke-linecap="round"/>`, pivot: [21, 62]},
          body: `${LG("track-sneaker-g", [[0, "#FFA08E"], [0.55, "#FF7A6E"], [1, "#E5565A"]])}
            <path d="M18 92V48Q18 37 29 37H37Q42 37 43.5 41Q45 45.5 48.5 43L49.5 31Q50.5 25 56.5 26Q61 27 61.5 32L63 38Q80 51 95 61Q106 68 106 84V92Z" fill="url(#track-sneaker-g)" ${O}/>
            <path d="M84 57Q100 63 105 77" fill="none" stroke="#FFD0C4" stroke-width="2.4" stroke-linecap="round" opacity=".9"/>
            <path d="M19 64H27Q32 64 32 69V92H19Z" fill="#FFC7BA" opacity=".55"/><path d="M88 66Q100 70 104 80V92H86Q83 80 88 66Z" fill="#FFC7BA" opacity=".5"/>
            <path d="M63.5 42l5 6M69.5 46l5 6M75.5 50l5 6M63.5 48l5 -6M69.5 52l5 -6M75.5 56l5 -6" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M24 47Q25 41.5 31 41" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" opacity=".75"/>
            <path d="M13.5 93Q13.5 89 18 89H104Q110 89 110 95Q110 108 98 108H25Q13.5 108 13.5 97Z" fill="#FFFFFF" ${O}/>
            <path d="M16 99H108" stroke="#5FCDB9" stroke-width="3.2" stroke-linecap="round"/>
            <path d="M23 104.5h4M36 104.5h4M49 104.5h4M62 104.5h4M75 104.5h4M88 104.5h4" stroke="#C9D3DE" stroke-width="1.8" stroke-linecap="round"/>`,
          top: {svg: `<path d="M61 38C55 30 46 31 46.5 36.5C47 41 55 41.5 61 38Z" fill="#FFFFFF" ${OW(2.2)}/><path d="M61 38C67 30 76 31 75.5 36.5C75 41 67 41.5 61 38Z" fill="#FFFFFF" ${OW(2.2)}/>
            ${LINE("M60 39.5Q56 44 52 47M62 39.5Q65 44 69 46", "#FFFFFF", 1.8)}<circle cx="61" cy="38.5" r="2.8" fill="#FFFFFF" ${OW(2)}/>`, pivot: [61, 40]}
        },
        eyes: {lx: 48, rx: 68, y: 67, r: 5.3, style: "dot", color: "#2B1A22"},
        mouth: {x: 58, y: 76, w: 3.2, color: "#2B1A22"},
        cheeks: {lx: 39.5, rx: 76.5, y: 75, w: 4.6, h: 2.8, color: "#FF4F73"},
        anchors: {top: [55, 29, 0.72], neck: [31, 41, 0.72], chest: [92, 79, 0.62], back: [28, 56, 0.8], hands: [58, 91, 0.85]},
        lines: {
          tap: ["Zoom zoom! Hi, champ!", "You're off to a running start!", "Every step forward counts! Go go!", "Laced up and cheering for you!", "Look at you, crushing your stride!", "One more lap? You've totally got this!", "You're my favorite running buddy!", "Speedy progress today! Woohoo!"],
          pet: ["Hehe! That tickles my laces!", "Squeak squeak! Happy sneaker noises!"],
          hello: ["You're here! Let's hit the track!", "Hi hi! I'm laced up and ready!"],
          morning: ["Good morning! Rise and run, sunshine!", "Morning! Fresh track, fresh start!"],
          night: ["Loosening my laces now. Rest soon?", "Cool-down time. Sweet dreams, champ!"],
          focus: ["Steady pace, steady mind. Go go!", "Jogging quietly right beside you."],
          done: ["You crossed the finish line! WOW!", "Session done! Personal best vibes!"],
          task: ["DONE! Gold medal for you!", "YES! Sprinted right through that one!", "Finish line! Confetti everywhere!", "Another lap done! WOOHOO!"],
          break: ["Stretch those legs! Reach and hold!", "Water break! Sip sip, hooray!"]
        }
      },
      {
        id: "track-watch", name: "Splits", kind: "Stopwatch", pose: "stand", wearColor: "#E8643C",
        bio: "A peppy stopwatch who times your focus and celebrates every lap.",
        idle: ["topBob", "wave", "bounce"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="49" cy="107.5" rx="7.4" ry="4.2" fill="#2F8E85" ${O}/><ellipse cx="71" cy="107.5" rx="7.4" ry="4.2" fill="#2F8E85" ${O}/>`,
          body: `${LG("track-watch-g", [[0, "#8FE3D3"], [0.55, "#4FC1B2"], [1, "#2E9C8F"]], 0.2, 0, 0.8, 1)}
            <path d="M84 41L90 35.5" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M84 41L90 35.5" stroke="#F2B544" stroke-width="4.4" stroke-linecap="round"/>
            <circle cx="60" cy="70" r="33" fill="url(#track-watch-g)" ${O}/>
            ${RG("track-watch-d", [[0, "#FFFFFF"], [0.8, "#FFFFFF"], [1, "#E4F1F0"]])}
            <circle cx="60" cy="71" r="25.5" fill="url(#track-watch-d)" ${OW(2.2)}/>
            <g stroke="#9DB7B6" stroke-width="1.8" stroke-linecap="round"><path d="M60 48.5V51.5M60 90.5V93.5M37.5 71H40.5M79.5 71H82.5M71.25 51.5L70 53.7M48.75 51.5L50 53.7M80.5 59.75L78.3 61M39.5 59.75L41.7 61M80.5 82.25L78.3 81M39.5 82.25L41.7 81M71.25 90.5L70 88.3M48.75 90.5L50 88.3"/></g>
            <path d="M60 48V56" stroke="#E8643C" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M34 55Q38 45 48 40.5" fill="none" stroke="#DDFBF4" stroke-width="3.2" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="26" cy="80" rx="5" ry="7" transform="rotate(28 26 80)" fill="#45B5A7" ${O}/>`, pivot: [31.5, 77]},
          armR: {svg: `<ellipse cx="94" cy="80" rx="5" ry="7" transform="rotate(-28 94 80)" fill="#45B5A7" ${O}/>`, pivot: [88.5, 77]},
          top: {svg: `<rect x="56" y="29" width="8" height="10" rx="2" fill="#F2B544" ${OW(2.4)}/>
            <rect x="49.5" y="22" width="21" height="8.5" rx="4" fill="#FFCB5C" ${OW(2.4)}/><path d="M53 24.8H62" stroke="#FFF1C2" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M54 22.5C54 13 66 13 66 22.5" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M54 22.5C54 13 66 13 66 22.5" fill="none" stroke="#F2B544" stroke-width="2.4" stroke-linecap="round"/>`, pivot: [60, 38]}
        },
        eyes: {lx: 50.5, rx: 69.5, y: 70, r: 4.9, style: "dot", color: "#1F2E33"},
        mouth: {x: 60, y: 79, w: 3.1, color: "#1F2E33"},
        cheeks: {lx: 43, rx: 77, y: 78, w: 4.3, h: 2.7, color: "#FF9AA2"},
        anchors: {top: [60, 38, 0.82], neck: [60, 100, 1.05], chest: [80, 92, 0.66], back: [87, 62, 0.85], hands: [60, 97, 0.85]},
        lines: {
          tap: ["Click! Hi! Right on time!", "You're making every minute count!", "New record for awesome! That's you!", "Tick tick! You're doing amazing!", "Time flies when you're this great!", "I clocked your effort. It's huge!", "Ready, set, you've got this!"],
          pet: ["Click click! That reset my smile!", "Hehe! My little hand is spinning!"],
          hello: ["You're back! Starting the clock!", "Hi! Perfect timing, as always!"],
          morning: ["Good morning! Ready, set, go!", "Rise and shine! The clock is cheering!"],
          night: ["Stopping the clock for tonight. Rest!", "Lap complete. Time for sweet dreams."],
          focus: ["Timing your focus. You've got this!", "Counting quietly beside you."],
          done: ["CLICK! What an amazing split!", "Session done! What a lap! WOW!"],
          task: ["Click! DONE! New record!", "YES! Right on time! WOO!", "Checked off! Lightning fast!", "Another one done! Hooray!"],
          break: ["Pause the clock! Stretch time!", "Time out! Water and a wiggle!"]
        }
      },
      {
        id: "track-dumbbell", name: "Flex", kind: "Dumbbell", pose: "stand", wearColor: "#2E9C8F",
        bio: "A mighty little dumbbell who spots you through every study rep.",
        idle: ["bounce", "wave", "hop"], cheer: "wingFlutter",
        parts: {
          feet: `<ellipse cx="51" cy="103.5" rx="6.6" ry="4.4" fill="#7660C4" ${O}/><ellipse cx="69" cy="103.5" rx="6.6" ry="4.4" fill="#7660C4" ${O}/>`,
          body: `${LG("track-dumbbell-p", [[0, "#FFB3BF"], [0.55, "#FF8A9E"], [1, "#E8607A"]])}
            <rect x="27" y="70" width="9" height="16" rx="3" fill="#C9CCDA" ${OW(2.4)}/>
            <rect x="7" y="58" width="11" height="40" rx="5" fill="#F27A90" ${O}/>
            <rect x="15" y="47" width="15" height="62" rx="7" fill="url(#track-dumbbell-p)" ${O}/>
            <path d="M19.5 54V66" stroke="#FFE1E6" stroke-width="2.6" stroke-linecap="round"/>
            ${LG("track-dumbbell-q", [[0, "#FFB3BF"], [0.55, "#FF8A9E"], [1, "#E8607A"]])}
            <rect x="84" y="70" width="9" height="16" rx="3" fill="#C9CCDA" ${OW(2.4)}/>
            <rect x="102" y="58" width="11" height="40" rx="5" fill="#F27A90" ${O}/>
            <rect x="90" y="47" width="15" height="62" rx="7" fill="url(#track-dumbbell-q)" ${O}/>
            <path d="M94.5 54V66" stroke="#FFE1E6" stroke-width="2.6" stroke-linecap="round"/>
            ${LG("track-dumbbell-g", [[0, "#D5C9FF"], [0.55, "#AE9CF2"], [1, "#8B76DC"]])}
            <defs><clipPath id="track-dumbbell-c"><rect x="33" y="60" width="54" height="36" rx="18"/></clipPath></defs>
            <rect x="33" y="60" width="54" height="36" rx="18" fill="url(#track-dumbbell-g)" ${O}/>
            <g clip-path="url(#track-dumbbell-c)"><rect x="30" y="62.5" width="60" height="7" fill="#6FD3C0"/><path d="M30 64.5H90" stroke="#BDF2E7" stroke-width="1.6"/></g>
            <path d="M33 60H87" fill="none"/><rect x="33" y="60" width="54" height="36" rx="18" fill="none" ${O}/>
            <path d="M40 76Q40.5 72.5 43 71" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>`,
          armL: {svg: `<ellipse cx="33.5" cy="88" rx="4.6" ry="6.4" transform="rotate(30 33.5 88)" fill="#A994F0" ${O}/>`, pivot: [38.5, 85]},
          armR: {svg: `<ellipse cx="86.5" cy="88" rx="4.6" ry="6.4" transform="rotate(-30 86.5 88)" fill="#A994F0" ${O}/>`, pivot: [81.5, 85]}
        },
        eyes: {lx: 51, rx: 69, y: 78, r: 4.7, style: "dot", color: "#2A2140"},
        mouth: {x: 60, y: 86, w: 3, color: "#2A2140"},
        cheeks: {lx: 43.5, rx: 76.5, y: 85, w: 4, h: 2.5, color: "#FF8FB0"},
        anchors: {top: [60, 61, 0.85], neck: [60, 95, 0.95], chest: [76, 90, 0.6], back: [60, 66, 0.8], hands: [60, 95, 0.82]},
        lines: {
          tap: ["Hup! Hi hi, strong stuff!", "Your brain muscles are HUGE today!", "One more rep! You've totally got this!", "Look at you, getting stronger!", "Lifting you up, one cheer at a time!", "Every rep counts, and so do you!", "Feel that? That's progress!", "Pump it up! You're amazing!"],
          pet: ["Hehe! That's my favorite stretch!", "Ooh! I feel extra mighty now!"],
          hello: ["You're back! Let's warm up together!", "Hi! Ready for some brain reps?"],
          morning: ["Good morning! Rise and lift, sunshine!", "Morning warm-up! Let's go go go!"],
          night: ["Rest days build strength too. Sleep!", "Back on the rack for tonight. Sleep well!"],
          focus: ["Steady reps, steady mind. You've got this!", "Lifting quietly beside you."],
          done: ["What a workout! You're so strong!", "Session done! Big mighty flex!"],
          task: ["DONE! Gold medal lift!", "YES! You crushed that rep!", "Checked off! Muscles of joy!", "Another one down! WOO!"],
          break: ["Shake it out! Big arm circles!", "Water break! Hydrate, champ!"]
        }
      }
    ]
  });

  /* Infinite Grid */
  COMP_DATA.push({
    theme: "math",
    companions: [
      {
        id: "math-pi", name: "Pi", kind: "Pi Creature", pose: "stand", wearColor: "#F2A33A",
        bio: "A curly pi creature who loves that some things go on forever.",
        idle: ["headTilt", "bounce", "hop"], cheer: "spin",
        neck: [60, 58],
        parts: {
          feet: `<ellipse cx="43" cy="107.5" rx="9" ry="4.6" fill="#3F6FC6" ${O}/><ellipse cx="83" cy="107.5" rx="9" ry="4.6" fill="#3F6FC6" ${O}/>`,
          body: `${LG("math-pi-l", [[0, "#86BBFB"], [1, "#4F86DE"]])}
            <path d="M35 52H51V101Q51 106 43 106Q35 106 35 101Z" fill="url(#math-pi-l)" ${O}/>
            <path d="M69 52H85Q84 76 88 92Q90.5 101 85 104.5Q77 108 74 100Q69 84 69 52Z" fill="url(#math-pi-l)" ${O}/>
            <path d="M39.5 64V90M73.5 64Q73.5 80 76 89" fill="none" stroke="#C2DEFF" stroke-width="2.8" stroke-linecap="round" opacity=".85"/>`,
          head: `${LG("math-pi-g", [[0, "#A9D0FF"], [0.55, "#7DB0F7"], [1, "#5B8FE6"]])}
            ${LINE("M24 52C17 55 13 61 15.5 66C17.5 69.5 22 68.5 21.5 65", "#6A9DEB", 5.5)}
            <rect x="17" y="25" width="88" height="33" rx="15" fill="url(#math-pi-g)" ${O}/>
            <path d="M27 33Q37 30 50 30.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".85"/><circle cx="56" cy="30.6" r="1.6" fill="#fff" opacity=".85"/>`
        },
        eyes: {lx: 48.5, rx: 71.5, y: 41.5, r: 6.4, style: "round", color: "#2A2150"},
        mouth: {x: 60, y: 51, w: 3, color: "#2A2150"},
        cheeks: {lx: 36.5, rx: 83.5, y: 48.5, w: 4.6, h: 2.8, color: "#FF9FC0"},
        anchors: {top: [61, 27, 0.98], neck: [60, 59, 0.95], chest: [43, 78, 0.55], back: [86, 68, 0.8], hands: [60, 82, 0.82]},
        lines: {
          tap: ["Hi hi! I'm irrationally happy to see you!", "You're doing infinitely well!", "3.14159 reasons to smile! Hehe!", "Your progress is off the charts!", "Every step adds up! I did the math!", "You're my favorite constant!", "That brain of yours is exponential!"],
          pet: ["Hehe! That tickles my curly swirls!", "Aww! My smile just went full circle!"],
          hello: ["You're back! What a lovely surprise!", "Hi! Let's solve some fun stuff!"],
          morning: ["Good morning! Endless possibilities!", "Rise and shine! Today adds up to great!"],
          night: ["Rounding off the day now. Rest soon?", "I never end, but you should rest. Night!"],
          focus: ["Calculating quietly beside you!", "Step by step, line by line. Go!"],
          done: ["Q.E.D.! What a brilliant session!", "Session done! You're infinitely amazing!"],
          task: ["DONE! That's a perfect solution!", "YES! Proven and checked off!", "Solved! I'm going in circles of joy!", "Another one done! Pi-rfect!"],
          break: ["Stretch time! Wiggle in a circle!", "Break time! A slice of something tasty?"]
        }
      },
      {
        id: "math-cube", name: "Cubey", kind: "Little Cube", pose: "stand", wearColor: "#F2A33A",
        bio: "A solid little cube who stacks up your wins one block at a time.",
        idle: ["bounce", "wave", "sway"], cheer: "spin",
        parts: {
          feet: `<ellipse cx="43" cy="108.5" rx="7.4" ry="4.2" fill="#7E68D6" ${O}/><ellipse cx="69" cy="108.5" rx="7.4" ry="4.2" fill="#7E68D6" ${O}/>`,
          body: `${LG("math-cube-t", [[0, "#FBF8FF"], [1, "#E2D8FF"]])}${LG("math-cube-g", [[0, "#C9B9FF"], [0.6, "#AA95F6"], [1, "#9079E8"]])}${LG("math-cube-s", [[0, "#9C86EE"], [1, "#7A62D6"]])}
            <path d="M24 46L37 33H99L86 46Z" fill="url(#math-cube-t)" ${O}/>
            <path d="M86 46L99 33V93L86 106Z" fill="url(#math-cube-s)" ${O}/>
            <rect x="22" y="46" width="64" height="61" rx="9" fill="url(#math-cube-g)" ${O}/>
            <path d="M41 39.5H86" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".9"/>
            <path d="M28 60Q28.5 53 35 52" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".85"/><circle cx="28.4" cy="66" r="1.6" fill="#fff" opacity=".8"/>
            <path d="M92.5 47V86" stroke="#B9A6FA" stroke-width="2" stroke-linecap="round" opacity=".7"/>`,
          armL: {svg: `<rect x="13" y="78" width="11" height="13" rx="4.5" transform="rotate(16 18.5 84.5)" fill="#A28CF2" ${O}/>`, pivot: [24, 81]},
          armR: {svg: `<rect x="96" y="76" width="11" height="13" rx="4.5" transform="rotate(-16 101.5 82.5)" fill="#8D76E2" ${O}/>`, pivot: [96, 79]}
        },
        eyes: {lx: 43.5, rx: 64.5, y: 73, r: 5.4, style: "sparkle", color: "#2A2150"},
        mouth: {x: 54, y: 83, w: 3.3, color: "#2A2150"},
        cheeks: {lx: 33.5, rx: 74.5, y: 82, w: 4.6, h: 2.8, color: "#FF9FC4"},
        anchors: {top: [62, 38, 0.98], neck: [54, 101, 1.1], chest: [74, 96, 0.66], back: [90, 62, 0.9], hands: [54, 97, 0.88]},
        lines: {
          tap: ["Hi! I'm a square, but you're super cool!", "You've got all the right angles!", "Building blocks of brilliance! That's you!", "Every side of me is cheering!", "Solid work today! Look at you!", "You make everything add up!", "Cube-tastic progress! Woohoo!"],
          pet: ["Hehe! My corners are so happy!", "Aww! That's a perfect six-sided hug!"],
          hello: ["You're back! Squarely the best news!", "Hi hi! Let's build something great!"],
          morning: ["Good morning! Six sides of sunshine!", "Rise and shine! Let's stack up wins!"],
          night: ["Tucking in my corners now. Rest?", "Solid day! Time for cozy dreams."],
          focus: ["Solid focus! You've got this!", "Sitting square beside you, quietly."],
          done: ["Cubed! That session was amazing!", "Session done! Solid gold work!"],
          task: ["DONE! That one's cubed!", "YES! Another block in place!", "Checked off! I'm spinning with joy!", "Another one done! Hip hip hooray!"],
          break: ["Roll around and stretch! Tumble!", "Break time! Snack cubes, anyone?"]
        }
      },
      {
        id: "math-nautilus", name: "Fibo", kind: "Nautilus", pose: "float", wearColor: "#3E8FC2",
        bio: "A golden-spiral nautilus who grows a new chamber with every win.",
        idle: ["tailSwish", "finWiggle", "sparkle"], cheer: "spin",
        parts: {
          back: `${RG("math-nautilus-s", [[0, "#FFF6E2"], [0.65, "#FBE3BC"], [1, "#EFC58E"]], 0.45, 0.42, 0.62)}
            <defs><clipPath id="math-nautilus-c"><circle cx="60" cy="48" r="36"/></clipPath></defs>
            <circle cx="60" cy="48" r="36" fill="url(#math-nautilus-s)" ${O}/>
            <g clip-path="url(#math-nautilus-c)" fill="none" stroke="#E08A4A" stroke-width="5" stroke-linecap="round" opacity=".85">
              <path d="M27 36Q38 32 42 22M33 23Q42 22 48 13M58 12Q63 18 74 16M84 22Q84 30 93 34M95 50Q88 54 89 64"/></g>
            <path d="${spiral(63, 47, 2.2, 33, 2.25, 0.9)}" fill="none" stroke="#C8783C" stroke-width="2.6" stroke-linecap="round"/>
            <circle cx="60" cy="48" r="36" fill="none" ${O}/>
            <path d="M33 32Q38 21 49 16" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".9"/>`,
          tail: {svg: `${LINE("M48 93C44 99 46 104 41 107", "#FFB59A", 3.4)}${LINE("M55 95C54 101 57 105 53 109", "#FFB59A", 3.4)}${LINE("M65 95C66 101 63 105 67 109", "#FFB59A", 3.4)}${LINE("M72 93C76 99 74 104 79 107", "#FFB59A", 3.4)}`, pivot: [60, 92]},
          body: `${RG("math-nautilus-b", [[0, "#FFE6DA"], [0.6, "#FFC9B4"], [1, "#F4A58E"]], 0.45, 0.38, 0.68)}
            <path d="M35 78C35 63 46 56 60 56C74 56 85 63 85 78C85 92 74 98 60 98C46 98 35 92 35 78Z" fill="url(#math-nautilus-b)" ${O}/>
            <path d="M37.5 70C41 60 50 57.5 60 57.5C70 57.5 79 60 82.5 70C74 66 67 65 60 65C53 65 46 66 37.5 70Z" fill="#D9774A" opacity=".85"/>
            <path d="M44 62Q48 59.5 53 59" fill="none" stroke="#FFD9C2" stroke-width="2.4" stroke-linecap="round"/>`,
          armL: {svg: `${LINE("M39 84C33 86 28 91 31 96C33 98.5 36 97 35 94.5", "#FFB59A", 3.6)}`, pivot: [39, 84]},
          armR: {svg: `${LINE("M81 84C87 86 92 91 89 96C87 98.5 84 97 85 94.5", "#FFB59A", 3.6)}`, pivot: [81, 84]}
        },
        eyes: {lx: 51, rx: 69, y: 78, r: 4.9, style: "sparkle", color: "#3A1E2A"},
        mouth: {x: 60, y: 87, w: 3, color: "#3A1E2A"},
        cheeks: {lx: 43, rx: 77, y: 86, w: 4.3, h: 2.6, color: "#FF7F9C"},
        anchors: {top: [60, 59, 0.82], neck: [60, 96, 0.95], chest: [74, 90, 0.58], back: [92, 82, 0.75], hands: [60, 92, 0.82]},
        lines: {
          tap: ["Hi! You make my spiral sparkle!", "Growing one chamber at a time, like you!", "You're golden! Golden ratio golden!", "Every little step spirals up!", "Look at you, growing so beautifully!", "You've got this! I believe in you!", "1, 1, 2, 3, 5, cheers for you!"],
          pet: ["Hehe! My tentacles are wiggling!", "Ooh! That made my shell shimmer!"],
          hello: ["You're back! I swirled right over!", "Hi hi! Let's grow something great!"],
          morning: ["Good morning! A fresh spiral of a day!", "Rise and shine! Let's swim into it!"],
          night: ["Curling into my shell now. Rest soon?", "Drifting down deep. Sweet dreams!"],
          focus: ["Floating quietly beside you. Go!", "Calm currents, clear mind. You've got this!"],
          done: ["What a golden session! WOW!", "Session done! You spiraled right up!"],
          task: ["DONE! Pure golden work!", "YES! A brand new chamber!", "Checked off! Happy swirls for you!", "Another one done! Hooray!"],
          break: ["Stretch your tentacles! Er, arms!", "Float break! Sip some water!"]
        }
      }
    ]
  });

  /* Chem Lab */
  COMP_DATA.push({
    theme: "chem",
    companions: [
      {
        id: "chem-flask", name: "Bubbles", kind: "Erlenmeyer Flask", pose: "stand", wearColor: "#7A5CC9",
        bio: "A fizzy flask who bubbles over every time you finish something.",
        idle: ["topBob", "wave", "sparkle"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="49" cy="108.5" rx="7" ry="4" fill="#C9488A" ${O}/><ellipse cx="71" cy="108.5" rx="7" ry="4" fill="#C9488A" ${O}/>`,
          body: `${LG("chem-flask-gl", [[0, "#F4FBFF"], [1, "#DCEFFA"]])}${LG("chem-flask-lq", [[0, "#FFA8CF"], [0.6, "#FF7FB5"], [1, "#E85C9C"]])}
            <defs><clipPath id="chem-flask-c"><path d="M53 27V46L26 94Q22 104 32 106H88Q98 104 94 94L67 46V27Z"/></clipPath></defs>
            <path d="M53 27V46L26 94Q22 104 32 106H88Q98 104 94 94L67 46V27Z" fill="url(#chem-flask-gl)"/>
            <g clip-path="url(#chem-flask-c)"><path d="M10 68Q22 64 34 68T58 68T82 68T106 68V112H10Z" fill="url(#chem-flask-lq)"/><path d="M14 68Q22 65 34 68T58 68T82 68T106 68" fill="none" stroke="#FFD3E6" stroke-width="2.4"/>
              <circle cx="40" cy="96" r="2.2" fill="#FFD3E6"/><circle cx="82" cy="98" r="1.8" fill="#FFD3E6"/><circle cx="86" cy="88" r="1.3" fill="#FFD3E6"/><circle cx="35" cy="86" r="1.2" fill="#FFD3E6"/></g>
            <path d="M53 27V46L26 94Q22 104 32 106H88Q98 104 94 94L67 46V27Z" fill="none" ${O}/>
            <rect x="49.5" y="22" width="21" height="6.5" rx="3.2" fill="#EAF6FD" ${OW(2.4)}/>
            <path d="M57 31V44L44 67" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            <path d="M74 52H70M78.5 60H73M83 68H77" stroke="#9CC3DA" stroke-width="1.8" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="30" cy="89" rx="4.6" ry="6.6" transform="rotate(30 30 89)" fill="#F784B9" ${O}/>`, pivot: [35, 86]},
          armR: {svg: `<ellipse cx="90" cy="89" rx="4.6" ry="6.6" transform="rotate(-30 90 89)" fill="#F784B9" ${O}/>`, pivot: [85, 86]},
          top: {svg: `<circle cx="57.5" cy="15" r="4.4" fill="#FFD3E6" ${OW(2.2)}/><circle cx="56.2" cy="13.6" r="1.3" fill="#fff"/>
            <circle cx="66.5" cy="8" r="3.3" fill="#FFC1DD" ${OW(2)}/><circle cx="65.6" cy="7" r="1" fill="#fff"/>
            <circle cx="53.5" cy="4.5" r="2.4" fill="#FFE3EF" ${OW(1.8)}/>`, pivot: [60, 24]}
        },
        eyes: {lx: 50, rx: 70, y: 81, r: 4.8, style: "sparkle", color: "#3A1430"},
        mouth: {x: 60, y: 89.5, w: 3, color: "#3A1430"},
        cheeks: {lx: 42, rx: 78, y: 88.5, w: 4.2, h: 2.6, color: "#FFC2DC"},
        anchors: {top: [60, 23, 0.7], neck: [60, 46, 0.72], chest: [77, 98, 0.62], back: [84, 76, 0.85], hands: [60, 100, 0.85]},
        lines: {
          tap: ["Fizz fizz! Hi, brilliant friend!", "You and studying have great chemistry!", "Bubbling over with pride for you!", "You're a total catalyst today!", "Every try is a great experiment!", "My bubbles are cheering for you!", "Look at you, reacting so well!", "Elementary, my dear! You're brilliant!"],
          pet: ["Fizz! That made me bubble over!", "Hehe! My bubbles are giggling!"],
          hello: ["You're back! Bubble bubble hooray!", "Hi! The lab is brighter with you!"],
          morning: ["Good morning! A fresh reaction awaits!", "Rise and shine! Let's get fizzy!"],
          night: ["Simmering down now. Rest soon?", "Soft little bubbles. Sweet dreams!"],
          focus: ["Bubbling quietly beside you. Go!", "Steady reaction! You've got this!"],
          done: ["What a reaction! That was AMAZING!", "Session done! Fizzing with pride!"],
          task: ["FIZZ! DONE! Eureka!", "YES! A successful reaction!", "Checked off! Bubbles everywhere!", "Another one done! Hooray!"],
          break: ["Stretch and fizz around! Ahh!", "Break time! A sip of water?"]
        }
      },
      {
        id: "chem-molecule", name: "Mol", kind: "Molecule", pose: "float", wearColor: "#7A5CC9",
        bio: "A bouncy molecule who bonds with everyone it meets.",
        idle: ["wingFlutter", "topBob", "tailSwish"], cheer: "spin",
        parts: {
          tail: {svg: `${LINE("M60 90V97", "#D8D2E6", 3)}${RG("chem-molecule-d", [[0, "#F1E6FF"], [1, "#B79AF0"]], 0.4, 0.35, 0.7)}<circle cx="60" cy="103" r="7" fill="url(#chem-molecule-d)" ${OW(2.6)}/><circle cx="57.6" cy="100.6" r="1.8" fill="#fff"/>`, pivot: [60, 89]},
          body: `${RG("chem-molecule-g", [[0, "#C9F6EE"], [0.55, "#7EDCCB"], [1, "#3FB3A2"]], 0.4, 0.34, 0.72)}
            <circle cx="60" cy="66" r="25" fill="url(#chem-molecule-g)" ${O}/>
            <ellipse cx="48" cy="51.5" rx="6.4" ry="3.6" transform="rotate(-32 48 51.5)" fill="#fff" opacity=".95"/><circle cx="56.5" cy="46.8" r="1.8" fill="#fff"/>
            <path d="M73 85Q80 81 83 73" fill="none" stroke="#2E9C8F" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>`,
          armL: {svg: `${LINE("M38 75L29 80", "#D8D2E6", 3)}${RG("chem-molecule-a", [[0, "#FFE0EC"], [1, "#FF8DB5"]], 0.4, 0.35, 0.7)}<circle cx="22" cy="84" r="10" fill="url(#chem-molecule-a)" ${O}/><circle cx="18.6" cy="80.4" r="2.4" fill="#fff"/>`, pivot: [39, 74]},
          armR: {svg: `${LINE("M82 75L91 80", "#D8D2E6", 3)}${RG("chem-molecule-b", [[0, "#FFE0EC"], [1, "#FF8DB5"]], 0.4, 0.35, 0.7)}<circle cx="98" cy="84" r="10" fill="url(#chem-molecule-b)" ${O}/><circle cx="94.6" cy="80.4" r="2.4" fill="#fff"/>`, pivot: [81, 74]},
          top: {svg: `${LINE("M60 41V31", "#D8D2E6", 3)}${RG("chem-molecule-t", [[0, "#FFF6CF"], [1, "#F7C948"]], 0.4, 0.35, 0.7)}<circle cx="60" cy="23" r="8.6" fill="url(#chem-molecule-t)" ${O}/><circle cx="57" cy="20" r="2.2" fill="#fff"/>`, pivot: [60, 42]}
        },
        eyes: {lx: 51, rx: 69, y: 65, r: 5, style: "sparkle", color: "#163A36"},
        mouth: {x: 60, y: 74, w: 3, color: "#163A36"},
        cheeks: {lx: 43.5, rx: 76.5, y: 73, w: 4.2, h: 2.6, color: "#FF8FB0"},
        anchors: {top: [60, 16, 0.62], neck: [60, 89, 0.95], chest: [73, 82, 0.58], back: [84, 52, 0.8], hands: [60, 86, 0.82]},
        lines: {
          tap: ["Hi hi! We have such great chemistry!", "You're bonding with your notes! Yay!", "Atom by atom, you're building greatness!", "You're positively brilliant!", "My atoms are spinning with joy!", "Totally stable, totally amazing! You!", "You and me, the perfect bond!"],
          pet: ["Hehe! That made my bonds wiggle!", "Ooh! I'm all energized now!"],
          hello: ["You're back! My electrons are buzzing!", "Hi! Let's make something great!"],
          morning: ["Good morning! Fully charged and ready!", "Rise and shine! Excited state activated!"],
          night: ["Ground state now. Time to rest?", "Calm bonds, cozy dreams. Sleep well!"],
          focus: ["Bonded to your side. You've got this!", "Vibrating quietly beside you."],
          done: ["What an electric session! WOW!", "Session done! I'm so excited for you!"],
          task: ["DONE! Pure brilliance!", "YES! Strong bond, great work!", "Checked off! Every atom is cheering!", "Another one done! Hooray!"],
          break: ["Spin and stretch! Wheee!", "Break time! Recharge a little!"]
        }
      },
      {
        id: "chem-beaker", name: "Beaky", kind: "Beaker", pose: "sit", sleepy: true, wearColor: "#E8643C",
        bio: "A friendly beaker who stirs up big cheers for your hard work.",
        idle: ["topBob", "bounce", "finWiggle"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="48" cy="108.5" rx="7.4" ry="4" fill="#4FA55A" ${O}/><ellipse cx="72" cy="108.5" rx="7.4" ry="4" fill="#4FA55A" ${O}/>`,
          body: `${LG("chem-beaker-gl", [[0, "#F4FBFF"], [1, "#DCEFFA"]])}${LG("chem-beaker-lq", [[0, "#D9F78A"], [0.6, "#A8E06A"], [1, "#78C454"]])}
            <defs><clipPath id="chem-beaker-c"><path d="M32 30V97Q32 106 41 106H79Q88 106 88 97V30Z"/></clipPath></defs>
            <path d="M32 30V97Q32 106 41 106H79Q88 106 88 97V30Z" fill="url(#chem-beaker-gl)"/>
            <g clip-path="url(#chem-beaker-c)"><path d="M20 58Q30 54.5 40 58T60 58T80 58T100 58V112H20Z" fill="url(#chem-beaker-lq)"/><path d="M20 58Q30 54.5 40 58T60 58T80 58T100 58" fill="none" stroke="#F0FFC8" stroke-width="2.4"/>
              <circle cx="40" cy="98" r="2" fill="#F0FFC8"/><circle cx="82" cy="94" r="1.6" fill="#F0FFC8"/><circle cx="78" cy="101" r="1.2" fill="#F0FFC8"/></g>
            <path d="M32 30V97Q32 106 41 106H79Q88 106 88 97V30Z" fill="none" ${O}/>
            <path d="M33 25.5Q26 24 22 18.5Q28 17.5 34 21.5H88Q91.5 21.5 91.5 25Q91.5 28.5 88 28.5H34Q31 28.5 33 25.5Z" fill="#EAF6FD" ${OW(2.4)}/>
            <path d="M37.5 34V52" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/><path d="M37.5 96V100" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>
            <path d="M88 38H82M88 45H84.5M88 52H82" stroke="#9CC3DA" stroke-width="1.8" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="28" cy="84" rx="4.6" ry="6.6" transform="rotate(28 28 84)" fill="#9AD563" ${O}/>`, pivot: [33, 81]},
          armR: {svg: `<ellipse cx="92" cy="84" rx="4.6" ry="6.6" transform="rotate(-28 92 84)" fill="#9AD563" ${O}/>`, pivot: [87, 81]},
          top: {svg: `${LINE("M68 52L81 9", "#E6F4FB", 3.4)}<path d="M79.6 13.5L82.4 4.2" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".9"/>`, pivot: [74, 30]}
        },
        eyes: {lx: 50, rx: 70, y: 75, r: 5, style: "dot", color: "#1F3A1E"},
        mouth: {x: 60, y: 84, w: 3.1, color: "#1F3A1E"},
        cheeks: {lx: 41.5, rx: 78.5, y: 83, w: 4.4, h: 2.7, color: "#FF9A8F"},
        anchors: {top: [57, 22, 0.95], neck: [60, 101, 1.25], chest: [78, 96, 0.66], back: [86, 62, 0.9], hands: [60, 99, 0.88]},
        lines: {
          tap: ["Hi! I'm full to the brim with joy!", "You measure up wonderfully!", "Stirring up something great! Yay!", "Your effort is off the scale!", "Mixing in a big cheer for you!", "Every bit adds up! Measured and true!", "You're doing amazing, lab partner!"],
          pet: ["Hehe! That made me slosh happily!", "Ooh! My stir stick is twirling!"],
          hello: ["You're back! Let's mix it up!", "Hi hi, lab partner! I missed you!"],
          morning: ["Good morning! Fresh mix, fresh day!", "Rise and shine! Goggles on, let's go!"],
          night: ["Settling down for the night. Rest?", "Lab lights off soon. Sweet dreams!"],
          focus: ["Stirring quietly beside you. Go!", "Steady and measured. You've got this!"],
          done: ["What a perfect mix! AMAZING!", "Session done! Overflowing with pride!"],
          task: ["DONE! Bubbling over with pride!", "YES! Perfectly measured!", "Checked off! What a mixture!", "Another one done! Hooray!"],
          break: ["Pour yourself some water! Sip sip!", "Stretch break! Swirl and twirl!"]
        }
      }
    ]
  });
})();

