// 箱根カルデラ〜第3新東京市 周辺の地形定義
//
// 座標系:  +X = 東 / +Z = 南 / +Y = 上
// 縮尺  :  1 world unit = 100 m
// 標高  :  メートルで計算し、垂直誇張 VE を掛けて world unit に変換する。
//          （俯瞰デモとして地形の起伏を読み取れるようにするための誇張。
//            水平距離・部隊間距離は実スケールのまま。）

import { fbm, ridged, smoothstep, clamp, mix } from './noise.js';

export const M_PER_UNIT = 100;
export const VE = 1.6; // 垂直誇張率
export const MAP_SIZE = 280; // 一辺 28 km
export const MAP_HALF = MAP_SIZE / 2;
export const TERRAIN_SEG = 384;

export const LAKE_ELEV = 723; // 芦ノ湖 水面標高 (m)
export const SEA_ELEV = 0;

export function mToY(m) {
  return (m / M_PER_UNIT) * VE;
}

export const LAKE_Y = mToY(LAKE_ELEV);
export const SEA_Y = mToY(SEA_ELEV);

// ---------------------------------------------------------------------------
// 主要地点 (world units)
// ---------------------------------------------------------------------------

export const PLACES = {
  calderaCenter: { x: 0, z: 0 },
  kamiyama: { x: 2, z: -4 },       // 神山 1438 m
  komagatake: { x: -10, z: 4 },    // 駒ヶ岳 1356 m
  futagoyama: { x: 0, z: 26 },     // 二子山 1099 m  ← 陽電子砲 射撃陣地
  souNzan: { x: 12, z: -10 },      // 早雲山
  myojin: { x: 30, z: -20 },       // 明神ヶ岳
  kintoki: { x: -28, z: -24 },     // 金時山
  owakudani: { x: -2, z: -8 },     // 大涌谷
  sengokuhara: { x: -18, z: -16 }, // 仙石原 — 戦略自衛隊 前線指揮所
  tokyo3: { x: 26, z: 6 },         // 第3新東京市
  fuji: { x: -95, z: -80 },        // 富士山
  substation: { x: 46, z: 30 },    // 特設変電所 (全国送電の集約点)
  gotemba: { x: -46, z: -44 },     // 御殿場 方面 補給集結地
  odawara: { x: 62, z: 22 },       // 小田原 方面 港湾/鉄道
};

export const CITY_RADIUS = 11;
export const CITY_ELEV = 800; // 第3新東京市 地表標高 (m)

// 芦ノ湖 (北西—南東方向の細長い湖)
const LAKE = {
  cx: -22,
  cz: 14,
  ax: Math.SQRT1_2, // 長軸方向 (南東向き)
  az: Math.SQRT1_2,
  a: 26, // 半長軸
  b: 6,  // 半短軸
};

function lakeSDF(x, z) {
  const px = x - LAKE.cx;
  const pz = z - LAKE.cz;
  const u = px * LAKE.ax + pz * LAKE.az;
  const v = -px * LAKE.az + pz * LAKE.ax;
  return Math.hypot(u / LAKE.a, v / LAKE.b); // <1 で湖内
}

export function lakeMask(x, z) {
  // 1 = 水面, 0 = 陸
  return 1 - smoothstep(0.92, 1.02, lakeSDF(x, z));
}

// 海岸線: 北東—南西に走る線より海側 (相模湾) が海
function coastDistance(x, z) {
  const base = x * 0.8 + z * 0.6 - 84;
  const wob = fbm(x * 0.012 + 31.7, z * 0.012 - 12.3, 4) * 11;
  return base + wob;
}

// ---------------------------------------------------------------------------
// 標高関数
// ---------------------------------------------------------------------------

const PEAKS = [
  { x: 2, z: -4, h: 1438, r: 15, s: 1.7 },   // 神山
  { x: -10, z: 4, h: 1356, r: 11.5, s: 1.7 }, // 駒ヶ岳
  { x: 0, z: 26, h: 1099, r: 8.5, s: 1.6 },   // 二子山
  { x: 12, z: -10, h: 1153, r: 8, s: 1.7 },   // 早雲山
  { x: -4, z: -12, h: 1200, r: 9, s: 1.8 },   // 冠ヶ岳
  { x: 30, z: -20, h: 1169, r: 14, s: 1.5 },  // 明神ヶ岳 (外輪)
  { x: -28, z: -24, h: 1212, r: 13, s: 1.5 }, // 金時山 (外輪)
  { x: 40, z: 14, h: 1010, r: 14, s: 1.4 },   // 明星ヶ岳〜塔ノ峰 (外輪)
  { x: -34, z: 30, h: 1030, r: 13, s: 1.4 },  // 三国山 (外輪)
];

