# Il Macellaio · Benevento

Il sito di **Il Macellaio**, macelleria e braceria in Via Napoli 118 a Benevento: nato come macelleria, oggi cuoce la carne davanti al cliente con tre cotture (pietra lavica, brace, affumicatura dal vivo) e il burro affumicato.

Niente framework e niente build: HTML, CSS e JavaScript scritti a mano, in `public/`. I font (Fraunces e Manrope, licenza OFL) sono sul sito, non su Google Fonts. Nessun cookie, nessun tracciamento. Rispetta `prefers-reduced-motion` e funziona da tastiera.

## Cosa c'è nella pagina

| # | Sezione | Cosa fa |
|---|---------|---------|
| – | **Apertura** | Brace e fumo in WebGL che seguono il mouse, scintille che salgono, il titolo che "trema" come l'aria sopra il fuoco, timbro rotante |
| 01 | **Storia** | Dalla macelleria alla brace: il testo si accende parola per parola mentre scorri |
| 02 | **Il rito** | I cinque passi (banco, taglio, cottura, burro, servizio) con il disegno che cambia mentre scorri |
| 03 | **Cotture** | Le tre cotture con animazioni: tagliata che sfrigola sulla pietra, carboni accesi, fumo sotto la campana |
| 04 | **Il burro** | La tecnica della cucina giapponese e il burro fuso poi affumicato, con fumo dorato |
| 05 | **Il punto giusto** | Un cursore cambia la cottura della bistecca, dal sangue a ben cotta, con i gradi al cuore |
| 06 | **Tagli** | Mappa del bovino: tocchi una zona e scopri il taglio, la cottura consigliata e il carattere |
| 07 | **Le carni** | "Dal mondo, al banco": mappa a puntini con le rotte dai paesi d'origine fino a Benevento (zoom Mondo/Europa), schede delle razze con le foto di quelle viste al banco. Dati in `carni.js`, mappa in `mappa.js` |
| 08 | **Menu** | Generato da `menu.js`, con il pulsante per la pagina completa |
| – | **Galleria** | Compare solo quando in `config.js` ci sono foto |
| 09 | **Macelleria** | La carne da portare a casa |
| 10 | **Prenota** | Modulo che apre WhatsApp con la prenotazione già scritta: nessun dato passa dal sito |
| 11 | **Dove** | Indirizzo, orari, indicazioni, chiamata |

## 📸 Foto e video

Presi dal profilo Instagram del locale (elenco e link dei post in `media/instagram/elenco.md`). Gli originali stanno in `media/instagram/` e non vanno online; le versioni per il web sono in `public/assets/img/foto/` (lato lungo 1100 px) e `public/assets/video/` (H.264 senza audio, con l'immagine d'anteprima `.jpg`). Il video della brace fa da sfondo all'apertura (sul telefono a tutto schermo, al posto del WebGL), quello del burro sta nella sezione del burro, gli altri nella galleria "Dal banco al piatto" (`config.foto`). I video partono solo quando sono sullo schermo.

## 🌍 Le carni dal mondo

`public/assets/js/carni.js`: fornitore, paesi (con le coordinate) e razze, con testi riscritti dal catalogo MFC Carni 2025. `banco: true` segna le razze viste al banco, che compaiono per prime con la loro foto. Se si aggiunge un paese, si rigenera la mappa: `cd tools/mappa && npm install && node genera.mjs`.

## 🕒 Orari

In `config.js` (`orari`), giorno per giorno con le fasce. Il sito li mostra nella sezione "Dove siamo" (con il giorno di oggi in evidenza), calcola "Aperto ora / Chiuso ora · riapre…" con l'ora italiana (apertura, "Dove siamo" e fondo del menu) e blocca le prenotazioni nei giorni di chiusura. Gli stessi orari sono anche nei dati strutturati per Google (`openingHoursSpecification` in `index.html`): se cambiano, vanno aggiornati in tutti e due i posti. Il mercoledì su Google risultava "aperto 24 ore": è stato messo come lunedì e venerdì.

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
