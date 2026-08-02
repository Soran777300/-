// 部隊・施設マーカー — NERV 戦術表示のシンボロジー
// 実物のデフォルメ模型ではなく、実戦指揮画面と同じ「記号 + 標定線 + 銘板」で表現する。
import * as THREE from 'three';
import { surfaceY } from './geo.js';

export const FACTION = {
  NERV: { color: 0xff7a1a, tag: 'NERV' },
  EVA: { color: 0xb388ff, tag: 'EVANGELION' },
  EVA00: { color: 0x5cc8ff, tag: 'EVANGELION' },
  EVA02: { color: 0xff6a4a, tag: 'EVANGELION' },
  JSSDF: { color: 0x48e08a, tag: 'JSSDF' },
  UN: { color: 0x8fb8ff, tag: 'UN FORCES' },
  MINISTRY: { color: 0x2fd8ff, tag: 'GOV' },
  LOGISTICS: { color: 0xffd166, tag: 'LOGISTICS' },
  ANGEL: { color: 0xff2d55, tag: 'ANGEL' },
};

const LABEL_W = 768;
const LABEL_H = 232;
const _wp = new THREE.Vector3();
let labelAnisotropy = 4;

/** 端末性能に応じた銘板テクスチャの異方性フィルタ設定 */
export function setLabelAnisotropy(v) {
  labelAnisotropy = v;
}

