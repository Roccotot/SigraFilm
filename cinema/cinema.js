/* ==========================================================================
   Veste cinematografica di sigrafilm.it
   --------------------------------------------------------------------------
   Si accende solo quando <html> ha la classe "cinema", che mette lo script
   in testa a index.html. Senza quella classe questo file non fa nulla e la
   pagina resta quella di sempre.

   Dentro ci sono sei cose, ognuna per conto suo: se una non riesce a partire
   le altre vanno avanti, e sotto resta comunque la pagina normale.

     1. il conto alla rovescia da pellicola, al posto di un'attesa muta
     2. la sala in 3D: il fascio del proiettore che taglia il buio, il
        pulviscolo che ci passa dentro, lo schermo in fondo. La cinepresa si
        sposta mentre si scorre la pagina
     3. il nastro inclinato con i servizi
     4. i quattro numeri raccontati uno alla volta, a pagina ferma
     5. i servizi come fotogrammi di una pellicola che scorre di lato
     6. la luce che segue il puntatore e i tasti che gli vanno incontro

   Niente librerie: il WebGL e' scritto a mano. Il sito non chiede nulla a
   server di altri (e' il motivo per cui anche i caratteri stanno in casa) e
   non si porta dietro mezzo megabyte di codice per una scena sola.
   ========================================================================== */
