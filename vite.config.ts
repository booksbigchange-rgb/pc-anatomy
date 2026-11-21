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
    rolldownOptions: {
      output: {
        // three.js alone is ~600 kB minified. Give it a chunk of its own so
        // the stage-runtime chunk holds only our geometry code and neither
        // crosses the size warning. Both still load lazily from viewer.tsx.
        codeSplitting: {
          // Only three.js itself: its add-ons (loaders, controls) are used
          // by the labs alone, so they ride in the labs' own chunks and the
          // explorer never downloads them.
          groups: [
            {
              name: 'three',
              test: (id) =>
                /node_modules[\\/]three[\\/]/.test(id) &&
                !/[\\/]examples[\\/]/.test(id),
            },
          ],
        },
      },
    },
  },
});
