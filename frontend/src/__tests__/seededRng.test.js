import {
    hashSeed,
    createRng,
    shuffle,
    pickN,
    randInt,
} from '../utils/seededRng.js';

describe('seededRng', () => {
    describe('hashSeed', () => {
        it('returns a consistent hash for the same string', () => {
            expect(hashSeed('hello')).toBe(hashSeed('hello'));
        });

        it('returns different hashes for different strings', () => {
            expect(hashSeed('hello')).not.toBe(hashSeed('world'));
        });

        it('returns a non-negative number', () => {
            expect(hashSeed('test')).toBeGreaterThanOrEqual(0);
        });

        it('handles empty string', () => {
            expect(hashSeed('')).toBe(0);
        });
    });

    describe('createRng', () => {
        it('produces deterministic sequence from same string seed', () => {
            const rng1 = createRng('seed-2026-02-17');
            const rng2 = createRng('seed-2026-02-17');
            const seq1 = Array.from({ length: 10 }, () => rng1());
            const seq2 = Array.from({ length: 10 }, () => rng2());
            expect(seq1).toEqual(seq2);
        });

        it('produces different sequences for different seeds', () => {
            const rng1 = createRng('seed-a');
            const rng2 = createRng('seed-b');
            const seq1 = Array.from({ length: 5 }, () => rng1());
            const seq2 = Array.from({ length: 5 }, () => rng2());
            expect(seq1).not.toEqual(seq2);
        });

        it('produces values in [0, 1)', () => {
            const rng = createRng('bounds-test');
            for (let i = 0; i < 100; i++) {
                const v = rng();
                expect(v).toBeGreaterThanOrEqual(0);
                expect(v).toBeLessThan(1);
            }
        });

        it('accepts a numeric seed', () => {
            const rng = createRng(42);
            expect(typeof rng()).toBe('number');
        });
    });

    describe('shuffle', () => {
        it('returns the same array reference (in-place)', () => {
            const arr = [1, 2, 3, 4, 5];
            const rng = createRng('shuffle');
            const result = shuffle(arr, rng);
            expect(result).toBe(arr);
        });

        it('produces consistent permutation with same seed', () => {
            const rng1 = createRng('fixed');
            const rng2 = createRng('fixed');
            const a = shuffle([1, 2, 3, 4, 5], rng1);
            const b = shuffle([1, 2, 3, 4, 5], rng2);
            expect(a).toEqual(b);
        });

        it('preserves all elements', () => {
            const rng = createRng('perm');
            const arr = [10, 20, 30, 40, 50];
            shuffle(arr, rng);
            expect(arr.sort((a, b) => a - b)).toEqual([10, 20, 30, 40, 50]);
        });
    });

    describe('pickN', () => {
        it('returns N items', () => {
            const rng = createRng('pick');
            const result = pickN([1, 2, 3, 4, 5], 3, rng);
            expect(result).toHaveLength(3);
        });

        it('does not mutate the original array', () => {
            const rng = createRng('nomutate');
            const arr = [1, 2, 3, 4, 5];
            pickN(arr, 2, rng);
            expect(arr).toEqual([1, 2, 3, 4, 5]);
        });

        it('returns all items when n >= array length', () => {
            const rng = createRng('all');
            const result = pickN([1, 2], 5, rng);
            expect(result).toHaveLength(2);
        });
    });

    describe('randInt', () => {
        it('returns integers within [min, max]', () => {
            const rng = createRng('randInt');
            for (let i = 0; i < 50; i++) {
                const v = randInt(3, 7, rng);
                expect(v).toBeGreaterThanOrEqual(3);
                expect(v).toBeLessThanOrEqual(7);
                expect(Number.isInteger(v)).toBe(true);
            }
        });

        it('returns min when min === max', () => {
            const rng = createRng('eq');
            expect(randInt(5, 5, rng)).toBe(5);
        });
    });
});
