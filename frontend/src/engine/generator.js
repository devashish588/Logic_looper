import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear.js';
import { createRng } from '../utils/seededRng.js';
import { PUZZLE_TYPES } from '../utils/constants.js';

// Activate the dayOfYear plugin so date.dayOfYear() works
dayjs.extend(dayOfYear);

// Lazy load generators
const generatorImports = {
  numberMatrix: () => import('./types/numberMatrix.js'),
  patternMatch: () => import('./types/patternMatch.js'),
  sequenceSolver: () => import('./types/sequenceSolver.js'),
  deductionGrid: () => import('./types/deductionGrid.js'),
  binaryLogic: () => import('./types/binaryLogic.js'),
};

// Cache loaded generators
const loadedGenerators = {};

async function getGenerator(type) {
  if (loadedGenerators[type]) return loadedGenerators[type];
  const module = await generatorImports[type]();
  loadedGenerators[type] = module;
  return module;
}

/**
 * Generate today's puzzle deterministically from the date.
 * Same date → same puzzle type and data.
 */
export async function generatePuzzle(dateString, difficultyModifier = 1) {
  const date = dayjs(dateString);
  const doy = date.dayOfYear();
  const typeIndex = doy % PUZZLE_TYPES.length;
  const type = PUZZLE_TYPES[typeIndex];

  const seed = `logic-looper-${dateString}`;
  const rng = createRng(seed);

  // Difficulty scales gently with day of year
  const baseDifficulty = 1 + (doy % 10) * 0.1;
  const difficulty = baseDifficulty * difficultyModifier;

  const generator = await getGenerator(type);
  const puzzleData = generator.generate(rng, difficulty);

  return {
    ...puzzleData,
    date: dateString,
    difficulty: Math.round(difficulty * 10) / 10,
  };
}

export async function validateSolution(type, userAnswer, puzzleData) {
  const generator = await getGenerator(type);
  return generator.validate(userAnswer, puzzleData);
}

export async function getPuzzleHint(type, puzzleData, ...args) {
  const generator = await getGenerator(type);
  return generator.getHint(puzzleData, ...args);
}

export function getTodayDateString() {
  return dayjs().format('YYYY-MM-DD');
}

export function getPuzzleTypeForDate(dateString) {
  const date = dayjs(dateString);
  const doy = date.dayOfYear();
  return PUZZLE_TYPES[doy % PUZZLE_TYPES.length];
}

// Preload next 7 days logic (optimization rule)
export async function preloadUpcomingPuzzles() {
  const today = dayjs();
  const promises = [];
  for (let i = 0; i <= 7; i++) {
    const date = today.add(i, 'day');
    const type = getPuzzleTypeForDate(date.format('YYYY-MM-DD'));
    if (!loadedGenerators[type]) {
      promises.push(getGenerator(type));
    }
  }
  await Promise.all(promises);
}
