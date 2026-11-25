// The kitchen simulation: the chef, the stations, the orders, the scoring.
// No drawing here — render.js draws this state. No DOM here either, so the
// same step function drives real play and the deterministic screenshot scenes.

import {
  CHEF,
  DAY_LENGTH,
  HEARTS,
  INGREDIENTS,
  INGREDIENT_ORDER,
  ORDERS,
  RECIPES,
  SCORE,
  STATIONS,
  WORK,
  finishedForm,
  recipeById,
  stationAnchor,
} from './config.js';
import { makeRandom, pick, range } from './random.js';
import {
  soundBurnt,
  soundChop,
  soundChopped,
  soundExpire,
  soundGrilled,
  soundPickup,
  soundServe,
  soundSizzle,
} from './audio.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

/** How close the chef must be to a station's anchor to use it. */
const REACH = 120;

/** The floor the chef can walk on (below the counter row). */
const FLOOR = { x: 30, y: 296, w: 1220, h: 396 };

export function createWorld(seed) {
  const world = {
    seed,
    rng: makeRandom(seed || 1),
    screen: SCREEN_TITLE,
    time: 0,
    dayTimeLeft: DAY_LENGTH,
    chef: { x: 640, y: 520, dir: 1, moving: false, held: null },
    moveTarget: null,
    board: { item: null, progress: 0, chopTick: 0 },
    grill: { item: null, progress: 0, state: 'empty', grace: 0 },
    plate: [],
    orders: [],
    nextOrderId: 1,
    spawnTimer: ORDERS.firstDelay,
    score: 0,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    expired: 0,
    hearts: HEARTS,
    popups: [],
    steam: [],
    message: '',
    messageTimer: 0,
  };
  return world;
}

/** Fresh day: same seed, same opening orders, same kitchen. */
export function resetWorld(world) {
  const fresh = createWorld(world.seed);
  Object.keys(fresh).forEach((key) => {
    world[key] = fresh[key];
  });
  world.screen = SCREEN_PLAY;
  spawnOrder(world);
  spawnOrder(world);
}

function addPopup(world, x, y, text, color) {
  world.popups.push({ x, y, text, color: color || '#2b2118', life: 1.4 });
  if (world.popups.length > 12) world.popups.shift();
}

function flashMessage(world, text) {
  world.message = text;
  world.messageTimer = 1.6;
}

export function spawnOrder(world) {
  if (world.orders.length >= ORDERS.maxActive) return;
  const late = world.dayTimeLeft < DAY_LENGTH / 2;
  const recipe = pick(world.rng, RECIPES);
  const life = late ? ORDERS.lateLifeSeconds : ORDERS.lifeSeconds;
  world.orders.push({
    id: world.nextOrderId,
    recipeId: recipe.id,
    timeLeft: life,
    life,
    coins: recipe.coins,
  });
  world.nextOrderId += 1;
}

/** The station whose anchor is nearest the chef, when it is within reach. */
export function nearestStation(world) {
  let best = null;
  let bestDist = REACH;
  for (const [name, station] of Object.entries(STATIONS)) {
    const anchor = stationAnchor(station);
    const dx = world.chef.x - anchor.x;
    const dy = world.chef.y - anchor.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < bestDist) {
      bestDist = dist;
      best = name;
    }
  }
  return best;
}

/** Which pantry bin (ingredient id) sits under point `p`, or null. */
export function pantryBinAt(p) {
  const station = STATIONS.pantry;
  if (p.x < station.x || p.x > station.x + station.w || p.y < station.y || p.y > station.y + station.h) return null;
  const index = Math.floor(((p.x - station.x) / station.w) * INGREDIENT_ORDER.length);
  return INGREDIENT_ORDER[Math.min(INGREDIENT_ORDER.length - 1, Math.max(0, index))];
}

function takeIngredient(world, id) {
  if (world.chef.held) {
    flashMessage(world, 'Hands full — serve or trash it first!');
    return;
  }
  world.chef.held = { kind: 'raw', id };
  soundPickup();
}

function plateMatchesOrder(plate, recipe) {
  if (plate.length !== recipe.needs.length) return false;
  const have = [...plate].sort().join('|');
  const want = [...recipe.needs].sort().join('|');
  return have === want;
}

function serveDish(world) {
  if (world.plate.length === 0) {
    flashMessage(world, 'The plate is empty — build a dish first!');
    return;
  }
  const order = world.orders.find((o) => plateMatchesOrder(world.plate, recipeById(o.recipeId)));
  if (!order) {
    flashMessage(world, 'No order wants this plate — check the tickets!');
    return;
  }
  const recipe = recipeById(order.recipeId);
  const multiplier = 1 + Math.min(world.combo, SCORE.maxCombo) * SCORE.comboStep;
  const earned = Math.round((SCORE.serveBase + recipe.coins * SCORE.perCoin) * multiplier);
  world.score += earned;
  world.coins += recipe.coins;
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  world.served += 1;
  world.orders = world.orders.filter((o) => o.id !== order.id);
  const anchor = stationAnchor(STATIONS.serve);
  addPopup(world, anchor.x, anchor.y - 30, `+${earned}  +${recipe.coins} coins`, '#3d9e4d');
  if (world.combo > 1) addPopup(world, anchor.x, anchor.y - 60, `COMBO x${world.combo}!`, '#e5484d');
  world.plate = [];
  soundServe();
}

