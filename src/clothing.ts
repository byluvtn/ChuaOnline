import * as THREE from 'three';

// Quần áo mặc ngoài nhân vật (v3). Mỗi builder trả về group gốc y=0, con trực tiếp của body.
// Pivot cho harness/game nằm trong g.userData: pivots, forePivots, shinPivots (và hemExt cho áo dài).

type PivotMap = Record<string, THREE.Group>;

// ---------------------------------------------------------------------------
// Áo dài hồng sen v3
// ---------------------------------------------------------------------------
export function buildAoDaiHongSenV3(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'aoDaiHongSenV3';

  const pink = new THREE.MeshStandardMaterial({ color: 0xe08ab0, roughness: 0.6, side: THREE.DoubleSide });
  const pinkDark = new THREE.MeshStandardMaterial({ color: 0xc96f98, roughness: 0.6, side: THREE.DoubleSide });
  const white = new THREE.MeshStandardMaterial({ color: 0xf5f0ea, roughness: 0.8 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xf5f0ea, roughness: 0.7 });

  const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    return m;
  };

  // Thân trên: y 0.70–1.08, ôm vai r 0.30, loe xuống hông r 0.35
  add(g, new THREE.CylinderGeometry(0.30, 0.35, 0.38, 24), pink, 0, 0.89);

  // Cổ tròn + viền cổ
  add(g, new THREE.CylinderGeometry(0.16, 0.165, 0.05, 20), pinkDark, 0, 1.08);
  add(g, new THREE.TorusGeometry(0.165, 0.012, 8, 24), pinkDark, 0, 1.085, 0).rotation.x = Math.PI / 2;

  // Tà áo NGẮN (dùng khi ngồi/lạy): vạt trước y 0.45–0.70, vạt sau y 0.35–0.70
  const ARC = 2.3;
  add(g, new THREE.CylinderGeometry(0.35, 0.38, 0.25, 16, 1, true, -ARC / 2, ARC), pink, 0, 0.575);
  add(g, new THREE.CylinderGeometry(0.35, 0.40, 0.35, 16, 1, true, Math.PI - ARC / 2, ARC), pink, 0, 0.525);
  add(g, new THREE.CylinderGeometry(0.381, 0.381, 0.02, 16, 1, true, -ARC / 2, ARC), pinkDark, 0, 0.46);
  add(g, new THREE.CylinderGeometry(0.401, 0.401, 0.02, 16, 1, true, Math.PI - ARC / 2, ARC), pinkDark, 0, 0.36);

  // Tà DÀI (chỉ hiện khi đứng): vạt trước/sau kéo xuống y 0.06
  const hemExt = new THREE.Group();
  hemExt.name = 'hemExt';
  add(hemExt, new THREE.CylinderGeometry(0.38, 0.42, 0.40, 16, 1, true, -ARC / 2, ARC), pink, 0, 0.26);
  add(hemExt, new THREE.CylinderGeometry(0.40, 0.44, 0.40, 16, 1, true, Math.PI - ARC / 2, ARC), pink, 0, 0.26);
  add(hemExt, new THREE.CylinderGeometry(0.421, 0.421, 0.02, 16, 1, true, -ARC / 2, ARC), pinkDark, 0, 0.07);
  add(hemExt, new THREE.CylinderGeometry(0.441, 0.441, 0.02, 16, 1, true, Math.PI - ARC / 2, ARC), pinkDark, 0, 0.07);
  g.add(hemExt);

  // 5 cúc dọc thân trước (+Z)
  const rBody = (y: number) => 0.35 - ((y - 0.70) / 0.38) * 0.05;
  for (const y of [0.72, 0.80, 0.88, 0.96, 1.04]) {
    add(g, new THREE.SphereGeometry(0.018, 10, 8), pinkDark, 0, y, rBody(y) + 0.006);
  }

  // 2 nếp gấp dọc vạt trước
  for (const s of [-1, 1]) {
    const th = Math.asin(0.12 / 0.365);
    const strip = add(g, new THREE.BoxGeometry(0.012, 0.20, 0.008), pinkDark, s * 0.12, 0.58, 0.345);
    strip.rotation.y = s * th;
  }

  // Hoa sen nhỏ: ngực trái (5 cánh) + vạt trước phải (3 cánh)
  const lotus = (x: number, y: number, z: number, petals: number, r: number, ang: number) => {
    const grp = new THREE.Group();
    grp.position.set(x, y, z);
    grp.rotation.y = ang;
    for (let i = 0; i < petals; i++) {
      const a = ((i - (petals - 1) / 2) / petals) * 1.6;
      const p = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), cream);
      p.position.set(Math.sin(a) * r * 1.1, Math.cos(a) * r * 0.5, 0.012);
      p.scale.set(1, 1.15, 0.45);
      p.rotation.z = -a;
      grp.add(p);
    }
    const c = new THREE.Mesh(new THREE.SphereGeometry(r * 0.55, 10, 8), pinkDark);
    c.position.set(0, 0, 0.014);
    grp.add(c);
    g.add(grp);
  };
  lotus(0.204, 0.95, 0.242, 5, 0.028, 0.7);
  lotus(-0.174, 0.55, 0.318, 3, 0.024, -0.5);

  // Khối hông y 0.30–0.70, màu hồng (bịt khe háng)
  add(g, new THREE.CylinderGeometry(0.29, 0.26, 0.40, 20), pink, 0, 0.50);

  const forePivots: PivotMap = {};
  const shinPivots: PivotMap = {};
  for (const s of [-1, 1]) {
    const leg = new THREE.Group();
    leg.name = s < 0 ? 'quanL' : 'quanR';
    leg.position.set(s * 0.16, 0.18, 0);
    add(leg, new THREE.SphereGeometry(0.11, 12, 8), white, 0, 0);
    add(leg, new THREE.CylinderGeometry(0.11, 0.11, 0.32, 12), white, 0, 0);
    add(leg, new THREE.CylinderGeometry(0.11, 0.11, 0.14, 12), white, 0, 0.23);
    add(leg, new THREE.SphereGeometry(0.11, 12, 8), white, 0, 0.30);
    g.add(leg);

    const shin = new THREE.Group();
    shin.name = s < 0 ? 'quanLShin' : 'quanRShin';
    shin.position.set(0, -0.04, 0);
    add(shin, new THREE.SphereGeometry(0.112, 12, 8), white, 0, 0);
    add(shin, new THREE.CylinderGeometry(0.112, 0.112, 0.12, 12), white, 0, -0.06);
    leg.add(shin);
    shinPivots[shin.name] = shin;

    const sleeve = new THREE.Group();
    sleeve.name = s < 0 ? 'tayAoL' : 'tayAoR';
    sleeve.position.set(s * 0.34, 1.0, 0);
    add(sleeve, new THREE.SphereGeometry(0.15, 14, 10), pink, 0, 0);
    add(sleeve, new THREE.CylinderGeometry(0.145, 0.145, 0.17, 14), pink, 0, -0.085);
    g.add(sleeve);

    const fore = new THREE.Group();
    fore.name = s < 0 ? 'tayAoLFore' : 'tayAoRFore';
    fore.position.set(0, -0.17, 0);
    add(fore, new THREE.CylinderGeometry(0.15, 0.15, 0.16, 14), pink, 0, -0.08);
    sleeve.add(fore);
    forePivots[fore.name] = fore;
  }

  g.userData.pivots = {
    tayAoL: g.getObjectByName('tayAoL') as THREE.Group, tayAoR: g.getObjectByName('tayAoR') as THREE.Group,
    quanL: g.getObjectByName('quanL') as THREE.Group, quanR: g.getObjectByName('quanR') as THREE.Group,
  } as PivotMap;
  g.userData.forePivots = forePivots;
  g.userData.shinPivots = shinPivots;
  g.userData.hemExt = hemExt;
  return g;
}

