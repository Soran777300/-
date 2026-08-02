// 進軍矢印 / 送電経路 — 地形に沿ったリボン + 矢頭
import * as THREE from 'three';
import { surfaceY } from './geo.js';

const vert = /* glsl */ `
attribute float aU;    // 0..1 経路方向
attribute float aV;    // 0..1 幅方向
attribute float aDist; // 始点からの距離 (world unit)
varying float vU;
varying float vV;
varying float vDist;
void main() {
  vU = aU;
  vV = aV;
  vDist = aDist;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const frag = /* glsl */ `
precision highp float;
uniform vec3  uColor;
uniform vec3  uHot;
uniform float uProgress;
uniform float uOpacity;
uniform float uTime;
uniform float uFlowSpeed;
uniform float uFlowScale;
varying float vU;
varying float vV;
varying float vDist;

void main() {
  // 伸長アニメ
  float rev = smoothstep(uProgress, uProgress - 0.045, vU);
  if (rev <= 0.001) discard;

  // 流れる山形パターン
  float f = fract(vDist * uFlowScale - uTime * uFlowSpeed);
  float chevron = smoothstep(0.42, 0.98, f);

  // 縁の強調
  float edge = 1.0 - abs(vV * 2.0 - 1.0);
  float body = pow(clamp(edge, 0.0, 1.0), 0.45);
  float rim = smoothstep(0.28, 0.0, edge);

  vec3 col = uColor * (0.24 + 0.52 * chevron);
  col += uHot * rim * 0.34;

  // 先端の輝き
  float tip = exp(-pow((uProgress - vU) / 0.055, 2.0));
  col += uHot * tip * 0.85;

  float a = uOpacity * rev * (0.16 + 0.50 * chevron) * (body * 0.85 + 0.15);
  a = max(a, uOpacity * rev * rim * 0.5);
  a = max(a, uOpacity * rev * tip * 0.8);

  gl_FragColor = vec4(col, a);
}
`;

function smoothArray(arr, passes) {
  const out = arr.slice();
  for (let p = 0; p < passes; p++) {
    const prev = out.slice();
    for (let i = 1; i < out.length - 1; i++) {
      out[i] = (prev[i - 1] + prev[i] * 2 + prev[i + 1]) / 4;
    }
  }
  return out;
}

/**
 * @param {object} o
 * @param {Array<[number,number]>} o.points 制御点 (x, z)
 * @param {number} [o.width]    軸部の幅 (world unit)
 * @param {number} [o.headLen]  矢頭の長さ (world unit)
 * @param {number} [o.headWidth] 矢頭幅倍率
 * @param {number} [o.hover]    接地からの浮かせ量
 * @param {number} [o.arc]      経路中央の弧の高さ (送電線・空路用)
 * @param {number} o.color
 * @param {number} [o.hot]
 * @param {number} [o.samples]
 */
export function createArrow(o) {
  const width = o.width ?? 1.6;
  const headLen = o.headLen ?? 5.0;
  const headWidth = o.headWidth ?? 2.15;
  const hover = o.hover ?? 0.55;
  const arc = o.arc ?? 0;
  const N = o.samples ?? 200;

  const curve = new THREE.CatmullRomCurve3(
    o.points.map((p) => new THREE.Vector3(p[0], 0, p[1])),
    false,
    'catmullrom',
    0.5
  );

  // --- 経路サンプリング -------------------------------------------------------
  const pts = [];
  for (let i = 0; i <= N; i++) pts.push(curve.getPoint(i / N));

  const dist = [0];
  for (let i = 1; i <= N; i++) {
    dist.push(dist[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
  }
  const total = dist[N] || 1;

  // 接地高さ (平滑化して段差を消す)
  let ys = pts.map((p) => surfaceY(p.x, p.z) + hover);
  ys = smoothArray(ys, 6);
  for (let i = 0; i <= N; i++) {
    const g = surfaceY(pts[i].x, pts[i].z) + hover * 0.45;
    if (ys[i] < g) ys[i] = g;
    if (arc) {
      const t = dist[i] / total;
      ys[i] += arc * Math.sin(Math.PI * t);
    }
    pts[i].y = ys[i];
  }

  // --- 幅プロファイル ---------------------------------------------------------
  const headStart = Math.max(0, total - headLen);
  const nodes = []; // { p, u, d, w }
  for (let i = 0; i <= N; i++) {
    const d = dist[i];
    let w;
    if (d <= headStart) {
      w = width;
    } else {
      const t = (d - headStart) / Math.max(1e-4, total - headStart);
      w = width * headWidth * (1 - t);
    }
    // 矢頭基部で幅を不連続にするため頂点を二重化
    if (i > 0 && dist[i - 1] <= headStart && d > headStart) {
      const tt = (headStart - dist[i - 1]) / Math.max(1e-5, d - dist[i - 1]);
      const pj = pts[i - 1].clone().lerp(pts[i], tt);
      nodes.push({ p: pj, d: headStart, w: width });
      nodes.push({ p: pj.clone(), d: headStart + 1e-4, w: width * headWidth });
    }
    nodes.push({ p: pts[i], d, w });
  }

  // --- リボン生成 -------------------------------------------------------------
  const M = nodes.length;
  const position = new Float32Array(M * 2 * 3);
  const aU = new Float32Array(M * 2);
  const aV = new Float32Array(M * 2);
  const aDist = new Float32Array(M * 2);
  const up = new THREE.Vector3(0, 1, 0);
  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();

  for (let i = 0; i < M; i++) {
    const a = nodes[Math.max(0, i - 1)].p;
    const b = nodes[Math.min(M - 1, i + 1)].p;
    tangent.set(b.x - a.x, 0, b.z - a.z);
    if (tangent.lengthSq() < 1e-9) tangent.set(0, 0, 1);
    tangent.normalize();
    side.crossVectors(up, tangent).normalize().multiplyScalar(nodes[i].w / 2);

    const p = nodes[i].p;
    const u = nodes[i].d / total;

    position[i * 6 + 0] = p.x + side.x;
    position[i * 6 + 1] = p.y;
    position[i * 6 + 2] = p.z + side.z;
    position[i * 6 + 3] = p.x - side.x;
    position[i * 6 + 4] = p.y;
    position[i * 6 + 5] = p.z - side.z;

    aU[i * 2] = u;
    aU[i * 2 + 1] = u;
    aV[i * 2] = 0;
    aV[i * 2 + 1] = 1;
    aDist[i * 2] = nodes[i].d;
    aDist[i * 2 + 1] = nodes[i].d;
  }

  const index = [];
  for (let i = 0; i < M - 1; i++) {
    const a = i * 2;
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geo.setAttribute('aU', new THREE.BufferAttribute(aU, 1));
  geo.setAttribute('aV', new THREE.BufferAttribute(aV, 1));
  geo.setAttribute('aDist', new THREE.BufferAttribute(aDist, 1));
  geo.setIndex(index);
  geo.computeBoundingSphere();

  const uniforms = {
    uColor: { value: new THREE.Color(o.color) },
    uHot: { value: new THREE.Color(o.hot ?? 0xffffff) },
    uProgress: { value: 0 },
    uOpacity: { value: 0 },
    uTime: { value: 0 },
    uFlowSpeed: { value: o.flowSpeed ?? 1.1 },
    uFlowScale: { value: o.flowScale ?? 0.11 },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'arrow';
  mesh.renderOrder = 6;
  mesh.frustumCulled = false;

  const baseOpacity = o.opacity ?? 0.85;
  let opacity = 0;

  mesh.userData = {
    totalLength: total,
    pointAt(u) {
      return curve.getPoint(Math.min(1, Math.max(0, u)));
    },
    /** 伸長率 0..1 — 台本側から時刻の関数として与える */
    setProgress(p) {
      uniforms.uProgress.value = Math.min(1, Math.max(0, p));
    },
    setOpacity(v) {
      opacity = Math.min(1, Math.max(0, v));
      uniforms.uOpacity.value = opacity * baseOpacity;
      mesh.visible = opacity > 0.01;
    },
    update(dt, t) {
      uniforms.uTime.value = t;
    },
  };

  return mesh;
}
