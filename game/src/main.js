// Sizzle & Serve — boot, the fixed-step game loop, and the screenshot mode.
// Play: ?shot=start|play|end&seed=1 renders one frozen scene for screenshots.

import { BEST_KEY, FIELD, STEP } from './config.js';
import { createInput } from './input.js';
import { renderGame } from './render.js';
import { stageShot } from './shots.js';
import { SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, createWorld, resetWorld, stepWorld } from './world.js';
import { isMuted, toggleMute, unlockAudio } from './audio.js';

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || 1) || 1;

const world = createWorld(seed);
const input = createInput(canvas);

// A handle for automated playtests (and nothing else): the live world state.
window.__sizzle = { world, input };

function fitCanvas() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;
  canvas.style.width = `${Math.floor(FIELD.width * scale)}px`;
  canvas.style.height = `${Math.floor(FIELD.height * scale)}px`;
}

function announce() {
  if (!status) return;
  const held = world.chef.held ? ` Holding ${world.chef.held.label || world.chef.held.id}.` : '';
  status.textContent =
    world.screen === SCREEN_PLAY
      ? `Playing. Score ${world.score}, ${world.coins} coins, ${world.served} served, ${world.orders.length} orders open, ${Math.ceil(world.dayTimeLeft)} seconds left in the day.${held}`
      : world.screen === SCREEN_OVER
        ? `Day over. Final score ${world.score}, ${world.served} dishes served.`
        : 'Sizzle and Serve. Press Enter to start cooking.';
}

if (shotName) {
  // Screenshot mode: one frozen, deterministic frame — no loop, no audio.
  fitCanvas();
  stageShot(shotName, world);
  renderGame(ctx, world, world.time);
  document.title = `Sizzle & Serve — ${shotName}`;
} else {
  fitCanvas();
  window.addEventListener('resize', fitCanvas);

  let last = performance.now();
  let accumulator = 0;
  let best = Number(window.localStorage.getItem(BEST_KEY) || 0);

  function frame(now) {
    const elapsed = Math.min(0.25, (now - last) / 1000);
    last = now;
    accumulator += elapsed;

    unlockAudio();
    if (input.mutePressed) toggleMute();
    if (input.restartPressed && (world.screen === SCREEN_OVER || world.screen === SCREEN_PLAY)) {
      resetWorld(world);
    }

    if (world.screen === SCREEN_TITLE) {
      if (input.startPressed || input.click) {
        resetWorld(world);
        announce();
      }
    } else if (world.screen === SCREEN_PAUSED) {
      if (input.pausePressed || input.click || input.startPressed) world.screen = SCREEN_PLAY;
    } else if (world.screen === SCREEN_OVER) {
      if (input.restartPressed || input.click) resetWorld(world);
    } else if (world.screen === SCREEN_PLAY) {
      if (input.pausePressed) {
        world.screen = SCREEN_PAUSED;
      } else {
        while (accumulator >= STEP) {
          stepWorld(world, input, STEP);
          accumulator -= STEP;
          if (world.screen !== SCREEN_PLAY) break;
        }
        if (world.score > best) {
          best = world.score;
          window.localStorage.setItem(BEST_KEY, String(best));
        }
      }
    }

    renderGame(ctx, world, world.time);
    input.consumeEdges();
    announce();
    requestAnimationFrame(frame);
  }

  announce();
  requestAnimationFrame(frame);
}
