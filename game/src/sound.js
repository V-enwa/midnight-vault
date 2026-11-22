export function createSound() {
  let ctx = null;
  let muted = true;
  let tickTimer = 0;
  let tickRate = 0;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function play(freq, dur, type, vol, rampDown) {
    const c = getCtx();
    if (c.state === 'suspended') c.resume();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    gain.gain.setValueAtTime(Math.min(vol, 0.25), c.currentTime);
    if (rampDown !== false) {
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    }
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + dur);
  }

  return {
    tick(dt, alarmLevel) {
      if (alarmLevel <= 0) { tickTimer = 0; tickRate = 0; return; }
      const rate = 0.08 + alarmLevel * 0.45;
      tickTimer += dt;
      if (tickTimer >= rate) {
        tickTimer -= rate;
        const freq = 600 + alarmLevel * 500;
        play(freq, 0.04, 'square', alarmLevel * 0.12);
      }
    },

    chime() { play(1000, 0.12, 'sine', 0.15); setTimeout(() => play(1400, 0.14, 'sine', 0.12), 60); setTimeout(() => play(1800, 0.18, 'sine', 0.10), 120); },

    sting() {
      play(180, 0.5, 'sawtooth', 0.14);
      setTimeout(() => play(120, 0.4, 'sawtooth', 0.12), 100);
      setTimeout(() => play(80, 0.3, 'sawtooth', 0.10), 200);
    },

    caseBreak() {
      play(80, 0.15, 'triangle', 0.15);
      setTimeout(() => play(200, 0.1, 'square', 0.08), 50);
      setTimeout(() => play(300, 0.08, 'square', 0.06), 80);
    },

    winJingle() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => setTimeout(() => play(f, 0.25, 'sine', 0.13), i * 120));
    },

    laserZap() { play(220, 0.06, 'square', 0.1); },

    unmute() { muted = false; },

    get muted() { return muted; },
  };
}