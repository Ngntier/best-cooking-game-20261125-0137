// All drawing lives here: the kitchen, the order board, the chef, the HUD and
// the title / pause / day-over screens. Canvas 2D, flat colours, every sprite
// drawn in code — no image files anywhere.

import {
  FIELD,
  FONT,
  INGREDIENTS,
  INGREDIENT_ORDER,
  PALETTE,
  STATIONS,
  recipeById,
  stationAnchor,
} from './config.js';
import { SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, nearestStation } from './world.js';

export { SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE };

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 700} ${size}px ${FONT}`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

/** Draw one ingredient icon centred at (x, y) with radius r. */
export function drawIngredientIcon(ctx, id, x, y, r) {
  const ing = INGREDIENTS[id];
  ctx.save();
  ctx.translate(x, y);
  if (id === 'bun') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, 2, r, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.fillRect(-r, 0, r * 2, 3);
    ctx.fillStyle = '#fff3d6';
    for (const [sx, sy] of [[-r * 0.4, -r * 0.45], [0, -r * 0.65], [r * 0.4, -r * 0.45]]) {
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'patty') {
    ctx.fillStyle = ing.color;
    roundRect(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.4);
    ctx.fill();
    ctx.fillStyle = ing.dark;
    for (let i = -1; i <= 1; i += 1) {
      ctx.fillRect(i * r * 0.55 - 1.5, -r * 0.55, 3, r * 1.1);
    }
  } else if (id === 'cheese') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.7);
    ctx.lineTo(0, -r * 0.8);
    ctx.lineTo(r, r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.dark;
    for (const [hx, hy] of [[-r * 0.3, r * 0.25], [r * 0.25, r * 0.35]]) {
      ctx.beginPath();
      ctx.arc(hx, hy, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'tomato') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3d9e4d';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.9);
    ctx.lineTo(-r * 0.35, -r * 0.4);
    ctx.lineTo(0, -r * 0.6);
    ctx.lineTo(r * 0.35, -r * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.35, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'lettuce') {
    ctx.fillStyle = ing.color;
    for (const [lx, ly, lr] of [[-r * 0.5, 0, r * 0.55], [0, -r * 0.15, r * 0.65], [r * 0.5, 0, r * 0.55]]) {
      ctx.beginPath();
      ctx.arc(lx, ly, lr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, r * 0.3);
    ctx.quadraticCurveTo(0, -r * 0.5, r * 0.6, r * 0.3);
    ctx.stroke();
  } else if (id === 'onion') {
    ctx.fillStyle = '#efe6f7';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = 2;
    for (const rr of [0.65, 0.4]) {
      ctx.beginPath();
      ctx.arc(0, 0, r * rr, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = ing.dark;
    ctx.beginPath();
    ctx.arc(0, -r * 0.9, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Map a plate label back to its ingredient id. */
function labelToId(label) {
  if (label === 'grilled patty') return 'patty';
  if (label.startsWith('chopped ')) return label.slice(8);
  return label;
}

function drawPlateItem(ctx, label, x, y, r) {
  const id = labelToId(label);
  drawIngredientIcon(ctx, id, x, y, r);
  if (label.startsWith('chopped ')) {
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.6, y);
    ctx.lineTo(x + r * 0.6, y);
    ctx.stroke();
  }
  if (label === 'grilled patty') {
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x + i * r * 0.5, y - r * 0.5);
      ctx.lineTo(x + i * r * 0.5, y + r * 0.5);
      ctx.stroke();
    }
  }
}

function drawCounter(ctx, station, highlight) {
  ctx.fillStyle = PALETTE.counterTop;
  roundRect(ctx, station.x, station.y, station.w, station.h, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.counterFront;
  roundRect(ctx, station.x, station.y + station.h - 26, station.w, 26, 8);
  ctx.fill();
  if (highlight) {
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 4;
    roundRect(ctx, station.x - 3, station.y - 3, station.w + 6, station.h + 6, 12);
    ctx.stroke();
  }
  text(ctx, station.label, station.x + station.w / 2, station.y + station.h - 13, 12, '#ffe9b8', 800, 'center');
}

function drawPantry(ctx, world, highlight) {
  const station = STATIONS.pantry;
  drawCounter(ctx, station, highlight);
  const binW = station.w / INGREDIENT_ORDER.length;
  INGREDIENT_ORDER.forEach((id, i) => {
    const cx = station.x + binW * (i + 0.5);
    const cy = station.y + 38;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.fill();
    drawIngredientIcon(ctx, id, cx, cy, 17);
    text(ctx, INGREDIENTS[id].key, cx, station.y + 70, 11, '#7a6a55', 800, 'center');
  });
}

function drawBoard(ctx, world, highlight) {
  const station = STATIONS.board;
  drawCounter(ctx, station, highlight);
  ctx.fillStyle = '#e8d5a8';
  roundRect(ctx, station.x + 18, station.y + 12, station.w - 36, 46, 8);
  ctx.fill();
  ctx.strokeStyle = '#c9b183';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (world.board.item) {
    drawIngredientIcon(ctx, world.board.item.id, station.x + station.w / 2, station.y + 35, 16);
    if (world.board.progress < 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      roundRect(ctx, station.x + 22, station.y + 62, station.w - 44, 8, 4);
      ctx.fill();
      ctx.fillStyle = PALETTE.green;
      roundRect(ctx, station.x + 22, station.y + 62, (station.w - 44) * world.board.progress, 8, 4);
      ctx.fill();
      text(ctx, 'CHOPPING…', station.x + station.w / 2, station.y + 52, 10, '#2b2118', 800, 'center');
    } else {
      text(ctx, 'READY!', station.x + station.w / 2, station.y + 52, 10, '#2b7a3d', 800, 'center');
    }
  } else {
    text(ctx, 'chop here', station.x + station.w / 2, station.y + 35, 12, '#a08c6a', 700, 'center');
  }
}

function drawGrill(ctx, world, highlight) {
  const station = STATIONS.grill;
  drawCounter(ctx, station, highlight);
  ctx.fillStyle = '#3a3f46';
  roundRect(ctx, station.x + 16, station.y + 10, station.w - 32, 50, 8);
  ctx.fill();
  ctx.strokeStyle = '#22262b';
  ctx.lineWidth = 3;
  for (let i = 1; i <= 4; i += 1) {
    const gx = station.x + 16 + ((station.w - 32) / 5) * i;
    ctx.beginPath();
    ctx.moveTo(gx, station.y + 12);
    ctx.lineTo(gx, station.y + 58);
    ctx.stroke();
  }
  if (world.grill.item) {
    const cx = station.x + station.w / 2;
    const cy = station.y + 35;
    if (world.grill.state === 'burnt') {
      ctx.fillStyle = '#2b2118';
      roundRect(ctx, cx - 26, cy - 12, 52, 24, 10);
      ctx.fill();
      text(ctx, 'BURNT!', cx, station.y + 52, 11, '#ff8a7a', 800, 'center');
    } else {
      drawIngredientIcon(ctx, 'patty', cx, cy, 18);
      const frac = world.grill.state === 'grilled' ? 1 : world.grill.progress;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      roundRect(ctx, station.x + 22, station.y + 62, station.w - 44, 8, 4);
      ctx.fill();
      ctx.fillStyle = world.grill.state === 'grilled' ? PALETTE.green : '#ff7a2f';
      roundRect(ctx, station.x + 22, station.y + 62, (station.w - 44) * frac, 8, 4);
      ctx.fill();
      text(
        ctx,
        world.grill.state === 'grilled' ? `READY — grab it! ${Math.ceil(world.grill.grace)}s` : 'SIZZLING…',
        cx,
        station.y + 52,
        10,
        world.grill.state === 'grilled' ? '#7dff9a' : '#ffd9a0',
        800,
        'center',
      );
    }
  } else {
    text(ctx, 'grill a patty', station.x + station.w / 2, station.y + 35, 12, '#8b96a3', 700, 'center');
  }
}

function drawPlateStation(ctx, world, highlight) {
  const station = STATIONS.plate;
  drawCounter(ctx, station, highlight);
  ctx.fillStyle = '#f4f6f8';
  ctx.beginPath();
  ctx.ellipse(station.x + station.w / 2, station.y + 38, 62, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9d2dc';
  ctx.lineWidth = 2;
  ctx.stroke();
  world.plate.forEach((label, i) => {
    drawPlateItem(ctx, label, station.x + 52 + i * 38, station.y + 32, 15);
  });
  if (world.plate.length === 0) {
    text(ctx, 'build the dish here', station.x + station.w / 2, station.y + 36, 12, '#a08c6a', 700, 'center');
  }
}

function drawServeWindow(ctx, world, highlight) {
  const station = STATIONS.serve;
  drawCounter(ctx, station, highlight);
  ctx.fillStyle = '#fff3d6';
  roundRect(ctx, station.x + 14, station.y + 10, station.w - 28, 44, 8);
  ctx.fill();
  text(ctx, 'SERVE!', station.x + station.w / 2, station.y + 32, 16, '#b3541e', 800, 'center');
  const matched = world.plate.length > 0 && world.orders.some((o) => {
    const recipe = recipeById(o.recipeId);
    return world.plate.length === recipe.needs.length && [...world.plate].sort().join('|') === [...recipe.needs].sort().join('|');
  });
  if (matched) {
    text(ctx, 'ORDER MATCHES!', station.x + station.w / 2, station.y + 52, 11, '#2b7a3d', 800, 'center');
  }
}

function drawTrash(ctx, world, highlight) {
  const station = STATIONS.trash;
  ctx.fillStyle = highlight ? '#5a6a7a' : '#4a5560';
  roundRect(ctx, station.x, station.y, station.w, station.h, 10);
  ctx.fill();
  ctx.fillStyle = '#333c44';
  roundRect(ctx, station.x + 10, station.y + 8, station.w - 20, 12, 5);
  ctx.fill();
  text(ctx, 'TRASH', station.x + station.w / 2, station.y + 48, 13, '#e8ecf0', 800, 'center');
}

function drawOrders(ctx, world) {
  const y = 64;
  const ticketW = 218;
  const gap = 12;
  const startX = (FIELD.width - (ticketW * 4 + gap * 3)) / 2;
  text(ctx, 'ORDER BOARD', 36, y + 22, 15, '#7a6a55', 800, 'left');
  if (world.orders.length === 0) {
    text(ctx, 'No orders yet — the lunch rush is coming…', startX, y + 40, 15, '#7a6a55', 700, 'left');
  }
  world.orders.forEach((order, i) => {
    const recipe = recipeById(order.recipeId);
    const x = startX + i * (ticketW + gap);
    const frac = Math.max(0, order.timeLeft / order.life);
    ctx.fillStyle = PALETTE.ticket;
    roundRect(ctx, x, y, ticketW, 86, 10);
    ctx.fill();
    ctx.strokeStyle = PALETTE.ticketEdge;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = recipe.color;
    roundRect(ctx, x, y, 8, 86, 4);
    ctx.fill();
    text(ctx, `#${order.id} ${recipe.name}`, x + 18, y + 18, 15, PALETTE.text, 800, 'left');
    text(ctx, `${recipe.coins} coins`, x + ticketW - 12, y + 18, 13, '#b3541e', 800, 'right');
    recipe.needs.forEach((label, j) => {
      drawPlateItem(ctx, label, x + 30 + j * 34, y + 48, 13);
    });
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    roundRect(ctx, x + 14, y + 72, ticketW - 28, 7, 3);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? PALETTE.green : frac > 0.25 ? '#e8a13c' : PALETTE.accent;
    roundRect(ctx, x + 14, y + 72, (ticketW - 28) * frac, 7, 3);
    ctx.fill();
    text(ctx, `${Math.ceil(order.timeLeft)}s`, x + ticketW - 12, y + 52, 12, frac > 0.25 ? '#7a6a55' : PALETTE.accent, 800, 'right');
  });
}

