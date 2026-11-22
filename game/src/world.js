import { ALARM, CAMERA, CASE, DIAMOND, EXIT, FIELD, GUARD, LASER, NIGHT_TIME, PLAYER, ROOM, STEP } from './config.js';

export const EVENT_OVER = 1;
export const EVENT_WIN = 2;
export const EVENT_LOOT = 4;
export const EVENT_BREAK = 8;

function norm(a) {
  let r = a % (Math.PI * 2);
  if (r > Math.PI) r -= Math.PI * 2;
  if (r < -Math.PI) r += Math.PI * 2;
  return r;
}

function pointInCone(px, py, cx, cy, facing, halfAngle, range) {
  const dx = px - cx;
  const dy = py - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > range) return false;
  if (dist < 2) return true;
  const a = norm(Math.atan2(dy, dx) - facing);
  return Math.abs(a) <= halfAngle;
}

function segmentIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

function rectCrossesLine(rx, ry, rw, rh, lx1, ly1, lx2, ly2) {
  const corners = [
    [rx, ry], [rx + rw, ry], [rx + rw, ry + rh], [rx, ry + rh],
  ];
  for (let i = 0; i < 4; i++) {
    if (segmentIntersect(corners[i][0], corners[i][1], corners[(i + 1) % 4][0], corners[(i + 1) % 4][1], lx1, ly1, lx2, ly2)) return true;
  }
  return false;
}

function makeGuard(random, night, path) {
  const speed = GUARD.speed[night - 1] + random() * 15;
  const range = GUARD.coneRange[night - 1];
  const start = path[0];
  return {
    x: start[0], y: start[1],
    speed, range, path, pathIdx: 0, forward: true,
    facing: 0, size: GUARD.size,
  };
}

function makeCamera(random, night, pos) {
  const range = CAMERA.coneRange[night - 1];
  const sweepSpd = CAMERA.sweepSpeed[night - 1] + random() * 0.2;
  const arc = CAMERA.sweepArc[night - 1];
  let center;
  if (pos[1] === 72) center = Math.PI / 2;
  else if (pos[1] === ROOM.bottom) center = -Math.PI / 2;
  else if (pos[0] === 72) center = 0;
  else center = Math.PI;
  return {
    x: pos[0], y: pos[1], range, sweepSpd, arc, center,
    angle: center + random() * arc - arc / 2,
    dir: random() > 0.5 ? 1 : -1,
    size: CAMERA.size,
  };
}

