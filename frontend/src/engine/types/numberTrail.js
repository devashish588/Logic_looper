import { shuffle } from '../../utils/seededRng.js';

/**
 * Number Trail: draw one path that visits every cell exactly once, moving
 * up/down/left/right, so the cells are numbered 1, 2, 3 … in order. Some
 * numbers are given and the path must pass through them at the right step.
 *
 * Givens are removed one at a time while the puzzle still has exactly one
 * solution, so the trail can always be found by reasoning.
 */

export function adjacent(a, b, size) {
    const ar = Math.floor(a / size), ac = a % size;
    const br = Math.floor(b / size), bc = b % size;
    return Math.abs(ar - br) + Math.abs(ac - bc) === 1;
}

function neighbourList(size) {
    const list = [];
    for (let i = 0; i < size * size; i++) {
        const r = Math.floor(i / size), c = i % size;
        const n = [];
        if (r > 0) n.push(i - size);
        if (r < size - 1) n.push(i + size);
        if (c > 0) n.push(i - 1);
        if (c < size - 1) n.push(i + 1);
        list.push(n);
    }
    return list;
}

/** Random Hamiltonian path (Warnsdorff ordering + backtracking). */
function randomPath(size, rng) {
    const n = size * size;
    const nbrs = neighbourList(size);
    const starts = shuffle(Array.from({ length: n }, (_, i) => i), rng);

    for (const start of starts) {
        const path = [start];
        const used = new Uint8Array(n);
        used[start] = 1;
        let budget = 20000;

        const dfs = () => {
            if (path.length === n) return true;
            if (--budget <= 0) return false;
            const cur = path[path.length - 1];
            const options = nbrs[cur].filter(x => !used[x]);
            // Fewest onward moves first, random tie-break
            const scored = options.map(x => ({ x, deg: nbrs[x].filter(y => !used[y]).length, t: rng() }));
            scored.sort((a, b) => a.deg - b.deg || a.t - b.t);
            for (const { x } of scored) {
                used[x] = 1; path.push(x);
                if (dfs()) return true;
                used[x] = 0; path.pop();
            }
            return false;
        };
        if (dfs()) return path;
    }
    return null;
}

/**
 * Count solutions consistent with the givens (stops at `limit`).
 * givens: Map(number -> cell). Number 1 must be given.
 */
export function countSolutions(size, givens, limit = 2) {
    const n = size * size;
    const nbrs = neighbourList(size);
    const cellToNum = new Map([...givens].map(([num, cell]) => [cell, num]));
    const givenNums = [...givens.keys()].sort((a, b) => a - b);
    const used = new Uint8Array(n);
    let count = 0;
    let budget = 400000;

    const nextGiven = (k) => givenNums.find(g => g > k);
    const dist = (a, b) => Math.abs(Math.floor(a / size) - Math.floor(b / size)) + Math.abs((a % size) - (b % size));

    const dfs = (cell, k) => {
        if (count >= limit || --budget <= 0) return;
        if (k === n) { count++; return; }
        const g = nextGiven(k);
        if (g !== undefined) {
            const target = givens.get(g);
            const d = dist(cell, target);
            if (d > g - k || (g - k - d) % 2 !== 0) return;
        }
        const wantGiven = givens.get(k + 1);
        for (const x of nbrs[cell]) {
            if (used[x]) continue;
            if (wantGiven !== undefined ? x !== wantGiven : cellToNum.has(x)) continue;
            used[x] = 1;
            dfs(x, k + 1);
            used[x] = 0;
            if (count >= limit) return;
        }
    };

    const start = givens.get(1);
    used[start] = 1;
    dfs(start, 1);
    return budget <= 0 ? limit : count; // out of budget: treat as "not proven unique"
}

export function generate(rng, difficulty = 1) {
    const size = difficulty < 1.4 ? 4 : 5;
    const n = size * size;
    const path = randomPath(size, rng);
    const keepTarget = size === 4
        ? (difficulty < 1.2 ? 7 : 6)
        : (difficulty < 1.6 ? 10 : difficulty < 1.85 ? 8 : 7);

    // Start with every number given, then remove while still unique.
    const givens = new Map(path.map((cell, i) => [i + 1, cell]));
    const removable = shuffle(Array.from({ length: n - 2 }, (_, i) => i + 2), rng); // keep 1 and n
    for (const num of removable) {
        if (givens.size <= keepTarget) break;
        const cell = givens.get(num);
        givens.delete(num);
        if (countSolutions(size, givens) !== 1) givens.set(num, cell);
    }

    return {
        type: 'numberTrail',
        size,
        givens: Object.fromEntries(givens), // { number: cellIndex }
        solution: path,                     // cell index for step 1..n
        autoCheck: true,
    };
}

/**
 * Can the trail be extended onto `cell`? Enforces adjacency, no revisits, and
 * given numbers landing exactly on their cells.
 */
export function canExtend(puzzle, trail, cell) {
    const last = trail[trail.length - 1];
    if (!adjacent(last, cell, puzzle.size) || trail.includes(cell)) return false;
    const nextNum = trail.length + 1;
    const givenHere = Object.entries(puzzle.givens).find(([, c]) => c === cell);
    if (givenHere) return Number(givenHere[0]) === nextNum;
    return puzzle.givens[nextNum] === undefined;
}

/** answer: { trail: number[] } of cell indices, step 1 first */
export function validate(answer, puzzle) {
    const t = answer?.trail;
    const n = puzzle.size * puzzle.size;
    if (!Array.isArray(t) || t.length !== n || new Set(t).size !== n) return false;
    for (let i = 1; i < n; i++) if (!adjacent(t[i - 1], t[i], puzzle.size)) return false;
    return Object.entries(puzzle.givens).every(([num, cell]) => t[Number(num) - 1] === cell);
}

/** The first step where the player's trail leaves the solution (or the next step). */
export function getHint(puzzle, answer) {
    const t = answer?.trail || [puzzle.givens[1]];
    const n = puzzle.size * puzzle.size;
    let k = 0;
    while (k < t.length && t[k] === puzzle.solution[k]) k++;
    if (k >= n) return null;
    // Past the end of the trail: skip steps whose number is already printed on the board
    while (k >= t.length && k < n - 1 && puzzle.givens[k + 1] !== undefined) k++;
    const cell = puzzle.solution[k];
    return { number: k + 1, cell, r: Math.floor(cell / puzzle.size), c: cell % puzzle.size, diverged: k < t.length };
}

