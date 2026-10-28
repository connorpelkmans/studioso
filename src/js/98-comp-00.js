/* ===== module: 98-comp-00.js ===== */
/* Study Companions */
var COMP_DATA = [];
var COMP_KIT = (() => {
  const INK = "#2B2233";
  const O = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const OW = w => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const stops = s => s.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ""}/>`).join("");
  // Linear gradient in the shape's own box (0..1)
  const LG = (id, s, x1 = 0, y1 = 0, x2 = 0, y2 = 1) => `<defs><linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(s)}</linearGradient></defs>`;
  const RG = (id, s, cx = 0.5, cy = 0.5, r = 0.5) => `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(s)}</radialGradient></defs>`;
  // A soft, bumpy cloud or fluff outline
  const puff = (cx, cy, r, n, bump = 1.15) => {
    const p = i => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
    const chord = 2 * r * Math.sin(Math.PI / n), br = (chord / 2) * bump, f = v => Math.round(v * 100) / 100;
    let d = `M${f(p(0)[0])} ${f(p(0)[1])}`;
    for (let i = 1; i <= n; i++) { const q = p(i); d += `A${f(br)} ${f(br)} 0 0 1 ${f(q[0])} ${f(q[1])}`; }
    return d + "Z";
  };
  // An outlined line (a dark stroke under a coloured one), for steam, stems and wisps
  const LINE = (d, color, w = 3) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 2.6}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return {INK, O, OW, LG, RG, puff, LINE};
})();

/* Reference art */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);

  COMP_DATA.push({
    theme: "plain",
    companions: [
      {
        id: "plain-mochi", name: "Mochi", kind: "Sprout Mochi", pose: "sit", sleepy: true,
        bio: "A little mochi whose sprout grows as you do.",
        idle: ["topBob", "bounce", "finWiggle"], cheer: "hop",
        parts: {
          armL: {svg: `<ellipse cx="22.5" cy="89" rx="5.8" ry="7.6" transform="rotate(24 22.5 89)" fill="#FFF1E4" ${O}/>`, pivot: [30, 86]},
          armR: {svg: `<ellipse cx="97.5" cy="89" rx="5.8" ry="7.6" transform="rotate(-24 97.5 89)" fill="#FFF1E4" ${O}/>`, pivot: [90, 86]},
          body: `${RG("plain-mochi-g", [[0, "#FFFFFF"], [0.55, "#FFF5EB"], [1, "#F4D9C6"]], 0.42, 0.32, 0.78)}
            <path d="M60 42C83 42 98 60 99 82C100 101 88 110.5 60 110.5C32 110.5 20 101 21 82C22 60 37 42 60 42Z" fill="url(#plain-mochi-g)" ${O}/>
            <path d="M31 99Q60 110 89 99" fill="none" stroke="#EBC9B3" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
            <ellipse cx="40.5" cy="57" rx="7.5" ry="4.2" transform="rotate(-38 40.5 57)" fill="#fff"/><circle cx="50" cy="50.5" r="2" fill="#fff"/>`,
          top: {svg: `${LINE("M60 44C60 38 59.5 34 60.5 29", "#5DAA62", 2.6)}
            <path d="M60 31C55 22 45 21 40 26C45 33 54 35 60 31Z" fill="#8AD08A" ${O2}/><path d="M58 30.5Q51 26 44 26.5" fill="none" stroke="#5DAA62" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M60.5 30C64 20 74 17 80 21C77 29 68 33 60.5 30Z" fill="#9BDA95" ${O2}/><path d="M62.5 29Q70 24 77 22" fill="none" stroke="#5DAA62" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [60, 43]}
        },
        eyes: {lx: 47, rx: 73, y: 75, r: 5.2, style: "dot"},
        mouth: {x: 60, y: 83.5, w: 3.4},
        cheeks: {lx: 37.5, rx: 82.5, y: 83, w: 5.6, h: 3.4},
        anchors: {top: [60, 46, 1.05], neck: [60, 97, 1.15], chest: [80, 99, 0.8], back: [92, 80, 0.95], hands: [60, 101, 0.9]},
        lines: {
          tap: ["Squish! Hi friend, I'm so happy you're here!", "You're doing so well today!", "Every tiny step counts, and you're taking them!", "I'm so proud of you, truly!", "Deep breath! You've totally got this.", "My sprout grows every time you show up!", "Water, snack, then back to being awesome?", "Your notes look amazing today!"],
          pet: ["Hehe, extra squishy happy!", "More pats? Yes please, yes please!"],
          hello: ["Yay, you're back! I saved you a spot!", "Hello hello! Ready to grow together?"],
          morning: ["Good morning! My sprout is reaching for the sun!", "Rise and shine, sunshine! Today's going to be great!"],
          night: ["So cozy. Bedtime soon, my friend?", "Rest helps you grow too. Sleep well."],
          focus: ["I'm right here cheering quietly. You've got this!", "Quiet squish of support. Let's go!"],
          done: ["You did it! What amazing focus!", "Session complete! Squish of joy for you!"],
          task: ["WOO! Another one done!", "Squish squish! Look at that, finished!", "Checked off! I'm bursting with pride!", "Yes yes yes! That's a win!"],
          break: ["Stretch time! Then a big sip of water!", "Break time! Let's do a happy wiggle!"]
        }
      },
      {
        id: "plain-inky", name: "Inky", kind: "Ink Drop", pose: "stand", wearColor: "#F2A33A",
        bio: "A cheerful drop of ink who loves a fresh, clean page.",
        idle: ["sway", "sparkle", "finWiggle"], cheer: "spin",
        parts: {
          feet: `<ellipse cx="50" cy="109.5" rx="7.4" ry="4.2" fill="#3F5BC0" ${O}/><ellipse cx="70" cy="109.5" rx="7.4" ry="4.2" fill="#3F5BC0" ${O}/>`,
          body: `${LG("plain-inky-g", [[0, "#9AB5FA"], [0.55, "#7292EE"], [1, "#5271D6"]], 0.2, 0, 0.8, 1)}
            <path d="M60 25C67 40 89 57 89 80C89 98 77 108.5 60 108.5C43 108.5 31 98 31 80C31 57 53 40 60 25Z" fill="url(#plain-inky-g)" ${O}/>
            <path d="M40.5 74C40.5 63 46 54 52.5 47" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" opacity=".75"/><circle cx="39.8" cy="81.5" r="2" fill="#fff" opacity=".7"/>
            <path d="M44 100Q60 106 76 100" fill="none" stroke="#4462C8" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>`,
          armL: {svg: `<ellipse cx="30.5" cy="90" rx="5" ry="7" transform="rotate(28 30.5 90)" fill="#6485E6" ${O}/>`, pivot: [37, 87]},
          armR: {svg: `<ellipse cx="89.5" cy="90" rx="5" ry="7" transform="rotate(-28 89.5 90)" fill="#6485E6" ${O}/>`, pivot: [83, 87]}
        },
        eyes: {lx: 50, rx: 70, y: 77, r: 6, style: "round"},
        mouth: {x: 60, y: 90, w: 3.4},
        cheeks: {lx: 41, rx: 79, y: 88, w: 4.6, h: 2.9, color: "#FFA3C4"},
        anchors: {top: [60, 47, 0.8], neck: [60, 99, 1.2], chest: [73, 100, 0.75], back: [86, 78, 0.85], hands: [60, 100, 0.9]},
        lines: {
          tap: ["Fresh page, fresh start! Let's go!", "We're going to write something great today!", "You're on a roll and I love it!", "Neat notes, happy brain, happy me!", "Every word you write counts!", "Doodle break? I won't tell a soul!", "Ink it in! You've totally got this!"],
          pet: ["Careful, I might smudge with joy!", "Hehe, that tickles my inky drips!"],
          hello: ["You're here! Let's fill a whole page!", "Hello! I'm all inked up and ready!"],
          morning: ["Good morning! A clean page is waiting for you!", "Morning, writer! I'm so excited for today!"],
          night: ["Late ink? Let's save some for tomorrow.", "It's getting late. Rest soon, friend?"],
          focus: ["I'm taking notes right beside you. Go go!", "Heads down, pens ready! We've got this!"],
          done: ["What a page! You were amazing!", "Session done! So neat, so wonderful!"],
          task: ["Crossed off! YES!", "Done and dusted! Woohoo!", "Another one down! You're unstoppable!", "Gold star! Gold star for you!"],
          break: ["Shake out that writing hand! Wiggle wiggle!", "Break time! Go stretch and smile!"]
        }
      },
      {
        id: "plain-owl", name: "Hoot", kind: "Book Owl", pose: "stand",
        bio: "A wise little owl who has read every book twice.",
        idle: ["earTwitch", "wingFlutter", "sway"], cheer: "wingFlutter",
        parts: {
          earL: {svg: `<path d="M35.5 39L32.5 19.5L49 31Z" fill="#B88E6A" ${O}/><path d="M36.8 33L35.4 24.5L43 30Z" fill="#E3C3A2"/>`, pivot: [41, 34]},
          earR: {svg: `<path d="M84.5 39L87.5 19.5L71 31Z" fill="#B88E6A" ${O}/><path d="M83.2 33L84.6 24.5L77 30Z" fill="#E3C3A2"/>`, pivot: [79, 34]},
          feet: `<path d="M43 110.5Q48 104 55 110.5Q49 113 43 110.5Z" fill="#F2A33A" ${O2}/><path d="M65 110.5Q72 104 77 110.5Q71 113 65 110.5Z" fill="#F2A33A" ${O2}/>`,
          body: `${LG("plain-owl-g", [[0, "#D6B28E"], [1, "#A57B58"]])}
            <path d="M60 28C83 28 94 48 94 71C94 95 80 108.5 60 108.5C40 108.5 26 95 26 71C26 48 37 28 60 28Z" fill="url(#plain-owl-g)" ${O}/>
            <ellipse cx="60" cy="89" rx="20" ry="16.5" fill="#F6E7D3"/>
            <path d="M51.5 84.5l3 3l3-3M62.5 84.5l3 3l3-3M57 93l3 3l3-3" fill="none" stroke="#C9A27E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M40 40Q47 33 56 32" fill="none" stroke="#EBD2B5" stroke-width="3" stroke-linecap="round" opacity=".8"/>`,
          face: `<circle cx="47" cy="60" r="12.5" fill="#F9EEDF" stroke="#B88E6A" stroke-width="1.6"/><circle cx="73" cy="60" r="12.5" fill="#F9EEDF" stroke="#B88E6A" stroke-width="1.6"/>`,
          armL: {svg: `<path d="M30.5 58C21 66 19 84 27 97C35 92 37.5 72 30.5 58Z" fill="#9C7150" ${O}/><path d="M28.5 70Q26 80 28.5 88" fill="none" stroke="#C49A74" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [31, 60]},
          armR: {svg: `<path d="M89.5 58C99 66 101 84 93 97C85 92 82.5 72 89.5 58Z" fill="#9C7150" ${O}/><path d="M91.5 70Q94 80 91.5 88" fill="none" stroke="#C49A74" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [89, 60]}
        },
        eyes: {lx: 47, rx: 73, y: 60, r: 7, style: "round"},
        mouths: {
          neutral: `<path d="M55.5 68.5Q60 66.5 64.5 68.5L60 75.5Z" fill="#F2A33A" ${OW(2)}/>`,
          smile: `<path d="M55 68Q60 65.8 65 68L60 74.8Z" fill="#F7B24A" ${OW(2)}/><path d="M52.5 71.5q2 1.6 4 .4M67.5 71.5q-2 1.6 -4 .4" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`,
          open: `<path d="M55.5 70.6L64.5 70.6L60 75.5Z" fill="#FF8FA8" ${OW(1.8)}/><path d="M55 67.5Q60 65.5 65 67.5L60 71Z" fill="#F2A33A" ${OW(2)}/><path d="M56.5 73L63.5 73L60 78Z" fill="#F2A33A" ${OW(2)}/>`,
          sleepy: `<path d="M56 68.8Q60 67.2 64 68.8L60 74.5Z" fill="#E09A3C" ${OW(2)}/>`
        },
        mouth: {x: 60, y: 71, w: 3},
        cheeks: {lx: 38.5, rx: 81.5, y: 73, w: 4.4, h: 2.8},
        anchors: {top: [60, 32, 1], neck: [60, 79, 1.35], chest: [74, 95, 0.8], back: [90, 74, 0.9], hands: [60, 91, 0.95]},
        lines: {
          tap: ["Hoo hoo! Hello there, bright mind!", "Your knowledge is blooming beautifully!", "One page at a time, and look at you go!", "You're wiser than yesterday, I can tell!", "Great questions make great learners!", "Blink, breathe, and read on, superstar!", "Ooh, that idea deserves a note!"],
          pet: ["Hoo hoo! My feathers are fluffing up!", "Oh my, you're so sweet to me!"],
          hello: ["Hoo! You're back! Welcome, welcome!", "Hello, fellow bookworm! I missed you!"],
          morning: ["Good morning! Even this owl is wide awake for you!", "Morning, scholar! Let's learn something great!"],
          night: ["It's my hour, but you need your sleep.", "Hoo, it's late. Time to rest soon?"],
          focus: ["Reading right along with you. Let's go!", "Quiet as a library. You've got this!"],
          done: ["Hoo hoo! What a wise session!", "Chapter complete! Brilliantly done!"],
          task: ["Hoo hoo! DONE!", "Another page turned! Wonderful!", "Wise work! I'm so proud!", "Yes! Well done, scholar!"],
          break: ["Stretch those wings! Flap flap!", "Break time! Give your eyes a happy rest!"]
        }
      },
      {
        id: "plain-hilo", name: "Hilo", kind: "Highlighter", pose: "stand", wearColor: "#7C6FE0",
        bio: "A bright little highlighter who only marks the parts that matter.",
        idle: ["topBob", "sway", "wave"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="51" cy="109.5" rx="6.6" ry="3.9" fill="#D9CF2E" ${O}/><ellipse cx="69" cy="109.5" rx="6.6" ry="3.9" fill="#D9CF2E" ${O}/>`,
          body: `${LG("plain-hilo-g", [[0, "#FFFBA0"], [0.5, "#F8F25E"], [1, "#E4DB3A"]], 0, 0, 1, 0)}
            <path d="M42 50H78V100Q78 107 71 107H49Q42 107 42 100Z" fill="url(#plain-hilo-g)" ${O}/>
            <path d="M42.5 95H77.5" stroke="#B9E057" stroke-width="6"/><path d="M42 92H78M42 98H78" stroke="${INK}" stroke-width="2.2"/>
            <path d="M48 64V86" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".7"/>`,
          armL: {svg: `<ellipse cx="37" cy="82" rx="4.6" ry="6.6" transform="rotate(24 37 82)" fill="#F2EB52" ${O}/>`, pivot: [42, 78]},
          armR: {svg: `<ellipse cx="83" cy="82" rx="4.6" ry="6.6" transform="rotate(-24 83 82)" fill="#F2EB52" ${O}/>`, pivot: [78, 78]},
          top: {svg: `${LG("plain-hilo-c", [[0, "#C9F27E"], [1, "#92D24A"]])}
            <path d="M40 58V37Q40 28 49 28H71Q80 28 80 37V58Z" fill="url(#plain-hilo-c)" ${O}/>
            <rect x="79" y="31" width="6" height="22" rx="3" fill="#82C23E" ${O2}/>
            <path d="M46 35Q46 32 50 32" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>`, pivot: [60, 58]}
        },
        eyes: {lx: 52, rx: 68, y: 72, r: 4.6, style: "dot"},
        mouth: {x: 60, y: 80, w: 3},
        cheeks: {lx: 47, rx: 73, y: 79.5, w: 3.6, h: 2.4},
        anchors: {top: [60, 30, 0.85], neck: [60, 62, 0.95], chest: [70, 90, 0.6], back: [80, 72, 0.8], hands: [60, 96, 0.8]},
        lines: {tap: ["This part? Definitely important.", "I only light up the good stuff.", "You don't have to remember it all. Just the key bits.", "Hi! Ready to make things stand out?", "One clear line at a time.", "Bright idea incoming!"], pet: ["Hehe, careful, my cap pops off!", "Glowing extra bright now."], hello: ["You're back! Let's find the key ideas.", "Hi again! Cap's off, ready to go."], morning: ["Good morning! Today looks bright."], night: ["Cap on, lights low. Time to rest."], focus: ["Steady hand. You've got this.", "Marking the moment. Keep going."], done: ["Great session! That deserves a big bright line.", "Done! You really focused."], task: ["Done! Highlighted in gold.", "Yes! That one's marked finished.", "Another one done. Nice!"], break: ["Cap on for a minute. Stretch it out."]}
      },
      {
        id: "plain-packy", name: "Packy", kind: "Backpack", pose: "sit", wearColor: "#4F8FE0",
        bio: "A trusty backpack who has carried every book you've ever needed.",
        idle: ["topBob", "bounce", "wave"], cheer: "hop",
        parts: {
          back: `<g transform="rotate(14 84 44)"><rect x="80" y="26" width="8" height="26" fill="#FFCB4F" ${O2}/><path d="M80 26L84 17L88 26Z" fill="#F7D9B0" ${O2}/><circle cx="84" cy="18.5" r="1.4" fill="${INK}"/></g>`,
          body: `${LG("plain-packy-g", [[0, "#FFB3A3"], [0.55, "#FF8D7A"], [1, "#EC6F5E"]], 0.2, 0, 0.8, 1)}
            <path d="M60 38C80 38 92 48 92 64V100Q92 108 84 108H36Q28 108 28 100V64C28 48 40 38 60 38Z" fill="url(#plain-packy-g)" ${O}/>
            <path d="M38 84Q38 80 42 80H78Q82 80 82 84V100Q82 104 78 104H42Q38 104 38 100Z" fill="#F2786A" ${O}/>
            <path d="M40 86H80" stroke="${INK}" stroke-width="1.8" stroke-dasharray="2.4 2"/>
            <rect x="62" y="83" width="4" height="7" rx="1.5" fill="#FFD36A" ${OW(1.6)}/>
            <path d="M50 92.5L51.4 95.3L54.4 95.7L52.2 97.8L52.8 100.8L50 99.4L47.2 100.8L47.8 97.8L45.6 95.7L48.6 95.3Z" fill="#FFE07A" ${OW(1.4)}/>
            <path d="M36 62Q37 50 48 45" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".6"/>`,
          armL: {svg: `<path d="M31 62Q20 72 22 92Q24 97 28 95Q28 78 34 68Z" fill="#4F8FE0" ${O}/>`, pivot: [31, 64]},
          armR: {svg: `<path d="M89 62Q100 72 98 92Q96 97 92 95Q92 78 86 68Z" fill="#4F8FE0" ${O}/>`, pivot: [89, 64]},
          top: {svg: `<path d="M50 40Q50 28 60 28Q70 28 70 40" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M50 40Q50 28 60 28Q70 28 70 40" fill="none" stroke="#4F8FE0" stroke-width="3.6" stroke-linecap="round"/>`, pivot: [60, 40]}
        },
        eyes: {lx: 48, rx: 72, y: 62, r: 5.2, style: "dot"},
        mouth: {x: 60, y: 70.5, w: 3.4},
        cheeks: {lx: 39, rx: 81, y: 70, w: 4.8, h: 3},
        anchors: {top: [60, 40, 1], neck: [60, 78, 1.2], chest: [75, 92, 0.75], back: [92, 64, 0.85], hands: [60, 100, 0.9]},
        lines: {tap: ["Got everything? I double-checked!", "I've got your back. Literally.", "Heavy day? We'll carry it together.", "Hi! Where are we headed today?", "One thing at a time, out of the bag.", "I packed you a little extra courage."], pet: ["Hehe, my zippers jingle!", "Pats! My favorite pocket feeling."], hello: ["You're back! Bag's packed and ready.", "Hi! Let's unpack today's plan."], morning: ["Good morning! Let's pack up the day's goals."], night: ["Zip it up for today. Rest well."], focus: ["Quiet zippers. You've got this.", "I'll keep everything safe while you work."], done: ["Session done! That's a load lighter.", "Amazing focus! Unpacked and done."], task: ["Done! One less thing to carry.", "Checked off! Feeling lighter already.", "Woo! Another one finished."], break: ["Put the load down. Stretch your shoulders!"]}
      },
      {
        id: "plain-sum", name: "Sum", kind: "Calculator", pose: "stand", wearColor: "#F28C5A",
        bio: "A tidy little calculator who's sure everything adds up in the end.",
        idle: ["bounce", "wave", "sparkle"], cheer: "spin",
        parts: {
          feet: `<ellipse cx="48" cy="109.5" rx="7" ry="4" fill="#7466CC" ${O}/><ellipse cx="72" cy="109.5" rx="7" ry="4" fill="#7466CC" ${O}/>`,
          body: `${LG("plain-sum-g", [[0, "#C7BEFA"], [0.55, "#A396EE"], [1, "#8676DD"]], 0.2, 0, 0.8, 1)}
            <rect x="33" y="34" width="54" height="73" rx="9" fill="url(#plain-sum-g)" ${O}/>
            <rect x="39" y="40" width="42" height="26" rx="4" fill="#DDF2CF" ${OW(2.4)}/>
            <path d="M42.5 44H55" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>
            ${[0, 1, 2].map(r => [0, 1, 2].map(k => `<rect x="${40 + k * 14}" y="${72 + r * 10.5}" width="11" height="8" rx="3" fill="${r === 2 && k === 2 ? "#FFA36E" : "#FFF7EC"}" ${OW(1.8)}/>`).join("")).join("")}`,
          armL: {svg: `<ellipse cx="28" cy="80" rx="4.6" ry="6.6" transform="rotate(24 28 80)" fill="#A396EE" ${O}/>`, pivot: [33, 76]},
          armR: {svg: `<ellipse cx="92" cy="80" rx="4.6" ry="6.6" transform="rotate(-24 92 80)" fill="#A396EE" ${O}/>`, pivot: [87, 76]}
        },
        eyes: {lx: 52, rx: 68, y: 51, r: 4.2, style: "dot", color: "#2F4A2A"},
        mouth: {x: 60, y: 58.5, w: 2.8, color: "#2F4A2A"},
        cheeks: {lx: 45.5, rx: 74.5, y: 58, w: 3.4, h: 2.2},
        anchors: {top: [60, 35, 0.9], neck: [60, 68, 1.05], chest: [77, 98, 0.55], back: [87, 66, 0.8], hands: [60, 101, 0.85]},
        lines: {tap: ["Hi! Let's figure this out together.", "Big problems are just small steps added up.", "You plus a plan equals progress.", "Show your work? You're doing great.", "Every little bit counts. I checked.", "Calm and steady. That's the formula."], pet: ["Hehe, that tickles my buttons!", "Beep boop! Happy!"], hello: ["You're back! Ready to crunch some numbers?", "Hi! Today's going to add up nicely."], morning: ["Good morning! Fresh start, clear screen."], night: ["Time to power down. You too."], focus: ["Quiet mode on. You've got this.", "Steady focus. Keep going."], done: ["Session done! That adds up to a lot.", "Great focus! The numbers love it."], task: ["Done! Plus one!", "Finished! That's a correct answer.", "Woo! Another one done."], break: ["Clear the screen. Stretch and breathe."]}
      }
    ]
  });

  COMP_DATA.push({
    theme: "winter", spot: {x: 0.84, y: 0.985},
    companions: [
      {
        id: "winter-penguin", name: "Pip", kind: "Baby Penguin", pose: "stand",
        bio: "A fluffy penguin chick who waddles in for snowy study nights.",
        idle: ["waddle", "wingFlutter", "headTilt"], cheer: "wingFlutter",
        neck: [60, 74],
        parts: {
          feet: `<ellipse cx="49" cy="109.5" rx="7.6" ry="3.9" fill="#F5A96B" ${O}/><ellipse cx="71" cy="109.5" rx="7.6" ry="3.9" fill="#F5A96B" ${O}/>`,
          body: `${LG("winter-penguin-b", [[0, "#D3DBE7"], [1, "#A2AEC3"]])}
            <path d="M60 63C80 63 90 79 89 94C88 105 78 109 60 109C42 109 32 105 31 94C30 79 40 63 60 63Z" fill="url(#winter-penguin-b)" ${O}/>
            <ellipse cx="60" cy="94" rx="17.5" ry="13.5" fill="#EEF2F8"/>
            <path d="M40 86q2.4 2 4.8 .8M76 88q-2.4 2 -4.8 .8M55 104q2 1.6 4 0" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>`,
          armL: {svg: `<path d="M35.5 77C27 83 23.5 93.5 26.5 100C32.5 98.5 37 90 38 81Z" fill="#8F9CB5" ${O}/>`, pivot: [36.5, 79]},
          armR: {svg: `<path d="M84.5 77C93 83 96.5 93.5 93.5 100C87.5 98.5 83 90 82 81Z" fill="#8F9CB5" ${O}/>`, pivot: [83.5, 79]},
          head: `${LG("winter-penguin-h", [[0, "#48527A"], [1, "#272D46"]])}
            <circle cx="60" cy="50" r="27" fill="url(#winter-penguin-h)" ${O}/>
            <path d="M57 23.5C56 18.5 60 16 63 18C60.5 19 60 21.5 61.5 23.5" fill="#39415F" ${O2}/>
            <path d="M41 37Q46.5 29 56 27" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".32"/>`,
          face: `<path d="M60 46.5C52 37.5 37.5 39.5 36.8 52C36.2 64 47 72.5 60 69.5C73 72.5 83.8 64 83.2 52C82.5 39.5 68 37.5 60 46.5Z" fill="#FFFFFF"/>`
        },
        eyes: {lx: 50, rx: 70, y: 55, r: 4.5, style: "dot"},
        mouths: {
          neutral: `<path d="M56.2 59.6Q60 58.4 63.8 59.6L60 64.2Z" fill="#3A3F55" ${OW(1.6)}/>`,
          smile: `<path d="M55.8 59.4Q60 58 64.2 59.4L60 64.4Z" fill="#3A3F55" ${OW(1.6)}/><path d="M53.5 62.5q1.6 1.2 3.2 .3M66.5 62.5q-1.6 1.2 -3.2 .3" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`,
          open: `<path d="M56.6 61.2L63.4 61.2L60 65.2Z" fill="#FF8FA8" ${OW(1.4)}/><path d="M56 58.8Q60 57.6 64 58.8L60 61.6Z" fill="#3A3F55" ${OW(1.6)}/><path d="M57.2 63.2L62.8 63.2L60 67Z" fill="#3A3F55" ${OW(1.6)}/>`,
          sleepy: `<path d="M56.6 60Q60 59 63.4 60L60 63.8Z" fill="#3A3F55" ${OW(1.6)}/>`
        },
        mouth: {x: 60, y: 61, w: 3},
        cheeks: {lx: 43.5, rx: 76.5, y: 62, w: 4.2, h: 2.6},
        anchors: {top: [60, 25, 1.05], neck: [60, 75, 1.05], chest: [71, 92, 0.8], back: [84, 84, 0.9], hands: [60, 95, 0.95]},
        lines: {
          tap: ["Peep! Hi hi hi!", "Waddle on! You're doing amazing!", "Snow day, study day, best day!", "Keep warm and keep shining!", "Little waddles, big progress!", "You make studying look so easy!", "Cozy mode on, and you're on fire!"],
          pet: ["Peep peep! So fluffy and happy!", "Aww, the warmest little hug ever!"],
          hello: ["Peep! You're here! Yay!", "Hi! I kept your spot nice and warm!"],
          morning: ["Frosty morning! Let's waddle into it!", "Good morning! Peep peep, today's yours!"],
          night: ["Sleepy peep. Bed soon, friend?", "Snow's falling softly. Time to rest."],
          focus: ["Huddled up with you. We've got this!", "Studying right here beside you. Go!"],
          done: ["Peep peep! Session done! Amazing!", "Wonderful focus! Time to warm up and cheer!"],
          task: ["Peep! DONE!", "Slid right through that one! Wheee!", "Another one done! You're incredible!", "Yes yes! Happy waddle for you!"],
          break: ["Little stretch time! Waddle around!", "Warm drink break! Cozy and fun!"]
        }
      },
      {
        id: "winter-bunny", name: "Flurry", kind: "Snow Bunny", pose: "sit", sleepy: true,
        bio: "A soft snow bunny who naps quietly while you work.",
        idle: ["earTwitch", "bounce", "tailSwish"], cheer: "hop",
        neck: [60, 76],
        parts: {
          tail: {svg: `<path d="${puff(88.5, 97.5, 6.2, 7, 1.2)}" fill="#FFFFFF" ${O}/>`, pivot: [84, 99]},
          feet: `<ellipse cx="38" cy="107.5" rx="11" ry="5" fill="#FFFFFF" ${O}/><ellipse cx="82" cy="107.5" rx="11" ry="5" fill="#FFFFFF" ${O}/><ellipse cx="31.5" cy="107.5" rx="2.2" ry="1.6" fill="#FFC1D0"/><ellipse cx="88.5" cy="107.5" rx="2.2" ry="1.6" fill="#FFC1D0"/>`,
          body: `${LG("winter-bunny-b", [[0, "#FFFFFF"], [1, "#D5E0F0"]])}
            <path d="M60 71C80 71 88 85 88 97C88 107 78 110.5 60 110.5C42 110.5 32 107 32 97C32 85 40 71 60 71Z" fill="url(#winter-bunny-b)" ${O}/>
            <ellipse cx="60" cy="97" rx="14" ry="10" fill="#FFFFFF" opacity=".8"/>`,
          armL: {svg: `<ellipse cx="50.5" cy="100" rx="6" ry="8" fill="#FFFFFF" ${O}/><path d="M48.5 105.5v2M52.5 105.5v2" stroke="#C9D5E6" stroke-width="1.5" stroke-linecap="round"/>`, pivot: [50.5, 93]},
          armR: {svg: `<ellipse cx="69.5" cy="100" rx="6" ry="8" fill="#FFFFFF" ${O}/><path d="M67.5 105.5v2M71.5 105.5v2" stroke="#C9D5E6" stroke-width="1.5" stroke-linecap="round"/>`, pivot: [69.5, 93]},
          earL: {svg: `<path d="M49.5 41C43.5 31 39.5 15 43.5 9.5C48.5 6 55 20 56 39Z" fill="#FFFFFF" ${O}/><path d="M48.5 34C45.8 26 44.8 17.5 46 13.5C49 14.5 52 24 52.5 34Z" fill="#FFC1D0"/>`, pivot: [52, 39]},
          earR: {svg: `<path d="M70.5 41C76.5 31 80.5 15 76.5 9.5C71.5 6 65 20 64 39Z" fill="#FFFFFF" ${O}/><path d="M71.5 34C74.2 26 75.2 17.5 74 13.5C71 14.5 68 24 67.5 34Z" fill="#FFC1D0"/>`, pivot: [68, 39]},
          head: `${LG("winter-bunny-h", [[0, "#FFFFFF"], [0.7, "#F4F8FD"], [1, "#DCE6F4"]])}
            <ellipse cx="60" cy="58" rx="25" ry="21.5" fill="url(#winter-bunny-h)" ${O}/>
            <path d="M42 48Q46 41 53 39" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            <path d="M58.5 38.5q1.5-3 3.5-1" fill="none" stroke="#C9D5E6" stroke-width="1.6" stroke-linecap="round"/>`,
          face: `<path d="M57.8 62.8h4.4l-2.2 2.5Z" fill="#FF8FA8" ${OW(1.4)}/>`
        },
        eyes: {lx: 50, rx: 70, y: 57, r: 4.4, style: "dot", color: "#2B2A44"},
        mouth: {x: 60, y: 66.5, w: 2.6, style: "cat"},
        cheeks: {lx: 42, rx: 78, y: 64.5, w: 4.6, h: 2.8, color: "#FF9FB7"},
        anchors: {top: [60, 39, 0.95], neck: [60, 78, 1.05], chest: [69, 90, 0.72], back: [86, 88, 0.9], hands: [60, 96, 0.9]},
        lines: {
          tap: ["Hop hop! Hi hi!", "Soft and steady, and you're winning!", "You're doing wonderfully, truly!", "Snowflakes and study notes, my favorite!", "Rest is part of the plan, and you're nailing it!", "One happy hop at a time!", "I think you're absolutely amazing!"],
          pet: ["Hehe, my ears are wiggling with joy!", "So soft and so happy now!"],
          hello: ["Hi! You're here! It's so cozy now!", "Hello! I missed you so much!"],
          morning: ["Good morning! Let's hop to it!", "Morning! Fresh snow and a fresh start!"],
          night: ["Yawn. Snuggle time soon?", "Time to rest, okay? You did great."],
          focus: ["Cozy and quiet right beside you. Go!", "Shh, cozy focus time. You've got this!"],
          done: ["You did it! Happy hops everywhere!", "Session done! I'm so proud of you!"],
          task: ["Hop! DONE!", "Woo! One less thing!", "That's done! Yay yay yay!", "Look at you go! Happy hops!"],
          break: ["Stretch those paws! Hop around!", "Snack and a stretch! Fun break time!"]
        }
      },
      {
        id: "winter-sprite", name: "Twinkle", kind: "Snow Sprite", pose: "float",
        bio: "A glowing snow sprite who sprinkles sparkles on good work.",
        idle: ["sparkle", "spin", "wingFlutter"], cheer: "spin",
        parts: {
          tail: {svg: `${LINE("M57 86C54 93 59 99 64 96C67.5 94 66 89.5 62.5 90.5", "#CFE0F8", 3.2)}`, pivot: [59, 86]},
          wingL: {svg: `<path d="M40 57C31 45 18 41 13.5 46.5C10.5 54 23.5 63.5 38 64Z" fill="#EAF4FF" fill-opacity=".95" ${OW(2.4)}/><path d="M37 60Q26 55 18.5 49" fill="none" stroke="#A9C8F0" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [39, 60]},
          wingR: {svg: `<path d="M80 57C89 45 102 41 106.5 46.5C109.5 54 96.5 63.5 82 64Z" fill="#EAF4FF" fill-opacity=".95" ${OW(2.4)}/><path d="M83 60Q94 55 101.5 49" fill="none" stroke="#A9C8F0" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [81, 60]},
          body: `${RG("winter-sprite-g", [[0, "#FFFFFF"], [0.6, "#F1F7FF"], [1, "#C9DDF8"]], 0.42, 0.38, 0.62)}
            <path d="${puff(60, 62, 24, 12, 1.18)}" fill="url(#winter-sprite-g)" ${O}/>
            <path d="M43 52Q46 45 53 42" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>
            <circle cx="79" cy="75" r="1.6" fill="#A9C8F0"/><circle cx="41" cy="77" r="1.2" fill="#A9C8F0"/>`,
          armL: {svg: `<ellipse cx="36.5" cy="75" rx="4.6" ry="5.8" transform="rotate(25 36.5 75)" fill="#F4F9FF" ${O}/>`, pivot: [42, 73]},
          armR: {svg: `<ellipse cx="83.5" cy="75" rx="4.6" ry="5.8" transform="rotate(-25 83.5 75)" fill="#F4F9FF" ${O}/>`, pivot: [78, 73]},
          top: {svg: `${LINE("M60 41V25M53.1 37L66.9 29M53.1 29L66.9 37", "#8FB8EE", 2.6)}${LINE("M57 26.5L60 29L63 26.5M57 39.5L60 37L63 39.5", "#8FB8EE", 1.6)}<circle cx="60" cy="33" r="3.4" fill="#DDEBFF" ${OW(2)}/>`, pivot: [60, 40]}
        },
        eyes: {lx: 51, rx: 69, y: 62, r: 4.8, style: "sparkle", color: "#2B3560"},
        mouth: {x: 60, y: 71, w: 3, color: "#2B3560"},
        cheeks: {lx: 43, rx: 77, y: 69.5, w: 4.4, h: 2.8, color: "#FFB3C8"},
        anchors: {top: [60, 41, 0.95], neck: [60, 82, 1.05], chest: [71, 77, 0.68], back: [85, 58, 0.8], hands: [60, 81, 0.85]},
        lines: {
          tap: ["Twinkle twinkle, hi hi!", "You sparkle so bright when you study!", "A little extra shine, just for you!", "You're doing so well today!", "I'm so proud of you, sparkly friend!", "Keep shining, bright mind!", "Every bit of practice makes magic!"],
          pet: ["Hehe, that tickles my sparkles!", "Wheee, I'm all aglow!"],
          hello: ["Hello! Let's make today sparkle!", "Hi! The snow missed you, and so did I!"],
          morning: ["Good morning! Fresh snow and fresh sparkles!", "Morning, bright star! Let's shine today!"],
          night: ["The stars are out. Rest soon?", "Glowing low now. Bedtime, bright star?"],
          focus: ["Shining quietly with you. Go go!", "Quiet sparkle mode. You've got this!"],
          done: ["What a lovely, sparkling session!", "You shone so bright! Well done!"],
          task: ["Sparkle! That's DONE!", "Brilliant! Absolutely brilliant!", "Shiny and finished! Woo!", "Look at you go! Sparkles everywhere!"],
          break: ["Twirl and stretch! Wheee!", "Float around a little! Break time!"]
        }
      }
    ]
  });

  COMP_DATA.push({
    theme: "cafe", spot: {x: 0.84, y: 0.985},
    companions: [
      {
        id: "cafe-bean", name: "Bean", kind: "Coffee Bean Sprite", pose: "stand", wearColor: "#E07A5F",
        bio: "A peppy coffee bean who brews up big ideas with you.",
        idle: ["topBob", "bounce", "wave"], cheer: "spin",
        parts: {
          feet: `<ellipse cx="51" cy="108.5" rx="7" ry="4.2" fill="#5A3418" ${O}/><ellipse cx="69" cy="108.5" rx="7" ry="4.2" fill="#5A3418" ${O}/>`,
          body: `${LG("cafe-bean-g", [[0, "#C48E5C"], [0.55, "#A06A3C"], [1, "#74451F"]], 0.15, 0, 0.85, 1)}
            <ellipse cx="60" cy="73" rx="25.5" ry="31" transform="rotate(-8 60 73)" fill="url(#cafe-bean-g)" ${O}/>
            <path d="M58.5 43.5q-4.5 7 1.5 13" fill="none" stroke="#5A3418" stroke-width="3" stroke-linecap="round"/>
            <path d="M63 90q-2 7 -8.5 12" fill="none" stroke="#5A3418" stroke-width="3" stroke-linecap="round"/>
            <path d="M40.5 60Q41.5 51 49 45.5" fill="none" stroke="#E6B886" stroke-width="3.2" stroke-linecap="round" opacity=".85"/>`,
          armL: {svg: `<ellipse cx="33" cy="82.5" rx="4.6" ry="6.8" transform="rotate(32 33 82.5)" fill="#7F4F27" ${O}/>`, pivot: [39, 80]},
          armR: {svg: `<ellipse cx="87" cy="82.5" rx="4.6" ry="6.8" transform="rotate(-32 87 82.5)" fill="#7F4F27" ${O}/>`, pivot: [81, 80]},
          top: {svg: `${LINE("M55 39C50 33 57.5 29 53.5 22", "#F6EDE2", 3)}${LINE("M64.5 37.5C60.5 31.5 67.5 28 63.5 21", "#F6EDE2", 3)}`, pivot: [59, 40]}
        },
        eyes: {lx: 50.5, rx: 69.5, y: 70, r: 4.8, style: "dot"},
        mouth: {x: 60, y: 79, w: 3.2, color: "#2B1A10"},
        cheeks: {lx: 43, rx: 77, y: 78, w: 4.4, h: 2.8, color: "#FF9FA8"},
        anchors: {top: [60, 44, 0.9], neck: [60, 90, 1.1], chest: [71, 94, 0.72], back: [84, 68, 0.85], hands: [60, 93, 0.9]},
        lines: {
          tap: ["Hi! Freshly roasted and so ready!", "You're brewing something great!", "A little perk, just for you!", "Small sips, big progress!", "Sip, study, smile! You're amazing!", "You're doing really, really well!", "Take your time! I'm right here cheering!"],
          pet: ["Ooh, that's so nice! Thank you!", "Hehe, I feel all warm and toasty!"],
          hello: ["Hello! Coffee's on and you're here!", "Hi hi! Let's get brewing!"],
          morning: ["Good morning! Fresh brew, fresh day!", "Morning! I'm buzzing to start with you!"],
          night: ["Decaf hours now. Rest soon?", "Late brew? Sleep is the best refill."],
          focus: ["Brewing quietly beside you. Let's go!", "Steady pour, steady mind. You've got this!"],
          done: ["What a strong session! Wow!", "Perfectly brewed! You were amazing!"],
          task: ["WOO! One off the list!", "Yes! One more done!", "Freshly finished! Hooray!", "Real progress! I'm so excited!"],
          break: ["Stretch and sip some water! Ahh!", "Break time! A warm cup sounds perfect!"]
        }
      },
      {
        id: "cafe-latte", name: "Latte", kind: "Latte Art Cat", pose: "sit", sleepy: true,
        bio: "A foamy cat curled up in a warm cup, purring you along.",
        idle: ["earTwitch", "tailSwish"], cheer: "bounce",
        neck: [60, 76],
        parts: {
          tail: {svg: `<path d="M86.5 74C95 69 102.5 59 100 51C98.5 46.5 94 47 94.5 51C96 58 91.5 65.5 84 69.5Z" fill="#F7E8D5" ${O}/><path d="M99.5 53C98.5 49 95.5 48.5 94.6 50.5" fill="none" stroke="#B98252" stroke-width="3.2" stroke-linecap="round"/>`, pivot: [86, 72]},
          body: `${LG("cafe-latte-cup", [[0, "#FFFFFF"], [1, "#E9DED1"]])}
            <ellipse cx="60" cy="107" rx="40" ry="5.6" fill="#F3EAE0" ${O}/>
            <path d="M90.5 79C103 76 106.5 93.5 92.5 96" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M90.5 79C103 76 106.5 93.5 92.5 96" fill="none" stroke="#F7F1EA" stroke-width="3.6" stroke-linecap="round"/>
            <ellipse cx="60" cy="72.5" rx="34" ry="6.5" fill="#B98252" ${O}/>
            <path d="M26 72.5C30 77.5 44 79.5 60 79.5C76 79.5 90 77.5 94 72.5L88.5 97C86.5 103.5 80 105.5 72 105.5H48C40 105.5 33.5 103.5 31.5 97Z" fill="url(#cafe-latte-cup)" ${O}/>
            <path d="M29.5 86Q60 92 90.5 86" fill="none" stroke="#D9A06A" stroke-width="3" stroke-linecap="round"/>
            <path d="M35 83Q36.5 93 39.5 99" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
          armL: {svg: `<ellipse cx="31" cy="74" rx="6.4" ry="4.8" fill="#FBF1E4" ${O}/><path d="M29 75.5v2M33 75.5v2" stroke="#D8C2A6" stroke-width="1.4" stroke-linecap="round"/>`, pivot: [37, 79]},
          armR: {svg: `<ellipse cx="89" cy="74" rx="6.4" ry="4.8" fill="#FBF1E4" ${O}/><path d="M87 75.5v2M91 75.5v2" stroke="#D8C2A6" stroke-width="1.4" stroke-linecap="round"/>`, pivot: [83, 79]},
          earL: {svg: `<path d="M40.5 47L37.5 27.5L54.5 37Z" fill="#FBF1E4" ${O}/><path d="M42 41.5L40.8 32L49 37.5Z" fill="#FFC1C8"/>`, pivot: [45, 41]},
          earR: {svg: `<path d="M79.5 47L82.5 27.5L65.5 37Z" fill="#FBF1E4" ${O}/><path d="M78 41.5L79.2 32L71 37.5Z" fill="#FFC1C8"/>`, pivot: [75, 41]},
          head: `${LG("cafe-latte-h", [[0, "#FFF8EE"], [1, "#F1DEC6"]])}
            <path d="M35.5 74C33 64 34 51 42 43C48 37 54 35 60 35C66 35 72 37 78 43C86 51 87 64 84.5 74C80 77.5 70 79 60 79C50 79 40 77.5 35.5 74Z" fill="url(#cafe-latte-h)" ${O}/>
            <path d="M60 46.5C57.5 42.5 51.5 43.5 52 47.5C52.6 51 56.5 53 60 55.5C63.5 53 67.4 51 68 47.5C68.5 43.5 62.5 42.5 60 46.5Z" fill="#C8915E" opacity=".9"/>
            <path d="M60 47.5V53" stroke="#F4E2CC" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M42.5 50Q45 44 50.5 41" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/>`,
          face: `<path d="M58 60.2h4l-2 2.3Z" fill="#FF8FA8" ${OW(1.3)}/><path d="M37 60.5l-8.5-1.2M37 64.5l-8.5 1.4M83 60.5l8.5-1.2M83 64.5l8.5 1.4" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>`
        },
        eyes: {lx: 50, rx: 70, y: 56, r: 4.3, style: "dot", color: "#2B1E18"},
        mouth: {x: 60, y: 64, w: 2.6, style: "cat"},
        cheeks: {lx: 43, rx: 77, y: 63.5, w: 4.2, h: 2.6},
        anchors: {top: [60, 37, 0.95], neck: [60, 79, 1.2], chest: [60, 95, 0.8], back: [24, 86, 0.8], hands: [60, 81, 0.9]},
        lines: {
          tap: ["Purr! Hello, my favorite person!", "You're the cream of the crop!", "Warm cup, calm mind, great you!", "One sip at a time, and you're doing it!", "Mew! You're doing great!", "This spot is extra cozy with you here!", "Cozy and capable, that's you!"],
          pet: ["Purr-fect! That's so nice!", "Mrrp! More chin scratches, please!"],
          hello: ["Mew! Welcome back! I'm so happy!", "Hello! The cup is warm and waiting!"],
          morning: ["Good morning! Fresh foam and fresh starts!", "Mrrp! Morning! Let's have a great day!"],
          night: ["Yawn. Time to curl up soon?", "Cats nap, and so should you. Sleep well."],
          focus: ["Purring softly beside you. You've got this!", "Quiet purrs of support. Let's go!"],
          done: ["What a lovely session! Purr!", "Mew mew! You did it!"],
          task: ["Mrrp! DONE!", "Yes! Smooth as foam!", "Purr-fectly finished! Woo!", "Great work! Happy tail swish!"],
          break: ["Big cat stretch! Reach and yawn!", "Sip something warm! Cozy break!"]
        }
      },
      {
        id: "cafe-croissant", name: "Crumb", kind: "Tiny Croissant", pose: "stand",
        bio: "A flaky little croissant with a warm, buttery heart.",
        idle: ["sway", "bounce", "sparkle"], cheer: "hop",
        parts: {
          armL: {svg: `<ellipse cx="38" cy="89.5" rx="4.4" ry="6.6" transform="rotate(48 38 89.5)" fill="#F2BA68" ${O}/>`, pivot: [43, 87]},
          armR: {svg: `<ellipse cx="82" cy="89.5" rx="4.4" ry="6.6" transform="rotate(-48 82 89.5)" fill="#F2BA68" ${O}/>`, pivot: [77, 87]},
          body: `${LG("cafe-croissant-t", [[0, "#EDAE5C"], [1, "#BE6F2E"]], 0.2, 0, 0.8, 1)}${LG("cafe-croissant-s", [[0, "#FBD38C"], [0.55, "#EDA851"], [1, "#CB7C35"]], 0.3, 0, 0.7, 1)}${RG("cafe-croissant-c", [[0, "#FFEDB8"], [0.5, "#F8C672"], [1, "#DF9545"]], 0.42, 0.3, 0.75)}
            <path d="M31 100C29 93 25 87.5 19 87.5C12.5 88.5 8.5 96 8.5 103C8.5 107.5 10.5 109.5 14 109C20 108 27 105.5 31 100Z" fill="url(#cafe-croissant-t)" ${O}/>
            <path d="M89 100C91 93 95 87.5 101 87.5C107.5 88.5 111.5 96 111.5 103C111.5 107.5 109.5 109.5 106 109C100 108 93 105.5 89 100Z" fill="url(#cafe-croissant-t)" ${O}/>
            <path d="M52 98C50 80 46 63 36 61C26 60 18 72 18.5 86C19 96 24 102 31 102C39 102 46 100 52 98Z" fill="url(#cafe-croissant-s)" ${O}/>
            <path d="M68 98C70 80 74 63 84 61C94 60 102 72 101.5 86C101 96 96 102 89 102C81 102 74 100 68 98Z" fill="url(#cafe-croissant-s)" ${O}/>
            <path d="M32 68.5Q28.5 82 31 98M88 68.5Q91.5 82 89 98M15 95Q18 101 23.5 104.5M105 95Q102 101 96.5 104.5" fill="none" stroke="#C47630" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M40 95.5C34 78 36.5 51 49 45C52.5 43.3 56 42.5 60 42.5C64 42.5 67.5 43.3 71 45C83.5 51 86 78 80 95.5C79.5 98 78 99 75 99.5C67 100.5 53 100.5 45 99.5C42 99 40.5 98 40 95.5Z" fill="url(#cafe-croissant-c)" ${O}/>
            <path d="M44.5 60Q46 50 53.5 46.5" fill="none" stroke="#FFF6DE" stroke-width="3.4" stroke-linecap="round"/><circle cx="59.5" cy="46" r="1.6" fill="#FFF6DE"/>
            <path d="M22.5 76Q24 69.5 28.5 66.5" fill="none" stroke="#FFE7B4" stroke-width="2.6" stroke-linecap="round"/><path d="M97.5 76Q96 69.5 91.5 66.5" fill="none" stroke="#FFE7B4" stroke-width="2.6" stroke-linecap="round"/>
            <ellipse cx="72" cy="51" rx="1.6" ry="0.95" transform="rotate(30 72 51)" fill="#FFF3D6"/><ellipse cx="76" cy="57.5" rx="1.4" ry="0.85" transform="rotate(60 76 57.5)" fill="#FFF3D6"/>
            <ellipse cx="24.5" cy="87" rx="1.3" ry="0.8" transform="rotate(-20 24.5 87)" fill="#FFF3D6"/><ellipse cx="95.5" cy="87" rx="1.3" ry="0.8" transform="rotate(20 95.5 87)" fill="#FFF3D6"/>`
        },
        eyes: {lx: 51.5, rx: 68.5, y: 68, r: 4.6, style: "dot", color: "#2B1A10"},
        mouth: {x: 60, y: 76.5, w: 3, color: "#2B1A10"},
        cheeks: {lx: 45.5, rx: 74.5, y: 75, w: 4.2, h: 2.6, color: "#FF8F8F"},
        anchors: {top: [60, 45, 0.9], neck: [60, 86, 0.9], chest: [70, 88, 0.65], back: [60, 62, 0.9], hands: [60, 92, 0.85]},
        lines: {
          tap: ["Bonjour! Hi hi!", "You're on a roll! Literally!", "Steady and golden, that's you!", "Layer by layer, you've got this!", "A warm and buttery hello!", "Rise and shine, just like dough!", "All those crumbs of progress add up!"],
          pet: ["Hehe, crumbs everywhere! So happy!", "Oh la la, merci beaucoup!"],
          hello: ["Bonjour! Fresh from the oven for you!", "Hi! Still warm, and so happy you're here!"],
          morning: ["Good morning! Fresh pastry, fresh day!", "Morning! Let's rise and shine together!"],
          night: ["Bakers sleep early. You too?", "Cooling off now. Rest soon, friend?"],
          focus: ["Rising together! Let's focus!", "Proofing quietly with you. You've got this!"],
          done: ["Golden brown session! Magnifique!", "Baked to perfection! Bravo!"],
          task: ["Voila! DONE!", "Fresh out of the oven! Yes!", "Finished! Oh la la, wonderful!", "Très bien! Another one done!"],
          break: ["Stretch like soft dough! Ahh!", "Snack break! Something tasty?"]
        }
      }
    ]
  });
})();


