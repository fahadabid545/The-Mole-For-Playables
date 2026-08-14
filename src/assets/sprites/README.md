# Sprite Overrides

Drop transparent PNG files here with these exact filenames. The game
will detect them at boot and use them in place of the procedurally
generated primitives (`TextureFactory.ts`). Missing files silently
fall back to the primitives — nothing breaks if you provide only a
subset.

Vite inlines any asset under 100 KB into the single-file build, so
keep each PNG at or below ~90 KB. PNGquant / TinyPNG can crush them.

## Required filenames (transparent PNG unless noted)

| Filename                | Recommended size | Notes                                                   |
| ----------------------- | ---------------- | ------------------------------------------------------- |
| `raccoon.png`           | 400 × 400        | Facing camera, upper-body only, popping from a hole.    |
| `raccoon-golden.png`    | 400 × 400        | Same pose, gold/yellow palette.                         |
| `raccoon-frozen.png`    | 400 × 400        | Same pose, ice-blue palette with frost sparkle.         |
| `raccoon-boss.png`      | 520 × 520        | Bigger, meaner, with a crown or dark aura.              |
| `hammer.png`            | 400 × 440        | Cartoon wooden handle + steel head, upright.            |
| `bomb.png`              | 320 × 360        | Round black bomb with lit fuse and highlight.           |
| `cat.png`               | 400 × 440        | Cute cartoon cat (Super Hard penalty enemy).            |
| `goat.png`              | 400 × 440        | Cute cartoon goat (Super Hard penalty enemy).           |
| `bg-jungle.png`         | 1440 × 2560      | Vertical jungle background, sunset palette (optional).  |
| `log-hole.png`          | 480 × 560        | Horizontal wooden log with dark central hole.           |

## AI prompt shopping list

Paste these into any image AI (DALL·E, Midjourney, SD). Set output
to **transparent background PNG** and the size shown above.

### `raccoon.png`
> Cute cartoon raccoon character, front-facing, upper body only, warm
> brown fur, big expressive shiny eyes, black bandit mask, pink inner
> ears, cream-colored belly, small paws visible. Thick clean outlines,
> cel-shaded flat colors with soft highlights, bright saturated palette,
> mobile-game mascot style, transparent background, PNG. No hole, no
> ground, no shadow — just the character isolated. 400x400 pixels.

### `raccoon-golden.png`
Same prompt, replace "warm brown fur" with "bright gold fur, sparkling",
add "shimmering star sparkles floating around".

### `raccoon-frozen.png`
Same prompt, replace "warm brown fur" with "icy pale-blue fur", replace
"pink inner ears" with "frost-blue inner ears", add "small frost
crystals on shoulders".

### `raccoon-boss.png`
> Cute cartoon boss raccoon character, front-facing, upper body only,
> darker rich brown fur, larger and meaner than a regular raccoon, black
> bandit mask, angry expression with furrowed brow, small golden crown
> on head, faint red aura glow behind head. Thick outlines, cel-shaded
> flat colors, mobile-game boss style, transparent background, PNG.
> 520x520 pixels.

### `hammer.png`
> Cartoon wooden hammer, upright vertical pose, chunky steel double
> head at top, thick brown wooden handle with a small grip wrap, thick
> dark outlines, cel-shaded flat colors with a bright top highlight on
> the steel, mobile-game whack-a-mole style, transparent background,
> PNG. 400x440 pixels.

### `bomb.png`
> Cartoon round black bomb with a short lit fuse on top spitting a tiny
> orange spark, chunky highlight on upper-left of the sphere giving it
> volume, thick dark outline, mobile-game style, transparent background,
> PNG. 320x360 pixels.

### `cat.png`
> Cute cartoon orange tabby cat sitting facing the camera, upper body
> only, big green eyes, small pink nose, whiskers, tail curled up beside.
> Thick clean outlines, cel-shaded flat colors, mobile-game mascot style,
> transparent background, PNG. 400x440 pixels.

### `goat.png`
> Cute cartoon white goat facing the camera, upper body only, curved
> beige horns, cute face with black slit pupils, small beard, transparent
> background, thick outlines, cel-shaded flat colors, mobile-game style,
> PNG. 400x440 pixels.

### `log-hole.png`
> Horizontal chunky brown wooden log with a large dark oval hole in the
> center front, wooden ring cross-section visible on both left and right
> ends, thick dark outline, cel-shaded flat colors, warm wood tones with
> subtle bark texture, mobile-game whack-a-mole style, transparent
> background, PNG. 480x560 pixels.

### `bg-jungle.png` (optional but big impact)
> Cartoon jungle background, vertical portrait aspect ratio, sunset sky
> with orange-to-yellow gradient, silhouetted palm trees on both sides,
> soft green rolling hills at the horizon, warm golden glow, no
> characters, no text. Painterly cartoon style, mobile-game backdrop.
> 1440x2560 pixels.

## After you drop the files

Just run `npm run build:crazygames` and the game picks them up
automatically — no code changes needed.
