/*
 * Il menu: lo usano la pagina /menu/ (quella del QR code) e la sezione "Il menu" della home.
 *
 * Ogni sezione: id (per i link), titolo, sottotitolo, nota e foto facoltativi, piatti.
 * Ogni piatto: nome, descrizione facoltativa, prezzo (numero, in euro), unita facoltativa ('kg').
 * Le sezioni con frollatura: true mostrano i piatti come le tappe della frollatura (giorni: 30…).
 * allergeni: quelli del Reg. UE 1169/2011 (glutine, crostacei, uova, pesce, arachidi, soia, latte, frutta a guscio,
 * sedano, senape, sesamo, solfiti, lupini, molluschi) ricavati dagli ingredienti dichiarati ([] = nessuno dei 14).
 * Se un piatto non ha il campo, gli ingredienti non sono noti e il menu non dice nulla: va chiesto al personale.
 * DA FAR CONFERMARE AL LOCALE, che ne è responsabile per legge.
 */
window.MENU_INFO = {
  coperto: 2,
  contorni: ['Insalata', 'Rucola', 'Pomodoro', 'Formaggio', 'Patatine', 'Verdure grigliate'],
  fuoriMenu: 'Sono disponibili anche carni fuori menù: chiedi al macellaio.',
  allergeni: 'Allergeni indicati in base agli ingredienti dei piatti. Possibili tracce per contaminazione (friggitrice, piastra, banco): per allergie e intolleranze chiedi sempre al personale prima di ordinare.',
  motto: 'Qualità, passione e sapori autentici.',
};

