/* Study Companions, Around the World: brazil */
(() => {
  const {O, OW, LG, RG} = COMP_KIT;
  const f1 = v => Math.round(v * 10) / 10;
  const ring = (cx, cy, n, r, fn) => Array.from({length: n}, (_, i) => { const a = i / n * Math.PI * 2; return fn(f1(cx + Math.cos(a) * r), f1(cy + Math.sin(a) * r), a * 180 / Math.PI, i); }).join("");
  // a little hibiscus: five round petals and a stamen
  const hibiscus = (x, y, r, c = "#FF5A6A", mid = "#FFD23A") => `<g>${ring(x, y, 5, r * 0.52, (px, py, a) => `<ellipse cx="${px}" cy="${py}" rx="${f1(r * 0.55)}" ry="${f1(r * 0.42)}" transform="rotate(${f1(a)} ${px} ${py})" fill="${c}" ${OW(1)}/>`)}<circle cx="${x}" cy="${y}" r="${f1(r * 0.22)}" fill="${mid}"/></g>`;
  // the shaggy edge of the tamarin's golden mane: n tufts round an ellipse
  const mane = (cx, cy, rx, ry, n) => { let d = ""; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, b = (i + 0.5) / n * Math.PI * 2, k = 1.16 + (i % 2) * 0.05;
    d += `${i ? "Q" : "M"}${i ? `${f1(cx + Math.cos(b - Math.PI / n) * rx * k)} ${f1(cy + Math.sin(b - Math.PI / n) * ry * k)} ` : ""}${f1(cx + Math.cos(a) * rx)} ${f1(cy + Math.sin(a) * ry)}`; } return d + "Z"; };

  COMP_DATA.push({
    theme: "brazil",
    companions: [
      {
        id: "brazil-tuca", name: "Tuca", kind: "Toco Toucan Chick", pose: "stand", wearColor: "#FF8A1E",
        bio: "A toco toucan chick with a big beak and the loudest cheer on the beach.",
        idle: ["headTilt", "wingFlutter", "topBob"], cheer: "wingFlutter",
        neck: [60, 74],
        parts: {
          feet: `<path d="M44 104q-4 4 -1 5h10q2-2-1-5ZM68 104q-4 4 -1 5h10q2-2-1-5Z" fill="#6A8ACF" ${O}/>`,
          wingL: {svg: `<path d="M38 76C27 79 22 92 26 104C31 106 38 101 41 94Z" fill="#26232E" ${O}/><path d="M30 92Q31 99 35 101" fill="none" stroke="#4A4656" stroke-width="2" stroke-linecap="round"/>`, pivot: [38, 78]},
          wingR: {svg: `<path d="M82 76C93 79 98 92 94 104C89 106 82 101 79 94Z" fill="#26232E" ${O}/><path d="M90 92Q89 99 85 101" fill="none" stroke="#4A4656" stroke-width="2" stroke-linecap="round"/>`, pivot: [82, 78]},
          body: `${RG("brazil-tuca-b", [[0, "#3E3A48"], [0.7, "#24212C"], [1, "#16141C"]], 0.4, 0.3, 0.8)}
            <path d="M60 66C79 66 87 82 87 94C87 104 77 109 60 109C43 109 33 104 33 94C33 82 41 66 60 66Z" fill="url(#brazil-tuca-b)" ${O}/>
            <path d="M60 72C70 72 75 81 74 91C73 99 67 103 60 103C53 103 47 99 46 91C45 81 50 72 60 72Z" fill="#FFF6D8"/>
            <path d="M50 96Q60 101 70 96Q68 103 60 104Q52 103 50 96Z" fill="#FFD23A"/>
            <ellipse cx="60" cy="108" rx="9" ry="2.6" fill="#E2302A"/>`,
          head: `${RG("brazil-tuca-h", [[0, "#423E4E"], [0.7, "#26232E"], [1, "#18161E"]], 0.4, 0.3, 0.8)}
            <path d="M60 24C80 24 88 38 88 50C88 64 76 72 60 72C44 72 32 64 32 50C32 38 40 24 60 24Z" fill="url(#brazil-tuca-h)" ${O}/>
            <path d="M42 34Q48 28 56 27" fill="none" stroke="#5A5668" stroke-width="2.6" stroke-linecap="round"/>
            <ellipse cx="49" cy="50" rx="7.4" ry="7" fill="#FF9A2A"/><ellipse cx="71" cy="50" rx="7.4" ry="7" fill="#FF9A2A"/>
            <ellipse cx="49" cy="50" rx="5.6" ry="5.4" fill="#5AA8F0"/><ellipse cx="71" cy="50" rx="5.6" ry="5.4" fill="#5AA8F0"/>`,
          face: `${LG("brazil-tuca-k", [[0, "#FFC23A"], [0.55, "#FF8A1E"], [1, "#F2601A"]])}
            <path d="M47 58C50 54 70 54 73 58C76 62 74 70 68 76C64 80 61 82 60 82C59 82 56 80 52 76C46 70 44 62 47 58Z" fill="url(#brazil-tuca-k)" ${O}/>
            <path d="M54 76.6C57 80 59 82 60 82C61 82 63 80 66 76.6C63 78.4 57 78.4 54 76.6Z" fill="#26232E"/>
            <path d="M50 58.6Q60 55.6 70 58.6" fill="none" stroke="#E2302A" stroke-width="1.8" stroke-linecap="round"/>
            <ellipse cx="55" cy="60.6" rx="3" ry="1.4" fill="#FFF2C0" opacity=".8"/>`,
          top: {svg: `<path d="M56 26C54 18 57 13 61 12C60 16 61 20 62 25ZM62 26C64 19 68 16 72 17C69 20 67 23 65 27Z" fill="#26232E" ${OW(2)}/>${hibiscus(70, 28, 6.4)}`, pivot: [60, 27]}
        },
        eyes: {lx: 49, rx: 71, y: 50, r: 3.6, style: "dot", color: "#1A1820"},
        mouth: {x: 60, y: 68, w: 3, color: "#7A2A10"},
        cheeks: {lx: 40, rx: 80, y: 60, w: 3.6, h: 2.2, color: "#FF8A9A"},
        anchors: {top: [60, 24, 0.95], neck: [60, 72, 1], chest: [68, 90, 0.6], back: [86, 84, 0.8], hands: [60, 98, 0.86]},
        lines: {
          tap: ["Bom dia! Ready to make some noise?", "My beak is big, but my cheers are bigger!", "Let's fly through this list together!", "Toco! That's toucan for 'you've got this'!", "One task at a time, like fruit for breakfast!", "I spy a finish line from my branch!", "You bring the focus, I'll bring the color!", "Every page gets you closer to the beach!"],
          pet: ["Hehe! Mind the beak, it's ticklish!", "Aww! My feathers are all fluffed up!"],
          hello: ["Olá! You're back! I saved you a branch!", "Hi hi! The whole beach missed you!"],
          morning: ["Good morning! The sun's up over the bay!", "Rise and shine! Papaya, then study?"],
          night: ["Boa noite! Even toucans tuck in their beaks.", "Night night! The bay lights are on for you."],
          focus: ["Shhh... quiet as a toucan on a branch.", "Eyes on the goal! I'm right here!"],
          done: ["Session done! Time for a beach parade!", "You did it! Loudest cheer on the beach!"],
          task: ["Done! Toco toco!", "Checked off! Wings up!", "Another one! Beak-tastic!", "Yes! Fly high!"],
          break: ["Break time! Shake out your feathers!", "Stretch your wings, sip some water!"]
        }
      },
      {
        id: "brazil-mico", name: "Mico", kind: "Golden Lion Tamarin", pose: "sit", wearColor: "#2E9A5A",
        bio: "A golden lion tamarin with a tiny golden mane and a big love of learning.",
        idle: ["tailSwish", "headTilt", "earTwitch"], cheer: "hop",
        neck: [60, 76],
        parts: {
          tail: {svg: `<path d="M82 100C98 100 106 88 104 74C102 62 108 52 114 50" fill="none" stroke="#2B2233" stroke-width="11" stroke-linecap="round"/>
            <path d="M82 100C98 100 106 88 104 74C102 62 108 52 114 50" fill="none" stroke="#F29A2A" stroke-width="6" stroke-linecap="round"/>
            <path d="M108 56C110 52 112 51 114 50" fill="none" stroke="#C8701A" stroke-width="6" stroke-linecap="round"/>`, pivot: [82, 100]},
          feet: `<ellipse cx="44" cy="106" rx="9" ry="5" fill="#E8902A" ${O}/><ellipse cx="76" cy="106" rx="9" ry="5" fill="#E8902A" ${O}/><path d="M40 108.6v-2.4M44 109v-2.6M48 108.6v-2.4M72 108.6v-2.4M76 109v-2.6M80 108.6v-2.4" stroke="#6A3A2A" stroke-width="1.1" stroke-linecap="round"/>`,
          body: `${RG("brazil-mico-b", [[0, "#FFC25A"], [0.7, "#F29A2A"], [1, "#D87A1A"]], 0.4, 0.3, 0.8)}
            <path d="M60 70C78 70 86 86 86 97C86 106 76 110 60 110C44 110 34 106 34 97C34 86 42 70 60 70Z" fill="url(#brazil-mico-b)" ${O}/>
            <path d="M60 78C68 78 72 88 70 98C69 104 51 104 50 98C48 88 52 78 60 78Z" fill="#FFD88A"/>
            <path d="M42 84Q46 80 50 82M70 82Q74 80 78 84" fill="none" stroke="#FFE2A8" stroke-width="2" stroke-linecap="round"/>`,
          armL: {svg: `<path d="M44 82Q38 92 40 104Q45 108 50 104Q50 94 51 84Z" fill="#F2A23A" ${O}/><path d="M40 101Q45 107 50 103L50 104Q45 108 40 104Z" fill="#6A3A2A"/>`, pivot: [47, 84]},
          armR: {svg: `<path d="M76 82Q82 92 80 104Q75 108 70 104Q70 94 69 84Z" fill="#F2A23A" ${O}/><path d="M80 101Q75 107 70 103L70 104Q75 108 80 104Z" fill="#6A3A2A"/>`, pivot: [73, 84]},
          earL: {svg: `<ellipse cx="24" cy="48" rx="6.4" ry="7.6" fill="#8A5A42" ${O}/><ellipse cx="24.8" cy="48.6" rx="3.2" ry="4.4" fill="#C88A6A"/>`, pivot: [30, 52]},
          earR: {svg: `<ellipse cx="96" cy="48" rx="6.4" ry="7.6" fill="#8A5A42" ${O}/><ellipse cx="95.2" cy="48.6" rx="3.2" ry="4.4" fill="#C88A6A"/>`, pivot: [90, 52]},
          head: `${RG("brazil-mico-m", [[0, "#FFD27A"], [0.6, "#F7A53A"], [1, "#E0801E"]], 0.45, 0.35, 0.8)}
            <path d="${mane(60, 50, 31, 29, 22)}" fill="url(#brazil-mico-m)" ${O}/>
            <path d="M40 30Q48 22 58 22M66 22Q76 24 82 32" fill="none" stroke="#FFE2A0" stroke-width="2.4" stroke-linecap="round"/>
            ${RG("brazil-mico-f", [[0, "#C8906E"], [1, "#9A6650"]], 0.45, 0.35, 0.8)}
            <path d="M60 36C72 36 77 45 77 55C77 66 70 73 60 73C50 73 43 66 43 55C43 45 48 36 60 36Z" fill="url(#brazil-mico-f)" ${OW(2.4)}/>
            <ellipse cx="51" cy="52" rx="6.4" ry="6" fill="#F2DCC8"/><ellipse cx="69" cy="52" rx="6.4" ry="6" fill="#F2DCC8"/>`,
          face: `<path d="M57 61Q60 59.4 63 61Q62 63.4 60 63.6Q58 63.4 57 61Z" fill="#4A2A22"/>${hibiscus(80, 30, 6, "#FF5A8A")}`
        },
        eyes: {lx: 51, rx: 69, y: 52, r: 3.8, style: "sparkle", color: "#24161A"},
        mouth: {x: 60, y: 67, w: 3, color: "#4A2A22", style: "cat"},
        cheeks: {lx: 46, rx: 74, y: 62, w: 3.4, h: 2, color: "#FF8A8A"},
        anchors: {top: [60, 20, 0.9], neck: [60, 78, 1], chest: [66, 92, 0.6], back: [84, 88, 0.8], hands: [60, 100, 0.86]},
        lines: {
          tap: ["Hi! I'm small, but I study big!", "My mane is golden, and so are your ideas!", "Swing from task to task with me!", "Let's go! The forest is cheering for you!", "I'm hungry for knowledge! And fruit!", "Tiny steps make a long, long trail!", "Curious minds climb the highest trees!", "You've got this, I've got snacks!"],
          pet: ["Hehe! You fluffed up my mane!", "Aww! Golden-hug time!"],
          hello: ["You're back! I swung right over!", "Oi! I kept your spot in the treetops!"],
          morning: ["Good morning! Sun on my mane!", "Rise and shine! Let's climb today!"],
          night: ["Curling up in the treetops. Night!", "Boa noite! Rest that clever head."],
          focus: ["Tiny and quiet. Focus mode on!", "Holding on tight to this task!"],
          done: ["Session done! Banana for everyone!", "We did it! Treetop high five!"],
          task: ["Done! Swing!", "Checked off! Golden!", "Another one! Yum!", "Yes! Climbing higher!"],
          break: ["Snack break! Fruit and water!", "Stretch break! Big tamarin stretch!"]
        }
      },
      {
        id: "brazil-cocada", name: "Cocada", kind: "Coconut with a Straw", pose: "stand", wearColor: "#FF5A8A",
        bio: "A fresh coconut from the beach kiosk, straw in and ready to cheer you on.",
        idle: ["topBob", "sway", "sparkle"], cheer: "bounce",
        parts: {
          feet: `<ellipse cx="47" cy="107" rx="8" ry="4.4" fill="#5A9A3A" ${O}/><ellipse cx="73" cy="107" rx="8" ry="4.4" fill="#5A9A3A" ${O}/>`,
          body: `${RG("brazil-cocada-b", [[0, "#B8E070"], [0.6, "#7CC04A"], [1, "#4E9A34"]], 0.38, 0.3, 0.85)}
            <path d="M60 30C84 30 96 50 96 70C96 92 82 106 60 106C38 106 24 92 24 70C24 50 36 30 60 30Z" fill="url(#brazil-cocada-b)" ${O}/>
            <path d="M42 36C48 32 72 32 78 36C80 40 72 43 60 43C48 43 40 40 42 36Z" fill="#FFFBEA" ${OW(2.2)}/>
            <ellipse cx="60" cy="37.6" rx="12" ry="3" fill="#E8F2D0"/>
            <path d="M32 58Q34 44 46 38" fill="none" stroke="#E2F6B0" stroke-width="3.2" stroke-linecap="round" opacity=".85"/>
            <path d="M36 92Q42 100 52 103M84 92Q78 100 68 103" fill="none" stroke="#3E8A2A" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>
            ${hibiscus(84, 48, 7.4)}`,
          top: {svg: `<path d="M63 40L71 12L77 8" fill="none" stroke="#2B2233" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M63 40L71 12L77 8" fill="none" stroke="#FF5A8A" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M65.6 31L68 22.4" stroke="#FFFFFF" stroke-width="3.6" stroke-linecap="butt"/>
            <path d="M48 18Q55 8 62 18Z" fill="#FFD23A" ${OW(1.8)}/><path d="M52 15.6Q55 10 58 15.6" fill="none" stroke="#2A9A5A" stroke-width="1.6"/><path d="M55 18L56 38" stroke="#2B2233" stroke-width="1.6"/>`, pivot: [62, 40]}
        },
        eyes: {lx: 50, rx: 70, y: 70, r: 4.4, style: "round", color: "#2B2233"},
        mouth: {x: 60, y: 80, w: 3.2, color: "#2B2233"},
        cheeks: {lx: 42, rx: 78, y: 78, w: 4, h: 2.4, color: "#FF8A9A"},
        anchors: {top: [60, 30, 0.85], neck: [60, 92, 0.9], chest: [70, 90, 0.55], back: [92, 70, 0.8], hands: [60, 98, 0.86]},
        lines: {
          tap: ["Fresh coconut water for your brain!", "Stay hydrated, stay brilliant!", "Straw's in, focus is on!", "A sip of sunshine, then back to work!", "Tough on the outside, sweet inside!", "Chilled, calm and ready to help!", "Kiosk's open, let's serve some answers!", "You're doing coco-nuts good work!"],
          pet: ["Hehe! That tickles my husk!", "Aww! You're making me blush green!"],
          hello: ["Olá! Fresh from the beach for you!", "Hi! I kept myself nice and cold!"],
          morning: ["Good morning! First sip of the day!", "Rise and shine! Beach-fresh start!"],
          night: ["Boa noite! The kiosk is closing.", "Rest up! I'll chill till morning."],
          focus: ["Shh... quiet as a coconut. Focus!", "Sipping slowly, thinking clearly."],
          done: ["Session done! Cheers, coco style!", "All done! Time for a beach break!"],
          task: ["Done! Refreshing!", "Checked off! Sip sip!", "Another one! So cool!", "Yes! Top of the palm!"],
          break: ["Water break! Take a big sip!", "Stretch break! Toes in the sand!"]
        }
      }
    ]
  });
})();
