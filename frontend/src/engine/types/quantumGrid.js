import { shuffle, randInt } from '../../utils/seededRng.js';

/**
 * Quantum Grid — Symbol-based Latin square puzzle.
 * Similar to Sudoku but uses logic symbols.
 * Every row and column must contain each symbol exactly once.
 */

const ALL_SYMBOLS = ['◆', '▲', '●', '■', '★', '⬡', '⬢'];

function generateFullGrid(size, rng) {
    const symbols = ALL_SYMBOLS.slice(0, size);
    const grid = Array.from({ length: size }, () => Array(size).fill(null));

    function isValid(grid, row, col, sym) {
        for (let i = 0; i < size; i++) {
            if (grid[row][i] === sym || grid[i][col] === sym) return false;
        }
        return true;
    }

    function solve(grid) {
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (grid[r][c] === null) {
                    const syms = [...symbols];
                    shuffle(syms, rng);
                    for (const sym of syms) {
                        if (isValid(grid, r, c, sym)) {
                            grid[r][c] = sym;
                            if (solve(grid)) return true;
                            grid[r][c] = null;
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

export function generate(rng, difficulty = 1) {
    // Difficulty tiers: 3 (novice), 5 (adept), 7 (grandmaster)
    let size;
    if (difficulty >= 3) size = 7;
    else if (difficulty >= 2) size = 5;
    else size = 3;

    const symbols = ALL_SYMBOLS.slice(0, size);
    const solution = generateFullGrid(size, rng);

    // How many cells to reveal — fewer at higher difficulty
    const totalCells = size * size;
    const revealRatio = difficulty >= 3 ? 0.25 : difficulty >= 2 ? 0.40 : 0.55;
    const revealCount = Math.max(size, Math.floor(totalCells * revealRatio));

    const allPositions = [];
    for (let r = 0; r < size; r++)
        for (let c = 0; c < size; c++) allPositions.push([r, c]);

    shuffle(allPositions, rng);
    const revealedPositions = new Set(
        allPositions.slice(0, revealCount).map(([r, c]) => `${r},${c}`),
    );

    const puzzle = solution.map((row, r) =>
        row.map((val, c) => (revealedPositions.has(`${r},${c}`) ? val : null)),
    );

    return {
        type: 'quantumGrid',
        size,
        symbols,
        puzzle,
        solution: solution.map((row) => [...row]),
        given: puzzle.map((row) => row.map((v) => v !== null)),
    };
}

export function validate(userGrid, puzzleData) {
    const { solution } = puzzleData;
    for (let r = 0; r < solution.length; r++)
        for (let c = 0; c < solution[0].length; c++)
            if (userGrid[r][c] !== solution[r][c]) return false;
    return true;
}

export function getHint(puzzle, solution, userGrid) {
    const emptyCells = [];
    for (let r = 0; r < solution.length; r++)
        for (let c = 0; c < solution[0].length; c++)
            if (!puzzle.given[r][c] && userGrid[r][c] !== solution[r][c])
                emptyCells.push({ row: r, col: c, symbol: solution[r][c] });
    if (emptyCells.length === 0) return null;
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}
