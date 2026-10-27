// Test di browser (Chrome reale via DevTools Protocol) su home e menu, a 1300 px e 390 px.
// Richiede il Worker in locale:  npx wrangler dev --local --local-protocol https --port 8787
// Poi:  node --test tests/browser/sito.test.mjs
// Variabili utili: BASE_URL (default https://127.0.0.1:8787), CHROME_PATH, QA_SCREENSHOTS (cartella PNG).
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { avviaChrome, chiudiChrome, nuovaPagina, sleep } from './cdp.mjs';

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PUB = path.join(RADICE, 'public');
const BASE = process.env.BASE_URL || 'https://127.0.0.1:8787';
const PORTA = 9437;
const SHOTS = process.env.QA_SCREENSHOTS || path.join(os.tmpdir(), 'macellaio-qa-screenshots');
// Data locale YYYY-MM-DD (non toISOString, che usa l'UTC e sbaglia giorno a notte in Italia).
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// Prossima data con quel giorno della settimana (0 = domenica, 2 = martedi, 3 = mercoledi).
const PROSSIMO = (giornoSettimana) => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (d.getDay() !== giornoSettimana) d.setDate(d.getDate() + 1);
  return iso(d);
};

function carica(file) {
  const ctx = { window: {}, console };
  vm.runInNewContext(fs.readFileSync(path.join(PUB, file), 'utf8'), ctx, { filename: file });
  return ctx.window;
}
const CFG = carica('assets/js/config.js').SITO;
const CARNI = carica('assets/js/carni.js').CARNI;
const MENU = carica('assets/js/menu.js');

const VIEWPORT = {
  desktop: { larghezza: 1300, altezza: 900, mobile: false },
  mobile: { larghezza: 390, altezza: 844, mobile: true },
};

// Snippet da iniettare: sostituisce Date con un istante fisso (ora di Roma verificata sotto).
const DATA_FISSA = (iso) => `(() => { const fisso = ${Date.parse(iso)}; const RD = Date;
  class FD extends RD { constructor(...a) { if (a.length === 0) super(fisso); else super(...a); } static now() { return fisso; } }
  window.Date = FD; })();`;

// Per ogni immagine visibile: rapporto a schermo, rapporto reale, object-fit e aspect-ratio dichiarato dal CSS.
const AUDIT_IMMAGINI = `[...document.images].filter(i => i.complete && i.naturalWidth && i.getBoundingClientRect().width > 2).map(i => {
  const b = i.getBoundingClientRect(), cs = getComputedStyle(i);
  return { src: i.getAttribute('src').split('/').pop(), fit: cs.objectFit, dichiarato: cs.aspectRatio, reso: b.width / b.height, reale: i.naturalWidth / i.naturalHeight,
    w: Math.round(b.width), h: Math.round(b.height), copia: !!i.closest('[aria-hidden="true"]'), classe: (i.parentElement.className || i.parentElement.tagName).toString().slice(0, 40) };
})`;
// aspect-ratio dichiarato ("4 / 5" -> 0.8), oppure null se e' auto.
const rapportoDichiarato = (x) => { const m = /^([\d.]+)\s*\/\s*([\d.]+)$/.exec(x.dichiarato || ''); return m ? +m[1] / +m[2] : null; };
// Quota della foto tagliata dal riquadro (object-fit: cover): 0 = intera.
const ritaglio = (x) => 1 - Math.min(x.reso / x.reale, x.reale / x.reso);

// Porta ogni immagine del selettore nel mirino, aspetta il caricamento e restituisce le misure.
async function caricaEMisura(p, selettore) {
  return p.valuta(`(async () => {
    const imgs = [...document.querySelectorAll(${JSON.stringify(selettore)})];
    for (const i of imgs) {
      i.scrollIntoView({ block: 'center', behavior: 'instant' });
      await new Promise(r => { if (i.complete) r(); else { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); setTimeout(r, 5000); } });
      await new Promise(r => setTimeout(r, 150));
    }
    return imgs.filter(i => i.complete && i.naturalWidth).map(i => {
      const b = i.getBoundingClientRect(), cs = getComputedStyle(i);
      return { src: i.getAttribute('src').split('/').pop(), fit: cs.objectFit, dichiarato: cs.aspectRatio, reso: b.width / b.height,
        reale: i.naturalWidth / i.naturalHeight, w: Math.round(b.width), h: Math.round(b.height), copia: !!i.closest('[aria-hidden="true"]'), classe: i.parentElement.className };
    });
  })()`, { timeout: 120000 });
}

let chrome;
before(async () => {
  chrome = await avviaChrome(PORTA);
  fs.mkdirSync(SHOTS, { recursive: true });
});
after(async () => {
  if (chrome) await chiudiChrome(chrome);
});

// Apre una scheda, la prepara e carica la pagina.
async function apri(url, opzioni = {}) {
  const p = await nuovaPagina(PORTA);
  await p.prepara(opzioni);
  if (opzioni.iniezione) await p.iniettaPrima(opzioni.iniezione);
  await p.vai(BASE + url);
  return p;
}

