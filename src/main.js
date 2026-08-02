// ヤシマ作戦 3D 俯瞰デモ — エントリポイント
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { createTerrain } from './world/terrain.js';
import { createWater } from './world/water.js';
import { createCity, createGeofront } from './world/city.js';
import { createSky } from './world/sky.js';
import { createMarker } from './world/markers.js';
import { createArrow } from './world/arrows.js';
import {
  createRamiel, createEva, createPositronRifle, createShield,
  createBeam, createSightLine, createBlastPool,
} from './world/actors.js';
import { terrainY, surfaceY, M_PER_UNIT, VE } from './world/geo.js';
import { CameraDirector } from './director/camera.js';
import {
  CHAPTERS, CAMERA_KEYS, MARKERS, ARROWS, DURATION, T0, RAMIEL_Y, FIRE_POS, SHIELD_POS,
  applyTracks, buildEvents, chapterAt, captionAt, reservePower, powerConvergence, atField,
} from './director/script.js';
import { createHUD, createTitleCard } from './ui/hud.js';

// ---------------------------------------------------------------------------
// レンダラ
// ---------------------------------------------------------------------------

const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.NoToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = null;

const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.35, 2400);
camera.position.set(-14, 205, 315);

// ---------------------------------------------------------------------------
// ワールド構築
// ---------------------------------------------------------------------------

const sky = createSky();
scene.add(sky.mesh);

const terrain = createTerrain();
scene.add(terrain.mesh);

const water = createWater();
scene.add(water);

const city = createCity();
scene.add(city.mesh);

const geofront = createGeofront();
scene.add(geofront);

// 照明 (実体オブジェクトのみに作用)
scene.add(new THREE.HemisphereLight(0x3a5480, 0x0b1018, 1.35));
const moon = new THREE.DirectionalLight(0xbcd6ff, 1.9);
moon.position.set(-60, 90, -80);
scene.add(moon);
// 逆光のリム — 暗所でシルエットの輪郭を立たせる
const rim = new THREE.DirectionalLight(0xff9a52, 0.85);
rim.position.set(70, 26, -50);
scene.add(rim);
const cityFill = new THREE.PointLight(0xff9a40, 0, 90, 2);
cityFill.position.set(26, 20, 6);
scene.add(cityFill);

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
const ramiel = createRamiel(new THREE.Vector3(24, RAMIEL_Y, 2), 1.35);
scene.add(ramiel);

const fireGroundY = terrainY(FIRE_POS.x, FIRE_POS.z);
const headingToTarget = Math.atan2(ramiel.position.x - FIRE_POS.x, ramiel.position.z - FIRE_POS.z);

const eva01 = createEva('01', { x: FIRE_POS.x, y: fireGroundY, z: FIRE_POS.z }, headingToTarget);
scene.add(eva01);
const rifle = createPositronRifle();
rifle.scale.setScalar(0.80);            // 全長 約 23 m
rifle.position.set(0.048, 0.132, 0.020); // 右肩で保持
eva01.add(rifle);

const shieldGroundY = terrainY(SHIELD_POS.x, SHIELD_POS.z);
const eva00 = createEva(
  '00',
  { x: SHIELD_POS.x, y: shieldGroundY, z: SHIELD_POS.z },
  Math.atan2(ramiel.position.x - SHIELD_POS.x, ramiel.position.z - SHIELD_POS.z)
);
scene.add(eva00);
const shield = createShield();
shield.scale.setScalar(0.92);          // 直径 約 31 m
shield.position.set(0, 0.150, 0.125);
eva00.add(shield);

const beam = createBeam({ color: 0xd8f4ff, glow: 0x3f8bff, radius: 0.085 });
scene.add(beam);
const counterBeam = createBeam({ color: 0xffd9a0, glow: 0xff5a1e, radius: 0.075 });
scene.add(counterBeam);

const sightLine = createSightLine(0x2fd8ff);
scene.add(sightLine);

const blasts = createBlastPool(8);
scene.add(blasts);

// ---------------------------------------------------------------------------
// ポストプロセス
// ---------------------------------------------------------------------------

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.62, // strength
  0.52, // radius
  0.42 // threshold
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
orbit.maxPolarAngle = Math.PI * 0.495;
orbit.minDistance = 2;
orbit.maxDistance = 500;

