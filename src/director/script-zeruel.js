// 第10使徒 ゼルエル — ネルフ本部 侵攻戦 / 進行台本
//
// 表示状態はすべて「時刻の関数」として定義する。タイムラインを巻き戻しても
// 画面が完全に再現されるようにするため。一過性の演出 (爆発・閃光・カメラ衝撃)
// のみ EVENTS としてエッジ検出で発火させる。
//
// 使徒番号について:
//   TV版の呼称では第拾四使徒、新劇場版の呼称では第10の使徒にあたる個体。
//   本デモは依頼どおり「第10使徒」表記を採る。作戦経過はTV版 第拾八〜拾九話
//   (ネルフ本部への直接侵攻 → 初号機の覚醒) に準拠する。

import * as THREE from 'three';
import { PLACES, terrainY, surfaceY, VE, M_PER_UNIT } from '../world/geo.js';
import {
  CITY, GROUND_Y, GEO_FLOOR_Y, GEO_TOP_Y, PYRAMID_APEX_Y, SHAFT_BOTTOM_Y,
  DECK_Y, BULKHEADS, bulkheadY, depthM,
} from '../world/dogma.js';

export const DURATION = 376;
export const T0 = 174; // 装甲板 突破 = 本部侵攻 開始

export const ANGEL_H = 1.05;         // 使徒 全高 105 m
export const EVA01_STAND = { x: CITY.x + 0.42, z: CITY.z + 0.26 };

// ---------------------------------------------------------------------------
// 章
// ---------------------------------------------------------------------------

export const CHAPTERS = [
  { t: 0, id: 'pro', ja: '序', en: 'PROLOGUE' },
  { t: 22, id: 'detect', ja: '探知', en: 'DETECTION' },
  { t: 52, id: 'declare', ja: '非常事態宣言', en: 'STATE OF EMERGENCY' },
  { t: 76, id: 'intercept', ja: '第一次迎撃', en: 'FIRST INTERCEPTION' },
  { t: 110, id: 'eva02', ja: '弐号機 出撃', en: 'EVA-02 SORTIE' },
  { t: 144, id: 'eva00', ja: '零号機 突入', en: 'EVA-00 ASSAULT' },
  { t: 174, id: 'armor', ja: '装甲板 突破', en: 'ARMOR BREACH' },
  { t: 204, id: 'geofront', ja: 'ジオフロント侵入', en: 'GEOFRONT INCURSION' },
  { t: 240, id: 'hq', ja: '本部侵攻', en: 'HQ PENETRATION' },
  { t: 268, id: 'eva01', ja: '初号機 出撃', en: 'EVA-01 SORTIE' },
  { t: 300, id: 'limit', ja: '活動限界', en: 'POWER EXPIRED' },
  { t: 318, id: 'awake', ja: '覚醒', en: 'AWAKENING' },
  { t: 350, id: 'end', ja: '終幕', en: 'AFTERMATH' },
];

// ---------------------------------------------------------------------------
// 字幕
// ---------------------------------------------------------------------------

