/* Study Companions, new theme ideas batch n10: icecave. Each theme has one nature-object companion and two young animals. */
(() => {
  const {INK, O, OW, LG, RG} = COMP_KIT;
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
        id: "icecave-frost", name: "Frost", kind: "Arctic Fox Kit", pose: "sit", wearColor: "#2A9CC4",
        bio: "Curls up in its own tail when it's cold. Perks right up for you.",
        idle: ["earTwitch", "tailSwish", "headTilt"], cheer: "hop",
        neck: [60, 74],
        parts: {
          tail: {svg: `${RG("icecave-frost-t", [[0, "#FFFFFF"], [0.6, "#EEF3FA"], [1, "#C4D2E6"]], 0.4, 0.4, 0.8)}
            <path d="M74 106C88 108 101 99 103 84C104 73 99 65 92 64C87 70 90 79 86 87C83 93 78 95 72 95Z" fill="url(#icecave-frost-t)" ${O}/>
            <path d="M94 74q-2 4 0 8M98 86q-3 3 -2 7" fill="none" stroke="#B4C6DE" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [76, 101]},
          feet: `<ellipse cx="46" cy="108" rx="8.6" ry="4.6" fill="#F4F7FC" ${O}/><ellipse cx="74" cy="108" rx="8.6" ry="4.6" fill="#F4F7FC" ${O}/>
            <path d="M43 109.6v-2.4M47 110.2v-2.4M73 110.2v-2.4M77 109.6v-2.4" stroke="#B4C6DE" stroke-width="1.4" stroke-linecap="round"/>`,
          body: `${RG("icecave-frost-b", [[0, "#FFFFFF"], [0.6, "#EEF3FA"], [1, "#C4D2E6"]], 0.42, 0.3, 0.8)}
            <path d="M40 101C36 90 40 78 50 74H70C80 78 84 90 80 101C78 106 70 107 60 107C50 107 42 106 40 101Z" fill="url(#icecave-frost-b)" ${O}/>
            <path d="M50 78L54 87L57 81L60 90L63 81L66 87L70 78Z" fill="#FFFFFF"/>`,
          armL: {svg: `<ellipse cx="42.6" cy="92" rx="5.6" ry="9" transform="rotate(18 42.6 92)" fill="#EEF3FA" ${O}/><path d="M38.4 98.4l-.6 1.8M41.4 99.4l-.4 1.8" stroke="#A8BCD8" stroke-width="1.3" stroke-linecap="round"/>`, pivot: [46, 83]},
          armR: {svg: `<ellipse cx="77.4" cy="92" rx="5.6" ry="9" transform="rotate(-18 77.4 92)" fill="#EEF3FA" ${O}/><path d="M81.6 98.4l.6 1.8M78.6 99.4l.4 1.8" stroke="#A8BCD8" stroke-width="1.3" stroke-linecap="round"/>`, pivot: [74, 83]},
          earL: {svg: `<path d="M38 46C33 36 33 27 36 22C43 23 50 29 54 37Z" fill="#F4F7FC" ${O}/><path d="M39.6 40C37.4 34 37.4 29.4 38.6 26.4C42 27.6 46 31 48.4 35Z" fill="#F7B8C4"/>`, pivot: [45, 40]},
          earR: {svg: `<path d="M82 46C87 36 87 27 84 22C77 23 70 29 66 37Z" fill="#F4F7FC" ${O}/><path d="M80.4 40C82.6 34 82.6 29.4 81.4 26.4C78 27.6 74 31 71.6 35Z" fill="#F7B8C4"/>`, pivot: [75, 40]},
          head: `${RG("icecave-frost-h", [[0, "#FFFFFF"], [0.6, "#F0F4FA"], [1, "#C8D4E8"]], 0.42, 0.3, 0.8)}
            <path d="M60 32C75 32 86 41 86 53L92 58L85 62L89 68L79 69C74 74 67 76 60 76C53 76 46 74 41 69L31 68L35 62L28 58L34 53C34 41 45 32 60 32Z" fill="url(#icecave-frost-h)" ${O}/>
            <ellipse cx="60" cy="63.4" rx="9.6" ry="6.8" fill="#FFFFFF" ${OW(1.8)}/>
            <path d="M56.6 58.8Q60 57.6 63.4 58.8Q62.6 62 60 62.4Q57.4 62 56.6 58.8Z" fill="${INK}"/><circle cx="58.8" cy="59" r=".8" fill="#fff"/>
            <path d="M44 40q4-3 8-2" fill="none" stroke="#C8D4E8" stroke-width="1.6" stroke-linecap="round"/>${shine(45, 43, 4, 2, -35)}`
        },
        eyes: {lx: 49, rx: 71, y: 51.4, r: 4.4, style: "sparkle", color: "#22304A"},
        mouth: {x: 60, y: 65.6, w: 2.2, style: "cat", color: "#22304A"},
        cheeks: {lx: 42, rx: 78, y: 60, w: 4, h: 2.4, color: "#FF9AB4"},
        anchors: {top: [60, 33, 0.85], neck: [60, 76, 1], chest: [68, 90, 0.6], back: [80, 84, 0.8], hands: [60, 98, 0.85]},
        lines: {
          tap: ["Hi! My ears heard you coming a mile away.", "Cold outside, cozy in here. Let's study!", "You're doing great. My tail is all fluffed up!", "Pounce on that next task!", "Quick paws, sharp mind. That's us!", "Even in a blizzard, you keep going. Wow.", "I'll keep your toes warm while you work."],
          pet: ["Hehe! So fluffy, right?", "Mmm, right behind the ears!"],
          hello: ["You're back! I trotted all the way here!", "Hi! I kept a warm spot by the ice for you."],
          morning: ["Good morning! Fresh snow, fresh paw prints!"],
          night: ["The aurora's out. Curl up and rest soon."],
          focus: ["Curled up quietly right beside you.", "Ears up, eyes on the goal. Go!"],
          done: ["What a session! Happy fox hop!", "All done! You were so quick!"],
          task: ["Pounce! Another one done!", "Got it! Checked off!", "Swish! Nicely done!"],
          break: ["Break time! Stretch like a fox in the sun."]
        }
      },
      {
        id: "icecave-hopper", name: "Hopper", kind: "Snowshoe Hare Leveret", pose: "sit", wearColor: "#5A8AD0",
        bio: "Its big white feet work like snowshoes. Never sinks, never quits.",
        idle: ["earTwitch", "wave", "headTilt"], cheer: "hop",
        neck: [60, 74],
        parts: {
          tail: {svg: `<circle cx="85" cy="99" r="6.6" fill="#FFFFFF" ${O}/>`, pivot: [80, 100]},
          body: `${RG("icecave-hopper-b", [[0, "#ECCEA6"], [0.6, "#CDA072"], [1, "#A47C52"]], 0.42, 0.3, 0.8)}
            <path d="M40 102C37 88 42 72 60 72C78 72 83 88 80 102C78 108 70 109.4 60 109.4C50 109.4 42 108 40 102Z" fill="url(#icecave-hopper-b)" ${O}/>
            <ellipse cx="60" cy="93" rx="12" ry="12.6" fill="#FFF8EE"/>
            <ellipse cx="44" cy="107.6" rx="13" ry="5.4" fill="#FAFBFD" ${O}/><ellipse cx="76" cy="107.6" rx="13" ry="5.4" fill="#FAFBFD" ${O}/>
            <path d="M36 109.6v-2.4M40 110.6v-2.4M44 110.8v-2.4M76 110.8v-2.4M80 110.6v-2.4M84 109.6v-2.4" stroke="#B8C4D6" stroke-width="1.4" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="43.4" cy="89" rx="5" ry="8.6" transform="rotate(16 43.4 89)" fill="#CDA072" ${O}/><ellipse cx="41.4" cy="95.4" rx="3.8" ry="3" transform="rotate(16 41.4 95.4)" fill="#FAFBFD" ${OW(1.8)}/>`, pivot: [46, 80]},
          armR: {svg: `<ellipse cx="76.6" cy="89" rx="5" ry="8.6" transform="rotate(-16 76.6 89)" fill="#CDA072" ${O}/><ellipse cx="78.6" cy="95.4" rx="3.8" ry="3" transform="rotate(-16 78.6 95.4)" fill="#FAFBFD" ${OW(1.8)}/>`, pivot: [74, 80]},
          earL: {svg: `<path d="M51 38C44 30 40 18 42 10C44 4 51 5 53 13C55 21 56 30 55 38Z" fill="#D4AA7A" ${O}/><path d="M52.4 32C48.6 26 46.6 19 47.4 14.4C49 12 51.2 13 52 16.4C53.2 22 53.8 27 53.2 32Z" fill="#F7C0C4"/><path d="M42.4 11.4C43.6 5.6 50.4 4.6 52.6 11.6C49.2 10.4 45.6 10.4 42.4 11.4Z" fill="#5A4234"/>`, pivot: [53, 37]},
          earR: {svg: `<path d="M69 38C76 30 80 18 78 10C76 4 69 5 67 13C65 21 64 30 65 38Z" fill="#D4AA7A" ${O}/><path d="M67.6 32C71.4 26 73.4 19 72.6 14.4C71 12 68.8 13 68 16.4C66.8 22 66.2 27 66.8 32Z" fill="#F7C0C4"/><path d="M77.6 11.4C76.4 5.6 69.6 4.6 67.4 11.6C70.8 10.4 74.4 10.4 77.6 11.4Z" fill="#5A4234"/>`, pivot: [67, 37]},
          head: `${RG("icecave-hopper-h", [[0, "#F2D6B0"], [0.6, "#D4AA7A"], [1, "#AC8458"]], 0.42, 0.3, 0.8)}
            <ellipse cx="60" cy="53" rx="22" ry="19" fill="url(#icecave-hopper-h)" ${O}/>
            <path d="M48 61C48 55 54 53 60 55C66 53 72 55 72 61C72 67 66 70.6 60 70.6C54 70.6 48 67 48 61Z" fill="#FFF8EE"/>
            <path d="M57.6 58.4Q60 57.4 62.4 58.4Q61.6 60.6 60 61Q58.4 60.6 57.6 58.4Z" fill="#E87A8A" ${OW(1.2)}/>
            <path d="M47 62.6l-6 -1M47 65l-5.6 1.4M73 62.6l6 -1M73 65l5.6 1.4" stroke="#8A6A4A" stroke-width="1.2" stroke-linecap="round"/>${shine(46, 42, 4.4, 2.2, -35)}`
        },
        eyes: {lx: 50, rx: 70, y: 50, r: 4.4, style: "sparkle", color: "#2B1A10"},
        mouth: {x: 60, y: 63.6, w: 2, style: "cat", color: "#5A3A2A"},
        cheeks: {lx: 43, rx: 77, y: 58, w: 3.8, h: 2.3, color: "#FF9AA6"},
        anchors: {top: [60, 35, 0.85], neck: [60, 74, 0.95], chest: [68, 90, 0.6], back: [80, 84, 0.8], hands: [60, 96, 0.85]},
        lines: {
          tap: ["Hi! Did you see my feet? They're snowshoes!", "Hop, hop, hop. One task at a time.", "You never sink in deep snow. Or deep work!", "My ears are up. I'm all yours!", "You're doing great. I'm doing a happy thump.", "Quick hop to the next one? Let's go!", "Soft paws, big leaps. You've got this!"],
          pet: ["Hehe! Mind the ears!", "Ooh, my nose is twitching with joy!"],
          hello: ["You're back! I hopped right over!", "Hi! Fresh snow and fresh notes today."],
          morning: ["Good morning! I'm up and hopping!"],
          night: ["The aurora is glowing. Burrow in soon, okay?"],
          focus: ["Sitting very still right beside you.", "Ears up, focus on. You've got this."],
          done: ["What a session! Binky time!", "All done! You leapt right through it!"],
          task: ["Hop! Another one done!", "Thump thump! Checked off!", "Boing! Well done!"],
          break: ["Break time! Have a little hop and stretch."]
        }
      }
    ]
  });
})();
