// Synthesized HUD sound effects via Web Audio API — no audio asset files,
// so there's nothing to license or hotlink. Respects a mute toggle persisted
// in localStorage and only creates the AudioContext after a user gesture
// (required by browser autoplay policies).

const STORAGE_KEY = "ares.muted";

let ctx = null;
let muted = localStorage.getItem(STORAGE_KEY) === "1";

function getCtx() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone({ freq = 440, duration = 0.08, type = "square", gain = 0.05, sweepTo = null, delay = 0 }) {
  if (muted) return;
  const audioCtx = getCtx();
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const amp = audioCtx.createGain();
  osc.type = type;
  const startAt = audioCtx.currentTime + delay;
  osc.frequency.setValueAtTime(freq, startAt);
  if (sweepTo) osc.frequency.exponentialRampToValueAtTime(sweepTo, startAt + duration);

  amp.gain.setValueAtTime(0.0001, startAt);
  amp.gain.exponentialRampToValueAtTime(gain, startAt + 0.008);
  amp.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(amp).connect(audioCtx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

export const sound = {
  click() {
    tone({ freq: 620, duration: 0.05, type: "square", gain: 0.045 });
  },
  hover() {
    tone({ freq: 960, duration: 0.02, type: "sine", gain: 0.015 });
  },
  confirm() {
    tone({ freq: 440, duration: 0.09, type: "triangle", gain: 0.05, sweepTo: 880 });
  },
  deny() {
    tone({ freq: 180, duration: 0.16, type: "sawtooth", gain: 0.05, sweepTo: 90 });
  },
  radarPing() {
    tone({ freq: 1400, duration: 0.35, type: "sine", gain: 0.03, sweepTo: 400 });
  },
  toggle() {
    tone({ freq: 300, duration: 0.06, type: "square", gain: 0.04, sweepTo: 700 });
  },
  alert() {
    tone({ freq: 700, duration: 0.1, type: "square", gain: 0.05 });
    tone({ freq: 700, duration: 0.1, type: "square", gain: 0.05, delay: 0.14 });
  },

  isMuted() {
    return muted;
  },
  setMuted(next) {
    muted = next;
    localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
  },
  toggleMuted() {
    this.setMuted(!muted);
    return muted;
  },
};
