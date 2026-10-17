/* ===========================================================
   Portal — Panel del Fisioterapeuta (administrador)
   =========================================================== */
(function () {
  'use strict';

  var session = Portal.requireRole('fisio');
  if (!session) return;

  UI.fillUser(session);
  UI.initShell({
    resumen: 'Panel general',
    pacientes: 'Pacientes',
    videos: 'Vídeos / ejercicios',
    mensajes: 'Mensajes'
  });
  UI.initLogout();
  UI.initVideoModal();

  document.getElementById('greet').textContent = 'Bienvenido, ' + session.name.split(' ')[0] + ' 👋';

  /* ---------- KPIs y tablas ---------- */
  function renderDashboard() {
    var patients = Portal.getPatients();
    var videos = Portal.getVideos();
    document.getElementById('kpiPatients').textContent = patients.filter(function (p) { return p.status !== 'Alta'; }).length;
    document.getElementById('kpiVideos').textContent = videos.length;
    document.getElementById('kpiSessions').textContent = 12;
    document.getElementById('kpiNew').textContent = patients.filter(function (p) { return p.progress >= 85; }).length;

    var rows = patients.slice(0, 5).map(patientRow).join('');
    document.querySelector('#recentTable tbody').innerHTML = rows;

    document.querySelector('#patientsTable tbody').innerHTML = patients.map(function (p) {
      return '<tr><td><strong>' + p.name + '</strong></td><td>' + p.injury + '</td>' +
             '<td><span class="pill info">Fase ' + p.phase + '</span></td>' +
             '<td><div style="display:flex;align-items:center;gap:10px;"><div class="bar" style="width:90px;"><span style="width:' + p.progress + '%"></span></div>' + p.progress + '%</div></td>' +
             '<td>' + formatDate(p.last) + '</td>' +
             '<td>' + statusPill(p.status) + '</td></tr>';
    }).join('');
  }
  function patientRow(p) {
    return '<tr><td><strong>' + p.name + '</strong></td><td>' + p.injury + '</td>' +
           '<td><span class="pill info">Fase ' + p.phase + '</span></td>' +
           '<td><div style="display:flex;align-items:center;gap:10px;"><div class="bar" style="width:90px;"><span style="width:' + p.progress + '%"></span></div>' + p.progress + '%</div></td>' +
           '<td>' + statusPill(p.status) + '</td></tr>';
  }
  function statusPill(s) {
    var cls = s === 'Nuevo' ? 'warn' : s === 'Alta' ? 'ok' : 'ok';
    return '<span class="pill ' + cls + '">' + s + '</span>';
  }
  renderDashboard();

  /* ---------- Vídeos: pestañas de fuente ---------- */
  var srcType = 'youtube';
  var srcTabs = document.getElementById('srcTabs');
  srcTabs.addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    srcTabs.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    srcType = btn.getAttribute('data-src');
    document.getElementById('srcYoutube').style.display = srcType === 'youtube' ? '' : 'none';
    document.getElementById('srcFile').style.display = srcType === 'file' ? '' : 'none';
    document.getElementById('srcUrl').style.display = srcType === 'url' ? '' : 'none';
  });

  /* ---------- Carga de archivo ---------- */
  var fileInput = document.getElementById('fileInput');
  var uploadZone = document.getElementById('uploadZone');
  var fileName = document.getElementById('fileName');
  var fileDataUrl = null;

  uploadZone.addEventListener('click', function () { fileInput.click(); });
  ['dragover', 'dragenter'].forEach(function (ev) {
    uploadZone.addEventListener(ev, function (e) { e.preventDefault(); uploadZone.classList.add('drag'); });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    uploadZone.addEventListener(ev, function (e) { e.preventDefault(); uploadZone.classList.remove('drag'); });
  });
  uploadZone.addEventListener('drop', function (e) {
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', function () {
    if (fileInput.files.length) handleFile(fileInput.files[0]);
  });
  function handleFile(file) {
    if (!file.type.startsWith('video/')) { UI.toast('Selecciona un archivo de vídeo'); return; }
    fileName.textContent = file.name + ' (' + (file.size / 1048576).toFixed(1) + ' MB)';
    var reader = new FileReader();
    reader.onload = function () { fileDataUrl = reader.result; };
    reader.readAsDataURL(file);
  }

  /* ---------- Publicar ---------- */
  document.getElementById('publishBtn').addEventListener('click', function () {
    var title = document.getElementById('vTitle').value.trim();
    if (!title) { UI.toast('Añade un título'); return; }

    var video = {
      title: title,
      phase: parseInt(document.getElementById('vPhase').value, 10),
      category: document.getElementById('vCategory').value,
      duration: document.getElementById('vDuration').value.trim() || '—',
      reps: document.getElementById('vReps').value.trim() || '—',
      desc: document.getElementById('vDesc').value.trim(),
      date: new Date().toISOString().slice(0, 10)
    };

    if (srcType === 'youtube') {
      var id = parseYouTube(document.getElementById('ytInput').value.trim());
      if (!id) { UI.toast('Introduce una URL o ID de YouTube válido'); return; }
      video.type = 'youtube'; video.src = id;
    } else if (srcType === 'file') {
      if (!fileDataUrl) { UI.toast('Selecciona un archivo de vídeo'); return; }
      video.type = 'file'; video.src = fileDataUrl;
    } else {
      var url = document.getElementById('urlInput').value.trim();
      if (!url) { UI.toast('Introduce la URL del vídeo'); return; }
      video.type = 'url'; video.src = url;
    }

    try {
      Portal.addVideo(video);
    } catch (e) {
      UI.toast('El archivo es demasiado grande para la demo. Usa YouTube o un enlace.');
      return;
    }

    // limpiar formulario
    ['vTitle', 'vDuration', 'vReps', 'vDesc', 'ytInput', 'urlInput'].forEach(function (id) {
      var el = document.getElementById(id); if (el) el.value = '';
    });
    fileDataUrl = null;
    fileName.textContent = 'MP4, WebM · máx. recomendado 50 MB';

    renderVideos();
    renderDashboard();
    UI.toast('✓ Ejercicio publicado. Ya es visible para tus pacientes.');
  });

  function parseYouTube(input) {
    if (!input) return null;
    // si ya parece un ID (11 caracteres sin espacios ni / )
    if (/^[\w-]{11}$/.test(input)) return input;
    var m = input.match(/(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([\w-]{11})/);
    return m ? m[1] : null;
  }

  /* ---------- Lista de vídeos (admin) ---------- */
  var adminVideos = document.getElementById('adminVideos');
  function renderVideos() {
    var videos = Portal.getVideos();
    document.getElementById('videoCount').textContent = videos.length + ' vídeos';
    if (videos.length === 0) {
      adminVideos.innerHTML = '<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg><p>Aún no hay vídeos. Sube el primero.</p></div>';
      return;
    }
    adminVideos.innerHTML = videos.map(function (v) {
      return UI.exerciseCard(v, { deletable: true });
    }).join('');
  }
  renderVideos();

  // reproducir y eliminar (delegación)
  document.addEventListener('click', function (e) {
    var play = e.target.closest('[data-play]');
    if (play) {
      var v = Portal.getVideos().find(function (x) { return x.id === play.getAttribute('data-play'); });
      if (v) UI.openVideo(v);
      return;
    }
    var del = e.target.closest('[data-del]');
    if (del) {
      if (confirm('¿Eliminar este ejercicio? Dejará de estar disponible para los pacientes.')) {
        Portal.deleteVideo(del.getAttribute('data-del'));
        renderVideos();
        renderDashboard();
        UI.toast('Ejercicio eliminado');
      }
    }
  });

  /* ---------- Mensajes (por paciente) ---------- */
  var chatBox = document.getElementById('chatBox');
  var chatPatient = document.getElementById('chatPatient');
  var currentChatKey = 'cliente';
  var currentChatName = 'María García';

  function fillPatientSelector() {
    // pacientes con conversación: demo "cliente" + registrados con cuenta
    var opts = [{ key: 'cliente', name: 'María García (demo)' }];
    Portal.getPatients().forEach(function (p) {
      if (p.registered) opts.push({ key: p.key, name: p.name });
    });
    chatPatient.innerHTML = opts.map(function (o) {
      return '<option value="' + o.key + '" data-name="' + o.name + '">' + o.name + '</option>';
    }).join('');
  }
  fillPatientSelector();

  function renderChat() {
    var msgs = Portal.getMessages(currentChatKey);
    if (msgs.length === 0) {
      chatBox.innerHTML = '<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg><p>Aún no hay mensajes con ' + currentChatName + '.</p></div>';
      return;
    }
    chatBox.innerHTML = msgs.map(function (m) {
      var mine = m.from === 'fisio';
      return '<div style="align-self:' + (mine ? 'flex-end' : 'flex-start') + ';max-width:75%;">' +
             '<div style="background:' + (mine ? 'var(--grad)' : '#f6eeed') + ';color:' + (mine ? '#fff' : 'var(--dark)') + ';padding:11px 15px;border-radius:14px;' + (mine ? 'border-bottom-right-radius:4px;' : 'border-bottom-left-radius:4px;') + 'font-size:.92rem;">' + escapeHtml(m.text) + '</div>' +
             '<div style="font-size:.72rem;color:var(--muted);margin-top:4px;text-align:' + (mine ? 'right' : 'left') + ';">' + (mine ? 'Tú (Álvaro)' : currentChatName.split(' ')[0]) + ' · ' + m.date + '</div></div>';
    }).join('');
    chatBox.scrollTop = chatBox.scrollHeight;
  }
  chatPatient.addEventListener('change', function () {
    currentChatKey = chatPatient.value;
    currentChatName = chatPatient.options[chatPatient.selectedIndex].getAttribute('data-name');
    renderChat();
  });
  renderChat();

  function sendMsg() {
    var input = document.getElementById('chatInput');
    var text = input.value.trim();
    if (!text) return;
    Portal.addMessage(currentChatKey, { from: 'fisio', text: text, date: nowStamp() });
    input.value = '';
    renderChat();
  }
  document.getElementById('chatSend').addEventListener('click', sendMsg);
  document.getElementById('chatInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') sendMsg(); });

  /* ---------- Restaurar demo ---------- */
  document.getElementById('resetBtn').addEventListener('click', function () {
    if (confirm('¿Restaurar todos los datos de demostración? Se perderán los cambios realizados.')) {
      Portal.reset();
      renderVideos();
      renderDashboard();
      currentChatKey = 'cliente'; currentChatName = 'María García';
      fillPatientSelector();
      renderChat();
      UI.toast('Datos de demostración restaurados');
    }
  });

  /* ---------- Utilidades ---------- */
  function formatDate(d) {
    if (!d) return '—';
    var p = d.split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : d;
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
