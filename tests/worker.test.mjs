// Test del Worker (worker/index.js) senza rete: ASSETS è finto, si controlla solo la logica del Worker
// (redirect, metodi, header di sicurezza, cache). Si lancia con `node --test tests/`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'node:fs';

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { default: worker } = await import(pathToFileURL(path.join(RADICE, 'worker/index.js')).href);

// Simula ASSETS: risposte tipiche di un asset server statico.
const TIPI = {
  html: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'application/javascript; charset=utf-8',
  jpg: 'image/jpeg',
  woff2: 'font/woff2',
  mp4: 'video/mp4',
  txt: 'text/plain; charset=utf-8',
  xml: 'application/xml; charset=utf-8',
};
const PAGINE = {
  '/': ['html', '<!doctype html><title>home</title>'],
  '/menu/': ['html', '<!doctype html><title>menu</title>'],
  '/assets/css/style.css': ['css', 'body{}'],
  '/assets/js/main.js': ['js', '/* js */'],
  '/assets/img/foto/tartare-rucola-piatto.jpg': ['jpg', 'JPEG'],
  '/assets/fonts/fraunces.woff2': ['woff2', 'WOFF2'],
  '/assets/video/brace.mp4': ['mp4', 'MP4'],
  // robots.txt e sitemap sono letti dal disco: il test controlla il contenuto vero.
  '/robots.txt': ['txt', fs.readFileSync(path.join(RADICE, 'public/robots.txt'), 'utf8')],
  '/sitemap.xml': ['xml', fs.readFileSync(path.join(RADICE, 'public/sitemap.xml'), 'utf8')],
};
const assets = {
  chiamate: [],
  fetch(request) {
    const u = new URL(request.url);
    this.chiamate.push(`${request.method} ${u.pathname}`);
    if (u.pathname === '/menu') {
      // Il dispositivo di ASSETS rimanda la cartella senza slash.
      return new Response(null, { status: 307, headers: { Location: '/menu/' } });
    }
    const p = PAGINE[u.pathname];
    if (!p) {
      return new Response('<!doctype html><title>404</title>', { status: 404, headers: { 'Content-Type': TIPI.html } });
    }
    return new Response(request.method === 'HEAD' ? null : p[1], { status: 200, headers: { 'Content-Type': TIPI[p[0]], ETag: '"x"' } });
  },
};
const env = { ASSETS: assets };
const richiedi = (url, init = {}) => worker.fetch(new Request(url, init), env);

test('http sul dominio va in https con 301, il percorso e la query restano', async () => {
  const r = await richiedi('http://ilmacellaiobn.it/menu/?x=1');
  assert.equal(r.status, 301);
  assert.equal(r.headers.get('Location'), 'https://ilmacellaiobn.it/menu/?x=1');
});

test('www in https e in http vanno al dominio senza www, con 301', async () => {
  for (const u of ['https://www.ilmacellaiobn.it/', 'http://www.ilmacellaiobn.it/a/b?c=d']) {
    const r = await richiedi(u);
    assert.equal(r.status, 301, u);
    assert.equal(r.headers.get('Location'), new URL(u).pathname === '/' ? 'https://ilmacellaiobn.it/' : 'https://ilmacellaiobn.it/a/b?c=d', u);
  }
});

test('il dominio canonico in https non viene reindirizzato', async () => {
  const r = await richiedi('https://ilmacellaiobn.it/');
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('Location'), null);
});

test('metodi diversi da GET e HEAD: 405 con Allow, sul dominio e sui workers.dev', async () => {
  for (const host of ['https://ilmacellaiobn.it/', 'https://il-macellaio-benevento.example.workers.dev/']) {
    for (const metodo of ['POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']) {
      const r = await richiedi(host, { method: metodo });
      assert.equal(r.status, 405, `${metodo} ${host}`);
      assert.equal(r.headers.get('Allow'), 'GET, HEAD');
    }
  }
});

test('HEAD passa agli asset e non viene rifiutato', async () => {
  const r = await richiedi('https://ilmacellaiobn.it/', { method: 'HEAD' });
  assert.equal(r.status, 200);
  assert.ok(assets.chiamate.includes('HEAD /'), 'HEAD non inoltrato a ASSETS');
});

