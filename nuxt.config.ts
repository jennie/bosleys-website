export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss'
  ],

  runtimeConfig: {
    mongodbUri: process.env.MONGODB_URI,
    tractiveEmail: process.env.TRACTIVE_EMAIL,
    tractivePassword: process.env.TRACTIVE_PASSWORD,
    public: {
      siteTitle: "Bosley's Website"
    }
  },

  app: {
    head: {
      title: "Bosley's Website",
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  // Add back transpile for CommonJS packages
  build: {
    transpile: ['tractive']
  },

  vite: {
    // Configuration for CommonJS modules
    optimizeDeps: {
      include: ['tractive']
    },
    ssr: {
      noExternal: ['tractive']
    }
  },

  // Enable Nuxt's TypeScript integration
  typescript: {
    strict: true,
    shim: false
  },

  compatibilityDate: '2025-02-28'
})