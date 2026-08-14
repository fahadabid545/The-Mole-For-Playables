import Phaser from 'phaser';
import { TX } from './TextureFactory';

// Vite import.meta.glob bundles every PNG in ./assets/sprites/ at build
// time. If a filename below is present, its URL comes back and we
// register a Phaser texture under the matching TX key BEFORE
// TextureFactory runs — makeTexture() short-circuits when a key already
// exists, so any file the developer drops in silently overrides the
// procedural primitive.
const modules = import.meta.glob('../assets/sprites/*.png', { eager: true, as: 'url' }) as Record<string, string>;

// filename (without folder / extension) -> texture key
const map: Record<string, string> = {
  'raccoon':        TX.raccoon,
  'raccoon-hit':    TX.raccoonHit,
  'raccoon-golden': TX.raccoonGolden,
  'raccoon-frozen': TX.raccoonFrozen,
  'raccoon-boss':   TX.raccoonBoss,
  'hammer':         TX.hammer,
  'bomb':           TX.bomb,
  'cat':            TX.cat,
  'goat':           TX.goat,
  'log-hole':       TX.logHole,
  'bg-jungle':      TX.bgJungle,
};

interface OverrideRequest { key: string; url: string; }

function collect(): OverrideRequest[] {
  const out: OverrideRequest[] = [];
  for (const [path, url] of Object.entries(modules)) {
    const base = path.split('/').pop()?.replace(/\.png$/, '') ?? '';
    const key = map[base];
    if (key) out.push({ key, url });
  }
  return out;
}

// Kick off image loads. Returns a Promise that resolves once every
// override is registered as a Phaser texture, so PreloadScene can
// safely call buildAllTextures() right after — the procedural
// generators will see the keys already exist and skip themselves.
export function loadSpriteOverrides(scene: Phaser.Scene): Promise<void> {
  const requests = collect();
  if (requests.length === 0) return Promise.resolve();
  return new Promise((resolve) => {
    let remaining = requests.length;
    const done = () => { if (--remaining <= 0) resolve(); };
    for (const { key, url } of requests) {
      if (scene.textures.exists(key)) { done(); continue; }
      scene.load.image(key, url);
    }
    scene.load.once(Phaser.Loader.Events.COMPLETE, () => resolve());
    scene.load.on('loaderror', done);
    scene.load.start();
  });
}
