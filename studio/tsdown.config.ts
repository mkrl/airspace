import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  dts: { generator: 'oxc' },
  exports: { devExports: true },
  publint: true,
  attw: {
    profile: 'esm-only',
    level: 'error',
  },
})