(function () {
  'use strict';

  var radice = document.documentElement;
  if (!radice.classList.contains('cinema')) return;

  var STRETTO = window.matchMedia('(max-width: 820px)');
  var PUNTATORE = window.matchMedia('(hover: hover) and (pointer: fine)');

  function limita(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function misc(a, b, t) { return a + (b - a) * t; }
  function liscia(t) { t = limita(t, 0, 1); return t * t * (3 - 2 * t); }
  function ora() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

  /* Un elemento "sticky" smette di fermarsi se uno dei suoi contenitori taglia
     o fa scorrere il contenuto. Meglio accorgersene qui e lasciare la sezione
     com'era, che ritrovarsi una striscia vuota alta tre schermi. */
  function fermabile(el) {
    if (!(window.CSS && CSS.supports && CSS.supports('position', 'sticky'))) return false;
    for (var a = el.parentElement; a && a !== radice; a = a.parentElement) {
      var s = getComputedStyle(a);
      if (/auto|scroll|hidden/.test(s.overflowX + ' ' + s.overflowY)) return false;
    }
    return true;
  }

  /* ========================================================================
     2. LA SALA IN 3D
     Il fascio non e' un modello: e' calcolato pixel per pixel. Per ogni punto
     dello schermo si lancia un raggio dalla cinepresa, si trova il tratto in
     cui attraversa la piramide di luce e lungo quel tratto si somma il fumo.
     Cosi' il fascio ha spessore vero, anche standoci dentro. Il conto si fa a
     mezza risoluzione, perche' il fumo e' morbido e non se ne accorge
     nessuno; il pulviscolo invece si disegna a risoluzione piena, sopra.
     ======================================================================== */
  var V_PIENO = 'attribute vec2 aPos;\nvoid main(){ gl_Position = vec4(aPos, 0.0, 1.0); }';

  var PRECISIONE = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif'
  ].join('\n');

  var F_FASCIO = PRECISIONE + '\n' + [
    'uniform vec2 uRis;',
    'uniform vec3 uCam, uDx, uSu, uAv;',
    'uniform float uFov, uTempo, uLung, uPotenza, uPassi, uNebbia;',
    'uniform vec2 uTan;',

    'float caso(vec3 p) {',
    '  p = fract(p * 0.1031);',
    '  p += dot(p, p.zyx + 31.32);',
    '  return fract((p.x + p.y) * p.z);',
    '}',
    'float rumore(vec3 p) {',
    '  vec3 i = floor(p), f = fract(p);',
    '  f = f * f * (3.0 - 2.0 * f);',
    '  float a = caso(i),                     b = caso(i + vec3(1.0, 0.0, 0.0));',
    '  float c = caso(i + vec3(0.0, 1.0, 0.0)), d = caso(i + vec3(1.0, 1.0, 0.0));',
    '  float e = caso(i + vec3(0.0, 0.0, 1.0)), g = caso(i + vec3(1.0, 0.0, 1.0));',
    '  float h = caso(i + vec3(0.0, 1.0, 1.0)), k = caso(i + vec3(1.0, 1.0, 1.0));',
    '  return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y),',
    '             mix(mix(e, g, f.x), mix(h, k, f.x), f.y), f.z);',
    '}',

    /* Taglia il raggio con un semispazio n.p <= k: e' cosi' che si trova il
       tratto dentro la piramide, una faccia alla volta. */
    'void taglia(vec3 n, float k, vec3 ro, vec3 rd, inout float t0, inout float t1) {',
    '  float dn = dot(n, rd), on = dot(n, ro) - k;',
    '  if (abs(dn) < 1.0e-6) { if (on > 0.0) t1 = -1.0; return; }',
    '  float t = -on / dn;',
    '  if (dn > 0.0) t1 = min(t1, t); else t0 = max(t0, t);',
    '}',

    'void main() {',
    '  vec2 q = (gl_FragCoord.xy / uRis) * 2.0 - 1.0;',
    '  q.x *= uRis.x / uRis.y;',
    '  vec3 rd = normalize(uDx * (q.x * uFov) + uSu * (q.y * uFov) + uAv);',
    '  vec3 ro = uCam;',
    '  float ta = uTan.x, tb = uTan.y;',

    '  float t0 = 0.0, t1 = 1.0e4;',
    '  taglia(vec3( 1.0,  0.0, -ta), 0.0,   ro, rd, t0, t1);',
    '  taglia(vec3(-1.0,  0.0, -ta), 0.0,   ro, rd, t0, t1);',
    '  taglia(vec3( 0.0,  1.0, -tb), 0.0,   ro, rd, t0, t1);',
    '  taglia(vec3( 0.0, -1.0, -tb), 0.0,   ro, rd, t0, t1);',
    '  taglia(vec3( 0.0,  0.0,  1.0), uLung, ro, rd, t0, t1);',
    '  taglia(vec3( 0.0,  0.0, -1.0), -0.05, ro, rd, t0, t1);',

    '  vec3 col = vec3(0.0);',

    /* Lo schermo: un rettangolo in fondo alla piramide, con dentro una luce
       che si muove come un film visto fuori fuoco. Attorno, il riverbero
       sulla parete. */
    '  if (rd.z > 1.0e-5 && ro.z < uLung) {',
    '    float t = (uLung - ro.z) / rd.z;',
    '    vec3 p = ro + rd * t;',
    '    vec2 s = vec2(p.x / (uLung * ta), p.y / (uLung * tb));',
    '    float m = max(abs(s.x), abs(s.y));',
    '    if (m < 1.0) {',
    '      float sfarfallio = 0.94 + 0.06 * rumore(vec3(uTempo * 17.0, 3.1, 7.7));',
    /* Quello che passa sullo schermo: luci fuori fuoco che si spostano
       piano, come una citta' di notte ripresa con il diaframma aperto. */
    '      vec2 s2 = vec2(s.x * 2.39, s.y);',
    '      vec3 film = vec3(0.05, 0.06, 0.085) + vec3(0.16, 0.10, 0.05) * (0.5 - 0.5 * s.y);',
    '      for (int k = 0; k < 7; k++) {',
    '        float fk = float(k);',
    '        vec2 c = vec2(sin(fk * 2.4 + uTempo * (0.050 + 0.013 * fk)) * 1.95,',
    '                      cos(fk * 1.7 + uTempo * (0.040 + 0.011 * fk)) * 0.66);',
    '        float r = 0.30 + 0.15 * sin(fk * 3.1);',
    '        float d = length(s2 - c);',
    '        float disco = smoothstep(r, r * 0.90, d) * (0.72 + 0.28 * smoothstep(r * 0.55, r, d));',
    '        vec3 tinta = mix(vec3(1.0, 0.74, 0.36), vec3(1.0, 0.95, 0.86), fract(fk * 0.37));',
    '        film += tinta * disco * 0.33;',
    '      }',
    '      float vign = 1.0 - 0.22 * dot(s, s);',
    '      float orlo = smoothstep(1.0, 0.99, m);',
    '      col = film * vign * sfarfallio * orlo * uPotenza;',
    '    } else {',
    '      col = vec3(1.0, 0.93, 0.80) * 0.045 * exp(-(m - 1.0) * 5.5) * uPotenza;',
    '    }',
    '  }',

    /* Il fumo dentro il fascio */
    '  t0 = max(t0, 0.0);',
    '  if (t1 > t0) {',
    '    float dt = (t1 - t0) / uPassi;',
    '    float sfaso = caso(vec3(gl_FragCoord.xy, fract(uTempo * 0.37) * 97.0));',
    '    float nebbia = 0.0;',
    '    for (int i = 0; i < 24; i++) {',
    '      if (float(i) >= uPassi) break;',
    '      vec3 p = ro + rd * (t0 + (float(i) + sfaso) * dt);',
    '      float z = max(p.z, 0.05);',
    '      vec2 a = vec2(p.x / (z * ta), p.y / (z * tb));',
    '      float orlo = smoothstep(1.0, 0.92, max(abs(a.x), abs(a.y)));',
    '      float caduta = 1.0 / (1.0 + z * 0.16);',
    '      float fumo = rumore(p * vec3(0.85, 1.2, 0.5) + vec3(uTempo * 0.045, uTempo * 0.03, -uTempo * 0.10));',
    /* I raggi: la luce di un film non e' uniforme, e nel fumo si vede a
       strisce che partono dalla lente e cambiano con l'immagine. */
    '      float raggi = rumore(vec3(a * 4.5, uTempo * 0.3));',
    '      nebbia += orlo * caduta * (0.38 + 1.0 * fumo * fumo) * (0.5 + 1.0 * raggi * raggi) * dt;',
    '    }',
    '    col += vec3(1.0, 0.92, 0.76) * nebbia * uNebbia * uPotenza;',
    '  }',

    /* La lente: un punto accecante se la si guarda da davanti, con la lama
       orizzontale di riflesso che fanno le ottiche anamorfiche. */
    '  float dl = max(length(ro), 1.0e-4);',
    '  vec3 vl = -ro / dl;',
    '  float u = 1.0 - max(dot(rd, vl), 0.0);',
    '  float davanti = smoothstep(-0.05, 0.35, ro.z / dl);',
    '  float bagliore = exp(-u * 12000.0) * 4.0 + exp(-u * 900.0) * 0.7 + exp(-u * 70.0) * 0.16;',
    '  vec3 dv = rd - vl;',
    '  float lx = dot(dv, uDx), ly = dot(dv, uSu);',
    '  bagliore += exp(-ly * ly * 26000.0) * exp(-lx * lx * 9.0) * 0.30;',
    '  col += vec3(1.0, 0.92, 0.76) * bagliore * davanti * uPotenza;',

    '  col = 1.0 - exp(-col * 1.5);',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  /* Dalla mezza risoluzione alla tela: vignettatura, il "velo" che abbassa la
     scena dietro il testo, il fondo del sito e una grana fine che nasconde
     le bande dei gradienti. */
  var F_COPIA = PRECISIONE + '\n' + [
    'uniform sampler2D uTex;',
    'uniform vec2 uRis;',
    'uniform float uVelo, uTempo;',
    'float caso2(vec2 p) {',
    '  vec3 p3 = fract(vec3(p.xyx) * 0.1031);',
    '  p3 += dot(p3, p3.yzx + 33.33);',
    '  return fract((p3.x + p3.y) * p3.z);',
    '}',
    'void main() {',
    '  vec2 uv = gl_FragCoord.xy / uRis;',
    '  vec3 c = texture2D(uTex, uv).rgb;',
    '  vec2 v = uv - 0.5;',
    '  c *= 1.0 - dot(v, v) * 0.7;',
    '  c = c * uVelo + vec3(0.039, 0.039, 0.043);',
    '  c += (caso2(gl_FragCoord.xy + fract(uTempo) * 131.0) - 0.5) * 0.02;',
    '  gl_FragColor = vec4(max(c, 0.0), 1.0);',
    '}'
  ].join('\n');

  /* Il pulviscolo. I granelli vivono in una scatola che segue la cinepresa e
     si riavvolge su se stessa: ce n'e' sempre attorno, ovunque si vada, ma
     ognuno resta fermo nel suo punto della sala. Si accendono solo quando
     passano dentro il fascio — e' quello che li fa sembrare veri. Da vicino
     diventano dischi larghi e tenui, come la polvere fuori fuoco. */
  var V_POLVERE = [
    'attribute vec4 aSeme;',
    'uniform mat4 uVista, uProie;',
    'uniform vec3 uCam;',
    'uniform float uTempo, uLung, uScala, uPotenza, uVelo;',
    'uniform vec2 uTan;',
    'varying float vLuce;',
    'const vec3 SCATOLA = vec3(10.0, 6.0, 10.0);',
    'void main() {',
    '  float w = aSeme.w;',
    '  vec3 deriva = vec3(0.010, 0.016, -0.007) * uTempo * (0.35 + w)',
    '              + 0.07 * vec3(sin(uTempo * 0.21 + w * 40.0), cos(uTempo * 0.17 + aSeme.x * 31.0), sin(uTempo * 0.13 + aSeme.y * 23.0));',
    '  vec3 cella = fract(aSeme.xyz + (deriva - uCam) / SCATOLA + 0.5) - 0.5;',
    '  vec3 p = uCam + cella * SCATOLA;',
    '  float dentro = 0.0;',
    '  if (p.z > 0.05 && p.z < uLung) {',
    '    float m = max(abs(p.x) / (p.z * uTan.x), abs(p.y) / (p.z * uTan.y));',
    '    dentro = smoothstep(1.0, 0.90, m) / (1.0 + p.z * p.z * 0.022);',
    '  }',
    '  vec4 pv = uVista * vec4(p, 1.0);',
    '  float dist = -pv.z;',
    '  gl_Position = uProie * pv;',
    '  float px = (0.006 + 0.016 * w * w) * uScala / max(dist, 0.08);',
    '  float vicino = smoothstep(1.8, 0.3, dist);',
    '  px *= 1.0 + vicino * 4.5;',
    '  float energia = 1.0 / (1.0 + vicino * 7.0);',
    '  float scintilla = 0.5 + 0.5 * sin(uTempo * (0.5 + w * 1.9) + aSeme.x * 60.0);',
    '  scintilla = 0.35 + 0.65 * scintilla * scintilla;',
    '  float sottile = min(px, 1.0);',
    '  gl_PointSize = clamp(px, 1.0, 72.0);',
    '  vec3 b = abs(cella) * 2.0;',
    '  float bordo = smoothstep(1.0, 0.8, max(b.x, max(b.y, b.z)));',
    '  vLuce = (dentro + 0.010) * scintilla * energia * sottile * sottile * bordo * uPotenza * uVelo * 1.5;',
    '  if (dist < 0.08) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);',
    '}'
  ].join('\n');

  var F_POLVERE = [
    'precision mediump float;',
    'varying float vLuce;',
    'void main() {',
    '  float r = length(gl_PointCoord - 0.5);',
    '  float a = smoothstep(0.5, 0.08, r);',
    '  gl_FragColor = vec4(vec3(1.0, 0.93, 0.80) * vLuce * a, 1.0);',
    '}'
  ].join('\n');

  /* La geometria della sala: la lente sta nell'origine, il fascio corre lungo
     +z per dodici metri fino allo schermo. Le due tangenti danno un
     rettangolo in formato Scope, 2,39:1. */
  var SALA = { lung: 12, tanX: 0.40, tanY: 0.40 / 2.39 };

  function creaScena() {
    var tela = document.createElement('canvas');
    tela.className = 'scena3d';
    tela.setAttribute('aria-hidden', 'true');

    var opzioni = { alpha: false, antialias: false, depth: false, stencil: false,
                    premultipliedAlpha: false, preserveDrawingBuffer: false };
    var gl = null;
    try { gl = tela.getContext('webgl', opzioni) || tela.getContext('experimental-webgl', opzioni); } catch (e) {}
    if (!gl) return null;

    var pFascio, pCopia, pPolvere, uF, uC, uP;
    var bufTri, bufSemi, tex, fbo;
    var bw = 0, bh = 0;                     // misure del buffer a mezza risoluzione
    var quanti = STRETTO.matches ? 4200 : 9000;
    var viva = false;

    function avverti(che, dettaglio) {
      if (window.console && console.warn) console.warn('cinema: ' + che, dettaglio || '');
    }
    function ombra(tipo, testo) {
      var s = gl.createShader(tipo);
      gl.shaderSource(s, testo);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { avverti('shader non compilato', gl.getShaderInfoLog(s)); return null; }
      return s;
    }
    function programma(v, f, attributo) {
      var a = ombra(gl.VERTEX_SHADER, v), b = ombra(gl.FRAGMENT_SHADER, f);
      if (!a || !b) return null;
      var p = gl.createProgram();
      gl.attachShader(p, a); gl.attachShader(p, b);
      gl.bindAttribLocation(p, 0, attributo);
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { avverti('programma non collegato', gl.getProgramInfoLog(p)); return null; }
      return p;
    }
    function variabili(p, nomi) {
      var o = {};
      for (var i = 0; i < nomi.length; i++) o[nomi[i]] = gl.getUniformLocation(p, nomi[i]);
      return o;
    }

    function allestisci() {
      pFascio  = programma(V_PIENO, F_FASCIO, 'aPos');
      pCopia   = programma(V_PIENO, F_COPIA, 'aPos');
      pPolvere = programma(V_POLVERE, F_POLVERE, 'aSeme');
      if (!pFascio || !pCopia || !pPolvere) return false;

      uF = variabili(pFascio, ['uRis', 'uCam', 'uDx', 'uSu', 'uAv', 'uFov', 'uTempo', 'uLung', 'uPotenza', 'uPassi', 'uTan', 'uNebbia']);
      uC = variabili(pCopia, ['uTex', 'uRis', 'uVelo', 'uTempo']);
      uP = variabili(pPolvere, ['uVista', 'uProie', 'uCam', 'uTempo', 'uLung', 'uScala', 'uPotenza', 'uVelo', 'uTan']);

      bufTri = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, bufTri);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

      var semi = new Float32Array(quanti * 4);
      for (var i = 0; i < semi.length; i++) semi[i] = Math.random();
      bufSemi = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, bufSemi);
      gl.bufferData(gl.ARRAY_BUFFER, semi, gl.STATIC_DRAW);

      tex = gl.createTexture();
      fbo = gl.createFramebuffer();
      gl.enableVertexAttribArray(0);
      gl.disable(gl.DEPTH_TEST);
      bw = bh = 0;
      return true;
    }

    function buffer(w, h) {
      if (w === bw && h === bh) return true;
      bw = w; bh = h;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      var ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return ok;
    }

    if (!allestisci()) return null;
    viva = true;

    /* Se il sistema si riprende la scheda grafica (succede sui telefoni
       quando la memoria stringe) si ricostruisce tutto appena la ridanno. */
    tela.addEventListener('webglcontextlost', function (e) { e.preventDefault(); viva = false; });
    tela.addEventListener('webglcontextrestored', function () { viva = allestisci(); });

    var qualita = 1;                        // scende da sola se il dispositivo arranca
    var larg = 0, alt = 0;                  // misure della tela in pixel CSS

    function dimensiona() {
      var w = tela.clientWidth || window.innerWidth;
      var h = tela.clientHeight || window.innerHeight;
      if (!w || !h) return;
      larg = w; alt = h;
      var densita = Math.min(window.devicePixelRatio || 1, STRETTO.matches ? 1.25 : 1.5) * (qualita < 1 ? 0.8 : 1);
      var tw = Math.max(2, Math.round(w * densita)), th = Math.max(2, Math.round(h * densita));
      if (tela.width !== tw || tela.height !== th) { tela.width = tw; tela.height = th; }
      /* Il fumo si calcola su meta' dei pixel CSS, qualunque sia la densita'
         dello schermo: il costo non deve raddoppiare su un retina. */
      var scala = (STRETTO.matches ? 0.46 : 0.5) * (qualita < 1 ? 0.8 : 1);
      /* ...e ha un tetto: su un monitor 4K meta' dei pixel sarebbero ancora
         due milioni di raggi per fotogramma, troppi per una scheda integrata. */
      scala = Math.min(scala, Math.sqrt(460000 / (w * h)));
      buffer(Math.max(2, Math.round(w * scala)), Math.max(2, Math.round(h * scala)));
    }

    function prospettiva(tanFov, aspetto, vicino, lontano) {
      return new Float32Array([
        1 / (tanFov * aspetto), 0, 0, 0,
        0, 1 / tanFov, 0, 0,
        0, 0, (lontano + vicino) / (vicino - lontano), -1,
        0, 0, (2 * lontano * vicino) / (vicino - lontano), 0
      ]);
    }

    function disegna(s) {
      if (!viva || !larg) return;
      var aspetto = larg / alt;

      /* 1. il fascio, nel buffer piccolo */
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, bw, bh);
      gl.useProgram(pFascio);
      gl.bindBuffer(gl.ARRAY_BUFFER, bufTri);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(uF.uRis, bw, bh);
      gl.uniform3f(uF.uCam, s.cam[0], s.cam[1], s.cam[2]);
      gl.uniform3f(uF.uDx, s.dx[0], s.dx[1], s.dx[2]);
      gl.uniform3f(uF.uSu, s.su[0], s.su[1], s.su[2]);
      gl.uniform3f(uF.uAv, s.av[0], s.av[1], s.av[2]);
      gl.uniform1f(uF.uFov, s.fov);
      gl.uniform1f(uF.uTempo, s.tempo);
      gl.uniform1f(uF.uLung, SALA.lung);
      gl.uniform1f(uF.uPotenza, s.potenza);
      gl.uniform1f(uF.uPassi, qualita < 1 ? 10 : (STRETTO.matches ? 12 : 16));
      gl.uniform2f(uF.uTan, SALA.tanX, SALA.tanY);
      gl.uniform1f(uF.uNebbia, 0.42);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      /* 2. dal buffer alla tela */
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, tela.width, tela.height);
      gl.useProgram(pCopia);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(uC.uTex, 0);
      gl.uniform2f(uC.uRis, tela.width, tela.height);
      gl.uniform1f(uC.uVelo, s.velo);
      gl.uniform1f(uC.uTempo, s.tempo);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      /* 3. il pulviscolo, sommato sopra */
      var vista = new Float32Array([
        s.dx[0], s.su[0], -s.av[0], 0,
        s.dx[1], s.su[1], -s.av[1], 0,
        s.dx[2], s.su[2], -s.av[2], 0,
        -(s.dx[0] * s.cam[0] + s.dx[1] * s.cam[1] + s.dx[2] * s.cam[2]),
        -(s.su[0] * s.cam[0] + s.su[1] * s.cam[1] + s.su[2] * s.cam[2]),
         (s.av[0] * s.cam[0] + s.av[1] * s.cam[1] + s.av[2] * s.cam[2]), 1
      ]);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(pPolvere);
      gl.bindBuffer(gl.ARRAY_BUFFER, bufSemi);
      gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
      gl.uniformMatrix4fv(uP.uVista, false, vista);
      gl.uniformMatrix4fv(uP.uProie, false, prospettiva(s.fov, aspetto, 0.05, 60));
      gl.uniform3f(uP.uCam, s.cam[0], s.cam[1], s.cam[2]);
      gl.uniform1f(uP.uTempo, s.tempo);
      gl.uniform1f(uP.uLung, SALA.lung);
      gl.uniform1f(uP.uScala, tela.height / s.fov);
      gl.uniform1f(uP.uPotenza, s.potenza);
      gl.uniform1f(uP.uVelo, s.velo);
      gl.uniform2f(uP.uTan, SALA.tanX, SALA.tanY);
      gl.drawArrays(gl.POINTS, 0, quanti);
      gl.disable(gl.BLEND);
    }

    return {
      tela: tela,
      dimensiona: dimensiona,
      disegna: disegna,
      aspetto: function () { return larg && alt ? larg / alt : 1.6; },
      alleggerisci: function () { if (qualita === 1) { qualita = 0.8; dimensiona(); } },
      viva: function () { return viva; }
    };
  }

  /* ------------------------------------------------------------------------
     Il percorso della cinepresa. Una stazione per ogni tappa della pagina:
     dove sta la cinepresa (p), dove guarda (m) e quanto e' abbassata la
     scena (v) perche' il testo sopra resti leggibile. Fra una stazione e
     l'altra si passa con dolcezza.

     Si parte seduti in sala, voltati verso la cabina: la lente in alto a
     destra, il fascio che passa sopra la testa. Scorrendo ci si gira, si
     costeggia il fascio per tutta la sua lunghezza e si finisce davanti
     allo schermo.
     ------------------------------------------------------------------------ */
  var STAZIONI = {
    largo: [
      { p: [-0.6, -0.3,  6.0], m: [-2.0, -0.6,  0.0], v: 1.00 },   // testata: dentro il fascio, voltati verso la cabina
      { p: [-5.5, -1.0,  6.5], m: [-2.2, -1.3,  0.5], v: 0.60 },   // chi siamo: si esce di lato, il cono di profilo
      { p: [-1.25,-0.55, 1.6], m: [ 0.7,  0.0, 12.0], v: 1.00 },   // i numeri: si rientra nel fascio, verso lo schermo
      { p: [-3.95,-0.95, 8.7], m: [ 0.9,  0.1, 12.0], v: 1.00 },   // i numeri: in fondo al volo
      { p: [-5.0, -1.6,  3.0], m: [ 1.0,  0.0,  9.0], v: 0.62 },   // servizi: il fascio che arriva sullo schermo, di fianco
      { p: [-5.6, -1.5,  6.5], m: [ 0.6,  0.2, 11.0], v: 0.58 },   // galleria
      { p: [-4.2, -1.3,  3.5], m: [ 0.8,  0.3, 12.0], v: 0.55 },   // marchi
      { p: [ 0.0, -0.9,  5.6], m: [ 0.0,  2.2, 12.0], v: 0.62 },   // contatti: lo schermo di fronte
      { p: [ 0.0, -0.6,  4.6], m: [ 0.0,  2.6, 12.0], v: 0.72 }    // fine pagina
    ],
    stretto: [
      { p: [ 0.0, -0.5,  5.0], m: [-0.6, -2.2,  0.0], v: 1.00 },   // la lente in alto, i raggi che scendono sulla pagina
      { p: [-5.5, -1.0,  6.5], m: [-1.0, -1.6,  1.5], v: 0.55 },
      { p: [-0.9, -0.5,  1.6], m: [ 0.3, -1.2, 12.0], v: 0.95 },   // lo schermo sta in alto, le cifre sotto
      { p: [-2.6, -0.9,  8.2], m: [ 0.4, -1.2, 12.0], v: 0.95 },
      { p: [-4.4, -1.8,  3.0], m: [ 0.8, -0.6,  9.0], v: 0.60 },
      { p: [-5.0, -1.6,  6.5], m: [ 0.5, -0.4, 11.0], v: 0.56 },
      { p: [-3.6, -1.4,  3.5], m: [ 0.6, -0.2, 12.0], v: 0.52 },
      { p: [ 0.0, -0.9,  4.6], m: [ 0.0,  1.6, 12.0], v: 0.60 },
      { p: [ 0.0, -0.7,  3.8], m: [ 0.0,  2.2, 12.0], v: 0.70 }
    ]
  };

  function norma(v) { var l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function vett(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

  /* ========================================================================
     1. IL CONTO ALLA ROVESCIA
     La "coda" che sta in testa a ogni pellicola: 3, 2, 1 con la lancetta che
     spazza il quadrante. Dura poco piu' di un secondo; chi torna sulla pagina
     da un'altra del sito non la rivede. Un tocco o un tasto la saltano.
     ======================================================================== */
  function contoAllaRovescia(finito) {
    /* Chi torna indietro con il tasto del browser, o arriva da un'altra
       pagina del sito, l'ha gia' visto. Lo si capisce da come si e' arrivati
       qui, senza scrivere nulla sul dispositivo: il sito non usa cookie ne'
       altre memorie, e deve restare cosi'. */
    var giaVisto = false;
    try {
      var arrivo = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
      if (arrivo && arrivo.type === 'back_forward') giaVisto = true;
      if (document.referrer && document.referrer.indexOf(location.protocol + '//' + location.host + '/') === 0) giaVisto = true;
    } catch (e) {}

    var el = document.createElement('div');
    el.className = 'conto';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="conto-quadro">' +
        '<i class="conto-spazzata"></i><i class="conto-anello"></i><i class="conto-anello"></i>' +
        '<b class="conto-numero">3</b>' +
      '</div>' +
      '<p class="conto-piede">Sigra Film &middot; Firenze &middot; dal 1954</p>';
    document.body.appendChild(el);

    var quadro = el.querySelector('.conto-quadro');
    var spazzata = el.querySelector('.conto-spazzata');
    var numero = el.querySelector('.conto-numero');

    var pronto = false, chiuso = false, tremito = null;
    function segnaPronto() { pronto = true; }
    if (document.readyState === 'complete') segnaPronto();
    else window.addEventListener('load', segnaPronto);
    setTimeout(segnaPronto, 2600);          // comunque non si aspetta oltre

    function chiudi() {
      if (chiuso) return;
      chiuso = true;
      clearInterval(tremito);
      el.classList.add('via');
      radice.classList.remove('cinema-carica');
      finito();
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 700);
      window.removeEventListener('keydown', chiudi);
    }
    el.addEventListener('click', chiudi);
    window.addEventListener('keydown', chiudi);

    if (giaVisto) {
      el.classList.add('breve');
      (function aspetta() { if (pronto) chiudi(); else setTimeout(aspetta, 40); })();
      return;
    }

    // la pellicola non sta mai ferma nel corridoio: un filo di tremito
    tremito = setInterval(function () {
      quadro.style.transform = 'translate(' + ((Math.random() - 0.5) * 2.4).toFixed(1) + 'px,' + ((Math.random() - 0.5) * 2.4).toFixed(1) + 'px)';
      el.style.setProperty('--riga', (8 + Math.random() * 84).toFixed(1) + '%');
      el.classList.toggle('rigata', Math.random() < 0.35);
    }, 90);

    var DURATA = 430, cifra = 3, partenza = ora();
    (function giro() {
      if (chiuso) return;
      var t = (ora() - partenza) / DURATA;
      if (t >= 1) {
        cifra--;
        if (cifra < 1) {
          // sull'uno ci si ferma finche' la pagina non e' pronta, poi il lampo
          spazzata.style.setProperty('--g', '1');
          (function aspetta() {
            if (chiuso) return;
            if (!pronto) { setTimeout(aspetta, 40); return; }
            el.classList.add('lampo');
            setTimeout(chiudi, 80);
          })();
          return;
        }
        numero.textContent = String(cifra);
        partenza = ora();
        t = 0;
      }
      spazzata.style.setProperty('--g', t.toFixed(3));
      requestAnimationFrame(giro);
    })();
  }

  /* ========================================================================
     3. IL NASTRO
     Una fascia inclinata che scorre sotto la testata con i nomi dei servizi,
     letti dalle schede: se cambia una scheda, cambia anche qui. Accelera
     quando si scorre la pagina e inverte il senso quando si torna su.
     ======================================================================== */
  function creaNastro() {
    var testata = document.querySelector('.hero');
    var titoli = document.querySelectorAll('#servizi .service-card h3');
    if (!testata || !titoli.length) return null;

    var voci = [];
    for (var i = 0; i < titoli.length; i++) voci.push(titoli[i].textContent.replace(/\s+/g, ' ').trim());
    if (document.querySelector('.contratto')) voci.push('Contratti di manutenzione');

    var el = document.createElement('div');
    el.className = 'nastro';
    el.setAttribute('aria-hidden', 'true');
    var corsa = document.createElement('div');
    corsa.className = 'nastro-corsa';
    for (var copia = 0; copia < 3; copia++) {       // tre copie: nessun vuoto nemmeno su uno schermo larghissimo
      for (var j = 0; j < voci.length; j++) {
        var s = document.createElement('span');
        s.textContent = voci[j];
        corsa.appendChild(s);
        corsa.appendChild(document.createElement('i'));
      }
    }
    el.appendChild(corsa);
    testata.parentNode.insertBefore(el, testata.nextSibling);

    var passoCopia = 0, x = 0, vel = 70;
    return {
      misura: function () { passoCopia = corsa.scrollWidth / 3; },
      avanza: function (dt, velPagina) {
        if (!passoCopia) return;
        var verso = velPagina < -30 ? -1 : 1;
        var voluta = (70 + Math.min(Math.abs(velPagina), 2600) * 0.5) * verso;
        vel += (voluta - vel) * Math.min(1, dt * 3.5);
        x = (x + vel * dt) % passoCopia;
        if (x < 0) x += passoCopia;
        corsa.style.transform = 'translate3d(' + (-x).toFixed(1) + 'px,0,0)';
      }
    };
  }

  /* ========================================================================
     4. I NUMERI
     La fascia dei quattro numeri diventa una scena a pagina ferma: mentre si
     scorre resta li', i numeri si danno il cambio uno alla volta e dietro la
     cinepresa vola lungo il fascio. I valori si leggono dalla fascia
     originale, che resta nel documento (nascosta) come unica fonte: lo
     script che riallinea i numeri all'inventario continua a scrivere li'.
     ======================================================================== */
  function creaNumeri() {
    var fascia = document.querySelector('.stats-band');
    var sezione = document.getElementById('chisiamo');
    if (!fascia || !sezione) return null;
    var scatole = fascia.querySelectorAll('.stat-box');
    if (scatole.length < 2) return null;

    var dati = [];
    for (var i = 0; i < scatole.length; i++) {
      var n = scatole[i].querySelector('.stat-number'), d = scatole[i].querySelector('.stat-label');
      if (!n) continue;
      var dida = '';
      if (d) {
        var copia = d.cloneNode(true), acapo = copia.querySelectorAll('br');
        for (var k = 0; k < acapo.length; k++) acapo[k].parentNode.replaceChild(document.createTextNode(' '), acapo[k]);
        dida = copia.textContent.replace(/\s+/g, ' ').trim();
      }
      dati.push({ valore: parseInt(n.getAttribute('data-target') || n.textContent, 10) || 0,
                  coda: n.getAttribute('data-suffix') || '', dida: dida });
    }
    if (dati.length < 2) return null;

    var pista = document.createElement('div');
    pista.className = 'numeri';
    pista.style.setProperty('--n', String(dati.length));
    var fermo = document.createElement('div');
    fermo.className = 'numeri-fermo';
    var interno = document.createElement('div');
    interno.className = 'wrap numeri-interno';

    var occhiello = document.createElement('span');
    occhiello.className = 'eyebrow numeri-occhiello';
    occhiello.textContent = 'Sigra Film in cifre';
    interno.appendChild(occhiello);

    var quadri = [], cifre = [], passi = [];
    var palco = document.createElement('div');
    palco.className = 'numeri-palco';
    for (var q = 0; q < dati.length; q++) {
      var quadro = document.createElement('div');
      quadro.className = 'numeri-quadro';
      var cifra = document.createElement('span');
      cifra.className = 'numeri-cifra';
      cifra.textContent = dati[q].valore + dati[q].coda;
      var didascalia = document.createElement('span');
      didascalia.className = 'numeri-dida';
      didascalia.textContent = dati[q].dida;
      quadro.appendChild(cifra);
      quadro.appendChild(didascalia);
      palco.appendChild(quadro);
      quadri.push(quadro); cifre.push(cifra);
    }
    interno.appendChild(palco);

    var barra = document.createElement('div');
    barra.className = 'numeri-passi';
    barra.setAttribute('aria-hidden', 'true');
    for (var b = 0; b < dati.length; b++) { var tacca = document.createElement('i'); barra.appendChild(tacca); passi.push(tacca); }
    interno.appendChild(barra);

    fermo.appendChild(interno);
    pista.appendChild(fermo);
    sezione.parentNode.insertBefore(pista, sezione.nextSibling);

    if (!fermabile(fermo)) { pista.parentNode.removeChild(pista); return null; }
    fascia.style.display = 'none';

    var cima = 0, corsa = 1, attuale = -1, contati = [];

    function conta(indice) {
      if (contati[indice]) return;
      contati[indice] = true;
      var arrivo = dati[indice].valore, coda = dati[indice].coda, el = cifre[indice], t0 = ora();
      (function passo() {
        var t = Math.min((ora() - t0) / 1000, 1), e = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(arrivo * e) + (t === 1 ? coda : '');
        if (t < 1) requestAnimationFrame(passo);
      })();
    }

    return {
      pista: pista,
      misura: function () {
        cima = pista.getBoundingClientRect().top + window.pageYOffset;
        corsa = Math.max(1, pista.offsetHeight - fermo.offsetHeight);
      },
      cima: function () { return cima; },
      fondo: function () { return cima + corsa; },
      aggiorna: function (y) {
        var p = limita((y - cima) / corsa, 0, 0.9999);
        var i = Math.floor(p * dati.length);
        if (i === attuale) return;
        attuale = i;
        for (var k = 0; k < quadri.length; k++) {
          quadri[k].classList.toggle('attivo', k === i);
          quadri[k].classList.toggle('passato', k < i);
          passi[k].classList.toggle('acceso', k <= i);
        }
        // il conteggio parte solo quando il numero e' davvero in vista
        if (y > cima - window.innerHeight * 0.6) conta(i);
        else attuale = -1;
      }
    };
  }

  /* ========================================================================
     5. LA PELLICOLA DEI SERVIZI
     Le schede dei servizi si mettono in fila come fotogrammi. La sezione si
     ferma a tutto schermo e lo scorrimento verticale fa scorrere la
     pellicola di lato, con le perforazioni sopra e sotto.
     ======================================================================== */
  function creaPellicola() {
    var griglia = document.querySelector('#servizi .services-grid');
    if (!griglia) return null;
    var schede = griglia.querySelectorAll('.service-card');
    if (schede.length < 3) return null;
    var testa = griglia.previousElementSibling;
    if (testa && !testa.classList.contains('section-head')) testa = null;

    var pista = document.createElement('div');
    pista.className = 'pellicola';
    var fermo = document.createElement('div');
    fermo.className = 'pellicola-fermo';
    var finestra = document.createElement('div');
    finestra.className = 'pellicola-finestra';
    griglia.parentNode.insertBefore(pista, testa || griglia);
    pista.appendChild(fermo);

    if (!fermabile(fermo)) { pista.parentNode.removeChild(pista); return null; }

    if (testa) fermo.appendChild(testa);
    fermo.appendChild(finestra);
    finestra.appendChild(griglia);
    // le schede entravano una da sinistra e una da destra: in fila non ha piu' senso
    for (var i = 0; i < schede.length; i++) schede[i].classList.add('visible');

    var conta = document.createElement('div');
    conta.className = 'pellicola-conta';
    conta.setAttribute('aria-hidden', 'true');
    conta.innerHTML = '<span class="pellicola-quale">01</span><span class="pellicola-riga"><i></i></span><span>' +
                      (schede.length < 10 ? '0' : '') + schede.length + '</span>';
    fermo.appendChild(conta);
    var quale = conta.querySelector('.pellicola-quale'), riga = conta.querySelector('.pellicola-riga i');
    var barra = document.querySelector('.nav'), piede = document.querySelector('.quickbar');

    var cima = 0, corsa = 0, ultimo = -1, libera = false, sola = false;
    return {
      /* La sezione si ferma centrata sotto la barra. Se titolo e pellicola
         insieme non ci stanno, si lascia uscire il titolo e si ferma la sola
         pellicola. Se non ci sta nemmeno quella (telefono di traverso), non
         si ferma niente e la pellicola si sfoglia col dito. */
      misura: function () {
        var sotto = barra ? barra.offsetHeight : 68;
        // sui telefoni c'e' anche la barra dei contatti in fondo: lo spazio buono finisce li'
        var fondo = piede && getComputedStyle(piede).display !== 'none' ? piede.offsetHeight : 0;
        var spazio = window.innerHeight - sotto - fondo;
        var tutto = fermo.offsetHeight;
        var daFinestra = tutto - finestra.offsetTop;
        corsa = Math.max(0, griglia.offsetWidth - finestra.clientWidth);
        var su = null;
        sola = false;
        if (tutto <= spazio - 16) su = sotto + (spazio - tutto) / 2;
        else if (daFinestra <= spazio - 8) { su = sotto + (spazio - daFinestra) / 2 - finestra.offsetTop; sola = true; }
        libera = su === null || corsa < 40;
        pista.classList.toggle('pellicola--libera', libera);
        if (libera) sola = false;
        if (libera) {
          griglia.style.transform = '';
          pista.style.height = '';
          corsa = Math.max(0, finestra.scrollWidth - finestra.clientWidth);
          return;
        }
        su = Math.round(su);
        fermo.style.top = su + 'px';
        pista.style.height = (tutto + corsa) + 'px';
        cima = pista.getBoundingClientRect().top + window.pageYOffset - su;
      },
      aggiorna: function (y) {
        // quando si ferma la sola pellicola, il titolo rimasto a meta' sotto la barra si spegne
        fermo.classList.toggle('pellicola-sola', sola && y > cima - 70);
        if (!corsa) return;
        var p;
        if (libera) p = limita(finestra.scrollLeft / corsa, 0, 1);
        else {
          p = limita((y - cima) / corsa, 0, 1);
          griglia.style.transform = 'translate3d(' + (-p * corsa).toFixed(1) + 'px,0,0)';
        }
        riga.style.transform = 'scaleX(' + p.toFixed(3) + ')';
        var n = Math.min(schede.length, Math.round(p * (schede.length - 1)) + 1);
        if (n !== ultimo) { ultimo = n; quale.textContent = (n < 10 ? '0' : '') + n; }
      }
    };
  }

  /* ========================================================================
     6. LA LUCE DEL PUNTATORE E I TASTI
     Solo dove c'e' un mouse: una macchia di luce segue il puntatore con un
     filo di ritardo, e i tasti principali gli vanno incontro di qualche
     pixel.
     ======================================================================== */
  function creaLuce() {
    if (!PUNTATORE.matches) return null;
    var el = document.createElement('div');
    el.className = 'luce-puntatore';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);

    var vx = -400, vy = -400, x = vx, y = vy, vista = false;
    window.addEventListener('pointermove', function (e) {
      vx = e.clientX; vy = e.clientY;
      if (!vista) { vista = true; x = vx; y = vy; el.classList.add('accesa'); }
    }, { passive: true });
    document.addEventListener('pointerleave', function () { vista = false; el.classList.remove('accesa'); });

    var tasti = document.querySelectorAll('.hero-actions .btn-primary, .hero-actions .btn-noc, .cta-band .btn-primary');
    for (var i = 0; i < tasti.length; i++) (function (t) {
      t.addEventListener('pointermove', function (e) {
        var r = t.getBoundingClientRect();
        t.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px');
        t.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px');
      });
      t.addEventListener('pointerleave', function () { t.style.removeProperty('--mx'); t.style.removeProperty('--my'); });
    })(tasti[i]);

    return {
      avanza: function (dt) {
        var k = Math.min(1, dt * 9);
        x += (vx - x) * k; y += (vy - y) * k;
        el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      }
    };
  }

  /* ========================================================================
     LA REGIA
     ======================================================================== */
  function regia() {
    var scena = null, nastro = null, numeri = null, pellicola = null, luce = null;
    try { scena = creaScena(); } catch (e) { scena = null; }
    try { nastro = creaNastro(); } catch (e) { nastro = null; }
    try { numeri = creaNumeri(); } catch (e) { numeri = null; }
    try { pellicola = creaPellicola(); } catch (e) { pellicola = null; }
    try { luce = creaLuce(); } catch (e) { luce = null; }

    if (scena) {
      document.body.insertBefore(scena.tela, document.body.firstChild);
      radice.classList.add('scena-ok');
      // lo strato di pulviscolo in 2D lascia il posto a questo
      try { window.dispatchEvent(new Event('sigra:scena3d')); } catch (e) {
        var ev = document.createEvent('Event'); ev.initEvent('sigra:scena3d', false, false); window.dispatchEvent(ev);
      }
    }

    /* Le tappe della pagina, in pixel di scorrimento: servono a sapere a che
       punto del percorso si trova la cinepresa. Si rimisurano quando la pagina
       cambia altezza (immagini che arrivano, finestra ridimensionata). */
    var ancore = [0, 1, 2, 3, 4, 5, 6, 7, 8], altezzaNota = -1, larghezzaNota = -1;
    function cimaDi(id) {
      var el = document.getElementById(id);
      return el ? el.getBoundingClientRect().top + window.pageYOffset : null;
    }
    function misuraTutto() {
      if (scena) scena.dimensiona();
      if (nastro) nastro.misura();
      if (pellicola) pellicola.misura();
      if (numeri) numeri.misura();

      var fine = Math.max(1, radice.scrollHeight - window.innerHeight);
      var chi = cimaDi('chisiamo'), ser = cimaDi('servizi'), gal = cimaDi('galleria'),
          mar = cimaDi('marchi'), con = cimaDi('contatti');
      var a = [0,
               chi === null ? fine * 0.10 : chi,
               numeri ? numeri.cima() : (ser === null ? fine * 0.2 : ser - window.innerHeight * 0.6),
               numeri ? numeri.fondo() : (ser === null ? fine * 0.25 : ser - window.innerHeight * 0.2),
               ser === null ? fine * 0.30 : ser + window.innerHeight * 0.35,
               gal === null ? fine * 0.50 : gal,
               mar === null ? fine * 0.70 : mar,
               con === null ? fine * 0.90 : con,
               fine];
      // devono salire sempre: una pagina strana non deve far fare salti alla cinepresa
      for (var i = 1; i < a.length; i++) if (a[i] <= a[i - 1]) a[i] = a[i - 1] + 1;
      ancore = a;
      altezzaNota = radice.scrollHeight;
      larghezzaNota = window.innerWidth;
    }

    function tappa(y) {
      var i = 0;
      while (i < ancore.length - 2 && y >= ancore[i + 1]) i++;
      return i + limita((y - ancore[i]) / (ancore[i + 1] - ancore[i]), 0, 1);
    }

    var cam = null;                               // stato corrente, inseguito con dolcezza
    var mouse = { x: 0, y: 0, vx: 0, vy: 0 };
    if (PUNTATORE.matches) {
      window.addEventListener('pointermove', function (e) {
        mouse.vx = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.vy = (e.clientY / window.innerHeight) * 2 - 1;
      }, { passive: true });
    }

    /* La lampada non si accende di colpo: innesca, cala, riprende. */
    var accensione = -1;
    function potenzaLampada(adesso) {
      if (accensione < 0) return 0;
      var t = (adesso - accensione) / 1000;
      if (t < 0.06) return misc(0, 0.95, t / 0.06);
      if (t < 0.14) return misc(0.95, 0.22, (t - 0.06) / 0.08);
      if (t < 0.26) return misc(0.22, 1.25, (t - 0.14) / 0.12);
      if (t < 0.8)  return misc(1.25, 1.0, (t - 0.26) / 0.54);
      return 1;
    }

    var ultimo = ora(), yPrima = window.pageYOffset, velPagina = 0;
    var fotogrammi = 0, lenti = 0, pari = false, attivita = ora();

    window.addEventListener('scroll', function () { attivita = ora(); }, { passive: true });
    window.addEventListener('pointermove', function () { attivita = ora(); }, { passive: true });

    function fotogramma() {
      requestAnimationFrame(fotogramma);
      if (document.hidden) { ultimo = ora(); return; }

      var adesso = ora(), dt = Math.min((adesso - ultimo) / 1000, 0.1);

      /* A pagina ferma il pulviscolo non ha bisogno di sessanta fotogrammi al
         secondo: se ne salta uno su due e la batteria ringrazia. */
      var fermo = adesso - attivita > 900 && accensione > 0 && adesso - accensione > 1500;
      if (fermo) { pari = !pari; if (pari) return; }
      ultimo = adesso;

      if (radice.scrollHeight !== altezzaNota || window.innerWidth !== larghezzaNota) misuraTutto();

      var y = window.pageYOffset;
      velPagina = misc(velPagina, (y - yPrima) / Math.max(dt, 0.001), Math.min(1, dt * 8));
      yPrima = y;

      if (nastro) nastro.avanza(dt, velPagina);
      if (numeri) numeri.aggiorna(y);
      if (pellicola) pellicola.aggiorna(y);
      if (luce) luce.avanza(dt);

      if (!scena || !scena.viva()) return;

      var tabella = scena.aspetto() < 0.9 ? STAZIONI.stretto : STAZIONI.largo;
      var s = tappa(y), i = Math.min(Math.floor(s), tabella.length - 2), f = liscia(s - i);
      var A = tabella[i], B = tabella[i + 1];
      var voluta = {
        p: [misc(A.p[0], B.p[0], f), misc(A.p[1], B.p[1], f), misc(A.p[2], B.p[2], f)],
        m: [misc(A.m[0], B.m[0], f), misc(A.m[1], B.m[1], f), misc(A.m[2], B.m[2], f)],
        v: misc(A.v, B.v, f)
      };
      if (!cam) cam = { p: voluta.p.slice(), m: voluta.m.slice(), v: voluta.v };
      var k = 1 - Math.exp(-dt * 5.5);
      for (var c = 0; c < 3; c++) {
        cam.p[c] += (voluta.p[c] - cam.p[c]) * k;
        cam.m[c] += (voluta.m[c] - cam.m[c]) * k;
      }
      cam.v += (voluta.v - cam.v) * k;

      mouse.x += (mouse.vx - mouse.x) * Math.min(1, dt * 3);
      mouse.y += (mouse.vy - mouse.y) * Math.min(1, dt * 3);

      var av = norma([cam.m[0] - cam.p[0], cam.m[1] - cam.p[1], cam.m[2] - cam.p[2]]);
      var dx = norma(vett(av, [0, 1, 0]));
      var su = vett(dx, av);
      // il respiro: un filo di deriva anche a mouse fermo, e il mouse che sposta il punto di vista
      var t = adesso / 1000;
      var ox = mouse.x * 0.16 + Math.sin(t * 0.23) * 0.035, oy = -mouse.y * 0.09 + Math.cos(t * 0.19) * 0.025;
      var pos = [cam.p[0] + dx[0] * ox + su[0] * oy, cam.p[1] + dx[1] * ox + su[1] * oy, cam.p[2] + dx[2] * ox + su[2] * oy];

      var aspetto = scena.aspetto();
      scena.disegna({
        cam: pos, dx: dx, su: su, av: av,
        fov: Math.max(0.47, 0.36 / aspetto),
        tempo: t % 3600,
        potenza: potenzaLampada(adesso),
        velo: cam.v
      });

      /* Se i primi fotogrammi arrancano si abbassa la qualita' una volta, e basta. */
      if (accensione > 0 && fotogrammi < 90) {
        fotogrammi++;
        if (dt > 0.034) lenti++;
        if (fotogrammi === 90 && lenti > 45) scena.alleggerisci();
      }
    }

    misuraTutto();
    requestAnimationFrame(fotogramma);
    window.addEventListener('resize', function () { altezzaNota = -1; }, { passive: true });
    window.addEventListener('load', function () { altezzaNota = -1; });

    contoAllaRovescia(function () {
      accensione = ora();
      attivita = ora();
    });
  }

  /* Il foglio di stile e lo script arrivano ognuno per conto suo. Senza gli
     stili questa veste sarebbe solo confusione, quindi si aspetta il segnale
     che il foglio mette su <html>; se non arriva, si torna alla pagina di
     sempre. */
  function spegni() {
    radice.classList.remove('cinema', 'cinema-carica', 'cinema-viva', 'scena-ok');
  }
  radice.classList.add('cinema-viva');
  var attesaStile = ora();
  (function aspettaStile() {
    var segno = '';
    try { segno = getComputedStyle(radice).getPropertyValue('--cinema-pronto'); } catch (e) {}
    if (String(segno).trim() === '1') {
      try { regia(); } catch (e) { spegni(); if (window.console && console.warn) console.warn('cinema: regia interrotta', e); }
      return;
    }
    if (ora() - attesaStile > 3500) { spegni(); return; }
    setTimeout(aspettaStile, 30);
  })();
})();
