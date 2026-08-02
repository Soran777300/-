// 覚醒 → ニアサードインパクト → 収束 で用いる実体
//
//   光輪 (ハロ) / 光柱 / グフの扉 / LCL 化した地表 / 白き巨人 /
//   カシウスの槍
//
// いずれも「時刻の関数」で駆動できるよう、状態は set*() で外から与える。
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// 光輪 (ハロ)
// ---------------------------------------------------------------------------

/** @param {number} r 半径 (world unit) */
export function createHalo(r = 0.42) {
  const g = new THREE.Group();
  g.name = 'halo';

  const mats = [];
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: i === 0 ? 0xfff6d8 : 0xffd280,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    mats.push(mat);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r * (1 + i * 0.12), r * (0.030 - i * 0.008), 8, 64), mat);
    ring.rotation.x = Math.PI / 2;
    rings.push(ring);
    g.add(ring);
  }

  // 光輪の内側に薄い円盤
  const discMat = new THREE.MeshBasicMaterial({
    color: 0xffe9b0,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(r, 48), discMat);
  disc.rotation.x = -Math.PI / 2;
  g.add(disc);

  const light = new THREE.PointLight(0xffd28a, 0, 40, 2);
  g.add(light);

  let amount = 0;
  g.visible = false;

  g.userData = {
    setAmount(v) {
      amount = Math.min(1, Math.max(0, v));
      g.visible = amount > 0.01;
      mats.forEach((m, i) => (m.opacity = amount * (0.95 - i * 0.22)));
      discMat.opacity = amount * 0.10;
      light.intensity = amount * 46;
    },
    update(dt, t) {
      if (!g.visible) return;
      rings.forEach((ring, i) => {
        ring.rotation.z = t * (0.30 + i * 0.14) * (i % 2 ? -1 : 1);
        ring.scale.setScalar(1 + Math.sin(t * 1.6 + i) * 0.02 * amount);
      });
    },
  };
  return g;
}

// ---------------------------------------------------------------------------
// 光柱 — 覚醒した機体から天へ伸びる
// ---------------------------------------------------------------------------

