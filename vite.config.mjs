import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const page = (name) => fileURLToPath(new URL(`./${name}.html`, import.meta.url));

// Multi-page app: every HTML entry must be listed so `vite build` bundles it.
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        loading: page('loading'),
        landing: page('landing'),
        dashboard: page('dashboard'),
        index: page('index'),
        promptToImage: page('prompt-to-image'),
        sketchToImage: page('sketch-to-image'),
      },
    },
  },
});
