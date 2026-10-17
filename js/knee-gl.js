/* ===========================================================
   Rodilla 3D en WebGL (Three.js)
   - Hero: la rodilla se flexiona sola y un goniómetro marca el ángulo.
   - Sección LCA: se puede girar y pulsar cada estructura.
   Si no hay WebGL, se queda la versión CSS/SVG de respaldo.
   =========================================================== */
import * as THREE from './vendor/three.module.min.js';

var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

var COLORS = {
  bone: 0xf5ece6,
  acl: 0xff2d3f,
  pcl: 0xc2185b,
  collateral: 0xf4a7a3,
  meniscus: 0xffb3a1,
  tendon: 0xf7d5c8,
  ring: 0xff4757
};

function supportsWebGL() {
  try {
    var c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

function lathe(points, segments) {
  return new THREE.LatheGeometry(points.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), segments || 48);
}

/* Textura radial para el halo de suelo */
function glowTexture(color) {
  var c = document.createElement('canvas');
  c.width = c.height = 128;
  var g = c.getContext('2d');
  var grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, color);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  var t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createKnee(container, opts) {
  opts = opts || {};
  if (!container || !supportsWebGL()) return null;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  var dist = opts.distance || 6.4;
  var camDir = new THREE.Vector3(3.4, 0.6, 4.6).normalize();
  camera.position.copy(camDir.multiplyScalar(dist)).add(new THREE.Vector3(0, opts.targetY || -0.2, 0));
  camera.lookAt(0, opts.targetY || -0.2, 0);

  /* ---- Luces ---- */
  scene.add(new THREE.HemisphereLight(0xfff4f2, 0x2a0c12, 0.9));
  var key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(3, 4, 5);
  scene.add(key);
  var rim = new THREE.PointLight(0xff2d3f, opts.dark ? 26 : 14, 12);
  rim.position.set(-2.4, 0.8, -2.2);
  scene.add(rim);
  var fill = new THREE.PointLight(0xff8a7a, 6, 10);
  fill.position.set(2.5, -1.8, 1.5);
  scene.add(fill);

  /* ---- Materiales ---- */
  function boneMat() {
    return new THREE.MeshPhysicalMaterial({ color: COLORS.bone, roughness: 0.48, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.5, sheen: 0.4, sheenColor: new THREE.Color(0xffd6cf), transparent: true });
  }
  function softMat(color, emissive, ei) {
    return new THREE.MeshStandardMaterial({ color: color, roughness: 0.35, metalness: 0.05, emissive: emissive || 0x000000, emissiveIntensity: ei || 0, transparent: true });
  }

  var root = new THREE.Group();
  scene.add(root);
  var parts = {}; // nombre -> [mesh]
  function tag(mesh, name) {
    mesh.userData.part = name;
    mesh.userData.baseEmissive = mesh.material.emissiveIntensity || 0;
    (parts[name] = parts[name] || []).push(mesh);
    return mesh;
  }

  /* ---- Fémur ---- */
  var femur = new THREE.Group();
  root.add(femur);
  var femurShaft = new THREE.Mesh(lathe([
    [0.0, 3.6], [0.27, 3.58], [0.28, 2.6], [0.29, 1.8], [0.28, 1.2], [0.31, 0.75], [0.42, 0.42], [0.56, 0.16], [0.6, 0.0], [0.5, -0.12], [0.0, -0.16]
  ]), boneMat());
  femurShaft.scale.z = 0.85;
  femur.add(tag(femurShaft, 'femur'));
  var condGeo = new THREE.SphereGeometry(0.34, 40, 28);
  [-0.3, 0.3].forEach(function (x) {
    var cond = new THREE.Mesh(condGeo, femurShaft.material);
    cond.position.set(x, -0.16, -0.06);
    cond.scale.set(0.95, 0.95, 1.22);
    femur.add(tag(cond, 'femur'));
  });

  /* ---- Tibia (gira alrededor del eje de la rodilla) ---- */
  var PIVOT = new THREE.Vector3(0, -0.2, -0.05);
  var tibia = new THREE.Group();
  tibia.position.copy(PIVOT);
  root.add(tibia);
  var tibiaMesh = new THREE.Mesh(lathe([
    [0.0, -0.3], [0.62, -0.31], [0.67, -0.37], [0.6, -0.52], [0.42, -0.78], [0.31, -1.15], [0.26, -1.9], [0.27, -2.6], [0.29, -3.1], [0.0, -3.14]
  ]), boneMat());
  tibiaMesh.scale.z = 0.8;
  tibia.add(tag(tibiaMesh, 'tibia'));
  var fibula = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 2.1, 8, 16), tibiaMesh.material);
  fibula.position.set(0.52, -1.78, -0.16);
  tibia.add(tag(fibula, 'tibia'));
  var fibHead = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 16), tibiaMesh.material);
  fibHead.position.set(0.52, -0.66, -0.16);
  tibia.add(tag(fibHead, 'tibia'));

  /* ---- Meniscos (en forma de C sobre la meseta tibial) ---- */
  var menMat = softMat(COLORS.meniscus, 0xff6b57, 0.08);
  [[-0.3, 0.25], [0.3, -0.25]].forEach(function (cfg) {
    var m = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.06, 14, 48, Math.PI * 1.65), menMat);
    m.rotation.x = Math.PI / 2;
    m.rotation.z = cfg[0] < 0 ? Math.PI * 0.18 : Math.PI * 1.17;
    m.position.set(cfg[0], -0.28, 0.0);
    m.scale.set(1, 1.15, 0.8);
    tibia.add(tag(m, 'menisco'));
  });

  /* ---- Rótula ---- */
  var patella = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 24), boneMat());
  patella.scale.set(1, 1.25, 0.5);
  root.add(tag(patella, 'patella'));
  var PATELLA_REST = new THREE.Vector3(0, 0.22, 0.66);

  /* ---- Ligamentos y tendones (se recalculan con la flexión) ---- */
  var ligaments = [];
  function ligament(name, color, radius, femurPt, tibiaPt, bend, emissive, ei) {
    var mat = softMat(color, emissive, ei);
    var mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat);
    root.add(tag(mesh, name));
    var l = { mesh: mesh, a: new THREE.Vector3().fromArray(femurPt), b: new THREE.Vector3().fromArray(tibiaPt), bend: new THREE.Vector3().fromArray(bend || [0, 0, 0]), r: radius, aFromPatella: null, bOnTibia: true };
    ligaments.push(l);
    return l;
  }
  // coordenadas: fémur en espacio raíz, tibia en espacio local de la tibia
  ligament('lca', COLORS.acl, 0.058, [0.14, -0.3, -0.2], [-0.06, -0.3, 0.2], [0.02, 0, 0.04], 0xff1a2e, 0.55);
  ligament('lcp', COLORS.pcl, 0.062, [-0.14, -0.32, 0.06], [0.02, -0.36, -0.36], [-0.02, -0.04, 0], 0x8a0f3a, 0.3);
  ligament('colateral', COLORS.collateral, 0.045, [-0.6, -0.08, 0.0], [-0.6, -0.86, 0.02], [-0.06, 0, 0], 0, 0);
  ligament('colateral', COLORS.collateral, 0.042, [0.6, -0.08, -0.04], [0.52, -0.6, -0.16], [0.06, 0, 0], 0, 0);
  var patTendon = ligament('tendon', COLORS.tendon, 0.07, [0, 0, 0], [0, -0.74, 0.36], [0, 0, 0.05], 0, 0);
  patTendon.aFromPatella = new THREE.Vector3(0, -0.24, 0);
  var quadTendon = ligament('tendon', COLORS.tendon, 0.09, [0, 0.95, 0.24], [0, 0, 0], [0, 0, 0.06], 0, 0);
  quadTendon.bOnTibia = false;
  quadTendon.bFromPatella = new THREE.Vector3(0, 0.25, 0);

  /* ---- Goniómetro (arco que marca el ángulo de flexión) ---- */
  var gonio = new THREE.Group();
  gonio.position.copy(PIVOT).add(new THREE.Vector3(0.95, 0, 0));
  gonio.rotation.y = Math.PI / 2;
  root.add(gonio);
  var ringMat = new THREE.MeshBasicMaterial({ color: COLORS.ring, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false });
  var ringTrack = new THREE.Mesh(new THREE.RingGeometry(0.72, 0.745, 64, 1, -Math.PI / 2, Math.PI * 0.78), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: opts.dark ? 0.16 : 0.35, side: THREE.DoubleSide, depthWrite: false }));
  gonio.add(ringTrack);
  var ring = new THREE.Mesh(new THREE.BufferGeometry(), ringMat);
  gonio.add(ring);
  var ringDot = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), ringMat);
  gonio.add(ringDot);
  gonio.visible = opts.goniometer !== false;

  /* ---- Halo bajo la rodilla + partículas ---- */
  var halo = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ map: glowTexture(opts.dark ? 'rgba(255,45,63,0.55)' : 'rgba(214,40,57,0.28)'), transparent: true, depthWrite: false }));
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = -3.2;
  scene.add(halo);

  var pCount = opts.particles === false ? 0 : 160;
  var pGeo = new THREE.BufferGeometry();
  var pPos = new Float32Array(pCount * 3);
  for (var i = 0; i < pCount; i++) {
    var rr = 1.3 + Math.random() * 1.4, th = Math.random() * Math.PI * 2;
    pPos[i * 3] = Math.cos(th) * rr;
    pPos[i * 3 + 1] = -2.2 + Math.random() * 4.6;
    pPos[i * 3 + 2] = Math.sin(th) * rr;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  var particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: opts.dark ? 0xff8a7a : 0xd62839, size: 0.025, transparent: true, opacity: 0.7, depthWrite: false }));
  scene.add(particles);

  root.position.y = 0.1;

  /* ---- Actualización de la flexión ---- */
  var tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpM = new THREE.Vector3();
  var patQuat = new THREE.Quaternion();
  var X = new THREE.Vector3(1, 0, 0);

  function setFlexion(deg) {
    var rad = THREE.MathUtils.degToRad(deg);
    tibia.rotation.x = rad;
    tibia.updateMatrix();

    // la rótula se desliza por la tróclea (aprox. 60% del ángulo)
    var pr = rad * 0.62;
    patQuat.setFromAxisAngle(X, pr);
    patella.position.copy(PATELLA_REST).sub(PIVOT).applyQuaternion(patQuat).add(PIVOT);
    patella.rotation.x = pr;
    patella.updateMatrix();

    ligaments.forEach(function (l) {
      if (l.aFromPatella) tmpA.copy(l.aFromPatella).applyMatrix4(patella.matrix);
      else tmpA.copy(l.a);
      if (l.bFromPatella) tmpB.copy(l.bFromPatella).applyMatrix4(patella.matrix);
      else if (l.bOnTibia) tmpB.copy(l.b).applyMatrix4(tibia.matrix);
      else tmpB.copy(l.b);
      tmpM.copy(tmpA).lerp(tmpB, 0.5).add(l.bend);
      var curve = new THREE.CatmullRomCurve3([tmpA.clone(), tmpM.clone(), tmpB.clone()]);
      l.mesh.geometry.dispose();
      l.mesh.geometry = new THREE.TubeGeometry(curve, 24, l.r, 10, false);
    });

    if (gonio.visible) {
      ring.geometry.dispose();
      ring.geometry = new THREE.RingGeometry(0.69, 0.775, 64, 1, -Math.PI / 2, Math.max(0.001, rad));
      ringDot.position.set(Math.cos(-Math.PI / 2 + rad) * 0.73, Math.sin(-Math.PI / 2 + rad) * 0.73, 0);
    }
    if (opts.onAngle) opts.onAngle(Math.round(deg));
  }

  /* ---- Selección de estructuras ---- */
  var selected = opts.highlight || null;
  function applySelection() {
    Object.keys(parts).forEach(function (name) {
      parts[name].forEach(function (m) {
        var on = !selected || name === selected || (selected === 'femur' && name === 'femur');
        m.material.opacity = on ? 1 : 0.22;
        m.material.depthWrite = on;
      });
    });
  }
  function select(name) {
    selected = name;
    applySelection();
  }
  if (opts.dim) applySelection();

  /* ---- Interacción: arrastrar para girar + parallax ---- */
  var yaw = opts.yaw || -0.35, pitch = 0, targetYaw = yaw, targetPitch = 0;
  var dragging = false, lastX = 0, lastY = 0, moved = 0, hovering = false;
  var el = renderer.domElement;
  el.style.touchAction = 'pan-y';
  el.addEventListener('pointerdown', function (e) { dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY; });
  window.addEventListener('pointerup', function () { dragging = false; });
  el.addEventListener('pointerenter', function () { hovering = true; });
  el.addEventListener('pointerleave', function () { hovering = false; });
  window.addEventListener('pointermove', function (e) {
    if (dragging) {
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      targetYaw += dx * 0.01;
      targetPitch = THREE.MathUtils.clamp(targetPitch + dy * 0.004, -0.35, 0.35);
      moved += Math.abs(dx) + Math.abs(dy);
      lastX = e.clientX; lastY = e.clientY;
    } else if (opts.parallax) {
      var px = e.clientX / window.innerWidth - 0.5, py = e.clientY / window.innerHeight - 0.5;
      targetPitch = py * 0.25;
      parallaxYaw = px * 0.5;
    }
  });
  var parallaxYaw = 0;

  var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  if (opts.selectable) {
    el.style.cursor = 'grab';
    el.addEventListener('click', function (e) {
      if (moved > 6) return;
      var r = el.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      var meshes = [];
      Object.keys(parts).forEach(function (n) { meshes = meshes.concat(parts[n]); });
      var hit = ray.intersectObjects(meshes, false)[0];
      if (hit && opts.onPick) opts.onPick(hit.object.userData.part);
    });
  }

  /* ---- Tamaño y visibilidad ---- */
  function resize() {
    var w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // en pantallas estrechas alejamos un poco la cámara
    camera.zoom = w / h < 0.8 ? 0.82 : 1;
    camera.updateProjectionMatrix();
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(container);
  window.addEventListener('resize', resize);
  resize();

  var visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: 0 }).observe(container);
  }

  /* ---- Bucle ---- */
  var clock = new THREE.Clock();
  var flexMax = opts.flexMax || 95;
  var manualAngle = null;
  setFlexion(REDUCE ? 35 : 0);

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) { clock.getDelta(); return; }
    var dt = Math.min(clock.getDelta(), 0.05);
    var t = clock.elapsedTime;

    if (manualAngle !== null) setFlexion(manualAngle);
    if (!REDUCE) {
      if (manualAngle !== null) { /* ángulo fijado por el usuario */ }
      else if (opts.autoFlex !== false) setFlexion(flexMax * 0.5 * (1 - Math.cos(t * (opts.flexSpeed || 0.9))));
      if (!dragging && !hovering && opts.autoRotate) targetYaw += dt * 0.12;
    }
    yaw += (targetYaw + parallaxYaw - yaw) * 0.06;
    pitch += (targetPitch - pitch) * 0.06;
    root.rotation.y = yaw;
    root.rotation.x = pitch;
    root.position.y = 0.1 + (REDUCE ? 0 : Math.sin(t * 1.2) * 0.04);

    // pulso de "energía" en la estructura destacada (LCA por defecto)
    var pulse = 0.5 + 0.5 * Math.sin(t * 3);
    var glowPart = selected || 'lca';
    (parts[glowPart] || []).forEach(function (m) {
      if (m.material.emissive) m.material.emissiveIntensity = m.userData.baseEmissive + 0.35 + pulse * 0.45;
    });
    Object.keys(parts).forEach(function (n) {
      if (n === glowPart) return;
      parts[n].forEach(function (m) { if (m.material.emissive) m.material.emissiveIntensity = m.userData.baseEmissive; });
    });

    particles.rotation.y = t * 0.05;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  return {
    select: select,
    setAngle: function (deg) { manualAngle = deg; },
    releaseAngle: function () { manualAngle = null; },
    canvas: el
  };
}

