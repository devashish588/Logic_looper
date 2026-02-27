import {
    PUZZLE_TYPES,
    PUZZLE_LABELS,
    PUZZLE_DESCRIPTIONS,
    PUZZLE_ICON_KEYS,
    MAX_HINTS,
    POINTS_BASE,
    ACHIEVEMENTS,
} from '../utils/constants.js';

describe('constants', () => {
    describe('PUZZLE_TYPES', () => {
        it('has exactly 5 types', () => {
            expect(PUZZLE_TYPES).toHaveLength(5);
        });

        it('contains expected types', () => {
            expect(PUZZLE_TYPES).toContain('numberMatrix');
            expect(PUZZLE_TYPES).toContain('patternMatch');
            expect(PUZZLE_TYPES).toContain('sequenceSolver');
            expect(PUZZLE_TYPES).toContain('deductionGrid');
            expect(PUZZLE_TYPES).toContain('binaryLogic');
        });

        it('has no duplicates', () => {
            const unique = new Set(PUZZLE_TYPES);
            expect(unique.size).toBe(PUZZLE_TYPES.length);
        });
    });

    describe('PUZZLE_LABELS', () => {
        it('has a label for every puzzle type', () => {
            for (const type of PUZZLE_TYPES) {
                expect(PUZZLE_LABELS[type]).toBeDefined();
                expect(typeof PUZZLE_LABELS[type]).toBe('string');
                expect(PUZZLE_LABELS[type].length).toBeGreaterThan(0);
            }
        });
    });

    describe('PUZZLE_DESCRIPTIONS', () => {
        it('has a description for every puzzle type', () => {
            for (const type of PUZZLE_TYPES) {
                expect(PUZZLE_DESCRIPTIONS[type]).toBeDefined();
                expect(typeof PUZZLE_DESCRIPTIONS[type]).toBe('string');
            }
        });
    });

    describe('PUZZLE_ICON_KEYS', () => {
        it('has an icon key for every puzzle type', () => {
            for (const type of PUZZLE_TYPES) {
                expect(PUZZLE_ICON_KEYS[type]).toBeDefined();
            }
        });
    });

    describe('scoring constants', () => {
        it('MAX_HINTS is a positive integer', () => {
            expect(MAX_HINTS).toBeGreaterThan(0);
            expect(Number.isInteger(MAX_HINTS)).toBe(true);
        });

        it('POINTS_BASE is 100', () => {
            expect(POINTS_BASE).toBe(100);
        });
    });

    describe('ACHIEVEMENTS', () => {
        it('is a non-empty array', () => {
            expect(Array.isArray(ACHIEVEMENTS)).toBe(true);
            expect(ACHIEVEMENTS.length).toBeGreaterThan(0);
        });

        it('each achievement has required fields', () => {
            for (const a of ACHIEVEMENTS) {
                expect(a).toHaveProperty('id');
                expect(a).toHaveProperty('name');
                expect(a).toHaveProperty('desc');
                expect(a).toHaveProperty('icon');
                expect(typeof a.id).toBe('string');
                expect(typeof a.name).toBe('string');
            }
        });

        it('has no duplicate IDs', () => {
            const ids = ACHIEVEMENTS.map((a) => a.id);
            expect(new Set(ids).size).toBe(ids.length);
        });
    });
});
