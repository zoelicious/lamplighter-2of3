// All drawing: the dusk town, the light cones, the HUD, the legend.
import { LEVEL } from './level.js';

const W = 1280, H = 800;

export function draw(ctx, s) {
  drawFloor(ctx);
  drawExit(ctx, s);
  drawWalls(ctx);
  drawCover(ctx);
  drawLamps(ctx, s);
  drawKeys(ctx, s);
  drawFootsteps(ctx, s);
  for (const g of s.guards) drawCone(ctx, g);
  drawPlayer(ctx, s.player, s);
  for (const g of s.guards) drawGuard(ctx, g, s.player);
  drawHud(ctx, s);
  if (s.won) drawBanner(ctx, 'THE LIGHTHOUSE IS OPEN', 'Three keys, unseen — you slipped through the dark.', '#7ee787');
  if (s.caught) drawBanner(ctx, 'CAUGHT', 'The wardens found you in the light. Try a darker road.', '#ff6b5e');
  if (s.eventText && s.eventTimer > 0) drawEventText(ctx, s.eventText);
}

function drawFloor(ctx) {
  ctx.fillStyle = '#141824';
  ctx.fillRect(0, 0, W, H);
  // Cobblestones: faint grid + scattered darker stones.
  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let i = 0; i < 40; i++) {
    const x = ((i * 197) % 1240) + 20, y = ((i * 311) % 760) + 20;
    ctx.fillRect(x, y, 34, 22);
  }
  // Sea along the north-east edge, beyond the lighthouse.
  ctx.fillStyle = '#0e2233';
  ctx.fillRect(1120, 0, 160, 60);
  ctx.fillStyle = 'rgba(140,200,255,0.25)';
  ctx.fillRect(1120, 52, 160, 3);
}

function drawExit(ctx, s) {
  const e = LEVEL.exit;
  const open = s.player.keys >= 3;
  // Lighthouse tower.
  ctx.fillStyle = '#e8e2d4';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = '#b3402f';
  ctx.fillRect(e.x, e.y + 26, e.w, 18);
  ctx.fillRect(e.x, e.y + 66, e.w, 18);
  ctx.fillStyle = '#1c2438';
  ctx.fillRect(e.x + 18, e.y - 26, e.w - 36, 28);
  ctx.fillStyle = open ? '#ffe9a8' : '#5a6b8a';
  ctx.beginPath(); ctx.arc(e.x + e.w / 2, e.y - 12, 10, 0, Math.PI * 2); ctx.fill();
  // Light beam when open.
  if (open) {
    const grad = ctx.createLinearGradient(e.x + e.w / 2, e.y, e.x + e.w / 2 - 320, e.y - 40);
    grad.addColorStop(0, 'rgba(255,233,168,0.5)');
    grad.addColorStop(1, 'rgba(255,233,168,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(e.x + e.w / 2, e.y - 12);
    ctx.lineTo(e.x + e.w / 2 - 330, e.y - 70);
    ctx.lineTo(e.x + e.w / 2 - 330, e.y + 30);
    ctx.closePath(); ctx.fill();
  }
  // Door.
  ctx.fillStyle = open ? '#2fbf5a' : '#7a2e26';
  ctx.fillRect(e.x + 28, e.y + e.h - 34, 34, 34);
  ctx.fillStyle = '#0b0e18';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'OPEN' : 'LOCKED', e.x + e.w / 2, e.y + e.h + 18);
  ctx.fillStyle = '#e8e2d4';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('LIGHTHOUSE — EXIT', e.x + e.w / 2, e.y - 34);
}

function drawWalls(ctx) {
  for (const b of LEVEL.walls) {
    ctx.fillStyle = '#232838';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = '#2f3650';
    ctx.fillRect(b.x, b.y, b.w, 14);
    ctx.strokeStyle = '#3d4767';
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = '#9aa5c4';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.label.toUpperCase(), b.x + b.w / 2, b.y + b.h / 2 + 4);
  }
}

function drawCover(ctx) {
  for (const c of LEVEL.cover) {
    ctx.fillStyle = c.kind === 'crates' ? '#4a3826' : '#5a4632';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = '#7a6238';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x, c.y, c.w, c.h);
    ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + c.w, c.y + c.h); ctx.stroke();
    ctx.fillStyle = '#d8c49a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('COVER — HIDE', c.x + c.w / 2, c.y - 6);
  }
}