export const CAPTIONS = [
  { t: 2.5, d: 5.5, ja: '西暦2015年 — 箱根 第3新東京市', en: '2015 A.D. — TOKYO-3, HAKONE' },
  { t: 9, d: 6.0, ja: '地下1,850m — 特務機関ネルフ本部', en: '1,850 m BELOW — NERV HEADQUARTERS' },
  { t: 16, d: 5.0, ja: '要塞都市そのものが、本部の装甲である', en: 'THE FORTRESS CITY IS THE ARMOR' },

  { t: 23.5, d: 5.5, ja: '第7観測所 — パターン青、感知', en: 'OBS. POST 7 — PATTERN BLUE DETECTED' },
  { t: 30, d: 6.0, ja: '目標 — 第10使徒 ゼルエル', en: 'TARGET / 10TH ANGEL "ZERUEL"' },
  { t: 37, d: 5.5, ja: '全高105m — 既知の使徒中、最速の進行速度', en: 'HEIGHT 105 m / FASTEST APPROACH ON RECORD' },
  { t: 44, d: 5.0, ja: '進路 — 第3新東京市 直進', en: 'HEADING — DIRECT TO TOKYO-3' },

  { t: 53.5, d: 5.5, ja: '第2次特別非常事態宣言 発令', en: 'SECOND SPECIAL EMERGENCY DECLARED' },
  { t: 60, d: 6.0, ja: '関係各省庁 — 指揮権をネルフへ移譲', en: 'ALL AGENCIES — COMMAND CEDED TO NERV' },
  { t: 67, d: 5.5, ja: '第3新東京市 — 全市民 地下退避 / 戦闘配置', en: 'TOKYO-3 — CIVILIANS SHELTERED / COMBAT CONFIG' },

  { t: 77.5, d: 5.5, ja: '戦略自衛隊 — 外輪山 全火力 集中', en: 'JSSDF — MASSED FIRES FROM THE CALDERA RIM' },
  { t: 84, d: 5.5, ja: '国連軍航空隊 — N2兵器 投下', en: 'UN AIR FORCE — N2 ORDNANCE RELEASE' },
  { t: 91, d: 5.5, ja: '着弾 — 効果なし', en: 'IMPACT — NO EFFECT' },
  { t: 97.5, d: 6.0, ja: 'ATフィールドが在来兵器を全て無効化', en: 'A.T. FIELD NULLIFIES ALL CONVENTIONAL ARMS' },
  { t: 104, d: 4.5, ja: '前線 — 壊滅', en: 'FORWARD LINE — DESTROYED' },

  { t: 111.5, d: 5.5, ja: '弐号機 出撃 — 第7ケージより射出', en: 'EVA-02 LAUNCH — CAGE 7' },
  { t: 118, d: 5.5, ja: '操縦者 — 惣流・アスカ・ラングレー', en: 'PILOT — SORYU ASUKA LANGLEY' },
  { t: 126, d: 5.0, ja: 'パレットライフル — 全弾 命中', en: 'PALLET RIFLE — ALL ROUNDS ON TARGET' },
  { t: 131.5, d: 4.5, ja: '損害 — 皆無', en: 'DAMAGE TO TARGET — NONE' },
  { t: 137.5, d: 5.5, ja: '弐号機 — 頭部 損傷 / 両腕 切断', en: 'EVA-02 — HEAD LOST / BOTH ARMS SEVERED' },
  { t: 144.5, d: 4.5, ja: '弐号機 活動停止', en: 'EVA-02 — OPERATION CEASED' },

  { t: 148, d: 5.5, ja: '零号機 — N2地雷をもって強行突入', en: 'EVA-00 — N2 MINE / DIRECT ASSAULT' },
  { t: 155, d: 4.0, ja: '操縦者 — 綾波レイ', en: 'PILOT — AYANAMI REI' },
  { t: 159.5, d: 5.0, ja: '起爆 — ATフィールド 健在', en: 'DETONATION — A.T. FIELD INTACT' },
  { t: 165, d: 5.0, ja: '零号機 大破 — 戦線に残るは初号機のみ', en: 'EVA-00 CRIPPLED — ONLY EVA-01 REMAINS' },

  { t: 175.5, d: 5.5, ja: '目標 — 第3新東京市 中枢区画 直上', en: 'TARGET OVER THE CENTRAL SECTOR' },
  { t: 182, d: 6.0, ja: '装甲板 — 溶断 開始', en: 'ARMOR PLATE — CUTTING BEGINS' },
  { t: 189, d: 5.5, ja: '第4装甲板 貫通 — 厚さ 3.2 m', en: 'PLATE No.4 PIERCED — 3.2 m THICK' },
  { t: 196, d: 5.5, ja: '本部の上に、もう何も無い', en: 'NOTHING LEFT ABOVE THE HEADQUARTERS' },

  { t: 205.5, d: 5.5, ja: '使徒 — ジオフロント侵入', en: 'ANGEL HAS ENTERED THE GEOFRONT' },
  { t: 212, d: 5.5, ja: '本部要員 — 第2発令所へ退避', en: 'HQ PERSONNEL — TO SECONDARY COMMAND' },
  { t: 219, d: 5.5, ja: '直上 1,200 m — 降下中', en: '1,200 m ABOVE HQ — DESCENDING' },
  { t: 226, d: 5.5, ja: '本部ピラミッド — 上面 装甲 展開', en: 'HQ PYRAMID — UPPER ARMOR ENGAGED' },
  { t: 233, d: 4.5, ja: '迎撃手段 — 無し', en: 'NO REMAINING MEANS OF INTERCEPTION' },

  { t: 241, d: 5.5, ja: '第1隔壁 突破', en: 'BULKHEAD No.1 BREACHED' },
  { t: 248, d: 5.5, ja: '中央ドグマへの直線経路が開いた', en: 'A DIRECT PATH TO CENTRAL DOGMA IS OPEN' },
  { t: 255, d: 5.5, ja: '第7隔壁 — 突破', en: 'BULKHEAD No.7 — BREACHED' },
  { t: 262, d: 5.0, ja: '目標到達まで — 隔壁 残り10層', en: '10 BULKHEADS TO OBJECTIVE' },

  { t: 269.5, d: 5.5, ja: '初号機 — 外部電源 接続不能', en: 'EVA-01 — EXTERNAL POWER UNAVAILABLE' },
  { t: 276, d: 6.0, ja: '内部電源のみ — 活動限界 4分59秒', en: 'INTERNAL POWER ONLY — 4 min 59 s' },
  { t: 283, d: 5.0, ja: '操縦者 — 碇シンジ', en: 'PILOT — IKARI SHINJI' },
  { t: 289, d: 5.5, ja: '初号機 左腕 切断 — 交戦 継続', en: 'EVA-01 LEFT ARM SEVERED — STILL ENGAGED' },
  { t: 295.5, d: 4.5, ja: '残量 — 限界域', en: 'RESERVE — CRITICAL' },

  { t: 301, d: 5.5, ja: '内部電源 消耗 — 初号機 活動停止', en: 'POWER EXHAUSTED — EVA-01 SHUTDOWN' },
  { t: 308, d: 5.5, ja: '全系統 停止 — 生命維持のみ', en: 'ALL SYSTEMS DOWN — LIFE SUPPORT ONLY' },
  { t: 313, d: 4.5, ja: '本部 — 為す術なし', en: 'HQ — NOTHING MORE TO BE DONE' },

  { t: 319, d: 5.0, ja: '初号機 — 再起動', en: 'EVA-01 — REACTIVATED' },
  { t: 324.5, d: 5.5, ja: '電源系 未接続のまま — パターン青 検出', en: 'NO POWER SOURCE — PATTERN BLUE DETECTED' },
  { t: 331, d: 5.0, ja: '初号機 暴走 — ATフィールド 中和', en: 'EVA-01 BERSERK — A.T. FIELD NEUTRALIZED' },
  { t: 337, d: 5.5, ja: 'コア 露出 — 捕食', en: 'CORE EXPOSED — DEVOURED' },
  { t: 343.5, d: 5.0, ja: 'S²機関 — 取り込み確認', en: 'S² ENGINE — ASSIMILATED' },

  { t: 351, d: 5.5, ja: '第10使徒 — 殲滅', en: '10TH ANGEL — ANNIHILATED' },
  { t: 358, d: 6.0, ja: '損害 — 弐号機 大破 / 零号機 大破 / 本部 隔壁14層 喪失', en: 'DAMAGE: EVA-02 & EVA-00 CRIPPLED / 14 BULKHEADS LOST' },
  { t: 365, d: 6.0, ja: '本部機能 — 維持', en: 'HEADQUARTERS — STILL STANDING' },
  { t: 371, d: 5.0, ja: '戦闘終了', en: 'ENGAGEMENT COMPLETE' },
];

// ---------------------------------------------------------------------------
// 補間
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

/** 位置トラック — [t, [x,y,z]] の列を滑らかに補間する */
function trackAt(t, keys, out = new THREE.Vector3()) {
  if (t <= keys[0][0]) return out.fromArray(keys[0][1]);
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, p0] = keys[i - 1];
      const [t1, p1] = keys[i];
      const k = (t - t0) / Math.max(1e-6, t1 - t0);
      const e = k * k * (3 - 2 * k);
      return out.set(
        p0[0] + (p1[0] - p0[0]) * e,
        p0[1] + (p1[1] - p0[1]) * e,
        p0[2] + (p1[2] - p0[2]) * e
      );
    }
  }
  return out.fromArray(keys[keys.length - 1][1]);
}

// ---------------------------------------------------------------------------
// 使徒の航跡
// ---------------------------------------------------------------------------

// 地表接近フェーズ — (t, x, z, 地表からの余裕) で与え、標高から高度を決める
const APPROACH = [
  [22, -14, -124, 1.5],
  [40, -10, -100, 1.4],
  [52, -6, -82, 1.3],
  [64, -2, -64, 1.1],
  [76, 2, -50, 1.0],
  [96, 8, -30, 0.85],
  [110, 16, -16, 0.75],
  [126, 19, -11, 0.70],
  [140, 21, -7, 0.68],
  [152, 22, -5, 0.66],
  [160, 23.2, -1.6, 0.64],
  [168, 24.6, 2.4, 0.62],
  [174, 26, 6, 0.60],
];

