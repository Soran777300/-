// ヤシマ作戦 — 進行台本
// 状態はすべて「時刻の関数」として定義する。これによりスクラブ(時間の巻き戻し)
// でも表示が完全に再現される。一過性の演出 (発射・爆発・カメラ衝撃) のみ
// EVENTS としてエッジ検出で発火させる。

import * as THREE from 'three';
import { PLACES, terrainY, surfaceY } from '../world/geo.js';

export const T0 = 176; // 第一射 発射時刻 (T-0)
export const DURATION = 246;

// ---------------------------------------------------------------------------
// 章
// ---------------------------------------------------------------------------

export const CHAPTERS = [
  { t: 0, id: 'title', ja: 'ヤシマ作戦', en: 'OPERATION YASHIMA' },
  { t: 14, id: 'sitrep', ja: '状況', en: 'SITUATION' },
  { t: 40, id: 'plan', ja: '作戦立案', en: 'OPERATION PLAN' },
  { t: 66, id: 'power', ja: '全国送電', en: 'POWER CONVERGENCE' },
  { t: 102, id: 'logi', ja: '兵站', en: 'LOGISTICS' },
  { t: 134, id: 'deploy', ja: '布陣', en: 'DEPLOYMENT' },
  { t: 162, id: 'fire', ja: '第一射', en: 'FIRST SHOT' },
  { t: 196, id: 'second', ja: '第二射', en: 'SECOND SHOT' },
  { t: 222, id: 'complete', ja: '作戦完了', en: 'OPERATION COMPLETE' },
];

// ---------------------------------------------------------------------------
// 字幕
// ---------------------------------------------------------------------------

