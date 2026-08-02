// 第10の使徒 — ネルフ本部 侵攻戦 / 進行台本
//
// 準拠: 『ヱヴァンゲリヲン新劇場版:破』の第10の使徒 襲来から、
//   初号機の覚醒 → ニアサードインパクト → カシウスの槍による収束まで。
//   弐号機 (真希波・マリ) の裏コード ザ・ビースト、零号機 (綾波レイ) の捕食、
//   初号機 (碇シンジ) の覚醒を含む。
//
// 表示状態はすべて「時刻の関数」として定義する。タイムラインを巻き戻しても
// 画面が完全に再現されるようにするため。一過性の演出 (爆発・閃光・カメラ衝撃)
// のみ EVENTS としてエッジ検出で発火させる。

import * as THREE from 'three';
import { PLACES, terrainY, surfaceY, VE, M_PER_UNIT } from '../world/geo.js';
import {
  CITY, GROUND_Y, GEO_FLOOR_Y, GEO_TOP_Y, SHAFT_BOTTOM_Y,
  DECK_Y, BULKHEADS, bulkheadY, depthM,
} from '../world/dogma.js';

export const DURATION = 444;
export const T0 = 196; // 装甲板 突破 = 本部侵攻 開始

export const ANGEL_H = 1.05;         // 使徒 全高 105 m
export const EVA01_STAND = { x: CITY.x + 0.42, z: CITY.z + 0.26 };
export const GIANT_H = 24;           // 白き巨人 全高 2.4 km

const _tmpA = new THREE.Vector3();
const _tmpB = new THREE.Vector3();
const _up = new THREE.Vector3(0, -1, 0);

// ---------------------------------------------------------------------------
// 章
// ---------------------------------------------------------------------------

export const CHAPTERS = [
  { t: 0, id: 'pro', ja: '序', en: 'PROLOGUE' },
  { t: 22, id: 'detect', ja: '探知', en: 'DETECTION' },
  { t: 52, id: 'declare', ja: '非常事態宣言', en: 'STATE OF EMERGENCY' },
  { t: 76, id: 'intercept', ja: '第一次迎撃', en: 'FIRST INTERCEPTION' },
  { t: 110, id: 'eva02', ja: '弐号機 出撃', en: 'EVA-02 SORTIE' },
  { t: 140, id: 'beast', ja: 'ザ・ビースト', en: 'THE BEAST' },
  { t: 166, id: 'eva00', ja: '零号機 突入', en: 'EVA-00 ASSAULT' },
  { t: 196, id: 'armor', ja: '装甲板 突破', en: 'ARMOR BREACH' },
  { t: 226, id: 'geofront', ja: 'ジオフロント侵入', en: 'GEOFRONT INCURSION' },
  { t: 258, id: 'hq', ja: '本部侵攻', en: 'HQ PENETRATION' },
  { t: 288, id: 'eva01', ja: '初号機 出撃', en: 'EVA-01 SORTIE' },
  { t: 320, id: 'limit', ja: '活動限界', en: 'POWER EXPIRED' },
  { t: 338, id: 'awake', ja: '覚醒', en: 'AWAKENING' },
  { t: 378, id: 'impact', ja: 'ニアサードインパクト', en: 'NEAR THIRD IMPACT' },
  { t: 412, id: 'end', ja: '収束', en: 'CONTAINMENT' },
];

// ---------------------------------------------------------------------------
// 字幕
// ---------------------------------------------------------------------------