function drawHud(ctx, world) {
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, FIELD.width, 56);
  text(ctx, 'SIZZLE & SERVE', 20, 29, 22, PALETTE.hudText, 800, 'left');
  // Day timer bar.
  const barX = 300;
  const barW = 340;
  text(ctx, 'DAY', barX - 8, 29, 13, PALETTE.hudText, 800, 'right');
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  roundRect(ctx, barX, 18, barW, 20, 10);
  ctx.fill();
  const frac = Math.max(0, world.dayTimeLeft / 150);
  ctx.fillStyle = frac > 0.5 ? PALETTE.green : frac > 0.25 ? '#e8a13c' : PALETTE.accent;
  roundRect(ctx, barX, 18, barW * frac, 20, 10);
  ctx.fill();
  text(ctx, `${Math.ceil(world.dayTimeLeft)}s`, barX + barW / 2, 29, 13, '#ffffff', 800, 'center');
  text(ctx, `SCORE ${world.score}`, 700, 29, 18, '#ffffff', 800, 'left');
  text(ctx, `COINS ${world.coins}`, 880, 29, 18, PALETTE.gold, 800, 'left');
  if (world.combo > 1) text(ctx, `COMBO x${world.combo}`, 990, 29, 18, '#ff8a7a', 800, 'left');
  let hx = 1160;
  for (let i = 0; i < 3; i += 1) {
    text(ctx, i < world.hearts ? '♥' : '♡', hx + i * 30, 29, 18, i < world.hearts ? '#ff6b7a' : 'rgba(255,255,255,0.35)', 800, 'left');
  }
}

