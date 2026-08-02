// 地形メッシュ — MAGI の地形スキャン表示を模した等高線+グリッド陰影
import * as THREE from 'three';
import { MAP_SIZE, TERRAIN_SEG, MAP_HALF, elevationM, mToY, M_PER_UNIT, VE } from './geo.js';

const vert = /* glsl */ `
varying vec3 vPos;
varying vec3 vNrm;
varying float vElev;

void main() {
  vPos = position;
  vNrm = normalize(normalMatrix * normal);
  vElev = position.y * ${(M_PER_UNIT / VE).toFixed(4)};
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const frag = /* glsl */ `
precision highp float;

uniform vec3  uSunDir;
uniform vec3  uLowColor;
uniform vec3  uHighColor;
uniform vec3  uSeaColor;
uniform vec3  uContourColor;
uniform vec3  uGridColor;
uniform vec3  uFogColor;
uniform float uTime;
uniform float uScanPos;      // スキャン帯の位置 (world unit)
uniform float uScanStrength;
uniform float uReveal;       // 0..1 地形の展開アニメ
uniform float uMapHalf;
uniform vec3  uFocus;        // 注目地点 (ハイライト)
uniform float uFocusRadius;
uniform vec3  uCutCenter;    // 断面表示の中心 (ジオフロント直上)
uniform float uCutRadius;
uniform float uCutAmount;    // 0..1 地表を透過させて地下を見せる

varying vec3 vPos;
varying vec3 vNrm;
varying float vElev;

// 一定間隔の線を解像度非依存で描く
float isoLine(float value, float interval, float width) {
  float f = value / interval;
  float d = abs(fract(f - 0.5) - 0.5) / max(fwidth(f), 1e-5);
  return 1.0 - smoothstep(0.0, width, d);
}

