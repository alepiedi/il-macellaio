// Test statici sul sito: riferimenti locali, file orfani, dati, JSON-LD, dimensioni delle foto, contrasto.
// Nessuna dipendenza: si lancia con `node --test tests/`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUB = path.join(RADICE, 'public');
const leggi = (f, base = PUB) => fs.readFileSync(path.join(base, f), 'utf8');
const esiste = (f, base = PUB) => fs.existsSync(path.join(base, f));

// Carica un file "da browser" (che assegna window.X) senza DOM, per leggere i dati veri.
function caricaDati(file) {
  const ctx = { window: {}, console };
  vm.runInNewContext(leggi(file), ctx, { filename: file });
  return ctx.window;
}

// Dimensioni di un JPEG leggendo i marcatori SOF (nessuna libreria).
function dimensioniJpeg(file) {
  const b = fs.readFileSync(path.join(PUB, file));
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const marcatore = b[i + 1];
    if (marcatore >= 0xc0 && marcatore <= 0xc2) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    i += 2 + b.readUInt16BE(i + 2);
  }
  throw new Error('JPEG senza SOF: ' + file);
}

const URL_ESTERNO = /^(https?:|mailto:|tel:|data:|blob:|javascript:|\/\/)/;
function riferimentiHtml(file) {
  const out = [];
  for (const m of leggi(file).matchAll(/(?:src|href|poster)\s*=\s*["']([^"']+)["']/g)) out.push(m[1]);
  return out;
}
// Riferimento locale -> percorso su disco (senza query e senza ancora).
function suDisco(ref, cartellaPagina) {
  const pulito = ref.split('#')[0].split('?')[0];
  if (!pulito) return null;
  return pulito.startsWith('/') ? path.join(PUB, pulito) : path.join(cartellaPagina, pulito);
}

const FILE_PAGINE = ['index.html', 'menu/index.html', '404.html'];
const FILE_DATI = ['assets/js/config.js', 'assets/js/carni.js', 'assets/js/menu.js', 'assets/js/main.js', 'assets/js/carta.js', 'assets/js/fuoco.js', 'assets/js/orari.js'];

test('ogni src/href locale di index, menu e 404 punta a un file esistente', () => {
  const rotti = [];
  let n = 0;
  for (const p of FILE_PAGINE) {
    const cartella = path.dirname(path.join(PUB, p));
    for (const ref of riferimentiHtml(p)) {
      if (URL_ESTERNO.test(ref) || ref === '' || ref.startsWith('#')) continue;
      n++;
      const d = suDisco(ref, cartella);
      if (d && !fs.existsSync(d)) rotti.push(`${p} -> ${ref}`);
    }
  }
  assert.ok(n > 30, 'troppo pochi riferimenti letti: ' + n);
  assert.deepEqual(rotti, []);
});

test('i percorsi assets/ dentro i dati JS esistono (carni, config, menu, main, carta)', () => {
  const rotti = [];
  for (const f of FILE_DATI) {
    for (const m of leggi(f).matchAll(/['"](assets\/[^'"]+)['"]/g)) if (!esiste(m[1])) rotti.push(`${f} -> ${m[1]}`);
    for (const m of leggi(f).matchAll(/['"]\.\.\/(assets\/[^'"]+)['"]/g)) if (!esiste(m[1])) rotti.push(`${f} -> ../${m[1]}`);
  }
  assert.deepEqual(rotti, []);
});

test('i url() dei CSS esistono', () => {
  const rotti = [];
  for (const f of ['assets/css/style.css', 'assets/css/menu.css']) {
    for (const m of leggi(f).matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
      if (URL_ESTERNO.test(m[1]) || m[1].startsWith('#')) continue;
      if (!esiste(path.relative(PUB, path.join(path.dirname(path.join(PUB, f)), m[1])))) rotti.push(`${f} -> ${m[1]}`);
    }
  }
  assert.deepEqual(rotti, []);
});

test('le meta og:image e twitter:image puntano a file esistenti', () => {
  for (const p of FILE_PAGINE.slice(0, 2)) {
    for (const m of leggi(p).matchAll(/content="https:\/\/ilmacellaiobn\.it\/([^"]+)"/g)) {
      if (m[1].startsWith('menu/')) continue;
      assert.ok(esiste(m[1]), `${p}: ${m[1]} non esiste`);
    }
  }
});

