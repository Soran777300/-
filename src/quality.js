// 描画品質の段階設定
//
// 地形は 1 枚の高密度メッシュなので、頂点数と画素密度がそのまま負荷になる。
// 携帯端末は物理解像度が高い割に塗り性能が低いため、分割数・pixelRatio・
// ブルームの解像度をまとめて落とす。

const coarsePointer =
  typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
const shortSide = Math.min(window.innerWidth, window.innerHeight);
const cores = navigator.hardwareConcurrency || 4;

/** 携帯端末とみなすか (タッチ主体かつ画面が小さい) */
export const IS_TOUCH = coarsePointer;
export const IS_MOBILE = coarsePointer && shortSide < 820;

const TIERS = {
  low: {
    name: 'low',
    terrainSeg: 176,
    seaSeg: 104,
    lakeSeg: 84,
    maxPixelRatio: 1.1,
    bloomScale: 0.5,
    bloomStrength: 0.5,
    blastCount: 5,
    ramielFrags: 40,
    anisotropy: 1,
  },
  mid: {
    name: 'mid',
    terrainSeg: 272,
    seaSeg: 150,
    lakeSeg: 116,
    maxPixelRatio: 1.4,
    bloomScale: 0.7,
    bloomStrength: 0.58,
    blastCount: 6,
    ramielFrags: 64,
    anisotropy: 2,
  },
  high: {
    name: 'high',
    terrainSeg: 384,
    seaSeg: 200,
    lakeSeg: 150,
    maxPixelRatio: 1.75,
    bloomScale: 1.0,
    bloomStrength: 0.62,
    blastCount: 8,
    ramielFrags: 90,
    anisotropy: 4,
  },
};

function pick() {
  // URL で明示指定できる (?q=low / mid / high) — 実機確認用
  const forced = new URLSearchParams(location.search).get('q');
  if (forced && TIERS[forced]) return TIERS[forced];
  if (IS_MOBILE) return TIERS.low;
  if (coarsePointer || cores <= 6) return TIERS.mid;
  return TIERS.high;
}

export const QUALITY = pick();
