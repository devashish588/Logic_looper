import { createRng } from '../utils/seededRng.js';
import { generate, validate, getHint } from '../engine/types/patternMatch.js';

describe('patternMatch', () => {
    let rng;

    beforeEach(() => {
        rng = createRng('test-pattern-match');
    });

    describe('generate', () => {
        it('returns an object with type, rounds, and totalRounds', () => {
            const result = generate(rng);
            expect(result.type).toBe('patternMatch');
            expect(Array.isArray(result.rounds)).toBe(true);
            expect(result.totalRounds).toBe(result.rounds.length);
        });

        it('each round has sequence, options (4), and answerIndex', () => {
            const result = generate(rng);
            for (const round of result.rounds) {
                expect(Array.isArray(round.sequence)).toBe(true);
                expect(round.sequence.length).toBeGreaterThanOrEqual(4);
                expect(round.options).toHaveLength(4);
                expect(round.answerIndex).toBeGreaterThanOrEqual(0);
                expect(round.answerIndex).toBeLessThan(4);
            }
        });

        it('sequence elements have shape, color, and rotation', () => {
            const result = generate(rng);
            for (const elem of result.rounds[0].sequence) {
                expect(elem).toHaveProperty('shape');
                expect(elem).toHaveProperty('color');
                expect(elem).toHaveProperty('rotation');
            }
        });

        it('is deterministic', () => {
            const r1 = generate(createRng('det'));
            const r2 = generate(createRng('det'));
            expect(r1.rounds.length).toBe(r2.rounds.length);
            expect(r1.rounds[0].answerIndex).toBe(r2.rounds[0].answerIndex);
        });
    });

    describe('validate', () => {
        it('returns true when all answers match answerIndex', () => {
            const puzzle = generate(rng);
            const correctAnswers = puzzle.rounds.map((r) => r.answerIndex);
            expect(validate(correctAnswers, puzzle)).toBe(true);
        });

        it('returns false when any answer is wrong', () => {
            const puzzle = generate(rng);
            const wrongAnswers = puzzle.rounds.map(
                (r) => (r.answerIndex + 1) % 4,
            );
            expect(validate(wrongAnswers, puzzle)).toBe(false);
        });
    });

    describe('getHint', () => {
        it('returns eliminateIndex for a valid round', () => {
            const puzzle = generate(rng);
            const hint = getHint(puzzle, 0);
            expect(hint).toHaveProperty('eliminateIndex');
            expect(hint.eliminateIndex).not.toBe(puzzle.rounds[0].answerIndex);
        });

        it('returns null for out-of-bounds round', () => {
            const puzzle = generate(rng);
            expect(getHint(puzzle, 999)).toBeNull();
        });
    });
});
