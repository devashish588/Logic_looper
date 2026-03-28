/**
 * Tests for storage/db.js — user-scoped state persistence with compression.
 */
import { __resetMockDB } from '../../__mocks__/idb.js';
import {
    saveState,
    loadState,
    saveAllState,
    loadAllState,
} from '../storage/db.js';

describe('db', () => {
    beforeEach(() => {
        __resetMockDB();
    });

    describe('saveState / loadState', () => {
        it('round-trips a value correctly', async () => {
            const data = { streak: 5, points: 100 };
            await saveState('test-key', data);
            const loaded = await loadState('test-key');
            expect(loaded).toEqual(data);
        });

        it('returns null for a non-existent key', async () => {
            const result = await loadState('nonexistent');
            expect(result).toBeNull();
        });

        it('overwrites existing key', async () => {
            await saveState('key', { v: 1 });
            await saveState('key', { v: 2 });
            const result = await loadState('key');
            expect(result).toEqual({ v: 2 });
        });
    });

    describe('saveAllState / loadAllState', () => {
        it('saves and loads stats/settings scoped to userId', async () => {
            const stats = { totalSolved: 10, currentStreak: 3 };
            const settings = { theme: 'dark' };
            await saveAllState('user-123', stats, settings);

            const loaded = await loadAllState('user-123');
            expect(loaded.stats).toEqual(stats);
            expect(loaded.settings).toEqual(settings);
        });

        it('different users have separate state', async () => {
            await saveAllState('user-a', { s: 1 }, { t: 'a' });
            await saveAllState('user-b', { s: 2 }, { t: 'b' });

            const a = await loadAllState('user-a');
            const b = await loadAllState('user-b');
            expect(a.stats.s).toBe(1);
            expect(b.stats.s).toBe(2);
        });

        it('returns null stats/settings for unknown user', async () => {
            const loaded = await loadAllState('unknown');
            expect(loaded.stats).toBeNull();
            expect(loaded.settings).toBeNull();
        });

        it('does nothing when userId is null', async () => {
            await saveAllState(null, {}, {});
            const loaded = await loadAllState(null);
            expect(loaded).toEqual({ stats: null, settings: null });
        });
    });
});