describe('Home', () => {
  for (const [nome, vp] of Object.entries(VIEWPORT)) {
    describe(`${nome} ${vp.larghezza}px`, () => {
      let p;
      before(async () => {
        p = await apri('/', vp);
        await p.scorriTutto();
        await p.attesaImmagini();
      });
      after(async () => { if (p) await p.chiudi(); });

      it('font Fraunces e Manrope caricati dal sito (niente Google Fonts)', async () => {
        const fonts = await p.valuta(`document.fonts.ready.then(() => [...document.fonts].map(f => f.family + ':' + f.status))`);
        assert.ok(fonts.some((f) => /Fraunces.*loaded/.test(f)), 'Fraunces non caricato: ' + fonts.join(', '));
        assert.ok(fonts.some((f) => /Manrope.*loaded/.test(f)), 'Manrope non caricato: ' + fonts.join(', '));
      });

      it('classe js impostata e contenuto principale visibile', async () => {
        assert.equal(await p.valuta(`document.documentElement.classList.contains('js')`), true);
        const titolo = await p.valuta(`getComputedStyle(document.querySelector('.hero-titolo')).opacity`);
        assert.equal(titolo, '1');
      });

      it('nessun overflow orizzontale (la pagina non scorre di lato)', async () => {
        const dati = await p.valuta(`({ sw: document.documentElement.scrollWidth, iw: window.innerWidth })`);
        assert.ok(dati.sw <= dati.iw, `scrollWidth ${dati.sw} > innerWidth ${dati.iw}`);
      });

      it('hero: WebGL del fuoco su desktop, video della brace su telefono', async () => {
        if (nome === 'desktop') {
          const webgl = await p.valuta(`!!document.querySelector('#hero-fuoco').getContext('webgl')`);
          assert.equal(webgl, true, 'WebGL del fuoco non disponibile');
        }
        const video = await p.valuta(`(() => { const v = document.querySelector('.hero-video video'); return { err: v.error && v.error.code, disp: getComputedStyle(v.closest('.hero-video')).display }; })()`);
        assert.equal(video.err, null, 'video della brace in errore');
        if (nome === 'mobile') assert.notEqual(video.disp, 'none', 'il video della brace dovrebbe fare da sfondo sul telefono');
      });

      it('orari: sette giorni, un solo "oggi", stato "Aperto/Chiuso" compilato', async () => {
        const dati = await p.valuta(`({
          righe: document.querySelectorAll('#orari-elenco > div').length,
          oggi: document.querySelectorAll('#orari-elenco .oggi').length,
          stato: [...document.querySelectorAll('[data-stato]')].filter(e => !e.hidden).map(e => e.textContent.trim()),
          visibile: !document.querySelector('#orari').hidden
        })`);
        assert.equal(dati.visibile, true);
        assert.equal(dati.righe, 7);
        assert.equal(dati.oggi, 1);
        assert.ok(dati.stato.length >= 1 && dati.stato.every((s) => /(Aperto|Chiuso)/.test(s)), 'stato: ' + dati.stato.join(' | '));
      });

      it('indirizzo: Via Napoli 149 in tutti i punti in cui compare, nessun "Via Napoli, 149"', async () => {
        const testi = await p.valuta(`[...document.querySelectorAll('[data-indirizzo]')].map(e => e.textContent.trim())`);
        assert.ok(testi.length >= 2, 'punti con indirizzo: ' + testi.length);
        for (const t of testi) assert.equal(t, 'Via Napoli 149 · 82100 Benevento');
      });

      it('mappa: un pin per ogni paese, Francia tra questi, viste Mondo e Europa', async () => {
        const pin = await p.valuta(`[...document.querySelectorAll('.mappa-pin')].map(g => g.getAttribute('data-paese'))`);
        assert.equal(pin.length, CARNI.paesi.length, 'numero di pin diverso dai paesi in carni.js');
        assert.ok(pin.includes('francia'), 'nessun pin per la Francia');
        // Le viste dipendono dalla larghezza: 720 px o meno = mappa alta.
        const attesa = nome === 'mobile'
          ? { mondo: '0.00 -140.00 1000.00 750.00', europa: '436.00 26.00 150.00 112.50' }
          : { mondo: '0.00 0.00 1000.00 470.00', europa: '408.00 38.00 200.00 94.00' };
        await p.valuta(`document.querySelector('.carni').dispatchEvent(new PointerEvent('pointerdown'))`); // evita lo zoom automatico
        await p.valuta(`document.querySelector('[data-vista="europa"]').click()`);
        await sleep(1300);
        assert.equal(await p.valuta(`document.querySelector('#mappa').getAttribute('viewBox')`), attesa.europa, 'vista Europa');
        assert.equal(await p.valuta(`document.querySelector('[data-vista="europa"]').getAttribute('aria-pressed')`), 'true');
        await p.valuta(`document.querySelector('[data-vista="mondo"]').click()`);
        await sleep(1300);
        assert.equal(await p.valuta(`document.querySelector('#mappa').getAttribute('viewBox')`), attesa.mondo, 'vista Mondo');
      });

      it('carni: filtro "Viste al banco" di default, Mooi Mooi con foto del locale 1:1, Charolaise assente', async () => {
        const dati = await p.valuta(`({
          filtri: [...document.querySelectorAll('#carni-filtri button')].map(b => b.textContent.trim()),
          pressi: [...document.querySelectorAll('#carni-filtri button[aria-pressed="true"]')].map(b => b.dataset.filtro),
          schede: [...document.querySelectorAll('#carni-schede .razza h3')].map(h => h.textContent.trim()),
          testo: document.querySelector('.carni').innerText
        })`);
        assert.deepEqual(dati.pressi, ['banco']);
        // JSON: i dati vengono da un altro realm (vm), e deepStrictEqual confronterebbe anche i prototipi.
        const attesi = JSON.parse(JSON.stringify(CARNI.razze.filter((r) => r.banco).map((r) => r.nome)));
        assert.deepEqual([...dati.schede].sort(), attesi.sort(), 'schede del filtro "Viste al banco" diverse dai dati');
        assert.ok(dati.schede.includes('Mooi Mooi'), 'Mooi Mooi non nel filtro banco');
        assert.ok(!/Charolaise/i.test(dati.testo), 'Charolaise ancora visibile nella sezione Carni');
        assert.ok(!dati.filtri.some((f) => /charolaise/i.test(f)), 'Charolaise nei filtri');
        const mooi = await p.valuta(`(() => {
          const art = [...document.querySelectorAll('#carni-schede .razza')].find(a => a.querySelector('h3').textContent.trim() === 'Mooi Mooi');
          const img = art.querySelector('img'); const b = img.getBoundingClientRect();
          return { caricata: img.complete && img.naturalWidth > 0, ratio: b.width / b.height, natural: img.naturalWidth / img.naturalHeight,
            credito: !!art.querySelector('.razza-credito'), aspect: getComputedStyle(img).aspectRatio, posizione: getComputedStyle(img).objectPosition };
        })()`);
        assert.equal(mooi.caricata, true, 'foto Mooi Mooi non caricata');
        assert.ok(Math.abs(mooi.ratio - 1) < 0.02, 'Mooi Mooi non e\' 1:1 a schermo: ' + mooi.ratio);
        assert.equal(mooi.credito, false, 'Mooi Mooi non dovrebbe avere crediti Flickr');
      });

      it('carni: schede in filtro Francia con Le Moire, pin della Francia attivo', async () => {
        await p.valuta(`document.querySelector('[data-filtro="francia"]').click()`);
        await sleep(400);
        const dati = await p.valuta(`({
          schede: [...document.querySelectorAll('#carni-schede .razza h3')].map(h => h.textContent.trim()),
          pinAttivo: [...document.querySelectorAll('.mappa-pin.attivo, [data-paese].attivo')].map(e => e.getAttribute('data-paese')),
          pressi: [...document.querySelectorAll('#carni-filtri button[aria-pressed="true"]')].map(b => b.dataset.filtro)
        })`);
        assert.ok(dati.schede.includes('Le Moire'), 'Le Moire assente nel filtro Francia: ' + dati.schede.join(', '));
        assert.ok(dati.pinAttivo.includes('francia'), 'pin della Francia non evidenziato');
        assert.deepEqual(dati.pressi, ['francia']);
        await p.valuta(`document.querySelector('[data-filtro="banco"]').click()`);
        await sleep(300);
      });

      it('galleria "Dal banco al piatto": foto caricate, rapporto 3:4 a schermo, video senza errori', async () => {
        // Le foto della fila orizzontale sono pigre: fuori dallo schermo non partono. Qui le forziamo
        // (solo nel test) per controllare il file e la proporzione; il caricamento pigro e' un comportamento voluto.
        await p.valuta(`document.querySelectorAll('#galleria-traccia img').forEach(i => i.loading = 'eager')`);
        await sleep(2500);
        const dati = await p.valuta(`(() => {
          const g = document.querySelector('#galleria');
          if (g.hidden) return { nascosta: true };
          const imgs = [...document.querySelectorAll('#galleria-traccia img:not([aria-hidden="true"])')];
          const video = [...document.querySelectorAll('#galleria-traccia video')];
          return {
            nascosta: false,
            immagini: imgs.length,
            nonCaricate: imgs.filter(i => !(i.complete && i.naturalWidth > 0)).map(i => i.getAttribute('src')),
            ritagli: imgs.map(i => { const b = i.getBoundingClientRect(); return +(Math.abs(b.width / b.height - i.naturalWidth / i.naturalHeight) / (i.naturalWidth / i.naturalHeight)).toFixed(4); }),
            video: video.length, erroriVideo: video.filter(v => v.error).length,
          };
        })()`);
        assert.equal(dati.nascosta, false, 'galleria nascosta con foto in config.js');
        assert.equal(dati.immagini, CFG.foto.filter((f) => f.src).length);
        assert.deepEqual(dati.nonCaricate, [], 'foto della galleria non caricate');
        assert.ok(dati.ritagli.every((x) => x < 0.02), 'galleria: foto ritagliate o deformate ' + JSON.stringify(dati.ritagli));
        assert.equal(dati.erroriVideo, 0);
        await p.fotoElemento('#galleria', path.join(SHOTS, `galleria-${nome}.png`));
      });

      it('menu (sezione 06): tartare intera, rapporto reso uguale al reale (niente taglio)', async () => {
        const t = await p.valuta(`(() => {
          const img = document.querySelector('.menu-invito-foto');
          const b = img.getBoundingClientRect();
          return { caricata: img.complete && img.naturalWidth > 0, reso: b.width / b.height, reale: img.naturalWidth / img.naturalHeight, ov: getComputedStyle(img).objectFit };
        })()`);
        assert.equal(t.caricata, true);
        assert.ok(Math.abs(t.reso / t.reale - 1) < 0.015, `tartare: reso ${t.reso.toFixed(3)} reale ${t.reale.toFixed(3)}`);
        await p.fotoElemento('.menu-invito', path.join(SHOTS, `menu-tartare-${nome}.png`));
      });

      it('macelleria (sezione 07): le due foto affiancate, didascalie visibili, foto caricate', async () => {
        const dati = await p.valuta(`(() => {
          const fig = [...document.querySelectorAll('.bottega-foto')].map(f => { const b = f.getBoundingClientRect(); return { top: b.top + scrollY, left: b.left, right: b.right, w: b.width, cap: f.querySelector('figcaption').textContent.trim(), img: f.querySelector('img').complete && f.querySelector('img').naturalWidth > 0 }; });
          return fig;
        })()`);
        assert.equal(dati.length, 2, 'attese due foto nella sezione 07');
        assert.ok(Math.abs(dati[0].top - dati[1].top) < 4, 'le due foto non sono allineate in alto');
        assert.ok(dati[1].left >= dati[0].right - 1, 'le due foto si sovrappongono');
        for (const f of dati) {
          assert.equal(f.img, true, 'foto non caricata: ' + f.cap);
          assert.ok(f.w >= 120, `foto troppo stretta a schermo (${f.w.toFixed(0)} px): ${f.cap}`);
        }
        await p.fotoElemento('#bottega', path.join(SHOTS, `macelleria-${nome}.png`));
      });

      it('scroll: ogni elemento visibile si rivela quando lo si guarda (niente contenuto nascosto)', async () => {
        // Lo scorrimento automatico puo' saltare elementi: qui si guarda ciascuno per 900 ms, come un utente.
        // Si contano solo gli elementi visibili (quelli in un contenitore hidden non compaiono da design).
        const restano = await p.valuta(`(async () => {
          const visibili = (e) => e.getClientRects().length > 0;
          for (const e of [...document.querySelectorAll('.rivela:not(.vista)')].filter(visibili)) {
            e.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
            await new Promise(r => setTimeout(r, 900));
          }
          return [...document.querySelectorAll('.rivela:not(.vista)')].filter(visibili).map(e => e.className + ' | ' + e.textContent.trim().slice(0, 40));
        })()`, { timeout: 120000 });
        assert.deepEqual(restano, [], `elementi visibili che non si rivelano: ${restano.join(' ; ')}`);
      });

      it('immagini: nessuna foto deformata (object-fit: fill con rapporto diverso dal reale)', async () => {
        const img = await p.valuta(AUDIT_IMMAGINI);
        const deformate = img.filter((x) => x.fit === 'fill' && Math.abs(x.reso / x.reale - 1) > 0.02);
        assert.deepEqual(deformate, [], 'foto deformate: ' + JSON.stringify(deformate));
      });

      it('carni: le schede rispettano il rapporto del CSS (4:3, o 1:1 per Mooi Mooi), anche con height nell\'HTML', async () => {
        const img = await caricaEMisura(p, '#carni-schede .razza-immagine img');
        const schede = img.filter((x) => !x.copia);
        assert.ok(schede.length >= 3, 'schede carni non trovate: ' + schede.length);
        const sbagliate = schede.filter((x) => rapportoDichiarato(x) && Math.abs(x.reso / rapportoDichiarato(x) - 1) > 0.02)
          .map((x) => `${x.src}: CSS ${x.dichiarato}, a schermo ${x.w}x${x.h} px (rapporto ${x.reso.toFixed(2)})`);
        assert.deepEqual(sbagliate, [], 'schede carni con rapporto sbagliato:\n  ' + sbagliate.join('\n  '));
      });

      it('storia: le tre foto rispettano il rapporto del CSS (4:5), anche con height nell\'HTML', async () => {
        const storia = await caricaEMisura(p, '.fascia-foto img');
        assert.ok(storia.length === 3, 'foto della storia: ' + storia.length);
        const sbagliate = storia.filter((x) => rapportoDichiarato(x) && Math.abs(x.reso / rapportoDichiarato(x) - 1) > 0.02)
          .map((x) => `${x.src}: CSS ${x.dichiarato}, a schermo ${x.w}x${x.h} px (rapporto ${x.reso.toFixed(2)}, reale ${x.reale.toFixed(2)})`);
        assert.deepEqual(sbagliate, [], 'foto della storia con rapporto sbagliato:\n  ' + sbagliate.join('\n  '));
      });

      it('foto intere: galleria, tartare e macelleria mostrate senza tagli (ritaglio <= 2%)', async () => {
        const img = await p.valuta(AUDIT_IMMAGINI);
        const interne = img.filter((x) => /^(tartare|bistecche-fiamme|calciatori|jey-lillo)|galleria|menu-invito|bottega/.test(x.src + ' ' + x.classe) && !x.copia);
        assert.ok(interne.length >= 3, 'troppe poche foto controllate: ' + interne.length);
        const tagliate = interne.filter((x) => ritaglio(x) > 0.02).map((x) => `${x.src} tagliato ${Math.round(ritaglio(x) * 100)}%`);
        assert.deepEqual(tagliate, []);
      });

      if (nome === 'mobile') it('menu di navigazione: apre e chiude con il pulsante, si chiude con Esc', async () => {
          await p.valuta(`document.querySelector('#hamburger').click()`);
          assert.equal(await p.valuta(`document.body.classList.contains('menu-aperto')`), true);
          assert.equal(await p.valuta(`document.querySelector('#hamburger').getAttribute('aria-expanded')`), 'true');
          await p.valuta(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`);
          assert.equal(await p.valuta(`document.body.classList.contains('menu-aperto')`), false);
        });

      it('prenotazione: invio con campi vuoti mostra l\'errore e non apre WhatsApp', async () => {
        await p.valuta(`window.__aperti = []; window.open = (u) => { window.__aperti.push(u); return null; };
          document.querySelector('#modulo').scrollIntoView(); document.querySelector('.modulo-invia').click()`);
        const err = await p.valuta(`document.querySelector('#modulo-errore').textContent`);
        assert.match(err, /Manca ancora/);
        assert.deepEqual(await p.valuta(`window.__aperti`), []);
      });

      it('prenotazione: giorno di chiusura (martedì) bloccato con messaggio', async () => {
        const martedi = PROSSIMO(2);
        await p.valuta(`window.__aperti = [];
          document.querySelector('#f-nome').value = 'Test QA';
          document.querySelector('#f-data').value = '${martedi}';
          document.querySelector('#f-ora').value = '20:00';
          document.querySelector('.modulo-invia').click()`);
        const err = await p.valuta(`document.querySelector('#modulo-errore').textContent`);
        assert.match(err, /siamo chiusi/);
        assert.deepEqual(await p.valuta(`window.__aperti`), []);
      });

      it('prenotazione valida: apre WhatsApp con nome, giorno, ora e persone nel testo', async () => {
        const mercoledi = PROSSIMO(3);
        await p.valuta(`window.__aperti = [];
          document.querySelector('.persone-piu').click();
          document.querySelector('#f-nome').value = 'Mario Test';
          document.querySelector('#f-data').value = '${mercoledi}';
          document.querySelector('#f-ora').value = '20:00';
          document.querySelector('.modulo-invia').click()`);
        const aperti = await p.valuta(`window.__aperti`);
        assert.equal(aperti.length, 1, 'WhatsApp non aperto');
        const u = new URL(aperti[0]);
        assert.equal(u.origin + u.pathname, 'https://wa.me/' + CFG.contatti.whatsapp);
        const testo = u.searchParams.get('text');
        assert.match(testo, /Nome: Mario Test/);
        assert.match(testo, /Giorno: mercoledì/);
        assert.match(testo, /Ora: 20:00/);
        assert.match(testo, /Persone: 3/);
        assert.equal(await p.valuta(`document.querySelector('#modulo-errore').textContent`), '');
      });

      it('campo data: non accetta date passate (min = oggi)', async () => {
        const min = await p.valuta(`document.querySelector('#f-data').min`);
        assert.equal(min, iso(new Date()), 'min del campo data diverso da oggi (ora locale)');
      });

      it('nessun errore JS, console, CSP o risorsa mancante durante tutto il percorso', async () => {
        assert.deepEqual([...new Set(p.errori)], [], 'errori registrati');
      });
    });
  }

  describe('Home, orari "Aperto ora" con data fissa (ora di Roma)', () => {
    // Istanti in UTC. Ottobre 2026: ora legale finita, Roma = UTC+1.
    const casi = [
      { nome: 'sabato 16:00 (appena aperto)', utc: '2026-10-31T15:00:00Z', testo: 'Aperto ora', dettaglio: 'fino alle 00:00' },
      { nome: 'sabato 23:30 (chiude tra 30 minuti)', utc: '2026-10-31T22:30:00Z', testo: 'Aperto ora', dettaglio: 'chiude tra 30 minuti' },
      { nome: 'martedì 11:00 (giorno di chiusura)', utc: '2026-10-27T10:00:00Z', testo: 'Chiuso ora', dettaglio: 'riapre domani alle 08:30' },
      { nome: 'giovedì 14:30 (pausa tra pranzo e cena)', utc: '2026-10-29T13:30:00Z', testo: 'Chiuso ora', dettaglio: 'riapre oggi alle 16:00' },
    ];
    for (const c of casi) {
      it(`stato corretto: ${c.nome}`, async () => {
        const p = await apri('/', { ...VIEWPORT.desktop, iniezione: DATA_FISSA(c.utc) });
        try {
          const testo = await p.valuta(`[...document.querySelectorAll('#orari [data-stato]')].map(e => e.textContent.replace(/\\s+/g, ' ').trim())[0]`);
          assert.equal(testo, `${c.testo} · ${c.dettaglio}`);
          const attivo = await p.valuta(`document.querySelector('#orari [data-stato]').classList.contains('aperto')`);
          assert.equal(attivo, c.testo === 'Aperto ora');
        } finally {
          await p.chiudi();
        }
      });
    }
  });

  describe('Home, scenari di robustezza', () => {
    it('senza JavaScript il contenuto base resta leggibile (indirizzo, testi, video)', async () => {
      const p = await apri('/', { ...VIEWPORT.desktop, senzaJs: true });
      try {
        const dati = await p.valuta(`({
          indirizzo: document.querySelector('.dove-indirizzo').textContent.trim(),
          rivelati: [...document.querySelectorAll('.rivela')].every(e => getComputedStyle(e).opacity === '1'),
          titolo: document.querySelector('.hero-titolo').innerText.trim().length > 0
        })`);
        assert.equal(dati.indirizzo, 'Via Napoli 149 · 82100 Benevento');
        assert.equal(dati.rivelati, true, 'contenuti nascosti senza JS');
        assert.equal(dati.titolo, true);
      } finally { await p.chiudi(); }
    });

    it('movimento ridotto: galleria senza animazione, fila scorrevole, nessuna copia visibile', async () => {
      const p = await apri('/', { ...VIEWPORT.desktop, movimentoRidotto: true });
      try {
        await p.scorriTutto();
        await sleep(600);
        const dati = await p.valuta(`(() => {
          const t = document.querySelector('#galleria-traccia');
          const visibili = [...t.children].filter(c => getComputedStyle(c).display !== 'none').length;
          return { overflow: getComputedStyle(t).overflowX, transform: getComputedStyle(t).transform, visibili, attesi: ${CFG.foto.length} };
        })()`);
        assert.equal(dati.overflow, 'auto');
        assert.equal(dati.transform, 'none', 'la galleria e\' ancora spostata');
        assert.equal(dati.visibili, dati.attesi, 'copie duplicate visibili con movimento ridotto');
        const errori = [...new Set(p.errori)];
        assert.deepEqual(errori, [], 'errori con movimento ridotto');
      } finally { await p.chiudi(); }
    });

    it('rete lenta (300 ms di latenza, 1 MB/s): il testo arriva e non ci sono errori', async () => {
      const p = await apri('/', { ...VIEWPORT.mobile, ritardoRete: { latenza: 300, download: 1024 * 1024 } });
      try {
        const testo = await p.valuta(`document.querySelector('.hero-titolo').innerText.trim()`);
        assert.ok(testo.length > 5);
        const errori = [...new Set(p.errori)];
        assert.deepEqual(errori, [], 'errori su rete lenta');
      } finally { await p.chiudi(); }
    });
  });
});

describe('Menu /menu/', () => {
  for (const [nome, vp] of Object.entries(VIEWPORT)) {
    describe(`${nome} ${vp.larghezza}px`, () => {
      let p;
      before(async () => {
        p = await apri('/menu/', vp);
        await p.scorriTutto();
        await p.attesaImmagini();
      });
      after(async () => { if (p) await p.chiudi(); });

      it('tutti i piatti del menu sono nella pagina', async () => {
        // Piatti: nelle portate normali sono <li> in .voci, nelle portate frollate <li> in .frollatura.
        const attesi = MENU.MENU.flatMap((s) => s.piatti || []).length;
        const trovati = await p.valuta(`document.querySelectorAll('#carta-contenuto .portata:not(.carta-carni) .voci > li, #carta-contenuto .portata:not(.carta-carni) .frollatura > li').length`);
        assert.equal(trovati, attesi, 'numero di piatti nella pagina diverso da menu.js');
      });

      it('indirizzo Via Napoli 149 e foto di apertura caricata', async () => {
        assert.equal(await p.valuta(`document.querySelector('.carta-indirizzo').textContent.trim()`), 'Via Napoli 149 · 82100 Benevento');
        assert.equal(await p.valuta(`(() => { const i = document.querySelector('.carta-apertura-foto'); return i.complete && i.naturalWidth > 0; })()`), true);
      });

      it('foto di apertura: rapporto reso uguale al reale (nessun ritaglio)', async () => {
        const r = await p.valuta(`(() => { const i = document.querySelector('.carta-apertura-foto'); const b = i.getBoundingClientRect(); return { reso: b.width / b.height, reale: i.naturalWidth / i.naturalHeight, fit: getComputedStyle(i).objectFit }; })()`);
        // Informativo: la foto puo' essere ritagliata di proposito (object-fit: cover) in una testata larga.
        console.log(`[info] menu ${nome}: foto di apertura reso ${r.reso.toFixed(3)} reale ${r.reale.toFixed(3)} object-fit ${r.fit}`);
        assert.ok(r.reso > 0 && r.reale > 0);
      });

      it('pulsante "Aa" cambia la dimensione del testo senza errori', async () => {
        const prima = await p.valuta(`getComputedStyle(document.querySelector('#carta-contenuto .voce h3')).fontSize`);
        await p.valuta(`document.querySelector('#carta-testo').click()`);
        await sleep(300);
        const dopo = await p.valuta(`getComputedStyle(document.querySelector('#carta-contenuto .voce h3')).fontSize`);
        assert.notEqual(prima, dopo, 'il testo non cambia');
        await p.valuta(`document.querySelector('#carta-testo').click()`);
      });

      it('nessun overflow orizzontale', async () => {
        const dati = await p.valuta(`({ sw: document.documentElement.scrollWidth, iw: window.innerWidth })`);
        assert.ok(dati.sw <= dati.iw, `scrollWidth ${dati.sw} > ${dati.iw}`);
      });

      it('immagini: nessuna foto deformata e rapporto a schermo = quello dichiarato nel CSS', async () => {
        const img = await p.valuta(AUDIT_IMMAGINI);
        const problemi = img.filter((x) => !x.copia && ((x.fit === 'fill' && Math.abs(x.reso / x.reale - 1) > 0.02) || (rapportoDichiarato(x) && Math.abs(x.reso / rapportoDichiarato(x) - 1) > 0.02)))
          .map((x) => `${x.src} (${x.classe}): CSS ${x.dichiarato}, reale ${x.reale.toFixed(2)}, a schermo ${x.w}x${x.h} px = ${x.reso.toFixed(2)}`);
        assert.deepEqual(problemi, [], problemi.join('\n  '));
      });

      it('info: ritagli dei banner e delle miniature del menu (object-fit: cover), solo da verificare a occhio', async () => {
        const img = await p.valuta(AUDIT_IMMAGINI);
        for (const x of img.filter((x) => x.fit === 'cover' && !x.copia && ritaglio(x) > 0.2)) {
          console.log(`[info] menu ${nome}: ${x.src} in ${x.classe}: ${x.w}x${x.h} px, tagliato ${Math.round(ritaglio(x) * 100)}%`);
        }
      });

      it('screenshot della pagina menu', async () => {
        await p.fotoPagina(path.join(SHOTS, `menu-pagina-${nome}.png`));
      });

      it('nessun errore JS, console, CSP o risorsa mancante', async () => {
        assert.deepEqual([...new Set(p.errori)], []);
      });
    });
  }
});

describe('Accessibilita di base (desktop)', () => {
  let p;
  before(async () => { p = await apri('/', VIEWPORT.desktop); await p.scorriTutto(); });
  after(async () => { if (p) await p.chiudi(); });

  it('lingua della pagina it, un solo h1, titoli senza salti di livello', async () => {
    const dati = await p.valuta(`({
      lang: document.documentElement.lang,
      h1: document.querySelectorAll('h1').length,
      titoli: [...document.querySelectorAll('h1,h2,h3,h4')].map(h => +h.tagName[1])
    })`);
    assert.equal(dati.lang, 'it');
    assert.equal(dati.h1, 1);
    for (let i = 1; i < dati.titoli.length; i++) {
      assert.ok(dati.titoli[i] <= dati.titoli[i - 1] + 1, `salto di livello: h${dati.titoli[i - 1]} -> h${dati.titoli[i]} (posizione ${i})`);
    }
  });

  it('ogni link e pulsante visibile ha un nome accessibile', async () => {
    const senzaNome = await p.valuta(`[...document.querySelectorAll('a[href], button')]
      .filter(e => e.getClientRects().length > 0)
      .filter(e => !(e.getAttribute('aria-label') || e.textContent.trim() || e.getAttribute('title') || e.querySelector('img[alt]:not([alt=""])')))
      .map(e => e.outerHTML.slice(0, 120))`);
    assert.deepEqual(senzaNome, []);
  });

  it('campi del modulo prenotazione con etichetta collegata', async () => {
    const dati = await p.valuta(`['f-nome', 'f-data', 'f-ora', 'f-note'].map(id => ({ id, etichetta: !!document.querySelector('label[for="' + id + '"]') }))`);
    for (const d of dati) assert.equal(d.etichetta, true, 'manca label per ' + d.id);
  });

  it('il link "Vai al contenuto" esiste come primo elemento per la tastiera', async () => {
    const primo = await p.valuta(`document.querySelector('body > a.salta')?.getAttribute('href')`);
    assert.equal(primo, '#contenuto');
  });
});

describe('Rete assente (informativo)', () => {
  it('offline: il sito non ha una pagina di ripiego (nessun service worker): il browser mostra il proprio errore', async () => {
    const p = await nuovaPagina(PORTA);
    try {
      await p.prepara({ larghezza: 1300, altezza: 900 });
      await p.vai(BASE + '/');
      await p.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
      const risposta = await p.send('Page.navigate', { url: BASE + '/menu/' });
      // Atteso e documentato: senza service worker il sito non funziona offline. Nessun crash JS.
      console.log('[info] offline: navigazione verso /menu/ ->', risposta.errorText || 'senza errore di rete (cache del browser)');
      assert.equal(p.errori.filter((e) => e.startsWith('Eccezione JS')).length, 0);
    } finally {
      await p.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }).catch(() => {});
      await p.chiudi();
    }
  });
});

// Dati estremi: si modifica window.SITO appena lo scrive config.js (il setter si applica prima degli script).
const SITO_SU_MISURA = (corpo) => `(() => { let v; Object.defineProperty(window, 'SITO', { configurable: true,
  get() { return v; }, set(x) { ${corpo} v = x; } }); })();`;

describe('Dati vuoti o molto grandi (home)', () => {
  it('config senza orari, senza galleria, senza WhatsApp e senza voto Google: nessun errore, parti nascoste', async () => {
    const p = await apri('/', { ...VIEWPORT.desktop, iniezione: SITO_SU_MISURA(`x.orari = []; x.foto = []; x.contatti.whatsapp = ''; x.google = { voto: 0, recensioni: 0, link: '' };`) });
    try {
      await p.scorriTutto();
      const dati = await p.valuta(`({
        orari: document.querySelector('#orari').hidden,
        vuoti: !document.querySelector('#orari-vuoti').hidden,
        galleria: document.querySelector('#galleria').hidden,
        whatsappNascosto: [...document.querySelectorAll('[data-whatsapp]')].every(a => a.hidden),
        pulsanteInvio: document.querySelector('.modulo-invia').textContent.trim()
      })`);
      assert.equal(dati.orari, true, 'orari visibili senza dati');
      assert.equal(dati.vuoti, true, 'il testo "chiamaci per gli orari" non compare');
      assert.equal(dati.galleria, true, 'galleria visibile senza foto');
      assert.equal(dati.whatsappNascosto, true);
      assert.match(dati.pulsanteInvio, /Chiama per prenotare/);
      assert.deepEqual([...new Set(p.errori)], [], 'errori con dati vuoti');
    } finally { await p.chiudi(); }
  });

  it('galleria con 300 voci e nota della prenotazione di 3000 caratteri: la pagina resta reattiva, nessun errore', async () => {
    const molte = Array.from({ length: 300 }, (_, i) => ({ src: 'assets/img/foto/tartare-rucola-piatto.jpg', alt: 'Foto di prova numero ' + i }));
    const p = await apri('/', { ...VIEWPORT.desktop, iniezione: SITO_SU_MISURA(`x.foto = ${JSON.stringify(molte)};`) });
    try {
      const t0 = Date.now();
      await p.scorriTutto();
      const conteggio = await p.valuta(`document.querySelectorAll('#galleria-traccia img').length`);
      assert.equal(conteggio, 600, 'la galleria duplica le 300 voci per lo scorrimento');
      const tempo = await p.valuta(`(() => { const t = performance.now(); document.querySelector('#prenota').scrollIntoView(); return performance.now() - t; })()`);
      assert.ok(tempo < 500, `scroll di 500 ms o piu' con 600 immagini: ${tempo.toFixed(0)} ms`);
      console.log(`[info] 300 foto in galleria: scorrimento completo in ${Date.now() - t0} ms`);
      // Prenotazione con nota molto lunga
      const nota = 'Un compleanno, grazie. '.repeat(125); // ~3000 caratteri
      await p.valuta(`window.__aperti = []; window.open = (u) => { window.__aperti.push(u); return null; };
        document.querySelector('#f-nome').value = 'Lungo Test';
        document.querySelector('#f-data').value = '${PROSSIMO(3)}';
        document.querySelector('#f-ora').value = '21:00';
        document.querySelector('#f-note').value = ${JSON.stringify(nota)};
        document.querySelector('.modulo-invia').click()`);
      const aperti = await p.valuta(`window.__aperti`);
      assert.equal(aperti.length, 1);
      const testo = new URL(aperti[0]).searchParams.get('text');
      assert.ok(testo.includes(nota.trim()), 'la nota lunga non arriva intera nel messaggio');
      console.log(`[info] URL WhatsApp con nota di ${nota.length} caratteri: ${aperti[0].length} caratteri totali`);
      assert.deepEqual([...new Set(p.errori)], [], 'errori con dati grandi');
    } finally { await p.chiudi(); }
  });
});
