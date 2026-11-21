import { shuffle, randInt } from '../../utils/seededRng.js';

/**
 * Laser Path: a laser enters the grid from one edge. Click mirrors to turn
 * them between "/" and "\". Steer the beam out through the target on the edge.
 * Blocks stop the beam.
 *
 * Built by placing mirrors at random, tracing the beam to find where it
 * exits (that becomes the target), then turning some of the mirrors the beam
 * actually uses. Any arrangement that hits the target counts as solved.
 */

const DIRS = {
    right: [0, 1],
    left: [0, -1],
    up: [-1, 0],
    down: [1, 0],
};

// "/" and "\" reflections
const REFLECT = {
    '/': { right: 'up', up: 'right', left: 'down', down: 'left' },
    '\\': { right: 'down', down: 'right', left: 'up', up: 'left' },
};

const SIDES = ['left', 'right', 'top', 'bottom'];

function entry(source, size) {
    const { side, index } = source;
    if (side === 'left') return { r: index, c: 0, dir: 'right' };
    if (side === 'right') return { r: index, c: size - 1, dir: 'left' };
    if (side === 'top') return { r: 0, c: index, dir: 'down' };
    return { r: size - 1, c: index, dir: 'up' };
}

function exitOf(r, c, dir) {
    if (dir === 'right') return { side: 'right', index: r };
    if (dir === 'left') return { side: 'left', index: r };
    if (dir === 'up') return { side: 'top', index: c };
    return { side: 'bottom', index: c };
}

export function sameEdge(a, b) {
    return Boolean(a && b) && a.side === b.side && a.index === b.index;
}

/**
 * Trace the beam.
 * @param {object} puzzle        { size, source, mirrors:[{r,c}], blockers:[{r,c}] }
 * @param {string[]} orientation  '/' or '\' per mirror (same order as puzzle.mirrors)
 * @returns {{ cells: {r,c}[], mirrorsHit: number[], exit: {side,index} | null, blockedAt: {r,c} | null }}
 */
export function trace(puzzle, orientation) {
    const { size } = puzzle;
    const mirrorAt = new Map(puzzle.mirrors.map((m, i) => [m.r * size + m.c, i]));
    const blocked = new Set((puzzle.blockers || []).map(b => b.r * size + b.c));

    let { r, c, dir } = entry(puzzle.source, size);
    const cells = [];
    const mirrorsHit = [];
    const seen = new Set();

    for (let steps = 0; steps < size * size * 4 + 4; steps++) {
        const key = r * size + c;
        cells.push({ r, c });
        if (blocked.has(key)) return { cells, mirrorsHit, exit: null, blockedAt: { r, c } };

        const stateKey = `${key}:${dir}`;
        if (seen.has(stateKey)) break; // cannot happen with only mirrors, but never loop forever
        seen.add(stateKey);

        if (mirrorAt.has(key)) {
            const idx = mirrorAt.get(key);
            mirrorsHit.push(idx);
            dir = REFLECT[orientation[idx]][dir];
        }
        const [dr, dc] = DIRS[dir];
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) {
            return { cells, mirrorsHit, exit: exitOf(r, c, dir), blockedAt: null };
        }
        r = nr;
        c = nc;
    }
    return { cells, mirrorsHit, exit: null, blockedAt: null };
}

const flip = (o) => (o === '/' ? '\\' : '/');

export function generate(rng, difficulty = 1) {
    const size = difficulty < 1.5 ? 5 : 6;
    const [loM, hiM] = size === 5 ? [5, 7] : [7, 10];
    const minHits = difficulty < 1.3 ? 3 : difficulty < 1.7 ? 4 : 5;
    const allCells = Array.from({ length: size * size }, (_, i) => ({ r: Math.floor(i / size), c: i % size }));

    let best = null;
    for (let attempt = 0; attempt < 400; attempt++) {
        const mirrors = shuffle([...allCells], rng).slice(0, randInt(loM, hiM, rng));
        const solution = mirrors.map(() => (rng() < 0.5 ? '/' : '\\'));
        const source = { side: SIDES[randInt(0, 3, rng)], index: randInt(0, size - 1, rng) };
        const candidate = { size, source, mirrors, blockers: [] };
        const t = trace(candidate, solution);
        const hits = new Set(t.mirrorsHit).size;
        if (!t.exit) continue;
        if (!best || hits > best.hits) best = { candidate, solution, t, hits };
        if (hits >= minHits) break;
    }

    const { candidate, solution, t } = best;
    const target = t.exit;

    // Blocks off the beam's path make wrong turns costly.
    const onPath = new Set(t.cells.map(p => p.r * size + p.c));
    const mirrorCells = new Set(candidate.mirrors.map(m => m.r * size + m.c));
    const free = allCells.filter(p => !onPath.has(p.r * size + p.c) && !mirrorCells.has(p.r * size + p.c));
    const blockerCount = difficulty < 1.3 ? 1 : difficulty < 1.7 ? 2 : 3;
    candidate.blockers = shuffle(free, rng).slice(0, blockerCount);

    // Scramble: turn some of the mirrors the solution beam uses, randomize the rest.
    const usedMirrors = [...new Set(t.mirrorsHit)];
    const initial = solution.map((o, i) => (usedMirrors.includes(i) ? o : (rng() < 0.5 ? '/' : '\\')));
    const toTurn = shuffle([...usedMirrors], rng);
    const turnCount = Math.max(2, Math.ceil(usedMirrors.length * 0.6));
    toTurn.slice(0, Math.min(turnCount, toTurn.length)).forEach(i => { initial[i] = flip(initial[i]); });
    // Never start already solved
    let k = 0;
    while (sameEdge(trace(candidate, initial).exit, target) && k < candidate.mirrors.length) {
        initial[k] = flip(initial[k]);
        k++;
    }

    return {
        type: 'laserPath',
        size,
        source: candidate.source,
        target,
        mirrors: candidate.mirrors.map((m, i) => ({ ...m, initial: initial[i] })),
        blockers: candidate.blockers,
        solution,
        solutionPath: [...new Set(t.mirrorsHit)], // mirrors in the order the solution beam meets them
        autoCheck: true,
    };
}

/** answer: { orientation: string[] } */
export function validate(answer, puzzle) {
    const o = answer?.orientation;
    if (!Array.isArray(o) || o.length !== puzzle.mirrors.length) return false;
    return sameEdge(trace(puzzle, o).exit, puzzle.target);
}

/** First mirror (along the solution beam) that is turned the wrong way. */
export function getHint(puzzle, answer) {
    const o = answer?.orientation || puzzle.mirrors.map(m => m.initial);
    const idx = puzzle.solutionPath.find(i => o[i] !== puzzle.solution[i]);
    if (idx === undefined) return null;
    return { mirror: idx, ...puzzle.mirrors[idx], orientation: puzzle.solution[idx] };
}
