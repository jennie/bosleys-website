export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/image'
  ],

  // Add nitro configuration for file uploads
  nitro: {
    preset: 'netlify',
    output: {
      dir: '.output',
      publicDir: '.output/public',
      serverDir: '.output/server',
      assetsDir: '.output/assets'
    }
  },

  image: {
    // Enable image optimization
    provider: 'ipx',
    // Configure default image sizes and formats
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
    presets: {
      guestbook: {
        modifiers: {
          format: 'webp',
          width: 400,
          height: 400,
          fit: 'cover',
        }
      }
    }
  },

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
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Bosley\'s personal website - A good boy\'s digital space',
        },
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