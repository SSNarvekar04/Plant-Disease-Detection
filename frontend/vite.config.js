import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration.
//  - @vitejs/plugin-react gives Fast Refresh during development
//  - the dev server proxies /uploads and /api so the browser sees a single
//    origin, which keeps CORS out of the picture while developing
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});