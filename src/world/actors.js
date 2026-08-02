// 実体オブジェクト — 第5使徒 / エヴァンゲリオン / 陽電子砲・射線・爆発
// 実寸ベース: EVA 全高 40 m = 0.40 world unit
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// 第5使徒 ラミエル
// ---------------------------------------------------------------------------

const ramielVert = /* glsl */ `
varying vec3 vNrm;
varying vec3 vPos;
varying vec3 vView;
void main() {
  vNrm = normalize(normalMatrix * normal);
  vPos = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const ramielFrag = /* glsl */ `
precision highp float;
uniform vec3  uCore;
uniform vec3  uEdge;
uniform float uTime;
uniform float uCharge;   // 攻撃チャージ 0..1
uniform float uDamage;   // 被弾 0..1
uniform float uOpacity;
varying vec3 vNrm;
varying vec3 vPos;
varying vec3 vView;

void main() {
  vec3 n = normalize(vNrm);
  vec3 v = normalize(vView);
  float fres = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 2.2);

  // 結晶面ごとの明度差
  float facet = 0.55 + 0.45 * abs(dot(n, normalize(vec3(0.3, 0.9, 0.32))));

  vec3 col = uCore * facet * 0.85;
  col += uEdge * fres * 1.5;

  // 内部の共鳴パルス
  float pulse = 0.5 + 0.5 * sin(uTime * 3.1 + length(vPos) * 12.0);
  col += uEdge * pulse * 0.22;

  // チャージ時の発光
  col += vec3(1.0, 0.55, 0.15) * uCharge * (0.4 + 0.6 * sin(uTime * 14.0));

  // 破損時の亀裂
  float crack = smoothstep(0.55, 0.98, sin(vPos.x * 40.0) * sin(vPos.y * 37.0) * sin(vPos.z * 43.0) * 0.5 + 0.5);
  col = mix(col, vec3(1.0, 0.35, 0.12), crack * uDamage);

  gl_FragColor = vec4(col, uOpacity * (0.75 + 0.25 * fres));
}
`;

export function createRamiel(position, radius = 1.35, fragCount = 90) {
  const group = new THREE.Group();
  group.name = 'ramiel';
  group.position.copy(position);

  const geo = new THREE.OctahedronGeometry(radius, 0);
  geo.computeVertexNormals();
  const uniforms = {
    uCore: { value: new THREE.Color(0x1b4fd8) },
    uEdge: { value: new THREE.Color(0x69b8ff) },
    uTime: { value: 0 },
    uCharge: { value: 0 },
    uDamage: { value: 0 },
    uOpacity: { value: 1 },
  };
  const body = new THREE.Mesh(
    geo,
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: ramielVert,
      fragmentShader: ramielFrag,
      transparent: true,
    })
  );
  group.add(body);

  // 外殻ワイヤ (走査線的表現)
  const wire = new THREE.Mesh(
    new THREE.OctahedronGeometry(radius * 1.015, 1),
    new THREE.MeshBasicMaterial({ color: 0x9fd8ff, wireframe: true, transparent: true, opacity: 0.28 })
  );
  group.add(wire);

  // AT フィールド (八角形の重ね)
  const atGroup = new THREE.Group();
  const atMats = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.MeshBasicMaterial({
      color: 0xff8a1e,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    atMats.push(m);
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius * (1.5 + i * 0.5), radius * (1.85 + i * 0.5), 8), m);
    ring.rotation.z = Math.PI / 8;
    atGroup.add(ring);
  }
  const atFill = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 2.3, 8),
    new THREE.MeshBasicMaterial({
      color: 0xff8a1e,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  atFill.rotation.z = Math.PI / 8;
  atGroup.add(atFill);
  group.add(atGroup);

  // 破片
  const fragGeo = new THREE.TetrahedronGeometry(radius * 0.10, 0);
  const fragMat = new THREE.MeshBasicMaterial({ color: 0x4f9dff, transparent: true, opacity: 0 });
  const frags = new THREE.InstancedMesh(fragGeo, fragMat, fragCount);
  frags.visible = false;
  const fragState = [];
  for (let i = 0; i < fragCount; i++) {
    const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    fragState.push({
      p: dir.clone().multiplyScalar(radius * 0.6),
      v: dir.clone().multiplyScalar(1.4 + Math.random() * 3.4),
      r: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(4),
      q: new THREE.Euler(),
    });
  }
  group.add(frags);

  let atTimer = 0;
  let destroyed = 0;
  const mtx = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3(1, 1, 1);

  group.userData = {
    radius,
    uniforms,
    /** AT フィールドを指定方向へ展開 */
    raiseAT(dirVec3, strength = 1) {
      atGroup.lookAt(group.position.clone().add(dirVec3));
      atTimer = Math.max(atTimer, 1.0 * strength);
    },
    /** @param {number} [elapsed] シーク時に破壊後の経過秒を直接与える */
    destroy(elapsed = 0) {
      destroyed = Math.max(0.0001, elapsed);
    },
    get isDestroyed() {
      return destroyed > 0;
    },
    /** シーク時の巻き戻し */
    reset() {
      destroyed = 0;
      atTimer = 0;
      uniforms.uDamage.value = 0;
      uniforms.uOpacity.value = 1;
      uniforms.uCharge.value = 0;
      body.visible = true;
      wire.material.opacity = 0.28;
      frags.visible = false;
      fragMat.opacity = 0;
      for (let i = 0; i < fragCount; i++) {
        const s = fragState[i];
        const dir = s.v.clone().normalize();
        s.p.copy(dir).multiplyScalar(radius * 0.6);
        s.v.copy(dir).multiplyScalar(1.4 + Math.random() * 3.4);
        s.q.set(0, 0, 0);
      }
    },
    update(dt, t) {
      uniforms.uTime.value = t;
      body.rotation.y = t * 0.12;
      wire.rotation.y = -t * 0.09;
      wire.rotation.x = t * 0.05;
      group.position.y += Math.sin(t * 0.9) * dt * 0.06;

      if (atTimer > 0) {
        atTimer = Math.max(0, atTimer - dt * 1.3);
        const k = atTimer;
        atMats.forEach((m, i) => {
          m.opacity = k * (0.55 - i * 0.13) * (0.6 + 0.4 * Math.sin(t * 22 + i));
        });
        atFill.material.opacity = k * 0.16;
      } else {
        atMats.forEach((m) => (m.opacity = 0));
        atFill.material.opacity = 0;
      }

      if (destroyed > 0) {
        destroyed += dt;
        const k = destroyed;
        uniforms.uDamage.value = Math.min(1, k * 2.5);
        uniforms.uOpacity.value = Math.max(0, 1 - k * 1.4);
        body.visible = uniforms.uOpacity.value > 0.01;
        wire.material.opacity = Math.max(0, 0.28 - k * 0.35);

        frags.visible = true;
        fragMat.opacity = Math.max(0, 1 - k * 0.28);
        for (let i = 0; i < fragCount; i++) {
          const s = fragState[i];
          s.v.y -= 2.2 * dt;
          s.p.addScaledVector(s.v, dt);
          s.q.x += s.r.x * dt;
          s.q.y += s.r.y * dt;
          s.q.z += s.r.z * dt;
          quat.setFromEuler(s.q);
          mtx.compose(s.p, quat, scl);
          frags.setMatrixAt(i, mtx);
        }
        frags.instanceMatrix.needsUpdate = true;
        if (fragMat.opacity <= 0.01) frags.visible = false;
      }
    },
  };
  return group;
}

// ---------------------------------------------------------------------------
// エヴァンゲリオン — 実寸プロポーションの人型
// ---------------------------------------------------------------------------

function box(w, h, d, mat) {
  const g = new THREE.BoxGeometry(w, h, d);
  return new THREE.Mesh(g, mat);
}

/** 先細りの角柱 — 素の直方体より装甲然としたシルエットになる */
function taper(topW, botW, h, depthRatio, mat) {
  const g = new THREE.CylinderGeometry(topW * 0.5, botW * 0.5, h, 6, 1);
  g.rotateY(Math.PI / 6);
  g.scale(1, 1, depthRatio);
  return new THREE.Mesh(g, mat);
}

function limb(parent, len, wTop, wBot, mat, y) {
  const pivot = new THREE.Group();
  pivot.position.y = y;
  const m = taper(wTop, wBot, len, 0.92, mat);
  m.position.y = -len / 2;
  pivot.add(m);
  parent.add(pivot);
  return pivot;
}

/**
 * 全高 1.0 の人型を構築し、呼び出し側で実寸へスケールする。
 * 8頭身 — デフォルメせず、装甲のシルエットのみを再現。
 */
function buildHumanoid(colors) {
  const skin = new THREE.MeshStandardMaterial({
    color: colors.body,
    roughness: 0.52,
    metalness: 0.28,
  });
  const armor = new THREE.MeshStandardMaterial({
    color: colors.armor,
    roughness: 0.4,
    metalness: 0.45,
  });
  const trim = new THREE.MeshStandardMaterial({
    color: colors.trim,
    roughness: 0.35,
    metalness: 0.5,
    emissive: new THREE.Color(colors.trim),
    emissiveIntensity: 0.35,
  });
  const eye = new THREE.MeshBasicMaterial({ color: colors.eye });

  const root = new THREE.Group();

  // 骨盤
  const hips = new THREE.Group();
  hips.position.y = 0.53;
  root.add(hips);
  const pelvis = taper(0.155, 0.185, 0.095, 0.72, skin);
  hips.add(pelvis);
  const beltPlate = box(0.15, 0.04, 0.115, armor);
  beltPlate.position.y = -0.03;
  hips.add(beltPlate);

  // 胴
  const abdomen = taper(0.14, 0.125, 0.10, 0.75, skin);
  abdomen.position.y = 0.095;
  hips.add(abdomen);

  const chest = new THREE.Group();
  chest.position.y = 0.155;
  hips.add(chest);
  const torso = taper(0.23, 0.145, 0.22, 0.66, skin);
  torso.position.y = 0.11;
  chest.add(torso);
  // 胸部装甲 (初号機の特徴的な2枚板)
  const plateL = box(0.078, 0.135, 0.05, armor);
  plateL.position.set(-0.052, 0.150, 0.062);
  plateL.rotation.x = -0.12;
  chest.add(plateL);
  const plateR = plateL.clone();
  plateR.position.x = 0.052;
  chest.add(plateR);
  const coreOrb = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), trim);
  coreOrb.position.set(0, 0.10, 0.075);
  chest.add(coreOrb);

  // 肩パイロン
  const pylonL = taper(0.10, 0.078, 0.09, 1.35, armor);
  pylonL.position.set(-0.142, 0.205, 0);
  pylonL.rotation.z = 0.16;
  chest.add(pylonL);
  const pylonR = pylonL.clone();
  pylonR.position.x = 0.142;
  pylonR.rotation.z = -0.16;
  chest.add(pylonR);

  // 頸〜頭
  const neck = box(0.045, 0.04, 0.045, armor);
  neck.position.y = 0.238;
  chest.add(neck);

  const head = new THREE.Group();
  head.position.y = 0.262;
  chest.add(head);
  const skull = taper(0.072, 0.088, 0.105, 1.12, skin);
  skull.position.y = 0.05;
  head.add(skull);
  const crest = box(0.03, 0.085, 0.055, armor);
  crest.position.set(0, 0.065, -0.03);
  head.add(crest);
  const jaw = box(0.066, 0.038, 0.095, armor);
  jaw.position.set(0, -0.004, 0.014);
  head.add(jaw);
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.085, 4), trim);
  horn.position.set(0, 0.12, 0.018);
  head.add(horn);
  const eyes = box(0.062, 0.013, 0.014, eye);
  eyes.position.set(0, 0.062, 0.05);
  head.add(eyes);

  // 腕
  const shoulderL = limb(chest, 0.16, 0.062, 0.05, skin, 0.19);
  shoulderL.position.x = -0.128;
  const elbowL = limb(shoulderL, 0.15, 0.052, 0.042, skin, -0.16);
  const handL = box(0.048, 0.062, 0.05, armor);
  handL.position.y = -0.178;
  elbowL.add(handL);

  const shoulderR = limb(chest, 0.16, 0.062, 0.05, skin, 0.19);
  shoulderR.position.x = 0.128;
  const elbowR = limb(shoulderR, 0.15, 0.052, 0.042, skin, -0.16);
  const handR = box(0.048, 0.062, 0.05, armor);
  handR.position.y = -0.178;
  elbowR.add(handR);

  // 脚
  const hipL = limb(hips, 0.23, 0.088, 0.068, skin, -0.045);
  hipL.position.x = -0.056;
  const kneeL = limb(hipL, 0.22, 0.072, 0.052, skin, -0.23);
  const kneeCapL = box(0.072, 0.05, 0.05, armor);
  kneeCapL.position.set(0, -0.02, 0.032);
  kneeL.add(kneeCapL);
  const footL = box(0.078, 0.038, 0.145, armor);
  footL.position.set(0, -0.235, 0.034);
  kneeL.add(footL);

  const hipR = limb(hips, 0.23, 0.088, 0.068, skin, -0.045);
  hipR.position.x = 0.056;
  const kneeR = limb(hipR, 0.22, 0.072, 0.052, skin, -0.23);
  const kneeCapR = kneeCapL.clone();
  kneeR.add(kneeCapR);
  const footR = box(0.078, 0.038, 0.145, armor);
  footR.position.set(0, -0.235, 0.034);
  kneeR.add(footR);

  return {
    root,
    joints: { hips, chest, head, shoulderL, elbowL, shoulderR, elbowR, hipL, kneeL, hipR, kneeR, handL, handR },
    materials: { skin, armor, trim, eye },
  };
}

const EVA_HEIGHT_U = 0.40; // 40 m

const EVA_COLORS = {
  '01': { body: 0x6b41ad, armor: 0x35bb64, trim: 0xf4a227, eye: 0xffe38a },
  '00': { body: 0x4283cf, armor: 0xd6e6f4, trim: 0xf4a227, eye: 0xff5a3c },
  '02': { body: 0xc02b22, armor: 0xe8552f, trim: 0xf4c027, eye: 0x7ef0ff },
  // 仮設5号機/Mark.06 系 — 白い装甲に暗色の骨格
  '06': { body: 0xdfe3ea, armor: 0x8f97a4, trim: 0x39414d, eye: 0xff4a2a },
};

// --- 姿勢 -------------------------------------------------------------------
// 各関節の [x, y, z] 回転 (rad)。hipsY は腰の高さ。
// 片膝立ち系は「腰高 / 膝接地 / 足裏接地」から逆算した値で、脚が地面から
// 浮かないようにしてある。

export const POSES = {
  /** 射撃姿勢 — 陽電子砲を右肩で保持 (ヤシマ作戦 初号機) */
  kneelFire: {
    hipsY: 0.25, hips: [0.08, 0, 0], chest: [0.06, 0, 0], head: [-0.04, 0, 0],
    shoulderR: [-0.55, 0, -0.12], elbowR: [1.15, 0, 0],
    shoulderL: [-1.28, 0, 0.46], elbowL: [0.78, 0, 0],
    hipL: [-1.615, 0, 0], kneeL: [1.615, 0, 0], hipR: [0.30, 0, 0], kneeR: [1.135, 0, 0],
  },
  /** 盾構え姿勢 — 特殊装甲板を前面に立てる (ヤシマ作戦 零号機) */
  shield: {
    hipsY: 0.25, hips: [0.08, 0, 0], chest: [0.20, 0, 0], head: [0.12, 0, 0],
    shoulderR: [-1.30, 0, -0.34], elbowR: [0.98, 0, 0],
    shoulderL: [-1.30, 0, 0.34], elbowL: [0.98, 0, 0],
    hipL: [-1.615, 0, 0], kneeL: [1.615, 0, 0], hipR: [0.30, 0, 0], kneeR: [1.135, 0, 0],
  },
  /** 直立待機 */
  stand: {
    hipsY: 0.53, hips: [0, 0, 0], chest: [0.02, 0, 0], head: [0, 0, 0],
    shoulderR: [0.05, 0, 0.09], elbowR: [0.14, 0, 0],
    shoulderL: [0.05, 0, -0.09], elbowL: [0.14, 0, 0],
    hipL: [-0.03, 0, 0], kneeL: [0.06, 0, 0], hipR: [0.03, 0, 0], kneeR: [0.06, 0, 0],
  },
  /** 戦闘構え — 半身、両腕を前に */
  guard: {
    hipsY: 0.495, hips: [0.05, 0.16, 0], chest: [0.10, -0.10, 0], head: [-0.05, 0.06, 0],
    shoulderR: [-0.62, 0, -0.30], elbowR: [1.18, 0, 0],
    shoulderL: [-0.50, 0, 0.26], elbowL: [1.05, 0, 0],
    hipL: [-0.34, 0, 0], kneeL: [0.56, 0, 0], hipR: [0.22, 0, 0], kneeR: [0.42, 0, 0],
  },
  /** 射撃 — 兵装を両手で前方保持 */
  aim: {
    hipsY: 0.505, hips: [0.04, 0.22, 0], chest: [0.06, -0.14, 0], head: [-0.02, 0.10, 0],
    shoulderR: [-1.10, 0, -0.18], elbowR: [0.72, 0, 0],
    shoulderL: [-1.32, 0, 0.42], elbowL: [0.80, 0, 0],
    hipL: [-0.28, 0, 0], kneeL: [0.46, 0, 0], hipR: [0.20, 0, 0], kneeR: [0.34, 0, 0],
  },
  /** 斬撃 — 右腕を振りかぶる */
  slash: {
    hipsY: 0.50, hips: [0.10, -0.30, 0], chest: [-0.12, 0.34, 0], head: [-0.10, 0.20, 0],
    shoulderR: [-2.35, 0, -0.30], elbowR: [0.34, 0, 0],
    shoulderL: [-0.70, 0, 0.50], elbowL: [1.30, 0, 0],
    hipL: [-0.45, 0, 0], kneeL: [0.70, 0, 0], hipR: [0.30, 0, 0], kneeR: [0.50, 0, 0],
  },
  /** 突進 — 前傾、腕を後方へ */
  charge: {
    hipsY: 0.46, hips: [0.42, 0, 0], chest: [0.12, 0, 0], head: [-0.42, 0, 0],
    shoulderR: [0.85, 0, -0.16], elbowR: [0.55, 0, 0],
    shoulderL: [0.85, 0, 0.16], elbowL: [0.55, 0, 0],
    hipL: [-0.75, 0, 0], kneeL: [0.95, 0, 0], hipR: [0.55, 0, 0], kneeR: [0.75, 0, 0],
  },
  /** 被弾・大破 — 前のめりに崩れる */
  fallen: {
    hipsY: 0.19, hips: [0.62, 0.12, 0], chest: [0.46, 0, 0.10], head: [0.52, 0, 0],
    shoulderR: [0.30, 0, -0.40], elbowR: [0.30, 0, 0],
    shoulderL: [0.36, 0, 0.44], elbowL: [0.22, 0, 0],
    hipL: [-1.35, 0, 0], kneeL: [1.90, 0, 0], hipR: [0.42, 0, 0], kneeR: [1.25, 0, 0],
  },
  /** 活動停止 — 直立のまま脱力 */
  shutdown: {
    hipsY: 0.44, hips: [0.20, 0, 0], chest: [0.26, 0, 0], head: [0.42, 0, 0],
    shoulderR: [0.22, 0, 0.05], elbowR: [0.30, 0, 0],
    shoulderL: [0.22, 0, -0.05], elbowL: [0.30, 0, 0],
    hipL: [-0.32, 0, 0], kneeL: [0.62, 0, 0], hipR: [-0.20, 0, 0], kneeR: [0.50, 0, 0],
  },
  /** 覚醒・咆哮 — 上体を反らし両腕を広げる */
  berserk: {
    hipsY: 0.50, hips: [-0.20, 0, 0], chest: [-0.34, 0, 0], head: [-0.46, 0, 0],
    shoulderR: [-1.05, 0, -0.62], elbowR: [0.42, 0, 0],
    shoulderL: [-1.05, 0, 0.62], elbowL: [0.42, 0, 0],
    hipL: [-0.30, 0, 0], kneeL: [0.42, 0, 0], hipR: [0.30, 0, 0], kneeR: [0.42, 0, 0],
  },
  /** 獣化第2形態 — 四つ這い (弐号機 ザ・ビースト) */
  beast: {
    hipsY: 0.30, hips: [1.12, 0, 0], chest: [-0.30, 0, 0], head: [-0.72, 0, 0],
    shoulderR: [-0.92, 0, -0.22], elbowR: [0.30, 0, 0],
    shoulderL: [-0.92, 0, 0.22], elbowL: [0.30, 0, 0],
    hipL: [-0.62, 0, 0], kneeL: [1.15, 0, 0], hipR: [-0.48, 0, 0], kneeR: [1.05, 0, 0],
  },
  /** 覚醒 — 両腕を大きく開き、天を仰ぐ */
  awaken: {
    hipsY: 0.53, hips: [-0.10, 0, 0], chest: [-0.26, 0, 0], head: [-0.58, 0, 0],
    shoulderR: [-0.18, 0, 1.38], elbowR: [0.08, 0, 0],
    shoulderL: [-0.18, 0, -1.38], elbowL: [0.08, 0, 0],
    hipL: [-0.02, 0, 0], kneeL: [0.04, 0, 0], hipR: [0.02, 0, 0], kneeR: [0.04, 0, 0],
  },
  /** 貫かれて静止 — 収束後の磔 */
  pinned: {
    hipsY: 0.51, hips: [0.06, 0, 0], chest: [0.10, 0, 0], head: [0.30, 0, 0],
    shoulderR: [-0.10, 0, 1.18], elbowR: [0.22, 0, 0],
    shoulderL: [-0.10, 0, -1.18], elbowL: [0.22, 0, 0],
    hipL: [-0.10, 0, 0], kneeL: [0.16, 0, 0], hipR: [0.08, 0, 0], kneeR: [0.14, 0, 0],
  },
  /** 捕食 — 両腕で掴み、上体を前へ */
  devour: {
    hipsY: 0.47, hips: [0.30, 0, 0], chest: [0.16, 0, 0], head: [-0.18, 0, 0],
    shoulderR: [-1.75, 0, -0.30], elbowR: [0.62, 0, 0],
    shoulderL: [-1.75, 0, 0.30], elbowL: [0.62, 0, 0],
    hipL: [-0.55, 0, 0], kneeL: [0.80, 0, 0], hipR: [0.35, 0, 0], kneeR: [0.60, 0, 0],
  },
};

const JOINT_KEYS = ['hips', 'chest', 'head', 'shoulderR', 'elbowR', 'shoulderL', 'elbowL',
  'hipL', 'kneeL', 'hipR', 'kneeR'];

function applyPose(j, pose, k = 1) {
  for (const name of JOINT_KEYS) {
    const target = pose[name] || [0, 0, 0];
    const r = j[name].rotation;
    r.x += (target[0] - r.x) * k;
    r.y += (target[1] - r.y) * k;
    r.z += (target[2] - r.z) * k;
  }
  const hy = pose.hipsY ?? 0.53;
  j.hips.position.y += (hy - j.hips.position.y) * k;
}

/**
 * @param {'01'|'00'|'02'} type
 * @param {{x:number,y:number,z:number}} pos 足元の位置
 * @param {number} heading 向き (rad, +Z 基準)
 * @param {string} [pose] 初期姿勢 (POSES のキー)
 */
export function createEva(type, pos, heading, pose) {
  const h = buildHumanoid(EVA_COLORS[type]);
  const g = new THREE.Group();
  g.name = 'eva-' + type;
  g.add(h.root);
  h.root.scale.setScalar(EVA_HEIGHT_U);
  g.position.set(pos.x, pos.y, pos.z);
  g.rotation.y = heading;

  const initial = pose || (type === '01' ? 'kneelFire' : type === '00' ? 'shield' : 'stand');
  applyPose(h.joints, POSES[initial], 1);

  let current = initial;
  let breath = 0;

  g.userData = {
    humanoid: h,
    joints: h.joints,
    height: EVA_HEIGHT_U,
    /** 姿勢を切り替える (update で補間される) */
    setPose(name, immediate = false) {
      if (!POSES[name]) return;
      current = name;
      if (immediate) applyPose(h.joints, POSES[name], 1);
    },
    get pose() {
      return current;
    },
    /** 目の発光強度 (暴走時に上げる) */
    setEyeGlow(v) {
      h.materials.eye.color.setRGB(1, 0.35 + 0.45 * (1 - v), 0.25 + 0.5 * (1 - v));
    },
    update(dt, t, rate = 5.5) {
      applyPose(h.joints, POSES[current], Math.min(1, dt * rate));
      // 待機時の微細な挙動 — 静止画のように固まらせない
      breath += dt;
      const amp = current === 'fallen' || current === 'shutdown' ? 0.12 : 1;
      h.joints.chest.rotation.x += Math.sin(breath * 1.4) * 0.006 * amp;
      h.joints.head.rotation.y = Math.sin(breath * 0.7) * 0.05 * amp;
    },
  };
  return g;
}

/** 暴走オーラ — 機体を包む発光殻 */
export function createBerserkAura(radius = 0.34) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uAmount: { value: 0 },
      uColor: { value: new THREE.Color(0xff3a1e) },
      uInner: { value: new THREE.Color(0xb06cff) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vP;
      void main() {
        vN = normalize(normalMatrix * normal);
        vP = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform float uTime; uniform float uAmount; uniform vec3 uColor; uniform vec3 uInner;
      varying vec3 vN; varying vec3 vP;
      void main() {
        float fres = pow(1.0 - abs(vN.z), 1.6);
        float flame = 0.5 + 0.5 * sin(vP.y * 26.0 - uTime * 9.0 + sin(vP.x * 18.0) * 2.0);
        vec3 col = mix(uInner, uColor, flame);
        float a = uAmount * (fres * 0.75 + 0.25) * (0.45 + 0.55 * flame);
        gl_FragColor = vec4(col * (1.0 + flame * 0.8), a * 0.45);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide,
  });
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 2), mat);
  mesh.visible = false;
  mesh.renderOrder = 24;
  const light = new THREE.PointLight(0xff5a2a, 0, 26, 2);
  mesh.add(light);
  mesh.userData = {
    setAmount(v) {
      mat.uniforms.uAmount.value = v;
      mesh.visible = v > 0.01;
      light.intensity = v * 60;
      mesh.scale.setScalar(1 + v * 0.12);
    },
    update(dt, t) {
      mat.uniforms.uTime.value = t;
    },
  };
  return mesh;
}

// --- 兵装 -------------------------------------------------------------------

/** パレットライフル (全長 約 20 m) */
export function createPalletRifle() {
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: 0x6f7681, roughness: 0.5, metalness: 0.5 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2c3138, roughness: 0.7, metalness: 0.3 });

  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.030, 0.150), body);
  barrel.position.z = 0.055;
  g.add(barrel);
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.052, 0.090), dark);
  receiver.position.z = -0.030;
  g.add(receiver);
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.058, 0.036), dark);
  mag.position.set(0, -0.048, -0.028);
  g.add(mag);
  const muzzle = new THREE.Object3D();
  muzzle.position.z = 0.132;
  g.add(muzzle);
  g.userData = { muzzle };
  return g;
}

/** プログレッシブナイフ (全長 約 8 m) */
export function createProgKnife() {
  const g = new THREE.Group();
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.004, 0.062),
    new THREE.MeshStandardMaterial({ color: 0xdfe6ef, roughness: 0.22, metalness: 0.9 })
  );
  blade.position.z = 0.036;
  g.add(blade);
  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(0.004, 0.0055, 0.064),
    new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.9 })
  );
  edge.position.set(0.006, 0, 0.036);
  g.add(edge);
  const grip = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.012, 0.020),
    new THREE.MeshStandardMaterial({ color: 0x353a42, roughness: 0.8 })
  );
  g.add(grip);
  g.userData = { edge };
  return g;
}

/** N2 地雷 (直径 約 12 m の弾体) */
export function createN2Mine() {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.13, 16),
    new THREE.MeshStandardMaterial({ color: 0x9aa2ad, roughness: 0.45, metalness: 0.6 })
  );
  g.add(shell);
  for (const y of [-0.035, 0.035]) {
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.063, 0.063, 0.018, 16),
      new THREE.MeshStandardMaterial({ color: 0xffb01e, roughness: 0.5, metalness: 0.2 })
    );
    band.position.y = y;
    g.add(band);
  }
  const cap = new THREE.Mesh(
    new THREE.ConeGeometry(0.06, 0.05, 16),
    new THREE.MeshStandardMaterial({ color: 0xc23a24, roughness: 0.5, metalness: 0.4 })
  );
  cap.position.y = 0.09;
  g.add(cap);
  return g;
}

/** 陽電子砲 (全長 22 m) — EVA-01 の手元に配置 */
export function createPositronRifle() {
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: 0x8b939f, roughness: 0.42, metalness: 0.55 });
  const glow = new THREE.MeshBasicMaterial({ color: 0x6fc8ff });

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.22, 12), body);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = 0.06;
  g.add(barrel);

  const breech = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.11), body);
  breech.position.z = -0.07;
  g.add(breech);

  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.008, 8, 20), glow);
  coil.rotation.y = Math.PI / 2;
  coil.position.z = 0.02;
  g.add(coil);

  const muzzle = new THREE.Object3D();
  muzzle.position.z = 0.175;
  g.add(muzzle);

  g.userData = { muzzle, coil };
  return g;
}

/** 特殊装甲板 (盾) — 直径 32 m の八角板 */
export function createShield() {
  const g = new THREE.Group();
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.17, 0.012, 8),
    new THREE.MeshStandardMaterial({ color: 0x8d9199, roughness: 0.55, metalness: 0.7 })
  );
  plate.rotation.x = Math.PI / 2;
  g.add(plate);
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.168, 0.008, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xd05a2a, roughness: 0.5, metalness: 0.4 })
  );
  g.add(rim);

  // 被弾時の赤熱
  const heat = new THREE.Mesh(
    new THREE.CircleGeometry(0.168, 8),
    new THREE.MeshBasicMaterial({ color: 0xff5a1e, transparent: true, opacity: 0, blending: THREE.AdditiveBlending })
  );
  heat.position.z = 0.008;
  g.add(heat);

  g.userData = { heat };
  return g;
}

// ---------------------------------------------------------------------------
// 陽電子ビーム
// ---------------------------------------------------------------------------

const beamFrag = /* glsl */ `
precision highp float;
uniform vec3  uCore;
uniform vec3  uGlow;
uniform float uTime;
uniform float uIntensity;
uniform float uTravel;   // 先端位置 0..1
varying vec2 vUv;
void main() {
  float along = vUv.y;
  if (along > uTravel) discard;
  float r = abs(vUv.x - 0.5) * 2.0;
  float core = exp(-pow(r / 0.16, 2.0));
  float halo = exp(-pow(r / 0.72, 2.0));
  float turb = 0.85 + 0.15 * sin(along * 130.0 - uTime * 60.0);
  float head = exp(-pow((uTravel - along) / 0.035, 2.0));
  vec3 col = uCore * core * turb + uGlow * halo * 0.55;
  col += vec3(1.0) * head * 1.4;
  float a = (core + halo * 0.35 + head) * uIntensity;
  gl_FragColor = vec4(col * uIntensity, clamp(a, 0.0, 1.0));
}
`;

const beamVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/** 始点 → 終点 を結ぶビーム。fire() で発射アニメを起動する。 */
export function createBeam({ color = 0x9fe8ff, glow = 0x2f7bff, radius = 0.09 } = {}) {
  const geo = new THREE.CylinderGeometry(radius, radius, 1, 12, 1, true);
  geo.translate(0, 0.5, 0); // 原点を根元に
  const uniforms = {
    uCore: { value: new THREE.Color(color) },
    uGlow: { value: new THREE.Color(glow) },
    uTime: { value: 0 },
    uIntensity: { value: 0 },
    uTravel: { value: 0 },
  };
  const mesh = new THREE.Mesh(
    geo,
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: beamVert,
      fragmentShader: beamFrag,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  mesh.visible = false;
  mesh.renderOrder = 30;
  mesh.frustumCulled = false;

  const light = new THREE.PointLight(color, 0, 60, 2);
  mesh.add(light);

  let state = null;
  const from = new THREE.Vector3();
  const to = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  mesh.userData = {
    uniforms,
    aim(a, b) {
      from.copy(a);
      to.copy(b);
      dir.subVectors(to, from);
      const len = dir.length();
      mesh.position.copy(from);
      mesh.quaternion.setFromUnitVectors(up, dir.clone().normalize());
      mesh.scale.set(1, len, 1);
      light.position.set(0, len * 0.5, 0);
    },
    /** @param {number} travelTime 到達までの秒数 @param {number} hold 持続 */
    fire(travelTime = 0.22, hold = 0.9, fade = 0.5) {
      state = { t: 0, travelTime, hold, fade };
      mesh.visible = true;
    },
    stop() {
      state = null;
      mesh.visible = false;
      uniforms.uIntensity.value = 0;
      light.intensity = 0;
    },
    get firing() {
      return !!state;
    },
    update(dt, t) {
      uniforms.uTime.value = t;
      if (!state) return;
      state.t += dt;
      const { travelTime, hold, fade } = state;
      if (state.t < travelTime) {
        uniforms.uTravel.value = state.t / travelTime;
        uniforms.uIntensity.value = 1.6;
      } else if (state.t < travelTime + hold) {
        uniforms.uTravel.value = 1;
        uniforms.uIntensity.value = 1.25 + 0.25 * Math.sin(t * 40);
      } else if (state.t < travelTime + hold + fade) {
        uniforms.uTravel.value = 1;
        uniforms.uIntensity.value = 1.25 * (1 - (state.t - travelTime - hold) / fade);
      } else {
        mesh.userData.stop();
        return;
      }
      light.intensity = uniforms.uIntensity.value * 240;
    },
  };
  return mesh;
}

// ---------------------------------------------------------------------------
// 射線 (測距線) — 破線シリンダ
// ---------------------------------------------------------------------------

export function createSightLine(color = 0x2fd8ff) {
  const geo = new THREE.CylinderGeometry(0.012, 0.012, 1, 6, 1, true);
  geo.translate(0, 0.5, 0);
  const uniforms = {
    uColor: { value: new THREE.Color(color) },
    uTime: { value: 0 },
    uOpacity: { value: 0 },
    uLength: { value: 1 },
  };
  const mesh = new THREE.Mesh(
    geo,
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: beamVert,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform vec3 uColor; uniform float uTime; uniform float uOpacity; uniform float uLength;
        varying vec2 vUv;
        void main() {
          float d = vUv.y * uLength;
          float dash = step(0.45, fract(d * 1.6 - uTime * 0.8));
          float tick = step(0.94, fract(d * 0.2));
          float a = (dash * 0.34 + tick * 0.7) * uOpacity;
          if (a < 0.01) discard;
          gl_FragColor = vec4(uColor * (0.7 + tick), a);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  mesh.visible = false;
  mesh.frustumCulled = false;
  const up = new THREE.Vector3(0, 1, 0);
  mesh.userData = {
    uniforms,
    aim(a, b) {
      const dir = new THREE.Vector3().subVectors(b, a);
      const len = dir.length();
      mesh.position.copy(a);
      mesh.quaternion.setFromUnitVectors(up, dir.clone().normalize());
      mesh.scale.set(1, len, 1);
      uniforms.uLength.value = len;
      return len;
    },
    setOpacity(v) {
      uniforms.uOpacity.value = v;
      mesh.visible = v > 0.01;
    },
    update(dt, t) {
      uniforms.uTime.value = t;
    },
  };
  return mesh;
}

// ---------------------------------------------------------------------------
// 爆発・衝撃波
// ---------------------------------------------------------------------------

export function createBlastPool(count = 6) {
  const group = new THREE.Group();
  group.name = 'blasts';
  const items = [];
  for (let i = 0; i < count; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffb04a,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.7, 1, 64), mat);
    ring.rotation.x = -Math.PI / 2;
    ring.visible = false;

    const flashMat = new THREE.SpriteMaterial({
      color: 0xfff0c0,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const flash = new THREE.Sprite(flashMat);
    flash.visible = false;

    group.add(ring, flash);
    items.push({ ring, mat, flash, flashMat, t: -1, scale: 1, life: 1 });
  }

  group.userData = {
    /** @param {THREE.Vector3} p @param {number} size @param {number} life */
    fire(p, size = 6, life = 1.6) {
      const it = items.find((x) => x.t < 0) || items[0];
      it.t = 0;
      it.scale = size;
      it.life = life;
      it.ring.position.copy(p);
      it.ring.position.y += 0.05;
      it.flash.position.copy(p);
      it.ring.visible = true;
      it.flash.visible = true;
    },
    update(dt) {
      for (const it of items) {
        if (it.t < 0) continue;
        it.t += dt;
        const k = it.t / it.life;
        if (k >= 1) {
          it.t = -1;
          it.ring.visible = false;
          it.flash.visible = false;
          continue;
        }
        const e = 1 - Math.pow(1 - k, 3);
        it.ring.scale.setScalar(0.2 + e * it.scale);
        it.mat.opacity = Math.pow(1 - k, 1.6) * 0.85;
        const fs = it.scale * (0.35 + e * 0.55);
        it.flash.scale.set(fs, fs, 1);
        it.flashMat.opacity = Math.pow(1 - k, 4) * 1.0;
      }
    },
  };
  return group;
}
