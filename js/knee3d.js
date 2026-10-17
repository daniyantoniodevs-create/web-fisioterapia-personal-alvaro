/* ===========================================================
   Rodilla 3D interactiva — girar con ratón/dedo + explorar partes
   Capas con profundidad real (translateZ) y rotación 3D. Sin deps.
   =========================================================== */
(function () {
  'use strict';

  var stage = document.getElementById('kneeStage');
  var wrap = document.getElementById('knee3d');
  if (!stage || !wrap) return;
  window.kneeSelect = function (part) { select(part); };

  var persp = stage.parentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Rotación ---- */
  var spin = -12, hover = false, dragging = false, lastX = 0, moved = 0;
  var tiltX = -6, tiltY = 0, targetX = -6, targetY = 0;

  persp.addEventListener('pointerenter', function () { hover = true; });
  persp.addEventListener('pointerleave', function () { hover = false; dragging = false; targetX = -6; targetY = 0; });
  persp.addEventListener('pointerdown', function (e) { dragging = true; lastX = e.clientX; moved = 0; });
  window.addEventListener('pointerup', function () { dragging = false; });
  persp.addEventListener('pointermove', function (e) {
    var r = persp.getBoundingClientRect();
    if (dragging) {
      var dx = e.clientX - lastX;
      spin += dx * 0.45; lastX = e.clientX; moved += Math.abs(dx);
    } else {
      var px = (e.clientX - r.left) / r.width;
      var py = (e.clientY - r.top) / r.height;
      targetX = (0.5 - py) * 24;
      targetY = (px - 0.5) * 30;
    }
  });

  function loop() {
    if (!hover && !dragging && !reduce) spin += 0.14;        // giro suave en reposo
    tiltX += (targetX - tiltX) * 0.09;
    tiltY += (targetY - tiltY) * 0.09;
    stage.style.transform = 'rotateX(' + tiltX.toFixed(2) + 'deg) rotateY(' + (spin + tiltY).toFixed(2) + 'deg)';
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* ---- Selección de partes ---- */
  var INFO = {
    lca: { t: 'Ligamento cruzado anterior (LCA)', d: 'Evita el desplazamiento hacia delante de la tibia y da estabilidad rotacional. Es el ligamento que más se lesiona en deportes de giro, salto y frenada.' },
    lcp: { t: 'Ligamento cruzado posterior (LCP)', d: 'Más fuerte y grueso que el LCA. Controla el desplazamiento posterior de la tibia y se lesiona con menos frecuencia, normalmente por impactos directos.' },
    menisco: { t: 'Menisco', d: 'Dos cartílagos en forma de C que amortiguan y reparten la carga entre fémur y tibia, además de dar estabilidad. Es habitual que se lesione junto al LCA.' },
    femur: { t: 'Fémur', d: 'El hueso del muslo. Sus cóndilos forman la parte superior de la articulación de la rodilla, sobre la que esta se flexiona y extiende.' },
    tibia: { t: 'Tibia', d: 'El hueso de la espinilla. Su meseta tibial recibe toda la carga de la rodilla y es donde se anclan los ligamentos cruzados.' },
    colateral: { t: 'Ligamentos colaterales', d: 'El colateral medial (interno) y el lateral (externo) estabilizan la rodilla frente a fuerzas laterales. El medial se lesiona a menudo en giros y choques, a veces junto al LCA.' },
    tendon: { t: 'Tendón rotuliano y cuadricipital', d: 'Transmiten la fuerza del cuádriceps a la tibia a través de la rótula. Su sobrecarga produce la tendinopatía rotuliana o «rodilla del saltador».' },
    patella: { t: 'Rótula', d: 'El hueso de la rodilla por delante. Protege la articulación y mejora la palanca del cuádriceps al estirar la pierna.' }
  };

  function select(part) {
    if (!INFO[part]) return;
    try { window.dispatchEvent(new CustomEvent('kneeselect', { detail: part })); } catch (e) {}
    wrap.classList.add('has-sel');
    stage.querySelectorAll('[data-part]').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-part') === part);
    });
    wrap.querySelectorAll('.knee-legend button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-part') === part);
    });
    document.getElementById('kneeInfoTitle').textContent = INFO[part].t;
    document.getElementById('kneeInfoText').textContent = INFO[part].d;
  }

  // click en las piezas del modelo (ignora si se ha arrastrado)
  stage.querySelectorAll('[data-part]').forEach(function (el) {
    el.addEventListener('click', function () { if (moved <= 6) select(el.getAttribute('data-part')); });
  });
  // click en la leyenda
  wrap.querySelectorAll('.knee-legend button').forEach(function (b) {
    b.addEventListener('click', function () { select(b.getAttribute('data-part')); });
  });

  select('lca');
})();
