import { getDB, ACTIVITY_STORE } from './db.js';
import { normalizeEntry, isBetterEntry } from '../utils/statsCalculator.js';

/**
 * Calculate heatmap intensity level (0-4) from a day's score.
 */
export function scoreToIntensity(score) {
    if (!score || score <= 0) return 0;
    if (score < 50) return 1;
    if (score < 80) return 2;
    if (score < 100) return 3;
    return 4;
}

function toRecord(userId, entry, synced) {
    return {
        userId,
        date: entry.date,
        solved: true,
        score: entry.points, // stored as `score` for compatibility with v1.0 records
        intensity: scoreToIntensity(entry.points),
        puzzleType: entry.puzzleType,
        timeSeconds: entry.timeSeconds,
        hintsUsed: entry.hintsUsed,
        mistakes: entry.mistakes,
        noMistakes: entry.noMistakes,
        solvedAt: entry.solvedAt,
        legacy: entry.legacy,
        // 0/1, not true/false: booleans are not valid IndexedDB keys, so boolean
        // records never appeared in the `by_synced` index (the old sync bug).
        synced: synced ? 1 : 0,
    };
}

/** Save one solve. Keeps the better entry if the day already has one. */
export async function saveDailyActivity(userId, rawEntry) {
    const entry = normalizeEntry(rawEntry);
    if (!userId || !entry) return null;
    const db = await getDB();
    const tx = db.transaction(ACTIVITY_STORE, 'readwrite');
    const existing = normalizeEntry(await tx.store.get([userId, entry.date]));
    let record = null;
    if (!existing || isBetterEntry(entry, existing)) {
        record = toRecord(userId, entry, false);
        await tx.store.put(record);
    }
    await tx.done;
    return record;
}

/**
 * Write many entries at once (used when merging server + local history).
 * Each entry: normalized entry plus `synced` boolean.
 */
export async function putActivityEntries(userId, entries) {
    if (!userId || !entries?.length) return;
    const db = await getDB();
    const tx = db.transaction(ACTIVITY_STORE, 'readwrite');
    for (const e of entries) {
        await tx.store.put(toRecord(userId, e, e.synced));
    }
    await tx.done;
}

/**
 * All raw activity records for a user, sorted by date ascending.
 */
export async function getDailyActivity(userId, startDate, endDate) {
    if (!userId) return [];
    const db = await getDB();
    let all = await db.getAllFromIndex(ACTIVITY_STORE, 'by_user', userId);
    if (startDate) all = all.filter(e => e.date >= startDate);
    if (endDate) all = all.filter(e => e.date <= endDate);
    return all.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Records not yet pushed to the backend. Filters in JS rather than via the
 * `by_synced` index so that v1.0 records (which stored `synced: false`, a
 * value IndexedDB cannot index) are found too.
 */
export async function getUnsyncedEntries(userId) {
    const all = await getDailyActivity(userId);
    return all.filter(e => !e.synced);
}

export async function markEntriesSynced(userId, dates) {
    if (!userId || !dates?.length) return;
    const db = await getDB();
    const tx = db.transaction(ACTIVITY_STORE, 'readwrite');
    for (const date of dates) {
        const record = await tx.store.get([userId, date]);
        if (record) {
            record.synced = 1;
            await tx.store.put(record);
        }
    }
    await tx.done;
}

export async function clearDailyActivity(userId) {
    if (!userId) return;
    const db = await getDB();
    const tx = db.transaction(ACTIVITY_STORE, 'readwrite');
    const keys = await tx.store.index('by_user').getAllKeys(userId);
    for (const key of keys) await tx.store.delete(key);
    await tx.done;
}