function calderaProfile(r) {
  // r: カルデラ正規化半径
  if (r < 0.72) return 782 + 26 * Math.cos((r / 0.72) * Math.PI);
  if (r < 1.0) return mix(756, 1055, smoothstep(0.72, 1.0, r));
  if (r < 1.5) return mix(1055, 380, smoothstep(1.0, 1.5, r));
  return mix(380, 210, smoothstep(1.5, 2.4, r));
}

function outerLand(x, z) {
  const h = 260 + fbm(x * 0.018 + 5.1, z * 0.018 - 8.4, 5) * 190;
  const hills = ridged(x * 0.045 - 2.2, z * 0.045 + 6.6, 4) * 150;
  return h + hills;
}

function fujiCone(x, z) {
  const d = Math.hypot(x - PLACES.fuji.x, z - PLACES.fuji.z);
  const R = 46;
  if (d > R) return 0;
  const t = 1 - d / R;
  // 上部は急、裾野はなだらか — 富士型のプロファイル
  return 3776 * Math.pow(t, 1.45) * (0.82 + 0.18 * Math.pow(t, 0.35));
}

/** 標高 (メートル) */
export function elevationM(x, z) {
  const r = Math.hypot(x / 52, z / 44);

  let h = calderaProfile(r);

  // 外輪の外側は一般地形へブレンド
  const outMix = smoothstep(1.35, 1.9, r);
  h = mix(h, outerLand(x, z), outMix);

  // 中央火口丘群・外輪山ピーク
  for (const p of PEAKS) {
    const d = Math.hypot(x - p.x, z - p.z) / p.r;
    if (d < 1) {
      const t = Math.pow(1 - d * d, p.s);
      h += (p.h - 790) * t;
    }
  }

  // 富士山
  const fj = fujiCone(x, z);
  if (fj > 0) h = Math.max(h, 240 + fj * 0.94);

  // 細部ノイズ (山地ほど強く)
  const relief = clamp((h - 200) / 900, 0, 1);
  h += fbm(x * 0.09 + 17.3, z * 0.09 - 4.9, 5) * (26 + 62 * relief);
  h += (ridged(x * 0.22 - 9.1, z * 0.22 + 3.3, 3) - 0.5) * (14 + 46 * relief);

  // 芦ノ湖 湖盆
  const L = lakeSDF(x, z);
  if (L < 1.35) {
    const bed = LAKE_ELEV - 62 * (1 - clamp(L, 0, 1));
    h = mix(h, bed, smoothstep(1.3, 0.88, L));
  }

  // 第3新東京市 の造成面
  const dCity = Math.hypot(x - PLACES.tokyo3.x, z - PLACES.tokyo3.z) / (CITY_RADIUS * 1.35);
  if (dCity < 1.1) {
    h = mix(h, CITY_ELEV, smoothstep(1.05, 0.6, dCity));
  }

  // 相模湾
  const cd = coastDistance(x, z);
  if (cd > -14) {
    const seaFloor = -40 - Math.max(0, cd) * 4.2;
    h = mix(h, seaFloor, smoothstep(-14, 12, cd));
  }

  return h;
}

/** 接地高さ (world unit) */
export function terrainY(x, z) {
  return mToY(elevationM(x, z));
}

/** 地表法線 (陰影・接地姿勢用) */
export function terrainNormal(x, z, eps = 0.8) {
  const hL = terrainY(x - eps, z);
  const hR = terrainY(x + eps, z);
  const hD = terrainY(x, z - eps);
  const hU = terrainY(x, z + eps);
  const nx = hL - hR;
  const nz = hD - hU;
  const ny = 2 * eps;
  const len = Math.hypot(nx, ny, nz);
  return { x: nx / len, y: ny / len, z: nz / len };
}

/** 水面(湖/海)を考慮した「見かけの地表」高さ — マーカー設置用 */
export function surfaceY(x, z) {
  const g = terrainY(x, z);
  if (lakeMask(x, z) > 0.5) return Math.max(g, LAKE_Y);
  return Math.max(g, SEA_Y);
}
