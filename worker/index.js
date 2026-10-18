// Il sito è fatto di file statici (public/). Il Worker serve solo a rimandare
// www.ilmacellaiobn.it al dominio principale; l'indirizzo workers.dev resta attivo per le prove.
const DOMINIO = 'ilmacellaiobn.it'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.hostname === 'www.' + DOMINIO) {
      return Response.redirect(`https://${DOMINIO}${url.pathname}${url.search}`, 301)
    }
    return env.ASSETS.fetch(request)
  },
}
