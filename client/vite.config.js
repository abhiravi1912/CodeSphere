import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://16.113.120.78:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://16.113.120.78:5000',
        ws: true,
      }
    }
  }
})
