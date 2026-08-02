// NERV 戦術表示 HUD
// 参照意匠: エントリープラグ予備電源パネル / MAGI 端末フレーム / 3Dデータビューア
import { nervLogo } from './logo.js';

const ORGS = [
  {
    name: '特務機関ネルフ', code: 'NERV / SPECIAL AGENCY',
    phases: [[0, '作戦統制', 'st-active']],
  },
  {
    name: '戦略自衛隊', code: 'JSSDF / STRATEGIC SDF',
    phases: [[0, '待機', 'st-standby'], [102, '輸送', 'st-work'], [134, '警戒', 'st-active'], [224, '撤収', 'st-done']],
  },
  {
    name: '防衛庁 統合幕僚', code: 'JDA / JOINT STAFF',
    phases: [[0, '待機', 'st-standby'], [40, '調整', 'st-work'], [102, '統制', 'st-active'], [224, '解除', 'st-done']],
  },
  {
    name: '通商産業省', code: 'MITI / POWER CONTROL',
    phases: [[0, '待機', 'st-standby'], [66, '系統切替', 'st-work'], [88, '送電', 'st-active'], [222, '復旧', 'st-done']],
  },
  {
    name: '電力会社連合', code: 'UTILITIES CONSORTIUM',
    phases: [[0, '待機', 'st-standby'], [70, '解列', 'st-work'], [90, '全量供給', 'st-active'], [222, '復電', 'st-done']],
  },
  {
    name: '運輸省', code: 'MOT / TRANSPORT',
    phases: [[0, '待機', 'st-standby'], [102, '経路封鎖', 'st-work'], [130, '維持', 'st-active'], [224, '解除', 'st-done']],
  },
  {
    name: '建設省', code: 'MOC / CONSTRUCTION',
    phases: [[0, '待機', 'st-standby'], [108, '経路啓開', 'st-work'], [130, '完了', 'st-done']],
  },
  {
    name: '気象庁', code: 'JMA / METEOROLOGY',
    phases: [[0, '観測', 'st-work'], [58, '晴 / 風速2', 'st-active']],
  },
];

const SEGS = [
  { id: 2, level: 1.05, on: 20 },
  { id: 3, level: 2.10, on: 38 },
  { id: 4, level: 3.15, on: 55 },
  { id: 5, level: 4.35, on: 70 },
  { id: 6, level: 5.60, on: 85 },
];

const GRAPH_H = 176;
const yAt = (v) => GRAPH_H - 6 - (v / 6) * (GRAPH_H - 26);

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

function pad(n, w = 2) {
  return String(Math.floor(Math.abs(n))).padStart(w, '0');
}

function fmtClock(sec) {
  const s = Math.abs(sec);
  return `${pad(s / 60)}:${pad(s % 60)}.${pad((s * 10) % 10, 1)}`;
}

