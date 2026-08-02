// 決定論的ノイズ群 (CPU側の地形生成に使用)
// GPU 側と値を共有する必要はないが、地形メッシュ・ユニット配置・進軍矢印の
// 接地高さがすべて同じ関数を参照するため、必ず決定論的であること。

function hash2(ix, iy) {
  let h = Math.imul(ix | 0, 374761393) ^ Math.imul(iy | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// quintic smoothstep (C2連続) — 等高線シェーダで微分が破綻しないように
function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function valueNoise(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const u = fade(fx);
  const v = fade(fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

export function fbm(x, y, octaves = 5, lacunarity = 2.03, gain = 0.5) {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * (valueNoise(x * freq, y * freq) * 2 - 1);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm; // -1..1
}

// 尾根状ノイズ — 山体のディテール用
export function ridged(x, y, octaves = 4, lacunarity = 2.11, gain = 0.5) {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(valueNoise(x * freq, y * freq) * 2 - 1);
    sum += amp * n * n;
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm; // 0..1
}

export function smoothstep(e0, e1, x) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

export function clamp(x, a, b) {
  return x < a ? a : x > b ? b : x;
}

export function mix(a, b, t) {
  return a + (b - a) * t;
}

// シード付き擬似乱数 (都市生成・部隊配置の再現性確保)
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
