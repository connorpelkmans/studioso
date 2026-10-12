/* Study Companions, Around the World: Iceland */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const f1 = v => Math.round(v * 10) / 10;
  // the puffin's bright striped bill, seen from the front; open: the lower half drops a little
  const bill = (open, tilt) => { const d = open ? 3.2 : 0, t = tilt || 0;
    return `<path d="M51.4 56Q60 ${f1(51.6 + t)} 68.6 56L66.6 60.6H53.4Z" fill="#7C8A9A" ${OW(1.8)}/>
      <path d="M53.4 60.6H66.6L64 ${f1(68 + d * 0.4)}Q60 ${f1(71 + d * 0.3)} 56 ${f1(68 + d * 0.4)}Z" fill="#EE5A2A" ${OW(1.8)}/>
      <path d="M54.8 63.2H65.2" stroke="#F8D04A" stroke-width="1.8" stroke-linecap="round"/><path d="M56.4 66H63.6" stroke="#F6A040" stroke-width="1.4" stroke-linecap="round"/>
      ${open ? `<path d="M56.6 ${f1(69.4 + d * 0.3)}Q60 ${f1(68 + d)} 63.4 ${f1(69.4 + d * 0.3)}Q60 ${f1(74 + d)} 56.6 ${f1(69.4 + d * 0.3)}Z" fill="#E0542A" ${OW(1.6)}/>` : ""}
      <path d="M53.4 56.6Q52 59 54 59.6" fill="none" stroke="#F2A84A" stroke-width="1.4" stroke-linecap="round"/><path d="M66.6 56.6Q68 59 66 59.6" fill="none" stroke="#F2A84A" stroke-width="1.4" stroke-linecap="round"/>`; };

  COMP_DATA.push({
    theme: "iceland",
    companions: [
      {
        id: "iceland-lundi", name: "Lundi", kind: "Puffin", pose: "stand", wearColor: "#F2742A",
        bio: "Bright beak, tiny wings, enormous determination.",
        idle: ["waddle", "headTilt", "wingFlutter"], cheer: "wingFlutter",
        neck: [60, 72],
        parts: {
          feet: `<path d="M41 111L46.4 101.6L52 111Q46.4 109 41 111Z" fill="#F2742A" ${O2}/><path d="M68 111L73.6 101.6L79 111Q73.6 109 68 111Z" fill="#F2742A" ${O2}/>`,
          wingL: {svg: `${LG("iceland-lundi-w", [[0, "#3A3846"], [1, "#22202A"]])}<path d="M39 76C27 82 24 96 29.4 106C38 100 42 89 41 77Z" fill="url(#iceland-lundi-w)" ${O}/><path d="M33 88Q31 95 31.4 100" fill="none" stroke="#4E4C5A" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [40, 78]},
          wingR: {svg: `<path d="M81 76C93 82 96 96 90.6 106C82 100 78 89 79 77Z" fill="url(#iceland-lundi-w)" ${O}/><path d="M87 88Q89 95 88.6 100" fill="none" stroke="#4E4C5A" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [80, 78]},
          body: `${RG("iceland-lundi-b", [[0, "#5A5664"], [0.6, "#34313E"], [1, "#1E1C26"]], 0.4, 0.3, 0.8)}${LG("iceland-lundi-y", [[0, "#FFFFFF"], [1, "#E4E6EE"]])}
            <path d="M60 66C76 66 84 80 84 92C84 104 74 110 60 110C46 110 36 104 36 92C36 80 44 66 60 66Z" fill="url(#iceland-lundi-b)" ${O}/>
            <path d="M60 74C71 74 76 84 76 93C76 102 69 108 60 108C51 108 44 102 44 93C44 84 49 74 60 74Z" fill="url(#iceland-lundi-y)"/>
            <path d="M50 86q2 -2 4 0M58 84q2 -2 4 0M66 86q2 -2 4 0M54 94q2 -2 4 0M62 94q2 -2 4 0" fill="none" stroke="#D2D4DE" stroke-width="1.5" stroke-linecap="round"/>`,
          head: `${RG("iceland-lundi-h", [[0, "#5A5664"], [0.6, "#34313E"], [1, "#1E1C26"]], 0.4, 0.28, 0.8)}
            <path d="M60 27C75 27 83 37 83 50C83 63 74 72 60 72C46 72 37 63 37 50C37 37 45 27 60 27Z" fill="url(#iceland-lundi-h)" ${O}/><path d="M45 36Q50 31 57 30" fill="none" stroke="#6E6A7A" stroke-width="2.4" stroke-linecap="round"/>`,
          face: `<path d="M60 40C72 40 78 47 77 55C76 63 69 67 60 67C51 67 44 63 43 55C42 47 48 40 60 40Z" fill="#F7F5F2"/>
            <path d="M47.6 46.4L53 47.6L49 44Z" fill="#8E8A96"/><path d="M72.4 46.4L67 47.6L71 44Z" fill="#8E8A96"/>
            <path d="M44 56Q45 62 50 64.6" fill="none" stroke="#DCD8E2" stroke-width="1.6" stroke-linecap="round"/><path d="M76 56Q75 62 70 64.6" fill="none" stroke="#DCD8E2" stroke-width="1.6" stroke-linecap="round"/>`
        },
        eyes: {lx: 51, rx: 69, y: 50.5, r: 3.6, style: "dot", color: "#1A1820"},
        mouth: {x: 60, y: 62, w: 3},
        mouths: {neutral: bill(false), smile: bill(false, -0.8) + `<path d="M49.4 59.6q1.8 2 4 1.2M70.6 59.6q-1.8 2 -4 1.2" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`, open: bill(true), sleepy: bill(false, 0.8)},
        cheeks: {lx: 46.6, rx: 73.4, y: 57.6, w: 3.4, h: 2.2, color: "#FF9A8A"},
        anchors: {top: [60, 28, 0.9], neck: [60, 72, 1], chest: [70, 96, 0.62], back: [84, 86, 0.8], hands: [60, 98, 0.85]},
        lines: {
          tap: ["Hi! I flew in from the sea cliffs to cheer you on!", "Tiny wings, huge effort. That's us!", "Flap flap! You're doing brilliantly!", "My beak is extra bright for you today!", "One more page, one more wingbeat!", "Waddle on, study buddy!", "You're braver than a puffin in a gale!", "Every flap gets us higher. Keep going!"],
          pet: ["Hehe! My feathers are all fluffed up!", "Ooh, right on the head! Again!"],
          hello: ["You're back! I saved you a spot on the cliff!", "Hi hi! Ready to fly through some work?"],
          morning: ["Good morning! The sea is sparkling for you!", "Morning! Fresh fish, fresh start!"],
          night: ["The sun is low. Time to tuck into the burrow?", "Goodnight! Dream of quiet green cliffs."],
          focus: ["Wings folded, eyes on the goal.", "Quiet puffin mode. You've got this!"],
          done: ["What a session! You flew right through it!", "All done! Proud flappy dance!"],
          task: ["Done! Flap flap!", "Checked off! Beak up high!", "Another one! Fish for everyone!", "Yes! You soared through that!"],
          break: ["Break! Stretch your wings! I mean arms!", "Look out at the horizon for a bit!"]
        }
      },
      {
        id: "iceland-skjoni", name: "Skjoni", kind: "Icelandic Foal", pose: "stand", wearColor: "#5AA0C8",
        bio: "Shaggy mane, five gaits, and one of them is 'studying'.",
        idle: ["tailSwish", "earTwitch", "headTilt"], cheer: "hop",
        neck: [60, 60],
        parts: {
          tail: {svg: `${LG("iceland-skjoni-t", [[0, "#FFF2D4"], [1, "#E2C690"]])}<path d="M39 72C30 74 26 84 27 96C28 102 31 106 34 106C33 98 36 92 37 86C39 82 41 78 41 74Z" fill="url(#iceland-skjoni-t)" ${O}/><path d="M33 84Q31 92 32 100" fill="none" stroke="#D2B47A" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [40, 74]},
          feet: `${["M46 88V107", "M54 90V108", "M66 90V108", "M74 88V107"].map(d => `<path d="${d}" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="${d}" stroke="#C47A44" stroke-width="5.4" stroke-linecap="round"/>`).join("")}<g fill="#4A3428" ${OW(1.6)}><rect x="42.2" y="105" width="7.6" height="5.6" rx="2"/><rect x="50.2" y="106" width="7.6" height="5.6" rx="2"/><rect x="62.2" y="106" width="7.6" height="5.6" rx="2"/><rect x="70.2" y="105" width="7.6" height="5.6" rx="2"/></g>`,
          body: `${LG("iceland-skjoni-b", [[0, "#D88E54"], [1, "#B0643A"]])}${LG("iceland-skjoni-m", [[0, "#FFF4DA"], [1, "#E6CC98"]])}
            <path d="M45 50C40 56 38 64 40 72C43 68 44 64 46 62C46 68 47 72 50 76C52 68 52 60 54 54Z" fill="url(#iceland-skjoni-m)" ${O2}/>
            <path d="M75 50C80 56 82 64 80 72C77 68 76 64 74 62C74 68 73 72 70 76C68 68 68 60 66 54Z" fill="url(#iceland-skjoni-m)" ${O2}/>
            <path d="M60 60C75 60 83 70 83 81C83 91 75 95 60 95C45 95 37 91 37 81C37 70 45 60 60 60Z" fill="url(#iceland-skjoni-b)" ${O}/>
            <path d="M45 74Q48 67 56 65" fill="none" stroke="#E8A672" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M54 92Q60 88 66 92" fill="none" stroke="#9A5430" stroke-width="1.8" stroke-linecap="round" opacity=".6"/>`,
          earL: {svg: `<path d="M44 34C41 26 42 18 46 15C50 19 52 26 51 32Z" fill="#C47A44" ${O2}/><path d="M45.6 30C44 25 44.6 21 46.4 19C48.2 22 49 26 48.6 29Z" fill="#F2B8A0"/>`, pivot: [48, 33]},
          earR: {svg: `<path d="M76 34C79 26 78 18 74 15C70 19 68 26 69 32Z" fill="#C47A44" ${O2}/><path d="M74.4 30C76 25 75.4 21 73.6 19C71.8 22 71 26 71.4 29Z" fill="#F2B8A0"/>`, pivot: [72, 33]},
          head: `${RG("iceland-skjoni-h", [[0, "#E8A86E"], [0.65, "#CC8048"], [1, "#B0643A"]], 0.42, 0.3, 0.8)}
            <path d="M60 24C72 24 78 32 78 42C78 52 74 58 72 62C70 66 66 68 60 68C54 68 50 66 48 62C46 58 42 52 42 42C42 32 48 24 60 24Z" fill="url(#iceland-skjoni-h)" ${O}/>
            <ellipse cx="60" cy="60" rx="12" ry="8.4" fill="#F0CDA8" ${OW(2)}/>
            <ellipse cx="55.4" cy="60" rx="1.5" ry="2" fill="#6A4030"/><ellipse cx="64.6" cy="60" rx="1.5" ry="2" fill="#6A4030"/>
            <path d="M60 30L57.4 36L60 40.4L62.6 36Z" fill="#FFF6E4"/>
            <path d="M47 28C50 20 58 17 64 20C70 18 74 24 72 30C68 27 66 32 61 30C58 34 54 29 50 33C49 31 48 30 47 28Z" fill="url(#iceland-skjoni-m)" ${O2}/>`
        },
        eyes: {lx: 51, rx: 69, y: 45, r: 3.8, style: "dot", color: "#2B1A10"},
        mouth: {x: 60, y: 64.6, w: 2.4, color: "#4A2A1A"},
        cheeks: {lx: 45.6, rx: 74.4, y: 51, w: 3.4, h: 2.2, color: "#FF9A88"},
        anchors: {top: [60, 22, 0.85], neck: [60, 64, 0.85], chest: [66, 84, 0.58], back: [76, 72, 0.74], hands: [60, 90, 0.8]},
        lines: {
          tap: ["Hi! I trotted all the way here for you!", "Smooth and steady, like a good tolt!", "You're galloping through this list!", "Shake out that mane and keep going!", "My hooves are tapping a happy beat!", "Small and shaggy, big and brave!", "One step, one stride, one page at a time!", "The wind is in my mane and you're on a roll!"],
          pet: ["Hehe! Right behind the ears, yes!", "Neigh! That tickles my forelock!"],
          hello: ["You're back! I did a happy little prance!", "Hi! I saved you the sunniest patch of grass!"],
          morning: ["Good morning! The meadow is all dewy!", "Morning! Let's trot into the day!"],
          night: ["The horses are huddling up. Rest soon?", "Goodnight! Sleep warm, like a shaggy foal."],
          focus: ["Grazing quietly beside you.", "Steady pace. You've got this!"],
          done: ["What a ride! That session was a gallop!", "All done! Victory lap around the meadow!"],
          task: ["Done! Clip clop!", "Checked off! Mane toss!", "Another one! Hooves up!", "Yes! Full gallop!"],
          break: ["Break! Stretch your legs like a foal!", "Go get a snack. I'll munch some grass!"]
        }
      },
      {
        id: "iceland-snaer", name: "Snaer", kind: "Arctic Fox Kit", pose: "sit", sleepy: true, wearColor: "#7A9AD8",
        bio: "Fluffy as a snowdrift and twice as quiet.",
        idle: ["tailSwish", "earTwitch", "headTilt"], cheer: "bounce",
        neck: [60, 74],
        parts: {
          tail: {svg: `${LG("iceland-snaer-t", [[0, "#FFFFFF"], [1, "#DCE6F2"]], 0, 0, 1, 1)}<path d="M74 106C86 112 104 106 108 90C111 78 104 64 94 64C86 64 84 72 88 78C92 84 94 92 88 96C84 99 78 98 74 97Z" fill="url(#iceland-snaer-t)" ${O}/><path d="M98 72Q104 80 102 92M92 100Q98 98 101 94" fill="none" stroke="#C8D4E4" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [78, 100]},
          feet: `<ellipse cx="47" cy="108" rx="9" ry="4.6" fill="#F4F8FC" ${O}/><ellipse cx="73" cy="108" rx="9" ry="4.6" fill="#F4F8FC" ${O}/><path d="M44 108v-2.4M48 108.4v-2.6M70 108v-2.4M74 108.4v-2.6" stroke="#BCC8D8" stroke-width="1.2" stroke-linecap="round"/>`,
          body: `${RG("iceland-snaer-b", [[0, "#FFFFFF"], [0.7, "#F2F6FA"], [1, "#D6E0EC"]], 0.45, 0.35, 0.75)}
            <path d="M60 70C76 70 84 84 84 96C84 106 76 110.5 60 110.5C44 110.5 36 106 36 96C36 84 44 70 60 70Z" fill="url(#iceland-snaer-b)" ${O}/>
            <path d="M50 78Q60 84 70 78" fill="none" stroke="#DCE4EE" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M44 88Q42 96 46 102M76 88Q78 96 74 102" fill="none" stroke="#DCE4EE" stroke-width="2" stroke-linecap="round"/>`,
          armL: {svg: `<path d="M49 86Q45 94 46 102Q49 105 53 103Q54 96 53.6 88Z" fill="#F6F9FC" ${O}/><path d="M47.6 102.4l.4 -1.8M50.6 103l.2 -1.9" stroke="#BCC8D8" stroke-width="1.2" stroke-linecap="round"/>`, pivot: [51, 88]},
          armR: {svg: `<path d="M71 86Q75 94 74 102Q71 105 67 103Q66 96 66.4 88Z" fill="#F6F9FC" ${O}/><path d="M72.4 102.4l-.4 -1.8M69.4 103l-.2 -1.9" stroke="#BCC8D8" stroke-width="1.2" stroke-linecap="round"/>`, pivot: [69, 88]},
          earL: {svg: `<path d="M39 46C36 38 38 30 44 28C50 29 53 36 52 42Z" fill="#FFFFFF" ${O}/><path d="M42 42C41 37 42 33 45 32C48 33 49.6 37 49 40Z" fill="#F6C6D2"/>`, pivot: [46, 43]},
          earR: {svg: `<path d="M81 46C84 38 82 30 76 28C70 29 67 36 68 42Z" fill="#FFFFFF" ${O}/><path d="M78 42C79 37 78 33 75 32C72 33 70.4 37 71 40Z" fill="#F6C6D2"/>`, pivot: [74, 43]},
          head: `${RG("iceland-snaer-h", [[0, "#FFFFFF"], [0.7, "#F6F9FC"], [1, "#DAE3EE"]], 0.42, 0.3, 0.8)}
            <path d="M60 37C73 37 82 44 84 53C88 56 90 60 86 63C88 67 84 70 80 70C80 74 76 76 72 75C68 79 52 79 48 75C44 76 40 74 40 70C36 70 32 67 34 63C30 60 32 56 36 53C38 44 47 37 60 37Z" fill="url(#iceland-snaer-h)" ${O}/>
            <path d="M54.6 58Q57 64 60 67Q63 64 65.4 58" fill="none" stroke="#C8D4E4" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M42 50Q46 42 54 40" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/>
            <path d="M40 64Q44 68 48 66M80 64Q76 68 72 66" fill="none" stroke="#D2DCE8" stroke-width="1.6" stroke-linecap="round"/>`,
          face: `<path d="M56.6 63.2Q60 61.6 63.4 63.2Q62.6 66.4 60 67Q57.4 66.4 56.6 63.2Z" fill="#2E2A36" ${OW(1)}/><ellipse cx="58.8" cy="63.4" rx="1" ry=".6" fill="#fff" opacity=".7"/>`
        },
        eyes: {lx: 50, rx: 70, y: 56, r: 4.2, style: "sparkle", color: "#1E2A3A"},
        mouth: {x: 60, y: 69.6, w: 2.8, color: "#2E2A36", style: "cat"},
        cheeks: {lx: 44, rx: 76, y: 63, w: 3.8, h: 2.3, color: "#FFB0C2"},
        anchors: {top: [60, 36, 0.92], neck: [60, 77, 1], chest: [70, 94, 0.6], back: [84, 86, 0.8], hands: [60, 100, 0.85]},
        lines: {
          tap: ["Hi... I tiptoed over so I wouldn't disturb you.", "Soft paws, sharp mind. That's you!", "You're doing wonderfully. Truly.", "I'm curled up here, cheering very quietly.", "Snow is quiet, and so is real focus.", "Little steps in fresh snow still count!", "Fluffy tail wag, just for you!", "You make hard things look gentle."],
          pet: ["Oh! So soft. Hehe.", "Mmm, cozier than a snowdrift."],
          hello: ["Oh, you're back! My tail is wagging!", "Hello... I kept your seat warm."],
          morning: ["Good morning. The frost is sparkly today.", "Morning! Let's pad out into the day."],
          night: ["The aurora is out. Time to curl up soon?", "Goodnight. Tuck your nose in your tail."],
          focus: ["Curled up quietly right beside you.", "Shh. Deep focus, soft as snow."],
          done: ["That was lovely. So proud of you!", "All done! A happy little pounce!"],
          task: ["Done! Pounce!", "Checked off! Tail swish!", "Another one, soft and sure!", "Yes! Snowflake sparkle!"],
          break: ["Stretch like a fox in the sun!", "Rest your eyes. I'll keep watch."]
        }
      }
    ]
  });
})();
