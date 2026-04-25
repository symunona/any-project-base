import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'child_process'

const commitSha = (() => {
  try { return execSync('git rev-parse --short HEAD').toString().trim() } catch { return '' }
})()
const commitDate = (() => {
  try { return execSync('git log -1 --format=%ci').toString().trim() } catch { return '' }
})()

export default defineConfig({
  clearScreen: false,
  plugins: [
    // When started via `just start` (Caddy running), suppress the localhost banner.
    // Canonical URLs are shown once by `just start`. Direct `pnpm dev` still shows the banner.
    process.env.CADDY === '1' && {
      name: 'suppress-banner',
      configureServer(server: { printUrls: () => void }) { server.printUrls = () => {} },
    },
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // managed by apply-branding
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache' },
          },
        ],
      },
    }),
  ],
  define: {
    'import.meta.env.VITE_COMMIT_SHA': JSON.stringify(commitSha),
    'import.meta.env.VITE_COMMIT_DATE': JSON.stringify(commitDate),
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
  },
  resolve: {
    alias: {
      '@any-project-base/commons': '../commons',
    },
  },
})
