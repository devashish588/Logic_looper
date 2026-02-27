import { shuffle, randInt } from '../../utils/seededRng.js';

/**
 * Number Matrix — Sudoku-like grid puzzle.
 * Generates a 4×4 grid where each row & column has unique numbers 1–4.
 * Difficulty controls how many cells are revealed.
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

export function generate(rng, difficulty = 1) {
  const size = 4;
  const solution = generateFullGrid(size, rng);

  // More difficulty = fewer given cells
  const totalCells = size * size;
  const revealCount = Math.max(
    4,
    Math.floor(totalCells * (0.65 - difficulty * 0.1)),
  );

  const allPositions = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) allPositions.push([r, c]);

  shuffle(allPositions, rng);
  const revealedPositions = new Set(
    allPositions.slice(0, revealCount).map(([r, c]) => `${r},${c}`),
  );

  const puzzle = solution.map((row, r) =>
    row.map((val, c) => (revealedPositions.has(`${r},${c}`) ? val : 0)),
  );

  return {
    type: 'numberMatrix',
    size,
    puzzle,
    solution: solution.map((row) => [...row]),
    given: puzzle.map((row) => row.map((v) => v !== 0)),
  };
}

export function validate(userGrid, solution) {
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
        emptyCells.push({ row: r, col: c, value: solution[r][c] });
  if (emptyCells.length === 0) return null;
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}
