/* ===== module: 98-comp-b8.js ===== */
/* Study Companions, batch 8 */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);

  /* Desert Dunes */
  COMP_DATA.push({
    theme: "dunes",
    companions: [
      {
        id: "dunes-fennec", name: "Fenn", kind: "Fennec Fox Kit", pose: "stand",
        bio: "A sandy little fox with big ears for every idea you share.",
        idle: ["earTwitch", "tailSwish", "headTilt"], cheer: "hop",
        neck: [60, 75],
        parts: {
          tail: {svg: `${LG("dunes-fennec-t", [[0, "#FBE3BA"], [1, "#E6AE72"]], 0, 0, 1, 1)}
            <path d="M75 101C89 103 101 94 102 81C103 72 98 65 92 66C94 78 88 89 75 91Z" fill="url(#dunes-fennec-t)" ${O}/>
            <path d="M102 81C103 72 98 65 92 66C92.6 71 92.4 75 91.4 79C95 80.5 99 81.2 102 81Z" fill="#FFF4E2"/>
            <path d="M102 81C103 72 98 65 92 66" fill="none" ${O}/>`, pivot: [77, 96]},
          earL: {svg: `<path d="M38 50C29 40 22 25 24 15.5C25.5 11.5 30 11.5 35 14.5C45 20.5 54 29 59 38Z" fill="#F1CD9C" ${O}/><path d="M40 43C34 35 29.5 26 29.5 19.5C35.5 22 45 29 52 36.5Z" fill="#F4B3A0"/>`, pivot: [46, 42]},
          earR: {svg: `<path d="M82 50C91 40 98 25 96 15.5C94.5 11.5 90 11.5 85 14.5C75 20.5 66 29 61 38Z" fill="#F1CD9C" ${O}/><path d="M80 43C86 35 90.5 26 90.5 19.5C84.5 22 75 29 68 36.5Z" fill="#F4B3A0"/>`, pivot: [74, 42]},
          feet: `<ellipse cx="50" cy="109.2" rx="6.8" ry="3.8" fill="#D59A5E" ${O}/><ellipse cx="70" cy="109.2" rx="6.8" ry="3.8" fill="#D59A5E" ${O}/>`,
          body: `${LG("dunes-fennec-b", [[0, "#FBE6C4"], [1, "#E8B37A"]])}
            <path d="M60 72C75 72 80.5 86 79.5 97C78.8 105 72 109.5 60 109.5C48 109.5 41.2 105 40.5 97C39.5 86 45 72 60 72Z" fill="url(#dunes-fennec-b)" ${O}/>
            <ellipse cx="60" cy="96" rx="11" ry="10" fill="#FFF4E2"/>`,
          armL: {svg: `<ellipse cx="41.5" cy="91" rx="4.8" ry="7.2" transform="rotate(22 41.5 91)" fill="#E3AE73" ${O}/>`, pivot: [46, 85]},
          armR: {svg: `<ellipse cx="78.5" cy="91" rx="4.8" ry="7.2" transform="rotate(-22 78.5 91)" fill="#E3AE73" ${O}/>`, pivot: [74, 85]},
          head: `${LG("dunes-fennec-h", [[0, "#FCEBCC"], [1, "#EDBE85"]])}
            <ellipse cx="60" cy="56" rx="25" ry="21" fill="url(#dunes-fennec-h)" ${O}/>
            <path d="M40.5 50Q43 42 50.5 38.5" fill="none" stroke="#FFF6E6" stroke-width="3" stroke-linecap="round"/>`,
          face: `<path d="M38.5 62C42 71.5 50 76.8 60 76.8C70 76.8 78 71.5 81.5 62C75 66 67.5 66 60 62.5C52.5 66 45 66 38.5 62Z" fill="#FFF4E2"/>
            <ellipse cx="60" cy="64.2" rx="2.9" ry="2.1" fill="${INK}"/><ellipse cx="59.2" cy="63.6" rx=".9" ry=".6" fill="#fff" opacity=".8"/>`
        },
        eyes: {lx: 50, rx: 70, y: 56.5, r: 4.6, style: "dot", color: "#3A2416"},
        mouth: {x: 60, y: 68.6, w: 2.8, style: "cat", color: "#3A2416"},
        cheeks: {lx: 43.5, rx: 76.5, y: 64.5, w: 4.4, h: 2.7, color: "#FF9A8C"},
        anchors: {top: [60, 36, 0.95], neck: [60, 76, 0.95], chest: [68, 92, 0.7], back: [79, 90, 0.85], hands: [60, 95, 0.85]},
        lines: {
          tap: ["Hi hi! My big ears perked right up for you!", "Ooh, tell me everything! I'm all ears!", "You're on fire today! Sandy high five!", "Look at you, showing up again! Yay!", "Every idea you share makes my tail wag!", "You've got this, and I've got your back!", "Desert sun and you? Best combo ever!"],
          pet: ["Eee! My ears are wiggling with joy!", "Hehe! Fluffy tail wag, just for you!"],
          hello: ["You're back! My ears heard you coming! Yay!", "Hi hi! Let's go on an adventure together!"],
          morning: ["Good morning! The dunes are glowing! Let's go!", "Rise and shine! Big ears, big plans today!"],
          night: ["The desert is cool and quiet. Bedtime soon?", "Ears down, tail curled. Rest well, friend."],
          focus: ["Ears up, heads down. We've got this!", "Quiet as the dunes. You're doing great!"],
          done: ["What a session! My tail won't stop wagging!", "You did it! I'm zooming around the dunes!"],
          task: ["YIP! Another one done!", "Yes yes yes! Checked off! Ears up!", "Woohoo! You're a superstar!", "Done and done! I'm doing happy zoomies!"],
          break: ["Break time! Let's dig in the sand and stretch!", "Zoom around a little! Then a cool drink!"]
        }
      },
      {
        id: "dunes-camel", name: "Toffee", kind: "Baby Camel", pose: "sit", sleepy: true, wearColor: "#3F9FA8",
        bio: "A sleepy baby camel who rests beside you through long study treks.",
        idle: ["earTwitch", "tailSwish", "topBob"], cheer: "bounce",
        neck: [72, 64],
        parts: {
          tail: {svg: `${LINE("M24 93C18 95 15.5 99 16 104", "#D49656", 2.6)}<path d="M16 102.5C12.5 103.5 12 108.5 15 110C18 111.5 21 108.5 19.8 104.5Z" fill="#8A4527" ${O2}/>`, pivot: [25, 93]},
          earL: {svg: `<g transform="translate(72 22) scale(.9) translate(-60 -33)"><ellipse cx="36.5" cy="45.5" rx="7.6" ry="4.4" transform="rotate(-24 36.5 45.5)" fill="#E0A96C" ${OW(3.3)}/><ellipse cx="37.5" cy="45.5" rx="3.8" ry="1.9" transform="rotate(-24 37.5 45.5)" fill="#F4B3A0"/></g>`, pivot: [57, 35]},
          earR: {svg: `<g transform="translate(72 22) scale(.9) translate(-60 -33)"><ellipse cx="83.5" cy="45.5" rx="7.6" ry="4.4" transform="rotate(24 83.5 45.5)" fill="#E0A96C" ${OW(3.3)}/><ellipse cx="82.5" cy="45.5" rx="3.8" ry="1.9" transform="rotate(24 82.5 45.5)" fill="#F4B3A0"/></g>`, pivot: [87, 35]},
          body: `${LG("dunes-camel-b", [[0, "#F2CD96"], [1, "#D49656"]])}
            <path d="M62 94C61 82 61.5 70 63.5 58H81C82 70 85 82 91 94Z" fill="url(#dunes-camel-b)" ${O}/>
            <path d="M28 110.5C19 110.5 17 100 22 93C25 89 28.5 87 31 85C32.5 71 38 60.5 45 60.5C52 60.5 57.5 70 60.5 80.5C68 83 82 83.5 89.5 89C96.5 94 98 105 93 110.5Z" fill="url(#dunes-camel-b)" ${O}/>
            <path d="M31.8 80.5C35.5 73.5 40.5 71 45.5 71C50.5 71 55.5 73.5 59 79L59.5 93Q45.5 97.5 31.5 93Z" fill="#C4652E" ${O2}/>
            <path d="M34.5 88.6Q45.5 92 57 88.4" fill="none" stroke="#FFD66B" stroke-width="2.4" stroke-dasharray="3.4 3" stroke-linecap="round"/>
            <path d="M37 70Q39.5 64 45 63" fill="none" stroke="#FBE3BC" stroke-width="2.8" stroke-linecap="round"/><path d="M37 80Q40.5 76 45 75.5" fill="none" stroke="#E68B55" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M62 110.5C60 105 63.5 101 69 101H82C86 101 88.5 103.5 88.5 106C88.5 108.5 86.5 110.5 83 110.5Z" fill="#E6B37A" ${O}/>
            <path d="M81.5 101.8V110" stroke="#8A4527" stroke-width="2" stroke-linecap="round"/>`,
          head: `<g transform="translate(72 22) scale(.9) translate(-60 -33)">${LG("dunes-camel-h", [[0, "#F6D6A2"], [1, "#DDA062"]])}
            <path d="M60 33C72.5 33 79.5 41 79.5 51.5C79.5 57 77.5 60 77.5 63C80.5 66.5 81.5 72 78.5 76.5C75 81.5 68 83.5 60 83.5C52 83.5 45 81.5 41.5 76.5C38.5 72 39.5 66.5 42.5 63C42.5 60 40.5 57 40.5 51.5C40.5 41 47.5 33 60 33Z" fill="url(#dunes-camel-h)" ${OW(3.3)}/>
            <path d="M45 47Q47 40.5 53 37.5" fill="none" stroke="#FFF1D8" stroke-width="3.2" stroke-linecap="round"/></g>`,
          face: `<g transform="translate(72 22) scale(.9) translate(-60 -33)"><ellipse cx="60" cy="73.5" rx="16.5" ry="9" fill="#FBE6C4"/>
            <path d="M53 70.2q1.8-1.4 3.4 0M63.6 70.2q1.8-1.4 3.4 0" fill="none" stroke="#8A4527" stroke-width="2.2" stroke-linecap="round"/></g>`,
          top: {svg: `<g transform="translate(72 22) scale(.9) translate(-60 -33)"><path d="M50.5 37.5C47.5 32 51 27 55 28.5C55.5 23.5 64.5 23.5 65 28.5C69 27 72.5 32 69.5 37.5Z" fill="#B9683A" ${OW(2.4)}/><path d="M56 30.5q2-2.4 4.2-.6" fill="none" stroke="#D98E58" stroke-width="1.8" stroke-linecap="round"/></g>`, pivot: [72, 25]}
        },
        eyes: {lx: 64, rx: 80, y: 44, r: 4.3, style: "dot", color: "#3A2416"},
        mouth: {x: 72, y: 61.8, w: 2.8, color: "#3A2416"},
        cheeks: {lx: 58.5, rx: 85.5, y: 50.5, w: 4, h: 2.5, color: "#FF9A8C"},
        anchors: {top: [72, 23, 0.85], neck: [72, 68, 0.62], chest: [80, 92, 0.6], back: [26, 88, 0.8], hands: [73, 86, 0.8]},
        lines: {
          tap: ["Oh hi! You made this sleepy camel so happy!", "Long trek? No problem! We're doing it together!", "Look at you go, one step at a time! Wow!", "You're amazing, and I'm not just saying it because I'm sleepy!", "Every step across the dunes counts! Yay!", "Showing up again! You're my favorite traveler!", "I'm so proud to walk beside you!"],
          pet: ["Ooh, so cozy! My whole heart is happy!", "Hehe! That's the best pat ever! Thank you!"],
          hello: ["You're back! I woke right up for you! Yay!", "Hi hi! Ready for another fun trek together?"],
          morning: ["Good morning! The sun is up and so are we!", "Morning, friend! A brand new trek awaits! Let's go!"],
          night: ["Big yawn... time to rest those feet?", "The dunes are sleepy. Rest well, traveler."],
          focus: ["Steady steps, heads down. We've got this!", "I'm right here beside you. You're doing great."],
          done: ["What a trek! I'm so proud of you!", "Session done! You crossed a whole dune!"],
          task: ["YAY! Another one done!", "Checked off! I'm doing a happy camel dance!", "Woohoo! Oasis reached! You're amazing!", "Yes yes yes! One more step complete!"],
          break: ["Break time! Let's find some shade and stretch!", "Water break! A cool drink sounds perfect!"]
        }
      },
      {
        id: "dunes-wisp", name: "Mirage", kind: "Sand Wisp", pose: "float", size: 1.08,
        bio: "A warm swirl of desert sand who glows like sunset on the dunes.",
        idle: ["sparkle", "topBob", "finWiggle"], cheer: "spin",
        parts: {
          tail: {svg: `${LG("dunes-wisp-t", [[0, "#F6C07E"], [1, "#E08A56"]])}
            <path d="M47 78C50 89 56 95 64 99C70 101.5 75 98 72.5 94C70.5 91 66 93.5 67 96C60 92 58 86 60 80Z" fill="url(#dunes-wisp-t)" ${O2}/>`, pivot: [55, 80]},
          body: `${RG("dunes-wisp-g", [[0, "#FFF4D6"], [0.55, "#FFD89A"], [1, "#F2A566"]], 0.4, 0.34, 0.7)}
            <circle cx="60" cy="60" r="23" fill="url(#dunes-wisp-g)" ${O}/>
            <path d="M40.4 72C47 66.5 53 71.5 60 70C67 68.5 73 64.5 80.9 69.5A23 23 0 0 1 40.4 72Z" fill="#EFA366" opacity=".85"/>
            <path d="M45.3 77.6C51 74.5 56 78 61 77C67 76 72 74 77 75.5A23 23 0 0 1 45.3 77.6Z" fill="#D9804C" opacity=".8"/>
            <path d="M42.5 51Q45.5 43 53 40" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>
            <circle cx="60" cy="60" r="23" fill="none" ${O}/>
            <circle cx="33" cy="47" r="1.5" fill="#E8A560"/><circle cx="87" cy="52" r="1.2" fill="#E8A560"/>`,
          armL: {svg: `<ellipse cx="35.5" cy="68" rx="4.4" ry="5.6" transform="rotate(28 35.5 68)" fill="#F8C48A" ${O}/>`, pivot: [40.5, 66]},
          armR: {svg: `<ellipse cx="84.5" cy="68" rx="4.4" ry="5.6" transform="rotate(-28 84.5 68)" fill="#F8C48A" ${O}/>`, pivot: [79.5, 66]},
          top: {svg: `${LINE("M60 38.5V31", "#E8A560", 2.4)}<path d="M60 17.5L62.6 25.4L70.5 28L62.6 30.6L60 38.5L57.4 30.6L49.5 28L57.4 25.4Z" fill="#FFD66B" ${O2}/><circle cx="60" cy="28" r="2" fill="#FFF6D6"/>`, pivot: [60, 38]}
        },
        eyes: {lx: 51, rx: 69, y: 58, r: 4.8, style: "sparkle", color: "#4A2616"},
        mouth: {x: 60, y: 66.5, w: 3, color: "#4A2616"},
        cheeks: {lx: 43, rx: 77, y: 65, w: 4.4, h: 2.8, color: "#FF8F8F"},
        anchors: {top: [60, 38, 0.9], neck: [60, 80, 1.0], chest: [71, 73, 0.62], back: [83, 55, 0.8], hands: [60, 76, 0.85]},
        lines: {
          tap: ["Swirl swirl! Hi! I'm glowing just for you!", "You light up the dunes like a sunset!", "Look at you, shining brighter every day!", "Whoosh! You're on fire today!", "Every grain of effort adds up! Wow!", "Showing up again? I'm swirling with joy!", "Warm wishes and big cheers, all for you!"],
          pet: ["Ooh! I'm swirling in happy little circles!", "Hehe! My glow just got so much warmer!"],
          hello: ["You're back! The whole desert is glowing!", "Hi hi! I swirled all the way here to see you!"],
          morning: ["Good morning! The dunes are golden! Let's go!", "Rise and shine! I'm glowing with excitement!"],
          night: ["Sunset's done and the stars are out. Rest soon?", "My glow is dimming softly. Sleep well, friend."],
          focus: ["Soft swirl, steady glow. We've got this!", "Heads down, warm and calm. You're doing great."],
          done: ["What a session! I'm glowing like a sunset!", "You did it! I'm swirling sky high!"],
          task: ["WHOOSH! Another one done!", "Yes yes yes! Checked off and glowing!", "Woohoo! You're a desert superstar!", "Done! I'm doing happy little spins!"],
          break: ["Break time! Let's twirl around and stretch!", "Catch some warm sunshine! Then back to it!"]
        }
      }
    ]
  });

  /* Jellyfish Drift */
  COMP_DATA.push({
    theme: "jelly",
    companions: [
      {
        id: "jelly-jellyfish", name: "Bloop", kind: "Baby Jellyfish", pose: "float", size: 1.06, wearColor: "#3FA6C4",
        bio: "A glowy baby jellyfish who drifts along with your study flow.",
        idle: ["finWiggle", "sparkle", "sway"], cheer: "spin",
        parts: {
          tail: {svg: `${LINE("M46 66C42 74 49 79 45.5 86C43 91 46 95 49 96", "#F29AC8", 2.8)}${LINE("M74 66C78 74 71 79 74.5 86C77 91 74 95 71 96", "#C99BF0", 2.8)}
            <path d="M54 66C51 74 57 78 54.5 86C53 92 57 97 61 101C64 95 61.5 90 64 84C66 78 63.5 72 66 66Z" fill="#FFD6EA" ${O2}/>
            <path d="M58.5 71Q56.5 78 59 84" fill="none" stroke="#F29AC8" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [60, 66]},
          body: `${RG("jelly-jellyfish-g", [[0, "#FFF2F9"], [0.5, "#FFC7E4"], [1, "#E58CC8"]], 0.42, 0.3, 0.75)}
            <path d="M33 65C33 42 45 29.5 60 29.5C75 29.5 87 42 87 65Q82.5 70 78 65Q73.5 70 69 65Q64.5 70 60 65Q55.5 70 51 65Q46.5 70 42 65Q37.5 70 33 65Z" fill="url(#jelly-jellyfish-g)" ${O}/>
            <path d="M40 57C40 44 48 36.5 60 36.5C72 36.5 80 44 80 57" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>
            <path d="M40.5 47Q43.5 38 51.5 34.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>
            <circle cx="79" cy="44" r="1.8" fill="#fff" opacity=".85"/>`,
          armL: {svg: `<path d="M38 64C33 68 31 75 34 80C37 78 38.5 72 42 67Z" fill="#F7B5DA" ${O2}/>`, pivot: [40, 65]},
          armR: {svg: `<path d="M82 64C87 68 89 75 86 80C83 78 81.5 72 78 67Z" fill="#DDB5F5" ${O2}/>`, pivot: [80, 65]}
        },
        eyes: {lx: 50, rx: 70, y: 52, r: 4.8, style: "sparkle", color: "#3A1E4A"},
        mouth: {x: 60, y: 59.5, w: 3, color: "#3A1E4A"},
        cheeks: {lx: 42.5, rx: 77.5, y: 58.5, w: 4.4, h: 2.7, color: "#FF7FAF"},
        anchors: {top: [60, 31, 0.95], neck: [60, 67, 1.15], chest: [76, 58, 0.6], back: [85, 48, 0.85], hands: [60, 70, 0.85]},
        lines: {
          tap: ["Bloop! Hi! I'm glowing just for you!", "Drifting along with you is my favorite thing!", "Look at you flow! You're amazing!", "You're glowing today! Bloop bloop!", "Every little wave counts! Keep going!", "Showing up again! I'm so happy I'm shimmering!", "We're in the best study flow ever!"],
          pet: ["Bloop! Hehe, my tentacles are wiggling!", "Ooh! I'm glowing extra bright now! Thank you!"],
          hello: ["You're back! My whole glow lit up!", "Hi hi! The current brought you right to me!"],
          morning: ["Good morning! Sunbeams in the water! Let's go!", "Rise and glow! What a sparkly day!"],
          night: ["Glowing softly in the deep. Bedtime soon?", "The sea is calm tonight. Drift off and rest."],
          focus: ["Go with the flow. We've got this!", "Soft glow, steady mind. You're doing great."],
          done: ["Bloop bloop! What a session! So proud!", "You did it! I'm doing happy little swirls!"],
          task: ["BLOOP! Another one done!", "Yes yes yes! Checked off and glowing!", "Woohoo! You're making waves!", "Done! I'm lighting up the whole ocean!"],
          break: ["Break time! Let's float and stretch!", "Drift for a bit! Grab a drink and relax!"]
        }
      },
      {
        id: "jelly-seaslug", name: "Nudi", kind: "Sea Slug", pose: "stand",
        bio: "A frilly sea slug who inches along with you, one small step at a time.",
        idle: ["earTwitch", "tailSwish", "waddle"], cheer: "hop",
        parts: {
          back: `${LG("jelly-seaslug-c", [[0, "#FFD08A"], [1, "#F07AAE"]])}
            <ellipse cx="33" cy="80" rx="6" ry="10" transform="rotate(-42 33 80)" fill="url(#jelly-seaslug-c)" ${O2}/>
            <ellipse cx="43" cy="71.5" rx="6" ry="10.5" transform="rotate(-20 43 71.5)" fill="url(#jelly-seaslug-c)" ${O2}/>
            <ellipse cx="77" cy="71.5" rx="6" ry="10.5" transform="rotate(20 77 71.5)" fill="url(#jelly-seaslug-c)" ${O2}/>
            <ellipse cx="87" cy="80" rx="6" ry="10" transform="rotate(42 87 80)" fill="url(#jelly-seaslug-c)" ${O2}/>
            <circle cx="28.5" cy="75.5" r="1.8" fill="#FFF3D6"/><circle cx="40" cy="63.5" r="1.8" fill="#FFF3D6"/><circle cx="80" cy="63.5" r="1.8" fill="#FFF3D6"/><circle cx="91.5" cy="75.5" r="1.8" fill="#FFF3D6"/>`,
          tail: {svg: `<path d="M90 101C98 101 105 104 109 109.5C103 111 96 110.8 90 109.5Z" fill="#9C66D8" ${O}/>`, pivot: [91, 105]},
          earL: {svg: `${LINE("M51 72C49.5 64 47 58 44 53", "#A77BE6", 2.6)}<ellipse cx="43" cy="50.5" rx="4.4" ry="5.4" transform="rotate(-25 43 50.5)" fill="#FFB070" ${O2}/>`, pivot: [50, 71]},
          earR: {svg: `${LINE("M69 72C70.5 64 73 58 76 53", "#A77BE6", 2.6)}<ellipse cx="77" cy="50.5" rx="4.4" ry="5.4" transform="rotate(25 77 50.5)" fill="#FFB070" ${O2}/>`, pivot: [70, 71]},
          body: `${LG("jelly-seaslug-b", [[0, "#D9BCFF"], [0.6, "#B288F0"], [1, "#8E5AD6"]])}
            <path d="M27 110.5C18.5 110.5 18 98 23.5 89.5C30 79 44 71.5 60 71.5C76 71.5 90 79 96.5 89.5C102 98 101.5 110.5 93 110.5Z" fill="url(#jelly-seaslug-b)" ${O}/>
            <path d="M25 104Q60 111.5 95 104" fill="none" stroke="#FFB070" stroke-width="3" stroke-linecap="round"/>
            <path d="M32 87Q37 79 46 75.5" fill="none" stroke="#F1E6FF" stroke-width="3.2" stroke-linecap="round"/>
            <circle cx="30" cy="97" r="2.2" fill="#F1E6FF" opacity=".85"/><circle cx="90" cy="95" r="2.6" fill="#F1E6FF" opacity=".85"/><circle cx="84.5" cy="87" r="1.6" fill="#F1E6FF" opacity=".85"/>`
        },
        eyes: {lx: 50, rx: 70, y: 87, r: 5, style: "dot", color: "#2A1840"},
        mouth: {x: 60, y: 95, w: 3.2, color: "#2A1840"},
        cheeks: {lx: 41.5, rx: 78.5, y: 94, w: 4.6, h: 2.8, color: "#FF8FBF"},
        anchors: {top: [60, 73, 0.95], neck: [60, 101, 1.3], chest: [82, 100, 0.7], back: [22, 92, 0.85], hands: [60, 102, 0.9]},
        wearColor: "#3FB8C8",
        lines: {
          tap: ["Hi hi! My frills are fluttering for you!", "One small step, then another! You're amazing!", "Look how far we've inched together! Wow!", "You're doing so well! Frilly high five!", "Every tiny step is worth a big cheer!", "Showing up again! I'm so proud of you!", "You and me, inching toward greatness!"],
          pet: ["Ooh! My frills are doing a happy wiggle!", "Hehe! That makes me so colorful and happy!"],
          hello: ["You're back! My frills are all aflutter!", "Hi hi! Ready to inch along together?"],
          morning: ["Good morning! The reef is waking up! Let's go!", "Rise and shine! A whole new tide awaits!"],
          night: ["Curling up on my rock. Time to rest too?", "The reef is quiet now. Sleep well, friend."],
          focus: ["Small steps, heads down. We've got this!", "Steady and gentle. You're doing great."],
          done: ["What a session! My frills are dancing!", "You did it! I'm so proud of every step!"],
          task: ["YAY! Another one done!", "Checked off! My frills are going wild!", "Woohoo! Small step, BIG win!", "Yes yes yes! You're incredible!"],
          break: ["Break time! Let's wiggle and stretch!", "Slow little stroll? Then a nice cool drink!"]
        }
      },
      {
        id: "jelly-clam", name: "Opal", kind: "Pearl in a Clam", pose: "sit", sleepy: true,
        bio: "A little pearl tucked in her clam, shimmering softly while you work.",
        idle: ["wave", "headTilt", "sparkle"], cheer: "bounce",
        neck: [60, 79],
        parts: {
          back: `${LG("jelly-clam-l", [[0, "#E4F8FB"], [1, "#9ED8E6"]])}
            <path d="M20.0 80.0Q15.7 68.8 23.0 60.1Q22.4 48.2 31.7 43.2Q34.9 32.4 44.7 32.0Q51.2 23.9 60.0 28.0Q68.8 23.9 75.3 32.0Q85.1 32.4 88.3 43.2Q97.6 48.2 97.0 60.1Q104.3 68.8 100.0 80.0Z" fill="url(#jelly-clam-l)" ${O}/>
            <path d="M60 78L27 63M60 78L35 47.5M60 78L46.5 36.5M60 78V32.5M60 78L73.5 36.5M60 78L85 47.5M60 78L93 63" fill="none" stroke="#5FAFC6" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>
            <path d="M31 50Q37 38 47 33.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`,
          body: `${LG("jelly-clam-b", [[0, "#B5E6F0"], [1, "#4FA6C4"]])}
            <path d="M17 78.5Q60 88 103 78.5C102 96 87 110.5 60 110.5C33 110.5 18 96 17 78.5Z" fill="url(#jelly-clam-b)" ${O}/>
            <path d="M40 85Q41 98 47 108M60 87V110M80 85Q79 98 73 108M26 83Q28 94 34 102M94 83Q92 94 86 102" fill="none" stroke="#2F7E9E" stroke-width="2" stroke-linecap="round" opacity=".55"/>
            <path d="M24 88Q27 97 33 103" fill="none" stroke="#E8FAFD" stroke-width="2.6" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="41" cy="81.5" rx="5.2" ry="4.4" fill="#FFF0F7" ${O2}/>`, pivot: [44, 78]},
          armR: {svg: `<ellipse cx="79" cy="81.5" rx="5.2" ry="4.4" fill="#FFF0F7" ${O2}/>`, pivot: [76, 78]},
          head: `${RG("jelly-clam-p", [[0, "#FFFFFF"], [0.45, "#FFF0F7"], [0.8, "#F6D2E6"], [1, "#DCC8F4"]], 0.4, 0.34, 0.72)}
            <path d="M44.4 79A22.5 22.5 0 1 1 75.6 79Q60 83 44.4 79Z" fill="url(#jelly-clam-p)" ${O}/>
            <path d="M42.5 53Q45.5 44.5 53.5 41" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>
            <path d="M75 45Q79.5 49.5 80.5 56" fill="none" stroke="#BFE6F2" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`
        },
        eyes: {lx: 51.5, rx: 68.5, y: 61, r: 4.5, style: "dot", color: "#3A2A5A"},
        mouth: {x: 60, y: 69, w: 2.8, color: "#3A2A5A"},
        cheeks: {lx: 45, rx: 75, y: 68, w: 4.2, h: 2.6, color: "#FF8FB8"},
        anchors: {top: [60, 40, 0.9], neck: [60, 80, 1.05], chest: [82, 95, 0.68], back: [97, 64, 0.85], hands: [60, 86, 0.9]},
        lines: {
          tap: ["Hello! My pearl is shimmering just for you!", "You're a real gem, you know that?", "Look at you shine today! Wow!", "Every effort adds a little more sparkle!", "Showing up again! I'm so proud of you!", "You make my whole shell glow!", "Shine on, friend! I'm cheering for you!"],
          pet: ["Ooh! My pearl is sparkling extra bright!", "Hehe! My shell is opening with joy!"],
          hello: ["You're back! My shell popped right open!", "Hi hi! I've been shimmering, waiting for you!"],
          morning: ["Good morning! Sunlight in the water! Let's go!", "Rise and shimmer! It's a lovely new day!"],
          night: ["Closing my shell for the night. Rest soon?", "Soft shimmer, calm sea. Sleep well, friend."],
          focus: ["Shimmering quietly. We've got this!", "Heads down, gem. You're doing great."],
          done: ["What a session! You're sparkling!", "You did it! My pearl is glowing with pride!"],
          task: ["SPARKLE! Another one done!", "Yes yes yes! Checked off! Shine on!", "Woohoo! You're a true treasure!", "Done! My shell is clapping for you!"],
          break: ["Break time! Let's stretch and sparkle!", "Bubble break! Grab a drink and relax!"]
        }
      }
    ]
  });

  /* Bamboo Grove */
  COMP_DATA.push({
    theme: "bamboo",
    companions: [
      {
        id: "bamboo-panda", name: "Bao", kind: "Baby Panda", pose: "sit", sleepy: true,
        bio: "A roly-poly panda cub who munches bamboo and naps while you study.",
        idle: ["earTwitch", "topBob", "bounce"], cheer: "hop",
        neck: [60, 75],
        parts: {
          earL: {svg: `<circle cx="38.5" cy="36.5" r="8.4" fill="#36343F" ${O}/><circle cx="38.5" cy="37" r="3.6" fill="#57545F"/>`, pivot: [42, 41]},
          earR: {svg: `<circle cx="81.5" cy="36.5" r="8.4" fill="#36343F" ${O}/><circle cx="81.5" cy="37" r="3.6" fill="#57545F"/>`, pivot: [78, 41]},
          feet: `<ellipse cx="39" cy="106" rx="10.5" ry="6" fill="#36343F" ${O}/><ellipse cx="81" cy="106" rx="10.5" ry="6" fill="#36343F" ${O}/><ellipse cx="36" cy="105.5" rx="3.4" ry="2.4" fill="#F4B9C4"/><ellipse cx="84" cy="105.5" rx="3.4" ry="2.4" fill="#F4B9C4"/>`,
          body: `${LG("bamboo-panda-b", [[0, "#FFFFFF"], [1, "#DCE6D4"]])}
            <path d="M60 71C80 71 88.5 85 88.5 97C88.5 107 79 110.5 60 110.5C41 110.5 31.5 107 31.5 97C31.5 85 40 71 60 71Z" fill="url(#bamboo-panda-b)" ${O}/>
            <path d="M34 82Q46 74.5 60 74.5Q74 74.5 86 82L87 88Q60 80 33 88Z" fill="#36343F"/>
            <path d="M47 104Q60 108 73 104" fill="none" stroke="#C9D6C0" stroke-width="2.4" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="44" cy="93" rx="6.6" ry="9.4" transform="rotate(14 44 93)" fill="#36343F" ${O}/>`, pivot: [45, 85]},
          armR: {svg: `<ellipse cx="76" cy="93" rx="6.6" ry="9.4" transform="rotate(-14 76 93)" fill="#36343F" ${O}/>`, pivot: [75, 85]},
          head: `${LG("bamboo-panda-h", [[0, "#FFFFFF"], [0.75, "#F6F9F2"], [1, "#DFE8D8"]])}
            <ellipse cx="60" cy="55" rx="26.5" ry="22" fill="url(#bamboo-panda-h)" ${O}/>
            <path d="M41 46Q45 38.5 53 36" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
          face: `<ellipse cx="48.5" cy="57.5" rx="7" ry="8.6" transform="rotate(32 48.5 57.5)" fill="#36343F"/>
            <ellipse cx="71.5" cy="57.5" rx="7" ry="8.6" transform="rotate(-32 71.5 57.5)" fill="#36343F"/>
            <ellipse cx="60" cy="64.4" rx="3" ry="2.1" fill="#36343F"/>`,
          top: {svg: `${LINE("M62 34C63 30 64.5 27.5 67 25.5", "#58902E", 2)}<path d="M66 26.5C68 19 76 15.5 82 17.5C80 24.5 72.5 28.5 66 26.5Z" fill="#8CC152" ${O2}/><path d="M68.5 25Q74 21 79.5 19.5" fill="none" stroke="#58902E" stroke-width="1.6" stroke-linecap="round"/><path d="M64.5 29C60 24 53 23.5 49.5 26.5C53 31 59.5 32 64.5 29Z" fill="#A5D26C" ${O2}/>`, pivot: [62, 34]}
        },
        eyes: {lx: 49, rx: 71, y: 57, r: 4.4, style: "round", color: "#2B2233"},
        mouth: {x: 60, y: 68, w: 2.6, style: "cat"},
        cheeks: {lx: 40, rx: 80, y: 68.5, w: 4.2, h: 2.6, color: "#FF9FB7"},
        anchors: {top: [60, 34, 1], neck: [60, 76, 1.1], chest: [70, 97, 0.7], back: [86, 90, 0.85], hands: [60, 97, 0.9]},
        lines: {
          tap: ["Hi hi! I stopped munching just to say hello!", "You're doing amazing! Panda hug!", "Look at you, showing up again! Yay!", "Roly poly cheers, all for you!", "You're on a roll today, just like me!", "Every page you turn makes me so happy!", "Bamboo and you? My two favorite things!"],
          pet: ["Ooh! Happy panda roll! Hehe!", "So cozy! My ears are wiggling with joy!"],
          hello: ["You're back! I'm doing a happy roly roll!", "Hi hi! I saved you some bamboo! Let's go!"],
          morning: ["Good morning! Breakfast bamboo and big smiles!", "Rise and shine! What a fun day ahead!"],
          night: ["Big panda yawn. Time for you to rest too?", "Snuggling into the grove. Sleep well, friend."],
          focus: ["Munching quietly. We've got this!", "Heads down, cozy and calm. You're doing great."],
          done: ["What a session! Happy panda tumble!", "You did it! I'm so proud of you!"],
          task: ["WOO! Another one done!", "Yes yes yes! Checked off! Panda party!", "Woohoo! You're the best!", "Done! I'm rolling around with joy!"],
          break: ["Break time! Let's roll around and stretch!", "Snack break! I'll grab the bamboo!"]
        }
      },
      {
        id: "bamboo-stalk", name: "Poki", kind: "Bamboo Stalk", pose: "stand", wearColor: "#E07A5F",
        bio: "A chubby bamboo stalk who grows a little taller every time you do.",
        idle: ["topBob", "wave", "sway"], cheer: "spin",
        parts: {
          feet: `<ellipse cx="51.5" cy="108.8" rx="6.6" ry="4" fill="#3F7A2E" ${O}/><ellipse cx="68.5" cy="108.8" rx="6.6" ry="4" fill="#3F7A2E" ${O}/>`,
          body: `${LG("bamboo-stalk-g", [[0, "#9CCB5C"], [0.5, "#B6DA78"], [1, "#78B042"]], 0, 0, 1, 0)}
            <path d="M41 42V99C41 106 49 109 60 109C71 109 79 106 79 99V42Z" fill="url(#bamboo-stalk-g)" ${O}/>
            <ellipse cx="60" cy="42" rx="19" ry="6" fill="#D8EDB0" ${O}/>
            <ellipse cx="60" cy="42.6" rx="12.5" ry="3.2" fill="#8FB85A"/>
            <path d="M41 56Q60 61.5 79 56" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M42 59.5Q60 64.5 78 59.5" fill="none" stroke="#DDF0B8" stroke-width="2" stroke-linecap="round" opacity=".9"/>
            <path d="M41 93Q60 98.5 79 93" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M42 96.5Q60 101.5 78 96.5" fill="none" stroke="#DDF0B8" stroke-width="2" stroke-linecap="round" opacity=".9"/>
            <path d="M46.5 66V86" stroke="#F0F9DC" stroke-width="3.2" stroke-linecap="round" opacity=".85"/>`,
          armL: {svg: `<ellipse cx="38" cy="81" rx="4.6" ry="7" transform="rotate(26 38 81)" fill="#8CC152" ${O}/>`, pivot: [43, 77]},
          armR: {svg: `<ellipse cx="82" cy="81" rx="4.6" ry="7" transform="rotate(-26 82 81)" fill="#8CC152" ${O}/>`, pivot: [77, 77]},
          top: {svg: `${LINE("M69 42C70 36 71 32 73 28", "#58902E", 2.2)}<path d="M72.5 29C73 20 80.5 13.5 88 14C87 22.5 80 29 72.5 29Z" fill="#8CC152" ${O2}/><path d="M74.5 27Q80 21.5 85.5 17" fill="none" stroke="#58902E" stroke-width="1.6" stroke-linecap="round"/><path d="M71.5 32C66.5 26 58 25 53.5 28.5C58 34 66 35 71.5 32Z" fill="#A5D26C" ${O2}/><path d="M69.5 31Q62.5 29 56.5 29" fill="none" stroke="#58902E" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [69, 42]}
        },
        eyes: {lx: 51.5, rx: 68.5, y: 73, r: 4.4, style: "dot", color: "#1C2E16"},
        mouth: {x: 60, y: 80.5, w: 3, color: "#1C2E16"},
        cheeks: {lx: 46, rx: 74, y: 79.5, w: 3.8, h: 2.5, color: "#FF9A9A"},
        anchors: {top: [60, 40, 0.85], neck: [60, 89, 0.9], chest: [68, 100, 0.55], back: [79, 70, 0.8], hands: [60, 90, 0.8]},
        lines: {
          tap: ["Hi hi! I grew a little just seeing you!", "Look at us growing together! Wow!", "You're on fire today! Sprout sprout!", "Every little effort helps us both grow tall!", "Showing up again! I'm so proud!", "Rooting for you, all the way down!", "Taller and stronger every day, that's you!"],
          pet: ["Ooh! My leaves are rustling with joy!", "Hehe! I think I just grew an inch!"],
          hello: ["You're back! I sprouted a brand new leaf!", "Hi hi! Let's grow some more today!"],
          morning: ["Good morning! Sunshine for growing! Let's go!", "Rise and sprout! It's a brand new day!"],
          night: ["Even bamboo rests at night. Time for bed?", "Leaves folding in. Sleep well, friend."],
          focus: ["Growing quietly. We've got this!", "Heads down, roots strong. You're doing great."],
          done: ["What a session! I grew so much!", "You did it! I'm standing extra tall for you!"],
          task: ["SPROUT! Another one done!", "Yes yes yes! Checked off! Growing tall!", "Woohoo! New ring of growth!", "Done! I'm swaying with happiness!"],
          break: ["Break time! Let's stretch up tall!", "Sunshine break! Grab some water, like me!"]
        }
      },
      {
        id: "bamboo-firefly", name: "Hotaru", kind: "Firefly", pose: "float", wearColor: "#E07A5F",
        bio: "A soft little firefly who lights the grove on long evening study nights.",
        idle: ["wingFlutter", "sparkle", "earTwitch"], cheer: "spin",
        parts: {
          back: `${RG("bamboo-firefly-halo", [[0, "#FFF6B0", 0.95], [0.5, "#FFE680", 0.55], [1, "#FFE680", 0]])}<circle cx="60" cy="85" r="25" fill="url(#bamboo-firefly-halo)"/>`,
          tail: {svg: `${RG("bamboo-firefly-t", [[0, "#FFFDE8"], [0.5, "#FFE680"], [1, "#F2B53A"]], 0.45, 0.4, 0.65)}
            <ellipse cx="60" cy="86" rx="14.5" ry="12.5" fill="url(#bamboo-firefly-t)" ${O}/>
            <path d="M49 88Q60 93 71 88" fill="none" stroke="#E9A53A" stroke-width="2" stroke-linecap="round" opacity=".7"/>`, pivot: [60, 76]},
          wingL: {svg: `<path d="M43 49C33 38 21 36 17.5 42C15 49 27 57 41 56Z" fill="#F2FBF0" fill-opacity=".92" ${OW(2.4)}/><path d="M39.5 52Q29 48 21.5 43.5" fill="none" stroke="#A9D39A" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [42, 52]},
          wingR: {svg: `<path d="M77 49C87 38 99 36 102.5 42C105 49 93 57 79 56Z" fill="#F2FBF0" fill-opacity=".92" ${OW(2.4)}/><path d="M80.5 52Q91 48 98.5 43.5" fill="none" stroke="#A9D39A" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [78, 52]},
          earL: {svg: `${LINE("M53 36C51 29 46 25.5 42 25.5", "#4E7A3E", 2)}<circle cx="41" cy="25.5" r="3.2" fill="#FFD66B" ${OW(2)}/>`, pivot: [53, 37]},
          earR: {svg: `${LINE("M67 36C69 29 74 25.5 78 25.5", "#4E7A3E", 2)}<circle cx="79" cy="25.5" r="3.2" fill="#FFD66B" ${OW(2)}/>`, pivot: [67, 37]},
          body: `${RG("bamboo-firefly-g", [[0, "#DDF0C8"], [0.6, "#A8D38A"], [1, "#6FA85A"]], 0.42, 0.34, 0.72)}
            <circle cx="60" cy="56" r="22" fill="url(#bamboo-firefly-g)" ${O}/>
            <path d="M42.5 48Q45.5 40 53 37" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".85"/>
            <path d="M46 72Q60 78 74 72" fill="none" stroke="#5E9448" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>`,
          armL: {svg: `<ellipse cx="38" cy="66" rx="4.2" ry="5.4" transform="rotate(28 38 66)" fill="#8CC17A" ${O}/>`, pivot: [42.5, 64]},
          armR: {svg: `<ellipse cx="82" cy="66" rx="4.2" ry="5.4" transform="rotate(-28 82 66)" fill="#8CC17A" ${O}/>`, pivot: [77.5, 64]}
        },
        eyes: {lx: 51, rx: 69, y: 55, r: 4.8, style: "sparkle", color: "#1C2E16"},
        mouth: {x: 60, y: 63.5, w: 3, color: "#1C2E16"},
        cheeks: {lx: 43, rx: 77, y: 62, w: 4.4, h: 2.7, color: "#FF9A9A"},
        anchors: {top: [60, 35, 0.9], neck: [60, 75, 1.0], chest: [72, 69, 0.6], back: [83, 50, 0.8], hands: [60, 73, 0.85]},
        lines: {
          tap: ["Blink blink! Hi! I lit up for you!", "You light up the whole grove! Wow!", "Look at you glowing today!", "Every little spark counts! Keep shining!", "Showing up again! My light is so bright!", "I'll be your little lantern, always!", "You're on fire today, in the best way!"],
          pet: ["Ooh! I'm blinking with happiness!", "Hehe! My glow just got so warm!"],
          hello: ["You're back! The grove just lit up!", "Hi hi! I've been glowing, waiting for you!"],
          morning: ["Good morning! I'll save my glow for later!", "Rise and shine! What a bright new day!"],
          night: ["Soft glow, quiet grove. Time to rest soon?", "I'll light your way to bed. Sleep well."],
          focus: ["Glowing softly. We've got this!", "Heads down, little light on. You're doing great."],
          done: ["What a session! I'm blinking with pride!", "You did it! The whole grove is glowing!"],
          task: ["BLINK! Another one done!", "Yes yes yes! Checked off and glowing!", "Woohoo! You're a shining star!", "Done! I'm lighting up the night for you!"],
          break: ["Break time! Let's flutter and stretch!", "Glow break! Grab a drink and rest your eyes!"]
        }
      }
    ]
  });

  /* Lavender Fields */
  COMP_DATA.push({
    theme: "lavenderfields",
    companions: [
      {
        id: "lavenderfields-lamb", name: "Lilac", kind: "Lavender Lamb", pose: "sit", sleepy: true,
        bio: "A woolly lamb who naps in the lavender rows while you study.",
        idle: ["earTwitch", "topBob", "bounce"], cheer: "hop",
        neck: [60, 72],
        parts: {
          back: `${RG("lavenderfields-lamb-w", [[0, "#FFFFFF"], [0.7, "#F6F1FC"], [1, "#DED3F1"]], 0.45, 0.4, 0.62)}
            <path d="${puff(60, 54, 25, 12, 1.2)}" fill="url(#lavenderfields-lamb-w)" ${O}/>`,
          earL: {svg: `<ellipse cx="35.5" cy="57" rx="9.6" ry="4.8" transform="rotate(22 35.5 57)" fill="#F7E2D8" ${O}/><ellipse cx="36.5" cy="57" rx="5" ry="2.2" transform="rotate(22 36.5 57)" fill="#F4B6C8"/>`, pivot: [43, 55]},
          earR: {svg: `<ellipse cx="84.5" cy="57" rx="9.6" ry="4.8" transform="rotate(-22 84.5 57)" fill="#F7E2D8" ${O}/><ellipse cx="83.5" cy="57" rx="5" ry="2.2" transform="rotate(-22 83.5 57)" fill="#F4B6C8"/>`, pivot: [77, 55]},
          feet: `<ellipse cx="46.5" cy="108.2" rx="6.4" ry="4.4" fill="#7C6A92" ${O}/><ellipse cx="73.5" cy="108.2" rx="6.4" ry="4.4" fill="#7C6A92" ${O}/>`,
          body: `${RG("lavenderfields-lamb-b", [[0, "#FFFFFF"], [0.65, "#F5F0FC"], [1, "#DCD0F0"]], 0.45, 0.35, 0.65)}
            <path d="${puff(60, 88, 20, 11, 1.18)}" fill="url(#lavenderfields-lamb-b)" ${O}/>
            <path d="M47 101Q60 106 73 101" fill="none" stroke="#D6CAEB" stroke-width="2.4" stroke-linecap="round"/>`,
          armL: {svg: `<path d="${puff(43, 93, 5.6, 6, 1.25)}" fill="#FFFFFF" ${O2}/>`, pivot: [45, 87]},
          armR: {svg: `<path d="${puff(77, 93, 5.6, 6, 1.25)}" fill="#FFFFFF" ${O2}/>`, pivot: [75, 87]},
          head: `${LG("lavenderfields-lamb-h", [[0, "#FFF4EC"], [1, "#F4D9CB"]])}
            <ellipse cx="60" cy="59" rx="18.5" ry="15.5" fill="url(#lavenderfields-lamb-h)" ${O}/>
            <path d="M46 55Q48 49 53.5 46.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>`,
          face: `<path d="M57.6 63.2Q60 62.4 62.4 63.2Q61.6 65.6 60 65.6Q58.4 65.6 57.6 63.2Z" fill="#C9849E" ${OW(1.4)}/>`,
          top: {svg: `${LINE("M65 41C67 35 69.5 30 73 25.5", "#6FA05A", 2)}
            <g fill="#8A5BC0" ${OW(1.6)}><ellipse cx="73.5" cy="24" rx="2.6" ry="3.4" transform="rotate(35 73.5 24)"/><ellipse cx="70" cy="29" rx="2.6" ry="3.4" transform="rotate(-20 70 29)"/><ellipse cx="75.8" cy="29.6" rx="2.6" ry="3.4" transform="rotate(40 75.8 29.6)"/><ellipse cx="68.6" cy="34.2" rx="2.4" ry="3.2" transform="rotate(-25 68.6 34.2)"/></g>
            <path d="${puff(60, 44, 8.5, 8, 1.25)}" fill="#FFFFFF" ${O2}/>`, pivot: [60, 47]}
        },
        eyes: {lx: 52, rx: 68, y: 58, r: 4.2, style: "dot", color: "#3A2A4A"},
        mouth: {x: 60, y: 68.2, w: 2.4, style: "cat", color: "#3A2A4A"},
        cheeks: {lx: 46.5, rx: 73.5, y: 65, w: 3.8, h: 2.4, color: "#FF9FB7"},
        anchors: {top: [60, 43, 0.85], neck: [60, 74, 1.0], chest: [70, 96, 0.68], back: [82, 86, 0.85], hands: [60, 95, 0.9]},
        lines: {
          tap: ["Baa! Hi! I'm so happy you're here!", "You're doing wonderfully! Woolly hug!", "Look at you, showing up again! Yay!", "Soft and steady, and so very strong!", "Every row of lavender cheers for you!", "You're on a roll today! Baa baa!", "I'm your fluffiest, biggest fan!"],
          pet: ["Baa! Hehe, my wool is so happy!", "Ooh, so cozy! I'm all fluffed up now!"],
          hello: ["You're back! Baa! I hopped right up!", "Hi hi! The lavender smells lovely today!"],
          morning: ["Good morning! The fields are purple! Let's go!", "Rise and shine! A fresh, sweet new day!"],
          night: ["Counting sheep for you tonight. Bed soon?", "Soft wool, sleepy fields. Rest well, friend."],
          focus: ["Calm fields, steady mind. We've got this!", "Heads down, I'm right here. You're doing great."],
          done: ["Baa baa! What a session! So proud!", "You did it! I'm doing happy little hops!"],
          task: ["BAA! Another one done!", "Yes yes yes! Checked off! Woolly cheers!", "Woohoo! You're amazing!", "Done! I'm frolicking in the lavender!"],
          break: ["Break time! Let's frolic and stretch!", "Lavender stroll? Grab a drink and relax!"]
        }
      },
      {
        id: "lavenderfields-sachet", name: "Lavi", kind: "Lavender Sachet", pose: "stand", wearColor: "#E58A6E",
        bio: "A little linen sachet stuffed with lavender and good calm thoughts.",
        idle: ["topBob", "waddle", "wave"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="50" cy="108.6" rx="6.4" ry="3.9" fill="#8A73B8" ${O}/><ellipse cx="70" cy="108.6" rx="6.4" ry="3.9" fill="#8A73B8" ${O}/>`,
          top: {svg: `${LINE("M55 39C53.5 32 51 27 47.5 23M60 38V20M65 39C66.5 32 69 27 72.5 23", "#6FA05A", 2)}
            <g fill="#9A6ED0" ${OW(1.6)}><ellipse cx="46.5" cy="21.5" rx="2.6" ry="3.6" transform="rotate(-35 46.5 21.5)"/><ellipse cx="49.8" cy="26.4" rx="2.5" ry="3.4" transform="rotate(-30 49.8 26.4)"/><ellipse cx="60" cy="16.5" rx="2.8" ry="3.8"/><ellipse cx="60" cy="22.8" rx="2.6" ry="3.4"/><ellipse cx="73.5" cy="21.5" rx="2.6" ry="3.6" transform="rotate(35 73.5 21.5)"/><ellipse cx="70.2" cy="26.4" rx="2.5" ry="3.4" transform="rotate(30 70.2 26.4)"/></g>`, pivot: [60, 40]},
          body: `${LG("lavenderfields-sachet-g", [[0, "#F6F0FF"], [0.55, "#DCCBF8"], [1, "#B79BEA"]])}
            <path d="M47.5 49C45 44 46 39 49.5 36.5Q53 39.5 56.5 36.5Q60 39.5 63.5 36.5Q67 39.5 70.5 36.5C74 39 75 44 72.5 49Z" fill="#F6F0FD" ${O}/>
            <path d="M60 50C80 50 88.5 70 88.5 86C88.5 101 78 108.5 60 108.5C42 108.5 31.5 101 31.5 86C31.5 70 40 50 60 50Z" fill="url(#lavenderfields-sachet-g)" ${O}/>
            <path d="M37.5 80Q38.5 67 46 58.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>
            <path d="M42 102Q60 107 78 102" fill="none" stroke="#A386DC" stroke-width="2.4" stroke-linecap="round"/>
            <rect x="46" y="46.5" width="28" height="6.4" rx="3.2" fill="#6A4BB0" ${O2}/>
            <path d="M58 49.7C53 44.5 46 45 46.5 49.7C46 54.4 53 55 58 49.7Z" fill="#F2A98A" ${O2}/>
            <path d="M62 49.7C67 44.5 74 45 73.5 49.7C74 54.4 67 55 62 49.7Z" fill="#F2A98A" ${O2}/>
            <circle cx="60" cy="49.7" r="3.2" fill="#E58A6E" ${O2}/>`,
          armL: {svg: `<ellipse cx="31" cy="85" rx="4.8" ry="7" transform="rotate(26 31 85)" fill="#CDB8F4" ${O}/>`, pivot: [36, 81]},
          armR: {svg: `<ellipse cx="89" cy="85" rx="4.8" ry="7" transform="rotate(-26 89 85)" fill="#CDB8F4" ${O}/>`, pivot: [84, 81]}
        },
        eyes: {lx: 50.5, rx: 69.5, y: 77, r: 4.6, style: "dot", color: "#2E2240"},
        mouth: {x: 60, y: 85.5, w: 3, color: "#2E2240"},
        cheeks: {lx: 42.5, rx: 77.5, y: 84, w: 4.4, h: 2.7, color: "#FF9FB7"},
        anchors: {top: [60, 40, 0.85], neck: [60, 51, 0.85], chest: [72, 97, 0.66], back: [86, 78, 0.85], hands: [60, 96, 0.85]},
        lines: {
          tap: ["Hi hi! I'm full of happy thoughts for you!", "You're doing so well! Sweet cheers!", "Look at you, calm and capable! Wow!", "Every breath in smells like success!", "Showing up again! I'm so proud of you!", "Stuffed full of good vibes, just for you!", "You make my little linen heart happy!"],
          pet: ["Ooh! A lovely puff of lavender for you!", "Hehe! I'm so squishy and happy now!"],
          hello: ["You're back! I'm fluttering with joy!", "Hi hi! I saved you a calm, cozy breath!"],
          morning: ["Good morning! Fresh lavender, fresh start!", "Rise and shine! Breathe in a happy day!"],
          night: ["Breathe in lavender. Time to rest soon?", "Calm thoughts, cozy pillow. Sleep well."],
          focus: ["Breathe in, heads down. We've got this!", "Calm and steady. You're doing great."],
          done: ["What a session! I'm bursting with pride!", "You did it! A big sweet puff of cheers!"],
          task: ["YAY! Another one done!", "Checked off! Lavender confetti for you!", "Woohoo! You're wonderful!", "Yes yes yes! Sweet success!"],
          break: ["Break time! Deep breath and a big stretch!", "Tea break? Something warm sounds lovely!"]
        }
      },
      {
        id: "lavenderfields-moth", name: "Velvet", kind: "Lavender Moth", pose: "float", size: 1.08,
        bio: "A fuzzy little moth who flutters over the lavender at golden hour.",
        idle: ["wingFlutter", "earTwitch", "sparkle"], cheer: "spin",
        parts: {
          wingL: {svg: `${LG("lavenderfields-moth-w", [[0, "#FFE9D6"], [1, "#F2A98A"]], 1, 0, 0, 1)}
            <path d="M45 56C38 44 25 34 17.5 37C11 40 14 54 23 60C16 66 17 77 25 79C33 81 41 74 45 66Z" fill="url(#lavenderfields-moth-w)" ${O}/>
            <circle cx="26" cy="48.5" r="4.4" fill="#A884F0" ${OW(2)}/><circle cx="27" cy="70" r="2.8" fill="#C9B0F5"/>
            <path d="M42 61Q32 60.5 24 60" fill="none" stroke="#D98A6A" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [44, 60]},
          wingR: {svg: `${LG("lavenderfields-moth-w2", [[0, "#FFE9D6"], [1, "#F2A98A"]], 0, 0, 1, 1)}
            <path d="M75 56C82 44 95 34 102.5 37C109 40 106 54 97 60C104 66 103 77 95 79C87 81 79 74 75 66Z" fill="url(#lavenderfields-moth-w2)" ${O}/>
            <circle cx="94" cy="48.5" r="4.4" fill="#A884F0" ${OW(2)}/><circle cx="93" cy="70" r="2.8" fill="#C9B0F5"/>
            <path d="M78 61Q88 60.5 96 60" fill="none" stroke="#D98A6A" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [76, 60]},
          earL: {svg: `<path d="M53.5 42C49 36 43 29 38 24.5C41.5 24 44.5 25 47 27C45.5 29 50 34 55.5 40.5Z" fill="#F2E3C8" ${OW(2)}/><path d="M54 40.5C49.5 35 45 29.5 39.5 25" fill="none" stroke="#B89A72" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [54, 42]},
          earR: {svg: `<path d="M66.5 42C71 36 77 29 82 24.5C78.5 24 75.5 25 73 27C74.5 29 70 34 64.5 40.5Z" fill="#F2E3C8" ${OW(2)}/><path d="M66 40.5C70.5 35 75 29.5 80.5 25" fill="none" stroke="#B89A72" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [66, 42]},
          body: `${RG("lavenderfields-moth-g", [[0, "#FFFFFF"], [0.6, "#F4EEFC"], [1, "#D6C8F0"]], 0.42, 0.36, 0.66)}
            <path d="${puff(60, 62, 21, 13, 1.2)}" fill="url(#lavenderfields-moth-g)" ${O}/>
            <path d="M44 55Q46.5 47.5 53 44" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>
            <path d="M48 81Q60 85 72 81" fill="none" stroke="#C4B2E6" stroke-width="2.2" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="41" cy="75" rx="4.4" ry="5.6" transform="rotate(28 41 75)" fill="#F4EEFC" ${O}/>`, pivot: [45, 72]},
          armR: {svg: `<ellipse cx="79" cy="75" rx="4.4" ry="5.6" transform="rotate(-28 79 75)" fill="#F4EEFC" ${O}/>`, pivot: [75, 72]}
        },
        eyes: {lx: 51, rx: 69, y: 61, r: 5.2, style: "sparkle", color: "#2E2240"},
        mouth: {x: 60, y: 70, w: 2.8, color: "#2E2240"},
        cheeks: {lx: 43.5, rx: 76.5, y: 68.5, w: 4.2, h: 2.6, color: "#FF9FB7"},
        anchors: {top: [60, 42, 0.85], neck: [60, 82, 0.95], chest: [72, 76, 0.6], back: [60, 58, 0.8], hands: [60, 80, 0.85]},
        lines: {
          tap: ["Flutter flutter! Hi! I'm so happy to see you!", "You're glowing like golden hour today!", "Look at you, showing up again! Wow!", "Every little step makes me flutter with joy!", "You're on fire today, softly and brightly!", "My fuzzy wings are cheering for you!", "You and the lavender, my favorite things!"],
          pet: ["Ooh! My fuzzy wings are all aflutter!", "Hehe! That's the softest pat ever!"],
          hello: ["You're back! I fluttered right over!", "Hi hi! Golden hour is better with you!"],
          morning: ["Good morning! Dew on the lavender! Let's go!", "Rise and flutter! What a lovely new day!"],
          night: ["Fluttering toward the moon. Bed soon?", "Soft wings, quiet fields. Rest well, friend."],
          focus: ["Gentle wings, steady you. We've got this!", "Heads down, I'll hover close. You're doing great."],
          done: ["What a session! I'm doing happy loops!", "You did it! My wings are fluttering with pride!"],
          task: ["FLUTTER! Another one done!", "Yes yes yes! Checked off! Wings up!", "Woohoo! You're a superstar!", "Done! I'm twirling over the lavender!"],
          break: ["Break time! Let's flutter and stretch!", "Golden hour break! Step outside for a bit!"]
        }
      }
    ]
  });

  /* City Rooftops */
  COMP_DATA.push({
    theme: "rooftops",
    companions: [
      {
        id: "rooftops-pigeon", name: "Cooper", kind: "Rooftop Pigeon", pose: "stand",
        bio: "A plump city pigeon who coos you on from the rooftop ledge.",
        idle: ["headTilt", "waddle", "wingFlutter"], cheer: "wingFlutter",
        neck: [60, 70],
        parts: {
          feet: `<ellipse cx="50" cy="109.4" rx="7" ry="3.8" fill="#F08C84" ${O}/><ellipse cx="70" cy="109.4" rx="7" ry="3.8" fill="#F08C84" ${O}/>`,
          body: `${LG("rooftops-pigeon-b", [[0, "#C9C3D8"], [1, "#948DAE"]])}
            ${LG("rooftops-pigeon-n", [[0, "#7ED3B8"], [0.5, "#8FB8E0"], [1, "#B08AD8"]], 0, 0, 1, 0)}
            <path d="M60 60C80 60 90 76 89 92C88 104 78 109.5 60 109.5C42 109.5 32 104 31 92C30 76 40 60 60 60Z" fill="url(#rooftops-pigeon-b)" ${O}/>
            <path d="M34.5 76C43 83 52 85.5 60 85.5C68 85.5 77 83 85.5 76L82 68C75 74 67 76.5 60 76.5C53 76.5 45 74 38 68Z" fill="url(#rooftops-pigeon-n)"/>
            <ellipse cx="60" cy="97" rx="16" ry="10.5" fill="#DCD7E6"/>
            <path d="M48 104Q60 108 72 104" fill="none" stroke="#B3ACC7" stroke-width="2.2" stroke-linecap="round"/>`,
          armL: {svg: `<path d="M37.5 74C28.5 80 25 91.5 28 99C34 97.5 39.5 89 41 78Z" fill="#8A84A3" ${O}/><path d="M30.5 88.5L38 86M30 94L36.5 92" stroke="#4F4A66" stroke-width="2.2" stroke-linecap="round"/>`, pivot: [38.5, 76]},
          armR: {svg: `<path d="M82.5 74C91.5 80 95 91.5 92 99C86 97.5 80.5 89 79 78Z" fill="#8A84A3" ${O}/><path d="M89.5 88.5L82 86M90 94L83.5 92" stroke="#4F4A66" stroke-width="2.2" stroke-linecap="round"/>`, pivot: [81.5, 76]},
          head: `${LG("rooftops-pigeon-h", [[0, "#D6D1E3"], [1, "#A49DBC"]])}
            <circle cx="60" cy="49" r="22" fill="url(#rooftops-pigeon-h)" ${O}/>
            <path d="M42 42Q45.5 33.5 54 30.5" fill="none" stroke="#F2F0F8" stroke-width="3" stroke-linecap="round"/>`,
          face: `<ellipse cx="60" cy="54.8" rx="3" ry="1.7" fill="#FFFFFF" ${OW(1.4)}/>`
        },
        eyes: {lx: 50.5, rx: 69.5, y: 48.5, r: 4.5, style: "dot", color: "#3A2233"},
        mouths: {
          neutral: `<path d="M56.6 56.8Q60 55.8 63.4 56.8L60 61.2Z" fill="#6E6680" ${OW(1.6)}/>`,
          smile: `<path d="M56.4 56.6Q60 55.4 63.6 56.6L60 61.4Z" fill="#6E6680" ${OW(1.6)}/><path d="M53.8 59.6q1.6 1.2 3.2 .3M66.2 59.6q-1.6 1.2 -3.2 .3" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`,
          open: `<path d="M56.8 58.4L63.2 58.4L60 62.2Z" fill="#FF8FA8" ${OW(1.4)}/><path d="M56.4 56.4Q60 55.4 63.6 56.4L60 58.8Z" fill="#6E6680" ${OW(1.6)}/><path d="M57.4 60.4L62.6 60.4L60 64Z" fill="#6E6680" ${OW(1.6)}/>`,
          sleepy: `<path d="M57 57Q60 56.2 63 57L60 60.6Z" fill="#6E6680" ${OW(1.6)}/>`
        },
        mouth: {x: 60, y: 58.5, w: 3},
        cheeks: {lx: 43.5, rx: 76.5, y: 57, w: 4.4, h: 2.7, color: "#FF9FB7"},
        anchors: {top: [60, 28, 1], neck: [60, 71, 1.05], chest: [71, 94, 0.75], back: [85, 86, 0.85], hands: [60, 95, 0.9]},
        lines: {
          tap: ["Coo coo! Hi! You made my whole day!", "You're doing amazing! Rooftop cheers!", "Look at you, showing up again! Yay!", "You're on fire today! Coo!", "Best view in the city? You, working hard!", "Every step counts! I'm cooing for you!", "I'm your biggest fan on this rooftop!"],
          pet: ["Coo coo! Hehe, my feathers are all puffy!", "Ooh! Happy little head bob for you!"],
          hello: ["You're back! Coo! I flew right over!", "Hi hi! Saved you the best spot on the ledge!"],
          morning: ["Good morning! The city is waking up! Let's go!", "Rise and shine! Big day, big coos!"],
          night: ["City lights are glowing. Time to rest soon?", "Soft coo, quiet roof. Sleep well, friend."],
          focus: ["Quiet coos only. We've got this!", "Heads down, I'm on the ledge. You're doing great."],
          done: ["Coo coo! What a session! So proud!", "You did it! I'm strutting with pride!"],
          task: ["COO! Another one done!", "Yes yes yes! Checked off! Flap flap!", "Woohoo! You're the best in the city!", "Done! I'm doing a happy rooftop strut!"],
          break: ["Break time! Let's strut and stretch!", "Snack break! I hear crumbs are delicious!"]
        }
      },
      {
        id: "rooftops-tower", name: "Cedar", kind: "Water Tower", pose: "stand",
        bio: "A sturdy wooden water tower who keeps you steady from up top.",
        idle: ["topBob", "wave", "waddle"], cheer: "bounce",
        parts: {
          feet: `<path d="M39 94H47V106.5H39Z" fill="#5B5575" ${O}/><path d="M73 94H81V106.5H73Z" fill="#5B5575" ${O}/>
            <ellipse cx="43" cy="108.5" rx="7" ry="3.2" fill="#4A4563" ${O}/><ellipse cx="77" cy="108.5" rx="7" ry="3.2" fill="#4A4563" ${O}/>`,
          body: `${LG("rooftops-tower-w", [[0, "#E7A06A"], [0.45, "#F2BC88"], [1, "#C77A44"]], 0, 0, 1, 0)}
            ${LG("rooftops-tower-r", [[0, "#7A73A0"], [1, "#4A4468"]])}
            <path d="M32 47C29 62 29 81 32 97H88C91 81 91 62 88 47Z" fill="url(#rooftops-tower-w)" ${O}/>
            <path d="M38.5 50C37 64 37 80 38.5 94M81.5 50C83 64 83 80 81.5 94" fill="none" stroke="#B0683A" stroke-width="2" stroke-linecap="round" opacity=".7"/>
            <path d="M31 56Q60 60 89 56" fill="none" stroke="#4F4A66" stroke-width="3.4" stroke-linecap="round"/>
            <path d="M31 88Q60 92 89 88" fill="none" stroke="#4F4A66" stroke-width="3.4" stroke-linecap="round"/>
            <path d="M34.5 62V82" stroke="#FFE0C0" stroke-width="3" stroke-linecap="round" opacity=".8"/>
            <path d="M57.5 20.5Q60 18.5 62.5 20.5L95.5 44.5Q97 48.5 92.5 48.8Q60 53 27.5 48.8Q23 48.5 24.5 44.5Z" fill="url(#rooftops-tower-r)" ${O}/>
            <path d="M40 39.5L56 26" fill="none" stroke="#A39CC8" stroke-width="2.6" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="27.5" cy="80" rx="4.6" ry="6.8" transform="rotate(26 27.5 80)" fill="#DC9460" ${O}/>`, pivot: [32.5, 76]},
          armR: {svg: `<ellipse cx="92.5" cy="80" rx="4.6" ry="6.8" transform="rotate(-26 92.5 80)" fill="#DC9460" ${O}/>`, pivot: [87.5, 76]},
          top: {svg: `${LINE("M60 21V14", "#5B5575", 2)}<circle cx="60" cy="11.5" r="3.6" fill="#FFD27F" ${O2}/>`, pivot: [60, 21]}
        },
        eyes: {lx: 50, rx: 70, y: 69, r: 4.8, style: "dot", color: "#2B1A1A"},
        mouth: {x: 60, y: 77.5, w: 3.2, color: "#2B1A1A"},
        cheeks: {lx: 42.5, rx: 77.5, y: 76, w: 4.4, h: 2.7, color: "#FF8F8F"},
        anchors: {top: [60, 21, 0.75], neck: [60, 51, 1.25], chest: [74, 84, 0.66], back: [89, 66, 0.85], hands: [60, 86, 0.9]},
        wearColor: "#3F80BD",
        lines: {
          tap: ["Hello up here! I'm so glad you came!", "Steady and strong, that's you! Wow!", "Look at you, showing up again! Yay!", "I've got your back from way up top!", "You're on fire today! Keep it flowing!", "Every bit of effort fills you up!", "Best view from the top? You, doing great!"],
          pet: ["Ooh! My planks are creaking with joy!", "Hehe! That's a happy little slosh!"],
          hello: ["You're back! The whole rooftop is cheering!", "Hi hi! I've been standing tall, waiting for you!"],
          morning: ["Good morning! Sunrise over the roofs! Let's go!", "Rise and shine! I'm full of good cheer today!"],
          night: ["The city's settling in. Time to rest too?", "Stars over the rooftops. Sleep well, friend."],
          focus: ["Steady as can be. We've got this!", "Heads down, I'm standing guard. You're doing great."],
          done: ["What a session! I'm overflowing with pride!", "You did it! Steady and strong the whole way!"],
          task: ["SPLASH! Another one done!", "Yes yes yes! Checked off! Overflowing!", "Woohoo! You're on top of the world!", "Done! I'm sloshing with happiness!"],
          break: ["Break time! Let's have a big drink of water!", "Stretch tall like a tower! Then relax!"]
        }
      },
      {
        id: "rooftops-moon", name: "Lune", kind: "Crescent Moon", pose: "float", sleepy: true,
        bio: "A drowsy crescent moon in a nightcap, glowing over the city roofs.",
        idle: ["topBob", "sparkle", "sway"], cheer: "spin",
        parts: {
          body: `${RG("rooftops-moon-g", [[0, "#FFF8DE"], [0.55, "#FFE3A8"], [1, "#F4BE62"]], 0.38, 0.55, 0.75)}
            <path d="M64.9 32.4A30 30 0 1 0 89.8 65.6A21 21 0 0 1 64.9 32.4Z" fill="url(#rooftops-moon-g)" ${O}/>
            <circle cx="38.5" cy="52" r="3.4" fill="#F2C47A" opacity=".8"/><circle cx="73" cy="84.5" r="2.4" fill="#F2C47A" opacity=".8"/><circle cx="35" cy="80" r="1.8" fill="#F2C47A" opacity=".8"/>
            <path d="M36.5 64Q37 48 48 38.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="29" cy="80" rx="4.4" ry="5.8" transform="rotate(30 29 80)" fill="#FFE3A8" ${O}/>`, pivot: [34, 77]},
          armR: {svg: `<ellipse cx="87" cy="81" rx="4.4" ry="5.8" transform="rotate(-30 87 81)" fill="#FFE3A8" ${O}/>`, pivot: [82, 78]},
          top: {svg: `${LG("rooftops-moon-c", [[0, "#8A83BE"], [1, "#5B5590"]])}
            <path d="M55.5 38C57 30 62 24 68 20C64 17 57 15 50.5 16C44 17 39.5 22 38 27C44 25.5 50 27 53 31Z" fill="url(#rooftops-moon-c)" ${O2}/>
            <circle cx="37.5" cy="28" r="4.2" fill="#FFFFFF" ${O2}/>
            <path d="M53 40.5C56.5 33 63 28 71 26.5Q73.5 30 72.5 33C66 34 61 37.5 58.5 42.5Q55 43 53 40.5Z" fill="#F4F0FA" ${O2}/>`, pivot: [63, 36]}
        },
        eyes: {lx: 46, rx: 62, y: 68, r: 4.4, style: "dot", color: "#3A2A3A"},
        mouth: {x: 54, y: 76, w: 2.8, color: "#3A2A3A"},
        cheeks: {lx: 39.5, rx: 68.5, y: 75, w: 4, h: 2.5, color: "#FF9A8C"},
        anchors: {top: [46, 36, 0.75], neck: [56, 88, 0.95], chest: [72, 80, 0.58], back: [30, 50, 0.8], hands: [56, 84, 0.85]},
        wearColor: "#6F68A8",
        lines: {
          tap: ["Oh hello! I'm glowing extra bright for you!", "You light up the city more than I do!", "Look at you, showing up again! Wow!", "You're shining today! I'm so proud!", "Every little step deserves a moonbeam!", "I'm your biggest fan in the whole sky!", "Night or day, I'm cheering for you!"],
          pet: ["Ooh! My nightcap is wiggling with joy!", "Hehe! I'm glowing all warm and happy!"],
          hello: ["You're back! I woke right up to say hi!", "Hi hi! The rooftops are glowing for you!"],
          morning: ["Good morning! Off to nap, but cheering for you!", "Rise and shine! The sun's turn, and yours!"],
          night: ["My nightcap is on. Time for yours too?", "Moonlight over the roofs. Sleep well, friend."],
          focus: ["Soft moonlight, steady mind. We've got this!", "Heads down, I'll glow quietly. You're doing great."],
          done: ["What a session! I'm beaming with pride!", "You did it! The whole sky is glowing!"],
          task: ["WOW! Another one done!", "Yes yes yes! Checked off! Moonbeams!", "Woohoo! You're a shining star!", "Done! I'm beaming over the whole city!"],
          break: ["Break time! Let's look out at the sky!", "Cozy break! Something warm and a stretch!"]
        }
      }
    ]
  });
})();



