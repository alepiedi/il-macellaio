/*
 * Il menu: lo usano la pagina /menu/ (quella del QR code) e la sezione "Il menu" della home.
 *
 * Ogni sezione: id (per i link), titolo, sottotitolo e nota facoltativi, piatti.
 * Ogni piatto: nome, descrizione facoltativa, prezzo (numero, in euro), unita facoltativa ('kg').
 * Le sezioni con frollatura: true mostrano i piatti come le tappe della frollatura (giorni: 30…).
 */
window.MENU_INFO = {
  coperto: 2,
  contorni: ['Insalata', 'Rucola', 'Pomodoro', 'Formaggio', 'Patatine', 'Verdure grigliate'],
  fuoriMenu: 'Sono disponibili anche carni fuori menù: chiedi al macellaio.',
  allergeni: 'Per allergie e intolleranze chiedi al personale: ti diciamo noi gli ingredienti di ogni piatto.',
};

window.MENU = [
  {
    id: 'antipasti',
    titolo: 'Antipasti',
    piatti: [
      { nome: 'Antipasto di salumi "Il Macellaio"', prezzo: 20 },
      { nome: 'Patatine fritte', descrizione: 'Fatte al momento', prezzo: 4 },
      { nome: 'Aggiunta di contorni', prezzo: 1 },
      { nome: 'Polpettine fritte di vitello', prezzo: 10 },
      { nome: 'Mix di bruschette', prezzo: 6 },
    ],
  },
  {
    id: 'panini',
    titolo: 'Panini',
    nota: 'Tutti i panini includono 3 contorni a scelta e le salse.',
    contorni: true,
    piatti: [
      { nome: 'Hamburger', prezzo: 8 },
      { nome: 'Salsiccia', prezzo: 7 },
      { nome: 'Cotechino', prezzo: 7 },
      { nome: 'Fettina di vitello', prezzo: 8 },
      { nome: 'Cotoletta di pollo', prezzo: 8 },
      { nome: 'Porchetta', prezzo: 8 },
    ],
  },
  {
    id: 'piatti',
    titolo: 'Piatti',
    piatti: [
      { nome: 'Spiedini di carne', descrizione: '3 pezzi', prezzo: 6 },
      { nome: 'Tartare di scottona', prezzo: 15 },
      { nome: 'Straccetti di scottona o marchigiana', descrizione: 'Con rucola, pomodorini e grana', prezzo: 20 },
      { nome: 'Carpaccio di scottona o marchigiana', descrizione: 'Con rucola, pomodorini e grana', prezzo: 15 },
      { nome: 'Nuggets di pollo', prezzo: 6 },
      { nome: 'Alette di pollo', prezzo: 6 },
      { nome: 'Salsiccia', descrizione: 'Con 3 contorni a scelta e le salse', prezzo: 8 },
      { nome: 'Hamburger di scottona o marchigiana', descrizione: '250 g, con 3 contorni a scelta', prezzo: 15 },
      { nome: 'Mix di carne', descrizione: 'Salsiccia, cotechino, vitello e pollo, con 1 contorno a scelta', prezzo: 30 },
      { nome: 'Arrosto di maiale', descrizione: '300 g, con 3 contorni a scelta', prezzo: 14 },
      { nome: 'Tagliata di vitello', descrizione: '300 g, con 1 contorno a scelta', prezzo: 20 },
      { nome: 'Piatto di contorni', descrizione: '3 contorni a scelta', prezzo: 5 },
    ],
  },
  {
    id: 'frollati',
    titolo: 'Arrosti frollati',
    sottotitolo: 'Prezzo al chilo',
    nota: 'Più giorni di frollatura, più tenerezza e un sapore più profondo. Scegli il taglio al banco e lo pesiamo davanti a te.',
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
      { nome: 'Tiramisù', descrizione: 'Fatto al momento', prezzo: 5 },
    ],
  },
];

// Prezzo in formato italiano: 20 → "20 €", 49.99 → "49,99 €", con unità "49,99 €/kg".
window.prezzoMenu = function (p) {
  var n = p.prezzo.toLocaleString('it-IT', { minimumFractionDigits: p.prezzo % 1 ? 2 : 0, maximumFractionDigits: 2 });
  return n + ' €' + (p.unita ? '/' + p.unita : '');
};
