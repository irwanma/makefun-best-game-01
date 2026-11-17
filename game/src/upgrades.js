// NEONFALL upgrades: after every cleared wave the game offers three cards
// and the player picks one — the run's build is the sum of those picks.
// Keyboard 1/2/3 or a click chooses; nothing is applied until a choice lands.

import { UPGRADE_POOL } from './config.js';

export function rollUpgradeChoices(random = Math.random) {
  const pool = [...UPGRADE_POOL];
  const choices = [];
  while (choices.length < 3 && pool.length > 0) {
    const index = Math.floor(random() * pool.length);
    choices.push(pool.splice(index, 1)[0]);
  }
  return choices;
}

export function applyUpgrade(upgrade, build, player) {
  upgrade.apply(build, player);
}

export function upgradeCardRects(view) {
  const cardWidth = 300;
  const cardHeight = 190;
  const gap = 28;
  const totalWidth = cardWidth * 3 + gap * 2;
  const startX = (view.width - totalWidth) / 2;
  const y = view.height / 2 - cardHeight / 2 + 26;
  return [0, 1, 2].map((i) => ({ x: startX + i * (cardWidth + gap), y, width: cardWidth, height: cardHeight }));
}

export function drawUpgradeScreen(ctx, view, choices, player, waveNumber, time) {
  ctx.save();
  ctx.fillStyle = 'rgba(3, 5, 16, 0.72)';
  ctx.fillRect(0, 0, view.width, view.height);
  ctx.textAlign = 'center';
  ctx.shadowColor = '#22d3ee';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '800 40px system-ui, sans-serif';
  ctx.fillText(`WAVE ${waveNumber} CLEARED`, view.width / 2, view.height / 2 - 168);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#8b9bb4';
  ctx.font = '500 18px system-ui, sans-serif';
  ctx.fillText('Choose one upgrade — press 1, 2 or 3, or click a card', view.width / 2, view.height / 2 - 132);

  const rects = upgradeCardRects(view);
  choices.forEach((upgrade, index) => {
    const rect = rects[index];
    const hover = Math.sin(time * 2 + index) * 0.5 + 0.5;
    ctx.save();
    ctx.shadowColor = upgrade.tint;
    ctx.shadowBlur = 12 + hover * 10;
    ctx.fillStyle = 'rgba(8, 12, 28, 0.95)';
    ctx.strokeStyle = upgrade.tint;
    ctx.lineWidth = 2;
    roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 14);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = upgrade.tint;
    ctx.font = '800 22px system-ui, sans-serif';
    const words = upgrade.name.split(' ');
    words.forEach((word, line) => ctx.fillText(word, rect.x + rect.width / 2, rect.y + 58 + line * 26));
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '400 15.5px system-ui, sans-serif';
    wrapText(ctx, upgrade.blurb, rect.x + rect.width / 2, rect.y + 58 + words.length * 26 + 14, rect.width - 36, 21);
    ctx.fillStyle = '#8b9bb4';
    ctx.font = '700 15px system-ui, sans-serif';
    ctx.fillText(`[ ${index + 1} ]`, rect.x + rect.width / 2, rect.y + rect.height - 18);
    ctx.restore();
  });
  ctx.restore();
}

export function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function wrapText(ctx, text, centerX, startY, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width > maxWidth && line) { lines.push(line); line = word; }
    else line = trial;
  }
  if (line) lines.push(line);
  lines.forEach((textLine, i) => ctx.fillText(textLine, centerX, startY + i * lineHeight));
}
