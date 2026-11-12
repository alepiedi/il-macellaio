// Test di browser a 390 px: pulsante fisso "Prenota", pausa delle animazioni, testata, tastiera, escape del testo.
// Richiede il Worker in locale:  npx --yes wrangler@4.153.0 dev --local --local-protocol https --port 8787
// Avvio:  NODE_TLS_REJECT_UNAUTHORIZED=0 node --test --test-timeout=300000 tests/browser/mobile-pausa-prenota.test.mjs
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { avviaChrome, chiudiChrome, nuovaPagina, sleep } from './cdp.mjs';

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BASE = process.env.BASE_URL || 'https://127.0.0.1:8787';
const PORTA = 9438;
const SHOTS = process.env.QA_SCREENSHOTS || path.join(os.tmpdir(), 'macellaio-qa-screenshots');
const MOBILE = { larghezza: 390, altezza: 844, mobile: true };

function carica(file) {
  const ctx = { window: {}, console };
  vm.runInNewContext(fs.readFileSync(path.join(RADICE, 'public', file), 'utf8'), ctx, { filename: file });
  return ctx.window;
}
const CFG = carica('assets/js/config.js').SITO;
const WA_ATTESO = 'https://wa.me/' + CFG.contatti.whatsapp + '?text=' + encodeURIComponent(CFG.contatti.whatsappTesto);

// Conta le chiamate di disegno dei canvas (ciclo() in fuoco.js) passando da requestAnimationFrame.
const CONTA_FRAME = `(() => {
  if (window.__contaFrame) return;
  window.__contaFrame = 0; const orig = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (f) => { if (/disegna\\(\\(ora/.test(String(f))) window.__contaFrame++; return orig(f); };
})();`;

let chrome;
before(async () => { chrome = await avviaChrome(PORTA); fs.mkdirSync(SHOTS, { recursive: true }); });
after(async () => { if (chrome) await chiudiChrome(chrome); });

async function apri(url, opzioni = {}) {
  const p = await nuovaPagina(PORTA);
  await p.prepara(opzioni);
  await p.iniettaPrima(CONTA_FRAME);
  await p.vai(BASE + url);
  return p;
}
// Scroll istantaneo e attesa di due frame: gli eventi di scroll vengono consegnati al frame successivo.
const scrollA = (p, y) => p.valuta(`window.scrollTo({ top: ${y}, behavior: 'instant' }); new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30))))`);
const attesa = (ms) => sleep(ms);
// Gesto di scorrimento reale: passi piccoli, un frame per passo, cosi' il browser consegna ogni evento di scroll.
async function gesto(p, da, a, passi = 12) {
  for (let i = 1; i <= passi; i++) {
    const y = Math.round(da + (a - da) * i / passi);
    await p.valuta(`window.scrollTo({ top: ${y}, behavior: 'instant' }); new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 16))))`);
  }
  await attesa(120);
}

describe('390 px: testata e overflow', () => {
  for (const url of ['/', '/menu/']) {
    it(`nessun overflow orizzontale in ${url} e in testata`, async () => {
      const p = await apri(url, MOBILE);
      try {
        await p.scorriTutto();
        const pagina = await p.valuta(`({ sw: document.documentElement.scrollWidth, iw: innerWidth })`);
        assert.ok(pagina.sw <= pagina.iw, `pagina: scrollWidth ${pagina.sw} > ${pagina.iw}`);
        const testata = await p.valuta(`(() => {
          const t = document.querySelector('.testata') || document.querySelector('.carta-testata');
          const fuori = [...t.querySelectorAll('*')].filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && (b.right > innerWidth + 0.5 || b.left < -0.5); })
            .map(e => (e.className && e.className.baseVal === undefined ? e.className : e.tagName) + ' right=' + Math.round(e.getBoundingClientRect().right));
          return { sw: t.scrollWidth, cw: t.clientWidth, fuori };
        })()`);
        assert.ok(testata.sw <= testata.cw + 1, `testata scrollWidth ${testata.sw} > clientWidth ${testata.cw}`);
        assert.deepEqual(testata.fuori, [], 'elementi della testata fuori dallo schermo: ' + testata.fuori.join(', '));
        const errori = [...new Set(p.errori)];
        assert.deepEqual(errori, []);
      } finally { await p.chiudi(); }
    });
  }
});

