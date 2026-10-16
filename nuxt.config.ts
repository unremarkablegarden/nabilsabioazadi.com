// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: ['@nuxtjs/prismic'],
  compatibilityDate: '2025-07-15',
  // The language of the page, for screen readers, and a title for pages that set none.
  app: {
    head: {
      htmlAttrs: { lang: 'en-GB' },
      title: 'Nabil Sabio Azadi',
      // The site's icon: the asterisk of the owner's mark, oversized and cut by its black square.
      // The SVG is the one browsers use; the .ico and PNGs are for older browsers and for phones'
      // home screens.
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
    },
  },
  // Prismic's toolbar is a script from Prismic's servers that every visitor loaded. It is
  // needed only to preview unpublished writing, so it is left out of the live site.
  prismic: {
    toolbar: process.env.NODE_ENV !== 'production',
  },
  // The files in public/ keep their names when they change, so browsers were told to ask again
  // on every visit whether each was still current. These hardly ever change: browsers keep them
  // for a week and, for a month after that, use the copy they have while they check behind it.
  // (A file that must reach everyone at once should be given a new name.)
  routeRules: {
    ...Object.fromEntries(
      ['/fonts/**', '/textures/**', '/brand/**', '/about/**', '/stars.json', '/milky-way.jpg'].map((path) => [
        path,
        { headers: { 'cache-control': 'public, max-age=604800, stale-while-revalidate=2592000' } },
      ]),
    ),
  },
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()]
  }
})
