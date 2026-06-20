import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The browser talks to the Vite dev server (same origin), which proxies
// /aws -> http://localhost:4566 (floci). This avoids any CORS issues.
export default defineConfig({
  plugins: [react()],
  define: { global: 'globalThis' },
  server: {
    proxy: {
      '/aws': {
        target: 'http://localhost:4566',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/aws/, ''),
      },
    },
  },
})
