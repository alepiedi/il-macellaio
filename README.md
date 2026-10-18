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
| 04 | **Il burro** | La tecnica giapponese della cugina e il burro fuso poi affumicato, con fumo dorato |
| 05 | **Il punto giusto** | Un cursore cambia la cottura della bistecca, dal sangue a ben cotta, con i gradi al cuore |
| 06 | **Tagli** | Mappa del bovino: tocchi una zona e scopri il taglio, la cottura consigliata e il carattere |
| 07 | **Menu** | Generato da `menu.js`, con filtri per cottura. Finché è vuoto mostra "il menu arriva a giorni" |
| – | **Galleria** | Compare solo quando in `config.js` ci sono foto |
| 08 | **Macelleria** | La carne da portare a casa |
| 09 | **Prenota** | Modulo che apre WhatsApp con la prenotazione già scritta: nessun dato passa dal sito |
| 10 | **Dove** | Indirizzo, orari, indicazioni, chiamata |

## ✏️ Da completare

Si modificano solo due file:

- **`public/assets/js/config.js`**: social (Instagram, Facebook), orari, voto Google e link alla scheda, foto, P. IVA, indirizzo del sito. Un campo vuoto nasconde da solo la parte che lo usa.
- **`public/assets/js/menu.js`**: il menu (nel file c'è l'esempio del formato).

Da verificare con il locale: telefono e WhatsApp (presi da Tripadvisor), nome del titolare, le tre cotture e i tagli indicati nella mappa.

Le foto vanno in `public/assets/img/foto/` e poi elencate in `config.foto`.

## Pubblicazione

Su Cloudflare Workers (solo file statici, vedi `wrangler.jsonc`):

```
npx wrangler deploy
```

Per provarlo in locale basta un server statico: `npx http-server public`.
