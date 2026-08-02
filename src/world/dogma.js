// ジオフロント / ネルフ本部 / 中央ドグマ — 断面表示用の地下構造
//
// 地表を透過させた「切り欠き断面」で本部侵攻を見せるための一式。
// 深度は地表 (第3新東京市 標高 800 m) からの実距離で計算する。
import * as THREE from 'three';
import { PLACES, terrainY, VE, M_PER_UNIT } from './geo.js';

export const CITY = PLACES.tokyo3;
export const GROUND_Y = terrainY(CITY.x, CITY.z);

export const GEO_R = 14;                      // ジオフロント 半径 1.4 km
export const GEO_TOP_Y = GROUND_Y - 1.6;      // 天蓋 (地殻の裏側)
export const GEO_CENTER_Y = GEO_TOP_Y - GEO_R;
export const GEO_FLOOR_Y = GEO_CENTER_Y - GEO_R;

export const PYRAMID_H = 6.2;                 // 本部ピラミッド 高さ 620 m
export const PYRAMID_R = 3.4;
export const PYRAMID_APEX_Y = GEO_FLOOR_Y + PYRAMID_H;

export const SHAFT_BOTTOM_Y = GEO_FLOOR_Y - 9.4; // ターミナルドグマ
export const BULKHEADS = 17;

/** 本部 頂部甲板 — 射出口が開き、初号機が立つ面 */
export const APEX_R = 0.8;
export const DECK_Y = GEO_FLOOR_Y + PYRAMID_H * (1 - APEX_R / PYRAMID_R);

/** 地表からの深度 (m) */
export function depthM(y) {
  return Math.max(0, ((GROUND_Y - y) / VE) * M_PER_UNIT);
}

/** 隔壁 i の高さ */
export function bulkheadY(i) {
  const top = GEO_FLOOR_Y - 0.4;
  const bottom = SHAFT_BOTTOM_Y + 0.8;
  return top + ((bottom - top) * i) / (BULKHEADS - 1);
}