// ---------------------------------------------------------------------------
// Áo dài vàng nhạt v3
// ---------------------------------------------------------------------------
export function buildAoDaiVangNhatV3(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'aoDaiVangNhatV3';

  const vang = new THREE.MeshStandardMaterial({ color: 0xf0d68a, roughness: 0.6, side: THREE.DoubleSide });
  const vangDam = new THREE.MeshStandardMaterial({ color: 0xd9b95c, roughness: 0.6, side: THREE.DoubleSide });
  const white = new THREE.MeshStandardMaterial({ color: 0xf5f0ea, roughness: 0.8 });
  const senTrang = new THREE.MeshStandardMaterial({ color: 0xfdfbf4, roughness: 0.7 });

  const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    parent.add(m);
    return m;
  };

  // Thân trên
  add(g, new THREE.CylinderGeometry(0.30, 0.35, 0.38, 24), vang, 0, 0.89);

  // Cổ + viền cổ
  add(g, new THREE.CylinderGeometry(0.16, 0.165, 0.05, 20), vangDam, 0, 1.08);
  add(g, new THREE.TorusGeometry(0.165, 0.012, 8, 24), vangDam, 0, 1.085, 0).rotation.x = Math.PI / 2;

  // Tà ngắn (ngồi/lạy)
  const ARC = 2.3;
  add(g, new THREE.CylinderGeometry(0.35, 0.38, 0.25, 16, 1, true, -ARC / 2, ARC), vang, 0, 0.575);
  add(g, new THREE.CylinderGeometry(0.35, 0.40, 0.35, 16, 1, true, Math.PI - ARC / 2, ARC), vang, 0, 0.525);
  add(g, new THREE.CylinderGeometry(0.381, 0.381, 0.02, 16, 1, true, -ARC / 2, ARC), vangDam, 0, 0.46);
  add(g, new THREE.CylinderGeometry(0.401, 0.401, 0.02, 16, 1, true, Math.PI - ARC / 2, ARC), vangDam, 0, 0.36);

  // Tà dài (chỉ khi đứng)
  const hemExt = new THREE.Group();
  hemExt.name = 'hemExt';
  add(hemExt, new THREE.CylinderGeometry(0.38, 0.42, 0.40, 16, 1, true, -ARC / 2, ARC), vang, 0, 0.26);
  add(hemExt, new THREE.CylinderGeometry(0.40, 0.44, 0.40, 16, 1, true, Math.PI - ARC / 2, ARC), vang, 0, 0.26);
  add(hemExt, new THREE.CylinderGeometry(0.421, 0.421, 0.02, 16, 1, true, -ARC / 2, ARC), vangDam, 0, 0.07);
  add(hemExt, new THREE.CylinderGeometry(0.441, 0.441, 0.02, 16, 1, true, Math.PI - ARC / 2, ARC), vangDam, 0, 0.07);
  // Dải viền dọc mép xẻ 2 bên hông, phần dài (y 0.06–0.46)
  for (const s of [-1, 1]) {
    const th = ARC / 2;
    const x = Math.sin(th) * 0.40, z = Math.cos(th) * 0.40;
    const strip = add(hemExt, new THREE.BoxGeometry(0.012, 0.40, 0.008), vangDam, s * x, 0.26, z);
    strip.rotation.y = s * th;
  }
  g.add(hemExt);

  // Dải viền dọc mép xẻ phần trên (y 0.45–0.70)
  for (const s of [-1, 1]) {
    const th = ARC / 2;
    const x = Math.sin(th) * 0.365, z = Math.cos(th) * 0.365;
    const strip = add(g, new THREE.BoxGeometry(0.012, 0.25, 0.008), vangDam, s * x, 0.575, z);
    strip.rotation.y = s * th;
  }

  // 5 cúc
  const rBody = (y: number) => 0.35 - ((y - 0.70) / 0.38) * 0.05;
  for (const y of [0.72, 0.80, 0.88, 0.96, 1.04]) {
    add(g, new THREE.SphereGeometry(0.018, 10, 8), vangDam, 0, y, rBody(y) + 0.006);
  }

  // 2 nếp gấp
  for (const s of [-1, 1]) {
    const th = Math.asin(0.12 / 0.365);
    const strip = add(g, new THREE.BoxGeometry(0.012, 0.20, 0.008), vangDam, s * 0.12, 0.58, 0.345);
    strip.rotation.y = s * th;
  }

  // Hoa sen ngực trái (6 cánh) + nụ sen vạt phải (3 cánh)
  const lotus = (x: number, y: number, z: number, petals: number, r: number, ang: number) => {
    const grp = new THREE.Group();
    grp.position.set(x, y, z);
    grp.rotation.y = ang;
    for (let i = 0; i < petals; i++) {
      const a = ((i - (petals - 1) / 2) / petals) * 1.6;
      const p = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), senTrang);
      p.position.set(Math.sin(a) * r * 1.1, Math.cos(a) * r * 0.5, 0.012);
      p.scale.set(1, 1.15, 0.45);
      p.rotation.z = -a;
      grp.add(p);
    }
    const c = new THREE.Mesh(new THREE.SphereGeometry(r * 0.55, 10, 8), vangDam);
    c.position.set(0, 0, 0.014);
    grp.add(c);
    g.add(grp);
  };
  lotus(0.204, 0.95, 0.242, 6, 0.032, 0.7);
  lotus(-0.174, 0.55, 0.318, 3, 0.024, -0.5);

  // Khối hông y 0.30–0.70 cùng màu tà (bịt khe háng)
  add(g, new THREE.CylinderGeometry(0.29, 0.26, 0.40, 20), vang, 0, 0.50);

  const forePivots: PivotMap = {};
  const shinPivots: PivotMap = {};
  for (const s of [-1, 1]) {
    const leg = new THREE.Group();
    leg.name = s < 0 ? 'quanL' : 'quanR';
    leg.position.set(s * 0.16, 0.18, 0);
    add(leg, new THREE.SphereGeometry(0.11, 12, 8), white, 0, 0);
    add(leg, new THREE.CylinderGeometry(0.11, 0.11, 0.32, 12), white, 0, 0);
    add(leg, new THREE.CylinderGeometry(0.11, 0.11, 0.14, 12), white, 0, 0.23);
    add(leg, new THREE.SphereGeometry(0.11, 12, 8), white, 0, 0.30);
    g.add(leg);

    const shin = new THREE.Group();
    shin.name = s < 0 ? 'quanLShin' : 'quanRShin';
    shin.position.set(0, -0.04, 0);
    add(shin, new THREE.SphereGeometry(0.112, 12, 8), white, 0, 0);
    add(shin, new THREE.CylinderGeometry(0.112, 0.112, 0.12, 12), white, 0, -0.06);
    leg.add(shin);
    shinPivots[shin.name] = shin;

    const sleeve = new THREE.Group();
    sleeve.name = s < 0 ? 'tayAoL' : 'tayAoR';
    sleeve.position.set(s * 0.34, 1.0, 0);
    add(sleeve, new THREE.SphereGeometry(0.15, 14, 10), vang, 0, 0);
    add(sleeve, new THREE.CylinderGeometry(0.145, 0.145, 0.17, 14), vang, 0, -0.085);
    g.add(sleeve);

    const fore = new THREE.Group();
    fore.name = s < 0 ? 'tayAoLFore' : 'tayAoRFore';
    fore.position.set(0, -0.17, 0);
    add(fore, new THREE.CylinderGeometry(0.15, 0.15, 0.16, 14), vang, 0, -0.08);
    sleeve.add(fore);
    forePivots[fore.name] = fore;
  }

  g.userData.pivots = {
    tayAoL: g.getObjectByName('tayAoL') as THREE.Group, tayAoR: g.getObjectByName('tayAoR') as THREE.Group,
    quanL: g.getObjectByName('quanL') as THREE.Group, quanR: g.getObjectByName('quanR') as THREE.Group,
  } as PivotMap;
  g.userData.forePivots = forePivots;
  g.userData.shinPivots = shinPivots;
  g.userData.hemExt = hemExt;
  return g;
}