function drawLabel(name, code, status, colorHex, tag) {
  const c = document.createElement('canvas');
  c.width = LABEL_W;
  c.height = LABEL_H;
  const g = c.getContext('2d');
  const col = '#' + colorHex.toString(16).padStart(6, '0');

  g.clearRect(0, 0, LABEL_W, LABEL_H);

  // 本体
  g.fillStyle = 'rgba(2,5,10,0.90)';
  g.fillRect(10, 40, LABEL_W - 20, 132);

  // 外枠
  g.strokeStyle = col;
  g.lineWidth = 5;
  g.strokeRect(10, 40, LABEL_W - 20, 132);

  // 左アクセントタブ
  g.fillStyle = col;
  g.fillRect(10, 40, 22, 132);

  // 角のティック
  g.lineWidth = 3;
  const t = 26;
  const corners = [
    [10, 40, 1, 1],
    [LABEL_W - 10, 40, -1, 1],
    [10, 172, 1, -1],
    [LABEL_W - 10, 172, -1, -1],
  ];
  for (const [x, y, sx, sy] of corners) {
    g.beginPath();
    g.moveTo(x + sx * t, y - sy * 12);
    g.lineTo(x + sx * t, y + sy * 0);
    g.moveTo(x - sx * 0, y + sy * t);
    g.lineTo(x + sx * 12, y + sy * t);
    g.stroke();
  }

  // 上部の識別帯
  g.fillStyle = col;
  g.globalAlpha = 0.85;
  g.font = '700 30px "Helvetica Neue", Arial, sans-serif';
  g.textBaseline = 'alphabetic';
  g.fillText(tag, 14, 30);
  g.globalAlpha = 1;

  // 名称 (日本語)
  g.fillStyle = col;
  g.font = '700 62px "Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", "Meiryo", sans-serif';
  g.fillText(name, 48, 116);

  // コード + 状態
  g.font = '500 30px "Helvetica Neue", Arial, sans-serif';
  g.fillStyle = 'rgba(255,255,255,0.72)';
  g.fillText(code, 50, 158);

  if (status) {
    g.textAlign = 'right';
    g.fillStyle = col;
    g.font = '700 30px "Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", sans-serif';
    g.fillText(status, LABEL_W - 26, 158);
    g.textAlign = 'left';
  }

  // 下部の目盛
  g.strokeStyle = col;
  g.globalAlpha = 0.5;
  g.lineWidth = 2;
  for (let i = 0; i < 26; i++) {
    const x = 40 + i * 27;
    g.beginPath();
    g.moveTo(x, 182);
    g.lineTo(x, 182 + (i % 5 === 0 ? 14 : 7));
    g.stroke();
  }
  g.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = labelAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

const beamVert = /* glsl */ `
varying float vY;
void main() {
  vY = uv.y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const beamFrag = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;
varying float vY;
void main() {
  float fade = pow(1.0 - vY, 1.4);
  float pulse = 0.65 + 0.35 * sin(uTime * 2.4 - vY * 9.0);
  gl_FragColor = vec4(uColor, fade * pulse * uOpacity);
}
`;

/**
 * @param {object} o
 * @param {string} o.name  日本語名称
 * @param {string} o.code  識別コード
 * @param {string} [o.status] 状態表示
 * @param {{x:number,z:number}} o.pos
 * @param {keyof FACTION} o.faction
 * @param {number} [o.height]  銘板の高さ (world unit)
 * @param {number} [o.ring]    接地リング半径
 * @param {number} [o.y]       設置高さを直接指定 (地下構造物用)
 */
export function createMarker(o) {
  const f = FACTION[o.faction] || FACTION.NERV;
  const color = new THREE.Color(f.color);
  const group = new THREE.Group();
  group.name = 'marker:' + o.code;

  const fixedY = o.y != null;
  const gy = fixedY ? o.y : surfaceY(o.pos.x, o.pos.z);
  const ringR = o.ring ?? 2.2;
  const labelH = o.height ?? 8;

  group.position.set(o.pos.x, gy, o.pos.z);

  // --- 接地リング -----------------------------------------------------------
  const ringMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(ringR * 0.86, ringR, 64), ringMat);
  const ringLift = Math.max(0.015, ringR * 0.045);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = ringLift;
  group.add(ring);

  // 破線状の外周 (回転させる) — 4本の円弧で構成
  const dashMat = ringMat.clone();
  dashMat.opacity = 0.7;
  const dash = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const arc = new THREE.Mesh(
      new THREE.RingGeometry(ringR * 1.16, ringR * 1.26, 20, 1, (i * Math.PI) / 2, Math.PI / 3),
      dashMat
    );
    dash.add(arc);
  }
  dash.rotation.x = -Math.PI / 2;
  dash.position.y = ringLift * 1.15;
  group.add(dash);

  // 拡散パルス (大きなリングでは控えめに)
  const pulseMat = ringMat.clone();
  const pulseSpan = ringR > 6 ? 0.55 : 1.6;
  const pulse = new THREE.Mesh(new THREE.RingGeometry(ringR * 0.96, ringR, 64), pulseMat);
  pulse.rotation.x = -Math.PI / 2;
  pulse.position.y = ringLift * 1.3;
  group.add(pulse);

  // --- 標定ビーム / 銘板の水平オフセット -------------------------------------
  // 大きなリングの中心に銘板を立てると他の表示と重なるため、
  // 引出線ごと水平にずらせるようにする。
  const off = o.labelOffset || [0, 0];
  const offY = fixedY ? 0 : surfaceY(o.pos.x + off[0], o.pos.z + off[1]) - gy;
  const stalk = new THREE.Group();
  stalk.position.set(off[0], offY, off[1]);
  group.add(stalk);

  if (off[0] !== 0 || off[1] !== 0) {
    const leader = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-off[0], -offY + 0.2, -off[1]),
        new THREE.Vector3(0, 0.2, 0),
      ]),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5, depthWrite: false })
    );
    stalk.add(leader);
  }

  const beamMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: color },
      uOpacity: { value: 0.5 },
      uTime: { value: 0 },
    },
    vertexShader: beamVert,
    fragmentShader: beamFrag,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const beamR = Math.min(ringR, 2.4);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(beamR * 0.10, beamR * 0.30, labelH, 12, 1, true), beamMat);
  beam.position.y = labelH / 2;
  stalk.add(beam);

  // --- 銘板 -----------------------------------------------------------------
  const tex = drawLabel(o.name, o.code, o.status || '', f.color, f.tag);
  const spriteMat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  const sw = o.labelScale ?? 9.5;
  sprite.scale.set(sw, (sw * LABEL_H) / LABEL_W, 1);
  sprite.position.y = labelH + ((sw * LABEL_H) / LABEL_W) * 0.42;
  sprite.center.set(0.5, 0.5);
  sprite.renderOrder = 20;
  stalk.add(sprite);

  let reveal = 0;
  let target = 0;
  let symbolFade = 1;

  group.userData = {
    faction: o.faction,
    setVisible(v) {
      target = v ? 1 : 0;
    },
    get reveal() {
      return reveal;
    },
    anchor: new THREE.Vector3(o.pos.x, gy, o.pos.z),
    /**
     * 銘板は「ほぼ一定の画面サイズ」を保つ。
     * 実寸のままだと寄りのカットで画面を覆い、俯瞰では読めなくなるため。
     */
    fitLabel(camera) {
      sprite.getWorldPosition(_wp);
      const d = camera.position.distanceTo(_wp);
      const viewH = 2 * d * Math.tan((camera.fov * Math.PI) / 360);
      // 画面比率で一定 (遠景で巨大化しないよう上限のみ設ける)
      const w = Math.min(sw * 1.25, Math.max(0.05, viewH * 0.145));
      sprite.scale.set(w, (w * LABEL_H) / LABEL_W, 1);
      sprite.position.y = labelH * reveal + ((w * LABEL_H) / LABEL_W) * 0.62;
      // 寄りのカットではシンボル (リング・標定ビーム) が実体を覆うので減衰させる
      const near = Math.min(1, Math.max(0, (d - 1.2) / 6));
      symbolFade = 0.12 + 0.88 * near;
      return d;
    },
    update(dt, t) {
      reveal += (target - reveal) * Math.min(1, dt * 4.5);
      const r = reveal;
      group.visible = r > 0.01;
      if (!group.visible) return;

      const sf = r * symbolFade;
      ringMat.opacity = 0.8 * sf;
      dashMat.opacity = 0.5 * sf;
      dash.rotation.z = t * 0.35;
      beamMat.uniforms.uOpacity.value = 0.18 * sf;
      beamMat.uniforms.uTime.value = t;
      beam.scale.y = r;
      beam.position.y = (labelH * r) / 2;

      const p = (t * 0.5) % 1;
      pulse.scale.setScalar(1 + p * pulseSpan);
      pulseMat.opacity = (1 - p) * 0.32 * sf;

      spriteMat.opacity = Math.max(0, (r - 0.35) / 0.65) * this.fade;
    },
    fade: 1,
    setStatus(status) {
      spriteMat.map.dispose();
      spriteMat.map = drawLabel(o.name, o.code, status, f.color, f.tag);
      spriteMat.needsUpdate = true;
    },
  };

  group.visible = false;
  return group;
}
