import { randInt } from '../../utils/seededRng.js';

/**
 * Measure Up: measure an exact amount of water with jugs that have no markings.
 *
 *  - "tap" mode: two jugs, plus a tap and a drain. Fill, empty, or pour.
 *  - "pour" mode: three jugs, the largest starts full, no tap. Pour only.
 *
 * Every candidate is searched exhaustively (BFS), so "par" is the true minimum
 * number of moves, and a hint is the first move of an optimal plan from
 * wherever the player currently is.
 */

export const JUG_NAMES = ['A', 'B', 'C'];

/** Returns the new state, or null if the move does nothing / isn't allowed. */
export function applyMove(state, puzzle, move) {
    const caps = puzzle.capacities;
    const s = [...state];
    if (move.a === 'fill') {
        if (puzzle.mode !== 'tap' || s[move.i] === caps[move.i]) return null;
        s[move.i] = caps[move.i];
    } else if (move.a === 'empty') {
        if (puzzle.mode !== 'tap' || s[move.i] === 0) return null;
        s[move.i] = 0;
    } else if (move.a === 'pour') {
        const { from, to } = move;
        if (from === to || s[from] === 0 || s[to] === caps[to]) return null;
        const amount = Math.min(s[from], caps[to] - s[to]);
        s[from] -= amount;
        s[to] += amount;
    } else {
        return null;
    }
    return s;
}

function allMoves(puzzle) {
    const n = puzzle.capacities.length;
    const moves = [];
    if (puzzle.mode === 'tap') {
        for (let i = 0; i < n; i++) moves.push({ a: 'fill', i }, { a: 'empty', i });
    }
    for (let from = 0; from < n; from++) {
        for (let to = 0; to < n; to++) if (from !== to) moves.push({ a: 'pour', from, to });
    }
    return moves;
}

const isGoal = (state, target) => state.includes(target);

/** BFS from a state. Returns Map key -> { dist, firstMove } for every reachable state. */
function explore(puzzle, start) {
    const moves = allMoves(puzzle);
    const seen = new Map([[start.join(','), { dist: 0, firstMove: null, state: start }]]);
    const queue = [start];
    while (queue.length) {
        const s = queue.shift();
        const info = seen.get(s.join(','));
        for (const m of moves) {
            const next = applyMove(s, puzzle, m);
            if (!next) continue;
            const key = next.join(',');
            if (seen.has(key)) continue;
            seen.set(key, { dist: info.dist + 1, firstMove: info.firstMove || m, state: next });
            queue.push(next);
        }
    }
    return seen;
}

/** Fewest moves from `start` until some jug holds `target` (Infinity if impossible). */
function minMovesTo(reachable, target) {
    let best = Infinity;
    for (const { dist, state } of reachable.values()) {
        if (dist < best && isGoal(state, target)) best = dist;
    }
    return best;
}

function candidatePuzzle(rng, mode) {
    if (mode === 'tap') {
        const a = randInt(3, 9, rng);
        const b = randInt(a + 2, 14, rng);
        return { mode, capacities: [a, b], start: [0, 0] };
    }
    const small = randInt(3, 6, rng);
    const mid = randInt(small + 1, 9, rng);
    const big = randInt(mid + 1, Math.min(small + mid, 13), rng);
    return { mode, capacities: [big, mid, small], start: [big, 0, 0] };
}

export function generate(rng, difficulty = 1) {
    let mode = 'tap';
    if (difficulty >= 1.5) mode = rng() < 0.5 ? 'tap' : 'pour';
    const [lo, hi] = difficulty < 1.3 ? [3, 5] : difficulty < 1.7 ? [4, 7] : [6, 10];

    for (let attempt = 0; attempt < 300; attempt++) {
        const p = candidatePuzzle(rng, mode);
        const reachable = explore(p, p.start);
        const maxCap = Math.max(...p.capacities);
        const targets = [];
        for (let t = 1; t < maxCap; t++) {
            if (p.start.includes(t)) continue;
            const d = minMovesTo(reachable, t);
            if (d >= lo && d <= hi) targets.push({ t, d });
        }
        if (targets.length) {
            const { t, d } = targets[randInt(0, targets.length - 1, rng)];
            return { type: 'measureUp', ...p, target: t, par: d, autoCheck: true };
        }
    }
    // Fallback: the classic 3 & 5 → 4
    return { type: 'measureUp', mode: 'tap', capacities: [3, 5], start: [0, 0], target: 4, par: 6, autoCheck: true };
}

/** Replay the player's moves from the start. Illegal moves are ignored. */
export function replay(puzzle, moves = []) {
    let s = [...puzzle.start];
    for (const m of moves) {
        const next = applyMove(s, puzzle, m);
        if (next) s = next;
    }
    return s;
}

/** answer: { moves: Move[] } */
export function validate(answer, puzzle) {
    if (!Array.isArray(answer?.moves)) return false;
    return isGoal(replay(puzzle, answer.moves), puzzle.target);
}

/** First move of an optimal plan from the player's current state. */
export function getHint(puzzle, answer) {
    const current = replay(puzzle, answer?.moves || []);
    if (isGoal(current, puzzle.target)) return null;
    const reachable = explore(puzzle, current);
    let best = null;
    for (const info of reachable.values()) {
        if (isGoal(info.state, puzzle.target) && (!best || info.dist < best.dist)) best = info;
    }
    return best ? { move: best.firstMove, remaining: best.dist } : null;
}

export function describeMove(move) {
    if (move.a === 'fill') return `Fill jug ${JUG_NAMES[move.i]} from the tap`;
    if (move.a === 'empty') return `Empty jug ${JUG_NAMES[move.i]}`;
    return `Pour jug ${JUG_NAMES[move.from]} into jug ${JUG_NAMES[move.to]}`;
}
