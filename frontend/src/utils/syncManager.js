import { getUnsyncedEntries, markEntriesSynced } from '../storage/activityStore.js';

const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Fetch aggregated stats from the backend — single source of truth.
 * The backend recomputes totals, streaks, and achievements from DailyScore history.
 *
 * @param {string} userId
 * @param {string} token — JWT auth token
 * @returns {Promise<object|null>} aggregated stats or null on failure
 */
export async function fetchAggregatedStats(userId, token) {
    if (!userId || !token) return null;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return null;

    try {
        const res = await fetch(`${API_URL}/stats/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
            return await res.json();
        }
        console.warn('Failed to fetch aggregated stats:', res.status);
        return null;
    } catch (err) {
        console.warn('fetchAggregatedStats error:', err);
        return null;
    }
}

/**
 * Sync stats to backend after a solve.
 * Posts the stats and returns fresh aggregated stats from backend.
 *
 * @param {object} stats — current stats state
 * @param {string} token — JWT auth token
 * @returns {Promise<object|null>} fresh aggregated stats or null
 */
export async function syncStatsToBackend(stats, token) {
    if (!token) return null;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return null;

    try {
        const res = await fetch(`${API_URL}/stats/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ stats }),
        });
        if (res.ok) {
            return await res.json();
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Lazy-sync unsynced daily activity entries to the backend.
 * Returns fresh aggregated stats from the batch-sync response.
 *
 * @param {string} userId
 * @param {string} token — JWT auth token
 * @returns {Promise<{ synced: number, stats?: object } | null>}
 */
export async function syncDailyActivity(userId, token) {
    if (!userId || !token) return null;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return null;

    try {
        const unsynced = await getUnsyncedEntries(userId);
        if (!unsynced || unsynced.length === 0) return { synced: 0 };

        const entries = unsynced.map(e => ({
            date: e.date,
            puzzleType: e.puzzleType,
            points: e.score,
            timeSeconds: e.timeSeconds || 0,
            hintsUsed: e.hintsUsed || 0,
            noMistakes: e.noMistakes || false,
        }));

        const res = await fetch(`${API_URL}/stats/batch-sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ entries }),
        });

        if (res.ok) {
            const data = await res.json();
            const syncedDates = unsynced.map(e => e.date);
            await markEntriesSynced(userId, syncedDates);
            return { synced: data.synced || syncedDates.length, stats: data.stats || null };
        } else {
            console.warn('Batch sync failed with status:', res.status);
            return null;
        }
    } catch (err) {
        console.warn('Lazy sync failed (offline?):', err);
        return null;
    }
}
