/* ===========================================================
   Portal — Utilidades de interfaz compartidas (dashboards)
   =========================================================== */
(function (global) {
  'use strict';

  var UI = {
    /* Navegación entre vistas + sidebar móvil */
    initShell: function (titles) {
      var nav = document.getElementById('sideNav');
      var sidebar = document.getElementById('sidebar');
      var back = document.getElementById('sidebarBack');
      var toggle = document.getElementById('mobileToggle');
      var title = document.getElementById('viewTitle');

      function show(view) {
        document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
        var el = document.getElementById('view-' + view);
        if (el) el.classList.add('active');
        nav.querySelectorAll('button').forEach(function (b) {
          b.classList.toggle('active', b.getAttribute('data-view') === view);
        });
        if (title && titles && titles[view]) title.textContent = titles[view];
        closeSidebar();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      nav.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () { show(b.getAttribute('data-view')); });
      });

      // botones "data-goto"
      document.querySelectorAll('[data-goto]').forEach(function (b) {
        b.addEventListener('click', function () { show(b.getAttribute('data-goto')); });
      });

      function openSidebar() { sidebar.classList.add('open'); back.classList.add('show'); }
      function closeSidebar() { sidebar.classList.remove('open'); back.classList.remove('show'); }
      if (toggle) toggle.addEventListener('click', openSidebar);
      if (back) back.addEventListener('click', closeSidebar);

      this.show = show;
      return show;
    },

    /* Cerrar sesión */
    initLogout: function () {
      var btn = document.getElementById('logoutBtn');
      if (btn) btn.addEventListener('click', function () {
        Portal.logout();
        location.href = 'portal.html';
      });
    },

    /* Rellenar tarjeta de usuario en la sidebar */
    fillUser: function (session) {
      var name = document.getElementById('userName');
      var label = document.getElementById('userLabel');
      var av = document.getElementById('userAv');
      if (name) name.textContent = session.name || session.user;
      if (label) label.textContent = session.role === 'fisio' ? (session.label || 'Fisioterapeuta') : 'Paciente';
      if (av) av.textContent = (session.name || session.user).charAt(0).toUpperCase();
    },

    /* Toast */
    toast: function (msg) {
      var t = document.getElementById('toast');
      var m = document.getElementById('toastMsg');
      if (!t) return;
      if (m) m.textContent = msg;
      t.classList.add('show');
      clearTimeout(this._tt);
      this._tt = setTimeout(function () { t.classList.remove('show'); }, 2800);
    },

    /* Modal de vídeo */
    initVideoModal: function () {
      this._modal = document.getElementById('videoModal');
      var close = document.getElementById('modalClose');
      var self = this;
      function hide() {
        self._modal.classList.remove('show');
        var vid = document.getElementById('modalVideo');
        if (vid) vid.innerHTML = ''; // detener reproducción
      }
      if (close) close.addEventListener('click', hide);
      if (this._modal) this._modal.addEventListener('click', function (e) {
        if (e.target === self._modal) hide();
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
      this.hideVideo = hide;
    },
    openVideo: function (v) {
      document.getElementById('modalTitle').textContent = v.title;
      document.getElementById('modalDesc').textContent = v.desc || '';
      document.getElementById('modalVideo').innerHTML = Portal.embedHtml(v, true);
      var meta = document.getElementById('modalMeta');
      if (meta) meta.innerHTML =
        '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>' + (v.duration || '—') + '</span>' +
        '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6-6 6 6M6 15l6 6 6-6"/></svg>' + (v.reps || '—') + '</span>' +
        '<span class="pill info">Fase ' + v.phase + '</span>';
      this._modal.classList.add('show');
    },

    /* Tarjeta de ejercicio (HTML) */
    exerciseCard: function (v, opts) {
      opts = opts || {};
      var del = opts.deletable
        ? '<button class="btn btn--danger btn--sm" data-del="' + v.id + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>Eliminar</button>'
        : '';
      return '' +
        '<article class="ex-card">' +
          '<div class="ex-thumb" data-play="' + v.id + '">' +
            Portal.thumbHtml(v) +
            '<span class="ex-tag">' + (v.category || 'Ejercicio') + '</span>' +
            (v.demo ? '<span class="ex-tag" style="left:auto;right:12px;background:rgba(242, 169, 59,.9);">vídeo demo</span>' : '') +
            '<div class="ex-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>' +
          '</div>' +
          '<div class="ex-body">' +
            '<h4>' + v.title + '</h4>' +
            '<p>' + (v.desc || '') + '</p>' +
            '<div class="ex-meta">' +
              '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>' + (v.duration || '—') + '</span>' +
              '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>' + (v.reps || '—') + '</span>' +
              '<span class="pill info" style="margin-left:auto;">Fase ' + v.phase + '</span>' +
            '</div>' +
            (opts.deletable ? '<div class="ex-actions">' + del + '</div>' : '') +
          '</div>' +
        '</article>';
    }
  };

  global.UI = UI;
})(window);
