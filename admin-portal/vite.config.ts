import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const commons = path.resolve(__dirname, '../commons')
const root = path.resolve(__dirname, '..')

const commitSha = (() => {
  try { return execSync('git rev-parse --short HEAD').toString().trim() } catch { return '' }
})()
const commitDate = (() => {
  try { return execSync('git log -1 --format=%ci').toString().trim() } catch { return '' }
})()

export default defineConfig({
  clearScreen: false,
  envDir: root,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
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
    port: 6174,
    host: true,
    allowedHosts: true,
  },
  resolve: {
    alias: [
      { find: /^@any-project-base\/commons\/styles$/, replacement: `${commons}/styles/globals.css` },
      { find: /^@any-project-base\/commons$/, replacement: `${commons}/index.ts` },
      { find: /^@any-project-base\/commons\/(.*)$/, replacement: `${commons}/$1` },
    ],
  },
})
