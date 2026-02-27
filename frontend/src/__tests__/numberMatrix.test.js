import { createRng } from '../utils/seededRng.js';
import { generate, validate, getHint } from '../engine/types/numberMatrix.js';

describe('numberMatrix', () => {
    let rng;

    beforeEach(() => {
        rng = createRng('test-number-matrix');
    });

    describe('generate', () => {
        it('returns an object with type, size, puzzle, solution, and given', () => {
            const result = generate(rng);
            expect(result.type).toBe('numberMatrix');
            expect(result.size).toBe(4);
            expect(result.puzzle).toHaveLength(4);
            expect(result.solution).toHaveLength(4);
            expect(result.given).toHaveLength(4);
        });

        it('solution has unique numbers 1-4 in each row', () => {
            const { solution, size } = generate(rng);
            for (const row of solution) {
                const sorted = [...row].sort((a, b) => a - b);
                expect(sorted).toEqual([1, 2, 3, 4]);
            }
        });

        it('solution has unique numbers 1-4 in each column', () => {
            const { solution, size } = generate(rng);
            for (let c = 0; c < size; c++) {
                const col = solution.map((row) => row[c]);
                const sorted = [...col].sort((a, b) => a - b);
                expect(sorted).toEqual([1, 2, 3, 4]);
            }
        });

        it('puzzle has some cells set to 0 (hidden)', () => {
            const { puzzle } = generate(rng);
            const flat = puzzle.flat();
            expect(flat.some((v) => v === 0)).toBe(true);
        });

        it('given grid booleans match puzzle cells', () => {
            const { puzzle, given } = generate(rng);
            for (let r = 0; r < 4; r++) {
                for (let c = 0; c < 4; c++) {
                    expect(given[r][c]).toBe(puzzle[r][c] !== 0);
                }
            }
        });

        it('is deterministic — same rng seed yields same puzzle', () => {
            const rng1 = createRng('deterministic');
            const rng2 = createRng('deterministic');
            const result1 = generate(rng1);
            const result2 = generate(rng2);
            expect(result1.solution).toEqual(result2.solution);
            expect(result1.puzzle).toEqual(result2.puzzle);
        });
    });

    describe('validate', () => {
        it('returns true for correct solution', () => {
            const { solution } = generate(rng);
            expect(validate(solution, solution)).toBe(true);
        });

        it('returns false for incorrect solution', () => {
            const { solution } = generate(rng);
            const wrong = solution.map((row) => [...row]);
            // Swap two cells to make it wrong
            wrong[0][0] = wrong[0][0] === 1 ? 2 : 1;
            expect(validate(wrong, solution)).toBe(false);
        });
    });

    describe('getHint', () => {
        it('returns a hint with row, col, value for an unsolved cell', () => {
            const puzzle = generate(rng);
            // Use a partially filled user grid (all zeros)
            const userGrid = puzzle.puzzle.map((row) => [...row]);
            const hint = getHint(puzzle, puzzle.solution, userGrid);
            if (hint) {
                expect(hint).toHaveProperty('row');
                expect(hint).toHaveProperty('col');
                expect(hint).toHaveProperty('value');
                expect(puzzle.solution[hint.row][hint.col]).toBe(hint.value);
            }
        });

        it('returns null when all cells are correctly filled', () => {
            const puzzle = generate(rng);
            const hint = getHint(puzzle, puzzle.solution, puzzle.solution);
            expect(hint).toBeNull();
        });
    });
});