export const CAPTIONS = [
  { t: 2.5, d: 5.5, ja: '西暦2015年 — 第5の使徒、襲来', en: '2015 A.D. / 5TH ANGEL — INBOUND' },
  { t: 8.2, d: 5.0, ja: '箱根カルデラ 第3新東京市 上空', en: 'HAKONE CALDERA — TOKYO-3 AIRSPACE' },
  { t: 15.5, d: 5.5, ja: '目標 — 第5使徒 ラミエル', en: 'TARGET / 5TH ANGEL "RAMIEL"' },
  { t: 22, d: 5.5, ja: '第3新東京市 全区画 特殊防護態勢へ移行', en: 'TOKYO-3 — ALL SECTORS TO HARDENED STATE' },
  { t: 29, d: 6.0, ja: '在来兵器による攻撃は全て無効', en: 'CONVENTIONAL ORDNANCE — NO EFFECT' },
  { t: 35.5, d: 4.0, ja: 'ATフィールドが中和されない限り', en: 'A.T. FIELD MUST BE NEUTRALIZED FIRST' },
  { t: 41.5, d: 5.0, ja: '作戦名 — ヤシマ作戦', en: 'CODENAME / OPERATION YASHIMA' },
  { t: 47.5, d: 6.0, ja: '陽電子砲による超長距離狙撃', en: 'POSITRON RIFLE — ULTRA LONG RANGE SNIPE' },
  { t: 54.5, d: 5.5, ja: '射距離 3,100 m — 射撃位置 二子山', en: 'RANGE 3,100 m / FIRING POS. FUTAGOYAMA' },
  { t: 60.5, d: 5.0, ja: '射撃機会は一度きり', en: 'ONE SHOT — NO SECOND CHANCE GUARANTEED' },
  { t: 67.5, d: 5.5, ja: '日本全国の電力を一点に集中する', en: 'NATIONWIDE POWER — CONVERGED TO ONE POINT' },
  { t: 74, d: 6.0, ja: '通商産業省・電力会社連合 — 系統切替開始', en: 'MITI + UTILITIES — GRID RECONFIGURATION' },
  { t: 82, d: 6.0, ja: '第2種戦時特例 — 民生電力 全面停止', en: 'WARTIME CLAUSE II — CIVIL POWER SUSPENDED' },
  { t: 90, d: 6.0, ja: '総供給 180億kW / 変換効率 8.7%', en: 'SUPPLY 18.0 TW / CONVERSION 8.7 %' },
  { t: 96.5, d: 4.5, ja: '特設変電所 芦ノ湖東 — 昇圧完了', en: 'SUBSTATION 04 — STEP-UP COMPLETE' },
  { t: 103.5, d: 6.0, ja: '戦略自衛隊 — 陽電子砲を松代基地より空輸', en: 'JSSDF — POSITRON RIFLE AIRLIFT FROM MATSUSHIRO' },
  { t: 111, d: 6.0, ja: '特殊装甲板 — 富士 第1補給処より陸送', en: 'ARMOR PLATE — GROUND CONVOY FROM FUJI DEPOT' },
  { t: 118.5, d: 6.0, ja: '運輸省・建設省 — 輸送経路 全面封鎖', en: 'MOT + MOC — ALL ROUTES SEALED' },
  { t: 125.5, d: 5.5, ja: '予備電源車 42両 — 小田原より進出', en: '42 MOBILE GENERATORS — FROM ODAWARA' },
  { t: 135.5, d: 5.5, ja: '初号機 — 射撃地点 二子山に展開', en: 'EVA-01 — DEPLOYED TO FIRING POSITION' },
  { t: 142, d: 6.0, ja: '零号機 — 特殊装甲板をもって前方遮蔽', en: 'EVA-00 — FORWARD SHIELD IN POSITION' },
  { t: 149.5, d: 5.0, ja: '射撃諸元 — 入力完了', en: 'FIRING SOLUTION — LOCKED' },
  { t: 155.5, d: 4.5, ja: '全機 配置完了', en: 'ALL UNITS IN POSITION' },
  { t: 163.5, d: 5.5, ja: '初号機 内部電源に切替', en: 'EVA-01 — SWITCHING TO INTERNAL POWER' },
  { t: 170, d: 4.0, ja: 'カウント 開始', en: 'COUNTDOWN INITIATED' },
  { t: 177.5, d: 4.0, ja: '発射', en: 'FIRE' },
  { t: 181, d: 5.0, ja: '命中せず — 目標、軌道を偏向', en: 'MISS / TARGET DEFLECTED THE BEAM' },
  { t: 186.5, d: 5.5, ja: '零号機 被弾 — 装甲板 融解開始', en: 'EVA-00 HIT / ARMOR PLATE MELTING' },
  { t: 192.5, d: 4.0, ja: '砲身 冷却 — 再充填 開始', en: 'BARREL COOLING / RECHARGE' },
  { t: 197.5, d: 5.5, ja: '再送電 — 第二射 用意', en: 'POWER RESTORED / SECOND SHOT STANDBY' },
  { t: 204.5, d: 3.5, ja: '照準 再設定', en: 'RE-ACQUIRING TARGET' },
  { t: 209.5, d: 3.5, ja: '命中', en: 'DIRECT HIT' },
  { t: 213, d: 5.0, ja: '目標 沈黙 — 反応 消失', en: 'TARGET SILENT / PATTERN BLUE LOST' },
  { t: 218.5, d: 4.0, ja: '第5使徒 殲滅', en: '5TH ANGEL — ANNIHILATED' },
  { t: 224, d: 5.5, ja: 'ヤシマ作戦 — 完了', en: 'OPERATION YASHIMA — COMPLETE' },
  { t: 231, d: 6.5, ja: '損害 — 零号機 中破 / 初号機 軽微 / 市街 損害なし', en: 'DAMAGE: EVA-00 MODERATE / EVA-01 MINOR / CITY NONE' },
  { t: 239, d: 6.0, ja: '全電力を、この一撃に。', en: 'ALL THE POWER OF A NATION — INTO ONE SHOT.' },
];

