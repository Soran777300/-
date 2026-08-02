// 第10使徒 ゼルエル — 板状の巨躯 + 面 (仮面) + 二条のリボン腕
//
// 実寸: 全高 約 105 m (1.05 world unit)。デフォルメはせず、
// 板状胴体・肩塊・仮面・コア・伸縮する腕という原型の構成をそのまま持たせる。
import * as THREE from 'three';

const bodyVert = /* glsl */ `
varying vec3 vNrm;
varying vec3 vPos;
varying vec3 vView;
void main() {
  vNrm = normalize(normalMatrix * normal);
  vPos = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const bodyFrag = /* glsl */ `
precision highp float;
uniform vec3  uBase;
uniform vec3  uEdge;
uniform float uTime;
uniform float uDamage;
uniform float uOpacity;
uniform float uCharge;
varying vec3 vNrm;
varying vec3 vPos;
varying vec3 vView;

void main() {
  vec3 n = normalize(vNrm);
  vec3 v = normalize(vView);
  float fres = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 2.4);

  float lambert = clamp(dot(n, normalize(vec3(-0.38, 0.72, -0.58))), 0.0, 1.0);
  vec3 col = uBase * (0.22 + 0.78 * lambert);

  // 装甲の板目 — 縦方向のリブ
  float rib = smoothstep(0.42, 0.5, abs(fract(vPos.x * 26.0) - 0.5));
  col *= 0.86 + 0.20 * rib;

  col += uEdge * fres * 0.85;

  // 前進時の生体発光
  col += uEdge * uCharge * (0.30 + 0.30 * sin(uTime * 9.0 + vPos.y * 8.0));

  // 損傷 — 亀裂と灼熱
  float crack = smoothstep(0.55, 0.99,
    sin(vPos.x * 47.0) * sin(vPos.y * 39.0) * sin(vPos.z * 61.0) * 0.5 + 0.5);
  col = mix(col, vec3(1.0, 0.32, 0.10), crack * uDamage);

  gl_FragColor = vec4(col, uOpacity);
}
`;

const RIBBON_SEG = 44;

/** リボン腕 — 毎フレーム経路を再構築する帯 */
function createRibbon(color, width) {
  const N = RIBBON_SEG;
  const position = new Float32Array((N + 1) * 2 * 3);
  const aU = new Float32Array((N + 1) * 2);
  const index = [];
  for (let i = 0; i < N; i++) {
    const a = i * 2;
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geo.setAttribute('aU', new THREE.BufferAttribute(aU, 1));
  geo.setIndex(index);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);

  const uniforms = {
    uColor: { value: new THREE.Color(color) },
    uHot: { value: new THREE.Color(0xffd7b0) },
    uOpacity: { value: 0 },
    uTime: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      attribute float aU;
      varying float vU; varying vec2 vUv;
      void main() {
        vU = aU; vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform vec3 uColor; uniform vec3 uHot; uniform float uOpacity; uniform float uTime;
      varying float vU;
      void main() {
        float tip = exp(-pow((1.0 - vU) / 0.10, 2.0));
        vec3 col = uColor * (0.7 + 0.5 * sin(vU * 40.0 - uTime * 6.0));
        col += uHot * tip;
        gl_FragColor = vec4(col, uOpacity * (0.55 + 0.45 * tip));
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 12;

  const _t = new THREE.Vector3();
  const _s = new THREE.Vector3();
  const _p = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  mesh.userData = {
    uniforms,
    /**
     * @param {THREE.Vector3} root 付け根 (ローカル)
     * @param {THREE.Vector3} tip  先端 (ローカル)
     * @param {number} extend 0..1 伸長率
     * @param {number} wave   うねりの強さ
     * @param {number} t
     */
    shape(root, tip, extend, wave, t) {
      const pos = geo.attributes.position.array;
      const us = geo.attributes.aU.array;
      const e = Math.max(0.0001, extend);
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        const ue = u * e;
        _p.lerpVectors(root, tip, ue);
        // うねり — 進行方向に直交する面内で振らせる
        _t.subVectors(tip, root).normalize();
        _s.crossVectors(_t, up);
        if (_s.lengthSq() < 1e-6) _s.set(1, 0, 0);
        _s.normalize();
        const swing = Math.sin(ue * 7.0 - t * 3.4) * wave * Math.sin(Math.PI * ue);
        _p.addScaledVector(_s, swing);
        _p.y += Math.cos(ue * 5.0 + t * 2.2) * wave * 0.35 * Math.sin(Math.PI * ue);

        const w = width * (1 - 0.72 * u);
        const o = i * 6;
        pos[o + 0] = _p.x + _s.x * w;
        pos[o + 1] = _p.y + w * 0.15;
        pos[o + 2] = _p.z + _s.z * w;
        pos[o + 3] = _p.x - _s.x * w;
        pos[o + 4] = _p.y - w * 0.15;
        pos[o + 5] = _p.z - _s.z * w;
        us[i * 2] = u;
        us[i * 2 + 1] = u;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.aU.needsUpdate = true;
    },
    setOpacity(v) {
      uniforms.uOpacity.value = v;
      mesh.visible = v > 0.01;
    },
  };
  return mesh;
}

/**
 * @param {THREE.Vector3} position
 * @param {number} [scale] 全高 (world unit)
 * @param {number} [fragCount]
 */
export function createZeruel(position, scale = 1.05, fragCount = 90) {
  const g = new THREE.Group();
  g.name = 'zeruel';
  g.position.copy(position);

  const W = scale * 0.78;  // 幅
  const H = scale;         // 全高
  const D = scale * 0.15;  // 厚み

  const uniforms = {
    uBase: { value: new THREE.Color(0x8d919a) },
    uEdge: { value: new THREE.Color(0x7fc4ee) },
    uTime: { value: 0 },
    uDamage: { value: 0 },
    uOpacity: { value: 1 },
    uCharge: { value: 0 },
  };
  const bodyMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: bodyVert,
    fragmentShader: bodyFrag,
    transparent: true,
  });

  const shell = new THREE.Group();
  g.add(shell);

  // --- 胴体 (板状 / 下方へ細る) ------------------------------------------------
  // 角柱を 4 分割の円柱から作り、厚み方向だけ潰して「板」にする。
  function slab(topW, botW, h) {
    const g = new THREE.CylinderGeometry(topW * 0.7071, botW * 0.7071, h, 4, 1);
    g.rotateY(Math.PI / 4);
    g.scale(1, 1, D / topW);
    return new THREE.Mesh(g, bodyMat);
  }

  const shoulder = slab(W, W * 0.94, H * 0.20);
  shoulder.position.y = H * 0.24;
  shell.add(shoulder);

  const torso = slab(W * 0.94, W * 0.52, H * 0.52);
  torso.position.y = -H * 0.10;
  shell.add(torso);

  const skirt = slab(W * 0.52, W * 0.12, H * 0.24);
  skirt.position.y = -H * 0.48;
  shell.add(skirt);

  // --- 肩塊 -----------------------------------------------------------------
  for (const s of [-1, 1]) {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(W * 0.24, H * 0.15, D * 1.3), bodyMat);
    pad.position.set(s * W * 0.44, H * 0.29, 0);
    shell.add(pad);
  }

  // --- 仮面 -----------------------------------------------------------------
  const mask = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.44, H * 0.22, D * 0.9),
    new THREE.MeshStandardMaterial({ color: 0x20242b, roughness: 0.65, metalness: 0.25 })
  );
  mask.position.set(0, H * 0.27, D * 0.62);
  shell.add(mask);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfff0c8 });
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(W * 0.13, H * 0.022, D * 0.2), eyeMat);
    eye.position.set(s * W * 0.11, H * 0.30, D * 1.02);
    shell.add(eye);
  }
  // 仮面の骨状リブ
  for (let i = 0; i < 5; i++) {
    const rib = new THREE.Mesh(
      new THREE.BoxGeometry(W * 0.40, H * 0.012, D * 0.25),
      new THREE.MeshStandardMaterial({ color: 0xe6e2d6, roughness: 0.7 })
    );
    rib.position.set(0, H * 0.215 - i * H * 0.020, D * 1.0);
    shell.add(rib);
  }

  // --- コア -----------------------------------------------------------------
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xff2a3c });
  const core = new THREE.Mesh(new THREE.SphereGeometry(scale * 0.075, 20, 16), coreMat);
  core.position.set(0, -H * 0.02, D * 0.62);
  shell.add(core);
  const coreRing = new THREE.Mesh(
    new THREE.TorusGeometry(scale * 0.095, scale * 0.012, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0xff6a4a, transparent: true, opacity: 0.85 })
  );
  coreRing.position.copy(core.position);
  shell.add(coreRing);
  const coreLight = new THREE.PointLight(0xff3040, 6, 14, 2);
  coreLight.position.copy(core.position);
  shell.add(coreLight);

  // --- 腕 (リボン) -----------------------------------------------------------
  const armL = createRibbon(0xe8e2d4, scale * 0.075);
  const armR = createRibbon(0xe8e2d4, scale * 0.075);
  g.add(armL, armR);
  const armRoot = [
    new THREE.Vector3(-W * 0.52, H * 0.24, 0),
    new THREE.Vector3(W * 0.52, H * 0.24, 0),
  ];
  const armTip = [
    new THREE.Vector3(-W * 0.9, -H * 0.4, 0),
    new THREE.Vector3(W * 0.9, -H * 0.4, 0),
  ];
  const armState = [
    { extend: 0, wave: 0.05, opacity: 0 },
    { extend: 0, wave: 0.05, opacity: 0 },
  ];

  // --- AT フィールド ---------------------------------------------------------
  const atGroup = new THREE.Group();
  const atMats = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.MeshBasicMaterial({
      color: 0xff8a1e,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    atMats.push(m);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(scale * (0.95 + i * 0.30), scale * (1.16 + i * 0.30), 8),
      m
    );
    ring.rotation.z = Math.PI / 8;
    atGroup.add(ring);
  }
  const atFill = new THREE.Mesh(
    new THREE.CircleGeometry(scale * 1.55, 8),
    new THREE.MeshBasicMaterial({
      color: 0xff8a1e,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  atFill.rotation.z = Math.PI / 8;
  atGroup.add(atFill);
  g.add(atGroup);

  // --- 掘削光 (装甲板 溶断) ---------------------------------------------------
  const boreMat = new THREE.MeshBasicMaterial({
    color: 0xffa64a,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const bore = new THREE.Mesh(new THREE.ConeGeometry(scale * 0.32, scale * 0.7, 16, 1, true), boreMat);
  bore.position.y = -H * 0.85;
  bore.rotation.x = Math.PI;
  bore.visible = false;
  g.add(bore);
  const boreLight = new THREE.PointLight(0xffa040, 0, 30, 2);
  boreLight.position.y = -H * 0.9;
  g.add(boreLight);

  // --- 破片 -----------------------------------------------------------------
  const fragGeo = new THREE.TetrahedronGeometry(scale * 0.08, 0);
  const fragMat = new THREE.MeshBasicMaterial({ color: 0xd8d2c4, transparent: true, opacity: 0 });
  const frags = new THREE.InstancedMesh(fragGeo, fragMat, fragCount);
  frags.visible = false;
  frags.frustumCulled = false;
  const fragState = [];
  for (let i = 0; i < fragCount; i++) {
    const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    fragState.push({
      p: dir.clone().multiplyScalar(scale * 0.4),
      v: dir.clone().multiplyScalar(1.2 + Math.random() * 3.0),
      r: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(4),
      q: new THREE.Euler(),
    });
  }
  g.add(frags);

  let atTimer = 0;
  let atHold = 0;
  let destroyed = 0;
  const mtx = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  const _local = new THREE.Vector3();

  g.userData = {
    radius: scale * 0.62,
    height: H,
    uniforms,
    core,
    /** AT フィールドを指定方向へ瞬間展開 */
    raiseAT(dirVec3, strength = 1) {
      atGroup.lookAt(g.position.clone().add(dirVec3));
      atTimer = Math.max(atTimer, 1.0 * strength);
    },
    /** AT フィールドの常時展開 (0..1) */
    setField(v, dirVec3) {
      atHold = v;
      if (dirVec3) atGroup.lookAt(g.position.clone().add(dirVec3));
    },
    /**
     * 腕の状態。target はワールド座標。
     * @param {0|1} i 0=左 1=右
     */
    setArm(i, { target, extend = 0, wave = 0.06, opacity = 1 } = {}) {
      if (target) {
        _local.copy(target);
        g.worldToLocal(_local);
        armTip[i].copy(_local);
      }
      armState[i].extend = extend;
      armState[i].wave = wave;
      armState[i].opacity = opacity;
    },
    /** 装甲溶断の発光 */
    setBore(v) {
      boreMat.opacity = v * 0.42;
      bore.visible = v > 0.01;
      bore.scale.setScalar(0.7 + v * 0.35);
      boreLight.intensity = v * 90;
      uniforms.uCharge.value = Math.max(uniforms.uCharge.value, v * 0.6);
    },
    setCharge(v) {
      uniforms.uCharge.value = v;
    },
    /** コアの露出 (捕食シーン) */
    setCoreGlow(v) {
      coreMat.color.setRGB(1, 0.16 + v * 0.5, 0.22 + v * 0.4);
      coreLight.intensity = 6 + v * 40;
      coreRing.scale.setScalar(1 + v * 0.5);
    },
    destroy(elapsed = 0) {
      destroyed = Math.max(0.0001, elapsed);
    },
    get isDestroyed() {
      return destroyed > 0;
    },
    reset() {
      destroyed = 0;
      atTimer = 0;
      uniforms.uDamage.value = 0;
      uniforms.uOpacity.value = 1;
      shell.visible = true;
      frags.visible = false;
      fragMat.opacity = 0;
      for (const s of fragState) {
        const dir = s.v.clone().normalize();
        s.p.copy(dir).multiplyScalar(scale * 0.4);
        s.v.copy(dir).multiplyScalar(1.2 + Math.random() * 3.0);
        s.q.set(0, 0, 0);
      }
    },
    update(dt, t) {
      uniforms.uTime.value = t;
      armL.userData.uniforms.uTime.value = t;
      armR.userData.uniforms.uTime.value = t;

      // 浮遊 — 板状の巨体がわずかに傾ぎながら滞空する
      shell.rotation.z = Math.sin(t * 0.42) * 0.035;
      shell.rotation.x = Math.sin(t * 0.31 + 1.2) * 0.025;
      coreRing.rotation.z = t * 0.8;

      const arms = [armL, armR];
      for (let i = 0; i < 2; i++) {
        const s = armState[i];
        arms[i].userData.setOpacity(s.opacity * uniforms.uOpacity.value);
        if (s.opacity > 0.01) arms[i].userData.shape(armRoot[i], armTip[i], s.extend, s.wave, t);
      }

      const at = Math.max(atHold, atTimer);
      if (at > 0.001) {
        atMats.forEach((m, i) => {
          m.opacity = at * (0.5 - i * 0.12) * (0.6 + 0.4 * Math.sin(t * 18 + i));
        });
        atFill.material.opacity = at * 0.13;
      } else {
        atMats.forEach((m) => (m.opacity = 0));
        atFill.material.opacity = 0;
      }
      if (atTimer > 0) atTimer = Math.max(0, atTimer - dt * 1.3);

      if (destroyed > 0) {
        destroyed += dt;
        const k = destroyed;
        uniforms.uDamage.value = Math.min(1, k * 2.2);
        uniforms.uOpacity.value = Math.max(0, 1 - k * 1.1);
        shell.visible = uniforms.uOpacity.value > 0.01;
        frags.visible = true;
        fragMat.opacity = Math.max(0, 1 - k * 0.26);
        for (let i = 0; i < fragCount; i++) {
          const s = fragState[i];
          s.v.y -= 2.0 * dt;
          s.p.addScaledVector(s.v, dt);
          s.q.x += s.r.x * dt;
          s.q.y += s.r.y * dt;
          s.q.z += s.r.z * dt;
          quat.setFromEuler(s.q);
          mtx.compose(s.p, quat, one);
          frags.setMatrixAt(i, mtx);
        }
        frags.instanceMatrix.needsUpdate = true;
        if (fragMat.opacity <= 0.01) frags.visible = false;
      }
    },
  };

  return g;
}
