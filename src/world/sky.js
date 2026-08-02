// 夜空 — 作戦開始時は深夜、終了時に薄明へ遷移する
import * as THREE from 'three';
import { MAP_SIZE } from './geo.js';

const vert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
}
`;

const frag = /* glsl */ `
precision highp float;
uniform vec3  uZenith;
uniform vec3  uHorizon;
uniform vec3  uDawn;
uniform float uDawnMix;
uniform vec3  uDawnDir;
uniform float uTime;
uniform float uImpact;   // ニアサードインパクト — 空が赤く灼ける
uniform vec3  uImpactCol;
varying vec3 vDir;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec3 d = normalize(vDir);
  float h = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 col = mix(uHorizon, uZenith, pow(h, 0.75));

  // 星 (低高度ほど減光)
  vec2 sp = vec2(atan(d.z, d.x) * 2.6, d.y * 4.2);
  vec2 gi = floor(sp * 42.0);
  float r = hash(gi);
  if (r > 0.9955) {
    vec2 f = fract(sp * 42.0) - 0.5;
    float star = exp(-dot(f, f) * 90.0);
    float tw = 0.6 + 0.4 * sin(uTime * 2.1 + r * 90.0);
    col += vec3(0.8, 0.9, 1.0) * star * tw * smoothstep(0.02, 0.35, d.y);
  }

  // 薄明 — 東の空が焼ける
  float dawn = pow(clamp(dot(d, normalize(uDawnDir)), 0.0, 1.0), 2.4);
  dawn *= smoothstep(-0.12, 0.34, d.y);
  col = mix(col, uDawn, dawn * uDawnMix);
  col += uDawn * uDawnMix * 0.10 * (1.0 - smoothstep(0.0, 0.5, abs(d.y - 0.06)));

  // ニアサードインパクト — 天頂から赤い光が満ちる
  if (uImpact > 0.001) {
    float band = 0.35 + 0.65 * pow(clamp(d.y, 0.0, 1.0), 0.6);
    float pulse = 0.85 + 0.15 * sin(uTime * 1.6 + d.y * 6.0);
    col = mix(col, uImpactCol * band * pulse, uImpact);
    col += uImpactCol * uImpact * 0.16 * (1.0 - smoothstep(0.0, 0.42, abs(d.y - 0.02)));
  }

  gl_FragColor = vec4(col, 1.0);
}
`;

export function createSky() {
  const geo = new THREE.SphereGeometry(MAP_SIZE * 1.6, 48, 32);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uZenith: { value: new THREE.Color(0x01030a) },
      uHorizon: { value: new THREE.Color(0x081426) },
      uDawn: { value: new THREE.Color(0xff7a34) },
      uDawnMix: { value: 0 },
      uDawnDir: { value: new THREE.Vector3(0.85, 0.16, -0.5).normalize() },
      uTime: { value: 0 },
      uImpact: { value: 0 },
      uImpactCol: { value: new THREE.Color(0xd8202c) },
    },
    vertexShader: vert,
    fragmentShader: frag,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'sky';
  mesh.renderOrder = -10;
  return { mesh, uniforms: mat.uniforms };
}