describe('390 px: pulsante fisso "Prenota"', () => {
  let p;
  before(async () => { p = await apri('/', MOBILE); });
  after(async () => { if (p) await p.chiudi(); });

  const stato = () => p.valuta(`(() => { const f = document.querySelector('#prenota-flottante'); return { visibile: f.classList.contains('visibile'), hidden: f.hidden, transform: getComputedStyle(f).transform, y: scrollY }; })()`);

  it('in cima alla pagina e\' nascosto', async () => {
    const s = await stato();
    assert.equal(s.visibile, false);
    assert.equal(s.hidden, false, 'su telefono il pulsante dovrebbe essere presente (solo fuori schermo)');
    assert.notEqual(s.transform, 'none');
  });

  it('dopo lo scorrimento in giu\' si nasconde, riappare dopo 1,2 s di fermo', async () => {
    await gesto(p, 0, Math.round(0.9 * 844));
    assert.equal((await stato()).visibile, false, 'dopo un gesto in giu\' dovrebbe essere nascosto');
    await attesa(1400);
    assert.equal((await stato()).visibile, true, 'dopo 1,2 s di fermo deve riapparire');
  });

  it('scorrendo su riappare subito, scorrendo giu\' si nasconde', async () => {
    await gesto(p, Math.round(0.9 * 844), Math.round(0.9 * 844) - 60, 6);
    assert.equal((await stato()).visibile, true, 'scorrendo su deve riapparire');
    await gesto(p, Math.round(0.9 * 844) - 60, Math.round(0.9 * 844) + 40, 6);
    assert.equal((await stato()).visibile, false, 'scorrendo giu\' deve nascondersi');
  });

  it('nelle sezioni Prenota, Dove e nel piede resta nascosto', async () => {
    for (const sel of ['#prenota', '#dove', '.piede']) {
      await p.valuta(`window.scrollTo({ top: document.querySelector('${sel}').getBoundingClientRect().top + scrollY - 40, behavior: 'instant' })`);
      await attesa(1600);
      assert.equal((await stato()).visibile, false, `visibile dentro ${sel}`);
    }
  });

  it('non copre "Aperto ora" ne\' il modulo quando e\' visibile', async () => {
    await scrollA(p, 0.9 * 844 + 100);
    await attesa(1400);
    const r = await p.valuta(`(() => {
      const f = document.querySelector('#prenota-flottante').getBoundingClientRect();
      const ostacoli = [...document.querySelectorAll('[data-stato], #modulo, #orari')].filter(e => !e.hidden && e.getClientRects().length)
        .map(e => ({ nome: e.id || e.className || e.tagName, b: e.getBoundingClientRect() }))
        .filter(o => o.b.bottom > 0 && o.b.top < innerHeight)
        .filter(o => !(f.right <= o.b.left || f.left >= o.b.right || f.bottom <= o.b.top || f.top >= o.b.bottom))
        .map(o => o.nome);
      return { visibile: document.querySelector('#prenota-flottante').classList.contains('visibile'), sovrapposti: ostacoli, dim: [Math.round(f.width), Math.round(f.height)] };
    })()`);
    assert.equal(r.visibile, true, 'il pulsante dovrebbe essere visibile a questo punto');
    assert.deepEqual(r.sovrapposti, [], 'il pulsante copre: ' + r.sovrapposti.join(', '));
    assert.ok(r.dim[0] >= 44 && r.dim[1] >= 44, 'bersaglio tattile sotto 44 px: ' + r.dim.join('x'));
  });

  it('link WhatsApp: numero e testo da config.js, identico a quello di Dove', async () => {
    const r = await p.valuta(`({
      flottante: document.querySelector('#prenota-flottante').getAttribute('href'),
      target: document.querySelector('#prenota-flottante').target,
      dove: [...document.querySelectorAll('[data-whatsapp]')].map(a => a.getAttribute('href')),
      testo: document.querySelector('#prenota-flottante').textContent.replace(/\\s+/g, ' ').trim(),
      nome: document.querySelector('#prenota-flottante').getAttribute('aria-label')
    })`);
    assert.equal(r.flottante, WA_ATTESO);
    assert.equal(r.target, '_blank');
    assert.equal(r.testo, 'Prenota');
    for (const h of r.dove) assert.equal(h, WA_ATTESO, 'link WhatsApp di Dove diverso dal flottante');
    assert.match(r.nome, /Milad/);
  });

  it('tastiera reale: Tab non porta il focus sul pulsante Prenota nascosto', async () => {
    await scrollA(p, 0);
    await attesa(300);
    await scrollA(p, 0.9 * 844 + 200);
    await attesa(300);
    assert.equal((await stato()).visibile, false, 'prerequisito: il pulsante deve essere nascosto');
    await p.valuta(`document.activeElement && document.activeElement.blur(); window.__y0 = scrollY`);
    let finisce = false;
    for (let i = 0; i < 400 && !finisce; i++) {
      await p.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
      await p.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
      finisce = await p.valuta(`document.activeElement && document.activeElement.id === 'prenota-flottante'`);
    }
    assert.equal(finisce, false, 'Tab arriva al pulsante Prenota mentre e\' nascosto (il focus va su un controllo invisibile)');
  });

  it('tastiera: il pulsante nascosto non deve restare raggiungibile con Tab (rilevamento)', async () => {
    await scrollA(p, 0);
    await attesa(300);
    await scrollA(p, 0.9 * 844 + 100);
    await scrollA(p, 0.9 * 844 + 100 + 200); // scorrendo giu': nascosto
    await attesa(200);
    const r = await p.valuta(`(() => { const f = document.querySelector('#prenota-flottante'); return { visibile: f.classList.contains('visibile'), tabIndex: f.tabIndex, inert: f.inert, aria: f.getAttribute('aria-hidden'), vis: getComputedStyle(f).visibility }; })()`);
    assert.equal(r.visibile, false);
    // Nascosto con visibility: hidden (esce dal tab order) oppure inert / tabindex -1 / aria-hidden.
    assert.ok(r.vis === 'hidden' || r.inert || r.aria === 'true' || r.tabIndex < 0, 'pulsante nascosto ma ancora focusabile (visibility ' + r.vis + ', tabIndex ' + r.tabIndex + ')');
  });

  it('tastiera: quando il pulsante Prenota e\' visibile, Tab lo raggiunge', async () => {
    await scrollA(p, 0);
    await attesa(300);
    await gesto(p, 0, 0.9 * 844 + 300, 10);
    await attesa(1400);
    assert.equal((await stato()).visibile, true, 'prerequisito: il pulsante deve essere visibile');
    await p.valuta(`document.activeElement && document.activeElement.blur()`);
    let trovato = false;
    for (let i = 0; i < 400 && !trovato; i++) {
      await p.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
      await p.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
      trovato = await p.valuta(`document.activeElement && document.activeElement.id === 'prenota-flottante'`);
    }
    assert.equal(trovato, true, 'con il pulsante visibile Tab non lo raggiunge');
  });
});

