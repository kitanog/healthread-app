import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    // ADD THIS SECTION:
    allowedHosts: [
      'glp1-companion-dev.up.railway.app', // Your specific domain
      '.railway.app'                      // Allows all railway subdomains
    ],
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
        // secure: false, //new addition for debugging
      }
    }
  }
})
