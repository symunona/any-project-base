import { defineConfig } from 'vite'

export default defineConfig({
  clearScreen: false,
  plugins: [
    process.env.CADDY === '1' && {
      name: 'suppress-banner',
      configureServer(server) { server.printUrls = () => {} },
    },
  ].filter(Boolean),
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
