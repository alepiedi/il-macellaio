/*
 * Dati del locale. Si modifica solo questo file (e menu.js per il menu).
 * Un campo vuoto ('' o []) nasconde da solo la parte del sito che lo usa.
 */
window.SITO = {
  nome: 'Il Macellaio',
  sottotitolo: 'Macelleria & Braceria',
  titolare: 'Milad',

  indirizzo: {
    via: 'Via Napoli, 149',
    cap: '82100',
    citta: 'Benevento',
    // Link "Indicazioni": va bene anche quello copiato dalla scheda Google del locale.
    maps: 'https://www.google.com/maps/search/?api=1&query=Il+Macellaio+Via+Napoli+149+Benevento',
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
    recensioni: 140,
    link: '',
  },

  // Orari settimanali (giorno: 0 = domenica … 6 = sabato). Un giorno senza fasce è chiuso.
  // La mezzanotte di fine giornata si scrive '24:00'. Da qui il sito calcola "Aperto ora".
  orari: [
    { giorno: 1, fasce: [['08:30', '13:00'], ['16:00', '23:30']] },
    { giorno: 2, fasce: [] },
    { giorno: 3, fasce: [['08:30', '13:00'], ['16:00', '23:30']] },
    { giorno: 4, fasce: [['08:00', '13:00'], ['16:00', '23:30']] },
    { giorno: 5, fasce: [['08:30', '13:00'], ['16:00', '23:30']] },
    { giorno: 6, fasce: [['08:00', '13:30'], ['16:00', '24:00']] },
    { giorno: 0, fasce: [['18:30', '23:30']] },
  ],

  // Galleria "Dal banco al piatto": foto (src) o video (video + poster), in assets/img/foto e assets/video.
  // Finché è vuota la galleria non compare.
  foto: [
    { src: 'assets/img/foto/bistecche-fiamme-brace.jpg', alt: 'Due bistecche alte tra le fiamme della brace' },
    { src: 'assets/img/foto/tartare-rucola-piatto.jpg', alt: 'Torrette di tartare su rucola, servite sul tagliere' },
    { video: 'assets/video/costate.mp4', poster: 'assets/video/costate.jpg', alt: 'Costate che sfrigolano sulla griglia' },
    { src: 'assets/img/foto/grigliata-mista-piatto.jpg', alt: 'Grigliata mista di tagli servita nel piatto' },
    { src: 'assets/img/foto/fiorentine-rubia-gallega.jpg', alt: 'Fiorentine di Rubia Gallega con il cartellino' },
    { src: 'assets/img/foto/tagliere-salumi-formaggi.jpg', alt: 'Tagliere di salumi, formaggi e pomodorini' },
    { video: 'assets/video/flambe.mp4', poster: 'assets/video/flambe.jpg', alt: "L'arrosto flambé, poi tagliato e servito" },
    { src: 'assets/img/foto/involtini-pistacchio-piatto.jpg', alt: 'Involtini con granella di pistacchio su ardesia' },
    { src: 'assets/img/foto/bistecche-tagliere-legno.jpg', alt: 'Due bistecche crude su un tagliere di legno' },
    { src: 'assets/img/foto/mugliatelli-brace-patate.jpg', alt: 'Mugliatelli alla brace con patate croccanti' },
  ],

  // Mostra il nastro "Anteprima" in basso: mettere false quando il sito va online.
  anteprima: false,

  piva: '',
  url: 'https://ilmacellaiobn.it',
};
