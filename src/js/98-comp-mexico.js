/* ===== module: 98-comp-mexico.js ===== */
/* Study Companions, world theme */
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
        idle: ["earTwitch", "finWiggle", "topBob"], cheer: "spin",
        neck: [60, 79],
        parts: (() => {
          // a soft, frilly gill frond: a long rounded lobe with a scalloped edge, base at (bx, by), pointing at angle a
          const frond = (bx, by, a, L, w, n, fill) => {
            const cx = L / 2 - 3, rx = L / 2 + 3, d0 = 0.5, pts = [];
            for (let i = 0; i <= n; i++) { const t = Math.PI + d0 + i * (2 * Math.PI - 2 * d0) / n; pts.push([f1(cx + rx * Math.cos(t)), f1(w * Math.sin(t))]); }
            let d = `M${pts[0][0]} ${pts[0][1]}`;
            for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], br = f1(Math.hypot(x1 - x0, y1 - y0) / 2 * 1.3); d += `A${br} ${br} 0 0 1 ${x1} ${y1}`; }
            return `<g transform="translate(${bx} ${by}) rotate(${a})"><path d="${d}Z" fill="${fill}" ${O}/><path d="M${f1(L * 0.18)} 0H${f1(L * 0.72)}" stroke="#FFC4D6" stroke-width="2.2" stroke-linecap="round"/></g>`;
          };
          const gills = (s, id) => `${LG(id, [[0, "#E2507F"], [1, "#FF8DB1"]], 0, 0, 1, 0)}${[[33, 66, 158], [29.5, 54, 182], [33, 42, 208]].map(([x, y, a]) => frond(s > 0 ? x : 120 - x, y, s > 0 ? a : 180 - a, 22, 6.2, 7, `url(#${id})`)).join("")}`;
          return {
            tail: {svg: `${LG("mexico-tito-t", [[0, "#F7A6C0"], [1, "#FFC8D8"]], 0, 0, 1, 0)}
              <path d="M72 92C83 85.5 95 86.5 104.5 77.5C109 73 116.5 75 115.5 81.5C114.5 87 110.5 91.5 106 93L80 99Z" fill="#FFE3EC" ${O}/>
              <path d="M70 91Q91 95 105.5 81Q109.5 77.5 111 81.5Q111.5 84 109 87Q96 103.5 70 103Z" fill="url(#mexico-tito-t)" ${O2}/>`, pivot: [78, 96]},
            feet: `<ellipse cx="45" cy="107.5" rx="8" ry="4.6" fill="#F7A3BE" ${O}/><ellipse cx="75" cy="107.5" rx="8" ry="4.6" fill="#F7A3BE" ${O}/>`,
            body: `${RG("mexico-tito-b", [[0, "#FFE8EF"], [0.6, "#FFC8D8"], [1, "#F7A3BE"]], 0.45, 0.3, 0.8)}
              <path d="M60 66C75 66 83 82 83 95C83 105 74 110.5 60 110.5C46 110.5 37 105 37 95C37 82 45 66 60 66Z" fill="url(#mexico-tito-b)" ${O}/>
              <ellipse cx="60" cy="96" rx="13" ry="10" fill="#FFF0F5"/>`,
            armL: {svg: `<ellipse cx="38" cy="91" rx="4.8" ry="7" transform="rotate(30 38 91)" fill="#F9B0C8" ${O}/>`, pivot: [43, 87]},
            armR: {svg: `<ellipse cx="82" cy="91" rx="4.8" ry="7" transform="rotate(-30 82 91)" fill="#F9B0C8" ${O}/>`, pivot: [77, 87]},
            earL: {svg: gills(1, "mexico-tito-gl"), pivot: [30, 54]},
            earR: {svg: gills(-1, "mexico-tito-gr"), pivot: [90, 54]},
            head: `${RG("mexico-tito-h", [[0, "#FFEDF2"], [0.6, "#FFCBDA"], [1, "#F7A6C0"]], 0.42, 0.32, 0.8)}
              <path d="M60 31C83 31 94 43 94 57C94 71 81 80.5 60 80.5C39 80.5 26 71 26 57C26 43 37 31 60 31Z" fill="url(#mexico-tito-h)" ${O}/>
              <path d="M35.5 48Q38.5 40 47 36" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/><circle cx="51.5" cy="34.6" r="1.5" fill="#fff"/>`,
            top: {svg: `<circle cx="89" cy="24" r="3.6" fill="#D6F6F8" ${OW(1.6)}/><circle cx="87.9" cy="22.9" r="1.1" fill="#fff"/>
              <circle cx="95.5" cy="15" r="2.4" fill="#D6F6F8" ${OW(1.4)}/><circle cx="94.8" cy="14.3" r=".7" fill="#fff"/>`, pivot: [80, 32]}
          };
        })(),
        eyes: {lx: 45, rx: 75, y: 55, r: 4.6, style: "sparkle", color: "#2A2026"},
        mouths: {
          neutral: `<path d="M52 63.5Q60 69 68 63.5" fill="none" stroke="#2A2026" stroke-width="2.6" stroke-linecap="round"/>`,
          smile: `<path d="M50.5 62.8Q60 71.5 69.5 62.8" fill="none" stroke="#2A2026" stroke-width="2.8" stroke-linecap="round"/>`,
          open: `<path d="M51.5 62.8Q60 64 68.5 62.8Q66.5 72 60 72Q53.5 72 51.5 62.8Z" fill="#2A2026" stroke="#2A2026" stroke-width="1.6" stroke-linejoin="round"/><path d="M55.5 69.4Q60 66.4 64.5 69.4Q60 72 55.5 69.4Z" fill="#FF8FA8"/>`,
          sleepy: `<ellipse cx="60" cy="65.5" rx="2.2" ry="2.6" fill="#2A2026"/>`
        },
        mouth: {x: 60, y: 64, w: 4, color: "#2A2026"},
        cheeks: {lx: 37, rx: 83, y: 63, w: 4.6, h: 2.8, color: "#FF7A9C"},
        anchors: {top: [60, 33, 0.95], neck: [60, 84, 1], chest: [60, 96, 0.6], back: [82, 88, 0.8], hands: [60, 99, 0.86]},
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
/* end of module 98-comp-mexico.js */


