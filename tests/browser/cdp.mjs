// Client minimo del Chrome DevTools Protocol, senza dipendenze: usa il Chrome gia installato
// e il WebSocket integrato in Node (>= 22). Serve ai test di browser in tests/browser/.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function avviaChrome(porta = 9437) {
  const profilo = mkdtempSync(path.join(os.tmpdir(), 'macellaio-qa-'));
  const proc = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${porta}`,
    `--user-data-dir=${profilo}`,
    '--ignore-certificate-errors', // il Worker in locale ha un certificato di prova
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--mute-audio',
    '--enable-unsafe-swiftshader', '--use-angle=swiftshader', // WebGL in headless
    'about:blank',
  ], { stdio: 'ignore' });
  let versione = null;
  for (let i = 0; i < 150 && !versione; i++) {
    try { versione = await (await fetch(`http://127.0.0.1:${porta}/json/version`)).json(); } catch { await sleep(100); }
  }
  if (!versione) { proc.kill(); throw new Error(`Chrome non risponde sulla porta ${porta}`); }
  return { proc, profilo, porta, versione };
}

export async function chiudiChrome(chrome) {
  chrome.proc.kill();
  await sleep(300);
  try { rmSync(chrome.profilo, { recursive: true, force: true }); } catch { /* profilo gia' rimosso */ }
}

export async function nuovaPagina(porta) {
  const t = await (await fetch(`http://127.0.0.1:${porta}/json/new?about:blank`, { method: 'PUT' })).json();
  const p = new Pagina(t.webSocketDebuggerUrl, t.id, porta);
  await p.pronta;
  return p;
}

export class Pagina {
  constructor(url, id, porta) {
    this.ws = new WebSocket(url);
    this.id = id;
    this.porta = porta;
    this.seq = 0;
    this.attese = new Map();
    this.ascoltatori = new Map();
    this.errori = [];   // errori: JS, console.error, CSP, risorse non caricate, HTTP >= 400
    this.avvisi = [];   // avvisi di console (non bloccanti)
    this.pronta = new Promise((res, rej) => {
      this.ws.addEventListener('open', res);
      this.ws.addEventListener('error', () => rej(new Error('WebSocket CDP non raggiungibile')));
    });
    this.ws.addEventListener('message', (m) => this.#ricevi(JSON.parse(m.data)));
  }

  #ricevi(msg) {
    if (msg.id && this.attese.has(msg.id)) {
      const a = this.attese.get(msg.id);
      this.attese.delete(msg.id);
      if (msg.error) a.rej(new Error(`${a.metodo}: ${msg.error.message}`)); else a.res(msg.result);
      return;
    }
    if (!msg.method) return;
    this.#registra(msg.method, msg.params || {});
    (this.ascoltatori.get(msg.method) || []).forEach((f) => f(msg.params || {}));
  }

