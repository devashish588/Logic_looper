import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear.js';
import { createRng } from '../utils/seededRng.js';
import { PUZZLE_TYPES, DIFFICULTY_LEVELS } from '../utils/constants.js';

// Activate the dayOfYear plugin so date.dayOfYear() works
dayjs.extend(dayOfYear);

// ── Lazy load generators ───────────────────────────────────────
const generatorImports = {
  numberMatrix: () => import('./types/numberMatrix.js'),
  patternMatch: () => import('./types/patternMatch.js'),
  sequenceSolver: () => import('./types/sequenceSolver.js'),
  deductionGrid: () => import('./types/deductionGrid.js'),
  binaryLogic: () => import('./types/binaryLogic.js'),
  truthAndLies: () => import('./types/truthAndLies.js'),
  binaryBridge: () => import('./types/binaryBridge.js'),
  quantumGrid: () => import('./types/quantumGrid.js'),
};

// Cache loaded generators
const loadedGenerators = {};

async function getGenerator(type) {
  if (loadedGenerators[type]) return loadedGenerators[type];
  const module = await generatorImports[type]();
  loadedGenerators[type] = module;
  return module;
}

// ── Non-Cyclical Rotation ("Monday Rule") ──────────────────────
// Uses a large-prime shift so the same weekday won't repeat the same
// game type on consecutive weeks.  gcd(7, 8) = 1 guarantees full cycle.
const LARGE_PRIME = 7;

/**
 * Deterministically pick which puzzle type to show on a given date.
 * Same weekday in consecutive weeks maps to a different game.
 */
export function getPuzzleTypeForDate(dateString) {
  const date = dayjs(dateString);
  const doy = date.dayOfYear();
  const weekOfYear = Math.floor((doy - 1) / 7);
  const gameIndex = (doy + weekOfYear * LARGE_PRIME) % PUZZLE_TYPES.length;
  return PUZZLE_TYPES[gameIndex];
}

/**
 * Generate today's puzzle deterministically from the date + difficulty.
 * Same date → same puzzle type and data for all users.
 *
 * @param {string} dateString - 'YYYY-MM-DD'
 * @param {object} [difficultyConfig] - One of DIFFICULTY_LEVELS (NOVICE/ADEPT/GRANDMASTER)
 * @returns puzzle data object
 */
export async function generatePuzzle(dateString, difficultyConfig = null) {
  const type = getPuzzleTypeForDate(dateString);
  const diff = difficultyConfig || DIFFICULTY_LEVELS.NOVICE;
  const difficultyModifier = diff.modifier || 1;

  const seed = `logic-looper-${dateString}`;
  const rng = createRng(seed);

  const generator = await getGenerator(type);
  const puzzleData = generator.generate(rng, difficultyModifier);

  return {
    ...puzzleData,
    date: dateString,
    difficulty: difficultyModifier,
    difficultyLevel: diff.key || 'NOVICE',
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
