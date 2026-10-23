/* ===== module: 98-comp-b5.js ===== */
/* Study Companions, batch 5: gardening, gaming, photography, newyear, lunarnewyear, valentines */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);

  /* Garden Plot */
  COMP_DATA.push({
    theme: "gardening",
    companions: [
      {
        id: "gardening-pot", name: "Posy", kind: "Flower Pot Pal", pose: "sit",
        bio: "A little clay pot with a bloom on top that grows as you do.",
        idle: ["topBob", "sway", "wave"], cheer: "hop",
        parts: {
          armL: {svg: `<ellipse cx="29" cy="86" rx="5.6" ry="7.4" transform="rotate(26 29 86)" fill="#E88B5E" ${O}/>`, pivot: [36, 82]},
          armR: {svg: `<ellipse cx="91" cy="86" rx="5.6" ry="7.4" transform="rotate(-26 91 86)" fill="#E88B5E" ${O}/>`, pivot: [84, 82]},
          body: `${LG("gardening-pot-g", [[0, "#F6AE80"], [0.6, "#E58A5C"], [1, "#C8643A"]], 0.2, 0, 0.8, 1)}${LG("gardening-pot-r", [[0, "#F8B98E"], [1, "#DD7F52"]])}
            <path d="M32 60H88L83.5 100C82.8 106.5 79 110.5 72 110.5H48C41 110.5 37.2 106.5 36.5 100Z" fill="url(#gardening-pot-g)" ${O}/>
            <path d="M42 102Q60 107 78 102" fill="none" stroke="#B9582F" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>
            <path d="M38.5 70Q38 84 40.5 96" fill="none" stroke="#FFD2B4" stroke-width="3.2" stroke-linecap="round" opacity=".85"/>
            <rect x="27" y="48.5" width="66" height="15" rx="6" fill="url(#gardening-pot-r)" ${O}/>
            <ellipse cx="60" cy="49.5" rx="29" ry="5" fill="#7A5238" ${O}/>
            <path d="M44 48.8q3-1.6 6-.6M66 48.2q3-1.2 5.5 .2" fill="none" stroke="#9C7050" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M33 57.5H48" stroke="#FFE0C8" stroke-width="2.6" stroke-linecap="round" opacity=".9"/>`,
          top: {svg: `${LINE("M60 49C60 42 59 36 60 28", "#4E9E4A", 2.8)}
            <path d="M59.5 42C54 33 43 32 38.5 37C43.5 44 53 46 59.5 42Z" fill="#8ACF6E" ${O2}/><path d="M57.5 41.5Q50 37.5 43 37.5" fill="none" stroke="#4E9E4A" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M60.5 39C66 30 77 29.5 81.5 34.5C76.5 41.5 67 43 60.5 39Z" fill="#6CC070" ${O2}/><path d="M62.5 38.5Q70 34.5 77 34.5" fill="none" stroke="#3E8E4A" stroke-width="1.6" stroke-linecap="round"/>
            <g ${O2} fill="#F7A3C6"><circle cx="60" cy="14.5" r="5.6"/><circle cx="67.6" cy="20" r="5.6"/><circle cx="64.7" cy="28.8" r="5.6"/><circle cx="55.3" cy="28.8" r="5.6"/><circle cx="52.4" cy="20" r="5.6"/></g>
            <circle cx="60" cy="22.5" r="5" fill="#FFD66B" ${O2}/><circle cx="58.4" cy="21" r="1.5" fill="#FFF4C8"/>`, pivot: [60, 49]}
        },
        eyes: {lx: 47.5, rx: 72.5, y: 78, r: 5.2, style: "dot", color: "#3A2218"},
        mouth: {x: 60, y: 87, w: 3.2, color: "#3A2218"},
        cheeks: {lx: 41.5, rx: 78.5, y: 86, w: 4.4, h: 2.8, color: "#FF6F8E"},
        anchors: {top: [60, 47, 1.15], neck: [60, 99, 1.05], chest: [72, 98, 0.72], back: [88, 78, 0.9], hands: [60, 99, 0.9]},
        lines: {
          tap: ["Hi! I'm in full bloom just for you!", "Look at you growing a little every day!", "You're blooming beautifully!", "Strong roots, then gorgeous flowers! That's you!", "Sunshine and study notes! My favorite combo!", "Petal by petal, you've totally got this!", "Every time you show up, I sprout a new leaf!"],
          pet: ["Hehe! That tickles my petals!", "Aww, I'm blooming with happiness!"],
          hello: ["Yay, you're back! The whole garden missed you!", "Hello! Let's grow something great today!"],
          morning: ["Good morning! Soaking up the sun with you!", "Morning, sprout! Let's reach for the sky!"],
          night: ["My petals are closing... rest soon?", "Flowers sleep too. Cozy bedtime, sprout?"],
          focus: ["Quiet growing time! You've got this!", "Heads down! I'm growing right beside you."],
          done: ["Look how much you grew! Amazing!", "Session done! I'm in full bloom for you!"],
          task: ["Yes! Another one done!", "Another seed planted! Hooray!", "Freshly picked and checked off! WOO!", "That's real growth! I'm so proud!"],
          break: ["Stretch toward the sun with me!", "Water break! For you and for me!"]
        }
      },
      {
        id: "gardening-ladybug", name: "Dottie", kind: "Garden Ladybug", pose: "stand",
        bio: "A spotty little ladybug who brings good luck to every page.",
        idle: ["wingFlutter", "earTwitch", "waddle"], cheer: "wingFlutter",
        neck: [60, 73],
        parts: {
          wingL: {svg: `${LG("gardening-ladybug-wl", [[0, "#FF7A6B"], [1, "#D93A3A"]], 0.2, 0, 0.8, 1)}
            <path d="M58 64C44 60 26 70 24.5 86C23.5 99 33 106.5 45 106L58 104Z" fill="url(#gardening-ladybug-wl)" ${O}/>
            <circle cx="33" cy="84" r="4.6" fill="#3A2E3F"/><circle cx="40" cy="98" r="3.6" fill="#3A2E3F"/><circle cx="44.5" cy="72" r="3.2" fill="#3A2E3F"/>
            <path d="M29 77Q31 71 36 68" fill="none" stroke="#FFC2B8" stroke-width="2.6" stroke-linecap="round"/>`, pivot: [54, 70]},
          wingR: {svg: `${LG("gardening-ladybug-wr", [[0, "#FF7A6B"], [1, "#D93A3A"]], 0.8, 0, 0.2, 1)}
            <path d="M62 64C76 60 94 70 95.5 86C96.5 99 87 106.5 75 106L62 104Z" fill="url(#gardening-ladybug-wr)" ${O}/>
            <circle cx="87" cy="84" r="4.6" fill="#3A2E3F"/><circle cx="80" cy="98" r="3.6" fill="#3A2E3F"/><circle cx="75.5" cy="72" r="3.2" fill="#3A2E3F"/>`, pivot: [66, 70]},
          earL: {svg: `${LINE("M52 32C49 25 45 21 41 19", "#3A2E3F", 2.4)}<circle cx="40" cy="18.5" r="4" fill="#FF6B63" ${O2}/>`, pivot: [52, 33]},
          earR: {svg: `${LINE("M68 32C71 25 75 21 79 19", "#3A2E3F", 2.4)}<circle cx="80" cy="18.5" r="4" fill="#FF6B63" ${O2}/>`, pivot: [68, 33]},
          feet: `<ellipse cx="51" cy="108.5" rx="6.4" ry="4" fill="#3A2E3F" ${O}/><ellipse cx="69" cy="108.5" rx="6.4" ry="4" fill="#3A2E3F" ${O}/>`,
          body: `${LG("gardening-ladybug-b", [[0, "#5A4D62"], [1, "#3A2E3F"]])}
            <ellipse cx="60" cy="90" rx="17" ry="16" fill="url(#gardening-ladybug-b)" ${O}/>
            <ellipse cx="60" cy="93" rx="10" ry="9" fill="#FFF1DE"/>`,
          armL: {svg: `<ellipse cx="44" cy="92" rx="4.4" ry="6.2" transform="rotate(26 44 92)" fill="#4A3E52" ${O}/>`, pivot: [48, 86]},
          armR: {svg: `<ellipse cx="76" cy="92" rx="4.4" ry="6.2" transform="rotate(-26 76 92)" fill="#4A3E52" ${O}/>`, pivot: [72, 86]},
          head: `${LG("gardening-ladybug-h", [[0, "#5E5068"], [1, "#342A3A"]])}
            <circle cx="60" cy="52" r="24" fill="url(#gardening-ladybug-h)" ${O}/>
            <path d="M42 41Q46.5 33.5 55 31" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".3"/>`,
          face: `<path d="M60 44C53 37 39.5 39 39 51C38.5 63 48 70.5 60 68.5C72 70.5 81.5 63 81 51C80.5 39 67 37 60 44Z" fill="#FFF3E4"/>`
        },
        eyes: {lx: 50, rx: 70, y: 54, r: 4.6, style: "dot"},
        mouth: {x: 60, y: 62, w: 2.8},
        cheeks: {lx: 43.5, rx: 76.5, y: 61, w: 4, h: 2.6, color: "#FF8FA3"},
        anchors: {top: [60, 29, 1], neck: [60, 74, 0.95], chest: [69, 94, 0.7], back: [93, 68, 0.85], hands: [60, 94, 0.9]},
        lines: {
          tap: ["Hi! Spot on, as always!", "I'm so lucky to study with you!", "You're doing great! Truly!", "Little legs, BIG progress! Look at that!", "Every spot on me is one of your wins!", "Deep breath! You've totally got this!", "What a lucky day for learning!"],
          pet: ["Hehe! That tickles my spots!", "Ooh, lucky me! More please!"],
          hello: ["Yay! I flew right over to see you!", "Hello! Good luck just landed here!"],
          morning: ["Good morning! Dew on the leaves and joy in the air!", "Morning, lucky star! Let's fly!"],
          night: ["Tucking under a leaf now... you too?", "It's late, friend. Rest those eyes?"],
          focus: ["Landing right here! Let's focus together!", "Quiet wings, big brain! You've got this."],
          done: ["Spot on! What a fantastic session!", "What a lucky, lovely session! Yay!"],
          task: ["Spot on! Checked off!", "Done! WOO, nice work!", "Crossed off! Yay yay yay!", "Another win! I'm so proud of you!"],
          break: ["Spread your wings! Big stretch!", "Break time! Grab a fresh sip of water!"]
        }
      },
      {
        id: "gardening-bee", name: "Bumble", kind: "Bumblebee", pose: "float", sleepy: true,
        bio: "A fuzzy bumblebee who hums softly while you work.",
        idle: ["wingFlutter", "sparkle", "sway"], cheer: "spin",
        parts: {
          wingL: {svg: `<path d="M44 48C37 34 22 29 17 35C12.5 42 25 53 41 54Z" fill="#F2FAFF" fill-opacity=".95" ${OW(2.4)}/><path d="M39 51Q28 45 21.5 38" fill="none" stroke="#B9DDEF" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [44, 53]},
          wingR: {svg: `<path d="M76 48C83 34 98 29 103 35C107.5 42 95 53 79 54Z" fill="#F2FAFF" fill-opacity=".95" ${OW(2.4)}/><path d="M81 51Q92 45 98.5 38" fill="none" stroke="#B9DDEF" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [76, 53]},
          earL: {svg: `${LINE("M53 42C51 35 48 31 44 29", "#5A3E2A", 2.4)}<circle cx="43" cy="28.5" r="3.4" fill="#5A3E2A" ${O2}/>`, pivot: [53, 43]},
          earR: {svg: `${LINE("M67 42C69 35 72 31 76 29", "#5A3E2A", 2.4)}<circle cx="77" cy="28.5" r="3.4" fill="#5A3E2A" ${O2}/>`, pivot: [67, 43]},
          tail: {svg: `<path d="M56 94.5Q60 103 64 94.5Z" fill="#5A3E2A" ${O2}/>`, pivot: [60, 93]},
          body: `${RG("gardening-bee-g", [[0, "#FFF0A6"], [0.55, "#FFD35A"], [1, "#F0AE2E"]], 0.4, 0.34, 0.7)}
            <circle cx="60" cy="68" r="27" fill="url(#gardening-bee-g)" ${O}/>
            <path d="M34.8 78Q60 85 85.2 78L81.2 86.5Q60 93 38.8 86.5Z" fill="#6B4A2E"/>
            <path d="M44 93.5Q60 97.5 76 93.5L71 95.2Q60 99 49 95.2Z" fill="#6B4A2E"/>
            <circle cx="60" cy="68" r="27" fill="none" ${O}/>
            <path d="M40 58Q42 49 50 44.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".85"/>`,
          armL: {svg: `<ellipse cx="34.5" cy="74" rx="4.2" ry="5.6" transform="rotate(28 34.5 74)" fill="#FFD35A" ${O}/>`, pivot: [40, 71]},
          armR: {svg: `<ellipse cx="85.5" cy="74" rx="4.2" ry="5.6" transform="rotate(-28 85.5 74)" fill="#FFD35A" ${O}/>`, pivot: [80, 71]}
        },
        eyes: {lx: 50, rx: 70, y: 63, r: 4.8, style: "dot", color: "#3A2618"},
        mouth: {x: 60, y: 71, w: 2.8, color: "#3A2618"},
        cheeks: {lx: 42.5, rx: 77.5, y: 70, w: 4.2, h: 2.7, color: "#FF7F8A"},
        anchors: {top: [60, 42, 0.95], neck: [60, 82, 1.05], chest: [72, 84, 0.66], back: [85, 62, 0.8], hands: [60, 82, 0.85]},
        lines: {
          tap: ["Bzz! Hi there! So happy you're here!", "You're the bee's knees, truly!", "Buzzing along right beside you!", "Sweet work so far! Keep it humming!", "Bee kind to yourself! You're doing great!", "One flower at a time, and look at this garden!", "You make my wings buzz with pride!"],
          pet: ["Bzzz! So fuzzy and so happy!", "Hehe! Sweet as honey!"],
          hello: ["Bzz! You're back! Best day ever!", "Hi! The flowers opened up just for you!"],
          morning: ["Good morning! It's a fresh nectar day!", "Morning, honey bee! Let's get buzzing!"],
          night: ["Back to the hive soon, friend?", "Sleepy buzz... time to rest now?"],
          focus: ["Soft humming! You've got this!", "Quiet buzz, busy brain! Let's go."],
          done: ["Buzz buzz! You did it! Amazing!", "What a sweet session! I'm buzzing!"],
          task: ["Bzz! DONE!", "Sweet as honey! Checked off!", "Woohoo! Another flower visited!", "Look at you go! Buzzing with pride!"],
          break: ["Float around and stretch a little!", "Honey break! Grab a tasty snack!"]
        }
      }
    ]
  });

  /* Gaming */
  COMP_DATA.push({
    theme: "gaming",
    companions: [
      {
        id: "gaming-pad", name: "Combo", kind: "Game Controller", pose: "stand",
        bio: "A cheerful controller who's ready for your next study quest.",
        idle: ["topBob", "wave", "waddle"], cheer: "spin",
        parts: {
          armL: {svg: `<ellipse cx="15.5" cy="80" rx="5" ry="6.6" transform="rotate(24 15.5 80)" fill="#8C74F0" ${O}/>`, pivot: [22, 76]},
          armR: {svg: `<ellipse cx="104.5" cy="80" rx="5" ry="6.6" transform="rotate(-24 104.5 80)" fill="#8C74F0" ${O}/>`, pivot: [98, 76]},
          body: `${LG("gaming-pad-g", [[0, "#C3B4FF"], [0.55, "#9E88FA"], [1, "#7A5FE6"]], 0.2, 0, 0.8, 1)}
            <path d="M36 52H84C96 52 103 61 103 74C103 88 102 101 94 107C88 111 79 109 75 101L71 92H49L45 101C41 109 32 111 26 107C18 101 17 88 17 74C17 61 24 52 36 52Z" fill="url(#gaming-pad-g)" ${O}/>
            <path d="M22.5 70Q23.5 60 32.5 57" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>
            <path d="M84 104Q91 106 96 101" fill="none" stroke="#6A4FD6" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>
            <ellipse cx="60" cy="73" rx="18.5" ry="15" fill="#F1EDFF"/>
            <path d="M27 63.5h5v5h5v5h-5v5h-5v-5h-5v-5h5Z" fill="#3B2F7A" ${OW(1.6)}/>
            <circle cx="90" cy="62.5" r="3.4" fill="#FFD84A" ${OW(1.8)}/><circle cx="96.5" cy="69" r="3.4" fill="#FF5C8A" ${OW(1.8)}/><circle cx="83.5" cy="69" r="3.4" fill="#4AD9FF" ${OW(1.8)}/><circle cx="90" cy="75.5" r="3.4" fill="#8CE85A" ${OW(1.8)}/>`,
          top: {svg: `${LINE("M60 53C60 46 67 44 66 39C65 34 57 35 57 30C57 26 61 24 62 22", "#6246D6", 2.6)}<rect x="58.5" y="15" width="7" height="8" rx="2" transform="rotate(14 62 19)" fill="#FFD84A" ${OW(2)}/>`, pivot: [60, 52]}
        },
        eyes: {lx: 51, rx: 69, y: 71, r: 4.6, style: "dot", color: "#231B4A"},
        mouth: {x: 60, y: 80, w: 3, color: "#231B4A"},
        cheeks: {lx: 45, rx: 75, y: 79, w: 3.6, h: 2.4, color: "#FF8FB3"},
        anchors: {top: [60, 53, 1], neck: [60, 90, 1.25], chest: [83, 88, 0.66], back: [94, 58, 0.85], hands: [60, 90, 0.9]},
        lines: {
          tap: ["Player two has joined! Let's go!", "Press start! I'm ready when you are!", "You're on a combo streak! Keep it up!", "Level up, one page at a time!", "Save point reached! You're crushing it!", "Achievement unlocked: showed up today!", "Best teammate ever? That's you!"],
          pet: ["Bzzt! Happy rumble!", "Hehe! Button mash of joy!"],
          hello: ["Player one is back! Let's play!", "Hi! A brand new level awaits!"],
          morning: ["Good morning, hero! New game, new day!", "Morning! Fully charged and ready to go!"],
          night: ["Low battery... save and rest?", "Game saved. Great run today. Bedtime?"],
          focus: ["Quest started! I'm right here with you!", "Focus mode engaged! Heads down, let's go."],
          done: ["Level complete! What a run!", "Quest cleared! You were unstoppable!"],
          task: ["Quest complete! WOO!", "+10 XP! Yes yes yes!", "Combo hit! Another one down!", "Achievement unlocked! You're amazing!"],
          break: ["Pause menu! Time for a big stretch!", "Paused! Grab water and a snack, hero!"]
        }
      },
      {
        id: "gaming-slime", name: "Gloop", kind: "Friendly Slime", pose: "sit", sleepy: true,
        bio: "A wobbly little slime who guards your save file with a smile.",
        idle: ["topBob", "bounce", "sway"], cheer: "bounce",
        parts: {
          body: `${RG("gaming-slime-g", [[0, "#D8F6FF"], [0.5, "#8EDDFA"], [1, "#44B3E6"]], 0.38, 0.35, 0.72)}
            <path d="M60 36C66 46 83 55 91 71C99 86 99 101 88 107C80 111 70 110.5 60 110.5C50 110.5 40 111 32 107C21 101 21 86 29 71C37 55 54 46 60 36Z" fill="url(#gaming-slime-g)" ${O}/>
            <path d="M32 101Q60 110 88 101" fill="none" stroke="#3AA0D6" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>
            <path d="M34.5 80C35.5 71 41 63 48 57" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" opacity=".85"/><circle cx="33.5" cy="88" r="2.2" fill="#fff" opacity=".8"/>
            <circle cx="80" cy="96" r="5" fill="#FFD84A" opacity=".85" ${OW(1.8)}/><path d="M80 93.5v5" stroke="#E0A020" stroke-width="1.6" stroke-linecap="round"/>`,
          armL: {svg: `<path d="M29 86C22 86 18 91 20 96C22 100 28 99 32 95Z" fill="#7FD6F8" ${O}/>`, pivot: [32, 88]},
          armR: {svg: `<path d="M91 86C98 86 102 91 100 96C98 100 92 99 88 95Z" fill="#7FD6F8" ${O}/>`, pivot: [88, 88]},
          top: {svg: `<path d="M60 38C59 32 62 27 67 27C64.5 29.5 64 33 64.5 37Z" fill="#9EE3FB" ${O2}/>`, pivot: [61, 39]}
        },
        eyes: {lx: 49, rx: 71, y: 80, r: 5, style: "dot", color: "#16324A"},
        mouth: {x: 60, y: 89, w: 3, color: "#16324A"},
        cheeks: {lx: 41, rx: 79, y: 88, w: 4.4, h: 2.8, color: "#FF8FB3"},
        anchors: {top: [60, 45, 0.95], neck: [60, 99, 1.3], chest: [74, 101, 0.7], back: [89, 78, 0.9], hands: [60, 100, 0.9]},
        lines: {
          tap: ["Bloop! Hi! I'm so happy you're here!", "Wobble wobble! You've got this!", "A friendly slime appears! Cheering for you!", "Soft, squishy, and super proud of you!", "Every hero starts at level 1! Look at you now!", "Your save file is safe with me!", "Slow and steady gains so much XP!"],
          pet: ["Bloop bloop! Happy squish!", "I'm wobbling with joy!"],
          hello: ["Bloop! You're back! Hooray!", "Hi! I kept the campfire warm for you!"],
          morning: ["Good morning! Let's bounce into the day!", "Morning, adventurer! A new quest awaits!"],
          night: ["Sleepy bloop... rest soon?", "Inn time, adventurer. Restore your HP?"],
          focus: ["Cozy grind time! You've got this!", "Shh, I'll guard the save point. Go go!"],
          done: ["Bloop! Session cleared! Amazing!", "HP full, brain full, heart full! Yay!"],
          task: ["Bloop! DONE!", "Loot collected! Woohoo!", "Task cleared! Yes yes yes!", "Epic drop! You're on a roll!"],
          break: ["Wobble break! Up and stretch!", "Rest at the inn! Grab a snack!"]
        }
      },
      {
        id: "gaming-potion", name: "Fizz", kind: "Potion Sprite", pose: "float",
        bio: "A bubbly potion who restores your energy one sip at a time.",
        idle: ["topBob", "sparkle", "spin"], cheer: "spin",
        parts: {
          back: `<rect x="50" y="36" width="20" height="20" rx="3" fill="#EAF3FF" ${O}/>`,
          body: `${LG("gaming-potion-l", [[0, "#FF9CC0"], [1, "#E8467A"]])}
            <circle cx="60" cy="72" r="26" fill="#F2F8FF" ${O}/>
            <path d="M35.5 67Q47 62.5 60 66.5Q73 70.5 84.5 66C86.5 72 86.5 80 83 86.5C78.5 94 70 97.8 60 97.8C50 97.8 41.5 94 37 86.5C33.5 80 33.5 72.5 35.5 67Z" fill="url(#gaming-potion-l)"/>
            <circle cx="60" cy="72" r="26" fill="none" ${O}/>
            <path d="M40 60Q43 52 50 48.5" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/><path d="M53.5 40V52" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".9"/>
            <circle cx="46" cy="89" r="2.2" fill="#FFD6E4"/><circle cx="76" cy="90.5" r="1.8" fill="#FFD6E4"/><circle cx="72" cy="85" r="1.2" fill="#FFD6E4"/>
            <rect x="47.5" y="46" width="25" height="6" rx="3" fill="#B48CFF" ${OW(2.2)}/>`,
          armL: {svg: `<ellipse cx="33.5" cy="80" rx="4.4" ry="5.8" transform="rotate(26 33.5 80)" fill="#F2F8FF" ${O}/>`, pivot: [39, 77]},
          armR: {svg: `<ellipse cx="86.5" cy="80" rx="4.4" ry="5.8" transform="rotate(-26 86.5 80)" fill="#F2F8FF" ${O}/>`, pivot: [81, 77]},
          top: {svg: `<path d="M51.5 37.5L51 29C51 26.5 53 25 56 25H64C67 25 69 26.5 69 29L68.5 37.5Z" fill="#D9A066" ${O2}/><path d="M55 28.5h6" stroke="#F2C890" stroke-width="2" stroke-linecap="round"/>
            <circle cx="67" cy="17" r="3.4" fill="#FFD6E4" ${OW(1.8)}/><circle cx="72.5" cy="10.5" r="2.2" fill="#FFD6E4" ${OW(1.6)}/>`, pivot: [60, 37]}
        },
        eyes: {lx: 50, rx: 70, y: 76, r: 4.8, style: "sparkle", color: "#3A1030"},
        mouth: {x: 60, y: 85, w: 2.8, color: "#3A1030"},
        cheeks: {lx: 42.5, rx: 77.5, y: 83.5, w: 4, h: 2.6, color: "#FFD0E0"},
        anchors: {top: [60, 26, 0.85], neck: [60, 50, 0.72], chest: [74, 91, 0.66], back: [83, 60, 0.8], hands: [60, 92, 0.85]},
        lines: {
          tap: ["Fizz! Hi there! So glad you're here!", "One sip of confidence, coming right up!", "Energy restored! You're glowing!", "Plus five calm, plus five focus! Let's go!", "Bubbling over with pride for you!", "You're a critical hit!", "Brewed with extra care, just for you!"],
          pet: ["Fizzy giggles! Hehe!", "Bubbles everywhere! I love it!"],
          hello: ["Hi! Freshly brewed and so happy to see you!", "Fizz! You're back! Hooray!"],
          morning: ["Good morning! Energy potion time!", "Morning, adventurer! Fully bubbling!"],
          night: ["Sleep is the best potion of all.", "Bubbles slowing down... bedtime?"],
          focus: ["Focus buff applied! You've got this!", "Quietly bubbling with you! Let's go."],
          done: ["Full power! What a session!", "Session cleared! Sparkly and amazing!"],
          task: ["Fizz! DONE!", "Critical hit! Yes yes yes!", "Task defeated! Woohoo!", "Power up! Another one down!"],
          break: ["Refill time! Grab some water!", "Cooldown break! Stretch it out!"]
        }
      }
    ]
  });

  /* Photography */
  COMP_DATA.push({
    theme: "photography",
    companions: [
      {
        id: "photography-camera", name: "Snap", kind: "Retro Camera", pose: "stand",
        bio: "A little retro camera who loves capturing your best study moments.",
        idle: ["wave", "bounce", "waddle"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="48" cy="108.5" rx="7" ry="4.2" fill="#6A4128" ${O}/><ellipse cx="72" cy="108.5" rx="7" ry="4.2" fill="#6A4128" ${O}/>`,
          body: `${LG("photography-camera-t", [[0, "#FFFAF0"], [1, "#EFE2CE"]])}${LG("photography-camera-b", [[0, "#D39A62"], [1, "#A9683A"]])}${RG("photography-camera-l", [[0, "#8FA3E0"], [0.55, "#4B4E8C"], [1, "#2A2446"]], 0.4, 0.38, 0.62)}
            <rect x="43" y="34" width="34" height="14" rx="5" fill="#EFE2CE" ${O}/>
            <rect x="80" y="36.5" width="10" height="8" rx="2.5" fill="#E8584A" ${O2}/>
            <rect x="20" y="44" width="80" height="62" rx="15" fill="url(#photography-camera-t)" ${O}/>
            <path d="M21.5 74H98.5V91C98.5 99.5 92.5 104.5 85 104.5H35C27.5 104.5 21.5 99.5 21.5 91Z" fill="url(#photography-camera-b)"/>
            <path d="M21.5 74H98.5" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
            <rect x="20" y="44" width="80" height="62" rx="15" fill="none" ${O}/>
            <rect x="25.5" y="49.5" width="10" height="6.5" rx="2" fill="#CFE6F7" ${OW(1.8)}/>
            <path d="M26 70.5V61.5" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            <circle cx="60" cy="90" r="15.5" fill="#3A3440" ${O}/>
            <circle cx="60" cy="90" r="10" fill="url(#photography-camera-l)" ${OW(2)}/>
            <path d="M54.5 86Q56.5 82.5 60.5 82" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><circle cx="64.5" cy="94" r="1.4" fill="#fff" opacity=".8"/>
            <path d="M89 81Q92 88 89 96" fill="none" stroke="#E6B07C" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`,
          armL: {svg: `<ellipse cx="17" cy="85" rx="5" ry="6.6" transform="rotate(24 17 85)" fill="#B87846" ${O}/>`, pivot: [24, 81]},
          armR: {svg: `<ellipse cx="103" cy="85" rx="5" ry="6.6" transform="rotate(-24 103 85)" fill="#B87846" ${O}/>`, pivot: [96, 81]}
        },
        eyes: {lx: 48, rx: 72, y: 59, r: 5, style: "dot", color: "#2A1C14"},
        mouth: {x: 60, y: 66.5, w: 3, color: "#2A1C14"},
        cheeks: {lx: 40, rx: 80, y: 66, w: 4.4, h: 2.8, color: "#FF8FA3"},
        anchors: {top: [60, 35, 1], neck: [60, 75, 1.35], chest: [85, 95, 0.66], back: [97, 58, 0.85], hands: [60, 95, 0.95]},
        lines: {
          tap: ["Say cheese! Hi! So happy to see you!", "Snap! This is a great moment!", "You look amazing in this light!", "Focus, click, and conquer! Let's go!", "Every day is a fresh frame! Love it!", "Let's zoom in together! You've got this!", "Best subject ever? You, studying!"],
          pet: ["Hehe! That tickles my lens!", "Aww! I'm keeping that one forever!"],
          hello: ["Hi! Ready for your close-up, star?", "Snap! You're back! Hooray!"],
          morning: ["Good morning! The light is perfect today!", "Morning, sunshine! Let's capture the day!"],
          night: ["Lens cap on soon? Rest time, friend.", "Low light now. Time to rest?"],
          focus: ["Sharp and steady! You've got this!", "Steady hands, clear mind! Let's go."],
          done: ["That's a wrap! What a session!", "Picture perfect focus! I'm so proud!"],
          task: ["SNAP! Done!", "Captured it! Woohoo!", "That's a keeper! Yes yes yes!", "Another one checked off! Flash!"],
          break: ["Blink break! Rest those eyes!", "Break time! Look far away and stretch!"]
        }
      },
      {
        id: "photography-raccoon", name: "Rocco", kind: "Snapshot Raccoon", pose: "sit", sleepy: true,
        bio: "A gentle raccoon who collects your best moments like little treasures.",
        idle: ["tailSwish", "earTwitch", "headTilt"], cheer: "hop",
        neck: [60, 77],
        parts: {
          tail: {svg: `${LG("photography-raccoon-t", [[0, "#C9C4D4"], [1, "#9A94AA"]])}
            <path d="M80 104C92 106 104 98 105 85C105.5 77 101 72 96.5 73C97 83 92 92 78 94Z" fill="url(#photography-raccoon-t)"/>
            <path d="M98.5 76.5Q101.5 81 103 80.5M97.5 88Q101 92 103 90.5" fill="none" stroke="#4A4458" stroke-width="5" stroke-linecap="round"/>
            <path d="M80 104C92 106 104 98 105 85C105.5 77 101 72 96.5 73C97 83 92 92 78 94Z" fill="none" ${O}/>`, pivot: [80, 99]},
          earL: {svg: `<path d="M37.5 51C34 41 35.5 33 39.5 30C45 30.5 50 35 52 42Z" fill="#B3ADC0" ${O}/><path d="M40.5 45C39 39.5 39.5 36 41 34.5C44 35.5 46.5 38.5 47.5 42Z" fill="#4A4458"/>`, pivot: [45, 46]},
          earR: {svg: `<path d="M82.5 51C86 41 84.5 33 80.5 30C75 30.5 70 35 68 42Z" fill="#B3ADC0" ${O}/><path d="M79.5 45C81 39.5 80.5 36 79 34.5C76 35.5 73.5 38.5 72.5 42Z" fill="#4A4458"/>`, pivot: [75, 46]},
          feet: `<g transform="rotate(-10 22 99)"><rect x="12" y="88" width="20" height="22" rx="2" fill="#FFFFFF" ${O2}/><rect x="15" y="91" width="14" height="12" rx="1" fill="#A9D8F2"/><circle cx="25" cy="95" r="2.4" fill="#FFD66B"/><path d="M15 103L20 97.5L24 101L26.5 99L29 103Z" fill="#7FC28A"/></g>
            <ellipse cx="48" cy="108" rx="8" ry="4.4" fill="#4A4458" ${O}/><ellipse cx="72" cy="108" rx="8" ry="4.4" fill="#4A4458" ${O}/>`,
          body: `${LG("photography-raccoon-b", [[0, "#C4BFCF"], [1, "#948EA4"]])}
            <path d="M60 71C77 71 86 85 86 97C86 106.5 76 110.5 60 110.5C44 110.5 34 106.5 34 97C34 85 43 71 60 71Z" fill="url(#photography-raccoon-b)" ${O}/>
            <ellipse cx="60" cy="97" rx="13.5" ry="10.5" fill="#F4F0F7"/>`,
          armL: {svg: `<ellipse cx="47.5" cy="89" rx="4.8" ry="6" transform="rotate(-24 47.5 89)" fill="#5A5468" ${O}/>`, pivot: [45, 83]},
          armR: {svg: `<ellipse cx="72.5" cy="89" rx="4.8" ry="6" transform="rotate(24 72.5 89)" fill="#5A5468" ${O}/>`, pivot: [75, 83]},
          head: `${LG("photography-raccoon-h", [[0, "#DDD9E5"], [1, "#AEA8BC"]])}
            <ellipse cx="60" cy="58" rx="26" ry="21" fill="url(#photography-raccoon-h)" ${O}/>
            <path d="M40.5 48Q44 41.5 51.5 39" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/>`,
          face: `<path d="M60 55C55 49.5 42 49 38 54.5C35.5 58 38 63 44 64C50 65 55.5 62 60 60.5C64.5 62 70 65 76 64C82 63 84.5 58 82 54.5C78 49 65 49.5 60 55Z" fill="#4A4458"/>
            <path d="M44 48.5Q49 46 54 48M66 48Q71 46 76 48.5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
            <ellipse cx="60" cy="67.5" rx="9" ry="6.5" fill="#F7F4FA"/><ellipse cx="60" cy="63.6" rx="2.8" ry="2" fill="#2B2233"/>`
        },
        eyes: {lx: 49.5, rx: 70.5, y: 57, r: 4.2, style: "round", color: "#2B2233"},
        mouth: {x: 60, y: 68.8, w: 2.4, style: "cat"},
        cheeks: {lx: 40.5, rx: 79.5, y: 68, w: 4, h: 2.5, color: "#FF9FB7"},
        anchors: {top: [60, 38, 0.95], neck: [60, 78, 1.05], chest: [72, 93, 0.7], back: [87, 86, 0.9], hands: [60, 97, 0.9]},
        lines: {
          tap: ["Psst! That's one for the album! So proud!", "The light in here is lovely today!", "Collecting happy moments with you!", "Tiny paws, big memories! Let's make more!", "This page is a keeper, just like you!", "Look at you, showing up again!", "One more treasure for the album! Yay!"],
          pet: ["Hehe! My tail is all fluffed up!", "Aww, that's a keeper!"],
          hello: ["Hi! I kept all your photos safe!", "Oh, hello! Smile! You made my day!"],
          morning: ["Good morning! Soft golden light for you!", "Morning, friend! Let's collect some wins!"],
          night: ["Night owl hours now... rest soon?", "Yawn. Time to curl up and sleep?"],
          focus: ["Quiet paws! You've got this!", "I'll guard the album. Heads down, go!"],
          done: ["What a picture-perfect session!", "Session done! That's going on the wall!"],
          task: ["Snapped it! WOO!", "One for the album! Yes!", "Treasure found! You did it!", "That's a keeper! So proud!"],
          break: ["Stretch those paws! Big reach!", "Snack break! I fully approve!"]
        }
      },
      {
        id: "photography-film", name: "Rolly", kind: "Film Roll Sprite", pose: "float",
        bio: "A little roll of film who keeps every moment of your progress.",
        idle: ["tailSwish", "topBob", "sparkle"], cheer: "spin",
        parts: {
          tail: {svg: `${LINE("M80 80C89 80 94 84 93 90C92 96 96 101 104 99", "#7A5238", 7.4)}<path d="M80 80C89 80 94 84 93 90C92 96 96 101 104 99" fill="none" stroke="#F2C890" stroke-width="2.6" stroke-dasharray="3 3.4"/>`, pivot: [80, 84]},
          body: `${LG("photography-film-l", [[0, "#FFDA73"], [1, "#F2A33A"]])}${LG("photography-film-c", [[0, "#F2F3F7"], [1, "#AEB3C2"]], 0, 0, 1, 0)}
            <rect x="37" y="45" width="46" height="50" rx="6" fill="url(#photography-film-l)" ${O}/>
            <rect x="35" y="40" width="50" height="9" rx="4" fill="url(#photography-film-c)" ${O}/>
            <rect x="35" y="91" width="50" height="9" rx="4" fill="url(#photography-film-c)" ${O}/>
            <path d="M42 56V82" stroke="#FFF2C4" stroke-width="3.2" stroke-linecap="round"/>
            <path d="M44 86.5H76" stroke="#E0762E" stroke-width="2.6" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="31" cy="74" rx="4.4" ry="5.8" transform="rotate(26 31 74)" fill="#F7B64A" ${O}/>`, pivot: [38, 71]},
          armR: {svg: `<ellipse cx="89" cy="70" rx="4.4" ry="5.8" transform="rotate(-26 89 70)" fill="#F7B64A" ${O}/>`, pivot: [82, 67]},
          top: {svg: `<rect x="53" y="32" width="14" height="9.5" rx="2.5" fill="#D6D9E2" ${O2}/><path d="M56.5 34.5V38.5M60 34.5V38.5M63.5 34.5V38.5" stroke="#9A9FB0" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [60, 41]}
        },
        eyes: {lx: 50.5, rx: 69.5, y: 66, r: 4.6, style: "dot", color: "#3A2418"},
        mouth: {x: 60, y: 74.5, w: 2.8, color: "#3A2418"},
        cheeks: {lx: 44, rx: 76, y: 73.5, w: 3.8, h: 2.5, color: "#FF7F96"},
        anchors: {top: [60, 34, 0.85], neck: [60, 90, 1.1], chest: [73, 83, 0.62], back: [83, 58, 0.8], hands: [60, 84, 0.85]},
        lines: {
          tap: ["Click! Hi there! So glad you're here!", "Rolling right along with you!", "Look at you, showing up again!", "Every frame of your progress looks great!", "Capturing your progress! It's stunning!", "This one's going straight in the album!", "Frame by frame, you're making magic!"],
          pet: ["Hehe! Careful, I'll unspool!", "Hehe! That tickles my film!"],
          hello: ["Hi! Fresh roll, ready to go!", "Hooray, you're here! Let's make memories!"],
          morning: ["Good morning! First frame of the day!", "Morning, star! Let's roll!"],
          night: ["Rewinding for the night. Rest soon?", "Last frame of the day... bedtime?"],
          focus: ["Exposure set! You've got this!", "Rolling quietly with you! Let's go."],
          done: ["That's a wrap! Wonderful session!", "A full roll of focus! Amazing!"],
          task: ["Click! DONE!", "Frame captured! Woohoo!", "Developed beautifully! Yes!", "Picture perfect! Another one down!"],
          break: ["Rest your eyes! Look far away!", "Break time! Let's have a big stretch!"]
        }
      }
    ]
  });

  /* New Year */
  COMP_DATA.push({
    theme: "newyear",
    companions: [
      {
        id: "newyear-hat", name: "Toot", kind: "Party Hat Pal", pose: "stand",
        bio: "A bouncy party hat who celebrates every little win with you.",
        idle: ["topBob", "bounce", "wave"], cheer: "spin",
        parts: {
          feet: `<ellipse cx="49" cy="108.5" rx="6.6" ry="4" fill="#5560C8" ${O}/><ellipse cx="71" cy="108.5" rx="6.6" ry="4" fill="#5560C8" ${O}/>`,
          body: `${LG("newyear-hat-g", [[0, "#FFC0D6"], [0.55, "#F58FB3"], [1, "#E0648F"]], 0.2, 0, 0.8, 1)}
            <path d="M57 25C58.4 22.6 61.6 22.6 63 25L94 97C96 101.5 93.5 104 89 104H31C26.5 104 24 101.5 26 97Z" fill="url(#newyear-hat-g)" ${O}/>
            <circle cx="60" cy="38" r="3" fill="#FFD95E" ${OW(1.8)}/><circle cx="52.5" cy="53" r="3.2" fill="#6FD8D0" ${OW(1.8)}/><circle cx="67.5" cy="53" r="3.2" fill="#FFD95E" ${OW(1.8)}/>
            <circle cx="42" cy="84" r="2" fill="#FFE3EC" opacity=".9"/><circle cx="80" cy="91" r="1.8" fill="#FFE3EC" opacity=".9"/>
            <path d="M52 32Q47 44 43.5 58" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".8"/>
            <rect x="22" y="96" width="76" height="11" rx="5.5" fill="#FFF6DC" ${O}/>
            <path d="M28 101.5H40M47 101.5H73M80 101.5H92" stroke="#F5C451" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 7"/>`,
          armL: {svg: `<ellipse cx="29" cy="86" rx="4.8" ry="6.4" transform="rotate(28 29 86)" fill="#F07AA0" ${O}/>`, pivot: [36, 83]},
          armR: {svg: `<ellipse cx="91" cy="86" rx="4.8" ry="6.4" transform="rotate(-28 91 86)" fill="#F07AA0" ${O}/>`, pivot: [84, 83]},
          top: {svg: `<path d="${puff(60, 18.5, 6.4, 7, 1.25)}" fill="#FFD95E" ${O2}/><circle cx="57.8" cy="16.5" r="1.8" fill="#FFF4C8"/>`, pivot: [60, 25]}
        },
        eyes: {lx: 50.5, rx: 69.5, y: 74, r: 4.8, style: "dot", color: "#2A1F44"},
        mouth: {x: 60, y: 83, w: 3, color: "#2A1F44"},
        cheeks: {lx: 43.5, rx: 76.5, y: 82, w: 4, h: 2.6, color: "#FF6F96"},
        anchors: {top: [60, 30, 0.8], neck: [60, 94, 1.3], chest: [75, 92, 0.66], back: [86, 74, 0.85], hands: [60, 94, 0.9]},
        lines: {
          tap: ["Toot toot! Hi! The party just got better!", "Every day with you is worth a party!", "Here's to you! Hip hip hooray!", "Cheers to all your wins, big and small!", "New page, new start! Let's go!", "Confetti for your effort!", "You're doing great! Toot toot!"],
          pet: ["Toot! It's party time!", "Hehe! The confetti tickles!"],
          hello: ["Toot! You're here! Let's celebrate!", "Hi! Now the party can really start!"],
          morning: ["Good morning! A fresh new start!", "Morning! I'm so glad you're here!"],
          night: ["The party's winding down. Rest soon?", "Even party hats need sleep. Bedtime?"],
          focus: ["Party on pause! You've got this!", "Heads down! I'll save the confetti."],
          done: ["Session done! Throw the confetti!", "Confetti time! You were incredible!"],
          task: ["Toot! DONE!", "Pop! Checked off! Woohoo!", "That deserves a big cheer! Hooray!", "Cheers to you! Another one down!"],
          break: ["Dance break! Shake it out!", "Snack break! Party mix, anyone?"]
        }
      },
      {
        id: "newyear-clock", name: "Tick", kind: "Midnight Clock", pose: "sit", sleepy: true,
        bio: "A sleepy little alarm clock who counts down calmly with you.",
        idle: ["earTwitch", "sway", "bounce"], cheer: "hop",
        parts: {
          earL: {svg: `${LG("newyear-clock-bl", [[0, "#FFE58A"], [1, "#E0A928"]])}<path d="M29 51C27 41 33 33 42 32C44 38 42 47 34 53Z" fill="url(#newyear-clock-bl)" ${O}/><path d="M32 42Q34 37 38 35.5" fill="none" stroke="#FFF4C8" stroke-width="2.2" stroke-linecap="round"/>`, pivot: [37, 50]},
          earR: {svg: `${LG("newyear-clock-br", [[0, "#FFE58A"], [1, "#E0A928"]])}<path d="M91 51C93 41 87 33 78 32C76 38 78 47 86 53Z" fill="url(#newyear-clock-br)" ${O}/>`, pivot: [83, 50]},
          feet: `<path d="M38 100L32 110M82 100L88 110" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M38 100L32 110M82 100L88 110" stroke="#F5C451" stroke-width="2.6" stroke-linecap="round"/>`,
          body: `${LG("newyear-clock-g", [[0, "#6E7BE0"], [1, "#3A45A8"]])}
            <path d="M56 38.5H64" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M56 38.5H64" stroke="#F5C451" stroke-width="2.4" stroke-linecap="round"/>
            <circle cx="60" cy="72" r="32" fill="url(#newyear-clock-g)" ${O}/>
            <circle cx="60" cy="73" r="25.5" fill="#FFFAF0" ${OW(2.2)}/>
            <path d="M34 60Q36 50 44 45" fill="none" stroke="#A9B3FF" stroke-width="3" stroke-linecap="round"/>
            <path d="M60 51V54M83 73H80M60 95V92M37 73H40" stroke="#C7BFD6" stroke-width="2.2" stroke-linecap="round"/>
            ${LINE("M60 67V55", "#F5C451", 2.2)}<circle cx="60" cy="67" r="2.4" fill="#F5C451" ${OW(1.6)}/>`,
          armL: {svg: `<ellipse cx="26" cy="82" rx="4.8" ry="6.4" transform="rotate(26 26 82)" fill="#4A56BC" ${O}/>`, pivot: [32, 79]},
          armR: {svg: `<ellipse cx="94" cy="82" rx="4.8" ry="6.4" transform="rotate(-26 94 82)" fill="#4A56BC" ${O}/>`, pivot: [88, 79]}
        },
        eyes: {lx: 49.5, rx: 70.5, y: 76, r: 4.6, style: "dot", color: "#232A5E"},
        mouth: {x: 60, y: 84.5, w: 2.8, color: "#232A5E"},
        cheeks: {lx: 43, rx: 77, y: 83.5, w: 4, h: 2.6, color: "#FF8FB3"},
        anchors: {top: [60, 41, 1], neck: [60, 101, 1.05], chest: [80, 95, 0.66], back: [92, 64, 0.9], hands: [60, 98, 0.9]},
        lines: {
          tap: ["Tick tock, hi! So happy you're here!", "Right on time, as always! Love it!", "Every minute with you is a good one!", "No rush! We've got all the time we need!", "Time well spent with you!", "Tock! You're doing great!", "Look at you, showing up again!"],
          pet: ["Ding ding! Hehe!", "Tickled pink!"],
          hello: ["Tick! Perfect timing! Welcome back!", "Hi! Right on the hour! Hooray!"],
          morning: ["Ring ring! Good morning, sunshine!", "Morning! Fresh hours ahead, let's go!"],
          night: ["It's getting late. Time for bed?", "Tick tock. Sleepy yet, friend?"],
          focus: ["I'll keep time! You've got this!", "Soft ticking! Heads down, let's go."],
          done: ["Ding! Time so well spent!", "Right on time! You were amazing!"],
          task: ["Tick! DONE!", "Right on schedule! Woohoo!", "Ding ding! Another one down!", "Yes yes yes! Perfect timing!"],
          break: ["Time out! Let's have a stretch!", "Break o'clock! Grab some water!"]
        }
      },
      {
        id: "newyear-disco", name: "Glitz", kind: "Glitter Ball", pose: "float",
        bio: "A twinkly glitter ball who throws sparkles on every finished task.",
        idle: ["sparkle", "spin", "topBob"], cheer: "spin",
        parts: {
          body: `${RG("newyear-disco-g", [[0, "#FFFFFF"], [0.45, "#E2DCFF"], [1, "#8F86D6"]], 0.4, 0.36, 0.7)}
            <circle cx="60" cy="66" r="26" fill="url(#newyear-disco-g)" ${O}/>
            <rect x="45.9" y="43.3" width="5.2" height="4.4" rx="1.2" fill="#FFFFFF"/><rect x="52.9" y="43.3" width="5.2" height="4.4" rx="1.2" fill="#FF9EC0"/><rect x="59.9" y="43.3" width="5.2" height="4.4" rx="1.2" fill="#7FE0D8"/><rect x="66.9" y="43.3" width="5.2" height="4.4" rx="1.2" fill="#FFD66B"/><rect x="39.4" y="49.3" width="5.2" height="4.4" rx="1.2" fill="#B9A6FF"/><rect x="46.4" y="49.3" width="5.2" height="4.4" rx="1.2" fill="#FFFFFF"/><rect x="53.4" y="49.3" width="5.2" height="4.4" rx="1.2" fill="#FF9EC0"/><rect x="60.4" y="49.3" width="5.2" height="4.4" rx="1.2" fill="#7FE0D8"/><rect x="67.4" y="49.3" width="5.2" height="4.4" rx="1.2" fill="#FFD66B"/><rect x="74.4" y="49.3" width="5.2" height="4.4" rx="1.2" fill="#B9A6FF"/><rect x="42.9" y="80.3" width="5.2" height="4.4" rx="1.2" fill="#FFFFFF"/><rect x="49.9" y="80.3" width="5.2" height="4.4" rx="1.2" fill="#FF9EC0"/><rect x="56.9" y="80.3" width="5.2" height="4.4" rx="1.2" fill="#7FE0D8"/><rect x="63.9" y="80.3" width="5.2" height="4.4" rx="1.2" fill="#FFD66B"/><rect x="70.9" y="80.3" width="5.2" height="4.4" rx="1.2" fill="#B9A6FF"/><rect x="49.4" y="86.3" width="5.2" height="4.4" rx="1.2" fill="#FFFFFF"/><rect x="56.4" y="86.3" width="5.2" height="4.4" rx="1.2" fill="#FF9EC0"/><rect x="63.4" y="86.3" width="5.2" height="4.4" rx="1.2" fill="#7FE0D8"/>
            <path d="M39 58Q41 48 48.5 43.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>
            <path d="M80 44.5l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2Z" fill="#fff" ${OW(1.4)}/>`,
          armL: {svg: `<ellipse cx="34" cy="74" rx="4.4" ry="5.8" transform="rotate(26 34 74)" fill="#DCD5FF" ${O}/>`, pivot: [40, 71]},
          armR: {svg: `<ellipse cx="86" cy="74" rx="4.4" ry="5.8" transform="rotate(-26 86 74)" fill="#DCD5FF" ${O}/>`, pivot: [80, 71]},
          top: {svg: `${LINE("M60 36V22", "#F5C451", 2)}<rect x="54" y="35.5" width="12" height="6.5" rx="2.4" fill="#F5C451" ${O2}/>`, pivot: [60, 41]}
        },
        eyes: {lx: 50.5, rx: 69.5, y: 65, r: 4.6, style: "sparkle", color: "#2A1F44"},
        mouth: {x: 60, y: 73, w: 2.8, color: "#2A1F44"},
        cheeks: {lx: 43.5, rx: 76.5, y: 72, w: 4, h: 2.5, color: "#FF8FB3"},
        anchors: {top: [60, 41, 0.9], neck: [60, 86, 0.95], chest: [74, 84, 0.62], back: [85, 60, 0.8], hands: [60, 83, 0.85]},
        lines: {
          tap: ["Sparkle sparkle, hi! You're here!", "You're absolutely shining today!", "A little extra glitter, just for you!", "Keep spinning, star! You're amazing!", "Look at you sparkle!", "Twinkle! Such nice work!", "Let's make today dazzling!"],
          pet: ["Oops! Glitter everywhere! Hehe!", "I'm spinning with joy!"],
          hello: ["Hi! The party lights are on for you!", "Sparkle! You're back! Hooray!"],
          morning: ["Good morning! Catching the light with you!", "Morning, shiny star! Let's dazzle!"],
          night: ["Lights dimming now. Rest soon?", "The party's over. Sleep well, star."],
          focus: ["Soft sparkle mode! You've got this!", "Spinning slowly with you! Let's go."],
          done: ["Dazzling session! You were brilliant!", "You shone so bright! Well done!"],
          task: ["Sparkle! DONE!", "Glittering work! Woohoo!", "Dazzling! Another one down!", "Shine on, superstar! Checked off!"],
          break: ["Twirl break! Spin and stretch!", "Rest your eyes from all that sparkle!"]
        }
      }
    ]
  });

  /* Lunar New Year */
  COMP_DATA.push({
    theme: "lunarnewyear",
    companions: [
      {
        id: "lunarnewyear-lantern", name: "Lulu", kind: "Red Paper Lantern", pose: "float",
        bio: "A glowing red lantern who lights your way to a lucky new year.",
        idle: ["tailSwish", "sparkle", "sway"], cheer: "spin",
        parts: {
          tail: {svg: `<path d="M56 93L54.5 105C54.3 107 56 108 57.5 108H62.5C64 108 65.7 107 65.5 105L64 93Z" fill="#E0463C" ${O2}/><path d="M58 97V105M62 97V105" stroke="#B82E2A" stroke-width="1.6" stroke-linecap="round"/><circle cx="60" cy="93.5" r="3.6" fill="#F5C451" ${O2}/>`, pivot: [60, 90]},
          body: `${RG("lunarnewyear-lantern-g", [[0, "#FF9A72"], [0.5, "#F2594A"], [1, "#C8302C"]], 0.5, 0.45, 0.6)}
            <rect x="46" y="35.5" width="28" height="8" rx="3" fill="#F5C451" ${O}/>
            <rect x="46" y="84.5" width="28" height="8" rx="3" fill="#F5C451" ${O}/>
            <ellipse cx="60" cy="64" rx="31" ry="24" fill="url(#lunarnewyear-lantern-g)" ${O}/>
            <path d="M40 44.5C33.5 51 33.5 77 40 83.5M80 44.5C86.5 51 86.5 77 80 83.5" fill="none" stroke="#B82E2A" stroke-width="2.2" stroke-linecap="round" opacity=".75"/>
            <path d="M36.5 58Q38.5 49 46 45" fill="none" stroke="#FFC7B0" stroke-width="3.2" stroke-linecap="round"/>
            <path d="M44 43.5H76M44 84.5H76" stroke="#F5C451" stroke-width="2.4" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="28" cy="72" rx="4.6" ry="6" transform="rotate(26 28 72)" fill="#E54A3E" ${O}/>`, pivot: [34, 69]},
          armR: {svg: `<ellipse cx="92" cy="72" rx="4.6" ry="6" transform="rotate(-26 92 72)" fill="#E54A3E" ${O}/>`, pivot: [86, 69]},
          top: {svg: `<path d="M60 36V30" stroke="${INK}" stroke-width="5.6" stroke-linecap="round"/><path d="M60 36V30" stroke="#F5C451" stroke-width="2.2" stroke-linecap="round"/><circle cx="60" cy="25" r="5" fill="none" stroke="${INK}" stroke-width="5.6"/><circle cx="60" cy="25" r="5" fill="none" stroke="#F5C451" stroke-width="2.2"/>`, pivot: [60, 36]}
        },
        eyes: {lx: 50, rx: 70, y: 62, r: 4.8, style: "dot", color: "#3A0E0E"},
        mouth: {x: 60, y: 70.5, w: 2.8, color: "#3A0E0E"},
        cheeks: {lx: 42.5, rx: 77.5, y: 69.5, w: 4.2, h: 2.7, color: "#FFC2A8"},
        anchors: {top: [60, 37, 0.9], neck: [60, 88, 0.85], chest: [76, 78, 0.64], back: [87, 56, 0.85], hands: [60, 80, 0.85]},
        lines: {
          tap: ["Hello! I'm glowing just for you!", "May your studies be bright and joyful!", "Lighting the way, step by step!", "Good fortune follows your effort!", "A little warm light for a wonderful you!", "I'm so glad you're here!", "You're shining so brightly today!"],
          pet: ["Hehe! I'm glowing extra bright!", "So warm and happy!"],
          hello: ["Hi! The lanterns are lit for you!", "Welcome back! Wishing you good luck today!"],
          morning: ["Good morning! A bright and lucky new day!", "Morning, lucky one! Let's shine!"],
          night: ["My glow is getting low... rest soon?", "The lanterns are dimming. Time to sleep?"],
          focus: ["Soft light on! You've got this!", "Glowing quietly beside you! Let's go."],
          done: ["What a bright session! Wonderful!", "You glowed the whole way! Well done!"],
          task: ["Yes! Another one off the list!", "Bright work! Woohoo!", "Fortune smiles on you! Done!", "Lit up and checked off! Hooray!"],
          break: ["Float and stretch a little!", "Tea break! Sip something warm!"]
        }
      },
      {
        id: "lunarnewyear-dumpling", name: "Jiaozi", kind: "Little Dumpling", pose: "sit", sleepy: true,
        bio: "A plump little dumpling, warm and cozy, stuffed with good wishes.",
        idle: ["bounce", "sway", "wave"], cheer: "bounce",
        parts: {
          body: `${LG("lunarnewyear-dumpling-g", [[0, "#FFFCF4"], [0.6, "#F8ECD8"], [1, "#E9CFA6"]])}
            <path d="M18 99C18 76 34 58 60 57C86 58 102 76 102 99C102 107.5 91 110.5 60 110.5C29 110.5 18 107.5 18 99Z" fill="url(#lunarnewyear-dumpling-g)" ${O}/>
            <path d="M31 64Q35 55.5 41 58.5Q44 49.5 51 52Q55 44 60 45.5Q65 44 69 52Q76 49.5 79 58.5Q85 55.5 89 64Q76 60 60 60Q44 60 31 64Z" fill="#FFF8EA" ${O2}/>
            <path d="M44 56Q47 59.5 46.5 63M53 51.5Q56 56 55.5 61M67 51.5Q64 56 64.5 61M76 56Q73 59.5 73.5 63" fill="none" stroke="#DCC49E" stroke-width="2" stroke-linecap="round"/>
            <path d="M25 90Q26 78 33 71" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>
            <path d="M28 104Q60 111 92 104" fill="none" stroke="#E0B470" stroke-width="3" stroke-linecap="round" opacity=".7"/>`,
          armL: {svg: `<ellipse cx="17" cy="92" rx="5" ry="6.6" transform="rotate(26 17 92)" fill="#FAF0DE" ${O}/>`, pivot: [24, 89]},
          armR: {svg: `<ellipse cx="103" cy="92" rx="5" ry="6.6" transform="rotate(-26 103 92)" fill="#FAF0DE" ${O}/>`, pivot: [96, 89]},
          top: {svg: `${LINE("M55 43C51 38 57 35 54 30", "#FFFFFF", 2.6)}${LINE("M65 43C61 38 67 35 64 30", "#FFFFFF", 2.6)}`, pivot: [60, 46]}
        },
        eyes: {lx: 47.5, rx: 72.5, y: 83, r: 5, style: "dot", color: "#3A2418"},
        mouth: {x: 60, y: 91, w: 3, color: "#3A2418"},
        cheeks: {lx: 38.5, rx: 81.5, y: 90, w: 4.8, h: 3, color: "#FF9FB0"},
        anchors: {top: [60, 50, 1.05], neck: [60, 101, 1.3], chest: [80, 100, 0.66], back: [94, 82, 0.9], hands: [60, 101, 0.9]},
        lines: {
          tap: ["Hi! Freshly steamed and so happy to see you!", "Stuffed with good wishes for you!", "Wrapped up in luck, just for you!", "Warm and cozy, that's us! Let's go!", "One fold at a time, and look at you now!", "You're doing wonderfully!", "Look at you, showing up again! Yay!"],
          pet: ["Squish! Hehe!", "So warm and fluffy now!"],
          hello: ["Hi! I stayed warm just for you!", "Hello! Come sit down, I'm so glad you're here!"],
          morning: ["Good morning! A warm and lucky start!", "Morning, lucky friend! Let's do this!"],
          night: ["Cozy in the steamer... bedtime soon?", "Sleepy dumpling here. Rest too?"],
          focus: ["Warm and quiet! You've got this!", "I'll stay cozy in the steamer. Go go!"],
          done: ["Perfectly steamed session! Amazing!", "Lucky and done! I'm so proud of you!"],
          task: ["Yes! DONE!", "Folded up perfectly! Woohoo!", "Another one checked off! Lucky you!", "Look at you go! Hooray!"],
          break: ["Snack break! Something warm and cozy!", "Stretch break and a sip of tea!"]
        }
      },
      {
        id: "lunarnewyear-dragon", name: "Loong", kind: "Baby Dragon", pose: "stand",
        bio: "A little golden dragon who dances in with luck and courage.",
        idle: ["tailSwish", "headTilt", "earTwitch"], cheer: "hop",
        neck: [60, 74],
        parts: {
          tail: {svg: `${LG("lunarnewyear-dragon-t", [[0, "#FFD677"], [1, "#F0A33A"]])}<path d="M74 100C86 104 96 98 97 88C97.5 82 95 78 92 77C92 84 88 92 72 92Z" fill="url(#lunarnewyear-dragon-t)" ${O}/><path d="M92 77C94 71 100 70 103 73C100 74 101.5 78 104 79.5C100 82 96 80.5 94.5 81Z" fill="#E8463C" ${O2}/>`, pivot: [74, 96]},
          earL: {svg: `<path d="M45 37C42.5 31 40.5 25 40.5 19.5C40.5 16.5 44.5 16.5 45 19.5L46.2 25.5C47 22.5 49.5 21 51.5 22C52.5 25 50 28 48 29.5L51 35Z" fill="#FFF1D6" ${O2}/>`, pivot: [49, 36]},
          earR: {svg: `<path d="M75 37C77.5 31 79.5 25 79.5 19.5C79.5 16.5 75.5 16.5 75 19.5L73.8 25.5C73 22.5 70.5 21 68.5 22C67.5 25 70 28 72 29.5L69 35Z" fill="#FFF1D6" ${O2}/>`, pivot: [71, 36]},
          feet: `<ellipse cx="50" cy="108.5" rx="6.6" ry="4.2" fill="#F0A33A" ${O}/><ellipse cx="70" cy="108.5" rx="6.6" ry="4.2" fill="#F0A33A" ${O}/>`,
          body: `${LG("lunarnewyear-dragon-b", [[0, "#FFD677"], [1, "#EFA23A"]])}
            <ellipse cx="60" cy="91" rx="18.5" ry="17" fill="url(#lunarnewyear-dragon-b)" ${O}/>
            <ellipse cx="60" cy="94" rx="10.5" ry="12" fill="#FFF3D6"/>
            <path d="M53.5 90Q60 93 66.5 90M54.5 97Q60 100 65.5 97" fill="none" stroke="#EBC98A" stroke-width="1.8" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="44" cy="92" rx="4.6" ry="6.4" transform="rotate(26 44 92)" fill="#F7B64A" ${O}/>`, pivot: [48, 86]},
          armR: {svg: `<ellipse cx="76" cy="92" rx="4.6" ry="6.4" transform="rotate(-26 76 92)" fill="#F7B64A" ${O}/>`, pivot: [72, 86]},
          head: `${LG("lunarnewyear-dragon-h", [[0, "#FFE29A"], [1, "#F4AE44"]])}
            <ellipse cx="60" cy="54" rx="26" ry="22" fill="url(#lunarnewyear-dragon-h)" ${O}/>
            <path d="M40.5 48Q44 39.5 52.5 36.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`,
          face: `<circle cx="56.5" cy="60" r="1.2" fill="#8A4A1A"/><circle cx="63.5" cy="60" r="1.2" fill="#8A4A1A"/>${LINE("M35.5 59C29 57 25 60 26.5 64", "#E8463C", 2)}${LINE("M84.5 59C91 57 95 60 93.5 64", "#E8463C", 2)}`,
          top: {svg: `<path d="M53 34C50 27 54 22 57 24C57 19 63 17 64 22C67 20 71 24 68 30C67 32 66 33.5 65 34Z" fill="#E8463C" ${O2}/><path d="M58 30Q59 26 61.5 25" fill="none" stroke="#FF9A8A" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [60, 34]}
        },
        eyes: {lx: 48.5, rx: 71.5, y: 53, r: 4.8, style: "dot", color: "#3A1E0E"},
        mouth: {x: 60, y: 64.5, w: 2.8, style: "cat", color: "#3A1E0E"},
        cheeks: {lx: 41.5, rx: 78.5, y: 61, w: 4.2, h: 2.7, color: "#FF8F8F"},
        anchors: {top: [60, 33, 1], neck: [60, 75, 0.95], chest: [69, 96, 0.66], back: [85, 84, 0.85], hands: [60, 95, 0.9]},
        lines: {
          tap: ["Rawr! Hello, friend! So glad you're here!", "Brave heart, steady steps! That's you!", "Dancing into a lucky year with you!", "You're full of dragon spirit!", "Let's soar a little higher today!", "Fortune favors the curious, like you!", "Tiny dragon, BIG cheers for you!"],
          pet: ["Rawr hehe! That tickles!", "My whiskers are wiggling with joy!"],
          hello: ["Rawr! Welcome back, brave one!", "Hi! Luck is on your side today!"],
          morning: ["Good morning! Ready to soar?", "Morning, brave one! Let's fly!"],
          night: ["Even dragons curl up at night. Bed?", "Sleepy rawr... rest soon?"],
          focus: ["Courage on! You've got this!", "I'll guard your quiet time. Let's go!"],
          done: ["Rawr! What a mighty session!", "Luck and hard work! You were amazing!"],
          task: ["Rawr! DONE!", "Lucky win! Woohoo!", "Dragon-sized progress! Yes!", "Mighty fine! Another one down!"],
          break: ["Big stretch! Wings out wide!", "Tea break! Rest those claws a bit!"]
        }
      }
    ]
  });

  /* Valentine's */
  COMP_DATA.push({
    theme: "valentines",
    companions: [
      {
        id: "valentines-heart", name: "Lovey", kind: "Winged Heart", pose: "float",
        bio: "A little winged heart who flutters by to cheer you on with love.",
        idle: ["wingFlutter", "sparkle", "sway"], cheer: "spin",
        parts: {
          wingL: {svg: `<path d="M34.5 54C26.5 41 12.5 37 8.5 43C5.5 49 10.5 53 14.5 54C8.5 57 9.5 64 16.5 64C18.5 68 26.5 68 32.5 63Z" fill="#FFFFFF" ${OW(2.4)}/><path d="M30.5 57Q20.5 54 13.5 49M29.5 61Q22.5 61 17 59.5" fill="none" stroke="#F7C2D3" stroke-width="1.7" stroke-linecap="round"/>`, pivot: [34.5, 57]},
          wingR: {svg: `<path d="M85.5 54C93.5 41 107.5 37 111.5 43C114.5 49 109.5 53 105.5 54C111.5 57 110.5 64 103.5 64C101.5 68 93.5 68 87.5 63Z" fill="#FFFFFF" ${OW(2.4)}/><path d="M89.5 57Q99.5 54 106.5 49M90.5 61Q97.5 61 103 59.5" fill="none" stroke="#F7C2D3" stroke-width="1.7" stroke-linecap="round"/>`, pivot: [85.5, 57]},
          body: `${RG("valentines-heart-g", [[0, "#FFD0E0"], [0.55, "#FF8FB4"], [1, "#E8466E"]], 0.4, 0.35, 0.72)}
            <path d="M60 49C53.1 35.8 27.2 33.5 24.9 54.8C23.8 73.2 42.8 87 60 102.5C77.2 87 96.2 73.2 95.1 54.8C92.8 33.5 66.9 35.8 60 49Z" fill="url(#valentines-heart-g)" ${O}/>
            <path d="M32.4 56Q33 45.6 42.2 42.2" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/><circle cx="33.5" cy="64" r="2.07" fill="#fff"/>
            <path d="M50.8 91.6Q60 98.5 69.2 91.6" fill="none" stroke="#D8305A" stroke-width="2.2" stroke-linecap="round" opacity=".45"/>`,
          armL: {svg: `<ellipse cx="29" cy="76.7" rx="5.06" ry="6.67" transform="rotate(30 29 76.7)" fill="#FF9DBD" ${O}/>`, pivot: [35.9, 73.2]},
          armR: {svg: `<ellipse cx="91" cy="76.7" rx="5.06" ry="6.67" transform="rotate(-30 91 76.7)" fill="#FF9DBD" ${O}/>`, pivot: [84.2, 73.2]}
        },
        eyes: {lx: 47.4, rx: 72.6, y: 63, r: 5.4, style: "sparkle", color: "#3A1020"},
        mouth: {x: 60, y: 72.6, w: 3.1, color: "#3A1020"},
        cheeks: {lx: 38.7, rx: 81.3, y: 71, w: 4.6, h: 3, color: "#FFD6E4"},
        anchors: {top: [60, 48, 0.95], neck: [60, 85, 1], chest: [74, 83, 0.7], back: [89, 66, 0.9], hands: [60, 84, 0.95]},
        lines: {
          tap: ["Hi! I'm so happy to see you!", "You're so loved! Never forget it!", "Sending you a big heart!", "Be gentle with yourself! You're amazing!", "Heart and mind, all in! Let's go!", "Flutter flutter! You've got this!", "Your hard work really shows!"],
          pet: ["Hehe! That tickles my wings!", "Aww, my heart is full!"],
          hello: ["Hi! I'm so glad you're here!", "Hello! I missed you so much!"],
          morning: ["Good morning, sweet pea!", "Morning! Let's make today wonderful!"],
          night: ["Sweet dreams soon, okay?", "Rest your heart now. Bedtime?"],
          focus: ["Wings folded! You've got this!", "Heads down! I'm cheering quietly."],
          done: ["What a lovely session! Amazing!", "You did it! I'm fluttering with pride!"],
          task: ["DONE! Lovely!", "Yes yes yes! Sweet success!", "Another one done! My heart is soaring!", "Checked off with love! Woohoo!"],
          break: ["Flutter break! Up and stretch!", "Break time! Sip some water, sweet pea!"]
        }
      },
      {
        id: "valentines-letter", name: "Postie", kind: "Love Letter", pose: "stand",
        bio: "A little love letter sealed with a heart, full of kind words for you.",
        idle: ["wave", "waddle", "bounce"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="48" cy="108.5" rx="6.6" ry="4" fill="#E8739A" ${O}/><ellipse cx="72" cy="108.5" rx="6.6" ry="4" fill="#E8739A" ${O}/>`,
          body: `${LG("valentines-letter-g", [[0, "#FFF8FA"], [1, "#F7DCE4"]])}
            <rect x="18" y="47" width="84" height="58" rx="9" fill="url(#valentines-letter-g)" ${O}/>
            <path d="M22 101L50 80M98 101L70 80" fill="none" stroke="#E9BCC9" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M21 51.5L56 76.5C58.4 78.2 61.6 78.2 64 76.5L99 51.5" fill="#FDEBF0" ${OW(2.4)}/>
            <path d="M25.5 60V72" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            <path d="M60 86.5C57.5 82 50.5 82.5 50.5 88C50.5 92.5 56 95.5 60 99C64 95.5 69.5 92.5 69.5 88C69.5 82.5 62.5 82 60 86.5Z" fill="#E03C66" ${O2}/><path d="M54 87.5Q55 85 57.5 85" fill="none" stroke="#FF9AB5" stroke-width="1.8" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="14.5" cy="82" rx="4.8" ry="6.4" transform="rotate(24 14.5 82)" fill="#FBE0E8" ${O}/>`, pivot: [21, 78]},
          armR: {svg: `<ellipse cx="105.5" cy="82" rx="4.8" ry="6.4" transform="rotate(-24 105.5 82)" fill="#FBE0E8" ${O}/>`, pivot: [99, 78]}
        },
        eyes: {lx: 45, rx: 75, y: 62, r: 4.8, style: "dot", color: "#3A1020"},
        mouth: {x: 60, y: 68.5, w: 2.8, color: "#3A1020"},
        cheeks: {lx: 37, rx: 83, y: 69, w: 4.2, h: 2.7, color: "#FF8FB0"},
        anchors: {top: [60, 48, 1.05], neck: [60, 103, 1.4], chest: [86, 93, 0.66], back: [99, 58, 0.85], hands: [60, 92, 0.95]},
        lines: {
          tap: ["Special delivery, just for you!", "Sealed with a great big smile!", "Dear you: you're doing great!", "P.S. I believe in you so much!", "Signed, sealed, and so proud of you!", "A kind note, just because you're you!", "Every page you write counts! Keep going!"],
          pet: ["Hehe! Careful with my seal!", "Aww, thank you! That made my day!"],
          hello: ["Dear friend, welcome back!", "Hi! You've got mail! It says hooray!"],
          morning: ["Good morning! A fresh letter for you!", "Morning, dear! Today's going to be great!"],
          night: ["Tucking into my envelope. Bed soon?", "Sweet dreams, from your little letter."],
          focus: ["Quiet desk, kind words! You've got this!", "Writing right along with you! Let's go."],
          done: ["Signed, sealed, and spectacular!", "What a lovely session! Bravo!"],
          task: ["Delivered! WOO!", "Sealed and done! Yes!", "Stamped and checked off! Hooray!", "Another one done, with love!"],
          break: ["Stretch break and a sip of water!", "Break time! Draw a happy doodle!"]
        }
      },
      {
        id: "valentines-lovebird", name: "Rosie", kind: "Little Lovebird", pose: "sit", sleepy: true,
        bio: "A round, rosy lovebird who sits close and sings you soft songs.",
        idle: ["wingFlutter", "topBob", "tailSwish"], cheer: "wingFlutter",
        parts: {
          tail: {svg: `<path d="M80 98C90 101 99 98 103 92C98 91 95 92 92 90C95 88 97 85 97 82C91 84 86 88 82 92Z" fill="#E8587F" ${O}/>`, pivot: [80, 97]},
          feet: `<path d="M49 106v5M52.5 106v5M67.5 106v5M71 106v5" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M49 106v5M52.5 106v5M67.5 106v5M71 106v5" stroke="#FFB35A" stroke-width="2" stroke-linecap="round"/>`,
          body: `${LG("valentines-lovebird-g", [[0, "#FFE2CF"], [0.55, "#FFC0A0"], [1, "#F29A78"]])}
            <path d="M60 46C80 46 91 62 91 80C91 99 79 109.5 60 109.5C41 109.5 29 99 29 80C29 62 40 46 60 46Z" fill="url(#valentines-lovebird-g)" ${O}/>
            <path d="M60 64C71 64 80 72 80 85C80 98 71 104.5 60 104.5C49 104.5 40 98 40 85C40 72 49 64 60 64Z" fill="#FFF6EE"/>
            <path d="M36.5 68Q39 57 47 52" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>
            <path d="M54 96q3 2 6 0M61 100q3 2 6 0" fill="none" stroke="#F5CDB6" stroke-width="1.8" stroke-linecap="round"/>`,
          armL: {svg: `<path d="M34.5 74C27 80 25 92 29 99C35 97 39.5 88 39 78Z" fill="#E8587F" ${O}/><path d="M32 85Q31 90 31.5 94" fill="none" stroke="#F48FAE" stroke-width="1.7" stroke-linecap="round"/>`, pivot: [36, 76]},
          armR: {svg: `<path d="M85.5 74C93 80 95 92 91 99C85 97 80.5 88 81 78Z" fill="#E8587F" ${O}/><path d="M88 85Q89 90 88.5 94" fill="none" stroke="#F48FAE" stroke-width="1.7" stroke-linecap="round"/>`, pivot: [84, 76]},
          top: {svg: `<path d="M58 48C54 42 55 36 59 34C59 38 61 40 62 42C63 38 66 36 70 37C67 40 65 44 63 48Z" fill="#F27CA0" ${O2}/>`, pivot: [60, 48]}
        },
        eyes: {lx: 48.5, rx: 71.5, y: 69, r: 4.6, style: "dot", color: "#3A1020"},
        mouths: {
          neutral: `<path d="M56.5 75.5Q60 74 63.5 75.5L60 80.5Z" fill="#FFB35A" ${OW(1.8)}/>`,
          smile: `<path d="M56.2 75.3Q60 73.8 63.8 75.3L60 80.8Z" fill="#FFC06E" ${OW(1.8)}/><path d="M53.5 78q1.8 1.4 3.6 .3M66.5 78q-1.8 1.4 -3.6 .3" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>`,
          open: `<path d="M56.8 77.4H63.2L60 81.4Z" fill="#FF8FA8" ${OW(1.5)}/><path d="M56.2 74.6Q60 73.2 63.8 74.6L60 77.6Z" fill="#FFB35A" ${OW(1.8)}/><path d="M57.2 79.2H62.8L60 83.4Z" fill="#FFB35A" ${OW(1.8)}/>`,
          sleepy: `<path d="M57 75.8Q60 74.6 63 75.8L60 79.8Z" fill="#F2A248" ${OW(1.8)}/>`
        },
        mouth: {x: 60, y: 77.5, w: 3},
        cheeks: {lx: 41.5, rx: 78.5, y: 76, w: 4.4, h: 2.8, color: "#FF6F96"},
        anchors: {top: [60, 48, 1], neck: [60, 88, 1.25], chest: [72, 95, 0.66], back: [88, 72, 0.9], hands: [60, 95, 0.9]},
        lines: {
          tap: ["Tweet tweet! Hi there!", "Flock together, study together! Yay!", "You make me want to sing!", "Cheep! You're doing great!", "Feathers and kind words, all for you!", "Snuggle up and keep going! You've got this!", "A big song for your big effort!"],
          pet: ["Cheep cheep! I love it!", "So fluffy and so happy!"],
          hello: ["Tweet! You're back! Hooray!", "Hi! I saved you the best perch!"],
          morning: ["Good morning! I've got a song for you!", "Cheep! Rise and shine, friend!"],
          night: ["Tucking my head in now. You too?", "Sleepy tweet... bedtime soon?"],
          focus: ["Soft song on! You've got this!", "Quiet on my perch! Let's go."],
          done: ["Tweet! You did it! Amazing!", "What a songworthy session!"],
          task: ["Cheep! DONE!", "Worth a whole song! Woohoo!", "Yes yes yes! Another one down!", "Lovely work! Tweet tweet!"],
          break: ["Fluff your feathers! Big stretch!", "Seed break! Time for a snack!"]
        }
      }
    ]
  });
})();


