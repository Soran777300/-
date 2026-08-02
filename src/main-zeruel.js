// 第10使徒 ゼルエル — ネルフ本部 侵攻戦 / 3D 俯瞰デモ エントリポイント
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { createTerrain } from './world/terrain.js';
import { createWater } from './world/water.js';
import { createCity } from './world/city.js';
import { createSky } from './world/sky.js';
import { createMarker, setLabelAnisotropy } from './world/markers.js';
import { createArrow } from './world/arrows.js';
import {
  createEva, createPalletRifle, createN2Mine, createBerserkAura, createBlastPool,
} from './world/actors.js';
import { createZeruel } from './world/zeruel.js';
import { createDogma, DECK_Y, SHAFT_BOTTOM_Y, CITY, depthM } from './world/dogma.js';
import { terrainY, surfaceY, M_PER_UNIT, VE } from './world/geo.js';
import { CameraDirector } from './director/camera.js';
import {
  CHAPTERS, CAMERA_KEYS, MARKERS, ARROWS, DURATION, T0, ANGEL_H, EVA01_STAND,
  EVA02_TRACK, EVA00_TRACK,
  applyTracks, buildEvents, chapterAt, captionAt, angelAt,
  reservePower, bulkheads, atField, forces, penetrationM,
} from './director/script-zeruel.js';
import { createHUD, createTitleCard } from './ui/hud.js';
import { QUALITY, IS_TOUCH } from './quality.js';

// ---------------------------------------------------------------------------
// HUD 定義 (この作戦の計器)
// ---------------------------------------------------------------------------

const DEPTH_MAX = depthM(SHAFT_BOTTOM_Y);

const fmtM = (v) => Math.round(v).toLocaleString('en-US');

const HUD_CONFIG = {
  opName: '第10使徒 迎撃戦',
  opEn: 'THE 10TH ANGEL — ASSAULT ON NERV HQ',
  code: 'CODE No.1670055',
  clockLabel: 'PENETRATION TIME',
  plug: {
    title: 'RESERVE ENERGY REMAINING',
    sub: 'EVA-01 : ENTRY PLUG',
    // 活動限界 4分59秒 を残量から逆算して表示する
    value: (s) => {
      const sec = Math.round((s.reserve / 100) * 299);
      return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
    },
  },
  gauge: {
    ja: '侵攻深度',
    en: 'PENETRATION DEPTH',
    text: (s) => fmtM(s.depth),
    unit: 'm',
    fill: (s) => (s.depth / DEPTH_MAX) * 100,
    subL: 'SURFACE 0 m',
    subR: `C.DOGMA ${fmtM(DEPTH_MAX)} m`,
  },
  reticle: 'TARGET LOCK<br>PATTERN BLUE',
  dead: (s) => s.at <= 0.5,
  targetRows: [
    { dt: '目標', dd: () => '第10使徒 ゼルエル' },
    { dt: 'パターン', dd: (s, dead) => (dead ? '反応 消失' : '青 / BLUE'), warn: (s, dead) => dead },
    { dt: 'ATフィールド', dd: (s, dead) => (dead ? '0 %' : s.at.toFixed(0) + ' %') },
    {
      dt: '目標位置',
      dd: (s, dead) =>
        dead ? '—' : s.depth > 1 ? '地下 ' + fmtM(s.depth) + ' m' : '高度 ' + fmtM(s.altitude) + ' m',
    },
    { dt: '本部まで', dd: (s, dead) => (dead ? '—' : fmtM(s.range) + ' m') },
    { dt: '隔壁', dd: (s) => `突破 ${Math.floor(s.bulk)} / 17`, warn: (s) => s.bulk >= 7 },
    { dt: '迎撃兵力', dd: (s) => s.forces.toFixed(0) + ' %', warn: (s) => s.forces < 30 },
  ],
  orgs: [
    {
      name: '特務機関ネルフ', code: 'NERV / SPECIAL AGENCY',
      phases: [[0, '第1種警戒', 'st-work'], [24, '戦闘配置', 'st-active'], [204, '本部防衛', 'st-active'], [351, '収束', 'st-done']],
    },
    {
      name: '戦略自衛隊', code: 'JSSDF / STRATEGIC SDF',
      phases: [[0, '待機', 'st-standby'], [52, '展開', 'st-work'], [76, '交戦', 'st-active'], [104, '損耗', 'st-standby'], [351, '収容', 'st-done']],
    },
    {
      name: '国連軍 航空隊', code: 'UN AIR WING',
      phases: [[0, '待機', 'st-standby'], [62, '進入', 'st-work'], [84, 'N2投下', 'st-active'], [106, '撤収', 'st-standby'], [351, '解除', 'st-done']],
    },
    {
      name: '防衛庁 統合幕僚', code: 'JDA / JOINT STAFF',
      phases: [[0, '待機', 'st-standby'], [24, '調整', 'st-work'], [52, '指揮移譲', 'st-active'], [351, '解除', 'st-done']],
    },
    {
      name: '首相官邸', code: 'CABINET CRISIS CTR.',
      phases: [[0, '待機', 'st-standby'], [52, '非常事態宣言', 'st-active'], [204, '待避', 'st-work'], [351, '報告', 'st-done']],
    },
    {
      name: '内務省 / 警備局', code: 'HOME AFFAIRS — CIVIL DEF.',
      phases: [[0, '待機', 'st-standby'], [54, '避難誘導', 'st-work'], [76, '退避完了', 'st-active'], [351, '解除', 'st-done']],
    },
    {
      name: '運輸省', code: 'MOT / TRANSPORT',
      phases: [[0, '待機', 'st-standby'], [54, '経路封鎖', 'st-work'], [76, '維持', 'st-active'], [351, '解除', 'st-done']],
    },
    {
      name: '気象庁', code: 'JMA / METEOROLOGY',
      phases: [[0, '観測', 'st-work'], [22, '監視', 'st-active'], [351, '平常', 'st-done']],
    },
  ],
};

