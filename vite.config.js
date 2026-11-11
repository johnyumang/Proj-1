import { defineConfig } from 'vite';
import { prerender } from './build/prerender.js';

export default defineConfig({
  // Relative URLs everywhere, so dist/ works from any subfolder.
  base: './',
  plugins: [prerender()],
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    // Fonts stay separate files so they can be preloaded and cached.
    assetsInlineLimit: 0,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
});
