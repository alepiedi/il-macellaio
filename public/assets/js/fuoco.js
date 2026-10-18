/*
 * Il fuoco del sito: brace in WebGL nell'apertura, scintille, carboni e fumo.
 * Ogni animazione gira solo quando è sullo schermo e si ferma con "riduci movimento".
 */
(function () {
  'use strict';

  var fermo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var telefono = window.matchMedia('(max-width: 720px)').matches;

  // Fa girare disegna(t) solo mentre l'elemento è visibile e la scheda è aperta.
  function ciclo(el, disegna) {
    var visibile = false, id = 0, inizio = performance.now();
    function passo(ora) {
      disegna((ora - inizio) / 1000);
      id = requestAnimationFrame(passo);
    }
    function aggiorna() {
      cancelAnimationFrame(id);
      if (visibile && !document.hidden && !fermo) id = requestAnimationFrame(passo);
    }
    new IntersectionObserver(function (voci) {
      visibile = voci[0].isIntersecting;
      aggiorna();
    }, { rootMargin: '100px' }).observe(el);
    document.addEventListener('visibilitychange', aggiorna);
    disegna(fermo ? 2.5 : 0);
  }

  function adatta(canvas, scala) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2) * (scala || 1);
    var w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    var h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; return true; }
    return false;
  }

  /* ---------- Apertura: brace e fumo in uno shader ---------- */
  var FRAMMENTO = [
    'precision mediump float;',
    'uniform vec2 r; uniform float t; uniform vec2 m;',
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
    ' return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}',
    'void main(){',
    ' vec2 uv=gl_FragCoord.xy/r; float ar=r.x/r.y; vec2 p=vec2(uv.x*ar,uv.y);',
    ' float q=fbm(vec2(p.x*2.2,p.y*1.6-t*.45));',
    ' float w=fbm(vec2(p.x*4.5+q*1.4,p.y*3.2-t*1.1));',
    ' float f=1.-smoothstep(-.05,.62,uv.y+(w-.5)*.42);',
    ' f*=.75+.35*fbm(vec2(p.x*7.,t*.7));',
    ' vec2 mm=vec2(m.x*ar,m.y); float d=distance(p,mm);',
    ' f+=.32*exp(-d*d*9.)*(1.-smoothstep(.15,.95,uv.y));',
    ' vec3 c=vec3(.047,.039,.035);',
    ' c=mix(c,vec3(.32,.04,.02),smoothstep(.02,.35,f));',
    ' c=mix(c,vec3(.95,.3,.07),smoothstep(.35,.72,f));',
    ' c=mix(c,vec3(1.,.72,.36),smoothstep(.8,1.1,f));',
    ' float s=fbm(vec2(p.x*1.3+t*.02,p.y*1.5-t*.09)+q);',
    ' float fumo=smoothstep(.5,.9,s)*smoothstep(1.05,.25,uv.y)*.16;',
    ' c+=vec3(.95,.86,.78)*fumo*(1.-smoothstep(.05,.3,f));',
    ' float v=smoothstep(1.25,.35,length((uv-vec2(.5,.45))*vec2(1.,1.3)));',
    ' gl_FragColor=vec4(c*mix(.55,1.,max(v,smoothstep(.3,.9,f))),1.);',
    '}'
  ].join('\n');

  function hero(canvas) {
    var gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return;
    function compila(tipo, src) {
      var s = gl.createShader(tipo);
      gl.shaderSource(s, src); gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    }
    var vs = compila(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}');
    var fs = compila(gl.FRAGMENT_SHADER, FRAMMENTO);
    if (!vs || !fs) return;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var a = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    var uR = gl.getUniformLocation(prog, 'r'), uT = gl.getUniformLocation(prog, 't'), uM = gl.getUniformLocation(prog, 'm');

    var mouse = { x: .5, y: .15 }, obiettivo = { x: .5, y: .15 };
    canvas.parentElement.addEventListener('pointermove', function (e) {
      var b = canvas.getBoundingClientRect();
      obiettivo.x = (e.clientX - b.left) / b.width;
      obiettivo.y = 1 - (e.clientY - b.top) / b.height;
    });

    canvas.style.background = 'none';
    ciclo(canvas, function (t) {
      adatta(canvas, telefono ? .45 : .55);
      mouse.x += (obiettivo.x - mouse.x) * .05;
      mouse.y += (obiettivo.y - mouse.y) * .05;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.uniform1f(uT, t);
      gl.uniform2f(uM, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
  }

  /* ---------- Scintille che salgono ---------- */
  function scintille(canvas, quante) {
    var ctx = canvas.getContext('2d');
    var lista = [], ultimo = 0;
    function nuova(w, h, ovunque) {
      return {
        x: Math.random() * w,
        y: ovunque ? Math.random() * h : h + 10,
        vx: (Math.random() - .5) * 20,
        vy: -(40 + Math.random() * 110),
        vita: 0,
        durata: 2 + Math.random() * 4,
        r: .6 + Math.random() * 1.6,
        fase: Math.random() * 6.28,
      };
    }
    ciclo(canvas, function (t) {
      adatta(canvas);
      var w = canvas.width, h = canvas.height, dpr = w / canvas.clientWidth;
      var dt = Math.min(.05, t - ultimo); ultimo = t;
      if (!lista.length) for (var i = 0; i < quante; i++) lista.push(nuova(w, h, true));
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      lista.forEach(function (s, i) {
        s.vita += dt;
        s.vx += Math.sin(t * 2 + s.fase) * 30 * dt;
        s.x += s.vx * dt * dpr;
        s.y += s.vy * dt * dpr;
        var k = s.vita / s.durata;
        if (k >= 1 || s.y < -10) { lista[i] = nuova(w, h); return; }
        var a = Math.sin(Math.PI * k) * (.6 + .4 * Math.sin(t * 20 + s.fase));
        ctx.strokeStyle = 'rgba(255,' + (120 + 100 * (1 - k) | 0) + ',60,' + a.toFixed(3) + ')';
        ctx.lineWidth = s.r * dpr;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * .04 * dpr, s.y - s.vy * .04 * dpr);
        ctx.stroke();
      });
    });
  }

  /* ---------- Carboni accesi (scheda "Brace") ---------- */
  // Pezzi di carbone scuri e irregolari: la luce viene dalle fessure tra un pezzo e l'altro.
  function braci(canvas) {
    var ctx = canvas.getContext('2d');
    var carboni = [];
    function pezzo(cx, cy, r) {
      var punti = [], lati = 6 + (Math.random() * 3 | 0);
      for (var i = 0; i < lati; i++) {
        var a = i / lati * Math.PI * 2 + Math.random() * .4;
        var d = r * (.7 + Math.random() * .35);
        punti.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * .7]);
      }
      return { x: cx, y: cy, r: r, punti: punti, f: Math.random() * 10, v: .4 + Math.random() * 1.4, acceso: Math.random() };
    }
    function traccia(c, s) {
      ctx.beginPath();
      c.punti.forEach(function (p, i) {
        var x = c.x + (p[0] - c.x) * s, y = c.y + (p[1] - c.y) * s;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      });
      ctx.closePath();
    }
    ciclo(canvas, function (t) {
      if (adatta(canvas) || !carboni.length) {
        carboni = [];
        var w = canvas.width, h = canvas.height, passo = w / 11;
        for (var y = h * .42; y < h + passo; y += passo * .5) {
          for (var x = -passo / 2; x < w + passo; x += passo * .78) {
            carboni.push(pezzo(x + (Math.random() - .5) * passo * .5, y + (Math.random() - .5) * passo * .25, passo * (.42 + Math.random() * .25)));
          }
        }
      }
      var W = canvas.width, H = canvas.height;
      // il fuoco sotto i carboni
      var respiro = .75 + .25 * Math.sin(t * 1.3) * Math.sin(t * .7 + 1);
      var fondo = ctx.createLinearGradient(0, H * .3, 0, H);
      fondo.addColorStop(0, '#0d0908');
      fondo.addColorStop(.35, 'rgba(160,40,10,' + (.9 * respiro).toFixed(3) + ')');
      fondo.addColorStop(1, 'rgba(255,' + (150 + 60 * respiro | 0) + ',60,1)');
      ctx.fillStyle = fondo;
      ctx.fillRect(0, 0, W, H);
      carboni.forEach(function (c) {
        var vivo = Math.max(0, Math.sin(t * c.v + c.f) * .5 + .5) * c.acceso;
        var g = ctx.createRadialGradient(c.x, c.y - c.r * .5, 0, c.x, c.y, c.r * 1.1);
        g.addColorStop(0, 'rgb(' + (48 + 30 * vivo | 0) + ',' + (40 + 6 * vivo | 0) + ',' + (38 | 0) + ')');
        g.addColorStop(.6, 'rgb(' + (26 + 110 * vivo | 0) + ',' + (18 + 20 * vivo | 0) + ',14)');
        g.addColorStop(1, 'rgb(' + (60 + 180 * vivo | 0) + ',' + (20 + 60 * vivo | 0) + ',10)');
        ctx.fillStyle = g;
        traccia(c, 1);
        ctx.fill();
        if (vivo > .55) {
          ctx.strokeStyle = 'rgba(255,' + (140 + 90 * vivo | 0) + ',70,' + ((vivo - .55) * 1.6).toFixed(3) + ')';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(c.punti[0][0] * .6 + c.x * .4, c.punti[0][1] * .6 + c.y * .4);
          ctx.lineTo(c.x + (Math.sin(c.f) * c.r * .2), c.y);
          ctx.lineTo(c.punti[3][0] * .6 + c.x * .4, c.punti[3][1] * .6 + c.y * .4);
          ctx.stroke();
        }
      });
      var luce = ctx.createLinearGradient(0, 0, 0, H);
      luce.addColorStop(0, 'rgba(12,10,9,1)');
      luce.addColorStop(.5, 'rgba(12,10,9,0)');
      ctx.fillStyle = luce;
      ctx.fillRect(0, 0, W, H);
    });
  }

  /* ---------- Fumo che sale ---------- */
  function fumo(canvas, tono) {
    var ctx = canvas.getContext('2d');
    var sprite = document.createElement('canvas');
    sprite.width = sprite.height = 128;
    var s = sprite.getContext('2d');
    var g = s.createRadialGradient(64, 64, 0, 64, 64, 64);
    var colore = tono === 'oro' ? '236,196,120' : '225,215,205';
    g.addColorStop(0, 'rgba(' + colore + ',.5)');
    g.addColorStop(.5, 'rgba(' + colore + ',.16)');
    g.addColorStop(1, 'rgba(' + colore + ',0)');
    s.fillStyle = g;
    s.fillRect(0, 0, 128, 128);

    var nuvole = [], ultimo = 0;
    var quante = tono === 'oro' ? (telefono ? 18 : 34) : 22;
    function nuova(w, h, ovunque) {
      return {
        x: w * (tono === 'oro' ? .2 + Math.random() * .8 : .3 + Math.random() * .4),
        y: ovunque ? Math.random() * h : h + 40,
        r: (tono === 'oro' ? .12 : .1) * Math.max(w, h) * (.6 + Math.random() * .8),
        v: (tono === 'oro' ? 18 : 30) + Math.random() * 30,
        rot: Math.random() * 6.28,
        fase: Math.random() * 6.28,
        a: .25 + Math.random() * .5,
      };
    }
    ciclo(canvas, function (t) {
      adatta(canvas, .6);
      var w = canvas.width, h = canvas.height, dpr = w / canvas.clientWidth;
      var dt = Math.min(.05, t - ultimo); ultimo = t;
      if (!nuvole.length) for (var i = 0; i < quante; i++) nuvole.push(nuova(w, h, true));
      ctx.clearRect(0, 0, w, h);
      nuvole.forEach(function (n, i) {
        n.y -= n.v * dt * dpr;
        n.x += Math.sin(t * .4 + n.fase) * 10 * dt * dpr;
        n.r += 6 * dt * dpr;
        n.rot += .1 * dt;
        if (n.y < -n.r) { nuvole[i] = nuova(w, h); return; }
        var k = 1 - n.y / h;
        ctx.globalAlpha = n.a * Math.min(1, (1 - k) * 2.2) * Math.min(1, k * 4 + .2);
        ctx.save();
        ctx.translate(n.x, n.y);
        ctx.rotate(n.rot);
        ctx.drawImage(sprite, -n.r, -n.r, n.r * 2, n.r * 2);
        ctx.restore();
      });
      ctx.globalAlpha = 1;
    });
  }

  window.Fuoco = { hero: hero, scintille: scintille, braci: braci, fumo: fumo, fermo: fermo, telefono: telefono };
})();