describe('390 px: pausa delle animazioni', () => {
  it('il pulsante c\'e\', e\' a sinistra del menu e nel viewport; ferma CSS, canvas e video; si riattiva; persiste nella sessione senza cookie', async () => {
    const p = await apri('/', MOBILE);
    try {
      await p.scorriTutto();
      await scrollA(p, 0);
      await attesa(600);
      const init = await p.valuta(`(() => {
        const b = document.querySelector('#pausa-animazioni');
        const r = b.getBoundingClientRect();
        return { hidden: b.hidden, pressed: b.getAttribute('aria-pressed'), label: b.getAttribute('aria-label'), dentro: r.right <= innerWidth && r.left >= 0, w: r.width, h: r.height,
          nastro: getComputedStyle(document.querySelector('.nastro-traccia')).animationPlayState };
      })()`);
      assert.equal(init.hidden, false, 'pulsante pausa nascosto su telefono');
      assert.equal(init.pressed, 'false');
      assert.ok(init.dentro, 'pulsante pausa fuori dallo schermo');
      assert.ok(init.w >= 40 && init.h >= 40, `pulsante piccolo: ${init.w}x${init.h}`);
      assert.equal(init.nastro, 'running');

      const framePrima = await p.valuta(`(async () => { window.__contaFrame = 0; await new Promise(r => setTimeout(r, 1000)); return window.__contaFrame; })()`);
      assert.ok(framePrima > 20, `canvas del fuoco non animati prima della pausa: ${framePrima} frame/s`);

      // Attiva la pausa col clic
      await p.valuta(`document.querySelector('#pausa-animazioni').click()`);
      await attesa(300);
      const dopo = await p.valuta(`({
        pressed: document.querySelector('#pausa-animazioni').getAttribute('aria-pressed'),
        classe: document.documentElement.classList.contains('animazioni-ferme'),
        sessione: sessionStorage.getItem('macellaio-pausa'),
        nastro: getComputedStyle(document.querySelector('.nastro-traccia')).animationPlayState,
        galleria: getComputedStyle(document.querySelector('#galleria-traccia')).animationPlayState,
        videoNonPausati: [...document.querySelectorAll('video[data-video]')].filter(v => !v.paused).length,
      })`);
      assert.equal(dopo.pressed, 'true');
      assert.equal(dopo.classe, true);
      assert.equal(dopo.sessione, '1');
      assert.equal(dopo.nastro, 'paused', 'il nastro CSS non si ferma');
      assert.equal(dopo.galleria, 'paused', 'la galleria CSS non si ferma');
      assert.equal(dopo.videoNonPausati, 0, 'video ancora in riproduzione');

      await p.valuta(`window.__contaFrame = 0`);
      await attesa(1000);
      const framePausa = await p.valuta('window.__contaFrame');
      assert.equal(framePausa, 0, `canvas ancora in disegno in pausa: ${framePausa} frame/s`);

      // Cookie: la pausa non ne deve creare
      const cookie = await p.send('Network.getCookies', { urls: [BASE + '/'] });
      assert.deepEqual(cookie.cookies, [], 'cookie impostati');
      assert.equal(await p.valuta('document.cookie'), '');

      // Persistenza: ricaricando la pagina nella stessa sessione resta in pausa
      await p.vai(BASE + '/');
      await attesa(500);
      const ricarico = await p.valuta(`({ pressed: document.querySelector('#pausa-animazioni').getAttribute('aria-pressed'), classe: document.documentElement.classList.contains('animazioni-ferme') })`);
      assert.equal(ricarico.pressed, 'true', 'la pausa non e\' stata ricordata dopo il ricaricamento');
      assert.equal(ricarico.classe, true);

      // Riattiva
      await p.valuta(`document.querySelector('#pausa-animazioni').click()`);
      await attesa(600);
      const riatt = await p.valuta(`({
        pressed: document.querySelector('#pausa-animazioni').getAttribute('aria-pressed'),
        classe: document.documentElement.classList.contains('animazioni-ferme'),
        sessione: sessionStorage.getItem('macellaio-pausa'),
        nastro: getComputedStyle(document.querySelector('.nastro-traccia')).animationPlayState,
        videoInVista: [...document.querySelectorAll('video[data-video]')].filter(v => { const r = v.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && !v.paused; }).length,
      })`);
      assert.equal(riatt.pressed, 'false');
      assert.equal(riatt.classe, false);
      assert.equal(riatt.sessione, '0');
      assert.equal(riatt.nastro, 'running');
      await p.valuta(`window.__contaFrame = 0`);
      await attesa(1000);
      assert.ok((await p.valuta('window.__contaFrame')) > 20, 'canvas non ripartiti dopo la riattivazione');
      assert.ok(riatt.videoInVista >= 1, 'il video della brace non riparte dopo la riattivazione');
      const errori = [...new Set(p.errori)];
      assert.deepEqual(errori, [], 'errori durante la pausa');
    } finally { await p.chiudi(); }
  });

  it('tastiera: Tab raggiunge il pulsante di pausa, Invio lo attiva e il focus resta visibile', async () => {
    const p = await apri('/', MOBILE);
    try {
      await p.valuta(`document.activeElement && document.activeElement.blur(); window.scrollTo({ top: 0, behavior: 'instant' })`);
      let raggiunto = false;
      for (let i = 0; i < 25 && !raggiunto; i++) {
        await p.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
        await p.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
        await attesa(60);
        raggiunto = await p.valuta(`document.activeElement && document.activeElement.id === 'pausa-animazioni'`);
      }
      assert.equal(raggiunto, true, 'Tab non raggiunge il pulsante di pausa');
      const contorno = await p.valuta(`getComputedStyle(document.activeElement).outlineStyle`);
      assert.equal(contorno, 'solid', 'focus senza contorno visibile');
      await p.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
      await p.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
      await attesa(300);
      assert.equal(await p.valuta(`document.querySelector('#pausa-animazioni').getAttribute('aria-pressed')`), 'true', 'Invio non attiva la pausa');
      await p.valuta(`document.querySelector('#pausa-animazioni').click()`);
    } finally { await p.chiudi(); }
  });

  it('aria: il nome del pulsante non cambia con lo stato (aria-pressed lo dice), altrimenti e\' ambiguo', async () => {
    const p = await apri('/', MOBILE);
    try {
      const prima = await p.valuta(`document.querySelector('#pausa-animazioni').getAttribute('aria-label')`);
      await p.valuta(`document.querySelector('#pausa-animazioni').click()`);
      await attesa(200);
      const dopo = await p.valuta(`document.querySelector('#pausa-animazioni').getAttribute('aria-label')`);
      await p.valuta(`document.querySelector('#pausa-animazioni').click()`);
      assert.equal(dopo, prima, `nome cambia con lo stato: "${prima}" -> "${dopo}", con aria-pressed=true il nome dice ancora "Metti in pausa"`);
    } finally { await p.chiudi(); }
  });

  it('con "riduci movimento" il pulsante di pausa non compare', async () => {
    const p = await apri('/', { ...MOBILE, movimentoRidotto: true });
    try {
      const d = await p.valuta(`getComputedStyle(document.querySelector('#pausa-animazioni')).display`);
      assert.equal(d, 'none');
    } finally { await p.chiudi(); }
  });
});

