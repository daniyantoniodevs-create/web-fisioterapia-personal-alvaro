/* ===========================================================
   Portal — Panel del Paciente
   =========================================================== */
(function () {
  'use strict';

  var session = Portal.requireRole('cliente');
  if (!session) return;

  UI.fillUser(session);
  UI.initShell({
    resumen: 'Resumen',
    ejercicios: 'Mis ejercicios',
    progreso: 'Mi progreso',
    mensajes: 'Mensajes'
  });
  UI.initLogout();
  UI.initVideoModal();

  var P = Portal.getProgress();

  /* ---------- Saludo ---------- */
  var hour = new Date().getHours();
  var saludo = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
  document.getElementById('greet').textContent = saludo + ', ' + (session.name.split(' ')[0]) + ' 👋';
  document.getElementById('phasePill').textContent = 'Fase ' + P.currentPhase + ' de 4';

  /* ---------- Resumen / KPIs ---------- */
  animateNum(document.getElementById('kpiOverall'), P.overall, '%');
  animateNum(document.getElementById('kpiRom'), P.rangeOfMotion, '°');
  animateNum(document.getElementById('kpiStrength'), P.strength, '%');
  document.getElementById('kpiNext').textContent = /^\d{4}-\d{2}-\d{2}/.test(P.nextSession || '') ? formatDateTime(P.nextSession) : (P.nextSession || 'Por agendar');

  // Anillo de progreso
  var ring = document.getElementById('ringFg');
  var circ = 2 * Math.PI * 60; // 377
  ring.style.strokeDasharray = circ;
  setTimeout(function () { ring.style.strokeDashoffset = circ * (1 - P.overall / 100); }, 200);
  animateNum(document.getElementById('ringVal'), P.overall, '%');

  // Fases
  var phasesList = document.getElementById('phasesList');
  phasesList.innerHTML = P.phases.map(function (ph) {
    var cls = ph.status === 'done' ? 'done' : ph.status === 'current' ? 'current' : '';
    var st = ph.status === 'done'
      ? '<span class="ph-status s-done">Completada</span>'
      : ph.status === 'current'
        ? '<span class="ph-status s-current">En curso</span>'
        : '<span class="ph-status s-todo">Pendiente</span>';
    var icon = ph.status === 'done'
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="width:18px;height:18px;"><path d="M20 6L9 17l-5-5"/></svg>'
      : ph.n;
    return '<div class="phase ' + cls + '"><div class="ph-num">' + icon + '</div>' +
           '<div><h4>' + ph.title + '</h4><p>' + ph.desc + '</p></div>' + st + '</div>';
  }).join('');

  /* ---------- Ejercicios ---------- */
  var videos = Portal.getVideos();

  // recomendados para hoy = fase actual (máx 3)
  var today = videos.filter(function (v) { return v.phase === P.currentPhase; }).slice(0, 3);
  if (today.length === 0) today = videos.slice(0, 3);
  document.getElementById('todayEx').innerHTML = today.map(function (v) { return UI.exerciseCard(v); }).join('');

  var allEx = document.getElementById('allEx');
  function renderAll(filter) {
    var list = filter === 'all' ? videos : videos.filter(function (v) { return String(v.phase) === String(filter); });
    if (list.length === 0) {
      allEx.innerHTML = '<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="3"/><path d="M8 12h8"/></svg><p>No hay ejercicios en esta fase todavía.</p></div>';
    } else {
      allEx.innerHTML = list.map(function (v) { return UI.exerciseCard(v); }).join('');
    }
  }
  renderAll('all');

  document.getElementById('exFilters').addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    this.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    renderAll(btn.getAttribute('data-f'));
  });

  // Reproducir vídeo (delegación en todo el documento)
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-play]');
    if (!t) return;
    var id = t.getAttribute('data-play');
    var v = videos.find(function (x) { return x.id === id; });
    if (v) UI.openVideo(v);
  });

  /* ---------- Progreso: gráfico de dolor ---------- */
  var painChart = document.getElementById('painChart');
  var weeks = P.weeklyPain || [];
  if (weeks.length === 0) {
    painChart.innerHTML = '<div class="empty" style="margin:auto;"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg><p>Registra tu primera sesión para ver tu evolución.</p></div>';
  } else {
  painChart.innerHTML = weeks.map(function (val, i) {
    return '<div class="col"><div class="b" data-v="' + val + '" style="height:0"></div><small>Sem ' + (i + 1) + '</small></div>';
  }).join('');
  }
  setTimeout(function () {
    painChart.querySelectorAll('.b').forEach(function (b) {
      var v = parseInt(b.getAttribute('data-v'), 10);
      b.style.height = (v / 10 * 100) + '%';
    });
  }, 300);

  // slider dolor
  var painRange = document.getElementById('painRange');
  var painVal = document.getElementById('painVal');
  painRange.addEventListener('input', function () { painVal.textContent = painRange.value; });

  // tabla de sesiones
  function renderSessions() {
    var tb = document.querySelector('#sessionsTable tbody');
    if (!P.sessions || P.sessions.length === 0) {
      tb.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:28px;">Aún no has registrado ninguna sesión. ¡Empieza hoy!</td></tr>';
      return;
    }
    tb.innerHTML = P.sessions.map(function (s) {
      return '<tr><td>' + formatDate(s.date) + '</td>' +
             '<td><span class="pill ' + (s.pain <= 2 ? 'ok' : s.pain <= 4 ? 'info' : 'warn') + '">' + s.pain + '/10</span></td>' +
             '<td>' + (s.rom || '—') + '°</td>' +
             '<td><span class="pill ok">Registrada</span></td>' +
             '<td style="color:var(--muted);">' + (s.notes || '—') + '</td></tr>';
    }).join('');
  }
  renderSessions();

  document.getElementById('saveSession').addEventListener('click', function () {
    var s = {
      date: new Date().toISOString().slice(0, 10),
      pain: parseInt(painRange.value, 10),
      rom: parseInt(document.getElementById('romInput').value, 10) || P.rangeOfMotion,
      done: true,
      notes: document.getElementById('sessionNotes').value.trim()
    };
    P = Portal.addSession(s);
    renderSessions();
    document.getElementById('sessionNotes').value = '';
    animateNum(document.getElementById('kpiRom'), P.rangeOfMotion, '°');
    UI.toast('Registro guardado correctamente');
  });

  /* ---------- Mensajes ---------- */
  var chatBox = document.getElementById('chatBox');
  function renderChat() {
    var msgs = Portal.getMessages();
    chatBox.innerHTML = msgs.map(function (m) {
      var mine = m.from === 'cliente';
      return '<div style="align-self:' + (mine ? 'flex-end' : 'flex-start') + ';max-width:75%;">' +
             '<div style="background:' + (mine ? 'var(--grad)' : '#f6eeed') + ';color:' + (mine ? '#fff' : 'var(--dark)') + ';padding:11px 15px;border-radius:14px;' + (mine ? 'border-bottom-right-radius:4px;' : 'border-bottom-left-radius:4px;') + 'font-size:.92rem;">' + escapeHtml(m.text) + '</div>' +
             '<div style="font-size:.72rem;color:var(--muted);margin-top:4px;text-align:' + (mine ? 'right' : 'left') + ';">' + (mine ? 'Tú' : 'Álvaro') + ' · ' + m.date + '</div></div>';
    }).join('');
    chatBox.scrollTop = chatBox.scrollHeight;
  }
  renderChat();

  function sendMsg() {
    var input = document.getElementById('chatInput');
    var text = input.value.trim();
    if (!text) return;
    Portal.addMessage({ from: 'cliente', text: text, date: nowStamp() });
    input.value = '';
    renderChat();
  }
  document.getElementById('chatSend').addEventListener('click', sendMsg);
  document.getElementById('chatInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') sendMsg(); });

  /* ---------- Utilidades ---------- */
  function animateNum(el, target, suffix) {
    if (!el) return;
    var dur = 1200, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + (suffix || '');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function formatDate(d) {
    if (!d) return '—';
    var p = d.split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : d;
  }
  function formatDateTime(d) {
    if (!d) return '—';
    var parts = d.split(' ');
    return formatDate(parts[0]) + (parts[1] ? ' · ' + parts[1] : '');
  }
  function nowStamp() {
    var n = new Date();
    return n.toISOString().slice(0, 10) + ' ' + String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
  }
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
})();
