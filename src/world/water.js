// 水面 — 相模湾 と 芦ノ湖
import * as THREE from 'three';
import { MAP_SIZE, MAP_HALF, elevationM, lakeMask, LAKE_Y, SEA_Y, PLACES } from './geo.js';
import { smoothstep } from './noise.js';

const vert = /* glsl */ `
attribute float aMask;
varying float vMask;
varying vec3 vPos;
void main() {
  vMask = aMask;
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const frag = /* glsl */ `
precision highp float;
uniform vec3  uColor;
uniform vec3  uGlow;
uniform float uTime;
uniform float uReveal;
uniform float uMapHalf;
uniform float uRipple;
varying float vMask;
varying vec3 vPos;

float lineAt(float v, float interval, float w) {
  float f = v / interval;
  float d = abs(fract(f - 0.5) - 0.5) / max(fwidth(f), 1e-5);
  return 1.0 - smoothstep(0.0, w, d);
}

void main() {
  if (vMask < 0.02) discard;

  // うねりを重ねた擬似スペキュラ
  float w1 = sin(vPos.x * 0.9 + uTime * 0.85);
  float w2 = sin(vPos.z * 0.72 - uTime * 0.63);
  float w3 = sin((vPos.x + vPos.z) * 0.35 + uTime * 0.4);
  float ripple = (w1 * w2 * 0.5 + w3 * 0.5);

  vec3 col = uColor * (0.55 + 0.45 * (ripple * 0.5 + 0.5));
  col += uGlow * pow(max(0.0, ripple), 6.0) * 0.9 * uRipple;

  // 水面上の等深グリッド
  float g = max(lineAt(vPos.x, 10.0, 1.0), lineAt(vPos.z, 10.0, 1.0));
  col += uGlow * g * 0.10;

  float rr = length(vPos.xz) / uMapHalf;
  float rev = smoothstep(uReveal + 0.02, uReveal - 0.10, rr);
  float edge = 1.0 - smoothstep(0.86, 1.0, rr);

  gl_FragColor = vec4(col, vMask * 0.80 * rev * edge);
}
`;

function buildPlane(size, seg, maskFn, y) {
  const geo = new THREE.PlaneGeometry(size.w, size.h, seg, seg);
  geo.rotateX(-Math.PI / 2);
  geo.translate(size.cx, y, size.cz);
  const pos = geo.attributes.position;
  const mask = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    mask[i] = maskFn(pos.getX(i), pos.getZ(i));
  }
  geo.setAttribute('aMask', new THREE.BufferAttribute(mask, 1));
  return geo;
}

export function createWater() {
  const group = new THREE.Group();
  group.name = 'water';

  const shared = {
    uTime: { value: 0 },
    uReveal: { value: 0 },
    uMapHalf: { value: MAP_HALF },
  };

  // --- 相模湾 -------------------------------------------------------------
  const seaGeo = buildPlane(
    { w: MAP_SIZE, h: MAP_SIZE, cx: 0, cz: 0 },
    200,
    (x, z) => smoothstep(6, -26, elevationM(x, z)),
    SEA_Y
  );
  const seaMat = new THREE.ShaderMaterial({
    uniforms: {
      ...shared,
      uColor: { value: new THREE.Color(0x05243a) },
      uGlow: { value: new THREE.Color(0x2fd8ff) },
      uRipple: { value: 1.0 },
    },
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    depthWrite: false,
  });
  group.add(new THREE.Mesh(seaGeo, seaMat));

  // --- 芦ノ湖 -------------------------------------------------------------
  const lakeGeo = buildPlane(
    { w: 90, h: 90, cx: -22, cz: 14 },
    150,
    (x, z) => lakeMask(x, z),
    LAKE_Y
  );
  const lakeMat = new THREE.ShaderMaterial({
    uniforms: {
      ...shared,
      uColor: { value: new THREE.Color(0x072b3c) },
      uGlow: { value: new THREE.Color(0x5ce6ff) },
      uRipple: { value: 0.6 },
    },
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    depthWrite: false,
  });
  group.add(new THREE.Mesh(lakeGeo, lakeMat));

  group.userData.uniforms = [seaMat.uniforms, lakeMat.uniforms];
  // 未使用参照の抑止 (PLACES は座標定義の単一情報源として保持)
  void PLACES;
  return group;
}
