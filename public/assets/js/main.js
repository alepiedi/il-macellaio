(function () {
  'use strict';

  var S = window.SITO || {};
  var C = S.contatti || {};
  var F = window.Fuoco;
  document.documentElement.classList.add('js');

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function testo(t) { var d = document.createElement('div'); d.textContent = t == null ? '' : String(t); return d.innerHTML; }

  /* ---------- Dati da config.js ---------- */
  var tel = (C.telefono || '').replace(/[^\d+]/g, '');
  $$('[data-telefono]').forEach(function (a) {
    if (!tel) return;
    a.href = 'tel:' + tel;
    a.hidden = false;
  });
  $$('[data-telefono-testo]').forEach(function (el) { el.textContent = C.telefono || ''; });
  $$('[data-whatsapp]').forEach(function (a) {
    if (!C.whatsapp) return;
    a.href = 'https://wa.me/' + C.whatsapp;
    a.hidden = false;
  });
  if (S.indirizzo) {
    var ind = S.indirizzo.via + ' · ' + S.indirizzo.cap + ' ' + S.indirizzo.citta;
    $$('[data-indirizzo]').forEach(function (el) { el.textContent = ind; });
    $$('[data-maps]').forEach(function (a) { a.href = S.indirizzo.maps; });
  }
  if (S.piva) $$('[data-piva]').forEach(function (el) { el.textContent = 'P. IVA ' + S.piva; el.hidden = false; });
  $('#anno').textContent = new Date().getFullYear();

  var voto = S.google && S.google.voto;
  if (voto) {
    var votoTesto = voto.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    $$('[data-voto]').forEach(function (el) { el.hidden = false; });
    $$('[data-voto-numero]').forEach(function (el) { el.textContent = votoTesto; });
    $$('[data-recensioni]').forEach(function (el) {
      el.textContent = S.google.recensioni ? 'su ' + S.google.recensioni + ' recensioni' : '';
    });
    if (S.google.link) {
      $$('.hero-voto').forEach(function (el) {
        var a = document.createElement('a');
        a.href = S.google.link; a.target = '_blank'; a.rel = 'noopener';
        a.className = el.className; a.innerHTML = el.innerHTML;
        el.replaceWith(a);
      });
    }
  }

  var orari = S.orari || [];
  if (orari.length) {
    $('#orari').hidden = false;
    $('#orari-vuoti').hidden = true;
    $('#orari-elenco').innerHTML = orari.map(function (o) {
      return '<div><dt>' + testo(o.giorni) + '</dt><dd>' + testo(o.ore) + '</dd></div>';
    }).join('');
  }

  var ICONE = {
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21Z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 3c.4 2.1 1.7 3.6 3.9 3.8v3a7 7 0 0 1-3.9-1.2v6.2A5.7 5.7 0 1 1 11 9.1v3.1a2.7 2.7 0 1 0 2.6 2.7V3Z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5a9.4 9.4 0 0 0-8.1 14.2L2.6 21.5l4.9-1.3A9.4 9.4 0 1 0 12 2.5Zm5.5 13.3c-.2.6-1.3 1.2-1.8 1.3-.5 0-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.3 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.2.5.1.6 0l.9-1c.2-.3.4-.2.6-.1l2 .9c.3.2.5.2.5.4.1.1.1.7-.1 1.4Z"/></svg>',
  };
  var social = S.social || {};
  var linkSocial = Object.keys(ICONE).filter(function (k) { return k === 'whatsapp' ? C.whatsapp : social[k]; }).map(function (k) {
    var href = k === 'whatsapp' ? 'https://wa.me/' + C.whatsapp : social[k];
    var nome = k.charAt(0).toUpperCase() + k.slice(1);
    return '<a href="' + testo(href) + '" target="_blank" rel="noopener" aria-label="' + nome + '">' + ICONE[k] + '</a>';
  });
  $('#piede-social').innerHTML = linkSocial.join('');
  $$('[data-instagram]').forEach(function (a) {
    if (!social.instagram) return;
    a.href = social.instagram;
    a.hidden = false;
  });

  var nastro = $('#anteprima'), chiuso = false;
  try { chiuso = sessionStorage.getItem('macellaio-anteprima') === 'chiuso'; } catch (e) {}
  if (S.anteprima && !chiuso) {
    nastro.hidden = false;
    $('button', nastro).addEventListener('click', function () {
      nastro.hidden = true;
      try { sessionStorage.setItem('macellaio-anteprima', 'chiuso'); } catch (e) {}
    });
  }

  /* ---------- Testata e navigazione ---------- */
  var testata = $('#testata'), flottante = $('#prenota-flottante');
  function suScroll() {
    var y = window.scrollY;
    testata.classList.toggle('scorsa', y > 40);
    var prenota = $('#prenota').getBoundingClientRect();
    flottante.classList.toggle('visibile', y > window.innerHeight * .8 && prenota.top > window.innerHeight);
  }
  window.addEventListener('scroll', suScroll, { passive: true });
  suScroll();

  var hamburger = $('#hamburger');
  function chiudiMenu() { document.body.classList.remove('menu-aperto'); hamburger.setAttribute('aria-expanded', 'false'); hamburger.setAttribute('aria-label', 'Apri il menu'); }
  hamburger.addEventListener('click', function () {
    var aperto = document.body.classList.toggle('menu-aperto');
    hamburger.setAttribute('aria-expanded', String(aperto));
    hamburger.setAttribute('aria-label', aperto ? 'Chiudi il menu' : 'Apri il menu');
  });
  $$('#menu-nav a').forEach(function (a) { a.addEventListener('click', chiudiMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') chiudiMenu(); });

  var vociNav = $$('#menu-nav a');
  var osservaSezioni = new IntersectionObserver(function (voci) {
    voci.forEach(function (v) {
      if (!v.isIntersecting) return;
      vociNav.forEach(function (a) { a.classList.toggle('attivo', a.getAttribute('href') === '#' + v.target.id); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  vociNav.forEach(function (a) {
    var h = a.getAttribute('href');
    if (h.charAt(0) === '#' && $(h)) osservaSezioni.observe($(h));
  });

  /* ---------- Apertura ---------- */
  requestAnimationFrame(function () { document.body.classList.add('carico'); });
  if (F) {
    F.hero($('#hero-fuoco'));
    F.scintille($('#hero-scintille'), F.telefono ? 40 : 90);
    $$('[data-braci]').forEach(F.braci);
    $$('[data-fumo]').forEach(function (c) { F.fumo(c, c.getAttribute('data-fumo')); });
  }

  // Il titolo trema come l'aria sopra la brace.
  var rumore = $('#calore-rumore');
  if (rumore && F && !F.fermo) {
    var heroVisibile = true, ultimo = 0;
    new IntersectionObserver(function (v) { heroVisibile = v[0].isIntersecting; }).observe($('.hero'));
    (function trema(ora) {
      if (heroVisibile && ora - ultimo > 50) {
        ultimo = ora;
        var t = ora / 1000;
        rumore.setAttribute('baseFrequency', (0.006 + Math.sin(t * .7) * .0015).toFixed(4) + ' ' + (0.022 + Math.sin(t * 1.3) * .006).toFixed(4));
      }
      requestAnimationFrame(trema);
    })(0);
  }

  /* ---------- Rivelazione allo scorrimento ---------- */
  var rivela = new IntersectionObserver(function (voci) {
    voci.forEach(function (v) {
      if (!v.isIntersecting) return;
      v.target.classList.add('vista');
      rivela.unobserve(v.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  $$('.rivela').forEach(function (el, i) {
    var fratelli = el.parentElement ? $$(':scope > .rivela', el.parentElement) : [];
    el.style.transitionDelay = Math.min(fratelli.indexOf(el), 5) * 80 + 'ms';
    rivela.observe(el);
  });

  /* ---------- Il manifesto si accende parola per parola ---------- */
  var manifesto = $('[data-accendi]');
  if (manifesto) {
    var calde = /^(macelleria\.?|banco:?|ossessione\.?)$/i;
    manifesto.innerHTML = manifesto.textContent.trim().split(/\s+/).map(function (p) {
      return '<span class="p' + (calde.test(p) ? ' calda-attesa' : '') + '">' + testo(p) + '</span>';
    }).join(' ');
    var parole = $$('.p', manifesto);
    var accendi = function () {
      var b = manifesto.getBoundingClientRect(), h = window.innerHeight;
      var k = Math.max(0, Math.min(1, (h * .85 - b.top) / (b.height + h * .35)));
      var n = Math.round(k * parole.length);
      parole.forEach(function (p, i) {
        var on = i < n;
        p.classList.toggle('accesa', on);
        p.classList.toggle('calda', on && p.classList.contains('calda-attesa'));
      });
    };
    if (F && F.fermo) parole.forEach(function (p) { p.classList.add('accesa'); });
    else { window.addEventListener('scroll', accendi, { passive: true }); accendi(); }
  }

  /* ---------- Il rito ---------- */
  var passi = $$('.rito-passo');
  var icone = $$('#rito-icona g');
  var osservaPassi = new IntersectionObserver(function (voci) {
    voci.forEach(function (v) {
      if (!v.isIntersecting) return;
      var i = +v.target.getAttribute('data-passo');
      passi.forEach(function (p) { p.classList.toggle('attivo', p === v.target); });
      icone.forEach(function (g, j) { g.classList.toggle('attiva', j === i); });
      $('#rito-numero').textContent = '0' + (i + 1);
      $('#rito-etichetta').textContent = v.target.getAttribute('data-nome');
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  passi.forEach(function (p) { osservaPassi.observe(p); });
  if (passi[0]) passi[0].classList.add('attivo');

  /* ---------- Il punto di cottura ---------- */
  var PUNTI = [
    { nome: 'Al sangue', gradi: '50', testo: 'Cuore rosso e fresco, appena intiepidito. Per chi vuole sentire la carne com\'è.', c: ['#c21f37', '#bf2537', '#8c4a44', '#5a3428'], o: .84 },
    { nome: 'Media al sangue', gradi: '54', testo: 'Il centro rosa e caldo, il grasso sciolto. Il punto in cui la carne frollata dà il meglio.', c: ['#cc3a48', '#c4404a', '#8c5a4e', '#5a3428'], o: .66 },
    { nome: 'Media', gradi: '58', testo: 'Rosa pieno al centro, più compatta. Il grasso ha avuto tutto il tempo di sciogliersi.', c: ['#d2706e', '#c27a6e', '#93705f', '#5a3428'], o: .44 },
    { nome: 'Media ben cotta', gradi: '63', testo: 'Appena un filo di rosa. Più asciutta, il sapore della crosta prende il sopravvento.', c: ['#b98d7c', '#a67f6b', '#8a6a56', '#5a3428'], o: .2 },
    { nome: 'Ben cotta', gradi: '68+', testo: 'Cotta in tutto lo spessore. Si può fare: ti consigliamo noi il taglio adatto, come le costine.', c: ['#977461', '#8f6e5a', '#7d5f4c', '#4e2e22'], o: .04 },
  ];
  var cursore = $('#punto-cursore');
  function aggiornaPunto() {
    var p = PUNTI[+cursore.value];
    $('#punto-nome').textContent = p.nome;
    $('#punto-gradi').textContent = p.gradi;
    $('#punto-descrizione').textContent = p.testo;
    cursore.setAttribute('aria-valuetext', p.nome + ', ' + p.gradi + ' gradi al cuore');
    ['#g-c0', '#g-c1', '#g-c2', '#g-c3'].forEach(function (id, i) { $(id).setAttribute('stop-color', p.c[i]); });
    $('#g-c1').setAttribute('offset', p.o);
    $('#g-c2').setAttribute('offset', Math.min(.94, p.o + .16));
    $('#punto-vapore').style.opacity = .4 + +cursore.value * .15;
  }
  cursore.addEventListener('input', aggiornaPunto);
  aggiornaPunto();

  /* ---------- I tagli ---------- */
  var TAGLI = {
    spalla: { zona: 'Quarto anteriore', nome: 'Spalla', testo: 'Un muscolo che lavora tanto, quindi sapore pieno. Da qui nascono tagli come il flat iron: venature sottili e una morbidezza che sorprende, se tagliato nel verso giusto.', cottura: 'Brace', punto: 'Media al sangue', carattere: 'Deciso, venato', tenerezza: 62, sapore: 86 },
    petto: { zona: 'Quarto anteriore', nome: 'Petto', testo: 'Il taglio delle cotture lunghe e del fumo. Grasso e collagene, con il tempo, diventano burro: è il re del barbecue americano.', cottura: 'Affumicatura', punto: 'Lunga cottura', carattere: 'Fondente, affumicato', tenerezza: 58, sapore: 95 },
    costata: { zona: 'Lombata', nome: 'Costata', testo: 'Il taglio con l\'osso che tutti aspettano. Marezzatura generosa e il cuore di grasso che si scioglie sulla pietra. Con la frollatura diventa un\'altra cosa.', cottura: 'Pietra lavica', punto: 'Media al sangue', carattere: 'Ricco, burroso', tenerezza: 82, sapore: 92 },
    costine: { zona: 'Pancia', nome: 'Costine', testo: 'Le short rib: carne tra le ossa, con grasso e collagene. Vogliono pazienza, fumo e una glassatura finale.', cottura: 'Affumicatura', punto: 'Lunga cottura', carattere: 'Succoso, intenso', tenerezza: 66, sapore: 92 },
    controfiletto: { zona: 'Lombata', nome: 'Controfiletto', testo: 'Il lombo: da qui la fiorentina con l\'osso a T e lo striploin. Equilibrio perfetto tra tenerezza e sapore, con quel filo di grasso laterale che sulla brace diventa croccante.', cottura: 'Brace o pietra lavica', punto: 'Al sangue', carattere: 'Equilibrato, pieno', tenerezza: 78, sapore: 82 },
    filetto: { zona: 'Lombata', nome: 'Filetto', testo: 'Il muscolo che non lavora mai, per questo il più tenero di tutti. Ha un sapore delicato: con il burro affumicato trova la sua voce.', cottura: 'Pietra lavica e burro affumicato', punto: 'Al sangue', carattere: 'Tenerissimo, delicato', tenerezza: 98, sapore: 55 },
    bavetta: { zona: 'Pancia', nome: 'Bavetta', testo: 'Fibre lunghe e sapore deciso: il taglio preferito dai macellai. Fuoco alto e cottura veloce, poi a fette sottili contro fibra.', cottura: 'Brace', punto: 'Media al sangue', carattere: 'Saporito, fibroso', tenerezza: 55, sapore: 88 },
    picanha: { zona: 'Scamone', nome: 'Picanha', testo: 'Il codone di scamone, con la sua calotta di grasso. In Brasile è una religione: il grasso si scioglie sulla brace e nutre la carne dall\'esterno.', cottura: 'Brace', punto: 'Media al sangue', carattere: 'Succoso, grasso nobile', tenerezza: 72, sapore: 87 },
    coscia: { zona: 'Quarto posteriore', nome: 'Coscia', testo: 'Magra e versatile: fesa, girello, noce. Il punto di partenza per la tartare al coltello e per le cotture brevi e precise.', cottura: 'Al coltello o affumicata', punto: 'Cruda o al sangue', carattere: 'Magro, pulito', tenerezza: 60, sapore: 66 },
  };
  var ordine = ['spalla', 'petto', 'costata', 'costine', 'controfiletto', 'filetto', 'bavetta', 'picanha', 'coscia'];
  var pulsanti = $('#tagli-pulsanti');
  pulsanti.innerHTML = ordine.map(function (k) {
    return '<button type="button" role="tab" data-taglio="' + k + '" aria-selected="false">' + TAGLI[k].nome + '</button>';
  }).join('');
  var scheda = $('#taglio-scheda');
  function scegliTaglio(k) {
    var t = TAGLI[k];
    if (!t) return;
    $$('.zona[data-taglio]').forEach(function (z) { z.classList.toggle('scelta', z.getAttribute('data-taglio') === k); });
    $$('button', pulsanti).forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-taglio') === k)); });
    $('#taglio-zona').textContent = t.zona;
    $('#taglio-nome').textContent = t.nome;
    $('#taglio-descrizione').textContent = t.testo;
    $('#taglio-cottura').textContent = t.cottura;
    $('#taglio-punto').textContent = t.punto;
    $('#taglio-carattere').textContent = t.carattere;
    $('#taglio-tenerezza').style.width = t.tenerezza + '%';
    $('#taglio-sapore').style.width = t.sapore + '%';
    scheda.classList.remove('cambia');
    void scheda.offsetWidth;
    scheda.classList.add('cambia');
  }
  $$('.zona[data-taglio]').forEach(function (z) {
    z.addEventListener('click', function () { scegliTaglio(z.getAttribute('data-taglio')); });
    z.addEventListener('mouseenter', function () { if (window.matchMedia('(hover: hover)').matches) scegliTaglio(z.getAttribute('data-taglio')); });
  });
  pulsanti.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (b) scegliTaglio(b.getAttribute('data-taglio'));
  });
  scegliTaglio('costata');

  /* ---------- Il menu (gli stessi dati della pagina /menu/) ---------- */
  var MENU = window.MENU || [];
  if (MENU.length && window.prezzoMenu) {
    $('#menu-attesa').hidden = true;
    $('#menu-completo').hidden = false;
    $('#menu-elenco').innerHTML = MENU.map(function (sez) {
      return '<div class="menu-sezione"><h3>' + testo(sez.titolo) + '</h3>' +
        (sez.sottotitolo ? '<p>' + testo(sez.sottotitolo) + '</p>' : '') +
        (sez.piatti || []).map(function (p) {
          return '<article class="piatto"><h4>' + testo(p.nome) + '</h4>' +
            '<span class="piatto-prezzo">' + window.prezzoMenu(p) + '</span>' +
            (p.descrizione ? '<p>' + testo(p.descrizione) + '</p>' : '') +
            '</article>';
        }).join('') + '</div>';
    }).join('');
  }

  /* ---------- Galleria ---------- */
  var foto = S.foto || [];
  if (foto.length) {
    var traccia = $('#galleria-traccia');
    var html = foto.map(function (f) { return '<img src="' + testo(f.src) + '" alt="' + testo(f.alt || '') + '" loading="lazy">'; }).join('');
    traccia.innerHTML = html + html.replace(/alt="[^"]*"/g, 'alt="" aria-hidden="true"');
    $('#galleria').hidden = false;
  }

  /* ---------- Numeri che contano ---------- */
  var osservaNumeri = new IntersectionObserver(function (voci) {
    voci.forEach(function (v) {
      if (!v.isIntersecting) return;
      osservaNumeri.unobserve(v.target);
      var el = v.target, decimali = el.hasAttribute('data-conta-voto');
      var fine = decimali ? voto : +el.getAttribute('data-conta');
      var inizio = performance.now(), durata = F && F.fermo ? 1 : 1600;
      (function conta(ora) {
        var k = Math.min(1, (ora - inizio) / durata);
        var x = fine * (1 - Math.pow(1 - k, 3));
        el.textContent = decimali ? x.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : Math.round(x);
        if (k < 1) requestAnimationFrame(conta);
      })(inizio);
    });
  }, { threshold: .6 });
  $$('[data-conta], [data-conta-voto]').forEach(function (el) { osservaNumeri.observe(el); });

  /* ---------- Prenotazione ---------- */
  var modulo = $('#modulo');
  var persone = 2, uscita = $('#f-persone');
  $('.persone-meno').addEventListener('click', function () { persone = Math.max(1, persone - 1); uscita.textContent = persone; });
  $('.persone-piu').addEventListener('click', function () { persone = Math.min(40, persone + 1); uscita.textContent = persone; });

  var oggi = new Date();
  var iso = function (d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  $('#f-data').min = iso(oggi);

  if (!C.whatsapp) {
    $('.modulo-invia').innerHTML = tel ? 'Chiama per prenotare <span aria-hidden="true">→</span>' : 'Prenota';
  }

  modulo.addEventListener('submit', function (e) {
    e.preventDefault();
    var errore = $('#modulo-errore');
    var nome = $('#f-nome'), data = $('#f-data'), ora = $('#f-ora');
    var mancano = [nome, data, ora].filter(function (c) { return !c.value.trim(); });
    [nome, data, ora].forEach(function (c) { c.setAttribute('aria-invalid', String(mancano.indexOf(c) >= 0)); });
    if (mancano.length) {
      errore.textContent = 'Manca ancora: ' + mancano.map(function (c) { return $('label[for=' + c.id + ']').textContent.toLowerCase(); }).join(', ') + '.';
      mancano[0].focus();
      return;
    }
    errore.textContent = '';
    if (!C.whatsapp) { if (tel) location.href = 'tel:' + tel; return; }
    var giorno = new Date(data.value + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
    var righe = [
      'Ciao! Vorrei prenotare un tavolo al Macellaio.',
      '',
      'Nome: ' + nome.value.trim(),
      'Giorno: ' + giorno,
      'Ora: ' + ora.value,
      'Persone: ' + persone,
    ];
    var note = $('#f-note').value.trim();
    if (note) righe.push('Note: ' + note);
    window.open('https://wa.me/' + C.whatsapp + '?text=' + encodeURIComponent(righe.join('\n')), '_blank', 'noopener');
  });
})();
