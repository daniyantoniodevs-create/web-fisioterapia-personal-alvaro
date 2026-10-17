/* ===========================================================
   Shader WebGL — degradado "mesh" animado para el hero
   Efecto estilo Framer (shader marketplace), 100% nativo y
   sin dependencias. Degrada con elegancia si no hay WebGL.
   =========================================================== */
(function () {
  'use strict';

  var canvas = document.getElementById('heroShader');
  if (!canvas) return;

  // Respeta "reduce motion" y dispositivos sin WebGL
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return; // se mantiene la aurora CSS de respaldo

  var hero = canvas.closest('.hero');
  if (hero) hero.classList.add('shader-on');

  var vs = 'attribute vec2 p; void main(){ gl_Position = vec4(p,0.0,1.0); }';

  var fs = [
    'precision highp float;',
    'uniform float u_time;',
    'uniform vec2 u_res;',
    // paleta de marca
    'const vec3 navy = vec3(0.055,0.031,0.039);',  // casi negro cálido
    'const vec3 teal = vec3(0.560,0.063,0.110);',  // granate
    'const vec3 sky  = vec3(0.839,0.157,0.224);',  // rojo Graus
    'const vec3 mint = vec3(0.290,0.039,0.075);',  // vino oscuro
    'const vec3 viol = vec3(1.000,0.420,0.340);',  // coral
    'void main(){',
    '  vec2 uv = gl_FragCoord.xy / u_res.xy;',
    '  float ar = u_res.x / u_res.y;',
    '  vec2 p = vec2(uv.x * ar, uv.y);',
    '  float t = u_time * 0.10;',
    // centros de color en movimiento (mesh gradient fluido)
    '  vec2 c1 = vec2((0.30 + 0.22*sin(t*1.1)) * ar, 0.32 + 0.20*cos(t*0.9));',
    '  vec2 c2 = vec2((0.72 + 0.20*cos(t*0.8)) * ar, 0.60 + 0.24*sin(t*1.3));',
    '  vec2 c3 = vec2((0.50 + 0.28*sin(t*0.6+2.0)) * ar, 0.82 + 0.16*cos(t*1.1));',
    '  vec2 c4 = vec2((0.82 + 0.16*sin(t*1.4)) * ar, 0.22 + 0.20*cos(t*0.7));',
    '  vec3 col = navy;',
    '  col = mix(col, teal, smoothstep(0.70, 0.0, distance(p,c1)) * 0.85);',
    '  col = mix(col, sky,  smoothstep(0.62, 0.0, distance(p,c2)) * 0.55);',
    '  col = mix(col, mint, smoothstep(0.52, 0.0, distance(p,c3)));',
    '  col = mix(col, viol, smoothstep(0.45, 0.0, distance(p,c4)) * 0.22);',
    // líneas de "movimiento" sutiles (como un electromiograma)
    '  float wave = abs(uv.y - 0.5 - 0.12*sin(uv.x*6.0 + t*6.0) * sin(t*2.0+uv.x*2.0));',
    '  col += vec3(1.0,0.25,0.3) * smoothstep(0.006, 0.0, wave) * 0.10;',
    // grano sutil para textura premium
    '  float g = fract(sin(dot(uv, vec2(12.9898,78.233))) * 43758.5453);',
    '  col += (g - 0.5) * 0.025;',
    // viñeteado suave
    '  col *= 1.0 - 0.45 * distance(uv, vec2(0.5));',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  }

  var prog = gl.createProgram();
  var v = compile(gl.VERTEX_SHADER, vs);
  var f = compile(gl.FRAGMENT_SHADER, fs);
  if (!v || !f) { if (hero) hero.classList.remove('shader-on'); return; }
  gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
  gl.useProgram(prog);

  // quad a pantalla completa
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var uTime = gl.getUniformLocation(prog, 'u_time');
  var uRes = gl.getUniformLocation(prog, 'u_res');

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.8);
    var w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  window.addEventListener('resize', resize);
  resize();

  // pausa cuando el hero no está visible (ahorra batería)
  var visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { threshold: 0 })
      .observe(canvas);
  }

  var start = performance.now();
  function frame(now) {
    if (visible) {
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
