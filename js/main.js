/* ===========================================================
   Álvaro Picazo Fisioterapia — Interacciones y animaciones
   =========================================================== */
(function () {
  'use strict';

  /* ---- Header sticky / scroll progress ---- */
  var header = document.getElementById('header');
  var progress = document.getElementById('scrollProgress');

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('scrolled', y > 40);
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Menú móvil ---- */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('mobile-open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        menu.classList.remove('mobile-open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---- Scroll reveal con IntersectionObserver ---- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) {
      if (!el.classList.contains('in')) io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- Contadores animados ---- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1600, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(eased * target).toLocaleString('es-ES') + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString('es-ES') + suffix;
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { cio.observe(c); });
  } else {
    counters.forEach(animateCount);
  }

  /* ---- FAQ acordeón (si existe) ---- */
  document.querySelectorAll('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.faq-item');
      var ans = item.querySelector('.faq-a');
      var open = item.classList.toggle('open');
      ans.style.maxHeight = open ? ans.scrollHeight + 'px' : null;
    });
  });

  /* ---- Formulario de contacto (demo estática) ---- */
  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var nombre = form.querySelector('#nombre');
      var tel = form.querySelector('#telefono');
      if (!nombre.value.trim() || !tel.value.trim()) {
        nombre.reportValidity && nombre.reportValidity();
        return;
      }
      var ok = document.getElementById('formSuccess');
      if (ok) { ok.classList.add('show'); ok.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      form.reset();
      setTimeout(function () { ok && ok.classList.remove('show'); }, 6000);
    });
  }

  /* ---- Partículas flotantes en el hero ---- */
  var particles = document.getElementById('heroParticles');
  if (particles && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (var i = 0; i < 14; i++) {
      var p = document.createElement('i');
      var size = 4 + Math.random() * 8;
      p.style.left = Math.random() * 100 + '%';
      p.style.width = p.style.height = size + 'px';
      p.style.opacity = 0.2 + Math.random() * 0.5;
      p.style.animationDuration = (10 + Math.random() * 14) + 's';
      p.style.animationDelay = (Math.random() * 10) + 's';
      particles.appendChild(p);
    }
  }

  /* ---- Marquee infinito (duplicar contenido) ---- */
  var marquee = document.getElementById('marquee');
  if (marquee) marquee.innerHTML += marquee.innerHTML;

  /* ---- Efecto 3D tilt + spotlight en tarjetas ---- */
  if (window.matchMedia('(hover: hover)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.tilt').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        el.style.transform = 'perspective(900px) rotateX(' + ((0.5 - py) * 7).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * 7).toFixed(2) + 'deg) translateY(-6px)';
        el.style.setProperty('--mx', (px * 100) + '%');
        el.style.setProperty('--my', (py * 100) + '%');
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
    // spotlight en elementos no-tilt
    document.querySelectorAll('.spotlight:not(.tilt)').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
  }

  /* ---- Carrusel de casos de éxito ---- */
  (function () {
    var track = document.getElementById('casesTrack');
    if (!track) return;
    var slides = track.children;
    var total = slides.length;
    var dotsWrap = document.getElementById('caseDots');
    var idx = 0, timer;

    for (var i = 0; i < total; i++) {
      var d = document.createElement('button');
      d.setAttribute('aria-label', 'Caso ' + (i + 1));
      (function (n) { d.addEventListener('click', function () { go(n); reset(); }); })(i);
      dotsWrap.appendChild(d);
    }
    var dots = dotsWrap.children;

    function go(n) {
      idx = (n + total) % total;
      track.style.transform = 'translateX(-' + (idx * 100) + '%)';
      for (var k = 0; k < dots.length; k++) dots[k].classList.toggle('active', k === idx);
    }
    function next() { go(idx + 1); }
    function prev() { go(idx - 1); }
    function reset() { clearInterval(timer); timer = setInterval(next, 6000); }

    document.getElementById('caseNext').addEventListener('click', function () { next(); reset(); });
    document.getElementById('casePrev').addEventListener('click', function () { prev(); reset(); });

    // swipe táctil
    var x0 = null;
    track.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); reset(); }
      x0 = null;
    }, { passive: true });

    go(0); reset();
  })();

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Titular que entra palabra a palabra ---- */
  document.querySelectorAll('.split').forEach(function (el) {
    var delay = 0.15;
    function wrap(content) {
      var w = document.createElement('span'); w.className = 'w';
      var inner = document.createElement('span');
      inner.style.animationDelay = delay.toFixed(2) + 's';
      delay += 0.09;
      if (typeof content === 'string') inner.textContent = content; else inner.appendChild(content);
      w.appendChild(inner);
      return w;
    }
    var nodes = Array.prototype.slice.call(el.childNodes);
    el.textContent = '';
    nodes.forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) el.appendChild(document.createTextNode(' '));
          else el.appendChild(wrap(part));
        });
      } else {
        el.appendChild(wrap(n));
      }
    });
  });

  /* ---- Botones magnéticos ---- */
  if (window.matchMedia('(hover: hover)').matches && !reduceMotion) {
    document.querySelectorAll('.magnetic, .nav-cta').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.22;
        var y = (e.clientY - r.top - r.height / 2) * 0.3;
        b.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }

  /* ---- Líneas que se dibujan al hacer scroll (pulso / electromiograma) ---- */
  var drawPaths = Array.prototype.slice.call(document.querySelectorAll('path[data-draw]'));
  drawPaths.forEach(function (p) {
    var len = p.getTotalLength ? p.getTotalLength() : 1000;
    p.style.strokeDasharray = len;
    p.style.strokeDashoffset = reduceMotion ? 0 : len;
    p._len = len;
  });
  function drawOnScroll() {
    var vh = window.innerHeight;
    drawPaths.forEach(function (p) {
      var r = p.closest('svg').getBoundingClientRect();
      var prog = Math.min(1, Math.max(0, (vh * 0.9 - r.top) / (vh * 0.5)));
      p.style.strokeDashoffset = (p._len * (1 - prog)).toFixed(1);
    });
  }
  if (drawPaths.length && !reduceMotion) {
    window.addEventListener('scroll', drawOnScroll, { passive: true });
    drawOnScroll();
  }

  /* ---- Año dinámico en el footer ---- */
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---- Suavizado de anclas con offset de header ---- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      var top = t.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });
})();
