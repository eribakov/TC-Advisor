import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: './',
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        content: resolve(__dirname, 'src/content.ts'),
        background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        assetFileNames: 'assets/[name][extname]',
        manualChunks: undefined,
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
  }
})