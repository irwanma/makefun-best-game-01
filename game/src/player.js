// NEONFALL player: the little neon ship — movement with a soft thrust feel,
// a shield that soaks damage before the hull, and the flicker of invulnerability
// after a hit so one mistake never chains into three.

import { ARENA_MARGIN, PALETTE, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';

export function createPlayer(build) {
  return {
    x: VIEW_WIDTH / 2,
    y: VIEW_HEIGHT / 2 + 120,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    radius: build.radius,
    hull: build.hull,
    shield: build.shield,
    fireCooldown: 0,
    hurtCooldown: 0,
    invulnerable: 0,
    thrust: 0,
  };
}

export function updatePlayer(player, build, input, dt) {
  const axis = input.moveAxis();
  const length = Math.hypot(axis.x, axis.y) || 1;
  const targetVx = (axis.x / length) * build.speed * (axis.x || axis.y ? 1 : 0);
  const targetVy = (axis.y / length) * build.speed * (axis.x || axis.y ? 1 : 0);
  const blend = 1 - Math.pow(0.0001, dt);
  player.vx += (targetVx - player.vx) * blend;
  player.vy += (targetVy - player.vy) * blend;
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  player.thrust = Math.min(1, Math.hypot(player.vx, player.vy) / build.speed);
  player.x = Math.max(ARENA_MARGIN + player.radius, Math.min(VIEW_WIDTH - ARENA_MARGIN - player.radius, player.x));
  player.y = Math.max(ARENA_MARGIN + player.radius, Math.min(VIEW_HEIGHT - ARENA_MARGIN - player.radius, player.y));
  player.angle = Math.atan2(input.pointerY - player.y, input.pointerX - player.x);
  player.fireCooldown = Math.max(0, player.fireCooldown - dt);
  player.invulnerable = Math.max(0, player.invulnerable - dt);
  if (player.hurtCooldown > 0) player.hurtCooldown -= dt;
  if (player.hurtCooldown <= 0 && player.shield < build.shield) {
    player.shield = Math.min(build.shield, player.shield + build.shieldRegenPerSecond * dt);
  }
}

// Returns true when the hit actually landed (not during invulnerability).
export function damagePlayer(player, amount) {
  if (player.invulnerable > 0) return false;
  player.invulnerable = 0.45;
  player.hurtCooldown = 3.5;
  const absorbed = Math.min(player.shield, amount);
  player.shield -= absorbed;
  player.hull -= amount - absorbed;
  return true;
}

export function drawPlayer(ctx, player, time) {
  const flicker = player.invulnerable > 0 && Math.floor(time * 18) % 2 === 0;
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  // Engine flame, sized by thrust.
  const flame = 12 + player.thrust * 16 + Math.sin(time * 31) * 3;
  ctx.globalCompositeOperation = 'lighter';
  const gradient = ctx.createLinearGradient(-player.radius, 0, -player.radius - flame, 0);
  gradient.addColorStop(0, 'rgba(245, 158, 11, 0.9)');
  gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(-player.radius + 2, -5);
  ctx.lineTo(-player.radius - flame, 0);
  ctx.lineTo(-player.radius + 2, 5);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  // Hull: a sleek dart with a bright cockpit.
  ctx.globalAlpha = flicker ? 0.35 : 1;
  ctx.shadowColor = PALETTE.player;
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#0b2b3a';
  ctx.strokeStyle = PALETTE.player;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(player.radius + 5, 0);
  ctx.lineTo(-player.radius, -player.radius + 2);
  ctx.lineTo(-player.radius + 5, 0);
  ctx.lineTo(-player.radius, player.radius - 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath();
  ctx.arc(3, 0, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Shield bubble while the shield holds.
  if (player.shield > 0.5) {
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.1 * Math.sin(time * 3);
    ctx.strokeStyle = PALETTE.shieldCell;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
