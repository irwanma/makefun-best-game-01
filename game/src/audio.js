// NEONFALL audio: tiny WebAudio synth effects — no files, no samples, every
// sound is an oscillator with an envelope. Lazily created on first user
// gesture so the browser never blocks it, and mutable with M.

export function createAudio() {
  let context = null;
  let muted = false;

  const ensureContext = () => {
    if (!context) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (AudioCtor) context = new AudioCtor();
    }
    if (context && context.state === 'suspended') context.resume();
    return context;
  };

  const tone = (frequency, endFrequency, duration, type, volume, delay = 0) => {
    if (muted) return;
    const ctx = ensureContext();
    if (!ctx) return;
    const start = ctx.currentTime + delay;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  };

  const noiseBurst = (duration, volume) => {
    if (muted) return;
    const ctx = ensureContext();
    if (!ctx) return;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
  };

  return {
    unlock: ensureContext,
    toggleMute() { muted = !muted; return muted; },
    isMuted: () => muted,
    shoot() { tone(880, 220, 0.08, 'square', 0.05); },
    enemyHit() { tone(300, 160, 0.05, 'triangle', 0.06); },
    explosion(big = false) { noiseBurst(big ? 0.5 : 0.22, big ? 0.4 : 0.2); tone(big ? 120 : 180, 40, big ? 0.5 : 0.25, 'sawtooth', 0.12); },
    playerHurt() { tone(220, 70, 0.2, 'sawtooth', 0.18); },
    pickup() { tone(660, 990, 0.1, 'sine', 0.12); tone(990, 1320, 0.12, 'sine', 0.1, 0.07); },
    upgrade() { tone(523, 523, 0.1, 'triangle', 0.12); tone(659, 659, 0.1, 'triangle', 0.12, 0.09); tone(784, 1046, 0.18, 'triangle', 0.14, 0.18); },
    waveClear() { tone(392, 392, 0.1, 'sine', 0.1); tone(587, 880, 0.2, 'sine', 0.1, 0.1); },
    gameOver() { tone(330, 55, 0.9, 'sawtooth', 0.16); },
    bossWarn() { tone(98, 98, 0.3, 'square', 0.16); tone(98, 98, 0.3, 'square', 0.16, 0.4); },
  };
}