// Forma vecchia con la virgola ("Via Napoli, 149") e numero 118 mai usato per il locale.
const VECCHIO_INDIRIZZO = /Napoli,\s*(149|118)\b|Napoli\s+118\b/;
test('nessun indirizzo vecchio (Via Napoli, 149 / 118) nel sito, nel README e nei dati', () => {
  const file = [...FILE_PAGINE, ...FILE_DATI, 'assets/css/style.css', 'assets/css/menu.css', 'robots.txt', 'sitemap.xml'];
  const trovati = [];
  for (const f of file) {
    if (VECCHIO_INDIRIZZO.test(leggi(f))) trovati.push(f);
  }
  if (VECCHIO_INDIRIZZO.test(fs.readFileSync(path.join(RADICE, 'README.md'), 'utf8'))) trovati.push('README.md');
  assert.deepEqual(trovati, []);
});

test('nessun riferimento ai file rimossi (staff-banco, costate-charolaise, carni/mooi-mooi)', () => {
  const testi = [...FILE_PAGINE, ...FILE_DATI, 'assets/css/style.css', 'assets/css/menu.css'].map((f) => [f, leggi(f)]);
  testi.push(['README.md', fs.readFileSync(path.join(RADICE, 'README.md'), 'utf8')]);
  testi.push(['media/instagram/elenco.md', fs.readFileSync(path.join(RADICE, 'media/instagram/elenco.md'), 'utf8')]);
  const colpi = [];
  for (const [f, t] of testi) {
    for (const v of ['staff-banco-macelleria', 'costate-charolaise-banco', 'carni/mooi-mooi.jpg', 'Charolaise']) {
      if (t.includes(v)) colpi.push(`${f} contiene "${v}"`);
    }
  }
  assert.deepEqual(colpi, []);
});

test('le foto in public/ sono tutte usate da qualche pagina o dato (niente orfani)', () => {
  const sorgenti = [...FILE_PAGINE, ...FILE_DATI, 'assets/css/style.css', 'assets/css/menu.css'].map((f) => leggi(f)).join('\n');
  const orfani = [];
  for (const cartella of ['assets/img/foto', 'assets/img/carni', 'assets/video']) {
    for (const f of fs.readdirSync(path.join(PUB, cartella))) {
      if (!/\.(jpg|mp4|png|svg)$/i.test(f)) continue;
      if (!sorgenti.includes(f)) orfani.push(`${cartella}/${f}`);
    }
  }
  assert.deepEqual(orfani, []);
});

test('tutti gli script delle pagine hanno defer, nell\'ordine di dipendenza', () => {
  for (const p of FILE_PAGINE.slice(0, 2)) {
    const script = [...leggi(p).matchAll(/<script([^>]*)src="([^"]+)"/g)];
    for (const m of script) assert.match(m[1], /\bdefer\b/, `${p}: ${m[2]} senza defer`);
  }
  const indice = [...leggi('index.html').matchAll(/src="assets\/js\/([^"]+)"/g)].map((m) => m[1]);
  assert.ok(indice.indexOf('config.js') < indice.indexOf('main.js'), 'config.js deve venire prima di main.js');
  assert.ok(indice.indexOf('carni.js') < indice.indexOf('main.js'), 'carni.js deve venire prima di main.js');
  assert.ok(indice.indexOf('mappa.js') < indice.indexOf('main.js'), 'mappa.js deve venire prima di main.js');
});