function ringLine(inner, outer, color, opacity, seg = 96, t0 = 0, tLen = Math.PI * 2) {
  return new THREE.Mesh(
    new THREE.RingGeometry(inner, outer, seg, 1, t0, tLen),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
}

/**
 * ジオフロント一式。
 * setReveal() で断面表示を出し入れし、setBulkheads() で隔壁の突破数を与える。
 */
export function createDogma() {
  const g = new THREE.Group();
  g.name = 'dogma';
  g.position.set(CITY.x, 0, CITY.z);

  const mats = []; // 一括で透過を制御する
  const track = (m, base) => {
    mats.push({ m, base });
    return m;
  };

  // --- 空洞 (球殻) -----------------------------------------------------------
  const cavern = new THREE.Mesh(
    new THREE.SphereGeometry(GEO_R, 48, 28),
    track(
      new THREE.MeshBasicMaterial({
        color: 0x2fd8ff,
        wireframe: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
      0.13
    )
  );
  cavern.position.y = GEO_CENTER_Y;
  g.add(cavern);

  // 空洞の外殻 (岩盤側) — 面で見せて「地中である」ことを示す
  const rock = new THREE.Mesh(
    new THREE.SphereGeometry(GEO_R * 1.005, 40, 24),
    track(
      new THREE.MeshBasicMaterial({
        color: 0x0b1420,
        transparent: true,
        opacity: 0,
        side: THREE.BackSide,
        depthWrite: false,
      }),
      0.92
    )
  );
  rock.position.y = GEO_CENTER_Y;
  g.add(rock);

  // --- 地底湖・地表面 --------------------------------------------------------
  // 手前半分を落とした「切り欠き断面」— 縦坑と隔壁が覗けるようにする
  const CUT0 = Math.PI / 4;
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(GEO_R * 0.985, 72, CUT0, Math.PI),
    track(
      new THREE.MeshBasicMaterial({ color: 0x0d2a24, transparent: true, opacity: 0, depthWrite: false }),
      0.85
    )
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = GEO_FLOOR_Y;
  g.add(floor);

  for (let i = 1; i <= 6; i++) {
    const r = (GEO_R * 0.95 * i) / 6;
    const ring = ringLine(r - 0.035, r, 0x2fd8ff, 0, 96, CUT0, Math.PI);
    track(ring.material, i % 2 === 0 ? 0.30 : 0.16);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = GEO_FLOOR_Y + 0.02;
    g.add(ring);
  }

  const lake = new THREE.Mesh(
    new THREE.CircleGeometry(3.8, 48),
    track(
      new THREE.MeshBasicMaterial({
        color: 0x1a6ea8,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      0.35
    )
  );
  lake.rotation.x = -Math.PI / 2;
  lake.scale.set(1.5, 0.85, 1);
  lake.position.set(-6.2, GEO_FLOOR_Y + 0.03, 4.4);
  g.add(lake);

  // --- 本部ピラミッド --------------------------------------------------------
  // 頂部は切り落とした四角錐台。上面が射出口の甲板になる。
  const frustumH = DECK_Y - GEO_FLOOR_Y;
  const pyramid = new THREE.Mesh(
    new THREE.CylinderGeometry(APEX_R, PYRAMID_R, frustumH, 4, 1),
    track(
      new THREE.MeshStandardMaterial({
        color: 0x1d222c,
        roughness: 0.62,
        metalness: 0.35,
        transparent: true,
        opacity: 0,
      }),
      1
    )
  );
  pyramid.rotation.y = Math.PI / 4;
  pyramid.position.y = GEO_FLOOR_Y + frustumH / 2;
  g.add(pyramid);

  const pyramidWire = new THREE.Mesh(
    new THREE.CylinderGeometry(APEX_R * 1.01, PYRAMID_R * 1.004, frustumH * 1.004, 4, 5),
    track(
      new THREE.MeshBasicMaterial({
        color: 0xff7a1a,
        wireframe: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
      0.55
    )
  );
  pyramidWire.rotation.y = Math.PI / 4;
  pyramidWire.position.copy(pyramid.position);
  g.add(pyramidWire);

  // 頂部の開口部 — 射出口と、初号機が上がってくる甲板
  const apexY = DECK_Y;
  const deck = new THREE.Mesh(
    new THREE.CircleGeometry(APEX_R * 1.0, 4, Math.PI / 4),
    track(
      new THREE.MeshStandardMaterial({
        color: 0x2b3038, roughness: 0.6, metalness: 0.4, transparent: true, opacity: 0,
      }),
      1
    )
  );
  deck.rotation.x = -Math.PI / 2;
  deck.position.y = apexY + 0.01;
  g.add(deck);
  const deckRing = ringLine(APEX_R * 0.86, APEX_R, 0xffb14a, 0, 4, Math.PI / 4);
  track(deckRing.material, 0.7);
  deckRing.rotation.x = -Math.PI / 2;
  deckRing.position.y = apexY + 0.03;
  g.add(deckRing);

  // 逆ピラミッド (地下側の中枢)
  const inverted = new THREE.Mesh(
    new THREE.ConeGeometry(PYRAMID_R * 0.62, PYRAMID_H * 0.55, 4, 3),
    track(
      new THREE.MeshBasicMaterial({
        color: 0xff9a40,
        wireframe: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
      0.32
    )
  );
  inverted.rotation.y = Math.PI / 4;
  inverted.rotation.x = Math.PI;
  inverted.position.y = GEO_FLOOR_Y - (PYRAMID_H * 0.55) / 2;
  g.add(inverted);

  // --- 中央ドグマ 縦坑 -------------------------------------------------------
  const shaftLen = GEO_FLOOR_Y - SHAFT_BOTTOM_Y;
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(1.35, 1.15, shaftLen, 12, 1, true),
    track(
      new THREE.MeshBasicMaterial({
        color: 0x2fd8ff,
        wireframe: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      0.18
    )
  );
  shaft.position.y = SHAFT_BOTTOM_Y + shaftLen / 2;
  g.add(shaft);

  // --- 隔壁 -----------------------------------------------------------------
  const gates = [];
  for (let i = 0; i < BULKHEADS; i++) {
    const y = bulkheadY(i);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff7a1a,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const disc = new THREE.Mesh(new THREE.RingGeometry(0.12, 1.3, 32, 1), mat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = y;
    g.add(disc);
    gates.push({ disc, mat, y, breach: 0 });
  }

  // --- ターミナルドグマ ------------------------------------------------------
  const lcl = ringLine(0, 2.4, 0xff2a3c, 0, 48);
  track(lcl.material, 0.30);
  lcl.rotation.x = -Math.PI / 2;
  lcl.position.y = SHAFT_BOTTOM_Y;
  g.add(lcl);

  const crossMat = track(
    new THREE.MeshBasicMaterial({ color: 0xff5a3c, transparent: true, opacity: 0, depthWrite: false }),
    0.6
  );
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.0, 0.14), crossMat);
  crossV.position.y = SHAFT_BOTTOM_Y + 1.0;
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 0.14), crossMat);
  crossH.position.y = SHAFT_BOTTOM_Y + 1.45;
  g.add(crossV, crossH);

  // --- 射出口 (EVA カタパルト) ------------------------------------------------
  const shafts = [];
  const shaftPos = [
    [1.9, -1.2],
    [-2.2, 0.8],
    [0.6, 2.4],
  ];
  for (const [sx, sz] of shaftPos) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xb388ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const h = GROUND_Y - DECK_Y;
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, h, 8, 1, true), mat);
    tube.position.set(sx, DECK_Y + h / 2, sz);
    g.add(tube);
    shafts.push({
      mesh: tube,
      mat,
      world: new THREE.Vector3(CITY.x + sx, 0, CITY.z + sz),
    });
  }

  // --- 装甲板 (ジオフロント天蓋) ----------------------------------------------
  // 暗い装甲面 + 発光する継ぎ目。貫通した板は面が失われ、地下が覗く。
  const plates = [];
  const PLATE_N = 12;
  const PLATE_IN = 2.4;
  const PLATE_OUT = 11.2;
  const span = (Math.PI * 2) / PLATE_N;
  for (let i = 0; i < PLATE_N; i++) {
    const a0 = i * span;
    const mat = new THREE.MeshBasicMaterial({
      color: 0x1b1d24,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const wedge = new THREE.Mesh(
      new THREE.RingGeometry(PLATE_IN, PLATE_OUT, 10, 1, a0 + 0.010, span - 0.020),
      mat
    );
    wedge.rotation.x = -Math.PI / 2;
    wedge.position.y = GROUND_Y + 0.06;
    g.add(wedge);

    const seamMat = new THREE.MeshBasicMaterial({
      color: 0xff7a1a,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const seam = new THREE.Mesh(
      new THREE.RingGeometry(PLATE_IN, PLATE_OUT, 1, 1, a0 - 0.007, 0.014),
      seamMat
    );
    seam.rotation.x = -Math.PI / 2;
    seam.position.y = GROUND_Y + 0.08;
    g.add(seam);

    plates.push({ mesh: wedge, mat, seamMat, breach: 0, angle: a0 + span / 2 });
  }
  // 外周と内周の縁取り
  const plateBorders = [];
  for (const r of [PLATE_IN, PLATE_OUT]) {
    const ring = ringLine(r - 0.06, r, 0xff7a1a, 0, 96);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = GROUND_Y + 0.08;
    g.add(ring);
    plateBorders.push(ring.material);
  }

  let reveal = 0;
  let plateAmount = 0;

  g.userData = {
    /** 断面表示の出し入れ (0..1) */
    setReveal(v) {
      reveal = Math.min(1, Math.max(0, v));
      for (const { m, base } of mats) {
        m.opacity = base * reveal;
        if (m.visible !== undefined) m.visible = m.opacity > 0.004;
      }
      for (const gt of gates) {
        gt.mat.opacity = (gt.breach > 0.5 ? 0.14 : 0.55) * reveal;
      }
      for (const s of shafts) s.mat.opacity = 0.12 * reveal;
    },
    /** 天蓋装甲の表示 (0..1) */
    setPlates(v) {
      plateAmount = v;
      for (const p of plates) {
        // 貫通した板は面が消え、継ぎ目だけが赤熱して残る
        p.mat.opacity = v * 0.92 * (1 - p.breach);
        p.seamMat.opacity = v * (0.34 + p.breach * 0.5);
        p.seamMat.color.setHex(p.breach > 0.05 ? 0xff3a14 : 0xff7a1a);
      }
      for (const m of plateBorders) m.opacity = v * 0.42;
    },
    /** @param {number} i 装甲板の番号 @param {number} v 0=健全 1=貫通 */
    breachPlate(i, v) {
      const p = plates[((i % PLATE_N) + PLATE_N) % PLATE_N];
      p.breach = v;
      this.setPlates(plateAmount);
    },
    /** 突破された隔壁の数 (小数可) */
    setBulkheads(n) {
      gates.forEach((gt, i) => {
        gt.breach = Math.min(1, Math.max(0, n - i));
        const broken = gt.breach > 0.5;
        gt.mat.color.setHex(broken ? 0x8a2b12 : gt.breach > 0.05 ? 0xff3020 : 0xff7a1a);
        gt.mat.opacity = (broken ? 0.14 : 0.55) * reveal;
        gt.disc.scale.setScalar(1 - gt.breach * 0.08);
      });
    },
    /** 装甲板の位置 (ワールド) — 使徒の侵入点を決めるのに使う */
    plateWorld(i, radius = 6.5) {
      const p = plates[((i % PLATE_N) + PLATE_N) % PLATE_N];
      return new THREE.Vector3(
        CITY.x + Math.cos(p.angle) * radius,
        GROUND_Y,
        CITY.z + Math.sin(p.angle) * radius
      );
    },
    shafts,
    gates,
    /** 本部 頂部甲板の高さ (初号機の立ち位置) */
    deckY: apexY,
    deckR: APEX_R,
    update(dt, t) {
      // 隔壁の走査光
      for (let i = 0; i < gates.length; i++) {
        const gt = gates[i];
        if (gt.breach > 0.05 && gt.breach < 1) {
          gt.mat.opacity = (0.35 + 0.4 * Math.sin(t * 22 + i)) * reveal;
        }
      }
      for (const s of shafts) {
        s.mat.opacity = (0.09 + 0.05 * Math.sin(t * 2.2)) * reveal;
      }
    },
  };

  g.userData.setReveal(0);
  return g;
}
