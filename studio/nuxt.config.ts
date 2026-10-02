import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

// The `airspace-studio` bin points this at the user's project; otherwise Studio reads its own directory.
const external = !!process.env.AIRSPACE_STUDIO_ROOT
const projectRoot = resolve(process.env.AIRSPACE_STUDIO_ROOT || import.meta.dirname)
const cacheDir = resolve(projectRoot, 'node_modules/.cache/airspace-studio')
// `run` keeps output in the cache; `build`/`preview` put it in the project.
const outputDir = process.env.AIRSPACE_STUDIO_OUTPUT === 'project'
  ? resolve(projectRoot, '.airspace-studio')
  : resolve(cacheDir, 'output')
const lexiconsFile = resolve(projectRoot, 'lexicons.ts')
const studioConfigFile = resolve(projectRoot, 'studio.config.ts')
const hasLexicons = existsSync(lexiconsFile)
const hasStudioConfig = existsSync(studioConfigFile)

export default defineNuxtConfig({
  modules: ['@nuxt/fonts'],
  css: ['~/assets/css/tokens.css', '~/assets/css/base.css'],
  // Studio may be installed in a shared node_modules, so build into the project instead.
  ...external && { buildDir: resolve(cacheDir, 'build') },
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
      { name: 'Caveat', provider: 'google', weights: [500], styles: ['normal'], subsets: ['latin'], glyphs: 'airspacetudo' },
    ],
  },
  runtimeConfig: {
    studioSessionPassword: 'airspace-studio-local-development-key',
    public: { hasLexicons: hasLexicons || hasStudioConfig },
  },
  alias: {
    '#studio-config': hasStudioConfig ? studioConfigFile : resolve(import.meta.dirname, 'shared/empty-config.ts'),
    '#studio-lexicons': hasLexicons ? lexiconsFile : resolve(import.meta.dirname, 'shared/empty-lexicons.ts'),
  },
  vite: {
    server: {
      fs: { allow: [projectRoot, import.meta.dirname] },
    },
  },
  nitro: {
    prerender: { routes: [] },
    ...external && { output: { dir: outputDir } },
  },
  compatibilityDate: '2026-09-01',
})
