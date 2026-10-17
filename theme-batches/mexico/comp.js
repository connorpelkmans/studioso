/* Study Companions, world theme: mexico */
(() => {
  const {O, OW, LG, RG, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const twinkle = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${c || "#fff"}"/>`;
  const f1 = v => Math.round(v * 10) / 10;
  const ring = (cx, cy, n, r, fn) => Array.from({length: n}, (_, i) => { const a = i / n * Math.PI * 2 - Math.PI / 2; return fn(f1(cx + Math.cos(a) * r), f1(cy + Math.sin(a) * r), a * 180 / Math.PI, i); }).join("");
  // a five-petal flower with a gold heart
  const flower = (x, y, r, c) => `${ring(x, y, 5, r * 0.6, (px, py) => `<circle cx="${px}" cy="${py}" r="${f1(r * 0.52)}" fill="${c}" ${OW(1.2)}/>`)}<circle cx="${x}" cy="${y}" r="${f1(r * 0.34)}" fill="#FFD23F" ${OW(1)}/>`;
  // a talavera petal flower painted on a pot
  const tflower = (x, y, r) => `${ring(x, y, 4, r * 0.55, (px, py) => `<circle cx="${px}" cy="${py}" r="${f1(r * 0.42)}" fill="#2C58B2"/>`)}<circle cx="${x}" cy="${y}" r="${f1(r * 0.28)}" fill="#F2B43A"/>`;

  COMP_DATA.push({
    theme: "mexico",
    companions: [
      {
        id: "mexico-pico", name: "Pico", kind: "Flower Crown Cactus", pose: "stand", wearColor: "#E2468C",
        bio: "A tough little cactus with a flower crown and a soft heart.",
        idle: ["sway", "topBob", "wave"], cheer: "hop",
        parts: {
          body: `${LG("mexico-pico-g", [[0, "#8ED06A"], [0.55, "#5EAE4E"], [1, "#3E8A3E"]], 0, 0, 1, 0)}${LG("mexico-pico-p", [[0, "#FFFFFF"], [1, "#E6E2DA"]])}
            <path d="M43 92V56C43 36 77 36 77 56V92Z" fill="url(#mexico-pico-g)" ${O}/>
            <path d="M52 44V90M60 41V90M68 44V90" fill="none" stroke="#3E8A3E" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>
            ${[[48, 52], [48, 66], [48, 80], [56, 47], [64, 47], [56, 84], [64, 84], [72, 52], [72, 66], [72, 80]].map(([x, y]) => `<path d="M${x - 2} ${y - 1.4}L${x} ${y}L${x + 2} ${y - 1.4}" fill="none" stroke="#FFF6D8" stroke-width="1.1" stroke-linecap="round"/>`).join("")}
            <path d="M47 58Q47 46 54 42" fill="none" stroke="#C8F0A8" stroke-width="3" stroke-linecap="round" opacity=".85"/>
            <path d="M33 86H87L82 98L78 111H42L38 98Z" fill="url(#mexico-pico-p)" ${O}/>
            <rect x="31" y="83" width="58" height="8" rx="3" fill="#F2B43A" ${O2}/>
            <path d="M37 97H83" stroke="#2C58B2" stroke-width="2.6"/>
            ${tflower(48, 104, 7)}${tflower(60, 104, 7)}${tflower(72, 104, 7)}
            ${twinkle(100, 46, 3, "#FFD23F")}${twinkle(18, 70, 2.6, "#F27AB0")}`,
          armL: {svg: `<path d="M44 80H32C27 80 25 77 25 73V68C25 64 32 64 32 68V72H44Z" fill="#5EAE4E" ${O}/><path d="M28 69v4" stroke="#C8F0A8" stroke-width="1.8" stroke-linecap="round"/><path d="M24 70l-2.4-1M24 74l-2.4 .4" stroke="#FFF6D8" stroke-width="1" stroke-linecap="round"/>`, pivot: [44, 76]},
          armR: {svg: `<path d="M76 76H88C93 76 95 73 95 69V62C95 58 88 58 88 62V68H76Z" fill="#5EAE4E" ${O}/><path d="M91 63v4" stroke="#C8F0A8" stroke-width="1.8" stroke-linecap="round" opacity=".7"/><path d="M96 64l2.4-1M96 68l2.4 .4" stroke="#FFF6D8" stroke-width="1" stroke-linecap="round"/>`, pivot: [76, 72]},
          top: {svg: `<path d="M46 43Q48 37 54 40M74 43Q72 37 66 40" fill="none" stroke="#3E8A3E" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M51 41C47 35 49 30 53 31C55 35 54 39 51 41Z M69 41C73 35 71 30 67 31C65 35 66 39 69 41Z" fill="#7CC45E" ${OW(1.4)}/>
            ${flower(47, 42, 7, "#F27AB0")}${flower(73, 42, 7, "#FFB04A")}${flower(60, 35, 8.4, "#E2468C")}`, pivot: [60, 44]}
        },
        eyes: {lx: 52, rx: 68, y: 63, r: 4.4, style: "sparkle", color: "#22301E"},
        mouth: {x: 60, y: 72, w: 2.8, color: "#22301E"},
        cheeks: {lx: 47, rx: 73, y: 70, w: 3.6, h: 2.2, color: "#FF8FA8"},
        anchors: {top: [60, 38, 0.8], neck: [60, 80, 0.85], chest: [66, 78, 0.55], back: [46, 66, 0.7], hands: [60, 84, 0.8]},
        lines: {
          tap: ["Hola! Prickly outside, all heart inside!", "Stand tall in the sun, like me. You've got this!", "Little by little, a cactus grows. So do you!", "My flower crown says you're doing great today!", "A cactus never gives up on a dry day. Neither do you!", "Deep roots, steady growth. That's the plan!", "Need a hug? Careful... okay, a gentle one!", "Every page you read is a drop of rain for me!"],
          pet: ["Hehe! Mind the spines... aww, okay!", "My flowers are blushing!"],
          hello: ["Hola, amigo! I saved you a sunny spot!", "You're back! My flowers just opened up!"],
          morning: ["Buenos días! The plaza's waking up!", "Good morning! Soak up some sunshine!"],
          night: ["Buenas noches! Even cacti need rest.", "The bandstand lights are on. Rest soon?"],
          focus: ["Rooted right here with you. Focus!", "Quiet as the desert. You've got this."],
          done: ["What a session! My crown is blooming!", "All done! Fiesta time!"],
          task: ["Done! Sharp work!", "Checked off! Olé!", "Another one! Growing strong!", "Yes! That's the spirit!"],
          break: ["Break time! Drink some water. I won't!", "Stretch up tall, like a saguaro!"]
        }
      },
      {
        id: "mexico-tito", name: "Tito", kind: "Axolotl", pose: "sit", sleepy: true, wearColor: "#2AAEB0",
        bio: "A smiley axolotl who regrows its motivation overnight.",
        idle: ["finWiggle", "headTilt", "topBob"], cheer: "spin",
        neck: [60, 76],
        parts: {
          tail: {svg: `${LG("mexico-tito-t", [[0, "#FFC2D4"], [1, "#F58AAE"]], 0, 0, 1, 0)}
            <path d="M78 98C94 100 108 92 113 78C115 72 110 70 106 74C100 82 92 86 80 86Z" fill="url(#mexico-tito-t)" ${O}/>
            <path d="M84 90Q98 88 108 77" fill="none" stroke="#FFE4EC" stroke-width="2" stroke-linecap="round" opacity=".85"/>`, pivot: [80, 92]},
          feet: `<ellipse cx="44" cy="108" rx="9" ry="4.4" fill="#F7A6C0" ${O}/><ellipse cx="76" cy="108" rx="9" ry="4.4" fill="#F7A6C0" ${O}/>
            <path d="M39 107v2.4M44 106.6v2.8M49 107v2.4M71 107v2.4M76 106.6v2.8M81 107v2.4" stroke="#D86A8E" stroke-width="1.1" stroke-linecap="round"/>`,
          body: `${RG("mexico-tito-b", [[0, "#FFE2EA"], [0.6, "#FFC2D4"], [1, "#F59AB8"]], 0.45, 0.35, 0.8)}
            <path d="M60 72C80 72 86 88 86 97C86 106 77 110.5 60 110.5C43 110.5 34 106 34 97C34 88 40 72 60 72Z" fill="url(#mexico-tito-b)" ${O}/>
            <path d="M60 80C69 80 73 89 72 97C71 103 49 103 48 97C47 89 51 80 60 80Z" fill="#FFF0F4"/>
            ${[[44, 86], [76, 86], [50, 104], [70, 104]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#E87AA0" opacity=".6"/>`).join("")}
            <rect x="46" y="76" width="28" height="5" rx="2.5" fill="#2AAEB0" ${OW(1.6)}/>`,
          armL: {svg: `<path d="M40 86C32 86 26 92 28 97C30 100 36 98 38 94" fill="#F7A6C0" ${O}/><path d="M27 97l-3 1M28 100l-2 2.6" stroke="#2B2233" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [41, 86]},
          armR: {svg: `<path d="M80 86C88 86 94 92 92 97C90 100 84 98 82 94" fill="#F7A6C0" ${O}/><path d="M93 97l3 1M92 100l2 2.6" stroke="#2B2233" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [79, 86]},
          head: `${RG("mexico-tito-h", [[0, "#FFE6EE"], [0.65, "#FFC6D6"], [1, "#F5A0BC"]], 0.45, 0.35, 0.78)}${LG("mexico-tito-gl", [[0, "#F0507E"], [1, "#C8306A"]], 0, 0, 1, 0)}${LG("mexico-tito-gr", [[0, "#C8306A"], [1, "#F0507E"]], 0, 0, 1, 0)}
            ${[[38, 50, -150], [36, 60, -178], [38, 70, 152]].map(([x, y, a]) => `<g transform="rotate(${a} ${x} ${y})"><path d="M${x} ${y - 3}C${x + 10} ${y - 6} ${x + 20} ${y - 4} ${x + 24} ${y}C${x + 20} ${y + 4} ${x + 10} ${y + 6} ${x} ${y + 3}Z" fill="url(#mexico-tito-gl)" ${O2}/>${[6, 11, 16, 20].map(d => `<path d="M${x + d} ${y - 3.4}l1.6 -3.6M${x + d} ${y + 3.4}l1.6 3.6" stroke="#C8306A" stroke-width="2" stroke-linecap="round"/>`).join("")}</g>`).join("")}
            ${[[82, 50, -30], [84, 60, -2], [82, 70, 28]].map(([x, y, a]) => `<g transform="rotate(${a} ${x} ${y})"><path d="M${x} ${y - 3}C${x + 10} ${y - 6} ${x + 20} ${y - 4} ${x + 24} ${y}C${x + 20} ${y + 4} ${x + 10} ${y + 6} ${x} ${y + 3}Z" fill="url(#mexico-tito-gr)" ${O2}/>${[6, 11, 16, 20].map(d => `<path d="M${x + d} ${y - 3.4}l1.6 -3.6M${x + d} ${y + 3.4}l1.6 3.6" stroke="#C8306A" stroke-width="2" stroke-linecap="round"/>`).join("")}</g>`).join("")}
            <path d="M60 38C82 38 89 50 89 60C89 72 78 79 60 79C42 79 31 72 31 60C31 50 38 38 60 38Z" fill="url(#mexico-tito-h)" ${O}/>
            <path d="M40 50Q44 43 52 41" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
            <circle cx="70" cy="46" r="1.6" fill="#E87AA0" opacity=".7"/><circle cx="76" cy="50" r="1.2" fill="#E87AA0" opacity=".7"/>`,
          top: {svg: `<path d="M56 40C52 30 54 24 57 23C60 27 60 34 59 40Z M64 40C68 30 66 24 63 23C60 27 60 34 61 40Z" fill="#F0507E" ${O2}/>
            <path d="M55 31l-3-1M65 31l3-1M56 27l-2.4-2M64 27l2.4-2" stroke="#C8306A" stroke-width="1.8" stroke-linecap="round"/>
            <circle cx="72" cy="22" r="3.4" fill="#BFF0F2" ${OW(1.4)}/><circle cx="71" cy="21" r="1" fill="#fff"/><circle cx="78" cy="15" r="2.2" fill="#BFF0F2" ${OW(1.2)}/>`, pivot: [60, 40]}
        },
        eyes: {lx: 47, rx: 73, y: 59, r: 3.8, style: "dot", color: "#2A2026"},
        mouth: {x: 60, y: 67, w: 5.6, color: "#2A2026"},
        cheeks: {lx: 40, rx: 80, y: 66, w: 4, h: 2.4, color: "#FF7A9C"},
        anchors: {top: [60, 40, 0.85], neck: [60, 78, 1], chest: [60, 92, 0.6], back: [84, 90, 0.8], hands: [60, 100, 0.86]},
        lines: {
          tap: ["Hi! I'm smiling. I'm always smiling!", "Axolotls regrow anything. Even motivation!", "Mistakes? I'll just grow a new start!", "Swimming slowly, still getting there!", "My gills are wiggling with excitement!", "From the canals of Xochimilco, with love!", "You keep going, I'll keep cheering!", "Little paws, big dreams. Let's study!"],
          pet: ["Hehe! My gills went all fluffy!", "Aww, that's a very happy wiggle!"],
          hello: ["You're back! My smile got even bigger!", "Hola! Ready for a little swim through notes?"],
          morning: ["Buenos días! Fresh water, fresh start!", "Good morning! I regrew my energy overnight!"],
          night: ["Sleepy gills... time to rest, maybe?", "Buenas noches! I'll regrow us some energy."],
          focus: ["Floating quietly beside you.", "Calm water, calm mind. Focus time!"],
          done: ["What a session! Happy wiggles!", "All done! I'm doing a little spin!"],
          task: ["Done! Smooth swimming!", "Checked off! Wiggle wiggle!", "Another one! Unstoppable!", "Yes! Big axolotl smile!"],
          break: ["Break time! Float for a minute.", "Stretch your fins! I mean, arms!"]
        }
      },
      {
        id: "mexico-concha", name: "Concha", kind: "Sweet Bread", pose: "stand", wearColor: "#F27AB0",
        bio: "A pan dulce with a sugar-shell top and a sunny mood.",
        idle: ["topBob", "bounce", "sparkle"], cheer: "bounce",
        parts: {
          feet: `<ellipse cx="46" cy="108" rx="8" ry="4.2" fill="#D8903E" ${O}/><ellipse cx="74" cy="108" rx="8" ry="4.2" fill="#D8903E" ${O}/>`,
          body: `${RG("mexico-concha-b", [[0, "#FFE0A0"], [0.6, "#F2B460"], [1, "#D88A36"]], 0.45, 0.3, 0.8)}
            <path d="M22 80C22 66 38 60 60 60C82 60 98 66 98 80C98 98 84 108 60 108C36 108 22 98 22 80Z" fill="url(#mexico-concha-b)" ${O}/>
            <path d="M30 96Q60 108 90 96" fill="none" stroke="#C8782A" stroke-width="2" stroke-linecap="round" opacity=".55"/>
            <path d="M30 84Q32 76 38 72" fill="none" stroke="#FFF0C8" stroke-width="3" stroke-linecap="round" opacity=".8"/>
            ${twinkle(104, 52, 3.4, "#FFD23F")}${twinkle(16, 92, 2.6, "#F27AB0")}`,
          top: {svg: `${RG("mexico-concha-s", [[0, "#FFF0F4"], [0.6, "#FFC6D8"], [1, "#F29AB8"]], 0.45, 0.3, 0.8)}
            <defs><clipPath id="mexico-concha-c"><path d="M22 75C20 51 39 38 60 38C81 38 100 51 98 75C90 80 30 80 22 75Z"/></clipPath></defs>
            <path d="M20 76C18 50 38 36 60 36C82 36 102 50 100 76C92 82 28 82 20 76Z" fill="url(#mexico-concha-s)" ${O}/>
            <g clip-path="url(#mexico-concha-c)" fill="none" stroke="#E07A9E" stroke-width="2" stroke-linecap="round" opacity=".7">${[-44, -28, -12, 4, 20, 36].map(d => `<path d="M${60 + d * 0.3} 82Q${60 + d * 0.7} 58 ${60 + d * 0.9} 34"/>`).join("")}${[[18, 40], [30, 36], [42, 28]].map(([r, w]) => `<path d="M${60 - w} ${80 - r}Q60 ${70 - r * 1.5} ${60 + w} ${80 - r}"/>`).join("")}</g>
            ${[[40, 50], [52, 44], [68, 46], [80, 54], [46, 62], [74, 64], [60, 56]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" fill="#fff" opacity=".9"/>`).join("")}
            <path d="M32 58Q38 46 50 42" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".9"/>`, pivot: [60, 78]}
        },
        eyes: {lx: 48, rx: 72, y: 88, r: 4.4, style: "sparkle", color: "#3A1E10"},
        mouth: {x: 60, y: 97, w: 3, color: "#3A1E10"},
        cheeks: {lx: 40, rx: 80, y: 95, w: 4, h: 2.4, color: "#FF8F8A"},
        anchors: {top: [60, 38, 0.95], neck: [60, 104, 1], chest: [72, 100, 0.6], back: [92, 80, 0.8], hands: [60, 104, 0.86]},
        lines: {
          tap: ["Fresh from the panadería, just for you!", "Sweet shell, soft heart, big plans!", "You rise to every challenge. Like dough!", "A little sugar makes studying sweeter!", "Pair me with hot chocolate and a good book!", "Every crumb of effort counts!", "Golden on the outside, proud on the inside!", "You're doing sweetly today. Keep it up!"],
          pet: ["Hehe! Careful, my sugar crumbles!", "Aww, warm and toasty now!"],
          hello: ["You're back! The bakery smells amazing!", "Hola! Fresh and ready to cheer you on!"],
          morning: ["Buenos días! Breakfast and big goals!", "Good morning! Baked fresh at sunrise!"],
          night: ["Cozy night! Time to cool off on the rack.", "Buenas noches! Sweet dreams, literally."],
          focus: ["Rising quietly beside you.", "Warm and calm. Let's focus!"],
          done: ["What a session! Perfectly baked!", "All done! A sweet victory!"],
          task: ["Done! Sweet!", "Checked off! Golden brown!", "Another one! Rising high!", "Yes! Sugar on top!"],
          break: ["Snack break! Something sweet, maybe?", "Stretch a little, then a sip of water!"]
        }
      }
    ]
  });
})();
