const fs = require('fs');
let s = fs.readFileSync('tools/steps-grid.mjs', 'utf8');
s = s.replace(/  const combos = \[\];[\s\S]*$/, `  const HIP = 0.45, HEMF = 0.205, HEMZ = 0.37;
  const solveHy = (th) => 0.005 + (HIP - HEMF) * Math.cos(th) - HEMZ * Math.sin(th);
  const combos = [];
  for (const th of [0.2, 0.35, 0.5]) combos.push({ th, hy: +solveHy(th).toFixed(3), legY: 0.14, legZ: -0.10 });
  await ev("window.__grid('male', " + JSON.stringify(combos) + ")");
  await sleep(400);
  await shot('grid-a');

  const combos2 = [];
  for (const th of [0.35, 0.5, 0.65]) combos2.push({ th, hy: +solveHy(th).toFixed(3), legY: 0.14, legZ: -0.10 });
  await ev("window.__grid('male', " + JSON.stringify(combos2) + ")");
  await sleep(400);
  await shot('grid-b');
};
`);
fs.writeFileSync('tools/steps-grid.mjs', s);
