// NEONFALL enemies: five behaviours sharing one body plan. Chasers run you
// down, weavers slalom, shooters keep their distance and fire, splitters
// burst into minis, and the boss owns the top of the arena every fifth wave.

import { ENEMY_TYPES, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { fireEnemyBolt } from './weapons.js';

export function spawnEnemy(kind, x, y, waveScale = 1) {
  const base = ENEMY_TYPES[kind];
  return {
    kind,
    x, y,
    vx: 0, vy: 0,
    radius: base.radius,
    hull: Math.round(base.hull * waveScale),
    maxHull: Math.round(base.hull * waveScale),
    speed: base.speed * (0.92 + Math.random() * 0.16),
    score: base.score,
    damage: base.damage,
    color: base.color,
    age: 0,
    phase: Math.random() * Math.PI * 2,
    fireCooldown: 1 + Math.random() * 1.4,
    flash: 0,
    dead: false,
  };
}

export function spawnPointAwayFrom(player, minDistance = 260) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const edge = Math.floor(Math.random() * 4);
    const x = edge === 0 ? 40 : edge === 1 ? VIEW_WIDTH - 40 : 60 + Math.random() * (VIEW_WIDTH - 120);
    const y = edge === 2 ? 40 : edge === 3 ? VIEW_HEIGHT - 40 : 60 + Math.random() * (VIEW_HEIGHT - 120);
    if (Math.hypot(x - player.x, y - player.y) >= minDistance) return { x, y };
  }
  return { x: 60, y: 60 };
}

function steer(enemy, targetX, targetY, dt, strength = 3.2) {
  const dx = targetX - enemy.x;
  const dy = targetY - enemy.y;
  const distance = Math.hypot(dx, dy) || 1;
  const blend = 1 - Math.pow(0.001, dt * strength / 3.2);
  enemy.vx += ((dx / distance) * enemy.speed - enemy.vx) * blend;
  enemy.vy += ((dy / distance) * enemy.speed - enemy.vy) * blend;
}

export function updateEnemies(enemies, player, weaponState, dt, audio) {
  for (const enemy of enemies) {
    enemy.age += dt;
    enemy.flash = Math.max(0, enemy.flash - dt * 6);
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.hypot(dx, dy) || 1;

    if (enemy.kind === 'chaser' || enemy.kind === 'mini') {
      steer(enemy, player.x, player.y, dt);
    } else if (enemy.kind === 'weaver') {
      const perpendicular = enemy.age * 3.4 + enemy.phase;
      steer(enemy, player.x + Math.cos(perpendicular) * 90, player.y + Math.sin(perpendicular) * 90, dt);
    } else if (enemy.kind === 'shooter') {
      const desired = 250;
      const targetX = distance > desired + 30 ? player.x : distance < desired - 30 ? enemy.x - dx : enemy.x + -dy * 0.4;
      const targetY = distance > desired + 30 ? player.y : distance < desired - 30 ? enemy.y - dy : enemy.y + dx * 0.4;
      steer(enemy, targetX, targetY, dt, 2.2);
      enemy.fireCooldown -= dt;
      if (enemy.fireCooldown <= 0 && distance < 560) {
        enemy.fireCooldown = 1.6 + Math.random() * 0.9;
        fireEnemyBolt(weaponState, enemy, Math.atan2(dy, dx));
        audio.enemyHit();
      }
    } else if (enemy.kind === 'splitter') {
      steer(enemy, player.x, player.y, dt, 2.4);
    } else if (enemy.kind === 'boss') {
      updateBoss(enemy, player, weaponState, dt, audio);
    }

    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;
    enemy.x = Math.max(enemy.radius, Math.min(VIEW_WIDTH - enemy.radius, enemy.x));
    enemy.y = Math.max(enemy.radius, Math.min(VIEW_HEIGHT - enemy.radius, enemy.y));
  }
}

