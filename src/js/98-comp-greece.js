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
        parts: (() => {
          const HEAD = "M60 30.5C77.5 30.5 89.5 41 90 55.5C90.3 63 88.6 68.4 85.4 72.4C80 78.6 70.6 81.4 60 81.4C49.4 81.4 40 78.6 34.6 72.4C31.4 68.4 29.7 63 30 55.5C30.5 41 42.5 30.5 60 30.5Z";
          const BODY = "M60 69C71.5 69 79 77 81.6 87.5C87.6 91 90 99 88 104.6C86.6 108.6 82 110.4 76 110.4H44C38 110.4 33.4 108.6 32 104.6C30 99 32.4 91 38.4 87.5C41 77 48.5 69 60 69Z";
          const TAIL = "M79 104C92 106.5 100.6 100.4 100.6 88.6C100.6 80 97 75 92.4 73";
          const ear = (fill, x) => {
            const m = v => f1(x ? 120 - v : v);
            return `<path d="M${m(37)} 62C${m(31.6)} 48 ${m(31)} 32 ${m(34.6)} 21.4C${m(35.4)} 19 ${m(37.8)} 18.2 ${m(39.8)} 19.6C${m(46.4)} 24.2 ${m(52.4)} 30 ${m(57.4)} 36.4Z" fill="${fill}" ${O}/>
              <path d="M${m(37.4)} 46C${m(36.6)} 38 ${m(37)} 30.6 ${m(38.6)} 25.4C${m(43)} 28.6 ${m(47.4)} 33 ${m(50.6)} 37.6Z" fill="url(#greece-kiki-in)"/>`;
          };
          const leg = x => `<path d="M${f1(x - 5.8)} 95C${f1(x - 5.8)} 91.6 ${f1(x - 3.4)} 89.6 ${x} 89.6C${f1(x + 3.4)} 89.6 ${f1(x + 5.8)} 91.6 ${f1(x + 5.8)} 95V100.6C${f1(x + 6.8)} 102.6 ${f1(x + 7)} 109.8 ${x} 109.8C${f1(x - 7)} 109.8 ${f1(x - 6.8)} 102.6 ${f1(x - 5.8)} 100.6Z" fill="url(#greece-kiki-leg)" ${O}/>
            <path d="M${f1(x - 1.9)} 109V106.2M${f1(x + 1.9)} 109V106.2" stroke="#CDB8A4" stroke-width="1.4" stroke-linecap="round"/>`;
          return {
            tail: {svg: `<path d="${TAIL}" fill="none" stroke="${INK}" stroke-width="12.6" stroke-linecap="round"/>
              <path d="${TAIL}" fill="none" stroke="#F0A65E" stroke-width="6.6" stroke-linecap="round"/>
              <path d="${TAIL}" fill="none" stroke="#D27C36" stroke-width="6.6" stroke-dasharray="3.4 5.6" stroke-dashoffset="-13"/>
              <path d="M95.4 74.6C94.5 73.9 93.5 73.4 92.4 73" fill="none" stroke="#FFFDF8" stroke-width="6.6" stroke-linecap="round"/>`, pivot: [82, 103]},
            body: `${RG("greece-kiki-b", [[0, "#FFFFFF"], [0.62, "#FFF8EF"], [1, "#EADAC7"]], 0.45, 0.3, 0.8)}
              <defs><clipPath id="greece-kiki-bc"><path d="${BODY}"/></clipPath></defs>
              <path d="${BODY}" fill="url(#greece-kiki-b)"/>
              <g clip-path="url(#greece-kiki-bc)">
                <path d="M28 82C35 80.6 40.6 84 41.6 91.6C42.4 98.4 39.6 104.6 28 106Z" fill="#EFA05A"/>
                <path d="M31 89.6q4.4 -1.4 7.6 1.2M30.6 96.8q4.6 -1 7.8 1.8" fill="none" stroke="#D27C36" stroke-width="2.2" stroke-linecap="round"/>
                <path d="M81.6 87.5C78.6 92 77.6 99 79 106" fill="none" stroke="#E6D3BF" stroke-width="2.2" stroke-linecap="round"/>
                <path d="M38.4 87.5C41.4 92 42.4 99 41 106" fill="none" stroke="#D88E48" stroke-width="2.2" stroke-linecap="round"/>
                <path d="M36 79.4Q60 92.6 84 79.4" fill="none" stroke="${INK}" stroke-width="7.4" stroke-linecap="round"/>
                <path d="M36 79.4Q60 92.6 84 79.4" fill="none" stroke="#2F6DB8" stroke-width="4.2" stroke-linecap="round"/>
                <path d="M45 82.6Q52 85.4 56 85.8" fill="none" stroke="#7FA9E0" stroke-width="1.4" stroke-linecap="round"/>
              </g>
              <path d="${BODY}" fill="none" ${O}/>
              ${RG("greece-kiki-bell", [[0, "#FFF2B8"], [0.5, "#F4C64A"], [1, "#D49A22"]], 0.38, 0.32, 0.72)}
              <circle cx="60" cy="89.4" r="3.8" fill="url(#greece-kiki-bell)" ${OW(1.6)}/><path d="M58.4 90.6h3.2" stroke="#8A5E14" stroke-width="1.2" stroke-linecap="round"/>
              <ellipse cx="38.6" cy="108.2" rx="6.8" ry="3.9" fill="#FFFDF8" ${O}/><ellipse cx="81.4" cy="108.2" rx="6.8" ry="3.9" fill="#FFFDF8" ${O}/>
              <path d="M36.4 110.6V108.6M40.8 110.6V108.6M79.2 110.6V108.6M83.6 110.6V108.6" stroke="#CDB8A4" stroke-width="1.4" stroke-linecap="round"/>`,
            armL: {svg: `${LG("greece-kiki-leg", [[0, "#FFF8EF"], [1, "#FFFFFF"]])}${leg(48.5)}`, pivot: [48.5, 93]},
            armR: {svg: leg(71.5), pivot: [71.5, 93]},
            earL: {svg: `${LG("greece-kiki-in", [[0, "#FFC4D2"], [1, "#FF9DB4"]])}${ear("#FFFDF8", 0)}`, pivot: [44, 42]},
            earR: {svg: `${LG("greece-kiki-er", [[0, "#F5B36E"], [1, "#E08C45"]])}${ear("url(#greece-kiki-er)", 1)}`, pivot: [76, 42]},
            head: `${RG("greece-kiki-h", [[0, "#FFFFFF"], [0.66, "#FFF9F1"], [1, "#EBDCCB"]], 0.42, 0.36, 0.72)}
              ${RG("greece-kiki-p", [[0, "#F7B470"], [1, "#E58F45"]], 0.3, 0.6, 0.8)}
              <defs><clipPath id="greece-kiki-hc"><path d="${HEAD}"/></clipPath></defs>
              <path d="${HEAD}" fill="url(#greece-kiki-h)"/>
              <g clip-path="url(#greece-kiki-hc)">
                <path d="M57 26C59.4 33 63.6 37 62.6 43.4C61.6 49 63 56.4 68 61.6C73 66.4 80.6 66.4 86 63.4C88.6 62 91.6 62.6 94 64L96 24Z" fill="url(#greece-kiki-p)"/>
                <path d="M66 28.6q0.4 5 -1.4 8.6M73 30q0.2 5 -2.2 8.2M80.4 33.4q-0.6 4.8 -3.4 7.4" fill="none" stroke="#D27C36" stroke-width="2.4" stroke-linecap="round"/>
              </g>
              <path d="${HEAD}" fill="none" ${O}/>
              <path d="M37.2 52.4Q38.4 43.4 45.4 38.4" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>`,
            face: `<path d="M57.2 62.6Q60 61.6 62.8 62.6Q62 65.4 60 66Q58 65.4 57.2 62.6Z" fill="#FF8FA8" ${OW(1.4)}/>
              <path d="M39.6 62.6L33.4 61.2M39.6 65.8L33.6 66.8M80.4 62.6L86.6 61.2M80.4 65.8L86.4 66.8" stroke="#B7A08C" stroke-width="1.4" stroke-linecap="round"/>`
          };
        })(),
        eyes: {lx: 48.5, rx: 71.5, y: 56.8, r: 5.6, style: "round", color: "#3C6A2C"},
        mouth: {x: 60, y: 67.8, w: 2.6, color: "#3A2A2A", style: "cat"},
        cheeks: {lx: 41.4, rx: 78.6, y: 65.4, w: 4.2, h: 2.5, color: "#FFA6BA"},
        anchors: {top: [60, 33, 0.95], neck: [60, 81, 1], chest: [60, 96, 0.62], back: [86, 88, 0.8], hands: [60, 101, 0.86]},
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


