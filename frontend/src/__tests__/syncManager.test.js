/**
 * Tests for utils/syncManager.js
 * Mocks activityStore and fetch to test sync logic.
 */

// jest.mock is hoisted before imports, so declare mocks inline in the factory
jest.mock('../storage/activityStore.js', () => ({
    getUnsyncedEntries: jest.fn(),
    markEntriesSynced: jest.fn(),
}));

// Must import after jest.mock
import { syncDailyActivity } from '../utils/syncManager.js';
import { getUnsyncedEntries as mockGetUnsyncedEntries, markEntriesSynced as mockMarkEntriesSynced } from '../storage/activityStore.js';

describe('syncManager', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default: online
        Object.defineProperty(navigator, 'onLine', {
            value: true,
            writable: true,
            configurable: true,
        });
        global.fetch = jest.fn();
    });

    afterEach(() => {
        delete global.fetch;
    });

    it('returns null when userId is missing', async () => {
        const result = await syncDailyActivity(null, 'token');
        expect(result).toBeNull();
    });

    it('returns null when token is missing', async () => {
        const result = await syncDailyActivity('user-1', null);
        expect(result).toBeNull();
    });

    it('returns null when offline', async () => {
        Object.defineProperty(navigator, 'onLine', {
            value: false,
            configurable: true,
        });
        const result = await syncDailyActivity('user-1', 'token');
        expect(result).toBeNull();
    });

    it('returns { synced: 0 } when no unsynced entries', async () => {
        mockGetUnsyncedEntries.mockResolvedValue([]);
        const result = await syncDailyActivity('user-1', 'token');
        expect(result).toEqual({ synced: 0 });
    });

    it('skips sync when below batch threshold (5)', async () => {
        mockGetUnsyncedEntries.mockResolvedValue([
            { date: '2026-02-15', score: 80, puzzleType: 'a' },
            { date: '2026-02-16', score: 90, puzzleType: 'b' },
        ]);
        const result = await syncDailyActivity('user-1', 'token');
        expect(result).toEqual({ synced: 0, pending: 2 });
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('syncs when force=true even below threshold', async () => {
        const entries = [
            { date: '2026-02-15', score: 80, puzzleType: 'a', timeSeconds: 60, hintsUsed: 0, noMistakes: true },
        ];
        mockGetUnsyncedEntries.mockResolvedValue(entries);
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ synced: 1 }),
        });
        mockMarkEntriesSynced.mockResolvedValue();

        const result = await syncDailyActivity('user-1', 'token', { force: true });
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(mockMarkEntriesSynced).toHaveBeenCalledWith('user-1', ['2026-02-15']);
        expect(result.synced).toBe(1);
    });

    it('syncs when >= 5 entries without force', async () => {
        const entries = Array.from({ length: 5 }, (_, i) => ({
            date: `2026-02-${String(10 + i).padStart(2, '0')}`,
            score: 80 + i,
            puzzleType: 'a',
            timeSeconds: 60,
            hintsUsed: 0,
            noMistakes: false,
        }));
        mockGetUnsyncedEntries.mockResolvedValue(entries);
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ synced: 5 }),
        });
        mockMarkEntriesSynced.mockResolvedValue();

        const result = await syncDailyActivity('user-1', 'token');
        expect(global.fetch).toHaveBeenCalledTimes(1);

        // Check correct endpoint
        const [url, options] = global.fetch.mock.calls[0];
        expect(url).toContain('/stats/batch-sync');
        expect(options.method).toBe('POST');
        expect(options.headers.Authorization).toBe('Bearer token');

        expect(result.synced).toBe(5);
    });

    it('returns null on API failure', async () => {
        const entries = Array.from({ length: 5 }, (_, i) => ({
            date: `2026-02-${10 + i}`,
            score: 80,
            puzzleType: 'a',
        }));
        mockGetUnsyncedEntries.mockResolvedValue(entries);
        global.fetch.mockResolvedValue({ ok: false, status: 500 });

        const result = await syncDailyActivity('user-1', 'token');
        expect(result).toBeNull();
        expect(mockMarkEntriesSynced).not.toHaveBeenCalled();
    });

    it('returns null on network error', async () => {
        const entries = Array.from({ length: 5 }, (_, i) => ({
            date: `2026-02-${10 + i}`,
            score: 80,
            puzzleType: 'a',
        }));
        mockGetUnsyncedEntries.mockResolvedValue(entries);
        global.fetch.mockRejectedValue(new Error('Network error'));

        const result = await syncDailyActivity('user-1', 'token');
        expect(result).toBeNull();
    });
});
