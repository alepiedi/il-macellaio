# Il Macellaio · Benevento

Il sito di **Il Macellaio**, macelleria e braceria in Via Napoli 149 a Benevento: nato come macelleria, oggi cuoce la carne davanti al cliente con tre cotture (pietra lavica, brace, affumicatura dal vivo) e il burro affumicato.

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
| 07 | **Macelleria** | La carne da portare a casa, con le foto di Milad con i calciatori del Benevento e con Jey Lillo |
| 08 | **Prenota** | Modulo che apre WhatsApp con la prenotazione già scritta: nessun dato passa dal sito |
| 09 | **Dove** | Indirizzo, orari della settimana, indicazioni, chiamata |

## 📸 Foto e video

Presi dal profilo Instagram del locale (elenco e link dei post in `media/instagram/elenco.md`). Gli originali stanno in `media/instagram/` e non vanno online; le versioni per il web sono in `public/assets/img/foto/` (lato lungo 1100 px) e `public/assets/video/` (H.264 senza audio, con l'immagine d'anteprima `.jpg`). Il video della brace fa da sfondo all'apertura (sul telefono a tutto schermo, al posto del WebGL), quello del burro sta nella sezione del burro, gli altri nella galleria "Dal banco al piatto" (`config.foto`). I video partono solo quando sono sullo schermo.

## 🌍 Le carni dal mondo

`public/assets/js/carni.js`: fornitore, paesi (con le coordinate) e razze, con testi riscritti dal catalogo MFC Carni 2025. `banco: true` segna le razze viste al banco, che compaiono per prime con la loro foto. Se si aggiunge un paese, si rigenera la mappa: `cd tools/mappa && npm install && node genera.mjs`.

### Foto delle razze

Ci sono tutte le selezioni del catalogo MFC 2025 (37 schede) e, in fondo, le 23 razze della pagina "Le nostre razze". Le razze viste al banco (Rubia Gallega, Simmental, Mooi Mooi), "Scottona e Marchigiana" e alcune altre schede usano foto del locale. Le altre sono **foto indicative di tagli e arrosti** (niente animali al pascolo) con licenza libera (Flickr tramite Openverse), in `public/assets/img/carni/` (800 × 600). Il credito (autore, licenza, link) compare sopra ogni foto ed è obbligatorio: se si cambia una foto, va aggiornato `credito` in `carni.js`.

