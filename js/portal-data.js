/* ===========================================================
   Portal — Datos, autenticación, registro y pagos (localStorage)
   Demo 100% estática: los datos persisten en el navegador.
   =========================================================== */
(function (global) {
  'use strict';

  var KEYS = {
    session: 'ap_session',
    videos: 'ap_videos',
    progress: 'ap_progress',   // progreso del paciente demo "cliente"
    patients: 'ap_patients',   // pacientes demo (panel admin)
    chats: 'ap_chats',         // { claveUsuario: [mensajes] }
    users: 'ap_users'          // usuarios registrados
  };

  // Plan del portal del paciente
  var PLAN = { name: 'Plan Recuperación', price: 150, period: 'mes', currency: '€' };

  // Credenciales de demostración solicitadas
  var CREDENTIALS = {
    cliente: { pass: '123465', role: 'cliente', name: 'María García', label: 'Paciente · LCA rodilla derecha', key: 'cliente' },
    fisio:   { pass: '123456', role: 'fisio',   name: 'Álvaro Picazo', label: 'Fisioterapeuta', key: 'fisio' }
  };

  /* ---------- Helpers de almacenamiento ---------- */
  function read(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function write(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }

  /* ---------- Datos por defecto (semilla) ---------- */
  // NOTA: los vídeos de ejemplo usan clips de muestra públicos y estables para que
  // SIEMPRE se reproduzcan en la demo. Álvaro los sustituye por los suyos (YouTube o
  // archivo) desde el panel del fisioterapeuta.
  var SAMPLE = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/';
  var DEFAULT_VIDEOS = [
    { id: 'v1', title: 'Movilidad de rodilla en flexo-extensión', phase: 1, category: 'Movilidad',
      desc: 'Ejercicio suave para recuperar el rango de movimiento de la rodilla en las primeras semanas.',
      type: 'url', src: SAMPLE + 'ForBiggerJoyrides.mp4', demo: true, duration: '4 min', reps: '3 series x 15 rep', date: '2026-05-10' },
    { id: 'v2', title: 'Activación del cuádriceps (isométricos)', phase: 1, category: 'Fuerza',
      desc: 'Contracciones isométricas para reactivar la musculatura del muslo sin cargar la articulación.',
      type: 'url', src: SAMPLE + 'ForBiggerBlazes.mp4', demo: true, duration: '5 min', reps: '3 series x 10 rep', date: '2026-05-10' },
    { id: 'v3', title: 'Elevación de pierna recta (SLR)', phase: 2, category: 'Fuerza',
      desc: 'Fortalecimiento del cuádriceps con la rodilla estirada. Clave para la fase de recuperación temprana.',
      type: 'url', src: SAMPLE + 'ForBiggerEscapes.mp4', demo: true, duration: '6 min', reps: '4 series x 12 rep', date: '2026-05-14' },
    { id: 'v4', title: 'Sentadilla parcial con apoyo', phase: 2, category: 'Fuerza',
      desc: 'Sentadilla controlada en rango corto para ganar fuerza funcional de forma segura.',
      type: 'url', src: SAMPLE + 'ForBiggerFun.mp4', demo: true, duration: '7 min', reps: '3 series x 12 rep', date: '2026-05-18' },
    { id: 'v5', title: 'Propiocepción en superficie inestable', phase: 3, category: 'Propiocepción',
      desc: 'Trabajo de equilibrio y estabilidad sobre bosu para reeducar el control neuromuscular.',
      type: 'url', src: SAMPLE + 'ForBiggerMeltdowns.mp4', demo: true, duration: '8 min', reps: '4 series x 30 seg', date: '2026-05-22' },
    { id: 'v6', title: 'Pliometría: salto y aterrizaje controlado', phase: 4, category: 'Pliometría',
      desc: 'Ejercicios de salto para preparar la vuelta al deporte. Solo en fases avanzadas y con el visto bueno del fisio.',
      type: 'url', src: SAMPLE + 'WeAreGoingOnBullrun.mp4', demo: true, duration: '9 min', reps: '4 series x 8 rep', date: '2026-05-26' }
  ];

  var DEFAULT_PROGRESS = {
    patient: 'María García', injury: 'Rotura de LCA — rodilla derecha', surgeryDate: '2026-04-08',
    currentPhase: 2, overall: 45, rangeOfMotion: 110, strength: 62, nextSession: '2026-05-30 17:00',
    goal: 'Volver a jugar al baloncesto sin molestias',
    phases: [
      { n: 1, title: 'Fase preoperatoria / aguda', desc: 'Reducir inflamación y recuperar movilidad básica.', status: 'done' },
      { n: 2, title: 'Recuperación temprana', desc: 'Control del dolor, movilidad completa y activación muscular.', status: 'current' },
      { n: 3, title: 'Fortalecimiento y propiocepción', desc: 'Ganar fuerza, estabilidad y confianza.', status: 'todo' },
      { n: 4, title: 'Vuelta al deporte (RTP)', desc: 'Gestos deportivos, pliometría y tests de alta.', status: 'todo' }
    ],
    sessions: [
      { date: '2026-05-26', pain: 2, rom: 110, done: true, notes: 'Buena evolución, sin derrame.' },
      { date: '2026-05-19', pain: 3, rom: 100, done: true, notes: 'Aumentamos carga en cuádriceps.' },
      { date: '2026-05-12', pain: 4, rom: 90, done: true, notes: 'Retirada de muletas progresiva.' },
      { date: '2026-05-05', pain: 5, rom: 75, done: true, notes: 'Inicio de movilidad activa.' }
    ],
    weeklyPain: [6, 5, 4, 4, 3, 2]
  };

  var DEFAULT_PATIENTS = [
    { id: 'p1', name: 'María García', injury: 'LCA rodilla dcha.', phase: 2, progress: 45, status: 'Activo', last: '2026-05-26', key: 'cliente' },
    { id: 'p2', name: 'Carlos Ruiz', injury: 'LCA rodilla izq.', phase: 4, progress: 88, status: 'Activo', last: '2026-05-25' },
    { id: 'p3', name: 'Lucía Fernández', injury: 'Menisco', phase: 3, progress: 70, status: 'Activo', last: '2026-05-24' },
    { id: 'p4', name: 'Javier Moreno', injury: 'LCA + menisco', phase: 1, progress: 15, status: 'Nuevo', last: '2026-05-27' },
    { id: 'p5', name: 'Ana Torres', injury: 'Esguince tobillo', phase: 3, progress: 65, status: 'Activo', last: '2026-05-20' }
  ];

  var DEFAULT_CHATS = {
    cliente: [
      { id: 'm1', from: 'fisio', text: 'Hola María, te he añadido dos ejercicios nuevos para esta semana. ¡Buen trabajo!', date: '2026-05-26 18:20' },
      { id: 'm2', from: 'cliente', text: 'Gracias Álvaro, hoy he notado la rodilla mucho mejor 💪', date: '2026-05-26 19:05' }
    ]
  };

  function freshProgress(data) {
    return {
      patient: data.name, injury: data.injury || 'Por valorar', surgeryDate: null,
      currentPhase: 1, overall: 5, rangeOfMotion: 0, strength: 0, nextSession: 'Por agendar',
      goal: data.goal || '', notes: data.notes || '',
      phases: [
        { n: 1, title: 'Fase preoperatoria / aguda', desc: 'Reducir inflamación y recuperar movilidad básica.', status: 'current' },
        { n: 2, title: 'Recuperación temprana', desc: 'Control del dolor, movilidad completa y activación muscular.', status: 'todo' },
        { n: 3, title: 'Fortalecimiento y propiocepción', desc: 'Ganar fuerza, estabilidad y confianza.', status: 'todo' },
        { n: 4, title: 'Vuelta al deporte (RTP)', desc: 'Gestos deportivos, pliometría y tests de alta.', status: 'todo' }
      ],
      sessions: [], weeklyPain: []
    };
  }

  /* ---------- Inicializar semilla ---------- */
  function seed() {
    if (!localStorage.getItem(KEYS.videos)) write(KEYS.videos, DEFAULT_VIDEOS);
    if (!localStorage.getItem(KEYS.progress)) write(KEYS.progress, DEFAULT_PROGRESS);
    if (!localStorage.getItem(KEYS.patients)) write(KEYS.patients, DEFAULT_PATIENTS);
    if (!localStorage.getItem(KEYS.chats)) write(KEYS.chats, DEFAULT_CHATS);
    if (!localStorage.getItem(KEYS.users)) write(KEYS.users, []);
  }

  function getUsers() { return read(KEYS.users, []); }
  function saveUsers(list) { write(KEYS.users, list); }
  function findUserById(id) { return getUsers().filter(function (u) { return u.id === id; })[0] || null; }
  function findUserByEmail(email) {
    email = (email || '').trim().toLowerCase();
    return getUsers().filter(function (u) { return u.email === email; })[0] || null;
  }

  /* ---------- API pública ---------- */
  var Portal = {
    keys: KEYS,
    plan: PLAN,

    /* --- Autenticación --- */
    login: function (user, pass) {
      var u = (user || '').trim().toLowerCase();
      var cred = CREDENTIALS[u];
      if (cred && cred.pass === pass) {
        return this._setSession({ kind: 'demo', role: cred.role, user: u, key: cred.key, name: cred.name, label: cred.label });
      }
      // usuarios registrados (por email)
      var reg = findUserByEmail(u);
      if (reg && reg.pass === pass) {
        if (!reg.paid) return { error: 'unpaid', user: reg };
        return this._setSession({ kind: 'registered', role: 'cliente', user: reg.email, key: reg.id, userId: reg.id, name: reg.name, label: 'Paciente · ' + (reg.injury || 'Rehabilitación') });
      }
      return null;
    },

    _setSession: function (s) { s.ts = Date.now(); write(KEYS.session, s); return s; },
    logout: function () { localStorage.removeItem(KEYS.session); },
    session: function () { return read(KEYS.session, null); },

    requireRole: function (role) {
      var s = this.session();
      if (!s) { location.href = 'portal.html'; return null; }
      if (role && s.role !== role) {
        location.href = s.role === 'fisio' ? 'admin.html' : 'paciente.html';
        return null;
      }
      return s;
    },

    /* --- Registro y pago --- */
    emailExists: function (email) { return !!findUserByEmail(email) || (email || '').trim().toLowerCase() === 'fisio'; },

    register: function (data) {
      if (this.emailExists(data.email)) return { error: 'exists' };
      var users = getUsers();
      var user = {
        id: 'u' + Date.now(),
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        pass: data.pass,
        injury: data.injury || '',
        goal: data.goal || '',
        notes: data.notes || '',
        plan: PLAN.name,
        price: PLAN.price,
        paid: false,
        createdAt: new Date().toISOString().slice(0, 10),
        progress: null
      };
      users.push(user);
      saveUsers(users);
      return { user: user };
    },

    /** Simula el cobro y activa la cuenta. */
    pay: function (userId, card) {
      var users = getUsers();
      var u = users.filter(function (x) { return x.id === userId; })[0];
      if (!u) return { error: 'notfound' };
      u.paid = true;
      u.paidAt = new Date().toISOString().slice(0, 10);
      u.cardLast4 = (card && card.number ? card.number.replace(/\s/g, '').slice(-4) : '0000');
      u.progress = freshProgress(u);
      saveUsers(users);
      // chat de bienvenida
      var chats = read(KEYS.chats, {});
      chats[u.id] = [{ id: 'm' + Date.now(), from: 'fisio',
        text: '¡Bienvenido/a a tu portal, ' + u.name.split(' ')[0] + '! Soy Álvaro. He revisado tu caso (' + (u.injury || 'rehabilitación') + ') y en breve te asigno tu plan de ejercicios. Cualquier duda, escríbeme por aquí. 💪',
        date: stamp() }];
      write(KEYS.chats, chats);
      return { user: u };
    },

    currentUser: function () {
      var s = this.session();
      if (!s) return null;
      if (s.kind === 'registered') return findUserById(s.userId);
      return { id: 'cliente', name: s.name, email: 'cliente', injury: 'Rotura de LCA — rodilla derecha' };
    },

    /* --- Vídeos / ejercicios (biblioteca compartida) --- */
    getVideos: function () { return read(KEYS.videos, DEFAULT_VIDEOS); },
    saveVideos: function (list) { write(KEYS.videos, list); },
    addVideo: function (video) { var l = this.getVideos(); video.id = 'v' + Date.now(); l.unshift(video); write(KEYS.videos, l); return video; },
    deleteVideo: function (id) { write(KEYS.videos, this.getVideos().filter(function (v) { return v.id !== id; })); },

    /* --- Progreso (según usuario de la sesión) --- */
    _key: function () { var s = this.session(); return s ? s.key : 'cliente'; },
    getProgress: function () {
      var s = this.session();
      if (s && s.kind === 'registered') {
        var u = findUserById(s.userId);
        return (u && u.progress) ? u.progress : freshProgress({ name: s.name });
      }
      return read(KEYS.progress, DEFAULT_PROGRESS);
    },
    saveProgress: function (p) {
      var s = this.session();
      if (s && s.kind === 'registered') {
        var users = getUsers();
        users.forEach(function (u) { if (u.id === s.userId) u.progress = p; });
        saveUsers(users);
      } else { write(KEYS.progress, p); }
    },
    addSession: function (sess) {
      var p = this.getProgress();
      p.sessions.unshift(sess);
      if (typeof sess.rom === 'number') p.rangeOfMotion = sess.rom;
      if (!p.weeklyPain) p.weeklyPain = [];
      p.weeklyPain.push(sess.pain);
      if (p.weeklyPain.length > 8) p.weeklyPain.shift();
      this.saveProgress(p);
      return p;
    },

    /* --- Pacientes (admin): demo + registrados --- */
    getPatients: function () {
      var demo = read(KEYS.patients, DEFAULT_PATIENTS);
      var regs = getUsers().filter(function (u) { return u.paid; }).map(function (u) {
        var pr = u.progress || {};
        return { id: u.id, name: u.name, injury: u.injury || 'Por valorar',
          phase: pr.currentPhase || 1, progress: pr.overall || 5,
          status: 'Nuevo', last: u.paidAt || u.createdAt, key: u.id, registered: true };
      });
      return regs.concat(demo);
    },

    /** Ficha clínica de un paciente (solo para el panel del fisio). */
    getPatientDetail: function (id) {
      var base = this.getPatients().filter(function (p) { return p.id === id; })[0];
      if (!base) return null;
      var d = { id: base.id, name: base.name, injury: base.injury, phase: base.phase, overall: base.progress,
        status: base.status, last: base.last, surgeryDate: null, goal: '', notes: '', rom: null, strength: null,
        nextSession: null, sessions: [], email: null, plan: null, since: null };
      var pr = null;
      if (base.key === 'cliente') {
        pr = read(KEYS.progress, DEFAULT_PROGRESS);
        d.injury = pr.injury;
        d.email = 'cliente (demo)';
        d.plan = PLAN.name;
      } else if (base.registered) {
        var u = findUserById(base.id);
        pr = (u && u.progress) || {};
        d.email = u && u.email; d.plan = u && u.plan; d.since = u && (u.paidAt || u.createdAt);
        d.goal = (u && u.goal) || ''; d.notes = (u && u.notes) || '';
      }
      if (pr) {
        d.surgeryDate = pr.surgeryDate || null;
        d.goal = pr.goal || d.goal;
        d.notes = pr.notes || d.notes;
        d.phase = pr.currentPhase || d.phase;
        d.overall = typeof pr.overall === 'number' ? pr.overall : d.overall;
        d.rom = pr.rangeOfMotion || null;
        d.strength = pr.strength || null;
        d.nextSession = pr.nextSession || null;
        d.sessions = pr.sessions || [];
      }
      return d;
    },

    /* --- Chats por usuario --- */
    getMessages: function (key) {
      key = key || this._key();
      var chats = read(KEYS.chats, {});
      return chats[key] || [];
    },
    addMessage: function (key, m) {
      if (typeof key === 'object') { m = key; key = this._key(); }
      var chats = read(KEYS.chats, {});
      if (!chats[key]) chats[key] = [];
      m.id = 'm' + Date.now();
      chats[key].push(m);
      write(KEYS.chats, chats);
      return m;
    },

    reset: function () {
      Object.keys(KEYS).forEach(function (k) { if (k !== 'session') localStorage.removeItem(KEYS[k]); });
      seed();
    },

    /* --- Embeds --- */
    embedHtml: function (v, autoplay) {
      if (v.type === 'youtube') {
        var ap = autoplay ? '?autoplay=1&rel=0' : '?rel=0';
        return '<iframe src="https://www.youtube.com/embed/' + v.src + ap + '" title="' + (v.title || '') + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
      }
      if (v.type === 'file' || v.type === 'url') return '<video src="' + v.src + '" controls ' + (autoplay ? 'autoplay muted' : '') + ' playsinline></video>';
      return '';
    },
    thumbHtml: function (v) {
      if (v.type === 'youtube') return '<img src="https://img.youtube.com/vi/' + v.src + '/hqdefault.jpg" alt="' + (v.title || '') + '" loading="lazy" />';
      if (v.type === 'file' || v.type === 'url') return '<video src="' + v.src + '" muted preload="metadata"></video>';
      return '';
    }
  };

  function stamp() {
    var n = new Date();
    return n.toISOString().slice(0, 10) + ' ' + String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
  }

  seed();
  global.Portal = Portal;
})(window);
