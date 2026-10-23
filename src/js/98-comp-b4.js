/* ===== module: 98-comp-b4.js ===== */
/* Study Companions, batch 4 */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);

  /* Cozy Cats */
  COMP_DATA.push({
    theme: "cats",
    companions: [
      {
        id: "cats-kitten", name: "Ginger", kind: "Orange Tabby Kitten", pose: "sit", sleepy: true,
        bio: "A sleepy orange tabby who curls up beside your notes.",
        idle: ["earTwitch", "tailSwish", "headTilt"], cheer: "hop",
        neck: [60, 76],
        parts: {
          tail: {svg: `<path d="M80 105C93 107 103 99 102 86C101.5 80 95 79.5 95 85C95.5 93 90 98 80 98Z" fill="#F0A055" ${O}/><path d="M101.6 86.5C101 81 95.6 80.4 95.2 85" fill="none" stroke="#C8672C" stroke-width="3.4" stroke-linecap="round"/><path d="M92 99.5l3 3.4" stroke="#C8672C" stroke-width="2.4" stroke-linecap="round"/>`, pivot: [82, 101]},
          feet: `<ellipse cx="39" cy="106.5" rx="10.5" ry="5.2" fill="#F0A055" ${O}/><ellipse cx="81" cy="106.5" rx="10.5" ry="5.2" fill="#F0A055" ${O}/>`,
          body: `${LG("cats-kitten-b", [[0, "#FFC07A"], [1, "#E88E43"]])}
            <path d="M60 71C79 71 87 85 87 97C87 107 78 110.5 60 110.5C42 110.5 33 107 33 97C33 85 41 71 60 71Z" fill="url(#cats-kitten-b)" ${O}/>
            <ellipse cx="60" cy="97" rx="14" ry="11" fill="#FFF3E2"/>
            <path d="M36.5 88.5q4 1 6.5 3.5M35 96q4 .5 6.5 2.5M83.5 88.5q-4 1 -6.5 3.5M85 96q-4 .5 -6.5 2.5" fill="none" stroke="#C8672C" stroke-width="2.4" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="50.5" cy="101" rx="6" ry="7.6" fill="#FFE2BF" ${O}/><path d="M48.5 106v2M52.5 106v2" stroke="#E2B48C" stroke-width="1.5" stroke-linecap="round"/>`, pivot: [50.5, 94]},
          armR: {svg: `<ellipse cx="69.5" cy="101" rx="6" ry="7.6" fill="#FFE2BF" ${O}/><path d="M67.5 106v2M71.5 106v2" stroke="#E2B48C" stroke-width="1.5" stroke-linecap="round"/>`, pivot: [69.5, 94]},
          earL: {svg: `<path d="M38.5 50C35.5 41 35.5 31 38.5 26.5C44.5 27.5 50.5 32 55 38.5Z" fill="#F4A65C" ${O}/><path d="M41.5 44C40 38.5 40.2 33.5 41.5 31C44.5 32 47.5 34.5 50 38Z" fill="#FFB9C2"/>`, pivot: [45, 42]},
          earR: {svg: `<path d="M81.5 50C84.5 41 84.5 31 81.5 26.5C75.5 27.5 69.5 32 65 38.5Z" fill="#F4A65C" ${O}/><path d="M78.5 44C80 38.5 79.8 33.5 78.5 31C75.5 32 72.5 34.5 70 38Z" fill="#FFB9C2"/>`, pivot: [75, 42]},
          head: `${LG("cats-kitten-h", [[0, "#FFC684"], [1, "#EE9A4E"]])}
            <ellipse cx="60" cy="57" rx="27" ry="22" fill="url(#cats-kitten-h)" ${O}/>
            <ellipse cx="60" cy="70.5" rx="13" ry="7" fill="#FFF3E2"/>
            <path d="M60 36v6M53 37.2l1.4 5M67 37.2l-1.4 5" stroke="#C8672C" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M34.5 55.5h4.5M34.5 61h4M85.5 55.5h-4.5M85.5 61h-4" stroke="#D4763A" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M40 46Q43.5 40 50 37.5" fill="none" stroke="#FFE3BD" stroke-width="3" stroke-linecap="round"/>`,
          face: `<path d="M57.8 62.4h4.4l-2.2 2.5Z" fill="#FF8FA8" ${OW(1.4)}/><path d="M42 66.5l-9 .6M42.5 70l-8 2.8M78 66.5l9 .6M77.5 70l8 2.8" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>`
        },
        eyes: {lx: 49, rx: 71, y: 56.5, r: 4.6, style: "dot", color: "#2B1E18"},
        mouth: {x: 60, y: 66.2, w: 2.6, style: "cat"},
        cheeks: {lx: 42, rx: 78, y: 64, w: 4.4, h: 2.7},
        anchors: {top: [60, 36, 1], neck: [60, 78, 1.05], chest: [69, 92, 0.72], back: [33, 86, 0.9], hands: [60, 96, 0.9]},
        lines: {
          tap: ["Mrrp! Hi there! I'm so happy you're here!", "You're doing purr-fectly! I mean it!", "Take a breath! You've totally got this!", "I believe in you so much! Meow!", "Need a cheer? I'm right here for you!", "Look at you studying! I'm so impressed!", "Every tiny step counts! Go you!"],
          pet: ["Purrrr! Right there, that's the spot!", "Mrrp! Chin rubs are the best! More!"],
          hello: ["Mew! You're back! I missed you!", "Hi hi! I kept your seat all warm for you!"],
          morning: ["Good morning! Big stretch, big paws, big day!", "Mrrp! Rise and shine! Let's pounce on today!"],
          night: ["Catnap time soon, okay? You did so well.", "Let's curl up and rest. Purr purr."],
          focus: ["Purring softly beside your notes. Go you!", "Paws tucked in. We've got this!"],
          done: ["You did it! A big, proud slow blink for you!", "Purr-fect session! I'm so proud!"],
          task: ["Mrrp! Knocked that one right off the table!", "WOO! Another one done!", "Yes yes yes! Checked off! Purr!", "Pounced on that one! Finished!"],
          break: ["Big kitty stretch time! Reach those paws!", "Sunbeam break! Go soak up some light!"]
        }
      },
      {
        id: "cats-box", name: "Boxie", kind: "Cardboard Box", pose: "stand",
        bio: "A comfy cardboard box with its flaps up, ready for a cozy study nap.",
        idle: ["earTwitch", "waddle", "bounce"], cheer: "hop",
        parts: {
          back: `<path d="M36.5 51.5H83.5L90 60H30Z" fill="#8E5E30" ${O}/>`,
          earL: {svg: `<path d="M30 60L36.5 51.5L25 40L17.5 49Z" fill="#E2B070" ${O}/><path d="M23.5 45.5L32.5 54" stroke="#C48A4A" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [33.5, 56]},
          earR: {svg: `<path d="M90 60L83.5 51.5L95 40L102.5 49Z" fill="#E2B070" ${O}/><path d="M96.5 45.5L87.5 54" stroke="#C48A4A" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [86.5, 56]},
          body: `${LG("cats-box-g", [[0, "#F0C487"], [1, "#D29A58"]])}
            <path d="M30 60H90L88 104C87.8 107.5 86 109.5 82.5 109.5H37.5C34 109.5 32.2 107.5 32 104Z" fill="url(#cats-box-g)" ${O}/>
            <path d="M53 61.5H67V67.5H53Z" fill="#F7E2B8" opacity=".95"/>
            <path d="M37 66V96" stroke="#FFE7C0" stroke-width="3" stroke-linecap="round"/>
            <path d="M38 104H82" stroke="#BF8646" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
            <g fill="#E07A6A"><ellipse cx="77" cy="97.5" rx="3.3" ry="2.7"/><circle cx="73.4" cy="93.4" r="1.4"/><circle cx="75.8" cy="91.5" r="1.4"/><circle cx="78.4" cy="91.5" r="1.4"/><circle cx="80.8" cy="93.4" r="1.4"/></g>`,
          armL: {svg: `<ellipse cx="26.5" cy="86" rx="4.8" ry="6.8" transform="rotate(24 26.5 86)" fill="#E2B070" ${O}/>`, pivot: [32, 83]},
          armR: {svg: `<ellipse cx="93.5" cy="86" rx="4.8" ry="6.8" transform="rotate(-24 93.5 86)" fill="#E2B070" ${O}/>`, pivot: [88, 83]}
        },
        eyes: {lx: 48.5, rx: 71.5, y: 79, r: 5.3, style: "dot", color: "#3A2414"},
        mouth: {x: 60, y: 87.5, w: 3.2, color: "#3A2414"},
        cheeks: {lx: 41, rx: 79, y: 87, w: 4.6, h: 2.8, color: "#FF9A9A"},
        anchors: {top: [60, 54, 1.05], neck: [60, 68, 1.35], chest: [74, 98, 0.72], back: [88, 72, 0.9], hands: [60, 99, 0.9]},
        lines: {
          tap: ["Hi hi! There's always room for you in here!", "Every cat's favorite seat, and yours too!", "Yay, you're here! My flaps are flapping!", "Think inside the box today! You've got this!", "I'm wide open for all your great ideas!", "Snug and steady, that's us! Love it!", "Flaps up! You're doing amazing!"],
          pet: ["Hehe! Crinkle crinkle! So happy!", "A big box hug! So cozy, thank you!"],
          hello: ["Special delivery: me, super excited to see you!", "You're back! I saved you the coziest corner!"],
          morning: ["Good morning! Freshly unpacked and ready to go!", "Flaps up! Rise and shine, superstar!"],
          night: ["Time to fold up for bed soon, okay?", "Such a good day. Cozy box nap time."],
          focus: ["Shh, box is quiet now. You've got this!", "Snug and silent. Heads down, let's go!"],
          done: ["Signed, sealed, studied! Amazing session!", "Special delivery: one huge cheer for you!"],
          task: ["Box checked! WOO!", "Packed away! Another one done!", "Delivered! Yes yes yes!", "You ticked the box! Amazing!"],
          break: ["Unfold and stretch! Big reach!", "Break time! Hop in and sit a while!"]
        }
      },
      {
        id: "cats-toebean", name: "Pawsy", kind: "Toe Bean Sprite", pose: "float",
        bio: "A squishy pink paw pad that floats by to give you a high five.",
        idle: ["sparkle", "earTwitch", "topBob"], cheer: "spin",
        parts: {
          earL: {svg: `${RG("cats-toebean-t1", [[0, "#FFE1E8"], [1, "#F6A4BA"]], 0.4, 0.35, 0.7)}<ellipse cx="31" cy="57" rx="7.4" ry="9.4" transform="rotate(-32 31 57)" fill="url(#cats-toebean-t1)" ${O}/>`, pivot: [37, 62]},
          earR: {svg: `${RG("cats-toebean-t2", [[0, "#FFE1E8"], [1, "#F6A4BA"]], 0.4, 0.35, 0.7)}<ellipse cx="89" cy="57" rx="7.4" ry="9.4" transform="rotate(32 89 57)" fill="url(#cats-toebean-t2)" ${O}/>`, pivot: [83, 62]},
          body: `${RG("cats-toebean-g", [[0, "#FFF0F3"], [0.55, "#FFCBD6"], [1, "#F29DB3"]], 0.42, 0.35, 0.72)}
            <path d="M60 55C74 55 88 65 89.5 79.5C90.8 92 81.5 99 72 97C67 96 64.5 93 60 93C55.5 93 53 96 48 97C38.5 99 29.2 92 30.5 79.5C32 65 46 55 60 55Z" fill="url(#cats-toebean-g)" ${O}/>
            <path d="M39 68Q43 61 51 58.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>
            <path d="M52 91.5Q56 89 60 89.2Q64 89 68 91.5" fill="none" stroke="#E98AA3" stroke-width="2" stroke-linecap="round" opacity=".7"/>`,
          top: {svg: `${RG("cats-toebean-t3", [[0, "#FFE1E8"], [1, "#F6A4BA"]], 0.4, 0.35, 0.7)}<ellipse cx="49" cy="43" rx="7.6" ry="9.6" transform="rotate(-12 49 43)" fill="url(#cats-toebean-t3)" ${O}/><ellipse cx="71" cy="43" rx="7.6" ry="9.6" transform="rotate(12 71 43)" fill="url(#cats-toebean-t3)" ${O}/><circle cx="46.5" cy="39.5" r="1.8" fill="#fff"/><circle cx="68.5" cy="39.5" r="1.8" fill="#fff"/>`, pivot: [60, 55]}
        },
        eyes: {lx: 50, rx: 70, y: 73, r: 4.8, style: "sparkle", color: "#4A2233"},
        mouth: {x: 60, y: 81.5, w: 3, color: "#4A2233"},
        cheeks: {lx: 42, rx: 78, y: 80.5, w: 4.4, h: 2.7, color: "#FF7FA2"},
        anchors: {top: [60, 38, 0.95], neck: [60, 91, 1.15], chest: [73, 87, 0.66], back: [86, 72, 0.85], hands: [60, 90, 0.85]},
        lines: {
          tap: ["Boop! High five! You're amazing!", "Toe beans say hi! And they're so excited!", "Soft paws, strong mind! You've got this!", "You're doing so great! I'm cheering loud!", "Squish! That's a lucky bean for you!", "A happy little paw pat on your shoulder!", "Go go go! I'm your biggest fan!"],
          pet: ["Squishy squish! Hehe, I love it!", "Hehe! My beans are all tickly now!"],
          hello: ["Paw wave! Hello hello! You're back!", "Hi! My beans are ready to cheer you on!"],
          morning: ["Good morning! Paws up! Let's go!", "Rise and shine, friend! High five for today!"],
          night: ["Tuck your paws in soon, okay? Great day.", "Soft paws, soft pillow. Time to rest."],
          focus: ["Quiet paws, big focus! You've got this!", "Floating softly nearby. Let's go!"],
          done: ["High five! Session done! You rock!", "Double high five! What great focus!"],
          task: ["HIGH five! Another one done!", "Squish! Checked off! Yes yes yes!", "WOO! That one's finished!", "Boop! One more off the list!"],
          break: ["Stretch those paws! Wiggle wiggle!", "Shake out your hands! Then a happy snack!"]
        }
      }
    ]
  });
  /* Music Room */
  COMP_DATA.push({
    theme: "music",
    companions: [
      {
        id: "music-bird", name: "Lark", kind: "Songbird", pose: "stand", wearColor: "#EE8A6A",
        bio: "A round little songbird whose crest is a music note.",
        idle: ["wingFlutter", "topBob", "tailSwish"], cheer: "wingFlutter",
        parts: {
          tail: {svg: `<path d="M81 94C90 92 99 85 102 77C96 77 91 80 86 84C91 80 95 74 95 68C88 71 82 80 79 88Z" fill="#6F61D8" ${O}/>`, pivot: [81, 92]},
          feet: `<ellipse cx="50" cy="108.5" rx="6.6" ry="3.8" fill="#F2A65A" ${O}/><ellipse cx="70" cy="108.5" rx="6.6" ry="3.8" fill="#F2A65A" ${O}/>`,
          body: `${RG("music-bird-g", [[0, "#C9C0FF"], [0.6, "#A99BFF"], [1, "#8373E6"]], 0.42, 0.32, 0.75)}
            <path d="M60 46C81 46 92 62 92 79C92 97 79 107 60 107C41 107 28 97 28 79C28 62 39 46 60 46Z" fill="url(#music-bird-g)" ${O}/>
            <path d="M60 84C71 84 79 90 79 98C75 103.5 68 106 60 106C52 106 45 103.5 41 98C41 90 49 84 60 84Z" fill="#FFF3E6"/>
            <path d="M40 64Q44 55 52 51" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".8"/>`,
          armL: {svg: `<path d="M33 74C24 79 21.5 91 25 98C31.5 97.5 37 89 37.5 79Z" fill="#7C6CE0" ${O}/>`, pivot: [35, 77]},
          armR: {svg: `<path d="M87 74C96 79 98.5 91 95 98C88.5 97.5 83 89 82.5 79Z" fill="#7C6CE0" ${O}/>`, pivot: [85, 77]},
          top: {svg: `${LINE("M65 47V25.5C69.5 28 75 30 75.5 36.5", "#3F3690", 2.8)}<ellipse cx="59.5" cy="46.5" rx="7" ry="5.2" transform="rotate(-20 59.5 46.5)" fill="#3F3690" ${OW(2.4)}/><ellipse cx="57.5" cy="45" rx="2.2" ry="1.3" transform="rotate(-20 57.5 45)" fill="#fff" opacity=".7"/>`, pivot: [61, 49]}
        },
        eyes: {lx: 48.5, rx: 71.5, y: 70, r: 4.6, style: "dot", color: "#231D4A"},
        mouths: {
          neutral: `<path d="M56 76.5Q60 75 64 76.5L60 81Z" fill="#F7B04A" ${OW(1.8)}/>`,
          smile: `<path d="M55.6 76.2Q60 74.6 64.4 76.2L60 81.2Z" fill="#FFBF55" ${OW(1.8)}/><path d="M53 79.4q1.6 1.2 3.2 .3M67 79.4q-1.6 1.2 -3.2 .3" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`,
          open: `<path d="M56.4 78.4L63.6 78.4L60 82.4Z" fill="#FF8FA8" ${OW(1.4)}/><path d="M56 75.6Q60 74.2 64 75.6L60 78.6Z" fill="#F7B04A" ${OW(1.6)}/><path d="M57 80.4L63 80.4L60 84.2Z" fill="#F7B04A" ${OW(1.6)}/>`,
          sleepy: `<path d="M56.6 77Q60 76 63.4 77L60 80.8Z" fill="#E09A3C" ${OW(1.8)}/>`
        },
        mouth: {x: 60, y: 78, w: 3},
        cheeks: {lx: 40.5, rx: 79.5, y: 77.5, w: 4.6, h: 2.8, color: "#FF86B4"},
        anchors: {top: [58, 47, 1], neck: [60, 86, 1.2], chest: [72, 96, 0.72], back: [87, 70, 0.9], hands: [60, 97, 0.9]},
        lines: {
          tap: ["Tweet tweet! Hi hi! I'm so glad you're here!", "You're right on tempo today! Wow!", "Every note counts, and you're hitting them!", "Look at all that progress! I could sing!", "La la la! You've totally got this!", "Your study song sounds wonderful!", "Here's a happy little tune just for you!"],
          pet: ["Chirrup! So fluffy and happy!", "Tweet! You found my favorite crest spot!"],
          hello: ["Tweet tweet! You're back! I'm so happy!", "Hi! I've been humming for you all day!"],
          morning: ["Good morning! The morning chorus is for you!", "Rise and shine! It's a lovely day for a song!"],
          night: ["Lullaby time now. Let's rest soon, okay?", "A soft song for sleepy wings. Goodnight soon."],
          focus: ["Humming softly with you. You've got this!", "Quiet notes, big focus. Let's go!"],
          done: ["Bravo! Bravo! What a lovely session!", "That was pure music! I'm so proud!"],
          task: ["Tweet tweet! Another one done!", "Right on the beat! WOO!", "Yes yes yes! That's a hit!", "Checked off! Time for a happy song!"],
          break: ["Flap and stretch! Wings wide!", "Break time! Rest is part of the rhythm!"]
        }
      },
      {
        id: "music-note", name: "Trill", kind: "Music Note Sprite", pose: "float", sleepy: true,
        bio: "A dreamy little music note who hums you a gentle study tune.",
        idle: ["topBob", "sparkle", "sway"], cheer: "spin",
        parts: {
          body: `${RG("music-note-g", [[0, "#FFE8F2"], [0.55, "#FFBCD8"], [1, "#EE8DB6"]], 0.4, 0.34, 0.75)}
            <ellipse cx="56" cy="74" rx="28" ry="21.5" transform="rotate(-16 56 74)" fill="url(#music-note-g)" ${O}/>
            <path d="M34.5 70Q37 60 47 56" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>
            <path d="M50 94Q64 94 74 86" fill="none" stroke="#DE7CA6" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>`,
          armL: {svg: `<ellipse cx="29" cy="86" rx="4.6" ry="6" transform="rotate(30 29 86)" fill="#F9AFCD" ${O}/>`, pivot: [35, 83]},
          armR: {svg: `<ellipse cx="83" cy="87" rx="4.6" ry="6" transform="rotate(-30 83 87)" fill="#F9AFCD" ${O}/>`, pivot: [78, 84]},
          top: {svg: `${LINE("M80.5 67V22", "#5B4FC9", 3.6)}<path d="M79 21C82 28 95 31 96.5 42C97.5 49 94 54 90.5 57C92.5 51 92 44.5 86 41.5C83 40 80.5 39 79 38Z" fill="#7B6CE0" ${O}/><path d="M86 28Q91 31 93 36" fill="none" stroke="#C9C0FF" stroke-width="2" stroke-linecap="round"/>`, pivot: [80, 64]}
        },
        eyes: {lx: 45.5, rx: 65.5, y: 74, r: 5, style: "sparkle", color: "#3A1F45"},
        mouth: {x: 55.5, y: 83, w: 3, color: "#3A1F45"},
        cheeks: {lx: 37.5, rx: 73.5, y: 82, w: 4.4, h: 2.7, color: "#FF6F9F"},
        anchors: {top: [52, 55, 0.95], neck: [56, 92, 1.1], chest: [67, 88, 0.66], back: [30, 66, 0.8], hands: [56, 90, 0.85]},
        lines: {
          tap: ["La la! Hello hello! So glad you're here!", "You're hitting all the right notes today!", "Studying in a major key! I love it!", "One bar at a time, and it sounds amazing!", "Hmm hmm! Oh, it's you! Yay!", "Keep that melody going! You've got this!", "You're doing such lovely work! Wow!"],
          pet: ["Tra-la-la! Hehe, that's my happy song!", "Mmm! You made me ring a happy chord!"],
          hello: ["La la! Welcome back! I'm humming with joy!", "Hi! Let's make some beautiful music today!"],
          morning: ["Good morning, maestro! Let's start the show!", "Rise and shine! Today's tune is a bright one!"],
          night: ["Lullaby hour now. Bed soon, maestro?", "Fading softly... rest well, friend."],
          focus: ["Humming a quiet tune for you. Go you!", "Soft and steady. You've got this!"],
          done: ["What a lovely piece! Standing ovation!", "Bravo, maestro! That was beautiful!"],
          task: ["Ta-da! Another one done!", "Pitch perfect! WOO!", "Right on key! Yes yes yes!", "That's a high note! Checked off!"],
          break: ["Every song has rests! Take a happy one!", "Pause and breathe! Then a little dance!"]
        }
      },
      {
        id: "music-drum", name: "Tappy", kind: "Little Drum", pose: "sit", wearColor: "#5B4FC9",
        bio: "A peppy little drum who keeps the beat while you study.",
        idle: ["topBob", "bounce", "finWiggle"], cheer: "hop",
        parts: {
          top: {svg: `${LINE("M42 36L66 53", "#E9B872", 3.2)}${LINE("M78 36L54 53", "#E9B872", 3.2)}<circle cx="41" cy="35.2" r="4" fill="#FFF2E0" ${OW(2.2)}/><circle cx="79" cy="35.2" r="4" fill="#FFF2E0" ${OW(2.2)}/>`, pivot: [60, 52]},
          body: `${LG("music-drum-g", [[0, "#BCD2FF"], [1, "#86A6F0"]])}
            <path d="M27 58V99C27 105 42 109.5 60 109.5C78 109.5 93 105 93 99V58Z" fill="url(#music-drum-g)" ${O}/>
            <path d="M27.5 97C29 102 43 105.5 60 105.5C77 105.5 91 102 92.5 97" fill="none" stroke="#F2C24A" stroke-width="5" stroke-linecap="round"/>
            <path d="M27.5 97C29 102 43 105.5 60 105.5C77 105.5 91 102 92.5 97" fill="none" stroke="#FFE39A" stroke-width="1.6" stroke-linecap="round"/>
            <ellipse cx="60" cy="58" rx="33" ry="9.5" fill="#F2C24A" ${O}/>
            <ellipse cx="60" cy="57" rx="28.5" ry="6.8" fill="#FFFDF7" ${OW(2)}/>
            <path d="M34 67.5V92" stroke="#E6EEFF" stroke-width="3.2" stroke-linecap="round"/>
            <circle cx="87" cy="72" r="2.2" fill="#F2C24A" ${OW(1.6)}/><circle cx="87" cy="88" r="2.2" fill="#F2C24A" ${OW(1.6)}/>`,
          armL: {svg: `<ellipse cx="23" cy="82" rx="4.8" ry="6.6" transform="rotate(24 23 82)" fill="#7F9FEE" ${O}/>`, pivot: [29, 79]},
          armR: {svg: `<ellipse cx="97" cy="82" rx="4.8" ry="6.6" transform="rotate(-24 97 82)" fill="#7F9FEE" ${O}/>`, pivot: [91, 79]}
        },
        eyes: {lx: 49, rx: 71, y: 78, r: 5, style: "dot", color: "#1E1B38"},
        mouth: {x: 60, y: 88, w: 3.2, color: "#1E1B38"},
        cheeks: {lx: 40.5, rx: 79.5, y: 87, w: 4.6, h: 2.8, color: "#FF9FC0"},
        anchors: {top: [60, 52, 1.05], neck: [60, 67, 1.45], chest: [75, 96, 0.72], back: [89, 70, 0.9], hands: [60, 97, 0.9]},
        lines: {
          tap: ["Ba-dum tss! Hi hi! So glad you're here!", "You're keeping such a great beat today!", "Tap tap! You've totally got this!", "Steady rhythm, steady mind! Love it!", "Drumroll, please! It's you!", "Boom! Look at all that progress!", "Beat by beat, you're rocking it!"],
          pet: ["Rat-a-tat! Hehe, so happy!", "Boom boom! My heart's drumming with joy!"],
          hello: ["Ba-dum! You're here! Let's rock!", "Hi! Ready to find your rhythm? Let's go!"],
          morning: ["Good morning! Tap tap! Let's start the beat!", "Rise and shine! Today's rhythm is upbeat!"],
          night: ["Quiet drums now. Time to rest soon?", "A soft, slow beat. Let's wind down for bed."],
          focus: ["Keeping a quiet beat for you. Go go!", "Tap, tap, focus! We've got this!"],
          done: ["Drumroll... you did it! Amazing!", "What a groove! Incredible session!"],
          task: ["BOOM! Another one done!", "Rat-a-tat! Checked off!", "Right on the beat! WOO!", "Ba-dum tss! Yes yes yes!"],
          break: ["Shake out your hands! Air drum time!", "Rest beat! Breathe and bop a little!"]
        }
      }
    ]
  });

  /* Reading Nook */
  COMP_DATA.push({
    theme: "reading",
    companions: [
      {
        id: "reading-book", name: "Paige", kind: "Little Storybook", pose: "stand", wearColor: "#3F5A8A",
        bio: "A cozy storybook who can't wait to hear what you learn next.",
        idle: ["tailSwish", "sway", "wave"], cheer: "spin",
        parts: {
          tail: {svg: `<path d="M84 31.5C88 34 91 40 93.5 47L99.5 45.5L98 52.5L103 56.5C99.5 58 96 57 94.5 55C92 48 89 41 84 37Z" fill="#F2C24A" ${OW(2.4)}/>`, pivot: [85, 33]},
          feet: `<ellipse cx="49" cy="108.5" rx="7" ry="4.2" fill="#6E2A33" ${O}/><ellipse cx="71" cy="108.5" rx="7" ry="4.2" fill="#6E2A33" ${O}/>`,
          body: `${LG("reading-book-g", [[0, "#C9606B"], [1, "#9A3B47"]])}
            <path d="M84 32H90.5C92.5 32 93.5 33 93.5 35V99C93.5 101 92.5 102 90.5 102H84Z" fill="#FFF6E6" ${O}/>
            <path d="M86 44V92M89.5 44V92" stroke="#E6D3B8" stroke-width="1.6" stroke-linecap="round"/>
            <rect x="27" y="29" width="61" height="75" rx="9" fill="url(#reading-book-g)" ${O}/>
            <path d="M37 30.5V102.5" stroke="#7E2F3A" stroke-width="2.4"/>
            <path d="M42 38.5H80M42 95H80" stroke="#F2C24A" stroke-width="2.6" stroke-linecap="round"/>
            <rect x="40" y="45" width="42" height="43" rx="10" fill="#FFF6E6" ${OW(2.2)}/>
            <path d="M31.5 40V64" stroke="#E08A94" stroke-width="3" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="23.5" cy="76" rx="4.8" ry="6.6" transform="rotate(24 23.5 76)" fill="#B24E5A" ${O}/>`, pivot: [29.5, 73]},
          armR: {svg: `<ellipse cx="97.5" cy="76" rx="4.8" ry="6.6" transform="rotate(-24 97.5 76)" fill="#B24E5A" ${O}/>`, pivot: [91.5, 73]}
        },
        eyes: {lx: 51, rx: 71, y: 63.5, r: 4.8, style: "dot", color: "#2B1F1C"},
        mouth: {x: 61, y: 72.5, w: 3, color: "#2B1F1C"},
        cheeks: {lx: 46.5, rx: 75.5, y: 72, w: 3.8, h: 2.5, color: "#FF9AA8"},
        anchors: {top: [58, 31, 1], neck: [58, 91, 1.35], chest: [73, 97, 0.66], back: [30, 60, 0.9], hands: [60, 92, 0.9]},
        lines: {
          tap: ["Hello, reader! I'm so happy you're here!", "Every page makes you wiser! Look at you!", "Yay, reading time with you! My favorite!", "Chapter by chapter, you're amazing!", "Your story is going so wonderfully!", "Wow, your notes are coming along great!", "I love keeping you company! Let's go!"],
          pet: ["Hehe! My pages are rustling with joy!", "Aww! A warm hug for me! Thank you!"],
          hello: ["Welcome back, reader! I've missed you!", "Hi hi! Let's open an exciting new chapter!"],
          morning: ["Good morning! A fresh page and a fresh start!", "Rise and shine, bookworm! Big chapter today!"],
          night: ["Pop a bookmark in. Bedtime soon, okay?", "The end, for today. Rest well, reader."],
          focus: ["Reading right along with you! You've got this!", "Quiet pages, big focus. Let's go!"],
          done: ["What a chapter! You were incredible!", "Session done! So well read! I'm proud!"],
          task: ["Page turned! WOO!", "Another chapter done! Yes!", "Checked off! What a plot twist!", "Yes yes yes! That one's finished!"],
          break: ["Rest your eyes! Look at something far away!", "Bookmark it! Time for a big stretch!"]
        }
      },
      {
        id: "reading-worm", name: "Inchy", kind: "Bookworm", pose: "sit",
        bio: "A curious little bookworm perched on its favorite book.",
        idle: ["earTwitch", "tailSwish", "headTilt"], cheer: "hop",
        neck: [60, 68],
        parts: {
          tail: {svg: `<circle cx="95" cy="93" r="6.6" fill="#8CCB74" ${O}/><circle cx="83" cy="91" r="9" fill="#9FD885" ${O}/><circle cx="93.2" cy="90.6" r="1.6" fill="#D6F0C4"/>`, pivot: [75, 91]},
          earL: {svg: `${LINE("M51 30C49 24 45 20 41 19", "#7DBB66", 2.4)}<circle cx="40" cy="18.5" r="4.4" fill="#F2C24A" ${OW(2.2)}/>`, pivot: [52, 32]},
          earR: {svg: `${LINE("M69 30C71 24 75 20 79 19", "#7DBB66", 2.4)}<circle cx="80" cy="18.5" r="4.4" fill="#F2C24A" ${OW(2.2)}/>`, pivot: [68, 32]},
          feet: `${LG("reading-worm-bk", [[0, "#B84A58"], [1, "#8A3340"]])}
            <path d="M26 99H94C96.5 99 97.5 100 97.5 102.5V107C97.5 109.5 96.5 110.5 94 110.5H26C23.5 110.5 22.5 109.5 22.5 107V102.5C22.5 100 23.5 99 26 99Z" fill="url(#reading-worm-bk)" ${O}/>
            <path d="M89 101.5V108.5H95V101.5Z" fill="#FFF6E6"/><path d="M34 101.5V108.5" stroke="#F2C24A" stroke-width="2.4" stroke-linecap="round"/><path d="M29 101.5V108.5" stroke="#F2C24A" stroke-width="2.4" stroke-linecap="round"/>`,
          body: `${LG("reading-worm-b", [[0, "#B8E6A0"], [1, "#84C46C"]])}
            <circle cx="60" cy="85" r="15.5" fill="url(#reading-worm-b)" ${O}/>
            <path d="M49.5 91Q60 97 70.5 91" fill="none" stroke="#E4F6D6" stroke-width="2.6" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="45.5" cy="86" rx="4.4" ry="6" transform="rotate(26 45.5 86)" fill="#A6DB8C" ${O}/>`, pivot: [49.5, 83]},
          armR: {svg: `<ellipse cx="74.5" cy="86" rx="4.4" ry="6" transform="rotate(-26 74.5 86)" fill="#A6DB8C" ${O}/>`, pivot: [70.5, 83]},
          head: `${LG("reading-worm-h", [[0, "#C6ECAE"], [1, "#8FCC76"]])}
            <ellipse cx="60" cy="51" rx="25" ry="22" fill="url(#reading-worm-h)" ${O}/>
            <path d="M42 42Q45.5 34 53 31" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/>`
        },
        eyes: {lx: 50, rx: 70, y: 51, r: 4.8, style: "dot", color: "#1F2A1C"},
        mouth: {x: 60, y: 60.5, w: 3, color: "#1F2A1C"},
        cheeks: {lx: 42, rx: 78, y: 59, w: 4.6, h: 2.8, color: "#FF9AA8"},
        anchors: {top: [60, 30, 0.95], neck: [60, 71, 1], chest: [68, 88, 0.62], back: [42, 84, 0.8], hands: [60, 86, 0.85]},
        lines: {
          tap: ["Munch munch... oh! Hi hi! You're here!", "Every page is a tasty snack! Yum!", "Inch by inch, you're growing so much!", "Curious minds go far, and you're zooming!", "You're a true bookworm! I'm so proud!", "Nibble by nibble, you're getting there!", "Ooh! What are we reading? I'm so excited!"],
          pet: ["Hehe! Wiggle wiggle! I love that!", "Hehe! My antennae are doing a happy dance!"],
          hello: ["Hi! You're back! I saved you the best page!", "Hello, fellow bookworm! Let's dig in!"],
          morning: ["Good morning! So many fresh chapters today!", "Rise and shine! Wiggle wiggle, let's go!"],
          night: ["Time to cozy up and rest soon, friend.", "Snuggle into bed, bookworm. Great day."],
          focus: ["Nose in a book right beside you! Go go!", "Quiet nibbling, big focus. You've got this!"],
          done: ["Well read, friend! What a session!", "Munch munch! You devoured that session!"],
          task: ["Nibbled right through that! WOO!", "Inch by inch, another one done!", "Yes! Another tasty bite finished!", "Checked off! Wiggle wiggle!"],
          break: ["Wiggle and stretch with me!", "Snack break! You pick a treat, I'll have paper!"]
        }
      },
      {
        id: "reading-quill", name: "Plume", kind: "Feather Quill", pose: "float", sleepy: true,
        bio: "A soft feather quill who floats nearby while your notes fill up.",
        idle: ["sway", "tailSwish", "sparkle"], cheer: "spin",
        parts: {
          tail: {svg: `<g transform="rotate(18 60 64)"><path d="M56.5 99L63.5 99L63 106L60 113L57 106Z" fill="#F2C24A" ${OW(2.4)}/><path d="M60 104V108" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/><path d="M58.6 108.6L60 113L61.4 108.6Z" fill="#3F5A8A"/></g>`, pivot: [49, 97]},
          body: `${LG("reading-quill-g", [[0, "#FFFFFF"], [0.5, "#FBDDE0"], [1, "#E69CA6"]], 0.2, 0, 0.8, 1)}
            <g transform="rotate(18 60 64)">
            <path d="M60 18C71 26 80 42 80.5 56L75.5 59.5L80.3 62.5C79.5 79 71 92 60 100C49 92 40.5 80 39.5 70L45 73L39.6 64C39.6 55 40.5 48 42 42L47 46L43.5 37.5C47 29 53 22 60 18Z" fill="url(#reading-quill-g)" ${O}/>
            <path d="M60 19V33M60 87V100" stroke="#C97380" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M60 30L68 36M60 30L52 36" stroke="#EBA9B2" stroke-width="2" stroke-linecap="round"/>
            <path d="M46 52Q47 39 54 31" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>
            </g>`,
          armL: {svg: `<ellipse cx="38" cy="80" rx="4.4" ry="5.8" transform="rotate(30 38 80)" fill="#F6C3CA" ${O}/>`, pivot: [44, 78]},
          armR: {svg: `<ellipse cx="81" cy="75" rx="4.4" ry="5.8" transform="rotate(-30 81 75)" fill="#F6C3CA" ${O}/>`, pivot: [75, 73]}
        },
        eyes: {lx: 51, rx: 68, y: 60, r: 4.5, style: "dot", color: "#3A1E26"},
        mouth: {x: 59, y: 68.5, w: 2.8, color: "#3A1E26"},
        cheeks: {lx: 45, rx: 72.5, y: 67, w: 3.6, h: 2.3, color: "#FF7F96"},
        anchors: {top: [68, 28, 0.75], neck: [56, 86, 0.95], chest: [66, 80, 0.6], back: [84, 52, 0.8], hands: [58, 82, 0.85]},
        lines: {
          tap: ["Scritch scratch! Hello hello! Yay!", "Light as a feather, sharp as you!", "Let's write something wonderful today!", "One line at a time, and it's beautiful!", "Your notes look amazing! Truly!", "Every word is a little win! Woohoo!", "Look at you go! I'm floating with joy!"],
          pet: ["Hehe! That tickles my feathers!", "Oh! I'm all fluffed up and happy!"],
          hello: ["Hello! The ink is ready and so am I!", "You're back! Let's fill a page together!"],
          morning: ["Good morning, writer! A fresh page awaits!", "Rise and shine! Today's story starts now!"],
          night: ["Time to set the pen down soon, okay?", "Rest your hand now. Sleep well, writer."],
          focus: ["Floating quietly beside you. You've got this!", "Soft focus, steady hand. Let's go!"],
          done: ["Beautifully written! What a session!", "Session done! That was so lovely!"],
          task: ["Signed and done! WOO!", "A feather in your cap! Another one done!", "Yes yes yes! Neatly noted!", "Checked off with a flourish!"],
          break: ["Rest your writing hand! Shake it out!", "Float for a bit! Breathe and stretch!"]
        }
      }
    ]
  });
  /* Knitting Nook */
  COMP_DATA.push({
    theme: "knitting",
    companions: [
      {
        id: "knitting-yarn", name: "Purl", kind: "Yarn Ball", pose: "sit", sleepy: true,
        bio: "A squishy ball of yarn who loves a slow, cozy study session.",
        idle: ["topBob", "bounce", "tailSwish"], cheer: "spin",
        parts: {
          tail: {svg: `${LINE("M84 103C92 108.5 100.5 106 101 99C101.5 93 95.5 92 95 97", "#F58FAE", 3)}`, pivot: [85, 103]},
          body: `${RG("knitting-yarn-g", [[0, "#FFD9E4"], [0.55, "#FFA9C2"], [1, "#EC7C9D"]], 0.4, 0.33, 0.75)}
            <circle cx="60" cy="79" r="30" fill="url(#knitting-yarn-g)" ${O}/>
            <path d="M35 63Q52 50.5 75 51M32.5 72Q50 58 84 58.5M88.5 69Q83 84 87.5 98.5M41 102Q60 111 80 102.5M31.5 90Q36 99 45 105" fill="none" stroke="#D9607F" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M37.5 62.5Q41 57 46 54" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/>`,
          armL: {svg: `<ellipse cx="29" cy="90" rx="4.8" ry="6.4" transform="rotate(28 29 90)" fill="#F59AB5" ${O}/>`, pivot: [35, 87]},
          armR: {svg: `<ellipse cx="91" cy="90" rx="4.8" ry="6.4" transform="rotate(-28 91 90)" fill="#F59AB5" ${O}/>`, pivot: [85, 87]},
          top: {svg: `${LINE("M61 54L76 24.5", "#DDB07A", 3.2)}${LINE("M70 56.5L91 32", "#DDB07A", 3.2)}<circle cx="77" cy="22.5" r="4" fill="#9CC4A0" ${OW(2.2)}/><circle cx="92.5" cy="30.5" r="4" fill="#9CC4A0" ${OW(2.2)}/>`, pivot: [66, 55]}
        },
        eyes: {lx: 48, rx: 72, y: 79, r: 5.2, style: "dot"},
        mouth: {x: 60, y: 87.5, w: 3.2},
        cheeks: {lx: 39.5, rx: 80.5, y: 87, w: 4.6, h: 2.8, color: "#FF7E9E"},
        anchors: {top: [52, 51, 1], neck: [60, 98, 1.15], chest: [78, 99, 0.7], back: [90, 74, 0.9], hands: [60, 99, 0.9]},
        lines: {
          tap: ["Hi hi! All wound up and so excited to see you!", "Knit one, purl one, you're doing great!", "Stitch by stitch, you've totally got this!", "You're a real natural! Look at you!", "Loop it in, slow and steady! Love it!", "Cozy thoughts and a clear mind! Yay!", "Keep that thread going! You're amazing!"],
          pet: ["Hehe! So squishy and soft!", "Aww! You're so gentle! I love it!"],
          hello: ["You're back! I saved you a warm, cozy spot!", "Hello hello! Let's get cozy and get going!"],
          morning: ["Good morning! Fresh yarn and a fresh start!", "Rise and shine! Let's knit a lovely day!"],
          night: ["Time to wind down and rest soon, okay?", "Let's cast off for the night. Sleep well."],
          focus: ["Snoozing in my basket, cheering quietly!", "Quiet stitches, big focus. You've got this!"],
          done: ["Beautifully knit together! Amazing!", "Session done! So cozy and so proud!"],
          task: ["Another row done! WOO!", "Yes! Neat as a stitch!", "Checked off! You're on a roll!", "Wonderfully done! Yes yes yes!"],
          break: ["Unwind a little! Big stretch!", "Break time! Sip something warm and cozy!"]
        }
      },
      {
        id: "knitting-alpaca", name: "Pompom", kind: "Baby Alpaca", pose: "stand",
        bio: "A fluffy baby alpaca who shares its softest wool for your next scarf.",
        idle: ["earTwitch", "headTilt", "waddle"], cheer: "hop",
        neck: [60, 72],
        parts: {
          feet: `<rect x="45" y="100" width="9" height="11" rx="4" fill="#A77E62" ${O}/><rect x="66" y="100" width="9" height="11" rx="4" fill="#A77E62" ${O}/>`,
          body: `${RG("knitting-alpaca-g", [[0, "#FCE6C6"], [0.6, "#F0C995"], [1, "#D59F66"]], 0.42, 0.35, 0.7)}
            <path d="${puff(60, 88, 19, 11, 1.2)}" fill="url(#knitting-alpaca-g)" ${O}/>
            <path d="M47 101Q60 106 73 101" fill="none" stroke="#C98E55" stroke-width="2.4" stroke-linecap="round"/>`,
          earL: {svg: `<path d="M46 40C40 35 38 26 41 20C46 20 50 27 50.5 36Z" fill="#F4DDBF" ${O}/><path d="M45.5 34C43 30 42.5 26 43.5 23.5C46 25 47.5 29 47.8 33Z" fill="#FFB7C4"/>`, pivot: [49, 39]},
          earR: {svg: `<path d="M74 40C80 35 82 26 79 20C74 20 70 27 69.5 36Z" fill="#F4DDBF" ${O}/><path d="M74.5 34C77 30 77.5 26 76.5 23.5C74 25 72.5 29 72.2 33Z" fill="#FFB7C4"/>`, pivot: [71, 39]},
          armL: {svg: `<path d="${puff(40, 90, 5.4, 6, 1.25)}" fill="#F2CD9C" ${O}/>`, pivot: [45, 87]},
          armR: {svg: `<path d="${puff(80, 90, 5.4, 6, 1.25)}" fill="#F2CD9C" ${O}/>`, pivot: [75, 87]},
          head: `${LG("knitting-alpaca-h", [[0, "#FFF3E0"], [1, "#F4D6AC"]])}
            <path d="M51.5 64V79M68.5 64V79" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><rect x="51.5" y="62" width="17" height="19" fill="#F6DDB9"/>
            <path d="${puff(60, 79, 8.6, 8, 1.25)}" fill="#F7D6A8" ${O}/>
            <ellipse cx="60" cy="53" rx="20" ry="18.5" fill="url(#knitting-alpaca-h)" ${O}/>
            <ellipse cx="60" cy="63.5" rx="9" ry="5.8" fill="#FFFBF4"/>
            <path d="M44.5 48Q46 42.5 50.5 39.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>`,
          face: `<path d="M58.2 60.2h3.6l-1.8 2Z" fill="#8C6A58" ${OW(1.2)}/>`,
          top: {svg: `<path d="${puff(60, 36.5, 10, 8, 1.25)}" fill="#FFFDF8" ${O}/><circle cx="56.5" cy="34" r="2" fill="#F3E9DA"/>`, pivot: [60, 42]}
        },
        eyes: {lx: 51.5, rx: 68.5, y: 52.5, r: 4.3, style: "dot", color: "#2B2226"},
        mouth: {x: 60, y: 65, w: 2.4, style: "cat", color: "#4A342C"},
        cheeks: {lx: 45.5, rx: 74.5, y: 59.5, w: 3.8, h: 2.4, color: "#FF9FB2"},
        anchors: {top: [60, 31, 0.85], neck: [60, 75, 0.85], chest: [69, 94, 0.6], back: [77, 86, 0.8], hands: [60, 93, 0.85]},
        lines: {
          tap: ["Hi hi! A big fluffy hello for you!", "Soft and steady wins, and you're winning!", "You're doing so much good! Wow!", "Stay cozy and keep going! You've got this!", "One fluffy step at a time! Yay!", "I'm so proud of you! So, so proud!", "No rush at all. We'll get there together!"],
          pet: ["Hmmm! So fluffy and so happy!", "Hehe! My pompom is all floofy now!"],
          hello: ["You're back! I'm hopping with joy!", "Hello! I kept the softest wool warm for you!"],
          morning: ["Good morning! All fluffed up and ready!", "Rise and shine! A soft, happy start today!"],
          night: ["Time to snuggle up. Bed soon, okay?", "Hmm... sleepy fluff time. Rest well."],
          focus: ["Shh, fluffy focus time! You've got this!", "Standing quietly nearby. Let's go!"],
          done: ["Well done, friend! That was amazing!", "Session done! I'm so, so proud!"],
          task: ["Hmmm! Another one done! WOO!", "Fluffy finish! Yes!", "Checked off! I'm hopping with joy!", "Soft and sorted! Yes yes yes!"],
          break: ["Stretch that neck nice and tall!", "Break time! Graze on a tasty snack!"]
        }
      },
      {
        id: "knitting-mitten", name: "Mitts", kind: "Knitted Mitten", pose: "float", wearColor: "#D0607A",
        bio: "A warm hand-knit mitten who gives the best thumbs up.",
        idle: ["wave", "sway", "sparkle"], cheer: "spin",
        parts: {
          body: `${LG("knitting-mitten-g", [[0, "#FFE08C"], [1, "#EDB24A"]])}
            <path d="M42 90C41 76 40 61 44 49C47 40 54 34.5 62 34.5C71 34.5 78 40 80.5 49C83.5 61 82.5 76 81.5 90Z" fill="url(#knitting-mitten-g)" ${O}/>
            <path d="M48 49Q51 42 57 39.5" fill="none" stroke="#FFF4CC" stroke-width="3" stroke-linecap="round"/>
            <path d="M62 84.5C58.5 81.5 55.5 79 55.5 76.2C55.5 73.6 58.5 72.6 62 75C65.5 72.6 68.5 73.6 68.5 76.2C68.5 79 65.5 81.5 62 84.5Z" fill="#FFF7EA" ${OW(1.8)}/>
            ${LG("knitting-mitten-c", [[0, "#B2D6B5"], [1, "#86B58D"]])}
            <rect x="38.5" y="86" width="47" height="17" rx="6" fill="url(#knitting-mitten-c)" ${O}/>
            <path d="M47 90V99M54.5 90V99M62 90V99M69.5 90V99M77 90V99" stroke="#6E9E76" stroke-width="2.2" stroke-linecap="round"/>`,
          armL: {svg: `${LG("knitting-mitten-t", [[0, "#FFE08C"], [1, "#EDB24A"]])}<path d="M45 64C37 61 29.5 64.5 29 72C28.5 80 36 83.5 45 80Z" fill="url(#knitting-mitten-t)" ${O}/><path d="M33.5 68.5Q35 65.5 38 65" fill="none" stroke="#FFF4CC" stroke-width="2.4" stroke-linecap="round"/>`, pivot: [44, 72]}
        },
        eyes: {lx: 52.5, rx: 71.5, y: 59, r: 4.6, style: "dot", color: "#3A2A18"},
        mouth: {x: 62, y: 67.5, w: 3, color: "#3A2A18"},
        cheeks: {lx: 47, rx: 77, y: 66.5, w: 4, h: 2.5, color: "#FF8C8C"},
        anchors: {top: [62, 37, 0.95], neck: [62, 86, 1.05], chest: [74, 80, 0.6], back: [82, 58, 0.85], hands: [62, 82, 0.85]},
        lines: {
          tap: ["Thumbs up from me! You're amazing!", "Warm hands, warm heart! Love it!", "You're knitting it all together! Wow!", "Snug as a mitten and twice as awesome!", "High five, mitten style! Yay!", "Keep cozy and carry on! You've got this!", "I've got you covered! Let's go!"],
          pet: ["Hehe! So warm and fuzzy!", "A big mitten hug right back at you!"],
          hello: ["Thumbs up! You're here! Hooray!", "Hi hi! Let's warm up those hands!"],
          morning: ["Good morning! Toasty and ready to go!", "Rise and shine, warm heart! Big day today!"],
          night: ["Tuck in nice and snug. Bed soon?", "Warm and sleepy now. Time to rest."],
          focus: ["Thumbs up! Heads down, let's go!", "Cozy quiet time. I'm right here for you!"],
          done: ["Two thumbs up! What a session!", "Session done! I'm so warm with pride!"],
          task: ["Thumbs UP! Another one done!", "Done and snug! WOO!", "Wrapped that right up! Yes!", "Checked off! Toasty work!"],
          break: ["Wiggle those fingers! Stretch break!", "Warm drink break! You've earned it!"]
        }
      }
    ]
  });

  /* Art Studio */
  COMP_DATA.push({
    theme: "painting",
    companions: [
      {
        id: "painting-tube", name: "Dot", kind: "Paint Tube", pose: "stand", wearColor: "#E0463C",
        bio: "A cheerful tube of paint, squeezed full of bright ideas.",
        idle: ["topBob", "sway", "wave"], cheer: "hop",
        parts: {
          feet: `<path d="M34.5 100H85.5L87.5 110.5H32.5Z" fill="#CDD3DE" ${O}/><path d="M40 103.5V107.5M48 103.5V107.5M56 103.5V107.5M64 103.5V107.5M72 103.5V107.5M80 103.5V107.5" stroke="#9AA2B4" stroke-width="1.8" stroke-linecap="round"/>`,
          body: `${LG("painting-tube-g", [[0, "#FFFFFF"], [1, "#E1E6EF"]], 0, 0, 1, 0)}
            <rect x="52" y="29" width="16" height="12" rx="2.5" fill="#DDE2EA" ${O}/>
            <path d="M44 40Q60 37 76 40L85.5 100.5Q60 104 34.5 100.5Z" fill="url(#painting-tube-g)" ${O}/>
            <path d="M37.7 80H82.3L85.1 98.4Q60 101.6 34.9 98.4Z" fill="#3D7BE0"/>
            <path d="M37.7 80H82.3" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M60 83.5C62.5 87 64 88.5 64 91C64 93.5 62 95 60 95C58 95 56 93.5 56 91C56 88.5 57.5 87 60 83.5Z" fill="#fff"/>
            <path d="M46 46L42.5 72" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="34" cy="75" rx="4.6" ry="6.4" transform="rotate(26 34 75)" fill="#F4F6FA" ${O}/>`, pivot: [40, 72]},
          armR: {svg: `<ellipse cx="86" cy="75" rx="4.6" ry="6.4" transform="rotate(-26 86 75)" fill="#F4F6FA" ${O}/>`, pivot: [80, 72]},
          top: {svg: `${RG("painting-tube-p", [[0, "#8FB6FF"], [1, "#2F66B8"]], 0.4, 0.35, 0.75)}<path d="M48 31.5C44.5 24 51.5 18.5 58 21.5C57.5 13.5 67 10.5 71 16.5C74 21 71.5 25.5 68 26.5C73 28 74 31.5 70.5 32.5Z" fill="url(#painting-tube-p)" ${OW(2.4)}/><ellipse cx="62.5" cy="17" rx="2.4" ry="1.5" transform="rotate(-30 62 19.5)" fill="#fff"/>`, pivot: [60, 31]}
        },
        eyes: {lx: 51, rx: 69, y: 60, r: 4.6, style: "dot", color: "#1F2230"},
        mouth: {x: 60, y: 68.5, w: 3, color: "#1F2230"},
        cheeks: {lx: 45, rx: 75, y: 67.5, w: 3.8, h: 2.5, color: "#FF94A8"},
        anchors: {top: [60, 18, 0.8], neck: [60, 44, 0.85], chest: [72, 89, 0.62], back: [80, 60, 0.85], hands: [60, 84, 0.9]},
        lines: {
          tap: ["Hi hi! Fresh out of the tube and so excited!", "Your work is coming along so beautifully!", "Let's add a splash of color to today!", "No rush! Every stroke is wonderful!", "Every stroke counts, and you're nailing it!", "Blend in a little rest too! You're amazing!", "You make it look so easy! Wow!"],
          pet: ["Hehe! Gently, or I'll splash rainbows!", "Hehe! That tickles! So happy!"],
          hello: ["Hi hi! Brushes ready? Let's create!", "Hello, artist! I'm bursting with color!"],
          morning: ["Good morning! A blank canvas just for you!", "Rise and shine, bright spark! Let's paint the day!"],
          night: ["Time to put my cap on. Rest well, artist.", "It's late now. Let the colors dry and rest."],
          focus: ["Let's paint the page together! Go go!", "Steady hand, calm mind. You've got this!"],
          done: ["What a masterpiece of a session!", "Session done! Absolutely brilliant work!"],
          task: ["Nailed it! WOO!", "Splash! Another one done!", "Pretty as a picture! Checked off!", "Colored in! Yes yes yes!"],
          break: ["Rinse your brush and stretch!", "Step back and admire your work! So good!"]
        }
      },
      {
        id: "painting-chameleon", name: "Hue", kind: "Paint Chameleon", pose: "sit", sleepy: true,
        bio: "A calm little chameleon who changes color with every brushstroke.",
        idle: ["tailSwish", "headTilt", "topBob"], cheer: "hop",
        neck: [60, 77],
        parts: {
          tail: {svg: `<path d="M80 102C94 104.5 103 95 99.5 87C96.5 80.5 88 81 88.5 87.5C89 91.5 93.5 91.5 94 88" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round"/><path d="M80 102C94 104.5 103 95 99.5 87C96.5 80.5 88 81 88.5 87.5C89 91.5 93.5 91.5 94 88" fill="none" stroke="#6CC47A" stroke-width="5.4" stroke-linecap="round"/>`, pivot: [80, 101]},
          feet: `<ellipse cx="41" cy="107" rx="8.5" ry="4.8" fill="#63B872" ${O}/><ellipse cx="79" cy="107" rx="8.5" ry="4.8" fill="#63B872" ${O}/>`,
          body: `${LG("painting-chameleon-b", [[0, "#A6E48E"], [1, "#5EB86C"]])}
            <path d="M60 74C77 74 85 87 85 98C85 107 76 110.5 60 110.5C44 110.5 35 107 35 98C35 87 43 74 60 74Z" fill="url(#painting-chameleon-b)" ${O}/>
            <ellipse cx="60" cy="98" rx="13" ry="10" fill="#E9F7BE"/>
            <path d="M38.5 90Q41 86 45 84.5" fill="none" stroke="#C8F0B0" stroke-width="2.6" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="50.5" cy="101" rx="5.6" ry="7.4" fill="#7CCB7A" ${O}/>`, pivot: [50.5, 94]},
          armR: {svg: `<ellipse cx="69.5" cy="101" rx="5.6" ry="7.4" fill="#7CCB7A" ${O}/>`, pivot: [69.5, 94]},
          head: `${LG("painting-chameleon-h", [[0, "#B4EC9A"], [1, "#6CC070"]])}
            <ellipse cx="60" cy="58" rx="27" ry="21" fill="url(#painting-chameleon-h)" ${O}/>
            <path d="M40.5 50Q44 43 51 40.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/>`,
          top: {svg: `<path d="M47 40.5C48.5 32 54 27.5 60 27.5C66 27.5 71.5 32 73 40.5C66 38.5 54 38.5 47 40.5Z" fill="#5DB36B" ${O}/><path d="M53 37.5C53 33 56 30.5 60 30.5C64 30.5 67 33 67 37.5C62.5 36.5 57.5 36.5 53 37.5Z" fill="#FF9FC0"/><path d="M57 37V40.5M62.5 37V39" stroke="#FF9FC0" stroke-width="2.4" stroke-linecap="round"/>`, pivot: [60, 40]}
        },
        eyes: {lx: 49, rx: 71, y: 58, r: 5, style: "dot", color: "#1F2A20"},
        mouth: {x: 60, y: 67, w: 3.4, color: "#1F2A20"},
        cheeks: {lx: 41, rx: 79, y: 65.5, w: 4.4, h: 2.7, color: "#FF8FA8"},
        anchors: {top: [60, 31, 0.95], neck: [60, 78, 1.05], chest: [71, 92, 0.66], back: [34, 90, 0.85], hands: [60, 96, 0.9]},
        lines: {
          tap: ["Oh, hello! I just turned happy teal!", "You bring out all my brightest colors!", "Slow and steady, just like me! Love it!", "Every change means you're learning! Wow!", "Blend in some calm! You've got this!", "Every shade of you is wonderful!", "Take your time! I'm cheering in rainbow!"],
          pet: ["Ooh! I'm blushing bright pink!", "Hehe! Now I'm every color at once!"],
          hello: ["You're back! I turned sunshine yellow!", "Hello! Let's add some color to today!"],
          morning: ["Good morning! Soft pastels and big smiles!", "Rise and shine, bright one! Let's go!"],
          night: ["Fading to a sleepy blue now. Rest soon?", "My colors are dimming. Time for bed, friend."],
          focus: ["Blending in quietly. You've got this!", "Calm colors, big focus. Let's go!"],
          done: ["You're glowing gold! What a session!", "Session done! Such colorful work!"],
          task: ["Done! I'm tickled pink! WOO!", "Another one done! Rainbow mode!", "Yes yes yes! Checked off!", "Look at you go! That's finished!"],
          break: ["Slow, happy stretch time, like me!", "Break time! Soak up some sunshine!"]
        }
      },
      {
        id: "painting-palette", name: "Dabs", kind: "Paint Palette", pose: "float",
        bio: "A floating palette dotted with every color you might need today.",
        idle: ["topBob", "sparkle", "finWiggle"], cheer: "spin",
        parts: {
          body: `${LG("painting-palette-g", [[0, "#FAE3BA"], [1, "#E2AF72"]])}
            <path d="M58 45C80 43 99 53 99 69C99 82 89 90 77 88C71 87 69 92 62 94C44 98 22 90 21 72C20 56 37 46 58 45Z" fill="url(#painting-palette-g)" ${O}/>
            <ellipse cx="88" cy="75" rx="4.6" ry="3.8" fill="#C99058" ${OW(2.2)}/>
            <path d="M30 61Q34 54 41 51" fill="none" stroke="#FFF3DC" stroke-width="3" stroke-linecap="round"/>
            <path d="M35.5 88Q48 93.5 60 92" fill="none" stroke="#D09A5C" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
            <path d="${puff(33, 69, 4.6, 6, 1.2)}" fill="#E0463C" ${OW(2)}/><path d="${puff(45, 56, 4.8, 6, 1.2)}" fill="#F2C24A" ${OW(2)}/>
            <path d="${puff(60, 52.5, 4.8, 6, 1.2)}" fill="#3D7BE0" ${OW(2)}/><path d="${puff(75, 55, 4.6, 6, 1.2)}" fill="#2E9E5B" ${OW(2)}/>
            <circle cx="31.8" cy="67.4" r="1.3" fill="#fff" opacity=".8"/><circle cx="43.8" cy="54.4" r="1.3" fill="#fff" opacity=".8"/><circle cx="58.8" cy="50.9" r="1.3" fill="#fff" opacity=".8"/><circle cx="73.8" cy="53.4" r="1.3" fill="#fff" opacity=".8"/>`,
          armL: {svg: `<ellipse cx="24" cy="83" rx="4.4" ry="5.8" transform="rotate(30 24 83)" fill="#EDC58E" ${O}/>`, pivot: [30, 80]},
          armR: {svg: `<ellipse cx="96" cy="84" rx="4.4" ry="5.8" transform="rotate(-30 96 84)" fill="#EDC58E" ${O}/>`, pivot: [90, 81]},
          top: {svg: `${LINE("M86 70L96.5 38", "#F2C24A", 3.6)}<path d="M94.5 38.5L99.5 40L101.5 34L96.5 32.5Z" fill="#CDD3DE" ${OW(2)}/><path d="M96.6 32.6C96 28 98 23 101.5 20.5C103.5 24.5 103.6 29.5 101.4 34Z" fill="#A45CD6" ${OW(2)}/>`, pivot: [87, 68]}
        },
        eyes: {lx: 51, rx: 69, y: 72, r: 4.8, style: "dot", color: "#3A2414"},
        mouth: {x: 60, y: 80.5, w: 3, color: "#3A2414"},
        cheeks: {lx: 43.5, rx: 76.5, y: 79.5, w: 4.2, h: 2.6, color: "#FF8FA0"},
        anchors: {top: [52, 49, 0.9], neck: [60, 91, 1.2], chest: [75, 84, 0.6], back: [26, 62, 0.8], hands: [60, 89, 0.85]},
        lines: {
          tap: ["Hi hi! Pick a color, any color! Yay!", "I'm so glad you're here! Truly!", "Mix it up! You've totally got this!", "Here's a big dab of cheer just for you!", "Paint outside the lines! Be bold!", "So many bright ideas today! Wow!", "Your work is looking amazing!"],
          pet: ["Hehe! I'm all smudged and happy!", "Ooh! A splash of pure joy!"],
          hello: ["You're back! All my colors are ready!", "Hello hello! Let's make today beautiful!"],
          morning: ["Good morning! Fresh paint, fresh start!", "Rise and shine, artist! Let's get colorful!"],
          night: ["The colors are drying now. Time to rest?", "Clean brushes and a cozy bed. Sleep well."],
          focus: ["Mixing quietly with you! You've got this!", "Calm colors, heads down. Let's go!"],
          done: ["A true work of art! Amazing session!", "Session done! Picture perfect!"],
          task: ["Splash! Another one done!", "Pretty as a picture! WOO!", "Colored in! Yes yes yes!", "Checked off! What a masterpiece!"],
          break: ["Stretch those arms up high!", "Step back, breathe and admire your work!"]
        }
      }
    ]
  });

  /* Bake Shop */
  COMP_DATA.push({
    theme: "baking",
    companions: [
      {
        id: "baking-cupcake", name: "Sprinkles", kind: "Strawberry Cupcake", pose: "stand",
        bio: "A sweet strawberry cupcake with a cherry on top of your day.",
        idle: ["topBob", "sway", "bounce"], cheer: "hop",
        parts: {
          body: `${LG("baking-cupcake-w", [[0, "#C6EEDD"], [1, "#86CDB4"]])}
            <path d="M33 74H87L80.5 106Q60 110 39.5 106Z" fill="url(#baking-cupcake-w)" ${O}/>
            <path d="M45 99.5V105.5M52.5 100V106.5M60 100V107M67.5 100V106.5M75 99.5V105.5" stroke="#5FAE93" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M37 80L40 100" stroke="#EAFBF3" stroke-width="3" stroke-linecap="round"/>
            ${RG("baking-cupcake-f", [[0, "#FFE3EE"], [0.55, "#FFBCD4"], [1, "#F08DB2"]], 0.42, 0.32, 0.8)}
            <path d="M29 75C24 69 28 61 36 61C35 53 43 48 50 50C52 43 60 40 66 43C73 42 79 48 77 54C84 53 91 58 90 65C95 69 93 76 88 77C75 80.5 44 80.5 29 75Z" fill="url(#baking-cupcake-f)" ${O}/>
            <path d="M38 66Q46 70.5 56 69M64 62Q73 64 80 60" fill="none" stroke="#E9779F" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>
            <path d="M40 58Q44 53.5 49 53" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            <rect x="42.5" y="62" width="6" height="2.4" rx="1.2" fill="#6FD3FF" transform="rotate(30 45.5 63.2)"/><rect x="58" y="53" width="6" height="2.4" rx="1.2" fill="#FFD86B" transform="rotate(-25 61 54.2)"/>
            <rect x="70" y="67" width="6" height="2.4" rx="1.2" fill="#C9A0FF" transform="rotate(20 73 68.2)"/><rect x="77" y="57.5" width="6" height="2.4" rx="1.2" fill="#8EE4B8" transform="rotate(-40 80 58.7)"/>
            <rect x="52" y="69" width="6" height="2.4" rx="1.2" fill="#fff" transform="rotate(-10 55 70.2)"/>`,
          armL: {svg: `<ellipse cx="30.5" cy="90" rx="4.6" ry="6.4" transform="rotate(26 30.5 90)" fill="#A8DEC9" ${O}/>`, pivot: [36.5, 87]},
          armR: {svg: `<ellipse cx="89.5" cy="90" rx="4.6" ry="6.4" transform="rotate(-26 89.5 90)" fill="#A8DEC9" ${O}/>`, pivot: [83.5, 87]},
          top: {svg: `${LINE("M61 37C61 31 63 26 68 22", "#6FA84E", 2.2)}${RG("baking-cupcake-c", [[0, "#FF8A9C"], [1, "#C8203E"]], 0.4, 0.35, 0.7)}<circle cx="60" cy="40" r="6.4" fill="url(#baking-cupcake-c)" ${O}/><ellipse cx="57.8" cy="37.8" rx="2" ry="1.3" transform="rotate(-35 57.8 37.8)" fill="#fff"/>`, pivot: [60, 45]}
        },
        eyes: {lx: 50, rx: 70, y: 87, r: 4.6, style: "dot", color: "#33211F"},
        mouth: {x: 60, y: 95, w: 3, color: "#33211F"},
        cheeks: {lx: 42.5, rx: 77.5, y: 94, w: 4.2, h: 2.6, color: "#FF8FA8"},
        anchors: {top: [60, 45, 1], neck: [60, 78, 1.2], chest: [73, 99, 0.62], back: [86, 68, 0.9], hands: [60, 101, 0.85]},
        lines: {
          tap: ["Hi, sweetie! You made my whole day!", "You're the cherry on top of everything!", "Let's sprinkle some fun on this study session!", "Sweet work! Keep it coming!", "Your brain deserves a treat, and so do you!", "I'm so proud of you, I could pop my frosting!", "Look at you, one smart cookie!"],
          pet: ["Hehe! Careful, my frosting is all wiggly!", "Aww, that's the sweetest thing ever!"],
          hello: ["Hooray, you're back! I'm fresh from the oven!", "Hello, hello! I'm so happy to see you!"],
          morning: ["Good morning! The oven's warm and so am I!", "Rise and shine, cupcake! Big sweet day ahead!"],
          night: ["Sweet dreams soon, okay? You did lovely today.", "The oven's off and cooling. Cozy bedtime?"],
          focus: ["Quiet as a cooling rack. You've got this!", "Heads down, sweetie! I'm right here cheering."],
          done: ["Sweet session! I'm bursting with sprinkles!", "Baked to perfection! You were amazing!"],
          task: ["SWEET! Another one done!", "Yes! Cherry on top of a great day!", "Frosted and finished! Woohoo!", "Piece of cake! You totally crushed it!"],
          break: ["Snack break! Grab something tasty!", "Let's stretch while the cupcakes cool!"]
        }
      },
      {
        id: "baking-piglet", name: "Pudding", kind: "Baker Piglet", pose: "sit", sleepy: true,
        bio: "A little baker piglet in a tidy apron, dozing by the warm oven.",
        idle: ["earTwitch", "tailSwish", "headTilt"], cheer: "bounce",
        neck: [60, 77],
        parts: {
          tail: {svg: `${LINE("M82 100C88 101 91 97 88.5 94.5C86 92 83 95.5 86 98C89 100.5 94 98 94.5 93.5", "#F7A9BC", 2.6)}`, pivot: [82, 100]},
          feet: `<ellipse cx="44" cy="107.5" rx="7.6" ry="4.4" fill="#F2A0B4" ${O}/><ellipse cx="76" cy="107.5" rx="7.6" ry="4.4" fill="#F2A0B4" ${O}/>`,
          earL: {svg: `<path d="M40 46C34 44 29.5 38.5 30 32C31.5 30 34 30 36 31C43 32 49 35.5 52.5 40Z" fill="#FFBFCC" ${O}/><path d="M40 41C36.5 39.5 34.5 37 34.3 34.5C38.5 34.8 43 36.5 46 39Z" fill="#F58FA8"/>`, pivot: [45, 42]},
          earR: {svg: `<path d="M80 46C86 44 90.5 38.5 90 32C88.5 30 86 30 84 31C77 32 71 35.5 67.5 40Z" fill="#FFBFCC" ${O}/><path d="M80 41C83.5 39.5 85.5 37 85.7 34.5C81.5 34.8 77 36.5 74 39Z" fill="#F58FA8"/>`, pivot: [75, 42]},
          body: `${LG("baking-piglet-b", [[0, "#FFD3DC"], [1, "#F4A6B8"]])}
            <path d="M60 74C77 74 84 87 84 98C84 107 76 110.5 60 110.5C44 110.5 36 107 36 98C36 87 43 74 60 74Z" fill="url(#baking-piglet-b)" ${O}/>
            <path d="M45.5 81H74.5V99C74.5 104.5 68.5 108 60 108C51.5 108 45.5 104.5 45.5 99Z" fill="#FFFDF8" ${OW(2.2)}/>
            <path d="M46.5 85H73.5" stroke="#86CDB4" stroke-width="2.6" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="47" cy="96" rx="5.4" ry="7" fill="#FBB9C8" ${O}/><path d="M47 100.5v2.6" stroke="#D97A92" stroke-width="1.5" stroke-linecap="round"/>`, pivot: [47, 89]},
          armR: {svg: `<ellipse cx="73" cy="96" rx="5.4" ry="7" fill="#FBB9C8" ${O}/><path d="M73 100.5v2.6" stroke="#D97A92" stroke-width="1.5" stroke-linecap="round"/>`, pivot: [73, 89]},
          head: `${LG("baking-piglet-h", [[0, "#FFE0E6"], [1, "#F7B0C0"]])}
            <ellipse cx="60" cy="58.5" rx="25" ry="20.5" fill="url(#baking-piglet-h)" ${O}/>
            <path d="M41.5 52Q44.5 45 51 42" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/>
            <ellipse cx="69" cy="42.5" rx="3.4" ry="1.7" fill="#fff" opacity=".9"/>`,
          face: `<ellipse cx="60" cy="66" rx="7.4" ry="4.8" fill="#F794AD" ${OW(2)}/><ellipse cx="57.4" cy="66" rx="1.3" ry="1.8" fill="#B9506E"/><ellipse cx="62.6" cy="66" rx="1.3" ry="1.8" fill="#B9506E"/>`
        },
        eyes: {lx: 49, rx: 71, y: 56, r: 4.4, style: "dot", color: "#2A1E1C"},
        mouth: {x: 60, y: 73.5, w: 2.6, color: "#5A2632"},
        cheeks: {lx: 42, rx: 78, y: 65, w: 4.2, h: 2.6, color: "#FF7F9A"},
        anchors: {top: [60, 38.5, 0.95], neck: [60, 79, 1.05], chest: [67, 92, 0.6], back: [85, 90, 0.85], hands: [60, 97, 0.9]},
        lines: {
          tap: ["Oink! Hello, hello! I'm so glad you're here!", "Something smells like success, and it's you!", "Whisk away the worries! We've got this!", "Need a hand? I'm right here, apron and all!", "Little crumbs add up to a whole loaf!", "Warm oven, warm heart, and a great student!", "You're doing wonderfully! Oink oink!"],
          pet: ["Oink oink! Hehe, that's my favorite!", "Hehe! My ears are doing a happy wiggle!"],
          hello: ["Oink! You're back! My tail is curling with joy!", "Hi hi! The oven's warm and ready for you!"],
          morning: ["Good morning! The bread is rising and so are we!", "Oink! Rise and shine, it's a baking day!"],
          night: ["Oven's off now. Bedtime soon, friend?", "Cozy by the warm oven... time to rest?"],
          focus: ["Shh, the dough is rising! You've got this!", "Heads down! I'll keep the oven warm for you."],
          done: ["Oink! What a session! I'm so proud!", "Fresh baked and fabulous! Well done!"],
          task: ["OINK! Done and dusted!", "Yes! Baked to a golden crisp!", "Another treat out of the oven! Woohoo!", "Look at you go! Checked off!"],
          break: ["Snack time! Nibble something yummy!", "Stretch break while the bread bakes!"]
        }
      },
      {
        id: "baking-macaron", name: "Macy", kind: "Flying Macaron", pose: "float",
        bio: "A light-as-air lavender macaron with tiny sugar wings.",
        idle: ["wingFlutter", "sparkle", "bounce"], cheer: "spin",
        parts: {
          wingL: {svg: `<path d="M36 62C27 50 15 46.5 11 52C8.5 59 19 68 34.5 69Z" fill="#FFFFFF" fill-opacity=".95" ${OW(2.4)}/><path d="M33 65.5Q22 61.5 15.5 54" fill="none" stroke="#E0CCF5" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [35, 65]},
          wingR: {svg: `<path d="M84 62C93 50 105 46.5 109 52C111.5 59 101 68 85.5 69Z" fill="#FFFFFF" fill-opacity=".95" ${OW(2.4)}/><path d="M87 65.5Q98 61.5 104.5 54" fill="none" stroke="#E0CCF5" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [85, 65]},
          body: `${LG("baking-macaron-s", [[0, "#E6D2FF"], [1, "#B893F0"]])}
            <path d="M27 88.5H93C93 99 81 104 60 104C39 104 27 99 27 88.5Z" fill="url(#baking-macaron-s)" ${O}/>
            <rect x="28.5" y="78.5" width="63" height="11" rx="5.5" fill="#FFF6EA" ${O}/>
            <path d="M26 73C26 52 40 39 60 39C80 39 94 52 94 73C94 78 90 79.5 85.5 78C81.5 80.5 77.5 80.5 73.5 78C69.5 80.5 65 80.5 60 78C55 80.5 50.5 80.5 46.5 78C42.5 80.5 38.5 80.5 34.5 78C30 79.5 26 78 26 73Z" fill="url(#baking-macaron-s)" ${O}/>
            <path d="M35 58Q39 48.5 48 44.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".9"/>
            <path d="M39 99Q60 103 81 99" fill="none" stroke="#A47FE0" stroke-width="2" stroke-linecap="round" opacity=".6"/>`,
          armL: {svg: `<ellipse cx="23" cy="84" rx="4.4" ry="5.6" transform="rotate(34 23 84)" fill="#FFF3E2" ${O}/>`, pivot: [30, 83]},
          armR: {svg: `<ellipse cx="97" cy="84" rx="4.4" ry="5.6" transform="rotate(-34 97 84)" fill="#FFF3E2" ${O}/>`, pivot: [90, 83]}
        },
        eyes: {lx: 49.5, rx: 70.5, y: 60, r: 4.8, style: "sparkle", color: "#33213F"},
        mouth: {x: 60, y: 68.5, w: 2.8, color: "#33213F"},
        cheeks: {lx: 41.5, rx: 78.5, y: 67.5, w: 4.4, h: 2.7, color: "#FF8FB8"},
        anchors: {top: [60, 40, 1], neck: [60, 84, 1.4], chest: [75, 95, 0.58], back: [88, 56, 0.8], hands: [60, 88, 0.85]},
        lines: {
          tap: ["Bonjour! Hi hi! I'm so happy you're here!", "Your work is looking lovely today!", "Light and steady, that's you! Ooh la la!", "A sweet little treat for your brilliant mind!", "Crisp outside, soft inside, and so proud of you!", "Fluttering by to cheer you on!", "I'm filled to the brim with pride for you!"],
          pet: ["Hehe! Crumbly giggles everywhere!", "Ooh la la! Merci, merci!"],
          hello: ["Bonjour! Welcome back, I missed you!", "Yay, you're here! I fluttered right over!"],
          morning: ["Bonjour! What a sweet morning to shine!", "Good morning, friend! Wings up, let's go!"],
          night: ["Sweet dreams soon, oui? You did so well.", "Time to rest those wings. Bonne nuit."],
          focus: ["Quiet flutter mode! You've got this!", "Sweet and steady! Heads down, let's go."],
          done: ["Magnifique! What a session!", "Sweet success! I'm doing a happy flutter!"],
          task: ["Voila! Done and dusted!", "Yes yes yes! Sweet as can be!", "Done! C'est parfait! Woohoo!", "Filled to the brim with wins today!"],
          break: ["Flutter break! Up and stretch!", "Ooh, sweet little snack break time!"]
        }
      }
    ]
  });
})();


