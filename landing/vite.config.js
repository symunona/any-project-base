import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main:   'index.html',
        en:     'en/index.html',
        es:     'es/index.html',
        ko:     'ko/index.html',
      },
    },
  },
})
