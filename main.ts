// Midnight Vault: a make.fun heist-game entry. You sneak through a gallery after hours,
// dodging guards and laser grids to lift the prize from the vault — a stealth puzzle played
// right in the browser, no install and no network.
//
// This program hands the game in: it copies game/ and screenshots/ from beside this file
// into the output directory (MAKEFUN_OUTPUT_DIR, default /output), walks every deliverable
// to make sure nothing exceeds the scorer's caps, prints a one-line summary, and writes
// the dossier the judge reads.
//
// Serve locally:  node serve.ts  →  http://localhost:8080
// Run hand-in:    mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const SCREENSHOT_MAX = 4;
const SCREENSHOT_MAX_BYTES = 262144;
const GAME_MAX_FILES = 993;
const GAME_MAX_BYTES = 50331648; // 48 MiB
const TEXT_MAX_BYTES = 163840;
const GAME_PATH_MAX_BYTES = 1000;

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// ---- verification pass -------------------------------------------------

let gameFiles = 0;
let gameBytes = 0;
const stack = [join(out, 'game')];
while (stack.length > 0) {
  const dir = stack.pop()!;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) { stack.push(join(dir, entry.name)); continue; }
    if (!entry.isFile()) continue;
    gameFiles++;
    gameBytes += lstatSync(join(dir, entry.name)).size;
  }
}

let shotsCount = 0;
for (const entry of readdirSync(join(out, 'screenshots'), { withFileTypes: true })) {
  if (!entry.isFile() || entry.name.startsWith('.')) continue;
  shotsCount++;
  const size = lstatSync(join(out, 'screenshots', entry.name)).size;
  if (size > SCREENSHOT_MAX_BYTES) {
    console.error(`screenshots/${entry.name} is ${size} bytes, over the ${SCREENSHOT_MAX_BYTES}-byte cap.`);
    process.exit(1);
  }
}

if (gameFiles > GAME_MAX_FILES) {
  console.error(`game/ holds ${gameFiles} files, over the ${GAME_MAX_FILES}-file cap.`);
  process.exit(1);
}
if (gameBytes > GAME_MAX_BYTES) {
  const mib = (GAME_MAX_BYTES / (1024 * 1024)).toFixed(0);
  console.error(`game/ files total ${gameBytes} bytes, over the ${mib} MiB cap.`);
  process.exit(1);
}
if (shotsCount > SCREENSHOT_MAX) {
  console.error(`screenshots/ holds ${shotsCount} images, over the ${SCREENSHOT_MAX}-image cap.`);
  process.exit(1);
}

const kib = (gameBytes / 1024).toFixed(1);
console.log(`Handed in: ${gameFiles} game files (${kib} KiB) and ${shotsCount} screenshots.`);

// ---- dossier -----------------------------------------------------------

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: TEXT_MAX_BYTES,
    screenshots: { max: SCREENSHOT_MAX, max_bytes: SCREENSHOT_MAX_BYTES },
    game_max_files: GAME_MAX_FILES,
    game_max_bytes: GAME_MAX_BYTES,
    game_path_max_bytes: GAME_PATH_MAX_BYTES,
  }),
);