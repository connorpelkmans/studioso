/* Study Companions, new theme ideas batch n11: meadow, glowbay. Each theme has one nature object with a face and two young animals. */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const f1 = v => Math.round(v * 10) / 10;
  const twinkle = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${c || "#fff"}"/>`;
  const shine = (x, y, rx, ry, a) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})" fill="#fff" opacity=".75"/>`;
  const ring = (cx, cy, n, R, fn) => Array.from({length: n}, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return fn(f1(cx + R * Math.cos(a)), f1(cy + R * Math.sin(a)), a, i); }).join("");
  const daisy = (x, y, r) => `<g>${ring(x, y, 7, r * 0.9, (px, py) => `<circle cx="${px}" cy="${py}" r="${f1(r * 0.62)}" fill="#fff" ${OW(1.2)}/>`)}<circle cx="${x}" cy="${y}" r="${f1(r * 0.62)}" fill="#F6C83A" ${OW(1.2)}/></g>`;

  /* ================= Poppy Meadow ================= */
  COMP_DATA.push({
    theme: "meadow",
    companions: [
      {
        id: "meadow-scarlet", name: "Scarlet", kind: "Red Poppy", pose: "stand", wearColor: "#4C78DA",
        bio: "A sunny red poppy who turns to face you the way she faces the sun.",
        idle: ["headTilt", "sway", "wave"], cheer: "spin",
        neck: [60, 72],
        parts: {
          back: `${LINE("M40 108q-3-10 1-19", "#7CC060", 2.4)}${LINE("M81 108q3-11-1-20", "#7CC060", 2.4)}${LINE("M30 108q-1-7 3-12", "#8CCB66", 2)}`,
          body: `${LG("meadow-scarlet-s", [[0, "#8CCB66"], [1, "#4E9A3A"]], 0, 0, 1, 0)}
            <path d="M56.4 108V70H63.6V108Z" fill="url(#meadow-scarlet-s)" ${O}/>
            <path d="M34 108C36 100 47 97 60 97C73 97 84 100 86 108Z" fill="#6FB050" ${O}/>
            <path d="M44 103q4-3 8 0M66 102q4-3 8 0" fill="none" stroke="#9AD878" stroke-width="1.8" stroke-linecap="round"/>
            ${daisy(43, 99.5, 3.4)}<circle cx="77" cy="99.5" r="2.6" fill="#4C78DA" ${OW(1.2)}/>`,
          armL: {svg: `${LG("meadow-scarlet-l", [[0, "#8CCB66"], [1, "#4E9A3A"]])}<path d="M58 88C52 79 41 77 31 82C32 84 34 85 35 85C33 87 33 89 34 90C44 94 52 93 58 88Z" fill="url(#meadow-scarlet-l)" ${O2}/><path d="M57 88Q46 84 34 84.5" fill="none" stroke="#3E7A2E" stroke-width="1.4" stroke-linecap="round"/>`, pivot: [58, 88]},
          armR: {svg: `${LG("meadow-scarlet-r", [[0, "#8CCB66"], [1, "#4E9A3A"]])}<path d="M62 88C68 79 79 77 89 82C88 84 86 85 85 85C87 87 87 89 86 90C76 94 68 93 62 88Z" fill="url(#meadow-scarlet-r)" ${O2}/><path d="M63 88Q74 84 86 84.5" fill="none" stroke="#3E7A2E" stroke-width="1.4" stroke-linecap="round"/>`, pivot: [62, 88]},
          head: `${RG("meadow-scarlet-p", [[0, "#FF8A6A"], [0.55, "#F2442E"], [1, "#C8281E"]], 0.5, 0.5, 0.6)}${RG("meadow-scarlet-q", [[0, "#E8503A"], [1, "#A81E1A"]], 0.5, 0.5, 0.6)}
            ${ring(60, 50, 5, 16, (x, y) => `<circle cx="${x}" cy="${y}" r="14" fill="url(#meadow-scarlet-q)" ${O}/>`).replace(/cx="([\d.]+)" cy="([\d.]+)"/g, (m, x, y) => { const a = Math.atan2(y - 50, x - 60) + Math.PI / 5; return `cx="${f1(60 + 16 * Math.cos(a))}" cy="${f1(50 + 16 * Math.sin(a))}"`; })}
            ${ring(60, 50, 5, 13, (x, y) => `<circle cx="${x}" cy="${y}" r="14.5" fill="url(#meadow-scarlet-p)" ${O}/>`)}
            ${ring(60, 50, 5, 13, (x, y, a) => `<path d="M${f1(60 + 8 * Math.cos(a))} ${f1(50 + 8 * Math.sin(a))}L${f1(60 + 22 * Math.cos(a))} ${f1(50 + 22 * Math.sin(a))}" stroke="#FFB4A0" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>`)}
            <circle cx="60" cy="50" r="15.6" fill="${INK}"/>
            ${ring(60, 50, 14, 15.6, (x, y) => `<circle cx="${x}" cy="${y}" r="1.7" fill="${INK}"/>`)}
            ${shine(44, 38, 4.6, 2.4, -40)}`,
          face: `<circle cx="60" cy="50" r="12.6" fill="#FFEFD8"/>`
        },
        eyes: {lx: 55, rx: 65, y: 48, r: 3.4, style: "sparkle", color: "#2B1A1C"},
        mouth: {x: 60, y: 55, w: 2.4, color: "#2B1A1C"},
        cheeks: {lx: 51, rx: 69, y: 53.4, w: 2.6, h: 1.7, color: "#FF9A9A"},
        anchors: {top: [60, 24, 0.85], neck: [60, 74, 0.6], chest: [66, 92, 0.5], back: [72, 84, 0.6], hands: [60, 92, 0.75]},
        lines: {
          tap: ["Hi! I turned toward you like you're the sun!", "You're blooming today, I can tell!", "One petal at a time, one task at a time.", "Stand tall, little sprout. You've got this!", "Look at you grow!", "Bright red and ready to cheer!", "Your hard work is going to blossom.", "Sunshine and focus, the perfect mix!"],
          pet: ["Hehe, my petals are all fluttery!", "Aww, that feels like a warm breeze."],
          hello: ["You're here! The whole meadow is waving!", "Hello, sunshine! Let's grow some grades."],
          morning: ["Good morning! My petals just opened for you.", "Morning! The dew is sparkling. Let's begin!"],
          night: ["My petals are closing up. Rest soon, okay?", "Goodnight soon! Even poppies need sleep."],
          focus: ["Standing tall right here with you.", "Quiet meadow, clear mind. Go for it!"],
          done: ["What a session! I'm in full bloom!", "All done! You should be so proud."],
          task: ["Pop! Another one done!", "Yes! That's a whole new bloom!", "Checked off! The meadow cheers!", "Ta-da! Growing strong!"],
          break: ["Break time! Stretch up toward the sun!", "Rest your eyes. Sip some water, like a flower."]
        }
      },
      {
        id: "meadow-buzz", name: "Buzz", kind: "Baby Bumblebee", pose: "float", wearColor: "#5A8AD0",
        bio: "A fuzzy little bumblebee who visits every poppy, then buzzes back to you.",
        idle: ["wingFlutter", "earTwitch", "headTilt"], cheer: "spin",
        neck: [60, 68],
        parts: {
          wingL: {svg: `<path d="M46 66C38 50 22 40 15 46C9 52 22 64 46 66Z" fill="#EEF8FF" fill-opacity=".95" ${O2}/><path d="M45 69C34 68 24 72 25 78C26 83 37 79 45 69Z" fill="#E2F2FC" fill-opacity=".95" ${O2}/><path d="M42 63Q30 54 20 48M42 70Q33 73 28.5 77" fill="none" stroke="#B9DDEF" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [46, 67]},
          wingR: {svg: `<path d="M74 66C82 50 98 40 105 46C111 52 98 64 74 66Z" fill="#EEF8FF" fill-opacity=".95" ${O2}/><path d="M75 69C86 68 96 72 95 78C94 83 83 79 75 69Z" fill="#E2F2FC" fill-opacity=".95" ${O2}/><path d="M78 63Q90 54 100 48M78 70Q87 73 91.5 77" fill="none" stroke="#B9DDEF" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [74, 67]},
          earL: {svg: `${LINE("M53 31C51 24 48 19 44 16", "#4A3020", 2.2)}<circle cx="43" cy="15" r="3.6" fill="#4A3020" ${O2}/><circle cx="42" cy="13.8" r="1.1" fill="#fff" opacity=".75"/>`, pivot: [53, 31]},
          earR: {svg: `${LINE("M67 31C69 24 72 19 76 16", "#4A3020", 2.2)}<circle cx="77" cy="15" r="3.6" fill="#4A3020" ${O2}/><circle cx="76" cy="13.8" r="1.1" fill="#fff" opacity=".75"/>`, pivot: [67, 31]},
          feet: `${LINE("M51 99Q49 104 51.5 107", "#4A3020", 2.4)}${LINE("M69 99Q71 104 68.5 107", "#4A3020", 2.4)}`,
          body: `${RG("meadow-buzz-b", [[0, "#FFF2A8"], [0.55, "#FFD34A"], [1, "#EFA82A"]], 0.4, 0.3, 0.75)}
            <defs><clipPath id="meadow-buzz-c"><ellipse cx="60" cy="86" rx="22" ry="17"/></clipPath></defs>
            <path d="M56.6 101L60 108L63.4 101Z" fill="#4A3020" ${OW(2.2)}/>
            <ellipse cx="60" cy="86" rx="22" ry="17" fill="url(#meadow-buzz-b)"/>
            <g clip-path="url(#meadow-buzz-c)" fill="#4A3020"><path d="M36 82Q60 88 84 82V90Q60 96 36 90Z"/><path d="M36 97Q60 103 84 97V106H36Z"/></g>
            <ellipse cx="60" cy="86" rx="22" ry="17" fill="none" ${O}/>
            <path d="M44 79Q47 74 53 72" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".85"/>`,
          armL: {svg: `<ellipse cx="37.5" cy="86" rx="4.4" ry="6.2" transform="rotate(32 37.5 86)" fill="#FFD34A" ${O}/><path d="M34.4 89.6q1.6 1 3.2 .4" fill="none" stroke="#4A3020" stroke-width="1.4" stroke-linecap="round"/>`, pivot: [41.5, 81.5]},
          armR: {svg: `<ellipse cx="82.5" cy="86" rx="4.4" ry="6.2" transform="rotate(-32 82.5 86)" fill="#FFD34A" ${O}/><path d="M85.6 89.6q-1.6 1 -3.2 .4" fill="none" stroke="#4A3020" stroke-width="1.4" stroke-linecap="round"/>`, pivot: [78.5, 81.5]},
          head: `${RG("meadow-buzz-h", [[0, "#FFF4B4"], [0.6, "#FFD650"], [1, "#F0AC2E"]], 0.42, 0.3, 0.8)}
            <path d="${puff(60, 48, 20.5, 18, 1.12)}" fill="url(#meadow-buzz-h)" ${O}/>
            <path d="M47 34Q53 30 59 30" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>`,
          top: {svg: `${LINE("M59 29.6C57.4 25 59.6 21.4 63.6 21.8C61.4 23.2 61.6 25.8 64 26.2", "#FFD34A", 2.4)}`, pivot: [60, 29]}
        },
        eyes: {lx: 51.5, rx: 68.5, y: 48.5, r: 4.6, style: "sparkle", color: "#2B1A10"},
        mouth: {x: 60, y: 57, w: 2.6, color: "#2B1A10"},
        cheeks: {lx: 45, rx: 75, y: 55, w: 3.8, h: 2.4, color: "#FF8A8A"},
        anchors: {top: [60, 28, 0.85], neck: [60, 70, 0.85], chest: [68, 89, 0.55], back: [80, 76, 0.7], hands: [60, 92, 0.8]},
        lines: {
          tap: ["Bzz! Hi! I flew straight over from the poppies!", "Busy as a bee? Same! Let's do this!", "Tiny wings, big buzz, all for you!", "You're the bee's knees, truly!", "One flower at a time, one task at a time.", "Buzzing with pride over here!", "Sweet work! Keep it humming!", "Zoom zoom! Next one!"],
          pet: ["Bzzz! My fuzz is extra fuzzy now!", "Hehe! My antennae are wiggling!"],
          hello: ["Bzz! You're back! Best day in the meadow!", "Hi hi! I saved you the sunniest flower!"],
          morning: ["Good morning! The flowers just opened!", "Morning! Fresh nectar, fresh start!"],
          night: ["Sleepy buzz. Back to the hive soon?", "The meadow is dozing. Rest soon, okay?"],
          focus: ["Soft little hum right beside you.", "Quiet wings, busy brain. Go go!"],
          done: ["Buzz buzz! What a session!", "All done! Sweet as honey!"],
          task: ["Bzz! Done!", "Checked off! Happy buzz!", "Another flower visited!", "Yes! Wings up!"],
          break: ["Break time! Flutter around a bit!", "Sip some water. Bees need it too!"]
        }
      },
      {
        id: "meadow-kiddo", name: "Kiddo", kind: "Alpine Goat Kid", pose: "stand", wearColor: "#E0533A",
        bio: "A springy goat kid with a daisy tucked behind one ear. Hops at every win.",
        idle: ["earTwitch", "tailSwish", "headTilt"], cheer: "hop",
        neck: [60, 68],
        parts: {
          tail: {svg: `<path d="M78 82C82 77 84 71 89 68C91 73 88 80 82 85Z" fill="#B8783E" ${O2}/><path d="M88.4 70.4C89.2 73 88.4 75.6 86.8 77.6" fill="none" stroke="#5A3A24" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [80, 83]},
          feet: `${["M47 90V106", "M55 91V107", "M65 91V107", "M73 90V106"].map(d => `<path d="${d}" stroke="${INK}" stroke-width="8.4" stroke-linecap="round"/><path d="${d}" stroke="#D49A5E" stroke-width="4.8" stroke-linecap="round"/>`).join("")}<g fill="#4A3226" ${OW(1.8)}><rect x="43.4" y="104" width="7.2" height="5" rx="1.8"/><rect x="51.4" y="105" width="7.2" height="5" rx="1.8"/><rect x="61.4" y="105" width="7.2" height="5" rx="1.8"/><rect x="69.4" y="104" width="7.2" height="5" rx="1.8"/></g><path d="M47 106v3M55 107v3M65 107v3M73 106v3" stroke="#8A6A56" stroke-width="1" stroke-linecap="round"/>`,
          body: `${LG("meadow-kiddo-b", [[0, "#E6B274"], [1, "#B8783E"]])}
            <path d="M52 62H68L70.6 76H49.4Z" fill="#D49A5E" ${O}/><path d="M55 64H65L66 74H54Z" fill="#F6E4C8"/>
            <ellipse cx="60" cy="84" rx="23" ry="13" fill="url(#meadow-kiddo-b)" ${O}/>
            <ellipse cx="60" cy="90" rx="12" ry="5.6" fill="#F6E4C8"/>
            <path d="M50 73Q60 79 70 73" fill="none" stroke="#9A6236" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
            <path d="M42 80q2-3 5-4" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>`,
          earL: {svg: `<path d="M45 44C37 40 28 42 23 48C29 53 38 52 45.6 49Z" fill="#C88A52" ${O2}/><path d="M42.6 46C37 44.6 31.6 46 28.4 48.6C33 50.4 38 50 42.6 48.4Z" fill="#F6B8B8"/>${daisy(31, 44, 3.4)}`, pivot: [45, 46.5]},
          earR: {svg: `<path d="M75 44C83 40 92 42 97 48C91 53 82 52 74.4 49Z" fill="#C88A52" ${O2}/><path d="M77.4 46C83 44.6 88.4 46 91.6 48.6C87 50.4 82 50 77.4 48.4Z" fill="#F6B8B8"/>`, pivot: [75, 46.5]},
          head: `${RG("meadow-kiddo-h", [[0, "#EEC48C"], [0.6, "#D49A5E"], [1, "#B07440"]], 0.42, 0.3, 0.8)}
            <path d="M50 32C47.4 26 48.2 19.6 52.6 16C54.6 21.4 56 26.6 55.4 32Z" fill="#EADCC0" ${OW(2.2)}/><path d="M70 32C72.6 26 71.8 19.6 67.4 16C65.4 21.4 64 26.6 64.6 32Z" fill="#EADCC0" ${OW(2.2)}/><path d="M50.2 26.6l4-1M50.6 22.6l3-.8M69.8 26.6l-4-1M69.4 22.6l-3-.8" stroke="#B8A47E" stroke-width="1.2" stroke-linecap="round"/>
            <path d="M42 44C42 33 50 27 60 27C70 27 78 33 78 44C78 52 76 58 72.6 62.6C69.6 66.8 65.4 69 60 69C54.6 69 50.4 66.8 47.4 62.6C44 58 42 52 42 44Z" fill="url(#meadow-kiddo-h)" ${O}/>
            <path d="M57 31Q60 29.4 63 31L63.6 53H56.4Z" fill="#F8E6CA"/>
            <path d="M46 37Q48 33 52 31.4" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`,
          face: `<path d="M57.4 67C57.2 71.4 58.6 74.6 60.8 76C61.4 72.6 63 70 62.6 67Z" fill="#F4E4CC" ${OW(1.8)}/><ellipse cx="60" cy="59.5" rx="10.4" ry="7.6" fill="#F8E2C4" ${OW(1.8)}/><ellipse cx="56.6" cy="57.6" rx="1.3" ry="1.6" fill="${INK}"/><ellipse cx="63.4" cy="57.6" rx="1.3" ry="1.6" fill="${INK}"/>`
        },
        eyes: {lx: 51, rx: 69, y: 45, r: 3.8, style: "dot", color: "#2B1A10"},
        mouth: {x: 60, y: 63.2, w: 2.2, color: "#2B1A10"},
        cheeks: {lx: 46, rx: 74, y: 52, w: 3.4, h: 2.2, color: "#FF9A9A"},
        anchors: {top: [60, 27, 0.85], neck: [60, 70, 0.85], chest: [68, 86, 0.58], back: [80, 78, 0.72], hands: [60, 88, 0.8]},
        lines: {
          tap: ["Maa! Hi! I hopped all the way down the hill!", "Boing! You're doing great!", "Little hooves, big leaps. That's you!", "Climb one rock at a time. You've got this!", "I tucked a daisy behind my ear for you!", "You're the greatest of all goats!", "Hop to it! The next one's easy!", "Steady footing, steady progress!"],
          pet: ["Maa-haha! Right behind the ears!", "Hehe! Careful, my daisy!"],
          hello: ["You're back! I did three happy hops!", "Maa! Hello! Ready to climb some tasks?"],
          morning: ["Good morning! The grass is all dewy!", "Morning! Let's bounce into today!"],
          night: ["Curling up in the soft grass soon. You too?", "The meadow is sleepy. Rest soon, okay?"],
          focus: ["Standing still as a mountain rock.", "Quiet hooves. Keep going, you're great."],
          done: ["What a session! Boing boing boing!", "All done! Top of the mountain!"],
          task: ["Maa! Done!", "Checked off! Happy hop!", "Another one! Higher and higher!", "Yes! Leap of joy!"],
          break: ["Break time! Hop around and stretch!", "Munch a snack and sip some water!"]
        }
      }
    ]
  });

  /* ================= Glowing Bay ================= */
  COMP_DATA.push({
    theme: "glowbay",
    companions: [
      {
        id: "glowbay-shelly", name: "Shelly", kind: "Sea Turtle Hatchling", pose: "sit", hatTop: true, wearColor: "#E0703A",
        bio: "Hatched on this beach under glowing waves. Still wears a bit of her egg.",
        idle: ["finWiggle", "topBob", "headTilt"], cheer: "hop",
        neck: [60, 66],
        parts: {
          back: `<ellipse cx="60" cy="107" rx="38" ry="5.6" fill="#F6E2B4" ${O}/><path d="M28 106.4q4 1.6 8 0M86 107q4 1.6 8 0" fill="none" stroke="#E2C48A" stroke-width="1.6" stroke-linecap="round"/><path d="M89 103.6L93 101.6L95.6 104.4L92 106Z" fill="#FFFDF4" ${OW(1.4)}/>`,
          feet: `<path d="M45 99C38 100 31 104 31 108C37 109.6 45 107.6 49 103Z" fill="#6CC2A0" ${O2}/><path d="M75 99C82 100 89 104 89 108C83 109.6 75 107.6 71 103Z" fill="#6CC2A0" ${O2}/>`,
          body: `${RG("glowbay-shelly-c", [[0, "#7ED2C4"], [0.6, "#3E9E98"], [1, "#2A7476"]], 0.42, 0.3, 0.8)}
            <path d="M31 87C31 71 44 63 60 63C76 63 89 71 89 87C89 99 77 106 60 106C43 106 31 99 31 87Z" fill="url(#glowbay-shelly-c)" ${O}/>
            <g fill="none" stroke="#A8EADA" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity=".85"><path d="M36 82L42 76L48 78"/><path d="M84 82L78 76L72 78"/><path d="M35 94L41 90"/><path d="M85 94L79 90"/></g>
            <g fill="#F2C060" opacity=".9"><circle cx="38" cy="88" r="1.4"/><circle cx="82" cy="88" r="1.4"/><circle cx="44" cy="70.6" r="1.2"/><circle cx="76" cy="70.6" r="1.2"/></g>
            <path d="M47 74C47 69 52 67 60 67C68 67 73 69 73 74V92C73 99.6 67.6 104 60 104C52.4 104 47 99.6 47 92Z" fill="#FBEBC0" ${OW(2.2)}/>
            <path d="M47.6 81H72.4M47.6 92H72.4M60 67.4V103.6" fill="none" stroke="#E2C88A" stroke-width="1.6" stroke-linecap="round"/>`,
          armL: {svg: `${RG("glowbay-shelly-l", [[0, "#A4E4C4"], [1, "#5EB894"]], 0.6, 0.3, 0.9)}<path d="M44 76C36 77 26 84 21 94C27 97.6 37 93 45.6 84Z" fill="url(#glowbay-shelly-l)" ${O}/><g fill="#3E9E80" opacity=".6"><circle cx="31" cy="88" r="1.5"/><circle cx="37" cy="83" r="1.3"/><circle cx="27" cy="93" r="1.1"/></g>`, pivot: [44, 79]},
          armR: {svg: `${RG("glowbay-shelly-r", [[0, "#A4E4C4"], [1, "#5EB894"]], 0.4, 0.3, 0.9)}<path d="M76 76C84 77 94 84 99 94C93 97.6 83 93 74.4 84Z" fill="url(#glowbay-shelly-r)" ${O}/><g fill="#3E9E80" opacity=".6"><circle cx="89" cy="88" r="1.5"/><circle cx="83" cy="83" r="1.3"/><circle cx="93" cy="93" r="1.1"/></g>`, pivot: [76, 79]},
          head: `${RG("glowbay-shelly-h", [[0, "#C4F2D6"], [0.6, "#82D4AE"], [1, "#4EAE88"]], 0.42, 0.3, 0.8)}
            <path d="M40 47C40 35 49 28 60 28C71 28 80 35 80 47C80 58 71 66 60 66C49 66 40 58 40 47Z" fill="url(#glowbay-shelly-h)" ${O}/>
            <g fill="#4EAE88" opacity=".55"><circle cx="45" cy="40" r="1.8"/><circle cx="76" cy="44" r="1.5"/><circle cx="73" cy="38" r="1.2"/></g>
            ${shine(46, 37, 4.2, 2.2, -38)}`,
          top: {svg: `<path d="M44.6 35C45.4 25 52 19 60 19C68 19 74.6 25 75.4 35L71.6 31.4L67.8 35.6L64 31L60 35.4L56 31L52.2 35.6L48.4 31.4Z" fill="#FFFDF4" ${O2}/><path d="M50 27Q53 23 57 22" fill="none" stroke="#E8E2D2" stroke-width="1.8" stroke-linecap="round"/><circle cx="68" cy="25" r="1.3" fill="#F2DDB0"/>`, pivot: [60, 33]}
        },
        eyes: {lx: 51, rx: 69, y: 47, r: 4.4, style: "sparkle", color: "#14303A"},
        mouth: {x: 60, y: 56, w: 2.6, color: "#14303A"},
        cheeks: {lx: 45, rx: 75, y: 54, w: 3.6, h: 2.3, color: "#FF9AA8"},
        anchors: {top: [60, 26, 0.85], neck: [60, 67, 0.88], chest: [66, 90, 0.58], back: [84, 80, 0.75], hands: [60, 92, 0.8]},
        lines: {
          tap: ["Hi! I'm small, but I made it to the sea!", "Flip, flap! You're doing great!", "Slow and steady wins. Turtle promise!", "Every big journey starts with tiny flippers.", "I still have my eggshell hat. Cute, right?", "Paddle on! The next one's close!", "You've got a strong shell. Keep going!", "Little steps all the way to the waves!"],
          pet: ["Hehe! My shell is ticklish!", "Ooh, careful with my eggshell hat!"],
          hello: ["You're here! I waddled up the beach for you!", "Hi hi! The bay is so sparkly today!"],
          morning: ["Good morning! The sand is warm already!", "Morning! Let's paddle into a good day!"],
          night: ["The waves are glowing. Time to rest soon.", "Tucking into my shell soon. You rest too!"],
          focus: ["Paddling quietly right beside you.", "Slow and steady. You've got this."],
          done: ["What a session! Happy flipper flaps!", "All done! We reached the sea!"],
          task: ["Flap! Done!", "Checked off! Turtle cheer!", "Another one! Steady wins!", "Yes! Splash!"],
          break: ["Break time! Float and breathe slowly.", "Rest a bit and sip some water!"]
        }
      },
      {
        id: "glowbay-lumi", name: "Lumi", kind: "Glow Droplet", pose: "float", wearColor: "#7A5AE0",
        bio: "A drop of glowing seawater that shines brighter with every splash.",
        idle: ["sway", "sparkle", "topBob"], cheer: "spin",
        parts: {
          back: `<circle cx="60" cy="68" r="40" fill="#7AF0FF" opacity=".18"/><circle cx="60" cy="68" r="32" fill="#9FF6FF" opacity=".22"/>
            <ellipse cx="60" cy="102" rx="31" ry="6.5" fill="#4FD2EE" ${O2}/><path d="M38 101q4 2 8 0M74 102q4 2 8 0" fill="none" stroke="#C8FAFF" stroke-width="1.8" stroke-linecap="round"/>`,
          body: `${RG("glowbay-lumi-b", [[0, "#F2FFFF"], [0.45, "#8CF0FF"], [1, "#22AEDC"]], 0.42, 0.55, 0.75)}
            <path d="M60 30C66 44 86 57 86 75C86 91 74 100 60 100C46 100 34 91 34 75C34 57 54 44 60 30Z" fill="url(#glowbay-lumi-b)" ${O}/>
            <path d="M42 84Q51 90 60 86T78 84" fill="none" stroke="#E8FFFF" stroke-width="2" stroke-linecap="round" opacity=".8"/>
            ${shine(48, 58, 3.4, 7, 20)}<circle cx="52" cy="48" r="1.8" fill="#fff" opacity=".9"/>
            ${twinkle(76, 66, 2.6, "#fff")}${twinkle(44, 92, 2, "#E8FFFF")}`,
          armL: {svg: `<ellipse cx="31" cy="80" rx="5" ry="6.4" transform="rotate(30 31 80)" fill="#8CEEFF" ${O}/>`, pivot: [36, 78]},
          armR: {svg: `<ellipse cx="89" cy="80" rx="5" ry="6.4" transform="rotate(-30 89 80)" fill="#8CEEFF" ${O}/>`, pivot: [84, 78]},
          top: {svg: `<path d="M60 12L62.2 17.8L68 20L62.2 22.2L60 28L57.8 22.2L52 20L57.8 17.8Z" fill="#FFF6B8" ${OW(1.8)}/>${twinkle(70, 12, 2.4, "#B8F8FF")}`, pivot: [60, 28]}
        },
        eyes: {lx: 51, rx: 69, y: 73, r: 4.2, style: "sparkle", color: "#163050"},
        mouth: {x: 60, y: 82, w: 2.8, color: "#163050"},
        cheeks: {lx: 44, rx: 76, y: 80, w: 4, h: 2.4, color: "#FF9AC8"},
        anchors: {top: [60, 34, 0.8], neck: [60, 97, 0.9], chest: [72, 88, 0.6], back: [84, 66, 0.75], hands: [60, 92, 0.85]},
        lines: {
          tap: ["Hi! I glow brighter when you're around!", "Make a splash, watch me sparkle!", "Little drop, big shine. That's you!", "You light up the whole bay!", "Every wave starts with one drop.", "Glow on! You're doing amazing!", "Ripples of good work, all the way out."],
          pet: ["Eee! I'm all sparkly now!", "Hehe, I wobbled! Do it again!"],
          hello: ["You're here! Let's make some waves!", "Hello! The whole bay just lit up!"],
          morning: ["Good morning! I'm saving my glow for tonight.", "Morning! The water is clear and bright."],
          night: ["Look how the waves glow! Rest soon, okay?", "Night swim of dreams soon. Sleep well!"],
          focus: ["Glowing softly right beside you.", "Quiet water, bright mind."],
          done: ["What a session! I'm positively glowing!", "Done! That made the whole bay sparkle!"],
          task: ["Splash! Another one done!", "Checked off! Look at me glow!", "Yes! Sparkle, sparkle!", "Done! Making waves!"],
          break: ["Break time! Float and breathe.", "Rest a little. Sip some water, of course!"]
        }
      },
      {
        id: "glowbay-hermie", name: "Hermie", kind: "Blue Hermit Crab", pose: "sit", wearColor: "#F2B53A",
        bio: "A tiny blue hermit crab who carries his home everywhere and never feels lost.",
        idle: ["wave", "headTilt", "sway"], cheer: "hop",
        neck: [60, 95],
        parts: {
          back: `${RG("glowbay-hermie-s", [[0, "#FFF6E6"], [0.6, "#F8D6B4"], [1, "#E8A88A"]], 0.4, 0.3, 0.85)}
            <path d="M84 36C87 29 93 26 97 27.6C97.6 32.6 94.6 38.6 90 42Z" fill="#F8D6B4" ${O2}/>
            <path d="M29 78C24 58 34 36 56 30C70 26 84 30 90 40C95 48 94 60 92 70C89 84 76 93 60 93C45 93 33 88 29 78Z" fill="url(#glowbay-hermie-s)" ${O}/>
            <path d="M72 46a3 3 0 0 1 6 0a6 6 0 0 1-12 0a9 9 0 0 1 18 0a12 12 0 0 1-24 0a15 15 0 0 1 15-15" fill="none" stroke="#E07A8A" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M33 70Q36 50 52 40" fill="none" stroke="#F2B49A" stroke-width="3" stroke-linecap="round" opacity=".8"/>
            <g fill="#7AF0FF" ${OW(1.2)}><circle cx="36" cy="62" r="2"/><circle cx="88" cy="68" r="1.8"/><circle cx="46" cy="44" r="1.6"/></g>
            ${twinkle(86, 58, 3, "#FFF6B8")}${shine(42, 46, 5.4, 2.4, -50)}`,
          feet: `${["M46 98Q39 101 36 108", "M50 100Q46 104 45 109", "M74 98Q81 101 84 108", "M70 100Q74 104 75 109"].map(d => LINE(d, "#4E86D8", 2.6)).join("")}`,
          body: `${LG("glowbay-hermie-b", [[0, "#7AAEF2"], [1, "#3E6EC4"]])}<ellipse cx="60" cy="99" rx="15" ry="7" fill="url(#glowbay-hermie-b)" ${O}/>`,
          armL: {svg: `${LINE("M45 90Q39 93 35 92", "#4E86D8", 3)}${RG("glowbay-hermie-l", [[0, "#A8CCFF"], [0.6, "#5A92E2"], [1, "#3A68BE"]], 0.4, 0.35, 0.8)}<path d="M33.6 82.4L29 89.4L35.4 87.6C36.6 94 32.6 99 26.6 99C20.6 99 16.6 94.4 16.6 88.6C16.6 82.6 21 78.6 26.6 78.6C30 78.6 32.4 80 33.6 82.4Z" fill="url(#glowbay-hermie-l)" ${O}/><path d="M28.6 78.8C30.4 75 35.4 74.4 37.6 77.8C38.6 79.6 38 82 36.6 84L29.4 88.6Z" fill="#5A92E2" ${O2}/><path d="M21 86Q22 82 25.6 81" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>`, pivot: [45, 90]},
          armR: {svg: `${LINE("M75 91Q80 93 84 92.6", "#4E86D8", 3)}<path d="M86 86.6L89 91.4L85 90.6C84.6 95 87 98 91 98C95 98 97.6 95 97.6 91.4C97.6 87.6 95 85 91.4 85C89.2 85 87.2 85.6 86 86.6Z" fill="#5A92E2" ${O2}/><path d="M90 85C89.6 82.4 92.6 80.6 94.6 82.4C95.6 83.4 95.4 85 94.4 86.4L89.6 91Z" fill="#5A92E2" ${OW(2)}/>`, pivot: [75, 91]},
          head: `${RG("glowbay-hermie-h", [[0, "#B4D4FF"], [0.6, "#6A9EEA"], [1, "#3E6EC4"]], 0.42, 0.3, 0.8)}
            ${LINE("M55 70Q53 62 50.6 56", "#4E86D8", 2.6)}${LINE("M65 70Q67 62 69.4 56", "#4E86D8", 2.6)}
            <circle cx="50" cy="52" r="6.4" fill="#fff" ${OW(2.4)}/><circle cx="70" cy="52" r="6.4" fill="#fff" ${OW(2.4)}/>
            <path d="M41 82C41 72 49 66 60 66C71 66 79 72 79 82C79 90 71 95 60 95C49 95 41 90 41 82Z" fill="url(#glowbay-hermie-h)" ${O}/>
            <path d="M46 75Q49 70 55 69" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".75"/>`
        },
        eyes: {lx: 50, rx: 70, y: 52, r: 3.8, style: "dot", color: "#1A2440"},
        mouth: {x: 60, y: 84, w: 2.6, color: "#1A2440"},
        cheeks: {lx: 48, rx: 72, y: 82, w: 3.6, h: 2.2, color: "#FF9AC0"},
        anchors: {top: [60, 66, 0.75], neck: [60, 95, 0.8], chest: [66, 100, 0.5], back: [80, 52, 0.75], hands: [60, 100, 0.75]},
        lines: {
          tap: ["Hi! I brought my whole house to see you!", "Snip snap! You're doing great!", "Home is wherever we study together!", "Little claws, big cheers!", "Pinch me, you're doing amazing!", "Scuttle on to the next one!", "I came out of my shell just for you!", "Sideways or forward, progress is progress!"],
          pet: ["Hehe! Snip snap, that tickles!", "Ooh, careful, that's my shell!"],
          hello: ["You're back! I scuttled right over!", "Hi hi! Want to see my shiny shell?"],
          morning: ["Good morning! Low tide, high hopes!", "Morning! My shell is all sparkly today!"],
          night: ["Tucking into my shell soon. You rest too!", "The bay is glowing. Sweet dreams later!"],
          focus: ["Quiet as a crab in a shell.", "Claws down, focus up. You've got this."],
          done: ["What a session! Claws in the air!", "Done! Time for a happy scuttle!"],
          task: ["Snip! Done!", "Checked off! Claw five!", "Another one! Snap snap!", "Yes! Happy scuttle!"],
          break: ["Break time! Wiggle like a crab!", "Peek out and rest your eyes a bit!"]
        }
      }
    ]
  });
})();
