# Art & Audio Shot List

Style guide for whoever draws real assets. All art targets a **720×1280 portrait canvas** at 2× (assets themselves at 1440×2560 for retina).

## Style

- Cartoon, chunky outlines, saturated jungle palette.
- Colors: greens `#1b5e20 / #2e7d32 / #66bb6a`, wood `#4e342e / #6d4c41 / #8d6e63`, warm accents `#ffca28 / #ffd54f`, red pop `#e53935`.
- Font (UI): "Luckiest Guy" or "Fredoka One" (fallback: Impact).

## Images (drop into `public/assets/images/`)

Key names match `src/objects/TextureFactory.ts` — same key, real texture wins.

| Key / File | Size | Prompt |
|---|---|---|
| `tx-bg-sky` (`bg/jungle_sky.png`) | 720×1280 | Sunlit jungle sky, mist, faint sun rays, no characters. |
| `tx-bg-trees-far` (`bg/trees_far.png`) | 720×1280 transparent | Layered distant jungle canopy silhouette in muted greens. |
| `tx-bg-trees-near` (`bg/trees_near.png`) | 720×1280 transparent | Two big framing tree trunks with hanging vines, foreground leaves at top. |
| `tx-bg-leaves-fg` (`bg/leaves_fg.png`) | 720×260 transparent | Row of dense foreground jungle leaves for the bottom of the screen. |
| `tx-leaf-particle` (`fx/leaf.png`) | 64×40 | Single jungle leaf, top-down, subtle vein. |
| `tx-log-hole` (`holes/log_hole.png`) | 220×260 | Cartoon hollow log stump seen slightly from above; rim in warm wood, deep black interior. |
| `tx-log-hole-shadow` | 240×60 | Soft dark elliptical ground shadow. |
| `tx-raccoon` (`raccoon/raccoon_idle.png`) | 360×360 | Chibi raccoon, big eyes, dark mask, gray body, tiny red nose, mischievous smile. Front view, head-and-torso only. |
| `tx-raccoon-hit` (`raccoon/raccoon_hit.png`) | 360×360 | Same raccoon but dazed: x-eyes, tongue out, stars around head. |
| `tx-raccoon-golden` (`raccoon/raccoon_golden.png`) | 360×360 | Same raccoon but shiny gold fur, sparkles. |
| `tx-bomb` (`raccoon/bomb.png`) | 320×360 | Angry black skunk/bomb hybrid with lit fuse and glowing spark. |
| `tx-hammer` (`hammer/hammer.png`) | 400×440 | Big cartoon sledgehammer, chrome head with shiny highlight, wood handle. Rotated so handle bottom-center. |
| `tx-spark` (`fx/spark.png`) | 80×80 | 4-point yellow spark. |
| `tx-dust` (`fx/dust.png`) | 80×80 | Soft dust puff. |
| `tx-heart-full` / `tx-heart-empty` | 120×120 | Chunky cartoon heart (red / gray outline). |
| `tx-star` (`ui/star.png`) | 160×160 | 5-point yellow star with brown outline. |
| `tx-panel` (`ui/panel_wood.png`) | 1120×920 | Wooden signboard panel, cream inner, dark wood border. |
| `tx-button` / `tx-button-ad` | 720×200 | Rounded cartoon button, green (primary) and amber (ad/rewarded) variants, drop shadow. |
| `tx-confetti` | 32×32 | Small colored rectangle used for particle confetti. |
| `tx-paw` (`raccoon/paw.png`) | 240×240 | Cartoon raccoon paw waving. |
| `tx-sound-on` / `tx-sound-off` / `tx-pause` | 144×144 | White line-art icons on transparent. |

## Audio (drop into `public/assets/audio/`)

| Key | File | Notes |
|---|---|---|
| `sfx-hit` | `sfx/hammer_hit.mp3` | THWACK — wood + metal ping, ~150ms. |
| `sfx-miss` | `sfx/hammer_miss.mp3` | Soft dust *fwump*, ~200ms. |
| `sfx-squeak` | `sfx/raccoon_squeak.mp3` | Short cartoon squeak on pop-up. |
| `sfx-laugh` | `sfx/raccoon_laugh.mp3` | Cheeky "hee-hee-hee" on escape. |
| `sfx-life-lost` | `sfx/life_lost.mp3` | Heart shatter, glassy. |
| `sfx-extra-life` | `sfx/extra_life.mp3` | Bright ascending chime, ~500ms. |
| `sfx-win` | `sfx/level_win.mp3` | 4-note major arpeggio + cheer swirl. |
| `sfx-fail` | `sfx/level_fail.mp3` | Descending sad trombone, ~700ms. |
| `sfx-click` | `sfx/ui_click.mp3` | Soft UI click. |
| `sfx-bomb` | `sfx/bomb.mp3` | Comic explosion. |
| `sfx-golden` | `sfx/golden.mp3` | Sparkly triple ping. |
| `music-jungle` | `music/jungle_ambient_loop.mp3` | 30–60s seamless loop, quiet birds + rustle. |

Once files land, load them in `src/scenes/PreloadScene.ts` with the same texture / audio keys and the game picks them up automatically.