// ---------------------------------------------------------------------------
// Bà ba (nâu / tím) v3: cùng cấu trúc, khác màu
// ---------------------------------------------------------------------------
function buildBaBaV3(body: number, dark: number, pants: number): THREE.Group {
  const g = new THREE.Group();
  const mat = (c: number) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 });
  const main = mat(body), darkM = mat(dark), black = mat(pants);
  const cream = mat(0xf5f0ea);
  const add = (p: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    p.add(mesh);
    return mesh;
  };

  // Thân áo: y 0.55–1.11, r 0.285 (trên) / 0.345 (dưới)
  const Y0 = 0.55, Y1 = 1.11, RT = 0.285, RB = 0.345;
  const rAt = (y: number) => RB + ((y - Y0) / (Y1 - Y0)) * (RT - RB);
  add(g, new THREE.CylinderGeometry(RT, RB, Y1 - Y0, 20), main, 0, (Y0 + Y1) / 2, 0);

  // Cổ tròn + viền cổ mỏng
  add(g, new THREE.TorusGeometry(0.2, 0.03, 8, 24), darkM, 0, 1.1, 0).rotation.x = Math.PI / 2;
  add(g, new THREE.TorusGeometry(0.21, 0.008, 8, 24), darkM, 0, 1.08, 0).rotation.x = Math.PI / 2;

  // 5 nút dọc giữa ngực (+Z)
  for (const y of [1.05, 0.95, 0.83, 0.71, 0.59]) {
    add(g, new THREE.SphereGeometry(0.02, 8, 8), darkM, 0, y, rAt(y) + 0.005);
  }

  // Hoa thêu nhỏ ngực phải
  {
    const ang = -0.5, y = 0.88, r = rAt(y);
    const grp = new THREE.Group();
    grp.position.set(Math.sin(ang) * r, y, Math.cos(ang) * r);
    grp.rotation.y = ang;
    for (let i = 0; i < 5; i++) {
      const a = ((i - 2) / 5) * 1.6;
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), cream);
      p.position.set(Math.sin(a) * 0.03, Math.cos(a) * 0.015, 0.012);
      p.scale.set(1, 1.15, 0.45);
      p.rotation.z = -a;
      grp.add(p);
    }
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.015, 10, 8), darkM);
    c.position.set(0, 0, 0.014);
    grp.add(c);
    g.add(grp);
  }

  // 2 túi dẹt + nắp túi
  for (const s of [-1, 1]) {
    const a = s * 0.75, y = 0.66, r = rAt(y) + 0.004;
    add(g, new THREE.BoxGeometry(0.08, 0.1, 0.02), darkM, Math.sin(a) * r, y, Math.cos(a) * r).rotation.y = a;
    const rf = rAt(0.715) + 0.006;
    add(g, new THREE.BoxGeometry(0.08, 0.03, 0.022), main, Math.sin(a) * rf, 0.715, Math.cos(a) * rf).rotation.y = a;
  }

  // Hông/đũng quần (bịt khe háng)
  add(g, new THREE.CylinderGeometry(0.27, 0.25, 0.27, 16), black, 0, 0.435, 0);

  const pivots: PivotMap = {};
  const forePivots: PivotMap = {};
  const shinPivots: PivotMap = {};
  for (const s of [-1, 1]) {
    const side = s > 0 ? 'L' : 'R'; // +X là bên trái nhân vật (mặt hướng +Z)

    const arm = new THREE.Group();
    arm.position.set(s * 0.34, 1.0, 0);
    add(arm, new THREE.SphereGeometry(0.15, 12, 10), main);
    add(arm, new THREE.CylinderGeometry(0.145, 0.145, 0.17, 12), main, 0, -0.085, 0);
    add(arm, new THREE.TorusGeometry(0.145, 0.01, 8, 20), darkM, 0, -0.17, 0).rotation.x = Math.PI / 2;
    g.add(arm);
    pivots['arm' + side] = arm;

    const fore = new THREE.Group();
    fore.name = 'arm' + side + 'Fore';
    fore.position.set(0, -0.17, 0);
    add(fore, new THREE.CylinderGeometry(0.15, 0.15, 0.16, 12), main, 0, -0.08, 0);
    arm.add(fore);
    forePivots[fore.name] = fore;

    const leg = new THREE.Group();
    leg.position.set(s * 0.16, 0.18, 0);
    add(leg, new THREE.CylinderGeometry(0.11, 0.11, 0.32, 12), black, 0, 0, 0);
    add(leg, new THREE.CylinderGeometry(0.11, 0.11, 0.14, 12), black, 0, 0.23, 0);
    add(leg, new THREE.SphereGeometry(0.11, 12, 8), black, 0, 0.30, 0);
    const shin = new THREE.Group();
    shin.name = 'leg' + side + 'Shin';
    shin.position.set(0, -0.04, 0);
    add(shin, new THREE.SphereGeometry(0.112, 12, 8), black, 0, 0, 0);
    add(shin, new THREE.CylinderGeometry(0.112, 0.112, 0.12, 12), black, 0, -0.06, 0);
    leg.add(shin);
    shinPivots[shin.name] = shin;
    g.add(leg);
    pivots['leg' + side] = leg;
  }
  g.userData.pivots = pivots; // { armL, armR, legL, legR }
  g.userData.forePivots = forePivots;
  g.userData.shinPivots = shinPivots;
  return g;
}

