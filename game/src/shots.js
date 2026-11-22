import { CASE, DIAMOND, EXIT, ROOM, STEP } from './config.js';
import { EVENT_OVER, EVENT_WIN } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './config.js';

const START_STEPS = 90;
const PLAY_STEPS = 360;
const END_STEPS = 1500;

function autopilot(state) {
  if (state.caught || state.won) return { x: 0, y: 0 };
  if (state.alarm > 0.7) return { x: 0, y: 0 };

  let tx, ty;
  if (!state.diamondTaken) {
    tx = DIAMOND.x;
    ty = DIAMOND.y;
  } else {
    tx = EXIT.x + EXIT.w / 2;
    ty = EXIT.y + EXIT.h / 2;
  }

  const pcx = state.player.x + state.player.width / 2;
  const pcy = state.player.y + state.player.height / 2;
  const dx = tx - pcx;
  const dy = ty - pcy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 5) return { x: 0, y: 0 };

  return { x: dx / dist, y: dy / dist };
}

function autopilotPlay(state) {
  if (state.caught || state.won || state.diamondTaken || state.alarm > 0.7) {
    return { x: 0, y: 0 };
  }

  const pcx = state.player.x + state.player.width / 2;
  const pcy = state.player.y + state.player.height / 2;

  let tx, ty;
  if (!state.caseBroken) {
    tx = DIAMOND.x + 16;
    ty = DIAMOND.y + 20;
  } else if (state.alarm < 0.50) {
    tx = 890;
    ty = 270;
  } else {
    tx = CASE.x + CASE.w + 20;
    ty = CASE.y + CASE.h / 2;
  }

  const dx = tx - pcx;
  const dy = ty - pcy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 4) return { x: 0, y: 0 };

  return { x: dx / dist, y: dy / dist };
}

export function stageShot(name, world) {
  if (name === 'play') {
    world.reset(1);
    for (let i = 0; i < PLAY_STEPS; i++) {
      const dir = autopilotPlay(world.state);
      const events = world.step(STEP, dir, false);
      if (events & EVENT_OVER) break;
      if (events & EVENT_WIN) break;
    }
    return {
      screen: world.state.caught ? SCREEN_OVER : SCREEN_PLAY,
      best: world.state.score,
    };
  }

  if (name === 'end') {
    world.reset(1);
    for (let i = 0; i < END_STEPS; i++) {
      const dir = autopilot(world.state);
      const events = world.step(STEP, dir, false);
      if (events & EVENT_OVER) break;
      if (events & EVENT_WIN) break;
    }
    return {
      screen: world.state.won ? SCREEN_WIN : SCREEN_OVER,
      best: world.state.score,
    };
  }

  world.reset(1);
  for (let i = 0; i < START_STEPS; i++) {
    world.step(STEP, { x: 0, y: 0 }, true);
  }
  return { screen: SCREEN_TITLE, best: 0 };
}