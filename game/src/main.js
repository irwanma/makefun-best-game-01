// NEONFALL — a neon arena survival shooter. Twin-stick combat in a falling
// starfield: fly with WASD or the arrow keys, aim with the mouse, hold the
// button to fire, clear each wave, choose one of three upgrades, and meet
// the Dreadnought every fifth wave. This file is the conductor: the state
// machine (title → playing ⇄ upgrade → game over), the game loop, every
// collision, the combo counter and the pickups. The specialists live in
// their own files — config, input, audio, particles, player, weapons,
// enemies, waves, upgrades, hud and screens.

import { COMBO_MAX_MULTIPLIER, COMBO_WINDOW_SECONDS, PALETTE, PICKUP_DROP_CHANCE, PLAYER_BASE, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createParticles } from './particles.js';
import { createPlayer, damagePlayer, drawPlayer, updatePlayer } from './player.js';
import { createWeaponState, drawBullets, firePlayerVolley, updateBullets } from './weapons.js';
import { drawEnemy, spawnEnemy, updateEnemies } from './enemies.js';
import { createWaveDirector, isBossWave, isWaveCleared, startNextWave, updateWaveDirector } from './waves.js';
import { applyUpgrade, drawUpgradeScreen, rollUpgradeChoices, upgradeCardRects } from './upgrades.js';
import { drawHud } from './hud.js';
import { createBackdrop, drawBackdrop, drawGameOverScreen, drawPauseScreen, drawTitleScreen } from './screens.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_WIDTH;
canvas.height = VIEW_HEIGHT;
const view = { width: VIEW_WIDTH, height: VIEW_HEIGHT };
const statusLine = document.getElementById('status');

// A seed in the URL makes the fall deterministic (the screenshot harness
// uses it); without one the game seeds itself from the clock.
const params = new URLSearchParams(location.search);
if (params.has('seed')) installSeededRandom(Number(params.get('seed')) || 1);

const input = createInput(canvas, view);
const audio = createAudio();
const particles = createParticles();
const backdrop = createBackdrop();

const game = {
  state: 'title',
  time: 0,
  score: 0,
  bestScore: loadBestScore(),
  comboChain: 0,
  comboMultiplier: 1,
  comboTimer: 0,
  comboWindow: COMBO_WINDOW_SECONDS,
  waveNumber: 0,
  enemiesLeft: 0,
  build: freshBuild(),
  player: null,
  enemies: [],
  weaponState: createWeaponState(),
  director: createWaveDirector(),
  pickups: [],
  upgradeChoices: [],
  shake: 0,
  banner: '',
  bannerUntil: 0,
  shotMode: params.has('shot'),
};
game.player = createPlayer(game.build);
window.__neonfall = game;

