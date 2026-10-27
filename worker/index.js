// Il sito è fatto di file statici (public/). Il Worker serve a:
// - rimandare http e www.ilmacellaiobn.it a https://ilmacellaiobn.it;
// - aggiungere gli header di sicurezza e di cache;
// - tenere l'indirizzo workers.dev (solo prove) fuori da Google.
// Nessun cookie e nessun tracciamento: il Worker non ne imposta.
const DOMINIO = 'ilmacellaiobn.it'

// Il sito carica solo file propri (font, immagini, video, script). Gli script e gli stili
// "inline" ci sono (classe `js` sull'html, stili sugli svg): finché stanno nell'html servono
// 'unsafe-inline'. Niente terze parti: i link a WhatsApp, Instagram e Maps sono solo link.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ')

const SICUREZZA = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
}

// I file in assets/ non hanno l'hash nel nome, quindi mai "immutable": font e media cambiano
// di rado (giorni), css e js si riconvalidano ogni volta (ETag, risposta 304 leggera).
function cache(pathname, tipo) {
  if (pathname === '/robots.txt' || pathname === '/sitemap.xml') return 'public, max-age=3600'
  if (/\.(woff2|mp4|jpg|jpeg|png|webp|avif|svg)$/i.test(pathname)) {
    return /\.woff2$/i.test(pathname) ? 'public, max-age=2592000' : 'public, max-age=604800, stale-while-revalidate=86400'
  }
  if (/\.(css|js)$/i.test(pathname) || tipo.includes('html')) return 'public, max-age=0, must-revalidate'
  return null
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const suDominio = url.hostname === DOMINIO || url.hostname === 'www.' + DOMINIO

    // Un solo indirizzo canonico: https, senza www.
    if (suDominio && (url.hostname !== DOMINIO || url.protocol !== 'https:')) {
      return Response.redirect(`https://${DOMINIO}${url.pathname}${url.search}`, 301)
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Metodo non consentito', { status: 405, headers: { Allow: 'GET, HEAD' } })
    }

    // Su workers.dev (e altri host di prova) niente indicizzazione: il sito vero è ilmacellaiobn.it.
    if (!suDominio && url.pathname === '/robots.txt') {
      return new Response('User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    }

    const risposta = await env.ASSETS.fetch(request)
    // Le risposte degli asset sono immutabili: se ne fa una copia per cambiare gli header.
    const res = new Response(risposta.body, risposta)
    const tipo = res.headers.get('Content-Type') || ''

    for (const [nome, valore] of Object.entries(SICUREZZA)) res.headers.set(nome, valore)
    if (tipo.includes('html')) res.headers.set('Content-Security-Policy', CSP)
    if (suDominio) res.headers.set('Strict-Transport-Security', 'max-age=31536000')
    else res.headers.set('X-Robots-Tag', 'noindex, nofollow')

    // La 404 e i redirect non si tengono in cache come se fossero pagine buone.
    const controllo = res.status === 200 ? cache(url.pathname, tipo) : null
    if (controllo) res.headers.set('Cache-Control', controllo)
    else if (res.status >= 400) res.headers.set('Cache-Control', 'no-store')

    return res
  },
}
