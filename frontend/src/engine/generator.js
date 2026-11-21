import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear.js';
import { createRng } from '../utils/seededRng.js';
import * as numberMatrix from './types/numberMatrix.js';
import * as patternMatch from './types/patternMatch.js';
import * as sequenceSolver from './types/sequenceSolver.js';
import * as deductionGrid from './types/deductionGrid.js';
import * as binaryLogic from './types/binaryLogic.js';
import * as switchboard from './types/switchboard.js';
import * as laserPath from './types/laserPath.js';
import * as measureUp from './types/measureUp.js';
import * as balanceScale from './types/balanceScale.js';
import * as pixelLogic from './types/pixelLogic.js';
import * as numberTrail from './types/numberTrail.js';
import * as letterLock from './types/letterLock.js';

dayjs.extend(dayOfYear);

export const generators = {
    numberMatrix,
    patternMatch, // retired: only used for dates before V2_START
    sequenceSolver,
    deductionGrid,
    binaryLogic,
    switchboard,
    laserPath,
    measureUp,
    balanceScale,
    pixelLogic,
    numberTrail,
    letterLock,
};

/**
 * The daily puzzle is derived from the date, so changing the rotation would
 * change every past day's puzzle (archive, history, legacy recovery). The new
 * rotation therefore only applies from V2_START onward; earlier dates keep
 * the original 5-type rotation and generate exactly the same puzzles as before.
 *
 * Set V2_START to the day the new version goes live (a date on or after deploy).
 */
export const V2_START = '2026-12-01';

// Before V2_START the rotation is exactly what was deployed (Pattern Match included), so every past
// day replays the puzzle type players actually saw. Pattern Match is retired from V2_ROTATION onward.
const LEGACY_ROTATION = ['numberMatrix', 'patternMatch', 'sequenceSolver', 'deductionGrid', 'binaryLogic'];

// Old and new types interleaved, so similar puzzles don't land back to back.
// 10 types over 7-day weeks: each type keeps landing on different weekdays.
export const V2_ROTATION = [
    'switchboard',
    'numberMatrix',
    'laserPath',
    'balanceScale',
    'sequenceSolver',
    'letterLock',
    'pixelLogic',
    'deductionGrid',
    'measureUp',
    'binaryLogic',
    'numberTrail',
];

// v2 difficulty follows the week: Monday is gentlest, Sunday is hardest.
// Indexed by dayjs().day(): 0 = Sunday.
const WEEKDAY_DIFFICULTY = [2.0, 1.0, 1.15, 1.3, 1.45, 1.6, 1.8];

export const FREE_PLAY_LEVELS = { easy: 1.0, medium: 1.45, hard: 2.0 };

const isV2 = (dateString) => dateString >= V2_START;
const daysSinceV2 = (dateString) =>
    Math.round((Date.parse(`${dateString}T00:00:00Z`) - Date.parse(`${V2_START}T00:00:00Z`)) / 86400000);

export function getPuzzleTypeForDate(dateString) {
    if (isV2(dateString)) return V2_ROTATION[daysSinceV2(dateString) % V2_ROTATION.length];
    return LEGACY_ROTATION[dayjs(dateString).dayOfYear() % LEGACY_ROTATION.length];
}

export function getDifficultyForDate(dateString) {
    if (isV2(dateString)) return WEEKDAY_DIFFICULTY[dayjs(dateString).day()];
    return 1 + (dayjs(dateString).dayOfYear() % 10) * 0.1;
}

export function difficultyLabel(d) {
    if (d < 1.3) return 'Easy';
    if (d < 1.7) return 'Medium';
    return 'Hard';
}

/**
 * Generate a day's puzzle deterministically from the date.
 * Same date → same puzzle type and data, for every player.
 */
export function generatePuzzle(dateString, difficultyModifier = 1) {
    const type = getPuzzleTypeForDate(dateString);
    // The seed includes the difficulty modifier, as deployed: each difficulty level is a different puzzle.
    const rng = createRng(`logic-looper-${dateString}-d${difficultyModifier}`);
    const difficulty = getDifficultyForDate(dateString) * difficultyModifier;
    const v2 = isV2(dateString);
    // How many times this type has come up in the rotation so far (0, 1, 2...). Lets a
    // game walk through a list without repeats (Letter Lock's words).
    const occurrence = v2 ? Math.floor(daysSinceV2(dateString) / V2_ROTATION.length) : undefined;
    const puzzleData = generators[type].generate(rng, difficulty, { v2, occurrence });

    return {
        ...puzzleData,
        id: dateString,
        date: dateString,
        difficulty: Math.round(difficulty * 100) / 100,
    };
}

/** Free play: any type, any seed, chosen difficulty. Never counts toward stats. */
export function generatePuzzleOfType(type, seed, level = 'medium') {
    const difficulty = FREE_PLAY_LEVELS[level] ?? FREE_PLAY_LEVELS.medium;
    const rng = createRng(`free-${type}-${level}-${seed}`);
    const puzzleData = generators[type].generate(rng, difficulty, { v2: true });
    return {
        ...puzzleData,
        id: `free:${type}:${level}:${seed}`,
        date: null,
        seed,
        level,
        difficulty,
    };
}

export function validateSolution(type, userAnswer, puzzleData) {
    // Incomplete answers (null grid, missing keys) count as incorrect instead of throwing.
    try {
        return Boolean(generators[type].validate(userAnswer ?? {}, puzzleData));
    } catch {
        return false;
    }
}

// The Deduction Grid validator compares against `puzzle.solution`; every other type validates
// against the whole puzzle (Number Matrix too: it also checks the given cells and the rules).
const VALIDATES_AGAINST_SOLUTION = new Set(['deductionGrid']);

/** Check an answer against a generated puzzle. The one entry point the UI should use. */
export function checkPuzzle(puzzle, answer) {
    if (!puzzle?.type) return false;
    const reference = VALIDATES_AGAINST_SOLUTION.has(puzzle.type) ? puzzle.solution : puzzle;
    return validateSolution(puzzle.type, answer, reference);
}

export function getPuzzleHint(type, puzzleData, ...args) {
    return generators[type].getHint(puzzleData, ...args);
}

export function getTodayDateString() {
    return dayjs().format('YYYY-MM-DD');
}
