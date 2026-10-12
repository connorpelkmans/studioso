/* Study Companions, new theme ideas batch n14: lotus. The theme has one nature-object character and two young animals. */
(() => {
  const {O, OW, LG, RG, puff, LINE} = COMP_KIT;
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
})();
