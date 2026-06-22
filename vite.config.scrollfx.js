import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist-scrollfx',
    emptyOutDir: true,
    lib: {
      entry: 'src/scroll-fx.js',
      name: 'NavainScrollFX',
      formats: ['iife'],
      fileName: () => 'scroll-fx.bundle.js',
    },
    minify: 'esbuild',
  },
});
