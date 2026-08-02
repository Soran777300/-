// NERV エンブレム (インライン SVG)
//
// 意匠: 斜線で断ち切られたイチジクの葉 + セリフ体のワードマーク +
//       下方に弧を描くモットー。斜線は左上→右下に走り、葉と文字の双方を横切る。

// 100x100 の箱に収めた葉のシルエット (5裂・尖った裂片)
const LEAF = `
M50,2
C46,14 44,22 41,29
C33,22 24,18 15,19
C19,31 23,40 28,48
C17,53 9,58 3,66
C15,70 26,73 36,76
C40,86 44,93 46,100
L54,100
C56,93 60,86 64,76
C74,73 85,70 97,66
C91,58 83,53 72,48
C77,40 81,31 85,19
C76,18 67,22 59,29
C56,22 54,14 50,2 Z
`.replace(/\s+/g, ' ');

// 斜線 — (x0,y0) から (x1,y1) へ。葉はこの線の右上側だけを残す。
const SX0 = 57;
const SY0 = -8;
const SX1 = 150;
const SY1 = 208;

function starPath(cx, cy, r, rot = -Math.PI / 2) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.42;
    const a = rot + (i * Math.PI) / 5;
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(2)},${(cy + Math.sin(a) * rad).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}

/** 斜線を法線方向へ w だけ広げた帯 */
function slashBand(w) {
  const dx = SX1 - SX0;
  const dy = SY1 - SY0;
  const len = Math.hypot(dx, dy);
  const nx = (dy / len) * w;
  const ny = (-dx / len) * w;
  return `M${SX0 - nx},${SY0 - ny} L${SX1 - nx},${SY1 - ny} L${SX1 + nx},${SY1 + ny} L${SX0 + nx},${SY0 + ny} Z`;
}

let uid = 0;

/**
 * @param {object} o
 * @param {number}  [o.size]
 * @param {string}  [o.color]
 * @param {boolean} [o.stars]  十二星環 (既定 false)
 * @param {boolean} [o.motto]  モットーの弧
 * @param {string}  [o.bg]     斜線に用いる背景色
 */
export function nervLogo(o = {}) {
  const size = o.size ?? 64;
  const color = o.color ?? 'currentColor';
  const bg = o.bg ?? 'var(--hud-bg, #03060c)';
  const stars = o.stars === true;
  const motto = o.motto === true;
  const id = 'nerv' + ++uid;

  let starMarkup = '';
  if (stars) {
    const ring = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      ring.push(`<path d="${starPath(100 + Math.cos(a) * 94, 100 + Math.sin(a) * 94, 8.5)}" fill="${color}"/>`);
    }
    starMarkup = ring.join('');
  }

  const mottoMarkup = motto
    ? `<defs>
         <path id="${id}-arc" d="M12,118 A 94,94 0 0 0 188,112" fill="none"/>
       </defs>
       <text font-family="Times New Roman, Georgia, serif" font-size="8.2"
             letter-spacing="0.3" fill="${color}">
         <textPath href="#${id}-arc" startOffset="1%">GOD'S IN HIS HEAVEN. ALL'S RIGHT WITH THE WORLD.</textPath>
       </text>`
    : '';

  return `
<svg viewBox="0 0 200 200" width="${size}" height="${size}" role="img" aria-label="NERV">
  <defs>
    <clipPath id="${id}-cut">
      <path d="M${SX0},${SY0} L${SX1},${SY1} L212,212 L212,-12 Z"/>
    </clipPath>
  </defs>
  ${starMarkup}
  <g clip-path="url(#${id}-cut)">
    <g transform="translate(56,2) scale(1.15, 1.42)">
      <path d="${LEAF}" fill="${color}"/>
    </g>
  </g>
  <text x="30" y="138" fill="${color}"
        font-family="Times New Roman, Georgia, serif" font-size="58" letter-spacing="1">NERV</text>
  <path d="${slashBand(6)}" fill="${bg}"/>
  ${mottoMarkup}
</svg>`;
}
