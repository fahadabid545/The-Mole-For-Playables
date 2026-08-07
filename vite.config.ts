import { defineConfig, Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const target = process.env.VITE_BUILD_TARGET ?? 'playables';

// Playgama Bridge auto-injects on their side, but for reliable local dev
// and for the ZIP submitted to Playgama we drop the CDN loader into the
// built index.html ourselves. Any portal that ships its own copy will
// simply overwrite window.bridge, so this is safe.
const injectPlaygamaBridge: Plugin = {
  name: 'inject-playgama-bridge',
  transformIndexHtml(html) {
    if (target !== 'playgama') return html;
    const tag = '<script src="https://cdn.jsdelivr.net/npm/@playgama/bridge@latest/dist/index.min.js"></script>';
    return html.replace('</head>', `  ${tag}\n</head>`);
  },
};

const plugins: Plugin[] = [];
if (target === 'playables') plugins.push(viteSingleFile());
if (target === 'playgama')  plugins.push(injectPlaygamaBridge);

export default defineConfig({
  plugins,
  build: {
    target: 'es2020',
    assetsInlineLimit: 100 * 1024,
    cssCodeSplit: false,
    rollupOptions: { output: { manualChunks: undefined } },
    // Give Playgama its own output folder so we can ZIP it separately
    // without touching the Playables/Store bundle in dist/.
    outDir: target === 'playgama' ? 'dist-playgama' : 'dist',
  },
  resolve: { alias: { '@': '/src' } },
  define: { __BUILD_TARGET__: JSON.stringify(target) },
});
