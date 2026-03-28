/**
 * Tests for storage/activityStore.js
 */
import { __resetMockDB } from '../../__mocks__/idb.js';
import {
    scoreToIntensity,
    saveDailyActivity,
    getDailyActivity,
    getUnsyncedEntries,
    markEntriesSynced,
} from '../storage/activityStore.js';

describe('activityStore', () => {
    beforeEach(() => {
        __resetMockDB();
    });

    describe('scoreToIntensity', () => {
        it('returns 0 for null/undefined/0', () => {
            expect(scoreToIntensity(null)).toBe(0);
            expect(scoreToIntensity(undefined)).toBe(0);
            expect(scoreToIntensity(0)).toBe(0);
        });

        it('returns 0 for negative score', () => {
            expect(scoreToIntensity(-10)).toBe(0);
        });

        it('returns 1 for score < 50', () => {
            expect(scoreToIntensity(1)).toBe(1);
            expect(scoreToIntensity(49)).toBe(1);
        });

        it('returns 2 for score < 80', () => {
            expect(scoreToIntensity(50)).toBe(2);
            expect(scoreToIntensity(79)).toBe(2);
        });

        it('returns 3 for score < 100', () => {
            expect(scoreToIntensity(80)).toBe(3);
            expect(scoreToIntensity(99)).toBe(3);
        });

        it('returns 4 for score >= 100', () => {
            expect(scoreToIntensity(100)).toBe(4);
            expect(scoreToIntensity(500)).toBe(4);
        });
    });

    describe('saveDailyActivity', () => {
        it('saves an activity entry and returns the record', async () => {
            const entry = {
                date: '2026-02-17',
                solved: true,
                score: 85,
                puzzleType: 'numberMatrix',
                timeSeconds: 120,
                hintsUsed: 1,
                noMistakes: true,
            };
            const result = await saveDailyActivity('user-1', entry);
            expect(result).toBeTruthy();
            expect(result.userId).toBe('user-1');
            expect(result.date).toBe('2026-02-17');
            expect(result.solved).toBe(true);
            expect(result.score).toBe(85);
            expect(result.intensity).toBe(3); // 80-99 => 3
            expect(result.synced).toBe(false);
        });

        it('returns undefined for null userId', async () => {
            const result = await saveDailyActivity(null, { date: '2026-02-17' });
            expect(result).toBeUndefined();
        });

        it('returns undefined for null entry date', async () => {
            const result = await saveDailyActivity('user-1', { date: null });
            expect(result).toBeUndefined();
        });
    });

    describe('getDailyActivity', () => {
        it('returns empty array for null userId', async () => {
            const result = await getDailyActivity(null);
            expect(result).toEqual([]);
        });

        it('returns saved entries sorted by date', async () => {
            await saveDailyActivity('user-1', {
                date: '2026-02-15',
                solved: true,
                score: 90,
                puzzleType: 'a',
            });
            await saveDailyActivity('user-1', {
                date: '2026-02-17',
                solved: true,
                score: 70,
                puzzleType: 'b',
            });
            await saveDailyActivity('user-1', {
                date: '2026-02-16',
                solved: true,
                score: 80,
                puzzleType: 'c',
            });

            const result = await getDailyActivity('user-1');
            expect(result).toHaveLength(3);
            expect(result[0].date).toBe('2026-02-15');
            expect(result[1].date).toBe('2026-02-16');
            expect(result[2].date).toBe('2026-02-17');
        });

        it('filters by date range', async () => {
            await saveDailyActivity('user-1', {
                date: '2026-01-01',
                solved: true,
                score: 50,
                puzzleType: 'a',
            });
            await saveDailyActivity('user-1', {
                date: '2026-06-15',
                solved: true,
                score: 60,
                puzzleType: 'b',
            });
            await saveDailyActivity('user-1', {
                date: '2026-12-31',
                solved: true,
                score: 70,
                puzzleType: 'c',
            });

            const result = await getDailyActivity(
                'user-1',
                '2026-03-01',
                '2026-09-01',
            );
            expect(result).toHaveLength(1);
            expect(result[0].date).toBe('2026-06-15');
        });
    });

    describe('getUnsyncedEntries', () => {
        it('returns empty for null userId', async () => {
            expect(await getUnsyncedEntries(null)).toEqual([]);
        });
    });

    describe('markEntriesSynced', () => {
        it('does not throw for null userId', async () => {
            await expect(
                markEntriesSynced(null, ['2026-02-17']),
            ).resolves.toBeUndefined();
        });

        it('does not throw for empty dates', async () => {
            await expect(
                markEntriesSynced('user-1', []),
            ).resolves.toBeUndefined();
        });
    });
});