export function createLightPillar(radius = 0.7, height = 220) {
  const uniforms = {
    uTime: { value: 0 },
    uAmount: { value: 0 },
    uColor: { value: new THREE.Color(0xfff0c8) },
    uEdge: { value: new THREE.Color(0xff7a3a) },
  };
  const geo = new THREE.CylinderGeometry(radius, radius * 1.6, height, 32, 1, true);
  geo.translate(0, height / 2, 0);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: /* glsl */ `
        varying vec2 vUv; varying vec3 vN;
        void main() {
          vUv = uv;
          vN = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform float uTime; uniform float uAmount; uniform vec3 uColor; uniform vec3 uEdge;
        varying vec2 vUv; varying vec3 vN;
        void main() {
          float fres = pow(1.0 - abs(vN.z), 1.3);
          float up = pow(1.0 - vUv.y, 1.5);
          float streak = 0.75 + 0.25 * sin(vUv.x * 60.0 + uTime * 3.0);
          vec3 col = mix(uEdge, uColor, up) * streak;
          float a = uAmount * up * (0.30 + 0.70 * fres);
          gl_FragColor = vec4(col, a);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  mesh.visible = false;
  mesh.frustumCulled = false;
  mesh.renderOrder = 22;
  mesh.userData = {
    setAmount(v) {
      uniforms.uAmount.value = v;
      mesh.visible = v > 0.01;
    },
    update(dt, t) {
      uniforms.uTime.value = t;
    },
  };
  return mesh;
}

// ---------------------------------------------------------------------------
// グフの扉 — 上空に開く同心の光環
// ---------------------------------------------------------------------------

export function createGufDoors(y = 90) {
  const g = new THREE.Group();
  g.name = 'guf';
  g.position.y = y;

  const mats = [];
  const rings = [];
  for (let i = 0; i < 4; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: i % 2 ? 0xff5a2a : 0xffd08a,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    mats.push(mat);
    const r = 26 + i * 16;
    const ring = new THREE.Mesh(new THREE.RingGeometry(r, r + 2.2 - i * 0.3, 96), mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = i * 5;
    rings.push(ring);
    g.add(ring);
  }
  g.visible = false;

  let amount = 0;
  g.userData = {
    setAmount(v) {
      amount = Math.min(1, Math.max(0, v));
      g.visible = amount > 0.01;
      mats.forEach((m, i) => (m.opacity = amount * (0.55 - i * 0.08)));
      g.scale.setScalar(0.55 + amount * 0.45);
    },
    update(dt, t) {
      if (!g.visible) return;
      rings.forEach((ring, i) => {
        ring.rotation.z = t * (0.06 + i * 0.03) * (i % 2 ? -1 : 1);
      });
    },
  };
  return g;
}

// ---------------------------------------------------------------------------
// LCL 化 — 地表を覆って広がる赤い面
// ---------------------------------------------------------------------------

export function createLCLFlood(maxRadius = 150) {
  const uniforms = {
    uTime: { value: 0 },
    uAmount: { value: 0 },
    uRadius: { value: 0 },
    uMax: { value: maxRadius },
  };
  const geo = new THREE.CircleGeometry(maxRadius, 128);
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: /* glsl */ `
        varying vec3 vP;
        void main() {
          vP = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform float uTime; uniform float uAmount; uniform float uRadius; uniform float uMax;
        varying vec3 vP;
        void main() {
          float d = length(vP.xz);
          if (d > uRadius) discard;
          float edge = smoothstep(uRadius, uRadius - 6.0, d);
          float wave = 0.5 + 0.5 * sin(d * 0.5 - uTime * 1.6);
          vec3 col = mix(vec3(0.52, 0.03, 0.06), vec3(1.0, 0.22, 0.14), wave * 0.7);
          col += vec3(1.0, 0.5, 0.3) * pow(1.0 - edge, 3.0) * 1.4;
          gl_FragColor = vec4(col, uAmount * (0.55 + 0.35 * edge));
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  mesh.visible = false;
  mesh.renderOrder = 4;
  mesh.userData = {
    /** @param {number} v 0..1 濃度 @param {number} r 到達半径 */
    set(v, r) {
      uniforms.uAmount.value = v;
      uniforms.uRadius.value = r;
      mesh.visible = v > 0.01 && r > 0.5;
    },
    update(dt, t) {
      uniforms.uTime.value = t;
    },
  };
  return mesh;
}

// ---------------------------------------------------------------------------
// カシウスの槍 — 二条の螺旋
// ---------------------------------------------------------------------------

export function createSpear(length = 26) {
  const g = new THREE.Group();
  g.name = 'spear';

  const mat = new THREE.MeshStandardMaterial({
    color: 0xe8ecf2,
    roughness: 0.25,
    metalness: 0.85,
    emissive: new THREE.Color(0x6a7480),
    emissiveIntensity: 0.35,
  });

  // 柄
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.13, length * 0.72, 10), mat);
  shaft.position.y = length * 0.36;
  g.add(shaft);

  // 二条に分かれた穂先 (螺旋)
  for (const s of [-1, 1]) {
    const pts = [];
    const n = 26;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const a = s * u * Math.PI * 1.6;
      const r = 0.34 * Math.sin(Math.PI * u * 0.92);
      pts.push(new THREE.Vector3(Math.cos(a) * r, -length * 0.28 * u, Math.sin(a) * r));
    }
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.075, 8, false),
      mat
    );
    g.add(tube);
  }

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 12),
    new THREE.MeshBasicMaterial({
      color: 0xdff0ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  glow.position.y = -length * 0.28;
  g.add(glow);

  g.visible = false;
  g.userData = {
    setGlow(v) {
      glow.material.opacity = v * 0.85;
      glow.scale.setScalar(1 + v * 1.6);
    },
    /** 先端 (刺さる側) の高さ */
    tipOffset: -length * 0.28,
  };
  return g;
}

// ---------------------------------------------------------------------------
// 白き巨人 — ジオフロントから立ち上がる巨躯
// ---------------------------------------------------------------------------

/**
 * 人型そのものは actors.js の造形を流用する。
 * @param {(t:string,p:object,h:number,pose:string)=>THREE.Object3D} evaFactory
 * @param {number} heightU 全高 (world unit)
 */
export function createGiant(evaFactory, heightU = 24) {
  const fig = evaFactory('06', { x: 0, y: 0, z: 0 }, 0, 'awaken');
  // 実寸 40 m の人型を巨人サイズへ引き伸ばす
  fig.scale.setScalar(heightU / 0.4);
  fig.name = 'giant';
  fig.visible = false;

  // 発光体に置き換える
  const mats = new Set();
  fig.traverse((o) => {
    if (o.material) mats.add(o.material);
  });
  for (const m of mats) {
    if (m.color) m.color.setHex(0xd8dce4);
    if (m.emissive) {
      m.emissive.setHex(0xffcaa8);
      m.emissiveIntensity = 0.22;
    }
    if ('roughness' in m) m.roughness = 0.9;
    if ('metalness' in m) m.metalness = 0.05;
    m.transparent = true;
  }

  const light = new THREE.PointLight(0xffd0a0, 0, 400, 2);
  light.position.y = 0.6 * (heightU / 0.4);
  fig.add(light);

  let amount = 0;
  const base = fig.userData;
  fig.userData = {
    ...base,
    setAmount(v) {
      amount = Math.min(1, Math.max(0, v));
      fig.visible = amount > 0.01;
      for (const m of mats) m.opacity = amount;
      light.intensity = amount * 420;
    },
    update(dt, t) {
      if (!fig.visible) return;
      base.update(dt, t, 1.4);
    },
  };
  return fig;
}
