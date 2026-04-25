import { defineConfig } from 'vite'

export default defineConfig({
  clearScreen: false,
  root: '.',
  server: {
    port: 5175,
    host: true,
    allowedHosts: true,
  },
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
