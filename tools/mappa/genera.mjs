import fs from 'fs';
import { feature } from 'topojson-client';
import { geoNaturalEarth1, geoContains } from 'd3-geo';
const topo = JSON.parse(fs.readFileSync(new URL('node_modules/world-atlas/land-50m.json', import.meta.url).pathname));
const terra = feature(topo, topo.objects.land);
const W = 1000, H = 470;
// Mondo tagliato tra -56° e 76° di latitudine, Antartide esclusa.
const proj = geoNaturalEarth1().fitExtent([[6, 6], [W - 6, H - 6]], { type: 'MultiPoint', coordinates: [[-170, 76], [180, -56], [-170, -56], [180, 76]] });
const passo = 7.2;
let d = '', n = 0;
for (let y = passo / 2; y < H; y += passo) {
  for (let x = passo / 2; x < W; x += passo) {
    const p = proj.invert([x, y]);
    if (!p || p[1] < -56 || p[1] > 80) continue;
    if (geoContains(terra, p)) { d += `M${x.toFixed(1)} ${y.toFixed(1)}h0`; n++; }
  }
}
// Puntini fitti per lo zoom sull'Europa.
const passoE = 1.9, E = [400, 34, 620, 140];
let de = '', ne = 0;
for (let y = E[1] + passoE / 2; y < E[3]; y += passoE) {
  for (let x = E[0] + passoE / 2; x < E[2]; x += passoE) {
    const p = proj.invert([x, y]);
    if (p && geoContains(terra, p)) { de += `M${x.toFixed(1)} ${y.toFixed(1)}h0`; ne++; }
  }
}
global.window = {};
await import(new URL('../../public/assets/js/carni.js', import.meta.url).pathname);
const punti = {};
for (const p of window.CARNI.paesi) { const [x, y] = proj([p.lon, p.lat]); punti[p.id] = [+x.toFixed(1), +y.toFixed(1)]; }
const out = `/* Generato da tools/mappa/genera.mjs: puntini delle terre emerse (Natural Earth, proiezione Natural Earth) e posizione dei paesi. Non modificare a mano. */\nwindow.MAPPA = ${JSON.stringify({ w: W, h: H, passo, d, de, punti })};\n`;
fs.writeFileSync(new URL('../../public/assets/js/mappa.js', import.meta.url).pathname, out);
console.log('puntini', n, 'europa', ne, 'byte', out.length, punti);
