import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Shared by the dev server and `vite preview`, so the production build can be
// exercised locally against the same API without a separate config.
const proxy = {
  '/api': { target: 'http://localhost:5000', changeOrigin: true },
  '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
}

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy },
  preview: { port: 4173, proxy },
})