export const ANGEL_TRACK = [
  ...APPROACH.map(([t, x, z, c]) => [t, [x, terrainY(x, z) + ANGEL_H * 0.5 + c, z]]),
  // 装甲板の溶断 — 高度を落としながら滞空
  [190, [26, GROUND_Y + ANGEL_H * 0.5 + 0.34, 6]],
  [204, [26, GROUND_Y + ANGEL_H * 0.5 + 0.12, 6]],
  // 地殻を抜けてジオフロントへ降下
  [214, [26.1, GEO_TOP_Y - 0.6, 6.1]],
  [224, [26.3, 2.4, 6.2]],
  [236, [26.5, -6.4, 6.3]],
  [244, [26.9, DECK_Y + 1.55, 6.55]],
  // 本部上面での滞空 → 初号機との交戦
  [268, [27.0, DECK_Y + 1.30, 6.62]],
  [280, [27.35, DECK_Y + 0.72, 6.80]],
  [300, [27.20, DECK_Y + 0.78, 6.72]],
  [318, [27.30, DECK_Y + 0.74, 6.78]],
  [330, [27.55, DECK_Y + 0.60, 6.92]],
  [344, [27.62, DECK_Y + 0.52, 6.96]],
  [DURATION, [27.62, DECK_Y + 0.52, 6.96]],
];

const G02 = (x, z) => terrainY(x, z);

export const EVA02_TRACK = [
  [112, [27.9, G02(27.9, 4.8) - 0.42, 4.8]],
  [116, [27.9, G02(27.9, 4.8), 4.8]],
  [124, [24.0, G02(24, -2), -2.0]],
  [131, [22.4, G02(22.4, -5), -5.0]],
  [137, [21.9, G02(21.9, -6.2), -6.2]],
  [141, [21.7, G02(21.7, -6.4), -6.4]],
  [DURATION, [21.7, G02(21.7, -6.4), -6.4]],
];

export const EVA00_TRACK = [
  [146, [19.0, G02(19, 3), 3.0]],
  [152, [21.0, G02(21, 0.6), 0.6]],
  [158.4, [22.6, G02(22.6, -0.8), -0.8]],
  [160.5, [20.4, G02(20.4, 2.2), 2.2]],
  [163, [19.8, G02(19.8, 2.9), 2.9]],
  [DURATION, [19.8, G02(19.8, 2.9), 2.9]],
];

export const EVA01_TRACK = [
  [268, [EVA01_STAND.x, DECK_Y - 2.6, EVA01_STAND.z]],
  [273, [EVA01_STAND.x, DECK_Y, EVA01_STAND.z]],
  [281, [EVA01_STAND.x + 0.16, DECK_Y, EVA01_STAND.z + 0.10]],
  [300, [EVA01_STAND.x + 0.16, DECK_Y, EVA01_STAND.z + 0.10]],
  [326, [EVA01_STAND.x + 0.30, DECK_Y, EVA01_STAND.z + 0.18]],
  [336, [EVA01_STAND.x + 0.40, DECK_Y, EVA01_STAND.z + 0.24]],
  [DURATION, [EVA01_STAND.x + 0.40, DECK_Y, EVA01_STAND.z + 0.24]],
];

export function angelAt(t, out) {
  return trackAt(t, ANGEL_TRACK, out);
}

// ---------------------------------------------------------------------------
// カメラ
// ---------------------------------------------------------------------------

export const CAMERA_KEYS = [
  { t: 0, pos: [-52, 215, 300], target: [12, 10, 4], fov: 30, handheld: 0.35, ease: 'easeInOutSoft' },
  { t: 12, pos: [64, 128, 190], target: [26, 12, 6], fov: 30, handheld: 0.5 },
  { t: 22, pos: [44, 128, 118], target: [16, 12, -10], fov: 32, handheld: 0.5 },

  // 北の外輪山外側から接近する使徒へ、上空から寄る
  { t: 28, pos: [-17, 84, -66], target: [-11, 10, -108], fov: 30, handheld: 0.7, ease: 'easeInOutSoft' },
  // 実寸 105 m の巨躯を正面から捉える寄りのカット (距離 約 850 m)
  { t: 36, pos: [-7.4, 8.4, -96.2], target: [-10.4, 6.5, -100.6], fov: 26, handheld: 1.0 },
  { t: 43, pos: [-4.6, 7.8, -100.2], target: [-9.5, 6.4, -97.8], fov: 27, handheld: 1.0 },
  { t: 52, pos: [-24, 44, -118], target: [-4, 10, -76], fov: 30, handheld: 0.7 },

  // 市街 (戦闘配置)
  { t: 62, pos: [50, 48, 44], target: [26, 12, 6], fov: 30, handheld: 0.7 },
  { t: 72, pos: [10, 66, 30], target: [24, 12, 2], fov: 32, handheld: 0.6 },

  // 迎撃 — 外輪山の火力と使徒
  { t: 84, pos: [64, 56, -8], target: [4, 16, -44], fov: 30, handheld: 0.9 },
  { t: 96, pos: [52, 40, -14], target: [10, 16, -28], fov: 28, handheld: 1.0 },
  { t: 104, pos: [44, 30, -6], target: [15, 16, -18], fov: 28, handheld: 1.1 },
  { t: 110, pos: [40, 26, 2], target: [18, 15, -15], fov: 29, handheld: 0.9 },

  // 弐号機 — 射出口からの上昇を寄りで、交戦は両者が収まる引きで
  { t: 117, pos: [31.5, 13.9, 8.2], target: [27.9, 13.0, 4.9], fov: 26, handheld: 1.0 },
  { t: 127, pos: [42.1, 20.2, -18.9], target: [21.2, 13.6, -7.1], fov: 28, handheld: 0.9 },
  { t: 137, pos: [17.5, 14.4, -3.6], target: [21.4, 13.4, -6.8], fov: 30, handheld: 1.2, ease: 'easeOut' },
  { t: 144, pos: [30.0, 19.0, 4.0], target: [21.8, 13.0, -6.0], fov: 28, handheld: 1.0 },

  // 零号機
  { t: 152, pos: [13.6, 17.4, 9.0], target: [20.6, 13.4, -0.6], fov: 30, handheld: 0.9 },
  { t: 158, pos: [17.6, 15.6, 4.2], target: [22.6, 13.6, -1.6], fov: 28, handheld: 1.1 },
  { t: 162, pos: [12.0, 22.0, 12.0], target: [22.4, 13.8, -0.6], fov: 30, handheld: 1.3, ease: 'easeOut' },
  { t: 168, pos: [16.0, 26.0, 16.0], target: [24.4, 13.8, 2.6], fov: 30, handheld: 0.9 },

  // 装甲板 溶断
  { t: 176, pos: [26, 42, 38], target: [26, 13.4, 6], fov: 32, handheld: 0.6 },
  { t: 186, pos: [32.5, 19.4, 15.6], target: [26.4, 13.3, 6.1], fov: 28, handheld: 0.8 },
  { t: 196, pos: [29.8, 16.8, 11.8], target: [26.2, 13.0, 6.0], fov: 28, handheld: 0.9 },
  { t: 204, pos: [31.0, 17.2, 13.0], target: [26.0, 12.4, 6.0], fov: 28, handheld: 0.9 },

  // ジオフロントへ降下 (地形クランプを外す)
  { t: 212, pos: [32.5, 15.0, 14.5], target: [26.1, 10.8, 6.1], fov: 30, handheld: 0.8, under: 1 },
  { t: 222, pos: [32.0, 8.5, 14.0], target: [26.3, 2.4, 6.2], fov: 32, handheld: 0.7, under: 1 },
  { t: 232, pos: [33.0, 2.0, 15.0], target: [26.4, -6.4, 6.3], fov: 32, handheld: 0.6, under: 1 },
  { t: 240, pos: [31.0, -4.0, 13.0], target: [26.8, -10.4, 6.5], fov: 30, handheld: 0.7, under: 1 },

  // 本部侵攻 — 隔壁
  // 断面の引き — 上に使徒、中央にピラミッド、下に縦坑と隔壁が同時に入る画
  { t: 250, pos: [42.0, -11.5, 19.0], target: [26.4, -15.5, 6.3], fov: 34, handheld: 0.7, under: 1 },
  { t: 260, pos: [38.0, -17.0, 17.0], target: [26.2, -20.5, 6.2], fov: 34, handheld: 0.8, under: 1 },
  { t: 268, pos: [25.4, -11.0, 10.2], target: [26.5, -11.8, 6.4], fov: 30, handheld: 0.8, under: 1 },

  // 初号機 交戦
  { t: 276, pos: [24.4, -10.2, 10.6], target: [26.9, -11.4, 6.6], fov: 28, handheld: 0.9, under: 1 },
  { t: 289, pos: [24.8, -10.4, 10.3], target: [26.9, -11.45, 6.6], fov: 27, handheld: 1.1, under: 1 },
  { t: 300, pos: [25.0, -10.6, 10.0], target: [26.85, -11.55, 6.5], fov: 26, handheld: 0.8, under: 1 },
  { t: 312, pos: [25.3, -10.8, 9.6], target: [26.7, -11.7, 6.45], fov: 25, handheld: 0.5, under: 1 },

  // 覚醒
  { t: 319, pos: [25.0, -10.6, 10.0], target: [26.8, -11.6, 6.5], fov: 26, handheld: 1.2, under: 1, ease: 'easeOut' },
  { t: 328, pos: [23.6, -9.8, 11.4], target: [27.2, -11.2, 6.8], fov: 30, handheld: 1.2, under: 1 },
  { t: 338, pos: [24.5, -11.0, 10.5], target: [26.95, -11.6, 6.62], fov: 29, handheld: 1.1, under: 1 },
  { t: 346, pos: [24.0, -10.2, 10.8], target: [26.9, -11.65, 6.6], fov: 28, handheld: 0.9, under: 1 },

  // 終幕 — 開口部から地上へ抜ける
  { t: 356, pos: [21.0, -4.0, 17.0], target: [26.6, -11.2, 6.5], fov: 32, handheld: 0.6, under: 1 },
  { t: 366, pos: [46.0, 46.0, 36.0], target: [26.0, 8.0, 6.0], fov: 34, handheld: 0.5 },
  { t: DURATION, pos: [-30, 190, 250], target: [14, 6, 2], fov: 32, handheld: 0.35 },
];

