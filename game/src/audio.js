// All sound is WebAudio oscillator beeps made at run time — no audio files, no
// network. Created lazily on the first user gesture, so the game stays silent
// until the player interacts, and silent in screenshot mode.

let context = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function ensureContext() {
  if (context) return context;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  context = new AudioContext();
  return context;
}

/** Unlock audio on a gesture (called from the first key / pointer press). */
export function unlockAudio() {
  const ctx = ensureContext();
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

/** One short beep: frequency in Hz, length in seconds, kind of wave, volume. */
export function beep(freq, seconds, type, volume) {
  if (muted) return;
  const ctx = ensureContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(volume || 0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + seconds + 0.02);
}

export function soundPickup() {
  beep(520, 0.08, 'triangle', 0.1);
}

export function soundChop() {
  beep(180, 0.07, 'square', 0.08);
  setTimeout(() => beep(140, 0.06, 'square', 0.06), 90);
}

export function soundChopped() {
  beep(660, 0.09, 'triangle', 0.1);
  setTimeout(() => beep(880, 0.12, 'triangle', 0.1), 90);
}

export function soundSizzle() {
  beep(240, 0.15, 'sawtooth', 0.04);
}

export function soundGrilled() {
  beep(740, 0.1, 'triangle', 0.1);
  setTimeout(() => beep(990, 0.14, 'triangle', 0.1), 100);
}

export function soundServe() {
  beep(784, 0.1, 'triangle', 0.12);
  setTimeout(() => beep(1047, 0.16, 'triangle', 0.12), 100);
}

export function soundExpire() {
  beep(220, 0.25, 'sawtooth', 0.1);
  setTimeout(() => beep(165, 0.3, 'sawtooth', 0.1), 160);
}

export function soundBurnt() {
  beep(130, 0.3, 'sawtooth', 0.1);
}

export function soundClick() {
  beep(440, 0.05, 'triangle', 0.07);
}
