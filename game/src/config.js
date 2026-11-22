export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 60;

export const ROOM = {
  margin: 72,
  get left() { return this.margin; },
  get top() { return this.margin; },
  get right() { return FIELD.width - this.margin; },
  get bottom() { return FIELD.height - this.margin; },
  get cx() { return FIELD.width / 2; },
  get cy() { return FIELD.height / 2; },
  get iw() { return FIELD.width - this.margin * 2; },
  get ih() { return FIELD.height - this.margin * 2; },
};

export const PLAYER = {
  size: 16,
  speed: 200,
};

export const GUARD = {
  size: 18,
  speed: [60, 75, 95],
  coneAngle: Math.PI / 5,
  coneRange: [230, 255, 280],
  paths: [
    [[220, 160], [520, 160], [520, 560], [220, 560]],
    [[720, 160], [1060, 160], [1060, 560], [720, 560]],
  ],
};

export const CAMERA = {
  size: 14,
  coneAngle: Math.PI / 7,
  coneRange: [350, 380, 410],
  sweepSpeed: [0.7, 0.9, 1.2],
  sweepArc: [Math.PI / 2.8, Math.PI / 2.4, Math.PI / 2.2],
  positions: [
    [350, 72],
    [950, 72],
    [1280 - 72, 360],
    [550, 720 - 72],
  ],
};

export const LASER = {
  damage: 0.18,
  lines: [
    [[220, 72], [180, 200]],
    [[1060, 72], [1100, 200]],
    [[180, 648], [220, 520]],
    [[1100, 648], [1060, 520]],
  ],
};

export const ALARM = {
  fillRate: 0.28,
  drainRate: 0.12,
  max: 1.0,
};

export const CASE = {
  x: FIELD.width / 2 - 56,
  y: FIELD.height / 2 - 56,
  w: 112,
  h: 112,
  alarm: 0.32,
  breakTime: 0.6,
};

export const DIAMOND = {
  value: 2500,
  x: FIELD.width / 2,
  y: FIELD.height / 2,
  radius: 10,
};

export const EXIT = {
  x: FIELD.width - ROOM.margin - 40,
  y: FIELD.height / 2 - 44,
  w: 38,
  h: 88,
};

export const NIGHT_TIME = [65, 55, 45];

export const PALETTE = {
  backdrop: '#080810',
  wall: '#1a1424',
  wallTrim: '#2c2038',
  floor1: '#4a4258',
  floor2: '#605870',
  rug: '#5a1420',
  rugBorder: '#7a2834',
  guardBody: '#3a4a6a',
  guardHead: '#2e3858',
  guardShoulder: '#405a7a',
  coneGuard: 'rgba(240, 180, 40, 0.16)',
  coneCamera: 'rgba(220, 80, 40, 0.15)',
  playerCloak: '#282840',
  playerHood: '#202040',
  playerFace: '#a09880',
  diamond: '#00f4ff',
  diamondInner: '#90f8ff',
  diamondGlow: 'rgba(0, 244, 255, 0.50)',
  caseGlass: 'rgba(80, 170, 220, 0.24)',
  caseFrame: '#506878',
  caseEdge: '#608090',
  exitDoor: '#3a3a40',
  exitGlow: 'rgba(0, 200, 100, 0.30)',
  exitLit: '#00c860',
  laser: '#e03040',
  laserGlow: 'rgba(220, 40, 50, 0.25)',
  laserEmitter: '#4a2030',
  hudBg: 'rgba(6, 6, 14, 0.82)',
  textPri: '#e2dcd0',
  textAccent: '#c8a040',
  textMuted: '#888070',
  alarmLow: '#30b068',
  alarmMid: '#d8b038',
  alarmHigh: '#e04040',
  panel: 'rgba(10, 8, 16, 0.94)',
  panelBorder: '#2a2030',
  titleGold: '#c8a848',
  statue: '#3e3832',
  column: '#363230',
  columnCap: '#464240',
  painting: '#282236',
  paintingFrame: '#5a4030',
  vignette: 'rgba(0, 0, 0, 0.18)',
};

export const FONT = 'ui-monospace, "Cascadia Code", "SF Mono", "Fira Code", monospace';
export const BEST_KEY = 'midnight-vault.best';
export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';