function installSeededRandom(seed) {
  let state = seed >>> 0;
  Math.random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function freshBuild() {
  return { ...PLAYER_BASE, projectiles: 1, pierce: 0, magnetRadius: 95 };
}

function loadBestScore() {
  try { return Number(localStorage.getItem('neonfall-best')) || 0; } catch { return 0; }
}

function saveBestScore() {
  try { localStorage.setItem('neonfall-best', String(game.bestScore)); } catch { /* private mode: the run still counts */ }
}

function startRun() {
  game.build = freshBuild();
  game.player = createPlayer(game.build);
  game.enemies = [];
  game.weaponState = createWeaponState();
  game.pickups = [];
  game.score = 0;
  game.comboChain = 0;
  game.comboMultiplier = 1;
  game.comboTimer = 0;
  game.director = createWaveDirector();
  beginWave();
  game.state = 'playing';
  announce(`Wave 1. Survive the fall.`);
}

function beginWave() {
  const wave = startNextWave(game.director);
  game.waveNumber = wave;
  if (isBossWave(wave)) {
    game.banner = '⚠ DREADNOUGHT INBOUND ⚠';
    game.bannerUntil = game.time + 2.4;
    audio.bossWarn();
  } else {
    game.banner = `WAVE ${wave}`;
    game.bannerUntil = game.time + 1.4;
  }
}

function endRun() {
  game.state = 'gameover';
  game.bestScore = Math.max(game.bestScore, game.score);
  saveBestScore();
  audio.gameOver();
  particles.burst(game.player.x, game.player.y, PALETTE.player, 46, 380);
  particles.ring(game.player.x, game.player.y, PALETTE.player, 130);
  game.shake = 14;
  announce(`Ship down. Final score ${game.score}, wave ${game.waveNumber}. Press Enter to fly again.`);
}

function announce(text) {
  if (statusLine) statusLine.textContent = text;
}

// --- combat -----------------------------------------------------------------

function registerKill(enemy) {
  game.comboChain += 1;
  game.comboTimer = COMBO_WINDOW_SECONDS;
  game.comboMultiplier = Math.min(COMBO_MAX_MULTIPLIER, 1 + Math.floor(game.comboChain / 3));
  const gained = enemy.score * game.comboMultiplier;
  game.score += gained;
  particles.burst(enemy.x, enemy.y, enemy.color, enemy.kind === 'boss' ? 60 : 16, enemy.kind === 'boss' ? 420 : 260);
  particles.ring(enemy.x, enemy.y, enemy.color, enemy.kind === 'boss' ? 150 : 56);
  particles.popup(enemy.x, enemy.y - enemy.radius - 6, `+${gained}`, game.comboMultiplier > 1 ? '#ffb020' : '#e2e8f0');
  audio.explosion(enemy.kind === 'boss' || enemy.kind === 'splitter');
  if (enemy.kind === 'boss') game.shake = Math.max(game.shake, 10);
  if (enemy.kind === 'splitter') {
    for (let i = 0; i < 3; i += 1) {
      const mini = spawnEnemy('mini', enemy.x + (Math.random() - 0.5) * 26, enemy.y + (Math.random() - 0.5) * 26, 1);
      game.enemies.push(mini);
    }
  }
  if (enemy.kind !== 'mini' && Math.random() < PICKUP_DROP_CHANCE) dropPickup(enemy.x, enemy.y);
}

function dropPickup(x, y) {
  const kind = Math.random() < 0.5 ? 'shield' : 'repair';
  game.pickups.push({ kind, x, y, vx: (Math.random() - 0.5) * 40, vy: (Math.random() - 0.5) * 40, age: 0 });
}

function resolveCollisions() {
  const { playerBullets, enemyBullets } = game.weaponState;
  // Player bullets against enemies (a piercing bullet remembers its victims).
  for (let bi = playerBullets.length - 1; bi >= 0; bi -= 1) {
    const bullet = playerBullets[bi];
    bullet.hitSet = bullet.hitSet || new Set();
    for (const enemy of game.enemies) {
      if (enemy.dead || bullet.hitSet.has(enemy)) continue;
      if (Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y) > bullet.radius + enemy.radius) continue;
      bullet.hitSet.add(enemy);
      enemy.hull -= bullet.damage;
      enemy.flash = 1;
      audio.enemyHit();
      particles.burst(bullet.x, bullet.y, enemy.color, 4, 150);
      if (enemy.hull <= 0) { enemy.dead = true; registerKill(enemy); }
      if (bullet.pierceLeft > 0) { bullet.pierceLeft -= 1; } else { playerBullets.splice(bi, 1); }
      break;
    }
  }
  // Enemy bolts against the player.
  for (let bi = enemyBullets.length - 1; bi >= 0; bi -= 1) {
    const bullet = enemyBullets[bi];
    if (Math.hypot(bullet.x - game.player.x, bullet.y - game.player.y) > bullet.radius + game.player.radius) continue;
    enemyBullets.splice(bi, 1);
    if (damagePlayer(game.player, bullet.damage)) {
      audio.playerHurt();
      game.shake = Math.max(game.shake, 6);
      particles.burst(game.player.x, game.player.y, PALETTE.danger, 10, 200);
      if (game.player.hull <= 0) { endRun(); return; }
    }
  }
  // Enemies ramming the player: the attacker burns up, the boss does not.
  for (const enemy of game.enemies) {
    if (enemy.dead) continue;
    if (Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y) > enemy.radius + game.player.radius - 2) continue;
    if (damagePlayer(game.player, enemy.damage)) {
      audio.playerHurt();
      game.shake = Math.max(game.shake, 7);
      if (enemy.kind !== 'boss') { enemy.dead = true; particles.burst(enemy.x, enemy.y, enemy.color, 18, 280); }
      if (game.player.hull <= 0) { endRun(); return; }
    }
  }
  game.enemies = game.enemies.filter((enemy) => !enemy.dead);
}

