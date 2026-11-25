// Keyboard and mouse input, translated into game intents.
// Keyboard: WASD / arrows move, E interacts, 1-6 grab a pantry ingredient,
// Space serves, Enter starts, P pauses, M mutes, R restarts.
// Mouse: click the floor to walk there, click a station to use it.

export function createInput(canvas) {
  const input = {
    up: false,
    down: false,
    left: false,
    right: false,
    interactPressed: false,
    servePressed: false,
    startPressed: false,
    pausePressed: false,
    mutePressed: false,
    restartPressed: false,
    digitPressed: null,
    /** Latest click, in logical canvas coordinates, or null. */
    click: null,
    /** Latest click-to-move target, in logical coordinates, or null. */
    moveTarget: null,
    /** Pointer position, in logical coordinates. */
    pointer: { x: 0, y: 0 },
  };

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 720 / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  const KEYMAP = {
    KeyW: 'up',
    ArrowUp: 'up',
    KeyS: 'down',
    ArrowDown: 'down',
    KeyA: 'left',
    ArrowLeft: 'left',
    KeyD: 'right',
    ArrowRight: 'right',
  };

  window.addEventListener('keydown', (event) => {
    if (KEYMAP[event.code]) {
      input[KEYMAP[event.code]] = true;
      event.preventDefault();
      return;
    }
    if (event.repeat) return;
    if (event.code === 'KeyE') input.interactPressed = true;
    else if (event.code === 'Space') {
      input.servePressed = true;
      event.preventDefault();
    } else if (event.code === 'Enter') input.startPressed = true;
    else if (event.code === 'KeyP' || event.code === 'Escape') input.pausePressed = true;
    else if (event.code === 'KeyM') input.mutePressed = true;
    else if (event.code === 'KeyR') input.restartPressed = true;
    else if (/^Digit[1-6]$/.test(event.code)) input.digitPressed = Number(event.code.slice(5));
  });

  window.addEventListener('keyup', (event) => {
    if (KEYMAP[event.code]) input[KEYMAP[event.code]] = false;
  });

  canvas.addEventListener('pointerdown', (event) => {
    const point = toLogical(event);
    input.pointer = point;
    input.click = point;
  });

  canvas.addEventListener('pointermove', (event) => {
    input.pointer = toLogical(event);
  });

  /** Edge-triggered presses are consumed after each frame. */
  input.consumeEdges = function consumeEdges() {
    input.interactPressed = false;
    input.servePressed = false;
    input.startPressed = false;
    input.pausePressed = false;
    input.mutePressed = false;
    input.restartPressed = false;
    input.digitPressed = null;
    input.click = null;
  };

  return input;
}
