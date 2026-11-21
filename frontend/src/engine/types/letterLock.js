import { shuffle, randInt, createRng } from '../../utils/seededRng.js';
import { ANSWERS, WORD_LENGTH, isAllowedWord } from '../words.js';

/**
 * Letter Lock: guess the hidden five-letter word.
 * After each guess every letter is marked:
 *   correct  right letter, right spot (green)
 *   present  in the word, but in a different spot (yellow)
 *   absent   not in the word (grey)
 *
 * A failed board (out of guesses) costs points and starts a fresh board, like a
 * wrong submission in the other games.
 */

export { WORD_LENGTH };

/**
 * Mark a guess against the answer. Repeated letters are handled the standard
 * way: greens are claimed first, then each remaining answer letter can colour at
 * most one yellow. (Guess "EERIE" against "THEME": only two Es can be coloured.)
 */
export function scoreGuess(guess, answer) {
    const g = guess.toLowerCase();
    const a = answer.toLowerCase();
    const result = Array(g.length).fill('absent');
    const remaining = {};

    for (let i = 0; i < a.length; i++) {
        if (g[i] === a[i]) result[i] = 'correct';
        else remaining[a[i]] = (remaining[a[i]] || 0) + 1;
    }
    for (let i = 0; i < g.length; i++) {
        if (result[i] === 'correct') continue;
        if (remaining[g[i]] > 0) {
            result[i] = 'present';
            remaining[g[i]]--;
        }
    }
    return result;
}

/** Best known status for each letter, for colouring the on-screen keyboard. */
export function keyboardStatus(guesses, answer) {
    const rank = { absent: 1, present: 2, correct: 3 };
    const out = {};
    for (const guess of guesses) {
        scoreGuess(guess, answer).forEach((status, i) => {
            const letter = guess[i].toLowerCase();
            if (!out[letter] || rank[status] > rank[out[letter]]) out[letter] = status;
        });
    }
    return out;
}

export const maxGuessesFor = (difficulty) => (difficulty < 1.3 ? 7 : difficulty < 1.7 ? 6 : 5);

// One fixed shuffle, so the daily words come in a random-looking order with no
// repeats until the whole list has been used.
const DAILY_ORDER = shuffle([...ANSWERS], createRng('letter-lock-daily-order-v1'));

/**
 * opts.occurrence: how many times this type has come up in the daily rotation
 * (0, 1, 2...). It indexes the shuffled list, so daily words never repeat until
 * every word has been used. Without it (free play) the word comes from the rng.
 */
export function generate(rng, difficulty = 1, opts = {}) {
    const answer = Number.isInteger(opts.occurrence)
        ? DAILY_ORDER[opts.occurrence % DAILY_ORDER.length]
        : ANSWERS[randInt(0, ANSWERS.length - 1, rng)];

    return {
        type: 'letterLock',
        length: WORD_LENGTH,
        maxGuesses: maxGuessesFor(difficulty),
        answer,
        autoCheck: true,
    };
}

/** answer: { guesses: string[] } for the current board. Solved if it includes the word within the limit. */
export function validate(answer, puzzle) {
    const guesses = answer?.guesses;
    if (!Array.isArray(guesses)) return false;
    const i = guesses.findIndex(g => typeof g === 'string' && g.toLowerCase() === puzzle.answer);
    return i !== -1 && i < puzzle.maxGuesses;
}

/**
 * Reveal one letter. Skips positions the player already has green, and each
 * further hint reveals a different position, so paying twice never gives the same clue.
 */
export function getHint(puzzle, answer, hintIndex = 0) {
    const known = new Set();
    for (const guess of answer?.guesses || []) {
        scoreGuess(guess, puzzle.answer).forEach((s, i) => { if (s === 'correct') known.add(i); });
    }
    const open = [];
    for (let i = 0; i < puzzle.answer.length; i++) if (!known.has(i)) open.push(i);
    if (!open.length) return null;
    const position = open[hintIndex % open.length];
    return { position, letter: puzzle.answer[position].toUpperCase() };
}

export { isAllowedWord };