test('header di sicurezza su HTML e su asset', async () => {
  for (const p of ['/', '/assets/css/style.css', '/assets/img/foto/tartare-rucola-piatto.jpg']) {
    const r = await richiedi('https://ilmacellaiobn.it' + p);
    assert.equal(r.headers.get('X-Content-Type-Options'), 'nosniff', p);
    assert.equal(r.headers.get('Referrer-Policy'), 'strict-origin-when-cross-origin', p);
    assert.equal(r.headers.get('Cross-Origin-Opener-Policy'), 'same-origin', p);
    assert.match(r.headers.get('Permissions-Policy') || '', /geolocation=\(\)/, p);
    assert.equal(r.headers.get('Strict-Transport-Security'), 'max-age=31536000', p);
  }
});

test('CSP solo sulle risposte HTML, senza unsafe-eval, con frame-ancestors e form-action', async () => {
  const html = await richiedi('https://ilmacellaiobn.it/');
  const csp = html.headers.get('Content-Security-Policy');
  assert.ok(csp, 'CSP assente sull HTML');
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /script-src 'self' 'unsafe-inline'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /form-action 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /worker-src 'self' blob:/);
  assert.doesNotMatch(csp, /unsafe-eval/);
  assert.doesNotMatch(csp, /\*/, 'CSP con wildcard');
  const css = await richiedi('https://ilmacellaiobn.it/assets/css/style.css');
  assert.equal(css.headers.get('Content-Security-Policy'), null, 'CSP non dovrebbe stare sugli asset');
});

test('workers.dev: nessuna indicizzazione (X-Robots-Tag, robots.txt chiuso) e niente HSTS', async () => {
  const dev = 'https://il-macellaio-benevento.example.workers.dev';
  const home = await richiedi(dev + '/');
  assert.equal(home.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  assert.equal(home.headers.get('Strict-Transport-Security'), null);
  const robots = await richiedi(dev + '/robots.txt');
  assert.match(await robots.text(), /Disallow: \//);
});

test('dominio reale: robots.txt dal sito (con sitemap) e nessun X-Robots-Tag', async () => {
  const r = await richiedi('https://ilmacellaiobn.it/robots.txt');
  assert.match(await r.text(), /Sitemap: https:\/\/ilmacellaiobn\.it\/sitemap\.xml/);
  assert.equal(r.headers.get('X-Robots-Tag'), null);
});

test('cache: HTML e CSS/JS da riconvalidare, font 30 giorni, immagini e video 7 giorni', async () => {
  const cc = async (p) => (await richiedi('https://ilmacellaiobn.it' + p)).headers.get('Cache-Control');
  assert.equal(await cc('/'), 'public, max-age=0, must-revalidate');
  assert.equal(await cc('/assets/css/style.css'), 'public, max-age=0, must-revalidate');
  assert.equal(await cc('/assets/js/main.js'), 'public, max-age=0, must-revalidate');
  assert.equal(await cc('/assets/fonts/fraunces.woff2'), 'public, max-age=2592000');
  assert.match(await cc('/assets/img/foto/tartare-rucola-piatto.jpg'), /max-age=604800/);
  assert.match(await cc('/assets/video/brace.mp4'), /max-age=604800/);
  assert.equal(await cc('/robots.txt'), 'public, max-age=3600');
});

test('404: status 404, no-store, con il body della pagina 404', async () => {
  const r = await richiedi('https://ilmacellaiobn.it/non-esiste');
  assert.equal(r.status, 404);
  assert.equal(r.headers.get('Cache-Control'), 'no-store');
  assert.match(r.headers.get('Content-Security-Policy') || '', /default-src/, 'CSP anche sulla 404 HTML');
});

test('redirect degli asset (es. /menu senza slash) non viene messo in cache e mantiene Location', async () => {
  const r = await richiedi('https://ilmacellaiobn.it/menu');
  assert.equal(r.status, 307);
  assert.equal(r.headers.get('Location'), '/menu/');
  assert.equal(r.headers.get('Cache-Control'), null, 'un redirect non dovrebbe avere cache impostata dal Worker');
});

test('nessun cookie impostato dal Worker (promessa del README)', async () => {
  for (const p of ['/', '/menu/', '/404x']) {
    const r = await richiedi('https://ilmacellaiobn.it' + p);
    assert.equal(r.headers.get('Set-Cookie'), null, p);
  }
});