// ---------------------------------------------------------------------------
// マーカー
// ---------------------------------------------------------------------------

export const MARKERS = [
  {
    id: 'city', name: '第3新東京市', code: 'TOKYO-3 / FORTRESS CITY', status: '戦闘配置',
    faction: 'NERV', pos: PLACES.tokyo3, height: 10, ring: 11.4, labelScale: 12,
    labelOffset: [-15, 12], win: [4, 112],
  },
  {
    id: 'hq', name: 'ネルフ本部 ジオフロント', code: 'NERV HQ / GEOFRONT', status: '第1種戦闘配置',
    faction: 'NERV', pos: PLACES.tokyo3, height: 7, ring: 3.0, labelScale: 12,
    labelOffset: [13, -8], win: [7, 112],
  },
  {
    id: 'angel', name: '第10使徒 ゼルエル', code: 'ANGEL 10th / ZERUEL', status: '接近中',
    faction: 'ANGEL', pos: { x: -46, z: -118 }, height: 13, ring: 3.6, labelScale: 12,
    labelOffset: [10, -10], win: [23, 44],
  },
  {
    id: 'jssdf', name: '戦略自衛隊 前線指揮所', code: 'JSSDF FORWARD CP', status: '統制中',
    faction: 'JSSDF', pos: PLACES.sengokuhara, height: 9, ring: 2.6, win: [54, 210],
  },
  {
    id: 'arty1', name: '戦略自衛隊 砲兵陣地', code: 'JSSDF ARTY 04 / 明神ヶ岳', status: '射撃準備',
    faction: 'JSSDF', pos: PLACES.myojin, height: 9, ring: 2.4, win: [58, 178],
  },
  {
    id: 'arty2', name: '戦略自衛隊 砲兵陣地', code: 'JSSDF ARTY 09 / 金時山', status: '射撃準備',
    faction: 'JSSDF', pos: PLACES.kintoki, height: 9, ring: 2.4, win: [58, 178],
  },
  {
    id: 'aa', name: '戦略自衛隊 防空陣地', code: 'JSSDF AA SITE 17', status: '待機',
    faction: 'JSSDF', pos: { x: 40, z: 14 }, height: 8, ring: 2.2, win: [58, 178],
  },
  {
    id: 'un', name: '国連軍 航空隊', code: 'UN AIR WING / N2 STRIKE', status: '進入',
    faction: 'UN', pos: { x: -66, z: -96 }, height: 11, ring: 2.8, win: [62, 130],
  },
  {
    id: 'cabinet', name: '首相官邸 危機管理室', code: 'CABINET CRISIS CTR.', status: '非常事態宣言',
    faction: 'MINISTRY', pos: { x: 116, z: -54 }, height: 11, ring: 2.4, win: [52, 232],
  },
  {
    id: 'jda', name: '防衛庁 統合幕僚会議', code: 'JDA — JOINT STAFF', status: '指揮移譲',
    faction: 'MINISTRY', pos: { x: 86, z: -92 }, height: 11, ring: 2.4, win: [54, 232],
  },
  {
    id: 'matsushiro', name: 'ネルフ第2支部 松代', code: 'NERV BRANCH 2 — MATSUSHIRO', status: '支援',
    faction: 'MINISTRY', pos: { x: -128, z: -118 }, height: 11, ring: 2.6, win: [56, 232],
  },
  {
    id: 'mot', name: '運輸省 輸送統制本部', code: 'MOT — TRANSPORT CTRL', status: '経路封鎖',
    faction: 'MINISTRY', pos: { x: -58, z: 60 }, height: 10, ring: 2.4, win: [56, 232],
  },
  {
    id: 'eva02', name: 'エヴァンゲリオン弐号機', code: 'EVA-02 / PILOT: SORYU', status: '出撃',
    faction: 'EVA02', pos: { x: 24, z: -2 }, height: 1.2, ring: 0.34, labelScale: 11,
    labelOffset: [-2.0, 1.4], win: [112, 200],
  },
  {
    id: 'eva00', name: 'エヴァンゲリオン零号機', code: 'EVA-00 / PILOT: AYANAMI', status: '突入',
    faction: 'EVA00', pos: { x: 20, z: 1.6 }, height: 1.2, ring: 0.34, labelScale: 11,
    labelOffset: [-2.2, 1.6], win: [146, 200],
  },
  {
    id: 'dogma', name: '中央ドグマ', code: 'CENTRAL DOGMA / 17 BULKHEADS', status: '隔壁 閉鎖',
    faction: 'NERV', pos: PLACES.tokyo3, y: SHAFT_BOTTOM_Y + 3.2, height: 3.4, ring: 1.5,
    labelScale: 10, labelOffset: [7, -4], win: [232, 356],
  },
  {
    id: 'pyramid', name: 'ネルフ本部 中枢', code: 'NERV HQ — PYRAMID', status: '直接侵攻',
    faction: 'NERV', pos: PLACES.tokyo3, y: DECK_Y, height: 2.6, ring: 1.0,
    labelScale: 10, labelOffset: [-6, 4], win: [224, 356],
  },
];