export const CAPTIONS = [
  { t: 2.5, d: 5.5, ja: '西暦2015年 — 箱根 第3新東京市', en: '2015 A.D. — TOKYO-3, HAKONE' },
  { t: 9, d: 6.0, ja: '地下1,850m — 特務機関ネルフ本部', en: '1,850 m BELOW — NERV HEADQUARTERS' },
  { t: 16, d: 5.0, ja: '要塞都市そのものが、本部の装甲である', en: 'THE FORTRESS CITY IS THE ARMOR' },

  { t: 23.5, d: 5.5, ja: '第7観測所 — パターン青、感知', en: 'OBS. POST 7 — PATTERN BLUE DETECTED' },
  { t: 30, d: 6.0, ja: '目標 — 第10の使徒', en: 'TARGET / THE 10TH ANGEL' },
  { t: 37, d: 5.5, ja: '全高105m — 既知の使徒中、最速の進行速度', en: 'HEIGHT 105 m / FASTEST APPROACH ON RECORD' },
  { t: 44, d: 5.0, ja: '進路 — 第3新東京市 直進', en: 'HEADING — DIRECT TO TOKYO-3' },

  { t: 53.5, d: 5.5, ja: '第2次特別非常事態宣言 発令', en: 'SECOND SPECIAL EMERGENCY DECLARED' },
  { t: 60, d: 6.0, ja: '関係各省庁 — 指揮権をネルフへ移譲', en: 'ALL AGENCIES — COMMAND CEDED TO NERV' },
  { t: 67, d: 5.5, ja: '第3新東京市 — 全市民 地下退避 / 戦闘配置', en: 'TOKYO-3 — CIVILIANS SHELTERED / COMBAT CONFIG' },

  { t: 77.5, d: 5.5, ja: '要塞都市 全兵装 展開 — 戦略自衛隊 火力支援', en: 'FORTRESS ARMAMENT DEPLOYED / JSSDF SUPPORTING FIRES' },
  { t: 84, d: 5.5, ja: '国連軍航空隊 — N2兵器 投下', en: 'UN AIR FORCE — N2 ORDNANCE RELEASE' },
  { t: 91, d: 5.5, ja: '着弾 — 効果なし', en: 'IMPACT — NO EFFECT' },
  { t: 97.5, d: 6.0, ja: 'ATフィールドが在来兵器を全て無効化', en: 'A.T. FIELD NULLIFIES ALL CONVENTIONAL ARMS' },
  { t: 104, d: 4.5, ja: '前線 — 壊滅', en: 'FORWARD LINE — DESTROYED' },

  { t: 111.5, d: 5.5, ja: '弐号機 出撃', en: 'EVA-02 — LAUNCH' },
  { t: 118, d: 5.5, ja: '操縦者 — 真希波・マリ・イラストリアス', en: 'PILOT — MAKINAMI MARI ILLUSTRIOUS' },
  { t: 125, d: 5.0, ja: 'パレットライフル — 全弾 命中 / 効果なし', en: 'PALLET RIFLE — ALL ROUNDS ON TARGET / NO EFFECT' },
  { t: 132, d: 5.0, ja: '使徒の腕が伸びる — 兵装 破壊', en: 'THE ANGEL\'S ARMS EXTEND — WEAPON DESTROYED' },

  { t: 141, d: 5.5, ja: '拘束具 解除 — 裏コード「ザ・ビースト」', en: 'RESTRAINTS RELEASED — CODE "THE BEAST"' },
  { t: 147.5, d: 5.5, ja: '弐号機 獣化第2形態 — 制限解除', en: 'EVA-02 BEAST MODE — LIMITERS OFF' },
  { t: 154, d: 5.0, ja: '肉薄 — ATフィールドを侵蝕', en: 'CLOSING IN — A.T. FIELD ERODED' },
  { t: 159.6, d: 5.5, ja: '弐号機 頭部 喪失 — 機体 損壊', en: 'EVA-02 — HEAD LOST / UNIT DISABLED' },

  { t: 167.5, d: 5.5, ja: '零号機 — N2爆雷をもって強行突入', en: 'EVA-00 — N2 MINE / DIRECT ASSAULT' },
  { t: 174, d: 4.0, ja: '操縦者 — 綾波レイ', en: 'PILOT — AYANAMI REI' },
  { t: 178.8, d: 5.0, ja: '起爆 — ATフィールド 健在', en: 'DETONATION — A.T. FIELD INTACT' },
  { t: 184, d: 5.5, ja: '零号機 — 使徒に捕食される', en: 'EVA-00 — DEVOURED BY THE ANGEL' },
  { t: 190, d: 5.0, ja: '綾波レイ — 使徒コアへ取り込まれる', en: 'AYANAMI REI — ABSORBED INTO THE CORE' },

  { t: 197.5, d: 5.5, ja: '目標 — 第3新東京市 中枢区画 直上', en: 'TARGET OVER THE CENTRAL SECTOR' },
  { t: 204, d: 6.0, ja: '装甲板 — 溶断 開始', en: 'ARMOR PLATE — CUTTING BEGINS' },
  { t: 211, d: 5.5, ja: '第4装甲板 貫通 — 厚さ 3.2 m', en: 'PLATE No.4 PIERCED — 3.2 m THICK' },
  { t: 218, d: 5.5, ja: '本部の上に、もう何も無い', en: 'NOTHING LEFT ABOVE THE HEADQUARTERS' },

  { t: 227.5, d: 5.5, ja: '使徒 — ジオフロント侵入', en: 'ANGEL HAS ENTERED THE GEOFRONT' },
  { t: 234, d: 5.5, ja: '本部要員 — 第2発令所へ退避', en: 'HQ PERSONNEL — TO SECONDARY COMMAND' },
  { t: 241, d: 5.5, ja: '直上 1,200 m — 降下中', en: '1,200 m ABOVE HQ — DESCENDING' },
  { t: 248, d: 5.5, ja: '迎撃手段 — 無し', en: 'NO REMAINING MEANS OF INTERCEPTION' },

  { t: 259.5, d: 5.5, ja: '第1隔壁 突破', en: 'BULKHEAD No.1 BREACHED' },
  { t: 266, d: 5.5, ja: '中央ドグマへの直線経路が開いた', en: 'A DIRECT PATH TO CENTRAL DOGMA IS OPEN' },
  { t: 273, d: 5.5, ja: '第7隔壁 — 突破', en: 'BULKHEAD No.7 — BREACHED' },
  { t: 280, d: 5.0, ja: '目標到達まで — 隔壁 残り10層', en: '10 BULKHEADS TO OBJECTIVE' },

  { t: 289.5, d: 5.5, ja: '初号機 — 外部電源 接続不能', en: 'EVA-01 — EXTERNAL POWER UNAVAILABLE' },
  { t: 296, d: 6.0, ja: '内部電源のみ — 活動限界 4分59秒', en: 'INTERNAL POWER ONLY — 4 min 59 s' },
  { t: 303, d: 5.0, ja: '操縦者 — 碇シンジ', en: 'PILOT — IKARI SHINJI' },
  { t: 309, d: 5.5, ja: '初号機 左腕 切断 — 交戦 継続', en: 'EVA-01 LEFT ARM SEVERED — STILL ENGAGED' },
  { t: 315.5, d: 4.0, ja: '残量 — 限界域', en: 'RESERVE — CRITICAL' },

  { t: 321, d: 5.5, ja: '内部電源 消耗 — 初号機 活動停止', en: 'POWER EXHAUSTED — EVA-01 SHUTDOWN' },
  { t: 328, d: 5.0, ja: '全系統 停止 — 生命維持のみ', en: 'ALL SYSTEMS DOWN — LIFE SUPPORT ONLY' },
  { t: 333, d: 4.0, ja: '本部 — 為す術なし', en: 'HQ — NOTHING MORE TO BE DONE' },

  { t: 339, d: 5.0, ja: '初号機 — 再起動', en: 'EVA-01 — REACTIVATED' },
  { t: 344.5, d: 5.5, ja: '電源系 未接続のまま — パターン青 検出', en: 'NO POWER SOURCE — PATTERN BLUE DETECTED' },
  { t: 350.5, d: 5.0, ja: '初号機 暴走 — ATフィールド 中和', en: 'EVA-01 BERSERK — A.T. FIELD NEUTRALIZED' },
  { t: 356, d: 5.0, ja: 'コアへ手を差し入れる', en: 'REACHING INTO THE CORE' },
  { t: 361.5, d: 5.0, ja: '綾波レイ — 救出', en: 'AYANAMI REI — RECOVERED' },
  { t: 367, d: 5.5, ja: '第10の使徒 — 殲滅 / S²機関 取り込み', en: '10TH ANGEL ANNIHILATED / S² ENGINE ASSIMILATED' },
  { t: 373.5, d: 4.0, ja: '初号機 — 覚醒', en: 'EVA-01 — AWAKENED' },

  { t: 379, d: 5.5, ja: '初号機 — 神の座へ至る', en: 'EVA-01 — ASCENDING TO GODHOOD' },
  { t: 385.5, d: 5.5, ja: 'グフの扉 — 開放', en: 'THE DOORS OF GUF — OPENED' },
  { t: 392, d: 5.5, ja: 'ジオフロント — LCL 化 進行', en: 'GEOFRONT — LCL CONVERSION SPREADING' },
  { t: 398.5, d: 5.5, ja: '巨大な人型 — 出現', en: 'A COLOSSAL HUMANOID EMERGES' },
  { t: 405, d: 5.5, ja: 'ニアサードインパクト — 全地球規模へ拡大', en: 'NEAR THIRD IMPACT — EXPANDING GLOBALLY' },

  { t: 413, d: 5.5, ja: '月軌道より — エヴァ Mark.06 降下', en: 'FROM LUNAR ORBIT — EVA MARK.06 DESCENDING' },
  { t: 419, d: 4.5, ja: 'カシウスの槍 — 投擲', en: 'THE SPEAR OF CASSIUS — THROWN' },
  { t: 424.5, d: 5.5, ja: '初号機 — 貫通 / 覚醒 停止', en: 'EVA-01 — PIERCED / AWAKENING HALTED' },
  { t: 430.5, d: 5.5, ja: 'ニアサードインパクト — 収束', en: 'NEAR THIRD IMPACT — CONTAINED' },
  { t: 436, d: 5.0, ja: '損害 — 零号機 喪失 / 弐号機 大破 / 本部 隔壁14層', en: 'DAMAGE: EVA-00 LOST / EVA-02 CRIPPLED / 14 BULKHEADS' },
  { t: 441, d: 3.0, ja: '戦闘終了', en: 'ENGAGEMENT COMPLETE' },
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
  [140, 20, -9, 0.68],
  [156, 21, -7.5, 0.66],
  [166, 21.6, -6, 0.65],
  [176, 22.6, -3, 0.64],
  [186, 24, 0, 0.62],
  [196, 26, 6, 0.60],
];