function drawChef(ctx, world, t) {
  const chef = world.chef;
  const bob = chef.moving ? Math.sin(t * 14) * 3 : Math.sin(t * 2) * 1;
  const x = chef.x;
  const y = chef.y + bob * 0.4;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(x, chef.y + 26, 26, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body / coat.
  ctx.fillStyle = PALETTE.chefCoat;
  roundRect(ctx, x - 22, y - 8, 44, 34, 12);
  ctx.fill();
  ctx.fillStyle = PALETTE.chefPants;
  ctx.fillRect(x - 18, y + 22, 14, 10);
  ctx.fillRect(x + 4, y + 22, 14, 10);
  // Head.
  ctx.fillStyle = PALETTE.chefSkin;
  ctx.beginPath();
  ctx.arc(x, y - 22, 17, 0, Math.PI * 2);
  ctx.fill();
  // Toque.
  ctx.fillStyle = PALETTE.chefHat;
  ctx.beginPath();
  ctx.arc(x - 10, y - 36, 9, 0, Math.PI * 2);
  ctx.arc(x, y - 40, 10, 0, Math.PI * 2);
  ctx.arc(x + 10, y - 36, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 17, y - 38, 34, 8);
  // Face.
  ctx.fillStyle = '#2b2118';
  const ex = chef.dir * 4;
  ctx.beginPath();
  ctx.arc(x - 6 + ex, y - 24, 2, 0, Math.PI * 2);
  ctx.arc(x + 6 + ex, y - 24, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2b2118';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + ex, y - 18, 5, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // Held item above the head.
  if (chef.held) {
    const hy = y - 62;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(x, hy, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d8cdb4';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (chef.held.kind === 'burnt') {
      ctx.fillStyle = '#2b2118';
      roundRect(ctx, x - 13, hy - 7, 26, 14, 6);
      ctx.fill();
      text(ctx, '✕', x, hy, 12, '#ff8a7a', 800, 'center');
    } else if (chef.held.kind === 'raw') {
      drawIngredientIcon(ctx, chef.held.id, x, hy, 14);
    } else {
      drawPlateItem(ctx, chef.held.label, x, hy, 14);
    }
  }
}

function drawPrompt(ctx, world) {
  if (world.screen !== SCREEN_PLAY) return;
  const station = nearestStation(world);
  if (!station) return;
  const anchor = stationAnchor(STATIONS[station]);
  const labels = {
    pantry: 'E — pantry · click a bin or press 1-6',
    board: 'E — chop / pick up',
    grill: 'E — grill / pick up',
    plate: 'E — add to plate',
    serve: 'E / SPACE — serve the dish!',
    trash: 'E — bin it',
  };
  const label = labels[station] || 'E — use';
  ctx.font = `700 14px ${FONT}`;
  const w = ctx.measureText(label).width + 24;
  const x = Math.min(FIELD.width - w - 10, Math.max(10, anchor.x - w / 2));
  const y = anchor.y + 44;
  ctx.fillStyle = 'rgba(43,33,24,0.92)';
  roundRect(ctx, x, y, w, 30, 15);
  ctx.fill();
  text(ctx, label, x + w / 2, y + 15, 14, '#ffe9b8', 700, 'center');
}

function drawKitchen(ctx, world, t) {
  // Wall and floor.
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 56, FIELD.width, 110);
  ctx.fillStyle = PALETTE.wallTrim;
  ctx.fillRect(0, 160, FIELD.width, 8);
  ctx.fillStyle = PALETTE.floorA;
  ctx.fillRect(0, 168, FIELD.width, FIELD.height - 168);
  ctx.fillStyle = PALETTE.floorB;
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 10; col += 1) {
      if ((row + col) % 2 === 0) continue;
      ctx.fillRect(20 + col * 126, 290 + row * 88, 126, 88);
    }
  }
  // Wall decor: a clock over the serve window.
  ctx.fillStyle = '#fffdf5';
  ctx.beginPath();
  ctx.arc(1180, 110, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2b2118';
  ctx.lineWidth = 3;
  ctx.stroke();
  const angle = ((world.time % 60) / 60) * Math.PI * 2 - Math.PI / 2;
  ctx.beginPath();
  ctx.moveTo(1180, 110);
  ctx.lineTo(1180 + Math.cos(angle) * 20, 110 + Math.sin(angle) * 20);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1180, 110);
  ctx.lineTo(1180, 92);
  ctx.stroke();

  const near = nearestStation(world);
  drawPantry(ctx, world, near === 'pantry');
  drawBoard(ctx, world, near === 'board');
  drawGrill(ctx, world, near === 'grill');
  drawPlateStation(ctx, world, near === 'plate');
  drawServeWindow(ctx, world, near === 'serve');
  drawTrash(ctx, world, near === 'trash');

  // Steam puffs over the grill.
  for (const puff of world.steam) {
    ctx.fillStyle = `rgba(255,255,255,${Math.max(0, puff.life * 0.5)})`;
    ctx.beginPath();
    ctx.arc(puff.x, puff.y, puff.size, 0, Math.PI * 2);
    ctx.fill();
  }

  drawChef(ctx, world, t);
  drawPrompt(ctx, world);

  // Floating score popups.
  for (const popup of world.popups) {
    ctx.globalAlpha = Math.min(1, popup.life);
    text(ctx, popup.text, popup.x, popup.y, 20, popup.color, 800, 'center');
    ctx.globalAlpha = 1;
  }

  // Hint / message line at the bottom.
  if (world.message) {
    ctx.fillStyle = 'rgba(43,33,24,0.92)';
    const w = ctx.measureText(world.message).width + 32;
    roundRect(ctx, (FIELD.width - w) / 2, 676, w, 30, 15);
    ctx.fill();
    text(ctx, world.message, FIELD.width / 2, 691, 14, '#ffe9b8', 700, 'center');
  } else if (world.screen === SCREEN_PLAY) {
    text(ctx, 'WASD / arrows to move · click to walk · E to use a station · P pause · M mute', FIELD.width / 2, 694, 13, '#8a7a63', 700, 'center');
  }
}

function drawOverlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(30,20,12,0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = '#fffdf5';
  roundRect(ctx, 340, 150, 600, 420, 18);
  ctx.fill();
  ctx.strokeStyle = PALETTE.ticketEdge;
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, title, 640, 205, 44, accent || PALETTE.accent, 800, 'center');
  let y = 260;
  for (const line of lines) {
    text(ctx, line.text, 640, y, 17, PALETTE.text, line.bold ? 800 : 600, 'center');
    y += 30;
  }
}

function drawTitle(ctx, world) {
  drawKitchen(ctx, world, world.time);
  drawOrders(ctx, world);
  drawOverlay(ctx, 'SIZZLE & SERVE', [
    { text: 'Run the lunch rush in your own little kitchen!' },
    { text: 'Grab ingredients, chop and grill them, build each dish' },
    { text: 'on the plate, and serve it before the ticket runs out.' },
    { text: '' },
    { text: 'Move: WASD / arrows / click · Use station: E · Serve: Space', bold: true },
    { text: 'Pantry bins: click or press 1-6 · Trash clears mistakes', bold: true },
    { text: '' },
    { text: 'Press ENTER or click to start the day!', bold: true },
  ]);
}

function drawPaused(ctx, world) {
  drawKitchen(ctx, world, world.time);
  drawOverlay(ctx, 'PAUSED', [
    { text: 'The tickets are waiting…' },
    { text: '' },
    { text: 'Press P or click to keep cooking', bold: true },
  ], '#3d9e4d');
}