test('nessun uso di eval, new Function o stringhe in setTimeout/setInterval (la CSP non ammette unsafe-eval)', () => {
  const colpi = [];
  for (const f of [...FILE_DATI, 'assets/js/mappa.js']) {
    const t = leggi(f);
    if (/\beval\s*\(|new Function\s*\(|setTimeout\(\s*['"`]|setInterval\(\s*['"`]/.test(t)) colpi.push(f);
  }
  assert.deepEqual(colpi, []);
});

test('JSON-LD: JSON valido, indirizzo e telefono come in config.js, orari come in config.js', () => {
  const cfg = caricaDati('assets/js/config.js').SITO;
  const t = leggi('index.html');
  const blocco = t.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(blocco, 'JSON-LD assente in index.html');
  const ld = JSON.parse(blocco[1]);
  assert.equal(ld.address.streetAddress, cfg.indirizzo.via, 'streetAddress diverso da config.js');
  assert.equal(ld.address.postalCode, cfg.indirizzo.cap);
  assert.equal(ld.telephone, cfg.contatti.telefono);

  const giorniEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const norm = (h) => (h === '24:00' ? '23:59' : h); // schema.org non accetta 24:00: il Sabato chiude 23:59 nei dati strutturati
  const specifiche = ld.openingHoursSpecification;
  const attesi = [];
  for (const g of cfg.orari) for (const [apre, chiude] of g.fasce) attesi.push({ giorno: giorniEn[g.giorno], apre, chiude: norm(chiude) });
  for (const a of attesi) {
    const trovato = specifiche.some((s) => [].concat(s.dayOfWeek).includes(a.giorno) && s.opens === a.apre && s.closes === a.chiude);
    assert.ok(trovato, `JSON-LD manca ${a.giorno} ${a.apre}-${a.chiude}`);
  }
  // Nessuna fascia nei dati strutturati per i giorni chiusi (martedì in config.js).
  const chiusi = cfg.orari.filter((g) => g.fasce.length === 0).map((g) => giorniEn[g.giorno]);
  for (const s of specifiche) {
    for (const d of [].concat(s.dayOfWeek)) assert.ok(!chiusi.includes(d), `JSON-LD ha orari di ${d}, chiuso in config.js`);
  }
  // Ogni fascia di JSON-LD esiste in config.js
  for (const s of specifiche) {
    for (const d of [].concat(s.dayOfWeek)) {
      const ok = attesi.some((a) => a.giorno === d && a.apre === s.opens && a.chiude === s.closes);
      assert.ok(ok, `JSON-LD ha ${d} ${s.opens}-${s.closes} che config.js non ha`);
    }
  }
});

test('menu/index.html: JSON-LD BreadcrumbList valido', () => {
  const m = leggi('menu/index.html').match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(m);
  const j = JSON.parse(m[1]);
  assert.equal(j['@type'], 'BreadcrumbList');
  assert.equal(j.itemListElement.length, 2);
});

test('dimensioni: width/height degli <img> coincidono con le proporzioni reali dei file (niente salti di layout)', () => {
  const difformi = [];
  for (const p of FILE_PAGINE.slice(0, 2)) {
    for (const m of leggi(p).matchAll(/<img[^>]*src="([^"]+)"[^>]*width="(\d+)"[^>]*height="(\d+)"/g)) {
      const src = m[1].replace(/^\.\.\//, '');
      if (!src.endsWith('.jpg')) continue;
      const d = dimensioniJpeg(src);
      const attesa = +m[2] / +m[3];
      const reale = d.w / d.h;
      if (Math.abs(attesa / reale - 1) > 0.01) difformi.push(`${p}: ${src} attributi ${m[2]}x${m[3]} reale ${d.w}x${d.h}`);
    }
  }
  assert.deepEqual(difformi, []);
});

test('galleria, tartare e foto della macelleria: proporzione 3:4 reale (la foto non viene ritagliata a 3:4)', () => {
  const cfg = caricaDati('assets/js/config.js').SITO;
  for (const f of cfg.foto.filter((x) => x.src)) {
    const d = dimensioniJpeg(f.src);
    assert.ok(Math.abs(d.w / d.h - 0.75) < 0.01, `${f.src} ${d.w}x${d.h} non è 3:4`);
  }
  const tartare = dimensioniJpeg('assets/img/foto/tartare-rucola-piatto.jpg');
  assert.ok(Math.abs(tartare.w / tartare.h - 0.75) < 0.01, 'tartare non 3:4');
  for (const f of ['assets/img/foto/calciatori-benevento-macellaio.jpg', 'assets/img/foto/jey-lillo-macellaio.jpg']) {
    const d = dimensioniJpeg(f);
    assert.ok(Math.abs(d.w / d.h - 0.75) < 0.01, `${f} non 3:4`);
  }
});

test('carni.js: Charolaise rimossa, Mooi Mooi con foto del locale, riquadro 1:1 e cartellino', () => {
  const carni = caricaDati('assets/js/carni.js').CARNI;
  assert.ok(!carni.razze.some((r) => /charolaise/i.test(r.nome)), 'Charolaise ancora presente');
  assert.ok(!carni.tutteLeRazze.some((r) => /charolaise/i.test(r)), 'Charolaise ancora in tutteLeRazze');
  const mooi = carni.razze.find((r) => r.nome === 'Mooi Mooi');
  assert.ok(mooi, 'Mooi Mooi manca');
  assert.equal(mooi.banco, true, 'Mooi Mooi non segnata come vista al banco');
  assert.ok(esiste(mooi.foto), 'foto Mooi Mooi mancante: ' + mooi.foto);
  assert.equal(mooi.riquadro, '1 / 1');
  const d = dimensioniJpeg(mooi.foto);
  assert.ok(d.w / d.h > 0 && d.w >= 800, 'foto Mooi Mooi troppo piccola');
  assert.ok(!mooi.credito, 'Mooi Mooi non dovrebbe avere credito Flickr (foto del locale)');
});

test('carni.js: Francia sulla mappa con almeno una razza (Le Moire), e ogni razza ha un paese esistente', () => {
  const carni = caricaDati('assets/js/carni.js').CARNI;
  const idPaesi = carni.paesi.map((p) => p.id);
  assert.ok(idPaesi.includes('francia'), 'francia non è tra i paesi della mappa');
  assert.ok(carni.razze.some((r) => r.paese === 'francia' && r.nome === 'Le Moire'), 'Le Moire non è sotto francia');
  for (const r of carni.razze) {
    assert.ok(idPaesi.includes(r.paese), `razza ${r.nome} con paese sconosciuto ${r.paese}`);
    assert.ok(r.segni && r.segni.length, `razza ${r.nome} senza segni`);
    if (r.foto) assert.ok(esiste(r.foto), `foto di ${r.nome} mancante: ${r.foto}`);
    // Le foto in img/carni/ vengono da Flickr e richiedono il credito; quelle in img/foto/ sono del locale.
    if (r.foto && r.foto.includes('/img/carni/')) assert.ok(r.credito, `${r.nome}: foto da Flickr senza credito (obbligatorio)`);
  }
});

test('galleria config.js: ogni voce ha src/video e poster esistenti, alt presente', () => {
  const cfg = caricaDati('assets/js/config.js').SITO;
  for (const f of cfg.foto) {
    assert.ok(f.alt && f.alt.length > 5, 'alt mancante o vuoto: ' + JSON.stringify(f));
    if (f.src) assert.ok(esiste(f.src), 'src mancante: ' + f.src);
    if (f.video) assert.ok(esiste(f.video) && esiste(f.poster), 'video/poster mancante: ' + f.video);
  }
});

test('accessibilità statica: ogni <img> ha un attributo alt', () => {
  const senza = [];
  for (const p of FILE_PAGINE.slice(0, 2)) {
    for (const tag of leggi(p).match(/<img\b[^>]*>/g) || []) if (!/\balt=/.test(tag)) senza.push(`${p}: ${tag.slice(0, 80)}`);
  }
  assert.deepEqual(senza, []);
});

test('accessibilità: contrasto del testo secondario (--osso-3 su --carbone) >= 4.5:1', () => {
  const css = leggi('assets/css/style.css');
  const osso = css.match(/--osso:\s*(#[0-9a-f]{6})/i)[1];
  const alfa = +css.match(/--osso-3:\s*rgba\(\s*241,\s*228,\s*208,\s*([\d.]+)\)/)[1];
  const carbone = css.match(/--carbone:\s*(#[0-9a-f]{6})/i)[1];
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const lum = (c) => {
    const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const fondo = rgb(carbone);
  const testo = rgb(osso).map((v, i) => alfa * v + (1 - alfa) * fondo[i]);
  const L1 = lum(testo), L2 = lum(fondo);
  const rapporto = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  assert.ok(rapporto >= 4.5, `contrasto ${rapporto.toFixed(2)}:1`);
});

test('wrangler.jsonc: main, asset e route coerenti con il Worker', () => {
  const grezzo = fs.readFileSync(path.join(RADICE, 'wrangler.jsonc'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  const w = JSON.parse(grezzo);
  assert.equal(w.main, 'worker/index.js');
  assert.ok(esiste(w.assets.directory, RADICE) || fs.existsSync(path.resolve(RADICE, w.assets.directory)), 'directory asset mancante');
  assert.equal(w.assets.run_worker_first, true, 'run_worker_first deve essere true perche il Worker mette gli header');
  assert.equal(w.assets.not_found_handling, '404-page');
  const pattern = w.routes.map((r) => r.pattern);
  assert.deepEqual(pattern.sort(), ['ilmacellaiobn.it', 'www.ilmacellaiobn.it']);
});

test('sitemap e robots: URL canonici e robots che punta alla sitemap', () => {
  const sm = leggi('sitemap.xml');
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual(urls, ['https://ilmacellaiobn.it/', 'https://ilmacellaiobn.it/menu/']);
  assert.ok(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(sm), 'lastmod assente');
  assert.match(leggi('robots.txt'), /Sitemap: https:\/\/ilmacellaiobn\.it\/sitemap\.xml/);
  assert.match(leggi('index.html'), /<link rel="canonical" href="https:\/\/ilmacellaiobn\.it\/">/);
  assert.match(leggi('menu/index.html'), /<link rel="canonical" href="https:\/\/ilmacellaiobn\.it\/menu\/">/);
});

test('menu.js: il menu carica e ogni piatto ha nome e prezzo', () => {
  const m = caricaDati('assets/js/menu.js');
  assert.ok(Array.isArray(m.MENU) && m.MENU.length > 0, 'MENU vuoto');
  const piatti = m.MENU.flatMap((s) => s.piatti || []);
  assert.ok(piatti.length >= 5, 'pochi piatti: ' + piatti.length);
  for (const p of piatti) assert.ok(p.nome, 'piatto senza nome');
});
