import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss({
        content: ['./index.html', './src/**/*.{ts,tsx}'],
        theme: {
          extend: {
            fontFamily: {
              sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'sans-serif'],
            },
          },
        },
      })],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/zod/')) return 'schema';
          if (id.includes('/node_modules/jszip/')) return 'zip';
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173
  }
})