export function buildBaBaNauV3(): THREE.Group {
  return buildBaBaV3(0x8a7a5a, 0x6a5a3a, 0x2a2a2a);
}

export function buildBaBaTimV3(): THREE.Group {
  return buildBaBaV3(0x8a6fae, 0x6a4a8a, 0x2a2a3a);
}

// ---------------------------------------------------------------------------
// Áo lam + nón lá v3
// Nón lá: vành r 0.62 (như v2), chóp cao 0.27, chop y 2.16, nghiêng 0.1.
// Đỉnh ≈ 2.16 + 0.27·cos0.1 = 2.43; mép vành trước ≈ 2.16 − 0.62·sin0.1 = 2.10.
// ---------------------------------------------------------------------------
export function buildAoLamNonLaV3(): THREE.Group {
  const g = new THREE.Group();
  const mat = (c: number, side: THREE.Side = THREE.FrontSide) =>
    new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, side });
  const lam = mat(0x778c96), trang = mat(0xf5f0ea), quan = mat(0x5a6a72);
  const rom = mat(0xd9c27a, THREE.DoubleSide);
  const add = (p: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    p.add(mesh);
    return mesh;
  };

  // Thân áo lam: y 0.40–1.10, váy kín không xẻ
  add(g, new THREE.CylinderGeometry(0.29, 0.38, 0.70, 24), lam, 0, 0.75, 0);
  // Cổ tròn trắng
  add(g, new THREE.TorusGeometry(0.16, 0.025, 8, 24), trang, 0, 1.08, 0).rotation.x = Math.PI / 2;
  // Hông quần y 0.30–0.44, nằm trong vạt áo
  add(g, new THREE.CylinderGeometry(0.27, 0.25, 0.14, 16), quan, 0, 0.37, 0);

  // Đai lưng y 0.55
  add(g, new THREE.TorusGeometry(0.365, 0.02, 8, 24), quan, 0, 0.55, 0).rotation.x = Math.PI / 2;

  // 3 cúc nhỏ dọc thân trước (+Z)
  const rBody = (y: number) => 0.38 - ((y - 0.40) / 0.70) * 0.09;
  for (const y of [0.80, 0.92, 1.04]) {
    add(g, new THREE.SphereGeometry(0.018, 10, 8), trang, 0, y, rBody(y) + 0.005);
  }

  // Hoa sen nhỏ ngực trái
  {
    const ang = 0.7, y = 0.95, r = rBody(y);
    const grp = new THREE.Group();
    grp.position.set(Math.sin(ang) * r, y, Math.cos(ang) * r);
    grp.rotation.y = ang;
    for (let i = 0; i < 5; i++) {
      const a = ((i - 2) / 5) * 1.6;
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), trang);
      p.position.set(Math.sin(a) * 0.03, Math.cos(a) * 0.015, 0.012);
      p.scale.set(1, 1.15, 0.45);
      p.rotation.z = -a;
      grp.add(p);
    }
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.015, 10, 8), quan);
    c.position.set(0, 0, 0.014);
    grp.add(c);
    g.add(grp);
  }

  const pivots: PivotMap = {};
  const forePivots: PivotMap = {};
  const shinPivots: PivotMap = {};
  for (const [side, s] of [['L', 1], ['R', -1]] as const) {
    const arm = new THREE.Group();
    arm.position.set(s * 0.34, 1.0, 0);
    add(arm, new THREE.SphereGeometry(0.15, 12, 8), lam);
    add(arm, new THREE.CylinderGeometry(0.145, 0.145, 0.17, 12), lam, 0, -0.085, 0);
    add(arm, new THREE.TorusGeometry(0.145, 0.01, 8, 20), quan, 0, -0.17, 0).rotation.x = Math.PI / 2;
    g.add(arm);
    pivots['arm' + side] = arm;

    const fore = new THREE.Group();
    fore.name = 'arm' + side + 'Fore';
    fore.position.set(0, -0.17, 0);
    add(fore, new THREE.CylinderGeometry(0.15, 0.15, 0.16, 12), lam, 0, -0.08, 0);
    arm.add(fore);
    forePivots[fore.name] = fore;

    const leg = new THREE.Group();
    leg.position.set(s * 0.16, 0.18, 0);
    add(leg, new THREE.SphereGeometry(0.11, 10, 8), quan);
    add(leg, new THREE.CylinderGeometry(0.11, 0.11, 0.32, 10), quan, 0, 0, 0);
    add(leg, new THREE.CylinderGeometry(0.11, 0.11, 0.14, 10), quan, 0, 0.23, 0);
    add(leg, new THREE.SphereGeometry(0.11, 10, 8), quan, 0, 0.30, 0);
    g.add(leg);
    pivots['leg' + side] = leg;
    const shin = new THREE.Group();
    shin.name = 'leg' + side + 'Shin';
    shin.position.set(0, -0.04, 0);
    add(shin, new THREE.SphereGeometry(0.112, 10, 8), quan, 0, 0, 0);
    add(shin, new THREE.CylinderGeometry(0.112, 0.112, 0.12, 10), quan, 0, -0.06, 0);
    leg.add(shin);
    shinPivots[shin.name] = shin;
  }
  g.userData.pivots = pivots; // armL/armR/legL/legR
  g.userData.forePivots = forePivots;
  g.userData.shinPivots = shinPivots;

  // Nón lá (tháo riêng: g.getObjectByName('nonLa')): vành r 0.62, chóp cao 0.27.
  const nonLa = new THREE.Group();
  nonLa.name = 'nonLa';
  const chop = new THREE.Group(); // xoay quanh y 2.16
  chop.position.y = 2.16;
  chop.rotation.x = 0.1;
  add(chop, new THREE.ConeGeometry(0.62, 0.27, 32, 1, true), rom, 0, 0.135, 0);
  add(chop, new THREE.TorusGeometry(0.62, 0.01, 6, 32), mat(0xa8894a, THREE.DoubleSide), 0, 0, 0).rotation.x = Math.PI / 2; // viền vành
  nonLa.add(chop);
  // Quai: từ mặt trong vành (±0.60, 2.165) xuống ngang má (±0.54, 1.59), dài 0.578,
  // tâm (±0.57, 1.8775), nghiêng atan(0.06/0.575) ≈ 0.104; nửa torus ôm dưới cằm.
  const day = mat(0x8a7a4a);
  for (const s of [1, -1]) {
    add(nonLa, new THREE.CylinderGeometry(0.008, 0.008, 0.578, 6), day, s * 0.57, 1.8775, 0).rotation.z = -s * 0.104;
  }
  add(nonLa, new THREE.TorusGeometry(0.54, 0.008, 6, 24, Math.PI), day, 0, 1.59, 0).rotation.z = Math.PI;
  g.add(nonLa);

  return g;
}

