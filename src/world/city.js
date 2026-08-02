// 第3新東京市 — 要塞都市のビル群 (インスタンス描画)
import * as THREE from 'three';
import { PLACES, CITY_RADIUS, terrainY, mToY } from './geo.js';
import { mulberry32 } from './noise.js';

const vert = /* glsl */ `
attribute vec3 aParam;   // x: 高さ(unit), y: 乱数, z: 幅
uniform float uRetract;  // 0..1 ビル格納 (要塞都市の戦闘配置)
varying vec3 vLocal;   // 単位ボックス座標 (-0.5..0.5)
varying vec3 vSurf;    // 実寸ローカル座標 (window 割付用)
varying vec3 vParam;
varying vec3 vWorld;
varying vec3 vNrm;
void main() {
  vLocal = position;
  vParam = aParam;
  vec3 scale = vec3(
    length(instanceMatrix[0].xyz),
    length(instanceMatrix[1].xyz),
    length(instanceMatrix[2].xyz)
  );
  vSurf = position * scale;
  vNrm = normalize(mat3(instanceMatrix) * normal);
  vec4 wp = instanceMatrix * vec4(position, 1.0);
  // 格納: 棟ごとに少しずつ時間差をつけて地下へ沈める
  float lag = clamp((uRetract - aParam.y * 0.28) / 0.72, 0.0, 1.0);
  wp.y -= aParam.x * lag * 1.04;
  vWorld = wp.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * wp;
}
`;

const frag = /* glsl */ `
precision highp float;
uniform vec3  uBody;
uniform vec3  uWindow;
uniform vec3  uEdge;
uniform float uTime;
uniform float uPower;    // 市街の通電率 0..1 (作戦中は消灯)
uniform float uAlert;    // 警報点滅
uniform float uCut;      // 断面表示で市街を透過させる
uniform vec3  uCutCenter;
uniform float uCutRadius;
uniform vec3  uFogColor;
uniform float uFogNear;
uniform float uFogFar;
varying vec3 vLocal;
varying vec3 vSurf;
varying vec3 vParam;
varying vec3 vWorld;
varying vec3 vNrm;

void main() {
  vec3 n = normalize(vNrm);
  float lambert = clamp(dot(n, normalize(vec3(-0.42, 0.75, -0.6))), 0.0, 1.0);
  vec3 col = uBody * (0.30 + 0.62 * lambert);

  // 窓 — 側面のみ、格子状
  float side = 1.0 - abs(n.y);
  vec2 uv = abs(n.x) > 0.5 ? vec2(vSurf.z, vSurf.y) : vec2(vSurf.x, vSurf.y);
  vec2 cell = uv / vec2(0.055, 0.075);
  vec2 f = fract(cell);
  float win = step(0.18, f.x) * step(f.x, 0.82) * step(0.22, f.y) * step(f.y, 0.80);
  float rnd = fract(sin(floor(cell.x) * 12.9898 + floor(cell.y) * 78.233 + vParam.y * 43.1) * 43758.5453);
  float lit = step(1.0 - uPower * 0.55, rnd);
  col += uWindow * win * side * lit * (0.55 + 0.45 * sin(uTime * 0.6 + rnd * 20.0)) * uPower;

  // 屋上面はごく控えめに (発光させすぎると都市が塊に潰れる)
  float top = smoothstep(0.47, 0.5, vLocal.y);
  col += uEdge * top * 0.06;

  // 屋上端の縁取り
  vec2 eu = abs(vLocal.xz) * 2.0;
  float edgeLine = top * smoothstep(0.80, 0.99, max(eu.x, eu.y));
  col += uEdge * edgeLine * (0.42 + 0.30 * uAlert);

  // 警報時の赤色灯 (高層棟のみ)
  float beacon = step(0.90, vParam.y) * step(1.6, vParam.x) * top;
  col += vec3(1.0, 0.16, 0.1) * beacon * uAlert * (0.35 + 0.65 * step(0.5, fract(uTime * 0.8)));

  float d = length(vWorld.xz - vec2(${PLACES.tokyo3.x.toFixed(1)}, ${PLACES.tokyo3.z.toFixed(1)}));
  float fog = smoothstep(uFogNear, uFogFar, d);
  col = mix(col, uFogColor, fog * 0.55);

  float a = 1.0;
  if (uCut > 0.001) {
    float cd = length(vWorld.xz - uCutCenter.xz);
    a -= uCut * (1.0 - smoothstep(uCutRadius * 0.72, uCutRadius * 1.15, cd));
    if (a < 0.01) discard;
  }

  gl_FragColor = vec4(col, a);
}
`;

