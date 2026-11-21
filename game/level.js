// Level data: one dusk coastal town square, Level 1 of 3.
// Walls and crates block sight; lamps light pools; dark patches are safe.
export const LEVEL = {
  name: 'Night 1',
  levelLabel: 'Level 1/3',
  width: 1280,
  height: 800,
  // Buildings (solid, block sight and movement)
  walls: [
    { x: 60,  y: 90,  w: 190, h: 120, label: 'Tavern' },
    { x: 330, y: 70,  w: 150, h: 100, label: 'Chandlery' },
    { x: 880, y: 80,  w: 220, h: 130, label: 'Net Loft' },
    { x: 70,  y: 560, w: 200, h: 130, label: 'Smokehouse' },
    { x: 560, y: 620, w: 180, h: 110, label: 'Cooperage' },
    { x: 980, y: 560, w: 180, h: 120, label: 'Salt Store' },
  ],
  // Crates and barrels: low cover, block sight when crouched behind
  cover: [
    { x: 300, y: 300, w: 90, h: 60, kind: 'crates' },
    { x: 560, y: 260, w: 70, h: 70, kind: 'barrels' },
    { x: 760, y: 420, w: 100, h: 60, kind: 'crates' },
    { x: 420, y: 480, w: 80, h: 60, kind: 'barrels' },
    { x: 940, y: 330, w: 70, h: 70, kind: 'crates' },
    { x: 180, y: 420, w: 80, h: 50, kind: 'barrels' },
  ],
  // 7 lamps. Click one to douse it: its pool of light dies and the
  // ground under it turns into a dark patch where the player is safe.
  lamps: [
    { id: 1, x: 290, y: 220, r: 95, lit: true },
    { id: 2, x: 640, y: 190, r: 95, lit: true },
    { id: 3, x: 990, y: 260, r: 95, lit: true },
    { id: 4, x: 480, y: 400, r: 100, lit: true },
    { id: 5, x: 830, y: 540, r: 95, lit: true },
    { id: 6, x: 340, y: 715, r: 90, lit: true },
    { id: 7, x: 700, y: 700, r: 90, lit: true },
  ],
  // 3 brass keys to steal before the lighthouse door opens.
  keys: [
    { id: 1, x: 350, y: 250, taken: false, label: 'Brass Key' },
    { id: 2, x: 900, y: 470, taken: false, label: 'Brass Key' },
    { id: 3, x: 620, y: 560, taken: false, label: 'Brass Key' },
  ],
  // The lighthouse stands at the north-east corner; its door is the exit.
  exit: { x: 1150, y: 120, w: 90, h: 110, label: 'LIGHTHOUSE' },
  playerStart: { x: 150, y: 700 },
  guards: [
    {
      name: 'Warden Joss',
      x: 520, y: 300, speed: 42, coneLen: 260, coneHalf: 0.42,
      waypoints: [[520, 300], [760, 300], [760, 470], [520, 470]],
    },
    {
      name: 'Warden Mira',
      x: 980, y: 420, speed: 48, coneLen: 280, coneHalf: 0.40,
      waypoints: [[980, 420], [700, 420], [700, 600], [980, 600]],
    },
  ],
};

export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// True when the segment from (x1,y1) to (x2,y2) crosses any wall or cover.
export function sightBlocked(x1, y1, x2, y2) {
  const solids = [...LEVEL.walls, ...LEVEL.cover];
  for (const s of solids) {
    if (segmentHitsRect(x1, y1, x2, y2, s)) return true;
  }
  return false;
}

function segmentHitsRect(x1, y1, x2, y2, r) {
  // Sample the segment; cheap and plenty for a top-down stealth game.
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    if (pointInRect(x, y, r)) return true;
  }
  return false;
}

export function litAt(x, y) {
  for (const lamp of LEVEL.lamps) {
    if (!lamp.lit) continue;
    const dx = x - lamp.x, dy = y - lamp.y;
    if (dx * dx + dy * dy < lamp.r * lamp.r) return true;
  }
  return false;
}
