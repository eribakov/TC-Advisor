import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: './',
  publicDir: false,
  build: {
    rollupOptions: {
      input: {
        'index.html': resolve(__dirname, 'public/index.html'),
        content: resolve(__dirname, 'src/content.ts'),
        background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        assetFileNames: 'assets/[name][extname]',
      }
    },
    outDir: 'public/dist',
    emptyOutDir: true,
  }
})