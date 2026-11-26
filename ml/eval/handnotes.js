// Evaluation material: realistic student notes in different styles, each with the key facts a good set of cards should cover.
// A fact counts as covered when one card's front+back contains every group (each group: any of its words, case-insensitive).
module.exports = [
{id: "bio", course: "Biology", text: `# Cellular Respiration

## Overview
Cellular respiration is the process cells use to break down glucose and store the released energy as ATP. The overall equation is glucose plus oxygen gives carbon dioxide, water and energy. Most of the ATP is made in the mitochondria. Respiration has three main stages: glycolysis, the Krebs cycle and the electron transport chain.

## Glycolysis
Glycolysis happens in the cytoplasm and does not need oxygen. One glucose molecule (6 carbons) is split into two molecules of pyruvate (3 carbons each). The cell invests 2 ATP at the start and makes 4 ATP, so the net gain is 2 ATP. Glycolysis also produces 2 NADH, which carry electrons to the electron transport chain. When oxygen is missing, pyruvate is turned into lactate in muscle cells (lactic acid fermentation) or into ethanol and CO2 in yeast (alcoholic fermentation). Fermentation regenerates NAD+ so glycolysis can keep going.

## Link Reaction and Krebs Cycle
Pyruvate enters the mitochondrial matrix, where it is converted to acetyl-CoA and releases one CO2. Acetyl-CoA joins with oxaloacetate to form citrate, the first molecule of the Krebs cycle (also called the citric acid cycle). Each turn of the cycle releases 2 CO2 and produces 3 NADH, 1 FADH2 and 1 ATP (or GTP). Because one glucose makes two pyruvate, the cycle turns twice per glucose. The main job of the Krebs cycle is to load electron carriers, not to make ATP directly.

## Electron Transport Chain
The electron transport chain is a series of proteins in the inner mitochondrial membrane, which is folded into cristae to increase its surface area. NADH and FADH2 drop off their electrons, and as the electrons pass along the chain, protons (H+) are pumped into the intermembrane space. This builds a proton gradient. Protons flow back through ATP synthase, which uses that flow to make ATP; this is called chemiosmosis or oxidative phosphorylation. Oxygen is the final electron acceptor: it combines with electrons and protons to form water. Without oxygen the chain stops. The electron transport chain makes about 26 to 28 ATP, so one glucose yields about 30 to 32 ATP in total.`,
facts: [[["glycolysis"], ["cytoplasm"]], [["pyruvate"], ["two", "2"]], [["net"], ["2"], ["atp"]], [["lactate", "lactic"]], [["ethanol", "alcohol"]], [["nad+", "nad"], ["regenerat"]], [["acetyl"]], [["citrate"], ["oxaloacetate"]], [["krebs", "citric"], ["nadh", "fadh2", "carriers"]], [["twice", "two turns", "2 turns"]], [["cristae"], ["surface"]], [["proton", "h+"], ["gradient", "pump"]], [["atp synthase"]], [["chemiosmosis", "oxidative phosphorylation"]], [["oxygen"], ["final", "acceptor"]], [["water"], ["oxygen"]], [["30", "32"]], [["inner"], ["membrane"]]]},

{id: "hist", course: "US History", text: `Reconstruction (1865-1877)

Reconstruction was the period after the Civil War when the United States tried to rebuild the South and decide the place of four million freed people. Lincoln's Ten Percent Plan (1863) let a Southern state rejoin the Union once ten percent of its 1860 voters swore loyalty and the state accepted the end of slavery. Radical Republicans thought this was too lenient and passed the Wade-Davis Bill, which required a majority to swear loyalty; Lincoln pocket-vetoed it.

After Lincoln was assassinated in April 1865, Andrew Johnson became president. Johnson pardoned many former Confederates and allowed Southern states to pass Black Codes, laws that limited the rights of freed people, such as rules forcing them to sign yearly labor contracts. Congress responded with the Civil Rights Act of 1866, passed over Johnson's veto, and with the Reconstruction Acts of 1867, which divided the former Confederacy into five military districts. In 1868 the House impeached Johnson, mainly for violating the Tenure of Office Act by firing Secretary of War Edwin Stanton; the Senate acquitted him by a single vote.

Three amendments changed the Constitution. The 13th Amendment (1865) abolished slavery. The 14th Amendment (1868) made everyone born in the United States a citizen and promised equal protection of the laws. The 15th Amendment (1870) said the right to vote could not be denied because of race, but it did not protect women's voting rights.

The Freedmen's Bureau, created in 1865, gave food and medical care to freed people and set up schools, including colleges such as Howard University. Many freed families became sharecroppers: they farmed land owned by someone else in exchange for a share of the crop, which often trapped them in debt. Violent groups such as the Ku Klux Klan used terror to stop Black citizens from voting, and Congress passed the Enforcement Acts of 1870-1871 to fight them.

Reconstruction ended with the Compromise of 1877. The disputed 1876 election was settled by giving the presidency to Republican Rutherford B. Hayes in exchange for removing the last federal troops from the South. Afterwards Southern states passed Jim Crow laws that enforced segregation for decades.`,
facts: [[["ten percent", "10 percent", "10%"]], [["wade-davis", "wade davis"]], [["black codes"]], [["1866"], ["civil rights"]], [["five", "5"], ["military"]], [["impeach"], ["johnson"]], [["tenure of office", "stanton"]], [["one vote", "single vote", "1 vote"]], [["13th", "thirteenth"], ["slavery"]], [["14th", "fourteenth"], ["citizen", "equal protection"]], [["15th", "fifteenth"], ["vote", "voting"], ["race"]], [["freedmen"]], [["sharecrop"], ["share", "crop", "debt"]], [["klan", "kkk"]], [["enforcement acts"]], [["1877"], ["compromise"]], [["hayes"]], [["jim crow"]]]},

{id: "econ", course: "Microeconomics", text: `Slide 1:
ECON 101 - Lecture 5
Elasticity

Slide 2:
Price Elasticity of Demand
- Measures how much quantity demanded responds to a change in price
- Formula: % change in quantity demanded / % change in price
- Use the absolute value
- Elastic: greater than 1 (quantity changes more than price)
- Inelastic: less than 1 (quantity changes less than price)
- Unit elastic: exactly 1

Slide 3:
What makes demand more elastic?
- Close substitutes available (e.g. one brand of cereal)
- Luxury rather than necessity
- Narrowly defined market
- Longer time horizon: people find alternatives over time
- Large share of the budget

Slide 4:
Elasticity and Total Revenue
- Total revenue = price x quantity
- If demand is elastic, raising the price lowers total revenue
- If demand is inelastic, raising the price raises total revenue
- If unit elastic, total revenue does not change
- Example: farmers with a big harvest can earn less, because demand for food is inelastic and prices fall a lot

Slide 5:
Other Elasticities
- Income elasticity: % change in quantity / % change in income
- Normal goods: positive income elasticity
- Inferior goods: negative income elasticity (e.g. bus rides)
- Cross-price elasticity: positive for substitutes (coffee and tea), negative for complements (cars and gasoline)

Slide 6:
Price Elasticity of Supply
- How much quantity supplied responds to price
- Supply is more elastic when producers have spare capacity or more time to adjust
- In the very short run supply is often perfectly inelastic (vertical supply curve)

Slide 7:
Questions?`,
facts: [[["percent", "%"], ["quantity"], ["price"]], [["elastic"], ["greater than 1", "more than 1", "> 1", "above 1"]], [["inelastic"], ["less than 1", "below 1", "< 1"]], [["unit"], ["1", "one"]], [["substitute"], ["elastic"]], [["luxur", "necessit"]], [["time"], ["elastic"]], [["revenue"], ["price"], ["quantity", "×", "times", "x"]], [["elastic"], ["revenue"], ["lower", "fall", "decrease"]], [["inelastic"], ["revenue"], ["raise", "rise", "increase"]], [["farmer", "harvest"]], [["income elasticity"]], [["inferior"], ["negative"]], [["normal"], ["positive"]], [["complement"], ["negative"]], [["substitute"], ["positive"]], [["supply"], ["spare capacity", "time"]], [["short run"], ["vertical", "perfectly inelastic"]]]},

{id: "chem", course: "Chemistry", text: `Acids and Bases

An acid is a substance that donates a proton (H+) and a base is a substance that accepts a proton; this is the Brønsted-Lowry definition. When an acid gives away a proton, what is left is its conjugate base. For example, in the reaction of HCl with water, chloride (Cl-) is the conjugate base of HCl and the hydronium ion (H3O+) is the conjugate acid of water.

The pH scale measures how acidic a solution is. pH equals the negative logarithm of the hydrogen ion concentration: pH = -log[H+]. A solution with pH below 7 is acidic, pH 7 is neutral, and above 7 is basic. Because the scale is logarithmic, each step of one pH unit is a tenfold change in [H+], so a solution with pH 3 has 100 times more H+ than one with pH 5. In pure water at 25 °C, [H+] = [OH-] = 1 x 10^-7 M, and pH + pOH = 14.

Strong acids such as HCl, HNO3 and H2SO4 ionize completely in water. Weak acids such as acetic acid (the acid in vinegar) only partly ionize, so they set up an equilibrium. The acid dissociation constant, Ka, describes how far a weak acid ionizes: a larger Ka means a stronger acid. pKa = -log Ka, so a smaller pKa means a stronger acid.

A buffer is a solution that resists changes in pH when small amounts of acid or base are added. It is made of a weak acid and its conjugate base, for example acetic acid and sodium acetate. Blood is buffered by carbonic acid and bicarbonate, which keeps its pH near 7.4. The Henderson-Hasselbalch equation gives the pH of a buffer: pH = pKa + log([A-]/[HA]). When the concentrations of the acid and its conjugate base are equal, pH = pKa.

In a titration, a base of known concentration is added to an acid until the equivalence point, where the moles of base equal the moles of acid. An indicator such as phenolphthalein changes color near the end point; phenolphthalein is colorless in acid and pink in base.`,
facts: [[["donat"], ["proton", "h+"]], [["accept"], ["proton", "h+"]], [["conjugate base"]], [["hydronium", "h3o+"]], [["-log", "negative log"], ["h+"]], [["below 7", "less than 7", "< 7"], ["acid"]], [["tenfold", "10 times", "ten times", "factor of 10"]], [["100"]], [["14"], ["poh"]], [["strong"], ["complete"]], [["weak"], ["partial", "partly", "equilibrium"]], [["ka"], ["larger", "stronger", "bigger"]], [["pka"], ["smaller", "lower"]], [["buffer"], ["resist"]], [["weak acid"], ["conjugate base"]], [["7.4"]], [["bicarbonate", "carbonic"]], [["henderson"]], [["equal"], ["pka"]], [["equivalence"], ["moles"]], [["phenolphthalein"], ["pink", "colorless"]]]},
];