// ---------------------------------------------------------------------------
// Khăn đóng v3 (vòm cao, đỉnh 2.40, vừa búi tóc nữ đỉnh 2.34)
// ---------------------------------------------------------------------------
export function buildKhanDongV3(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'khanDongV3';

  const mat = (c: number) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 });
  const dark = mat(0x2e3440);
  const lighter = mat(0x3d4657);
  const add = (p: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    p.add(mesh);
    return mesh;
  };

  // Vòng quấn trán
  add(g, new THREE.TorusGeometry(0.40, 0.07, 12, 28), dark, 0, 1.95, 0).rotation.x = Math.PI / 2;

  // Vòm: cầu dẹt r 0.44, tâm y 2.08, scale y 0.72 → đỉnh 2.40
  const dome = add(g, new THREE.SphereGeometry(0.44, 24, 16), dark, 0, 2.08, -0.02);
  dome.scale.set(1, 0.72, 1);

  // 2 gờ quấn ngang vòm
  add(g, new THREE.TorusGeometry(0.44, 0.02, 8, 28), lighter, 0, 2.12, -0.02).rotation.x = Math.PI / 2;
  add(g, new THREE.TorusGeometry(0.42, 0.02, 8, 28), lighter, 0, 2.20, -0.02).rotation.x = Math.PI / 2;

  // Nếp gấp trước trán
  const fold = add(g, new THREE.BoxGeometry(0.12, 0.08, 0.06), lighter, 0, 2.02, 0.44);
  fold.rotation.x = -0.25;

  return g;
}
