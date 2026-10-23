/* ===== module: 96-tp-zz-fit.js ===== */
/* Sticker fit: a few stickers drew a little past the edge of their 64 x 64 box, so a side got cut off in the
   sticker envelope and the Style Shop. This nudges and gently shrinks just those, so the whole sticker shows.
   (Measured once with a render of every sticker; [scale, x shift, y shift].) */
(() => {
  const FIT = {"rainbow": [0.9385, 1.03, 2.31], "owl": [1, 0.0, -2.5], "boba": [1, 0.0, 2.0], "sunflower": [0.9385, 1.95, 2.44], "guitar": [0.9919, 0.27, 2.0], "cane": [1, 0.0, -2.5], "spring_caterpillar": [0.9839, -0.96, 0.52], "summer_umbrella": [1, 0.0, -3.0], "autumn_hello": [0.9385, 1.97, 2.05], "lemonade_glass": [0.9839, 0.46, 3.47], "xmas_reindeer": [1, 0.0, 2.0], "xmas_wreath": [0.9839, 0.51, -1.45], "mint_shake": [0.976, 0.76, 1.99], "bokeh_lights": [0.9104, 2.87, 2.42], "bokeh_prism": [0.976, 1.99, 0.74], "candy_lolli": [0.9839, 0.52, -1.45], "arcade_palm": [0.9919, 0.51, -1.97], "arcade_shades": [0.9385, 1.97, 1.89], "cats_tabby": [1, 2.0, 0.0], "knitting_teacosy": [0.9839, 0.52, 2.98], "painting_jar": [1, 0.0, 2.5], "painting_beret": [0.9606, 1.31, -0.9], "painting_sketch": [1, -2.0, 0.0], "gardening_ivy": [0.976, 0.76, -0.45], "newyear_sparkler": [1, -2.5, 0.0], "lunarnewyear_plum": [0.9683, 1.0, 2.47], "lunarnewyear_lucky": [0.9839, 0.52, 2.48], "valentines_balloon": [0.9606, 1.25, 0.54], "stpatricks_rainbow": [0.8531, 4.49, 4.74], "easter_carrot": [0.9606, 1.43, 2.94], "thanksgiving_turkey": [0.9173, 2.88, 2.85], "thanksgiving_thanks": [0.9313, 2.43, 2.04], "hanukkah_jug": [0.9839, 0.56, 2.48], "balloons_heartbeat": [1, 0.0, 2.0]};
  Object.entries(FIT).forEach(([k, f]) => {
    const st = STICKERS[k]; if (!st || st.fitted) return;
    const svg = `<g transform="translate(${f[1]} ${f[2]}) scale(${f[0]})">${st.svg}</g>`;
    st.svg = svg; st.fitted = true;
    STICKER_PACKS.forEach(p => { if (p.items && p.items[k]) p.items[k] = svg; });
  });
})();