/** Use the named station (E key, or a click on it while in reach). */
export function useStation(world, name) {
  const chef = world.chef;
  if (name === 'pantry') {
    if (chef.held) {
      flashMessage(world, 'Hands full — serve or trash it first!');
    } else {
      flashMessage(world, 'Grab an ingredient: click a bin or press 1-6');
    }
    return;
  }
  if (name === 'board') {
    if (world.board.item) {
      if (world.board.progress >= 1) {
        chef.held = { kind: 'finished', label: finishedForm(world.board.item.id), id: world.board.item.id };
        world.board.item = null;
        world.board.progress = 0;
        soundPickup();
      } else {
        flashMessage(world, 'Still chopping…');
      }
    } else if (chef.held && chef.held.kind === 'raw' && INGREDIENTS[chef.held.id].chops) {
      world.board.item = { id: chef.held.id };
      world.board.progress = 0;
      chef.held = null;
      soundChop();
    } else if (chef.held) {
      flashMessage(world, 'This board only chops tomato, lettuce and onion');
    } else {
      flashMessage(world, 'Bring something to chop: tomato, lettuce or onion');
    }
    return;
  }
  if (name === 'grill') {
    if (world.grill.item) {
      if (world.grill.state === 'grilled') {
        chef.held = { kind: 'finished', label: 'grilled patty', id: 'patty' };
        world.grill.item = null;
        world.grill.state = 'empty';
        world.grill.progress = 0;
        soundPickup();
      } else if (world.grill.state === 'burnt') {
        chef.held = { kind: 'burnt', label: 'burnt patty', id: 'patty' };
        world.grill.item = null;
        world.grill.state = 'empty';
        world.grill.progress = 0;
        soundPickup();
        flashMessage(world, 'Burnt! Bin it in the trash');
      } else {
        flashMessage(world, 'Still sizzling…');
      }
    } else if (chef.held && chef.held.kind === 'raw' && chef.held.id === 'patty') {
      world.grill.item = { id: 'patty' };
      world.grill.progress = 0;
      world.grill.state = 'cooking';
      chef.held = null;
      soundSizzle();
    } else if (chef.held) {
      flashMessage(world, 'The grill only takes raw patties');
    } else {
      flashMessage(world, 'Bring a raw patty to grill');
    }
    return;
  }
  if (name === 'plate') {
    if (!chef.held) {
      flashMessage(world, 'Bring a finished ingredient to plate it');
      return;
    }
    if (chef.held.kind === 'burnt') {
      flashMessage(world, 'Burnt food never goes on a plate — trash it!');
      return;
    }
    if (chef.held.kind === 'raw') {
      flashMessage(world, 'Not ready yet — chop it or grill it first!');
      return;
    }
    if (world.plate.length >= 4) {
      flashMessage(world, 'The plate is full — serve it!');
      return;
    }
    world.plate.push(chef.held.label);
    chef.held = null;
    soundPickup();
    return;
  }
  if (name === 'serve') {
    serveDish(world);
    return;
  }
  if (name === 'trash') {
    if (chef.held) {
      chef.held = null;
      soundPickup();
      flashMessage(world, 'Binned it');
    } else if (world.plate.length > 0) {
      world.plate = [];
      soundPickup();
      flashMessage(world, 'Plate cleared');
    } else {
      flashMessage(world, 'Nothing to bin');
    }
  }
}

function stepChef(world, input, dt) {
  const chef = world.chef;
  let dx = 0;
  let dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  if (dx !== 0 || dy !== 0) {
    world.moveTarget = null;
    const len = Math.sqrt(dx * dx + dy * dy);
    chef.x += (dx / len) * CHEF.speed * dt;
    chef.y += (dy / len) * CHEF.speed * dt;
    chef.dir = dx !== 0 ? Math.sign(dx) : chef.dir;
    chef.moving = true;
  } else if (world.moveTarget) {
    const tx = world.moveTarget.x - chef.x;
    const ty = world.moveTarget.y - chef.y;
    const dist = Math.sqrt(tx * tx + ty * ty);
    if (dist < 6) {
      world.moveTarget = null;
      chef.moving = false;
    } else {
      chef.x += (tx / dist) * CHEF.speed * dt;
      chef.y += (ty / dist) * CHEF.speed * dt;
      chef.dir = tx !== 0 ? Math.sign(tx) : chef.dir;
      chef.moving = true;
    }
  } else {
    chef.moving = false;
  }
  chef.x = Math.min(FLOOR.x + FLOOR.w, Math.max(FLOOR.x, chef.x));
  chef.y = Math.min(FLOOR.y + FLOOR.h, Math.max(FLOOR.y, chef.y));
}