// ---------------------------------------------------------------------------
// カメラ
// ---------------------------------------------------------------------------

export const CAMERA_KEYS = [
  { t: 0, pos: [-14, 205, 315], target: [0, 10, 0], fov: 30, handheld: 0.35, ease: 'easeInOutSoft' },
  { t: 14, pos: [46, 128, 210], target: [10, 12, 6], fov: 30, handheld: 0.6 },

  { t: 22, pos: [74, 50, 54], target: [24, 18, 2], fov: 28, handheld: 0.9 },
  { t: 34, pos: [-4, 36, 44], target: [24, 19, 2], fov: 26, handheld: 1.0 },
  { t: 40, pos: [-36, 44, 22], target: [24, 18, 4], fov: 30, handheld: 0.8 },

  { t: 50, pos: [18, 100, 74], target: [13, 12, 16], fov: 30, handheld: 0.5 },
  { t: 60, pos: [-26, 92, 80], target: [13, 12, 16], fov: 30, handheld: 0.5 },
  { t: 66, pos: [-44, 116, 116], target: [8, 10, 12], fov: 32, handheld: 0.5 },

  { t: 78, pos: [-34, 250, 290], target: [6, 6, 8], fov: 34, handheld: 0.35 },
  { t: 90, pos: [76, 158, 182], target: [40, 8, 26], fov: 30, handheld: 0.5 },
  { t: 102, pos: [50, 74, 86], target: [44, 12, 28], fov: 30, handheld: 0.7 },

  // 補給路を斜め後方から追う (松代→御殿場→仙石原→二子山)
  { t: 112, pos: [46, 88, 70], target: [-20, 10, -16], fov: 32, handheld: 0.8 },
  { t: 122, pos: [22, 58, 50], target: [-8, 12, 4], fov: 30, handheld: 0.9 },
  { t: 132, pos: [-14, 32, 34], target: [-2, 16, 22], fov: 30, handheld: 0.9 },

  // --- 射撃陣地 (二子山) 寄り
  //     EVA 全高 40 m = 0.40 unit。実寸のまま画面に収めるため、
  //     カメラは機体から 130〜700 m まで寄せる。
  { t: 142, pos: [-5.27, 19.7, 26.31], target: [1.70, 17.28, 24.95], fov: 30, handheld: 0.9 },
  { t: 152, pos: [-2.33, 18.60, 25.75], target: [1.65, 17.28, 25.00], fov: 27, handheld: 1.0 },
  { t: 162, pos: [-1.15, 18.04, 25.52], target: [1.65, 17.30, 25.00], fov: 26, handheld: 1.0 },
  { t: 172, pos: [-0.76, 17.89, 25.45], target: [1.70, 17.30, 24.95], fov: 25, handheld: 1.1 },
  { t: 176, pos: [-0.63, 18.10, 27.29], target: [7.18, 17.60, 19.27], fov: 27, handheld: 1.2 },

  { t: 179, pos: [36, 32, 20], target: [24, 19.5, 2], fov: 28, handheld: 1.2, ease: 'easeOut' },
  { t: 183, pos: [16, 27, 22], target: [22, 19, 4], fov: 26, handheld: 1.1 },
  { t: 186.5, pos: [3.30, 17.30, 25.60], target: [2.30, 16.55, 24.45], fov: 27, handheld: 1.2, ease: 'easeOut' },
  { t: 193, pos: [3.30, 17.25, 25.90], target: [2.28, 16.55, 24.45], fov: 26, handheld: 1.1 },
  { t: 199, pos: [-4.20, 19.20, 26.10], target: [1.70, 17.20, 24.95], fov: 29, handheld: 0.9 },

  { t: 205, pos: [-1.60, 18.20, 25.60], target: [1.65, 17.30, 25.00], fov: 26, handheld: 1.0 },
  { t: 208, pos: [-0.63, 18.10, 27.29], target: [7.18, 17.60, 19.27], fov: 27, handheld: 1.2 },
  { t: 211, pos: [42, 34, 18], target: [24, 19.5, 2], fov: 30, handheld: 1.2, ease: 'easeOut' },
  { t: 218, pos: [54, 42, 36], target: [25, 17, 4], fov: 32, handheld: 0.9 },

  { t: 230, pos: [68, 96, 100], target: [18, 10, 10], fov: 32, handheld: 0.6 },
  { t: DURATION, pos: [12, 205, 300], target: [0, 8, 0], fov: 32, handheld: 0.35 },
];

