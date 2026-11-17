[![make.fun best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![rank](https://make.fun/badge/best-game-01/irwanma/makefun-best-game-01/rank.svg)](https://make.fun/bounty/best-game-01)
[![reward](https://make.fun/badge/best-game-01/irwanma/makefun-best-game-01/reward.svg)](https://make.fun/bounty/best-game-01)

# NEONFALL

A neon arena survival shooter for the browser, built with an AI coding agent
for the [make.fun best-game-01](https://make.fun/bounty/best-game-01) bounty.
Pure vanilla JavaScript on a 2D canvas — no libraries, no build step.

## The game

You pilot the last ship in a collapsing neon arena. Survive escalating waves,
chain kills into a combo multiplier, and pick one of three upgrades after
every wave. A Dreadnought boss arrives every fifth wave.

- Twin-stick controls: WASD or arrow keys to move, mouse to aim, hold to fire
- Four enemy types with distinct behaviour: chasers, weavers, shooters and
  splitters that break into minis
- Boss fight every 5 waves, with its own health bar
- Between-wave upgrade draft: 1 of 3 from a pool of 8 real upgrades
  (damage, fire rate, multishot, hull, shield, magnet, speed, combo window)
- Shield and repair pickups, particle effects, screen shake, synth SFX
- Full HUD: hull, shield, wave, score, combo and current build
- Pause with P or Esc, mute with M, persistent high score

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. Or just open
`game/index.html` directly.

## Build the dossier

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This copies `game/` and `screenshots/` to the output directory and writes
`dossier.json` with `buildDossier` from `vendor/makefun-game.ts`, exactly as
the grader does.

## Layout

- `game/index.html` — the page
- `game/src/` — the game source, one job per file (config, input, audio,
  particles, enemies, player, weapons, waves, upgrades, hud, screens, main)
- `screenshots/` — title, combat, upgrade draft and game over, 1280x720
- `main.ts` — the entrypoint the grader runs (Node 22)
- `serve.ts` — a tiny local server for playing the game

## License

MIT — see `LICENSE`.