export function createHUD(opts) {
  const { duration, chapters, onSeek, onTogglePlay, onSpeed, onToggleFree, onRestart } = opts;

  const root = el('div');
  root.id = 'hud';

  // ----------------------------------------------------------------- 枠
  for (const c of ['fc-tl', 'fc-tr', 'fc-bl', 'fc-br']) root.appendChild(el('div', 'frame-corner ' + c));

  // ----------------------------------------------------------------- 上段
  const top = el('div', 'hud-top');
  const brand = el('div', 'brand');
  brand.innerHTML =
    nervLogo({ size: 54, color: 'var(--orange)', stars: true }) +
    `<div class="brand-text">
       <div class="jp-name">特務機関ネルフ</div>
       <div class="en-name">NERV — TACTICAL OPERATIONS DISPLAY</div>
     </div>`;

  const mission = el('div', 'mission');
  mission.innerHTML = `
    <div class="op-name">ヤシマ作戦</div>
    <div class="op-en">OPERATION YASHIMA — 3D OVERHEAD RECONSTRUCTION</div>
    <div class="chapter-bar">
      <span class="chapter-no">CH.00</span>
      <span class="chapter-ja">—</span>
      <span class="chapter-en">—</span>
    </div>`;
  const chapterNo = mission.querySelector('.chapter-no');
  const chapterJa = mission.querySelector('.chapter-ja');
  const chapterEn = mission.querySelector('.chapter-en');

  const sysinfo = el('div', 'sysinfo');
  sysinfo.innerHTML = `
    <div class="badge-23d"><span class="b2d">2D</span><span class="b3d">3D</span></div>
    <div class="row">NERV ONLY — CLASS A</div>
    <div class="row">CODE No.1670054</div>
    <div class="row cam">CAM 000 / ALT 0000 m</div>`;
  const camRow = sysinfo.querySelector('.cam');

  top.append(brand, mission, sysinfo);
  root.appendChild(top);

  // -------------------------------------------------- 左: 予備電源パネル
  const evaPanel = el('div', 'panel-eva hatch');
  const graph = el('div', 'eva-graph');

  const axis = el('div', 'eva-axis');
  for (let v = 0; v <= 6; v += 0.5) {
    const t = el('div', 'tick' + (v % 1 === 0 ? ' major' : ''));
    t.style.top = yAt(v) + 'px';
    axis.appendChild(t);
    if (v % 1 === 0 && v > 0) {
      const l = el('div', 'tick-label', '+' + pad(v));
      l.style.top = yAt(v) + 'px';
      axis.appendChild(l);
    }
  }
  graph.appendChild(axis);

  const sysDefs = [
    { text: 'LIFE SUPPORT SYSTEM', v: 5.15, w: 44, off: 22 },
    { text: 'LINK CONTROL SYSTEM', v: 4.15, w: 44, off: 40 },
    { text: 'EXTERNAL COMMUNICATIONS', v: 3.15, w: 51, off: 60 },
  ];
  const sysBoxes = sysDefs.map((d) => {
    const b = el('div', 'sysbox', `${d.text}<span class="chip"></span>`);
    b.style.top = yAt(d.v) - 10 + 'px';
    b.style.width = d.w + '%';
    graph.appendChild(b);
    return b;
  });

  const segEls = SEGS.map((s, i) => {
    const e = el('div', 'seg', `<span class="seg-label">SEG.${s.id}</span>`);
    e.style.left = 26 + i * 15 + '%';
    e.style.width = '13%';
    e.style.top = yAt(s.level) - 7 + 'px';
    graph.appendChild(e);
    return e;
  });

  const borderLine = el('div', 'border-line', `<div class="rule"></div><div class="cap">BORDER LINE</div>`);
  borderLine.style.top = yAt(0.35) + 'px';
  graph.appendChild(borderLine);

  const reserveBar = el('div', 'reserve-bar');
  reserveBar.style.top = yAt(0) + 8 + 'px';
  reserveBar.style.width = '100%';
  graph.appendChild(reserveBar);

  const evaCaption = el(
    'div',
    'eva-caption',
    `RESERVE ENERGY REMAINING<br>EVA-01 : ENTRY PLUG &nbsp;<span class="val">100.0 %</span>`
  );
  const reserveVal = evaCaption.querySelector('.val');

  evaPanel.append(graph, evaCaption);
  root.appendChild(evaPanel);

  // ------------------------------------------------------------ 右パネル
  const right = el('div', 'hud-right');

  const powerPanel = el('div', 'panel hatch');
  powerPanel.innerHTML = `
    <div class="head"><span class="ja">電力集中率</span><span class="en">POWER CONVERGENCE</span></div>
    <div class="gauge-big"><span class="v">0.0</span><small>%</small></div>
    <div class="gauge-track"><div class="gauge-fill" style="width:0%"></div></div>
    <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:9.5px;opacity:.7;letter-spacing:.1em">
      <span>SUPPLY 18.0 TW</span><span>CONV. 8.7 %</span>
    </div>`;
  const powerVal = powerPanel.querySelector('.v');
  const powerFill = powerPanel.querySelector('.gauge-fill');

  const orgPanel = el('div', 'panel');
  orgPanel.innerHTML = `<div class="head"><span class="ja">関係機関</span><span class="en">PARTICIPATING AGENCIES</span></div>`;
  const orgRows = ORGS.map((o) => {
    const r = el('div', 'org-row');
    r.innerHTML = `<div><div class="name">${o.name}</div><div class="code">${o.code}</div></div>
                   <div class="state st-standby">待機</div>`;
    orgPanel.appendChild(r);
    return { row: r, state: r.querySelector('.state'), def: o };
  });

  right.append(powerPanel, orgPanel);
  root.appendChild(right);

  // ------------------------------------------------------------ 目標情報
  const targetPanel = el('div', 'panel panel-target');
  targetPanel.innerHTML = `
    <div class="head"><span class="ja">目標情報</span><span class="en">TARGET DATA</span></div>
    <dl class="kv">
      <dt>目標</dt><dd>第5使徒 ラミエル</dd>
      <dt>パターン</dt><dd class="pat">青 / BLUE</dd>
      <dt>ATフィールド</dt><dd class="at">100 %</dd>
      <dt>射距離</dt><dd class="rng">— m</dd>
      <dt>目標高度</dt><dd class="alt">— m</dd>
      <dt>兵装</dt><dd>陽電子砲 / POSITRON</dd>
      <dt>射撃可能数</dt><dd class="shots">1</dd>
    </dl>`;
  const patEl = targetPanel.querySelector('.pat');
  const atEl = targetPanel.querySelector('.at');
  const rngEl = targetPanel.querySelector('.rng');
  const altEl = targetPanel.querySelector('.alt');
  const shotsEl = targetPanel.querySelector('.shots');
  root.appendChild(targetPanel);

  // ---------------------------------------------------------------- ログ
  const logBox = el('div', 'hud-log');
  root.appendChild(logBox);

  // -------------------------------------------------------------- 時刻
  const clock = el('div', 'hud-clock');
  clock.innerHTML = `<div class="t minus">T-00:00.0</div><div class="lbl">MISSION TIME</div>`;
  const clockT = clock.querySelector('.t');
  root.appendChild(clock);

  // -------------------------------------------------------------- 字幕
  const caption = el('div', 'hud-caption');
  caption.innerHTML = `<div class="ja"></div><div class="en"></div>`;
  const capJa = caption.querySelector('.ja');
  const capEn = caption.querySelector('.en');
  root.appendChild(caption);

  // -------------------------------------------------------------- 警報
  const alertBox = el('div', 'hud-alert');
  root.appendChild(alertBox);

  // -------------------------------------------------------------- 照準
  const reticle = el('div');
  reticle.id = 'reticle';
  reticle.innerHTML = `
    <svg viewBox="0 0 190 190" width="190" height="190">
      <g fill="none" stroke="#ff2d55" stroke-width="2.5">
        <path d="M12,44 L12,12 L44,12"/><path d="M146,12 L178,12 L178,44"/>
        <path d="M178,146 L178,178 L146,178"/><path d="M44,178 L12,178 L12,146"/>
      </g>
      <g class="spin" stroke="#ff2d55" stroke-width="1.2" fill="none" opacity="0.8">
        <circle cx="95" cy="95" r="62" stroke-dasharray="10 16"/>
      </g>
      <g stroke="#ff2d55" stroke-width="1.4">
        <path d="M95,58 L95,76"/><path d="M95,114 L95,132"/>
        <path d="M58,95 L76,95"/><path d="M114,95 L132,95"/>
      </g>
      <circle cx="95" cy="95" r="3" fill="#ff2d55"/>
    </svg>
    <div class="rlabel">TARGET LOCK<br>PATTERN BLUE</div>`;
  const reticleSpin = reticle.querySelector('.spin');
  const reticleLabel = reticle.querySelector('.rlabel');
  root.appendChild(reticle);

  // ------------------------------------------------------------ 操作卓
  const transport = el('div', 'hud-transport');
  const track = el('div', 'tl-track');
  track.innerHTML = `<div class="tl-bar"></div><div class="tl-fill"></div><div class="tl-head"></div>`;
  const tlFill = track.querySelector('.tl-fill');
  const tlHead = track.querySelector('.tl-head');

  const chapterEls = chapters.map((ch, i) => {
    const c = el('div', 'tl-chapter', `${pad(i)} ${ch.ja}`);
    c.style.left = (ch.t / duration) * 100 + '%';
    c.dataset.t = ch.t;
    track.appendChild(c);
    return c;
  });

  const controls = el('div', 'tl-controls');
  const btnPlay = el('button', 'btn', '⏸ 一時停止');
  const btnBack = el('button', 'btn', '⏪ -10s');
  const btnFwd = el('button', 'btn', '⏩ +10s');
  const btnRestart = el('button', 'btn', '⏮ 先頭へ');
  const btnFree = el('button', 'btn', '自由視点 F');
  const btnHud = el('button', 'btn', 'HUD H');
  const speedWrap = el('div', 'tl-controls');
  const speedBtns = [0.5, 1, 2].map((s) => {
    const b = el('button', 'btn' + (s === 1 ? ' on' : ''), '×' + s);
    b.onclick = () => {
      speedBtns.forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      onSpeed(s);
    };
    speedWrap.appendChild(b);
    return b;
  });
  const timeEl = el('div', 'tl-time', '00:00 / 00:00');
  const hint = el('div', 'tl-hint', 'SPACE 再生 / ←→ 10秒 / 1-9 章 / F 自由視点 / H HUD');

  controls.append(btnRestart, btnBack, btnPlay, btnFwd, speedWrap, btnFree, btnHud, hint, timeEl);
  transport.append(track, controls);
  root.appendChild(transport);

  btnPlay.onclick = () => onTogglePlay();
  btnBack.onclick = () => onSeek(-10, true);
  btnFwd.onclick = () => onSeek(10, true);
  btnRestart.onclick = () => onRestart();
  btnFree.onclick = () => onToggleFree();
  btnHud.onclick = () => api.toggleHud();

  let dragging = false;
  const seekFromEvent = (e) => {
    const r = track.getBoundingClientRect();
    const x = Math.min(r.width, Math.max(0, (e.clientX ?? 0) - r.left));
    onSeek((x / r.width) * duration, false);
  };
  track.addEventListener('pointerdown', (e) => {
    dragging = true;
    track.setPointerCapture(e.pointerId);
    seekFromEvent(e);
  });
  track.addEventListener('pointermove', (e) => dragging && seekFromEvent(e));
  track.addEventListener('pointerup', (e) => {
    dragging = false;
    track.releasePointerCapture(e.pointerId);
  });
  chapterEls.forEach((c) =>
    c.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      onSeek(parseFloat(c.dataset.t) + 0.01, false);
    })
  );

  // ---------------------------------------------------------------- 発光
  const flashEl = el('div');
  flashEl.id = 'flash';
  document.body.appendChild(flashEl);

  document.body.appendChild(root);

  // ================================================================ API
  let flashAmt = 0;
  let flashDecay = 1;
  let alertTimer = 0;
  const logLines = [];

  const api = {
    root,
    flash(amp, dur = 0.5) {
      flashAmt = Math.max(flashAmt, amp);
      flashDecay = 1 / Math.max(0.05, dur);
    },
    alert(msg, dur = 4) {
      alertBox.textContent = msg;
      alertBox.classList.add('on');
      alertTimer = dur;
    },
    pushLog(msg) {
      const line = el('div', 'line', msg);
      logBox.appendChild(line);
      logLines.push(line);
      while (logLines.length > 6) logLines.shift().remove();
    },
    clearLog() {
      logLines.splice(0).forEach((l) => l.remove());
    },
    setPlaying(p) {
      btnPlay.textContent = p ? '⏸ 一時停止' : '▶ 再生';
    },
    setFree(f) {
      btnFree.classList.toggle('on', f);
    },
    toggleHud() {
      root.classList.toggle('hidden');
      btnHud.classList.toggle('on', root.classList.contains('hidden'));
    },

    /**
     * @param {object} s 表示状態
     * @param {number} dt
     */
    update(s, dt) {
      // 章
      chapterNo.textContent = 'CH.' + pad(s.chapterIndex);
      chapterJa.textContent = s.chapter.ja;
      chapterEn.textContent = s.chapter.en;
      chapterEls.forEach((c, i) => c.classList.toggle('cur', i === s.chapterIndex));

      // 予備電源
      const r = s.reserve;
      reserveVal.textContent = r.toFixed(1) + ' %';
      reserveBar.style.width = Math.max(2, r) + '%';
      reserveBar.classList.toggle('low', r < 32);
      segEls.forEach((e, i) => e.classList.toggle('off', r < SEGS[i].on));
      sysBoxes.forEach((b, i) => b.classList.toggle('off', r < sysDefs[i].off));

      // 電力
      powerVal.textContent = s.power.toFixed(1);
      powerFill.style.width = s.power + '%';

      // 機関
      for (const o of orgRows) {
        let cur = o.def.phases[0];
        for (const p of o.def.phases) if (s.t >= p[0]) cur = p;
        o.state.textContent = cur[1];
        o.state.className = 'state ' + cur[2];
        o.row.classList.toggle('idle', cur[2] === 'st-standby');
      }

      // 目標
      const dead = s.at <= 0.5;
      patEl.textContent = dead ? '反応 消失' : '青 / BLUE';
      patEl.classList.toggle('warn', dead);
      atEl.textContent = dead ? '0 %' : s.at.toFixed(0) + ' %';
      rngEl.textContent = s.range > 0 ? Math.round(s.range).toLocaleString('en-US') + ' m' : '— m';
      altEl.textContent = Math.round(s.altitude).toLocaleString('en-US') + ' m';
      shotsEl.textContent = s.t < 176 ? '1' : s.t < 208 ? '1 (再充填)' : '0';

      // 時刻
      const mt = s.t - s.T0;
      const counting = mt >= -10 && mt < 0;
      clock.classList.toggle('count', counting);
      if (counting) {
        clockT.textContent = Math.ceil(-mt).toString();
        clockT.className = 't';
      } else {
        clockT.textContent = (mt < 0 ? 'T-' : 'T+') + fmtClock(mt);
        clockT.className = 't' + (mt < 0 ? ' minus' : '');
      }

      // 字幕
      if (s.caption) {
        capJa.textContent = s.caption.ja;
        capEn.textContent = s.caption.en;
        caption.classList.add('on');
      } else {
        caption.classList.remove('on');
      }

      // 照準
      if (s.targetScreen && !dead) {
        reticle.style.left = s.targetScreen.x + 'px';
        reticle.style.top = s.targetScreen.y + 'px';
        const k = s.targetScreen.scale;
        reticle.style.transform = `scale(${k.toFixed(3)})`;
        // 枠だけを拡縮し、文字は一定サイズに保つ
        reticleLabel.style.transform = `translateY(-50%) scale(${(1 / k).toFixed(3)})`;
        reticleLabel.style.transformOrigin = 'left center';
        reticle.classList.add('on');
        reticleSpin.setAttribute('transform', `rotate(${(s.t * 22) % 360} 95 95)`);
      } else {
        reticle.classList.remove('on');
      }

      // カメラ情報
      camRow.textContent = `CAM ${pad(s.chapterIndex * 7 + 101, 3)} / ALT ${pad(s.camAlt, 4)} m`;

      // タイムライン
      const k = s.t / duration;
      tlFill.style.width = k * 100 + '%';
      tlHead.style.left = k * 100 + '%';
      timeEl.textContent = `${pad(s.t / 60)}:${pad(s.t % 60)} / ${pad(duration / 60)}:${pad(duration % 60)}`;

      // 発光・警報の減衰
      if (flashAmt > 0.001) {
        flashAmt = Math.max(0, flashAmt - flashDecay * dt);
        flashEl.style.opacity = String(Math.pow(flashAmt, 1.6));
      } else if (flashEl.style.opacity !== '0') {
        flashEl.style.opacity = '0';
      }
      if (alertTimer > 0) {
        alertTimer -= dt;
        if (alertTimer <= 0) alertBox.classList.remove('on');
      }
    },
  };

  return api;
}

// -------------------------------------------------------------- タイトル画面

export function createTitleCard(onStart) {
  const tc = el('div');
  tc.id = 'titlecard';
  tc.innerHTML = `
    <div class="tc-panel">
      <span class="corner-tag ct-tl">Menu 2-35</span>
      <span class="corner-tag ct-bl">Code No.1670054</span>
      <span class="corner-tag ct-br">NERV ONLY</span>
      <div class="tc-title">ヤシマ作戦</div>
      <div class="tc-sub">3D 俯瞰 作戦記録</div>
      <div class="tc-note">OPERATION YASHIMA — 3D OVERHEAD OPERATIONAL RECONSTRUCTION</div>
    </div>
    <div class="tc-strip">
      <span class="jp">MAGI 記録データ 再生</span>
      <span class="en">VIEWER OF VARIOUS THREE-DIMENSIONAL DATA RECORDED BY THE MAGI</span>
    </div>
    <button class="tc-start">再生 / START</button>`;
  document.body.appendChild(tc);
  tc.querySelector('.tc-start').onclick = () => {
    tc.classList.add('gone');
    onStart();
  };
  return tc;
}
