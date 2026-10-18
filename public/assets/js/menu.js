/*
 * Il menu. Finché MENU è vuoto, il sito mostra "Il menu arriva a giorni" e invita a prenotare.
 *
 * Ogni sezione ha un titolo, una nota facoltativa e i piatti.
 * Ogni piatto: nome, descrizione (facoltativa), prezzo (testo libero: '18 €', '6 € / hg'),
 * e tag facoltativi tra: 'pietra', 'brace', 'fumo', 'burro', 'frollata', 'novita'.
 *
 * Esempio:
 *
 * window.MENU = [
 *   {
 *     titolo: 'Dal banco',
 *     nota: 'Scegli il taglio, lo pesiamo davanti a te.',
 *     piatti: [
 *       { nome: 'Costata', descrizione: 'Frollata, con osso', prezzo: '6 € / hg', tag: ['pietra', 'burro'] },
 *     ],
 *   },
 * ];
 */
window.MENU = [];
