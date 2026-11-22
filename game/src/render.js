import { CASE, CAMERA, DIAMOND, EXIT, FIELD, FONT, GUARD, LASER, PALETTE, ROOM, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './config.js';

export { SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN };

const TILE = 64;
const GUARD_VISUAL = 48;
const PLAYER_VISUAL = 36;

function cachedLabel(prefix) {
  let val = -999;
  let txt = '';
  return (v) => { if (v !== val) { val = v; txt = prefix + v; } return txt; };
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };

  const nightLabel = cachedLabel('NIGHT ');
  const lootLabel = cachedLabel('LOOT ');
  const timeLabel = cachedLabel('TIME ');
  const scoreLabel = cachedLabel('SCORE ');
  const bestLabel = cachedLabel('BEST ');
  const finalLabel = cachedLabel('SCORE ');

  function resize() {
    const r = window.devicePixelRatio || 1;
    const w = Math.round(window.innerWidth * r);
    const h = Math.round(window.innerHeight * r);
    canvas.width = w;
    canvas.height = h;
    view.scale = Math.min(w / FIELD.width, h / FIELD.height);
    view.x = (w - FIELD.width * view.scale) / 2;
    view.y = (h - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(t, x, y, s, c, a) {
    const key = s + '|' + a;
    if (!fonts.has(key)) fonts.set(key, `${s}px ${FONT}`);
    ctx.font = fonts.get(key);
    ctx.fillStyle = c;
    ctx.textAlign = a || 'left';
    ctx.fillText(t, x, y);
  }

  function fillRect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }

  function drawFloor() {
    const l = ROOM.left, t = ROOM.top, r = ROOM.right, b = ROOM.bottom;
    fillRect(l, t, r - l, b - t, PALETTE.floor1);
    for (let y = t; y < b; y += TILE) {
      for (let x = l; x < r; x += TILE) {
        if (((x - l) / TILE + (y - t) / TILE) % 2 === 1) {
          fillRect(x, y, TILE, TILE, PALETTE.floor2);
        }
      }
    }

    ctx.strokeStyle = PALETTE.wallTrim;
    ctx.lineWidth = 2;
    ctx.strokeRect(l - 1, t - 1, r - l + 2, b - t + 2);

    ctx.strokeStyle = PALETTE.wall;
    ctx.lineWidth = 6;
    ctx.strokeRect(l - 4, t - 4, r - l + 8, b - t + 8);
  }

  function drawRug() {
    const cx = ROOM.cx, cy = ROOM.cy;
    const rw = 280, rh = 180;
    const x = cx - rw / 2, y = cy - rh / 2;
    fillRect(x, y, rw, rh, PALETTE.rug);
    ctx.strokeStyle = PALETTE.rugBorder;
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 12, y + 12, rw - 24, rh - 24);
    ctx.strokeRect(x + 8, y + 8, rw - 16, rh - 16);
    const icx = x + rw / 2, icy = y + rh / 2;
    const iw = 60, ih = 40;
    fillRect(icx - iw / 2, icy - ih / 2, iw, ih, PALETTE.rugBorder);
  }

  function drawColumns() {
    const colW = 24, colH = 80;
    const positions = [
      [ROOM.left + 40, ROOM.top + 40],
      [ROOM.right - 64, ROOM.top + 40],
      [ROOM.left + 40, ROOM.bottom - 120],
      [ROOM.right - 64, ROOM.bottom - 120],
    ];
    for (const [cx, cy] of positions) {
      fillRect(cx - colW / 2, cy - colH / 2, colW, colH, PALETTE.column);
      fillRect(cx - colW / 2 - 4, cy - colH / 2, colW + 8, 8, PALETTE.columnCap);
      fillRect(cx - colW / 2 - 4, cy + colH / 2 - 8, colW + 8, 8, PALETTE.columnCap);
    }
  }

  function drawPaintings() {
    const frames = [
      [ROOM.left + 120, ROOM.top + 24, 60, 40, '#3a2a42', '#5a4a62'],
      [ROOM.cx - 40, ROOM.top + 24, 80, 40, '#2a3a42', '#4a5a62'],
      [ROOM.right - 180, ROOM.top + 24, 60, 40, '#423a2a', '#625a4a'],
    ];
    for (const [x, y, w, h, c1, c2] of frames) {
      fillRect(x, y, w, h, PALETTE.painting);
      ctx.fillStyle = c1;
      ctx.fillRect(x + 4, y + 4, w - 12, h - 8);
      ctx.fillStyle = c2;
      ctx.fillRect(x + 12, y + h / 2 - 4, w - 24, 8);
      ctx.strokeStyle = PALETTE.paintingFrame;
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
    }
  }

  function drawStatues() {
    const statues = [
      [ROOM.cx - 200, ROOM.cy + 120],
      [ROOM.cx + 200, ROOM.cy - 120],
    ];
    for (const [sx, sy] of statues) {
      fillRect(sx - 8, sy - 16, 16, 32, PALETTE.statue);
      ctx.beginPath();
      ctx.arc(sx, sy - 18, 8, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.statue;
      ctx.fill();
    }
  }

  function drawExit(diamondTaken) {
    const x = EXIT.x, y = EXIT.y, w = EXIT.w, h = EXIT.h;
    fillRect(x, y, w, h, PALETTE.exitDoor);
    ctx.strokeStyle = PALETTE.wallTrim;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    if (diamondTaken) {
      const glowSize = 8;
      ctx.shadowColor = PALETTE.exitLit;
      ctx.shadowBlur = glowSize + 10;
      ctx.strokeStyle = PALETTE.exitLit;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
      ctx.shadowBlur = 0;

      ctx.fillStyle = PALETTE.exitGlow;
      ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
      ctx.fillStyle = PALETTE.exitLit;
      fillRect(x + w / 2 - 4, y + h / 2 - 16, 8, 32, PALETTE.exitLit);
      fillRect(x + w / 2 - 16, y + h / 2 - 4, 32, 8, PALETTE.exitLit);
    }
  }

  function drawCase(state) {
    const x = CASE.x, y = CASE.y, w = CASE.w, h = CASE.h;
    fillRect(x, y, w, h, PALETTE.caseGlass);
    ctx.strokeStyle = PALETTE.caseFrame;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = PALETTE.caseEdge;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 8);
    ctx.lineTo(x + w * 0.35, y + 8);
    ctx.lineTo(x + 8, y + h * 0.35);
    ctx.closePath();
    ctx.fill();

    if (state.caseBroken) {
      ctx.fillStyle = 'rgba(200,200,220,0.15)';
      for (let i = 0; i < 5; i++) {
        const sx = x + (i * 23 + 5) % w;
        const sy = y + (i * 17 + 10) % h;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 3 - i, sy + 6 + i);
        ctx.lineTo(sx - 2, sy + 3);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  function drawDiamond(state, t) {
    if (state.diamondTaken) return;
    const dx = DIAMOND.x, dy = DIAMOND.y, r = DIAMOND.radius;

    ctx.fillStyle = PALETTE.diamondGlow;
    ctx.beginPath();
    ctx.arc(dx, dy, r + 7 + Math.sin(t * 3) * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = PALETTE.diamond;
    ctx.beginPath();
    ctx.moveTo(dx, dy - r);
    ctx.lineTo(dx + r * 0.7, dy);
    ctx.lineTo(dx, dy + r * 0.7);
    ctx.lineTo(dx - r * 0.7, dy);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = PALETTE.diamondInner;
    ctx.beginPath();
    ctx.moveTo(dx, dy - r * 0.55);
    ctx.lineTo(dx + r * 0.4, dy + r * 0.05);
    ctx.lineTo(dx, dy + r * 0.35);
    ctx.lineTo(dx - r * 0.4, dy + r * 0.05);
    ctx.closePath();
    ctx.fill();

    for (let i = 0; i < 8; i++) {
      const a = Math.sin(t * 4 + i * 1.2);
      const px = dx + (a * 0.6 + 0.4) * (Math.cos(i * 1.1 + t * 2) * (r + 12));
      const py = dy + (a * 0.4 + 0.3) * (Math.sin(i * 1.1 + t * 2) * (r + 12));
      const alpha = 0.3 + a * 0.5;
      ctx.fillStyle = `rgba(180,250,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCone(cx, cy, facing, halfAngle, range, color, alpha) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, range, facing - halfAngle, facing + halfAngle);
    ctx.closePath();
    ctx.clip();

    if (typeof color === 'string' && color.startsWith('rgba')) {
      ctx.fillStyle = color;
      ctx.fillRect(cx - range, cy - range, range * 2, range * 2);
    } else {
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, range);
      grad.addColorStop(0, `rgba(${color},${alpha + 0.04})`);
      grad.addColorStop(0.4, `rgba(${color},${alpha * 0.5})`);
      grad.addColorStop(1, `rgba(${color},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(cx - range, cy - range, range * 2, range * 2);
    }
    ctx.restore();
  }

  function drawGuard(g) {
    const s = GUARD_VISUAL;
    drawCone(g.x, g.y, g.facing, GUARD.coneAngle, g.range, PALETTE.coneGuard, 0.12);

    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.facing);

    ctx.fillStyle = PALETTE.guardBody;
    ctx.fillRect(-s * 0.14, s * 0.12, s * 0.13, s * 0.28);
    ctx.fillRect(s * 0.02, s * 0.12, s * 0.13, s * 0.28);

    ctx.fillStyle = PALETTE.guardShoulder;
    ctx.fillRect(-s * 0.40, -s * 0.28, s * 0.80, s * 0.13);

    ctx.fillStyle = PALETTE.guardBody;
    ctx.fillRect(-s * 0.30, -s * 0.24, s * 0.60, s * 0.54);

    ctx.fillStyle = '#1a1a24';
    ctx.fillRect(-s * 0.34, s * 0.08, s * 0.68, s * 0.06);

    ctx.fillStyle = PALETTE.guardHead;
    ctx.beginPath();
    ctx.arc(0, -s * 0.30, s * 0.20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1a1424';
    ctx.fillRect(-s * 0.24, -s * 0.48, s * 0.48, s * 0.07);

    ctx.fillStyle = PALETTE.guardShoulder;
    ctx.beginPath();
    ctx.arc(0, -s * 0.42, s * 0.18, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = PALETTE.guardBody;
    ctx.fillRect(s * 0.10, s * 0.02, s * 0.22, s * 0.07);

    ctx.restore();
  }

  function drawCameraShape(c) {
    const s = c.size;
    ctx.fillStyle = '#4a2028';
    ctx.fillRect(c.x - s, c.y - s * 0.5, s * 2, s * 1.0);
    ctx.fillStyle = '#801020';
    ctx.beginPath();
    ctx.arc(c.x, c.y, s * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#200808';
    ctx.beginPath();
    ctx.arc(c.x + Math.cos(c.angle) * 3, c.y + Math.sin(c.angle) * 3, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawLasers(night, t) {
    if (night < 2) return;
    const lines = LASER.lines;
    for (const line of lines) {
      const [x1, y1] = line[0];
      const [x2, y2] = line[1];
      ctx.strokeStyle = PALETTE.laserGlow;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.strokeStyle = PALETTE.laser;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.setLineDash([8, 4]);
      ctx.lineDashOffset = -t * 40;
      ctx.stroke();
      ctx.setLineDash([]);

      for (const [ex, ey] of [[x1, y1], [x2, y2]]) {
        ctx.fillStyle = PALETTE.laserEmitter;
        ctx.fillRect(ex - 6, ey - 10, 12, 20);
        ctx.fillStyle = PALETTE.laser;
        ctx.beginPath();
        ctx.arc(ex, ey, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawPlayer(state) {
    const p = state.player;
    const cx = p.x + p.width / 2;
    const cy = p.y + p.height / 2;
    const s = PLAYER_VISUAL;
    const dx = p.dirX || 0;
    const dy = p.dirY || 1;

    ctx.save();
    ctx.translate(cx, cy);
    const a = Math.atan2(dy, dx);

    ctx.fillStyle = PALETTE.playerCloak;
    ctx.beginPath();
    ctx.moveTo(-s * 0.45, s * 0.35);
    ctx.lineTo(s * 0.45, s * 0.35);
    ctx.lineTo(s * 0.30, -s * 0.15);
    ctx.lineTo(-s * 0.30, -s * 0.15);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = PALETTE.playerHood;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = PALETTE.playerHood;
    ctx.beginPath();
    ctx.arc(0, -s * 0.20, s * 0.30, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = PALETTE.playerFace;
    ctx.beginPath();
    ctx.arc(0, -s * 0.14, s * 0.20, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#e0d8c8';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    const ex = Math.cos(a) * s * 0.10;
    const ey = Math.sin(a) * s * 0.10 - s * 0.16;
    ctx.fillStyle = '#e8e0d0';
    ctx.beginPath();
    ctx.arc(ex - 2, ey, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex + 2, ey, 1.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#8a6a40';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.20, -s * 0.10);
    ctx.lineTo(s * 0.30, s * 0.00);
    ctx.stroke();

    ctx.fillStyle = '#8a6a40';
    ctx.beginPath();
    ctx.arc(s * 0.38, s * 0.12, s * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a08058';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (state.diamondTaken) {
      ctx.fillStyle = PALETTE.diamond;
      ctx.beginPath();
      ctx.moveTo(s * 0.36, s * 0.02);
      ctx.lineTo(s * 0.43, s * 0.10);
      ctx.lineTo(s * 0.36, s * 0.17);
      ctx.lineTo(s * 0.29, s * 0.10);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = PALETTE.diamondGlow;
      ctx.beginPath();
      ctx.arc(s * 0.36, s * 0.10, s * 0.20, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawHud(state) {
    const barY = 10, barH = 16, barW = 240, barX = FIELD.width / 2 - barW / 2;
    fillRect(barX - 1, barY - 1, barW + 2, barH + 2, 'rgba(0,0,0,0.6)');
    fillRect(barX, barY, barW, barH, '#111');

    const frac = state.alarm;
    let color;
    if (frac < 0.4) color = PALETTE.alarmLow;
    else if (frac < 0.7) color = PALETTE.alarmMid;
    else color = PALETTE.alarmHigh;
    fillRect(barX, barY, barW * frac, barH, color);

    if (frac > 0) {
      ctx.fillStyle = `rgba(255,255,255,${0.15 + frac * 0.3})`;
      ctx.fillRect(barX, barY, barW * frac, barH * 0.4);
    }

    ctx.strokeStyle = PALETTE.textMuted;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.textBaseline = 'middle';
    text('ALARM', barX - 8, barY + barH / 2, 12, PALETTE.textMuted, 'right');

    text(nightLabel(state.night), 20, 54, 16, PALETTE.textAccent, 'left');
    text('TIME ' + Math.ceil(Math.max(0, state.timeLeft)), 20, 74, 13, PALETTE.textPri, 'left');

    if (state.diamondTaken) {
      text('DIAMOND', FIELD.width - 20, 54, 14, PALETTE.diamond, 'right');
    } else if (state.caseBroken) {
      text('GRAB IT', FIELD.width - 20, 54, 14, PALETTE.textAccent, 'right');
    }

    text(scoreLabel(state.score), FIELD.width - 20, 74, 13, PALETTE.textPri, 'right');

    const breakFrac = state.caseBreakTimer / CASE.breakTime;
    if (state.breaking && !state.caseBroken) {
      const pw = 100, ph = 6, px = CASE.x + CASE.w / 2 - pw / 2, py = CASE.y - 16;
      fillRect(px, py, pw, ph, '#111');
      fillRect(px, py, pw * breakFrac, ph, PALETTE.titleGold);
      text('BREAKING...', CASE.x + CASE.w / 2, py - 6, 10, PALETTE.textMuted, 'center');
    }
  }

  function drawVignette() {
    const grad = ctx.createRadialGradient(FIELD.width / 2, FIELD.height / 2, FIELD.width * 0.35, FIELD.width / 2, FIELD.height / 2, FIELD.width * 0.7);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, PALETTE.vignette);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }

  function drawPanel(title, lines, prompt) {
    const w = 540, lineH = 30, topPad = 90, botPad = 70;
    const h = topPad + lines.length * lineH + botPad;
    const x = (FIELD.width - w) / 2;
    const y = (FIELD.height - h) / 2;

    fillRect(x, y, w, h, PALETTE.panel);
    ctx.strokeStyle = PALETTE.panelBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.textBaseline = 'alphabetic';
    text(title, FIELD.width / 2, y + 72, 44, PALETTE.titleGold, 'center');
    for (let i = 0; i < lines.length; i++) {
      text(lines[i], FIELD.width / 2, y + topPad + i * lineH, 18, PALETTE.textMuted, 'center');
    }
    text(prompt, FIELD.width / 2, y + h - 36, 18, PALETTE.textAccent, 'center');
  }

  function draw(state, screen, best) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const t = performance.now() / 1000;
    fillRect(0, 0, canvas.width, canvas.height, PALETTE.backdrop);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);

    ctx.save();
    fillRect(0, 0, FIELD.width, FIELD.height, PALETTE.wall);
    ctx.restore();

    drawFloor();
    drawRug();
    drawColumns();
    drawPaintings();
    drawStatues();
    drawExit(state.diamondTaken);

    drawCase(state);
    drawDiamond(state, t);
    drawLasers(state.night, t);

    for (const c of state.cameras) {
      drawCone(c.x, c.y, c.angle, CAMERA.coneAngle, c.range, PALETTE.coneCamera, 0.07);
      drawCameraShape(c);
    }

    for (const g of state.guards) {
      drawGuard(g);
    }

    drawPlayer(state);
    drawVignette();

    if (screen === SCREEN_PLAY) {
      drawHud(state);
    } else if (screen === SCREEN_TITLE) {
      drawHud(state);
      fillRect(0, 0, FIELD.width, FIELD.height, 'rgba(0,0,0,0.40)');
      drawPanel('MIDNIGHT VAULT', [
        'A top-down museum heist.',
        'Steal the Star Diamond and escape.',
        '',
        'Move: WASD / Arrow keys   Restart: R / click',
        'Pause: P / Escape',
        '',
        bestLabel(best),
      ], 'Press Space or click to start');
    } else if (screen === SCREEN_OVER) {
      drawHud(state);
      fillRect(0, 0, FIELD.width, FIELD.height, 'rgba(0,0,0,0.45)');
      drawPanel('CAUGHT', [
        'The alarm was raised.',
        '',
        finalLabel(state.score),
        bestLabel(best),
      ], 'Press R or click to retry');
    } else if (screen === SCREEN_PAUSED) {
      drawHud(state);
      fillRect(0, 0, FIELD.width, FIELD.height, 'rgba(0,0,0,0.35)');
      drawPanel('PAUSED', [
        'Take your time.',
      ], 'Press P or Escape to resume');
    } else if (screen === SCREEN_WIN) {
      drawHud(state);
      fillRect(0, 0, FIELD.width, FIELD.height, 'rgba(0,0,0,0.40)');
      drawPanel('CLEAN GETAWAY', [
        'The diamond is yours.',
        '',
        finalLabel(state.score),
        bestLabel(best),
      ], 'Press R or click to play again');
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}