// ---------------------------------------------------------------------------
// マーカー定義  ( win: [表示開始, 非表示開始] )
// ---------------------------------------------------------------------------

const RAMIEL_POS = { x: 24, z: 2 };
export const RAMIEL_Y = 19.5;
export const FIRE_POS = { x: 1.6, z: 25.0 };   // 二子山 東稜線 標高 1065 m
export const SHIELD_POS = { x: 2.23, z: 24.36 }; // 射線上、約 95 m 前方

export const MARKERS = [
  {
    id: 'city', name: '第3新東京市', code: 'TOKYO-3 / FORTRESS CITY', status: '防護',
    faction: 'NERV', pos: PLACES.tokyo3, height: 9, ring: 11, labelScale: 12,
    labelOffset: [-14, 11], win: [14, DURATION],
  },
  {
    id: 'angel', name: '第5使徒 ラミエル', code: 'ANGEL 5th / RAMIEL', status: '交戦中',
    faction: 'ANGEL', pos: RAMIEL_POS, height: 13, ring: 3.4, labelScale: 12,
    labelOffset: [7, -9], win: [14.5, 212],
  },
  {
    id: 'hq', name: 'NERV本部 ジオフロント', code: 'NERV HQ / GEOFRONT', status: '第1種警戒',
    faction: 'NERV', pos: { x: 36, z: 16 }, height: 8, ring: 2.4, labelOffset: [7, 6], win: [20, DURATION],
  },
  {
    id: 'futago', name: '二子山 射撃陣地', code: 'FIRING POSITION 0-1', status: '設営中',
    faction: 'NERV', pos: { x: 0, z: 27.5 }, height: 7, ring: 3.2,
    labelOffset: [-5, 3], win: [42, 134],
  },
  {
    id: 'eva01', name: 'エヴァンゲリオン初号機', code: 'EVA-01 / PILOT: IKARI', status: '射手',
    faction: 'EVA', pos: FIRE_POS, height: 1.15, ring: 0.34, labelScale: 11,
    labelOffset: [-1.5, 1.0], win: [134, DURATION],
  },
  {
    id: 'eva00', name: 'エヴァンゲリオン零号機', code: 'EVA-00 / PILOT: AYANAMI', status: '遮蔽',
    faction: 'EVA00', pos: SHIELD_POS, height: 0.85, ring: 0.30, labelScale: 11,
    labelOffset: [1.5, 1.1], win: [138, DURATION],
  },
  {
    id: 'jssdf', name: '戦略自衛隊 前線指揮所', code: 'JSSDF FORWARD CP', status: '統制中',
    faction: 'JSSDF', pos: PLACES.sengokuhara, height: 9, ring: 2.6, win: [104, DURATION],
  },
  {
    id: 'sub', name: '特設変電所 芦ノ湖東', code: 'SUBSTATION 04 / 1500 kV', status: '昇圧',
    faction: 'MINISTRY', pos: PLACES.substation, height: 10, ring: 2.8, win: [76, DURATION],
  },
  {
    id: 'meti', name: '通商産業省 電力管制', code: 'MITI — GRID CONTROL', status: '系統切替',
    faction: 'MINISTRY', pos: { x: 70, z: -18 }, height: 11, ring: 2.4, win: [70, 226],
  },
  {
    id: 'mot', name: '運輸省 輸送統制本部', code: 'MOT — TRANSPORT CTRL', status: '封鎖',
    faction: 'MINISTRY', pos: { x: -56, z: -56 }, height: 11, ring: 2.4, win: [108, 226],
  },
  {
    id: 'moc', name: '建設省 経路啓開隊', code: 'MOC — ROUTE CLEARANCE', status: '啓開',
    faction: 'MINISTRY', pos: { x: -44, z: 36 }, height: 10, ring: 2.4, win: [112, 226],
  },
  {
    id: 'jma', name: '気象庁 観測点', code: 'JMA OBSERVATION 3', status: '晴 / 風速2',
    faction: 'MINISTRY', pos: { x: 40, z: -34 }, height: 9, ring: 2.0, win: [58, 226],
  },
  {
    id: 'depot', name: '第1補給処 富士', code: 'SUPPLY DEPOT — FUJI', status: '出発',
    faction: 'LOGISTICS', pos: { x: -70, z: -34 }, height: 11, ring: 2.6, win: [104, 226],
  },
  {
    id: 'odawara', name: '小田原 集積地', code: 'RAIL / PORT NODE', status: '進出',
    faction: 'LOGISTICS', pos: PLACES.odawara, height: 10, ring: 2.6, win: [110, 226],
  },
  {
    id: 'aa1', name: '戦略自衛隊 防空陣地', code: 'JSSDF AA SITE 12', status: '待機',
    faction: 'JSSDF', pos: { x: 30, z: -22 }, height: 8, ring: 2.0, win: [106, 226],
  },
  {
    id: 'aa2', name: '戦略自衛隊 防空陣地', code: 'JSSDF AA SITE 17', status: '待機',
    faction: 'JSSDF', pos: { x: -30, z: 34 }, height: 8, ring: 2.0, win: [106, 226],
  },
];

