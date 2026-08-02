// カメラ演出 — 注視点まわりの極座標補間による滑らかな俯瞰移動
import * as THREE from 'three';
import { terrainY } from '../world/geo.js';

const EASES = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  easeInOutSoft: (t) => t * t * (3 - 2 * t),
};

function shortestAngle(a0, a1) {
  let d = (a1 - a0) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// 低周波ノイズ (手持ちカメラの微揺れ)
function wobble(t, seed) {
  return (
    Math.sin(t * 0.37 + seed) * 0.6 +
    Math.sin(t * 0.83 + seed * 2.1) * 0.28 +
    Math.sin(t * 1.61 + seed * 3.7) * 0.12
  );
}

export class CameraDirector {
  /**
   * @param {THREE.PerspectiveCamera} camera
   * @param {Array} keys [{t, pos:[x,y,z], target:[x,y,z], fov, ease, spin, handheld}]
   */
  constructor(camera, keys) {
    this.camera = camera;
    this.keys = keys.slice().sort((a, b) => a.t - b.t);
    this.shakeAmp = 0;
    this.shakeDecay = 3.5;
    this._pos = new THREE.Vector3();
    this._tgt = new THREE.Vector3();
    this.minClearance = 1.6;
    this.enabled = true;
  }

  shake(amp, decay = 3.5) {
    this.shakeAmp = Math.max(this.shakeAmp, amp);
    this.shakeDecay = decay;
  }

  /** @returns {{pos:THREE.Vector3, target:THREE.Vector3, fov:number}} */
  sample(time) {
    const keys = this.keys;
    let i = 0;
    while (i < keys.length - 2 && time >= keys[i + 1].t) i++;
    const k0 = keys[Math.min(i, keys.length - 1)];
    const k1 = keys[Math.min(i + 1, keys.length - 1)];

    const span = Math.max(1e-4, k1.t - k0.t);
    let u = (time - k0.t) / span;
    u = Math.min(1, Math.max(0, u));
    const ease = EASES[k1.ease || k0.ease || 'easeInOut'] || EASES.easeInOut;
    const e = ease(u);

    // 注視点
    const tx = THREE.MathUtils.lerp(k0.target[0], k1.target[0], e);
    const ty = THREE.MathUtils.lerp(k0.target[1], k1.target[1], e);
    const tz = THREE.MathUtils.lerp(k0.target[2], k1.target[2], e);

    // カメラを注視点まわりの極座標で補間 → 弧を描く自然な移動になる
    const r0x = k0.pos[0] - k0.target[0];
    const r0z = k0.pos[2] - k0.target[2];
    const r1x = k1.pos[0] - k1.target[0];
    const r1z = k1.pos[2] - k1.target[2];

    const rad0 = Math.hypot(r0x, r0z);
    const rad1 = Math.hypot(r1x, r1z);
    const ang0 = Math.atan2(r0z, r0x);
    const ang1 = Math.atan2(r1z, r1x);

    const rad = THREE.MathUtils.lerp(rad0, rad1, e);
    const spin = (k1.spin || 0) * Math.PI * 2;
    const ang = ang0 + (shortestAngle(ang0, ang1) + spin) * e;
    const hy = THREE.MathUtils.lerp(k0.pos[1] - k0.target[1], k1.pos[1] - k1.target[1], e);

    const px = tx + Math.cos(ang) * rad;
    const pz = tz + Math.sin(ang) * rad;
    const py = ty + hy;

    const fov = THREE.MathUtils.lerp(k0.fov ?? 32, k1.fov ?? 32, e);
    const handheld = THREE.MathUtils.lerp(k0.handheld ?? 1, k1.handheld ?? 1, e);

    return {
      pos: this._pos.set(px, py, pz),
      target: this._tgt.set(tx, ty, tz),
      fov,
      handheld,
    };
  }

  update(time, dt) {
    if (!this.enabled) return;
    const s = this.sample(time);

    // 手持ち風の微揺れ (スケールは距離に比例)
    const dist = s.pos.distanceTo(s.target);
    const amp = Math.min(1.6, dist * 0.0018) * s.handheld;
    s.pos.x += wobble(time * 0.9, 1.7) * amp;
    s.pos.y += wobble(time * 0.7, 4.2) * amp * 0.7;
    s.pos.z += wobble(time * 0.8, 8.9) * amp;
    s.target.x += wobble(time * 0.6, 12.3) * amp * 0.5;
    s.target.y += wobble(time * 0.5, 15.1) * amp * 0.35;

    // 衝撃
    if (this.shakeAmp > 0.0005) {
      const k = this.shakeAmp * Math.min(1, dist * 0.02);
      s.pos.x += (Math.random() - 0.5) * k;
      s.pos.y += (Math.random() - 0.5) * k;
      s.pos.z += (Math.random() - 0.5) * k;
      s.target.x += (Math.random() - 0.5) * k * 0.4;
      s.target.y += (Math.random() - 0.5) * k * 0.4;
      this.shakeAmp -= this.shakeAmp * this.shakeDecay * dt;
    }

    // 地形へのめり込み防止
    const g = terrainY(s.pos.x, s.pos.z) + this.minClearance;
    if (s.pos.y < g) s.pos.y = g;

    this.camera.position.copy(s.pos);
    this.camera.lookAt(s.target);
    if (Math.abs(this.camera.fov - s.fov) > 0.01) {
      this.camera.fov = s.fov;
      this.camera.updateProjectionMatrix();
    }
    this.lastTarget = s.target.clone();
  }
}
