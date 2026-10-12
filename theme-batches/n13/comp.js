/* Study Companions, new theme ideas batch n13: maples, aspens. Each theme has two young animals and one nature-object character. */
(() => {
  const {INK, O, OW, LG, RG, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const f1 = v => Math.round(v * 10) / 10;
  const twinkle = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${c || "#fff"}"/>`;
  const shine = (x, y, rx, ry, a) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})" fill="#fff" opacity=".7"/>`;
  const P = (cx, cy, a, r) => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
  const pt = p => `${f1(p[0])} ${f1(p[1])}`;
  // a palmate maple leaf with rounded-pointed lobes: lobes [[angle, length]], notch radius n, closing round the bottom
  const maple = (cx, cy, lobes, n, bot) => { let d = `M${pt(P(cx, cy, lobes[0][0] - 16, n))}`;
    lobes.forEach(([a, L], i) => { const nx = i < lobes.length - 1 ? (a + lobes[i + 1][0]) / 2 : a + 16; d += `Q${pt(P(cx, cy, a - 17, L * 0.74))} ${pt(P(cx, cy, a, L))}Q${pt(P(cx, cy, a + 17, L * 0.74))} ${pt(P(cx, cy, nx, n))}`; });
    return d + bot + "Z"; };
  const smallLeaf = (x, y, r, rot) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${r / 10})">` + `<path d="${maple(0, 0, [[-150, 8.6], [-120, 10], [-90, 11], [-60, 10], [-30, 8.6]], 4.4, "Q4 4 1 6L0.6 10L-0.6 10L-1 6Q-4 4 -4.2 1.4")}"`;

  /* ================= Maple Ravine ================= */
  const momijiBody = maple(60, 68, [[-150, 36], [-120, 41], [-90, 44], [-60, 41], [-30, 36]], 20, `Q${pt(P(60, 68, 20, 24))} ${pt(P(60, 68, 60, 25))}Q60 95 ${pt(P(60, 68, 120, 25))}Q${pt(P(60, 68, 160, 24))} ${pt(P(60, 68, -166, 20))}`);
  const momijiVeins = [[-150, 36], [-120, 41], [-90, 44], [-60, 41], [-30, 36]].map(([a, L]) => `M60 84L${pt(P(60, 68, a, L * 0.78))}`).join("");
  COMP_DATA.push({
    theme: "maples",
    companions: [
      {
        id: "maples-momiji", name: "Momiji", kind: "Momiji Leaf", pose: "float", wearColor: "#3E8A5A",
        bio: "A bright red maple leaf who rides the autumn breeze wherever you go.",
        idle: ["sway", "sparkle", "wave"], cheer: "spin",
        parts: {
          back: `<circle cx="60" cy="66" r="44" fill="#FFB070" opacity=".18"/>${smallLeaf(16, 30, 7, -30)} fill="#F6BE44" ${OW(1.6)}/></g>${smallLeaf(104, 42, 6, 25)} fill="#E8743A" ${OW(1.6)}/></g>`,
          body: `${RG("maples-momiji-b", [[0, "#FF9A5A"], [0.5, "#EE4A2C"], [1, "#B8241E"]], 0.5, 0.62, 0.62)}
            ${LINE("M60 90Q61 99 66 105", "#8A3A22", 2.4)}
            <path d="${momijiBody}" fill="url(#maples-momiji-b)" ${O}/>
            <path d="${momijiVeins}" fill="none" stroke="#FFC48A" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
            ${shine(44, 44, 5, 2.2, -40)}${twinkle(84, 40, 2.6, "#FFE6A8")}`,
          armL: {svg: `${LG("maples-momiji-l", [[0, "#F4643A"], [1, "#C42E22"]], 1, 0, 0, 0)}<path d="M48 79Q34 82 28 100Q41 97 49 88Z" fill="url(#maples-momiji-l)" ${O2}/><path d="M46 84Q37 89 31 97" fill="none" stroke="#FFC48A" stroke-width="1.3" stroke-linecap="round" opacity=".7"/>`, pivot: [46, 84]},
          armR: {svg: `${LG("maples-momiji-r", [[0, "#F4643A"], [1, "#C42E22"]], 0, 0, 1, 0)}<path d="M72 79Q86 82 92 100Q79 97 71 88Z" fill="url(#maples-momiji-r)" ${O2}/><path d="M74 84Q83 89 89 97" fill="none" stroke="#FFC48A" stroke-width="1.3" stroke-linecap="round" opacity=".7"/>`, pivot: [74, 84]}
        },
        eyes: {lx: 51, rx: 69, y: 67, r: 4.4, style: "sparkle", color: "#3A1410"},
        mouth: {x: 60, y: 75, w: 2.8, color: "#3A1410"},
        cheeks: {lx: 45, rx: 75, y: 73, w: 3.8, h: 2.3, color: "#FFD09A"},
        anchors: {top: [60, 30, 0.8], neck: [60, 86, 0.8], chest: [70, 80, 0.6], back: [84, 60, 0.7], hands: [60, 90, 0.8]},
        lines: {
          tap: ["Hi! The breeze carried me right to you!", "Red, bright and ready to cheer you on!", "One small step, like one leaf at a time.", "You make this whole season glow.", "Twirl, twirl! You've got this!", "Look at you, all fired up today!", "Even big trees start with little leaves."],
          pet: ["Hehe! My veins are all tingly!", "Ooh, that's a warm autumn sunbeam."],
          hello: ["You're back! The maples are waving at you!", "Hello! I drifted all the way down to say hi."],
          morning: ["Good morning! The ravine is full of color.", "Morning! Crisp air, clear head. Let's go!"],
          night: ["The moon is up. Time to settle down soon.", "Leaves rest at night too. Sleep well later."],
          focus: ["Floating quietly right beside you.", "Still as a leaf on a calm pool. Keep going."],
          done: ["What a session! I'm red with pride!", "All done! Let's twirl to celebrate!"],
          task: ["Swish! Another one done!", "Checked off! Leaf it to you!", "Yes! That fell right into place!", "Done! Bright as autumn!"],
          break: ["Break time! Watch the leaves drift a bit.", "Rest your eyes. Breathe in the cool air."]
        }
      },
      {
        id: "maples-pon", name: "Pon", kind: "Tanuki Pup", pose: "sit", wearColor: "#C8382A",
        bio: "A round little tanuki pup who keeps a lucky maple leaf on his head.",
        idle: ["earTwitch", "tailSwish", "topBob"], cheer: "bounce",
        neck: [60, 78],
        parts: {
          tail: {svg: `${LG("maples-pon-t", [[0, "#B08A64"], [1, "#7A5638"]], 0, 0, 1, 1)}<path d="M76 104C93 108 106 98 104 83C103 75 96 71 90 75C94 85 90 95 76 96Z" fill="url(#maples-pon-t)" ${O}/><path d="M97.5 77Q94 82 95.5 88M103 90Q98 92 94.5 97" fill="none" stroke="#3A2A22" stroke-width="3.2" stroke-linecap="round"/>`, pivot: [78, 100]},
          earL: {svg: `<ellipse cx="40" cy="42" rx="8.4" ry="8" fill="#6A4C36" ${O}/><ellipse cx="40.6" cy="43" rx="4.2" ry="3.8" fill="#2E2220"/>`, pivot: [45, 46]},
          earR: {svg: `<ellipse cx="80" cy="42" rx="8.4" ry="8" fill="#6A4C36" ${O}/><ellipse cx="79.4" cy="43" rx="4.2" ry="3.8" fill="#2E2220"/>`, pivot: [75, 46]},
          body: `${LG("maples-pon-b", [[0, "#C49C72"], [1, "#8A6444"]])}
            <path d="M60 74C80 74 90 88 90 98C90 106 84 110.5 60 110.5C36 110.5 30 106 30 98C30 88 40 74 60 74Z" fill="url(#maples-pon-b)" ${O}/>
            <ellipse cx="60" cy="96" rx="15" ry="11.5" fill="#F2E2C6"/>
            <ellipse cx="46" cy="108.6" rx="7" ry="3.6" fill="#3A2A22" ${O2}/><ellipse cx="74" cy="108.6" rx="7" ry="3.6" fill="#3A2A22" ${O2}/>`,
          armL: {svg: `<ellipse cx="37" cy="92" rx="5" ry="7.6" transform="rotate(24 37 92)" fill="#4A3428" ${O}/>`, pivot: [41, 86]},
          armR: {svg: `<ellipse cx="83" cy="92" rx="5" ry="7.6" transform="rotate(-24 83 92)" fill="#4A3428" ${O}/>`, pivot: [79, 86]},
          head: `${LG("maples-pon-h", [[0, "#D4AE84"], [1, "#9A7250"]])}
            <path d="M34 60C34 46 46 38 60 38C74 38 86 46 86 60C86 72 76 80 60 80C44 80 34 72 34 60Z" fill="url(#maples-pon-h)" ${O}/>
            <path d="M53 41Q60 38 67 41Q64 47 60 48Q56 47 53 41Z" fill="#6A4C36" opacity=".55"/>`,
          face: `<path d="M38.5 54C42 49 52 49 55.5 54.5C57 60 54 67 48 69C42.5 70 38 64 38.5 54Z" fill="#3A2A22"/><path d="M81.5 54C78 49 68 49 64.5 54.5C63 60 66 67 72 69C77.5 70 82 64 81.5 54Z" fill="#3A2A22"/>
            <ellipse cx="60" cy="69" rx="11.5" ry="8.4" fill="#F4E6CC"/><ellipse cx="60" cy="65.6" rx="3.2" ry="2.3" fill="${INK}"/><ellipse cx="59.2" cy="65" rx="1" ry=".6" fill="#fff" opacity=".8"/>`,
          top: {svg: `${smallLeaf(64, 33, 10.5, 18)} fill="#E8402C" ${O2}/></g><path d="M64.6 33.6L66 39" stroke="#8A3A22" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [64, 40]}
        },
        eyes: {lx: 48.5, rx: 71.5, y: 58.5, r: 4.4, style: "round", color: "#2A1A14"},
        mouth: {x: 60, y: 72, w: 2.4, style: "cat", color: "#2A1A14"},
        cheeks: {lx: 45, rx: 75, y: 71, w: 3.2, h: 2, color: "#FF9A8C"},
        anchors: {top: [60, 38, 0.9], neck: [60, 80, 0.95], chest: [68, 92, 0.7], back: [80, 90, 0.8], hands: [60, 96, 0.85]},
        lines: {
          tap: ["Pon pon! That's my happy belly drum!", "This leaf on my head is for luck. Yours too!", "Round and cozy and cheering for you!", "Hehe, you found me hiding by the stream!", "Slow and steady fills the tummy and the brain!", "You're doing great. Pon pon pon!", "Let's roll through this list together!"],
          pet: ["Ooh, right behind the ears! Perfect!", "Hehe, my fluffy tail is wagging!"],
          hello: ["You're back! I saved you a warm rock!", "Hiya! The ravine is extra pretty today."],
          morning: ["Good morning! I had the comfiest nap.", "Morning! Let's start with a big stretch."],
          night: ["The lantern is lit. Time to curl up soon.", "Sleepy tanuki says rest well tonight."],
          focus: ["Sitting still as a little stone. Go go!", "Shh, my ears are down. Deep focus time."],
          done: ["What a session! Pon pon, drum roll!", "All done! You earned a cozy snack."],
          task: ["Pon! Another one done!", "Checked off! Belly drum time!", "Yes! Lucky leaf is working!", "Done and done! Roly-poly hooray!"],
          break: ["Break time! Curl up for a minute.", "Have a snack and a sip of water!"]
        }
      },
      {
        id: "maples-kon", name: "Kon", kind: "Red Fox Kit", pose: "stand", wearColor: "#2E7A6A",
        bio: "A curious red fox kit who loves hopping up the old stone steps.",
        idle: ["earTwitch", "tailSwish", "headTilt"], cheer: "hop",
        neck: [60, 75],
        parts: {
          tail: {svg: `${LG("maples-kon-t", [[0, "#F08A44"], [1, "#C8501E"]], 0, 0, 1, 1)}<path d="M74 102C92 106 106 92 104 74C103 66 97 62 92 64C96 76 90 90 74 92Z" fill="url(#maples-kon-t)" ${O}/><path d="M104 74C103 66 97 62 92 64C93 69 94 73 93.4 77.4C97 77.6 101 76.4 104 74Z" fill="#FFF4E6"/><path d="M104 74C103 66 97 62 92 64" fill="none" ${O}/>`, pivot: [76, 97]},
          earL: {svg: `<path d="M40 48C35 38 34 27 37.5 18.5C46 22 53 30 56.5 39Z" fill="#E8743A" ${O}/><path d="M42 41C40 35 39.6 29 40.8 23.6C45.4 27 48.6 32 50.6 37Z" fill="#3A2420"/>`, pivot: [48, 41]},
          earR: {svg: `<path d="M80 48C85 38 86 27 82.5 18.5C74 22 67 30 63.5 39Z" fill="#E8743A" ${O}/><path d="M78 41C80 35 80.4 29 79.2 23.6C74.6 27 71.4 32 69.4 37Z" fill="#3A2420"/>`, pivot: [72, 41]},
          feet: `<ellipse cx="50" cy="109.2" rx="6.8" ry="3.8" fill="#3A2420" ${O}/><ellipse cx="70" cy="109.2" rx="6.8" ry="3.8" fill="#3A2420" ${O}/>`,
          body: `${LG("maples-kon-b", [[0, "#F2884A"], [1, "#D2602A"]])}
            <path d="M60 72C75 72 80.5 86 79.5 97C78.8 105 72 109.5 60 109.5C48 109.5 41.2 105 40.5 97C39.5 86 45 72 60 72Z" fill="url(#maples-kon-b)" ${O}/>
            <path d="M50 76C54 83 66 83 70 76C70.5 89 66.5 99 60 102C53.5 99 49.5 89 50 76Z" fill="#FFF4E6"/>
            <path d="M44 101C45 106 48.5 108.6 53.5 109.2L54 100.5Q49 99 44 101ZM76 101C75 106 71.5 108.6 66.5 109.2L66 100.5Q71 99 76 101Z" fill="#3A2420"/>`,
          armL: {svg: `<ellipse cx="41.5" cy="91" rx="4.8" ry="7.4" transform="rotate(22 41.5 91)" fill="#D8642E" ${O}/><ellipse cx="39.6" cy="96" rx="3.4" ry="2.6" transform="rotate(22 39.6 96)" fill="#3A2420"/>`, pivot: [46, 85]},
          armR: {svg: `<ellipse cx="78.5" cy="91" rx="4.8" ry="7.4" transform="rotate(-22 78.5 91)" fill="#D8642E" ${O}/><ellipse cx="80.4" cy="96" rx="3.4" ry="2.6" transform="rotate(-22 80.4 96)" fill="#3A2420"/>`, pivot: [74, 85]},
          head: `${LG("maples-kon-h", [[0, "#F69A58"], [1, "#DA6A30"]])}
            <path d="M36 57C36 44 46 36 60 36C74 36 84 44 84 57C84 61 88 63.5 91 65.5C85 68 81 71.5 76.5 74C70 77 50 77 43.5 74C39 71.5 35 68 29 65.5C32 63.5 36 61 36 57Z" fill="url(#maples-kon-h)" ${O}/>
            <path d="M41 49Q44 42 51 39" fill="none" stroke="#FFC08A" stroke-width="2.6" stroke-linecap="round"/>`,
          face: `<path d="M39 63C45 65.5 52 64 60 60C68 64 75 65.5 81 63C79 71 70.5 75.6 60 75.6C49.5 75.6 41 71 39 63Z" fill="#FFF4E6"/>
            <ellipse cx="60" cy="64" rx="3" ry="2.2" fill="${INK}"/><ellipse cx="59.2" cy="63.4" rx=".9" ry=".6" fill="#fff" opacity=".8"/>`
        },
        eyes: {lx: 50, rx: 70, y: 55.5, r: 4.4, style: "sparkle", color: "#2A1A14"},
        mouth: {x: 60, y: 68.4, w: 2.6, style: "cat", color: "#2A1A14"},
        cheeks: {lx: 44, rx: 76, y: 64, w: 4, h: 2.4, color: "#FF9A8C"},
        anchors: {top: [60, 36, 0.9], neck: [60, 76, 0.95], chest: [68, 90, 0.7], back: [78, 88, 0.85], hands: [60, 95, 0.85]},
        lines: {
          tap: ["Hi! I hopped up ninety steps to see you!", "Ooh, what are we learning? Show me!", "Quick paws, quick brain. That's you!", "My tail goes swish when you work hard!", "You're clever as a fox today!", "Let's sniff out the next task together!", "Every step counts, even the mossy ones!"],
          pet: ["Eee! My ears are all wiggly!", "Hehe, that's the softest pat ever!"],
          hello: ["You're back! I heard you from the ravine!", "Hi hi! I waited by the stone lantern."],
          morning: ["Good morning! The leaves are glowing.", "Rise and shine! Let's go exploring!"],
          night: ["The moon is so big tonight. Rest soon?", "Curling my tail up like a blanket. Night!"],
          focus: ["Ears up, nose down. We've got this!", "Quiet paws. You're doing great."],
          done: ["What a session! Happy fox zoomies!", "You did it! My tail won't stop!"],
          task: ["Yip! Another one done!", "Checked off! Fox high five!", "Yes yes! Sharp work!", "Done! Pounce on the next one!"],
          break: ["Break time! Stretch like a sleepy fox.", "Rest a bit, then back to the hunt!"]
        }
      }
    ]
  });

  /* ================= Aspen Gold ================= */
  const aspenLeaf = (() => { let d = ""; for (let i = 0; i <= 72; i++) { const t = i / 72 * Math.PI * 2, s = Math.sin(t), up = Math.max(0, -s), r = 1 + 0.022 * Math.sin(t * 26);
    const x = 60 + 30 * Math.cos(t) * (1 - 0.3 * Math.pow(up, 4)) * r, y = 64 + 31 * s * r - 9 * Math.pow(up, 7); d += (i ? "L" : "M") + f1(x) + " " + f1(y); } return d + "Z"; })();
  COMP_DATA.push({
    theme: "aspens",
    companions: [
      {
        id: "aspens-quinn", name: "Quinn", kind: "Aspen Leaf", pose: "float", wearColor: "#3A6A9A",
        bio: "A golden aspen leaf who quakes with joy at the faintest breeze.",
        idle: ["sway", "sparkle", "wave"], cheer: "spin",
        parts: {
          back: `<circle cx="60" cy="64" r="42" fill="#FFE07A" opacity=".22"/>${twinkle(18, 36, 3.4, "#FFE07A")}${twinkle(102, 30, 2.6, "#FFF2B8")}`,
          body: `${RG("aspens-quinn-b", [[0, "#FFF2A8"], [0.5, "#F6C42C"], [1, "#D8900E"]], 0.42, 0.4, 0.66)}
            ${LINE("M60 94Q60.5 100 58 106", "#9A7A2A", 2.6)}
            <path d="${aspenLeaf}" fill="url(#aspens-quinn-b)" ${O}/>
            <path d="M60 93V34M60 80Q49 75 40 64M60 80Q71 75 80 64M60 66Q51 60 44 50M60 66Q69 60 76 50M60 52Q55 47 52 41M60 52Q65 47 68 41" fill="none" stroke="#FFF2B0" stroke-width="1.5" stroke-linecap="round" opacity=".75"/>
            ${shine(44, 46, 5.4, 2.4, -40)}`,
          armL: {svg: `<ellipse cx="27.5" cy="74" rx="6.2" ry="4.6" transform="rotate(-20 27.5 74)" fill="#F2BE2C" ${O}/>`, pivot: [33, 73]},
          armR: {svg: `<ellipse cx="92.5" cy="74" rx="6.2" ry="4.6" transform="rotate(20 92.5 74)" fill="#F2BE2C" ${O}/>`, pivot: [87, 73]}
        },
        eyes: {lx: 51, rx: 69, y: 65, r: 4.4, style: "sparkle", color: "#3A2808"},
        mouth: {x: 60, y: 73.5, w: 2.8, color: "#3A2808"},
        cheeks: {lx: 44, rx: 76, y: 72, w: 4, h: 2.4, color: "#FF9A7A"},
        anchors: {top: [60, 32, 0.8], neck: [60, 92, 0.8], chest: [72, 82, 0.6], back: [86, 60, 0.7], hands: [60, 90, 0.8]},
        lines: {
          tap: ["Hi! I'm shimmering just because you're here!", "Quake, quake! That's my happy dance!", "Golden days are for golden work!", "One little leaf, one big cheer for you!", "You make the whole grove glow.", "A breeze of good luck, coming your way!", "Shine on! You're doing wonderfully."],
          pet: ["Hehe! I'm fluttering all over!", "Ooh, that tickles my little stem!"],
          hello: ["You're back! The whole grove is shimmering!", "Hello! I fluttered down to meet you."],
          morning: ["Good morning! The sun is in the treetops.", "Morning! Crisp mountain air, fresh start!"],
          night: ["Moonlight makes me silver. Rest soon?", "The stars are out over the grove. Night!"],
          focus: ["Quiet as a leaf on a still day.", "Shimmering softly while you focus."],
          done: ["What a session! I'm pure gold now!", "All done! Let's shimmer together!"],
          task: ["Shimmer! Another one done!", "Checked off! Golden!", "Yes! That's the gold standard!", "Done! Quaking with pride!"],
          break: ["Break time! Let the breeze cool you off.", "Look up at the sky for a minute."]
        }
      },
      {
        id: "aspens-peeka", name: "Peeka", kind: "Pika", pose: "sit", wearColor: "#D8602A",
        bio: "A round mountain pika who gathers flowers to keep her burrow cozy.",
        idle: ["earTwitch", "headTilt", "wave"], cheer: "hop",
        neck: [60, 78],
        parts: {
          earL: {svg: `<ellipse cx="38" cy="41" rx="10" ry="10.4" fill="#9C8470" ${O}/><ellipse cx="38.6" cy="42" rx="5.8" ry="6.2" fill="#F4B8B0"/><path d="M30 35Q34 31 39 31" fill="none" stroke="#F6EEE4" stroke-width="2" stroke-linecap="round"/>`, pivot: [44, 47]},
          earR: {svg: `<ellipse cx="82" cy="41" rx="10" ry="10.4" fill="#9C8470" ${O}/><ellipse cx="81.4" cy="42" rx="5.8" ry="6.2" fill="#F4B8B0"/><path d="M90 35Q86 31 81 31" fill="none" stroke="#F6EEE4" stroke-width="2" stroke-linecap="round"/>`, pivot: [76, 47]},
          body: `${LG("aspens-peeka-b", [[0, "#C8B098"], [1, "#94796A"]])}
            <path d="M60 66C80 66 88 82 88 94C88 104 80 110.5 60 110.5C40 110.5 32 104 32 94C32 82 40 66 60 66Z" fill="url(#aspens-peeka-b)" ${O}/>
            <ellipse cx="60" cy="97" rx="14" ry="10.5" fill="#F2E6D6"/>
            <ellipse cx="48" cy="108.8" rx="6.2" ry="3.2" fill="#7A6450" ${O2}/><ellipse cx="72" cy="108.8" rx="6.2" ry="3.2" fill="#7A6450" ${O2}/>`,
          armL: {svg: `<ellipse cx="40" cy="90" rx="4.6" ry="6.6" transform="rotate(25 40 90)" fill="#8A7260" ${O}/>`, pivot: [44, 85]},
          armR: {svg: `${LINE("M82 89Q86 81 89 73", "#5E9A3E", 1.8)}<g fill="#9A7BE0" ${OW(1.4)}><circle cx="89" cy="67.6" r="2.8"/><circle cx="93.6" cy="70.6" r="2.8"/><circle cx="92" cy="75.6" r="2.8"/><circle cx="86.4" cy="75.4" r="2.8"/><circle cx="84.6" cy="70.4" r="2.8"/></g><circle cx="89" cy="72" r="2" fill="#F6C83A"/>
            <ellipse cx="80" cy="90" rx="4.6" ry="6.6" transform="rotate(-25 80 90)" fill="#8A7260" ${O}/>`, pivot: [76, 85]},
          head: `${LG("aspens-peeka-h", [[0, "#D6C2AA"], [1, "#A48C74"]])}
            <path d="M34 58C34 44 46 36 60 36C74 36 86 44 86 58C86 72 74 80 60 80C46 80 34 72 34 58Z" fill="url(#aspens-peeka-h)" ${O}/>
            <path d="M42 47Q46 41 53 39" fill="none" stroke="#F0E4D4" stroke-width="2.6" stroke-linecap="round"/>`,
          face: `<ellipse cx="60" cy="66.6" rx="9.4" ry="6.6" fill="#F6EADC"/><ellipse cx="60" cy="63.8" rx="2.6" ry="1.9" fill="#5A3A34"/>
            <path d="M51 66L40 64M51 68.6L40 70.4M69 66L80 64M69 68.6L80 70.4" fill="none" stroke="#6A5444" stroke-width="1" stroke-linecap="round" opacity=".8"/>`
        },
        eyes: {lx: 49, rx: 71, y: 57, r: 4.6, style: "sparkle", color: "#2A1A14"},
        mouth: {x: 60, y: 69.4, w: 2.2, style: "cat", color: "#2A1A14"},
        cheeks: {lx: 43, rx: 77, y: 64, w: 3.8, h: 2.3, color: "#FF9AA0"},
        anchors: {top: [60, 36, 0.9], neck: [60, 80, 0.95], chest: [66, 92, 0.7], back: [80, 88, 0.8], hands: [60, 96, 0.85]},
        lines: {
          tap: ["Eep! Hi! I brought you a flower!", "Little by little, my hay pile grows. Yours too!", "Small but mighty, just like you!", "Squeak! You're doing amazing!", "Let's gather up some good grades!", "Busy paws make happy hearts!", "I believe in you, big time!"],
          pet: ["Eep! My round ears are so happy!", "Hehe, I'm the fluffiest ball, right?"],
          hello: ["You're back! I squeaked hello from my rock!", "Hiya! I've got flowers for both of us."],
          morning: ["Good morning! The grove is all golden.", "Morning! Time to gather some good work!"],
          night: ["Cozy burrow time soon. Rest well, okay?", "The stars are out. Snuggle down later."],
          focus: ["Tiny and quiet, right here with you.", "Gathering focus like flowers. Go go!"],
          done: ["What a session! Happy pika squeaks!", "All done! Add that one to the pile!"],
          task: ["Eep! Another one done!", "Checked off! Into the hay pile!", "Yes! Tiny victory squeak!", "Done! Busy paws, busy brain!"],
          break: ["Break time! Sit in the sun a minute.", "Have a snack. I'll share my flowers!"]
        }
      },
      {
        id: "aspens-wapi", name: "Wapi", kind: "Elk Calf", pose: "stand", wearColor: "#3A6A9A",
        bio: "A spotted elk calf who wobbles through the aspens on brand-new legs.",
        idle: ["earTwitch", "tailSwish", "headTilt"], cheer: "hop",
        neck: [60, 74],
        parts: {
          tail: {svg: `<path d="M77 86C83 83 88 87 87 93C86 96 81 96 78 92Z" fill="#EADCC6" ${O2}/>`, pivot: [78, 89]},
          earL: {svg: `<path d="M45 47C37 41 27 39 19.5 43C23.5 50 34 54.6 45 53Z" fill="#B47A48" ${O}/><path d="M42.6 48.6C36.6 45.6 30.6 44.6 25.4 45.6C29 49 35 51.2 41 51Z" fill="#F2C4AA"/>`, pivot: [45, 50]},
          earR: {svg: `<path d="M75 47C83 41 93 39 100.5 43C96.5 50 86 54.6 75 53Z" fill="#B47A48" ${O}/><path d="M77.4 48.6C83.4 45.6 89.4 44.6 94.6 45.6C91 49 85 51.2 79 51Z" fill="#F2C4AA"/>`, pivot: [75, 50]},
          body: `${LG("aspens-wapi-b", [[0, "#C89462"], [1, "#A0703E"]])}
            <path d="M45.5 95C45.5 100 46.6 104 46.8 107.6H54.2C54.2 104 54.4 100 55.4 95ZM74.5 95C74.5 100 73.4 104 73.2 107.6H65.8C65.8 104 65.6 100 64.6 95Z" fill="#A0703E" ${O}/>
            <path d="M46 106.6H55V110.4Q50.5 111.4 46 110.4ZM65 106.6H74V110.4Q69.5 111.4 65 110.4Z" fill="#3A2A22" ${O2}/>
            <path d="M60 70C74 70 80.5 80 80.5 89C80.5 97 74 101.5 60 101.5C46 101.5 39.5 97 39.5 89C39.5 80 46 70 60 70Z" fill="url(#aspens-wapi-b)" ${O}/>
            <path d="M48 72.5C52 77 68 77 72 72.5L70.6 80.6C64 83 56 83 49.4 80.6Z" fill="#7A5234"/>
            <g fill="#F4E6CC"><ellipse cx="47" cy="88" rx="2.2" ry="1.7"/><ellipse cx="53" cy="94" rx="1.9" ry="1.5"/><ellipse cx="71" cy="87" rx="2.2" ry="1.7"/><ellipse cx="66" cy="94.5" rx="1.9" ry="1.5"/><ellipse cx="74" cy="93" rx="1.6" ry="1.3"/><ellipse cx="45" cy="94" rx="1.5" ry="1.2"/></g>
            <ellipse cx="60" cy="92" rx="8.4" ry="6" fill="#E8D2B0" opacity=".9"/>`,
          head: `${LG("aspens-wapi-h", [[0, "#D4A272"], [1, "#A87444"]])}
            <path d="M41.5 52C41.5 40 50 33.6 60 33.6C70 33.6 78.5 40 78.5 52C78.5 60 74.6 64 72.4 70C70.4 76 66 79.4 60 79.4C54 79.4 49.6 76 47.6 70C45.4 64 41.5 60 41.5 52Z" fill="url(#aspens-wapi-h)" ${O}/>
            <path d="M47 43Q51 37.6 57 36.4" fill="none" stroke="#F0CFA4" stroke-width="2.6" stroke-linecap="round"/>`,
          face: `<path d="M49.4 65.4C51.6 73.6 55.6 77.6 60 77.6C64.4 77.6 68.4 73.6 70.6 65.4C66 67.6 54 67.6 49.4 65.4Z" fill="#EACBA2"/>
            <ellipse cx="60" cy="70.6" rx="4" ry="2.8" fill="#3A2420"/><ellipse cx="59" cy="69.8" rx="1.2" ry=".7" fill="#fff" opacity=".7"/>`
        },
        eyes: {lx: 51, rx: 69, y: 54, r: 4.8, style: "sparkle", color: "#2A1A12"},
        mouth: {x: 60, y: 74.6, w: 2.2, style: "cat", color: "#2A1A12"},
        cheeks: {lx: 46, rx: 74, y: 62, w: 3.8, h: 2.3, color: "#FF9A8C"},
        anchors: {top: [60, 34, 0.9], neck: [60, 76, 0.9], chest: [66, 88, 0.7], back: [74, 82, 0.8], hands: [60, 92, 0.8]},
        lines: {
          tap: ["Hi! I only fell over twice on the way here!", "Wobbly legs, steady heart. Let's go!", "My spots say you're doing great!", "One careful step after another!", "You make the whole meadow brighter!", "Big ears, listening to every idea!", "I'm growing, and so are you!"],
          pet: ["Ooh, right between the ears! Yes!", "Hehe, my little tail is flicking!"],
          hello: ["You're back! I trotted all the way over!", "Hi! The aspens are shimmering for you."],
          morning: ["Good morning! The grass is sparkly with dew.", "Morning! Let's stretch our long legs!"],
          night: ["Tucking my legs in for the night soon.", "The grove is moonlit. Sleep well later!"],
          focus: ["Standing very still, like a big elk.", "Quiet hooves. You've got this."],
          done: ["What a session! I'm doing happy hops!", "All done! You were brave and steady."],
          task: ["Hop! Another one done!", "Checked off! Wobble hooray!", "Yes! Growing stronger!", "Done! Trot on to the next!"],
          break: ["Break time! Graze on a snack.", "Stretch those legs for a minute!"]
        }
      }
    ]
  });
})();