// ---------------------------------------------------------------------------
// 矢印定義  ( t0→t1 で伸長、fade で減衰開始 )
// ---------------------------------------------------------------------------

const SUB = [PLACES.substation.x, PLACES.substation.z];

export const ARROWS = [
  // --- 全国送電 (5系統) -----------------------------------------------------
  {
    id: 'g-tohoku', color: 0x2fd8ff, hot: 0xd6f6ff, width: 2.0, headLen: 7, arc: 16, hover: 4,
    t0: 66, t1: 80, points: [[74, -136], [66, -96], [58, -50], SUB],
  },
  {
    id: 'g-tokyo', color: 0x2fd8ff, hot: 0xd6f6ff, width: 2.2, headLen: 7, arc: 13, hover: 4,
    t0: 67, t1: 80, points: [[136, -46], [104, -22], [72, -2], SUB],
  },
  {
    id: 'g-chubu', color: 0x2fd8ff, hot: 0xd6f6ff, width: 2.0, headLen: 7, arc: 22, hover: 4,
    t0: 68, t1: 83, points: [[-136, -124], [-84, -84], [-30, -34], [14, 4], SUB],
  },
  {
    id: 'g-kansai', color: 0x2fd8ff, hot: 0xd6f6ff, width: 1.9, headLen: 7, arc: 18, hover: 4,
    t0: 69, t1: 84, points: [[-138, 30], [-84, 44], [-24, 46], [16, 40], SUB],
  },
  {
    id: 'g-kyushu', color: 0x2fd8ff, hot: 0xd6f6ff, width: 1.9, headLen: 7, arc: 18, hover: 4,
    t0: 70, t1: 85, points: [[-66, 140], [-14, 96], [16, 62], SUB],
  },
  // --- 幹線 (変電所 → 射撃陣地) --------------------------------------------
  {
    id: 'g-trunk', color: 0xff9a2e, hot: 0xffe9c0, width: 2.6, headLen: 6.5, hover: 0.8,
    t0: 88, t1: 100, points: [SUB, [34, 30], [20, 32], [8, 30], [1.9, 25.4]],
  },
  // --- 兵站: 陽電子砲 空輸 (松代 → 御殿場 → 仙石原 → 二子山) --------------
  {
    id: 'l-rifle', color: 0x48e08a, hot: 0xd8ffe9, width: 2.2, headLen: 7, arc: 12, hover: 3,
    t0: 102, t1: 118,
    points: [[-136, -126], [-96, -92], [-58, -58], [-30, -26], [-14, -6], [-4, 12], [1.5, 25.2]],
  },
  // --- 兵站: 特殊装甲板 陸送 (富士補給処 → 湖西 → 二子山) ------------------
  {
    id: 'l-armor', color: 0xffd166, hot: 0xfff4d0, width: 2.0, headLen: 6.5, hover: 0.7,
    t0: 108, t1: 126,
    points: [[-120, -20], [-88, -26], [-62, -12], [-46, 18], [-34, 34], [-16, 34], [-2, 28], [2.4, 24.2]],
  },
  // --- 兵站: 予備電源車 (小田原 → 変電所) ----------------------------------
  {
    id: 'l-gen', color: 0x48e08a, hot: 0xd8ffe9, width: 1.8, headLen: 6, hover: 0.7,
    t0: 112, t1: 126, points: [[136, 42], [104, 34], [78, 24], [60, 22], SUB],
  },
  // --- 市民避難 (第3新東京市 → 東方) ---------------------------------------
  {
    id: 'evac', color: 0x9fd8ff, hot: 0xffffff, width: 1.6, headLen: 6, hover: 0.7, opacity: 0.7,
    t0: 20, t1: 34, fade: 62,
    points: [[26, 6], [44, -4], [70, -14], [104, -24], [136, -32]],
  },
];

