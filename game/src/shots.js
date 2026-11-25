// The deterministic screenshot scenes behind ?shot=start|play|end&seed=1.
// Each scene builds the real world state directly (same fields real play uses),
// so every frame is what the game really looks like — the same seed always
// gives the same frame.

import { INGREDIENT_ORDER, RECIPES, STATIONS, stationAnchor } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, createWorld, resetWorld, spawnOrder } from './world.js';

/** Put a finished dish on the plate, from a recipe's needs list. */
function plateRecipe(world, recipeId) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  world.plate = [...recipe.needs];
}

function orderWith(world, id, recipeId, timeLeft, life) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  world.orders.push({ id, recipeId, timeLeft, life, coins: recipe.coins });
  world.nextOrderId = Math.max(world.nextOrderId, id + 1);
}

/**
 * Set `world` to the named scene (start, play or end; any other name is start)
 * and return the screen to draw over it.
 */
export function stageShot(name, world) {
  if (name === 'play') {
    resetWorld(world);
    world.screen = SCREEN_PLAY;
    world.score = 340;
    world.coins = 48;
    world.combo = 3;
    world.bestCombo = 3;
    world.served = 4;
    world.dayTimeLeft = 96;
    world.time = 54;
    world.orders = [];
    orderWith(world, 5, 'burger', 38, 55);
    orderWith(world, 6, 'salad', 21, 55);
    orderWith(world, 7, 'deluxe', 47, 55);
    // A burger mid-assembly on the plate, a patty sizzling on the grill, and a
    // tomato half-chopped on the board — the chef is at the board, mid-chop.
    world.plate = ['bun', 'grilled patty'];
    world.grill.item = { id: 'patty' };
    world.grill.progress = 0.6;
    world.grill.state = 'cooking';
    world.board.item = { id: 'tomato' };
    world.board.progress = 0.55;
    const anchor = stationAnchor(STATIONS.board);
    world.chef.x = anchor.x;
    world.chef.y = anchor.y + 6;
    world.chef.held = null;
    world.steam = [{ x: 660, y: 205, life: 0.8, size: 9 }, { x: 700, y: 215, life: 0.5, size: 7 }];
    world.message = 'Chopping… serve the burger before ticket #5 runs out!';
    world.messageTimer = 10;
    return { screen: SCREEN_PLAY };
  }
  if (name === 'end') {
    resetWorld(world);
    world.screen = SCREEN_OVER;
    world.score = 1280;
    world.coins = 96;
    world.combo = 0;
    world.bestCombo = 5;
    world.served = 9;
    world.expired = 1;
    world.hearts = 2;
    world.dayTimeLeft = 0;
    world.time = 150;
    world.orders = [];
    plateRecipe(world, 'burger');
    world.chef.x = 950;
    world.chef.y = 340;
    world.chef.held = null;
    return { screen: SCREEN_OVER };
  }
  // start: the title screen over a live kitchen — order board full, pantry
  // stocked, the chef by the pantry holding a tomato, ready to cook.
  const fresh = createWorld(world.seed || 1);
  Object.keys(fresh).forEach((key) => {
    world[key] = fresh[key];
  });
  world.screen = SCREEN_TITLE;
  world.time = 3;
  world.dayTimeLeft = 150;
  world.orders = [];
  orderWith(world, 1, 'burger', 48, 55);
  orderWith(world, 2, 'salad', 33, 55);
  orderWith(world, 3, 'veggie', 51, 55);
  world.chef.x = stationAnchor(STATIONS.pantry).x;
  world.chef.y = stationAnchor(STATIONS.pantry).y + 6;
  world.chef.held = { kind: 'raw', id: 'tomato' };
  world.plate = ['bun'];
  return { screen: SCREEN_TITLE };
}
