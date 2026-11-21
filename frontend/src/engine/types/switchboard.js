import { shuffle, randInt } from '../../utils/seededRng.js';

/**
 * Switchboard: a grid of lights. Pressing a switch flips it and its four
 * neighbours. Goal: light up the whole board.
 *
 * Puzzles are built by pressing random switches on a fully-lit board, so they
 * are always solvable. An exact solver (Gaussian elimination over GF(2))
 * finds the minimum number of presses for "par" and for hints.
 */

export function neighbours(i, size) {
    const r = Math.floor(i / size);
    const c = i % size;
    const out = [i];
    if (r > 0) out.push(i - size);
    if (r < size - 1) out.push(i + size);
    if (c > 0) out.push(i - 1);
    if (c < size - 1) out.push(i + 1);
    return out;
}

/** Apply presses (each cell may appear any number of times) to a light grid. */
export function applyPresses(lights, presses, size) {
    const g = [...lights];
    for (const p of presses) {
        for (const n of neighbours(p, size)) g[n] = !g[n];
    }
    return g;
}

function popcount(x) {
    let c = 0;
    while (x) { x &= x - 1; c++; }
    return c;
}

/**
 * Minimum set of presses that lights every cell, from the given state.
 * Returns an array of cell indices (sorted), or null if impossible.
 */
export function solveMinimal(lights, size) {
    const n = size * size;
    // Row i: which presses affect cell i (symmetric, so it's neighbours(i)); rhs: needs a flip?
    const rows = [];
    for (let i = 0; i < n; i++) {
        let mask = 0;
        for (const j of neighbours(i, size)) mask |= 1 << j;
        rows.push({ mask, rhs: lights[i] ? 0 : 1 });
    }

    // Reduced row echelon form
    const pivotCols = [];
    let rank = 0;
    for (let col = 0; col < n && rank < n; col++) {
        const bit = 1 << col;
        let k = rank;
        while (k < n && !(rows[k].mask & bit)) k++;
        if (k === n) continue;
        [rows[rank], rows[k]] = [rows[k], rows[rank]];
        for (let i = 0; i < n; i++) {
            if (i !== rank && (rows[i].mask & bit)) {
                rows[i].mask ^= rows[rank].mask;
                rows[i].rhs ^= rows[rank].rhs;
            }
        }
        pivotCols.push(col);
        rank++;
    }
    for (let i = rank; i < n; i++) {
        if (rows[i].mask === 0 && rows[i].rhs === 1) return null;
    }

    const pivotSet = new Set(pivotCols);
    const free = [];
    for (let col = 0; col < n; col++) if (!pivotSet.has(col)) free.push(col);

    let best = null;
    let bestWeight = Infinity;
    for (let combo = 0; combo < (1 << free.length); combo++) {
        let x = 0;
        free.forEach((col, k) => { if (combo & (1 << k)) x |= 1 << col; });
        for (let r = 0; r < rank; r++) {
            const p = pivotCols[r];
            const others = rows[r].mask & ~(1 << p);
            if ((rows[r].rhs ^ (popcount(others & x) & 1)) === 1) x |= 1 << p;
        }
        const w = popcount(x);
        if (w < bestWeight) { bestWeight = w; best = x; }
    }

    const presses = [];
    for (let i = 0; i < n; i++) if (best & (1 << i)) presses.push(i);
    return presses;
}

export function generate(rng, difficulty = 1) {
    const size = difficulty < 1.5 ? 4 : 5;
    const n = size * size;
    const [lo, hi] = size === 4 ? [4, 6] : [6, 9];
    const all = Array.from({ length: n }, (_, i) => i);

    let lights = null;
    let par = 0;
    for (let attempt = 0; attempt < 50; attempt++) {
        const presses = shuffle([...all], rng).slice(0, randInt(lo, hi, rng));
        const candidate = applyPresses(Array(n).fill(true), presses, size);
        const minimal = solveMinimal(candidate, size);
        // Some press sets cancel out on these boards; require a real challenge.
        if (minimal && minimal.length >= lo - 1 && candidate.filter(v => !v).length >= 3) {
            lights = candidate;
            par = minimal.length;
            break;
        }
        lights = candidate;
        par = minimal ? minimal.length : presses.length;
    }

    return {
        type: 'switchboard',
        size,
        lights,          // initial state: true = lit
        par,             // fewest presses possible
        autoCheck: true, // solved the moment the board is fully lit
    };
}

/** answer: { presses: number[] } (every press, in order) */
export function validate(answer, puzzle) {
    if (!Array.isArray(answer?.presses)) return false;
    return applyPresses(puzzle.lights, answer.presses, puzzle.size).every(Boolean);
}

/** Next optimal press from the player's current board. */
export function getHint(puzzle, answer) {
    const current = applyPresses(puzzle.lights, answer?.presses || [], puzzle.size);
    const plan = solveMinimal(current, puzzle.size);
    if (!plan || plan.length === 0) return null;
    return { cell: plan[0], remaining: plan.length };
}