// ---------------------------------------------------------------------------
// 連続値トラック
// ---------------------------------------------------------------------------

function ramp(t, a, b) {
  if (b === a) return t >= b ? 1 : 0;
  const x = (t - a) / (b - a);
  return x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
}

function piecewise(t, pts) {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) {
      const [t0, v0] = pts[i - 1];
      const [t1, v1] = pts[i];
      const k = (t - t0) / Math.max(1e-6, t1 - t0);
      return v0 + (v1 - v0) * (k * k * (3 - 2 * k));
    }
  }
  return pts[pts.length - 1][1];
}

/** EVA-01 エントリープラグ 予備電源 残量 (%) */
export function reservePower(t) {
  return piecewise(t, [
    [0, 100], [163, 100], [166, 92], [176, 84],
    [176.4, 58], [186, 44], [196, 31],
    [197, 31], [206, 78], [208, 76],
    [208.4, 52], [216, 40], [224, 36], [232, 100], [DURATION, 100],
  ]);
}

/** 送電集中率 (%) */
export function powerConvergence(t) {
  return piecewise(t, [
    [0, 0], [66, 0], [80, 42], [90, 71], [100, 100], [176, 100],
    [176.5, 6], [196, 6], [206, 100], [208, 100], [208.5, 8], [222, 8], [234, 62], [DURATION, 62],
  ]);
}

/** ATフィールド 強度 (%) */
export function atField(t) {
  return piecewise(t, [
    [0, 100], [176, 100], [176.5, 96], [180, 92],
    [208, 90], [208.4, 12], [209.2, 0], [DURATION, 0],
  ]);
}

/**
 * 毎フレーム、時刻から全体の状態を決定する。
 * @param {number} t
 * @param {object} c ワールド参照
 */
