/* La pagina del menu (/menu/), quella del QR code sui tavoli. */
(function () {
  'use strict';

  var S = window.SITO || {}, C = S.contatti || {}, INFO = window.MENU_INFO || {}, MENU = window.MENU || [];
  var prezzo = window.prezzoMenu;
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function testo(t) { var d = document.createElement('div'); d.textContent = t == null ? '' : String(t); return d.innerHTML; }

  /* ---------- Il menu ---------- */
  var giorniMax = 0;
  MENU.forEach(function (s) { (s.piatti || []).forEach(function (p) { giorniMax = Math.max(giorniMax, p.giorni || 0); }); });

  function piatto(p) {
    return '<li class="voce">' +
      '<div class="voce-riga"><h3>' + testo(p.nome) + '</h3><span class="voce-puntini" aria-hidden="true"></span>' +
      '<span class="voce-prezzo">' + prezzo(p) + '</span></div>' +
      (p.descrizione ? '<p>' + testo(p.descrizione) + '</p>' : '') +
      '</li>';
  }

  function frollatura(p, i) {
    var k = p.giorni / giorniMax;
    return '<li class="tappa" style="--k:' + k.toFixed(3) + ';--i:' + i + '">' +
      '<span class="tappa-giorni"><b>' + p.giorni + '</b> giorni</span>' +
      '<span class="tappa-barra" aria-hidden="true"><i></i></span>' +
      '<span class="tappa-prezzo">' + prezzo(p) + '</span>' +
      '<span class="visivo">' + testo(p.nome) + '</span>' +
      '</li>';
  }

  var contorni = (INFO.contorni || []).map(function (c) { return '<li>' + testo(c) + '</li>'; }).join('');

  $('#carta-contenuto').innerHTML = MENU.map(function (s, n) {
    var corpo = s.frollatura
      ? '<ol class="frollatura">' + s.piatti.map(frollatura).join('') + '</ol>' +
        (INFO.fuoriMenu ? '<p class="fuori-menu"><span aria-hidden="true">✦</span> ' + testo(INFO.fuoriMenu) + '</p>' : '')
      : '<ul class="voci">' + s.piatti.map(piatto).join('') + '</ul>';
    return '<section class="portata' + (s.frollatura ? ' portata-frollati' : '') + '" id="' + testo(s.id) + '" aria-labelledby="t-' + testo(s.id) + '">' +
      '<header class="portata-testa">' +
      '<span class="portata-n">' + String(n + 1).padStart(2, '0') + '</span>' +
      '<h2 id="t-' + testo(s.id) + '">' + testo(s.titolo) + '</h2>' +
      (s.sottotitolo ? '<p class="portata-sotto">' + testo(s.sottotitolo) + '</p>' : '') +
      '</header>' +
      (s.foto ? '<img class="portata-foto" src="../' + testo(s.foto) + '" alt="" loading="lazy">' : '') +
      (s.nota ? '<p class="portata-nota">' + testo(s.nota) + '</p>' : '') +
      (s.contorni && contorni ? '<div class="contorni"><p>Contorni a scelta</p><ul>' + contorni + '</ul></div>' : '') +
      corpo +
      '</section>';
  }).join('');

  /* ---------- Le carni del momento (da carni.js) ---------- */
  var CARNI = window.CARNI;
  if (CARNI) {
    var nomiPaesi = {};
    CARNI.paesi.forEach(function (p) { nomiPaesi[p.id] = p.nome; });
    var banco = CARNI.razze.filter(function (r) { return r.banco; });
    $('#carta-contenuto').insertAdjacentHTML('beforeend',
      '<section class="portata carta-carni" id="carni" aria-labelledby="t-carni">' +
      '<header class="portata-testa"><span class="portata-n">✦</span><h2 id="t-carni">Dal mondo, al banco</h2></header>' +
      '<p class="portata-nota">Le razze cambiano con la disponibilità. Di recente al banco:</p>' +
      '<ul class="carta-razze">' + banco.map(function (r) {
        return '<li><img src="../' + testo(r.foto) + '" alt="" loading="lazy"><span><b>' + testo(r.nome) + '</b>' + testo(nomiPaesi[r.paese]) + '</span></li>';
      }).join('') + '</ul>' +
      '<p class="carta-razze-link"><a href="../#carni">Scopri da dove arrivano le nostre carni →</a></p>' +
      '</section>');
  }

  /* ---------- Schede delle sezioni ---------- */
  var schede = $('#carta-schede');
  schede.innerHTML = '<div class="carta-schede-traccia">' + MENU.map(function (s) {
    return '<a href="#' + testo(s.id) + '">' + testo(s.titolo.replace('Arrosti frollati', 'Frollati')) + '</a>';
  }).join('') + '</div>';
  var link = $$('a', schede);
  // (la sezione delle carni non ha una scheda: si raggiunge scorrendo)
  var traccia = $('.carta-schede-traccia', schede);
  function attiva(id) {
    link.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + id;
      a.classList.toggle('attiva', on);
      if (on) {
        a.setAttribute('aria-current', 'true');
        traccia.scrollTo({ left: a.offsetLeft - (traccia.clientWidth - a.offsetWidth) / 2, behavior: 'smooth' });
      } else a.removeAttribute('aria-current');
    });
  }
  var osserva = new IntersectionObserver(function (voci) {
    voci.forEach(function (v) { if (v.isIntersecting) attiva(v.target.id); });
  }, { rootMargin: '-30% 0px -60% 0px' });
  $$('.portata').forEach(function (s) { osserva.observe(s); });

  // Le tappe della frollatura si riempiono quando arrivano sullo schermo.
  var frollati = $('.frollatura');
  if (frollati) {
    new IntersectionObserver(function (voci, o) {
      if (!voci[0].isIntersecting) return;
      frollati.classList.add('piena');
      o.disconnect();
    }, { threshold: .35 }).observe(frollati);
  }

  /* ---------- Testo grande ---------- */
  var pulsante = $('#carta-testo');
  function segna() {
    var grande = document.documentElement.classList.contains('testo-grande');
    pulsante.setAttribute('aria-pressed', String(grande));
    pulsante.setAttribute('aria-label', grande ? 'Testo normale' : 'Ingrandisci il testo');
  }
  pulsante.addEventListener('click', function () {
    var grande = document.documentElement.classList.toggle('testo-grande');
    try { localStorage.setItem('macellaio-testo', grande ? 'grande' : 'normale'); } catch (e) {}
    segna();
  });
  segna();

  /* ---------- Dati del locale ---------- */
  if (INFO.coperto) $('[data-coperto]').innerHTML = 'Coperto <b>' + prezzo({ prezzo: INFO.coperto }) + '</b>';
  else $('[data-coperto]').hidden = true;
  $('[data-allergeni]').textContent = INFO.allergeni || '';
  var tel = (C.telefono || '').replace(/[^\d+]/g, '');
  if (tel) $$('[data-telefono]').forEach(function (a) { a.href = 'tel:' + tel; a.hidden = false; });
  if (C.whatsapp) $$('[data-whatsapp]').forEach(function (a) { a.href = 'https://wa.me/' + C.whatsapp; a.hidden = false; });
  if (S.social && S.social.instagram) $$('[data-instagram]').forEach(function (a) { a.href = S.social.instagram; a.hidden = false; });
  if (S.indirizzo) $$('[data-indirizzo]').forEach(function (el) { el.textContent = S.indirizzo.via + ' · ' + S.indirizzo.cap + ' ' + S.indirizzo.citta; });
})();