| Razza | Autore | Licenza | Fonte |
|---|---|---|---|
| Manzetta Slava | stu_spivack | CC BY-SA 2.0 | [fonte](https://www.flickr.com/photos/35034346243@N01/315486127) |
| Angus Iberico | ccnull.de Bilddatenbank | CC BY 2.0 | [fonte](https://www.flickr.com/photos/115225894@N07/53655649994) |
| Wadï Wagyu | avlxyz | CC BY-SA 2.0 | [fonte](https://www.flickr.com/photos/10559879@N00/4734585163) |
| Cachena | fortes | CC BY-SA 2.0 | [fonte](https://www.flickr.com/photos/44124371264@N01/2941165667) |
| Umami Olive Fed Wagyu | roland | CC BY 2.0 | [fonte](https://www.flickr.com/photos/35034347371@N01/2457565643) |
| Celtic Legend | debbietingzon | CC BY 2.0 | [fonte](https://www.flickr.com/photos/32031278@N03/34480385451) |
| Swami Wagyu | C John Thompson | CC BY-SA 2.0 | [fonte](https://www.flickr.com/photos/71266843@N03/6650434889) |
| Black Angus USA | ccnull.de Bilddatenbank | CC BY 2.0 | [fonte](https://www.flickr.com/photos/115225894@N07/53504502845) |
| Wakan Wagyu | agcaddesigns.com Architectural Renderings | CC BY 2.0 | [fonte](https://www.flickr.com/photos/50516423@N03/26269780187) |
| Angus Australiano | ccnull.de Bilddatenbank | CC BY 2.0 | [fonte](https://www.flickr.com/photos/115225894@N07/53504503200) |
| Black Tasman | tookthescenicroute | CC BY 2.0 | [fonte](https://www.flickr.com/photos/51035646419@N01/391648530) |
| UMI | jlastras | CC BY 2.0 | [fonte](https://www.flickr.com/photos/22662305@N04/3476354151) |
| Arita Wagyu | loustejskal.com | CC BY 2.0 | [fonte](https://www.flickr.com/photos/63311602@N08/41529486025) |
| Black Buffalo | firsttubedotcom | CC BY 2.0 | [fonte](https://www.flickr.com/photos/14507113@N04/2561665090) |
| Suino Nero Casertano | Oishi Kuranosuke | CC BY 2.0 | [fonte](https://www.flickr.com/photos/34349999@N00/47106224) |
| Angus de la Finca | goodiesfirst | CC BY 2.0 | [fonte](https://www.flickr.com/photos/49215102@N00/9406298072) |
| Pezzata Rossa | InfoMofo | CC BY-SA 2.0 | [fonte](https://www.flickr.com/photos/40689227@N00/29011721760) |
| Swami Beef | adactio | CC BY 2.0 | [fonte](https://www.flickr.com/photos/74105777@N00/6861698773) |
| Le Moire | thepinkpeppercorn | CC BY 2.0 | [fonte](https://www.flickr.com/photos/33904751@N04/5171006652) |
| Kobegal | Bo&Ko | CC BY-SA 2.0 | [fonte](https://www.flickr.com/photos/78419861@N00/8524840959) |
| Hereford irlandese | Chun's Pictures | CC BY 2.0 | [fonte](https://www.flickr.com/photos/23203692@N03/12003757485) |
| Manzo scozzese | Steve A Johnson | CC BY 2.0 | [fonte](https://www.flickr.com/photos/14529257@N03/4667971258) |
| Suino italiano | StuartWebster | CC BY 2.0 | [fonte](https://www.flickr.com/photos/34883952@N02/5829527553) |
| Grill Steakhouse | L.A. Foodie | CC BY 2.0 | [fonte](https://www.flickr.com/photos/67839741@N06/12786405153) |
| Manzo argentino | Claudia_midori | CC BY 2.0 | [fonte](https://www.flickr.com/photos/8220615@N05/3357745833) |
| Vitello olandese | stu_spivack | CC BY-SA 2.0 | [fonte](https://www.flickr.com/photos/35034346243@N01/2574517512) |
| Agnello | StuartWebster | CC BY 2.0 | [fonte](https://www.flickr.com/photos/34883952@N02/4853535661) |

## 🕒 Orari

In `config.js` (`orari`), giorno per giorno con le fasce. Il sito li mostra nella sezione "Dove siamo" (con il giorno di oggi in evidenza), calcola "Aperto ora / Chiuso ora · riapre…" con l'ora italiana (apertura, "Dove siamo" e fondo del menu) e blocca le prenotazioni nei giorni di chiusura. Gli stessi orari sono anche nei dati strutturati per Google (`openingHoursSpecification` in `index.html`): se cambiano, vanno aggiornati in tutti e due i posti. Il mercoledì su Google risultava "aperto 24 ore": è stato messo come lunedì e venerdì.

## 🔳 QR code del menu (`stampa/qr-menu/`)

- `qr-menu.svg` e `qr-menu.png`: il QR da solo (correzione d'errore Q), punta a `https://ilmacellaiobn.it/menu/`.
- `cartoncino-A6.pdf`: il cartoncino da tavolo (10,5 × 14,8 cm).
- `cartoncino-A6-tipografia-abbondanza-3mm.pdf`: lo stesso con 3 mm di abbondanza per lato, da dare alla tipografia.
- `cartoncini-A4-4-per-foglio.pdf`: quattro cartoncini su un A4, da stampare in casa e tagliare sulle linee.

Se il menu cambia indirizzo, il QR va rigenerato e ristampato: `/menu/` non va mai spostato.

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

## Pubblicazione: ilmacellaiobn.it

Il dominio è comprato su **Aruba**; il sito gira su **Cloudflare Workers** (gratis), come alessandropiedimonte.it.

1. **Cloudflare → Add a domain** → `ilmacellaiobn.it` → piano Free. Cloudflare dà due *name server*.
2. **Aruba → Area clienti → Gestione domini → ilmacellaiobn.it → Name server / DNS → Modifica**: si mettono i due name server di Cloudflare al posto di quelli di Aruba. Il cambio può richiedere da qualche ora a 24-48 ore; Cloudflare manda un'email quando il dominio è attivo.
3. **Cloudflare → Workers & Pages → Create → Import a repository** → `alepiedi/il-macellaio`, branch di produzione `main`, build command vuoto, deploy command `npx wrangler deploy`.
4. A ogni pubblicazione `wrangler.jsonc` collega da solo `ilmacellaiobn.it` e `www.ilmacellaiobn.it` (HTTPS automatico). `www` rimanda al dominio senza `www`. L'indirizzo `*.workers.dev` resta attivo per le prove.

`canonical`, `og:url`, `og:image`, `sitemap.xml` e i dati strutturati puntano già a `https://ilmacellaiobn.it`.

Per provarlo in locale basta un server statico: `npx http-server public`.

**Il QR code dei tavoli punta a `https://ilmacellaiobn.it/menu/`: non stampare i cartoncini finché quell'indirizzo non si apre davvero.** L'anteprima su alessandropiedimonte.dev/clienti/il-macellaio/ resta come copia di lavoro.
