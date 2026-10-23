/* ===== module: 98-comp-greece.js ===== */
/* Study Companions, Around the World */
(() => {
  const {INK, O, OW, LG, RG, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const f1 = v => Math.round(v * 10) / 10;
  const twinkle = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${c || "#fff"}"/>`;
  // a pointed olive leaf from (x, y), len long, turned by ang degrees
  const oleaf = (x, y, len, w, ang, fill, extra = "") => `<path d="M0 0Q${f1(len * 0.45)} ${f1(-w)} ${len} 0Q${f1(len * 0.45)} ${w} 0 0Z" transform="translate(${x} ${y}) rotate(${ang})" fill="${fill}" ${extra}/>`;

  COMP_DATA.push({
    theme: "greece",
    companions: [
      {
        id: "greece-kiki", name: "Kiki", kind: "Island Cat", pose: "sit", sleepy: true, wearColor: "#2F6DB8",
        bio: "A sun-loving island cat who naps on warm walls and wakes up for every win.",
        idle: ["tailSwish", "earTwitch", "headTilt"], cheer: "hop",
        neck: [60, 78],
        parts: {
          tail: {svg: `${LG("greece-kiki-t", [[0, "#F2B06A"], [1, "#D9853E"]])}
            <path d="M80 102C94 103 104 94 103 80C102 72 97 69 93.6 72.4C91.4 75 95.6 78 95.4 84C95 91 89 95 80 95Z" fill="url(#greece-kiki-t)" ${O}/>
            <path d="M97 80.5l-5.2 1.2M99 88l-5.6 -0.6M93.6 95l-4 -3.4" fill="none" stroke="#C26E2C" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M95.2 73.6C97.4 72.2 100.4 73.6 101 77" fill="none" stroke="#FFF8EE" stroke-width="3" stroke-linecap="round"/>`, pivot: [82, 99]},
          feet: `<ellipse cx="47" cy="107.6" rx="8.6" ry="4.6" fill="#FFFDF8" ${O}/><ellipse cx="73" cy="107.6" rx="8.6" ry="4.6" fill="#FFFDF8" ${O}/>
            <path d="M44.6 109.4v-2.2M48.4 109.6v-2.2M70.6 109.6v-2.2M74.4 109.4v-2.2" stroke="#D8CFC6" stroke-width="1.2" stroke-linecap="round"/>`,
          body: `${RG("greece-kiki-b", [[0, "#FFFFFF"], [0.7, "#FFF8EE"], [1, "#EEDFCF"]], 0.4, 0.35, 0.75)}
            <path d="M60 68C76 68 84 81 84 94C84 106 76 110 60 110C44 110 36 106 36 94C36 81 44 68 60 68Z" fill="url(#greece-kiki-b)" ${O}/>
            <path d="M73.6 75C81 80.6 84 91 82.8 101.4C78 98 73.8 89 72 79Z" fill="#EFA460"/>
            <path d="M75.6 84l4.6 -1.2M76.6 91l4.8 -0.4" stroke="#D2823C" stroke-width="2" stroke-linecap="round"/>
            <path d="M46 80Q60 86 74 80" fill="none" stroke="#2F6DB8" stroke-width="3.6" stroke-linecap="round"/>
            <circle cx="60" cy="85.6" r="3.2" fill="#F2C24A" ${OW(1.5)}/><path d="M58.6 86.4h2.8" stroke="#A8761E" stroke-width="1" stroke-linecap="round"/>
            <path d="M42 90Q42 80 48 75" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/>`,
          armL: {svg: `<ellipse cx="50.5" cy="100" rx="5.6" ry="7.4" fill="#FFFDF8" ${O}/><path d="M48.6 105.4v-2M52.4 105.4v-2" stroke="#D8CFC6" stroke-width="1.1" stroke-linecap="round"/>`, pivot: [50.5, 93]},
          armR: {svg: `<ellipse cx="69.5" cy="100" rx="5.6" ry="7.4" fill="#FFFDF8" ${O}/><path d="M67.6 105.4v-2M71.4 105.4v-2" stroke="#D8CFC6" stroke-width="1.1" stroke-linecap="round"/>`, pivot: [69.5, 93]},
          earL: {svg: `<path d="M37.6 46L39.4 23.6L55 37Z" fill="#FFFDF8" ${O}/><path d="M41.2 40.6L42 29.6L49.4 36.4Z" fill="#FFB6C6"/>`, pivot: [46, 40]},
          earR: {svg: `<path d="M82.4 46L80.6 23.6L65 37Z" fill="#EFA460" ${O}/><path d="M78.8 40.6L78 29.6L70.6 36.4Z" fill="#FFB6C6"/>`, pivot: [74, 40]},
          head: `${RG("greece-kiki-h", [[0, "#FFFFFF"], [0.72, "#FFF9F0"], [1, "#EEDFCF"]], 0.42, 0.34, 0.78)}
            <path d="M60 33C78 33 87 44 87 57C87 71 76 79.5 60 79.5C44 79.5 33 71 33 57C33 44 42 33 60 33Z" fill="url(#greece-kiki-h)" ${O}/>
            <path d="M64.4 34.4C76 35.6 84.6 44 85.8 55C79 52.4 71.4 46.6 67 40.6Z" fill="#EFA460"/>
            <path d="M56 37.6l0.8 5.4M60 36.8v6M64 37.8l-0.4 4.6" stroke="#E29A55" stroke-width="2" stroke-linecap="round"/>
            <path d="M39.4 51Q41.4 43 48 39.4" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
          face: `<path d="M57.6 62.4H62.4L60 65Z" fill="#FF94AC" ${OW(1.2)}/>
            <path d="M42 63.6l-9 -1.8M42 67.2l-9 1M78 63.6l9 -1.8M78 67.2l9 1" stroke="${INK}" stroke-width="1.2" stroke-linecap="round" opacity=".55"/>`
        },
        eyes: {lx: 49.5, rx: 70.5, y: 56.5, r: 5, style: "round", color: "#3C6A2C"},
        mouth: {x: 60, y: 67.6, w: 2.8, color: "#3A2A2A", style: "cat"},
        cheeks: {lx: 42.5, rx: 77.5, y: 64.6, w: 4.2, h: 2.4, color: "#FFA6BA"},
        anchors: {top: [60, 34, 0.95], neck: [60, 80, 1], chest: [60, 94, 0.62], back: [84, 88, 0.8], hands: [60, 100, 0.86]},
        lines: {
          tap: ["Yawn... oh, hello! I was just sunbathing.", "Every warm wall in Oia knows my name!", "You're doing great. I'm doing a nap. Teamwork!", "Purr... one page at a time, friend.", "I saved you the sunniest spot on the steps!", "Sea breeze, warm stones and you studying. Perfect.", "Blue doors, white walls, big brains. That's you!", "Slow blink for you. That means I like you!"],
          pet: ["Purrrr! Right behind the ears, yes!", "Mrrp! Warmer than a sunny wall!"],
          hello: ["Meow! You're back! The wall got lonely.", "Hi! I stretched and everything for you!"],
          morning: ["Kalimera! The sun is on my favorite step!", "Good morning! The sea is extra blue today."],
          night: ["The lights are on in the village. Rest soon?", "Kalinychta! I'm curling up by the bell tower."],
          focus: ["Shh. Tail tucked, eyes half shut, focusing.", "I'll guard your notes. Nobody sits on them."],
          done: ["Session done! Time for a celebratory stretch!", "That was amazing! Purrs all round!"],
          task: ["Done! I woke up just to cheer!", "Checked off! Meow meow!", "Another one! My tail is swishing!", "Yes! Worth getting off the wall for!"],
          break: ["Break time! Find a sunny spot and stretch!", "Stretch like a cat! Long, long, longer!"]
        }
      },
      {
        id: "greece-elia", name: "Elia", kind: "Olive Sprite", pose: "float", wearColor: "#5E8A3A",
        bio: "A small olive sprite who is quietly strong and keeps going year after year.",
        idle: ["sway", "topBob", "sparkle"], cheer: "spin",
        parts: {
          armL: {svg: `${oleaf(37, 80, 23, 6.6, 158, "#9EB884", O2)}<path d="M36 80L22 84.6" stroke="#6E8A54" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>`, pivot: [36, 80]},
          armR: {svg: `${oleaf(83, 80, 23, 6.6, 22, "#9EB884", O2)}<path d="M84 80L98 84.6" stroke="#6E8A54" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>`, pivot: [84, 80]},
          body: `${RG("greece-elia-b", [[0, "#C6DE8A"], [0.55, "#93BA58"], [1, "#5E8A34"]], 0.4, 0.32, 0.78)}
            <path d="M60 41C79 41 87.6 57 87.6 74C87.6 92 76.6 104.4 60 104.4C43.4 104.4 32.4 92 32.4 74C32.4 57 41 41 60 41Z" fill="url(#greece-elia-b)" ${O}/>
            <path d="M41.6 66C42.6 56 48 48.6 55 45.4" fill="none" stroke="#F2FAD8" stroke-width="3.4" stroke-linecap="round" opacity=".9"/><circle cx="41.4" cy="73.4" r="1.8" fill="#F2FAD8" opacity=".85"/>
            <path d="M48 98Q60 103 72 98" fill="none" stroke="#557E2E" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>
            <ellipse cx="60" cy="42.4" rx="4.2" ry="1.8" fill="#6E5A3A" ${OW(1.4)}/>
            ${twinkle(98, 54, 3.6, "#E8F2B0")}${twinkle(22, 98, 2.8, "#E8F2B0")}`,
          top: {svg: `${LINE("M60 42Q59 34 62 26", "#7A5A3A", 2.4)}
            ${oleaf(61, 33, 22, 5.2, -152, "#A9C08E", O2)}<path d="M60 33.4L42 26" stroke="#7A9460" stroke-width="1.1" stroke-linecap="round"/>
            ${oleaf(62, 29, 24, 5.4, -28, "#8FAE72", O2)}<path d="M62.6 28.6L82 18" stroke="#6E8A54" stroke-width="1.1" stroke-linecap="round"/>
            <ellipse cx="66.4" cy="35.4" rx="4" ry="5" transform="rotate(-24 66.4 35.4)" fill="#3E3450" ${OW(1.6)}/><circle cx="65" cy="33.4" r="1.2" fill="#fff" opacity=".7"/>`, pivot: [60, 42]}
        },
        eyes: {lx: 50.5, rx: 69.5, y: 71, r: 4.6, style: "sparkle", color: "#22301A"},
        mouth: {x: 60, y: 81, w: 3, color: "#22301A"},
        cheeks: {lx: 44, rx: 76, y: 79, w: 3.8, h: 2.3, color: "#F29A88"},
        anchors: {top: [60, 41, 0.9], neck: [60, 95, 0.95], chest: [69, 90, 0.6], back: [86, 66, 0.8], hands: [60, 97, 0.82]},
        lines: {
          tap: ["Hello! Olive trees grow slowly, and that's okay.", "Steady roots, steady study. You've got this.", "A little sunshine, a little water, a lot of focus.", "Some olive trees are a thousand years old! Patience!", "Small and green, but I don't give up. Neither do you!", "Every leaf counts. So does every flashcard.", "You're stronger than you think, like an olive branch.", "Peace and quiet, and one good idea at a time."],
          pet: ["Hehe! My leaves are all fluttery now!", "Aww, that's as nice as a warm afternoon!"],
          hello: ["You're here! My leaves turned to the sun!", "Hi! Ready to grow a little today?"],
          morning: ["Good morning! Roots down, leaves up!", "Kalimera! The terraces are glowing gold."],
          night: ["The olive groves are sleeping. Rest soon?", "Goodnight! Strong roots need good sleep."],
          focus: ["Rooted right here beside you.", "Slow and steady. Leaves still, mind clear."],
          done: ["What a session! You grew a whole ring!", "All done! That was centuries of patience!"],
          task: ["Done! A new leaf unfurled!", "Checked off! Strong as an old olive!", "Another one! Steady and sure!", "Yes! Growing, growing, grown!"],
          break: ["Break time! Drink some water, like a tree!", "Stretch your branches! Up to the sun!"]
        }
      },
      {
        id: "greece-glafka", name: "Glafka", kind: "Little Owl", pose: "stand", wearColor: "#2F6DB8",
        bio: "A wise little owl who stays up late studying with you.",
        idle: ["headTilt", "wingFlutter", "topBob"], cheer: "wingFlutter",
        neck: [60, 74],
        parts: {
          feet: `<path d="M47 106.4l-3 4.6M50 107l0 4.6M53 106.4l3 4.6M67 106.4l-3 4.6M70 107l0 4.6M73 106.4l3 4.6" stroke="${INK}" stroke-width="5.4" stroke-linecap="round"/>
            <path d="M47 106.4l-3 4.6M50 107l0 4.6M53 106.4l3 4.6M67 106.4l-3 4.6M70 107l0 4.6M73 106.4l3 4.6" stroke="#D8C49A" stroke-width="2.6" stroke-linecap="round"/>`,
          body: `${RG("greece-glafka-b", [[0, "#C49A70"], [0.65, "#A47A52"], [1, "#7E5838"]], 0.42, 0.35, 0.78)}
            <path d="M60 62C80 62 88.4 78 88.4 92C88.4 104 78 109.4 60 109.4C42 109.4 31.6 104 31.6 92C31.6 78 40 62 60 62Z" fill="url(#greece-glafka-b)" ${O}/>
            <path d="M60 74C71 74 76.4 85 76.4 95C76.4 103.6 70 107.4 60 107.4C50 107.4 43.6 103.6 43.6 95C43.6 85 49 74 60 74Z" fill="#F4E6CC"/>
            <path d="M52 82v4M60 80v5M68 82v4M48.6 91v4M55.6 90v5M64.4 90v5M71.4 91v4M52 99v4M60 98v5M68 99v4" stroke="#B08A60" stroke-width="2" stroke-linecap="round"/>`,
          armL: {svg: `${LG("greece-glafka-w", [[0, "#B08660"], [1, "#7A5434"]])}<path d="M38.4 72C28.6 77 25 91 30 103.4C35.6 101.6 41 92 42.4 78Z" fill="url(#greece-glafka-w)" ${O}/>
            <circle cx="34" cy="86" r="1.6" fill="#F4E6CC"/><circle cx="33" cy="94" r="1.5" fill="#F4E6CC"/><circle cx="37.6" cy="80" r="1.4" fill="#F4E6CC"/>`, pivot: [40, 74]},
          armR: {svg: `<path d="M81.6 72C91.4 77 95 91 90 103.4C84.4 101.6 79 92 77.6 78Z" fill="url(#greece-glafka-w)" ${O}/>
            <circle cx="86" cy="86" r="1.6" fill="#F4E6CC"/><circle cx="87" cy="94" r="1.5" fill="#F4E6CC"/><circle cx="82.4" cy="80" r="1.4" fill="#F4E6CC"/>`, pivot: [80, 74]},
          head: `${RG("greece-glafka-h", [[0, "#C8A078"], [0.7, "#A47A52"], [1, "#82603E"]], 0.42, 0.32, 0.8)}
            <path d="M60 25C82 25 92.4 37 92.4 51C92.4 67 78.6 75.6 60 75.6C41.4 75.6 27.6 67 27.6 51C27.6 37 38 25 60 25Z" fill="url(#greece-glafka-h)" ${O}/>
            ${[[44, 31], [52, 28.6], [68, 28.6], [76, 31], [36, 37], [84, 37], [60, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="#F4E6CC"/>`).join("")}
            <ellipse cx="47.6" cy="53" rx="12.4" ry="11.4" fill="#EEDCBC"/><ellipse cx="72.4" cy="53" rx="12.4" ry="11.4" fill="#EEDCBC"/>
            <circle cx="48" cy="52.6" r="8.2" fill="#F6C93A" ${OW(1.6)}/><circle cx="72" cy="52.6" r="8.2" fill="#F6C93A" ${OW(1.6)}/>
            <path d="M36.4 43.4Q45 36.4 56.4 37.6M83.6 43.4Q75 36.4 63.6 37.6" fill="none" stroke="#FFFBF2" stroke-width="3.2" stroke-linecap="round"/>`,
          face: `<path d="M57 59.6Q60 58 63 59.6L60 65.4Z" fill="#D8C49A" ${OW(1.4)}/>`,
          top: {svg: `${LINE("M60 27Q66 22 74 21", "#7A5A3A", 1.8)}
            ${oleaf(66, 24, 14, 3.6, -150, "#9EB884", OW(1.6))}${oleaf(70, 22, 15, 3.8, -40, "#8FAE72", OW(1.6))}
            <ellipse cx="74.6" cy="25.4" rx="2.8" ry="3.6" transform="rotate(-20 74.6 25.4)" fill="#3E3450" ${OW(1.3)}/>`, pivot: [62, 27]}
        },
        eyes: {lx: 48, rx: 72, y: 52.6, r: 5, style: "sparkle", color: "#24180E"},
        mouth: {x: 60, y: 68.6, w: 2.4, color: "#3A2614"},
        cheeks: {lx: 38, rx: 82, y: 63, w: 3.8, h: 2.2, color: "#F49A8A"},
        anchors: {top: [60, 26, 0.95], neck: [60, 76, 1], chest: [60, 92, 0.66], back: [86, 86, 0.8], hands: [60, 100, 0.86]},
        lines: {
          tap: ["Hoo! A wise owl knows when to review.", "Questions are how wisdom starts. Ask away!", "I've read every scroll in the library twice!", "Night or day, I'm here to study with you.", "Big eyes, big ideas, small owl. Hello!", "Think it through slowly. The answer will come.", "Knowledge is the best treasure. You're rich!", "Hoo hoo! That's owl for 'you're doing great.'"],
          pet: ["Hoo! My feathers are all fluffed up now!", "Aww, softer than a moonlit breeze!"],
          hello: ["Hoo! You're back! I kept the lamp lit.", "Hello, scholar! Shall we begin?"],
          morning: ["Morning already? I was up studying all night!", "Kalimera! Fresh minds learn the most."],
          night: ["Ah, my favorite hour. But you need sleep!", "Kalinychta! Even wise owls rest their eyes."],
          focus: ["Silent wings, sharp mind. Let's focus.", "I'm watching the page with you. Hoo."],
          done: ["What a wise session! I'm very proud!", "All done! That deserves a happy hoot!"],
          task: ["Done! Hoo hoo!", "Checked off! Very wise!", "Another one! My wings are flapping!", "Yes! Wise and wonderful!"],
          break: ["Break time! Rest those clever eyes.", "Stretch your wings! Big, slow flaps!"]
        }
      }
    ]
  });
})();
/* end of module 98-comp-greece.js */


