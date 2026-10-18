# Il Macellaio · Benevento

Il sito di **Il Macellaio**, macelleria e braceria in Via Napoli 118 a Benevento: nato come macelleria, oggi cuoce la carne davanti al cliente con tre cotture (pietra lavica, brace, affumicatura dal vivo) e il burro affumicato.

Niente framework e niente build: HTML, CSS e JavaScript scritti a mano, in `public/`. I font (Fraunces e Manrope, licenza OFL) sono sul sito, non su Google Fonts. Nessun cookie, nessun tracciamento. Rispetta `prefers-reduced-motion` e funziona da tastiera.

## Cosa c'è nella pagina

Testi brevi apposta: chi visita non legge, guarda. Una frase per sezione, il resto lo fanno foto, video e animazioni.

| # | Sezione | Cosa fa |
|---|---------|---------|
| – | **Apertura** | Brace e fumo in WebGL che seguono il mouse, il video della brace, scintille, "Aperto ora" in tempo reale |
| 01 | **Storia** | Una frase e tre foto che scorrono a velocità diverse |
| 02 | **Il rito** | Cinque passi con le icone: scegli, tagliamo, cuociamo, il burro, servito |
| 03 | **Cotture** | Brace, affumicatura dal vivo, pietra lavica, ognuna con la sua animazione |
| 04 | **Il burro** | Una frase, le tre fasi e il video del burro fuso sull'arrosto |
| 05 | **Le carni** | "Dal mondo, al banco": mappa a puntini con le rotte fino a Benevento (zoom Mondo/Europa) e schede brevi delle razze. Dati in `carni.js`, mappa in `mappa.js` |
| 06 | **Menu** | Invito alla pagina del menu |
| – | **Galleria** | "Dal banco al piatto": foto e video da Instagram |
| 07 | **Macelleria** | La carne da portare a casa, con la foto dello staff |
| 08 | **Prenota** | Modulo che apre WhatsApp con la prenotazione già scritta: nessun dato passa dal sito |
| 09 | **Dove** | Indirizzo, orari della settimana, indicazioni, chiamata |

## 📸 Foto e video

Presi dal profilo Instagram del locale (elenco e link dei post in `media/instagram/elenco.md`). Gli originali stanno in `media/instagram/` e non vanno online; le versioni per il web sono in `public/assets/img/foto/` (lato lungo 1100 px) e `public/assets/video/` (H.264 senza audio, con l'immagine d'anteprima `.jpg`). Il video della brace fa da sfondo all'apertura (sul telefono a tutto schermo, al posto del WebGL), quello del burro sta nella sezione del burro, gli altri nella galleria "Dal banco al piatto" (`config.foto`). I video partono solo quando sono sullo schermo.

## 🌍 Le carni dal mondo

`public/assets/js/carni.js`: fornitore, paesi (con le coordinate) e razze, con testi riscritti dal catalogo MFC Carni 2025. `banco: true` segna le razze viste al banco, che compaiono per prime con la loro foto. Se si aggiunge un paese, si rigenera la mappa: `cd tools/mappa && npm install && node genera.mjs`.

## 🕒 Orari

In `config.js` (`orari`), giorno per giorno con le fasce. Il sito li mostra nella sezione "Dove siamo" (con il giorno di oggi in evidenza), calcola "Aperto ora / Chiuso ora · riapre…" con l'ora italiana (apertura, "Dove siamo" e fondo del menu) e blocca le prenotazioni nei giorni di chiusura. Gli stessi orari sono anche nei dati strutturati per Google (`openingHoursSpecification` in `index.html`): se cambiano, vanno aggiornati in tutti e due i posti. Il mercoledì su Google risultava "aperto 24 ore": è stato messo come lunedì e venerdì.

## 🔳 QR code del menu (`stampa/qr-menu/`)

- `qr-menu.svg` e `qr-menu.png`: il QR da solo (correzione d'errore Q), punta a `https://alessandropiedimonte.dev/clienti/il-macellaio/menu/`.
- `cartoncino-A6.pdf`: il cartoncino da tavolo (10,5 × 14,8 cm).
- `cartoncino-A6-tipografia-abbondanza-3mm.pdf`: lo stesso con 3 mm di abbondanza per lato, da dare alla tipografia.
- `cartoncini-A4-4-per-foglio.pdf`: quattro cartoncini su un A4, da stampare in casa e tagliare sulle linee.

Se il menu cambia indirizzo (dominio definitivo), il QR va rigenerato e ristampato.

## 📋 Pagina del menu (`/menu/`)

La pagina da aprire con il QR code sui tavoli: leggera (niente WebGL), pensata per il telefono. Schede delle sezioni che restano in alto, contorni a scelta, la frollatura da 30 a 120 giorni con le barre che si riempiono, avviso per gli allergeni, pulsanti per chiamare, WhatsApp e prenotare. Il pulsante "Aa" ingrandisce il testo (se lo ricorda il telefono). Si stampa anche pulita, su fondo bianco.

I piatti stanno in `public/assets/js/menu.js` (`MENU` e `MENU_INFO`): basta cambiare lì, e si aggiornano sia la pagina del menu sia la sezione della home.

## ✏️ Da completare

Si modificano solo due file:

- **`public/assets/js/config.js`**: social, orari, voto Google e link alla scheda, foto, P. IVA, indirizzo del sito. Un campo vuoto nasconde da solo la parte che lo usa.
- **`public/assets/js/menu.js`**: il menu (prezzi, coperto, contorni, avviso allergeni).

Da verificare con il locale: telefono e WhatsApp (presi da Tripadvisor), nome del titolare, le tre cotture e i tagli indicati nella mappa.

Le foto vanno in `public/assets/img/foto/` e poi elencate in `config.foto`.

## Logo

`public/assets/img/logo.svg` (contorno nero, per fondi chiari) e `logo-scuro.svg` (per il sito) sono il logo del locale ridisegnato in vettoriale dall'immagine del profilo Facebook. L'icona (`favicon.svg`) è la "M" del logo. Se il titolare ha il file originale, meglio sostituirli con quello.

## Pubblicazione

Su Cloudflare Workers (solo file statici, vedi `wrangler.jsonc`):

```
npx wrangler deploy
```

Per provarlo in locale basta un server statico: `npx http-server public`.
