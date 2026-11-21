// Lamplighter: bootstrap, game loop, input, and staged screenshot shots.
import { LEVEL } from './level.js';
import { makePlayer, movePlayer, tryDouse, updatePlayerLight, collectKeys, atExit } from './player.js';
import { makeGuards, updateGuard, guardHeardLamp, statusWord, alarmLabel } from './guard.js';
import { draw } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const params = new URLSearchParams(location.search);
const shot = params.get('shot');

const state = {
  player: makePlayer(),
  guards: makeGuards(),
  time: 0,
  bells: 0,
  spotted: 0,
  statusWord: 'HIDDEN',
  alarm: 'CALM',
  eventText: '',
  eventTimer: 0,
  footsteps: [],
  won: false,
  caught: false,
  frozen: false, // staged shots hold their pose; only the timer runs
};

const keysDown = new Set();
let lastStep = 0;
let lastAnnounce = '';

function announce(text) {
  if (text === lastAnnounce) return;
  lastAnnounce = text;
  statusEl.textContent = text;
}

function ringBell(g) {
  state.bells += 1;
  state.spotted += 1;
  state.eventText = `Bell ${state.bells} — ${g.name} is coming!`;
  state.eventTimer = 3;
  announce(`Spotted by ${g.name}. Bell ${state.bells}.`);
}

function stageShot(name) {
  const p = state.player;
  const [joss, mira] = state.guards;
  state.frozen = true;
  if (name === 'cover') {
    // Near-miss alarm: the player is caught at the edge of a red cone,
    // one lamp already doused behind them, the lighthouse in sight.
    LEVEL.lamps[2].lit = false; // lamp 3 doused -> dark patch visible
    LEVEL.keys[0].taken = true;
    p.keys = 1; p.doused = 1;
    p.x = 880; p.y = 330;
    joss.x = 740; joss.y = 300;
    joss.angle = Math.atan2(p.y - joss.y, p.x - joss.x);
    joss.meter = 1; joss.mark = '!'; joss.state = 'HUNTED';
    joss.investigateX = p.x; joss.investigateY = p.y;
    mira.x = 980; mira.y = 470; mira.angle = -0.6; mira.meter = 0.4; mira.mark = '?'; mira.state = 'SUSPICIOUS';
    state.time = 72; // 1:12
    state.bells = 2; state.spotted = 1;
    state.eventText = 'WHAT WAS THAT?';
    state.eventTimer = 999;
  } else if (name === 'patrol') {
    // The signature move: the player douses a lamp and a dark road opens.
    LEVEL.lamps[3].lit = false; // lamp 4 doused
    p.x = 480; p.y = 455; p.doused = 1;
    joss.x = 560; joss.y = 300; joss.angle = 1.2; joss.meter = 0.2; joss.mark = '?'; joss.state = 'SUSPICIOUS';
    mira.x = 1010; mira.y = 540; mira.angle = 2.4; mira.meter = 0;
    state.time = 42; // 0:42
    state.eventText = 'Lamp doused — the dark is yours.';
    state.eventTimer = 999;
  } else if (name === 'alarm') {
    // Recovery moment: the meter is almost full, the bell is rising.
    LEVEL.lamps[1].lit = false; // lamp 2 doused
    LEVEL.keys[0].taken = true; LEVEL.keys[1].taken = true;
    p.keys = 2; p.doused = 1;
    p.x = 820; p.y = 470;
    mira.x = 960; mira.y = 430;
    mira.angle = Math.atan2(p.y - mira.y, p.x - mira.x);
    mira.meter = 0.92; mira.mark = '?'; mira.state = 'SUSPICIOUS';
    joss.x = 580; joss.y = 345; joss.angle = 0.5; joss.meter = 0.3; joss.mark = '?'; joss.state = 'SUSPICIOUS';
    state.time = 154; // 2:34
    state.bells = 1; state.spotted = 1;
    state.eventText = 'WHAT WAS THAT?';
    state.eventTimer = 999;
  } else if (name === 'victory') {
    // The lighthouse door stands open and green; the player arrives.
    LEVEL.keys[0].taken = true; LEVEL.keys[1].taken = true; LEVEL.keys[2].taken = true;
    p.keys = 3;
    p.x = 1130; p.y = 250;
    joss.x = 500; joss.y = 560; joss.angle = 0.8; joss.meter = 0;
    mira.x = 900; mira.y = 560; mira.angle = -1.2; mira.meter = 0;
    state.time = 212; // 3:32
    state.won = true;
  }
  updatePlayerLight(p);
  state.statusWord = statusWord(state.guards);
  state.alarm = alarmLabel(state.guards, state.bells);
}

