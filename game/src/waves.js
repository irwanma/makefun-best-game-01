// NEONFALL waves: the director that decides what falls next. Every wave has
// a roster and a spawn queue; every fifth wave is a boss with an escort, and
// the swarm's hull thickens a little each wave so the pressure never plateaus.

import { BOSS_EVERY_WAVES } from './config.js';
import { spawnEnemy, spawnPointAwayFrom } from './enemies.js';

export function planWave(waveNumber) {
  const roster = [];
  const add = (kind, count) => { for (let i = 0; i < count; i += 1) roster.push(kind); };
  if (waveNumber % BOSS_EVERY_WAVES === 0) {
    add('boss', 1);
    add('chaser', 3 + waveNumber / BOSS_EVERY_WAVES);
    add('shooter', 2);
    return shuffle(roster);
  }
  add('chaser', 4 + waveNumber * 2);
  if (waveNumber >= 2) add('weaver', 2 + waveNumber);
  if (waveNumber >= 3) add('shooter', Math.min(6, waveNumber - 1));
  if (waveNumber >= 4) add('splitter', Math.min(5, waveNumber - 2));
  return shuffle(roster);
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  // The boss always leads its wave, whatever the shuffle did.
  const bossIndex = copy.indexOf('boss');
  if (bossIndex > 0) { copy.splice(bossIndex, 1); copy.unshift('boss'); }
  return copy;
}

export function createWaveDirector() {
  return {
    waveNumber: 0,
    queue: [],
    spawnTimer: 0,
    betweenWaves: true,
  };
}

export function startNextWave(director) {
  director.waveNumber += 1;
  director.queue = planWave(director.waveNumber);
  director.spawnTimer = 0.4;
  director.betweenWaves = false;
  return director.waveNumber;
}

export function updateWaveDirector(director, enemies, player, dt) {
  if (director.queue.length === 0) return;
  director.spawnTimer -= dt;
  if (director.spawnTimer > 0) return;
  director.spawnTimer = Math.max(0.32, 0.85 - director.waveNumber * 0.04);
  const kind = director.queue.shift();
  const point = spawnPointAwayFrom(player);
  const hullScale = 1 + (director.waveNumber - 1) * 0.16;
  enemies.push(spawnEnemy(kind, point.x, point.y, hullScale));
}

export function isWaveCleared(director, enemies) {
  return !director.betweenWaves && director.queue.length === 0 && enemies.length === 0;
}

export function isBossWave(waveNumber) {
  return waveNumber % BOSS_EVERY_WAVES === 0;
}
