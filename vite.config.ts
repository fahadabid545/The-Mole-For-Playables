import { defineConfig, Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const target = process.env.VITE_BUILD_TARGET ?? 'playables';

// Portal-specific SDK loaders injected right before </head>. CrazyGames
// and Poki serve their SDKs from their own CDN, so we reference those.
// The Playgama Bridge is inlined from the installed npm package so the
// game can never fail on a network hiccup or CSP block reaching the
// bridge.playgama.com CDN — the SDK is guaranteed to be present.
const PORTAL_SDK_TAGS: Record<string, string> = {
  crazygames: '<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>',
  poki:       '<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>',
};

function playgamaInlineSdk(): string {
  const src = resolve('node_modules/@playgama/bridge/dist/playgama-bridge.js');
  const code = readFileSync(src, 'utf8');
  return `<script>/*! Playgama Bridge (inlined) */\n${code}\n</script>`;
}

const injectPortalSdk: Plugin = {
  name: 'inject-portal-sdk',
  transformIndexHtml(html) {
    if (target === 'playgama') {
      const tag = playgamaInlineSdk();
      return html.replace('</head>', `  ${tag}\n</head>`);
    }
    const tag = PORTAL_SDK_TAGS[target];
    if (!tag) return html;
    return html.replace('</head>', `  ${tag}\n</head>`);
  },
};

// Playgama Bridge fetches ./playgama-bridge-config.json on init.
// forciblySetPlatformId: 'playgama' is critical — the bridge has NO
// auto-detector for Playgama's own hosts (or their QA tool), so without
// this the game boots the MOCK bridge which never postMessages the
// initialize / GAME_READY signals to the parent frame, causing the
// "Platform did not receive the initialization signal" error even when
// the game itself is running fine.
const writePlaygamaConfig: Plugin = {
  name: 'write-playgama-config',
  apply: 'build',
  closeBundle() {
    if (target !== 'playgama') return;
    const dir = resolve('dist-playgama');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const cfg = { forciblySetPlatformId: 'playgama' };
    writeFileSync(resolve(dir, 'playgama-bridge-config.json'), JSON.stringify(cfg, null, 2) + '\n');
  },
};

// Bundle everything into a single index.html for portals that accept a
// drag-and-drop upload (CrazyGames, Poki, YouTube Playables). Playgama
// takes a ZIP with multiple files so it stays as a normal multi-file build.
const singleFileTargets = new Set(['playables', 'crazygames', 'poki']);

const plugins: Plugin[] = [injectPortalSdk, writePlaygamaConfig];
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
  // Use relative asset URLs so multi-file builds (Playgama, Playgama-style
  // portals) load their JS/CSS regardless of the host iframe's URL depth.
  // Absolute `/assets/...` resolved against the portal's root, not the
  // game's folder, and returned 404s that left the page stuck on the
  // loading fallback.
  base: './',
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