// ---------------------------------------------------------------------------
// 進軍矢印
// ---------------------------------------------------------------------------

export const ARROWS = [
  // 使徒 進路
  {
    id: 'angel-path', color: 0xff2d55, hot: 0xffd0d8, width: 2.1, headLen: 7, hover: 3.4,
    t0: 24, t1: 174, opacity: 0.9,
    points: [[-14, -124], [-10, -100], [-6, -82], [-2, -64], [2, -50], [8, -30], [16, -16], [21, -7], [26, 6]],
  },
  // 戦略自衛隊 展開
  {
    id: 'js-1', color: 0x48e08a, hot: 0xd8ffe9, width: 1.9, headLen: 6, hover: 0.8,
    t0: 54, t1: 72, points: [[-70, -74], [-46, -52], [-32, -34], [-24, -22]],
  },
  {
    id: 'js-2', color: 0x48e08a, hot: 0xd8ffe9, width: 1.9, headLen: 6, hover: 0.8,
    t0: 55, t1: 73, points: [[78, -60], [58, -44], [42, -30], [33, -22]],
  },
  {
    id: 'js-3', color: 0x48e08a, hot: 0xd8ffe9, width: 1.7, headLen: 6, hover: 0.8,
    t0: 57, t1: 76, points: [[86, 46], [62, 34], [48, 22], [41, 15]],
  },
  // 砲兵の射線 (外輪山 → 使徒) — 弾道なので細く高く
  {
    id: 'fire-1', color: 0xffd166, hot: 0xfff4d0, width: 0.45, headLen: 2.4, headWidth: 2.6,
    arc: 13, hover: 1.6, t0: 84, t1: 92, fade: 102, points: [[30, -20], [23, -21], [16.5, -17.5]],
  },
  {
    id: 'fire-2', color: 0xffd166, hot: 0xfff4d0, width: 0.45, headLen: 2.4, headWidth: 2.6,
    arc: 16, hover: 1.6, t0: 85, t1: 93, fade: 102, points: [[-28, -24], [-8, -23], [14.5, -17]],
  },
  // 国連軍 航空攻撃
  {
    id: 'un-air', color: 0x8fb8ff, hot: 0xe6f0ff, width: 0.9, headLen: 4, arc: 30, hover: 9,
    t0: 82, t1: 94, fade: 104, points: [[-96, -128], [-66, -96], [-34, -62], [-6, -34], [15, -17]],
  },
  // 市民 避難
  {
    id: 'evac', color: 0x9fd8ff, hot: 0xffffff, width: 1.5, headLen: 5.5, hover: 0.7, opacity: 0.68,
    t0: 58, t1: 72, fade: 96, points: [[26, 6], [46, 16], [72, 24], [104, 30]],
  },
  // 弐号機 出撃
  {
    id: 'a-eva02', color: 0xff6a4a, hot: 0xffd8c8, width: 1.5, headLen: 5, hover: 0.6,
    t0: 113, t1: 124, fade: 142, points: [[27.9, 4.8], [26, 1], [23.5, -3], [22, -6]],
  },
  // 零号機 突入
  {
    id: 'a-eva00', color: 0x5cc8ff, hot: 0xe0f6ff, width: 1.5, headLen: 5, hover: 0.6,
    t0: 147, t1: 158, fade: 172, points: [[18.4, 4.0], [20.4, 1.4], [22.4, -1.0]],
  },
  // 使徒 降下 (地殻 → ジオフロント → 本部)
  {
    id: 'descent', color: 0xff2d55, hot: 0xffd0d8, width: 0.55, headLen: 2.2, opacity: 0.7,
    t0: 200, t1: 244,
    points3: [
      [26, GROUND_Y + 1.4, 6],
      [26.1, GEO_TOP_Y - 0.5, 6.1],
      [26.3, 2.4, 6.2],
      [26.5, -6.4, 6.3],
      [26.9, DECK_Y + 1.2, 6.55],
    ],
  },
  // 本部要員 退避 (ジオフロント床面)
  {
    id: 'hq-evac1', color: 0x2fd8ff, hot: 0xd8f6ff, width: 0.7, headLen: 2.4, opacity: 0.75,
    t0: 212, t1: 232, fade: 300,
    points3: [
      [26, GEO_FLOOR_Y + 0.12, 6],
      [23.5, GEO_FLOOR_Y + 0.12, 3.2],
      [21.0, GEO_FLOOR_Y + 0.12, 1.6],
      [18.4, GEO_FLOOR_Y + 0.12, 0.8],
    ],
  },
  {
    id: 'hq-evac2', color: 0x2fd8ff, hot: 0xd8f6ff, width: 0.7, headLen: 2.4, opacity: 0.75,
    t0: 214, t1: 234, fade: 300,
    points3: [
      [26.4, GEO_FLOOR_Y + 0.12, 6.4],
      [29.6, GEO_FLOOR_Y + 0.12, 9.4],
      [32.6, GEO_FLOOR_Y + 0.12, 12.6],
      [34.8, GEO_FLOOR_Y + 0.12, 15.0],
    ],
  },
  // 初号機 射出
  {
    id: 'a-eva01', color: 0xb388ff, hot: 0xf0e4ff, width: 0.9, headLen: 2.6,
    t0: 266, t1: 274, fade: 292,
    points3: [
      [EVA01_STAND.x, GEO_FLOOR_Y + 0.4, EVA01_STAND.z],
      [EVA01_STAND.x, DECK_Y - 1.4, EVA01_STAND.z],
      [EVA01_STAND.x, DECK_Y + 0.12, EVA01_STAND.z],
    ],
  },
];

// ---------------------------------------------------------------------------
// 連続値トラック
// ---------------------------------------------------------------------------

/** 初号機 内部電源 残量 (%) — 活動限界 4分59秒 */
export function reservePower(t) {
  return piecewise(t, [
    [0, 100], [268, 100], [272, 100], [292, 42], [300, 12], [304, 0],
    [318, 0], [366, 0], [372, 100], [DURATION, 100],
  ]);
}

