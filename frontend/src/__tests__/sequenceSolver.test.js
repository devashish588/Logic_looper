import { createRng } from '../utils/seededRng.js';
import { generate, validate, getHint } from '../engine/types/sequenceSolver.js';

describe('sequenceSolver', () => {
    let rng;

    beforeEach(() => {
        rng = createRng('test-sequence-solver');
    });

    describe('generate', () => {
        it('returns an object with type, rounds, and totalRounds', () => {
            const result = generate(rng);
            expect(result.type).toBe('sequenceSolver');
            expect(Array.isArray(result.rounds)).toBe(true);
            expect(result.totalRounds).toBe(result.rounds.length);
        });

        it('each round has sequence, blanks, ruleName, ruleLabel', () => {
            const result = generate(rng);
            for (const round of result.rounds) {
                expect(Array.isArray(round.sequence)).toBe(true);
                expect(round.sequence.length).toBeGreaterThanOrEqual(5);
                expect(Array.isArray(round.blanks)).toBe(true);
                expect(round.blanks.length).toBeGreaterThan(0);
                expect(typeof round.ruleName).toBe('string');
                expect(typeof round.ruleLabel).toBe('string');
            }
        });

        it('blanks are at valid indices (>= 2)', () => {
            const result = generate(rng);
            for (const round of result.rounds) {
                for (const blankIdx of round.blanks) {
                    expect(blankIdx).toBeGreaterThanOrEqual(2);
                    expect(blankIdx).toBeLessThan(round.sequence.length);
                }
            }
        });

        it('is deterministic', () => {
            const r1 = generate(createRng('det-seq'));
            const r2 = generate(createRng('det-seq'));
            expect(r1.rounds[0].sequence).toEqual(r2.rounds[0].sequence);
        });
    });

    describe('validate', () => {
        it('returns true for correct answers', () => {
            const puzzle = generate(rng);
            const answers = {};
            puzzle.rounds.forEach((round, ri) => {
                round.blanks.forEach((blankIdx, bi) => {
                    answers[`${ri}-${bi}`] = round.sequence[blankIdx];
                });
            });
            expect(validate(answers, puzzle)).toBe(true);
        });

        it('returns false for incorrect answers', () => {
            const puzzle = generate(rng);
            const answers = {};
            puzzle.rounds.forEach((round, ri) => {
                round.blanks.forEach((blankIdx, bi) => {
                    answers[`${ri}-${bi}`] = round.sequence[blankIdx] + 999;
                });
            });
            expect(validate(answers, puzzle)).toBe(false);
        });
    });

    describe('getHint', () => {
        it('returns ruleLabel and ruleName for a valid round', () => {
            const puzzle = generate(rng);
            const hint = getHint(puzzle, 0);
            expect(hint).toHaveProperty('ruleLabel');
            expect(hint).toHaveProperty('ruleName');
        });

        it('returns null for out-of-bounds round', () => {
            const puzzle = generate(rng);
            expect(getHint(puzzle, 999)).toBeNull();
        });
    });
});
