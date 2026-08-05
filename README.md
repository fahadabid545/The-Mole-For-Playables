# Jungle Mole (The Mole For Playables)

Whack-a-raccoon-in-a-jungle. 50 levels, 5 lives (+1 every 10 levels), rewarded ads for extra lives, and a YouTube-Playables-friendly build path plus a Capacitor path for Play Store / App Store.

Built with Phaser 3 + TypeScript + Vite. All placeholder art is procedurally generated at runtime — the shipped bundle carries **zero binary assets**, keeping it well under the Playables size budget. Real artwork drops in later without touching game code.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

To test on your phone in the same network:
```bash
npm run dev -- --host 0.0.0.0
```
Then open `http://<your-computer-ip>:5173` from the phone.

To test the actual **Playables single-file build**:
```bash
npm run build:playables
npm run preview    # http://localhost:5000
```
`dist/index.html` is the single self-contained file that ships to YouTube Playables.

To reset all progress in the browser: DevTools → Application → Local Storage → delete `mole.v1` and `mole.leaderboard.v1` → reload.

## Builds

```bash
npm run build:playables   # single self-contained index.html in dist/
npm run build:store       # standard chunked build for Capacitor wrap
```

- **Playables build**: `vite-plugin-singlefile` inlines everything into one HTML. Ads are stubbed (Playables policy forbids third-party ad SDKs).
- **Store build**: reads real AdMob via `@capacitor-community/admob` (TODOs inside `src/services/AdsService.ts`). Wrap with Capacitor for Android/iOS.

## Feature checklist

| Feature | Where |
|---|---|
| 50 levels, difficulty curve | `src/config/LevelConfig.ts` |
| 5 lives, max 9, +1 every 10 lvl | `src/config/BuildFlags.ts`, `SaveService` |
| **Life lost only on level fail** (not per miss) | `GameScene.endLevel` |
| Bomb hit costs 3 seconds (no life) | `GameScene.applyBombPenalty` |
| 5 languages (EN/FR/NL/HI/AR) + welcome popup | `I18nService`, `WelcomePopup` |
| Global leaderboard (local seed + REST TODO) | `LeaderboardService`, `LeaderboardScene` |
| Hammer replaces OS cursor everywhere | `index.html` cursor:none + `Hammer` |
| Rewarded ad → +1 life | `OutOfLivesPopup`, `LevelFailedPopup` |
| Rewarded ad → unlock next level when out of lives | `OutOfLivesPopup` |
| Interstitial every 5 levels | `AdsService.shouldShowInterstitialForLevel` |
| Bottom banner (store only) | `AdBanner` |
| Bombs from L21, golden from L8 | `LevelConfig`, `Raccoon` |
| Level complete celebration + stars + confetti | `LevelCompletePopup` |
| Level failed "paw on shoulder" | `LevelFailedPopup` |
| Extra life popup every 10 levels | `ExtraLifePopup` |
| Pause menu | `PausePopup` |
| Sound toggle (persisted) | `AudioService` + HUD/Menu icons |
| Level select w/ stars | `LevelSelectScene` |
| Parallax jungle bg, ambient leaves | `ParallaxJungle`, `LeafParticles` |
| Web-Audio-synthesized SFX (no files) | `AudioService` |
| Save data via localStorage | `SaveService` |

## Project layout

```
src/
  config/       BuildFlags, GameConfig (colors, grid), LevelConfig (difficulty curve)
  services/     Audio, Save, Ads
  utils/        EventBus
  objects/      Raccoon, Hole, Hammer, ParallaxJungle, LeafParticles, ScorePopup, TextureFactory
  ui/           Button, LivesBar, AdBanner
  ui/popups/    Popup base + LevelComplete, LevelFailed, OutOfLives, ExtraLife, Pause
  scenes/       Boot, Preload, Menu, LevelSelect, Game, HUD
```

## Wrapping for stores (next phase, not shipped yet)

```bash
npm i -D @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios @capacitor-community/admob
npx cap init "Jungle Mole" com.fahadabid.junglemole
npm run build:store
npx cap add android
npx cap add ios
```

Then implement the AdMob TODOs in `src/services/AdsService.ts` (AdMobAdsService methods) and drop your real Ad Unit IDs behind env vars.

## Real art / audio later

Drop files into `public/assets/images/**` and `public/assets/audio/**`, then load them in `PreloadScene.preload()` under the same texture keys defined in `src/objects/TextureFactory.ts` — the game will use the real assets automatically without any other code changes. See `ART_PROMPTS.md` for a shot list you can hand to an artist or an image generator.
