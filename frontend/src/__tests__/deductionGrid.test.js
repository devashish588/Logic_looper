import { createRng } from '../utils/seededRng.js';
import { generate, validate, getHint } from '../engine/types/deductionGrid.js';

describe('deductionGrid', () => {
    let rng;

    beforeEach(() => {
        rng = createRng('test-deduction-grid');
    });

    describe('generate', () => {
        it('returns an object with type, categories, clues, solution, and size', () => {
            const result = generate(rng);
            expect(result.type).toBe('deductionGrid');
            expect(result.size).toBe(3);
            expect(result.categories).toHaveProperty('names');
            expect(result.categories).toHaveProperty('colors');
            expect(result.categories).toHaveProperty('items');
            expect(Array.isArray(result.clues)).toBe(true);
            expect(result.solution).toHaveProperty('assignments');
        });

        it('categories have 3 items each', () => {
            const result = generate(rng);
            expect(result.categories.names).toHaveLength(3);
            expect(result.categories.colors).toHaveLength(3);
            expect(result.categories.items).toHaveLength(3);
        });

        it('solution assignments map each name to color and item', () => {
            const result = generate(rng);
            const names = Object.keys(result.solution.assignments);
            expect(names).toHaveLength(3);
            for (const name of names) {
                expect(result.solution.assignments[name]).toHaveProperty('color');
                expect(result.solution.assignments[name]).toHaveProperty('item');
            }
        });

        it('has at least 3 clues', () => {
            const result = generate(rng);
            expect(result.clues.length).toBeGreaterThanOrEqual(3);
        });

        it('is deterministic', () => {
            const r1 = generate(createRng('det-ded'));
            const r2 = generate(createRng('det-ded'));
            expect(r1.solution).toEqual(r2.solution);
        });
    });

    describe('validate', () => {
        it('returns true for correct assignments', () => {
            const puzzle = generate(rng);
            expect(validate(puzzle.solution.assignments, puzzle.solution)).toBe(true);
        });

        it('returns false for swapped assignments', () => {
            const puzzle = generate(rng);
            const wrong = { ...puzzle.solution.assignments };
            const names = Object.keys(wrong);
            // Swap first two names' assignments
            const temp = wrong[names[0]];
            wrong[names[0]] = wrong[names[1]];
            wrong[names[1]] = temp;
            expect(validate(wrong, puzzle.solution)).toBe(false);
        });

        it('returns false for missing assignments', () => {
            expect(
                validate({}, generate(rng).solution),
            ).toBe(false);
        });
    });

    describe('getHint', () => {
        it('returns an object with name, color, and item', () => {
            const puzzle = generate(rng);
            const hint = getHint(puzzle);
            expect(hint).toHaveProperty('name');
            expect(hint).toHaveProperty('color');
            expect(hint).toHaveProperty('item');
            // Verify hint is a real assignment
            expect(puzzle.solution.assignments[hint.name].color).toBe(hint.color);
            expect(puzzle.solution.assignments[hint.name].item).toBe(hint.item);
        });
    });
});
