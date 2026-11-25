// Sizzle & Serve — every tuning number, recipe and colour in one place.
// The kitchen is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

/** One full working day, in seconds. */
export const DAY_LENGTH = 150;

export const CHEF = {
  radius: 26,
  speed: 300,
  carryOffsetY: -46,
};

/** Ingredient ids. Raw patty grills; tomato/lettuce/onion chop; bun/cheese go straight on. */
export const INGREDIENTS = {
  bun: { name: 'Bun', color: '#e8b25c', dark: '#b97f2e', key: '1', chops: false, grills: false },
  patty: { name: 'Patty', color: '#a85b3c', dark: '#6e3520', key: '2', chops: false, grills: true },
  cheese: { name: 'Cheese', color: '#f7c948', dark: '#c98f1b', key: '3', chops: false, grills: false },
  tomato: { name: 'Tomato', color: '#e5484d', dark: '#a92c30', key: '4', chops: true, grills: false },
  lettuce: { name: 'Lettuce', color: '#58b368', dark: '#2f7a3d', key: '5', chops: true, grills: false },
  onion: { name: 'Onion', color: '#c9a7e8', dark: '#8a63b8', key: '6', chops: true, grills: false },
};

export const INGREDIENT_ORDER = ['bun', 'patty', 'cheese', 'tomato', 'lettuce', 'onion'];

/** A finished (chopped / grilled) form of an ingredient, as it sits on a plate. */
export function finishedForm(id) {
  if (id === 'patty') return 'grilled patty';
  if (INGREDIENTS[id].chops) return `chopped ${INGREDIENTS[id].name.toLowerCase()}`;
  return INGREDIENTS[id].name.toLowerCase();
}

/** The menu: every dish is a multiset of finished ingredients. */
export const RECIPES = [
  {
    id: 'salad',
    name: 'Garden Salad',
    needs: ['chopped tomato', 'chopped lettuce'],
    coins: 12,
    color: '#58b368',
  },
  {
    id: 'burger',
    name: 'Classic Burger',
    needs: ['bun', 'grilled patty', 'cheese'],
    coins: 18,
    color: '#e8b25c',
  },
  {
    id: 'veggie',
    name: 'Veggie Stack',
    needs: ['bun', 'chopped tomato', 'chopped lettuce', 'chopped onion'],
    coins: 22,
    color: '#7ec850',
  },
  {
    id: 'deluxe',
    name: 'Deluxe Burger',
    needs: ['bun', 'grilled patty', 'cheese', 'chopped onion'],
    coins: 26,
    color: '#f08a24',
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

/** Order timing: how long a ticket lives, and how often new ones arrive. */
export const ORDERS = {
  maxActive: 4,
  firstDelay: 2,
  spawnInterval: 13,
  spawnJitter: 4,
  lifeSeconds: 55,
  lateLifeSeconds: 40,
};

/** Station work times, in seconds. */
export const WORK = {
  chopSeconds: 1.6,
  grillSeconds: 4,
  grilledGraceSeconds: 7,
};

/** Score: coins pay score too, scaled by the combo multiplier. */
export const SCORE = {
  serveBase: 100,
  perCoin: 10,
  comboStep: 0.25,
  maxCombo: 4,
};

export const HEARTS = 3;

/** Station rectangles on the kitchen floor (logical coordinates). */
export const STATIONS = {
  pantry: { x: 36, y: 168, w: 348, h: 92, label: 'PANTRY' },
  board: { x: 412, y: 168, w: 150, h: 92, label: 'CHOPPING BOARD' },
  grill: { x: 590, y: 168, w: 230, h: 92, label: 'GRILL' },
  plate: { x: 848, y: 168, w: 212, h: 92, label: 'PLATING' },
  serve: { x: 1088, y: 168, w: 156, h: 92, label: 'SERVE WINDOW' },
  trash: { x: 36, y: 606, w: 120, h: 76, label: 'TRASH' },
};

/** Where the chef stands to use each station (the interaction anchor). */
export function stationAnchor(station) {
  return { x: station.x + station.w / 2, y: station.y + station.h + 34 };
}

export const PALETTE = {
  wall: '#f7e8c8',
  wallTrim: '#e0c48f',
  floorA: '#d9b98a',
  floorB: '#cfa978',
  counterTop: '#8a5a33',
  counterFront: '#6e4525',
  steel: '#b9c2cc',
  steelDark: '#8b96a3',
  ticket: '#fffdf5',
  ticketEdge: '#d8cdb4',
  text: '#2b2118',
  muted: '#7a6a55',
  hud: '#3a2c1e',
  hudText: '#ffe9b8',
  accent: '#e5484d',
  green: '#3d9e4d',
  gold: '#f7c948',
  chefHat: '#ffffff',
  chefCoat: '#f4f6f8',
  chefSkin: '#f2c89b',
  chefPants: '#3a4a5a',
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'sizzle-and-serve.best';
