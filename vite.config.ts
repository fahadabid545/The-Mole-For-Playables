import { defineConfig, Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const target = process.env.VITE_BUILD_TARGET ?? 'playables';

// Portal-specific SDK loaders injected right before </head>. Each script
// creates a global (window.CrazyGames / PokiSDK / bridge) that our
// PortalSDK service wraps at runtime. We inline nothing here — the CDN
// URLs are the officially documented endpoints for each portal.
const PORTAL_SDK_TAGS: Record<string, string> = {
  crazygames: '<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>',
  poki:       '<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>',
  playgama:   '<script src="https://bridge.playgama.com/v2/stable/playgama-bridge.js"></script>',
};

const injectPortalSdk: Plugin = {
  name: 'inject-portal-sdk',
  transformIndexHtml(html) {
    const tag = PORTAL_SDK_TAGS[target];
    if (!tag) return html;
    return html.replace('</head>', `  ${tag}\n</head>`);
  },
};

// Bundle everything into a single index.html for portals that accept a
// drag-and-drop upload (CrazyGames, Poki, YouTube Playables). Playgama
// takes a ZIP with multiple files so it stays as a normal multi-file build.
const singleFileTargets = new Set(['playables', 'crazygames', 'poki']);

const plugins: Plugin[] = [injectPortalSdk];
if (singleFileTargets.has(target)) plugins.push(viteSingleFile());

// Per-target output folder so builds don't clobber each other and we can
// keep one ZIP / one file per portal.
const outDirs: Record<string, string> = {
  playables:  'dist',
  crazygames: 'dist-crazygames',
  poki:       'dist-poki',
  playgama:   'dist-playgama',
  store:      'dist-store',
};

export default defineConfig({
  plugins,
  build: {
    target: 'es2020',
    assetsInlineLimit: 100 * 1024,
    cssCodeSplit: false,
    rollupOptions: { output: { manualChunks: undefined } },
    outDir: outDirs[target] ?? 'dist',
    emptyOutDir: true,
  },
  resolve: { alias: { '@': '/src' } },
  define: { __BUILD_TARGET__: JSON.stringify(target) },
});
