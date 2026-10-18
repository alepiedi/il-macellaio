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
| 07 | **Menu** | Generato da `menu.js`, con il pulsante per la pagina completa |
| – | **Galleria** | Compare solo quando in `config.js` ci sono foto |
| 08 | **Macelleria** | La carne da portare a casa |
| 09 | **Prenota** | Modulo che apre WhatsApp con la prenotazione già scritta: nessun dato passa dal sito |
| 10 | **Dove** | Indirizzo, orari, indicazioni, chiamata |

## 📋 Pagina del menu (`/menu/`)

La pagina da aprire con il QR code sui tavoli: leggera (niente WebGL), pensata per il telefono. Schede delle sezioni che restano in alto, contorni a scelta, la frollatura da 30 a 120 giorni con le barre che si riempiono, avviso per gli allergeni, pulsanti per chiamare, WhatsApp e prenotare. Il pulsante "Aa" ingrandisce il testo (se lo ricorda il telefono). Si stampa anche pulita, su fondo bianco.

I piatti stanno in `public/assets/js/menu.js` (`MENU` e `MENU_INFO`): basta cambiare lì, e si aggiornano sia la pagina del menu sia la sezione della home.

## ✏️ Da completare

Si modificano solo due file:

- **`public/assets/js/config.js`**: social (Instagram, Facebook), orari, voto Google e link alla scheda, foto, P. IVA, indirizzo del sito. Un campo vuoto nasconde da solo la parte che lo usa.
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
