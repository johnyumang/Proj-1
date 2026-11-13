import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url));

// Second page of the repository: the 3D scroll story. It has its own root so the prerender
// plugin of the main page is not involved; copy comes from ../src/content/belt.en.js.
export default defineConfig({
  root: here,
  base: './',
  publicDir: path.join(here, 'public'),
  server: { fs: { allow: [path.join(here, '..')] } },
  build: {
    target: 'es2020',
    outDir: path.join(here, '..', 'dist-3d'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.join(here, 'index.html'),
      },
    },
  },
  preview: { port: 4174, strictPort: true },
});
