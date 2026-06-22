import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: 'src/three-hero.js',
      name: 'NavainThreeHero',
      formats: ['iife'],
      fileName: () => 'three-hero.bundle.js',
    },
    minify: 'esbuild',
  },
});
