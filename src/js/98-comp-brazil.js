/* ===== module: 98-comp-brazil.js ===== */
/* Study Companions, Around the World */
(() => {
  const {O, OW, LG, RG, puff} = COMP_KIT;
  const f1 = v => Math.round(v * 10) / 10;
  const ring = (cx, cy, n, r, fn) => Array.from({length: n}, (_, i) => { const a = i / n * Math.PI * 2; return fn(f1(cx + Math.cos(a) * r), f1(cy + Math.sin(a) * r), a * 180 / Math.PI, i); }).join("");
  // a little hibiscus
  const hibiscus = (x, y, r, c = "#FF5A6A", mid = "#FFD23A") => `<g>${ring(x, y, 5, r * 0.52, (px, py, a) => `<ellipse cx="${px}" cy="${py}" rx="${f1(r * 0.55)}" ry="${f1(r * 0.42)}" transform="rotate(${f1(a)} ${px} ${py})" fill="${c}" ${OW(1)}/>`)}<circle cx="${x}" cy="${y}" r="${f1(r * 0.22)}" fill="${mid}"/></g>`;
  // a tapered, outlined ribbon along a centre line (for tails), with a round tip
  const ribbon = (pts, w0, w1) => {
    const n = pts.length - 1, L = [], R = [];
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * i / n) / 2;
      L.push([p[0] - dy / m * w, p[1] + dx / m * w]); R.push([p[0] + dy / m * w, p[1] - dx / m * w]);
    });
    const P = q => `${f1(q[0])} ${f1(q[1])}`;
    return `M${L.map(P).join("L")}A${f1(w1 / 2)} ${f1(w1 / 2)} 0 0 0 ${P(R[n])}L${R.reverse().map(P).join("L")}Z`;
  };
  // points along a cubic, then a spiral curl that carries on from its end
  const bez = (p0, p1, p2, p3, k) => Array.from({length: k + 1}, (_, i) => { const t = i / k, u = 1 - t; return [0, 1].map(j => u * u * u * p0[j] + 3 * u * u * t * p1[j] + 3 * u * t * t * p2[j] + t * t * t * p3[j]); });
  const curl = (end, dir, r0, r1, turn, k, side = 1) => {
    const m = Math.hypot(dir[0], dir[1]), c = [end[0] + side * dir[1] / m * r0, end[1] - side * dir[0] / m * r0], a0 = Math.atan2(end[1] - c[1], end[0] - c[0]);
    return Array.from({length: k}, (_, i) => { const t = (i + 1) / k, a = a0 - side * turn * t, r = r0 + (r1 - r0) * t; return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]; });
  };
  // Tuca's beak, pointing out at you: a big rounded upper bill over the crescent of the lower bill.
  // Closed, smiling or open (the lower bill drops); its gradients live in the face part
  const BEAK_U = "M44 52C44 43.6 76 43.6 76 52C76 61 73 68 67.6 73C64.6 75.8 62 77.4 60 79.6C58 77.4 55.4 75.8 52.4 73C47 68 44 61 44 52Z";
  const BEAK_L = "M47 59C45 71 52 82.6 60 84.6C68 82.6 75 71 73 59C71 68 66 74.6 60 76.6C54 74.6 49 68 47 59Z";
  const beak = (open, smile) => `${open ? `<path d="M46.6 60C46.6 72 53 84 60 86.6C67 84 73.4 72 73.4 60Z" fill="#B8243A" ${OW(2.2)}/><ellipse cx="60" cy="81.6" rx="6.4" ry="3.4" fill="#FF8FA8"/>` : ""}
    <path d="${BEAK_L}" fill="url(#brazil-tuca-bl)" ${O}${open ? ` transform="translate(0 6)"` : ""}/>
    <path d="${BEAK_U}" fill="url(#brazil-tuca-bk)" ${O}/>
    <path d="M48.6 52C49.4 48.8 53 47.4 57 47.2" fill="none" stroke="#FFF6C4" stroke-width="2.6" stroke-linecap="round"/>
    ${smile ? `<path d="M41.4 56Q42.4 61.6 47.4 62.8M78.6 56Q77.6 61.6 72.6 62.8" fill="none" stroke="#2B2233" stroke-width="2.2" stroke-linecap="round"/>` : ""}`;
  const TUCA_HEAD = "M60 19C77 19 88 31 88 45C88 60 76 70 60 70C44 70 32 60 32 45C32 31 43 19 60 19Z";
  const TUCA_BODY = "M60 62C76 62 86 76 86 88C86 99 76 104 60 104C44 104 34 99 34 88C34 76 44 62 60 62Z";
  // Mico's body and long curling tail
  const MICO_BODY = "M60 68C76 68 84 82 84 94C84 104 76 108 60 108C44 108 36 104 36 94C36 82 44 68 60 68Z";
  const micoTail = (() => { const a = bez([78, 102], [94, 108], [108, 100], [106, 84], 14); return ribbon(a.concat(curl(a[a.length - 1], [-2, -16], 9, 3.6, 4.6, 26)), 10, 5.6); })();

  COMP_DATA.push({
    theme: "brazil",
    companions: [
      {
        id: "brazil-tuca", name: "Tuca", kind: "Toco Toucan Chick", pose: "stand", wearColor: "#FF8A1E",
        bio: "A toco toucan chick with a big beak and the loudest cheer on the beach.",
        idle: ["headTilt", "wingFlutter", "topBob"], cheer: "wingFlutter",
        neck: [60, 68],
        parts: {
          feet: `<path d="M43 109C42 104 46 101 50.5 101C55 101 59 104 58 109C54 110.6 47 110.6 43 109Z" fill="#7C95CF" ${O}/><path d="M48 109.4V106.4M53 109.4V106.4" stroke="#4E6AA8" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M62 109C61 104 65 101 69.5 101C74 101 78 104 77 109C73 110.6 66 110.6 62 109Z" fill="#7C95CF" ${O}/><path d="M67 109.4V106.4M72 109.4V106.4" stroke="#4E6AA8" stroke-width="1.6" stroke-linecap="round"/>`,
          body: `${RG("brazil-tuca-b", [[0, "#4A4558"], [0.65, "#2E2A38"], [1, "#1E1B26"]], 0.4, 0.3, 0.8)}
            ${LG("brazil-tuca-bib", [[0, "#FFF6DC"], [0.62, "#FFF0C6"], [1, "#FFD24A"]])}
            <defs><clipPath id="brazil-tuca-bc"><path d="${TUCA_BODY}"/></clipPath></defs>
            <path d="${TUCA_BODY}" fill="url(#brazil-tuca-b)"/>
            <g clip-path="url(#brazil-tuca-bc)"><ellipse cx="60" cy="80" rx="14" ry="19" fill="url(#brazil-tuca-bib)"/></g>
            <path d="${TUCA_BODY}" fill="none" ${O}/>`,
          armL: {svg: `${LG("brazil-tuca-w", [[0, "#55506A"], [1, "#322E3E"]])}<path d="M41 72C32 75 27 87 29.5 98C32 101.5 37 100 40.5 95C44.5 89 45.5 79 41 72Z" fill="url(#brazil-tuca-w)" ${O}/><path d="M34 90Q35 95 37.5 97" fill="none" stroke="#7A7590" stroke-width="2" stroke-linecap="round"/>`, pivot: [41, 75]},
          armR: {svg: `<path d="M79 72C88 75 93 87 90.5 98C88 101.5 83 100 79.5 95C75.5 89 74.5 79 79 72Z" fill="url(#brazil-tuca-w)" ${O}/><path d="M86 90Q85 95 82.5 97" fill="none" stroke="#7A7590" stroke-width="2" stroke-linecap="round"/>`, pivot: [79, 75]},
          head: `${RG("brazil-tuca-h", [[0, "#4E495E"], [0.65, "#2E2A38"], [1, "#1E1B26"]], 0.4, 0.3, 0.8)}
            <defs><clipPath id="brazil-tuca-hc"><path d="${TUCA_HEAD}"/></clipPath></defs>
            <path d="${TUCA_HEAD}" fill="url(#brazil-tuca-h)"/>
            <g clip-path="url(#brazil-tuca-hc)"><path d="M24 49C38 57 82 57 96 49V80H24Z" fill="#FFF6DC"/></g>
            <path d="${TUCA_HEAD}" fill="none" ${O}/>
            <path d="M37 46Q37.5 38 41.5 33" fill="none" stroke="#6E6884" stroke-width="2.8" stroke-linecap="round"/>
            <circle cx="47" cy="40" r="6.6" fill="#7CCBF2"/><circle cx="73" cy="40" r="6.6" fill="#7CCBF2"/>`,
          face: `${LG("brazil-tuca-bk", [[0, "#FFE15A"], [0.4, "#FFB02E"], [0.7, "#FF7A1E"], [0.9, "#EE3A2A"], [1, "#E02A2A"]])}${LG("brazil-tuca-bl", [[0, "#FFC23A"], [1, "#F2741E"]])}`,
          top: {svg: `<path d="M47 31Q43 24 36 24Q39 31 47 31Z" fill="#4CB05A" ${OW(1.8)}/>${hibiscus(43, 24, 7.2)}`, pivot: [48, 30]}
        },
        eyes: {lx: 47, rx: 73, y: 40, r: 4.2, style: "sparkle", color: "#1A1820"},
        mouths: {neutral: beak(false, false), smile: beak(false, true), open: beak(true, false), sleepy: beak(false, false)},
        mouth: {x: 60, y: 76, w: 3, color: "#7A2A10"},
        cheeks: {lx: 38, rx: 82, y: 54, w: 4, h: 2.4, color: "#FF8A9A"},
        anchors: {top: [60, 21, 0.95], neck: [60, 80, 1], chest: [70, 87, 0.55], back: [84, 80, 0.8], hands: [60, 96, 0.86]},
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
        idle: ["tailSwish", "headTilt", "topBob"], cheer: "hop",
        neck: [60, 74],
        parts: {
          tail: {svg: `${LG("brazil-mico-t", [[0, "#FFB23E"], [0.6, "#F29A2A"], [1, "#C9681A"]], 0, 1, 1, 0)}<path d="${micoTail}" fill="url(#brazil-mico-t)" ${O}/>`, pivot: [80, 101]},
          body: `${RG("brazil-mico-b", [[0, "#FFCB66"], [0.65, "#F5A23A"], [1, "#DE821E"]], 0.4, 0.3, 0.8)}
            <defs><clipPath id="brazil-mico-bc"><path d="${MICO_BODY}"/></clipPath></defs>
            <path d="${MICO_BODY}" fill="url(#brazil-mico-b)"/>
            <g clip-path="url(#brazil-mico-bc)"><ellipse cx="60" cy="96" rx="13" ry="16" fill="#FFDF9C"/></g>
            <path d="${MICO_BODY}" fill="none" ${O}/>
            <ellipse cx="47" cy="106" rx="7.4" ry="4.4" fill="#7A4A34" ${O}/><ellipse cx="73" cy="106" rx="7.4" ry="4.4" fill="#7A4A34" ${O}/>`,
          armL: {svg: `${LG("brazil-mico-a", [[0, "#F7A838"], [1, "#E08420"]])}<g transform="rotate(30 36.4 90.4)"><ellipse cx="36.4" cy="90.4" rx="5" ry="7.2" fill="url(#brazil-mico-a)"/><path d="M31.7 93A5 7.2 0 0 0 41.1 93Q36.4 91.4 31.7 93Z" fill="#7A4A34"/><ellipse cx="36.4" cy="90.4" rx="5" ry="7.2" fill="none" ${O}/></g>`, pivot: [43.4, 83.4]},
          armR: {svg: `<g transform="rotate(-30 83.6 90.4)"><ellipse cx="83.6" cy="90.4" rx="5" ry="7.2" fill="url(#brazil-mico-a)"/><path d="M78.9 93A5 7.2 0 0 0 88.3 93Q83.6 91.4 78.9 93Z" fill="#7A4A34"/><ellipse cx="83.6" cy="90.4" rx="5" ry="7.2" fill="none" ${O}/></g>`, pivot: [76.6, 83.4]},
          head: `${RG("brazil-mico-m", [[0, "#FFD983"], [0.55, "#F9AE40"], [1, "#E58A22"]], 0.42, 0.34, 0.75)}
            <path d="${puff(60, 46, 30, 14, 1.2)}" fill="url(#brazil-mico-m)" ${O}/>
            <path d="${puff(60, 48, 21, 11, 1.25)}" fill="#FFC85E"/>
            <path d="M39 26Q46 19 55 18" fill="none" stroke="#FFF0C4" stroke-width="2.8" stroke-linecap="round"/>
            ${RG("brazil-mico-f", [[0, "#B47A58"], [1, "#84533C"]], 0.45, 0.35, 0.8)}
            <path d="M60 33C71 33 76 41 76 50C76 61 69 67 60 67C51 67 44 61 44 50C44 41 49 33 60 33Z" fill="url(#brazil-mico-f)" ${OW(2.6)}/>
            <ellipse cx="60" cy="60" rx="8.6" ry="6" fill="#D5A383"/>`,
          face: `<path d="M57.4 56.4Q60 55 62.6 56.4Q61.8 58.6 60 58.8Q58.2 58.6 57.4 56.4Z" fill="#4A2A22"/>`,
          top: {svg: `<path d="M80 26Q86 20 92 22Q88 28 80 26Z" fill="#4CB05A" ${OW(1.8)}/>${hibiscus(80, 22, 6.6, "#FF5A8A")}`, pivot: [76, 28]}
        },
        eyes: {lx: 53, rx: 67, y: 49, r: 4.2, style: "sparkle", color: "#24161A"},
        mouth: {x: 60, y: 62, w: 2.6, color: "#4A2A22", style: "cat"},
        cheeks: {lx: 49, rx: 71, y: 57, w: 3.4, h: 2, color: "#FF8A8A"},
        anchors: {top: [60, 19, 0.95], neck: [60, 79, 1], chest: [63, 86, 0.55], back: [84, 88, 0.8], hands: [60, 100, 0.86]},
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
/* end of module 98-comp-brazil.js */