function stepStations(world, dt) {
  if (world.board.item && world.board.progress < 1) {
    world.board.progress += dt / WORK.chopSeconds;
    world.board.chopTick += dt;
    if (world.board.chopTick > 0.4) {
      world.board.chopTick = 0;
      soundChop();
    }
    if (world.board.progress >= 1) {
      world.board.progress = 1;
      soundChopped();
    }
  }
  if (world.grill.item) {
    if (world.grill.state === 'cooking') {
      world.grill.progress += dt / WORK.grillSeconds;
      if (world.grill.progress >= 1) {
        world.grill.progress = 1;
        world.grill.state = 'grilled';
        world.grill.grace = WORK.grilledGraceSeconds;
        soundGrilled();
      }
    } else if (world.grill.state === 'grilled') {
      world.grill.grace -= dt;
      if (world.grill.grace <= 0) {
        world.grill.state = 'burnt';
        soundBurnt();
        flashMessage(world, 'The patty burnt! Bin it');
      }
    }
  }
}

function stepOrders(world, dt) {
  world.spawnTimer -= dt;
  if (world.spawnTimer <= 0) {
    spawnOrder(world);
    world.spawnTimer = ORDERS.spawnInterval + range(world.rng, -ORDERS.spawnJitter, ORDERS.spawnJitter);
  }
  for (const order of world.orders) order.timeLeft -= dt;
  const expiredOrder = world.orders.find((o) => o.timeLeft <= 0);
  if (expiredOrder) {
    world.orders = world.orders.filter((o) => o.id !== expiredOrder.id);
    world.expired += 1;
    world.combo = 0;
    world.hearts -= 1;
    soundExpire();
    addPopup(world, 640, 150, `Order expired! -1 heart`, '#e5484d');
    if (world.hearts <= 0) endDay(world);
  }
}

function endDay(world) {
  world.screen = SCREEN_OVER;
  world.chef.held = null;
}

function stepPopups(world, dt) {
  for (const popup of world.popups) {
    popup.life -= dt;
    popup.y -= 22 * dt;
  }
  world.popups = world.popups.filter((p) => p.life > 0);
  if (world.messageTimer > 0) {
    world.messageTimer -= dt;
    if (world.messageTimer <= 0) world.message = '';
  }
  // Grill steam puffs, for the renderer.
  if (world.grill.item && world.grill.state !== 'empty' && world.rng() < dt * 6) {
    world.steam.push({ x: 640 + range(world.rng, -40, 40), y: 200, life: 0.9, size: range(world.rng, 5, 11) });
  }
  for (const puff of world.steam) {
    puff.life -= dt;
    puff.y -= 26 * dt;
  }
  world.steam = world.steam.filter((p) => p.life > 0);
}

/** One fixed simulation step. `input` is the object from input.js. */
export function stepWorld(world, input, dt) {
  if (world.screen !== SCREEN_PLAY) return;
  world.time += dt;

  // Mouse: a click on a station uses it (when in reach); a click on a pantry
  // bin grabs that ingredient; any other floor click sets a walk target.
  if (input.click) {
    const p = input.click;
    let handled = false;
    for (const [name, station] of Object.entries(STATIONS)) {
      if (p.x >= station.x - 8 && p.x <= station.x + station.w + 8 && p.y >= station.y - 8 && p.y <= station.y + station.h + 8) {
        handled = true;
        if (name === 'pantry') {
          const id = pantryBinAt(p);
          if (id && nearestStation(world) === 'pantry') takeIngredient(world, id);
          else if (id) flashMessage(world, 'Step up to the pantry first!');
        } else if (nearestStation(world) === name) {
          useStation(world, name);
        } else {
          world.moveTarget = { x: stationAnchor(STATIONS[name]).x, y: stationAnchor(STATIONS[name]).y };
        }
        break;
      }
    }
    if (!handled && p.y > FLOOR.y) world.moveTarget = { x: p.x, y: p.y };
  }

  // Keyboard: digits grab pantry ingredients, E uses the nearest station.
  if (input.digitPressed !== null && input.digitPressed !== undefined) {
    const id = INGREDIENT_ORDER[input.digitPressed - 1];
    if (nearestStation(world) === 'pantry') takeIngredient(world, id);
  }
  if (input.interactPressed) {
    const station = nearestStation(world);
    if (station) useStation(world, station);
  }
  if (input.servePressed) {
    if (nearestStation(world) === 'serve') serveDish(world);
    else {
      const station = nearestStation(world);
      if (station) useStation(world, station);
    }
  }

  stepChef(world, input, dt);
  stepStations(world, dt);
  stepOrders(world, dt);
  stepPopups(world, dt);

  world.dayTimeLeft -= dt;
  if (world.dayTimeLeft <= 0) {
    world.dayTimeLeft = 0;
    endDay(world);
  }
}

/** Day progress 0..1, for the timer bar. */
export function dayProgress(world) {
  return 1 - world.dayTimeLeft / DAY_LENGTH;
}
