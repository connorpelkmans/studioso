/* Study Companions, batch n4: nightmarket, diadelosmuertos, holi, ramadan, midautumn */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const twinkle = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${c || "#fff"}"/>`;
  const f1 = v => Math.round(v * 10) / 10;
  const ring = (cx, cy, n, r, fn) => Array.from({length: n}, (_, i) => { const a = i / n * Math.PI * 2; return fn(f1(cx + Math.cos(a) * r), f1(cy + Math.sin(a) * r), a * 180 / Math.PI, i); }).join("");
  const star = (cx, cy, R, r, n) => { let d = ""; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; d += (i ? "L" : "M") + f1(cx + q * Math.cos(a)) + " " + f1(cy + q * Math.sin(a)); } return d + "Z"; };

  /* ================= Night Market ================= */
  COMP_DATA.push({
    theme: "nightmarket",
    companions: [
      {
        id: "nightmarket-tai", name: "Tai", kind: "Taiyaki Fish", pose: "float", wearColor: "#E8483A",
        bio: "Filled with red bean and good intentions.",
        idle: ["finWiggle", "topBob", "bounce"], cheer: "hop",
        parts: {
          tail: {svg: `${LG("nightmarket-tai-t", [[0, "#F6C470"], [1, "#C8782E"]])}
            <path d="M88 70L106 50Q111 48 110 54L104 72L110 90Q111 96 106 94L88 76Z" fill="url(#nightmarket-tai-t)" ${O}/>
            <path d="M95 64L104 56M95 80L104 88" stroke="#B0602A" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [90, 73]},
          armL: {svg: `<path d="M46 92Q40 104 50 104Q56 100 54 92Z" fill="#E8A44A" ${O}/>`, pivot: [50, 92]},
          armR: {svg: `<path d="M70 94Q72 106 80 102Q82 96 76 92Z" fill="#E8A44A" ${O}/>`, pivot: [74, 93]},
          body: `${LG("nightmarket-tai-g", [[0, "#FFE0A0"], [0.55, "#F2B45E"], [1, "#D2822E"]], 0, 0, 0.3, 1)}
            <path d="M14 72C14 50 34 38 56 40L80 44Q92 50 92 73Q92 96 80 102L56 106C34 108 14 94 14 72Z" fill="url(#nightmarket-tai-g)" ${O}/>
            <path d="M60 46Q50 54 52 64M68 50Q60 58 62 68M60 100Q50 92 52 82M70 96Q62 90 64 80" fill="none" stroke="#C47A30" stroke-width="2" stroke-linecap="round" opacity=".7"/>
            <path d="M76 56Q84 64 82 74Q80 86 72 92" fill="none" stroke="#B8682A" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M22 60Q26 50 36 47" fill="none" stroke="#FFF4D2" stroke-width="3.4" stroke-linecap="round"/><circle cx="20" cy="68" r="2" fill="#FFF4D2"/>
            <path d="M84 60Q88 66 87 72" fill="none" stroke="#FFF0C8" stroke-width="2" stroke-linecap="round" opacity=".8"/>`,
          top: {svg: `${LINE("M36 38Q30 30 36 24Q42 18 36 10", "#FFFFFF", 3)}${LINE("M48 36Q44 30 48 25", "#FFFFFF", 2.6)}`, pivot: [40, 40]}
        },
        eyes: {lx: 30, rx: 48, y: 70, r: 5, style: "sparkle", color: "#3A2014"},
        mouth: {x: 39, y: 81, w: 3, color: "#3A2014"},
        cheeks: {lx: 23, rx: 55, y: 79, w: 4.2, h: 2.6, color: "#FF8A7A"},
        anchors: {top: [40, 42, 0.85], neck: [52, 98, 0.95], chest: [62, 90, 0.66], back: [80, 52, 0.8], hands: [60, 100, 0.85]},
        lines: {
          tap: ["Fresh off the griddle and ready to help!", "Warm, crispy and cheering you on!", "Red bean power, activate!", "You're doing great, one bite at a time!", "Every page is a little treat!", "Swim through it! You've got this!", "Golden on the outside, proud on the inside!", "Another stall, another win for you!"],
          pet: ["Hehe! I'm all toasty now!", "Careful, I might crumble with joy!"],
          hello: ["You're here! The market just lit up!", "Hi hi! Saved you the warmest taiyaki!"],
          morning: ["Good morning! The griddle's already warm!", "Rise and shine! Breakfast treats await!"],
          night: ["The lanterns are glowing. Rest soon?", "The stalls are closing up. Sleep sweet!"],
          focus: ["Sizzling quietly beside you. Go go!", "Heads down, tails up! We've got this!"],
          done: ["What a session! Perfectly golden!", "All done! Crispy, warm and wonderful!"],
          task: ["DONE! Fresh off the griddle!", "Yum! That one was delicious!", "Checked off! Red bean high five!", "Woohoo! Another tasty win!"],
          break: ["Snack break! You earned a treat!", "Stretch time! Wiggle those fins!"]
        }
      },
      {
        id: "nightmarket-finny", name: "Finny", kind: "Goldfish in a Bag", pose: "float", wearColor: "#5AB8E8",
        bio: "Has a great view of the whole market.",
        idle: ["finWiggle", "sway", "sparkle"], cheer: "spin",
        parts: {
          back: `${LG("nightmarket-finny-bag", [[0, "#F2FBFF", 0.95], [1, "#A8DCF2", 0.9]])}${LG("nightmarket-finny-w", [[0, "#9EDCF6"], [1, "#5AB4E2"]])}
            <path d="M48 20Q60 26 72 20L70 14Q60 17 50 14Z" fill="#FF8FB3" ${O2}/><path d="M55 14Q60 4 65 14" fill="none" stroke="${INK}" stroke-width="5.6" stroke-linecap="round"/><path d="M55 14Q60 4 65 14" fill="none" stroke="#FF8FB3" stroke-width="3" stroke-linecap="round"/>
            <path d="M49 21Q24 38 24 70Q24 108 60 108Q96 108 96 70Q96 38 71 21Z" fill="url(#nightmarket-finny-bag)" ${O}/>
            <path d="M25.4 62Q60 54 94.6 62Q96 70 95 78Q92 106 60 106Q28 106 25 78Q24 70 25.4 62Z" fill="url(#nightmarket-finny-w)" opacity=".75"/>
            <path d="M28 63Q60 56 92 63" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity=".8"/>`,
          tail: {svg: `<path d="M74 80L92 66Q96 72 90 80Q96 88 92 94Z" fill="#FFB07A" ${O}/><path d="M80 78L90 72M80 82L90 88" stroke="#F2602E" stroke-width="1.4" stroke-linecap="round" opacity=".6"/>`, pivot: [76, 80]},
          body: `${RG("nightmarket-finny-g", [[0, "#FFE0B0"], [0.5, "#FF9A50"], [1, "#E8502A"]], 0.4, 0.35, 0.75)}
            <path d="M34 80C34 66 50 60 64 64C76 68 80 74 78 80C80 86 76 92 64 96C50 100 34 94 34 80Z" fill="url(#nightmarket-finny-g)" ${O}/>
            <path d="M52 64Q58 56 66 60Q62 64 60 66Z" fill="#FFB07A" ${OW(2)}/>
            <path d="M54 94Q58 102 66 98Q62 94 60 93Z" fill="#FFB07A" ${OW(2)}/>
            <path d="M40 74Q44 68 50 67" fill="none" stroke="#FFF2DA" stroke-width="2.6" stroke-linecap="round"/>`,
          face: `<circle cx="84" cy="50" r="3" fill="#fff" opacity=".9"/><circle cx="80" cy="42" r="2" fill="#fff" opacity=".9"/><circle cx="86" cy="36" r="1.4" fill="#fff" opacity=".8"/>
            <path d="M32 44Q28 54 29 62" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".85"/>`
        },
        eyes: {lx: 46, rx: 60, y: 78, r: 4.4, style: "sparkle", color: "#3A1A14"},
        mouth: {x: 53, y: 86.5, w: 2.6, color: "#3A1A14"},
        cheeks: {lx: 40, rx: 66, y: 85, w: 3.6, h: 2.2, color: "#FF6A6A"},
        anchors: {top: [60, 14, 0.8], neck: [60, 104, 0.9], chest: [72, 98, 0.6], back: [90, 50, 0.8], hands: [56, 100, 0.8]},
        lines: {
          tap: ["Blub! Hi there, superstar!", "I can see the whole market from here!", "Just keep swimming through those notes!", "You're making waves today!", "Bubble of encouragement for you! Blub!", "Round and round, and you're still shining!", "Best seat in the market, right next to you!", "Fin-tastic work so far!"],
          pet: ["Blub blub! That tickles the bag!", "Hehe, careful, don't spill me!"],
          hello: ["Blub! You're back! I waved my fins!", "Hi! I've been watching for you!"],
          morning: ["Good morning! Fresh water, fresh start!", "Blub! The market's waking up with you!"],
          night: ["The lanterns look so pretty. Sleep soon?", "Bubbles are getting slow. Bedtime?"],
          focus: ["Floating quietly beside you. Blub.", "Calm water, calm mind. You've got this."],
          done: ["Blub blub! What a splash of a session!", "Done! I did a happy loop for you!"],
          task: ["BLUB! Done and done!", "Splash! That one's finished!", "Checked off! Happy fin flaps!", "Yes! You caught that one!"],
          break: ["Bubble break! Sip some water!", "Swim around a little! Stretch time!"]
        }
      },
      {
        id: "nightmarket-shiny", name: "Shiny", kind: "Candy Apple", pose: "stand", wearColor: "#7AC86A",
        bio: "Glossy, crunchy and a little bit sticky.",
        idle: ["topBob", "sparkle", "sway"], cheer: "bounce",
        parts: {
          feet: `${LINE("M60 92V106", "#F2DFB8", 4)}<path d="M44 106H76Q78 112 72 112H48Q42 112 44 106Z" fill="#C98A56" ${O2}/>`,
          armL: {svg: `<ellipse cx="30" cy="70" rx="5" ry="6.6" transform="rotate(30 30 70)" fill="#E8483A" ${O}/>`, pivot: [36, 66]},
          armR: {svg: `<ellipse cx="90" cy="70" rx="5" ry="6.6" transform="rotate(-30 90 70)" fill="#E8483A" ${O}/>`, pivot: [84, 66]},
          body: `${RG("nightmarket-shiny-g", [[0, "#FFB0A0"], [0.45, "#F2443A"], [1, "#B0182A"]], 0.36, 0.3, 0.75)}
            <path d="M60 38C52 32 32 33 30 54C28 74 40 92 52 94Q60 92 68 94C80 92 92 74 90 54C88 33 68 32 60 38Z" fill="url(#nightmarket-shiny-g)" ${O}/>
            <path d="M40 50Q42 42 50 40" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".9"/><circle cx="38" cy="58" r="2.2" fill="#fff" opacity=".9"/>
            <path d="M36 82Q48 92 60 90Q72 92 84 82" fill="none" stroke="#FFC8C0" stroke-width="2" stroke-linecap="round" opacity=".6"/>
            <path d="M82 46Q86 50 85 56" fill="none" stroke="#FFD0C8" stroke-width="2" stroke-linecap="round" opacity=".7"/>`,
          top: {svg: `${LINE("M60 38Q59 30 62 25", "#8A5A2A", 2.6)}<path d="M62 28C66 20 76 19 80 23C76 30 68 32 62 28Z" fill="#7AC86A" ${O2}/><path d="M64 27Q71 24 77 23" fill="none" stroke="#4E9A44" stroke-width="1.4" stroke-linecap="round"/>`, pivot: [60, 38]}
        },
        eyes: {lx: 50, rx: 70, y: 62, r: 5, style: "sparkle", color: "#3A1418"},
        mouth: {x: 60, y: 72, w: 3.2, color: "#3A1418"},
        cheeks: {lx: 42, rx: 78, y: 70, w: 4.4, h: 2.8, color: "#FF8FA8"},
        anchors: {top: [60, 38, 0.95], neck: [60, 88, 1], chest: [72, 82, 0.66], back: [86, 50, 0.8], hands: [60, 84, 0.86]},
        lines: {
          tap: ["Hi! I'm extra shiny today, just like you!", "Sweet work! Keep it crunchy!", "Glossy notes, happy brain!", "You make studying look delicious!", "A little sticky, a lot proud of you!", "Crunch through that chapter!", "Shine on, superstar!", "Sugar-coated cheers coming your way!"],
          pet: ["Hehe! Now your hands are sticky!", "Aww, I'm blushing extra red!"],
          hello: ["You're back! Shiny and ready!", "Hi hi! I polished myself just for you!"],
          morning: ["Good morning! Fresh and crunchy!", "Rise and shine! Let's make today sweet!"],
          night: ["Even candy apples need sleep. Rest soon?", "The market's glowing. Cozy dreams!"],
          focus: ["Standing tall right beside you!", "Quiet, glossy support. You've got this!"],
          done: ["What a sweet session! So proud!", "All done! That was candy-coated awesome!"],
          task: ["CRUNCH! Done!", "Sweet! Checked off!", "That one's finished! Shine on!", "Yes! A glossy little victory!"],
          break: ["Snack break! Something sweet?", "Stretch time! Wiggle that stick!"]
        }
      }
    ]
  });

  /* ================= Dia de los Muertos ================= */
  COMP_DATA.push({
    theme: "diadelosmuertos",
    companions: [
      {
        id: "diadelosmuertos-dulce", name: "Dulce", kind: "Sugar Skull Sprite", pose: "float", wearColor: "#2EC4D0",
        bio: "Decorated with icing flowers and a big smile.",
        idle: ["topBob", "sparkle", "headTilt"], cheer: "spin",
        neck: [60, 84],
        parts: {
          armL: {svg: `<ellipse cx="36" cy="94" rx="5" ry="6.6" transform="rotate(30 36 94)" fill="#F7F0FA" ${O}/>`, pivot: [42, 91]},
          armR: {svg: `<ellipse cx="84" cy="94" rx="5" ry="6.6" transform="rotate(-30 84 94)" fill="#F7F0FA" ${O}/>`, pivot: [78, 91]},
          body: `${LG("diadelosmuertos-dulce-b", [[0, "#FF7AB4"], [1, "#C8367E"]])}
            <path d="M44 84Q60 78 76 84L84 106Q60 114 36 106Z" fill="url(#diadelosmuertos-dulce-b)" ${O}/>
            <path d="M38 102Q60 108 82 102" fill="none" stroke="#FFD23A" stroke-width="2.6"/>
            <path d="M42 96Q60 100 78 96" fill="none" stroke="#2EC4D0" stroke-width="2.4"/>
            <circle cx="50" cy="90" r="1.8" fill="#FFF4FA"/><circle cx="60" cy="88" r="1.8" fill="#FFF4FA"/><circle cx="70" cy="90" r="1.8" fill="#FFF4FA"/>`,
          head: `${RG("diadelosmuertos-dulce-h", [[0, "#FFFFFF"], [0.7, "#F7F0FA"], [1, "#E2D2EA"]], 0.38, 0.3, 0.8)}
            <path d="M28 52C28 30 42 20 60 20C78 20 92 30 92 52C92 66 86 74 78 77V84Q60 90 42 84V77C34 74 28 66 28 52Z" fill="url(#diadelosmuertos-dulce-h)" ${O}/>
            <path d="M36 36Q40 28 50 25" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>`,
          face: `<circle cx="47" cy="55" r="10" fill="#2EC4D0" ${OW(2.2)}/><circle cx="73" cy="55" r="10" fill="#F27BA6" ${OW(2.2)}/>
            ${ring(47, 55, 8, 12.6, (x, y) => `<circle cx="${x}" cy="${y}" r="1.3" fill="#FFB23A"/>`)}${ring(73, 55, 8, 12.6, (x, y) => `<circle cx="${x}" cy="${y}" r="1.3" fill="#9A5AE0"/>`)}
            <path d="M60 70l-3 -3.6a1.8 1.8 0 0 1 3 -.6a1.8 1.8 0 0 1 3 .6z" fill="#F27BA6" ${OW(1.2)}/>
            <path d="M50 79v4M55 80v4.4M60 80.4v4.4M65 80v4.4M70 79v4" stroke="#C8B8D0" stroke-width="1.6" stroke-linecap="round"/>
            <circle cx="34" cy="44" r="1.6" fill="#3FC27A"/><circle cx="86" cy="44" r="1.6" fill="#3FC27A"/><circle cx="36" cy="66" r="1.4" fill="#FF9A2E"/><circle cx="84" cy="66" r="1.4" fill="#FF9A2E"/>`,
          top: {svg: `${["#FF9A2E", "#FFD23A", "#FF5FA2", "#FFD23A", "#FF9A2E"].map((c, i) => { const x = 38 + i * 11, y = 26 - Math.sin(i / 4 * Math.PI) * 6; return `<g>${ring(x, y, 7, 4.2, (px, py) => `<circle cx="${px}" cy="${py}" r="2.8" fill="${c}" ${OW(1.2)}/>`)}<circle cx="${x}" cy="${f1(y)}" r="2.6" fill="#E06A10" ${OW(1)}/></g>`; }).join("")}
            <path d="M33 30Q30 24 34 20M87 30Q90 24 86 20" fill="none" stroke="#3E8E52" stroke-width="2.6" stroke-linecap="round"/>`, pivot: [60, 30]}
        },
        eyes: {lx: 47, rx: 73, y: 56, r: 5, style: "sparkle", color: "#2B1A2E"},
        mouth: {x: 60, y: 75, w: 3.6, color: "#2B1A2E"},
        cheeks: {lx: 38, rx: 82, y: 70, w: 3.6, h: 2.2, color: "#FF8FB8"},
        anchors: {top: [60, 22, 1], neck: [60, 86, 0.95], chest: [70, 96, 0.66], back: [86, 74, 0.8], hands: [60, 98, 0.85]},
        lines: {
          tap: ["¡Hola! I iced a flower just for you!", "Sweet as sugar, sharp as a pencil!", "Your memory is getting stronger!", "Every page you study is worth remembering!", "Look at you go! So colourful!", "A big sugary smile for your hard work!", "Remember: you're doing amazing!", "Marigolds, candles and you, all glowing!"],
          pet: ["Hehe! Careful, my icing tickles!", "Aww, so sweet! Sweeter than me!"],
          hello: ["¡Hola! You're back! My flowers bloomed!", "Hi friend! I saved you a marigold!"],
          morning: ["¡Buenos días! Fresh flowers for a fresh day!", "Good morning! Let's make today bright!"],
          night: ["The candles are glowing soft. Rest soon?", "¡Buenas noches! Sweet dreams, friend."],
          focus: ["Quiet and sweet, right beside you.", "Smiling softly while you work!"],
          done: ["¡Qué bien! What a lovely session!", "All done! That deserves a fiesta!"],
          task: ["¡SÍ! Done!", "Checked off! Sugar-sweet work!", "Another one done! ¡Bravo!", "Woohoo! Iced and finished!"],
          break: ["Break time! Have a little treat!", "Stretch and smile! You earned it!"]
        }
      },
      {
        id: "diadelosmuertos-xolo", name: "Xolo", kind: "Xolo Pup", pose: "sit", wearColor: "#F48A1C",
        bio: "A hairless pup with a big heart and bigger ears.",
        idle: ["earTwitch", "tailSwish", "headTilt"], cheer: "hop",
        neck: [60, 74],
        parts: {
          tail: {svg: `${LINE("M84 100Q100 98 104 84Q106 76 102 72", "#5A5468", 3.6)}`, pivot: [84, 100]},
          feet: `<ellipse cx="46" cy="108" rx="8" ry="4.4" fill="#5A5468" ${O}/><ellipse cx="74" cy="108" rx="8" ry="4.4" fill="#5A5468" ${O}/>`,
          body: `${LG("diadelosmuertos-xolo-b", [[0, "#7A7488"], [1, "#4A4458"]])}
            <path d="M60 70C78 70 86 84 86 96C86 106 78 110 60 110C42 110 34 106 34 96C34 84 42 70 60 70Z" fill="url(#diadelosmuertos-xolo-b)" ${O}/>
            <ellipse cx="60" cy="96" rx="12" ry="10" fill="#9A94A8" opacity=".6"/>
            <path d="M44 74Q60 82 76 74L74 82Q60 88 46 82Z" fill="#F48A1C" ${OW(2)}/>
            <circle cx="60" cy="86" r="5" fill="#FFC22A" ${OW(1.8)}/><circle cx="60" cy="86" r="2" fill="#E06A10"/>`,
          earL: {svg: `<path d="M38 46L22 16Q20 8 28 10L50 34Z" fill="#5A5468" ${O}/><path d="M38 40L29 18L45 34Z" fill="#E2A0B0"/>`, pivot: [42, 40]},
          earR: {svg: `<path d="M82 46L98 16Q100 8 92 10L70 34Z" fill="#5A5468" ${O}/><path d="M82 40L91 18L75 34Z" fill="#E2A0B0"/>`, pivot: [78, 40]},
          head: `${LG("diadelosmuertos-xolo-h", [[0, "#857F94"], [1, "#55505F"]])}
            <path d="M60 30C80 30 90 44 88 58C86 72 76 78 60 78C44 78 34 72 32 58C30 44 40 30 60 30Z" fill="url(#diadelosmuertos-xolo-h)" ${O}/>
            <path d="M46 64Q46 56 60 56Q74 56 74 64Q74 76 60 76Q46 76 46 64Z" fill="#A8A2B8" ${OW(2)}/>
            <path d="M54 30Q56 22 60 26Q62 20 66 28" fill="#3A3646" ${OW(2)}/>
            <path d="M40 42Q44 36 50 35" fill="none" stroke="#A8A2B8" stroke-width="2.6" stroke-linecap="round"/>`,
          face: `<path d="M57 70Q57 78 61 78Q65 78 64 70Z" fill="#FF8FA8" ${OW(1.6)}/><path d="M60.5 71V75" stroke="#E0607A" stroke-width="1" stroke-linecap="round"/><ellipse cx="60" cy="61" rx="4.6" ry="3.4" fill="#2B2233"/><circle cx="58.6" cy="60" r="1.1" fill="#fff" opacity=".7"/>`
        },
        eyes: {lx: 48, rx: 72, y: 52, r: 4.8, style: "round", color: "#1E1A28"},
        mouth: {x: 60, y: 67.5, w: 3.4, color: "#1E1A28"},
        cheeks: {lx: 40, rx: 80, y: 62, w: 4, h: 2.4, color: "#FF9AB8"},
        anchors: {top: [60, 30, 0.95], neck: [60, 78, 1], chest: [72, 94, 0.66], back: [84, 86, 0.8], hands: [60, 98, 0.86]},
        lines: {
          tap: ["Woof! Hi hi hi! I'm so happy you're here!", "My ears are up! That means I'm listening!", "You're my favourite study buddy!", "Good human! Great studying!", "Tail wags for every page you read!", "I'll guard your focus. Nobody gets past!", "Sniff sniff. Smells like success!", "Big ears, big heart, big cheers for you!"],
          pet: ["Hehe! Ear scratches are the best!", "Woof! More pats please!"],
          hello: ["WOOF! You're back! Happy zoomies!", "Hi friend! I waited by the door!"],
          morning: ["Good morning! Walkies and studying!", "Woof! The sun's up and so are we!"],
          night: ["Yawn... curl-up time soon?", "Cozy blanket time. Goodnight!"],
          focus: ["Lying quietly at your feet. Go!", "On guard! You keep working!"],
          done: ["WOOF! What a good session!", "All done! Best human ever!"],
          task: ["Woof! DONE!", "Fetch! Another one finished!", "Checked off! Tail wags!", "Yes! Good job, good job!"],
          break: ["Walk break! Stretch those legs!", "Play time! Then back to it!"]
        }
      },
      {
        id: "diadelosmuertos-cempa", name: "Cempa", kind: "Marigold Sprite", pose: "stand", wearColor: "#3E8E52",
        bio: "A bright orange bloom that lights the way.",
        idle: ["sway", "sparkle", "topBob"], cheer: "spin",
        parts: {
          feet: `${LINE("M60 88V104", "#3E8E52", 4)}<path d="M60 102Q46 94 38 100Q46 110 60 104Z" fill="#5EA860" ${O2}/><path d="M60 102Q74 94 82 100Q74 110 60 104Z" fill="#5EA860" ${O2}/>`,
          armL: {svg: `<path d="M38 80Q24 76 20 86Q30 92 40 84Z" fill="#5EA860" ${O}/>`, pivot: [40, 82]},
          armR: {svg: `<path d="M82 80Q96 76 100 86Q90 92 80 84Z" fill="#5EA860" ${O}/>`, pivot: [80, 82]},
          body: `${RG("diadelosmuertos-cempa-o", [[0, "#FFC85A"], [1, "#F07A10"]], 0.5, 0.5, 0.6)}${RG("diadelosmuertos-cempa-y", [[0, "#FFF0A0"], [1, "#FFB81E"]], 0.45, 0.4, 0.6)}
            ${ring(60, 58, 14, 25, (x, y, a) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="8" transform="rotate(${f1(a)} ${x} ${y})" fill="url(#diadelosmuertos-cempa-o)" ${OW(2.2)}/>`)}
            ${ring(60, 58, 11, 15, (x, y, a) => `<ellipse cx="${x}" cy="${y}" rx="10" ry="7.4" transform="rotate(${f1(a + 15)} ${x} ${y})" fill="url(#diadelosmuertos-cempa-y)" ${OW(1.8)}/>`)}
            <circle cx="60" cy="58" r="20" fill="url(#diadelosmuertos-cempa-y)"/>
            <path d="M46 46Q50 40 58 39" fill="none" stroke="#FFFBE0" stroke-width="3" stroke-linecap="round"/>`,
          top: {svg: `${LINE("M60 30Q58 22 62 16", "#3E8E52", 2.4)}<path d="M62 19C66 12 74 12 77 15C73 21 67 22 62 19Z" fill="#5EA860" ${O2}/>`, pivot: [60, 32]}
        },
        eyes: {lx: 51, rx: 69, y: 57, r: 4.6, style: "sparkle", color: "#3A1A08"},
        mouth: {x: 60, y: 66, w: 3, color: "#3A1A08"},
        cheeks: {lx: 44, rx: 76, y: 64, w: 3.8, h: 2.4, color: "#FF7A6A"},
        anchors: {top: [60, 30, 0.9], neck: [60, 84, 0.9], chest: [70, 76, 0.6], back: [86, 50, 0.8], hands: [60, 88, 0.8]},
        lines: {
          tap: ["Hi! I'm lighting up your way today!", "Bloom where you study!", "Your ideas are as bright as my petals!", "Follow the petals, you'll find the answer!", "Golden-orange cheers for you!", "Every page is a petal on your path!", "Shine on! Brighter every day!", "You make this whole street glow!"],
          pet: ["Hehe! My petals are fluttering!", "Aww, I'm blooming with joy!"],
          hello: ["You're here! I bloomed extra bright!", "Hi friend! Follow me, this way!"],
          morning: ["Good morning! Petals open, let's go!", "Rise and bloom! It's a bright day!"],
          night: ["My petals are closing. Rest soon?", "The candles will keep watch. Goodnight!"],
          focus: ["Glowing softly beside you!", "Lighting your path quietly. Go go!"],
          done: ["What a blooming great session!", "All done! You lit up the whole path!"],
          task: ["DONE! A whole bouquet of wins!", "Bloom! Checked off!", "Another petal on your path!", "Yes! Bright and finished!"],
          break: ["Sunshine break! Stretch up tall!", "Water break! Flowers need it too!"]
        }
      }
    ]
  });

  /* ================= Holi ================= */
  COMP_DATA.push({
    theme: "holi",
    companions: [
      {
        id: "holi-puffy", name: "Puffy", kind: "Color Powder Puff", pose: "float", wearColor: "#9A5AE0",
        bio: "Leaves a little rainbow wherever it lands.",
        idle: ["bounce", "sparkle", "topBob"], cheer: "spin",
        parts: {
          armL: {svg: `<circle cx="28" cy="80" r="6.4" fill="#FFC62A" ${O}/>`, pivot: [34, 78]},
          armR: {svg: `<circle cx="92" cy="80" r="6.4" fill="#4AC8F0" ${O}/>`, pivot: [86, 78]},
          body: `${LG("holi-puffy-g", [[0, "#FF8AC8"], [0.35, "#FFB0D8"], [0.65, "#C8A6FF"], [1, "#7AC8F8"]], 0, 0, 1, 1)}
            <path d="${puff(60, 72, 32, 11, 1.18)}" fill="url(#holi-puffy-g)" ${O}/>
            <circle cx="44" cy="58" r="9" fill="#FFE07A" opacity=".55"/><circle cx="78" cy="88" r="10" fill="#6AE0A8" opacity=".5"/><circle cx="80" cy="56" r="7" fill="#FF7AB8" opacity=".45"/>
            <path d="M38 56Q42 48 50 46" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>
            <circle cx="22" cy="104" r="3" fill="#FF4A9A"/><circle cx="96" cy="106" r="2.6" fill="#2EC07A"/><circle cx="104" cy="96" r="1.8" fill="#FFC62A"/>`,
          top: {svg: `<path d="${puff(60, 34, 9, 7, 1.2)}" fill="#FFB0D8" ${O2}/><circle cx="57" cy="32" r="2" fill="#fff"/><circle cx="70" cy="24" r="3" fill="#FFE07A" ${OW(1.6)}/>`, pivot: [60, 42]}
        },
        eyes: {lx: 50, rx: 70, y: 72, r: 5, style: "sparkle", color: "#3A1A3A"},
        mouth: {x: 60, y: 82, w: 3.2, color: "#3A1A3A"},
        cheeks: {lx: 42, rx: 78, y: 80, w: 4.2, h: 2.6, color: "#FF6AA8"},
        anchors: {top: [60, 42, 0.95], neck: [60, 98, 1], chest: [72, 92, 0.66], back: [88, 62, 0.8], hands: [60, 100, 0.86]},
        lines: {
          tap: ["Poof! Hi! A little rainbow for you!", "You're bringing so much colour to today!", "Bright mind, bright day!", "Every page adds a new colour!", "Puff puff! You're doing great!", "Let's paint this chapter every colour!", "Happy, fluffy cheers for you!", "Sprinkle, sprinkle, here comes success!"],
          pet: ["Poof! Now your hands are rainbow!", "Hehe! I'm all fluffed up!"],
          hello: ["Poof! You're back! Colour time!", "Hi hi! I saved you some pink!"],
          morning: ["Good morning! Let's colour the day!", "Rise and shine! Rainbow mode on!"],
          night: ["My colours are getting sleepy. Rest soon?", "Soft and cozy now. Goodnight!"],
          focus: ["Floating quietly, cheering softly!", "Calm colours, calm mind. Go go!"],
          done: ["POOF! What a colourful session!", "All done! Rainbows everywhere!"],
          task: ["POOF! Done!", "Splash! Checked off!", "Another colour added! Yay!", "Yes! That one's painted bright!"],
          break: ["Colour break! Stretch and smile!", "Fluff up! Time for some water!"]
        }
      },
      {
        id: "holi-rang", name: "Rang", kind: "Rainbow Elephant Calf", pose: "stand", wearColor: "#FF4A9A",
        bio: "Painted in every color and very pleased about it.",
        idle: ["earTwitch", "tailSwish", "topBob"], cheer: "bounce",
        parts: {
          tail: {svg: `${LINE("M88 88Q100 86 102 96", "#9AA6C0", 2.6)}<path d="M100 94Q106 96 104 102Q98 100 100 94Z" fill="#FF4A9A" ${OW(1.6)}/>`, pivot: [88, 88]},
          feet: `<rect x="36" y="96" width="14" height="14" rx="5" fill="#A8B2CC" ${O}/><rect x="70" y="96" width="14" height="14" rx="5" fill="#A8B2CC" ${O}/>
            <path d="M38 106h10M72 106h10" stroke="#FFF2DA" stroke-width="2" stroke-linecap="round"/>`,
          earL: {svg: `${LG("holi-rang-e", [[0, "#C8D0E4"], [1, "#98A2BE"]])}<path d="M40 46C24 34 8 42 10 60C12 74 26 80 40 72Z" fill="url(#holi-rang-e)" ${O}/>
            <circle cx="22" cy="54" r="5" fill="#FFC62A" opacity=".85"/><circle cx="26" cy="66" r="4" fill="#2EC07A" opacity=".85"/><circle cx="16" cy="64" r="3" fill="#FF4A9A" opacity=".85"/>`, pivot: [40, 56]},
          earR: {svg: `<path d="M80 46C96 34 112 42 110 60C108 74 94 80 80 72Z" fill="url(#holi-rang-e)" ${O}/>
            <circle cx="98" cy="54" r="5" fill="#3A8AE8" opacity=".85"/><circle cx="94" cy="66" r="4" fill="#FF4A9A" opacity=".85"/><circle cx="104" cy="64" r="3" fill="#9A5AE0" opacity=".85"/>`, pivot: [80, 56]},
          body: `${LG("holi-rang-b", [[0, "#C8D0E4"], [1, "#9AA4C0"]])}
            <path d="M34 98C30 80 42 70 60 70C78 70 90 80 86 98Z" fill="url(#holi-rang-b)" ${O}/>
            <circle cx="46" cy="84" r="5" fill="#FF4A9A" opacity=".75"/><circle cx="74" cy="82" r="6" fill="#2EC07A" opacity=".7"/><circle cx="62" cy="92" r="4" fill="#FFC62A" opacity=".8"/>
            <path d="M60 30C80 30 88 44 86 58C84 70 74 76 60 76C46 76 36 70 34 58C32 44 40 30 60 30Z" fill="url(#holi-rang-b)" ${O}/>
            <path d="M60 62Q58 72 62 78Q67 82 71 77" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round"/><path d="M60 62Q58 72 62 78Q67 82 71 77" fill="none" stroke="#AEB8D0" stroke-width="6.6" stroke-linecap="round"/>
            <path d="M58.6 68h4M59.6 74h4" stroke="#8A94B0" stroke-width="1.4" stroke-linecap="round"/>
            <circle cx="44" cy="44" r="4" fill="#FF7AB8" opacity=".7"/><circle cx="78" cy="42" r="3.4" fill="#5AA0F0" opacity=".7"/>
            <path d="M42 40Q46 34 52 33" fill="none" stroke="#E4E8F2" stroke-width="2.6" stroke-linecap="round"/>`,
          top: {svg: `<path d="M50 32Q60 22 70 32L66 36Q60 32 54 36Z" fill="#FFC62A" ${O2}/><circle cx="60" cy="27" r="3.4" fill="#FF4A9A" ${OW(1.6)}/>${LINE("M60 24V16", "#FF8A1E", 2)}<circle cx="60" cy="14" r="3" fill="#2EC07A" ${OW(1.6)}/>`, pivot: [60, 34]}
        },
        eyes: {lx: 48, rx: 72, y: 54, r: 4.6, style: "sparkle", color: "#2A2440"},
        mouth: {x: 49, y: 68, w: 2.6, color: "#2A2440"},
        cheeks: {lx: 40, rx: 80, y: 62, w: 4, h: 2.4, color: "#FF7AB8"},
        anchors: {top: [60, 30, 0.95], neck: [60, 76, 1], chest: [72, 88, 0.62], back: [84, 80, 0.8], hands: [60, 94, 0.8]},
        lines: {
          tap: ["Toot! Hi! Look at all my colours!", "I'm painted for good luck, and so are you!", "Big ears, big ideas, big cheers!", "You're doing trunk-tastic!", "Every colour on me is a cheer for you!", "Stomp stomp! Look how far you've come!", "An elephant never forgets, and neither will you!", "You make my whole day colourful!"],
          pet: ["Toot toot! That tickles my ears!", "Hehe! More pats, please!"],
          hello: ["TOOT! You're back! Happy flaps!", "Hi friend! I painted a new spot today!"],
          morning: ["Good morning! Splash of water, then study!", "Toot! The sun's up and so am I!"],
          night: ["Big yawn... trunk's getting sleepy.", "Goodnight! I'll dream in colours."],
          focus: ["Quiet as an elephant can be. Go!", "Ears open, trunk still. You've got this."],
          done: ["TOOT TOOT! What a session!", "All done! Celebration splash!"],
          task: ["TOOT! Done!", "Stomp! Checked off!", "Another one! My ears are flapping!", "Yes! Trunk-tastic!"],
          break: ["Splash break! Water time!", "Stretch those legs! All four of them!"]
        }
      },
      {
        id: "holi-spritz", name: "Spritz", kind: "Water Splasher", pose: "stand", wearColor: "#3A8AE8",
        bio: "A little pump bottle that sprays colored water when you win.",
        idle: ["topBob", "wave", "bounce"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="50" cy="108.5" rx="7.4" ry="4.2" fill="#3A8AE8" ${O}/><ellipse cx="70" cy="108.5" rx="7.4" ry="4.2" fill="#3A8AE8" ${O}/>`,
          armL: {svg: `<ellipse cx="32" cy="74" rx="5" ry="7" transform="rotate(30 32 74)" fill="#8ADCFF" ${O}/>`, pivot: [38, 70]},
          armR: {svg: `<ellipse cx="88" cy="74" rx="5" ry="7" transform="rotate(-30 88 74)" fill="#8ADCFF" ${O}/>`, pivot: [82, 70]},
          body: `${LG("holi-spritz-b", [[0, "#E8F8FF"], [1, "#B8E4F8"]])}${LG("holi-spritz-w", [[0, "#FF8AC8"], [0.5, "#B07AF0"], [1, "#5AA0F0"]], 0, 0, 1, 0)}
            <path d="M48 44H72V50Q86 56 86 74V98Q86 108 76 108H44Q34 108 34 98V74Q34 56 48 50Z" fill="url(#holi-spritz-b)" ${O}/>
            <path d="M35 80Q60 74 85 80V98Q85 106 76 106H44Q35 106 35 98Z" fill="url(#holi-spritz-w)" opacity=".85"/>
            <path d="M36 80Q60 74 84 80" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/>
            <circle cx="48" cy="92" r="2.4" fill="#fff" opacity=".7"/><circle cx="70" cy="96" r="1.8" fill="#fff" opacity=".7"/><circle cx="62" cy="88" r="1.4" fill="#fff" opacity=".7"/>
            <path d="M40 64Q42 56 48 54" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
          top: {svg: `${LG("holi-spritz-t", [[0, "#FFE38A"], [1, "#E0A030"]])}<rect x="46" y="38" width="28" height="8" rx="3" fill="url(#holi-spritz-t)" ${O2}/>
            <rect x="55" y="24" width="10" height="15" rx="3" fill="url(#holi-spritz-t)" ${O2}/><path d="M52 22H72Q78 22 80 26L84 28V32L78 32Q76 30 72 30H52Q48 30 48 26Q48 22 52 22Z" fill="url(#holi-spritz-t)" ${O2}/>
            <circle cx="92" cy="26" r="2.4" fill="#FF4A9A"/><circle cx="98" cy="32" r="1.8" fill="#2EC07A"/><circle cx="96" cy="20" r="1.6" fill="#FFC62A"/>`, pivot: [60, 46]}
        },
        eyes: {lx: 50, rx: 70, y: 64, r: 4.6, style: "sparkle", color: "#1E2A48"},
        mouth: {x: 60, y: 73, w: 3, color: "#1E2A48"},
        cheeks: {lx: 43, rx: 77, y: 71, w: 3.8, h: 2.4, color: "#FF8AC8"},
        anchors: {top: [60, 22, 0.9], neck: [60, 80, 0.95], chest: [72, 88, 0.62], back: [86, 70, 0.8], hands: [60, 92, 0.86]},
        lines: {
          tap: ["Psssht! Hi! A tiny splash hello!", "Pump it up! You're doing great!", "Splish splash, look at you go!", "I'm full of colourful cheers!", "Keep going and I'll spray a rainbow!", "Fresh, bright and ready to help!", "One more page, one more splash!", "You're making a big splash today!"],
          pet: ["Hehe! Careful, I might squirt!", "Psssht! Happy little bubbles!"],
          hello: ["Splash! You're back!", "Hi hi! Pumped and ready!"],
          morning: ["Good morning! Fresh water, fresh start!", "Psssht! Rise and splash!"],
          night: ["Running low on bubbles. Bedtime?", "Goodnight! I'll refill for tomorrow."],
          focus: ["Holding my splash for later. Go!", "Quietly pumping cheers your way!"],
          done: ["SPLASH! What a session!", "All done! Rainbow spray for you!"],
          task: ["PSSSHT! Done!", "Splash! Checked off!", "Another one! Colour spray!", "Yes! Big splash for that one!"],
          break: ["Water break! Have a sip!", "Stretch time! Pump those arms!"]
        }
      }
    ]
  });

  /* ================= Ramadan Nights ================= */
  COMP_DATA.push({
    theme: "ramadan",
    companions: [
      {
        id: "ramadan-nuri", name: "Nuri", kind: "Fanous Lantern", pose: "float", wearColor: "#2A7A78",
        bio: "Its colored glass throws little stars on the walls.",
        idle: ["sway", "sparkle", "topBob"], cheer: "spin",
        parts: {
          armL: {svg: `<ellipse cx="30" cy="74" rx="4.6" ry="6.4" transform="rotate(30 30 74)" fill="#E2B04A" ${O}/>`, pivot: [36, 70]},
          armR: {svg: `<ellipse cx="90" cy="74" rx="4.6" ry="6.4" transform="rotate(-30 90 74)" fill="#E2B04A" ${O}/>`, pivot: [84, 70]},
          body: `${LG("ramadan-nuri-g", [[0, "#FFE9A0"], [1, "#D49A30"]])}${LG("ramadan-nuri-r", [[0, "#FFB080"], [1, "#E8463A"]])}${LG("ramadan-nuri-gr", [[0, "#A8F0C8"], [1, "#2EA86A"]])}${LG("ramadan-nuri-b", [[0, "#B8D0FF"], [1, "#3A6AD8"]])}
            <path d="M36 44H84L80 92H40Z" fill="url(#ramadan-nuri-g)" ${O}/>
            <path d="M39 48H46L47.6 88H43Z" fill="url(#ramadan-nuri-gr)" ${OW(2)}/><path d="M81 48H74L72.4 88H77Z" fill="url(#ramadan-nuri-b)" ${OW(2)}/>
            <path d="M46 48H74L72.4 88H47.6Z" fill="url(#ramadan-nuri-r)" ${OW(2.2)}/>
            <ellipse cx="60" cy="66" rx="16" ry="18" fill="#FFF6C0" opacity=".45"/>
            <path d="M50 52H53L52.6 84H50.4Z" fill="#fff" opacity=".55"/>
            <rect x="34" y="90" width="52" height="7" rx="2.4" fill="url(#ramadan-nuri-g)" ${O2}/>
            <path d="M38 97H82L66 106H54Z" fill="url(#ramadan-nuri-g)" ${O}/><circle cx="60" cy="108" r="2.6" fill="#E2B04A" ${O2}/>
            <path d="M44 100h32" stroke="#B8862E" stroke-width="1.6"/>`,
          top: {svg: `${RG("ramadan-nuri-d", [[0, "#FFF0B0"], [1, "#D49A30"]], 0.4, 0.35, 0.8)}
            <path d="M40 44Q40 26 60 24Q80 26 80 44Z" fill="url(#ramadan-nuri-d)" ${O}/><rect x="34" y="40" width="52" height="7" rx="2.4" fill="#E2B04A" ${O2}/>
            ${[44, 52, 60, 68, 76].map(x => `<circle cx="${x}" cy="43.5" r="1.4" fill="#8A5A1E"/>`).join("")}
            <circle cx="60" cy="16" r="5" fill="none" stroke="${INK}" stroke-width="5.6"/><circle cx="60" cy="16" r="5" fill="none" stroke="#E2B04A" stroke-width="2.6"/>
            <path d="M48 34Q52 28 58 27" fill="none" stroke="#FFF6D0" stroke-width="2.6" stroke-linecap="round"/>`, pivot: [60, 46]}
        },
        eyes: {lx: 53, rx: 67, y: 64, r: 3.8, style: "sparkle", color: "#3A1A10"},
        mouth: {x: 60, y: 73, w: 2.6, color: "#3A1A10"},
        cheeks: {lx: 47, rx: 73, y: 71, w: 3, h: 2, color: "#FFB0A0"},
        anchors: {top: [60, 22, 0.9], neck: [60, 94, 0.95], chest: [70, 84, 0.6], back: [84, 60, 0.8], hands: [60, 92, 0.86]},
        lines: {
          tap: ["Hello! I've got a little light for you!", "Every page you read makes me glow brighter!", "Look at the stars I'm throwing on the wall!", "Warm light, kind heart, clear mind!", "You're shining tonight!", "Little by little, the whole street lights up!", "Patience and light, that's the way!", "So glad to glow beside you!"],
          pet: ["Hehe! My glass panes are blushing!", "Aww, that makes my flame dance!"],
          hello: ["You're here! I just lit up!", "Welcome back! The lanterns missed you!"],
          morning: ["Good morning! Saving my glow for tonight!", "A bright new day! Let's begin gently."],
          night: ["The street is glowing. Rest well soon.", "Goodnight! I'll keep a little light on."],
          focus: ["Glowing quietly beside you.", "Steady light, steady mind. You've got this."],
          done: ["What a lovely session! I'm all aglow!", "All done! Stars on every wall for you!"],
          task: ["Done! A new light switched on!", "Checked off! Glowing proud!", "Another one! Little stars everywhere!", "Yes! Bright work!"],
          break: ["Rest your eyes a moment. Sip some water!", "Gentle stretch, then back to the light!"]
        }
      },
      {
        id: "ramadan-hilal", name: "Hilal", kind: "Crescent Moon Sprite", pose: "float", wearColor: "#F2C45A",
        bio: "Shows up right on time every evening.",
        idle: ["topBob", "sparkle", "headTilt"], cheer: "bounce",
        neck: [60, 92],
        parts: {
          body: `<path d="${puff(60, 97, 12, 8, 1.2)}" fill="#E6E8FA" ${O}/><circle cx="53" cy="95" r="2" fill="#fff"/>
            ${twinkle(30, 98, 3.4, "#F2C45A")}${twinkle(92, 104, 2.6, "#F2C45A")}`,
          head: `${RG("ramadan-hilal-g", [[0, "#FFFBE6"], [0.6, "#FFE48A"], [1, "#F0B830"]], 0.3, 0.4, 0.8)}
            <path d="M74 20C52 14 28 30 28 56C28 80 50 96 74 92C62 86 56 72 56 56C56 40 62 26 74 20Z" fill="url(#ramadan-hilal-g)" ${O}/>
            <path d="M40 40Q44 30 54 25" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/>
            <circle cx="40" cy="78" r="2" fill="#E8B030" opacity=".5"/><circle cx="34" cy="44" r="1.6" fill="#E8B030" opacity=".5"/>`,
          top: {svg: `${LINE("M74 22Q84 26 86 36", "#C8C0E0", 1.6)}<path d="${star(86, 42, 7.6, 3.4, 5)}" fill="#FFE27A" ${O2}/>`, pivot: [74, 22]}
        },
        eyes: {lx: 37, rx: 48, y: 57, r: 3.8, style: "dot", color: "#3A2A10"},
        mouth: {x: 42.5, y: 65.5, w: 2.6, color: "#3A2A10"},
        cheeks: {lx: 33, rx: 52, y: 63.5, w: 3, h: 1.8, color: "#FF9AB0"},
        anchors: {top: [52, 24, 0.8], neck: [56, 92, 0.85], chest: [62, 100, 0.55], back: [70, 70, 0.7], hands: [58, 100, 0.8]},
        lines: {
          tap: ["Good evening! Right on time, as always!", "I rise every night, and so do you!", "Small and bright, that's the way!", "Your effort shines like starlight!", "Patience grows into something full!", "A little glow, every single day!", "The stars are cheering with me!", "You're as steady as the moon!"],
          pet: ["Hehe! My tips are curling up!", "Aww, that's a warm, glowy feeling!"],
          hello: ["There you are! I was just rising!", "Welcome back! The sky is happy!"],
          morning: ["Good morning! I'm off to nap, you go shine!", "The sun's turn now. Have a bright day!"],
          night: ["My favourite time. But rest soon, okay?", "Goodnight! I'll watch over the sky."],
          focus: ["Glowing softly, right above you.", "Calm and quiet, like the night sky."],
          done: ["What a radiant session!", "All done! Full moon proud of you!"],
          task: ["Done! A new star appeared!", "Checked off! Glowing!", "Another one! Right on time!", "Yes! Shining bright!"],
          break: ["Look up for a moment. Rest your eyes!", "Gentle stretch, then back to it!"]
        }
      },
      {
        id: "ramadan-kahki", name: "Kahki", kind: "Kahk Cookie", pose: "stand", wearColor: "#C99A2E",
        bio: "Dusted in sugar and stamped with a pattern.",
        idle: ["topBob", "bounce", "wave"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="48" cy="108.5" rx="7.4" ry="4.2" fill="#E2B47A" ${O}/><ellipse cx="72" cy="108.5" rx="7.4" ry="4.2" fill="#E2B47A" ${O}/>`,
          armL: {svg: `<ellipse cx="28" cy="74" rx="5" ry="7" transform="rotate(30 28 74)" fill="#F2D2A0" ${O}/>`, pivot: [34, 70]},
          armR: {svg: `<ellipse cx="92" cy="74" rx="5" ry="7" transform="rotate(-30 92 74)" fill="#F2D2A0" ${O}/>`, pivot: [86, 70]},
          body: `${RG("ramadan-kahki-g", [[0, "#FFF6E4"], [0.6, "#F4D8A8"], [1, "#DCAE70"]], 0.4, 0.35, 0.75)}
            <circle cx="60" cy="72" r="33" fill="url(#ramadan-kahki-g)" ${O}/>
            ${ring(60, 72, 16, 25, (x, y, a) => `<path d="M${x} ${y}L${f1(60 + Math.cos(a * Math.PI / 180) * 30)} ${f1(72 + Math.sin(a * Math.PI / 180) * 30)}" stroke="#C8925A" stroke-width="2" stroke-linecap="round"/>`)}
            <circle cx="60" cy="72" r="22" fill="none" stroke="#C8925A" stroke-width="1.6" opacity=".7"/>
            ${Array.from({length: 26}, (_, i) => `<circle cx="${f1(36 + (i * 41 % 48))}" cy="${f1(48 + (i * 29 % 48))}" r="1.1" fill="#FFFFFF"/>`).join("")}
            <path d="M38 56Q42 46 52 43" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>`,
          top: {svg: `<path d="M48 42Q60 30 72 42Z" fill="#FFFFFF" ${O2}/><circle cx="54" cy="38" r="1.2" fill="#E8DCC8"/><circle cx="64" cy="36" r="1.2" fill="#E8DCC8"/>${twinkle(76, 30, 4, "#FFE27A")}`, pivot: [60, 42]}
        },
        eyes: {lx: 50, rx: 70, y: 70, r: 4.8, style: "sparkle", color: "#3A2414"},
        mouth: {x: 60, y: 80, w: 3, color: "#3A2414"},
        cheeks: {lx: 42, rx: 78, y: 78, w: 4, h: 2.4, color: "#FF9AA8"},
        anchors: {top: [60, 40, 0.95], neck: [60, 98, 1], chest: [72, 90, 0.62], back: [88, 62, 0.8], hands: [60, 98, 0.86]},
        lines: {
          tap: ["Hello! Freshly baked and ready to help!", "A sprinkle of sugar for your hard work!", "Sweet things take patience. Like you!", "Stamped with a pattern of good luck!", "You're doing wonderfully, crumb by crumb!", "Powdered sugar cheers for you!", "Every page, a little sweeter!", "Best shared with friends, like this study time!"],
          pet: ["Hehe! Careful, sugar everywhere!", "Aww, warm hands, warm cookie!"],
          hello: ["You're back! Fresh from the oven!", "Hi! I saved the sweetest spot for you!"],
          morning: ["Good morning! A sweet start to the day!", "Rise and shine! Fresh cookies, fresh start!"],
          night: ["The lanterns are lit. Rest soon?", "Goodnight! Sweet dreams, friend."],
          focus: ["Quietly cheering, crumb by crumb.", "Sitting sweetly beside you!"],
          done: ["What a sweet session! So proud!", "All done! Extra sugar for you!"],
          task: ["Done! Sweet!", "Checked off! Sugar dust!", "Another one! Freshly finished!", "Yes! That's a treat!"],
          break: ["Break time! A little snack and water!", "Stretch time! Shake off the crumbs!"]
        }
      }
    ]
  });

  /* ================= Mid-Autumn Festival ================= */
  COMP_DATA.push({
    theme: "midautumn",
    companions: [
      {
        id: "midautumn-tuzi", name: "Tuzi", kind: "Jade Rabbit", pose: "sit", sleepy: true, wearColor: "#7AC8A8",
        bio: "Lives on the moon and visits once a year.",
        idle: ["earTwitch", "headTilt", "topBob"], cheer: "hop",
        neck: [60, 76],
        parts: {
          tail: {svg: `<path d="${puff(90, 100, 6, 7, 1.2)}" fill="#FFFFFF" ${O}/>`, pivot: [86, 100]},
          feet: `<ellipse cx="40" cy="108" rx="10" ry="4.8" fill="#FFFFFF" ${O}/><ellipse cx="80" cy="108" rx="10" ry="4.8" fill="#FFFFFF" ${O}/><ellipse cx="34" cy="108" rx="2" ry="1.4" fill="#FFC1D0"/><ellipse cx="86" cy="108" rx="2" ry="1.4" fill="#FFC1D0"/>`,
          body: `${LG("midautumn-tuzi-b", [[0, "#FFFFFF"], [1, "#D8ECE4"]])}
            <path d="M60 72C80 72 88 86 88 98C88 107 78 110.5 60 110.5C42 110.5 32 107 32 98C32 86 40 72 60 72Z" fill="url(#midautumn-tuzi-b)" ${O}/>
            <path d="M46 80Q60 86 74 80" fill="none" stroke="#7AC8A8" stroke-width="3.4" stroke-linecap="round"/>
            <circle cx="60" cy="86" r="3.4" fill="#F6B42A" ${OW(1.6)}/>`,
          armL: {svg: `<ellipse cx="44" cy="92" rx="5" ry="6.4" transform="rotate(20 44 92)" fill="#FFFFFF" ${O}/>`, pivot: [46, 88]},
          armR: {svg: `<ellipse cx="76" cy="92" rx="5" ry="6.4" transform="rotate(-20 76 92)" fill="#FFFFFF" ${O}/>`, pivot: [74, 88]},
          earL: {svg: `${LG("midautumn-tuzi-e", [[0, "#FFFFFF"], [1, "#E2F0EA"]])}<path d="M48 40C40 30 38 10 46 6C54 4 56 24 56 38Z" fill="url(#midautumn-tuzi-e)" ${O}/><path d="M49 34C45 26 44 14 47 11C51 11 52 24 52 33Z" fill="#FFC1D0"/>`, pivot: [52, 38]},
          earR: {svg: `<path d="M72 40C80 30 82 10 74 6C66 4 64 24 64 38Z" fill="url(#midautumn-tuzi-e)" ${O}/><path d="M71 34C75 26 76 14 73 11C69 11 68 24 68 33Z" fill="#FFC1D0"/>`, pivot: [68, 38]},
          head: `${RG("midautumn-tuzi-h", [[0, "#FFFFFF"], [0.7, "#F4FAF7"], [1, "#D8ECE4"]], 0.4, 0.3, 0.8)}
            <path d="M60 34C80 34 88 46 88 58C88 72 76 80 60 80C44 80 32 72 32 58C32 46 40 34 60 34Z" fill="url(#midautumn-tuzi-h)" ${O}/>
            <path d="M40 46Q44 40 52 38" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
          face: `<path d="M57.6 63.4H62.4L60 66Z" fill="#FF9AB0" ${OW(1.2)}/>`,
          top: {svg: `${["#F6B42A", "#FFC84A", "#F6B42A"].map((c, i) => { const x = 66 + i * 6, y = 36 - (i % 2) * 4; return `<g>${ring(x, y, 4, 2.4, (px, py) => `<circle cx="${px}" cy="${py}" r="2.2" fill="${c}" ${OW(1)}/>`)}<circle cx="${x}" cy="${y}" r="1" fill="#FFE9A0"/></g>`; }).join("")}
            <path d="M64 40Q60 36 62 32" fill="none" stroke="#5E9A62" stroke-width="2" stroke-linecap="round"/>`, pivot: [68, 40]}
        },
        eyes: {lx: 49, rx: 71, y: 58, r: 4.6, style: "round", color: "#2A3A34"},
        mouth: {x: 60, y: 69, w: 2.8, color: "#2A3A34"},
        cheeks: {lx: 42, rx: 78, y: 66, w: 4, h: 2.4, color: "#FFA6BE"},
        anchors: {top: [60, 34, 0.95], neck: [60, 80, 1], chest: [72, 96, 0.62], back: [86, 88, 0.8], hands: [60, 98, 0.86]},
        lines: {
          tap: ["Hello from the moon! I hopped down to see you!", "Pound, pound! Grinding through the notes!", "The moon is full, and so is your brain!", "You're doing wonderfully, little star!", "One hop at a time, all the way to the moon!", "I brought osmanthus for good luck!", "Soft ears, big cheers for you!", "So happy to visit you this year!"],
          pet: ["Hehe! My ears are wiggling!", "Aww, softer than moonlight!"],
          hello: ["Hop hop! You're back!", "Hi! The moon said to say hello!"],
          morning: ["Good morning! Even moon bunnies wake up early!", "Rise and shine! Let's hop to it!"],
          night: ["The moon is bright. Time to rest soon?", "Goodnight! I'll hop back to the moon for a nap."],
          focus: ["Pounding quietly beside you.", "Ears down, focus up. You've got this!"],
          done: ["What a moonlit session! So proud!", "All done! Happy bunny hops!"],
          task: ["Hop! Done!", "Checked off! Moon-tastic!", "Another one! Thump thump!", "Yes! Full moon proud!"],
          break: ["Hop break! Stretch your legs!", "Snack time! A mooncake, maybe?"]
        }
      },
      {
        id: "midautumn-bing", name: "Bing", kind: "Mooncake", pose: "stand", wearColor: "#B8402E",
        bio: "Round, golden and stamped with a lucky pattern.",
        idle: ["topBob", "bounce", "sparkle"], cheer: "spin",
        parts: {
          feet: `<ellipse cx="48" cy="108.5" rx="7.4" ry="4.2" fill="#C8822E" ${O}/><ellipse cx="72" cy="108.5" rx="7.4" ry="4.2" fill="#C8822E" ${O}/>`,
          armL: {svg: `<ellipse cx="27" cy="76" rx="5" ry="7" transform="rotate(30 27 76)" fill="#E8A44A" ${O}/>`, pivot: [33, 72]},
          armR: {svg: `<ellipse cx="93" cy="76" rx="5" ry="7" transform="rotate(-30 93 76)" fill="#E8A44A" ${O}/>`, pivot: [87, 72]},
          body: `${RG("midautumn-bing-g", [[0, "#FFE0A0"], [0.6, "#F0B058"], [1, "#C8822E"]], 0.4, 0.35, 0.75)}
            <path d="M60 40C82 40 94 54 94 72C94 92 82 104 60 104C38 104 26 92 26 72C26 54 38 40 60 40Z" fill="url(#midautumn-bing-g)" ${O}/>
            ${ring(60, 72, 18, 29, (x, y) => `<circle cx="${x}" cy="${y}" r="4" fill="#E0A04A" stroke="#A8641E" stroke-width="1.2"/>`)}
            <circle cx="60" cy="72" r="20" fill="none" stroke="#A8641E" stroke-width="1.8"/>
            <path d="M48 58Q46 54 50 52M72 58Q74 54 70 52M44 86Q42 90 46 92M76 86Q78 90 74 92" fill="none" stroke="#A8641E" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M34 60Q38 50 48 46" fill="none" stroke="#FFF0C8" stroke-width="3.4" stroke-linecap="round"/>`,
          top: {svg: `${ring(60, 36, 4, 3.2, (x, y) => `<circle cx="${x}" cy="${y}" r="3" fill="#F6B42A" ${OW(1.2)}/>`)}<circle cx="60" cy="36" r="1.6" fill="#FFE9A0"/><path d="M56 40Q50 36 48 30" fill="none" stroke="#5E9A62" stroke-width="2" stroke-linecap="round"/><path d="M50 32C46 28 46 24 50 24C52 26 52 30 50 32Z" fill="#5E9A62" ${OW(1.2)}/>`, pivot: [60, 41]}
        },
        eyes: {lx: 50, rx: 70, y: 70, r: 4.8, style: "sparkle", color: "#3A2010"},
        mouth: {x: 60, y: 80, w: 3, color: "#3A2010"},
        cheeks: {lx: 43, rx: 77, y: 78, w: 4, h: 2.4, color: "#FF8A80"},
        anchors: {top: [60, 40, 0.95], neck: [60, 98, 1], chest: [72, 92, 0.62], back: [88, 62, 0.8], hands: [60, 98, 0.86]},
        lines: {
          tap: ["Hi! I'm stamped with luck, just for you!", "Round and golden, like your bright ideas!", "Sweet filling, sweet effort!", "Share a slice of focus with me!", "You're on a roll! A round one!", "Every bite of study counts!", "Moonlight and mooncakes, perfect study night!", "Lucky pattern, lucky you!"],
          pet: ["Hehe! My crust is all warm now!", "Aww, so sweet! Sweeter than my filling!"],
          hello: ["You're back! Freshly baked and happy!", "Hi! Let's share this study time!"],
          morning: ["Good morning! Golden and ready!", "Rise and shine! A round, happy day ahead!"],
          night: ["The moon's so round tonight. Rest soon?", "Goodnight! Sweet, moonlit dreams!"],
          focus: ["Sitting round and quiet beside you.", "Golden focus! You've got this!"],
          done: ["What a golden session! So proud!", "All done! A whole mooncake of success!"],
          task: ["Done! Golden!", "Checked off! Lucky stamp!", "Another one! Round of applause!", "Yes! Sweet success!"],
          break: ["Tea break! Pair it with a mooncake!", "Stretch time! Roll your shoulders!"]
        }
      },
      {
        id: "midautumn-osma", name: "Osma", kind: "Osmanthus Sprite", pose: "float", wearColor: "#5E9A62",
        bio: "A tiny golden flower that smells like honey.",
        idle: ["sway", "sparkle", "topBob"], cheer: "spin",
        parts: {
          armL: {svg: `<path d="M34 76Q20 70 16 80Q26 88 36 80Z" fill="#6AAA6A" ${O}/><path d="M33 78Q24 77 19 80" fill="none" stroke="#4A8A4E" stroke-width="1.2"/>`, pivot: [36, 78]},
          armR: {svg: `<path d="M86 76Q100 70 104 80Q94 88 84 80Z" fill="#6AAA6A" ${O}/><path d="M87 78Q96 77 101 80" fill="none" stroke="#4A8A4E" stroke-width="1.2"/>`, pivot: [84, 78]},
          body: `${RG("midautumn-osma-p", [[0, "#FFF2B0"], [0.6, "#FFC83A"], [1, "#F09A1A"]], 0.5, 0.5, 0.7)}
            ${[0, 90, 180, 270].map(a => { const r = a * Math.PI / 180, x = f1(60 + Math.cos(r) * 20), y = f1(70 + Math.sin(r) * 20); return `<ellipse cx="${x}" cy="${y}" rx="20" ry="17" transform="rotate(${a} ${x} ${y})" fill="url(#midautumn-osma-p)" ${O}/>`; }).join("")}
            <circle cx="60" cy="70" r="22" fill="url(#midautumn-osma-p)"/>
            <circle cx="60" cy="70" r="5" fill="#E8901A" opacity=".35"/>
            <path d="M42 56Q46 48 54 46" fill="none" stroke="#FFFBE0" stroke-width="3" stroke-linecap="round"/>
            <circle cx="22" cy="104" r="2.4" fill="#F6B42A"/><circle cx="98" cy="102" r="2" fill="#F6B42A"/>`,
          top: {svg: `${LINE("M60 48Q60 40 62 34", "#4A8A4E", 2.4)}<path d="M62 36C58 28 50 28 48 32C52 38 58 38 62 36Z" fill="#6AAA6A" ${O2}/><path d="M62 36C66 28 74 28 76 32C72 38 66 38 62 36Z" fill="#6AAA6A" ${O2}/>`, pivot: [60, 50]}
        },
        eyes: {lx: 51, rx: 69, y: 68, r: 4.6, style: "sparkle", color: "#3A2008"},
        mouth: {x: 60, y: 78, w: 3, color: "#3A2008"},
        cheeks: {lx: 44, rx: 76, y: 76, w: 4, h: 2.4, color: "#FF8A6A"},
        anchors: {top: [60, 48, 0.85], neck: [60, 94, 0.9], chest: [70, 88, 0.6], back: [86, 56, 0.8], hands: [60, 94, 0.82]},
        lines: {
          tap: ["Hello! Mmm, smells like honey in here!", "Tiny flower, giant cheers for you!", "Your ideas are blooming!", "Sweet scents and sweet success!", "Little petals add up to a whole tree!", "Golden thoughts for a golden student!", "You make the whole garden smell sweeter!", "Bloom, bloom, keep going!"],
          pet: ["Hehe! Now you smell like honey too!", "Aww, my petals are all fluttery!"],
          hello: ["You're here! The air smells sweeter!", "Hi! I bloomed just for you!"],
          morning: ["Good morning! Petals open, sun's up!", "Rise and bloom! It's a golden day!"],
          night: ["The moon's out. My petals are sleepy.", "Goodnight! Dream of honey and moonlight."],
          focus: ["Drifting quietly beside you.", "Soft and sweet, right here. Go!"],
          done: ["What a golden session! So sweet!", "All done! A whole tree in bloom!"],
          task: ["Done! Bloom!", "Checked off! Honey sweet!", "Another petal opened!", "Yes! Golden work!"],
          break: ["Fresh air break! Breathe in the flowers!", "Stretch your petals! I mean arms!"]
        }
      }
    ]
  });
})();
