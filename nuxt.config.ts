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
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()]
  }
})
