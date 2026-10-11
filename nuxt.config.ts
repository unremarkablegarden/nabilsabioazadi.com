// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: ['@nuxtjs/prismic'],
  compatibilityDate: '2025-07-15',
  // The language of the page, for screen readers, and a title for pages that set none.
  app: { head: { htmlAttrs: { lang: 'en-GB' }, title: 'Nabil Sabio Azadi' } },
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()]
  }
})