export const ANGEL_TRACK = [
  ...APPROACH.map(([t, x, z, c]) => [t, [x, terrainY(x, z) + ANGEL_H * 0.5 + c, z]]),
  // 装甲板の溶断 — 高度を落としながら滞空
  [212, [26, GROUND_Y + ANGEL_H * 0.5 + 0.34, 6]],
  [226, [26, GROUND_Y + ANGEL_H * 0.5 + 0.12, 6]],
  // 地殻を抜けてジオフロントへ降下
  [236, [26.1, GEO_TOP_Y - 0.6, 6.1]],
  [246, [26.3, 2.4, 6.2]],
  [258, [26.5, -6.4, 6.3]],
  [266, [26.9, DECK_Y + 1.55, 6.55]],
  // 本部上面での滞空 → 初号機との交戦
  [288, [27.0, DECK_Y + 1.30, 6.62]],
  [300, [27.35, DECK_Y + 0.72, 6.80]],
  [320, [27.20, DECK_Y + 0.78, 6.72]],
  [338, [27.30, DECK_Y + 0.74, 6.78]],
  [350, [27.55, DECK_Y + 0.60, 6.92]],
  [364, [27.62, DECK_Y + 0.52, 6.96]],
  [DURATION, [27.62, DECK_Y + 0.52, 6.96]],
];

const G = (x, z) => terrainY(x, z);

export const EVA02_TRACK = [
  [112, [27.9, G(27.9, 4.8) - 0.42, 4.8]],
  [116, [27.9, G(27.9, 4.8), 4.8]],
  [124, [24.0, G(24, -2), -2.0]],
  [131, [22.6, G(22.6, -4.6), -4.6]],
  // ザ・ビースト — 四つ這いで側面へ回り込む
  [146, [22.4, G(22.4, -4.4), -4.4]],
  [151, [19.6, G(19.6, -8.6), -8.6]],
  [155, [21.4, G(21.4, -10.4), -10.4]],
  [159, [21.9, G(21.9, -9.0), -9.0]],
  [163, [22.1, G(22.1, -8.6), -8.6]],
  [DURATION, [22.1, G(22.1, -8.6), -8.6]],
];

export const EVA00_TRACK = [
  [168, [18.6, G(18.6, 3.4), 3.4]],
  [174, [20.6, G(20.6, 0.8), 0.8]],
  [178.6, [21.9, G(21.9, -1.2), -1.2]],
  [180.5, [20.2, G(20.2, 1.2), 1.2]],
  // 捕食 — 腕に掴まれ、コアへ引き込まれる
  [184, [22.8, G(22.8, -1.4) + 0.3, -1.4]],
  [188, [23.9, 14.0, -0.2]],
  [DURATION, [23.9, 14.0, -0.2]],
];

export const EVA01_TRACK = [
  [288, [EVA01_STAND.x, DECK_Y - 2.6, EVA01_STAND.z]],
  [293, [EVA01_STAND.x, DECK_Y, EVA01_STAND.z]],
  [301, [EVA01_STAND.x + 0.16, DECK_Y, EVA01_STAND.z + 0.10]],
  [320, [EVA01_STAND.x + 0.16, DECK_Y, EVA01_STAND.z + 0.10]],
  [346, [EVA01_STAND.x + 0.30, DECK_Y, EVA01_STAND.z + 0.18]],
  [356, [EVA01_STAND.x + 0.40, DECK_Y, EVA01_STAND.z + 0.24]],
  [368, [EVA01_STAND.x + 0.40, DECK_Y, EVA01_STAND.z + 0.24]],
  // 覚醒 — 本部上面から浮上し、ジオフロントの開口を抜けて天へ
  [376, [EVA01_STAND.x + 0.4, DECK_Y + 2.4, EVA01_STAND.z + 0.24]],
  [386, [CITY.x + 1.2, 2.0, CITY.z + 0.8]],
  [396, [CITY.x + 3.4, 14.0, CITY.z + 2.4]],
  [408, [CITY.x + 5.0, 24.0, CITY.z + 3.6]],
  [DURATION, [CITY.x + 5.0, 24.0, CITY.z + 3.6]],
];

/** Mark.06 — 月軌道からの降下 */
export const MARK06_TRACK = [
  [410, [CITY.x + 30, 150, CITY.z + 30]],
  [418, [CITY.x + 11, 40, CITY.z + 11]],
  [424, [CITY.x + 9.4, 33, CITY.z + 9.4]],
  [DURATION, [CITY.x + 9.4, 33, CITY.z + 9.4]],
];

export function angelAt(t, out) {
  return trackAt(t, ANGEL_TRACK, out);
}