function updateBoss(boss, player, weaponState, dt, audio) {
  // The boss prowls the top band, sweeping side to side, and answers with
  // aimed shots plus a radial burst whenever it crosses the arena's middle.
  const targetX = VIEW_WIDTH / 2 + Math.sin(boss.age * 0.45) * (VIEW_WIDTH / 2 - 160);
  const targetY = 120 + Math.sin(boss.age * 0.9) * 34;
  steer(boss, targetX, targetY, dt, 1.6);
  boss.fireCooldown -= dt;
  if (boss.fireCooldown <= 0) {
    boss.fireCooldown = 1.15;
    const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
    fireEnemyBolt(weaponState, boss, angle - 0.16, 265);
    fireEnemyBolt(weaponState, boss, angle, 265);
    fireEnemyBolt(weaponState, boss, angle + 0.16, 265);
    if (boss.hull < boss.maxHull * 0.55) {
      for (let i = 0; i < 10; i += 1) fireEnemyBolt(weaponState, boss, (i / 10) * Math.PI * 2 + boss.age, 185);
    }
    audio.enemyHit();
  }
}

export function drawEnemy(ctx, enemy, time) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  const flash = enemy.flash > 0.4;
  ctx.shadowColor = enemy.color;
  ctx.shadowBlur = 13;
  ctx.fillStyle = flash ? '#ffffff' : '#160a1e';
  ctx.strokeStyle = flash ? '#ffffff' : enemy.color;
  ctx.lineWidth = 2;

  if (enemy.kind === 'chaser' || enemy.kind === 'mini') {
    const angle = Math.atan2(enemy.vy, enemy.vx);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(enemy.radius + 3, 0);
    ctx.lineTo(-enemy.radius, -enemy.radius + 3);
    ctx.lineTo(-enemy.radius + 4, 0);
    ctx.lineTo(-enemy.radius, enemy.radius - 3);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  } else if (enemy.kind === 'weaver') {
    ctx.rotate(enemy.age * 2.4);
    const r = enemy.radius;
    ctx.beginPath();
    ctx.moveTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.lineTo(-r, 0);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  } else if (enemy.kind === 'shooter') {
    ctx.rotate(enemy.age * 0.7);
    const r = enemy.radius;
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.rotate(-enemy.age * 0.7);
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.kind === 'splitter') {
    const pulse = 1 + Math.sin(enemy.age * 5) * 0.06;
    ctx.scale(pulse, pulse);
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = enemy.color;
    for (const [ox, oy] of [[-6, -4], [6, -4], [0, 6]]) {
      ctx.beginPath();
      ctx.arc(ox, oy, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (enemy.kind === 'boss') {
    drawBossShape(ctx, enemy, time);
  }
  ctx.restore();

  // A thin damage arc on anything tougher than a one-hit kill.
  if (enemy.maxHull > 2 && enemy.hull < enemy.maxHull && enemy.kind !== 'boss') {
    ctx.save();
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius + 6, -Math.PI / 2, -Math.PI / 2 + (enemy.hull / enemy.maxHull) * Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawBossShape(ctx, boss, time) {
  const r = boss.radius;
  ctx.rotate(Math.sin(time * 0.6) * 0.08);
  ctx.beginPath();
  ctx.moveTo(r + 16, 0);
  ctx.lineTo(r * 0.3, -r * 0.8);
  ctx.lineTo(-r * 0.7, -r);
  ctx.lineTo(-r - 8, -r * 0.3);
  ctx.lineTo(-r - 8, r * 0.3);
  ctx.lineTo(-r * 0.7, r);
  ctx.lineTo(r * 0.3, r * 0.8);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = boss.color;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.55, time * 0.8, time * 0.8 + Math.PI * 1.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.34, -time * 1.1, -time * 1.1 + Math.PI * 1.2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ff5470';
  ctx.beginPath();
  ctx.arc(0, 0, 8 + Math.sin(time * 6) * 1.6, 0, Math.PI * 2);
  ctx.fill();
}