/** 突破された隔壁の数 */
export function bulkheads(t) {
  return piecewise(t, [
    [0, 0], [240, 0], [243, 1], [255, 7], [268, 7], [300, 7], [318, 14], [DURATION, 14],
  ]);
}

/** ATフィールド 強度 (%) */
export function atField(t) {
  return piecewise(t, [
    [0, 100], [318, 100], [326, 100], [330, 34], [332, 0], [DURATION, 0],
  ]);
}

/** 迎撃兵力 残存 (%) */
export function forces(t) {
  return piecewise(t, [
    [0, 100], [88, 100], [104, 46], [112, 40], [141, 26], [160, 18], [174, 12], [DURATION, 12],
  ]);
}

/**
 * 毎フレーム、時刻から全体の状態を決定する。
 * @param {number} t
 * @param {object} c ワールド参照
 */
export function applyTracks(t, c) {
  const angel = c.angel;

  // --- 地形展開 / 走査 ------------------------------------------------------
  c.terrainU.uReveal.value = ramp(t, 0.4, 9.0) * 1.22;
  c.waterU.uReveal.value = c.terrainU.uReveal.value;
  const sweep = (t % 30) / 30;
  c.terrainU.uScanPos.value = -300 + sweep * 600;
  c.terrainU.uScanStrength.value = t < 12 ? 1.0 : 0.42;

  // --- 断面表示 -------------------------------------------------------------
  const cut = ramp(t, 198, 216) * (1 - ramp(t, 356, 370));
  c.terrainU.uCutAmount.value = cut;
  c.cityU.uCut.value = cut;

  // --- 市街 ---------------------------------------------------------------
  c.cityU.uPower.value = 1 - ramp(t, 54, 66) * 0.88 + ramp(t, 360, 372) * 0.88;
  c.cityU.uAlert.value = ramp(t, 24, 30) * (1 - ramp(t, 352, 366));
  // 戦闘配置 — ビル群をジオフロントへ格納する
  c.cityU.uRetract.value = ramp(t, 58, 76) * (1 - ramp(t, 362, 374));

  // --- ジオフロント / 本部 --------------------------------------------------
  c.dogma.userData.setReveal(ramp(t, 186, 210) * (1 - ramp(t, 360, 374)));
  c.dogma.userData.setPlates(ramp(t, 64, 78) * (1 - ramp(t, 356, 370)));
  c.dogma.userData.breachPlate(3, ramp(t, 180, 202));
  c.dogma.userData.breachPlate(2, ramp(t, 190, 204) * 0.7);
  c.dogma.userData.breachPlate(4, ramp(t, 192, 206) * 0.7);
  c.dogma.userData.setBulkheads(bulkheads(t));

  // --- 空 -----------------------------------------------------------------
  c.skyU.uDawnMix.value = ramp(t, 348, DURATION);

  // --- マーカー ------------------------------------------------------------
  for (const def of MARKERS) {
    const m = c.markers.get(def.id);
    if (m) m.userData.setVisible(t >= def.win[0] && t < def.win[1]);
  }
  // 使徒マーカーは実体に追従させる (航跡上を動く)
  const am = c.markers.get('angel');
  if (am) {
    am.position.set(angel.position.x, surfaceY(angel.position.x, angel.position.z), angel.position.z);
  }

  // --- 矢印 ---------------------------------------------------------------
  for (const def of ARROWS) {
    const a = c.arrows.get(def.id);
    if (!a) continue;
    a.userData.setProgress(ramp(t, def.t0, def.t1));
    let o = ramp(t, def.t0 - 0.6, def.t0 + 0.8);
    if (def.fade) o *= 1 - ramp(t, def.fade, def.fade + 6);
    // 地上の矢印は本部侵攻以降 (地下カット) では画面を覆うので退場させる
    if (!def.points3) o *= 1 - ramp(t, 196, 208);
    a.userData.setOpacity(o);
  }

  // --- 使徒 ---------------------------------------------------------------
  angel.visible = t >= 21.5;
  angelAt(t, angel.position);
  // 進行方向へ正対させる
  const ahead = angelAt(Math.min(DURATION, t + 2), _tmpA);
  const dx = ahead.x - angel.position.x;
  const dz = ahead.z - angel.position.z;
  if (Math.hypot(dx, dz) > 1e-4) {
    const heading = Math.atan2(dx, dz);
    angel.rotation.y += (heading - angel.rotation.y) * 0.08;
  }
  if (t >= 344 && !angel.userData.isDestroyed) angel.userData.destroy(t - 344);
  if (t < 344 && angel.userData.isDestroyed) angel.userData.reset();

  angel.userData.setCharge(ramp(t, 96, 110) * 0.35 + ramp(t, 236, 246) * 0.3);
  angel.userData.setBore(ramp(t, 178, 186) * (1 - ramp(t, 202, 210)));
  angel.userData.setCoreGlow(ramp(t, 330, 338) * (1 - ramp(t, 344, 350)));

  // AT フィールド — 在来兵器の攻撃中と、初号機に中和されるまで常時展開
  const atVis =
    ramp(t, 86, 90) * (1 - ramp(t, 106, 112)) * 0.9 +
    ramp(t, 126, 130) * (1 - ramp(t, 142, 148)) * 0.7 +
    ramp(t, 156, 158.6) * (1 - ramp(t, 164, 170)) * 1.0 +
    ramp(t, 284, 288) * (1 - ramp(t, 292, 296)) * 0.6 +
    ramp(t, 322, 326) * (1 - ramp(t, 330, 333)) * 1.0;
  _tmpB.set(0, 0, 0).subVectors(c.camera.position, angel.position).normalize();
  angel.userData.setField(Math.min(1, atVis), _tmpB);

  // 腕 — 平時は畳み、攻撃時に伸ばす
  const armIdle = ramp(t, 24, 30);
  const idleTipL = _tmpA.set(angel.position.x - 0.9, angel.position.y - 0.55, angel.position.z);
  angel.userData.setArm(0, { target: idleTipL, extend: 0.28 + 0.1 * Math.sin(t), wave: 0.05, opacity: armIdle });
  const idleTipR = _tmpB.set(angel.position.x + 0.9, angel.position.y - 0.55, angel.position.z);
  angel.userData.setArm(1, { target: idleTipR, extend: 0.28, wave: 0.05, opacity: armIdle });

  // 弐号機への斬撃
  const slash = ramp(t, 134.5, 137.2) * (1 - ramp(t, 139, 142));
  if (slash > 0.01) {
    trackAt(t, EVA02_TRACK, _tmpA);
    _tmpA.y += 0.34;
    angel.userData.setArm(1, { target: _tmpA, extend: slash, wave: 0.10, opacity: 1 });
  }

  // 装甲板の溶断 — 両腕を真下へ
  const cutArm = ramp(t, 176, 184) * (1 - ramp(t, 204, 212));
  if (cutArm > 0.01) {
    _tmpA.set(angel.position.x - 0.5, GROUND_Y - 0.2, angel.position.z - 0.3);
    angel.userData.setArm(0, { target: _tmpA, extend: cutArm, wave: 0.05, opacity: 1 });
    _tmpB.set(angel.position.x + 0.5, GROUND_Y - 0.2, angel.position.z + 0.3);
    angel.userData.setArm(1, { target: _tmpB, extend: cutArm, wave: 0.05, opacity: 1 });
  }

  // 隔壁の切断 — 縦坑へ腕を落とし込む
  const dogmaArm = ramp(t, 240, 246) * (1 - ramp(t, 268, 274)) + ramp(t, 300, 306) * (1 - ramp(t, 316, 319));
  if (dogmaArm > 0.01) {
    const n = bulkheads(t);
    const y = bulkheadY(Math.min(BULKHEADS - 1, Math.max(0, n)));
    _tmpA.set(CITY.x - 0.25, y, CITY.z - 0.15);
    angel.userData.setArm(0, { target: _tmpA, extend: Math.min(1, dogmaArm), wave: 0.04, opacity: 1 });
    _tmpB.set(CITY.x + 0.25, y + 0.6, CITY.z + 0.15);
    angel.userData.setArm(1, { target: _tmpB, extend: Math.min(1, dogmaArm), wave: 0.04, opacity: 1 });
  }

  // 初号機への攻撃
  const strike = ramp(t, 285, 288.4) * (1 - ramp(t, 291, 295));
  if (strike > 0.01) {
    trackAt(t, EVA01_TRACK, _tmpA);
    _tmpA.y += 0.30;
    angel.userData.setArm(1, { target: _tmpA, extend: strike, wave: 0.08, opacity: 1 });
  }

  // 覚醒後 — 腕を引きちぎられる
  if (t >= 328) {
    const gone = 1 - ramp(t, 328, 330.5);
    angel.userData.setArm(0, { extend: 0.2, wave: 0.3, opacity: gone });
    angel.userData.setArm(1, { extend: 0.2, wave: 0.3, opacity: gone });
  }

  // --- エヴァンゲリオン ------------------------------------------------------
  c.eva02.visible = t >= 111.5;
  trackAt(t, EVA02_TRACK, c.eva02.position);
  c.eva02.rotation.y = t < 137 ? Math.atan2(angel.position.x - c.eva02.position.x, angel.position.z - c.eva02.position.z) : c.eva02.rotation.y;
  c.eva02.userData.setPose(t < 122 ? 'stand' : t < 133 ? 'aim' : t < 137 ? 'guard' : 'fallen');
  c.rifle.visible = t >= 118 && t < 137.2;

  c.eva00.visible = t >= 145.5;
  trackAt(t, EVA00_TRACK, c.eva00.position);
  if (t < 159) {
    c.eva00.rotation.y = Math.atan2(angel.position.x - c.eva00.position.x, angel.position.z - c.eva00.position.z);
  }
  c.eva00.userData.setPose(t < 148 ? 'stand' : t < 158.6 ? 'charge' : 'fallen');
  c.mine.visible = t >= 146 && t < 158.5;

  c.eva01.visible = t >= 267.5;
  trackAt(t, EVA01_TRACK, c.eva01.position);
  c.eva01.rotation.y = Math.atan2(angel.position.x - c.eva01.position.x, angel.position.z - c.eva01.position.z);
  c.eva01.userData.setPose(
    t < 274 ? 'stand'
      : t < 285 ? 'guard'
        : t < 296 ? 'slash'
          : t < 318 ? 'shutdown'
            : t < 326 ? 'berserk'
              : t < 344 ? 'devour'
                : 'berserk'
  );
  c.eva01.userData.setEyeGlow(ramp(t, 317.5, 320));
  c.aura.userData.setAmount(ramp(t, 317.5, 321) * (1 - ramp(t, 360, 372)) * (0.85 + 0.15 * Math.sin(t * 6)));
  c.aura.position.copy(c.eva01.position);
  c.aura.position.y += 0.18;

  // --- 注目領域 ------------------------------------------------------------
  const focus = c.director.lastTarget;
  if (focus) {
    c.terrainU.uFocus.value.copy(focus);
    c.terrainU.uFocusRadius.value = piecewise(t, [
      [0, 0], [10, 0], [22, 16], [76, 26], [110, 14], [174, 11], [204, 11], [DURATION, 11],
    ]);
  }
}