/* ===========================================================
   Arranque automático
   =========================================================== */
(function boot() {
  // Hero
  var heroBox = document.getElementById('heroKnee');
  if (heroBox) {
    var angleEls = document.querySelectorAll('[data-knee-angle]');
    var barEl = document.getElementById('heroAngleBar');
    var phaseEl = document.getElementById('heroPhase');
    var hero = createKnee(heroBox, {
      dark: true,
      parallax: true,
      autoFlex: true,
      flexMax: 110,
      flexSpeed: 0.75,
      yaw: -0.25,
      distance: 9.4,
      targetY: -0.15,
      onAngle: function (deg) {
        angleEls.forEach(function (n) { n.textContent = deg + '°'; });
        if (barEl) barEl.style.width = Math.min(100, (deg / 135) * 100) + '%';
        if (phaseEl) phaseEl.textContent = deg < 30 ? 'Extensión' : deg < 90 ? 'Flexión media' : 'Flexión profunda';
      }
    });
    if (hero) document.documentElement.classList.add('knee-gl-on');
  }

  // Sección ligamento cruzado
  var aclBox = document.getElementById('kneeGlAcl');
  var aclWrap = document.getElementById('knee3d');
  if (aclBox && aclWrap) {
    var acl = createKnee(aclBox, {
      dark: false,
      selectable: true,
      goniometer: true,
      autoFlex: true,
      flexMax: 70,
      flexSpeed: 0.6,
      particles: false,
      highlight: 'lca',
      dim: true,
      yaw: -0.2,
      distance: 7.4,
      targetY: -0.05,
      onPick: function (part) { if (window.kneeSelect) window.kneeSelect(part); }
    });
    if (acl) {
      aclWrap.classList.add('gl-on');
      window.addEventListener('kneeselect', function (e) { acl.select(e.detail); });
      // slider de flexión manual
      var slider = document.getElementById('kneeFlex');
      var out = document.getElementById('kneeFlexOut');
      if (slider) {
        slider.addEventListener('input', function () {
          acl.setAngle(+slider.value);
          if (out) out.textContent = slider.value + '°';
        });
      }
      var current = aclWrap.querySelector('.knee-legend button.active');
      if (current) acl.select(current.getAttribute('data-part'));
    }
  }
})();
