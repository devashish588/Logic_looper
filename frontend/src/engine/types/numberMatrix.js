import { shuffle, randInt } from '../../utils/seededRng.js';

/**
 * Number Matrix — Sudoku-like grid puzzle.
 * Novice: 4×4, Intermediate: 5×5, Expert: 6×6 with 2×3 box constraints.
 * Guarantees unique solution via backtracking solver.
 */

function generateFullGrid(size, rng) {
    const grid = Array.from({ length: size }, () => Array(size).fill(0));

    function isValid(grid, row, col, num) {
        for (let i = 0; i < size; i++) {
            if (grid[row][i] === num || grid[i][col] === num) return false;
        }
        return true;
    }

    function solve(grid) {
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (grid[r][c] === 0) {
                    const nums = Array.from({ length: size }, (_, i) => i + 1);
                    shuffle(nums, rng);
                    for (const num of nums) {
                        if (isValid(grid, r, c, num)) {
                            grid[r][c] = num;
                            if (solve(grid)) return true;
                            grid[r][c] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    solve(grid);
    return grid;
}

/**
 * Count the number of solutions for a puzzle (stops at 2 to save time).
 */
function countSolutions(puzzle, size, maxCount = 2) {
    const grid = puzzle.map(r => [...r]);
    let count = 0;

    function isValid(row, col, num) {
        for (let i = 0; i < size; i++) {
            if (grid[row][i] === num || grid[i][col] === num) return false;
        }
        return true;
    }

    function solve() {
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (grid[r][c] === 0) {
                    for (let num = 1; num <= size; num++) {
                        if (isValid(r, c, num)) {
                            grid[r][c] = num;
                            solve();
                            if (count >= maxCount) return;
                            grid[r][c] = 0;
                        }
                    }
                    return;
                }
            }
        }
        count++;
    }

    solve();
    return count;
}

export function generate(rng, difficulty = 1) {
    // Scale grid size with difficulty
    let size;
    if (difficulty < 0.8) size = 4;
    else if (difficulty < 1.5) size = 5;
    else size = 6;

    const solution = generateFullGrid(size, rng);

    // More difficulty = fewer given cells
    const totalCells = size * size;
    const revealRatio = Math.max(0.3, 0.65 - difficulty * 0.08);
    const revealCount = Math.max(size + 1, Math.floor(totalCells * revealRatio));

    const allPositions = [];
    for (let r = 0; r < size; r++)
        for (let c = 0; c < size; c++)
            allPositions.push([r, c]);

    shuffle(allPositions, rng);

    // Remove cells one by one, ensuring unique solution
    const given = Array.from({ length: size }, () => Array(size).fill(true));
    const puzzle = solution.map(row => [...row]);

    const removeOrder = [...allPositions];
    let removed = 0;
    const targetRemove = totalCells - revealCount;

    for (const [r, c] of removeOrder) {
        if (removed >= targetRemove) break;

        const backup = puzzle[r][c];
        puzzle[r][c] = 0;
        given[r][c] = false;

        // Check unique solution
        if (countSolutions(puzzle, size) === 1) {
            removed++;
        } else {
            // Restore — removing this cell creates ambiguity
            puzzle[r][c] = backup;
            given[r][c] = true;
        }
    }

    return {
        type: 'numberMatrix',
        size,
        puzzle,
        solution: solution.map(row => [...row]),
        given,
    };
}

export function validate(userGrid, puzzleData) {
    const size = puzzleData.size || userGrid.length;
    const given = puzzleData.given;

    // 1. Check given cells unchanged
    for (let r = 0; r < size; r++)
        for (let c = 0; c < size; c++)
            if (given[r][c] && userGrid[r][c] !== puzzleData.puzzle[r][c])
                return false;

    // 2. Every cell filled with 1–N
    for (let r = 0; r < size; r++)
        for (let c = 0; c < size; c++) {
            const v = userGrid[r][c];
            if (!Number.isInteger(v) || v < 1 || v > size) return false;
        }

    // 3. Unique rows
    for (let r = 0; r < size; r++) {
        const seen = new Set();
        for (let c = 0; c < size; c++) {
            if (seen.has(userGrid[r][c])) return false;
            seen.add(userGrid[r][c]);
        }
    }

    // 4. Unique columns
    for (let c = 0; c < size; c++) {
        const seen = new Set();
        for (let r = 0; r < size; r++) {
            if (seen.has(userGrid[r][c])) return false;
            seen.add(userGrid[r][c]);
        }
    }

    return true;
}

export function getHint(puzzleData, solution, userGrid) {
    const size = puzzleData.size || solution.length;
    const emptyCells = [];
    for (let r = 0; r < size; r++)
        for (let c = 0; c < size; c++)
            if (!puzzleData.given[r][c] && userGrid[r][c] !== solution[r][c])
                emptyCells.push({ row: r, col: c, value: solution[r][c] });
    if (emptyCells.length === 0) return null;
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}
