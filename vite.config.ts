import { defineConfig, Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const target = process.env.VITE_BUILD_TARGET ?? 'playables';

// Portal-specific SDK loaders injected right before </head>. CrazyGames
// and Poki serve their SDKs from their own CDN, so we reference those.
// Playgama Bridge is COPIED next to index.html and referenced by a
// relative <script src> — inlining a 282 KB script with ES2022 private
// class fields into <script> triggers a Chromium HTML-parser bug
// ("Private field '#Z' must be declared in an enclosing class") that
// external scripts do NOT hit.
const PORTAL_SDK_TAGS: Record<string, string> = {
  crazygames: '<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>',
  poki:       '<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>',
  playgama:   '<script src="./playgama-bridge.js"></script>',
};

const injectPortalSdk: Plugin = {
  name: 'inject-portal-sdk',
  transformIndexHtml(html) {
    const tag = PORTAL_SDK_TAGS[target];
    if (!tag) return html;
    return html.replace('</head>', `  ${tag}\n</head>`);
  },
};

// Copy Playgama Bridge JS into the build output so it can be served
// alongside index.html (relative <script src="./playgama-bridge.js">).
const copyPlaygamaSdk: Plugin = {
  name: 'copy-playgama-sdk',
  apply: 'build',
  closeBundle() {
    if (target !== 'playgama') return;
    const dir = resolve('dist-playgama');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const src = resolve('node_modules/@playgama/bridge/dist/playgama-bridge.js');
    copyFileSync(src, resolve(dir, 'playgama-bridge.js'));
  },
};

// Playgama Bridge fetches ./playgama-bridge-config.json on init. The
// QA tool watchdog listens for the postMessage handshake that ONLY the
// QaToolPlatformBridge sends — PlaygamaPlatformBridge fetches Playgama's
// own SDK from CDN and does not do that handshake, so a 'playgama' value
// makes the QA tool time out. Force 'qa_tool' so the correct bridge is
// loaded on the QA testing environment. Playgama replaces this file
// server-side at final publish time when the game is promoted to
// production distribution.
const writePlaygamaConfig: Plugin = {
  name: 'write-playgama-config',
  apply: 'build',
  closeBundle() {
    if (target !== 'playgama') return;
    const dir = resolve('dist-playgama');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const cfg = { forciblySetPlatformId: 'qa_tool' };
    writeFileSync(resolve(dir, 'playgama-bridge-config.json'), JSON.stringify(cfg, null, 2) + '\n');
  },
};

// Bundle everything into a single index.html for portals that accept a
// drag-and-drop upload (CrazyGames, Poki, YouTube Playables). Playgama
// takes a ZIP with multiple files so it stays as a normal multi-file build.
const singleFileTargets = new Set(['playables', 'crazygames', 'poki']);

const plugins: Plugin[] = [injectPortalSdk, copyPlaygamaSdk, writePlaygamaConfig];
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