function drawLamps(ctx, s) {
  for (const lamp of LEVEL.lamps) {
    if (lamp.lit) {
      const g = ctx.createRadialGradient(lamp.x, lamp.y, 8, lamp.x, lamp.y, lamp.r);
      g.addColorStop(0, 'rgba(255,205,110,0.34)');
      g.addColorStop(1, 'rgba(255,205,110,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd97a';
      ctx.beginPath(); ctx.arc(lamp.x, lamp.y, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a2c14';
      ctx.fillRect(lamp.x - 2, lamp.y - 4, 4, 22);
      ctx.fillStyle = '#e8c878';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LAMP — CLICK TO DOUSE', lamp.x, lamp.y + 38);
    } else {
      // Doused lamp: a patch of true dark where the player is safe.
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath(); ctx.arc(lamp.x, lamp.y, lamp.r * 0.85, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(180,200,255,0.5)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(lamp.x, lamp.y, lamp.r * 0.85, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#9fb4d8';
      ctx.beginPath(); ctx.arc(lamp.x, lamp.y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#cfe0ff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      const dousedLabel = 'DOUSED — DARK · SAFE';
      const dw = ctx.measureText(dousedLabel).width + 12;
      ctx.fillStyle = 'rgba(8,10,20,0.85)';
      ctx.fillRect(lamp.x - lamp.r * 0.85 + 6, lamp.y - 9, dw, 18);
      ctx.fillStyle = '#cfe0ff';
      ctx.fillText(dousedLabel, lamp.x - lamp.r * 0.85 + 12, lamp.y + 4);
    }
  }
}

function drawKeys(ctx, s) {
  for (const k of LEVEL.keys) {
    if (k.taken) continue;
    const pulse = 0.5 + 0.3 * Math.sin(s.time * 3 + k.id);
    const g = ctx.createRadialGradient(k.x, k.y, 2, k.x, k.y, 26);
    g.addColorStop(0, `rgba(255,215,110,${0.5 * pulse + 0.2})`);
    g.addColorStop(1, 'rgba(255,215,110,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(k.x, k.y, 26, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffd76e';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(k.x - 4, k.y, 7, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(k.x + 3, k.y); ctx.lineTo(k.x + 16, k.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(k.x + 12, k.y); ctx.lineTo(k.x + 12, k.y + 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(k.x + 16, k.y); ctx.lineTo(k.x + 16, k.y + 7); ctx.stroke();
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BRASS KEY', k.x, k.y - 18);
  }
}

function drawFootsteps(ctx, s) {
  ctx.fillStyle = 'rgba(220,230,255,0.35)';
  for (const f of s.footsteps) {
    ctx.globalAlpha = Math.max(0, f.life);
    ctx.beginPath(); ctx.arc(f.x, f.y, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawCone(ctx, g) {
  const alert = g.meter > 0.45;
  const a0 = g.angle - g.coneHalf, a1 = g.angle + g.coneHalf;
  const grad = ctx.createRadialGradient(g.x, g.y, 10, g.x, g.y, g.coneLen);
  if (alert) {
    grad.addColorStop(0, 'rgba(255,70,55,0.55)');
    grad.addColorStop(1, 'rgba(255,70,55,0.05)');
  } else {
    grad.addColorStop(0, 'rgba(245,200,107,0.55)');
    grad.addColorStop(1, 'rgba(245,200,107,0.04)');
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.arc(g.x, g.y, g.coneLen, a0, a1);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = alert ? 'rgba(255,90,70,0.5)' : 'rgba(245,200,107,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + Math.cos(a0) * g.coneLen, g.y + Math.sin(a0) * g.coneLen);
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + Math.cos(a1) * g.coneLen, g.y + Math.sin(a1) * g.coneLen);
  ctx.stroke();
}

function drawPlayer(ctx, p, s) {
  // Small lantern glow when the player stands in the light.
  if (p.litAmount > 0) {
    const g = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 46);
    g.addColorStop(0, 'rgba(255,205,110,0.4)');
    g.addColorStop(1, 'rgba(255,205,110,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(p.x, p.y, 46, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#2f8f7a';
  ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#173f36';
  ctx.beginPath(); ctx.arc(p.x, p.y, p.r - 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd97a';
  ctx.beginPath(); ctx.arc(p.x + 10, p.y - 6, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8f4ff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('YOU', p.x, p.y - p.r - 8);
}

function drawGuard(ctx, g, p) {
  const d = Math.hypot(p.x - g.x, p.y - g.y);
  // Body: big enough to read at a glance.
  ctx.fillStyle = '#31406e';
  ctx.beginPath(); ctx.arc(g.x, g.y, 20, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d8b25a';
  ctx.beginPath(); ctx.arc(g.x, g.y, 20, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#e8e2d4';
  ctx.beginPath(); ctx.arc(g.x, g.y - 4, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#31406e';
  ctx.fillRect(g.x - 9, g.y - 12, 18, 5);
  // Facing tick.
  ctx.strokeStyle = '#ffd97a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + Math.cos(g.angle) * 30, g.y + Math.sin(g.angle) * 30);
  ctx.stroke();
  // Name tag.
  ctx.fillStyle = 'rgba(8,10,20,0.8)';
  const w = ctx.measureText(g.name).width + 16;
  ctx.fillRect(g.x - w / 2, g.y - 52, w, 18);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(g.name, g.x, g.y - 39);
  // Suspicion mark.
  if (g.mark === '?') {
    ctx.fillStyle = '#ffb02e';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('?', g.x, g.y - 56);
  } else if (g.mark === '!') {
    ctx.fillStyle = '#ff5346';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('!', g.x, g.y - 56);
  }
  // Personal detection ring.
  if (g.meter > 0.05) {
    ctx.strokeStyle = g.meter > 0.66 ? '#ff5346' : '#ffb02e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * g.meter);
    ctx.stroke();
  }
  // Distance readout under the guard.
  ctx.fillStyle = '#c8d2ea';
  ctx.font = '11px sans-serif';
  ctx.fillText(`${Math.round(d / 10)}m · ${g.state}`, g.x, g.y + 36);
}

function fmtTime(t) {
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function drawHud(ctx, s) {
  const p = s.player;
  // Top bar.
  ctx.fillStyle = 'rgba(8,10,20,0.88)';
  ctx.fillRect(0, 0, W, 66);
  ctx.strokeStyle = '#3d4767';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, 66); ctx.lineTo(W, 66); ctx.stroke();
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('LAMPLIGHTER', 16, 28);
  ctx.fillStyle = '#9aa5c4';
  ctx.font = '13px sans-serif';
  ctx.fillText('Night 1  ·  Level 1/3  ·  Old Harbour Town', 16, 50);

  // Status word + alarm scale (centre).
  const word = s.statusWord;
  const wordColor = word === 'HIDDEN' ? '#7ee787' : word === 'SEEN' ? '#ff5346' : '#ffb02e';
  ctx.textAlign = 'center';
  ctx.fillStyle = wordColor;
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(word, 640, 30);
  ctx.fillStyle = '#9aa5c4';
  ctx.font = '12px sans-serif';
  ctx.fillText(`ALARM: ${s.alarm}  ·  BELL ${s.bells}`, 640, 50);
  // Alarm bar.
  ctx.fillStyle = '#222a42';
  ctx.fillRect(540, 54, 200, 7);
  const worst = Math.max(0, ...s.guards.map((g) => g.meter));
  ctx.fillStyle = worst > 0.66 ? '#ff5346' : worst > 0.3 ? '#ffb02e' : '#7ee787';
  ctx.fillRect(540, 54, 200 * worst, 7);

  // Right cluster: timer, keys, spotted, goal.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#e8f4ff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(fmtTime(s.time), 1264, 28);
  ctx.fillStyle = '#9aa5c4';
  ctx.font = '13px sans-serif';
  ctx.fillText(`Keys ${p.keys}/3   ·   SPOTTED ${s.spotted}   ·   GOAL: reach the lighthouse`, 1264, 50);

  // Left panel: visibility / noise / roster.
  ctx.fillStyle = 'rgba(8,10,20,0.85)';
  ctx.fillRect(12, 78, 218, 132);
  ctx.strokeStyle = '#3d4767';
  ctx.strokeRect(12, 78, 218, 132);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e8f4ff';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('VISIBILITY: ' + (p.litAmount > 0 ? 'LIT — SEEN EASILY' : 'IN SHADOW'), 22, 100);
  ctx.fillText('NOISE: ' + (p.moving ? 'FOOTSTEPS' : 'SILENT'), 22, 120);
  ctx.fillStyle = '#ffb02e';
  ctx.fillText('PATROL', 22, 146);
  ctx.fillStyle = '#c8d2ea';
  ctx.font = '12px sans-serif';
  s.guards.forEach((g, i) => {
    const d = Math.round(Math.hypot(p.x - g.x, p.y - g.y) / 10);
    ctx.fillText(`${g.name} — ${g.state} · ${d}m`, 22, 166 + i * 18);
  });

  // Legend (bottom-left panel).
  ctx.fillStyle = 'rgba(8,10,20,0.85)';
  ctx.fillRect(12, 640, 250, 148);
  ctx.strokeStyle = '#3d4767';
  ctx.strokeRect(12, 640, 250, 148);
  ctx.fillStyle = '#ffb02e';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('LEGEND', 22, 662);
  ctx.fillStyle = '#c8d2ea';
  ctx.font = '12px sans-serif';
  const rows = [
    ['Yellow cone', 'guard sight — danger'],
    ['Dark patch', 'doused lamp — safe'],
    ['Crates / walls', 'cover — blocks sight'],
    ['Brass key', 'loot — take 3 to open'],
    ['Lighthouse', 'exit — green when open'],
  ];
  rows.forEach((r, i) => {
    ctx.fillStyle = '#ffe9a8';
    ctx.fillText(r[0], 22, 684 + i * 20);
    ctx.fillStyle = '#9aa5c4';
    ctx.fillText(r[1], 120, 684 + i * 20);
  });

  // Bottom bar: goal + controls.
  ctx.fillStyle = 'rgba(8,10,20,0.88)';
  ctx.fillRect(0, H - 26, W, 26);
  ctx.fillStyle = '#9aa5c4';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WASD / arrows to move  ·  Click a lamp to douse it — dark is safe, light is danger  ·  Take 3 brass keys, then reach the lighthouse unseen', 640, H - 8);
}

function drawBanner(ctx, title, sub, color) {
  ctx.fillStyle = 'rgba(8,10,20,0.82)';
  ctx.fillRect(340, 300, 600, 110);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(340, 300, 600, 110);
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(title, 640, 345);
  ctx.fillStyle = '#e8f4ff';
  ctx.font = '16px sans-serif';
  ctx.fillText(sub, 640, 378);
}

function drawEventText(ctx, text) {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffb02e';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(text, 640, 120);
}
