import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', '.next', 'out', 'build'],
  },
  resolve: {
    alias: [
      { find: '@/app', replacement: path.resolve(__dirname, './app') },
      { find: '@/pages', replacement: path.resolve(__dirname, './src/pages') },
      { find: '@/widgets', replacement: path.resolve(__dirname, './src/widgets') },
      { find: '@/features', replacement: path.resolve(__dirname, './src/features') },
      { find: '@/entities', replacement: path.resolve(__dirname, './src/entities') },
      { find: '@/shared', replacement: path.resolve(__dirname, './src/shared') },
      { find: '@', replacement: path.resolve(__dirname, './') },
    ],
  },
  esbuild: {
    target: 'node18',
  },
})
