// NERV エンブレム (インライン SVG)
// 半裁のイチジク葉 + ワードマーク + モットー + 十二星環

function starPath(cx, cy, r, rot = -Math.PI / 2) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.42;
    const a = rot + (i * Math.PI) / 5;
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(2)},${(cy + Math.sin(a) * rad).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}

// 100x100 の箱に収めた葉のシルエット
const LEAF = `
M50,3
C63,3 72,11 74.5,22
C85,18 95,25 92.5,37
C100,43.5 97.5,57.5 88,61.5
C90,72 82,80.5 71.5,78
C69,88 59,92 52.5,85.5
L51.4,100 L48.6,100 L47.5,85.5
C41,92 31,88 28.5,78
C18,80.5 10,72 12,61.5
C2.5,57.5 0,43.5 7.5,37
C5,25 15,18 25.5,22
C28,11 37,3 50,3 Z
`.replace(/\s+/g, ' ');

let uid = 0;

/**
 * @param {object} o
 * @param {number} [o.size]
 * @param {string} [o.color]
 * @param {boolean} [o.stars]
 * @param {boolean} [o.motto]
 * @param {string}  [o.bg] 葉に入れる切り欠きの色 (背景色に合わせる)
 */
export function nervLogo(o = {}) {
  const size = o.size ?? 64;
  const color = o.color ?? 'currentColor';
  const bg = o.bg ?? 'var(--hud-bg, #03060c)';
  const stars = o.stars !== false;
  const motto = o.motto === true;
  const id = 'nerv' + ++uid;

  let starMarkup = '';
  if (stars) {
    const ring = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      ring.push(`<path d="${starPath(100 + Math.cos(a) * 88, 100 + Math.sin(a) * 88, 11.5)}" fill="${color}"/>`);
    }
    starMarkup = ring.join('');
  }

  const mottoMarkup = motto
    ? `<g fill="${color}" font-family="Helvetica Neue, Arial, sans-serif" font-size="8.6" letter-spacing="0.3">
         <rect x="30" y="120" width="2.2" height="32"/>
         <text x="36" y="128">GOD'S IN HIS HEAVEN</text>
         <text x="36" y="138">ALL'S RIGHT WITH</text>
         <text x="36" y="148">THE WORLD</text>
       </g>`
    : '';

  // 葉は右半分のみを見せ、そこへ三角の切り欠きを重ねる
  return `
<svg viewBox="0 0 200 200" width="${size}" height="${size}" role="img" aria-label="NERV">
  <defs>
    <clipPath id="${id}-half"><rect x="96" y="0" width="104" height="200"/></clipPath>
  </defs>
  ${starMarkup}
  <g clip-path="url(#${id}-half)">
    <g transform="translate(46,34) scale(1.06)">
      <path d="${LEAF}" fill="${color}"/>
    </g>
    <path d="M96,54 L96,150 L150,102 Z" fill="${bg}"/>
  </g>
  <text x="18" y="122" fill="${color}"
        font-family="Times New Roman, Georgia, serif" font-size="70" letter-spacing="1">NERV</text>
  ${mottoMarkup}
</svg>`;
}