export function createWorld(random) {
  const player = { x: 0, y: 0, width: PLAYER.size, height: PLAYER.size, dirX: 0, dirY: 1 };
  const guards = [];
  const cameras = [];
  let night = 1;
  let timeLeft = NIGHT_TIME[0];
  let alarm = 0;
  let maxAlarm = 0;
  let score = 0;
  let diamondTaken = false;
  let caseBroken = false;
  let caseBreakTimer = 0;
  let won = false;
  let caught = false;
  let breaking = false;
  let elapsed = 0;
  let pendingEvents = 0;

  function updateFacing() {
    if (player.dirX !== 0 || player.dirY !== 0) {
      const len = Math.sqrt(player.dirX * player.dirX + player.dirY * player.dirY);
      player.dirX /= len;
      player.dirY /= len;
    }
  }

  function reset(n) {
    night = n || 1;
    player.x = ROOM.left + 40;
    player.y = ROOM.cy - PLAYER.size / 2;
    player.dirX = 0;
    player.dirY = 1;
    diamondTaken = false;
    caseBroken = false;
    caseBreakTimer = 0;
    won = false;
    caught = false;
    alarm = 0;
    maxAlarm = 0;
    breaking = false;
    elapsed = 0;
    timeLeft = NIGHT_TIME[night - 1];
    pendingEvents = 0;

    guards.length = 0;
    cameras.length = 0;

    const nightIdx = night - 1;
    const guardPaths = GUARD.paths.slice();
    for (let i = 0; i < 2 + nightIdx; i++) {
      let path;
      if (i < 2) {
        path = guardPaths[i];
      } else {
        path = [
          [ROOM.left + 100 + i * 200, ROOM.top + 80],
          [ROOM.left + 100 + i * 200, ROOM.bottom - 80],
        ];
      }
      guards.push(makeGuard(random, night, path));
    }

    const camPositions = CAMERA.positions.slice(0, 2 + nightIdx);
    for (const pos of camPositions) {
      cameras.push(makeCamera(random, night, pos));
    }
  }

  function moveGuards(dt) {
    for (const g of guards) {
      const path = g.path;
      if (path.length < 2) continue;
      const target = g.forward ? path[g.pathIdx] : path[g.pathIdx === 0 ? path.length - 1 : g.pathIdx - 1];
      const tgt = g.forward ? path[g.pathIdx] : path[g.pathIdx > 0 ? g.pathIdx - 1 : path.length - 1];
      const dx = tgt[0] - g.x;
      const dy = tgt[1] - g.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 2) {
        if (g.forward) {
          g.pathIdx = (g.pathIdx + 1) % path.length;
          if (g.pathIdx === 0) g.forward = false;
        } else {
          if (g.pathIdx === 0) g.forward = true;
          else g.pathIdx -= 1;
        }
        continue;
      }
      const nx = dx / dist;
      const ny = dy / dist;
      g.x += nx * g.speed * dt;
      g.y += ny * g.speed * dt;
      g.facing = Math.atan2(ny, nx);
    }
  }

  function moveCameras(dt) {
    for (const c of cameras) {
      c.angle += c.sweepSpd * c.dir * dt;
      const halfArc = c.arc / 2;
      if (c.angle > c.center + halfArc) { c.angle = c.center + halfArc; c.dir = -1; }
      if (c.angle < c.center - halfArc) { c.angle = c.center - halfArc; c.dir = 1; }
    }
  }

  function step(dt, dir, harmless) {
    pendingEvents = 0;

    if (dir) {
      let dx = dir.x || 0;
      let dy = dir.y || 0;
      if (dx || dy) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;
      }
      player.x += dx * PLAYER.speed * dt;
      player.y += dy * PLAYER.speed * dt;
      player.dirX = dx;
      player.dirY = dy || 0.01;
      updateFacing();
    }

    player.x = Math.max(ROOM.left, Math.min(ROOM.right - player.width, player.x));
    player.y = Math.max(ROOM.top, Math.min(ROOM.bottom - player.height, player.y));

    if (harmless) {
      moveGuards(dt);
      moveCameras(dt);
      return 0;
    }

    if (won || caught) return 0;

    moveGuards(dt);
    moveCameras(dt);
    elapsed += dt;
    timeLeft -= dt;
    if (timeLeft <= 0) { caught = true; pendingEvents |= EVENT_OVER; return pendingEvents; }

    // Case breaking
    if (!caseBroken && !diamondTaken) {
      const pcx = player.x + player.width / 2;
      const pcy = player.y + player.height / 2;
      const ccx = CASE.x + CASE.w / 2;
      const ccy = CASE.y + CASE.h / 2;
      const dist = Math.sqrt((pcx - ccx) ** 2 + (pcy - ccy) ** 2);
      if (dist < CASE.w / 2 + 12) {
        caseBreakTimer += dt;
        if (caseBreakTimer >= CASE.breakTime) {
          caseBroken = true;
          alarm = Math.min(ALARM.max, alarm + CASE.alarm);
          maxAlarm = Math.max(maxAlarm, alarm);
          pendingEvents |= EVENT_BREAK;
        }
      } else {
        caseBreakTimer = Math.max(0, caseBreakTimer - dt * 2);
      }
    }

    // Diamond pickup
    if (caseBroken && !diamondTaken) {
      const pcx = player.x + player.width / 2;
      const pcy = player.y + player.height / 2;
      const dist = Math.sqrt((pcx - DIAMOND.x) ** 2 + (pcy - DIAMOND.y) ** 2);
      if (dist < DIAMOND.radius + 10) {
        diamondTaken = true;
        pendingEvents |= EVENT_LOOT;
      }
    }

    // Exit
    if (diamondTaken) {
      if (
        player.x + player.width > EXIT.x &&
        player.x < EXIT.x + EXIT.w &&
        player.y + player.height > EXIT.y &&
        player.y < EXIT.y + EXIT.h
      ) {
        const timeScore = Math.round(timeLeft * 10);
        const stealthScore = Math.round((1 - maxAlarm) * 500);
        score += DIAMOND.value + timeScore + stealthScore;
        won = true;
        pendingEvents |= EVENT_WIN;
        return pendingEvents;
      }
    }

    // Detection
    let detected = false;
    const pcx = player.x + player.width / 2;
    const pcy = player.y + player.height / 2;

    for (const g of guards) {
      if (pointInCone(pcx, pcy, g.x, g.y, g.facing, GUARD.coneAngle, g.range)) {
        detected = true;
        break;
      }
    }
    if (!detected) {
      for (const c of cameras) {
        if (pointInCone(pcx, pcy, c.x, c.y, c.angle, CAMERA.coneAngle, c.range)) {
          detected = true;
          break;
        }
      }
    }

    // Lasers
    if (night >= 2) {
      const laserLines = LASER.lines;
      for (const line of laserLines) {
        const swapped = line[0][0] > line[1][0];
        const x1 = swapped ? line[1][0] : line[0][0];
        const y1 = swapped ? line[1][1] : line[0][1];
        const x2 = swapped ? line[0][0] : line[1][0];
        const y2 = swapped ? line[0][1] : line[1][1];
        if (rectCrossesLine(player.x, player.y, player.width, player.height, x1, y1, x2, y2)) {
          detected = true;
          alarm = Math.min(ALARM.max, alarm + LASER.damage);
          maxAlarm = Math.max(maxAlarm, alarm);
          break;
        }
      }
    }

    if (detected) {
      alarm = Math.min(ALARM.max, alarm + ALARM.fillRate * dt);
      maxAlarm = Math.max(maxAlarm, alarm);
    } else {
      alarm = Math.max(0, alarm - ALARM.drainRate * dt);
    }

    if (alarm >= ALARM.max) {
      caught = true;
      pendingEvents |= EVENT_OVER;
    }

    return pendingEvents;
  }

  const state = {
    get player() { return player; },
    get guards() { return guards; },
    get cameras() { return cameras; },
    get night() { return night; },
    get alarm() { return alarm; },
    get maxAlarm() { return maxAlarm; },
    get score() { return score; },
    get diamondTaken() { return diamondTaken; },
    get caseBroken() { return caseBroken; },
    get caseBreakTimer() { return caseBreakTimer; },
    get won() { return won; },
    get caught() { return caught; },
    get timeLeft() { return timeLeft; },
    get elapsed() { return elapsed; },
    get breaking() { return caseBreakTimer > 0 && !caseBroken; },
  };

  reset(1);
  return { state, reset, step };
}