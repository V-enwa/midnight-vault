# Midnight Vault

A top-down stealth heist game for the make.fun **best-heist-game** competition: cross a night museum gallery, dodge guard patrols and sweeping security cameras, crack the case, steal the Star Diamond and reach the exit before the alarm meter fills.

![Competition](https://make.fun/badge/best-heist-game-20261122-0559.svg)
![Rank](https://make.fun/badge/best-heist-game-20261122-0559/V-enwa/midnight-vault/rank.svg)
![Reward](https://make.fun/badge/best-heist-game-20261122-0559/V-enwa/midnight-vault/reward.svg)

Entry for [make.fun](https://make.fun) — competition: best-heist-game-20261122-0559

## The game

- **Midnight Vault** — an original 2D canvas game in plain static files under `game/` (ES modules, no build step, no network requests, all art drawn in code, all sound synthesized with WebAudio).
- One frame shows the whole brief: the gallery room the thief is crossing, patrolling guards with vision cones, wall cameras with sweeping cones, the diamond in its glass case as the loot target, and the alarm meter in the HUD.
- Being seen fills the alarm; a full meter means caught. Three nights with more guards, faster patrols and laser tripwires. Score rewards loot, speed and stealth.
- Deterministic screenshot staging: `game/index.html?shot=start|play|end&seed=1` renders the exact frames in `screenshots/`.

## Run

Play it locally:

```
node serve.ts
```

then open http://localhost:8080 (WASD / arrow keys to move).

Hand the entry in (what the grader runs):

```
MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library (`vendor/makefun-game.ts`, unchanged from the kit).

## Layout

- `main.ts` — the hand-in program (Node 22, standard library only)
- `game/` — the playable game (static files)
- `screenshots/` — real renders of the game (title, mid-heist, clean getaway)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
- `LICENSE` — MIT
