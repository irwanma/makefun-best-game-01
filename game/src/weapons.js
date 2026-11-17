// NEONFALL weapons: the player's volley (which the upgrade build reshapes —
// more projectiles, a wider fan, piercing rounds) and the enemies' slower
// bolts, kept in separate lists so collisions never confuse the two.

import { PALETTE } from './config.js';

export function createWeaponState() {
  return { playerBullets: [], enemyBullets: [] };
}

export function firePlayerVolley(state, player, build, audio) {
  if (player.fireCooldown > 0) return;
  player.fireCooldown = build.fireInterval;
  const count = build.projectiles;
  const spreadStep = 0.09;
  for (let i = 0; i < count; i += 1) {
    const offset = (i - (count - 1) / 2) * spreadStep;
    const angle = player.angle + offset;
    state.playerBullets.push({
      x: player.x + Math.cos(player.angle) * (player.radius + 6),
      y: player.y + Math.sin(player.angle) * (player.radius + 6),
      vx: Math.cos(angle) * build.bulletSpeed,
      vy: Math.sin(angle) * build.bulletSpeed,
      radius: build.bulletRadius,
      damage: build.bulletDamage,
      pierceLeft: build.pierce,
    });
  }
  audio.shoot();
}

export function fireEnemyBolt(state, enemy, angle, speed = 235) {
  state.enemyBullets.push({
    x: enemy.x + Math.cos(angle) * (enemy.radius + 4),
    y: enemy.y + Math.sin(angle) * (enemy.radius + 4),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 5,
    damage: enemy.damage,
  });
}

export function updateBullets(state, view, dt) {
  for (const list of [state.playerBullets, state.enemyBullets]) {
    for (let i = list.length - 1; i >= 0; i -= 1) {
      const bullet = list[i];
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      if (bullet.x < -20 || bullet.x > view.width + 20 || bullet.y < -20 || bullet.y > view.height + 20) {
        list.splice(i, 1);
      }
    }
  }
}

export function drawBullets(ctx, state) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const bullet of state.playerBullets) {
    ctx.shadowColor = PALETTE.bullet;
    ctx.shadowBlur = 10;
    ctx.fillStyle = PALETTE.bullet;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const bullet of state.enemyBullets) {
    ctx.shadowColor = PALETTE.enemyBullet;
    ctx.shadowBlur = 10;
    ctx.fillStyle = PALETTE.enemyBullet;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