function updatePickups(dt) {
  const player = game.player;
  for (let i = game.pickups.length - 1; i >= 0; i -= 1) {
    const pickup = game.pickups[i];
    pickup.age += dt;
    const distance = Math.hypot(player.x - pickup.x, player.y - pickup.y);
    if (distance < game.build.magnetRadius) {
      const pull = 260 * dt;
      pickup.x += ((player.x - pickup.x) / (distance || 1)) * pull;
      pickup.y += ((player.y - pickup.y) / (distance || 1)) * pull;
    } else {
      pickup.x += pickup.vx * dt;
      pickup.y += pickup.vy * dt;
    }
    if (distance < player.radius + 16) {
      if (pickup.kind === 'shield') game.player.shield = Math.min(game.build.shield, game.player.shield + 30);
      else game.player.hull = Math.min(game.build.hull, game.player.hull + 25);
      particles.popup(player.x, player.y - 26, pickup.kind === 'shield' ? '+SHIELD' : '+HULL', pickup.kind === 'shield' ? PALETTE.shieldCell : PALETTE.repairCell);
      audio.pickup();
      game.pickups.splice(i, 1);
    } else if (pickup.age > 9) {
      game.pickups.splice(i, 1);
    }
  }
}

function drawPickups() {
  for (const pickup of game.pickups) {
    if (pickup.age > 7 && Math.floor(game.time * 6) % 2 === 0) continue;
    const color = pickup.kind === 'shield' ? PALETTE.shieldCell : PALETTE.repairCell;
    ctx.save();
    ctx.translate(pickup.x, pickup.y + Math.sin(game.time * 3 + pickup.x) * 3);
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = color;
    if (pickup.kind === 'shield') {
      ctx.fillRect(-1.6, -6, 3.2, 12);
      ctx.fillRect(-6, -1.6, 12, 3.2);
    } else {
      ctx.font = '900 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✚', 0, 4.5);
    }
    ctx.restore();
  }
}

// --- state updates ------------------------------------------------------------

function updatePlaying(dt) {
  updatePlayer(game.player, game.build, input, dt);
  if (input.pointerDown) firePlayerVolley(game.weaponState, game.player, game.build, audio);
  updateWaveDirector(game.director, game.enemies, game.player, dt);
  updateEnemies(game.enemies, game.player, game.weaponState, dt, audio);
  updateBullets(game.weaponState, view, dt);
  resolveCollisions();
  if (game.state !== 'playing') return;
  updatePickups(dt);
  if (game.comboTimer > 0) {
    game.comboTimer -= dt;
    if (game.comboTimer <= 0) { game.comboChain = 0; game.comboMultiplier = 1; }
  }
  game.enemiesLeft = game.director.queue.length + game.enemies.length;
  if (isWaveCleared(game.director, game.enemies)) {
    audio.waveClear();
    game.upgradeChoices = rollUpgradeChoices();
    game.state = 'upgrade';
    announce(`Wave ${game.waveNumber} cleared. Choose an upgrade.`);
  }
}

function chooseUpgrade(index) {
  const upgrade = game.upgradeChoices[index];
  if (!upgrade) return;
  applyUpgrade(upgrade, game.build, game.player);
  audio.upgrade();
  beginWave();
  game.state = 'playing';
}

function handleMenuInput() {
  if (game.state === 'title') {
    if (input.wasPressed('Enter') || input.clicks.length > 0) { audio.unlock(); startRun(); }
  } else if (game.state === 'gameover') {
    if (input.wasPressed('Enter') || input.clicks.length > 0) { audio.unlock(); startRun(); }
  } else if (game.state === 'upgrade') {
    if (input.wasPressed('Digit1')) chooseUpgrade(0);
    if (input.wasPressed('Digit2')) chooseUpgrade(1);
    if (input.wasPressed('Digit3')) chooseUpgrade(2);
    for (const click of input.clicks) {
      const rects = upgradeCardRects(view);
      rects.forEach((rect, index) => {
        if (click.x >= rect.x && click.x <= rect.x + rect.width && click.y >= rect.y && click.y <= rect.y + rect.height) chooseUpgrade(index);
      });
    }
  }
}

// --- drawing ------------------------------------------------------------------