const _v = new THREE.Vector3();

const ctx = {
  markers, arrows, ramiel, eva01, eva00, shield, rifle,
  beam, counterBeam, sightLine, blasts, geofront, director,
  terrainU: terrain.uniforms,
  waterU: water.userData.uniforms[0],
  cityU: city.uniforms,
  skyU: sky.uniforms,
  hud: null, // 後で差し込む
  getMuzzleWorld() {
    return rifle.userData.muzzle.getWorldPosition(new THREE.Vector3());
  },
  getShieldWorld() {
    return shield.getWorldPosition(new THREE.Vector3());
  },
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
  lastEventTime = time; // シーク直後の一過性演出は発火させない
  beam.userData.stop();
  counterBeam.userData.stop();
  applyTracks(time, ctx);
}

function setFreeCam(v) {
  freeCam = v;
  director.enabled = !v;
  orbit.enabled = v;
  if (v) {
    orbit.target.copy(director.lastTarget || new THREE.Vector3(0, 10, 0));
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
  bloom.setSize(w, h);
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

  cityFill.intensity = city.uniforms.uPower.value * 260;

  for (const m of markers.values()) {
    const d = m.userData.fitLabel(camera);
    // 遠すぎる銘板は画面が煩雑になるので減衰させる
    m.userData.fade = 1 - Math.min(1, Math.max(0, (d - 260) / 140));
    m.userData.update(dt, wall);
  }
  for (const a of arrows.values()) a.userData.update(dt, wall);

  ramiel.userData.update(dt, wall);
  beam.userData.update(dt, wall);
  counterBeam.userData.update(dt, wall);
  sightLine.userData.update(dt, wall);
  blasts.userData.update(dt);

  // 射線を毎フレーム更新 (砲口 → 目標)
  sightLine.userData.aim(ctx.getMuzzleWorld(), ramiel.position);

  // 発射中は砲口を目標へ追従
  if (beam.userData.firing) beam.userData.aim(ctx.getMuzzleWorld(), ramiel.position);

  // 陽電子砲コイルの充填発光
  const charge = powerConvergence(t) / 100;
  rifle.userData.coil.material.color.setRGB(0.20 + charge * 0.55, 0.50 + charge * 0.42, 0.85 + charge * 0.15);
  rifle.userData.coil.scale.setScalar(1 + charge * 0.12 * (0.8 + 0.2 * Math.sin(wall * 12)));
}

function projectTarget() {
  if (ramiel.userData.isDestroyed || !ramiel.visible) return null;
  _v.copy(ramiel.position).project(camera);
  if (_v.z > 1) return null;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dist = camera.position.distanceTo(ramiel.position);
  const px = (ramiel.userData.radius / dist) / Math.tan((camera.fov * Math.PI) / 360) * (h / 2);
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

  // 時刻から状態を決定
  applyTracks(time, ctx);

  // 一過性イベント
  if (time > lastEventTime) {
    for (const ev of events) {
      if (ev.t > lastEventTime && ev.t <= time) ev.run();
    }
    lastEventTime = time;
  }

  updateWorld(dt, time);

  if (freeCam) {
    orbit.update();
  } else {
    director.update(time, dt);
  }

  const ch = chapterAt(time);
  hud.update(
    {
      t: time,
      T0,
      chapter: ch,
      chapterIndex: CHAPTERS.indexOf(ch),
      caption: captionAt(time),
      reserve: reservePower(time),
      power: powerConvergence(time),
      at: atField(time),
      range: ctx.getMuzzleWorld().distanceTo(ramiel.position) * M_PER_UNIT,
      altitude: (ramiel.position.y / VE) * M_PER_UNIT,
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

createTitleCard(() => {
  started = true;
  playing = true;
  time = 0;
  lastEventTime = -1;
  hud.setPlaying(true);
  hud.pushLog('MAGI — 作戦記録 再生開始');
});

// 外部制御用フック (収録・検証時に使用)
window.YASHIMA = {
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
};

const loading = document.getElementById('loading');
if (loading) {
  requestAnimationFrame(() => loading.classList.add('gone'));
  setTimeout(() => loading.remove(), 800);
}
