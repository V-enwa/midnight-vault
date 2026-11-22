import { BEST_KEY, NIGHT_TIME, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_LOOT, EVENT_BREAK, EVENT_OVER, EVENT_WIN } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, createInput } from './input.js';
import { createSound } from './sound.js';
import { createRenderer, SCREEN_PLAY as SR_PLAY, SCREEN_TITLE as SR_TITLE, SCREEN_OVER as SR_OVER, SCREEN_WIN as SR_WIN, SCREEN_PAUSED } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const random = createRandom(seed);
const world = createWorld(random);
const sound = createSound();
const renderer = createRenderer(canvas);

function readBest() {
  try { return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; } catch { return 0; }
}
function saveBest(v) {
  try { window.localStorage.setItem(BEST_KEY, String(v)); } catch {}
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let currentNight = 1;
  let winPending = false;
  let winTimer = 0;

  function announce(msg) { status.textContent = msg; }

  function startGame() {
    currentNight = 1;
    world.reset(1);
    accumulator = 0;
    winPending = false;
    winTimer = 0;
    screen = SCREEN_PLAY;
    announce('Night 1. Steal the Star Diamond.');
  }

  function nextNight() {
    if (currentNight < 3) {
      currentNight++;
      world.reset(currentNight);
      accumulator = 0;
      screen = SCREEN_PLAY;
      announce('Night ' + currentNight + '. Get out.');
    } else {
      screen = SCREEN_WIN;
      const total = world.state.score;
      if (total > best) { best = total; saveBest(best); }
      announce('Clean getaway! Score: ' + total);
      sound.winJingle();
    }
  }

  function endGame() {
    screen = SCREEN_OVER;
    announce('Caught! Score: ' + world.state.score);
    sound.sting();
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_CONFIRM) {
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_WIN) {
        sound.unmute();
        startGame();
      }
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, { x: 0, y: 0 }, true);
      return;
    }
    const dir = input.direction();
    const events = world.step(STEP, dir, false);

    if (winPending) {
      winTimer -= STEP;
      if (winTimer <= 0) nextNight();
      return;
    }

    if (events & EVENT_BREAK) {
      sound.caseBreak();
    }
    if (events & EVENT_LOOT) {
      sound.chime();
    }
    if (events & EVENT_WIN) {
      winPending = true;
      winTimer = 1.5;
      sound.chime();
      return;
    }
    if (events & EVENT_OVER) {
      endGame();
      return;
    }

    if (screen === SCREEN_PLAY) {
      sound.tick(STEP, world.state.alarm);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_PLAY || screen === SCREEN_TITLE) {
      while (accumulator >= STEP && (screen === SCREEN_PLAY || screen === SCREEN_TITLE)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Midnight Vault. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shotName) runShot(shotName);
else runGame();