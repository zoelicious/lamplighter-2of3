// The lamplighter: moves with WASD / arrows, douses lamps with a click.
import { LEVEL, pointInRect, litAt } from './level.js';

export function makePlayer() {
  return {
    x: LEVEL.playerStart.x,
    y: LEVEL.playerStart.y,
    r: 13,
    speed: 150,
    keys: 0,
    doused: 0,
    moving: false,
    // How lit the player is right now: 0 = deep shadow, 1 = full lamp light.
    litAmount: 0,
  };
}

export function movePlayer(p, keys, dt) {
  let dx = 0, dy = 0;
  if (keys.has('arrowup') || keys.has('w')) dy -= 1;
  if (keys.has('arrowdown') || keys.has('s')) dy += 1;
  if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
  if (keys.has('arrowright') || keys.has('d')) dx += 1;
  p.moving = dx !== 0 || dy !== 0;
  if (!p.moving) return;
  const len = Math.hypot(dx, dy);
  const nx = p.x + (dx / len) * p.speed * dt;
  const ny = p.y + (dy / len) * p.speed * dt;
  if (!collides(nx, p.y, p.r)) p.x = nx;
  if (!collides(p.x, ny, p.r)) p.y = ny;
  p.x = Math.max(24, Math.min(LEVEL.width - 24, p.x));
  p.y = Math.max(24, Math.min(LEVEL.height - 24, p.y));
}

function collides(x, y, r) {
  for (const s of [...LEVEL.walls, ...LEVEL.cover]) {
    if (x + r > s.x && x - r < s.x + s.w && y + r > s.y && y - r < s.y + s.h) return true;
  }
  return false;
}

// Click a lit lamp to douse it. Returns the lamp, or null.
export function tryDouse(p, mx, my) {
  for (const lamp of LEVEL.lamps) {
    if (!lamp.lit) continue;
    const d = Math.hypot(mx - lamp.x, my - lamp.y);
    const pd = Math.hypot(p.x - lamp.x, p.y - lamp.y);
    if (d < 26 && pd < 170) {
      lamp.lit = false;
      p.doused += 1;
      return lamp;
    }
  }
  return null;
}

export function updatePlayerLight(p) {
  p.litAmount = litAt(p.x, p.y) ? 1 : 0;
}

export function collectKeys(p) {
  for (const k of LEVEL.keys) {
    if (!k.taken && Math.hypot(p.x - k.x, p.y - k.y) < 26) {
      k.taken = true;
      p.keys += 1;
      return k;
    }
  }
  return null;
}

export function atExit(p) {
  const e = LEVEL.exit;
  return pointInRect(p.x, p.y, { x: e.x - 10, y: e.y - 10, w: e.w + 20, h: e.h + 20 });
}