export function applyTracks(t, c) {
  // --- 地形展開 / 走査 ------------------------------------------------------
  c.terrainU.uReveal.value = ramp(t, 0.4, 9.5) * 1.22;
  c.waterU.uReveal.value = c.terrainU.uReveal.value;

  const sweep = (t % 30) / 30;
  c.terrainU.uScanPos.value = -300 + sweep * 600;
  c.terrainU.uScanStrength.value = t < 12 ? 1.0 : 0.45;

  // --- 市街 ---------------------------------------------------------------
  c.cityU.uPower.value = 1 - ramp(t, 19, 26) * 0.86 + ramp(t, 226, 236) * 0.86;
  c.cityU.uAlert.value = ramp(t, 17, 22) * (1 - ramp(t, 212, 224));

  // --- ジオフロント --------------------------------------------------------
  c.geofront.userData.setOpacity(ramp(t, 20, 26) * (1 - ramp(t, 224, 232)));

  // --- 空 -----------------------------------------------------------------
  c.skyU.uDawnMix.value = ramp(t, 218, DURATION);

  // --- マーカー ------------------------------------------------------------
  for (const def of MARKERS) {
    const m = c.markers.get(def.id);
    if (m) m.userData.setVisible(t >= def.win[0] && t < def.win[1]);
  }

  // --- 矢印 ---------------------------------------------------------------
  for (const def of ARROWS) {
    const a = c.arrows.get(def.id);
    if (!a) continue;
    const p = ramp(t, def.t0, def.t1);
    let o = ramp(t, def.t0 - 0.6, def.t0 + 0.8);
    if (def.fade) o *= 1 - ramp(t, def.fade, def.fade + 5);
    // 布陣以降は射撃陣地に寄るため、太い矢印は画面を覆う。全て退場させる。
    o *= 1 - ramp(t, 133, 143);
    a.userData.setProgress(p);
    a.userData.setOpacity(o);
  }

  // --- 実体 ---------------------------------------------------------------
  c.ramiel.visible = t >= 13.5;
  // 撃破は永続状態なので時刻から決める (スクラブしても矛盾しない)
  if (t >= 208.4 && !c.ramiel.userData.isDestroyed) c.ramiel.userData.destroy(t - 208.4);
  if (t < 208.4 && c.ramiel.userData.isDestroyed) c.ramiel.userData.reset();
  c.eva01.visible = t >= 133.5;
  c.eva00.visible = t >= 137.5;

  // --- 射線 ---------------------------------------------------------------
  const sightVis =
    ramp(t, 42, 46) * (1 - ramp(t, 64, 68)) +
    ramp(t, 146, 150) * (1 - ramp(t, 176, 176.4)) +
    ramp(t, 202, 205) * (1 - ramp(t, 208, 208.3));
  c.sightLine.userData.setOpacity(Math.min(1, sightVis) * 0.75);

  // --- 注目領域 ------------------------------------------------------------
  const focus = c.director.lastTarget;
  if (focus) {
    c.terrainU.uFocus.value.copy(focus);
    c.terrainU.uFocusRadius.value = piecewise(t, [
      [0, 0], [14, 0], [20, 14], [66, 14], [78, 34], [102, 20], [134, 8], [162, 5], [DURATION, 5],
    ]);
  }

  // --- 盾の赤熱 ------------------------------------------------------------
  c.shield.userData.heat.material.opacity =
    Math.max(0, ramp(t, 179.6, 180.4) * (1 - ramp(t, 184, 200))) * 0.85;
}

// ---------------------------------------------------------------------------
// 一過性イベント (エッジ検出で発火 / シーク時はスキップ)
// ---------------------------------------------------------------------------

