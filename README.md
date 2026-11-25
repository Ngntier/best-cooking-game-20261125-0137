# Sizzle & Serve

[![make.fun bounty](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Ngntier/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Ngntier/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A complete little cooking game for the [best-cooking-game-20261125-0137](https://make.fun/bounty/best-cooking-game-20261125-0137) bounty: run the lunch rush in your own kitchen. Orders land on the ticket board with countdown timers; you grab ingredients from the pantry, chop them on the board, grill patties on the stove (don't let them burn), build each dish on the plate, and serve it through the window before the ticket runs out. Four recipes, a growing rush, combos, coins and a 150-second day.

## How to play

- **Move:** WASD / arrow keys, or click the floor to walk there
- **Use a station:** `E` (or click the station when you are next to it)
- **Pantry:** click an ingredient bin, or press `1`–`6`
- **Serve:** `E` or `Space` at the serve window when the plate matches a ticket
- **Pause:** `P` · **Mute:** `M` · **Restart the day:** `R`

Chop tomato, lettuce and onion on the chopping board; grill raw patties (grab them while they are grilled — leave them and they burn); buns and cheese go straight on the plate. Serve the right dish to earn coins and score, chain serves for a combo, and don't let three tickets expire.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests: `game/index.html` plus its ES modules under `game/src/` play offline in desktop Chrome. All art is drawn in code (canvas 2D) and all sound is WebAudio oscillator beeps.

## Layout

- `main.ts` — the make.fun hand-in program (copies `game/` + `screenshots/`, writes `dossier.json`)
- `game/index.html` — the page
- `game/src/config.js` — tuning, recipes, palette, station layout
- `game/src/random.js` — seeded RNG
- `game/src/audio.js` — WebAudio beeps
- `game/src/input.js` — keyboard + mouse
- `game/src/world.js` — the kitchen simulation (chef, stations, orders, scoring)
- `game/src/render.js` — all canvas drawing
- `game/src/shots.js` — deterministic `?shot=start|play|end` screenshot scenes
- `game/src/main.js` — boot and the fixed-step game loop
- `screenshots/` — real renders of the game in a browser
