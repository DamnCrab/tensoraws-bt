// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    // https://nuxt.com/modules
    modules: [
        '@nuxthub/core',
        '@nuxt/eslint',
        '@nuxt/image',
        '@nuxt/ui',
        '@pinia/nuxt',
        'nuxt-auth-utils',
        '@scalar/nuxt'
    ],
    css: ['~/assets/css/main.css'],
    // https://devtools.nuxt.com
    devtools: {enabled: true},

    // Env variables - https://nuxt.com/docs/getting-started/configuration#environment-variables-and-private-tokens
    runtimeConfig: {
        // Private keys (only available on server-side)
        jwtSecret: process.env.NUXT_JWT_SECRET || 'your-secret-key',
        public: {
            // Can be overridden by NUXT_PUBLIC_HELLO_TEXT environment variable
            helloText: 'TensoRaws-BT',
            siteName: 'TensoRaws-BT'
        }
    },
    // https://nuxt.com/docs/getting-started/upgrade#testing-nuxt-4
    future: {
        compatibilityVersion: 4
    },
    compatibilityDate: '2025-03-01',

    nitro: {
        experimental: {
            openAPI: true,
        },
        openAPI: {
            route: "/_docs/openapi.json",
        }
    },

    scalar: {
        url: '/_docs/openapi.json'
    },

    // https://hub.nuxt.com/docs/getting-started/installation#options
    hub: {
        database: true,
        blob: true,
        kv: true
    },

    // Development config
    eslint: {
        config: {
            stylistic: {
                quotes: 'single',
                commaDangle: 'never'
            }
        }
    }
})

/**
 * alias configuration for Nuxt 4
 * 不应该在server中使用 / should not use in server
 *
 * {
 *   "~": "/app",
 *   "@": "/app",
 *   "~~": "/",
 *   "@@": "/",
 *   "#shared": "/shared",
 *   "assets": "/app/assets",
 *   "public": "/app/public",
 *   "#build": "/.nuxt",
 *   "#internal/nuxt/paths": "/.nuxt/paths.mjs"
 * }
 */