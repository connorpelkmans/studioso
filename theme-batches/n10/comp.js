/* Study Companions, new theme ideas batch n10: icecave, geysers. Nature-object characters (no animals). */
(() => {
  const {O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const shine = (x, y, rx, ry, a) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})" fill="#fff" opacity=".75"/>`;

  /* ================= Blue Ice Cave ================= */
  COMP_DATA.push({
    theme: "icecave",
    companions: [
      {
        id: "icecave-glint", name: "Shard", kind: "Ice Crystal", pose: "stand", wearColor: "#2A9CC4",
        bio: "A little crystal of glacier ice. Catches the light and throws it back as a grin.",
        idle: ["sparkle", "topBob", "sway"], cheer: "spin",
        parts: {
          feet: `<ellipse cx="50" cy="106" rx="7.4" ry="4.4" fill="#7FD0EA" ${O}/><ellipse cx="70" cy="106" rx="7.4" ry="4.4" fill="#7FD0EA" ${O}/>`,
          body: `${LG("icecave-glint-b", [[0, "#ECFDFF"], [0.5, "#A6E8F5"], [1, "#56BCDE"]])}
            <path d="M60 28L83 42V90L60 104L37 90V42Z" fill="url(#icecave-glint-b)" ${O}/>
            <path d="M60 52L83 42V90L60 104Z" fill="#2E8EBE" opacity=".16"/>
            <path d="M60 28L83 42L60 52L37 42Z" fill="#fff" opacity=".55"/>
            <path d="M37.5 42L60 52L82.5 42" fill="none" stroke="#5AB4D8" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M43 50V64M43 70V74" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".9"/>
            <path d="M77 82l-3 5M73 92l-2.4 3" stroke="#3E9CC4" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>`,
          armL: {svg: `<path d="M39 64L24 71L29 81L39 76Z" fill="#A6E8F5" ${O}/><path d="M27 72.5L35 69" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>`, pivot: [38, 70]},
          armR: {svg: `<path d="M81 64L96 71L91 81L81 76Z" fill="#8EDCEE" ${O}/><path d="M85 69L93 72.5" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6"/>`, pivot: [82, 70]},
          top: {svg: `<path d="M60 6Q61.4 14.6 70 16Q61.4 17.4 60 26Q58.6 17.4 50 16Q58.6 14.6 60 6Z" fill="#FFF4B0" ${OW(2)}/><circle cx="70" cy="7" r="2" fill="#FFF4B0" ${OW(1.4)}/>`, pivot: [60, 27]}
        },
        eyes: {lx: 51, rx: 69, y: 68, r: 4.2, style: "sparkle", color: "#163450"},
        mouth: {x: 60, y: 79, w: 3, color: "#163450"},
        cheeks: {lx: 44, rx: 76, y: 77, w: 4, h: 2.4, color: "#FF9AB8"},
        anchors: {top: [60, 30, 0.8], neck: [60, 92, 0.95], chest: [72, 90, 0.6], back: [84, 66, 0.8], hands: [60, 94, 0.85]},
        lines: {
          tap: ["Hi! I'm Shard. I sparkle when you work hard.", "You're crystal clear today!", "Cool, calm and collected. That's us!", "Every task makes me shine a bit brighter.", "You've got a brilliant mind, you know.", "Hold steady. Good ideas take shape slowly.", "Clear head, clear plan. Let's go!", "I believe in you, facet by facet."],
          pet: ["Hehe! That makes me glitter!", "Ooh, careful, I'm a little cold!"],
          hello: ["You're back! The cave lit up!", "Hello, friend! Ready to shine?"],
          morning: ["Good morning! The light's coming through!", "Morning! Fresh ice, fresh start!"],
          night: ["The cave's gone blue and quiet. Rest soon?", "Even crystals need a little dark."],
          focus: ["Glowing quietly beside you.", "Still and clear. You've got this."],
          done: ["What a session! I'm all sparkles!", "Done! You polished that right up!"],
          task: ["Clink! One more done!", "Checked off! Shine on!", "Yes! Crystal clear work!", "Done and dazzling!"],
          break: ["Break time! Stretch and sip some water.", "Rest a moment. Let your mind melt a bit."]
        }
      },
      {
        id: "icecave-drip", name: "Drip", kind: "Meltwater Drop", pose: "float", wearColor: "#2FA8D0",
        bio: "Fell off an icicle and decided to stay. Never misses a deadline, only a puddle.",
        idle: ["bounce", "wave", "sway"], cheer: "hop",
        parts: {
          back: `<ellipse cx="60" cy="103" rx="34" ry="6" fill="#BFEFF8" ${O}/><path d="M32 103q5 2.4 10 0M78 104q5 2.4 10 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`,
          body: `${RG("icecave-drip-b", [[0, "#EEFDFF"], [0.5, "#8EDEF0"], [1, "#2FA8D0"]], 0.4, 0.36, 0.8)}
            <path d="M60 26C66 40 88 58 88 78C88 95 76 104 60 104C44 104 32 95 32 78C32 58 54 40 60 26Z" fill="url(#icecave-drip-b)" ${O}/>
            <path d="M80 80C80 91 72 98 62 99C72 95 77 88 78 79Z" fill="#fff" opacity=".55"/>
            ${shine(45, 64, 6, 3.4, -50)}<circle cx="50" cy="55" r="2" fill="#fff"/>`,
          armL: {svg: `<ellipse cx="31" cy="82" rx="5" ry="7" transform="rotate(25 31 82)" fill="#7FD6EC" ${O}/>`, pivot: [35, 79]},
          armR: {svg: `<ellipse cx="89" cy="82" rx="5" ry="7" transform="rotate(-25 89 82)" fill="#6CCCE6" ${O}/>`, pivot: [85, 79]},
          top: {svg: `<path d="M60 8C62 12 64.4 14 64.4 16.6A4.4 4.4 0 0 1 55.6 16.6C55.6 14 58 12 60 8Z" fill="#A6E8F5" ${OW(2)}/><circle cx="69" cy="14" r="2.2" fill="#A6E8F5" ${OW(1.6)}/><circle cx="58.4" cy="15.6" r="1" fill="#fff"/>`, pivot: [60, 25]}
        },
        eyes: {lx: 50, rx: 70, y: 76, r: 4.6, style: "sparkle", color: "#123048"},
        mouth: {x: 60, y: 87, w: 3.1, color: "#123048"},
        cheeks: {lx: 43, rx: 77, y: 85, w: 4.4, h: 2.6, color: "#FF9AB8"},
        anchors: {top: [60, 28, 0.8], neck: [60, 96, 1], chest: [72, 92, 0.6], back: [86, 70, 0.8], hands: [60, 94, 0.85]},
        lines: {
          tap: ["Plip! Hi there!", "Drop by drop, that's how caves are made. And grades!", "You're making a real splash today.", "Go with the flow. You know the way.", "Tiny drops wear down big rocks. Keep at it!", "Hello from the bottom of my little heart!", "One drip at a time. You've got this!"],
          pet: ["Hehe! You made me ripple!", "Plop! That tickles!"],
          hello: ["You're here! I dripped right over!", "Hiii! Splash in, let's study!"],
          morning: ["Good morning! The ice is melting into a bright day!", "Morning! Fresh and sparkly, like spring water!"],
          night: ["Freezing up for the night. You too?", "Quiet drips, sleepy thoughts. Rest well."],
          focus: ["Plip. Plip. Focusing with you.", "Steady drips, steady progress."],
          done: ["What a session! I'm overflowing!", "Done! That was a whole waterfall of work!"],
          task: ["Plip! Done!", "Checked off! Splish splash!", "Another one! You're on a roll!", "Yes! Making waves!"],
          break: ["Break! Have a glass of water. My cousins!", "Rest a bit. Let your thoughts settle."]
        }
      },
      {
        id: "icecave-puff", name: "Snowby", kind: "Little Snowball", pose: "sit", sleepy: true, wearColor: "#5A8AD0",
        bio: "Rolled in from the snowfield outside. Gets a little bigger with every good day.",
        idle: ["topBob", "wave", "bounce"], cheer: "hop",
        parts: {
          body: `${RG("icecave-puff-b", [[0, "#FFFFFF"], [0.6, "#EEF5FC"], [1, "#BCD2EA"]], 0.4, 0.34, 0.8)}
            <path d="${puff(60, 78, 30, 12, 1.14)}" fill="url(#icecave-puff-b)" ${O}/>
            <g fill="#A8C2E0" opacity=".7"><circle cx="40" cy="92" r="1.6"/><circle cx="80" cy="96" r="1.4"/><circle cx="84" cy="66" r="1.3"/><circle cx="74" cy="103" r="1.2"/><circle cx="46" cy="101" r="1.2"/></g>
            ${shine(45, 61, 7, 3.6, -36)}<circle cx="54" cy="55" r="1.8" fill="#fff"/>`,
          armL: {svg: `${LINE("M34 82L18 92", "#8A5A36", 3)}${LINE("M23.4 88.6L19 84", "#8A5A36", 2.2)}`, pivot: [35, 82]},
          armR: {svg: `${LINE("M86 82L102 92", "#8A5A36", 3)}${LINE("M96.6 88.6L101 84", "#8A5A36", 2.2)}`, pivot: [85, 82]},
          top: {svg: `${LINE("M60 50V42", "#6A4A2A", 2.2)}<path d="M60 43L51 36L54 41L47 40L55 45Z" fill="#4E8A5A" ${OW(1.8)}/><path d="M60 43L69 36L66 41L73 40L65 45Z" fill="#5A9A62" ${OW(1.8)}/><circle cx="51" cy="36" r="1.6" fill="#fff"/><circle cx="69" cy="36" r="1.6" fill="#fff"/><circle cx="60" cy="41" r="1.4" fill="#fff"/>`, pivot: [60, 50]}
        },
        eyes: {lx: 49, rx: 71, y: 77, r: 4, style: "dot", color: "#2A2F48"},
        mouth: {x: 60, y: 87, w: 3, color: "#2A2F48"},
        cheeks: {lx: 42, rx: 78, y: 85, w: 4.4, h: 2.6, color: "#FFA8C0"},
        anchors: {top: [60, 47, 0.85], neck: [60, 98, 1], chest: [72, 94, 0.62], back: [88, 74, 0.8], hands: [60, 96, 0.85]},
        lines: {
          tap: ["Hi! I'm Snowby. I roll with it.", "Look at you, snowballing through your list!", "Every little task makes me a bit rounder!", "You're cooler than the inside of a glacier.", "Brr! Studying keeps me warm!", "Little by little, we get bigger!", "Snow worries. You've got this."],
          pet: ["Hehe! Don't melt me with kindness!", "Ooh, a pat! I'm all fluffy now!"],
          hello: ["You're back! I rolled over to say hi!", "Hello! Fresh snow, fresh focus!"],
          morning: ["Good morning! Crisp and bright out there!", "Morning! I'm extra fluffy today!"],
          night: ["Yawn. Snowballs need sleep too.", "The stars are out. Time to rest soon?"],
          focus: ["Shh. Snow falls quietly. So do I.", "Rolling along right beside you."],
          done: ["You did it! I'm doing a happy roll!", "Session done! Snowball high five!"],
          task: ["Pomf! One more done!", "Checked off! Rolling on!", "Yes! That's the snowball effect!", "Woohoo! Look at that!"],
          break: ["Break time! Shake out your arms like twigs!", "Rest a bit. Maybe a warm drink?"]
        }
      }
    ]
  });

  /* ================= Geyser Basin ================= */
  COMP_DATA.push({
    theme: "geysers",
    companions: [
      {
        id: "geysers-wisp", name: "Fumi", kind: "Steam Puff", pose: "float", wearColor: "#6FB0D8",
        bio: "Rises to every occasion, then politely drifts off.",
        idle: ["sway", "topBob", "wave"], cheer: "spin",
        parts: {
          back: `${LINE("M48 98q-5 5 0 9", "#FFFFFF", 2.6)}${LINE("M72 98q5 5 0 9", "#FFFFFF", 2.6)}`,
          body: `${RG("geysers-wisp-b", [[0, "#FFFFFF"], [0.6, "#F2F4FA"], [1, "#C6CCE2"]], 0.42, 0.34, 0.8)}
            <path d="${puff(60, 70, 28, 9, 1.26)}" fill="url(#geysers-wisp-b)" ${O}/>
            <path d="M44 90Q60 97 76 90" fill="none" stroke="#C6CCE2" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>
            ${shine(46, 54, 7, 3.6, -34)}<circle cx="55" cy="49" r="1.8" fill="#fff"/>`,
          armL: {svg: `<circle cx="29" cy="76" r="7" fill="#F2F4FA" ${O}/>`, pivot: [35, 74]},
          armR: {svg: `<circle cx="91" cy="76" r="7" fill="#E8EBF4" ${O}/>`, pivot: [85, 74]},
          top: {svg: LINE("M60 43q-6-5 0-11t0-11", "#FFFFFF", 2.8), pivot: [60, 44]}
        },
        eyes: {lx: 50, rx: 70, y: 70, r: 4.2, style: "dot", color: "#3A3450"},
        mouth: {x: 60, y: 80, w: 3, color: "#3A3450"},
        cheeks: {lx: 43, rx: 77, y: 78, w: 4.4, h: 2.6, color: "#FFB0C8"},
        anchors: {top: [60, 44, 0.8], neck: [60, 94, 1], chest: [72, 88, 0.6], back: [86, 66, 0.8], hands: [60, 92, 0.85]},
        lines: {
          tap: ["Fwoosh! Hi there!", "I'm just here to let off a little steam.", "You're really heating up today!", "Light and airy, that's the mood!", "Rising up, one task at a time!", "Hot springs, cool student!", "Keep that pressure building. Then whoosh!", "Floating along, cheering you on!"],
          pet: ["Hehe! You'll blow me away!", "Ooh, I'm all puffed up now!"],
          hello: ["You're here! I floated right over!", "Hiii! The basin's steaming for you!"],
          morning: ["Good morning! Misty and magical out there!", "Morning! Rising with the sun!"],
          night: ["Drifting off under the moon. You too?", "Soft steam, sweet dreams."],
          focus: ["Drifting quietly beside you.", "Steady steam, steady focus."],
          done: ["What a session! I'm on cloud nine!", "Done! That was a full eruption of work!"],
          task: ["Fwoosh! Done!", "Checked off! Steamy hooray!", "Another one! Full steam ahead!", "Yes! Up and away!"],
          break: ["Break! Breathe out slowly, like steam.", "Float for a minute. Then back to it!"]
        }
      },
      {
        id: "geysers-prism", name: "Sinter", kind: "Prismatic Pebble", pose: "sit", wearColor: "#E0782E",
        bio: "A warm sinter pebble with a tiny rainbow pool on top. Very proud of its colors.",
        idle: ["sparkle", "topBob", "sway"], cheer: "bounce",
        parts: {
          body: `${RG("geysers-prism-b", [[0, "#FCFAF4"], [0.6, "#E4DED2"], [1, "#B8AE9E"]], 0.42, 0.3, 0.8)}
            <path d="M60 52C84 52 96 70 96 86C96 102 82 110 60 110C38 110 24 102 24 86C24 70 36 52 60 52Z" fill="url(#geysers-prism-b)" ${O}/>
            <ellipse cx="60" cy="66" rx="22" ry="7.4" fill="#E58A3E" ${O2}/><ellipse cx="60" cy="66" rx="18" ry="5.9" fill="#F2C54E"/><ellipse cx="60" cy="66" rx="14.6" ry="4.7" fill="#62BC98"/>
            <ellipse cx="60" cy="66" rx="12" ry="3.8" fill="#3EB0D2"/><ellipse cx="60.5" cy="65.7" rx="7.6" ry="2.4" fill="#1D5EA6"/><path d="M52 64.4q3-1.4 6-1.2" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>
            <g fill="#A89C8C" opacity=".6"><circle cx="34" cy="96" r="1.5"/><circle cx="88" cy="94" r="1.4"/><circle cx="82" cy="104" r="1.2"/><circle cx="40" cy="78" r="1.2"/></g>
            ${shine(36, 76, 4, 2.2, -50)}`,
          armL: {svg: `<ellipse cx="26" cy="92" rx="5.6" ry="7" transform="rotate(28 26 92)" fill="#DCD4C6" ${O}/>`, pivot: [30, 88]},
          armR: {svg: `<ellipse cx="94" cy="92" rx="5.6" ry="7" transform="rotate(-28 94 92)" fill="#D2C8B8" ${O}/>`, pivot: [90, 88]},
          top: {svg: `${LINE("M60 62q-4-5 0-10t0-9", "#FFFFFF", 2.2)}${LINE("M70 62q-3-4 0-8", "#FFFFFF", 1.8)}`, pivot: [60, 63]}
        },
        eyes: {lx: 49, rx: 71, y: 86, r: 4, style: "dot", color: "#3A2E24"},
        mouth: {x: 60, y: 96, w: 2.8, color: "#3A2E24"},
        cheeks: {lx: 40, rx: 80, y: 94, w: 4.2, h: 2.5, color: "#FF9A8A"},
        anchors: {top: [60, 58, 0.85], neck: [60, 104, 1], chest: [74, 100, 0.6], back: [90, 80, 0.8], hands: [60, 102, 0.85]},
        lines: {
          tap: ["Hi! Want to see my little rainbow?", "You bring out my best colors!", "Warm heart, bright ideas. That's you!", "Small pebble, big pride in you!", "Every color on me is cheering for you!", "Steady and warm. That's how we do it.", "You're making today shine!"],
          pet: ["Hehe! My pool just rippled!", "Ooh, warm hands! Thank you!"],
          hello: ["You're back! My colors just got brighter!", "Hello! The basin missed you!"],
          morning: ["Good morning! Rainbows come out first thing!", "Morning! Toasty and ready!"],
          night: ["My pool glows softly at night. Rest well.", "Cooling off for the night. You too?"],
          focus: ["Sitting warm and quiet right here.", "Calm colors, calm mind."],
          done: ["What a session! I'm glowing every color!", "Done! That was beautifully layered work!"],
          task: ["Bloop! Done!", "Checked off! Rainbow hooray!", "Another one! So colorful!", "Yes! Bright work!"],
          break: ["Break time! Warm drink and a stretch?", "Rest a bit. Even geysers take their time."]
        }
      },
      {
        id: "geysers-cody", name: "Cody", kind: "Lodgepole Pine Cone", pose: "stand", wearColor: "#4E9A5A",
        bio: "Only opens up when things get warm. Like your study streak.",
        idle: ["topBob", "wave", "bounce"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="50" cy="107" rx="7.4" ry="4.6" fill="#7A4E2A" ${O}/><ellipse cx="70" cy="107" rx="7.4" ry="4.6" fill="#7A4E2A" ${O}/>`,
          body: `${LG("geysers-cody-b", [[0, "#D4A06A"], [1, "#8A5A30"]])}
            <path d="M60 30C76 30 86 48 86 68C86 90 74 104 60 104C46 104 34 90 34 68C34 48 44 30 60 30Z" fill="url(#geysers-cody-b)" ${O}/>
            <g fill="#E8BE88" stroke="#6A4220" stroke-width="1.6" stroke-linejoin="round">
              <path d="M48 42q4 6 8 0q-4 -5 -8 0Z"/><path d="M56 38q4 6 8 0q-4 -5 -8 0Z"/><path d="M64 42q4 6 8 0q-4 -5 -8 0Z"/>
              <path d="M40 52q4 6 8 0q-4 -5 -8 0Z"/><path d="M52 50q4 6 8 0q-4 -5 -8 0Z"/><path d="M60 50q4 6 8 0q-4 -5 -8 0Z"/><path d="M72 52q4 6 8 0q-4 -5 -8 0Z"/>
              <path d="M36 66q3.6 6 7.4 0q-3.8 -5 -7.4 0Z"/><path d="M76.6 66q3.6 6 7.4 0q-3.8 -5 -7.4 0Z"/>
              <path d="M38 80q4 6 8 0q-4 -5 -8 0Z"/><path d="M74 80q4 6 8 0q-4 -5 -8 0Z"/>
              <path d="M44 92q4 6 8 0q-4 -5 -8 0Z"/><path d="M56 95q4 6 8 0q-4 -5 -8 0Z"/><path d="M68 92q4 6 8 0q-4 -5 -8 0Z"/></g>
            ${shine(44, 46, 4.4, 2.4, -40)}`,
          armL: {svg: `<ellipse cx="30" cy="74" rx="5" ry="7.4" transform="rotate(28 30 74)" fill="#B07A44" ${O}/>`, pivot: [35, 72]},
          armR: {svg: `<ellipse cx="90" cy="74" rx="5" ry="7.4" transform="rotate(-28 90 74)" fill="#9A6A3A" ${O}/>`, pivot: [85, 72]},
          top: {svg: `${LINE("M59 31L49 10", "#4E9A5A", 2.6)}${LINE("M61 31L71 10", "#5AAA62", 2.6)}<rect x="56.6" y="28" width="6.8" height="5" rx="2" fill="#7A4E2A" ${OW(1.8)}/>`, pivot: [60, 32]}
        },
        eyes: {lx: 51, rx: 69, y: 72, r: 4.2, style: "sparkle", color: "#2E1A0E"},
        mouth: {x: 60, y: 82, w: 3, color: "#2E1A0E"},
        cheeks: {lx: 44, rx: 76, y: 80, w: 4.2, h: 2.5, color: "#FF9A8A"},
        anchors: {top: [60, 30, 0.85], neck: [60, 98, 1], chest: [72, 94, 0.6], back: [86, 70, 0.8], hands: [60, 96, 0.85]},
        lines: {
          tap: ["Hi! I'm Cody. Proud member of the pine family!", "Warm days open me right up!", "You're growing like a whole forest!", "Tall goals start as tiny seeds.", "Stand tall, like a lodgepole!", "I'm rooting for you. Literally!", "Every task is a new ring on your tree!"],
          pet: ["Hehe! Mind the scales!", "Ooh, that's a sappy moment!"],
          hello: ["You're back! The whole forest says hi!", "Hello, friend! Let's grow some knowledge!"],
          morning: ["Good morning! Pine fresh and ready!", "Morning! The sun's warming my scales!"],
          night: ["Closing my scales for the night. Rest well!", "The pines are whispering goodnight."],
          focus: ["Standing tall and quiet beside you.", "Rooted and ready. Let's focus."],
          done: ["What a session! I'm opening up with joy!", "Done! You're a pine-nacle of focus!"],
          task: ["Pop! Another one done!", "Checked off! Pine-tastic!", "Yes! Growing strong!", "Done! Tree-mendous!"],
          break: ["Break time! Stretch tall like a pine!", "Rest a bit in the shade."]
        }
      }
    ]
  });
})();
