import { defineConfig } from 'vite';
import { resolve } from 'path';

const entry = process.env.BUILD_ENTRY || 'content';

export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'public/dist',
    emptyOutDir: entry === 'content',
    lib: {
      entry: resolve(__dirname, `src/${entry}.ts`),
      formats: ['iife'],
      name: entry === 'content' ? 'ContentScript' : 'BackgroundScript',
      fileName: () => `${entry}.js`,
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
});
