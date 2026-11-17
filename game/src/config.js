// NEONFALL configuration: the arena, the palette and every balance number in
// one place, so the rest of the game reads as rules rather than magic numbers.

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;
export const ARENA_MARGIN = 28;

export const PALETTE = {
  background: '#04050d',
  gridLine: 'rgba(56, 89, 199, 0.16)',
  gridGlow: 'rgba(34, 211, 238, 0.05)',
  player: '#22d3ee',
  playerFlame: '#f59e0b',
  bullet: '#a5f3fc',
  chaser: '#fb4d6d',
  weaver: '#f471ff',
  shooter: '#ffb020',
  splitter: '#4ade80',
  mini: '#86efac',
  boss: '#a78bfa',
  enemyBullet: '#ff7a59',
  shieldCell: '#38bdf8',
  repairCell: '#34d399',
  text: '#e2e8f0',
  textDim: '#8b9bb4',
  danger: '#ff5470',
};

export const PLAYER_BASE = {
  radius: 13,
  speed: 305,
  hull: 100,
  shield: 40,
  shieldRegenPerSecond: 2.2,
  shieldRegenDelay: 3.5,
  fireInterval: 0.16,
  bulletSpeed: 640,
  bulletDamage: 1,
  bulletRadius: 4,
};

export const ENEMY_TYPES = {
  chaser:   { radius: 14, hull: 2, speed: 118, score: 50,  damage: 12, color: PALETTE.chaser },
  weaver:   { radius: 13, hull: 2, speed: 96,  score: 75,  damage: 12, color: PALETTE.weaver },
  shooter:  { radius: 15, hull: 3, speed: 74,  score: 100, damage: 10, color: PALETTE.shooter },
  splitter: { radius: 19, hull: 4, speed: 62,  score: 125, damage: 14, color: PALETTE.splitter },
  mini:     { radius: 8,  hull: 1, speed: 165, score: 25,  damage: 8,  color: PALETTE.mini },
  boss:     { radius: 52, hull: 90, speed: 46, score: 1500, damage: 20, color: PALETTE.boss },
};

export const COMBO_WINDOW_SECONDS = 2.6;
export const COMBO_MAX_MULTIPLIER = 8;
export const PICKUP_DROP_CHANCE = 0.16;
export const BOSS_EVERY_WAVES = 5;

// The upgrade pool the between-wave choice screen draws three cards from.
// Each entry knows how to change the player's build, so a run never repeats
// the same shape twice.
export const UPGRADE_POOL = [
  { id: 'rapid',    name: 'RAPID FIRE',    tint: '#22d3ee', blurb: 'Fire 18% faster. Stacks forever.',        apply: (build) => { build.fireInterval *= 0.82; } },
  { id: 'split',    name: 'SPLIT SHOT',    tint: '#f471ff', blurb: '+1 projectile per volley.',               apply: (build) => { build.projectiles += 1; } },
  { id: 'caliber',  name: 'HEAVY CALIBER', tint: '#ffb020', blurb: '+1 damage on every bullet.',              apply: (build) => { build.bulletDamage += 1; } },
  { id: 'pierce',   name: 'PIERCING ROUNDS', tint: '#a5f3fc', blurb: 'Bullets pass through +1 enemy.',        apply: (build) => { build.pierce += 1; } },
  { id: 'aegis',    name: 'AEGIS REGEN',   tint: '#38bdf8', blurb: 'Shield regenerates 70% faster.',          apply: (build) => { build.shieldRegenPerSecond *= 1.7; } },
  { id: 'hull',     name: 'REINFORCED HULL', tint: '#4ade80', blurb: '+25 max hull and repair 25 now.',       apply: (build, player) => { build.hull += 25; player.hull = Math.min(build.hull, player.hull + 25); } },
  { id: 'magnet',   name: 'MAGNET CORE',   tint: '#a78bfa', blurb: 'Pickups drift to you from twice as far.', apply: (build) => { build.magnetRadius *= 2; } },
  { id: 'thrusters', name: 'SWIFT THRUSTERS', tint: '#fb4d6d', blurb: 'Move 12% faster. Outrun the swarm.',   apply: (build) => { build.speed *= 1.12; } },
];
