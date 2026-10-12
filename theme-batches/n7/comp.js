/* Study Companions, new theme ideas batch n7: saltflats (one nature-object character and two young animals each) */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  // Animal rig helper: M mirrors a left-side part to the right (around x = 60)
  const M = s => `<g transform="matrix(-1 0 0 1 120 0)">${s}</g>`;
  const floWing = `<path d="M42 76C31 79 28 92 34 100C41 99 46 90 45 77Z" fill="#F0C4D4" ${O}/><path d="M36 88Q35 93 36.6 97" fill="none" stroke="#DCA0B6" stroke-width="1.6" stroke-linecap="round"/>`;
  const vicuEar = `<path d="M46 27C39 21 36 11 39 4C45 7 49 16 50 25Z" fill="#D99A5A" ${O2}/><path d="M45.6 22.6C42 18 41 12.4 42 8.4C45 11.4 47 16 47.6 20.6Z" fill="#F6B8B0"/>`;
  // a flamingo chick's short bent beak with its dark tip
  const fbeak = (dy, open) => `<path d="M53 ${54 + dy}Q60 ${50 + dy} 67 ${54 + dy}Q67.4 ${58 + dy} 63.4 ${60.4 + dy}L61.4 ${66 + dy}Q59.4 ${67.4 + dy} 58.4 ${64.6 + dy}L56.6 ${60.4 + dy}Q52.6 ${58 + dy} 53 ${54 + dy}Z" fill="#FFE2A8" ${OW(2.2)}/><path d="M56.6 ${60.4 + dy}Q60 ${62 + dy} 63.4 ${60.4 + dy}L61.4 ${66 + dy}Q59.4 ${67.4 + dy} 58.4 ${64.6 + dy}Z" fill="${INK}"/>${open ? `<path d="M55.6 ${57.4 + dy}Q60 ${60.6 + dy} 64.4 ${57.4 + dy}" fill="none" stroke="#FF8FA8" stroke-width="1.8" stroke-linecap="round"/>` : ""}`;
  const twinkle = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${c || "#fff"}"/>`;
  const shine = (x, y, rx, ry, a) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})" fill="#fff" opacity=".75"/>`;

  /* ================= Mirror Flats ================= */
  COMP_DATA.push({
    theme: "saltflats",
    companions: [
      {
        id: "saltflats-flora", name: "Flora", kind: "Andean Flamingo Chick", pose: "stand", wearColor: "#3E7AB8",
        bio: "A fluffy chick who will be bright pink one day. Already blushes a lot.",
        idle: ["wingFlutter", "headTilt", "topBob"], cheer: "wingFlutter",
        neck: [60, 68],
        parts: {
          feet: `${LINE("M54.6 94V107", "#F49AAE", 3.4)}${LINE("M65.4 94V107", "#F49AAE", 3.4)}<path d="M46.6 110.6Q54 104.6 61.4 110.6Q54 112.4 46.6 110.6Z" fill="#F49AAE" ${O2}/><path d="M58.6 110.6Q66 104.6 73.4 110.6Q66 112.4 58.6 110.6Z" fill="#F49AAE" ${O2}/>`,
          wingL: {svg: floWing, pivot: [43, 78]},
          wingR: {svg: M(floWing), pivot: [77, 78]},
          body: `${RG("saltflats-flora-b", [[0, "#FFF4F7"], [0.6, "#F6D2DE"], [1, "#DCA6BA"]], 0.42, 0.3, 0.8)}
            <path d="${puff(60, 82, 17.5, 11, 1.25)}" fill="url(#saltflats-flora-b)" ${O}/>
            <ellipse cx="60" cy="86" rx="9" ry="8.4" fill="#FFF0F4"/>`,
          head: `${RG("saltflats-flora-h", [[0, "#FFF8FA"], [0.6, "#F8DCE6"], [1, "#E2B2C4"]], 0.42, 0.3, 0.8)}
            <path d="${puff(60, 46, 20, 12, 1.2)}" fill="url(#saltflats-flora-h)" ${O}/>${shine(47, 35, 4.6, 2.4, -30)}`,
          top: {svg: `${LINE("M57 27C55 21 58 17 62 18", "#F4C8D8", 2.4)}${LINE("M62 27C63 22 66.6 20.4 69.4 22", "#F4C8D8", 2.2)}`, pivot: [60, 28]}
        },
        eyes: {lx: 50, rx: 70, y: 45, r: 4.2, style: "sparkle", color: "#2A2440"},
        mouth: {x: 60, y: 58, w: 3},
        mouths: {neutral: fbeak(0, false), smile: fbeak(-0.6, false) + `<path d="M48.6 55q2 2.2 4.4 1.2M71.4 55q-2 2.2 -4.4 1.2" fill="none" stroke="#FF8FA8" stroke-width="1.6" stroke-linecap="round"/>`, open: fbeak(0, true), sleepy: fbeak(0.8, false)},
        cheeks: {lx: 44, rx: 76, y: 53, w: 4, h: 2.4, color: "#FF8AB0"},
        anchors: {top: [60, 28, 0.85], neck: [60, 68, 0.95], chest: [70, 90, 0.6], back: [80, 84, 0.75], hands: [60, 94, 0.8]},
        lines: {
          tap: ["Hi! I'm pale now, but I'll be bright pink one day!", "Standing on one leg for you! Wobble!", "You're doing great. Feather-light work!", "Little steps add up, like little feathers!", "Fluff up, you've got this!", "I'm blushing, you're doing so well!", "Look at us, two bright birds!", "Wade right into the next one!"],
          pet: ["Eep! So fluffy, so happy!", "Hehe, careful, my fluff is very soft!"],
          hello: ["You're back! I fluffed up just for you!", "Hi hi! The flats are shining today!"],
          morning: ["Good morning! The sky's pink already!", "Morning! Fluffy and ready to go!"],
          night: ["Tucking my beak under my wing. You too?", "The stars are in the water. Sleep soon!"],
          focus: ["Standing still as can be, beside you.", "Quiet wings, busy brain. Let's go!"],
          done: ["What a session! I feel a little pinker!", "Done! Flap flap hooray!"],
          task: ["Splash! Another one done!", "Checked off! Fluffy high five!", "Done! Pretty in pink!", "Yes! Happy little flap!"],
          break: ["Break! Stand up and stretch those legs!", "Rest your eyes. Look at something far away."]
        }
      },
      {
        id: "saltflats-mira", name: "Mira", kind: "Mirror Droplet", pose: "float", wearColor: "#C0628E",
        bio: "A drop of the mirror lake. Reflects the sky, and your best side.",
        idle: ["bounce", "sway", "topBob"], cheer: "hop",
        parts: {
          back: `<ellipse cx="60" cy="106" rx="32" ry="4" fill="#C8DEF6" ${OW(2.2)}/><path d="M36 106q5 2 10 0M74 106q5 2 10 0" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,
          body: `${LG("saltflats-mira-b", [[0, "#F0FAFF"], [0.55, "#A8DCF6"], [1, "#6EAEE6"]])}
            <path d="M60 34C66 46 85 60 85 79C85 93 74 101 60 101C46 101 35 93 35 79C35 60 54 46 60 34Z" fill="url(#saltflats-mira-b)" ${O}/>
            <path d="M39 84Q60 94 81 84Q80 96 60 98Q40 96 39 84Z" fill="#F6B8CE" opacity=".55"/>
            <path d="M41 88Q60 96 79 88" fill="none" stroke="#FFE2C8" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>
            ${shine(47, 62, 4.4, 8, 25)}<circle cx="52" cy="52" r="1.8" fill="#fff"/>`,
          armL: {svg: `<ellipse cx="30" cy="82" rx="4.6" ry="6.2" transform="rotate(25 30 82)" fill="#9AD0F2" ${O}/>`, pivot: [35, 79]},
          armR: {svg: `<ellipse cx="90" cy="82" rx="4.6" ry="6.2" transform="rotate(-25 90 82)" fill="#9AD0F2" ${O}/>`, pivot: [85, 79]},
          top: {svg: `${twinkle(70, 30, 5, "#FFFFFF")}<path d="M70 25Q70 30 75 30Q70 30 70 35Q70 30 65 30Q70 30 70 25Z" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>${twinkle(50, 27, 2.6, "#FFE4F0")}`, pivot: [62, 34]}
        },
        eyes: {lx: 51, rx: 69, y: 74, r: 4.4, style: "sparkle", color: "#1E2A4A"},
        mouth: {x: 60, y: 84, w: 3, color: "#1E2A4A"},
        cheeks: {lx: 43, rx: 77, y: 81, w: 4.2, h: 2.5, color: "#FF8AB0"},
        anchors: {top: [60, 38, 0.8], neck: [60, 94, 0.95], chest: [72, 88, 0.58], back: [84, 70, 0.75], hands: [60, 92, 0.8]},
        lines: {
          tap: ["Hi! Look, you're in my reflection, and you look great!", "Still water, clear thoughts!", "Drip, drop, don't stop!", "You reflect so much hard work!", "Every little drop fills the lake!", "Calm and shiny, just like you!", "I see a superstar in my mirror!"],
          pet: ["Hehe! Ripples everywhere!", "Ooh, that made me wobble!"],
          hello: ["You're back! The water got all sparkly.", "Hello! I've been reflecting on you!"],
          morning: ["Good morning! The sky's in the water again!", "Morning! Fresh as dew!"],
          night: ["I'm full of stars tonight. Sleep soon?", "The lake is still. Time to rest your mind."],
          focus: ["Still as a mirror, right beside you.", "No ripples. Just focus."],
          done: ["What a session! I'm glimmering!", "Done! That made a splash!"],
          task: ["Plip! Another one!", "Checked off! Splash!", "Done! Crystal clear!", "Yes! Ripple of joy!"],
          break: ["Break! Have a sip of water, like me!", "Float for a minute. Then back to it!"]
        }
      },
      {
        id: "saltflats-vicu", name: "Vicu", kind: "Vicuña Calf", pose: "stand", wearColor: "#7650B0",
        bio: "A wobbly calf in the softest wool there is. Loves a long, calm view.",
        idle: ["earTwitch", "headTilt", "tailSwish"], cheer: "hop",
        neck: [60, 58],
        parts: {
          tail: {svg: `<ellipse cx="36.6" cy="75" rx="5" ry="6.6" transform="rotate(-35 36.6 75)" fill="#E2A868" ${O}/>`, pivot: [41, 78]},
          feet: `${["M47 84V107", "M54 87V108", "M66 87V108", "M73 84V107"].map(d => `<path d="${d}" stroke="${INK}" stroke-width="8.4" stroke-linecap="round"/><path d="${d}" stroke="#E6AE70" stroke-width="4.8" stroke-linecap="round"/>`).join("")}<g fill="#5A3A2A"><rect x="43.6" y="105" width="7" height="4.4" rx="1.6"/><rect x="50.6" y="106" width="7" height="4.4" rx="1.6"/><rect x="62.4" y="106" width="7" height="4.4" rx="1.6"/><rect x="69.4" y="105" width="7" height="4.4" rx="1.6"/></g>`,
          body: `${LG("saltflats-vicu-b", [[0, "#F4C88E"], [1, "#D2894A"]])}
            <ellipse cx="60" cy="80" rx="23" ry="12.5" fill="url(#saltflats-vicu-b)" ${O}/>
            <path d="M43 85Q60 94 77 85Q73 91.6 60 92.4Q47 91.6 43 85Z" fill="#FFF6EA"/>
            <path d="M52 82C52 74 53 66 54 54H66C67 66 68 74 68 82Z" fill="url(#saltflats-vicu-b)" ${O}/>
            <path d="M55 56H65C65.6 64 66 72 65.6 80Q60 84.6 54.4 80C54 72 54.4 64 55 56Z" fill="#FFF6EA"/>
            <path d="M57 66q3 2 6 0M57 73q3 2 6 0" fill="none" stroke="#EAD8C4" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M44 74q3-2 6 0M70 74q3-2 6 0" fill="none" stroke="#C07A40" stroke-width="1.5" stroke-linecap="round" opacity=".7"/>`,
          earL: {svg: vicuEar, pivot: [48, 26]},
          earR: {svg: M(vicuEar), pivot: [72, 26]},
          head: `${RG("saltflats-vicu-h", [[0, "#F8D6A2"], [0.6, "#E2A868"], [1, "#C88448"]], 0.42, 0.3, 0.8)}
            <path d="M41 37C41 25 49 19 60 19C71 19 79 25 79 37C79 49 71 57 60 57C49 57 41 49 41 37Z" fill="url(#saltflats-vicu-h)" ${O}/>
            <path d="${puff(60, 20.6, 7, 7, 1.25)}" fill="#F8DCB4" ${O2}/>${shine(48, 28, 4.2, 2.2, -30)}`,
          face: `<ellipse cx="60" cy="48.4" rx="10.4" ry="7.4" fill="#FFF0DC" ${OW(1.8)}/><ellipse cx="56.6" cy="46" rx="1" ry="1.3" fill="${INK}"/><ellipse cx="63.4" cy="46" rx="1" ry="1.3" fill="${INK}"/>`
        },
        eyes: {lx: 50.6, rx: 69.4, y: 35.6, r: 4.4, style: "sparkle", color: "#2A1A14"},
        mouth: {x: 60, y: 51.4, w: 2.2, color: "#2A1A14"},
        cheeks: {lx: 45, rx: 75, y: 43, w: 3.6, h: 2.2, color: "#FF8A8A"},
        anchors: {top: [60, 17, 0.8], neck: [60, 58, 0.8], chest: [66, 76, 0.58], back: [76, 74, 0.72], hands: [60, 88, 0.8]},
        lines: {
          tap: ["Hi! My legs are wobbly but my cheers aren't!", "Soft wool, strong heart. You've got this!", "You're doing great, I can see it from here!", "One careful step, then another!", "Long neck, long view, big future!", "Cozy and calm, that's how we study!", "I'm proud of you, all the way up!", "Steady hooves, steady progress!"],
          pet: ["Ooh, so soft? Hehe, thank you!", "Right on the fluffy topknot, yes!"],
          hello: ["You're back! I trotted right over!", "Hi hi! The flats are so bright today!"],
          morning: ["Good morning! Frost on the grass, sun on us!", "Morning! Fresh air, fresh start!"],
          night: ["Folding my legs for the night. You rest too.", "The stars are in the water. Sleep soon?"],
          focus: ["Standing calm and quiet beside you.", "Ears forward, all focus."],
          done: ["What a session! Happy little prance!", "Done! That was a long, lovely climb!"],
          task: ["Trot! Another one done!", "Checked off! Fluffy high five!", "Done! Soft and steady wins!", "Yes! Happy hoof dance!"],
          break: ["Break! Stretch that neck nice and tall.", "Rest a bit. Have a sip of water!"]
        }
      }
    ]
  });
})();