const _tmpA = new THREE.Vector3();
const _tmpB = new THREE.Vector3();

// ---------------------------------------------------------------------------
// 一過性イベント
// ---------------------------------------------------------------------------

export function buildEvents(c) {
  const angelPos = () => c.angel.position.clone();

  const ev = [
    { t: 23, run: () => c.hud.alert('パターン青', 5) },
    { t: 23.2, run: () => c.hud.pushLog('第7観測所 — 未確認物体 感知 / パターン青') },
    { t: 30, run: () => c.hud.pushLog('目標を第10使徒と識別 — 呼称 ゼルエル') },
    { t: 52, run: () => c.hud.pushLog('第2次特別非常事態宣言 — 発令') },
    { t: 58, run: () => c.hud.pushLog('第3新東京市 — 戦闘配置 / 全ビル 格納') },
    { t: 76, run: () => c.hud.pushLog('戦略自衛隊 — 全火力をもって迎撃 開始') },
  ];

  // 砲撃・爆撃の着弾 — ATフィールドで弾かれる
  for (let i = 0; i < 9; i++) {
    const t = 86 + i * 1.9;
    ev.push({
      t,
      run: () => {
        const p = angelPos();
        const a = (i * 2.1) % (Math.PI * 2);
        c.blastAt(p.x + Math.cos(a) * 1.4, p.z + Math.sin(a) * 1.4, 3.4 + (i % 3), 1.2, p.y + (i % 2) * 0.4);
        const d = new THREE.Vector3(Math.cos(a), 0.15, Math.sin(a));
        c.angel.userData.raiseAT(d, 0.8);
        if (i === 0) c.hud.pushLog('砲撃 着弾 — ATフィールドにより偏向');
        if (i === 4) c.director.shake(0.7, 3.0);
      },
    });
  }

  ev.push(
    {
      t: 90.5,
      run: () => {
        const p = angelPos();
        c.blastAt(p.x, p.z - 1.2, 12, 2.0, p.y + 0.6);
        c.director.shake(1.6, 2.6);
        c.hud.flash(0.75, 0.5);
        c.hud.alert('N2兵器 効果なし', 5);
        c.hud.pushLog('国連軍 N2兵器 — 直撃 / 損害 与えられず');
      },
    },
    {
      t: 104,
      run: () => {
        const p = angelPos();
        c.blastAt(p.x - 3.5, p.z - 3.0, 9, 1.8);
        c.blastAt(p.x + 4.0, p.z - 1.5, 7, 1.6);
        c.director.shake(1.3, 3.0);
        c.hud.alert('前線 壊滅', 5);
        c.hud.pushLog('戦略自衛隊 前線部隊 — 壊滅 / 迎撃 続行 不能');
      },
    },
    { t: 111.5, run: () => c.hud.pushLog('弐号機 — 第7ケージより射出') },
    {
      t: 126,
      run: () => {
        const p = angelPos();
        for (let i = 0; i < 3; i++) c.blastAt(p.x + (i - 1) * 0.6, p.z - 0.8, 1.6, 0.7, p.y + 0.2 * i);
        c.angel.userData.raiseAT(new THREE.Vector3(0.2, 0, 1), 0.7);
        c.hud.pushLog('弐号機 — パレットライフル 全弾 命中 / 効果なし');
      },
    },
    {
      t: 137.2,
      run: () => {
        const p = c.eva02.position;
        c.blastAt(p.x, p.z, 2.2, 1.1, p.y + 0.32);
        c.director.shake(1.9, 2.6);
        c.hud.flash(0.8, 0.4);
        c.hud.alert('弐号機 損傷', 5);
        c.hud.pushLog('弐号機 — 頭部 / 両腕 切断 / 神経接続 途絶');
      },
    },
    { t: 146, run: () => c.hud.pushLog('零号機 — N2地雷を携行し 強行突入') },
    {
      t: 158.6,
      run: () => {
        const p = angelPos();
        c.blastAt(p.x - 0.6, p.z - 0.6, 26, 2.8, p.y);
        c.angel.userData.raiseAT(new THREE.Vector3(-0.6, 0.1, 0.8), 1.2);
        c.director.shake(3.4, 1.8);
        c.hud.flash(1.0, 0.9);
        c.hud.alert('N2地雷 起爆', 5);
        c.hud.pushLog('N2地雷 起爆 — ATフィールド 貫通せず / 零号機 大破');
      },
    },
    {
      t: 174,
      run: () => {
        c.hud.alert('本部 直上 到達', 5);
        c.hud.pushLog('目標 — 第3新東京市 中枢区画 直上に静止');
      },
    },
    {
      t: 186,
      run: () => {
        c.blastAt(26, 6, 4.5, 1.6, GROUND_Y + 0.1);
        c.hud.pushLog('第4装甲板 — 溶断 開始 / 装甲厚 3.2 m');
      },
    },
    {
      t: 202,
      run: () => {
        c.blastAt(26, 6, 9, 2.0, GROUND_Y + 0.2);
        c.director.shake(2.2, 2.4);
        c.hud.flash(0.85, 0.6);
        c.hud.alert('装甲板 貫通', 5);
        c.hud.pushLog('ジオフロント天蓋 — 貫通 / 侵入を許す');
      },
    },
    { t: 212, run: () => c.hud.pushLog('本部要員 — 第2発令所へ退避 開始') },
    {
      t: 241,
      run: () => {
        c.director.shake(1.4, 2.8);
        c.hud.alert('第1隔壁 突破', 4);
        c.hud.pushLog('本部 上面装甲 — 第1隔壁 突破');
      },
    },
    { t: 255, run: () => { c.director.shake(1.2, 3.0); c.hud.pushLog('第7隔壁 突破 — 中央ドグマまで残り10層'); } },
    {
      t: 268,
      run: () => {
        c.hud.alert('初号機 出撃', 5);
        c.hud.pushLog('初号機 — 外部電源 接続不能 / 内部電源のみで発進');
      },
    },
    {
      t: 288.4,
      run: () => {
        const p = c.eva01.position;
        c.blastAt(p.x, p.z, 1.6, 0.9, p.y + 0.3);
        c.director.shake(1.8, 2.6);
        c.hud.flash(0.7, 0.4);
        c.hud.alert('初号機 左腕 切断', 5);
        c.hud.pushLog('初号機 — 左腕 切断 / 交戦 継続');
      },
    },
    {
      t: 304,
      run: () => {
        c.hud.alert('活動限界', 6);
        c.hud.pushLog('初号機 — 内部電源 消耗 / 全機能 停止');
      },
    },
    {
      t: 318.5,
      run: () => {
        c.hud.flash(0.9, 0.8);
        c.director.shake(1.6, 2.4);
        c.hud.alert('初号機 再起動', 6);
        c.hud.pushLog('電源系 未接続 — 初号機 自律起動 / パターン青 検出');
      },
    },
    {
      t: 328,
      run: () => {
        const p = angelPos();
        c.blastAt(p.x, p.z, 5, 1.4, p.y);
        c.director.shake(2.6, 2.2);
        c.hud.flash(0.9, 0.5);
        c.hud.pushLog('初号機 — 使徒の両腕を引き千切る');
      },
    },
    {
      t: 330.5,
      run: () => {
        const p = angelPos();
        c.blastAt(p.x, p.z, 8, 1.8, p.y);
        c.director.shake(2.6, 2.2);
        c.hud.flash(0.9, 0.7);
        c.hud.alert('ATフィールド 中和', 5);
        c.hud.pushLog('ATフィールド 中和 — コア 露出');
      },
    },
    {
      t: 338,
      run: () => {
        c.director.shake(1.2, 2.6);
        c.hud.alert('コア 捕食', 5);
        c.hud.pushLog('初号機 — 使徒のコアを捕食 / S²機関 取り込み');
      },
    },
    {
      t: 344,
      run: () => {
        const p = angelPos();
        c.angel.userData.destroy();
        c.blastAt(p.x, p.z, 20, 2.8, p.y);
        c.director.shake(3.4, 1.8);
        c.hud.flash(1.0, 0.9);
        c.hud.pushLog('使徒 — 全機能 停止 / 崩壊');
      },
    },
    {
      t: 351,
      run: () => {
        c.hud.alert('第10使徒 殲滅', 6);
        c.hud.pushLog('第10使徒 — 殲滅 / 反応 完全 消失');
      },
    },
    { t: 366, run: () => c.hud.pushLog('本部機能 維持 — 復旧作業 開始') }
  );

  return ev;
}

// ---------------------------------------------------------------------------
// 進行状況の補助
// ---------------------------------------------------------------------------

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

/**
 * 侵攻深度 (m) — 使徒の下端と、突破された隔壁のうち深い方。
 * 本部直上に到達するまでは 0 (地表基準は本部の直上でのみ意味を持つ)。
 */
export function penetrationM(t, angelPos) {
  const overCity = Math.hypot(angelPos.x - CITY.x, angelPos.z - CITY.z) < 12;
  const bottom = angelPos.y - ANGEL_H * 0.5;
  let d = overCity ? depthM(bottom) : 0;
  const n = bulkheads(t);
  if (n > 0.5) d = Math.max(d, depthM(bulkheadY(Math.min(BULKHEADS - 1, Math.floor(n) - 1))));
  return d;
}

export { terrainY, surfaceY, depthM, bulkheadY, M_PER_UNIT, VE };