  #registra(metodo, p) {
    const tronca = (s) => String(s).replace(/\s+/g, ' ').slice(0, 300);
    if (metodo === 'Runtime.exceptionThrown') {
      const d = p.exceptionDetails || {};
      this.errori.push('Eccezione JS: ' + tronca((d.exception && d.exception.description) || d.text || '?'));
    }
    if (metodo === 'Runtime.consoleAPICalled' && (p.type === 'error' || p.type === 'assert')) {
      this.errori.push('console.error: ' + tronca(p.args.map((a) => a.value ?? a.description ?? '').join(' ')));
    }
    if (metodo === 'Log.entryAdded') {
      const e = p.entry;
      const sicurezza = e.source === 'security' || /Content Security Policy|Refused to/i.test(e.text);
      if (e.level === 'error') this.errori.push((sicurezza ? 'CSP/sicurezza: ' : `${e.source}: `) + tronca(e.text) + (e.url ? ' ' + e.url : ''));
      else if (e.level === 'warning') this.avvisi.push(`${e.source}: ` + tronca(e.text) + (e.url ? ' ' + e.url : ''));
    }
    if (metodo === 'Network.responseReceived' && p.response.status >= 400) {
      this.errori.push(`HTTP ${p.response.status} ${p.response.url}`);
    }
    if (metodo === 'Network.loadingFailed' && !p.canceled) {
      this.errori.push(`Caricamento fallito (${p.type || 'risorsa'}): ${p.errorText}`);
    }
  }

  send(metodo, params = {}) {
    const id = ++this.seq;
    this.ws.send(JSON.stringify({ id, method: metodo, params }));
    return new Promise((res, rej) => this.attese.set(id, { res, rej, metodo }));
  }

  on(metodo, f) {
    if (!this.ascoltatori.has(metodo)) this.ascoltatori.set(metodo, []);
    this.ascoltatori.get(metodo).push(f);
  }

  attendi(metodo, timeout = 60000) {
    return new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error(`Timeout (${timeout} ms) in attesa di ${metodo}`)), timeout);
      this.on(metodo, (p) => { clearTimeout(t); res(p); });
    });
  }

  async valuta(espressione, { timeout = 60000 } = {}) {
    const r = await Promise.race([
      this.send('Runtime.evaluate', { expression: espressione, awaitPromise: true, returnByValue: true }),
      sleep(timeout).then(() => { throw new Error('Timeout nella valutazione JS'); }),
    ]);
    if (r.exceptionDetails) {
      const d = r.exceptionDetails;
      throw new Error('Errore JS nella pagina: ' + ((d.exception && d.exception.description) || d.text));
    }
    return r.result.value;
  }

  // Prepara la scheda: viewport, animazioni ridotte, JS spento, cache disattivata.
  async prepara({ larghezza = 1300, altezza = 900, mobile = false, movimentoRidotto = false, senzaJs = false, ritardoRete = null } = {}) {
    for (const m of ['Page.enable', 'Runtime.enable', 'Log.enable', 'Network.enable']) await this.send(m);
    await this.send('Emulation.setDeviceMetricsOverride', { width: larghezza, height: altezza, deviceScaleFactor: 1, mobile });
    await this.send('Emulation.setEmulatedMedia', {
      media: 'screen',
      features: [{ name: 'prefers-reduced-motion', value: movimentoRidotto ? 'reduce' : 'no-preference' }],
    });
    await this.send('Emulation.setScriptExecutionDisabled', { value: senzaJs });
    await this.send('Network.setCacheDisabled', { cacheDisabled: true });
    if (ritardoRete) {
      await this.send('Network.emulateNetworkConditions', {
        offline: false, latency: ritardoRete.latenza, downloadThroughput: ritardoRete.download, uploadThroughput: 50 * 1024,
      });
    }
  }

  // Script eseguito prima di ogni altro script della pagina (es. data fissa).
  async iniettaPrima(sorgente) {
    return this.send('Page.addScriptToEvaluateOnNewDocument', { source: sorgente });
  }

  async vai(url, { timeout = 120000 } = {}) {
    const caricato = this.attendi('Page.loadEventFired', timeout);
    const nav = await this.send('Page.navigate', { url });
    if (nav.errorText) throw new Error(`Navigazione fallita: ${nav.errorText}`);
    await caricato;
    await sleep(800);
  }

  // Scorre tutta la pagina: fa partire le immagini pigre e le animazioni di comparsa.
  // behavior: 'instant' perche' html ha scroll-behavior: smooth; altrimenti i passi si sovrappongono.
  async scorriTutto() {
    await this.valuta(`(async () => {
      const h = document.documentElement.scrollHeight;
      for (let y = 0; y <= h; y += 350) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 120)); }
      await new Promise(r => setTimeout(r, 300));
      await Promise.race([
        Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => {
          i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true });
        }))),
        new Promise(r => setTimeout(r, 10000)),
      ]);
      window.scrollTo({ top: 0, behavior: 'instant' });
      await new Promise(r => setTimeout(r, 400));
      return true;
    })()`, { timeout: 150000 });
  }

  async attesaImmagini(ms = 10000) {
    return this.valuta(`Promise.race([
      Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => {
        i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true });
      }))).then(() => 'tutte'),
      new Promise(r => setTimeout(() => r('timeout'), ${ms}))
    ])`, { timeout: ms + 5000 });
  }

  async chiudi() {
    await fetch(`http://127.0.0.1:${this.porta}/json/close/${this.id}`).catch(() => {});
    this.ws.close();
  }

  // Screenshot di un elemento (coordinate del documento), salvato in file PNG.
  async fotoElemento(selettore, file, { margine = 12 } = {}) {
    const r = await this.valuta(`(() => {
      const e = document.querySelector(${JSON.stringify(selettore)});
      if (!e) return null;
      e.scrollIntoView({ block: 'center' });
      const b = e.getBoundingClientRect();
      return { x: Math.max(0, b.left + scrollX - ${margine}), y: Math.max(0, b.top + scrollY - ${margine}), w: b.width + 2 * ${margine}, h: b.height + 2 * ${margine} };
    })()`);
    if (!r) return null;
    await sleep(900); // lascia finire le transizioni di comparsa
    const { data } = await this.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 },
    });
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, Buffer.from(data, 'base64'));
    return file;
  }

  async fotoPagina(file) {
    const h = await this.valuta('document.documentElement.scrollHeight');
    const larg = await this.valuta('window.innerWidth');
    const { data } = await this.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: larg, height: Math.min(h, 16000), scale: 1 },
    });
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, Buffer.from(data, 'base64'));
    return file;
  }
}
