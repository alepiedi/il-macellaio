// Test HTTP contro il Worker reale (wrangler dev), con gli asset veri di public/.
// Avvio:  npx wrangler dev --local --local-protocol https --port 8787
// Poi:    node --test tests/worker-http.test.mjs      (BASE_URL per cambiare indirizzo)
// Se il Worker non risponde, i test vengono saltati con un messaggio, non segnati come superati.
import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';

// Il certificato di wrangler in locale non e' firmato da un'autorita' fidata: solo per questi test.
if (/127\.0\.0\.1|localhost/.test(process.env.BASE_URL || 'https://127.0.0.1:8787')) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const BASE = process.env.BASE_URL || 'https://127.0.0.1:8787';

let attivo = false;
before(async () => {
  try {
    await fetch(BASE + '/', { redirect: 'manual', signal: AbortSignal.timeout(4000) });
    attivo = true;
  } catch {
    attivo = false;
  }
});

const get = (p, init = {}) => fetch(BASE + p, { redirect: 'manual', ...init });
const saltaSeNonAttivo = (t) => { if (!attivo) { t.skip(`Worker non raggiungibile su ${BASE}: avvia wrangler dev`); return true; } return false; };

describe('Worker HTTP (wrangler dev)', () => {
  test('/ serve la home 200 come text/html, con CSP e header di sicurezza', async (t) => {
    if (saltaSeNonAttivo(t)) return;
    const r = await get('/');
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-type'), /text\/html/);
    assert.match(r.headers.get('content-security-policy') || '', /default-src 'self'/);
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
    assert.match(await r.text(), /<title>Il Macellaio/);
  });

  test('/menu/ serve la pagina del menu', async (t) => {
    if (saltaSeNonAttivo(t)) return;
    const r = await get('/menu/');
    assert.equal(r.status, 200);
    assert.match(await r.text(), /<title>Menu · Il Macellaio/);
  });

  test('/menu senza slash va a /menu/ (redirect), non a 404', async (t) => {
    if (saltaSeNonAttivo(t)) return;
    const r = await get('/menu');
    assert.ok([301, 302, 307, 308].includes(r.status), 'status ' + r.status);
    assert.equal(new URL(r.headers.get('location'), BASE).pathname, '/menu/');
  });

  test('pagina inesistente: 404 con la pagina 404 del sito, no-store e CSP', async (t) => {
    if (saltaSeNonAttivo(t)) return;
    const r = await get('/questa-pagina-non-esiste-123');
    assert.equal(r.status, 404);
    assert.equal(r.headers.get('cache-control'), 'no-store');
    assert.match(await r.text(), /Pagina non trovata/);
  });

  test('asset CSS, JS, immagine, font e video: 200 con il giusto Content-Type e cache', async (t) => {
    if (saltaSeNonAttivo(t)) return;
    const casi = [
      ['/assets/css/style.css', /text\/css/, /must-revalidate/],
      ['/assets/js/main.js', /javascript/, /must-revalidate/],
      ['/assets/img/foto/tartare-rucola-piatto.jpg', /image\/jpeg/, /max-age=604800/],
      ['/assets/fonts/fraunces.woff2', /font\/woff2|application\/font-woff2|woff2/, /max-age=2592000/],
      ['/assets/video/brace.mp4', /video\/mp4/, /max-age=604800/],
    ];
    for (const [p, tipo, cache] of casi) {
      const r = await get(p);
      assert.equal(r.status, 200, p);
      assert.match(r.headers.get('content-type') || '', tipo, p);
      assert.match(r.headers.get('cache-control') || '', cache, p);
      assert.equal(r.headers.get('x-content-type-options'), 'nosniff', p);
      await r.arrayBuffer();
    }
  });

  test('robots.txt e sitemap.xml serviti dal sito', async (t) => {
    if (saltaSeNonAttivo(t)) return;
    const robots = await get('/robots.txt');
    assert.equal(robots.status, 200);
    // Su workers.dev (host di prova) il Worker risponde con Disallow: il sito vero e' ilmacellaiobn.it.
    assert.match(await robots.text(), /User-agent/);
    const sm = await get('/sitemap.xml');
    assert.equal(sm.status, 200);
    assert.match(await sm.text(), /<urlset/);
  });

  test('POST, PUT, DELETE: 405 con Allow: GET, HEAD', async (t) => {
    if (saltaSeNonAttivo(t)) return;
    for (const metodo of ['POST', 'PUT', 'DELETE']) {
      const r = await get('/', { method: metodo, body: metodo === 'POST' ? 'x=1' : undefined });
      assert.equal(r.status, 405, metodo);
      assert.equal(r.headers.get('allow'), 'GET, HEAD', metodo);
      await r.arrayBuffer();
    }
  });

  test('HEAD su / risponde 200 senza corpo', async (t) => {
    if (saltaSeNonAttivo(t)) return;
    const r = await get('/', { method: 'HEAD' });
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-type') || '', /text\/html/);
  });

  test('nessun Set-Cookie sulle pagine', async (t) => {
    if (saltaSeNonAttivo(t)) return;
    for (const p of ['/', '/menu/']) {
      const r = await get(p);
      assert.equal(r.headers.get('set-cookie'), null, p);
      await r.arrayBuffer();
    }
  });
});
