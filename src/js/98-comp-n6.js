/* ===== module: 98-comp-n6.js ===== */
/* Study Companions, batch n6 */
(() => {
  const {INK, O, OW, LG, RG, LINE} = COMP_KIT;
  const O2 = OW(2.2);

  /* ================= Movie Palace ================= */
  COMP_DATA.push({
    theme: "film",
    companions: [
      {
        id: "film-clappy", name: "Clappy", kind: "Clapperboard", pose: "stand", wearColor: "#E8C25A",
        bio: "A snappy little clapperboard who marks the start of every study take.",
        idle: ["topBob", "wave", "headTilt"], cheer: "bounce",
        neck: [60, 92],
        parts: {
          feet: `<rect x="44" y="100" width="9" height="9" rx="3" fill="#3A3444" ${O2}/><rect x="67" y="100" width="9" height="9" rx="3" fill="#3A3444" ${O2}/><ellipse cx="48.5" cy="109.5" rx="7.4" ry="3.6" fill="#E25A5A" ${O2}/><ellipse cx="71.5" cy="109.5" rx="7.4" ry="3.6" fill="#E25A5A" ${O2}/>`,
          body: `<rect x="46" y="88" width="28" height="14" rx="6" fill="#4A4458" ${O}/>`,
          armL: {svg: `<path d="M28 78L19.5 90.5" stroke="${INK}" stroke-width="7.6" stroke-linecap="round"/><path d="M28 78L19.5 90.5" stroke="#5A5468" stroke-width="4" stroke-linecap="round"/><circle cx="18.6" cy="92" r="4.6" fill="#5A5468" ${O2}/>`, pivot: [28, 78]},
          armR: {svg: `<path d="M92 78L100.5 90.5" stroke="${INK}" stroke-width="7.6" stroke-linecap="round"/><path d="M92 78L100.5 90.5" stroke="#5A5468" stroke-width="4" stroke-linecap="round"/><circle cx="101.4" cy="92" r="4.6" fill="#5A5468" ${O2}/>`, pivot: [92, 78]},
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
        bio: "A cozy popcorn bucket who pops a kernel every time something good happens.",
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
        bio: "A warm little spotlight who shines on all your hard work.",
        idle: ["sway", "sparkle", "headTilt"], cheer: "spin",
        neck: [60, 84],
        parts: {
          back: `${LG("film-spotty-film-spot-beam", [[0, "#FFF4C2", 0.9], [1, "#FFF4C2", 0]], 0, 0, 1, 0)}<path d="M84 46L118 26V86L84 70Z" fill="url(#film-spotty-film-spot-beam)"/>`,
          feet: `${LINE("M60 92L44 109M60 92L76 109M60 92V110", "#8A8EA0", 3)}<circle cx="44" cy="109.5" r="3.2" fill="#5A5E70" ${O2}/><circle cx="76" cy="109.5" r="3.2" fill="#5A5E70" ${O2}/><circle cx="60" cy="110" r="3.2" fill="#5A5E70" ${O2}/>`,
          body: `<rect x="53" y="80" width="14" height="14" rx="4" fill="#6A6E82" ${O}/><path d="M38 70Q38 84 60 84Q82 84 82 70" fill="none" stroke="${INK}" stroke-width="6.4" stroke-linecap="round"/><path d="M38 70Q38 84 60 84Q82 84 82 70" fill="none" stroke="#9A9EB2" stroke-width="3.2" stroke-linecap="round"/>`,
          armL: {svg: `<path d="M33 74L29 86" stroke="${INK}" stroke-width="7.6" stroke-linecap="round"/><path d="M33 74L29 86" stroke="#7E6BE6" stroke-width="4" stroke-linecap="round"/><circle cx="28.6" cy="88" r="4.4" fill="#FFF3D6" ${O2}/>`, pivot: [33, 74]},
          armR: {svg: `<path d="M87 74L91 86" stroke="${INK}" stroke-width="7.6" stroke-linecap="round"/><path d="M87 74L91 86" stroke="#7E6BE6" stroke-width="4" stroke-linecap="round"/><circle cx="91.4" cy="88" r="4.4" fill="#FFF3D6" ${O2}/>`, pivot: [87, 74]},
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
        bio: "A busy little whisk who whips up sweet ideas while you study.",
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
          armL: {svg: `<ellipse cx="35" cy="84" rx="4.8" ry="6.8" transform="rotate(20 35 84)" fill="#E59A5C" ${O}/>`, pivot: [40, 77]},
          armR: {svg: `<ellipse cx="85" cy="84" rx="4.8" ry="6.8" transform="rotate(-20 85 84)" fill="#E59A5C" ${O}/>`, pivot: [80, 77]}
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
        bio: "A puffy chef's hat who grows a little taller with every finished recipe.",
        idle: ["topBob", "sway", "headTilt"], cheer: "bounce",
        neck: [60, 86],
        parts: {
          feet: `<ellipse cx="49" cy="109.5" rx="7" ry="3.8" fill="#3A3444" ${O2}/><ellipse cx="71" cy="109.5" rx="7" ry="3.8" fill="#3A3444" ${O2}/>`,
          body: `<path d="M44 84H76L78 104Q78 108 74 108H46Q42 108 42 104Z" fill="#FFFFFF" ${O}/><path d="M60 86V106" stroke="#D8DEE6" stroke-width="2"/><circle cx="55" cy="93" r="1.6" fill="#C8D0DA"/><circle cx="55" cy="100" r="1.6" fill="#C8D0DA"/><path d="M50 84L60 92L70 84" fill="#E25A4A" ${O2}/>`,
          wingL: {svg: `<ellipse cx="37" cy="92" rx="4.8" ry="6.6" transform="rotate(30 37 92)" fill="#FFFFFF" ${O}/>`, pivot: [43, 89]},
          wingR: {svg: `<ellipse cx="83" cy="92" rx="4.8" ry="6.6" transform="rotate(-30 83 92)" fill="#FFFFFF" ${O}/>`, pivot: [77, 89]},
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
        bio: "A fresh little basil sprout who brings a bit of green to your desk.",
        idle: ["sway", "wave", "sparkle"], cheer: "hop",
        parts: {
          feet: `${LG("culinary-basil-cul-basil-pot", [[0, "#F09A6A"], [1, "#C8603A"]])}<path d="M38 88H82L78 108Q77.4 111 74 111H46Q42.6 111 42 108Z" fill="url(#culinary-basil-cul-basil-pot)" ${O}/><rect x="35" y="84" width="50" height="9" rx="4" fill="#E08A5A" ${O}/>`,
          top: {svg: `${LINE("M60 40V28", "#4E9A4A", 2.6)}<path d="M60 30C52 20 42 22 40 28C46 32 54 34 60 30Z" fill="#7CCB6A" ${O2}/><path d="M60 29C66 18 78 18 80 24C76 30 66 32 60 29Z" fill="#8FD878" ${O2}/><path d="M58 28Q50 25 44 27M62 27Q70 23 76 23.5" fill="none" stroke="#4E9A4A" stroke-width="1.4" stroke-linecap="round"/>`, pivot: [60, 40]},
          body: `${RG("culinary-basil-cul-basil-g", [[0, "#B8F0A0"], [0.55, "#7CCB6A"], [1, "#4E9A4A"]], 0.42, 0.35, 0.75)}
            <path d="M60 38C82 38 92 56 90 72C88 86 76 92 60 92C44 92 32 86 30 72C28 56 38 38 60 38Z" fill="url(#culinary-basil-cul-basil-g)" ${O}/>
            <path d="M60 40Q60 56 60 66" fill="none" stroke="#4E9A4A" stroke-width="1.8" stroke-linecap="round" opacity=".45"/>
            <path d="M40 54Q43 46 50 43" fill="none" stroke="#E2FFD2" stroke-width="3" stroke-linecap="round"/>`,
          armL: {svg: `<path d="M34 70C24 66 18 72 20 78C26 80 32 76 34 70Z" transform="rotate(-30 34 70)" fill="#8FD878" ${O}/>`, pivot: [34, 70]},
          armR: {svg: `<path d="M86 70C96 66 102 72 100 78C94 80 88 76 86 70Z" transform="rotate(30 86 70)" fill="#8FD878" ${O}/>`, pivot: [86, 70]}
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
        bio: "A tall, wavy kelp sprite who sways gently while you study.",
        idle: ["sway", "wave", "finWiggle"], cheer: "spin",
        parts: {
          tail: {svg: `<g transform="translate(0 -6)"><path d="M54 104C50 110 54 114 60 114C66 114 70 110 66 104" fill="#8A6A3A" ${O2}/><path d="M52 112L46 116M68 112L74 116M60 114V118" stroke="#8A6A3A" stroke-width="2.4" stroke-linecap="round"/></g>`, pivot: [60, 98]},
          body: `<g transform="translate(0 -6)">${LG("marinebio-kelpie-mar-kelp-g", [[0, "#B8D86A"], [0.5, "#86B44A"], [1, "#5E8A34"]], 0.2, 0, 0.8, 1)}${RG("marinebio-kelpie-mar-kelp-f", [[0, "#FFF2B0"], [1, "#E0A830"]], 0.4, 0.35, 0.7)}
            <path d="M60 28C70 30 76 38 78 46C82 50 77 54 80 60C84 66 78 70 81 76C84 84 78 88 79 94C76 104 66 106 60 106C54 106 44 104 41 94C42 88 36 84 39 76C42 70 36 66 40 60C43 54 38 50 42 46C44 38 50 30 60 28Z" fill="url(#marinebio-kelpie-mar-kelp-g)" ${O}/>
            <path d="M60 32Q58 66 60 102" fill="none" stroke="#4E7A2A" stroke-width="1.8" stroke-linecap="round" opacity=".5"/>
            <path d="M49 44Q46 52 49 58M71 44Q74 52 71 58M47 80Q44 88 48 96M73 80Q76 88 72 96" fill="none" stroke="#E2F6A8" stroke-width="2.2" stroke-linecap="round" opacity=".75"/>
            ${LINE("M60 28V22", "#86B44A", 2.4)}<circle cx="60" cy="16" r="8" fill="url(#marinebio-kelpie-mar-kelp-f)" ${O}/><circle cx="57.4" cy="13.4" r="2.2" fill="#fff"/>
            <circle cx="88" cy="40" r="2.4" fill="#fff" opacity=".85" ${OW(1.4)}/><circle cx="92" cy="31" r="1.6" fill="#fff" opacity=".85"/></g>`,
          armL: {svg: `<g transform="translate(-5 -6)"><g transform="rotate(-60 45 64)"><path d="M43 68C36 62 30 66 24 60C20 58 22 54 18 52C26 48 34 52 40 56C44 59 46 62 46 64Z" fill="#9CC85A" ${O}/><path d="M42 63Q32 57 24 55" fill="none" stroke="#5E8A34" stroke-width="1.3" stroke-linecap="round"/></g></g>`, pivot: [40, 58]},
          armR: {svg: `<g transform="translate(5 -6)"><g transform="rotate(60 75 64)"><path d="M77 68C84 62 90 66 96 60C100 58 98 54 102 52C94 48 86 52 80 56C76 59 74 62 74 64Z" fill="#9CC85A" ${O}/><path d="M78 63Q88 57 96 55" fill="none" stroke="#5E8A34" stroke-width="1.3" stroke-linecap="round"/></g></g>`, pivot: [80, 58]}
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
        bio: "A brave little submarine who dives deep into any subject with you.",
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
          wingL: {svg: `<path d="M44 94L36 106L50 104L54 96Z" fill="#E8A82A" ${O}/>`, pivot: [48, 96]},
          wingR: {svg: `<path d="M78 94L88 106L74 104L70 96Z" fill="#E8A82A" ${O}/>`, pivot: [74, 96]}
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
        bio: "A playful dolphin calf who clicks happily when you finish a chapter.",
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
          wingL: {svg: `<g transform="translate(0 -3)"><path d="M34 82C26 84 22 92 24 98C30 96 36 90 38 86Z" fill="#6E9AC8" ${O}/></g>`, pivot: [36, 81]},
          wingR: {svg: `<g transform="translate(0 -3)"><path d="M84 82C92 84 96 92 94 98C88 96 82 90 80 86Z" fill="#6E9AC8" ${O}/></g>`, pivot: [82, 81]}
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

})();
/* end of module 98-comp-n6.js */




