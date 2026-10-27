/* ===== module: 98-comp-canada.js ===== */
/* Study Companions, Around the World */
(() => {
  const {INK, O, OW, LG, RG} = COMP_KIT;
  const O2 = OW(2.2);
  const f1 = v => Math.round(v * 10) / 10;
  // a sugar maple leaf pointing up, centred on (x, y), s its half-size
  const LEAF = [[0, -1], [.14, -.6], [.4, -.76], [.32, -.36], [.82, -.5], [.64, -.16], [.94, .02], [.5, .2], [.56, .46], [.12, .3], [.05, .78], [-.05, .78], [-.12, .3], [-.56, .46], [-.5, .2], [-.94, .02], [-.64, -.16], [-.82, -.5], [-.32, -.36], [-.4, -.76], [-.14, -.6]];
  const leafD = (x, y, s) => "M" + LEAF.map(([u, v]) => `${f1(x + u * s)} ${f1(y + v * s)}`).join("L") + "Z";
  // the beaver's mouth
  const teeth = (y, h) => `<path d="M56.4 ${y}H63.6V${f1(y + h - 1.4)}Q63.6 ${f1(y + h)} 62.2 ${f1(y + h)}H57.8Q56.4 ${f1(y + h)} 56.4 ${f1(y + h - 1.4)}Z" fill="#FFFDF4" ${OW(1.6)}/><path d="M60 ${y}V${f1(y + h)}" stroke="${INK}" stroke-width="1.1"/>`;

  // Bucky's mouths, drawn from the line under the nose (y)
  const buckyMouths = y => ({
    neutral: `<path d="M56 ${y}Q58 ${f1(y + 1.6)} 60 ${f1(y + .2)}Q62 ${f1(y + 1.6)} 64 ${y}" fill="none" stroke="#2E1E16" stroke-width="1.6" stroke-linecap="round"/>${teeth(f1(y + .8), 5.4)}`,
    smile: `<path d="M54.6 ${f1(y - .6)}Q57.4 ${f1(y + 2.6)} 60 ${f1(y + .4)}Q62.6 ${f1(y + 2.6)} 65.4 ${f1(y - .6)}" fill="none" stroke="#2E1E16" stroke-width="1.8" stroke-linecap="round"/>${teeth(f1(y + 1.2), 5.6)}`,
    open: `<path d="M55 ${f1(y + .2)}Q60 ${f1(y - .8)} 65 ${f1(y + .2)}Q64.4 ${f1(y + 8.2)} 60 ${f1(y + 8.6)}Q55.6 ${f1(y + 8.2)} 55 ${f1(y + .2)}Z" fill="#7A2A2A" ${OW(1.6)}/><path d="M57 ${f1(y + 6.6)}Q60 ${f1(y + 4.6)} 63 ${f1(y + 6.6)}Q60 ${f1(y + 8.6)} 57 ${f1(y + 6.6)}Z" fill="#E87A7A"/>${teeth(f1(y + .4), 4.2)}`,
    sleepy: `<path d="M57.4 ${f1(y + .2)}Q60 ${f1(y + 1.2)} 62.6 ${f1(y + .2)}" fill="none" stroke="#2E1E16" stroke-width="1.5" stroke-linecap="round"/>${teeth(f1(y + .8), 4.6)}`
  });
  // the beaver's paddle tail, and a scale grid kept inside it by a clip
  const tailD = "M72 101C78 96 86 88 96 83C106 78 114 84 112.5 93C111 101 101 107 89 108C82 108.5 76 106.5 72 104Z";
  const tailGrid = (() => {
    // criss-cross lines (slope ±1.2, 6 apart), cut to the paddle's box so nothing reaches past it
    const X0 = 72, X1 = 113, Y0 = 79, Y1 = 108.5;
    let d = "";
    [1.2, -1.2].forEach(s => { for (let c = -200; c <= 300; c += 7.2) {
      const xa = Math.max(X0, Math.min((Y0 - c) / s, (Y1 - c) / s)), xb = Math.min(X1, Math.max((Y0 - c) / s, (Y1 - c) / s));
      if (xb - xa > 1) d += `M${f1(xa)} ${f1(s * xa + c)}L${f1(xb)} ${f1(s * xb + c)}`;
    } });
    return d;
  })();

  COMP_DATA.push({
    theme: "canada",
    companions: [
      {
        id: "canada-mapleton", name: "Mapleton", kind: "Sugar Maple Sprite", pose: "float", wearColor: "#F2B23E",
        bio: "A sugar maple sprite who turns brighter red with every finished task.",
        idle: ["sway", "sparkle", "topBob"], cheer: "spin",
        neck: [60, 82],
        parts: {
          top: {svg: `${LG("canada-mapleton-k", [[0, "#F8D88A"], [1, "#DDA046"]])}
            <path d="M58.4 22C54 14.4 46.4 10.2 40.6 11.6C39.4 16.4 46.6 21.4 55 23.4Z" fill="url(#canada-mapleton-k)" ${O2}/><path d="M61.6 22C66 14.4 73.6 10.2 79.4 11.6C80.6 16.4 73.4 21.4 65 23.4Z" fill="url(#canada-mapleton-k)" ${O2}/>
            <path d="M44.4 14.4Q50 15.6 54.6 20M75.6 14.4Q70 15.6 65.4 20" fill="none" stroke="#C4842F" stroke-width="1.3" stroke-linecap="round"/>
            <circle cx="56.6" cy="23" r="3.6" fill="#C8842E" ${OW(1.8)}/><circle cx="63.4" cy="23" r="3.6" fill="#C8842E" ${OW(1.8)}/>`, pivot: [60, 25]},
          body: `${RG("canada-mapleton-g", [[0, "#FF7A52"], [0.55, "#E8402C"], [1, "#BC2A1E"]], 0.42, 0.34, 0.75)}
            <path d="M60 90Q60 99 64.5 105.5" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M60 90Q60 99 64.5 105.5" fill="none" stroke="#8A3A22" stroke-width="2.8" stroke-linecap="round"/>
            <path d="${leafD(60, 61, 40)}" fill="url(#canada-mapleton-g)" ${O}/>
            <path d="M60 76.5V88.5" fill="none" stroke="#B82A1E" stroke-width="2" stroke-linecap="round"/>
            <path d="M55 40.5L57.6 32" fill="none" stroke="#FFC2A8" stroke-width="3" stroke-linecap="round"/>`
        },
        eyes: {lx: 50.5, rx: 69.5, y: 58, r: 4.6, style: "sparkle", color: "#3A1210"},
        mouth: {x: 60, y: 68, w: 3, color: "#3A1210"},
        cheeks: {lx: 44, rx: 76, y: 66, w: 3.8, h: 2.4, color: "#FFB0A0"},
        anchors: {top: [60, 24, 0.8], neck: [60, 82, 0.9], chest: [70, 76, 0.6], back: [86, 56, 0.78], hands: [60, 80, 0.8]},
        lines: {
          tap: ["Hi! I twirled all the way down to cheer you on!", "Every task you finish makes me redder. Look!", "Crisp air, clear mind. You've got this!", "One leaf at a time, the whole tree turns!", "You're glowing like a maple in October!", "I spin when I'm happy. Whee!", "Keep going! The view from the top is worth it.", "Small steps, big colors!"],
          pet: ["Hehe! That rustles in the best way!", "Ooh, I'm turning a little redder!"],
          hello: ["You're back! I saved you a sunny branch!", "Hi! The lake is sparkling for you today!"],
          morning: ["Good morning! Frost on the dock, sun on the peaks!", "Morning! Let's make today bright red!"],
          night: ["The aurora's out. Time to drift off soon?", "Goodnight! Settle softly, like a leaf."],
          focus: ["Floating quietly beside you. Focus on!", "Steady as a still lake. You've got this."],
          done: ["What a session! I'm the reddest leaf around!", "All done! Twirl of triumph!"],
          task: ["Done! A little redder!", "Checked off! Whee!", "Another one! Spin spin!", "Yes! Bright red work!"],
          break: ["Break! Step outside and feel the breeze!", "Stretch tall like a maple in the sun!"]
        }
      },
      {
        id: "canada-bucky", name: "Bucky", kind: "Beaver Kit", pose: "sit", wearColor: "#C8302A",
        bio: "A busy beaver kit who builds study habits one stick at a time.",
        idle: ["tailSwish", "headTilt", "earTwitch"], cheer: "hop",
        neck: [60, 74],
        parts: {
          tail: {svg: `${LG("canada-bucky-t", [[0, "#7A5C48"], [1, "#4A3428"]], 0, 0, 1, 1)}<defs><clipPath id="canada-bucky-tc"><path d="${tailD}"/></clipPath></defs>
            <path d="${tailD}" fill="url(#canada-bucky-t)"/>
            <path d="${tailGrid}" clip-path="url(#canada-bucky-tc)" fill="none" stroke="#33241C" stroke-width="1.3"/>
            <path d="M96 87.5Q103 84.5 107.5 87" fill="none" stroke="#A88470" stroke-width="2.4" stroke-linecap="round"/>
            <path d="${tailD}" fill="none" ${O}/>`, pivot: [78, 102]},
          body: `${RG("canada-bucky-b", [[0, "#BE8A5A"], [0.6, "#9A6640"], [1, "#77492A"]], 0.45, 0.32, 0.8)}
            <path d="M60 63C80 63 90 79 90 94C90 106 80 110.5 60 110.5C40 110.5 30 106 30 94C30 79 40 63 60 63Z" fill="url(#canada-bucky-b)" ${O}/>
            <ellipse cx="60" cy="94" rx="17" ry="14" fill="#E2C098"/>
            <ellipse cx="45" cy="107.4" rx="9.4" ry="5" fill="#6A4430" ${O}/><ellipse cx="75" cy="107.4" rx="9.4" ry="5" fill="#6A4430" ${O}/>
            <path d="M40.6 105.6v2.6M45 105.2v3M49.4 105.6v2.6M70.6 105.6v2.6M75 105.2v3M79.4 105.6v2.6" stroke="#A47A5E" stroke-width="1.5" stroke-linecap="round"/>`,
          armL: {svg: `<g transform="rotate(30 31 89)"><ellipse cx="31" cy="89" rx="5.2" ry="7.4" fill="#6A4430"/><ellipse cx="31" cy="89" rx="5.2" ry="7.4" fill="none" ${O}/><path d="M29.2 94.8v-2M32.8 94.8v-2" stroke="#C9A07A" stroke-width="1.2" stroke-linecap="round"/></g>`, pivot: [38, 82]},
          armR: {svg: `<g transform="rotate(-30 89 89)"><ellipse cx="89" cy="89" rx="5.2" ry="7.4" fill="#6A4430"/><ellipse cx="89" cy="89" rx="5.2" ry="7.4" fill="none" ${O}/><path d="M87.2 94.8v-2M90.8 94.8v-2" stroke="#C9A07A" stroke-width="1.2" stroke-linecap="round"/></g>`, pivot: [82, 82]},
          earL: {svg: `<circle cx="39.5" cy="30.5" r="7.4" fill="#865636" ${O}/><circle cx="40.6" cy="31.6" r="3.6" fill="#5A3A26"/>`, pivot: [44, 35]},
          earR: {svg: `<circle cx="80.5" cy="30.5" r="7.4" fill="#865636" ${O}/><circle cx="79.4" cy="31.6" r="3.6" fill="#5A3A26"/>`, pivot: [76, 35]},
          head: `${RG("canada-bucky-h", [[0, "#C9946A"], [0.6, "#A06C44"], [1, "#7C4E2E"]], 0.4, 0.3, 0.8)}
            <path d="M60 21C76 21 87 32 87 47C87 63 76 74.5 60 74.5C44 74.5 33 63 33 47C33 32 44 21 60 21Z" fill="url(#canada-bucky-h)" ${O}/>
            <path d="M40.5 38Q44 29.5 52 26.5" fill="none" stroke="#E3BA90" stroke-width="3" stroke-linecap="round"/>
            <ellipse cx="60" cy="61.5" rx="14.5" ry="10" fill="#E2C098"/>
            <circle cx="51" cy="62.5" r=".9" fill="#8A6448"/><circle cx="48.4" cy="60.4" r=".9" fill="#8A6448"/><circle cx="69" cy="62.5" r=".9" fill="#8A6448"/><circle cx="71.6" cy="60.4" r=".9" fill="#8A6448"/>`,
          face: `<path d="M55.4 55.4Q60 52.6 64.6 55.4Q63.6 59 60 59.4Q56.4 59 55.4 55.4Z" fill="#2E1E16" ${OW(1.2)}/><ellipse cx="58.2" cy="55.2" rx="1.3" ry=".7" fill="#fff"/>`
        },
        eyes: {lx: 49.5, rx: 70.5, y: 46, r: 4.4, style: "dot", color: "#24140C"},
        mouth: {x: 60, y: 62, w: 2.6, color: "#2E1E16"},
        mouths: buckyMouths(61.4),
        cheeks: {lx: 42.5, rx: 77.5, y: 56, w: 3.8, h: 2.4, color: "#FF9A88"},
        anchors: {top: [60, 23, 0.95], neck: [60, 76, 1.05], chest: [81, 81, 0.55], back: [86, 82, 0.85], hands: [60, 96, 0.9]},
        lines: {
          tap: ["Hi! I've been building you a study dam!", "One stick at a time. That's how dams get built!", "Busy as a beaver, and so are you!", "Chomp chomp! That task didn't stand a chance.", "Slap slap! That's my tail cheering for you!", "Let's build something great today!", "Keep at it! Every twig counts.", "You've got real beaver energy today!"],
          pet: ["Hehe! Right between the ears!", "Ooh, my fur's all fluffy now!"],
          hello: ["You're back! I kept the lodge warm!", "Hi! Ready to build some progress?"],
          morning: ["Good morning! Early beavers get the best sticks!", "Morning! The lake is calm. Let's get building!"],
          night: ["Lodge time soon? Even beavers rest.", "Goodnight! Tomorrow we build again."],
          focus: ["Heads down, teeth sharp. Let's work!", "Quiet building time. You've got this."],
          done: ["Look at that! A whole dam of done!", "Session done! Tail slap of victory!"],
          task: ["Done! Another stick on the dam!", "Checked off! Chomp!", "Yes! Built it!", "Another one! Tail slap!"],
          break: ["Break! Even beavers float a while.", "Stretch out those paws! Snack time?"]
        }
      },
      {
        id: "canada-mooska", name: "Mooska", kind: "Moose Yearling", pose: "stand", sleepy: true, wearColor: "#2E9AA0",
        bio: "A gangly moose yearling with a gentle heart and enormous patience.",
        idle: ["earTwitch", "headTilt", "tailSwish"], cheer: "bounce",
        neck: [60, 70],
        parts: {
          tail: {svg: `<path d="M86 72C91 68.5 96 70.5 95.5 75.5C95 79.5 91 80 88 77.5Z" fill="#6E4628" ${O2}/>`, pivot: [87, 75]},
          feet: `${[[48.5, 86, 110.4, 6.6, 5, "#8E5E3C"], [71.5, 86, 110.4, 6.6, 5, "#8E5E3C"]].map(([x, t, b, wt, wb, c]) => `<path d="M${f1(x - wt)} ${t}C${f1(x - wt)} ${f1((t + b) / 2)} ${f1(x - wb)} ${f1(b - 7)} ${f1(x - wb)} ${f1(b - 4)}H${f1(x + wb)}C${f1(x + wb)} ${f1(b - 7)} ${f1(x + wt)} ${f1((t + b) / 2)} ${f1(x + wt)} ${t}Z" fill="${c}" ${O}/><path d="M${f1(x - wb - .8)} ${f1(b - 5.2)}H${f1(x + wb + .8)}C${f1(x + wb + 1.2)} ${f1(b - 1.4)} ${f1(x + wb - 1)} ${b} ${x} ${b}C${f1(x - wb + 1)} ${b} ${f1(x - wb - 1.2)} ${f1(b - 1.4)} ${f1(x - wb - .8)} ${f1(b - 5.2)}Z" fill="#3E2C24" ${O}/><path d="M${x} ${f1(b - 3.8)}V${f1(b - 1)}" stroke="#7A645A" stroke-width="1.3" stroke-linecap="round"/>`).join("")}`,
          body: `${RG("canada-mooska-b", [[0, "#B07A4E"], [0.6, "#91603C"], [1, "#6E4628"]], 0.4, 0.3, 0.8)}
            <path d="M60 60C79 60 88 69.5 88 80C88 91 78 96 60 96C42 96 32 91 32 80C32 69.5 41 60 60 60Z" fill="url(#canada-mooska-b)" ${O}/>
            <path d="M36.5 84Q36.5 76 41 71.5" fill="none" stroke="#C28C60" stroke-width="2.8" stroke-linecap="round"/>
            <path d="M46 90Q60 94 74 90" fill="none" stroke="#C99A70" stroke-width="2.6" stroke-linecap="round"/>`,
          earL: {svg: `<path d="M44 35C37 29 26 29.5 20 35C25.5 41.5 36 42 44.5 40Z" fill="#8A5A38" ${O}/><path d="M39.5 36C34.5 33.6 29 33.6 25.4 35.4C29 38.4 35 38.8 39.5 38Z" fill="#EDB8A4"/>`, pivot: [42, 37]},
          earR: {svg: `<path d="M76 35C83 29 94 29.5 100 35C94.5 41.5 84 42 75.5 40Z" fill="#8A5A38" ${O}/><path d="M80.5 36C85.5 33.6 91 33.6 94.6 35.4C91 38.4 85 38.8 80.5 38Z" fill="#EDB8A4"/>`, pivot: [78, 37]},
          head: `${RG("canada-mooska-h", [[0, "#BC8658"], [0.6, "#96633E"], [1, "#74492C"]], 0.42, 0.3, 0.8)}
            <path d="M49 27L43.5 15.5M45.2 19L38.5 16.5" fill="none" stroke="${INK}" stroke-width="8.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M49 27L43.5 15.5M45.2 19L38.5 16.5" fill="none" stroke="#E2C394" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M71 27L76.5 15.5M74.8 19L81.5 16.5" fill="none" stroke="${INK}" stroke-width="8.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M71 27L76.5 15.5M74.8 19L81.5 16.5" fill="none" stroke="#E2C394" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M60 21C74.5 21 84 29.5 84 40.5C84 48 79.5 52.5 76 56.5C79.5 62 79 72.5 70 76.5C64 79 56 79 50 76.5C41 72.5 40.5 62 44 56.5C40.5 52.5 36 48 36 40.5C36 29.5 45.5 21 60 21Z" fill="url(#canada-mooska-h)" ${O}/>
            <path d="M42 34Q45.5 26.5 53.5 24" fill="none" stroke="#D9AA7E" stroke-width="3" stroke-linecap="round"/>
            <path d="M60 56.5C69 56.5 75.5 60.5 75.5 66.5C75.5 73 69 76.6 60 76.6C51 76.6 44.5 73 44.5 66.5C44.5 60.5 51 56.5 60 56.5Z" fill="#C99A72"/>
            <ellipse cx="53.6" cy="65" rx="2.4" ry="3.3" transform="rotate(-18 53.6 65)" fill="#3A2418"/><ellipse cx="66.4" cy="65" rx="2.4" ry="3.3" transform="rotate(18 66.4 65)" fill="#3A2418"/>
            <path d="M54 59.6Q60 57.6 66 59.6" fill="none" stroke="#E2BC96" stroke-width="2.2" stroke-linecap="round"/>`
        },
        eyes: {lx: 50, rx: 70, y: 41, r: 4.6, style: "sparkle", color: "#24140C"},
        mouth: {x: 60, y: 71.4, w: 2.6, color: "#3A2418"},
        cheeks: {lx: 43.6, rx: 76.4, y: 48.4, w: 3.8, h: 2.4, color: "#FF9A88"},
        anchors: {top: [60, 23, 0.85], neck: [60, 80, 1], chest: [77, 84, 0.55], back: [84, 74, 0.8], hands: [60, 90, 0.85]},
        lines: {
          tap: ["Hi... I wandered over from the lake to see you.", "Long legs, slow steps, steady progress.", "No rush. We'll get there together.", "You're doing really well. Truly.", "I'm small now, but I'll grow. So will you!", "Deep breath. The lake is calm, and so are we.", "One careful hoof at a time.", "I believe in you, as big as a moose!"],
          pet: ["Oh! My fuzzy ears are so happy.", "Mmm. That's nice. Thank you."],
          hello: ["Oh, hello! I saved you a spot by the water.", "You're back! My ears perked right up!"],
          morning: ["Good morning. Mist on the lake, sun on the peaks.", "Morning! Let's amble into the day."],
          night: ["The loons are calling. Rest soon?", "Goodnight. Sleep deep, like a still lake."],
          focus: ["Standing quietly beside you.", "Calm and patient. You've got this."],
          done: ["You did it! I'm doing a wobbly happy dance!", "Session done! So, so proud of you."],
          task: ["Done! Hoof bump!", "Checked off! Ears up!", "Another one, slow and sure!", "Yes! Big moose cheer!"],
          break: ["Break time! Go have a big drink of water.", "Stretch those legs! Mine are very long."]
        }
      }
    ]
  });
})();
/* end of module 98-comp-canada.js */


