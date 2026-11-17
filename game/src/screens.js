// NEONFALL screens: the animated backdrop (parallax starfield over a
// breathing neon grid) and the three screens that frame the run — the title,
// the pause veil, and the game-over results with their restart prompt.

import { PALETTE, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { roundRect } from './upgrades.js';

export function createBackdrop() {
  const stars = [];
  for (let i = 0; i < 150; i += 1) {
    stars.push({ x: Math.random() * VIEW_WIDTH, y: Math.random() * VIEW_HEIGHT, depth: 0.25 + Math.random() * 0.75, size: Math.random() * 1.7 + 0.4 });
  }
  return { stars, scroll: 0 };
}

export function drawBackdrop(ctx, backdrop, time, dt) {
  backdrop.scroll += dt * 12;
  ctx.fillStyle = PALETTE.background;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  // Stars drift downward, nearer ones faster — a slow fall through the field.
  for (const star of backdrop.stars) {
    const y = (star.y + backdrop.scroll * star.depth) % VIEW_HEIGHT;
    ctx.globalAlpha = 0.25 + star.depth * 0.6;
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(star.x, y, star.size, star.size);
  }
  ctx.globalAlpha = 1;
  // The arena grid: quiet verticals and horizontals with a soft pulse.
  ctx.strokeStyle = PALETTE.gridLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 64; x < VIEW_WIDTH; x += 64) { ctx.moveTo(x, 0); ctx.lineTo(x, VIEW_HEIGHT); }
  for (let y = 64; y < VIEW_HEIGHT; y += 64) { ctx.moveTo(0, y); ctx.lineTo(VIEW_WIDTH, y); }
  ctx.stroke();
  ctx.strokeStyle = `rgba(34, 211, 238, ${0.05 + 0.025 * Math.sin(time * 1.4)})`;
  ctx.strokeRect(28.5, 28.5, VIEW_WIDTH - 57, VIEW_HEIGHT - 57);
  // Vignette to seat the action in the middle of the frame.
  const gradient = ctx.createRadialGradient(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, VIEW_HEIGHT * 0.42, VIEW_WIDTH / 2, VIEW_HEIGHT / 2, VIEW_HEIGHT * 0.95);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
}

export function drawTitleScreen(ctx, view, game, time) {
  ctx.save();
  ctx.textAlign = 'center';
  // Decorative orbiting hostiles behind the logo, so the cover shows the cast.
  drawTitleOrbit(ctx, view, time);
  const glow = 22 + Math.sin(time * 2.2) * 7;
  ctx.shadowColor = '#22d3ee';
  ctx.shadowBlur = glow;
  ctx.fillStyle = '#ecfeff';
  ctx.font = '900 96px system-ui, sans-serif';
  ctx.fillText('NEONFALL', view.width / 2, 248);
  ctx.shadowColor = '#f471ff';
  ctx.fillStyle = '#f471ff';
  ctx.font = '800 25px system-ui, sans-serif';
  ctx.fillText('A R E N A   S U R V I V A L', view.width / 2, 292);
  ctx.shadowBlur = 0;
  ctx.fillStyle = PALETTE.text;
  ctx.font = '500 19px system-ui, sans-serif';
  ctx.fillText('Twin-stick survival. Every wave falls harder than the last.', view.width / 2, 348);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '500 17px system-ui, sans-serif';
  ctx.fillText('WASD / arrows to fly · mouse to aim · hold click to fire', view.width / 2, 420);
  ctx.fillText('Survive the wave, pick an upgrade, face the Dreadnought every 5th wave.', view.width / 2, 448);
  if (game.shotMode || Math.floor(time * 1.6) % 2 === 0) {
    ctx.shadowColor = '#ffb020';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ffb020';
    ctx.font = '800 24px system-ui, sans-serif';
    ctx.fillText('CLICK OR PRESS ENTER TO LAUNCH', view.width / 2, 528);
    ctx.shadowBlur = 0;
  }
  if (game.bestScore > 0) {
    ctx.fillStyle = PALETTE.text;
    ctx.font = '700 17px system-ui, sans-serif';
    ctx.fillText(`BEST SCORE ${game.bestScore}`, view.width / 2, 580);
  }
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '500 13px system-ui, sans-serif';
  ctx.fillText('P pause · M mute', view.width / 2, view.height - 26);
  ctx.restore();
}