void main() {
  vec3 n = normalize(vNrm);
  float sea = smoothstep(2.0, -6.0, vElev);

  // --- 基本陰影 (陰影起伏図と同じ考え方で斜面を読ませる) --------------------
  vec3 sun = normalize(uSunDir);
  float nl = clamp(dot(n, sun), -1.0, 1.0);
  float lambert = pow(nl * 0.5 + 0.5, 1.35);
  float sky = clamp(n.y, 0.0, 1.0);
  float steep = 1.0 - clamp(n.y, 0.0, 1.0);

  float hT = smoothstep(150.0, 1500.0, vElev);
  vec3 base = mix(uLowColor, uHighColor, hT);
  base = mix(base, uSeaColor, sea);
  base *= 0.18 + 0.82 * lambert;
  // 日向斜面の岩肌 / 日陰の落ち込み
  base += uHighColor * 0.34 * pow(steep, 1.6) * lambert * (1.0 - sea);
  base *= 1.0 - 0.45 * steep * (1.0 - lambert);
  base += vec3(0.014, 0.030, 0.056) * sky * 0.5;
  // 海岸線の縁取り
  base += uGridColor * 0.30 * exp(-pow(vElev / 26.0, 2.0));

  // --- 等高線 (100 m / 500 m) ----------------------------------------------
  float minor = isoLine(vElev, 100.0, 1.2) * 0.30;
  float major = isoLine(vElev, 500.0, 1.6) * 0.85;
  float contour = max(minor, major) * (1.0 - sea);
  // 急斜面では等高線が密になりすぎるので減衰
  contour *= mix(1.0, 0.35, smoothstep(0.35, 0.8, steep));

  // --- 測地グリッド (1 km / 5 km) ------------------------------------------
  float g1 = max(isoLine(vPos.x, 10.0, 1.0), isoLine(vPos.z, 10.0, 1.0)) * 0.10;
  float g5 = max(isoLine(vPos.x, 50.0, 1.4), isoLine(vPos.z, 50.0, 1.4)) * 0.30;
  float grid = max(g1, g5);

  // 近景での面の単調さを崩す微細ノイズ (2.5 m スケール)
  float det = fract(sin(dot(floor(vPos.xz * 40.0), vec2(12.9898, 78.233))) * 43758.5453);
  base *= 0.93 + 0.14 * det;

  vec3 col = base;
  col += uContourColor * contour;
  col += uGridColor * grid;

  // --- 海面のうねり ---------------------------------------------------------
  float wave = sin(vPos.x * 0.55 + uTime * 0.7) * sin(vPos.z * 0.42 - uTime * 0.5);
  col += uSeaColor * sea * (0.05 + 0.05 * wave);

  // --- スキャン帯 -----------------------------------------------------------
  float axis = vPos.x * 0.6 + vPos.z * 0.8;
  float scan = exp(-pow((axis - uScanPos) / 5.5, 2.0));
  col += vec3(0.10, 0.62, 0.78) * scan * uScanStrength;
  col += uContourColor * scan * uScanStrength * 0.5 * contour;

  // --- 注目地点ハイライト ----------------------------------------------------
  float fd = length(vPos.xz - uFocus.xz);
  float ring = exp(-pow((fd - uFocusRadius) / 1.6, 2.0));
  col += uGridColor * ring * 0.16;
  col += uGridColor * 0.022 * (1.0 - smoothstep(0.0, uFocusRadius, fd));

  // --- 展開アニメ (中心から外へ) ---------------------------------------------
  float rr = length(vPos.xz) / uMapHalf;
  float rev = smoothstep(uReveal + 0.02, uReveal - 0.10, rr);
  float revEdge = exp(-pow((rr - uReveal) / 0.012, 2.0));
  col += vec3(0.25, 0.85, 1.0) * revEdge * 0.9;

  // --- 距離フォグ + マップ端フェード ------------------------------------------
  float depth = length(vPos.xz) / uMapHalf;
  col = mix(col, uFogColor, smoothstep(0.72, 1.25, depth) * 0.85);

  float alpha = rev * (1.0 - smoothstep(0.94, 1.22, depth));

  // --- 断面表示 (地表を抜いて地下構造を見せる) --------------------------------
  if (uCutAmount > 0.001) {
    float cd = length(vPos.xz - uCutCenter.xz);
    float hole = 1.0 - smoothstep(uCutRadius * 0.72, uCutRadius, cd);
    // 開口の縁を発光させ、切断面であることを示す
    float lip = exp(-pow((cd - uCutRadius * 0.86) / (uCutRadius * 0.10), 2.0));
    col += vec3(1.0, 0.48, 0.10) * lip * uCutAmount * 1.1;
    alpha *= 1.0 - uCutAmount * hole * 0.97;
  }

  if (alpha < 0.004) discard;

  gl_FragColor = vec4(col, alpha);
}
`;

/** @param {number} [segments] 分割数 (端末性能に応じて落とす) */
export function createTerrain(segments = TERRAIN_SEG) {
  const geo = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE, segments, segments);
  geo.rotateX(-Math.PI / 2); // XZ 平面へ

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setY(i, mToY(elevationM(x, z)));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  geo.computeBoundingSphere();

  const uniforms = {
    uSunDir: { value: new THREE.Vector3(-0.42, 0.55, -0.72).normalize() },
    uLowColor: { value: new THREE.Color(0x18242f) },
    uHighColor: { value: new THREE.Color(0x4e4557) },
    uSeaColor: { value: new THREE.Color(0x041c2e) },
    uContourColor: { value: new THREE.Color(0xff7a1a) },
    uGridColor: { value: new THREE.Color(0x1fa8c8) },
    uFogColor: { value: new THREE.Color(0x03060c) },
    uTime: { value: 0 },
    uScanPos: { value: -260 },
    uScanStrength: { value: 0 },
    uReveal: { value: 0 },
    uMapHalf: { value: MAP_HALF },
    uFocus: { value: new THREE.Vector3(0, 0, 0) },
    uFocusRadius: { value: 0 },
    uCutCenter: { value: new THREE.Vector3(0, 0, 0) },
    uCutRadius: { value: 14 },
    uCutAmount: { value: 0 },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    depthWrite: true,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'terrain';
  mesh.renderOrder = 0;
  return { mesh, uniforms };
}
