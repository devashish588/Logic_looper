import { openDB } from 'idb';

const DB_NAME = 'logic-looper';
const DB_VERSION = 2; // Bump from v1 to add daily_activity store
const ACTIVITY_STORE = 'daily_activity';

/**
 * Calculate intensity level (0-4) from score.
 */
export function scoreToIntensity(score) {
    if (!score || score <= 0) return 0;
    if (score < 50) return 1;
    if (score < 80) return 2;
    if (score < 100) return 3;
    return 4;
}

/**
 * Open (or upgrade) the database.
 * v2 adds the `daily_activity` object store alongside the existing `state` store.
 */
async function getDB() {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion) {
            // v1 → state store (keep if already exists)
            if (!db.objectStoreNames.contains('state')) {
                db.createObjectStore('state');
            }

            // v2 → daily_activity store
            if (oldVersion < 2) {
                const store = db.createObjectStore(ACTIVITY_STORE, {
                    keyPath: ['userId', 'date'],
                });
                store.createIndex('by_user', 'userId');
                store.createIndex('by_synced', ['userId', 'synced']);
            }
        },
    });
}

/**
 * Save a daily activity entry for a user.
 * @param {string} userId
 * @param {{ date: string, solved: boolean, score: number, puzzleType: string, timeSeconds?: number, hintsUsed?: number, noMistakes?: boolean }} entry
 */
export async function saveDailyActivity(userId, entry) {
    if (!userId || !entry?.date) return;
    const db = await getDB();
    const record = {
        userId,
        date: entry.date,
        solved: entry.solved ?? false,
        score: entry.score ?? 0,
        intensity: scoreToIntensity(entry.score),
        puzzleType: entry.puzzleType || '',
        timeSeconds: entry.timeSeconds ?? 0,
        hintsUsed: entry.hintsUsed ?? 0,
        noMistakes: entry.noMistakes ?? false,
        synced: false,
    };
    await db.put(ACTIVITY_STORE, record);
    return record;
}

/**
 * Get all daily activity entries for a user, optionally filtered by date range.
 * Returns entries sorted by date ascending.
 */
export async function getDailyActivity(userId, startDate, endDate) {
    if (!userId) return [];
    const db = await getDB();
    const all = await db.getAllFromIndex(ACTIVITY_STORE, 'by_user', userId);

    let filtered = all;
    if (startDate) {
        filtered = filtered.filter(e => e.date >= startDate);
    }
    if (endDate) {
        filtered = filtered.filter(e => e.date <= endDate);
    }

    return filtered.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get entries that have not been synced to the backend.
 */
export async function getUnsyncedEntries(userId) {
    if (!userId) return [];
    const db = await getDB();
    return db.getAllFromIndex(ACTIVITY_STORE, 'by_synced', [userId, 0]);
}

/**
 * Mark specific entries as synced after successful backend push.
 */
export async function markEntriesSynced(userId, dates) {
    if (!userId || !dates?.length) return;
    const db = await getDB();
    const tx = db.transaction(ACTIVITY_STORE, 'readwrite');

    for (const date of dates) {
        const key = [userId, date];
        const record = await tx.store.get(key);
        if (record) {
            record.synced = true;
            await tx.store.put(record);
        }
    }

    await tx.done;
}
