/* Study Companions, around the world: australia (Sydney Harbour) */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const twinkle = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${c || "#fff"}"/>`;

  /* ================= Sydney Harbour ================= */
  COMP_DATA.push({
    theme: "australia",
    companions: [
      {
        id: "australia-joey", name: "Joey", kind: "Kangaroo Joey", pose: "stand", wearColor: "#2E8AB0",
        bio: "Peeks out of the pouch to hop through your list.",
        idle: ["earTwitch", "tailSwish", "headTilt"], cheer: "hop",
        neck: [60, 68],
        parts: {
          tail: {svg: `${LG("australia-joey-t", [[0, "#E2A066"], [1, "#B8743E"]])}<path d="M74 96Q92 96 106 104Q112 108 108 110Q94 110 76 106Z" fill="url(#australia-joey-t)" ${O}/><path d="M86 101Q96 102 104 106" fill="none" stroke="#F4D2AA" stroke-width="2" stroke-linecap="round"/>`, pivot: [76, 100]},
          feet: `<path d="M38 110Q36 104 44 103L58 104Q61 107 58 110Z" fill="#C8824A" ${O}/><path d="M62 110Q59 107 62 104L76 103Q84 104 82 110Z" fill="#C8824A" ${O}/>`,
          armL: {svg: `<ellipse cx="44" cy="80" rx="4.4" ry="8" transform="rotate(24 44 80)" fill="#D9955A" ${O}/>`, pivot: [48, 74]},
          armR: {svg: `<ellipse cx="76" cy="80" rx="4.4" ry="8" transform="rotate(-24 76 80)" fill="#D9955A" ${O}/>`, pivot: [72, 74]},
          body: `${LG("australia-joey-b", [[0, "#E8AC6E"], [1, "#C8824A"]])}
            <path d="M60 64C76 64 82 80 82 92C82 104 74 108 60 108C46 108 38 104 38 92C38 80 44 64 60 64Z" fill="url(#australia-joey-b)" ${O}/>
            <path d="M60 74C70 74 74 84 74 94C74 102 68 105 60 105C52 105 46 102 46 94C46 84 50 74 60 74Z" fill="#F6DFC0"/>
            <path d="M47 92Q60 98 73 92Q72 104 60 104Q48 104 47 92Z" fill="#EAC69C" ${OW(2)}/>
            ${LINE("M66 92L71 81", "#F2C641", 2.4)}<path d="M70 79L72.6 82L71.6 76Z" fill="#E86A5A" ${OW(1.2)}/>
            <path d="M44 74Q46 70 50 68" fill="none" stroke="#FFE2BE" stroke-width="2.4" stroke-linecap="round"/>`,
          earL: {svg: `${LG("australia-joey-e", [[0, "#E2A066"], [1, "#C8824A"]])}<path d="M50 42C42 34 40 20 44 12C50 16 54 30 54 40Z" fill="url(#australia-joey-e)" ${O}/><path d="M50 37C46 31 45 22 46.4 17C49 22 51 30 51 36Z" fill="#F4C4A8"/>`, pivot: [52, 42]},
          earR: {svg: `<path d="M70 42C78 34 80 20 76 12C70 16 66 30 66 40Z" fill="url(#australia-joey-e)" ${O}/><path d="M70 37C74 31 75 22 73.6 17C71 22 69 30 69 36Z" fill="#F4C4A8"/>`, pivot: [68, 42]},
          head: `${RG("australia-joey-h", [[0, "#F0BC82"], [0.7, "#DE9C60"], [1, "#C07A42"]], 0.42, 0.32, 0.8)}
            <path d="M60 36C74 36 79 46 78 54C77 62 72 68 66 70Q60 72 54 70C48 68 43 62 42 54C41 46 46 36 60 36Z" fill="url(#australia-joey-h)" ${O}/>
            <ellipse cx="60" cy="62" rx="9" ry="6.6" fill="#F6DFC0" ${OW(1.8)}/>
            <path d="M48 44Q52 39 58 38" fill="none" stroke="#FFE2BE" stroke-width="2.6" stroke-linecap="round"/>`,
          face: `<ellipse cx="60" cy="58.6" rx="3.2" ry="2.3" fill="#3A2418"/><ellipse cx="59" cy="57.8" rx="1" ry=".55" fill="#fff" opacity=".8"/>`
        },
        eyes: {lx: 52, rx: 68, y: 51, r: 4, style: "sparkle", color: "#2E1E14"},
        mouth: {x: 60, y: 64, w: 2.6, color: "#3A2418", style: "cat"},
        cheeks: {lx: 47, rx: 73, y: 59, w: 3.4, h: 2.2, color: "#FF9A84"},
        anchors: {top: [60, 37, 0.85], neck: [60, 70, 0.95], chest: [70, 84, 0.6], back: [80, 86, 0.7], hands: [60, 86, 0.8]},
        lines: {
          tap: ["G'day! Ready to hop through that list?", "Boing! One task, then the next!", "Big feet, big leaps, big progress!", "I keep a pencil in my pouch, just in case!", "You're bounding along beautifully!", "Little hops add up to a long way!", "Fair dinkum, you're smashing it!", "Spring in your step, focus in your head!"],
          pet: ["Hehe! My ears go all floppy!", "Aww! Best pat in the outback!"],
          hello: ["G'day mate! You're back!", "Hop hop hooray, it's you!"],
          morning: ["Morning! The sun's up and so are we!", "G'day! Let's bound into the day!"],
          night: ["Hooroo for today! Rest those legs soon.", "Late night? A short hop, then bed, okay?"],
          focus: ["Sitting still, which is hard for me!", "Head down, ears up. You've got this!"],
          done: ["What a session! You leapt right over it!", "All done! Ripper effort, mate!"],
          task: ["Done! Boing!", "Checked off! Ripper!", "Another one hopped over!", "Yes! Too easy!"],
          break: ["Stretch those legs! A few hops around!", "Water break! Even kangaroos need a drink."]
        }
      },
      {
        id: "australia-gumnut", name: "Gumnut", kind: "Koala", pose: "sit", wearColor: "#5E9A7A",
        bio: "Sleeps 20 hours a day but is fully awake for studying.",
        idle: ["earTwitch", "headTilt", "topBob"], cheer: "bounce",
        neck: [60, 78],
        parts: {
          feet: `<ellipse cx="45" cy="106" rx="9" ry="5.4" fill="#9C9CA8" ${O}/><ellipse cx="75" cy="106" rx="9" ry="5.4" fill="#9C9CA8" ${O}/><path d="M40 106h2M44 107.4h2M48 106h2M70 106h2M74 107.4h2M78 106h2" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="40" cy="90" rx="6" ry="10" transform="rotate(20 40 90)" fill="#A8A8B4" ${O}/>`, pivot: [44, 82]},
          armR: {svg: `<ellipse cx="80" cy="90" rx="6" ry="10" transform="rotate(-20 80 90)" fill="#A8A8B4" ${O}/>`, pivot: [76, 82]},
          body: `${LG("australia-gumnut-b", [[0, "#B8B8C4"], [1, "#9696A4"]])}
            <path d="M60 74C78 74 88 86 88 97C88 107 78 110 60 110C42 110 32 107 32 97C32 86 42 74 60 74Z" fill="url(#australia-gumnut-b)" ${O}/>
            <path d="M60 80C70 80 74 88 74 96C74 104 68 106 60 106C52 106 46 104 46 96C46 88 50 80 60 80Z" fill="#F2F0F0"/>
            <path d="M50 88Q53 85 56 87M62 94Q65 91 68 93M54 100Q57 97 60 99" fill="none" stroke="#D8D6DE" stroke-width="1.6" stroke-linecap="round"/>`,
          earL: {svg: `${RG("australia-gumnut-e", [[0, "#FFFFFF"], [0.55, "#F2F0F2"], [1, "#B8B8C4"]], 0.5, 0.5, 0.55)}<path d="${puff(32, 46, 13, 9, 1.22)}" fill="#A8A8B4" ${O}/><circle cx="33" cy="47" r="7.6" fill="url(#australia-gumnut-e)"/>`, pivot: [42, 52]},
          earR: {svg: `<path d="${puff(88, 46, 13, 9, 1.22)}" fill="#A8A8B4" ${O}/><circle cx="87" cy="47" r="7.6" fill="url(#australia-gumnut-e)"/>`, pivot: [78, 52]},
          head: `${RG("australia-gumnut-h", [[0, "#C8C8D2"], [0.7, "#ABABB8"], [1, "#9090A0"]], 0.42, 0.32, 0.8)}
            <path d="M60 38C78 38 86 50 85 61C84 73 74 80 60 80C46 80 36 73 35 61C34 50 42 38 60 38Z" fill="url(#australia-gumnut-h)" ${O}/>
            <path d="M44 48Q48 42 55 41" fill="none" stroke="#E2E2EA" stroke-width="2.8" stroke-linecap="round"/>`,
          face: `<path d="M60 56C65 56 67 61 66.4 66C66 70 63 72 60 72C57 72 54 70 53.6 66C53 61 55 56 60 56Z" fill="#33303C" ${OW(1.6)}/><ellipse cx="58" cy="60" rx="1.6" ry="2.4" fill="#fff" opacity=".45"/>`,
          top: {svg: `${LINE("M60 40Q60 34 63 30", "#7A5A3A", 2)}
            <path d="M62 31C56 24 46 24 42 28C48 33 56 34 62 31Z" fill="#7FAE8E" ${O2}/><path d="M60 30.6Q52 28 45 28" fill="none" stroke="#5A8A6A" stroke-width="1.4" stroke-linecap="round"/>
            <path d="M63 30C68 22 78 20 82 24C78 30 70 33 63 30Z" fill="#9CC4A4" ${O2}/><path d="M64.6 29.4Q72 25 79 24" fill="none" stroke="#5A8A6A" stroke-width="1.4" stroke-linecap="round"/>
            <path d="M58 36Q56 32 59 30.4Q62 30.4 62 33.4Q61 36 58 36Z" fill="#B88A54" ${OW(1.6)}/><path d="M66 36Q65 32 68 31Q71 31.4 70.4 34.4Q69.4 37 66 36Z" fill="#C89A62" ${OW(1.6)}/>`, pivot: [60, 40]}
        },
        eyes: {lx: 47, rx: 73, y: 58, r: 3.6, style: "round", color: "#26222E"},
        mouth: {x: 60, y: 75.6, w: 2.4, color: "#26222E"},
        cheeks: {lx: 43, rx: 77, y: 66, w: 4, h: 2.4, color: "#FFA6BE"},
        anchors: {top: [60, 38, 0.9], neck: [60, 80, 1], chest: [70, 92, 0.6], back: [84, 90, 0.8], hands: [60, 96, 0.84]},
        lines: {
          tap: ["*yawn* Oh! Yes, I'm awake. Let's study!", "Slow and steady, one gum leaf at a time.", "I've saved all my awake hours for you!", "Comfy branch, comfy notes, happy koala.", "You're doing so well. Very relaxing to watch.", "Hug a tree, then hug that next chapter!", "Ears up! That one was a good idea.", "Snack of gum leaves, then back to it?"],
          pet: ["Mmm, so fluffy and cosy now!", "Hehe! Do the ears again!"],
          hello: ["Oh, hello! I woke up just for you!", "You're back! I kept the branch warm."],
          morning: ["Good morning! I'm... mostly awake!", "Morning! Fresh leaves, fresh start!"],
          night: ["Sleepy time is my favourite time. You too?", "It's late! Let's both curl up soon."],
          focus: ["Quietly hugging my branch beside you.", "Calm and cosy. You've got this."],
          done: ["What a session! Worth staying awake for!", "All done! Time for a well-earned nap?"],
          task: ["Done! Lovely!", "Checked off! *happy sigh*", "Another one, nice and steady!", "Yes! Gum-tastic!"],
          break: ["Nap break! Or at least a big stretch.", "Rest your eyes and sip some water."]
        }
      },
      {
        id: "australia-smiley", name: "Smiley", kind: "Quokka", pose: "sit", wearColor: "#E8A43A",
        bio: "Officially the happiest study buddy on the planet.",
        idle: ["earTwitch", "headTilt", "bounce"], cheer: "hop",
        neck: [60, 74],
        parts: {
          feet: `<ellipse cx="47" cy="107" rx="8" ry="4.4" fill="#9A7458" ${O}/><ellipse cx="73" cy="107" rx="8" ry="4.4" fill="#9A7458" ${O}/>`,
          armL: {svg: `<ellipse cx="42" cy="88" rx="4.8" ry="8" transform="rotate(14 42 88)" fill="#A88262" ${O}/>`, pivot: [45, 81]},
          armR: {svg: `<ellipse cx="78" cy="88" rx="4.8" ry="8" transform="rotate(-14 78 88)" fill="#A88262" ${O}/>`, pivot: [75, 81]},
          body: `${LG("australia-smiley-b", [[0, "#C49C78"], [1, "#9E7656"]])}
            <path d="M60 70C76 70 84 84 84 96C84 106 76 110 60 110C44 110 36 106 36 96C36 84 44 70 60 70Z" fill="url(#australia-smiley-b)" ${O}/>
            <path d="M60 78C69 78 73 88 73 96C73 103 68 106 60 106C52 106 47 103 47 96C47 88 51 78 60 78Z" fill="#E6CCAA"/>
            <path d="M80 100Q92 102 96 108Q90 111 82 108Z" fill="#9E7656" ${OW(2.4)}/>
            ${twinkle(98, 84, 3.4, "#FFE27A")}${twinkle(22, 74, 2.6, "#FFE27A")}`,
          earL: {svg: `<circle cx="43" cy="38" r="8" fill="#A88262" ${O}/><circle cx="43.6" cy="38.6" r="4.4" fill="#E2B8A0"/>`, pivot: [47, 44]},
          earR: {svg: `<circle cx="77" cy="38" r="8" fill="#A88262" ${O}/><circle cx="76.4" cy="38.6" r="4.4" fill="#E2B8A0"/>`, pivot: [73, 44]},
          head: `${RG("australia-smiley-h", [[0, "#D8B48E"], [0.7, "#BC9470"], [1, "#9E7656"]], 0.42, 0.32, 0.8)}
            <path d="M60 34C76 34 82 44 82 54C82 66 72 74 60 74C48 74 38 66 38 54C38 44 44 34 60 34Z" fill="url(#australia-smiley-h)" ${O}/>
            <path d="M60 52C69 52 73 58 72 63C71 69 66 72 60 72C54 72 49 69 48 63C47 58 51 52 60 52Z" fill="#E6CCAA"/>
            <path d="M46 42Q50 37 56 36" fill="none" stroke="#EAD2B4" stroke-width="2.6" stroke-linecap="round"/>`,
          face: `<ellipse cx="60" cy="57" rx="3.4" ry="2.5" fill="#2E2018"/><ellipse cx="59" cy="56.2" rx="1" ry=".6" fill="#fff" opacity=".8"/>`
        },
        eyes: {lx: 51, rx: 69, y: 49, r: 4, style: "sparkle", color: "#2A1C14"},
        mouth: {x: 60, y: 63, w: 4.2, color: "#2A1C14", style: "smile"},
        cheeks: {lx: 47, rx: 73, y: 60, w: 4, h: 2.6, color: "#FF8FA0"},
        anchors: {top: [60, 35, 0.85], neck: [60, 75, 0.95], chest: [70, 90, 0.6], back: [82, 88, 0.75], hands: [60, 92, 0.8]},
        lines: {
          tap: ["Hi! Did I mention I'm SO happy you're here?", "Big smile, big brain, big day!", "Studying with you is my favourite thing!", "Every page you read makes me grin wider!", "You're a little ray of sunshine. Keep going!", "Smile check: yours could be bigger! Hehe!", "Happy notes make happy grades!", "Sunshine, sea breeze and a good chapter!"],
          pet: ["Eee! That made my whole day!", "Hehe! Happiest quokka ever!"],
          hello: ["You're back! Best day ever!", "Hi hi hi! I missed your face!"],
          morning: ["Good morning! Today is going to be great!", "Morning! Smiles ready, books ready!"],
          night: ["Happy dreams soon, okay?", "It's late! Smile, stretch, then sleep."],
          focus: ["Smiling quietly right beside you.", "Focus face on! You've got this!"],
          done: ["You did it! I'm grinning ear to ear!", "All done! Happiest session ever!"],
          task: ["Done! Yay!", "Checked off! Big grin!", "Another one! So happy!", "Yes! You're amazing!"],
          break: ["Smile break! Stretch and look outside.", "Snack and sip time! You earned it."]
        }
      }
    ]
  });
})();
