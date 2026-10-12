/* Study Companions, new theme ideas batch n14: lotus, seastacks. Each theme has one nature-object character and two young animals. */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const f1 = v => Math.round(v * 10) / 10;
  const shine = (x, y, rx, ry, a) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})" fill="#fff" opacity=".7"/>`;
  const twinkle = (x, y, s, c) => `<path d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${c || "#fff"}"/>`;
  // a pointed lotus petal standing on its base at (x, y), tilted by a degrees
  const petal = (x, y, len, w, a, fill, st) => `<path d="M0 0C${f1(w)} ${f1(-len * 0.28)} ${f1(w * 0.85)} ${f1(-len * 0.78)} 0 ${f1(-len)}C${f1(-w * 0.85)} ${f1(-len * 0.78)} ${f1(-w)} ${f1(-len * 0.28)} 0 0Z" transform="translate(${x} ${y}) rotate(${a})" fill="${fill}" ${st || O2}/>`;
  // a lotus leaf seen from a little above: rim, top, veins
  const pad = (cx, cy, rx, ry, id) => `${LG(id, [[0, "#86C47A"], [1, "#4E9A56"]])}<ellipse cx="${cx}" cy="${cy + 2}" rx="${rx}" ry="${ry}" fill="#A6C89A" ${O}/><ellipse cx="${cx}" cy="${cy}" rx="${rx - 1}" ry="${ry - 1.4}" fill="url(#${id})" ${O2}/>
    <path d="${[-0.8, -0.45, 0, 0.45, 0.8].map(k => `M${cx} ${cy}L${f1(cx + k * rx * 0.85)} ${f1(cy - Math.sqrt(1 - k * k) * ry * 0.7)}M${cx} ${cy}L${f1(cx + k * rx * 0.85)} ${f1(cy + Math.sqrt(1 - k * k) * ry * 0.55)}`).join("")}" fill="none" stroke="#A8DA90" stroke-width="1.1" stroke-linecap="round" opacity=".8"/>`;
  const water = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#9ED4EA" ${O}/><path d="M${cx - rx + 8} ${cy}q4 2 8 0M${cx + rx - 16} ${cy + 1}q4 2 8 0" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`;

  /* ================= Lotus Lake ================= */
  COMP_DATA.push({
    theme: "lotus",
    companions: [
      {
        id: "lotus-nelu", name: "Nelu", kind: "Lotus Blossom", pose: "stand", wearColor: "#5AA66A",
        bio: "A pink lotus who opens a little wider every time you learn something.",
        idle: ["headTilt", "sway", "wave"], cheer: "spin",
        neck: [60, 76],
        parts: {
          back: pad(60, 104, 36, 7, "lotus-nelu-p"),
          body: `${LG("lotus-nelu-s", [[0, "#8CCB66"], [1, "#4E9A3A"]], 0, 0, 1, 0)}
            <path d="M56.6 104V72H63.4V104Z" fill="url(#lotus-nelu-s)" ${O}/>
            <path d="M58 100q2 1.4 4 0" fill="none" stroke="#B4E09A" stroke-width="1.4" stroke-linecap="round"/>`,
          armL: {svg: `${LG("lotus-nelu-l", [[0, "#8CCB66"], [1, "#4E9A3A"]])}<path d="M58 90C51 82 40 81 32 86C33 88 35 89 36 89C34.5 91 34.5 93 35.5 94C44 97 52 96 58 90Z" fill="url(#lotus-nelu-l)" ${O2}/><path d="M57 90Q46 86.6 35.6 88.4" fill="none" stroke="#3E7A2E" stroke-width="1.3" stroke-linecap="round"/>`, pivot: [58, 90]},
          armR: {svg: `${LG("lotus-nelu-r", [[0, "#8CCB66"], [1, "#4E9A3A"]])}<path d="M62 90C69 82 80 81 88 86C87 88 85 89 84 89C85.5 91 85.5 93 84.5 94C76 97 68 96 62 90Z" fill="url(#lotus-nelu-r)" ${O2}/><path d="M63 90Q74 86.6 84.4 88.4" fill="none" stroke="#3E7A2E" stroke-width="1.3" stroke-linecap="round"/>`, pivot: [62, 90]},
          head: `${LG("lotus-nelu-a", [[0, "#F27AA8"], [1, "#FBD2E0"]])}${LG("lotus-nelu-b", [[0, "#F498BC"], [0.55, "#FCE2EC"], [1, "#FFF6FA"]])}
            ${[-52, -26, 0, 26, 52].map(a => petal(60, 62, 34, 11, a, "url(#lotus-nelu-a)")).join("")}
            ${[-78, 78].map(a => petal(60, 66, 26, 10, a, "url(#lotus-nelu-b)")).join("")}
            <ellipse cx="60" cy="56" rx="16" ry="14" fill="#F6EDB0" ${O}/>
            <ellipse cx="60" cy="45.6" rx="9.4" ry="2.6" fill="#D8CE6A"/><g fill="#9A8C3A">${[[54.5, 45.4], [58.2, 44.6], [62, 44.6], [65.6, 45.4], [60, 46.6]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".95"/>`).join("")}</g>
            ${[-56, 56].map(a => petal(60, 75, 15, 8, a, "url(#lotus-nelu-b)")).join("")}
            ${shine(51, 49, 3.4, 1.8, -30)}${twinkle(84, 30, 3, "#FFD86B")}`
        },
        eyes: {lx: 54, rx: 66, y: 55, r: 3.4, style: "sparkle", color: "#3A2030"},
        mouth: {x: 60, y: 61, w: 2.4, color: "#3A2030"},
        cheeks: {lx: 49.5, rx: 70.5, y: 60, w: 2.8, h: 1.8, color: "#FF8FB0"},
        anchors: {top: [60, 30, 0.85], neck: [60, 77, 0.6], chest: [66, 94, 0.5], back: [74, 86, 0.6], hands: [60, 94, 0.75]},
        lines: {
          tap: ["Hi! I open up a little more when you visit.", "Rooted in mud, blooming anyway. Like you!", "One petal at a time, one task at a time.", "Calm water, clear mind. You've got this!", "You're blossoming beautifully today.", "Stand tall and reach for the light!", "Little by little, the whole pond fills with bloom."],
          pet: ["Hehe, my petals are all fluttery!", "Aww, that's softer than morning mist."],
          hello: ["You're here! The whole lake is glowing pink!", "Hello, sunshine! The mist just lifted for you."],
          morning: ["Good morning! My petals opened with the sun.", "Dawn on the lake. A lovely time to start!"],
          night: ["My petals are folding up. Rest soon, okay?"],
          focus: ["Floating quietly beside you.", "Still water, steady focus. Keep going!"],
          done: ["What a session! I'm in full bloom!", "All done! The pond is proud of you."],
          task: ["Bloom! Another one done!", "Checked off! A brand new blossom!", "Yes! That's a lovely open flower!", "Done! Pink and proud!"],
          break: ["Break time! Breathe slow, like the still lake."]
        }
      },
      {
        id: "lotus-dabble", name: "Dabble", kind: "Mandarin Duckling", pose: "sit", wearColor: "#E0703A",
        bio: "A fluffy little duckling who paddles between the lotus leaves at dawn.",
        idle: ["headTilt", "wingFlutter", "topBob"], cheer: "wingFlutter",
        neck: [60, 72],
        parts: {
          back: water(60, 104, 38, 7),
          body: `${RG("lotus-dabble-b", [[0, "#D8B47E"], [0.6, "#B08A58"], [1, "#8A6A40"]], 0.4, 0.3, 0.8)}
            <path d="M60 68C78 68 87 80 87 92C87 102 77 107 60 107C43 107 33 102 33 92C33 80 42 68 60 68Z" fill="url(#lotus-dabble-b)" ${O}/><path d="M83 84l5-3-1.6 5.6M37 84l-5-3 1.6 5.6" fill="#B08A58" ${OW(1.8)}/>
            <ellipse cx="60" cy="94" rx="14" ry="9" fill="#F6E4B8"/>
            <path d="M28 101C40 106 80 106 92 101C92 108 80 111 60 111C40 111 28 108 28 101Z" fill="#B6E2F2" opacity=".9"/><path d="M30 102.4Q60 108.6 90 102.4" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`,
          armL: {svg: `<path d="M38 82C30 85 27 93 30 99C36 98 40 92 40.5 85Z" fill="#9C7848" ${O}/><path d="M33 90q2 2 4 1.4" fill="none" stroke="#C8A472" stroke-width="1.3" stroke-linecap="round"/>`, pivot: [39, 84]},
          armR: {svg: `<path d="M82 82C90 85 93 93 90 99C84 98 80 92 79.5 85Z" fill="#9C7848" ${O}/><path d="M87 90q-2 2 -4 1.4" fill="none" stroke="#C8A472" stroke-width="1.3" stroke-linecap="round"/>`, pivot: [81, 84]},
          head: `${RG("lotus-dabble-h", [[0, "#F2DCA0"], [0.65, "#D2AE6E"], [1, "#A88450"]], 0.4, 0.35, 0.75)}
            <path d="M60 31C73 31 82 40 82 52C82 64 73 72 60 72C47 72 38 64 38 52C38 40 47 31 60 31Z" fill="url(#lotus-dabble-h)" ${O}/>
            <path d="M45 39C49 34.6 54 33 60 33C66 33 71 34.6 75 39C70 37.6 66 37.4 60 38.4C54 37.4 50 37.6 45 39Z" fill="#9C7848" opacity=".7"/>
            <path d="M41.6 55.6Q47 53 52 55M78.4 55.6Q73 53 68 55" fill="none" stroke="#6E5230" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>
            ${shine(48, 42, 4, 2, -30)}`,
          face: `<path d="M53.6 60.4C53.6 57.6 66.4 57.6 66.4 60.4C66.4 63.6 63 65 60 65C57 65 53.6 63.6 53.6 60.4Z" fill="#F29A5E" ${OW(1.8)}/><path d="M56.6 59.6q3.4 -1 6.8 0" fill="none" stroke="#FFC898" stroke-width="1.2" stroke-linecap="round"/>`,
          top: {svg: `<path d="M57 33C54 27 56 23 59 22C58.8 25 60 27 62 28C62 24.6 64.6 22.4 67 23C64.6 26 64.6 30 63 33Z" fill="#9C7848" ${O2}/>`, pivot: [60, 33]}
        },
        eyes: {lx: 51, rx: 69, y: 53, r: 3.8, style: "sparkle", color: "#2A1E14"},
        mouth: {x: 60, y: 67, w: 2, color: "#2A1E14"},
        cheeks: {lx: 45, rx: 75, y: 60, w: 3.6, h: 2.2, color: "#FF9C8C"},
        anchors: {top: [60, 32, 0.85], neck: [60, 72, 0.85], chest: [70, 90, 0.6], back: [84, 76, 0.75], hands: [60, 92, 0.85]},
        lines: {
          tap: ["Peep! I paddled all the way over!", "Little paddles add up to long swims!", "You're doing great. Peep peep!", "Fluffy and focused, that's us!", "Keep your head up and paddle on!", "Every ripple starts with one splash!", "I saved you the comfiest lotus leaf."],
          pet: ["Peep! So fluffy, right?", "Hehe, that tickles my feathers!"],
          hello: ["Peep peep! You're here! Yay!", "Hi! The lake is warm and ready for us."],
          morning: ["Good morning! Dawn paddle time!", "Morning! The mist is all sparkly."],
          night: ["Sleepy peep. Tuck in soon, friend?"],
          focus: ["Floating right next to you. Go go!", "Quiet paddles only. You've got this!"],
          done: ["Peep! Session done! Splash party!", "All done! You paddled so well!"],
          task: ["Peep! Done!", "Splash! Another one checked off!", "Yes! Happy wing flap for you!", "Done! Quack-tastic work!"],
          break: ["Break time! Float and stretch your wings."]
        }
      },
      {
        id: "lotus-hopsy", name: "Hopsy", kind: "Lotus Leaf Froglet", pose: "sit", wearColor: "#E8719C",
        bio: "A tiny froglet who naps on lotus leaves and hops up to cheer you on.",
        idle: ["headTilt", "wave", "bounce"], cheer: "hop",
        neck: [60, 76],
        parts: {
          back: pad(60, 104, 40, 7.5, "lotus-hopsy-p") + petal(92, 103, 9, 3.6, 70, "#F7B6CC", OW(1.4)),
          feet: `<path d="M36 102C30 102 27 98 30 94C33 90 41 92 44 97C45 100 41 102 36 102Z" fill="#7CC456" ${O}/><path d="M84 102C90 102 93 98 90 94C87 90 79 92 76 97C75 100 79 102 84 102Z" fill="#7CC456" ${O}/>
            <path d="M28 103.5q2-2.4 4 0q2-2.4 4 0M84 103.5q2-2.4 4 0q2-2.4 4 0" fill="#9AD870" ${OW(1.6)}/>`,
          body: `${RG("lotus-hopsy-b", [[0, "#B4E68A"], [0.6, "#86C45C"], [1, "#5E9E40"]], 0.4, 0.3, 0.8)}
            <path d="M60 70C78 70 88 82 88 92C88 101 77 105 60 105C43 105 32 101 32 92C32 82 42 70 60 70Z" fill="url(#lotus-hopsy-b)" ${O}/>
            <ellipse cx="60" cy="94" rx="15" ry="9.5" fill="#F2F6C8"/>
            <circle cx="44" cy="82" r="1.8" fill="#5E9E40"/><circle cx="77" cy="80" r="1.5" fill="#5E9E40"/><circle cx="80" cy="90" r="1.2" fill="#5E9E40"/>`,
          armL: {svg: `<path d="M44 86C40 92 39 98 42 103C45 104 48 102 47 98C47 94 48 90 49 87Z" fill="#86C45C" ${O}/><path d="M39 104q1.6-2 3.2 0q1.6-2 3.2 0" fill="#9AD870" ${OW(1.4)}/>`, pivot: [47, 87]},
          armR: {svg: `<path d="M76 86C80 92 81 98 78 103C75 104 72 102 73 98C73 94 72 90 71 87Z" fill="#86C45C" ${O}/><path d="M74.6 104q1.6-2 3.2 0q1.6-2 3.2 0" fill="#9AD870" ${OW(1.4)}/>`, pivot: [73, 87]},
          head: `${RG("lotus-hopsy-h", [[0, "#BEEA94"], [0.6, "#8ECA62"], [1, "#66A446"]], 0.4, 0.3, 0.8)}
            <circle cx="47" cy="45" r="11.5" fill="url(#lotus-hopsy-h)" ${O}/><circle cx="73" cy="45" r="11.5" fill="url(#lotus-hopsy-h)" ${O}/>
            <path d="M60 46C79 46 90 55 90 64C90 74 78 80 60 80C42 80 30 74 30 64C30 55 41 46 60 46Z" fill="url(#lotus-hopsy-h)" ${O}/>
            <circle cx="47" cy="45" r="7.6" fill="#FFFDF0"/><circle cx="73" cy="45" r="7.6" fill="#FFFDF0"/>
            <path d="M33 60Q36 52 44 52.6" fill="none" stroke="#D6F4B4" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>
            <circle cx="56.6" cy="62" r="1" fill="#4E8A34"/><circle cx="63.4" cy="62" r="1" fill="#4E8A34"/>`,
          hat: petal(60, 38, 14, 5, -8, "#F7B6CC", OW(1.6)) + petal(60, 38, 12, 4.4, 26, "#F49ABC", OW(1.6))
        },
        eyes: {lx: 47, rx: 73, y: 45.6, r: 4.6, style: "sparkle", color: "#1E2A18"},
        mouth: {x: 60, y: 69, w: 6, color: "#1E2A18"},
        cheeks: {lx: 41, rx: 79, y: 66, w: 4.4, h: 2.6, color: "#FF9AA8"},
        anchors: {top: [60, 34, 0.9], neck: [60, 79, 0.95], chest: [70, 92, 0.6], back: [86, 74, 0.8], hands: [60, 96, 0.85]},
        lines: {
          tap: ["Ribbit! Hi! Want to see a big hop?", "Leap from leaf to leaf. Task to task!", "Small frog, big jumps. That's you!", "You're hopping along so nicely today!", "Ribbit ribbit means I'm proud of you.", "Even tadpoles turn into great leapers!", "Take it one lily leaf at a time."],
          pet: ["Ribbit! Hehe, that's ticklish!", "Ooh, I'm all cool and squishy!"],
          hello: ["Ribbit! You're back! Big hop of joy!", "Hi hi! This leaf has room for two."],
          morning: ["Good morning! Dew drops for breakfast!", "Morning! The pond is waking up with us."],
          night: ["Ribbit... the frogs are singing lullabies."],
          focus: ["Sitting still as a stone. Go for it!", "Quiet pond, busy brain. You've got this!"],
          done: ["Ribbit! Session done! Giant leap!", "All done! You hopped right through it!"],
          task: ["Hop! Done!", "Ribbit! Another one checked off!", "Leap! That task is behind you!", "Done! Froggy high five!"],
          break: ["Break time! Stretch those legs and hop!"]
        }
      }
    ]
  });

  /* ================= Sea Stacks ================= */
  COMP_DATA.push({
    theme: "seastacks",
    companions: [
      {
        id: "seastacks-stacy", name: "Stacy", kind: "Sea Stack", pose: "stand", wearColor: "#2A9AA8",
        bio: "A golden limestone stack who has stood tall through ten thousand tides.",
        idle: ["topBob", "sway", "wave"], cheer: "bounce",
        parts: {
          back: water(60, 106, 38, 6.5),
          body: `${LG("seastacks-stacy-r", [[0, "#C88A52"], [0.55, "#ECB86C"], [1, "#F4CC86"]], 0, 0, 1, 0)}
            <path d="M40 108C38 98 37 84 38 70C39 56 41 46 46 41C51 36 69 36 74 41C79 46 81 56 82 70C83 84 82 98 80 108Z" fill="url(#seastacks-stacy-r)" ${O}/>
            <path d="M40.5 92Q60 95 79.6 92M39 80Q60 83 81 80M41.6 52Q60 55 78.6 52" fill="none" stroke="#B87A48" stroke-width="1.6" stroke-linecap="round" opacity=".75"/>
            <path d="M47 100v-6M72 98v-5M45 64v-5" stroke="#B87A48" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>
            <path d="M40.6 104Q60 99 79.6 104L80 108H40Z" fill="#9A6238" opacity=".75"/>
            <path d="M33 108C36 104 42 103 46 106C50 103 56 104 60 106C64 104 70 103 74 106C78 103 84 104 87 108C82 111 38 111 33 108Z" fill="#FFFFFF" ${O2}/>
            ${shine(49, 50, 5, 2.4, -60)}`,
          armL: {svg: `<path d="M40 74C33 73 28 77 28.6 82C29.4 86 34 86.6 39 84Z" fill="#D89A5A" ${O}/><path d="M31.6 79q2-1.6 4-1" fill="none" stroke="#F4CC86" stroke-width="1.3" stroke-linecap="round"/>`, pivot: [39, 79]},
          armR: {svg: `<path d="M80 74C87 73 92 77 91.4 82C90.6 86 86 86.6 81 84Z" fill="#E8B068" ${O}/><path d="M88.4 79q-2-1.6 -4-1" fill="none" stroke="#FFE0A6" stroke-width="1.3" stroke-linecap="round"/>`, pivot: [81, 79]},
          top: {svg: `<path d="M44 44C42 36 48 31 53 34C55 28 64 28 66 33C71 30 78 35 76 43C70 46 50 47 44 44Z" fill="#7AA44A" ${O2}/><path d="M50 38q3-2 6 0M61 35q3-2 6 0" fill="none" stroke="#A8D070" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="70" cy="33" r="2.6" fill="#F6C83C" ${OW(1.3)}/><circle cx="49" cy="35" r="2.2" fill="#E886B4" ${OW(1.3)}/>`, pivot: [60, 44]}
        },
        eyes: {lx: 52, rx: 68, y: 64, r: 3.8, style: "dot", color: "#3A2414"},
        mouth: {x: 60, y: 71, w: 2.6, color: "#3A2414"},
        cheeks: {lx: 46, rx: 74, y: 69, w: 3.6, h: 2.2, color: "#FF9A84"},
        anchors: {top: [60, 34, 0.9], neck: [60, 84, 0.95], chest: [70, 90, 0.6], back: [82, 64, 0.8], hands: [60, 88, 0.85]},
        lines: {
          tap: ["Hi! I've been standing here a very long time.", "Waves come and go. You keep standing tall!", "Steady and golden, that's the plan.", "The tide shapes rock slowly. Keep at it!", "Rock solid work today, friend!", "Even stone gets beautiful with patience.", "Stand tall. The sea can't knock you over!"],
          pet: ["Hehe, I'm warm from the afternoon sun!", "Ooh, a pat! My moss is fluffing up."],
          hello: ["You're here! The surf is cheering too!", "Hello! I watched the waves while I waited."],
          morning: ["Good morning! Low tide, clear head!", "Morning! The sea is sparkling for you."],
          night: ["The stars are out over the cliffs. Rest soon?"],
          focus: ["Standing tall right beside you.", "Steady as stone. You've got this!"],
          done: ["What a session! Solid as a cliff!", "Done! Even the waves are applauding!"],
          task: ["Crash! Another one done!", "Checked off! Rock solid!", "Yes! That one's set in stone!", "Done! Golden work!"],
          break: ["Break time! Breathe in with the waves."]
        }
      },
      {
        id: "seastacks-waddles", name: "Waddles", kind: "Little Penguin Chick", pose: "stand", wearColor: "#F2B53A",
        bio: "A fluffy little penguin chick who waddles up from the beach at sunset.",
        idle: ["waddle", "headTilt", "sparkle"], cheer: "wingFlutter",
        neck: [60, 72],
        parts: {
          feet: `<ellipse cx="50" cy="109" rx="7" ry="3.6" fill="#F2C7B8" ${O}/><ellipse cx="70" cy="109" rx="7" ry="3.6" fill="#F2C7B8" ${O}/>`,
          body: `${RG("seastacks-waddles-b", [[0, "#B8C6D8"], [0.65, "#8EA2BC"], [1, "#6A80A0"]], 0.4, 0.3, 0.85)}
            <path d="M60 66C77 66 85 80 85 92C85 103 75 108 60 108C45 108 35 103 35 92C35 80 43 66 60 66Z" fill="url(#seastacks-waddles-b)" ${O}/><path d="M35.6 88l-4 -1.6 3 4M84.4 88l4 -1.6 -3 4" fill="#8EA2BC" ${OW(1.8)}/>
            <path d="M60 74C71 74 77 83 77 93C77 101 70 106 60 106C50 106 43 101 43 93C43 83 49 74 60 74Z" fill="#F6F6F2"/>
            <path d="M49 90q2 1.6 4 .6M67 92q2 1.6 4 .6M56 100q2 1.4 4 0" fill="none" stroke="#D8DCE4" stroke-width="1.6" stroke-linecap="round"/>`,
          armL: {svg: `<path d="M38 78C30 84 27 94 30 100C36 99 40 90 41 81Z" fill="#6A80A0" ${O}/>`, pivot: [39.5, 80]},
          armR: {svg: `<path d="M82 78C90 84 93 94 90 100C84 99 80 90 79 81Z" fill="#6A80A0" ${O}/>`, pivot: [80.5, 80]},
          head: `${RG("seastacks-waddles-h", [[0, "#94A8C4"], [0.6, "#6A80A2"], [1, "#4E6284"]], 0.4, 0.3, 0.8)}
            <path d="M38.4 46l-3.6-2 2.6 5.6M81.6 46l3.6-2-2.6 5.6" fill="#6A80A2" ${OW(1.8)}/><circle cx="60" cy="51" r="23" fill="url(#seastacks-waddles-h)" ${O}/>
            <path d="M58 28C56 22 59 19 62 20C60.6 22 61 24 62.4 26" fill="#6A80A2" ${O2}/>
            <path d="M43 40Q48 32 57 31" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" opacity=".35"/>`,
          face: `<path d="M60 52C54 46 43 47 41.6 56C40.6 64 49 71 60 70C71 71 79.4 64 78.4 56C77 47 66 46 60 52Z" fill="#F4F6F8"/>`
        },
        eyes: {lx: 51, rx: 69, y: 57, r: 4, style: "dot", color: "#1E2638"},
        mouths: {
          neutral: `<path d="M56 61.6Q60 60.4 64 61.6L60 66.4Z" fill="#2E3446" ${OW(1.6)}/>`,
          smile: `<path d="M55.6 61.4Q60 60 64.4 61.4L60 66.6Z" fill="#2E3446" ${OW(1.6)}/><path d="M53.4 64.4q1.6 1.2 3.2 .3M66.6 64.4q-1.6 1.2 -3.2 .3" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>`,
          open: `<path d="M56.4 63.2L63.6 63.2L60 67.4Z" fill="#FF8FA8" ${OW(1.4)}/><path d="M55.8 60.8Q60 59.6 64.2 60.8L60 63.6Z" fill="#2E3446" ${OW(1.6)}/><path d="M57 65.2L63 65.2L60 69Z" fill="#2E3446" ${OW(1.6)}/>`,
          sleepy: `<path d="M56.4 62Q60 61 63.6 62L60 65.8Z" fill="#2E3446" ${OW(1.6)}/>`
        },
        mouth: {x: 60, y: 63, w: 3},
        cheeks: {lx: 45, rx: 75, y: 63.4, w: 4, h: 2.4, color: "#FF9AAE"},
        anchors: {top: [60, 28, 1], neck: [60, 74, 1], chest: [70, 92, 0.75], back: [84, 84, 0.9], hands: [60, 96, 0.95]},
        lines: {
          tap: ["Peep! I waddled all the way up the cliff!", "Little steps, big adventures!", "You're doing amazing. Peep peep!", "Fluffy feathers, fierce focus!", "One waddle at a time gets you there.", "The sunset's pretty, but you're shining more!", "Keep going! I'm right behind you."],
          pet: ["Peep! So fluffy and warm!", "Hehe, my fuzz is all floofy now!"],
          hello: ["Peep! You're here! Happy waddle!", "Hi! I came up from the beach to see you."],
          morning: ["Good morning! Fishing trip after studying?", "Morning! The sea breeze is so fresh."],
          night: ["Sleepy peep. The burrow's calling, friend."],
          focus: ["Huddled up right here with you.", "Quiet as the tide pools. You've got this!"],
          done: ["Peep peep! Session done! Splash!", "All done! Flipper flap for you!"],
          task: ["Peep! Done!", "Waddle waddle, checked off!", "Yes! Happy flipper flap!", "Done! You're a natural!"],
          break: ["Break time! Waddle around and stretch."]
        }
      },
      {
        id: "seastacks-mocha", name: "Mocha", kind: "Fur Seal Pup", pose: "sit", wearColor: "#3AA8B4",
        bio: "A velvety fur seal pup who suns herself on the warm rocks below the cliffs.",
        idle: ["earTwitch", "finWiggle", "headTilt"], cheer: "bounce",
        neck: [60, 76],
        parts: {
          back: `<path d="M24 110C22 101 32 96 44 97C50 92 72 92 78 97C90 96 99 102 96 110Z" fill="#D8A868" ${O}/><path d="M34 103q5-3 10-1M76 102q5-2 9 1" fill="none" stroke="#F0C888" stroke-width="1.6" stroke-linecap="round"/>`,
          tail: {svg: `<path d="M82 100C88 96 96 96 100 99C97 101.6 96.4 104 99 107C93 108.6 87 107 82 104.6Z" fill="#6A4E3A" ${O}/>`, pivot: [83, 102]},
          body: `${RG("seastacks-mocha-b", [[0, "#A8866A"], [0.6, "#7E604A"], [1, "#5E4434"]], 0.4, 0.3, 0.85)}
            <path d="M60 68C76 68 86 80 86 92C86 102 76 106 60 106C44 106 34 102 34 92C34 80 44 68 60 68Z" fill="url(#seastacks-mocha-b)" ${O}/>
            <ellipse cx="60" cy="92" rx="13" ry="10" fill="#B8987A"/>
            <path d="M40 86Q43 76 51 72" fill="none" stroke="#C4A486" stroke-width="2.4" stroke-linecap="round" opacity=".6"/>`,
          armL: {svg: `<ellipse cx="38" cy="96" rx="5.6" ry="11" transform="rotate(32 38 96)" fill="#6A4E3A" ${O}/>`, pivot: [43, 89]},
          armR: {svg: `<ellipse cx="82" cy="96" rx="5.6" ry="11" transform="rotate(-32 82 96)" fill="#6A4E3A" ${O}/>`, pivot: [77, 89]},
          earL: {svg: `<path d="M40.6 45C38 43.4 37.4 41 38.6 39.6C40.6 40 42 41.6 42.8 43.4Z" fill="#6A4E3A" ${OW(1.8)}/>`, pivot: [42, 43]},
          earR: {svg: `<path d="M79.4 45C82 43.4 82.6 41 81.4 39.6C79.4 40 78 41.6 77.2 43.4Z" fill="#6A4E3A" ${OW(1.8)}/>`, pivot: [78, 43]},
          head: `${RG("seastacks-mocha-h", [[0, "#B0907A"], [0.6, "#86684E"], [1, "#64483A"]], 0.4, 0.3, 0.8)}
            <path d="M60 33C76 33 84 45 84 57C84 70 74 78 60 78C46 78 36 70 36 57C36 45 44 33 60 33Z" fill="url(#seastacks-mocha-h)" ${O}/>
            <path d="M43 46Q47 38 55 36" fill="none" stroke="#D0B49A" stroke-width="2.6" stroke-linecap="round" opacity=".55"/>`,
          face: `<ellipse cx="60" cy="66" rx="10.5" ry="7.4" fill="#C8AA8E"/>
            <ellipse cx="60" cy="62.6" rx="3.2" ry="2.3" fill="${INK}"/><circle cx="59" cy="61.9" r=".8" fill="#fff"/>
            <path d="M50.5 65.5l-6-1.2M50.5 68.6l-6 1M69.5 65.5l6-1.2M69.5 68.6l6 1" stroke="#F4E8DC" stroke-width="1.2" stroke-linecap="round"/>`
        },
        eyes: {lx: 49, rx: 71, y: 54, r: 6, style: "sparkle", color: "#1E140E"},
        mouth: {x: 60, y: 68, w: 2.4, style: "cat", color: "#1E140E"},
        cheeks: {lx: 43, rx: 77, y: 63, w: 3.6, h: 2.2, color: "#FF9A8A"},
        anchors: {top: [60, 34, 1], neck: [60, 79, 1.05], chest: [72, 92, 0.7], back: [86, 76, 0.85], hands: [60, 98, 0.9]},
        lines: {
          tap: ["Arf! Hi! These rocks are toasty today.", "Flipper high five! You're doing great!", "Go with the swell. You've got this!", "Sunbathe a little, study a lot!", "I'm cheering for you from the rocks!", "Slow and steady, like the tide coming in.", "Every wave gets you closer to shore!"],
          pet: ["Arf arf! My fur is extra soft today!", "Hehe! Wiggle wiggle, I love pats!"],
          hello: ["Arf! You're here! Happy flipper clap!", "Hi! I saved you a sunny spot on the rock."],
          morning: ["Good morning! The sea is sparkly and calm.", "Morning! Let's flop into a great day!"],
          night: ["Yawn... time to curl up by the waves."],
          focus: ["Basking quietly right here. Go for it!", "Calm sea, clear mind. You've got this!"],
          done: ["Arf! Session done! Splash of joy!", "All done! Flippers up for you!"],
          task: ["Arf! Done!", "Splash! Another one checked off!", "Yes! Seal of approval!", "Done! Big wiggle dance!"],
          break: ["Break time! Stretch out in the sun."]
        }
      }
    ]
  });
})();