window.MENU = [
  {
    id: 'antipasti',
    titolo: 'Antipasti',
    foto: 'assets/img/foto/tagliere-salumi-formaggi.jpg',
    piatti: [
      { nome: 'Antipasto di salumi "Il Macellaio"', prezzo: 20 },
      { nome: 'Patatine fritte', descrizione: 'Patate fresche, tagliate al momento', prezzo: 4, allergeni: [] },
      { nome: 'Aggiunta di contorni', prezzo: 1 },
      { nome: 'Polpettine fritte di vitello', prezzo: 10 },
      { nome: 'Mix di bruschette', descrizione: 'Pane e caciocavallo affumicato', prezzo: 6, allergeni: ['glutine', 'latte'] },
    ],
  },
  {
    id: 'panini',
    titolo: 'Panini',
    nota: 'Tutti i panini includono 3 contorni a scelta e le salse. Il formaggio aggiunge latte; per le salse chiedi al personale.',
    contorni: true,
    piatti: [
      { nome: 'Hamburger artigianale', descrizione: 'Carne, sale e pepe', prezzo: 8, allergeni: ['glutine'] },
      { nome: 'Salsiccia artigianale', descrizione: 'Carne di suino, sale e pepe', prezzo: 7, allergeni: ['glutine'] },
      { nome: 'Cotechino artigianale', descrizione: 'Carne di suino, cotenna, sale, pepe, paprika, peperoncino e aglio', prezzo: 7, allergeni: ['glutine'] },
      { nome: 'Fettina di vitello', prezzo: 8 },
      { nome: 'Cotoletta di pollo', descrizione: 'Impanata: pollo, uova e pangrattato', prezzo: 8, allergeni: ['glutine', 'uova'] },
      { nome: 'Porchetta', prezzo: 8 },
    ],
  },
  {
    id: 'piatti',
    titolo: 'Piatti',
    foto: 'assets/img/foto/grigliata-mista-piatto.jpg',
    piatti: [
      { nome: 'Spiedini di carne', descrizione: '3 pezzi', prezzo: 6 },
      { nome: 'Tartare di scottona', descrizione: 'Carne cruda, sale, pepe e olio extravergine d\'oliva', prezzo: 15, allergeni: [] },
      { nome: 'Straccetti al burro di scottona o marchigiana', descrizione: 'Burro, rucola, pomodorini e scaglie di Grana', prezzo: 20, allergeni: ['latte'] },
      { nome: 'Carpaccio di scottona o marchigiana', descrizione: 'Carne cruda, rucola, pomodorini e scaglie di Grana', prezzo: 15, allergeni: ['latte'] },
      { nome: 'Nuggets di pollo artigianali', descrizione: 'Impanati con uova e pangrattato', prezzo: 6, allergeni: ['glutine', 'uova'] },
      { nome: 'Alette di pollo', prezzo: 6 },
      { nome: 'Salsiccia artigianale', descrizione: 'Carne di suino, sale e pepe. Con 3 contorni a scelta e le salse', prezzo: 8, allergeni: [] },
      { nome: 'Hamburger artigianale di scottona o marchigiana', descrizione: 'Carne, sale e pepe. 250 g, con 3 contorni a scelta', prezzo: 15, allergeni: [] },
      { nome: 'Mix di carne', descrizione: 'Salsiccia e cotechino artigianali, vitello e pollo, con 1 contorno a scelta', prezzo: 30 },
      { nome: 'Arrosto di maiale', descrizione: '300 g, con 3 contorni a scelta', prezzo: 14 },
      { nome: 'Tagliata di vitello', descrizione: '300 g, con 1 contorno a scelta', prezzo: 20 },
      { nome: 'Piatto di contorni', descrizione: '3 contorni a scelta', prezzo: 5 },
    ],
  },
  {
    id: 'frollati',
    titolo: 'Arrosti frollati',
    foto: 'assets/img/foto/costata-dry-aged-primo-piano.jpg',
    sottotitolo: 'Prezzo al chilo',
    nota: 'Più giorni, più tenerezza e sapore. Il taglio lo scegli al banco.',
    frollatura: true,
    piatti: [
      { nome: '30 giorni di frollatura', giorni: 30, prezzo: 49.99, unita: 'kg' },
      { nome: '60 giorni di frollatura', giorni: 60, prezzo: 59.99, unita: 'kg' },
      { nome: '90 giorni di frollatura', giorni: 90, prezzo: 69.99, unita: 'kg' },
      { nome: '120 giorni di frollatura', giorni: 120, prezzo: 79.99, unita: 'kg' },
    ],
  },
  {
    id: 'dolci',
    titolo: 'Dolci',
    piatti: [
      { nome: 'Tiramisù', descrizione: 'Fatto al momento: mascarpone, caffè, savoiardi, uova e cacao', prezzo: 5, allergeni: ['glutine', 'uova', 'latte'] },
    ],
  },
  {
    id: 'bevande',
    titolo: 'Bevande',
    piatti: [
      { nome: 'Acqua naturale o frizzante', prezzo: 1, allergeni: [] },
      { nome: 'Acqua grande naturale o frizzante', prezzo: 2, allergeni: [] },
      { nome: 'Coca-Cola o Coca-Cola Zero', descrizione: 'In lattina', prezzo: 2.5, allergeni: [] },
      { nome: 'Coca-Cola in vetro', prezzo: 3.5, allergeni: [] },
      { nome: 'Fanta', prezzo: 2.5, allergeni: [] },
      { nome: 'Tè pesca o limone', prezzo: 2.5, allergeni: [] },
    ],
  },
  {
    id: 'birre',
    titolo: 'Birre',
    piatti: [
      { nome: 'Nastro Azzurro', prezzo: 2.5, allergeni: ['glutine'] },
      { nome: 'Heineken', prezzo: 2.5, allergeni: ['glutine'] },
      { nome: 'Tennent\'s', prezzo: 3.5, allergeni: ['glutine'] },
      { nome: 'Bjørne', prezzo: 3, allergeni: ['glutine'] },
      { nome: 'Corona', prezzo: 3.5, allergeni: ['glutine'] },
    ],
  },
  {
    id: 'vini',
    titolo: 'Vini',
    sottotitolo: 'Prezzo a bottiglia',
    piatti: [
      { nome: 'Aglianico', prezzo: 20, allergeni: ['solfiti'] },
      { nome: 'Barbera', prezzo: 25, allergeni: ['solfiti'] },
      { nome: 'Falanghina', prezzo: 20, allergeni: ['solfiti'] },
      { nome: 'Primitivo', prezzo: 25, allergeni: ['solfiti'] },
      { nome: 'Aglianico Janare', prezzo: 25, allergeni: ['solfiti'] },
    ],
  },
  {
    id: 'caffe',
    titolo: 'Caffè e amari',
    piatti: [
      { nome: 'Caffè', prezzo: 1, allergeni: [] },
      { nome: 'Amari', prezzo: 2.5 },
    ],
  },
];

// Prezzo in formato italiano: 20 → "20 €", 49.99 → "49,99 €", con unità "49,99 €/kg".
window.prezzoMenu = function (p) {
  var n = p.prezzo.toLocaleString('it-IT', { minimumFractionDigits: p.prezzo % 1 ? 2 : 0, maximumFractionDigits: 2 });
  return n + ' €' + (p.unita ? '/' + p.unita : '');
};
