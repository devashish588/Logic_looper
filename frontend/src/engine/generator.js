import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear.js';
import { createRng } from '../utils/seededRng.js';
import { PUZZLE_TYPES } from '../utils/constants.js';
import * as numberMatrix from './types/numberMatrix.js';
import * as patternMatch from './types/patternMatch.js';
import * as sequenceSolver from './types/sequenceSolver.js';
import * as deductionGrid from './types/deductionGrid.js';
import * as binaryLogic from './types/binaryLogic.js';

dayjs.extend(dayOfYear);

const generators = {
    numberMatrix,
    patternMatch,
    sequenceSolver,
    deductionGrid,
    binaryLogic,
};

/**
 * Generate today's puzzle deterministically from the date.
 * Same date → same puzzle type and data.
 */
export function generatePuzzle(dateString, difficultyModifier = 1) {
    const date = dayjs(dateString);
    const doy = date.dayOfYear();
    const typeIndex = doy % PUZZLE_TYPES.length;
    const type = PUZZLE_TYPES[typeIndex];

    const seed = `logic-looper-${dateString}`;
    const rng = createRng(seed);

    // Difficulty scales gently with day of year
    const baseDifficulty = 1 + (doy % 10) * 0.1;
    const difficulty = baseDifficulty * difficultyModifier;

    const puzzleData = generators[type].generate(rng, difficulty);

    return {
        ...puzzleData,
        date: dateString,
        difficulty: Math.round(difficulty * 10) / 10,
    };
}

export function validateSolution(type, userAnswer, puzzleData) {
    return generators[type].validate(userAnswer, puzzleData);
}

export function getPuzzleHint(type, puzzleData, ...args) {
    return generators[type].getHint(puzzleData, ...args);
}

export function getTodayDateString() {
    return dayjs().format('YYYY-MM-DD');
}

export function getPuzzleTypeForDate(dateString) {
    const date = dayjs(dateString);
    const doy = date.dayOfYear();
    return PUZZLE_TYPES[doy % PUZZLE_TYPES.length];
}