// ---------------------------------------------------------------------------
// レンダラ
// ---------------------------------------------------------------------------

const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, QUALITY.maxPixelRatio));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.NoToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.3, 2400);
camera.position.set(-52, 215, 300);

// ---------------------------------------------------------------------------
// ワールド構築
// ---------------------------------------------------------------------------

const sky = createSky();
scene.add(sky.mesh);

setLabelAnisotropy(QUALITY.anisotropy);

const terrain = createTerrain(QUALITY.terrainSeg);
scene.add(terrain.mesh);
terrain.uniforms.uCutCenter.value.set(CITY.x, 0, CITY.z);
terrain.uniforms.uCutRadius.value = 13.5;

const water = createWater({ seaSeg: QUALITY.seaSeg, lakeSeg: QUALITY.lakeSeg });
scene.add(water);

const city = createCity();
scene.add(city.mesh);
city.uniforms.uCutCenter.value.set(CITY.x, 0, CITY.z);
city.uniforms.uCutRadius.value = 13.5;

const dogma = createDogma();
scene.add(dogma);

// --- 照明 -------------------------------------------------------------------
scene.add(new THREE.HemisphereLight(0x3a5480, 0x0b1018, 1.30));
const moon = new THREE.DirectionalLight(0xbcd6ff, 1.85);
moon.position.set(-60, 90, -80);
scene.add(moon);
const rim = new THREE.DirectionalLight(0xff9a52, 0.9);
rim.position.set(70, 26, -50);
scene.add(rim);
// ジオフロント内の作業灯 — 地下カットで実体が沈まないように起こす
const geoFill = new THREE.PointLight(0xffb877, 0, 60, 2);
geoFill.position.set(CITY.x, DECK_Y + 2.6, CITY.z);
scene.add(geoFill);

// --- マーカー ---------------------------------------------------------------
const markers = new Map();
for (const def of MARKERS) {
  const m = createMarker(def);
  markers.set(def.id, m);
  scene.add(m);
}

// --- 矢印 -------------------------------------------------------------------
const arrows = new Map();
for (const def of ARROWS) {
  const a = createArrow(def);
  arrows.set(def.id, a);
  scene.add(a);
}

// --- 実体 -------------------------------------------------------------------
const angel = createZeruel(angelAt(0, new THREE.Vector3()), ANGEL_H, QUALITY.ramielFrags);
scene.add(angel);

/** トラックの先頭位置 (実体の初期配置) */
function head(track) {
  const [x, y, z] = track[0][1];
  return { x, y, z };
}

const eva02 = createEva('02', head(EVA02_TRACK), Math.PI * 0.9, 'stand');
scene.add(eva02);
const rifle = createPalletRifle();
rifle.scale.setScalar(0.92);
rifle.position.set(0.040, 0.156, 0.052);
eva02.add(rifle);

