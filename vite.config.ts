import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
 
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend'),
    },
  },
  root: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },

  preview: {
    allowedHosts: true, 
    host: true      
  }
})