describe('Escape del testo (home e menu)', () => {
  for (const [url, vp] of [['/', MOBILE], ['/', { larghezza: 1300, altezza: 900, mobile: false }], ['/menu/', MOBILE]]) {
    it(`nessuna entita' HTML visibile o negli attributi: ${url} ${vp.larghezza}px`, async () => {
      const p = await apri(url, vp);
      try {
        await p.scorriTutto();
        const r = await p.valuta(`(() => {
          const ent = /&(#\\d+|#x[0-9a-f]+|amp|lt|gt|quot|apos);/i;
          const testi = [...document.querySelectorAll('body *')].filter(e => e.children.length === 0 && ent.test(e.textContent)).map(e => e.tagName + ': ' + e.textContent.trim().slice(0, 80));
          const attr = [];
          for (const e of document.querySelectorAll('[alt],[aria-label],[title],[href],[src]')) for (const a of ['alt', 'aria-label', 'title']) { const v = e.getAttribute(a); if (v && ent.test(v)) attr.push(e.tagName + '[' + a + ']: ' + v.slice(0, 80)); }
          return { testi, attr, innerText: document.body.innerText, macelleria: document.body.innerText.includes('Macelleria & Braceria') };
        })()`);
        assert.deepEqual(r.testi, [], 'entita\' visibili nel testo: ' + r.testi.join(' | '));
        assert.deepEqual(r.attr, [], 'entita\' negli attributi: ' + r.attr.join(' | '));
        if (url === '/') assert.equal(r.macelleria, true, '"&" non compare correttamente nel piede');
      } finally { await p.chiudi(); }
    });
  }

  it('apostrofi e virgolette corretti nelle carni (credito e razze)', async () => {
    const p = await apri('/', { larghezza: 1300, altezza: 900, mobile: false });
    try {
      await p.scorriTutto();
      await p.valuta(`document.querySelector('[data-filtro="irlanda"]').click()`);
      await attesa(400);
      const r = await p.valuta(`({
        catalogo: document.querySelector('#razze-catalogo-elenco').textContent,
        credito: [...document.querySelectorAll('.razza-credito')].map(c => c.textContent.trim()).join(' | ')
      })`);
      assert.ok(r.catalogo.includes("Blonde d'Aquitaine"), 'apostrofo di Blonde d\'Aquitaine non corretto');
      assert.ok(/Chun's Pictures/.test(r.credito), 'credito Chun\'s Pictures non corretto: ' + r.credito);
    } finally { await p.chiudi(); }
  });
});
