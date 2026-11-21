// Wardens on patrol. A guard sees the player inside the vision cone when
// nothing blocks the sight line; light makes the player easier to spot.
// Detection fills a meter: ? (suspicious) -> ! (seen) -> bell rings and
// the guard walks over to investigate. Step out of the cone to recover.
import { LEVEL, sightBlocked, litAt } from './level.js';

export function makeGuards() {
  return LEVEL.guards.map((g) => ({
    name: g.name,
    x: g.x, y: g.y,
    speed: g.speed,
    coneLen: g.coneLen,
    coneHalf: g.coneHalf,
    waypoints: g.waypoints,
    wp: 1,
    angle: 0,
    state: 'PATROL', // PATROL | SUSPICIOUS | INVESTIGATING | HUNTED
    meter: 0,        // 0..1 detection meter for this guard
    mark: '',        // '?' or '!' shown above the head
    investigateX: 0, investigateY: 0,
    investigateTimer: 0,
    heardTimer: 0,
  }));
}

function angleTo(g, x, y) {
  return Math.atan2(y - g.y, x - g.x);
}

export function guardSees(g, p) {
  const d = Math.hypot(p.x - g.x, p.y - g.y);
  if (d > g.coneLen) return 0;
  let da = Math.abs(angleTo(g, p.x, p.y) - g.angle);
  if (da > Math.PI) da = 2 * Math.PI - da;
  if (da > g.coneHalf) return 0;
  if (sightBlocked(g.x, g.y, p.x, p.y)) return 0;
  // Closer and better lit = spotted faster. Deep shadow halves the rate.
  const lit = litAt(p.x, p.y) ? 1 : 0.45;
  const near = 1 - d / (g.coneLen * 1.4);
  return Math.max(0.12, near) * lit;
}

export function updateGuard(g, p, dt, onBell) {
  const seen = guardSees(g, p);
  if (seen > 0) {
    g.meter = Math.min(1, g.meter + seen * dt * 0.55);
  } else {
    g.meter = Math.max(0, g.meter - dt * 0.35);
  }
  if (g.meter >= 1) {
    if (g.state !== 'HUNTED') {
      g.state = 'HUNTED';
      g.mark = '!';
      g.investigateX = p.x;
      g.investigateY = p.y;
      g.investigateTimer = 6;
      onBell(g);
    }
  } else if (g.meter > 0.45) {
    g.state = 'SUSPICIOUS';
    g.mark = '?';
  } else if (g.state === 'SUSPICIOUS') {
    g.state = 'PATROL';
    g.mark = '';
  }

  if (g.state === 'HUNTED' || g.state === 'INVESTIGATING') {
    g.investigateTimer -= dt;
    walkToward(g, g.investigateX, g.investigateY, dt, g.speed * 1.35);
    g.angle = angleTo(g, g.investigateX, g.investigateY);
    if (Math.hypot(g.x - g.investigateX, g.y - g.investigateY) < 14 || g.investigateTimer <= 0) {
      g.state = 'PATROL';
      g.mark = '';
      g.meter = Math.min(g.meter, 0.4);
    }
    return;
  }

  // Patrol: walk the waypoint loop.
  const [tx, ty] = g.waypoints[g.wp];
  walkToward(g, tx, ty, dt, g.speed);
  g.angle = angleTo(g, tx, ty);
  if (Math.hypot(g.x - tx, g.y - ty) < 10) g.wp = (g.wp + 1) % g.waypoints.length;
}

function walkToward(g, tx, ty, dt, speed) {
  const d = Math.hypot(tx - g.x, ty - g.y);
  if (d < 1) return;
  g.x += ((tx - g.x) / d) * speed * dt;
  g.y += ((ty - g.y) / d) * speed * dt;
}

// A doused lamp makes the nearest guard curious after a short delay.
export function guardHeardLamp(g, lamp) {
  const d = Math.hypot(g.x - lamp.x, g.y - lamp.y);
  if (d > 420) return;
  if (g.state === 'PATROL') {
    g.state = 'INVESTIGATING';
    g.mark = '?';
    g.investigateX = lamp.x;
    g.investigateY = lamp.y;
    g.investigateTimer = 5;
  }
}

export function statusWord(guards) {
  let worst = 0;
  for (const g of guards) worst = Math.max(worst, g.meter);
  if (worst >= 1) return 'SEEN';
  if (worst > 0.66) return 'GLIMPSED';
  if (worst > 0.3) return 'SUSPICIOUS';
  if (worst > 0.05) return 'UNEASY';
  return 'HIDDEN';
}

export function alarmLabel(guards, bells) {
  if (bells >= 2) return 'ALARM';
  let worst = 0;
  for (const g of guards) worst = Math.max(worst, g.meter);
  if (worst >= 1 || bells >= 1) return 'HUNTED';
  if (worst > 0.45) return 'UNEASY';
  return 'CALM';
}
