const pkg = require('./package.json')

const routerBasePath = process.env.ROUTER_BASE_PATH ?? '/audiobookshelf'
const serverHostUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3333'
const serverPaths = ['api/', 'public/', 'hls/', 'auth/', 'feed/', 'status', 'login', 'logout', 'init']
const proxy = Object.fromEntries(serverPaths.map((path) => [`${routerBasePath}/${path}`, { target: process.env.NODE_ENV !== 'production' ? serverHostUrl : '/' }]))
const normalizeBrandingPath = (path) => {
  if (!path) return path
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path
  return `${routerBasePath}/${path.replace(/^\/+/, '')}`
}
const branding = {
  name: process.env.BRAND_NAME || 'Toddio',
  shortName: process.env.BRAND_SHORT_NAME || process.env.BRAND_NAME || 'Toddio',
  displayName: process.env.BRAND_DISPLAY_NAME || process.env.BRAND_SHORT_NAME || process.env.BRAND_NAME || 'Toddio',
  logo: normalizeBrandingPath(process.env.BRAND_LOGO || '/Logo.png'),
  icon: normalizeBrandingPath(process.env.BRAND_ICON || '/icon.png'),
  favicon: normalizeBrandingPath(process.env.BRAND_FAVICON || '/favicon.ico'),
  appleIcon: normalizeBrandingPath(process.env.BRAND_APPLE_ICON || '/apple_icon.png'),
  pwaIcon: normalizeBrandingPath(process.env.BRAND_PWA_ICON || process.env.BRAND_ICON || '/icon.png'),
  pwaIcon192: normalizeBrandingPath(process.env.BRAND_PWA_ICON_192 || '/icon.png'),
  themeColor: process.env.BRAND_THEME_COLOR || '#232323'
}

module.exports = {
  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,
  target: 'static',
  dev: process.env.NODE_ENV !== 'production',
  env: {
    serverUrl: serverHostUrl + routerBasePath,
    chromecastReceiver: 'FD1F76C5'
  },
  telemetry: false,

  publicRuntimeConfig: {
    version: pkg.version,
    routerBasePath,
    branding
  },

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: branding.name,
    htmlAttrs: {
      lang: 'en'
    },
    meta: [{ charset: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }, { hid: 'description', name: 'description', content: '' }, { hid: 'robots', name: 'robots', content: 'noindex' }],
    script: [],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: branding.favicon },
      { rel: 'apple-touch-icon', href: branding.appleIcon }
    ]
  },

  router: {
    base: routerBasePath
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: ['@/assets/app.css'],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: ['@/plugins/constants.js', '@/plugins/branding.js', '@/plugins/init.client.js', '@/plugins/axios.js', '@/plugins/toast.js', '@/plugins/utils.js', '@/plugins/i18n.js'],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/tailwindcss
    '@nuxtjs/pwa'
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: ['nuxt-socket-io', '@nuxtjs/axios', '@nuxtjs/proxy'],

  proxy,

  io: {
    sockets: [
      {
        name: 'dev',
        url: serverHostUrl
      },
      {
        name: 'prod'
      }
    ]
  },

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {
    baseURL: routerBasePath,
    progress: false
  },

  // nuxt/pwa https://pwa.nuxtjs.org
  pwa: {
    icon: false,
    meta: {
      appleStatusBarStyle: 'black',
      name: branding.name,
      theme_color: branding.themeColor,
      mobileAppIOS: true,
      nativeUI: true
    },
    manifest: {
      name: branding.name,
      short_name: branding.shortName,
      display: 'standalone',
      background_color: branding.themeColor,
      icons: [
        {
          src: branding.pwaIcon,
          sizes: 'any'
        },
        {
          src: branding.pwaIcon192,
          type: 'image/png',
          sizes: 'any'
        }
      ]
    },
    workbox: {
      offline: false,
      cacheAssets: false,
      preCaching: [],
      runtimeCaching: []
    }
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {},
  watchers: {
    webpack: {
      aggregateTimeout: 300,
      poll: 1000
    }
  },
  server: {
    port: process.env.NODE_ENV === 'production' ? 80 : 3000,
    host: '0.0.0.0'
  },

  /**
   * Temporary workaround for @nuxt-community/tailwindcss-module.
   *
   * Reported: 2022-05-23
   * See: [Issue tracker](https://github.com/nuxt-community/tailwindcss-module/issues/480)
   */
  devServerHandlers: [],

  ignore: ['**/*.test.*', '**/*.cy.*']
}
