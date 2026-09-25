import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/pc-anatomy/' : '/',
  plugins: [react()],
  css: { postcss: { plugins: [tailwindcss()] } },
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  server: { host: '127.0.0.1', port: 5173 },
  build: {
    chunkSizeWarningLimit: 650,
    cssCodeSplit: false,
    rolldownOptions: {
      output: {
        // GitHub Pages replaces each deployment atomically. Stable asset names
        // avoid stale-index / new-asset mismatches during rapid classroom
        // preview deploys.
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
