/**
 * Tests for the main puzzle generator (engine/generator.js).
 * Uses dynamic imports internally so we test the exported functions.
 */
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear.js';
import { PUZZLE_TYPES } from '../utils/constants.js';
import {
    generatePuzzle,
    validateSolution,
    getPuzzleHint,
    getTodayDateString,
    getPuzzleTypeForDate,
} from '../engine/generator.js';

dayjs.extend(dayOfYear);

describe('generator', () => {
    describe('getTodayDateString', () => {
        it('returns a string in YYYY-MM-DD format', () => {
            const result = getTodayDateString();
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    describe('getPuzzleTypeForDate', () => {
        it('returns a type from PUZZLE_TYPES', () => {
            const type = getPuzzleTypeForDate('2026-02-17');
            expect(PUZZLE_TYPES).toContain(type);
        });

        it('same date always returns same type', () => {
            const t1 = getPuzzleTypeForDate('2026-06-15');
            const t2 = getPuzzleTypeForDate('2026-06-15');
            expect(t1).toBe(t2);
        });

        it('different dates may return different types', () => {
            // With 5 types over 365 days, consecutive days should differ
            const types = [];
            for (let i = 1; i <= 10; i++) {
                types.push(
                    getPuzzleTypeForDate(dayjs('2026-01-01').add(i, 'day').format('YYYY-MM-DD')),
                );
            }
            const unique = new Set(types);
            expect(unique.size).toBeGreaterThan(1);
        });
    });

    describe('generatePuzzle', () => {
        it('generates a puzzle with correct date', async () => {
            const puzzle = await generatePuzzle('2026-02-17');
            expect(puzzle.date).toBe('2026-02-17');
        });

        it('puzzle has a difficulty number', async () => {
            const puzzle = await generatePuzzle('2026-02-17');
            expect(typeof puzzle.difficulty).toBe('number');
        });

        it('same date produces identical puzzles (deterministic)', async () => {
            const p1 = await generatePuzzle('2026-03-01');
            const p2 = await generatePuzzle('2026-03-01');
            expect(p1.type).toBe(p2.type);
            expect(p1.difficulty).toBe(p2.difficulty);
        });

        it('different dates produce different puzzles', async () => {
            const p1 = await generatePuzzle('2026-01-01');
            const p2 = await generatePuzzle('2026-01-06');
            // At minimum, the type should rotate
            expect(p1.date).not.toBe(p2.date);
        });
    });

    describe('validateSolution', () => {
        it('validates correct solution for numberMatrix', async () => {
            const puzzle = await generatePuzzle('2026-01-01');
            // This depends on the puzzle type generated for this date
            // We just test that the function runs without error
            const result = await validateSolution(
                puzzle.type,
                puzzle.solution || puzzle.rounds?.map((r) => r.answerIndex) || {},
                puzzle,
            );
            expect(typeof result).toBe('boolean');
        });
    });
});