/** 白き巨人の足元高さ */
export function giantY(t) {
  return piecewise(t, [
    [0, -14], [388, -14], [400, 4], [410, GROUND_Y], [DURATION, GROUND_Y],
  ]);
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
  // 実寸 105 m の巨躯を正面から捉える寄りのカット
  { t: 36, pos: [-7.4, 8.4, -96.2], target: [-10.4, 6.5, -100.6], fov: 26, handheld: 1.0 },
  { t: 43, pos: [-4.6, 7.8, -100.2], target: [-9.5, 6.4, -97.8], fov: 27, handheld: 1.0 },
  { t: 52, pos: [-24, 44, -118], target: [-4, 10, -76], fov: 30, handheld: 0.7 },

  // 市街 (戦闘配置)
  { t: 62, pos: [50, 48, 44], target: [26, 12, 6], fov: 30, handheld: 0.7 },
  { t: 72, pos: [10, 66, 30], target: [24, 12, 2], fov: 32, handheld: 0.6 },

  // 迎撃
  { t: 84, pos: [64, 56, -8], target: [4, 16, -44], fov: 30, handheld: 0.9 },
  { t: 96, pos: [52, 40, -14], target: [10, 16, -28], fov: 28, handheld: 1.0 },
  { t: 104, pos: [44, 30, -6], target: [15, 16, -18], fov: 28, handheld: 1.1 },
  { t: 110, pos: [40, 26, 2], target: [18, 15, -15], fov: 29, handheld: 0.9 },

  // 弐号機
  { t: 117, pos: [31.5, 13.9, 8.2], target: [27.9, 13.0, 4.9], fov: 26, handheld: 1.0 },
  { t: 127, pos: [42.1, 20.2, -18.9], target: [21.2, 13.6, -7.1], fov: 28, handheld: 0.9 },
  { t: 135, pos: [32.0, 16.6, -14.6], target: [21.2, 13.8, -7.6], fov: 27, handheld: 1.0 },

  // ザ・ビースト — 低く速いカット
  { t: 143, pos: [27.0, 15.0, -13.0], target: [22.4, 13.2, -5.4], fov: 30, handheld: 1.3 },
  { t: 150, pos: [15.6, 14.8, -12.6], target: [20.2, 13.2, -8.2], fov: 30, handheld: 1.4 },
  { t: 156, pos: [24.8, 15.2, -15.2], target: [21.2, 13.4, -9.6], fov: 28, handheld: 1.4, ease: 'easeOut' },
  { t: 161, pos: [25.6, 15.6, -13.4], target: [21.6, 13.2, -8.8], fov: 28, handheld: 1.2 },
  { t: 166, pos: [30.4, 18.4, -8.4], target: [22.0, 13.4, -7.0], fov: 30, handheld: 1.0 },

  // 零号機
  { t: 172, pos: [13.6, 17.4, 9.0], target: [20.6, 13.4, -0.6], fov: 30, handheld: 0.9 },
  { t: 178, pos: [17.6, 15.6, 4.2], target: [22.2, 13.6, -1.8], fov: 28, handheld: 1.1 },
  { t: 182, pos: [12.0, 22.0, 12.0], target: [22.4, 13.8, -0.6], fov: 30, handheld: 1.3, ease: 'easeOut' },
  { t: 187, pos: [19.6, 16.4, 5.0], target: [23.6, 14.2, -0.6], fov: 27, handheld: 1.1 },
  { t: 193, pos: [22.0, 22.0, 14.0], target: [25.0, 14.0, 2.6], fov: 30, handheld: 0.9 },

  // 装甲板 溶断
  { t: 198, pos: [26, 42, 38], target: [26, 13.4, 6], fov: 32, handheld: 0.6 },
  { t: 208, pos: [32.5, 19.4, 15.6], target: [26.4, 13.3, 6.1], fov: 28, handheld: 0.8 },
  { t: 218, pos: [29.8, 16.8, 11.8], target: [26.2, 13.0, 6.0], fov: 28, handheld: 0.9 },
  { t: 226, pos: [31.0, 17.2, 13.0], target: [26.0, 12.4, 6.0], fov: 28, handheld: 0.9 },

  // ジオフロントへ降下 (地形クランプを外す)
  { t: 234, pos: [32.5, 15.0, 14.5], target: [26.1, 10.8, 6.1], fov: 30, handheld: 0.8, under: 1 },
  { t: 244, pos: [32.0, 8.5, 14.0], target: [26.3, 0.8, 6.2], fov: 32, handheld: 0.7, under: 1 },
  { t: 254, pos: [33.0, 2.0, 15.0], target: [26.4, -8.2, 6.3], fov: 32, handheld: 0.6, under: 1 },
  { t: 258, pos: [31.0, -4.0, 13.0], target: [26.8, -10.4, 6.5], fov: 30, handheld: 0.7, under: 1 },

  // 本部侵攻 — 断面の引き
  { t: 268, pos: [42.0, -11.5, 19.0], target: [26.4, -15.5, 6.3], fov: 34, handheld: 0.7, under: 1 },
  { t: 278, pos: [38.0, -17.0, 17.0], target: [26.2, -20.5, 6.2], fov: 34, handheld: 0.8, under: 1 },
  { t: 288, pos: [25.4, -11.0, 10.2], target: [26.5, -11.8, 6.4], fov: 30, handheld: 0.8, under: 1 },

  // 初号機 交戦
  { t: 296, pos: [24.4, -10.2, 10.6], target: [26.9, -11.4, 6.6], fov: 28, handheld: 0.9, under: 1 },
  { t: 309, pos: [24.8, -10.4, 10.3], target: [26.9, -11.45, 6.6], fov: 27, handheld: 1.1, under: 1 },
  { t: 320, pos: [25.0, -10.6, 10.0], target: [26.85, -11.55, 6.5], fov: 26, handheld: 0.8, under: 1 },
  { t: 332, pos: [25.3, -10.8, 9.6], target: [26.7, -11.7, 6.45], fov: 25, handheld: 0.5, under: 1 },

  // 覚醒
  { t: 339, pos: [25.0, -10.6, 10.0], target: [26.8, -11.6, 6.5], fov: 26, handheld: 1.2, under: 1, ease: 'easeOut' },
  { t: 348, pos: [23.6, -9.8, 11.4], target: [27.2, -11.2, 6.8], fov: 30, handheld: 1.2, under: 1 },
  { t: 358, pos: [24.5, -11.0, 10.5], target: [26.95, -11.6, 6.62], fov: 29, handheld: 1.1, under: 1 },
  { t: 366, pos: [24.2, -10.6, 10.2], target: [26.8, -11.5, 6.6], fov: 28, handheld: 1.0, under: 1 },
  { t: 374, pos: [23.0, -9.0, 11.6], target: [26.9, -11.0, 6.7], fov: 30, handheld: 0.8, under: 1 },

  // 浮上 — 開口部を抜けて地上へ
  { t: 380, pos: [22.0, -7.0, 13.0], target: [26.6, -7.6, 6.6], fov: 32, handheld: 0.8, under: 1 },
  { t: 386, pos: [20.0, 2.0, 16.0], target: [26.4, 2.0, 6.6], fov: 32, handheld: 0.7, under: 1 },
  { t: 392, pos: [14.0, 13.0, 22.0], target: [26.6, 8.0, 6.8], fov: 34, handheld: 0.6 },
  { t: 400, pos: [-6.0, 56.0, 62.0], target: [26.0, 20.0, 6.0], fov: 34, handheld: 0.5 },
  { t: 410, pos: [-34.0, 78.0, 96.0], target: [26.0, 26.0, 6.0], fov: 32, handheld: 0.45 },

  // 収束 — 槍の一撃は寄りで、直後に引いて全景へ
  { t: 416, pos: [28.2, 26.8, 14.6], target: [31.0, 24.5, 9.7], fov: 30, handheld: 0.7 },
  { t: 422, pos: [28.6, 25.8, 13.4], target: [31.0, 24.4, 9.7], fov: 28, handheld: 1.0 },
  { t: 428, pos: [22.0, 33.0, 24.0], target: [29.4, 23.0, 8.6], fov: 30, handheld: 1.1, ease: 'easeOut' },
  { t: 436, pos: [-2.0, 62.0, 82.0], target: [26.0, 18.0, 6.0], fov: 34, handheld: 0.6 },
  { t: DURATION, pos: [-52, 190, 250], target: [18, 14, 4], fov: 32, handheld: 0.35 },
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
    id: 'angel', name: '第10の使徒', code: 'THE 10TH ANGEL', status: '接近中',
    faction: 'ANGEL', pos: { x: -14, z: -124 }, height: 13, ring: 3.6, labelScale: 12,
    labelOffset: [7, -7], win: [23, 44],
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
    id: 'eva02', name: 'エヴァ弐号機', code: 'EVA-02 / PILOT: MAKINAMI', status: '出撃',
    faction: 'EVA02', pos: { x: 24, z: -2 }, height: 1.2, ring: 0.34, labelScale: 11,
    labelOffset: [-2.0, 1.4], win: [112, 200],
  },
  {
    id: 'eva00', name: 'エヴァ零号機', code: 'EVA-00 / PILOT: AYANAMI', status: '突入',
    faction: 'EVA00', pos: { x: 20, z: 1.6 }, height: 1.2, ring: 0.34, labelScale: 11,
    labelOffset: [-2.2, 1.6], win: [168, 186],
  },
  {
    id: 'dogma', name: '中央ドグマ', code: 'CENTRAL DOGMA / 17 BULKHEADS', status: '隔壁 閉鎖',
    faction: 'NERV', pos: PLACES.tokyo3, y: SHAFT_BOTTOM_Y + 3.2, height: 3.4, ring: 1.5,
    labelScale: 10, labelOffset: [7, -4], win: [252, 376],
  },
  {
    id: 'pyramid', name: 'ネルフ本部 中枢', code: 'NERV HQ — PYRAMID', status: '直接侵攻',
    faction: 'NERV', pos: PLACES.tokyo3, y: DECK_Y, height: 2.6, ring: 1.0,
    labelScale: 10, labelOffset: [-6, 4], win: [246, 376],
  },
];