function drawOver(ctx, world) {
  drawKitchen(ctx, world, world.time);
  drawOrders(ctx, world);
  const best = Number(window.localStorage.getItem('sizzle-and-serve.best') || 0);
  drawOverlay(ctx, 'DAY OVER!', [
    { text: `You served ${world.served} dish${world.served === 1 ? '' : 'es'} and earned ${world.coins} coins.` },
    { text: `Best combo: x${Math.max(1, world.bestCombo)} · Orders lost: ${world.expired}` },
    { text: '' },
    { text: `FINAL SCORE: ${world.score}`, bold: true },
    { text: best > 0 ? `Best score: ${best}` : 'First day in the kitchen — welcome!' },
    { text: '' },
    { text: 'Press R or click to cook another day', bold: true },
  ], '#3d9e4d');
}

/** Draw the whole game for the current world state. `t` is seconds, for idle motion. */
export function renderGame(ctx, world, t) {
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);
  if (world.screen === SCREEN_TITLE) drawTitle(ctx, world);
  else if (world.screen === SCREEN_PAUSED) drawPaused(ctx, world);
  else if (world.screen === SCREEN_OVER) drawOver(ctx, world);
  else {
    drawKitchen(ctx, world, t);
    drawOrders(ctx, world);
    drawHud(ctx, world);
  }
}
