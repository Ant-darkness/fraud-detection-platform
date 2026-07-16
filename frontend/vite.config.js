import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),   
    tailwindcss()
  ],
  server: {
    proxy: {
      // Hapa tunaiambia Vite ikiona ombi lolote linaanza na /api, ilirudishe kwenye backend container au localhost
      '/api': {
        target: 'http://localhost:8000', // Weka URL na PORT ya backend yako (kama ni Docker container weka jina la huduma mfano: http://backend-api:8000)
        changeOrigin: true,
        secure: false,
        // Hii inasaidia kama backend yako haitumii neno /api mwanzoni mwa routes zake
        // kama backend inatumia /api/auth/login basi futa mstari huu wa chini
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
