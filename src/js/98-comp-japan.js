/* ===== module: 98-comp-japan.js ===== */
/* Study Companions, Around the World */
(() => {
  const {O, OW, LG, RG} = COMP_KIT;
  const f1 = v => Math.round(v * 10) / 10;
  const ring = (cx, cy, n, r, fn) => Array.from({length: n}, (_, i) => { const a = i / n * Math.PI * 2; return fn(f1(cx + Math.cos(a) * r), f1(cy + Math.sin(a) * r), a * 180 / Math.PI, i); }).join("");
  // a small five-petal cherry blossom
  const blossom = (x, y, r, c = "#FFC2D4", mid = "#E8507A") => `<g>${ring(x, y, 5, r * 0.55, (px, py, a) => `<ellipse cx="${px}" cy="${py}" rx="${f1(r * 0.5)}" ry="${f1(r * 0.38)}" transform="rotate(${f1(a)} ${px} ${py})" fill="${c}" ${OW(1)}/>`)}<circle cx="${x}" cy="${y}" r="${f1(r * 0.24)}" fill="${mid}"/></g>`;

  COMP_DATA.push({
    theme: "japan",
    companions: [
      {
        id: "japan-kuri", name: "Kuri", kind: "Shiba Inu Pup", pose: "sit", wearColor: "#D8402E",
        bio: "A smiley shiba pup with a curly tail who keeps watch on your deadlines.",
        idle: ["tailSwish", "earTwitch", "headTilt"], cheer: "hop",
        neck: [60, 76],
        parts: {
          tail: {svg: `<path d="M84 98C100 98 104 80 95 73C87 67 77 74 82 82C85 87 92 85 91 79" fill="none" stroke="#2B2233" stroke-width="13" stroke-linecap="round"/>
            <path d="M84 98C100 98 104 80 95 73C87 67 77 74 82 82C85 87 92 85 91 79" fill="none" stroke="#E39A4C" stroke-width="7.6" stroke-linecap="round"/>
            <path d="M86 95C96 94 99 82 94 77" fill="none" stroke="#FFF2DE" stroke-width="2.6" stroke-linecap="round"/>`, pivot: [82, 98]},
          feet: `<ellipse cx="36" cy="105" rx="11" ry="6.4" fill="#E39A4C" ${O}/><ellipse cx="84" cy="105" rx="11" ry="6.4" fill="#E39A4C" ${O}/>`,
          body: `${LG("japan-kuri-b", [[0, "#F2B060"], [1, "#D9853A"]])}
            <path d="M60 70C80 70 90 86 90 98C90 107 80 110.5 60 110.5C40 110.5 30 107 30 98C30 86 40 70 60 70Z" fill="url(#japan-kuri-b)" ${O}/>
            <path d="M60 76C70 76 74 88 72 100C70 108 50 108 48 100C46 88 50 76 60 76Z" fill="#FFF4E2"/>
            <path d="M44 74L76 74L64 88Q60 91 56 88Z" fill="#D8402E" ${OW(2.4)}/><circle cx="51" cy="78" r="1.6" fill="#FFF4E2"/><circle cx="68" cy="79" r="1.6" fill="#FFF4E2"/><circle cx="60" cy="84" r="1.4" fill="#FFF4E2"/>`,
          armL: {svg: `<path d="M44 84Q41 95 42 104Q46 109 52 105Q53 96 51 85Z" fill="#E8A052" ${O}/><path d="M42.6 101Q46 107 51.6 103.4L52 105Q46 109 42 104Z" fill="#FFF4E2"/><path d="M45.4 105.4v-2.2M48.6 105.6v-2.2" stroke="#B0723A" stroke-width="1.1" stroke-linecap="round"/>`, pivot: [47, 86]},
          armR: {svg: `<path d="M76 84Q79 95 78 104Q74 109 68 105Q67 96 69 85Z" fill="#E8A052" ${O}/><path d="M77.4 101Q74 107 68.4 103.4L68 105Q74 109 78 104Z" fill="#FFF4E2"/><path d="M74.6 105.4v-2.2M71.4 105.6v-2.2" stroke="#B0723A" stroke-width="1.1" stroke-linecap="round"/>`, pivot: [73, 86]},
          earL: {svg: `<path d="M35 48C32 38 33 26 38 20C45 24 53 32 56 38Z" fill="#E39A4C" ${O}/><path d="M38.6 42C37 35 38 29 40 26C44 29 48 33 50 37Z" fill="#FFD9C2"/>`, pivot: [44, 42]},
          earR: {svg: `<path d="M85 48C88 38 87 26 82 20C75 24 67 32 64 38Z" fill="#E39A4C" ${O}/><path d="M81.4 42C83 35 82 29 80 26C76 29 72 33 70 37Z" fill="#FFD9C2"/>`, pivot: [76, 42]},
          head: `${RG("japan-kuri-h", [[0, "#F8BE72"], [0.7, "#EBA052"], [1, "#D6853A"]], 0.42, 0.32, 0.8)}
            <path d="M60 32C80 32 90 44 90 56C90 70 78 80 60 80C42 80 30 70 30 56C30 44 40 32 60 32Z" fill="url(#japan-kuri-h)" ${O}/>
            <path d="M33 60C36 52 46 52 52 58C56 62 64 62 68 58C74 52 84 52 87 60C86 72 74 79 60 79C46 79 34 72 33 60Z" fill="#FFF4E2"/>
            <ellipse cx="48" cy="46" rx="3.6" ry="2.4" fill="#FFF4E2"/><ellipse cx="72" cy="46" rx="3.6" ry="2.4" fill="#FFF4E2"/>
            <path d="M40 40Q45 35 52 34" fill="none" stroke="#FFE0B0" stroke-width="2.6" stroke-linecap="round"/>`,
          face: `<path d="M56.4 61.4Q60 59.6 63.6 61.4Q63 64.6 60 65.4Q57 64.6 56.4 61.4Z" fill="#2B2233"/><ellipse cx="59" cy="61.6" rx="1.2" ry=".7" fill="#fff" opacity=".7"/>`
        },
        eyes: {lx: 49, rx: 71, y: 54, r: 4.4, style: "dot", color: "#2B2233"},
        mouth: {x: 60, y: 68, w: 3.2, color: "#2B2233", style: "cat"},
        cheeks: {lx: 41, rx: 79, y: 63, w: 4.4, h: 2.6, color: "#FF9A9A"},
        anchors: {top: [60, 32, 0.95], neck: [60, 78, 1], chest: [66, 94, 0.6], back: [84, 86, 0.8], hands: [60, 100, 0.86]},
        lines: {
          tap: ["Woof! Your deadlines are safe with me!", "Tail curled up tight, ready to help!", "I sniffed out your next task. Let's go!", "Shiba smile for you! You've got this!", "Big ears, big heart, big cheers!", "I'll keep watch while you study!", "One task at a time, like one treat at a time!", "You make my tail spin in circles!"],
          pet: ["Hehe! Right behind the ears, please!", "Aww! My tail is wagging so fast!"],
          hello: ["Woof woof! You're back!", "Hi! I waited by the door all day!"],
          morning: ["Good morning! Walkies, then study?", "Rise and shine! Let's sniff out today!"],
          night: ["Yawn... even guard dogs need sleep.", "Goodnight! I'll curl up by your desk."],
          focus: ["Sitting very, very still. Good dog!", "Ears up, eyes on the goal. Go!"],
          done: ["What a session! Treats all round!", "All done! Happy zoomies time!"],
          task: ["Woof! Done!", "Fetched it! Checked off!", "Another one! Tail wag!", "Yes! Best human ever!"],
          break: ["Stretch break! Play bow, then rest!", "Water break! I'll share my bowl."]
        }
      },
      {
        id: "japan-daru", name: "Daru", kind: "Daruma Doll", pose: "stand", wearColor: "#E6B23A",
        bio: "A sturdy daruma doll who always gets back up, no matter how many falls.",
        idle: ["sway", "topBob", "sparkle"], cheer: "bounce",
        parts: {
          feet: `<ellipse cx="60" cy="106.6" rx="30" ry="4.6" fill="#9A2420" ${O}/>`,
          body: `${RG("japan-daru-b", [[0, "#F2604A"], [0.65, "#D8382E"], [1, "#A82620"]], 0.4, 0.3, 0.8)}
            <path d="M60 24C86 24 98 46 98 70C98 94 84 108 60 108C36 108 22 94 22 70C22 46 34 24 60 24Z" fill="url(#japan-daru-b)" ${O}/>
            <path d="M60 37C76 37 84 47 84 59C84 71 74 79 60 79C46 79 36 71 36 59C36 47 44 37 60 37Z" fill="#FFF6EC" ${OW(2.4)}/>
            <path d="M42 50Q46 43 54 46M78 50Q74 43 66 46" fill="none" stroke="#2B2233" stroke-width="3.2" stroke-linecap="round"/>
            <path d="M44 72Q48 76 52 73M76 72Q72 76 68 73" fill="none" stroke="#6A6070" stroke-width="2" stroke-linecap="round"/>
            <path d="M34 88Q47 82 60 88Q73 82 86 88" fill="none" stroke="#F2C24A" stroke-width="2.6" stroke-linecap="round"/>
            <path d="M38 96Q49 91 60 96Q71 91 82 96" fill="none" stroke="#F2C24A" stroke-width="2" stroke-linecap="round"/>
            ${blossom(60, 92, 6.4, "#FFD86A", "#D8382E")}${blossom(36, 80, 4, "#FFD86A", "#D8382E")}${blossom(84, 80, 4, "#FFD86A", "#D8382E")}
            <path d="M30 52Q34 36 48 30" fill="none" stroke="#FFB0A0" stroke-width="3.4" stroke-linecap="round" opacity=".8"/>`,
          top: {svg: `<path d="M56 26Q52 18 57 15Q60 19 60 25ZM64 26Q68 18 63 15Q60 19 60 25Z" fill="#F2C24A" ${OW(1.8)}/><circle cx="60" cy="24.6" r="3" fill="#F2C24A" ${OW(1.8)}/>${blossom(60, 14, 5.4)}`, pivot: [60, 26]}
        },
        eyes: {lx: 50, rx: 70, y: 58, r: 5, style: "round", color: "#2B2233"},
        mouth: {x: 60, y: 69, w: 3, color: "#2B2233"},
        cheeks: {lx: 43, rx: 77, y: 66, w: 4, h: 2.4, color: "#FF8A80"},
        anchors: {top: [60, 24, 0.9], neck: [60, 82, 1], chest: [72, 94, 0.6], back: [94, 66, 0.8], hands: [60, 98, 0.86]},
        lines: {
          tap: ["Wobble, wobble, back up again!", "Seven tumbles, eight comebacks!", "Make a wish and paint one eye!", "I'm round, red and never give up!", "A tough page? Roll with it!", "Steady base, steady progress!", "You can't knock us down today!", "Goals set! Let's get them done!"],
          pet: ["Hehe! You made me wobble!", "Aww, I'm blushing redder than ever!"],
          hello: ["Welcome back! Still standing tall!", "Hi! Ready to roll into work?"],
          morning: ["Good morning! New day, new goal!", "Up again, just like always! Let's go!"],
          night: ["Rest now. Tomorrow we bounce back.", "Goodnight! Even darumas sit still."],
          focus: ["Steady and still. Focus mode on.", "No wobbles now. You've got this!"],
          done: ["Session done! Paint in the other eye!", "What a comeback! So proud!"],
          task: ["Done! Upright!", "Checked off! Steady!", "Another one! Wobble cheer!", "Yes! Goal reached!"],
          break: ["Break time! Have a little wobble!", "Stretch, breathe, then back up!"]
        }
      },
      {
        id: "japan-musu", name: "Musu", kind: "Onigiri", pose: "stand", wearColor: "#3A8A5A",
        bio: "A little rice ball in a nori sash with a big can-do attitude.",
        idle: ["topBob", "wave", "headTilt"], cheer: "hop",
        neck: [60, 104],
        parts: {
          feet: `<ellipse cx="48" cy="107" rx="7.4" ry="4.2" fill="#F4F2EC" ${O}/><ellipse cx="72" cy="107" rx="7.4" ry="4.2" fill="#F4F2EC" ${O}/>`,
          body: `<ellipse cx="60" cy="98" rx="26" ry="8" fill="#2E3A30"/>`,
          armL: {svg: `<path d="M38 82Q24 86 18 97Q17 104 24 103Q33 98 40 89Z" fill="#FBFAF6" ${O}/><ellipse cx="21" cy="99" rx="2.4" ry="1.5" fill="#FFD0D8" opacity=".7"/>`, pivot: [36, 85]},
          armR: {svg: `<path d="M82 82Q96 86 102 97Q103 104 96 103Q87 98 80 89Z" fill="#FBFAF6" ${O}/><ellipse cx="99" cy="99" rx="2.4" ry="1.5" fill="#FFD0D8" opacity=".7"/>`, pivot: [84, 85]},
          head: `${RG("japan-musu-r", [[0, "#FFFFFF"], [0.7, "#F8F6F0"], [1, "#E6E2D8"]], 0.42, 0.3, 0.8)}
            <path d="M60 30C66 30 70 34 74 41L94 80C99 90 96 104 82 104L38 104C24 104 21 90 26 80L46 41C50 34 54 30 60 30Z" fill="url(#japan-musu-r)" ${O}/>
            ${[[50, 46, 20], [66, 44, -30], [44, 60, 40], [74, 58, -10], [38, 74, 70], [82, 72, 15]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="2.4" ry="1.3" transform="rotate(${r} ${x} ${y})" fill="#E2DED2"/>`).join("")}
            ${LG("japan-musu-n", [[0, "#3A4A3C"], [1, "#1E2820"]])}
            <path d="M31.2 82H88.8L94.6 92C97.4 99 94 104 82 104H38C26 104 22.6 99 25.4 92Z" fill="url(#japan-musu-n)" ${OW(2.4)}/>
            <path d="M40 87H80M44 98H76" stroke="#5A7A5E" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>
            <path d="M38 64Q42 50 50 42" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
          top: {svg: `${RG("japan-musu-u", [[0, "#FF8A9A"], [1, "#C8283E"]], 0.4, 0.35, 0.7)}<circle cx="60" cy="33" r="6.6" fill="url(#japan-musu-u)" ${OW(2.2)}/><path d="M60 27Q62 20 69 19Q68 26 60 27Z" fill="#6AB86A" ${OW(1.8)}/><circle cx="57.6" cy="31" r="1.4" fill="#fff" opacity=".8"/>`, pivot: [60, 38]}
        },
        eyes: {lx: 51, rx: 69, y: 68, r: 4.2, style: "sparkle", color: "#2B2233"},
        mouth: {x: 60, y: 76, w: 3, color: "#2B2233"},
        cheeks: {lx: 44, rx: 76, y: 75, w: 3.8, h: 2.2, color: "#FF9AA8"},
        anchors: {top: [60, 30, 0.85], neck: [60, 84, 0.9], chest: [70, 94, 0.55], back: [90, 78, 0.8], hands: [60, 100, 0.86]},
        lines: {
          tap: ["Rice to meet you! Let's do this!", "Packed tight with good ideas!", "Nori sash on, ready for action!", "A snack-sized step is still a step!", "Fuel up, focus up, finish up!", "My plum center is pure courage!", "We're on a roll! Well, a ball!", "Every grain counts, like every page!"],
          pet: ["Hehe! Careful, I'm a little sticky!", "Aww! Warm hands, happy rice!"],
          hello: ["You're back! Lunch break over?", "Hi! Freshly made and ready to help!"],
          morning: ["Good morning! Breakfast of champions!", "Rise and shine! Let's pack the day!"],
          night: ["Late night? A snack, then sleep!", "Goodnight! Wrap up warm like nori!"],
          focus: ["Quiet as a bento box. Go!", "Sticking with you till it's done!"],
          done: ["Session done! A bento of wins!", "All done! Itadakimasu, success!"],
          task: ["Done! Delicious!", "Checked off! Perfectly packed!", "Another one! Rice work!", "Yes! Nori-ce job!"],
          break: ["Snack break! Have a little bite!", "Stretch time! Wiggle your toes!"]
        }
      }
    ]
  });
})();
/* end of module 98-comp-japan.js */


