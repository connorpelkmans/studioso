/* Study Companions, Around the World: peru (Machu Picchu) */
(() => {
  const {INK, O, OW, LG, RG, puff, LINE} = COMP_KIT;
  const O2 = OW(2.2);
  const NS = `stroke="${INK}" stroke-width="3" stroke-linejoin="round" vector-effect="non-scaling-stroke"`;
  // the condor chick's hooked beak: dark with an ivory tip; open shows a little pink gape, sleepy tucks it down
  const beak = (dy, open) => `${open ? `<path d="M55.6 ${61 + dy}Q60 ${70 + dy} 64.4 ${61 + dy}Z" fill="#E87A8A" ${OW(1.8)}/>` : ""}<path d="M54.4 ${57.2 + dy}Q60 ${53.2 + dy} 65.6 ${57.2 + dy}Q65.4 ${62.6 + dy} 60.6 ${66.8 + dy}Q58.8 ${64.8 + dy} 59.8 ${62.4 + dy}Q56.4 ${61.4 + dy} 54.4 ${57.2 + dy}Z" fill="#4A4048" ${OW(2)}/><ellipse cx="61.8" cy="${64 + dy}" rx="1.5" ry="1.1" fill="#EADFCB"/><path d="M57.2 ${56.6 + dy}Q60 ${55.4 + dy} 62.8 ${56.6 + dy}" fill="none" stroke="#7A6E78" stroke-width="1.3" stroke-linecap="round"/>`;

  COMP_DATA.push({
    theme: "peru",
    companions: [
      {
        id: "peru-killa", name: "Killa", kind: "Llama Cria", pose: "stand", wearColor: "#E23A5E",
        bio: "Fluffy, curious and only spits at bad deadlines.",
        idle: ["earTwitch", "headTilt", "tailSwish"], cheer: "hop",
        neck: [60, 66],
        parts: {
          tail: {svg: `<path d="${puff(92, 86, 6.4, 7, 1.25)}" fill="#F6EEDC" ${O}/>`, pivot: [87, 88]},
          feet: `<g ${O}><rect x="37" y="95" width="8.6" height="16" rx="4" fill="#F4EAD6"/><rect x="49" y="96" width="8.6" height="15" rx="4" fill="#E2D2B4"/><rect x="63" y="96" width="8.6" height="15" rx="4" fill="#E2D2B4"/><rect x="75" y="95" width="8.6" height="16" rx="4" fill="#F4EAD6"/></g>
            <g fill="#6E5A4A"><rect x="38.6" y="107.6" width="5.4" height="2.4" rx="1"/><rect x="50.6" y="107.6" width="5.4" height="2.4" rx="1"/><rect x="64.6" y="107.6" width="5.4" height="2.4" rx="1"/><rect x="76.6" y="107.6" width="5.4" height="2.4" rx="1"/></g>`,
          body: `${LG("peru-killa-b", [[0, "#FFFBF2"], [1, "#E4D4B6"]])}
            <rect x="49" y="58" width="22" height="28" rx="10" fill="url(#peru-killa-b)" ${O}/>
            <g transform="translate(60 88) scale(1.38 0.8)"><path d="${puff(0, 0, 21, 13, 1.22)}" fill="url(#peru-killa-b)" ${NS}/></g>
            <path d="M43 79Q60 72 77 79L79 93Q60 98 41 93Z" fill="#E23A5E" ${O2}/>
            <path d="M42.4 84Q60 78.6 77.6 84" fill="none" stroke="#F6B42A" stroke-width="3.2"/>
            <path d="M43 89.6l3.4 -2.6l3.4 2.6l3.4 -2.6l3.4 2.6l3.4 -2.6l3.4 2.6l3.4 -2.6l3.4 2.6l3.4 -2.6l3.4 2.6" fill="none" stroke="#2E9ED6" stroke-width="1.8" stroke-linejoin="round"/>
            <circle cx="41.4" cy="94.4" r="2.4" fill="#F6B42A" ${OW(1.4)}/><circle cx="78.6" cy="94.4" r="2.4" fill="#2E9ED6" ${OW(1.4)}/>
            <path d="M32 82Q34 76 40 75" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round"/>`,
          earL: {svg: `${LG("peru-killa-e", [[0, "#FFFBF2"], [1, "#EADCC2"]])}<path d="M47 35C40 27 38.6 14 42.6 9.6C47.6 7.6 51.4 20 51.6 32Z" fill="url(#peru-killa-e)" ${O}/><path d="M46.4 30C43.4 24 43 16 45 13.6C47.4 14.6 48.6 22 48.6 29Z" fill="#EDB8AA"/>
            <circle cx="42.6" cy="30.6" r="3.2" fill="#E23A5E" ${OW(1.6)}/><path d="M42 33.6L41 38M43.4 33.8L43.8 38" stroke="#E23A5E" stroke-width="1.4" stroke-linecap="round"/>`, pivot: [49.4, 33]},
          earR: {svg: `<path d="M73 35C80 27 81.4 14 77.4 9.6C72.4 7.6 68.6 20 68.4 32Z" fill="url(#peru-killa-e)" ${O}/><path d="M73.6 30C76.6 24 77 16 75 13.6C72.6 14.6 71.4 22 71.4 29Z" fill="#EDB8AA"/>
            <circle cx="77.4" cy="30.6" r="3.2" fill="#F6B42A" ${OW(1.6)}/><path d="M78 33.6L79 38M76.6 33.8L76.2 38" stroke="#F6B42A" stroke-width="1.4" stroke-linecap="round"/>`, pivot: [70.6, 33]},
          head: `${RG("peru-killa-h", [[0, "#FFFFFF"], [0.7, "#FBF4E6"], [1, "#E6D6B8"]], 0.4, 0.3, 0.8)}
            <path d="M60 29C76 29 81.6 39 81.6 49C81.6 61 72 68 60 68C48 68 38.4 61 38.4 49C38.4 39 44 29 60 29Z" fill="url(#peru-killa-h)" ${O}/>
            <path d="M44 41Q47 35 53 33.4" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round"/>`,
          face: `<ellipse cx="60" cy="59.6" rx="10.4" ry="7.4" fill="#FFF8EC" ${OW(2)}/><path d="M57.2 56.2Q60 58.2 62.8 56.2" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`,
          top: {svg: `<path d="${puff(60, 31, 8, 7, 1.3)}" fill="#FFFBF2" ${O}/><path d="M56.4 29Q58 26.4 61 26" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`, pivot: [60, 36]}
        },
        eyes: {lx: 50, rx: 70, y: 47.6, r: 4.6, style: "round", color: "#2A2018"},
        mouth: {x: 60, y: 62.2, w: 2.4, color: "#2A2018"},
        cheeks: {lx: 43.4, rx: 76.6, y: 55.4, w: 3.8, h: 2.3, color: "#FF9AAE"},
        anchors: {top: [60, 30, 0.85], neck: [60, 69, 0.95], chest: [67, 86, 0.6], back: [62, 76, 0.8], hands: [60, 92, 0.8]},
        lines: {
          tap: ["Hi! I trotted all the way up the terraces!", "Your notes are as neat as Inca stonework!", "Ears up, focus on! Let's go!", "One step, one terrace, one page at a time!", "You're doing great, like really fluffy great!", "I only spit at bad deadlines. Not at you!", "Look how high we've climbed already!", "Munch, munch. Brain food for both of us!"],
          pet: ["Hehe! My wool is extra fluffy now!", "Mmm, that's the good spot behind my ears!"],
          hello: ["You're back! I saved you a sunny terrace!", "Hi hi! My tassels are wiggling with joy!"],
          morning: ["Good morning! The clouds are lifting!", "Rise and shine! The grass is extra green!"],
          night: ["The stars are out over the peaks. Rest soon?", "Goodnight! I'll curl up in my fluff."],
          focus: ["Grazing quietly right beside you.", "Ears forward. We're doing this together!"],
          done: ["What a climb! You reached the top!", "All done! Happy llama hops for you!"],
          task: ["Done! Hop hop!", "Checked off! Fluffy proud!", "Another one! No spitting needed!", "Yes! Up another terrace!"],
          break: ["Snack break! Fresh grass, maybe?", "Stretch those legs! I'll stretch my neck!"]
        }
      },
      {
        id: "peru-kuntur", name: "Kuntur", kind: "Condor Chick", pose: "stand", wearColor: "#3E3640",
        bio: "Small now, but planning to soar over every exam.",
        idle: ["wingFlutter", "headTilt", "topBob"], cheer: "wingFlutter",
        neck: [60, 70],
        parts: {
          wingL: {svg: `<path d="M39 72C27 75 22 90 27 102C37 99 43 88 43 75Z" fill="#4A4250" ${O}/><path d="M29.6 93Q32 84 38.6 80.4" fill="none" stroke="#F4F0EA" stroke-width="3.2" stroke-linecap="round"/>`, pivot: [41, 75]},
          wingR: {svg: `<path d="M81 72C93 75 98 90 93 102C83 99 77 88 77 75Z" fill="#4A4250" ${O}/><path d="M90.4 93Q88 84 81.4 80.4" fill="none" stroke="#F4F0EA" stroke-width="3.2" stroke-linecap="round"/>`, pivot: [79, 75]},
          feet: `<path d="M50 102V110M46 111L50 108L54 111M70 102V110M66 111L70 108L74 111" fill="none" stroke="${INK}" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M50 102V110M46 111L50 108L54 111M70 102V110M66 111L70 108L74 111" fill="none" stroke="#8A8494" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>`,
          body: `${RG("peru-kuntur-b", [[0, "#D2CCD4"], [0.6, "#A49CAA"], [1, "#7A7282"]], 0.4, 0.3, 0.8)}
            <path d="${puff(60, 89, 23, 15, 1.18)}" fill="url(#peru-kuntur-b)" ${O}/>
            <ellipse cx="60" cy="91" rx="12" ry="11" fill="#E4DEE6" opacity=".85"/>
            <path d="${puff(60, 72, 15, 11, 1.28)}" fill="#F8F4EE" ${O}/>`,
          head: `${RG("peru-kuntur-h", [[0, "#7A6E7C"], [0.65, "#564B58"], [1, "#3E3442"]], 0.4, 0.3, 0.8)}
            <path d="${puff(60, 49, 20.6, 13, 1.12)}" fill="url(#peru-kuntur-h)" ${O}/>
            <path d="M45 38Q48 32 55 30.6" fill="none" stroke="#9A8E9E" stroke-width="2.4" stroke-linecap="round"/>`,
          face: `<ellipse cx="60" cy="51.6" rx="14" ry="11.6" fill="#C9A6A2" ${O2}/>`,
          top: {svg: `<path d="M54.4 31.6C53.6 25 57.4 22.4 60 24.8C62.4 22 67 24.2 65.8 31.4Z" fill="#B48C8E" ${O2}/><path d="M57.4 28Q59 26.4 60.4 27.6" fill="none" stroke="#D8B6B4" stroke-width="1.4" stroke-linecap="round"/>`, pivot: [60, 31]}
        },
        eyes: {lx: 52.4, rx: 67.6, y: 49.4, r: 4.4, style: "round", color: "#1C1418"},
        mouth: {x: 60, y: 64, w: 2.6},
        mouths: {neutral: beak(0, false), smile: beak(-0.6, false) + `<path d="M46.6 58q2 2 4.4 1.2M73.4 58q-2 2 -4.4 1.2" fill="none" stroke="#FF8FA8" stroke-width="1.6" stroke-linecap="round"/>`, open: beak(-1, true), sleepy: beak(1, false)},
        cheeks: {lx: 47.4, rx: 72.6, y: 57.4, w: 3.4, h: 2.1, color: "#F08A9A"},
        anchors: {top: [60, 30, 0.85], neck: [60, 72, 1], chest: [68, 92, 0.6], back: [84, 86, 0.8], hands: [60, 96, 0.85]},
        lines: {
          tap: ["Hi! One day my wings will be three meters wide!", "I'm practicing my glide. Watch this. Whoosh!", "From up here, every exam looks tiny!", "Big wings start with small flaps, like study!", "Catch the warm air and rise. You've got this!", "My ruff is fluffy and my focus is sharp!", "I spotted a great idea. It's in your notes!", "Soaring is just patience plus flapping!"],
          pet: ["Hehe! My downy fluff is all ruffled!", "Careful, I'm still growing my big feathers!"],
          hello: ["You're back! I flapped the whole time!", "Hi! The thermals are perfect for studying!"],
          morning: ["Good morning! The sun is warming the air!", "Rise and soar! Well, rise first."],
          night: ["Condors sleep early. Will you rest soon?", "Goodnight! I'll dream of flying high."],
          focus: ["Circling quietly overhead. Focus mode!", "Wings tucked, eyes sharp. Let's go!"],
          done: ["What a flight! You soared through that!", "All done! Victory flap, flap, flap!"],
          task: ["Done! Whoosh!", "Checked off! Higher and higher!", "Another one! Soaring now!", "Yes! Wings out, proud!"],
          break: ["Perch break! Stretch your wings!", "Rest on a warm rock for a bit!"]
        }
      },
      {
        id: "peru-papa", name: "Papa", kind: "Purple Potato", pose: "stand", hatTop: true, wearColor: "#2E9ED6",
        bio: "One of four thousand kinds, and the most studious.",
        idle: ["topBob", "bounce", "sparkle"], cheer: "spin",
        parts: {
          feet: `<ellipse cx="47" cy="107" rx="8" ry="4.6" fill="#5A2C6C" ${O}/><ellipse cx="73" cy="107" rx="8" ry="4.6" fill="#5A2C6C" ${O}/>`,
          armL: {svg: `<ellipse cx="27.6" cy="80" rx="5" ry="7.6" transform="rotate(30 27.6 80)" fill="#7A3E90" ${O}/>`, pivot: [33, 75]},
          armR: {svg: `<ellipse cx="92.4" cy="80" rx="5" ry="7.6" transform="rotate(-30 92.4 80)" fill="#7A3E90" ${O}/>`, pivot: [87, 75]},
          body: `${RG("peru-papa-g", [[0, "#B87ED0"], [0.55, "#8A4AA2"], [1, "#5A2672"]], 0.4, 0.35, 0.8)}
            <path d="M60 37C72 35 82 39 88 48C93 56 92.4 64 91 72C92.4 82 89 94 80 101C72 107 60 106.4 52 105.6C42 106 33 100 30 92C27 84 28.4 77 29 70C27 60 30 50 37 44C43 39 50 38 60 37Z" fill="url(#peru-papa-g)" ${O}/>
            <path d="M38 60q2.4 -1.4 4 .8M80 92q2.4 -1.4 4 .8M42 94q2 -2 4 -.4M81 56q2 -1.6 3.8 .4M64 99q2 -1.2 3.6 .6" fill="none" stroke="#4A1A5E" stroke-width="1.8" stroke-linecap="round"/>
            <circle cx="40.6" cy="62" r=".9" fill="#D8A8E8"/><circle cx="82.8" cy="94" r=".9" fill="#D8A8E8"/>
            <path d="M35 56Q37 50 43 47" fill="none" stroke="#E2C2EE" stroke-width="2.8" stroke-linecap="round"/>`,
          hat: `${LG("peru-papa-h", [[0, "#F05A7A"], [1, "#C42A50"]])}
            <path d="M35 46L33.4 62Q37 65 41.6 61L43 46Z" fill="url(#peru-papa-h)" ${O}/><path d="M85 46L86.6 62Q83 65 78.4 61L77 46Z" fill="url(#peru-papa-h)" ${O}/>
            ${LINE("M36.4 63V71", "#F6B42A", 2.4)}${LINE("M83.6 63V71", "#F6B42A", 2.4)}<circle cx="36.4" cy="73" r="2.6" fill="#2E9ED6" ${OW(1.4)}/><circle cx="83.6" cy="73" r="2.6" fill="#2E9ED6" ${OW(1.4)}/>
            <path d="M33.6 47C33 28 45 20 60 20C75 20 87 28 86.4 47Z" fill="url(#peru-papa-h)" ${O}/>
            <path d="M33.4 40.6H86.6V47.4H33.4Z" fill="#F6B42A" ${O2}/>
            <path d="M35 46l3 -4l3 4l3 -4l3 4l3 -4l3 4l3 -4l3 4l3 -4l3 4l3 -4l3 4l3 -4l3 4l3 -4l3 4" fill="none" stroke="#2E9ED6" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M44 33l3 -3l3 3l-3 3zM57 30l3 -3l3 3l-3 3zM70 33l3 -3l3 3l-3 3z" fill="#FFFFFF" opacity=".9"/>
            <path d="M42 28Q47 23 54 22" fill="none" stroke="#FFB0C2" stroke-width="2.2" stroke-linecap="round"/>`,
          top: {svg: `<path d="M60 22V15" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><path d="${puff(60, 12, 6, 8, 1.28)}" fill="#2E9ED6" ${O}/><path d="M57.6 10Q59 8.4 61 8.6" fill="none" stroke="#A8DCF6" stroke-width="1.6" stroke-linecap="round"/>`, pivot: [60, 21]}
        },
        eyes: {lx: 50, rx: 70, y: 66, r: 4.8, style: "sparkle", color: "#2A1030"},
        mouth: {x: 60, y: 77, w: 3, color: "#2A1030"},
        cheeks: {lx: 42.4, rx: 77.6, y: 75, w: 4, h: 2.4, color: "#FF8AB8"},
        anchors: {top: [60, 22, 0.9], neck: [60, 99, 0.95], chest: [72, 90, 0.6], back: [88, 64, 0.8], hands: [60, 96, 0.86]},
        lines: {
          tap: ["Hi! I'm one of four thousand kinds of potato!", "Purple on the outside, purple on the inside!", "I've read every page twice. Your turn!", "Study smart, stay grounded. Like me!", "Knowledge grows best in good soil!", "My chullo keeps my brain toasty warm!", "Roots first, then sprouts. That's learning!", "You're the top potato today. Promise!"],
          pet: ["Hehe! That tickles my potato eyes!", "Aww, I feel extra starchy and happy!"],
          hello: ["You're back! I kept your seat warm!", "Hi! Let's dig into some studying!"],
          morning: ["Good morning! Fresh from the field!", "Rise and shine! Time to sprout ideas!"],
          night: ["It's chilly up here. Time for bed soon?", "Goodnight! I'll snuggle into my chullo."],
          focus: ["Sitting quietly, roots down, focused.", "Deep focus, like a potato underground!"],
          done: ["What a harvest! So much learned!", "All done! A whole field of good work!"],
          task: ["Done! Dug it!", "Checked off! Purple proud!", "Another one! Bumper crop!", "Yes! Spud-tacular!"],
          break: ["Snack break! Maybe a little soup?", "Stretch time! Reach up like a sprout!"]
        }
      }
    ]
  });
})();