// ---------------------------------------------------------------------------
// 進軍矢印
// ---------------------------------------------------------------------------

export const ARROWS = [
  // 使徒 進路
  {
    id: 'angel-path', color: 0xff2d55, hot: 0xffd0d8, width: 2.1, headLen: 7, hover: 3.4,
    t0: 24, t1: 196, opacity: 0.9,
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
  // 砲兵の射線
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
    t0: 113, t1: 124, fade: 138, points: [[27.9, 4.8], [26, 1], [23.5, -3], [22.6, -4.6]],
  },
  // ザ・ビースト — 側面への回り込み
  {
    id: 'a-beast', color: 0xff3a2a, hot: 0xffe0c8, width: 1.1, headLen: 3.6, hover: 0.6,
    t0: 146, t1: 156, fade: 168, points: [[22.4, -4.4], [20.4, -7.0], [19.6, -8.6], [21.0, -10.2]],
  },
  // 零号機 突入
  {
    id: 'a-eva00', color: 0x5cc8ff, hot: 0xe0f6ff, width: 1.5, headLen: 5, hover: 0.6,
    t0: 169, t1: 178, fade: 190, points: [[18.4, 4.0], [20.4, 1.4], [21.8, -1.0]],
  },
  // 使徒 降下
  {
    id: 'descent', color: 0xff2d55, hot: 0xffd0d8, width: 0.55, headLen: 2.2, opacity: 0.7,
    t0: 222, t1: 266,
    points3: [
      [26, GROUND_Y + 1.4, 6],
      [26.1, GEO_TOP_Y - 0.5, 6.1],
      [26.3, 2.4, 6.2],
      [26.5, -6.4, 6.3],
      [26.9, DECK_Y + 1.2, 6.55],
    ],
  },
  // 本部要員 退避
  {
    id: 'hq-evac1', color: 0x2fd8ff, hot: 0xd8f6ff, width: 0.7, headLen: 2.4, opacity: 0.75,
    t0: 234, t1: 254, fade: 320,
    points3: [
      [26, GEO_FLOOR_Y + 0.12, 6],
      [23.5, GEO_FLOOR_Y + 0.12, 3.2],
      [21.0, GEO_FLOOR_Y + 0.12, 1.6],
      [18.4, GEO_FLOOR_Y + 0.12, 0.8],
    ],
  },
  {
    id: 'hq-evac2', color: 0x2fd8ff, hot: 0xd8f6ff, width: 0.7, headLen: 2.4, opacity: 0.75,
    t0: 236, t1: 256, fade: 320,
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
    t0: 286, t1: 294, fade: 312,
    points3: [
      [EVA01_STAND.x, GEO_FLOOR_Y + 0.4, EVA01_STAND.z],
      [EVA01_STAND.x, DECK_Y - 1.4, EVA01_STAND.z],
      [EVA01_STAND.x, DECK_Y + 0.12, EVA01_STAND.z],
    ],
  },
  // Mark.06 降下経路
  {
    id: 'a-mark06', color: 0xdfe3ea, hot: 0xffffff, width: 1.1, headLen: 4, opacity: 0.8,
    t0: 409, t1: 419, fade: 432,
    points3: [
      [CITY.x + 44, 196, CITY.z + 44],
      [CITY.x + 30, 150, CITY.z + 30],
      [CITY.x + 18, 78, CITY.z + 18],
      [CITY.x + 11, 42, CITY.z + 11],
    ],
  },
];

// ---------------------------------------------------------------------------
// 連続値トラック
// ---------------------------------------------------------------------------

/** 初号機 内部電源 残量 (%) — 活動限界 4分59秒 */
export function reservePower(t) {
  return piecewise(t, [
    [0, 100], [288, 100], [292, 100], [312, 42], [320, 12], [324, 0], [DURATION, 0],
  ]);
}

/** 突破された隔壁の数 */
export function bulkheads(t) {
  return piecewise(t, [
    [0, 0], [258, 0], [261, 1], [273, 7], [288, 7], [320, 7], [338, 14], [DURATION, 14],
  ]);
}

/** ATフィールド 強度 (%) */
export function atField(t) {
  return piecewise(t, [
    [0, 100], [148, 100], [156, 74], [166, 100], [344, 100], [351, 34], [353, 0], [DURATION, 0],
  ]);
}

/** 迎撃兵力 残存 (%) */
export function forces(t) {
  return piecewise(t, [
    [0, 100], [88, 100], [104, 46], [112, 40], [160, 26], [186, 12], [196, 12], [DURATION, 12],
  ]);
}

/** ニアサードインパクト 進行度 (%) */
export function impactProgress(t) {
  return piecewise(t, [
    [0, 0], [374, 0], [386, 22], [398, 55], [408, 82], [420, 96], [424, 100],
    [427, 86], [432, 24], [438, 4], [DURATION, 2],
  ]);
}

