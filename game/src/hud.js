// NEONFALL HUD: everything the player needs at a glance — hull and shield
// bars top-left, wave and enemies left top-centre, score and the combo
// multiplier top-right, the boss's health bar across the top when it falls,
// and a low-hull vignette that pulses when the run is about to end.

import { PALETTE } from './config.js';

export function drawHud(ctx, view, game) {
  const { player, build } = game;
  ctx.save();
  drawBar(ctx, 26, 24, 250, 16, player.hull / build.hull, player.hull <= build.hull * 0.3 ? PALETTE.danger : '#4ade80', 'HULL');
  drawBar(ctx, 26, 48, 250, 10, player.shield / build.shield, PALETTE.shieldCell, 'SHIELD');

  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.text;
  ctx.font = '800 22px system-ui, sans-serif';
  ctx.fillText(`WAVE ${game.waveNumber}`, 26, 92);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '600 14px system-ui, sans-serif';
  ctx.fillText(game.enemiesLeft > 0 ? `${game.enemiesLeft} HOSTILES LEFT` : 'SECTOR CLEARING', 26, 114);

  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.text;
  ctx.font = '800 26px system-ui, sans-serif';
  ctx.fillText(String(game.score).padStart(6, '0'), view.width - 26, 42);
  if (game.comboMultiplier > 1) {
    const heat = (game.comboMultiplier - 1) / 7;
    ctx.fillStyle = `rgb(255, ${Math.round(200 - heat * 130)}, ${Math.round(90 - heat * 60)})`;
    ctx.font = '800 19px system-ui, sans-serif';
    ctx.fillText(`COMBO x${game.comboMultiplier}`, view.width - 26, 68);
    drawComboTimer(ctx, view, game);
  }
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText(`BEST ${Math.max(game.bestScore, game.score)}`, view.width - 26, 92);
  ctx.fillText(buildSummary(game.build), view.width - 26, view.height - 18);

  const boss = game.enemies.find((enemy) => enemy.kind === 'boss');
  if (boss) drawBossBar(ctx, view, boss);
  if (player.hull <= build.hull * 0.3 && game.state === 'playing') drawDangerVignette(ctx, view, game.time);
  ctx.restore();
}

function drawBar(ctx, x, y, width, height, fraction, color, label) {
  const clamped = Math.max(0, Math.min(1, fraction));
  ctx.fillStyle = 'rgba(148, 163, 184, 0.18)';
  ctx.fillRect(x, y, width, height);
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width * clamped, height);
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(4, 6, 13, 0.85)';
  ctx.font = '800 10px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 6, y + height - 3);
}

function drawComboTimer(ctx, view, game) {
  const fraction = Math.max(0, game.comboTimer / game.comboWindow);
  ctx.fillStyle = 'rgba(255, 176, 32, 0.85)';
  ctx.fillRect(view.width - 26 - 110 * fraction, 76, 110 * fraction, 3);
}

function drawBossBar(ctx, view, boss) {
  const width = view.width * 0.52;
  const x = (view.width - width) / 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.boss;
  ctx.font = '800 14px system-ui, sans-serif';
  ctx.fillText('⚠ DREADNOUGHT ⚠', view.width / 2, 30);
  ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
  ctx.fillRect(x, 38, width, 10);
  ctx.shadowColor = PALETTE.boss;
  ctx.shadowBlur = 9;
  ctx.fillStyle = PALETTE.boss;
  ctx.fillRect(x, 38, width * Math.max(0, boss.hull / boss.maxHull), 10);
  ctx.shadowBlur = 0;
}

function drawDangerVignette(ctx, view, time) {
  const pulse = 0.1 + 0.07 * Math.sin(time * 6);
  const gradient = ctx.createRadialGradient(view.width / 2, view.height / 2, view.height * 0.36, view.width / 2, view.height / 2, view.height * 0.78);
  gradient.addColorStop(0, 'rgba(255, 40, 70, 0)');
  gradient.addColorStop(1, `rgba(255, 40, 70, ${pulse})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, view.width, view.height);
}

export function buildSummary(build) {
  const parts = [];
  if (build.projectiles > 1) parts.push(`SPLIT x${build.projectiles}`);
  if (build.bulletDamage > 1) parts.push(`DMG ${build.bulletDamage}`);
  if (build.pierce > 0) parts.push(`PIERCE ${build.pierce}`);
  return parts.length ? parts.join(' · ') : 'STOCK BLASTER';
}
