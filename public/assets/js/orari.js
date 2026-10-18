/*
 * Orari: elenco della settimana e stato "aperto ora", sempre con l'ora italiana (Europe/Rome).
 * Usa SITO.orari da config.js. Lo usano la home e la pagina del menu.
 */
(function () {
  'use strict';

  var GIORNI = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  var orari = (window.SITO && window.SITO.orari) || [];

  function minuti(hhmm) { var p = hhmm.split(':'); return +p[0] * 60 + +p[1]; }
  function ora(hhmm) { return hhmm === '24:00' ? '00:00' : hhmm; }
  function fasce(g) {
    for (var i = 0; i < orari.length; i++) if (orari[i].giorno === g) return orari[i].fasce || [];
    return [];
  }

  // Giorno della settimana (0 = domenica) e minuti dalla mezzanotte, in Italia.
  function adesso() {
    var parti = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date()).forEach(function (p) { parti[p.type] = p.value; });
    return { giorno: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parti.weekday), min: +parti.hour * 60 + +parti.minute };
  }

  function stato() {
    if (!orari.length) return null;
    var n = adesso();
    var oggi = fasce(n.giorno);
    for (var i = 0; i < oggi.length; i++) {
      if (n.min >= minuti(oggi[i][0]) && n.min < minuti(oggi[i][1])) {
        var chiude = minuti(oggi[i][1]) - n.min;
        return { aperto: true, testo: 'Aperto ora', dettaglio: chiude <= 60 ? 'chiude tra ' + chiude + (chiude === 1 ? ' minuto' : ' minuti') : 'fino alle ' + ora(oggi[i][1]) };
      }
    }
    for (var d = 0; d < 7; d++) {
      var g = (n.giorno + d) % 7, f = fasce(g);
      for (var j = 0; j < f.length; j++) {
        if (d === 0 && minuti(f[j][0]) <= n.min) continue;
        var quando = d === 0 ? 'oggi' : d === 1 ? 'domani' : GIORNI[g].toLowerCase();
        return { aperto: false, testo: 'Chiuso ora', dettaglio: 'riapre ' + quando + ' alle ' + f[j][0] };
      }
    }
    return { aperto: false, testo: 'Chiuso', dettaglio: '' };
  }

  // Lunedì → domenica, con le fasce scritte per esteso.
  function settimana() {
    var oggi = adesso().giorno;
    return [1, 2, 3, 4, 5, 6, 0].map(function (g) {
      var f = fasce(g);
      return {
        giorno: GIORNI[g], oggi: g === oggi,
        ore: f.length ? f.map(function (x) { return x[0] + ' – ' + ora(x[1]); }).join(' · ') : 'Chiuso',
      };
    });
  }

  window.Orari = { stato: stato, settimana: settimana };
})();
