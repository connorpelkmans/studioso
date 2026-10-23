/* ===== module: 98-comp-b2.js ===== */
/* Study Companions, batch 2 */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);

  /* Evergreen (forest) */
  COMP_DATA.push({
    theme: "forest",
    companions: [
      {
        id: "forest-hedgehog", name: "Bramble", kind: "Moss Hedgehog", pose: "sit", sleepy: true,
        bio: "A mossy little hedgehog with a mushroom friend on its back.",
        idle: ["earTwitch", "topBob", "bounce"], cheer: "spin",
        parts: {
          back: `${LG("forest-hedgehog-s", [[0, "#9BD68A"], [0.6, "#6BB26A"], [1, "#4A8F58"]])}
            <path d="M33.2 91.5Q15.6 91.4 29.3 80.4Q13.1 73.8 29.9 68.7Q17.2 56.5 34.7 58Q27.6 42 43.2 49.9Q42.5 32.4 54.1 45.6Q60 29 65.9 45.6Q77.5 32.4 76.8 49.9Q92.4 42 85.3 58Q102.8 56.5 90.1 68.7Q106.9 73.8 90.7 80.4Q104.4 91.4 86.8 91.5Q60 114 33.2 91.5Z" fill="url(#forest-hedgehog-s)" ${O}/>
            <path d="M31 70Q34 57 44 51" fill="none" stroke="#D2F0BE" stroke-width="3" stroke-linecap="round" opacity=".9"/>`,
          earL: {svg: `<circle cx="40" cy="55.5" r="6.6" fill="#F6E2C6" ${O}/><circle cx="40.2" cy="55.8" r="3" fill="#FFC1B8"/>`, pivot: [44, 59]},
          earR: {svg: `<circle cx="80" cy="55.5" r="6.6" fill="#F6E2C6" ${O}/><circle cx="79.8" cy="55.8" r="3" fill="#FFC1B8"/>`, pivot: [76, 59]},
          feet: `<ellipse cx="48" cy="108.5" rx="7" ry="4.2" fill="#D9AE84" ${O}/><ellipse cx="72" cy="108.5" rx="7" ry="4.2" fill="#D9AE84" ${O}/>`,
          body: `${LG("forest-hedgehog-b", [[0, "#FFF4E2"], [1, "#EDCFAA"]])}
            <ellipse cx="60" cy="80" rx="27" ry="28" fill="url(#forest-hedgehog-b)" ${O}/>
            <ellipse cx="60" cy="97" rx="14" ry="8.5" fill="#FFFAF1"/>
            <path d="M39.5 70Q42 61 49 56.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
          face: `<ellipse cx="60" cy="81.8" rx="3" ry="2.2" fill="${INK}"/><circle cx="59" cy="81" r=".8" fill="#fff"/>`,
          armL: {svg: `<ellipse cx="46.5" cy="97" rx="5.4" ry="6.6" transform="rotate(22 46.5 97)" fill="#E9C9A2" ${O}/>`, pivot: [43, 92]},
          armR: {svg: `<ellipse cx="73.5" cy="97" rx="5.4" ry="6.6" transform="rotate(-22 73.5 97)" fill="#E9C9A2" ${O}/>`, pivot: [77, 92]},
          top: {svg: `<path d="M64.2 43L65.4 34.5H72.2L73.4 43Z" fill="#FFF4E2" ${O2}/>
            <path d="M59.2 35.5C59.2 26 78.4 23.8 78.4 35.5Z" fill="#E8584A" ${O}/>
            <circle cx="64.5" cy="30.5" r="1.9" fill="#fff"/><circle cx="71.5" cy="29" r="1.5" fill="#fff"/><circle cx="74.6" cy="33" r="1.2" fill="#fff"/>`, pivot: [68, 43]}
        },
        eyes: {lx: 49.5, rx: 70.5, y: 75.5, r: 4.6, style: "dot", color: "#2B2233"},
        mouth: {x: 60, y: 86.5, w: 2.8, style: "cat"},
        cheeks: {lx: 42, rx: 78, y: 84, w: 4.4, h: 2.7},
        anchors: {top: [60, 42, 1], neck: [60, 92, 1.1], chest: [71, 99, 0.7], back: [89, 82, 0.9], hands: [60, 98, 0.9]},
        lines: {
          tap: ["Oh hi! You made my whole morning!", "Snuffle snuffle! You're here!", "You're doing wonderfully, truly!", "Little by little, look how far you've come!", "Little roots grow into big trees, like you!", "Snack and a sip, then back at it? Yay!", "My mushroom friend is cheering for you too!"],
          pet: ["Soft side up! Hehe, I love this!", "Eee, that tickles! Do it again!"],
          hello: ["You're back! The whole forest perked up!", "Hello! I saved you the comfiest mossy spot!"],
          morning: ["Good morning! Misty, fresh and full of hope!", "Rise and shine, little sprout! Big day ahead!"],
          night: ["Curl-up time soon? You did so well today.", "The owls are awake now. Your turn to rest!"],
          focus: ["Curling up right beside you. Let's go!", "Quiet as the pines. You've got this!"],
          done: ["Snuffle snuffle! Session complete! Hooray!", "Wow, what focus! I'm so proud of you!"],
          task: ["WOO! Done! Happy hedgehog snuffles!", "Yes yes yes! Another one all tidy!", "Look at that list grow shorter! Amazing!", "Gold star for you! You did it!"],
          break: ["Stretch up tall like a happy pine tree!", "Break time! Sip some water and wiggle!"]
        }
      },
      {
        id: "forest-pinecone", name: "Pinny", kind: "Pinecone Pal", pose: "stand",
        bio: "A plucky pinecone who drops by to cheer on every small win.",
        idle: ["topBob", "wave", "waddle"], cheer: "spin",
        parts: {
          feet: `<ellipse cx="51" cy="107.5" rx="7" ry="4.2" fill="#6E3C1C" ${O}/><ellipse cx="69" cy="107.5" rx="7" ry="4.2" fill="#6E3C1C" ${O}/>`,
          body: `${LG("forest-pinecone-g", [[0, "#DE9D62"], [0.55, "#BC7440"], [1, "#8C5029"]], 0.2, 0, 0.8, 1)}
            <path d="M60 24C79 24 91 42 91 64C91 88 77 105 60 105C43 105 29 88 29 64C29 42 41 24 60 24Z" fill="url(#forest-pinecone-g)" ${O}/>
            <path d="M42 35q6 7 12 0q6 7 12 0q6 7 12 0M32.5 46q6.9 7.4 13.75 0q6.9 7.4 13.75 0q6.9 7.4 13.75 0q6.9 7.4 13.75 0M32 84q7 7.4 14 0q7 7.4 14 0q7 7.4 14 0q7 7.4 14 0M40.5 95q6.5 6.4 13 0q6.5 6.4 13 0q6.5 6.4 13 0" fill="none" stroke="#7A4020" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M36.5 60Q37.5 55.5 41 54" fill="none" stroke="#F4C894" stroke-width="3" stroke-linecap="round"/>
            <path d="M47.5 30Q52 27 57 26.5" fill="none" stroke="#F4C894" stroke-width="3" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="31" cy="78" rx="4.6" ry="6.8" transform="rotate(30 31 78)" fill="#9C5A2E" ${O}/>`, pivot: [37, 76]},
          armR: {svg: `<ellipse cx="89" cy="78" rx="4.6" ry="6.8" transform="rotate(-30 89 78)" fill="#9C5A2E" ${O}/>`, pivot: [83, 76]},
          top: {svg: `${LINE("M60 25.5V19", "#7A4A2A", 2.6)}${LINE("M60 20L52.5 12.5M60 20V9.5M60 20L67.5 12.5", "#4FAE6A", 2.8)}`, pivot: [60, 25]}
        },
        eyes: {lx: 49, rx: 71, y: 64, r: 5, style: "dot", color: "#2B1A10"},
        mouth: {x: 60, y: 73.5, w: 3.2, color: "#2B1A10"},
        cheeks: {lx: 41.5, rx: 78.5, y: 72.5, w: 4.4, h: 2.7, color: "#FF9A8A"},
        anchors: {top: [60, 27, 0.9], neck: [60, 86, 1.2], chest: [73, 94, 0.7], back: [87, 66, 0.85], hands: [60, 92, 0.9]},
        lines: {
          tap: ["Hi hi! Fresh from the tall pines for you!", "You're growing so much, I can tell!", "Tiny seeds make huge forests. Go you!", "Keep going, you're doing amazing!", "So proud of you for showing up today!", "Scale by scale, you're getting there!", "Breathe in that pine air! Feels great, right?"],
          pet: ["Hehe, my scales tickle! I love it!", "Aww, gentle pats! Best day ever!"],
          hello: ["Hello! I dropped in just to see you!", "You're back! Ready to branch out together?"],
          morning: ["Good morning! Sunshine through the pines!", "Morning! Let's grow something great today!"],
          night: ["Even tall trees rest. Bed soon, friend?", "It's getting late. Let's sleep on it."],
          focus: ["Reading right along with you. Let's go!", "Deep roots, calm mind. You've got this!"],
          done: ["Congratulations! What a session!", "What a sturdy, wonderful session! Yay!"],
          task: ["WOO! Done and dusted!", "You did it! I knew you would!", "Another ring on the tree! Amazing!", "Yes yes yes! Done and done!"],
          break: ["Stretch up tall like the mightiest pine!", "Break time! Go grab some fresh air!"]
        }
      },
      {
        id: "forest-squirrel", name: "Hazel", kind: "Flying Squirrel", pose: "float",
        bio: "A gentle flying squirrel who glides down from the misty treetops.",
        idle: ["wingFlutter", "earTwitch", "tailSwish"], cheer: "spin",
        neck: [60, 76],
        parts: {
          tail: {svg: `${LG("forest-squirrel-t", [[0, "#C9D0DC"], [1, "#98A2B6"]])}
            <path d="M66 86C80 85 95 78 100.5 64C105.5 51 102 37 91.5 32.5C83 29 76.5 35.5 79.5 42C82 47.5 88.5 46 89.5 53C90.5 61 81 69 68 74Z" fill="url(#forest-squirrel-t)" ${O}/>
            <path d="M95.5 42Q99 54 92 66" fill="none" stroke="#EEF1F6" stroke-width="2.6" stroke-linecap="round"/>`, pivot: [70, 80]},
          wingL: {svg: `${LG("forest-squirrel-w", [[0, "#BFC7D5"], [1, "#9AA5B9"]])}
            <path d="M48 73C40 70 31 68 25.5 71.5C22 78.5 25 89 32 95.5C39 95 45 94 50 91Z" fill="url(#forest-squirrel-w)" ${O}/>
            <path d="M27.5 77Q28 87 33.5 92" fill="none" stroke="#EEF1F6" stroke-width="2.4" stroke-linecap="round"/>
            <circle cx="25.5" cy="71.5" r="3.6" fill="#FFF3E4" ${O2}/>`, pivot: [48, 80]},
          wingR: {svg: `${LG("forest-squirrel-w2", [[0, "#BFC7D5"], [1, "#9AA5B9"]])}
            <path d="M72 73C80 70 89 68 94.5 71.5C98 78.5 95 89 88 95.5C81 95 75 94 70 91Z" fill="url(#forest-squirrel-w2)" ${O}/>
            <path d="M92.5 77Q92 87 86.5 92" fill="none" stroke="#EEF1F6" stroke-width="2.4" stroke-linecap="round"/>
            <circle cx="94.5" cy="71.5" r="3.6" fill="#FFF3E4" ${O2}/>`, pivot: [72, 80]},
          earL: {svg: `<path d="M40.5 40C35 31 38 22 44.5 22C49.5 23 51.5 29 51 35Z" fill="#AEB7C8" ${O}/><path d="M42.5 35C40 30 41 26 44.5 26C47 27 48 30 47.5 33Z" fill="#FFC6CF"/>`, pivot: [46, 37]},
          earR: {svg: `<path d="M79.5 40C85 31 82 22 75.5 22C70.5 23 68.5 29 69 35Z" fill="#AEB7C8" ${O}/><path d="M77.5 35C80 30 79 26 75.5 26C73 27 72 30 72.5 33Z" fill="#FFC6CF"/>`, pivot: [74, 37]},
          feet: `<ellipse cx="52" cy="97" rx="5" ry="3.8" fill="#FFF3E4" ${O}/><ellipse cx="68" cy="97" rx="5" ry="3.8" fill="#FFF3E4" ${O}/>`,
          body: `${LG("forest-squirrel-b", [[0, "#BFC7D5"], [1, "#98A2B6"]])}
            <ellipse cx="60" cy="84" rx="16" ry="13" fill="url(#forest-squirrel-b)" ${O}/>
            <ellipse cx="60" cy="87" rx="10" ry="8.5" fill="#FFF4E6"/>`,
          head: `${LG("forest-squirrel-h", [[0, "#D3DAE5"], [1, "#A3AEC1"]])}
            <circle cx="60" cy="54" r="24" fill="url(#forest-squirrel-h)" ${O}/>
            <ellipse cx="60" cy="66" rx="14.5" ry="9.5" fill="#FFF4E6"/>
            <path d="M42 45Q45.5 37 53.5 33.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".75"/>`,
          face: `<path d="M57.8 61.6h4.4l-2.2 2.4Z" fill="#FF8FA8" ${OW(1.4)}/>`
        },
        eyes: {lx: 48.5, rx: 71.5, y: 54, r: 6, style: "dot", color: "#23202E"},
        mouth: {x: 60, y: 66, w: 2.6, style: "cat"},
        cheeks: {lx: 42.5, rx: 77.5, y: 63.5, w: 4.2, h: 2.6},
        anchors: {top: [60, 31, 0.95], neck: [60, 77, 0.95], chest: [67, 88, 0.6], back: [37, 63, 0.8], hands: [60, 85, 0.85]},
        lines: {
          tap: ["Wheee! Hi there, friend!", "Gliding by just to say hello to you!", "You're soaring today! Look at you!", "Small leaps add up to big flights!", "You've totally got this! Keep gliding!", "The view is lovely, and so are you!", "Loving your progress so much!"],
          pet: ["Hehe, my tail won't stop wiggling!", "So soft and floaty! I love this!"],
          hello: ["Hi! I glided straight over to see you!", "Hello from the treetops! You're back!"],
          morning: ["Good morning! The mist is lifting for you!", "Morning, high flyer! Let's soar today!"],
          night: ["Moon's up. Cozy nest time soon?", "Late glide, friend. Rest those wings soon."],
          focus: ["Settled in right beside you. Let's go!", "Calm branch, calm mind. You've got this!"],
          done: ["Wheee! What a beautiful glide!", "Session done! You're sky high!"],
          task: ["Wheee! DONE! You did it!", "Nailed the landing! Amazing!", "Up and over! Yes yes yes!", "Soaring along! Another one done!"],
          break: ["Spread out wide and stretch! Wheee!", "Break time! Grab a crunchy snack!"]
        }
      }
    ]
  });

  /* Galaxy */
  COMP_DATA.push({
    theme: "galaxy",
    companions: [
      {
        id: "galaxy-planet", name: "Orbi", kind: "Little Planet", pose: "float",
        bio: "A tiny ringed planet who orbits your desk and twinkles with pride.",
        idle: ["spin", "sparkle", "finWiggle"], cheer: "spin",
        parts: {
          back: `<ellipse cx="60" cy="72" rx="48" ry="11.5" transform="rotate(-10 60 72)" fill="none" stroke="${INK}" stroke-width="9.6"/>
            <ellipse cx="60" cy="72" rx="48" ry="11.5" transform="rotate(-10 60 72)" fill="none" stroke="#FFD66B" stroke-width="4.8"/>`,
          body: `${RG("galaxy-planet-g", [[0, "#FFF0F8"], [0.5, "#FFC2E1"], [1, "#E98CC0"]], 0.4, 0.32, 0.72)}
            <circle cx="60" cy="61" r="31" fill="url(#galaxy-planet-g)"/>
            <path d="M40.4 37Q60 41.5 79.6 37L85.9 44Q60 49.5 34.1 44Z" fill="#B9A6FF"/>
            <circle cx="60" cy="61" r="31" fill="none" ${O}/>
            <path d="M36.5 56Q37.5 46 44 40" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>
            <path d="M12 72A48 11.5 0 0 0 108 72" transform="rotate(-10 60 72)" fill="none" stroke="${INK}" stroke-width="9.6" stroke-linecap="round"/>
            <path d="M12 72A48 11.5 0 0 0 108 72" transform="rotate(-10 60 72)" fill="none" stroke="#FFD66B" stroke-width="4.8" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="26.5" cy="59" rx="4.8" ry="6.2" transform="rotate(30 26.5 59)" fill="#FFB5DA" ${O}/>`, pivot: [33, 60]},
          armR: {svg: `<ellipse cx="93.5" cy="59" rx="4.8" ry="6.2" transform="rotate(-30 93.5 59)" fill="#FFB5DA" ${O}/>`, pivot: [87, 60]}
        },
        eyes: {lx: 49, rx: 71, y: 59, r: 5.4, style: "sparkle", color: "#2C1F6B"},
        mouth: {x: 60, y: 69, w: 3.2, color: "#2C1F6B"},
        cheeks: {lx: 40.5, rx: 79.5, y: 67, w: 4.6, h: 2.8, color: "#FF7FB6"},
        anchors: {top: [60, 30, 1.05], neck: [60, 87, 1.2], chest: [73, 79, 0.62], back: [87, 44, 0.85], hands: [60, 83, 0.9]},
        lines: {
          tap: ["Hi! I orbited all the way over to you!", "So glad you're here! My rings are sparkling!", "Hi hi! You light up my whole sky!", "Small steps make giant leaps!", "Keep shining, star student!", "Cosmic idea: a sip of water? Yay!", "You're doing stellar today!"],
          pet: ["Hehe, you set me spinning! Wheee!", "Look, my rings are glowing for you!"],
          hello: ["Hello, space friend! You're back!", "Welcome back to orbit! I missed you!"],
          morning: ["Good morning! The sun's up here too!", "Morning, stargazer! A brand new orbit!"],
          night: ["The stars are out. Rest soon, friend?", "The moon's up. Time to drift off?"],
          focus: ["Quiet orbit mode. Let's go!", "Calm as space. You've totally got this!"],
          done: ["Stellar session! Wow!", "One full orbit! I'm so proud of you!"],
          task: ["WOO! Done! Stellar!", "Yes! Another star in your sky!", "Out of this world! Done!", "Zoom! One more off the list!"],
          break: ["Float around and stretch a bit! Fun!", "Break time! Drift away for a moment!"]
        }
      },
      {
        id: "galaxy-alien", name: "Zib", kind: "Little Alien", pose: "stand", wearColor: "#F5B83D",
        bio: "A friendly little alien who flew in to learn Earth things with you.",
        idle: ["earTwitch", "wave", "headTilt"], cheer: "bounce",
        neck: [60, 70],
        parts: {
          earL: {svg: `${LINE("M50 33C48 27 43 23 38.5 21", "#8FE3C8", 2.6)}<path d="M37 12L38.7 15.7L42.7 16.1L39.8 18.9L40.5 22.9L37 20.9L33.5 22.9L34.2 18.9L31.3 16.1L35.3 15.7Z" fill="#FFD66B" ${O2}/>`, pivot: [50, 33]},
          earR: {svg: `${LINE("M70 33C72 27 77 23 81.5 21", "#8FE3C8", 2.6)}<path d="M83 12L84.7 15.7L88.7 16.1L85.8 18.9L86.5 22.9L83 20.9L79.5 22.9L80.2 18.9L77.3 16.1L81.3 15.7Z" fill="#FFD66B" ${O2}/>`, pivot: [70, 33]},
          feet: `<ellipse cx="51" cy="108" rx="7.4" ry="4.4" fill="#4A36B8" ${O}/><ellipse cx="69" cy="108" rx="7.4" ry="4.4" fill="#4A36B8" ${O}/>`,
          body: `${LG("galaxy-alien-b", [[0, "#AE9BFF"], [1, "#6B4EE6"]])}
            <path d="M45 72C45 67 75 67 75 72L78.5 97C79 103 74 106.5 60 106.5C46 106.5 41 103 41.5 97Z" fill="url(#galaxy-alien-b)" ${O}/>
            <path d="M43.5 93Q60 97 76.5 93" fill="none" stroke="#D9CFFF" stroke-width="3" stroke-linecap="round"/>
            <circle cx="60" cy="95.6" r="2.6" fill="#FFD66B" ${OW(1.6)}/>
            <path d="M49 77Q48 84 47.5 89" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".55"/>`,
          armL: {svg: `<ellipse cx="41" cy="84" rx="5" ry="8" transform="rotate(24 41 84)" fill="#8F77F5" ${O}/><circle cx="37" cy="91" r="4" fill="#9FE8D0" ${O2}/>`, pivot: [46, 77]},
          armR: {svg: `<ellipse cx="79" cy="84" rx="5" ry="8" transform="rotate(-24 79 84)" fill="#8F77F5" ${O}/><circle cx="83" cy="91" r="4" fill="#9FE8D0" ${O2}/>`, pivot: [74, 77]},
          head: `${LG("galaxy-alien-h", [[0, "#C9F7E6"], [1, "#78D6B9"]])}
            <ellipse cx="60" cy="50" rx="27.5" ry="22" fill="url(#galaxy-alien-h)" ${O}/>
            <path d="M39 42Q43 34 51.5 31" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/>
            <circle cx="60" cy="34" r="2.2" fill="#62C3A6"/><circle cx="67.5" cy="35.5" r="1.5" fill="#62C3A6"/>`
        },
        eyes: {lx: 48.5, rx: 71.5, y: 52, r: 6.4, style: "dot", color: "#1E1740"},
        mouth: {x: 60, y: 62.5, w: 3, color: "#1E1740"},
        cheeks: {lx: 40, rx: 80, y: 60, w: 4.2, h: 2.6, color: "#FF9FCF"},
        anchors: {top: [60, 29, 1], neck: [60, 71, 0.95], chest: [69, 85, 0.7], back: [81, 86, 0.85], hands: [60, 90, 0.9]},
        lines: {
          tap: ["Greetings, Earth friend! Yay!", "Beep boop! You are so great!", "Earth studying is the coolest thing!", "Take me to your notes! I'm so excited!", "You are my absolute favorite human!", "Tiny steps, cosmic results! Beep!", "My antennae sense a big win coming!"],
          pet: ["Beep! Antenna tickles! Hehe!", "Zib is very, very happy! Beep beep!"],
          hello: ["Greetings! Zib missed you so much!", "Landing complete! You're back! Hooray!"],
          morning: ["Good morning, Earthling! Beep!", "Your sun is so pretty! Hello, friend!"],
          night: ["Earthlings need sleep. Rest soon?", "Powering down soon? Beep, sweet dreams."],
          focus: ["Study mode engaged! Let's go!", "Reading Earth books with you! Shh, beep."],
          done: ["Mission complete! Beep beep!", "Amazing focus, Earth friend! Wow!"],
          task: ["Beep! DONE! Zib is cheering!", "Mission accomplished! Hooray!", "Zib is so impressed! Beep beep!", "One small step, one giant win!"],
          break: ["Stretch time, Earthling! Wiggle those arms!", "Refuel break! Water first, then snacks!"]
        }
      },
      {
        id: "galaxy-moonrock", name: "Moonie", kind: "Moon Rock", pose: "sit", sleepy: true,
        bio: "A sleepy little moon rock with a crystal crown that glows at night.",
        idle: ["topBob", "sway", "sparkle"], cheer: "bounce",
        parts: {
          body: `${LG("galaxy-moonrock-g", [[0, "#FFFEF6"], [0.55, "#F6EFD6"], [1, "#D9CBA6"]], 0.25, 0, 0.75, 1)}
            <path d="M24 99C22.5 83 29 66 42 58.5C49.5 53.5 57 51 65.5 51.5C82 52.5 94 64 96 82C97 93.5 96.5 103.5 90.5 107.5C80.5 111 40 111 30 108C26 106.5 24 103.5 24 99Z" fill="url(#galaxy-moonrock-g)" ${O}/>
            <circle cx="37" cy="72" r="5.6" fill="#D9C9A0"/><path d="M32.6 70.8Q34.8 67.2 39.4 67.6" fill="none" stroke="#B39D70" stroke-width="1.6" stroke-linecap="round"/>
            <circle cx="80" cy="64" r="4.6" fill="#D9C9A0"/><path d="M76.8 62.8Q78.6 59.6 82.2 60" fill="none" stroke="#B39D70" stroke-width="1.6" stroke-linecap="round"/>
            <circle cx="87" cy="95" r="4.6" fill="#DCCDA6"/><circle cx="33" cy="98" r="2.8" fill="#DCCDA6"/>
            <path d="M31 86Q31.5 72 40 63" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".8"/>
            <path d="M44 105Q60 108.5 76 105" fill="none" stroke="#BFAE88" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>`,
          armL: {svg: `<ellipse cx="28" cy="89" rx="4.6" ry="6.2" transform="rotate(30 28 89)" fill="#F3EAD0" ${O}/>`, pivot: [33, 87]},
          armR: {svg: `<ellipse cx="92" cy="89" rx="4.6" ry="6.2" transform="rotate(-30 92 89)" fill="#F3EAD0" ${O}/>`, pivot: [87, 87]},
          top: {svg: `<path d="M48.5 55.5L48 41.5L56.5 53Z" fill="#9FE3FF" ${O2}/><path d="M54.5 54L60.5 29.5L67 54Z" fill="#C3AEFF" ${O2}/><path d="M65 53.5L73 39L73.5 55.5Z" fill="#FFA8D8" ${O2}/>
            <path d="M59.6 35.5L58.2 47.5" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".9"/>`, pivot: [61, 54]}
        },
        eyes: {lx: 48, rx: 72, y: 80, r: 5, style: "dot", color: "#3A2A5C"},
        mouth: {x: 60, y: 89, w: 3, color: "#3A2A5C"},
        cheeks: {lx: 40, rx: 80, y: 87.5, w: 4.4, h: 2.7, color: "#FF9FB0"},
        anchors: {top: [60, 53, 0.95], neck: [60, 97, 1.3], chest: [76, 100, 0.7], back: [92, 76, 0.9], hands: [60, 99, 0.9]},
        lines: {
          tap: ["Hi! You're doing so well today!", "Rock solid work! I love it!", "Steady as a stone, that's you!", "Look at that steady effort! Wow!", "Crystals grow slowly too, and they shine!", "Take your time! Rocks love a slow, steady win!", "You make my crystals glow so bright!"],
          pet: ["Ooh, my crystals are twinkling!", "Mmm, warm moonbeam pats! Thank you!"],
          hello: ["Welcome back! I'm so happy you're here!", "Hello! I kept the moon on just for you!"],
          morning: ["Morning! Still sleepy, but so happy to see you!", "Good morning, moonbeam! Let's shine!"],
          night: ["The moon is high. Bedtime soon?", "Sleepy crystals... rest up, friend."],
          focus: ["I'll glow quietly. You shine! Let's go!", "Still and calm. You've got this!"],
          done: ["Rock solid session! Wow!", "All done! My crystals are glowing for you!"],
          task: ["You rock! DONE!", "Solid! Another one checked off!", "Another gem collected! Sparkly!", "Yes! Crystal clear win!"],
          break: ["Stretch slowly, like the tide! Ahh!", "Break time! Sip some water and twinkle!"]
        }
      }
    ]
  });

  /* Northern Lights (arctic) */
  COMP_DATA.push({
    theme: "arctic",
    companions: [
      {
        id: "arctic-bear", name: "Mallow", kind: "Polar Bear Cub", pose: "stand",
        bio: "A marshmallow-soft polar bear cub who loves watching the aurora.",
        idle: ["earTwitch", "wave", "headTilt"], cheer: "hop",
        neck: [60, 72],
        parts: {
          earL: {svg: `<circle cx="41" cy="33.5" r="7.6" fill="#F4F8FC" ${O}/><circle cx="41.3" cy="33.8" r="3.6" fill="#BFDDF2"/>`, pivot: [45, 38]},
          earR: {svg: `<circle cx="79" cy="33.5" r="7.6" fill="#F4F8FC" ${O}/><circle cx="78.7" cy="33.8" r="3.6" fill="#BFDDF2"/>`, pivot: [75, 38]},
          feet: `<ellipse cx="48" cy="108.5" rx="8.2" ry="4.6" fill="#EEF4FA" ${O}/><ellipse cx="72" cy="108.5" rx="8.2" ry="4.6" fill="#EEF4FA" ${O}/>`,
          body: `${LG("arctic-bear-b", [[0, "#FFFFFF"], [1, "#CFDEEC"]])}
            <path d="M60 69C79 69 87.5 83 87.5 95C87.5 105.5 78 109.5 60 109.5C42 109.5 32.5 105.5 32.5 95C32.5 83 41 69 60 69Z" fill="url(#arctic-bear-b)" ${O}/>
            <ellipse cx="60" cy="95" rx="15" ry="11" fill="#FFFFFF"/>`,
          armL: {svg: `<ellipse cx="38" cy="88" rx="6.2" ry="9.2" transform="rotate(22 38 88)" fill="#F2F7FC" ${O}/>`, pivot: [43, 80]},
          armR: {svg: `<ellipse cx="82" cy="88" rx="6.2" ry="9.2" transform="rotate(-22 82 88)" fill="#F2F7FC" ${O}/>`, pivot: [77, 80]},
          head: `${LG("arctic-bear-h", [[0, "#FFFFFF"], [0.65, "#F3F8FC"], [1, "#D3E2EF"]])}
            <circle cx="60" cy="52" r="24.5" fill="url(#arctic-bear-h)" ${O}/>
            <path d="M42 42Q46 34 54 31" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
          face: `<ellipse cx="60" cy="63.5" rx="10" ry="7.4" fill="#FFFFFF" stroke="#C4D7E8" stroke-width="1.6"/>
            <path d="M56.2 59.4Q60 57.8 63.8 59.4Q62.2 63.4 60 63.6Q57.8 63.4 56.2 59.4Z" fill="${INK}"/><circle cx="58.6" cy="59.6" r=".8" fill="#fff"/>`
        },
        eyes: {lx: 48, rx: 72, y: 52.5, r: 4.6, style: "dot", color: "#1B2A3E"},
        mouth: {x: 60, y: 66.8, w: 2.6, style: "cat", color: "#1B2A3E"},
        cheeks: {lx: 41, rx: 79, y: 61, w: 4.4, h: 2.7},
        anchors: {top: [60, 29, 1], neck: [60, 73, 1.05], chest: [70, 90, 0.75], back: [85, 86, 0.9], hands: [60, 94, 0.95]},
        lines: {
          tap: ["Hi! Big bear hug incoming!", "Soft paws, strong mind! That's you!", "You're doing so, so well!", "Look, the sky is dancing for you!", "Steady on the ice! You're amazing!", "Icy fresh water break? Yes please!", "I'm so proud of you, truly!"],
          pet: ["Hehe, fluffy bear hugs! Yay!", "Mmm, so soft and cozy! Thank you!"],
          hello: ["You're back! Come sit by me!", "Hello! I kept a snowy seat just for you!"],
          morning: ["Good morning! Crisp, bright and lovely!", "Rise and shine, cub! Big day ahead!"],
          night: ["Even bears curl up. Bed soon, friend?", "Late lights. Time to rest your eyes."],
          focus: ["Let's read by the aurora! Here we go!", "Calm as snowfall. You've got this!"],
          done: ["What a wonderful session! Paws up!", "Session done! I'm so proud of you!"],
          task: ["WOO! Done! Paws up high!", "Yes yes yes! Brilliant work!", "Smooth as ice! Another one done!", "Big bear cheer! You did it!"],
          break: ["Big bear stretch! Reach up high!", "Warm drink and a stretch? Sounds perfect!"]
        }
      },
      {
        id: "arctic-seal", name: "Pebble", kind: "Seal Pup", pose: "sit", sleepy: true,
        bio: "A round little seal pup who dozes on the ice while you study.",
        idle: ["finWiggle", "tailSwish", "bounce"], cheer: "wingFlutter",
        parts: {
          tail: {svg: `<path d="M86 101C92 96.5 100 95 104.5 99C102 102.5 101 105.5 104.5 109.5C98.5 111.5 91.5 109.5 86 106.5Z" fill="#9AAEC6" ${O}/>`, pivot: [87, 104]},
          body: `${LG("arctic-seal-g", [[0, "#E4ECF4"], [0.6, "#C3D1E0"], [1, "#9FB2C8"]])}
            <path d="M60 50C80 50 92.5 66 93 84C93.5 102 82 110.5 60 110.5C38 110.5 26.5 102 27 84C27.5 66 40 50 60 50Z" fill="url(#arctic-seal-g)" ${O}/>
            <path d="M36 72Q38.5 61 47.5 55.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>
            <circle cx="61" cy="57" r="2" fill="#93A6BE"/><circle cx="71" cy="59.5" r="1.5" fill="#93A6BE"/><circle cx="81" cy="67" r="2.2" fill="#93A6BE"/><circle cx="84" cy="96" r="1.6" fill="#93A6BE"/>
            <path d="M44 104Q60 109 76 104" fill="none" stroke="#8EA3BC" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>`,
          face: `<ellipse cx="60" cy="84" rx="2.9" ry="2.2" fill="${INK}"/><circle cx="59" cy="83.3" r=".8" fill="#fff"/>
            <path d="M35.5 84.5l-5.5-1.2M35.5 88.5l-5.5 1.2M84.5 84.5l5.5-1.2M84.5 88.5l5.5 1.2" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="31" cy="97" rx="5.4" ry="10" transform="rotate(38 31 97)" fill="#A9BBD0" ${O}/>`, pivot: [37, 92]},
          armR: {svg: `<ellipse cx="89" cy="97" rx="5.4" ry="10" transform="rotate(-38 89 97)" fill="#A9BBD0" ${O}/>`, pivot: [83, 92]}
        },
        eyes: {lx: 47, rx: 73, y: 76.5, r: 6.2, style: "dot", color: "#1F2A3A"},
        mouth: {x: 60, y: 88.5, w: 2.6, style: "cat", color: "#1F2A3A"},
        cheeks: {lx: 40, rx: 80, y: 86, w: 4.4, h: 2.7},
        anchors: {top: [60, 51, 1], neck: [60, 97, 1.2], chest: [74, 100, 0.7], back: [90, 76, 0.9], hands: [60, 101, 0.9]},
        lines: {
          tap: ["Arf! Hi there, friend!", "You're doing really, really well!", "Go with the flow! You've got this!", "Every day counts! Arf!", "Flipper high five! Yay!", "Rest is part of studying too! Hooray!", "I think you're the greatest!"],
          pet: ["Arf arf! So happy! Hehe!", "Wiggle wiggle! I love pats!"],
          hello: ["Arf! You're back! Yay!", "Hi! The ice is extra comfy today!"],
          morning: ["Good morning! Let's flop into the day!", "Morning, sunshine! Arf arf!"],
          night: ["Yawn... ice nap time soon?", "It's late. Let's both rest soon."],
          focus: ["Napping right here. You've got this!", "Quiet as the snow. Let's go!"],
          done: ["Arf! You did it! Amazing!", "Session done! Flipper clap for you!"],
          task: ["Arf! DONE! Yay!", "Seal of approval! Hooray!", "Great job! Flippers up!", "Another one done! Wiggle dance!"],
          break: ["Flop and stretch! So fun!", "Break time! Splash some water on!"]
        }
      },
      {
        id: "arctic-narwhal", name: "Aura", kind: "Narwhal Calf", pose: "float",
        bio: "A baby narwhal who swam up through the aurora to cheer you on.",
        idle: ["finWiggle", "topBob", "sparkle"], cheer: "spin",
        parts: {
          tail: {svg: `<path d="M86 80C93 79.5 98 76 100 70.5C95.5 67 98 60.5 103.5 60.5C109.5 62 110 70 106.5 72.5C110.5 76.5 108 82.5 102.5 82.5C98.5 88 92.5 90 86 88Z" fill="#A796F2" ${O}/>`, pivot: [86, 84]},
          body: `${LG("arctic-narwhal-g", [[0, "#B2F4DC"], [0.5, "#86CFEC"], [1, "#A594F2"]], 0.2, 0, 0.8, 1)}
            <path d="M60 36C80 36 92 50 92 66C92 84 78 94 60 94C42 94 28 84 28 66C28 50 40 36 60 36Z" fill="url(#arctic-narwhal-g)" ${O}/>
            <path d="M42 87Q60 95 78 87Q76 81 60 81Q44 81 42 87Z" fill="#EFFBFF" opacity=".85"/>
            <path d="M36.5 60Q38.5 48 48 42" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".9"/>
            <circle cx="77" cy="45" r="1.8" fill="#fff"/><circle cx="83.5" cy="51.5" r="1.4" fill="#fff"/><circle cx="84" cy="44.5" r="1" fill="#fff"/>`,
          armL: {svg: `<ellipse cx="30.5" cy="77" rx="5" ry="8.2" transform="rotate(42 30.5 77)" fill="#8FBEEC" ${O}/>`, pivot: [36, 74]},
          armR: {svg: `<ellipse cx="89.5" cy="77" rx="5" ry="8.2" transform="rotate(-42 89.5 77)" fill="#8FBEEC" ${O}/>`, pivot: [84, 74]},
          top: {svg: `<path d="M55 38.5L60 12.5L65 38.5Z" fill="#FFF6DA" ${O}/><path d="M56.4 32.4L63.4 29.8M57.5 26.4L62.2 24.4M58.6 20.6L61.2 19.4" fill="none" stroke="#E0C98E" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [60, 38]}
        },
        eyes: {lx: 49, rx: 71, y: 63, r: 5, style: "sparkle", color: "#1B3F5E"},
        mouth: {x: 60, y: 72, w: 3, color: "#1B3F5E"},
        cheeks: {lx: 41, rx: 79, y: 70.5, w: 4.4, h: 2.7, color: "#FF9FC4"},
        anchors: {top: [60, 38, 0.95], neck: [60, 85, 1.2], chest: [72, 82, 0.65], back: [86, 56, 0.85], hands: [60, 83, 0.9]},
        lines: {
          tap: ["Hi! I swam all the way up to see you!", "You light up the whole sky!", "Nice and easy, like the tide! You're great!", "You're doing wonderfully! Splash!", "One ripple at a time! Look at you go!", "Sparkly thoughts incoming for you!", "The northern lights are dancing for you!"],
          pet: ["Hehe, bubble giggles! I love it!", "Look, my horn is glowing!"],
          hello: ["Hi! The lights are so pretty now you're here!", "Hello! Swim with me today? Yay!"],
          morning: ["Good morning! Sunshine on the ice!", "Morning, bright one! Let's make waves!"],
          night: ["The aurora is whispering: bedtime?", "Sleepy waves... rest soon, friend."],
          focus: ["Deep dive time! Let's go!", "Calm waters, clear mind. You've got this!"],
          done: ["Splash! What a session!", "Dazzling focus! I'm so proud!"],
          task: ["Splash! DONE!", "Yes yes yes! Well done!", "Glowing work! Amazing!", "Another bright one! Hooray!"],
          break: ["Float and stretch! Ahh, lovely!", "Break time! Bob about and have fun!"]
        }
      }
    ]
  });

  /* Lemonade */
  COMP_DATA.push({
    theme: "lemonade",
    companions: [
      {
        id: "lemonade-lemon", name: "Zest", kind: "Little Lemon", pose: "stand", wearColor: "#43A56C",
        bio: "A sunny little lemon who turns sour days sweet.",
        idle: ["topBob", "wave", "bounce"], cheer: "spin",
        parts: {
          feet: `<ellipse cx="51" cy="107.5" rx="7" ry="4.2" fill="#D99A00" ${O}/><ellipse cx="69" cy="107.5" rx="7" ry="4.2" fill="#D99A00" ${O}/>`,
          body: `${LG("lemonade-lemon-g", [[0, "#FFF3A0"], [0.55, "#FFE14D"], [1, "#F2B705"]], 0.2, 0, 0.8, 1)}
            <path d="M60 28C63 28 64.5 30 64.5 32C80 35 90 50 90 68C90 90 77 105 60 105C43 105 30 90 30 68C30 50 40 35 55.5 32C55.5 30 57 28 60 28Z" fill="url(#lemonade-lemon-g)" ${O}/>
            <path d="M37.5 60Q39 47 48.5 40" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".9"/>
            <circle cx="78" cy="46" r="1.3" fill="#E6AE00" opacity=".7"/><circle cx="83" cy="55" r="1.1" fill="#E6AE00" opacity=".7"/><circle cx="40" cy="89" r="1.2" fill="#E6AE00" opacity=".7"/><circle cx="77" cy="94" r="1.3" fill="#E6AE00" opacity=".7"/>
            <path d="M45 99Q60 105 75 99" fill="none" stroke="#E0A600" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>`,
          armL: {svg: `<ellipse cx="31.5" cy="80" rx="4.6" ry="6.8" transform="rotate(30 31.5 80)" fill="#F7C51E" ${O}/>`, pivot: [37, 78]},
          armR: {svg: `<ellipse cx="88.5" cy="80" rx="4.6" ry="6.8" transform="rotate(-30 88.5 80)" fill="#F7C51E" ${O}/>`, pivot: [83, 78]},
          top: {svg: `${LINE("M60 30V23.5", "#6B8A3A", 2.4)}<path d="M60.5 25C63.5 17 72.5 14 79.5 17C76.5 25 67.5 28 60.5 25Z" fill="#7CC46A" ${O2}/><path d="M62.5 24Q70 20 76.5 18" fill="none" stroke="#4E9A48" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [60, 29]}
        },
        eyes: {lx: 49, rx: 71, y: 65, r: 5, style: "dot", color: "#3A2A10"},
        mouth: {x: 60, y: 74.5, w: 3.2, color: "#3A2A10"},
        cheeks: {lx: 41.5, rx: 78.5, y: 73.5, w: 4.4, h: 2.7, color: "#FF9A8A"},
        anchors: {top: [60, 30, 0.9], neck: [60, 88, 1.2], chest: [73, 93, 0.72], back: [87, 66, 0.85], hands: [60, 93, 0.9]},
        lines: {
          tap: ["Hi! So zesty to see you!", "You're doing amazing today!", "Sour moment? We'll make it sweet!", "I'm so glad you're here!", "Keep it bright! You're glowing!", "Lemon water break? Refreshing!", "Stay fresh! You've totally got this!"],
          pet: ["Hehe, that tickles! Zesty!", "Aww, thank you! I feel so zesty!"],
          hello: ["Hi! The stand is open just for you!", "Hello, sunshine! You're back!"],
          morning: ["Good morning! Fresh start, fresh squeeze!", "Morning, sunny one! Let's shine!"],
          night: ["Sun's down. Rest soon, friend?", "It's late. Time to rest, sweet one."],
          focus: ["Fresh focus! Let's go!", "Nice and calm. You've got this!"],
          done: ["What a session! So proud!", "So refreshing! Amazing work!"],
          task: ["WOO! Done! So zesty!", "Freshly finished! Yes!", "Another one off the list! Hooray!", "Sweet success! You did it!"],
          break: ["Stretch toward the sun! Ahh!", "Break time! Sip something cool!"]
        }
      },
      {
        id: "lemonade-glass", name: "Sippy", kind: "Pink Lemonade", pose: "sit", sleepy: true,
        bio: "A calm glass of pink lemonade who keeps your study days cool.",
        idle: ["topBob", "sway", "sparkle"], cheer: "bounce",
        parts: {
          body: `${LG("lemonade-glass-l", [[0, "#FFD6E3"], [1, "#FF9FBD"]])}
            <path d="M29 44H91L85.5 102C85 107.5 81 110.5 75 110.5H45C39 110.5 35 107.5 34.5 102Z" fill="#EEF7FF"/>
            <path d="M31.6 54H88.4L84.2 101C83.8 105 80.5 107.5 75.5 107.5H44.5C39.5 107.5 36.2 105 35.8 101Z" fill="url(#lemonade-glass-l)"/>
            <ellipse cx="60" cy="54" rx="28.4" ry="3.6" fill="#FFE6EE"/>
            <path d="M29 44H91L85.5 102C85 107.5 81 110.5 75 110.5H45C39 110.5 35 107.5 34.5 102Z" fill="#FFFFFF" fill-opacity=".18" ${O}/>
            <ellipse cx="60" cy="44" rx="31" ry="4" fill="#FFFFFF" fill-opacity=".6" ${OW(2.4)}/>
            <path d="M37.5 60L40.5 98" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".85"/>
            <circle cx="47" cy="99" r="1.7" fill="#fff" opacity=".85"/><circle cx="76" cy="97" r="1.3" fill="#fff" opacity=".85"/><circle cx="80" cy="63" r="1.2" fill="#fff" opacity=".85"/>
            <circle cx="86" cy="42" r="11" fill="#FFE14D" ${O}/><circle cx="86" cy="42" r="7.6" fill="#FFF6B8"/>
            <path d="M86 35.5V48.5M79.5 42H92.5M81.4 37.4L90.6 46.6M90.6 37.4L81.4 46.6" stroke="#F2C94C" stroke-width="1.6" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="30.5" cy="82" rx="4.4" ry="6.4" transform="rotate(28 30.5 82)" fill="#F4FAFF" ${O}/>`, pivot: [36, 80]},
          armR: {svg: `<ellipse cx="89.5" cy="82" rx="4.4" ry="6.4" transform="rotate(-28 89.5 82)" fill="#F4FAFF" ${O}/>`, pivot: [84, 80]},
          top: {svg: `${LINE("M51 53L44 24L35.5 19.5", "#FF7A6B", 4)}<path d="M51 53L44 24L35.5 19.5" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="3.2 3.6" stroke-linejoin="round"/>`, pivot: [48, 44]}
        },
        eyes: {lx: 49, rx: 71, y: 75, r: 5, style: "dot", color: "#4A2030"},
        mouth: {x: 60, y: 84.5, w: 3, color: "#4A2030"},
        cheeks: {lx: 41.5, rx: 78.5, y: 83, w: 4.4, h: 2.7, color: "#FF6F96"},
        anchors: {top: [60, 42, 1], neck: [60, 93, 1.15], chest: [73, 97, 0.7], back: [90, 72, 0.85], hands: [60, 96, 0.9]},
        lines: {
          tap: ["Hi! So happy you're here!", "Sip, breathe, smile! You're great!", "You're doing wonderfully today!", "Nice and easy, like a sweet sip!", "Stay cool! You've totally got this!", "Sip of water? Fizzy good idea!", "Sweet thoughts, all for you!"],
          pet: ["Hehe, so bubbly! Fizz fizz!", "Ooh, that tickles! I'm all sparkly!"],
          hello: ["Hi! Pull up a straw! Yay!", "Hello! You make everything sweeter!"],
          morning: ["Good morning! Fresh, pink and ready!", "Morning, sweet pea! Let's do this!"],
          night: ["Ice is melting... bed soon?", "It's late. Sip of water, then rest."],
          focus: ["Chilling right here with you! Let's go!", "Cool and quiet. You've got this!"],
          done: ["Sweet session! Fizz fizz!", "Refreshingly done! So proud!"],
          task: ["WOO! One off the list!", "Sweet! Done! Hooray!", "Cool as ice! Yes yes yes!", "Fizz fizz! Another one done!"],
          break: ["Sip some water and stretch! Ahh!", "Break time! Cool down and have fun!"]
        }
      },
      {
        id: "lemonade-bird", name: "Zippy", kind: "Hummingbird", pose: "float",
        bio: "A zippy hummingbird who hovers by for a sip of sunshine.",
        idle: ["wingFlutter", "topBob", "sway"], cheer: "spin",
        parts: {
          tail: {svg: `<path d="M53 80L49.5 96L55.5 93.5L60 99L64.5 93.5L70.5 96L67 80Z" fill="#2F8F9C" ${O}/>`, pivot: [60, 82]},
          wingL: {svg: `<path d="M44 52C35 41 23 35 16.5 38.5C13.5 46 25.5 56.5 42 61Z" fill="#EAFBF3" ${O}/><path d="M40 56Q30 51 21 43" fill="none" stroke="#9CD9D4" stroke-width="1.8" stroke-linecap="round"/><path d="M40 59.5Q30 57 22 51" fill="none" stroke="#9CD9D4" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [45, 56]},
          wingR: {svg: `<path d="M76 52C85 41 97 35 103.5 38.5C106.5 46 94.5 56.5 78 61Z" fill="#EAFBF3" ${O}/><path d="M80 56Q90 51 99 43" fill="none" stroke="#9CD9D4" stroke-width="1.8" stroke-linecap="round"/><path d="M80 59.5Q90 57 98 51" fill="none" stroke="#9CD9D4" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [75, 56]},
          body: `${LG("lemonade-bird-g", [[0, "#C4F5EC"], [0.6, "#72D2C9"], [1, "#3FA3B0"]])}
            <circle cx="60" cy="60" r="24" fill="url(#lemonade-bird-g)" ${O}/>
            <path d="M38.2 70A24 24 0 0 0 81.8 70Q60 64.5 38.2 70Z" fill="#FF9EC4"/><circle cx="60" cy="60" r="24" fill="none" ${O}/>
            <path d="M41 52Q43 43 51 38.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".85"/>`,
          top: {svg: `<path d="M58.5 37C56 31 57.5 25.5 62.5 24C61.5 28.5 64.5 32 63 37Z" fill="#FF8FB8" ${O2}/>`, pivot: [60, 37]}
        },
        eyes: {lx: 49, rx: 71, y: 56.5, r: 5, style: "dot", color: "#23302A"},
        mouths: {
          neutral: `<path d="M57.4 64.4Q60 63.4 62.6 64.4L60.5 76.4Q60 77.4 59.5 76.4Z" fill="#4A3C34" ${OW(1.6)}/>`,
          smile: `<path d="M57.2 64.2Q60 63.2 62.8 64.2L60.5 76.4Q60 77.4 59.5 76.4Z" fill="#4A3C34" ${OW(1.6)}/><path d="M53.4 65.8q1.6 1.4 3.2 .3M66.6 65.8q-1.6 1.4 -3.2 .3" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>`,
          open: `<path d="M57.6 66.8L62.4 66.8L60 70.4Z" fill="#FF6F96" ${OW(1.3)}/><path d="M57.4 63.8Q60 62.8 62.6 63.8L60 67.4Z" fill="#4A3C34" ${OW(1.6)}/><path d="M58 69.4L62 69.4L60.5 77.2Q60 78.2 59.5 77.2Z" fill="#4A3C34" ${OW(1.6)}/>`,
          sleepy: `<path d="M57.6 64.6Q60 63.8 62.4 64.6L60.5 75.6Q60 76.6 59.5 75.6Z" fill="#4A3C34" ${OW(1.6)}/>`
        },
        mouth: {x: 60, y: 67, w: 3},
        cheeks: {lx: 42, rx: 78, y: 64, w: 4.4, h: 2.7, color: "#FF8FB8"},
        anchors: {top: [60, 37, 0.9], neck: [60, 79, 1.0], chest: [71, 76, 0.6], back: [83, 56, 0.8], hands: [60, 82, 0.85]},
        lines: {
          tap: ["Hi! Zipping by just for you!", "You're humming along so nicely!", "Sweet little wins add up! Yay!", "Hover a moment and breathe! Lovely!", "Zippy cheers, all for you!", "Sip of water? I'll join you!", "You're doing amazing! Hum hum!"],
          pet: ["Hehe, that tickles! Hum hum!", "So happy! My wings are buzzing!"],
          hello: ["Hi! I zipped right over to see you!", "Hello! You're back! What a treat!"],
          morning: ["Good morning! The sun's so bright!", "Morning, zippy one! Let's buzz!"],
          night: ["Even I stop humming now. Rest soon?", "Tiny nest time soon, friend."],
          focus: ["Hovering quietly with you! Let's go!", "Steady wings, steady mind. You've got this!"],
          done: ["Zoom! What a sweet session!", "Hum hum! That was amazing!"],
          task: ["WOO! Done! Zip zip!", "Sweet as nectar! Yes!", "Humming with pride for you!", "Zoom! Another one done!"],
          break: ["Land and stretch! Wheee!", "Break time! Sip something sweet!"]
        }
      }
    ]
  });

  /* Christmas Lights (xmas) */
  COMP_DATA.push({
    theme: "xmas",
    companions: [
      {
        id: "xmas-reindeer", name: "Cocoa", kind: "Baby Reindeer", pose: "stand",
        bio: "A little reindeer with a rosy nose and a jingly bell collar.",
        idle: ["earTwitch", "hop", "wave"], cheer: "spin",
        neck: [60, 72],
        parts: {
          earL: {svg: `${LINE("M47.5 33C44.5 26 43 20 44.5 12.5M45 24C40.5 22 37.5 18.5 36.5 14", "#E8C896", 3.2)}
            <path d="M42 43C34 42.5 27.5 39 25 34.5C31 32 39 34 45.5 38Z" fill="#B27A50" ${O}/><path d="M39 40C34.5 39.5 31 38 29.5 36C33 35.5 37 36.5 40.5 38.5Z" fill="#FFC6BC"/>`, pivot: [46, 40]},
          earR: {svg: `${LINE("M72.5 33C75.5 26 77 20 75.5 12.5M75 24C79.5 22 82.5 18.5 83.5 14", "#E8C896", 3.2)}
            <path d="M78 43C86 42.5 92.5 39 95 34.5C89 32 81 34 74.5 38Z" fill="#B27A50" ${O}/><path d="M81 40C85.5 39.5 89 38 90.5 36C87 35.5 83 36.5 79.5 38.5Z" fill="#FFC6BC"/>`, pivot: [74, 40]},
          feet: `<ellipse cx="50" cy="108.5" rx="7" ry="4.4" fill="#5A3420" ${O}/><ellipse cx="70" cy="108.5" rx="7" ry="4.4" fill="#5A3420" ${O}/>`,
          body: `${LG("xmas-reindeer-b", [[0, "#C48A5E"], [1, "#94603C"]])}
            <path d="M60 70C77 70 85 83 85 95C85 105 77 109.5 60 109.5C43 109.5 35 105 35 95C35 83 43 70 60 70Z" fill="url(#xmas-reindeer-b)" ${O}/>
            <ellipse cx="60" cy="96" rx="13" ry="10" fill="#F4DDBF"/>
            ${LINE("M44 76.5Q60 82.5 76 76.5", "#D9443A", 3.6)}
            <circle cx="60" cy="83.5" r="4" fill="#F5C242" ${O2}/><path d="M58 84.8h4" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="40" cy="88" rx="5.6" ry="8.6" transform="rotate(22 40 88)" fill="#A8704A" ${O}/>`, pivot: [45, 80]},
          armR: {svg: `<ellipse cx="80" cy="88" rx="5.6" ry="8.6" transform="rotate(-22 80 88)" fill="#A8704A" ${O}/>`, pivot: [75, 80]},
          head: `${LG("xmas-reindeer-h", [[0, "#D39C6E"], [1, "#A06A43"]])}
            <circle cx="60" cy="52" r="23" fill="url(#xmas-reindeer-h)" ${O}/>
            <path d="M43 43Q47 35 55 32" fill="none" stroke="#F1CDA6" stroke-width="3" stroke-linecap="round"/>`,
          face: `<ellipse cx="60" cy="64" rx="11" ry="8" fill="#F6E2C8"/>
            <ellipse cx="60" cy="59.8" rx="4.4" ry="3.3" fill="#E0463C" ${O2}/><circle cx="58.6" cy="58.9" r="1" fill="#fff"/>`
        },
        eyes: {lx: 48, rx: 72, y: 51, r: 4.6, style: "dot", color: "#2B1A10"},
        mouth: {x: 60, y: 67.5, w: 2.6, style: "cat", color: "#2B1A10"},
        cheeks: {lx: 41, rx: 79, y: 60, w: 4.2, h: 2.6},
        anchors: {top: [60, 30, 0.95], neck: [60, 78, 1.0], chest: [70, 93, 0.72], back: [84, 88, 0.9], hands: [60, 95, 0.95]},
        lines: {
          tap: ["Jingle jingle! Hi, friend!", "You show up every day! I love that!", "You've got this! Jingle!", "Tiny hooves, big leaps! Go you!", "Merry and bright, that's you!", "Warm cocoa and a stretch? Yes please!", "Look at those twinkly lights! So fun!"],
          pet: ["Jingle! That tickles! Hehe!", "Look, my nose is glowing for you!"],
          hello: ["Hi! The lights are on for you!", "Hello! I'm so happy you're back!"],
          morning: ["Good morning! Fresh snow to play in!", "Morning, friend! Let's prance into today!"],
          night: ["Sleepy hooves... bed soon?", "The stars are out. Rest up, friend."],
          focus: ["Cozy reading time! Let's go!", "Quiet as snowfall. You've got this!"],
          done: ["Jingle jingle! What a great session!", "All done! Time for cocoa! Yay!"],
          task: ["Jingle! DONE! Hooray!", "Yes yes yes! Nicely done!", "One more off the list! Amazing!", "Done! Ring the bells for you!"],
          break: ["Prance around and stretch! Fun!", "Cocoa break! And some water too!"]
        }
      },
      {
        id: "xmas-gift", name: "Jolly", kind: "Little Gift Box", pose: "sit", sleepy: true, wearColor: "#2E9E5B",
        bio: "A cozy little present who is happiest when you open a new page.",
        idle: ["topBob", "bounce", "sway"], cheer: "hop",
        parts: {
          body: `${LG("xmas-gift-b", [[0, "#F47466"], [1, "#CF3C34"]])}${LG("xmas-gift-l", [[0, "#FF8A7B"], [1, "#E0493F"]])}
            <rect x="31" y="61" width="58" height="49.5" rx="5" fill="url(#xmas-gift-b)" ${O}/>
            <rect x="31" y="95.5" width="58" height="7" fill="#F5C242"/>
            <rect x="31" y="61" width="58" height="49.5" rx="5" fill="none" ${O}/>
            <path d="M31 95.5H89M31 102.5H89" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
            <circle cx="37" cy="67.5" r="1.6" fill="#FFD6D0"/><circle cx="83" cy="68" r="1.6" fill="#FFD6D0"/><circle cx="37.5" cy="89" r="1.4" fill="#FFD6D0"/><circle cx="83" cy="89" r="1.4" fill="#FFD6D0"/>
            <rect x="27" y="49.5" width="66" height="15" rx="5" fill="url(#xmas-gift-l)" ${O}/>
            <rect x="55" y="49.5" width="10" height="15" fill="#F5C242" ${OW(2)}/>
            <path d="M32.5 54.5H46" stroke="#fff" stroke-width="2.8" stroke-linecap="round" opacity=".75"/>`,
          armL: {svg: `<ellipse cx="29" cy="85" rx="4.6" ry="6.4" transform="rotate(28 29 85)" fill="#E0493F" ${O}/>`, pivot: [34, 83]},
          armR: {svg: `<ellipse cx="91" cy="85" rx="4.6" ry="6.4" transform="rotate(-28 91 85)" fill="#E0493F" ${O}/>`, pivot: [86, 83]},
          top: {svg: `<path d="M59 49C51.5 37.5 40.5 37 40.5 44.5C40.5 51 51 51.5 59 49Z" fill="#F5C242" ${O2}/><path d="M61 49C68.5 37.5 79.5 37 79.5 44.5C79.5 51 69 51.5 61 49Z" fill="#F5C242" ${O2}/>
            <path d="M44.5 44Q50 42 55 46.5M75.5 44Q70 42 65 46.5" fill="none" stroke="#D99A1E" stroke-width="1.6" stroke-linecap="round"/>
            <ellipse cx="60" cy="48" rx="4.4" ry="3.8" fill="#FFD66B" ${O2}/>`, pivot: [60, 50]}
        },
        eyes: {lx: 49, rx: 71, y: 77, r: 5, style: "dot", color: "#2A1016"},
        mouth: {x: 60, y: 86.5, w: 3, color: "#2A1016"},
        cheeks: {lx: 41, rx: 79, y: 85, w: 4.4, h: 2.7, color: "#FFB3AA"},
        anchors: {top: [60, 41, 1], neck: [60, 64, 1.3], chest: [75, 91, 0.7], back: [90, 76, 0.85], hands: [60, 97, 0.9]},
        lines: {
          tap: ["Hi! No peeking inside! Hehe!", "You're the real gift, you know!", "Wrapped up in good vibes for you!", "Bow by bow, you're doing amazing!", "Present and accounted for! Yay!", "Unwrap one step at a time! Fun!", "Rest is a gift too! Enjoy it!"],
          pet: ["Hehe, my bow is wiggling!", "Ooh, careful with my ribbon! Hehe!"],
          hello: ["Hi! The best present is you being back!", "Hello! So cozy in here with you!"],
          morning: ["Good morning! A shiny new day to unwrap!", "Morning! Ribbon ready, let's go!"],
          night: ["Tuck in soon? Sweet dreams, friend.", "It's late. Let's rest, okay?"],
          focus: ["Snoozing under the tree. You've got this!", "Quiet and cozy. Let's go!"],
          done: ["What a lovely session! Hooray!", "All wrapped up! Amazing work!"],
          task: ["Ta-da! DONE!", "Wrapped and done! Yes!", "A gift to future you! Yay!", "Beautiful work! Hooray!"],
          break: ["Stretch and have a yummy snack!", "Break time! Warm drink, cozy vibes!"]
        }
      },
      {
        id: "xmas-bulb", name: "Glimmer", kind: "Twinkle Bulb", pose: "float",
        bio: "A warm little light bulb who glows brighter with every win.",
        idle: ["topBob", "sparkle", "sway"], cheer: "spin",
        parts: {
          back: `${RG("xmas-bulb-halo", [[0, "#FFE58A", 0.6], [0.6, "#FFE58A", 0.2], [1, "#FFE58A", 0]])}<circle cx="60" cy="70" r="36" fill="url(#xmas-bulb-halo)"/>`,
          body: `${RG("xmas-bulb-g", [[0, "#FFFBE2"], [0.5, "#FFE27A"], [1, "#F2B53A"]], 0.42, 0.4, 0.66)}
            <path d="M60 40C78 40 88 54 88 68C88 84 74 96 60 103C46 96 32 84 32 68C32 54 42 40 60 40Z" fill="url(#xmas-bulb-g)" ${O}/>
            <path d="M39.5 64Q40.5 53 48 47" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>
            <path d="M52 94Q60 99.5 68 94" fill="none" stroke="#E8A12E" stroke-width="2.2" stroke-linecap="round" opacity=".6"/>
            <rect x="49.5" y="30" width="21" height="14" rx="3.5" fill="#2E9E5B" ${O}/>
            <path d="M51 35.2H69M51 39.2H69" stroke="#1F6E3F" stroke-width="1.8" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="31" cy="76" rx="4.4" ry="6.2" transform="rotate(30 31 76)" fill="#F7C24A" ${O}/>`, pivot: [36, 73]},
          armR: {svg: `<ellipse cx="89" cy="76" rx="4.4" ry="6.2" transform="rotate(-30 89 76)" fill="#F7C24A" ${O}/>`, pivot: [84, 73]},
          top: {svg: `${LINE("M60 31C60 25 66.5 23.5 66.5 18.5C66.5 13.5 58.5 13.5 58.5 18.5", "#3FAE6B", 2.4)}`, pivot: [60, 31]}
        },
        eyes: {lx: 50, rx: 70, y: 66, r: 5, style: "dot", color: "#3A2410"},
        mouth: {x: 60, y: 75, w: 3, color: "#3A2410"},
        cheeks: {lx: 42, rx: 78, y: 73.5, w: 4.4, h: 2.7, color: "#FF9A8A"},
        anchors: {top: [60, 31, 0.8], neck: [60, 45, 0.75], chest: [71, 85, 0.62], back: [84, 54, 0.8], hands: [60, 87, 0.85]},
        lines: {
          tap: ["Blink blink! Hi, friend!", "You light up the whole room!", "Glowing with pride for you!", "Bright idea incoming! Ooh!", "Little lights add up! Yay!", "Stay warm and keep shining!", "Twinkle on! You're amazing!"],
          pet: ["I'm all aglow! Hehe!", "Ooh, full brightness! Thank you!"],
          hello: ["Hi! All my lights are on for you!", "Hello! Let's get glowing! Yay!"],
          morning: ["Good morning! Warming up my glow!", "Morning, bright spark! Let's shine!"],
          night: ["Dimming soon... you too?", "Lights low now. Rest time, friend."],
          focus: ["Steady glow! Let's go!", "Soft light, calm mind. You've got this!"],
          done: ["Brilliant session! Wow!", "You shone so bright! Hooray!"],
          task: ["Ding! DONE!", "Bright work! Yes yes yes!", "One more done! Twinkle twinkle!", "Glowing results! Amazing!"],
          break: ["Stretch and twinkle! Fun!", "Break time! Rest your eyes, bright one!"]
        }
      }
    ]
  });
})();


