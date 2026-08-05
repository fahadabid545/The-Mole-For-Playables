import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const target = process.env.VITE_BUILD_TARGET ?? 'playables';

export default defineConfig({
  plugins: target === 'playables' ? [viteSingleFile()] : [],
  build: {
    target: 'es2020',
    assetsInlineLimit: 100 * 1024,
    cssCodeSplit: false,
    rollupOptions: { output: { manualChunks: undefined } },
  },
  resolve: { alias: { '@': '/src' } },
  define: { __BUILD_TARGET__: JSON.stringify(target) },
});
