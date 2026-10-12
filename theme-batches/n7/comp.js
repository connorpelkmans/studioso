/* Study Companions, new theme ideas batch n7: canyon, saltflats (one nature-object character and two young animals each) */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  // Animal rig helpers: M mirrors a left-side part to the right (around x = 60); limb is an outlined stubby limb
  const M = s => `<g transform="matrix(-1 0 0 1 120 0)">${s}</g>`;
  const limb = (d, c, w = 5.4) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 4}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  const lizArm = `${limb("M43 82Q37 87 35.6 94", "#D9A46A")}<ellipse cx="34.8" cy="96" rx="4.8" ry="3.4" fill="#D9A46A" ${OW(2)}/><path d="M32.4 97.4l-.4 1.2M34.8 97.8v1.2M37.2 97.4l.4 1.2" stroke="#A86A3A" stroke-width="1.3" stroke-linecap="round"/>`;
  const kitEar = `<path d="M41 42C32 32 27 18 30 7C40 9 50 20 52 33Z" fill="#D9B48A" ${O}/><path d="M42 36C36 29 33 20 34 13C40 16 46 23 47.6 31Z" fill="#F8C4C0"/>`;
  const kitArm = `${limb("M47 79Q41 86 43 93", "#DDBE96")}<ellipse cx="43.6" cy="95" rx="4.4" ry="3.4" fill="#EBD6B6" ${OW(2)}/>`;
  const floWing = `<path d="M42 76C31 79 28 92 34 100C41 99 46 90 45 77Z" fill="#F0C4D4" ${O}/><path d="M36 88Q35 93 36.6 97" fill="none" stroke="#DCA0B6" stroke-width="1.6" stroke-linecap="round"/>`;
  const vicuEar = `<path d="M46 27C39 21 36 11 39 4C45 7 49 16 50 25Z" fill="#D99A5A" ${O2}/><path d="M45.6 22.6C42 18 41 12.4 42 8.4C45 11.4 47 16 47.6 20.6Z" fill="#F6B8B0"/>`;
  // a flamingo chick's short bent beak with its dark tip
  const fbeak = (dy, open) => `<path d="M53 ${54 + dy}Q60 ${50 + dy} 67 ${54 + dy}Q67.4 ${58 + dy} 63.4 ${60.4 + dy}L61.4 ${66 + dy}Q59.4 ${67.4 + dy} 58.4 ${64.6 + dy}L56.6 ${60.4 + dy}Q52.6 ${58 + dy} 53 ${54 + dy}Z" fill="#FFE2A8" ${OW(2.2)}/><path d="M56.6 ${60.4 + dy}Q60 ${62 + dy} 63.4 ${60.4 + dy}L61.4 ${66 + dy}Q59.4 ${67.4 + dy} 58.4 ${64.6 + dy}Z" fill="${INK}"/>${open ? `<path d="M55.6 ${57.4 + dy}Q60 ${60.6 + dy} 64.4 ${57.4 + dy}" fill="none" stroke="#FF8FA8" stroke-width="1.8" stroke-linecap="round"/>` : ""}`;
  const twinkle = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${c || "#fff"}"/>`;
  const shine = (x, y, rx, ry, a) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})" fill="#fff" opacity=".75"/>`;
  const petals = (cx, cy, r, n, pr, c, rot = 0) => Array.from({length: n}, (_, i) => { const a = rot + i * 2 * Math.PI / n, x = Math.round((cx + r * Math.cos(a)) * 10) / 10, y = Math.round((cy + r * Math.sin(a)) * 10) / 10; return `<ellipse cx="${x}" cy="${y}" rx="${pr}" ry="${pr * 0.7}" transform="rotate(${Math.round(a * 180 / Math.PI)} ${x} ${y})" fill="${c}" ${O2}/>`; }).join("");

  /* ================= Slot Canyon ================= */
  COMP_DATA.push({
    theme: "canyon",
    companions: [
      {
        id: "canyon-dusty", name: "Dusty", kind: "Horned Lizard Baby", pose: "stand", wearColor: "#3E8A8C",
        bio: "A tiny horned lizard with a crown of soft spikes. Basks first, then works.",
        idle: ["headTilt", "tailSwish", "wave"], cheer: "hop",
        neck: [60, 72],
        parts: {
          tail: {svg: `<path d="M76 99C86 100 95 97 104 89C104 99 96 107 79 108Z" fill="#D9A46A" ${O}/><path d="M84 103l2-3M91 101l2-3.4M97 98l2-3" stroke="#A86A3A" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [78, 104]},
          feet: `<ellipse cx="46" cy="108.5" rx="8.6" ry="4.2" fill="#D9A46A" ${O}/><ellipse cx="74" cy="108.5" rx="8.6" ry="4.2" fill="#D9A46A" ${O}/><path d="M40 111.4v-2.2M44.5 112.2v-2.2M75.5 112.2v-2.2M80 111.4v-2.2" stroke="#A86A3A" stroke-width="1.5" stroke-linecap="round"/>`,
          body: `${RG("canyon-dusty-b", [[0, "#F8DCA8"], [0.6, "#E2B47A"], [1, "#C08A52"]], 0.42, 0.3, 0.8)}
            <path d="M34 91C34 78 46 71 60 71C74 71 86 78 86 91C86 103 75 108.6 60 108.6C45 108.6 34 103 34 91Z" fill="url(#canyon-dusty-b)" ${O}/>
            <ellipse cx="60" cy="94" rx="12.5" ry="11" fill="#FFF0D2"/>
            <path d="M53 88h14M51.6 94h16.8M53.4 100h13.2" stroke="#EED6AC" stroke-width="1.4" stroke-linecap="round"/>
            <g fill="#FFF0D0"><circle cx="37.6" cy="84" r="1.6"/><circle cx="36.4" cy="91" r="1.6"/><circle cx="37.8" cy="98" r="1.6"/><circle cx="82.4" cy="84" r="1.6"/><circle cx="83.6" cy="91" r="1.6"/><circle cx="82.2" cy="98" r="1.6"/></g><g fill="#A86A3A" opacity=".7"><ellipse cx="44" cy="85" rx="3" ry="2.2"/><ellipse cx="76" cy="85" rx="3" ry="2.2"/><ellipse cx="42.6" cy="96" rx="2.4" ry="1.8"/><ellipse cx="77.4" cy="96" rx="2.4" ry="1.8"/></g>`,
          armL: {svg: lizArm, pivot: [43, 82]},
          armR: {svg: M(lizArm), pivot: [77, 82]},
          head: `${RG("canyon-dusty-h", [[0, "#FBE4B6"], [0.6, "#E8BC84"], [1, "#C8925A"]], 0.42, 0.3, 0.8)}
            <g fill="#FFF0D0" ${O2}><path d="M37 45L28 28.6L47.4 38.6Z"/><path d="M83 45L92 28.6L72.6 38.6Z"/><path d="M49 38.6L46.4 25.6L57 35.6Z"/><path d="M71 38.6L73.6 25.6L63 35.6Z"/><path d="M32 56L21.6 54L32 63Z"/><path d="M88 56L98.4 54L88 63Z"/></g>
            <path d="M30 56C30 42 44 34 60 34C76 34 90 42 90 56C90 68 78 75 60 75C42 75 30 68 30 56Z" fill="url(#canyon-dusty-h)" ${O}/>
            <path d="M52 37.6L60 36L68 37.6" fill="none" stroke="#C8925A" stroke-width="1.6" stroke-linecap="round"/>
            <g fill="#B87A44" opacity=".5"><circle cx="76" cy="43" r="2"/><circle cx="60" cy="41" r="1.5"/><circle cx="84" cy="52" r="1.4"/></g>${shine(44, 43, 5, 2.4, -25)}`
        },
        eyes: {lx: 48, rx: 72, y: 55, r: 4.4, style: "sparkle", color: "#2E1A10"},
        mouth: {x: 60, y: 64.5, w: 3.4, color: "#2E1A10"},
        cheeks: {lx: 39, rx: 81, y: 63, w: 4.4, h: 2.6, color: "#FF8A7A"},
        anchors: {top: [60, 37, 0.9], neck: [60, 76, 1], chest: [72, 94, 0.6], back: [86, 84, 0.8], hands: [60, 98, 0.85]},
        lines: {
          tap: ["Hi! Don't mind the spikes, they're just for show!", "Warm rock, warm heart, ready to help!", "Bask a little, then let's get to it!", "Tiny lizard, giant cheers for you!", "You're doing great. My crown says so!", "One sunny step at a time!", "I sat still for an hour. You can focus for ten!", "Spiky outside, proud of you inside!"],
          pet: ["Hehe, mind the horns! That's nice.", "Ooh, a pat! My tail is wiggling!"],
          hello: ["You're back! I warmed up a rock for you.", "Hi friend! Ready to bask in some studying?"],
          morning: ["Good morning! First sunbeam, best sunbeam!", "Morning! Soaking up the light for us both!"],
          night: ["The rocks are cooling. Time to curl up soon.", "Sleepy lizard here. You rest soon too!"],
          focus: ["Still as a stone, right beside you.", "Basking quietly. You've got this."],
          done: ["What a session! I'm doing a happy push-up!", "Done! You glowed like noon in the canyon!"],
          task: ["Scuttle! Another one done!", "Checked off! Spiky high five!", "Done! That's a sunny win!", "Yes! Tail wiggle of joy!"],
          break: ["Break! Find a sunny spot and stretch.", "Rest a bit in the shade. Drink some water!"]
        }
      },
      {
        id: "canyon-pinto", name: "Pinto", kind: "Pincushion Cactus", pose: "stand", wearColor: "#E0533A",
        bio: "A tiny cactus with a flower crown. Prickly outside, soft-hearted inside.",
        idle: ["topBob", "wave", "bounce"], cheer: "hop",
        parts: {
          feet: `<path d="M24 110Q26 100 42 100H78Q94 100 96 110Q96 112 92 112H28Q24 112 24 110Z" fill="#F2C48E" ${O}/><path d="M34 106q4 2 8 0M76 107q4 2 8 0" fill="none" stroke="#D49A62" stroke-width="1.8" stroke-linecap="round"/>`,
          body: `${RG("canyon-pinto-b", [[0, "#B8EC9A"], [0.55, "#78C066"], [1, "#3E8A4E"]], 0.4, 0.32, 0.8)}
            <path d="M34 84C34 64 45 52 60 52C75 52 86 64 86 84C86 98 76 106 60 106C44 106 34 98 34 84Z" fill="url(#canyon-pinto-b)" ${O}/>
            <path d="M47 55Q41 80 46 104M73 55Q79 80 74 104M60 53V106" fill="none" stroke="#3E7E44" stroke-width="1.8" stroke-linecap="round" opacity=".55"/>
            <g fill="#FFF8E8">${[[45, 62], [43, 74], [43, 94], [75, 62], [77, 74], [77, 94], [52, 100], [68, 100], [38, 84], [82, 84]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1"/>`).join("")}</g>
            ${shine(44, 64, 4.6, 2.6, -40)}`,
          armL: {svg: `<ellipse cx="28" cy="86" rx="9.5" ry="5.8" transform="rotate(-18 28 86)" fill="#6CB45C" ${O}/><circle cx="24" cy="86" r="1" fill="#FFF8E8"/><circle cx="30" cy="84" r="1" fill="#FFF8E8"/>`, pivot: [36, 84]},
          armR: {svg: `<ellipse cx="92" cy="86" rx="9.5" ry="5.8" transform="rotate(18 92 86)" fill="#6CB45C" ${O}/><circle cx="96" cy="86" r="1" fill="#FFF8E8"/><circle cx="90" cy="84" r="1" fill="#FFF8E8"/>`, pivot: [84, 84]},
          top: {svg: `${petals(60, 45, 6, 6, 4.6, "#FF7AA8")}<circle cx="60" cy="45" r="3.6" fill="#FFD84A" ${OW(1.6)}/><circle cx="58.8" cy="43.8" r="1" fill="#fff"/>`, pivot: [60, 53]}
        },
        eyes: {lx: 51, rx: 69, y: 78, r: 4, style: "sparkle", color: "#1E3018"},
        mouth: {x: 60, y: 88, w: 2.8, color: "#1E3018"},
        cheeks: {lx: 43, rx: 77, y: 86, w: 4.2, h: 2.5, color: "#FF7A8A"},
        anchors: {top: [60, 44, 0.85], neck: [60, 96, 1], chest: [72, 94, 0.6], back: [86, 76, 0.8], hands: [60, 97, 0.85]},
        lines: {
          tap: ["Hi! Careful, I'm a hugger, but a pointy one!", "A little water and a lot of sun. You've got this!", "You bloom where you're planted. Look at you!", "Tiny steps, tiny flowers, big results!", "Look sharp! You're doing great!", "I believe in you, no prickles about it!", "Every day you grow a little!", "Stick with it! Get it? Stick!"],
          pet: ["Ooh, gently! Hehe, that's nice.", "My flower just did a little wiggle!"],
          hello: ["You're here! My flower opened just for you.", "Hi hi! Let's grow something today!"],
          morning: ["Good morning! Soaking up that first sunbeam!", "Morning! Time to bloom!"],
          night: ["My flower's closing for the night. You rest too.", "Desert nights are calm. Sleep well soon!"],
          focus: ["Growing quietly beside you.", "Rooted and ready. Focus mode!"],
          done: ["What a session! I'm in full bloom!", "Done! That's a whole flower crown of work!"],
          task: ["Pop! A new bud!", "Checked off! Bloom!", "Another one! Sharp work!", "Done! I'm so proud!"],
          break: ["Break! Drink some water. Cactus orders!", "Rest in the shade for a minute!"]
        }
      },
      {
        id: "canyon-kit", name: "Kit", kind: "Kit Fox Pup", pose: "sit", wearColor: "#3E8A8C",
        bio: "Ears as big as its dreams. Hears a deadline coming from three dunes away.",
        idle: ["earTwitch", "tailSwish", "wave"], cheer: "hop",
        neck: [60, 70],
        parts: {
          tail: {svg: `${LG("canyon-kit-t", [[0, "#F2DCBC"], [1, "#C9A27A"]])}<path d="M74 106C90 108 104 98 104 82C104 74 100 70 96 72C96 84 90 94 74 96Z" fill="url(#canyon-kit-t)" ${O}/><path d="M95.6 79C95.9 76.8 96 74.4 96 72C100 70 104 74 104 82C104 84 103.8 85.8 103.4 87.6C100.4 85 97.6 82.4 95.6 79Z" fill="#4A3A3E" ${OW(2.2)}/>`, pivot: [76, 102]},
          earL: {svg: kitEar, pivot: [46, 36]},
          earR: {svg: M(kitEar), pivot: [74, 36]},
          body: `${RG("canyon-kit-b", [[0, "#F6E4C8"], [0.6, "#E2C49C"], [1, "#C49C72"]], 0.42, 0.3, 0.8)}
            <path d="M39 104C37 86 45 70 60 70C75 70 83 86 81 104C81 109 75 111 60 111C45 111 39 109 39 104Z" fill="url(#canyon-kit-b)" ${O}/>
            <ellipse cx="60" cy="95" rx="12" ry="12.5" fill="#FFF6E8"/>
            <ellipse cx="47" cy="108" rx="7.6" ry="4.6" fill="#EBD6B6" ${O}/><ellipse cx="73" cy="108" rx="7.6" ry="4.6" fill="#EBD6B6" ${O}/><path d="M44.4 110.6v-2.2M48.4 111v-2.2M71.6 111v-2.2M75.6 110.6v-2.2" stroke="#B8936C" stroke-width="1.4" stroke-linecap="round"/>`,
          armL: {svg: kitArm, pivot: [47, 79]},
          armR: {svg: M(kitArm), pivot: [73, 79]},
          head: `${RG("canyon-kit-h", [[0, "#F8E8CE"], [0.6, "#E6CAA2"], [1, "#C8A078"]], 0.42, 0.3, 0.8)}
            <path d="M34 50C34 36 46 28 60 28C74 28 86 36 86 50C86 55 85 59 89 63C81 65 75 71 60 71C45 71 39 65 31 63C35 59 34 55 34 50Z" fill="url(#canyon-kit-h)" ${O}/>
            ${shine(45, 37, 5, 2.6, -30)}`,
          face: `<path d="M43 58C48 53 54 54 60 57.6C66 54 72 53 77 58C75 66 69 70 60 70C51 70 45 66 43 58Z" fill="#FFF6EA"/>
            <ellipse cx="60" cy="59" rx="3.3" ry="2.3" fill="${INK}"/><ellipse cx="59" cy="58.3" rx="1.1" ry=".6" fill="#fff" opacity=".7"/>`
        },
        eyes: {lx: 49, rx: 71, y: 48, r: 4.4, style: "sparkle", color: "#2A1A14"},
        mouth: {x: 60, y: 64, w: 2.6, color: "#2A1A14"},
        cheeks: {lx: 43, rx: 77, y: 57, w: 3.8, h: 2.4, color: "#FF8A8A"},
        anchors: {top: [60, 30, 0.9], neck: [60, 72, 1], chest: [72, 96, 0.62], back: [84, 86, 0.8], hands: [60, 98, 0.85]},
        lines: {
          tap: ["Hi! My ears heard you coming a mile off!", "Big ears, all listening to you!", "You're doing great. I can hear it!", "Quick paws, clever mind. That's you!", "Let's sniff out the next task!", "Fox fact: you're my favorite human!", "Pounce on that list, you've got it!", "I'm all ears for your next win!"],
          pet: ["Hehe! Right behind the ears, yes!", "Ooh, my tail won't stop swishing!"],
          hello: ["You're back! My ears perked right up!", "Hi hi! I dug us a cozy study den!"],
          morning: ["Good morning! The sand's still cool!", "Morning! Ears up, eyes bright!"],
          night: ["Fox time is night time, but you rest!", "The stars are out. Curl up soon, okay?"],
          focus: ["Ears down, quiet paws. Let's focus.", "Curled up right here beside you."],
          done: ["What a session! Happy fox zoomies!", "Done! That deserves a big tail wag!"],
          task: ["Pounce! Another one done!", "Checked off! Sneaky good work!", "Done! Clever fox approves!", "Yes! Ears up, hooray!"],
          break: ["Break! Have a good stretch, fox style!", "Rest a bit in the shade. Sip some water!"]
        }
      }
    ]
  });

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