const eva00 = createEva('00', head(EVA00_TRACK), Math.PI * 0.9, 'stand');
scene.add(eva00);
const mine = createN2Mine();
mine.scale.setScalar(0.9);
mine.position.set(0, 0.205, 0.070);
mine.rotation.x = 0.35;
eva00.add(mine);

const eva01 = createEva('01', { x: EVA01_STAND.x, y: DECK_Y, z: EVA01_STAND.z }, 0, 'stand');
scene.add(eva01);

const aura = createBerserkAura(0.26);
scene.add(aura);

const blasts = createBlastPool(QUALITY.blastCount);
scene.add(blasts);

// ---------------------------------------------------------------------------
// ポストプロセス
// ---------------------------------------------------------------------------

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth * QUALITY.bloomScale, window.innerHeight * QUALITY.bloomScale),
  QUALITY.bloomStrength,
  0.52,
  0.42
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------------------------------------------------------------------------
// 演出制御
// ---------------------------------------------------------------------------

const director = new CameraDirector(camera, CAMERA_KEYS);
director.minClearance = 0.5;

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enabled = false;
orbit.enableDamping = true;
orbit.dampingFactor = 0.06;
orbit.minDistance = 1.5;
orbit.maxDistance = 500;

const _v = new THREE.Vector3();
const _apex = new THREE.Vector3(CITY.x, DECK_Y, CITY.z);

const ctx = {
  markers, arrows, angel, eva01, eva00, eva02, rifle, mine, aura,
  dogma, director, camera, blasts,
  terrainU: terrain.uniforms,
  waterU: water.userData.uniforms[0],
  cityU: city.uniforms,
  skyU: sky.uniforms,
  hud: null,
  blastAt(x, z, size, life, y) {
    blasts.userData.fire(new THREE.Vector3(x, y ?? surfaceY(x, z), z), size, life);
  },
};

// ---------------------------------------------------------------------------
// 再生制御
// ---------------------------------------------------------------------------

let time = 0;
let playing = false;
let speed = 1;
let started = false;
let lastEventTime = -1;
let freeCam = false;

const events = buildEvents(ctx).sort((a, b) => a.t - b.t);

const hud = createHUD({
  duration: DURATION,
  chapters: CHAPTERS,
  touch: IS_TOUCH,
  config: HUD_CONFIG,
  onTogglePlay() {
    playing = !playing;
    hud.setPlaying(playing);
  },
  onSpeed(s) {
    speed = s;
  },
  onSeek(v, relative) {
    seek(relative ? time + v : v);
  },
  onRestart() {
    seek(0);
    playing = true;
    hud.setPlaying(true);
  },
  onToggleFree() {
    setFreeCam(!freeCam);
  },
});
ctx.hud = hud;

function seek(t) {
  const nt = Math.min(DURATION, Math.max(0, t));
  if (nt < time) hud.clearLog();
  time = nt;
  lastEventTime = time;
  applyTracks(time, ctx);
}

function setFreeCam(v) {
  freeCam = v;
  director.enabled = !v;
  orbit.enabled = v;
  if (v) {
    orbit.target.copy(director.lastTarget || new THREE.Vector3(CITY.x, 10, CITY.z));
    orbit.update();
  }
  hud.setFree(v);
}

window.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return;
  switch (e.code) {
    case 'Space':
      e.preventDefault();
      playing = !playing;
      hud.setPlaying(playing);
      break;
    case 'ArrowLeft':
      seek(time - 10);
      break;
    case 'ArrowRight':
      seek(time + 10);
      break;
    case 'KeyF':
      setFreeCam(!freeCam);
      break;
    case 'KeyH':
      hud.toggleHud();
      break;
    default:
      if (/^Digit[1-9]$/.test(e.code)) {
        const i = parseInt(e.code.slice(5), 10) - 1;
        if (CHAPTERS[i]) seek(CHAPTERS[i].t + 0.01);
      }
  }
});

window.addEventListener('resize', () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  bloom.setSize(w * QUALITY.bloomScale, h * QUALITY.bloomScale);
});

// ---------------------------------------------------------------------------
// 更新ループ
// ---------------------------------------------------------------------------

const clock = new THREE.Clock();