/** LCL 化の到達半径 (world unit) */
export function lclRadius(t) {
  return piecewise(t, [
    [0, 0], [388, 0], [398, 26], [408, 72], [420, 130], [425, 138], [431, 96], [438, 18], [DURATION, 0],
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
  const cut = ramp(t, 220, 238) * (1 - ramp(t, 384, 396));
  c.terrainU.uCutAmount.value = cut;
  c.cityU.uCut.value = cut;

  // --- 市街 ---------------------------------------------------------------
  c.cityU.uPower.value = 1 - ramp(t, 54, 66) * 0.88 + ramp(t, 430, 442) * 0.88;
  c.cityU.uAlert.value = ramp(t, 24, 30) * (1 - ramp(t, 424, 438));
  c.cityU.uRetract.value = ramp(t, 58, 76) * (1 - ramp(t, 432, 444));

  // --- ジオフロント / 本部 --------------------------------------------------
  c.dogma.userData.setReveal(ramp(t, 208, 232) * (1 - ramp(t, 386, 400)));
  c.dogma.userData.setPlates(ramp(t, 64, 78) * (1 - ramp(t, 384, 398)));
  c.dogma.userData.breachPlate(3, ramp(t, 202, 224));
  c.dogma.userData.breachPlate(2, ramp(t, 212, 226) * 0.7);
  c.dogma.userData.breachPlate(4, ramp(t, 214, 228) * 0.7);
  c.dogma.userData.setBulkheads(bulkheads(t));

  // --- 空 -----------------------------------------------------------------
  c.skyU.uDawnMix.value = ramp(t, 430, DURATION) * 0.85;
  c.skyU.uImpact.value = Math.min(1, (impactProgress(t) / 100) * 1.15);

  // --- マーカー ------------------------------------------------------------
  for (const def of MARKERS) {
    const m = c.markers.get(def.id);
    if (m) m.userData.setVisible(t >= def.win[0] && t < def.win[1]);
  }
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
    if (!def.points3) o *= 1 - ramp(t, 218, 230);
    a.userData.setOpacity(o);
  }

  // --- 使徒 ---------------------------------------------------------------
  angel.visible = t >= 21.5;
  angelAt(t, angel.position);
  const ahead = angelAt(Math.min(DURATION, t + 2), _tmpA);
  const dx = ahead.x - angel.position.x;
  const dz = ahead.z - angel.position.z;
  if (Math.hypot(dx, dz) > 1e-4) {
    const heading = Math.atan2(dx, dz);
    angel.rotation.y += (heading - angel.rotation.y) * 0.08;
  }
  if (t >= 364 && !angel.userData.isDestroyed) angel.userData.destroy(t - 364);
  if (t < 364 && angel.userData.isDestroyed) angel.userData.reset();

  angel.userData.setCharge(ramp(t, 96, 110) * 0.35 + ramp(t, 258, 268) * 0.3);
  angel.userData.setBore(ramp(t, 200, 208) * (1 - ramp(t, 224, 232)));
  // コア — 零号機を取り込んでからは灯り続け、捕食される瞬間に灼ける
  angel.userData.setCoreGlow(
    ramp(t, 186, 196) * 0.45 * (1 - ramp(t, 350, 356)) + ramp(t, 350, 358) * (1 - ramp(t, 364, 370))
  );

  const atVis =
    ramp(t, 86, 90) * (1 - ramp(t, 106, 112)) * 0.9 +
    ramp(t, 126, 130) * (1 - ramp(t, 136, 142)) * 0.7 +
    ramp(t, 150, 154) * (1 - ramp(t, 160, 166)) * 0.8 +
    ramp(t, 176, 178.8) * (1 - ramp(t, 182, 188)) * 1.0 +
    ramp(t, 304, 308) * (1 - ramp(t, 312, 316)) * 0.6 +
    ramp(t, 344, 348) * (1 - ramp(t, 351, 354)) * 1.0;
  _tmpB.subVectors(c.camera.position, angel.position).normalize();
  angel.userData.setField(Math.min(1, atVis), _tmpB);

  // 腕 — 平時は畳み、攻撃時に伸ばす
  const armIdle = ramp(t, 24, 30);
  angel.userData.setArm(0, {
    target: _tmpA.set(angel.position.x - 0.9, angel.position.y - 0.55, angel.position.z),
    extend: 0.28 + 0.1 * Math.sin(t), wave: 0.05, opacity: armIdle,
  });
  angel.userData.setArm(1, {
    target: _tmpB.set(angel.position.x + 0.9, angel.position.y - 0.55, angel.position.z),
    extend: 0.28, wave: 0.05, opacity: armIdle,
  });

  // 弐号機への攻撃 (初撃で兵装破壊、二撃目で頭部喪失)
  const slash = ramp(t, 132.5, 135) * (1 - ramp(t, 137, 140)) + ramp(t, 157, 159.4) * (1 - ramp(t, 161, 164));
  if (slash > 0.01) {
    trackAt(t, EVA02_TRACK, _tmpA);
    _tmpA.y += 0.32;
    angel.userData.setArm(1, { target: _tmpA, extend: Math.min(1, slash), wave: 0.10, opacity: 1 });
  }

  // 零号機の捕食 — 腕で掴んでコアへ引き寄せる
  const grab = ramp(t, 181, 183.5) * (1 - ramp(t, 188, 191));
  if (grab > 0.01) {
    trackAt(t, EVA00_TRACK, _tmpA);
    _tmpA.y += 0.2;
    angel.userData.setArm(0, { target: _tmpA, extend: Math.min(1, grab), wave: 0.06, opacity: 1 });
  }

  // 装甲板の溶断 — 両腕を真下へ
  const cutArm = ramp(t, 198, 206) * (1 - ramp(t, 226, 234));
  if (cutArm > 0.01) {
    angel.userData.setArm(0, {
      target: _tmpA.set(angel.position.x - 0.5, GROUND_Y - 0.2, angel.position.z - 0.3),
      extend: cutArm, wave: 0.05, opacity: 1,
    });
    angel.userData.setArm(1, {
      target: _tmpB.set(angel.position.x + 0.5, GROUND_Y - 0.2, angel.position.z + 0.3),
      extend: cutArm, wave: 0.05, opacity: 1,
    });
  }

  // 隔壁の切断 — 縦坑へ腕を落とし込む
  const dogmaArm = ramp(t, 258, 264) * (1 - ramp(t, 288, 294)) + ramp(t, 320, 326) * (1 - ramp(t, 336, 339));
  if (dogmaArm > 0.01) {
    const y = bulkheadY(Math.min(BULKHEADS - 1, Math.max(0, bulkheads(t))));
    angel.userData.setArm(0, {
      target: _tmpA.set(CITY.x - 0.25, y, CITY.z - 0.15),
      extend: Math.min(1, dogmaArm), wave: 0.04, opacity: 1,
    });
    angel.userData.setArm(1, {
      target: _tmpB.set(CITY.x + 0.25, y + 0.6, CITY.z + 0.15),
      extend: Math.min(1, dogmaArm), wave: 0.04, opacity: 1,
    });
  }

  // 初号機への攻撃
  const strike = ramp(t, 305, 308.4) * (1 - ramp(t, 311, 315));
  if (strike > 0.01) {
    trackAt(t, EVA01_TRACK, _tmpA);
    _tmpA.y += 0.30;
    angel.userData.setArm(1, { target: _tmpA, extend: strike, wave: 0.08, opacity: 1 });
  }

  // 覚醒後 — 腕を引きちぎられる
  if (t >= 346) {
    const gone = 1 - ramp(t, 346, 349);
    angel.userData.setArm(0, { extend: 0.2, wave: 0.3, opacity: gone });
    angel.userData.setArm(1, { extend: 0.2, wave: 0.3, opacity: gone });
  }

  // --- エヴァンゲリオン ------------------------------------------------------
  c.eva02.visible = t >= 111.5;
  trackAt(t, EVA02_TRACK, c.eva02.position);
  if (t < 159.4) {
    c.eva02.rotation.y = Math.atan2(angel.position.x - c.eva02.position.x, angel.position.z - c.eva02.position.z);
  }
  c.eva02.userData.setPose(
    t < 122 ? 'stand' : t < 132 ? 'aim' : t < 141 ? 'guard' : t < 159.4 ? 'beast' : 'fallen'
  );
  c.rifle.visible = t >= 118 && t < 135;

  c.eva00.visible = t >= 167.5 && t < 189;
  trackAt(t, EVA00_TRACK, c.eva00.position);
  if (t < 179) {
    c.eva00.rotation.y = Math.atan2(angel.position.x - c.eva00.position.x, angel.position.z - c.eva00.position.z);
  }
  c.eva00.userData.setPose(t < 170 ? 'stand' : t < 178.8 ? 'charge' : 'fallen');
  c.eva00.scale.setScalar(1 - ramp(t, 185.5, 188.6) * 0.85); // コアへ引き込まれる
  c.mine.visible = t >= 168 && t < 178.7;

  c.eva01.visible = t >= 287.5;
  trackAt(t, EVA01_TRACK, c.eva01.position);
  if (t < 372) {
    c.eva01.rotation.y = Math.atan2(angel.position.x - c.eva01.position.x, angel.position.z - c.eva01.position.z);
  }
  c.eva01.userData.setPose(
    t < 294 ? 'stand'
      : t < 305 ? 'guard'
        : t < 316 ? 'slash'
          : t < 338 ? 'shutdown'
            : t < 346 ? 'berserk'
              : t < 364 ? 'devour'
                : t < 424 ? 'awaken'
                  : 'pinned'
  );
  c.eva01.userData.setEyeGlow(ramp(t, 337.5, 340));
  c.aura.userData.setAmount(
    ramp(t, 337.5, 341) * (1 - ramp(t, 414, 424) * 0.65) * (1 - ramp(t, 424, 432)) *
    (0.85 + 0.15 * Math.sin(t * 6))
  );
  c.aura.position.copy(c.eva01.position);
  c.aura.position.y += 0.18;

  // --- 覚醒の演出 -----------------------------------------------------------
  const halo = ramp(t, 364, 374) * (1 - ramp(t, 424, 434));
  c.halo.userData.setAmount(halo);
  c.halo.position.copy(c.eva01.position);
  c.halo.position.y += 0.46;
  c.halo.scale.setScalar(1 + ramp(t, 374, 408) * 2.4);

  const pillar = ramp(t, 372, 386) * (1 - ramp(t, 414, 423));
  c.pillar.userData.setAmount(pillar * 0.9);
  c.pillar.position.copy(c.eva01.position);
  c.pillar.position.y += 0.2;

  c.guf.userData.setAmount(ramp(t, 382, 398) * (1 - ramp(t, 424, 436)));

  c.lcl.userData.set(Math.min(1, (impactProgress(t) / 100) * 1.4), lclRadius(t));

  // 白き巨人
  c.giant.userData.setAmount(ramp(t, 388, 400) * (1 - ramp(t, 426, 438)));
  c.giant.position.set(CITY.x - 1.2, giantY(t), CITY.z - 0.6);
  c.giant.rotation.y = 2.4;

  // --- 収束 (Mark.06 / カシウスの槍) ------------------------------------------
  c.mark06.visible = t >= 409.5;
  trackAt(t, MARK06_TRACK, c.mark06.position);
  c.mark06.rotation.y = Math.atan2(
    c.eva01.position.x - c.mark06.position.x,
    c.eva01.position.z - c.mark06.position.z
  );
  c.mark06.userData.setPose(t < 419.5 ? 'guard' : 'stand');

  // 槍 — Mark.06 の手元から初号機へ
  c.spear.visible = t >= 412;
  if (c.spear.visible) {
    const thrown = ramp(t, 419.5, 423);
    _tmpA.copy(c.mark06.position);
    _tmpA.y += 0.30;
    _tmpB.copy(c.eva01.position);
    _tmpB.y += 0.20;
    c.spear.position.lerpVectors(_tmpA, _tmpB, thrown);
    _tmpA.subVectors(c.eva01.position, c.spear.position);
    if (_tmpA.lengthSq() > 1e-6) {
      c.spear.quaternion.setFromUnitVectors(_up, _tmpA.normalize());
    }
    c.spear.scale.setScalar(0.5 + thrown * 0.5);
    c.spear.userData.setGlow(ramp(t, 417, 420) * (1 - ramp(t, 430, 438)));
  }

  // --- 注目領域 ------------------------------------------------------------
  const focus = c.director.lastTarget;
  if (focus) {
    c.terrainU.uFocus.value.copy(focus);
    c.terrainU.uFocusRadius.value = piecewise(t, [
      [0, 0], [10, 0], [22, 16], [76, 26], [110, 14], [196, 11], [226, 11], [386, 30], [DURATION, 60],
    ]);
  }
}

// ---------------------------------------------------------------------------
// 一過性イベント
// ---------------------------------------------------------------------------

export function buildEvents(c) {
  const angelPos = () => c.angel.position.clone();

  const ev = [
    { t: 23, run: () => c.hud.alert('パターン青', 5) },
    { t: 23.2, run: () => c.hud.pushLog('第7観測所 — 未確認物体 感知 / パターン青') },
    { t: 30, run: () => c.hud.pushLog('目標を第10の使徒と識別') },
    { t: 52, run: () => c.hud.pushLog('第2次特別非常事態宣言 — 発令') },
    { t: 58, run: () => c.hud.pushLog('第3新東京市 — 戦闘配置 / 全ビル 格納') },
    { t: 76, run: () => c.hud.pushLog('要塞都市 全兵装 展開 — 迎撃 開始') },
  ];

  for (let i = 0; i < 9; i++) {
    const t = 86 + i * 1.9;
    ev.push({
      t,
      run: () => {
        const p = angelPos();
        const a = (i * 2.1) % (Math.PI * 2);
        c.blastAt(p.x + Math.cos(a) * 1.4, p.z + Math.sin(a) * 1.4, 3.4 + (i % 3), 1.2, p.y + (i % 2) * 0.4);
        c.angel.userData.raiseAT(new THREE.Vector3(Math.cos(a), 0.15, Math.sin(a)), 0.8);
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
    { t: 111.5, run: () => c.hud.pushLog('弐号機 — 射出 / 単独 迎撃') },
    {
      t: 125,
      run: () => {
        const p = angelPos();
        for (let i = 0; i < 3; i++) c.blastAt(p.x + (i - 1) * 0.6, p.z - 0.8, 1.6, 0.7, p.y + 0.2 * i);
        c.angel.userData.raiseAT(new THREE.Vector3(0.2, 0, 1), 0.7);
        c.hud.pushLog('弐号機 — パレットライフル 全弾 命中 / 効果なし');
      },
    },
    {
      t: 135,
      run: () => {
        const p = c.eva02.position;
        c.blastAt(p.x, p.z, 2.0, 1.0, p.y + 0.3);
        c.director.shake(1.5, 2.6);
        c.hud.pushLog('弐号機 — 兵装 破壊 / 接近戦へ移行');
      },
    },
    {
      t: 141,
      run: () => {
        c.hud.alert('ザ・ビースト', 6);
        c.hud.pushLog('拘束具 解除 — 裏コード「ザ・ビースト」承認');
      },
    },
    {
      t: 152,
      run: () => {
        const p = angelPos();
        c.blastAt(p.x - 1.0, p.z - 1.0, 4, 1.2, p.y - 0.2);
        c.director.shake(1.4, 3.0);
        c.hud.pushLog('弐号機 — ATフィールドを侵蝕 / 肉薄');
      },
    },
    {
      t: 159.4,
      run: () => {
        const p = c.eva02.position;
        c.blastAt(p.x, p.z, 2.4, 1.2, p.y + 0.32);
        c.director.shake(2.0, 2.6);
        c.hud.flash(0.8, 0.4);
        c.hud.alert('弐号機 頭部 喪失', 5);
        c.hud.pushLog('弐号機 — 頭部 喪失 / 神経接続 途絶 / 機体 損壊');
      },
    },
    { t: 168, run: () => c.hud.pushLog('零号機 — N2爆雷を携行し 強行突入') },
    {
      t: 178.8,
      run: () => {
        const p = angelPos();
        c.blastAt(p.x - 0.6, p.z - 0.6, 26, 2.8, p.y);
        c.angel.userData.raiseAT(new THREE.Vector3(-0.6, 0.1, 0.8), 1.2);
        c.director.shake(3.4, 1.8);
        c.hud.flash(1.0, 0.9);
        c.hud.alert('N2爆雷 起爆', 5);
        c.hud.pushLog('N2爆雷 起爆 — ATフィールド 貫通せず');
      },
    },
    {
      t: 184,
      run: () => {
        c.director.shake(1.6, 2.6);
        c.hud.alert('零号機 捕食', 6);
        c.hud.pushLog('零号機 — 使徒に捕食 / 操縦者 反応 消失');
      },
    },
    {
      t: 196,
      run: () => {
        c.hud.alert('本部 直上 到達', 5);
        c.hud.pushLog('目標 — 第3新東京市 中枢区画 直上に静止');
      },
    },
    {
      t: 208,
      run: () => {
        c.blastAt(26, 6, 4.5, 1.6, GROUND_Y + 0.1);
        c.hud.pushLog('第4装甲板 — 溶断 開始 / 装甲厚 3.2 m');
      },
    },
    {
      t: 224,
      run: () => {
        c.blastAt(26, 6, 9, 2.0, GROUND_Y + 0.2);
        c.director.shake(2.2, 2.4);
        c.hud.flash(0.85, 0.6);
        c.hud.alert('装甲板 貫通', 5);
        c.hud.pushLog('ジオフロント天蓋 — 貫通 / 侵入を許す');
      },
    },
    { t: 234, run: () => c.hud.pushLog('本部要員 — 第2発令所へ退避 開始') },
    {
      t: 259,
      run: () => {
        c.director.shake(1.4, 2.8);
        c.hud.alert('第1隔壁 突破', 4);
        c.hud.pushLog('本部 上面装甲 — 第1隔壁 突破');
      },
    },
    { t: 273, run: () => { c.director.shake(1.2, 3.0); c.hud.pushLog('第7隔壁 突破 — 中央ドグマまで残り10層'); } },
    {
      t: 288,
      run: () => {
        c.hud.alert('初号機 出撃', 5);
        c.hud.pushLog('初号機 — 外部電源 接続不能 / 内部電源のみで発進');
      },
    },
    {
      t: 308.4,
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
      t: 324,
      run: () => {
        c.hud.alert('活動限界', 6);
        c.hud.pushLog('初号機 — 内部電源 消耗 / 全機能 停止');
      },
    },
    {
      t: 338.5,
      run: () => {
        c.hud.flash(0.9, 0.8);
        c.director.shake(1.6, 2.4);
        c.hud.alert('初号機 再起動', 6);
        c.hud.pushLog('電源系 未接続 — 初号機 自律起動 / パターン青 検出');
      },
    },
    {
      t: 346,
      run: () => {
        const p = angelPos();
        c.blastAt(p.x, p.z, 5, 1.4, p.y);
        c.director.shake(2.6, 2.2);
        c.hud.flash(0.9, 0.5);
        c.hud.pushLog('初号機 — 使徒の両腕を引き千切る');
      },
    },
    {
      t: 351,
      run: () => {
        const p = angelPos();
        c.blastAt(p.x, p.z, 8, 1.8, p.y);
        c.director.shake(2.4, 2.2);
        c.hud.flash(0.9, 0.7);
        c.hud.alert('ATフィールド 中和', 5);
        c.hud.pushLog('ATフィールド 中和 — コア 露出');
      },
    },
    {
      t: 361.5,
      run: () => {
        c.hud.flash(0.8, 0.9);
        c.hud.alert('綾波レイ 救出', 6);
        c.hud.pushLog('コアより 綾波レイ を回収 — 生存を確認');
      },
    },
    {
      t: 364,
      run: () => {
        const p = angelPos();
        c.angel.userData.destroy();
        c.blastAt(p.x, p.z, 22, 2.8, p.y);
        c.director.shake(3.4, 1.8);
        c.hud.flash(1.0, 0.9);
        c.hud.alert('第10の使徒 殲滅', 6);
        c.hud.pushLog('第10の使徒 — 殲滅 / S²機関 取り込み');
      },
    },
    {
      t: 373.5,
      run: () => {
        c.hud.flash(1.0, 1.4);
        c.hud.alert('初号機 覚醒', 8);
        c.hud.pushLog('初号機 — 覚醒 / 光輪 発生');
      },
    },
    {
      t: 386,
      run: () => {
        c.hud.alert('グフの扉 開放', 6);
        c.hud.pushLog('グフの扉 開放 — 事象は人の手を離れた');
      },
    },
    {
      t: 398,
      run: () => {
        c.director.shake(1.4, 1.2);
        c.hud.alert('ニアサードインパクト', 8);
        c.hud.pushLog('ジオフロント LCL 化 — 全地球規模へ拡大中');
      },
    },
    { t: 410, run: () => c.hud.pushLog('月軌道より — エヴァ Mark.06 降下を確認') },
    {
      t: 419.5,
      run: () => {
        c.hud.flash(0.6, 0.5);
        c.hud.pushLog('カシウスの槍 — 投擲');
      },
    },
    {
      t: 423,
      run: () => {
        const p = c.eva01.position;
        c.blastAt(p.x, p.z, 5, 2.0, p.y);
        c.director.shake(3.0, 1.8);
        c.hud.flash(1.0, 1.2);
        c.hud.alert('初号機 貫通 — 事象 停止', 8);
        c.hud.pushLog('カシウスの槍 — 初号機を貫通 / 覚醒 停止');
      },
    },
    { t: 432, run: () => c.hud.pushLog('ニアサードインパクト — 収束 / 事象進行度 低下') },
    { t: 440, run: () => c.hud.pushLog('本部機能 維持 — 復旧作業 開始') }
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

/** 侵攻深度 (m) — 本部直上に到達してから意味を持つ */
export function penetrationM(t, angelPos) {
  const overCity = Math.hypot(angelPos.x - CITY.x, angelPos.z - CITY.z) < 12;
  const bottom = angelPos.y - ANGEL_H * 0.5;
  let d = overCity ? depthM(bottom) : 0;
  const n = bulkheads(t);
  if (n > 0.5) d = Math.max(d, depthM(bulkheadY(Math.min(BULKHEADS - 1, Math.floor(n) - 1))));
  return d;
}

export { terrainY, surfaceY, depthM, bulkheadY, M_PER_UNIT, VE };
