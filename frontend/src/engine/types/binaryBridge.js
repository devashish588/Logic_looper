import { shuffle, randInt } from '../../utils/seededRng.js';

/**
 * Binary Bridge — path-finding logic game.
 * Connect nodes on a grid from start → end following numeric constraints.
 * Consecutive nodes in the path must satisfy a rule (e.g., differ by ≤ 2).
 */

function generateGrid(size, rng) {
    const grid = [];
    for (let r = 0; r < size; r++) {
        const row = [];
        for (let c = 0; c < size; c++) {
            row.push(randInt(1, 9, rng));
        }
        grid.push(row);
    }
    return grid;
}

/**
 * Find a valid path through the grid using BFS where consecutive values
 * differ by at most maxDiff.
 */
function findPath(grid, start, end, maxDiff) {
    const size = grid.length;
    const queue = [[start]];
    const visited = new Set();
    visited.add(`${start[0]},${start[1]}`);

    const directions = [
        [0, 1], [1, 0], [0, -1], [-1, 0],
    ];

    while (queue.length > 0) {
        const path = queue.shift();
        const [cr, cc] = path[path.length - 1];

        if (cr === end[0] && cc === end[1]) {
            return path;
        }

        for (const [dr, dc] of directions) {
            const nr = cr + dr;
            const nc = cc + dc;
            const key = `${nr},${nc}`;
            if (
                nr >= 0 && nr < size && nc >= 0 && nc < size &&
                !visited.has(key) &&
                Math.abs(grid[nr][nc] - grid[cr][cc]) <= maxDiff
            ) {
                visited.add(key);
                queue.push([...path, [nr, nc]]);
            }
        }
    }

    return null;
}

export function generate(rng, difficulty = 1) {
    // Grid sizes: 3 (easy), 4-5 (medium), 5-7 (hard)
    const size = Math.min(7, Math.max(3, Math.floor(2 + difficulty)));
    const maxDiff = Math.max(1, 4 - Math.floor(difficulty));  // tighter at higher diff

    let grid, solutionPath;
    let attempts = 0;

    // Keep generating until we find a solvable grid
    do {
        grid = generateGrid(size, rng);
        const start = [0, 0];
        const end = [size - 1, size - 1];
        solutionPath = findPath(grid, start, end, maxDiff);
        attempts++;
        if (attempts > 20) {
            // Fallback: relax constraint
            solutionPath = findPath(grid, [0, 0], [size - 1, size - 1], maxDiff + 2);
            break;
        }
    } while (!solutionPath);

    // If still no path, create a trivial one
    if (!solutionPath) {
        solutionPath = [];
        for (let i = 0; i < size; i++) solutionPath.push([0, i]);
        for (let i = 1; i < size; i++) solutionPath.push([i, size - 1]);
    }

    return {
        type: 'binaryBridge',
        size,
        grid,
        start: [0, 0],
        end: [size - 1, size - 1],
        maxDiff,
        solution: solutionPath,
        description: `Find a path from top-left to bottom-right. Adjacent steps must differ by at most ${maxDiff}.`,
    };
}

export function validate(userPath, puzzleData) {
    const { grid, start, end, maxDiff } = puzzleData;

    if (!Array.isArray(userPath) || userPath.length < 2) return false;

    // Check start and end
    if (userPath[0][0] !== start[0] || userPath[0][1] !== start[1]) return false;
    const last = userPath[userPath.length - 1];
    if (last[0] !== end[0] || last[1] !== end[1]) return false;

    // Check adjacency and constraint
    for (let i = 1; i < userPath.length; i++) {
        const [pr, pc] = userPath[i - 1];
        const [cr, cc] = userPath[i];
        const dr = Math.abs(cr - pr);
        const dc = Math.abs(cc - pc);

        // Must be adjacent (not diagonal)
        if (dr + dc !== 1) return false;

        // Value constraint
        if (Math.abs(grid[cr][cc] - grid[pr][pc]) > maxDiff) return false;
    }

    // Check no repeated nodes
    const visited = new Set();
    for (const [r, c] of userPath) {
        const key = `${r},${c}`;
        if (visited.has(key)) return false;
        visited.add(key);
    }

    return true;
}

export function getHint(puzzleData) {
    const { solution } = puzzleData;
    if (!solution || solution.length < 2) return null;
    // Reveal the next step in the correct path
    const revealIdx = Math.min(
        Math.floor(Math.random() * (solution.length - 1)) + 1,
        solution.length - 1,
    );
    return {
        step: revealIdx,
        position: solution[revealIdx],
        value: puzzleData.grid[solution[revealIdx][0]][solution[revealIdx][1]],
    };
}