function drawTitleOrbit(ctx, view, time) {
  const shapes = [
    { color: PALETTE.chaser, kind: 'dart' },
    { color: PALETTE.weaver, kind: 'diamond' },
    { color: PALETTE.shooter, kind: 'hex' },
    { color: PALETTE.splitter, kind: 'orb' },
  ];
  shapes.forEach((shape, i) => {
    const angle = time * 0.35 + (i / shapes.length) * Math.PI * 2;
    const x = view.width / 2 + Math.cos(angle) * 430;
    const y = 240 + Math.sin(angle) * 120;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle * 2);
    ctx.shadowColor = shape.color;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = shape.color;
    ctx.fillStyle = '#160a1e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (shape.kind === 'dart') { ctx.moveTo(17, 0); ctx.lineTo(-13, -10); ctx.lineTo(-8, 0); ctx.lineTo(-13, 10); ctx.closePath(); }
    if (shape.kind === 'diamond') { ctx.moveTo(0, -15); ctx.lineTo(15, 0); ctx.lineTo(0, 15); ctx.lineTo(-15, 0); ctx.closePath(); }
    if (shape.kind === 'hex') { for (let k = 0; k < 6; k += 1) { const a = (k / 6) * Math.PI * 2; const px = Math.cos(a) * 15; const py = Math.sin(a) * 15; if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.closePath(); }
    if (shape.kind === 'orb') { ctx.arc(0, 0, 15, 0, Math.PI * 2); }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });
}

export function drawPauseScreen(ctx, view) {
  ctx.save();
  ctx.fillStyle = 'rgba(3, 5, 16, 0.66)';
  ctx.fillRect(0, 0, view.width, view.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = '800 44px system-ui, sans-serif';
  ctx.fillText('PAUSED', view.width / 2, view.height / 2 - 8);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '500 17px system-ui, sans-serif';
  ctx.fillText('Press P or Esc to resume', view.width / 2, view.height / 2 + 28);
  ctx.restore();
}

export function drawGameOverScreen(ctx, view, game, time) {
  ctx.save();
  ctx.fillStyle = 'rgba(10, 3, 10, 0.7)';
  ctx.fillRect(0, 0, view.width, view.height);
  ctx.textAlign = 'center';
  ctx.shadowColor = PALETTE.danger;
  ctx.shadowBlur = 22;
  ctx.fillStyle = '#ffe4e6';
  ctx.font = '900 72px system-ui, sans-serif';
  ctx.fillText('SHIP DOWN', view.width / 2, 218);
  ctx.shadowBlur = 0;
  ctx.fillStyle = PALETTE.text;
  ctx.font = '600 21px system-ui, sans-serif';
  ctx.fillText(`You held the line through wave ${game.waveNumber}`, view.width / 2, 268);

  const panelWidth = 430;
  const panelX = (view.width - panelWidth) / 2;
  ctx.fillStyle = 'rgba(8, 12, 28, 0.92)';
  ctx.strokeStyle = PALETTE.danger;
  ctx.lineWidth = 1.5;
  roundRect(ctx, panelX, 300, panelWidth, 158, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillText('FINAL SCORE', view.width / 2, 340);
  ctx.fillStyle = '#ffb020';
  ctx.font = '900 46px system-ui, sans-serif';
  ctx.fillText(String(game.score), view.width / 2, 392);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '600 17px system-ui, sans-serif';
  const isBest = game.score >= game.bestScore && game.score > 0;
  ctx.fillText(isBest ? '★ NEW BEST SCORE ★' : `Best score ${game.bestScore}`, view.width / 2, 428);

  if (game.shotMode || Math.floor(time * 1.6) % 2 === 0) {
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 13;
    ctx.fillStyle = '#22d3ee';
    ctx.font = '800 23px system-ui, sans-serif';
    ctx.fillText('PRESS ENTER OR CLICK TO FLY AGAIN', view.width / 2, 540);
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}
