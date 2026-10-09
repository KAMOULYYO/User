/* ==========================================================================
   NUTRISPORT — sound design (synthesised with WebAudio, no audio files)
   Off by default; the choice is remembered per visitor.
   ========================================================================== */
(() => {
  "use strict";
  const NS = window.NS || (window.NS = {});
  const KEY = "nutrisport-sound";
  let enabled = false;
  try { enabled = localStorage.getItem(KEY) === "1"; } catch (_) { /* storage unavailable */ }
  let ctx = null;
  let master = null;
  let noiseBuf = null;

  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function noise({ dur = 0.3, from = 400, to = 3000, q = 1, gain = 0.4, type = "bandpass", attack = 0.02, delay = 0 }) {
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
  }
  function tone({ freq = 440, to = null, dur = 0.15, gain = 0.25, type = "sine", delay = 0 }) {
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  const SOUNDS = {
    whoosh: () => noise({ dur: 0.55, from: 300, to: 2400, q: 0.8, gain: 0.35, attack: 0.18 }),
    click: () => tone({ freq: 1800, to: 900, dur: 0.05, gain: 0.12, type: "triangle" }),
    pop: () => { tone({ freq: 420, to: 880, dur: 0.12, gain: 0.25 }); tone({ freq: 1320, dur: 0.18, gain: 0.08, delay: 0.06 }); },
    twist: () => { for (let i = 0; i < 6; i++) noise({ dur: 0.04, from: 2500, to: 1800, q: 6, gain: 0.25, delay: i * 0.045, attack: 0.004 }); },
    scoop: () => noise({ dur: 0.35, from: 1200, to: 300, q: 1.2, gain: 0.3, type: "lowpass", attack: 0.03 }),
    shake: () => {
      for (let i = 0; i < 10; i++) noise({ dur: 0.09, from: 900 + (i % 2) * 500, to: 2600, q: 2, gain: 0.3, delay: i * 0.11, attack: 0.01 });
    },
    pour: () => noise({ dur: 1.2, from: 600, to: 1400, q: 0.6, gain: 0.22, type: "lowpass", attack: 0.2 }),
    reveal: () => { [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.35, gain: 0.12, type: "triangle", delay: i * 0.08 })); },
    tick: () => tone({ freq: 2400, dur: 0.02, gain: 0.04, type: "square" }),
  };

  function play(name) {
    if (!enabled || !SOUNDS[name]) return;
    if (!audio()) return;
    try { SOUNDS[name](); } catch (_) { /* ignore */ }
  }

  function setEnabled(on) {
    enabled = on;
    try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (_) { /* storage unavailable */ }
    const btn = document.getElementById("soundBtn");
    if (btn) {
      btn.setAttribute("aria-pressed", on);
      btn.setAttribute("aria-label", on ? "Couper le son" : "Activer le son");
      btn.classList.toggle("is-on", on);
    }
    if (on) { audio(); play("pop"); }
  }

  NS.sfx = { play, setEnabled, get enabled() { return enabled; } };
  const btn = document.getElementById("soundBtn");
  if (btn) {
    btn.addEventListener("click", () => setEnabled(!enabled));
    // reflect the stored preference (audio itself starts on the first user gesture)
    btn.classList.toggle("is-on", enabled);
    btn.setAttribute("aria-pressed", enabled);
  }
})();
