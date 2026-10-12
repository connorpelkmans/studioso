/* Study Companions, new theme ideas batch n8: redwoods (one nature-object character and two young animals each) */
(() => {
  const {INK, O, OW, LG, RG, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  // Animal rig helpers: M mirrors a left-side part to the right (around x = 60); limb is an outlined stubby limb
  const M = s => `<g transform="matrix(-1 0 0 1 120 0)">${s}</g>`;
  const limb = (d, c, w = 5.4) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 4}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  const slugStalk = `${LINE("M52 55Q46.6 43 43.4 31.6", "#F2C83A", 3.6)}<circle cx="42.8" cy="29.6" r="4" fill="#FFE070" ${OW(2.2)}/>`;
  const chipEar = `<ellipse cx="42" cy="32" rx="5.6" ry="7" transform="rotate(-20 42 32)" fill="#C8834A" ${O2}/><ellipse cx="42.4" cy="32.8" rx="2.6" ry="3.8" transform="rotate(-20 42.4 32.8)" fill="#F6B8A8"/>`;
  const chipArm = `${limb("M47 79Q41 86 43 93", "#C8834A")}<ellipse cx="43.6" cy="95" rx="4.4" ry="3.4" fill="#E8B88A" ${OW(2)}/>`;
  const shine = (x, y, rx, ry, a) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})" fill="#fff" opacity=".75"/>`;
  const leaf = (x, y, L, w, a, c) => `<path d="M0 0Q${L * 0.45} ${-w} ${L} 0Q${L * 0.45} ${w} 0 0Z" transform="translate(${x} ${y}) rotate(${a})" fill="${c}" ${OW(1.8)}/>`;
  const heart = (cx, cy, s, rot, id, extra) => `<path d="M0 12C-6 8 -13 3.5 -13 -3C-13 -8 -9.4 -11 -5.6 -11C-3 -11 -1 -9.4 0 -7.2C1 -9.4 3 -11 5.6 -11C9.4 -11 13 -8 13 -3C13 3.5 6 8 0 12Z" transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s})" fill="url(#${id})" ${OW(3 / s)}${extra || ""}/>`;

  /* ================= Redwood Grove ================= */
  COMP_DATA.push({
    theme: "redwoods",
    companions: [
      {
        id: "redwoods-cono", name: "Cono", kind: "Redwood Cone", pose: "stand", wearColor: "#A2452A",
        bio: "Fits in your palm, holds the seeds of a tree taller than a skyscraper.",
        idle: ["topBob", "sway", "bounce"], cheer: "hop",
        parts: {
          feet: `<ellipse cx="49" cy="108" rx="7" ry="4" fill="#7A4428" ${O}/><ellipse cx="71" cy="108" rx="7" ry="4" fill="#7A4428" ${O}/>`,
          body: `${RG("redwoods-cono-b", [[0, "#F0B888"], [0.55, "#B8703E"], [1, "#7A3E22"]], 0.42, 0.35, 0.8)}<defs><clipPath id="redwoods-cono-c"><path d="M60 38C76 38 86 54 86 72C86 93 74 106 60 106C46 106 34 93 34 72C34 54 44 38 60 38Z"/></clipPath></defs>
            <path d="M60 38C76 38 86 54 86 72C86 93 74 106 60 106C46 106 34 93 34 72C34 54 44 38 60 38Z" fill="url(#redwoods-cono-b)" ${O}/>
            <g clip-path="url(#redwoods-cono-c)" fill="none" stroke-linecap="round">${[0, 1, 2, 3, 4, 5, 6, 7].map(r => [0, 1, 2, 3, 4, 5].map(c => { const x = 30 + c * 11 + (r % 2) * 5.5, y = 44 + r * 8.6; return `<path d="M${x - 5.4} ${y}Q${x} ${y + 7} ${x + 5.4} ${y}" stroke="#6A3018" stroke-width="2" opacity=".6"/><path d="M${x - 2.6} ${y + 1.6}Q${x} ${y + 3.6} ${x + 2.6} ${y + 1.6}" stroke="#F6C89A" stroke-width="1.2" opacity=".55"/>`; }).join("")).join("")}</g>
            <ellipse cx="60" cy="80" rx="17" ry="13" fill="#F2C49A" opacity=".85"/>
            ${shine(46, 52, 5, 2.6, -35)}`,
          armL: {svg: `<ellipse cx="31" cy="80" rx="5" ry="7" transform="rotate(28 31 80)" fill="#A8603A" ${O}/>`, pivot: [36, 78]},
          armR: {svg: `<ellipse cx="89" cy="80" rx="5" ry="7" transform="rotate(-28 89 80)" fill="#A8603A" ${O}/>`, pivot: [84, 78]},
          top: {svg: `${LINE("M60 40Q61 34 66 30L76 25", "#7A5A3A", 2)}${[0, 1, 2, 3].map(i => { const x = 64 + i * 3.4, y = 31.4 - i * 1.7; return leaf(x, y, 9 - i * 1.2, 2.8, -118 + i * 6, "#6EAA50") + leaf(x, y, 9 - i * 1.2, 2.8, 48 + i * 6, "#5E9A48"); }).join("")}`, pivot: [60, 40]}
        },
        eyes: {lx: 52, rx: 68, y: 77, r: 4.2, style: "sparkle", color: "#3A1A10"},
        mouth: {x: 60, y: 86, w: 2.9, color: "#3A1A10"},
        cheeks: {lx: 45, rx: 75, y: 84, w: 4, h: 2.5, color: "#FF8A7A"},
        anchors: {top: [60, 38, 0.85], neck: [60, 98, 0.95], chest: [72, 92, 0.6], back: [86, 72, 0.8], hands: [60, 96, 0.85]},
        lines: {
          tap: ["Hi! I'm small, but I'm going to be HUGE someday!", "Every giant redwood started as a little cone like me!", "Think big, start small. That's my motto!", "You're growing so much, I can see it!", "One ring at a time, just like a tree!", "Tiny seeds, tall dreams!", "Keep reaching up! You're doing great!", "I believe in you about three hundred feet tall!"],
          pet: ["Hehe, my scales are ticklish!", "Ooh, a pat! I feel taller already!"],
          hello: ["You're back! Let's grow some more!", "Hi hi! The grove missed you!"],
          morning: ["Good morning! The fog's lifting, let's go!", "Morning! Sun's in the canopy!"],
          night: ["The grove is sleeping. Time to rest.", "Even redwoods rest at night. Sweet dreams soon!"],
          focus: ["Growing quietly beside you.", "Rooted and ready. Let's focus."],
          done: ["WOW! That session was towering!", "Done! You grew a whole ring today!"],
          task: ["Pop! Done!", "Checked off! Reaching higher!", "Another one! Tall work!", "Yes! Growing strong!"],
          break: ["Break time! Stretch up tall like a tree!", "Rest your roots for a minute!"]
        }
      },
      {
        id: "redwoods-nana", name: "Nana", kind: "Banana Slug", pose: "stand", wearColor: "#5AA048",
        bio: "Bright as a banana, slow as a Sunday. Leaves a shiny trail of good vibes.",
        idle: ["earTwitch", "sway", "tailSwish"], cheer: "bounce",
        parts: {
          back: `<ellipse cx="68" cy="109.8" rx="40" ry="3.4" fill="#CFE8F2" opacity=".9"/><path d="M36 109.4q5 1.4 10 0M88 110q5 1.4 10 0" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`,
          tail: {svg: `${LG("redwoods-nana-t", [[0, "#FFE45A"], [1, "#E8B42A"]])}<path d="M76 95C88 97 99 101 108 106.4C104.6 111 88 112 76 110Z" fill="url(#redwoods-nana-t)" ${O}/><g fill="#7A5A2A" opacity=".65"><circle cx="90" cy="104.6" r="1.8"/><circle cx="99" cy="107" r="1.3"/></g>`, pivot: [78, 104]},
          earL: {svg: slugStalk, pivot: [52, 55]},
          earR: {svg: M(slugStalk), pivot: [68, 55]},
          body: `${RG("redwoods-nana-b", [[0, "#FFF6A8"], [0.55, "#FFDC4A"], [1, "#E8AE24"]], 0.4, 0.3, 0.8)}
            <path d="M37 109C30 96 31 72 42 59C49 50 71 50 78 59C89 72 90 96 83 109Z" fill="url(#redwoods-nana-b)" ${O}/>
            <path d="M39.6 66Q60 56 80.4 66" fill="none" stroke="#E2A426" stroke-width="2" stroke-linecap="round" opacity=".75"/>
            <path d="M47 60.6q2 1.4 4 0M56.6 58.6q2 1.4 4 0M66 59q2 1.4 4 0" fill="none" stroke="#F0BE36" stroke-width="1.4" stroke-linecap="round"/>
            <path d="M35 102Q60 108.4 85 102" fill="none" stroke="#E2A426" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>
            <g fill="#7A5A2A" opacity=".6"><ellipse cx="42" cy="88" rx="2.4" ry="1.8"/><ellipse cx="79" cy="74" rx="2" ry="1.5"/><ellipse cx="78" cy="92" rx="2.6" ry="1.9"/><ellipse cx="46" cy="98" rx="1.6" ry="1.2"/></g>
            <path d="M40.6 72Q37.6 82 38.6 92" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".8"/><circle cx="45.6" cy="62.4" r="1.8" fill="#fff" opacity=".85"/><ellipse cx="81.4" cy="72" rx="1.4" ry="2.2" fill="#B07A1E" opacity=".75"/>`
        },
        eyes: {lx: 50, rx: 70, y: 72, r: 4.4, style: "sparkle", color: "#3A2A10"},
        mouth: {x: 60, y: 82, w: 3, color: "#3A2A10"},
        cheeks: {lx: 43, rx: 77, y: 80, w: 4.2, h: 2.5, color: "#FF8A6A"},
        anchors: {top: [60, 53, 0.85], neck: [60, 94, 1], chest: [72, 98, 0.6], back: [82, 80, 0.75], hands: [60, 100, 0.85]},
        lines: {
          tap: ["Hi! I came as fast as I could. It took a while!", "Slow and steady, still gets there!", "You're doing great. No rush at all!", "One tiny inch at a time, that's us!", "Bright and cheerful, just like you!", "My eyestalks are both on you. Go go!", "Look at that shiny trail of progress!", "Keep going! Slugs never give up!"],
          pet: ["Hehe, a little slimy, sorry!", "Ooh, my eyestalks just did a wiggle!"],
          hello: ["You're back! I only got halfway to the door!", "Hi friend! The forest is nice and damp!"],
          morning: ["Good morning! Fog in the trees, yay!", "Morning! Dewy and ready to go!"],
          night: ["Night is slug time, but you should rest.", "The forest is quiet. Sleep soon, okay?"],
          focus: ["Sliding quietly right beside you.", "Slow focus is still focus. Let's go!"],
          done: ["What a session! I wiggled a whole inch!", "Done! Bright banana yellow pride!"],
          task: ["Slurp! Another one done!", "Checked off! Shiny work!", "Done! Slow and steady wins!", "Yes! Happy little wiggle!"],
          break: ["Break! Stretch slowly, slug style.", "Rest a bit in the cool shade. Sip some water!"]
        }
      },
      {
        id: "redwoods-nutmeg", name: "Nutmeg", kind: "Baby Chipmunk", pose: "sit", wearColor: "#3E8A5A",
        bio: "Stuffs its cheeks with seeds and its head with facts. Never runs out.",
        idle: ["tailSwish", "earTwitch", "wave"], cheer: "hop",
        neck: [60, 70],
        parts: {
          tail: {svg: `${LG("redwoods-nutmeg-t", [[0, "#ECAE70"], [1, "#B8743E"]])}<path d="M74 104C94 104 104 88 100 70C97 58 87 54 82 60C88 70 90 86 74 94Z" fill="url(#redwoods-nutmeg-t)" ${O}/><path d="M78 98C90 95 96 84 93 69" fill="none" stroke="#7A4A2A" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>`, pivot: [76, 100]},
          earL: {svg: chipEar, pivot: [45, 37]},
          earR: {svg: M(chipEar), pivot: [75, 37]},
          body: `${RG("redwoods-nutmeg-b", [[0, "#F4C48C"], [0.6, "#D8945A"], [1, "#B07040"]], 0.42, 0.3, 0.8)}
            <path d="M39 104C37 86 45 70 60 70C75 70 83 86 81 104C81 109 75 111 60 111C45 111 39 109 39 104Z" fill="url(#redwoods-nutmeg-b)" ${O}/>
            <ellipse cx="60" cy="95" rx="11.5" ry="12.5" fill="#FFF2DC"/>
            <path d="M43.4 82Q41.4 92 42.6 102M77 82Q79 92 77.8 102" fill="none" stroke="#6A4028" stroke-width="2.4" stroke-linecap="round"/>
            <path d="M46.6 80.6Q45 90 46 100M73.8 80.6Q75.4 90 74.4 100" fill="none" stroke="#FFF2DC" stroke-width="2" stroke-linecap="round"/>
            <ellipse cx="47" cy="108" rx="7.6" ry="4.6" fill="#C8834A" ${O}/><ellipse cx="73" cy="108" rx="7.6" ry="4.6" fill="#C8834A" ${O}/><path d="M44.4 110.6v-2.2M48.4 111v-2.2M71.6 111v-2.2M75.6 110.6v-2.2" stroke="#8A5230" stroke-width="1.4" stroke-linecap="round"/>`,
          armL: {svg: chipArm, pivot: [47, 79]},
          armR: {svg: M(chipArm), pivot: [73, 79]},
          head: `${RG("redwoods-nutmeg-h", [[0, "#F8CC96"], [0.6, "#DC9A5E"], [1, "#B87642"]], 0.42, 0.3, 0.8)}
            <path d="M34 52C34 37 46 29 60 29C74 29 86 37 86 52C86 64 75 71 60 71C45 71 34 64 34 52Z" fill="url(#redwoods-nutmeg-h)" ${O}/>
            <path d="M60 30.6V40" stroke="#6A4028" stroke-width="3" stroke-linecap="round"/><path d="M55.4 31.6Q54.8 36 55.6 39.6M64.6 31.6Q65.2 36 64.4 39.6" fill="none" stroke="#FFE2BC" stroke-width="1.8" stroke-linecap="round"/>${shine(45, 38, 4.6, 2.4, -30)}`,
          face: `<ellipse cx="44" cy="58.6" rx="8.4" ry="6.8" fill="#FFE6C4"/><ellipse cx="76" cy="58.6" rx="8.4" ry="6.8" fill="#FFE6C4"/><ellipse cx="60" cy="61" rx="7.6" ry="6.2" fill="#FFF2DC"/>
            <path d="M41 41Q47.6 36.6 54.6 39.4M79 41Q72.4 36.6 65.4 39.4" fill="none" stroke="#FFF2DC" stroke-width="2.4" stroke-linecap="round"/>
            <ellipse cx="60" cy="57.4" rx="2.6" ry="1.8" fill="#5A2A2A"/>`
        },
        eyes: {lx: 49, rx: 71, y: 48.5, r: 4.4, style: "sparkle", color: "#1E1008"},
        mouth: {x: 60, y: 62, w: 2.4, color: "#2B1A10", style: "cat"},
        cheeks: {lx: 43, rx: 77, y: 59, w: 4, h: 2.4, color: "#FF8A8A"},
        anchors: {top: [60, 30, 0.9], neck: [60, 72, 1], chest: [72, 96, 0.62], back: [84, 86, 0.8], hands: [60, 98, 0.85]},
        lines: {
          tap: ["Hi! Sorry, my cheeks are full of seeds!", "Stash those facts away, like me!", "You're doing great! Squeak!", "One seed at a time fills the burrow!", "Quick paws, busy brain, that's you!", "I believe in you more than acorns!", "Let's scurry through this list!", "Stripes up! You've got this!"],
          pet: ["Hehe! My tail is all poofy now!", "Squeak! Right on the stripes, yes!"],
          hello: ["You're back! I saved you a seed!", "Hi hi! I scurried all the way here!"],
          morning: ["Good morning! Sun through the redwoods!", "Morning! Cheeks full, ready to go!"],
          night: ["Curling up in my burrow soon. You too?", "The forest is sleepy. Rest soon, okay?"],
          focus: ["Sitting very still, right beside you.", "Quiet paws, busy brain. Let's focus!"],
          done: ["What a session! Happy tail flick!", "Done! That's a whole burrow of work!"],
          task: ["Squeak! Another one done!", "Checked off! Stashed away!", "Done! Nutty good work!", "Yes! Happy little scurry!"],
          break: ["Break! Have a snack, chipmunk orders!", "Stretch those paws, then sip some water!"]
        }
      }
    ]
  });
})();
