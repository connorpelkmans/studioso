/* Study Companions, around the world: france (Paris) */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const f1 = v => Math.round(v * 10) / 10;
  const twinkle = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${c || "#fff"}"/>`;

  /* ================= Paris ================= */
  COMP_DATA.push({
    theme: "france",
    companions: [
      {
        id: "france-coco", name: "Coco", kind: "Croissant", pose: "stand", wearColor: "#C8463E",
        bio: "A flaky golden croissant, folded with care just like your notes.",
        idle: ["topBob", "sway", "headTilt"], cheer: "bounce",
        neck: [60, 88],
        parts: {
          feet: `<ellipse cx="48" cy="102" rx="7.4" ry="4.2" fill="#B8702A" ${O}/><ellipse cx="72" cy="102" rx="7.4" ry="4.2" fill="#B8702A" ${O}/>`,
          armL: {svg: `<ellipse cx="34" cy="96" rx="4.6" ry="6" transform="rotate(30 34 96)" fill="#E8A44A" ${O}/>`, pivot: [38, 92]},
          armR: {svg: `<ellipse cx="86" cy="96" rx="4.6" ry="6" transform="rotate(-30 86 96)" fill="#E8A44A" ${O}/>`, pivot: [82, 92]},
          body: `${LG("france-coco-t", [[0, "#F8D088"], [0.55, "#E8A44A"], [1, "#B8702A"]])}${LG("france-coco-s", [[0, "#FAD898"], [0.6, "#EDAE52"], [1, "#C07A30"]])}
            <path d="M22 88Q12 92 10 102Q16 108 24 104Q30 100 30 92Z" fill="url(#france-coco-t)" ${O}/>
            <path d="M98 88Q108 92 110 102Q104 108 96 104Q90 100 90 92Z" fill="url(#france-coco-t)" ${O}/>
            <path d="M40 58Q24 60 18 74Q14 88 22 96Q32 100 42 92Z" fill="url(#france-coco-s)" ${O}/>
            <path d="M80 58Q96 60 102 74Q106 88 98 96Q88 100 78 92Z" fill="url(#france-coco-s)" ${O}/>
            <path d="M30 64Q26 78 34 94M90 64Q94 78 86 94M15 96Q20 98 25 95M105 96Q100 98 95 95" fill="none" stroke="#B0682A" stroke-width="1.8" stroke-linecap="round" opacity=".75"/>
            <path d="M24 70Q27 64 33 62M13 98Q14 94 17 92" fill="none" stroke="#FFF0C8" stroke-width="2.4" stroke-linecap="round"/>`,
          head: `${RG("france-coco-h", [[0, "#FCE2A4"], [0.6, "#F0B45A"], [1, "#C8822E"]], 0.42, 0.32, 0.75)}
            <path d="M60 46C80 46 88 58 88 72C88 88 78 98 60 98C42 98 32 88 32 72C32 58 40 46 60 46Z" fill="url(#france-coco-h)" ${O}/>
            <path d="M40 54Q35 62 37 70M80 54Q85 62 83 70M38 86Q48 93 60 93Q72 93 82 86" fill="none" stroke="#B0682A" stroke-width="2" stroke-linecap="round" opacity=".7"/>
            <path d="M44 52Q50 48 58 48" fill="none" stroke="#FFF4D6" stroke-width="3" stroke-linecap="round"/><circle cx="40" cy="60" r="1.6" fill="#FFF4D6"/>
            ${[[46, 95], [56, 96.6], [68, 96], [75, 92]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.4" ry=".8" fill="#A85E22" opacity=".55"/>`).join("")}`,
          top: {svg: `${LG("france-coco-b", [[0, "#D85A54"], [1, "#A8343A"]])}
            <path d="M42 45Q42 34 58 33Q76 32 80 41Q80 46 62 47Q46 48 42 45Z" fill="url(#france-coco-b)" ${O}/>
            <path d="M59 33Q59 28 62 27" fill="none" stroke="${INK}" stroke-width="4.4" stroke-linecap="round"/><path d="M59 33Q59 28 62 27" fill="none" stroke="#A8343A" stroke-width="2" stroke-linecap="round"/>
            <path d="M48 38Q54 35 62 35" fill="none" stroke="#F49A90" stroke-width="2" stroke-linecap="round"/>`, pivot: [60, 48]}
        },
        eyes: {lx: 51, rx: 69, y: 70, r: 4.2, style: "sparkle", color: "#3A2010"},
        mouth: {x: 60, y: 79, w: 3, color: "#3A2010"},
        cheeks: {lx: 48, rx: 72, y: 77, w: 3.4, h: 2.2, color: "#FF8A70"},
        anchors: {top: [61, 40, 0.9], neck: [60, 98, 1], chest: [74, 92, 0.6], back: [88, 66, 0.8], hands: [60, 100, 0.84]},
        lines: {
          tap: ["Bonjour! Fresh from the oven, just for you!", "Flaky on the outside, focused on the inside!", "Fold by fold, your notes get better!", "You're rising beautifully, like good dough!", "A little butter, a lot of effort. Bravo!", "Ooh la la, look at you study!", "Golden ideas, warm and crisp!", "One more page, then a cafe au lait?"],
          pet: ["Hehe! Careful, I leave crumbs!", "Aww, warm and toasty now!"],
          hello: ["Bonjour! The bakery opened just for you!", "You're back! Still warm and ready!"],
          morning: ["Bonjour! Breakfast and books, perfect!", "Good morning! I'm freshly baked!"],
          night: ["Bonne nuit! Even croissants need rest.", "Late night? A short one, then sleep, okay?"],
          focus: ["Sitting golden and quiet beside you.", "Layer by layer. You've got this!"],
          done: ["Magnifique session! So proud of you!", "All done! Perfectly baked!"],
          task: ["Done! Flaky and fabulous!", "Checked off! Bravo!", "Another one, golden brown!", "Yes! Fresh from your oven!"],
          break: ["Pastry break! Stretch and sip something!", "Step away for a little stroll, then back!"]
        }
      },
      {
        id: "france-bijou", name: "Bijou", kind: "Poodle Pup", pose: "sit", wearColor: "#F2A8C0",
        bio: "A fluffy poodle pup with pom-poms and very tidy study habits.",
        idle: ["tailSwish", "earTwitch", "headTilt"], cheer: "hop",
        neck: [60, 78],
        parts: {
          tail: {svg: `${LINE("M84 100Q92 96 94 88", "#F4ECF2", 3)}<path d="${puff(96, 84, 6.4, 8, 1.25)}" fill="#FFFFFF" ${O}/><path d="M93 81Q95 79 98 80" fill="none" stroke="#F2A8C0" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [84, 100]},
          feet: `<path d="${puff(46, 106, 6.4, 7, 1.2)}" fill="#FFFFFF" ${O}/><path d="${puff(74, 106, 6.4, 7, 1.2)}" fill="#FFFFFF" ${O}/>`,
          body: `${LG("france-bijou-b", [[0, "#FFFFFF"], [1, "#EEE2EC"]])}
            <path d="M60 74C78 74 86 86 86 97C86 106 78 110 60 110C42 110 34 106 34 97C34 86 42 74 60 74Z" fill="url(#france-bijou-b)" ${O}/>
            <path d="M44 90Q47 86 51 89M68 92Q72 88 76 91M54 100Q58 97 62 100" fill="none" stroke="#DCCADA" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M44 80Q60 88 76 80" fill="none" stroke="${INK}" stroke-width="6.4" stroke-linecap="round"/><path d="M44 80Q60 88 76 80" fill="none" stroke="#F2A8C0" stroke-width="3.6" stroke-linecap="round"/>
            <circle cx="60" cy="88" r="3.6" fill="#F6C85A" ${OW(1.6)}/><circle cx="59" cy="87" r="1" fill="#FFF4C8"/>`,
          earL: {svg: `${LG("france-bijou-e", [[0, "#FFFFFF"], [1, "#EADCE8"]])}<path d="${puff(34, 66, 10, 9, 1.22)}" fill="url(#france-bijou-e)" ${O}/><path d="M30 62Q33 60 36 62M30 70Q33 68 37 70" fill="none" stroke="#DCCADA" stroke-width="1.5" stroke-linecap="round"/>`, pivot: [42, 52]},
          earR: {svg: `<path d="${puff(86, 66, 10, 9, 1.22)}" fill="url(#france-bijou-e)" ${O}/><path d="M84 62Q87 60 90 62M83 70Q87 68 90 70" fill="none" stroke="#DCCADA" stroke-width="1.5" stroke-linecap="round"/>`, pivot: [78, 52]},
          head: `${RG("france-bijou-h", [[0, "#FFFFFF"], [0.75, "#FBF5FA"], [1, "#E8DAE6"]], 0.42, 0.32, 0.8)}
            <path d="M60 38C76 38 84 48 84 60C84 72 74 80 60 80C46 80 36 72 36 60C36 48 44 38 60 38Z" fill="url(#france-bijou-h)" ${O}/>
            <ellipse cx="60" cy="70" rx="11" ry="7.6" fill="#FFFFFF" ${OW(1.8)}/>
            <path d="M42 50Q46 44 52 42" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
          face: `<ellipse cx="60" cy="66.6" rx="3.4" ry="2.4" fill="#3A2A34"/><ellipse cx="59" cy="65.8" rx="1.1" ry=".6" fill="#fff" opacity=".8"/>`,
          top: {svg: `<path d="${puff(60, 34, 11, 10, 1.22)}" fill="#FFFFFF" ${O}/><path d="M55 31Q58 28 62 30" fill="none" stroke="#DCCADA" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M66 40L76 34L76 46Z" fill="#F2A8C0" ${O2}/><path d="M66 40L56 34L56 46Z" fill="#F2A8C0" ${O2}/><circle cx="66" cy="40" r="3" fill="#E87EA2" ${OW(1.8)}/>`, pivot: [60, 42]}
        },
        eyes: {lx: 50, rx: 70, y: 57, r: 4.4, style: "round", color: "#2E2230"},
        mouth: {x: 60, y: 72, w: 2.6, color: "#2E2230", style: "cat"},
        cheeks: {lx: 43, rx: 77, y: 65, w: 4, h: 2.4, color: "#FFA6BE"},
        anchors: {top: [60, 38, 0.9], neck: [60, 80, 1], chest: [72, 96, 0.6], back: [84, 88, 0.8], hands: [60, 100, 0.84]},
        lines: {
          tap: ["Bonjour! I fluffed my pom-poms for you!", "Neat notes, tidy desk, happy pup!", "Woof! Study time is my favorite time!", "You're doing it with style, as always!", "Sit, stay, focus! Good human!", "A stroll by the Seine after this?", "My tail wags for every page you read!", "Impeccable work. I approve!"],
          pet: ["Hehe! Mind the pom-poms!", "Aww! Wag wag wag!"],
          hello: ["Woof! You're back! Bonjour!", "Hi hi! I saved you a spot!"],
          morning: ["Bonjour! Let's trot into a good day!", "Good morning! Brushed, fluffed, ready!"],
          night: ["Bonne nuit! Curl up and rest soon.", "The tower is sparkling. Bedtime soon?"],
          focus: ["Sitting nicely right beside you.", "Ears up, nose down. You've got this!"],
          done: ["Magnifique! Best in show!", "All done! A victory trot for you!"],
          task: ["Done! Good job!", "Checked off! Woof!", "Another one! Tail wags!", "Yes! Very chic!"],
          break: ["Walkies! A quick stretch outside!", "Water bowl break! Drink some too!"]
        }
      },
      {
        id: "france-mac", name: "Mac", kind: "Macaron", pose: "stand", wearColor: "#7AC8A8",
        bio: "A little pink macaron who brings a sweet bite of joy to study time.",
        idle: ["topBob", "sparkle", "bounce"], cheer: "spin",
        parts: {
          feet: `<ellipse cx="48" cy="106.6" rx="7" ry="4" fill="#E88AA6" ${O}/><ellipse cx="72" cy="106.6" rx="7" ry="4" fill="#E88AA6" ${O}/>`,
          armL: {svg: `<ellipse cx="24" cy="82" rx="5" ry="6.6" transform="rotate(28 24 82)" fill="#F7B8CA" ${O}/>`, pivot: [30, 80]},
          armR: {svg: `<ellipse cx="96" cy="82" rx="5" ry="6.6" transform="rotate(-28 96 82)" fill="#F7B8CA" ${O}/>`, pivot: [90, 80]},
          body: `${LG("france-mac-s", [[0, "#FFD8E4"], [0.6, "#F7AFC4"], [1, "#E88AA6"]])}${LG("france-mac-f", [[0, "#FFFDF6"], [1, "#F4E6D2"]])}
            <path d="M28 88Q28 82 36 82H84Q92 82 92 88Q92 102 60 103Q28 102 28 88Z" fill="url(#france-mac-s)" ${O}/>
            <path d="M31 86${Array.from({length: 13}, (_, i) => `Q${f1(33.5 + i * 4.6)} ${i % 2 ? 90 : 89} ${f1(35.8 + i * 4.6)} 87`).join("")}" fill="none" stroke="#D97898" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>
            <path d="M27 76Q27 72 32 72H88Q93 72 93 76V82Q93 86 88 86H32Q27 86 27 82Z" fill="url(#france-mac-f)" ${O}/>
            ${Array.from({length: 9}, (_, i) => `<circle cx="${32 + i * 7}" cy="${i % 2 ? 84.6 : 73.6}" r="1.6" fill="#F0DCC2"/>`).join("")}
            <path d="M60 30C84 30 94 44 94 60Q94 70 88 72H32Q26 70 26 60C26 44 36 30 60 30Z" fill="url(#france-mac-s)" ${O}/>
            <path d="M30 70${Array.from({length: 13}, (_, i) => `Q${f1(32.5 + i * 4.6)} ${i % 2 ? 66 : 67} ${f1(34.8 + i * 4.6)} 69`).join("")}" fill="none" stroke="#D97898" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>
            <path d="M36 46Q42 37 54 35" fill="none" stroke="#FFF2F6" stroke-width="3.4" stroke-linecap="round"/><circle cx="34" cy="53" r="1.8" fill="#FFF2F6"/>
            ${twinkle(100, 40, 3.4, "#FFE27A")}${twinkle(18, 60, 2.6, "#FFFFFF")}`,
          top: {svg: `${RG("france-mac-r", [[0, "#FF8AA6"], [1, "#C8304E"]], 0.4, 0.35, 0.7)}
            <path d="M54 22Q50 14 58 12Q62 18 58 24Z" fill="#7AC8A8" ${O2}/><path d="M64 22Q70 14 76 18Q72 24 64 24Z" fill="#7AC8A8" ${O2}/>
            <path d="${puff(61, 26, 6.6, 7, 1.25)}" fill="url(#france-mac-r)" ${O2}/>
            ${[[58, 24], [63, 23], [61, 28], [66, 27], [56, 28]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="#FFD0DA"/>`).join("")}`, pivot: [60, 31]}
        },
        eyes: {lx: 50, rx: 70, y: 56, r: 4.6, style: "sparkle", color: "#4A2030"},
        mouth: {x: 60, y: 64, w: 3, color: "#4A2030"},
        cheeks: {lx: 42, rx: 78, y: 62, w: 4, h: 2.4, color: "#FF7A9A"},
        anchors: {top: [60, 30, 0.9], neck: [60, 79, 1], chest: [72, 92, 0.6], back: [90, 56, 0.8], hands: [60, 98, 0.84]},
        lines: {
          tap: ["Bonjour! Sweet thoughts, crisp focus!", "Crunchy outside, soft heart, big cheers!", "You're the filling to my day!", "Pastel and proud of you!", "Tiny but mighty, just like your breaks!", "A raspberry on top of your hard work!", "Ooh la la, that's some sweet progress!", "Stack up the pages like a macaron tower!"],
          pet: ["Hehe! Don't squish my filling!", "Aww, sweeter than sugar!"],
          hello: ["You're back! Freshly piped and happy!", "Bonjour! I saved you the pink one!"],
          morning: ["Bonjour! A sweet start to the day!", "Good morning! Crisp and ready!"],
          night: ["Bonne nuit! Sweet dreams ahead.", "It's late! Let's wrap up soon, okay?"],
          focus: ["Sitting sweet and quiet beside you.", "Little bites of focus. Go go go!"],
          done: ["What a sweet session! Bravo!", "All done! A whole box of success!"],
          task: ["Done! Sweet!", "Checked off! Crunch!", "Another one! Pastel power!", "Yes! Tres bien!"],
          break: ["Treat break! You earned a little one!", "Stretch time! Wiggle your arms!"]
        }
      }
    ]
  });
})();
