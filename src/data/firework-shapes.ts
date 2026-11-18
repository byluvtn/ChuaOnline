import { CatmullRomCurve3, Vector3 } from 'three';

type XY = readonly [number, number];
export type FireworkShape = 'dragon' | 'phoenix';
export type ShapeSpark = { x: number; y: number; tone: number; weight: number; motion: number; reveal: number };

const curve = (points: readonly XY[]) => new CatmullRomCurve3(points.map(([x, y]) => new Vector3(x, y, 0)));

function drawShape(kind: FireworkShape): ShapeSpark[] {
  const sparks: ShapeSpark[] = [];
  const dot = (x: number, y: number, tone: number, weight: number, motion: number, reveal: number) => {
    sparks.push({ x, y, tone, weight, motion, reveal });
  };
  // Arc-length spacing keeps the fine strokes equally bright on tight curves and long feathers.
  const stroke = (points: readonly XY[], tone: number, weight: number, motion = 0, start = 0.2, end = start) => {
    const line = curve(points);
    const count = Math.max(2, Math.ceil(line.getLength() / (0.033 / Math.sqrt(weight))));
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1), p = line.getPointAt(t);
      dot(p.x, p.y, tone, weight, motion, start + (end - start) * t);
    }
  };

  if (kind === 'dragon') {
    const spine = curve([[-2.05, -.47], [-1.85, -.94], [-1.14, -1.08], [-.32, -.86], [-.02, -.4],
      [-.51, -.02], [-1.11, .21], [-1.14, .58], [-.62, .8], [.04, .66], [.57, .38], [1.04, .43]]);
    const body = (t: number, offset: number) => {
      const p = spine.getPointAt(t), d = spine.getTangentAt(t);
      const width = (0.031 + 0.18 * Math.sin(t * 1.67)) * offset;
      return [p.x - d.y * width, p.y + d.x * width] as const;
    };
    for (let i = 0; i <= 196; i++) {
      const t = i / 196;
      for (const [edge, tone, weight] of [[1, 1, .95], [-1, .64, .82], [-.56, .36, .5]]) {
        const [x, y] = body(t, edge);
        dot(x, y, tone, weight, .82, (1 - t) * .68);
      }
    }
    // Staggered scales and a swept dorsal crest leave the open coils readable.
    for (let i = 5; i < 36; i++) {
      const t = i / 37;
      stroke([body(t, -.45), body(t - .011, .08), body(t, .54)], i % 2 ? .28 : .55, .57, .82, (1 - t) * .7);
      if (i % 2) stroke([body(t, 1), body(t - .01, 1.55), body(t - .024, 1)], .82, .65, .88, (1 - t) * .65);
    }
    stroke([[-1.97, -.63], [-2.14, -.51], [-2.16, -.27], [-2.06, -.34], [-1.99, -.19], [-1.73, -.61]], .74, .87, 1, .63);
    const leg = (t: number, dx: number, dy: number) => {
      const [x, y] = body(t, -1), joint: XY = [x + dx, y - .18], wrist: XY = [joint[0] + .16, joint[1] + dy];
      stroke([[x, y], joint, wrist], .68, .9, .79, .28);
      for (let i = 0; i < 3; i++) stroke([wrist, [wrist[0] + .10 + i * .063, wrist[1] - .09 + i * .087],
        [wrist[0] + .16 + i * .052, wrist[1] - .135 + i * .073]], .96, .72, .79, .31);
    };
    leg(.25, .13, .11); leg(.45, -.21, -.08); leg(.87, .055, -.2); leg(.95, .18, -.065);

    // Profile: cheek, muzzle and separated lower jaw; horns, teeth and whiskers are independent strokes.
    stroke([[.89,.35],[.91,.58],[1.11,.76],[1.35,.72],[1.51,.58],[1.75,.61],[1.91,.53],[1.82,.42],[1.56,.37],[1.43,.26],[1.3,.24]], .98, 1.2, .28, .02);
    stroke([[1.3,.24],[1.53,.22],[1.76,.3],[1.79,.22],[1.64,.1],[1.36,.084],[1.15,.19],[.96,.23]], .74, 1, .28, .04);
    stroke([[.96,.46],[1.16,.54],[1.3,.39],[1.22,.26]], .45, .82, .28, .09);
    stroke([[1.07,.68],[.89,.89],[.83,1.12],[.61,1.25]], .95, .92, .28, .12);
    stroke([[.87,.99],[.98,1.13],[1,1.3]], 1, .75, .28, .15);
    stroke([[1.27,.71],[1.22,.94],[1.33,1.14],[1.29,1.31]], .86, .97, .28, .1);
    stroke([[1.23,.98],[1.43,1.02],[1.54,1.17]], .94, .68, .28, .13);
    stroke([[1.76,.49],[1.99,.66],[2.16,.64],[2.22,.53]], .46, .87, .68, .21, .41);
    stroke([[1.61,.35],[1.94,.29],[2.14,.11],[2.21,-.06]], .84, .79, .68, .19, .39);
    stroke([[1.29,.12],[1.39,-.053],[1.56,-.13]], .69, .74, .47, .17);
    for (const x of [1.51, 1.64, 1.75]) stroke([[x,.4],[x+.018,.317],[x+.051,.398]], 1, .6, .28, .12);
    stroke([[1.175,.579],[1.269,.606],[1.358,.562]], .94, 1.17, .28, .04);
    dot(1.273,.551, 1.6, 1.9, .28, .12);
    dot(1.745,.538, .94, 1, .28, .09);
  } else {
    for (const side of [-1, 1]) {
      const wing = (path: readonly XY[], tone: number, weight: number, from = .18, to = .49) =>
        stroke(path.map(([x,y]) => [x*side,y]), tone, weight, 1, from, to);
      wing([[.16,.1],[.5,.54],[1.04,.86],[1.68,.95],[2.11,1.19],[2.02,.85],[1.63,.42],[1.14,.09],[.57,-.13],[.16,-.15]], 1,.98);
      for (let i = 0; i < 9; i++) {
        const t = i / 8, tip = 2.1 - t * 1.42, y = 1.17 - t * 1.51;
        wing([[.2+t*.22,.2-t*.35],[.57+t*.2,.45-t*.55],[tip-.28,y-.13],[tip,y]], .65+t*.28,.78,.23+t*.09,.5+t*.13);
        if(i) wing([[tip,y],[tip-.22,y-.105],[tip-.39,y-.105]], i % 2 ? .43 : .76,.58,.52,.64);
      }
      for (let i = 0; i < 5; i++) wing([[.19+i*.073,.12-i*.025],[.39+i*.109,.35-i*.031],[.64+i*.133,.53-i*.024]], .37,.66,.23,.41);
    }
    // Layered tail feathers, individually curved with a light spine and a colored eyelet.
    for (let i = -3; i <= 3; i++) {
      const f = i / 3, tip: XY = [f*1.48+.14, -1.6+Math.abs(f)*.48];
      const mid: XY = [f*.58-.12, -.92+Math.abs(f)*.12];
      stroke([[f*.14,-.36],[f*.33-.13,-.62],mid,[tip[0]-.14,tip[1]-.045],tip], .48+Math.abs(f)*.29,.85,.68,.42,.87);
      stroke([mid,[tip[0]-.085,tip[1]+.17],tip,[tip[0]+.115,tip[1]+.12],[tip[0]+.02,tip[1]+.25]], .93,.69,.68,.61,.9);
      dot(tip[0]+.012,tip[1]+.1, 1.34, 1.27,.68,.86);
    }
    stroke([[-.18,-.4],[-.29,-.14],[-.23,.19],[-.09,.43],[.01,.64],[.18,.78],[.35,.73],[.39,.65],[.57,.56],[.38,.53],[.27,.41],[.21,.11],[.25,-.09],[.13,-.34],[-.03,-.49],[-.18,-.4]], 1,1.23,.09,.01,.22);
    stroke([[-.17,-.31],[.015,-.09],[.087,.26],[.209,.429]], .67,.8,.11,.14);
    for (let i = 0; i < 6; i++) stroke([[-.19+.02*i,.2-.074*i],[-.06,.22-.079*i],[.05,.29-.074*i]], .56,.59,.16,.2);
    stroke([[.13,.74],[.01,.88],[-.22,.99],[-.36,1.17]], .61,1,.29,.11,.27);
    stroke([[.22,.75],[.15,.99],[-.02,1.13],[-.07,1.31]], .88,.9,.28,.15,.3);
    stroke([[.31,.74],[.32,.92],[.25,1.12]], .98,.74,.25,.13,.29);
    dot(.301,.678, 1.6,1.85,.09,.09);
  }
  return sparks;
}

const cache: Partial<Record<FireworkShape, ShapeSpark[]>> = {};
export const fireworkShape = (kind: FireworkShape): readonly ShapeSpark[] => cache[kind] ??= drawShape(kind);