function drawWorld() {
  ctx.save();
  if (game.shake > 0.2) ctx.translate((Math.random() - 0.5) * game.shake, (Math.random() - 0.5) * game.shake);
  drawBackdrop(ctx, backdrop, game.time, 1 / 60);
  drawPickups();
  for (const enemy of game.enemies) drawEnemy(ctx, enemy, game.time);
  drawBullets(ctx, game.weaponState);
  if (game.state !== 'gameover') drawPlayer(ctx, game.player, game.time);
  particles.draw(ctx);
  ctx.restore();
  if (game.state === 'playing' || game.state === 'upgrade' || game.state === 'paused') {
    drawHud(ctx, view, { ...game, enemies: game.enemies });
  }
  if (game.banner && game.time < game.bannerUntil && game.state === 'playing') {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.globalAlpha = Math.min(1, game.bannerUntil - game.time);
    ctx.shadowColor = '#f471ff';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#fdf4ff';
    ctx.font = '800 34px system-ui, sans-serif';
    ctx.fillText(game.banner, view.width / 2, 120);
    ctx.restore();
  }
}

function draw() {
  drawWorld();
  if (game.state === 'title') drawTitleScreen(ctx, view, game, game.time);
  else if (game.state === 'upgrade') drawUpgradeScreen(ctx, view, game.upgradeChoices, game.player, game.waveNumber, game.time);
  else if (game.state === 'gameover') drawGameOverScreen(ctx, view, game, game.time);
  else if (game.state === 'paused') drawPauseScreen(ctx, view);
}

// --- the loop -----------------------------------------------------------------

let lastTimestamp = performance.now();
function frame(timestamp) {
  const dt = Math.min(0.033, (timestamp - lastTimestamp) / 1000 || 0.016);
  lastTimestamp = timestamp;
  game.time += dt;
  game.shake = Math.max(0, game.shake - dt * 26);

  if (input.wasPressed('KeyM')) audio.toggleMute();
  if ((input.wasPressed('KeyP') || input.wasPressed('Escape')) && game.state === 'playing') game.state = 'paused';
  else if ((input.wasPressed('KeyP') || input.wasPressed('Escape')) && game.state === 'paused') game.state = 'playing';

  handleMenuInput();
  if (game.state === 'playing') updatePlaying(dt);
  else if (game.state === 'title' || game.state === 'gameover') particles.update(dt);
  draw();
  input.endFrame();
  requestAnimationFrame(frame);
}

// --- screenshot staging ---------------------------------------------------------
// ?shot=combat|upgrade|gameover&seed=n poses the real game in a real state so
// the maker's screenshots are honest renders of the loop, not mock-ups.

function stageShotScene() {
  const shot = params.get('shot');
  if (!shot) return;
  if (shot === 'combat') {
    startRun();
    game.banner = '';
    game.bannerUntil = 0;
    game.waveNumber = 3;
    game.score = 12450;
    game.comboChain = 11;
    game.comboMultiplier = 4;
    game.comboTimer = 2.2;
    game.player.x = 470;
    game.player.y = 430;
    const staged = [
      spawnEnemy('chaser', 760, 300, 1), spawnEnemy('chaser', 830, 390, 1),
      spawnEnemy('weaver', 660, 190, 1), spawnEnemy('shooter', 900, 210, 1),
      spawnEnemy('splitter', 980, 430, 1), spawnEnemy('weaver', 300, 180, 1),
      spawnEnemy('chaser', 210, 520, 1),
    ];
    game.enemies.push(...staged);
    game.director.queue = ['chaser', 'weaver', 'shooter'];
    for (let i = 0; i < 5; i += 1) {
      game.weaponState.playerBullets.push({ x: 520 + i * 36, y: 408 - i * 13, vx: 640, vy: -230, radius: 4, damage: 1, pierceLeft: 0 });
    }
    game.weaponState.enemyBullets.push({ x: 850, y: 250, vx: -160, vy: 130, radius: 5, damage: 10 });
    particles.burst(700, 330, PALETTE.chaser, 18, 280);
    particles.ring(700, 330, PALETTE.chaser, 60);
    particles.popup(700, 290, '+200', '#ffb020');
    dropPickup(560, 540);
    game.enemiesLeft = game.director.queue.length + game.enemies.length;
  } else if (shot === 'upgrade') {
    startRun();
    game.waveNumber = 4;
    game.score = 18730;
    game.upgradeChoices = rollUpgradeChoices();
    game.state = 'upgrade';
  } else if (shot === 'gameover') {
    startRun();
    game.waveNumber = 7;
    game.score = 23870;
    game.bestScore = Math.max(game.bestScore, 23870);
    game.state = 'gameover';
  }
}

stageShotScene();
announce('NEONFALL. Press Enter to launch.');
requestAnimationFrame(frame);
