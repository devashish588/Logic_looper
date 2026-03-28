import dayjs from 'dayjs';
import { calculateStreaks } from '../utils/streakCalculator.js';

describe('calculateStreaks', () => {
    it('returns { 0, 0 } for empty entries', () => {
        expect(calculateStreaks([])).toEqual({
            currentStreak: 0,
            longestStreak: 0,
        });
    });

    it('returns { 0, 0 } for null/undefined', () => {
        expect(calculateStreaks(null)).toEqual({
            currentStreak: 0,
            longestStreak: 0,
        });
        expect(calculateStreaks(undefined)).toEqual({
            currentStreak: 0,
            longestStreak: 0,
        });
    });

    it('returns { 0, 0 } when no entries are solved', () => {
        const entries = [
            { date: dayjs().format('YYYY-MM-DD'), solved: false },
        ];
        expect(calculateStreaks(entries)).toEqual({
            currentStreak: 0,
            longestStreak: 0,
        });
    });

    it('counts current streak including today', () => {
        const today = dayjs();
        const entries = [
            { date: today.subtract(2, 'day').format('YYYY-MM-DD'), solved: true },
            { date: today.subtract(1, 'day').format('YYYY-MM-DD'), solved: true },
            { date: today.format('YYYY-MM-DD'), solved: true },
        ];
        const result = calculateStreaks(entries);
        expect(result.currentStreak).toBe(3);
        expect(result.longestStreak).toBe(3);
    });

    it('counts current streak from yesterday if today not solved', () => {
        const today = dayjs();
        const entries = [
            { date: today.subtract(2, 'day').format('YYYY-MM-DD'), solved: true },
            { date: today.subtract(1, 'day').format('YYYY-MM-DD'), solved: true },
        ];
        const result = calculateStreaks(entries);
        expect(result.currentStreak).toBe(2);
    });

    it('resets streak on gap day', () => {
        const today = dayjs();
        const entries = [
            { date: today.subtract(4, 'day').format('YYYY-MM-DD'), solved: true },
            { date: today.subtract(3, 'day').format('YYYY-MM-DD'), solved: true },
            // gap on subtract(2)
            { date: today.subtract(1, 'day').format('YYYY-MM-DD'), solved: true },
            { date: today.format('YYYY-MM-DD'), solved: true },
        ];
        const result = calculateStreaks(entries);
        expect(result.currentStreak).toBe(2);
        expect(result.longestStreak).toBe(2);
    });

    it('finds longest streak even when current is shorter', () => {
        const today = dayjs();
        const entries = [
            // Old long streak
            { date: today.subtract(10, 'day').format('YYYY-MM-DD'), solved: true },
            { date: today.subtract(9, 'day').format('YYYY-MM-DD'), solved: true },
            { date: today.subtract(8, 'day').format('YYYY-MM-DD'), solved: true },
            { date: today.subtract(7, 'day').format('YYYY-MM-DD'), solved: true },
            { date: today.subtract(6, 'day').format('YYYY-MM-DD'), solved: true },
            // gap
            // Current short streak
            { date: today.subtract(1, 'day').format('YYYY-MM-DD'), solved: true },
            { date: today.format('YYYY-MM-DD'), solved: true },
        ];
        const result = calculateStreaks(entries);
        expect(result.currentStreak).toBe(2);
        expect(result.longestStreak).toBe(5);
    });

    it('handles single solved day', () => {
        const entries = [
            { date: dayjs().format('YYYY-MM-DD'), solved: true },
        ];
        const result = calculateStreaks(entries);
        expect(result.currentStreak).toBe(1);
        expect(result.longestStreak).toBe(1);
    });

    it('ignores unsolved entries in the middle', () => {
        const today = dayjs();
        const entries = [
            { date: today.subtract(2, 'day').format('YYYY-MM-DD'), solved: true },
            { date: today.subtract(1, 'day').format('YYYY-MM-DD'), solved: false },
            { date: today.format('YYYY-MM-DD'), solved: true },
        ];
        const result = calculateStreaks(entries);
        expect(result.currentStreak).toBe(1);
    });
});
