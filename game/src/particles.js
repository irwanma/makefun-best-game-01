// NEONFALL particles: explosions, sparks, shockwave rings and floating score
// popups. One pooled system, additive glow rendering, no allocation spikes.

export function createParticles() {
  const sparks = [];
  const rings = [];
  const popups = [];

  function burst(x, y, color, count = 16, power = 260) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.25 + Math.random() * 0.75) * power;
      sparks.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.35 + Math.random() * 0.45,
        age: 0,
        size: 1.5 + Math.random() * 2.5,
        color,
      });
    }
  }

  function ring(x, y, color, maxRadius = 70) {
    rings.push({ x, y, color, radius: 6, maxRadius, age: 0, life: 0.4 });
  }

  function popup(x, y, text, color = '#e2e8f0') {
    popups.push({ x, y, text, color, age: 0, life: 0.9 });
  }

  function update(dt) {
    for (let i = sparks.length - 1; i >= 0; i -= 1) {
      const spark = sparks[i];
      spark.age += dt;
      if (spark.age >= spark.life) { sparks.splice(i, 1); continue; }
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.vx *= 1 - 3.2 * dt;
      spark.vy *= 1 - 3.2 * dt;
    }
    for (let i = rings.length - 1; i >= 0; i -= 1) {
      const item = rings[i];
      item.age += dt;
      if (item.age >= item.life) { rings.splice(i, 1); continue; }
      item.radius = 6 + (item.maxRadius - 6) * (item.age / item.life);
    }
    for (let i = popups.length - 1; i >= 0; i -= 1) {
      const item = popups[i];
      item.age += dt;
      item.y -= 34 * dt;
      if (item.age >= item.life) popups.splice(i, 1);
    }
  }

  function draw(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const spark of sparks) {
      const fade = 1 - spark.age / spark.life;
      ctx.globalAlpha = fade;
      ctx.fillStyle = spark.color;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.size * fade + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const item of rings) {
      const fade = 1 - item.age / item.life;
      ctx.globalAlpha = fade * 0.8;
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.font = '700 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (const item of popups) {
      ctx.globalAlpha = 1 - item.age / item.life;
      ctx.fillStyle = item.color;
      ctx.fillText(item.text, item.x, item.y);
    }
    ctx.restore();
  }

  return { burst, ring, popup, update, draw, count: () => sparks.length };
}
