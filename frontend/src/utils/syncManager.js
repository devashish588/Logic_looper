import { getUnsyncedEntries, markEntriesSynced } from '../storage/activityStore.js';

/**
 * Lazy-sync unsynced daily activity entries to the backend.
 * Only runs when the browser is online and we have valid credentials.
 *
 * @param {string} userId
 * @param {string} token — JWT auth token
 * @returns {Promise<{ synced: number } | null>}
 */
export async function syncDailyActivity(userId, token) {
    if (!userId || !token) return null;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return null;

    try {
        const unsynced = await getUnsyncedEntries(userId);
        if (!unsynced || unsynced.length === 0) return { synced: 0 };

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

        const entries = unsynced.map(e => ({
            date: e.date,
            puzzleType: e.puzzleType,
            points: e.score,
            timeSeconds: e.timeSeconds || 0,
            hintsUsed: e.hintsUsed || 0,
            noMistakes: e.noMistakes || false,
        }));

        const res = await fetch(`${apiUrl}/stats/batch-sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ entries }),
        });

        if (res.ok) {
            const data = await res.json();
            // Mark all synced entries
            const syncedDates = unsynced.map(e => e.date);
            await markEntriesSynced(userId, syncedDates);
            return { synced: data.synced || syncedDates.length };
        } else {
            console.warn('Batch sync failed with status:', res.status);
            return null;
        }
    } catch (err) {
        console.warn('Lazy sync failed (offline?):', err);
        return null;
    }
}