function step(dt) {
  state.time += dt;
  if (state.eventTimer > 0 && state.eventTimer < 900) state.eventTimer -= dt;
  if (state.frozen) {
    // Staged shot: hold the pose, let the timer run.
    state.statusWord = statusWord(state.guards);
    state.alarm = alarmLabel(state.guards, state.bells);
    return;
  }
  if (state.won || state.caught) return;
  movePlayer(state.player, keysDown, dt);
  updatePlayerLight(state.player);
  const key = collectKeys(state.player);
  if (key) announce(`Brass key ${state.player.keys} of 3.`);
  for (const g of state.guards) {
    const before = g.state;
    updateGuard(g, state.player, dt, ringBell);
    if (g.state === 'SUSPICIOUS' && before === 'PATROL') {
      state.eventText = 'WHAT WAS THAT?';
      state.eventTimer = 2.5;
    }
    if (Math.hypot(g.x - state.player.x, g.y - state.player.y) < 26 && g.meter >= 0.99) {
      state.caught = true;
      announce('Caught by the wardens.');
    }
  }
  // Footsteps: a fading trail while moving.
  if (state.player.moving) {
    lastStep += dt;
    if (lastStep > 0.14) {
      lastStep = 0;
      state.footsteps.push({ x: state.player.x, y: state.player.y, life: 1 });
      if (state.footsteps.length > 40) state.footsteps.shift();
    }
  }
  for (const f of state.footsteps) f.life -= dt * 0.5;
  state.footsteps = state.footsteps.filter((f) => f.life > 0);
  state.statusWord = statusWord(state.guards);
  state.alarm = alarmLabel(state.guards, state.bells);
  if (state.player.keys >= 3 && atExit(state.player)) {
    state.won = true;
    announce(`You reached the lighthouse in ${Math.floor(state.time / 60)}:${String(Math.floor(state.time % 60)).padStart(2, '0')}.`);
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - (frame.last || now)) / 1000 || 0.016);
  frame.last = now;
  step(dt);
  draw(ctx, state);
}

window.addEventListener('keydown', (e) => {
  keysDown.add(e.key.toLowerCase());
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) e.preventDefault();
});
window.addEventListener('keyup', (e) => keysDown.delete(e.key.toLowerCase()));

canvas.addEventListener('click', (e) => {
  if (state.won || state.caught || state.frozen) return;
  const rect = canvas.getBoundingClientRect();
  const mx = ((e.clientX - rect.left) / rect.width) * 1280;
  const my = ((e.clientY - rect.top) / rect.height) * 800;
  const lamp = tryDouse(state.player, mx, my);
  if (lamp) {
    state.eventText = 'Lamp doused — the dark is yours.';
    state.eventTimer = 2.5;
    announce('Lamp doused. The wardens will come to look.');
    // The nearest warden wanders over to check after a beat.
    setTimeout(() => {
      for (const g of state.guards) guardHeardLamp(g, lamp);
    }, 1200);
  }
});

if (shot) stageShot(shot);
announce('Lamplighter. Douse the lamps, stay in the dark, take three brass keys and reach the lighthouse.');
requestAnimationFrame(frame);