export function buildEvents(c) {
  const muzzle = () => c.getMuzzleWorld();
  const ramielPos = () => c.ramiel.position.clone();

  return [
    {
      t: 29.5,
      run: () => {
        // 在来兵器の攻撃を弾く — 市街側へ AT フィールドを張る
        const d = new THREE.Vector3(PLACES.tokyo3.x, 12, PLACES.tokyo3.z).sub(c.ramiel.position).normalize();
        c.ramiel.userData.raiseAT(d, 0.9);
        c.hud.pushLog('在来兵器 全弾 無効 — ATフィールド健在');
      },
    },
    {
      t: 176,
      run: () => {
        const from = muzzle();
        const to = ramielPos();
        c.beam.userData.aim(from, to);
        c.beam.userData.fire(0.16, 0.55, 0.35);
        c.director.shake(1.4, 3.0);
        c.hud.flash(0.9, 0.45);
        c.hud.pushLog('第一射 発射 — 陽電子砲 射出');
      },
    },
    {
      t: 176.35,
      run: () => {
        const d = c.eva01.position.clone().sub(c.ramiel.position).normalize();
        c.ramiel.userData.raiseAT(d, 1.0);
        c.hud.pushLog('ATフィールド展開 — 弾道 偏向');
      },
    },
    {
      t: 176.9,
      run: () => {
        const p = c.ramiel.position;
        c.blastAt(p.x + 9, p.z - 12, 9, 1.7); // 山肌に着弾
        c.director.shake(0.9, 3.2);
        c.hud.pushLog('着弾 — 目標圏外 / 誤差 320 m');
      },
    },
    {
      t: 179.6,
      run: () => {
        const from = c.ramiel.position.clone();
        const to = c.getShieldWorld();
        c.counterBeam.userData.aim(from, to);
        c.counterBeam.userData.fire(0.12, 1.5, 0.5);
        c.director.shake(1.8, 2.4);
        c.hud.flash(0.7, 0.6);
        c.hud.alert('零号機 被弾', 6);
        c.hud.pushLog('使徒 反撃 — 加粒子砲 / 零号機 遮蔽');
      },
    },
    {
      t: 208,
      run: () => {
        const from = muzzle();
        const to = ramielPos();
        c.beam.userData.aim(from, to);
        c.beam.userData.fire(0.14, 0.9, 0.5);
        c.director.shake(1.6, 3.0);
        c.hud.flash(1.0, 0.5);
        c.hud.pushLog('第二射 発射');
      },
    },
    {
      t: 208.4,
      run: () => {
        c.ramiel.userData.destroy();
        c.blastAt(c.ramiel.position.x, c.ramiel.position.z, 26, 2.6, c.ramiel.position.y);
        c.director.shake(3.2, 1.8);
        c.hud.flash(1.0, 0.9);
        c.hud.alert('目標 撃破', 5);
        c.hud.pushLog('命中確認 — 中心部 貫通 / 反応 消失');
      },
    },
    {
      t: 209.6,
      run: () => {
        c.blastAt(c.ramiel.position.x + 4, c.ramiel.position.z + 5, 14, 2.2, c.ramiel.position.y - 2);
        c.director.shake(1.2, 2.4);
      },
    },
    { t: 20, run: () => c.hud.pushLog('第3新東京市 — 全市民 地下退避 完了') },
    { t: 66, run: () => c.hud.pushLog('全国送電系統 — ヤシマ作戦へ移行') },
    { t: 102, run: () => c.hud.pushLog('戦略自衛隊 — 輸送作戦 開始') },
    { t: 134, run: () => c.hud.pushLog('初号機 / 零号機 — 射撃地点 展開') },
    { t: 196, run: () => c.hud.pushLog('再送電 開始 — 第二射 充填') },
    { t: 224, run: () => c.hud.pushLog('ヤシマ作戦 完了 — 全部隊 撤収') },
  ];
}

// 進行状況の補助
export function chapterAt(t) {
  let cur = CHAPTERS[0];
  for (const ch of CHAPTERS) if (t >= ch.t) cur = ch;
  return cur;
}

export function captionAt(t) {
  for (const c of CAPTIONS) {
    if (t >= c.t && t < c.t + c.d) return c;
  }
  return null;
}

export function firingRange(c) {
  const a = c.getMuzzleWorld();
  const b = c.ramiel.position;
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) * 100; // m
}

export { terrainY, surfaceY };
