import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath, URL } from 'node:url';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { Plugin } from 'vite';

/**
 * Lists the built files for the offline worker (public/sw.js): the app shell it saves on the
 * first visit, and the larger pack of 3D models and video it saves only when asked.
 */
function offlineManifest(): Plugin {
  let outDir = 'dist';
  return {
    name: 'offline-manifest',
    apply: 'build',
    configResolved(config) { outDir = config.build.outDir; },
    closeBundle() {
      const files: string[] = [];
      const walk = (directory: string) => {
        for (const name of readdirSync(directory)) {
          const path = join(directory, name);
          if (statSync(path).isDirectory()) walk(path);
          else files.push(relative(outDir, path).split(sep).join('/'));
        }
      };
      walk(outDir);
      const skip = /^(sw\.js|offline-manifest\.json|version\.json|robots\.txt|sitemap\.xml|social-preview\.png|pc-assembled\.png|bigchange-logo-original\.png)$/;
      const isPack = (file: string) => file.startsWith('models/') || /\.(mp4|vtt)$/.test(file);
      const shell = files.filter(file => !skip.test(file) && !isPack(file)).sort();
      const pack = files.filter(isPack).sort();
      const hash = createHash('sha256');
      for (const file of shell) hash.update(file).update(readFileSync(join(outDir, file)));
      const packBytes = pack.reduce((total, file) => total + statSync(join(outDir, file)).size, 0);
      writeFileSync(join(outDir, 'offline-manifest.json'), JSON.stringify({ version: hash.digest('hex').slice(0, 16), packBytes, shell, pack }, null, 2));
    },
  };
}

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/pc-anatomy/' : '/',
  plugins: [react(), offlineManifest()],
  css: { postcss: { plugins: [tailwindcss()] } },
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  server: { host: '127.0.0.1', port: 5173 },
  build: { chunkSizeWarningLimit: 650 },
});