export function createCity() {
  const rnd = mulberry32(20150614);
  const cells = [];
  const step = 0.72;

  for (let gx = -CITY_RADIUS; gx <= CITY_RADIUS; gx += step) {
    for (let gz = -CITY_RADIUS; gz <= CITY_RADIUS; gz += step) {
      const d = Math.hypot(gx, gz);
      if (d > CITY_RADIUS) continue;
      // 環状道路 (2.6 unit 間隔) の空白
      const ring = Math.abs((d % 2.6) - 1.3);
      if (ring > 1.06) continue;
      // 放射道路 (30度ごと)
      const ang = Math.atan2(gz, gx);
      const spoke = Math.abs(((ang + Math.PI * 4) % (Math.PI / 6)) - Math.PI / 12);
      if (spoke > Math.PI / 12 - 0.028) continue;
      if (rnd() < 0.10) continue;

      const jitter = 0.14;
      const x = PLACES.tokyo3.x + gx + (rnd() - 0.5) * jitter;
      const z = PLACES.tokyo3.z + gz + (rnd() - 0.5) * jitter;

      // 中心ほど高層 (ジオフロント直上の中枢区画)
      const core = 1 - d / CITY_RADIUS;
      const h = mToY(45 + Math.pow(core, 1.7) * 330 * (0.35 + rnd()) + rnd() * 70);
      const w = 0.26 + rnd() * 0.30 + core * 0.16;
      cells.push({ x, z, h, w, seed: rnd() });
    }
  }

  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uBody: { value: new THREE.Color(0x1a1e2a) },
      uWindow: { value: new THREE.Color(0xffb15e) },
      uEdge: { value: new THREE.Color(0xff7a1a) },
      uFogColor: { value: new THREE.Color(0x05080f) },
      uFogNear: { value: 6 },
      uFogFar: { value: 26 },
      uTime: { value: 0 },
      uPower: { value: 1 },
      uAlert: { value: 0 },
      uRetract: { value: 0 },
      uCut: { value: 0 },
      uCutCenter: { value: new THREE.Vector3(PLACES.tokyo3.x, 0, PLACES.tokyo3.z) },
      uCutRadius: { value: 14 },
    },
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
  });

  const mesh = new THREE.InstancedMesh(geo, mat, cells.length);
  mesh.name = 'tokyo3';
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const params = new Float32Array(cells.length * 3);

  cells.forEach((c, i) => {
    const ground = terrainY(c.x, c.z);
    m.compose(
      new THREE.Vector3(c.x, ground + c.h / 2, c.z),
      q,
      new THREE.Vector3(c.w, c.h, c.w * (0.8 + c.seed * 0.4))
    );
    mesh.setMatrixAt(i, m);
    params[i * 3 + 0] = c.h;
    params[i * 3 + 1] = c.seed;
    params[i * 3 + 2] = c.w;
  });
  mesh.instanceMatrix.needsUpdate = true;
  geo.setAttribute('aParam', new THREE.InstancedBufferAttribute(params, 3));

  return { mesh, uniforms: mat.uniforms, count: cells.length };
}

// ジオフロント — 都市地下の球殻 (ワイヤーフレーム表示)
export function createGeofront() {
  const g = new THREE.Group();
  g.name = 'geofront';
  const R = 8.5;
  const geo = new THREE.SphereGeometry(R, 36, 24);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x2fd8ff,
    wireframe: true,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });
  const sphere = new THREE.Mesh(geo, mat);
  const ground = terrainY(PLACES.tokyo3.x, PLACES.tokyo3.z);
  sphere.position.set(PLACES.tokyo3.x, ground - R * 0.55, PLACES.tokyo3.z);
  g.add(sphere);

  // 中枢部 (NERV 本部ピラミッド)
  const pyr = new THREE.Mesh(
    new THREE.ConeGeometry(1.6, 2.2, 4),
    new THREE.MeshBasicMaterial({ color: 0xff7a1a, wireframe: true, transparent: true, opacity: 0 })
  );
  pyr.position.set(PLACES.tokyo3.x, ground - R * 0.55 - 1.2, PLACES.tokyo3.z);
  pyr.rotation.y = Math.PI / 4;
  g.add(pyr);

  g.userData.setOpacity = (v) => {
    mat.opacity = 0.09 * v;
    pyr.material.opacity = 0.55 * v;
  };
  return g;
}