function updateWorld(dt, t) {
  const wall = clock.elapsedTime;

  terrain.uniforms.uTime.value = wall;
  water.userData.uniforms[0].uTime.value = wall;
  city.uniforms.uTime.value = wall;
  sky.uniforms.uTime.value = wall;

  for (const m of markers.values()) {
    const d = m.userData.fitLabel(camera);
    m.userData.fade = 1 - Math.min(1, Math.max(0, (d - 260) / 140));
    m.userData.update(dt, wall);
  }
  for (const a of arrows.values()) a.userData.update(dt, wall);

  angel.userData.update(dt, wall);
  eva01.userData.update(dt, wall);
  eva00.userData.update(dt, wall);
  eva02.userData.update(dt, wall);
  aura.userData.update(dt, wall);
  dogma.userData.update(dt, wall);
  blasts.userData.update(dt);

  // ジオフロント内の作業灯は断面表示中だけ効かせる
  geoFill.intensity = terrain.uniforms.uCutAmount.value * 22;
}

function projectTarget() {
  if (angel.userData.isDestroyed || !angel.visible) return null;
  _v.copy(angel.position).project(camera);
  if (_v.z > 1) return null;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dist = camera.position.distanceTo(angel.position);
  const px = (angel.userData.radius / dist) / Math.tan((camera.fov * Math.PI) / 360) * (h / 2);
  return {
    x: (_v.x * 0.5 + 0.5) * w,
    y: (-_v.y * 0.5 + 0.5) * h,
    scale: Math.min(3.2, Math.max(0.35, (px * 2.1) / 95)),
  };
}

function render() {
  requestAnimationFrame(render);
  const dt = Math.min(0.05, clock.getDelta());

  if (started && playing) {
    time += dt * speed;
    if (time >= DURATION) {
      time = DURATION;
      playing = false;
      hud.setPlaying(false);
    }
  }

  applyTracks(time, ctx);

  if (time > lastEventTime) {
    for (const ev of events) {
      if (ev.t > lastEventTime && ev.t <= time) ev.run();
    }
    lastEventTime = time;
  }

  updateWorld(dt, time);

  if (freeCam) orbit.update();
  else director.update(time, dt);

  const ch = chapterAt(time);
  const depth = penetrationM(time, angel.position);
  hud.update(
    {
      t: time,
      T0,
      chapter: ch,
      chapterIndex: CHAPTERS.indexOf(ch),
      caption: captionAt(time),
      reserve: reservePower(time),
      at: atField(time),
      depth,
      bulk: bulkheads(time),
      forces: forces(time),
      range: angel.position.distanceTo(_apex) * M_PER_UNIT,
      altitude: Math.max(0,
        ((angel.position.y - ANGEL_H * 0.5 - terrainY(angel.position.x, angel.position.z)) / VE) * M_PER_UNIT),
      camAlt: Math.max(0, (camera.position.y / VE) * M_PER_UNIT),
      targetScreen: projectTarget(),
    },
    dt
  );

  composer.render();
}

// ---------------------------------------------------------------------------
// 起動
// ---------------------------------------------------------------------------

applyTracks(0, ctx);
director.update(0, 0);
render();

createTitleCard(
  () => {
    started = true;
    playing = true;
    time = 0;
    lastEventTime = -1;
    hud.setPlaying(true);
    hud.pushLog('MAGI — 作戦記録 再生開始');
  },
  {
    menu: 'Menu 2-36',
    code: 'Code No.1670055',
    title: '第10使徒 迎撃戦',
    sub: 'ネルフ本部 侵攻 — 3D 俯瞰 作戦記録',
    note: 'THE 10TH ANGEL "ZERUEL" — ASSAULT ON NERV HQ / 3D OVERHEAD RECONSTRUCTION',
    back: './index.html',
  }
);

window.ZERUEL = {
  seek: (t) => {
    started = true;
    seek(t);
  },
  play: () => {
    started = true;
    playing = true;
    hud.setPlaying(true);
  },
  pause: () => {
    playing = false;
    hud.setPlaying(false);
  },
  setSpeed: (s) => {
    speed = s;
  },
  freeCam: setFreeCam,
  get time() {
    return time;
  },
  scene,
  camera,
  ctx,
  THREE,
};

const loading = document.getElementById('loading');
if (loading) {
  requestAnimationFrame(() => loading.classList.add('gone'));
  setTimeout(() => loading.remove(), 800);
}
