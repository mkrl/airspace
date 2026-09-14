import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const hasLexicons = existsSync(resolve(import.meta.dirname, 'lexicons.ts'))

export default defineNuxtConfig({
  modules: ['@nuxt/fonts'],
  css: ['~/assets/css/tokens.css', '~/assets/css/base.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      link: [
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      ],
      meta: [
        { name: 'theme-color', content: '#f9fafb', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#111721', media: '(prefers-color-scheme: dark)' },
      ],
    },
  },
  features: {
    inlineStyles: true,
  },
  fonts: {
    processCSSVariables: true,
    defaults: {
      preload: { subsets: ['latin'] },
    },
    families: [
      { name: 'Space Grotesk', provider: 'google', weights: [500], styles: ['normal'], subsets: ['latin'] },
      { name: 'Instrument Sans', provider: 'google', weights: [400, 500, 600], styles: ['normal'], subsets: ['latin'] },
      { name: 'JetBrains Mono', provider: 'google', weights: [400], styles: ['normal'], subsets: ['latin'] },
      { name: 'Caveat', provider: 'google', weights: [500], styles: ['normal'], subsets: ['latin'], glyphs: 'airspace' },
    ],
  },
  runtimeConfig: {
    studioSessionPassword: 'airspace-studio-local-development-key',
    public: { hasLexicons },
  },
  alias: {
    '#studio-lexicons': resolve(import.meta.dirname, hasLexicons ? 'lexicons.ts' : 'shared/empty-lexicons.ts'),
  },
  nitro: {
    prerender: { routes: [] },
  },
  compatibilityDate: '2026-09-01',
})
