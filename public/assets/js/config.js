/*
 * Dati del locale. Si modifica solo questo file (e menu.js per il menu).
 * Un campo vuoto ('' o []) nasconde da solo la parte del sito che lo usa.
 */
window.SITO = {
  nome: 'Il Macellaio',
  sottotitolo: 'Macelleria & Braceria',
  titolare: 'Milad',

  indirizzo: {
    via: 'Via Napoli, 118',
    cap: '82100',
    citta: 'Benevento',
    // Link "Indicazioni": va bene anche quello copiato dalla scheda Google del locale.
    maps: 'https://www.google.com/maps/search/?api=1&query=Il+Macellaio+Via+Napoli+118+Benevento',
  },

  contatti: {
    telefono: '+39 340 829 0489',
    // Solo cifre, con il prefisso 39: serve per aprire WhatsApp con la prenotazione già scritta.
    whatsapp: '393408290489',
    email: '',
  },

  social: {
    instagram: 'https://www.instagram.com/ilmacellaiobenevento/',
    facebook: 'https://www.facebook.com/profile.php?id=100069883992315',
    tiktok: '',
  },

  // Voto e numero di recensioni della scheda Google. link: "Scrivi una recensione" o la scheda.
  google: {
    voto: 5.0,
    recensioni: 45,
    link: '',
  },

  // Esempio: [{ giorni: 'Martedì – Domenica', ore: '19:30 – 23:30' }, { giorni: 'Lunedì', ore: 'Chiuso' }]
  orari: [],

  // Foto per la galleria (assets/img/foto/...). Finché è vuota la galleria non compare.
  // Esempio: [{ src: 'assets/img/foto/costata.jpg', alt: 'Costata sulla pietra lavica' }]
  foto: [],

  // Mostra il nastro "Anteprima" in basso: mettere false quando il sito va online.
  anteprima: true,

  piva: '',
  url: '',
};
