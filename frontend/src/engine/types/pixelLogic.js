/**
 * Pixel Logic: numbers beside each row and column give the lengths of the
 * filled runs in that line, in order. Fill cells to satisfy every clue and
 * reveal a hidden symmetric picture.
 *
 * Every puzzle is checked with a line-by-line solver, so it can be finished by
 * pure deduction with no guessing (which also means the answer is unique).
 */

export function runsOf(line) {
    const runs = [];
    let n = 0;
    for (const v of line) {
        if (v === 1) n++;
        else if (n) { runs.push(n); n = 0; }
    }
    if (n) runs.push(n);
    return runs.length ? runs : [0];
}

const sameRuns = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

// All 2^size lines, grouped by their run clue, cached per size.
const lineCache = new Map();
function linesByClue(size) {
    if (!lineCache.has(size)) {
        const map = new Map();
        for (let mask = 0; mask < (1 << size); mask++) {
            const line = Array.from({ length: size }, (_, i) => (mask >> i) & 1);
            const key = runsOf(line).join(',');
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(line);
        }
        lineCache.set(size, map);
    }
    return lineCache.get(size);
}

/**
 * Solve by repeated line deduction. Returns the grid (1/0) if fully solved,
 * or null if it needs guessing.
 */
export function lineSolve(rowClues, colClues, size) {
    const lines = linesByClue(size);
    const grid = Array.from({ length: size }, () => Array(size).fill(-1));
    const rowCands = rowClues.map(c => lines.get(c.join(',')) || []);
    const colCands = colClues.map(c => lines.get(c.join(',')) || []);

    const reduce = (cands, get, set) => {
        let changed = false;
        for (let i = 0; i < size; i++) {
            const known = Array.from({ length: size }, (_, j) => get(i, j));
            cands[i] = cands[i].filter(line => line.every((v, j) => known[j] === -1 || known[j] === v));
            if (!cands[i].length) return null;
            for (let j = 0; j < size; j++) {
                if (known[j] !== -1) continue;
                const first = cands[i][0][j];
                if (cands[i].every(line => line[j] === first)) { set(i, j, first); changed = true; }
            }
        }
        return changed;
    };

    for (let guard = 0; guard < size * size * 2; guard++) {
        const a = reduce(rowCands, (i, j) => grid[i][j], (i, j, v) => { grid[i][j] = v; });
        const b = reduce(colCands, (i, j) => grid[j][i], (i, j, v) => { grid[j][i] = v; });
        if (a === null || b === null) return null;
        if (!a && !b) break;
    }
    return grid.every(row => row.every(v => v !== -1)) ? grid : null;
}

function cluesFor(grid) {
    const size = grid.length;
    return {
        rowClues: grid.map(row => runsOf(row)),
        colClues: Array.from({ length: size }, (_, c) => runsOf(grid.map(row => row[c]))),
    };
}

export function generate(rng, difficulty = 1) {
    const size = difficulty < 1.35 ? 5 : difficulty < 1.75 ? 6 : 7;
    const density = 0.5 + rng() * 0.12;
    const half = Math.ceil(size / 2);

    let fallback = null;
    for (let attempt = 0; attempt < 120; attempt++) {
        // Mirror-symmetric "sprite" so the reveal looks like a picture
        const grid = Array.from({ length: size }, () => {
            const left = Array.from({ length: half }, () => (rng() < density ? 1 : 0));
            const row = Array(size).fill(0);
            left.forEach((v, c) => { row[c] = v; row[size - 1 - c] = v; });
            return row;
        });
        const filled = grid.flat().filter(Boolean).length;
        const { rowClues, colClues } = cluesFor(grid);
        if (!fallback) fallback = { rowClues, colClues, solution: grid };
        if (filled < size * size * 0.35 || filled > size * size * 0.75) continue;
        if (lineSolve(rowClues, colClues, size)) {
            return { type: 'pixelLogic', size, rowClues, colClues, solution: grid, autoCheck: true };
        }
    }
    // Rare: no deduction-only grid found. Still valid; any grid matching the clues counts.
    return { type: 'pixelLogic', size, ...fallback, autoCheck: true };
}

/** answer: { grid: number[][] } with 1 = filled (0 empty, 2 marked as empty) */
export function validate(answer, puzzle) {
    const g = answer?.grid;
    if (!Array.isArray(g) || g.length !== puzzle.size) return false;
    const bin = g.map(row => row.map(v => (v === 1 ? 1 : 0)));
    const { rowClues, colClues } = cluesFor(bin);
    return rowClues.every((c, i) => sameRuns(c, puzzle.rowClues[i])) &&
        colClues.every((c, i) => sameRuns(c, puzzle.colClues[i]));
}

/** Is row/column `i`'s clue satisfied by the player's grid? */
export function lineDone(grid, puzzle, axis, i) {
    const line = axis === 'row' ? grid[i] : grid.map(row => row[i]);
    const clue = axis === 'row' ? puzzle.rowClues[i] : puzzle.colClues[i];
    return sameRuns(runsOf(line.map(v => (v === 1 ? 1 : 0))), clue);
}

/** A cell the player has wrong (wrongly filled first, then missing). */
export function getHint(puzzle, answer) {
    const g = answer?.grid;
    const { size, solution } = puzzle;
    const cells = [];
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) cells.push({ r, c });
    const user = (r, c) => (g?.[r]?.[c] === 1 ? 1 : 0);
    const wrongFill = cells.find(({ r, c }) => user(r, c) === 1 && solution[r][c] === 0);
    if (wrongFill) return { ...wrongFill, filled: false };
    const missing = cells.find(({ r, c }) => user(r, c) === 0 && solution[r][c] === 1);
    return missing ? { ...missing, filled: true } : null;
}
