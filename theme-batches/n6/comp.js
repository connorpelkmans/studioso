/* Study Companions, batch n6: film, culinary, marinebio, vet, aerospace */
(() => {
  const {INK, O, OW, LG, RG, LINE} = COMP_KIT;
  const O2 = OW(2.2);

  /* ================= Movie Palace ================= */
  COMP_DATA.push({
    theme: "film",
    companions: [
      {
        id: "film-clappy", name: "Clappy", kind: "Clapperboard", pose: "stand", wearColor: "#E8C25A",
        bio: "Snaps at the start of every take.",
        idle: ["topBob", "wave", "headTilt"], cheer: "bounce",
        neck: [60, 92],
        parts: {
          feet: `<rect x="44" y="100" width="9" height="9" rx="3" fill="#3A3444" ${O2}/><rect x="67" y="100" width="9" height="9" rx="3" fill="#3A3444" ${O2}/><ellipse cx="48.5" cy="109.5" rx="7.4" ry="3.6" fill="#E25A5A" ${O2}/><ellipse cx="71.5" cy="109.5" rx="7.4" ry="3.6" fill="#E25A5A" ${O2}/>`,
          body: `<rect x="46" y="88" width="28" height="14" rx="6" fill="#4A4458" ${O}/>`,
          armL: {svg: `<ellipse cx="25" cy="78" rx="5" ry="7" transform="rotate(30 25 78)" fill="#5A5468" ${O}/>`, pivot: [31, 74]},
          armR: {svg: `<ellipse cx="95" cy="78" rx="5" ry="7" transform="rotate(-30 95 78)" fill="#5A5468" ${O}/>`, pivot: [89, 74]},
          head: `${LG("film-clappy-film-clap-g", [[0, "#5A5470"], [1, "#2E2A3A"]])}
            <rect x="26" y="44" width="68" height="50" rx="8" fill="url(#film-clappy-film-clap-g)" ${O}/>
            <path d="M31 80H89M60 80V90" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".45"/>
            <rect x="33" y="83.5" width="20" height="4" rx="2" fill="#FFE08A" opacity=".85"/><rect x="66" y="83.5" width="16" height="4" rx="2" fill="#9ED8FF" opacity=".85"/>
            <rect x="26" y="37" width="68" height="10" rx="3" fill="#F6F2EA" ${O}/>
            <path d="M33 37L40 47M47 37L54 47M61 37L68 47M75 37L82 47" stroke="#2E2A3A" stroke-width="4.6"/>
            <path d="M31 50Q34 47 39 47" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>`,
          top: {svg: `<g transform="rotate(-14 28 36)"><rect x="26" y="25" width="68" height="10" rx="3" fill="#F6F2EA" ${O}/><path d="M35 25L42 35M49 25L56 35M63 25L70 35M77 25L84 35" stroke="#2E2A3A" stroke-width="4.6"/></g><circle cx="28.5" cy="36" r="3.4" fill="#C9CED8" ${O2}/>`, pivot: [28, 36]}
        },
        eyes: {lx: 49, rx: 71, y: 62, r: 5.4, style: "sparkle", color: "#1E1A28"},
        mouth: {x: 60, y: 71.5, w: 3.2, color: "#1E1A28"},
        cheeks: {lx: 40.5, rx: 79.5, y: 70, w: 4.6, h: 2.8, color: "#FF8FA8"},
        anchors: {top: [60, 30, 0.9], neck: [60, 94, 1], chest: [72, 97, 0.6], back: [92, 70, 0.85], hands: [60, 92, 0.85]},
        lines: {
          tap: ["Scene one, take one: you, being awesome!", "Lights, camera, study!", "That was a great take!", "You're the star of this production!", "Quiet on set! Genius at work!", "Ready when you are, director!", "Every scene gets better with you in it!"],
          pet: ["Snap snap! That tickles!", "Hehe! Cut! Print! That's a keeper!"],
          hello: ["You're back on set! Places, everyone!", "Hi! Clapper's ready for the next scene!"],
          morning: ["Good morning! Call time is now, superstar!", "Rise and shine! It's a brand new shoot!"],
          night: ["That's a wrap for today? Rest well.", "The set's going dark. Sweet dreams!"],
          focus: ["Rolling... and action! Quiet focus now.", "Silent take. I'll hold the board."],
          done: ["CUT! That session was perfect!", "And that's a wrap! Bravo!"],
          task: ["SNAP! Got it in one take!", "Cut and print! Done!", "That's a keeper! WOO!", "Another scene in the can!"],
          break: ["Intermission! Grab some popcorn!", "Five minutes, everyone! Stretch it out!"]
        }
      },
      {
        id: "film-poppy", name: "Poppy", kind: "Popcorn Bucket", pose: "stand", wearColor: "#E25A5A",
        bio: "Pops a kernel every time something good happens.",
        idle: ["bounce", "topBob", "sparkle"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="48" cy="109.5" rx="7.6" ry="4" fill="#C8323F" ${O2}/><ellipse cx="72" cy="109.5" rx="7.6" ry="4" fill="#C8323F" ${O2}/>`,
          top: {svg: `<g ${O2}><circle cx="38" cy="45" r="9" fill="#FFF6DC"/><circle cx="52" cy="38" r="10" fill="#FFFBEA"/><circle cx="68" cy="38" r="10" fill="#FFF6DC"/><circle cx="82" cy="45" r="9" fill="#FFFBEA"/><circle cx="60" cy="30" r="9" fill="#FFF8E0"/><circle cx="46" cy="27" r="6.6" fill="#FFF8E0"/><circle cx="75" cy="27" r="6.6" fill="#FFFBEA"/></g>
            <circle cx="58" cy="27" r="2" fill="#F2C24A"/><circle cx="70" cy="40" r="2" fill="#F2C24A"/><circle cx="41" cy="44" r="1.8" fill="#F2C24A"/><circle cx="50" cy="33" r="1.6" fill="#fff"/>`, pivot: [60, 50]},
          body: `${LG("film-poppy-film-pop-r", [[0, "#F2575E"], [1, "#C8323F"]])}
            <path d="M28 46H92L85 104Q84.4 108 80 108H40Q35.6 108 35 104Z" fill="url(#film-poppy-film-pop-r)" ${O}/>
            <path d="M45.5 46L48 108M60 46V108M74.5 46L72 108" stroke="#FFF4EE" stroke-width="7" opacity=".95"/>
            <path d="M28 46H92L85 104Q84.4 108 80 108H40Q35.6 108 35 104Z" fill="none" ${O}/>
            <rect x="25" y="43" width="70" height="9" rx="4.5" fill="#F2575E" ${O}/>
            <rect x="40" y="88" width="40" height="12" rx="6" fill="#FFE08A" ${O2}/><path d="M47 94H73" stroke="#C8323F" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="3 3"/>`,
          armL: {svg: `<ellipse cx="27" cy="76" rx="4.8" ry="6.6" transform="rotate(28 27 76)" fill="#F2575E" ${O}/>`, pivot: [33, 73]},
          armR: {svg: `<ellipse cx="93" cy="76" rx="4.8" ry="6.6" transform="rotate(-28 93 76)" fill="#F2575E" ${O}/>`, pivot: [87, 73]}
        },
        eyes: {lx: 50, rx: 70, y: 67, r: 5.2, style: "sparkle", color: "#3A1418"},
        mouth: {x: 60, y: 76, w: 3.2, color: "#3A1418"},
        cheeks: {lx: 41.5, rx: 78.5, y: 75, w: 4.4, h: 2.8, color: "#FFB0C0"},
        anchors: {top: [60, 26, 0.9], neck: [60, 52, 1.15], chest: [72, 86, 0.6], back: [86, 74, 0.85], hands: [60, 84, 0.85]},
        lines: {
          tap: ["Pop! Hi there, superstar!", "You're doing popping good today!", "Butter-smooth progress! Keep going!", "Every little kernel of effort counts!", "You make my whole bucket happy!", "Snack break later? I'm just saying!", "Pop pop pop! That's my happy sound!"],
          pet: ["Hehe! You made a kernel pop!", "Crunchy cuddles! Yay!"],
          hello: ["You're here! The show can start now!", "Hi hi! Fresh and ready to pop!"],
          morning: ["Good morning! Popping with energy!", "Rise and shine, warm and toasty!"],
          night: ["The last show's over. Bedtime soon?", "Getting sleepy. Pop by tomorrow!"],
          focus: ["Quiet munching only. You've got this!", "Settling in for the feature. Focus time!"],
          done: ["POP POP POP! What a session!", "That deserves a standing ovation!"],
          task: ["POP! That one's done!", "Woohoo! Extra butter for that!", "Done and popped! YES!", "A kernel of greatness! Checked!"],
          break: ["Snack time! Stretch those legs!", "Intermission! Take a happy break!"]
        }
      },
      {
        id: "film-spotty", name: "Spotty", kind: "Spotlight", pose: "stand", wearColor: "#7A6AD8",
        bio: "Points its beam at whoever is working hardest.",
        idle: ["sway", "sparkle", "headTilt"], cheer: "spin",
        neck: [60, 84],
        parts: {
          back: `${LG("film-spotty-film-spot-beam", [[0, "#FFF4C2", 0.9], [1, "#FFF4C2", 0]], 0, 0, 1, 0)}<path d="M84 46L118 26V86L84 70Z" fill="url(#film-spotty-film-spot-beam)"/>`,
          feet: `${LINE("M60 92L44 109M60 92L76 109M60 92V110", "#8A8EA0", 3)}<circle cx="44" cy="109.5" r="3.2" fill="#5A5E70" ${O2}/><circle cx="76" cy="109.5" r="3.2" fill="#5A5E70" ${O2}/><circle cx="60" cy="110" r="3.2" fill="#5A5E70" ${O2}/>`,
          body: `<rect x="53" y="80" width="14" height="14" rx="4" fill="#6A6E82" ${O}/><path d="M38 70Q38 84 60 84Q82 84 82 70" fill="none" stroke="${INK}" stroke-width="6.4" stroke-linecap="round"/><path d="M38 70Q38 84 60 84Q82 84 82 70" fill="none" stroke="#9A9EB2" stroke-width="3.2" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="34" cy="86" rx="4.6" ry="6.4" transform="rotate(30 34 86)" fill="#8A8EA0" ${O}/>`, pivot: [40, 83]},
          armR: {svg: `<ellipse cx="86" cy="86" rx="4.6" ry="6.4" transform="rotate(-30 86 86)" fill="#8A8EA0" ${O}/>`, pivot: [80, 83]},
          head: `${LG("film-spotty-film-spot-g", [[0, "#9A8AF0"], [1, "#5A48B8"]])}${RG("film-spotty-film-spot-l", [[0, "#FFFFFF"], [0.6, "#FFF6CC"], [1, "#FFD86B"]], 0.4, 0.38, 0.7)}
            <path d="M28 44Q28 30 40 28H80Q92 30 92 44V70Q92 80 80 80H40Q28 80 28 70Z" fill="url(#film-spotty-film-spot-g)" ${O}/>
            <rect x="84" y="40" width="10" height="28" rx="4" fill="#4A3A98" ${O2}/>
            <circle cx="60" cy="56" r="20.5" fill="#FFE9A8" ${O}/><circle cx="60" cy="56" r="16.5" fill="url(#film-spotty-film-spot-l)"/>
            <path d="M44 48Q47 41 54 39" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M33 36Q37 31 44 31" fill="none" stroke="#C8BEFF" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>`
        },
        eyes: {lx: 52.5, rx: 67.5, y: 55, r: 4.4, style: "sparkle", color: "#3A2A1A"},
        mouth: {x: 60, y: 63.5, w: 2.8, color: "#3A2A1A"},
        cheeks: {lx: 46, rx: 74, y: 62, w: 3.6, h: 2.3, color: "#FF9A8A"},
        anchors: {top: [60, 30, 0.95], neck: [60, 85, 0.95], chest: [70, 90, 0.55], back: [34, 60, 0.8], hands: [60, 88, 0.8]},
        lines: {
          tap: ["And the spotlight goes to... you!", "Shining my brightest beam on you!", "You're glowing today, I can tell!", "Center stage suits you!", "Hard work looks brilliant under the lights!", "I see a star in the making!", "Ready for your close-up?"],
          pet: ["Ooh, I'm all warmed up now!", "Hehe! My lens is blushing!"],
          hello: ["You're back! Lights up!", "Hi! I saved the brightest beam for you!"],
          morning: ["Good morning! Warming up the lights!", "Rise and shine! Literally, that's my job!"],
          night: ["Dimming the lights. Time to rest?", "Soft glow only now. Sleep well!"],
          focus: ["Beam on you. Everything else fades out.", "Focused light, focused mind. Go!"],
          done: ["Standing ovation! What a performance!", "Bravo! Encore! Amazing session!"],
          task: ["SPOTLIGHT MOMENT! Done!", "That one shines! Woohoo!", "Applause! Checked off!", "Brilliant! Absolutely brilliant!"],
          break: ["House lights up! Stretch time!", "Take a bow, then take a break!"]
        }
      }
    ]
  });

  /* ================= Test Kitchen ================= */
  COMP_DATA.push({
    theme: "culinary",
    companions: [
      {
        id: "culinary-twirly", name: "Twirly", kind: "Little Whisk", pose: "stand", wearColor: "#E07A4A",
        bio: "Spins up a storm and loves meringue.",
        idle: ["spin", "sway", "topBob"], cheer: "spin",
        parts: {
          feet: `<ellipse cx="51" cy="109.5" rx="6.6" ry="3.8" fill="#A8693A" ${O2}/><ellipse cx="69" cy="109.5" rx="6.6" ry="3.8" fill="#A8693A" ${O2}/>`,
          top: {svg: `<g fill="none" stroke-linecap="round"><path d="M50 52C34 30 40 10 60 8C80 10 86 30 70 52M54.5 52C46 30 50 12 60 8C70 12 74 30 65.5 52M60 52V8" stroke="${INK}" stroke-width="6"/>
            <path d="M50 52C34 30 40 10 60 8C80 10 86 30 70 52M54.5 52C46 30 50 12 60 8C70 12 74 30 65.5 52M60 52V8" stroke="#DDE4EC" stroke-width="3"/></g>
            <path d="M45 30Q44 22 50 16" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>
            <g ${O2}><circle cx="78" cy="18" r="4.6" fill="#FFF8F0"/><circle cx="83" cy="13" r="3" fill="#FFF8F0"/></g>`, pivot: [60, 54]},
          body: `${LG("culinary-twirly-cul-whisk-g", [[0, "#F2B47A"], [1, "#C8783E"]])}
            <rect x="40" y="48" width="40" height="62" rx="20" fill="url(#culinary-twirly-cul-whisk-g)" ${O}/>
            <rect x="38" y="46" width="44" height="9" rx="4.5" fill="#C9D2DC" ${O}/>
            <path d="M46 62Q46 56 51 54" fill="none" stroke="#FFE2C2" stroke-width="2.8" stroke-linecap="round"/>
            <path d="M45 98H75" stroke="#A8693A" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>`,
          armL: {svg: `<ellipse cx="33.5" cy="80" rx="4.8" ry="6.6" transform="rotate(30 33.5 80)" fill="#E59A5C" ${O}/>`, pivot: [40, 77]},
          armR: {svg: `<ellipse cx="86.5" cy="80" rx="4.8" ry="6.6" transform="rotate(-30 86.5 80)" fill="#E59A5C" ${O}/>`, pivot: [80, 77]}
        },
        eyes: {lx: 52, rx: 68, y: 72, r: 4.8, style: "sparkle", color: "#3A2010"},
        mouth: {x: 60, y: 81, w: 3, color: "#3A2010"},
        cheeks: {lx: 45, rx: 75, y: 79.5, w: 4, h: 2.5, color: "#FF8F8F"},
        anchors: {top: [60, 30, 0.85], neck: [60, 56, 1], chest: [70, 92, 0.6], back: [80, 80, 0.8], hands: [60, 90, 0.82]},
        lines: {
          tap: ["Whisk whisk! Hi there, chef!", "You're whipping through this!", "Light and fluffy, like your progress!", "A little spin makes everything better!", "Stiff peaks of brilliance! Look at you!", "Mixing up something wonderful today!", "Whirr! I'm so happy you're here!"],
          pet: ["Wheee! You made me spin!", "Hehe! My wires are all tingly!"],
          hello: ["You're back! Let's whip something up!", "Hi hi! Spinning with excitement!"],
          morning: ["Good morning! Ready to whisk away the day!", "Rise and shine, fluffy and bright!"],
          night: ["Slowing my spin. Time to rest?", "Settling into the drawer. Sweet dreams!"],
          focus: ["Steady stirring. You've got this.", "Gentle folding mode. Focus time!"],
          done: ["WHIRRR! That session was perfect!", "Fluffy as a meringue! Amazing work!"],
          task: ["Whisked away! DONE!", "Perfect peaks! Checked off!", "Spin spin spin! YES!", "Beautifully blended! Done!"],
          break: ["Rest the batter! Stretch break!", "Let it rise! Take a little break!"]
        }
      },
      {
        id: "culinary-toque", name: "Toque", kind: "Chef's Hat", pose: "stand", wearColor: "#E25A4A", hatTop: true,
        bio: "Grows a little taller with each finished recipe.",
        idle: ["topBob", "sway", "headTilt"], cheer: "bounce",
        neck: [60, 86],
        parts: {
          feet: `<ellipse cx="49" cy="109.5" rx="7" ry="3.8" fill="#3A3444" ${O2}/><ellipse cx="71" cy="109.5" rx="7" ry="3.8" fill="#3A3444" ${O2}/>`,
          body: `<path d="M44 84H76L78 104Q78 108 74 108H46Q42 108 42 104Z" fill="#FFFFFF" ${O}/><path d="M60 86V106" stroke="#D8DEE6" stroke-width="2"/><circle cx="55" cy="93" r="1.6" fill="#C8D0DA"/><circle cx="55" cy="100" r="1.6" fill="#C8D0DA"/><path d="M50 84L60 92L70 84" fill="#E25A4A" ${O2}/>`,
          armL: {svg: `<ellipse cx="37" cy="92" rx="4.8" ry="6.6" transform="rotate(30 37 92)" fill="#FFFFFF" ${O}/>`, pivot: [43, 89]},
          armR: {svg: `<ellipse cx="83" cy="92" rx="4.8" ry="6.6" transform="rotate(-30 83 92)" fill="#FFFFFF" ${O}/>`, pivot: [77, 89]},
          head: `${LG("culinary-toque-cul-toque-b", [[0, "#FFFFFF"], [1, "#E6EBF2"]])}
            <path d="M32 52H88V80Q88 86 82 86H38Q32 86 32 80Z" fill="url(#culinary-toque-cul-toque-b)" ${O}/>
            <path d="M42 54V84M52 54V84M68 54V84M78 54V84" stroke="#DCE2EA" stroke-width="2"/>
            <path d="M36 58Q36 55 40 55" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`,
          top: {svg: `${RG("culinary-toque-cul-toque-p", [[0, "#FFFFFF"], [0.7, "#F4F6FA"], [1, "#DCE2EA"]], 0.4, 0.35, 0.8)}
            <path d="M30 56C18 52 18 32 32 30C30 18 46 10 54 18C58 8 74 8 76 20C86 12 102 22 92 34C104 38 102 54 90 56Z" fill="url(#culinary-toque-cul-toque-p)" ${O}/>
            <path d="M44 52Q44 40 48 34M60 52Q60 38 62 30M76 52Q76 40 72 34" fill="none" stroke="#DCE2EA" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M34 36Q36 28 44 26" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`, pivot: [60, 56]}
        },
        eyes: {lx: 50, rx: 70, y: 68, r: 4.8, style: "sparkle", color: "#2A2430"},
        mouth: {x: 60, y: 77, w: 3, color: "#2A2430"},
        cheeks: {lx: 41.5, rx: 78.5, y: 75.5, w: 4.2, h: 2.6, color: "#FF9AA8"},
        anchors: {top: [60, 24, 0.95], neck: [60, 86, 0.95], chest: [70, 98, 0.55], back: [84, 92, 0.8], hands: [60, 100, 0.8]},
        lines: {
          tap: ["Bonjour, chef! Ready to cook up greatness?", "Your recipe for success is looking delicious!", "A pinch of patience, a dash of genius!", "Every great dish starts with one step!", "Yes, chef! You're doing wonderfully!", "I feel taller already, thanks to you!", "Mise en place! Everything in its place!"],
          pet: ["Oh la la! My pleats are all fluffy!", "Hehe! Careful, I'm freshly starched!"],
          hello: ["You're back in the kitchen! Yes, chef!", "Hello! The ovens are warm and ready!"],
          morning: ["Good morning! Fresh ingredients, fresh start!", "Bonjour! Let's prep a lovely day!"],
          night: ["Kitchen's closing. Rest up, chef!", "Hanging up my hat soon. Sleep well!"],
          focus: ["Quiet in the kitchen. Chef is focusing!", "Simmer and stay steady. You've got this."],
          done: ["Magnifique! What a session!", "Chef's kiss! That was perfect!"],
          task: ["Order up! DONE!", "Yes, chef! Checked off!", "Plated perfectly! WOO!", "I just grew a little taller! YES!"],
          break: ["Let it rest! Break time, chef!", "Stretch break! Even chefs need one!"]
        }
      },
      {
        id: "culinary-basil", name: "Basil", kind: "Basil Sprout", pose: "sit", wearColor: "#E08A4A",
        bio: "Fresh, fragrant and always ready to garnish.",
        idle: ["sway", "wave", "sparkle"], cheer: "hop",
        parts: {
          feet: `${LG("culinary-basil-cul-basil-pot", [[0, "#F09A6A"], [1, "#C8603A"]])}<path d="M38 88H82L78 108Q77.4 111 74 111H46Q42.6 111 42 108Z" fill="url(#culinary-basil-cul-basil-pot)" ${O}/><rect x="35" y="84" width="50" height="9" rx="4" fill="#E08A5A" ${O}/>`,
          top: {svg: `${LINE("M60 40V28", "#4E9A4A", 2.6)}<path d="M60 30C52 20 42 22 40 28C46 32 54 34 60 30Z" fill="#7CCB6A" ${O2}/><path d="M60 29C66 18 78 18 80 24C76 30 66 32 60 29Z" fill="#8FD878" ${O2}/><path d="M58 28Q50 25 44 27M62 27Q70 23 76 23.5" fill="none" stroke="#4E9A4A" stroke-width="1.4" stroke-linecap="round"/>`, pivot: [60, 40]},
          body: `${RG("culinary-basil-cul-basil-g", [[0, "#B8F0A0"], [0.55, "#7CCB6A"], [1, "#4E9A4A"]], 0.42, 0.35, 0.75)}
            <path d="M60 38C82 38 92 56 90 72C88 86 76 92 60 92C44 92 32 86 30 72C28 56 38 38 60 38Z" fill="url(#culinary-basil-cul-basil-g)" ${O}/>
            <path d="M60 40Q60 56 60 66" fill="none" stroke="#4E9A4A" stroke-width="1.8" stroke-linecap="round" opacity=".45"/>
            <path d="M40 54Q43 46 50 43" fill="none" stroke="#E2FFD2" stroke-width="3" stroke-linecap="round"/>`,
          armL: {svg: `<path d="M34 70C24 66 18 72 20 78C26 80 32 76 34 70Z" fill="#8FD878" ${O}/>`, pivot: [34, 70]},
          armR: {svg: `<path d="M86 70C96 66 102 72 100 78C94 80 88 76 86 70Z" fill="#8FD878" ${O}/>`, pivot: [86, 70]}
        },
        eyes: {lx: 50, rx: 70, y: 64, r: 5, style: "sparkle", color: "#1E3A1A"},
        mouth: {x: 60, y: 73.5, w: 3, color: "#1E3A1A"},
        cheeks: {lx: 41.5, rx: 78.5, y: 72, w: 4.4, h: 2.7, color: "#FF9A9A"},
        anchors: {top: [60, 38, 0.9], neck: [60, 86, 1.1], chest: [72, 80, 0.6], back: [88, 64, 0.8], hands: [60, 84, 0.85]},
        lines: {
          tap: ["Fresh hello from your favorite herb!", "You're growing so well today!", "A little sunshine, a little water, a lot of you!", "Smells like success in here!", "You add flavor to everything!", "Leafing through your notes? Love it!", "Sprouting with pride over here!"],
          pet: ["Hehe! You made me extra fragrant!", "Aww, my leaves are all perky now!"],
          hello: ["Fresh from the window box! Hi!", "Hello! I've been soaking up sun for you!"],
          morning: ["Good morning! Leaves to the sunshine!", "Rise and shine! Fresh as can be!"],
          night: ["Folding up my leaves. Rest soon?", "Moonlight snooze time. Sleep well!"],
          focus: ["Growing quietly beside you. Focus!", "Rooted and ready. You've got this."],
          done: ["What a session! I'm in full bloom!", "Garnished with greatness! Amazing!"],
          task: ["Fresh and finished! DONE!", "A perfect garnish on your day! YES!", "Picked and checked! WOO!", "Sprouting with joy! Done!"],
          break: ["Sunshine break! Stretch your stems!", "Water break! Hydrate like a happy plant!"]
        }
      }
    ]
  });

  /* ================= Kelp Forest ================= */
  COMP_DATA.push({
    theme: "marinebio",
    companions: [
      {
        id: "marinebio-kelpie", name: "Kelpie", kind: "Kelp Sprite", pose: "float", wearColor: "#3AA6A0",
        bio: "Tall, wavy and anchored to its goals.",
        idle: ["sway", "wave", "finWiggle"], cheer: "spin",
        parts: {
          tail: {svg: `<g transform="translate(0 -6)"><path d="M54 104C50 110 54 114 60 114C66 114 70 110 66 104" fill="#8A6A3A" ${O2}/><path d="M52 112L46 116M68 112L74 116M60 114V118" stroke="#8A6A3A" stroke-width="2.4" stroke-linecap="round"/></g>`, pivot: [60, 98]},
          body: `<g transform="translate(0 -6)">${LG("marinebio-kelpie-mar-kelp-g", [[0, "#B8D86A"], [0.5, "#86B44A"], [1, "#5E8A34"]], 0.2, 0, 0.8, 1)}${RG("marinebio-kelpie-mar-kelp-f", [[0, "#FFF2B0"], [1, "#E0A830"]], 0.4, 0.35, 0.7)}
            <path d="M60 28C70 30 76 38 78 46C82 50 77 54 80 60C84 66 78 70 81 76C84 84 78 88 79 94C76 104 66 106 60 106C54 106 44 104 41 94C42 88 36 84 39 76C42 70 36 66 40 60C43 54 38 50 42 46C44 38 50 30 60 28Z" fill="url(#marinebio-kelpie-mar-kelp-g)" ${O}/>
            <path d="M60 32Q58 66 60 102" fill="none" stroke="#4E7A2A" stroke-width="1.8" stroke-linecap="round" opacity=".5"/>
            <path d="M49 44Q46 52 49 58M71 44Q74 52 71 58M47 80Q44 88 48 96M73 80Q76 88 72 96" fill="none" stroke="#E2F6A8" stroke-width="2.2" stroke-linecap="round" opacity=".75"/>
            ${LINE("M60 28V22", "#86B44A", 2.4)}<circle cx="60" cy="16" r="8" fill="url(#marinebio-kelpie-mar-kelp-f)" ${O}/><circle cx="57.4" cy="13.4" r="2.2" fill="#fff"/>
            <circle cx="88" cy="40" r="2.4" fill="#fff" opacity=".85" ${OW(1.4)}/><circle cx="92" cy="31" r="1.6" fill="#fff" opacity=".85"/></g>`,
          armL: {svg: `<g transform="translate(0 -6)"><path d="M43 68C36 62 30 66 24 60C20 58 22 54 18 52C26 48 34 52 40 56C44 59 46 62 46 64Z" fill="#9CC85A" ${O}/><path d="M42 63Q32 57 24 55" fill="none" stroke="#5E8A34" stroke-width="1.3" stroke-linecap="round"/></g>`, pivot: [45, 59]},
          armR: {svg: `<g transform="translate(0 -6)"><path d="M77 68C84 62 90 66 96 60C100 58 98 54 102 52C94 48 86 52 80 56C76 59 74 62 74 64Z" fill="#9CC85A" ${O}/><path d="M78 63Q88 57 96 55" fill="none" stroke="#5E8A34" stroke-width="1.3" stroke-linecap="round"/></g>`, pivot: [75, 59]}
        },
        eyes: {lx: 51.5, rx: 68.5, y: 56, r: 4.8, style: "sparkle", color: "#1E2A10"},
        mouth: {x: 60, y: 65, w: 3, color: "#1E2A10"},
        cheeks: {lx: 45.5, rx: 74.5, y: 63.5, w: 4, h: 2.5, color: "#FF9A8A"},
        anchors: {top: [60, 10, 0.75], neck: [60, 68, 0.95], chest: [69, 76, 0.55], back: [76, 54, 0.75], hands: [60, 74, 0.8]},
        lines: {
          tap: ["Hello from the kelp forest!", "Swaying with joy that you're here!", "Rooted deep, reaching high, just like you!", "Go with the flow, you're doing great!", "You're growing a little every day!", "Sunbeams look good on you!", "Kelp yeah! You've got this!"],
          pet: ["Hehe! That makes my fronds wiggle!", "Ooh, bubbly and happy!"],
          hello: ["You're back! The whole forest waved!", "Hi! I grew two inches waiting for you!"],
          morning: ["Good morning! Sunbeams are coming down!", "Rise and shine! Reach for the light!"],
          night: ["The water's dark and calm. Rest soon?", "Swaying slowly to sleep. Goodnight!"],
          focus: ["Anchored and steady. Focus time.", "Calm currents. You've got this."],
          done: ["What a session! I'm swaying with pride!", "Tall and proud! Amazing work!"],
          task: ["Kelp yeah! DONE!", "Swish! Another one finished!", "Rooted in success! Checked!", "Growing strong! WOO!"],
          break: ["Float break! Stretch like seaweed!", "Drift a little! Take a breather!"]
        }
      },
      {
        id: "marinebio-subby", name: "Subby", kind: "Little Submarine", pose: "float", wearColor: "#3AA6A0",
        bio: "Dives deep into any subject.",
        idle: ["topBob", "sparkle", "bounce"], cheer: "bounce",
        parts: {
          back: `<g transform="translate(18 68)"><rect x="-4" y="-4" width="10" height="8" rx="2" fill="#B8A06A" ${O2}/><ellipse cx="-6" cy="0" rx="3" ry="11" fill="#E0C88A" ${O2}/></g>`,
          top: {svg: `${LINE("M70 40V24H80", "#8A8EA0", 3)}<rect x="78" y="20" width="9" height="7" rx="2" fill="#6A6E82" ${O2}/><rect x="48" y="34" width="26" height="14" rx="5" fill="#F2B624" ${O}/>`, pivot: [62, 46]},
          body: `${LG("marinebio-subby-mar-sub-g", [[0, "#FFE27A"], [0.55, "#F6BE2E"], [1, "#D8941A"]])}${RG("marinebio-subby-mar-sub-w", [[0, "#F0FDFF"], [0.6, "#BDEBF4"], [1, "#6EC4D8"]], 0.38, 0.32, 0.75)}
            <path d="M22 72C22 52 40 44 62 44C86 44 100 56 100 72C100 88 86 98 62 98C40 98 22 90 22 72Z" fill="url(#marinebio-subby-mar-sub-g)" ${O}/>
            <circle cx="64" cy="70" r="19" fill="#C8963A" ${O}/><circle cx="64" cy="70" r="15" fill="url(#marinebio-subby-mar-sub-w)"/>
            <path d="M52 64Q54 57 60 55" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
            <circle cx="35" cy="66" r="4.6" fill="#BDEBF4" ${O2}/><circle cx="92" cy="74" r="3" fill="#FFF6D6" ${O2}/>
            <path d="M30 56Q36 50 46 48" fill="none" stroke="#FFF3B8" stroke-width="3" stroke-linecap="round"/>
            <path d="M28 86Q44 94 60 94" fill="none" stroke="#C88A1A" stroke-width="2" stroke-linecap="round" opacity=".6"/>`,
          armL: {svg: `<path d="M44 94L36 106L50 104L54 96Z" fill="#E8A82A" ${O}/>`, pivot: [48, 96]},
          armR: {svg: `<path d="M78 94L88 106L74 104L70 96Z" fill="#E8A82A" ${O}/>`, pivot: [74, 96]}
        },
        eyes: {lx: 57.5, rx: 70.5, y: 69, r: 3.8, style: "sparkle", color: "#1A3A4A"},
        mouth: {x: 64, y: 76.5, w: 2.4, color: "#1A3A4A"},
        cheeks: {lx: 53, rx: 75, y: 75, w: 3, h: 2, color: "#FF9AA8"},
        anchors: {top: [62, 34, 0.85], neck: [62, 92, 0.95], chest: [80, 84, 0.55], back: [30, 60, 0.75], hands: [62, 92, 0.8]},
        lines: {
          tap: ["Ping! Submarine Subby reporting for duty!", "Diving deep into greatness with you!", "Depth gauge says: you're amazing!", "All systems go, captain!", "Periscope up! I see a superstar!", "Exploring new depths today!", "Full speed ahead, captain!"],
          pet: ["Hehe! My hatch is all fluttery!", "Bubbles! That means I'm happy!"],
          hello: ["Surfacing to say hi! Welcome back!", "Captain on deck! Hello hello!"],
          morning: ["Good morning! Sunlight on the surface!", "Rise and shine! Ballast tanks full of joy!"],
          night: ["Running quiet below the waves. Rest soon?", "Night dive mode. Sweet dreams, captain."],
          focus: ["Silent running. Deep focus ahead.", "Diving deep together. You've got this."],
          done: ["What a deep dive! Brilliant session!", "Mission complete, captain! Amazing!"],
          task: ["Ping! Target reached! DONE!", "Dive complete! Checked off!", "Treasure found! WOO!", "Full steam ahead! YES!"],
          break: ["Surface break! Take a deep breath!", "Come up for air! Stretch time!"]
        }
      },
      {
        id: "marinebio-dolly", name: "Dolly", kind: "Dolphin Calf", pose: "float", wearColor: "#F2A33A",
        bio: "Clicks happily when you finish a chapter.",
        idle: ["finWiggle", "tailSwish", "topBob"], cheer: "spin",
        parts: {
          tail: {svg: `<g transform="translate(0 -3)"><path d="M84 90C92 94 100 92 106 86C104 96 98 102 90 102C96 106 98 112 94 114C88 108 80 104 76 98Z" fill="#6E9AC8" ${O}/></g>`, pivot: [80, 93]},
          top: {svg: `<g transform="translate(0 -3)"><path d="M70 38C72 30 78 26 85 27C82 32 81 37 81 42Z" fill="#6E9AC8" ${O}/></g>`, pivot: [75, 39]},
          body: `<g transform="translate(0 -3)">${LG("marinebio-dolly-mar-dol-g", [[0, "#9CC6EE"], [0.6, "#6E9AC8"], [1, "#5A84B4"]])}
            <path d="M24 66C22 48 40 34 60 34C80 34 92 48 92 66C92 88 80 102 60 102C42 102 26 88 24 66Z" fill="url(#marinebio-dolly-mar-dol-g)" ${O}/>
            <path d="M36 74C40 90 52 96 62 96C74 96 82 90 84 80C76 86 66 88 58 86C48 84 40 80 36 74Z" fill="#EEF7FC"/>
            <path d="M27 62C16 60 6 64 6 69C8 75 18 76 28 73Z" fill="#8EB8E2" ${O}/><path d="M9 70Q16 72 26 70" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>
            <path d="M34 50Q38 42 48 39" fill="none" stroke="#D6ECFF" stroke-width="3" stroke-linecap="round"/>
            <ellipse cx="54" cy="37" rx="3" ry="1.6" fill="#4A74A4"/></g>`,
          armL: {svg: `<g transform="translate(0 -3)"><path d="M34 82C26 84 22 92 24 98C30 96 36 90 38 86Z" fill="#6E9AC8" ${O}/></g>`, pivot: [36, 81]},
          armR: {svg: `<g transform="translate(0 -3)"><path d="M84 82C92 84 96 92 94 98C88 96 82 90 80 86Z" fill="#6E9AC8" ${O}/></g>`, pivot: [82, 81]}
        },
        eyes: {lx: 46, rx: 64, y: 57, r: 5, style: "sparkle", color: "#1A2A44"},
        mouth: {x: 55, y: 68, w: 3.4, color: "#1A2A44"},
        cheeks: {lx: 38, rx: 72, y: 66, w: 4.2, h: 2.6, color: "#FF9AB8"},
        anchors: {top: [56, 31, 0.85], neck: [57, 81, 1], chest: [66, 83, 0.6], back: [84, 53, 0.8], hands: [57, 85, 0.82]},
        lines: {
          tap: ["Click click! Hi, friend!", "You make waves wherever you go!", "Splashing with joy that you're here!", "Smart and playful, just like dolphins!", "Leap into it! You've got this!", "Swimming happy circles around you!", "Eee-eee! That means you're awesome!"],
          pet: ["Eee! Splashy happy!", "Hehe! That tickles my flippers!"],
          hello: ["Click click! You're back!", "Hi! I did a flip when I saw you!"],
          morning: ["Good morning! Sunshine on the waves!", "Rise and shine! Let's make a splash!"],
          night: ["Floating sleepily. Rest soon?", "Half asleep, like real dolphins. Goodnight!"],
          focus: ["Gliding quietly beside you. Focus!", "Smooth swimming. You've got this."],
          done: ["What a session! Big splash for you!", "Eee-eee! You were amazing!"],
          task: ["Click click! DONE!", "Big leap! Checked off!", "Splash! Another chapter done!", "Flip for joy! WOO!"],
          break: ["Splash break! Wiggle those fins!", "Surface for air! Stretch time!"]
        }
      }
    ]
  });

  /* ================= Vet Clinic ================= */
  COMP_DATA.push({
    theme: "vet",
    companions: [
      {
        id: "vet-biscuit", name: "Biscuit", kind: "Puppy Patient", pose: "sit", wearColor: "#4AB8C8",
        bio: "Wears a cone and makes it look good.",
        idle: ["tailSwish", "earTwitch", "headTilt"], cheer: "hop",
        neck: [60, 80],
        parts: {
          tail: {svg: `<path d="M84 98C94 96 98 88 96 80" fill="none" stroke="${INK}" stroke-width="8.6" stroke-linecap="round"/><path d="M84 98C94 96 98 88 96 80" fill="none" stroke="#F2C27A" stroke-width="5" stroke-linecap="round"/>`, pivot: [84, 98]},
          feet: `<ellipse cx="46" cy="108.5" rx="8" ry="4.2" fill="#FFF2DE" ${O2}/><ellipse cx="74" cy="108.5" rx="8" ry="4.2" fill="#FFF2DE" ${O2}/>`,
          body: `${LG("vet-biscuit-vet-bis-b", [[0, "#F8D296"], [1, "#E2A456"]])}${LG("vet-biscuit-vet-bis-cone", [[0, "#DFF6FA", 0.75], [1, "#9EDCE8", 0.75]])}
            <path d="M60 76C78 76 86 88 86 100C86 108 78 111 60 111C42 111 34 108 34 100C34 88 42 76 60 76Z" fill="url(#vet-biscuit-vet-bis-b)" ${O}/>
            <ellipse cx="60" cy="96" rx="11" ry="10" fill="#FFF2DE"/>
            <path d="M26 46L94 46L76 84L44 84Z" fill="url(#vet-biscuit-vet-bis-cone)" ${O}/>
            <path d="M32 52L44 82M88 52L76 82" stroke="#fff" stroke-width="1.8" opacity=".7"/>
            <ellipse cx="60" cy="82" rx="16" ry="3.6" fill="#E25A5A" ${O2}/><circle cx="60" cy="87" r="3.2" fill="#F6CE4A" ${O2}/>`,
          earL: {svg: `<path d="M40 50C30 50 28 64 32 74C38 76 44 68 44 58Z" fill="#B8783A" ${O}/>`, pivot: [42, 52]},
          earR: {svg: `<path d="M80 50C90 50 92 64 88 74C82 76 76 68 76 58Z" fill="#B8783A" ${O}/>`, pivot: [78, 52]},
          head: `${RG("vet-biscuit-vet-bis-h", [[0, "#FFE6B8"], [1, "#EAB06A"]], 0.42, 0.32, 0.75)}
            <ellipse cx="60" cy="60" rx="21" ry="19" fill="url(#vet-biscuit-vet-bis-h)" ${O}/>
            <path d="M60 42C56 48 56 54 60 58C64 54 64 48 60 42Z" fill="#FFF6E6"/>
            <path d="M44 52Q46 45 52 43" fill="none" stroke="#FFF2D6" stroke-width="2.6" stroke-linecap="round"/>`,
          face: `<ellipse cx="60" cy="70" rx="10" ry="7" fill="#FFF6E6"/><ellipse cx="60" cy="66.5" rx="3.6" ry="2.6" fill="${INK}"/><circle cx="58.8" cy="65.8" r=".9" fill="#fff"/>`,
          armL: {svg: `<rect x="44" y="93" width="10" height="16" rx="5" fill="#F2C27A" ${O}/><rect x="44" y="99" width="10" height="5" fill="#FFFFFF" ${OW(1.4)}/>`, pivot: [49, 93]},
          armR: {svg: `<rect x="66" y="93" width="10" height="16" rx="5" fill="#F2C27A" ${O}/>`, pivot: [71, 93]}
        },
        eyes: {lx: 50, rx: 70, y: 58, r: 4.8, style: "sparkle", color: "#2A1A10"},
        mouth: {x: 60, y: 73, w: 2.4, style: "cat", color: "#2A1A10"},
        cheeks: {lx: 43, rx: 77, y: 67, w: 4, h: 2.5, color: "#FF8F8F"},
        anchors: {top: [60, 40, 0.9], neck: [60, 86, 1.05], chest: [71, 98, 0.6], back: [34, 92, 0.8], hands: [60, 98, 0.85]},
        lines: {
          tap: ["Woof! Hi! Do you have a treat?", "The cone is a fashion statement, okay?", "You're the best! The very best!", "Tail wags for every page you read!", "Paws up! You're doing great!", "I'm a good pup and you're a good student!", "Fetch that goal! You've got this!"],
          pet: ["Ooh, right behind the ears! Yes!", "Hehe! My tail won't stop wagging!"],
          hello: ["WOOF! You're back! Best day ever!", "Hi hi hi! I missed you so much!"],
          morning: ["Good morning! Walk time? Study time? Both!", "Rise and shine! Wiggly morning!"],
          night: ["Curling up in my bed. You rest too?", "Sleepy pup. Goodnight, friend!"],
          focus: ["Good sit, good stay. You've got this.", "Quiet pup mode. Focus time!"],
          done: ["WOOF WOOF! That session was paws-ome!", "Zoomies! You did amazing!"],
          task: ["WOOF! DONE!", "Good job! Treat time? Treat time!", "Wag wag wag! Checked off!", "Fetched it! YES!"],
          break: ["Walkies! Stretch those legs!", "Water bowl break! Drink up!"]
        }
      },
      {
        id: "vet-stethy", name: "Stethy", kind: "Stethoscope", pose: "stand", wearColor: "#4A8AE0",
        bio: "Listens closely to everything you say.",
        idle: ["sway", "topBob", "wave"], cheer: "bounce",
        parts: {
          feet: `<ellipse cx="50" cy="109.5" rx="7" ry="3.8" fill="#3A6AB8" ${O2}/><ellipse cx="70" cy="109.5" rx="7" ry="3.8" fill="#3A6AB8" ${O2}/>`,
          top: {svg: `<path d="M44 52C36 36 36 22 40 14M76 52C84 36 84 22 80 14" fill="none" stroke="${INK}" stroke-width="7.6" stroke-linecap="round"/><path d="M44 52C36 36 36 22 40 14M76 52C84 36 84 22 80 14" fill="none" stroke="#4A8AE0" stroke-width="4" stroke-linecap="round"/>
            <circle cx="40" cy="12" r="4.4" fill="#C9D2DC" ${O2}/><circle cx="80" cy="12" r="4.4" fill="#C9D2DC" ${O2}/>`, pivot: [60, 54]},
          body: `${RG("vet-stethy-vet-st-g", [[0, "#FFFFFF"], [0.5, "#DCE4EE"], [1, "#9AA8BA"]], 0.4, 0.34, 0.75)}${RG("vet-stethy-vet-st-d", [[0, "#F2F8FF"], [1, "#B8D4F2"]], 0.4, 0.35, 0.7)}
            <path d="M40 52H80" stroke="${INK}" stroke-width="7.6" stroke-linecap="round"/><path d="M40 52H80" stroke="#4A8AE0" stroke-width="4" stroke-linecap="round"/>
            <rect x="56" y="50" width="8" height="18" rx="3" fill="#9AA8BA" ${O}/>
            <circle cx="60" cy="86" r="23" fill="url(#vet-stethy-vet-st-g)" ${O}/><circle cx="60" cy="86" r="17" fill="url(#vet-stethy-vet-st-d)" ${OW(2.2)}/>
            <path d="M47 78Q50 71 57 69" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M74 98Q79 96 81 91" fill="none" stroke="#8A9AB0" stroke-width="2" stroke-linecap="round" opacity=".6"/>`,
          armL: {svg: `<ellipse cx="33" cy="88" rx="4.6" ry="6.4" transform="rotate(30 33 88)" fill="#C9D2DC" ${O}/>`, pivot: [39, 85]},
          armR: {svg: `<ellipse cx="87" cy="88" rx="4.6" ry="6.4" transform="rotate(-30 87 88)" fill="#C9D2DC" ${O}/>`, pivot: [81, 85]}
        },
        eyes: {lx: 52.5, rx: 67.5, y: 85, r: 4.2, style: "sparkle", color: "#1A2A44"},
        mouth: {x: 60, y: 93, w: 2.6, color: "#1A2A44"},
        cheeks: {lx: 47, rx: 73, y: 91.5, w: 3.4, h: 2.2, color: "#FF9AB0"},
        anchors: {top: [60, 30, 0.85], neck: [60, 66, 0.9], chest: [70, 100, 0.55], back: [82, 70, 0.75], hands: [60, 100, 0.8]},
        lines: {
          tap: ["Hello! I'm all ears. Well, earpieces!", "I hear a hard worker! Is that you?", "Your progress sounds healthy and strong!", "Thump thump! That's a brave heart!", "Deep breath in... and you've got this!", "Everything sounds wonderful today!", "Listening to you is my favorite thing!"],
          pet: ["Hehe! That's a happy heartbeat!", "Ooh, cold hands? Just kidding!"],
          hello: ["You're back! I heard you coming!", "Hello! Checkup time? You look great!"],
          morning: ["Good morning! Pulse is perky today!", "Rise and shine! Heart's beating happily!"],
          night: ["Quiet ward hours. Rest soon?", "Listening to the night. Sleep well!"],
          focus: ["Steady rhythm. Focus and breathe.", "Calm heartbeat, clear mind. You've got this."],
          done: ["What a session! Strong and steady!", "Clean bill of health for that session!"],
          task: ["Thump thump! DONE!", "Healthy progress! Checked off!", "Sounds like success! WOO!", "Perfect rhythm! YES!"],
          break: ["Deep breaths! Stretch break!", "Rest and recover! Water time!"]
        }
      },
      {
        id: "vet-treaty", name: "Treaty", kind: "Treat Jar", pose: "stand", wearColor: "#F07A7A",
        bio: "Gives out one treat per finished task.",
        idle: ["topBob", "bounce", "sparkle"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="48" cy="109.5" rx="7.4" ry="3.8" fill="#C8945A" ${O2}/><ellipse cx="72" cy="109.5" rx="7.4" ry="3.8" fill="#C8945A" ${O2}/>`,
          top: {svg: `${LG("vet-treaty-vet-tr-l", [[0, "#FF9A9A"], [1, "#E25A5A"]])}<rect x="32" y="34" width="56" height="12" rx="5" fill="url(#vet-treaty-vet-tr-l)" ${O}/><rect x="52" y="26" width="16" height="10" rx="4" fill="#F07A7A" ${O}/><path d="M38 38H52" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`, pivot: [60, 46]},
          body: `${LG("vet-treaty-vet-tr-g", [[0, "#F4FBFF", 0.95], [1, "#C8E4F2", 0.95]])}
            <path d="M36 46H84Q90 46 90 54V100Q90 108 82 108H38Q30 108 30 100V54Q30 46 36 46Z" fill="url(#vet-treaty-vet-tr-g)" ${O}/>
            <g ${O2}><path d="M38 100H52A3 3 0 1 1 54 104A3 3 0 1 1 52 108H38A3 3 0 1 1 36 104A3 3 0 1 1 38 100Z" fill="#E8B07A" transform="rotate(-12 45 104)"/><path d="M60 98H74A3 3 0 1 1 76 102A3 3 0 1 1 74 106H60A3 3 0 1 1 58 102A3 3 0 1 1 60 98Z" fill="#F2C48A" transform="rotate(10 67 102)"/><path d="M46 90H60A3 3 0 1 1 62 94A3 3 0 1 1 60 98H46A3 3 0 1 1 44 94A3 3 0 1 1 46 90Z" fill="#D89A5A" transform="rotate(6 53 94)"/></g>
            <path d="M36 56Q36 50 42 50" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><rect x="80" y="56" width="3.4" height="24" rx="1.7" fill="#fff" opacity=".8"/>
            <rect x="44" y="76" width="32" height="10" rx="5" fill="#FFE08A" ${O2}/><path d="M55 81H65" stroke="#E25A5A" stroke-width="2.2" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="25" cy="78" rx="4.6" ry="6.4" transform="rotate(28 25 78)" fill="#DCEEF8" ${O}/>`, pivot: [31, 75]},
          armR: {svg: `<ellipse cx="95" cy="78" rx="4.6" ry="6.4" transform="rotate(-28 95 78)" fill="#DCEEF8" ${O}/>`, pivot: [89, 75]}
        },
        eyes: {lx: 50, rx: 70, y: 62, r: 5, style: "sparkle", color: "#2A2A3A"},
        mouth: {x: 60, y: 70.5, w: 3, color: "#2A2A3A"},
        cheeks: {lx: 42, rx: 78, y: 69, w: 4.2, h: 2.6, color: "#FF8FA8"},
        anchors: {top: [60, 26, 0.9], neck: [60, 48, 1.1], chest: [74, 92, 0.6], back: [88, 70, 0.8], hands: [60, 88, 0.85]},
        lines: {
          tap: ["Psst! Finish a task and there's a treat in it!", "You're doing treat-worthy work today!", "Crunchy, chewy, and cheering for you!", "One task, one treat. That's the deal!", "I'm filled to the lid with pride!", "Good student! Yes you are!", "Jiggle jiggle! That's my happy dance!"],
          pet: ["Hehe! Careful, my lid's loose!", "Clink clink! That's a happy jar!"],
          hello: ["You're back! I kept the treats safe!", "Hi! Lid's on, treats are fresh!"],
          morning: ["Good morning! Breakfast treats first?", "Rise and shine! Fully stocked today!"],
          night: ["Lid's closed for the night. Rest soon?", "No midnight snacks! Sleep well!"],
          focus: ["Treats are waiting. Focus first!", "Quiet jar. You've got this."],
          done: ["What a session! Double treats!", "Jackpot! That deserves the whole jar!"],
          task: ["Treat time! DONE!", "Clink! One treat for you!", "Good job! Have a cookie! WOO!", "Lid pops with joy! Checked!"],
          break: ["Snack break! Stretch and munch!", "Treat yourself to a little rest!"]
        }
      }
    ]
  });

  /* ================= Launch Pad ================= */
  COMP_DATA.push({
    theme: "aerospace",
    companions: [
      {
        id: "aerospace-cosmo", name: "Cosmo", kind: "Astronaut Pup", pose: "sit", wearColor: "#E8453E",
        bio: "Wears its helmet even indoors.",
        idle: ["tailSwish", "earTwitch", "headTilt"], cheer: "hop",
        neck: [60, 80],
        parts: {
          tail: {svg: `<path d="M84 100C94 98 98 90 96 82" fill="none" stroke="${INK}" stroke-width="8.6" stroke-linecap="round"/><path d="M84 100C94 98 98 90 96 82" fill="none" stroke="#E8B47A" stroke-width="5" stroke-linecap="round"/>`, pivot: [84, 100]},
          feet: `<ellipse cx="46" cy="108.5" rx="8.4" ry="4.4" fill="#C9CED8" ${O2}/><ellipse cx="74" cy="108.5" rx="8.4" ry="4.4" fill="#C9CED8" ${O2}/>`,
          body: `${LG("aerospace-cosmo-aero-cos-b", [[0, "#FFFFFF"], [1, "#D6DCE8"]])}
            <path d="M60 76C78 76 86 88 86 100C86 108 78 111 60 111C42 111 34 108 34 100C34 88 42 76 60 76Z" fill="url(#aerospace-cosmo-aero-cos-b)" ${O}/>
            <rect x="50" y="88" width="20" height="13" rx="3" fill="#4A6AB8" ${O2}/><circle cx="55" cy="94.5" r="2" fill="#E8453E"/><circle cx="61" cy="94.5" r="2" fill="#F6CE4A"/><circle cx="66.5" cy="94.5" r="1.6" fill="#7CDCC8"/>
            <ellipse cx="60" cy="78" rx="19" ry="4.6" fill="#C9CED8" ${O2}/>`,
          earL: {svg: `<path d="M44 46C36 44 32 54 34 62C40 64 46 58 46 50Z" fill="#B8783A" ${O}/>`, pivot: [44, 48]},
          earR: {svg: `<path d="M76 46C84 44 88 54 86 62C80 64 74 58 74 50Z" fill="#B8783A" ${O}/>`, pivot: [76, 48]},
          head: `${RG("aerospace-cosmo-aero-cos-h", [[0, "#FFE2B8"], [1, "#E8A866"]], 0.42, 0.32, 0.75)}
            <ellipse cx="60" cy="58" rx="20" ry="18" fill="url(#aerospace-cosmo-aero-cos-h)" ${O}/>
            <path d="M46 50Q48 44 54 42" fill="none" stroke="#FFF2D6" stroke-width="2.6" stroke-linecap="round"/>`,
          face: `<ellipse cx="60" cy="67" rx="9.6" ry="6.6" fill="#FFF4E4"/><ellipse cx="60" cy="63.5" rx="3.4" ry="2.4" fill="${INK}"/><circle cx="58.8" cy="62.8" r=".9" fill="#fff"/>`,
          hat: `${RG("aerospace-cosmo-aero-cos-glass", [[0, "#FFFFFF", 0.05], [0.75, "#CFEFFF", 0.22], [1, "#9ED8F8", 0.5]], 0.45, 0.4, 0.6)}
            <circle cx="60" cy="58" r="30" fill="url(#aerospace-cosmo-aero-cos-glass)" ${O}/>
            <path d="M38 46Q42 34 54 30" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" opacity=".85"/><circle cx="80" cy="40" r="2.6" fill="#fff" opacity=".8"/>
            <rect x="56" y="24" width="8" height="5" rx="2" fill="#E8453E" ${O2}/>`,
          armL: {svg: `<rect x="43" y="93" width="11" height="16" rx="5.5" fill="#EEF2F8" ${O}/>`, pivot: [48.5, 93]},
          armR: {svg: `<rect x="66" y="93" width="11" height="16" rx="5.5" fill="#EEF2F8" ${O}/>`, pivot: [71.5, 93]}
        },
        eyes: {lx: 51, rx: 69, y: 56, r: 4.6, style: "sparkle", color: "#2A1A10"},
        mouth: {x: 60, y: 70, w: 2.3, style: "cat", color: "#2A1A10"},
        cheeks: {lx: 44, rx: 76, y: 64, w: 3.8, h: 2.4, color: "#FF8F8F"},
        anchors: {top: [60, 26, 0.95], neck: [60, 84, 1], chest: [72, 98, 0.55], back: [34, 92, 0.8], hands: [60, 98, 0.85]},
        lines: {
          tap: ["Woof! Mission control, I see a genius!", "Helmet on, tail wagging, ready to launch!", "You're out of this world today!", "One small step for you, one giant wag for me!", "Houston, we have a superstar!", "Orbiting around you, happily!", "Ready for liftoff, commander!"],
          pet: ["Hehe! You can't pat through the helmet! Okay, a little!", "Wag wag! Zero gravity zoomies!"],
          hello: ["Woof! Welcome back, commander!", "You're back! Systems are go!"],
          morning: ["Good morning! Launch window is open!", "Rise and shine, space cadet!"],
          night: ["Stargazing time. Rest soon, commander?", "Docking for the night. Goodnight!"],
          focus: ["Countdown to focus. Three, two, one...", "Quiet as space. You've got this."],
          done: ["Mission accomplished! Woof woof!", "That session went to the moon!"],
          task: ["LIFTOFF! DONE!", "Woof! Mission complete!", "Orbit reached! Checked off!", "Stellar work! YES!"],
          break: ["Space walk! Stretch your legs!", "Refuel break! Water time!"]
        }
      },
      {
        id: "aerospace-ping", name: "Ping", kind: "Little Satellite", pose: "float", wearColor: "#4A8AE0",
        bio: "Sends you a signal every time you finish something.",
        idle: ["spin", "sparkle", "topBob"], cheer: "spin",
        parts: {
          top: {svg: `${LINE("M60 46V32", "#9AA0B4", 2.6)}<path d="M46 30Q60 16 74 30Q60 36 46 30Z" fill="#EEF2F8" ${O2}/><circle cx="60" cy="24" r="3.4" fill="#E8453E" ${O2}/><path d="M78 18Q82 14 82 9M84 22Q90 16 89 8" fill="none" stroke="#7CDCC8" stroke-width="2" stroke-linecap="round"/>`, pivot: [60, 46]},
          body: `${LG("aerospace-ping-aero-ping-g", [[0, "#FFE27A"], [1, "#E8A82A"]])}
            <rect x="38" y="46" width="44" height="44" rx="12" fill="url(#aerospace-ping-aero-ping-g)" ${O}/>
            <path d="M44 56Q46 50 52 50" fill="none" stroke="#FFF6CC" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M40 80H80" stroke="#C88A1A" stroke-width="2" opacity=".55"/><rect x="54" y="90" width="12" height="7" rx="2" fill="#8A8EA0" ${O2}/>`,
          armL: {svg: `${LG("aerospace-ping-aero-ping-p", [[0, "#5A8AE8"], [1, "#2E5EB8"]], 0, 0, 1, 1)}<rect x="30" y="64" width="10" height="5" fill="#8A8EA0" ${O2}/><rect x="6" y="54" width="26" height="24" rx="3" fill="url(#aerospace-ping-aero-ping-p)" ${O}/><path d="M19 54V78M6 66H32" stroke="#BFD6FF" stroke-width="1.4"/>`, pivot: [38, 66]},
          armR: {svg: `<rect x="80" y="64" width="10" height="5" fill="#8A8EA0" ${O2}/><rect x="88" y="54" width="26" height="24" rx="3" fill="url(#aerospace-ping-aero-ping-p)" ${O}/><path d="M101 54V78M88 66H114" stroke="#BFD6FF" stroke-width="1.4"/>`, pivot: [82, 66]}
        },
        eyes: {lx: 52, rx: 68, y: 66, r: 4.6, style: "sparkle", color: "#2A2010"},
        mouth: {x: 60, y: 75, w: 2.8, color: "#2A2010"},
        cheeks: {lx: 45, rx: 75, y: 73.5, w: 3.8, h: 2.4, color: "#FF9A8A"},
        anchors: {top: [60, 22, 0.8], neck: [60, 90, 0.9], chest: [72, 84, 0.55], back: [60, 60, 0.75], hands: [60, 88, 0.8]},
        lines: {
          tap: ["Ping! Signal received: you're awesome!", "Beep boop! Orbiting with joy!", "Coverage is perfect today. Like you!", "Transmitting good vibes your way!", "Solar panels fully charged by your smile!", "Tracking your progress: excellent!", "Ping ping! Hello, Earth friend!"],
          pet: ["Beep! My antenna is all wiggly!", "Hehe! Signal strength: maximum happy!"],
          hello: ["Ping! Connection restored! Welcome back!", "Hi! I picked up your signal right away!"],
          morning: ["Good morning! Sunrise over the planet!", "Rise and shine! Panels soaking up light!"],
          night: ["Passing over the night side. Rest soon?", "Low power mode. Goodnight, Earth friend!"],
          focus: ["Locked on target. Focus mode.", "Steady orbit. You've got this."],
          done: ["PING PING PING! Mission success!", "Signal loud and clear: amazing session!"],
          task: ["Ping! DONE!", "Beep boop! Task complete!", "Signal sent: checked off! WOO!", "Transmission received! YES!"],
          break: ["Ground station break! Stretch!", "Recharging! Take a little break!"]
        }
      },
      {
        id: "aerospace-jett", name: "Jett", kind: "Jet Plane", pose: "float", wearColor: "#E8453E",
        bio: "Leaves a contrail smile across the sky.",
        idle: ["sway", "wingFlutter", "topBob"], cheer: "wingFlutter",
        parts: {
          back: `<path d="M18 104Q40 112 60 110Q80 112 102 104" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".7"/>`,
          top: {svg: `<path d="M52 44L58 18Q60 14 64 18L68 44Z" fill="#E8453E" ${O}/><path d="M60 22L62 40" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6"/>`, pivot: [60, 44]},
          wingL: {svg: `${LG("aerospace-jett-aero-jet-w", [[0, "#EEF2F8"], [1, "#B8C2D4"]])}<path d="M38 70L6 80Q2 82 6 86L38 82Z" fill="url(#aerospace-jett-aero-jet-w)" ${O}/><rect x="16" y="82" width="10" height="7" rx="3" fill="#8A8EA0" ${O2}/>`, pivot: [38, 76]},
          wingR: {svg: `<path d="M82 70L114 80Q118 82 114 86L82 82Z" fill="url(#aerospace-jett-aero-jet-w)" ${O}/><rect x="94" y="82" width="10" height="7" rx="3" fill="#8A8EA0" ${O2}/>`, pivot: [82, 76]},
          body: `${RG("aerospace-jett-aero-jet-b", [[0, "#FFFFFF"], [0.6, "#EEF2F8"], [1, "#B8C2D4"]], 0.42, 0.34, 0.75)}
            <ellipse cx="60" cy="72" rx="26" ry="28" fill="url(#aerospace-jett-aero-jet-b)" ${O}/>
            <path d="M36 58Q60 50 84 58" fill="none" stroke="#7AC0E8" stroke-width="6" stroke-linecap="round"/><path d="M36 58Q60 50 84 58" fill="none" stroke="${INK}" stroke-width="1.6" opacity=".25"/>
            <path d="M38 84Q60 94 82 84" fill="none" stroke="#E8453E" stroke-width="3.4" stroke-linecap="round"/>
            <circle cx="60" cy="98" r="5" fill="#3A3444" ${O2}/><circle cx="60" cy="98" r="1.8" fill="#C9CED8"/>
            <path d="M42 66Q44 60 50 58" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>`
        },
        eyes: {lx: 51, rx: 69, y: 70, r: 4.8, style: "sparkle", color: "#1A2A44"},
        mouth: {x: 60, y: 79, w: 3, color: "#1A2A44"},
        cheeks: {lx: 44, rx: 76, y: 77.5, w: 4, h: 2.5, color: "#FF9AB0"},
        anchors: {top: [60, 40, 0.85], neck: [60, 92, 0.9], chest: [72, 86, 0.55], back: [60, 60, 0.75], hands: [60, 92, 0.8]},
        lines: {
          tap: ["Vroom! Cleared for takeoff!", "Flying high with you today!", "Smooth skies ahead, captain!", "You're soaring! Look at that altitude!", "Drawing a contrail smile just for you!", "Tailwinds all the way!", "Wheee! Barrel roll of joy!"],
          pet: ["Wheee! That's a happy loop!", "Hehe! My wings are all wobbly!"],
          hello: ["Welcome aboard! Buckle up!", "Hi! Ready for departure?"],
          morning: ["Good morning! Clear skies today!", "Rise and shine! First flight of the day!"],
          night: ["Landing lights on. Rest soon?", "Parked at the gate. Goodnight!"],
          focus: ["Cruising altitude. Steady focus.", "Smooth flying. You've got this."],
          done: ["What a flight! Perfect landing!", "That session was sky-high amazing!"],
          task: ["Vroom! DONE!", "Wheels down! Checked off!", "Sky-high success! WOO!", "Contrail smile for that one! YES!"],
          break: ["Layover break! Stretch your wings!", "Refuel and relax! Water time!"]
        }
      }
    ]
  });
})();
